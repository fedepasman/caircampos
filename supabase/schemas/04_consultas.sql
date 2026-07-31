-- Consultas: el contacto de un comprador por un campo.
--
-- El corazón del punto 9 del pliego: esta fila la ve el socio dueño del
-- campo y el comprador que la mandó. Nadie más — ni siquiera CAIR con una
-- política de "ve todos" como la que tienen socios/campos. El acceso
-- agregado de CAIR vive en 05_estadisticas_cair.sql, no acá.

create table public.consultas (
  id uuid primary key default gen_random_uuid(),
  campo_id uuid not null references public.campos (id) on delete cascade,
  comprador_id uuid not null references public.compradores (id) on delete cascade,
  mensaje text,
  created_at timestamptz not null default now()
);

comment on table public.consultas is
  'Contacto de un comprador por un campo. Solo la ve el socio dueño y el comprador que la envió — CAIR nunca. Ver 05_estadisticas_cair.sql.';

-- FK y columnas usadas en las políticas de abajo.
create index consultas_campo_id_idx on public.consultas (campo_id);
create index consultas_comprador_id_idx on public.consultas (comprador_id);

alter table public.consultas enable row level security;

create policy "El socio dueño o el comprador que la envió ven la consulta"
  on public.consultas
  for select
  to authenticated
  using (
    campo_id in (
      select c.id
      from public.campos c
      join public.socios s on s.id = c.socio_id
      where s.usuario_id = (select auth.uid())
    )
    or comprador_id in (select id from public.compradores where usuario_id = (select auth.uid()))
  );

-- El campo debe estar publicado: defensa adicional, no imprescindible (nadie
-- más puede leer la fila de todos modos) pero barata y evita registrar
-- consultas contra ids de campos que el comprador no debería conocer.
create policy "El comprador consulta sobre un campo publicado"
  on public.consultas
  for insert
  to authenticated
  with check (
    comprador_id in (select id from public.compradores where usuario_id = (select auth.uid()))
    and campo_id in (select id from public.campos where publicado = true)
  );

-- Sin update ni delete: una consulta enviada es un registro inmutable, igual
-- que un mensaje ya mandado.

grant select, insert on public.consultas to authenticated;
