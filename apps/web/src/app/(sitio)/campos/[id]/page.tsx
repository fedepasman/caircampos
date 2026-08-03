import type { Metadata } from 'next';
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

  return {
    title: campo.titulo,
    description: `${campo.titulo} — ${campo.localidad}, ${campo.provincia}. ${String(campo.hectareas)} hectáreas.`,
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

  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pt-10">
        {primeraFoto && (
          // `sm:h-[30rem]` es necesario, no cosmético: sin un alto definido
          // acá, `sm:grid-rows-2` reparte espacio "disponible" que no
          // existe, y los `h-full` de las fotos de abajo caen a `auto` —
          // una foto vertical se renderiza a su alto natural completo y
          // rompe el layout. Con esto, cada `h-full` sí resuelve contra un
          // alto real y `object-cover` recorta sin deformar.
          <div className="grid grid-cols-1 gap-2 sm:h-[30rem] sm:grid-cols-3 sm:grid-rows-2 sm:[&>*:first-child]:row-span-2">
            <div className="h-72 overflow-hidden rounded-lg shadow-lg sm:col-span-2 sm:row-span-2 sm:h-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (R2), no pasa por el optimizador de imágenes de Next */}
              <img
                src={urlFotoCampo(primeraFoto.object_key, 'galeria')}
                alt={campo.titulo}
                className="h-full w-full object-cover"
              />
            </div>
            {segundaFoto && (
              <div className="hidden h-full overflow-hidden rounded-lg sm:block">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (R2) */}
                <img
                  src={urlFotoCampo(segundaFoto.object_key, 'tarjeta')}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {terceraFoto && (
              <div className="hidden h-full overflow-hidden rounded-lg sm:block">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (R2) */}
                <img
                  src={urlFotoCampo(terceraFoto.object_key, 'tarjeta')}
                  alt=""
                  className="h-full w-full object-cover"
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
                        // eslint-disable-next-line @next/next/no-img-element -- URL externa (R2)
                        <img
                          src={urlFotoCampo(objectKey, 'tarjeta')}
                          alt=""
                          className="h-32 w-full object-cover"
                        />
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
