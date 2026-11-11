import assert from 'node:assert/strict';
import test from 'node:test';
import { BUSINESS_RULES } from '../config/businessRules';
import {
  distributeMonolineIncentive,
  distributeUnilevelCommissions,
  processOrderCommissions,
  roundCurrency,
  type CommissionCalculationContext,
  type OrderInput,
} from '../services/commissionService';
import { INITIAL_CAREER_TIERS, type MonolineMember } from '../types/monoline';

const now = new Date().toISOString();
const future = new Date(Date.now() + 30 * 86400000).toISOString();

function createTestMember(params: {
  id: number;
  userId: string;
  globalLineId: number;
  sponsorId: string | null;
  careerLevel: number;
  isActive?: boolean;
}): MonolineMember {
  const tier = INITIAL_CAREER_TIERS[params.careerLevel - 1] || INITIAL_CAREER_TIERS[0];
  return {
    id: params.id,
    user_id: params.userId,
    global_line_id: params.globalLineId,
    ref_code: `REF-${params.id}`,
    full_name: `Bayi ${params.id}`,
    email: `bayi${params.id}@example.com`,
    phone: '5550000000',
    city: 'İstanbul',
    joined_at: now,
    sponsor_id: params.sponsorId,
    sponsor_db_id: params.sponsorId ? 1 : null,
    highest_package_id: 'PKG_MINI_DENEME',
    session_credits: 100,
    personal_volume: 500,
    group_volume: 2000,
    active_direct_referrals: 2,
    career_level: params.careerLevel,
    career_title: tier.title,
    max_career_level: params.careerLevel,
    max_career_title: tier.title,
    active_career_level: params.careerLevel,
    active_career_title: tier.title,
    manual_career_override: null,
    unlocked_depth: tier.unlockedDepth,
    wallets: {
      sponsor_wallet: 0,
      monoline_wallet: 0,
      unilevel_wallet: 0,
      monoline_incentive_wallet: 0,
      career_pool_wallet: 0,
      total_earnings: 0,
      system_fund_balance: 0,
      total_withdrawn: 0,
    },
    bank_details: {
      iban_holder_name: `Bayi ${params.id}`,
      bank_name: 'Ziraat',
      iban: 'TR330001000000000000000000',
      trc20_address: '',
      preferred_method: 'IBAN',
    },
    two_factor: {
      enabled: false,
      secret_key: '',
      verified_at: null,
      backup_codes: [],
    },
    is_active: params.isActive ?? true,
    is_locked: false,
    activity_expires_at: future,
  };
}

test('BUSINESS_RULES: Çift motorlu hibrit komisyon parametreleri eksiksiz ve doğru oranlara sahip', () => {
  // Motor 1: Sponsorlu Unilevel 7 Derinlik (Toplam %25)
  assert.deepEqual(BUSINESS_RULES.UNILEVEL_DEPTH_PERCENTAGES, [7, 5, 4, 3, 2, 2, 2]);
  const unilevelTotal = BUSINESS_RULES.UNILEVEL_DEPTH_PERCENTAGES.reduce((sum, p) => sum + p, 0);
  assert.equal(unilevelTotal, 25);

  // Motor 2: Küresel Monoline Sıra Teşviki (Toplam %5)
  assert.deepEqual(BUSINESS_RULES.MONOLINE_INCENTIVE_PERCENTAGES, [1.50, 1.00, 0.80, 0.60, 0.50, 0.30, 0.30]);
  const monolineTotal = roundCurrency(BUSINESS_RULES.MONOLINE_INCENTIVE_PERCENTAGES.reduce((sum, p) => sum + p, 0));
  assert.equal(monolineTotal, 5.00);

  // Sabitler
  assert.equal(BUSINESS_RULES.DIRECT_SPONSOR_BONUS_PERCENT, 20);
  assert.equal(BUSINESS_RULES.SYSTEM_FUND_PERCENT, 5);
  assert.equal(BUSINESS_RULES.CLAWBACK_PROTECTION_DAYS, 14);
  assert.equal(BUSINESS_RULES.MAX_SINGLE_LEG_PERCENT, 50);
});

test('Motor 1: Sponsorlu Unilevel 7 basamağı tarar, 8. basamağa geçmez ve kilitleri uygular', () => {
  // 9 üyeli dikey sponsor zinciri oluşturalım: U9 -> U8 -> U7 -> ... -> U1 -> U0 (Sipariş veren)
  // U0: Sipariş veren
  // U1: Seviye 7 (Kâmile - 7 derinlik açık)
  // U2: Seviye 7
  // U3: Seviye 1 (Emmâre - sadece 1 derinlik açar! U0'a göre derinlik 3 olduğundan kilitli kalacak)
  // U4: Seviye 7
  // U5: Seviye 7
  // U6: Seviye 7
  // U7: Seviye 7 (7. Derinlik)
  // U8: Seviye 7 (8. Derinlik - taranmamalı, prim almamalı)
  const members: MonolineMember[] = [
    createTestMember({ id: 0, userId: 'USER-0', globalLineId: 10, sponsorId: 'USER-1', careerLevel: 1 }),
    createTestMember({ id: 1, userId: 'USER-1', globalLineId: 9, sponsorId: 'USER-2', careerLevel: 7 }),
    createTestMember({ id: 2, userId: 'USER-2', globalLineId: 8, sponsorId: 'USER-3', careerLevel: 7 }),
    createTestMember({ id: 3, userId: 'USER-3', globalLineId: 7, sponsorId: 'USER-4', careerLevel: 1 }), // Seviye 1: kilitli
    createTestMember({ id: 4, userId: 'USER-4', globalLineId: 6, sponsorId: 'USER-5', careerLevel: 7 }),
    createTestMember({ id: 5, userId: 'USER-5', globalLineId: 5, sponsorId: 'USER-6', careerLevel: 7 }),
    createTestMember({ id: 6, userId: 'USER-6', globalLineId: 4, sponsorId: 'USER-7', careerLevel: 7 }),
    createTestMember({ id: 7, userId: 'USER-7', globalLineId: 3, sponsorId: 'USER-8', careerLevel: 7 }),
    createTestMember({ id: 8, userId: 'USER-8', globalLineId: 2, sponsorId: 'USER-9', careerLevel: 7 }),
    createTestMember({ id: 9, userId: 'USER-9', globalLineId: 1, sponsorId: null, careerLevel: 7 }),
  ];

  const loggedTypes: string[] = [];
  const ctx: CommissionCalculationContext = {
    members,
    commissionLogs: [],
    unclaimedCommissions: [],
    systemWallet: { system_pool_balance: 0, unclaimed_pool_balance: 0, updated_at: now },
    enforceCareerDepthLock: true,
    logCommFn: (_orderId, _src, _tgt, type) => {
      loggedTypes.push(type);
    },
  };

  const order: OrderInput = {
    order_id: 'ORD-TEST-001',
    user_id: 'USER-0',
    order_amount: 1000,
  };

  const result = distributeUnilevelCommissions(order, members[0], ctx);

  // Kesinlikle tam 7 derinlik çıktısı olmalı
  assert.equal(result.payouts.length, 7);

  // 1. Derinlik: %7 -> 70 USD, USER-1 hak etti
  assert.equal(result.payouts[0].depth, 1);
  assert.equal(result.payouts[0].calculated_amount, 70);
  assert.equal(result.payouts[0].recipient_user_id, 'USER-1');
  assert.equal(result.payouts[0].status, 'PAID_TO_MEMBER');

  // 2. Derinlik: %5 -> 50 USD, USER-2 hak etti
  assert.equal(result.payouts[1].depth, 2);
  assert.equal(result.payouts[1].calculated_amount, 50);
  assert.equal(result.payouts[1].recipient_user_id, 'USER-2');
  assert.equal(result.payouts[1].status, 'PAID_TO_MEMBER');

  // 3. Derinlik: %4 -> 40 USD, USER-3 seviye 1 olduğu için kilitli (TRANSFERRED_TO_POOL_CAREER_LOCK)
  assert.equal(result.payouts[2].depth, 3);
  assert.equal(result.payouts[2].calculated_amount, 40);
  assert.equal(result.payouts[2].recipient_user_id, 'USER-3');
  assert.equal(result.payouts[2].status, 'TRANSFERRED_TO_POOL_CAREER_LOCK');
  assert.equal(result.payouts[2].transfer_reason_code, 'POOL_TRANSFER_NO_YETKI');

  // 7. Derinlik: %2 -> 20 USD, USER-7 hak etti
  assert.equal(result.payouts[6].depth, 7);
  assert.equal(result.payouts[6].calculated_amount, 20);
  assert.equal(result.payouts[6].recipient_user_id, 'USER-7');

  // 8. Derinlik (USER-8) asla taranmamış olmalı
  const user8Payout = result.payouts.find((p) => p.recipient_user_id === 'USER-8');
  assert.equal(user8Payout, undefined);

  // Loglanan tüm kayıtlar UNILEVEL_COMMISSION olmalı
  assert.ok(loggedTypes.length > 0);
  assert.ok(loggedTypes.every((t) => t === 'UNILEVEL_COMMISSION'));
});

test('Motor 2: Küresel Monoline üst sıradaki 7 üyeyi sıralı tarar, eksik veya pasif üye tutarını havuza aktarır', () => {
  // Sipariş veren: Global #50
  // Üst sıralar: Global #49, #48 (pasif), #47, #46. Sadece 4 üst üye var, diğer 3 sıra boş kalacak.
  const members: MonolineMember[] = [
    createTestMember({ id: 50, userId: 'USER-50', globalLineId: 50, sponsorId: null, careerLevel: 1 }),
    createTestMember({ id: 49, userId: 'USER-49', globalLineId: 49, sponsorId: null, careerLevel: 1, isActive: true }),
    createTestMember({ id: 48, userId: 'USER-48', globalLineId: 48, sponsorId: null, careerLevel: 1, isActive: false }), // pasif
    createTestMember({ id: 47, userId: 'USER-47', globalLineId: 47, sponsorId: null, careerLevel: 1, isActive: true }),
    createTestMember({ id: 46, userId: 'USER-46', globalLineId: 46, sponsorId: null, careerLevel: 1, isActive: true }),
  ];

  const loggedTypes: string[] = [];
  const ctx: CommissionCalculationContext = {
    members,
    commissionLogs: [],
    unclaimedCommissions: [],
    systemWallet: { system_pool_balance: 0, unclaimed_pool_balance: 0, updated_at: now },
    logCommFn: (_orderId, _src, _tgt, type) => {
      loggedTypes.push(type);
    },
  };

  const order: OrderInput = {
    order_id: 'ORD-TEST-002',
    user_id: 'USER-50',
    order_amount: 1000,
  };

  const result = distributeMonolineIncentive(order, members[0], ctx);

  assert.equal(result.payouts.length, 7);

  // 1. Üst Sıra (#49): %1.50 -> 15 USD, aktif üye ödendi
  assert.equal(result.payouts[0].depth, 1);
  assert.equal(result.payouts[0].rate_percent, 1.50);
  assert.equal(result.payouts[0].calculated_amount, 15);
  assert.equal(result.payouts[0].recipient_user_id, 'USER-49');
  assert.equal(result.payouts[0].status, 'PAID_TO_MEMBER');

  // 2. Üst Sıra (#48): %1.00 -> 10 USD, pasif üye -> POOL_TRANSFER_NO_UPLINE
  assert.equal(result.payouts[1].depth, 2);
  assert.equal(result.payouts[1].rate_percent, 1.00);
  assert.equal(result.payouts[1].calculated_amount, 10);
  assert.equal(result.payouts[1].status, 'TRANSFERRED_TO_POOL_NO_UPLINE');
  assert.equal(result.payouts[1].transfer_reason_code, 'POOL_TRANSFER_NO_UPLINE');

  // 3. Üst Sıra (#47): %0.80 -> 8 USD, aktif
  assert.equal(result.payouts[2].calculated_amount, 8);
  assert.equal(result.payouts[2].recipient_user_id, 'USER-47');
  assert.equal(result.payouts[2].status, 'PAID_TO_MEMBER');

  // 4. Üst Sıra (#46): %0.60 -> 6 USD, aktif
  assert.equal(result.payouts[3].calculated_amount, 6);
  assert.equal(result.payouts[3].recipient_user_id, 'USER-46');
  assert.equal(result.payouts[3].status, 'PAID_TO_MEMBER');

  // 5, 6, 7. Üst Sıralar: Üst üye yok -> POOL_TRANSFER_NO_UPLINE
  assert.equal(result.payouts[4].status, 'TRANSFERRED_TO_POOL_NO_UPLINE');
  assert.equal(result.payouts[5].status, 'TRANSFERRED_TO_POOL_NO_UPLINE');
  assert.equal(result.payouts[6].status, 'TRANSFERRED_TO_POOL_NO_UPLINE');

  // Loglanan tüm kayıtlar MONOLINE_INCENTIVE olmalı
  assert.ok(loggedTypes.length > 0);
  assert.ok(loggedTypes.every((t) => t === 'MONOLINE_INCENTIVE'));
});

test('processOrderCommissions: Tüm motorları tek atomik işlemde çalıştırır (%20 Sponsor + %25 Motor1 + %5 Motor2 + %5 Fon)', () => {
  const buyer = createTestMember({ id: 10, userId: 'USER-10', globalLineId: 10, sponsorId: 'USER-9', careerLevel: 1 });
  const sponsor = createTestMember({ id: 9, userId: 'USER-9', globalLineId: 9, sponsorId: null, careerLevel: 7 });

  const members = [buyer, sponsor];
  const ctx: CommissionCalculationContext = {
    members,
    commissionLogs: [],
    unclaimedCommissions: [],
    systemWallet: { system_pool_balance: 0, unclaimed_pool_balance: 0, updated_at: now },
  };

  const order: OrderInput = {
    order_id: 'ORD-FULL-001',
    user_id: 'USER-10',
    order_amount: 1000,
  };

  const result = processOrderCommissions(order, buyer, ctx);

  // 1. Direkt Sponsor: %20 -> 200 USD
  assert.equal(result.directSponsorPaid, 200);

  // 2. Motor 1 (Unilevel %25): 7 derinlik toplamı = 250 USD
  const m1Total = roundCurrency(result.unilevelResult.totalDistributed + result.unilevelResult.totalUnclaimedToPool);
  assert.equal(m1Total, 250);

  // 3. Motor 2 (Monoline Teşvik %5): 7 sıra toplamı = 50 USD
  const m2Total = roundCurrency(result.monolineIncentiveResult.totalDistributed + result.monolineIncentiveResult.totalUnclaimedToPool);
  assert.equal(m2Total, 50);

  // 4. Sistem Fonu Base: %5 -> 50 USD (+ aktarılan boş upline'lar)
  assert.ok(result.systemFundAdded >= 50);
});

test('Motor 1: Dinamik Sıkıştırma (dynamicCompression: true) pasif sponsoru atlayarak aktif lidere öder', () => {
  // Alıcı: USER-B
  // 1. Sponsor (USER-P1): PASİF (isActive: false) -> Atlanmalı (Sıkıştırılmalı)
  // 2. Sponsor (USER-A1): AKTİF (isActive: true, Level 7) -> 1. Derinliği (%7) almalı
  const buyer = createTestMember({ id: 100, userId: 'USER-B', globalLineId: 100, sponsorId: 'USER-P1', careerLevel: 1 });
  const passiveSponsor = createTestMember({ id: 99, userId: 'USER-P1', globalLineId: 99, sponsorId: 'USER-A1', careerLevel: 7, isActive: false });
  const activeLeader = createTestMember({ id: 98, userId: 'USER-A1', globalLineId: 98, sponsorId: null, careerLevel: 7, isActive: true });

  const members = [buyer, passiveSponsor, activeLeader];
  const ctx: CommissionCalculationContext = {
    members,
    commissionLogs: [],
    unclaimedCommissions: [],
    systemWallet: { system_pool_balance: 0, unclaimed_pool_balance: 0, updated_at: now },
    dynamicCompression: true,
  };

  const order: OrderInput = {
    order_id: 'ORD-COMPRESS-001',
    user_id: 'USER-B',
    order_amount: 1000,
  };

  const result = distributeUnilevelCommissions(order, buyer, ctx);

  // 1. Derinlik: %7 -> 70 USD, Pasif P1 atlandı, doğrudan Aktif A1'e bağlandı
  assert.equal(result.payouts[0].depth, 1);
  assert.equal(result.payouts[0].calculated_amount, 70);
  assert.equal(result.payouts[0].recipient_user_id, 'USER-A1');
  assert.equal(result.payouts[0].status, 'PAID_TO_MEMBER');

  // Kalan 6 derinlikte başka üst üye olmadığı için havuza aktarıldı
  assert.equal(result.payouts[1].status, 'TRANSFERRED_TO_POOL_NO_UPLINE');
});

test('Motor 2: Dinamik Aktif Tarama (skipPassiveMonoline: true) pasif üyeyi atlayarak aktif sıraları ödüllendirir', () => {
  // Sipariş veren: Global #50
  // Üst sıralar: Global #49 (aktif), #48 (pasif), #47 (aktif), #46 (aktif)
  // skipPassiveMonoline: true olduğunda #48 atlanır; slot 2'ye #47 yerleşir ve PAID_TO_MEMBER olur
  const members: MonolineMember[] = [
    createTestMember({ id: 50, userId: 'USER-50', globalLineId: 50, sponsorId: null, careerLevel: 1 }),
    createTestMember({ id: 49, userId: 'USER-49', globalLineId: 49, sponsorId: null, careerLevel: 1, isActive: true }),
    createTestMember({ id: 48, userId: 'USER-48', globalLineId: 48, sponsorId: null, careerLevel: 1, isActive: false }), // pasif
    createTestMember({ id: 47, userId: 'USER-47', globalLineId: 47, sponsorId: null, careerLevel: 1, isActive: true }),
    createTestMember({ id: 46, userId: 'USER-46', globalLineId: 46, sponsorId: null, careerLevel: 1, isActive: true }),
  ];

  const ctx: CommissionCalculationContext = {
    members,
    commissionLogs: [],
    unclaimedCommissions: [],
    systemWallet: { system_pool_balance: 0, unclaimed_pool_balance: 0, updated_at: now },
    skipPassiveMonoline: true,
  };

  const order: OrderInput = {
    order_id: 'ORD-MONO-SKIP-001',
    user_id: 'USER-50',
    order_amount: 1000,
  };

  const result = distributeMonolineIncentive(order, members[0], ctx);

  // 1. Sıra: #49 (%1.50 -> 15 USD)
  assert.equal(result.payouts[0].recipient_user_id, 'USER-49');
  assert.equal(result.payouts[0].status, 'PAID_TO_MEMBER');

  // 2. Sıra: #48 pasif olduğu için atlandı; 2. sıraya aktif olan #47 geldi (%1.00 -> 10 USD)
  assert.equal(result.payouts[1].recipient_user_id, 'USER-47');
  assert.equal(result.payouts[1].status, 'PAID_TO_MEMBER');

  // 3. Sıra: Aktif #46 (%0.80 -> 8 USD)
  assert.equal(result.payouts[2].recipient_user_id, 'USER-46');
  assert.equal(result.payouts[2].status, 'PAID_TO_MEMBER');
});

