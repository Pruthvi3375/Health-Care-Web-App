import { useCallback, useEffect, useState } from 'react';
import type { FileUpload } from '../../types';
import { createUpload, listUploads } from '../../services/uploadService';
import { getDb } from '../../services/storage';
import { useListParams } from '../../hooks/useListParams';
import { useDynamicRender } from '../../hooks/useDynamicRender';
import { useToast } from '../../context/ToastContext';
import { useChaos } from '../../hooks/useChaos';
import { TEST_IDS } from '../../testids';
import { tid } from '../../utils/testId';
import { PageHeader } from '../../components/layout/PageHeader';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/tables/DataTable';
import { TablePagination } from '../../components/tables/TablePagination';
import { Badge } from '../../components/ui/Badge';

export function UploadsPage() {
  const { showToast } = useToast();
  const { chaos } = useChaos();
  const activeChaos = chaos.enabled ? chaos : undefined;
  const ready = useDynamicRender();
  const { params, setPage, setPageSize } = useListParams();
  const [result, setResult] = useState<{ data: FileUpload[]; total: number }>({
    data: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const patients = getDb().patients;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listUploads(params);
    setResult({ data: res.data, total: res.total });
    setLoading(false);
  }, [params]);

  useEffect(() => {
    if (ready) load();
  }, [load, ready]);

  const handleUpload = async () => {
    if (!selectedFile || !patientId) {
      showToast('error', 'Please select a patient and file.');
      return;
    }
    setUploading(true);
    try {
      await createUpload({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        patientId,
      });
      showToast('success', `File "${selectedFile.name}" uploaded successfully.`);
      setSelectedFile(null);
      load();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div data-testid={TEST_IDS.uploads.page}>
      <PageHeader
        testId="uploads-header"
        title="Document Upload"
        description="Upload patient documents and supporting files."
      />
      <div
        className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-8 mb-6 text-center"
        {...tid(TEST_IDS.uploads.dropzone, activeChaos)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) setSelectedFile(file);
        }}
      >
        <p className="text-sm text-slate-600 mb-4">
          Drag and drop a file here, or click to browse
        </p>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          id="file-upload-input"
          {...tid(TEST_IDS.uploads.fileInput, activeChaos)}
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
        <label
          htmlFor="file-upload-input"
          className="inline-block cursor-pointer text-blue-600 text-sm font-medium hover:underline"
          data-testid="upload-browse-label"
        >
          Browse files
        </label>
        {selectedFile && (
          <p className="text-sm mt-3 text-slate-700" data-testid="upload-selected-file">
            Selected: {selectedFile.name} ({formatSize(selectedFile.size)})
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-4 mb-6 max-w-md">
        <Select
          testId={TEST_IDS.uploads.patientSelect}
          label="Link to Patient"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          options={[
            { value: '', label: 'Select patient...' },
            ...patients.map((p) => ({
              value: p.id,
              label: `${p.firstName} ${p.lastName}`,
            })),
          ]}
        />
        <div className="flex items-end">
          <Button
            testId={TEST_IDS.uploads.submit}
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">Upload History</h2>
        <DataTable
          testId={TEST_IDS.uploads.table}
          columns={[
            { key: 'fileName', header: 'File Name' },
            {
              key: 'fileSize',
              header: 'Size',
              render: (r) => formatSize(r.fileSize),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <Badge status={r.status} />,
            },
            {
              key: 'uploadedAt',
              header: 'Uploaded',
              render: (r) => new Date(r.uploadedAt).toLocaleDateString(),
            },
          ]}
          data={result.data}
          loading={loading}
          rowTestId={(r) => TEST_IDS.uploads.row(r.id)}
        />
        <TablePagination
          page={params.page ?? 1}
          pageSize={params.pageSize ?? 5}
          total={result.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
