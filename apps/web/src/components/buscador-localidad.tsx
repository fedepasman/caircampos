'use client';

import { useEffect, useRef, useState } from 'react';
import {
  buscarLocalidadesArgentina,
  buscarLocalidadesUruguay,
  type OpcionGeografica,
} from '@cair/shared';

interface BuscadorLocalidadProps {
  name: string;
  defaultValue?: string | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  wrapperClassName?: string | undefined;
}

/**
 * Input de texto con sugerencias de localidad (Argentina vía Georef,
 * Uruguay vía el dataset bundleado de `@cair/shared`), pensado para
 * reemplazar un `<input type="text">` de texto libre dentro de un
 * `<form>` GET nativo sin romperlo: mantiene el mismo `name`, así que el
 * envío del formulario sigue funcionando igual, con o sin JS.
 *
 * Al elegir una sugerencia, el valor que queda en el input es solo el
 * nombre de la localidad — el filtro de `/campos` hace `ilike` sobre
 * columnas separadas (`titulo`/`localidad`/`provincia`), así que un string
 * combinado tipo "Pergamino, Buenos Aires" no matchearía ninguna.
 */
export function BuscadorLocalidad({
  name,
  defaultValue,
  placeholder,
  className,
  wrapperClassName,
}: BuscadorLocalidadProps) {
  const [valor, setValor] = useState(defaultValue ?? '');
  const [sugerencias, setSugerencias] = useState<OpcionGeografica[]>([]);
  const [abierto, setAbierto] = useState(false);
  const idTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const idPeticionRef = useRef(0);

  useEffect(() => {
    return () => {
      clearTimeout(idTimeoutRef.current);
    };
  }, []);

  function buscar(texto: string) {
    clearTimeout(idTimeoutRef.current);

    if (!texto.trim()) {
      setSugerencias([]);
      return;
    }

    idTimeoutRef.current = setTimeout(() => {
      const idPeticion = ++idPeticionRef.current;
      const resultadosUruguay = buscarLocalidadesUruguay(texto);

      buscarLocalidadesArgentina(texto)
        .then((resultadosArgentina) => {
          if (idPeticion !== idPeticionRef.current) return;
          setSugerencias([...resultadosArgentina, ...resultadosUruguay].slice(0, 10));
        })
        .catch(() => {
          if (idPeticion !== idPeticionRef.current) return;
          // Si falla la búsqueda en Argentina (red, Georef caído), mostrar
          // igual lo que sí resolvió (Uruguay) es mejor que no mostrar nada.
          setSugerencias(resultadosUruguay);
        });
    }, 300);
  }

  return (
    <div className={`relative ${wrapperClassName ?? ''}`}>
      <input
        type="text"
        name={name}
        value={valor}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
        onChange={(evento) => {
          setValor(evento.target.value);
          setAbierto(true);
          buscar(evento.target.value);
        }}
        onFocus={() => {
          if (sugerencias.length > 0) setAbierto(true);
        }}
        onBlur={() => {
          setAbierto(false);
        }}
      />

      {abierto && sugerencias.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-sm border border-neutral-600 bg-neutral-50 shadow-lg">
          {sugerencias.map((sugerencia) => (
            <li key={`${sugerencia.pais ?? ''}-${sugerencia.id}`}>
              <button
                type="button"
                // `onMouseDown`, no `onClick`: dispara antes que el `onBlur`
                // del input, así el valor se fija antes de que la lista se
                // cierre por perder el foco.
                onMouseDown={(evento) => {
                  evento.preventDefault();
                  setValor(sugerencia.nombre);
                  setSugerencias([]);
                  setAbierto(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-950 hover:bg-neutral-200"
              >
                {sugerencia.nombre}
                <span className="text-neutral-800">
                  {' — '}
                  {sugerencia.provincia}
                  {sugerencia.pais === 'Uruguay' ? ', Uruguay' : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
