import { createServerClient } from '@supabase/ssr';
import type { Database } from './database.types.js';
import type { ClienteCair, ConfigSupabase } from './index.js';

/** Cookie tal como la maneja `@supabase/ssr`. */
export interface CookieSupabase {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

/**
 * Adaptador de cookies.
 *
 * Se inyecta desde la app en vez de importar `next/headers` acá: ese import
 * ataría el paquete a Next.js y rompería su uso desde cualquier otro entorno
 * de servidor. La app conoce su runtime; el paquete no necesita conocerlo.
 */
export interface AdaptadorCookies {
  getAll: () => CookieSupabase[];
  setAll: (cookies: CookieSupabase[]) => void;
}

/**
 * Cliente para Server Components, Route Handlers y Server Actions.
 *
 * ⚠️ Crear uno nuevo por request. Los Server Components no pueden compartir
 * un cliente entre requests: la sesión quedaría cruzada entre usuarios, que
 * es exactamente la falla que el punto 9 del pliego prohíbe.
 *
 * ⚠️ Para decidir si hay usuario autenticado usar siempre `getUser()`, que
 * valida el token contra el servidor de Auth. `getSession()` solo lee la
 * cookie, y una cookie es falsificable por el cliente.
 */
export function crearClienteServidor(
  { url, publishableKey }: ConfigSupabase,
  cookies: AdaptadorCookies,
): ClienteCair {
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (nuevas) => {
        cookies.setAll(nuevas);
      },
    },
  });
}
