import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Ruler, Sprout, Tag } from 'lucide-react';
import { clienteServidor } from '@/lib/supabase/server';
import { BuscadorPorRadio } from '@/components/buscador-por-radio';
import { FiltrosColapsables } from '@/components/filtros-colapsables';
import { buttonStyles } from '@cair/ui/Button';
import {
  ETIQUETAS_MODALIDAD_CAMPO,
  ETIQUETAS_TIPO_CAMPO,
  escaparParaFiltroOr,
  formatearPrecioUsd,
} from '@cair/shared';
import { MODALIDADES_CAMPO, TIPOS_CAMPO } from '@cair/schemas';
import { urlFotoCampo } from '@/lib/url-foto-campo';

export const metadata: Metadata = {
  title: 'Campos en venta y arrendamiento',
  description:
    'Buscá campos agrícolas, ganaderos y mixtos en toda Argentina, filtrando por zona, precio y superficie.',
  alternates: { canonical: '/campos' },
};

interface QueryParams {
  modalidad?: string;
  tipo_campo?: string | string[];
  q?: string;
  hectareas_min?: string;
  hectareas_max?: string;
  precio_min?: string;
  precio_max?: string;
  orden?: string;
  lat?: string;
  lng?: string;
  radio_km?: string;
}

const ORDENES_CAMPO = [
  'recientes',
  'precio_asc',
  'precio_desc',
  'hectareas_asc',
  'hectareas_desc',
] as const;

const ETIQUETAS_ORDEN: Record<(typeof ORDENES_CAMPO)[number], string> = {
  recientes: 'Más recientes',
  precio_asc: 'Precio: menor a mayor',
  precio_desc: 'Precio: mayor a menor',
  hectareas_asc: 'Hectáreas: menor a mayor',
  hectareas_desc: 'Hectáreas: mayor a menor',
};

// `radio_km` viene de un `<select>` con estas opciones nada más (ver
// `buscador-por-radio.tsx`) — no tiene sentido aceptar cualquier número acá.
const RADIOS_KM = [10, 25, 50, 100, 200] as const;

function comoValorValido<T extends string>(valores: readonly T[], valor: string | undefined) {
  return valores.includes(valor as T) ? (valor as T) : undefined;
}

function comoNumeroValido(valor: string | undefined): number | undefined {
  if (!valor) return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : undefined;
}

function comoCoordenadaValida(
  valor: string | undefined,
  min: number,
  max: number,
): number | undefined {
  if (!valor) return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= min && numero <= max ? numero : undefined;
}

function comoRadioValido(valor: string | undefined): (typeof RADIOS_KM)[number] | undefined {
  const numero = Number(valor);
  return (RADIOS_KM as readonly number[]).includes(numero)
    ? (numero as (typeof RADIOS_KM)[number])
    : undefined;
}

function fotoPortada(fotos: { object_key: string; orden: number }[]): string | undefined {
  return [...fotos].sort((a, b) => a.orden - b.orden)[0]?.object_key;
}

export default async function ResultadosCamposPage({
  searchParams,
}: {
  searchParams: Promise<QueryParams>;
}) {
  const params = await searchParams;
  const supabase = await clienteServidor();

  const modalidad = comoValorValido(MODALIDADES_CAMPO, params.modalidad);
  const tiposCandidatos = Array.isArray(params.tipo_campo)
    ? params.tipo_campo
    : params.tipo_campo
      ? [params.tipo_campo]
      : [];
  const tipos = tiposCandidatos.filter((valor): valor is (typeof TIPOS_CAMPO)[number] =>
    (TIPOS_CAMPO as readonly string[]).includes(valor),
  );
  const q = params.q?.trim();
  const hectareasMin = comoNumeroValido(params.hectareas_min);
  const hectareasMax = comoNumeroValido(params.hectareas_max);
  const precioMin = comoNumeroValido(params.precio_min);
  const precioMax = comoNumeroValido(params.precio_max);
  const orden = comoValorValido(ORDENES_CAMPO, params.orden) ?? 'recientes';
  const lat = comoCoordenadaValida(params.lat, -90, 90);
  const lng = comoCoordenadaValida(params.lng, -180, 180);
  const radioKm = comoRadioValido(params.radio_km);
  const tieneZona = lat !== undefined && lng !== undefined && radioKm !== undefined;

  // `created_at` no se muestra en la tarjeta, pero tiene que estar en el
  // select igual: PostgREST solo permite `order=` por una columna que
  // también esté proyectada cuando la consulta pasa por una función RPC
  // (`campos_en_radio`, para el filtro de zona) — a diferencia de un
  // `.from('campos')` normal, donde ordenar por una columna no seleccionada
  // funciona sin problema. Sin esto, toda búsqueda por zona con el orden
  // por defecto ("Más recientes") fallaba en silencio: el error de
  // PostgREST se descarta más abajo sin chequear `error`, así que se veía
  // como "0 campos encontrados" en vez de un error.
  const SELECCION_CAMPOS =
    'id, titulo, hectareas, precio_usd, provincia, localidad, modalidad, tipo_campo, latitud, longitud, created_at, campo_fotos(object_key, orden)';

  // Reutiliza el índice GiST de `ubicacion` ("Búsqueda espacial futura" en
  // 02_campos.sql) que ya existía sin nada que lo use. `campos_en_radio`
  // devuelve `setof public.campos`, así que PostgREST deja encadenarle
  // exactamente los mismos filtros que a un `.from('campos')` normal.
  let consulta = tieneZona
    ? supabase
        .rpc('campos_en_radio', {
          centro_lat: lat,
          centro_lng: lng,
          radio_metros: radioKm * 1000,
        })
        .select(SELECCION_CAMPOS)
    : supabase.from('campos').select(SELECCION_CAMPOS);

  consulta = consulta.eq('publicado', true);

  if (modalidad) consulta = consulta.eq('modalidad', modalidad);
  if (tipos.length > 0) consulta = consulta.in('tipo_campo', tipos);
  if (hectareasMin !== undefined) consulta = consulta.gte('hectareas', hectareasMin);
  if (hectareasMax !== undefined) consulta = consulta.lte('hectareas', hectareasMax);
  if (precioMin !== undefined) consulta = consulta.gte('precio_usd', precioMin);
  if (precioMax !== undefined) consulta = consulta.lte('precio_usd', precioMax);
  // Una zona ya acota geográficamente: combinarla con el texto libre no
  // aporta y complica la UX, así que una zona activa gana por sobre `q`.
  if (q && !tieneZona) {
    const patron = `%${escaparParaFiltroOr(q)}%`;
    consulta = consulta.or(
      `titulo.ilike.${patron},localidad.ilike.${patron},provincia.ilike.${patron}`,
    );
  }

  switch (orden) {
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
      consulta = consulta.order('created_at', { ascending: false });
  }

  const { data: campos } = await consulta;

  const descripcionFiltros = [
    tipos.map((tipo) => ETIQUETAS_TIPO_CAMPO[tipo] ?? tipo).join(', '),
    modalidad ? ETIQUETAS_MODALIDAD_CAMPO[modalidad] : undefined,
    tieneZona ? `en un radio de ${String(radioKm)} km` : q,
  ]
    .filter(Boolean)
    .join(' · ');

  const cantidadFiltrosActivos = [
    q,
    tipos.length > 0,
    modalidad,
    hectareasMin !== undefined,
    hectareasMax !== undefined,
    precioMin !== undefined,
    precioMax !== undefined,
    orden !== 'recientes',
    tieneZona,
  ].filter(Boolean).length;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-72">
        <h1 className="font-display hidden text-2xl font-semibold text-neutral-950 lg:block">
          Filtros
        </h1>
        <div className="bg-accent-400 mt-2 hidden h-1 w-12 lg:block" />

        <FiltrosColapsables cantidadActiva={cantidadFiltrosActivos}>
          <form action="/campos" className="flex flex-col gap-6 lg:mt-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="q"
                className="text-xs font-semibold tracking-widest text-neutral-800 uppercase"
              >
                Ubicación
              </label>
              <input
                id="q"
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Provincia, partido o localidad"
                className="rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-700"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                Tipo de campo
              </span>
              <div className="flex flex-col gap-2">
                {TIPOS_CAMPO.map((tipo) => (
                  <label
                    key={tipo}
                    className="flex items-center gap-3 rounded-sm border border-neutral-700 bg-neutral-50 p-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="tipo_campo"
                      value={tipo}
                      defaultChecked={tipos.includes(tipo)}
                      className="accent-brand-900"
                    />
                    {ETIQUETAS_TIPO_CAMPO[tipo]}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="modalidad"
                className="text-xs font-semibold tracking-widest text-neutral-800 uppercase"
              >
                Modalidad
              </label>
              <select
                id="modalidad"
                name="modalidad"
                defaultValue={modalidad ?? ''}
                className="rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-sm text-neutral-950"
              >
                <option value="">Venta y arrendamiento</option>
                {MODALIDADES_CAMPO.map((valor) => (
                  <option key={valor} value={valor}>
                    {ETIQUETAS_MODALIDAD_CAMPO[valor]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="orden"
                className="text-xs font-semibold tracking-widest text-neutral-800 uppercase"
              >
                Ordenar por
              </label>
              <select
                id="orden"
                name="orden"
                defaultValue={orden}
                className="rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-sm text-neutral-950"
              >
                {ORDENES_CAMPO.map((valor) => (
                  <option key={valor} value={valor}>
                    {ETIQUETAS_ORDEN[valor]}
                  </option>
                ))}
              </select>
            </div>

            {tieneZona && (
              // Preserva el filtro de zona al reenviar este form (el `<select>`
              // de radio vive en `BuscadorPorRadio`, no acá): sin estos
              // ocultos, aplicar cualquier otro filtro lo tiraría en silencio.
              <>
                <input type="hidden" name="lat" defaultValue={lat} />
                <input type="hidden" name="lng" defaultValue={lng} />
                <input type="hidden" name="radio_km" defaultValue={radioKm} />
              </>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                Precio (USD)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="precio_min"
                  defaultValue={params.precio_min}
                  placeholder="Min"
                  className="w-full rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-700"
                />
                <input
                  type="number"
                  name="precio_max"
                  defaultValue={params.precio_max}
                  placeholder="Max"
                  className="w-full rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-700"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                Superficie (ha)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="hectareas_min"
                  defaultValue={params.hectareas_min}
                  placeholder="Min"
                  className="w-full rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-700"
                />
                <input
                  type="number"
                  name="hectareas_max"
                  defaultValue={params.hectareas_max}
                  placeholder="Max"
                  className="w-full rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-700"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-accent-400 text-brand-900 w-full rounded-sm py-3 text-sm font-semibold"
            >
              Aplicar filtros
            </button>
          </form>
        </FiltrosColapsables>
      </aside>

      <div className="min-w-0 flex-1">
        <BuscadorPorRadio campos={campos ?? []} />

        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-600 pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-neutral-950">
              Resultados
              {descripcionFiltros && (
                <>
                  {' '}
                  para: <span className="font-normal">{descripcionFiltros}</span>
                </>
              )}
            </h2>
            <p className="text-sm text-neutral-800">
              {campos?.length ?? 0}{' '}
              {campos?.length === 1 ? 'campo encontrado' : 'campos encontrados'}
            </p>
          </div>
        </div>

        {campos && campos.length > 0 ? (
          <ul className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {campos.map((campo) => {
              const objectKey = fotoPortada(campo.campo_fotos);
              return (
                <li
                  key={campo.id}
                  className="group hover:border-brand-900 flex flex-col overflow-hidden rounded-md border border-neutral-600 bg-neutral-50 transition-all duration-300 hover:shadow-xl"
                >
                  {objectKey ? (
                    <div className="relative h-64 w-full">
                      <Image
                        src={urlFotoCampo(objectKey, 'tarjeta')}
                        alt={campo.titulo}
                        fill
                        sizes="(min-width: 1280px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="from-brand-700 to-brand-900 h-64 bg-gradient-to-br"
                      aria-hidden
                    />
                  )}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-xl leading-tight font-semibold text-neutral-950">
                          {campo.titulo}
                        </h3>
                        <span className="font-display text-brand-900 text-lg font-semibold whitespace-nowrap">
                          {formatearPrecioUsd(campo.precio_usd)}
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-neutral-800">
                        <MapPin size={18} />
                        {campo.localidad}, {campo.provincia}
                      </p>

                      <div className="mt-4 grid grid-cols-3 gap-4 border-y border-neutral-600/40 py-4">
                        <div className="text-center">
                          <Ruler className="text-brand-900 mx-auto" size={22} />
                          <p className="mt-1 text-xs font-semibold text-neutral-800">
                            {campo.hectareas} Ha
                          </p>
                        </div>
                        <div className="text-center">
                          <Sprout className="text-brand-900 mx-auto" size={22} />
                          <p className="mt-1 text-xs font-semibold text-neutral-800">
                            {ETIQUETAS_TIPO_CAMPO[campo.tipo_campo] ?? campo.tipo_campo}
                          </p>
                        </div>
                        <div className="text-center">
                          <Tag className="text-brand-900 mx-auto" size={22} />
                          <p className="mt-1 text-xs font-semibold text-neutral-800">
                            {ETIQUETAS_MODALIDAD_CAMPO[campo.modalidad] ?? campo.modalidad}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/campos/${campo.id}`}
                      className={`${buttonStyles('secondary')} hover:bg-brand-900 mt-6 w-full text-center hover:text-neutral-50`}
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-8 text-neutral-800">No se encontraron campos con estos filtros.</p>
        )}
      </div>
    </main>
  );
}
