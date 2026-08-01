'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaRegistroComprador, type RegistroComprador } from '@cair/schemas';
import { clienteNavegador } from '@/lib/supabase/client';
import { FormField } from '@cair/ui/FormField';
import { Button } from '@cair/ui/Button';

export function FormularioRegistro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/';
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistroComprador>({ resolver: zodResolver(esquemaRegistroComprador) });

  async function alEnviar(datos: RegistroComprador) {
    setErrorGeneral(null);

    const supabase = clienteNavegador();

    const { data, error: errorRegistro } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
    });

    if (errorRegistro || !data.user) {
      setErrorGeneral('No se pudo crear la cuenta. Probá con otro email.');
      return;
    }

    const { error: errorComprador } = await supabase.from('compradores').insert({
      usuario_id: data.user.id,
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono,
    });

    if (errorComprador) {
      setErrorGeneral(
        'La cuenta se creó, pero no se pudieron guardar tus datos. Intentá de nuevo.',
      );
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
        label="Nombre"
        type="text"
        error={errors.nombre?.message}
        {...register('nombre')}
      />

      <FormField
        label="Apellido"
        type="text"
        error={errors.apellido?.message}
        {...register('apellido')}
      />

      <FormField
        label="Teléfono"
        type="tel"
        error={errors.telefono?.message}
        {...register('telefono')}
      />

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
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      {errorGeneral && <p className="text-danger text-sm">{errorGeneral}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  );
}
