import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { FormularioSocio } from '../formulario-socio';

export const metadata: Metadata = {
  title: 'Nueva inmobiliaria',
};

export default async function NuevaInmobiliariaPage() {
  const supabase = await clienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata.rol !== 'admin') {
    redirect('/ingresar');
  }

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Nueva inmobiliaria</h1>
      <FormularioSocio />
    </main>
  );
}
