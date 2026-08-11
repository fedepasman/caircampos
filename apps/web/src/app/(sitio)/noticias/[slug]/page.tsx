import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { Badge } from '@cair/ui/Badge';
import { ETIQUETAS_CATEGORIA_NOTICIA } from '@cair/shared';
import { urlFotoNoticia } from '@/lib/url-foto-noticia';

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

  return {
    title: noticia.titulo,
    description: primerParrafo,
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
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
        <div className="mt-6 aspect-video w-full overflow-hidden rounded-lg shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (R2), no pasa por el optimizador de imágenes de Next */}
          <img
            src={urlFotoNoticia(noticia.imagen_object_key, 'galeria')}
            alt=""
            className="h-full w-full object-cover"
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
