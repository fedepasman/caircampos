import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Tarjeta con el texto arriba (título + botón circular con flecha) y la
 * foto abajo, cuadrada — patrón distinto a `TarjetaImagenConTexto` (foto de
 * fondo con texto superpuesto): acá el texto siempre se lee sobre fondo
 * plano, nunca sobre la imagen, así que no hace falta gradiente ni depende
 * del contraste de la foto de turno.
 */
export function TarjetaTextoFoto({
  href,
  titulo,
  subtitulo,
  src,
  alt,
}: {
  href: string;
  titulo: string;
  subtitulo: string;
  src?: string | undefined;
  alt: string;
}) {
  return (
    <Link href={href} className="group block rounded-2xl bg-neutral-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-lg font-semibold text-neutral-950">{titulo}</h3>
        <span className="bg-brand-900 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-50 transition-transform group-hover:translate-x-0.5">
          <ArrowRight size={16} />
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-neutral-700">{subtitulo}</p>

      <div className="relative mt-6 aspect-square w-full overflow-hidden rounded-xl">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div
            className="from-brand-700 to-brand-900 absolute inset-0 bg-gradient-to-br"
            aria-hidden
          />
        )}
      </div>
    </Link>
  );
}
