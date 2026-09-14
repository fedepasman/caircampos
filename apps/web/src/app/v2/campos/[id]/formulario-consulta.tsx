'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaConsulta, type Consulta } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';
import { FormTextarea } from '@cair/ui/FormTextarea';
import { Button } from '@cair/ui/Button';

export function FormularioConsulta({
  campoId,
  compradorId,
}: {
  campoId: string;
  compradorId: string;
}) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Consulta>({ resolver: zodResolver(esquemaConsulta) });

  async function alEnviar(datos: Consulta) {
    setErrorGeneral(null);

    const { error } = await clienteNavegador()
      .from('consultas')
      .insert({ campo_id: campoId, comprador_id: compradorId, mensaje: datos.mensaje });

    if (error) {
      setErrorGeneral('No se pudo enviar la consulta. Intentá de nuevo.');
      return;
    }

    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(alEnviar)(event)}
      className="mt-4 flex flex-col gap-3"
    >
      <FormTextarea label="Mensaje" error={errors.mensaje?.message} {...register('mensaje')} />

      {errorGeneral && <p className="text-danger text-sm">{errorGeneral}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando…' : 'Enviar consulta'}
      </Button>
    </form>
  );
}
