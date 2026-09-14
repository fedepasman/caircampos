import { IconosRedes } from './iconos-redes';

/**
 * Footer compartido por todas las páginas de `/v2` — antes vivía solo
 * dentro de `page.tsx` (la home), así que el resto de las páginas
 * (`/v2/campos`, `/v2/noticias`, etc.) no lo tenían. Se movió acá y se
 * cuelga de `v2/layout.tsx`, mismo criterio que `HeaderFlotante`: un solo
 * lugar, se hereda en toda la familia de rutas de `/v2` automáticamente.
 */
export function Footer() {
  return (
    <footer className="bg-neutral-950 px-6 py-12 text-neutral-200">
      <div className="mx-auto flex max-w-5xl flex-col justify-between gap-8 sm:flex-row sm:items-end">
        <div>
          <p className="font-display text-accent-400 text-lg font-semibold">CAIR</p>
          <p className="mt-2 max-w-md text-sm">
            Somos la institución referente en el mercado de tierras de Argentina, brindando
            transparencia, profesionalismo y seguridad jurídica a inversores y productores.
          </p>
          <p className="mt-8 text-xs text-neutral-400">
            © {new Date().getFullYear()} Cámara Argentina de Inmobiliarias Rurales.
          </p>
        </div>

        <IconosRedes />
      </div>
    </footer>
  );
}
