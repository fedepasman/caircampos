COMMENT ON TABLE public.compradores IS 'Público general registrado para contactar socios. Alta de autoservicio. Sin acceso de CAIR a propósito.';
GRANT INSERT ON public.compradores TO authenticated;
CREATE POLICY "El comprador se registra a sí mismo" ON public.compradores FOR INSERT TO authenticated WITH CHECK ((usuario_id = ( SELECT auth.uid() AS uid)));
GRANT SELECT ON public.socios TO anon;
CREATE POLICY "Cualquiera ve el socio dueño de un campo publicado" ON public.socios FOR SELECT TO anon USING ((id IN ( SELECT campos.socio_id
   FROM public.campos
  WHERE (campos.publicado = true))));
