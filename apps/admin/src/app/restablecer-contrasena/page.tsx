import type { Metadata } from 'next';
import { FormularioNuevaContrasena } from './formulario-nueva-contrasena';

export const metadata: Metadata = {
  title: 'Restablecer contraseña',
};

// Sin chequeo de sesión acá: el proxy (apps/admin/src/proxy.ts) ya exige
// `esAdmin` para cualquier ruta que no sea /ingresar, /auth/confirm o
// /recuperar-contrasena — para cuando esta página renderiza, `verifyOtp` ya
// dejó una sesión de admin válida.
export default function RestablecerContrasenaPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-100 px-6">
      <div className="w-full max-w-sm rounded-lg border border-neutral-600 bg-neutral-50 p-8 shadow-lg">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">
          Restablecer contraseña
        </h1>
        <p className="mt-1 text-sm text-neutral-800">Elegí tu contraseña nueva.</p>
        <FormularioNuevaContrasena />
      </div>
    </main>
  );
}
