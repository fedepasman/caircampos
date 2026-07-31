import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Ruler } from 'lucide-react';
import { clienteServidor } from '@/lib/supabase/server';
import { MapaCampos } from '@/components/mapa-campos';
import { BotonCerrarSesion } from '@/components/boton-cerrar-sesion';
import { Card } from '@cair/ui/Card';
import { FormularioConsulta } from './formulario-consulta';

async function obtenerCampo(id: string) {
  const supabase = await clienteServidor();
  const { data } = await supabase
    .from('campos')
    .select('id, titulo, descripcion, hectareas, provincia, localidad, latitud, longitud, socios(nombre)')
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
    .select('id, titulo, localidad, hectareas')
    .eq('publicado', true)
    .eq('provincia', campo.provincia)
    .neq('id', campo.id)
    .limit(3);

  const redirectTo = `/campos/${id}`;

  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h1 className="font-display text-3xl font-semibold text-neutral-950 sm:text-4xl">
              {campo.titulo}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-neutral-800">
              <MapPin size={18} />
              {campo.localidad}, {campo.provincia}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <Card className="flex flex-col items-center gap-2 p-4 text-center">
                <Ruler className="text-brand-900" size={28} />
                <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                  Superficie
                </span>
                <span className="font-display text-lg font-semibold text-brand-900">
                  {campo.hectareas} ha
                </span>
              </Card>
              <Card className="flex flex-col items-center gap-2 p-4 text-center">
                <MapPin className="text-brand-900" size={28} />
                <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                  Ubicación
                </span>
                <span className="font-display text-lg font-semibold text-brand-900">
                  {campo.localidad}
                </span>
              </Card>
            </div>

            {campo.descripcion && (
              <div className="mt-10">
                <h2 className="font-display text-xl font-semibold text-neutral-950">
                  Descripción
                </h2>
                <p className="mt-3 leading-relaxed text-neutral-900">{campo.descripcion}</p>
              </div>
            )}

            <div className="mt-10">
              <h2 className="font-display text-xl font-semibold text-neutral-950">Ubicación</h2>
              <div className="mt-3 h-72 overflow-hidden rounded-lg border border-neutral-600 shadow-lg sm:h-96">
                <MapaCampos campos={[campo]} />
              </div>
            </div>
          </div>

          <aside>
            <Card className="sticky top-6 p-6">
              <p className="text-sm text-neutral-800">Publicado por</p>
              <p className="font-display text-lg font-semibold text-neutral-950">
                {campo.socios.nombre}
              </p>

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
                        className="text-sm font-semibold text-brand-900 underline underline-offset-4"
                      >
                        Ingresar
                      </Link>
                      <Link
                        href={`/registrarse?redirectTo=${redirectTo}`}
                        className="text-sm font-semibold text-brand-900 underline underline-offset-4"
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
              Otros campos publicados en {campo.provincia}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {otrosCampos.map((otro) => (
                <Link key={otro.id} href={`/campos/${otro.id}`}>
                  <Card className="overflow-hidden hover:border-brand-900">
                    <div className="h-32 bg-gradient-to-br from-brand-700 to-brand-900" aria-hidden />
                    <div className="p-4">
                      <p className="font-display font-semibold text-neutral-950">{otro.titulo}</p>
                      <p className="text-sm text-neutral-800">
                        {otro.localidad} · {otro.hectareas} ha
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
