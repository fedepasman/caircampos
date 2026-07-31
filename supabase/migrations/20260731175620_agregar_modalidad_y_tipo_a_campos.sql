ALTER TABLE public.campos ADD COLUMN modalidad text NOT NULL;
ALTER TABLE public.campos ADD CONSTRAINT campos_modalidad_check CHECK (modalidad = ANY (ARRAY['venta'::text, 'arrendamiento'::text]));
ALTER TABLE public.campos ADD COLUMN tipo_campo text NOT NULL;
ALTER TABLE public.campos ADD CONSTRAINT campos_tipo_campo_check CHECK (tipo_campo = ANY (ARRAY['agricola'::text, 'ganadero'::text, 'mixto'::text]));
REVOKE INSERT (descripcion, hectareas, latitud, localidad, longitud, provincia, publicado, socio_id, titulo) ON public.campos FROM authenticated;
REVOKE UPDATE (descripcion, hectareas, latitud, localidad, longitud, provincia, publicado, titulo) ON public.campos FROM authenticated;
GRANT INSERT (descripcion, hectareas, latitud, localidad, longitud, modalidad, provincia, publicado, socio_id, tipo_campo, titulo) ON public.campos TO authenticated;
GRANT UPDATE (descripcion, hectareas, latitud, localidad, longitud, modalidad, provincia, publicado, tipo_campo, titulo) ON public.campos TO authenticated;
