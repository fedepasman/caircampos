import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { clienteServidor } from '@/lib/supabase/server';
import { ETIQUETAS_CATEGORIA_NOTICIA } from '@cair/shared';
import { urlFotoNoticia } from '@/lib/url-foto-noticia';

export const metadata: Metadata = {
  title: 'Noticias del sector rural',
  description:
    'Análisis, tendencias y novedades del mercado inmobiliario rural argentino, publicadas por CAIR.',
  alternates: { canonical: '/noticias' },
};

interface NoticiaListado {
  id: string;
  titulo: string;
  slug: string;
  categoria: string;
  imagen_object_key: string | null;
  fecha_publicacion: string;
  cuerpo: string;
}

/**
 * Primeros ~`maxLargo` caracteres del primer párrafo, cortando en el
 * último espacio para no partir una palabra a la mitad. Derivado en el
 * momento en vez de guardado en una columna `resumen`: es 100% calculable
 * del `cuerpo` que ya se trae, no hay nada que mantener en sincro.
 */
function extraerResumen(cuerpo: string, maxLargo = 160): string {
  const primerParrafo = cuerpo.split(/\n\s*\n/)[0]?.trim() ?? '';
  if (primerParrafo.length <= maxLargo) return primerParrafo;
  const cortado = primerParrafo.slice(0, maxLargo);
  const ultimoEspacio = cortado.lastIndexOf(' ');
  return `${cortado.slice(0, ultimoEspacio > 0 ? ultimoEspacio : maxLargo)}…`;
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function NoticiasPage() {
  const supabase = await clienteServidor();

  // Sin TanStack Query a propósito (regla de SEO de CLAUDE.md): un listado
  // cargado desde el cliente es invisible para Google.
  const { data: noticias } = await supabase
    .from('noticias')
    .select('id, titulo, slug, categoria, imagen_object_key, fecha_publicacion, cuerpo')
    .eq('publicado', true)
    .order('fecha_publicacion', { ascending: false })
    .overrideTypes<NoticiaListado[], { merge: false }>();

  // La "destacada más grande" es puramente el orden: el primer resultado
  // por fecha_publicacion desc, sin ninguna columna aparte que la marque.
  const [destacada, ...resto] = noticias ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-semibold text-neutral-950 sm:text-4xl">
          Noticias del sector rural
        </h1>
        <p className="mt-2 text-neutral-800">
          Análisis, tendencias y novedades del mercado inmobiliario rural argentino.
        </p>
      </div>

      {!destacada && <p className="text-neutral-800">Todavía no hay noticias publicadas.</p>}

      {destacada && (
        <Link href={`/noticias/${destacada.slug}`} className="group block">
          <div className="grid grid-cols-1 overflow-hidden rounded-xl bg-neutral-200 transition-colors group-hover:bg-neutral-300 sm:grid-cols-2">
            {destacada.imagen_object_key ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL externa (R2), no pasa por el optimizador de imágenes de Next
              <img
                src={urlFotoNoticia(destacada.imagen_object_key, 'galeria')}
                alt=""
                className="h-56 w-full object-cover sm:h-full"
              />
            ) : (
              <div
                className="from-brand-700 to-brand-900 h-56 bg-gradient-to-br sm:h-full"
                aria-hidden
              />
            )}
            <div className="flex flex-col gap-3 p-8">
              <p className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                {ETIQUETAS_CATEGORIA_NOTICIA[destacada.categoria] ?? destacada.categoria}
              </p>
              <h2 className="font-display text-2xl font-semibold text-neutral-950 sm:text-3xl">
                {destacada.titulo}
              </h2>
              <p className="text-neutral-800">{extraerResumen(destacada.cuerpo, 220)}</p>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-600 pt-4">
                <span className="text-sm text-neutral-800">
                  {formatearFecha(destacada.fecha_publicacion)}
                </span>
                <span className="group-hover:text-brand-900 flex items-center gap-1 text-xs font-semibold tracking-widest text-neutral-950 uppercase">
                  Leer
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {resto.length > 0 && (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resto.map((noticia) => (
            <Link key={noticia.id} href={`/noticias/${noticia.slug}`} className="group block h-full">
              <div className="flex h-full flex-col overflow-hidden rounded-xl bg-neutral-200 transition-colors group-hover:bg-neutral-300">
                {noticia.imagen_object_key && (
                  // eslint-disable-next-line @next/next/no-img-element -- URL externa (R2)
                  <img
                    src={urlFotoNoticia(noticia.imagen_object_key, 'tarjeta')}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <p className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                    {ETIQUETAS_CATEGORIA_NOTICIA[noticia.categoria] ?? noticia.categoria}
                  </p>
                  <p className="font-display text-lg font-semibold text-neutral-950">
                    {noticia.titulo}
                  </p>
                  <p className="flex-1 text-sm text-neutral-800">{extraerResumen(noticia.cuerpo)}</p>

                  <div className="mt-2 flex items-center justify-between border-t border-neutral-600 pt-4">
                    <span className="text-xs text-neutral-800">
                      {formatearFecha(noticia.fecha_publicacion)}
                    </span>
                    <span className="group-hover:text-brand-900 flex items-center gap-1 text-xs font-semibold tracking-widest text-neutral-950 uppercase">
                      Leer
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
