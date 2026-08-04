import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatearPrecioUsd } from '@cair/shared';
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
        <Text style={estilos.ubicacion} numberOfLines={1}>
          {campo.localidad}, {campo.provincia}
        </Text>
        <View style={estilos.fila}>
          <View style={estilos.badge}>
            <Text style={estilos.badgeTexto}>{campo.modalidad === 'venta' ? 'VENTA' : 'ALQUILER'}</Text>
          </View>
          <Text style={estilos.hectareas}>{campo.hectareas} ha</Text>
        </View>
      </View>

      <View style={estilos.precioContenedor}>
        <Text style={estilos.precio} numberOfLines={1}>
          {formatearPrecioUsd(campo.precio_usd)}
        </Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: spacing[2],
    marginBottom: spacing[3],
  },
  foto: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
  },
  fotoVacia: {
    backgroundColor: colors.neutral[100],
  },
  contenido: {
    flex: 1,
    gap: spacing[1],
  },
  titulo: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  ubicacion: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  badge: {
    backgroundColor: colors.neutral[200],
    borderRadius: radius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  badgeTexto: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  hectareas: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  precioContenedor: {
    maxWidth: 110,
  },
  precio: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    textAlign: 'right',
  },
});
