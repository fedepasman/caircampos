import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageCircle, Tag } from 'lucide-react';
import { clienteServidor } from '@/lib/supabase/server';
import { Card } from '@cair/ui/Card';
import { Badge, type BadgeTone } from '@cair/ui/Badge';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO } from '@cair/shared';

function estadoCampo(campo: { publicado: boolean; revisado_por_cair: string }): {
  etiqueta: string;
  tono: BadgeTone;
} {
  if (!campo.publicado) return { etiqueta: 'Borrador', tono: 'neutral' };
  if (campo.revisado_por_cair === 'aprobado') return { etiqueta: 'Publicado', tono: 'brand' };
  if (campo.revisado_por_cair === 'rechazado') return { etiqueta: 'Rechazado', tono: 'danger' };
  return { etiqueta: 'Pendiente de aprobación', tono: 'neutral' };
}

export const metadata: Metadata = {
  title: 'Mi panel',
  // Superficie autenticada: ver la nota de robots en /ingresar/page.tsx.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function PanelPage() {
  const supabase = await clienteServidor();

  // Defensa en profundidad además del proxy (apps/web/src/proxy.ts): nunca
  // autorizar en una sola capa. `getUser()`, nunca `getSession()`: valida el
  // token contra el servidor de Auth en vez de confiar en la cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ingresar');
  }

  // `maybeSingle`, no `single`: el alta de socio es manual en Studio. Si el
  // usuario ya se registró pero CAIR todavía no le creó la fila, esto debe
  // devolver `null` en vez de tirar un error.
  //
  // El `.eq('usuario_id', ...)` es obligatorio: desde que el directorio
  // público de /inmobiliarias amplió la política de SELECT a también
  // `publicado = true`, un socio autenticado ve por RLS su propia fila más
  // todas las publicadas. Sin este filtro, `.maybeSingle()` recibe más de
  // una fila, falla, y el panel muestra "cuenta no vinculada" aunque el
  // vínculo exista.
  const { data: socio } = await supabase
    .from('socios')
    .select('id, nombre')
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (!socio) {
    return (
      <main className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">Mi panel</h1>
        <p className="mt-4 text-neutral-800">
          Tu cuenta todavía no está vinculada a un socio. Contactá a CAIR para completar el alta.
        </p>
      </main>
    );
  }

  // Mismo motivo que el filtro de arriba: la política de SELECT de `campos`
  // también deja ver "los propios O los publicados y aprobados de
  // cualquiera", así que sin este `.eq()` acá aparecerían mezclados los
  // campos de otros socios.
  const { data: campos } = await supabase
    .from('campos')
    .select(
      'id, titulo, provincia, localidad, hectareas, modalidad, tipo_campo, publicado, revisado_por_cair',
    )
    .eq('socio_id', socio.id)
    .order('created_at', { ascending: false });

  const { data: consultas } = await supabase
    .from('consultas')
    .select('id, mensaje, created_at, campos(titulo), compradores(nombre, apellido, telefono)')
    .order('created_at', { ascending: false });

  const cantidadPublicados =
    campos?.filter((campo) => campo.publicado && campo.revisado_por_cair === 'aprobado').length ??
    0;

  return (
    <main className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-neutral-950">
            Bienvenido, {socio.nombre}
          </h1>
          <p className="mt-1 text-neutral-800">Resumen de tu actividad en CAIR.</p>
        </div>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Tag className="text-brand-900" size={28} />
            <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
              Campos publicados
            </span>
          </div>
          <p className="font-display text-brand-900 mt-4 text-4xl font-bold">
            {cantidadPublicados}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <MessageCircle className="text-brand-900" size={28} />
            <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
              Consultas recibidas
            </span>
          </div>
          <p className="font-display text-brand-900 mt-4 text-4xl font-bold">
            {consultas?.length ?? 0}
          </p>
        </Card>
      </section>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section id="mis-campos">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-neutral-950">Mis campos</h2>
              <Link
                href="/panel/campos/nuevo"
                className="text-brand-900 text-sm font-semibold whitespace-nowrap underline underline-offset-4"
              >
                Cargar campo nuevo
              </Link>
            </div>
            {campos && campos.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-3">
                {campos.map((campo) => {
                  const { etiqueta, tono } = estadoCampo(campo);
                  return (
                    <li key={campo.id}>
                      <Link href={`/panel/campos/${campo.id}/editar`}>
                        <Card className="hover:border-brand-900 flex items-center justify-between gap-3 p-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-neutral-950">{campo.titulo}</p>
                            <p className="text-sm text-neutral-800">
                              {campo.localidad}, {campo.provincia} · {campo.hectareas} ha ·{' '}
                              {ETIQUETAS_MODALIDAD_CAMPO[campo.modalidad] ?? campo.modalidad} ·{' '}
                              {ETIQUETAS_TIPO_CAMPO[campo.tipo_campo] ?? campo.tipo_campo}
                            </p>
                          </div>
                          <Badge tone={tono} className="shrink-0 text-right whitespace-nowrap">
                            {etiqueta}
                          </Badge>
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-neutral-800">Todavía no tenés campos cargados.</p>
            )}
          </section>

          <section id="consultas" className="mt-12">
            <h2 className="font-display text-xl font-semibold text-neutral-950">
              Consultas recibidas
            </h2>
            {consultas && consultas.length > 0 ? (
              <Card className="mt-4 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-neutral-600 bg-neutral-200">
                      <th className="p-3 text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                        Campo
                      </th>
                      <th className="p-3 text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                        Comprador
                      </th>
                      <th className="p-3 text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                        Teléfono
                      </th>
                      <th className="p-3 text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-600">
                    {consultas.map((consulta) => (
                      <tr key={consulta.id}>
                        <td className="font-display text-brand-900 p-3">
                          {consulta.campos.titulo}
                        </td>
                        <td className="p-3 text-neutral-950">
                          {consulta.compradores.nombre} {consulta.compradores.apellido}
                        </td>
                        <td className="p-3 text-neutral-800">{consulta.compradores.telefono}</td>
                        <td className="p-3 text-sm text-neutral-800">
                          {new Date(consulta.created_at).toLocaleDateString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : (
              <p className="mt-4 text-neutral-800">Todavía no recibiste consultas.</p>
            )}
          </section>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-neutral-950">Mis datos</h2>
            <Link
              href="/panel/perfil"
              className="text-brand-900 text-sm font-semibold whitespace-nowrap underline underline-offset-4"
            >
              Editar perfil
            </Link>
          </div>
          <Card className="mt-4 p-6">
            <p className="font-display text-lg font-semibold text-neutral-950">{socio.nombre}</p>
            <p className="mt-1 text-sm text-neutral-800">{user.email}</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
