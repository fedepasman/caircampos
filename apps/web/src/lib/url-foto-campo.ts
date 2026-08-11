import { env } from '@/lib/env';
import { urlObjetoR2, type VarianteFotoR2 } from '@cair/shared';

/**
 * Único lugar que arma la URL de lectura de una foto de campo. Wrapper
 * fino sobre `urlObjetoR2` de `@cair/shared` (compartido con `noticias`),
 * que ya resuelve la variante/transformación — acá solo se inyecta la base
 * de este entorno.
 */
export type VarianteFotoCampo = VarianteFotoR2;

export function urlFotoCampo(objectKey: string, variante: VarianteFotoCampo): string {
  return urlObjetoR2(env.NEXT_PUBLIC_R2_PUBLIC_URL, objectKey, variante);
}
