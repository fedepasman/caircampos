import { env } from '@/lib/env';
import { urlObjetoR2 } from '@cair/shared';

/** Único lugar que arma la URL de lectura de la portada de una noticia. */
export function urlFotoNoticia(objectKey: string): string {
  return urlObjetoR2(env.NEXT_PUBLIC_R2_PUBLIC_URL, objectKey);
}
