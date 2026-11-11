import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Award,
  Check,
  Coins,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  FileCode,
  Gift,
  GitBranch,
  Key,
  Lock,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Timer,
  Trash2,
  Unlock,
  Upload,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
  MessageSquare,
  Send,
  CheckCircle2,
  Filter,
  HelpCircle,
  LifeBuoy,
  Inbox,
  Sparkles,
  Receipt,
  Calculator,
} from 'lucide-react';
import {
  ActivityLogRecord,
  ActivationVoucherRecord,
  CareerTier,
  CommissionLogRecord,
  CronJobExecutionRecord,
  DealerFeedbackTicket,
  FomoCountdownAlertRecord,
  FraudRiskAlertRecord,
  FREKANS_PACKAGES,
  INITIAL_CAREER_TIERS,
  MonolineMember,
  NotificationOutboxRecord,
  OrderLogRecord,
  P2PTransferRecord,
  PACKAGES,
  PackageId,
  PoolDistributionRecord,
  SystemDistributionParameters,
  SystemWalletRecord,
  TaxRefundInvoiceRecord,
  UserRewardRecord,
  V2ArchitectureConfig,
  WebhookLogRecord,
  WithdrawalRequestRecord,
  evaluateMemberOrganizationMetrics,
} from '../types/monoline';
import { getAdminToken } from '../utils/adminSession';
import { FixedUsdRateBanner } from './common/FixedUsdRateBanner';
import { getMemberRegionalPendingUsd, getMemberRegionalUsdBalance } from '../utils/walletRegion';
import { BUSINESS_RULES } from '../config/businessRules';
import { CommissionEngineSettingsView } from './CommissionEngineSettingsView';

export type AdminConsoleSection =
  | 'members'
  | 'bonuses'
  | 'activity'
  | 'params'
  | 'commission_engine_settings'
  | 'strategic_growth'
  | 'finance'
  | 'tax_refunds'
  | 'webhooks_sql'
  | 'rest_api'
  | 'data_management'
  | 'feedback_tickets';

interface AdminConsoleViewProps {
  members: MonolineMember[];
  careerTiers: CareerTier[];
  distributionParams: SystemDistributionParameters;
  activityLogs?: ActivityLogRecord[];
  withdrawalRequests: WithdrawalRequestRecord[];
  taxRefundInvoices?: TaxRefundInvoiceRecord[];
  feedbackTickets?: DealerFeedbackTicket[];
  userRewardsLog?: UserRewardRecord[];
  notificationOutbox?: NotificationOutboxRecord[];
  fraudAlerts?: FraudRiskAlertRecord[];
  fomoAlerts?: FomoCountdownAlertRecord[];
  p2pTransfers?: P2PTransferRecord[];
  activationVouchers?: ActivationVoucherRecord[];
  v2Config?: V2ArchitectureConfig;
  onRefreshState?: () => Promise<void>;
  onOpenWebhookTab?: () => void;
  webhookLogs: WebhookLogRecord[];
  commissionLogs: CommissionLogRecord[];
  systemWallet?: SystemWalletRecord;
  ordersLog?: OrderLogRecord[];
  cronLogs: CronJobExecutionRecord[];
  poolDistributions: PoolDistributionRecord[];
  systemFundBalance: number;
  idempotentBlockedCount: number;
  initialSection?: AdminConsoleSection;
  onOpenSmartAccounting?: () => void;
  onUpdateCareers: (tiers: CareerTier[]) => Promise<void>;
  onDecideWithdrawal: (
    id: number,
    decision: 'APPROVED' | 'REJECTED',
    note?: string
  ) => Promise<void>;
  onBulkApproveWithdrawals: () => Promise<void>;
  onDistributePool: () => Promise<void>;
  onAdminUpdateMember: (
    userId: string,
    payload: {
      is_active?: boolean;
      is_locked?: boolean;
      manual_career_override?: number | null;
      sponsor_id?: string;
      swap_direction?: 'UP' | 'DOWN';
      target_line_id?: number;
      session_credits?: number;
      full_name?: string;
      city?: string;
      ref_code?: string;
      assigned_leg?: 'LEFT' | 'RIGHT' | 'AUTO';
      left_leg_volume?: number;
      right_leg_volume?: number;
      personal_volume?: number;
      group_volume?: number;
      rolling_30d_personal_volume?: number;
      rolling_30d_pgv?: number;
    }
  ) => Promise<void>;
  onAdminDeleteMember?: (userId: string) => Promise<void>;
  onResetSystem?: () => void;
  onExportData?: () => Promise<any>;
  onRestoreData?: (data: any) => Promise<boolean>;
  onRegisterMember?: (formData: {
    full_name: string;
    email?: string;
    phone?: string;
    ref_code?: string;
    city: string;
    sponsor_id: string;
    initial_package_id: Exclude<PackageId, 'CUSTOM'>;
    initial_order_amount?: number;
    manual_career_override?: number | null;
    skip_initial_order?: boolean;
    assigned_leg?: 'LEFT' | 'RIGHT' | 'AUTO';
    password?: string;
  }) => Promise<void>;
  onPayoutCareerBonus?: (payload: {
    career_level?: number | 'ALL';
    bonus_amount?: number;
    tier_bonuses?: Record<number, number>;
    match_mode?: 'EXACT_LEVEL' | 'MIN_LEVEL';
    target_user_id?: string;
    note?: string;
  }) => Promise<void>;
  onTriggerTestErrorWebhook: () => Promise<void>;
  onTriggerIdempotencyDuplicateWebhook: () => Promise<void>;
  onTriggerCareerCronJob: () => Promise<void>;
  onTriggerActivityCheckCron?: () => Promise<void>;
  onMemberActivityAction?: (
    userId: string,
    payload: { action: 'EXPIRE_NOW' }
  ) => Promise<void>;
  isSubmitting: boolean;
}

const POSTGRES_MIGRATION_SCHEMA = `-- ============================================================================
-- 2. GÜNCELLENMİŞ VERİTABANI ŞEMASI (POSTGRESQL MIGRATIONS - V2.0 PRODUCTION READY)
-- MIGRATION: 002_monoline_v2_production_schema.sql
-- ============================================================================

-- 1. USERS TABLOSU GÜNCELLEMELERİ
ALTER TABLE users 
ADD COLUMN personal_volume_30d NUMERIC(15,2) DEFAULT 0.00,
ADD COLUMN group_volume_30d NUMERIC(15,2) DEFAULT 0.00,
ADD COLUMN active_direct_referrals_30d INT DEFAULT 0,
ADD COLUMN max_career_level INT DEFAULT 1,     -- Kazanılan En Yüksek Unvan
ADD COLUMN active_career_level INT DEFAULT 1,  -- O Ay Hak Edilen Aktif Kariyer
ADD COLUMN activity_expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
ADD COLUMN monoline_position BIGSERIAL UNIQUE;

CREATE INDEX idx_monoline_pos ON users(monoline_position);
CREATE INDEX idx_sponsor_id ON users(sponsor_id);

-- 2. CÜZDANLAR VE BEKLEYEN BAKİYE TABLOSU (14 GÜN CAYMA KORUMASI)
CREATE TABLE wallets (
    user_id BIGINT PRIMARY KEY REFERENCES users(id),
    balance NUMERIC(15,2) DEFAULT 0.00,          -- Çekilebilir Bakiye
    pending_balance NUMERIC(15,2) DEFAULT 0.00,  -- 14 Günlük Blokeli Bakiye
    total_withdrawn NUMERIC(15,2) DEFAULT 0.00,
    total_earned NUMERIC(15,2) DEFAULT 0.00
);

-- 3. SİSTEM ŞİRKET VE DEVİR HAVUZU
CREATE TABLE system_wallet (
    id INT PRIMARY KEY DEFAULT 1,
    system_pool_balance NUMERIC(15,2) DEFAULT 0.00,       -- %5 Fon
    unclaimed_pool_balance NUMERIC(15,2) DEFAULT 0.00,     -- Yetkisizlik/Pasiflikten Devredenler
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO system_wallet (id, system_pool_balance, unclaimed_pool_balance) VALUES (1, 0.00, 0.00) ON CONFLICT DO NOTHING;

-- 4. DETAYLI KOMİSYON VE İŞLEM GÜNLÜĞÜ
CREATE TABLE commission_logs (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    source_user_id BIGINT REFERENCES users(id),
    target_user_id BIGINT REFERENCES users(id),
    type VARCHAR(50) NOT NULL,            -- 'SPONSOR', 'MONOLINE_DEPTH', 'SYSTEM_POOL'
    depth_level INT,
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(50) NOT NULL,         -- 'PENDING_14D', 'RELEASED', 'REFUNDED_CANCELLED', 'POOL_TRANSFER_NO_YETKI', 'POOL_TRANSFER_INACTIVE'
    release_at TIMESTAMP NOT NULL,       -- Çekilebilir Bakiyeye Geçiş Tarihi (+14 Gün)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_order_commission_unique ON commission_logs(order_id, type, COALESCE(depth_level, 0));

-- 5. SİPARİŞ HAREKETLERİ & CAYMA/İADE TAKİP TABLOSU
CREATE TABLE orders_log (
    order_id VARCHAR(100) PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    package_id VARCHAR(50),
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED', -- 'COMPLETED', 'REFUNDED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  members,
  careerTiers,
  distributionParams,
  activityLogs = [],
  withdrawalRequests,
  taxRefundInvoices = [],
  feedbackTickets = [],
  userRewardsLog = [],
  notificationOutbox = [],
  fraudAlerts = [],
  fomoAlerts = [],
  p2pTransfers = [],
  activationVouchers = [],
  v2Config,
  onRefreshState,
  onOpenWebhookTab,
  webhookLogs,
  commissionLogs,
  systemWallet,
  ordersLog = [],
  cronLogs,
  poolDistributions,
  systemFundBalance,
  idempotentBlockedCount,
  initialSection = 'members',
  onOpenSmartAccounting,
  onUpdateCareers,
  onDecideWithdrawal,
  onBulkApproveWithdrawals,
  onDistributePool,
  onAdminUpdateMember,
  onAdminDeleteMember,
  onResetSystem,
  onExportData,
  onRestoreData,
  onRegisterMember,
  onPayoutCareerBonus,
  onTriggerTestErrorWebhook,
  onTriggerIdempotencyDuplicateWebhook,
  onTriggerCareerCronJob,
  onTriggerActivityCheckCron,
  onMemberActivityAction,
  isSubmitting,
}) => {
  const [adminSection, setAdminSection] = useState<AdminConsoleSection>(initialSection);

  // Veri / Data Yönetim Portalı & Yedekleme State
  const [dataJsonCode, setDataJsonCode] = useState<string>('');
  const [dataImportText, setDataImportText] = useState<string>('');
  const [isExportingData, setIsExportingData] = useState<boolean>(false);
  const [isImportingData, setIsImportingData] = useState<boolean>(false);
  const [dataNotice, setDataNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [dataCodeCopied, setDataCodeCopied] = useState<boolean>(false);

  // Sistemi Sıfırla Uyarı Modalı State
  const [showResetWarningModal, setShowResetWarningModal] = useState<boolean>(false);

  // Ağ, Ekip & Kol Dengesi Düzenleme Modalı State
  const [editingMember, setEditingMember] = useState<MonolineMember | null>(null);
  const [editSponsorId, setEditSponsorId] = useState<string>('');
  const [editLineId, setEditLineId] = useState<number>(1);
  const [editAssignedLeg, setEditAssignedLeg] = useState<'LEFT' | 'RIGHT' | 'AUTO'>('AUTO');
  const [editLeftLegVol, setEditLeftLegVol] = useState<number>(0);
  const [editRightLegVol, setEditRightLegVol] = useState<number>(0);
  const [editPersonalVol, setEditPersonalVol] = useState<number>(0);
  const [editGroupVol, setEditGroupVol] = useState<number>(0);
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editCareerOverride, setEditCareerOverride] = useState<string>('');
  const [editFullName, setEditFullName] = useState<string>('');
  const [editCity, setEditCity] = useState<string>('');
  const [editRefCode, setEditRefCode] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editIsLocked, setEditIsLocked] = useState<boolean>(false);

  React.useEffect(() => {
    if (initialSection) {
      setAdminSection(initialSection);
    }
  }, [initialSection]);

  // Çift Motorlu Hibrit Komisyon Mimarisi Yönetici Düzenleme State'leri
  const [isEditingBusinessRules, setIsEditingBusinessRules] = useState<boolean>(false);
  const [editUnilevelPercentages, setEditUnilevelPercentages] = useState<number[]>(() => [
    ...(distributionParams?.unilevel_depth_percentages || BUSINESS_RULES.UNILEVEL_DEPTH_PERCENTAGES),
  ]);
  const [editMonolinePercentages, setEditMonolinePercentages] = useState<number[]>(() => [
    ...(distributionParams?.monoline_incentive_percentages || BUSINESS_RULES.MONOLINE_INCENTIVE_PERCENTAGES),
  ]);
  const [editDirectSponsor, setEditDirectSponsor] = useState<number>(
    typeof distributionParams?.direct_sponsor_percent === 'number'
      ? distributionParams.direct_sponsor_percent
      : BUSINESS_RULES.DIRECT_SPONSOR_BONUS_PERCENT
  );
  const [editSystemFund, setEditSystemFund] = useState<number>(
    typeof distributionParams?.system_fund_percent === 'number'
      ? distributionParams.system_fund_percent
      : BUSINESS_RULES.SYSTEM_FUND_PERCENT
  );
  const [editClawbackDays, setEditClawbackDays] = useState<number>(
    BUSINESS_RULES.CLAWBACK_PROTECTION_DAYS
  );
  const [editMaxSingleLeg, setEditMaxSingleLeg] = useState<number>(
    BUSINESS_RULES.MAX_SINGLE_LEG_PERCENT
  );
  const [ruleSaveMessage, setRuleSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSavingRules, setIsSavingRules] = useState<boolean>(false);

  const handleSaveBusinessRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRules(true);
    setRuleSaveMessage(null);
    try {
      const res = await fetch('/api/v1/admin/business-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurabio_admin_jwt') || ''}`,
        },
        body: JSON.stringify({
          UNILEVEL_DEPTH_PERCENTAGES: editUnilevelPercentages.map(Number),
          MONOLINE_INCENTIVE_PERCENTAGES: editMonolinePercentages.map(Number),
          DIRECT_SPONSOR_BONUS_PERCENT: Number(editDirectSponsor),
          SYSTEM_FUND_PERCENT: Number(editSystemFund),
          CLAWBACK_PROTECTION_DAYS: Number(editClawbackDays),
          MAX_SINGLE_LEG_PERCENT: Number(editMaxSingleLeg),
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setRuleSaveMessage({
          type: 'success',
          text: 'Çift Motorlu Hibrit Komisyon oranları yönetici tarafından başarıyla güncellendi.',
        });
        setIsEditingBusinessRules(false);
        if (onRefreshState) await onRefreshState();
      } else {
        setRuleSaveMessage({
          type: 'error',
          text: data?.message || 'Güncelleme işlemi başarısız oldu.',
        });
      }
    } catch (err: any) {
      setRuleSaveMessage({
        type: 'error',
        text: err?.message || 'Sunucu bağlantı hatası oluştu.',
      });
    } finally {
      setIsSavingRules(false);
    }
  };

  // New Dealer Creation Form State
  const [newDealerName, setNewDealerName] = useState('');
  const [newDealerEmail, setNewDealerEmail] = useState('');
  const [newDealerPhone, setNewDealerPhone] = useState('');
  const [newDealerCity, setNewDealerCity] = useState('İstanbul');
  const [newDealerRefCode, setNewDealerRefCode] = useState('');
  const [newDealerSponsorId, setNewDealerSponsorId] = useState<string>('');
  const [newDealerPkgId, setNewDealerPkgId] =
    useState<Exclude<PackageId, 'CUSTOM'>>('PKG_ALTIN_PRO');
  const [newDealerCareerOverride, setNewDealerCareerOverride] = useState<string>('');
  const [newDealerSkipOrder, setNewDealerSkipOrder] = useState<boolean>(false);
  const [newDealerPassword, setNewDealerPassword] = useState<string>('123456');
  const [showNewDealerPassword, setShowNewDealerPassword] = useState<boolean>(false);
  const [newDealerLeg, setNewDealerLeg] = useState<'LEFT' | 'RIGHT' | 'AUTO'>('AUTO');

  // Career Bonus Management State
  const [tierBonusAmounts, setTierBonusAmounts] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    for (const t of careerTiers) {
      initial[t.level] = t.fixedCareerBonusAmount ?? t.level * 2500;
    }
    return initial;
  });
  const [bonusMatchMode, setBonusMatchMode] = useState<'EXACT_LEVEL' | 'MIN_LEVEL'>('EXACT_LEVEL');
  const [customBonusTargetUserId, setCustomBonusTargetUserId] = useState<string>('');
  const [customBonusAmount, setCustomBonusAmount] = useState<number>(2500);
  const [customBonusNote, setCustomBonusNote] = useState<string>('Yönetici Özel Kariyer & Performans Bonusu');

  React.useEffect(() => {
    const next: Record<number, number> = {};
    for (const t of careerTiers) {
      next[t.level] = t.fixedCareerBonusAmount ?? tierBonusAmounts[t.level] ?? t.level * 2500;
    }
    setTierBonusAmounts(next);
  }, [careerTiers]);

  // Dynamic career tiers state
  const [editableTiers, setEditableTiers] = useState<CareerTier[]>(() =>
    structuredClone(careerTiers)
  );

  // SQL & Webhook sub-view state
  const [sqlTableTab, setSqlTableTab] = useState<
    | 'WEBHOOK_LOGS'
    | 'USERS'
    | 'WALLETS'
    | 'SYSTEM_WALLET'
    | 'COMMISSION_LOGS'
    | 'ORDERS_LOG'
    | 'WITHDRAWAL_REQUESTS'
    | 'ACTIVITY_LOGS'
    | 'DDL'
  >('WEBHOOK_LOGS');
  const [webhookStatusFilter, setWebhookStatusFilter] = useState<
    'ALL' | 'SUCCESS' | 'FAILED' | 'IDEMPOTENT_REJECTED'
  >('ALL');
  const [copiedSql, setCopiedSql] = useState(false);

  // REST API Explorer State
  const [apiResponseTitle, setApiResponseTitle] = useState<string>(
    'GET /api/v1/admin/stats (Varsayılan Önizleme)'
  );
  const [apiResponseJson, setApiResponseJson] = useState<string>('');
  const [apiLoading, setApiLoading] = useState<boolean>(false);

  // 🎁 Yönetici Tarafından Belirlenen Bonus Kredileri Seçilen Bayiye Yükleme State'leri
  const [bonusCreditTargetUserId, setBonusCreditTargetUserId] = useState<string>('');
  const [bonusCreditAmount, setBonusCreditAmount] = useState<number>(250);
  const [bonusCreditNote, setBonusCreditNote] = useState<string>(
    'Yönetici Özel Kariyer Başarı Bonusu'
  );
  const [bonusCreditBusy, setBonusCreditBusy] = useState<boolean>(false);
  const [bonusCreditFeedback, setBonusCreditFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 💬 Bayi Şikayetler & Öneriler Yönetim Paneli State'leri
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<
    'ALL' | 'COMPLAINT' | 'SUGGESTION' | 'REQUEST' | 'INQUIRY'
  >('ALL');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<
    'ALL' | 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'
  >('ALL');
  const [activeReplyTicketId, setActiveReplyTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [ticketActionBusy, setTicketActionBusy] = useState<boolean>(false);
  const [ticketFeedback, setTicketFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleGrantBonusCredits = async (
    targetUserId: string,
    credits: number,
    note?: string
  ) => {
    setBonusCreditBusy(true);
    setBonusCreditFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/bonuses/credit-grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          target_user_id: targetUserId,
          credit_amount: credits,
          note: note || 'Yönetici Kariyer Bonusu',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bonus kredi yüklenemedi.');
      setBonusCreditFeedback({ type: 'success', text: data.message });
      if (onRefreshState) await onRefreshState();
    } catch (err: any) {
      setBonusCreditFeedback({
        type: 'error',
        text: err.message || 'Bonus kredi yüklenirken hata oluştu.',
      });
    } finally {
      setBonusCreditBusy(false);
    }
  };

  const handleUpdateTicketStatus = async (
    ticketId: string,
    status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED',
    reply?: string
  ) => {
    setTicketActionBusy(true);
    setTicketFeedback(null);
    try {
      const res = await fetch(`/api/v1/admin/feedback-tickets/${encodeURIComponent(ticketId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          status,
          admin_reply: reply !== undefined ? reply : undefined,
          admin_replied_by: 'Abdulkadir kan (Yönetim Kurulu Başkanı)',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bildirim güncellenemedi.');
      setTicketFeedback({ type: 'success', text: data.message });
      setActiveReplyTicketId(null);
      setReplyText('');
      if (onRefreshState) await onRefreshState();
    } catch (err: any) {
      setTicketFeedback({ type: 'error', text: err.message || 'Hata oluştu.' });
    } finally {
      setTicketActionBusy(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (
      !window.confirm(
        `Bu bildirimi (#${ticketId}) kalıcı olarak silmek istediğinizden emin misiniz?`
      )
    )
      return;
    setTicketActionBusy(true);
    setTicketFeedback(null);
    try {
      const res = await fetch(`/api/v1/admin/feedback-tickets/${encodeURIComponent(ticketId)}`, {
        method: 'DELETE',
        headers: {

        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bildirim silinemedi.');
      setTicketFeedback({ type: 'success', text: data.message });
      if (onRefreshState) await onRefreshState();
    } catch (err: any) {
      setTicketFeedback({
        type: 'error',
        text: err.message || 'Bildirim silinirken hata oluştu.',
      });
    } finally {
      setTicketActionBusy(false);
    }
  };

  // 🚀 5 Stratejik Büyüme Modülü & V2.2 Yönetici Ayarları State'leri
  const [strategicTargetUserId, setStrategicTargetUserId] = useState<string>(
    members[0]?.user_id || 'USR-1001'
  );
  const [adminP2pRecipientId, setAdminP2pRecipientId] = useState<string>(
    members[1]?.user_id || 'USR-1002'
  );
  const [adminP2pAmount, setAdminP2pAmount] = useState<number>(2500);
  const [adminP2pMode, setAdminP2pMode] = useState<'BALANCE_TRANSFER' | 'DIRECT_PACKAGE_ACTIVATION'>(
    'BALANCE_TRANSFER'
  );
  const [adminVoucherPkgId, setAdminVoucherPkgId] =
    useState<Exclude<PackageId, 'CUSTOM'>>('PKG_MINI_DENEME');
  const [adminRedeemCode, setAdminRedeemCode] = useState<string>('');
  const [adminRefundAmount, setAdminRefundAmount] = useState<number>(5000);
  const [strategicActionMsg, setStrategicActionMsg] = useState<string | null>(null);
  const [strategicBusy, setStrategicBusy] = useState<boolean>(false);
  const [usdRateInfo, setUsdRateInfo] = useState<{
    usd_try_rate: number;
    updated_at: string | null;
    updated_by: string | null;
  } | null>(null);
  const [usdRateLoadError, setUsdRateLoadError] = useState(false);
  const [usdRateInput, setUsdRateInput] = useState<string>('');
  const [usdRateBusy, setUsdRateBusy] = useState<boolean>(false);
  const [usdRateMsg, setUsdRateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showStrategicFeedback = (msg: string) => {
    setStrategicActionMsg(msg);
    setTimeout(() => setStrategicActionMsg(null), 5000);
  };

  const handleAdminToggleV2Config = async (patch: Partial<V2ArchitectureConfig>) => {
    setStrategicBusy(true);
    try {
      const res = await fetch('/api/v1/admin/v2-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.message) showStrategicFeedback(data.message);
      if (onRefreshState) await onRefreshState();
    } finally {
      setStrategicBusy(false);
    }
  };

  const handleAdminCreateFomoAlert = async () => {
    setStrategicBusy(true);
    try {
      const res = await fetch('/api/v1/fomo/trigger-48h-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: strategicTargetUserId,
          at_risk_amount: 2400,
          depth_level: 2,
        }),
      });
      const data = await res.json();
      if (data.message) showStrategicFeedback(data.message);
      if (onRefreshState) await onRefreshState();
    } finally {
      setStrategicBusy(false);
    }
  };

  const handleAdminConvertFomoAlert = async (alertId: string | number, externalUserId?: string) => {
    setStrategicBusy(true);
    try {
      const res = await fetch('/api/v1/fomo/rescue-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, user_id: externalUserId }),
      });
      const data = await res.json();
      if (data.message) showStrategicFeedback(data.message);
      if (onRefreshState) await onRefreshState();
    } finally {
      setStrategicBusy(false);
    }
  };

  const handleAdminP2pTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setStrategicBusy(true);
    try {
      const res = await fetch('/api/v1/p2p/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: strategicTargetUserId,
          to_user_id: adminP2pRecipientId,
          amount: adminP2pAmount,
          transfer_type:
            adminP2pMode === 'DIRECT_PACKAGE_ACTIVATION'
              ? 'DIRECT_PACKAGE_ACTIVATION'
              : 'WALLET_TO_WALLET',
          package_id: adminP2pMode === 'DIRECT_PACKAGE_ACTIVATION' ? 'PKG_MINI_DENEME' : undefined,
          note: `Yönetici P2P / Paket Aktivasyon İşlemi`,
        }),
      });
      const data = await res.json();
      showStrategicFeedback(data.message || data.error || 'P2P transfer tamamlandı.');
      if (onRefreshState) await onRefreshState();
    } finally {
      setStrategicBusy(false);
    }
  };

  const handleAdminGenerateVoucher = async () => {
    setStrategicBusy(true);
    try {
      const res = await fetch('/api/v1/p2p/create-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_user_id: strategicTargetUserId,
          package_id: adminVoucherPkgId,
        }),
      });
      const data = await res.json();
      showStrategicFeedback(data.message || data.error || 'Aktivasyon kuponu üretildi.');
      if (onRefreshState) await onRefreshState();
    } finally {
      setStrategicBusy(false);
    }
  };

  const handleAdminRedeemVoucher = async (codeToRedeem?: string) => {
    const code = (codeToRedeem || adminRedeemCode).trim();
    if (!code) return;
    setStrategicBusy(true);
    try {
      const res = await fetch('/api/v1/p2p/redeem-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_code: code,
          redeemer_user_id: strategicTargetUserId,
        }),
      });
      const data = await res.json();
      showStrategicFeedback(data.message || data.error || 'Kupon kodu kullanıldı.');
      setAdminRedeemCode('');
      if (onRefreshState) await onRefreshState();
    } finally {
      setStrategicBusy(false);
    }
  };

  const handleAdminTriggerWelcomeDoubleBonus = async () => {
    setStrategicBusy(true);
    try {
      const res = await fetch('/api/v1/admin/rewards/trigger-welcome-double-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: strategicTargetUserId }),
      });
      const data = await res.json();
      showStrategicFeedback(data.message || 'İlk 30 Gün Duble Bonus tanımlandı.');
      if (onRefreshState) await onRefreshState();
    } finally {
      setStrategicBusy(false);
    }
  };

  const handleAdminTriggerWhatsAppPush = async () => {
    setStrategicBusy(true);
    try {
      const res = await fetch('/api/v1/notifications/send-whatsapp-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: strategicTargetUserId,
          order_amount: 50000,
          commission_amount: 10000,
        }),
      });
      const data = await res.json();
      showStrategicFeedback(data.message || 'WhatsApp Business bildirimi gönderildi.');
      if (onRefreshState) await onRefreshState();
    } finally {
      setStrategicBusy(false);
    }
  };

  const handleAdminSimulateRefundClawback = async () => {
    setStrategicBusy(true);
    try {
      const latestCompletedOrder =
        ordersLog.find(
          (o) =>
            o.status === 'COMPLETED' &&
            (o.external_user_id === strategicTargetUserId || String(o.user_id) === strategicTargetUserId)
        ) || ordersLog.find((o) => o.status === 'COMPLETED');

      if (!latestCompletedOrder) {
        showStrategicFeedback('İade edilecek tamamlanmış (COMPLETED) bir sipariş bulunamadı.');
        return;
      }

      const res = await fetch('/api/v1/integrations/order-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: latestCompletedOrder.order_id,
          reason: `Yönetici Cayma / İade (Clawback) İşlemi (${adminRefundAmount.toLocaleString('tr-TR')} $)`,
        }),
      });
      const data = await res.json();
      showStrategicFeedback(
        data.message || 'İade / Cayma (Clawback) komisyon iptali uygulandı.'
      );
      if (onRefreshState) await onRefreshState();
    } finally {
      setStrategicBusy(false);
    }
  };

  React.useEffect(() => {
    setEditableTiers(structuredClone(careerTiers));
  }, [careerTiers]);

  const sortedMembers = [...members].sort((a, b) => a.global_line_id - b.global_line_id);

  React.useEffect(() => {
    if (adminSection !== 'params') return;
    const controller = new AbortController();
    setUsdRateInfo(null);
    setUsdRateLoadError(false);
    setUsdRateMsg(null);
    fetch('/api/v1/admin/exchange-rate', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getAdminToken() ?? ''}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(res.status === 401 ? 'Yönetici oturumu doğrulanamadı. Yeniden giriş yapın.' : 'Mevcut kur okunamadı.');
        }
        const data = await res.json();
        if (data.status !== 'success' || !data.data || typeof data.data.usd_try_rate !== 'number' || !Number.isFinite(data.data.usd_try_rate)) {
          throw new Error('Kur bilgisi beklenen biçimde alınamadı.');
        }
        setUsdRateInfo(data.data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setUsdRateLoadError(true);
        setUsdRateMsg({
          type: 'error',
          text: err instanceof Error && !(err instanceof TypeError) && !(err instanceof SyntaxError)
            ? err.message
            : 'Mevcut kur okunamadı.',
        });
      });
    return () => controller.abort();
  }, [adminSection]);

  const handleUpdateUsdRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(usdRateInput);
    if (!Number.isFinite(rate) || rate <= 0) {
      setUsdRateMsg({ type: 'error', text: 'Kur pozitif bir sayı olmalıdır.' });
      return;
    }
    setUsdRateBusy(true);
    setUsdRateMsg(null);
    try {
      const res = await fetch('/api/v1/admin/exchange-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken() ?? ''}`,
        },
        body: JSON.stringify({ usd_try_rate: rate }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Kur güncellenemedi.');
      }
      setUsdRateInfo(data.data);
      setUsdRateLoadError(false);
      setUsdRateInput('');
      setUsdRateMsg({ type: 'success', text: 'Kur başarıyla güncellendi' });
    } catch (err) {
      setUsdRateMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Kur güncellenirken bilinmeyen bir hata oluştu.',
      });
    } finally {
      setUsdRateBusy(false);
    }
  };

  const handleSaveCareerTiers = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateCareers(editableTiers);
  };

  const handleDownloadWithdrawalsCsv = () => {
    const headers = [
      'id',
      'user_id',
      'external_app_user_id',
      'ad_soyad',
      'monoline_position',
      'career_title',
      'amount',
      'payout_method',
      'payout_address',
      'status',
      'created_at',
    ];
    const rows = withdrawalRequests.map((w) => [
      w.id,
      w.user_id,
      w.external_user_id,
      `"${w.user_full_name}"`,
      w.monoline_position,
      `"${w.career_title}"`,
      w.amount.toFixed(2),
      w.payout_method,
      `"${w.payout_address}"`,
      w.status,
      w.created_at,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cekim_talepleri_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadMigrationSql = () => {
    const blob = new Blob([POSTGRES_MIGRATION_SCHEMA], { type: 'application/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '001_monoline_schema.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySql = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(POSTGRES_MIGRATION_SCHEMA);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  const handleTestEndpoint = async (
    label: string,
    url: string,
    method: 'GET' | 'POST' | 'PUT' = 'GET',
    role: 'ADMIN' | 'DEALER' = 'DEALER',
    body?: any
  ) => {
    setApiLoading(true);
    setApiResponseTitle(`${method} ${url} (${role} JWT)`);
    try {
      const token = role === 'ADMIN' ? getAdminToken() ?? '' : 'INVALID_DEALER_TEST_TOKEN';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setApiResponseJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiResponseJson(JSON.stringify({ error: err?.message || 'İstek hatası' }, null, 2));
    } finally {
      setApiLoading(false);
    }
  };

  const pendingWithdrawals = withdrawalRequests.filter((w) => w.status === 'PENDING');
  const pendingTaxRefunds = taxRefundInvoices.filter(
    (inv) => inv.status === 'PENDING_ADMIN_APPROVAL'
  );
  const [previewInvoice, setPreviewInvoice] = useState<TaxRefundInvoiceRecord | null>(null);
  const [taxRefundBusyId, setTaxRefundBusyId] = useState<number | null>(null);
  const [taxRefundFeedback, setTaxRefundFeedback] = useState<string | null>(null);

  const handleDecideTaxRefund = async (
    invId: number,
    decision: 'APPROVED' | 'REJECTED',
    note?: string
  ) => {
    setTaxRefundBusyId(invId);
    setTaxRefundFeedback(null);
    try {
      const res = await fetch(`/api/v1/admin/tax-refunds/${invId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({ decision, admin_note: note }),
      });
      const data = await res.json();
      if (data.message) {
        setTaxRefundFeedback(data.message);
      }
      if (onRefreshState) {
        await onRefreshState();
      }
    } catch (err: any) {
      setTaxRefundFeedback(err?.message || 'Vergi iadesi işlemi sırasında hata oluştu.');
    } finally {
      setTaxRefundBusyId(null);
    }
  };

  const filteredWebhookLogs = webhookLogs.filter((l) =>
    webhookStatusFilter === 'ALL' ? true : l.status === webhookStatusFilter
  );

  const handleAddDealerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRegisterMember || !newDealerName.trim()) return;
    await onRegisterMember({
      full_name: newDealerName.trim(),
      email: newDealerEmail.trim() || undefined,
      phone: newDealerPhone.trim() || undefined,
      ref_code: newDealerRefCode.trim().toUpperCase() || undefined,
      city: newDealerCity.trim() || 'Türkiye',
      sponsor_id: newDealerSponsorId,
      initial_package_id: newDealerPkgId,
      manual_career_override:
        newDealerCareerOverride === '' ? null : Number(newDealerCareerOverride),
      skip_initial_order: newDealerSkipOrder,
      password: newDealerPassword.trim() || '123456',
      assigned_leg: newDealerLeg,
    });
    setNewDealerName('');
    setNewDealerEmail('');
    setNewDealerPhone('');
    setNewDealerRefCode('');
    setNewDealerPassword('123456');
    setNewDealerLeg('AUTO');
  };

  const handleSaveTierBonusAmountsToCareers = async () => {
    const updated = editableTiers.map((t) => ({
      ...t,
      fixedCareerBonusAmount: Number(tierBonusAmounts[t.level] ?? t.fixedCareerBonusAmount ?? 1000),
    }));
    setEditableTiers(updated);
    await onUpdateCareers(updated);
  };

  // Ağ, Ekip & Kol Dengesi Düzenleme Handlers
  const handleOpenMemberEditor = (m: MonolineMember) => {
    setEditingMember(m);
    setEditSponsorId(m.sponsor_id || '');
    setEditLineId(m.global_line_id);
    setEditAssignedLeg((m as any).assigned_leg || 'AUTO');
    setEditLeftLegVol(Number((m as any).left_leg_volume || 0));
    setEditRightLegVol(Number((m as any).right_leg_volume || 0));
    setEditPersonalVol(m.personal_volume || 0);
    setEditGroupVol(m.group_volume || 0);
    setEditCredits(m.session_credits || 0);
    setEditCareerOverride(m.manual_career_override !== null ? String(m.manual_career_override) : '');
    setEditFullName(m.full_name || '');
    setEditCity(m.city || '');
    setEditRefCode(m.ref_code || '');
    setEditIsActive(m.is_active !== false);
    setEditIsLocked(Boolean(m.is_locked));
  };

  const handleSaveMemberEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    await onAdminUpdateMember(editingMember.user_id, {
      full_name: editFullName,
      city: editCity,
      ref_code: editRefCode,
      sponsor_id: editSponsorId || undefined,
      target_line_id: editLineId !== editingMember.global_line_id ? editLineId : undefined,
      assigned_leg: editAssignedLeg,
      left_leg_volume: editLeftLegVol,
      right_leg_volume: editRightLegVol,
      personal_volume: editPersonalVol,
      group_volume: editGroupVol,
      session_credits: editCredits,
      manual_career_override: editCareerOverride === '' ? null : Number(editCareerOverride),
      is_active: editIsActive,
      is_locked: editIsLocked,
    });
    setEditingMember(null);
  };

  // Veri / Data Yönetim Portalı: Canlı Veri Hazırlama & Güncel Tutma
  const generateLatestStatePayload = () => {
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      version: '2.2.0',
      system: 'akngroupwellness',
      data: {
        members: sortedMembers,
        distributionParams,
        careerTiers: editableTiers,
        v2ArchitectureConfig: v2Config,
        systemWallet,
        systemCareerFundBalance: systemFundBalance,
        systemCareerFundCumulative: systemFundBalance,
        systemFundBalance,
        commissionLogs,
        ordersLog,
        withdrawalRequests,
        taxRefundInvoices,
        userRewardsLog,
        notificationOutbox,
        fraudAlerts,
        fomoAlerts,
        p2pTransfers,
        activationVouchers,
        webhookLogs: webhookLogs.slice(0, 100),
        cronLogs,
        poolDistributions,
      },
    };
  };

  // Uygulama değiştikçe veri kodunu anında en son haliyle günceller
  React.useEffect(() => {
    const payload = generateLatestStatePayload();
    setDataJsonCode(JSON.stringify(payload, null, 2));
  }, [
    members,
    distributionParams,
    careerTiers,
    commissionLogs,
    ordersLog,
    withdrawalRequests,
    systemWallet,
    systemFundBalance,

    taxRefundInvoices,
    userRewardsLog,
    notificationOutbox,
    fraudAlerts,
    fomoAlerts,
    p2pTransfers,
    activationVouchers,
    webhookLogs,
    cronLogs,
    poolDistributions,
    v2Config,
  ]);

  const handleSyncLiveServerData = async () => {
    setIsExportingData(true);
    try {
      if (onRefreshState) await onRefreshState();
      const res = await fetch('/api/v1/admin/export-data');
      if (res.ok) {
        const json = await res.json();
        setDataJsonCode(JSON.stringify(json, null, 2));
        setDataNotice({
          type: 'success',
          message: `Canlı veriler sunucudan en güncel haliyle senkronize edildi (${new Date().toLocaleTimeString('tr-TR')}). Tüm ${json.data?.members?.length || sortedMembers.length} bayi, cüzdanlar ve loglar günceldir.`,
        });
      }
    } catch (err: any) {
      setDataNotice({ type: 'error', message: 'Senkronizasyon hatası: ' + (err?.message || '') });
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDownloadAllData = async () => {
    setIsExportingData(true);
    try {
      let exportObj = null;
      if (onExportData) {
        exportObj = await onExportData();
      }
      if (!exportObj || !exportObj.data) {
        exportObj = generateLatestStatePayload();
      }
      const jsonStr = JSON.stringify(exportObj, null, 2);
      setDataJsonCode(jsonStr);

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const nowStr = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      a.href = url;
      a.download = `akngroupwellness_tam_veri_yedegi_${nowStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDataNotice({
        type: 'success',
        message: `Sistemdeki tüm veriler (${sortedMembers.length} bayi, cüzdanlar, komisyonlar, siparişler, kariyerler ve ayarlar) JSON kod dosyası olarak başarıyla indirildi.`,
      });
    } catch (err: any) {
      setDataNotice({ type: 'error', message: 'Veri indirme hatası: ' + (err?.message || '') });
    } finally {
      setIsExportingData(false);
    }
  };

  const handleRestoreDataFromCodeOrFile = async (rawCode?: string) => {
    const code = rawCode !== undefined ? rawCode : dataImportText;
    if (!code || !code.trim()) {
      setDataNotice({ type: 'error', message: 'Lütfen yüklenecek JSON kod verisini yapıştırın veya dosya seçin.' });
      return;
    }
    setIsImportingData(true);
    try {
      const parsed = JSON.parse(code);
      const payload = parsed.data || parsed;
      let ok = false;
      if (onRestoreData) {
        ok = await onRestoreData(payload);
      } else {
        const res = await fetch('/api/v1/admin/restore-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: payload }),
        });
        const resJson = await res.json();
        ok = res.ok;
      }
      if (ok) {
        setDataNotice({
          type: 'success',
          message: 'Tüm veriler başarıyla yüklendi! Sistem yüklenilen verileri geri yükledi ve canlı olarak göstermektedir.',
        });
        setDataImportText('');
        if (onRefreshState) await onRefreshState();
      } else {
        setDataNotice({ type: 'error', message: 'Veriler sisteme aktarılamadı. Lütfen JSON yapısını kontrol edin.' });
      }
    } catch (err: any) {
      setDataNotice({ type: 'error', message: 'Geçersiz JSON kod formatı: ' + (err?.message || '') });
    } finally {
      setIsImportingData(false);
    }
  };

  const handleJsonFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setDataImportText(text);
      handleRestoreDataFromCodeOrFile(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteResetSystem = () => {
    if (onResetSystem) {
      onResetSystem();
    } else {
      fetch('/api/v1/reset', { method: 'POST' }).then(() => {
        if (onRefreshState) onRefreshState();
      });
    }
    setShowResetWarningModal(false);
  };

  const totalCareerBonusesPaid = sortedMembers.reduce(
    (sum, m) => sum + (m.wallets.career_pool_wallet || 0),
    0
  );

  return (
    <div className="grid min-w-0 max-w-full grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* MODÜL 6 Header & Sub-navigation */}
      <div className="self-start rounded-2xl border border-indigo-900/70 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-5 shadow-xl lg:sticky lg:top-4">
        <div>
          <div className="text-xs font-mono text-emerald-300 font-bold">
            TAM SAYFA YÖNETİCİ KONSOLU · MONOLINE 7 NEFİS MLM · BAYİ, HAT SIRALAMA & BONUS YÖNETİMİ
          </div>
          <h2 className="text-xl font-bold text-white mt-0.5">
            Bayi Ekleme/Silme, Monoline Sıra & Sponsor Değiştirme, Kariyer Bonus Yönetimi & SQL
          </h2>
          <div className="mt-4 flex flex-col items-stretch gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenSmartAccounting) onOpenSmartAccounting();
                else window.dispatchEvent(new CustomEvent('open-smart-accounting'));
              }}
              className="inline-flex items-center justify-between gap-1.5 px-3.5 py-2.5 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-300 hover:from-amber-200 hover:to-emerald-200 border border-amber-400 rounded-xl cursor-pointer shadow-lg shadow-amber-950/30 transition-transform active:scale-95"
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-950" />
                <span className="font-black text-slate-950 text-xs">Akıllı Muhasebe (CFO Suite)</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-950 text-amber-300 font-mono font-bold">GİB CANLI</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminSection('data_management')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Veri / Data Yönetim Portalı</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadAllData}
              disabled={isExportingData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isExportingData ? 'İndiriliyor...' : 'Veri İndir (JSON/Kod)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminSection('data_management')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-purple-600" />
              <span>Veri Yükle</span>
            </button>
            <button
              type="button"
              onClick={() => setShowResetWarningModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600" />
              <span>Sistemi Sıfırla</span>
            </button>
          </div>
        </div>

        <nav aria-label="Monoline yönetim bölümleri" className="mt-5 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-2 [&>button]:w-full [&>button]:justify-start [&>button]:text-left">
          <button
            type="button"
            onClick={() => setAdminSection('members')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              adminSection === 'members'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            1. Bayi Ekle/Sil, Hat Sıralama & Sponsor ({sortedMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setAdminSection('bonuses')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              adminSection === 'bonuses'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>2. Bonus Yönetimi (Anında Cüzdana Aktar)</span>
          </button>
          <button
            type="button"
            onClick={() => setAdminSection('activity')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              adminSection === 'activity'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>3. Aktiflik Şartları &amp; Zamanlayıcı Yönetimi</span>
          </button>
          <button
            type="button"
            onClick={() => setAdminSection('params')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              adminSection === 'params'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>4. 7 Nefis Kariyer, PGV, %50 Kol &amp; Organizasyon Şartları</span>
          </button>
          <button
            type="button"
            onClick={() => setAdminSection('commission_engine_settings')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
              adminSection === 'commission_engine_settings'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 text-white shadow-md ring-2 ring-indigo-400'
                : 'bg-gradient-to-r from-indigo-950/70 to-teal-950/70 text-indigo-200 hover:text-white hover:from-indigo-900 hover:to-teal-900 border border-indigo-400/30'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Sliders className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">⚙️ Commission Engine Settings</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-emerald-300 border border-emerald-400/30 shrink-0">
              %25 + %5
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAdminSection('strategic_growth')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              adminSection === 'strategic_growth'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-100 text-purple-950 hover:bg-purple-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>🚀 5. Büyümeyi 2-3 Katına Çıkaran 5 Stratejik Modül &amp; V2.2 Ayarları</span>
          </button>
          <button
            type="button"
            onClick={() => setAdminSection('finance')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              adminSection === 'finance'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            6. Finans & Çekim ({pendingWithdrawals.length} Bekleyen)
          </button>
          <button
            type="button"
            onClick={() => setAdminSection('tax_refunds')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              adminSection === 'tax_refunds'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-teal-100 text-teal-950 hover:bg-teal-200 border border-teal-300'
            }`}
          >
            <span>🧾 Vergi İadesi &amp; Fatura Onayı (%20 İade · {pendingTaxRefunds.length} Bekleyen)</span>
          </button>
          <button
            type="button"
            onClick={() => setAdminSection('webhooks_sql')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              adminSection === 'webhooks_sql'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            7. Webhook & 6 SQL Tablo
          </button>
          <button
            type="button"
            onClick={() => setAdminSection('feedback_tickets')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              adminSection === 'feedback_tickets'
                ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-400/50'
                : 'bg-rose-100 text-rose-950 hover:bg-rose-200 border border-rose-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
            <span>
              8. 💬 Şikayetler &amp; Öneriler (
              {(feedbackTickets || []).filter((t) => t.status === 'PENDING').length > 0 ? (
                <strong className="text-rose-600 underline">
                  {(feedbackTickets || []).filter((t) => t.status === 'PENDING').length} Yeni
                </strong>
              ) : (
                (feedbackTickets || []).length
              )}
              )
            </span>
          </button>
          {onOpenWebhookTab && (
            <button
              type="button"
              onClick={onOpenWebhookTab}
              className="px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 bg-emerald-950 text-amber-300 hover:bg-slate-800 border border-amber-400/40"
            >
              <Play className="w-3.5 h-3.5" />
              <span>⚡ Webhook &amp; 7 Mertebe Komisyon Motoru</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setAdminSection('rest_api');
              if (!apiResponseJson) {
                handleTestEndpoint('Admin Stats', '/api/v1/admin/stats', 'GET', 'ADMIN');
              }
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              adminSection === 'rest_api'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            9. REST API &amp; JWT Test
          </button>
          <button
            type="button"
            onClick={() => setAdminSection('data_management')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              adminSection === 'data_management'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-100 text-blue-950 hover:bg-blue-200 border border-blue-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>💾 10. Veri / Data Portalı (Yedek İndir &amp; Yükle)</span>
          </button>
        </nav>
      </div>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-auto">
      {/* SECTION: 🚀 BÜYÜMEYİ 2-3 KATINA ÇIKARAN 5 STRATEJİK İYİLEŞTİRME ÖNERİSİ & V2.2 SİSTEM AYARLARI */}
      {adminSection === 'strategic_growth' && (
        <section className="space-y-6">
          <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 space-y-6 border border-indigo-500/30 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold mb-2">
                  <span>🚀 YÖNETİCİ KONTROL MERKEZİ · BÜYÜMEYİ 2-3 KATINA ÇIKARAN 5 STRATEJİK İYİLEŞTİRME ÖNERİSİ (CANLI MODÜLLER)</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  1️⃣ 48s FOMO Sayacı · 2️⃣ Hibrit Dinamik Sıkıştırma · 3️⃣ P2P &amp; Kupon · 4️⃣ İlk 30 Gün Duble Bonus · 5️⃣ WhatsApp Business Story
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Bayi panelinde yer almaması gereken tüm stratejik büyüme motoru ayarları, V2.2 altın revizyon şalterleri, P2P kupon üretimi ve İade/Cayma (Clawback) yönetimi yalnızca bu Yönetici Paneli sekmesinden kontrol edilir.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white/10 border border-white/15 rounded-xl px-3.5 py-2">
                  <label className="block text-[10px] font-mono uppercase text-amber-300 mb-1">
                    İşlem Yapılacak Hedef Bayi Seçin
                  </label>
                  <select
                    value={strategicTargetUserId}
                    onChange={(e) => setStrategicTargetUserId(e.target.value)}
                    className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-white/20"
                  >
                    {sortedMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        #{m.global_line_id} {m.full_name} (Kariyer Seviyesi {m.career_level})
                      </option>
                    ))}
                  </select>
                </div>

                {onOpenWebhookTab && (
                  <button
                    type="button"
                    onClick={onOpenWebhookTab}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 shadow-sm"
                  >
                    <Play className="w-4 h-4" />
                    <span>⚡ Webhook &amp; 7 Mertebe Motorunu Aç</span>
                  </button>
                )}
              </div>
            </div>

            {strategicActionMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center justify-between">
                <span>✅ {strategicActionMsg}</span>
                <button
                  type="button"
                  onClick={() => setStrategicActionMsg(null)}
                  className="text-[11px] underline cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            )}

            {/* V2.2 Global Sistem Şalterleri */}
            {v2Config && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white">%6 Sonsuzluk Diferansiyel</div>
                    <div className="text-[11px] text-slate-400">
                      8. derinlik ve sonrası sınırsız liderlik primi
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={strategicBusy}
                    onClick={() =>
                      handleAdminToggleV2Config({
                        unilevel_infinity_enabled: !v2Config.unilevel_infinity_enabled,
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      v2Config.unilevel_infinity_enabled
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {v2Config.unilevel_infinity_enabled ? 'AKTİF' : 'PASİF'}
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white">%10+%5 Hızlı Başlangıç (Fast-Start)</div>
                    <div className="text-[11px] text-slate-400">
                      2. ve 3. kademe sponsor hızlı amortisman primi
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={strategicBusy}
                    onClick={() =>
                      handleAdminToggleV2Config({
                        fast_roi_3x15_enabled: !v2Config.fast_roi_3x15_enabled,
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      v2Config.fast_roi_3x15_enabled
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {v2Config.fast_roi_3x15_enabled ? 'AKTİF' : 'PASİF'}
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white">İlk 30 Gün Duble Bonus (%25)</div>
                    <div className="text-[11px] text-slate-400">
                      Yeni bayilere ilk 30 gün %25 sponsor + 2.000 $ ödül
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={strategicBusy}
                    onClick={() =>
                      handleAdminToggleV2Config({
                        welcome_30d_double_bonus_enabled: !v2Config.welcome_30d_double_bonus_enabled,
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      v2Config.welcome_30d_double_bonus_enabled
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {v2Config.welcome_30d_double_bonus_enabled ? 'AKTİF' : 'PASİF'}
                  </button>
                </div>
              </div>
            )}

            {/* 5 Stratejik Modül Kartları */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* 1️⃣ 48s FOMO Geri Sayım Sayacı & Pasif Üye Dönüştürücü */}
              <div className="lg:col-span-6 bg-red-950/60 border border-red-500/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-red-500/30 text-red-200 text-[10px] font-mono font-bold">
                      1️⃣ STRATEJİK ÖNERİ · PASİF ÜYE DÖNÜŞTÜRÜCÜ (%65 DÖNÜŞÜM)
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">
                      48 Saatlik FOMO Geri Sayım Sayacı &amp; Kaçan Komisyon Bildirimi
                    </h4>
                    <p className="text-xs text-red-200/80 mt-0.5">
                      Seçili bayinin paneline canlı kırmızı geri sayım sayacı gönderir; 48 saat içinde aktifliğini yenilemezse komisyon Sistem Havuzuna devredilir.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={strategicBusy}
                    onClick={handleAdminCreateFomoAlert}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    + 48s FOMO Sayacı Gönder
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {fomoAlerts.map((alert) => {
                    const m = members.find(
                      (x) =>
                        x.user_id === alert.external_user_id ||
                        String(x.id) === String(alert.user_id)
                    );
                    const amountVal = Number(
                      alert.at_risk_commission_amount ??
                        (alert as any).missed_commission_amount ??
                        0
                    );
                    const expIso =
                      alert.expires_at ||
                      (alert as any).countdown_expires_at ||
                      new Date().toISOString();
                    const isActiveCountdown =
                      alert.status === 'COUNTDOWN_ACTIVE_48H' ||
                      (alert as any).status === 'ACTIVE_COUNTDOWN';
                    return (
                      <div
                        key={alert.id}
                        className="p-3 rounded-xl bg-slate-950/80 border border-red-500/30 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-red-200">
                            {alert.user_full_name || m?.full_name || alert.external_user_id || alert.user_id} —{' '}
                            {amountVal.toLocaleString('tr-TR')} $
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Durum: <span className="font-mono text-amber-300">{alert.status}</span> · Son:{' '}
                            {new Date(expIso).toLocaleString('tr-TR')}
                          </div>
                        </div>
                        {isActiveCountdown && (
                          <button
                            type="button"
                            disabled={strategicBusy}
                            onClick={() =>
                              handleAdminConvertFomoAlert(alert.id, alert.external_user_id)
                            }
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] cursor-pointer shrink-0"
                          >
                            Aktifleştir &amp; Kurtar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2️⃣ Derinlik Ödemelerinde Dinamik Sıkıştırma (Dynamic Compression) */}
              <div className="lg:col-span-6 bg-indigo-950/60 border border-indigo-400/30 rounded-2xl p-5 space-y-4">
                <div>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 text-[10px] font-mono font-bold">
                    2️⃣ STRATEJİK ÖNERİ · DYNAMIC COMPRESSION MOTORU
                  </span>
                  <h4 className="text-base font-bold text-white mt-1">
                    Derinlik Ödemelerinde &quot;Hibrit Dinamik Sıkıştırma&quot; Seçimi
                  </h4>
                  <p className="text-xs text-indigo-200/80 mt-0.5">
                    7 derinlik dağıtılırken aradaki pasif veya yetkisiz üyelerin primlerinin Sistem Havuzu ile çalışan aktif üst lider arasında nasıl paylaştırılacağını belirleyin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {(
                    [
                      {
                        mode: 'FUND_SWEEP',
                        title: '%100 Sistem Havuzu',
                        desc: 'Pasif/yetkisiz üyelerin primi tamamen şirket kariyer havuzuna devredilir.',
                      },
                      {
                        mode: 'HYBRID_50_50',
                        title: '%50 Fon + %50 Aktif Lider (Hibrit)',
                        desc: 'Yarısı şirket fonuna, diğer yarısı üstteki ilk aktif lidere sıkıştırılarak ödenir.',
                      },
                      {
                        mode: 'FULL_COMPRESSION',
                        title: '%100 Tam Dinamik Sıkıştırma',
                        desc: 'Pasif üyeler tamamen atlanır, primin %100’ü çalışan üst aktif lidere kaydırılır.',
                      },
                    ] as const
                  ).map((opt) => {
                    const active =
                      (v2Config?.dynamic_compression_mode || 'HYBRID_50_50') === opt.mode;
                    return (
                      <button
                        key={opt.mode}
                        type="button"
                        disabled={strategicBusy}
                        onClick={() =>
                          handleAdminToggleV2Config({
                            dynamic_compression_enabled: opt.mode !== 'FUND_SWEEP',
                            dynamic_compression_mode: opt.mode,
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-400/20 border-amber-400 text-white'
                            : 'bg-slate-900/70 border-white/10 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{opt.title}</span>
                          {active && <Check className="w-4 h-4 text-amber-300 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3️⃣ P2P İç Bakiye Transferi & Aktivasyon Kodu (Wallet-to-Wallet / Voucher) */}
              <div className="lg:col-span-7 bg-white/5 border border-white/15 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 text-[10px] font-mono font-bold">
                      3️⃣ STRATEJİK ÖNERİ · P2P WALLET-TO-WALLET &amp; AKTİVASYON KUPONU
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">
                      P2P İç Bakiye Transferi &amp; Aktivasyon Kupon Kodu Yönetimi
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <form
                    onSubmit={handleAdminP2pTransfer}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2.5"
                  >
                    <div className="font-bold text-emerald-300">
                      💸 Bayiler Arası P2P Bakiye / Paket Transferi
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Alıcı Alt Bayi</label>
                      <select
                        value={adminP2pRecipientId}
                        onChange={(e) => setAdminP2pRecipientId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white text-xs"
                      >
                        {sortedMembers
                          .filter((m) => m.user_id !== strategicTargetUserId)
                          .map((m) => (
                            <option key={m.user_id} value={m.user_id}>
                              #{m.global_line_id} {m.full_name} (Kariyer Seviyesi {m.career_level})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Tutar ($)</label>
                        <input
                          type="number"
                          min={100}
                          value={adminP2pAmount}
                          onChange={(e) => setAdminP2pAmount(Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Mod</label>
                        <select
                          value={adminP2pMode}
                          onChange={(e) =>
                            setAdminP2pMode(
                              e.target.value as 'BALANCE_TRANSFER' | 'DIRECT_PACKAGE_ACTIVATION'
                            )
                          }
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white text-xs"
                        >
                          <option value="BALANCE_TRANSFER">Nakit Bakiye</option>
                          <option value="DIRECT_PACKAGE_ACTIVATION">Direkt +30G Paket</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={strategicBusy}
                      className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      P2P Transferi Uygula
                    </button>
                  </form>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2.5">
                    <div className="font-bold text-amber-300">
                      🎟️ Aktivasyon Kupon Kodu Üret &amp; Kullan
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={adminVoucherPkgId}
                        onChange={(e) =>
                          setAdminVoucherPkgId(e.target.value as Exclude<PackageId, 'CUSTOM'>)
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white text-xs"
                      >
                        {FREKANS_PACKAGES.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} ({pkg.defaultPrice.toLocaleString('tr-TR')} $)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={strategicBusy}
                        onClick={handleAdminGenerateVoucher}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                      >
                        + Kupon Üret
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={adminRedeemCode}
                        onChange={(e) => setAdminRedeemCode(e.target.value)}
                        placeholder="Kupon kodu girin (AKTIF-...)"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white font-mono text-xs"
                      />
                      <button
                        type="button"
                        disabled={strategicBusy}
                        onClick={() => handleAdminRedeemVoucher()}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs cursor-pointer shrink-0"
                      >
                        Kuponu Kullan
                      </button>
                    </div>

                    <div className="space-y-1 max-h-28 overflow-y-auto pt-1">
                      {activationVouchers.slice(0, 5).map((v) => {
                        const vCode = v.voucher_code || (v as any).code;
                        const vAmt = Number(v.amount ?? 0);
                        const isUnused =
                          v.status === 'ACTIVE_UNUSED' || (v as any).status === 'ACTIVE';
                        return (
                          <div
                            key={vCode || v.id}
                            className="flex items-center justify-between text-[11px] bg-slate-950/70 px-2.5 py-1 rounded border border-white/10"
                          >
                            <span className="font-mono font-bold text-amber-300">{vCode}</span>
                            <span className="text-slate-300">
                              {vAmt.toLocaleString('tr-TR')} $ · {v.status}
                            </span>
                            {isUnused && (
                              <button
                                type="button"
                                onClick={() => handleAdminRedeemVoucher(vCode)}
                                className="text-emerald-400 underline cursor-pointer"
                              >
                                Kullan
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4️⃣ İlk 30 Gün Duble Bonus & 5️⃣ WhatsApp Business API + İade/Clawback */}
              <div className="lg:col-span-5 bg-white/5 border border-white/15 rounded-2xl p-5 space-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 text-[10px] font-mono font-bold">
                      4️⃣ &amp; 5️⃣ STRATEJİK ÖNERİ + CLAWBACK KONTROLÜ
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">
                      İlk 30 Gün Duble Bonus, WhatsApp Business API &amp; İade/Cayma (Clawback)
                    </h4>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-400/30 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-amber-300">
                        4️⃣ İlk 30 Gün Duble Bonus (+2.000 $ Hoşgeldin)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Seçili bayiye İlk 30 Gün 2 Aktif Üye +2.000 $ nakit ödülünü anında tanımla
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={strategicBusy}
                      onClick={handleAdminTriggerWelcomeDoubleBonus}
                      className="px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                    >
                      +2.000 $ Tanımla
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-400/30 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-emerald-300">
                        5️⃣ WhatsApp Business API &amp; Story Bildirimi
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Seçili bayiye otomatik WhatsApp Business tebrik mesajı gönder ({notificationOutbox.length} kayıt)
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={strategicBusy}
                      onClick={handleAdminTriggerWhatsAppPush}
                      className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                    >
                      WhatsApp Gönder
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 space-y-2 text-xs">
                    <div className="font-bold text-red-200">
                      🛡️ B) İade / Cayma Durumunda Komisyon İptali (handleOrderRefund Clawback)
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={500}
                        step={500}
                        value={adminRefundAmount}
                        onChange={(e) => setAdminRefundAmount(Number(e.target.value) || 5000)}
                        className="w-32 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-red-400/40 text-white font-mono text-xs"
                      />
                      <button
                        type="button"
                        disabled={strategicBusy}
                        onClick={handleAdminSimulateRefundClawback}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                      >
                        Sipariş İadesi &amp; Komisyon İptali (Clawback) Uygula
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: AKTİFLİK SÜRESİ, CRON JOB & BAYİ ZAMANLAYICI YÖNETİMİ */}
      {adminSection === 'activity' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <section className="lg:col-span-6 bg-white border-2 border-indigo-500/40 rounded-2xl p-6 space-y-5 shadow-2xs">
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-indigo-700 font-bold">SABİT AKTİFLİK KURALI</div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">30 Günlük Süre Birikimi</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Her başarılı paket alımı mevcut bitiş tarihine 30 gün ekler. Süre dolmuşsa yeni süre işlem zamanından başlar; aylık satın alma veya referans koşulu yoktur.
                  </p>
                </div>
                <Timer className="w-7 h-7 text-indigo-600 shrink-0" />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                Çekim yetkisi, hesabın aktif olmasına ve <code>activity_expires_at</code> tarihinin geçmemiş olmasına bağlıdır.
              </div>
            </section>

            {/* Sağ 6 Sütun: Süresi Dolan Hesapları Otomatik Tespit Eden Cron Job & Özet */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 border border-slate-800">
                <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-xs font-mono text-amber-400 font-bold">
                      POST /api/v1/cron/activity-check · OTOMATİK CRON JOB SERVİSİ
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Süresi Dolan Hesapları Otomatik Tespit Eden Cron Job
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Arka planda her 30 saniyede bir otomatik çalışır;{' '}
                      <code className="font-mono text-amber-300">activity_expires_at &le; NOW()</code>{' '}
                      olan hesapları tespit ederek <code className="font-mono">is_active = false</code>{' '}
                      durumuna çeker ve <code className="font-mono">activity_logs</code> tablosuna
                      kaydeder.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-lg font-bold text-emerald-400">
                      {sortedMembers.filter((m) => m.is_active).length}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">Aktif Bayi</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-lg font-bold text-red-400">
                      {sortedMembers.filter((m) => !m.is_active).length}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">Süresi Dolan / Pasif</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-lg font-bold text-indigo-400">
                      {
                        sortedMembers.filter(
                          (m) =>
                            m.is_active &&
                            !m.is_locked &&
                            Boolean(m.activity_expires_at) &&
                            new Date(m.activity_expires_at).getTime() > Date.now()
                        ).length
                      }
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">Çekime Uygun</div>
                  </div>
                </div>

                {onTriggerActivityCheckCron && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onTriggerActivityCheckCron}
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>
                      Süresi Dolan Hesapları Şimdi Tara (POST /api/v1/cron/activity-check)
                    </span>
                  </button>
                )}
              </div>

              {/* Son Aktiflik Logları (SQL: activity_logs) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
                <div className="text-xs font-mono text-slate-500 font-bold">
                  SQL: activity_logs · SON AKTİFLİK &amp; CRON HAREKETLERİ ({activityLogs.length})
                </div>
                <div className="max-h-52 overflow-y-auto space-y-2 text-xs">
                  {activityLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{log.user_full_name}</span>{' '}
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                          {log.action_type}
                        </span>
                        <div className="text-[11px] text-slate-600 mt-0.5">{log.description}</div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(log.created_at).toLocaleTimeString('tr-TR')}
                      </span>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <div className="text-xs text-slate-500 py-4 text-center">
                      Henüz aktiflik log kaydı bulunmuyor.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bayi Bazlı Aktiflik Süresi Geri Sayım & Dönemlik Bayi Ekleme Sayacı Yönetim Tablosu */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  SQL: users (activity_expires_at, is_active, is_locked)
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Tüm Bayilerin Aktiflik Süresi ve Çekim Yetkisi Yönetimi
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-2">Sıra &amp; Bayi</th>
                    <th className="py-2.5 px-2">is_active</th>
                    <th className="py-2.5 px-2">activity_expires_at (Bitiş Tarihi)</th>
                    <th className="py-2.5 px-2">Çekim Middleware Durumu</th>
                    <th className="py-2.5 pl-2 text-right">Yönetici Hızlı Müdahale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  {sortedMembers.map((m) => {
                    const expDate = m.activity_expires_at
                      ? new Date(m.activity_expires_at)
                      : new Date(Date.now() + 30 * 86400000);
                    const daysLeft = Math.max(
                      0,
                      Math.ceil((expDate.getTime() - Date.now()) / 86400000)
                    );
                    const canWithdraw =
                      m.is_active &&
                      !m.is_locked &&
                      Boolean(m.activity_expires_at) &&
                      new Date(m.activity_expires_at).getTime() > Date.now();

                    return (
                      <tr key={m.user_id} className="hover:bg-slate-50">
                        <td className="py-3 pr-2 font-sans">
                          <div className="font-bold text-slate-900">
                            #{m.global_line_id} {m.full_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {m.user_id} · Cüzdan: ${getMemberRegionalUsdBalance(m).toFixed(2)}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              m.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {m.is_active ? 'TRUE (Aktif)' : 'FALSE (Pasif)'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-900">
                            {expDate.toLocaleDateString('tr-TR')}{' '}
                            {expDate.toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Kalan: {daysLeft} Gün
                          </div>
                        </td>
                        <td className="py-3 px-2 font-sans">
                          {canWithdraw ? (
                            <span className="text-emerald-700 font-bold text-[11px]">
                              ✓ Çekim Açık
                            </span>
                          ) : (
                            <span className="text-red-700 font-bold text-[11px]">
                              ✗ Çekim Kilitli (
                              Süre Doldu/Pasif)
                            </span>
                          )}
                        </td>
                        <td className="py-3 pl-2 text-right font-sans">
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() =>
                                onMemberActivityAction?.(m.user_id, { action: 'EXPIRE_NOW' })
                              }
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                            >
                              Süreyi Doldur (Test)
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* SECTION 1: SİSTEM & PARAMETRE YÖNETİMİ (`POST /api/v1/admin/settings`) */}
      {adminSection === 'params' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-12">
            <FixedUsdRateBanner rate={usdRateInfo} loadError={usdRateLoadError} />
          </div>
          <form
            onSubmit={handleUpdateUsdRate}
            className="lg:col-span-12 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs"
          >
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  GET/POST /api/v1/admin/exchange-rate · SABİT USD/TRY KURU
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Sabit Kur (1 USD = X TRY)
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Mevcut Kur</div>
                <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                  {usdRateInfo ? `1 $ = ${usdRateInfo.usd_try_rate.toFixed(2)} TRY` : '—'}
                </div>
              </div>
            </div>

            {usdRateInfo && (
              <div className="text-xs text-slate-500">
                Son güncelleme:{' '}
                {usdRateInfo.updated_at
                  ? `${new Date(usdRateInfo.updated_at).toLocaleString('tr-TR')} (Admin: ${usdRateInfo.updated_by})`
                  : 'Henüz güncellenmedi (varsayılan kur)'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Yeni Kur (1 USD = ? TRY)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={usdRateInput}
                  onChange={(e) => setUsdRateInput(e.target.value)}
                  placeholder="Örn: 32.50"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <button
                type="submit"
                disabled={usdRateBusy || usdRateInput.trim() === ''}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {usdRateBusy ? 'Güncelleniyor...' : 'Kuru Güncelle'}
              </button>
            </div>

            {usdRateMsg && (
              <div
                role="status"
                className={`text-xs font-medium px-3 py-2 rounded-xl ${
                  usdRateMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {usdRateMsg.text}
              </div>
            )}
          </form>

          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xs">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-indigo-600 uppercase">
                  ÇİFT MOTORLU HİBRİT MİMARİ
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Komisyon &amp; Teşvik Dizin Tablosu
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdminSection('commission_engine_settings')}
                  className="text-xs px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-teal-600 text-white font-bold rounded-lg cursor-pointer transition-all shadow-xs hover:from-indigo-500 hover:to-teal-500 flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3 text-amber-300" />
                  <span>⚡ Motor Ayarları Sekmesi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBusinessRules(!isEditingBusinessRules)}
                  className="text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  {isEditingBusinessRules ? 'Vazgeç' : '⚙️ Hızlı Düzenle'}
                </button>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                  v2.2 Hybrid
                </span>
              </div>
            </div>

            {ruleSaveMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border ${
                  ruleSaveMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {ruleSaveMessage.text}
              </div>
            )}

            {isEditingBusinessRules ? (
              <form onSubmit={handleSaveBusinessRules} className="space-y-4">
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-indigo-900">
                    Motor 1: Sponsorlu Unilevel 7 Derinlik Oranları (%)
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {editUnilevelPercentages.map((pct, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="text-[10px] text-slate-600 font-medium">{idx + 1}. Derinlik</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={pct}
                          onChange={(e) => {
                            const copy = [...editUnilevelPercentages];
                            copy[idx] = parseFloat(e.target.value) || 0;
                            setEditUnilevelPercentages(copy);
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-indigo-700 font-mono text-right font-bold">
                    Toplam Unilevel: %{editUnilevelPercentages.reduce((a, b) => a + Number(b), 0).toFixed(1)}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-emerald-900">
                    Motor 2: Küresel Monoline Teşvik 7 Sıra Oranları (%)
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {editMonolinePercentages.map((pct, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="text-[10px] text-slate-600 font-medium">{idx + 1}. Üst Sıra</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="100"
                          value={pct}
                          onChange={(e) => {
                            const copy = [...editMonolinePercentages];
                            copy[idx] = parseFloat(e.target.value) || 0;
                            setEditMonolinePercentages(copy);
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-mono text-right font-bold">
                    Toplam Monoline: %{editMonolinePercentages.reduce((a, b) => a + Number(b), 0).toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600">Direkt Sponsor (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editDirectSponsor}
                      onChange={(e) => setEditDirectSponsor(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600">Sistem Fonu (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editSystemFund}
                      onChange={(e) => setEditSystemFund(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600">Cayma Blokesi (Gün)</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={editClawbackDays}
                      onChange={(e) => setEditClawbackDays(parseInt(e.target.value, 10) || 14)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-600">Tek Kol Sınırı (%)</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={editMaxSingleLeg}
                      onChange={(e) => setEditMaxSingleLeg(parseFloat(e.target.value) || 50)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingBusinessRules(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRules}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSavingRules ? 'Kaydediliyor...' : '💾 Ayarları Kaydet & Dağıtım Motoruna Uygula'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-left">
                    <div className="text-[11px] font-bold text-indigo-700">MOTOR 1: SPONSORLU UNILEVEL</div>
                    <div className="text-xl font-black text-indigo-900 mt-0.5">
                      %{editUnilevelPercentages.reduce((a, b) => a + Number(b), 0).toFixed(1)} Toplam
                    </div>
                    <div className="text-[11px] text-indigo-700/80 mt-1">7 Derinlik Dikey Ekip Cirosu</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-left">
                    <div className="text-[11px] font-bold text-emerald-700">MOTOR 2: MONOLINE TEŞVİK</div>
                    <div className="text-xl font-black text-emerald-900 mt-0.5">
                      %{editMonolinePercentages.reduce((a, b) => a + Number(b), 0).toFixed(2)} Toplam
                    </div>
                    <div className="text-[11px] text-emerald-700/80 mt-1">7 Üst Sıra Sembolik Prim</div>
                  </div>
                </div>

                {/* Motor 1 & Motor 2 Oran Tablosu */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2 px-3">Derinlik / Kademe</th>
                        <th className="py-2 px-3 text-right">Motor 1 (Unilevel)</th>
                        <th className="py-2 px-3 text-right">Motor 2 (Monoline)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {editUnilevelPercentages.map((uniPct, idx) => {
                        const depth = idx + 1;
                        const monoPct = editMonolinePercentages[idx] ?? 0;
                        return (
                          <tr key={depth} className="hover:bg-slate-50/80">
                            <td className="py-1.5 px-3 font-sans font-medium text-slate-800">
                              {depth}. {depth === 1 ? 'Derinlik (Direkt Sponsor)' : 'Derinlik'}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-indigo-600">
                              %{Number(uniPct).toFixed(1)}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-emerald-600">
                              %{Number(monoPct).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-50 font-bold border-t border-slate-200">
                        <td className="py-2 px-3 font-sans text-slate-900">Toplam Dağıtım</td>
                        <td className="py-2 px-3 text-right text-indigo-700">
                          %{editUnilevelPercentages.reduce((a, b) => a + Number(b), 0).toFixed(1)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700">
                          %{editMonolinePercentages.reduce((a, b) => a + Number(b), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] text-slate-500">Direkt Satış</div>
                    <div className="font-bold text-slate-900">%{editDirectSponsor}</div>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] text-slate-500">Sistem Fonu</div>
                    <div className="font-bold text-slate-900">%{editSystemFund}</div>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] text-slate-500">Cayma Koruması</div>
                    <div className="font-bold text-slate-900">{editClawbackDays} Gün</div>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] text-slate-500">Tek Kol Sınırı</div>
                    <div className="font-bold text-slate-900">%{editMaxSingleLeg}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <div>
                    <strong className="text-slate-800">Motor 1 (Unilevel):</strong> Sponsorluk bağıyla 7 basamak taranır (8. ebeveyne prim aktarılmaz). Kariyer kilitleri bağlayıcıdır.
                  </div>
                  <div>
                    <strong className="text-slate-800">Motor 2 (Monoline):</strong> Küresel sıra numarasına dayanır. Üst hatta üye yoksa kalan tutar <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">POOL_TRANSFER_NO_UPLINE</code> ile havuza devredilir.
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Right 7 cols: Dinamik Kariyer Piramidi & Organizasyon Özeti */}
          <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 rounded-2xl p-6 space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="text-[11px] font-mono text-amber-400 font-bold uppercase">
                  📊 KARİYER PİRAMİDİ &amp; 1.000 KİŞİLİK AKTİF AĞ İDEAL DAĞILIM MODELİ
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Monoline (Tek Hat) Freeriding Önleme &amp; Dengeli Kol (%50) Mimarisi
                </h3>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  const resetCopy = structuredClone(INITIAL_CAREER_TIERS);
                  setEditableTiers(resetCopy);
                  await onUpdateCareers(resetCopy);
                }}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Varsayılan İdeal Piramit Matrisini Yükle
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Monoline (Tek Hat) MLM sistemlerinde pasif üyelerin çaba göstermeden üst sıralardan komisyon kazanmasını (<strong>freeriding</strong>) engellemek ve ciroyu katlamak için her mertebede <strong>Grup Ciro Şartı (PGV)</strong>, <strong>%50 Güçlü Kol Dengesi</strong> ve <strong>Farklı Kollarda Kariyerli Alt Ekip</strong> şartları denetlenir.
            </p>

            {/* Görsel Piramit Özeti (Üstten Alta: 7. Kâmile -> 1. Emmâre) */}
            <div className="space-y-1.5">
              {[...editableTiers]
                .sort((a, b) => b.level - a.level)
                .map((tier, pIdx) => {
                  const liveCount = members.filter(
                    (m) => m.career_level === tier.level && m.is_active
                  ).length;
                  const activeTotal = Math.max(1, members.filter((m) => m.is_active).length);
                  const livePct = Math.round((liveCount / activeTotal) * 1000) / 10;

                  return (
                    <div
                      key={tier.level}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/75 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold text-[11px]">
                          %{tier.idealNetworkPyramidPercent}
                        </span>
                        <span className="font-bold text-white">
                          Kariyer Seviyesi {tier.level}
                        </span>
                        <span className="text-slate-400 text-[11px]">({tier.subtitle})</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-amber-300">
                          İdeal: {tier.idealCountPer1000} Bayi ({tier.idealNetworkRatioLabel})
                        </span>
                        <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          Canlı: {liveCount} Bayi (%{livePct})
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Full 12 cols: 7 Nefis Mertebesi Detaylı Organizasyon, PGV, %50 Kol & Alt Ekip Şartları Matrisi Yönetimi */}
          <form
            onSubmit={handleSaveCareerTiers}
            className="lg:col-span-12 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs"
          >
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-amber-700 font-bold">
                  🎯 KARİYER BAZLI ORGANİZASYON &amp; BAYİLİK ŞARTLARI MATRİSİ YÖNETİM PANELİ
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  7 Nefis Mertebesi Kişisel Paket, Direkt Referans, Grup Ciro (PGV), %50 Dengeli Kol &amp; Alt Ekip Kariyer Şartları
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aşağıdaki tüm kriterleri mertebe bazında düzenleyip kaydedebilirsiniz. Kaydettiğiniz anda tüm bayilerin organizasyon ağaçları ve kariyerleri otomatik yeniden hesaplanır.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  Tüm Kariyer &amp; Organizasyon Matrisini Kaydet
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {editableTiers.map((tier, idx) => (
                <div
                  key={tier.level}
                  className="border border-slate-200 rounded-2xl p-5 bg-slate-50/60 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center">
                        {tier.level}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">
                            Kariyer Seviyesi {tier.level}
                          </h4>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold">
                            {tier.subtitle}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                            Ağ Oranı: {tier.idealNetworkRatioLabel} (1000 Ağda {tier.idealCountPer1000} Bayi)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{tier.meaning}</p>
                      </div>
                    </div>

                    {tier.level > 1 && (
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tier.enforceStrictOrganizationRules !== false}
                          onChange={(e) => {
                            const next = [...editableTiers];
                            next[idx] = {
                              ...next[idx],
                              enforceStrictOrganizationRules: e.target.checked,
                            };
                            setEditableTiers(next);
                          }}
                          className="rounded border-slate-300 text-slate-900"
                        />
                        <span>Sıkı Organizasyon Şartlarını (PGV + %50 Kol + Alt Kariyer) Zorunlu Tut</span>
                      </label>
                    )}
                  </div>

                  {/* 6 Sütunlu Ana Parametreler */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Kişisel Paket Şartı
                      </label>
                      <select
                        value={tier.minPackageId}
                        onChange={(e) => {
                          const next = [...editableTiers];
                          const pkgId = e.target.value as Exclude<PackageId, 'CUSTOM'>;
                          next[idx] = {
                            ...next[idx],
                            minPackageId: pkgId,
                          };
                          setEditableTiers(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      >
                        {FREKANS_PACKAGES.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.code} ({pkg.defaultPrice.toLocaleString('tr-TR')} $)
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={tier.minPackageLabel}
                        onChange={(e) => {
                          const next = [...editableTiers];
                          next[idx] = {
                            ...next[idx],
                            minPackageLabel: e.target.value,
                          };
                          setEditableTiers(next);
                        }}
                        placeholder="Örn: Paket B + Aktiflik Süresi"
                        className="w-full mt-1.5 px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Min. Kişisel Ciro ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={tier.minPersonalVolume}
                        onChange={(e) => {
                          const next = [...editableTiers];
                          next[idx] = {
                            ...next[idx],
                            minPersonalVolume: Number(e.target.value),
                          };
                          setEditableTiers(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                      />
                      <span className="block text-[10px] text-emerald-600 font-medium mt-1">
                        Sadece 30 günlük aktiflik yeterlidir
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Direkt Referans Şartı
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={tier.minActiveDirects}
                        onChange={(e) => {
                          const next = [...editableTiers];
                          next[idx] = {
                            ...next[idx],
                            minActiveDirects: Number(e.target.value),
                          };
                          setEditableTiers(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                      />
                      <span className="block text-[10px] text-slate-500 mt-1">
                        En az {tier.minActiveDirects} Aktif Üye
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                        Grup Ciro Şartı (PGV $)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={tier.minGroupVolume}
                        onChange={(e) => {
                          const next = [...editableTiers];
                          next[idx] = {
                            ...next[idx],
                            minGroupVolume: Number(e.target.value),
                          };
                          setEditableTiers(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-900 bg-emerald-50/70 border border-emerald-300 rounded-lg"
                      />
                      <span className="block text-[10px] text-emerald-700 mt-1">
                        {tier.minGroupVolume > 0
                          ? `$${tier.minGroupVolume.toLocaleString('tr-TR')} Ekip Cirosu`
                          : 'Grup Ciro Şartı Yok'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 mb-1">
                        %50 Dengeli Hat (Leg) Kuralı
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={tier.enforceMaxSingleLegPercent}
                          onChange={(e) => {
                            const next = [...editableTiers];
                            next[idx] = {
                              ...next[idx],
                              enforceMaxSingleLegPercent: e.target.checked,
                            };
                            setEditableTiers(next);
                          }}
                          className="rounded border-slate-300"
                        />
                        <input
                          type="number"
                          min={20}
                          max={100}
                          disabled={!tier.enforceMaxSingleLegPercent}
                          value={tier.maxSingleLegPercent}
                          onChange={(e) => {
                            const next = [...editableTiers];
                            next[idx] = {
                              ...next[idx],
                              maxSingleLegPercent: Number(e.target.value),
                            };
                            setEditableTiers(next);
                          }}
                          className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg disabled:opacity-50"
                        />
                        <span className="text-xs font-bold text-slate-600">%</span>
                      </div>
                      <span className="block text-[10px] text-slate-500 mt-1">
                        {tier.enforceMaxSingleLegPercent
                          ? `Tek koldan maks. %${tier.maxSingleLegPercent} PGV`
                          : 'Tek kol sınırı kapalı'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-indigo-800 mb-1">
                        Derinlik &amp; Havuz Payı (%)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-1.5 bg-slate-200 text-slate-800 rounded-lg text-xs font-bold shrink-0">
                          {tier.unlockedDepth}. Derinlik (%{tier.depthCommissionPercent})
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          step={1}
                          value={Math.round(tier.poolBonusRate * 100)}
                          onChange={(e) => {
                            const next = [...editableTiers];
                            next[idx] = {
                              ...next[idx],
                              poolBonusRate: Number(e.target.value) / 100,
                            };
                            setEditableTiers(next);
                          }}
                          className="w-16 px-2 py-1.5 text-xs font-mono text-right bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <span className="block text-[10px] text-slate-500 mt-1">
                        Havuz Payı: %{Math.round(tier.poolBonusRate * 100)}
                      </span>
                    </div>
                  </div>

                  {/* Alt Satır: Kariyerli Alt Ekip Şartları (Farklı Kollarda) & Organizasyon Özeti */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-slate-200/80">
                    <div className="lg:col-span-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">
                          Farklı Kollarda Zorunlu Alt Ekip Kariyer Şartları (Distinct Legs)
                        </label>
                        {tier.level >= 3 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...editableTiers];
                              const defaultTargetLvl = Math.max(2, tier.level - 2);
                              const defaultTargetTitle =
                                INITIAL_CAREER_TIERS.find((t) => t.level === defaultTargetLvl)
                                  ?.title || 'Levvâme';
                              next[idx] = {
                                ...next[idx],
                                requiredDownlineCareers: [
                                  ...next[idx].requiredDownlineCareers,
                                  {
                                    minCareerLevel: defaultTargetLvl,
                                    minCareerTitle: defaultTargetTitle,
                                    requiredCount: 1,
                                  },
                                ],
                              };
                              setEditableTiers(next);
                            }}
                            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Alt Kariyer Şartı Ekle
                          </button>
                        )}
                      </div>

                      {tier.requiredDownlineCareers.length === 0 ? (
                        <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2">
                          Bu mertebe için zorunlu alt kariyer şartı bulunmuyor ({tier.organizationRuleSummary}).
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {tier.requiredDownlineCareers.map((req, rIdx) => (
                            <div
                              key={rIdx}
                              className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                            >
                              <span className="text-slate-600 font-medium">Farklı kollarda en az</span>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={req.requiredCount}
                                onChange={(e) => {
                                  const next = [...editableTiers];
                                  const updatedReqs = [...next[idx].requiredDownlineCareers];
                                  updatedReqs[rIdx] = {
                                    ...updatedReqs[rIdx],
                                    requiredCount: Math.max(1, Number(e.target.value) || 1),
                                  };
                                  next[idx] = { ...next[idx], requiredDownlineCareers: updatedReqs };
                                  setEditableTiers(next);
                                }}
                                className="w-14 px-2 py-1 font-mono font-bold bg-slate-50 border border-slate-300 rounded"
                              />
                              <span className="text-slate-600">adet</span>
                              <select
                                value={req.minCareerLevel}
                                onChange={(e) => {
                                  const newLvl = Number(e.target.value);
                                  const matchedTitle =
                                    editableTiers.find((t) => t.level === newLvl)?.title ||
                                    'Levvâme';
                                  const next = [...editableTiers];
                                  const updatedReqs = [...next[idx].requiredDownlineCareers];
                                  updatedReqs[rIdx] = {
                                    ...updatedReqs[rIdx],
                                    minCareerLevel: newLvl,
                                    minCareerTitle: matchedTitle,
                                  };
                                  next[idx] = { ...next[idx], requiredDownlineCareers: updatedReqs };
                                  setEditableTiers(next);
                                }}
                                className="px-2 py-1 font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 rounded"
                              >
                                {editableTiers
                                  .filter((t) => t.level < tier.level)
                                  .map((t) => (
                                    <option key={t.level} value={t.level}>
                                      Kariyer Seviyesi {t.level}
                                    </option>
                                  ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...editableTiers];
                                  next[idx] = {
                                    ...next[idx],
                                    requiredDownlineCareers: next[
                                      idx
                                    ].requiredDownlineCareers.filter((_, i) => i !== rIdx),
                                  };
                                  setEditableTiers(next);
                                }}
                                className="ml-auto text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                title="Şartı Kaldır"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Organizasyon &amp; Alt Ekip Kural Açıklaması
                        </label>
                        <input
                          type="text"
                          value={tier.organizationRuleSummary}
                          onChange={(e) => {
                            const next = [...editableTiers];
                            next[idx] = {
                              ...next[idx],
                              organizationRuleSummary: e.target.value,
                            };
                            setEditableTiers(next);
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          1.000 Ağda İdeal Bayi Sayısı
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={1000}
                            value={tier.idealCountPer1000}
                            onChange={(e) => {
                              const count = Math.max(1, Number(e.target.value) || 1);
                              const next = [...editableTiers];
                              next[idx] = {
                                ...next[idx],
                                idealCountPer1000: count,
                                idealNetworkPyramidPercent: Math.round((count / 1000) * 1000) / 10,
                              };
                              setEditableTiers(next);
                            }}
                            className="w-20 px-2 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={tier.idealNetworkRatioLabel}
                            onChange={(e) => {
                              const next = [...editableTiers];
                              next[idx] = {
                                ...next[idx],
                                idealNetworkRatioLabel: e.target.value,
                              };
                              setEditableTiers(next);
                            }}
                            className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                            placeholder="%40 - %50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-md"
              >
                7 Nefis Kariyer &amp; Organizasyon Kurallarını Kaydet ve Tüm Bayileri Yeniden Değerlendir
              </button>
            </div>
          </form>

          {/* Full 12 cols: Canlı Bayi Organizasyon, Kol (Leg) Dengesi & Kariyer Uyumluluk Denetim Tablosu */}
          <div className="lg:col-span-12 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-mono text-indigo-700 font-bold">
                  CANLI ORGANİZASYON &amp; KOL (LEG) DENGESİ DENETİM TABLOSU
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Bayilerin Mevcut Grup Cirosu (PGV), En Güçlü Kol Oranı (%50 Kuralı) ve Alt Ekip Kariyer Dağılımı
                </h3>
              </div>
              <button
                type="button"
                onClick={onTriggerCareerCronJob}
                disabled={isSubmitting}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
              >
                Şimdi Tüm Ağda Kariyer Tarama Motorunu Çalıştır
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3">Sıra &amp; Bayi</th>
                    <th className="py-2.5 px-3">Mevcut Mertebe</th>
                    <th className="py-2.5 px-3">Kişisel Hacim &amp; Paket</th>
                    <th className="py-2.5 px-3">Aktif Direkt Kol (Leg)</th>
                    <th className="py-2.5 px-3">Ekip Grup Cirosu (PGV)</th>
                    <th className="py-2.5 px-3">En Güçlü Kol Payı</th>
                    <th className="py-2.5 px-3">Kollardaki En Yüksek Kariyerler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedMembers.map((m) => {
                    const org = evaluateMemberOrganizationMetrics(m, members, editableTiers);
                    return (
                      <tr key={m.user_id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">
                            #{m.global_line_id} {m.full_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">{m.user_id}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold">
                            Kariyer Seviyesi {m.career_level}
                          </span>
                          {m.manual_career_override && (
                            <span className="block text-[10px] text-indigo-600 font-semibold mt-0.5">
                              Manuel Atama
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <div className="font-bold text-slate-900">
                            {m.personal_volume.toLocaleString('tr-TR')} $
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {m.highest_package_id ? PACKAGES[m.highest_package_id]?.code : '-'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                          {org.activeDirectsCount} Aktif Kol
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                          {org.effectiveGroupVolume.toLocaleString('tr-TR')} $
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              org.strongestLegSharePercent <= 50 || org.legs.length === 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            %{org.strongestLegSharePercent}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {org.legs.length === 0 ? (
                            <span className="text-slate-400">Alt kol yok</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {org.legs.map((leg, lIdx) => (
                                <span
                                  key={leg.rootDirectMemberId}
                                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  Kol {lIdx + 1}: {leg.maxCareerLevelInLeg}. {leg.maxCareerTitleInLeg} (
                                  {leg.legTotalVolume.toLocaleString('tr-TR')} $)
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: COMMISSION ENGINE SETTINGS (ÇİFT MOTORLU HİBRİT KOMİSYON AYARLARI) */}
      {adminSection === 'commission_engine_settings' && (
        <CommissionEngineSettingsView
          distributionParams={distributionParams}
          onRefreshState={onRefreshState}
        />
      )}

      {/* SECTION 2: FİNANS, KOMİSYON ÇEKİM & %20 VERGİ İADESİ (FATURA ONAY) YÖNETİMİ */}
      {(adminSection === 'finance' || adminSection === 'tax_refunds') && (
        <div className="space-y-8">
          {/* YÖNETİCİ PANELİ: %20 VERGİ İADESİ & YÜKLENEN BAYİ FATURALARI ONAY PANELİ */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white border-2 border-emerald-500/40 rounded-2xl p-6 space-y-5 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/15 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold mb-1.5">
                  <span>🧾 YÖNETİCİ VERGİ İADESİ &amp; FATURA ONAY PANELİ (%20 STOPAJ / VERGİ İADESİ)</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Fatura Yükleyen Bayilerin %20 Vergi İadesi Talepleri ve Cüzdan Aktarım Merkezi
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Bayiler nakit çekim talebi oluşturduklarında <strong>%20 vergi kesilerek Sistem Fonuna</strong> aktarılır. Vergi iadesini (%20) almak isteyen bayilerin cihazdan yüklediği faturalar aşağıda listelenir; <strong>Onayla &amp; Hesaba Aktar</strong> butonuna tıkladığınızda kesilen %20 tutar Sistem Fonundan bayinin çekilebilir cüzdan bakiyesine anında aktarılır.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center font-mono shrink-0">
                <div className="px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15">
                  <div className="text-[10px] text-slate-300 uppercase">Toplam Fatura</div>
                  <div className="text-lg font-extrabold text-white">{taxRefundInvoices.length}</div>
                </div>
                <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40">
                  <div className="text-[10px] text-amber-200 uppercase">Onay Bekleyen</div>
                  <div className="text-lg font-extrabold text-amber-300">{pendingTaxRefunds.length}</div>
                </div>
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40">
                  <div className="text-[10px] text-emerald-200 uppercase">İade Edilen (%20)</div>
                  <div className="text-lg font-extrabold text-emerald-300">
                    {taxRefundInvoices
                      .filter((i) => i.status === 'APPROVED_CREDITED')
                      .reduce((s, i) => s + (i.tax_deducted_amount || 0), 0)
                      .toLocaleString('tr-TR')}{' '}
                    $
                  </div>
                </div>
              </div>
            </div>

            {taxRefundFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-emerald-100 text-xs font-bold flex items-center justify-between gap-3">
                <span>{taxRefundFeedback}</span>
                <button
                  type="button"
                  onClick={() => setTaxRefundFeedback(null)}
                  className="underline text-[11px] cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            )}

            {taxRefundInvoices.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                Henüz cihazdan yüklenmiş vergi iadesi faturası bulunmamaktadır.
              </div>
            ) : (
              <div className="overflow-x-auto bg-white text-slate-900 rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-3 pl-4 pr-2">İade Kodu &amp; Çekim</th>
                      <th className="py-3 px-2">Bayi Bilgisi</th>
                      <th className="py-3 px-2">Fatura No &amp; Vergi Dairesi/VKN</th>
                      <th className="py-3 px-2">Yüklenen Fatura Dosyası</th>
                      <th className="py-3 px-2 text-right">Brüt Çekim</th>
                      <th className="py-3 px-2 text-right text-emerald-700 font-bold">
                        İade Edilecek %20 Vergi
                      </th>
                      <th className="py-3 px-2">Durum</th>
                      <th className="py-3 pl-2 pr-4 text-right">Yönetici Onay / Aktarım</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {taxRefundInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className={
                          inv.status === 'PENDING_ADMIN_APPROVAL'
                            ? 'bg-amber-50/60 hover:bg-amber-50'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="py-3 pl-4 pr-2">
                          <div className="font-bold text-slate-900">{inv.refund_code}</div>
                          <div className="text-[10px] text-slate-500">
                            Çekim #{inv.withdrawal_id} ·{' '}
                            {new Date(inv.requested_at).toLocaleDateString('tr-TR')}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-sans">
                          <div className="font-bold text-slate-900">{inv.user_full_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {inv.external_user_id} · Kariyer Seviyesi {inv.career_level}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-sans">
                          <div className="font-mono font-bold text-slate-900">{inv.invoice_no}</div>
                          <div className="text-[11px] text-slate-600">{inv.tax_office_and_id}</div>
                        </td>
                        <td className="py-3 px-2 font-sans">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewInvoice(inv)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold text-[11px] cursor-pointer"
                            >
                              📄 Faturayı Görüntüle ({inv.invoice_file_name})
                            </button>
                            <a
                              href={inv.invoice_data_url}
                              download={inv.invoice_file_name || `fatura_${inv.invoice_no}.pdf`}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                            >
                              İndir
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-slate-700">
                          {(inv.gross_withdrawal_amount || 0).toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                          })}{' '}
                          $
                          <div className="text-[10px] text-slate-500">
                            Net (%80): {(inv.net_withdrawal_amount || 0).toLocaleString('tr-TR')} $
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs">
                            +
                            {(inv.tax_deducted_amount || 0).toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            $
                          </span>
                        </td>
                        <td className="py-3 px-2 font-sans">
                          {inv.status === 'PENDING_ADMIN_APPROVAL' && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px]">
                              ⏳ ONAY BEKLİYOR
                            </span>
                          )}
                          {inv.status === 'APPROVED_CREDITED' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                              ✓ ONAYLANDI &amp; HESABA AKTARILDI
                            </span>
                          )}
                          {inv.status === 'REJECTED' && (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-900 font-bold text-[11px]">
                              ✗ REDDEDİLDİ
                            </span>
                          )}
                        </td>
                        <td className="py-3 pl-2 pr-4 text-right font-sans">
                          {inv.status === 'PENDING_ADMIN_APPROVAL' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={taxRefundBusyId === inv.id}
                                onClick={() => handleDecideTaxRefund(inv.id, 'APPROVED')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>
                                  Onayla &amp; +{(inv.tax_deducted_amount || 0).toLocaleString('tr-TR')} $ Aktar
                                </span>
                              </button>
                              <button
                                type="button"
                                disabled={taxRefundBusyId === inv.id}
                                onClick={() => handleDecideTaxRefund(inv.id, 'REJECTED')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reddet</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              {inv.processed_at
                                ? new Date(inv.processed_at).toLocaleString('tr-TR')
                                : 'İşlendi'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FATURA ÖNİZLEME MODALI */}
          {previewInvoice && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <div className="text-xs font-mono text-emerald-700 font-bold">
                      BAYİ VERGİ İADESİ FATURA BELGESİ · {previewInvoice.refund_code}
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                      {previewInvoice.user_full_name} — Fatura No: {previewInvoice.invoice_no} (
                      {previewInvoice.invoice_file_name})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewInvoice(null)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <div className="text-slate-500">Brüt Çekim Tutarı</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {previewInvoice.gross_withdrawal_amount.toLocaleString('tr-TR')} $
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Kesilen %20 Vergi (Sistem Fonu)</div>
                    <div className="font-extrabold text-emerald-700 text-sm">
                      +{previewInvoice.tax_deducted_amount.toLocaleString('tr-TR')} $ (İade Talebi)
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Vergi Dairesi / VKN-TCKN</div>
                    <div className="font-bold text-slate-900 font-sans">
                      {previewInvoice.tax_office_and_id}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 max-h-[420px] flex items-center justify-center p-2">
                  {previewInvoice.invoice_data_url.startsWith('data:application/pdf') ? (
                    <iframe
                      src={previewInvoice.invoice_data_url}
                      title={previewInvoice.invoice_file_name}
                      className="w-full h-96 rounded"
                    />
                  ) : (
                    <img
                      src={previewInvoice.invoice_data_url}
                      alt={previewInvoice.invoice_file_name}
                      className="max-h-96 w-auto mx-auto rounded shadow-xs"
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <a
                    href={previewInvoice.invoice_data_url}
                    download={previewInvoice.invoice_file_name}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Fatura Dosyasını Cihaza İndir</span>
                  </a>

                  <div className="flex items-center gap-2">
                    {previewInvoice.status === 'PENDING_ADMIN_APPROVAL' && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleDecideTaxRefund(previewInvoice.id, 'APPROVED');
                            setPreviewInvoice(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                        >
                          ✅ Faturayı Onayla &amp; +
                          {previewInvoice.tax_deducted_amount.toLocaleString('tr-TR')} $ Hesaba Aktar
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleDecideTaxRefund(previewInvoice.id, 'REJECTED');
                            setPreviewInvoice(null);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          Reddet
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewInvoice(null)}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  GET /api/v1/admin/withdrawals · PUT /api/v1/admin/withdrawals/:id
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Komisyon Çekim Talepleri (%20 Vergi Kesintisi &amp; Net Ödeme) Onay / Red &amp; Toplu CSV Çıktısı
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isSubmitting || pendingWithdrawals.length === 0}
                  onClick={onBulkApproveWithdrawals}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Check className="w-4 h-4" />
                  <span>Tüm Bekleyenleri Toplu Onayla ({pendingWithdrawals.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWithdrawalsCsv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Toplu Ödeme / CSV Çıktı Al</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-3">Talep ID</th>
                    <th className="py-2.5 px-3">Üye &amp; Monoline Sırası</th>
                    <th className="py-2.5 px-3">Banka &amp; IBAN</th>
                    <th className="py-2.5 px-3 text-right">Brüt Tutar</th>
                    <th className="py-2.5 px-3 text-right">%20 Vergi (Sistem Fonu)</th>
                    <th className="py-2.5 px-3 text-right">Net Ödenecek (%80)</th>
                    <th className="py-2.5 px-3">%20 Vergi İadesi Faturası</th>
                    <th className="py-2.5 px-3">Çekim Durumu</th>
                    <th className="py-2.5 pl-3 text-right">Yönetici Aksiyonu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  {withdrawalRequests.map((w) => {
                    const gross = w.gross_amount ?? w.amount;
                    const tax = w.tax_deduction ?? Math.round(gross * 0.2 * 100) / 100;
                    const net = w.net_amount ?? Math.round((gross - tax) * 100) / 100;
                    const linkedInv = taxRefundInvoices.find(
                      (inv) =>
                        inv.id === w.tax_refund_invoice_id ||
                        String(inv.withdrawal_id) === String(w.id)
                    );
                    return (
                      <tr key={w.id} className={w.status === 'PENDING' ? 'bg-amber-50/40' : ''}>
                        <td className="py-3 pr-3 font-bold text-slate-900">#{w.id}</td>
                        <td className="py-3 px-3 font-sans">
                          <div className="font-semibold text-slate-900">{w.user_full_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Sıra #{w.monoline_position} · {w.external_user_id} · Kariyer Seviyesi {w.career_level}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <div className="font-sans text-[11px] text-slate-500">
                            {w.bank_details?.holder_name || w.user_full_name}
                            {w.bank_details?.bank_name ? ` · ${w.bank_details.bank_name}` : ''}
                          </div>
                          <div className="text-slate-900">{w.payout_address || '-'}</div>
                          <div className="font-sans text-[11px] text-slate-500">
                            {w.region === 'INTERNATIONAL' ? '🌍 Yurt Dışı' : '🇹🇷 Yurt İçi'}
                            {` · ${w.channel ?? 'TR_IBAN'}`}
                            {w.bank_details?.swift_code ? ` · SWIFT ${w.bank_details.swift_code}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-700">
                          {gross.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-700">
                          -{tax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-emerald-800 text-sm">
                          {net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {linkedInv ? (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => setPreviewInvoice(linkedInv)}
                                className="text-[11px] font-semibold text-indigo-700 underline cursor-pointer block"
                              >
                                📄 {linkedInv.invoice_no}
                              </button>
                              {linkedInv.status === 'PENDING_ADMIN_APPROVAL' && (
                                <button
                                  type="button"
                                  disabled={taxRefundBusyId === linkedInv.id}
                                  onClick={() => handleDecideTaxRefund(linkedInv.id, 'APPROVED')}
                                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  ✓ Faturayı Onayla (+{tax.toLocaleString('tr-TR')} $ İade)
                                </button>
                              )}
                              {linkedInv.status === 'APPROVED_CREDITED' && (
                                <span className="text-[10px] font-bold text-emerald-700 block">
                                  ✓ +{tax.toLocaleString('tr-TR')} $ İade Edildi
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Fatura Yüklenmedi</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {w.status === 'PENDING' && (
                            <span className="text-amber-700 font-semibold">PENDING (Bekliyor)</span>
                          )}
                          {w.status === 'APPROVED' && (
                            <span className="text-emerald-700 font-semibold">APPROVED (Ödendi)</span>
                          )}
                          {w.status === 'REJECTED' && (
                            <span className="text-red-700 font-semibold">REJECTED (İade)</span>
                          )}
                        </td>
                        <td className="py-3 pl-3 text-right font-sans">
                          {w.status === 'PENDING' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => onDecideWithdrawal(w.id, 'APPROVED')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Onayla</span>
                              </button>
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => onDecideWithdrawal(w.id, 'REJECTED')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reddet</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {w.processed_at
                                ? new Date(w.processed_at).toLocaleTimeString('tr-TR')
                                : 'Tamamlandı'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sistem Fonu Havuz Birikimi ve Dağıtım Geçmişi */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  wallets.system_fund_balance · SİSTEM FONU HAVUZ BİRİKİMİ
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Mevcut Sistem Havuzu:{' '}
                  {systemFundBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                </h3>
              </div>

              <button
                type="button"
                disabled={isSubmitting || systemFundBalance <= 0}
                onClick={onDistributePool}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-40"
              >
                Dönemsel Kariyer Fonu Havuzunu Şimdi Dağıt
              </button>
            </div>

            {poolDistributions.length === 0 ? (
              <div className="text-xs text-slate-500 py-4">
                Henüz dönemsel kariyer fonu havuz dağıtımı gerçekleştirilmedi.
              </div>
            ) : (
              <div className="space-y-3">
                {poolDistributions.map((dist) => (
                  <div
                    key={dist.distribution_id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono tabular-nums"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{dist.distribution_id}</span> ·{' '}
                      <span className="text-slate-500">
                        {new Date(dist.timestamp).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>Önceki Havuz: {dist.pool_balance_before.toLocaleString('tr-TR')} $</span>
                      <span className="text-emerald-700 font-bold">
                        Dağıtılan: {dist.total_distributed.toLocaleString('tr-TR')} $
                      </span>
                      <span>Kalan: {dist.pool_balance_after.toLocaleString('tr-TR')} $</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: BONUS YÖNETİMİ & ANINDA KARİYER BONUSU CÜZDAN AKTARIM PANELİ */}
      {adminSection === 'bonuses' && (
        <div className="space-y-8">
          {/* Top Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white rounded-2xl p-6 space-y-2 shadow-sm">
              <div className="text-xs font-mono text-emerald-300 uppercase">
                YÖNETİCİ KARİYER BONUS MERKEZİ
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums">
                {totalCareerBonusesPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
              </div>
              <div className="text-xs text-emerald-100/90">
                Bayi Cüzdanlarına Aktarılan Toplam Kariyer & Yönetici Bonusu
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-2xs">
              <div className="text-xs font-mono text-slate-500 uppercase">
                SİSTEM / KARİYER HAVUZU BAKİYESİ
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {systemFundBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
              </div>
              <div className="text-xs text-slate-500">
                Siparişlerden biriken %5 sistem fonu (Yönetici bonusları buradan veya doğrudan tanımlanır)
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-2xs">
              <div className="text-xs font-mono text-slate-500 uppercase">
                AKTİF BAYİ & CÜZDAN HESABI SAYISI
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                {sortedMembers.filter((m) => m.is_active && !m.is_locked).length} Aktif Bayi
              </div>
              <div className="text-xs text-slate-500">
                Toplam {sortedMembers.length} kayıtlı Monoline hat üyesi
              </div>
            </div>
          </div>

          {/* 1. YÖNETİCİ TARAFINDAN BELİRLENEN 7 NEFİS KARİYER BONUSLARI TABLOSU */}
          <section className="bg-white border-2 border-emerald-500/40 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>7 Nefis Mertebesi Kariyer Bonus Yönetimi</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Yönetici Tarafından Belirlenen Kariyer Bonusları & Tek Tıkla Cüzdanlara Anında Aktarım
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Her kariyer mertebesi için bayi başına ödenecek bonus tutarını ($) belirleyin.{' '}
                  <strong>"Kariyer Bonusunu Anında Cüzdanlara Aktar"</strong> butonuna tıkladığınızda tutar
                  anında ilgili bayilerin çekilebilir cüzdan hesaplarına yatırılır.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={bonusMatchMode}
                  onChange={(e) =>
                    setBonusMatchMode(e.target.value as 'EXACT_LEVEL' | 'MIN_LEVEL')
                  }
                  className="px-3 py-2 text-xs font-semibold bg-slate-100 border border-slate-300 rounded-xl text-slate-800"
                >
                  <option value="EXACT_LEVEL">
                    Sadece O Kariyerdeki Bayilere Aktar (Seviye = X)
                  </option>
                  <option value="MIN_LEVEL">
                    O Kariyer ve Üstündeki Tüm Bayilere Aktar (Seviye &ge; X)
                  </option>
                </select>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveTierBonusAmountsToCareers}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Belirlenen Bonus Tutarlarını Kaydet
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || !onPayoutCareerBonus}
                  onClick={() =>
                    onPayoutCareerBonus?.({
                      career_level: 'ALL',
                      tier_bonuses: tierBonusAmounts,
                      match_mode: bonusMatchMode,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>Tüm 7 Kariyer Bonuslarını Tek Tıkla Cüzdanlara Aktar</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-3">Kariyer Mertebesi</th>
                    <th className="py-3 px-3">Bu Mertebedeki Aktif Bayiler</th>
                    <th className="py-3 px-3">Hızlı Bayi Kariyer Atama</th>
                    <th className="py-3 px-3">Yönetici Belirlenen Kariyer Bonusu ($ / Bayi)</th>
                    <th className="py-3 px-3 text-right">Toplam Aktarılacak</th>
                    <th className="py-3 pl-3 text-right">Anında Cüzdana Aktar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {careerTiers.map((tier) => {
                    const bonusVal = Number(
                      tierBonusAmounts[tier.level] ?? tier.fixedCareerBonusAmount ?? 1000
                    );
                    const matchingMembers = sortedMembers.filter((m) => {
                      if (!m.is_active || m.is_locked) return false;
                      return bonusMatchMode === 'MIN_LEVEL'
                        ? m.career_level >= tier.level
                        : m.career_level === tier.level;
                    });
                    const totalForTier = bonusVal * matchingMembers.length;

                    return (
                      <tr key={tier.level} className="hover:bg-slate-50/80">
                        <td className="py-3.5 pr-3">
                          <div className="font-bold text-slate-900 text-sm">
                            Kariyer Seviyesi {tier.level}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {tier.unlockedDepth}. Derinlik Açık · Havuz Oranı: %
                            {Math.round(tier.poolBonusRate * 100)}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          {matchingMembers.length === 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px]">
                              0 Bayi (Yandaki menüden bayi atayabilirsiniz)
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                                {matchingMembers.length} Aktif Bayi
                              </span>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {matchingMembers.map((mm) => (
                                  <span
                                    key={mm.user_id}
                                    className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-700"
                                  >
                                    #{mm.global_line_id} {mm.full_name} (
                                    ${getMemberRegionalUsdBalance(mm).toFixed(2)})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <select
                            defaultValue=""
                            disabled={isSubmitting}
                            onChange={(e) => {
                              const uid = e.target.value;
                              if (uid) {
                                onAdminUpdateMember(uid, { manual_career_override: tier.level });
                                e.target.value = '';
                              }
                            }}
                            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                          >
                            <option value="">+ Bu Kariyere Bayi Ata...</option>
                            {sortedMembers.map((sm) => (
                              <option key={sm.user_id} value={sm.user_id}>
                                #{sm.global_line_id} {sm.full_name} (Mevcut Kariyer Seviyesi {sm.career_level})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              step={250}
                              value={bonusVal}
                              onChange={(e) =>
                                setTierBonusAmounts((prev) => ({
                                  ...prev,
                                  [tier.level]: Math.max(0, Number(e.target.value) || 0),
                                }))
                              }
                              className="w-32 px-3 py-1.5 text-sm font-mono font-bold bg-slate-50 border border-emerald-500/60 rounded-xl text-slate-900"
                            />
                            <span className="text-xs font-bold text-slate-600">$</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {[1000, 2500, 5000, 10000, 25000, 50000].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  setTierBonusAmounts((prev) => ({
                                    ...prev,
                                    [tier.level]: preset,
                                  }))
                                }
                                className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-emerald-100 text-slate-700 rounded cursor-pointer"
                              >
                                {preset.toLocaleString('tr-TR')}$
                              </button>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          <div className="text-sm font-bold text-emerald-700">
                            {totalForTier.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {matchingMembers.length} Bayi × {bonusVal.toLocaleString('tr-TR')} $
                          </div>
                        </td>

                        <td className="py-3.5 pl-3 text-right">
                          <button
                            type="button"
                            disabled={isSubmitting || matchingMembers.length === 0 || bonusVal <= 0}
                            onClick={() =>
                              onPayoutCareerBonus?.({
                                career_level: tier.level,
                                bonus_amount: bonusVal,
                                tier_bonuses: tierBonusAmounts,
                                match_mode: bonusMatchMode,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>
                              Anında Cüzdanlara Aktar ({matchingMembers.length} Bayi)
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. SEÇİLİ BAYİYE ÖZEL BONUS GÖNDER (NAKİT $ & SEANS KREDİSİ) & CANLI BAYİ HESAPLARI */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sol 5 Sütun: Bireysel Nakit Bonus & Yönetici Tarafından Belirlenen Bonus Kredi Yükleme */}
            <div className="lg:col-span-5 space-y-6">
              {/* KART 1: SEÇİLİ BAYİ CÜZDANINA ANINDA NAKİT BONUS YATIR */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
                <div className="border-b border-slate-200 pb-3">
                  <div className="text-xs font-mono text-emerald-700 font-bold">
                    1. BİREYSEL BAYİ NAKİT BONUS TRANSFERİ
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Seçili Bayi Cüzdanına Anında Nakit Bonus Yatır ($)
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bonus Aktarılacak Bayi Seçin
                    </label>
                    <select
                      value={customBonusTargetUserId || sortedMembers[0]?.user_id || ''}
                      onChange={(e) => setCustomBonusTargetUserId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                    >
                      {sortedMembers.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          #{m.global_line_id} {m.full_name} (Kariyer Seviyesi {m.career_level}) — Cüzdan:{' '}
                          ${getMemberRegionalUsdBalance(m).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Aktarılacak Bonus Tutarı ($)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={100}
                      value={customBonusAmount}
                      onChange={(e) => setCustomBonusAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {[500, 1000, 2500, 5000, 10000, 25000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCustomBonusAmount(val)}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 rounded-lg font-mono text-[11px] cursor-pointer"
                        >
                          +{val.toLocaleString('tr-TR')} $
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bonus Açıklaması / Kariyer Notu
                    </label>
                    <input
                      type="text"
                      value={customBonusNote}
                      onChange={(e) => setCustomBonusNote(e.target.value)}
                      placeholder="Örn: Yönetici Özel Kariyer Ödülü"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || customBonusAmount <= 0 || sortedMembers.length === 0}
                    onClick={() =>
                      onPayoutCareerBonus?.({
                        target_user_id: customBonusTargetUserId || sortedMembers[0]?.user_id,
                        bonus_amount: customBonusAmount,
                        note: customBonusNote,
                      })
                    }
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>
                      Nakit Bonusu Cüzdana Aktar (+{customBonusAmount.toLocaleString('tr-TR')} $)
                    </span>
                  </button>
                </div>
              </div>

              {/* KART 2: 🎁 YÖNETİCİ TARAFINDAN BELİRLENEN BONUS KREDİLERİ SEÇİLİ BAYİ PANELİNE YÜKLEME */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white border-2 border-indigo-400/40 rounded-2xl p-6 space-y-4 shadow-lg">
                <div className="border-b border-indigo-500/30 pb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold">
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                      <span>2. YÖNETİCİ BONUS KREDİ MODÜLÜ</span>
                    </div>
                    <h3 className="text-base font-black text-white mt-1">
                      Seçili Bayi Paneline Bonus Kredi Yükle
                    </h3>
                    <p className="text-[11px] text-indigo-200/80 mt-0.5">
                      Yönetici tarafından belirlenen Frekans Seans &amp; Analiz Kredilerini seçilen bayinin paneline anında bonus olarak yükleyin.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono text-[10px] font-bold whitespace-nowrap">
                    Seans Kredisi
                  </span>
                </div>

                {bonusCreditFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
                      bonusCreditFeedback.type === 'success'
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                        : 'bg-red-500/20 border-red-400/40 text-red-200'
                    }`}
                  >
                    <span>{bonusCreditFeedback.text}</span>
                    <button
                      type="button"
                      onClick={() => setBonusCreditFeedback(null)}
                      className="text-white/70 hover:text-white text-[10px] underline cursor-pointer"
                    >
                      Kapat
                    </button>
                  </div>
                )}

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-indigo-200 mb-1">
                      Bonus Kredi Yüklenecek Bayiyi Seçin
                    </label>
                    <select
                      value={bonusCreditTargetUserId || sortedMembers[0]?.user_id || ''}
                      onChange={(e) => setBonusCreditTargetUserId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-indigo-500/50 rounded-xl font-medium text-white"
                    >
                      {sortedMembers.map((m) => (
                        <option key={m.user_id} value={m.user_id} className="bg-slate-900 text-white">
                          #{m.global_line_id} {m.full_name} (Kariyer Seviyesi {m.career_level}) — Mevcut Kredi: {m.session_credits || 0} Seans
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-indigo-200">
                        Yüklenecek Bonus Kredi Sayısı (Seans Adedi)
                      </label>
                      <span className="font-mono text-amber-300 font-bold text-xs">
                        +{bonusCreditAmount.toLocaleString('tr-TR')} Seans
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      step={25}
                      value={bonusCreditAmount}
                      onChange={(e) => setBonusCreditAmount(Math.max(1, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-base font-mono font-bold bg-slate-900 border border-indigo-400/60 rounded-xl text-amber-300"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[50, 100, 250, 500, 1000].map((presetVal) => (
                        <button
                          key={presetVal}
                          type="button"
                          onClick={() => setBonusCreditAmount(presetVal)}
                          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold cursor-pointer transition-colors ${
                            bonusCreditAmount === presetVal
                              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                              : 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60'
                          }`}
                        >
                          +{presetVal} Kredi
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-indigo-200 mb-1">
                      Bonus Kredi Açıklaması / Yönetici Notu
                    </label>
                    <input
                      type="text"
                      value={bonusCreditNote}
                      onChange={(e) => setBonusCreditNote(e.target.value)}
                      placeholder="Örn: Kariyer Seviyesi 4 Başarı Bonusu"
                      className="w-full px-3 py-2 bg-slate-900 border border-indigo-500/50 rounded-xl text-white placeholder-slate-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={bonusCreditBusy || bonusCreditAmount <= 0 || sortedMembers.length === 0}
                    onClick={() =>
                      handleGrantBonusCredits(
                        bonusCreditTargetUserId || sortedMembers[0]?.user_id,
                        bonusCreditAmount,
                        bonusCreditNote
                      )
                    }
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all text-xs"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>
                      {bonusCreditBusy
                        ? 'Bonus Kredi Yükleniyor...'
                        : `🎁 Bonus Krediyi Bayi Paneline Yükle (+${bonusCreditAmount.toLocaleString('tr-TR')} Seans)`}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sağ 7 Sütun: Canlı Bayi Cüzdan & Kredi Hesapları & Hızlı İşlemler */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    CANLI BAYİ HESAPLARI (Cüzdan Bakiyeleri &amp; Seans Kredileri)
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Bayi Cüzdanları, Kredi Havuzları &amp; Tek Tıkla Bonus Yükleme
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 pr-2">Sıra &amp; Bayi</th>
                      <th className="py-2.5 px-2">Kariyer</th>
                      <th className="py-2.5 px-2 text-right">Seans Kredisi</th>
                      <th className="py-2.5 px-2 text-right">Net Çekilebilir Cüzdan</th>
                      <th className="py-2.5 pl-2 text-right">Tek Tıkla Bonus Yükle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {sortedMembers.map((m) => (
                      <tr key={m.user_id} className="hover:bg-slate-50">
                        <td className="py-3 pr-2 font-sans">
                          <div className="font-bold text-slate-900">
                            #{m.global_line_id} {m.full_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {m.user_id} · {m.ref_code}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-sans">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                            Kariyer Seviyesi {m.career_level}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>{(m.session_credits || 0).toLocaleString('tr-TR')} Seans</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs">
                            ${getMemberRegionalUsdBalance(m).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 pl-2 text-right font-sans">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Hızlı Bonus Kredi Yükleme Butonu */}
                            <button
                              type="button"
                              disabled={bonusCreditBusy}
                              onClick={() =>
                                handleGrantBonusCredits(
                                  m.user_id,
                                  100,
                                  `${m.full_name} için Tek Tıkla Hızlı +100 Seans Kredisi Bonusu`
                                )
                              }
                              className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 shadow-2xs"
                              title="Bu bayiye anında +100 Seans Kredisi yükler"
                            >
                              <Gift className="w-3 h-3 text-amber-300" />
                              <span>+100 Kredi</span>
                            </button>

                            {/* Hızlı Nakit Bonus Butonu */}
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() =>
                                onPayoutCareerBonus?.({
                                  target_user_id: m.user_id,
                                  bonus_amount: 2500,
                                  note: `Kariyer Seviyesi ${m.career_level} Hızlı Yönetici Bonusu`,
                                })
                              }
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono font-bold rounded-lg cursor-pointer disabled:opacity-40"
                              title="Bu bayinin cüzdanına anında +2.500 $ nakit bonus aktarır"
                            >
                              +2.5B $
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Son Aktarılan Kariyer & Yönetici Bonus İşlemleri */}
              {poolDistributions.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-2.5">
                  <div className="text-xs font-bold text-slate-800">
                    Son Aktarılan Kariyer & Yönetici Bonus Kayıtları ({poolDistributions.length})
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {poolDistributions.map((dist) => (
                      <div
                        key={dist.distribution_id}
                        className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-emerald-950">
                            {dist.distribution_id}
                          </span>{' '}
                          ·{' '}
                          <span className="text-slate-600">
                            {new Date(dist.timestamp).toLocaleString('tr-TR')}
                          </span>
                          <div className="text-[11px] text-slate-700 mt-0.5">
                            {dist.tier_Allocations
                              .filter((ta) => ta.qualified_member_count > 0)
                              .map(
                                (ta) =>
                                  `Kariyer Seviyesi ${ta.career_level}: ${ta.recipients
                                    .map((r) => `${r.full_name} (+${r.amount.toLocaleString('tr-TR')} $)`)
                                    .join(', ')}`
                              )
                              .join(' | ')}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-emerald-800 text-sm shrink-0">
                          +{dist.total_distributed.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $ Aktarıldı
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ÜYE, AĞ YÖNETİMİ (BAYİ EKLEME, SİLME, HAT SIRALAMA & SPONSOR DEĞİŞTİRME) & KARİYER CRON JOB */}
      {adminSection === 'members' && (
        <div className="space-y-8">
          {/* YENİ BAYİ EKLEME FORMU (MONOLINE TEK HAT AĞINA DOĞRUDAN BAYİ EKLEME) */}
          {onRegisterMember && (
            <form
              onSubmit={handleAddDealerSubmit}
              className="bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-emerald-700 font-bold">
                      POST /api/v1/members · MONOLINE TEK HAT BAYİ EKLEME
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Sisteme Yeni Bayi Ekle (Sponsor, Paket ve Kariyer Belirleyerek)
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Yeni Sıra No: #{sortedMembers.length + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bayi Ad Soyad / Ünvan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDealerName}
                    onChange={(e) => setNewDealerName(e.target.value)}
                    placeholder="Örn: Dr. Selin Kaya"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Şehir / Bölge</label>
                  <input
                    type="text"
                    value={newDealerCity}
                    onChange={(e) => setNewDealerCity(e.target.value)}
                    placeholder="Örn: İstanbul"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    E-Posta (Opsiyonel)
                  </label>
                  <input
                    type="email"
                    value={newDealerEmail}
                    onChange={(e) => setNewDealerEmail(e.target.value)}
                    placeholder="bayi@aurabio.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Özel Referans Kodu (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={newDealerRefCode}
                    onChange={(e) => setNewDealerRefCode(e.target.value.toUpperCase())}
                    placeholder="Örn: AURA-VIP-101"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono uppercase"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Giriş Şifresi Belirle *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPass = 'Aura' + Math.floor(100000 + Math.random() * 900000) + '!';
                        setNewDealerPassword(randomPass);
                      }}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                    >
                      Rastgele Şifre
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewDealerPassword ? 'text' : 'password'}
                      required
                      value={newDealerPassword}
                      onChange={(e) => setNewDealerPassword(e.target.value)}
                      placeholder="Şifre belirleyin (Varsayılan: 123456)"
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewDealerPassword(!showNewDealerPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      title={showNewDealerPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                    >
                      {showNewDealerPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Direkt Sponsor Seçimi
                  </label>
                  <select
                    value={newDealerSponsorId}
                    onChange={(e) => setNewDealerSponsorId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                  >
                    <option value="">
                      Varsayılan Kök Sponsor ({sortedMembers[0]?.full_name || 'Kök #1'})
                    </option>
                    {sortedMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        #{m.global_line_id} {m.full_name} ({m.ref_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Başlangıç Bayilik Paketi
                  </label>
                  <select
                    value={newDealerPkgId}
                    onChange={(e) =>
                      setNewDealerPkgId(e.target.value as Exclude<PackageId, 'CUSTOM'>)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  >
                    {FREKANS_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.code} — {pkg.defaultPrice.toLocaleString('tr-TR')} $ (
                        {pkg.sessionCredits} Kredi)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Başlangıç Kariyer Mertebesi
                  </label>
                  <select
                    value={newDealerCareerOverride}
                    onChange={(e) => setNewDealerCareerOverride(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  >
                    <option value="">Otomatik (Kariyer Seviyesi 1)</option>
                    {careerTiers.map((t) => (
                      <option key={t.level} value={t.level}>
                        Manuel: Kariyer Seviyesi {t.level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kol Yerleşimi (Sol / Sağ Kol)</span>
                  </label>
                  <select
                    value={newDealerLeg}
                    onChange={(e) => setNewDealerLeg(e.target.value as 'LEFT' | 'RIGHT' | 'AUTO')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="AUTO">⚖️ Otomatik / Dengeli Dağıtım</option>
                    <option value="LEFT">⬅️ Sol Kol (Left Leg)</option>
                    <option value="RIGHT">➡️ Sağ Kol (Right Leg)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!newDealerSkipOrder}
                      onChange={(e) => setNewDealerSkipOrder(!e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <span>Paket sipariş komisyonunu üst hatta dağıt</span>
                  </label>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newDealerName.trim()}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yeni Bayiyi Monoline Hattına Ekle</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Section 3: Kariyer Güncelleme Tetikleyicisi (Cron Job / Event Listener) */}
          <section className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono text-amber-400">
                  BÖLÜM 3 · KARİYER GÜNCELLEME TETİKLEYİCİSİ (CRON JOB / EVENT LISTENER)
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Otomatik 7 Nefis Mertebesi Tarama & Kilit Açma Servisi
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Her yeni üye kaydında, paket yükseltmesinde veya gece yarısı Cron Job
                  çalıştığında tüm üyelerin aktif direkt referans ve kişisel paket şartları taranır;
                  hak edilen derinlik kilidi (1..7) otomatik açılır.
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onTriggerCareerCronJob}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Gece Yarısı Cron Job Şimdi Çalıştır (POST /api/v1/cron/career-trigger)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {cronLogs.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between text-amber-300 font-semibold">
                    <span>{c.id}</span>
                    <span>{c.trigger_type}</span>
                  </div>
                  <div className="text-slate-300 font-sans">
                    Taranan: <strong>{c.evaluated_users_count} Üye</strong> · Terfi:{' '}
                    <strong className="text-emerald-400">{c.upgrades_count} Üye</strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(c.executed_at).toLocaleTimeString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xs">
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  MONOLINE TEK HAT SIRALAMA, SPONSOR DEĞİŞTİRME, KARİYER ATAMA & BAYİ SİLME
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Monoline Hat Sıralaması Değiştirme, Sponsor Değiştirme, Kariyer & Bayi Silme Yönetimi
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdminSection('bonuses')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Bonus Yönetimi Paneline Geç</span>
                </button>
                <span className="text-xs font-mono text-slate-600">
                  Toplam {sortedMembers.length} Bayi
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-2">Monoline Hat Sırası (Değiştir)</th>
                    <th className="py-2.5 px-2">Bayi Bilgisi & Cüzdan</th>
                    <th className="py-2.5 px-2">Direkt Sponsor Değiştir</th>
                    <th className="py-2.5 px-2">Kariyer Mertebesi Değiştir</th>
                    <th className="py-2.5 px-2">Durum & Kilit</th>
                    <th className="py-2.5 pl-2 text-right">Hızlı Bonus / Bayi Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedMembers.map((m) => (
                    <tr key={m.user_id} className={!m.is_active ? 'bg-slate-50 opacity-75' : ''}>
                      <td className="py-3 pr-2 font-mono tabular-nums">
                        <div className="inline-flex items-center gap-1.5">
                          <select
                            value={m.global_line_id}
                            disabled={isSubmitting}
                            title="Monoline Hat Sırasını Doğrudan Değiştir"
                            onChange={(e) =>
                              onAdminUpdateMember(m.user_id, {
                                target_line_id: Number(e.target.value),
                              })
                            }
                            className="px-2 py-1 font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
                          >
                            {sortedMembers.map((_, idx) => (
                              <option key={idx + 1} value={idx + 1}>
                                Sıra #{idx + 1}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              title="Sırayı 1 Yukarı Taşı"
                              disabled={isSubmitting || m.global_line_id === 1}
                              onClick={() =>
                                onAdminUpdateMember(m.user_id, { swap_direction: 'UP' })
                              }
                              className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              title="Sırayı 1 Aşağı Taşı"
                              disabled={isSubmitting || m.global_line_id === sortedMembers.length}
                              onClick={() =>
                                onAdminUpdateMember(m.user_id, { swap_direction: 'DOWN' })
                              }
                              className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-semibold text-slate-900">{m.full_name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {m.user_id} · Ref: {m.ref_code} · Aktif Ref: {m.active_direct_referrals}
                        </div>
                        <div className="text-[11px] font-mono text-indigo-700 font-semibold mt-0.5">
                          Kol: {(m as any).assigned_leg === 'LEFT' ? 'Sol Kol' : (m as any).assigned_leg === 'RIGHT' ? 'Sağ Kol' : 'Otomatik Denge'} · Sol: {((m as any).left_leg_volume || 0).toLocaleString('tr-TR')} $ · Sağ: {((m as any).right_leg_volume || 0).toLocaleString('tr-TR')} $
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">
                          Cüzdan: ${getMemberRegionalUsdBalance(m).toFixed(2)} (Bonus:{' '}
                          {m.wallets.career_pool_wallet.toLocaleString('tr-TR')} $) · Kredi:{' '}
                          {m.session_credits}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={m.sponsor_id || ''}
                          disabled={isSubmitting}
                          onChange={(e) =>
                            onAdminUpdateMember(m.user_id, { sponsor_id: e.target.value })
                          }
                          className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                        >
                          <option value="">Kök (Sponsor Yok)</option>
                          {sortedMembers
                            .filter((cand) => cand.user_id !== m.user_id)
                            .map((cand) => (
                              <option key={cand.user_id} value={cand.user_id}>
                                #{cand.global_line_id} {cand.full_name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={
                            m.manual_career_override !== null
                              ? String(m.manual_career_override)
                              : ''
                          }
                          disabled={isSubmitting}
                          onChange={(e) =>
                            onAdminUpdateMember(m.user_id, {
                              manual_career_override:
                                e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                        >
                          <option value="">
                            Otomatik (Kariyer Seviyesi {m.career_level})
                          </option>
                          {careerTiers.map((t) => (
                            <option key={t.level} value={t.level}>
                              Manuel: Kariyer Seviyesi {t.level}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              onAdminUpdateMember(m.user_id, { is_active: !m.is_active })
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              m.is_active
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {m.is_active ? 'Aktif' : 'Pasif'}
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              onAdminUpdateMember(m.user_id, { is_locked: !m.is_locked })
                            }
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              m.is_locked
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {m.is_locked ? (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>Kilitli</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3" />
                                <span>Açık</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleOpenMemberEditor(m)}
                            title="Sponsorluk, Monoline Sıra, Sol/Sağ Kol Dengesi ve Ciro Düzenle"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer disabled:opacity-40"
                          >
                            <GitBranch className="w-3 h-3" />
                            <span>Kol / Ağ Düzenle</span>
                          </button>

                          {onPayoutCareerBonus && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => {
                                const tierBonus =
                                  tierBonusAmounts[m.career_level] ||
                                  careerTiers.find((t) => t.level === m.career_level)
                                    ?.fixedCareerBonusAmount ||
                                  1000;
                                onPayoutCareerBonus({
                                  target_user_id: m.user_id,
                                  bonus_amount: tierBonus,
                                  note: `Kariyer Seviyesi ${m.career_level} Bonusu`,
                                });
                              }}
                              title="Bu Bayinin Kariyer Bonusunu Anında Cüzdanına Yatır"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer disabled:opacity-40"
                            >
                              <Gift className="w-3 h-3" />
                              <span>
                                +
                                {(
                                  tierBonusAmounts[m.career_level] ||
                                  careerTiers.find((t) => t.level === m.career_level)
                                    ?.fixedCareerBonusAmount ||
                                  1000
                                ).toLocaleString('tr-TR')}{' '}
                                $ Bonus
                              </span>
                            </button>
                          )}

                          {onAdminDeleteMember && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => onAdminDeleteMember(m.user_id)}
                              title="Bayiyi Sistemden Sil ve Monoline Sırasını Güncelle"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg cursor-pointer disabled:opacity-40"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Sil</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* SECTION 4: WEBHOOK LOGLARI, IDEMPOTENCY & 4 SQL VERİTABANI TABLOSU */}
      {adminSection === 'webhooks_sql' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-mono text-slate-500">
                BÖLÜM 1, 2 & 5 · ATOMIC TRANSACTION · IDEMPOTENCY · POSTGRESQL TABLOLARI
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Webhook Logları, Idempotency Koruması ({idempotentBlockedCount} Engellenen) & 4 SQL
                Tablo
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSqlTableTab('WEBHOOK_LOGS')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                  sqlTableTab === 'WEBHOOK_LOGS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Webhook ({webhookLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setSqlTableTab('USERS')}
                className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer ${
                  sqlTableTab === 'USERS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                1. users
              </button>
              <button
                type="button"
                onClick={() => setSqlTableTab('WALLETS')}
                className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer ${
                  sqlTableTab === 'WALLETS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                2. wallets
              </button>
              <button
                type="button"
                onClick={() => setSqlTableTab('SYSTEM_WALLET')}
                className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer ${
                  sqlTableTab === 'SYSTEM_WALLET'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                3. system_wallet
              </button>
              <button
                type="button"
                onClick={() => setSqlTableTab('COMMISSION_LOGS')}
                className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer ${
                  sqlTableTab === 'COMMISSION_LOGS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                4. commission_logs ({commissionLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setSqlTableTab('ORDERS_LOG')}
                className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer ${
                  sqlTableTab === 'ORDERS_LOG'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                5. orders_log ({ordersLog.length})
              </button>
              <button
                type="button"
                onClick={() => setSqlTableTab('WITHDRAWAL_REQUESTS')}
                className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer ${
                  sqlTableTab === 'WITHDRAWAL_REQUESTS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                withdrawal_requests
              </button>
              <button
                type="button"
                onClick={() => setSqlTableTab('ACTIVITY_LOGS')}
                className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer ${
                  sqlTableTab === 'ACTIVITY_LOGS'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                activity_logs ({activityLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setSqlTableTab('DDL')}
                className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer ${
                  sqlTableTab === 'DDL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                002_monoline_v2_schema.sql
              </button>
            </div>
          </div>

          {sqlTableTab === 'WEBHOOK_LOGS' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWebhookStatusFilter('ALL')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                      webhookStatusFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Tümü ({webhookLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebhookStatusFilter('SUCCESS')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                      webhookStatusFilter === 'SUCCESS'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    200 SUCCESS ({webhookLogs.filter((l) => l.status === 'SUCCESS').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebhookStatusFilter('IDEMPOTENT_REJECTED')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                      webhookStatusFilter === 'IDEMPOTENT_REJECTED'
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    409 IDEMPOTENCY (
                    {webhookLogs.filter((l) => l.status === 'IDEMPOTENT_REJECTED').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebhookStatusFilter('FAILED')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                      webhookStatusFilter === 'FAILED'
                        ? 'bg-red-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    400 FAILED ({webhookLogs.filter((l) => l.status === 'FAILED').length})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onTriggerIdempotencyDuplicateWebhook}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg cursor-pointer"
                  >
                    Yinelenen Sipariş (Idempotency 409) Test Et
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onTriggerTestErrorWebhook}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Hatalı İstek (400 Bad Request) Test Et
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-2">Log ID</th>
                      <th className="py-2 px-2">HTTP Durum</th>
                      <th className="py-2 px-2">order_id & user_id</th>
                      <th className="py-2 px-2">Atomik İşlem Yanıtı</th>
                      <th className="py-2 pl-2 text-right">Süre / Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {filteredWebhookLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 pr-2 font-bold text-slate-900">{log.id}</td>
                        <td className="py-2.5 px-2">
                          {log.status === 'SUCCESS' && (
                            <span className="text-emerald-700 font-bold">
                              {log.http_status} SUCCESS
                            </span>
                          )}
                          {log.status === 'IDEMPOTENT_REJECTED' && (
                            <span className="text-amber-700 font-bold">
                              {log.http_status} IDEMPOTENT_BLOCKED
                            </span>
                          )}
                          {log.status === 'FAILED' && (
                            <span className="text-red-700 font-bold">{log.http_status} FAILED</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2">
                          <div>{log.order_id}</div>
                          <div className="text-[11px] text-slate-500">
                            {log.user_id} · {log.order_amount.toLocaleString('tr-TR')} $
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-sans text-slate-700">
                          {log.response_message}
                        </td>
                        <td className="py-2.5 pl-2 text-right text-slate-500">
                          <div>{log.processing_ms} ms</div>
                          <div className="text-[10px]">
                            {new Date(log.created_at).toLocaleTimeString('tr-TR')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SQL TABLE 1: users */}
          {sqlTableTab === 'USERS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3">id (PK)</th>
                    <th className="py-2 px-3">monoline_position (BIGSERIAL UNIQUE)</th>
                    <th className="py-2 px-3">sponsor_id (FK)</th>
                    <th className="py-2 px-3 text-right">personal_volume_30d</th>
                    <th className="py-2 px-3 text-right">group_volume_30d</th>
                    <th className="py-2 px-3 text-center">active_direct_referrals_30d</th>
                    <th className="py-2 px-3">max_career_level</th>
                    <th className="py-2 px-3">active_career_level</th>
                    <th className="py-2 px-3">is_active</th>
                    <th className="py-2 pl-3 text-right">activity_expires_at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 pr-3 font-bold text-slate-900">
                        {m.id} <span className="font-sans text-slate-500">({m.full_name})</span>
                      </td>
                      <td className="py-2 px-3 font-bold text-indigo-700">
                        #{m.monoline_position ?? m.global_line_id}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{m.sponsor_db_id ?? 'NULL'}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">
                        {(m.personal_volume_30d ?? m.rolling_30d_personal_volume ?? m.personal_volume ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {(m.group_volume_30d ?? m.rolling_30d_pgv ?? m.group_volume ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">
                        {m.active_direct_referrals_30d ?? m.active_direct_referrals ?? 0}
                      </td>
                      <td className="py-2 px-3 text-amber-700 font-bold">
                        Kariyer Seviyesi {m.max_career_level ?? m.career_level}
                      </td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">
                        Kariyer Seviyesi {m.active_career_level ?? m.career_level}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            m.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {m.is_active ? 'TRUE' : 'FALSE'}
                        </span>
                      </td>
                      <td className="py-2 pl-3 text-right text-slate-600">
                        {m.activity_expires_at
                          ? new Date(m.activity_expires_at).toLocaleString('tr-TR')
                          : 'NULL'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SQL TABLE 2: wallets (14 GÜN CAYMA KORUMASI) */}
          {sqlTableTab === 'WALLETS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-2">user_id (BIGINT PK REFERENCES users(id))</th>
                    <th className="py-2 px-2 text-right">balance NUMERIC(15,2) (Çekilebilir)</th>
                    <th className="py-2 px-2 text-right">pending_balance NUMERIC(15,2) (14G Blokeli)</th>
                    <th className="py-2 px-2 text-right">total_withdrawn NUMERIC(15,2)</th>
                    <th className="py-2 pl-2 text-right">total_earned NUMERIC(15,2)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 pr-2 font-bold text-slate-900">
                        {m.id} <span className="font-sans font-normal">({m.full_name})</span>
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-emerald-700">
                        {getMemberRegionalUsdBalance(m).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-amber-700">
                        {getMemberRegionalPendingUsd(m).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-700">
                        {m.wallets.total_withdrawn.toFixed(2)}
                      </td>
                      <td className="py-2 pl-2 text-right font-bold text-slate-900">
                        {m.wallets.total_earnings.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SQL TABLE 3: system_wallet (SİSTEM ŞİRKET VE DEVİR HAVUZU) */}
          {sqlTableTab === 'SYSTEM_WALLET' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-2">id (INT PK DEFAULT 1)</th>
                    <th className="py-2 px-2 text-right">system_pool_balance NUMERIC(15,2) (%5 Fon)</th>
                    <th className="py-2 px-2 text-right">
                      unclaimed_pool_balance NUMERIC(15,2) (Yetkisizlik/Pasiflikten Devredenler)
                    </th>
                    <th className="py-2 px-2 text-right">Toplam Havuz (system + unclaimed)</th>
                    <th className="py-2 pl-2 text-right">updated_at (TIMESTAMP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 pr-2 font-bold text-slate-900">
                      {systemWallet?.id ?? 1}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-emerald-700">
                      {(systemWallet?.system_pool_balance ?? systemFundBalance).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-amber-700">
                      {(systemWallet?.unclaimed_pool_balance ?? 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-black text-indigo-700">
                      {systemFundBalance.toFixed(2)}
                    </td>
                    <td className="py-2.5 pl-2 text-right text-slate-500">
                      {systemWallet?.updated_at
                        ? new Date(systemWallet.updated_at).toLocaleString('tr-TR')
                        : new Date().toLocaleString('tr-TR')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* SQL TABLE 4: commission_logs (DETAYLI KOMİSYON VE İŞLEM GÜNLÜĞÜ) */}
          {sqlTableTab === 'COMMISSION_LOGS' && (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-2">id (BIGSERIAL PK)</th>
                    <th className="py-2 px-2">order_id (VARCHAR(100))</th>
                    <th className="py-2 px-2">source_user_id</th>
                    <th className="py-2 px-2">target_user_id</th>
                    <th className="py-2 px-2">type (VARCHAR(50))</th>
                    <th className="py-2 px-2">depth_level</th>
                    <th className="py-2 px-2 text-right">amount NUMERIC(15,2)</th>
                    <th className="py-2 px-2">status (VARCHAR(50))</th>
                    <th className="py-2 px-2">release_at (+14 Gün)</th>
                    <th className="py-2 pl-2 text-right">created_at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {commissionLogs.map((c) => {
                    const statusVal =
                      c.status ||
                      (c.clawback_status === 'RELEASED_TO_BALANCE'
                        ? 'RELEASED'
                        : c.clawback_status === 'CLAWBACK_REFUNDED'
                        ? 'REFUNDED_CANCELLED'
                        : c.transfer_reason_code && c.transfer_reason_code !== 'PAID'
                        ? c.transfer_reason_code
                        : 'PENDING_14D');
                    return (
                      <tr key={c.id}>
                        <td className="py-2 pr-2 font-bold text-slate-900">{c.id}</td>
                        <td className="py-2 px-2 text-slate-800">{c.order_id}</td>
                        <td className="py-2 px-2 text-slate-600">
                          {c.source_user_id} ({c.source_user_name})
                        </td>
                        <td className="py-2 px-2 text-slate-900">
                          {c.target_user_id ?? 'NULL'} ({c.target_user_name})
                        </td>
                        <td className="py-2 px-2 font-semibold text-emerald-700">{c.type}</td>
                        <td className="py-2 px-2 text-slate-700">{c.depth_level ?? 'NULL'}</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900">
                          {c.amount.toFixed(2)}
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              statusVal === 'RELEASED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : statusVal === 'PENDING_14D'
                                ? 'bg-amber-100 text-amber-800'
                                : statusVal === 'REFUNDED_CANCELLED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {statusVal}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-600">
                          {c.release_at
                            ? new Date(c.release_at).toLocaleDateString('tr-TR')
                            : 'NULL'}
                        </td>
                        <td className="py-2 pl-2 text-right text-slate-500">
                          {new Date(c.created_at).toLocaleTimeString('tr-TR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SQL TABLE 5: orders_log (SİPARİŞ HAREKETLERİ & CAYMA/İADE TAKİP TABLOSU) */}
          {sqlTableTab === 'ORDERS_LOG' && (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-2">order_id (VARCHAR(100) PK)</th>
                    <th className="py-2 px-2">user_id (BIGINT REFERENCES users(id))</th>
                    <th className="py-2 px-2">package_id (VARCHAR(50))</th>
                    <th className="py-2 px-2 text-right">amount NUMERIC(15,2)</th>
                    <th className="py-2 px-2">status (COMPLETED | REFUNDED)</th>
                    <th className="py-2 pl-2 text-right">created_at (TIMESTAMP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ordersLog.map((ord) => (
                    <tr key={ord.order_id}>
                      <td className="py-2 pr-2 font-bold text-slate-900">{ord.order_id}</td>
                      <td className="py-2 px-2 text-slate-800">
                        {ord.user_id} ({ord.user_full_name})
                      </td>
                      <td className="py-2 px-2 text-indigo-700 font-semibold">{ord.package_id}</td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900">
                        {ord.amount.toFixed(2)}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            ord.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-2 pl-2 text-right text-slate-500">
                        {new Date(ord.created_at).toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SQL TABLE 4: withdrawal_requests */}
          {sqlTableTab === 'WITHDRAWAL_REQUESTS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-2">id (BigInt, PK)</th>
                    <th className="py-2 px-2">user_id (FK)</th>
                    <th className="py-2 px-2 text-right">amount Decimal(15,2)</th>
                    <th className="py-2 px-2">payout_method (Enum)</th>
                    <th className="py-2 px-2">payout_address (Text)</th>
                    <th className="py-2 px-2">status (Enum)</th>
                    <th className="py-2 pl-2 text-right">created_at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {withdrawalRequests.map((w) => (
                    <tr key={w.id}>
                      <td className="py-2 pr-2 font-bold text-slate-900">{w.id}</td>
                      <td className="py-2 px-2 text-slate-800">
                        {w.user_id} ({w.user_full_name})
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900">
                        {w.amount.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 font-semibold text-slate-800">{w.payout_method}</td>
                      <td className="py-2 px-2 text-[11px] text-slate-600 max-w-xs truncate">
                        {w.payout_address}
                      </td>
                      <td className="py-2 px-2 font-bold">{w.status}</td>
                      <td className="py-2 pl-2 text-right text-slate-500">
                        {new Date(w.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SQL TABLE 6: activity_logs */}
          {sqlTableTab === 'ACTIVITY_LOGS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-2">id (BigInt, PK)</th>
                    <th className="py-2 px-2">user_id (FK)</th>
                    <th className="py-2 px-2">action_type (Varchar)</th>
                    <th className="py-2 px-2">previous_expires_at</th>
                    <th className="py-2 px-2">new_expires_at</th>
                    <th className="py-2 px-2">is_active_after</th>
                    <th className="py-2 pl-2">details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activityLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 pr-2 font-bold text-slate-900">{log.id}</td>
                      <td className="py-2 px-2 text-slate-800">
                        {log.user_id} ({log.user_full_name})
                      </td>
                      <td className="py-2 px-2 font-bold text-emerald-700">{log.action_type}</td>
                      <td className="py-2 px-2 text-slate-500">
                        {log.previous_expires_at
                          ? new Date(log.previous_expires_at).toLocaleString('tr-TR')
                          : 'NULL'}
                      </td>
                      <td className="py-2 px-2 text-slate-800">
                        {log.new_expires_at
                          ? new Date(log.new_expires_at).toLocaleString('tr-TR')
                          : 'NULL'}
                      </td>
                      <td className="py-2 px-2 font-bold">
                        {log.is_active_after ? 'TRUE' : 'FALSE'}
                      </td>
                      <td className="py-2 pl-2 text-slate-600 max-w-md truncate">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SQL DDL MIGRATION SCHEMA */}
          {sqlTableTab === 'DDL' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  /migrations/001_monoline_schema.sql — PostgreSQL Veritabanı Migration Dosyası
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadMigrationSql}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>001_monoline_schema.sql İndir</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>SQL Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>SQL Şemasını Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
                {POSTGRES_MIGRATION_SCHEMA}
              </pre>
            </div>
          )}
        </section>
      )}

      {/* SECTION 5: REST API ENDPOINT'LERİ & JWT DOĞRULAMA TEST KONSOLU */}
      {adminSection === 'rest_api' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
            <div className="border-b border-slate-200 pb-3">
              <div className="text-xs font-mono text-slate-500">
                BÖLÜM 4 & 5 · REST API ENDPOINT'LERİ & ROL BAZLI JWT KORUMASI
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Canlı REST API Uç Noktası Test & İnceleme Merkezi
              </h3>
            </div>

            {/* Bayi Paneli Endpoint'leri */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800">
                👤 Bayi Paneli Endpoint'leri (Dealer JWT):
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      GET /api/v1/user/dashboard?user_id=USR-1003
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Bakiye, Kariyer Seviyesi, Monoline Hat Sırası, Toplam Kazanç, Ekip Sayısı
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleTestEndpoint(
                        'User Dashboard',
                        '/api/v1/user/dashboard?user_id=USR-1003',
                        'GET',
                        'DEALER'
                      )
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test Et</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      GET /api/v1/user/monoline-line?user_id=USR-1006
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Üyenin küresel hatta önündeki ve arkasındaki son 10 üye
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleTestEndpoint(
                        'User Monoline Line',
                        '/api/v1/user/monoline-line?user_id=USR-1006',
                        'GET',
                        'DEALER'
                      )
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test Et</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      GET /api/v1/user/team?user_id=USR-1001
                    </div>
                    <div className="text-[11px] text-slate-500">
                      7 derinlikteki sponsor ekibinin listesi ve kariyer durumları
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleTestEndpoint(
                        'User 7-Depth Team',
                        '/api/v1/user/team?user_id=USR-1001',
                        'GET',
                        'DEALER'
                      )
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test Et</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Paneli Endpoint'leri */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              <div className="text-xs font-bold text-slate-800">
                🛡️ Admin Paneli Endpoint'leri (Admin Role JWT Korumalı):
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      GET /api/v1/admin/stats
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Toplam üye, Küresel Hat uzunluğu, Sistem Fonu Havuz Bakiyesi, Bekleyen Talepler
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleTestEndpoint('Admin Stats', '/api/v1/admin/stats', 'GET', 'ADMIN')
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test Et</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      GET /api/v1/admin/withdrawals
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Bekleyen ve tamamlanan tüm çekim talepleri (IBAN & TRC20)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleTestEndpoint(
                        'Admin Withdrawals',
                        '/api/v1/admin/withdrawals',
                        'GET',
                        'ADMIN'
                      )
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test Et</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      GET /api/v1/admin/stats (Yetkisiz Dealer JWT ile 403 Testi)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Admin endpoint'ine Dealer JWT ile erişildiğinde 403 Forbidden yanıtı
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleTestEndpoint(
                        '403 RBAC Test',
                        '/api/v1/admin/stats',
                        'GET',
                        'DEALER'
                      )
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>403 Test Et</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right 6 cols: Live JSON Response Viewer */}
          <div className="lg:col-span-6 bg-slate-900 text-slate-100 rounded-2xl p-6 space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-mono text-emerald-400">CANLI REST API YANITI</div>
                <h4 className="text-sm font-mono font-bold text-white mt-0.5">
                  {apiResponseTitle}
                </h4>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 bg-slate-800 rounded text-slate-300">
                CORS + JWT Auth Aktif
              </span>
            </div>

            <pre className="p-4 bg-slate-950 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto max-h-[420px] overflow-y-auto border border-slate-800">
              {apiLoading
                ? 'İstek gönderiliyor...'
                : apiResponseJson || '// Sol taraftaki bir endpoint üzerinde "Test Et" butonuna tıklayın.'}
            </pre>
          </div>
        </div>
      )}

      {/* SECTION: 💾 VERİ / DATA YÖNETİM PORTALI (YEDEKLEME, İNDİRME, YÜKLEME & ENTEGRASYON) */}
      {adminSection === 'data_management' && (
        <section className="space-y-6">
          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white rounded-2xl p-6 space-y-6 border border-blue-500/30 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold mb-2">
                  <Database className="w-3.5 h-3.5" />
                  <span>💾 VERİ / DATA YÖNETİM PORTALI · TAM SİSTEM YEDEKLEME & GERİ YÜKLEME</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Sistem Verilerini JSON/Kod Olarak İndir, Yükle ve Anında Sisteme Entegre Et
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-4xl">
                  Bu portal uygulamanın en son hali ile sürekli güncellenir. Sistemdeki tüm bayiler, sponsorluklar, ekipler, monoline hat dizilimi, sol/sağ kol hacimleri, cüzdanlar, V2.2 komisyon kayıtları, kariyerler ve sistem ayarları tek tıkla kod olarak indirilebilir ve indirilen veriler geri yüklenerek anında canlı sisteme yansıtılabilir.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncLiveServerData}
                  disabled={isExportingData}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all disabled:opacity-50"
                  title="Tüm verileri canlı sunucudan en güncel haliyle senkronize et"
                >
                  <RefreshCw className={`w-4 h-4 ${isExportingData ? 'animate-spin' : ''}`} />
                  <span>{isExportingData ? 'Senkronize Ediliyor...' : 'Canlı Senkronize Et'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAllData}
                  disabled={isExportingData}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingData ? 'İndiriliyor...' : 'Tüm Verileri İndir (.json)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetWarningModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Sistemi Sıfırla</span>
                </button>
              </div>
            </div>

            {/* Canlı Veri Sayacı & Durum Özeti (12 Kart) */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">Bayiler & Üyeler</div>
                  <div className="text-xl font-bold text-white mt-1">{sortedMembers.length} Bayi</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    {sortedMembers.filter((m) => m.is_active).length} Aktif Üye
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">Cüzdan Toplamı</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {sortedMembers
                      .reduce((sum, m) => sum + getMemberRegionalUsdBalance(m), 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                    USD
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">Çekilebilir Bakiye</div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">Komisyon Logları</div>
                  <div className="text-xl font-bold text-amber-300 mt-1">
                    {commissionLogs.length} Kayıt
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">7 Mertebe Dağıtımı</div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">Sipariş Kayıtları</div>
                  <div className="text-xl font-bold text-blue-300 mt-1">{ordersLog.length} Sipariş</div>
                  <div className="text-[10px] text-slate-300 mt-0.5">orders_log Tablosu</div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">Sistem Fon Havuzu</div>
                  <div className="text-xl font-bold text-purple-300 mt-1">
                    {systemFundBalance.toLocaleString('tr-TR')} $
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">%5 Sistem / Kariyer Fonu</div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">Kariyer Kademeleri</div>
                  <div className="text-xl font-bold text-white mt-1">{editableTiers.length} Mertebe</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">PGV & %50 Kol Kuralı</div>
                </div>
              </div>

              {/* İkinci Sıra Detaylı Canlı Sayaçlar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">Çekim Talepleri</div>
                  <div className="text-base font-bold text-amber-300 mt-1">
                    {withdrawalRequests.length} Talep
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    {withdrawalRequests.filter((w) => w.status === 'PENDING').length} Bekleyen
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">KDV İade Faturaları</div>
                  <div className="text-base font-bold text-emerald-300 mt-1">
                    {taxRefundInvoices.length} Fatura
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    {taxRefundInvoices.reduce((s, f) => s + (f.tax_deducted_amount || 0), 0).toLocaleString('tr-TR')} $
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">P2P Transferleri</div>
                  <div className="text-base font-bold text-cyan-300 mt-1">
                    {p2pTransfers.length} İşlem
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">Cüzdandan Cüzdana</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">Bildirim & FOMO</div>
                  <div className="text-base font-bold text-purple-300 mt-1">
                    {notificationOutbox.length} Mesaj
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">{fomoAlerts.length} FOMO Uyarısı</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">Bayi Kuponları</div>
                  <div className="text-base font-bold text-pink-300 mt-1">
                    {activationVouchers.length} Kupon
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">Aktivasyon & Kredi</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-300">Cron &amp; Webhook</div>
                  <div className="text-base font-bold text-indigo-300 mt-1">
                    {cronLogs.length + webhookLogs.length} Log
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    {cronLogs.length} Cron · {webhookLogs.length} Webhook
                  </div>
                </div>
              </div>
            </div>

            {dataNotice && (
              <div
                className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                  dataNotice.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                    : 'bg-red-500/20 border-red-400/50 text-red-200'
                }`}
              >
                <span>{dataNotice.message}</span>
                <button
                  type="button"
                  onClick={() => setDataNotice(null)}
                  className="underline text-[11px] cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SOL SÜTUN: VERİ İNDİR (EXPORT) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      1. Veri İndir (JSON / Kod Olarak İndir)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Sistemdeki tüm dataları kod formatında indirin veya kopyalayın
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(dataJsonCode);
                      setDataCodeCopied(true);
                      setTimeout(() => setDataCodeCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    {dataCodeCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kodu Kopyala</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAllData}
                    disabled={isExportingData}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>İndir (.json)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-mono font-medium">
                    Canlı Sistem Kodu ({Math.round(dataJsonCode.length / 1024)} KB · En son güncel hali)
                  </span>
                  <span className="text-emerald-700 font-semibold text-[11px]">
                    ● Gerçek zamanlı senkronize
                  </span>
                </div>
                <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[460px] overflow-y-auto border border-slate-800 leading-relaxed">
                  {dataJsonCode || '// Veriler hazırlanıyor...'}
                </pre>
              </div>
            </div>

            {/* SAĞ SÜTUN: VERİ YÜKLE (IMPORT / RESTORE) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      2. Veri Yükle (Kod / JSON Yükle &amp; Geri Yükle)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      İndirilen kodları yapıştırın veya .json dosyası seçerek yükleyin
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                  Canlı Entegrasyon
                </span>
              </div>

              {/* Dosya Yükleme Kutusu */}
              <div className="p-4 bg-blue-50/60 border-2 border-dashed border-blue-200 rounded-xl space-y-2 text-center">
                <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                <div className="text-xs font-semibold text-slate-800">
                  JSON Yedek Dosyasını Seçin (.json)
                </div>
                <p className="text-[11px] text-slate-500">
                  Daha önce indirdiğiniz akngroupwellness_tam_veri_yedegi dosyasını yükleyin
                </p>
                <div className="pt-1">
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleJsonFileSelected}
                    className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Kod Metni Yapıştırma Alanı */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Veya JSON Kod Metnini Buraya Yapıştırın:
                </label>
                <textarea
                  rows={10}
                  value={dataImportText}
                  onChange={(e) => setDataImportText(e.target.value)}
                  placeholder='{\n  "data": {\n    "members": [...],\n    "distributionParams": {...}\n  }\n}'
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setDataImportText('')}
                  disabled={!dataImportText}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer disabled:opacity-40"
                >
                  Metni Temizle
                </button>

                <button
                  type="button"
                  onClick={() => handleRestoreDataFromCodeOrFile()}
                  disabled={isImportingData || !dataImportText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isImportingData
                      ? 'Veriler Sisteme Yükleniyor...'
                      : 'Verileri Yükle ve Sisteme Entegre Et'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: 💬 BAYİ ŞİKAYETLER & ÖNERİLER YÖNETİM MERKEZİ (GERİ BİLDİRİM & YÖNETİM) */}
      {adminSection === 'feedback_tickets' && (
        <section className="space-y-6">
          {/* Üst Başlık & Metrik Kartı */}
          <div className="bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 text-white rounded-2xl p-6 space-y-5 border border-rose-500/30 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Bayi Destek &amp; Geri Bildirim Masası</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Şikayetler &amp; Öneriler Yönetimi (Geri Bildirim &amp; Çözüm Merkezi)
                </h3>
                <p className="text-xs text-rose-200/80 mt-1 max-w-2xl">
                  Bayiler tarafından iletilen tüm şikayet, öneri, teknik ve cüzdan bildirimlerini inceleyin; gönderen bayinin kimlik ve iletişim detaylarını görüntüleyin, doğrudan bayiye geri bildirim gönderin ve yönetin.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRefreshState?.()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Yenile</span>
                </button>
              </div>
            </div>

            {/* İstatistik Metrikleri */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3.5">
                <div className="text-[10px] font-mono uppercase text-slate-300">Toplam Bildirim</div>
                <div className="text-xl font-black text-white mt-1">
                  {(feedbackTickets || []).length} Adet
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Sistemdeki tüm kayıtlar</div>
              </div>

              <div className="bg-amber-500/10 backdrop-blur-xs border border-amber-400/30 rounded-xl p-3.5">
                <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">Bekleyen Bildirimler</div>
                <div className="text-xl font-black text-amber-400 mt-1">
                  {(feedbackTickets || []).filter((t) => t.status === 'PENDING').length} Beklemede
                </div>
                <div className="text-[10px] text-amber-200/70 mt-0.5">İnceleme sırasındaki başvurular</div>
              </div>

              <div className="bg-blue-500/10 backdrop-blur-xs border border-blue-400/30 rounded-xl p-3.5">
                <div className="text-[10px] font-mono uppercase text-blue-300 font-bold">İncelenenler</div>
                <div className="text-xl font-black text-blue-300 mt-1">
                  {(feedbackTickets || []).filter((t) => t.status === 'IN_REVIEW').length} İşlemde
                </div>
                <div className="text-[10px] text-blue-200/70 mt-0.5">Değerlendirmeye alınanlar</div>
              </div>

              <div className="bg-emerald-500/10 backdrop-blur-xs border border-emerald-400/30 rounded-xl p-3.5">
                <div className="text-[10px] font-mono uppercase text-emerald-300 font-bold">Yanıtlanan / Çözülen</div>
                <div className="text-xl font-black text-emerald-300 mt-1">
                  {(feedbackTickets || []).filter((t) => t.status === 'RESOLVED').length} Çözüldü
                </div>
                <div className="text-[10px] text-emerald-200/70 mt-0.5">Geri bildirim gönderildi</div>
              </div>
            </div>
          </div>

          {/* İşlem Geri Bildirim Banner'ı */}
          {ticketFeedback && (
            <div
              className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-xs ${
                ticketFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {ticketFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{ticketFeedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setTicketFeedback(null)}
                className="text-[11px] underline cursor-pointer text-slate-600 hover:text-slate-900"
              >
                Kapat
              </button>
            </div>
          )}

          {/* Filtreleme ve Arama Çubuğu */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex-1 min-w-[240px]">
                <div className="relative">
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Bayi adı, kullanıcı ID, referans kodu, bilet no (#TKT) veya konu ara..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 font-medium text-xs focus:bg-white focus:border-rose-500 focus:outline-hidden"
                  />
                  {ticketSearch && (
                    <button
                      type="button"
                      onClick={() => setTicketSearch('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Tür Filtresi */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-slate-500">Tür:</span>
                  <select
                    value={ticketTypeFilter}
                    onChange={(e) => setTicketTypeFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-slate-800 border-none outline-hidden cursor-pointer"
                  >
                    <option value="ALL">Tüm Türler</option>
                    <option value="COMPLAINT">🛑 Sadece Şikayetler</option>
                    <option value="SUGGESTION">💡 Sadece Öneriler</option>
                    <option value="REQUEST">📋 Talepler</option>
                    <option value="INQUIRY">❓ Sorular</option>
                  </select>
                </div>

                {/* Durum Filtresi */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-slate-500">Durum:</span>
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-slate-800 border-none outline-hidden cursor-pointer"
                  >
                    <option value="ALL">Tüm Durumlar</option>
                    <option value="PENDING">🟡 Beklemede</option>
                    <option value="IN_REVIEW">🔵 İnceleniyor</option>
                    <option value="RESOLVED">🟢 Çözüldü / Yanıtlandı</option>
                    <option value="REJECTED">🔴 Reddedildi</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Bildirim Listesi */}
          {(() => {
            const list = (feedbackTickets || []).filter((t) => {
              if (ticketTypeFilter !== 'ALL' && t.type !== ticketTypeFilter) return false;
              if (ticketStatusFilter !== 'ALL' && t.status !== ticketStatusFilter) return false;
              if (ticketSearch.trim()) {
                const q = ticketSearch.toLowerCase();
                const matchName = (t.member_name || '').toLowerCase().includes(q);
                const matchRef = (t.member_ref_code || '').toLowerCase().includes(q);
                const matchId = (t.id || '').toLowerCase().includes(q);
                const matchSubject = (t.subject || '').toLowerCase().includes(q);
                const matchMsg = (t.message || '').toLowerCase().includes(q);
                const matchUid = (t.user_id || '').toLowerCase().includes(q);
                if (!matchName && !matchRef && !matchId && !matchSubject && !matchMsg && !matchUid) {
                  return false;
                }
              }
              return true;
            });

            if (list.length === 0) {
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    Filtrelere Uygun Şikayet veya Öneri Kaydı Bulunamadı
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Arama kriterlerinizi değiştirebilir veya tüm bildirimleri görüntülemek için filtreleri sıfırlayabilirsiniz.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {list.map((ticket) => {
                  const isReplying = activeReplyTicketId === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      className={`bg-white border rounded-2xl p-6 space-y-5 shadow-2xs transition-all ${
                        ticket.status === 'PENDING'
                          ? 'border-amber-300 ring-2 ring-amber-100'
                          : ticket.status === 'RESOLVED'
                          ? 'border-emerald-200'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Üst Satır: Tür, Durum, Öncelik & Bilet Numarası */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Tür Rozeti */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                              ticket.type === 'COMPLAINT'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : ticket.type === 'SUGGESTION'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : ticket.type === 'REQUEST'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {ticket.type === 'COMPLAINT' ? (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>ŞİKAYET</span>
                              </>
                            ) : ticket.type === 'SUGGESTION' ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                <span>ÖNERİ</span>
                              </>
                            ) : ticket.type === 'REQUEST' ? (
                              <>
                                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                                <span>TALEP</span>
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                                <span>SORU / DANIŞMA</span>
                              </>
                            )}
                          </span>

                          {/* Öncelik Rozeti */}
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                              ticket.priority === 'URGENT'
                                ? 'bg-red-600 text-white'
                                : ticket.priority === 'HIGH'
                                ? 'bg-orange-500 text-white'
                                : ticket.priority === 'NORMAL'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            Öncelik: {ticket.priority === 'URGENT' ? 'Acil' : ticket.priority === 'HIGH' ? 'Yüksek' : ticket.priority === 'LOW' ? 'Düşük' : 'Normal'}
                          </span>

                          {/* Kategori */}
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono font-medium">
                            {ticket.category}
                          </span>

                          {/* Bilet ID */}
                          <span className="text-xs font-mono font-bold text-slate-500">
                            #{ticket.id}
                          </span>
                        </div>

                        {/* Durum Rozeti & Tarih */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">
                            {new Date(ticket.created_at).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                              ticket.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : ticket.status === 'IN_REVIEW'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : ticket.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                ticket.status === 'PENDING'
                                  ? 'bg-amber-500 animate-pulse'
                                  : ticket.status === 'IN_REVIEW'
                                  ? 'bg-blue-500'
                                  : ticket.status === 'RESOLVED'
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>
                              {ticket.status === 'PENDING'
                                ? 'Beklemede'
                                : ticket.status === 'IN_REVIEW'
                                ? 'İnceleniyor'
                                : ticket.status === 'RESOLVED'
                                ? 'Çözüldü / Yanıtlandı'
                                : 'Reddedildi'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Orta Kısım: Bayi Künyesi & Bildirim İçeriği */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Sol 4 Sütun: Hangi Bayiden Geldiği (Tüm Detaylar) */}
                        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
                            <Users className="w-4 h-4 text-rose-600" />
                            <span>Bildirimi Gönderen Bayi Detayları</span>
                          </div>

                          <div className="space-y-1.5">
                            <div>
                              <span className="text-[11px] text-slate-500 block">Bayi Adı &amp; Ünvan:</span>
                              <strong className="text-slate-900 text-sm font-bold">
                                {ticket.member_name}
                              </strong>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                              <div>
                                <span className="text-[10px] text-slate-500 block">Bayi Kodu:</span>
                                <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  {ticket.member_ref_code || 'Belirtilmedi'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">Kullanıcı ID:</span>
                                <span className="text-slate-700 font-bold">{ticket.user_id}</span>
                              </div>
                            </div>

                            <div className="pt-1">
                              <span className="text-[11px] text-slate-500 block">Kariyer Mertebesi:</span>
                              <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px] mt-0.5">
                                Kariyer Seviyesi {ticket.member_career_level}
                              </span>
                            </div>

                            {ticket.member_phone && (
                              <div className="pt-1">
                                <span className="text-[11px] text-slate-500 block">Telefon:</span>
                                <span className="font-mono text-slate-800 font-medium">
                                  {ticket.member_phone}
                                </span>
                              </div>
                            )}

                            {ticket.member_email && (
                              <div className="pt-1">
                                <span className="text-[11px] text-slate-500 block">E-Posta:</span>
                                <span className="font-mono text-slate-800 font-medium break-all">
                                  {ticket.member_email}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sağ 8 Sütun: Konu Başlığı & Mesaj Metni */}
                        <div className="lg:col-span-8 space-y-4">
                          <div className="space-y-1.5">
                            <h4 className="text-base font-bold text-slate-900">
                              {ticket.subject}
                            </h4>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                              {ticket.message}
                            </div>
                          </div>

                          {/* Mevcut Yönetici Geri Bildirimi (Varsa) */}
                          {ticket.admin_reply && !isReplying && (
                            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-xs space-y-2">
                              <div className="flex items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                                    ✓
                                  </div>
                                  <span className="font-bold text-emerald-950">
                                    Bayiye İletilen Yönetici Geri Bildirimi:
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-emerald-800 font-medium">
                                  {ticket.admin_replied_at &&
                                    new Date(ticket.admin_replied_at).toLocaleDateString('tr-TR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                </span>
                              </div>
                              <p className="text-emerald-900 leading-relaxed font-medium">
                                {ticket.admin_reply}
                              </p>
                              <div className="text-[11px] text-emerald-700 italic flex items-center justify-between pt-1">
                                <span>Yanıtlayan: {ticket.admin_replied_by || 'Yönetim Kurulu Başkanı Abdulkadir Kan'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReplyTicketId(ticket.id);
                                    setReplyText(ticket.admin_reply || '');
                                  }}
                                  className="text-emerald-800 font-bold underline hover:text-emerald-950 cursor-pointer"
                                >
                                  Geri Bildirimi Güncelle / Düzenle
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Geri Bildirim Yazma / Yanıtlama Alanı */}
                          {isReplying && (
                            <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-300 space-y-3 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                                <div className="flex items-center gap-2">
                                  <Send className="w-4 h-4 text-indigo-700" />
                                  <span className="font-bold text-indigo-950 text-xs">
                                    Bayiye Geri Bildirim Yanıtı Hazırla &amp; Gönder
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReplyTicketId(null);
                                    setReplyText('');
                                  }}
                                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                >
                                  İptal
                                </button>
                              </div>

                              <textarea
                                rows={3}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Bayiye iletilecek resmi geri bildirimi ve kararı buraya yazın..."
                                className="w-full p-3 bg-white border border-indigo-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                              />

                              {/* Hızlı Şablon Butonları */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-indigo-800 uppercase">
                                  Hızlı Yanıt Şablonları:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    'Talebiniz incelenmiş ve ilgili cüzdan/sistem işlemi başarıyla tamamlanmıştır.',
                                    'Değerli öneriniz için teşekkür ederiz, yönetim kurulumuz tarafından Ar-Ge planlamasına alınmıştır.',
                                    'Konu teknik ekibimize iletilmiş olup gerekli kontroller başarıyla sağlanmıştır.',
                                  ].map((tpl, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setReplyText(tpl)}
                                      className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[11px] cursor-pointer text-left"
                                    >
                                      {tpl.slice(0, 48)}...
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200">
                                <button
                                  type="button"
                                  disabled={ticketActionBusy || !replyText.trim()}
                                  onClick={() => handleUpdateTicketStatus(ticket.id, 'RESOLVED', replyText.trim())}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Geri Bildirimi Gönder &amp; Çözüldü Olarak İşaretle</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Alt Araç Çubuğu: Durum Değiştirme, Yanıtlama & Silme Butonu */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                        {/* Sol: Durum Değiştirme Butonları */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-600 text-[11px]">Durum Güncelle:</span>
                          <button
                            type="button"
                            disabled={ticketActionBusy || ticket.status === 'PENDING'}
                            onClick={() => handleUpdateTicketStatus(ticket.id, 'PENDING')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border ${
                              ticket.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            Beklemede
                          </button>

                          <button
                            type="button"
                            disabled={ticketActionBusy || ticket.status === 'IN_REVIEW'}
                            onClick={() => handleUpdateTicketStatus(ticket.id, 'IN_REVIEW')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border ${
                              ticket.status === 'IN_REVIEW'
                                ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            İnceleniyor
                          </button>

                          <button
                            type="button"
                            disabled={ticketActionBusy || ticket.status === 'RESOLVED'}
                            onClick={() => handleUpdateTicketStatus(ticket.id, 'RESOLVED')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border ${
                              ticket.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            Çözüldü / Yanıtlandı
                          </button>

                          <button
                            type="button"
                            disabled={ticketActionBusy || ticket.status === 'REJECTED'}
                            onClick={() => handleUpdateTicketStatus(ticket.id, 'REJECTED')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border ${
                              ticket.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            Reddet
                          </button>
                        </div>

                        {/* Sağ: Geri Bildirim Gönder Butonu & SİLME BUTONU */}
                        <div className="flex items-center gap-2">
                          {!isReplying && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReplyTicketId(ticket.id);
                                setReplyText(ticket.admin_reply || '');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{ticket.admin_reply ? 'Geri Bildirimi Düzenle' : 'Geri Bildirim Yaz & Gönder'}</span>
                            </button>
                          )}

                          {/* SİLME BUTONU */}
                          <button
                            type="button"
                            disabled={ticketActionBusy}
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 rounded-lg font-bold cursor-pointer transition-colors"
                            title="Bu bildirimi kalıcı olarak siler"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Sil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>
      )}

      </div>

      {/* SİSTEMİ SIFIRLA ONAY MODALI */}
      {showResetWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border-2 border-red-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Sistemi Sıfırlamak İstediğinizden Emin Misiniz?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bu işlem onaylandığında sistemdeki tüm simülasyon, demo ve sahte veriler, cüzdan bakiyeleri, siparişler, komisyonlar, çekim talepleri ve kayıtlar <strong>Yönetici Hesabı hariç</strong> tamamen silinecektir. Sistem sıfırdan canlı üretime hazır hale gelecektir.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1 text-xs text-amber-900">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Neler Sıfırlanır / Neler Korunur?</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 pt-1">
                <li>Tüm alt bayiler ve demo kullanıcılar silinir.</li>
                <li>Tüm cüzdan bakiyeleri ve bekleyen komisyonlar sıfırlanır.</li>
                <li>Tüm sipariş (orders_log) ve webhook günlükleri temizlenir.</li>
                <li><strong>Yönetici hesabı (USR-ADMIN) ve temel ayarlar korunur.</strong></li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetWarningModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 cursor-pointer"
              >
                İptal Et
              </button>
              <button
                type="button"
                onClick={handleExecuteResetSystem}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Devam Et, Sistemi Tamamen Sıfırla</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AĞ, EKİP & KOL DENGESİ DÜZENLEME MODALI */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveMemberEditor}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ağ, Sponsorluk &amp; Kol Dengesi Düzenleyici
                  </h3>
                  <div className="text-xs font-mono text-slate-500">
                    {editingMember.full_name} ({editingMember.user_id}) · Ref: {editingMember.ref_code}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bayi Ad Soyad / Ünvan
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Şehir</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Direkt Sponsor (Ağ Bağlantısı)
                </label>
                <select
                  value={editSponsorId}
                  onChange={(e) => setEditSponsorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                >
                  <option value="">Kök (Sponsor Yok / Üst Hat Başlangıcı)</option>
                  {sortedMembers
                    .filter((m) => m.user_id !== editingMember.user_id)
                    .map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        #{m.global_line_id} {m.full_name} ({m.ref_code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Monoline Tek Hat Sıra Numarası
                </label>
                <select
                  value={editLineId}
                  onChange={(e) => setEditLineId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                >
                  {sortedMembers.map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      Sıra #{idx + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* KOL DENGESİ & ATAMASI */}
              <div className="sm:col-span-2 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-blue-950 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-blue-700" />
                    <span>Kol Tayini &amp; Sol / Sağ Kol Ciro Dengesi</span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-800 font-semibold">
                    %50 Güçlü Kol Kuralı Uyumlu
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Yerleşim Kolu (Leg)
                    </label>
                    <select
                      value={editAssignedLeg}
                      onChange={(e) => setEditAssignedLeg(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold"
                    >
                      <option value="AUTO">Otomatik Denge (Auto)</option>
                      <option value="LEFT">Sol Kol (Left Leg)</option>
                      <option value="RIGHT">Sağ Kol (Right Leg)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Sol Kol Cirosu ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editLeftLegVol}
                      onChange={(e) => setEditLeftLegVol(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Sağ Kol Cirosu ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editRightLegVol}
                      onChange={(e) => setEditRightLegVol(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kişisel Ciro / PV ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={editPersonalVol}
                  onChange={(e) => setEditPersonalVol(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Grup Cirosu / PGV ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editGroupVol}
                  onChange={(e) => setEditGroupVol(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kariyer Mertebesi
                </label>
                <select
                  value={editCareerOverride}
                  onChange={(e) => setEditCareerOverride(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                >
                  <option value="">Otomatik Hesaplansın</option>
                  {careerTiers.map((t) => (
                    <option key={t.level} value={t.level}>
                      Manuel: Kariyer Seviyesi {t.level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Seans Kredisi Bakiyesi
                </label>
                <input
                  type="number"
                  min="0"
                  value={editCredits}
                  onChange={(e) => setEditCredits(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-4 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Bayi Hesabı Aktif (Komisyon ve prim kazanabilir)</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editIsLocked}
                    onChange={(e) => setEditIsLocked(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Hesap Kilitli (İşlem kısıtlaması uygula)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Değişiklikleri Kaydet &amp; Sisteme Yansıt</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
