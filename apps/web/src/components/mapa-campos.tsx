'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl, { type MapMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { env } from '@/lib/env';
import { urlFotoCampo } from '@/lib/url-foto-campo';
import { formatearPrecioUsd } from '@cair/shared';
import type { Tables } from '@cair/supabase';

export type CampoParaMapa = Pick<
  Tables<'campos'>,
  'id' | 'titulo' | 'hectareas' | 'latitud' | 'longitud'
> & {
  precio_usd?: number | null;
  campo_fotos?: { object_key: string; orden: number }[];
};

/** Centro y radio (en km) de una zona de búsqueda, dibujada como círculo. */
export interface ZonaBusqueda {
  lat: number;
  lng: number;
  radioKm: number;
}

// Centro de Argentina: encuadre de respaldo si todavía no hay campos
// publicados para calcular un `fitBounds` real.
const CENTRO_ARGENTINA: [number, number] = [-63.6167, -38.4161];

const FUENTE_CAMPOS = 'campos';
const CAPA_CLUSTERS = 'clusters';
const CAPA_CONTEO = 'cluster-count';

const FUENTE_ZONA = 'zona-busqueda';
const CAPA_ZONA_RELLENO = 'zona-busqueda-relleno';
const CAPA_ZONA_BORDE = 'zona-busqueda-borde';
const RADIO_TIERRA_KM = 6371;

interface FeatureCollectionDePoligonos {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: { type: 'Polygon'; coordinates: [number, number][][] };
    properties: Record<string, never>;
  }[];
}

/**
 * Círculo geodésico aproximado (64 puntos) alrededor de `lat`/`lng`, vía la
 * fórmula de punto-destino sobre una esfera. Cálculo propio, ~15 líneas: no
 * amerita sumar `@turf/turf` (no está en el catálogo) solo para esto.
 */
function construirCirculoGeojson(zona: ZonaBusqueda): FeatureCollectionDePoligonos {
  const puntos = 64;
  const anguloDistancia = zona.radioKm / RADIO_TIERRA_KM;
  const latRad = (zona.lat * Math.PI) / 180;
  const lngRad = (zona.lng * Math.PI) / 180;

  const coordenadas: [number, number][] = [];
  for (let i = 0; i <= puntos; i++) {
    const rumbo = (i * 2 * Math.PI) / puntos;
    const latDestino = Math.asin(
      Math.sin(latRad) * Math.cos(anguloDistancia) +
        Math.cos(latRad) * Math.sin(anguloDistancia) * Math.cos(rumbo),
    );
    const lngDestino =
      lngRad +
      Math.atan2(
        Math.sin(rumbo) * Math.sin(anguloDistancia) * Math.cos(latRad),
        Math.cos(anguloDistancia) - Math.sin(latRad) * Math.sin(latDestino),
      );
    coordenadas.push([(lngDestino * 180) / Math.PI, (latDestino * 180) / Math.PI]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coordenadas] },
        properties: {},
      },
    ],
  };
}

// Forma mínima propia en vez de depender del namespace global `GeoJSON`
// (lo trae mapbox-gl transitivamente, pero no siempre queda visible según
// cómo pnpm resuelva los `@types`).
interface FeatureCollectionDePuntos {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: PropiedadesCampo;
  }[];
}

interface PropiedadesCampo {
  id: string;
  titulo: string;
  hectareas: number;
  precioTexto: string;
  fotoUrl: string;
}

function construirGeojson(campos: CampoParaMapa[]): FeatureCollectionDePuntos {
  return {
    type: 'FeatureCollection',
    features: campos.map((campo) => {
      const primeraFoto = [...(campo.campo_fotos ?? [])].sort((a, b) => a.orden - b.orden)[0];
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [campo.longitud, campo.latitud] },
        properties: {
          id: campo.id,
          titulo: campo.titulo,
          hectareas: campo.hectareas,
          // Precalculadas como texto plano a propósito: el `cluster: true` de
          // la fuente tilea las propiedades como si fueran de un vector tile,
          // que solo admite valores planos — un `number | null` o un array
          // anidado (las fotos) no sobreviven ese viaje de forma confiable.
          precioTexto: formatearPrecioUsd(campo.precio_usd ?? null),
          fotoUrl: primeraFoto ? urlFotoCampo(primeraFoto.object_key, 'miniatura') : '',
        },
      };
    }),
  };
}

/** Tarjeta al estilo Airbnb que aparece al pasar el mouse sobre un pin:
 * armada con el DOM, no con HTML interpolado — `titulo` lo carga el socio
 * como texto libre, y un `.setHTML()` con ese valor adentro sería una
 * inyección de HTML/script directa en una página pública. */
function construirTarjetaHover(propiedades: PropiedadesCampo): HTMLDivElement {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'w-56 cursor-pointer overflow-hidden';

  if (propiedades.fotoUrl) {
    const imagen = document.createElement('img');
    imagen.src = propiedades.fotoUrl;
    imagen.alt = '';
    imagen.className = 'h-28 w-full object-cover';
    tarjeta.appendChild(imagen);
  } else {
    const relleno = document.createElement('div');
    relleno.className = 'h-28 w-full bg-gradient-to-br from-brand-700 to-brand-900';
    tarjeta.appendChild(relleno);
  }

  const contenido = document.createElement('div');
  contenido.className = 'flex flex-col gap-0.5 bg-neutral-50 p-3';

  const titulo = document.createElement('p');
  titulo.className = 'truncate text-sm font-semibold text-neutral-950';
  titulo.textContent = propiedades.titulo;
  contenido.appendChild(titulo);

  const hectareas = document.createElement('p');
  hectareas.className = 'text-xs text-neutral-800';
  hectareas.textContent = `${String(propiedades.hectareas)} ha`;
  contenido.appendChild(hectareas);

  const precio = document.createElement('p');
  precio.className = 'mt-1 text-sm font-semibold text-brand-900';
  precio.textContent = propiedades.precioTexto;
  contenido.appendChild(precio);

  tarjeta.appendChild(contenido);
  return tarjeta;
}

export function MapaCampos({
  campos,
  zona,
  onClicMapa,
}: {
  campos: CampoParaMapa[];
  zona?: ZonaBusqueda | undefined;
  onClicMapa?: ((lat: number, lng: number) => void) | undefined;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const mapaRef = useRef<mapboxgl.Map | null>(null);
  const onClicMapaRef = useRef(onClicMapa);

  useEffect(() => {
    onClicMapaRef.current = onClicMapa;
  });

  useEffect(() => {
    if (!contenedorRef.current) return;

    mapboxgl.accessToken = env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const mapa = new mapboxgl.Map({
      container: contenedorRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: CENTRO_ARGENTINA,
      zoom: 4,
    });
    mapaRef.current = mapa;

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

    // Las burbujas de cluster son una capa nativa de Mapbox (círculo + texto):
    // no dependen de decodificar ninguna imagen propia, así que no les afecta
    // la restricción de Canvas2D que Safari aplica en navegación privada (la
    // misma que ya deshabilita el terreno del mapa). Los pines individuales,
    // en cambio, siguen siendo `mapboxgl.Marker` — HTML/CSS, no una textura
    // GL — igual que antes de agregar clustering: cargar un ícono propio vía
    // `addImage()` se probó y falló exactamente por esa restricción
    // ("Image no pudo cargarse") en este mismo navegador.
    const marcadoresActivos = new Map<string, mapboxgl.Marker>();

    function actualizarMarcadoresIndividuales() {
      if (!mapa.getSource(FUENTE_CAMPOS) || !mapa.isSourceLoaded(FUENTE_CAMPOS)) return;

      const features = mapa.querySourceFeatures(FUENTE_CAMPOS, {
        filter: ['!', ['has', 'point_count']],
      });

      const idsVisibles = new Set<string>();

      for (const feature of features) {
        if (feature.geometry.type !== 'Point') continue;
        const propiedades = feature.properties as PropiedadesCampo | null;
        if (!propiedades) continue;

        idsVisibles.add(propiedades.id);
        if (marcadoresActivos.has(propiedades.id)) continue;

        const coordenadas = feature.geometry.coordinates as [number, number];
        const marcador = new mapboxgl.Marker({ color: '#18330c' }).setLngLat(coordenadas);

        // Hover, no clic: la tarjeta se muestra al pasar el mouse (estilo
        // Airbnb) y el clic navega directo a la ficha en vez de exigir un
        // segundo clic sobre un "Ver más" dentro del popup.
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 28,
          className: 'popup-tarjeta-campo',
        }).setDOMContent(construirTarjetaHover(propiedades));

        const elemento = marcador.getElement();
        elemento.style.cursor = 'pointer';
        elemento.addEventListener('mouseenter', () => {
          popup.setLngLat(coordenadas).addTo(mapa);
        });
        elemento.addEventListener('mouseleave', () => {
          popup.remove();
        });
        elemento.addEventListener('click', () => {
          router.push(`/campos/${propiedades.id}`);
        });

        marcador.addTo(mapa);
        marcadoresActivos.set(propiedades.id, marcador);
      }

      for (const [id, marcador] of marcadoresActivos) {
        if (!idsVisibles.has(id)) {
          marcador.remove();
          marcadoresActivos.delete(id);
        }
      }
    }

    // Los `addSource`/`addLayer` necesitan que el estilo ya haya cargado.
    mapa.on('load', () => {
      mapa.addSource(FUENTE_CAMPOS, {
        type: 'geojson',
        data: construirGeojson(campos),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      mapa.addLayer({
        id: CAPA_CLUSTERS,
        type: 'circle',
        source: FUENTE_CAMPOS,
        filter: ['has', 'point_count'],
        paint: {
          // Burbuja más oscura y más grande cuantos más campos agrupa.
          'circle-color': ['step', ['get', 'point_count'], '#aed099', 10, '#6ba04d', 30, '#18330c'],
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 30, 28],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      mapa.addLayer({
        id: CAPA_CONTEO,
        type: 'symbol',
        source: FUENTE_CAMPOS,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Clic en una burbuja: acerca el zoom hasta que se empiece a separar,
      // en vez de solo un valor fijo — mismo comportamiento que el ejemplo
      // oficial de clustering de Mapbox.
      mapa.on('click', CAPA_CLUSTERS, (evento: MapMouseEvent) => {
        const features = mapa.queryRenderedFeatures(evento.point, { layers: [CAPA_CLUSTERS] });
        const clusterId = features[0]?.properties?.cluster_id as number | undefined;
        const geometria = features[0]?.geometry;
        if (clusterId === undefined || geometria?.type !== 'Point') return;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- tsc sí lo exige: sin el cast, "Property 'getClusterExpansionZoom' does not exist on type 'Source'".
        const fuente = mapa.getSource(FUENTE_CAMPOS) as mapboxgl.GeoJSONSource | undefined;
        if (!fuente) return;

        fuente.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error || zoom === null || zoom === undefined) return;
          mapa.easeTo({ center: geometria.coordinates as [number, number], zoom });
        });
      });

      mapa.on('mouseenter', CAPA_CLUSTERS, () => {
        mapa.getCanvas().style.cursor = 'pointer';
      });
      mapa.on('mouseleave', CAPA_CLUSTERS, () => {
        mapa.getCanvas().style.cursor = '';
      });

      // Los marcadores individuales se recalculan cada vez que el cluster
      // termina de recomponerse (fuente recargada) o el usuario deja de
      // mover/hacer zoom — así separan de la burbuja apenas Mapbox los
      // reporta como no-agrupados en el viewport actual.
      mapa.on('data', (evento) => {
        if (
          evento.dataType === 'source' &&
          evento.sourceId === FUENTE_CAMPOS &&
          evento.isSourceLoaded
        ) {
          actualizarMarcadoresIndividuales();
        }
      });
      mapa.on('moveend', actualizarMarcadoresIndividuales);
      actualizarMarcadoresIndividuales();
    });

    // Clic genérico del mapa (no sobre un marcador ni un cluster): usado por
    // el modo "buscar en una zona" para fijar el centro. Un marcador es un
    // elemento DOM aparte con su propio listener, así que no compite con
    // este; superponerse ocasionalmente con el clic de un cluster (que además
    // hace zoom) es una superposición menor aceptable, no un caso a excluir.
    function alHacerClicGeneral(evento: MapMouseEvent) {
      onClicMapaRef.current?.(evento.lngLat.lat, evento.lngLat.lng);
    }
    mapa.on('click', alHacerClicGeneral);

    return () => {
      mapa.off('click', alHacerClicGeneral);
      for (const marcador of marcadoresActivos.values()) marcador.remove();
      mapa.remove();
      mapaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `router` es estable entre renders; solo `campos` debe reconstruir el mapa.
  }, [campos]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    function aplicarZona() {
      if (!mapa) return;
      const datos: FeatureCollectionDePoligonos = zona
        ? construirCirculoGeojson(zona)
        : { type: 'FeatureCollection', features: [] };

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- mismo motivo que el cast de FUENTE_CAMPOS más arriba.
      const fuente = mapa.getSource(FUENTE_ZONA) as mapboxgl.GeoJSONSource | undefined;
      if (fuente) {
        fuente.setData(datos);
        return;
      }
      if (!zona) return;

      mapa.addSource(FUENTE_ZONA, { type: 'geojson', data: datos });
      mapa.addLayer({
        id: CAPA_ZONA_RELLENO,
        type: 'fill',
        source: FUENTE_ZONA,
        paint: { 'fill-color': '#18330c', 'fill-opacity': 0.12 },
      });
      mapa.addLayer({
        id: CAPA_ZONA_BORDE,
        type: 'line',
        source: FUENTE_ZONA,
        paint: { 'line-color': '#18330c', 'line-width': 2 },
      });
    }

    if (mapa.isStyleLoaded()) aplicarZona();
    else mapa.once('load', aplicarZona);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps por valor primitivo, no por identidad del objeto `zona` (se recrea en cada render del padre).
  }, [zona?.lat, zona?.lng, zona?.radioKm]);

  return <div ref={contenedorRef} className="h-full w-full" />;
}
