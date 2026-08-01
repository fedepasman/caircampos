SET check_function_bodies = false;
CREATE FUNCTION public.campos_en_radio(centro_lat double precision, centro_lng double precision, radio_metros double precision)
 RETURNS SETOF public.campos
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select *
  from public.campos
  where extensions.st_dwithin(
    ubicacion,
    extensions.st_setsrid(extensions.st_makepoint(centro_lng, centro_lat), 4326)::extensions.geography,
    radio_metros
  );
$function$;
COMMENT ON FUNCTION public.campos_en_radio(double precision,double precision,double precision) IS 'Campos dentro de un radio (en metros) de un punto. RLS se aplica normal: no es security definer.';
GRANT EXECUTE ON FUNCTION public.campos_en_radio(double precision, double precision, double precision) TO anon;
GRANT EXECUTE ON FUNCTION public.campos_en_radio(double precision, double precision, double precision) TO authenticated;
