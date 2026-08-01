import type { Metadata } from 'next';
import { clienteServidor } from '@/lib/supabase/server';
import { MapaSocios } from '@/components/mapa-socios';
import { escaparParaFiltroOr } from '@cair/shared';

export const metadata: Metadata = {
  title: 'Inmobiliarias Rurales',
  description: 'Directorio de inmobiliarias socias de CAIR en toda Argentina.',
  alternates: { canonical: '/inmobiliarias' },
};

interface QueryParams {
  q?: string;
}

export default async function InmobiliariasPage({
  searchParams,
}: {
  searchParams: Promise<QueryParams>;
}) {
  const params = await searchParams;
  const q = params.q?.trim();

  const supabase = await clienteServidor();

  // Solo las publicadas: CAIR puede tener socios en el directorio todavía
  // sin ubicar (ver 01_socios.sql), así que el filtro por lat/lng no nulas
  // se hace en JS — necesario para que TypeScript los vea como `number` y
  // no como `number | null` al pasarlos al mapa.
  let consulta = supabase
    .from('socios')
    .select('id, nombre, nro_socio, telefono, provincia, localidad, latitud, longitud')
    .eq('publicado', true);

  if (q) {
    const patron = `%${escaparParaFiltroOr(q)}%`;
    consulta = consulta.or(
      `nombre.ilike.${patron},localidad.ilike.${patron},provincia.ilike.${patron}`,
    );
  }

  const { data } = await consulta.order('nombre');

  const socios = (data ?? []).filter(
    (socio): socio is typeof socio & { latitud: number; longitud: number } =>
      socio.latitud !== null && socio.longitud !== null,
  );

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-72">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">
          Inmobiliarias Rurales
        </h1>
        <div className="bg-accent-400 mt-2 h-1 w-12" />
        <p className="mt-4 text-sm text-neutral-800">
          Directorio de inmobiliarias socias de CAIR en toda Argentina.
        </p>

        <form action="/inmobiliarias" className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="q"
              className="text-xs font-semibold tracking-widest text-neutral-800 uppercase"
            >
              Ubicación o nombre
            </label>
            <input
              id="q"
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Provincia, localidad o inmobiliaria"
              className="rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-700"
            />
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
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-600 pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-neutral-950">
              Resultados
              {q && (
                <>
                  {' '}
                  para: <span className="font-normal">{q}</span>
                </>
              )}
            </h2>
            <p className="text-sm text-neutral-800">
              {socios.length}{' '}
              {socios.length === 1 ? 'inmobiliaria encontrada' : 'inmobiliarias encontradas'}
            </p>
          </div>
        </div>

        <div className="mt-6 h-[65vh] overflow-hidden rounded-lg border border-neutral-600 shadow-lg">
          {socios.length > 0 ? (
            <MapaSocios socios={socios} />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-neutral-800">
              No se encontraron inmobiliarias con estos filtros.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
