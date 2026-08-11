import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Ruler, Sprout } from 'lucide-react';
import { clienteServidor } from '@/lib/supabase/server';
import { MapaCampos } from '@/components/mapa-campos';
import { BotonCerrarSesion } from '@/components/boton-cerrar-sesion';
import { Card } from '@cair/ui/Card';
import { Badge } from '@cair/ui/Badge';
import { buttonStyles } from '@cair/ui/Button';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO, formatearPrecioUsd } from '@cair/shared';
import { urlFotoCampo } from '@/lib/url-foto-campo';
import { env } from '@/lib/env';
import { FormularioConsulta } from './formulario-consulta';

async function obtenerCampo(id: string) {
  const supabase = await clienteServidor();
  const { data } = await supabase
    .from('campos')
    .select(
      'id, titulo, descripcion, hectareas, precio_usd, provincia, localidad, modalidad, tipo_campo, latitud, longitud, socios(nombre), campo_fotos(id, object_key, orden)',
    )
    .eq('id', id)
    .eq('publicado', true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const campo = await obtenerCampo(id);

  if (!campo) return {};

  const descripcion = `${campo.titulo} — ${campo.localidad}, ${campo.provincia}. ${String(campo.hectareas)} hectáreas.`;
  const primeraFoto = [...campo.campo_fotos].sort((a, b) => a.orden - b.orden)[0];
  // Absoluta: Open Graph no resuelve rutas relativas contra `metadataBase`
  // para `images` fuera de ese mecanismo cuando la URL ya viene completa
  // (la de R2 lo es), así que se arma directo, sin depender de esa resolución.
  const imagen = primeraFoto ? urlFotoCampo(primeraFoto.object_key, 'galeria') : undefined;

  return {
    title: campo.titulo,
    description: descripcion,
    alternates: { canonical: `/campos/${id}` },
    openGraph: {
      title: campo.titulo,
      description: descripcion,
      url: `/campos/${id}`,
      siteName: 'CAIR',
      locale: 'es_AR',
      type: 'website',
      images: imagen ? [{ url: imagen, alt: campo.titulo }] : undefined,
    },
    twitter: {
      card: imagen ? 'summary_large_image' : 'summary',
      title: campo.titulo,
      description: descripcion,
      images: imagen ? [imagen] : undefined,
    },
  };
}

export default async function FichaCampoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campo = await obtenerCampo(id);

  if (!campo) {
    notFound();
  }

  const supabase = await clienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: comprador } = user
    ? await supabase.from('compradores').select('id').maybeSingle()
    : { data: null };

  const { data: consultaPropia } = comprador
    ? await supabase
        .from('consultas')
        .select('id')
        .eq('campo_id', id)
        .eq('comprador_id', comprador.id)
        .maybeSingle()
    : { data: null };

  // Solo campos reales de la misma provincia — se omite la sección entera
  // si no hay ninguno, en vez de forzar un estado vacío.
  const { data: otrosCampos } = await supabase
    .from('campos')
    .select('id, titulo, localidad, hectareas, precio_usd, campo_fotos(object_key, orden)')
    .eq('publicado', true)
    .eq('provincia', campo.provincia)
    .neq('id', campo.id)
    .limit(3);

  const redirectTo = `/campos/${id}`;
  const [primeraFoto, segundaFoto, terceraFoto] = [...campo.campo_fotos].sort(
    (a, b) => a.orden - b.orden,
  );

  // Structured data (schema.org): le da a Google datos de precio y ubicación
  // ya estructurados para el resultado de búsqueda (potencial rich snippet),
  // en vez de que tenga que inferirlos del texto. Solo campos reales, nunca
  // inventados — `offers` se omite directo si no hay precio publicado.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: campo.titulo,
    description: campo.descripcion ?? undefined,
    url: `${env.NEXT_PUBLIC_SITE_URL}/campos/${id}`,
    image:
      campo.campo_fotos.length > 0
        ? campo.campo_fotos.map((f) => urlFotoCampo(f.object_key, 'galeria'))
        : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: campo.localidad,
      addressRegion: campo.provincia,
      addressCountry: 'AR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: campo.latitud, longitude: campo.longitud },
    additionalProperty: {
      '@type': 'PropertyValue',
      name: 'Superficie',
      value: campo.hectareas,
      unitText: 'ha',
    },
    offers: campo.precio_usd
      ? {
          '@type': 'Offer',
          price: campo.precio_usd,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `${env.NEXT_PUBLIC_SITE_URL}/campos/${id}`,
        }
      : undefined,
  };

  return (
    <main>
      {/* `.replace(/</g, '\\u003c')`: JSON.stringify no escapa `<`, y un
          `</script>` dentro de un string (ej. una descripción con HTML
          pegado) cerraría la etiqueta antes de tiempo. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <section className="mx-auto max-w-5xl px-6 pt-10">
        {primeraFoto && (
          // `sm:h-[30rem]` es necesario, no cosmético: sin un alto definido
          // acá, `sm:grid-rows-2` reparte espacio "disponible" que no
          // existe, y los `h-full` de las fotos de abajo caen a `auto` —
          // una foto vertical se renderiza a su alto natural completo y
          // rompe el layout. Con esto, cada `h-full` sí resuelve contra un
          // alto real y `object-cover` recorta sin deformar.
          <div className="grid grid-cols-1 gap-2 sm:h-[30rem] sm:grid-cols-3 sm:grid-rows-2 sm:[&>*:first-child]:row-span-2">
            <div className="relative h-72 overflow-hidden rounded-lg shadow-lg sm:col-span-2 sm:row-span-2 sm:h-full">
              <Image
                src={urlFotoCampo(primeraFoto.object_key, 'galeria')}
                alt={campo.titulo}
                fill
                priority
                sizes="(min-width: 640px) 66vw, 100vw"
                className="object-cover"
              />
            </div>
            {segundaFoto && (
              <div className="relative hidden h-full overflow-hidden rounded-lg sm:block">
                <Image
                  src={urlFotoCampo(segundaFoto.object_key, 'tarjeta')}
                  alt={`Foto de ${campo.titulo}`}
                  fill
                  sizes="33vw"
                  className="object-cover"
                />
              </div>
            )}
            {terceraFoto && (
              <div className="relative hidden h-full overflow-hidden rounded-lg sm:block">
                <Image
                  src={urlFotoCampo(terceraFoto.object_key, 'tarjeta')}
                  alt={`Foto de ${campo.titulo}`}
                  fill
                  sizes="33vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-semibold text-neutral-950 sm:text-4xl">
                    {campo.titulo}
                  </h1>
                  <Badge tone="brand">
                    {ETIQUETAS_MODALIDAD_CAMPO[campo.modalidad] ?? campo.modalidad}
                  </Badge>
                </div>
                <p className="mt-2 flex items-center gap-2 text-neutral-800">
                  <MapPin size={18} />
                  {campo.localidad}, {campo.provincia}
                </p>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                    Precio
                  </p>
                  <p className="font-display text-brand-900 text-2xl font-semibold">
                    {formatearPrecioUsd(campo.precio_usd)}
                  </p>
                </div>
                <a href="#consultar" className={buttonStyles('primary')}>
                  Contactar
                </a>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <Card className="flex flex-col items-center gap-2 p-4 text-center">
                <Ruler className="text-brand-900" size={28} />
                <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                  Superficie
                </span>
                <span className="font-display text-brand-900 text-lg font-semibold">
                  {campo.hectareas} ha
                </span>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4 text-center">
                <Sprout className="text-brand-900" size={28} />
                <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                  Tipo
                </span>
                <span className="font-display text-brand-900 text-lg font-semibold">
                  {ETIQUETAS_TIPO_CAMPO[campo.tipo_campo] ?? campo.tipo_campo}
                </span>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4 text-center">
                <MapPin className="text-brand-900" size={28} />
                <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                  Modalidad
                </span>
                <span className="font-display text-brand-900 text-lg font-semibold">
                  {ETIQUETAS_MODALIDAD_CAMPO[campo.modalidad] ?? campo.modalidad}
                </span>
              </Card>
            </div>

            {campo.descripcion && (
              <div className="mt-10">
                <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-neutral-950">
                  <span className="bg-accent-400 h-5 w-1" aria-hidden />
                  Descripción General
                </h2>
                <p className="mt-3 leading-relaxed text-neutral-900">{campo.descripcion}</p>
              </div>
            )}

            <div className="mt-10">
              <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-neutral-950">
                <span className="bg-accent-400 h-5 w-1" aria-hidden />
                Ubicación Estratégica
              </h2>
              <div className="mt-3 h-72 overflow-hidden rounded-lg border border-neutral-600 shadow-lg sm:h-96">
                <MapaCampos campos={[campo]} />
              </div>
            </div>
          </div>

          <aside>
            <Card className="sticky top-24 scroll-mt-24 p-6" id="consultar">
              <div className="flex items-center gap-3">
                <div
                  className="from-brand-700 to-brand-900 h-12 w-12 shrink-0 rounded-full bg-gradient-to-br"
                  aria-hidden
                />
                <div>
                  <p className="text-sm text-neutral-800">Publicado por</p>
                  <p className="font-display text-lg font-semibold text-neutral-950">
                    {campo.socios.nombre}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-neutral-600 pt-6">
                <h2 className="font-display text-xl font-semibold text-neutral-950">Consultar</h2>

                {!user && (
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-sm text-neutral-800">
                      Iniciá sesión o creá una cuenta para consultar por este campo.
                    </p>
                    <div className="flex gap-4">
                      <Link
                        href={`/ingresar?redirectTo=${redirectTo}`}
                        className="text-brand-900 text-sm font-semibold underline underline-offset-4"
                      >
                        Ingresar
                      </Link>
                      <Link
                        href={`/registrarse?redirectTo=${redirectTo}`}
                        className="text-brand-900 text-sm font-semibold underline underline-offset-4"
                      >
                        Registrarme
                      </Link>
                    </div>
                  </div>
                )}

                {user && !comprador && (
                  <p className="mt-4 text-sm text-neutral-800">
                    Tu cuenta no está vinculada a un comprador. Contactá a CAIR.
                  </p>
                )}

                {comprador && consultaPropia && (
                  <div className="mt-4 flex flex-col gap-3">
                    <p className="text-sm text-neutral-800">
                      Ya enviaste una consulta por este campo.
                    </p>
                    <BotonCerrarSesion />
                  </div>
                )}

                {comprador && !consultaPropia && (
                  <FormularioConsulta campoId={campo.id} compradorId={comprador.id} />
                )}
              </div>
            </Card>
          </aside>
        </div>
      </section>

      {otrosCampos && otrosCampos.length > 0 && (
        <section className="bg-neutral-200 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-2xl font-semibold text-neutral-950">
              Campos similares en {campo.provincia}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {otrosCampos.map((otro) => {
                const objectKey = [...otro.campo_fotos].sort((a, b) => a.orden - b.orden)[0]
                  ?.object_key;
                return (
                  <Link key={otro.id} href={`/campos/${otro.id}`}>
                    <Card className="hover:border-brand-900 overflow-hidden">
                      {objectKey ? (
                        <div className="relative h-32 w-full">
                          <Image
                            src={urlFotoCampo(objectKey, 'tarjeta')}
                            alt={otro.titulo}
                            fill
                            sizes="(min-width: 640px) 33vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="from-brand-700 to-brand-900 h-32 bg-gradient-to-br"
                          aria-hidden
                        />
                      )}
                      <div className="p-4">
                        <p className="font-display font-semibold text-neutral-950">{otro.titulo}</p>
                        <p className="text-sm text-neutral-800">
                          {otro.localidad} · {otro.hectareas} ha
                        </p>
                        <p className="text-brand-900 mt-1 text-sm font-semibold">
                          {formatearPrecioUsd(otro.precio_usd)}
                        </p>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
