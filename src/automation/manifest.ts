import { TEST_IDS } from '../testids';

export interface RouteManifest {
  route: string;
  name: string;
  entities: string[];
  actions: string[];
  primaryTestIds: string[];
  requiredRoles?: string[];
}

export const AUTOMATION_MANIFEST: RouteManifest[] = [
  {
    route: '/login',
    name: 'Authentication',
    entities: ['user'],
    actions: ['login'],
    primaryTestIds: [
      TEST_IDS.auth.email,
      TEST_IDS.auth.password,
      TEST_IDS.auth.loginSubmit,
    ],
  },
  {
    route: '/dashboard',
    name: 'Dashboard',
    entities: ['patient', 'appointment', 'claim'],
    actions: ['view_stats', 'quick_navigate'],
    primaryTestIds: [
      TEST_IDS.dashboard.page,
      TEST_IDS.dashboard.statPatients,
      TEST_IDS.dashboard.quickAddPatient,
    ],
  },
  {
    route: '/patients',
    name: 'Patient Management',
    entities: ['patient'],
    actions: ['create', 'edit', 'delete', 'search', 'filter', 'sort', 'paginate'],
    primaryTestIds: [
      TEST_IDS.patients.page,
      TEST_IDS.patients.search,
      TEST_IDS.patients.addBtn,
      TEST_IDS.patients.table,
      TEST_IDS.patients.modal,
    ],
    requiredRoles: ['admin', 'scheduler'],
  },
  {
    route: '/providers',
    name: 'Provider Management',
    entities: ['provider'],
    actions: ['create', 'edit', 'search', 'filter', 'sort', 'paginate'],
    primaryTestIds: [
      TEST_IDS.providers.page,
      TEST_IDS.providers.addBtn,
      TEST_IDS.providers.table,
    ],
    requiredRoles: ['admin', 'scheduler'],
  },
  {
    route: '/appointments',
    name: 'Appointment Scheduling',
    entities: ['appointment'],
    actions: ['create', 'edit', 'search', 'filter', 'sort', 'paginate'],
    primaryTestIds: [
      TEST_IDS.appointments.page,
      TEST_IDS.appointments.addBtn,
      TEST_IDS.appointments.table,
    ],
    requiredRoles: ['admin', 'scheduler'],
  },
  {
    route: '/claims',
    name: 'Claims Management',
    entities: ['claim'],
    actions: ['view', 'update_status', 'search', 'filter', 'sort', 'paginate'],
    primaryTestIds: [
      TEST_IDS.claims.page,
      TEST_IDS.claims.table,
      TEST_IDS.claims.modal,
    ],
    requiredRoles: ['admin', 'billing'],
  },
  {
    route: '/uploads',
    name: 'Document Upload',
    entities: ['upload'],
    actions: ['upload', 'list', 'paginate'],
    primaryTestIds: [
      TEST_IDS.uploads.page,
      TEST_IDS.uploads.dropzone,
      TEST_IDS.uploads.submit,
    ],
    requiredRoles: ['admin', 'billing'],
  },
];

export function exportManifestJson(): string {
  return JSON.stringify(
    {
      app: 'HealthCore EMS',
      version: '1.0.0',
      purpose: 'Playwright automation validation playground',
      chaosMode: {
        toggle: TEST_IDS.chaos.toggle,
        options: [
          'locatorChanges',
          'labelChanges',
          'domRestructure',
          'missingTestIds',
          'dynamicRender',
        ],
      },
      routes: AUTOMATION_MANIFEST,
      testIdRegistry: TEST_IDS,
    },
    null,
    2
  );
}
