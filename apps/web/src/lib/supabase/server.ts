import { cookies } from 'next/headers';
import { crearClienteServidor } from '@cair/supabase/server';
import type { ClienteCair } from '@cair/supabase';
import { configSupabase } from '../env';

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 *
 * ⚠️ Llamar en cada request. No guardar el resultado en una variable de módulo:
 * el proceso de Node se comparte entre requests y la sesión quedaría cruzada
 * entre usuarios. Acá eso significaría que un socio viera las consultas de
 * otro, que es exactamente lo que el punto 9 del pliego prohíbe.
 *
 * ⚠️ Para saber si hay usuario autenticado usar `getUser()`, nunca
 * `getSession()`: `getSession()` solo lee la cookie, y la cookie la controla
 * el cliente. `getUser()` valida el token contra el servidor de Auth.
 */
export async function clienteServidor(): Promise<ClienteCair> {
  const store = await cookies();

  return crearClienteServidor(configSupabase, {
    getAll: () => store.getAll(),
    setAll: (nuevas) => {
      try {
        for (const { name, value, options } of nuevas) {
          store.set(name, value, options);
        }
      } catch {
        // Los Server Components no pueden escribir cookies. Cuando el refresh
        // del token cae dentro de un render, se ignora acá: el proxy ya renovó
        // la sesión antes de llegar a este punto.
        //
        // Los headers anti-caché tampoco se aplican en este camino, y no hace
        // falta: un Server Component no emite la respuesta. Quien sí debe
        // aplicarlos es el proxy, que es donde las cookies se escriben de
        // verdad.
      }
    },
  });
}
