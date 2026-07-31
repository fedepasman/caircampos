-- Fotos de un campo, almacenadas en Cloudflare R2.
--
-- `object_key` es la ruta dentro del bucket (`campos/{campo_id}/{uuid}-{nombre}`),
-- no una URL completa: la URL pública se arma en el cliente concatenando
-- `NEXT_PUBLIC_R2_PUBLIC_URL` (variable pública, es solo lectura) con esta
-- clave. Las credenciales de escritura de R2 nunca llegan al cliente — el
-- firmado de la URL de subida vive en la Edge Function
-- `supabase/functions/subir-foto-campo/`.

create table public.campo_fotos (
  id uuid primary key default gen_random_uuid(),
  campo_id uuid not null references public.campos (id) on delete cascade,
  object_key text not null,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.campo_fotos is
  'Fotos de un campo en Cloudflare R2. object_key es la ruta dentro del bucket, no una URL.';

-- FK y columna usada en las políticas de abajo.
create index campo_fotos_campo_id_idx on public.campo_fotos (campo_id);

alter table public.campo_fotos enable row level security;

-- anon en política aparte, mismo motivo que en 02_campos.sql: una subquery
-- contra `campos` exige privilegio SELECT sobre esa tabla, y mezclarla con
-- `authenticated` en una sola política rompería el acceso público.
create policy "Cualquiera ve las fotos de un campo publicado"
  on public.campo_fotos
  for select
  to anon
  using (
    campo_id in (
      select id from public.campos
      where publicado = true and revisado_por_cair = 'aprobado'
    )
  );

create policy "El socio ve las fotos de sus campos, o CAIR ve todas"
  on public.campo_fotos
  for select
  to authenticated
  using (
    campo_id in (
      select id from public.campos
      where (publicado = true and revisado_por_cair = 'aprobado')
        or socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
  );

-- Alta, edición de orden y borrado: solo sobre fotos de los propios campos.
-- No hay columna que proteger de un autoservicio indebido (a diferencia de
-- `campos.revisado_por_cair`), así que alcanza con RLS + GRANT de tabla
-- entera.
create policy "El socio administra las fotos de sus propios campos"
  on public.campo_fotos
  for insert
  to authenticated
  with check (
    campo_id in (
      select id from public.campos
      where socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
    )
  );

create policy "El socio reordena las fotos de sus propios campos"
  on public.campo_fotos
  for update
  to authenticated
  using (
    campo_id in (
      select id from public.campos
      where socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
    )
  )
  with check (
    campo_id in (
      select id from public.campos
      where socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
    )
  );

create policy "El socio borra las fotos de sus propios campos"
  on public.campo_fotos
  for delete
  to authenticated
  using (
    campo_id in (
      select id from public.campos
      where socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
    )
  );

grant select on public.campo_fotos to anon, authenticated;
grant insert, update, delete on public.campo_fotos to authenticated;

revoke truncate, references, trigger, maintain on public.campo_fotos from anon, authenticated;
