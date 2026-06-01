import { TEST_IDS } from '../../testids';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-200">
      <p className="text-sm text-slate-600" data-testid={TEST_IDS.table.pageInfo}>
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-3">
        <div className="w-28">
          <Select
            testId={TEST_IDS.table.pageSize}
            label="Per page"
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            options={[
              { value: '5', label: '5' },
              { value: '10', label: '10' },
              { value: '25', label: '25' },
            ]}
          />
        </div>
        <Button
          testId={TEST_IDS.table.paginationPrev}
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <Button
          testId={TEST_IDS.table.paginationNext}
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
