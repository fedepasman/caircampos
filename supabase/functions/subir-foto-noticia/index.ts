// Firma una URL de subida a Cloudflare R2 para la portada de una noticia.
//
// Mismo flujo que subir-foto-campo (vive en una Edge Function porque el
// firmado de R2 no puede pasar por el cliente ni por un Route Handler de
// Next — regla de CLAUDE.md), pero la autorización acá es de ROL, no de
// pertenencia: cualquier admin puede subir la portada de cualquier
// noticia, no hay "dueño" que verificar. Por eso esta función no hace
// ningún lookup a la base (a diferencia de subir-foto-campo, que sí
// necesita confirmar que el socio es dueño del campo) — basta con leer
// `user.app_metadata.rol` directo de `getUser()` (nunca `user_metadata`).
//
// Uso: POST { noticia_id, nombre_archivo, content_type, tamano_bytes } con
// el JWT del admin en el header Authorization. Devuelve { uploadUrl,
// objectKey }: el cliente hace un PUT directo a `uploadUrl` con el
// archivo, y después hace `UPDATE noticias SET imagen_object_key = ...`
// (ver apps/admin/.../formulario-noticia.tsx).

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TAMANO_MAXIMO_BYTES = 8 * 1024 * 1024;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PayloadSolicitud {
  noticia_id?: string;
  nombre_archivo?: string;
  content_type?: string;
  tamano_bytes?: number;
}

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** Nombre de archivo seguro para usar dentro de la clave de R2: sin
 * separadores de directorio ni caracteres que puedan alterar la ruta. */
function sanearNombreArchivo(nombre: string): string {
  return nombre.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return respuestaJson({ error: 'Método no permitido' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return respuestaJson({ error: 'Falta autenticación' }, 401);

  let payload: PayloadSolicitud;
  try {
    payload = (await req.json()) as PayloadSolicitud;
  } catch {
    return respuestaJson({ error: 'JSON inválido' }, 400);
  }

  const {
    noticia_id: noticiaId,
    nombre_archivo: nombreArchivo,
    content_type: contentType,
    tamano_bytes: tamanoBytes,
  } = payload;

  if (!noticiaId || !nombreArchivo || !contentType) {
    return respuestaJson({ error: 'Faltan noticia_id, nombre_archivo o content_type' }, 400);
  }
  if (!TIPOS_PERMITIDOS.has(contentType)) {
    return respuestaJson({ error: 'Tipo de archivo no permitido: solo JPEG, PNG o WEBP' }, 400);
  }
  if (typeof tamanoBytes === 'number' && tamanoBytes > TAMANO_MAXIMO_BYTES) {
    return respuestaJson({ error: 'El archivo supera el tamaño máximo de 8 MB' }, 400);
  }

  // Cliente con el JWT de quien llama: getUser() valida el token contra el
  // servidor de Auth (nunca getSession(), que solo lee la cookie sin
  // validar).
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return respuestaJson({ error: 'Sesión inválida' }, 401);

  // El rol vive en app_metadata, nunca en user_metadata (ver CLAUDE.md):
  // ese último lo edita el propio usuario, y confiar en él acá dejaría que
  // cualquier cuenta se autodeclare admin.
  if (user.app_metadata?.rol !== 'admin') {
    return respuestaJson({ error: 'Solo un admin puede subir esta imagen' }, 403);
  }

  const objectKey = `noticias/${noticiaId}/${crypto.randomUUID()}-${sanearNombreArchivo(nombreArchivo)}`;

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID') ?? ''}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
    },
  });

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME') ?? '',
      Key: objectKey,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );

  return respuestaJson({ uploadUrl, objectKey });
});
