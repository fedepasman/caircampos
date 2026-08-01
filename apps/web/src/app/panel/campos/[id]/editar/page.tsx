import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { clienteServidor } from '@/lib/supabase/server';
import { FormularioCampo } from '../../../formulario-campo';

export const metadata: Metadata = {
  title: 'Editar campo',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function EditarCampoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await clienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ingresar');
  }

  // Filtro explícito por dueño: la política de SELECT de `socios` también
  // deja ver todas las filas `publicado = true` (para el directorio
  // público de /inmobiliarias), así que sin este `.eq()` `.maybeSingle()`
  // recibe más de una fila y falla en silencio.
  const { data: socio } = await supabase
    .from('socios')
    .select('id')
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (!socio) {
    redirect('/panel');
  }

  // El `.eq('socio_id', ...)` es obligatorio, no redundante con RLS: la
  // política de SELECT de `campos` también deja ver cualquier campo
  // publicado y aprobado de otro socio (para /campos), así que sin este
  // filtro un socio podría abrir el formulario de edición de un campo
  // ajeno con solo conocer su id (BOLA/IDOR) — el guardado fallaría por la
  // política de UPDATE, pero para entonces ya se filtraron sus datos.
  const { data: campo } = await supabase
    .from('campos')
    .select('*')
    .eq('id', id)
    .eq('socio_id', socio.id)
    .maybeSingle();

  if (!campo) {
    notFound();
  }

  const { data: fotos } = await supabase
    .from('campo_fotos')
    .select('id, object_key, orden')
    .eq('campo_id', id);

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Editar campo</h1>
      <FormularioCampo socioId={socio.id} campoExistente={campo} fotos={fotos ?? []} />
    </main>
  );
}
