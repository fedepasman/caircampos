'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * En mobile, `/campos` apilaba el sidebar de filtros entero (título, ocho
 * campos, botón) arriba de los resultados — había que scrollear toda esa
 * altura antes de ver el mapa o una sola card. Esto colapsa ese bloque
 * detrás de una barra "Filtros (N) ▾"; en desktop (`lg:` en adelante) se ve
 * igual que siempre, sin el botón.
 *
 * El `<form>` que envuelve no cambia en nada — sigue siendo el mismo GET
 * nativo. Esto solo controla si el navegador lo muestra u oculta.
 */
export function FiltrosColapsables({
  cantidadActiva,
  children,
}: {
  cantidadActiva: number;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setAbierto((valor) => !valor);
        }}
        className="flex w-full items-center justify-between rounded-sm border border-neutral-700 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-950 lg:hidden"
        aria-expanded={abierto}
      >
        <span>Filtros{cantidadActiva > 0 ? ` (${String(cantidadActiva)})` : ''}</span>
        <ChevronDown size={18} className={abierto ? 'rotate-180' : ''} />
      </button>

      {/* `hidden`/`block` decide la visibilidad en mobile; `lg:block` gana
         siempre en desktop sin importar el estado — mismo patrón que ya usa
         el botón "Buscar en una zona" de BuscadorPorRadio para su propio
         modo activo/inactivo. */}
      <div className={`${abierto ? 'block' : 'hidden'} mt-4 lg:mt-0 lg:block`}>{children}</div>
    </>
  );
}
