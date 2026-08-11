import { z } from '@cair/schemas';

/**
 * Configuración de entorno del panel administrativo, validada al arrancar.
 *
 * Cada `process.env.X` se escribe completo y literal: Next.js reemplaza esas
 * expresiones en tiempo de build, y un acceso dinámico quedaría `undefined`.
 */
const esquema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url('Debe ser una URL válida'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_ADMIN_URL: z.url('Debe ser una URL válida'),
  // Para el selector de ubicación del alta de inmobiliarias (Mapbox).
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
  // Para previsualizar la portada de una noticia ya subida a R2.
  NEXT_PUBLIC_R2_PUBLIC_URL: z.url('Debe ser una URL válida'),
});

const resultado = esquema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
});

if (!resultado.success) {
  throw new Error(
    `Variables de entorno inválidas en apps/admin:\n${z.prettifyError(resultado.error)}\n\nRevisá .env.example.`,
  );
}

export const env = resultado.data;

/**
 * Configuración de Supabase para las factories de `@cair/supabase`.
 *
 * El panel usa la MISMA clave publicable que el sitio público, no una con más
 * privilegios. Ser administrador no es una propiedad de la clave sino del
 * usuario: se resuelve con `app_metadata` y políticas RLS. Una clave elevada
 * en el panel convertiría cualquier XSS en acceso total a la base.
 */
export const configSupabase = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};
