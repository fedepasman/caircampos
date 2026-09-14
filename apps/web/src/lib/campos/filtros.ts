import { escaparParaFiltroOr } from '@cair/shared';
import { MODALIDADES_CAMPO, TIPOS_CAMPO } from '@cair/schemas';
import type { Tables } from '@cair/supabase';

/**
 * Parseo y armado de la query de campos, compartido entre el SSR de
 * `(sitio)/campos` y `v2/campos` (idéntico en ambos) y el fetch client-side
 * por bounding box de `ResultadosCampos`. Antes esta lógica estaba
 * duplicada letra por letra en los dos `page.tsx`.
 */

export const SELECCION_CAMPOS_LISTADO =
  'id, titulo, hectareas, precio_usd, provincia, localidad, modalidad, tipo_campo, latitud, longitud, created_at, campo_fotos(object_key, orden)';

export type CampoParaListado = Pick<
  Tables<'campos'>,
  | 'id'
  | 'titulo'
  | 'hectareas'
  | 'provincia'
  | 'localidad'
  | 'modalidad'
  | 'tipo_campo'
  | 'latitud'
  | 'longitud'
  | 'created_at'
> & {
  precio_usd?: number | null;
  campo_fotos: { object_key: string; orden: number }[];
};

export const ORDENES_CAMPO = [
  'recientes',
  'precio_asc',
  'precio_desc',
  'hectareas_asc',
  'hectareas_desc',
] as const;
export type OrdenCampo = (typeof ORDENES_CAMPO)[number];

export const ETIQUETAS_ORDEN: Record<OrdenCampo, string> = {
  recientes: 'Más recientes',
  precio_asc: 'Precio: menor a mayor',
  precio_desc: 'Precio: mayor a menor',
  hectareas_asc: 'Hectáreas: menor a mayor',
  hectareas_desc: 'Hectáreas: mayor a menor',
};

export interface FiltrosCampos {
  modalidad?: (typeof MODALIDADES_CAMPO)[number] | undefined;
  tipos: (typeof TIPOS_CAMPO)[number][];
  hectareasMin?: number | undefined;
  hectareasMax?: number | undefined;
  precioMin?: number | undefined;
  precioMax?: number | undefined;
  q?: string | undefined;
  orden: OrdenCampo;
}

/** Satisfecha tanto por `URLSearchParams` (server) como por
 * `ReadonlyURLSearchParams` de `useSearchParams()` (cliente), sin adaptador. */
export interface OrigenParametros {
  get(nombre: string): string | null;
  getAll(nombre: string): string[];
}

function comoValorValido<T extends string>(
  valores: readonly T[],
  valor: string | null,
): T | undefined {
  return valor !== null && (valores as readonly string[]).includes(valor)
    ? (valor as T)
    : undefined;
}

function comoNumeroValido(valor: string | null): number | undefined {
  if (!valor) return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : undefined;
}

export function parsearFiltrosCampos(origen: OrigenParametros): FiltrosCampos {
  return {
    modalidad: comoValorValido(MODALIDADES_CAMPO, origen.get('modalidad')),
    tipos: origen
      .getAll('tipo_campo')
      .filter((valor): valor is (typeof TIPOS_CAMPO)[number] =>
        (TIPOS_CAMPO as readonly string[]).includes(valor),
      ),
    hectareasMin: comoNumeroValido(origen.get('hectareas_min')),
    hectareasMax: comoNumeroValido(origen.get('hectareas_max')),
    precioMin: comoNumeroValido(origen.get('precio_min')),
    precioMax: comoNumeroValido(origen.get('precio_max')),
    q: origen.get('q')?.trim(),
    orden: comoValorValido(ORDENES_CAMPO, origen.get('orden')) ?? 'recientes',
  };
}

/** Forma mínima que necesita `aplicarFiltrosCampos` — la cumplen tanto
 * `supabase.from('campos').select(...)` como
 * `supabase.rpc('campos_en_bbox', ...).select(...)` (misma `Row`, RPC
 * declarada `returns setof public.campos`). Sintaxis de método (no
 * propiedades con tipo función) a propósito: TypeScript compara parámetros
 * de método de forma bivariante, así que el builder real de PostgREST
 * (con columnas tipadas más estrictas que `string`) sigue siendo asignable
 * acá sin castear. */
export interface QueryEncadenable<T> {
  eq(columna: string, valor: unknown): T;
  in(columna: string, valores: unknown[]): T;
  gte(columna: string, valor: unknown): T;
  lte(columna: string, valor: unknown): T;
  or(filtro: string): T;
  order(columna: string, opciones?: { ascending?: boolean; nullsFirst?: boolean }): T;
}

/**
 * Encadena los mismos filtros que antes repetían ambos `page.tsx`.
 * `excluirTexto`: la búsqueda por bbox no combina con texto libre, mismo
 * criterio que antes tenía la búsqueda por zona con `q`.
 */
export function aplicarFiltrosCampos<T extends QueryEncadenable<T>>(
  consultaInicial: T,
  filtros: FiltrosCampos,
  opciones: { excluirTexto: boolean },
): T {
  let consulta = consultaInicial.eq('publicado', true);

  if (filtros.modalidad) consulta = consulta.eq('modalidad', filtros.modalidad);
  if (filtros.tipos.length > 0) consulta = consulta.in('tipo_campo', filtros.tipos);
  if (filtros.hectareasMin !== undefined)
    consulta = consulta.gte('hectareas', filtros.hectareasMin);
  if (filtros.hectareasMax !== undefined)
    consulta = consulta.lte('hectareas', filtros.hectareasMax);
  if (filtros.precioMin !== undefined) consulta = consulta.gte('precio_usd', filtros.precioMin);
  if (filtros.precioMax !== undefined) consulta = consulta.lte('precio_usd', filtros.precioMax);

  if (filtros.q && !opciones.excluirTexto) {
    const patron = `%${escaparParaFiltroOr(filtros.q)}%`;
    consulta = consulta.or(
      `titulo.ilike.${patron},localidad.ilike.${patron},provincia.ilike.${patron}`,
    );
  }

  switch (filtros.orden) {
    case 'precio_asc':
      consulta = consulta.order('precio_usd', { ascending: true, nullsFirst: false });
      break;
    case 'precio_desc':
      consulta = consulta.order('precio_usd', { ascending: false, nullsFirst: false });
      break;
    case 'hectareas_asc':
      consulta = consulta.order('hectareas', { ascending: true });
      break;
    case 'hectareas_desc':
      consulta = consulta.order('hectareas', { ascending: false });
      break;
    default:
      // `created_at` no se muestra en la tarjeta, pero tiene que estar en el
      // select igual: PostgREST solo permite `order=` por una columna que
      // también esté proyectada cuando la consulta pasa por una función RPC
      // (`campos_en_bbox`), a diferencia de un `.from('campos')` normal.
      consulta = consulta.order('created_at', { ascending: false });
  }

  return consulta;
}
