import * as SecureStore from 'expo-secure-store';
import type { AlmacenamientoSeguro } from '@cair/supabase/mobile';

/**
 * Almacenamiento del token de sesión respaldado por el hardware del
 * dispositivo: Keychain en iOS, Keystore en Android.
 *
 * ⚠️ No reemplazar por AsyncStorage. AsyncStorage guarda en texto plano, y en
 * un dispositivo con root o jailbreak el token de sesión queda legible. Con
 * ese token, un tercero accede a los datos de contacto de los compradores que
 * el socio tiene asignados.
 *
 * ⚠️ SecureStore tiene un límite de 2048 bytes por entrada. Un JWT de Supabase
 * con muchos claims puede superarlo, y el fallo es silencioso: se escribe mal
 * y la sesión no persiste. Si aparece ese síntoma, revisar el tamaño del token
 * antes de sospechar de otra cosa.
 */
export const almacenamientoSeguro: AlmacenamientoSeguro = {
  getItem: (clave) => SecureStore.getItemAsync(clave),
  setItem: (clave, valor) => SecureStore.setItemAsync(clave, valor),
  removeItem: (clave) => SecureStore.deleteItemAsync(clave),
};
