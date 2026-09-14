import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Handshake, MapPin } from 'lucide-react';
import { clienteServidor } from '@/lib/supabase/server';
import { BuscadorMapa } from '@/components/buscador-mapa';
import { BuscadorLocalidad } from '@/components/buscador-localidad';
import { MODALIDADES_CAMPO, TIPOS_CAMPO } from '@cair/schemas';
import { formatearPrecioUsd } from '@cair/shared';
import { urlFotoCampo } from '@/lib/url-foto-campo';
import { TituloDosTonos } from './_components/titulo-dos-tonos';
import { TarjetaImagenConTexto } from './_components/tarjeta-imagen-con-texto';
import { TarjetaTextoFoto } from './_components/tarjeta-texto-foto';
import { EstadisticaDestacada } from './_components/estadistica-destacada';

// Draft de comparación: no se indexa ni se anuncia mientras se decide si
// reemplaza a la home actual — ver el comentario en robots.ts.
export const metadata: Metadata = {
  title: 'Inicio (draft) — CAIR',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

/** Mismas 4 regiones reales que la home actual — no se inventa contenido nuevo. */
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
 * Draft de rediseño — convive con `(sitio)/page.tsx` (la home real) para
 * poder compararlas antes de elegir. Ver el plan en el chat: toma de la
 * referencia visual el lenguaje de composición (header flotante, hero sin
 * buscador, tarjetas superpuestas, títulos en dos tonos, grillas bento,
 * franja de estadísticas), nunca su contenido inventado — cada cifra que se
 * muestra sale de un `count()`/`sum()` real, nunca de un texto fijo (a
 * diferencia del "+150 Socios" hardcodeado que tiene hoy la home actual,
 * pese a que `/DESIGN.md` prohíbe exactamente eso).
 */
export default async function InicioV2() {
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

  // Estadísticas reales — nunca inventadas. `revisado_por_cair` queda
  // explícito por legibilidad aunque la política RLS de `anon` ya lo exige
  // (mismo criterio que sitemap.ts).
  const { count: cantidadSocios } = await supabase
    .from('socios')
    .select('*', { count: 'exact', head: true })
    .eq('publicado', true);

  const { count: cantidadCampos } = await supabase
    .from('campos')
    .select('*', { count: 'exact', head: true })
    .eq('publicado', true)
    .eq('revisado_por_cair', 'aprobado');

  const { data: camposParaSuma } = await supabase
    .from('campos')
    .select('hectareas')
    .eq('publicado', true)
    .eq('revisado_por_cair', 'aprobado');
  const hectareasTotales = (camposParaSuma ?? []).reduce(
    (acumulado, campo) => acumulado + campo.hectareas,
    0,
  );

  const aniosDeTrayectoria = new Date().getFullYear() - 2010;

  return (
    <main>
      {/* Hero — puramente institucional, sin buscador (se movió a su propia
          sección, ver más abajo). `pt-24` compensa el header fixed.
          `items-center` + una caja más alta (antes `min-h-[720px]`/
          `items-end`, que con el contenido real llenaba casi toda la
          sección y el texto quedaba pegado al header) — así el bloque de
          texto queda centrado verticalmente, con el mismo aire arriba y
          abajo que la referencia. */}
      <section className="relative flex min-h-[880px] items-center overflow-hidden pt-24 pb-24">
        <Image
          src="/imagenes/hero-v2.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Foto provista por el usuario para probar en este draft — pendiente
            confirmar licencia de uso antes de promover esta página. */}
        {/* 40%: 25% dejaba muy poco contraste para el texto blanco contra el
            verde claro de la foto, 50% apagaba demasiado el campo. */}
        <div className="absolute inset-0 bg-neutral-950/40" aria-hidden />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.15em] text-neutral-50 uppercase">
              Cámara Argentina de Inmobiliarias Rurales
            </p>
            {/* `font-body` (Hanken Grotesk) en negro (900), no `font-display`
                (Libre Caslon Text, serif): la referencia que mandó el
                usuario pide un título más "cuadrado" y fuerte — Hanken
                Grotesk ya está en la paleta de marca aprobada y llega
                cargada completa como variable font (confirmado: el
                `@font-face` generado declara `font-weight: 100 900`), así
                que el peso 900 está realmente disponible sin sumar
                tipografía nueva. No va a leer tan geométrica/redondeada
                como la referencia (son familias distintas) — lo que se
                puede exprimir dentro de Hanken Grotesk es tamaño, tracking
                apretado y buen contraste contra la foto. */}
            <h1 className="font-body mt-3 text-[44px] leading-[1] font-black tracking-tight text-balance text-neutral-50 sm:text-[64px]">
              El punto de encuentro del mercado inmobiliario rural
            </h1>
            <p className="mt-4 text-lg text-neutral-100">
              Conectamos personas, campos y profesionales para impulsar negocios rurales con
              respaldo y confianza.
            </p>
            {/* Copia mobile del CTA: en `sm:` en adelante este mismo botón se
                muda al renglón de abajo, alineado con las tarjetas (ver el
                comentario ahí) — acá solo queda visible por debajo de `sm`,
                donde ese renglón está oculto. */}
            <Link
              href="#buscar"
              className="bg-accent-400 text-brand-900 hover:bg-accent-300 mt-6 inline-block rounded-full px-6 py-3 text-base font-semibold sm:hidden"
            >
              Buscar campos
            </Link>
          </div>

          {/* Botón + tarjetas en un mismo renglón, alineados por abajo —
              en la referencia el CTA/rating comparte renglón con las dos
              tarjetas, acá el CTA "Buscar campos" (copia de escritorio,
              duplicado del de arriba solo para mobile) ocupa ese mismo
              lugar. Las tarjetas siguen ocultas por debajo de `sm` por
              espacio: ahí el mismo destino ya está en el CTA de arriba y en
              el buscador de más abajo. */}
          <div className="hidden items-end justify-between gap-6 sm:flex">
            <Link
              href="#buscar"
              className="bg-accent-400 text-brand-900 hover:bg-accent-300 hidden rounded-full px-6 py-3 text-base font-semibold sm:inline-block"
            >
              Buscar campos
            </Link>

            <div className="flex gap-4">
              <Link
                href="/v2/campos?modalidad=venta"
                className="group relative block h-52 w-72 overflow-hidden rounded-xl shadow-xl"
              >
                <Image
                  src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600&auto=format&fit=crop"
                  alt=""
                  fill
                  sizes="288px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/10 to-transparent"
                  aria-hidden
                />
                {/* `font-body font-black`, no `font-display`: mismo criterio
                    tipográfico del título del hero — ver el comentario ahí. */}
                <p className="font-body absolute bottom-4 left-4 text-lg font-black text-neutral-50">
                  Comprar
                </p>
              </Link>

              <div className="flex h-52 w-72 flex-col justify-center gap-3 rounded-xl border border-neutral-50/20 bg-neutral-950/60 p-5 shadow-xl backdrop-blur">
                <div className="bg-accent-400 flex h-10 w-10 items-center justify-center rounded-full">
                  <Handshake size={18} className="text-brand-900" />
                </div>
                <p className="font-body text-lg font-black text-neutral-50">Asociate a la cámara</p>
                <Link
                  href="/v2/asociate"
                  className="text-sm font-semibold text-neutral-200 underline underline-offset-4 hover:text-neutral-50"
                >
                  Sumá tu inmobiliaria →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Franja de estadísticas reales — corrige el "+150 Socios"
          hardcodeado que tiene la home actual pese a que DESIGN.md lo
          prohíbe explícitamente: acá las 4 cifras salen de un
          count()/sum() real contra la base, no de un texto fijo. Va pegada
          debajo del hero (antes del buscador, no después): sin margen ni
          padding vertical de por medio en el DOM entre ambas secciones, así
          que no hay hueco visible. */}
      <section className="bg-brand-900 px-6 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-neutral-50 sm:grid-cols-4 [&_p:first-child]:text-neutral-50 [&_p:last-child]:text-neutral-300">
          <EstadisticaDestacada valor={cantidadSocios} etiqueta="Inmobiliarias socias" />
          <EstadisticaDestacada valor={cantidadCampos} etiqueta="Campos publicados" />
          <EstadisticaDestacada
            // Redondeado para mostrar: la cifra de base es real (suma de
            // `hectareas` de los campos publicados y aprobados), acá solo
            // se le saca el decimal para que se lea como un titular. El
            // formateo de miles y la animación de conteo los hace el
            // propio componente — acá solo se le pasa el número real.
            valor={Math.round(hectareasTotales)}
            sufijo=" ha"
            etiqueta="Hectáreas publicadas"
          />
          <EstadisticaDestacada valor={aniosDeTrayectoria} etiqueta="Años de trayectoria" />
        </div>
      </section>

      {/* Buscador — reubicado fuera del hero, a pedido explícito: el hero
          queda solo institucional. Misma lógica de siempre (form GET real,
          sin JS, mismos `name`), solo cambia el envoltorio visual. */}
      <section id="buscar" className="scroll-mt-24 bg-neutral-100 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <TituloDosTonos fuerte="Buscá tu" suave="campo ideal" className="text-2xl sm:text-3xl" />
          <form
            action="/v2/campos"
            className="mt-6 rounded-xl border border-neutral-600 bg-neutral-50 p-2 text-left shadow-lg"
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
                className="flex-1 rounded-full border border-neutral-700 bg-neutral-50 px-4 py-3 text-base text-neutral-950"
                defaultValue={TIPOS_CAMPO[0]}
              >
                <option value="agricola">Agrícola</option>
                <option value="ganadero">Ganadero</option>
                <option value="mixto">Mixto</option>
              </select>
              <BuscadorLocalidad
                name="q"
                placeholder="Ej: Pergamino, Buenos Aires"
                wrapperClassName="flex-[2]"
                className="w-full rounded-full border border-neutral-700 bg-neutral-50 px-4 py-3 text-base text-neutral-950 placeholder:text-neutral-700"
              />
              <button
                type="submit"
                className="bg-accent-400 text-brand-900 hover:bg-accent-300 rounded-full px-6 py-3 text-base font-semibold"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Búsqueda geográfica — el mapa real, sin tocar el componente. Va
          justo debajo del buscador (antes estaba más abajo en la página),
          como segunda forma de encontrar campos apenas se termina de usar
          la primera. */}
      <section id="mapa-campos" className="scroll-mt-24 bg-neutral-200 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <TituloDosTonos fuerte="Búsqueda" suave="geográfica" className="text-center text-3xl" />

          {camposParaMapa && camposParaMapa.length > 0 ? (
            <div className="mt-8">
              <BuscadorMapa campos={camposParaMapa} basePathFicha="/v2/campos" />
            </div>
          ) : (
            <p className="mt-8 text-center text-neutral-800">
              Todavía no hay campos publicados para mostrar en el mapa.
            </p>
          )}
        </div>
      </section>

      {/* Campos destacados — 3 tarjetas iguales, texto arriba + foto
          cuadrada abajo. Justo debajo del mapa de búsqueda geográfica, a
          pedido explícito (antes iba al final, justo antes del footer). */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-end justify-between gap-4">
          <TituloDosTonos fuerte="Campos" suave="destacados" className="text-3xl" />
          <Link
            href="/v2/campos"
            className="text-brand-900 shrink-0 text-sm font-semibold underline underline-offset-4"
          >
            Ver todos →
          </Link>
        </div>

        {campos && campos.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {campos.map((campo) => {
              const objectKey = [...campo.campo_fotos].sort((a, b) => a.orden - b.orden)[0]
                ?.object_key;
              return (
                <TarjetaTextoFoto
                  key={campo.id}
                  href={`/v2/campos/${campo.id}`}
                  src={objectKey ? urlFotoCampo(objectKey, 'tarjeta') : undefined}
                  alt={campo.titulo}
                  titulo={campo.titulo}
                  subtitulo={`${campo.localidad}, ${campo.provincia} · ${formatearPrecioUsd(campo.precio_usd)}`}
                />
              );
            })}
          </div>
        ) : (
          <p className="mt-8 text-neutral-800">Todavía no hay campos publicados.</p>
        )}
      </section>

      {/* Bloque institucional — mismo copy real que ya usa el hero de hoy
          ("La unión que nació fuerte"), ninguna cifra nueva inventada. */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="relative h-72 w-full overflow-hidden rounded-xl lg:h-96">
            <Image
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <TituloDosTonos fuerte="La unión que" suave="nació fuerte" className="text-3xl" />
            <p className="mt-4 leading-relaxed text-neutral-800">
              Somos la institución referente en el mercado de tierras de Argentina, brindando
              transparencia, profesionalismo y seguridad jurídica a inversores y productores desde
              nuestra fundación el 29 de octubre de 2010.
            </p>
            <div className="mt-6 flex items-center gap-3 text-neutral-800">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200">
                <MapPin size={20} className="text-brand-900" />
              </div>
              <p className="text-sm">
                Cobertura nacional, con inmobiliarias socias en todo el país.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ubicaciones principales — bento, mismo array real de siempre. */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <TituloDosTonos fuerte="Ubicaciones" suave="principales" className="text-3xl" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {UBICACIONES_PRINCIPALES.map((ubicacion) => (
            <TarjetaImagenConTexto
              key={ubicacion.nombre}
              href={`/v2/campos?q=${encodeURIComponent(ubicacion.nombre)}`}
              src={ubicacion.foto}
              alt=""
              titulo={ubicacion.nombre}
              subtitulo={ubicacion.tagline}
              className="h-56"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
