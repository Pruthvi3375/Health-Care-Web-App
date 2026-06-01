import type { Appointment, ListParams, PaginatedResult } from '../types';
import { getDb, persistDb } from './storage';
import { delay, paginate, searchFilter, sortItems } from './listUtils';

export async function listAppointments(
  params: ListParams = {}
): Promise<PaginatedResult<Appointment>> {
  await delay();
  let items = [...getDb().appointments];
  if (params.filters?.status) {
    items = items.filter((a) => a.status === params.filters!.status);
  }
  items = searchFilter(items, params.search, ['type', 'notes', 'date']);
  items = sortItems(items, params.sortBy, params.sortDir);
  return paginate(items, params);
}

export async function createAppointment(
  data: Omit<Appointment, 'id'>
): Promise<Appointment> {
  await delay();
  const db = getDb();
  const conflict = db.appointments.find(
    (a) =>
      a.providerId === data.providerId &&
      a.date === data.date &&
      a.time === data.time &&
      a.status === 'scheduled'
  );
  if (conflict) {
    throw new Error(
      'This provider already has a scheduled appointment at that date and time.'
    );
  }
  const appointment: Appointment = {
    ...data,
    id: `APT${String(db.appointments.length + 1).padStart(3, '0')}`,
  };
  db.appointments.push(appointment);
  persistDb();
  return appointment;
}

export async function updateAppointment(
  id: string,
  data: Partial<Appointment>
): Promise<Appointment> {
  await delay();
  const db = getDb();
  const idx = db.appointments.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('Appointment not found.');
  db.appointments[idx] = { ...db.appointments[idx], ...data };
  persistDb();
  return db.appointments[idx];
}
