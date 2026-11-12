export const ADMIN_TOKEN_KEY = 'aurabio_admin_token_v1';

const ADMIN_API_PATH =
  /^\/api\/v1\/(admin|cron|career-pool)\/|^\/api\/v1\/reset$|^\/api\/v1\/simulation\/full-career-journey$/;

export function getAdminToken(): string | null {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return null;
  if (token.split('.').length === 2) return token;
  clearAdminToken();
  return null;
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function loginAdminWithMessage(
  email: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();
  clearAdminToken();

  try {
    const res = await fetch('/api/v1/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && typeof data?.token === 'string') {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      return { success: true };
    }
    return {
      success: false,
      message: data?.message || 'E-posta veya şifre hatalı.',
    };
  } catch {
    return { success: false, message: 'Yönetici giriş servisine ulaşılamadı.' };
  }
}

export async function loginAdmin(email: string, password: string): Promise<boolean> {
  return (await loginAdminWithMessage(email, password)).success;
}

export function installAdminFetchAuth(): void {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const token = getAdminToken();
    if (!token) return originalFetch(input, init);

    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(rawUrl, window.location.origin).pathname;
    if (!ADMIN_API_PATH.test(path)) return originalFetch(input, init);

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    return originalFetch(input, { ...init, headers });
  };
}
