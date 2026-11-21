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
  status: 'approved';
  paymentMethod: 'credit_card_3d' | 'wallet_balance';
  paymentReference?: string;
  activityExtended?: boolean;
  createdAt: string;
  approvedAt?: string;
}

const STORAGE_DEALER_ORDERS_KEY = 'aurabio_dealer_package_orders_v1';

const isConfirmedDealerOrder = (order: unknown): order is DealerPackageOrder => {
  if (!order || typeof order !== 'object') return false;
  const candidate = order as DealerPackageOrder;
  return candidate.status === 'approved' &&
    (candidate.paymentMethod === 'credit_card_3d' || candidate.paymentMethod === 'wallet_balance');
};

export function getLocalDealerOrders(): DealerPackageOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_DEALER_ORDERS_KEY);
    if (!raw) return [];
    const orders: unknown = JSON.parse(raw);
    return Array.isArray(orders) ? orders.filter(isConfirmedDealerOrder) : [];
  } catch {
    return [];
  }
}

export function saveLocalDealerOrders(orders: DealerPackageOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_DEALER_ORDERS_KEY);
    const stored: unknown = raw ? JSON.parse(raw) : [];
    const legacyOrders = Array.isArray(stored) ? stored.filter((order) => !isConfirmedDealerOrder(order)) : [];
    localStorage.setItem(
      STORAGE_DEALER_ORDERS_KEY,
      JSON.stringify([...orders.filter(isConfirmedDealerOrder), ...legacyOrders])
    );
    window.dispatchEvent(new CustomEvent('aurabio_dealer_orders_updated'));
  } catch (e) {
    console.warn('Save local dealer orders error:', e);
  }
}

export function subscribeToDealerPackageOrders(
  onUpdate: (orders: DealerPackageOrder[]) => void,
  resellerFilter?: string
): Unsubscribe {
  const filter = (resellerFilter || '').trim().toLowerCase();
  const emit = () => onUpdate(getLocalDealerOrders().filter((order) =>
    !filter || [order.resellerId, order.resellerEmail, order.resellerName]
      .some((value) => (value || '').trim().toLowerCase() === filter)
  ));
  emit();
  window.addEventListener('storage', emit);
  window.addEventListener('aurabio_dealer_orders_updated', emit);
  return () => {
    window.removeEventListener('storage', emit);
    window.removeEventListener('aurabio_dealer_orders_updated', emit);
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
