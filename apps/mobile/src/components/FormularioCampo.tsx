import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  MODALIDADES_CAMPO,
  PAISES,
  TIPOS_CAMPO,
  esquemaCampo,
  type z,
} from '@cair/schemas';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO } from '@cair/shared';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';
import type { Tables } from '@cair/supabase';
import { CampoTexto } from './CampoTexto';
import { SelectorChips } from './SelectorChips';
import { SelectorProvinciaLocalidad } from './SelectorProvinciaLocalidad';
import { MapaUbicacion } from './MapaUbicacion';
import { SubidaFotos } from './SubidaFotos';
import { supabase } from '../lib/supabase';
import type { FotoCampo } from '../lib/queries/panel';

const ETIQUETAS_PAIS: Record<(typeof PAISES)[number], string> = {
  Argentina: 'Argentina',
  Uruguay: 'Uruguay',
};

type CampoEntrada = z.input<typeof esquemaCampo>;
type CampoSalida = z.output<typeof esquemaCampo>;

export function FormularioCampo({
  socioId,
  campoExistente,
  fotos = [],
}: {
  socioId: string;
  campoExistente?: Tables<'campos'>;
  fotos?: FotoCampo[];
}) {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CampoEntrada, unknown, CampoSalida>({
    resolver: zodResolver(esquemaCampo),
    defaultValues: campoExistente
      ? {
          titulo: campoExistente.titulo,
          descripcion: campoExistente.descripcion ?? '',
          hectareas: campoExistente.hectareas,
          precio_usd: campoExistente.precio_usd ?? '',
          pais: campoExistente.pais as CampoEntrada['pais'],
          provincia: campoExistente.provincia,
          localidad: campoExistente.localidad,
          modalidad: campoExistente.modalidad as CampoEntrada['modalidad'],
          tipo_campo: campoExistente.tipo_campo as CampoEntrada['tipo_campo'],
          latitud: campoExistente.latitud,
          longitud: campoExistente.longitud,
          publicado: campoExistente.publicado,
        }
      : {
          pais: 'Argentina',
          provincia: '',
          localidad: '',
          modalidad: 'venta',
          tipo_campo: 'agricola',
          latitud: -34.6,
          longitud: -58.4,
          publicado: false,
        },
  });

  const pais = watch('pais');
  const provincia = watch('provincia');
  const localidad = watch('localidad');
  const latitud = watch('latitud');
  const longitud = watch('longitud');

  async function alEnviar(datos: CampoSalida) {
    setErrorGeneral(null);

    const datosAGuardar = {
      ...datos,
      descripcion: datos.descripcion ?? null,
      precio_usd: datos.precio_usd ?? null,
    };

    if (campoExistente) {
      const { error } = await supabase.from('campos').update(datosAGuardar).eq('id', campoExistente.id);
      if (error) {
        setErrorGeneral('No se pudo guardar el campo. Intentá de nuevo.');
        return;
      }
      router.replace('/panel');
      return;
    }

    const { data: nuevoCampo, error } = await supabase
      .from('campos')
      .insert({ ...datosAGuardar, socio_id: socioId })
      .select('id')
      .single();

    if (error) {
      setErrorGeneral('No se pudo guardar el campo. Intentá de nuevo.');
      return;
    }

    router.replace(`/panel/campos/${nuevoCampo.id}`);
  }

  function alEliminar() {
    if (!campoExistente) return;
    Alert.alert('Eliminar campo', 'No se puede deshacer. ¿Seguro que querés eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const { error } = await supabase.from('campos').delete().eq('id', campoExistente.id);
            if (error) {
              setErrorGeneral('No se pudo eliminar el campo. Intentá de nuevo.');
              return;
            }
            router.replace('/panel');
          })();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={[estilos.contenido, { paddingBottom: spacing[16] + insets.bottom }]}
    >
      <Controller
        control={control}
        name="titulo"
        render={({ field }) => (
          <CampoTexto
            etiqueta="Título"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.titulo?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="descripcion"
        render={({ field }) => (
          <CampoTexto
            etiqueta="Descripción (opcional)"
            multiline
            numberOfLines={4}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.descripcion?.message}
          />
        )}
      />

      <View style={estilos.fila}>
        <View style={estilos.mitad}>
          <Controller
            control={control}
            name="hectareas"
            render={({ field }) => (
              <CampoTexto
                etiqueta="Hectáreas"
                keyboardType="numeric"
                value={typeof field.value === 'number' || typeof field.value === 'string' ? String(field.value) : ''}
                onChangeText={field.onChange}
                error={errors.hectareas?.message}
              />
            )}
          />
        </View>
        <View style={estilos.mitad}>
          <Controller
            control={control}
            name="precio_usd"
            render={({ field }) => (
              <CampoTexto
                etiqueta="Precio USD (opcional)"
                keyboardType="numeric"
                placeholder="Consultar precio"
                value={typeof field.value === 'number' || typeof field.value === 'string' ? String(field.value) : ''}
                onChangeText={field.onChange}
                error={errors.precio_usd?.message}
              />
            )}
          />
        </View>
      </View>

      <SelectorChips
        etiqueta="País"
        opciones={PAISES}
        etiquetas={ETIQUETAS_PAIS}
        valor={pais}
        onCambiar={(valor) => {
          setValue('pais', valor);
          setValue('provincia', '');
          setValue('localidad', '');
        }}
      />

      <SelectorProvinciaLocalidad
        pais={pais}
        provincia={provincia}
        localidad={localidad}
        onCambiarProvincia={(valor, coords) => {
          setValue('provincia', valor, { shouldValidate: true });
          if (coords) {
            // Retraso a propósito: en iOS, actualizar el mapa en el mismo
            // tick en que se cierra el modal del selector no se aplica —
            // parece un problema de timing entre el cierre del `Modal` de
            // RN y el bridge nativo de @rnmapbox/maps.
            setTimeout(() => {
              setValue('latitud', coords.lat, { shouldValidate: true });
              setValue('longitud', coords.lng, { shouldValidate: true });
            }, 400);
          }
        }}
        onCambiarLocalidad={(valor, coords) => {
          setValue('localidad', valor, { shouldValidate: true });
          if (coords) {
            setTimeout(() => {
              setValue('latitud', coords.lat, { shouldValidate: true });
              setValue('longitud', coords.lng, { shouldValidate: true });
            }, 400);
          }
        }}
      />

      <SelectorChips
        etiqueta="Modalidad"
        opciones={MODALIDADES_CAMPO}
        etiquetas={ETIQUETAS_MODALIDAD_CAMPO}
        valor={watch('modalidad')}
        onCambiar={(valor) => {
          setValue('modalidad', valor);
        }}
      />

      <SelectorChips
        etiqueta="Tipo de campo"
        opciones={TIPOS_CAMPO}
        etiquetas={ETIQUETAS_TIPO_CAMPO}
        valor={watch('tipo_campo')}
        onCambiar={(valor) => {
          setValue('tipo_campo', valor);
        }}
      />

      <View style={estilos.ubicacion}>
        <Text style={estilos.etiqueta}>Ubicación</Text>
        <Text style={estilos.ayuda}>Tocá el mapa para marcar dónde está el campo.</Text>
        <MapaUbicacion
          latitud={Number(latitud)}
          longitud={Number(longitud)}
          onCambiar={({ latitud: nuevaLat, longitud: nuevoLng }) => {
            setValue('latitud', nuevaLat, { shouldValidate: true });
            setValue('longitud', nuevoLng, { shouldValidate: true });
          }}
        />
      </View>

      {campoExistente && <SubidaFotos campoId={campoExistente.id} fotos={fotos} />}

      <View style={estilos.publicar}>
        <Text style={estilos.etiqueta}>Publicar este campo</Text>
        <Controller
          control={control}
          name="publicado"
          render={({ field }) => (
            <Switch
              value={Boolean(field.value)}
              onValueChange={field.onChange}
              trackColor={{ true: colors.brand[600] }}
            />
          )}
        />
      </View>

      {errorGeneral && <Text style={estilos.errorGeneral}>{errorGeneral}</Text>}

      <Pressable
        style={estilos.boton}
        disabled={isSubmitting}
        onPress={() => {
          void handleSubmit(alEnviar)();
        }}
      >
        <Text style={estilos.botonTexto}>{isSubmitting ? 'Guardando…' : 'Guardar'}</Text>
      </Pressable>

      {campoExistente && (
        <Pressable onPress={alEliminar}>
          <Text style={estilos.eliminar}>Eliminar campo</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  contenido: {
    padding: spacing[6],
    gap: spacing[4],
  },
  fila: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  mitad: {
    flex: 1,
  },
  etiqueta: {
    fontSize: fontSize.sm,
    color: colors.neutral[700],
  },
  ayuda: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  ubicacion: {
    gap: spacing[1],
  },
  publicar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorGeneral: {
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  boton: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  botonTexto: {
    color: colors.neutral[50],
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  eliminar: {
    color: colors.danger,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
