'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaNuevaContrasena, type NuevaContrasena } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';
import { FormField } from '@cair/ui/FormField';
import { Button } from '@cair/ui/Button';

export function FormularioNuevaContrasena() {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NuevaContrasena>({ resolver: zodResolver(esquemaNuevaContrasena) });

  async function alEnviar(datos: NuevaContrasena) {
    setErrorGeneral(null);

    const { error } = await clienteNavegador().auth.updateUser({ password: datos.password });

    if (error) {
      setErrorGeneral('No se pudo actualizar la contraseña. Intentá de nuevo.');
      return;
    }

    router.push('/panel');
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(alEnviar)(event)}
      className="mt-6 flex flex-col gap-4"
    >
      <FormField
        label="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <FormField
        label="Repetir contraseña"
        type="password"
        autoComplete="new-password"
        error={errors.confirmarPassword?.message}
        {...register('confirmarPassword')}
      />

      {errorGeneral && <p className="text-danger text-sm">{errorGeneral}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
      </Button>
    </form>
  );
}
