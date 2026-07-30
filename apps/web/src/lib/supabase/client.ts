'use client';

import { crearClienteNavegador } from '@cair/supabase/browser';
import type { ClienteCair } from '@cair/supabase';
import { configSupabase } from '../env';

let instancia: ClienteCair | undefined;

/**
 * Cliente de Supabase para componentes cliente.
 *
 * Acá sí conviene un singleton, al revés que en el servidor: en el navegador
 * hay un solo usuario por contexto de ejecución, y crear un cliente nuevo en
 * cada render abriría conexiones de realtime de más y perdería el estado de
 * autenticación entre componentes.
 */
export function clienteNavegador(): ClienteCair {
  instancia ??= crearClienteNavegador(configSupabase);
  return instancia;
}
