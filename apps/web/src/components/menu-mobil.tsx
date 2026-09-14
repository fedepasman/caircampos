'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const ENLACES_POR_DEFECTO = [
  { href: '/campos?modalidad=venta', etiqueta: 'Comprar' },
  { href: '/campos?modalidad=arrendamiento', etiqueta: 'Alquilar' },
  { href: '/inmobiliarias', etiqueta: 'Entidades Rurales' },
  { href: '/noticias', etiqueta: 'Noticias' },
];

/**
 * Los links de navegación del header (Comprar/Alquilar/Entidades Rurales)
 * viven ocultos por completo debajo de `sm:` (ver layout.tsx) sin ningún
 * reemplazo — en mobile no había forma de llegar a esas páginas desde el
 * header. Esto agrega el botón hamburguesa que faltaba, mismo patrón de
 * panel colapsable que ya usa FiltrosColapsables.
 *
 * `enlaces` es opcional, con el valor de siempre como default: este
 * componente lo comparten `(sitio)/layout.tsx` (el sitio real) y
 * `v2/_components/header-flotante.tsx` (el draft), y cada uno tiene un nav
 * de escritorio distinto — sin esto, el menú mobile de `/v2` mostraba el
 * nav viejo aunque el de escritorio ya se hubiera actualizado. El sitio
 * real no pasa la prop, así que sigue exactamente igual que antes.
 *
 * `mayusculas` es el mismo caso: el nav de escritorio de `/v2` lleva
 * `uppercase`, el del sitio real no — opcional y en `false` por defecto
 * para no cambiarle el estilo al sitio real.
 */
export function MenuMobil({
  enlaces = ENLACES_POR_DEFECTO,
  mayusculas = false,
}: {
  enlaces?: { href: string; etiqueta: string }[];
  mayusculas?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => {
          setAbierto((valor) => !valor);
        }}
        aria-expanded={abierto}
        aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        className="text-brand-900 flex items-center justify-center p-2"
      >
        {abierto ? <X size={22} /> : <Menu size={22} />}
      </button>

      {abierto && (
        <nav className="absolute inset-x-0 top-20 flex flex-col gap-4 border-b border-neutral-600 bg-neutral-50 px-6 py-6 shadow-lg">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              onClick={() => {
                setAbierto(false);
              }}
              className={`hover:text-brand-900 text-sm font-semibold text-neutral-800 ${mayusculas ? 'tracking-wide uppercase' : ''}`}
            >
              {enlace.etiqueta}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
