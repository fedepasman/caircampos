import { z } from '@cair/schemas';

/**
 * Configuración de entorno del sitio público, validada al arrancar.
 *
 * Se parsea una sola vez y en el borde: una variable faltante o mal formada
 * rompe acá, con un mensaje que dice cuál es, en vez de propagarse como
 * `undefined` hasta un punto donde el síntoma no señala la causa.
 *
 * Cada `process.env.X` se escribe completo y literal a propósito: Next.js
 * reemplaza esas expresiones en tiempo de build por su valor, y un acceso
 * dinámico (`process.env[nombre]`) queda como `undefined` en el bundle.
 */
const esquema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url('Debe ser una URL válida'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url('Debe ser una URL válida'),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
  // Dominio público de lectura del bucket de R2 (r2.dev o dominio propio):
  // solo arma la URL de una foto ya subida, nunca escribe — las credenciales
  // de escritura viven exclusivamente en la Edge Function.
  NEXT_PUBLIC_R2_PUBLIC_URL: z.url('Debe ser una URL válida'),
});

const resultado = esquema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
});

if (!resultado.success) {
  throw new Error(
    `Variables de entorno inválidas en apps/web:\n${z.prettifyError(resultado.error)}\n\nRevisá .env.example.`,
  );
}

export const env = resultado.data;

/**
 * Configuración de Supabase para las factories de `@cair/supabase`.
 *
 * Solo la clave PUBLICABLE. La secreta no se lee nunca desde acá: viaja al
 * navegador todo lo que lleve el prefijo NEXT_PUBLIC_, y una `service_role`
 * en el bundle equivale a publicar la base entera.
 */
export const configSupabase = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};
