// Manda una notificación push al socio dueño del campo cuando entra una
// consulta nueva.
//
// La llama el trigger `private.notificar_nueva_consulta()`
// (supabase/schemas/04_consultas.sql) vía pg_net, no un usuario logueado —
// por eso corre con `verify_jwt = false` y en cambio valida un secreto
// compartido en el header `X-Internal-Secret`. Usa `service_role` porque no
// hay JWT de usuario del que depender: es el caso previsto en
// supabase/functions/README.md para esta clave, no un atajo.
//
// Solo recibe `consulta_id`: resuelve campo/socio/tokens acá adentro con
// service_role en vez de confiar en datos que le pasara el trigger, mismo
// criterio que ya usa subir-foto-campo de no confiar en el llamador.

import { createClient } from '@supabase/supabase-js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PayloadSolicitud {
  consulta_id?: string;
}

interface TicketExpo {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return respuestaJson({ error: 'Método no permitido' }, 405);

  const secretoRecibido = req.headers.get('X-Internal-Secret');
  const secretoEsperado = Deno.env.get('INTERNAL_TRIGGER_SECRET');
  if (!secretoEsperado || secretoRecibido !== secretoEsperado) {
    return respuestaJson({ error: 'No autorizado' }, 401);
  }

  let payload: PayloadSolicitud;
  try {
    payload = (await req.json()) as PayloadSolicitud;
  } catch {
    return respuestaJson({ error: 'JSON inválido' }, 400);
  }

  const { consulta_id: consultaId } = payload;
  if (!consultaId) return respuestaJson({ error: 'Falta consulta_id' }, 400);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: consulta } = await supabase
    .from('consultas')
    .select('campo_id, campos(titulo, socio_id)')
    .eq('id', consultaId)
    .maybeSingle();

  const campo = consulta?.campos as { titulo: string; socio_id: string } | null | undefined;
  if (!campo) return respuestaJson({ error: 'Consulta o campo no encontrado' }, 404);

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('id, token')
    .eq('socio_id', campo.socio_id);

  if (!tokens || tokens.length === 0) return respuestaJson({ enviados: 0 });

  const mensajes = tokens.map((t) => ({
    to: t.token,
    title: 'Nueva consulta',
    body: `Recibiste una consulta por "${campo.titulo}"`,
    data: { campoId: consulta.campo_id, consultaId },
  }));

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const respuestaExpo = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(mensajes),
  });
  const resultado = (await respuestaExpo.json()) as { data?: TicketExpo[] };

  // Un dispositivo desinstaló la app o el token venció: Expo lo reporta acá,
  // no como un error de red. Se limpia para no seguir intentando en vano.
  const tokensMuertos = (resultado.data ?? [])
    .map((ticket, indice) => ({ ticket, id: tokens[indice]?.id }))
    .filter(({ ticket }) => ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered')
    .map(({ id }) => id)
    .filter((id): id is string => id !== undefined);

  if (tokensMuertos.length > 0) {
    await supabase.from('push_tokens').delete().in('id', tokensMuertos);
  }

  return respuestaJson({ enviados: mensajes.length, tokensLimpiados: tokensMuertos.length });
});
