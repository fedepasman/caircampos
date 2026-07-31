import type { MetadataRoute } from 'next';
import { env } from '../lib/env';

/**
 * Sitemap.
 *
 * Hoy solo lista las rutas estáticas. Cuando existan las publicaciones, acá
 * se agregan sus URLs consultando la base — que es la vía concreta para el
 * punto 7 del pliego: sin las fichas de campos en el sitemap, Google tarda
 * mucho más en descubrirlas.
 *
 * Nota para entonces: un sitemap admite hasta 50.000 URLs. Al acercarse a ese
 * volumen hay que partirlo con `generateSitemaps`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: env.NEXT_PUBLIC_SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}/campos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];
}
