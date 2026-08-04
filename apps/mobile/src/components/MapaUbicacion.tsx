import Mapbox, { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@cair/tokens';
import { env } from '../lib/env';

void Mapbox.setAccessToken(env.EXPO_PUBLIC_MAPBOX_TOKEN);

export function MapaUbicacion({
  latitud,
  longitud,
  onCambiar,
}: {
  latitud: number;
  longitud: number;
  onCambiar: (coords: { latitud: number; longitud: number }) => void;
}) {
  const camaraRef = useRef<Camera>(null);

  // `centerCoordinate` declarativo no siempre dispara la animación en iOS
  // (bug conocido de @rnmapbox/maps): se mueve la cámara a mano cada vez
  // que cambian las coordenadas, en vez de confiar solo en el prop.
  useEffect(() => {
    camaraRef.current?.setCamera({
      centerCoordinate: [longitud, latitud],
      animationDuration: 500,
    });
  }, [latitud, longitud]);

  return (
    <View style={estilos.contenedor}>
      <MapView
        style={estilos.mapa}
        onPress={(feature) => {
          const coordenadas = feature.geometry as unknown as { coordinates: [number, number] };
          const [longitudNueva, latitudNueva] = coordenadas.coordinates;
          onCambiar({ latitud: latitudNueva, longitud: longitudNueva });
        }}
      >
        <Camera ref={camaraRef} defaultSettings={{ centerCoordinate: [longitud, latitud], zoomLevel: 9 }} />
        <PointAnnotation id="ubicacion-campo" coordinate={[longitud, latitud]}>
          <View style={estilos.pin} />
        </PointAnnotation>
      </MapView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    height: 220,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  mapa: {
    flex: 1,
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand[600],
    borderWidth: 2,
    borderColor: colors.neutral[50],
  },
});
