import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary';

const ESTILOS_BASE =
  'rounded-sm px-6 py-3 text-base font-semibold transition-colors disabled:opacity-60';

const ESTILOS_POR_VARIANTE: Record<ButtonVariant, string> = {
  // El dorado escaso: la acción principal de la pantalla, nunca más de una
  // por vista (ver The Scarcity Rule en /DESIGN.md).
  primary: 'bg-accent-400 text-brand-900 hover:bg-accent-300',
  secondary: 'border border-brand-900 text-brand-900 hover:bg-brand-900/5',
};

/**
 * Mismas clases que `<Button>`, para los casos donde el elemento visual es
 * en realidad un `<Link>` de Next (navegación, no submit de formulario) y
 * no puede pasar por este componente.
 */
export function buttonStyles(variant: ButtonVariant = 'primary'): string {
  return `${ESTILOS_BASE} ${ESTILOS_POR_VARIANTE[variant]}`;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className, ...props },
  ref,
) {
  const clases = className ? `${buttonStyles(variant)} ${className}` : buttonStyles(variant);
  return <button ref={ref} className={clases} {...props} />;
});
