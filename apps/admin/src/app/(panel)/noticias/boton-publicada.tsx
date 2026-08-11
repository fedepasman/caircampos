'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clienteNavegador } from '@/lib/supabase/client';
import { Switch } from '@cair/ui/Switch';

/**
 * Publicar/despublicar una noticia directo desde la tabla del listado, sin
 * tener que entrar a editarla. Mismo patrón que `BotonModerar` de
 * `moderacion/`: UPDATE directo (no RPC, a diferencia de moderar_campo —
 * acá no hay ninguna columna protegida, `publicado` está dentro del GRANT
 * normal de `authenticated`, ver `09_noticias.sql`) + `router.refresh()`.
 */
export function BotonPublicada({ id, publicado }: { id: string; publicado: boolean }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function alCambiar() {
    setEnviando(true);

    const { error } = await clienteNavegador()
      .from('noticias')
      .update({ publicado: !publicado })
      .eq('id', id);

    setEnviando(false);

    if (error) return;

    router.refresh();
  }

  return (
    <Switch
      checked={publicado}
      disabled={enviando}
      onChange={() => void alCambiar()}
      label={publicado ? 'Sí' : 'Borrador'}
    />
  );
}
