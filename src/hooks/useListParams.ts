import { useCallback, useState } from 'react';
import type { ListParams } from '../types';

const DEFAULT: ListParams = {
  search: '',
  sortBy: '',
  sortDir: 'asc',
  page: 1,
  pageSize: 5,
  filters: {},
};

export function useListParams(initial?: Partial<ListParams>) {
  const [params, setParams] = useState<ListParams>({ ...DEFAULT, ...initial });

  const setSearch = useCallback((search: string) => {
    setParams((p) => ({ ...p, search, page: 1 }));
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setParams((p) => ({
      ...p,
      filters: { ...p.filters, [key]: value },
      page: 1,
    }));
  }, []);

  const setSort = useCallback((sortBy: string, dir?: 'asc' | 'desc') => {
    setParams((p) => ({
      ...p,
      sortBy,
      sortDir: dir ?? (p.sortBy === sortBy && p.sortDir === 'asc' ? 'desc' : 'asc'),
      page: 1,
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setParams((p) => ({ ...p, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setParams((p) => ({ ...p, pageSize, page: 1 }));
  }, []);

  return {
    params,
    setSearch,
    setFilter,
    setSort,
    setPage,
    setPageSize,
    reset: () => setParams({ ...DEFAULT, ...initial }),
  };
}
