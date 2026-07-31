import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { FormularioCampo } from '../../../formulario-campo';

export const metadata: Metadata = {
  title: 'Editar campo',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function EditarCampoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  // RLS ya limita `campos` a los propios del socio (o a los publicados,
  // irrelevante acá): si el campo no existe o es de otro socio, esto da
  // `null` y no una fila ajena.
  const { data: campo } = await supabase.from('campos').select('*').eq('id', id).maybeSingle();

  if (!campo) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Editar campo</h1>
      <FormularioCampo socioId={socio.id} campoExistente={campo} />
    </main>
  );
}
