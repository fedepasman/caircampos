-- ═══════════════════════════════════════════════════════════════════════════
-- Permisos de la Data API para las fotos de campos.
--
-- Desde 2026 una tabla nueva de public no se expone a la Data API sin un
-- GRANT explícito, y el generador de migraciones puede o no capturarlo según
-- el tipo de sentencia. No alcanza con mirar el archivo de schemas/ y asumir
-- que se aplicó: hay que verificarlo contra el catálogo real.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

select plan(5);

-- anon puede ver fotos (acotado por RLS a campos publicados y aprobados).
select ok(
  has_table_privilege('anon', 'public.campo_fotos', 'SELECT'),
  'anon debe poder hacer SELECT sobre public.campo_fotos'
);

-- anon no puede subir ni borrar fotos.
select ok(
  not has_table_privilege('anon', 'public.campo_fotos', 'INSERT')
    and not has_table_privilege('anon', 'public.campo_fotos', 'DELETE'),
  'anon no debe poder hacer INSERT ni DELETE sobre public.campo_fotos'
);

-- El socio autenticado administra fotos (acotado por RLS a sus propios
-- campos, ver el comportamiento probado más abajo).
select ok(
  has_table_privilege('authenticated', 'public.campo_fotos', 'INSERT')
    and has_table_privilege('authenticated', 'public.campo_fotos', 'UPDATE')
    and has_table_privilege('authenticated', 'public.campo_fotos', 'DELETE'),
  'authenticated debe poder INSERT/UPDATE/DELETE sobre public.campo_fotos'
);

-- Ni anon ni authenticated pueden vaciar la tabla ni tocar sus relaciones:
-- RLS controla filas, no privilegios de tabla completa.
select ok(
  not has_table_privilege('anon', 'public.campo_fotos', 'TRUNCATE')
    and not has_table_privilege('authenticated', 'public.campo_fotos', 'TRUNCATE'),
  'Ni anon ni authenticated deben poder hacer TRUNCATE sobre public.campo_fotos'
);

-- Las cinco políticas existen con los roles esperados: nadie las borró,
-- duplicó ni les cambió el alcance sin querer.
select set_eq(
  $$
    select policyname, roles::text
    from pg_policies
    where schemaname = 'public' and tablename = 'campo_fotos'
  $$,
  $$
    values
      ('Cualquiera ve las fotos de un campo publicado', '{anon}'),
      ('El socio ve las fotos de sus campos, o CAIR ve todas', '{authenticated}'),
      ('El socio administra las fotos de sus propios campos', '{authenticated}'),
      ('El socio reordena las fotos de sus propios campos', '{authenticated}'),
      ('El socio borra las fotos de sus propios campos', '{authenticated}')
  $$,
  'public.campo_fotos debe tener exactamente las cinco políticas esperadas, con sus roles'
);

select * from finish();

rollback;
