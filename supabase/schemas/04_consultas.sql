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

-- `service_role` no hereda privilegios de tabla por defecto en este
-- proyecto (a diferencia de RLS, que sí bypasea): la Edge Function
-- `enviar-notificacion-consulta` (más abajo) necesita leer la consulta sin
-- JWT de usuario detrás.
grant select on public.consultas to service_role;

-- Función auxiliar para la política de SELECT de `compradores` (abajo).
--
-- No puede ser una subquery directa dentro de la política, como en el resto
-- del proyecto: `compradores` necesita mirar `consultas` para saber si el
-- socio es dueño del campo consultado, pero la política de SELECT de
-- `consultas` (arriba) ya mira `compradores` para el lado del comprador. Dos
-- políticas que se referencian una a la otra forman un ciclo, y Postgres lo
-- rechaza en tiempo de ejecución con "infinite recursion detected in policy
-- for relation compradores" (42P17) — se reprodujo probando el panel de
-- socios con una sesión real, no algo hipotético.
--
-- SECURITY DEFINER rompe el ciclo: adentro de la función, la lectura de
-- `consultas`/`campos`/`socios` corre con el rol dueño de la función
-- (bypasea RLS), así que no vuelve a disparar la política de `consultas` que
-- mira `compradores`. Vive en el esquema `private`, no en `public`: a
-- diferencia de `estadisticas_consultas_por_campo` (05_estadisticas_cair.sql),
-- esta función nunca necesita exponerse vía RPC — solo la llama una política.
create function private.socio_ve_comprador(comprador_id_a_verificar uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.consultas co
    join public.campos c on c.id = co.campo_id
    join public.socios s on s.id = c.socio_id
    where co.comprador_id = comprador_id_a_verificar
      and s.usuario_id = auth.uid()
  );
$$;

-- Igual que en 05_estadisticas_cair.sql: Postgres otorga EXECUTE a PUBLIC por
-- defecto en toda función nueva. Sin este REVOKE, anon heredaría EXECUTE de
-- PUBLIC. El motor de `supabase db diff` descarta esta sentencia al generar
-- la migración (confirmado en la pasada anterior con la RPC de estadísticas):
-- hay que agregarla a mano en la migración generada.
revoke execute on function private.socio_ve_comprador(uuid) from public;
grant execute on function private.socio_ve_comprador(uuid) to authenticated;

-- Política de SELECT de `compradores` que depende de esta tabla: vive acá y
-- no en 03_compradores.sql porque `consultas` todavía no existe en ese punto
-- de la aplicación ordenada de los esquemas. Es una sola política combinada
-- por rol+comando (no dos superpuestas), mismo criterio que ya se usó en
-- 02_campos.sql para evitar el advisor `multiple_permissive_policies`: el
-- comprador ve su propia fila, y el socio dueño del campo consultado ve los
-- datos de contacto del comprador que lo consultó — el paso previo
-- imprescindible para que el panel de socios pueda mostrar "consultas
-- recibidas" con nombre y teléfono, no solo el mensaje.
create policy "El comprador ve su fila, o el socio del campo consultado"
  on public.compradores
  for select
  to authenticated
  using (
    usuario_id = (select auth.uid())
    or private.socio_ve_comprador(id)
  );

-- Aviso push al socio cuando entra una consulta nueva.
--
-- La URL de la Edge Function y el secreto compartido (para que la función
-- confirme que la llamada viene de este trigger y no de cualquiera en
-- internet, ya que corre con `verify_jwt = false` al no haber un usuario
-- logueado detrás) NO se hardcodean acá: cambian entre entornos (local vs.
-- producción) y no son parte del estado declarativo del esquema. Se leen de
-- `vault.decrypted_secrets` por nombre — Supabase Vault es el mecanismo
-- pensado para esto; un GUC vía `alter database ... set` no es una opción,
-- el rol de las migraciones no tiene permiso para fijarlo (confirmado
-- probando contra la base local). Los valores se cargan una sola vez por
-- entorno con `vault.create_secret(valor, nombre)`, nunca en un archivo de
-- este repositorio — ver OPERACIONES.md para el valor de producción.
create function private.notificar_nueva_consulta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_socio_id uuid;
  v_url text;
  v_secreto text;
begin
  select s.id into v_socio_id
  from public.campos c
  join public.socios s on s.id = c.socio_id
  where c.id = new.campo_id;

  if v_socio_id is null then
    return new;
  end if;

  select decrypted_secret into v_url
  from vault.decrypted_secrets where name = 'edge_functions_base_url';

  select decrypted_secret into v_secreto
  from vault.decrypted_secrets where name = 'internal_trigger_secret';

  if v_url is null or v_secreto is null then
    return new;
  end if;

  -- Asíncrono (`net.http_post` solo encola la request): el insert de la
  -- consulta no espera a que el push se mande ni falla si la Edge Function
  -- está caída.
  perform net.http_post(
    url := v_url || '/enviar-notificacion-consulta',
    body := jsonb_build_object('consulta_id', new.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Secret', v_secreto
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

comment on function private.notificar_nueva_consulta() is
  'Avisa por push al socio dueño del campo cuando entra una consulta. Ver comentario arriba sobre vault.';

-- Mismo motivo que private.socio_ve_comprador(uuid) más arriba: revocar
-- EXECUTE de PUBLIC. El motor de diff descarta este REVOKE al generar la
-- migración — agregarlo a mano.
revoke execute on function private.notificar_nueva_consulta() from public;

create trigger trigger_notificar_nueva_consulta
  after insert on public.consultas
  for each row execute function private.notificar_nueva_consulta();
