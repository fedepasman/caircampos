SET check_function_bodies = false;
DROP POLICY "El socio ve su propia fila, o CAIR ve todas" ON public.socios;
CREATE FUNCTION private.socio_tiene_campo_publicado(socio_id_a_verificar uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.campos
    where socio_id = socio_id_a_verificar and publicado = true
  );
$function$;
-- El motor de diff descarta el REVOKE EXECUTE FROM PUBLIC al generar la
-- migración (mismo hallazgo que en 05_estadisticas_cair.sql y
-- private.socio_ve_comprador); se agrega a mano, confirmado con
-- pg_proc.proacl.
REVOKE ALL ON FUNCTION private.socio_tiene_campo_publicado(uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION private.socio_tiene_campo_publicado(uuid) TO authenticated;
CREATE POLICY "El socio ve su fila, CAIR ve todas, o el dueño publicado" ON public.socios FOR SELECT TO authenticated USING (((usuario_id = ( SELECT auth.uid() AS uid)) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'rol'::text) = 'admin'::text) OR private.socio_tiene_campo_publicado(id)));
