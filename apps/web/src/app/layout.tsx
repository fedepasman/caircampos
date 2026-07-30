import type { Metadata } from 'next';
import { env } from '../lib/env';
import './globals.css';

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
  return (
    <html lang="es-AR">
      <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
