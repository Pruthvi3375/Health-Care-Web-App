import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChaos } from '../../hooks/useChaos';
import { TEST_IDS } from '../../testids';
import { chaosLabel } from '../../utils/testId';
import { tid } from '../../utils/testId';

interface NavItem {
  to: string;
  label: string;
  testId: string;
  roles?: ('admin' | 'scheduler' | 'billing')[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', testId: TEST_IDS.nav.dashboard },
  { to: '/patients', label: 'Patients', testId: TEST_IDS.nav.patients, roles: ['admin', 'scheduler'] },
  { to: '/providers', label: 'Providers', testId: TEST_IDS.nav.providers, roles: ['admin', 'scheduler'] },
  { to: '/appointments', label: 'Appointments', testId: TEST_IDS.nav.appointments, roles: ['admin', 'scheduler'] },
  { to: '/claims', label: 'Claims', testId: TEST_IDS.nav.claims, roles: ['admin', 'billing'] },
  { to: '/uploads', label: 'Documents', testId: TEST_IDS.nav.uploads, roles: ['admin', 'billing'] },
];

export function Sidebar() {
  const { user, hasRole } = useAuth();
  const { chaos } = useChaos();
  const activeChaos = chaos.enabled ? chaos : undefined;

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.some((r) => hasRole(r))
  );

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-lg font-bold" data-testid="app-logo">
          HealthCore EMS
        </h1>
        <p className="text-xs text-slate-400 mt-1">Automation Playground</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
            {...tid(item.testId, activeChaos)}
          >
            {item.label === 'Patients'
              ? chaosLabel('Patients', 'Member Records', activeChaos)
              : item.label === 'Claims'
                ? chaosLabel('Claims', 'Billing Requests', activeChaos)
                : item.label}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="px-4 py-4 border-t border-slate-700 text-sm">
          <p className="text-slate-400 text-xs">Signed in as</p>
          <p className="font-medium truncate" data-testid={TEST_IDS.nav.userMenu}>
            {user.name}
          </p>
          <p className="text-xs text-slate-500 capitalize">{user.role}</p>
        </div>
      )}
    </aside>
  );
}
