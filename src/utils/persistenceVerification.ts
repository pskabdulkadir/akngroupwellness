export type PersistenceVerdict = 'RECORDED' | 'NOT_RECORDED' | 'UNKNOWN';

export function isUnknownCommitResponse(status: number, data: any): boolean {
  return status === 503 && data?.committed_state === 'UNKNOWN_VERIFY_REQUIRED' && typeof data?.request_id === 'string';
}

export async function wasRecordedAfterUnknownCommit(status: number, data: any, bearerToken: string): Promise<boolean> {
  if (!isUnknownCommitResponse(status, data)) return false;
  return (await verifyRecordedRequest(data.request_id, bearerToken)) === 'RECORDED';
}

export async function verifyRecordedRequest(requestId: string, bearerToken: string | null): Promise<PersistenceVerdict> {
  try {
    const headers: Record<string, string> = {};
    if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
    const res = await fetch(`/api/v1/idempotency/${encodeURIComponent(requestId)}/status`, {
      credentials: 'same-origin',
      headers,
    });
    if (!res.ok) return 'UNKNOWN';
    const data = await res.json().catch(() => null);
    if (typeof data?.recorded !== 'boolean') return 'UNKNOWN';
    return data.recorded ? 'RECORDED' : 'NOT_RECORDED';
  } catch {
    return 'UNKNOWN';
  }
}
