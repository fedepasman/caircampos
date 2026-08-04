SET check_function_bodies = false;
CREATE FUNCTION private.notificar_nueva_consulta()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
COMMENT ON FUNCTION private.notificar_nueva_consulta() IS 'Avisa por push al socio dueño del campo cuando entra una consulta. Ver comentario arriba sobre vault.';
-- El motor de diff descarta este REVOKE al generar la migración (mismo gap
-- documentado en 00_extensions.sql): sin esto, PUBLIC (y por lo tanto
-- anon/authenticated) heredarían EXECUTE por el privilegio por defecto de
-- Postgres sobre una función nueva.
REVOKE EXECUTE ON FUNCTION private.notificar_nueva_consulta() FROM public;
CREATE TRIGGER trigger_notificar_nueva_consulta AFTER INSERT ON public.consultas FOR EACH ROW EXECUTE FUNCTION private.notificar_nueva_consulta();
CREATE TABLE public.push_tokens (id uuid DEFAULT gen_random_uuid() NOT NULL, socio_id uuid NOT NULL, token text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.push_tokens IS 'Tokens de push de Expo por dispositivo de un socio. Los usa enviar-notificacion-consulta para avisar de consultas nuevas.';
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ADD CONSTRAINT push_tokens_pkey PRIMARY KEY (id);
ALTER TABLE public.push_tokens ADD CONSTRAINT push_tokens_socio_id_fkey FOREIGN KEY (socio_id) REFERENCES public.socios(id) ON DELETE CASCADE;
ALTER TABLE public.push_tokens ADD CONSTRAINT push_tokens_token_key UNIQUE (token);
GRANT DELETE, INSERT ON public.push_tokens TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.push_tokens TO service_role;
-- El motor de diff descarta este REVOKE al generar la migración (mismo gap
-- documentado en 00_extensions.sql): sin esto, anon/authenticated quedan con
-- TRUNCATE/REFERENCES/TRIGGER/MAINTAIN por el privilegio por defecto de
-- Postgres sobre una tabla nueva.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.push_tokens FROM anon, authenticated;
CREATE INDEX push_tokens_socio_id_idx ON public.push_tokens (socio_id);
CREATE POLICY "El socio borra el token de su propio dispositivo" ON public.push_tokens FOR DELETE TO authenticated USING ((socio_id IN ( SELECT socios.id
   FROM public.socios
  WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "El socio registra el token de su propio dispositivo" ON public.push_tokens FOR INSERT TO authenticated WITH CHECK ((socio_id IN ( SELECT socios.id
   FROM public.socios
  WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))));
