import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fontSize, fontWeight, spacing } from '@cair/tokens';

export function Encabezado({
  titulo,
  transparente = false,
}: {
  titulo?: string;
  transparente?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        estilos.contenedor,
        { paddingTop: insets.top + spacing[2] },
        transparente ? estilos.transparente : estilos.solido,
      ]}
    >
      <Pressable
        style={[estilos.boton, transparente && estilos.botonTransparente]}
        onPress={() => {
          router.back();
        }}
      >
        <ChevronLeft color={transparente ? colors.neutral[50] : colors.neutral[900]} size={22} />
      </Pressable>
      {titulo && <Text style={estilos.titulo}>{titulo}</Text>}
      <View style={estilos.espaciador} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  solido: {
    backgroundColor: colors.neutral[50],
  },
  transparente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  boton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  botonTransparente: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  titulo: {
    flex: 1,
    textAlign: 'center',
    marginRight: 36,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  espaciador: {
    width: 36,
  },
});
