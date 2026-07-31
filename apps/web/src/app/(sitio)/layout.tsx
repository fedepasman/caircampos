import Link from 'next/link';
import { clienteServidor } from '@/lib/supabase/server';

/**
 * Chrome del sitio público (Persuade): header con wordmark + Ingresar/Mi
 * panel. `/panel` tiene su propio chrome (el sidebar de
 * `apps/web/src/app/panel/layout.tsx`) — juntar los dos duplicaría la
 * marca, por eso viven en Route Groups separados en vez de en el layout
 * raíz. Ninguno de los dos cambia las URLs.
 */
export default async function SitioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-semibold text-brand-900">
          CAIR
        </Link>
        <Link
          href={user ? '/panel' : '/ingresar'}
          className="text-sm font-semibold text-brand-900 underline underline-offset-4"
        >
          {user ? 'Mi panel' : 'Ingresar'}
        </Link>
      </header>
      {children}
    </>
  );
}
