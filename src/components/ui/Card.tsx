import type { ReactNode } from 'react';

export function Card({
  children,
  testId,
  className = '',
}: {
  children: ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}
      {...(testId ? { 'data-testid': testId } : {})}
    >
      {children}
    </div>
  );
}
