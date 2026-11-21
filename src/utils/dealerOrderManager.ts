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

/**
 * Reseller completes a package purchase with a verified 3D Secure card payment.
 */
export async function requestDealerPackagePurchase(
  resellerId: string,
  resellerName: string,
  resellerEmail: string,
  resellerPhone: string | undefined,
  pkg: DealerPackage,
  paymentReference: string,
  paymentConfirmation: { order_id: string; merchant_oid: string; transaction_id: string }
): Promise<{
  success: boolean;
  message: string;
  order?: DealerPackageOrder;
  activityExtended?: boolean;
}> {
  try {
    const orderId = paymentConfirmation.order_id;
    const nowIso = new Date().toISOString();

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
      status: 'approved',
      paymentMethod: 'credit_card_3d',
      paymentReference,
      createdAt: nowIso,
      approvedAt: nowIso,
    };

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
        timestamp: nowIso,
      }),
    });
    const whData = await whRes.json().catch(() => ({}));
    if (!whRes.ok || !whData?.transaction) {
      return {
        success: false,
        message: whData?.message || 'Ödeme doğrulandı ancak sipariş sunucuda tamamlanamadı. İşlem numarasıyla destek ekibine başvurun.',
      };
    }
    const activityExtended = Boolean(whData.transaction.activity_extended);
    newOrder.activityExtended = activityExtended;
    const { syncFrekansWithMonolineEngine } = await import('./monolineSyncBridge');
    await syncFrekansWithMonolineEngine();
    window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));

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
      message: `Ödemeniz onaylandı (${orderId})! +${pkg.scanCredits} Seans Kredisi bayi hesabınıza anında yüklendi.${activityStatusSuffix}`,
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
