'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaSocio, type z } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';
import { SelectorUbicacion } from '@cair/ui/SelectorUbicacion';
import { env } from '@/lib/env';
import { FormField } from '@cair/ui/FormField';
import { FormCheckbox } from '@cair/ui/FormCheckbox';
import { Button } from '@cair/ui/Button';
import type { Tables } from '@cair/supabase';

const esquemaSocioFormulario = esquemaSocio.omit({ latitud: true, longitud: true });
// Mismo motivo que en `apps/web/panel/formulario-campo.tsx`: el tipo de
// entrada de React Hook Form (lo que tipean los inputs) difiere del de
// salida (ya validado), y sin distinguirlos el resolver de zod no tipa
// contra `useForm`.
type SocioFormularioEntrada = z.input<typeof esquemaSocioFormulario>;
type SocioFormulario = z.output<typeof esquemaSocioFormulario>;

export function FormularioSocio({ socioExistente }: { socioExistente?: Tables<'socios'> }) {
  const router = useRouter();
  const [ubicacion, setUbicacion] = useState<{ latitud: number; longitud: number } | null>(
    socioExistente?.latitud !== null &&
      socioExistente?.latitud !== undefined &&
      socioExistente.longitud !== null
      ? { latitud: socioExistente.latitud, longitud: socioExistente.longitud }
      : null,
  );
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SocioFormularioEntrada, unknown, SocioFormulario>({
    resolver: zodResolver(esquemaSocioFormulario),
    defaultValues: socioExistente
      ? {
          nombre: socioExistente.nombre,
          nro_socio: socioExistente.nro_socio ?? '',
          telefono: socioExistente.telefono ?? '',
          provincia: socioExistente.provincia ?? '',
          localidad: socioExistente.localidad ?? '',
          publicado: socioExistente.publicado,
        }
      : { publicado: true },
  });

  const provincia = useWatch({ control, name: 'provincia' });
  const localidad = useWatch({ control, name: 'localidad' });
  const [centrarEn, setCentrarEn] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Misma asistencia de cámara que en el alta de campos: acerca el mapa a
  // la zona escrita en provincia/localidad. Nunca coloca el pin — eso lo
  // define únicamente el clic de quien completa el formulario.
  useEffect(() => {
    if (ubicacion || !provincia || !localidad) return;

    const idTimeout = setTimeout(() => {
      const consulta = `${localidad}, ${provincia}, Argentina`;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(consulta)}.json?access_token=${env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=AR&limit=1`;

      fetch(url)
        .then(
          (respuesta) => respuesta.json() as Promise<{ features?: { center: [number, number] }[] }>,
        )
        .then((datos) => {
          const coordenadas = datos.features?.[0]?.center;
          if (coordenadas) {
            setCentrarEn({ lng: coordenadas[0], lat: coordenadas[1] });
          }
        })
        .catch(() => {
          // Es solo una asistencia visual: si falla, el mapa se queda como
          // está y se puede marcar el pin a mano igual.
        });
    }, 600);

    return () => {
      clearTimeout(idTimeout);
    };
  }, [provincia, localidad, ubicacion]);

  async function alEnviar(datos: SocioFormulario) {
    setErrorGeneral(null);

    const validado = esquemaSocio.safeParse({ ...datos, ...ubicacion });
    if (!validado.success) {
      setErrorGeneral('Revisá los datos del formulario.');
      return;
    }

    // Los campos de texto opcionales llegan `undefined` si se dejan
    // vacíos, pero las columnas son `| null` — nunca `undefined` en el
    // payload que recibe Supabase.
    const datosAGuardar = {
      nombre: validado.data.nombre,
      telefono: validado.data.telefono ?? null,
      provincia: validado.data.provincia ?? null,
      localidad: validado.data.localidad ?? null,
      latitud: validado.data.latitud ?? null,
      longitud: validado.data.longitud ?? null,
      publicado: validado.data.publicado,
    };

    const supabase = clienteNavegador();

    if (socioExistente) {
      const { error } = await supabase
        .from('socios')
        .update(datosAGuardar)
        .eq('id', socioExistente.id);

      if (error) {
        setErrorGeneral('No se pudo guardar la inmobiliaria. Intentá de nuevo.');
        return;
      }

      // `nro_socio` queda afuera del GRANT de UPDATE a propósito
      // (01_socios.sql): es un identificador oficial de CAIR, no algo que
      // se escriba con un UPDATE directo. Cambia solo vía esta función, que
      // adentro verifica que quien llama sea admin. La función solo acepta
      // un número (no `null`): una vez asignado, esta pantalla no permite
      // borrarlo, solo reemplazarlo por otro.
      const nroNuevo = validado.data.nro_socio;
      if (nroNuevo !== undefined && nroNuevo !== socioExistente.nro_socio) {
        const { error: errorNumero } = await supabase.rpc('asignar_numero_socio', {
          socio_id_a_actualizar: socioExistente.id,
          numero: nroNuevo,
        });
        if (errorNumero) {
          setErrorGeneral(
            'Se guardó el resto de los datos, pero no se pudo actualizar el número de socio.',
          );
          return;
        }
      }

      router.push('/socios');
      router.refresh();
      return;
    }

    const { error } = await supabase
      .from('socios')
      .insert({ ...datosAGuardar, nro_socio: validado.data.nro_socio ?? null });

    if (error) {
      setErrorGeneral('No se pudo guardar la inmobiliaria. Intentá de nuevo.');
      return;
    }

    router.push('/socios');
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(alEnviar)(event)}
      className="mt-6 flex flex-col gap-4"
    >
      <FormField
        label="Nombre"
        type="text"
        error={errors.nombre?.message}
        {...register('nombre')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Número de socio (opcional)"
          type="number"
          error={errors.nro_socio?.message}
          {...register('nro_socio')}
        />

        <FormField
          label="Teléfono (opcional)"
          type="text"
          error={errors.telefono?.message}
          {...register('telefono')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Provincia (opcional)"
          type="text"
          error={errors.provincia?.message}
          {...register('provincia')}
        />

        <FormField
          label="Localidad (opcional)"
          type="text"
          error={errors.localidad?.message}
          {...register('localidad')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-neutral-950">Ubicación (opcional)</p>
        <p className="text-sm text-neutral-800">
          Hacé clic en el mapa para marcar dónde está la inmobiliaria — sin esto, no aparece en el
          mapa público de "Inmobiliarias Rurales". Podés arrastrar el pin para ajustarlo.
        </p>
        <div className="mt-2 h-72 overflow-hidden rounded-md border border-neutral-600 sm:h-96">
          <SelectorUbicacion
            tokenMapbox={env.NEXT_PUBLIC_MAPBOX_TOKEN}
            latitud={ubicacion?.latitud}
            longitud={ubicacion?.longitud}
            centrarEn={centrarEn}
            onCambiar={(latitud, longitud) => {
              setUbicacion({ latitud, longitud });
            }}
          />
        </div>
      </div>

      <FormCheckbox label="Publicar en el directorio" {...register('publicado')} />

      {errorGeneral && <p className="text-danger text-sm">{errorGeneral}</p>}

      <div className="mt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
