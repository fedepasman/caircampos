import type { Metadata } from 'next';
import { FormularioIngreso } from './formulario-ingreso';

export const metadata: Metadata = {
  title: 'Ingresar',
};

export default function IngresarPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-100 px-6">
      <div className="w-full max-w-sm rounded-lg border border-neutral-600 bg-neutral-50 p-8 shadow-lg">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">Panel CAIR</h1>
        <p className="mt-1 text-sm text-neutral-800">Acceso solo para administradores.</p>
        <FormularioIngreso />
      </div>
    </main>
  );
}
