import { doc, setDoc, Unsubscribe, db } from '../lib/db';
import type { DealerPackage } from '../config/dealerPackages';

export interface DealerPackageOrder {
  id: string;
  resellerId: string;
  resellerName: string;
  resellerEmail: string;
  resellerPhone?: string;
  packageId: string;
  packageName: string;
  scanCredits: number;
  price: number;
  priceText: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: 'bank_transfer' | 'credit_card_3d' | 'usdt_trc20' | 'manual';
  paymentReference?: string;
  activityExtended?: boolean;
  adminNote?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

const STORAGE_DEALER_ORDERS_KEY = 'aurabio_dealer_package_orders_v1';

export function getLocalDealerOrders(): DealerPackageOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_DEALER_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalDealerOrders(orders: DealerPackageOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_DEALER_ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('aurabio_dealer_orders_updated'));
  } catch (e) {
    console.warn('Save local dealer orders error:', e);
  }
}

/**
 * Fetch all dealer package purchase requests
 */
export async function getAllDealerPackageOrders(): Promise<DealerPackageOrder[]> {
  const { getAdminToken } = await import('./adminSession');
  const token = getAdminToken();
  if (token) {
    try {
      const response = await fetch('/api/v1/admin/dealer-package-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== 'success') return [];
      const orders: DealerPackageOrder[] = (data.orders || []).map((order: any) => ({
        id: order.order_id,
        resellerId: order.reseller_id,
        resellerName: order.reseller_name || order.reseller_id,
        resellerEmail: order.reseller_email || '',
        resellerPhone: order.reseller_phone || '',
        packageId: order.package_id,
        packageName: order.package_name,
        scanCredits: Number(order.scan_credits) || 0,
        price: Number(order.amount) || 0,
        priceText: `${Number(order.amount || 0).toLocaleString('tr-TR')} $`,
        status: String(order.status || 'PENDING').toLowerCase() as DealerPackageOrder['status'],
        paymentMethod: 'bank_transfer',
        paymentReference: order.payment_reference || '',
        adminNote: order.admin_note || undefined,
        createdAt: order.created_at,
        approvedAt: order.approved_at || undefined,
      }));
      saveLocalDealerOrders(orders);
      return orders;
    } catch {
      return [];
    }
  }
  return getLocalDealerOrders();
}

/**
 * Real-time listener for dealer package purchase orders
 */
export function subscribeToDealerPackageOrders(
  onUpdate: (orders: DealerPackageOrder[]) => void,
  resellerFilter?: string
): Unsubscribe {
  const cleanFilter = (resellerFilter || '').trim().toLowerCase();
  let active = true;
  let refreshing = false;
  const refreshServerOrders = async () => {
    if (refreshing) return;
    refreshing = true;
    const orders = await getAllDealerPackageOrders();
    if (active) onUpdate(orders.filter((order) => {
      if (!cleanFilter) return true;
      return [order.resellerId, order.resellerEmail, order.resellerName]
        .some((value) => (value || '').trim().toLowerCase() === cleanFilter);
    }));
    refreshing = false;
  };
  const matches = (order: DealerPackageOrder) => {
    if (!cleanFilter) return true;
    return [order.resellerId, order.resellerEmail, order.resellerName]
      .some(value => (value || '').trim().toLowerCase() === cleanFilter);
  };
  const emitLocal = () => onUpdate(getLocalDealerOrders().filter(matches));
  void refreshServerOrders();
  const timer = window.setInterval(() => void refreshServerOrders(), 15000);

  const handleLocal = () => emitLocal();
  window.addEventListener('storage', handleLocal);
  window.addEventListener('aurabio_dealer_orders_updated', handleLocal);

  return () => {
    active = false;
    window.clearInterval(timer);
    window.removeEventListener('storage', handleLocal);
    window.removeEventListener('aurabio_dealer_orders_updated', handleLocal);
  };
}

const DEALER_ORDER_MAX_ATTEMPTS = 3;

async function postDealerOrderWithRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.status < 500 || attempt === DEALER_ORDER_MAX_ATTEMPTS) return response;
    } catch (error) {
      if (attempt === DEALER_ORDER_MAX_ATTEMPTS) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
}

/**
 * Reseller creates a package purchase order through the supported server payment flows.
 */
export async function requestDealerPackagePurchase(
  resellerId: string,
  resellerName: string,
  resellerEmail: string,
  resellerPhone: string | undefined,
  pkg: DealerPackage,
  paymentReference?: string,
  paymentMethod: 'bank_transfer' | 'credit_card_3d' | 'usdt_trc20' = 'bank_transfer',
  paymentConfirmation?: { order_id: string; merchant_oid: string; transaction_id: string },
  requestedOrderId?: string
): Promise<{
  success: boolean;
  message: string;
  order?: DealerPackageOrder;
  activityExtended?: boolean;
}> {
  try {
    const orderId = paymentConfirmation?.order_id || requestedOrderId || `DORD-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();
    const isInstantPayment = paymentMethod === 'credit_card_3d';
    if (isInstantPayment && !paymentConfirmation) {
      return { success: false, message: 'Doğrulanmış Sanal POS ödemesi olmadan sipariş oluşturulamaz.' };
    }
    if (!isInstantPayment && paymentMethod !== 'bank_transfer') {
      return { success: false, message: 'Bu ödeme yöntemi için sunucu onaylı sipariş akışı bulunmuyor.' };
    }

    const newOrder: DealerPackageOrder = {
      id: orderId,
      resellerId,
      resellerName,
      resellerEmail,
      resellerPhone: resellerPhone || '',
      packageId: pkg.id,
      packageName: pkg.name,
      scanCredits: pkg.scanCredits,
      price: pkg.price,
      priceText: pkg.priceText || `${pkg.price.toLocaleString('tr-TR')} $`,
      status: isInstantPayment ? 'approved' : 'pending',
      paymentMethod,
      paymentReference: paymentReference || (isInstantPayment ? '3D-SECURE-KREDI-KARTI' : ''),
      createdAt: nowIso,
      ...(isInstantPayment ? { approvedAt: nowIso } : {}),
    };

    let activityExtended = false;
    if (!isInstantPayment && paymentMethod === 'bank_transfer') {
      const [{ getAdminToken }, { getMemberWalletToken }] = await Promise.all([
        import('./adminSession'),
        import('./authManager'),
      ]);
      const token = getAdminToken() || getMemberWalletToken();
      if (!token) return { success: false, message: 'Bayi oturumu sunucuda doğrulanamadı.' };
      const response = await postDealerOrderWithRetry(`/api/v1/members/${encodeURIComponent(resellerId)}/dealer-package-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          order_id: orderId,
          package_id: pkg.id,
          payment_reference: paymentReference || '',
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status !== 'success' || !result.order) {
        return { success: false, message: result.message || 'Havale siparişi sunucuya kaydedilemedi.' };
      }
      newOrder.scanCredits = Number(result.order.scan_credits) || pkg.scanCredits;
      newOrder.price = Number(result.order.amount) || pkg.price;
      newOrder.packageName = result.order.package_name || pkg.name;
      newOrder.status = String(result.order.status || 'PENDING').toLowerCase() as DealerPackageOrder['status'];
    }

    if (isInstantPayment && paymentConfirmation) {
      const whRes = await fetch('/api/v1/integrations/order-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: resellerId,
          reseller_name: resellerName,
          reseller_email: resellerEmail,
          order_id: orderId,
          order_amount: pkg.price,
          package_id: pkg.id,
          payment_method: 'CREDIT_CARD_3D',
          merchant_oid: paymentConfirmation.merchant_oid,
          transaction_id: paymentConfirmation.transaction_id,
          timestamp: newOrder.createdAt,
        }),
      });
      const whData = await whRes.json().catch(() => ({}));
      if (!whRes.ok || !whData?.transaction) {
        return {
          success: false,
          message: whData?.message || 'Ödeme doğrulandı ancak sipariş sunucuda tamamlanamadı. İşlem numarasıyla destek ekibine başvurun.',
        };
      }
      activityExtended = Boolean(whData.transaction.activity_extended);
      newOrder.activityExtended = activityExtended;
      const { syncFrekansWithMonolineEngine } = await import('./monolineSyncBridge');
      await syncFrekansWithMonolineEngine();
      window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
    }

    const currentOrders = getLocalDealerOrders();
    saveLocalDealerOrders([newOrder, ...currentOrders.filter((o) => o.id !== orderId)]);
    try {
      const docRef = doc(db, 'dealer_package_orders', orderId);
      await setDoc(docRef, newOrder);
    } catch (fsErr) {
      console.warn('Firestore create dealer package order notice:', fsErr);
    }

    window.dispatchEvent(new CustomEvent('aurabio_reseller_session_updated'));
    window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));

    const activityStatusSuffix = activityExtended ? ' ✅ Aktiflik süreniz uzatıldı.' : '';

    return {
      success: true,
      activityExtended,
      message: isInstantPayment
        ? `Ödemeniz onaylandı (${orderId})! +${pkg.scanCredits} Seans Kredisi bayi hesabınıza anında yüklendi.${activityStatusSuffix}`
        : `Havale siparişiniz (${orderId}) oluşturuldu. Krediler yönetici onayından sonra yüklenecektir.`,
      order: newOrder,
    };
  } catch (err: any) {
    console.error('Request dealer package purchase error:', err);
    return {
      success: false,
      message: err?.message || 'Sipariş oluşturulurken bir hata oluştu.'
    };
  }
}

/**
 * Admin approves dealer package order -> ACTUALLY ADDS CREDITS TO DEALER / RESELLER
 */
export async function adminApproveDealerPackageOrder(
  orderId: string,
  adminNote?: string
): Promise<{ success: boolean; message: string; newTotalCredits?: number }> {
  try {
    const allOrders = await getAllDealerPackageOrders();
    const orderIndex = allOrders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return { success: false, message: 'Sipariş bulunamadı.' };

    const order = allOrders[orderIndex];
    const { getAdminToken } = await import('./adminSession');
    const token = getAdminToken();
    if (!token) return { success: false, message: 'Yönetici oturumu sona erdi. Yeniden giriş yapın.' };

    const response = await fetch(`/api/v1/admin/dealer-package-orders/${encodeURIComponent(orderId)}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ admin_note: adminNote }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.status !== 'success' || typeof result.remainingCredits !== 'number') {
      return { success: false, message: result.message || 'Sipariş sunucuda onaylanamadı.' };
    }

    order.status = 'approved';
    order.approvedAt = result.order?.approved_at || new Date().toISOString();
    if (adminNote) order.adminNote = adminNote;
    allOrders[orderIndex] = order;
    saveLocalDealerOrders(allOrders);

    const { getLocalResellers, getActiveResellerSession, setActiveResellerSession, saveLocalResellers } = await import('./resellerManager');
    const resellers = getLocalResellers();
    const reseller = resellers.find((item) => item.uid === order.resellerId);
    if (reseller) {
      const updated = { ...reseller, creditsBalance: undefined, dealerPackageId: order.packageId, status: 'active' as const };
      saveLocalResellers(resellers.map((item) => item.uid === reseller.uid ? updated : item));
      if (getActiveResellerSession()?.uid === reseller.uid) setActiveResellerSession(updated);
    }

    const { getActiveMemberSession, getLocalMembersDirectory, saveToLocalMembersDirectory } = await import('./authManager');
    const user = getLocalMembersDirectory().find((item) => item.uid === order.resellerId);
    if (user) {
      const updated = {
        ...user,
        creditsBalance: undefined,
        dealerPackageId: order.packageId,
        role: 'dealer' as const,
        dealerStatus: 'approved' as const,
        isAllowed: true,
        dealerDetails: user.dealerDetails ? { ...user.dealerDetails, creditsBalance: undefined } : user.dealerDetails,
      };
      saveToLocalMembersDirectory(updated);
      if (getActiveMemberSession()?.uid === updated.uid) {
        localStorage.setItem('aurabio_active_session_v1', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updated }));
      }
    }

    window.dispatchEvent(new CustomEvent('aurabio_reseller_session_updated'));
    window.dispatchEvent(new CustomEvent('aurabio_dealer_orders_updated'));
    window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
    window.dispatchEvent(new CustomEvent('aurabio_invoices_updated'));

    return {
      success: true,
      message: `Sipariş onaylandı. Yeni kredi bakiyesi: ${result.remainingCredits}`,
      newTotalCredits: result.remainingCredits,
    };
  } catch (err: any) {
    console.error('Admin approve dealer order error:', err);
    return { success: false, message: err?.message || 'Sipariş onaylanırken hata oluştu.' };
  }
}

/**
 * Admin rejects dealer package order
 */
export async function adminRejectDealerPackageOrder(
  orderId: string,
  adminNote?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { getAdminToken } = await import('./adminSession');
    const token = getAdminToken();
    if (!token) return { success: false, message: 'Yönetici oturumu sona erdi. Yeniden giriş yapın.' };
    const response = await fetch(`/api/v1/admin/dealer-package-orders/${encodeURIComponent(orderId)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ admin_note: adminNote }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.status !== 'success') {
      return { success: false, message: result.message || 'Sipariş sunucuda reddedilemedi.' };
    }
    const allOrders = await getAllDealerPackageOrders();
    const orderIndex = allOrders.findIndex((order) => order.id === orderId);
    if (orderIndex >= 0) {
      allOrders[orderIndex] = {
        ...allOrders[orderIndex],
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        adminNote,
      };
      saveLocalDealerOrders(allOrders);
    }

    window.dispatchEvent(new CustomEvent('aurabio_dealer_orders_updated'));

    return {
      success: true,
      message: `Sipariş (#${orderId}) reddedildi.`
    };
  } catch (err: any) {
    console.error('Admin reject dealer order error:', err);
    return { success: false, message: err?.message || 'Sipariş reddedilirken hata oluştu.' };
  }
}
