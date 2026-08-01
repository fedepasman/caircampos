import Link from 'next/link';
import { LayoutDashboard, MessageCircle, Plus, Sprout } from 'lucide-react';
import { BotonCerrarSesion } from '@/components/boton-cerrar-sesion';
import { buttonStyles } from '@cair/ui/Button';

/**
 * Chrome del panel de socios (Operate, no Persuade — ver /DESIGN.md): un
 * sidebar reemplaza el header del sitio público, con el wordmark adentro.
 * Solo enlaza a lo que existe de verdad: "Mis campos" y "Consultas" son
 * anclas dentro de /panel, no rutas nuevas — no hay "Saved Properties" ni
 * "Market Reports" del comp de Stitch porque esas funciones no existen.
 *
 * En mobile el sidebar de 256px no cabe: colapsa a una barra horizontal
 * arriba (`flex-col` en el contenedor, `sm:flex-row` recién desde tablet),
 * con los links en fila e íconos sin texto hasta `sm:`.
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="flex items-center gap-2 border-b border-neutral-600 bg-neutral-200 p-4 sm:w-64 sm:flex-none sm:flex-col sm:items-stretch sm:border-r sm:border-b-0">
        <Link
          href="/panel"
          className="font-display text-brand-900 text-lg font-semibold sm:mb-6 sm:px-2 sm:py-2"
        >
          CAIR
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto sm:flex-none sm:flex-col sm:items-stretch sm:overflow-visible">
          <Link
            href="/panel"
            title="Panel"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap text-neutral-900 hover:bg-neutral-300"
          >
            <LayoutDashboard size={18} />
            <span className="hidden sm:inline">Panel</span>
          </Link>
          <Link
            href="/panel#mis-campos"
            title="Mis campos"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap text-neutral-900 hover:bg-neutral-300"
          >
            <Sprout size={18} />
            <span className="hidden sm:inline">Mis campos</span>
          </Link>
          <Link
            href="/panel#consultas"
            title="Consultas"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap text-neutral-900 hover:bg-neutral-300"
          >
            <MessageCircle size={18} />
            <span className="hidden sm:inline">Consultas</span>
          </Link>
        </nav>

        <Link
          href="/panel/campos/nuevo"
          title="Cargar campo nuevo"
          className={`${buttonStyles('primary')} flex items-center justify-center gap-2 px-3 py-2 text-center whitespace-nowrap sm:px-6 sm:py-3`}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Cargar campo nuevo</span>
        </Link>

        <div className="sm:mt-2 sm:border-t sm:border-neutral-600 sm:pt-4">
          <BotonCerrarSesion />
        </div>
      </aside>

      <div className="flex-1 px-6 py-8 sm:px-12 sm:py-12">{children}</div>
    </div>
  );
}
