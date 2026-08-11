/**
 * Arma la URL pública de lectura de un objeto de Cloudflare R2, a partir de
 * su `object_key` guardado en la base (nunca una URL completa).
 *
 * La URL base se recibe como parámetro en vez de leerse de `process.env`
 * acá: este paquete no puede depender de cómo cada app expone sus
 * variables (`NEXT_PUBLIC_*` en web/admin, `EXPO_PUBLIC_*` en mobile) — esa
 * lectura queda del lado de cada app, en su propio `lib/env.ts`.
 *
 * La transformación de imágenes de Cloudflare (`/cdn-cgi/image/...`) queda
 * desactivada: `NEXT_PUBLIC_R2_PUBLIC_URL` hoy es el dominio compartido
 * `pub-*.r2.dev` que R2 asigna gratis, no un dominio propio agregado como
 * zona a Cloudflare — esa función solo está disponible en una zona propia.
 * Ver la entrada correspondiente en `FUTURO.md` para reactivarlo.
 */

export type VarianteFotoR2 = 'miniatura' | 'tarjeta' | 'galeria';

const ANCHOS_PX: Record<VarianteFotoR2, number> = {
  miniatura: 320,
  tarjeta: 640,
  galeria: 1280,
};

const CDN_CGI_HABILITADO = false as boolean;

export function urlObjetoR2(baseUrl: string, objectKey: string, variante?: VarianteFotoR2): string {
  if (!CDN_CGI_HABILITADO || !variante) return `${baseUrl}/${objectKey}`;

  const ancho = String(ANCHOS_PX[variante]);
  return `${baseUrl}/cdn-cgi/image/width=${ancho},quality=80,format=auto/${objectKey}`;
}
