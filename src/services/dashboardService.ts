import { getDb } from './storage';
import { delay } from './listUtils';

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  scheduledAppointments: number;
  pendingClaims: number;
  totalClaimsAmount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(200);
  const db = getDb();
  return {
    totalPatients: db.patients.length,
    activePatients: db.patients.filter((p) => p.status === 'active').length,
    scheduledAppointments: db.appointments.filter(
      (a) => a.status === 'scheduled'
    ).length,
    pendingClaims: db.claims.filter(
      (c) => c.status === 'pending' || c.status === 'submitted'
    ).length,
    totalClaimsAmount: db.claims.reduce((sum, c) => sum + c.amount, 0),
  };
}
