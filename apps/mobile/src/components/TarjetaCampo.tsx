import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO, formatearPrecioUsd } from '@cair/shared';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';
import type { CampoListado } from '../lib/queries/campos';
import { fotoPortada, urlFotoCampo } from '../lib/url-foto-campo';

export function TarjetaCampo({ campo, onPress }: { campo: CampoListado; onPress: () => void }) {
  const objectKey = fotoPortada(campo.campo_fotos);

  return (
    <Pressable style={estilos.tarjeta} onPress={onPress}>
      {objectKey ? (
        <Image source={{ uri: urlFotoCampo(objectKey) }} style={estilos.foto} />
      ) : (
        <View style={[estilos.foto, estilos.fotoVacia]} />
      )}
      <View style={estilos.contenido}>
        <Text style={estilos.titulo} numberOfLines={1}>
          {campo.titulo}
        </Text>
        <Text style={estilos.precio}>{formatearPrecioUsd(campo.precio_usd)}</Text>
        <Text style={estilos.detalle}>
          {campo.hectareas} ha · {campo.localidad}, {campo.provincia}
        </Text>
        <Text style={estilos.etiquetas}>
          {ETIQUETAS_TIPO_CAMPO[campo.tipo_campo]} · {ETIQUETAS_MODALIDAD_CAMPO[campo.modalidad]}
        </Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: radius.md,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  foto: {
    width: '100%',
    height: 160,
    backgroundColor: colors.neutral[100],
  },
  fotoVacia: {
    backgroundColor: colors.neutral[100],
  },
  contenido: {
    padding: spacing[4],
    gap: spacing[1],
  },
  titulo: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  precio: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.brand[600],
  },
  detalle: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  etiquetas: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    textTransform: 'capitalize',
  },
});
