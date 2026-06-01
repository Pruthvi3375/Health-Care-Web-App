import type { InputHTMLAttributes } from 'react';
import { useChaos } from '../../hooks/useChaos';
import { tid } from '../../utils/testId';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  testId: string;
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ testId, label, error, hint, id, className = '', ...props }: InputProps) {
  const { chaos } = useChaos();
  const activeChaos = chaos.enabled ? chaos : undefined;
  const inputId = id ?? testId;

  const labelEl = (
    <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
      {label}
    </label>
  );

  const inputEl = (
    <input
      id={inputId}
      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-500' : 'border-slate-300'
      } ${className}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${testId}-error` : undefined}
      {...tid(testId, activeChaos)}
      {...props}
    />
  );

  if (activeChaos?.domRestructure) {
    return (
      <div className="mb-4" data-wrapper={testId}>
        <div className="flex flex-col-reverse gap-1">
          {inputEl}
          {labelEl}
        </div>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
        {error && (
          <p id={`${testId}-error`} className="text-xs text-red-600 mt-1" data-testid={`${testId}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4">
      {labelEl}
      {inputEl}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      {error && (
        <p id={`${testId}-error`} className="text-xs text-red-600 mt-1" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
