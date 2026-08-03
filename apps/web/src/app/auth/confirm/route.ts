import { NextResponse, type NextRequest } from 'next/server';
import { clienteServidor } from '@/lib/supabase/server';

/**
 * Único punto de entrada para los links de los emails de Supabase Auth
 * (confirmación de cuenta y recuperación de contraseña). La plantilla por
 * defecto de Supabase linkea a su propio endpoint hosteado, que nunca pasa
 * por acá — con `@supabase/ssr` la sesión tiene que quedar en una cookie
 * del propio dominio, y eso solo pasa si el intercambio del token corre en
 * un Route Handler nuestro. Por eso las plantillas en supabase/templates/
 * arman el link a mano con `token_hash` + `type`.
 *
 * `verifyOtp` deja la sesión seteada en la respuesta (vía el adaptador de
 * cookies de `clienteServidor`) antes del redirect — a partir de acá el
 * usuario ya está autenticado.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/panel';

  if (tokenHash && type) {
    const supabase = await clienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/ingresar?error=link-invalido', origin));
}
