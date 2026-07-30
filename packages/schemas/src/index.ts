/**
 * Validación con Zod.
 *
 * Este paquete es la fuente única de verdad de validación del proyecto: el
 * mismo esquema valida el formulario en el navegador, el payload en el
 * servidor y el input de la app móvil. Un esquema definido en una sola app es
 * una divergencia esperando a ocurrir.
 *
 * Regla de seguridad: TODO dato que cruce un borde de confianza —formulario,
 * Route Handler, Edge Function, respuesta de un tercero— se parsea con un
 * esquema de acá antes de usarse. El tipado de TypeScript desaparece en
 * runtime; Zod es lo que sobrevive.
 */

import { z } from 'zod';

/**
 * Se reexporta `z` para que todo el monorepo use exactamente la misma
 * instancia de Zod. Con dos copias instaladas, los `instanceof` internos
 * fallan y los errores resultantes son muy difíciles de diagnosticar.
 */
export { z };

/** Resultado de una validación, en forma discriminada. */
export type ResultadoValidacion<T> =
  | { ok: true; data: T }
  | { ok: false; errores: Record<string, string[]> };

/**
 * Valida y devuelve un resultado en vez de lanzar.
 *
 * Pensado para los bordes donde el error del usuario es esperable y hay que
 * mostrarlo por campo (formularios, Server Actions), no para invariantes
 * internos. Para esos últimos usar `parseOrThrow`.
 */
export function validar<T extends z.ZodType>(
  esquema: T,
  entrada: unknown,
): ResultadoValidacion<z.output<T>> {
  const resultado = esquema.safeParse(entrada);
  if (resultado.success) {
    return { ok: true, data: resultado.data };
  }
  return { ok: false, errores: z.flattenError(resultado.error).fieldErrors as Record<string, string[]> };
}

/**
 * Valida y lanza si falla.
 *
 * Para invariantes que no deberían romperse nunca: configuración, respuestas
 * de servicios propios, datos ya validados aguas arriba. El mensaje incluye
 * el contexto para que el error sea diagnosticable desde un log.
 */
export function parseOrThrow<T extends z.ZodType>(
  esquema: T,
  entrada: unknown,
  contexto: string,
): z.output<T> {
  const resultado = esquema.safeParse(entrada);
  if (!resultado.success) {
    throw new Error(`Validación fallida en ${contexto}: ${z.prettifyError(resultado.error)}`);
  }
  return resultado.data;
}
