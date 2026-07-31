import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { FormularioCampo } from '../../formulario-campo';

export const metadata: Metadata = {
  title: 'Cargar campo',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function NuevoCampoPage() {
  const supabase = await clienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ingresar');
  }

  const { data: socio } = await supabase.from('socios').select('id').maybeSingle();

  if (!socio) {
    redirect('/panel');
  }

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Cargar campo</h1>
      <FormularioCampo socioId={socio.id} />
    </main>
  );
}
