import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface FormCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(function FormCheckbox(
  { label, id, className, ...props },
  ref,
) {
  const idGenerado = useId();
  const idFinal = id ?? idGenerado;

  return (
    <label
      htmlFor={idFinal}
      className="flex items-center gap-2 text-sm font-semibold text-neutral-950"
    >
      <input
        ref={ref}
        id={idFinal}
        type="checkbox"
        className={className ?? 'accent-brand-900'}
        {...props}
      />
      {label}
    </label>
  );
});
