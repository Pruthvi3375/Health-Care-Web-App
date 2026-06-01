import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, type DashboardStats } from '../../services/dashboardService';
import { useAuth } from '../../context/AuthContext';
import { useDynamicRender } from '../../hooks/useDynamicRender';
import { TEST_IDS } from '../../testids';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';

export function DashboardPage() {
  const { user, hasRole } = useAuth();
  const ready = useDynamicRender();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    getDashboardStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [ready]);

  if (!ready || loading) return <Spinner testId="dashboard-loading" />;

  return (
    <div data-testid={TEST_IDS.dashboard.page}>
      <PageHeader
        testId="dashboard-header"
        title="Dashboard"
        description={`Welcome back, ${user?.name}. Overview of healthcare operations.`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card testId={TEST_IDS.dashboard.statPatients} className="p-5">
          <p className="text-sm text-slate-500">Total Patients</p>
          <p className="text-3xl font-bold text-slate-900">{stats?.totalPatients}</p>
          <p className="text-xs text-emerald-600 mt-1">{stats?.activePatients} active</p>
        </Card>
        <Card testId={TEST_IDS.dashboard.statAppointments} className="p-5">
          <p className="text-sm text-slate-500">Scheduled Appointments</p>
          <p className="text-3xl font-bold text-slate-900">{stats?.scheduledAppointments}</p>
        </Card>
        <Card testId={TEST_IDS.dashboard.statClaims} className="p-5">
          <p className="text-sm text-slate-500">Pending Claims</p>
          <p className="text-3xl font-bold text-slate-900">{stats?.pendingClaims}</p>
        </Card>
        <Card testId="dashboard-stat-revenue" className="p-5">
          <p className="text-sm text-slate-500">Total Claim Value</p>
          <p className="text-3xl font-bold text-slate-900">
            ${stats?.totalClaimsAmount.toLocaleString()}
          </p>
        </Card>
      </div>
      <div className="flex flex-wrap gap-3">
        {hasRole('admin', 'scheduler') && (
          <Link to="/patients">
            <Button testId={TEST_IDS.dashboard.quickAddPatient} variant="primary">
              Manage Patients
            </Button>
          </Link>
        )}
        {hasRole('admin', 'billing') && (
          <Link to="/claims">
            <Button testId="dashboard-quick-claims" variant="secondary">
              Review Claims
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
