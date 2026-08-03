import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { iniciarRefrescoDeSesion } from '../lib/supabase';
import { queryClient } from '../lib/query-client';

/**
 * Layout raíz.
 *
 * Acá va a vivir la separación entre rutas públicas y protegidas cuando
 * existan las pantallas. Por ahora monta el stack, ata el refresh de
 * sesión al ciclo de vida de la app y provee TanStack Query al resto del
 * árbol (única fuente de datos para pantallas que no son server-rendered).
 */
export default function RootLayout() {
  useEffect(() => iniciarRefrescoDeSesion(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
