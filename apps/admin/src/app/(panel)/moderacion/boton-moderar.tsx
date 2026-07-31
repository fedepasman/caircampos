'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clienteNavegador } from '@/lib/supabase/client';
import { Button } from '@cair/ui/Button';

export function BotonModerar({ campoId }: { campoId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState<'aprobado' | 'rechazado' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function moderar(nuevoEstado: 'aprobado' | 'rechazado') {
    setEnviando(nuevoEstado);
    setError(null);

    const { error: errorRpc } = await clienteNavegador().rpc('moderar_campo', {
      campo_id_a_moderar: campoId,
      nuevo_estado: nuevoEstado,
    });

    if (errorRpc) {
      setError('No se pudo actualizar.');
      setEnviando(null);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="primary"
        disabled={enviando !== null}
        onClick={() => void moderar('aprobado')}
        className="px-3 py-1.5 text-sm"
      >
        {enviando === 'aprobado' ? 'Aprobando…' : 'Aprobar'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={enviando !== null}
        onClick={() => void moderar('rechazado')}
        className="px-3 py-1.5 text-sm"
      >
        {enviando === 'rechazado' ? 'Rechazando…' : 'Rechazar'}
      </Button>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
