import type { HTMLAttributes } from 'react';

export type BadgeTone = 'brand' | 'neutral';

const ESTILOS_POR_TONO: Record<BadgeTone, string> = {
  brand: 'bg-brand-900 text-neutral-50',
  neutral: 'bg-neutral-600 text-neutral-50',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  const base = `rounded-sm px-2 py-1 text-xs font-semibold ${ESTILOS_POR_TONO[tone]}`;
  return <span className={className ? `${base} ${className}` : base} {...props} />;
}
