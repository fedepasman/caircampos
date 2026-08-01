import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { FormularioSocio } from '../../formulario-socio';

export const metadata: Metadata = {
  title: 'Editar inmobiliaria',
};

export default async function EditarInmobiliariaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await clienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata.rol !== 'admin') {
    redirect('/ingresar');
  }

  const { data: socio } = await supabase.from('socios').select('*').eq('id', id).maybeSingle();

  if (!socio) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Editar inmobiliaria</h1>
      <FormularioSocio socioExistente={socio} />
    </main>
  );
}
