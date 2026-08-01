SET check_function_bodies = false;
CREATE FUNCTION public.estadisticas_resumen_cair()
 RETURNS TABLE(campos_pendientes bigint, socios_vigentes bigint, campos_publicados bigint, consultas_mes_actual bigint, socios_nuevos_mes bigint, campos_nuevos_mes bigint, consultas_total bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    (select count(*) from public.campos where publicado and revisado_por_cair = 'pendiente'),
    (select count(*) from public.socios where publicado),
    (select count(*) from public.campos where publicado and revisado_por_cair = 'aprobado'),
    (select count(*) from public.consultas where created_at >= date_trunc('month', now())),
    (select count(*) from public.socios where created_at >= date_trunc('month', now())),
    (select count(*) from public.campos where created_at >= date_trunc('month', now())),
    (select count(*) from public.consultas)
  where ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin';
$function$;
COMMENT ON FUNCTION public.estadisticas_resumen_cair() IS 'Resumen agregado para el dashboard de CAIR. Nunca expone filas de consultas ni datos de compradores.';
REVOKE EXECUTE ON FUNCTION public.estadisticas_resumen_cair() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.estadisticas_resumen_cair() TO authenticated;
