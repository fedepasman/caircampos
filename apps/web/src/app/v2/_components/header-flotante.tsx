import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { MenuMobil } from '@/components/menu-mobil';
import type { ClienteCair } from '@cair/supabase';

// No hay un tipo `User` re-exportado desde `@cair/supabase` (solo tipos de
// tabla) — se deriva del propio método en vez de importar
// `@supabase/supabase-js` directo, que no es una dependencia declarada de
// `apps/web` (solo llega transitivamente a través de `@cair/supabase`).
type Usuario = Awaited<ReturnType<ClienteCair['auth']['getUser']>>['data']['user'];

// Institucional es por ahora un placeholder (ver `/v2/institucional`) y
// "Buscador" reemplaza a los "Comprar"/"Alquilar" separados del sitio real
// — un único acceso al listado completo, sin modalidad fija. Una sola
// fuente para el nav de escritorio y el de `MenuMobil` (antes estaban
// duplicados: el mobile seguía mostrando el nav viejo del sitio real
// aunque el de escritorio ya se hubiera actualizado acá).
const ENLACES_NAV = [
  { href: '/v2/institucional', etiqueta: 'Institucional' },
  { href: '/v2/inmobiliarias', etiqueta: 'Entidades Rurales' },
  { href: '/v2/campos', etiqueta: 'Buscador' },
  { href: '/v2/noticias', etiqueta: 'Noticias' },
];

/**
 * Header pill flotante con margen sobre la imagen del hero — la pieza que
 * más le gustó al usuario de la referencia visual. Mismos destinos que el
 * header de siempre (`(sitio)/layout.tsx`), no se inventa navegación nueva;
 * solo cambia el envoltorio visual (pill flotante en vez de barra pegada
 * arriba). `user` llega como prop desde `layout.tsx`, que ya hace el
 * `getUser()` — evita duplicar esa llamada acá.
 *
 * `fixed`, no `sticky`: tiene que quedar superpuesto sobre la foto del hero
 * desde el primer render (la foto ocupa el alto completo del viewport,
 * incluido detrás de donde cae el header) y seguir flotando sobre el resto
 * de las secciones al scrollear — es el comportamiento real de la
 * referencia, no solo "pegarse arriba después de scrollear un poco".
 */
export function HeaderFlotante({ user }: { user: Usuario }) {
  return (
    <header className="fixed inset-x-4 top-4 z-50 sm:inset-x-6 sm:top-6">
      {/* Grid de 3 columnas, no flex+justify-between: así el nav queda
          centrado como bloque propio (logo — nav centrado — acciones),
          igual que la referencia, en vez de agrupado junto al logo.
          `auto_1fr_auto`, no `1fr_auto_1fr`: con `1fr_auto_1fr` la columna
          del medio (el nav) se mide por su contenido, y en mobile ese
          contenido está `hidden` → esa columna colapsa a 0 y las dos `1fr`
          de los costados reparten el ancho 50/50 entre sí — el borde
          derecho de la columna de acciones quedaba en el medio del header,
          no en el borde real, y el menú hamburguesa colgaba ahí. Con
          `auto_1fr_auto` la del medio es la que siempre absorbe el sobrante
          (visible o no), así que logo y acciones quedan pegados a sus
          bordes reales en cualquier tamaño de pantalla. */}
      <nav className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center rounded-full border border-neutral-600/60 bg-neutral-50/95 px-4 shadow-lg backdrop-blur sm:px-6">
        {/* Logo real de CAIR (ícono + wordmark en un solo archivo) en vez
            del ícono de lucide-react + texto — pensado para fondo claro,
            que es lo único que hay en este header. `width`/`height` fijos
            respetan la relación de aspecto real del archivo (842×310) para
            que Next no lo estire. */}
        <Link href="/v2" className="flex items-center">
          <Image
            src="/imagenes/logo-cair.png"
            alt="CAIR"
            width={842}
            height={310}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <div className="hidden items-center justify-center gap-6 sm:flex">
          {ENLACES_NAV.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="hover:text-brand-900 text-sm font-semibold tracking-wide text-neutral-800 uppercase"
            >
              {enlace.etiqueta}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end gap-4">
          {/* Pill sólida + círculo con flecha, como el "Get Started" de la
              referencia — antes "Ingresar" era solo texto subrayado, se
              perdía al lado del resto del nav. Mismo tratamiento para
              "Mi panel" (el equivalente logueado, mismo lugar del header).
              En mobile el círculo se saca y el padding se achica: aun con
              el borde bien pegado a la derecha (ver comentario del grid,
              arriba), la pill completa con círculo quedaba demasiado ancha
              al lado del botón hamburguesa en una pantalla angosta. */}
          <Link
            href={user ? '/panel' : '/ingresar'}
            className="bg-brand-900 flex items-center gap-3 rounded-full px-4 py-2 text-sm font-bold text-neutral-50 hover:opacity-90 sm:py-1.5 sm:pr-1.5 sm:pl-4"
          >
            {user ? 'Mi panel' : 'Ingresar'}
            <span className="text-brand-900 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-50 sm:flex">
              <ArrowRight size={14} />
            </span>
          </Link>
          <MenuMobil enlaces={ENLACES_NAV} mayusculas />
        </div>
      </nav>
    </header>
  );
}
