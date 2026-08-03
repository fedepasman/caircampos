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
import { colors, fontSize, fontWeight, spacing } from '@cair/tokens';
import { useCampo } from '../../lib/queries/campos';
import { urlFotoCampo } from '../../lib/url-foto-campo';

export default function Ficha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: campo, isLoading, isError } = useCampo(id);
  const { width } = useWindowDimensions();

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
    <ScrollView style={estilos.contenedor}>
      {fotos.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
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

      <View style={estilos.contenido}>
        <Text style={estilos.titulo}>{campo.titulo}</Text>
        <Text style={estilos.precio}>{formatearPrecioUsd(campo.precio_usd)}</Text>
        <Text style={estilos.detalle}>
          {campo.hectareas} ha · {campo.localidad}, {campo.provincia}
        </Text>
        <Text style={estilos.etiquetas}>
          {ETIQUETAS_TIPO_CAMPO[campo.tipo_campo]} · {ETIQUETAS_MODALIDAD_CAMPO[campo.modalidad]}
        </Text>

        {campo.descripcion && <Text style={estilos.descripcion}>{campo.descripcion}</Text>}

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
    height: 280,
    backgroundColor: colors.neutral[100],
  },
  fotoVacia: {},
  contenido: {
    padding: spacing[6],
    gap: spacing[2],
  },
  titulo: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  precio: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.brand[600],
  },
  detalle: {
    fontSize: fontSize.base,
    color: colors.neutral[600],
  },
  etiquetas: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    textTransform: 'capitalize',
  },
  descripcion: {
    fontSize: fontSize.base,
    color: colors.neutral[800],
    marginTop: spacing[4],
    lineHeight: 22,
  },
  publicadoPor: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing[4],
  },
});
