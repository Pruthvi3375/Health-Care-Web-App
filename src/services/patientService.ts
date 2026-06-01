import type { ListParams, PaginatedResult, Patient } from '../types';
import { getDb, persistDb } from './storage';
import { delay, paginate, searchFilter, sortItems } from './listUtils';

export async function listPatients(
  params: ListParams = {}
): Promise<PaginatedResult<Patient>> {
  await delay();
  let items = [...getDb().patients];
  if (params.filters?.status) {
    items = items.filter((p) => p.status === params.filters!.status);
  }
  items = searchFilter(items, params.search, [
    'firstName',
    'lastName',
    'mrn',
    'email',
  ]);
  items = sortItems(items, params.sortBy, params.sortDir);
  return paginate(items, params);
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  await delay(150);
  return getDb().patients.find((p) => p.id === id);
}

export async function createPatient(
  data: Omit<Patient, 'id' | 'createdAt'>
): Promise<Patient> {
  await delay();
  const db = getDb();
  if (db.patients.some((p) => p.mrn === data.mrn)) {
    throw new Error('A patient with this MRN already exists.');
  }
  const patient: Patient = {
    ...data,
    id: `P${String(db.patients.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
  };
  db.patients.push(patient);
  persistDb();
  return patient;
}

export async function updatePatient(
  id: string,
  data: Partial<Patient>
): Promise<Patient> {
  await delay();
  const db = getDb();
  const idx = db.patients.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Patient not found.');
  if (data.mrn && db.patients.some((p) => p.mrn === data.mrn && p.id !== id)) {
    throw new Error('A patient with this MRN already exists.');
  }
  db.patients[idx] = { ...db.patients[idx], ...data };
  persistDb();
  return db.patients[idx];
}

export async function deletePatient(id: string): Promise<void> {
  await delay();
  const db = getDb();
  db.patients = db.patients.filter((p) => p.id !== id);
  persistDb();
}
