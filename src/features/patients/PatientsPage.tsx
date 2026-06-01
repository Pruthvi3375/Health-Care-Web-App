import { useCallback, useEffect, useState } from 'react';
import type { Patient, Provider } from '../../types';
import {
  createPatient,
  deletePatient,
  listPatients,
  updatePatient,
} from '../../services/patientService';
import { getAllProviders } from '../../services/providerService';
import { useListParams } from '../../hooks/useListParams';
import { useDynamicRender } from '../../hooks/useDynamicRender';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { TEST_IDS } from '../../testids';
import { PageHeader } from '../../components/layout/PageHeader';
import { SearchBar } from '../../components/filters/SearchBar';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/tables/DataTable';
import { TablePagination } from '../../components/tables/TablePagination';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import { PatientModal } from './PatientModal';
import { chaosLabel } from '../../utils/testId';
import { useChaos } from '../../hooks/useChaos';

export function PatientsPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const { chaos } = useChaos();
  const activeChaos = chaos.enabled ? chaos : undefined;
  const ready = useDynamicRender();
  const { params, setSearch, setFilter, setSort, setPage, setPageSize } =
    useListParams({ sortBy: 'lastName' });
  const [result, setResult] = useState<{ data: Patient[]; total: number }>({
    data: [],
    total: 0,
  });
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listPatients(params);
    setResult({ data: res.data, total: res.total });
    setLoading(false);
  }, [params]);

  useEffect(() => {
    getAllProviders().then(setProviders);
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [load, ready]);

  const providerName = (id: string) => {
    const p = providers.find((x) => x.id === id);
    return p ? `Dr. ${p.lastName}` : id;
  };

  const canEdit = hasRole('admin', 'scheduler');

  return (
    <div data-testid={TEST_IDS.patients.page}>
      <PageHeader
        testId="patients-header"
        title={chaosLabel('Patients', 'Member Records', activeChaos)}
        description="Manage patient demographics and care assignments."
        actions={
          canEdit && (
            <Button
              testId={TEST_IDS.patients.addBtn}
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              {chaosLabel('Add Patient', 'New Member', activeChaos)}
            </Button>
          )
        }
      />
      <div className="flex flex-wrap gap-4 mb-4">
        <SearchBar
          testId={TEST_IDS.patients.search}
          value={params.search ?? ''}
          onChange={setSearch}
          placeholder="Search by name, MRN, or email..."
        />
        <div className="w-48">
          <Select
            testId={TEST_IDS.patients.statusFilter}
            label="Status"
            value={params.filters?.status ?? ''}
            onChange={(e) => setFilter('status', e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <DataTable
          testId={TEST_IDS.patients.table}
          columns={[
            { key: 'mrn', header: 'MRN', sortable: true },
            {
              key: 'lastName',
              header: 'Name',
              sortable: true,
              render: (r) => `${r.firstName} ${r.lastName}`,
            },
            { key: 'dateOfBirth', header: 'DOB', sortable: true },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <Badge status={r.status} />,
            },
            {
              key: 'primaryProviderId',
              header: 'Provider',
              render: (r) => providerName(r.primaryProviderId),
            },
          ]}
          data={result.data}
          loading={loading}
          sortBy={params.sortBy}
          sortDir={params.sortDir}
          onSort={setSort}
          rowTestId={(r) => TEST_IDS.patients.row(r.id)}
          actions={
            canEdit
              ? (row) => (
                  <div className="flex gap-2">
                    <Button
                      testId={TEST_IDS.patients.edit(row.id)}
                      variant="ghost"
                      onClick={() => {
                        setEditing(row);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    {hasRole('admin') && (
                      <Button
                        testId={TEST_IDS.patients.delete(row.id)}
                        variant="danger"
                        onClick={() => setDeleteTarget(row)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                )
              : undefined
          }
        />
        <TablePagination
          page={params.page ?? 1}
          pageSize={params.pageSize ?? 5}
          total={result.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
      <PatientModal
        open={modalOpen}
        patient={editing}
        providers={providers}
        onClose={() => setModalOpen(false)}
        onSave={async (data) => {
          if (editing) {
            await updatePatient(editing.id, data);
            showToast('success', `Patient ${data.firstName} ${data.lastName} updated.`);
          } else {
            await createPatient(data);
            showToast('success', `Patient ${data.firstName} ${data.lastName} created.`);
          }
          load();
        }}
      />
      <ConfirmDialog
        testId="modal-patient-delete"
        open={!!deleteTarget}
        title="Delete Patient"
        message={`Are you sure you want to delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This action cannot be undone.`}
        confirmTestId={TEST_IDS.patients.confirmDelete}
        cancelTestId="patient-delete-cancel"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePatient(deleteTarget.id);
            showToast('success', 'Patient deleted successfully.');
            setDeleteTarget(null);
            load();
          }
        }}
      />
    </div>
  );
}
