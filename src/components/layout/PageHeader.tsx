import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
  testId,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  testId: string;
}) {
  return (
    <div
      className="flex flex-wrap items-start justify-between gap-4 mb-6"
      data-testid={testId}
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
