import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, fontSize } from '@cair/tokens';
import { FormularioCampo } from '../../../components/FormularioCampo';
import { useCampoParaEditar } from '../../../lib/queries/panel';

export default function CampoEditar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: campo, isLoading, isError } = useCampoParaEditar(id);

  if (isLoading) {
    return (
      <View style={estilos.centrado}>
        <ActivityIndicator color={colors.brand[600]} />
      </View>
    );
  }

  if (isError || !campo) {
    return (
      <View style={estilos.centrado}>
        <Text style={estilos.mensaje}>No se pudo cargar este campo.</Text>
      </View>
    );
  }

  return <FormularioCampo socioId={campo.socio_id} campoExistente={campo} fotos={campo.campo_fotos} />;
}

const estilos = StyleSheet.create({
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },
  mensaje: {
    fontSize: fontSize.base,
    color: colors.neutral[600],
  },
});
