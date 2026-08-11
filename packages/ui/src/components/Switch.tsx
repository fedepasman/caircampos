import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

/**
 * Interruptor on/off. Por debajo es un `<input type="checkbox">` real —
 * navegable por teclado y anunciado por lectores de pantalla— escondido con
 * `sr-only`; el riel y la perilla se dibujan encima con CSS puro (`peer`),
 * sin estado propio de React: el estado lo controla quien lo usa, como
 * cualquier checkbox controlado o no controlado.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, id, className, ...props },
  ref,
) {
  const idGenerado = useId();
  const idFinal = id ?? idGenerado;

  return (
    <label
      htmlFor={idFinal}
      className={
        className ??
        'inline-flex items-center gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-60'
      }
    >
      <span className="relative inline-block h-6 w-11 shrink-0 cursor-pointer">
        <input ref={ref} id={idFinal} type="checkbox" className="peer sr-only" {...props} />
        <span
          aria-hidden
          className="peer-checked:bg-brand-900 peer-focus-visible:ring-brand-900 absolute inset-0 rounded-full bg-neutral-600 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
        />
        <span
          aria-hidden
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-neutral-50 shadow transition-transform peer-checked:translate-x-5"
        />
      </span>
      {label && <span className="text-sm font-semibold text-neutral-950">{label}</span>}
    </label>
  );
});
