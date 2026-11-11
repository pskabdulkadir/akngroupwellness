import { getMemberWalletToken } from './authManager';
import { getAdminToken } from './adminSession';

export interface SharedDocumentSummary {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export type SharedDocumentAccess = 'admin' | 'dealer';
export const MAX_SHARED_DOCUMENT_SIZE_BYTES = 6 * 1024 * 1024;

const getToken = (access: SharedDocumentAccess) =>
  access === 'admin' ? getAdminToken() : getMemberWalletToken();

async function requestJson<T>(url: string, access: SharedDocumentAccess, init?: RequestInit): Promise<T> {
  const token = getToken(access);
  if (!token) throw new Error('Güvenli oturum bulunamadı. Lütfen yeniden giriş yapın.');

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(url, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Doküman isteği tamamlanamadı.');
  return payload as T;
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export async function listSharedDocuments(access: SharedDocumentAccess): Promise<SharedDocumentSummary[]> {
  const response = await requestJson<{ documents: SharedDocumentSummary[] }>(
    '/api/v1/documents',
    access
  );
  return response.documents;
}

export async function uploadSharedDocument(file: File): Promise<void> {
  if (file.size > MAX_SHARED_DOCUMENT_SIZE_BYTES) {
    throw new Error('Dosya boyutu en fazla 6 MB olabilir.');
  }
  await requestJson('/api/v1/admin/documents', 'admin', {
    method: 'POST',
    body: JSON.stringify({ name: file.name, dataBase64: await fileToBase64(file) }),
  });
}

export async function downloadSharedDocument(
  documentId: string,
  access: SharedDocumentAccess
): Promise<Blob> {
  const token = getToken(access);
  if (!token) throw new Error('Güvenli oturum bulunamadı. Lütfen yeniden giriş yapın.');

  const response = await fetch(`/api/v1/documents/${encodeURIComponent(documentId)}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'Doküman indirilemedi.');
  }
  return response.blob();
}
