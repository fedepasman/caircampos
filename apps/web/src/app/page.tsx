/**
 * Home provisoria.
 *
 * Existe para probar la cadena completa —Server Component, Tailwind sobre los
 * tokens compartidos, metadata, build— y no para definir la página de inicio.
 * El contenido y el diseño real los produce la etapa de diseño con el flujo
 * `new-work` del skill `impeccable`.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-6">
      <p className="text-brand-600 text-sm font-semibold tracking-wide uppercase">Sitio público</p>
      <h1 className="text-4xl font-bold text-balance text-neutral-900">
        Cámara Argentina de Inmobiliarias Rurales
      </h1>
      <p className="text-neutral-600">
        Estructura inicial del proyecto. Sin funcionalidades ni diseño definitivo.
      </p>
    </main>
  );
}
