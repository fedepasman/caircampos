import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Panel CAIR',
    template: '%s | Panel CAIR',
  },
  // El panel NO se indexa. Es la contracara del sitio público: acá no hay
  // nada que deba aparecer en un buscador, y una ruta administrativa
  // indexada es un mapa gratuito de la superficie autenticada.
  //
  // Esto es solo la señal a los buscadores que la respetan. La protección
  // real son tres capas independientes: el middleware, las políticas RLS, y
  // el candado a nivel plataforma sobre el despliegue.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="bg-neutral-100 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
