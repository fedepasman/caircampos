import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { clienteServidor } from '@/lib/supabase/server';
import { BuscadorMapa } from '@/components/buscador-mapa';
import { MODALIDADES_CAMPO, TIPOS_CAMPO } from '@cair/schemas';
import { formatearPrecioUsd } from '@cair/shared';
import { env } from '@/lib/env';

/**
 * Regiones reales de Argentina para la sección "Ubicaciones principales".
 * Cada una navega a una búsqueda real en /campos (por ahora puede devolver
 * cero resultados en regiones sin campos cargados todavía — es un estado
 * honesto, no un link roto).
 */
const UBICACIONES_PRINCIPALES = [
  {
    nombre: 'Buenos Aires',
    tagline: 'Corazón productivo del país',
    foto: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop',
  },
  {
    nombre: 'Entre Ríos',
    tagline: 'Región mesopotámica',
    foto: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop',
  },
  {
    nombre: 'Patagonia',
    tagline: 'Extensión y paisaje único',
    foto: 'https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?q=80&w=1200&auto=format&fit=crop',
  },
  {
    nombre: 'Córdoba',
    tagline: 'Llanura agrícola central',
    foto: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1200&auto=format&fit=crop',
  },
] as const;

/**
 * Home pública. Server Component: la regla de SEO de CLAUDE.md exige que los
 * listados públicos se rendericen en servidor, no que se carguen desde el
 * cliente después del primer paint.
 *
 * Identidad visual "Agro-Institutional Modernism", adoptada desde
 * Base_Stitch/agro_institutional_modernism/DESIGN.md — ver /DESIGN.md en la
 * raíz. El buscador del hero es un `<form>` GET real (sin JS): navega a la landing de
 * resultados `/campos?modalidad=...&tipo_campo=...&q=...`
 * (`(sitio)/campos/page.tsx`), que filtra server-side — no al mapa embebido
 * de esta misma página, que sigue siendo solo un preview rápido.
 */
export default async function Home() {
  const supabase = await clienteServidor();

  const { data: campos } = await supabase
    .from('campos')
    .select(
      'id, titulo, provincia, localidad, hectareas, precio_usd, campo_fotos(object_key, orden)',
    )
    .eq('publicado', true)
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: camposParaMapa } = await supabase
    .from('campos')
    .select(
      'id, titulo, hectareas, precio_usd, latitud, longitud, provincia, localidad, campo_fotos(object_key, orden)',
    )
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
            La unión que nació fuerte · Fundada el 29 de octubre de 2010.
          </p>

          <form
            action="/campos"
            className="mt-2 w-full rounded-md bg-neutral-50 p-2 text-left shadow-lg"
          >
            <div className="flex gap-1 px-2 pt-1 pb-2">
              {MODALIDADES_CAMPO.map((valor, indice) => (
                <label
                  key={valor}
                  className="has-[:checked]:border-brand-900 has-[:checked]:text-brand-900 cursor-pointer border-b-[3px] border-transparent px-1 pb-1 text-sm font-semibold text-neutral-800"
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
                className="bg-accent-400 text-brand-900 rounded-sm px-6 py-3 text-base font-semibold"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>

        <a
          href="#mapa-campos"
          className="absolute right-6 bottom-6 z-10 rounded-full bg-neutral-50 px-5 py-2 text-sm font-semibold text-neutral-950 shadow-lg hover:bg-neutral-200"
        >
          Ver en mapa
        </a>
      </section>

      {/* Franja de confianza */}
      <section className="bg-brand-900 py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 text-center text-neutral-50 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg font-semibold">Transparencia</p>
            <p className="text-sm text-neutral-200">Ética y profesionalismo en cada operación.</p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold">+150 Socios</p>
            <p className="text-sm text-neutral-200">
              La mayor red de inmobiliarias especializadas en el campo.
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Cobertura nacional</p>
            <p className="text-sm text-neutral-200">Propiedades en las regiones productivas.</p>
          </div>
        </div>
      </section>

      {/* Campos destacados */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl font-semibold text-neutral-950">
            Campos destacados
          </h2>
          <Link
            href="/campos"
            className="text-brand-900 text-sm font-semibold underline underline-offset-4"
          >
            Ver todos →
          </Link>
        </div>

        {campos && campos.length > 0 ? (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {campos.map((campo) => {
              const objectKey = [...campo.campo_fotos].sort((a, b) => a.orden - b.orden)[0]
                ?.object_key;
              return (
                <li key={campo.id}>
                  <Link
                    href={`/campos/${campo.id}`}
                    className="hover:border-brand-900 block overflow-hidden rounded-md border border-neutral-600 bg-neutral-50"
                  >
                    {objectKey ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URL externa (R2)
                      <img
                        src={`${env.NEXT_PUBLIC_R2_PUBLIC_URL}/${objectKey}`}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div
                        className="from-brand-700 to-brand-900 h-40 bg-gradient-to-br"
                        aria-hidden
                      />
                    )}
                    <div className="flex flex-col gap-1 p-4">
                      <p className="flex items-center gap-1 text-sm text-neutral-800">
                        <MapPin size={14} />
                        {campo.localidad}, {campo.provincia}
                      </p>
                      <p className="font-display text-lg font-semibold text-neutral-950">
                        {campo.titulo}
                      </p>
                      <div className="mt-2 flex items-center justify-between border-t border-neutral-600 pt-2">
                        <div>
                          <p className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                            Superficie
                          </p>
                          <p className="text-sm font-semibold text-neutral-950">
                            {campo.hectareas} Ha
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold tracking-widest text-neutral-800 uppercase">
                            Precio
                          </p>
                          <p className="text-brand-900 text-sm font-semibold">
                            {formatearPrecioUsd(campo.precio_usd)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-8 text-neutral-800">Todavía no hay campos publicados.</p>
        )}
      </section>

      {/* Búsqueda geográfica */}
      <section id="mapa-campos" className="scroll-mt-20 bg-neutral-200 px-6 py-16">
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

      {/* Ubicaciones principales */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-3xl font-semibold text-neutral-950">
          Ubicaciones principales
        </h2>
        {/* Fotografías: banco de imágenes Unsplash. */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {UBICACIONES_PRINCIPALES.map((ubicacion) => (
            <Link
              key={ubicacion.nombre}
              href={`/campos?q=${encodeURIComponent(ubicacion.nombre)}`}
              className="group relative block h-48 overflow-hidden rounded-md"
            >
              <Image
                src={ubicacion.foto}
                alt=""
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-neutral-950/40" aria-hidden />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="font-display text-lg font-semibold text-neutral-50">
                  {ubicacion.nombre}
                </p>
                <p className="text-sm text-neutral-200">{ubicacion.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 px-6 py-12 text-neutral-200">
        <div className="mx-auto max-w-5xl">
          <p className="font-display text-accent-400 text-lg font-semibold">CAIR</p>
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
