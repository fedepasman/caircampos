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
  descripcion text,
  hectareas numeric not null check (hectareas > 0),
  -- Nullable a propósito: "precio a consultar" es un estado real del
  -- negocio inmobiliario rural, no un dato faltante.
  precio_usd numeric check (precio_usd is null or precio_usd > 0),
  provincia text not null,
  localidad text not null,
  modalidad text not null check (modalidad in ('venta', 'arrendamiento')),
  tipo_campo text not null check (tipo_campo in ('agricola', 'ganadero', 'mixto')),
  latitud double precision not null check (latitud between -90 and 90),
  longitud double precision not null check (longitud between -180 and 180),
  ubicacion extensions.geography(point, 4326)
    generated always as (
      extensions.st_setsrid(extensions.st_makepoint(longitud, latitud), 4326)::extensions.geography
    ) stored,
  publicado boolean not null default false,
  -- El socio pide publicar (`publicado = true`); CAIR aprueba o rechaza acá.
  -- Sin esto, `publicado` por sí solo pondría el campo en línea sin que CAIR
  -- interviniera — el pliego dice explícitamente que el admin "aprueba
  -- publicaciones". El trigger de más abajo la resetea a 'pendiente' cada
  -- vez que un campo pasa a `publicado = true`.
  revisado_por_cair text not null default 'pendiente'
    check (revisado_por_cair in ('pendiente', 'aprobado', 'rechazado')),
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
  using (publicado = true and revisado_por_cair = 'aprobado');

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
    (publicado = true and revisado_por_cair = 'aprobado')
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

-- Column-level, no de tabla completa: `revisado_por_cair` queda afuera de
-- las dos listas a propósito. Un `grant insert, update` de tabla entera le
-- daría a cualquier socio escritura sobre esa columna vía un PATCH directo
-- a la Data API, aunque el formulario nunca la muestre — se aprobaría a sí
-- mismo saltando la moderación de CAIR por completo. Solo cambia vía
-- `public.moderar_campo()` (06_moderacion.sql), que verifica el rol adentro.
grant insert (
  titulo, descripcion, hectareas, precio_usd, provincia, localidad, modalidad, tipo_campo,
  latitud, longitud, publicado, socio_id
) on public.campos to authenticated;

grant update (
  titulo, descripcion, hectareas, precio_usd, provincia, localidad, modalidad, tipo_campo,
  latitud, longitud, publicado
) on public.campos to authenticated;

grant delete on public.campos to authenticated;

-- Ver el comentario en 00_extensions.sql: revocado explícito además del
-- cambio global de privilegios por defecto.
revoke truncate, references, trigger, maintain on public.campos from anon, authenticated;

-- Política de SELECT de `socios` que depende de esta tabla: vive acá y no
-- en 01_socios.sql porque `campos` todavía no existe en ese punto de la
-- aplicación ordenada de los esquemas. La ficha pública de un campo
-- (apps/web/src/app/campos/[id]/page.tsx) necesita mostrar quién lo
-- publicó. Se acota a socios con al menos un campo publicado: no expone la
-- lista completa de socios, solo los que ya son visibles vía sus propios
-- campos. La única columna no trivial que esto expone es `usuario_id`, un
-- id opaco sin uso fuera de esta base.
create policy "Cualquiera ve el socio dueño de un campo publicado"
  on public.socios
  for select
  to anon
  using (
    id in (
      select socio_id from public.campos
      where publicado = true and revisado_por_cair = 'aprobado'
    )
  );

grant select on public.socios to anon;

-- Misma condición, política aparte para `authenticated`: un comprador
-- logueado (o cualquier otro usuario autenticado) tiene que poder ver el
-- mismo socio que ya podía ver sin loguearse — las políticas de Postgres se
-- evalúan por rol, y una política `to anon` no aplica una vez que la
-- sesión pasa a ser `authenticated`. Sin esto, la ficha pública rompe con
-- "Cannot read properties of null" apenas el visitante inicia sesión.
--
-- No puede ser una subquery directa como la de `anon`: la política de
-- SELECT de `campos` para `authenticated` ya mira `socios` (para saber si
-- el que pregunta es el dueño), así que una política de `socios` que
-- mirara `campos` de vuelta formaría un ciclo — Postgres lo rechaza en
-- tiempo de ejecución con "infinite recursion detected in policy for
-- relation socios" (42P17), reproducido probando la ficha pública con una
-- sesión real de comprador. SECURITY DEFINER rompe el ciclo: adentro de la
-- función, la lectura de `campos` corre con el rol dueño de la función
-- (bypasea RLS), así que no vuelve a disparar la política de `campos` que
-- mira `socios`.
create function private.socio_tiene_campo_publicado(socio_id_a_verificar uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campos
    where socio_id = socio_id_a_verificar
      and publicado = true
      and revisado_por_cair = 'aprobado'
  );
$$;

-- Igual que en 05_estadisticas_cair.sql y private.socio_ve_comprador:
-- Postgres otorga EXECUTE a PUBLIC por defecto en toda función nueva. El
-- motor de `supabase db diff` descarta el REVOKE al generar la migración —
-- hay que agregarlo a mano, confirmado con pg_proc.proacl.
revoke execute on function private.socio_tiene_campo_publicado(uuid) from public;
grant execute on function private.socio_tiene_campo_publicado(uuid) to authenticated;

create policy "El socio ve su fila, CAIR ve todas, o el dueño publicado"
  on public.socios
  for select
  to authenticated
  using (
    usuario_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
    or private.socio_tiene_campo_publicado(id)
  );

-- Cada vez que un campo pasa a `publicado = true` (alta nueva, o un
-- borrador/rechazado que el socio vuelve a mandar) vuelve a 'pendiente' —
-- así CAIR siempre revisa antes de que algo llegue al público, sin
-- depender de que el cliente (esta app, o cualquier otra a futuro) mande
-- el valor correcto. Si un campo ya aprobado se edita sin tocar
-- `publicado`, no se re-revisa: simplificación deliberada de esta pasada.
create function private.resetear_revision_al_publicar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.publicado and (tg_op = 'INSERT' or not old.publicado) then
    new.revisado_por_cair := 'pendiente';
  end if;
  return new;
end;
$$;

create trigger antes_de_guardar_campo
  before insert or update on public.campos
  for each row
  execute function private.resetear_revision_al_publicar();
