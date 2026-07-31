SET check_function_bodies = false;
CREATE FUNCTION private.resetear_revision_al_publicar()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.publicado and (tg_op = 'INSERT' or not old.publicado) then
    new.revisado_por_cair := 'pendiente';
  end if;
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION private.socio_tiene_campo_publicado(socio_id_a_verificar uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.campos
    where socio_id = socio_id_a_verificar
      and publicado = true
      and revisado_por_cair = 'aprobado'
  );
$function$;
CREATE FUNCTION public.moderar_campo(campo_id_a_moderar uuid, nuevo_estado text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
COMMENT ON FUNCTION public.moderar_campo(uuid,text) IS 'Aprueba, rechaza o vuelve a pendiente un campo. Solo callable por admin (chequeado adentro).';
-- El motor de diff descarta el REVOKE EXECUTE FROM PUBLIC al generar la
-- migración (mismo hallazgo que en 05_estadisticas_cair.sql y las funciones
-- de private/); se agrega a mano, confirmado con pg_proc.proacl.
REVOKE ALL ON FUNCTION public.moderar_campo(uuid, text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.moderar_campo(uuid, text) TO authenticated;
ALTER TABLE public.campos ADD COLUMN revisado_por_cair text DEFAULT 'pendiente'::text NOT NULL;
ALTER TABLE public.campos ADD CONSTRAINT campos_revisado_por_cair_check CHECK (revisado_por_cair = ANY (ARRAY['pendiente'::text, 'aprobado'::text, 'rechazado'::text]));
REVOKE INSERT, UPDATE ON public.campos FROM authenticated;
GRANT INSERT (descripcion, hectareas, latitud, localidad, longitud, provincia, publicado, socio_id, titulo) ON public.campos TO authenticated;
GRANT UPDATE (descripcion, hectareas, latitud, localidad, longitud, provincia, publicado, titulo) ON public.campos TO authenticated;
CREATE TRIGGER antes_de_guardar_campo BEFORE INSERT OR UPDATE ON public.campos FOR EACH ROW EXECUTE FUNCTION private.resetear_revision_al_publicar();
ALTER POLICY "Cualquiera ve los campos publicados" ON public.campos USING (((publicado = true) AND (revisado_por_cair = 'aprobado'::text)));
ALTER POLICY "El socio ve sus campos, o CAIR ve todos" ON public.campos USING ((((publicado = true) AND (revisado_por_cair = 'aprobado'::text)) OR (socio_id IN ( SELECT socios.id
   FROM public.socios
  WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'rol'::text) = 'admin'::text)));
ALTER POLICY "Cualquiera ve el socio dueño de un campo publicado" ON public.socios USING ((id IN ( SELECT campos.socio_id
   FROM public.campos
  WHERE ((campos.publicado = true) AND (campos.revisado_por_cair = 'aprobado'::text)))));
