'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaIngreso, type Ingreso } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';
import { FormField } from '@cair/ui/FormField';
import { Button } from '@cair/ui/Button';

export function FormularioIngreso() {
  const router = useRouter();
  const [errorIngreso, setErrorIngreso] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Ingreso>({ resolver: zodResolver(esquemaIngreso) });

  async function alEnviar(datos: Ingreso) {
    setErrorIngreso(null);

    const supabase = clienteNavegador();
    const { data, error } = await supabase.auth.signInWithPassword(datos);

    if (error) {
      // Mensaje genérico a propósito: nunca revelar cuál de los dos campos
      // fue el que falló.
      setErrorIngreso('Email o contraseña incorrectos.');
      return;
    }

    // Cualquier cuenta válida de la base puede autenticarse acá — es el
    // mismo proyecto de Auth que el sitio público. Ser admin es una
    // propiedad de app_metadata, no de la clave con la que se entró, así
    // que se chequea después del login, no antes.
    if (data.user.app_metadata.rol !== 'admin') {
      await supabase.auth.signOut();
      setErrorIngreso('No tenés permisos de administrador.');
      return;
    }

    router.push('/moderacion');
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(alEnviar)(event)} className="mt-6 flex flex-col gap-4">
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

      {errorIngreso && <p className="text-sm text-danger">{errorIngreso}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  );
}
