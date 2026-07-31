'use client';

import { useSyncExternalStore } from 'react';

const CLAVE_ALMACENAMIENTO = 'cair-cookies-aceptadas';
const escuchas = new Set<() => void>();

function suscribirse(escuchar: () => void) {
  escuchas.add(escuchar);
  return () => escuchas.delete(escuchar);
}

function leerAceptado() {
  return localStorage.getItem(CLAVE_ALMACENAMIENTO) === 'true';
}

// En el servidor no hay localStorage: se asume aceptado para no renderizar
// el aviso ahí y evitar un parpadeo al hidratar. `useSyncExternalStore` está
// pensado exactamente para esta discrepancia servidor/cliente — apenas
// hidrata, vuelve a leer con `leerAceptado()` y corrige sin un efecto propio
// que dispare un `setState` extra (la razón por la que esto no es un simple
// `useState` + `useEffect`).
function leerAceptadoEnServidor() {
  return true;
}

function aceptar() {
  localStorage.setItem(CLAVE_ALMACENAMIENTO, 'true');
  escuchas.forEach((escuchar) => {
    escuchar();
  });
}

/**
 * Aviso de cookies real (no decorativo): el sitio usa la cookie de sesión de
 * Supabase Auth para mantener el login. La aceptación se guarda en
 * localStorage, no en una cookie propia, para no sumar otra cookie más al
 * problema que el aviso describe.
 */
export function AvisoCookies() {
  const aceptado = useSyncExternalStore(suscribirse, leerAceptado, leerAceptadoEnServidor);

  if (aceptado) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-600 bg-neutral-50 px-6 py-4 shadow-lg">
      <p className="text-sm text-neutral-900">
        En este sitio usamos cookies para mantener tu sesión iniciada y ofrecerte una experiencia
        segura. Al continuar navegando, aceptás su uso.
      </p>
      <button
        type="button"
        onClick={aceptar}
        className="bg-accent-400 text-brand-900 shrink-0 rounded-md px-6 py-2 text-sm font-semibold whitespace-nowrap"
      >
        Acepto
      </button>
    </div>
  );
}
