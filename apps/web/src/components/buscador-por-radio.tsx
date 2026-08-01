'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapaCampos, type CampoParaMapa } from './mapa-campos';

const RADIOS_KM = [10, 25, 50, 100, 200] as const;
type RadioKm = (typeof RADIOS_KM)[number];

function comoRadioValido(valor: string | null): RadioKm | undefined {
  const numero = Number(valor);
  return (RADIOS_KM as readonly number[]).includes(numero) ? (numero as RadioKm) : undefined;
}

/**
 * Envuelve `MapaCampos` con los controles del filtro de zona ("punto 5 del
 * pliego": el índice GiST de `ubicacion` ya existía para esto, sin usarse).
 * Lee/escribe los filtros vía `useSearchParams`/`router.push` en vez de
 * recibirlos como props del server component: así conserva el resto de los
 * filtros activos (modalidad, tipo, precio…) sin tener que repetirlos acá.
 * La navegación resultante sigue rindiendo server-side — esto solo arma la
 * URL, nunca trae los resultados por sí mismo.
 */
export function BuscadorPorRadio({ campos }: { campos: CampoParaMapa[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const latParam = Number(searchParams.get('lat'));
  const lngParam = Number(searchParams.get('lng'));
  const radioParam = comoRadioValido(searchParams.get('radio_km'));
  const zonaActiva =
    Number.isFinite(latParam) && Number.isFinite(lngParam) && radioParam !== undefined
      ? { lat: latParam, lng: lngParam, radioKm: radioParam }
      : undefined;

  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [centroBorrador, setCentroBorrador] = useState<{ lat: number; lng: number } | undefined>(
    zonaActiva,
  );
  const [radioBorrador, setRadioBorrador] = useState<RadioKm>(zonaActiva?.radioKm ?? 50);

  const zonaParaDibujar = centroBorrador
    ? { lat: centroBorrador.lat, lng: centroBorrador.lng, radioKm: radioBorrador }
    : undefined;

  function buscarEnZona() {
    if (!centroBorrador) return;
    const parametros = new URLSearchParams(searchParams);
    parametros.set('lat', centroBorrador.lat.toFixed(6));
    parametros.set('lng', centroBorrador.lng.toFixed(6));
    parametros.set('radio_km', String(radioBorrador));
    parametros.delete('q');
    router.push(`/campos?${parametros.toString()}`);
    setModoSeleccion(false);
  }

  function quitarZona() {
    const parametros = new URLSearchParams(searchParams);
    parametros.delete('lat');
    parametros.delete('lng');
    parametros.delete('radio_km');
    setCentroBorrador(undefined);
    router.push(`/campos?${parametros.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setModoSeleccion((valor) => !valor);
          }}
          className={
            modoSeleccion
              ? 'bg-brand-900 border-brand-900 rounded-sm border px-3 py-1.5 text-sm font-semibold text-neutral-50'
              : 'rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-1.5 text-sm font-semibold text-neutral-950'
          }
        >
          {modoSeleccion ? 'Cancelar selección' : 'Buscar en una zona'}
        </button>

        {modoSeleccion && (
          <>
            <select
              value={radioBorrador}
              onChange={(evento) => {
                setRadioBorrador(Number(evento.target.value) as RadioKm);
              }}
              className="rounded-sm border border-neutral-700 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-950"
            >
              {RADIOS_KM.map((radio) => (
                <option key={radio} value={radio}>
                  {radio} km
                </option>
              ))}
            </select>

            {centroBorrador && (
              <button
                type="button"
                onClick={buscarEnZona}
                className="bg-accent-400 text-brand-900 rounded-sm px-3 py-1.5 text-sm font-semibold"
              >
                Buscar en esta zona
              </button>
            )}
          </>
        )}

        {zonaActiva && !modoSeleccion && (
          <button
            type="button"
            onClick={quitarZona}
            className="text-danger text-sm underline underline-offset-4"
          >
            Quitar filtro de zona
          </button>
        )}
      </div>

      {modoSeleccion && !centroBorrador && (
        <p className="text-xs text-neutral-800">
          Hacé clic en el mapa para marcar el centro de la zona.
        </p>
      )}

      <div className="h-64 overflow-hidden rounded-lg border border-neutral-600 shadow-lg sm:h-80">
        <MapaCampos
          campos={campos}
          zona={zonaParaDibujar}
          onClicMapa={
            modoSeleccion
              ? (lat, lng) => {
                  setCentroBorrador({ lat, lng });
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
