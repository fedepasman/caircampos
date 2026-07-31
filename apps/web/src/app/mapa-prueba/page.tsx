'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { clienteNavegador } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { Tables } from '@cair/supabase';

type CampoParaMapa = Pick<
  Tables<'campos'>,
  'id' | 'titulo' | 'hectareas' | 'latitud' | 'longitud'
>;

/**
 * Prueba de punta a punta del modelo mínimo: confirma que Postgres, RLS, los
 * tipos generados y Mapbox funcionan juntos antes de construir la búsqueda
 * real. Esta página se descarta cuando exista la búsqueda pública definitiva
 * — esa se renderiza en servidor por la regla de SEO de CLAUDE.md, esta es
 * deliberadamente más simple.
 */
export default function MapaPruebaPage() {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [campos, setCampos] = useState<CampoParaMapa[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarCampos() {
      try {
        const { data, error: errorConsulta } = await clienteNavegador()
          .from('campos')
          .select('id, titulo, hectareas, latitud, longitud')
          .eq('publicado', true);

        if (cancelado) return;

        if (errorConsulta) {
          setError(errorConsulta.message);
          return;
        }

        setCampos(data);
      } catch (excepcion) {
        if (!cancelado) {
          setError(excepcion instanceof Error ? excepcion.message : String(excepcion));
        }
      }
    }

    void cargarCampos();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!contenedorRef.current) return;

    mapboxgl.accessToken = env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const mapa = new mapboxgl.Map({
      container: contenedorRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-63.6167, -38.4161], // Centro de Argentina
      zoom: 4,
    });

    const marcadores = campos.map((campo) =>
      new mapboxgl.Marker()
        .setLngLat([campo.longitud, campo.latitud])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${campo.titulo}</strong><br />${String(campo.hectareas)} ha`,
          ),
        )
        .addTo(mapa),
    );

    return () => {
      marcadores.forEach((marcador) => marcador.remove());
      mapa.remove();
    };
  }, [campos]);

  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Prueba: campos publicados en el mapa
      </h1>
      <p className="text-neutral-600">
        {campos.length} campo(s) publicado(s) encontrados vía RLS con la clave anónima.
      </p>
      {error && <p className="text-danger">Error: {error}</p>}
      <div ref={contenedorRef} className="h-[600px] w-full rounded-lg" />
    </main>
  );
}
