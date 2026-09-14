'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Habilita TanStack Query para el filtrado interactivo del mapa (CLAUDE.md
 * sección 4: es la excepción documentada a "el listado público se renderiza
 * server-side" — no reemplaza el SSR, es una capa de refinamiento client-side
 * sobre datos que ya llegaron renderizados). Primer y único uso hoy:
 * `ResultadosCampos` (`/campos` y `/v2/campos`).
 *
 * Instancia por navegador vía `useState` lazy, no un singleton de módulo:
 * en App Router el módulo puede evaluarse en el servidor durante SSR, y un
 * `QueryClient` compartido ahí filtraría caché entre requests de usuarios
 * distintos.
 */
export function ProveedorQuery({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
