import { NextResponse, type NextRequest } from 'next/server';
import { clienteServidor } from '@/lib/supabase/server';

/**
 * Único punto de entrada para los links de recuperación de contraseña que
 * manda Supabase Auth. Mismo mecanismo que en apps/web/src/app/auth/confirm
 * — ver el comentario ahí. `/auth/confirm` está eximido del proxy estricto
 * del panel (apps/admin/src/proxy.ts): en este punto todavía no hay sesión.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  if (tokenHash && type) {
    const supabase = await clienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/ingresar?error=link-invalido', origin));
}
