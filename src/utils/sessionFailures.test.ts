import assert from 'node:assert/strict';
import test from 'node:test';
import { loginAccountingWithMessage } from './adminSession';
import { deductScanCreditFromDealer, refundScanCreditToDealer } from './resellerManager';

class TestStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test('tarama kredi isteği taşıyıcı token yokken aynı-kaynaklı oturum çerezini kullanır', async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.sessionStorage;
  let requestInit: RequestInit | undefined;
  Object.assign(globalThis, { sessionStorage: new TestStorage() });
  try {
    globalThis.fetch = async (_input, init) => {
      requestInit = init;
      return new Response(JSON.stringify({ status: 'error', code: 'AUTH_REQUIRED' }), { status: 401 });
    };
    await deductScanCreditFromDealer('dealer-1', { requestId: 'scan-mobile-session' });
    assert.equal(requestInit?.credentials, 'same-origin');
    assert.equal(new Headers(requestInit?.headers).has('Authorization'), false);
  } finally {
    globalThis.fetch = originalFetch;
    Object.assign(globalThis, { sessionStorage: originalStorage });
  }
});

test('muhasebe dışı hesap ve eksik giriş servisi ayırt edilir', async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.sessionStorage;
  Object.assign(globalThis, { sessionStorage: new TestStorage() });
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ code: 'ACCOUNTING_ACCOUNT_NOT_FOUND' }), { status: 200 });
    assert.deepEqual(await loginAccountingWithMessage('member@example.test', 'password'), { isAccounting: false, success: false });
    globalThis.fetch = async () => new Response('Not Found', { status: 404 });
    const missingService = await loginAccountingWithMessage('member@example.test', 'password');
    assert.equal(missingService.isAccounting, true);
    assert.match(missingService.message || '', /servisi bulunamadı/);
  } finally {
    globalThis.fetch = originalFetch;
    Object.assign(globalThis, { sessionStorage: originalStorage });
  }
});

test('yönetici oturumu kredi düşümü ve iadesinde kullanılır', async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.sessionStorage;
  const storage = new TestStorage();
  storage.setItem('aurabio_admin_token_v1', 'admin.signature');
  Object.assign(globalThis, { sessionStorage: storage });
  const headers: string[] = [];
  try {
    globalThis.fetch = async (_input, init) => {
      headers.push(new Headers(init?.headers).get('Authorization') || '');
      return new Response(JSON.stringify({ status: 'error', code: 'INSUFFICIENT_CREDITS', remainingCredits: 0 }), { status: 400 });
    };
    const scan = await deductScanCreditFromDealer('dealer-1', { requestId: 'scan-1' });
    assert.equal(scan.insufficientCredits, true);
    await refundScanCreditToDealer('dealer-1', 'scan-1');
    assert.deepEqual(headers, ['Bearer admin.signature', 'Bearer admin.signature']);
  } finally {
    globalThis.fetch = originalFetch;
    Object.assign(globalThis, { sessionStorage: originalStorage });
  }
});

test('bağlantı hatası kredi yetersizliği olarak değerlendirilmez', async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.sessionStorage;
  const storage = new TestStorage();
  storage.setItem('aurabio_admin_token_v1', 'admin.signature');
  Object.assign(globalThis, { sessionStorage: storage });
  try {
    globalThis.fetch = async () => { throw new Error('offline'); };
    const result = await deductScanCreditFromDealer('dealer-1', { requestId: 'scan-2' });
    assert.equal(result.success, false);
    assert.notEqual(result.insufficientCredits, true);
    assert.match(result.message || '', /ulaşılamadı/);
  } finally {
    globalThis.fetch = originalFetch;
    Object.assign(globalThis, { sessionStorage: originalStorage });
  }
});
