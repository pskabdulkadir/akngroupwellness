/**
 * Çift Motorlu Hibrit Komisyon Mimarisi Servisi
 *
 * Motor 1: Sponsorlu Derinlik Motoru (Unilevel 7 Derinlik - Ekip Cirosu - Toplam %25)
 * Motor 2: Küresel Monoline Motoru (Sembolik Sıra Teşvik Primi - Toplam %5)
 *
 * Doğrudan Sponsor Satış Primi: %20
 * Sistem Fonu: %5
 */

import { BUSINESS_RULES } from '../config/businessRules';
import {
  CommissionLogRecord,
  CommissionTransaction,
  DepthPayoutDetail,
  MemberRegion,
  MonolineMember,
  UnclaimedCommissionRecord,
  UnclaimedTransferReasonCode,
} from '../types/monoline';

export interface OrderInput {
  order_id: string;
  user_id: string;
  order_amount: number;
  package_id?: string;
  client_ip?: string;
  device_fingerprint?: string;
  timestamp?: string;
  enforce_career_depth_lock?: boolean;
  order_type?: 'ACTIVITY_RENEWAL' | 'STANDARD_ORDER' | 'ACTIVATION';
  payment_method?: string;
}

export interface CommissionCalculationContext {
  members: MonolineMember[];
  commissionLogs: CommissionLogRecord[];
  unclaimedCommissions: UnclaimedCommissionRecord[];
  systemWallet: {
    system_pool_balance: number;
    unclaimed_pool_balance: number;
    updated_at: string;
  };
  enforceCareerDepthLock?: boolean;
  useClawbackPending?: boolean;
  clawbackDays?: number;
  dynamicCompression?: boolean;
  skipPassiveMonoline?: boolean;
  nowIso?: string;
  creditWalletFn?: (
    member: MonolineMember,
    type: 'UNILEVEL_COMMISSION' | 'MONOLINE_INCENTIVE' | 'SPONSOR',
    amount: number,
    usePending: boolean,
    region?: MemberRegion
  ) => void;
  logCommFn?: (
    orderId: string,
    source: MonolineMember,
    target: MonolineMember | null,
    type: 'UNILEVEL_COMMISSION' | 'MONOLINE_INCENTIVE' | 'SPONSOR' | 'SYSTEM_POOL',
    depth: number | null,
    amount: number,
    status: any,
    releaseAt: string,
    createdAt: string,
    targetFallbackName?: string
  ) => void;
}

export interface MotorDistributionResult {
  payouts: DepthPayoutDetail[];
  totalDistributed: number;
  totalUnclaimedToPool: number;
  unclaimedRecords: UnclaimedCommissionRecord[];
}

export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Motor 1: Sponsorlu Derinlik Motoru (Unilevel 7 Derinlik - Ekip Cirosu)
 *
 * - Sipariş veren üyenin sponsor_id ilişkisi takip edilerek ebeveyn ağacında yukarı doğru 7 basamak taranır.
 * - 8. ebeveyn ve sonrasına bu motordan prim aktarılmaz (tarama durdurulur).
 * - Oranlar: [7, 5, 4, 3, 2, 2, 2] (Toplam %25)
 * - unlocked_depth / kariyer derinlik kilitleri bağlayıcıdır.
 * - Cüzdan ve deftere 'UNILEVEL_COMMISSION' olarak işlenir.
 */
export function distributeUnilevelCommissions(
  order: OrderInput,
  buyer: MonolineMember,
  ctx: CommissionCalculationContext
): MotorDistributionResult {
  const payouts: DepthPayoutDetail[] = [];
  const unclaimedRecords: UnclaimedCommissionRecord[] = [];
  let totalDistributed = 0;
  let totalUnclaimedToPool = 0;

  const nowIso = ctx.nowIso || new Date().toISOString();
  const clawbackDays = ctx.clawbackDays ?? BUSINESS_RULES.CLAWBACK_PROTECTION_DAYS;
  const clawbackReleaseAt = new Date(
    new Date(nowIso).getTime() + clawbackDays * 86400000
  ).toISOString();
  const usePending = ctx.useClawbackPending ?? true;
  const enforceLock = ctx.enforceCareerDepthLock ?? true;

  const percentages = BUSINESS_RULES.UNILEVEL_DEPTH_PERCENTAGES;
  const visitedSponsors = new Set<string>([buyer.user_id]);
  let currentSponsorId: string | null = buyer.sponsor_id || null;
  const dynamicCompression = ctx.dynamicCompression ?? BUSINESS_RULES.DYNAMIC_COMPRESSION_ENABLED ?? false;

  for (let depth = 1; depth <= 7; depth++) {
    const ratePercent = percentages[depth - 1];
    const calcAmount = roundCurrency(order.order_amount * (ratePercent / 100));

    let sponsorMember: MonolineMember | null = null;

    if (dynamicCompression) {
      // Dinamik Sıkıştırma (Dynamic Compression): Pasif sponsorlar atlanır, ilk aktif lider aranır
      while (currentSponsorId && !visitedSponsors.has(currentSponsorId)) {
        visitedSponsors.add(currentSponsorId);
        const cand = ctx.members.find((m) => m.user_id === currentSponsorId);
        if (!cand) {
          currentSponsorId = null;
          break;
        }
        if (cand.is_active && !cand.is_locked) {
          sponsorMember = cand;
          currentSponsorId = cand.sponsor_id || null;
          break;
        }
        // Pasif veya kilitli sponsor atlandı (sıkıştırıldı)
        currentSponsorId = cand.sponsor_id || null;
      }
    } else {
      // Standart Sıralı Tarama: Her basamak için doğrudan sıradaki sponsor alınır
      if (currentSponsorId && !visitedSponsors.has(currentSponsorId)) {
        visitedSponsors.add(currentSponsorId);
        sponsorMember = ctx.members.find((m) => m.user_id === currentSponsorId) || null;
        currentSponsorId = sponsorMember?.sponsor_id || null;
      }
    }

    // 8. Derinlik ve sonrasına prim aktarılmaz; döngü 7'de biter
    if (!sponsorMember) {
      // Upline sponsor bulunamadı (ağacın köküne ulaşıldı veya sponsor yok)
      totalUnclaimedToPool = roundCurrency(totalUnclaimedToPool + calcAmount);
      const reasonDetail = `[POOL_TRANSFER_NO_UPLINE] Motor 1 (Unilevel): ${depth}. Derinlik için ebeveyn sponsor ağacında üst üye bulunmadığından system_wallet hesabına devredildi.`;

      if (ctx.logCommFn) {
        ctx.logCommFn(
          order.order_id,
          buyer,
          null,
          'UNILEVEL_COMMISSION',
          depth,
          calcAmount,
          'POOL_TRANSFER_NO_UPLINE',
          nowIso,
          nowIso
        );
      }

      const unclaimedRec: UnclaimedCommissionRecord = {
        id: Date.now() + Math.floor(Math.random() * 1000) + depth,
        order_id: order.order_id,
        source_user_id: buyer.id,
        source_external_id: buyer.user_id,
        source_user_name: buyer.full_name,
        intended_user_id: null,
        intended_external_id: null,
        intended_user_name: null,
        intended_monoline_position: null,
        commission_type: 'MONOLINE_DEPTH',
        depth_level: depth,
        amount: calcAmount,
        reason_code: 'POOL_TRANSFER_NO_UPLINE',
        reason_detail: reasonDetail,
        created_at: nowIso,
      };
      unclaimedRecords.push(unclaimedRec);

      payouts.push({
        depth,
        rate_percent: ratePercent,
        calculated_amount: calcAmount,
        recipient_user_id: null,
        recipient_name: null,
        recipient_global_line_id: null,
        recipient_career_level: 0,
        recipient_career_title: 'Sponsor Yok',
        recipient_unlocked_depth: 0,
        status: 'TRANSFERRED_TO_POOL_NO_UPLINE',
        transfer_reason_code: 'POOL_TRANSFER_NO_UPLINE',
        status_reason: reasonDetail,
      });

      continue;
    }

    const effectiveCareer = sponsorMember.active_career_level ?? sponsorMember.career_level ?? 1;
    const effectiveTitle = sponsorMember.active_career_title ?? sponsorMember.career_title ?? 'Emmâre';
    const unlockedDepth = sponsorMember.unlocked_depth || effectiveCareer;
    const isActive = sponsorMember.is_active && !sponsorMember.is_locked;
    const isEligible = isActive && (!enforceLock || effectiveCareer >= depth);

    if (isEligible) {
      totalDistributed = roundCurrency(totalDistributed + calcAmount);
      if (ctx.creditWalletFn) {
        ctx.creditWalletFn(sponsorMember, 'UNILEVEL_COMMISSION', calcAmount, usePending);
      }

      if (ctx.logCommFn) {
        ctx.logCommFn(
          order.order_id,
          buyer,
          sponsorMember,
          'UNILEVEL_COMMISSION',
          depth,
          calcAmount,
          usePending ? 'PENDING_14D' : 'RELEASED',
          usePending ? clawbackReleaseAt : nowIso,
          nowIso
        );
      }

      payouts.push({
        depth,
        rate_percent: ratePercent,
        calculated_amount: calcAmount,
        recipient_user_id: sponsorMember.user_id,
        recipient_name: sponsorMember.full_name,
        recipient_global_line_id: sponsorMember.global_line_id,
        recipient_career_level: effectiveCareer,
        recipient_career_title: effectiveTitle,
        recipient_unlocked_depth: unlockedDepth,
        status: 'PAID_TO_MEMBER',
        transfer_reason_code: 'PAID',
        status_reason: `Sponsor ${sponsorMember.full_name} (${effectiveTitle}) ${depth}. Derinlik Unilevel komisyonunu hak etti.`,
      });
    } else {
      totalUnclaimedToPool = roundCurrency(totalUnclaimedToPool + calcAmount);
      const reasonCode: UnclaimedTransferReasonCode = !isActive
        ? 'POOL_TRANSFER_INACTIVE'
        : 'POOL_TRANSFER_NO_YETKI';
      const reasonDetail = !isActive
        ? `[POOL_TRANSFER_INACTIVE] Sponsor (${sponsorMember.full_name}) aktif/yetkili olmadığı için Motor 1 ${depth}. Derinlik tutarı havuza devredildi.`
        : `[POOL_TRANSFER_NO_YETKI] Sponsor (${sponsorMember.full_name}) kariyeri (${effectiveTitle} - Seviye ${effectiveCareer}) < ${depth}. Derinlik olduğu için havuza devredildi.`;

      if (ctx.logCommFn) {
        ctx.logCommFn(
          order.order_id,
          buyer,
          sponsorMember,
          'UNILEVEL_COMMISSION',
          depth,
          calcAmount,
          reasonCode,
          nowIso,
          nowIso
        );
      }

      const unclaimedRec: UnclaimedCommissionRecord = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        order_id: order.order_id,
        source_user_id: buyer.id,
        source_external_id: buyer.user_id,
        source_user_name: buyer.full_name,
        intended_user_id: sponsorMember.id,
        intended_external_id: sponsorMember.user_id,
        intended_user_name: sponsorMember.full_name,
        intended_monoline_position: sponsorMember.global_line_id,
        commission_type: 'MONOLINE_DEPTH',
        depth_level: depth,
        amount: calcAmount,
        reason_code: reasonCode,
        reason_detail: reasonDetail,
        created_at: nowIso,
      };
      unclaimedRecords.push(unclaimedRec);

      payouts.push({
        depth,
        rate_percent: ratePercent,
        calculated_amount: calcAmount,
        recipient_user_id: sponsorMember.user_id,
        recipient_name: sponsorMember.full_name,
        recipient_global_line_id: sponsorMember.global_line_id,
        recipient_career_level: effectiveCareer,
        recipient_career_title: effectiveTitle,
        recipient_unlocked_depth: unlockedDepth,
        status: !isActive
          ? 'TRANSFERRED_TO_POOL_INACTIVE'
          : 'TRANSFERRED_TO_POOL_CAREER_LOCK',
        transfer_reason_code: reasonCode,
        status_reason: reasonDetail,
      });
    }

    currentSponsorId = sponsorMember.sponsor_id || null;
  }

  return {
    payouts,
    totalDistributed,
    totalUnclaimedToPool,
    unclaimedRecords,
  };
}

/**
 * Motor 2: Küresel Monoline Motoru (Sembolik Sıra Teşvik Primi)
 *
 * - Sponsorluk bağından bağımsız olarak global_line_id değerine dayanır.
 * - Sipariş veren üyenin global_line_id değerinden küçük olan ilk 7 üye büyükten küçüğe taranır.
 * - Teşvik Prim Oranları: [1.50, 1.00, 0.80, 0.60, 0.50, 0.30, 0.30] (Toplam %5)
 * - Aktif üye bulunamazsa kalan tutar POOL_TRANSFER_NO_UPLINE ile havuza devredilir.
 * - Cüzdan ve deftere 'MONOLINE_INCENTIVE' olarak işlenir.
 */
export function distributeMonolineIncentive(
  order: OrderInput,
  buyer: MonolineMember,
  ctx: CommissionCalculationContext
): MotorDistributionResult {
  const payouts: DepthPayoutDetail[] = [];
  const unclaimedRecords: UnclaimedCommissionRecord[] = [];
  let totalDistributed = 0;
  let totalUnclaimedToPool = 0;

  const nowIso = ctx.nowIso || new Date().toISOString();
  const clawbackDays = ctx.clawbackDays ?? BUSINESS_RULES.CLAWBACK_PROTECTION_DAYS;
  const clawbackReleaseAt = new Date(
    new Date(nowIso).getTime() + clawbackDays * 86400000
  ).toISOString();
  const usePending = ctx.useClawbackPending ?? true;

  const percentages = BUSINESS_RULES.MONOLINE_INCENTIVE_PERCENTAGES;

  const skipPassiveMonoline = ctx.skipPassiveMonoline ?? BUSINESS_RULES.SKIP_PASSIVE_MONOLINE_ENABLED ?? false;

  // Sipariş veren üyenin global_line_id'sinden küçük olan üst üyeler:
  // FİZİKİ KAYDIRMA ASLA YAPILMAZ (Sıra numaraları sabittir; table lock / race condition riski sıfırlanır).
  // Pasifler komisyon anında dinamik olarak taranarak atlanır (Skip-Passive Query) veya slotunda havuza aktarılır.
  const upperCandidates = skipPassiveMonoline
    ? ctx.members
        .filter((m) => m.global_line_id < buyer.global_line_id && m.is_active && !m.is_locked)
        .sort((a, b) => b.global_line_id - a.global_line_id)
        .slice(0, 7)
    : ctx.members
        .filter((m) => m.global_line_id < buyer.global_line_id)
        .sort((a, b) => b.global_line_id - a.global_line_id)
        .slice(0, 7);

  for (let depth = 1; depth <= 7; depth++) {
    const ratePercent = percentages[depth - 1];
    const calcAmount = roundCurrency(order.order_amount * (ratePercent / 100));

    const uplineMember = upperCandidates[depth - 1];

    if (!uplineMember) {
      // Upline bulunamadı (kuyrukta üstte yeterli üye yok)
      totalUnclaimedToPool = roundCurrency(totalUnclaimedToPool + calcAmount);
      const reasonDetail = `[POOL_TRANSFER_NO_UPLINE] Motor 2 (Monoline Teşvik): ${depth}. Üst sıra bulunamadığından ${calcAmount} $ system_wallet hesabına aktarıldı.`;

      if (ctx.logCommFn) {
        ctx.logCommFn(
          order.order_id,
          buyer,
          null,
          'MONOLINE_INCENTIVE',
          depth,
          calcAmount,
          'POOL_TRANSFER_NO_UPLINE',
          nowIso,
          nowIso
        );
      }

      const unclaimedRec: UnclaimedCommissionRecord = {
        id: Date.now() + Math.floor(Math.random() * 1000) + depth,
        order_id: order.order_id,
        source_user_id: buyer.id,
        source_external_id: buyer.user_id,
        source_user_name: buyer.full_name,
        intended_user_id: null,
        intended_external_id: null,
        intended_user_name: null,
        intended_monoline_position: null,
        commission_type: 'MONOLINE_DEPTH',
        depth_level: depth,
        amount: calcAmount,
        reason_code: 'POOL_TRANSFER_NO_UPLINE',
        reason_detail: reasonDetail,
        created_at: nowIso,
      };
      unclaimedRecords.push(unclaimedRec);

      payouts.push({
        depth,
        rate_percent: ratePercent,
        calculated_amount: calcAmount,
        recipient_user_id: null,
        recipient_name: null,
        recipient_global_line_id: null,
        recipient_career_level: 0,
        recipient_career_title: 'Sıra Boş',
        recipient_unlocked_depth: 0,
        status: 'TRANSFERRED_TO_POOL_NO_UPLINE',
        transfer_reason_code: 'POOL_TRANSFER_NO_UPLINE',
        status_reason: reasonDetail,
      });

      continue;
    }

    const isActive = uplineMember.is_active && !uplineMember.is_locked;
    const candCareer = uplineMember.active_career_level ?? uplineMember.career_level ?? 1;
    const candTitle = uplineMember.active_career_title ?? uplineMember.career_title ?? 'Emmâre';

    if (isActive) {
      totalDistributed = roundCurrency(totalDistributed + calcAmount);
      if (ctx.creditWalletFn) {
        ctx.creditWalletFn(uplineMember, 'MONOLINE_INCENTIVE', calcAmount, usePending);
      }

      if (ctx.logCommFn) {
        ctx.logCommFn(
          order.order_id,
          buyer,
          uplineMember,
          'MONOLINE_INCENTIVE',
          depth,
          calcAmount,
          usePending ? 'PENDING_14D' : 'RELEASED',
          usePending ? clawbackReleaseAt : nowIso,
          nowIso
        );
      }

      payouts.push({
        depth,
        rate_percent: ratePercent,
        calculated_amount: calcAmount,
        recipient_user_id: uplineMember.user_id,
        recipient_name: uplineMember.full_name,
        recipient_global_line_id: uplineMember.global_line_id,
        recipient_career_level: candCareer,
        recipient_career_title: candTitle,
        recipient_unlocked_depth: uplineMember.unlocked_depth || 1,
        status: 'PAID_TO_MEMBER',
        transfer_reason_code: 'PAID',
        status_reason: `Üst ${depth}. sıradaki bayi (${uplineMember.full_name} · Global #${uplineMember.global_line_id}) Monoline Teşvik Primi (%${ratePercent}) kazandı.`,
      });
    } else {
      totalUnclaimedToPool = roundCurrency(totalUnclaimedToPool + calcAmount);
      const reasonDetail = `[POOL_TRANSFER_NO_UPLINE] Motor 2: Üst ${depth}. sıradaki üye (${uplineMember.full_name}) aktif olmadığından teşvik primi havuza aktarıldı.`;

      if (ctx.logCommFn) {
        ctx.logCommFn(
          order.order_id,
          buyer,
          uplineMember,
          'MONOLINE_INCENTIVE',
          depth,
          calcAmount,
          'POOL_TRANSFER_NO_UPLINE',
          nowIso,
          nowIso
        );
      }

      const unclaimedRec: UnclaimedCommissionRecord = {
        id: Date.now() + Math.floor(Math.random() * 1000) + depth,
        order_id: order.order_id,
        source_user_id: buyer.id,
        source_external_id: buyer.user_id,
        source_user_name: buyer.full_name,
        intended_user_id: uplineMember.id,
        intended_external_id: uplineMember.user_id,
        intended_user_name: uplineMember.full_name,
        intended_monoline_position: uplineMember.global_line_id,
        commission_type: 'MONOLINE_DEPTH',
        depth_level: depth,
        amount: calcAmount,
        reason_code: 'POOL_TRANSFER_NO_UPLINE',
        reason_detail: reasonDetail,
        created_at: nowIso,
      };
      unclaimedRecords.push(unclaimedRec);

      payouts.push({
        depth,
        rate_percent: ratePercent,
        calculated_amount: calcAmount,
        recipient_user_id: uplineMember.user_id,
        recipient_name: uplineMember.full_name,
        recipient_global_line_id: uplineMember.global_line_id,
        recipient_career_level: candCareer,
        recipient_career_title: candTitle,
        recipient_unlocked_depth: uplineMember.unlocked_depth || 1,
        status: 'TRANSFERRED_TO_POOL_NO_UPLINE',
        transfer_reason_code: 'POOL_TRANSFER_NO_UPLINE',
        status_reason: reasonDetail,
      });
    }
  }

  return {
    payouts,
    totalDistributed,
    totalUnclaimedToPool,
    unclaimedRecords,
  };
}

/**
 * processOrderCommissions: Sipariş komisyonlarını Çift Motorlu Hibrit Model ile hesaplar.
 *
 * 1. %20 Direkt Sponsor Satış Primi
 * 2. Motor 1: %25 Sponsorlu Unilevel 7 Derinlik Ekip Primi (distributeUnilevelCommissions)
 * 3. Motor 2: %5 Küresel Monoline Sıra Teşviki (distributeMonolineIncentive)
 * 4. %5 Sistem Fonu
 */
export function processOrderCommissions(
  order: OrderInput,
  buyer: MonolineMember,
  ctx: CommissionCalculationContext
): {
  directSponsorPaid: number;
  unilevelResult: MotorDistributionResult;
  monolineIncentiveResult: MotorDistributionResult;
  systemFundAdded: number;
  totalDistributed: number;
} {
  const nowIso = ctx.nowIso || new Date().toISOString();
  const clawbackDays = ctx.clawbackDays ?? BUSINESS_RULES.CLAWBACK_PROTECTION_DAYS;
  const clawbackReleaseAt = new Date(
    new Date(nowIso).getTime() + clawbackDays * 86400000
  ).toISOString();
  const usePending = ctx.useClawbackPending ?? true;

  // 1. Direkt Sponsor Satış Primi (%20)
  const sponsorRate = BUSINESS_RULES.DIRECT_SPONSOR_BONUS_PERCENT / 100;
  const directSponsorCalculated = roundCurrency(order.order_amount * sponsorRate);
  let directSponsorPaid = 0;
  let sponsorRedirected = 0;

  const sponsorMember = buyer.sponsor_id
    ? ctx.members.find((m) => m.user_id === buyer.sponsor_id)
    : undefined;

  if (sponsorMember && sponsorMember.is_active && !sponsorMember.is_locked) {
    directSponsorPaid = directSponsorCalculated;
    if (ctx.creditWalletFn) {
      ctx.creditWalletFn(sponsorMember, 'SPONSOR', directSponsorPaid, usePending);
    }
    if (ctx.logCommFn) {
      ctx.logCommFn(
        order.order_id,
        buyer,
        sponsorMember,
        'SPONSOR',
        null,
        directSponsorPaid,
        usePending ? 'PENDING_14D' : 'RELEASED',
        usePending ? clawbackReleaseAt : nowIso,
        nowIso
      );
    }
  } else {
    sponsorRedirected = directSponsorCalculated;
    const reasonCode = sponsorMember ? 'POOL_TRANSFER_INACTIVE' : 'POOL_TRANSFER_NO_SPONSOR';
    if (ctx.logCommFn) {
      ctx.logCommFn(
        order.order_id,
        buyer,
        sponsorMember || null,
        'SPONSOR',
        null,
        sponsorRedirected,
        reasonCode,
        nowIso,
        nowIso
      );
    }
  }

  // 2. Motor 1: Sponsorlu Unilevel 7 Derinlik (%25)
  const unilevelResult = distributeUnilevelCommissions(order, buyer, ctx);

  // 3. Motor 2: Küresel Monoline Sıra Teşviki (%5)
  const monolineIncentiveResult = distributeMonolineIncentive(order, buyer, ctx);

  // 4. Sistem Fonu (%5)
  const fundRate = BUSINESS_RULES.SYSTEM_FUND_PERCENT / 100;
  const systemFundBase = roundCurrency(order.order_amount * fundRate);
  const totalFundAdded = roundCurrency(
    systemFundBase +
      sponsorRedirected +
      unilevelResult.totalUnclaimedToPool +
      monolineIncentiveResult.totalUnclaimedToPool
  );

  ctx.systemWallet.system_pool_balance = roundCurrency(
    ctx.systemWallet.system_pool_balance + totalFundAdded
  );
  ctx.systemWallet.unclaimed_pool_balance = roundCurrency(
    ctx.systemWallet.unclaimed_pool_balance +
      sponsorRedirected +
      unilevelResult.totalUnclaimedToPool +
      monolineIncentiveResult.totalUnclaimedToPool
  );
  ctx.systemWallet.updated_at = nowIso;

  if (ctx.logCommFn) {
    ctx.logCommFn(
      order.order_id,
      buyer,
      null,
      'SYSTEM_POOL',
      null,
      systemFundBase,
      'RELEASED',
      nowIso,
      nowIso,
      'system_wallet (system_pool_balance)'
    );
  }

  const totalDistributed = roundCurrency(
    directSponsorPaid +
      unilevelResult.totalDistributed +
      monolineIncentiveResult.totalDistributed
  );

  return {
    directSponsorPaid,
    unilevelResult,
    monolineIncentiveResult,
    systemFundAdded: totalFundAdded,
    totalDistributed,
  };
}
