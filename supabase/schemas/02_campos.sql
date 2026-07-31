-- Campos publicados por los socios.
--
-- latitud/longitud son las columnas que consumen la web y el móvil para
-- pintar un pin en Mapbox directamente. `ubicacion` es una columna GENERADA
-- a partir de esas dos: no se mantiene a mano ni puede desincronizarse, y
-- existe para el filtro por zona geográfica del punto 5 del pliego, que
-- necesita el índice GIST de PostGIS en vez de comparar números sueltos.

create table public.campos (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios (id) on delete cascade,
  titulo text not null,
  hectareas numeric not null check (hectareas > 0),
  provincia text not null,
  localidad text not null,
  latitud double precision not null check (latitud between -90 and 90),
  longitud double precision not null check (longitud between -180 and 180),
  ubicacion extensions.geography(point, 4326)
    generated always as (
      extensions.st_setsrid(extensions.st_makepoint(longitud, latitud), 4326)::extensions.geography
    ) stored,
  publicado boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.campos is
  'Campos publicados por los socios. ubicacion es columna generada desde latitud/longitud.';

-- FK y columna usada en las políticas de abajo.
create index campos_socio_id_idx on public.campos (socio_id);

-- Búsqueda espacial futura (punto 5 del pliego: filtro por zona en el mapa).
create index campos_ubicacion_idx on public.campos using gist (ubicacion);

-- El filtro más común del listado público: solo los publicados.
create index campos_publicado_idx on public.campos (publicado) where publicado = true;

alter table public.campos enable row level security;

-- anon en una política aparte, sin tocar socios: aunque el resultado de una
-- subquery contra socios sería vacío para un usuario anónimo, Postgres igual
-- exige privilegio SELECT sobre esa tabla para poder evaluarla, y anon no lo
-- tiene (a propósito). Mezclarla en una sola política "to anon, authenticated"
-- rompería el acceso público con "permission denied for table socios".
create policy "Cualquiera ve los campos publicados"
  on public.campos
  for select
  to anon
  using (publicado = true);

-- Acá sí una sola política con OR para el resto de los casos: dos políticas
-- separadas para el mismo rol y comando forzarían a Postgres a evaluar ambas
-- en cada consulta (advisor `multiple_permissive_policies`). Por eso también
-- insert/update/delete van en políticas propias en vez de un `for all`: ese
-- incluye select, y volvería a superponerse con esta.
create policy "El socio ve sus campos, o CAIR ve todos"
  on public.campos
  for select
  to authenticated
  using (
    publicado = true
    or socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
    or ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
  );

create policy "El socio publica sus propios campos"
  on public.campos
  for insert
  to authenticated
  with check (
    socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
  );

create policy "El socio actualiza sus propios campos"
  on public.campos
  for update
  to authenticated
  using (
    socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
  )
  with check (
    socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
  );

create policy "El socio borra sus propios campos"
  on public.campos
  for delete
  to authenticated
  using (
    socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
  );

grant select on public.campos to anon, authenticated;
grant insert, update, delete on public.campos to authenticated;

-- Ver el comentario en 00_extensions.sql: revocado explícito además del
-- cambio global de privilegios por defecto.
revoke truncate, references, trigger, maintain on public.campos from anon, authenticated;
