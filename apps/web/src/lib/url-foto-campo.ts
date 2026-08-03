import { env } from '@/lib/env';

/**
 * Único lugar que arma la URL de lectura de una foto de campo. Antes cada
 * lugar donde se mostraba una foto interpolaba `env.NEXT_PUBLIC_R2_PUBLIC_URL`
 * por su cuenta.
 *
 * La transformación de imágenes de Cloudflare (`/cdn-cgi/image/...`) queda
 * desactivada: se probó y falló, porque `NEXT_PUBLIC_R2_PUBLIC_URL` hoy es
 * el dominio compartido `pub-*.r2.dev` que R2 asigna gratis, no un dominio
 * propio agregado como zona a la cuenta de Cloudflare — esa función solo
 * está disponible en una zona propia. Ver la entrada correspondiente en
 * `FUTURO.md` para el camino a seguir y reactivar esto.
 */

export type VarianteFotoCampo = 'miniatura' | 'tarjeta' | 'galeria';

const ANCHOS_PX: Record<VarianteFotoCampo, number> = {
  miniatura: 320,
  tarjeta: 640,
  galeria: 1280,
};

const CDN_CGI_HABILITADO = false as boolean;

export function urlFotoCampo(objectKey: string, variante: VarianteFotoCampo): string {
  const base = env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!CDN_CGI_HABILITADO) return `${base}/${objectKey}`;

  const ancho = String(ANCHOS_PX[variante]);
  return `${base}/cdn-cgi/image/width=${ancho},quality=80,format=auto/${objectKey}`;
}
