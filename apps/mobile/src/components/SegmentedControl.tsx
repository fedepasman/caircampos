import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';

export function SegmentedControl<T extends string>({
  opciones,
  etiquetas,
  valor,
  onCambiar,
}: {
  opciones: readonly T[];
  etiquetas: Record<T, string>;
  valor: T;
  onCambiar: (valor: T) => void;
}) {
  return (
    <View style={estilos.pista}>
      {opciones.map((opcion) => {
        const seleccionado = opcion === valor;
        return (
          <Pressable
            key={opcion}
            style={[estilos.segmento, seleccionado && estilos.segmentoSeleccionado]}
            onPress={() => {
              onCambiar(opcion);
            }}
          >
            <Text style={[estilos.texto, seleccionado && estilos.textoSeleccionado]}>
              {etiquetas[opcion]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  pista: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[200],
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  segmento: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    alignItems: 'center',
  },
  segmentoSeleccionado: {
    backgroundColor: colors.neutral[50],
    shadowColor: colors.neutral[950],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  texto: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral[700],
  },
  textoSeleccionado: {
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
});
