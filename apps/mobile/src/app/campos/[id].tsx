import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO, formatearPrecioUsd } from '@cair/shared';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';
import { Encabezado } from '../../components/Encabezado';
import { MapaUbicacion } from '../../components/MapaUbicacion';
import { useCampo } from '../../lib/queries/campos';
import { urlFotoCampo } from '../../lib/url-foto-campo';

export default function Ficha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: campo, isLoading, isError } = useCampo(id);
  const { width } = useWindowDimensions();
  const [fotoActual, setFotoActual] = useState(0);

  if (isLoading) {
    return (
      <View style={estilos.centrado}>
        <ActivityIndicator color={colors.brand[600]} />
      </View>
    );
  }

  if (isError || !campo) {
    return (
      <View style={estilos.centrado}>
        <Text style={estilos.mensaje}>No se pudo cargar este campo.</Text>
      </View>
    );
  }

  const fotos = [...campo.campo_fotos].sort((a, b) => a.orden - b.orden);

  return (
    <ScrollView style={estilos.contenedor} showsVerticalScrollIndicator={false}>
      <View>
        {fotos.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(evento) => {
              setFotoActual(Math.round(evento.nativeEvent.contentOffset.x / width));
            }}
          >
            {fotos.map((foto) => (
              <Image
                key={foto.id}
                source={{ uri: urlFotoCampo(foto.object_key) }}
                style={[estilos.foto, { width }]}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[estilos.foto, estilos.fotoVacia, { width }]} />
        )}

        <Encabezado transparente />

        {fotos.length > 1 && (
          <View style={estilos.puntos}>
            {fotos.map((foto, indice) => (
              <View
                key={foto.id}
                style={[estilos.punto, indice === fotoActual && estilos.puntoActivo]}
              />
            ))}
          </View>
        )}

        <View style={estilos.pills}>
          <View style={estilos.pill}>
            <Text style={estilos.pillTexto}>{ETIQUETAS_MODALIDAD_CAMPO[campo.modalidad]}</Text>
          </View>
          <View style={estilos.pill}>
            <Text style={estilos.pillTexto}>{ETIQUETAS_TIPO_CAMPO[campo.tipo_campo]}</Text>
          </View>
        </View>
      </View>

      <View style={estilos.contenido}>
        <Text style={estilos.titulo}>{campo.titulo}</Text>
        <Text style={estilos.ubicacion}>
          {campo.localidad}, {campo.provincia}
        </Text>

        <View style={estilos.stats}>
          <View style={estilos.stat}>
            <Text style={estilos.statValor}>{campo.hectareas}</Text>
            <Text style={estilos.statEtiqueta}>Hectáreas</Text>
          </View>
          <View style={estilos.stat}>
            <Text style={estilos.statValor} numberOfLines={1}>
              {formatearPrecioUsd(campo.precio_usd)}
            </Text>
            <Text style={estilos.statEtiqueta}>Por hectárea</Text>
          </View>
        </View>

        {campo.descripcion && (
          <View style={estilos.seccion}>
            <Text style={estilos.seccionTitulo}>Descripción</Text>
            <Text style={estilos.descripcion}>{campo.descripcion}</Text>
          </View>
        )}

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Ubicación</Text>
          <MapaUbicacion latitud={campo.latitud} longitud={campo.longitud} />
        </View>

        <Text style={estilos.publicadoPor}>Publicado por {campo.socios.nombre}</Text>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  mensaje: {
    fontSize: fontSize.base,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  foto: {
    height: 320,
    backgroundColor: colors.neutral[100],
  },
  fotoVacia: {},
  puntos: {
    position: 'absolute',
    bottom: spacing[3],
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[1],
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  puntoActivo: {
    backgroundColor: colors.neutral[50],
  },
  pills: {
    position: 'absolute',
    top: spacing[16],
    left: spacing[4],
    flexDirection: 'row',
    gap: spacing[2],
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  pillTexto: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  contenido: {
    padding: spacing[4],
    gap: spacing[1],
  },
  titulo: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  ubicacion: {
    fontSize: fontSize.base,
    color: colors.neutral[600],
    marginBottom: spacing[3],
  },
  stats: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  stat: {
    flex: 1,
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[100],
    padding: spacing[3],
    alignItems: 'center',
  },
  statValor: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.brand[700],
  },
  statEtiqueta: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
  },
  seccion: {
    marginTop: spacing[4],
    gap: spacing[2],
  },
  seccionTitulo: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  descripcion: {
    fontSize: fontSize.base,
    color: colors.neutral[800],
    lineHeight: 22,
  },
  publicadoPor: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing[6],
    marginBottom: spacing[4],
  },
});
