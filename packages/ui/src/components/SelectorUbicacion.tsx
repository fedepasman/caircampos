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
   * Coordenadas a las que acercar la cámara del mapa (p. ej. al elegir una
   * provincia/localidad en el selector en cascada, usando su centroide).
   * Nunca coloca ni mueve el pin — la ubicación real la define únicamente
   * el clic, el arrastre, o `posicionEscrita`.
   */
  centrarEn?: { lat: number; lng: number } | undefined;
  /**
   * Coordenadas exactas tipeadas a mano (inputs de latitud/longitud), como
   * alternativa a clickear el mapa. A diferencia de `centrarEn`, esto SÍ
   * coloca el pin — acá el usuario especificó la ubicación exacta, no una
   * aproximación por texto. Un canal separado y dedicado: si en cambio
   * este efecto reaccionara a cualquier cambio de `latitud`/`longitud`
   * (incluidos los que ya vienen del propio clic/arrastre), cada arrastre
   * volvería a centrar la cámara con un `flyTo`, peleando con el gesto que
   * el usuario recién hizo.
   */
  posicionEscrita?: { lat: number; lng: number } | undefined;
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
  posicionEscrita,
  onCambiar,
}: SelectorUbicacionProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<mapboxgl.Map | null>(null);
  const marcadorRef = useRef<mapboxgl.Marker | null>(null);
  const onCambiarRef = useRef(onCambiar);

  useEffect(() => {
    onCambiarRef.current = onCambiar;
  });

  // Nivel de componente (no local al efecto de montaje): la necesita
  // también el efecto de `posicionEscrita`, más abajo.
  function colocarMarcador(lng: number, lat: number) {
    const mapa = mapaRef.current;
    if (!mapa) return;

    if (marcadorRef.current) {
      marcadorRef.current.setLngLat([lng, lat]);
      return;
    }

    const marcador = new mapboxgl.Marker({ color: '#18330c', draggable: true })
      .setLngLat([lng, lat])
      .addTo(mapa);

    marcador.on('dragend', () => {
      const posicion = marcador.getLngLat();
      onCambiarRef.current(posicion.lat, posicion.lng);
    });

    marcadorRef.current = marcador;
  }

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
      marcadorRef.current?.remove();
      marcadorRef.current = null;
      mapa.remove();
      mapaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo se usa el valor inicial de latitud/longitud/tokenMapbox; los cambios posteriores los maneja el clic/arrastre del propio pin, no un nuevo render.
  }, []);

  useEffect(() => {
    if (!centrarEn) return;
    mapaRef.current?.flyTo({ center: [centrarEn.lng, centrarEn.lat], zoom: 11 });
  }, [centrarEn]);

  useEffect(() => {
    if (!posicionEscrita) return;
    colocarMarcador(posicionEscrita.lng, posicionEscrita.lat);
    mapaRef.current?.flyTo({ center: [posicionEscrita.lng, posicionEscrita.lat], zoom: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `colocarMarcador` se recrea en cada render pero solo lee refs; incluirlo dispararía este efecto en cada render del padre, no solo cuando cambian los inputs de coordenadas.
  }, [posicionEscrita?.lat, posicionEscrita?.lng]);

  return <div ref={contenedorRef} className="h-full w-full" />;
}
