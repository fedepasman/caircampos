import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string | undefined;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(function FormSelect(
  { label, error, id, className, children, ...props },
  ref,
) {
  const idGenerado = useId();
  const idFinal = id ?? idGenerado;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idFinal} className="text-sm font-semibold text-neutral-950">
        {label}
      </label>
      <select
        ref={ref}
        id={idFinal}
        className={
          className ??
          'rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-base text-neutral-950'
        }
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
});
