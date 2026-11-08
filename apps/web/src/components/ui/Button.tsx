import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost';

const styles: Record<Variant, string> = {
  primary: 'bg-bone text-carbon hover:bg-ash',
  ghost: 'bg-transparent text-bone border border-smoke hover:bg-iron',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-body-sm font-medium transition-colors disabled:text-mist ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
