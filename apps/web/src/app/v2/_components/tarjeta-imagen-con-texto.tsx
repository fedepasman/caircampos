import Image from 'next/image';
import Link from 'next/link';

/**
 * Tarjeta de foto con texto superpuesto sobre la parte inferior de la
 * imagen (gradiente oscuro + texto blanco) — generaliza el patrón de
 * `apps/web/src/app/(sitio)/noticias/page.tsx` (imagen vía `next/image
 * fill` dentro de un contenedor `relative`), agregándole el overlay de
 * texto que noticias no necesita. El `className` del contenedor lo decide
 * quien la usa (alto, `col-span`/`row-span`), para poder armar grillas tipo
 * bento sin que este componente sepa nada de layout.
 *
 * `src` es opcional: un campo sin foto todavía no debería desaparecer de la
 * grilla (deja un hueco en el bento) — mismo criterio de `(sitio)/page.tsx`,
 * que en ese caso muestra un degradé de marca en vez de la imagen.
 */
export function TarjetaImagenConTexto({
  src,
  alt,
  titulo,
  subtitulo,
  href,
  sizes = '(min-width: 640px) 50vw, 100vw',
  className = 'h-48',
}: {
  src?: string | undefined;
  alt: string;
  titulo: string;
  subtitulo?: string;
  href?: string;
  sizes?: string;
  className?: string;
}) {
  const contenido = (
    <div className={`group relative w-full overflow-hidden rounded-xl ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      ) : (
        <div
          className="from-brand-700 to-brand-900 absolute inset-0 bg-gradient-to-br"
          aria-hidden
        />
      )}
      <div
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/20 to-transparent p-4 pt-10"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-display font-semibold text-neutral-50">{titulo}</p>
        {subtitulo && <p className="text-sm text-neutral-200">{subtitulo}</p>}
      </div>
    </div>
  );

  if (!href) return contenido;
  return <Link href={href}>{contenido}</Link>;
}
