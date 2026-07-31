'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaIngreso, type Ingreso } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';

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

    const { error } = await clienteNavegador().auth.signInWithPassword(datos);

    if (error) {
      // Mensaje genérico a propósito: nunca revelar cuál de los dos campos
      // fue el que falló.
      setErrorIngreso('Email o contraseña incorrectos.');
      return;
    }

    router.push('/panel');
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(alEnviar)(event)} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-semibold text-neutral-950">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-base text-neutral-950"
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-semibold text-neutral-950">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-base text-neutral-950"
          {...register('password')}
        />
        {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
      </div>

      {errorIngreso && <p className="text-sm text-danger">{errorIngreso}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-sm bg-accent-400 px-6 py-3 text-base font-semibold text-brand-900 disabled:opacity-60"
      >
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
