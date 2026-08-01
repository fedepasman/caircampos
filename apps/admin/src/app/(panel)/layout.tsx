import Link from 'next/link';
import { BarChart3, Building2, ClipboardCheck, LayoutDashboard } from 'lucide-react';
import { BotonCerrarSesion } from '@/components/boton-cerrar-sesion';

/**
 * Chrome del panel de admin: sidebar a la izquierda, mismo patrón que
 * `apps/web/src/app/panel/layout.tsx` (panel de socios) — wordmark adentro
 * del sidebar, no un header arriba de la página. Cuatro destinos reales:
 * Panel, Moderación, Estadísticas, Socios. `/ingresar` queda fuera de este
 * Route Group.
 *
 * En mobile el sidebar de 256px no cabe: colapsa a una barra horizontal
 * arriba (`flex-col` en el contenedor, `sm:flex-row` recién desde tablet),
 * con los links en fila e íconos sin texto hasta `sm:` — mismo criterio
 * que el panel de socios.
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col sm:flex-row">
      <aside className="flex items-center gap-2 border-b border-neutral-600 bg-neutral-200 p-4 sm:w-64 sm:flex-none sm:flex-col sm:items-stretch sm:border-r sm:border-b-0">
        <Link
          href="/"
          className="font-display text-brand-900 text-lg font-semibold sm:mb-6 sm:px-2 sm:py-2"
        >
          Panel CAIR
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto sm:flex-none sm:flex-col sm:items-stretch sm:overflow-visible">
          <Link
            href="/"
            title="Panel"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap text-neutral-900 hover:bg-neutral-300"
          >
            <LayoutDashboard size={18} />
            <span className="hidden sm:inline">Panel</span>
          </Link>
          <Link
            href="/moderacion"
            title="Moderación"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap text-neutral-900 hover:bg-neutral-300"
          >
            <ClipboardCheck size={18} />
            <span className="hidden sm:inline">Moderación</span>
          </Link>
          <Link
            href="/estadisticas"
            title="Estadísticas"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap text-neutral-900 hover:bg-neutral-300"
          >
            <BarChart3 size={18} />
            <span className="hidden sm:inline">Estadísticas</span>
          </Link>
          <Link
            href="/socios"
            title="Socios"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap text-neutral-900 hover:bg-neutral-300"
          >
            <Building2 size={18} />
            <span className="hidden sm:inline">Socios</span>
          </Link>
        </nav>

        <div className="sm:mt-2 sm:border-t sm:border-neutral-600 sm:pt-4">
          <BotonCerrarSesion />
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-12 sm:py-12">{children}</main>
    </div>
  );
}
