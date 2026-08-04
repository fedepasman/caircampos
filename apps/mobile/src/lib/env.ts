import { z } from '@cair/schemas';

/**
 * Configuración de entorno de la app móvil, validada al arrancar.
 *
 * ⚠️ Todo lo que lleve el prefijo EXPO_PUBLIC_ queda embebido en el binario
 * que se publica en las tiendas. Cualquiera puede descomprimir un .ipa o un
 * .apk y leerlo: acá solo van claves publicables.
 *
 * Los secretos de build —como el token de descarga de Mapbox— viven en EAS
 * Secrets y no en este archivo ni en el repositorio.
 */
const esquema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url('Debe ser una URL válida'),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  EXPO_PUBLIC_R2_PUBLIC_URL: z.url('Debe ser una URL válida'),
  EXPO_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
});

const resultado = esquema.safeParse({
  // Escritos literales a propósito: Metro sustituye estas expresiones en
  // tiempo de build y un acceso dinámico quedaría `undefined` en el bundle.
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_R2_PUBLIC_URL: process.env.EXPO_PUBLIC_R2_PUBLIC_URL,
  EXPO_PUBLIC_MAPBOX_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
});

if (!resultado.success) {
  throw new Error(
    `Variables de entorno inválidas en apps/mobile:\n${z.prettifyError(resultado.error)}\n\nRevisá .env.example.`,
  );
}

export const env = resultado.data;

export const configSupabase = {
  url: env.EXPO_PUBLIC_SUPABASE_URL,
  publishableKey: env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};
