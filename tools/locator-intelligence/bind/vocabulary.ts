/**
 * The binding vocabulary: how human-readable Gherkin nouns map to the
 * application's page objects and logical selector keys (registry paths).
 *
 * Keeping this data-driven means new pages/steps are usually a config change
 * rather than new binder code.
 */

export interface PageInfo {
  /** Page object class name. */
  object: string;
  /** Route used by `goto`. */
  route: string;
  /** Registry key whose presence proves the page loaded. */
  pageKey: string;
  tableKey?: string;
  searchKey?: string;
  addBtnKey?: string;
  statusFilterKey?: string;
  formSubmitKey?: string;
  /** Human form-field label -> registry key. */
  fields?: Record<string, string>;
}

/** Demo credentials, mirrored from `src/data/seed/users.json`. */
export const ROLE_CREDENTIALS: Record<string, { email: string; password: string }> = {
  admin: { email: 'admin@healthcore.demo', password: 'Admin123!' },
  scheduler: { email: 'scheduler@healthcore.demo', password: 'Schedule123!' },
  billing: { email: 'billing@healthcore.demo', password: 'Billing123!' },
};

export const PAGES: Record<string, PageInfo> = {
  login: { object: 'LoginPage', route: '/login', pageKey: 'auth.email' },
  dashboard: { object: 'DashboardPage', route: '/dashboard', pageKey: 'dashboard.page' },
  patients: {
    object: 'PatientsPage',
    route: '/patients',
    pageKey: 'patients.page',
    tableKey: 'patients.table',
    searchKey: 'patients.search',
    addBtnKey: 'patients.addBtn',
    statusFilterKey: 'patients.statusFilter',
    formSubmitKey: 'patients.formSubmit',
    fields: {
      'first name': 'patients.formFirstName',
      'last name': 'patients.formLastName',
      mrn: 'patients.formMrn',
      dob: 'patients.formDob',
      'date of birth': 'patients.formDob',
      email: 'patients.formEmail',
      phone: 'patients.formPhone',
    },
  },
  providers: {
    object: 'ProvidersPage',
    route: '/providers',
    pageKey: 'providers.page',
    tableKey: 'providers.table',
    searchKey: 'providers.search',
    addBtnKey: 'providers.addBtn',
    statusFilterKey: 'providers.specialtyFilter',
    formSubmitKey: 'providers.formSubmit',
  },
  appointments: {
    object: 'AppointmentsPage',
    route: '/appointments',
    pageKey: 'appointments.page',
    tableKey: 'appointments.table',
    searchKey: 'appointments.search',
    addBtnKey: 'appointments.addBtn',
    statusFilterKey: 'appointments.statusFilter',
    formSubmitKey: 'appointments.formSubmit',
  },
  claims: {
    object: 'ClaimsPage',
    route: '/claims',
    pageKey: 'claims.page',
    tableKey: 'claims.table',
    searchKey: 'claims.search',
    statusFilterKey: 'claims.statusFilter',
  },
  uploads: {
    object: 'UploadsPage',
    route: '/uploads',
    pageKey: 'uploads.page',
    tableKey: 'uploads.table',
  },
};

/** Button label (lower-cased) -> { page, registry key }. */
export const BUTTON_LABELS: Record<string, { page: string; key: string }> = {
  'add patient': { page: 'patients', key: 'patients.addBtn' },
  'add provider': { page: 'providers', key: 'providers.addBtn' },
  'add appointment': { page: 'appointments', key: 'appointments.addBtn' },
  'sign in': { page: 'login', key: 'auth.loginSubmit' },
};

export const TOAST_KEY = 'toast.container';
export const AUTH = {
  email: 'auth.email',
  password: 'auth.password',
  submit: 'auth.loginSubmit',
  error: 'auth.error',
};
