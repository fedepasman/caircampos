SET check_function_bodies = false;
DROP POLICY "El comprador ve su fila, o el socio del campo consultado" ON public.compradores;
CREATE FUNCTION private.socio_ve_comprador(comprador_id_a_verificar uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.consultas co
    join public.campos c on c.id = co.campo_id
    join public.socios s on s.id = c.socio_id
    where co.comprador_id = comprador_id_a_verificar
      and s.usuario_id = auth.uid()
  );
$function$;
-- El motor de diff descarta el REVOKE EXECUTE FROM PUBLIC al generar la
-- migración (mismo hallazgo que en 05_estadisticas_cair.sql); se agrega a
-- mano, confirmado con pg_proc.proacl.
REVOKE ALL ON FUNCTION private.socio_ve_comprador(uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION private.socio_ve_comprador(uuid) TO authenticated;
CREATE POLICY "El comprador ve su fila, o el socio del campo consultado" ON public.compradores FOR SELECT TO authenticated USING (((usuario_id = ( SELECT auth.uid() AS uid)) OR private.socio_ve_comprador(id)));
