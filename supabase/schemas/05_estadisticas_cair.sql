-- Estadísticas agregadas para CAIR.
--
-- Postgres no tiene RLS a nivel de columna: una política de "select" que
-- dejara pasar a CAIR sobre public.consultas le permitiría, además del
-- agregado, pedir GET /consultas?select=nombre,telefono y leer el dato
-- personal completo. Column-level GRANT tampoco resuelve esto, porque
-- admin, socio y comprador comparten el mismo rol de Postgres
-- (`authenticated`) — se distinguen solo por el JWT.
--
-- La única forma correcta de dar "agregado sí, fila cruda no" es una función
-- SECURITY DEFINER que decide adentro:
--   1. Bypasea RLS para poder agregar sobre filas que quien pregunta no
--      puede ver una por una.
--   2. Nunca selecciona columnas con PII.
--   3. Verifica el rol DENTRO del cuerpo (vía app_metadata, nunca
--      user_metadata) y devuelve vacío si no es admin — el filtro de
--      autorización no depende de que solo el admin la llame.
--   4. EXECUTE revocado de PUBLIC/anon, otorgado solo a authenticated: la
--      verificación interna es la segunda capa, no la única.
--   5. search_path vacío y referencias completamente calificadas: mitiga
--      secuestro de search_path, el vector más común contra funciones
--      SECURITY DEFINER.
--
-- El guardrail de supabase/tests/00_guardrails_rls.sql que prohibía toda
-- función SECURITY DEFINER en public se afinó para esto: ahora solo prohíbe
-- las que anon puede ejecutar, que es el riesgo real.
create function public.estadisticas_consultas_por_campo()
returns table (
  campo_id uuid,
  titulo text,
  provincia text,
  localidad text,
  cantidad_consultas bigint
)
language sql
security definer
set search_path = ''
as $$
  select c.id, c.titulo, c.provincia, c.localidad, count(co.id)
  from public.campos c
  left join public.consultas co on co.campo_id = c.id
  where ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
  group by c.id, c.titulo, c.provincia, c.localidad;
$$;

comment on function public.estadisticas_consultas_por_campo() is
  'Agregado de consultas por campo para CAIR. Nunca expone filas de consultas ni datos de compradores.';

-- Postgres otorga EXECUTE a PUBLIC por defecto en toda función nueva (a
-- diferencia de las tablas, donde el default de Supabase ya viene sin
-- TRUNCATE para anon/authenticated). Sin este REVOKE, anon heredaría EXECUTE
-- de PUBLIC.
--
-- El motor de `supabase db diff` descarta esta sentencia al generar la
-- migración (confirmado corriendo db:reset y mirando pg_proc.proacl): hay
-- que agregarla a mano en la migración generada, la única excepción real a
-- "nunca editar una migración a mano" que anticipa CLAUDE.md sección 7.
revoke execute on function public.estadisticas_consultas_por_campo() from public;
grant execute on function public.estadisticas_consultas_por_campo() to authenticated;

-- Resumen para el dashboard de CAIR (landing del panel de admin). Mismo
-- criterio que la función de arriba: agregados solo, nunca una fila de
-- `consultas`. Una sola función para las siete métricas en vez de siete
-- queries sueltas — un solo lugar auditable para el chequeo de rol y el
-- bypass de RLS sobre `consultas`.
create function public.estadisticas_resumen_cair()
returns table (
  campos_pendientes bigint,
  socios_vigentes bigint,
  campos_publicados bigint,
  consultas_mes_actual bigint,
  socios_nuevos_mes bigint,
  campos_nuevos_mes bigint,
  consultas_total bigint
)
language sql
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.campos where publicado and revisado_por_cair = 'pendiente'),
    (select count(*) from public.socios where publicado),
    (select count(*) from public.campos where publicado and revisado_por_cair = 'aprobado'),
    (select count(*) from public.consultas where created_at >= date_trunc('month', now())),
    (select count(*) from public.socios where created_at >= date_trunc('month', now())),
    (select count(*) from public.campos where created_at >= date_trunc('month', now())),
    (select count(*) from public.consultas)
  where ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin';
$$;

comment on function public.estadisticas_resumen_cair() is
  'Resumen agregado para el dashboard de CAIR. Nunca expone filas de consultas ni datos de compradores.';

revoke execute on function public.estadisticas_resumen_cair() from public;
grant execute on function public.estadisticas_resumen_cair() to authenticated;
