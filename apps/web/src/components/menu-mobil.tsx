'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const ENLACES = [
  { href: '/campos?modalidad=venta', etiqueta: 'Comprar' },
  { href: '/campos?modalidad=arrendamiento', etiqueta: 'Alquilar' },
  { href: '/inmobiliarias', etiqueta: 'Entidades Rurales' },
];

/**
 * Los links de navegación del header (Comprar/Alquilar/Entidades Rurales)
 * viven ocultos por completo debajo de `sm:` (ver layout.tsx) sin ningún
 * reemplazo — en mobile no había forma de llegar a esas páginas desde el
 * header. Esto agrega el botón hamburguesa que faltaba, mismo patrón de
 * panel colapsable que ya usa FiltrosColapsables.
 */
export function MenuMobil() {
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
          {ENLACES.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              onClick={() => {
                setAbierto(false);
              }}
              className="hover:text-brand-900 text-sm font-semibold text-neutral-800"
            >
              {enlace.etiqueta}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
