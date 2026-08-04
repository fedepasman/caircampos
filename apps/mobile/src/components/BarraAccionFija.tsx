import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@cair/tokens';

export function BarraAccionFija({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[estilos.contenedor, { paddingBottom: spacing[3] + insets.bottom }]}>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    backgroundColor: colors.neutral[50],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
});
