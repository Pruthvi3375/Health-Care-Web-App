import type { ListParams, PaginatedResult, Provider } from '../types';
import { getDb, persistDb } from './storage';
import { delay, paginate, searchFilter, sortItems } from './listUtils';

export async function listProviders(
  params: ListParams = {}
): Promise<PaginatedResult<Provider>> {
  await delay();
  let items = [...getDb().providers];
  if (params.filters?.specialty) {
    items = items.filter((p) => p.specialty === params.filters!.specialty);
  }
  items = searchFilter(items, params.search, [
    'firstName',
    'lastName',
    'npi',
    'specialty',
  ]);
  items = sortItems(items, params.sortBy, params.sortDir);
  return paginate(items, params);
}

export async function getAllProviders(): Promise<Provider[]> {
  await delay(100);
  return getDb().providers;
}

export async function createProvider(
  data: Omit<Provider, 'id'>
): Promise<Provider> {
  await delay();
  const db = getDb();
  const provider: Provider = {
    ...data,
    id: `PRV${String(db.providers.length + 1).padStart(3, '0')}`,
  };
  db.providers.push(provider);
  persistDb();
  return provider;
}

export async function updateProvider(
  id: string,
  data: Partial<Provider>
): Promise<Provider> {
  await delay();
  const db = getDb();
  const idx = db.providers.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Provider not found.');
  db.providers[idx] = { ...db.providers[idx], ...data };
  persistDb();
  return db.providers[idx];
}
