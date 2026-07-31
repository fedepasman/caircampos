import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
}

/**
 * Label + input + mensaje de error, el mismo patrón que se repetía a mano
 * en cada formulario del sitio. `forwardRef` porque React Hook Form
 * necesita enganchar el `ref` de `register()` al input real.
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, id, className, ...props },
  ref,
) {
  const idGenerado = useId();
  const idFinal = id ?? idGenerado;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idFinal} className="text-sm font-semibold text-neutral-950">
        {label}
      </label>
      <input
        ref={ref}
        id={idFinal}
        className={
          className ??
          'rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-base text-neutral-950'
        }
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
});
