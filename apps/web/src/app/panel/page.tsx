import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { BotonCerrarSesion } from './boton-cerrar-sesion';

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
  const { data: socio } = await supabase.from('socios').select('id, nombre').maybeSingle();

  if (!socio) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">Mi panel</h1>
        <p className="mt-4 text-neutral-800">
          Tu cuenta todavía no está vinculada a un socio. Contactá a CAIR para completar el alta.
        </p>
        <div className="mt-8">
          <BotonCerrarSesion />
        </div>
      </main>
    );
  }

  const { data: campos } = await supabase
    .from('campos')
    .select('id, titulo, provincia, localidad, hectareas, publicado')
    .order('created_at', { ascending: false });

  const { data: consultas } = await supabase
    .from('consultas')
    .select('id, mensaje, created_at, campos(titulo), compradores(nombre, apellido, telefono)')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-neutral-950">Mi panel</h1>
          <p className="mt-1 text-neutral-800">Hola, {socio.nombre}.</p>
        </div>
        <BotonCerrarSesion />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-neutral-950">Mis campos</h2>
        {campos && campos.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {campos.map((campo) => (
              <li
                key={campo.id}
                className="flex items-center justify-between rounded-md border border-neutral-600 bg-neutral-50 p-4"
              >
                <div>
                  <p className="font-semibold text-neutral-950">{campo.titulo}</p>
                  <p className="text-sm text-neutral-800">
                    {campo.localidad}, {campo.provincia} · {campo.hectareas} ha
                  </p>
                </div>
                <span
                  className={
                    campo.publicado
                      ? 'rounded-sm bg-brand-900 px-2 py-1 text-xs font-semibold text-neutral-50'
                      : 'rounded-sm bg-neutral-600 px-2 py-1 text-xs font-semibold text-neutral-50'
                  }
                >
                  {campo.publicado ? 'Publicado' : 'Borrador'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-neutral-800">Todavía no tenés campos cargados.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-neutral-950">Consultas recibidas</h2>
        {consultas && consultas.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {consultas.map((consulta) => (
              <li key={consulta.id} className="rounded-md border border-neutral-600 bg-neutral-50 p-4">
                <p className="font-semibold text-neutral-950">{consulta.campos.titulo}</p>
                <p className="text-sm text-neutral-800">
                  {consulta.compradores.nombre} {consulta.compradores.apellido} ·{' '}
                  {consulta.compradores.telefono}
                </p>
                {consulta.mensaje && <p className="mt-2 text-sm text-neutral-900">{consulta.mensaje}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-neutral-800">Todavía no recibiste consultas.</p>
        )}
      </section>
    </main>
  );
}
