-- ═══════════════════════════════════════════════════════════════════════════
-- Permisos de la Data API para socios y campos.
--
-- Desde 2026 una tabla nueva de public no se expone a la Data API sin un
-- GRANT explícito, y el generador de migraciones puede o no capturarlo según
-- el tipo de sentencia. No alcanza con mirar el archivo de schemas/ y asumir
-- que se aplicó: hay que verificarlo contra el catálogo real.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

select plan(6);

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

-- anon no tiene ningún acceso a socios: no hay ficha pública de la
-- inmobiliaria en esta etapa, solo de sus campos.
select ok(
  not has_table_privilege('anon', 'public.socios', 'SELECT'),
  'anon no debe poder hacer SELECT sobre public.socios'
);

-- El socio autenticado administra sus propios campos.
select ok(
  has_table_privilege('authenticated', 'public.campos', 'INSERT')
    and has_table_privilege('authenticated', 'public.campos', 'UPDATE')
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

select * from finish();

rollback;
