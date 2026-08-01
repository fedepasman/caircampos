import Link from 'next/link';
import { BotonCerrarSesion } from '@/components/boton-cerrar-sesion';

/**
 * Chrome del panel de admin: nav simple, no un sidebar completo como el de
 * `apps/web/panel` — acá hay nada más tres destinos reales (Moderación,
 * Estadísticas, Socios). `/ingresar` queda fuera de este Route Group.
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-600 bg-neutral-200 px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-display text-brand-900 text-lg font-semibold">Panel CAIR</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/moderacion"
              className="hover:text-brand-900 text-sm font-semibold text-neutral-900"
            >
              Moderación
            </Link>
            <Link
              href="/estadisticas"
              className="hover:text-brand-900 text-sm font-semibold text-neutral-900"
            >
              Estadísticas
            </Link>
            <Link
              href="/socios"
              className="hover:text-brand-900 text-sm font-semibold text-neutral-900"
            >
              Socios
            </Link>
          </nav>
        </div>
        <BotonCerrarSesion />
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  );
}
