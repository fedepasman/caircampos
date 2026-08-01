'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaIngreso, type Ingreso } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';
import { FormField } from '@cair/ui/FormField';
import { Button } from '@cair/ui/Button';

export function FormularioIngreso() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/panel';
  const [errorIngreso, setErrorIngreso] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Ingreso>({ resolver: zodResolver(esquemaIngreso) });

  async function alEnviar(datos: Ingreso) {
    setErrorIngreso(null);

    const { error } = await clienteNavegador().auth.signInWithPassword(datos);

    if (error) {
      // Mensaje genérico a propósito: nunca revelar cuál de los dos campos
      // fue el que falló.
      setErrorIngreso('Email o contraseña incorrectos.');
      return;
    }

    router.push(redirectTo);
    router.refresh();
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

      <FormField
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      {errorIngreso && <p className="text-danger text-sm">{errorIngreso}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  );
}
