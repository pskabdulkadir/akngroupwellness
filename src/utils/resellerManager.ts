import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot,
  limit,
  orderBy,
  Unsubscribe,
  db
} from '../lib/db';
import { UserMember, MemberOrder } from './authManager';
import { DEFAULT_DEALER_PACKAGES, type DealerPackage } from '../config/dealerPackages';
import { isUnknownCommitResponse, verifyRecordedRequest } from './persistenceVerification';

export interface BankInfo {
  bankName: string;
  accountHolder: string;
  iban: string;
}

export const ACTIVATION_RENEWAL_PACKAGE = {
  id: 'ACTIVATION',
  name: '30 Günlük Süre Uzatma Paketi',
  domesticPriceUsd: 100,
  internationalPriceUsd: 300,
  sessionCredits: 0,
  periodDays: 30,
  features: [
    'Hesabı 30 gün aktif tutar',
    'Seans kredisi içermez',
    'Bedel bölgesel USD cüzdanından tahsil edilir ve ciroya dahil edilir',
  ],
} as const;

export interface Reseller {
  uid: string;
  resellerName: string;
  businessName?: string;
  fullName?: string;
  email: string;
  phone: string;
  referralCode: string; // e.g. 'AURA-BAYI-5521'
  commissionRate?: number; // percentage e.g. 20 for 20%
  bankInfo: BankInfo;
  status: 'active' | 'pending' | 'suspended';
  totalEarnings: number; // total commission earned
  paidEarnings: number; // paid out by admin
  pendingEarnings: number; // waiting for payment
  totalSalesAmount: number; // total sales volume in TRY
  totalReferredUsers: number;
  creditsBalance?: number; // Total remaining scan/session credits pool
  dealerPackageId?: string; // Current or last active dealer package
  createdAt: string;
  updatedAt: string;
  notes?: string;
  [key: string]: any;
}

export interface CreditTransaction {
  id: string;
  resellerId: string;
  resellerName?: string;
  type: 'initial' | 'purchase' | 'admin_add' | 'admin_deduct' | 'admin_set' | 'scan_usage' | 'bonus';
  amount: number; // e.g. +50, -1, or difference
  previousBalance: number;
  newBalance: number;
  description: string;
  createdAt: string;
  performedBy?: string; // e.g. 'Sistem Yöneticisi', 'Canlı Seans Taraması', 'Bayi Paket Satın Alımı'
  requestId?: string; // Unique idempotency key (scan / admin operation) to prevent double-spend
}

export interface CommissionTransaction {
  transactionId: string;
  resellerId: string;
  resellerName?: string;
  referralCode?: string;
  userId: string; // Masked user ID for privacy (e.g. USR-82F19B)
  orderId: string;
  packageName: string;
  amount: number; // Order total in TRY
  commissionRate: number; // e.g. 20%
  rate?: number;
  commissionAmount: number; // Earned in TRY
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  paidAt?: string;
  notes?: string;
  [key: string]: any;
}

export interface ResellerPublicInfo {
  uid: string;
  resellerName: string;
  referralCode: string;
  phone?: string;
}

const STORAGE_RESELLERS_KEY = 'aurabio_resellers_directory_v1';
const STORAGE_COMMISSIONS_KEY = 'aurabio_commissions_directory_v1';
const STORAGE_CREDIT_LOGS_KEY = 'aurabio_credit_logs_directory_v1';
const STORAGE_ACTIVE_RESELLER_SESSION_KEY = 'aurabio_active_reseller_session_v1';
const STORAGE_CACHED_REFERRAL_CODE_KEY = 'aurabio_stored_referral_code_v1';
const STORAGE_DEALER_PACKAGES_KEY = 'aurabio_dealer_packages_v4';

/**
 * Get all stored local credit transaction logs
 */
export function getLocalCreditLogs(): CreditTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CREDIT_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.debug('Error reading local credit logs:', e);
  }
  return [];
}

export function saveLocalCreditLogs(logs: CreditTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_CREDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));
    window.dispatchEvent(new CustomEvent('aurabio_credit_logs_updated'));
  } catch (e) {
    console.warn('Error saving local credit logs:', e);
  }
}

/**
 * Record a credit log entry to LocalStorage & Firestore
 */
export async function recordCreditTransaction(
  data: Omit<CreditTransaction, 'id' | 'createdAt'>
): Promise<CreditTransaction> {
  const id = `CR-LOG-${Math.floor(100000 + Math.random() * 900000)}`;
  const log: CreditTransaction = {
    ...data,
    id,
    createdAt: new Date().toISOString()
  };

  const current = getLocalCreditLogs();
  const updated = [log, ...current.filter(item => item.id !== id)].slice(0, 500);
  saveLocalCreditLogs(updated);

  try {
    const docRef = doc(db, 'credit_logs', id);
    await setDoc(docRef, log);
  } catch (err) {
    console.debug('Firestore credit log save notice:', err);
  }

  return log;
}

/**
 * Get all credit transaction history for a specific reseller/dealer
 */
export async function getCreditLogsForReseller(resellerId: string): Promise<CreditTransaction[]> {
  const local = getLocalCreditLogs().filter(l => l.resellerId === resellerId);
  try {
    const colRef = collection(db, 'credit_logs');
    const q = query(colRef, where('resellerId', '==', resellerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const map = new Map<string, CreditTransaction>();
      snap.forEach(d => {
        const item = d.data() as CreditTransaction;
        if (item.id) map.set(item.id, item);
      });
      local.forEach(l => map.set(l.id, l));
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }
  } catch (err) {
    console.debug('Firestore get credit logs notice:', err);
  }
  return local.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Admin: Get all credit logs system-wide
 */
export async function getAllCreditLogsAdmin(): Promise<CreditTransaction[]> {
  const local = getLocalCreditLogs();
  try {
    const colRef = collection(db, 'credit_logs');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const map = new Map<string, CreditTransaction>();
      snap.forEach(d => {
        const item = d.data() as CreditTransaction;
        if (item.id) map.set(item.id, item);
      });
      local.forEach(l => map.set(l.id, l));
      const list = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      saveLocalCreditLogs(list);
      return list;
    }
  } catch (err) {
    console.debug('Firestore get all credit logs notice:', err);
  }
  return local.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export async function applyAdminCreditChange(
  dealerUid: string,
  change: { delta: number } | { exact: number }
): Promise<{ success: boolean; previousBalance: number; remainingCredits: number; message: string }> {
  const { getAdminToken } = await import('./adminSession');
  const adminToken = getAdminToken();
  if (!adminToken) {
    return { success: false, previousBalance: 0, remainingCredits: 0, message: SESSION_EXPIRED_MESSAGE };
  }
  const requestId = `ADMIN-CR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const response = await postCreditCommand(
    `/api/v1/admin/members/${encodeURIComponent(dealerUid)}/credits`,
    { ...change, requestId },
    adminToken
  );
  if (!response) {
    return { success: false, previousBalance: 0, remainingCredits: 0, message: 'Sunucuya ulaşılamadı; kredi güncellenmedi.' };
  }
  const { data } = response;
  if (data?.status !== 'success') {
    return {
      success: false,
      previousBalance: Number(data?.previousBalance) || 0,
      remainingCredits: Number(data?.remainingCredits) || 0,
      message: data?.message || 'Kredi güncellenemedi.',
    };
  }
  return {
    success: true,
    previousBalance: Number(data.previousBalance) || 0,
    remainingCredits: Number(data.remainingCredits) || 0,
    message: data.message || 'Kredi güncellendi.',
  };
}

/**
 * Admin: Direct adjustment of dealer credits (Add or Deduct) with audit logging
 */
export async function adminAdjustDealerCredits(
  resellerId: string,
  delta: number,
  reason: string = 'Yönetici Kredi Güncellemesi',
  performedBy: string = 'Sistem Yöneticisi'
): Promise<{ success: boolean; newBalance: number; message: string }> {
  try {
    const all = await getAllResellers();
    const reseller = all.find(r => r.uid === resellerId);
    if (!reseller) {
      return { success: false, newBalance: 0, message: 'Bayi bulunamadı.' };
    }

    const outcome = await applyAdminCreditChange(reseller.uid, { delta });
    if (!outcome.success) {
      return { success: false, newBalance: outcome.remainingCredits, message: outcome.message };
    }
    const next = outcome.remainingCredits;
    appendLocalCreditLog({
      id: `CR-LOG-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`,
      resellerId: reseller.uid,
      resellerName: reseller.resellerName,
      type: delta >= 0 ? 'admin_add' : 'admin_deduct',
      amount: delta,
      previousBalance: outcome.previousBalance,
      newBalance: next,
      description: reason || (delta >= 0 ? `+${delta} Seans Kredisi Eklendi` : `${delta} Seans Kredisi Düşüldü`),
      performedBy,
      createdAt: new Date().toISOString()
    });

    const updatedReseller: Reseller = { ...reseller, creditsBalance: next, updatedAt: new Date().toISOString() };
    await adminSaveReseller(updatedReseller);

    const active = getActiveResellerSession();
    if (active && active.uid === resellerId) {
      setActiveResellerSession(updatedReseller);
    }

    await syncMemberUserCredits(reseller.uid, next, all);

    return {
      success: true,
      newBalance: next,
      message: `Bayi kredisi başarıyla güncellendi. Yeni Bakiye: ${next} Seans`
    };
  } catch (err: any) {
    console.error('Admin adjust dealer credits error:', err);
    return { success: false, newBalance: 0, message: err?.message || 'Kredi güncellenemedi.' };
  }
}

/**
 * Admin: Direct set of exact dealer credits balance with audit logging
 */
export async function adminSetDealerCredits(
  resellerId: string,
  exactAmount: number,
  reason: string = 'Yönetici Doğrudan Kredi Belirleme',
  performedBy: string = 'Sistem Yöneticisi'
): Promise<{ success: boolean; newBalance: number; message: string }> {
  try {
    const all = await getAllResellers();
    const reseller = all.find(r => r.uid === resellerId);
    if (!reseller) {
      return { success: false, newBalance: 0, message: 'Bayi bulunamadı.' };
    }

    const target = Math.max(0, Math.round(exactAmount));
    const outcome = await applyAdminCreditChange(reseller.uid, { exact: target });
    if (!outcome.success) {
      return { success: false, newBalance: outcome.remainingCredits, message: outcome.message };
    }
    const next = outcome.remainingCredits;
    appendLocalCreditLog({
      id: `CR-LOG-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`,
      resellerId: reseller.uid,
      resellerName: reseller.resellerName,
      type: 'admin_set',
      amount: next - outcome.previousBalance,
      previousBalance: outcome.previousBalance,
      newBalance: next,
      description: `${reason} (Doğrudan ${next} Krediye Ayarlandı)`,
      performedBy,
      createdAt: new Date().toISOString()
    });

    const updatedReseller: Reseller = { ...reseller, creditsBalance: next, updatedAt: new Date().toISOString() };
    await adminSaveReseller(updatedReseller);

    const active = getActiveResellerSession();
    if (active && active.uid === resellerId) {
      setActiveResellerSession(updatedReseller);
    }

    await syncMemberUserCredits(reseller.uid, next, all);

    return {
      success: true,
      newBalance: next,
      message: `Bayi kredisi ${next} olarak başarıyla ayarlandı.`
    };
  } catch (err: any) {
    console.error('Admin set dealer credits error:', err);
    return { success: false, newBalance: 0, message: err?.message || 'Kredi ayarlanamadı.' };
  }
}

/**
 * Get dynamic dealer packages
 */
function normalizeDealerPackages(packages: DealerPackage[]): DealerPackage[] {
  const defaults = new Map(DEFAULT_DEALER_PACKAGES.map((pkg) => [pkg.id, pkg]));
  return packages.map((pkg) => {
    const canonical = defaults.get(pkg.id);
    return canonical
      ? {
          ...pkg,
          price: canonical.price,
          priceText: canonical.priceText,
          scanCredits: canonical.scanCredits,
          unitCostText: canonical.unitCostText,
          features: canonical.features,
        }
      : pkg;
  });
}

export function getDealerPackages(): DealerPackage[] {
  if (typeof window === 'undefined') return DEFAULT_DEALER_PACKAGES;
  try {
    const raw = localStorage.getItem(STORAGE_DEALER_PACKAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (p: DealerPackage) =>
            p.id !== 'pkg-turnkey-2m' &&
            p.id !== 'PKG_TUM_KODLAR' &&
            !String(p.name || '').includes('Anahtar Teslim Sistem Devri')
        );
        if (filtered.length >= 10) {
          return normalizeDealerPackages(filtered);
        }
      }
    }
  } catch (e) {
    console.debug('Error reading local dealer packages:', e);
  }
  return DEFAULT_DEALER_PACKAGES;
}

export function saveDealerPackages(pkgs: DealerPackage[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(normalizeDealerPackages(pkgs));
    if (localStorage.getItem(STORAGE_DEALER_PACKAGES_KEY) === serialized) return;
    localStorage.setItem(STORAGE_DEALER_PACKAGES_KEY, serialized);
    window.dispatchEvent(new CustomEvent('aurabio_dealer_packages_updated'));
  } catch (e) {
    console.warn('Error saving local dealer packages:', e);
  }
}

/**
 * Admin: Save / Create or Update Dealer Package
 */
export async function adminSaveDealerPackage(pkg: DealerPackage): Promise<boolean> {
  try {
    const current = getDealerPackages();
    const idx = current.findIndex(p => p.id === pkg.id);
    let updated: DealerPackage[];

    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...pkg };
    } else {
      updated = [...current, { ...pkg }];
    }

    updated = normalizeDealerPackages(updated);
    saveDealerPackages(updated);

    // Save to Firestore
    try {
      const docRef = doc(db, 'system_config', 'dealer_packages');
      await setDoc(docRef, { packages: updated, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin save dealer package Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin save dealer package error:', err);
    return false;
  }
}

/**
 * Admin: Delete Dealer Package
 */
export async function adminDeleteDealerPackage(pkgId: string): Promise<boolean> {
  try {
    const current = getDealerPackages();
    const updated = current.filter(p => p.id !== pkgId);
    saveDealerPackages(updated);

    try {
      const docRef = doc(db, 'system_config', 'dealer_packages');
      await setDoc(docRef, { packages: updated, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin delete dealer package Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin delete dealer package error:', err);
    return false;
  }
}

/**
 * Admin: Reset Dealer Packages to defaults
 */
export async function adminResetDealerPackages(): Promise<boolean> {
  try {
    saveDealerPackages(DEFAULT_DEALER_PACKAGES);

    try {
      const docRef = doc(db, 'system_config', 'dealer_packages');
      await setDoc(docRef, { packages: DEFAULT_DEALER_PACKAGES, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin reset dealer packages Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin reset dealer packages error:', err);
    return false;
  }
}

/**
 * Subscribe to Dealer Packages changes in real-time
 */
export function subscribeToDealerPackages(onUpdate: (pkgs: DealerPackage[]) => void): Unsubscribe {
  onUpdate(getDealerPackages());

  const handleLocal = () => onUpdate(getDealerPackages());
  window.addEventListener('storage', handleLocal);
  window.addEventListener('aurabio_dealer_packages_updated', handleLocal);

  try {
    const docRef = doc(db, 'system_config', 'dealer_packages');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.packages)) {
          const filtered = (data.packages as DealerPackage[]).filter(
            (p) =>
              p.id !== 'pkg-turnkey-2m' &&
              p.id !== 'PKG_TUM_KODLAR' &&
              !String(p.name || '').includes('Anahtar Teslim Sistem Devri')
          );
          if (filtered.length >= 10) {
            const normalized = normalizeDealerPackages(filtered);
            saveDealerPackages(normalized);
            onUpdate(normalized);
          }
        }
      }
    });

    return () => {
      window.removeEventListener('storage', handleLocal);
      window.removeEventListener('aurabio_dealer_packages_updated', handleLocal);
      unsub();
    };
  } catch {
    return () => {
      window.removeEventListener('storage', handleLocal);
      window.removeEventListener('aurabio_dealer_packages_updated', handleLocal);
    };
  }
}

/**
 * Returns the package credit amount without a purchase bonus.
 */
export function getPackagePurchaseCredits(packageId: string): number {
  const pkg =
    getDealerPackages().find(p => p.id === packageId) ||
    DEFAULT_DEALER_PACKAGES.find(p => p.id === packageId);
  return pkg?.scanCredits ?? 0;
}

/**
 * Options for an atomic scan/session credit deduction.
 */
export interface ScanDeductOptions {
  /** Explicit dealer/reseller UID to deduct from (optional; falls back to active session / userId) */
  dealerId?: string;
  /** Number of credits to consume per scan (defaults to 1) */
  scanCost?: number;
  /** Unique id of the logical scan request used to de-duplicate double-fire deductions */
  requestId?: string;
}

export interface DeductScanResult {
  success: boolean;
  remainingCredits: number;
  message?: string;
  requestId?: string;
  insufficientCredits?: boolean;
}

const SESSION_EXPIRED_MESSAGE = 'Oturum süreniz dolmuş veya yetki doğrulanamadı, lütfen tekrar giriş yapın.';

function authFailure(requestId: string): DeductScanResult {
  return { success: false, remainingCredits: 0, message: SESSION_EXPIRED_MESSAGE, requestId };
}

async function postCreditCommand(
  path: string,
  body: Record<string, unknown>,
  bearerToken: string | null
): Promise<{ status: number; data: any } | null> {
  if (!bearerToken) return null;
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (isUnknownCommitResponse(res.status, data)) {
      const verdict = await verifyRecordedRequest(data.request_id, bearerToken);
      if (verdict === 'RECORDED') {
        return {
          status: 409,
          data: { status: 'error', code: 'ALREADY_RECORDED', message: 'İşlem sunucuda zaten kaydedildi. Bakiyeyi yenileyip kontrol edin.' },
        };
      }
      if (verdict === 'UNKNOWN') {
        return { status: res.status, data: { ...data, message: 'İşlem durumu doğrulanamadı. Bakiyeyi yenileyip kontrol edin, tekrar göndermeyin.' } };
      }
    }
    return { status: res.status, data };
  } catch {
    return null;
  }
}

/**
 * Mirrors a server-confirmed credit change into the local display log; never decides a balance.
 */
function appendLocalCreditLog(log: CreditTransaction): void {
  try {
    const current = getLocalCreditLogs();
    saveLocalCreditLogs([log, ...current.filter(i => i.id !== log.id)].slice(0, 500));
  } catch (e) {
    console.debug('Local credit log mirror notice:', e);
  }
}

/**
 * In-flight guard: serializes concurrent deductions and de-duplicates identical requests.
 * Prevents double-trigger / double-device double-spending while keeping real multi-scans ordered.
 */
let activeScanDeduct: { key: string; promise: Promise<DeductScanResult> } | null = null;

function resolveScanDealerId(userId?: string): string | null {
  if (userId && typeof userId === 'string' && userId.trim()) {
    return userId.trim();
  }
  const activeReseller = getActiveResellerSession();
  if (activeReseller?.uid && typeof activeReseller.uid === 'string' && activeReseller.uid.trim()) {
    return activeReseller.uid.trim();
  }
  return null;
}

/**
 * Deduct scan credits atomically from the Dealer's pool.
 *
 * The authenticated server transaction is the only balance authority; without a verified session or a
 * reachable server the request fails and no local balance is changed.
 */
export async function deductScanCreditFromDealer(
  userId?: string,
  opts?: ScanDeductOptions
): Promise<DeductScanResult> {
  const scanCost = Math.max(1, Math.floor(opts?.scanCost ?? 1));
  const requestId = opts?.requestId || `SCAN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dealerId = (opts?.dealerId || '').trim() || resolveScanDealerId(userId);

  if (!dealerId) {
    return authFailure(requestId);
  }

  // Same logical request already in-flight -> return the same result (prevents double deduction).
  if (activeScanDeduct) {
    if (opts?.requestId && activeScanDeduct.key === opts.requestId) {
      return activeScanDeduct.promise;
    }
    await activeScanDeduct.promise.catch(() => {});
  }

  const promise = performAtomicScanDeduct(dealerId, scanCost, requestId);
  activeScanDeduct = { key: requestId, promise };
  try {
    return await promise;
  } finally {
    if (activeScanDeduct?.key === requestId) {
      activeScanDeduct = null;
    }
  }
}

/**
 * Refunds the exact amount the server recorded for `requestId`; the amount is never supplied by the client.
 */
export async function refundScanCreditToDealer(
  userId: string | undefined,
  requestId: string
): Promise<DeductScanResult> {
  const dealerId = resolveScanDealerId(userId);
  if (!dealerId || !requestId) return authFailure(requestId);

  const [{ getMemberWalletToken }, { getAdminToken }] = await Promise.all([
    import('./authManager'),
    import('./adminSession'),
  ]);
  const token = getAdminToken() || getMemberWalletToken();
  if (!token) return authFailure(requestId);
  const response = await postCreditCommand(
    `/api/v1/members/${encodeURIComponent(dealerId)}/refund-scan-credit`,
    { requestId },
    token
  );
  if (!response) {
    return { success: false, remainingCredits: 0, message: 'Kredi servisine ulaşılamadı. Lütfen bağlantınızı kontrol edin.', requestId };
  }
  if (response.status === 401 || response.status === 403) {
    return authFailure(requestId);
  }

  const { data } = response;
  if (data?.status !== 'success') {
    return {
      success: false,
      remainingCredits: 0,
      message: data?.message || 'Kredi iadesi tamamlanamadı.',
      requestId,
    };
  }

  const remaining = typeof data.remainingCredits === 'number' ? data.remainingCredits : 0;
  window.dispatchEvent(new CustomEvent('aurabio_credits_deducted', { detail: { remainingCredits: remaining } }));
  return { success: true, remainingCredits: remaining, message: data.message || 'Kredi iade edildi.', requestId };
}

async function performAtomicScanDeduct(
  dealerId: string,
  scanCost: number,
  requestId: string
): Promise<DeductScanResult> {
  const [{ getMemberWalletToken }, { getAdminToken }] = await Promise.all([
    import('./authManager'),
    import('./adminSession'),
  ]);
  const token = getAdminToken() || getMemberWalletToken();
  if (!token) return authFailure(requestId);
  const response = await postCreditCommand(
    `/api/v1/members/${encodeURIComponent(dealerId)}/deduct-scan-credit`,
    { amount: scanCost, requestId },
    token
  );
  if (!response) {
    return { success: false, remainingCredits: 0, message: 'Kredi servisine ulaşılamadı. Lütfen bağlantınızı kontrol edin.', requestId };
  }
  if (response.status === 401 || response.status === 403) {
    return authFailure(requestId);
  }

  const { data } = response;
  if (data?.status !== 'success') {
    if (data?.code === 'INSUFFICIENT_CREDITS') {
      return {
        success: false,
        remainingCredits: Number(data.remainingCredits) || 0,
        message: 'Yetersiz kredi! Seans taraması için yeterli seans kredisi bulunmuyor. Lütfen bayi paketi yükleyin.',
        requestId,
        insufficientCredits: true,
      };
    }
    return {
      success: false,
      remainingCredits: 0,
      message: data?.message || 'Kredi düşümü sunucuda tamamlanamadı. Lütfen tekrar deneyin.',
      requestId,
    };
  }

  const remaining = typeof data.remainingCredits === 'number' ? data.remainingCredits : 0;
  try {
    await cacheDealerBalance(dealerId, remaining, Boolean(data.isIdempotentReplay));
  } catch (err) {
    console.debug('Dealer balance cache notice:', err);
  }
  if (data.state) {
    window.dispatchEvent(new CustomEvent('aurabio_monoline_state_updated', { detail: data.state }));
  }
  window.dispatchEvent(new CustomEvent('aurabio_credits_deducted', { detail: { remainingCredits: remaining } }));
  return {
    success: true,
    remainingCredits: remaining,
    message: data.message || 'Kredi başarıyla düşüldü.',
    requestId,
  };
}

/**
 * Mirrors the server-authoritative balance into local display caches; never decides a balance.
 */
async function cacheDealerBalance(dealerId: string, balance: number, isIdempotentReplay: boolean): Promise<void> {
  const allResellers = await getAllResellers();
  const cached = allResellers.find(r => r.uid === dealerId) || null;
  if (!cached) return;

  const nowIso = new Date().toISOString();
  const updatedReseller: Reseller = {
    ...cached,
    creditsBalance: balance,
    totalScans: (cached.totalScans || 0) + (isIdempotentReplay ? 0 : 1),
    lastScanAt: nowIso,
    updatedAt: nowIso,
  };
  saveLocalResellers([updatedReseller, ...allResellers.filter(r => r.uid !== dealerId)]);
  if (getActiveResellerSession()?.uid === dealerId) {
    setActiveResellerSession(updatedReseller);
  }
  await syncMemberUserCredits(dealerId, balance, allResellers);
}

/**
 * Sync the authoritative balance with the linked member/user account (`users/{uid}`).
 */
async function syncMemberUserCredits(resellerId: string, newBalance: number, allResellers: Reseller[]): Promise<void> {
  try {
    const { getActiveMemberSession, fetchMemberProfile, saveToLocalMembersDirectory } = await import('./authManager');
    const reseller = allResellers.find(r => r.uid === resellerId);
    let user = getActiveMemberSession();

    if (!user || (resellerId && user.uid !== resellerId && (!user.email || !reseller?.email || user.email.toLowerCase() !== reseller.email.toLowerCase()))) {
      try {
        user = await fetchMemberProfile(resellerId);
      } catch {
        user = null;
      }
    }
    if (!user) return;

    const updatedUser: UserMember = {
      ...user,
      creditsBalance: newBalance,
      dealerDetails: user.dealerDetails ? {
        ...user.dealerDetails,
        creditsBalance: newBalance
      } : user.dealerDetails
    };

    localStorage.setItem('aurabio_active_session_v1', JSON.stringify(updatedUser));
    saveToLocalMembersDirectory(updatedUser);
    window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updatedUser }));

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        creditsBalance: newBalance,
        dealerDetails: updatedUser.dealerDetails,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch {
      // non-blocking
    }
  } catch (err) {
    console.debug('Member credit sync notice:', err);
  }
}

/**
 * Real-time subscription to the full `resellers` collection (live admin dealer list).
 */
export function subscribeToResellersList(onList: (list: Reseller[]) => void): Unsubscribe {
  let active = true;
  let refreshing = false;
  let refreshQueued = false;
  const refresh = async () => {
    if (refreshing) {
      refreshQueued = true;
      return;
    }
    refreshing = true;
    try {
      const list = await getAllResellers();
      if (active) onList(list);
    } finally {
      refreshing = false;
      if (active && refreshQueued) {
        refreshQueued = false;
        void refresh();
      }
    }
  };
  void refresh();
  const timer = window.setInterval(() => void refresh(), 15000);
  const handleRefresh = () => void refresh();
  window.addEventListener('aurabio_resellers_updated', handleRefresh);
  window.addEventListener('aurabio_credits_deducted', handleRefresh);
  return () => {
    active = false;
    window.clearInterval(timer);
    window.removeEventListener('aurabio_resellers_updated', handleRefresh);
    window.removeEventListener('aurabio_credits_deducted', handleRefresh);
  };
}

/**
 * Real-time subscription to the system-wide `credit_logs` collection (live admin audit trail).
 */
export function subscribeToCreditLogs(onList: (logs: CreditTransaction[]) => void): Unsubscribe {
  try {
    const colRef = collection(db, 'credit_logs');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      const list: CreditTransaction[] = [];
      snap.forEach((docSnap: any) => {
        const data = docSnap.data() as CreditTransaction;
        if (data && data.id) list.push({ ...data, id: docSnap.id });
      });
      onList(list);
    });
    return unsub;
  } catch (err) {
    console.debug('Subscribe credit logs notice:', err);
    return () => {};
  }
}

/**
 * Real-time subscription to the credit logs of a single dealer (live audit history for detail modal).
 */
export function subscribeToResellerCreditLogs(
  resellerId: string,
  onList: (logs: CreditTransaction[]) => void
): Unsubscribe {
  try {
    // Single-field ordering avoids requiring a composite index (equality + orderBy would need one).
    const colRef = collection(db, 'credit_logs');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      const list: CreditTransaction[] = [];
      snap.forEach((docSnap: any) => {
        const data = docSnap.data() as CreditTransaction;
        if (data && data.id && data.resellerId === resellerId) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      onList(list);
    });
    return unsub;
  } catch (err) {
    console.debug('Subscribe reseller credit logs notice:', err);
    return () => {};
  }
}

export const DEFAULT_RESELLERS: Reseller[] = [];

export const DEFAULT_COMMISSIONS: CommissionTransaction[] = [];

const LEGACY_MOCK_RESELLER_IDS = new Set([
  'RESELLER-MERKEZ-01',
  'RESELLER-DOGAL-02',
  'RESELLER-AKADEMI-03',
  'RESELLER-ANADOLU-04'
]);

const LEGACY_MOCK_COMMISSION_IDS = new Set([
  'COMM-10941',
  'COMM-10942',
  'COMM-10943',
  'COMM-20101',
  'COMM-20102'
]);

/**
 * Get all stored local resellers (filtered of any legacy mock/demo entries)
 */
export function getLocalResellers(): Reseller[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_RESELLERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((r: any) => r && r.uid && !LEGACY_MOCK_RESELLER_IDS.has(r.uid));
        return cleaned;
      }
    }
  } catch (e) {
    console.debug('Error parsing local resellers:', e);
  }
  return [];
}

export function saveLocalResellers(resellers: Reseller[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = resellers.filter(r => r && r.uid && !LEGACY_MOCK_RESELLER_IDS.has(r.uid));
    const serialized = JSON.stringify(cleaned);
    if (localStorage.getItem(STORAGE_RESELLERS_KEY) === serialized) return;
    localStorage.setItem(STORAGE_RESELLERS_KEY, serialized);
    window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
  } catch (e) {
    console.warn('Error saving local resellers:', e);
  }
}

/**
 * Get all stored local commissions (filtered of any legacy mock/demo entries)
 */
export function getLocalCommissions(): CommissionTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_COMMISSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((c: any) => c && c.transactionId && !LEGACY_MOCK_COMMISSION_IDS.has(c.transactionId));
        return cleaned;
      }
    }
  } catch (e) {
    console.debug('Error parsing local commissions:', e);
  }
  return [];
}

export function saveLocalCommissions(commissions: CommissionTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = commissions.filter(c => c && c.transactionId && !LEGACY_MOCK_COMMISSION_IDS.has(c.transactionId));
    localStorage.setItem(STORAGE_COMMISSIONS_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent('aurabio_commissions_updated'));
  } catch (e) {
    console.warn('Error saving local commissions:', e);
  }
}

/**
 * Mask User ID for Privacy in Reseller Panels (e.g. USR-A79B)
 */
export function maskUserId(rawId: string): string {
  if (!rawId) return 'USR-XXXX';
  const clean = rawId.replace(/^USR-/, '').replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length <= 4) return `USR-${clean.toUpperCase()}`;
  return `USR-${clean.substring(0, 4).toUpperCase()}`;
}

// Cookie helper for cross-browser persistent referral storage
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  } catch {
    return null;
  }
}

function setCookie(name: string, val: string, days = 365): void {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(val)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // ignore
  }
}

const COOKIE_REFERRAL_KEY = 'aurabio_ref_code_v3';

/**
 * Parse & Detect referral code STRICTLY from current URL search query (?ref=..., ?referral=..., ?bayi=...) or hash (#ref=...)
 * Returns null if visitor did not arrive via a direct referral URL.
 */
export function detectReferralCodeFromUrlOnly(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    let foundCode: string | null = null;

    // 1. Check window.location.search (e.g. ?ref=AURA-BAYI-5521)
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      foundCode = searchParams.get('ref') || 
                  searchParams.get('referral') || 
                  searchParams.get('bayi') || 
                  searchParams.get('bayiKodu') ||
                  searchParams.get('r');
    }

    // 2. Check window.location.hash (e.g. #ref=AURA-BAYI-5521 or #tab=camera&ref=...)
    if (!foundCode && window.location.hash) {
      const hashStr = window.location.hash.replace(/^#/, '');
      const queryIdx = hashStr.indexOf('?');
      const paramStr = queryIdx >= 0 ? hashStr.substring(queryIdx + 1) : hashStr;
      const hashParams = new URLSearchParams(paramStr);
      foundCode = hashParams.get('ref') || 
                  hashParams.get('referral') || 
                  hashParams.get('bayi') || 
                  hashParams.get('bayiKodu') ||
                  hashParams.get('r');
    }

    if (foundCode) {
      const cleanCode = foundCode.trim().toUpperCase();
      try {
        localStorage.setItem(STORAGE_CACHED_REFERRAL_CODE_KEY, cleanCode);
        sessionStorage.setItem(STORAGE_CACHED_REFERRAL_CODE_KEY, cleanCode);
        sessionStorage.setItem('aurabio_url_referral_active', cleanCode);
      } catch {
        // ignore
      }
      setCookie(COOKIE_REFERRAL_KEY, cleanCode, 180);
      return cleanCode;
    }
  } catch (err) {
    console.warn('Detect referral code from URL notice:', err);
  }

  return null;
}

/**
 * Parse & Detect referral code from URL or persistent storage
 */
export function detectAndSaveReferralCodeFromUrl(): string | null {
  const fromUrl = detectReferralCodeFromUrlOnly();
  if (fromUrl) return fromUrl;
  return getStoredReferralCode();
}

/**
 * Check if the active session entered via a direct referral URL
 */
export function isDirectUrlReferralActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(sessionStorage.getItem('aurabio_url_referral_active') || detectReferralCodeFromUrlOnly());
  } catch {
    return false;
  }
}

/**
 * Get stored referral code from local/session storage or cookies
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromLocal = localStorage.getItem(STORAGE_CACHED_REFERRAL_CODE_KEY);
    if (fromLocal) return fromLocal.trim().toUpperCase();

    const fromSession = sessionStorage.getItem(STORAGE_CACHED_REFERRAL_CODE_KEY);
    if (fromSession) return fromSession.trim().toUpperCase();

    const fromCookie = getCookie(COOKIE_REFERRAL_KEY);
    if (fromCookie) return fromCookie.trim().toUpperCase();

    return null;
  } catch {
    return null;
  }
}

/**
 * Clear cached referral code from all storage layers
 */
export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_CACHED_REFERRAL_CODE_KEY);
    localStorage.removeItem('aurabio_stored_referral_code_v1');
    localStorage.removeItem('aurabio_cached_referral_code_v1');
    sessionStorage.removeItem(STORAGE_CACHED_REFERRAL_CODE_KEY);
    sessionStorage.removeItem('aurabio_stored_referral_code_v1');
    sessionStorage.removeItem('aurabio_cached_referral_code_v1');
    sessionStorage.removeItem('aurabio_url_referral_active');
    setCookie(COOKIE_REFERRAL_KEY, '', -1);
    setCookie('aurabio_ref_code_v3', '', -1);
    setCookie('aurabio_ref_code', '', -1);

    // Clean any referral query parameters from window URL so subsequent visits are clean
    if (window.history && window.location) {
      const url = new URL(window.location.href);
      let changed = false;
      const refKeys = ['ref', 'referral', 'bayi', 'bayiKodu', 'r'];
      refKeys.forEach((key) => {
        if (url.searchParams.has(key)) {
          url.searchParams.delete(key);
          changed = true;
        }
      });
      if (changed) {
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
      }
    }
  } catch {
    // non-blocking
  }
}

/**
 * Store referral code explicitly across all storage layers
 */
export function setStoredReferralCode(code: string): void {
  if (typeof window === 'undefined' || !code) return;
  try {
    const clean = code.trim().toUpperCase();
    localStorage.setItem(STORAGE_CACHED_REFERRAL_CODE_KEY, clean);
    sessionStorage.setItem(STORAGE_CACHED_REFERRAL_CODE_KEY, clean);
    setCookie(COOKIE_REFERRAL_KEY, clean, 180);
  } catch {
    // non-blocking
  }
}

/**
 * Fetch all resellers from Firestore with fallback to Local Directory and strict distinct deduplication
 */
export async function getAllResellers(): Promise<Reseller[]> {
  const { getAdminToken } = await import('./adminSession');
  const adminToken = getAdminToken();
  if (adminToken) {
    try {
      const rows: any[] = [];
      let page = 1;
      let total = 0;
      do {
        const response = await fetch(`/api/v1/admin/dealers?page=${page}&pageSize=100`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.status !== 'success') throw new Error(data.message || 'Bayi listesi okunamadı.');
        rows.push(...(data.dealers || []));
        total = Number(data.total) || 0;
        page += 1;
      } while ((page - 1) * 100 < total);

      const localByUid = new Map(getLocalResellers().map((reseller) => [reseller.uid, reseller]));
      const serverResellers = rows.flatMap((row) => {
        const profile = row.profile && typeof row.profile === 'object' ? row.profile : {};
        const dealerDetails = profile.dealerDetails || {};
        const isDealer = row.role === 'dealer' || row.role === 'admin' ||
          profile.dealerStatus === 'approved' || profile.isDealerRequested || profile.dealerDetails;
        if (!isDealer) return [];
        const local = localByUid.get(row.user_id);
        return [{
          ...local,
          ...profile,
          uid: row.user_id,
          resellerName: dealerDetails.companyName || row.full_name || local?.resellerName || 'Bayi',
          fullName: row.full_name || profile.fullName || local?.fullName || '',
          email: row.email || '',
          phone: row.phone || '',
          referralCode: row.referral_code || profile.referralCode || local?.referralCode || '',
          creditsBalance: Number(row.scan_credits) || 0,
          dealerPackageId: profile.dealerPackageId || dealerDetails.dealerPackageId || local?.dealerPackageId,
          bankInfo: {
            bankName: dealerDetails.bankInfo?.bankName || local?.bankInfo?.bankName || '',
            accountHolder: dealerDetails.bankInfo?.accountHolder || row.full_name || local?.bankInfo?.accountHolder || '',
            iban: dealerDetails.bankInfo?.iban || local?.bankInfo?.iban || '',
          },
          status: row.is_locked ? 'suspended' as const : 'active' as const,
          totalEarnings: Number(row.wallet_total_earned) || local?.totalEarnings || 0,
          paidEarnings: Number(row.wallet_total_withdrawn) || local?.paidEarnings || 0,
          pendingEarnings: local?.pendingEarnings || 0,
          totalSalesAmount: local?.totalSalesAmount || 0,
          totalReferredUsers: local?.totalReferredUsers || 0,
          createdAt: row.created_at || profile.createdAt || local?.createdAt || new Date().toISOString(),
          updatedAt: profile.updatedAt || local?.updatedAt || row.created_at || new Date().toISOString(),
        } as Reseller];
      });
      saveLocalResellers(serverResellers);
      return serverResellers.sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin'));
    } catch (err) {
      console.debug('Admin dealer list server notice:', err);
    }
  }

  const map = new Map<string, Reseller>();

  // 1. Local list
  getLocalResellers().forEach(r => {
    if (r.uid) map.set(r.uid, r);
  });

  // 2. Firestore collection 'resellers' (only overwrite local if Firestore document is newer)
  try {
    const colRef = collection(db, 'resellers');
    const snap = await getDocs(colRef);
    snap.forEach(docSnap => {
      const data = { ...docSnap.data(), uid: docSnap.id } as Reseller;
      if (data.uid) {
        const existingLocal = map.get(data.uid);
        if (existingLocal) {
          const localMs = new Date(existingLocal.updatedAt || 0).getTime();
          const fsMs = new Date(data.updatedAt || 0).getTime();
          if (localMs > fsMs) {
            return;
          }
        }
        map.set(data.uid, data);
      }
    });
  } catch (err) {
    console.debug('Fetch resellers Firestore notice (using local directory):', err);
  }

  // 2b. Firestore collection 'users' (sync all dealers created in Firestore)
  try {
    const usersCol = collection(db, 'users');
    const uSnap = await getDocs(usersCol);
    uSnap.forEach((docSnap: any) => {
      const u = { ...docSnap.data(), uid: docSnap.id } as any;
      if (
        u.role === 'dealer' ||
        u.role === 'admin' ||
        u.dealerStatus === 'approved' ||
        u.isDealerRequested ||
        u.dealerDetails
      ) {
        if (!map.has(u.uid)) {
          const code =
            u.ref_code ||
            u.referralCode ||
            u.dealerDetails?.referralCode ||
            (u.role === 'admin' ? 'AURA-BAYI-AKN01' : `AURA-BAYI-${u.global_line_id || Math.floor(1000 + Math.random() * 9000)}`);
          map.set(u.uid, {
            uid: u.uid,
            resellerName: u.dealerDetails?.companyName || u.full_name || u.fullName || 'Bayi',
            fullName: u.full_name || u.fullName || '',
            email: u.email || '',
            phone: u.phone || u.dealerDetails?.whatsapp || '',
            referralCode: code,
            commissionRate: u.dealerDetails?.commissionRate || (u.role === 'admin' ? 30 : 20),
            creditsBalance:
              typeof u.creditsBalance === 'number'
                ? u.creditsBalance
                : typeof u.session_credits === 'number'
                ? u.session_credits
                : 0,
            dealerPackageId: u.dealerPackageId || 'pkg-5k',
            bankInfo: {
              bankName: u.dealerDetails?.bankInfo?.bankName || '',
              accountHolder: u.dealerDetails?.bankInfo?.accountHolder || u.full_name || u.fullName || '',
              iban: u.dealerDetails?.bankInfo?.iban || '',
            },
            status: u.is_locked ? 'suspended' : 'active',
            totalEarnings: u.wallets?.total_earnings || 0,
            paidEarnings: u.wallets?.total_withdrawn || 0,
            pendingEarnings: 0,
            totalSalesAmount: 0,
            totalReferredUsers: 0,
            createdAt: u.created_at || u.createdAt || new Date().toISOString(),
            updatedAt: u.updated_at || u.updatedAt || new Date().toISOString(),
          });
        }
      }
    });
  } catch (uErr) {
    console.debug('Fetch users as resellers Firestore notice:', uErr);
  }

  // 3. Fallback: also merge confirmed dealers from members directory
  try {
    const { getLocalMembersDirectory } = await import('./authManager');
    const members = getLocalMembersDirectory();
    members.forEach(m => {
      if (m.role === 'dealer' || m.role === 'admin' || m.dealerStatus === 'approved' || m.dealerDetails) {
        if (!map.has(m.uid)) {
          const code = m.dealerDetails?.referralCode || m.referralCode || (m.role === 'admin' ? 'AURA-BAYI-AKN01' : `AURA-BAYI-${Math.floor(1000 + Math.random() * 9000)}`);
          map.set(m.uid, {
            uid: m.uid,
            resellerName: m.dealerDetails?.companyName || m.fullName,
            email: m.email,
            phone: m.dealerDetails?.whatsapp || m.phone,
            referralCode: code,
            commissionRate: m.dealerDetails?.commissionRate || (m.role === 'admin' ? 30 : 20),
            creditsBalance: m.creditsBalance !== undefined ? m.creditsBalance : 0,
            dealerPackageId: m.dealerPackageId || 'pkg-5k',
            bankInfo: {
              bankName: m.dealerDetails?.bankInfo?.bankName || '',
              accountHolder: m.dealerDetails?.bankInfo?.accountHolder || m.fullName,
              iban: m.dealerDetails?.bankInfo?.iban || '',
            },
            status: 'active',
            totalEarnings: 0,
            paidEarnings: 0,
            pendingEarnings: 0,
            totalSalesAmount: 0,
            totalReferredUsers: 0,
            createdAt: m.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });
  } catch (e) {
    // non-blocking
  }

  // 4. Strict Distinct / Unique Consolidation: Deduplicate by email and referralCode
  const distinctByEmail = new Map<string, Reseller>();
  const distinctByCode = new Map<string, Reseller>();
  const finalizedList: Reseller[] = [];

  Array.from(map.values()).forEach(r => {
    if (!r.uid || !r.resellerName) return;

    const cleanEmail = (r.email || '').trim().toLowerCase();
    const cleanCode = (r.referralCode || '').trim().toUpperCase();

    // If duplicate email exists, keep the one with a valid referralCode or higher credits/activity
    if (cleanEmail && distinctByEmail.has(cleanEmail)) {
      const existing = distinctByEmail.get(cleanEmail)!;
      if (!existing.referralCode && r.referralCode) {
        distinctByEmail.set(cleanEmail, r);
      }
      return;
    }

    // If duplicate referral code exists (unless empty), prevent duplicate entry
    if (cleanCode && distinctByCode.has(cleanCode)) {
      return;
    }

    if (cleanEmail) distinctByEmail.set(cleanEmail, r);
    if (cleanCode) distinctByCode.set(cleanCode, r);
    finalizedList.push(r);
  });

  const ownUid = getActiveResellerSession()?.uid;
  const ownBalance = ownUid ? await getServerCreditsBalance(ownUid) : null;
  const serverSourcedList = finalizedList.map((reseller) => ({
    ...reseller,
    creditsBalance: reseller.uid === ownUid ? ownBalance ?? undefined : undefined,
  }));
  saveLocalResellers(serverSourcedList);
  return serverSourcedList.sort((a, b) => {
    // Admin first, then by sales
    const aEmail = (a.email || '').toLowerCase();
    const bEmail = (b.email || '').toLowerCase();
    if (a.uid === 'ADMIN-AKN-01' || aEmail === 'psikologabdulkadirkan@gmail.com') return -1;
    if (b.uid === 'ADMIN-AKN-01' || bEmail === 'psikologabdulkadirkan@gmail.com') return 1;
    return (b.totalSalesAmount || 0) - (a.totalSalesAmount || 0);
  });
}

/**
 * Get active resellers list for registration dropdown
 */
export async function getActiveResellers(): Promise<Reseller[]> {
  const all = await getAllResellers();
  return all.filter(r => r.status === 'active');
}

/**
 * Find reseller by referral code (case-insensitive with multi-layer check)
 */
export async function getResellerByCode(code: string): Promise<Reseller | null> {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  const all = await getAllResellers();
  const found = all.find(r => r.referralCode && r.referralCode.toUpperCase() === clean);
  if (found) return found;

  // Fallback 1: check members directory for a dealer with this referralCode
  try {
    const { getLocalMembersDirectory } = await import('./authManager');
    const members = getLocalMembersDirectory();
    const dealerUser = members.find(m => 
      m.dealerDetails?.referralCode?.toUpperCase() === clean ||
      m.referralCode?.toUpperCase() === clean ||
      (m.role === 'dealer' && (m.uid === code || m.referredByCode?.toUpperCase() === clean))
    );

    if (dealerUser) {
      const serverBalance = await getServerCreditsBalance(dealerUser.uid);
      return {
        uid: dealerUser.uid,
        resellerName: dealerUser.dealerDetails?.companyName || dealerUser.fullName,
        email: dealerUser.email,
        phone: dealerUser.dealerDetails?.whatsapp || dealerUser.phone,
        referralCode: dealerUser.dealerDetails?.referralCode || dealerUser.referralCode || clean,
        commissionRate: dealerUser.dealerDetails?.commissionRate || 20,
        creditsBalance: serverBalance ?? undefined,
        bankInfo: {
          bankName: dealerUser.dealerDetails?.bankInfo?.bankName || '',
          accountHolder: dealerUser.dealerDetails?.bankInfo?.accountHolder || dealerUser.fullName,
          iban: dealerUser.dealerDetails?.bankInfo?.iban || '',
        },
        status: 'active',
        totalEarnings: 0,
        paidEarnings: 0,
        pendingEarnings: 0,
        totalSalesAmount: 0,
        totalReferredUsers: 0,
        createdAt: dealerUser.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (e) {
    console.debug('Dealer fallback lookup notice:', e);
  }

  // Fallback 2: Firestore direct lookup
  try {
    const colRef = collection(db, 'resellers');
    const q = query(colRef, where('referralCode', '==', clean));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = { ...snap.docs[0].data(), uid: snap.docs[0].id } as Reseller;
      if (data) {
        const serverBalance = await getServerCreditsBalance(data.uid);
        return { ...data, creditsBalance: serverBalance ?? undefined };
      }
    }
  } catch (fsErr) {
    console.debug('Firestore direct lookup notice:', fsErr);
  }

  // Fallback 3: Even if unlisted / new dealer referral code in valid format (e.g. AURA-BAYI-1014 or any code from URL), construct a valid active reseller representation so it locks and attributes reliably!
  if (clean.startsWith('AURA-') || clean.startsWith('BAYI-') || clean.length >= 4) {
    const isPsychologyCenter = clean === 'AURA-BAYI-1014' || clean.includes('1014');
    return {
      uid: `BAYI-${clean}`,
      resellerName: isPsychologyCenter ? 'Psikoloji Danışmanlık Merkezi' : `Yetkili Bayi (${clean})`,
      email: '',
      phone: '',
      referralCode: clean,
      commissionRate: 20,
      creditsBalance: undefined,
      bankInfo: {
        bankName: '',
        accountHolder: '',
        iban: '',
      },
      status: 'active',
      totalEarnings: 0,
      paidEarnings: 0,
      pendingEarnings: 0,
      totalSalesAmount: 0,
      totalReferredUsers: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Find reseller by ID / UID
 */
async function getServerCreditsBalance(uid: string): Promise<number | null> {
  const [{ getAdminToken }, { getMemberWalletToken }] = await Promise.all([
    import('./adminSession'),
    import('./authManager'),
  ]);
  const token = getAdminToken() || getMemberWalletToken();
  if (!token) return null;
  try {
    const response = await fetch(`/api/v1/members/${encodeURIComponent(uid)}/credits`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    return response.ok && data.status === 'success' && Number.isInteger(data.balance)
      ? data.balance
      : null;
  } catch {
    return null;
  }
}

export async function getResellerById(uid: string): Promise<Reseller | null> {
  const cleanUid = typeof uid === 'string' ? uid.trim() : '';
  if (!cleanUid) return null;

  const localList = getLocalResellers();
  const activeSession = getActiveResellerSession();
  let reseller: Reseller | null =
    (activeSession?.uid === cleanUid ? activeSession : null) ||
    localList.find((item) => item.uid === cleanUid) ||
    null;

  try {
    const snap = await getDoc(doc(db, 'resellers', cleanUid));
    if (snap.exists()) {
      const firestoreReseller = { ...snap.data(), uid: snap.id } as Reseller;
      if (!reseller || new Date(firestoreReseller.updatedAt || 0).getTime() >= new Date(reseller.updatedAt || 0).getTime()) {
        reseller = firestoreReseller;
      }
    }
  } catch (error) {
    console.debug('Direct reseller profile lookup notice (using cache):', error);
  }

  if (!reseller) {
    const all = await getAllResellers();
    reseller = all.find((item) => item.uid === cleanUid) || null;
  }
  if (!reseller) {
    const { getLocalMembersDirectory } = await import('./authManager');
    const member = getLocalMembersDirectory().find((item) => item.uid === cleanUid);
    if (member && (member.role === 'dealer' || member.dealerStatus === 'approved' || member.dealerDetails)) {
      reseller = {
        uid: member.uid,
        resellerName: member.dealerDetails?.companyName || member.fullName,
        email: member.email,
        phone: member.dealerDetails?.whatsapp || member.phone,
        referralCode: member.dealerDetails?.referralCode || member.referralCode || '',
        commissionRate: member.dealerDetails?.commissionRate || 20,
        bankInfo: {
          bankName: member.dealerDetails?.bankInfo?.bankName || '',
          accountHolder: member.dealerDetails?.bankInfo?.accountHolder || member.fullName,
          iban: member.dealerDetails?.bankInfo?.iban || '',
        },
        status: 'active',
        totalEarnings: 0,
        paidEarnings: 0,
        pendingEarnings: 0,
        totalSalesAmount: 0,
        totalReferredUsers: 0,
        createdAt: member.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  if (!reseller) return null;
  const serverBalance = await getServerCreditsBalance(cleanUid);
  return { ...reseller, creditsBalance: serverBalance ?? undefined };
}

/**
 * Generate a unique referral code e.g. AURA-BAYI-4819 or AURA-REF-7201 (guaranteed unique system-wide)
 */
export function generateUniqueReferralCode(prefix = 'AURA-BAYI', existingCodes: string[] = []): string {
  const codeSet = new Set(existingCodes.map(c => c.trim().toUpperCase()));
  try {
    const all = getLocalResellers();
    all.forEach(r => {
      if (r.referralCode) codeSet.add(r.referralCode.trim().toUpperCase());
    });
  } catch {
    // ignore
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('aurabio_members_directory_v1') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((m: any) => {
          if (m?.referralCode) codeSet.add(m.referralCode.trim().toUpperCase());
          if (m?.dealerDetails?.referralCode) codeSet.add(m.dealerDetails.referralCode.trim().toUpperCase());
          if (m?.referredByCode) codeSet.add(m.referredByCode.trim().toUpperCase());
        });
      }
    }
  } catch {
    // ignore
  }

  for (let i = 0; i < 500; i++) {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${prefix}-${randNum}`;
    if (!codeSet.has(candidate)) {
      return candidate;
    }
  }

  const randAlpha = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randAlpha}`;
}

/**
 * System-wide Audit & Repair: Guarantees every single dealer and member has a unique, non-colliding referral code.
 * Replaces any duplicate codes (including old shared 'AURA-BAYI-1014') with distinct, dedicated codes.
 */
export async function ensureUniqueReferralCodesForAll(): Promise<{ fixedDealersCount: number; fixedUsersCount: number }> {
  if (typeof window === 'undefined') return { fixedDealersCount: 0, fixedUsersCount: 0 };

  try {
    const localResellers = getLocalResellers();
    const STORAGE_MEMBERS_KEY = 'aurabio_members_directory_v1';
    let localMembers: any[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_MEMBERS_KEY);
      if (raw) localMembers = JSON.parse(raw) || [];
    } catch {
      localMembers = [];
    }

    const usedCodes = new Map<string, string>(); // upperCaseCode -> ownerUid
    const masterAdminCode = 'AURA-BAYI-AKN01';
    usedCodes.set(masterAdminCode, 'ADMIN-AKN-01');

    let fixedDealersCount = 0;
    let fixedUsersCount = 0;

    const updatedResellers = [...localResellers];
    const updatedMembers = [...localMembers];

    const generateFresh = (prefix: string) => {
      for (let i = 0; i < 1000; i++) {
        const num = Math.floor(1000 + Math.random() * 9000);
        const cand = `${prefix}-${num}`;
        if (!usedCodes.has(cand)) {
          return cand;
        }
      }
      return `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    };

    // 1. Process Resellers
    for (let i = 0; i < updatedResellers.length; i++) {
      const r = updatedResellers[i];
      if (!r || !r.uid) continue;

      const isMasterAdmin = r.uid === 'ADMIN-AKN-01' || r.email?.toLowerCase() === 'psikologabdulkadirkan@gmail.com';
      let code = (r.referralCode || '').trim().toUpperCase();

      if (isMasterAdmin) {
        code = masterAdminCode;
      } else {
        // If code is empty or already claimed by another dealer or is unassigned
        if (!code || (usedCodes.has(code) && usedCodes.get(code) !== r.uid)) {
          code = generateFresh('AURA-BAYI');
          fixedDealersCount++;
        }
      }

      usedCodes.set(code, r.uid);
      updatedResellers[i] = {
        ...r,
        referralCode: code,
      };

      // Sync Firestore
      try {
        const docRef = doc(db, 'resellers', r.uid);
        setDoc(docRef, { referralCode: code, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } catch {}
    }

    // 2. Process Members & synchronize with Dealers
    for (let i = 0; i < updatedMembers.length; i++) {
      const m = updatedMembers[i];
      if (!m || !m.uid) continue;

      const isMasterAdmin = m.uid === 'ADMIN-AKN-01' || m.email?.toLowerCase() === 'psikologabdulkadirkan@gmail.com';
      const isDealer = m.role === 'dealer' || m.dealerStatus === 'approved' || Boolean(m.dealerDetails);

      if (isMasterAdmin) {
        let code = masterAdminCode;
        usedCodes.set(code, m.uid);
        updatedMembers[i] = {
          ...m,
          role: 'admin',
          isAllowed: true,
          referralCode: code,
          dealerDetails: {
            ...(m.dealerDetails || {
              companyName: 'Psikoloji Danışmanlık & Biyo-Frekans Merkezi (Merkez Bayi)',
              phone: m.phone || '0554 990 07 43',
              whatsapp: m.phone || '0554 990 07 43',
              businessField: 'Psikoloji & Biyo-Rezonans Merkezi'
            }),
            referralCode: code,
          }
        };
        continue;
      }

      if (isDealer) {
        let dealerCode = (m.dealerDetails?.referralCode || m.referralCode || '').trim().toUpperCase();
        if (!dealerCode || dealerCode === masterAdminCode || (usedCodes.has(dealerCode) && usedCodes.get(dealerCode) !== m.uid)) {
          dealerCode = generateFresh('AURA-BAYI');
          fixedDealersCount++;
        }
        usedCodes.set(dealerCode, m.uid);

        updatedMembers[i] = {
          ...m,
          referralCode: dealerCode,
          dealerDetails: {
            ...(m.dealerDetails || {
              companyName: m.fullName,
              phone: m.phone,
              whatsapp: m.phone,
              businessField: 'Biyo-Rezonans & Frekans Kliniği',
            }),
            referralCode: dealerCode,
          }
        };

        // Sync into updatedResellers if missing
        const rIdx = updatedResellers.findIndex(r => r.uid === m.uid);
        if (rIdx >= 0) {
          updatedResellers[rIdx] = {
            ...updatedResellers[rIdx],
            referralCode: dealerCode,
          };
        } else {
          updatedResellers.push({
            uid: m.uid,
            resellerName: m.dealerDetails?.companyName || m.fullName,
            email: m.email,
            phone: m.dealerDetails?.whatsapp || m.phone,
            referralCode: dealerCode,
            commissionRate: m.dealerDetails?.commissionRate || 20,
            creditsBalance: m.creditsBalance !== undefined ? m.creditsBalance : 0,
            dealerPackageId: m.dealerPackageId || 'pkg-5k',
            bankInfo: {
              bankName: m.dealerDetails?.bankInfo?.bankName || '',
              accountHolder: m.dealerDetails?.bankInfo?.accountHolder || m.fullName,
              iban: m.dealerDetails?.bankInfo?.iban || '',
            },
            status: 'active',
            totalEarnings: 0,
            paidEarnings: 0,
            pendingEarnings: 0,
            totalSalesAmount: 0,
            totalReferredUsers: 0,
            createdAt: m.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // Standard Member
        let memberCode = (m.referralCode || '').trim().toUpperCase();
        if (!memberCode || (usedCodes.has(memberCode) && usedCodes.get(memberCode) !== m.uid)) {
          memberCode = generateFresh('AURA-REF');
          fixedUsersCount++;
        }
        usedCodes.set(memberCode, m.uid);
        updatedMembers[i] = {
          ...m,
          referralCode: memberCode,
        };
      }

      // Sync user in Firestore
      try {
        const userDocRef = doc(db, 'users', m.uid);
        setDoc(userDocRef, {
          referralCode: updatedMembers[i].referralCode,
          dealerDetails: updatedMembers[i].dealerDetails,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch {}
    }

    // Save back to local storage
    saveLocalResellers(updatedResellers);
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(updatedMembers));

    // Update active member session if applicable
    try {
      const activeRaw = localStorage.getItem('aurabio_active_session_v1');
      if (activeRaw) {
        const active = JSON.parse(activeRaw);
        if (active && active.uid) {
          const fresh = updatedMembers.find(m => m.uid === active.uid);
          if (fresh) {
            localStorage.setItem('aurabio_active_session_v1', JSON.stringify(fresh));
            window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: fresh }));
          }
        }
      }
    } catch {}

    // Update active reseller session if applicable
    try {
      const activeResRaw = localStorage.getItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY);
      if (activeResRaw) {
        const activeRes = JSON.parse(activeResRaw);
        if (activeRes && activeRes.uid) {
          const freshRes = updatedResellers.find(r => r.uid === activeRes.uid);
          if (freshRes) {
            setActiveResellerSession(freshRes);
          }
        }
      }
    } catch {}

    return { fixedDealersCount, fixedUsersCount };
  } catch (err) {
    console.warn('ensureUniqueReferralCodesForAll notice:', err);
    return { fixedDealersCount: 0, fixedUsersCount: 0 };
  }
}

// Auto-run deduplication audit on module load in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    ensureUniqueReferralCodesForAll().catch(() => {});
  }, 1000);
}

/**
 * Guarantee unique, persistent Reseller profile for a given logged-in Dealer user
 */
export async function getOrCreateResellerForUser(user: UserMember): Promise<Reseller> {
  const userUid = typeof user?.uid === 'string' ? user.uid.trim() : '';
  const userEmail = (user.email || '').trim().toLowerCase();
  const userCode = (user.dealerDetails?.referralCode || user.referralCode || '').trim().toUpperCase();
  const userCompany = (user.dealerDetails?.companyName || user.fullName || '').trim().toLowerCase();
  const fallbackUid = userUid || (userEmail ? `LOCAL-${userEmail.replace(/[^a-z0-9]+/g, '-')}` : '');

  const localResellers = getLocalResellers();
  const serverBalance = userUid ? await getServerCreditsBalance(userUid) : null;
  const localFound = localResellers.find(r =>
    (userUid && r.uid === userUid) ||
    (userEmail && r.email && r.email.toLowerCase() === userEmail) ||
    (userCode && r.referralCode && r.referralCode.toUpperCase() === userCode) ||
    (userCompany && r.resellerName && r.resellerName.trim().toLowerCase() === userCompany)
  );
  if (localFound) {
    const updated = { ...localFound, creditsBalance: serverBalance ?? undefined };
    saveLocalResellers(localResellers.map((reseller) => reseller.uid === localFound.uid ? updated : reseller));
    setActiveResellerSession(updated);
    return updated;
  }

  const all = await getAllResellers();
  
  // 1. Try to find existing reseller by UID or Email
  let found = all.find(r => r.uid === userUid || (userEmail && r.email && r.email.toLowerCase() === userEmail));

  if (found) {
    // Ensure referral code is synchronized with dealerDetails if user has one
    if (user.dealerDetails?.referralCode && found.referralCode !== user.dealerDetails.referralCode) {
      found.referralCode = user.dealerDetails.referralCode;
    }
    const updated = { ...found, creditsBalance: serverBalance ?? undefined };
    setActiveResellerSession(updated);
    return updated;
  }

  // 2. Generate unique referral code for this dealer
  const existingCodes = all.map(r => r.referralCode).filter(Boolean);
  const finalCode = user.dealerDetails?.referralCode?.trim().toUpperCase() 
    || generateUniqueReferralCode('AURA-BAYI', existingCodes);

  const nowIso = new Date().toISOString();

  const newReseller: Reseller = {
    uid: fallbackUid,
    resellerName: user.dealerDetails?.companyName || user.fullName || 'Yetkili Bayi',
    email: (user.email || '').toLowerCase(),
    phone: user.dealerDetails?.whatsapp || user.phone || '05XX XXX XX XX',
    referralCode: finalCode,
    referredByCode: (user.referredByCode || '').trim().toUpperCase(),
    commissionRate: user.dealerDetails?.commissionRate || 20,
    creditsBalance: serverBalance ?? undefined,
    dealerPackageId: user.dealerPackageId || 'pkg-5k',
    bankInfo: {
      bankName: user.dealerDetails?.bankInfo?.bankName || '',
      accountHolder: user.dealerDetails?.bankInfo?.accountHolder || user.fullName,
      iban: user.dealerDetails?.bankInfo?.iban || '',
    },
    status: 'active',
    totalEarnings: 0,
    paidEarnings: 0,
    pendingEarnings: 0,
    totalSalesAmount: 0,
    totalReferredUsers: 0,
    createdAt: user.createdAt || nowIso,
    updatedAt: nowIso,
  };

  // Save to local and Firestore
  const updatedList = [newReseller, ...all.filter(r => r.uid !== user.uid)];
  saveLocalResellers(updatedList);
  setActiveResellerSession(newReseller);

  // Update user dealerDetails if code wasn't saved before
  if (!user.dealerDetails?.referralCode) {
    try {
      const { saveToLocalMembersDirectory } = await import('./authManager');
      const updatedUser: UserMember = {
        ...user,
        role: 'dealer',
        dealerStatus: 'approved',
        dealerDetails: {
          ...(user.dealerDetails || {
            companyName: user.fullName,
            phone: user.phone,
            whatsapp: user.phone,
            businessField: 'Biyo-Rezonans',
            taxNumber: 'Belirtilmedi',
            taxOffice: 'Belirtilmedi',
            address: '',
            notes: ''
          }),
          referralCode: finalCode,
          creditsBalance: newReseller.creditsBalance
        }
      };
      saveToLocalMembersDirectory(updatedUser);
      localStorage.setItem('aurabio_active_session_v1', JSON.stringify(updatedUser));
      
      if (userUid) {
        const userDocRef = doc(db, 'users', userUid);
        await setDoc(userDocRef, { dealerDetails: updatedUser.dealerDetails, role: 'dealer', dealerStatus: 'approved' }, { merge: true });
      }
    } catch (err) {
      console.debug('User dealerDetails sync notice:', err);
    }
  }

  try {
    if (!userUid) {
      console.debug('Firestore create reseller skipped: authenticated user UID is unavailable.');
      return newReseller;
    }
    const docRef = doc(db, 'resellers', userUid);
    await setDoc(docRef, newReseller, { merge: true });
  } catch (fsErr) {
    console.warn('Firestore create reseller notice:', fsErr);
  }

  return newReseller;
}

/**
 * Get all registered members/clients referred by a specific reseller
 */
export async function getReferredUsersForReseller(
  resellerId: string, 
  referralCode?: string
): Promise<UserMember[]> {
  const result: UserMember[] = [];
  const seenUids = new Set<string>();

  try {
    const { getLocalMembersDirectory } = await import('./authManager');
    const allMembers = getLocalMembersDirectory();

    const cleanCode = (referralCode || '').trim().toUpperCase();

    // 1. Check local members
    allMembers.forEach(m => {
      if (m.uid === resellerId) return; // exclude the dealer themselves
      const matchByResellerId = m.resellerId && m.resellerId === resellerId;
      const matchByCode = cleanCode && m.referredByCode && m.referredByCode.toUpperCase() === cleanCode;
      
      if (matchByResellerId || matchByCode) {
        if (!seenUids.has(m.uid)) {
          seenUids.add(m.uid);
          result.push(m);
        }
      }
    });

    // 2. Query Firestore users collection
    try {
      const usersCol = collection(db, 'users');
      const q1 = query(usersCol, where('resellerId', '==', resellerId));
      const snap1 = await getDocs(q1);
      snap1.forEach(docSnap => {
        const u = docSnap.data() as UserMember;
        if (u.uid && u.uid !== resellerId && !seenUids.has(u.uid)) {
          seenUids.add(u.uid);
          result.push(u);
        }
      });

      if (cleanCode) {
        const q2 = query(usersCol, where('referredByCode', '==', cleanCode));
        const snap2 = await getDocs(q2);
        snap2.forEach(docSnap => {
          const u = docSnap.data() as UserMember;
          if (u.uid && u.uid !== resellerId && !seenUids.has(u.uid)) {
            seenUids.add(u.uid);
            result.push(u);
          }
        });
      }
    } catch (fsErr) {
      console.debug('Firestore get referred users notice:', fsErr);
    }
  } catch (err) {
    console.error('Error fetching referred users:', err);
  }

  return result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Get sub-dealers (bayiler) registered under a parent dealer (including recursive downline
 * in their own Monoline single-line tree, while excluding upper sponsors' other dealers).
 */
export async function getSubResellersForReseller(reseller: Reseller): Promise<Reseller[]> {
  const parentUid = reseller?.uid || '';
  const cleanCode = (reseller?.referralCode || '').trim().toUpperCase();
  if (!parentUid && !cleanCode) return [];

  const all = await getAllResellers();
  let localMembers: UserMember[] = [];
  try {
    const { getLocalMembersDirectory } = await import('./authManager');
    localMembers = getLocalMembersDirectory();
  } catch (e) {
    console.debug('Get sub resellers local notice:', e);
  }

  // Build parent-child lookup maps
  const activeUids = new Set<string>(parentUid ? [parentUid] : []);
  const activeCodes = new Set<string>(cleanCode ? [cleanCode] : []);
  const downlineResellers: Reseller[] = [];
  const addedUids = new Set<string>(parentUid ? [parentUid] : []);

  // Sort chronologically (oldest first) for Monoline single-line order
  const chronologicalAll = [...all].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  // Iteratively expand downline tree so sub-dealers of sub-dealers are included in order
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of chronologicalAll) {
      if (!r.uid || addedUids.has(r.uid)) continue;
      const rRefBy = (r.referredByCode || '').trim().toUpperCase();
      const memberDoc = localMembers.find(
        m => m.uid === r.uid || (r.email && m.email && m.email.toLowerCase() === r.email.toLowerCase())
      );
      const mRefBy = (memberDoc?.referredByCode || '').trim().toUpperCase();
      const mSponsorUid = memberDoc?.resellerId || '';

      const isSponsoredByDownline =
        (rRefBy && activeCodes.has(rRefBy)) ||
        (mRefBy && activeCodes.has(mRefBy)) ||
        (mSponsorUid && activeUids.has(mSponsorUid));

      if (isSponsoredByDownline) {
        addedUids.add(r.uid);
        activeUids.add(r.uid);
        if (r.referralCode) {
          activeCodes.add(r.referralCode.trim().toUpperCase());
        }
        downlineResellers.push({
          ...r,
          referredByCode: r.referredByCode || mRefBy || cleanCode,
        });
        changed = true;
      }
    }
  }

  return downlineResellers;
}

/**
 * Record a new user referral directly to the reseller's metrics
 */
export async function recordNewUserReferral(
  resellerId?: string,
  referralCode?: string,
  newUser?: UserMember
): Promise<void> {
  try {
    let targetReseller: Reseller | null = null;
    if (resellerId) {
      targetReseller = await getResellerById(resellerId);
    }
    if (!targetReseller && referralCode) {
      targetReseller = await getResellerByCode(referralCode);
    }

    if (!targetReseller) return;

    targetReseller.totalReferredUsers = (targetReseller.totalReferredUsers || 0) + 1;
    targetReseller.updatedAt = new Date().toISOString();

    const allResellers = getLocalResellers();
    const rIdx = allResellers.findIndex(r => r.uid === targetReseller!.uid);
    if (rIdx >= 0) {
      allResellers[rIdx] = targetReseller;
      saveLocalResellers(allResellers);
    }

    try {
      const docRef = doc(db, 'resellers', targetReseller.uid);
      await setDoc(docRef, { totalReferredUsers: targetReseller.totalReferredUsers, updatedAt: targetReseller.updatedAt }, { merge: true });
    } catch (fsErr) {
      console.debug('Firestore record user referral notice:', fsErr);
    }
  } catch (err) {
    console.debug('Record new user referral notice:', err);
  }
}

/**
 * Register / Create a new Reseller
 */
export async function registerNewReseller(data: {
  customUid?: string;
  resellerName: string;
  email: string;
  phone: string;
  customReferralCode?: string;
  referredByCode?: string;
  sponsorId?: string;
  keepCurrentSession?: boolean;
  deferMonolineSync?: boolean;
  commissionRate?: number;
  initialCredits?: number;
  bankInfo?: Partial<BankInfo>;
  notes?: string;
}): Promise<{ success: boolean; message: string; reseller?: Reseller }> {
  try {
    const cleanName = data.resellerName.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      return { success: false, message: 'Lütfen Bayi Adı, E-posta ve Telefon alanlarını eksiksiz doldurunuz.' };
    }

    const all = await getAllResellers();

    // Check duplicate email
    if (all.some(r => r.email && r.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Bu e-posta adresi ile zaten kayıtlı bir bayi bulunmaktadır.' };
    }

    // Resolve sponsor / referredByCode
    let resolvedSponsor: Reseller | null = null;
    if (data.sponsorId) {
      resolvedSponsor = all.find(r => r.uid === data.sponsorId) || null;
    }
    const rawRefBy = (data.referredByCode || getStoredReferralCode() || '').trim().toUpperCase();
    if (!resolvedSponsor && rawRefBy) {
      resolvedSponsor = all.find(r => r.referralCode && r.referralCode.toUpperCase() === rawRefBy) || null;
    }
    const finalReferredByCode = resolvedSponsor?.referralCode || rawRefBy || undefined;

    // Referral code determination
    let finalCode = (data.customReferralCode || '').trim().toUpperCase();
    if (!finalCode) {
      finalCode = generateUniqueReferralCode();
    } else {
      if (!finalCode.startsWith('AURA-') && !finalCode.startsWith('BAYI-')) {
        finalCode = `AURA-${finalCode}`;
      }
    }

    // Check duplicate code
    if (all.some(r => r.referralCode && r.referralCode.toUpperCase() === finalCode)) {
      finalCode = generateUniqueReferralCode();
    }

    const uid = (data.customUid || '').trim() || ('RESELLER-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    const nowIso = new Date().toISOString();

    const finalInitialCredits =
      typeof data.initialCredits === 'number' && Number.isFinite(data.initialCredits) && data.initialCredits >= 0
        ? Math.round(data.initialCredits)
        : getPackagePurchaseCredits('pkg-5k');

    const newReseller: Reseller = {
      uid,
      resellerName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      referralCode: finalCode,
      referredByCode: finalReferredByCode,
      commissionRate: data.commissionRate !== undefined ? data.commissionRate : 20, // default 20%
      creditsBalance: finalInitialCredits,
      dealerPackageId: 'pkg-5k',
      bankInfo: {
        bankName: data.bankInfo?.bankName || '',
        accountHolder: data.bankInfo?.accountHolder || cleanName,
        iban: data.bankInfo?.iban || '',
      },
      status: 'active',
      totalEarnings: 0,
      paidEarnings: 0,
      pendingEarnings: 0,
      totalSalesAmount: 0,
      totalReferredUsers: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      notes: data.notes || '',
    };

    // Save locally
    const updatedList = [newReseller, ...all];
    saveLocalResellers(updatedList);
    if (!data.keepCurrentSession) {
      setActiveResellerSession(newReseller);
    }

    // Also persist in local members directory so sponsor linkage and sub-dealer queries stay 100% synced
    try {
      const { saveToLocalMembersDirectory } = await import('./authManager');
      const newMemberDoc: UserMember = {
        uid,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: 'dealer',
        dealerStatus: 'approved',
        dealerPackageId: 'pkg-5k',
        creditsBalance: finalInitialCredits,
        isAllowed: true,
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        referralCode: finalCode,
        referredByCode: finalReferredByCode || '',
        resellerId: resolvedSponsor?.uid || data.sponsorId || undefined,
        dealerDetails: {
          companyName: cleanName,
          phone: cleanPhone,
          whatsapp: cleanPhone,
          businessField: 'Biyo-Rezonans & Frekans Merkezi',
          referralCode: finalCode,
          taxNumber: '',
          taxOffice: '',
          commissionRate: newReseller.commissionRate,
          creditsBalance: finalInitialCredits,
          bankInfo: newReseller.bankInfo,
        },
        createdAt: nowIso,
        lastLoginAt: nowIso,
      };
      saveToLocalMembersDirectory(newMemberDoc);
    } catch {}

    if (finalInitialCredits > 0) {
      await recordCreditTransaction({
        resellerId: uid,
        resellerName: cleanName,
        type: 'purchase',
        amount: finalInitialCredits,
        previousBalance: 0,
        newBalance: finalInitialCredits,
        description: `Bayi kaydı için ${finalInitialCredits} paket kredisi tanımlandı.`,
        performedBy: 'Bayi Kaydı',
      });
    }

    // Save to Firestore
    try {
      const docRef = doc(db, 'resellers', uid);
      await setDoc(docRef, newReseller);
    } catch (fsErr) {
      console.warn('Firestore reseller save notice:', fsErr);
    }

    if (!data.deferMonolineSync) {
      try {
        import('./monolineSyncBridge').then(m => {
          m.syncFrekansWithMonolineEngine().then(() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
            }
          });
        }).catch(() => {});
      } catch {}
    }

    return {
      success: true,
      message: `Bayilik kaydınız başarıyla oluşturuldu! Özel Davet Kodunuz: ${finalCode}`,
      reseller: newReseller
    };
  } catch (err: any) {
    console.error('Register reseller error:', err);
    return { success: false, message: err?.message || 'Bayi kaydı sırasında bir hata oluştu.' };
  }
}

/**
 * Update Reseller Bank Information (IBAN, Bank Name, Account Holder)
 */
export async function updateResellerBankInfo(
  resellerId: string,
  bankInfo: BankInfo
): Promise<{ success: boolean; message: string; reseller?: Reseller }> {
  try {
    const all = await getAllResellers();
    const idx = all.findIndex(r => r.uid === resellerId);
    if (idx === -1) {
      return { success: false, message: 'Bayi kaydı bulunamadı.' };
    }

    const updatedReseller: Reseller = {
      ...all[idx],
      bankInfo: {
        bankName: (bankInfo.bankName || '').trim(),
        accountHolder: (bankInfo.accountHolder || '').trim(),
        iban: (bankInfo.iban || '').trim(),
      },
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updatedReseller;
    saveLocalResellers(all);

    const activeSession = getActiveResellerSession();
    if (activeSession && activeSession.uid === resellerId) {
      setActiveResellerSession(updatedReseller);
    }

    // Save to Firestore
    try {
      const docRef = doc(db, 'resellers', resellerId);
      await setDoc(docRef, { bankInfo: updatedReseller.bankInfo, updatedAt: updatedReseller.updatedAt }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore update bank info notice:', fsErr);
    }

    return {
      success: true,
      message: 'Banka ve IBAN hesap bilgileriniz başarıyla güncellendi.',
      reseller: updatedReseller
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Banka bilgileri güncellenirken hata oluştu.' };
  }
}

/**
 * Admin: Save or update full reseller settings (Commission rate, status, etc.)
 */
export async function adminSaveReseller(reseller: Reseller): Promise<boolean> {
  try {
    const resellerUid = typeof reseller?.uid === 'string' ? reseller.uid.trim() : '';
    if (!resellerUid) {
      console.warn('Admin save reseller skipped: reseller UID is unavailable.');
      return false;
    }
    const all = await getAllResellers();
    const idx = all.findIndex(r => r.uid === reseller.uid);
    let updatedList: Reseller[];

    const dataToSave: Reseller = {
      ...reseller,
      updatedAt: new Date().toISOString()
    };

    if (idx >= 0) {
      updatedList = [...all];
      updatedList[idx] = dataToSave;
    } else {
      updatedList = [dataToSave, ...all];
    }

    saveLocalResellers(updatedList);

    try {
      const docRef = doc(db, 'resellers', resellerUid);
      await setDoc(docRef, dataToSave, { merge: true });
    } catch (fsErr) {
      console.warn('Admin save reseller Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin save reseller error:', err);
    return false;
  }
}

/**
 * Admin: Delete Reseller
 */
export async function adminDeleteReseller(resellerId: string): Promise<boolean> {
  try {
    const all = await getAllResellers();
    const target = all.find(r => r.uid === resellerId);
    const updated = all.filter(r => r.uid !== resellerId);
    saveLocalResellers(updated);

    try {
      const docRef = doc(db, 'resellers', resellerId);
      await deleteDoc(docRef);
    } catch (fsErr) {
      console.warn('Admin delete reseller Firestore notice:', fsErr);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
      window.dispatchEvent(new CustomEvent('aurabio_members_updated'));
      window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
      if (target?.referralCode) {
        fetch(`/api/v1/admin/members/${encodeURIComponent(target.referralCode)}`, { method: 'DELETE' }).catch(() => {});
      }
      fetch(`/api/v1/admin/members/${encodeURIComponent(resellerId)}`, { method: 'DELETE' }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error('Admin delete reseller error:', err);
    return false;
  }
}

/**
 * Generate Shareable Referral Link URL
 */
export function generateReferralLink(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `https://akngroupfrekans.web.app/?ref=${encodeURIComponent(referralCode)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?ref=${encodeURIComponent(referralCode)}`;
}

/**
 * 1. Generate Business Presentation Link
 * Opens the interactive presentation catalog with this dealer's code locked
 */
export function generateBusinessPresentationLink(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `https://akngroupfrekans.web.app/?view=presentation&ref=${encodeURIComponent(referralCode)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?view=presentation&ref=${encodeURIComponent(referralCode)}`;
}

/**
 * 2. Generate Technical Report & Scientific Documentation Link
 * Opens the technical biophysical whitepaper and specification report
 */
export function generateTechnicalReportLink(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `https://akngroupfrekans.web.app/?view=technical&ref=${encodeURIComponent(referralCode)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?view=technical&ref=${encodeURIComponent(referralCode)}`;
}

/**
 * 3. Generate Direct Registration Link with Locked Dealer
 * Opens AuthModal directly in registration mode with dealer locked
 */
export function generateRegisterLink(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `https://akngroupfrekans.web.app/?view=register&ref=${encodeURIComponent(referralCode)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?view=register&ref=${encodeURIComponent(referralCode)}`;
}

/**
 * 4. Generate Digital Business Card & QR Code Page Link
 * Opens the personalized digital business card for this dealer
 */
export function generateBusinessCardLink(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `https://akngroupfrekans.web.app/?view=card&ref=${encodeURIComponent(referralCode)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?view=card&ref=${encodeURIComponent(referralCode)}`;
}

/**
 * Generate Comprehensive Bulk Share Text containing all marketing links
 */
export function generateBulkMarketingMessage(
  referralCode: string, 
  resellerName = 'AuraBio Yetkili Bayisi',
  phone = ''
): string {
  const cardLink = generateBusinessCardLink(referralCode);
  const regLink = generateRegisterLink(referralCode);
  const presLink = generateBusinessPresentationLink(referralCode);
  const techLink = generateTechnicalReportLink(referralCode);

  return `🌟 *AuraBio Frekans & Biyo-Rezonans Teknolojileri*
━━━━━━━━━━━━━━━━━━━━
🏢 *Yetkili Bayi / Temsilci:* ${resellerName}
🔑 *Özel Bayi Referans Kodu:* ${referralCode}${phone ? `\n📞 *İletişim / WhatsApp:* ${phone}` : ''}
━━━━━━━━━━━━━━━━━━━━

Aşağıdaki resmi bağlantılar üzerinden canlı frekans sistemini inceleyebilir, demo başlatabilir veya bayiliğimize doğrudan kayıt olabilirsiniz:

🪪 *Dijital Kartvizitim & Karekodum:*
🔗 ${cardLink}

📝 *Doğrudan Üye & Bayi Kayıt Ekranı:*
🔗 ${regLink}

📊 *İş & Ürün Sunum Raporu (Katalog):*
🔗 ${presLink}

🔬 *Teknik Rapor & Frekans Dökümantasyonu:*
🔗 ${techLink}

✨ *30 Dakikalık Ücretsiz Canlı Demoyu Hemen Deneyimleyin!*`;
}

/**
 * Generate WhatsApp Ready Share Link for generic or custom text
 */
export function generateWhatsAppShareUrl(referralCode: string, resellerName = 'AuraBio Bayisi'): string {
  const link = generateReferralLink(referralCode);
  const text = encodeURIComponent(
    `🌟 Merhaba! AuraBio Frekans, Canlı Aura Spektrometresi ve Biyo-Rezonans sistemini benim özel referans bağlantımla hemen deneyimleyin:\n\n🔗 Bağlantı: ${link}\n\n🎁 Özel Davet Kodum: ${referralCode}\n\nSisteme kayıt olarak 30 dakikalık canlı demo veya avantajlı frekans paketlerinden hemen yararlanabilirsiniz.`
  );
  return `https://wa.me/?text=${text}`;
}

/**
 * Generate WhatsApp URL with pre-encoded message
 */
export function generateWhatsAppUrlForMessage(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Generate Telegram Ready Share Link
 */
export function generateTelegramShareUrl(referralCode: string): string {
  const link = generateReferralLink(referralCode);
  const text = encodeURIComponent(`AuraBio Frekans ve Biyo-Rezonans Sistemi Özel Davet Bağlantısı (${referralCode})`);
  return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
}

/**
 * Generate Telegram URL with pre-encoded message
 */
export function generateTelegramUrlForMessage(message: string, url?: string): string {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.origin : '');
  return `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(message)}`;
}

/**
 * Record a Commission when an order is completed by a member
 */
export async function recordCommissionForOrder(
  order: MemberOrder,
  user: UserMember
): Promise<CommissionTransaction | null> {
  try {
    if (!order || order.amount <= 0 || order.paymentStatus === 'DEMO') {
      return null;
    }

    // Determine resellerId from user document or stored referral code
    let targetReseller: Reseller | null = null;
    if (user.resellerId) {
      targetReseller = await getResellerById(user.resellerId);
    }
    if (!targetReseller && user.referredByCode) {
      targetReseller = await getResellerByCode(user.referredByCode);
    }
    if (!targetReseller) {
      const cachedCode = getStoredReferralCode();
      if (cachedCode) {
        targetReseller = await getResellerByCode(cachedCode);
      }
    }

    // If no reseller found, do not record any fictitious commission
    if (!targetReseller) {
      return null;
    }

    const rate = targetReseller.commissionRate || 20;
    const commissionAmount = Math.round((order.amount * rate) / 100);

    const transactionId = `COMM-${Math.floor(10000 + Math.random() * 90000)}`;
    const maskedUser = maskUserId(user.uid);

    const newCommission: CommissionTransaction = {
      transactionId,
      resellerId: targetReseller.uid,
      userId: maskedUser, // Masked for privacy
      orderId: order.id,
      packageName: order.packageName || 'AuraBio Lisans Paketi',
      amount: order.amount,
      commissionRate: rate,
      commissionAmount,
      status: order.paymentStatus === 'PAID' ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      notes: `${order.userName ? 'Üye' : 'Kullanıcı'} siparişi üzerinden %${rate} komisyon`,
    };

    // Save commission
    const allComms = getLocalCommissions();
    saveLocalCommissions([newCommission, ...allComms]);

    // Update reseller balance & stats
    targetReseller.totalSalesAmount = (targetReseller.totalSalesAmount || 0) + order.amount;
    targetReseller.totalEarnings = (targetReseller.totalEarnings || 0) + commissionAmount;
    if (newCommission.status === 'approved') {
      targetReseller.pendingEarnings = (targetReseller.pendingEarnings || 0) + commissionAmount;
    }
    targetReseller.totalReferredUsers = (targetReseller.totalReferredUsers || 0) + 1;
    targetReseller.updatedAt = new Date().toISOString();

    const allResellers = getLocalResellers();
    const rIdx = allResellers.findIndex(r => r.uid === targetReseller!.uid);
    if (rIdx >= 0) {
      allResellers[rIdx] = targetReseller;
      saveLocalResellers(allResellers);
    }

    // Save to Firestore
    try {
      const commDoc = doc(db, 'commissions', transactionId);
      await setDoc(commDoc, newCommission);

      const resDoc = doc(db, 'resellers', targetReseller.uid);
      await setDoc(resDoc, targetReseller, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore commission record notice:', fsErr);
    }

    return newCommission;
  } catch (err) {
    console.error('Record commission error:', err);
    return null;
  }
}

/**
 * Get commissions for a specific reseller (with strict user privacy)
 */
export async function getCommissionsForReseller(resellerId: string): Promise<CommissionTransaction[]> {
  const localList = getLocalCommissions().filter(c => c.resellerId === resellerId);

  try {
    const colRef = collection(db, 'commissions');
    const q = query(colRef, where('resellerId', '==', resellerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const map = new Map<string, CommissionTransaction>();
      snap.forEach(d => {
        const item = d.data() as CommissionTransaction;
        if (item.transactionId) map.set(item.transactionId, item);
      });
      localList.forEach(c => map.set(c.transactionId, c));
      return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
  } catch (err) {
    console.debug('Firestore get commissions notice:', err);
  }

  return localList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Admin: Get all commissions across all resellers
 */
export async function getAllCommissionsAdmin(): Promise<CommissionTransaction[]> {
  const map = new Map<string, CommissionTransaction>();
  getLocalCommissions().forEach(c => map.set(c.transactionId, c));

  try {
    const colRef = collection(db, 'commissions');
    const snap = await getDocs(colRef);
    snap.forEach(d => {
      const item = d.data() as CommissionTransaction;
      if (item.transactionId) map.set(item.transactionId, item);
    });
  } catch (err) {
    console.debug('Admin get all commissions notice:', err);
  }

  const list = Array.from(map.values());
  saveLocalCommissions(list);
  return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Admin: Update commission status (e.g. approve, mark as paid, reject)
 */
export async function adminUpdateCommissionStatus(
  transactionId: string,
  newStatus: 'pending' | 'approved' | 'paid' | 'rejected',
  notes?: string
): Promise<boolean> {
  try {
    const all = await getAllCommissionsAdmin();
    const idx = all.findIndex(c => c.transactionId === transactionId);
    if (idx === -1) return false;

    const comm = all[idx];
    const prevStatus = comm.status;
    comm.status = newStatus;
    if (notes) comm.notes = notes;
    if (newStatus === 'paid') {
      comm.paidAt = new Date().toISOString();
    }

    all[idx] = comm;
    saveLocalCommissions(all);

    // Update reseller balances
    const reseller = await getResellerById(comm.resellerId);
    if (reseller) {
      if (newStatus === 'paid' && prevStatus !== 'paid') {
        reseller.paidEarnings = (reseller.paidEarnings || 0) + comm.commissionAmount;
        reseller.pendingEarnings = Math.max(0, (reseller.pendingEarnings || 0) - comm.commissionAmount);
      } else if (newStatus === 'approved' && prevStatus === 'pending') {
        reseller.pendingEarnings = (reseller.pendingEarnings || 0) + comm.commissionAmount;
      } else if (newStatus === 'rejected' && prevStatus === 'approved') {
        reseller.pendingEarnings = Math.max(0, (reseller.pendingEarnings || 0) - comm.commissionAmount);
      }
      await adminSaveReseller(reseller);
    }

    try {
      const docRef = doc(db, 'commissions', transactionId);
      await setDoc(docRef, comm, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore update commission status notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Update commission status error:', err);
    return false;
  }
}

/**
 * Active Reseller Session helpers
 */
export function getActiveResellerSession(): Reseller | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY);
    if (!raw) return null;
    const res = JSON.parse(raw) as Partial<Reseller>;
    const uid = typeof res.uid === 'string' ? res.uid.trim() : '';
    const email = typeof res.email === 'string' ? res.email.trim().toLowerCase() : '';
    if (!uid && !email) {
      localStorage.removeItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY);
      return null;
    }

    // Keep valid sessions across reloads; legacy IDs are allowed until the canonical
    // Firestore profile has been hydrated instead of forcing an automatic logout.
    const normalized = { ...res, uid: uid || `LOCAL-${email.replace(/[^a-z0-9]+/g, '-')}`, email } as Reseller;
    localStorage.setItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return null;
  }
}

export function setActiveResellerSession(reseller: Reseller | null): void {
  if (typeof window === 'undefined') return;
  try {
    const prevRaw = localStorage.getItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY);
    const nextRaw = reseller ? JSON.stringify(reseller) : null;
    
    // Skip redundant updates to prevent infinite event loops
    if (prevRaw === nextRaw) {
      return;
    }

    if (!reseller) {
      localStorage.removeItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY);
      clearStoredReferralCode();
    } else {
      localStorage.setItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY, nextRaw!);
    }

    // Safely dispatch asynchronously so listener exceptions don't throw uncaught errors
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('aurabio_reseller_session_updated', { detail: reseller }));
      } catch (evtErr) {
        console.debug('aurabio_reseller_session_updated event dispatch notice:', evtErr);
      }
    }, 0);
  } catch (err) {
    console.debug('setActiveResellerSession notice:', err);
  }
}

/**
 * Login as Reseller via Referral Code or Email
 */
export async function loginAsReseller(credential: string): Promise<{ success: boolean; message: string; reseller?: Reseller }> {
  try {
    const clean = credential.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'Lütfen Bayi Kodunuzu veya E-posta adresinizi giriniz.' };
    }

    const all = await getAllResellers();
    const cleanLower = credential.trim().toLowerCase();
    let found = all.find(r => 
      (r.referralCode && r.referralCode.toUpperCase() === clean) || 
      (r.email && r.email.toLowerCase() === cleanLower) ||
      (r.uid && r.uid === credential.trim())
    );

    // If not found in local resellers, check local members directory
    if (!found) {
      const { getLocalMembersDirectory } = await import('./authManager');
      const members = getLocalMembersDirectory();
      const mem = members.find(m =>
        (m.referralCode && m.referralCode.toUpperCase() === clean) ||
        (m.email && m.email.toLowerCase() === cleanLower) ||
        (m.uid && m.uid === credential.trim())
      );
      if (mem) {
        found = await getOrCreateResellerForUser(mem);
      }
    }

    // If still not found, check backend server via /api/v1/members/lookup
    if (!found) {
      try {
        const resp = await fetch(`/api/v1/members/lookup?q=${encodeURIComponent(credential.trim())}`);
        if (resp.ok) {
          const resData = await resp.json();
          if (resData.status === 'success' && resData.member) {
            const m = resData.member;
            const nowIso = new Date().toISOString();
            const synchedReseller: Reseller = {
              uid: m.user_id,
              resellerName: m.full_name,
              fullName: m.full_name,
              email: m.email,
              phone: m.phone || '',
              referralCode: m.ref_code,
              commissionRate: 20,
              status: m.is_locked ? 'suspended' : 'active',
              creditsBalance: undefined,
              totalEarnings: m.wallets?.total_earnings || 0,
              pendingEarnings: 0,
              paidEarnings: m.wallets?.total_withdrawn || 0,
              totalSalesAmount: 0,
              totalReferredUsers: 0,
              createdAt: m.joined_at || nowIso,
              updatedAt: nowIso,
              bankInfo: {
                bankName: m.bank_details?.bank_name || 'Ziraat Bankası',
                accountHolder: m.bank_details?.iban_holder_name || m.full_name,
                iban: m.bank_details?.iban || '',
              },
            };
            await adminSaveReseller(synchedReseller);
            found = synchedReseller;
          }
        }
      } catch (srvErr) {
        console.debug('Backend reseller lookup notice:', srvErr);
      }
    }

    if (!found) {
      return { success: false, message: 'Girilen kod veya e-posta ile eşleşen bir bayi bulunamadı.' };
    }

    if (found.status === 'suspended') {
      return { success: false, message: 'Bu bayi hesabı yönetici tarafından askıya alınmıştır. Lütfen destek ile iletişime geçin.' };
    }

    setActiveResellerSession(found);
    return { success: true, message: `Hoş geldiniz, ${found.resellerName}!`, reseller: found };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Giriş yapılamadı.' };
  }
}

/**
 * Real-time Subscription to Reseller's Profile and Statistics
 */
export function subscribeToReseller(
  resellerId: string,
  onUpdate: (reseller: Reseller | null) => void
): Unsubscribe {
  let active = true;
  const refresh = async () => {
    const reseller = await getResellerById(resellerId);
    if (!active || !reseller) return;
    setActiveResellerSession(reseller);
    onUpdate(reseller);
  };
  void refresh();
  const timer = window.setInterval(() => void refresh(), 15000);
  const handleRefresh = () => void refresh();
  window.addEventListener('aurabio_resellers_updated', handleRefresh);
  window.addEventListener('aurabio_reseller_session_updated', handleRefresh);
  window.addEventListener('aurabio_credits_deducted', handleRefresh);
  return () => {
    active = false;
    window.clearInterval(timer);
    window.removeEventListener('aurabio_resellers_updated', handleRefresh);
    window.removeEventListener('aurabio_reseller_session_updated', handleRefresh);
    window.removeEventListener('aurabio_credits_deducted', handleRefresh);
  };
}
