import { ChevronRight, Plus, Tag } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO } from '@cair/shared';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';
import { useSesion } from '../../lib/use-sesion';
import { useMisCampos, useSocio, type CampoPanel } from '../../lib/queries/panel';
import { supabase } from '../../lib/supabase';

function estadoCampo(campo: Pick<CampoPanel, 'publicado' | 'revisado_por_cair'>): {
  etiqueta: string;
  color: string;
} {
  if (!campo.publicado) return { etiqueta: 'Borrador', color: colors.neutral[500] };
  if (campo.revisado_por_cair === 'aprobado') return { etiqueta: 'Publicado', color: colors.brand[600] };
  if (campo.revisado_por_cair === 'rechazado') return { etiqueta: 'Rechazado', color: colors.danger };
  return { etiqueta: 'Pendiente de aprobación', color: colors.neutral[500] };
}

export default function Panel() {
  const insets = useSafeAreaInsets();
  const { sesion, cargando: cargandoSesion } = useSesion();
  const { data: socio, isLoading: cargandoSocio } = useSocio(sesion?.user.id);
  const { data: campos, isLoading: cargandoCampos } = useMisCampos(socio?.id);

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
        <Text style={estilos.mensaje}>Iniciá sesión para ver tus campos.</Text>
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

  const publicados = campos?.filter(
    (campo) => campo.publicado && campo.revisado_por_cair === 'aprobado',
  ).length ?? 0;

  return (
    <View style={[estilos.contenedor, { paddingTop: insets.top + spacing[2] }]}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo} numberOfLines={1}>
          {socio.nombre}
        </Text>
        <Pressable
          onPress={() => {
            void supabase.auth.signOut();
          }}
        >
          <Text style={estilos.cerrarSesion}>Cerrar sesión</Text>
        </Pressable>
      </View>

      <Text style={estilos.bienvenida}>Bienvenido, {socio.nombre}</Text>

      <View style={estilos.tarjetaStat}>
        <Tag color={colors.brand[600]} size={22} />
        <View>
          <Text style={estilos.statNumero}>{publicados}</Text>
          <Text style={estilos.statEtiqueta}>Campos publicados</Text>
        </View>
      </View>

      <Text style={estilos.seccion}>Mis campos</Text>

      {cargandoCampos && (
        <View style={estilos.centrado}>
          <ActivityIndicator color={colors.brand[600]} />
        </View>
      )}

      {campos && campos.length === 0 && (
        <View style={estilos.centrado}>
          <Text style={estilos.mensaje}>Todavía no tenés campos cargados.</Text>
        </View>
      )}

      {campos && campos.length > 0 && (
        <FlatList
          data={campos}
          keyExtractor={(campo) => campo.id}
          contentContainerStyle={estilos.lista}
          style={estilos.listaGrupo}
          ItemSeparatorComponent={() => <View style={estilos.separador} />}
          renderItem={({ item }) => {
            const { etiqueta, color } = estadoCampo(item);
            return (
              <Pressable
                style={estilos.fila}
                onPress={() => {
                  router.push(`/panel/campos/${item.id}`);
                }}
              >
                <View style={estilos.filaContenido}>
                  <Text style={estilos.filaTitulo} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  <Text style={estilos.filaDetalle}>
                    {item.localidad}, {item.provincia} · {item.hectareas} ha ·{' '}
                    {ETIQUETAS_TIPO_CAMPO[item.tipo_campo]} · {ETIQUETAS_MODALIDAD_CAMPO[item.modalidad]}
                  </Text>
                </View>
                <Text style={[estilos.estado, { color }]}>{etiqueta}</Text>
                <ChevronRight color={colors.neutral[400]} size={18} />
              </Pressable>
            );
          }}
        />
      )}

      <Pressable
        style={[estilos.fab, { bottom: spacing[6] + insets.bottom }]}
        onPress={() => {
          router.push('/panel/campos/nuevo');
        }}
      >
        <Plus color={colors.neutral[50]} size={26} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[1],
  },
  titulo: {
    flexShrink: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.brand[900],
  },
  cerrarSesion: {
    flexShrink: 0,
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  bienvenida: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  tarjetaStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    padding: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[100],
  },
  statNumero: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  statEtiqueta: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    textTransform: 'uppercase',
  },
  seccion: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
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
    color: colors.neutral[600],
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
  },
  filaContenido: {
    flex: 1,
    gap: spacing[1],
  },
  filaTitulo: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  filaDetalle: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  estado: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'right',
  },
  fab: {
    position: 'absolute',
    right: spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.neutral[950],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
});
