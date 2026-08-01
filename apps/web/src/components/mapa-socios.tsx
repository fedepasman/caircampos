'use client';

import { useEffect, useRef } from 'react';
import mapboxgl, { type MapMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { env } from '@/lib/env';
import type { Tables } from '@cair/supabase';

type SocioParaMapa = Pick<Tables<'socios'>, 'id' | 'nombre' | 'nro_socio' | 'telefono'> & {
  latitud: number;
  longitud: number;
  provincia: string | null;
  localidad: string | null;
};

// Centro de Argentina: encuadre de respaldo si todavía no hay ninguna
// inmobiliaria ubicada para calcular un `fitBounds` real.
const CENTRO_ARGENTINA: [number, number] = [-63.6167, -38.4161];

const FUENTE_SOCIOS = 'socios';
const CAPA_CLUSTERS = 'clusters-socios';
const CAPA_CONTEO = 'cluster-count-socios';

// Forma mínima propia en vez de depender del namespace global `GeoJSON` —
// mismo motivo que en mapa-campos.tsx.
interface FeatureCollectionDePuntos {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: PropiedadesSocio;
  }[];
}

interface PropiedadesSocio {
  id: string;
  nombre: string;
  nroSocioTexto: string;
  telefonoTexto: string;
  ubicacionTexto: string;
}

function construirGeojson(socios: SocioParaMapa[]): FeatureCollectionDePuntos {
  return {
    type: 'FeatureCollection',
    features: socios.map((socio) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [socio.longitud, socio.latitud] },
      properties: {
        id: socio.id,
        nombre: socio.nombre,
        nroSocioTexto: socio.nro_socio !== null ? `Socio Nº ${String(socio.nro_socio)}` : '',
        telefonoTexto: socio.telefono ?? '',
        ubicacionTexto:
          socio.localidad && socio.provincia ? `${socio.localidad}, ${socio.provincia}` : '',
      },
    })),
  };
}

/** Tarjeta al pasar el mouse sobre un pin, armada con el DOM y no con HTML
 * interpolado: `nombre` lo carga CAIR como texto libre, y un `.setHTML()`
 * con ese valor adentro sería una inyección de HTML/script directa en una
 * página pública. */
function construirTarjetaHover(propiedades: PropiedadesSocio): HTMLDivElement {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'flex w-56 flex-col gap-0.5 bg-neutral-50 p-3';

  const nombre = document.createElement('p');
  nombre.className = 'truncate text-sm font-semibold text-neutral-950';
  nombre.textContent = propiedades.nombre;
  tarjeta.appendChild(nombre);

  if (propiedades.nroSocioTexto) {
    const numero = document.createElement('p');
    numero.className = 'text-xs text-neutral-800';
    numero.textContent = propiedades.nroSocioTexto;
    tarjeta.appendChild(numero);
  }

  if (propiedades.ubicacionTexto) {
    const ubicacion = document.createElement('p');
    ubicacion.className = 'text-xs text-neutral-800';
    ubicacion.textContent = propiedades.ubicacionTexto;
    tarjeta.appendChild(ubicacion);
  }

  if (propiedades.telefonoTexto) {
    const telefono = document.createElement('p');
    telefono.className = 'mt-1 text-sm font-semibold text-brand-900';
    telefono.textContent = propiedades.telefonoTexto;
    tarjeta.appendChild(telefono);
  }

  return tarjeta;
}

export function MapaSocios({ socios }: { socios: SocioParaMapa[] }) {
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

    const primerSocio = socios[0];
    if (primerSocio) {
      const limites = socios.reduce(
        (acumulado, socio) => acumulado.extend([socio.longitud, socio.latitud]),
        new mapboxgl.LngLatBounds(
          [primerSocio.longitud, primerSocio.latitud],
          [primerSocio.longitud, primerSocio.latitud],
        ),
      );
      mapa.fitBounds(limites, { padding: 64, maxZoom: 10, duration: 0 });
    }

    // Mismo patrón que mapa-campos.tsx: las burbujas de cluster son una
    // capa nativa de Mapbox, los pines individuales son `mapboxgl.Marker`
    // (HTML/CSS, no una textura GL) — evita la restricción de Canvas2D que
    // Safari aplica en navegación privada.
    const marcadoresActivos = new Map<string, mapboxgl.Marker>();

    function actualizarMarcadoresIndividuales() {
      if (!mapa.getSource(FUENTE_SOCIOS) || !mapa.isSourceLoaded(FUENTE_SOCIOS)) return;

      const features = mapa.querySourceFeatures(FUENTE_SOCIOS, {
        filter: ['!', ['has', 'point_count']],
      });

      const idsVisibles = new Set<string>();

      for (const feature of features) {
        if (feature.geometry.type !== 'Point') continue;
        const propiedades = feature.properties as PropiedadesSocio | null;
        if (!propiedades) continue;

        idsVisibles.add(propiedades.id);
        if (marcadoresActivos.has(propiedades.id)) continue;

        const coordenadas = feature.geometry.coordinates as [number, number];
        const marcador = new mapboxgl.Marker({ color: '#18330c' }).setLngLat(coordenadas);

        // Solo hover: el clic en un pin de inmobiliaria no navega a ningún
        // lado por ahora.
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 28,
          className: 'popup-tarjeta-campo',
        }).setDOMContent(construirTarjetaHover(propiedades));

        const elemento = marcador.getElement();
        elemento.addEventListener('mouseenter', () => {
          popup.setLngLat(coordenadas).addTo(mapa);
        });
        elemento.addEventListener('mouseleave', () => {
          popup.remove();
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

    mapa.on('load', () => {
      mapa.addSource(FUENTE_SOCIOS, {
        type: 'geojson',
        data: construirGeojson(socios),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      mapa.addLayer({
        id: CAPA_CLUSTERS,
        type: 'circle',
        source: FUENTE_SOCIOS,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#aed099', 10, '#6ba04d', 30, '#18330c'],
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 30, 28],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      mapa.addLayer({
        id: CAPA_CONTEO,
        type: 'symbol',
        source: FUENTE_SOCIOS,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14,
        },
        paint: { 'text-color': '#ffffff' },
      });

      mapa.on('click', CAPA_CLUSTERS, (evento: MapMouseEvent) => {
        const features = mapa.queryRenderedFeatures(evento.point, { layers: [CAPA_CLUSTERS] });
        const clusterId = features[0]?.properties?.cluster_id as number | undefined;
        const geometria = features[0]?.geometry;
        if (clusterId === undefined || geometria?.type !== 'Point') return;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- tsc sí lo exige: sin el cast, "Property 'getClusterExpansionZoom' does not exist on type 'Source'".
        const fuente = mapa.getSource(FUENTE_SOCIOS) as mapboxgl.GeoJSONSource | undefined;
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

      mapa.on('data', (evento) => {
        if (
          evento.dataType === 'source' &&
          evento.sourceId === FUENTE_SOCIOS &&
          evento.isSourceLoaded
        ) {
          actualizarMarcadoresIndividuales();
        }
      });
      mapa.on('moveend', actualizarMarcadoresIndividuales);
      actualizarMarcadoresIndividuales();
    });

    return () => {
      for (const marcador of marcadoresActivos.values()) marcador.remove();
      mapa.remove();
    };
  }, [socios]);

  return <div ref={contenedorRef} className="h-full w-full" />;
}
