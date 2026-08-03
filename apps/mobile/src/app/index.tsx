import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fontSize, fontWeight, spacing } from '@cair/tokens';
import { TarjetaCampo } from '../components/TarjetaCampo';
import { useCampos } from '../lib/queries/campos';
import { useSesion } from '../lib/use-sesion';

export default function Listado() {
  const { data: campos, isLoading, isError } = useCampos();
  const { sesion } = useSesion();

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Campos</Text>
        <Link href={sesion ? '/panel' : '/ingresar'} style={estilos.link}>
          {sesion ? 'Mi panel' : 'Ingresar'}
        </Link>
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

      {campos && campos.length === 0 && (
        <View style={estilos.centrado}>
          <Text style={estilos.mensaje}>No hay campos publicados todavía.</Text>
        </View>
      )}

      {campos && campos.length > 0 && (
        <FlatList
          data={campos}
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
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    paddingTop: spacing[16],
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  titulo: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  link: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.brand[600],
  },
  lista: {
    paddingHorizontal: spacing[6],
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
