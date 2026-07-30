import { AppState } from 'react-native';
import { crearClienteMovil } from '@cair/supabase/mobile';
import { almacenamientoSeguro } from './almacenamiento-seguro';
import { configSupabase } from './env';

/**
 * Cliente de Supabase de la app móvil.
 *
 * Singleton, al revés que en el servidor: en el dispositivo hay un solo
 * usuario, y crear varios clientes duplicaría los timers de refresh y las
 * suscripciones de realtime.
 */
export const supabase = crearClienteMovil(configSupabase, almacenamientoSeguro);

/**
 * Ata el refresh automático del token al ciclo de vida de la app.
 *
 * Hace falta porque en React Native los timers se congelan al pasar a
 * background. Sin esto, una app que estuvo un rato minimizada vuelve con el
 * token vencido y la primera consulta falla con un 401 que parece aleatorio.
 *
 * Se llama una vez desde el layout raíz.
 */
export function iniciarRefrescoDeSesion(): () => void {
  const suscripcion = AppState.addEventListener('change', (estado) => {
    if (estado === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });

  return () => {
    suscripcion.remove();
  };
}
