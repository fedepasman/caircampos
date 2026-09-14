import Image from 'next/image';

/**
 * Hero compacto para las páginas internas de `/v2` (listados, directorios)
 * — mismo lenguaje visual que el hero de la home (foto full-bleed + velo +
 * título en `font-body` negro), pero más bajo: acá es solo la cabecera de
 * la página, no el primer momento de toda la experiencia, así que no
 * necesita ocupar casi la pantalla completa como el de la home.
 */
export function HeroSeccion({
  src,
  alt,
  titulo,
  subtitulo,
}: {
  src: string;
  alt: string;
  titulo: string;
  subtitulo?: string;
}) {
  return (
    <section className="relative flex min-h-[340px] items-end overflow-hidden pt-24 pb-10">
      <Image src={src} alt={alt} fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-neutral-950/40" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <h1 className="font-body text-[32px] leading-[1.05] font-black tracking-tight text-balance text-neutral-50 sm:text-[44px]">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-3 max-w-xl text-neutral-100">{subtitulo}</p>}
      </div>
    </section>
  );
}
