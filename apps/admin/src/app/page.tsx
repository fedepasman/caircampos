/**
 * Home provisoria del panel.
 *
 * Existe para probar el build y la cadena de estilos. Las pantallas reales
 * del panel se definen más adelante.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-6">
      <p className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
        Panel administrativo
      </p>
      <h1 className="text-3xl font-bold text-neutral-900">CAIR</h1>
      <p className="text-neutral-600">
        Estructura inicial del proyecto. Sin funcionalidades ni diseño definitivo.
      </p>
    </main>
  );
}
