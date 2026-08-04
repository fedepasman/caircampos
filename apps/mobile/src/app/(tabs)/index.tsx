import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MODALIDADES_CAMPO, TIPOS_CAMPO } from '@cair/schemas';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO } from '@cair/shared';
import { colors, fontSize, fontWeight, spacing } from '@cair/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TarjetaCampo } from '../../components/TarjetaCampo';
import { SegmentedControl } from '../../components/SegmentedControl';
import { SelectorChips } from '../../components/SelectorChips';
import { useCampos } from '../../lib/queries/campos';

type Modalidad = (typeof MODALIDADES_CAMPO)[number];
type TipoCampo = (typeof TIPOS_CAMPO)[number];

export default function Listado() {
  const { data: campos, isLoading, isError } = useCampos();
  const insets = useSafeAreaInsets();
  const [modalidad, setModalidad] = useState<Modalidad>('venta');
  const [tipoCampo, setTipoCampo] = useState<TipoCampo>('agricola');

  const filtrados = useMemo(
    () =>
      (campos ?? []).filter(
        (campo) => campo.modalidad === modalidad && campo.tipo_campo === tipoCampo,
      ),
    [campos, modalidad, tipoCampo],
  );

  return (
    <View style={[estilos.contenedor, { paddingTop: insets.top + spacing[2] }]}>
      <View style={estilos.encabezado}>
        <Text style={estilos.wordmark}>CAIR</Text>
      </View>

      <View style={estilos.filtros}>
        <SegmentedControl
          opciones={MODALIDADES_CAMPO}
          etiquetas={ETIQUETAS_MODALIDAD_CAMPO}
          valor={modalidad}
          onCambiar={setModalidad}
        />
        <SelectorChips
          etiqueta=""
          opciones={TIPOS_CAMPO}
          etiquetas={ETIQUETAS_TIPO_CAMPO}
          valor={tipoCampo}
          onCambiar={setTipoCampo}
        />
      </View>

      {isLoading && (
        <View style={estilos.centrado}>
          <ActivityIndicator color={colors.brand[600]} />
        </View>
      )}

      {isError && (
        <View style={estilos.centrado}>
          <Text style={estilos.mensaje}>No se pudieron cargar los campos.</Text>
        </View>
      )}

      {campos && (
        <>
          <Text style={estilos.contador}>{filtrados.length} campos en la zona</Text>

          {filtrados.length === 0 ? (
            <View style={estilos.centrado}>
              <Text style={estilos.mensaje}>No hay campos publicados con estos filtros.</Text>
            </View>
          ) : (
            <FlatList
              data={filtrados}
              keyExtractor={(campo) => campo.id}
              contentContainerStyle={estilos.lista}
              renderItem={({ item }) => (
                <TarjetaCampo
                  campo={item}
                  onPress={() => {
                    router.push(`/campos/${item.id}`);
                  }}
                />
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  encabezado: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  wordmark: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.brand[900],
  },
  filtros: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  contador: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  lista: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  mensaje: {
    fontSize: fontSize.base,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});
