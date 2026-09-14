'use client';

import { useEffect, useRef, useState } from 'react';
import { formatearNumero } from '@cair/shared';

const DURACION_MS = 1400;

// Ease-out cúbica: arranca rápido y frena hacia el final — se lee mejor que
// una progresión lineal para un contador que sube desde 0.
function suavizar(progreso: number) {
  return 1 - (1 - progreso) ** 3;
}

/**
 * Un número grande + su etiqueta, para la franja de estadísticas reales.
 * Anima de 0 al valor final la primera vez que la tarjeta entra en
 * viewport (no al montar: esta sección vive debajo del hero, así que
 * animaría fuera de vista antes de que alguien llegue a verla). El valor
 * que se anima siempre es el real que ya vino calculado del servidor
 * (`page.tsx`) — nunca se inventa ni se interpola contra otra cosa.
 * Respeta `prefers-reduced-motion`: ahí muestra el valor final directo.
 */
export function EstadisticaDestacada({
  valor,
  sufijo = '',
  etiqueta,
}: {
  valor: number | null;
  sufijo?: string;
  etiqueta: string;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const yaAnimoRef = useRef(false);
  const [valorMostrado, setValorMostrado] = useState(0);

  useEffect(() => {
    if (valor === null) return;
    const valorObjetivo = valor;
    const nodo = contenedorRef.current;
    if (!nodo) return;

    // Se lee acá pero el `setState` para este caso queda dentro del
    // callback del observer (más abajo), no suelto en el cuerpo del
    // efecto — un `setState` síncrono ahí dispara un render en cascada
    // (regla `react-hooks/set-state-in-effect`).
    const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let idFrame: number | undefined;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting || yaAnimoRef.current) return;
        yaAnimoRef.current = true;

        if (prefiereMenosMovimiento) {
          setValorMostrado(valorObjetivo);
          return;
        }

        const inicio = performance.now();
        function tick(ahora: number) {
          const progreso = Math.min((ahora - inicio) / DURACION_MS, 1);
          setValorMostrado(Math.round(valorObjetivo * suavizar(progreso)));
          if (progreso < 1) {
            idFrame = requestAnimationFrame(tick);
          }
        }
        idFrame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observador.observe(nodo);
    return () => {
      observador.disconnect();
      if (idFrame !== undefined) cancelAnimationFrame(idFrame);
    };
  }, [valor]);

  return (
    <div ref={contenedorRef} className="text-center">
      {/* `font-body` (Hanken Grotesk) en negro (900), no `font-display`
          (Libre Caslon Text, serif) — mismo criterio ya acordado para el
          título del hero: la referencia pide números grandes, cuadrados y
          bien negros, y esa lectura sale de la sans de marca en su peso
          máximo, no de la serif. */}
      <p className="font-body text-5xl font-black tracking-tight text-neutral-950">
        {valor === null ? '—' : `${formatearNumero(valorMostrado)}${sufijo}`}
      </p>
      {/* `max-w-[8.5rem] mx-auto`: fuerza el corte a 2 líneas en vez de una
          sola línea larga — a este tamaño más grande, las 4 etiquetas
          entran cómodas en dos renglones centrados. */}
      <p className="mx-auto mt-2 max-w-[8.5rem] text-base text-neutral-700">{etiqueta}</p>
    </div>
  );
}
