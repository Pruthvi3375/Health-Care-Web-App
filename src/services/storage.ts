import type {
  Appointment,
  Claim,
  FileUpload,
  Patient,
  Provider,
} from '../types';
import appointmentsSeed from '../data/seed/appointments.json';
import claimsSeed from '../data/seed/claims.json';
import patientsSeed from '../data/seed/patients.json';
import providersSeed from '../data/seed/providers.json';
import uploadsSeed from '../data/seed/uploads.json';

const STORAGE_KEY = 'healthcore-mock-db';
const SEED_VERSION = 2;

interface MockDb {
  seedVersion?: number;
  patients: Patient[];
  providers: Provider[];
  appointments: Appointment[];
  claims: Claim[];
  uploads: FileUpload[];
}

function seedDb(): MockDb {
  return {
    seedVersion: SEED_VERSION,
    patients: [...patientsSeed] as Patient[],
    providers: [...providersSeed] as Provider[],
    appointments: [...appointmentsSeed] as Appointment[],
    claims: [...claimsSeed] as Claim[],
    uploads: [...uploadsSeed] as FileUpload[],
  };
}

function mergeSeedRecords<T extends { id: string }>(
  seedRecords: T[],
  storedRecords: T[] | undefined
): T[] {
  const seedIds = new Set(seedRecords.map((record) => record.id));
  return [
    ...seedRecords,
    ...(Array.isArray(storedRecords)
      ? storedRecords.filter((record) => !seedIds.has(record.id))
      : []),
  ];
}

function normalizeDb(stored?: Partial<MockDb>): MockDb {
  const seed = seedDb();
  if (!stored || stored.seedVersion !== SEED_VERSION) {
    return seed;
  }
  return {
    seedVersion: SEED_VERSION,
    patients: mergeSeedRecords(seed.patients, stored.patients),
    providers: mergeSeedRecords(seed.providers, stored.providers),
    appointments: mergeSeedRecords(seed.appointments, stored.appointments),
    claims: mergeSeedRecords(seed.claims, stored.claims),
    uploads: mergeSeedRecords(seed.uploads, stored.uploads),
  };
}

function loadDb(): MockDb {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return normalizeDb(JSON.parse(stored) as Partial<MockDb>);
    } catch {
      /* fall through */
    }
  }
  return seedDb();
}

let db = loadDb();

export function persistDb(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDb(): void {
  db = seedDb();
  persistDb();
}

export function getDb(): MockDb {
  return db;
}

export function setDb(next: MockDb): void {
  db = next;
  persistDb();
}

// Persist the normalized shape so stale/empty localStorage is upgraded on load.
persistDb();
