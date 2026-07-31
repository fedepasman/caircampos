ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES FROM authenticated;
CREATE TABLE public.campos (id uuid DEFAULT gen_random_uuid() NOT NULL, socio_id uuid NOT NULL, titulo text NOT NULL, hectareas numeric NOT NULL, provincia text NOT NULL, localidad text NOT NULL, latitud double precision NOT NULL, longitud double precision NOT NULL, ubicacion extensions.geography(Point,4326) GENERATED ALWAYS AS ((extensions.st_setsrid(extensions.st_makepoint(longitud, latitud), 4326))::extensions.geography) STORED, publicado boolean DEFAULT false NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.campos IS 'Campos publicados por los socios. ubicacion es columna generada desde latitud/longitud.';
ALTER TABLE public.campos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campos ADD CONSTRAINT campos_hectareas_check CHECK (hectareas > 0::numeric);
ALTER TABLE public.campos ADD CONSTRAINT campos_latitud_check CHECK (latitud >= '-90'::integer::double precision AND latitud <= 90::double precision);
ALTER TABLE public.campos ADD CONSTRAINT campos_longitud_check CHECK (longitud >= '-180'::integer::double precision AND longitud <= 180::double precision);
ALTER TABLE public.campos ADD CONSTRAINT campos_pkey PRIMARY KEY (id);
GRANT SELECT ON public.campos TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.campos TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.campos TO service_role;
CREATE INDEX campos_ubicacion_idx ON public.campos USING gist (ubicacion);
CREATE INDEX campos_publicado_idx ON public.campos (publicado) WHERE publicado = true;
CREATE INDEX campos_socio_id_idx ON public.campos (socio_id);
CREATE POLICY "Cualquiera ve los campos publicados" ON public.campos FOR SELECT TO anon USING ((publicado = true));
CREATE TABLE public.socios (id uuid DEFAULT gen_random_uuid() NOT NULL, usuario_id uuid NOT NULL, nombre text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE POLICY "El socio actualiza sus propios campos" ON public.campos FOR UPDATE TO authenticated USING ((socio_id IN ( SELECT socios.id
   FROM public.socios
  WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((socio_id IN ( SELECT socios.id
   FROM public.socios
  WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "El socio borra sus propios campos" ON public.campos FOR DELETE TO authenticated USING ((socio_id IN ( SELECT socios.id
   FROM public.socios
  WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "El socio publica sus propios campos" ON public.campos FOR INSERT TO authenticated WITH CHECK ((socio_id IN ( SELECT socios.id
   FROM public.socios
  WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "El socio ve sus campos, o CAIR ve todos" ON public.campos FOR SELECT TO authenticated USING (((publicado = true) OR (socio_id IN ( SELECT socios.id
   FROM public.socios
  WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'rol'::text) = 'admin'::text)));
COMMENT ON TABLE public.socios IS 'Inmobiliarias socias de CAIR que publican campos. Alta manual en Studio.';
ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socios ADD CONSTRAINT socios_pkey PRIMARY KEY (id);
ALTER TABLE public.campos ADD CONSTRAINT campos_socio_id_fkey FOREIGN KEY (socio_id) REFERENCES public.socios(id) ON DELETE CASCADE;
ALTER TABLE public.socios ADD CONSTRAINT socios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.socios ADD CONSTRAINT socios_usuario_id_key UNIQUE (usuario_id);
GRANT SELECT, UPDATE ON public.socios TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.socios TO service_role;
CREATE INDEX socios_usuario_id_idx ON public.socios (usuario_id);
CREATE POLICY "El socio actualiza su propia fila" ON public.socios FOR UPDATE TO authenticated USING ((usuario_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((usuario_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "El socio ve su propia fila, o CAIR ve todas" ON public.socios FOR SELECT TO authenticated USING (((usuario_id = ( SELECT auth.uid() AS uid)) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'rol'::text) = 'admin'::text)));
