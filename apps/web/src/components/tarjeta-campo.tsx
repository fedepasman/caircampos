import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Ruler, Sprout, Tag } from 'lucide-react';
import { buttonStyles } from '@cair/ui/Button';
import { ETIQUETAS_MODALIDAD_CAMPO, ETIQUETAS_TIPO_CAMPO, formatearPrecioUsd } from '@cair/shared';
import { urlFotoCampo } from '@/lib/url-foto-campo';
import type { CampoParaListado } from '@/lib/campos/filtros';

function fotoPortada(fotos: { object_key: string; orden: number }[]): string | undefined {
  return [...fotos].sort((a, b) => a.orden - b.orden)[0]?.object_key;
}

/** La `<li>` de la grilla de resultados de `/campos` y `/v2/campos` — antes
 * duplicada letra por letra en los dos `page.tsx`. */
export function TarjetaCampo({
  campo,
  basePathFicha,
}: {
  campo: CampoParaListado;
  basePathFicha: '/campos' | '/v2/campos';
}) {
  const objectKey = fotoPortada(campo.campo_fotos);

  return (
    <li className="group hover:border-brand-900 flex flex-col overflow-hidden rounded-md border border-neutral-600 bg-neutral-50 transition-all duration-300 hover:shadow-xl">
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
        <div className="from-brand-700 to-brand-900 h-64 bg-gradient-to-br" aria-hidden />
      )}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-xl leading-tight font-semibold text-neutral-950">
              {campo.titulo}
            </h3>
            <span className="font-display text-brand-900 text-lg font-semibold whitespace-nowrap">
              {formatearPrecioUsd(campo.precio_usd ?? null)}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-2 text-neutral-800">
            <MapPin size={18} />
            {campo.localidad}, {campo.provincia}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-4 border-y border-neutral-600/40 py-4">
            <div className="text-center">
              <Ruler className="text-brand-900 mx-auto" size={22} />
              <p className="mt-1 text-xs font-semibold text-neutral-800">{campo.hectareas} Ha</p>
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
          href={`${basePathFicha}/${campo.id}`}
          className={`${buttonStyles('secondary')} hover:bg-brand-900 mt-6 w-full text-center hover:text-neutral-50`}
        >
          Ver Detalles
        </Link>
      </div>
    </li>
  );
}
