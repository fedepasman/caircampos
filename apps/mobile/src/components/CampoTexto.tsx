import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fontSize, radius, spacing } from '@cair/tokens';

export function CampoTexto({
  etiqueta,
  error,
  ...propiedadesInput
}: TextInputProps & { etiqueta: string; error?: string | undefined }) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[estilos.input, error ? estilos.inputConError : null]}
        placeholderTextColor={colors.neutral[400]}
        autoCapitalize="none"
        {...propiedadesInput}
      />
      {error && <Text style={estilos.error}>{error}</Text>}
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
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSize.base,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
  },
  inputConError: {
    borderColor: colors.danger,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.danger,
  },
});
