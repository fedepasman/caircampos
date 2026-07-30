import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';
import type { ClienteCair, ConfigSupabase } from './index.js';

/**
 * Almacenamiento de la sesión en el dispositivo.
 *
 * Se inyecta para que el paquete no dependa de Expo. La app móvil pasa un
 * adaptador sobre `expo-secure-store`, que guarda en el Keychain de iOS y en
 * el Keystore de Android.
 *
 * ⚠️ No usar AsyncStorage: guarda en texto plano y en un dispositivo con root
 * o jailbreak el token de sesión queda accesible.
 */
export interface AlmacenamientoSeguro {
  getItem: (clave: string) => Promise<string | null>;
  setItem: (clave: string, valor: string) => Promise<void>;
  removeItem: (clave: string) => Promise<void>;
}

/**
 * Cliente para la app Expo.
 *
 * A diferencia de web, acá la sesión no vive en cookies sino en el
 * almacenamiento seguro del dispositivo. Web y móvil comparten el emisor de
 * JWT, los usuarios y los permisos — no la sesión concreta.
 */
export function crearClienteMovil(
  { url, publishableKey }: ConfigSupabase,
  almacenamiento: AlmacenamientoSeguro,
): ClienteCair {
  return createClient<Database>(url, publishableKey, {
    auth: {
      storage: almacenamiento,
      // El token se renueva solo mientras la app está en foreground.
      autoRefreshToken: true,
      persistSession: true,
      // No hay URL de retorno que parsear en nativo: el deep link se maneja
      // explícitamente en la capa de navegación.
      detectSessionInUrl: false,
    },
  });
}
