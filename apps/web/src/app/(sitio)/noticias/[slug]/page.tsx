import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { Badge } from '@cair/ui/Badge';
import { ETIQUETAS_CATEGORIA_NOTICIA } from '@cair/shared';
import { urlFotoNoticia } from '@/lib/url-foto-noticia';
import { env } from '@/lib/env';

interface NoticiaDetalle {
  id: string;
  titulo: string;
  categoria: string;
  cuerpo: string;
  imagen_object_key: string | null;
  fecha_publicacion: string;
}

async function obtenerNoticia(slug: string) {
  const supabase = await clienteServidor();
  // `eq('publicado', true)` acá, no solo en RLS: sin esto, un admin logueado
  // podría abrir por URL directa una noticia todavía en borrador — RLS deja
  // verla, pero esta página es la vista pública, no la del panel.
  const { data } = await supabase
    .from('noticias')
    .select('id, titulo, categoria, cuerpo, imagen_object_key, fecha_publicacion')
    .eq('slug', slug)
    .eq('publicado', true)
    .maybeSingle()
    .overrideTypes<NoticiaDetalle | null, { merge: false }>();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const noticia = await obtenerNoticia(slug);

  if (!noticia) return {};

  const primerParrafo =
    noticia.cuerpo
      .split(/\n\s*\n/)[0]
      ?.trim()
      .slice(0, 160) ?? '';
  const imagen = noticia.imagen_object_key
    ? urlFotoNoticia(noticia.imagen_object_key, 'galeria')
    : undefined;

  return {
    title: noticia.titulo,
    description: primerParrafo,
    alternates: { canonical: `/noticias/${slug}` },
    openGraph: {
      title: noticia.titulo,
      description: primerParrafo,
      url: `/noticias/${slug}`,
      siteName: 'CAIR',
      locale: 'es_AR',
      type: 'article',
      publishedTime: noticia.fecha_publicacion,
      images: imagen ? [{ url: imagen, alt: noticia.titulo }] : undefined,
    },
    twitter: {
      card: imagen ? 'summary_large_image' : 'summary',
      title: noticia.titulo,
      description: primerParrafo,
      images: imagen ? [imagen] : undefined,
    },
  };
}

export default async function NoticiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const noticia = await obtenerNoticia(slug);

  if (!noticia) {
    notFound();
  }

  // Texto plano con párrafos separados por línea en blanco: cada bloque va
  // en su propio `<p>`. React escapa la interpolación automáticamente, no
  // hace falta sanitizar HTML.
  const parrafos = noticia.cuerpo.split(/\n\s*\n/).filter((parrafo) => parrafo.trim());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: noticia.titulo,
    datePublished: noticia.fecha_publicacion,
    dateModified: noticia.fecha_publicacion,
    url: `${env.NEXT_PUBLIC_SITE_URL}/noticias/${slug}`,
    image: noticia.imagen_object_key
      ? [urlFotoNoticia(noticia.imagen_object_key, 'galeria')]
      : undefined,
    articleSection: ETIQUETAS_CATEGORIA_NOTICIA[noticia.categoria] ?? noticia.categoria,
    publisher: {
      '@type': 'Organization',
      name: 'CAIR — Cámara Argentina de Inmobiliarias Rurales',
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Ver el comentario del mismo patrón en campos/[id]/page.tsx. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <Link
        href="/noticias"
        className="text-brand-900 text-sm font-semibold underline underline-offset-4"
      >
        ← Noticias
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Badge tone="brand">
          {ETIQUETAS_CATEGORIA_NOTICIA[noticia.categoria] ?? noticia.categoria}
        </Badge>
        <span className="text-sm text-neutral-800">
          {new Date(noticia.fecha_publicacion).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>

      <h1 className="font-display mt-3 text-3xl font-semibold text-neutral-950 sm:text-4xl">
        {noticia.titulo}
      </h1>

      {noticia.imagen_object_key && (
        <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-lg shadow-lg">
          <Image
            src={urlFotoNoticia(noticia.imagen_object_key, 'galeria')}
            alt={noticia.titulo}
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 leading-relaxed text-neutral-900">
        {parrafos.map((parrafo, indice) => (
          <p key={indice}>{parrafo}</p>
        ))}
      </div>
    </main>
  );
}
