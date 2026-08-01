'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaCampo, MODALIDADES_CAMPO, TIPOS_CAMPO, type z } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';
import { SelectorUbicacion } from '@cair/ui/SelectorUbicacion';
import { EntradaCoordenadas } from '@cair/ui/EntradaCoordenadas';
import { SelectorPaisProvinciaLocalidad } from '@cair/ui/SelectorPaisProvinciaLocalidad';
import { env } from '@/lib/env';
import { FormField } from '@cair/ui/FormField';
import { FormTextarea } from '@cair/ui/FormTextarea';
import { FormCheckbox } from '@cair/ui/FormCheckbox';
import { FormSelect } from '@cair/ui/FormSelect';
import { Button } from '@cair/ui/Button';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO } from '@cair/shared';
import { SubidaFotos } from './subida-fotos';
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
  fotos = [],
}: {
  socioId: string;
  campoExistente?: Tables<'campos'>;
  fotos?: Pick<Tables<'campo_fotos'>, 'id' | 'object_key' | 'orden'>[];
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CamposFormularioEntrada, unknown, CamposFormulario>({
    resolver: zodResolver(esquemaCamposFormulario),
    defaultValues: campoExistente
      ? {
          titulo: campoExistente.titulo,
          descripcion: campoExistente.descripcion ?? '',
          hectareas: campoExistente.hectareas,
          precio_usd: campoExistente.precio_usd ?? '',
          // La columna es `text` con `check` en Postgres: el tipo generado
          // por Supabase la ve como `string` a secas, no como el enum que el
          // `check` en los hechos garantiza.
          pais: campoExistente.pais as CamposFormularioEntrada['pais'],
          provincia: campoExistente.provincia,
          localidad: campoExistente.localidad,
          modalidad: campoExistente.modalidad as CamposFormularioEntrada['modalidad'],
          tipo_campo: campoExistente.tipo_campo as CamposFormularioEntrada['tipo_campo'],
          publicado: campoExistente.publicado,
        }
      : { pais: 'Argentina', modalidad: 'venta', tipo_campo: 'agricola', publicado: false },
  });

  const pais = useWatch({ control, name: 'pais' });
  const provincia = useWatch({ control, name: 'provincia' });
  const localidad = useWatch({ control, name: 'localidad' });
  const [centrarEn, setCentrarEn] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [posicionEscrita, setPosicionEscrita] = useState<{ lat: number; lng: number } | undefined>(
    undefined,
  );

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

    // `descripcion`/`precio_usd` son opcionales en el formulario
    // (`undefined` si se dejan vacíos) pero las columnas son `| null` —
    // nunca `undefined` en el payload que recibe Supabase.
    const datosAGuardar = {
      ...validado.data,
      descripcion: validado.data.descripcion ?? null,
      precio_usd: validado.data.precio_usd ?? null,
    };

    const supabase = clienteNavegador();

    if (campoExistente) {
      const { error } = await supabase
        .from('campos')
        .update(datosAGuardar)
        .eq('id', campoExistente.id);
      if (error) {
        setErrorGeneral('No se pudo guardar el campo. Intentá de nuevo.');
        return;
      }
      router.push('/panel');
      router.refresh();
      return;
    }

    // Un campo nuevo no tiene id todavía, y las fotos necesitan uno (van a
    // R2 bajo `campos/{campo_id}/...`) — por eso el alta redirige a editar
    // en vez de al panel, para recién ahí habilitar la carga de fotos.
    const { data: nuevoCampo, error } = await supabase
      .from('campos')
      .insert({ ...datosAGuardar, socio_id: socioId })
      .select('id')
      .single();

    if (error) {
      setErrorGeneral('No se pudo guardar el campo. Intentá de nuevo.');
      return;
    }

    router.push(`/panel/campos/${nuevoCampo.id}/editar`);
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
    <form
      onSubmit={(event) => void handleSubmit(alEnviar)(event)}
      className="mt-6 flex flex-col gap-4"
    >
      <FormField
        label="Título"
        type="text"
        error={errors.titulo?.message}
        {...register('titulo')}
      />

      <FormTextarea
        label="Descripción (opcional)"
        error={errors.descripcion?.message}
        {...register('descripcion')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Hectáreas"
          type="number"
          step="any"
          error={errors.hectareas?.message}
          {...register('hectareas')}
        />

        <FormField
          label="Precio (USD, opcional)"
          type="number"
          step="any"
          placeholder="Dejalo vacío para publicar sin precio"
          error={errors.precio_usd?.message}
          {...register('precio_usd')}
        />
      </div>

      <SelectorPaisProvinciaLocalidad
        pais={pais}
        provincia={provincia}
        localidad={localidad}
        errorPais={errors.pais?.message}
        errorProvincia={errors.provincia?.message}
        errorLocalidad={errors.localidad?.message}
        onCambiarPais={(nuevoPais) => {
          setValue('pais', nuevoPais as CamposFormularioEntrada['pais'], {
            shouldValidate: true,
          });
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect label="Modalidad" error={errors.modalidad?.message} {...register('modalidad')}>
          {MODALIDADES_CAMPO.map((modalidad) => (
            <option key={modalidad} value={modalidad}>
              {ETIQUETAS_MODALIDAD_CAMPO[modalidad]}
            </option>
          ))}
        </FormSelect>

        <FormSelect
          label="Tipo de campo"
          error={errors.tipo_campo?.message}
          {...register('tipo_campo')}
        >
          {TIPOS_CAMPO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {ETIQUETAS_TIPO_CAMPO[tipo]}
            </option>
          ))}
        </FormSelect>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-neutral-950">Ubicación</p>
        <p className="text-sm text-neutral-800">
          Hacé clic en el mapa para marcar dónde está el campo, o escribí las coordenadas exactas
          más abajo. Podés arrastrar el pin para ajustarlo.
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

      {campoExistente && <SubidaFotos campoId={campoExistente.id} fotos={fotos} />}

      <FormCheckbox label="Publicar este campo" {...register('publicado')} />

      {errorGeneral && <p className="text-danger text-sm">{errorGeneral}</p>}

      <div className="mt-2 flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar'}
        </Button>

        {campoExistente && (
          <button
            type="button"
            onClick={() => void alEliminar()}
            className="text-danger text-sm underline underline-offset-4"
          >
            Eliminar campo
          </button>
        )}
      </div>
    </form>
  );
}
