import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs,
  query,
  onSnapshot,
  where,
  limit,
  Unsubscribe,
  db
} from '../lib/db';
import { DealerPackage } from './resellerManager';
import { BANK_INFO } from './authManager';

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
  try {
    const colRef = collection(db, 'dealer_package_orders');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list: DealerPackageOrder[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as DealerPackageOrder);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveLocalDealerOrders(list);
      return list;
    }
  } catch (err) {
    console.debug('Firestore get dealer package orders fallback:', err);
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
  const matches = (order: DealerPackageOrder) => {
    if (!cleanFilter) return true;
    return [order.resellerId, order.resellerEmail, order.resellerName]
      .some(value => (value || '').trim().toLowerCase() === cleanFilter);
  };
  const emitLocal = () => onUpdate(getLocalDealerOrders().filter(matches));
  emitLocal();

  const handleLocal = () => emitLocal();
  window.addEventListener('storage', handleLocal);
  window.addEventListener('aurabio_dealer_orders_updated', handleLocal);

  try {
    const rawFilter = (resellerFilter || '').trim();
    const source = collection(db, 'dealer_package_orders');
    const orderQuery = cleanFilter
      ? query(source, where('resellerId', '==', rawFilter), limit(100))
      : query(source, limit(500));
    const unsub = onSnapshot(orderQuery, (snapshot) => {
      const list = snapshot.docs.map((docSnap: any) => ({ ...docSnap.data(), id: docSnap.id } as DealerPackageOrder))
        .filter(matches)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(list);
    }, (err) => console.debug('Firestore dealer orders live sync notice:', err));

    return () => {
      window.removeEventListener('storage', handleLocal);
      window.removeEventListener('aurabio_dealer_orders_updated', handleLocal);
      unsub();
    };
  } catch {
    return () => {
      window.removeEventListener('storage', handleLocal);
      window.removeEventListener('aurabio_dealer_orders_updated', handleLocal);
    };
  }
}

/**
 * Reseller creates a package purchase order (Instant Credit Card 3D or Bank Transfer)
 * Also extends the dealer's activity period by the package's activity days
 */
export async function requestDealerPackagePurchase(
  resellerId: string,
  resellerName: string,
  resellerEmail: string,
  resellerPhone: string | undefined,
  pkg: DealerPackage,
  paymentReference?: string,
  paymentMethod: 'bank_transfer' | 'credit_card_3d' | 'usdt_trc20' = 'bank_transfer',
  paymentConfirmation?: { order_id: string; merchant_oid: string; transaction_id: string }
): Promise<{
  success: boolean;
  message: string;
  order?: DealerPackageOrder;
  activityExtended?: boolean;
}> {
  try {
    const orderId = paymentConfirmation?.order_id || `DORD-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();
    const isInstantPayment = paymentMethod === 'credit_card_3d';
    if (isInstantPayment && !paymentConfirmation) {
      return { success: false, message: 'Doğrulanmış Sanal POS ödemesi olmadan sipariş oluşturulamaz.' };
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
      paymentReference:
        paymentReference ||
        (paymentMethod === 'credit_card_3d'
          ? '3D-SECURE-KREDI-KARTI'
          : paymentMethod === 'usdt_trc20'
          ? 'USDT-TRC20-ONAYLI'
          : ''),
      createdAt: nowIso,
      ...(isInstantPayment ? { approvedAt: nowIso } : {}),
    };

    let activityExtended = false;
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

      try {
        const {
          getAllResellers,
          saveLocalResellers,
          getActiveResellerSession,
          setActiveResellerSession,
        } = await import('./resellerManager');
        const resellers = await getAllResellers();
        const cleanEmail = (resellerEmail || '').trim().toLowerCase();
        const rIdx = resellers.findIndex(
          (r) => r.uid === resellerId || (cleanEmail && r.email?.toLowerCase() === cleanEmail)
        );
        if (rIdx >= 0) {
          const reseller = resellers[rIdx];
          const updatedCredits = (Number(reseller.creditsBalance) || 0) + pkg.scanCredits;
          reseller.creditsBalance = updatedCredits;
          reseller.dealerPackageId = pkg.id;
          reseller.status = 'active';
          reseller.updatedAt = nowIso;
          resellers[rIdx] = reseller;
          saveLocalResellers(resellers);
          const activeReseller = getActiveResellerSession();
          if (activeReseller?.uid === reseller.uid) setActiveResellerSession(reseller);
          await setDoc(doc(db, 'resellers', reseller.uid), {
            creditsBalance: updatedCredits,
            dealerPackageId: pkg.id,
            status: 'active',
            updatedAt: nowIso,
          }, { merge: true }).catch(() => {});
        }
      } catch (credErr) {
        console.debug('Instant credit update notice:', credErr);
      }
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
        : `Siparişiniz (${orderId}) başarıyla oluşturuldu (+${pkg.scanCredits} Seans Kredisi).${activityStatusSuffix}`,
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
    const orderIndex = allOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, message: 'Sipariş bulunamadı.' };
    }

    const order = allOrders[orderIndex];
    if (order.status === 'approved') {
      return { success: false, message: 'Bu sipariş daha önce onaylanmıştır.' };
    }

    // 1. Credit Reseller / Dealer
    const { getAllResellers, saveLocalResellers, getActiveResellerSession, setActiveResellerSession, generateUniqueReferralCode } = await import('./resellerManager');
    const resellers = await getAllResellers();
    const cleanEmail = (order.resellerEmail || '').trim().toLowerCase();
    const cleanPhone = (order.resellerPhone || '').replace(/[^0-9]/g, '');
    
    let rIdx = resellers.findIndex(r => 
      (order.resellerId && r.uid === order.resellerId) || 
      (cleanEmail && r.email && r.email.toLowerCase() === cleanEmail) ||
      (cleanPhone && r.phone && r.phone.replace(/[^0-9]/g, '') === cleanPhone)
    );
    
    let updatedCredits = order.scanCredits;

    if (rIdx >= 0) {
      const res = resellers[rIdx];
      const curCredits = typeof res.creditsBalance === 'number' ? res.creditsBalance : 0;
      updatedCredits = curCredits + order.scanCredits;
      res.creditsBalance = updatedCredits;
      res.dealerPackageId = order.packageId;
      res.status = 'active';
      res.updatedAt = new Date().toISOString();
      resellers[rIdx] = res;
      saveLocalResellers(resellers);

      const activeRes = getActiveResellerSession();
      if (activeRes && (activeRes.uid === res.uid || (activeRes.email && activeRes.email.toLowerCase() === cleanEmail))) {
        setActiveResellerSession(res);
      }

      try {
        const docRef = doc(db, 'resellers', res.uid);
        await setDoc(docRef, { 
          creditsBalance: updatedCredits, 
          dealerPackageId: order.packageId,
          status: 'active',
          updatedAt: res.updatedAt 
        }, { merge: true });
      } catch (e) {
        console.debug('Firestore update reseller after approval notice:', e);
      }
    } else {
      // Create new Reseller record if it didn't exist in resellers table
      const newResellerUid = order.resellerId || `RESELLER-${Date.now()}`;
      const newReferralCode = generateUniqueReferralCode();
      const newResellerObj = {
        uid: newResellerUid,
        resellerName: order.resellerName || 'Bayi',
        email: order.resellerEmail || '',
        phone: order.resellerPhone || '',
        referralCode: newReferralCode,
        commissionRate: 20,
        creditsBalance: order.scanCredits,
        dealerPackageId: order.packageId,
        bankInfo: {
          bankName: '',
          accountHolder: order.resellerName || '',
          iban: ''
        },
        status: 'active' as const,
        totalEarnings: 0,
        paidEarnings: 0,
        pendingEarnings: 0,
        totalSalesAmount: 0,
        totalReferredUsers: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: `Paket siparişi (${order.id}) ile otomatik oluşturuldu.`
      };
      resellers.push(newResellerObj);
      saveLocalResellers(resellers);

      try {
        const docRef = doc(db, 'resellers', newResellerUid);
        await setDoc(docRef, newResellerObj, { merge: true });
      } catch (e) {
        console.debug('Firestore create reseller notice:', e);
      }
    }

    // 2. Also credit User Member profile if exists
    const { getActiveMemberSession, fetchMemberProfile, getLocalMembersDirectory, saveToLocalMembersDirectory } = await import('./authManager');
    const localMembers = getLocalMembersDirectory();
    let user = localMembers.find(m => 
      (order.resellerId && m.uid === order.resellerId) ||
      (cleanEmail && m.email && m.email.toLowerCase() === cleanEmail) ||
      (cleanPhone && m.phone && m.phone.replace(/[^0-9]/g, '') === cleanPhone)
    ) || getActiveMemberSession();

    if (!user && order.resellerId) {
      user = await fetchMemberProfile(order.resellerId);
    }

    if (user) {
      const curUserCredits = typeof user.creditsBalance === 'number' ? user.creditsBalance : 0;
      const finalCredits = curUserCredits + order.scanCredits;
      user.creditsBalance = finalCredits;
      user.dealerPackageId = order.packageId;
      user.role = 'dealer';
      user.dealerStatus = 'approved';
      user.isAllowed = true;
      if (user.dealerDetails) {
        user.dealerDetails.creditsBalance = finalCredits;
        user.dealerDetails.companyName = order.resellerName || user.dealerDetails.companyName;
      }

      saveToLocalMembersDirectory(user);
      const activeMember = getActiveMemberSession();
      if (activeMember && activeMember.uid === user.uid) {
        localStorage.setItem('aurabio_active_session_v1', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: user }));
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, {
          creditsBalance: finalCredits,
          dealerPackageId: order.packageId,
          role: 'dealer',
          dealerStatus: 'approved',
          isAllowed: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.debug('Firestore update user after approval notice:', e);
      }
    }

    // 3. Mark order approved
    order.status = 'approved';
    order.approvedAt = new Date().toISOString();
    if (adminNote) order.adminNote = adminNote;

    allOrders[orderIndex] = order;
    saveLocalDealerOrders(allOrders);

    try {
      const docRef = doc(db, 'dealer_package_orders', orderId);
      await setDoc(docRef, order, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore approve dealer order notice:', fsErr);
    }

    // 4. Auto-generate official Digital E-Invoice for this dealer order
    try {
      const { createInvoiceForDealerOrder } = await import('./invoiceManager');
      await createInvoiceForDealerOrder(order, rIdx >= 0 ? resellers[rIdx] : undefined);
    } catch (invErr) {
      console.debug('Auto invoice generation notice:', invErr);
    }

    // 5. Ensure Monoline Commission Engine Webhook is synced for approved order
    try {
      await fetch('/api/v1/integrations/order-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: order.resellerId,
          reseller_name: order.resellerName,
          reseller_email: order.resellerEmail,
          order_id: order.id,
          order_amount: order.price,
          package_id: order.packageId,
          timestamp: order.approvedAt || new Date().toISOString(),
        }),
      });
      const { syncFrekansWithMonolineEngine } = await import('./monolineSyncBridge');
      await syncFrekansWithMonolineEngine();
      window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
    } catch (whErr) {
      console.debug('Monoline webhook approval sync notice:', whErr);
    }

    // Broadcast globally
    window.dispatchEvent(new CustomEvent('aurabio_reseller_session_updated'));
    window.dispatchEvent(new CustomEvent('aurabio_dealer_orders_updated'));
    window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
    window.dispatchEvent(new CustomEvent('aurabio_invoices_updated'));

    return {
      success: true,
      message: `Sipariş onaylandı! ${order.resellerName} bayisine +${order.scanCredits} seans kredisi başarıyla yüklendi. (Yeni Kredi Bakiyesi: ${updatedCredits})`,
      newTotalCredits: updatedCredits
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
    const allOrders = await getAllDealerPackageOrders();
    const orderIndex = allOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, message: 'Sipariş bulunamadı.' };
    }

    const order = allOrders[orderIndex];
    order.status = 'rejected';
    order.rejectedAt = new Date().toISOString();
    if (adminNote) order.adminNote = adminNote;

    allOrders[orderIndex] = order;
    saveLocalDealerOrders(allOrders);

    try {
      const docRef = doc(db, 'dealer_package_orders', orderId);
      await setDoc(docRef, order, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore reject dealer order notice:', fsErr);
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
