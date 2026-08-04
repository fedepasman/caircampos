import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ETIQUETAS_TIPO_CAMPO, formatearPrecioUsd } from '@cair/shared';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';
import type { CampoListado } from '../lib/queries/campos';
import { urlFotoCampo } from '../lib/url-foto-campo';

export function TarjetaCampo({ campo, onPress }: { campo: CampoListado; onPress: () => void }) {
  const [anchoCarrusel, setAnchoCarrusel] = useState(0);
  const [fotoActual, setFotoActual] = useState(0);
  const fotos = [...campo.campo_fotos].sort((a, b) => a.orden - b.orden);

  return (
    <View style={estilos.tarjeta}>
      <View
        style={estilos.carrusel}
        onLayout={(evento) => {
          setAnchoCarrusel(evento.nativeEvent.layout.width);
        }}
      >
        {fotos.length > 0 && anchoCarrusel > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(evento) => {
              setFotoActual(Math.round(evento.nativeEvent.contentOffset.x / anchoCarrusel));
            }}
          >
            {fotos.map((foto, indice) => (
              <Pressable
                key={`${foto.object_key}-${String(indice)}`}
                style={{ width: anchoCarrusel }}
                onPress={onPress}
              >
                <Image source={{ uri: urlFotoCampo(foto.object_key) }} style={estilos.foto} />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Pressable style={[estilos.foto, estilos.fotoVacia]} onPress={onPress} />
        )}

        {fotos.length > 1 && (
          <View style={estilos.puntos}>
            {fotos.map((foto, indice) => (
              <View
                key={`${foto.object_key}-${String(indice)}`}
                style={[estilos.punto, indice === fotoActual && estilos.puntoActivo]}
              />
            ))}
          </View>
        )}
      </View>

      <Pressable style={estilos.contenido} onPress={onPress}>
        <Text style={estilos.titulo} numberOfLines={1}>
          {campo.titulo}
        </Text>
        <Text style={estilos.ubicacion} numberOfLines={1}>
          {campo.localidad}, {campo.provincia}
        </Text>
        <Text style={estilos.detalle}>
          {campo.hectareas} ha · {ETIQUETAS_TIPO_CAMPO[campo.tipo_campo]}
        </Text>
        <Text style={estilos.precio} numberOfLines={1}>
          {formatearPrecioUsd(campo.precio_usd)}
        </Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    marginBottom: spacing[6],
  },
  carrusel: {
    aspectRatio: 4 / 3,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
  },
  foto: {
    height: '100%',
  },
  fotoVacia: {
    flex: 1,
  },
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
  contenido: {
    paddingTop: spacing[3],
    gap: spacing[1],
  },
  titulo: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  ubicacion: {
    fontSize: fontSize.base,
    color: colors.neutral[800],
  },
  detalle: {
    fontSize: fontSize.sm,
    color: colors.neutral[800],
  },
  precio: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginTop: spacing[1],
  },
});
