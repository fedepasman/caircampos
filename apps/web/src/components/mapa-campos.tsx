'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { env } from '@/lib/env';
import type { Tables } from '@cair/supabase';

type CampoParaMapa = Pick<
  Tables<'campos'>,
  'id' | 'titulo' | 'hectareas' | 'latitud' | 'longitud'
>;

// Centro de Argentina: encuadre de respaldo si todavía no hay campos
// publicados para calcular un `fitBounds` real.
const CENTRO_ARGENTINA: [number, number] = [-63.6167, -38.4161];

export function MapaCampos({ campos }: { campos: CampoParaMapa[] }) {
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contenedorRef.current) return;

    mapboxgl.accessToken = env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const mapa = new mapboxgl.Map({
      container: contenedorRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: CENTRO_ARGENTINA,
      zoom: 4,
    });

    const marcadores = campos.map((campo) =>
      new mapboxgl.Marker({ color: '#18330c' })
        .setLngLat([campo.longitud, campo.latitud])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${campo.titulo}</strong><br />${String(campo.hectareas)} ha<br /><a href="/campos/${campo.id}">Ver más</a>`,
          ),
        )
        .addTo(mapa),
    );

    const primerCampo = campos[0];
    if (primerCampo) {
      const limites = campos.reduce(
        (acumulado, campo) => acumulado.extend([campo.longitud, campo.latitud]),
        new mapboxgl.LngLatBounds(
          [primerCampo.longitud, primerCampo.latitud],
          [primerCampo.longitud, primerCampo.latitud],
        ),
      );
      mapa.fitBounds(limites, { padding: 64, maxZoom: 10, duration: 0 });
    }

    return () => {
      marcadores.forEach((marcador) => marcador.remove());
      mapa.remove();
    };
  }, [campos]);

  return <div ref={contenedorRef} className="h-full w-full" />;
}
