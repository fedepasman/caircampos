import type { Metadata } from 'next';
import { FormularioIngreso } from './formulario-ingreso';

export const metadata: Metadata = {
  title: 'Ingresar',
  // Página de sesión: no aporta nada a la búsqueda y es superficie
  // autenticada. La protección real son las tres capas que documenta
  // apps/web/src/proxy.ts; esto es solo la señal a buscadores.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function IngresarPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-neutral-100 px-6 py-16">
      <div className="w-full max-w-sm rounded-lg border border-neutral-600 bg-neutral-50 p-8 shadow-lg">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">Ingresar</h1>
        <p className="mt-1 text-sm text-neutral-800">Acceso para socios de CAIR.</p>
        <FormularioIngreso />
      </div>
    </main>
  );
}
