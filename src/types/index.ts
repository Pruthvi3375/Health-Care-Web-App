export type UserRole = 'admin' | 'scheduler' | 'billing';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

export type PatientStatus = 'active' | 'inactive' | 'pending';

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  status: PatientStatus;
  primaryProviderId: string;
  createdAt: string;
}

export interface Provider {
  id: string;
  npi: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
  phone: string;
  active: boolean;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  date: string;
  time: string;
  type: string;
  status: AppointmentStatus;
  notes: string;
}

export type ClaimStatus = 'submitted' | 'pending' | 'denied' | 'paid';

export interface Claim {
  id: string;
  claimNumber: string;
  patientId: string;
  providerId: string;
  serviceDate: string;
  amount: number;
  status: ClaimStatus;
  diagnosisCode: string;
  submittedAt: string;
}

export type UploadStatus = 'processing' | 'completed' | 'failed';

export interface FileUpload {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  patientId: string;
  claimId?: string;
  status: UploadStatus;
  uploadedAt: string;
}

export interface ListParams {
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  filters?: Record<string, string>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
