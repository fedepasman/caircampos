SET check_function_bodies = false;
CREATE FUNCTION public.estadisticas_consultas_por_campo()
 RETURNS TABLE(campo_id uuid, titulo text, provincia text, localidad text, cantidad_consultas bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select c.id, c.titulo, c.provincia, c.localidad, count(co.id)
  from public.campos c
  left join public.consultas co on co.campo_id = c.id
  where ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
  group by c.id, c.titulo, c.provincia, c.localidad;
$function$;
COMMENT ON FUNCTION public.estadisticas_consultas_por_campo() IS 'Agregado de consultas por campo para CAIR. Nunca expone filas de consultas ni datos de compradores.';

-- Editado a mano: Postgres otorga EXECUTE a PUBLIC por defecto en toda
-- función nueva, y el motor de `supabase db diff` descarta esta sentencia al
-- generar la migración (a diferencia de los GRANT de tabla, que sí captura).
-- Sin este REVOKE, `anon` heredaría EXECUTE de PUBLIC y podría llamar a esta
-- función directamente — el `where` interno la dejaría sin filas, pero es
-- mejor no depender solo de esa segunda capa. Confirmado con
-- `select proacl from pg_proc` después de un db:reset: sin esto, la columna
-- mostraba `=X/postgres` (PUBLIC con EXECUTE).
REVOKE EXECUTE ON FUNCTION public.estadisticas_consultas_por_campo() FROM PUBLIC;
GRANT ALL ON FUNCTION public.estadisticas_consultas_por_campo() TO authenticated;
CREATE TABLE public.compradores (id uuid DEFAULT gen_random_uuid() NOT NULL, usuario_id uuid NOT NULL, nombre text NOT NULL, apellido text NOT NULL, telefono text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.compradores IS 'Público general registrado para contactar socios. Alta manual en Studio. Sin acceso de CAIR a propósito.';
ALTER TABLE public.compradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compradores ADD CONSTRAINT compradores_pkey PRIMARY KEY (id);
ALTER TABLE public.compradores ADD CONSTRAINT compradores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.compradores ADD CONSTRAINT compradores_usuario_id_key UNIQUE (usuario_id);
GRANT SELECT, UPDATE ON public.compradores TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.compradores TO service_role;
CREATE INDEX compradores_usuario_id_idx ON public.compradores (usuario_id);
CREATE POLICY "El comprador actualiza su propia fila" ON public.compradores FOR UPDATE TO authenticated USING ((usuario_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((usuario_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "El comprador ve su propia fila" ON public.compradores FOR SELECT TO authenticated USING ((usuario_id = ( SELECT auth.uid() AS uid)));
CREATE TABLE public.consultas (id uuid DEFAULT gen_random_uuid() NOT NULL, campo_id uuid NOT NULL, comprador_id uuid NOT NULL, mensaje text, created_at timestamp with time zone DEFAULT now() NOT NULL);
COMMENT ON TABLE public.consultas IS 'Contacto de un comprador por un campo. Solo la ve el socio dueño y el comprador que la envió — CAIR nunca. Ver 05_estadisticas_cair.sql.';
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ADD CONSTRAINT consultas_campo_id_fkey FOREIGN KEY (campo_id) REFERENCES public.campos(id) ON DELETE CASCADE;
ALTER TABLE public.consultas ADD CONSTRAINT consultas_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES public.compradores(id) ON DELETE CASCADE;
ALTER TABLE public.consultas ADD CONSTRAINT consultas_pkey PRIMARY KEY (id);
GRANT INSERT, SELECT ON public.consultas TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.consultas TO service_role;
CREATE INDEX consultas_comprador_id_idx ON public.consultas (comprador_id);
CREATE INDEX consultas_campo_id_idx ON public.consultas (campo_id);
CREATE POLICY "El comprador consulta sobre un campo publicado" ON public.consultas FOR INSERT TO authenticated WITH CHECK (((comprador_id IN ( SELECT compradores.id
   FROM public.compradores
  WHERE (compradores.usuario_id = ( SELECT auth.uid() AS uid)))) AND (campo_id IN ( SELECT campos.id
   FROM public.campos
  WHERE (campos.publicado = true)))));
CREATE POLICY "El socio dueño o el comprador que la envió ven la consulta" ON public.consultas FOR SELECT TO authenticated USING (((campo_id IN ( SELECT c.id
   FROM (public.campos c
     JOIN public.socios s ON ((s.id = c.socio_id)))
  WHERE (s.usuario_id = ( SELECT auth.uid() AS uid)))) OR (comprador_id IN ( SELECT compradores.id
   FROM public.compradores
  WHERE (compradores.usuario_id = ( SELECT auth.uid() AS uid))))));
