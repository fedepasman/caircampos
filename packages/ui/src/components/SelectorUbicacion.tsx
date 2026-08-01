'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Centro de Argentina: encuadre de respaldo cuando todavía no hay una
// ubicación elegida.
const CENTRO_ARGENTINA: [number, number] = [-63.6167, -38.4161];

interface SelectorUbicacionProps {
  tokenMapbox: string;
  latitud?: number | undefined;
  longitud?: number | undefined;
  /**
   * Coordenadas a las que acercar la cámara del mapa (p. ej. desde una
   * geocodificación por provincia/localidad). Nunca coloca ni mueve el
   * pin — la ubicación real la define únicamente el clic o el arrastre de
   * quien completa el formulario.
   */
  centrarEn?: { lat: number; lng: number } | undefined;
  onCambiar: (latitud: number, longitud: number) => void;
}

/**
 * Mapa con un único pin arrastrable, para elegir latitud/longitud sin
 * tipearlas a mano. Un clic coloca o mueve el pin; arrastrarlo lo reubica.
 *
 * Compartido por `apps/web` (formulario de campos) y `apps/admin`
 * (formulario de socios) — por eso el token de Mapbox llega como prop en
 * vez de leerse de `env`: un paquete de `packages/` no puede importar el
 * módulo de entorno de una app puntual.
 *
 * Las coordenadas iniciales solo se usan para el primer render del mapa —
 * de ahí en más la fuente de verdad es el propio pin, no las props. Volver
 * a centrar el mapa en cada cambio de estado del formulario (un cambio por
 * cada clic) sería contraproducente: pelearía con el propio arrastre.
 */
export function SelectorUbicacion({
  tokenMapbox,
  latitud,
  longitud,
  centrarEn,
  onCambiar,
}: SelectorUbicacionProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<mapboxgl.Map | null>(null);
  const onCambiarRef = useRef(onCambiar);

  useEffect(() => {
    onCambiarRef.current = onCambiar;
  });

  useEffect(() => {
    if (!contenedorRef.current) return;

    mapboxgl.accessToken = tokenMapbox;

    const hayUbicacionInicial = latitud !== undefined && longitud !== undefined;

    const mapa = new mapboxgl.Map({
      container: contenedorRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: hayUbicacionInicial ? [longitud, latitud] : CENTRO_ARGENTINA,
      zoom: hayUbicacionInicial ? 12 : 4,
    });
    mapaRef.current = mapa;

    // Insurance barata: si el contenedor todavía no tenía su tamaño final
    // en el momento exacto de crear el mapa (una ruta recién montada es más
    // propensa a esto que un mapa que ya está siempre presente en pantalla),
    // esto lo corrige apenas el estilo termina de cargar.
    mapa.on('load', () => mapa.resize());

    let marcador: mapboxgl.Marker | null = null;

    function colocarMarcador(lng: number, lat: number) {
      if (marcador) {
        marcador.setLngLat([lng, lat]);
        return;
      }

      marcador = new mapboxgl.Marker({ color: '#18330c', draggable: true })
        .setLngLat([lng, lat])
        .addTo(mapa);

      marcador.on('dragend', () => {
        const posicion = marcador?.getLngLat();
        if (posicion) onCambiarRef.current(posicion.lat, posicion.lng);
      });
    }

    if (hayUbicacionInicial) {
      colocarMarcador(longitud, latitud);
    }

    function alHacerClic(evento: mapboxgl.MapMouseEvent) {
      const { lng, lat } = evento.lngLat;
      colocarMarcador(lng, lat);
      onCambiarRef.current(lat, lng);
    }

    mapa.on('click', alHacerClic);

    return () => {
      mapa.off('click', alHacerClic);
      marcador?.remove();
      mapa.remove();
      mapaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo se usa el valor inicial de latitud/longitud/tokenMapbox; los cambios posteriores los maneja el clic/arrastre del propio pin, no un nuevo render.
  }, []);

  useEffect(() => {
    if (!centrarEn) return;
    mapaRef.current?.flyTo({ center: [centrarEn.lng, centrarEn.lat], zoom: 11 });
  }, [centrarEn]);

  return <div ref={contenedorRef} className="h-full w-full" />;
}
