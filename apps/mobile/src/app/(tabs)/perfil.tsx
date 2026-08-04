import { LogOut } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, radius, spacing } from '@cair/tokens';
import { useSesion } from '../../lib/use-sesion';
import { useSocio } from '../../lib/queries/panel';
import { supabase } from '../../lib/supabase';

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const { sesion, cargando: cargandoSesion } = useSesion();
  const { data: socio, isLoading: cargandoSocio } = useSocio(sesion?.user.id);

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
        <Text style={estilos.mensaje}>Iniciá sesión para ver tu perfil.</Text>
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

  return (
    <View style={[estilos.contenedor, { paddingTop: insets.top + spacing[2] }]}>
      <Text style={estilos.titulo}>Perfil</Text>

      <View style={estilos.tarjeta}>
        <Text style={estilos.nombre}>{socio?.nombre ?? 'Cuenta sin vincular'}</Text>
        <Text style={estilos.email}>{sesion.user.email}</Text>
      </View>

      {!socio && (
        <Text style={estilos.aviso}>
          Tu cuenta todavía no está vinculada a un socio. Contactá a CAIR para completar el alta.
        </Text>
      )}

      <Pressable
        style={estilos.botonSalir}
        onPress={() => {
          void supabase.auth.signOut();
        }}
      >
        <LogOut color={colors.danger} size={18} />
        <Text style={estilos.botonSalirTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing[4],
  },
  titulo: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.brand[900],
    marginBottom: spacing[4],
  },
  tarjeta: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    padding: spacing[4],
    gap: spacing[1],
    marginBottom: spacing[4],
  },
  nombre: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  aviso: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    marginBottom: spacing[4],
  },
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing[3],
  },
  botonSalirTexto: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
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
});
