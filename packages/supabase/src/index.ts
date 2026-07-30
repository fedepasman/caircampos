/**
 * Punto de entrada de tipos de la base.
 *
 * Las factories de cliente NO se exportan desde acá a propósito: cada una
 * arrastra dependencias propias de su plataforma. Se importan por subpath:
 *
 *   @cair/supabase/browser  → componentes cliente de Next.js
 *   @cair/supabase/server   → Server Components, Route Handlers, Server Actions
 *   @cair/supabase/mobile   → app Expo
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

export type { Database, Json } from './database.types.js';

/**
 * Helpers de tipo que emite el propio generador. Se reexportan en vez de
 * escribir alias propios: así siguen siendo correctos cuando cambie la forma
 * del archivo generado.
 *
 *   Tables<'campos'>        → fila tal como la devuelve un SELECT
 *   TablesInsert<'campos'>  → payload de inserción, con los opcionales bien
 *   TablesUpdate<'campos'>  → payload de actualización
 *   Enums<'tipo_operacion'> → enum de Postgres como unión de TypeScript
 */
export type { Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from './database.types.js';

/** Cliente ya tipado contra el esquema real. Usar este alias, nunca `SupabaseClient` pelado. */
export type ClienteCair = SupabaseClient<Database>;

/**
 * Configuración de conexión.
 *
 * Se recibe por parámetro en vez de leerse de `process.env` dentro del
 * paquete: web usa `NEXT_PUBLIC_*` y móvil usa `EXPO_PUBLIC_*`, y hacer que
 * el paquete adivine cuál corresponde lo ataría a una plataforma. Cada app
 * lee su entorno y pasa los valores.
 */
export interface ConfigSupabase {
  url: string;
  /**
   * Clave PUBLICABLE. Es la única que puede viajar al cliente.
   *
   * Nunca pasar acá la `service_role` / secret key: evade RLS por completo,
   * y en un bundle de navegador o en un binario de app queda a la vista de
   * cualquiera. Su único lugar es una Edge Function.
   */
  publishableKey: string;
}
