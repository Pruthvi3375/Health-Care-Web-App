import type { ReactNode } from 'react';
import { useChaos } from '../../hooks/useChaos';
import { tid } from '../../utils/testId';
import { Spinner } from '../ui/Spinner';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  testId: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  rowTestId: (row: T) => string;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  testId,
  columns,
  data,
  loading,
  sortBy,
  sortDir,
  onSort,
  rowTestId,
  emptyMessage = 'No records found.',
  actions,
}: DataTableProps<T>) {
  const { chaos } = useChaos();
  const activeChaos = chaos.enabled ? chaos : undefined;

  if (loading) return <Spinner testId={`${testId}-loading`} />;

  const tableContent = (
    <table className="w-full text-sm text-left" {...tid(testId, activeChaos)}>
      <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
        <tr>
          {columns.map((col) => (
            <th key={col.key} className="px-4 py-3 font-medium">
              {col.sortable && onSort ? (
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-slate-900"
                  data-testid={`table-sort-${col.key}`}
                  onClick={() => onSort(col.key)}
                  aria-label={`Sort by ${col.header}`}
                >
                  {col.header}
                  {sortBy === col.key && (
                    <span aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ) : (
                col.header
              )}
            </th>
          ))}
          {actions && <th className="px-4 py-3 font-medium">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length + (actions ? 1 : 0)}
              className="px-4 py-8 text-center text-slate-500"
              data-testid={`${testId}-empty`}
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-slate-50"
              {...tid(rowTestId(row), activeChaos)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
              {actions && <td className="px-4 py-3">{actions(row)}</td>}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  if (activeChaos?.domRestructure) {
    return (
      <div data-testid={testId} className="overflow-x-auto">
        <div className="border rounded-lg p-2 bg-slate-50">
          <div role="region" aria-label="Data table">
            {tableContent}
          </div>
        </div>
      </div>
    );
  }

  return <div className="overflow-x-auto">{tableContent}</div>;
}
