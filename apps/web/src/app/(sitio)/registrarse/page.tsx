import type { Metadata } from 'next';
import { FormularioRegistro } from './formulario-registro';

export const metadata: Metadata = {
  title: 'Registrarme',
  // Superficie de auth: ver la nota de robots en /ingresar/page.tsx.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function RegistrarsePage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-neutral-100 px-6 py-16">
      <div className="w-full max-w-sm rounded-lg border border-neutral-600 bg-neutral-50 p-8 shadow-lg">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">Registrarme</h1>
        <p className="mt-1 text-sm text-neutral-800">
          Creá tu cuenta para consultar por un campo.
        </p>
        <FormularioRegistro />
      </div>
    </main>
  );
}
