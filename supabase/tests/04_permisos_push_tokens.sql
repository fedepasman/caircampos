-- ═══════════════════════════════════════════════════════════════════════════
-- Permisos de la Data API para los tokens de push.
--
-- Mismo motivo que 03_permisos_campo_fotos.sql: verificar contra el
-- catálogo real, no asumir que lo que dice schemas/ quedó aplicado.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

select plan(4);

-- anon no tiene ningún acceso: los tokens de push son de un socio logueado.
select ok(
  not has_table_privilege('anon', 'public.push_tokens', 'SELECT')
    and not has_table_privilege('anon', 'public.push_tokens', 'INSERT')
    and not has_table_privilege('anon', 'public.push_tokens', 'DELETE'),
  'anon no debe tener ningún privilegio sobre public.push_tokens'
);

-- El socio autenticado registra y borra tokens (acotado por RLS a los
-- suyos). También necesita SELECT: PostgREST devuelve la fila afectada
-- después de un insert/upsert por defecto, y sin este privilegio esa
-- devolución falla con "permission denied" aunque el cliente no pida los
-- datos de vuelta — confirmado registrando un token real desde el móvil.
select ok(
  has_table_privilege('authenticated', 'public.push_tokens', 'SELECT')
    and has_table_privilege('authenticated', 'public.push_tokens', 'INSERT')
    and has_table_privilege('authenticated', 'public.push_tokens', 'DELETE'),
  'authenticated debe poder SELECT/INSERT/DELETE sobre public.push_tokens'
);

-- service_role no hereda privilegios de tabla por defecto en este proyecto:
-- enviar-notificacion-consulta necesita SELECT (leer tokens) y DELETE
-- (limpiar los que Expo marca como dispositivo desinstalado).
select ok(
  has_table_privilege('service_role', 'public.push_tokens', 'SELECT')
    and has_table_privilege('service_role', 'public.push_tokens', 'DELETE'),
  'service_role debe poder SELECT y DELETE sobre public.push_tokens'
);

-- Las tres políticas existen con los roles esperados.
select set_eq(
  $$
    select policyname, roles::text
    from pg_policies
    where schemaname = 'public' and tablename = 'push_tokens'
  $$,
  $$
    values
      ('El socio ve el token de su propio dispositivo', '{authenticated}'),
      ('El socio registra el token de su propio dispositivo', '{authenticated}'),
      ('El socio borra el token de su propio dispositivo', '{authenticated}')
  $$,
  'public.push_tokens debe tener exactamente las tres políticas esperadas, con sus roles'
);

select * from finish();

rollback;
