'use client';

import { useEffect, useRef } from 'react';
import mapboxgl, { type MapMouseEvent } from 'mapbox-gl';
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

const FUENTE_CAMPOS = 'campos';
const CAPA_CLUSTERS = 'clusters';
const CAPA_CONTEO = 'cluster-count';

// Forma mínima propia en vez de depender del namespace global `GeoJSON`
// (lo trae mapbox-gl transitivamente, pero no siempre queda visible según
// cómo pnpm resuelva los `@types`).
interface FeatureCollectionDePuntos {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: { id: string; titulo: string; hectareas: number };
  }[];
}

interface PropiedadesCampo {
  id: string;
  titulo: string;
  hectareas: number;
}

function construirGeojson(campos: CampoParaMapa[]): FeatureCollectionDePuntos {
  return {
    type: 'FeatureCollection',
    features: campos.map((campo) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [campo.longitud, campo.latitud] },
      properties: { id: campo.id, titulo: campo.titulo, hectareas: campo.hectareas },
    })),
  };
}

/** Contenido del popup armado con el DOM, no con HTML interpolado: `titulo`
 * lo carga el socio como texto libre, y un `.setHTML()` con ese valor
 * adentro sería una inyección de HTML/script directa en una página pública. */
function construirPopup(titulo: string, hectareas: number, id: string): HTMLDivElement {
  const contenedor = document.createElement('div');

  const nombre = document.createElement('strong');
  nombre.textContent = titulo;
  contenedor.appendChild(nombre);

  contenedor.appendChild(document.createElement('br'));
  contenedor.appendChild(document.createTextNode(`${String(hectareas)} ha`));
  contenedor.appendChild(document.createElement('br'));

  const link = document.createElement('a');
  link.href = `/campos/${id}`;
  link.textContent = 'Ver más';
  contenedor.appendChild(link);

  return contenedor;
}

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

        const marcador = new mapboxgl.Marker({ color: '#18330c' })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setPopup(
            new mapboxgl.Popup().setDOMContent(
              construirPopup(propiedades.titulo, propiedades.hectareas, propiedades.id),
            ),
          )
          .addTo(mapa);

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
        if (evento.dataType === 'source' && evento.sourceId === FUENTE_CAMPOS && evento.isSourceLoaded) {
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
  }, [campos]);

  return <div ref={contenedorRef} className="h-full w-full" />;
}
