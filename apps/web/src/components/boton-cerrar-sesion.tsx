'use client';

import { useRouter } from 'next/navigation';
import { clienteNavegador } from '@/lib/supabase/client';

export function BotonCerrarSesion() {
  const router = useRouter();

  async function alHacerClick() {
    await clienteNavegador().auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void alHacerClick()}
      className="text-sm text-neutral-800 underline underline-offset-4"
    >
      Cerrar sesión
    </button>
  );
}
