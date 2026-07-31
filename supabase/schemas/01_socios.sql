-- Socios de CAIR: inmobiliarias que publican campos.
--
-- Vincula un usuario de auth.users con su perfil de socio. El alta es manual
-- en Supabase Studio en esta etapa: no hay pantalla de registro todavía, así
-- que no hace falta política de INSERT (la service_role que usa Studio evade
-- RLS por diseño).

create table public.socios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references auth.users (id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

comment on table public.socios is
  'Inmobiliarias socias de CAIR que publican campos. Alta manual en Studio.';

-- FK y, además, columna que toda política de acá abajo compara contra
-- auth.uid(): sin este índice, cada chequeo de RLS sería un seq scan.
create index socios_usuario_id_idx on public.socios (usuario_id);

alter table public.socios enable row level security;

-- Una sola política de SELECT que combina los dos casos con OR, en vez de dos
-- políticas separadas: dos políticas permisivas para el mismo comando y rol
-- obligan a Postgres a evaluar ambas en cada consulta (advisor
-- `multiple_permissive_policies`). `(select auth.jwt())` va envuelto solo
-- alrededor de la llamada a la función, no de toda la cadena de `->`: es el
-- patrón que Postgres puede convertir en InitPlan (se ejecuta una vez, no por
-- fila) — envolver la expresión completa no lo logra igual.
create policy "El socio ve su propia fila, o CAIR ve todas"
  on public.socios
  for select
  to authenticated
  using (
    usuario_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
  );

create policy "El socio actualiza su propia fila"
  on public.socios
  for update
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

grant select on public.socios to authenticated;
grant update on public.socios to authenticated;

-- Ver el comentario en 00_extensions.sql: el privilegio por defecto de
-- Supabase le da TRUNCATE a cualquier rol sobre toda tabla nueva de public,
-- y RLS no lo cubre. Se revoca acá explícitamente además del cambio global,
-- por si esta tabla se creara antes de que el default surta efecto.
revoke truncate, references, trigger, maintain on public.socios from anon, authenticated;
