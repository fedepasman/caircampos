'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { MapaCampos } from '@/components/mapa-campos';
import type { Tables } from '@cair/supabase';

type CampoParaBusqueda = Pick<
  Tables<'campos'>,
  'id' | 'titulo' | 'hectareas' | 'latitud' | 'longitud' | 'provincia' | 'localidad'
> & {
  precio_usd?: number | null;
  campo_fotos?: { object_key: string; orden: number }[];
};

/**
 * Filtro por zona geográfica y búsqueda directa sobre el mapa (punto 5 del
 * pliego), pensado como preview rápido de la home. Client Component porque
 * el filtrado es interactivo, pero los datos ya llegaron renderizados en
 * servidor desde `page.tsx` — es la excepción que documenta CLAUDE.md:
 * TanStack Query (o estado local, como acá) es válido para el filtrado
 * interactivo del mapa, no para el listado público en sí.
 *
 * El filtrado completo (modalidad, tipo, precio, superficie) vive en la
 * landing de resultados `/campos` (`(sitio)/campos/page.tsx`), que además
 * renderiza server-side — este componente se queda deliberadamente simple.
 */
export function BuscadorMapa({ campos }: { campos: CampoParaBusqueda[] }) {
  const provincias = useMemo(
    () => Array.from(new Set(campos.map((campo) => campo.provincia))).sort(),
    [campos],
  );

  const [provinciasActivas, setProvinciasActivas] = useState(() => new Set(provincias));
  const [busqueda, setBusqueda] = useState('');
  // El panel de filtro tapaba buena parte del mapa en mobile (ocupaba casi
  // todo el ancho); acá arranca colapsado detrás de un botón, mismo patrón
  // que FiltrosColapsables. En sm: en adelante queda siempre visible, sin
  // depender de este estado — el mapa ya tiene lugar de sobra.
  const [panelAbierto, setPanelAbierto] = useState(false);

  function alternarProvincia(provincia: string) {
    setProvinciasActivas((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(provincia)) {
        siguiente.delete(provincia);
      } else {
        siguiente.add(provincia);
      }
      return siguiente;
    });
  }

  const terminoDeBusqueda = busqueda.trim().toLowerCase();

  const camposFiltrados = campos.filter((campo) => {
    if (!provinciasActivas.has(campo.provincia)) return false;
    if (!terminoDeBusqueda) return true;
    return (
      campo.localidad.toLowerCase().includes(terminoDeBusqueda) ||
      campo.titulo.toLowerCase().includes(terminoDeBusqueda)
    );
  });

  return (
    <div className="relative mt-8 h-[420px] overflow-hidden rounded-lg border border-neutral-600 bg-neutral-50 shadow-lg md:h-[560px]">
      <MapaCampos campos={camposFiltrados} />

      <div className="absolute top-2 left-2 z-10 sm:top-4 sm:left-4">
        <button
          type="button"
          onClick={() => {
            setPanelAbierto((valor) => !valor);
          }}
          aria-expanded={panelAbierto}
          className="flex items-center gap-2 rounded-md border border-neutral-600 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-950 shadow-md sm:hidden"
        >
          <SlidersHorizontal size={16} />
          Filtrar área
          <ChevronDown size={16} className={panelAbierto ? 'rotate-180' : ''} />
        </button>

        <div
          className={`${panelAbierto ? 'mt-2 block' : 'hidden'} w-48 rounded-md border border-neutral-600 bg-neutral-50 p-3 shadow-md sm:mt-0 sm:block sm:w-56 sm:p-4`}
        >
          <p className="font-display hidden text-sm font-semibold text-neutral-950 sm:block">
            Filtrar área
          </p>

          <input
            type="text"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
            }}
            placeholder="Localidad o título"
            className="w-full rounded-sm border border-neutral-700 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-950 placeholder:text-neutral-700 sm:mt-3"
          />

          <div className="mt-3 flex max-h-40 flex-col gap-2 overflow-y-auto text-sm text-neutral-900">
            {provincias.map((provincia) => (
              <label key={provincia} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={provinciasActivas.has(provincia)}
                  onChange={() => {
                    alternarProvincia(provincia);
                  }}
                  className="accent-brand-900"
                />
                {provincia}
              </label>
            ))}
          </div>

          <p className="mt-3 text-xs text-neutral-800">
            Mostrando {camposFiltrados.length} de {campos.length} campos
          </p>
        </div>
      </div>
    </div>
  );
}
