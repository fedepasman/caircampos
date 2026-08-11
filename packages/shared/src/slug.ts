/**
 * Genera el slug de URL de una noticia a partir de su título.
 *
 * Pura: la resolución de colisiones (dos noticias con el mismo título)
 * necesita consultar la base y vive en el llamador (apps/admin), no acá.
 * `.normalize('NFD')` es un método estándar de `String`, no depende de
 * `Intl` — funciona igual en navegador, Node y React Native (mismo truco
 * que ya usa `ubicacion-geografica.ts` para comparar "Rio Cuarto"/"Río
 * Cuarto").
 */
export function generarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
