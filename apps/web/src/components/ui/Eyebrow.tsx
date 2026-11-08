import type { HTMLAttributes } from 'react';

export function Eyebrow({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash ${className}`}
      {...props}
    />
  );
}
