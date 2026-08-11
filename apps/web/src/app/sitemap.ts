import type { MetadataRoute } from 'next';
import { clienteServidor } from '@/lib/supabase/server';
import { env } from '../lib/env';

/**
 * Sitemap.
 *
 * Las noticias publicadas se suman consultando la base — es la vía concreta
 * para el punto 7 del pliego: sin sus URLs acá, Google tarda mucho más en
 * descubrirlas. Las fichas de `campos` quedan pendientes de sumarse acá
 * (no es parte de este cambio).
 *
 * Nota para cuando el volumen crezca: un sitemap admite hasta 50.000 URLs.
 * Al acercarse a ese tope hay que partirlo con `generateSitemaps`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await clienteServidor();
  const { data: noticias } = await supabase
    .from('noticias')
    .select('slug, fecha_publicacion')
    .eq('publicado', true);

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
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}/inmobiliarias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}/noticias`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...(noticias ?? []).map((noticia) => ({
      url: `${env.NEXT_PUBLIC_SITE_URL}/noticias/${noticia.slug}`,
      lastModified: new Date(noticia.fecha_publicacion),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
