import type { NextConfig } from 'next';

const config: NextConfig = {
  // Los paquetes del monorepo exponen TypeScript sin compilar (patrón
  // Just-in-Time): Turbopack tiene que transpilarlos como si fueran código
  // propio de la app.
  transpilePackages: [
    '@cair/ui',
    '@cair/tokens',
    '@cair/shared',
    '@cair/schemas',
    '@cair/supabase',
  ],

  // Un error de tipos no puede llegar a producción en silencio. Next permite
  // saltearlo; acá queda explícito que no se saltea.
  //
  // El lint no se configura porque desde Next 16 `next build` ya no lintea y
  // el comando `next lint` fue eliminado: ESLint corre como tarea propia de
  // Turborepo y como paso de CI.
  typescript: { ignoreBuildErrors: false },

  // No publicar la versión de Next en las cabeceras: es información gratuita
  // para quien busque vulnerabilidades conocidas de una versión concreta.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Impide que el navegador reinterprete el tipo declarado de una
          // respuesta, vector clásico de XSS con archivos subidos por usuarios.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // El sitio no debe poder embeberse en un iframe ajeno (clickjacking).
          { key: 'X-Frame-Options', value: 'DENY' },
          // Al navegar a un sitio externo no se filtra la ruta completa, que
          // puede contener identificadores de campos o de búsquedas.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Ninguna de estas capacidades hace falta en el sitio público.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default config;
