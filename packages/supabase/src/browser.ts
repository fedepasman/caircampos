import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types.js';
import type { ClienteCair, ConfigSupabase } from './index.js';

/**
 * Cliente para componentes cliente de Next.js (web y admin).
 *
 * Lee y escribe la sesión en cookies, de modo que el servidor vea la misma
 * sesión que el navegador. Es lo que permite que un Server Component sepa
 * quién está autenticado.
 */
export function crearClienteNavegador({ url, publishableKey }: ConfigSupabase): ClienteCair {
  return createBrowserClient<Database>(url, publishableKey);
}
