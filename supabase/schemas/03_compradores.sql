-- Compradores: público general que se registra para contactar a un socio.
--
-- Mismo patrón que socios (01_socios.sql), con una diferencia deliberada:
-- SIN política que le dé acceso a CAIR. Es la asimetría central del punto 9
-- del pliego — socios son contrapartes de negocio que CAIR administra, pero
-- los datos de un comprador son exactamente lo que CAIR no puede ver.

create table public.compradores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references auth.users (id) on delete cascade,
  nombre text not null,
  apellido text not null,
  telefono text not null,
  created_at timestamptz not null default now()
);

comment on table public.compradores is
  'Público general registrado para contactar socios. Alta de autoservicio. Sin acceso de CAIR a propósito.';

-- FK y columna usada en las políticas de abajo.
create index compradores_usuario_id_idx on public.compradores (usuario_id);

alter table public.compradores enable row level security;

-- La política de SELECT (combinada con el acceso del socio dueño del campo
-- consultado) se crea en 04_consultas.sql, no acá: depende de la tabla
-- `consultas`, que todavía no existe en este punto de la aplicación
-- ordenada de los esquemas.

create policy "El comprador actualiza su propia fila"
  on public.compradores
  for update
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- Registro de autoservicio: un sitio público real no puede depender de que
-- alguien dé de alta a mano a cada visitante interesado en un campo. El
-- alta de socios sigue siendo manual (son las contrapartes de negocio que
-- CAIR administra); la de compradores no puede serlo.
create policy "El comprador se registra a sí mismo"
  on public.compradores
  for insert
  to authenticated
  with check (usuario_id = (select auth.uid()));

grant select, update, insert on public.compradores to authenticated;
