import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';

export function SelectorChips<T extends string>({
  etiqueta,
  opciones,
  etiquetas,
  valor,
  onCambiar,
}: {
  etiqueta: string;
  opciones: readonly T[];
  etiquetas: Record<T, string>;
  valor: T;
  onCambiar: (valor: T) => void;
}) {
  return (
    <View style={estilos.contenedor}>
      {etiqueta && <Text style={estilos.etiqueta}>{etiqueta}</Text>}
      <View style={estilos.fila}>
        {opciones.map((opcion) => {
          const seleccionado = opcion === valor;
          return (
            <Pressable
              key={opcion}
              style={[estilos.chip, seleccionado && estilos.chipSeleccionado]}
              onPress={() => {
                onCambiar(opcion);
              }}
            >
              <Text style={[estilos.chipTexto, seleccionado && estilos.chipTextoSeleccionado]}>
                {etiquetas[opcion]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: spacing[1],
  },
  etiqueta: {
    fontSize: fontSize.sm,
    color: colors.neutral[700],
  },
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.neutral[50],
  },
  chipSeleccionado: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[50],
  },
  chipTexto: {
    fontSize: fontSize.sm,
    color: colors.neutral[700],
  },
  chipTextoSeleccionado: {
    color: colors.brand[600],
    fontWeight: fontWeight.semibold,
  },
});
