SET check_function_bodies = false;
DROP POLICY "Cualquiera ve el socio dueño de un campo publicado" ON public.socios;
DROP POLICY "El socio actualiza su propia fila" ON public.socios;
DROP POLICY "El socio ve su fila, CAIR ve todas, o el dueño publicado" ON public.socios;
DROP FUNCTION private.socio_tiene_campo_publicado(socio_id_a_verificar uuid);
CREATE FUNCTION public.asignar_numero_socio(socio_id_a_actualizar uuid, numero integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if ((select auth.jwt()) -> 'app_metadata' ->> 'rol') != 'admin' then
    raise exception 'No autorizado';
  end if;

  update public.socios
  set nro_socio = numero
  where id = socio_id_a_actualizar;
end;
$function$;
COMMENT ON FUNCTION public.asignar_numero_socio(uuid,integer) IS 'Fija o cambia el número de socio de una inmobiliaria. Solo callable por admin (chequeado adentro).';
-- El motor de diff descarta este REVOKE al generar la migración (mismo gap
-- documentado en 06_moderacion.sql): sin esto, PUBLIC (y por herencia,
-- anon) queda con EXECUTE por el privilegio por defecto de Postgres sobre
-- toda función nueva.
REVOKE EXECUTE ON FUNCTION public.asignar_numero_socio(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.asignar_numero_socio(uuid, integer) TO authenticated;
ALTER TABLE public.socios ALTER COLUMN usuario_id DROP NOT NULL;
COMMENT ON TABLE public.socios IS 'Inmobiliarias socias de CAIR. Alta y edición desde el panel de admin.';
ALTER TABLE public.socios ADD COLUMN nro_socio integer;
ALTER TABLE public.socios ADD CONSTRAINT socios_nro_socio_key UNIQUE (nro_socio);
ALTER TABLE public.socios ADD COLUMN telefono text;
ALTER TABLE public.socios ADD COLUMN provincia text;
ALTER TABLE public.socios ADD COLUMN localidad text;
ALTER TABLE public.socios ADD COLUMN latitud double precision;
ALTER TABLE public.socios ADD CONSTRAINT socios_latitud_check CHECK (latitud >= '-90'::integer::double precision AND latitud <= 90::double precision);
ALTER TABLE public.socios ADD COLUMN longitud double precision;
ALTER TABLE public.socios ADD CONSTRAINT socios_longitud_check CHECK (longitud >= '-180'::integer::double precision AND longitud <= 180::double precision);
ALTER TABLE public.socios ADD COLUMN ubicacion extensions.geography(Point,4326) GENERATED ALWAYS AS (
CASE
    WHEN ((latitud IS NOT NULL) AND (longitud IS NOT NULL)) THEN (extensions.st_setsrid(extensions.st_makepoint(longitud, latitud), 4326))::extensions.geography
    ELSE NULL::extensions.geography
END) STORED;
ALTER TABLE public.socios ADD COLUMN publicado boolean DEFAULT true NOT NULL;
REVOKE UPDATE ON public.socios FROM authenticated;
GRANT INSERT (latitud, localidad, longitud, nombre, nro_socio, provincia, publicado, telefono, usuario_id) ON public.socios TO authenticated;
GRANT UPDATE (latitud, localidad, longitud, nombre, provincia, publicado, telefono, usuario_id) ON public.socios TO authenticated;
CREATE POLICY "CAIR da de alta inmobiliarias" ON public.socios FOR INSERT TO authenticated WITH CHECK ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'rol'::text) = 'admin'::text));
CREATE POLICY "Cualquiera ve los socios publicados" ON public.socios FOR SELECT TO anon USING ((publicado = true));
CREATE POLICY "El socio o CAIR actualizan la fila" ON public.socios FOR UPDATE TO authenticated USING (((usuario_id = ( SELECT auth.uid() AS uid)) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'rol'::text) = 'admin'::text))) WITH CHECK (((usuario_id = ( SELECT auth.uid() AS uid)) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'rol'::text) = 'admin'::text)));
CREATE POLICY "El socio ve su fila, CAIR ve todas, o el resto ve publicadas" ON public.socios FOR SELECT TO authenticated USING (((publicado = true) OR (usuario_id = ( SELECT auth.uid() AS uid)) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'rol'::text) = 'admin'::text)));
