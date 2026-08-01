import type { Metadata } from 'next';
import { Hanken_Grotesk, Libre_Caslon_Text } from 'next/font/google';
import { env } from '../lib/env';
import './globals.css';

// Self-hosted por Next (sin <link> a Google Fonts en runtime). Los nombres
// de variable coinciden con los que espera --font-display/--font-body en
// packages/ui/src/styles.css.
const libreCaslonText = Libre_Caslon_Text({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-libre-caslon-text',
  display: 'swap',
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  // Base para resolver las URLs relativas de Open Graph y de los canónicos.
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'CAIR — Cámara Argentina de Inmobiliarias Rurales',
    // Las páginas internas completan este patrón, de modo que el nombre de la
    // marca aparezca en cada título sin repetirlo en cada archivo.
    template: '%s | CAIR',
  },
  description:
    'Plataforma de búsqueda y comercialización de campos en Argentina, de la Cámara Argentina de Inmobiliarias Rurales.',
  // El sitio público SÍ se indexa: es el objetivo del punto 7 del pliego.
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // lang="es-AR" no es cosmético: le indica a Google la variante regional y
  // al navegador cómo silabear y qué diccionario usar.
  //
  // Sin <header> acá: el sitio público y el panel tienen chrome distinto,
  // cada uno en su propio Route Group (ver (sitio)/layout.tsx y
  // panel/layout.tsx).
  return (
    <html lang="es-AR" className={`${libreCaslonText.variable} ${hankenGrotesk.variable}`}>
      <body className="font-body bg-neutral-100 text-neutral-950 antialiased">{children}</body>
    </html>
  );
}
