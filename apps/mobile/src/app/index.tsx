import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '@cair/tokens';

/**
 * Pantalla inicial provisoria.
 *
 * Existe para probar la cadena completa —Expo Router, tokens compartidos,
 * cliente de Supabase— y no para definir la pantalla de inicio real.
 *
 * Los estilos se escriben con StyleSheet consumiendo `@cair/tokens`: es la
 * base que funciona con cualquiera de las dos alternativas de estilado en
 * evaluación. Si se adopta NativeWind, esta pantalla se migra.
 */
export default function Inicio() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.sobretitulo}>Aplicación móvil</Text>
      <Text style={estilos.titulo}>Cámara Argentina de Inmobiliarias Rurales</Text>
      <Text style={estilos.cuerpo}>
        Estructura inicial del proyecto. Sin funcionalidades ni diseño definitivo.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[6],
    backgroundColor: colors.neutral[50],
  },
  sobretitulo: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.brand[600],
  },
  titulo: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  cuerpo: {
    fontSize: fontSize.base,
    color: colors.neutral[600],
  },
});
