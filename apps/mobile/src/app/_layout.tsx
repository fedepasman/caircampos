import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { iniciarRefrescoDeSesion } from '../lib/supabase';

/**
 * Layout raíz.
 *
 * Acá va a vivir la separación entre rutas públicas y protegidas cuando
 * existan las pantallas. Por ahora solo monta el stack y ata el refresh de
 * sesión al ciclo de vida de la app.
 */
export default function RootLayout() {
  useEffect(() => iniciarRefrescoDeSesion(), []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
