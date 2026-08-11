import type { MetadataRoute } from 'next';
import { clienteServidor } from '@/lib/supabase/server';
import { env } from '../lib/env';

/**
 * Sitemap.
 *
 * Las fichas de campos y las noticias publicadas se suman consultando la
 * base — es la vía concreta para el punto 7 del pliego: sin sus URLs acá,
 * Google solo las descubre por link interno, mucho más lento que por
 * sitemap. Es el contenido central de la plataforma, así que va primero.
 *
 * Nota para cuando el volumen crezca: un sitemap admite hasta 50.000 URLs.
 * Al acercarse a ese tope hay que partirlo con `generateSitemaps`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await clienteServidor();
  const { data: campos } = await supabase
    .from('campos')
    .select('id, created_at')
    .eq('publicado', true)
    .eq('revisado_por_cair', 'aprobado');
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
    ...(campos ?? []).map((campo) => ({
      url: `${env.NEXT_PUBLIC_SITE_URL}/campos/${campo.id}`,
      lastModified: new Date(campo.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...(noticias ?? []).map((noticia) => ({
      url: `${env.NEXT_PUBLIC_SITE_URL}/noticias/${noticia.slug}`,
      lastModified: new Date(noticia.fecha_publicacion),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
