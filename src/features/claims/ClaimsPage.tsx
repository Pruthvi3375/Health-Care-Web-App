import { useCallback, useEffect, useState } from 'react';
import type { Claim, ClaimStatus } from '../../types';
import { listClaims, updateClaimStatus } from '../../services/claimService';
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
import { Modal } from '../../components/modals/Modal';

export function ClaimsPage() {
  const { showToast } = useToast();
  const ready = useDynamicRender();
  const { params, setSearch, setFilter, setSort, setPage, setPageSize } =
    useListParams({ sortBy: 'submittedAt', sortDir: 'desc' });
  const [result, setResult] = useState<{ data: Claim[]; total: number }>({
    data: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Claim | null>(null);
  const patients = getDb().patients;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listClaims(params);
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

  const handleStatusUpdate = async (status: ClaimStatus) => {
    if (!viewing) return;
    await updateClaimStatus(viewing.id, status);
    showToast('success', `Claim ${viewing.claimNumber} status updated to ${status}.`);
    setViewing(null);
    load();
  };

  return (
    <div data-testid={TEST_IDS.claims.page}>
      <PageHeader
        testId="claims-header"
        title="Claims"
        description="Review and manage insurance claim requests."
      />
      <div className="flex flex-wrap gap-4 mb-4">
        <SearchBar
          testId={TEST_IDS.claims.search}
          value={params.search ?? ''}
          onChange={setSearch}
          placeholder="Search claim number or diagnosis..."
        />
        <div className="w-48">
          <Select
            testId={TEST_IDS.claims.statusFilter}
            label="Status"
            value={params.filters?.status ?? ''}
            onChange={(e) => setFilter('status', e.target.value)}
            options={[
              { value: '', label: 'All' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'pending', label: 'Pending' },
              { value: 'denied', label: 'Denied' },
              { value: 'paid', label: 'Paid' },
            ]}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <DataTable
          testId={TEST_IDS.claims.table}
          columns={[
            { key: 'claimNumber', header: 'Claim #', sortable: true },
            {
              key: 'patientId',
              header: 'Patient',
              render: (r) => patientName(r.patientId),
            },
            { key: 'serviceDate', header: 'Service Date', sortable: true },
            {
              key: 'amount',
              header: 'Amount',
              sortable: true,
              render: (r) => `$${r.amount.toFixed(2)}`,
            },
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
          rowTestId={(r) => TEST_IDS.claims.row(r.id)}
          actions={(row) => (
            <Button
              testId={TEST_IDS.claims.view(row.id)}
              variant="ghost"
              onClick={() => setViewing(row)}
            >
              View
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
      <Modal
        testId={TEST_IDS.claims.modal}
        title={`Claim ${viewing?.claimNumber ?? ''}`}
        open={!!viewing}
        onClose={() => setViewing(null)}
        footer={
          viewing && (
            <div className="flex gap-2">
              <Button
                testId="claim-status-pending"
                variant="secondary"
                onClick={() => handleStatusUpdate('pending')}
              >
                Mark Pending
              </Button>
              <Button
                testId={TEST_IDS.claims.formSubmit}
                variant="primary"
                onClick={() => handleStatusUpdate('paid')}
              >
                Approve & Pay
              </Button>
            </div>
          )
        }
      >
        {viewing && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-slate-500">Patient</dt>
            <dd data-testid="claim-detail-patient">{patientName(viewing.patientId)}</dd>
            <dt className="text-slate-500">Amount</dt>
            <dd data-testid="claim-detail-amount">${viewing.amount.toFixed(2)}</dd>
            <dt className="text-slate-500">Diagnosis</dt>
            <dd data-testid="claim-detail-diagnosis">{viewing.diagnosisCode}</dd>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <Badge status={viewing.status} />
            </dd>
          </dl>
        )}
      </Modal>
    </div>
  );
}
