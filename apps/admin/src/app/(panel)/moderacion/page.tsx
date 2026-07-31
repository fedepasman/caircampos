import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { TablaCampos } from './tabla-campos';

export const metadata: Metadata = {
  title: 'Moderación',
};

export default async function ModeracionPage() {
  const supabase = await clienteServidor();

  // Defensa en profundidad además del proxy (apps/admin/src/proxy.ts): nunca
  // autorizar en una sola capa.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata.rol !== 'admin') {
    redirect('/ingresar');
  }

  // RLS ya deja ver todos los campos a un JWT con rol admin (02_campos.sql).
  const { data: campos } = await supabase
    .from('campos')
    .select('id, titulo, provincia, localidad, hectareas, revisado_por_cair, socios(nombre)')
    .order('created_at', { ascending: false });

  const pendientes = campos?.filter((campo) => campo.revisado_por_cair === 'pendiente') ?? [];
  const resto = campos?.filter((campo) => campo.revisado_por_cair !== 'pendiente') ?? [];

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="font-display text-2xl font-semibold text-neutral-950">
          Pendientes de revisión
        </h1>
        {pendientes.length > 0 ? (
          <div className="mt-4">
            <TablaCampos campos={pendientes} mostrarAcciones />
          </div>
        ) : (
          <p className="mt-4 text-neutral-800">No hay campos esperando aprobación.</p>
        )}
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-neutral-950">Todos los campos</h2>
        {resto.length > 0 ? (
          <div className="mt-4">
            <TablaCampos campos={resto} />
          </div>
        ) : (
          <p className="mt-4 text-neutral-800">Todavía no hay más campos.</p>
        )}
      </div>
    </div>
  );
}
