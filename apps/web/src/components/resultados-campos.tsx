'use client';

import { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { clienteNavegador } from '@/lib/supabase/client';
import {
  aplicarFiltrosCampos,
  parsearFiltrosCampos,
  SELECCION_CAMPOS_LISTADO,
  type CampoParaListado,
} from '@/lib/campos/filtros';
import { MapaCampos, type BoundingBoxMapa } from './mapa-campos';
import { TarjetaCampo } from './tarjeta-campo';

const DEBOUNCE_MOVIMIENTO_MS = 400;

/**
 * Mapa + grilla de resultados de `/campos` y `/v2/campos`, estilo Airbnb:
 * al entrar, muestra `camposIniciales` (el SSR, indexable — CLAUDE.md
 * sección 4). Recién cuando el usuario mueve el mapa a mano (no el
 * `fitBounds` inicial) pasa a "modo mapa": refetchea por bounding box vía
 * la RPC `campos_en_bbox`, con los mismos filtros de la sidebar aplicados
 * (`aplicarFiltrosCampos`) y debounce corto. Reemplaza a `BuscadorPorRadio`.
 */
export function ResultadosCampos({
  camposIniciales,
  basePathFicha,
}: {
  camposIniciales: CampoParaListado[];
  basePathFicha: '/campos' | '/v2/campos';
}) {
  const searchParams = useSearchParams();
  const filtros = parsearFiltrosCampos(searchParams);
  const [bbox, setBbox] = useState<BoundingBoxMapa | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const alMoverViewport = useCallback((nuevoBbox: BoundingBoxMapa) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setBbox(nuevoBbox);
    }, DEBOUNCE_MOVIMIENTO_MS);
  }, []);

  const modoMapa = bbox !== undefined;

  const consulta = useQuery({
    queryKey: ['campos-bbox', bbox, filtros],
    queryFn: async (): Promise<CampoParaListado[]> => {
      if (!bbox) return [];
      const supabase = clienteNavegador();
      const consultaBbox = aplicarFiltrosCampos(
        supabase.rpc('campos_en_bbox', bbox).select(SELECCION_CAMPOS_LISTADO),
        filtros,
        { excluirTexto: true },
      );
      const { data, error } = await consultaBbox;
      if (error) throw error;
      return data;
    },
    enabled: modoMapa,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const campos = modoMapa ? (consulta.data ?? camposIniciales) : camposIniciales;

  return (
    <div className="flex flex-col gap-2">
      <div className="h-64 overflow-hidden rounded-lg border border-neutral-600 shadow-lg sm:h-80">
        <MapaCampos
          campos={campos}
          basePathFicha={basePathFicha}
          onMoverViewport={alMoverViewport}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-600 pb-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-neutral-950">Resultados</h2>
          <p className="text-sm text-neutral-800">
            {campos.length} {campos.length === 1 ? 'campo encontrado' : 'campos encontrados'}
            {consulta.isFetching && ' · Actualizando…'}
          </p>
        </div>
        {modoMapa && (
          <button
            type="button"
            onClick={() => {
              clearTimeout(timeoutRef.current);
              setBbox(undefined);
            }}
            className="text-brand-900 text-sm underline underline-offset-4"
          >
            Ver todos los campos
          </button>
        )}
      </div>

      {consulta.isError && (
        <p className="text-danger text-sm">
          No se pudo actualizar según el mapa — mostrando el último resultado.
        </p>
      )}

      {campos.length > 0 ? (
        <ul className="mt-2 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {campos.map((campo) => (
            <TarjetaCampo key={campo.id} campo={campo} basePathFicha={basePathFicha} />
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-neutral-800">No se encontraron campos con estos filtros.</p>
      )}
    </div>
  );
}
