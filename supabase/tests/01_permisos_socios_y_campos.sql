-- ═══════════════════════════════════════════════════════════════════════════
-- Permisos de la Data API para socios y campos.
--
-- Desde 2026 una tabla nueva de public no se expone a la Data API sin un
-- GRANT explícito, y el generador de migraciones puede o no capturarlo según
-- el tipo de sentencia. No alcanza con mirar el archivo de schemas/ y asumir
-- que se aplicó: hay que verificarlo contra el catálogo real.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

select plan(12);

-- anon puede ver campos publicados (la ficha pública)...
select ok(
  has_table_privilege('anon', 'public.campos', 'SELECT'),
  'anon debe poder hacer SELECT sobre public.campos'
);

-- ...pero no puede escribir.
select ok(
  not has_table_privilege('anon', 'public.campos', 'INSERT'),
  'anon no debe poder hacer INSERT sobre public.campos'
);

-- anon puede ver socios, acotado por RLS a los que tienen al menos un campo
-- publicado: la ficha pública de un campo muestra quién lo publicó.
select ok(
  has_table_privilege('anon', 'public.socios', 'SELECT'),
  'anon debe poder hacer SELECT sobre public.socios'
);

-- El socio autenticado administra sus propios campos. INSERT/UPDATE son
-- column-level (revisado_por_cair queda afuera, ver más abajo), así que
-- `has_table_privilege` no alcanza — solo ve privilegios de tabla entera.
select ok(
  has_column_privilege('authenticated', 'public.campos', 'titulo', 'INSERT')
    and has_column_privilege('authenticated', 'public.campos', 'titulo', 'UPDATE')
    and has_table_privilege('authenticated', 'public.campos', 'DELETE'),
  'authenticated debe poder INSERT/UPDATE/DELETE sobre public.campos (acotado por RLS a sus propios campos)'
);

-- El socio autenticado puede actualizar su propia fila de socios, pero el
-- alta es manual (Studio, service_role): sin política ni GRANT de INSERT.
select ok(
  has_table_privilege('authenticated', 'public.socios', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.socios', 'INSERT'),
  'authenticated debe poder UPDATE pero no INSERT sobre public.socios'
);

-- Un socio no puede aprobarse a sí mismo: `revisado_por_cair` queda afuera
-- del GRANT de columnas de UPDATE (02_campos.sql). El único camino para
-- cambiarla es `public.moderar_campo()`, chequeado abajo.
select ok(
  not has_column_privilege('authenticated', 'public.campos', 'revisado_por_cair', 'UPDATE'),
  'authenticated no debe poder hacer UPDATE directo de public.campos.revisado_por_cair'
);

-- anon nunca llega a la función de moderación.
select ok(
  not has_function_privilege('anon', 'public.moderar_campo(uuid, text)', 'EXECUTE'),
  'anon no debe poder ejecutar public.moderar_campo'
);

-- authenticated sí puede llamarla (el chequeo de rol admin vive adentro del
-- cuerpo, no en el GRANT: ver 06_moderacion.sql).
select ok(
  has_function_privilege('authenticated', 'public.moderar_campo(uuid, text)', 'EXECUTE'),
  'authenticated debe poder ejecutar public.moderar_campo'
);

-- anon nunca llega a la función auxiliar que usa la política de socios
-- para authenticated (rompe el ciclo de recursión con campos).
select ok(
  not has_function_privilege('anon', 'private.socio_tiene_campo_publicado(uuid)', 'EXECUTE'),
  'anon no debe poder ejecutar private.socio_tiene_campo_publicado'
);

-- authenticated sí, porque la política de SELECT de socios la invoca.
select ok(
  has_function_privilege('authenticated', 'private.socio_tiene_campo_publicado(uuid)', 'EXECUTE'),
  'authenticated debe poder ejecutar private.socio_tiene_campo_publicado'
);

-- Las cuatro políticas de campos existen con los roles esperados. No
-- verifica el contenido del USING (eso lo prueba el comportamiento, no la
-- forma) sino que nadie las borró, duplicó o les cambió el alcance sin
-- querer. Una sola política de SELECT (en vez de una por caso) es a
-- propósito: evita el advisor `multiple_permissive_policies`.
select set_eq(
  $$
    select policyname, roles::text
    from pg_policies
    where schemaname = 'public' and tablename = 'campos'
  $$,
  $$
    values
      ('Cualquiera ve los campos publicados', '{anon}'),
      ('El socio ve sus campos, o CAIR ve todos', '{authenticated}'),
      ('El socio publica sus propios campos', '{authenticated}'),
      ('El socio actualiza sus propios campos', '{authenticated}'),
      ('El socio borra sus propios campos', '{authenticated}')
  $$,
  'public.campos debe tener exactamente las cinco políticas esperadas, con sus roles'
);

-- Las políticas de socios existen con los roles esperados: la nueva de
-- anon, más las dos de authenticated que ya había.
select set_eq(
  $$
    select policyname, roles::text
    from pg_policies
    where schemaname = 'public' and tablename = 'socios'
  $$,
  $$
    values
      ('El socio ve su fila, CAIR ve todas, o el dueño publicado', '{authenticated}'),
      ('El socio actualiza su propia fila', '{authenticated}'),
      ('Cualquiera ve el socio dueño de un campo publicado', '{anon}')
  $$,
  'public.socios debe tener exactamente las tres políticas esperadas, con sus roles'
);

select * from finish();

rollback;
