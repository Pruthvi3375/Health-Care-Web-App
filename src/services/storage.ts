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

interface MockDb {
  patients: Patient[];
  providers: Provider[];
  appointments: Appointment[];
  claims: Claim[];
  uploads: FileUpload[];
}

function loadDb(): MockDb {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as MockDb;
    } catch {
      /* fall through */
    }
  }
  return {
    patients: [...patientsSeed] as Patient[],
    providers: [...providersSeed] as Provider[],
    appointments: [...appointmentsSeed] as Appointment[],
    claims: [...claimsSeed] as Claim[],
    uploads: [...uploadsSeed] as FileUpload[],
  };
}

let db = loadDb();

export function persistDb(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDb(): void {
  db = {
    patients: [...patientsSeed] as Patient[],
    providers: [...providersSeed] as Provider[],
    appointments: [...appointmentsSeed] as Appointment[],
    claims: [...claimsSeed] as Claim[],
    uploads: [...uploadsSeed] as FileUpload[],
  };
  persistDb();
}

export function getDb(): MockDb {
  return db;
}

export function setDb(next: MockDb): void {
  db = next;
  persistDb();
}

// Initial persist for deterministic first load
if (!localStorage.getItem(STORAGE_KEY)) {
  persistDb();
}
