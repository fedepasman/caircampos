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
      //
      // `/v2` es el draft de rediseño completo (home, campos, noticias,
      // inmobiliarias...) en comparación con las páginas actuales — se saca
      // de acá (y de la metadata de cada página) el día que se decida cuál
      // queda. Sin la barra final a propósito: `/v2` es en sí mismo una
      // página real (la home nueva), no solo un prefijo de subrutas — con
      // barra final quedaría afuera del disallow. Un solo prefijo cubre
      // todas las rutas nuevas sin tener que volver a tocar este archivo
      // por cada página que se sume.
      disallow: ['/api/', '/panel/', '/ingresar', '/registrarse', '/v2'],
    },
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
