import type { Metadata } from 'next';
import Link from 'next/link';
import { clienteServidor } from '@/lib/supabase/server';
import { buttonStyles } from '@cair/ui/Button';
import { FormularioNuevaContrasena } from './formulario-nueva-contrasena';

export const metadata: Metadata = {
  title: 'Restablecer contraseña',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function RestablecerContrasenaPage() {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-neutral-100 px-6 py-16">
      <div className="w-full max-w-sm rounded-lg border border-neutral-600 bg-neutral-50 p-8 shadow-lg">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">
          Restablecer contraseña
        </h1>

        {user ? (
          <>
            <p className="mt-1 text-sm text-neutral-800">Elegí tu contraseña nueva.</p>
            <FormularioNuevaContrasena />
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-neutral-800">
              Este link ya venció o no es válido. Pedí uno nuevo para restablecer tu contraseña.
            </p>
            <Link
              href="/recuperar-contrasena"
              className={`${buttonStyles('primary')} mt-4 block text-center`}
            >
              Pedir un link nuevo
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
