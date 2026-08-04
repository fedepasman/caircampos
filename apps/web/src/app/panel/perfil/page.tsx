import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { FormularioPerfil } from './formulario-perfil';

export const metadata: Metadata = {
  title: 'Mi perfil',
  // Superficie autenticada: ver la nota de robots en /ingresar/page.tsx.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function PerfilPage() {
  const supabase = await clienteServidor();

  // Defensa en profundidad además del proxy (apps/web/src/proxy.ts): nunca
  // autorizar en una sola capa. `getUser()`, nunca `getSession()`.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ingresar');
  }

  // `.eq('usuario_id', ...)` obligatorio, no redundante con RLS: la política
  // de SELECT de `socios` también deja ver todas las filas `publicado =
  // true` (para el directorio público de /inmobiliarias), así que sin este
  // filtro `.maybeSingle()` recibiría más de una fila y fallaría.
  const { data: socio } = await supabase
    .from('socios')
    .select('*')
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (!socio) {
    redirect('/panel');
  }

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Mi perfil</h1>
      <p className="mt-1 text-neutral-800">
        Estos son tus datos como inmobiliaria socia de CAIR. El email de acceso ({user.email}) y el
        número de socio los administra CAIR directamente.
      </p>
      <FormularioPerfil socio={socio} />
    </main>
  );
}
