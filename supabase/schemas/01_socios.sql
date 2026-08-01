-- Socios de CAIR: inmobiliarias que publican campos.
--
-- Vincula opcionalmente un usuario de auth.users con su perfil de socio.
-- `usuario_id` es nullable a propósito: CAIR carga el directorio completo
-- de inmobiliarias (para el mapa de "Inmobiliarias Rurales") desde su
-- panel, muchas veces antes de que esa inmobiliaria tenga acceso propio al
-- sitio. El vínculo con un usuario real se agrega después, cuando esa
-- inmobiliaria vaya a autogestionar sus campos.

create table public.socios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique references auth.users (id) on delete cascade,
  nombre text not null,
  -- Identificador oficial de CAIR. Nullable: se puede cargar una
  -- inmobiliaria sin tenerlo a mano todavía. Column-level GRANT lo deja
  -- fuera del UPDATE de `authenticated` (ver más abajo) — es un dato que
  -- solo CAIR asigna, no algo que un socio deba poder autoeditarse si en el
  -- futuro se suma autogestión de perfil.
  nro_socio integer unique,
  telefono text,
  -- `not null default`: aunque provincia/localidad puedan quedar sin
  -- cargar todavía, el país casi siempre se sabe de entrada, y el default
  -- cubre sin backfill manual las filas ya existentes al agregar la
  -- columna.
  pais text not null default 'Argentina' check (pais in ('Argentina', 'Uruguay')),
  -- Nullable a propósito, mismo criterio que `campos.precio_usd`: CAIR
  -- puede cargar nombre y número antes de tener la ubicación exacta. El
  -- mapa público solo muestra los socios que sí tienen latitud/longitud.
  provincia text,
  localidad text,
  latitud double precision check (latitud between -90 and 90),
  longitud double precision check (longitud between -180 and 180),
  ubicacion extensions.geography(point, 4326)
    generated always as (
      case when latitud is not null and longitud is not null
        then extensions.st_setsrid(extensions.st_makepoint(longitud, latitud), 4326)::extensions.geography
      end
    ) stored,
  -- Permite a CAIR ocultar una inmobiliaria del directorio público sin
  -- borrar la fila (y sin perder sus campos, que cuelgan de este id).
  publicado boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.socios is
  'Inmobiliarias socias de CAIR. Alta y edición desde el panel de admin.';

-- FK y columna que toda política de acá abajo compara contra auth.uid():
-- sin este índice, cada chequeo de RLS sería un seq scan.
create index socios_usuario_id_idx on public.socios (usuario_id);

alter table public.socios enable row level security;

-- anon en política aparte: mezclarla con `authenticated` en un solo `to
-- anon, authenticated` rompería el acceso público apenas esa política
-- necesitara mirar algo que anon no tiene privilegio de leer.
create policy "Cualquiera ve los socios publicados"
  on public.socios
  for select
  to anon
  using (publicado = true);

create policy "El socio ve su fila, CAIR ve todas, o el resto ve publicadas"
  on public.socios
  for select
  to authenticated
  using (
    publicado = true
    or usuario_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
  );

-- Alta de inmobiliarias: solo CAIR, desde su panel. Ningún socio se da de
-- alta a sí mismo — coherente con que hoy tampoco hay autoregistro de
-- socios (a diferencia de los compradores).
create policy "CAIR da de alta inmobiliarias"
  on public.socios
  for insert
  to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin');

-- El socio actualiza su propia fila (una vez vinculado a un usuario), o
-- CAIR actualiza cualquiera desde su panel.
create policy "El socio o CAIR actualizan la fila"
  on public.socios
  for update
  to authenticated
  using (
    usuario_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
  )
  with check (
    usuario_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
  );

grant select on public.socios to anon, authenticated;

grant insert (
  nombre, nro_socio, telefono, pais, provincia, localidad, latitud, longitud, publicado, usuario_id
) on public.socios to authenticated;

-- `nro_socio` queda afuera de este UPDATE de columnas a propósito (ver el
-- comentario de la columna): solo se fija al insertar, o después vía
-- `public.asignar_numero_socio()`, que verifica el rol admin adentro.
grant update (
  nombre, telefono, pais, provincia, localidad, latitud, longitud, publicado, usuario_id
) on public.socios to authenticated;

-- Único camino para cambiar `nro_socio` después del alta. Vive en `public`
-- (no en `private`) porque el panel de admin la llama vía RPC desde el
-- cliente, mismo motivo que `public.moderar_campo()` (06_moderacion.sql).
create function public.asignar_numero_socio(socio_id_a_actualizar uuid, numero integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if ((select auth.jwt()) -> 'app_metadata' ->> 'rol') != 'admin' then
    raise exception 'No autorizado';
  end if;

  update public.socios
  set nro_socio = numero
  where id = socio_id_a_actualizar;
end;
$$;

comment on function public.asignar_numero_socio(uuid, integer) is
  'Fija o cambia el número de socio de una inmobiliaria. Solo callable por admin (chequeado adentro).';

-- El motor de `supabase db diff` descarta el REVOKE al generar la
-- migración (mismo hallazgo documentado en 06_moderacion.sql): hay que
-- agregarlo a mano en el archivo generado.
revoke execute on function public.asignar_numero_socio(uuid, integer) from public;
grant execute on function public.asignar_numero_socio(uuid, integer) to authenticated;

-- Ver el comentario en 00_extensions.sql: el privilegio por defecto de
-- Supabase le da TRUNCATE a cualquier rol sobre toda tabla nueva de public,
-- y RLS no lo cubre. Se revoca acá explícitamente además del cambio global,
-- por si esta tabla se creara antes de que el default surta efecto.
revoke truncate, references, trigger, maintain on public.socios from anon, authenticated;
