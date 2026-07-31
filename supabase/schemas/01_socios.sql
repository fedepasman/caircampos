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

-- Las políticas de SELECT (para `anon` y para `authenticated`) se crean en
-- 02_campos.sql, no acá: ambas necesitan mirar `campos` para saber qué
-- socio tiene al menos un campo publicado, y esa tabla todavía no existe en
-- este punto de la aplicación ordenada de los esquemas.

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
