import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';
import { useSesion } from '../../lib/use-sesion';
import { useConsultas, useSocio } from '../../lib/queries/panel';

function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function Consultas() {
  const insets = useSafeAreaInsets();
  const { sesion, cargando: cargandoSesion } = useSesion();
  const { data: socio, isLoading: cargandoSocio } = useSocio(sesion?.user.id);
  const { data: consultas, isLoading: cargandoConsultas } = useConsultas(Boolean(sesion));

  if (cargandoSesion) {
    return (
      <View style={estilos.centrado}>
        <ActivityIndicator color={colors.brand[600]} />
      </View>
    );
  }

  if (!sesion) {
    return (
      <View style={estilos.centrado}>
        <Text style={estilos.mensaje}>Iniciá sesión para ver tus consultas.</Text>
        <Link href="/ingresar" style={estilos.link}>
          Ingresar
        </Link>
      </View>
    );
  }

  if (cargandoSocio) {
    return (
      <View style={estilos.centrado}>
        <ActivityIndicator color={colors.brand[600]} />
      </View>
    );
  }

  if (!socio) {
    return (
      <View style={estilos.centrado}>
        <Text style={estilos.mensaje}>
          Tu cuenta todavía no está vinculada a un socio. Contactá a CAIR para completar el alta.
        </Text>
      </View>
    );
  }

  return (
    <View style={[estilos.contenedor, { paddingTop: insets.top + spacing[2] }]}>
      <Text style={estilos.titulo}>Consultas</Text>

      {cargandoConsultas && (
        <View style={estilos.centrado}>
          <ActivityIndicator color={colors.brand[600]} />
        </View>
      )}

      {consultas && consultas.length === 0 && (
        <View style={estilos.centrado}>
          <Text style={estilos.mensaje}>Todavía no recibiste consultas.</Text>
        </View>
      )}

      {consultas && consultas.length > 0 && (
        <FlatList
          data={consultas}
          keyExtractor={(consulta) => consulta.id}
          contentContainerStyle={estilos.lista}
          style={estilos.listaGrupo}
          ItemSeparatorComponent={() => <View style={estilos.separador} />}
          renderItem={({ item }) => (
            <View style={estilos.fila}>
              <View style={estilos.filaEncabezado}>
                <Text style={estilos.filaTitulo} numberOfLines={1}>
                  {item.campos.titulo}
                </Text>
                <Text style={estilos.fecha}>{formatearFecha(item.created_at)}</Text>
              </View>
              <Text style={estilos.comprador}>
                {item.compradores.nombre} {item.compradores.apellido}
              </Text>
              <Pressable
                onPress={() => {
                  void Linking.openURL(`tel:${item.compradores.telefono}`);
                }}
              >
                <Text style={estilos.telefono}>{item.compradores.telefono}</Text>
              </Pressable>
              {item.mensaje && (
                <Text style={estilos.mensajeTexto} numberOfLines={2}>
                  {item.mensaje}
                </Text>
              )}
            </View>
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
  },
  titulo: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.brand[900],
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  mensaje: {
    fontSize: fontSize.base,
    color: colors.neutral[800],
    textAlign: 'center',
  },
  link: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.brand[600],
  },
  listaGrupo: {
    marginHorizontal: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  lista: {
    paddingBottom: spacing[16],
  },
  separador: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginLeft: spacing[4],
  },
  fila: {
    padding: spacing[4],
    gap: spacing[1],
  },
  filaEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  filaTitulo: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  fecha: {
    fontSize: fontSize.xs,
    color: colors.neutral[800],
  },
  comprador: {
    fontSize: fontSize.sm,
    color: colors.neutral[800],
  },
  telefono: {
    fontSize: fontSize.sm,
    color: colors.brand[600],
    fontWeight: fontWeight.medium,
  },
  mensajeTexto: {
    fontSize: fontSize.sm,
    color: colors.neutral[800],
    marginTop: spacing[1],
  },
});
