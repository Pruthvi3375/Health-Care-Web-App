import { useCallback, useEffect, useState } from 'react';
import type { Appointment } from '../../types';
import {
  createAppointment,
  listAppointments,
  updateAppointment,
} from '../../services/appointmentService';
import { getDb } from '../../services/storage';
import { useListParams } from '../../hooks/useListParams';
import { useDynamicRender } from '../../hooks/useDynamicRender';
import { useToast } from '../../context/ToastContext';
import { TEST_IDS } from '../../testids';
import { PageHeader } from '../../components/layout/PageHeader';
import { SearchBar } from '../../components/filters/SearchBar';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/tables/DataTable';
import { TablePagination } from '../../components/tables/TablePagination';
import { Badge } from '../../components/ui/Badge';
import { AppointmentModal } from './AppointmentModal';

export function AppointmentsPage() {
  const { showToast } = useToast();
  const ready = useDynamicRender();
  const { params, setSearch, setFilter, setSort, setPage, setPageSize } =
    useListParams({ sortBy: 'date', sortDir: 'desc' });
  const [result, setResult] = useState<{ data: Appointment[]; total: number }>({
    data: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const patients = getDb().patients;
  const providers = getDb().providers;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listAppointments(params);
    setResult({ data: res.data, total: res.total });
    setLoading(false);
  }, [params]);

  useEffect(() => {
    if (ready) load();
  }, [load, ready]);

  const patientName = (id: string) => {
    const p = patients.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : id;
  };

  return (
    <div data-testid={TEST_IDS.appointments.page}>
      <PageHeader
        testId="appointments-header"
        title="Appointments"
        description="Schedule and manage patient appointments."
        actions={
          <Button
            testId={TEST_IDS.appointments.addBtn}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Schedule Appointment
          </Button>
        }
      />
      <div className="flex flex-wrap gap-4 mb-4">
        <SearchBar
          testId={TEST_IDS.appointments.search}
          value={params.search ?? ''}
          onChange={setSearch}
          placeholder="Search appointments..."
        />
        <div className="w-48">
          <Select
            testId={TEST_IDS.appointments.statusFilter}
            label="Status"
            value={params.filters?.status ?? ''}
            onChange={(e) => setFilter('status', e.target.value)}
            options={[
              { value: '', label: 'All' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'no-show', label: 'No Show' },
            ]}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <DataTable
          testId={TEST_IDS.appointments.table}
          columns={[
            {
              key: 'patientId',
              header: 'Patient',
              render: (r) => patientName(r.patientId),
            },
            { key: 'date', header: 'Date', sortable: true },
            { key: 'time', header: 'Time', sortable: true },
            { key: 'type', header: 'Type' },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <Badge status={r.status} />,
            },
          ]}
          data={result.data}
          loading={loading}
          sortBy={params.sortBy}
          sortDir={params.sortDir}
          onSort={setSort}
          rowTestId={(r) => TEST_IDS.appointments.row(r.id)}
          actions={(row) => (
            <Button
              testId={TEST_IDS.appointments.edit(row.id)}
              variant="ghost"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
            >
              Edit
            </Button>
          )}
        />
        <TablePagination
          page={params.page ?? 1}
          pageSize={params.pageSize ?? 5}
          total={result.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
      <AppointmentModal
        open={modalOpen}
        appointment={editing}
        patients={patients}
        providers={providers}
        onClose={() => setModalOpen(false)}
        onSave={async (data) => {
          if (editing) {
            await updateAppointment(editing.id, data);
            showToast('success', 'Appointment updated.');
            load();
          } else {
            const created = await createAppointment(data);
            showToast('success', 'Appointment scheduled.');
            setResult((current) => ({
              data: [created, ...current.data].slice(0, params.pageSize ?? 5),
              total: current.total + 1,
            }));
            setSort('date', 'desc');
          }
        }}
      />
    </div>
  );
}
