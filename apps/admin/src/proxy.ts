import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@cair/supabase/server';
import { configSupabase } from './lib/env';

/**
 * Intercepta cada request del panel para renovar la sesión de Supabase.
 *
 * En Next 16 este archivo se llama `proxy.ts` y exporta `proxy`: reemplaza al
 * antiguo `middleware.ts`, que quedó deprecado.
 *
 * Por qué hace falta: los Server Components no pueden escribir cookies. Si el
 * token vence durante un render, el refresh no se puede persistir y el usuario
 * queda deslogueado de forma intermitente. Este proxy corre antes, donde sí se
 * pueden escribir cookies, y deja la sesión fresca.
 *
 * ⚠️ Qué NO es este archivo: la única defensa del panel. Es la primera de tres
 * capas independientes, y la más frágil, porque un error de matcher o un
 * `return` mal ubicado la desactivan entera:
 *
 *   1. este proxy — corta temprano y evita renderizar de más;
 *   2. las políticas RLS — la garantía real, vive en la base y no depende
 *      de que este código sea correcto;
 *   3. el candado a nivel plataforma del despliegue del panel.
 *
 * Nunca autorizar únicamente acá.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = crearClienteServidor(configSupabase, {
    getAll: () => request.cookies.getAll(),
    setAll: (nuevas, headers) => {
      for (const { name, value } of nuevas) {
        request.cookies.set(name, value);
      }
      respuesta = NextResponse.next({ request });
      for (const { name, value, options } of nuevas) {
        respuesta.cookies.set(name, value, options);
      }
      // Estos headers no son opcionales. Una respuesta que trae cookies de
      // sesión y queda cacheada en un CDN o un proxy reverso le sirve el token
      // de un usuario a otro.
      for (const [clave, valor] of Object.entries(headers)) {
        respuesta.headers.set(clave, valor);
      }
    },
  });

  // `getUser()` y no `getSession()`: valida el token contra el servidor de
  // Auth. `getSession()` solo lee la cookie, y la cookie la controla el
  // cliente, así que confiar en ella es confiar en el atacante.
  //
  // El resultado todavía no se usa para redirigir: las rutas del panel no
  // existen. La llamada igual es necesaria, porque es la que dispara el
  // refresh del token.
  await supabase.auth.getUser();

  return respuesta;
}

export const config = {
  /*
   * Se excluyen los assets estáticos y las imágenes. Sin este filtro, el proxy
   * correría en cada request de imagen o de chunk de JS, agregando una
   * validación de token contra Auth en cada uno.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
