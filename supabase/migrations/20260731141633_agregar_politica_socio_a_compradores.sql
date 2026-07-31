DROP POLICY "El comprador ve su propia fila" ON public.compradores;
CREATE POLICY "El comprador ve su fila, o el socio del campo consultado" ON public.compradores FOR SELECT TO authenticated USING (((usuario_id = ( SELECT auth.uid() AS uid)) OR (id IN ( SELECT co.comprador_id
   FROM ((public.consultas co
     JOIN public.campos c ON ((c.id = co.campo_id)))
     JOIN public.socios s ON ((s.id = c.socio_id)))
  WHERE (s.usuario_id = ( SELECT auth.uid() AS uid))))));
