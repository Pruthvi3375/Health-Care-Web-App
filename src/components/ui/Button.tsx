import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useChaos } from '../../hooks/useChaos';
import { tid } from '../../utils/testId';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  testId: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: ReactNode;
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
};

export function Button({
  testId,
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const { chaos } = useChaos();
  const activeChaos = chaos.enabled ? chaos : undefined;

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`}
      {...tid(testId, activeChaos)}
      {...props}
    >
      {children}
    </button>
  );
}
