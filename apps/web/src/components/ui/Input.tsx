import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label htmlFor={inputId} className="block">
      <span className="font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash">
        {label}
      </span>
      <input
        id={inputId}
        className={`mt-2 block w-full rounded-lg border border-smoke bg-carbon px-3 py-2 text-body-sm text-bone outline-none focus:border-soft-indigo ${className}`}
        {...props}
      />
    </label>
  );
}
