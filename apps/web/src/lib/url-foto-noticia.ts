import { env } from '@/lib/env';
import { urlObjetoR2, type VarianteFotoR2 } from '@cair/shared';

/**
 * Único lugar que arma la URL de lectura de la portada de una noticia.
 * Wrapper fino sobre `urlObjetoR2` de `@cair/shared` (compartido con
 * `campos`, ver `url-foto-campo.ts`) — acá solo se inyecta la base de este
 * entorno.
 */
export type VarianteFotoNoticia = VarianteFotoR2;

export function urlFotoNoticia(objectKey: string, variante?: VarianteFotoNoticia): string {
  return urlObjetoR2(env.NEXT_PUBLIC_R2_PUBLIC_URL, objectKey, variante);
}
