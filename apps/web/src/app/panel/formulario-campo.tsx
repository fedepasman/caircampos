'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaCampo, type z } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';
import { SelectorUbicacion } from '@/components/selector-ubicacion';
import { env } from '@/lib/env';
import { FormField } from '@cair/ui/FormField';
import { FormTextarea } from '@cair/ui/FormTextarea';
import { FormCheckbox } from '@cair/ui/FormCheckbox';
import { Button } from '@cair/ui/Button';
import type { Tables } from '@cair/supabase';

const esquemaCamposFormulario = esquemaCampo.omit({ latitud: true, longitud: true });
// `hectareas`/`publicado` usan `z.coerce`: el tipo de entrada de React Hook
// Form (lo que tipean los inputs, antes de coercionar) difiere del tipo de
// salida (lo que llega al submit, ya validado). Sin distinguirlos, el
// resolver de zod no tipa contra `useForm`.
type CamposFormularioEntrada = z.input<typeof esquemaCamposFormulario>;
type CamposFormulario = z.output<typeof esquemaCamposFormulario>;

export function FormularioCampo({
  socioId,
  campoExistente,
}: {
  socioId: string;
  campoExistente?: Tables<'campos'>;
}) {
  const router = useRouter();
  const [ubicacion, setUbicacion] = useState<{ latitud: number; longitud: number } | null>(
    campoExistente ? { latitud: campoExistente.latitud, longitud: campoExistente.longitud } : null,
  );
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CamposFormularioEntrada, unknown, CamposFormulario>({
    resolver: zodResolver(esquemaCamposFormulario),
    defaultValues: campoExistente
      ? {
          titulo: campoExistente.titulo,
          descripcion: campoExistente.descripcion ?? '',
          hectareas: campoExistente.hectareas,
          provincia: campoExistente.provincia,
          localidad: campoExistente.localidad,
          publicado: campoExistente.publicado,
        }
      : { publicado: false },
  });

  const provincia = useWatch({ control, name: 'provincia' });
  const localidad = useWatch({ control, name: 'localidad' });
  const [centrarEn, setCentrarEn] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Asistencia de cámara, no un dato del formulario: acerca el mapa a la
  // zona escrita en provincia/localidad para que el socio no tenga que
  // buscarla a mano en un mapa de Argentina entera. Nunca coloca el pin —
  // eso lo define únicamente el clic del socio (ver DESIGN.md, "no inventar
  // datos"). Se desactiva apenas hay un pin propio, para no arrebatarle al
  // socio una ubicación que ya corrigió.
  useEffect(() => {
    if (ubicacion || !provincia || !localidad) return;

    const idTimeout = setTimeout(() => {
      const consulta = `${localidad}, ${provincia}, Argentina`;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(consulta)}.json?access_token=${env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=AR&limit=1`;

      fetch(url)
        .then((respuesta) => respuesta.json() as Promise<{ features?: { center: [number, number] }[] }>)
        .then((datos) => {
          const coordenadas = datos.features?.[0]?.center;
          if (coordenadas) {
            setCentrarEn({ lng: coordenadas[0], lat: coordenadas[1] });
          }
        })
        .catch(() => {
          // Es solo una asistencia visual: si falla, el mapa se queda como
          // está y el socio igual puede marcar el pin a mano.
        });
    }, 600);

    return () => {
      clearTimeout(idTimeout);
    };
  }, [provincia, localidad, ubicacion]);

  async function alEnviar(datos: CamposFormulario) {
    setErrorGeneral(null);

    if (!ubicacion) {
      setErrorGeneral('Marcá la ubicación en el mapa.');
      return;
    }

    const validado = esquemaCampo.safeParse({ ...datos, ...ubicacion });
    if (!validado.success) {
      setErrorGeneral('Revisá los datos del formulario.');
      return;
    }

    // `descripcion` es opcional en el formulario (`undefined` si se deja
    // vacío) pero la columna es `text | null` — nunca `undefined` en el
    // payload que recibe Supabase.
    const datosAGuardar = { ...validado.data, descripcion: validado.data.descripcion ?? null };

    const supabase = clienteNavegador();

    const { error } = campoExistente
      ? await supabase.from('campos').update(datosAGuardar).eq('id', campoExistente.id)
      : await supabase.from('campos').insert({ ...datosAGuardar, socio_id: socioId });

    if (error) {
      setErrorGeneral('No se pudo guardar el campo. Intentá de nuevo.');
      return;
    }

    router.push('/panel');
    router.refresh();
  }

  async function alEliminar() {
    if (!campoExistente) return;
    if (!window.confirm('¿Eliminar este campo? No se puede deshacer.')) return;

    const { error } = await clienteNavegador().from('campos').delete().eq('id', campoExistente.id);

    if (error) {
      setErrorGeneral('No se pudo eliminar el campo. Intentá de nuevo.');
      return;
    }

    router.push('/panel');
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(alEnviar)(event)} className="mt-6 flex flex-col gap-4">
      <FormField label="Título" type="text" error={errors.titulo?.message} {...register('titulo')} />

      <FormTextarea
        label="Descripción (opcional)"
        error={errors.descripcion?.message}
        {...register('descripcion')}
      />

      <FormField
        label="Hectáreas"
        type="number"
        step="any"
        error={errors.hectareas?.message}
        {...register('hectareas')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Provincia"
          type="text"
          error={errors.provincia?.message}
          {...register('provincia')}
        />

        <FormField
          label="Localidad"
          type="text"
          error={errors.localidad?.message}
          {...register('localidad')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-neutral-950">Ubicación</p>
        <p className="text-sm text-neutral-800">
          Hacé clic en el mapa para marcar dónde está el campo. Podés arrastrar el pin para
          ajustarlo.
        </p>
        <div className="mt-2 h-72 overflow-hidden rounded-md border border-neutral-600 sm:h-96">
          <SelectorUbicacion
            latitud={ubicacion?.latitud}
            longitud={ubicacion?.longitud}
            centrarEn={centrarEn}
            onCambiar={(latitud, longitud) => {
              setUbicacion({ latitud, longitud });
            }}
          />
        </div>
      </div>

      <FormCheckbox label="Publicar este campo" {...register('publicado')} />

      {errorGeneral && <p className="text-sm text-danger">{errorGeneral}</p>}

      <div className="mt-2 flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar'}
        </Button>

        {campoExistente && (
          <button
            type="button"
            onClick={() => void alEliminar()}
            className="text-sm text-danger underline underline-offset-4"
          >
            Eliminar campo
          </button>
        )}
      </div>
    </form>
  );
}
