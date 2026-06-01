import { useCallback, useEffect, useState } from 'react';
import type { Provider } from '../../types';
import { createProvider, listProviders, updateProvider } from '../../services/providerService';
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
import { ProviderModal } from './ProviderModal';

const SPECIALTIES = [
  'Internal Medicine',
  'Cardiology',
  'Pediatrics',
  'Orthopedics',
];

export function ProvidersPage() {
  const { showToast } = useToast();
  const ready = useDynamicRender();
  const { params, setSearch, setFilter, setSort, setPage, setPageSize } =
    useListParams({ sortBy: 'lastName' });
  const [result, setResult] = useState<{ data: Provider[]; total: number }>({
    data: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listProviders(params);
    setResult({ data: res.data, total: res.total });
    setLoading(false);
  }, [params]);

  useEffect(() => {
    if (ready) load();
  }, [load, ready]);

  return (
    <div data-testid={TEST_IDS.providers.page}>
      <PageHeader
        testId="providers-header"
        title="Providers"
        description="Manage care provider directory and specialties."
        actions={
          <Button
            testId={TEST_IDS.providers.addBtn}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Add Provider
          </Button>
        }
      />
      <div className="flex flex-wrap gap-4 mb-4">
        <SearchBar
          testId={TEST_IDS.providers.search}
          value={params.search ?? ''}
          onChange={setSearch}
          placeholder="Search providers..."
        />
        <div className="w-52">
          <Select
            testId={TEST_IDS.providers.specialtyFilter}
            label="Specialty"
            value={params.filters?.specialty ?? ''}
            onChange={(e) => setFilter('specialty', e.target.value)}
            options={[
              { value: '', label: 'All specialties' },
              ...SPECIALTIES.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <DataTable
          testId={TEST_IDS.providers.table}
          columns={[
            { key: 'npi', header: 'NPI', sortable: true },
            {
              key: 'lastName',
              header: 'Name',
              sortable: true,
              render: (r) => `Dr. ${r.firstName} ${r.lastName}`,
            },
            { key: 'specialty', header: 'Specialty', sortable: true },
            { key: 'email', header: 'Email' },
            {
              key: 'active',
              header: 'Status',
              render: (r) => (
                <Badge status={r.active ? 'active' : 'inactive'}>
                  {r.active ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
          ]}
          data={result.data}
          loading={loading}
          sortBy={params.sortBy}
          sortDir={params.sortDir}
          onSort={setSort}
          rowTestId={(r) => TEST_IDS.providers.row(r.id)}
          actions={(row) => (
            <Button
              testId={TEST_IDS.providers.edit(row.id)}
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
      <ProviderModal
        open={modalOpen}
        provider={editing}
        onClose={() => setModalOpen(false)}
        onSave={async (data) => {
          if (editing) {
            await updateProvider(editing.id, data);
            showToast('success', 'Provider updated.');
          } else {
            await createProvider(data);
            showToast('success', 'Provider created.');
          }
          load();
        }}
      />
    </div>
  );
}
