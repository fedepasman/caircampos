import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const base = 'rounded-xl border border-neutral-600 bg-neutral-50';
  return <div className={className ? `${base} ${className}` : base} {...props} />;
}
