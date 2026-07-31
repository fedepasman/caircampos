import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Ruler, Sprout, Tag } from 'lucide-react';
import { clienteServidor } from '@/lib/supabase/server';
import { MapaCampos } from '@/components/mapa-campos';
import { buttonStyles } from '@cair/ui/Button';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO, formatearPrecioUsd } from '@cair/shared';
import { MODALIDADES_CAMPO, TIPOS_CAMPO } from '@cair/schemas';
import { env } from '@/lib/env';

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
}

function comoValorValido<T extends string>(valores: readonly T[], valor: string | undefined) {
  return valores.includes(valor as T) ? (valor as T) : undefined;
}

function comoNumeroValido(valor: string | undefined): number | undefined {
  if (!valor) return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : undefined;
}

/**
 * Escapa el término de búsqueda antes de interpolarlo en un `.or()` de
 * PostgREST: esa sintaxis usa `,`/`(`/`)` como separadores de filtros, así
 * que sin escapar, un valor como `zzz,titulo.ilike.*` inyecta una condición
 * extra que matchea todo (probado empíricamente contra la base local: sin
 * este escape, ese término devuelve todos los campos en vez de ninguno).
 */
function escaparParaFiltroOr(valor: string): string {
  return valor.replace(/[%,()]/g, (caracter) => encodeURIComponent(caracter));
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

  let consulta = supabase
    .from('campos')
    .select(
      'id, titulo, hectareas, precio_usd, provincia, localidad, modalidad, tipo_campo, latitud, longitud, campo_fotos(object_key, orden)',
    )
    .eq('publicado', true);

  if (modalidad) consulta = consulta.eq('modalidad', modalidad);
  if (tipos.length > 0) consulta = consulta.in('tipo_campo', tipos);
  if (hectareasMin !== undefined) consulta = consulta.gte('hectareas', hectareasMin);
  if (hectareasMax !== undefined) consulta = consulta.lte('hectareas', hectareasMax);
  if (precioMin !== undefined) consulta = consulta.gte('precio_usd', precioMin);
  if (precioMax !== undefined) consulta = consulta.lte('precio_usd', precioMax);
  if (q) {
    const patron = `%${escaparParaFiltroOr(q)}%`;
    consulta = consulta.or(
      `titulo.ilike.${patron},localidad.ilike.${patron},provincia.ilike.${patron}`,
    );
  }

  const { data: campos } = await consulta.order('created_at', { ascending: false });

  const descripcionFiltros = [
    tipos.map((tipo) => ETIQUETAS_TIPO_CAMPO[tipo] ?? tipo).join(', '),
    modalidad ? ETIQUETAS_MODALIDAD_CAMPO[modalidad] : undefined,
    q,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-72">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">Filtros</h1>
        <div className="bg-accent-400 mt-2 h-1 w-12" />

        <form action="/campos" className="mt-6 flex flex-col gap-6">
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
      </aside>

      <div className="min-w-0 flex-1">
        <div className="h-64 overflow-hidden rounded-lg border border-neutral-600 shadow-lg sm:h-80">
          <MapaCampos campos={campos ?? []} />
        </div>

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
                    // eslint-disable-next-line @next/next/no-img-element -- URL externa (R2)
                    <img
                      src={`${env.NEXT_PUBLIC_R2_PUBLIC_URL}/${objectKey}`}
                      alt=""
                      className="h-64 w-full object-cover"
                    />
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
