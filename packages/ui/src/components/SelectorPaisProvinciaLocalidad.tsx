'use client';

import { useEffect, useState } from 'react';
import {
  incluirValorActualSiFalta,
  obtenerDepartamentosUruguay,
  obtenerLocalidadesArgentina,
  obtenerLocalidadesUruguay,
  obtenerProvinciasArgentina,
  type OpcionGeografica,
} from '@cair/shared';
import { FormSelect } from './FormSelect';

const PAISES = ['Argentina', 'Uruguay'] as const;

interface SelectorPaisProvinciaLocalidadProps {
  pais: string;
  provincia: string;
  localidad: string;
  errorPais?: string | undefined;
  errorProvincia?: string | undefined;
  errorLocalidad?: string | undefined;
  onCambiarPais: (pais: string) => void;
  onCambiarProvincia: (provincia: string) => void;
  onCambiarLocalidad: (localidad: string) => void;
  /**
   * Centroide de la provincia/departamento o localidad recién elegida,
   * para acercar la cámara del mapa sin pegarle una segunda vez a Mapbox.
   */
  onCentrar?: ((lat: number, lng: number) => void) | undefined;
}

/**
 * País → provincia/departamento → localidad en cascada. Uruguay sale de un
 * dataset estático bundleado (`@cair/shared`) — síncrono, se calcula
 * directo en el render, sin estado propio. Argentina sale de la API
 * Georef — sí necesita estado + efecto, porque es la única parte
 * realmente asíncrona de este componente.
 *
 * Los efectos solo disparan el fetch y guardan el resultado en el
 * `.then()`/`.catch()` — nunca marcan un estado de "cargando" de forma
 * síncrona al arrancar, para no pelear con la regla de React que
 * desaconseja `setState` síncrono en el cuerpo de un efecto (el patrón
 * recomendado es actualizar estado solo desde un callback del sistema
 * externo, no antes de invocarlo).
 *
 * No se acopla a React Hook Form (mismo criterio que `SelectorUbicacion`):
 * recibe los tres valores como texto plano y notifica los cambios por
 * callback — el formulario que lo usa decide cómo guardarlos y validarlos.
 */
export function SelectorPaisProvinciaLocalidad({
  pais,
  provincia,
  localidad,
  errorPais,
  errorProvincia,
  errorLocalidad,
  onCambiarPais,
  onCambiarProvincia,
  onCambiarLocalidad,
  onCentrar,
}: SelectorPaisProvinciaLocalidadProps) {
  const [provinciasArgentina, setProvinciasArgentina] = useState<OpcionGeografica[]>([]);
  const [localidadesArgentina, setLocalidadesArgentina] = useState<OpcionGeografica[]>([]);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    if (pais !== 'Argentina') return;

    let cancelado = false;
    obtenerProvinciasArgentina()
      .then((opciones) => {
        if (cancelado) return;
        setProvinciasArgentina(opciones);
        setErrorCarga(null);
      })
      .catch(() => {
        if (!cancelado) setErrorCarga('No se pudieron cargar las provincias. Reintentá.');
      });

    return () => {
      cancelado = true;
    };
  }, [pais]);

  useEffect(() => {
    if (pais !== 'Argentina' || !provincia) return;

    // La provincia guardada puede ser un valor histórico que no matchea
    // ninguna oficial (ver `incluirValorActualSiFalta`) — en ese caso no
    // hay id que resolver contra Georef, así que la lista queda vacía
    // salvo por el propio valor guardado.
    const opcionProvincia = provinciasArgentina.find(
      (opcion) => opcion.nombre.trim().toLowerCase() === provincia.trim().toLowerCase(),
    );
    if (!opcionProvincia) return;

    let cancelado = false;
    obtenerLocalidadesArgentina(opcionProvincia.id)
      .then((opciones) => {
        if (cancelado) return;
        setLocalidadesArgentina(opciones);
        setErrorCarga(null);
      })
      .catch(() => {
        if (!cancelado) setErrorCarga('No se pudieron cargar las localidades. Reintentá.');
      });

    return () => {
      cancelado = true;
    };
  }, [pais, provincia, provinciasArgentina]);

  const provincias =
    pais === 'Uruguay'
      ? obtenerDepartamentosUruguay()
      : pais === 'Argentina'
        ? provinciasArgentina
        : [];

  const localidades =
    pais === 'Uruguay' && provincia
      ? obtenerLocalidadesUruguay(provincia)
      : pais === 'Argentina'
        ? localidadesArgentina
        : [];

  const opcionesProvincia = incluirValorActualSiFalta(provincias, provincia);
  const opcionesLocalidad = incluirValorActualSiFalta(localidades, localidad);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormSelect
          label="País"
          value={pais}
          error={errorPais}
          onChange={(evento) => {
            onCambiarPais(evento.target.value);
          }}
        >
          <option value="" disabled>
            Elegí un país
          </option>
          {PAISES.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </FormSelect>

        <FormSelect
          label="Provincia"
          value={provincia}
          error={errorProvincia}
          disabled={!pais}
          onChange={(evento) => {
            const nombreElegido = evento.target.value;
            onCambiarProvincia(nombreElegido);
            const opcion = opcionesProvincia.find((o) => o.nombre === nombreElegido);
            if (opcion?.lat !== undefined && opcion.lng !== undefined) {
              onCentrar?.(opcion.lat, opcion.lng);
            }
          }}
        >
          <option value="" disabled>
            Elegí una provincia
          </option>
          {opcionesProvincia.map((opcion) => (
            <option key={opcion.id} value={opcion.nombre}>
              {opcion.nombre}
            </option>
          ))}
        </FormSelect>

        <FormSelect
          label="Localidad"
          value={localidad}
          error={errorLocalidad}
          disabled={!provincia}
          onChange={(evento) => {
            const nombreElegido = evento.target.value;
            onCambiarLocalidad(nombreElegido);
            const opcion = opcionesLocalidad.find((o) => o.nombre === nombreElegido);
            if (opcion?.lat !== undefined && opcion.lng !== undefined) {
              onCentrar?.(opcion.lat, opcion.lng);
            }
          }}
        >
          <option value="" disabled>
            Elegí una localidad
          </option>
          {opcionesLocalidad.map((opcion) => (
            <option key={opcion.id} value={opcion.nombre}>
              {opcion.nombre}
            </option>
          ))}
        </FormSelect>
      </div>

      {errorCarga && <p className="text-danger text-sm">{errorCarga}</p>}
    </div>
  );
}
