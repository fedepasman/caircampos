import type { NextConfig } from 'next';

// Se lee el hostname desde la propia variable de entorno (en vez de
// hardcodear `pub-xxxx.r2.dev`) para no tener que volver a tocar este
// archivo si el bucket migra a un dominio propio más adelante (ver
// FUTURO.md). Next carga los `.env*` antes de evaluar este archivo, así que
// `process.env` ya está poblado acá.
const hostnameR2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname
  : undefined;

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

  images: {
    remotePatterns: [
      // Fotografía de stock del hero y de "Ubicaciones principales",
      // mientras no hay banco de imágenes propio.
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Fotos reales de campos y noticias, servidas desde Cloudflare R2.
      ...(hostnameR2 ? [{ protocol: 'https' as const, hostname: hostnameR2 }] : []),
    ],
  },

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
