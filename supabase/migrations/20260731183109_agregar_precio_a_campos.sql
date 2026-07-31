ALTER TABLE public.campos ADD COLUMN precio_usd numeric;
ALTER TABLE public.campos ADD CONSTRAINT campos_precio_usd_check CHECK (precio_usd IS NULL OR precio_usd > 0::numeric);
REVOKE INSERT (descripcion, hectareas, latitud, localidad, longitud, modalidad, provincia, publicado, socio_id, tipo_campo, titulo) ON public.campos FROM authenticated;
REVOKE UPDATE (descripcion, hectareas, latitud, localidad, longitud, modalidad, provincia, publicado, tipo_campo, titulo) ON public.campos FROM authenticated;
GRANT INSERT (descripcion, hectareas, latitud, localidad, longitud, modalidad, precio_usd, provincia, publicado, socio_id, tipo_campo, titulo) ON public.campos TO authenticated;
GRANT UPDATE (descripcion, hectareas, latitud, localidad, longitud, modalidad, precio_usd, provincia, publicado, tipo_campo, titulo) ON public.campos TO authenticated;
