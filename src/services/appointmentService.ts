import type { Appointment, ListParams, PaginatedResult } from '../types';
import { getDb, persistDb } from './storage';
import { delay, paginate, sortItems } from './listUtils';

export async function listAppointments(
  params: ListParams = {}
): Promise<PaginatedResult<Appointment>> {
  await delay();
  let items = [...getDb().appointments];
  if (params.filters?.status) {
    items = items.filter((a) => a.status === params.filters!.status);
  }
  if (params.search?.trim()) {
    const q = params.search.toLowerCase();
    const patients = getDb().patients;
    items = items.filter((appointment) => {
      const patient = patients.find((p) => p.id === appointment.patientId);
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : '';
      return [appointment.type, appointment.notes, appointment.date, patientName].some((value) =>
        value.toLowerCase().includes(q)
      );
    });
  }
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
  const nextNum =
    db.appointments.reduce((max, appointment) => {
      const n = Number(appointment.id.replace(/\D/g, ''));
      return Number.isFinite(n) && n > max ? n : max;
    }, 0) + 1;
  const appointment: Appointment = {
    ...data,
    id: String(nextNum),
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
