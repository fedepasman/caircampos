const LADO_MAXIMO_PX_DEFECTO = 2000;
const CALIDAD_DEFECTO = 0.8;

export interface ResultadoCompresion {
  archivo: File;
  comprimido: boolean;
}

/**
 * Algunos navegadores aceptan 'image/webp' en canvas.toBlob() sin lanzar
 * error pero devuelven PNG en silencio — toDataURL() expone el mime real
 * resultante, así que es la forma confiable de detectar soporte.
 */
function navegadorSoportaWebp(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

function renombrarConExtension(nombreOriginal: string, mime: string): string {
  const extension = mime === 'image/webp' ? 'webp' : mime === 'image/png' ? 'png' : 'jpg';
  const base = nombreOriginal.replace(/\.[^.]+$/, '');
  return `${base}.${extension}`;
}

/**
 * Redimensiona y recodifica una foto en el navegador antes de subirla, con
 * solo APIs nativas (Canvas 2D + createImageBitmap) — sin dependencias
 * nuevas. Si algo falla o el navegador no soporta estas APIs, devuelve el
 * archivo original sin tocar: la compresión es una mejora, nunca debe
 * bloquear la subida.
 */
export async function comprimirImagen(
  archivo: File,
  opciones: { ladoMaximoPx?: number; calidad?: number } = {},
): Promise<ResultadoCompresion> {
  if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') {
    return { archivo, comprimido: false };
  }

  try {
    // imageOrientation: 'from-image' es crítico: sin esto, drawImage solo ve
    // los píxeles crudos del sensor y una foto tomada con el celular rotado
    // sale girada, ignorando el tag EXIF de orientación.
    const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' });

    const ladoMaximo = opciones.ladoMaximoPx ?? LADO_MAXIMO_PX_DEFECTO;
    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const contexto = canvas.getContext('2d');
    if (!contexto) throw new Error('Sin contexto 2d de canvas');

    contexto.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close();

    // Si el navegador sabe codificar WebP se prefiere siempre (mejor
    // compresión a igual calidad); si no, se mantiene el formato original
    // para no perder el canal alfa de un PNG (JPEG no tiene transparencia).
    const formatoSalida = navegadorSoportaWebp() ? 'image/webp' : archivo.type;
    const calidad = opciones.calidad ?? CALIDAD_DEFECTO;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, formatoSalida, calidad);
    });
    if (!blob) throw new Error('canvas.toBlob devolvió null');

    // En fotos ya muy comprimidas o muy chicas, recodificar puede dar un
    // archivo igual o más pesado — en ese caso no vale la pena descartar el
    // original.
    if (blob.size >= archivo.size) {
      return { archivo, comprimido: false };
    }

    const archivoComprimido = new File(
      [blob],
      renombrarConExtension(archivo.name, formatoSalida),
      { type: formatoSalida },
    );
    return { archivo: archivoComprimido, comprimido: true };
  } catch {
    return { archivo, comprimido: false };
  }
}
