import type { Metadata } from 'next';
import { clienteServidor } from '@/lib/supabase/server';
import { ResultadosCampos } from '@/components/resultados-campos';
import { FiltrosColapsables } from '@/components/filtros-colapsables';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO } from '@cair/shared';
import { MODALIDADES_CAMPO, TIPOS_CAMPO } from '@cair/schemas';
import {
  aplicarFiltrosCampos,
  ETIQUETAS_ORDEN,
  ORDENES_CAMPO,
  parsearFiltrosCampos,
  SELECCION_CAMPOS_LISTADO,
  type CampoParaListado,
} from '@/lib/campos/filtros';
import { HeroSeccion } from '../_components/hero-seccion';

// Draft de comparación: no se indexa ni se anuncia mientras se decide si
// reemplaza a la página actual — ver el comentario en robots.ts. Sin
// `alternates.canonical`: apuntar a `/campos` sería declarar esta página
// como un duplicado de esa, que no es la intención mientras conviven.
export const metadata: Metadata = {
  title: 'Campos en venta y arrendamiento (draft)',
  description:
    'Buscá campos agrícolas, ganaderos y mixtos en toda Argentina, filtrando por zona, precio y superficie.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
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
}

export default async function ResultadosCamposPage({
  searchParams,
}: {
  searchParams: Promise<QueryParams>;
}) {
  const params = await searchParams;
  const supabase = await clienteServidor();

  const origen = new URLSearchParams();
  if (params.modalidad) origen.set('modalidad', params.modalidad);
  for (const tipo of Array.isArray(params.tipo_campo)
    ? params.tipo_campo
    : params.tipo_campo
      ? [params.tipo_campo]
      : []) {
    origen.append('tipo_campo', tipo);
  }
  if (params.q) origen.set('q', params.q);
  if (params.hectareas_min) origen.set('hectareas_min', params.hectareas_min);
  if (params.hectareas_max) origen.set('hectareas_max', params.hectareas_max);
  if (params.precio_min) origen.set('precio_min', params.precio_min);
  if (params.precio_max) origen.set('precio_max', params.precio_max);
  if (params.orden) origen.set('orden', params.orden);

  const filtros = parsearFiltrosCampos(origen);

  const consulta = aplicarFiltrosCampos(
    supabase.from('campos').select(SELECCION_CAMPOS_LISTADO),
    filtros,
    { excluirTexto: false },
  );
  const { data: campos } = await consulta;
  const camposIniciales = (campos ?? []) as CampoParaListado[];

  const descripcionFiltros = [
    filtros.tipos.map((tipo) => ETIQUETAS_TIPO_CAMPO[tipo] ?? tipo).join(', '),
    filtros.modalidad ? ETIQUETAS_MODALIDAD_CAMPO[filtros.modalidad] : undefined,
    filtros.q,
  ]
    .filter(Boolean)
    .join(' · ');

  const cantidadFiltrosActivos = [
    filtros.q,
    filtros.tipos.length > 0,
    filtros.modalidad,
    filtros.hectareasMin !== undefined,
    filtros.hectareasMax !== undefined,
    filtros.precioMin !== undefined,
    filtros.precioMax !== undefined,
    filtros.orden !== 'recientes',
  ].filter(Boolean).length;

  return (
    <>
      {/* El `<HeroSeccion>` ya compensa el header fixed con su propio
          `pt-24` — el `<main>` de acá abajo vuelve al padding normal. */}
      <HeroSeccion
        src="/imagenes/hero-campos.jpg"
        alt=""
        titulo="Campos en venta y arrendamiento"
        subtitulo="Buscá campos agrícolas, ganaderos y mixtos en toda Argentina, filtrando por zona, precio y superficie."
      />
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-72">
          <h2 className="font-display hidden text-2xl font-semibold text-neutral-950 lg:block">
            Filtros
          </h2>
          <div className="bg-accent-400 mt-2 hidden h-1 w-12 lg:block" />

          <FiltrosColapsables cantidadActiva={cantidadFiltrosActivos}>
            <form action="/v2/campos" className="flex flex-col gap-6 lg:mt-6">
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
                  defaultValue={filtros.q}
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
                        defaultChecked={filtros.tipos.includes(tipo)}
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
                  defaultValue={filtros.modalidad ?? ''}
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
                  defaultValue={filtros.orden}
                  className="rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-sm text-neutral-950"
                >
                  {ORDENES_CAMPO.map((valor) => (
                    <option key={valor} value={valor}>
                      {ETIQUETAS_ORDEN[valor]}
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
          </FiltrosColapsables>
        </aside>

        <div className="min-w-0 flex-1">
          {descripcionFiltros && (
            <p className="mb-2 text-sm text-neutral-800">
              Filtrando por: <span className="font-normal">{descripcionFiltros}</span>
            </p>
          )}
          <ResultadosCampos camposIniciales={camposIniciales} basePathFicha="/v2/campos" />
        </div>
      </main>
    </>
  );
}
