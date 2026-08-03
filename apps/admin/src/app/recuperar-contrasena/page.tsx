import type { Metadata } from 'next';
import { FormularioRecuperar } from './formulario-recuperar';

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
};

export default function RecuperarContrasenaPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-100 px-6">
      <div className="w-full max-w-sm rounded-lg border border-neutral-600 bg-neutral-50 p-8 shadow-lg">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">
          Recuperar contraseña
        </h1>
        <p className="mt-1 text-sm text-neutral-800">
          Ingresá tu email y te mandamos un link para elegir una contraseña nueva.
        </p>
        <FormularioRecuperar />
      </div>
    </main>
  );
}
