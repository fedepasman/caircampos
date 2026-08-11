'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { clienteNavegador } from '@/lib/supabase/client';
import { buttonStyles } from '@cair/ui/Button';
import { urlFotoNoticia } from '@/lib/url-foto-noticia';
import { comprimirImagen } from '@/lib/comprimir-imagen';

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TAMANO_MAXIMO_BYTES = 8 * 1024 * 1024;

interface RespuestaFirma {
  uploadUrl: string;
  objectKey: string;
}

/**
 * Portada de una noticia — una sola imagen, no una galería (a diferencia de
 * `SubidaFotos` del panel de socios): no hay orden ni lista de miniaturas,
 * solo "agregar"/"reemplazar". Solo aparece con una noticia ya guardada
 * (necesita `noticiaId` para pedir la URL firmada) — por eso no está
 * disponible en el alta, solo al editar.
 *
 * Mismo flujo de 3 pasos que `apps/web/.../subida-fotos.tsx`: 1) pide una
 * URL firmada a la Edge Function `subir-foto-noticia`, 2) sube el archivo
 * directo a R2 con un PUT, 3) guarda el `object_key` en la propia fila de
 * `noticias` (no en una tabla aparte, al ser una sola imagen).
 */
export function SubidaImagen({
  noticiaId,
  imagenObjectKey,
}: {
  noticiaId: string;
  imagenObjectKey: string | null;
}) {
  const router = useRouter();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alSeleccionarArchivo(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (!archivo) return;

    if (!TIPOS_PERMITIDOS.has(archivo.type)) {
      setError('Solo se permiten imágenes JPEG, PNG o WEBP.');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      setError('La imagen no puede superar los 8 MB.');
      return;
    }

    setError(null);
    setSubiendo(true);

    const { archivo: archivoFinal } = await comprimirImagen(archivo);

    // Defensivo: comprimirImagen ya debería cumplir esto siempre, pero todo
    // dato que cruza a la subida se revalida, incluso el que acaba de
    // producir este mismo código.
    if (!TIPOS_PERMITIDOS.has(archivoFinal.type) || archivoFinal.size > TAMANO_MAXIMO_BYTES) {
      setError('No se pudo procesar la imagen. Probá con otro archivo.');
      setSubiendo(false);
      return;
    }

    const supabase = clienteNavegador();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- el tipo `FunctionsResponseFailure` de @supabase/functions-js declara `error: any`, no nuestro.
    const { data: firma, error: errorFirma } = await supabase.functions.invoke<RespuestaFirma>(
      'subir-foto-noticia',
      {
        body: {
          noticia_id: noticiaId,
          nombre_archivo: archivoFinal.name,
          content_type: archivoFinal.type,
          tamano_bytes: archivoFinal.size,
        },
      },
    );

    if (errorFirma || !firma) {
      setError('No se pudo iniciar la subida. Intentá de nuevo.');
      setSubiendo(false);
      return;
    }

    const subida = await fetch(firma.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': archivoFinal.type },
      body: archivoFinal,
    });

    if (!subida.ok) {
      setError('No se pudo subir la imagen. Intentá de nuevo.');
      setSubiendo(false);
      return;
    }

    const { error: errorUpdate } = await supabase
      .from('noticias')
      .update({ imagen_object_key: firma.objectKey })
      .eq('id', noticiaId);

    setSubiendo(false);

    if (errorUpdate) {
      setError('La imagen se subió pero no se pudo guardar. Intentá de nuevo.');
      return;
    }

    router.refresh();
  }

  async function alQuitar() {
    if (!window.confirm('¿Quitar la portada de esta noticia?')) return;

    const { error: errorUpdate } = await clienteNavegador()
      .from('noticias')
      .update({ imagen_object_key: null })
      .eq('id', noticiaId);

    if (errorUpdate) {
      setError('No se pudo quitar la portada. Intentá de nuevo.');
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-neutral-950">Portada (opcional)</p>

      {imagenObjectKey && (
        <div className="group relative aspect-video w-full max-w-sm overflow-hidden rounded-md border border-neutral-600">
          {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (R2), no pasa por el optimizador de imágenes de Next */}
          <img
            src={urlFotoNoticia(imagenObjectKey)}
            alt=""
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => void alQuitar()}
            className="absolute top-1 right-1 rounded-sm bg-neutral-950/70 px-2 py-1 text-xs font-semibold text-neutral-50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            Quitar
          </button>
        </div>
      )}

      <div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => void alSeleccionarArchivo(event)}
          className="hidden"
          id="input-portada"
          disabled={subiendo}
        />
        <label
          htmlFor="input-portada"
          className={`${buttonStyles('secondary')} inline-block cursor-pointer`}
        >
          {subiendo ? 'Subiendo…' : imagenObjectKey ? 'Reemplazar portada' : 'Agregar portada'}
        </label>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}
