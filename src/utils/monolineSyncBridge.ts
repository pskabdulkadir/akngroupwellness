import { collection, doc, getDocs, setDoc, db } from '../lib/db';
import {
  getMemberRegionalPendingUsd,
  getMemberRegionalUsdBalance,
  getPackagePriceForRegion,
  resolveMemberRegion,
} from './walletRegion';
import {
  CommissionTransaction as MonolineCommissionTx,
  MonolineMember,
  OrderCommissionPayload,
  PACKAGES,
  PackageId,
  SystemStateResponse,
} from '../types/monoline';
import {
  DEFAULT_MEMBERSHIP_PACKAGES,
  MemberOrder,
  UserMember,
  adminGetAllMembers,
  getActiveMemberSession,
  saveToLocalMembersDirectory,
} from './authManager';
import {
  DealerPackageOrder,
  getLocalDealerOrders,
  saveLocalDealerOrders,
} from './dealerOrderManager';
import {
  CommissionTransaction as FrekansCommissionTx,
  Reseller,
  getActiveResellerSession,
  getAllResellers,
  getLocalCommissions,
  getLocalResellers,
  saveLocalCommissions,
  saveLocalResellers,
  setActiveResellerSession,
  setStoredReferralCode,
  clearStoredReferralCode,
} from './resellerManager';

const LEGACY_DEMO_USER_IDS = new Set([
  'USR-1001',
  'USR-1002',
  'USR-1003',
  'USR-1004',
  'USR-1005',
  'USR-1006',
  'USR-1007',
  'USR-1008',
  'USR-1009',
  'USR-1010',
  'USR-1011',
  'USR-1012',
  'RESELLER-MERKEZ-01',
  'RESELLER-DOGAL-02',
  'RESELLER-AKADEMI-03',
  'RESELLER-ANADOLU-04',
]);

const LEGACY_DEMO_EMAILS = new Set([
  'ahmet.kaya@aknfrekans.com.tr',
  'zeynep.demir@aknfrekans.com.tr',
  'mustafa.arslan@aknfrekans.com.tr',
  'elif.celik@aknfrekans.com.tr',
  'omer.yildirim@aknfrekans.com.tr',
  'rabia.sahin@aknfrekans.com.tr',
  'burak.ozkan@aknfrekans.com.tr',
  'merve.aydin@aknfrekans.com.tr',
  'hakan.koc@aknfrekans.com.tr',
  'aylin.korkmaz@aknfrekans.com.tr',
  'furkan.polat@aknfrekans.com.tr',
  'selinay.aksoy@aknfrekans.com.tr',
]);

export function mapMonolinePkgToFrekansPkgId(monolinePkgId: string): string {
  const map: Record<string, string> = {
    PKG_MINI_DENEME: 'pkg-5k',
    PKG_BRONZ_BASLANGIC: 'pkg-10k',
    PKG_GUMUS_STANDART: 'pkg-15k',
    PKG_GUMUS_PLUS: 'pkg-20k',
    PKG_ALTIN_DANISMAN: 'pkg-25k',
    PKG_ALTIN_PRO: 'pkg-30k',
    PKG_PLATIN_KLINIK: 'pkg-50k',
    PKG_SAFIR_KURUMSAL: 'pkg-60k',
    PKG_ZUMRUT_MASTER: 'pkg-70k',
    PKG_YAKUT_ELIT: 'pkg-80k',
    PKG_TITANYUM_ENTEGRE: 'pkg-90k',
    PKG_ELMAS_BOLGE: 'pkg-100k',
    PKG_MASTER_FRANCHISE: 'pkg-200k',
    PKG_ENTERPRISE_MEGA: 'pkg-300k',
  };
  return map[monolinePkgId] || monolinePkgId || 'pkg-30k';
}

export function mapFrekansPkgToMonolinePkgId(
  frekansPkgId?: string,
  price?: number
): Exclude<PackageId, 'CUSTOM'> {
  const clean = (frekansPkgId || '').trim().toLowerCase();
  const directMap: Record<string, Exclude<PackageId, 'CUSTOM'>> = {
    'pkg-5k': 'PKG_MINI_DENEME',
    'pkg-10k': 'PKG_BRONZ_BASLANGIC',
    'bronze-dealer': 'PKG_BRONZ_BASLANGIC',
    'pkg-15k': 'PKG_GUMUS_STANDART',
    'silver-dealer': 'PKG_GUMUS_STANDART',
    'pkg-20k': 'PKG_GUMUS_PLUS',
    'pkg-25k': 'PKG_ALTIN_DANISMAN',
    'pkg-30k': 'PKG_ALTIN_PRO',
    'gold-dealer': 'PKG_ALTIN_PRO',
    'pkg-50k': 'PKG_PLATIN_KLINIK',
    'platinum-dealer': 'PKG_PLATIN_KLINIK',
    'pkg-60k': 'PKG_SAFIR_KURUMSAL',
    'pkg-70k': 'PKG_ZUMRUT_MASTER',
    'pkg-80k': 'PKG_YAKUT_ELIT',
    'pkg-90k': 'PKG_TITANYUM_ENTEGRE',
    'pkg-100k': 'PKG_ELMAS_BOLGE',
    'diamond-dealer': 'PKG_ELMAS_BOLGE',
    'pkg-200k': 'PKG_MASTER_FRANCHISE',
    'pkg-300k': 'PKG_ENTERPRISE_MEGA',
  };

  if (clean in directMap) {
    return directMap[clean];
  }

  const upper = (frekansPkgId || '').trim().toUpperCase();
  if (upper in PACKAGES) {
    return upper as Exclude<PackageId, 'CUSTOM'>;
  }

  if (typeof price === 'number' && price > 0) {
    if (price >= 280000) return 'PKG_ENTERPRISE_MEGA';
    if (price >= 180000) return 'PKG_MASTER_FRANCHISE';
    if (price >= 95000) return 'PKG_ELMAS_BOLGE';
    if (price >= 85000) return 'PKG_TITANYUM_ENTEGRE';
    if (price >= 75000) return 'PKG_YAKUT_ELIT';
    if (price >= 65000) return 'PKG_ZUMRUT_MASTER';
    if (price >= 55000) return 'PKG_SAFIR_KURUMSAL';
    if (price >= 45000) return 'PKG_PLATIN_KLINIK';
    if (price >= 28000) return 'PKG_ALTIN_PRO';
    if (price >= 22000) return 'PKG_ALTIN_DANISMAN';
    if (price >= 18000) return 'PKG_GUMUS_PLUS';
    if (price >= 13000) return 'PKG_GUMUS_STANDART';
    if (price >= 8000) return 'PKG_BRONZ_BASLANGIC';
  }

  return 'PKG_MINI_DENEME';
}

async function fetchAllFrekansMemberOrders(): Promise<MemberOrder[]> {
  const orderMap = new Map<string, MemberOrder>();

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('aurabio_member_orders_history_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((o: MemberOrder) => {
            if (o && o.id && o.paymentStatus !== 'DEMO' && o.amount > 0) {
              orderMap.set(o.id, o);
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const colRef = collection(db, 'orders');
    const snap = await getDocs(colRef);
    snap.forEach((d) => {
      const data = { ...d.data(), id: d.id } as MemberOrder;
      if (data && data.id && data.paymentStatus !== 'DEMO' && Number(data.amount) > 0) {
        orderMap.set(data.id, data);
      }
    });
  } catch {
    // offline fallback
  }

  return Array.from(orderMap.values());
}

let inFlightSync: Promise<SystemStateResponse | null> | null = null;

/**
 * Synchronizes all real members, dealers, and purchases from the Frekans application
 * (Firestore + LocalStorage) with the Monoline 7 Nefis Mertebesi MLM & Commission Engine,
 * and writes back calculated careers & commissions to Frekans records.
 */
export async function syncFrekansWithMonolineEngine(options?: {
  resetBeforeSync?: boolean;
}): Promise<SystemStateResponse | null> {
  if (inFlightSync && !options?.resetBeforeSync) {
    return inFlightSync;
  }

  const runSync = async (): Promise<SystemStateResponse | null> => {
    try {
      const [allUsers, allResellers, memberOrders] = await Promise.all([
        adminGetAllMembers(),
        getAllResellers(),
        fetchAllFrekansMemberOrders(),
      ]);

      const activeMember = getActiveMemberSession();
      const activeReseller = getActiveResellerSession();

      // 1. Unify all real users and resellers from the Frekans app (excluding any legacy demo records)
      const unifiedMembersMap = new Map<
        string,
        {
          uid: string;
          fullName: string;
          email: string;
          phone: string;
          city: string;
          referralCode: string;
          referredByCode: string;
          resellerId: string;
          packageId: Exclude<PackageId, 'CUSTOM'>;
          createdAt: string;
          isAllowed: boolean;
          isDealer: boolean;
          countryCode: string;
          taxId: string;
          hasTaxCompany: boolean;
          bankName: string;
          ibanHolder: string;
          iban: string;
        }
      >();

      const emailToUidMap = new Map<string, string>();

      const upsertPerson = (person: {
        uid: string;
        fullName: string;
        email: string;
        phone: string;
        city?: string;
        referralCode?: string;
        referredByCode?: string;
        resellerId?: string;
        packageRaw?: string;
        createdAt?: string;
        isAllowed?: boolean;
        isDealer?: boolean;
        countryCode?: string;
        taxId?: string;
        hasTaxCompany?: boolean;
        bankName?: string;
        ibanHolder?: string;
        iban?: string;
      }) => {
        const cleanUid = (person.uid || '').trim();
        const cleanEmail = (person.email || '').trim().toLowerCase();
        if (!cleanUid) return;
        if (LEGACY_DEMO_USER_IDS.has(cleanUid)) return;
        if (cleanEmail && LEGACY_DEMO_EMAILS.has(cleanEmail)) return;

        const canonicalUid =
          cleanEmail && emailToUidMap.has(cleanEmail)
            ? emailToUidMap.get(cleanEmail)!
            : cleanUid;

        if (cleanEmail) {
          emailToUidMap.set(cleanEmail, canonicalUid);
        }

        const existing = unifiedMembersMap.get(canonicalUid);
        const mappedPkg = mapFrekansPkgToMonolinePkgId(person.packageRaw);

        if (existing) {
          unifiedMembersMap.set(canonicalUid, {
            ...existing,
            fullName: person.fullName || existing.fullName,
            email: cleanEmail || existing.email,
            phone: person.phone || existing.phone,
            city: person.city || existing.city,
            referralCode: person.referralCode || existing.referralCode,
            referredByCode: person.referredByCode || existing.referredByCode,
            resellerId: person.resellerId || existing.resellerId,
            packageId: person.packageRaw ? mappedPkg : existing.packageId,
            isDealer: Boolean(person.isDealer || existing.isDealer),
            countryCode: person.countryCode || existing.countryCode,
            taxId: person.taxId || existing.taxId,
            hasTaxCompany: Boolean(person.hasTaxCompany || existing.hasTaxCompany),
            bankName: person.bankName || existing.bankName,
            ibanHolder: person.ibanHolder || existing.ibanHolder,
            iban: person.iban || existing.iban,
          });
        } else {
          unifiedMembersMap.set(canonicalUid, {
            uid: canonicalUid,
            fullName: person.fullName || 'Frekans Bayi',
            email: cleanEmail,
            phone: person.phone || '',
            city: person.city || 'Türkiye',
            referralCode:
              (person.referralCode || '').trim().toUpperCase() ||
              `AURA-${canonicalUid.replace(/[^A-Z0-9]/gi, '').slice(-5).toUpperCase()}`,
            referredByCode: (person.referredByCode || '').trim().toUpperCase(),
            resellerId: (person.resellerId || '').trim(),
            packageId: mappedPkg,
            createdAt: person.createdAt || new Date().toISOString(),
            isAllowed: person.isAllowed !== false,
            isDealer: Boolean(person.isDealer),
            countryCode: person.countryCode || 'TR',
            taxId: person.taxId || '',
            hasTaxCompany: Boolean(person.hasTaxCompany),
            bankName: person.bankName || '',
            ibanHolder: person.ibanHolder || person.fullName || '',
            iban: person.iban || '',
          });
        }
      };

      allUsers.forEach((u: UserMember) => {
        if (u.selectedPackage === 'demo-30m' && u.paymentStatus === 'DEMO' && u.role !== 'dealer' && u.role !== 'admin') {
          // Still include registered members in the network, with 0 personal volume until they buy a paid package
        }
        upsertPerson({
          uid: u.uid,
          fullName: u.fullName || u.dealerDetails?.companyName || 'Üye',
          email: u.email,
          phone: u.phone || u.dealerDetails?.whatsapp || '',
          city: u.dealerDetails?.taxOffice || u.dealerDetails?.address || 'Türkiye',
          referralCode: u.dealerDetails?.referralCode || u.referralCode,
          referredByCode: u.referredByCode,
          resellerId: u.resellerId,
          packageRaw: u.dealerPackageId || u.selectedPackage,
          createdAt: u.createdAt,
          isAllowed: u.isAllowed,
          isDealer: u.role === 'dealer' || Boolean(u.isDealerRequested),
          countryCode: u.country_code,
          taxId: u.dealerDetails?.taxNumber,
          hasTaxCompany: Boolean(u.dealerDetails?.taxNumber && u.dealerDetails.taxNumber !== 'Belirtilmedi'),
          bankName: u.dealerDetails?.bankInfo?.bankName,
          ibanHolder: u.dealerDetails?.bankInfo?.accountHolder || u.fullName,
          iban: u.dealerDetails?.bankInfo?.iban,
        });
      });

      allResellers.forEach((r: Reseller) => {
        upsertPerson({
          uid: r.uid,
          fullName: r.fullName || r.resellerName || r.businessName || 'Bayi',
          email: r.email,
          phone: r.phone,
          city: r.taxOffice || 'Türkiye',
          referralCode: r.referralCode,
          referredByCode: (r as any).referredByCode,
          resellerId: (r as any).resellerId,
          packageRaw: r.dealerPackageId,
          createdAt: r.createdAt || (r as any).joinedAt,
          isAllowed: r.status !== 'suspended',
          isDealer: true,
          countryCode: r.countryCode || 'TR',
          taxId: r.taxNumber,
          hasTaxCompany: Boolean(r.taxNumber && r.taxNumber !== 'Belirtilmedi'),
          bankName: r.bankInfo?.bankName,
          ibanHolder: r.bankInfo?.accountHolder || r.resellerName,
          iban: r.bankInfo?.iban,
        });
      });

      if (activeMember && allUsers.some((user) => user.uid === activeMember.uid)) {
        upsertPerson({
          uid: activeMember.uid,
          fullName: activeMember.fullName,
          email: activeMember.email,
          phone: activeMember.phone,
          city: activeMember.dealerDetails?.taxOffice || 'Türkiye',
          referralCode: activeMember.dealerDetails?.referralCode || activeMember.referralCode,
          referredByCode: activeMember.referredByCode,
          resellerId: activeMember.resellerId,
          packageRaw: activeMember.dealerPackageId || activeMember.selectedPackage,
          createdAt: activeMember.createdAt,
          isAllowed: activeMember.isAllowed,
          isDealer: activeMember.role === 'dealer' || Boolean(activeMember.isDealerRequested),
          countryCode: activeMember.country_code,
          taxId: activeMember.dealerDetails?.taxNumber,
          hasTaxCompany: Boolean(activeMember.dealerDetails?.taxNumber && activeMember.dealerDetails.taxNumber !== 'Belirtilmedi'),
          bankName: activeMember.dealerDetails?.bankInfo?.bankName,
          ibanHolder: activeMember.dealerDetails?.bankInfo?.accountHolder || activeMember.fullName,
          iban: activeMember.dealerDetails?.bankInfo?.iban,
        });
      }

      if (activeReseller && allResellers.some((reseller) => reseller.uid === activeReseller.uid)) {
        upsertPerson({
          uid: activeReseller.uid,
          fullName: activeReseller.resellerName,
          email: activeReseller.email,
          phone: activeReseller.phone,
          referralCode: activeReseller.referralCode,
          referredByCode: (activeReseller as any).referredByCode,
          packageRaw: activeReseller.dealerPackageId,
          createdAt: activeReseller.createdAt,
          isAllowed: activeReseller.status !== 'suspended',
          isDealer: true,
          countryCode: (activeReseller as any).countryCode || 'TR',
          taxId: (activeReseller as any).taxNumber,
          hasTaxCompany: Boolean((activeReseller as any).taxNumber && (activeReseller as any).taxNumber !== 'Belirtilmedi'),
          bankName: activeReseller.bankInfo?.bankName,
          ibanHolder: activeReseller.bankInfo?.accountHolder || activeReseller.resellerName,
          iban: activeReseller.bankInfo?.iban,
        });
      }

      // 2. Collect paid member orders and confirmed card/wallet dealer orders
      const unifiedOrdersMap = new Map<
        string,
        {
          order_id: string;
          user_id: string;
          user_name: string;
          user_email: string;
          order_amount: number;
          package_id: Exclude<PackageId, 'CUSTOM'>;
          timestamp: string;
        }
      >();

      const usersWithExplicitOrder = new Set<string>();

      memberOrders.forEach((mOrder: MemberOrder) => {
        if (!mOrder || !mOrder.id) return;
        if (mOrder.paymentStatus !== 'PAID') return;
        if (LEGACY_DEMO_USER_IDS.has(mOrder.userId)) return;
        const amt = Number(mOrder.amount);
        if (isNaN(amt) || amt <= 0) return;

        const cleanEmail = (mOrder.userEmail || '').trim().toLowerCase();
        const canonicalUserId =
          cleanEmail && emailToUidMap.has(cleanEmail)
            ? emailToUidMap.get(cleanEmail)!
            : mOrder.userId;

        if (!canonicalUserId) return;
        usersWithExplicitOrder.add(canonicalUserId);
        if (cleanEmail) usersWithExplicitOrder.add(cleanEmail);

        unifiedOrdersMap.set(mOrder.id, {
          order_id: mOrder.id,
          user_id: canonicalUserId,
          user_name: mOrder.userName || 'Üye',
          user_email: cleanEmail,
          order_amount: amt,
          package_id: mapFrekansPkgToMonolinePkgId(mOrder.packageId, amt),
          timestamp: mOrder.date || new Date().toISOString(),
        });
      });

      getLocalDealerOrders().forEach((order) => {
        if (!order.id || order.status !== 'approved') return;
        if (LEGACY_DEMO_USER_IDS.has(order.resellerId)) return;
        const amount = Number(order.price);
        if (!Number.isFinite(amount) || amount <= 0) return;
        const email = (order.resellerEmail || '').trim().toLowerCase();
        const userId = email && emailToUidMap.has(email)
          ? emailToUidMap.get(email)!
          : order.resellerId;
        if (!userId) return;
        usersWithExplicitOrder.add(userId);
        if (email) usersWithExplicitOrder.add(email);
        unifiedOrdersMap.set(order.id, {
          order_id: order.id,
          user_id: userId,
          user_name: order.resellerName || 'Bayi',
          user_email: email,
          order_amount: amount,
          package_id: mapFrekansPkgToMonolinePkgId(order.packageId, amount),
          timestamp: order.approvedAt || order.createdAt || new Date().toISOString(),
        });
      });

      // Also check if any registered member/dealer in Frekans has a paid package on their profile
      // that wasn't recorded as a separate order document yet
      allUsers.forEach((u: UserMember) => {
        if (!u || !u.uid || LEGACY_DEMO_USER_IDS.has(u.uid)) return;
        const cleanEmail = (u.email || '').trim().toLowerCase();
        if (cleanEmail && LEGACY_DEMO_EMAILS.has(cleanEmail)) return;
        const canonicalUid =
          cleanEmail && emailToUidMap.has(cleanEmail)
            ? emailToUidMap.get(cleanEmail)!
            : u.uid;

        if (
          usersWithExplicitOrder.has(canonicalUid) ||
          (cleanEmail && usersWithExplicitOrder.has(cleanEmail))
        ) {
          return;
        }
        if (u.uid === 'ADMIN-AKN-01' || u.role === 'admin') return;

        const rawPkg = u.dealerPackageId || u.selectedPackage || '';
        if (!rawPkg || rawPkg.includes('demo') || u.paymentStatus === 'DEMO' || u.paymentStatus === 'REJECTED') {
          return;
        }

        if (u.paymentStatus === 'PAID') {
          const monolinePkg = mapFrekansPkgToMonolinePkgId(rawPkg);
          const pkgDef = PACKAGES[monolinePkg];
          if (pkgDef && pkgDef.defaultPrice > 0) {
            const synthOrderId = `ORD-KAYIT-${canonicalUid}`;
            unifiedOrdersMap.set(synthOrderId, {
              order_id: synthOrderId,
              user_id: canonicalUid,
              user_name: u.fullName || 'Bayi',
              user_email: cleanEmail,
              order_amount: getPackagePriceForRegion(
                pkgDef.defaultPrice,
                resolveMemberRegion(u.country_code)
              ),
              package_id: monolinePkg,
              timestamp: u.createdAt || new Date().toISOString(),
            });
          }
        }
      });

      const { getAdminToken } = await import('./adminSession');
      const adminToken = getAdminToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const res = await fetch('/api/v1/integrations/sync-frekans-data', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          members: Array.from(unifiedMembersMap.values()),
          orders: Array.from(unifiedOrdersMap.values()),
          resetBeforeSync: Boolean(options?.resetBeforeSync),
        }),
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      const state: SystemStateResponse | undefined = data.state;

      if (state) {
        await mirrorMonolineStateBackToFrekans(state);
      }

      return state || null;
    } catch (err) {
      console.debug('syncFrekansWithMonolineEngine notice:', err);
      return null;
    } finally {
      inFlightSync = null;
    }
  };

  inFlightSync = runSync();
  return inFlightSync;
}

/**
 * Returns the Monoline single-line tree strictly scoped to a dealer's own downline:
 * - Includes the dealer (`dealerId`) as the root/starting node.
 * - Includes ONLY dealers after them who are sponsored by `dealerId` or recursively by `dealerId`'s downline.
 * - Excludes all upper sponsors AND excludes upper sponsors' other dealers (sibling/other branches).
 */
export function getDealerMonolineDownlineTree(
  allMembers: MonolineMember[],
  dealerId: string
): MonolineMember[] {
  const sorted = [...allMembers].sort((a, b) => a.global_line_id - b.global_line_id);
  const rootDealer = sorted.find((m) => m.user_id === dealerId) || sorted[0];
  if (!rootDealer) return [];

  const allowedDownlineIds = new Set<string>([rootDealer.user_id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of sorted) {
      if (
        !allowedDownlineIds.has(m.user_id) &&
        m.sponsor_id &&
        allowedDownlineIds.has(m.sponsor_id) &&
        m.global_line_id > rootDealer.global_line_id
      ) {
        allowedDownlineIds.add(m.user_id);
        changed = true;
      }
    }
  }

  return sorted.filter(
    (m) =>
      m.user_id === rootDealer.user_id ||
      (allowedDownlineIds.has(m.user_id) && m.global_line_id > rootDealer.global_line_id)
  );
}

/**
 * Mirrors calculated Monoline 7 Nefis Mertebesi careers, earnings, and commission logs
 * back into Frekans's Reseller & Commission stores so Bayi Paneli and Admin Paneli stay 100% synced.
 */
export async function mirrorMonolineStateBackToFrekans(
  state: SystemStateResponse
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const allResellers = await getAllResellers();
    let resellersChanged = false;

    const updatedResellers = allResellers.map((r) => {
      const cleanEmail = (r.email || '').trim().toLowerCase();
      const cleanCode = (r.referralCode || '').trim().toUpperCase();
      const cleanName = (r.resellerName || r.businessName || r.fullName || '').trim().toLowerCase();

      const m = state.members.find(
        (mem) =>
          mem.user_id === r.uid ||
          (cleanEmail && mem.email && mem.email.toLowerCase() === cleanEmail) ||
          (cleanCode && mem.ref_code && mem.ref_code.toUpperCase() === cleanCode) ||
          (cleanName && mem.full_name && mem.full_name.trim().toLowerCase() === cleanName)
      );
      if (!m) return r;

      const sponsorMem = m.sponsor_id
        ? state.members.find((sm) => sm.user_id === m.sponsor_id)
        : undefined;
      const nextReferredByCode =
        sponsorMem?.ref_code || (r as any).referredByCode || '';
      const nextResellerId = m.sponsor_id || (r as any).resellerId || '';

      const nextTotalEarnings = m.wallets.total_earnings;
      const nextPaidEarnings = m.wallets.total_withdrawn;
      const nextPendingEarnings = getMemberRegionalUsdBalance(m) + getMemberRegionalPendingUsd(m);
      const nextSalesAmount = m.personal_volume + m.group_volume;
      const nextReferredUsers = m.active_direct_referrals;

      if (
        r.creditsBalance !== undefined ||
        r.totalEarnings !== nextTotalEarnings ||
        r.paidEarnings !== nextPaidEarnings ||
        r.pendingEarnings !== nextPendingEarnings ||
        r.totalSalesAmount !== nextSalesAmount ||
        r.totalReferredUsers !== nextReferredUsers ||
        (r as any).referredByCode !== nextReferredByCode ||
        (r as any).resellerId !== nextResellerId ||
        (r as any).careerLevel !== m.career_level ||
        (r as any).careerTitle !== m.career_title ||
        (r as any).monolinePosition !== m.global_line_id ||
        (r as any).isActive !== m.is_active ||
        (r as any).activityExpiresAt !== m.activity_expires_at ||
        (false)
      ) {
        resellersChanged = true;
        return {
          ...r,
          creditsBalance: undefined,
          updatedAt: r.updatedAt,
          referredByCode: nextReferredByCode,
          resellerId: nextResellerId,
          totalEarnings: nextTotalEarnings,
          paidEarnings: nextPaidEarnings,
          pendingEarnings: nextPendingEarnings,
          totalSalesAmount: nextSalesAmount,
          totalReferredUsers: nextReferredUsers,
          careerLevel: m.career_level,
          careerTitle: m.career_title,
          monolinePosition: m.global_line_id,
          unlockedDepth: m.unlocked_depth,
          isActive: m.is_active,
          activityExpiresAt: m.activity_expires_at,
          welcomeBonusGranted: false,
          welcomeBonusCredits: 0,
          welcomeBonusBreakdown: '',
        };
      }
      return r;
    });

    if (resellersChanged) {
      saveLocalResellers(updatedResellers);
    }

    const activeRes = getActiveResellerSession();
    if (activeRes) {
      const matchedActive = updatedResellers.find(
        (r) =>
          r.uid === activeRes.uid ||
          (activeRes.email && r.email && r.email.toLowerCase() === activeRes.email.toLowerCase()) ||
          (activeRes.referralCode &&
            r.referralCode &&
            r.referralCode.toUpperCase() === activeRes.referralCode.toUpperCase())
      );
      if (
        matchedActive &&
        (matchedActive.creditsBalance !== undefined ||
          (matchedActive as any).isActive !== (activeRes as any).isActive ||
          (matchedActive as any).activityExpiresAt !== (activeRes as any).activityExpiresAt)
      ) {
        setActiveResellerSession({
          ...activeRes,
          creditsBalance: undefined,
          isActive: (matchedActive as any).isActive,
          activityExpiresAt: (matchedActive as any).activityExpiresAt,
          updatedAt: new Date().toISOString(),
        });
        resellersChanged = true;
      }
    }

    if (resellersChanged) {
      window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
    }

    window.dispatchEvent(
      new CustomEvent('aurabio_monoline_state_updated', {
        detail: state,
      })
    );

    // Mirror commission_logs (SPONSOR and MONOLINE_DEPTH) into Frekans commissions list
    const existingComms = getLocalCommissions();
    const commMap = new Map<string, FrekansCommissionTx>();
    existingComms.forEach((c) => {
      if (c && c.transactionId) commMap.set(c.transactionId, c);
    });

    let commsChanged = false;
    state.commission_logs.forEach((log) => {
      if (log.type === 'SYSTEM_POOL') return;
      const txId = `MLM-${log.order_id}-${log.type}-${log.depth_level || 0}-${log.target_external_id}`;
      if (!commMap.has(txId)) {
        const relatedTx = state.transactions.find((t) => t.order_id === log.order_id);
        const orderAmt = relatedTx ? relatedTx.order_amount : log.amount * 5;
        const rate =
          log.type === 'SPONSOR'
            ? state.distribution_params.direct_sponsor_percent
            : log.depth_level
            ? state.distribution_params.depth_percentages[log.depth_level - 1] || 2
            : 20;

        commMap.set(txId, {
          transactionId: txId,
          resellerId: log.target_external_id,
          resellerName: log.target_user_name,
          userId: log.source_external_id,
          orderId: log.order_id,
          packageName:
            log.type === 'SPONSOR'
              ? `${relatedTx?.package_id || 'Paket'} (Direkt Sponsor %${rate})`
              : `${relatedTx?.package_id || 'Paket'} (Monoline ${log.depth_level}. Derinlik %${rate})`,
          amount: orderAmt,
          commissionRate: rate,
          commissionAmount: log.amount,
          status: 'approved',
          createdAt: log.created_at,
          notes:
            log.type === 'SPONSOR'
              ? `Direkt Sponsor Primi (%${rate}) — ${log.source_user_name}`
              : `Monoline ${log.depth_level}. Üst Sıra Derinlik Primi (%${rate}) — ${log.source_user_name}`,
        });
        commsChanged = true;
      }
    });

    if (commsChanged) {
      saveLocalCommissions(Array.from(commMap.values()));
    }
  } catch (err) {
    console.debug('mirrorMonolineStateBackToFrekans notice:', err);
  }
}

/**
 * Records a package purchase initiated inside Monoline Portal directly into Frekans
 * (DealerPackageOrder + Reseller & User session_credits + CreditTransaction audit log)
 * so both systems stay 100% unified and credits reflect immediately in Bayi Paneli.
 */
export async function recordMonolinePackageOrderToFrekans(
  payload: OrderCommissionPayload,
  tx: MonolineCommissionTx,
  buyerMember?: MonolineMember
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const frekansPkgId = mapMonolinePkgToFrekansPkgId(payload.package_id);
    const pkgMeta =
      DEFAULT_MEMBERSHIP_PACKAGES.find((p) => p.id === frekansPkgId) ||
      DEFAULT_MEMBERSHIP_PACKAGES[0];

    const creditsAdded = Number(tx.session_credits_added ?? pkgMeta.scanCredits ?? 0);
    const nowIso = new Date().toISOString();

    const buyerEmail = (buyerMember?.email || '').trim().toLowerCase();
    const buyerCode = (buyerMember?.ref_code || '').trim().toUpperCase();
    const buyerName = (buyerMember?.full_name || tx.buyer_name || '').trim().toLowerCase();

    const activeRes = getActiveResellerSession();
    const activeUser = getActiveMemberSession();

    // Update Reseller creditsBalance in Frekans (match by UID, email, referralCode, name, or active session)
    const allResellers = await getAllResellers();
    let matchedIndices: number[] = [];

    allResellers.forEach((r, idx) => {
      const rEmail = (r.email || '').trim().toLowerCase();
      const rCode = (r.referralCode || '').trim().toUpperCase();
      const rName = (r.resellerName || r.businessName || r.fullName || '').trim().toLowerCase();
      if (
        r.uid === payload.user_id ||
        (buyerEmail && rEmail && rEmail === buyerEmail) ||
        (buyerCode && rCode && rCode === buyerCode) ||
        (buyerName && rName && rName === buyerName)
      ) {
        matchedIndices.push(idx);
      }
    });

    // If no direct index matched but there is an active logged-in reseller session, match the active reseller
    if (matchedIndices.length === 0 && activeRes) {
      const activeIdx = allResellers.findIndex(
        (r) =>
          r.uid === activeRes.uid ||
          (activeRes.email && r.email && r.email.toLowerCase() === activeRes.email.toLowerCase()) ||
          (activeRes.referralCode &&
            r.referralCode &&
            r.referralCode.toUpperCase() === activeRes.referralCode.toUpperCase())
      );
      if (activeIdx >= 0) {
        matchedIndices.push(activeIdx);
      }
    }

    let primaryResellerUid = activeRes?.uid || payload.user_id;
    let primaryResellerName =
      buyerMember?.full_name || activeRes?.resellerName || tx.buyer_name || 'Yetkili Bayi';

    if (matchedIndices.length > 0) {
      for (const rIdx of matchedIndices) {
        const targetRes = allResellers[rIdx];

        primaryResellerUid = targetRes.uid;
        primaryResellerName = targetRes.resellerName || primaryResellerName;

        const updatedReseller: Reseller = {
          ...targetRes,
          creditsBalance: undefined,
          dealerPackageId: frekansPkgId,
          totalSalesAmount: (targetRes.totalSalesAmount || 0) + tx.order_amount,
          isActive: buyerMember?.is_active ?? (targetRes as any).isActive,
          activityExpiresAt: buyerMember?.activity_expires_at ?? (targetRes as any).activityExpiresAt,
          updatedAt: nowIso,
        };
        allResellers[rIdx] = updatedReseller;

        if (
          activeRes &&
          (activeRes.uid === updatedReseller.uid ||
            (activeRes.email &&
              updatedReseller.email &&
              activeRes.email.toLowerCase() === updatedReseller.email.toLowerCase()) ||
            (activeRes.referralCode &&
              updatedReseller.referralCode &&
              activeRes.referralCode.toUpperCase() === updatedReseller.referralCode.toUpperCase()) ||
            (activeRes.resellerName &&
              updatedReseller.resellerName &&
              activeRes.resellerName.trim().toLowerCase() ===
                updatedReseller.resellerName.trim().toLowerCase()))
        ) {
          setActiveResellerSession(updatedReseller);
        }

        try {
          const firestoreReseller = { ...updatedReseller };
          delete firestoreReseller.creditsBalance;
          await setDoc(doc(db, 'resellers', updatedReseller.uid), firestoreReseller, {
            merge: true,
          });
        } catch {
          // non-blocking
        }

      }
      saveLocalResellers(allResellers);
    } else if (activeRes) {
      // Directly update activeResellerSession and insert into allResellers
      primaryResellerUid = activeRes.uid;
      primaryResellerName = activeRes.resellerName;

      const updatedActive: Reseller = {
        ...activeRes,
        creditsBalance: undefined,
        dealerPackageId: frekansPkgId,
        totalSalesAmount: (activeRes.totalSalesAmount || 0) + tx.order_amount,
        isActive: buyerMember?.is_active ?? (activeRes as any).isActive,
        activityExpiresAt: buyerMember?.activity_expires_at ?? (activeRes as any).activityExpiresAt,
        updatedAt: nowIso,
      };
      saveLocalResellers([updatedActive, ...allResellers]);
      setActiveResellerSession(updatedActive);
      try {
        const firestoreReseller = { ...updatedActive };
        delete firestoreReseller.creditsBalance;
        await setDoc(doc(db, 'resellers', updatedActive.uid), firestoreReseller, { merge: true });
      } catch {
        // non-blocking
      }
    }

    // Also ensure activeResellerSession is updated if the buyer is the logged-in dealer
    const latestActiveRes = getActiveResellerSession();
    if (
      latestActiveRes &&
      (latestActiveRes.uid === payload.user_id ||
        latestActiveRes.uid === primaryResellerUid ||
        (buyerName &&
          latestActiveRes.resellerName &&
          latestActiveRes.resellerName.trim().toLowerCase() === buyerName))
    ) {
      if (
        (buyerMember &&
          (latestActiveRes.activityExpiresAt !== buyerMember.activity_expires_at ||
            latestActiveRes.isActive !== buyerMember.is_active))
      ) {
        const syncedActive: Reseller = {
          ...latestActiveRes,
          creditsBalance: undefined,
          dealerPackageId: frekansPkgId,
          isActive: buyerMember?.is_active ?? (latestActiveRes as any).isActive,
          activityExpiresAt: buyerMember?.activity_expires_at ?? (latestActiveRes as any).activityExpiresAt,
          updatedAt: nowIso,
        };
        setActiveResellerSession(syncedActive);
      }
    }

    // Record DealerPackageOrder for both payload.user_id and primaryResellerUid
    const paymentMethodMapped: DealerPackageOrder['paymentMethod'] =
      payload.payment_method === 'WALLET_BALANCE' ? 'wallet_balance' : 'credit_card_3d';

    const newOrder: DealerPackageOrder = {
      id: tx.order_id,
      resellerId: primaryResellerUid || payload.user_id,
      resellerName: primaryResellerName,
      resellerEmail: buyerMember?.email || activeRes?.email || '',
      resellerPhone: buyerMember?.phone || activeRes?.phone || '',
      packageId: frekansPkgId,
      packageName: pkgMeta.name,
      scanCredits: creditsAdded,
      price: tx.order_amount,
      priceText: `${tx.order_amount.toLocaleString('tr-TR')} $`,
      status: 'approved',
      paymentMethod: paymentMethodMapped,
      paymentReference: payload.payment_method || 'CARD_3D',
      createdAt: tx.timestamp || nowIso,
      approvedAt: tx.timestamp || nowIso,
    };

    const currentOrders = getLocalDealerOrders();
    if (!currentOrders.some((o) => o.id === newOrder.id)) {
      saveLocalDealerOrders([newOrder, ...currentOrders]);
      try {
        await setDoc(doc(db, 'dealer_package_orders', newOrder.id), newOrder, { merge: true });
      } catch {
        // offline fallback
      }
    }

    // Update UserMember creditsBalance in Frekans
    const allUsers = await adminGetAllMembers();
    const uMatch =
      allUsers.find(
        (u) =>
          u.uid === payload.user_id ||
          u.uid === primaryResellerUid ||
          (buyerEmail && u.email && u.email.toLowerCase() === buyerEmail) ||
          (buyerCode &&
            (u.referralCode?.toUpperCase() === buyerCode ||
              u.dealerDetails?.referralCode?.toUpperCase() === buyerCode)) ||
          (buyerName &&
            (u.fullName?.trim().toLowerCase() === buyerName ||
              u.dealerDetails?.companyName?.trim().toLowerCase() === buyerName))
      ) || activeUser;

    if (uMatch) {
      const updatedUser: UserMember = {
        ...uMatch,
        creditsBalance: undefined,
        dealerPackageId: frekansPkgId,
        selectedPackage: frekansPkgId,
        paymentStatus: 'PAID',
        isAllowed: true,
        role: uMatch.role === 'admin' ? 'admin' : 'dealer',
        dealerStatus: 'approved',
        dealerDetails: uMatch.dealerDetails
          ? {
              ...uMatch.dealerDetails,
              creditsBalance: undefined,
            }
          : undefined,
      };
      saveToLocalMembersDirectory(updatedUser);
      if (
        activeUser &&
        (activeUser.uid === updatedUser.uid ||
          (activeUser.email &&
            updatedUser.email &&
            activeUser.email.toLowerCase() === updatedUser.email.toLowerCase()))
      ) {
        localStorage.setItem('aurabio_active_session_v1', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updatedUser }));
      }
      try {
        const firestoreUser = structuredClone(updatedUser);
        delete firestoreUser.creditsBalance;
        if (firestoreUser.dealerDetails) delete firestoreUser.dealerDetails.creditsBalance;
        await setDoc(doc(db, 'users', updatedUser.uid), firestoreUser, { merge: true });
      } catch {
        // non-blocking
      }
    }

    // Broadcast live credit pool update so ResellerDashboardModal, Header, and App.tsx update immediately
    window.dispatchEvent(new CustomEvent('aurabio_credits_deducted'));
    window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
  } catch (err) {
    console.debug('recordMonolinePackageOrderToFrekans notice:', err);
  }
}

/**
 * Registers a member added inside Monoline Portal directly into Frekans's
 * users and resellers directories so both systems share the exact same member base.
 */
export async function registerMonolineMemberToFrekans(
  member: MonolineMember,
  tx?: MonolineCommissionTx,
  allMonolineMembers?: MonolineMember[]
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const frekansPkgId = mapMonolinePkgToFrekansPkgId(
      member.highest_package_id || 'PKG_MINI_DENEME'
    );
    const nowIso = member.joined_at || new Date().toISOString();
    const allResellers = await getAllResellers();

    const sponsorInMonoline =
      member.sponsor_id && allMonolineMembers
        ? allMonolineMembers.find((m) => m.user_id === member.sponsor_id)
        : undefined;
    const sponsorInResellers = member.sponsor_id
      ? allResellers.find((r) => r.uid === member.sponsor_id)
      : undefined;
    const sponsorRefCode =
      sponsorInMonoline?.ref_code || sponsorInResellers?.referralCode || '';

    const newUser: UserMember = {
      uid: member.user_id,
      email: member.email,
      fullName: member.full_name,
      phone: member.phone,
      isAllowed: true,
      isApproved: true,
      expiryDate: null,
      selectedPackage: frekansPkgId,
      dealerPackageId: frekansPkgId,
      creditsBalance: undefined,
      paymentStatus: 'PAID',
      resellerId: member.sponsor_id || '',
      referredByCode: sponsorRefCode,
      referralCode: member.ref_code,
      createdAt: nowIso,
      lastLoginAt: nowIso,
      role: 'dealer',
      isDealerRequested: true,
      dealerStatus: 'approved',
      dealerDetails: {
        companyName: member.full_name,
        taxNumber: 'Belirtilmedi',
        taxOffice: member.city || 'Türkiye',
        businessField: 'Biyo-Rezonans & Frekans Merkezi',
        phone: member.phone,
        whatsapp: member.phone,
        referralCode: member.ref_code,
        creditsBalance: undefined,
        appliedAt: nowIso,
        approvedAt: nowIso,
      },
    };

    saveToLocalMembersDirectory(newUser);
    try {
      const firestoreUser = structuredClone(newUser);
      delete firestoreUser.creditsBalance;
      if (firestoreUser.dealerDetails) delete firestoreUser.dealerDetails.creditsBalance;
      await setDoc(doc(db, 'users', newUser.uid), firestoreUser, { merge: true });
    } catch {
      // offline fallback
    }

    const newReseller: Reseller = {
      uid: member.user_id,
      resellerName: member.full_name,
      businessName: member.full_name,
      fullName: member.full_name,
      email: member.email,
      phone: member.phone,
      referralCode: member.ref_code,
      referredByCode: sponsorRefCode,
      resellerId: member.sponsor_id || '',
      commissionRate: allResellers.find((r) => r.uid === member.user_id)?.commissionRate,
      creditsBalance: undefined,
      dealerPackageId: frekansPkgId,
      bankInfo: {
        bankName: member.bank_details?.bank_name || '',
        accountHolder: member.bank_details?.iban_holder_name || member.full_name,
        iban: member.bank_details?.iban || '',
      },
      status: 'active',
      totalEarnings: member.wallets.total_earnings,
      paidEarnings: member.wallets.total_withdrawn,
      pendingEarnings: getMemberRegionalPendingUsd(member),
      totalSalesAmount: member.personal_volume,
      totalReferredUsers: member.active_direct_referrals,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    saveLocalResellers([newReseller, ...allResellers.filter((r) => r.uid !== newReseller.uid)]);
    try {
      const firestoreReseller = { ...newReseller };
      delete firestoreReseller.creditsBalance;
      await setDoc(doc(db, 'resellers', newReseller.uid), firestoreReseller, { merge: true });
    } catch {
      // offline fallback
    }

    if (tx) {
      await recordMonolinePackageOrderToFrekans(
        {
          user_id: member.user_id,
          order_id: tx.order_id,
          order_amount: tx.order_amount,
          package_id: member.highest_package_id || 'PKG_MINI_DENEME',
          timestamp: nowIso,
        },
        tx,
        member
      );
    }
  } catch (err) {
    console.debug('registerMonolineMemberToFrekans notice:', err);
  }
}

/**
 * Redirects the dealer from the Monoline Single-Line Tree / Back-Office directly to the main page's
 * "Bayilik Başvurusu / Kayıt" (AuthModal in 'dealer' / 'register' mode), automatically locking
 * the current dealer as the Direct Sponsor / Referrer.
 */
export function redirectToDealerRegistrationPortal(sponsor?: {
  user_id: string;
  full_name: string;
  ref_code: string;
  email?: string;
  phone?: string;
}): void {
  if (typeof window === 'undefined') return;

  try {
    if (sponsor && sponsor.user_id && sponsor.ref_code) {
      const cleanCode = sponsor.ref_code.trim().toUpperCase();
      setStoredReferralCode(cleanCode);

      // Ensure this sponsor dealer exists in local resellers directory so AuthModal locks to their exact UID & name
      const localList = getLocalResellers();
      const exists = localList.some(
        (r) =>
          r.uid === sponsor.user_id ||
          (r.referralCode && r.referralCode.toUpperCase() === cleanCode)
      );
      if (!exists) {
        const nowIso = new Date().toISOString();
        const entry: Reseller = {
          uid: sponsor.user_id,
          resellerName: sponsor.full_name,
          businessName: sponsor.full_name,
          fullName: sponsor.full_name,
          email: sponsor.email || '',
          phone: sponsor.phone || '',
          referralCode: cleanCode,
          creditsBalance: undefined,
          dealerPackageId: 'pkg-5k',
          bankInfo: {
            bankName: '',
            accountHolder: sponsor.full_name,
            iban: '',
          },
          status: 'active',
          totalEarnings: 0,
          paidEarnings: 0,
          pendingEarnings: 0,
          totalSalesAmount: 0,
          totalReferredUsers: 0,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        saveLocalResellers([entry, ...localList]);
      }
    } else {
      // If no explicit sponsor provided, do not force lock previous session's dealer code
      // Clean up so new registration can freely select their sponsor
      const directUrl = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('ref') || new URLSearchParams(window.location.search).get('bayi'));
      if (!directUrl) {
        clearStoredReferralCode();
      }
    }
  } catch (err) {
    console.debug('redirectToDealerRegistrationPortal notice:', err);
  }

  window.dispatchEvent(
    new CustomEvent('aurabio_open_dealer_registration', {
      detail: sponsor || null,
    })
  );
}
