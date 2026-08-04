import { Home, MessageCircle, Mountain, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { colors, fontSize } from '@cair/tokens';

export default function TabsLayout() {
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
