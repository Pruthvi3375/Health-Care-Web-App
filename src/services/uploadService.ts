import type { FileUpload, ListParams, PaginatedResult } from '../types';
import { getDb, persistDb } from './storage';
import { delay, paginate, sortItems } from './listUtils';

export async function listUploads(
  params: ListParams = {}
): Promise<PaginatedResult<FileUpload>> {
  await delay();
  let items = [...getDb().uploads];
  items = sortItems(items, params.sortBy ?? 'uploadedAt', params.sortDir ?? 'desc');
  return paginate(items, params);
}

export async function createUpload(
  data: Omit<FileUpload, 'id' | 'uploadedAt' | 'status'>
): Promise<FileUpload> {
  await delay(500);
  if (data.fileSize > 5 * 1024 * 1024) {
    throw new Error('File size exceeds the 5MB limit.');
  }
  const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
  if (!allowed.includes(data.mimeType)) {
    throw new Error('Only PDF, PNG, and JPEG files are allowed.');
  }
  const db = getDb();
  const upload: FileUpload = {
    ...data,
    id: `UPL${String(db.uploads.length + 1).padStart(3, '0')}`,
    status: 'completed',
    uploadedAt: new Date().toISOString(),
  };
  db.uploads.push(upload);
  persistDb();
  return upload;
}
