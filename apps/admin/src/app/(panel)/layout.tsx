import Link from 'next/link';
import { BotonCerrarSesion } from '@/components/boton-cerrar-sesion';

/**
 * Chrome del panel de admin: nav simple, no un sidebar completo como el de
 * `apps/web/panel` — acá hay nada más dos destinos reales (Moderación,
 * Estadísticas). `/ingresar` queda fuera de este Route Group.
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-600 bg-neutral-200 px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg font-semibold text-brand-900">Panel CAIR</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/moderacion"
              className="text-sm font-semibold text-neutral-900 hover:text-brand-900"
            >
              Moderación
            </Link>
            <Link
              href="/estadisticas"
              className="text-sm font-semibold text-neutral-900 hover:text-brand-900"
            >
              Estadísticas
            </Link>
          </nav>
        </div>
        <BotonCerrarSesion />
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  );
}
