import type { SelectHTMLAttributes } from 'react';
import { useChaos } from '../../hooks/useChaos';
import { tid } from '../../utils/testId';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  testId: string;
  label: string;
  options: SelectOption[];
  error?: string;
}

export function Select({ testId, label, options, error, id, className = '', ...props }: SelectProps) {
  const { chaos } = useChaos();
  const activeChaos = chaos.enabled ? chaos : undefined;
  const selectId = id ?? testId;

  return (
    <div className="mb-4">
      <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${className}`}
        aria-invalid={!!error}
        {...tid(testId, activeChaos)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-600 mt-1" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
