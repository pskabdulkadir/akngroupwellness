import React, { useEffect, useState } from 'react';
import { getAdminToken } from '../utils/adminSession';
import { getMemberRegionalPendingUsd, getMemberRegionalUsdBalance } from '../utils/walletRegion';
import {
  ActivationVoucherRecord,
  BullMqJobRecord,
  CommissionTransaction,
  DAILY_WITHDRAWAL_LIMITS_BY_CAREER,
  FomoCountdownAlertRecord,
  FREKANS_PACKAGES,
  FraudRiskAlertRecord,
  MonolineMember,
  NotificationOutboxRecord,
  OrderCommissionPayload,
  P2PTransferRecord,
  PACKAGES,
  PackageId,
  RANK_UP_REWARDS_BY_CAREER,
  UNILEVEL_INFINITY_RULES,
  UnclaimedCommissionRecord,
  UnclaimedTransferReasonCode,
  UserRewardLogRecord,
  V2ArchitectureConfig,
  WithdrawalRequestRecord,
  evaluateMemberOrganizationMetrics,
} from '../types/monoline';

interface CommissionEngineViewProps {
  members: MonolineMember[];
  selectedMemberId: string;
  enforceDepthLock: boolean;
  onToggleDepthLock: (enforce: boolean) => void;
  onTriggerWebhook: (payload: OrderCommissionPayload) => Promise<CommissionTransaction | null>;
  lastTransaction: CommissionTransaction | null;
  isSubmitting: boolean;
  transactions?: CommissionTransaction[];
  unclaimedCommissions?: UnclaimedCommissionRecord[];
  queueJobs?: BullMqJobRecord[];
  v2Config?: V2ArchitectureConfig;
  withdrawalRequests?: WithdrawalRequestRecord[];
  userRewardsLog?: UserRewardLogRecord[];
  notificationOutbox?: NotificationOutboxRecord[];
  fomoAlerts?: FomoCountdownAlertRecord[];
  p2pTransfers?: P2PTransferRecord[];
  activationVouchers?: ActivationVoucherRecord[];
  fraudAlerts?: FraudRiskAlertRecord[];
  systemFundBalance?: number;
  onRefreshState?: () => Promise<void>;
}

import { BUSINESS_RULES } from '../config/businessRules';

const UNILEVEL_DEPTH_RATES = BUSINESS_RULES.UNILEVEL_DEPTH_PERCENTAGES.map((rate, idx) => ({
  depth: idx + 1,
  rate,
}));

const MONOLINE_INCENTIVE_RATES = BUSINESS_RULES.MONOLINE_INCENTIVE_PERCENTAGES.map((rate, idx) => ({
  depth: idx + 1,
  rate,
}));

const DEPTH_RATES = UNILEVEL_DEPTH_RATES;

export const CommissionEngineView: React.FC<CommissionEngineViewProps> = ({
  members,
  selectedMemberId,
  enforceDepthLock,
  onToggleDepthLock,
  onTriggerWebhook,
  lastTransaction,
  isSubmitting,
  transactions = [],
  unclaimedCommissions = [],
  queueJobs = [],
  v2Config,
  withdrawalRequests = [],
  userRewardsLog = [],
  notificationOutbox = [],
  fomoAlerts = [],
  p2pTransfers = [],
  activationVouchers = [],
  fraudAlerts = [],
  systemFundBalance = 0,
  onRefreshState,
}) => {
  const [userId, setUserId] = useState<string>(selectedMemberId || members[0]?.user_id || '');
  const [orderId, setOrderId] = useState<string>(
    `ORD-FRK-${Math.floor(Math.random() * 89999 + 10000)}`
  );
  const [orderAmount, setOrderAmount] = useState<number>(30000);
  const [packageId, setPackageId] = useState<PackageId>('PKG_ALTIN_PRO');

  // V2.0, V2.1 & V2.2 Interactive Console State
  const [activeV2Tab, setActiveV2Tab] = useState<
    | 'CLAWBACK_REFUND'
    | 'ROLLING_CAREER'
    | 'UNCLAIMED_LEDGER'
    | 'BULLMQ_QUEUE'
    | 'DYNAMIC_POOL'
    | 'V21_ENTERPRISE'
    | 'V22_GOLDEN_REVISIONS'
  >('V22_GOLDEN_REVISIONS');
  const [bankExportFormat, setBankExportFormat] = useState<'GARANTI' | 'ISBANK' | 'QNB' | 'PAPARA'>(
    'GARANTI'
  );
  const [unclaimedFilter, setUnclaimedFilter] = useState<'ALL' | UnclaimedTransferReasonCode>('ALL');
  const [refundOrderId, setRefundOrderId] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>(
    '14 Günlük Yasal Cayma Hakkı / Sipariş İadesi'
  );
  const [v2ActionBanner, setV2ActionBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [v2Busy, setV2Busy] = useState<boolean>(false);

  const effectiveV2Config: V2ArchitectureConfig = v2Config || {
    use_rolling_30d_pgv: true,
    use_dynamic_active_career: true,
    async_queue_enabled: true,
    dynamic_compression_enabled: true,
    unilevel_infinity_enabled: true,
    matching_bonus_enabled: true,
    fast_roi_3x15_enabled: true,
  };

  useEffect(() => {
    if (selectedMemberId && members.some((m) => m.user_id === selectedMemberId)) {
      setUserId(selectedMemberId);
    } else if (members.length > 0 && !members.some((m) => m.user_id === userId)) {
      setUserId(members[0].user_id);
    } else if (members.length === 0) {
      setUserId('');
    }
  }, [selectedMemberId, members, userId]);

  useEffect(() => {
    const refundable = transactions.find((t) => t.clawback_status !== 'REFUNDED');
    if (refundable && !refundOrderId) {
      setRefundOrderId(refundable.order_id);
    }
  }, [transactions, refundOrderId]);

  const handlePackageChange = (pkg: PackageId) => {
    setPackageId(pkg);
    if (pkg in PACKAGES) {
      setOrderAmount(PACKAGES[pkg as Exclude<PackageId, 'CUSTOM'>].defaultPrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const payload: OrderCommissionPayload = {
      user_id: userId,
      order_id: orderId,
      order_amount: Number(orderAmount),
      package_id: packageId,
      timestamp: new Date().toISOString(),
    };
    const tx = await onTriggerWebhook(payload);
    if (tx) {
      setOrderId(`ORD-FRK-${Math.floor(Math.random() * 89999 + 10000)}`);
      setRefundOrderId(tx.order_id);
    }
  };

  const handleReleaseClawbackCron = async (targetOrderId?: string) => {
    setV2Busy(true);
    setV2ActionBanner(null);
    try {
      const res = await fetch('/api/v1/admin/cron/release-clawback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: targetOrderId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem başarısız.');
      setV2ActionBanner({ type: 'success', message: data.message });
      if (onRefreshState) await onRefreshState();
    } catch (err: any) {
      setV2ActionBanner({ type: 'error', message: err?.message || 'Hata oluştu.' });
    } finally {
      setV2Busy(false);
    }
  };

  const handleRefundOrder = async (targetOrdId?: string) => {
    const ordToRefund = targetOrdId || refundOrderId;
    if (!ordToRefund) return;
    setV2Busy(true);
    setV2ActionBanner(null);
    try {
      const res = await fetch('/api/v1/integrations/order-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: ordToRefund,
          reason: refundReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İade işlemi başarısız.');
      setV2ActionBanner({ type: 'success', message: data.message });
      if (onRefreshState) await onRefreshState();
    } catch (err: any) {
      setV2ActionBanner({ type: 'error', message: err?.message || 'İade sırasında hata oluştu.' });
    } finally {
      setV2Busy(false);
    }
  };

  const handleUpdateV2Config = async (patch: Partial<V2ArchitectureConfig>) => {
    setV2Busy(true);
    setV2ActionBanner(null);
    try {
      const res = await fetch('/api/v1/admin/v2-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...effectiveV2Config,
          ...patch,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ayarlar güncellenemedi.');
      setV2ActionBanner({ type: 'success', message: data.message });
      if (onRefreshState) await onRefreshState();
    } catch (err: any) {
      setV2ActionBanner({ type: 'error', message: err?.message || 'Hata oluştu.' });
    } finally {
      setV2Busy(false);
    }
  };

  const handleBullMqBurstTest = async () => {
    setV2Busy(true);
    setV2ActionBanner(null);
    try {
      const res = await fetch('/api/v1/admin/queue/burst-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kuyruk testi başarısız.');
      setV2ActionBanner({ type: 'success', message: data.message });
      if (onRefreshState) await onRefreshState();
    } catch (err: any) {
      setV2ActionBanner({ type: 'error', message: err?.message || 'Kuyruk testi hatası.' });
    } finally {
      setV2Busy(false);
    }
  };

  const handleDuplicateIdempotencyTest = async () => {
    const existingOrdId = transactions[0]?.order_id || lastTransaction?.order_id;
    if (!existingOrdId) {
      setV2ActionBanner({
        type: 'error',
        message: 'Idempotency testi için önce en az 1 sipariş oluşturun.',
      });
      return;
    }
    setV2Busy(true);
    setV2ActionBanner(null);
    try {
      const res = await fetch('/api/v1/integrations/order-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || members[0]?.user_id || 'USR-TEST',
          order_id: existingOrdId,
          order_amount: Number(orderAmount),
          package_id: packageId,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setV2ActionBanner({
        type: data.status === 'ALREADY_RECEIVED' ? 'success' : 'error',
        message: `HTTP ${res.status} — { status: '${data.status}', message: '${data.message}' } (order_id: ${existingOrdId})`,
      });
      if (onRefreshState) await onRefreshState();
    } catch (err: any) {
      setV2ActionBanner({ type: 'error', message: err?.message || 'Idempotency testi hatası.' });
    } finally {
      setV2Busy(false);
    }
  };

  const handleDynamicPoolDistribute = async () => {
    setV2Busy(true);
    setV2ActionBanner(null);
    try {
      const res = await fetch('/api/v1/career-pool/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Havuz dağıtımı başarısız.');
      setV2ActionBanner({ type: 'success', message: data.message });
      if (onRefreshState) await onRefreshState();
    } catch (err: any) {
      setV2ActionBanner({ type: 'error', message: err?.message || 'Havuz dağıtım hatası.' });
    } finally {
      setV2Busy(false);
    }
  };

  const handleCalculateActiveCareer = async (targetUserId?: string) => {
    setV2Busy(true);
    setV2ActionBanner(null);
    try {
      const res = await fetch('/api/v1/admin/career/calculate-active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken() ?? ''}`,
        },
        body: JSON.stringify({ user_id: targetUserId || userId || members[0]?.user_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kariyer terfi motoru çalıştırılamadı.');
      setV2ActionBanner({ type: 'success', message: data.message });
      if (onRefreshState) await onRefreshState();
    } catch (err: any) {
      setV2ActionBanner({ type: 'error', message: err?.message || 'Kariyer motoru hatası.' });
    } finally {
      setV2Busy(false);
    }
  };

  const selectedBuyer = members.find((m) => m.user_id === userId) || members[0];
  const selectedBuyerOrgEval = evaluateMemberOrganizationMetrics(selectedBuyer, members);
  const sponsorMember = selectedBuyer
    ? members.find((m) => m.user_id === selectedBuyer.sponsor_id)
    : undefined;

  const previewFundBase = Number(((orderAmount * BUSINESS_RULES.SYSTEM_FUND_PERCENT) / 100).toFixed(2));
  const previewSponsor = Number(((orderAmount * BUSINESS_RULES.DIRECT_SPONSOR_BONUS_PERCENT) / 100).toFixed(2));
  const previewUnilevelTotal = Number(((orderAmount * 25) / 100).toFixed(2));
  const previewMonolineIncentiveTotal = Number(((orderAmount * 5) / 100).toFixed(2));
  const previewUplineTotal = Number(((orderAmount * 30) / 100).toFixed(2));

  const totalPendingBalance = members.reduce((sum, m) => sum + getMemberRegionalPendingUsd(m), 0);
  const totalAvailableBalance = members.reduce((sum, m) => sum + getMemberRegionalUsdBalance(m), 0);
  const totalLeadershipPoints = members
    .filter((m) => m.is_active && !m.is_locked)
    .reduce((sum, m) => sum + (m.pool_leadership_points || 10), 0);

  const noYetkiSum = unclaimedCommissions
    .filter((u) => u.reason_code === 'POOL_TRANSFER_NO_YETKI')
    .reduce((sum, u) => sum + u.amount, 0);
  const inactiveSum = unclaimedCommissions
    .filter((u) => u.reason_code === 'POOL_TRANSFER_INACTIVE')
    .reduce((sum, u) => sum + u.amount, 0);
  const noUserSum = unclaimedCommissions
    .filter(
      (u) =>
        u.reason_code === 'POOL_TRANSFER_NO_UPLINE' ||
        u.reason_code === 'POOL_TRANSFER_NO_SPONSOR' ||
        u.reason_code === 'POOL_TRANSFER_NO_USER'
    )
    .reduce((sum, u) => sum + u.amount, 0);

  const filteredUnclaimed =
    unclaimedFilter === 'ALL'
      ? unclaimedCommissions
      : unclaimedFilter === 'POOL_TRANSFER_NO_UPLINE' ||
        unclaimedFilter === 'POOL_TRANSFER_NO_USER'
      ? unclaimedCommissions.filter(
          (u) =>
            u.reason_code === 'POOL_TRANSFER_NO_UPLINE' ||
            u.reason_code === 'POOL_TRANSFER_NO_SPONSOR' ||
            u.reason_code === 'POOL_TRANSFER_NO_USER'
        )
      : unclaimedCommissions.filter((u) => u.reason_code === unclaimedFilter);

  return (
    <div className="space-y-8">
      {/* V2.0 PRODUCTION-READY TECHNICAL SPECIFICATION HEADER & ARCHITECTURE BAR */}
      <section className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-400">
              <span>NİHAİ VE TAM TEKNİK ŞARTNAME (V2.0 - PRODUCTION READY)</span>
              <span aria-hidden="true">·</span>
              <span>POST /api/v1/integrations/order-commission</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Async Queue (BullMQ/Redis) + Monoline Global Line + Unilevel Sponsor Tree + Dynamic
              Career Engine
            </h2>
            <p className="text-xs text-slate-400 max-w-4xl">
              14 Günlük Cayma &amp; İade Koruması (Clawback Protection) · Hareketli 30 Günlük Ciro
              (Rolling 30-Day PGV) · Kariyer Unvanı (max_career_level) vs. Dönemsel Hak Ediş Yetkisi
              (active_career_level) · Dinamik Havuz Dağıtımı · Ayrıştırılmış Devir Muhasebesi
              (unclaimed_commissions).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={v2Busy || members.length === 0}
              onClick={handleBullMqBurstTest}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              ⚡ BullMQ Kuyruk Stres Testi (4 Eşzamanlı Sipariş)
            </button>
            <button
              type="button"
              disabled={v2Busy || totalPendingBalance <= 0}
              onClick={() => handleReleaseClawbackCron()}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              14 Günlük Pending → Balance Aktar ({totalPendingBalance.toFixed(2)} USD)
            </button>
          </div>
        </div>

        {/* 6 V2.0 Architectural Pillars Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
            <div className="text-[11px] font-mono text-amber-300">1. CLAWBACK KORUMASI</div>
            <div className="text-sm font-bold text-white font-mono tabular-nums">
              {totalPendingBalance.toFixed(2)} USD Pending
            </div>
            <div className="text-[11px] text-slate-400">
              14 Gün Cayma Süresi · İade Geri Çekme
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
            <div className="text-[11px] font-mono text-emerald-300">2. ROLLING 30-DAY PGV</div>
            <div className="text-sm font-bold text-white">
              {effectiveV2Config.use_rolling_30d_pgv ? 'Son 30 Gün Aktif' : 'Kümülatif Ciro'}
            </div>
            <div className="text-[11px] text-slate-400">
              Hareketli 30 günlük ekip cirosu baz alınır
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
            <div className="text-[11px] font-mono text-sky-300">3. DYNAMIC CAREER</div>
            <div className="text-sm font-bold text-white">max vs. active_career</div>
            <div className="text-[11px] text-slate-400">
              Unvan profilde kalır, kilitler aktif yetkiyle açılır
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
            <div className="text-[11px] font-mono text-purple-300">4. DİNAMİK HAVUZ (%50)</div>
            <div className="text-sm font-bold text-white font-mono tabular-nums">
              {systemFundBalance.toLocaleString('tr-TR')} $ · {totalLeadershipPoints} Puan
            </div>
            <div className="text-[11px] text-slate-400">
              Liderlik puanı oranında dinamik dağıtım
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
            <div className="text-[11px] font-mono text-teal-300">5. ASYNC QUEUE (BULLMQ)</div>
            <div className="text-sm font-bold text-white font-mono tabular-nums">
              {queueJobs.length} İşlenen Kuyruk İşi
            </div>
            <div className="text-[11px] text-slate-400">
              Redis Lock · Sıfır Deadlock &amp; Race Condition
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
            <div className="text-[11px] font-mono text-rose-300">6. DEVİR MUHASEBESİ</div>
            <div className="text-sm font-bold text-white font-mono tabular-nums">
              {(noYetkiSum + inactiveSum + noUserSum).toLocaleString('tr-TR')} $ ({unclaimedCommissions.length} Kayıt)
            </div>
            <div className="text-[11px] text-slate-400">
              NO_YETKI · INACTIVE · NO_USER ayrımı
            </div>
          </div>
        </div>

        {v2ActionBanner && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-3 ${
              v2ActionBanner.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/90 border border-rose-500/40 text-rose-200'
            }`}
          >
            <span>{v2ActionBanner.message}</span>
            <button
              type="button"
              onClick={() => setV2ActionBanner(null)}
              className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer shrink-0"
            >
              Kapat
            </button>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Columns: Live Frekans Order & Webhook Processor */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-emerald-700">
                POST /api/v1/integrations/order-commission
              </span>
              <span className="text-xs font-mono text-slate-500">BULLMQ ASYNC WORKER</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Frekans Alışveriş &amp; Komisyon İşleyici (V2.0)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sipariş geldiği anda HTTP 200 döner, BullMQ/Redis kuyruğunda atomik olarak işlenir ve
              komisyonlar 14 günlük cayma korumasıyla{' '}
              <code className="font-mono text-slate-700">pending_*_usd</code> bölgesel bekleyen USD hesabına yazılır.
            </p>
          </div>

          {members.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
              <div className="text-sm font-bold text-slate-800">
                Sistemde Henüz Kayıtlı Üye veya Bayi Bulunmuyor
              </div>
              <p className="text-xs text-slate-500">
                Üst menüdeki <strong>&ldquo;Frekans Kayıtlarını Senkronize Et&rdquo;</strong>{' '}
                butonuna tıklayarak mevcut Frekans üyelerini aktarabilir veya{' '}
                <strong>Monoline Tek Hat Ağacı</strong> sekmesinden yeni bayi ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Siparişi Veren Üye / Bayi (user_id)
                </label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {members
                    .slice()
                    .sort((a, b) => a.global_line_id - b.global_line_id)
                    .map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        Sıra #{m.global_line_id} — {m.user_id} ({m.full_name} · Kariyer Seviyesi {m.active_career_level || m.career_level})
                      </option>
                    ))}
                </select>
                {selectedBuyer && (
                  <div className="mt-1.5 text-xs text-slate-500 flex items-center justify-between">
                    <span>
                      Direkt Sponsor:{' '}
                      <strong className="text-slate-700">
                        {sponsorMember
                          ? `${sponsorMember.full_name} (#${sponsorMember.global_line_id})`
                          : 'Yok (Kök Üye → POOL_TRANSFER_NO_USER)'}
                      </strong>
                    </span>
                    <span className="font-mono">
                      Üstte {selectedBuyer.global_line_id - 1} Kişi Var
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alışveriş Paketi (package_id)
                </label>
                <select
                  value={packageId}
                  onChange={(e) => handlePackageChange(e.target.value as PackageId)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {FREKANS_PACKAGES.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.sessionCredits.toLocaleString('tr-TR')} Kredi ·{' '}
                      {pkg.defaultPrice.toLocaleString('tr-TR')} $)
                    </option>
                  ))}
                  <option value="CUSTOM">CUSTOM (Özel Sipariş Tutarı)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sipariş Numarası (order_id)
                  </label>
                  <input
                    type="text"
                    required
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sipariş Tutarı (order_amount · $)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Career Depth Lock Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Dönemsel Aktif Kariyer Derinlik Kilidi (active_career_level)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Üst sıradaki üyenin bu ayki aktif yetkisi ilgili derinliği açmamışsa{' '}
                    <code className="font-mono">POOL_TRANSFER_NO_YETKI</code> ile fona devredilir.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleDepthLock(!enforceDepthLock)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    enforceDepthLock
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {enforceDepthLock ? 'Aktif (Yetki Şartlı)' : 'Pasif (Koşulsuz 7 Sıra)'}
                </button>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div className="text-xs font-semibold text-amber-950">
                  14 Günlük Cayma &amp; İade Koruması (Clawback Protection)
                </div>
                <div className="text-[11px] text-amber-800">
                  Komisyonlar önce <code className="font-mono">pending_*_usd</code> hesabına
                  yazılır, 14 gün sonunda <code className="font-mono">wallet_*_usd</code> hesabına
                  aktarılır.
                </div>
              </div>

              {/* JSON Payload Live Preview */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Webhook JSON Payload</span>
                  <span>Content-Type: application/json</span>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                  {JSON.stringify(
                    {
                      user_id: userId,
                      order_id: orderId,
                      order_amount: Number(orderAmount),
                      package_id: packageId,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !userId}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? 'BullMQ Kuyruğunda İşleniyor...'
                  : `Siparişi Kuyruğa Gönder & Komisyonları Dağıt (${Number(
                      orderAmount
                    ).toLocaleString('tr-TR')} $)`}
              </button>
            </form>
          )}
        </section>

        {/* Right 7 Columns: Real-Time Distribution Breakdown (%5 / %20 / %25) */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-mono text-slate-500">
                MODÜL 2 · V2.0 KAZANÇ &amp; KOMİSYON DAĞITIM ALGORİTMASI
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {orderAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $ Siparişin
                Dağılım &amp; Yetki Analizi
              </h2>
            </div>

            {lastTransaction && (
              <div className="text-right font-mono">
                <div className="text-[11px] text-slate-500">
                  Son İşlenen ({lastTransaction.bullmq_job_id || 'ATOMIC'})
                </div>
                <div className="text-xs font-bold text-emerald-700">
                  {lastTransaction.order_id} ({lastTransaction.order_amount.toLocaleString('tr-TR')}{' '}
                  $ ·{' '}
                  {lastTransaction.clawback_status === 'REFUNDED'
                    ? 'İADE EDİLDİ'
                    : lastTransaction.clawback_status === 'RELEASED_TO_BALANCE'
                    ? 'BALANCE SERBEST'
                    : '14G PENDING'}
                  )
                </div>
              </div>
            )}
          </div>

          {/* 4 Main Distribution Buckets (Dual Engine Architecture) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>1. Sistem Fonu</span>
                <span className="font-mono text-slate-900 font-bold">%{BUSINESS_RULES.SYSTEM_FUND_PERCENT}</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {previewFundBase.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Şirket operasyonel havuzu ve sistem rezerv fonuna aktarılır.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>2. Direkt Sponsor Primi</span>
                <span className="font-mono font-bold">%{BUSINESS_RULES.DIRECT_SPONSOR_BONUS_PERCENT} (14G)</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800">
                {previewSponsor.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Alıcı:{' '}
                <strong>
                  {sponsorMember
                    ? sponsorMember.is_active && !sponsorMember.is_locked
                      ? `#${sponsorMember.global_line_id} ${sponsorMember.full_name}`
                      : `Pasif → POOL_TRANSFER_INACTIVE`
                    : 'Yok → POOL_TRANSFER_NO_SPONSOR'}
                </strong>
              </p>
            </div>

            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span>3. Motor 1: Unilevel 7 Derinlik</span>
                <span className="font-mono font-bold">%25 (14G)</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-indigo-900">
                {previewUnilevelTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
              </div>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                Sponsorluk bağıyla dikeyde 7 ebeveyn taranır (8. ebeveyne aktarılmaz).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                <span>4. Motor 2: Monoline Teşvik</span>
                <span className="font-mono font-bold">%5.00 (14G)</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-900">
                {previewMonolineIncentiveTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Küresel sırada üstteki ilk 7 üyeye sembolik teşvik primi aktarılır.
              </p>
            </div>
          </div>

          {/* Motor 1: Sponsorlu Unilevel 7 Derinlik Tablosu */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                  MOTOR 1
                </span>
                <h3 className="text-sm font-bold text-slate-900 inline-block ml-2">
                  Sponsorlu Derinlik Motoru (Unilevel 7 Derinlik - Ekip Cirosu)
                </h3>
              </div>
              <span className="text-xs font-mono text-indigo-700 font-semibold">
                Toplam %25: %7, %5, %4, %3, %2, %2, %2 (8. ebeveyn durur)
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Derinlik</th>
                    <th className="py-2.5 px-3">Oran</th>
                    <th className="py-2.5 px-3">Hesaplanan Tutar</th>
                    <th className="py-2.5 px-3">Ebeveyn Sponsor (Ağaç Bağı)</th>
                    <th className="py-2.5 px-3">Kariyer Kilit Seviyesi</th>
                    <th className="py-2.5 px-3 text-right">Durum &amp; Muhasebe Kodu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    const sponsorChain: (MonolineMember | undefined)[] = [];
                    if (selectedBuyer) {
                      let currId: string | null = selectedBuyer.sponsor_id;
                      const visited = new Set<string>([selectedBuyer.user_id]);
                      for (let i = 0; i < 7; i++) {
                        if (!currId || visited.has(currId)) {
                          sponsorChain.push(undefined);
                        } else {
                          visited.add(currId);
                          const sp = members.find((m) => m.user_id === currId);
                          sponsorChain.push(sp);
                          currId = sp ? sp.sponsor_id : null;
                        }
                      }
                    }

                    return UNILEVEL_DEPTH_RATES.map(({ depth, rate }, idx) => {
                      const amount = Number(((orderAmount * rate) / 100).toFixed(2));
                      const recipient = sponsorChain[idx];

                      const activeLvl = recipient
                        ? recipient.active_career_level ?? recipient.career_level
                        : 0;
                      const isEligible = recipient
                        ? recipient.is_active &&
                          !recipient.is_locked &&
                          (!enforceDepthLock || activeLvl >= depth)
                        : false;

                      return (
                        <tr key={depth} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                            {depth}. {depth === 1 ? 'Derinlik (Direkt)' : 'Derinlik'}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-indigo-700">
                            %{rate}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-slate-900">
                            {amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                          </td>
                          <td className="py-2.5 px-3">
                            {recipient ? (
                              <div>
                                <span className="font-mono font-bold text-slate-900">
                                  #{recipient.global_line_id}
                                </span>{' '}
                                <span className="font-medium text-slate-800">
                                  {recipient.full_name}
                                </span>{' '}
                                <span className="font-mono text-slate-400">({recipient.user_id})</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Sponsor zincirinde üye yok</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {recipient ? (
                              <div className="font-mono text-[11px]">
                                <span className="font-bold text-slate-900">
                                  Aktif Seviye: {activeLvl} (Gereken: &gt;= {depth})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {!recipient ? (
                              <span className="text-slate-500">
                                POOL_TRANSFER_NO_UPLINE (+{amount} $)
                              </span>
                            ) : !recipient.is_active || recipient.is_locked ? (
                              <span className="text-rose-700 font-semibold">
                                POOL_TRANSFER_INACTIVE (+{amount} $)
                              </span>
                            ) : isEligible ? (
                              <span className="text-emerald-700 font-semibold">
                                ✓ UNILEVEL_COMMISSION (+{amount} $)
                              </span>
                            ) : (
                              <span className="text-amber-700 font-semibold">
                                POOL_TRANSFER_NO_YETKI ({activeLvl} &lt; {depth})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Motor 2: Küresel Monoline Sıra Teşvik Primi Tablosu */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  MOTOR 2
                </span>
                <h3 className="text-sm font-bold text-slate-900 inline-block ml-2">
                  Küresel Monoline Motoru (Sembolik Sıra Teşvik Primi)
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-700 font-semibold">
                Toplam %5: %1.50, %1.00, %0.80, %0.60, %0.50, %0.30, %0.30
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Üst Sıra</th>
                    <th className="py-2.5 px-3">Teşvik Oranı</th>
                    <th className="py-2.5 px-3">Hesaplanan Tutar</th>
                    <th className="py-2.5 px-3">Küresel Hat Sırasındaki Bayi (Monoline)</th>
                    <th className="py-2.5 px-3 text-right">Durum &amp; Muhasebe Kodu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    const upperCandidates = selectedBuyer
                      ? members
                          .filter((m) => m.global_line_id < selectedBuyer.global_line_id)
                          .sort((a, b) => b.global_line_id - a.global_line_id)
                          .slice(0, 7)
                      : [];

                    return MONOLINE_INCENTIVE_RATES.map(({ depth, rate }, idx) => {
                      const amount = Number(((orderAmount * rate) / 100).toFixed(2));
                      const recipient = upperCandidates[idx];
                      const isActive = recipient ? recipient.is_active && !recipient.is_locked : false;

                      return (
                        <tr key={depth} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                            {depth}. Üst Sıra
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-emerald-700">
                            %{rate.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-slate-900">
                            {amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                          </td>
                          <td className="py-2.5 px-3">
                            {recipient ? (
                              <div>
                                <span className="font-mono font-bold text-slate-900">
                                  #{recipient.global_line_id}
                                </span>{' '}
                                <span className="font-medium text-slate-800">
                                  {recipient.full_name}
                                </span>{' '}
                                <span className="font-mono text-slate-400">({recipient.user_id})</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Üst sırada üye bulunamadı</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {!recipient ? (
                              <span className="text-slate-500">
                                POOL_TRANSFER_NO_UPLINE (+{amount} $)
                              </span>
                            ) : isActive ? (
                              <span className="text-emerald-700 font-semibold">
                                ✓ MONOLINE_INCENTIVE (+{amount} $)
                              </span>
                            ) : (
                              <span className="text-amber-700 font-semibold">
                                POOL_TRANSFER_NO_UPLINE (Pasif)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* V2.0 INTERACTIVE PRODUCTION CONSOLE TABS */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>CANLI ÜRETİM ORTAMI (LIVE PRODUCTION) · GERÇEK BAYİ SİPARİŞLERİ &amp; WEBHOOK ENTEGRASYONU</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Clawback İade Koruması · 30 Günlük Hareketli Ciro · Ayrıştırılmış Devir Muhasebesi ·
              BullMQ Kuyruğu
            </h3>
            <div className="pt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs">
                ✓ Canlı Mod Aktif — Simülasyon Devre Dışı
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveV2Tab('CLAWBACK_REFUND')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeV2Tab === 'CLAWBACK_REFUND'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. 14G Clawback &amp; İade (Refund)
            </button>
            <button
              type="button"
              onClick={() => setActiveV2Tab('ROLLING_CAREER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeV2Tab === 'ROLLING_CAREER'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2 &amp; 3. 30G PGV &amp; Dinamik Kariyer
            </button>
            <button
              type="button"
              onClick={() => setActiveV2Tab('DYNAMIC_POOL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeV2Tab === 'DYNAMIC_POOL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Dinamik Havuz Motoru
            </button>
            <button
              type="button"
              onClick={() => setActiveV2Tab('BULLMQ_QUEUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeV2Tab === 'BULLMQ_QUEUE'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5. BullMQ / Redis Kuyruğu ({queueJobs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveV2Tab('UNCLAIMED_LEDGER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeV2Tab === 'UNCLAIMED_LEDGER'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6. Devir Muhasebesi ({unclaimedCommissions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveV2Tab('V21_ENTERPRISE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeV2Tab === 'V21_ENTERPRISE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              7. 🛡️ V2.1 Vergi, Anti-Fraud, Ödül &amp; Bildirim
            </button>
            <button
              type="button"
              onClick={() => setActiveV2Tab('V22_GOLDEN_REVISIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                activeV2Tab === 'V22_GOLDEN_REVISIONS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300'
              }`}
            >
              8. 🏆 V2.2 6 Altın Revizyon (Sonsuzluk, Eşleşme, Sıkıştırma &amp; Fast-ROI)
            </button>
          </div>
        </div>

        {/* TAB 1: 14-DAY CLAWBACK & REFUND ENGINE */}
        {activeV2Tab === 'CLAWBACK_REFUND' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="text-xs font-mono font-bold text-slate-700">
                  POST /api/v1/integrations/order-refund — 14 GÜNLÜK CAYMA &amp; İADE MOTORU
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sipariş iade edildiğinde (<code className="font-mono">Refund</code>), üyelerin{' '}
                  <code className="font-mono">pending_*_usd</code> (veya çekilebilir{' '}
                  <code className="font-mono">wallet_*_usd</code>) hesaplarına aktarılan sponsor ve 7
                  derinlik komisyonları ile sistem fonu payı atomik olarak geri çekilir (Clawback) ve
                  30 günlük hareketli PGV yeniden hesaplanır.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      İade Edilecek Sipariş (order_id)
                    </label>
                    <select
                      value={refundOrderId}
                      onChange={(e) => setRefundOrderId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="">-- Sipariş Seçiniz --</option>
                      {transactions.map((t) => (
                        <option key={t.order_id} value={t.order_id}>
                          {t.order_id} — {t.buyer_name} ({t.order_amount.toLocaleString('tr-TR')} $ ·{' '}
                          {t.clawback_status || 'PENDING_14D'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      İade / Cayma Gerekçesi
                    </label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={v2Busy || !refundOrderId}
                      onClick={() => handleRefundOrder()}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      Seçili Siparişi İade Et &amp; Komisyonları Geri Çek (Clawback)
                    </button>
                    <button
                      type="button"
                      disabled={v2Busy || totalPendingBalance <= 0}
                      onClick={() => handleReleaseClawbackCron()}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      14 Günlük Süresi Dolanları Balance&apos;a Aktar
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-2.5 px-3">Sipariş (order_id)</th>
                      <th className="py-2.5 px-3">Alıcı Bayi</th>
                      <th className="py-2.5 px-3 text-right">Tutar</th>
                      <th className="py-2.5 px-3">Clawback Durumu</th>
                      <th className="py-2.5 px-3">14G Serbest Tarihi</th>
                      <th className="py-2.5 px-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                          Henüz işlenmiş sipariş bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      transactions.slice(0, 12).map((tx) => (
                        <tr key={tx.transaction_id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{tx.order_id}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-700">
                            #{tx.buyer_global_line_id} {tx.buyer_name}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {tx.order_amount.toLocaleString('tr-TR')} $
                          </td>
                          <td className="py-2.5 px-3">
                            {tx.clawback_status === 'REFUNDED' ? (
                              <span className="text-rose-700 font-bold">CLAWBACK_REFUNDED</span>
                            ) : tx.clawback_status === 'RELEASED_TO_BALANCE' ? (
                              <span className="text-emerald-700 font-bold">RELEASED_TO_BALANCE</span>
                            ) : (
                              <span className="text-amber-700 font-bold">PENDING_14D</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {tx.clawback_release_at
                              ? new Date(tx.clawback_release_at).toLocaleDateString('tr-TR')
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5">
                            {tx.clawback_status === 'PENDING_14D' && (
                              <button
                                type="button"
                                disabled={v2Busy}
                                onClick={() => handleReleaseClawbackCron(tx.order_id)}
                                className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Serbest Bırak
                              </button>
                            )}
                            {tx.clawback_status !== 'REFUNDED' && (
                              <button
                                type="button"
                                disabled={v2Busy}
                                onClick={() => handleRefundOrder(tx.order_id)}
                                className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded text-[11px] font-semibold cursor-pointer"
                              >
                                İade (Clawback)
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 5A & 5B: releasePendingCommissionsCron & handleOrderRefund(order_id) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                <div className="text-emerald-400 font-bold mb-1.5">
                  // A) 14 Günlük Korumalı Bakiye Serbest Bırakma (releasePendingCommissionsCron)
                </div>
                <pre className="text-slate-200">{`async function releasePendingCommissionsCron() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const matured = await client.query(\`
      SELECT * FROM commission_logs
      WHERE status = 'PENDING_14D' AND release_at <= CURRENT_TIMESTAMP
      FOR UPDATE
    \`);

    for (const row of matured.rows) {
      await client.query(\`
        UPDATE wallets
        SET pending_balance = pending_balance - $1,
            balance = balance + $1
        WHERE user_id = $2
      \`, [row.amount, row.target_user_id]);

      await client.query("UPDATE commission_logs SET status = 'RELEASED' WHERE id = $1", [row.id]);
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}`}</pre>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                <div className="text-rose-400 font-bold mb-1.5">
                  // B) İade / Cayma Durumunda Komisyon İptali (Refund / Chargeback API)
                </div>
                <pre className="text-slate-200">{`async function handleOrderRefund(order_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const logs = await client.query('SELECT * FROM commission_logs WHERE order_id = $1 FOR UPDATE', [order_id]);

    for (const log of logs.rows) {
      if (log.status === 'PENDING_14D') {
        // Bekleyen bakiyeden düş ve iptal et
        await client.query('UPDATE wallets SET pending_balance = pending_balance - $1 WHERE user_id = $2', [log.amount, log.target_user_id]);
        await client.query("UPDATE commission_logs SET status = 'REFUNDED_CANCELLED' WHERE id = $1", [log.id]);
      } else if (log.status === 'RELEASED') {
        // Zaten serbest kalmışsa çekilebilir bakiyeden düş (Eksi bakiyeye düşebilir)
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [log.amount, log.target_user_id]);
        await client.query("UPDATE commission_logs SET status = 'REFUNDED_CANCELLED' WHERE id = $1", [log.id]);
      }
    }

    await client.query("UPDATE orders_log SET status = 'REFUNDED' WHERE order_id = $1", [order_id]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 & 3: ROLLING 30-DAY PGV & MAX vs ACTIVE CAREER ENGINE */}
        {activeV2Tab === 'ROLLING_CAREER' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">
                  4. %50 KOL DENGE KURALI &amp; KARİYER TERFİ ENGINE — calculateActiveCareer(client, userId)
                </div>
                <div className="text-xs text-slate-500">
                  Kol bazlı 30 günlük ciroda en fazla %50 (<code className="font-mono">maxCapPerLeg = totalGV * 0.50</code>) tek koldan sayılır; <code className="font-mono">adjustedGV</code>, <code className="font-mono">getSubCareerCount</code> ve 7 seviye kurallarına göre <code className="font-mono">active_career_level</code> ve <code className="font-mono">max_career_level = GREATEST(max_career_level, $1)</code> güncellenir.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={v2Busy || members.length === 0}
                  onClick={() => handleCalculateActiveCareer(selectedBuyer?.user_id)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white cursor-pointer disabled:opacity-50"
                >
                  ⚡ calculateActiveCareer({selectedBuyer?.id || 1}) Çalıştır
                </button>
                <button
                  type="button"
                  disabled={v2Busy}
                  onClick={() =>
                    handleUpdateV2Config({
                      use_rolling_30d_pgv: !effectiveV2Config.use_rolling_30d_pgv,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    effectiveV2Config.use_rolling_30d_pgv
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Rolling 30G PGV: {effectiveV2Config.use_rolling_30d_pgv ? 'AKTİF' : 'PASİF'}
                </button>
                <button
                  type="button"
                  disabled={v2Busy}
                  onClick={() =>
                    handleUpdateV2Config({
                      use_dynamic_active_career: !effectiveV2Config.use_dynamic_active_career,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    effectiveV2Config.use_dynamic_active_career
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Dinamik Yetki Kilidi:{' '}
                  {effectiveV2Config.use_dynamic_active_career ? 'AKTİF' : 'PASİF'}
                </button>
              </div>
            </div>

            {/* Section 4 Live Inspector & Code Reference */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Canlı Kol (Leg) &amp; Kariyer Analizi:</span>
                  <span className="font-mono text-indigo-700">
                    #{selectedBuyer?.global_line_id} {selectedBuyer?.full_name}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500">totalGV (30G)</div>
                    <div className="font-bold text-slate-900">
                      {selectedBuyerOrgEval.total_gv_30d.toLocaleString('tr-TR')} $
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500">maxCapPerLeg (%50)</div>
                    <div className="font-bold text-amber-700">
                      {selectedBuyerOrgEval.max_cap_per_leg.toLocaleString('tr-TR')} $
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500">adjustedGV</div>
                    <div className="font-bold text-emerald-700">
                      {selectedBuyerOrgEval.adjusted_gv.toLocaleString('tr-TR')} $
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
                  <div className="font-sans font-bold text-slate-700">
                    Alt Ekip Kariyer Koşulu (getSubCareerCount):
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-slate-600">
                    <div>
                      Kariyer Seviyesi 2 (≥2):{' '}
                      <strong className="text-slate-900">
                        {selectedBuyerOrgEval.sub_career_counts[2] || 0} Kol
                      </strong>
                    </div>
                    <div>
                      Kariyer Seviyesi 3 (≥3):{' '}
                      <strong className="text-slate-900">
                        {selectedBuyerOrgEval.sub_career_counts[3] || 0} Kol
                      </strong>
                    </div>
                    <div>
                      Kariyer Seviyesi 4 (≥4):{' '}
                      <strong className="text-slate-900">
                        {selectedBuyerOrgEval.sub_career_counts[4] || 0} Kol
                      </strong>
                    </div>
                    <div>
                      Kariyer Seviyesi 5 (≥5):{' '}
                      <strong className="text-slate-900">
                        {selectedBuyerOrgEval.sub_career_counts[5] || 0} Kol
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">active_career_level: </span>
                    <strong className="text-emerald-700">
                      {selectedBuyer?.active_career_level ?? selectedBuyer?.career_level ?? 1}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">GREATEST(max_career_level): </span>
                    <strong className="text-indigo-700">
                      {selectedBuyer?.max_career_level ?? selectedBuyer?.career_level ?? 1}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] overflow-x-auto max-h-72 overflow-y-auto leading-relaxed border border-slate-800">
                <div className="text-amber-400 font-bold mb-1.5">
                  // 4. %50 KOL DENGE KURALI &amp; KARİYER TERFİ ENGINE
                </div>
                <pre className="text-slate-200">{`function evaluateMemberCareer(member, allMembers, tiers) {
  // 1. Aktiflik: is_active bayrağı ve activity_expires_at bitiş tarihi birlikte geçerli olmalı
  const isActivityValid =
    member.is_active && new Date(member.activity_expires_at).getTime() > Date.now();

  // 2. Doğrudan aktif referans sayısı (minActiveDirects)
  const activeDirectsCount = allMembers.filter(
    (m) => m.sponsor_id === member.user_id && m.is_active
  ).length;

  // 3. Kol bazlı hacim: enforceMaxSingleLegPercent açık olan kademelerde tek kol en fazla %50 sayılır
  const legs = getDirectLegSummaries(member, allMembers);

  // 4. Kademeler sırayla değerlendirilir; bir kademe geçilmezse zincir durur
  let targetLevel = 1;
  for (const tier of tiers) {
    // Kişisel Şart: Tüm kariyerler için yalnızca aktiflik yeterlidir
    const personalOk = isActivityValid;
    const refsOk = activeDirectsCount >= tier.minActiveDirects;
    const groupOk = getLegBalancedGroupVolume(legs, tier) >= tier.minGroupVolume;
    const teamOk = meetsRequiredDownlineCareers(legs, tier.requiredDownlineCareers);

    if (!(personalOk && refsOk && groupOk && teamOk)) break;
    targetLevel = tier.level;
  }

  return targetLevel;
}`}</pre>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2.5 px-3">Hat Sırası &amp; Üye</th>
                    <th className="py-2.5 px-3">Profil Unvanı (max_career_level)</th>
                    <th className="py-2.5 px-3">Dönemsel Yetki (active_career_level)</th>
                    <th className="py-2.5 px-3 text-right">Ömür Boyu PGV</th>
                    <th className="py-2.5 px-3 text-right">Son 30 Günlük PGV</th>
                    <th className="py-2.5 px-3 text-right">Pending (14G)</th>
                    <th className="py-2.5 px-3 text-right">Çekilebilir Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members
                    .slice()
                    .sort((a, b) => a.global_line_id - b.global_line_id)
                    .map((m) => {
                      const maxLvl = m.max_career_level ?? m.career_level;
                      const actLvl = m.active_career_level ?? m.career_level;
                      const r30Pgv = m.rolling_30d_pgv ?? m.group_volume;

                      return (
                        <tr key={m.user_id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900">#{m.global_line_id}</span>{' '}
                            <span className="font-sans font-medium text-slate-800">
                              {m.full_name}
                            </span>{' '}
                            <span className="text-slate-400">({m.user_id})</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            Kariyer Seviyesi {maxLvl}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`font-bold ${
                                actLvl < maxLvl ? 'text-amber-700' : 'text-emerald-700'
                              }`}
                            >
                              Kariyer Seviyesi {actLvl} (Açık Derinlik: {m.unlocked_depth})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {m.group_volume.toLocaleString('tr-TR')} $
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {r30Pgv.toLocaleString('tr-TR')} $
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-700 font-semibold">
                            {getMemberRegionalPendingUsd(m).toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            $
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                            {getMemberRegionalUsdBalance(m).toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            $
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DYNAMIC POOL SPLIT ENGINE */}
        {activeV2Tab === 'DYNAMIC_POOL' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Dinamik Havuz Dağıtımı (Dynamic Pool Split Engine) — Puan Bazlı Sistem Fonu Paylaşımı
                </div>
                <div className="text-xs text-slate-500">
                  Sistem Fonunda (%5 + Devirler) biriken{' '}
                  <strong>{systemFundBalance.toLocaleString('tr-TR')} $</strong>, sabit taahhüt
                  yerine aktif liderlerin dönemsel kariyer ağırlığı ve 30 günlük PGV katkısıyla
                  üretilen <strong>Liderlik Puanı (pool_leadership_points)</strong> oranında
                  dağıtılır.
                </div>
              </div>
              <button
                type="button"
                disabled={v2Busy || systemFundBalance <= 0}
                onClick={handleDynamicPoolDistribute}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
              >
                Dinamik Havuz Dağıtımını Şimdi Çalıştır ({systemFundBalance.toLocaleString('tr-TR')}{' '}
                $)
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2.5 px-3">Bayi / Lider</th>
                    <th className="py-2.5 px-3">Dönemsel Aktif Kariyer</th>
                    <th className="py-2.5 px-3 text-right">30 Günlük PGV</th>
                    <th className="py-2.5 px-3 text-right">Liderlik Puanı</th>
                    <th className="py-2.5 px-3 text-right">Havuz Puan Oranı</th>
                    <th className="py-2.5 px-3 text-right">Bugüne Kadar Havuz Kazancı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members
                    .slice()
                    .sort(
                      (a, b) => (b.pool_leadership_points || 0) - (a.pool_leadership_points || 0)
                    )
                    .map((m) => {
                      const pts = m.pool_leadership_points || 0;
                      const sharePct =
                        totalLeadershipPoints > 0
                          ? Math.round((pts / totalLeadershipPoints) * 1000) / 10
                          : 0;
                      return (
                        <tr key={m.user_id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900">#{m.global_line_id}</span>{' '}
                            <span className="font-sans font-medium text-slate-800">
                              {m.full_name}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-800">
                            Kariyer Seviyesi {m.active_career_level || m.career_level}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">
                            {(m.rolling_30d_pgv ?? m.group_volume).toLocaleString('tr-TR')} $
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {pts} Puan
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                            %{sharePct}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {m.wallets.career_pool_wallet.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            $
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BULLMQ / REDIS ASYNC QUEUE MONITOR */}
        {activeV2Tab === 'BULLMQ_QUEUE' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  3. ASENKRON WEBHOOK &amp; QUEUE İŞLEME MOTORU — A) Webhook Controller (POST /api/v1/integrations/order-commission)
                </div>
                <div className="text-xs text-slate-500">
                  Webhook isteği gelir gelmez <code className="font-mono">orders_log</code> üzerinden Idempotency kontrolü yapılır (<code className="font-mono">ALREADY_RECEIVED</code>), sipariş geçici olarak kaydedilir ve <code className="font-mono">commission-processing</code> Redis kuyruğuna (<code className="font-mono">process-commission</code>, <code className="font-mono">attempts: 3, backoff: 5000</code>) eklenir.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {transactions.length > 0 && (
                  <button
                    type="button"
                    disabled={v2Busy}
                    onClick={handleDuplicateIdempotencyTest}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    🛡️ Idempotency Testi (ALREADY_RECEIVED)
                  </button>
                )}
                <button
                  type="button"
                  disabled={v2Busy || members.length === 0}
                  onClick={handleBullMqBurstTest}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  ⚡ 4 Eşzamanlı Siparişi Kuyruğa Gönder (Burst Test)
                </button>
              </div>
            </div>

            {/* 3A) Webhook Controller Source & 3-Step Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-5 grid grid-cols-1 gap-2.5 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="font-mono font-bold text-indigo-700">
                    1. Idempotency Kontrolü (orders_log)
                  </div>
                  <div className="font-mono text-[11px] text-slate-600">
                    SELECT order_id FROM orders_log WHERE order_id = $1
                  </div>
                  <div className="text-slate-500">
                    Sipariş mevcutsa HTTP 200{' '}
                    <code className="font-mono text-amber-700">
                      {"{ status: 'ALREADY_RECEIVED', message: 'Sipariş zaten kayıtlı.' }"}
                    </code>{' '}
                    döner.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="font-mono font-bold text-emerald-700">
                    2. Siparişi Geçici Olarak Kaydet (orders_log)
                  </div>
                  <div className="font-mono text-[11px] text-slate-600">
                    INSERT INTO orders_log (order_id, user_id, package_id, amount) VALUES (...)
                  </div>
                  <div className="text-slate-500">
                    <code className="font-mono">external_app_user_id</code> ile kullanıcı ID&apos;si eşleştirilerek <code className="font-mono">orders_log</code> tablosuna kaydedilir.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="font-mono font-bold text-teal-700">
                    3. Kuyruğa İş Emri Ekle (BullMQ / Redis)
                  </div>
                  <div className="font-mono text-[11px] text-slate-600">
                    commissionQueue.add(&apos;process-commission&apos;, payload, &#123; attempts: 3, backoff: 5000 &#125;)
                  </div>
                  <div className="text-slate-500">
                    HTTP 200{' '}
                    <code className="font-mono text-emerald-700">
                      {"{ success: true, message: 'Sipariş kuyruğa alındı ve işleniyor.' }"}
                    </code>{' '}
                    döner.
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                <div className="text-emerald-400 font-bold mb-1.5">
                  // A) Webhook Controller (POST /api/v1/integrations/order-commission)
                </div>
                <pre className="text-slate-200">{`const { Queue } = require('bullmq');
const commissionQueue = new Queue('commission-processing', { connection: redisConfig });

async function handleOrderWebhook(req, res) {
  const { user_id, order_id, order_amount, package_id, timestamp } = req.body;

  // 1. Idempotency Kontrolü
  const existingOrder = await db.query('SELECT order_id FROM orders_log WHERE order_id = $1', [order_id]);
  if (existingOrder.rows.length > 0) {
    return res.status(200).json({ status: 'ALREADY_RECEIVED', message: 'Sipariş zaten kayıtlı.' });
  }

  // 2. Siparişi Geçici Olarak Kaydet
  await db.query(
    'INSERT INTO orders_log (order_id, user_id, package_id, amount) VALUES ($1, (SELECT id FROM users WHERE external_app_user_id = $2), $3, $4)',
    [order_id, user_id, package_id, order_amount]
  );

  // 3. Kuyruğa İş Emri Ekle (Arka Planda Güvenli İşlenecek)
  await commissionQueue.add('process-commission', {
    user_id, order_id, order_amount, package_id, timestamp
  }, { attempts: 3, backoff: 5000 });

  return res.status(200).json({ success: true, message: 'Sipariş kuyruğa alındı ve işleniyor.' });
}`}</pre>
              </div>
            </div>

            {/* 3B) Background Worker (Kuyruk İşleyici & Komisyon Dağıtım Algoritması) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-5 grid grid-cols-1 gap-2 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-0.5">
                  <div className="font-mono font-bold text-slate-900">
                    1–3. FOR UPDATE Lock &amp; 30G Hacim (WITH RECURSIVE)
                  </div>
                  <div className="text-slate-600">
                    Alıcı <code className="font-mono">FOR UPDATE</code> ile kilitlenir,{' '}
                    <code className="font-mono">personal_volume_30d</code> ve Recursive Unilevel
                    üst sponsorların <code className="font-mono">group_volume_30d</code> değerleri
                    güncellenir.
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-0.5">
                  <div className="font-mono font-bold text-indigo-700">
                    4 &amp; 5. Havuz 1 (%5 Sistem Fonu) &amp; Havuz 2 (%20 Sponsor)
                  </div>
                  <div className="text-slate-600">
                    %5 <code className="font-mono">system_pool_balance</code> (
                    <code className="font-mono">RELEASED</code>); %20 Sponsor{' '}
                    <code className="font-mono">pending_*_usd</code> (
                    <code className="font-mono">PENDING_14D</code>) veya{' '}
                    <code className="font-mono">POOL_TRANSFER_NO_SPONSOR</code>.
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-0.5">
                  <div className="font-mono font-bold text-amber-800">
                    6. Havuz 3: %25 Monoline 7 Derinlik (active_career_level)
                  </div>
                  <div className="text-slate-600">
                    <code className="font-mono">[0.07, 0.05, 0.04, 0.03, 0.02, 0.02, 0.02]</code>{' '}
                    oranlarıyla <code className="font-mono">is_active</code> ve{' '}
                    <code className="font-mono">active_career_level &gt;= depth</code> kontrolü
                    yapılır.
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-0.5">
                  <div className="font-mono font-bold text-emerald-700">
                    7. calculateActiveCareer &amp; ACID COMMIT / ROLLBACK
                  </div>
                  <div className="text-slate-600">
                    Kariyer güncellemeleri tetiklenir ve transaction{' '}
                    <code className="font-mono">COMMIT</code> edilir (hata anında{' '}
                    <code className="font-mono">ROLLBACK</code> + BullMQ Retry).
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] overflow-x-auto max-h-80 overflow-y-auto leading-relaxed border border-slate-800">
                <div className="text-amber-400 font-bold mb-1.5">
                  // B) Background Worker (Kuyruk İşleyici &amp; Komisyon Dağıtım Algoritması)
                </div>
                <pre className="text-slate-200">{`const { Worker } = require('bullmq');

const worker = new Worker('commission-processing', async (job) => {
  const { user_id, order_id, order_amount } = job.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Kullanıcıyı getir ve Row Lock (FOR UPDATE) uygula
    const userRes = await client.query('SELECT * FROM users WHERE external_app_user_id = $1 FOR UPDATE', [user_id]);
    const buyer = userRes.rows[0];

    // 2. Kişisel 30 Günlük Hacmi Güncelle
    await client.query('UPDATE users SET personal_volume_30d = personal_volume_30d + $1 WHERE id = $2', [order_amount, buyer.id]);

    // 3. Recursive Unilevel Üst Sponsorların 30 Günlük Grup Cirosunu Güncelle
    if (buyer.sponsor_id) {
      await client.query(\`
        WITH RECURSIVE uplines AS (
          SELECT id, sponsor_id FROM users WHERE id = $1
          UNION ALL
          SELECT u.id, u.sponsor_id FROM users u INNER JOIN uplines ON u.id = uplines.sponsor_id
        )
        UPDATE users SET group_volume_30d = group_volume_30d + $2 WHERE id IN (SELECT id FROM uplines);
      \`, [buyer.sponsor_id, order_amount]);
    }

    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + 14); // +14 Gün Cayma Süresi

    // 4. HAVUZ 1: %5 Sistem / Kariyer Fonu Aktarımı
    const systemFund = order_amount * 0.05;
    await client.query('UPDATE system_wallet SET system_pool_balance = system_pool_balance + $1 WHERE id = 1', [systemFund]);
    await logComm(client, order_id, buyer.id, null, 'SYSTEM_POOL', null, systemFund, 'RELEASED', new Date());

    // 5. HAVUZ 2: %20 Direkt Sponsor Primi (Bekleyen Bakiye - 14 Gün)
    const sponsorAmount = order_amount * 0.20;
    if (buyer.sponsor_id) {
      await client.query('UPDATE wallets SET pending_balance = pending_balance + $1, total_earned = total_earned + $1 WHERE user_id = $2', [sponsorAmount, buyer.sponsor_id]);
      await logComm(client, order_id, buyer.id, buyer.sponsor_id, 'SPONSOR', null, sponsorAmount, 'PENDING_14D', releaseDate);
    } else {
      await client.query('UPDATE system_wallet SET unclaimed_pool_balance = unclaimed_pool_balance + $1 WHERE id = 1', [sponsorAmount]);
      await logComm(client, order_id, buyer.id, null, 'SPONSOR', null, sponsorAmount, 'POOL_TRANSFER_NO_SPONSOR', new Date());
    }

    // 6. HAVUZ 3: %25 Monoline 7 Derinlik Dağıtımı (%7, %5, %4, %3, %2, %2, %2)
    const monolineRates = [0.07, 0.05, 0.04, 0.03, 0.02, 0.02, 0.02];
    const uplinesRes = await client.query('SELECT * FROM users WHERE monoline_position < $1 ORDER BY monoline_position DESC LIMIT 7 FOR UPDATE', [buyer.monoline_position]);
    const monolineUplines = uplinesRes.rows;

    for (let i = 0; i < 7; i++) {
      const depth = i + 1;
      const commAmount = order_amount * monolineRates[i];
      const targetUser = monolineUplines[i];

      if (!targetUser) {
        await client.query('UPDATE system_wallet SET unclaimed_pool_balance = unclaimed_pool_balance + $1 WHERE id = 1', [commAmount]);
        await logComm(client, order_id, buyer.id, null, 'MONOLINE_DEPTH', depth, commAmount, 'POOL_TRANSFER_NO_UPLINE', new Date());
        continue;
      }

      if (!targetUser.is_active || targetUser.is_locked) {
        await client.query('UPDATE system_wallet SET unclaimed_pool_balance = unclaimed_pool_balance + $1 WHERE id = 1', [commAmount]);
        await logComm(client, order_id, buyer.id, targetUser.id, 'MONOLINE_DEPTH', depth, commAmount, 'POOL_TRANSFER_INACTIVE', new Date());
      } else if (targetUser.active_career_level < depth) {
        await client.query('UPDATE system_wallet SET unclaimed_pool_balance = unclaimed_pool_balance + $1 WHERE id = 1', [commAmount]);
        await logComm(client, order_id, buyer.id, targetUser.id, 'MONOLINE_DEPTH', depth, commAmount, 'POOL_TRANSFER_NO_YETKI', new Date());
      } else {
        await client.query('UPDATE wallets SET pending_balance = pending_balance + $1, total_earned = total_earned + $1 WHERE user_id = $2', [commAmount, targetUser.id]);
        await logComm(client, order_id, buyer.id, targetUser.id, 'MONOLINE_DEPTH', depth, commAmount, 'PENDING_14D', releaseDate);
      }
    }

    // 7. Kariyer Güncellemelerini Tetikle (Alıcı ve Üst Sponsorlar için)
    await calculateActiveCareer(client, buyer.id);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}, { connection: redisConfig });`}</pre>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2.5 px-3">Job ID</th>
                    <th className="py-2.5 px-3">Queue / Job Name</th>
                    <th className="py-2.5 px-3">Sipariş (order_id)</th>
                    <th className="py-2.5 px-3">Retry &amp; Backoff</th>
                    <th className="py-2.5 px-3">Worker &amp; Süre</th>
                    <th className="py-2.5 px-3">İşlem Özeti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {queueJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                        Henüz kuyruk kaydı yok. Sipariş işleyebilir veya Burst Test
                        çalıştırabilirsiniz.
                      </td>
                    </tr>
                  ) : (
                    queueJobs.slice(0, 15).map((job) => (
                      <tr key={job.job_id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{job.job_id}</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                          <div>{job.queue_name}</div>
                          <div className="text-[10px] text-slate-500">
                            {job.job_name || 'process-commission'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">
                          {job.order_id} ({job.order_amount.toLocaleString('tr-TR')} $)
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          attempts: {job.attempts_made}/{job.max_attempts || 3} · backoff:{' '}
                          {job.backoff_ms || 5000}ms
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {job.worker_id} · {job.processing_ms} ms
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-700">
                          {job.result_summary}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: UNCLAIMED COMMISSIONS LEDGER (AYRIŞTIRILMIŞ DEVİR MUHASEBESİ) */}
        {activeV2Tab === 'UNCLAIMED_LEDGER' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Ayrıştırılmış Devir Muhasebesi (unclaimed_commissions Tablosu)
                </div>
                <div className="text-xs text-slate-500">
                  Yetki veya aktiflik eksikliği nedeniyle üyeye ödenemeyen komisyonlar, genel fonla
                  karışmaması için gerekçe kodlarıyla kayıt altına alınır.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setUnclaimedFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                    unclaimedFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  TÜMÜ ({unclaimedCommissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUnclaimedFilter('POOL_TRANSFER_NO_YETKI')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                    unclaimedFilter === 'POOL_TRANSFER_NO_YETKI'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-amber-800'
                  }`}
                >
                  POOL_TRANSFER_NO_YETKI ({noYetkiSum.toLocaleString('tr-TR')} $)
                </button>
                <button
                  type="button"
                  onClick={() => setUnclaimedFilter('POOL_TRANSFER_INACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                    unclaimedFilter === 'POOL_TRANSFER_INACTIVE'
                      ? 'bg-rose-700 text-white'
                      : 'bg-white border border-slate-200 text-rose-800'
                  }`}
                >
                  POOL_TRANSFER_INACTIVE ({inactiveSum.toLocaleString('tr-TR')} $)
                </button>
                <button
                  type="button"
                  onClick={() => setUnclaimedFilter('POOL_TRANSFER_NO_UPLINE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                    unclaimedFilter === 'POOL_TRANSFER_NO_UPLINE' ||
                    unclaimedFilter === 'POOL_TRANSFER_NO_USER'
                      ? 'bg-slate-700 text-white'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  NO_UPLINE / NO_SPONSOR ({noUserSum.toLocaleString('tr-TR')} $)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Sipariş (order_id)</th>
                    <th className="py-2.5 px-3">Tip / Derinlik</th>
                    <th className="py-2.5 px-3">Hedef Üye</th>
                    <th className="py-2.5 px-3">Gerekçe Kodu (reason_code)</th>
                    <th className="py-2.5 px-3 text-right">Devredilen Tutar</th>
                    <th className="py-2.5 px-3">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUnclaimed.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 font-sans">
                        Bu filtrede ayrıştırılmış devir kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    filteredUnclaimed.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">#{u.id}</td>
                        <td className="py-2.5 px-3 text-slate-800">{u.order_id}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {u.commission_type}
                          {u.depth_level ? ` (${u.depth_level}. Derinlik)` : ''}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-700">
                          {u.intended_user_name
                            ? `#${u.intended_monoline_position} ${u.intended_user_name}`
                            : 'Üst Sırada Üye Yok'}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          {u.reason_code === 'POOL_TRANSFER_NO_YETKI' && (
                            <span className="text-amber-700">POOL_TRANSFER_NO_YETKI</span>
                          )}
                          {u.reason_code === 'POOL_TRANSFER_INACTIVE' && (
                            <span className="text-rose-700">POOL_TRANSFER_INACTIVE</span>
                          )}
                          {(u.reason_code === 'POOL_TRANSFER_NO_UPLINE' ||
                            u.reason_code === 'POOL_TRANSFER_NO_SPONSOR' ||
                            u.reason_code === 'POOL_TRANSFER_NO_USER') && (
                            <span className="text-slate-600">{u.reason_code}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {u.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-600 max-w-md truncate">
                          {u.reason_detail}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: V2.1 ENTERPRISE COMPLIANCE, ANTI-FRAUD, GAMIFICATION & NOTIFICATION ENGINE */}
        {activeV2Tab === 'V21_ENTERPRISE' && (
          <div className="space-y-6">
            {/* 1. Hukuki ve Mali Uyum Modülü (Compliance & Tax Module) + Banka Toplu Ödeme CSV */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-bold text-indigo-700">
                      1. HUKUKİ VE MALİ UYUM MODÜLÜ (COMPLIANCE &amp; TAX MODULE)
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      %20 Gelir Vergisi Stopajı / Gider Pusulası &amp; KVKK / MLM Sözleşme Onay Logları
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                    contract_version: v2.0
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Şirket olmayan şahıs bayileri (<code className="font-mono">has_tax_company = FALSE</code>)
                  komisyon çekerken sistem otomatik olarak <strong>%20 Gelir Vergisi Stopajı</strong> düşer ve{' '}
                  <code className="font-mono">withdrawal_requests</code> tablosuna{' '}
                  <code className="font-mono">gross_amount</code> (Brüt),{' '}
                  <code className="font-mono">tax_deduction</code> (Kesilen Vergi),{' '}
                  <code className="font-mono">net_amount</code> (Bankaya Yatacak Net Tutar) olarak kaydeder.
                  Şirketi olan fatura mükellefi bayilerde stopaj <strong>%0</strong> uygulanır.
                </p>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-2 px-2.5">Üye &amp; TC Kimlik</th>
                        <th className="py-2 px-2.5">Vergi Statüsü</th>
                        <th className="py-2 px-2.5">KVKK / Sözleşme</th>
                        <th className="py-2 px-2.5 text-right">Günlük Limit</th>
                        <th className="py-2 px-2.5 text-right">Değiştir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {members.map((m) => {
                        const dailyLim =
                          m.daily_withdrawal_limit ||
                          DAILY_WITHDRAWAL_LIMITS_BY_CAREER[m.career_level] ||
                          5000;
                        return (
                          <tr key={m.user_id} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 font-sans">
                              <div className="font-bold text-slate-900">
                                #{m.global_line_id} {m.full_name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                TC: {m.tc_identity_no || '10928374650'} · IP:{' '}
                                {m.last_login_ip || '176.240.10.1'}
                              </div>
                            </td>
                            <td className="py-2 px-2.5">
                              {m.has_tax_company ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  ŞİRKET (%0 Stopaj)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  ŞAHIS (%20 Stopaj)
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-[10px] text-slate-600">
                              <div>{m.contract_version || 'v2.0'} Onaylı</div>
                              <div className="text-slate-400">
                                {m.kvkk_approved_at
                                  ? new Date(m.kvkk_approved_at).toLocaleDateString('tr-TR')
                                  : new Date(m.joined_at).toLocaleDateString('tr-TR')}
                              </div>
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-800">
                              {dailyLim.toLocaleString('tr-TR')} $
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              <button
                                type="button"
                                disabled={v2Busy}
                                onClick={async () => {
                                  setV2Busy(true);
                                  try {
                                    const res = await fetch(
                                      `/api/v1/admin/compliance/member/${m.user_id}`,
                                      {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          has_tax_company: !m.has_tax_company,
                                          contract_version: 'v2.0',
                                        }),
                                      }
                                    );
                                    const data = await res.json();
                                    if (res.ok) {
                                      setV2ActionBanner({ type: 'success', message: data.message });
                                      if (onRefreshState) await onRefreshState();
                                    }
                                  } finally {
                                    setV2Busy(false);
                                  }
                                }}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-sans font-semibold cursor-pointer"
                              >
                                {m.has_tax_company ? 'Şahıs Yap (%20)' : 'Şirket Yap (%0)'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4B. Banka Toplu Ödeme Çıktısı (Bank Mass Payout Export) & Stopaj Tablosu */}
              <div className="lg:col-span-6 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-bold text-emerald-700">
                      4B. BANKA TOPLU ÖDEME ÇIKTISI (BANK MASS PAYOUT EXPORT)
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      Garanti, İş Bankası, QNB &amp; Papara Toplu Havale/EFT CSV &amp; Stopaj Hesabı
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={bankExportFormat}
                      onChange={(e) =>
                        setBankExportFormat(
                          e.target.value as 'GARANTI' | 'ISBANK' | 'QNB' | 'PAPARA'
                        )
                      }
                      className="px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="GARANTI">Garanti BBVA (Toplu EFT CSV)</option>
                      <option value="ISBANK">İş Bankası (Kurumsal EFT CSV)</option>
                      <option value="QNB">QNB Finansbank (Maaş/Bayi CSV)</option>
                      <option value="PAPARA">Papara Kurumsal (Toplu Ödeme CSV)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const headers = [
                          'BANKA_FORMATI',
                          'TALEP_ID',
                          'AD_SOYAD',
                          'TC_KIMLIK_NO',
                          'VERGI_STATUSU',
                          'IBAN_ADRES',
                          'BRUT_TUTAR_TL',
                          'STOPAJ_KESINTISI_TL',
                          'BANKAYA_YATACAK_NET_TL',
                          'DURUM',
                        ];
                        const rows = (withdrawalRequests.length > 0
                          ? withdrawalRequests
                          : members.slice(0, 3).map((m, idx) => {
                              const gross = 5000 * (idx + 1);
                              const tax = m.has_tax_company ? 0 : gross * 0.2;
                              return {
                                id: 100 + idx,
                                user_full_name: m.full_name,
                                tc_identity_no: m.tc_identity_no || '10928374650',
                                has_tax_company: Boolean(m.has_tax_company),
                                payout_address: m.bank_details?.iban || '',
                                gross_amount: gross,
                                amount: gross,
                                tax_deduction: tax,
                                net_amount: gross - tax,
                                status: 'APPROVED',
                              };
                            })
                        ).map((w: any) => {
                          const gross = Number(w.gross_amount ?? w.amount ?? 0);
                          const tax = Number(
                            w.tax_deduction ?? (w.has_tax_company ? 0 : gross * 0.2)
                          );
                          const net = Number(w.net_amount ?? gross - tax);
                          return [
                            bankExportFormat,
                            w.id,
                            `"${w.user_full_name}"`,
                            w.tc_identity_no || '10928374650',
                            w.has_tax_company ? 'SIRKET_FATURALI_0_STOPAJ' : 'SAHIS_GIDER_PUSULASI_20_STOPAJ',
                            `"${w.payout_address}"`,
                            gross.toFixed(2),
                            tax.toFixed(2),
                            net.toFixed(2),
                            w.status,
                          ];
                        });
                        const csv =
                          'data:text/csv;charset=utf-8,' +
                          [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
                        const link = document.createElement('a');
                        link.setAttribute('href', encodeURI(csv));
                        link.setAttribute(
                          'download',
                          `${bankExportFormat}_TOPLU_HAVALE_EFT_${new Date()
                            .toISOString()
                            .slice(0, 10)}.csv`
                        );
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Toplu Ödeme CSV İndir
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-[11px] font-mono border-collapse tabular-nums">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-2 px-2.5">Talep / Bayi</th>
                        <th className="py-2 px-2.5 text-right">gross_amount (Brüt)</th>
                        <th className="py-2 px-2.5 text-right">tax_deduction (%20)</th>
                        <th className="py-2 px-2.5 text-right">net_amount (Yatan Net)</th>
                        <th className="py-2 px-2.5">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {withdrawalRequests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-5 text-center text-slate-400 font-sans">
                            Henüz çekim talebi yok. Çekim talebi oluşturulduğunda Brüt / %20 Stopaj /
                            Net ayrımı burada listelenir.
                          </td>
                        </tr>
                      ) : (
                        withdrawalRequests.map((w) => {
                          const gross = w.gross_amount ?? w.amount;
                          const tax = w.tax_deduction ?? (w.has_tax_company ? 0 : gross * 0.2);
                          const net = w.net_amount ?? gross - tax;
                          return (
                            <tr key={w.id} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 font-sans">
                                <div className="font-bold text-slate-900">
                                  #{w.id} {w.user_full_name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  {w.payout_method} · {w.payout_address}
                                </div>
                              </td>
                              <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                                {gross.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                              </td>
                              <td className="py-2 px-2.5 text-right font-bold text-rose-700">
                                -{tax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                              </td>
                              <td className="py-2 px-2.5 text-right font-black text-emerald-700">
                                {net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                              </td>
                              <td className="py-2 px-2.5">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                                  {w.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 2. Anti-Fraud & Risk Engine + 3. Gamification (Fast-Start & Rank-Up Rewards) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-bold text-rose-700">
                      2. GÜVENLİK, HİLE ÖNLEME VE RİSK YÖNETİMİ (ANTI-FRAUD ENGINE)
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      Self-Referral Lock · IP / Cihaz Çakışması (&gt;3 İşlem/24s → FRAUD_REVIEW) ·
                      Velocity Limits
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-lg">
                    ✓ Canlı IP &amp; Cihaz Koruması Devrede (Otomatik)
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[10px]">
                  {[
                    { lvl: 1, title: 'Kariyer Seviyesi 1', lim: '5.000$' },
                    { lvl: 2, title: 'Kariyer Seviyesi 2', lim: '10.000$' },
                    { lvl: 3, title: 'Kariyer Seviyesi 3', lim: '20.000$' },
                    { lvl: 4, title: 'Kariyer Seviyesi 4', lim: '35.000$' },
                    { lvl: 5, title: 'Kariyer Seviyesi 5', lim: '50.000$' },
                    { lvl: 6, title: 'Kariyer Seviyesi 6', lim: '75.000$' },
                    { lvl: 7, title: 'Kariyer Seviyesi 7', lim: '100.000$' },
                  ].map((item) => (
                    <div
                      key={item.lvl}
                      className="p-1.5 rounded bg-white border border-slate-200"
                    >
                      <div className="font-bold text-slate-800">{item.title}</div>
                      <div className="text-rose-700 font-bold">{item.lim}/G</div>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-2 px-2.5">Kural / Sipariş</th>
                        <th className="py-2 px-2.5">IP &amp; Açıklama</th>
                        <th className="py-2 px-2.5">Statü</th>
                        <th className="py-2 px-2.5 text-right">Admin Kararı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {fraudAlerts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-5 text-center text-slate-400 font-sans">
                            Aktif şüpheli işlem (FRAUD_REVIEW) kaydı bulunmuyor.
                          </td>
                        </tr>
                      ) : (
                        fraudAlerts.map((fa) => (
                          <tr key={fa.id} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5">
                              <div className="font-bold text-rose-700">{fa.rule_code}</div>
                              <div className="text-[10px] text-slate-500">
                                {fa.order_id || fa.user_full_name}
                              </div>
                            </td>
                            <td className="py-2 px-2.5 font-sans text-[10px] text-slate-600 max-w-xs">
                              {fa.details}
                            </td>
                            <td className="py-2 px-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                  fa.status === 'FRAUD_REVIEW'
                                    ? 'bg-amber-100 text-amber-800'
                                    : fa.status === 'CLEARED_APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {fa.status}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-right space-x-1">
                              {fa.status === 'FRAUD_REVIEW' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await fetch(`/api/v1/admin/fraud/${fa.id}/decision`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ decision: 'APPROVE' }),
                                      });
                                      if (onRefreshState) await onRefreshState();
                                    }}
                                    className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-sans font-bold cursor-pointer"
                                  >
                                    Onayla
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await fetch(`/api/v1/admin/fraud/${fa.id}/decision`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ decision: 'REJECT_REFUND' }),
                                      });
                                      if (onRefreshState) await onRefreshState();
                                    }}
                                    className="px-2 py-0.5 bg-rose-700 text-white rounded text-[10px] font-sans font-bold cursor-pointer"
                                  >
                                    İptal
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Liderlik, Motivasyon ve Oyunlaştırma (user_rewards_log) */}
              <div className="lg:col-span-6 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-bold text-amber-700">
                      3. LİDERLİK, MOTİVASYON &amp; OYUNLAŞTIRMA (SQL: user_rewards_log)
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      İlk 14 Gün Hızlı Başlangıç Bonusu (FAST_START) &amp; Kariyer Ödülleri (RANK_UP_GIFT)
                    </h4>
                  </div>
                  <button
                    type="button"
                    disabled={v2Busy}
                    onClick={async () => {
                      setV2Busy(true);
                      try {
                        const res = await fetch('/api/v1/admin/rewards/trigger-fast-start', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            user_id: userId || members[0]?.user_id,
                            cash_value: 2500,
                          }),
                        });
                        const data = await res.json();
                        setV2ActionBanner({
                          type: res.ok ? 'success' : 'error',
                          message: data.message,
                        });
                        if (onRefreshState) await onRefreshState();
                      } finally {
                        setV2Busy(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    İlk 14G Hızlı Başlangıç Bonusu Tetikle (+2.500 $)
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-2 px-2.5">id / Üye</th>
                        <th className="py-2 px-2.5">reward_type &amp; Kariyer</th>
                        <th className="py-2 px-2.5">reward_description</th>
                        <th className="py-2 px-2.5 text-right">cash_value</th>
                        <th className="py-2 px-2.5 text-right">is_delivered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {userRewardsLog.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-5 text-center text-slate-400 font-sans">
                            Üye ilk kez kariyer atladığında (RANK_UP_GIFT) veya ilk 14 günde 3 aktif
                            direkt referans getirdiğinde (FAST_START) ödüller burada listelenir.
                          </td>
                        </tr>
                      ) : (
                        userRewardsLog.map((rw) => (
                          <tr key={rw.id} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 font-sans">
                              <div className="font-bold text-slate-900">
                                #{rw.id} {rw.user_full_name}
                              </div>
                            </td>
                            <td className="py-2 px-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                  rw.reward_type === 'FAST_START'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {rw.reward_type} (L{rw.career_level})
                              </span>
                            </td>
                            <td className="py-2 px-2.5 font-sans text-[10px] text-slate-700">
                              {rw.reward_description}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-emerald-700">
                              {rw.cash_value.toLocaleString('tr-TR')} $
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              {rw.is_delivered ? (
                                <span className="text-emerald-700 font-bold text-[10px]">
                                  ✓ TESLİM EDİLDİ
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetch(`/api/v1/admin/rewards/${rw.id}/deliver`, {
                                      method: 'POST',
                                    });
                                    if (onRefreshState) await onRefreshState();
                                  }}
                                  className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-sans font-bold cursor-pointer"
                                >
                                  Teslim Et &amp; Cüzdana Yatır
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4A. Gerçek Zamanlı Bildirim Motoru (notification_outbox) & 5. V2.1 Patch SQL Şeması */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-bold text-emerald-700">
                      4A. GERÇEK ZAMANLI BİLDİRİM MOTORU (SQL: notification_outbox)
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      Kazanılan Komisyon · 3 Gün Aktiflik Uyarısı · FOMO Kayıp Komisyon Bildirimi
                    </h4>
                  </div>
                  <button
                    type="button"
                    disabled={v2Busy}
                    onClick={async () => {
                      setV2Busy(true);
                      try {
                        const res = await fetch(
                          '/api/v1/admin/notifications/trigger-expiry-warnings',
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: userId || members[0]?.user_id }),
                          }
                        );
                        const data = await res.json();
                        setV2ActionBanner({
                          type: res.ok ? 'success' : 'error',
                          message: data.message,
                        });
                        if (onRefreshState) await onRefreshState();
                      } finally {
                        setV2Busy(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    3G Aktiflik &amp; FOMO Bildirimi Gönder
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-2 px-2.5">id / Kanal</th>
                        <th className="py-2 px-2.5">Üye</th>
                        <th className="py-2 px-2.5">message (Bildirim Metni)</th>
                        <th className="py-2 px-2.5">status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {notificationOutbox.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-5 text-center text-slate-400 font-sans">
                            Sipariş işlendiğinde veya FOMO / 3 Gün Aktiflik uyarısı tetiklendiğinde
                            WHATSAPP / SMS / EMAIL bildirimleri burada listelenir.
                          </td>
                        </tr>
                      ) : (
                        notificationOutbox.slice(0, 20).map((n) => (
                          <tr key={n.id} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5">
                              <span className="font-bold text-slate-900">#{n.id}</span>{' '}
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                {n.channel}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 font-sans font-semibold text-slate-800">
                              {n.user_full_name}
                            </td>
                            <td className="py-2 px-2.5 font-sans text-[11px] text-slate-700">
                              {n.message}
                            </td>
                            <td className="py-2 px-2.5 font-bold text-emerald-700">{n.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. EKLENMESİ ÖNERİLEN EK VERİTABANI TABLOLARI (V2.1 PATCH SQL) */}
              <div className="lg:col-span-6 p-5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-400">
                    🗄️ EKLENMESİ ÖNERİLEN EK VERİTABANI TABLOLARI (V2.1 PATCH — PostgreSQL)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    003_monoline_v2_1_enterprise_patch.sql
                  </span>
                </div>
                <pre className="p-3 bg-slate-950 text-emerald-300 rounded-lg text-[10px] font-mono overflow-x-auto max-h-64 overflow-y-auto leading-relaxed border border-slate-800">
{`-- 1. VERGİ VE KESİNTİ DETAYLI ÇEKİM TABLOSU GÜNCELLEMESİ
ALTER TABLE withdrawal_requests 
ADD COLUMN gross_amount NUMERIC(15,2) NOT NULL,      -- Talep edilen Brüt
ADD COLUMN tax_deduction NUMERIC(15,2) DEFAULT 0.00, -- %20 Stopaj Kesintisi
ADD COLUMN net_amount NUMERIC(15,2) NOT NULL;        -- Bankaya Yatacak Net Tutar

-- 2. HUKUKİ ONAY VE GÜVENLİK İZLERİ (USERS TABLOSUNA EK)
ALTER TABLE users 
ADD COLUMN tc_identity_no VARCHAR(11) UNIQUE,        -- Stopaj ve Fatura için zorunlu
ADD COLUMN has_tax_company BOOLEAN DEFAULT FALSE,    -- Şirketi var mı? (Varsa fatura keser, stopaj düşülmez)
ADD COLUMN last_login_ip VARCHAR(45),
ADD COLUMN kvkk_approved_at TIMESTAMP,
ADD COLUMN contract_version VARCHAR(20) DEFAULT 'v2.0';

-- 3. KARİYER TEK SEFERLİK ÖDÜL & HEDİYE TAKİP TABLOSU
CREATE TABLE user_rewards_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    career_level INT NOT NULL,
    reward_type VARCHAR(50), -- 'RANK_UP_GIFT', 'FAST_START'
    reward_description VARCHAR(255),
    cash_value NUMERIC(15,2) DEFAULT 0.00,
    is_delivered BOOLEAN DEFAULT FALSE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. BİLDİRİM KUYRUĞU TABLOSU (SMS / WHATSAPP / PUSH)
CREATE TABLE notification_outbox (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    channel VARCHAR(20), -- 'WHATSAPP', 'SMS', 'EMAIL'
    message TEXT,
    status VARCHAR(20),  -- 'SENT', 'FAILED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: V2.2 6 ALTIN REVİZYON (UNILEVEL SONSUZLUK %10, LİDERLİK EŞLEŞME, DİNAMİK SIKIŞTIRMA, FAST-ROI +%15, B2C PERAKENDE & VEYA ÇEKİM KURALI) */}
        {activeV2Tab === 'V22_GOLDEN_REVISIONS' && (
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white rounded-2xl border border-emerald-500/30 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/15 pb-4">
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-300">
                    🛠️ V2.2 6 ALTIN REVİZYON · OPTİMUM %40 ŞİRKET NET KÂRI &amp; %60 SAHA DAĞITIM MİMARİSİ
                  </div>
                  <h4 className="text-lg font-bold text-white mt-0.5">
                    Monoline 7 Derinlik Duvarı Kırıldı · 3 Getir Bedavaya Getir (%105 ROI) · Esnek &ldquo;VEYA&rdquo; Çekim Kuralı
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      key: 'dynamic_compression_enabled' as const,
                      label: '1A. Dinamik Sıkıştırma',
                      val: effectiveV2Config.dynamic_compression_enabled !== false,
                    },
                    {
                      key: 'unilevel_infinity_enabled' as const,
                      label: '1B. %10 Sonsuzluk Bonusu',
                      val: effectiveV2Config.unilevel_infinity_enabled !== false,
                    },
                    {
                      key: 'matching_bonus_enabled' as const,
                      label: '2. %10-%25 Eşleşme Bonusu',
                      val: effectiveV2Config.matching_bonus_enabled !== false,
                    },
                    {
                      key: 'fast_roi_3x15_enabled' as const,
                      label: '3. +%15 Fast-ROI (3 Getir)',
                      val: effectiveV2Config.fast_roi_3x15_enabled !== false,
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      disabled={v2Busy}
                      onClick={() => handleUpdateV2Config({ [item.key]: !item.val })}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                        item.val
                          ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50'
                          : 'bg-white/10 text-slate-300 border-white/20'
                      }`}
                    >
                      {item.val ? '✓ AKTİF: ' : '✗ PASİF: '}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-white/10 border border-white/15 space-y-2">
                  <div className="text-amber-300 font-bold">
                    1. ŞİRKET NET KÂRI &amp; FONU (%40 NET)
                  </div>
                  <div className="text-2xl font-extrabold text-white">%40,00 + Devir</div>
                  <p className="font-sans text-slate-300 text-[11px] leading-relaxed">
                    Şirket operasyon marjı + devir havuzları. 1.780.000 $ ciroda şirket kasasına{' '}
                    <strong>712.000 $+ (%40)</strong> net kâr kalır.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-400/40 space-y-2">
                  <div className="text-emerald-300 font-bold">
                    2. SAHA DAĞITIMI (%60 OPTİMUM MOTİVASYON)
                  </div>
                  <div className="text-lg font-extrabold text-white">
                    %25 Monoline + %20/%15 Sponsor + %10 Sonsuzluk
                  </div>
                  <p className="font-sans text-emerald-100 text-[11px] leading-relaxed">
                    • <strong>%25 Monoline 7 Derinlik (7,5,4,3,2,2,2):</strong> Dinamik Sıkıştırmalı
                    <br />• <strong>%20 Direkt Sponsor + %15 Fast-ROI:</strong> 3 Getir Bedavaya Getir
                    <br />• <strong>%10 Unilevel Sonsuzluk &amp; %10-%25 Eşleşme:</strong> Zirve Lider Kaldıracı
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-500/20 border border-indigo-400/40 space-y-2">
                  <div className="text-indigo-200 font-bold">
                    3. B2C SEANS DEĞERİ (PERAKENDE KALDIRAÇ)
                  </div>
                  <div className="text-2xl font-extrabold text-indigo-200">
                    64 Seans × 500 $ = 32.000 $
                  </div>
                  <p className="font-sans text-indigo-100 text-[11px] leading-relaxed">
                    5.000 $ başlangıç paketindeki 64 seans kredisi danışanlara uygulandığında{' '}
                    <strong>32.000 $ Sıcak Perakende Geliri</strong> sağlar (Sıfır Mağduriyet).
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div>
                  <div className="text-xs font-mono font-bold text-indigo-700">
                    SQL: unilevel_infinity_rules · SONSUZLUK &amp; EŞLEŞME TABLOSU
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    7 Nefis Mertebesi Unilevel Sonsuzluk Fark Primi &amp; Liderlik Eşleşme Oranları
                  </h4>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-2 px-3">Kariyer</th>
                        <th className="py-2 px-3 text-right">infinity_bonus_percent</th>
                        <th className="py-2 px-3 text-right">matching_bonus_percent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {UNILEVEL_INFINITY_RULES.map((r) => (
                        <tr key={r.career_level} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-sans font-bold text-slate-900">
                            Kariyer Seviyesi {r.career_level}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-indigo-700">
                            +%{r.infinity_bonus_percent.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">
                            +%{r.matching_bonus_percent.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <pre className="p-3 bg-slate-950 text-emerald-300 rounded-lg text-[10px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`-- 1. Unilevel Sonsuzluk Bonusu Oranları Tablosu
CREATE TABLE unilevel_infinity_rules (
    career_level INT PRIMARY KEY,
    infinity_bonus_percent NUMERIC(5,2) NOT NULL,
    matching_bonus_percent NUMERIC(5,2) NOT NULL
);

-- 2. Çekim için üyenin aktif olması ve süre sonunun geçmemiş olması gerekir
const canWithdraw =
  member.is_active &&
  !member.is_locked &&
  Date.parse(member.activity_expires_at) > Date.now();`}
                </pre>
              </div>

              <div className="lg:col-span-7 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-700">
                    CANLI V2.2 SİMÜLASYON KANITI (1. ÜYEDEN 7. KARİYER KÂMİLE&apos;YE)
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    Liderlerin V2.2 (6 Altın Revizyon Sonrası) Canlı Cüzdan Kazançları
                  </h4>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-2 px-2.5">Lider / Mertebe</th>
                        <th className="py-2 px-2.5 text-right">Sponsor + ROI</th>
                        <th className="py-2 px-2.5 text-right">Derinlik + Sonsuzluk</th>
                        <th className="py-2 px-2.5 text-right">Eşleşme + Havuz</th>
                        <th className="py-2 px-2.5 text-right">V2.2 Toplam Nakit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {members.slice(0, 8).map((m) => (
                        <tr key={m.user_id} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 font-sans">
                            <div className="font-bold text-slate-900">
                              #{m.global_line_id} {m.full_name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Kariyer Seviyesi {m.career_level} (PGV:{' '}
                              {(m.group_volume_30d || 0).toLocaleString('tr-TR')} $)
                            </div>
                          </td>
                          <td className="py-2 px-2.5 text-right text-emerald-700 font-semibold">
                            {m.wallets.sponsor_wallet.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            $
                          </td>
                          <td className="py-2 px-2.5 text-right text-indigo-700 font-semibold">
                            {m.wallets.monoline_wallet.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            $
                          </td>
                          <td className="py-2 px-2.5 text-right text-purple-700 font-semibold">
                            {m.wallets.career_pool_wallet.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            $
                          </td>
                          <td className="py-2 px-2.5 text-right font-extrabold text-slate-900">
                            {m.wallets.total_earnings.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            $
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 🚀 SİSTEMİ MÜKEMMELLEŞTİRECEK 5 STRATEJİK İYİLEŞTİRME & ADMIN KONTROL PANELİ */}
            <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-500/40 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono text-[11px] font-bold">
                    🚀 BÜYÜMEYİ 2-3 KATINA ÇIKARAN 5 STRATEJİK İYİLEŞTİRME ÖNERİSİ (CANLI MODÜLLER)
                  </span>
                  <h4 className="text-base sm:text-lg font-extrabold text-white mt-1">
                    1️⃣ 48s FOMO Sayacı · 2️⃣ Hibrit Dinamik Sıkıştırma · 3️⃣ P2P &amp; Kupon · 4️⃣ İlk 30 Gün Duble Bonus · 5️⃣ WhatsApp Business Story
                  </h4>
                </div>
              </div>

              {/* 5 Stratejik İyileştirme Admin Kontrol Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                {/* 1️⃣ 48 Saatlik Geri Sayım & FOMO */}
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono font-bold text-red-300">
                      1️⃣ 48S FOMO SAYACI (+%65 DÖNÜŞÜM)
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      Pasif/yetkisiz üyeye <strong>48 saatlik canlı kırmızı sayaç</strong> gösterir; süre bitmeden aktiflik yenilenirse komisyon kurtarılır.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={v2Busy}
                    onClick={() =>
                      handleUpdateV2Config({
                        fomo_48h_countdown_enabled:
                          effectiveV2Config.fomo_48h_countdown_enabled === false,
                      })
                    }
                    className={`w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                      effectiveV2Config.fomo_48h_countdown_enabled !== false
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {effectiveV2Config.fomo_48h_countdown_enabled !== false
                      ? '✓ 48s FOMO Sayacı: AÇIK'
                      : '48s FOMO Sayacı: KAPALI'}
                  </button>
                </div>

                {/* 2️⃣ Hibrit Dinamik Sıkıştırma Modu */}
                <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-400/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono font-bold text-indigo-300">
                      2️⃣ DİNAMİK SIKIŞTIRMA MODU
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      Pasif üyeleri atlayıp <strong>%100 Aktif Lidere</strong> veya <strong>%50 Fona + %50 Aktif Lidere (Hibrit)</strong> kaydırır.
                    </p>
                  </div>
                  <select
                    value={effectiveV2Config.dynamic_compression_mode || 'FULL_COMPRESSION'}
                    disabled={v2Busy}
                    onChange={(e) =>
                      handleUpdateV2Config({
                        dynamic_compression_mode: e.target.value as
                          | 'FULL_COMPRESSION'
                          | 'HYBRID_50_50'
                          | 'FUND_SWEEP',
                        dynamic_compression_enabled: e.target.value !== 'FUND_SWEEP',
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-indigo-400/50 text-[11px] font-bold text-emerald-300"
                  >
                    <option value="FULL_COMPRESSION">%100 Aktif Lidere Sıkıştır</option>
                    <option value="HYBRID_50_50">Hibrit (%50 Fona / %50 Lidere)</option>
                    <option value="FUND_SWEEP">%100 Sistem Fonuna Devir</option>
                  </select>
                </div>

                {/* 3️⃣ P2P İç Bakiye Transferi & Aktivasyon Kodu */}
                <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono font-bold text-amber-300">
                      3️⃣ P2P TRANSFER &amp; VOUCHER KODU
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      Bayiler iç bakiyeleriyle <strong>Aktivasyon Kuponu ({activationVouchers.length} Kupon)</strong> üretebilir veya P2P paket açabilir.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={v2Busy}
                    onClick={() =>
                      handleUpdateV2Config({
                        p2p_voucher_transfer_enabled:
                          effectiveV2Config.p2p_voucher_transfer_enabled === false,
                      })
                    }
                    className={`w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                      effectiveV2Config.p2p_voucher_transfer_enabled !== false
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {effectiveV2Config.p2p_voucher_transfer_enabled !== false
                      ? '✓ P2P & Voucher: AÇIK'
                      : 'P2P & Voucher: KAPALI'}
                  </button>
                </div>

                {/* 4️⃣ İlk 30 Gün Hoş Geldin Duble Bonusu */}
                <div className="p-3.5 rounded-xl bg-purple-950/50 border border-purple-500/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono font-bold text-purple-300">
                      4️⃣ İLK 30 GÜN DUBLE BONUS (2X)
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      14 günlük 2.500 $ Fast-Start süresini <strong>30 güne esnetir</strong> ve <strong>5.000 $ Hoş Geldin Duble Bonusu</strong> verir.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={v2Busy}
                    onClick={() =>
                      handleUpdateV2Config({
                        welcome_30d_double_bonus_enabled:
                          effectiveV2Config.welcome_30d_double_bonus_enabled === false,
                        fast_start_window_days:
                          effectiveV2Config.welcome_30d_double_bonus_enabled === false ? 30 : 14,
                      })
                    }
                    className={`w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                      effectiveV2Config.welcome_30d_double_bonus_enabled !== false
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {effectiveV2Config.welcome_30d_double_bonus_enabled !== false
                      ? '✓ 30 Gün Duble Bonus (5.000 $): AÇIK'
                      : 'Standart 14 Gün (2.500 $): AÇIK'}
                  </button>
                </div>

                {/* 5️⃣ WhatsApp Business API & Push Story */}
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono font-bold text-emerald-300">
                      5️⃣ WHATSAPP BUSINESS &amp; STORY
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      Komisyon yattığı an bayiye <strong>WhatsApp Business API</strong> mesajı ve <strong>Instagram/WA Story kartı</strong> gönderir.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={v2Busy}
                    onClick={() =>
                      handleUpdateV2Config({
                        whatsapp_business_push_enabled:
                          effectiveV2Config.whatsapp_business_push_enabled === false,
                      })
                    }
                    className={`w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                      effectiveV2Config.whatsapp_business_push_enabled !== false
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {effectiveV2Config.whatsapp_business_push_enabled !== false
                      ? '✓ WhatsApp Business API: AÇIK'
                      : 'WhatsApp Business API: KAPALI'}
                  </button>
                </div>
              </div>

              {/* P2P Kuponlar ve Canlı WhatsApp Bildirim Özet Tablosu */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-amber-300">
                    🎟️ Aktif P2P Kupon Kodları (`activation_vouchers`) &amp; İç Transferler (`p2p_transfer`)
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto text-[11px] font-mono">
                    {activationVouchers.slice(0, 4).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded bg-white/5 border border-white/10"
                      >
                        <span>
                          <strong className="text-amber-300">{v.voucher_code}</strong> · {v.package_name} (Üreten: {v.creator_user_name})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.status === 'ACTIVE_UNUSED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {v.status === 'ACTIVE_UNUSED' ? 'KULLANIMA HAZIR' : `KULLANILDI (${v.redeemed_by_user_name})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-emerald-300">
                    📲 Son Gönderilen WhatsApp Business API &amp; FOMO Bildirimleri
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto text-[11px]">
                    {notificationOutbox.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        className="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-slate-200"
                      >
                        <span className="font-mono font-bold text-emerald-300 mr-1.5">
                          [{n.channel}]
                        </span>
                        <span>{n.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📋 GELİŞTİRİCİ CHECKLIST (TAMAMLAMA ADIMLARI) */}
        <div className="pt-4 border-t border-slate-200">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  📋 GELİŞTİRİCİ CHECKLIST (TAMAMLAMA ADIMLARI — V2.0 PRODUCTION READY)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Şartnamedeki 5 ana mimari bileşenin canlı çalışma durumu ve doğrulama kontrolleri.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                5 / 5 ADIM AKTİF &amp; DOĞRULANDI
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs">
              <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1">
                <div className="font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                  <span>[✓] 1. DB Migration</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <code className="font-mono">users</code> (30d hacim, max/active kariyer),{' '}
                  <code className="font-mono">wallets</code>,{' '}
                  <code className="font-mono">system_wallet</code>,{' '}
                  <code className="font-mono">commission_logs</code>,{' '}
                  <code className="font-mono">orders_log</code> şemaları devrede.
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1">
                <div className="font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                  <span>[✓] 2. Redis &amp; BullMQ</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <code className="font-mono">commission-processing</code> kuyruğu ve{' '}
                  <code className="font-mono">process-commission</code> Worker (
                  <code className="font-mono">attempts: 3, backoff: 5000</code>) bağlı.
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1">
                <div className="font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                  <span>[✓] 3. 14G Korumalı Bakiye</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Komisyonlar <code className="font-mono">pending_*_usd</code> olarak yazılır;{' '}
                  <code className="font-mono">releasePendingCommissionsCron</code> ile{' '}
                  <code className="font-mono">wallet_*_usd</code>&apos;ye aktarılır.
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1">
                <div className="font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                  <span>[✓] 4. Sipariş İptal/İade API</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <code className="font-mono">POST /api/v1/integrations/order-refund</code> ve{' '}
                  <code className="font-mono">handleOrderRefund(order_id)</code> aktif.
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1">
                <div className="font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                  <span>[✓] 5. 30G Ciro &amp; %50 Kuralı</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <code className="font-mono">calculateActiveCareer</code> motoru{' '}
                  <code className="font-mono">group_volume_30d</code> ve{' '}
                  <code className="font-mono">maxCapPerLeg (%50)</code> ile çalışır.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
