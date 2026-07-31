-- Moderación de campos por CAIR.
--
-- `revisado_por_cair` (02_campos.sql) queda fuera de los GRANT de
-- insert/update de `authenticated`: ningún socio puede escribirla directo
-- por la Data API. Esta función es el único camino para cambiarla, y vive
-- en `public` (no en `private`, a diferencia de las funciones auxiliares de
-- RLS) porque el panel de admin la llama vía RPC desde el cliente — mismo
-- motivo que `estadisticas_consultas_por_campo` (05_estadisticas_cair.sql).
create function public.moderar_campo(campo_id_a_moderar uuid, nuevo_estado text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Verificación de rol DENTRO del cuerpo, vía app_metadata (nunca
  -- user_metadata): la autorización no depende de que solo el admin llame
  -- a esta función, ni del GRANT de EXECUTE por sí solo.
  if ((select auth.jwt()) -> 'app_metadata' ->> 'rol') != 'admin' then
    raise exception 'No autorizado';
  end if;

  if nuevo_estado not in ('aprobado', 'rechazado', 'pendiente') then
    raise exception 'Estado inválido: %', nuevo_estado;
  end if;

  update public.campos
  set revisado_por_cair = nuevo_estado
  where id = campo_id_a_moderar;
end;
$$;

comment on function public.moderar_campo(uuid, text) is
  'Aprueba, rechaza o vuelve a pendiente un campo. Solo callable por admin (chequeado adentro).';

-- Postgres otorga EXECUTE a PUBLIC por defecto en toda función nueva. El
-- motor de `supabase db diff` descarta el REVOKE al generar la migración
-- (mismo hallazgo que en 05_estadisticas_cair.sql): hay que agregarlo a
-- mano en la migración generada, confirmado con pg_proc.proacl.
revoke execute on function public.moderar_campo(uuid, text) from public;
grant execute on function public.moderar_campo(uuid, text) to authenticated;
