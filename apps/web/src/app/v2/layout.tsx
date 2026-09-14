import { clienteServidor } from '@/lib/supabase/server';
import { AvisoCookies } from '@/components/aviso-cookies';
import { HeaderFlotante } from './_components/header-flotante';
import { Footer } from './_components/footer';

/**
 * Chrome compartido de TODO el draft de rediseño (`/v2`, `/v2/campos`,
 * `/v2/noticias`, ...) — a propósito NO vive dentro del Route Group
 * `(sitio)`: es una carpeta real, hermana de `(sitio)`, así que no hereda su
 * `<header>`/`<footer>` y no puede afectar al resto del sitio público
 * mientras se compara esta versión contra la actual. Sigue heredando
 * `app/layout.tsx` (fuentes, tokens, Tailwind).
 *
 * Ver `/v2` para la home nueva y `(sitio)/page.tsx` para la actual — la idea
 * es poder mirar las dos en pestañas separadas antes de elegir.
 */
export default async function V2Layout({ children }: { children: React.ReactNode }) {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <HeaderFlotante user={user} />
      {children}
      <Footer />
      <AvisoCookies />
    </>
  );
}
