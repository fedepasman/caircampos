GRANT SELECT ON public.push_tokens TO authenticated;
CREATE POLICY "El socio ve el token de su propio dispositivo" ON public.push_tokens FOR SELECT TO authenticated USING ((socio_id IN ( SELECT socios.id
   FROM public.socios
  WHERE (socios.usuario_id = ( SELECT auth.uid() AS uid)))));
