import type { ReactNode } from 'react';

const colors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  'no-show': 'bg-orange-100 text-orange-800',
  submitted: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  denied: 'bg-red-100 text-red-800',
  processing: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
};

export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status] ?? 'bg-slate-100 text-slate-700'}`}
    >
      {children ?? status}
    </span>
  );
}
