/**
 * Utilidades puras compartidas.
 *
 * Este paquete no puede importar de ninguna app ni depender de APIs de
 * navegador, de Node o de React Native: todo lo que viva acá tiene que
 * funcionar igual en los tres entornos.
 */

/**
 * Falla en tiempo de compilación si un `switch` sobre una unión no cubre
 * todos los casos, y en ejecución si igual llegó un valor inesperado.
 *
 * Es la forma de garantizar que agregar una variante a una unión —un tipo de
 * operación, un estado de publicación— rompa el build en todos los lugares
 * que hay que actualizar, en vez de fallar en silencio en producción.
 *
 * @example
 * switch (operacion) {
 *   case 'venta': return ...;
 *   case 'arrendamiento': return ...;
 *   default: return assertNever(operacion);
 * }
 */
export function assertNever(valor: never, mensaje = 'Caso no contemplado'): never {
  throw new Error(`${mensaje}: ${JSON.stringify(valor)}`);
}

/**
 * Type guard para descartar `null` y `undefined` conservando el tipo.
 * Útil sobre todo en `.filter(isDefined)`, donde el narrowing no es automático.
 */
export function isDefined<T>(valor: T | null | undefined): valor is T {
  return valor !== null && valor !== undefined;
}

/**
 * Lee una variable de entorno obligatoria y falla ruidosamente si falta.
 *
 * Existe para que una variable ausente rompa en el arranque con un mensaje
 * claro, en vez de propagarse como `undefined` hasta un punto lejano donde el
 * síntoma no señala la causa. Nunca incluye el valor en el error: el mensaje
 * puede terminar en un log.
 */
export function requireEnv(nombre: string, valor: string | undefined): string {
  if (valor === undefined || valor.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Revisá .env.example y completá tu .env.local.`,
    );
  }
  return valor;
}

/**
 * Etiquetas legibles de `campos.modalidad`/`campos.tipo_campo`, usadas por
 * web, admin y móvil. `Record<string, string>`, no un literal union: los
 * tipos generados de Supabase tipan una columna `text` con `check` como
 * `string` a secas, no como el enum que el `check` en realidad impone.
 */
export const ETIQUETAS_MODALIDAD_CAMPO: Record<string, string> = {
  venta: 'Venta',
  arrendamiento: 'Arrendamiento',
};

export const ETIQUETAS_TIPO_CAMPO: Record<string, string> = {
  agricola: 'Agrícola',
  ganadero: 'Ganadero',
  mixto: 'Mixto',
};

/**
 * Formatea `campos.precio_usd` para mostrarlo. `null` es un estado real del
 * negocio ("precio a consultar"), no un dato faltante — se muestra como tal
 * en vez de ocultar el campo o mostrar "USD 0".
 */
export function formatearPrecioUsd(precioUsd: number | null): string {
  if (precioUsd === null) return 'Consultar precio';
  return `USD ${precioUsd.toLocaleString('es-AR')}`;
}

/**
 * Agrupa los elementos de una lista según una clave derivada.
 * Devuelve un `Map` en vez de un objeto para no chocar con claves heredadas
 * de `Object.prototype` (`__proto__`, `constructor`) si la clave viene de
 * datos externos.
 */
export function groupBy<T, K>(items: readonly T[], obtenerClave: (item: T) => K): Map<K, T[]> {
  const resultado = new Map<K, T[]>();
  for (const item of items) {
    const clave = obtenerClave(item);
    const grupo = resultado.get(clave);
    if (grupo) {
      grupo.push(item);
    } else {
      resultado.set(clave, [item]);
    }
  }
  return resultado;
}
