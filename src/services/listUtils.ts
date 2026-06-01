import type { ListParams, PaginatedResult } from '../types';

export function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function paginate<T>(
  items: T[],
  params: ListParams
): PaginatedResult<T> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export function sortItems<T>(
  items: T[],
  sortBy: string | undefined,
  sortDir: 'asc' | 'desc' = 'asc'
): T[] {
  if (!sortBy) return items;
  const sorted = [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortBy];
    const bv = (b as Record<string, unknown>)[sortBy];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') {
      return av - bv;
    }
    return String(av).localeCompare(String(bv));
  });
  return sortDir === 'desc' ? sorted.reverse() : sorted;
}

export function searchFilter<T>(
  items: T[],
  search: string | undefined,
  fields: (keyof T)[]
): T[] {
  if (!search?.trim()) return items;
  const q = search.toLowerCase();
  return items.filter((item) =>
    fields.some((f) => String(item[f]).toLowerCase().includes(q))
  );
}
