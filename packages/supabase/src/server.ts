import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import type { Database } from './database.types.js';
import type { ClienteCair, ConfigSupabase } from './index.js';

/**
 * Adaptador de cookies del lado servidor.
 *
 * Es exactamente el contrato que espera `@supabase/ssr`; se toma de ahí en
 * vez de redeclararlo, para que un cambio de la librería rompa en compilación
 * y no en runtime.
 *
 * Se inyecta desde la app en lugar de importar `next/headers` acá: ese import
 * ataría el paquete a Next.js y rompería su uso en cualquier otro entorno de
 * servidor. La app conoce su runtime; el paquete no necesita conocerlo.
 *
 * ⚠️ Sobre `setAll`: recibe un segundo argumento con headers de caché
 * (`Cache-Control: private, no-store`, `Expires: 0`, `Pragma: no-cache`) que
 * hay que aplicar a la respuesta. No es opcional: una respuesta que trae
 * cookies de sesión y queda cacheada en un CDN o un proxy reverso le sirve el
 * token de un usuario a otro. Para esta plataforma sería la falla exacta que
 * el punto 9 del pliego prohíbe.
 */
export type AdaptadorCookies = CookieMethodsServer;

/**
 * Cliente para Server Components, Route Handlers y Server Actions.
 *
 * ⚠️ Crear uno nuevo por request. El proceso de Node se comparte entre
 * requests: un cliente guardado en una variable de módulo cruzaría la sesión
 * entre usuarios.
 *
 * ⚠️ Para decidir si hay usuario autenticado usar siempre `getUser()`, que
 * valida el token contra el servidor de Auth. `getSession()` solo lee la
 * cookie, y la cookie la controla el cliente.
 */
export function crearClienteServidor(
  { url, publishableKey }: ConfigSupabase,
  cookies: AdaptadorCookies,
): ClienteCair {
  return createServerClient<Database>(url, publishableKey, { cookies });
}
