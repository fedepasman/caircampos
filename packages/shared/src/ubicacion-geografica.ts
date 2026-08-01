/**
 * País → provincia/departamento → localidad, para los formularios de
 * campos y de socios.
 *
 * Argentina usa la API Georef (`apis.datos.gob.ar/georef`): oficial,
 * gratis, sin API key, con cobertura completa incluyendo pueblos chicos.
 * Uruguay no tiene un equivalente público simple, así que se bundlea un
 * dataset estático chico (`datos/uruguay-geografia.json`) curado a mano —
 * no es exhaustivo, pero cubre las localidades más conocidas de cada
 * departamento.
 */

import { z } from '@cair/schemas';
import uruguayGeografia from './datos/uruguay-geografia.json' with { type: 'json' };

const BASE_GEOREF = 'https://apis.datos.gob.ar/georef/api';

export interface OpcionGeografica {
  id: string;
  nombre: string;
  lat?: number | undefined;
  lng?: number | undefined;
  /** Solo la completan las funciones de búsqueda por nombre (autocomplete):
   * el selector en cascada país→provincia→localidad no la necesita, ya que
   * ahí la provincia/el país ya se sabe de antemano por el paso anterior. */
  provincia?: string | undefined;
  pais?: 'Argentina' | 'Uruguay' | undefined;
}

const esquemaCentroide = z.object({ lat: z.number(), lon: z.number() }).optional();

const esquemaProvinciasGeoref = z.object({
  provincias: z.array(
    z.object({ id: z.string(), nombre: z.string(), centroide: esquemaCentroide }),
  ),
});

const esquemaLocalidadesGeoref = z.object({
  localidades: z.array(
    z.object({ id: z.string(), nombre: z.string(), centroide: esquemaCentroide }),
  ),
});

const esquemaBusquedaLocalidadesGeoref = z.object({
  localidades: z.array(
    z.object({
      id: z.string(),
      nombre: z.string(),
      centroide: esquemaCentroide,
      provincia: z.object({ id: z.string(), nombre: z.string() }),
    }),
  ),
});

/** Quita acentos y pasa a minúsculas, para comparar "Pergamino"/"pergamino"
 * o "Rio Cuarto"/"Río Cuarto" como el mismo texto. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function ordenarPorNombre(opciones: OpcionGeografica[]): OpcionGeografica[] {
  return [...opciones].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

let cacheProvinciasArgentina: Promise<OpcionGeografica[]> | undefined;
const cacheLocalidadesPorProvincia = new Map<string, Promise<OpcionGeografica[]>>();

/**
 * Provincias de Argentina. Cacheada en memoria de módulo: la lista no
 * cambia en la vida de una sesión de navegador, así que todas las
 * instancias del selector comparten un único fetch.
 */
export function obtenerProvinciasArgentina(): Promise<OpcionGeografica[]> {
  cacheProvinciasArgentina ??= fetch(`${BASE_GEOREF}/provincias?campos=id,nombre,centroide&max=30`)
    .then((respuesta) => respuesta.json())
    .then((datos: unknown) => {
      // Borde de confianza: se parsea antes de usar (regla del proyecto).
      const validado = esquemaProvinciasGeoref.parse(datos);
      return ordenarPorNombre(
        validado.provincias.map((provincia) => ({
          id: provincia.id,
          nombre: provincia.nombre,
          lat: provincia.centroide?.lat,
          lng: provincia.centroide?.lon,
        })),
      );
    })
    .catch((error: unknown) => {
      // Sin esto, un fetch fallido dejaría la promesa rota cacheada para
      // siempre y ningún reintento volvería a pegarle a la red.
      cacheProvinciasArgentina = undefined;
      throw error;
    });
  return cacheProvinciasArgentina;
}

/**
 * Localidades de una provincia argentina. Un solo request sin paginar
 * alcanza: Buenos Aires, la provincia con más localidades, trae 895 —
 * muy por debajo del tope real de `max` en Georef (5000; confirmado que
 * 6000 ya falla).
 */
export function obtenerLocalidadesArgentina(provinciaId: string): Promise<OpcionGeografica[]> {
  const cacheada = cacheLocalidadesPorProvincia.get(provinciaId);
  if (cacheada) return cacheada;

  const promesa = fetch(
    `${BASE_GEOREF}/localidades?provincia=${encodeURIComponent(provinciaId)}&campos=id,nombre,centroide&max=5000`,
  )
    .then((respuesta) => respuesta.json())
    .then((datos: unknown) => {
      const validado = esquemaLocalidadesGeoref.parse(datos);
      return ordenarPorNombre(
        validado.localidades.map((localidad) => ({
          id: localidad.id,
          nombre: localidad.nombre,
          lat: localidad.centroide?.lat,
          lng: localidad.centroide?.lon,
        })),
      );
    })
    .catch((error: unknown) => {
      cacheLocalidadesPorProvincia.delete(provinciaId);
      throw error;
    });

  cacheLocalidadesPorProvincia.set(provinciaId, promesa);
  return promesa;
}

interface DepartamentoUruguay {
  centro: [number, number];
  localidades: string[];
}

// `as`, no Zod: es un dataset estático que autoría este mismo repo, no un
// dato que cruce un borde de confianza en runtime — el `centro` del JSON
// se infiere como `number[]`, no como la tupla de largo fijo que sí es.
const departamentosUruguay = uruguayGeografia as unknown as Record<string, DepartamentoUruguay>;

/** Departamentos de Uruguay. Síncrono: el dataset ya está en memoria. */
export function obtenerDepartamentosUruguay(): OpcionGeografica[] {
  return ordenarPorNombre(
    Object.entries(departamentosUruguay).map(([nombre, datos]) => ({
      id: nombre,
      nombre,
      lat: datos.centro[0],
      lng: datos.centro[1],
    })),
  );
}

/** Localidades de un departamento uruguayo. Síncrono, mismo motivo. */
export function obtenerLocalidadesUruguay(departamento: string): OpcionGeografica[] {
  const datos = departamentosUruguay[departamento];
  if (!datos) return [];
  return ordenarPorNombre(datos.localidades.map((nombre) => ({ id: nombre, nombre })));
}

/**
 * Si un valor guardado (texto libre histórico, de antes de que existiera
 * este selector) no matchea ninguna opción oficial, lo agrega igual como
 * primera opción — para no perder el dato ni forzar a limpiarlo a ciegas
 * al editar una fila vieja. Comparación case-insensitive y con trim para
 * no marcar como "huérfanos" casos triviales (mayúsculas, espacios).
 */
export function incluirValorActualSiFalta(
  opciones: OpcionGeografica[],
  valorActual: string | undefined,
): OpcionGeografica[] {
  if (!valorActual) return opciones;
  const yaEsta = opciones.some(
    (opcion) => opcion.nombre.trim().toLowerCase() === valorActual.trim().toLowerCase(),
  );
  if (yaEsta) return opciones;
  return [{ id: valorActual, nombre: valorActual }, ...opciones];
}

/**
 * Autocomplete de localidades argentinas por nombre, en todo el país (a
 * diferencia de `obtenerLocalidadesArgentina`, que necesita una provincia
 * elegida antes). Usa el parámetro `nombre` de Georef, que hace una
 * búsqueda difusa por substring (confirmado con curl real: "san carlos"
 * matchea "San Carlos de Bariloche") y devuelve la provincia embebida.
 * Sin caché de módulo: la query cambia en cada tecla, cachear por string no
 * aporta nada acá.
 */
export function buscarLocalidadesArgentina(query: string): Promise<OpcionGeografica[]> {
  const limpio = query.trim();
  if (!limpio) return Promise.resolve([]);

  return fetch(
    `${BASE_GEOREF}/localidades?nombre=${encodeURIComponent(limpio)}&campos=id,nombre,provincia,centroide&max=8`,
  )
    .then((respuesta) => respuesta.json())
    .then((datos: unknown) => {
      const validado = esquemaBusquedaLocalidadesGeoref.parse(datos);
      return validado.localidades.map((localidad) => ({
        id: localidad.id,
        nombre: localidad.nombre,
        lat: localidad.centroide?.lat,
        lng: localidad.centroide?.lon,
        provincia: localidad.provincia.nombre,
        pais: 'Argentina' as const,
      }));
    });
}

/**
 * Autocomplete de localidades uruguayas por nombre. Síncrono: recorre el
 * dataset bundleado (19 departamentos, dataset chico — no necesita índice
 * ni caché) con un substring case/acento-insensible.
 */
export function buscarLocalidadesUruguay(query: string): OpcionGeografica[] {
  const limpio = normalizar(query.trim());
  if (!limpio) return [];

  const resultados: OpcionGeografica[] = [];
  for (const [departamento, datos] of Object.entries(departamentosUruguay)) {
    for (const nombre of datos.localidades) {
      if (normalizar(nombre).includes(limpio)) {
        resultados.push({ id: nombre, nombre, provincia: departamento, pais: 'Uruguay' });
      }
    }
  }
  return resultados;
}
