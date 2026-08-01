import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { buttonStyles } from '@cair/ui/Button';
import { TablaSocios } from './tabla-socios';

export const metadata: Metadata = {
  title: 'Socios',
};

export default async function SociosPage() {
  const supabase = await clienteServidor();

  // Defensa en profundidad además del proxy (apps/admin/src/proxy.ts): nunca
  // autorizar en una sola capa.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata.rol !== 'admin') {
    redirect('/ingresar');
  }

  // RLS ya deja ver todos los socios (publicados o no) a un JWT con rol
  // admin (01_socios.sql).
  const { data: socios } = await supabase
    .from('socios')
    .select('id, nro_socio, nombre, telefono, provincia, localidad, latitud, publicado')
    .order('nombre');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">
          Inmobiliarias socias
        </h1>
        <Link href="/socios/nuevo" className={buttonStyles('primary')}>
          Nueva inmobiliaria
        </Link>
      </div>

      {socios && socios.length > 0 ? (
        <TablaSocios socios={socios} />
      ) : (
        <p className="text-neutral-800">Todavía no hay inmobiliarias cargadas.</p>
      )}
    </div>
  );
}
