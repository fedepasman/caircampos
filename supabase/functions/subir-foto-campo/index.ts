// Firma una URL de subida a Cloudflare R2 para la foto de un campo.
//
// Vive en una Edge Function y no en un Route Handler de apps/web porque el
// móvil también necesita subir fotos (regla de CLAUDE.md: "El firmado de
// URLs de R2 va en una Edge Function"). Las credenciales de R2 son el único
// secreto que maneja esta función — la autorización contra Supabase se hace
// con el JWT de quien llama, respetando RLS, sin necesitar la service_role.
//
// Uso: POST { campo_id, nombre_archivo, content_type, tamano_bytes } con el
// JWT del socio en el header Authorization. Devuelve { uploadUrl, objectKey }:
// el cliente hace un PUT directo a `uploadUrl` con el archivo, y después
// inserta la fila en `campo_fotos` con `objectKey` (ver
// apps/web/.../subida-fotos.tsx).

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
  campo_id?: string;
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
    campo_id: campoId,
    nombre_archivo: nombreArchivo,
    content_type: contentType,
    tamano_bytes: tamanoBytes,
  } = payload;

  if (!campoId || !nombreArchivo || !contentType) {
    return respuestaJson({ error: 'Faltan campo_id, nombre_archivo o content_type' }, 400);
  }
  if (!TIPOS_PERMITIDOS.has(contentType)) {
    return respuestaJson({ error: 'Tipo de archivo no permitido: solo JPEG, PNG o WEBP' }, 400);
  }
  if (typeof tamanoBytes === 'number' && tamanoBytes > TAMANO_MAXIMO_BYTES) {
    return respuestaJson({ error: 'El archivo supera el tamaño máximo de 8 MB' }, 400);
  }

  // Cliente con el JWT de quien llama: toda lectura de acá en más respeta
  // RLS como ese usuario — no hace falta la service_role para autorizar.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return respuestaJson({ error: 'Sesión inválida' }, 401);

  const { data: socio } = await supabase
    .from('socios')
    .select('id')
    .eq('usuario_id', user.id)
    .maybeSingle();
  if (!socio) return respuestaJson({ error: 'La cuenta no está vinculada a un socio' }, 403);

  // El filtro `socio_id = socio.id` es lo que garantiza la pertenencia real:
  // RLS por sí sola también dejaría ver acá campos públicos de otros socios.
  const { data: campo } = await supabase
    .from('campos')
    .select('id')
    .eq('id', campoId)
    .eq('socio_id', socio.id)
    .maybeSingle();
  if (!campo) return respuestaJson({ error: 'No sos dueño de este campo' }, 403);

  const objectKey = `campos/${campoId}/${crypto.randomUUID()}-${sanearNombreArchivo(nombreArchivo)}`;

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
