import Link from 'next/link';
import { Sprout } from 'lucide-react';
import { clienteServidor } from '@/lib/supabase/server';
import { AvisoCookies } from '@/components/aviso-cookies';
import { MenuMobil } from '@/components/menu-mobil';

/**
 * Chrome del sitio público (Persuade), adoptado desde
 * Base_Stitch/cair_home/DESIGN.md — ver /DESIGN.md en la raíz. `/panel`
 * tiene su propio chrome (el sidebar de `apps/web/src/app/panel/layout.tsx`)
 * — juntar los dos duplicaría la marca, por eso viven en Route Groups
 * separados en vez de en el layout raíz. Ninguno de los dos cambia las URLs.
 *
 * Recortes deliberados frente al mockup: el logo es un ícono + wordmark de
 * texto, no la imagen del mockup (no hay un logo real todavía). Y no hay
 * botón "Publicar" — publicar un campo es una acción de socio ya logueado
 * (`/panel`), no algo que se ofrezca a cualquier visitante. "Entidades
 * Rurales" sí tiene destino: el directorio de inmobiliarias en
 * `/inmobiliarias`.
 */
export default async function SitioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-600 bg-neutral-50">
        <nav className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-display text-brand-900 flex items-center gap-2 text-xl font-bold"
            >
              <Sprout size={22} className="text-accent-400" />
              CAIR
            </Link>
            <div className="hidden items-center gap-6 sm:flex">
              <Link
                href="/campos?modalidad=venta"
                className="hover:text-brand-900 text-sm font-semibold text-neutral-800"
              >
                Comprar
              </Link>
              <Link
                href="/campos?modalidad=arrendamiento"
                className="hover:text-brand-900 text-sm font-semibold text-neutral-800"
              >
                Alquilar
              </Link>
              <Link
                href="/inmobiliarias"
                className="hover:text-brand-900 text-sm font-semibold text-neutral-800"
              >
                Entidades Rurales
              </Link>
              <Link
                href="/noticias"
                className="hover:text-brand-900 text-sm font-semibold text-neutral-800"
              >
                Noticias
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/panel"
                className="bg-brand-900 rounded-md px-4 py-2 text-sm font-bold text-neutral-50 hover:opacity-90"
              >
                Mi panel
              </Link>
            ) : (
              <Link href="/ingresar" className="text-brand-900 text-sm font-bold hover:underline">
                Ingresar
              </Link>
            )}
            <MenuMobil />
          </div>
        </nav>
      </header>
      {children}
      <AvisoCookies />
    </>
  );
}
