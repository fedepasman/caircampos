import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | undefined;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ label, error, id, className, rows = 4, ...props }, ref) {
    const idGenerado = useId();
    const idFinal = id ?? idGenerado;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={idFinal} className="text-sm font-semibold text-neutral-950">
          {label}
        </label>
        <textarea
          ref={ref}
          id={idFinal}
          rows={rows}
          className={
            className ??
            'rounded-sm border border-neutral-700 bg-neutral-50 px-3 py-2 text-base text-neutral-950'
          }
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  },
);
