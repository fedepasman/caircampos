import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { buttonStyles } from '@cair/ui/Button';
import { TablaNoticias } from './tabla-noticias';

export const metadata: Metadata = {
  title: 'Noticias',
};

export default async function NoticiasPage() {
  const supabase = await clienteServidor();

  // Defensa en profundidad además del proxy (apps/admin/src/proxy.ts): nunca
  // autorizar en una sola capa.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata.rol !== 'admin') {
    redirect('/ingresar');
  }

  // RLS ya deja ver todas las noticias (publicadas o no) a un JWT con rol
  // admin (09_noticias.sql).
  const { data: noticias } = await supabase
    .from('noticias')
    .select('id, titulo, categoria, fecha_publicacion, publicado')
    .order('fecha_publicacion', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">Noticias</h1>
        <Link href="/noticias/nuevo" className={buttonStyles('primary')}>
          Nueva noticia
        </Link>
      </div>

      {noticias && noticias.length > 0 ? (
        <TablaNoticias noticias={noticias} />
      ) : (
        <p className="text-neutral-800">Todavía no hay noticias cargadas.</p>
      )}
    </div>
  );
}
