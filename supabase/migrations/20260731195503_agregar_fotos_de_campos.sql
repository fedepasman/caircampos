CREATE TABLE public.campo_fotos (id uuid DEFAULT gen_random_uuid() NOT NULL, campo_id uuid NOT NULL, object_key text NOT NULL, orden integer DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.campo_fotos IS 'Fotos de un campo en Cloudflare R2. object_key es la ruta dentro del bucket, no una URL.';
ALTER TABLE public.campo_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campo_fotos ADD CONSTRAINT campo_fotos_campo_id_fkey FOREIGN KEY (campo_id) REFERENCES public.campos(id) ON DELETE CASCADE;
ALTER TABLE public.campo_fotos ADD CONSTRAINT campo_fotos_pkey PRIMARY KEY (id);
GRANT SELECT ON public.campo_fotos TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.campo_fotos TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.campo_fotos TO service_role;
-- El motor de diff descarta este REVOKE al generar la migración (mismo gap
-- documentado en 00_extensions.sql): sin esto, anon/authenticated quedan con
-- TRUNCATE/REFERENCES/TRIGGER/MAINTAIN por el privilegio por defecto de
-- Postgres sobre una tabla nueva.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.campo_fotos FROM anon, authenticated;
CREATE INDEX campo_fotos_campo_id_idx ON public.campo_fotos (campo_id);
CREATE POLICY "Cualquiera ve las fotos de un campo publicado" ON public.campo_fotos FOR SELECT TO anon USING ((campo_id IN ( SELECT campos.id
   FROM public.campos
  WHERE ((campos.publicado = true) AND (campos.revisado_por_cair = 'aprobado'::text)))));
CREATE POLICY "El socio administra las fotos de sus propios campos" ON public.campo_fotos FOR INSERT TO authenticated WITH CHECK ((campo_id IN ( SELECT campos.id
   FROM public.campos
  WHERE (campos.socio_id IN ( SELECT socios.id
           FROM public.socios
          WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "El socio borra las fotos de sus propios campos" ON public.campo_fotos FOR DELETE TO authenticated USING ((campo_id IN ( SELECT campos.id
   FROM public.campos
  WHERE (campos.socio_id IN ( SELECT socios.id
           FROM public.socios
          WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "El socio reordena las fotos de sus propios campos" ON public.campo_fotos FOR UPDATE TO authenticated USING ((campo_id IN ( SELECT campos.id
   FROM public.campos
  WHERE (campos.socio_id IN ( SELECT socios.id
           FROM public.socios
          WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((campo_id IN ( SELECT campos.id
   FROM public.campos
  WHERE (campos.socio_id IN ( SELECT socios.id
           FROM public.socios
          WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "El socio ve las fotos de sus campos, o CAIR ve todas" ON public.campo_fotos FOR SELECT TO authenticated USING (((campo_id IN ( SELECT campos.id
   FROM public.campos
  WHERE (((campos.publicado = true) AND (campos.revisado_por_cair = 'aprobado'::text)) OR (campos.socio_id IN ( SELECT socios.id
           FROM public.socios
          WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid))))))) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'rol'::text) = 'admin'::text)));
