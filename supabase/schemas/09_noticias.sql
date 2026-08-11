-- Noticias publicadas por CAIR en el sitio público.
--
-- A diferencia de socios/campos, acá no hace falta separar `anon` de
-- `authenticated` en la política de select: la condición extra para admin
-- solo lee auth.jwt() -> app_metadata, sin subquery a otra tabla protegida,
-- así que evalúa a `false` para anon sin pedirle un privilegio que no
-- tiene. Es la primera tabla del proyecto donde una sola política sirve
-- para los dos roles — no "corregir" separándola sin necesidad.
--
-- imagen_object_key es una columna directa (no una tabla aparte tipo
-- campo_fotos): una noticia tiene una sola portada opcional, no una
-- galería — no hay orden ni múltiples filas que administrar.

create table public.noticias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  -- Autogenerado del título en el admin (generarSlug de @cair/shared),
  -- editable a mano. El check de formato es la última línea de defensa,
  -- no la validación principal (esa vive en el esquema de Zod).
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  categoria text not null
    check (categoria in ('mercado', 'institucional', 'eventos', 'regulaciones', 'tecnologia')),
  -- Texto plano con párrafos separados por línea en blanco. Sin markdown
  -- ni HTML: se muestra escapado tal cual React lo interpola.
  cuerpo text not null,
  -- Ruta dentro del bucket de R2, no una URL completa — mismo criterio que
  -- campo_fotos.object_key. Nullable: la portada es opcional.
  imagen_object_key text,
  -- Fecha "editorial", no de auditoría: el admin la fija al hecho real
  -- aunque cargue la nota después. El listado público y la noticia
  -- destacada ordenan por esta columna, nunca por created_at.
  fecha_publicacion timestamptz not null default now(),
  -- Default false (a diferencia de socios.publicado): sin moderación
  -- externa porque el único autor es el propio admin, pero puede guardar
  -- un borrador en más de un paso antes de publicarlo.
  publicado boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.noticias is
  'Noticias publicadas por CAIR. Alta, edición y borrado únicamente desde el panel de admin.';

-- Sirve exactamente la consulta del listado público:
-- where publicado = true order by fecha_publicacion desc.
create index noticias_publicado_fecha_idx
  on public.noticias (fecha_publicacion desc) where publicado = true;

alter table public.noticias enable row level security;

create policy "Cualquiera ve las noticias publicadas, CAIR ve todas"
  on public.noticias
  for select
  to anon, authenticated
  using (
    publicado = true
    or ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
  );

create policy "CAIR da de alta noticias"
  on public.noticias
  for insert
  to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin');

create policy "CAIR edita las noticias"
  on public.noticias
  for update
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin');

create policy "CAIR borra las noticias"
  on public.noticias
  for delete
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin');

grant select on public.noticias to anon, authenticated;

-- Grant de tabla completa, no column-level: a diferencia de
-- campos.revisado_por_cair o socios.nro_socio, acá no hay ninguna columna
-- que proteger del propio escritor legítimo — RLS ya garantiza que solo un
-- admin llega a insert/update/delete, sobre cualquier columna.
grant insert, update, delete on public.noticias to authenticated;

revoke truncate, references, trigger, maintain on public.noticias from anon, authenticated;
