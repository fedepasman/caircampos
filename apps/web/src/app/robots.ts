import type { MetadataRoute } from 'next';
import { env } from '../lib/env';

/**
 * robots.txt generado.
 *
 * El sitio público se indexa entero salvo las rutas de API, que no aportan
 * nada a la búsqueda y solo gastarían presupuesto de rastreo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // `/panel` y `/ingresar` son superficie autenticada: no aportan nada a
      // la búsqueda. Esto es solo la señal a buscadores, no la protección
      // real — esa vive en apps/web/src/proxy.ts y en RLS.
      disallow: ['/api/', '/panel/', '/ingresar', '/registrarse'],
    },
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
