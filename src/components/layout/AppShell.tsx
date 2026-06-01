import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TEST_IDS } from '../../testids';
import { Button } from '../ui/Button';
import { ChaosPanel } from '../chaos/ChaosPanel';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-end items-center gap-3">
          <ChaosPanel />
          <Button testId={TEST_IDS.nav.logout} variant="secondary" onClick={logout}>
            Sign out
          </Button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
