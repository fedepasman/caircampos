import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { FormularioNoticia } from '../../formulario-noticia';

export const metadata: Metadata = {
  title: 'Editar noticia',
};

export default async function EditarNoticiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await clienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata.rol !== 'admin') {
    redirect('/ingresar');
  }

  const { data: noticia } = await supabase.from('noticias').select('*').eq('id', id).maybeSingle();

  if (!noticia) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Editar noticia</h1>
      <FormularioNoticia noticiaExistente={noticia} />
    </main>
  );
}
