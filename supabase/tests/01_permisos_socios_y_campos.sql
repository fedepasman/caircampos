-- ═══════════════════════════════════════════════════════════════════════════
-- Permisos de la Data API para socios y campos.
--
-- Desde 2026 una tabla nueva de public no se expone a la Data API sin un
-- GRANT explícito, y el generador de migraciones puede o no capturarlo según
-- el tipo de sentencia. No alcanza con mirar el archivo de schemas/ y asumir
-- que se aplicó: hay que verificarlo contra el catálogo real.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

select plan(17);

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

-- anon ve el directorio público de socios publicados ("Inmobiliarias
-- Rurales"), pero no puede escribir: el alta y la edición son de CAIR.
select ok(
  has_table_privilege('anon', 'public.socios', 'SELECT'),
  'anon debe poder hacer SELECT sobre public.socios'
);

select ok(
  not has_table_privilege('anon', 'public.socios', 'INSERT'),
  'anon no debe poder hacer INSERT sobre public.socios'
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

-- authenticated puede INSERT/UPDATE sobre socios (column-level, acotado
-- por RLS: solo CAIR puede dar de alta, un socio solo puede tocar su
-- propia fila), pero `nro_socio` queda afuera del UPDATE de columnas — es
-- de asignación exclusiva de CAIR, ver `public.asignar_numero_socio()`.
select ok(
  has_column_privilege('authenticated', 'public.socios', 'nombre', 'INSERT')
    and has_column_privilege('authenticated', 'public.socios', 'nombre', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.socios', 'nro_socio', 'UPDATE'),
  'authenticated debe poder INSERT/UPDATE sobre public.socios, pero no UPDATE directo de nro_socio'
);

-- `pais` es una columna nueva (país/provincia/localidad en cascada): debe
-- quedar en el mismo GRANT column-level que el resto de los datos de
-- ubicación, en las dos tablas.
select ok(
  has_column_privilege('authenticated', 'public.campos', 'pais', 'INSERT')
    and has_column_privilege('authenticated', 'public.campos', 'pais', 'UPDATE'),
  'authenticated debe poder INSERT/UPDATE sobre public.campos.pais'
);

select ok(
  has_column_privilege('authenticated', 'public.socios', 'pais', 'INSERT')
    and has_column_privilege('authenticated', 'public.socios', 'pais', 'UPDATE'),
  'authenticated debe poder INSERT/UPDATE sobre public.socios.pais'
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

-- Mismo patrón para la asignación de número de socio: anon nunca llega...
select ok(
  not has_function_privilege('anon', 'public.asignar_numero_socio(uuid, integer)', 'EXECUTE'),
  'anon no debe poder ejecutar public.asignar_numero_socio'
);

-- ...authenticated sí (el chequeo de rol admin vive adentro del cuerpo).
select ok(
  has_function_privilege('authenticated', 'public.asignar_numero_socio(uuid, integer)', 'EXECUTE'),
  'authenticated debe poder ejecutar public.asignar_numero_socio'
);

-- `campos_en_radio` no es security definer (RLS se aplica normal), así que
-- tanto anon como authenticated pueden ejecutarla — el filtro de a quién le
-- muestra qué sigue siendo enteramente cosa de las políticas de `campos`.
select ok(
  has_function_privilege(
    'anon', 'public.campos_en_radio(double precision, double precision, double precision)', 'EXECUTE'
  ),
  'anon debe poder ejecutar public.campos_en_radio'
);

select ok(
  has_function_privilege(
    'authenticated', 'public.campos_en_radio(double precision, double precision, double precision)', 'EXECUTE'
  ),
  'authenticated debe poder ejecutar public.campos_en_radio'
);

-- Las cinco políticas de campos existen con los roles esperados. No
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

-- Las políticas de socios existen con los roles esperados: directorio
-- público (anon), y alta/edición acotada a CAIR o a la propia fila
-- (authenticated).
select set_eq(
  $$
    select policyname, roles::text
    from pg_policies
    where schemaname = 'public' and tablename = 'socios'
  $$,
  $$
    values
      ('Cualquiera ve los socios publicados', '{anon}'),
      ('El socio ve su fila, CAIR ve todas, o el resto ve publicadas', '{authenticated}'),
      ('CAIR da de alta inmobiliarias', '{authenticated}'),
      ('El socio o CAIR actualizan la fila', '{authenticated}')
  $$,
  'public.socios debe tener exactamente las cuatro políticas esperadas, con sus roles'
);

select * from finish();

rollback;
