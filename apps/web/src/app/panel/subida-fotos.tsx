'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { clienteNavegador } from '@/lib/supabase/client';
import { buttonStyles } from '@cair/ui/Button';
import { urlFotoCampo } from '@/lib/url-foto-campo';
import { comprimirImagen } from '@/lib/comprimir-imagen';
import type { Tables } from '@cair/supabase';

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TAMANO_MAXIMO_BYTES = 8 * 1024 * 1024;

interface RespuestaFirma {
  uploadUrl: string;
  objectKey: string;
}

/**
 * Carga y galería de fotos de un campo. Solo aparece con un campo ya
 * guardado (necesita `campoId` para pedir la URL firmada) — por eso no está
 * disponible en el alta, solo al editar.
 *
 * El flujo completo: 1) pide una URL firmada a la Edge Function
 * `subir-foto-campo` (las credenciales de R2 nunca llegan acá), 2) sube el
 * archivo directo a R2 con un PUT, 3) inserta la fila en `campo_fotos` — RLS
 * ya garantiza que solo el dueño del campo puede hacerlo.
 */
export function SubidaFotos({
  campoId,
  fotos,
}: {
  campoId: string;
  fotos: Pick<Tables<'campo_fotos'>, 'id' | 'object_key' | 'orden'>[];
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

    // Defensivo: comprimirImagen ya debería cumplir esto siempre (redimensiona
    // a ~2000px/calidad 0.8, muy por debajo de 8MB), pero todo dato que cruza
    // a la subida se revalida, incluso el que acaba de producir este mismo
    // código.
    if (!TIPOS_PERMITIDOS.has(archivoFinal.type) || archivoFinal.size > TAMANO_MAXIMO_BYTES) {
      setError('No se pudo procesar la imagen. Probá con otro archivo.');
      setSubiendo(false);
      return;
    }

    const supabase = clienteNavegador();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- el tipo `FunctionsResponseFailure` de @supabase/functions-js declara `error: any`, no nuestro.
    const { data: firma, error: errorFirma } = await supabase.functions.invoke<RespuestaFirma>(
      'subir-foto-campo',
      {
        body: {
          campo_id: campoId,
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

    const siguienteOrden = fotos.length > 0 ? Math.max(...fotos.map((foto) => foto.orden)) + 1 : 0;

    const { error: errorInsert } = await supabase
      .from('campo_fotos')
      .insert({ campo_id: campoId, object_key: firma.objectKey, orden: siguienteOrden });

    setSubiendo(false);

    if (errorInsert) {
      setError('La imagen se subió pero no se pudo guardar. Intentá de nuevo.');
      return;
    }

    router.refresh();
  }

  async function alEliminar(fotoId: string) {
    if (!window.confirm('¿Eliminar esta foto?')) return;

    const { error: errorDelete } = await clienteNavegador()
      .from('campo_fotos')
      .delete()
      .eq('id', fotoId);

    if (errorDelete) {
      setError('No se pudo eliminar la foto. Intentá de nuevo.');
      return;
    }

    router.refresh();
  }

  const fotosOrdenadas = [...fotos].sort((a, b) => a.orden - b.orden);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-neutral-950">Fotos</p>

      {fotosOrdenadas.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fotosOrdenadas.map((foto) => (
            <div
              key={foto.id}
              className="group relative aspect-square overflow-hidden rounded-md border border-neutral-600"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (R2), no pasa por el optimizador de imágenes de Next */}
              <img
                src={urlFotoCampo(foto.object_key, 'miniatura')}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => void alEliminar(foto.id)}
                className="absolute top-1 right-1 rounded-sm bg-neutral-950/70 px-2 py-1 text-xs font-semibold text-neutral-50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => void alSeleccionarArchivo(event)}
          className="hidden"
          id="input-foto"
          disabled={subiendo}
        />
        <label
          htmlFor="input-foto"
          className={`${buttonStyles('secondary')} inline-block cursor-pointer`}
        >
          {subiendo ? 'Subiendo…' : 'Agregar foto'}
        </label>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}
