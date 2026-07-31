-- ═══════════════════════════════════════════════════════════════════════════
-- Permisos de compradores, consultas y la RPC de estadísticas.
--
-- La verificación de comportamiento real (que el socio vea su consulta, que
-- un tercero no vea nada, que la RPC solo devuelva datos a un JWT admin) se
-- hace aparte contra la API con tokens reales — eso es lo que de verdad
-- prueba que RLS filtra filas, no solo que el privilegio existe. Acá se
-- verifica la forma: privilegios de tabla/función y que las políticas
-- esperadas existen con el alcance correcto.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

select plan(10);

-- anon no toca ninguna de las dos tablas nuevas: ni compradores (dato
-- personal) ni consultas (el mecanismo de contacto en sí).
select ok(
  not has_table_privilege('anon', 'public.compradores', 'SELECT'),
  'anon no debe poder hacer SELECT sobre public.compradores'
);

select ok(
  not has_table_privilege('anon', 'public.consultas', 'SELECT'),
  'anon no debe poder hacer SELECT sobre public.consultas'
);

-- authenticated puede leer, actualizar e insertar su propia fila de
-- compradores (acotado por RLS): registro de autoservicio, no alta manual.
select ok(
  has_table_privilege('authenticated', 'public.compradores', 'SELECT')
    and has_table_privilege('authenticated', 'public.compradores', 'UPDATE')
    and has_table_privilege('authenticated', 'public.compradores', 'INSERT'),
  'authenticated debe poder SELECT/UPDATE/INSERT sobre public.compradores'
);

-- authenticated puede insertar y leer consultas (acotado por RLS a las
-- propias/las de sus campos), pero una consulta enviada es inmutable.
select ok(
  has_table_privilege('authenticated', 'public.consultas', 'SELECT')
    and has_table_privilege('authenticated', 'public.consultas', 'INSERT')
    and not has_table_privilege('authenticated', 'public.consultas', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.consultas', 'DELETE'),
  'authenticated debe poder SELECT/INSERT pero no UPDATE/DELETE sobre public.consultas'
);

-- anon nunca llega a la RPC de estadísticas.
select ok(
  not has_function_privilege('anon', 'public.estadisticas_consultas_por_campo()', 'EXECUTE'),
  'anon no debe poder ejecutar estadisticas_consultas_por_campo'
);

-- authenticated sí puede llamarla (el filtro de admin vive adentro del
-- cuerpo, no en el GRANT: ver 05_estadisticas_cair.sql).
select ok(
  has_function_privilege('authenticated', 'public.estadisticas_consultas_por_campo()', 'EXECUTE'),
  'authenticated debe poder ejecutar estadisticas_consultas_por_campo'
);

-- anon nunca llega a la función auxiliar que usa la política de compradores.
select ok(
  not has_function_privilege('anon', 'private.socio_ve_comprador(uuid)', 'EXECUTE'),
  'anon no debe poder ejecutar private.socio_ve_comprador'
);

-- authenticated sí, porque la política de SELECT de compradores la invoca
-- para el lado del socio.
select ok(
  has_function_privilege('authenticated', 'private.socio_ve_comprador(uuid)', 'EXECUTE'),
  'authenticated debe poder ejecutar private.socio_ve_comprador'
);

-- Las políticas de compradores existen con los roles esperados.
select set_eq(
  $$
    select policyname, roles::text
    from pg_policies
    where schemaname = 'public' and tablename = 'compradores'
  $$,
  $$
    values
      ('El comprador ve su fila, o el socio del campo consultado', '{authenticated}'),
      ('El comprador actualiza su propia fila', '{authenticated}'),
      ('El comprador se registra a sí mismo', '{authenticated}')
  $$,
  'public.compradores debe tener exactamente las tres políticas esperadas, con sus roles'
);

-- Las políticas de consultas existen con los roles esperados. Ninguna
-- política nombra a CAIR/admin — es a propósito, ver 04_consultas.sql.
select set_eq(
  $$
    select policyname, roles::text
    from pg_policies
    where schemaname = 'public' and tablename = 'consultas'
  $$,
  $$
    values
      ('El socio dueño o el comprador que la envió ven la consulta', '{authenticated}'),
      ('El comprador consulta sobre un campo publicado', '{authenticated}')
  $$,
  'public.consultas debe tener exactamente las dos políticas esperadas, sin ninguna para admin'
);

select * from finish();

rollback;
