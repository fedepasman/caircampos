import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
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

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo} numberOfLines={1}>
          Hola, {socio.nombre}
        </Text>
        <Pressable
          onPress={() => {
            void supabase.auth.signOut();
          }}
        >
          <Text style={estilos.cerrarSesion}>Cerrar sesión</Text>
        </Pressable>
      </View>

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
          renderItem={({ item }) => {
            const { etiqueta, color } = estadoCampo(item);
            return (
              <View style={estilos.tarjeta}>
                <View style={estilos.tarjetaContenido}>
                  <Text style={estilos.tarjetaTitulo} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  <Text style={estilos.tarjetaDetalle}>
                    {item.localidad}, {item.provincia} · {item.hectareas} ha ·{' '}
                    {ETIQUETAS_TIPO_CAMPO[item.tipo_campo]} · {ETIQUETAS_MODALIDAD_CAMPO[item.modalidad]}
                  </Text>
                </View>
                <Text style={[estilos.estado, { color }]}>{etiqueta}</Text>
              </View>
            );
          }}
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
    flexShrink: 1,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  cerrarSesion: {
    flexShrink: 0,
    fontSize: fontSize.sm,
    color: colors.neutral[600],
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
  lista: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  tarjetaContenido: {
    flex: 1,
    gap: spacing[1],
  },
  tarjetaTitulo: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  tarjetaDetalle: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  estado: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'right',
  },
});
