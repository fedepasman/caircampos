-- Tokens de push (Expo) de los dispositivos de un socio.
--
-- Un socio puede tener varios dispositivos (celular personal + de la
-- inmobiliaria, por ejemplo), así que es una tabla aparte y no una columna
-- en `socios`. El envío en sí no vive acá: lo dispara el trigger de
-- `04_consultas.sql` llamando a la Edge Function
-- `enviar-notificacion-consulta`, que lee esta tabla con `service_role`.

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios (id) on delete cascade,
  -- `unique`: el cliente inserta con `on conflict (token) do nothing`, así
  -- que un mismo dispositivo reintentando el registro (por ejemplo, en cada
  -- login) no duplica la fila. No cubre el caso de un dispositivo
  -- compartido que pasa de una cuenta de socio a otra — ese token quedaría
  -- apuntando al socio anterior hasta que se borre a mano. Es un caso raro
  -- para el uso real de la app (cada inmobiliaria usa su propio teléfono) y
  -- resolverlo bien requeriría una función que evada RLS a propósito; no
  -- vale la complejidad hasta que aparezca como un problema real.
  token text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.push_tokens is
  'Tokens de push de Expo por dispositivo de un socio. Los usa enviar-notificacion-consulta para avisar de consultas nuevas.';

-- FK y columna usada en las políticas de abajo.
create index push_tokens_socio_id_idx on public.push_tokens (socio_id);

alter table public.push_tokens enable row level security;

-- Hace falta también SELECT para authenticated, aunque el cliente nunca
-- pida leer sus tokens de vuelta: PostgREST devuelve la fila afectada
-- después de un insert/upsert por defecto, y sin privilegio de SELECT esa
-- devolución falla con "permission denied for table push_tokens" — se
-- confirmó probando el registro real desde el móvil, no es una suposición.
create policy "El socio ve el token de su propio dispositivo"
  on public.push_tokens
  for select
  to authenticated
  using (
    socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
  );

create policy "El socio registra el token de su propio dispositivo"
  on public.push_tokens
  for insert
  to authenticated
  with check (
    socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
  );

create policy "El socio borra el token de su propio dispositivo"
  on public.push_tokens
  for delete
  to authenticated
  using (
    socio_id in (select id from public.socios where usuario_id = (select auth.uid()))
  );

grant select, insert, delete on public.push_tokens to authenticated;

-- `service_role` no hereda privilegios de tabla por defecto en este
-- proyecto: la Edge Function `enviar-notificacion-consulta` lee los tokens
-- del socio y borra los que Expo reporta como dispositivo desinstalado.
grant select, delete on public.push_tokens to service_role;

revoke truncate, references, trigger, maintain on public.push_tokens from anon, authenticated;
