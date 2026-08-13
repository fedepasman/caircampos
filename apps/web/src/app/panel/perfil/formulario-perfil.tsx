'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaPerfilSocio, type z } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';
import { SelectorUbicacion } from '@cair/ui/SelectorUbicacion';
import { EntradaCoordenadas } from '@cair/ui/EntradaCoordenadas';
import { SelectorPaisProvinciaLocalidad } from '@cair/ui/SelectorPaisProvinciaLocalidad';
import { env } from '@/lib/env';
import { FormField } from '@cair/ui/FormField';
import { Button } from '@cair/ui/Button';
import type { Tables } from '@cair/supabase';

const esquemaPerfilSocioFormulario = esquemaPerfilSocio.omit({ latitud: true, longitud: true });
// Mismo motivo que en formulario-campo.tsx / formulario-socio.tsx (admin):
// el tipo de entrada de React Hook Form (lo que tipean los inputs) difiere
// del de salida ya validado, y sin distinguirlos el resolver de zod no tipa
// bien contra `useForm`.
type PerfilFormularioEntrada = z.input<typeof esquemaPerfilSocioFormulario>;
type PerfilFormulario = z.output<typeof esquemaPerfilSocioFormulario>;

export function FormularioPerfil({ socio }: { socio: Tables<'socios'> }) {
  const router = useRouter();
  const [ubicacion, setUbicacion] = useState<{ latitud: number; longitud: number } | null>(
    socio.latitud !== null && socio.longitud !== null
      ? { latitud: socio.latitud, longitud: socio.longitud }
      : null,
  );
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormularioEntrada, unknown, PerfilFormulario>({
    resolver: zodResolver(esquemaPerfilSocioFormulario),
    defaultValues: {
      nombre: socio.nombre,
      telefono: socio.telefono ?? '',
      pais: socio.pais as PerfilFormularioEntrada['pais'],
      provincia: socio.provincia ?? '',
      localidad: socio.localidad ?? '',
    },
  });

  const pais = useWatch({ control, name: 'pais' });
  const provincia = useWatch({ control, name: 'provincia' });
  const localidad = useWatch({ control, name: 'localidad' });
  const [centrarEn, setCentrarEn] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [posicionEscrita, setPosicionEscrita] = useState<{ lat: number; lng: number } | undefined>(
    undefined,
  );

  async function alEnviar(datos: PerfilFormulario) {
    setErrorGeneral(null);
    setGuardado(false);

    const validado = esquemaPerfilSocio.safeParse({ ...datos, ...ubicacion });
    if (!validado.success) {
      setErrorGeneral('Revisá los datos del formulario.');
      return;
    }

    // Los campos de texto opcionales llegan `undefined` si se dejan vacíos,
    // pero las columnas son `| null` — nunca `undefined` en el payload.
    const { error } = await clienteNavegador()
      .from('socios')
      .update({
        nombre: validado.data.nombre,
        telefono: validado.data.telefono ?? null,
        pais: validado.data.pais,
        provincia: validado.data.provincia ?? null,
        localidad: validado.data.localidad ?? null,
        latitud: validado.data.latitud ?? null,
        longitud: validado.data.longitud ?? null,
      })
      .eq('id', socio.id);

    if (error) {
      setErrorGeneral('No se pudieron guardar los cambios. Intentá de nuevo.');
      return;
    }

    setGuardado(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(alEnviar)(event)}
      className="mt-6 flex flex-col gap-4"
    >
      <div>
        <p className="text-sm font-semibold text-neutral-950">Número de socio</p>
        <p className="mt-1 text-neutral-800">{socio.nro_socio ?? 'Sin asignar todavía'}</p>
        <p className="mt-1 text-xs text-neutral-800">Lo asigna CAIR, no se edita desde acá.</p>
      </div>

      <FormField
        label="Nombre"
        type="text"
        error={errors.nombre?.message}
        {...register('nombre')}
      />

      <FormField
        label="Teléfono (opcional)"
        type="text"
        error={errors.telefono?.message}
        {...register('telefono')}
      />

      <SelectorPaisProvinciaLocalidad
        pais={pais}
        provincia={provincia ?? ''}
        localidad={localidad ?? ''}
        errorPais={errors.pais?.message}
        errorProvincia={errors.provincia?.message}
        errorLocalidad={errors.localidad?.message}
        onCambiarPais={(nuevoPais) => {
          setValue('pais', nuevoPais as PerfilFormularioEntrada['pais'], { shouldValidate: true });
          setValue('provincia', '', { shouldValidate: true });
          setValue('localidad', '', { shouldValidate: true });
        }}
        onCambiarProvincia={(nuevaProvincia) => {
          setValue('provincia', nuevaProvincia, { shouldValidate: true });
          setValue('localidad', '', { shouldValidate: true });
        }}
        onCambiarLocalidad={(nuevaLocalidad) => {
          setValue('localidad', nuevaLocalidad, { shouldValidate: true });
        }}
        onCentrar={(lat, lng) => {
          setCentrarEn({ lat, lng });
        }}
      />

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-neutral-950">Ubicación (opcional)</p>
        <p className="text-sm text-neutral-800">
          Hacé clic en el mapa para marcar dónde está tu inmobiliaria, o escribí las coordenadas
          exactas más abajo — sin esto, no aparecés en el mapa público de "Inmobiliarias Rurales".
          Podés arrastrar el pin para ajustarlo.
        </p>
        <div className="mt-2 h-72 overflow-hidden rounded-md border border-neutral-600 sm:h-96">
          <SelectorUbicacion
            tokenMapbox={env.NEXT_PUBLIC_MAPBOX_TOKEN}
            latitud={ubicacion?.latitud}
            longitud={ubicacion?.longitud}
            centrarEn={centrarEn}
            posicionEscrita={posicionEscrita}
            onCambiar={(latitud, longitud) => {
              setUbicacion({ latitud, longitud });
            }}
          />
        </div>
        <div className="mt-2">
          <EntradaCoordenadas
            latitud={ubicacion?.latitud}
            longitud={ubicacion?.longitud}
            onCambiar={(latitud, longitud) => {
              setUbicacion({ latitud, longitud });
              setPosicionEscrita({ lat: latitud, lng: longitud });
            }}
          />
        </div>
      </div>

      {errorGeneral && <p className="text-danger text-sm">{errorGeneral}</p>}
      {guardado && !errorGeneral && <p className="text-success text-sm">Cambios guardados.</p>}

      <div className="mt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
