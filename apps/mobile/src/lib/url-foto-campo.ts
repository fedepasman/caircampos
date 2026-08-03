import { env } from './env';

/**
 * Único lugar que arma la URL de lectura de una foto de campo en la app
 * móvil. Calco de `apps/web/src/lib/url-foto-campo.ts`: el bucket de R2 es
 * de lectura pública, así que alcanza con concatenar.
 */
export function urlFotoCampo(objectKey: string): string {
  return `${env.EXPO_PUBLIC_R2_PUBLIC_URL}/${objectKey}`;
}

export function fotoPortada(fotos: { object_key: string; orden: number }[]): string | undefined {
  return [...fotos].sort((a, b) => a.orden - b.orden)[0]?.object_key;
}
