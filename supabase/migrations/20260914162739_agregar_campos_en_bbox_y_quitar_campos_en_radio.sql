SET check_function_bodies = false;
DROP FUNCTION public.campos_en_radio(centro_lat double precision, centro_lng double precision, radio_metros double precision);
CREATE FUNCTION public.campos_en_bbox(norte double precision, sur double precision, este double precision, oeste double precision)
 RETURNS SETOF public.campos
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select *
  from public.campos
  where extensions.st_intersects(
    ubicacion,
    extensions.st_makeenvelope(oeste, sur, este, norte, 4326)::extensions.geography
  );
$function$;
COMMENT ON FUNCTION public.campos_en_bbox(double precision,double precision,double precision,double precision) IS 'Campos dentro del bounding box (norte/sur/este/oeste) del viewport del mapa. RLS se aplica normal: no es security definer.';
-- El motor de diff descarta los REVOKE al generar la migración (ver el
-- comentario en supabase/schemas/02_campos.sql) — agregado a mano, la única
-- excepción real a "nunca editar una migración a mano" (CLAUDE.md sección 7).
REVOKE EXECUTE ON FUNCTION public.campos_en_bbox(double precision, double precision, double precision, double precision) FROM PUBLIC;
GRANT ALL ON FUNCTION public.campos_en_bbox(double precision, double precision, double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.campos_en_bbox(double precision, double precision, double precision, double precision) TO authenticated;
