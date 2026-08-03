'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaSolicitarRecuperacion, type SolicitarRecuperacion } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import { FormField } from '@cair/ui/FormField';
import { Button } from '@cair/ui/Button';

export function FormularioRecuperar() {
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SolicitarRecuperacion>({ resolver: zodResolver(esquemaSolicitarRecuperacion) });

  async function alEnviar(datos: SolicitarRecuperacion) {
    await clienteNavegador().auth.resetPasswordForEmail(datos.email, {
      redirectTo: `${env.NEXT_PUBLIC_ADMIN_URL}/auth/confirm?next=/restablecer-contrasena`,
    });

    // Mismo mensaje exista o no esa cuenta: revelar cuál de los dos casos
    // fue permite enumerar emails registrados.
    setEnviado(true);
  }

  if (enviado) {
    return (
      <p className="mt-6 text-sm text-neutral-800">
        Si ese email está registrado, te mandamos un link para restablecer tu contraseña. Revisá tu
        bandeja de entrada.
      </p>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(alEnviar)(event)}
      className="mt-6 flex flex-col gap-4"
    >
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Enviando…' : 'Enviar link de recuperación'}
      </Button>
    </form>
  );
}
