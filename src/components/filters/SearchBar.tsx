import { useChaos } from '../../hooks/useChaos';
import { chaosLabel } from '../../utils/testId';
import { tid } from '../../utils/testId';

interface SearchBarProps {
  testId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ testId, value, onChange, placeholder }: SearchBarProps) {
  const { chaos } = useChaos();
  const activeChaos = chaos.enabled ? chaos : undefined;

  return (
    <div className="flex-1 min-w-[200px]">
      <label htmlFor={testId} className="sr-only">
        {chaosLabel('Search', 'Filter records', activeChaos)}
      </label>
      <input
        id={testId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={chaosLabel(
          placeholder ?? 'Search...',
          'Type to filter...',
          activeChaos
        )}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...tid(testId, activeChaos)}
      />
    </div>
  );
}
