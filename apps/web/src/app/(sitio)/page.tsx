import Image from 'next/image';
import Link from 'next/link';
import { clienteServidor } from '@/lib/supabase/server';
import { BuscadorMapa } from '@/components/buscador-mapa';
import { MODALIDADES_CAMPO, TIPOS_CAMPO } from '@cair/schemas';

/**
 * Home pública. Server Component: la regla de SEO de CLAUDE.md exige que los
 * listados públicos se rendericen en servidor, no que se carguen desde el
 * cliente después del primer paint.
 *
 * Identidad visual "Agro-Institutional Modernism", adoptada desde
 * Base_Stitch/agro_institutional_modernism/DESIGN.md — ver /DESIGN.md en la
 * raíz. Sigue el comp `cair_buscador_de_campos` con un recorte deliberado:
 * sin fotos de campos (no hay columna de imagen ni R2 conectado todavía). El
 * buscador del hero es un `<form>` GET real (sin JS): navega a la landing de
 * resultados `/campos?modalidad=...&tipo_campo=...&q=...`
 * (`(sitio)/campos/page.tsx`), que filtra server-side — no al mapa embebido
 * de esta misma página, que sigue siendo solo un preview rápido.
 */
export default async function Home() {
  const supabase = await clienteServidor();

  const { data: campos } = await supabase
    .from('campos')
    .select('id, titulo, provincia, localidad, hectareas')
    .eq('publicado', true)
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: camposParaMapa } = await supabase
    .from('campos')
    .select('id, titulo, hectareas, latitud, longitud, provincia, localidad')
    .eq('publicado', true);

  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[640px] items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1637543991656-f9352437d57b?q=80&w=1920&auto=format&fit=crop"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Fotografía: Darío Bonzi, vía Unsplash. */}
        <div className="absolute inset-0 bg-neutral-950/55" aria-hidden />

        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 text-center">
          <p className="text-sm font-semibold tracking-[0.15em] text-neutral-50 uppercase">
            Cámara Argentina de Inmobiliarias Rurales
          </p>
          <h1 className="font-display text-[40px] leading-[1.1] font-bold text-balance text-neutral-50 sm:text-[56px]">
            Encontrá tu campo
          </h1>
          <p className="text-lg text-neutral-100">
            La red de inmobiliarias rurales que conecta el campo con quien lo busca.
          </p>

          <form
            action="/campos"
            className="mt-2 w-full rounded-md bg-neutral-50 p-2 text-left shadow-lg"
          >
            <div className="flex gap-1 px-2 pt-1 pb-2">
              {MODALIDADES_CAMPO.map((valor, indice) => (
                <label
                  key={valor}
                  className="cursor-pointer border-b-[3px] border-transparent px-1 pb-1 text-sm font-semibold text-neutral-800 has-[:checked]:border-brand-900 has-[:checked]:text-brand-900"
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value={valor}
                    defaultChecked={indice === 0}
                    className="sr-only"
                  />
                  {valor === 'venta' ? 'Comprar' : 'Alquilar'}
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-2 p-2 sm:flex-row">
              <select
                name="tipo_campo"
                className="flex-1 rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-3 text-base text-neutral-950"
                defaultValue={TIPOS_CAMPO[0]}
              >
                <option value="agricola">Agrícola</option>
                <option value="ganadero">Ganadero</option>
                <option value="mixto">Mixto</option>
              </select>
              <input
                type="text"
                name="q"
                placeholder="Ej: Pergamino, Buenos Aires"
                className="flex-[2] rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-3 text-base text-neutral-950 placeholder:text-neutral-700"
              />
              <button
                type="submit"
                className="rounded-sm bg-accent-400 px-6 py-3 text-base font-semibold text-brand-900"
              >
                Buscar
              </button>
            </div>
          </form>

          <a href="#mapa-campos" className="text-sm text-neutral-100 underline underline-offset-4">
            Ver campos en el mapa
          </a>
        </div>
      </section>

      {/* Franja de confianza */}
      <section className="bg-brand-900 py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 text-center text-neutral-50 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg font-semibold">Transparencia</p>
            <p className="text-sm text-neutral-200">Ética y profesionalismo en cada operación.</p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Red de socios</p>
            <p className="text-sm text-neutral-200">Inmobiliarias especializadas en todo el país.</p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Cobertura nacional</p>
            <p className="text-sm text-neutral-200">Propiedades en las regiones productivas.</p>
          </div>
        </div>
      </section>

      {/* Campos destacados */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-3xl font-semibold text-neutral-950">Campos destacados</h2>

        {campos && campos.length > 0 ? (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {campos.map((campo) => (
              <li key={campo.id}>
                <Link
                  href={`/campos/${campo.id}`}
                  className="block overflow-hidden rounded-md border border-neutral-600 bg-neutral-50 hover:border-brand-900"
                >
                  {/* Sin foto: campos no tiene columna de imagen todavía. */}
                  <div className="h-40 bg-gradient-to-br from-brand-700 to-brand-900" aria-hidden />
                  <div className="flex flex-col gap-1 p-4">
                    <p className="font-display text-lg font-semibold text-neutral-950">
                      {campo.titulo}
                    </p>
                    <p className="text-sm text-neutral-800">
                      {campo.localidad}, {campo.provincia}
                    </p>
                    <p className="text-sm text-neutral-800">{campo.hectareas} ha</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-neutral-800">Todavía no hay campos publicados.</p>
        )}
      </section>

      {/* Búsqueda geográfica */}
      <section id="mapa-campos" className="bg-neutral-200 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-center text-3xl font-semibold text-neutral-950">
            Búsqueda geográfica
          </h2>

          {camposParaMapa && camposParaMapa.length > 0 ? (
            <BuscadorMapa campos={camposParaMapa} />
          ) : (
            <p className="mt-8 text-center text-neutral-800">
              Todavía no hay campos publicados para mostrar en el mapa.
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 px-6 py-12 text-neutral-200">
        <div className="mx-auto max-w-5xl">
          <p className="font-display text-lg font-semibold text-neutral-50">CAIR</p>
          <p className="mt-2 max-w-md text-sm">
            Somos la institución referente en el mercado de tierras de Argentina, brindando
            transparencia, profesionalismo y seguridad jurídica a inversores y productores.
          </p>
          <p className="mt-8 text-xs text-neutral-400">
            © {new Date().getFullYear()} Cámara Argentina de Inmobiliarias Rurales.
          </p>
        </div>
      </footer>
    </main>
  );
}
