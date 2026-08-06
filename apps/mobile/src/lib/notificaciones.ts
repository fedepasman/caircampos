import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

/**
 * Sin esto, Android arma un canal "default" propio al primer push (lo hace
 * Firebase, no expo-notifications) con importancia baja — la notificación
 * se guarda en la bandeja pero no suena, no vibra y no aparece como banner.
 * Confirmado con logcat: "No bubble up: not allowed to bubble" en el
 * momento exacto de un push real. `MAX` es el único nivel que Android
 * respeta como heads-up en todos los fabricantes (Samsung en particular es
 * agresivo restringiendo canales por debajo de eso).
 */
async function asegurarCanalAndroid(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/**
 * Pide permiso de notificaciones (si todavía no se pidió) y, si se
 * concede, registra el token de push de este dispositivo contra el socio
 * logueado. Se llama una vez por sesión de login, no en cada render — ver
 * el efecto en (tabs)/_layout.tsx.
 */
export async function registrarNotificaciones(socioId: string): Promise<void> {
  await asegurarCanalAndroid();

  const permisoActual = await Notifications.getPermissionsAsync();
  let estado = permisoActual.status;

  if (estado !== Notifications.PermissionStatus.GRANTED) {
    const solicitado = await Notifications.requestPermissionsAsync();
    estado = solicitado.status;
  }

  if (estado !== Notifications.PermissionStatus.GRANTED) return;

  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const projectId = extra?.eas?.projectId;
  if (!projectId) return;

  let data: string;
  try {
    const resultado = await Notifications.getExpoPushTokenAsync({ projectId });
    data = resultado.data;
  } catch (error) {
    console.error('No se pudo obtener el token de push', error);
    return;
  }

  // `ignoreDuplicates`: mismo dispositivo re-registrando (por ejemplo, en
  // cada login) no debe fallar por el `unique` de `token`. Ver el
  // comentario en supabase/schemas/08_push_tokens.sql sobre por qué no se
  // reasigna el socio_id en un conflicto.
  const { error } = await supabase
    .from('push_tokens')
    .upsert({ socio_id: socioId, token: data }, { onConflict: 'token', ignoreDuplicates: true });

  if (error) console.error('No se pudo guardar el token de push', error);
}
