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
  { ok: true; data: T } | { ok: false; errores: Record<string, string[]> };

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
  return {
    ok: false,
    errores: z.flattenError(resultado.error).fieldErrors as Record<string, string[]>,
  };
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

/** Formulario de login, compartido por socios y (a futuro) compradores. */
export const esquemaIngreso = z.object({
  email: z.email('Ingresá un email válido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

export type Ingreso = z.infer<typeof esquemaIngreso>;

/**
 * Alta/edición de un campo desde el panel de socios.
 *
 * Los mismos límites que ya imponen los `check` de `public.campos`
 * (hectareas > 0, latitud/longitud en rango): esto da un mensaje de error
 * legible antes de tocar la red, pero el `check` de Postgres sigue siendo
 * la validación que de verdad no se puede saltear.
 */
export const MODALIDADES_CAMPO = ['venta', 'arrendamiento'] as const;
export const TIPOS_CAMPO = ['agricola', 'ganadero', 'mixto'] as const;

/**
 * Países que cubre el directorio de campos y de socios. El check de
 * `pais` en `01_socios.sql`/`02_campos.sql` es la fuente de verdad real;
 * este enum solo tiene que quedar en sincro con esa lista.
 */
export const PAISES = ['Argentina', 'Uruguay'] as const;

export const esquemaCampo = z.object({
  titulo: z.string().min(1, 'Ingresá un título'),
  descripcion: z.string().optional(),
  hectareas: z.coerce.number().positive('Debe ser mayor a 0'),
  // `preprocess` antes de coercionar: un input vacío coerciona a `0` (no a
  // `undefined`), y `.positive()` lo rechazaría aunque "vacío" deba ser
  // válido acá — significa "sin precio publicado", no un dato faltante.
  precio_usd: z.preprocess(
    (valor) => (valor === '' || valor === undefined ? undefined : valor),
    z.coerce.number().positive('Debe ser mayor a 0').optional(),
  ),
  pais: z.enum(PAISES, 'Elegí un país'),
  provincia: z.string().min(1, 'Ingresá una provincia'),
  localidad: z.string().min(1, 'Ingresá una localidad'),
  modalidad: z.enum(MODALIDADES_CAMPO, 'Elegí una modalidad'),
  tipo_campo: z.enum(TIPOS_CAMPO, 'Elegí un tipo de campo'),
  latitud: z.coerce.number().min(-90).max(90),
  longitud: z.coerce.number().min(-180).max(180),
  publicado: z.coerce.boolean(),
});

export type Campo = z.infer<typeof esquemaCampo>;

/**
 * Registro de autoservicio de un comprador. `password` usa el mínimo
 * configurado en Supabase Auth (`minimum_password_length` en
 * `supabase/config.toml`) — un valor distinto ahí sin actualizar acá deja
 * pasar contraseñas que el propio Auth va a rechazar igual, solo que con un
 * error menos claro.
 */
export const esquemaRegistroComprador = z.object({
  nombre: z.string().min(1, 'Ingresá tu nombre'),
  apellido: z.string().min(1, 'Ingresá tu apellido'),
  telefono: z.string().min(1, 'Ingresá un teléfono'),
  email: z.email('Ingresá un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type RegistroComprador = z.infer<typeof esquemaRegistroComprador>;

/**
 * Alta/edición de una inmobiliaria socia, desde el panel de admin de CAIR.
 *
 * `nro_socio` usa el mismo `preprocess` que `precio_usd` en `esquemaCampo`:
 * un input vacío tiene que coaccionar a "sin cargar todavía", no a `0`.
 * `latitud`/`longitud` son opcionales — una inmobiliaria puede existir en
 * el directorio antes de tener ubicación exacta, y el mapa público
 * simplemente omite la que no la tenga.
 */
export const esquemaSocio = z.object({
  nombre: z.string().min(1, 'Ingresá un nombre'),
  nro_socio: z.preprocess(
    (valor) => (valor === '' || valor === undefined ? undefined : valor),
    z.coerce.number().int().positive('Debe ser mayor a 0').optional(),
  ),
  telefono: z.string().optional(),
  pais: z.enum(PAISES, 'Elegí un país'),
  provincia: z.string().optional(),
  localidad: z.string().optional(),
  latitud: z.coerce.number().min(-90).max(90).optional(),
  longitud: z.coerce.number().min(-180).max(180).optional(),
  publicado: z.coerce.boolean(),
});

export type Socio = z.infer<typeof esquemaSocio>;

/** Consulta de un comprador por un campo, desde la ficha pública. */
export const esquemaConsulta = z.object({
  mensaje: z.string().min(1, 'Escribí tu consulta'),
});

export type Consulta = z.infer<typeof esquemaConsulta>;

/** Pantalla "¿Olvidaste tu contraseña?": solo pide el email. */
export const esquemaSolicitarRecuperacion = z.object({
  email: z.email('Ingresá un email válido'),
});

export type SolicitarRecuperacion = z.infer<typeof esquemaSolicitarRecuperacion>;

/**
 * Pantalla de definir una contraseña nueva, después de verificar el link de
 * recuperación. Mismo mínimo que `esquemaRegistroComprador` — ver el
 * comentario ahí sobre por qué tiene que quedar en sincro con
 * `minimum_password_length` de `supabase/config.toml`.
 */
export const esquemaNuevaContrasena = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmarPassword: z.string().min(1, 'Repetí la contraseña'),
  })
  .refine((datos) => datos.password === datos.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  });

export type NuevaContrasena = z.infer<typeof esquemaNuevaContrasena>;
