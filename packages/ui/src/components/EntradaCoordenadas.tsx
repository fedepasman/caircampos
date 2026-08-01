'use client';

import { useState } from 'react';
import { FormField } from './FormField';

interface EntradaCoordenadasProps {
  latitud?: number | undefined;
  longitud?: number | undefined;
  onCambiar: (latitud: number, longitud: number) => void;
}

/**
 * Alternativa a clickear el mapa: dos inputs numéricos para tipear
 * latitud/longitud exactas. Mantiene un borrador propio porque las dos
 * coordenadas se completan de a una — mientras falta la otra, no hay
 * ubicación válida que reportar todavía.
 *
 * Se resincroniza con las props cuando la ubicación cambia desde otro
 * lado (clic o arrastre del pin) ajustando el estado durante el render
 * —no en un efecto— comparando contra el valor anterior: es el patrón
 * que recomienda React para "adjusting state when a prop changes" y evita
 * el re-render en cascada de un `useEffect` que solo deriva estado de props.
 */
export function EntradaCoordenadas({ latitud, longitud, onCambiar }: EntradaCoordenadasProps) {
  const [latitudPrevia, setLatitudPrevia] = useState(latitud);
  const [latBorrador, setLatBorrador] = useState(latitud?.toString() ?? '');
  if (latitud !== latitudPrevia) {
    setLatitudPrevia(latitud);
    setLatBorrador(latitud?.toString() ?? '');
  }

  const [longitudPrevia, setLongitudPrevia] = useState(longitud);
  const [lngBorrador, setLngBorrador] = useState(longitud?.toString() ?? '');
  if (longitud !== longitudPrevia) {
    setLongitudPrevia(longitud);
    setLngBorrador(longitud?.toString() ?? '');
  }

  function intentarNotificar(latTexto: string, lngTexto: string) {
    if (latTexto === '' || lngTexto === '') return;
    const lat = Number(latTexto);
    const lng = Number(lngTexto);
    if (Number.isFinite(lat) && Number.isFinite(lng)) onCambiar(lat, lng);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        label="Latitud exacta (opcional)"
        type="number"
        step="any"
        min={-90}
        max={90}
        value={latBorrador}
        onChange={(evento) => {
          setLatBorrador(evento.target.value);
          intentarNotificar(evento.target.value, lngBorrador);
        }}
      />
      <FormField
        label="Longitud exacta (opcional)"
        type="number"
        step="any"
        min={-180}
        max={180}
        value={lngBorrador}
        onChange={(evento) => {
          setLngBorrador(evento.target.value);
          intentarNotificar(latBorrador, evento.target.value);
        }}
      />
    </div>
  );
}
