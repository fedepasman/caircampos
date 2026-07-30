import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: [
    '@cair/ui',
    '@cair/tokens',
    '@cair/shared',
    '@cair/schemas',
    '@cair/supabase',
  ],

  typescript: { ignoreBuildErrors: false },
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          // El panel es más estricto que el sitio público: al navegar a un
          // origen externo no se envía referer alguno. Las rutas del panel
          // pueden contener identificadores de socios o de publicaciones.
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Refuerza el noindex del layout con una cabecera, que también
          // cubre respuestas que no son HTML.
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
    ];
  },
};

export default config;
