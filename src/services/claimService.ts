import type { Claim, ListParams, PaginatedResult } from '../types';
import { getDb, persistDb } from './storage';
import { delay, paginate, searchFilter, sortItems } from './listUtils';

export async function listClaims(
  params: ListParams = {}
): Promise<PaginatedResult<Claim>> {
  await delay();
  let items = [...getDb().claims];
  if (params.filters?.status) {
    items = items.filter((c) => c.status === params.filters!.status);
  }
  items = searchFilter(items, params.search, [
    'claimNumber',
    'diagnosisCode',
  ]);
  items = sortItems(items, params.sortBy, params.sortDir);
  return paginate(items, params);
}

export async function getClaim(id: string): Promise<Claim | undefined> {
  await delay(150);
  return getDb().claims.find((c) => c.id === id);
}

export async function updateClaimStatus(
  id: string,
  status: Claim['status']
): Promise<Claim> {
  await delay();
  const db = getDb();
  const idx = db.claims.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Claim not found.');
  db.claims[idx] = { ...db.claims[idx], status };
  persistDb();
  return db.claims[idx];
}
