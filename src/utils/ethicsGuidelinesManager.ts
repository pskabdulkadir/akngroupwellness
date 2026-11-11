import { getAdminToken } from './adminSession';
import {
  DEFAULT_ETHICS_GUIDELINES_CONTENT,
  normalizeEthicsGuidelinesContent,
} from './ethicsGuidelinesContent';

export function subscribeToEthicsGuidelines(onUpdate: (content: string) => void): () => void {
  const source = new EventSource('/api/v1/ethics-guidelines/stream');
  source.onmessage = (event) => {
    const data = JSON.parse(event.data) as { content?: unknown };
    if (typeof data.content === 'string') onUpdate(data.content);
  };
  return () => source.close();
}

export async function saveEthicsGuidelinesContent(content: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Yönetici oturumu gerekli.');

  const response = await fetch('/api/v1/admin/ethics-guidelines', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content: normalizeEthicsGuidelinesContent(content) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Etik kurallar kaydedilemedi.');
}

export { DEFAULT_ETHICS_GUIDELINES_CONTENT };
