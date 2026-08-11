import { useEffect } from 'react';
import { Home, MessageCircle, Mountain, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { colors, fontSize } from '@cair/tokens';
import { useSesion } from '../../lib/use-sesion';
import { useSocio } from '../../lib/queries/panel';
import { registrarNotificaciones } from '../../lib/notificaciones';

export default function TabsLayout() {
  const { sesion } = useSesion();
  const { data: socio } = useSocio(sesion?.user.id);

  // Una vez por sesión de login de socio, no en cada render: `socio?.id`
  // solo cambia cuando cambia de cuenta o al loguearse por primera vez.
  useEffect(() => {
    if (!socio?.id) return;
    void registrarNotificaciones(socio.id);
  }, [socio?.id]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: colors.neutral[800],
        tabBarStyle: {
          borderTopColor: colors.neutral[200],
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="panel"
        options={{
          title: 'Mis Campos',
          tabBarIcon: ({ color, size }) => <Mountain color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consultas"
        options={{
          title: 'Consultas',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
