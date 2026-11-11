import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GitBranch,
  Key,
  Lock,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Timer,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
  MessageSquare,
  HelpCircle,
  LifeBuoy,
} from 'lucide-react';
import {
  ActivationVoucherRecord,
  ActivityLogRecord,
  CommissionLogRecord,
  DealerFeedbackTicket,
  FomoCountdownAlertRecord,
  FREKANS_PACKAGES,
  INITIAL_CAREER_TIERS,
  MemberRegion,
  MonolineMember,
  NotificationOutboxRecord,
  P2PTransferRecord,
  PACKAGES,
  PackageId,
  TaxRefundInvoiceRecord,
  V2ArchitectureConfig,
  WithdrawalChannel,
  WithdrawalRequestRecord,
  WalletTransactionRecord,
} from '../types/monoline';
import {
  getDealerMonolineDownlineTree,
  redirectToDealerRegistrationPortal,
} from '../utils/monolineSyncBridge';
import { getMemberWalletToken, getActiveMemberSession } from '../utils/authManager';
import { getActiveResellerSession } from '../utils/resellerManager';
import {
  getActivationPriceForRegion,
  getMemberRegionalPendingUsd,
  getMemberRegionalUsdBalance,
  resolveMemberRegion,
} from '../utils/walletRegion';
import { recordUserContractApprovals } from '../utils/paymentProcessor';
import { FixedUsdRateBanner } from './common/FixedUsdRateBanner';
import { DealerRegionalUsdPanel } from './DealerRegionalUsdPanel';
import { DealerEthicsGuidelines } from './DealerEthicsGuidelines';
import { SharedDocumentsPanel } from './SharedDocumentsPanel';
import { UnilevelOrganizationTreePanel } from './UnilevelOrganizationTreePanel';

export type DealerBackOfficeSubTab =
  | 'wallet'
  | 'profile'
  | 'activity'
  | 'referral'
  | 'network'
  | 'security'
  | 'plaque'
  | 'feedback'
  | 'documents';

interface DealerBackOfficeViewProps {
  subTab: DealerBackOfficeSubTab;
  onSubTabChange: (tab: DealerBackOfficeSubTab) => void;
  onReturnToMenu?: () => void;
  members: MonolineMember[];
  selectedMemberId: string;
  onSelectMember: (userId: string) => void;
  withdrawalRequests: WithdrawalRequestRecord[];
  taxRefundInvoices?: TaxRefundInvoiceRecord[];
  feedbackTickets?: DealerFeedbackTicket[];
  commissionLogs: CommissionLogRecord[];
  activityLogs?: ActivityLogRecord[];
  fomoAlerts?: FomoCountdownAlertRecord[];
  p2pTransfers?: P2PTransferRecord[];
  walletTransactions?: WalletTransactionRecord[];
  activationVouchers?: ActivationVoucherRecord[];
  notificationOutbox?: NotificationOutboxRecord[];
  v2Config?: V2ArchitectureConfig;
  onRefreshState?: () => void;
  onCreateWithdrawal: (data: {
    user_id: string;
    amount: number;
    method: 'IBAN' | 'TRC20';
    holder_name: string;
    bank_name?: string;
    iban?: string;
    region?: MemberRegion;
    channel?: WithdrawalChannel;
    swift_code?: string;
    trc20_address?: string;
    wants_tax_refund?: boolean;
    invoice_number?: string;
    tax_id_or_tckn?: string;
    invoice_file_name?: string;
    invoice_file_type?: string;
    invoice_file_size?: number;
    invoice_file_data_url?: string;
  }) => Promise<void>;
  onReleasePendingBalance: (userId: string) => Promise<void>;
  onUpdateProfile: (
    userId: string,
    data: {
      full_name: string;
      phone: string;
      city: string;
      iban_holder_name: string;
      bank_name: string;
      iban: string;
      trc20_address: string;
      preferred_method: 'IBAN' | 'TRC20';
    }
  ) => Promise<void>;
  onUpdateCredentials: (
    userId: string,
    data: { current_password: string; email: string; new_password?: string }
  ) => Promise<boolean>;
  onToggle2FA: (userId: string, enabled: boolean, code: string) => Promise<void>;
  onRenewActivityPackage?: (
    userId: string,
    packageId: Exclude<PackageId, 'CUSTOM'>
  ) => Promise<void>;
  onRegisterReferralMember?: (formData: {
    full_name: string;
    city: string;
    sponsor_id: string;
    initial_package_id: Exclude<PackageId, 'CUSTOM'>;
    email?: string;
    phone?: string;
    password?: string;
    assigned_leg?: 'LEFT' | 'RIGHT' | 'AUTO';
  }) => Promise<void>;
  onRecordWalletOrder?: (payload: any, tx?: any, buyerMember?: any) => Promise<void>;
  onRecordWalletNewMember?: (newMember: any, tx?: any) => Promise<void>;
  isSubmitting: boolean;
  isAdminAuthenticated?: boolean;
}

// Deterministic SVG QR Matrix generator (21x21 Version 1 QR structure with finder patterns)
function generateQrMatrix(text: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
          reserved[rr][cc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            grid[rr][cc] = isBorder || isInner;
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Hash seed from input string
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        const stepSeed = Math.imul(hash ^ (r * 31 + c * 17), 1597334677);
        grid[r][c] = (Math.abs(stepSeed) + r + c) % 3 !== 0;
      }
    }
  }

  return grid;
}

export const DealerBackOfficeView: React.FC<DealerBackOfficeViewProps> = ({
  subTab,
  onSubTabChange: setSubTab,
  onReturnToMenu,
  members,
  selectedMemberId,
  onSelectMember,
  withdrawalRequests,
  taxRefundInvoices = [],
  commissionLogs,
  activityLogs = [],
  fomoAlerts = [],
  p2pTransfers = [],
  walletTransactions = [],
  activationVouchers = [],
  notificationOutbox = [],
  v2Config,
  onRefreshState,
  onCreateWithdrawal,
  onReleasePendingBalance,
  onUpdateProfile,
  onUpdateCredentials,
  onToggle2FA,
  onRenewActivityPackage,
  onRegisterReferralMember,
  isSubmitting,
  isAdminAuthenticated = false,
  feedbackTickets = [],
}) => {

  const [activeRegionPanel, setActiveRegionPanel] = useState<MemberRegion | null>(null);

  // 💬 Bayi Şikayetler & Öneriler Yönetimi State'leri
  const [ticketType, setTicketType] = useState<
    'COMPLAINT' | 'SUGGESTION' | 'REQUEST' | 'INQUIRY'
  >('SUGGESTION');
  const [ticketPriority, setTicketPriority] = useState<
    'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  >('NORMAL');
  const [ticketCategory, setTicketCategory] = useState<string>('SİSTEM & YAZILIM');
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [ticketSubmitting, setTicketSubmitting] = useState<boolean>(false);
  const [ticketFeedback, setTicketFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const ACTIVITY_PERIOD_DAYS = 30;

  // Live 1-second tick for the activity period countdown
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Activity package & new dealer form state
  const [selectedActivityPkg, setSelectedActivityPkg] = useState<Exclude<PackageId, 'CUSTOM'>>(
    'PKG_MINI_DENEME'
  );
  const [newSubDealerName, setNewSubDealerName] = useState<string>('');
  const [newSubDealerCity, setNewSubDealerCity] = useState<string>('İstanbul');
  const [newSubDealerPhone, setNewSubDealerPhone] = useState<string>('');
  const [newSubDealerEmail, setNewSubDealerEmail] = useState<string>('');
  const [newSubDealerPkg, setNewSubDealerPkg] = useState<Exclude<PackageId, 'CUSTOM'>>(
    'PKG_MINI_DENEME'
  );
  const [newSubDealerPassword, setNewSubDealerPassword] = useState<string>('123456');
  const [showNewSubDealerPassword, setShowNewSubDealerPassword] = useState<boolean>(false);
  const [newSubDealerLeg, setNewSubDealerLeg] = useState<'LEFT' | 'RIGHT' | 'AUTO'>('AUTO');
  const [showNetworkAddModal, setShowNetworkAddModal] = useState<boolean>(false);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.global_line_id - b.global_line_id),
    [members]
  );

  const member = useMemo<MonolineMember | null>(() => {
    const found = sortedMembers.find((m) => m.user_id === selectedMemberId);
    if (found) return found;

    const activeRes = getActiveResellerSession();
    if (activeRes) {
      const matchRes = sortedMembers.find(
        (m) =>
          m.user_id === activeRes.uid ||
          (activeRes.referralCode && m.ref_code && m.ref_code.toUpperCase() === activeRes.referralCode.toUpperCase()) ||
          (activeRes.email && m.email && m.email.toLowerCase() === activeRes.email.toLowerCase())
      );
      if (matchRes) return matchRes;
    }

    const activeMem = getActiveMemberSession();
    if (activeMem) {
      const matchMem = sortedMembers.find(
        (m) =>
          m.user_id === activeMem.uid ||
          (activeMem.referralCode && m.ref_code && m.ref_code.toUpperCase() === activeMem.referralCode.toUpperCase()) ||
          (activeMem.email && m.email && m.email.toLowerCase() === activeMem.email.toLowerCase())
      );
      if (matchMem) return matchMem;
    }

    if (sortedMembers.length > 0) return sortedMembers[0];

    if (activeRes) {
      return {
        id: 1,
        user_id: activeRes.uid,
        global_line_id: 1,
        ref_code: activeRes.referralCode || 'AURA-BAYI-01',
        full_name: activeRes.resellerName || activeRes.fullName || 'Bayi',
        email: activeRes.email || '',
        phone: activeRes.phone || '',
        city: 'Türkiye',
        country_code: 'TR',
        joined_at: activeRes.createdAt || new Date().toISOString(),
        sponsor_id: 'USR-ADMIN',
        sponsor_db_id: 1,
        highest_package_id: 'PKG_ALTIN_PRO',
        session_credits: typeof activeRes.creditsBalance === 'number' ? activeRes.creditsBalance : 64,
        personal_volume: 0,
        group_volume: 0,
        active_direct_referrals: 0,
        career_level: 1,
        career_title: 'Emmâre',
        manual_career_override: null,
        unlocked_depth: 1,
        wallets: {
          sponsor_wallet: 0,
          monoline_wallet: 0,
          career_pool_wallet: 0,
          total_earnings: activeRes.totalEarnings || 0,
          wallet_domestic_usd: 0,
          wallet_international_usd: 0,
          system_fund_balance: 0,
          total_withdrawn: activeRes.paidEarnings || 0,
        },
        bank_details: {
          iban_holder_name: activeRes.bankInfo?.accountHolder || activeRes.resellerName || 'Bayi',
          bank_name: activeRes.bankInfo?.bankName || 'Ziraat Bankası',
          iban: activeRes.bankInfo?.iban || '',
          trc20_address: '',
          preferred_method: 'IBAN',
        },
        two_factor: {
          enabled: false,
          secret_key: '',
          verified_at: null,
          backup_codes: [],
        },
        is_active: true,
        is_locked: activeRes.status === 'suspended',
        activity_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        welcome_bonus_granted: true,
        welcome_bonus_credits: 64,
        tc_identity_no: '***...***',
        has_tax_company: false,
        last_login_ip: '',
        device_fingerprint: '',
        kvkk_approved_at: new Date().toISOString(),
        contract_version: 'v2.0',
        daily_withdrawal_limit: 5000,
        fast_start_awarded: false,
        assigned_leg: 'LEFT',
        left_leg_volume: 0,
        right_leg_volume: 0,
      } as MonolineMember;
    }

    if (activeMem) {
      return {
        id: 1,
        user_id: activeMem.uid,
        global_line_id: 1,
        ref_code: activeMem.referralCode || activeMem.dealerDetails?.referralCode || 'AURA-BAYI-01',
        full_name: activeMem.fullName || 'Bayi',
        email: activeMem.email || '',
        phone: activeMem.phone || '',
        city: 'Türkiye',
        country_code: 'TR',
        joined_at: activeMem.createdAt || new Date().toISOString(),
        sponsor_id: activeMem.referredByCode || 'USR-ADMIN',
        sponsor_db_id: 1,
        highest_package_id: 'PKG_ALTIN_PRO',
        session_credits: typeof activeMem.creditsBalance === 'number' ? activeMem.creditsBalance : 64,
        personal_volume: 0,
        group_volume: 0,
        active_direct_referrals: 0,
        career_level: 1,
        career_title: 'Emmâre',
        manual_career_override: null,
        unlocked_depth: 1,
        wallets: {
          sponsor_wallet: 0,
          monoline_wallet: 0,
          career_pool_wallet: 0,
          total_earnings: 0,
          wallet_domestic_usd: 0,
          wallet_international_usd: 0,
          system_fund_balance: 0,
          total_withdrawn: 0,
        },
        bank_details: {
          iban_holder_name: activeMem.fullName || 'Bayi',
          bank_name: 'Ziraat Bankası',
          iban: '',
          trc20_address: '',
          preferred_method: 'IBAN',
        },
        two_factor: {
          enabled: false,
          secret_key: '',
          verified_at: null,
          backup_codes: [],
        },
        is_active: true,
        is_locked: false,
        activity_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        welcome_bonus_granted: true,
        welcome_bonus_credits: 64,
        tc_identity_no: '***...***',
        has_tax_company: false,
        last_login_ip: '',
        device_fingerprint: '',
        kvkk_approved_at: new Date().toISOString(),
        contract_version: 'v2.0',
        daily_withdrawal_limit: 5000,
        fast_start_awarded: false,
        assigned_leg: 'LEFT',
        left_leg_volume: 0,
        right_leg_volume: 0,
      } as MonolineMember;
    }

    return null;
  }, [sortedMembers, selectedMemberId]);

  // B2C Retail Session Value Calculator state (Revizyon 4)
  const [retailSessionFee, setRetailSessionFee] = useState<number>(500);

  // 6. Sistem Tarafından Otomatik Üretilen Kariyer Tebrik Belgesi & Plaketi State'leri
  const maxAchievedLevel = Math.max(
    1,
    member?.career_level || 1,
    member?.max_career_level || 1
  );
  const [plaqueCareerLevel, setPlaqueCareerLevel] = useState<number>(
    Math.max(1, member?.career_level || 1)
  );
  const [isDownloadingPlaque, setIsDownloadingPlaque] = useState<boolean>(false);

  useEffect(() => {
    if (member) {
      setPlaqueCareerLevel(Math.max(1, member.career_level || 1));
    }
  }, [member?.user_id, member?.career_level]);

  const selectedPlaqueTier = useMemo(
    () =>
      INITIAL_CAREER_TIERS.find((t) => t.level === plaqueCareerLevel) ||
      INITIAL_CAREER_TIERS[0],
    [plaqueCareerLevel]
  );

  // Kariyer seviyesine göre sistem tarafından otomatik üretilen resmi takdir metni ve plaket teması
  const plaqueTheme = useMemo<'obsidian_gold' | 'emerald_gold' | 'royal_platinum'>(() => {
    if (selectedPlaqueTier.level >= 6) return 'royal_platinum';
    if (selectedPlaqueTier.level >= 3) return 'emerald_gold';
    return 'obsidian_gold';
  }, [selectedPlaqueTier.level]);

  const cleanRefCode = useMemo(() => {
    return (member?.ref_code || 'AKN01')
      .toUpperCase()
      .replace(/^(CERT-2026-|AURA-BAYI-|BAYI-|AURA-)/g, '');
  }, [member?.ref_code]);

  const documentCertNo = useMemo(() => {
    return `CERT-2026-AURA-BAYI-${cleanRefCode || 'AKN01'}-L${selectedPlaqueTier.level}`;
  }, [cleanRefCode, selectedPlaqueTier.level]);

  const autoSystemPlaqueNote = useMemo(() => {
    return `Sayın ${member?.full_name || ''}, gerekli kariyer ve organizasyon şartlarını başarıyla tamamlayarak ${selectedPlaqueTier.level}. kariyer seviyesine ulaştığınız sistem tarafından otomatik olarak tescil edilmiş ve bu resmi onur plaketi adınıza düzenlenmiştir.`;
  }, [member?.full_name, selectedPlaqueTier.level]);

  const myFeedbackTickets = useMemo(() => {
    if (!member) return [];
    return (feedbackTickets || []).filter(
      (t) =>
        t.user_id === member.user_id ||
        t.user_id === String(member.id) ||
        t.member_ref_code === member.ref_code
    );
  }, [feedbackTickets, member]);

  const handleSubmitDealerTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setTicketFeedback({
        type: 'error',
        message: 'Lütfen konu başlığı ve mesaj detayını eksiksiz doldurun.',
      });
      return;
    }

    setTicketSubmitting(true);
    setTicketFeedback(null);
    try {
      const res = await fetch('/api/v1/feedback-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: member?.user_id,
          member_name: member?.full_name,
          member_email: member?.email,
          member_phone: member?.phone,
          member_ref_code: member?.ref_code,
          member_career_level: member?.career_level,
          type: ticketType,
          priority: ticketPriority,
          category: ticketCategory,
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bildirim iletilemedi.');
      setTicketFeedback({
        type: 'success',
        message: data.message || 'Bildiriminiz başarıyla sistem yöneticisine iletildi.',
      });
      setTicketSubject('');
      setTicketMessage('');
      if (onRefreshState) onRefreshState();
    } catch (err: any) {
      setTicketFeedback({
        type: 'error',
        message: err?.message || 'Bildirim gönderilirken bir hata oluştu.',
      });
    } finally {
      setTicketSubmitting(false);
    }
  };

  // Yüksek Çözünürlüklü (HD Canvas) Kariyer Tebrik Plaketi İndirme Fonksiyonu (Yatay Plaket veya Dikey Story)
  const handleDownloadCareerPlaquePng = (orientation: 'landscape' | 'story' = 'landscape') => {
    if (!member) return;
    setIsDownloadingPlaque(true);
    try {
      const canvas = document.createElement('canvas');
      const isStory = orientation === 'story';
      const width = isStory ? 1080 : 2000;
      const height = isStory ? 1920 : 1400;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Arka Plan Gradyanı (Tema Bazlı)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (plaqueTheme === 'emerald_gold') {
        bgGrad.addColorStop(0, '#022c22');
        bgGrad.addColorStop(0.35, '#064e3b');
        bgGrad.addColorStop(0.7, '#022c22');
        bgGrad.addColorStop(1, '#011c15');
      } else if (plaqueTheme === 'royal_platinum') {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(0.4, '#1e1b4b');
        bgGrad.addColorStop(0.75, '#0f172a');
        bgGrad.addColorStop(1, '#090d16');
      } else {
        bgGrad.addColorStop(0, '#090a0f');
        bgGrad.addColorStop(0.4, '#1a160c');
        bgGrad.addColorStop(0.75, '#0d0e14');
        bgGrad.addColorStop(1, '#07080c');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Dekoratif Radyal Işıma
      const radialGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.36,
        50,
        width / 2,
        height * 0.38,
        width * 0.65
      );
      radialGrad.addColorStop(0, 'rgba(245, 158, 11, 0.24)');
      radialGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.08)');
      radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // Metalik Altın Gradyan Fırçası
      const goldGrad = ctx.createLinearGradient(0, 0, width, height);
      goldGrad.addColorStop(0, '#fde68a');
      goldGrad.addColorStop(0.25, '#f59e0b');
      goldGrad.addColorStop(0.5, '#fef3c7');
      goldGrad.addColorStop(0.75, '#d97706');
      goldGrad.addColorStop(1, '#fbbf24');

      const goldLightGrad = ctx.createLinearGradient(0, 0, width, 0);
      goldLightGrad.addColorStop(0, 'rgba(245, 158, 11, 0.1)');
      goldLightGrad.addColorStop(0.5, 'rgba(254, 243, 199, 0.9)');
      goldLightGrad.addColorStop(1, 'rgba(245, 158, 11, 0.1)');

      // 2. Çift Katmanlı Asil Altın Plaket Çerçevesi & Köşe Rozetleri
      const padOuter = isStory ? 35 : 45;
      const padInner = isStory ? 55 : 68;
      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = isStory ? 5 : 6;
      ctx.strokeRect(padOuter, padOuter, width - padOuter * 2, height - padOuter * 2);

      ctx.lineWidth = 2;
      ctx.strokeRect(padInner, padInner, width - padInner * 2, height - padInner * 2);

      // Köşe Süslemeleri (4 Köşe Madalyon)
      const corners = [
        [padOuter, padOuter],
        [width - padOuter, padOuter],
        [padOuter, height - padOuter],
        [width - padOuter, height - padOuter],
      ];
      corners.forEach(([cx, cy]) => {
        ctx.save();
        ctx.fillStyle = goldGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, isStory ? 14 : 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#090a0f';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#090a0f';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', cx, cy);
        ctx.restore();
      });

      const centerX = width / 2;
      ctx.textAlign = 'center';

      // 3. Üst Kurumsal Başlık & Yıldızlar
      if (!isStory) {
        // --- YATAY HD PLAKET (2000 × 1400) DÜZENİ ---
        ctx.fillStyle = goldGrad;
        ctx.font = 'bold 22px Georgia, serif';
        ctx.fillText('★  A U R A B I O   F R E K A N S   K A R İ Y E R   A K A D E M İ S İ  ★', centerX, 140);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.fillText('7 NEFİS MAKAMI HİBRİT MONOLINE & UNILEVEL LİDERLİK KURULU', centerX, 178);

        // 7 Seviye Kariyer Yıldızları
        const starString = Array.from({ length: 7 })
          .map((_, idx) => (idx < selectedPlaqueTier.level ? '★' : '☆'))
          .join('   ');
        ctx.fillStyle = goldGrad;
        ctx.font = 'bold 42px Georgia, serif';
        ctx.fillText(starString, centerX, 238);

        // Plaket Ana Başlığı
        ctx.fillStyle = goldGrad;
        ctx.font = '900 48px Georgia, serif';
        ctx.fillText('KARİYER BAŞARI & ONUR PLAKETİ', centerX, 308);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'italic 19px Georgia, serif';
        ctx.fillText('Bu Resmi Onur Plaketi ve Kariyer Terfi Belgesi, Sistem Tarafından Otomatik Olarak Tanzim Edilmiştir', centerX, 348);

        // Bayi Adı Soyadı
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 62px Georgia, serif';
        const recipientName = (member?.full_name || 'BAYİ').toUpperCase();
        ctx.fillText(recipientName, centerX, 436);

        // İsim Altı Altın Çizgi
        ctx.strokeStyle = goldLightGrad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 420, 460);
        ctx.lineTo(centerX + 420, 460);
        ctx.stroke();

        // Ulaşılan Kariyer Mertebesi Rozeti
        const badgeW = 1060;
        const badgeH = 96;
        const badgeX = centerX - badgeW / 2;
        const badgeY = 492;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
        ctx.strokeStyle = goldGrad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText('ONAYLANAN RESMİ KARİYER MAKAMI', centerX, badgeY + 36);

        ctx.fillStyle = goldGrad;
        ctx.font = '900 32px Georgia, serif';
        ctx.fillText(
          `${selectedPlaqueTier.level}. KARİYER SEVİYESİ`,
          centerX,
          badgeY + 74
        );

        // Tebrik Metni (Kusursuz Sarma ve Şık Tipografi)
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'italic 20px Georgia, serif';
        const maxWidth = 1520;
        const words = autoSystemPlaqueNote.split(' ');
        let curLine = '';
        const lines: string[] = [];
        for (let i = 0; i < words.length; i++) {
          const test = curLine + (curLine ? ' ' : '') + words[i];
          if (ctx.measureText(test).width > maxWidth && i > 0) {
            lines.push(curLine);
            curLine = words[i];
          } else {
            curLine = test;
          }
        }
        if (curLine) lines.push(curLine);

        let noteY = 645;
        lines.slice(0, 3).forEach((ln, idx) => {
          const formatted = (idx === 0 ? '“' : '') + ln + (idx === Math.min(lines.length - 1, 2) ? '”' : '');
          ctx.fillText(formatted, centerX, noteY);
          noteY += 34;
        });

        // 4'lü Performans & Yetki Metrik Kutuları
        const metrics = [
          {
            label: 'AÇIK DERİNLİK YETKİSİ',
            val: `${selectedPlaqueTier.unlockedDepth}. Derinlik (%${selectedPlaqueTier.depthCommissionPercent})`,
          },
          {
            label: 'KARİYER TERFİ ÖDÜLÜ',
            val: `${(selectedPlaqueTier.fixedCareerBonusAmount || 1000).toLocaleString('tr-TR')} $ + Havuz`,
          },
          {
            label: '30G ORGANİZASYON HACMİ',
            val: `${Math.max(member.group_volume_30d || 0, selectedPlaqueTier.minGroupVolume).toLocaleString('tr-TR')} $`,
          },
          {
            label: 'KÜRESEL SIRA / REF KODU',
            val: `#${member.global_line_id} · ${member.ref_code}`,
          },
        ];

        const boxW = 395;
        const boxH = 110;
        const gap = 26;
        const totalW = boxW * 4 + gap * 3;
        const startX = centerX - totalW / 2;
        const boxesY = 760;

        metrics.forEach((m, idx) => {
          const bx = startX + idx * (boxW + gap);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(bx, boxesY, boxW, boxH, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 13px system-ui, sans-serif';
          ctx.fillText(m.label, bx + boxW / 2, boxesY + 40);

          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 22px monospace';
          ctx.fillText(m.val, bx + boxW / 2, boxesY + 80);
        });

        // Alt İmza, Altın Mühür ve Belge Doğrulama Alanı
        const footerY = 1070;
        const issueDate = new Date().toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

        // Sol İmza: AuraBio Yönetim Kurulu & Kurucu Başkan Abdulkadir kan
        const leftSigX = 460;
        ctx.fillStyle = goldGrad;
        ctx.font = 'italic bold 26px Georgia, serif';
        ctx.fillText('AuraBio Yönetim Kurulu', leftSigX, footerY - 20);

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftSigX - 170, footerY);
        ctx.lineTo(leftSigX + 170, footerY);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('Kurucu Yönetim Kurulu Başkanı Abdulkadir kan', leftSigX, footerY + 28);

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(`Belge No: ${documentCertNo}`, leftSigX, footerY + 54);

        // Orta Altın Mühür Rozeti
        const sealRadius = 76;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, footerY, sealRadius, 0, Math.PI * 2);
        ctx.fillStyle = goldGrad;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#78350f';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, footerY, sealRadius - 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#090a0f';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#090a0f';
        ctx.font = '900 15px Georgia, serif';
        ctx.fillText('RESMİ ONUR', centerX, footerY - 14);
        ctx.font = '900 19px Georgia, serif';
        ctx.fillText('MÜHRÜ', centerX, footerY + 10);
        ctx.font = 'bold 12px monospace';
        ctx.fillText('★ 2026 ★', centerX, footerY + 32);
        ctx.restore();

        // Sağ İmza: Global Network Direktörlüğü
        const rightSigX = 1540;
        ctx.fillStyle = goldGrad;
        ctx.font = 'italic bold 26px Georgia, serif';
        ctx.fillText('Global Liderlik Akademisi', rightSigX, footerY - 20);

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rightSigX - 170, footerY);
        ctx.lineTo(rightSigX + 170, footerY);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('Global Network Direktörlüğü', rightSigX, footerY + 28);

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(`Tanzim Tarihi: ${issueDate}`, rightSigX, footerY + 54);

        // Alt Güvenlik Dipnotu
        ctx.fillStyle = '#64748b';
        ctx.font = '13px monospace';
        ctx.fillText(
          `AuraBio Frekans Teknolojileri Ltd. Şti. · Kariyer Onur Plaketi · Tescil Kodu: ${documentCertNo}`,
          centerX,
          1250
        );
      } else {
        // --- DİKEY STORY PLAKET (1080 × 1920) DÜZENİ (9:16 Formatına Tam Uyumlu & Dışa Taşma Kesinlikle Engellenmiş) ---
        ctx.fillStyle = goldGrad;
        ctx.font = 'bold 20px Georgia, serif';
        ctx.fillText('★  A U R A B I O   F R E K A N S   K A R İ Y E R   A K A D E M İ S İ  ★', centerX, 170);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        ctx.fillText('AURABIO FREKANS KARİYER ORGANİZASYONU', centerX, 210);

        // 7 Seviye Kariyer Yıldızları
        const starString = Array.from({ length: 7 })
          .map((_, idx) => (idx < selectedPlaqueTier.level ? '★' : '☆'))
          .join('   ');
        ctx.fillStyle = goldGrad;
        ctx.font = 'bold 36px Georgia, serif';
        ctx.fillText(starString, centerX, 270);

        // Plaket Ana Başlığı
        ctx.fillStyle = goldGrad;
        ctx.font = '900 38px Georgia, serif';
        ctx.fillText('KARİYER BAŞARI & ONUR PLAKETİ', centerX, 340);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'italic 16px Georgia, serif';
        ctx.fillText('Bu Resmi Onur Plaketi, Sistem Tarafından Otomatik Olarak Tanzim Edilmiştir', centerX, 380);

        // Bayi Adı Soyadı (Dikey Story İçin Dinamik Otomatik Ölçekleme - Asla Taşmaz)
        ctx.fillStyle = '#ffffff';
        const recipientName = (member?.full_name || 'BAYİ').toUpperCase();
        let nameFontSize = 46;
        ctx.font = `900 ${nameFontSize}px Georgia, serif`;
        while (ctx.measureText(recipientName).width > 820 && nameFontSize > 18) {
          nameFontSize -= 2;
          ctx.font = `900 ${nameFontSize}px Georgia, serif`;
        }
        ctx.fillText(recipientName, centerX, 465);

        // İsim Altı Altın Çizgi
        const nameMeasuredW = ctx.measureText(recipientName).width;
        const lineHalfW = Math.min(380, (nameMeasuredW + 60) / 2);
        ctx.strokeStyle = goldLightGrad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(centerX - lineHalfW, 492);
        ctx.lineTo(centerX + lineHalfW, 492);
        ctx.stroke();

        // Makam Rozeti Kutusu (Genişlik 840px, İç Çerçeveye Güvenli Mesafe)
        const badgeW = 840;
        const badgeH = 110;
        const badgeX = centerX - badgeW / 2;
        const badgeY = 530;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
        ctx.strokeStyle = goldGrad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText('ONAYLANAN RESMİ KARİYER MAKAMI', centerX, badgeY + 36);

        const tierText = `${selectedPlaqueTier.level}. KARİYER SEVİYESİ`;
        let tierFontSize = 30;
        ctx.font = `900 ${tierFontSize}px Georgia, serif`;
        while (ctx.measureText(tierText).width > 780 && tierFontSize > 16) {
          tierFontSize -= 1;
          ctx.font = `900 ${tierFontSize}px Georgia, serif`;
        }
        ctx.fillStyle = goldGrad;
        ctx.fillText(tierText, centerX, badgeY + 76);

        // Story Tebrik Metni (Eksiksiz Tüm Satırlar Yazılır, 820px Genişliğe Güvenle Sığdırılır)
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'italic 18px Georgia, serif';
        const maxNoteWidth = 820;
        const words = autoSystemPlaqueNote.split(' ');
        let curLine = '';
        const storyLines: string[] = [];
        for (let i = 0; i < words.length; i++) {
          const test = curLine + (curLine ? ' ' : '') + words[i];
          if (ctx.measureText(test).width > maxNoteWidth && i > 0) {
            storyLines.push(curLine);
            curLine = words[i];
          } else {
            curLine = test;
          }
        }
        if (curLine) storyLines.push(curLine);

        let noteY = 685;
        storyLines.forEach((ln, idx) => {
          const formatted = (idx === 0 ? '“' : '') + ln + (idx === storyLines.length - 1 ? '”' : '');
          ctx.fillText(formatted, centerX, noteY);
          noteY += 30;
        });

        // 4'lü Metrik Kutuları (2x2 Grid - Her Kutu 400px, Toplam 824px Genişlik)
        const metrics = [
          {
            label: 'AÇIK DERİNLİK YETKİSİ',
            val: `${selectedPlaqueTier.unlockedDepth}. Derinlik (%${selectedPlaqueTier.depthCommissionPercent})`,
          },
          {
            label: 'KARİYER TERFİ ÖDÜLÜ',
            val: `${(selectedPlaqueTier.fixedCareerBonusAmount || 1000).toLocaleString('tr-TR')} $`,
          },
          {
            label: '30G ORGANİZASYON HACMİ',
            val: `${Math.max(member.group_volume_30d || 0, selectedPlaqueTier.minGroupVolume).toLocaleString('tr-TR')} $`,
          },
          {
            label: 'KÜRESEL SIRA / REF',
            val: `#${member.global_line_id} · ${member.ref_code}`,
          },
        ];

        const boxW = 400;
        const boxH = 100;
        const gapX = 24;
        const gapY = 18;
        const gridStartX = centerX - (boxW * 2 + gapX) / 2;
        const boxesStartY = Math.max(noteY + 35, 865);

        metrics.forEach((m, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const bx = gridStartX + col * (boxW + gapX);
          const by = boxesStartY + row * (boxH + gapY);

          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(bx, by, boxW, boxH, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 12px system-ui, sans-serif';
          ctx.fillText(m.label, bx + boxW / 2, by + 36);

          let valFont = 20;
          ctx.font = `bold ${valFont}px monospace`;
          while (ctx.measureText(m.val).width > 360 && valFont > 12) {
            valFont -= 1;
            ctx.font = `bold ${valFont}px monospace`;
          }
          ctx.fillStyle = '#fde68a';
          ctx.fillText(m.val, bx + boxW / 2, by + 74);
        });

        // Resmi Altın Mühür (Merkezi Madalyon)
        const sealCenterY = boxesStartY + (boxH * 2 + gapY) + 75;
        const sealRadius = 66;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, sealCenterY, sealRadius, 0, Math.PI * 2);
        ctx.fillStyle = goldGrad;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#78350f';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, sealCenterY, sealRadius - 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#090a0f';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#090a0f';
        ctx.font = '900 13px Georgia, serif';
        ctx.fillText('RESMİ ONUR', centerX, sealCenterY - 11);
        ctx.font = '900 17px Georgia, serif';
        ctx.fillText('MÜHRÜ', centerX, sealCenterY + 10);
        ctx.font = 'bold 11px monospace';
        ctx.fillText('★ 2026 ★', centerX, sealCenterY + 28);
        ctx.restore();

        // 2-Sütun İmzalar (Sol: AuraBio Yönetim Kurulu / Kurucu Başkan Abdulkadir kan | Sağ: Global Akademi)
        const sigsY = sealCenterY + sealRadius + 55;
        const issueDate = new Date().toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

        // Sol İmza (Merkez 300px, 100px - 500px aralığında güvenli)
        const leftColX = 300;
        ctx.fillStyle = goldGrad;
        ctx.font = 'italic bold 22px Georgia, serif';
        ctx.fillText('AuraBio Yönetim Kurulu', leftColX, sigsY);

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftColX - 150, sigsY + 16);
        ctx.lineTo(leftColX + 150, sigsY + 16);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText('Kurucu Yönetim Kurulu Başkanı', leftColX, sigsY + 38);
        ctx.fillStyle = goldGrad;
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('Abdulkadir kan', leftColX, sigsY + 62);

        let certFont = 13;
        ctx.font = `bold ${certFont}px monospace`;
        const certPrefix = 'Belge No: ';
        const fullCertStr = `${certPrefix}${documentCertNo}`;
        while (ctx.measureText(fullCertStr).width > 340 && certFont > 9) {
          certFont -= 1;
          ctx.font = `bold ${certFont}px monospace`;
        }
        ctx.fillStyle = '#fde68a';
        ctx.fillText(fullCertStr, leftColX, sigsY + 90);

        // Sağ İmza (Merkez 780px, 580px - 980px aralığında güvenli)
        const rightColX = 780;
        ctx.fillStyle = goldGrad;
        ctx.font = 'italic bold 22px Georgia, serif';
        ctx.fillText('Global Liderlik Akademisi', rightColX, sigsY);

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rightColX - 150, sigsY + 16);
        ctx.lineTo(rightColX + 150, sigsY + 16);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText('Global Network Direktörlüğü', rightColX, sigsY + 38);
        ctx.fillStyle = goldGrad;
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('Liderlik Konseyi', rightColX, sigsY + 62);

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`Tanzim Tarihi: ${issueDate}`, rightColX, sigsY + 90);

        // Story Güvenlik Dipnotu
        const footerY = sigsY + 145;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(160, footerY);
        ctx.lineTo(920, footerY);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('AuraBio Frekans Teknolojileri Ltd. Şti. · Kariyer Onur Plaketi', centerX, footerY + 28);

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`Resmi Doğrulama Kodu: ${documentCertNo}`, centerX, footerY + 54);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.fillText('T.C. Lisanslı ve Blokzincir Destekli Güvenli Tescil Kaydı', centerX, footerY + 76);
      }

      // PNG Olarak İndir
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const safeName = member.full_name
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]/g, '');
      link.download = `Kariyer_Tebrik_Plaketi_${safeName}_Seviye_${selectedPlaqueTier.level}${
        isStory ? '_Story' : ''
      }.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloadingPlaque(false);
    }
  };

  // Vektörel SVG Kariyer Tebrik Belgesi İndirme Fonksiyonu (2000×1400 Tam Ölçekli & XML Güvenli Vektör)
  const handleDownloadCareerPlaqueSvg = () => {
    if (!member) return;

    // XML Güvenlik Temizleyicisi: XML parse hatasını (xmlParseEntityRef) ve karakter kırılmalarını kesinlikle önler
    const escapeXml = (str: string | number | undefined | null): string => {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const issueDate = new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const starString = Array.from({ length: 7 })
      .map((_, idx) => (idx < selectedPlaqueTier.level ? '★' : '☆'))
      .join('   ');

    // Metni SVG içinde taşmayacak ve hiçbir kelime eksik kalmayacak şekilde satırlara bölelim
    const words = autoSystemPlaqueNote.split(' ');
    let line = '';
    const svgLines: string[] = [];
    for (let i = 0; i < words.length; i++) {
      const testLine = line + (line ? ' ' : '') + words[i];
      if (testLine.length > 70 && i > 0) {
        svgLines.push(line);
        line = words[i];
      } else {
        line = testLine;
      }
    }
    if (line) svgLines.push(line);

    const svgTspanLines = svgLines
      .map((l, idx) => {
        const textToDisplay = (idx === 0 ? '“' : '') + l + (idx === svgLines.length - 1 ? '”' : '');
        return `<tspan x="1000" dy="${idx === 0 ? 0 : 34}">${escapeXml(textToDisplay)}</tspan>`;
      })
      .join('');

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 1400" width="2000" height="1400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="40%" stop-color="#064e3b"/>
      <stop offset="70%" stop-color="#022c22"/>
      <stop offset="100%" stop-color="#011c15"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="30%" stop-color="#f59e0b"/>
      <stop offset="60%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="goldLight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.1"/>
      <stop offset="50%" stop-color="#fef3c7" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  
  <!-- Arka Plan -->
  <rect width="2000" height="1400" fill="url(#bg)"/>
  
  <!-- Cift Katmanli Altin Cerceve -->
  <rect x="45" y="45" width="1910" height="1310" fill="none" stroke="url(#gold)" stroke-width="6" rx="24"/>
  <rect x="68" y="68" width="1864" height="1264" fill="none" stroke="url(#gold)" stroke-width="2" rx="16" opacity="0.85"/>
  
  <!-- 4 Kose Madalyonu -->
  <circle cx="45" cy="45" r="16" fill="url(#gold)" stroke="#090a0f" stroke-width="3"/>
  <circle cx="1955" cy="45" r="16" fill="url(#gold)" stroke="#090a0f" stroke-width="3"/>
  <circle cx="45" cy="1355" r="16" fill="url(#gold)" stroke="#090a0f" stroke-width="3"/>
  <circle cx="1955" cy="1355" r="16" fill="url(#gold)" stroke="#090a0f" stroke-width="3"/>
  
  <!-- Ust Basliklar -->
  <text x="1000" y="140" text-anchor="middle" fill="url(#gold)" font-family="Georgia, serif" font-size="22" font-weight="bold">★  A U R A B I O   F R E K A N S   K A R İ Y E R   A K A D E M İ S İ  ★</text>
  <text x="1000" y="178" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">7 NEFİS MAKAMI HİBRİT MONOLINE &amp; UNILEVEL LİDERLİK KURULU</text>
  <text x="1000" y="238" text-anchor="middle" fill="url(#gold)" font-family="Georgia, serif" font-size="42" font-weight="bold">${starString}</text>
  <text x="1000" y="308" text-anchor="middle" fill="url(#gold)" font-family="Georgia, serif" font-size="48" font-weight="900">KARİYER BAŞARI &amp; ONUR PLAKETİ</text>
  <text x="1000" y="348" text-anchor="middle" fill="#cbd5e1" font-family="Georgia, serif" font-size="19" font-style="italic">Bu Resmi Onur Plaketi ve Kariyer Terfi Belgesi, Sistem Tarafından Otomatik Olarak Tanzim Edilmiştir</text>
  
  <!-- Bayi Ismi (XML Escaped) -->
  <text x="1000" y="436" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-size="56" font-weight="900">${escapeXml((member?.full_name || 'BAYİ').toUpperCase())}</text>
  <line x1="580" y1="460" x2="1420" y2="460" stroke="url(#goldLight)" stroke-width="3"/>
  
  <!-- Makam Rozeti -->
  <rect x="470" y="492" width="1060" height="96" rx="18" fill="rgba(245, 158, 11, 0.16)" stroke="url(#gold)" stroke-width="2.5"/>
  <text x="1000" y="528" text-anchor="middle" fill="#fde68a" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">ONAYLANAN RESMİ KARİYER MAKAMI</text>
  <text x="1000" y="566" text-anchor="middle" fill="url(#gold)" font-family="Georgia, serif" font-size="32" font-weight="900">${selectedPlaqueTier.level}. KARİYER SEVİYESİ</text>
  
  <!-- Tebrik Mesaji (Eksiksiz Tum Satirlar) -->
  <text x="1000" y="635" text-anchor="middle" fill="#e2e8f0" font-family="Georgia, serif" font-size="19" font-style="italic">${svgTspanLines}</text>
  
  <!-- 4lu Metrik Kartlari -->
  <!-- Kutu 1 -->
  <rect x="171" y="770" width="395" height="110" rx="16" fill="#0f172a" fill-opacity="0.85" stroke="rgba(245, 158, 11, 0.5)" stroke-width="2"/>
  <text x="368" y="810" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">AÇIK DERİNLİK YETKİSİ</text>
  <text x="368" y="850" text-anchor="middle" fill="#fde68a" font-family="monospace" font-size="22" font-weight="bold">${selectedPlaqueTier.unlockedDepth}. Derinlik (%${selectedPlaqueTier.depthCommissionPercent})</text>
  
  <!-- Kutu 2 -->
  <rect x="592" y="770" width="395" height="110" rx="16" fill="#0f172a" fill-opacity="0.85" stroke="rgba(245, 158, 11, 0.5)" stroke-width="2"/>
  <text x="789" y="810" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">KARİYER TERFİ ÖDÜLÜ</text>
  <text x="789" y="850" text-anchor="middle" fill="#fde68a" font-family="monospace" font-size="22" font-weight="bold">${escapeXml((selectedPlaqueTier.fixedCareerBonusAmount || 1000).toLocaleString('tr-TR'))} $ + Havuz</text>
  
  <!-- Kutu 3 -->
  <rect x="1013" y="770" width="395" height="110" rx="16" fill="#0f172a" fill-opacity="0.85" stroke="rgba(245, 158, 11, 0.5)" stroke-width="2"/>
  <text x="1210" y="810" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">30G ORGANİZASYON HACMİ</text>
  <text x="1210" y="850" text-anchor="middle" fill="#fde68a" font-family="monospace" font-size="22" font-weight="bold">${escapeXml(Math.max(member.group_volume_30d || 0, selectedPlaqueTier.minGroupVolume).toLocaleString('tr-TR'))} $</text>
  
  <!-- Kutu 4 -->
  <rect x="1434" y="770" width="395" height="110" rx="16" fill="#0f172a" fill-opacity="0.85" stroke="rgba(245, 158, 11, 0.5)" stroke-width="2"/>
  <text x="1631" y="810" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">KÜRESEL SIRA / REF KODU</text>
  <text x="1631" y="850" text-anchor="middle" fill="#fde68a" font-family="monospace" font-size="22" font-weight="bold">#${member.global_line_id} · ${escapeXml(member.ref_code)}</text>
  
  <!-- Sol Imza: AuraBio Yonetim Kurulu ve Kurucu Baskan Abdulkadir kan -->
  <text x="460" y="1050" text-anchor="middle" fill="url(#gold)" font-family="Georgia, serif" font-size="26" font-style="italic" font-weight="bold">AuraBio Yönetim Kurulu</text>
  <line x1="290" y1="1068" x2="630" y2="1068" stroke="rgba(245, 158, 11, 0.55)" stroke-width="2"/>
  <text x="460" y="1098" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">Kurucu Yönetim Kurulu Başkanı Abdulkadir kan</text>
  <text x="460" y="1124" text-anchor="middle" fill="#fde68a" font-family="monospace" font-size="15" font-weight="bold">Belge No: ${escapeXml(documentCertNo)}</text>
  
  <!-- Orta Muhur -->
  <circle cx="1000" cy="1070" r="76" fill="url(#gold)" stroke="#78350f" stroke-width="4"/>
  <circle cx="1000" cy="1070" r="64" fill="none" stroke="#090a0f" stroke-width="2"/>
  <text x="1000" y="1056" text-anchor="middle" fill="#090a0f" font-family="Georgia, serif" font-size="15" font-weight="900">RESMİ ONUR</text>
  <text x="1000" y="1080" text-anchor="middle" fill="#090a0f" font-family="Georgia, serif" font-size="19" font-weight="900">MÜHRÜ</text>
  <text x="1000" y="1102" text-anchor="middle" fill="#090a0f" font-family="monospace" font-size="12" font-weight="bold">★ 2026 ★</text>
  
  <!-- Sag Imza -->
  <text x="1540" y="1050" text-anchor="middle" fill="url(#gold)" font-family="Georgia, serif" font-size="26" font-style="italic" font-weight="bold">Global Liderlik Akademisi</text>
  <line x1="1370" y1="1068" x2="1710" y2="1068" stroke="rgba(245, 158, 11, 0.55)" stroke-width="2"/>
  <text x="1540" y="1098" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">Global Network Direktörlüğü</text>
  <text x="1540" y="1124" text-anchor="middle" fill="#fde68a" font-family="monospace" font-size="15" font-weight="bold">Tanzim Tarihi: ${escapeXml(issueDate)}</text>
  
  <!-- Dipnot -->
  <text x="1000" y="1250" text-anchor="middle" fill="#64748b" font-family="monospace" font-size="13">AuraBio Frekans Teknolojileri Ltd. Şti. · Kariyer Organizasyon Onur Plaketi · Tescil Kodu: ${escapeXml(documentCertNo)}</text>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = member.full_name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]/g, '');
    link.download = `Kariyer_Tebrik_Belgesi_${safeName}_Seviye_${selectedPlaqueTier.level}.svg`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Withdrawal form state (Bank Audit Compliance: IBAN Only + Name Cross-Check + %20 Vergi Kesintisi & Fatura Yükleme)
  const [withdrawMethod, setWithdrawMethod] = useState<'IBAN' | 'TRC20'>('IBAN');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(1000);
  const [customIban, setCustomIban] = useState<string>('');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [customIbanHolder, setCustomIbanHolder] = useState<string>(member?.full_name || '');
  const [withdrawComplianceError, setWithdrawComplianceError] = useState<string | null>(null);
  const [customTrc20, setCustomTrc20] = useState<string>('');

  // %20 Vergi İadesi Fatura Yükleme State'leri
  const [wantsTaxRefund, setWantsTaxRefund] = useState<boolean>(true);
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [taxOfficeAndId, setTaxOfficeAndId] = useState<string>('');
  const [invoiceFileName, setInvoiceFileName] = useState<string>('');
  const [invoiceFileType, setInvoiceFileType] = useState<string>('');
  const [invoiceFileSize, setInvoiceFileSize] = useState<number>(0);
  const [invoiceDataUrl, setInvoiceDataUrl] = useState<string>('');
  const [selectedWithdrawalIdForInvoice, setSelectedWithdrawalIdForInvoice] = useState<string>('');
  const [invoiceUploadBusy, setInvoiceUploadBusy] = useState<boolean>(false);
  const [invoiceUploadFeedback, setInvoiceUploadFeedback] = useState<string | null>(null);

  // Cüzdan Bakiyesi ile Para Gönderme (P2P), Kredi/Paket Satın Alma & Yeni Bayi Ödemesi State'leri
  const [walletActionTab, setWalletActionTab] = useState<
    'buy_credits' | 'p2p_send' | 'register_subdealer'
  >('buy_credits');
  const [walletBuyPkgId, setWalletBuyPkgId] =
    useState<Exclude<PackageId, 'CUSTOM'>>('PKG_MINI_DENEME');
  const [walletBuyOrderType, setWalletBuyOrderType] = useState<'ACTIVITY_RENEWAL' | 'STANDARD_ORDER' | 'ACTIVATION'>('STANDARD_ORDER');
  const isActivationWalletBuy = walletBuyOrderType === 'ACTIVATION';
  const activationWalletPrice = getActivationPriceForRegion(resolveMemberRegion(member?.country_code));
  const [walletTermsAccepted, setWalletTermsAccepted] = useState<boolean>(false);
  const [walletP2pRecipientId, setWalletP2pRecipientId] = useState<string>('');
  const [walletP2pAmount, setWalletP2pAmount] = useState<number>(1000);
  const [walletP2pMode, setWalletP2pMode] = useState<
    'WALLET_TO_WALLET' | 'DIRECT_PACKAGE_ACTIVATION'
  >('WALLET_TO_WALLET');
  const [walletP2pPkgId, setWalletP2pPkgId] =
    useState<Exclude<PackageId, 'CUSTOM'>>('PKG_MINI_DENEME');
  const [walletP2pNote, setWalletP2pNote] = useState<string>(
    'Bayi Cüzdanından Cüzdana Bakiye Transferi'
  );
  const [walletSubDealerName, setWalletSubDealerName] = useState<string>('');
  const [walletSubDealerEmail, setWalletSubDealerEmail] = useState<string>('');
  const [walletSubDealerPhone, setWalletSubDealerPhone] = useState<string>('');
  const [walletSubDealerCity, setWalletSubDealerCity] = useState<string>('İstanbul');
  const [walletSubDealerPkgId, setWalletSubDealerPkgId] =
    useState<Exclude<PackageId, 'CUSTOM'>>('PKG_MINI_DENEME');
  const [walletSubDealerPassword, setWalletSubDealerPassword] = useState<string>('');
  const [showWalletSubDealerPassword, setShowWalletSubDealerPassword] = useState<boolean>(false);
  const [walletSubDealerLeg, setWalletSubDealerLeg] = useState<'LEFT' | 'RIGHT' | 'AUTO'>('AUTO');
  const [walletSubDealerTermsAccepted, setWalletSubDealerTermsAccepted] = useState<boolean>(false);
  const [walletOpsBusy, setWalletOpsBusy] = useState<boolean>(false);
  const [walletOpsFeedback, setWalletOpsFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleInvoiceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInvoiceFileName(file.name);
    setInvoiceFileType(file.type || 'application/octet-stream');
    setInvoiceFileSize(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInvoiceDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStandaloneInvoiceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    if (!invoiceDataUrl || !invoiceFileName) {
      setInvoiceUploadFeedback(
        'Lütfen önce cihazınızdan yüklemek istediğiniz fatura dosyasını (PDF, PNG veya JPG) seçiniz.'
      );
      return;
    }
    setInvoiceUploadBusy(true);
    setInvoiceUploadFeedback(null);
    try {
      const token = getMemberWalletToken();
      if (!token) throw new Error('Güvenli bayi oturumu yok; yeniden giriş yapın.');
      const res = await fetch('/api/v1/tax-refunds/upload-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: member.user_id,
          withdrawal_id: selectedWithdrawalIdForInvoice || undefined,
          invoice_no: invoiceNo || `FAT-${Date.now().toString().slice(-6)}`,
          tax_office_and_id: taxOfficeAndId || member.tc_identity_no || member.city,
          invoice_file_name: invoiceFileName,
          invoice_file_type: invoiceFileType,
          invoice_file_size: invoiceFileSize,
          invoice_data_url: invoiceDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Fatura yüklenemedi.');
      }
      setInvoiceUploadFeedback(
        data.message ||
          'Faturanız başarıyla yüklendi ve Yönetici Vergi İadesi Paneline iletildi!'
      );
      setInvoiceFileName('');
      setInvoiceDataUrl('');
      setInvoiceNo('');
      if (onRefreshState) onRefreshState();
    } catch (err: any) {
      setInvoiceUploadFeedback(`Hata: ${err?.message || 'Fatura yüklenemedi.'}`);
    } finally {
      setInvoiceUploadBusy(false);
    }
  };

  const handleWalletBuyPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    if (!walletTermsAccepted) {
      setWalletOpsFeedback({ type: 'error', text: 'Ödeme öncesi sözleşme onaylarını kabul edin.' });
      return;
    }
    setWalletOpsBusy(true);
    setWalletOpsFeedback(null);
    try {
      const orderId = `ORD-WLT-${crypto.randomUUID()}`;
      const pkg = PACKAGES[walletBuyPkgId];
      const approvals = await recordUserContractApprovals({
        user_id: member.user_id,
        user_name: member.full_name,
        order_id: orderId,
        order_amount: isActivationWalletBuy ? activationWalletPrice : pkg.defaultPrice,
        product_summary: isActivationWalletBuy
          ? `Sabit Aktiflik Paketi · ${activationWalletPrice} USD · ${walletBuyOrderType}`
          : `${pkg.name} · ${pkg.sessionCreditsLabel} · ${walletBuyOrderType}`,
        contracts: ['DISTANCE_SALES', 'PRE_INFORMATION', 'MLM_TERMS', 'KVKK'],
        version: 'v2.2',
      });
      if (approvals.length !== 4) throw new Error('Sözleşme onayları sunucuya kaydedilemedi.');
      const token = getMemberWalletToken();
      if (!token) throw new Error('Güvenli bayi oturumu yok; yeniden giriş yapın.');
      const res = await fetch('/api/v1/wallet/purchase-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          payer_user_id: member.user_id,
          buyer_user_id: member.user_id,
          request_id: crypto.randomUUID(),
          order_id: orderId,
          package_id: walletBuyPkgId,
          order_type: walletBuyOrderType,
          note: 'Bayi Back-Office Cüzdan Bakiyesi ile Kredi / Paket Alışverişi',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Cüzdan ile kredi/paket satın alınamadı.');
      }
      setWalletOpsFeedback({
        type: 'success',
        text:
          data.message ||
          'Cüzdan bakiyenizle kredi/paket satın alımı tamamlandı ve seans kredileriniz yüklendi!',
      });
      if (onRefreshState) onRefreshState();
    } catch (err: any) {
      setWalletOpsFeedback({
        type: 'error',
        text: err?.message || 'Cüzdan ile alışveriş sırasında hata oluştu.',
      });
    } finally {
      setWalletOpsBusy(false);
    }
  };

  const handleWalletP2pTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    const targetId =
      walletP2pRecipientId ||
      sortedMembers.find((m) => m.user_id !== member.user_id)?.user_id ||
      '';
    if (!targetId) {
      setWalletOpsFeedback({
        type: 'error',
        text: 'Transfer yapılacak hedef bayiyi seçiniz.',
      });
      return;
    }
    setWalletOpsBusy(true);
    setWalletOpsFeedback(null);
    try {
      const res = await fetch('/api/v1/p2p/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: member.user_id,
          to_user_id: targetId,
          amount: walletP2pAmount,
          transfer_type: walletP2pMode,
          package_id: walletP2pPkgId,
          note: walletP2pNote || 'Bayi Cüzdanından Cüzdana Bakiye Transferi',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'P2P para transferi gerçekleştirilemedi.');
      }
      setWalletOpsFeedback({
        type: 'success',
        text: data.message || 'Cüzdan bakiyenizden diğer bayiye para/paket transferi tamamlandı!',
      });
      if (onRefreshState) onRefreshState();
    } catch (err: any) {
      setWalletOpsFeedback({
        type: 'error',
        text: err?.message || 'Transfer sırasında hata oluştu.',
      });
    } finally {
      setWalletOpsBusy(false);
    }
  };

  const handleWalletRegisterSubDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    if (!walletSubDealerName.trim()) {
      setWalletOpsFeedback({
        type: 'error',
        text: 'Lütfen yeni eklenecek bayinin Ad Soyad bilgisini giriniz.',
      });
      return;
    }
    if (!walletSubDealerTermsAccepted) {
      setWalletOpsFeedback({ type: 'error', text: 'Kayıt ödemesi öncesi sözleşme onaylarını kabul edin.' });
      return;
    }
    setWalletOpsBusy(true);
    setWalletOpsFeedback(null);
    try {
      const orderId = `ORD-REG-WLT-${crypto.randomUUID()}`;
      const pkg = PACKAGES[walletSubDealerPkgId];
      const approvals = await recordUserContractApprovals({
        user_id: member.user_id,
        user_name: member.full_name,
        order_id: orderId,
        order_amount: pkg.defaultPrice,
        product_summary: `Yeni bayi ${walletSubDealerName.trim()} · ${pkg.name} · ${pkg.sessionCreditsLabel}`,
        contracts: ['DISTANCE_SALES', 'PRE_INFORMATION', 'MLM_TERMS', 'KVKK'],
        version: 'v2.2',
      });
      if (approvals.length !== 4) throw new Error('Sözleşme onayları sunucuya kaydedilemedi.');
      const token = getMemberWalletToken();
      if (!token) throw new Error('Güvenli bayi oturumu yok; yeniden giriş yapın.');
      const res = await fetch('/api/v1/wallet/register-subdealer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          payer_user_id: member.user_id,
          request_id: crypto.randomUUID(),
          order_id: orderId,
          full_name: walletSubDealerName.trim(),
          email: walletSubDealerEmail.trim() || undefined,
          phone: walletSubDealerPhone.trim() || undefined,
          city: walletSubDealerCity.trim() || 'İstanbul',
          initial_package_id: walletSubDealerPkgId,
          password: walletSubDealerPassword.trim(),
          assigned_leg: walletSubDealerLeg,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Cüzdan bakiyesi ile yeni bayi kaydı yapılamadı.');
      }
      setWalletOpsFeedback({
        type: 'success',
        text:
          data.message ||
          'Yeni alt bayiniz cüzdan bakiyenizden ödenerek başarıyla kaydedildi ve aktifleştirildi!',
      });
      setWalletSubDealerName('');
      setWalletSubDealerEmail('');
      setWalletSubDealerPhone('');
      setWalletSubDealerPassword('');
      setWalletSubDealerLeg('AUTO');
      setWalletSubDealerTermsAccepted(false);
      if (onRefreshState) onRefreshState();
    } catch (err: any) {
      setWalletOpsFeedback({
        type: 'error',
        text: err?.message || 'Yeni bayi ödemesi sırasında hata oluştu.',
      });
    } finally {
      setWalletOpsBusy(false);
    }
  };

  // Referral & QR state
  const [qrMode, setQrMode] = useState<'STATIC' | 'DYNAMIC'>('STATIC');
  const [qrPackage, setQrPackage] = useState<Exclude<PackageId, 'CUSTOM'>>('PAKET_A');
  const [qrCampaign, setQrCampaign] = useState<string>('SONBAHAR2026');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Network sub-view state
  const [networkViewMode, setNetworkViewMode] = useState<'TREE' | 'UNILEVEL' | 'MONOLINE'>('TREE');

  // Profile & 2FA state
  const [editName, setEditName] = useState<string>(member?.full_name || '');
  const [editEmail, setEditEmail] = useState<string>(member?.email || '');
  const [currentLoginPassword, setCurrentLoginPassword] = useState<string>('');
  const [newLoginPassword, setNewLoginPassword] = useState<string>('');
  const [confirmLoginPassword, setConfirmLoginPassword] = useState<string>('');
  const [loginCredentialsError, setLoginCredentialsError] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState<string>(member?.phone || '');
  const [editCity, setEditCity] = useState<string>(member?.city || '');
  const [editIbanHolder, setEditIbanHolder] = useState<string>(
    member?.bank_details?.iban_holder_name || member?.full_name || ''
  );
  const [editBankName, setEditBankName] = useState<string>(member?.bank_details?.bank_name || '');
  const [editIban, setEditIban] = useState<string>(member?.bank_details?.iban || '');
  const [editTrc20, setEditTrc20] = useState<string>(member?.bank_details?.trc20_address || '');
  const [editPreferredMethod, setEditPreferredMethod] = useState<'IBAN' | 'TRC20'>(
    member?.bank_details?.preferred_method || 'IBAN'
  );
  const [totpCode, setTotpCode] = useState<string>('482910');

  // Sync local profile form when member changes
  React.useEffect(() => {
    if (member) {
      setEditName(member.full_name || '');
      setEditEmail(member.email || '');
      setCurrentLoginPassword('');
      setNewLoginPassword('');
      setConfirmLoginPassword('');
      setLoginCredentialsError(null);
      setEditPhone(member.phone || '');
      setEditCity(member.city || '');
      setEditIbanHolder(member.bank_details?.iban_holder_name || member.full_name || '');
      setCustomIbanHolder(member.bank_details?.iban_holder_name || member.full_name || '');
      setEditBankName(member.bank_details?.bank_name || '');
      setEditIban(member.bank_details?.iban || '');
      setEditTrc20(member.bank_details?.trc20_address || '');
      setEditPreferredMethod(member.bank_details?.preferred_method || 'IBAN');
      setWithdrawMethod('IBAN');
      setWithdrawComplianceError(null);
    }
  }, [member?.user_id]);

  const directSponsor = useMemo(
    () => (member?.sponsor_id ? members.find((m) => m.user_id === member.sponsor_id) : undefined),
    [members, member?.sponsor_id]
  );

  // Build 7-Depth Unilevel Sponsor Tree for the selected member
  const unilevelLevels = useMemo(() => {
    if (!member) return [];
    const levels: Array<{
      depth: number;
      members: MonolineMember[];
      totalPersonalVolume: number;
    }> = [];

    let currentParentIds = [member.user_id];
    for (let depth = 1; depth <= 7; depth++) {
      const children = sortedMembers.filter(
        (m) => m.sponsor_id && currentParentIds.includes(m.sponsor_id)
      );
      const vol = children.reduce((acc, c) => acc + c.personal_volume, 0);
      levels.push({
        depth,
        members: children,
        totalPersonalVolume: vol,
      });
      currentParentIds = children.map((c) => c.user_id);
      if (currentParentIds.length === 0) {
        // Still push remaining empty depths up to 7 so the 7-depth structure is clear
        for (let rem = depth + 1; rem <= 7; rem++) {
          levels.push({ depth: rem, members: [], totalPersonalVolume: 0 });
        }
        break;
      }
    }
    return levels;
  }, [member, sortedMembers]);

  if (!member) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
        <div className="text-base font-bold text-slate-900">
          Bayi Back-Office İçin Henüz Kayıtlı Üye Bulunmuyor
        </div>
        <p className="text-xs text-slate-500 max-w-xl mx-auto">
          Üst menüdeki <strong>&ldquo;Frekans Kayıtlarını Senkronize Et&rdquo;</strong> butonuna
          tıklayarak Frekans uygulamasındaki gerçek üyeleri ve alışverişleri aktarabilir veya{' '}
          <strong>Monoline Tek Hat Ağacı</strong> sekmesinden yeni bir bayi ekleyebilirsiniz.
        </p>
      </div>
    );
  }

  const baseOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://monoline.app';
  const referralUrl =
    qrMode === 'STATIC'
      ? `${baseOrigin}/?ref=${member.ref_code}`
      : `${baseOrigin}/?ref=${member.ref_code}&pkg=${qrPackage}&utm=${encodeURIComponent(
          qrCampaign || 'VIP'
        )}`;

  const qrMatrix = generateQrMatrix(referralUrl);

  const shareText = `Monoline kariyer ağına benim referansımla (${member.ref_code}) katılın, küresel tek hat kazançlarından pay alın: ${referralUrl}`;

  const memberWithdrawals = withdrawalRequests.filter(
    (w) => w.external_user_id === member.user_id
  );
  const memberCommissionLogs = commissionLogs.filter(
    (c) => c.target_external_id === member.user_id
  );

  const unilevelEarnings = useMemo(() => {
    if (member.wallets.unilevel_wallet && member.wallets.unilevel_wallet > 0) {
      return member.wallets.unilevel_wallet;
    }
    return memberCommissionLogs
      .filter((c) => c.commission_type === 'UNILEVEL_COMMISSION')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [member.wallets.unilevel_wallet, memberCommissionLogs]);

  const monolineIncentiveEarnings = useMemo(() => {
    if (member.wallets.monoline_incentive_wallet && member.wallets.monoline_incentive_wallet > 0) {
      return member.wallets.monoline_incentive_wallet;
    }
    return memberCommissionLogs
      .filter((c) => c.commission_type === 'MONOLINE_INCENTIVE')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [member.wallets.monoline_incentive_wallet, memberCommissionLogs]);

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawComplianceError(null);

    const submittedHolder = (customIbanHolder || editIbanHolder || member?.full_name || '').trim();
    const normSubmitted = submittedHolder.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
    const normRegistered = (member?.full_name || '').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');

    if (normSubmitted !== normRegistered) {
      setWithdrawComplianceError(
        `Banka Uyum Denetimi (İsim Eşleşmesi Zorunluluğu): Girdiğiniz IBAN Hesap Sahibi adı ("${submittedHolder}") sistemdeki kayıtlı üye adınızla ("${member?.full_name || ''}") birebir eşleşmemektedir! Başkasının IBAN hesabına komisyon çekimi yapılamaz.`
      );
      return;
    }

    if (wantsTaxRefund && !invoiceDataUrl) {
      setWithdrawComplianceError(
        'Vergi İadesi (%20) talebi seçtiniz: Lütfen aşağıdaki "Cihazdan Fatura Dosyası Yükle" alanından kestiğiniz faturayı (PDF veya Görsel) seçiniz veya faturasız çekim için kutucuğu kaldırınız.'
      );
      return;
    }

    await onCreateWithdrawal({
      user_id: member.user_id,
      amount: withdrawAmount,
      method: 'IBAN',
      holder_name: member.full_name,
      bank_name: customBankName || member.bank_details?.bank_name || 'Banka Hesabı',
      iban: customIban || member.bank_details?.iban || '',
      wants_tax_refund: wantsTaxRefund,
      invoice_number: invoiceNo || `FAT-${Date.now().toString().slice(-6)}`,
      tax_id_or_tckn: taxOfficeAndId || member.tc_identity_no || member.city,
      invoice_file_name: wantsTaxRefund ? invoiceFileName : undefined,
      invoice_file_type: wantsTaxRefund ? invoiceFileType : undefined,
      invoice_file_size: wantsTaxRefund ? invoiceFileSize : undefined,
      invoice_file_data_url: wantsTaxRefund ? invoiceDataUrl : undefined,
    });
    if (wantsTaxRefund) {
      setInvoiceFileName('');
      setInvoiceDataUrl('');
      setInvoiceNo('');
    }
  };

  const handleCopyRefLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSocialShare = (platform: 'WHATSAPP' | 'TELEGRAM' | 'INSTAGRAM' | 'FACEBOOK') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
    }
    const platformNames = {
      WHATSAPP: 'WhatsApp',
      TELEGRAM: 'Telegram',
      INSTAGRAM: 'Instagram Biyografi / Hikaye',
      FACEBOOK: 'Facebook',
    };
    setShareFeedback(
      `${platformNames[platform]} paylaşım metni ve davet bağlantısı panoya kopyalandı ve paylaşıma hazırlandı: "${shareText}"`
    );
    setTimeout(() => setShareFeedback(null), 5000);
  };

  const handleDownloadQrSvg = () => {
    const svgParts: string[] = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" width="400" height="400">`,
      `<rect width="25" height="25" fill="#ffffff"/>`,
    ];
    qrMatrix.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell) {
          svgParts.push(
            `<rect x="${cIdx + 2}" y="${rIdx + 2}" width="1" height="1" fill="#0f172a"/>`
          );
        }
      });
    });
    svgParts.push(`</svg>`);
    const blob = new Blob([svgParts.join('')], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karekod-${member.ref_code}-${qrMode.toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginCredentialsError(null);
    const email = editEmail.trim().toLowerCase();
    const newPassword = newLoginPassword.trim();
    const credentialsChanged =
      email !== (member.email || '').trim().toLowerCase() || newPassword.length > 0;

    if (credentialsChanged) {
      if (!currentLoginPassword.trim()) {
        setLoginCredentialsError('Giriş bilgilerini değiştirmek için mevcut parolanızı girin.');
        return;
      }
      if (newPassword && newPassword.length < 8) {
        setLoginCredentialsError('Yeni parola en az 8 karakter olmalıdır.');
        return;
      }
      if (newPassword !== confirmLoginPassword.trim()) {
        setLoginCredentialsError('Yeni parola ve parola tekrarı eşleşmiyor.');
        return;
      }
      const updated = await onUpdateCredentials(member.user_id, {
        current_password: currentLoginPassword.trim(),
        email,
        new_password: newPassword || undefined,
      });
      if (!updated) return;
      setCurrentLoginPassword('');
      setNewLoginPassword('');
      setConfirmLoginPassword('');
    }

    await onUpdateProfile(member.user_id, {
      full_name: editName,
      phone: editPhone,
      city: editCity,
      iban_holder_name: editIbanHolder,
      bank_name: editBankName,
      iban: editIban,
      trc20_address: editTrc20,
      preferred_method: editPreferredMethod,
    });
  };

  const dealerDownlineTree = useMemo(
    () => (member ? getDealerMonolineDownlineTree(sortedMembers, member.user_id) : []),
    [member, sortedMembers]
  );
  const downlineSubDealers = useMemo(
    () => dealerDownlineTree.filter((m) => m.user_id !== member?.user_id),
    [dealerDownlineTree, member?.user_id]
  );

  // SOL KOL & SAĞ KOL (İKİLİ DENGE HATTI) VE KARİYER YETERLİLİK / EKSİKLER ANALİZİ
  const branchAndQualificationStats = useMemo(() => {
    if (!member) {
      return {
        leftMembers: [] as MonolineMember[],
        rightMembers: [] as MonolineMember[],
        leftActive: 0,
        rightActive: 0,
        leftVol: 0,
        rightVol: 0,
        activeDirects: 0,
        reqDirects: 2,
        missingDirects: 2,
        reqPerBranch: 1,
        missingLeft: 1,
        missingRight: 1,
        totalVol: 0,
        reqVol: 5000,
        missingVol: 5000,

        nextTierLevel: 2,
      };
    }

    const directs = downlineSubDealers.filter((m) => m.sponsor_id === member.user_id);
    const leftSet = new Set<string>();
    const rightSet = new Set<string>();

    directs.forEach((d, idx) => {
      if (idx % 2 === 0) leftSet.add(d.user_id);
      else rightSet.add(d.user_id);
    });

    const leftMembers: MonolineMember[] = [];
    const rightMembers: MonolineMember[] = [];

    for (const sub of downlineSubDealers) {
      if (leftSet.has(sub.user_id)) {
        leftMembers.push(sub);
      } else if (rightSet.has(sub.user_id)) {
        rightMembers.push(sub);
      } else if (sub.sponsor_id && leftSet.has(sub.sponsor_id)) {
        leftSet.add(sub.user_id);
        leftMembers.push(sub);
      } else if (sub.sponsor_id && rightSet.has(sub.sponsor_id)) {
        rightSet.add(sub.user_id);
        rightMembers.push(sub);
      } else if (leftMembers.length <= rightMembers.length) {
        leftSet.add(sub.user_id);
        leftMembers.push(sub);
      } else {
        rightSet.add(sub.user_id);
        rightMembers.push(sub);
      }
    }

    const leftActive = leftMembers.filter((m) => m.is_active).length;
    const rightActive = rightMembers.filter((m) => m.is_active).length;
    const leftVol = leftMembers.reduce((s, m) => s + (m.personal_volume || 0), 0);
    const rightVol = rightMembers.reduce((s, m) => s + (m.personal_volume || 0), 0);

    const nextLevel = Math.min(7, (member.career_level || 1) + 1);
    const nextTier =
      INITIAL_CAREER_TIERS.find((t) => t.level === nextLevel) || INITIAL_CAREER_TIERS[6];

    const activeDirects = directs.filter((d) => d.is_active).length;
    const reqDirects = Number(
      nextTier.minActiveDirects ?? (nextTier as any).requiredDirectReferrals ?? 2
    );
    const missingDirects = Math.max(0, reqDirects - activeDirects);

    const reqPerBranch = Math.max(1, Math.ceil(reqDirects / 2));
    const missingLeft = Math.max(0, reqPerBranch - leftActive);
    const missingRight = Math.max(0, reqPerBranch - rightActive);

    const totalVol = (member.personal_volume || 0) + leftVol + rightVol;
    const reqVol = Number(nextTier.minGroupVolume ?? 0);
    const missingVol = Math.max(0, reqVol - totalVol);


    return {
      leftMembers,
      rightMembers,
      leftActive,
      rightActive,
      leftVol,
      rightVol,
      activeDirects,
      reqDirects,
      missingDirects,
      reqPerBranch,
      missingLeft,
      missingRight,
      totalVol,
      reqVol,
      missingVol,

      nextTierLevel: nextTier.level,
    };
  }, [member, downlineSubDealers]);

  // Calculate live countdown to member.activity_expires_at
  const expiresAtMs = useMemo(() => {
    if (!member.activity_expires_at) {
      return Date.now() + ACTIVITY_PERIOD_DAYS * 86400000;
    }
    const parsed = new Date(member.activity_expires_at).getTime();
    return isNaN(parsed) ? Date.now() + ACTIVITY_PERIOD_DAYS * 86400000 : parsed;
  }, [member.activity_expires_at, ACTIVITY_PERIOD_DAYS]);

  const remainingMs = Math.max(0, expiresAtMs - nowMs);
  const isTimeExpired = remainingMs <= 0 || !member.is_active;
  const countdownDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const countdownHours = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
  const countdownMinutes = Math.floor((remainingMs / (1000 * 60)) % 60);
  const countdownSeconds = Math.floor((remainingMs / 1000) % 60);

  const totalPeriodMs = Math.max(1, ACTIVITY_PERIOD_DAYS * 86400000);
  const progressPercent = Math.min(100, Math.max(0, Math.round((remainingMs / totalPeriodMs) * 100)));

  const activationThreshold = getActivationPriceForRegion(resolveMemberRegion(member?.country_code));
  const isWithdrawalEligible = !member.is_locked && !isTimeExpired;

  const memberActivityLogs = activityLogs.filter((l) => l.external_user_id === member.user_id);

  const handleAddSubDealerForActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRegisterReferralMember || !newSubDealerName.trim()) return;
    await onRegisterReferralMember({
      full_name: newSubDealerName.trim(),
      city: newSubDealerCity.trim() || 'Türkiye',
      phone: newSubDealerPhone.trim() || undefined,
      email: newSubDealerEmail.trim() || undefined,
      sponsor_id: member.user_id,
      initial_package_id: newSubDealerPkg,
      password: newSubDealerPassword.trim() || '123456',
      assigned_leg: newSubDealerLeg,
    });
    setNewSubDealerName('');
    setNewSubDealerPhone('');
    setNewSubDealerEmail('');
    setNewSubDealerPassword('123456');
    setNewSubDealerLeg('AUTO');
    setShowNetworkAddModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <DealerEthicsGuidelines />
      </div>
      {/* AKTİFLİK SÜRESİ GERİ SAYIMI & ÇEKİM ŞARTI ÖZET PANELİ */}
      <section
        className={`rounded-2xl p-6 border-2 shadow-xs transition-all ${
          isWithdrawalEligible
            ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border-emerald-500/40'
            : isTimeExpired
            ? 'bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 text-white border-red-500/50'
            : 'bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white border-amber-500/50'
        }`}
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Sol: Aktiflik Durumu & Çekim Şartları */}
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isWithdrawalEligible
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : isTimeExpired
                    ? 'bg-red-500/25 text-red-200 border-red-400/50'
                    : 'bg-amber-500/25 text-amber-200 border-amber-400/50'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>
                  {isWithdrawalEligible
                    ? 'AKTİF — ÇEKİME AÇIK'
                    : 'AKTİFLİK YOK VEYA SÜRESİ DOLDU — ÇEKİM KİLİTLİ'}
                </span>
              </span>
              <span className="text-xs font-mono text-slate-300">
                Bitiş: {new Date(expiresAtMs).toLocaleDateString('tr-TR')}{' '}
                {new Date(expiresAtMs).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Aktiflik Süresi &amp; Cüzdan Çekim Koşulu
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cüzdandaki komisyonu çekebilmek için aktifliğiniz olmalı ve süresi dolmamış olmalıdır. Her paket
              alımı <strong>{ACTIVITY_PERIOD_DAYS} günlük</strong> aktiflik kazandırır.
            </p>

            {/* Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span>
                  30 Günlük Süre Doluluk Oranı (%{progressPercent})
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isTimeExpired
                      ? 'bg-red-500'
                      : countdownDays < 5
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sağ: Canlı Geri Sayım Sayacı (Gün : Saat : Dakika : Saniye) + Aksiyon Butonları */}
          <div className="flex flex-col sm:flex-row xl:flex-col items-stretch sm:items-center xl:items-end justify-between gap-4 shrink-0">
            <div className="grid grid-cols-4 gap-2 text-center font-mono tabular-nums">
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 min-w-[68px]">
                <div className="text-2xl font-extrabold text-white">
                  {String(countdownDays).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">GÜN</div>
              </div>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 min-w-[68px]">
                <div className="text-2xl font-extrabold text-white">
                  {String(countdownHours).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">SAAT</div>
              </div>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 min-w-[68px]">
                <div className="text-2xl font-extrabold text-white">
                  {String(countdownMinutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">DAKİKA</div>
              </div>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-emerald-400/40 min-w-[68px]">
                <div className="text-2xl font-extrabold text-emerald-400">
                  {String(countdownSeconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-300">SANİYE</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSubTab('activity')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <Timer className="w-4 h-4" />
                <span>Aktiflik Süresi &amp; Bayi Ekleme Paneline Git</span>
              </button>
              {onRenewActivityPackage && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    onRenewActivityPackage(
                      member.user_id,
                      'PKG_MINI_DENEME'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>
                    +{activationThreshold.toLocaleString('tr-TR')} $ Aktiflik Paketi — Sipariş Sepetine Git
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSubTab('feedback')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                <span>Şikayet &amp; Öneri Bildir</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* MODÜL 5 Header & Active Member Selector + Sub-navigation */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-500">
              <span>MODÜL 5 · BAYİ BACK-OFFICE (ÜYE PANELİ)</span>
              <span aria-hidden="true">·</span>
              <span>REF KODU: {member.ref_code}</span>
              <span aria-hidden="true">·</span>
              <span>TEK HAT SIRA #{member.global_line_id}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {member.full_name} — Kişisel Back-Office & Cüzdan Yönetimi
            </h2>
            <p className="text-xs text-slate-600">
              Durum: {member.is_active ? 'Aktif Üye' : 'Pasif Üye'} ·{' '}
              {member.is_locked ? 'Hesap Kilitli' : 'Çekime Açık'} · 2FA:{' '}
              {member.two_factor?.enabled ? 'Etkin' : 'Devre Dışı'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAdminAuthenticated ? (
              <>
                <label className="text-xs font-medium text-slate-600">Görüntülenen Bayi:</label>
                <select
                  value={member.user_id}
                  onChange={(e) => onSelectMember(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {sortedMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      #{m.global_line_id} — {m.full_name} ({m.ref_code} · Kariyer Seviyesi {m.career_level})
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Aktif Bayi: #{member.global_line_id} {member.full_name} ({member.ref_code})
                </span>
              </div>
            )}
          </div>
        </div>

        <FixedUsdRateBanner />

        {/* 5-Card Dual Engine Wallet Strip: Çekilebilir Bakiye, Bekleyen Bakiye (14 Gün), Motor 1 Unilevel, Motor 2 Monoline, Seans Kredisi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-1 shadow-xs">
            <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Çekilebilir Net Bakiye</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-emerald-900">
              {getMemberRegionalUsdBalance(member).toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}{' '}
              <span className="text-sm font-normal text-emerald-700">USD</span>
            </div>
            <div className="text-[11px] text-emerald-800 font-mono tabular-nums">
              Toplam Çekilen: {member.wallets.total_withdrawn.toLocaleString('tr-TR')} $
            </div>
          </div>

          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-1 shadow-xs">
            <div className="text-xs text-amber-800 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Toplam Bekleyen Bakiye</span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">14 Gün</span>
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-amber-900">
              {getMemberRegionalPendingUsd(member).toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}{' '}
              <span className="text-sm font-normal text-amber-700">USD</span>
            </div>
            <div className="text-[11px] text-amber-800 font-medium">
              {getMemberRegionalPendingUsd(member) > 0 ? (
                isAdminAuthenticated ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onReleasePendingBalance(member.user_id)}
                    className="text-xs font-semibold text-slate-900 underline hover:text-emerald-700 cursor-pointer"
                  >
                    [Yönetici] Aktar →
                  </button>
                ) : (
                  '14 günlük cayma koruması devrede'
                )
              ) : (
                'Tüm hakedişler çekilebilir bakiyede'
              )}
            </div>
          </div>

          <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-xl space-y-1 shadow-xs">
            <div className="text-xs text-indigo-800 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Motor 1: Unilevel Ekip</span>
              <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold">%25</span>
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-indigo-900">
              {unilevelEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
              <span className="text-sm font-normal text-indigo-700">$</span>
            </div>
            <div className="text-[11px] text-indigo-700 font-mono">
              7 Derinlik Dikey Sponsor Ekip Kazancı
            </div>
          </div>

          <div className="p-4 bg-teal-50 border-2 border-teal-300 rounded-xl space-y-1 shadow-xs">
            <div className="text-xs text-teal-800 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Motor 2: Monoline Teşvik</span>
              <span className="text-[10px] bg-teal-200 text-teal-900 px-1.5 py-0.5 rounded font-mono font-bold">%5</span>
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-teal-900">
              {monolineIncentiveEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
              <span className="text-sm font-normal text-teal-700">$</span>
            </div>
            <div className="text-[11px] text-teal-700 font-mono">
              Küresel Kuyruk İlk 7 Üst Sıra Primi
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white border border-slate-700 rounded-xl space-y-1 shadow-xs">
            <div className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
              Kredi Havuzun &amp; Paket
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-white">
              {(member.session_credits ?? 64).toLocaleString('tr-TR')}{' '}
              <span className="text-xs font-semibold text-emerald-400">Kredi</span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono tabular-nums">
              Paket: {(member.highest_package_id && PACKAGES[member.highest_package_id]?.name) || 'Standart'} · Seviye {member.career_level}
            </div>
          </div>
        </div>

        {/* SEANS KREDİSİ & DANIŞAN PERAKENDE GELİR HESAPLAYICI */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 text-white border border-indigo-500/30 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-mono font-bold text-emerald-300">
                <span>SEANS KREDİSİ &amp; DANIŞAN GELİR HESAPLAYICI</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Mevcut Seans Kredilerinizin Perakende Danışan Değeri
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hesabınızdaki seans kredilerini danışanlarınıza seans başı{' '}
                <strong>{retailSessionFee} $</strong>&apos;den uyguladığınızda elde edeceğiniz
                doğrudan seans uygulama gelirini aşağıdan hesaplayabilirsiniz.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 font-mono tabular-nums">
              <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
                <div className="text-[10px] text-slate-300 uppercase">Mevcut Seans Krediniz</div>
                <div className="text-xl font-extrabold text-white">
                  {(member.session_credits ?? 64).toLocaleString('tr-TR')} Seans
                </div>
                <div className="text-[10px] text-emerald-300">
                  Aktif Kredi Havuzunuz
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-300 uppercase">
                  <span>Seans Başı Ücret</span>
                  <span className="text-amber-300 font-bold">{retailSessionFee} $</span>
                </div>
                <input
                  type="range"
                  min={250}
                  max={1500}
                  step={50}
                  value={retailSessionFee}
                  onChange={(e) => setRetailSessionFee(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="text-[10px] text-slate-300">
                  {(member.session_credits ?? 64).toLocaleString('tr-TR')} Seans × {retailSessionFee} $ ={' '}
                  <strong className="text-white">
                    {((member.session_credits ?? 64) * retailSessionFee).toLocaleString('tr-TR')} $
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 space-y-1">
                <div className="text-[10px] text-emerald-200 uppercase font-bold">
                  Tahmini Seans Geliriniz
                </div>
                <div className="text-xl font-extrabold text-emerald-300">
                  {((member.session_credits ?? 64) * retailSessionFee).toLocaleString(
                    'tr-TR'
                  )}{' '}
                  $
                </div>
                <div className="text-[10px] text-emerald-200">
                  Prim + Seans Toplam Değer:{' '}
                  <strong>
                    {(
                      member.wallets.total_earnings +
                      (member.session_credits ?? 64) * retailSessionFee
                    ).toLocaleString('tr-TR')}{' '}
                    $
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveRegionPanel(activeRegionPanel === 'DOMESTIC' ? null : 'DOMESTIC')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeRegionPanel === 'DOMESTIC'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              🇹🇷 Yurt İçi Panel ($)
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveRegionPanel(activeRegionPanel === 'INTERNATIONAL' ? null : 'INTERNATIONAL')
              }
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeRegionPanel === 'INTERNATIONAL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              🌍 Yurt Dışı Panel ($)
            </button>
          </div>
          {activeRegionPanel && (
            <DealerRegionalUsdPanel
              dealer={member}
              members={sortedMembers}
              commissionLogs={commissionLogs}
              region={activeRegionPanel}
              onCreateWithdrawal={onCreateWithdrawal}
            />
          )}
        </div>

        {/* Interactive Sub-Tabs for Module 5 */}
        <div className="hidden">
          <button
            type="button"
            onClick={() => setSubTab('wallet')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'wallet'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Cüzdan & Resmi Banka Çekimi (TR IBAN)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('activity')}
            className={`px-3.5 py-2 text-xs font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
              subTab === 'activity'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>
              2. Aktiflik Süresi Zamanlayıcısı & Paket Sistemi ({countdownDays}G {countdownHours}S)
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('referral')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'referral'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Referans Linki, Karekod (QR) & Sosyal Paylaşım
          </button>
          <button
            type="button"
            onClick={() => setSubTab('network')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'network'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Ağ Yapısı (Monoline & 7 Derinlik Unilevel)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('security')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'security'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            5. Profil, TR IBAN & 2FA Güvenlik
          </button>
          <button
            type="button"
            onClick={() => setSubTab('plaque')}
            className={`px-3.5 py-2 text-xs font-bold rounded-md transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
              subTab === 'plaque'
                ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-sm ring-2 ring-amber-400/50'
                : 'bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 text-amber-950 hover:from-amber-200 hover:to-yellow-200 border border-amber-300'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>6. Kariyer Tebrik Belgesi &amp; Plaketi (İndirilebilir)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('feedback')}
            className={`px-3.5 py-2 text-xs font-bold rounded-md transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
              subTab === 'feedback'
                ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-400/50'
                : 'bg-rose-50 text-rose-950 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
            <span>
              7. Şikayetler &amp; Öneriler
              {myFeedbackTickets.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-rose-900 shadow-2xs">
                  {myFeedbackTickets.length}
                </span>
              )}
            </span>
          </button>
          {!isAdminAuthenticated && (
            <button
              type="button"
              onClick={() => setSubTab('documents')}
              className={`px-3.5 py-2 text-xs font-bold rounded-md transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                subTab === 'documents'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>8. Dökümanlar</span>
            </button>
          )}
        </div>
      </section>

      {/* Büyük Tek Sayfa Modu: Geri Butonu & Başlık Çubuğu */}
      {subTab !== 'wallet' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl shadow-sm border border-slate-800 animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => onReturnToMenu ? onReturnToMenu() : setSubTab('wallet')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform" />
            <span>← Backoffice Ana Menüsüne Dön</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Büyük Tek Sayfa Paneli &bull; {member.full_name} ({member.career_title})</span>
          </div>
        </div>
      )}

      {/* SUB-TAB: AKTİFLİK SÜRESİ, PAKET ALIMI & YENİ BAYİ EKLEME */}
      {subTab === 'activity' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sol 6 Sütun: Paket alımıyla +30 gün süre birikimi */}
            <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xs">
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-emerald-700 font-bold">
                    30 GÜNLÜK SÜRE BİRİKİMİ
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Paket Alımı &amp; Süre Birikimi
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aktiflik paketi satın aldığınızda hesabınızın{' '}
                    <code className="font-mono">activity_expires_at</code> süresi otomatik olarak +
                    {ACTIVITY_PERIOD_DAYS} gün uzatılır ve seans kredileriniz yüklenir.
                  </p>
                </div>
                <Package className="w-8 h-8 text-emerald-600 shrink-0" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-slate-500">Hesap Aktiflik Durumu (is_active)</div>
                  <div
                    className={`text-sm font-bold font-mono ${
                      !isTimeExpired && member.is_active ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {!isTimeExpired && member.is_active
                      ? '✓ AKTİF (Süre Devam Ediyor)'
                      : '✗ PASİF / SÜRESİ DOLDU'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-slate-500">Aktiflik Süresi Bitişi (activity_expires_at)</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {new Date(expiresAtMs).toLocaleDateString('tr-TR')}{' '}
                    {new Date(expiresAtMs).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-slate-500">Aktiflik Etkisi</div>
                  <div className="text-sm font-bold font-mono text-emerald-700">
                    +{ACTIVITY_PERIOD_DAYS} Gün / Alım
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-bold">Paket Alımı = {ACTIVITY_PERIOD_DAYS} Günlük Aktiflik</div>
                <p className="text-emerald-800 leading-relaxed">
                  Aşağıdan paketinizi seçip <strong>Sipariş Sepeti &amp; Ödeme Sayfasında</strong> ödemenizi
                  tamamladığınızda ya da kendi Bayi Panelinizden kredi satın aldığınızda aktifliğiniz{' '}
                  <strong>+{ACTIVITY_PERIOD_DAYS} gün</strong> uzar. Aktifken yapılan alım, bu süreyi
                  mevcut bitiş tarihinden itibaren biriktirir.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Süre birikimi için paket seçiniz
                </label>
                <select
                  value={selectedActivityPkg}
                  onChange={(e) =>
                    setSelectedActivityPkg(e.target.value as Exclude<PackageId, 'CUSTOM'>)
                  }
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                >
                  {FREKANS_PACKAGES.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.code} — {pkg.defaultPrice.toLocaleString('tr-TR')} $ (+
                      {pkg.sessionCredits} Seans Kredisi · +{ACTIVITY_PERIOD_DAYS} Gün
                      Aktiflik)
                    </option>
                  ))}
                </select>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900">
                    Seçili Paket: {PACKAGES[selectedActivityPkg]?.name}
                  </div>
                  <div className="text-slate-700">
                    Tutar:{' '}
                    <strong>
                      {PACKAGES[selectedActivityPkg]?.defaultPrice.toLocaleString('tr-TR')} $
                    </strong>{' '}
                    · Yüklenecek Kredi:{' '}
                    <strong>+{PACKAGES[selectedActivityPkg]?.sessionCredits} Seans Kredisi</strong>{' '}
                    · Aktiflik Etkisi:{' '}
                    <strong>
                      Ödeme Sonrası +{ACTIVITY_PERIOD_DAYS} Gün Aktiflik Devreye Girer
                    </strong>
                  </div>
                </div>

                {onRenewActivityPackage && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onRenewActivityPackage(member.user_id, selectedActivityPkg)}
                    className="w-full py-3 px-4 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Zap className="w-4 h-4" />
                    <span>
                      Sipariş Sepetine Git &amp; Ödeme Yap ({PACKAGES[
                        selectedActivityPkg
                      ]?.defaultPrice.toLocaleString('tr-TR')} $)
                    </span>
                  </button>
                )}
              </div>
            </section>

            {/* Sağ 6 Sütun: Bayi Ekleme */}
            <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xs">
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Yeni Bayi Ekleme
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Alt ekibinize yeni bayi ekleyebilir veya kayıt portalı üzerinden kayıt oluşturabilirsiniz.
                  </p>
                </div>
                <UserPlus className="w-8 h-8 text-indigo-600 shrink-0" />
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs text-emerald-950">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">
                    🎁 İlk Bayi Kaydı Hoşgeldin Bonusu: Yeni bayiye bir defaya mahsus 32 + 32 = 64 Seans Kredisi otomatik tanımlanır!
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-bold shrink-0">
                    32+32 KREDİ
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900">
                  Kendi altınıza yeni bayi kaydı oluşturmak için aşağıdaki butona tıkladığınızda ana sayfadaki{' '}
                  <strong>Bayilik Başvurusu / Kayıt</strong> ekranına yönlendirilirsiniz ve sponsor/referans alanı otomatik olarak sizin adınıza (<strong>{member.full_name} — {member.ref_code}</strong>) kilitlenir.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">

                  <button
                    type="button"
                    onClick={() =>
                      redirectToDealerRegistrationPortal({
                        user_id: member.user_id,
                        full_name: member.full_name,
                        ref_code: member.ref_code,
                        email: member.email,
                        phone: member.phone,
                      })
                    }
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Kayıt Portalı Üzerinden Aç</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Bayi Aktiflik Hareket Geçmişi (SQL: activity_logs) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  Süre birikimi ve kontrol kayıtları
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {member.full_name} — Aktiflik, Süre Uzatma ve Çekim Kontrol Geçmişi (
                  {memberActivityLogs.length})
                </h3>
              </div>
            </div>

            {memberActivityLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Bu bayiye ait henüz ekstra aktiflik log kaydı bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-2">Log ID</th>
                      <th className="py-2 px-2">İşlem Tipi (action_type)</th>
                      <th className="py-2 px-2">Yeni Bitiş (new_expires_at)</th>
                      <th className="py-2 px-2">Açıklama</th>
                      <th className="py-2 pl-2 text-right">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {memberActivityLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2 pr-2 font-bold text-slate-900">#{log.id}</td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.action_type === 'PACKAGE_RENEWAL'
                                ? 'bg-emerald-50 text-emerald-800'
                                : log.action_type === 'WITHDRAWAL_BLOCKED_INACTIVE' ||
                                  log.action_type === 'CRON_EXPIRED_DEACTIVATED'
                                ? 'bg-red-50 text-red-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {log.action_type}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-700">
                          {log.new_expires_at
                            ? new Date(log.new_expires_at).toLocaleDateString('tr-TR')
                            : '-'}
                        </td>
                        <td className="py-2 px-2 font-sans text-slate-700">{log.description}</td>
                        <td className="py-2 pl-2 text-right text-slate-500">
                          {new Date(log.created_at).toLocaleTimeString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* SUB-TAB 1: CÜZDAN, PARA TRANSFERİ, KREDİ ALIŞVERİŞİ, YENİ BAYİ ÖDEMESİ & %20 VERGİ İADELİ NAKİT ÇEKİM */}
      {subTab === 'wallet' && (
        <div className="space-y-8">
          {/* CÜZDAN BAKİYESİ İLE PARA GÖNDERME, KREDİ/PAKET SATIN ALMA & YENİ BAYİ ÖDEMESİ PANELİ */}
          <section className="bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950 text-white border-2 border-emerald-500/40 rounded-2xl p-6 space-y-6 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/15 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold mb-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>BAYİ CÜZDAN HARCAMA, PARA TRANSFERİ &amp; KREDİ / YENİ BAYİ ÖDEME MERKEZİ</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Cüzdanınızdaki Kazanç ile Başka Bayilere Para Gönderin, Kredi Satın Alın veya Yeni Bayi Ödemesi Yapın
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Yalnızca çekilebilir cüzdan bakiyesiyle seans kredisi/paket alabilir veya yeni bayi kayıt paketini ödeyebilirsiniz. Bekleyen komisyon harcanamaz.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono">
                <div className="px-4 py-2.5 rounded-xl bg-white/10 border border-emerald-400/40 text-right">
                  <div className="text-[10px] text-emerald-300 uppercase">Çekilebilir Cüzdan</div>
                  <div className="text-lg font-extrabold text-white">
                    {getMemberRegionalUsdBalance(member).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    USD
                  </div>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-white/10 border border-amber-400/40 text-right">
                  <div className="text-[10px] text-amber-300 uppercase">
                    Bekleyen Komisyon · Kullanılamaz
                  </div>
                  <div className="text-lg font-extrabold text-amber-300">
                    {getMemberRegionalPendingUsd(member).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    USD
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Sekmeli Cüzdan İşlem Seçici */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 border border-white/10 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => {
                  setWalletActionTab('buy_credits');
                  setWalletOpsFeedback(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  walletActionTab === 'buy_credits'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>1. Cüzdanla Kredi Satın Al &amp; Alışveriş Yap</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWalletActionTab('p2p_send');
                  setWalletOpsFeedback(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  walletActionTab === 'p2p_send'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>2. Başka Bayiye Para / Paket Gönder (P2P Transfer)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWalletActionTab('register_subdealer');
                  setWalletOpsFeedback(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  walletActionTab === 'register_subdealer'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>3. Yeni Bayi Eklerken Cüzdandan Ödeme Yap</span>
              </button>
            </div>

            {walletOpsFeedback && (
              <div
                className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
                  walletOpsFeedback.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    : 'bg-red-500/25 border-red-400 text-red-200'
                }`}
              >
                <span>{walletOpsFeedback.text}</span>
                <button
                  type="button"
                  onClick={() => setWalletOpsFeedback(null)}
                  className="underline text-[11px] cursor-pointer shrink-0"
                >
                  Kapat
                </button>
              </div>
            )}

            {/* TAB 1: CÜZDAN BAKİYESİ İLE KREDİ SATIN ALMA & PAKET ALIŞVERİŞİ */}
            {walletActionTab === 'buy_credits' && (
              <form
                onSubmit={handleWalletBuyPackage}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white/5 border border-white/10 rounded-xl p-5"
              >
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-sm font-bold text-emerald-300">
                    🛒 Cüzdan Bakiyenizle Kredi / Paket Satın Alın (Anında Seans Kredisi Yüklenir)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FREKANS_PACKAGES.map((pkg) => {
                      const active = walletBuyPkgId === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setWalletBuyPkgId(pkg.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-500/20 border-emerald-400 text-white ring-2 ring-emerald-400/40'
                              : 'bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{pkg.name}</span>
                            <span className="text-emerald-300 font-mono">
                              +{pkg.sessionCredits} Kredi
                            </span>
                          </div>
                          <div className="text-lg font-extrabold font-mono text-white mt-1">
                            {pkg.defaultPrice.toLocaleString('tr-TR')} $
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{pkg.shortDescription || pkg.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-900/90 border border-white/15 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-xs font-mono">
                    <div className="text-slate-400 uppercase">Seçilen Paket &amp; Kredi Özeti</div>
                    <div className="flex justify-between py-1.5 border-b border-white/10">
                      <span className="text-slate-300">Paket:</span>
                      <strong className="text-white">{PACKAGES[walletBuyPkgId]?.name}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/10">
                      <span className="text-slate-300">Yüklenecek Seans Kredisi:</span>
                      <strong className="text-emerald-400">
                        {isActivationWalletBuy ? 'Yok (yalnızca aktiflik)' : `+${PACKAGES[walletBuyPkgId]?.sessionCredits} Seans Kredisi`}
                      </strong>
                    </div>
                    <div className="py-2 border-b border-white/10">
                    <label className="block text-slate-300 mb-1">İşlem Türü</label>
                    <select
                      value={walletBuyOrderType}
                      onChange={(event) => setWalletBuyOrderType(event.target.value as 'ACTIVITY_RENEWAL' | 'STANDARD_ORDER' | 'ACTIVATION')}
                      className="w-full rounded-lg bg-slate-800 border border-white/20 px-2 py-1.5 text-white"
                    >
                      <option value="STANDARD_ORDER">Paket / seans kredisi alımı</option>
                      <option value="ACTIVITY_RENEWAL">Paket alımı (+30 gün süre)</option>
                      <option value="ACTIVATION">Sabit süre uzatma ({activationWalletPrice.toLocaleString('tr-TR')} $)</option>
                    </select>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/10">
                      <span className="text-slate-300">Cüzdandan Düşülecek Tutar:</span>
                      <strong className="text-amber-300 text-sm">
                        {(isActivationWalletBuy ? activationWalletPrice : PACKAGES[walletBuyPkgId]?.defaultPrice ?? 0).toLocaleString('tr-TR')} $
                      </strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/10">
                      <span className="text-slate-300">Çekilebilir cüzdan bakiyeniz:</span>
                      <strong className="text-emerald-300">{getMemberRegionalUsdBalance(member).toFixed(2)} USD</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-300">Mevcut Seans Krediniz:</span>
                      <strong className="text-white">
                        {member.session_credits} →{' '}
                        {member.session_credits + (isActivationWalletBuy ? 0 : PACKAGES[walletBuyPkgId]?.sessionCredits || 0)}{' '}
                        Seans
                      </strong>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={walletTermsAccepted}
                      onChange={(event) => setWalletTermsAccepted(event.target.checked)}
                      className="mt-0.5 accent-emerald-500"
                    />
                    Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi, KVKK ve Bayilik şartlarını okudum, onaylıyorum.
                  </label>
                  <button
                    type="submit"
                    disabled={walletOpsBusy || !walletTermsAccepted}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {walletOpsBusy
                      ? 'İşleniyor...'
                      : isActivationWalletBuy
                        ? `💳 Cüzdan Bakiyemle Öde (${activationWalletPrice.toLocaleString('tr-TR')} $) & Aktifliği Uzat`
                        : `💳 Cüzdan Bakiyemle Öde (${PACKAGES[
                          walletBuyPkgId
                        ]?.defaultPrice.toLocaleString('tr-TR')} $) & +${
                          PACKAGES[walletBuyPkgId]?.sessionCredits
                        } Krediyi Yükle`}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: BAŞKA BAYİLERE PARA VEYA PAKET GÖNDERME (P2P TRANSFER) */}
            {walletActionTab === 'p2p_send' && (
              <form
                onSubmit={handleWalletP2pTransfer}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white/5 border border-white/10 rounded-xl p-5"
              >
                <div className="lg:col-span-7 space-y-4 text-xs">
                  <div className="text-sm font-bold text-amber-300">
                    💸 Başka Bayiye Cüzdandan Para Gönder veya Paket Tanımla
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Para Gönderilecek Alıcı Bayi Seçin
                      </label>
                      <select
                        value={
                          walletP2pRecipientId ||
                          sortedMembers.find((m) => m.user_id !== member.user_id)?.user_id ||
                          ''
                        }
                        onChange={(e) => setWalletP2pRecipientId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white font-semibold"
                      >
                        {sortedMembers
                          .filter((m) => m.user_id !== member.user_id)
                          .map((m) => (
                            <option key={m.user_id} value={m.user_id}>
                              #{m.global_line_id} — {m.full_name} ({m.ref_code} · Kariyer Seviyesi {m.career_level})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Transfer Türü
                      </label>
                      <select
                        value={walletP2pMode}
                        onChange={(e) =>
                          setWalletP2pMode(
                            e.target.value as 'WALLET_TO_WALLET' | 'DIRECT_PACKAGE_ACTIVATION'
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white font-semibold"
                      >
                        <option value="WALLET_TO_WALLET">
                          Nakit Bakiye Transferi (Cüzdandan Cüzdana)
                        </option>
                        <option value="DIRECT_PACKAGE_ACTIVATION">
                          Alıcı Bayiye Doğrudan Paket &amp; Seans Kredisi Yükle
                        </option>
                      </select>
                    </div>
                  </div>

                  {walletP2pMode === 'WALLET_TO_WALLET' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Gönderilecek Tutar ($)
                        </label>
                        <input
                          type="number"
                          min={100}
                          step={50}
                          required
                          value={walletP2pAmount}
                          onChange={(e) => setWalletP2pAmount(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white font-mono text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Transfer Açıklaması / Not
                        </label>
                        <input
                          type="text"
                          value={walletP2pNote}
                          onChange={(e) => setWalletP2pNote(e.target.value)}
                          placeholder="Örn: Alt bayi destek transferi"
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Alıcı Bayiye Tanımlanacak Paket Seçin
                      </label>
                      <select
                        value={walletP2pPkgId}
                        onChange={(e) =>
                          setWalletP2pPkgId(e.target.value as Exclude<PackageId, 'CUSTOM'>)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white font-semibold"
                      >
                        {FREKANS_PACKAGES.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} — {pkg.defaultPrice.toLocaleString('tr-TR')} $ (+
                            {pkg.sessionCredits} Seans Kredisi)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 bg-slate-900/90 border border-white/15 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-xs font-mono">
                    <div className="text-slate-400 uppercase">P2P Bakiye Transfer Özeti</div>
                    <div className="flex justify-between py-1.5 border-b border-white/10">
                      <span className="text-slate-300">Gönderen Bayi:</span>
                      <strong className="text-white">{member.full_name}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/10">
                      <span className="text-slate-300">İşlem Tutarı:</span>
                      <strong className="text-amber-300 text-sm">
                        {(walletP2pMode === 'DIRECT_PACKAGE_ACTIVATION'
                          ? PACKAGES[walletP2pPkgId]?.defaultPrice || 5000
                          : walletP2pAmount
                        ).toLocaleString('tr-TR')}{' '}
                        $
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      Anında karşı bayinin cüzdanına (veya kredi havuzuna) komisyonsuz olarak aktarılır.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={walletOpsBusy}
                    className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {walletOpsBusy
                      ? 'Gönderiliyor...'
                      : '💸 Cüzdan Bakiyemden Seçili Bayiye Anında Gönder'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: YENİ BAYİ EKLERKEN CÜZDANDAN ÖDEME GERÇEKLEŞTİRME */}
            {walletActionTab === 'register_subdealer' && (
              <form
                onSubmit={handleWalletRegisterSubDealer}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white/5 border border-white/10 rounded-xl p-5"
              >
                <div className="lg:col-span-7 space-y-3 text-xs">
                  <div className="text-sm font-bold text-indigo-300">
                    👤 Yeni Alt Bayi Eklerken Paket Ödemesini Kendi Cüzdanınızdan Yapın
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Yeni Bayi Ad Soyad *
                      </label>
                      <input
                        type="text"
                        required
                        value={walletSubDealerName}
                        onChange={(e) => setWalletSubDealerName(e.target.value)}
                        placeholder="Örn: Uzm. Elif Demir"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Şehir</label>
                      <input
                        type="text"
                        value={walletSubDealerCity}
                        onChange={(e) => setWalletSubDealerCity(e.target.value)}
                        placeholder="İstanbul"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        E-Posta Adresi
                      </label>
                      <input
                        type="email"
                        value={walletSubDealerEmail}
                        onChange={(e) => setWalletSubDealerEmail(e.target.value)}
                        placeholder="yeni.bayi@frekans.com"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Telefon</label>
                      <input
                        type="text"
                        value={walletSubDealerPhone}
                        onChange={(e) => setWalletSubDealerPhone(e.target.value)}
                        placeholder="0532 000 00 00"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Yeni Bayi Giriş Şifresi Belirle *</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const rand = 'Bayi' + Math.floor(100000 + Math.random() * 900000) + '!';
                            setWalletSubDealerPassword(rand);
                          }}
                          className="text-[10px] text-indigo-300 hover:text-indigo-200 underline cursor-pointer"
                        >
                          Rastgele Şifre Üret
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showWalletSubDealerPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={walletSubDealerPassword}
                          onChange={(e) => setWalletSubDealerPassword(e.target.value)}
                          placeholder="En az 8 karakter"
                          className="w-full pl-3 pr-9 py-2 rounded-lg bg-slate-900 border border-white/20 text-white font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowWalletSubDealerPassword(!showWalletSubDealerPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                          title={showWalletSubDealerPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                        >
                          {showWalletSubDealerPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">
                        Yeni Bayinin Başlangıç Paketi (Ödemesi Sizin Cüzdanınızdan Düşülür)
                      </label>
                      <select
                        value={walletSubDealerPkgId}
                        onChange={(e) =>
                          setWalletSubDealerPkgId(e.target.value as Exclude<PackageId, 'CUSTOM'>)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white font-semibold"
                      >
                        {FREKANS_PACKAGES.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} — {pkg.defaultPrice.toLocaleString('tr-TR')} $ (Yeni Bayiye +
                            {pkg.sessionCredits} Seans Kredisi + 32+32 Hoşgeldin Kredisi)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold flex items-center gap-1">
                          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Kol Yerleşimi (Sol Kol / Sağ Kol Tercihi) *</span>
                        </label>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-blue-300">Sol: {members.filter((m) => m.sponsor_id === member.user_id && (m as any).assigned_leg === 'LEFT').length}</span>
                          <span className="text-purple-300">Sağ: {members.filter((m) => m.sponsor_id === member.user_id && (m as any).assigned_leg === 'RIGHT').length}</span>
                        </div>
                      </div>
                      <select
                        value={walletSubDealerLeg}
                        onChange={(e) => setWalletSubDealerLeg(e.target.value as 'LEFT' | 'RIGHT' | 'AUTO')}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white font-medium text-xs"
                      >
                        <option value="AUTO">⚖️ Otomatik / Dengeli Dağıtım (Önerilen - %50 Kol Kuralı)</option>
                        <option value="LEFT">⬅️ Sol Kol (Sol Bacak / Left Leg)</option>
                        <option value="RIGHT">➡️ Sağ Kol (Sağ Bacak / Right Leg)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-900/90 border border-white/15 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-xs font-mono">
                    <div className="text-slate-400 uppercase">Cüzdandan Yeni Bayi Kayıt Özeti</div>
                    <div className="flex justify-between py-1.5 border-b border-white/10">
                      <span className="text-slate-300">Direkt Sponsor:</span>
                      <strong className="text-white">{member.full_name} (Siz)</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/10">
                      <span className="text-slate-300">Yerleştirilecek Kol:</span>
                      <strong className="text-white font-semibold">
                        {walletSubDealerLeg === 'LEFT' ? '⬅️ Sol Kol' : walletSubDealerLeg === 'RIGHT' ? '➡️ Sağ Kol' : '⚖️ Otomatik Dengeli'}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/10">
                      <span className="text-slate-300">Cüzdanınızdan Ödenecek:</span>
                      <strong className="text-amber-300 text-sm">
                        {PACKAGES[walletSubDealerPkgId]?.defaultPrice.toLocaleString('tr-TR')} $
                      </strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/10">
                      <span className="text-slate-300">Size Dönecek %20 Sponsor Primi:</span>
                      <strong className="text-emerald-400">
                        +
                        {Math.round(
                          (PACKAGES[walletSubDealerPkgId]?.defaultPrice || 5000) * 0.2
                        ).toLocaleString('tr-TR')}{' '}
                        $
                      </strong>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={walletSubDealerTermsAccepted}
                      onChange={(event) => setWalletSubDealerTermsAccepted(event.target.checked)}
                      className="mt-0.5 accent-indigo-500"
                    />
                    Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi, KVKK ve Bayilik şartlarını okudum, onaylıyorum.
                  </label>
                  <button
                    type="submit"
                    disabled={walletOpsBusy || !walletSubDealerTermsAccepted}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {walletOpsBusy
                      ? 'Kaydediliyor...'
                      : `👤 Cüzdanımdan Öde (${PACKAGES[
                          walletSubDealerPkgId
                        ]?.defaultPrice.toLocaleString('tr-TR')} $) & Yeni Bayiyi Ekle`}
                  </button>
                </div>
              </form>
            )}
          </section>

          {walletTransactions.some((entry) => entry.external_user_id === member.user_id) && (
            <section className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Son Cüzdan İşlemleri</h3>
              <div className="divide-y divide-white/10">
                {walletTransactions
                  .filter((entry) => entry.external_user_id === member.user_id)
                  .slice(0, 10)
                  .map((entry) => (
                    <div key={entry.transaction_id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs">
                      <div>
                        <div className="font-semibold text-slate-100">{entry.description}</div>
                        <div className="text-[10px] text-slate-400">{entry.transaction_type} · {new Date(entry.created_at).toLocaleString('tr-TR')} · {entry.order_id}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-rose-300">−{entry.amount.toLocaleString('en-US')} USD</div>
                        <div className="text-slate-400">Kalan: {(entry.balance_after ?? 0).toLocaleString('en-US')} USD</div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="border-b border-slate-200 pb-4">
              <div className="text-xs font-mono text-emerald-700 font-bold">
                SQL: withdrawal_requests · %20 VERGİ KESİNTİSİ &amp; FATURA İLE %20 VERGİ İADESİ
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Resmi Banka Hesabına (TR IBAN) Komisyon Çekim &amp; %20 Vergi İadesi Talebi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nakit çekim talebi oluşturulduğunda <strong>%20 vergi kesilerek Sistem Fonuna</strong> aktarılır. Vergi iadesini (<strong>%20</strong>) isteyen bayiler fatura keserek bu ekrandan cihazdan yükler; yönetici onayladığında %20 tutar hesaplarına aktarılır.
              </p>
            </div>

            {withdrawComplianceError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium">
                {withdrawComplianceError}
              </div>
            )}

            <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Tekil Resmi Ödeme Kanalı: TR IBAN (Havale / EFT)</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-950 font-mono text-[10px] font-bold">
                  İsim Eşleşmesi Zorunlu
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-medium text-slate-700">Brüt Çekim Tutarı (USD)</label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(getMemberRegionalUsdBalance(member))}
                    className="font-mono text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    Tümünü Seç ({getMemberRegionalUsdBalance(member).toFixed(2)} USD)
                  </button>
                </div>
                <input
                  type="number"
                  min={50}
                  step="0.01"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* %20 VERGİ KESİNTİSİ (SİSTEM FONU) VE NET ÖDEME HESAPLAMA TABLOSU */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Talep Edilen Brüt Çekim:</span>
                  <strong className="text-white">
                    {withdrawAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </strong>
                </div>
                <div className="flex items-center justify-between text-amber-300">
                  <span>%20 Vergi Kesintisi (Sistem Fonuna Aktarılır):</span>
                  <strong>
                    -{(withdrawAmount * 0.2).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/15 text-emerald-300 text-sm">
                  <span>Bankaya Yatacak Net Tutar (%80):</span>
                  <strong className="font-extrabold">
                    {(withdrawAmount * 0.8).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </strong>
                </div>
              </div>

              {/* %20 VERGİ İADESİ TALEBİ & CİHAZDAN FATURA YÜKLEME ALANI */}
              <div className="p-4 rounded-xl bg-teal-50/80 border-2 border-teal-300 space-y-3 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantsTaxRefund}
                    onChange={(e) => setWantsTaxRefund(e.target.checked)}
                    className="mt-0.5 rounded border-teal-500 text-teal-700"
                  />
                  <div>
                    <div className="font-extrabold text-teal-950">
                      🧾 %20 Vergi İadesi İstiyorum (+
                      {(withdrawAmount * 0.2).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                      USD İade İçin Fatura Yükle)
                    </div>
                    <p className="text-[11px] text-teal-800 mt-0.5">
                      Fatura keserek cihazınızdan yüklediğinizde faturanız Yönetici Vergi İadesi Panelinde görünür ve onaylandığında kesilen %20 vergi tutarı hesabınıza geri aktarılır.
                    </p>
                  </div>
                </label>

                {wantsTaxRefund && (
                  <div className="space-y-3 pt-2 border-t border-teal-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-teal-950 mb-1">
                          Fatura Numarası
                        </label>
                        <input
                          type="text"
                          value={invoiceNo}
                          onChange={(e) => setInvoiceNo(e.target.value)}
                          placeholder="Örn: GIB2026000001250"
                          className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg font-mono text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-teal-950 mb-1">
                          Vergi Dairesi &amp; VKN / TCKN
                        </label>
                        <input
                          type="text"
                          value={taxOfficeAndId}
                          onChange={(e) => setTaxOfficeAndId(e.target.value)}
                          placeholder="Örn: Kadıköy V.D. / 1234567890"
                          className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-teal-950 mb-1">
                        Cihazdan Fatura Dosyası Yükle (PDF, PNG, JPG) *
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.svg"
                        onChange={handleInvoiceFileSelect}
                        className="w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-700 file:text-white hover:file:bg-teal-800 cursor-pointer bg-white border border-teal-300 rounded-lg p-1.5"
                      />
                      {invoiceFileName && (
                        <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-semibold flex items-center justify-between">
                          <span>
                            ✓ Yüklenecek Fatura: <strong>{invoiceFileName}</strong> (
                            {Math.max(1, Math.round(invoiceFileSize / 1024))} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setInvoiceFileName('');
                              setInvoiceDataUrl('');
                            }}
                            className="text-red-700 underline text-[10px] cursor-pointer"
                          >
                            Kaldır
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    IBAN Hesap Sahibi Adı Soyadı (Kayıtlı Adınızla Aynı Olmalıdır)
                  </label>
                  <input
                    type="text"
                    required
                    value={customIbanHolder}
                    onChange={(e) => {
                      setCustomIbanHolder(e.target.value);
                      setWithdrawComplianceError(null);
                    }}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                  />
                  <div className="text-[10px] text-emerald-700 mt-1 font-medium">
                    ✓ Sistemde Kayıtlı Ad Soyad: <strong>{member.full_name}</strong> (Başkasının IBAN&apos;ına ödeme yapılmaz)
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Banka Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={customBankName || member.bank_details?.bank_name || ''}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    TR IBAN Numarası
                  </label>
                  <input
                    type="text"
                    required
                    value={customIban || member.bank_details?.iban || ''}
                    onChange={(e) => setCustomIban(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Aktiflik süresi & yeni bayi ekleme koşulları */}
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  isWithdrawalEligible
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    {isWithdrawalEligible ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>Çekim Aktiflik Kontrolü</span>
                  </span>
                  <span className="font-mono text-[11px]">
                    {isWithdrawalEligible ? 'ÇEKİME UYGUN' : 'ŞART BEKLENİYOR'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-white/80 rounded border border-slate-200/80">
                    <div>Aktiflik Süresi:</div>
                    <strong className={isTimeExpired ? 'text-red-700' : 'text-emerald-700'}>
                      {isTimeExpired ? 'Süresi Doldu / Pasif' : `✓ Aktif (${countdownDays}G ${countdownHours}S)`}
                    </strong>
                  </div>
                </div>

                {!isWithdrawalEligible && (
                  <button
                    type="button"
                    onClick={() => setSubTab('activity')}
                    className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
Paket Alarak Aktifliği Yenile →
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || getMemberRegionalUsdBalance(member) < 50 || member.is_locked}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {member.is_locked
                  ? 'Hesap Kilitli (Çekim Yapılamaz)'
                  : `${withdrawAmount.toLocaleString('en-US')} USD Çekim Talebi Gönder`}
              </button>
            </form>
          </section>

          {/* Member's Withdrawal History & Recent Commission Logs */}
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bayi Çekim Talepleri Geçmişi ({memberWithdrawals.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Resmi Banka TR IBAN çekim taleplerinizin onay durumları.
                  </p>
                </div>
              </div>

              {memberWithdrawals.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
                  Bu üyeye ait henüz nakit çekim talebi bulunmamaktadır.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 pr-2">Talep ID</th>
                        <th className="py-2 px-2">Hedef TR IBAN</th>
                        <th className="py-2 px-2 text-right">Brüt Tutar</th>
                        <th className="py-2 px-2 text-right">%20 Vergi (Fon)</th>
                        <th className="py-2 px-2 text-right">Net (%80)</th>
                        <th className="py-2 px-2">%20 Vergi İadesi &amp; Fatura</th>
                        <th className="py-2 pl-2 text-right">Çekim Durumu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                      {memberWithdrawals.map((w) => {
                        const gross = w.gross_amount ?? w.amount;
                        const tax = w.tax_deduction ?? Math.round(gross * 0.2 * 100) / 100;
                        const net = w.net_amount ?? Math.round((gross - tax) * 100) / 100;
                        return (
                          <tr key={w.id}>
                            <td className="py-2.5 pr-2 font-bold text-slate-900">#{w.id}</td>
                            <td className="py-2.5 px-2 font-sans">
                              <div className="font-semibold text-slate-900">{w.method}</div>
                              <div className="text-[11px] font-mono text-slate-500 truncate max-w-[170px]">
                                {w.method === 'IBAN'
                                  ? `${w.bank_details?.bank_name || 'Banka'} · ${w.bank_details?.iban || w.payout_address || '-'}`
                                  : (w.bank_details?.trc20_address || w.payout_address || '-')}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-700">
                              {gross.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                            </td>
                            <td className="py-2.5 px-2 text-right font-bold text-rose-700">
                              -{tax.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                            </td>
                            <td className="py-2.5 px-2 text-right font-extrabold text-emerald-800">
                              {net.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                            </td>
                            <td className="py-2.5 px-2 font-sans text-[11px]">
                              {w.tax_refund_status === 'APPROVED_CREDITED' && (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                                  ✓ +{tax.toLocaleString('en-US')} USD İade Edildi
                                </span>
                              )}
                              {w.tax_refund_status === 'PENDING_ADMIN_APPROVAL' && (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                                  ⏳ Fatura Onayda ({w.invoice_no || 'Yüklendi'})
                                </span>
                              )}
                              {(!w.tax_refund_status ||
                                w.tax_refund_status === 'NONE' ||
                                w.tax_refund_status === 'REJECTED') && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedWithdrawalIdForInvoice(String(w.id))}
                                  className="px-2 py-0.5 rounded bg-teal-100 hover:bg-teal-200 text-teal-950 font-bold cursor-pointer"
                                >
                                  📄 Fatura Yükle (+{tax.toLocaleString('en-US')} USD)
                                </button>
                              )}
                            </td>
                            <td className="py-2.5 pl-2 text-right font-sans font-semibold">
                              {w.status === 'APPROVED' && (
                                <span className="text-emerald-700">✓ ONAYLANDI</span>
                              )}
                              {w.status === 'PENDING' && (
                                <span className="text-amber-700">⏳ BEKLİYOR</span>
                              )}
                              {w.status === 'REJECTED' && (
                                <span className="text-red-700">✗ REDDEDİLDİ</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* MEVCUT ÇEKİM TALEBİ İÇİN SONRADAN CİHAZDAN FATURA YÜKLEME KUTUSU */}
              <form
                onSubmit={handleStandaloneInvoiceUpload}
                className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-3 text-xs"
              >
                <div className="font-bold text-teal-950 flex items-center justify-between">
                  <span>
                    📄 Kesilen %20 Vergiyi Geri Almak İçin Cihazdan Fatura Yükle (Yönetici Onayına Gönder)
                  </span>
                  {selectedWithdrawalIdForInvoice && (
                    <span className="px-2 py-0.5 rounded bg-teal-200 text-teal-950 font-mono text-[10px]">
                      Seçili Çekim: #{selectedWithdrawalIdForInvoice}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="Fatura No (GIB2026...)"
                    className="px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={taxOfficeAndId}
                    onChange={(e) => setTaxOfficeAndId(e.target.value)}
                    placeholder="Vergi Dairesi / VKN-TCKN"
                    className="px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs"
                  />
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.svg"
                    onChange={handleInvoiceFileSelect}
                    className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-bold file:bg-teal-700 file:text-white bg-white border border-teal-300 rounded-lg p-1"
                  />
                </div>
                {invoiceUploadFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 font-semibold">
                    {invoiceUploadFeedback}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={invoiceUploadBusy}
                  className="w-full py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                >
                  {invoiceUploadBusy
                    ? 'Fatura Yükleniyor...'
                    : '🧾 Seçilen Faturayı Cihazdan Yükle & %20 Vergi İadesi Talep Et'}
                </button>
              </form>
            </div>

            {/* Member's Incoming Commission Logs (SQL: commission_logs) */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Cüzdana Yansıyan Son Komisyon Hareketleri ({memberCommissionLogs.length})
                </h3>
                <p className="text-xs text-slate-500">
                  SQL <code className="font-mono">commission_logs</code> tablosundan bu üyeye gelen
                  SPONSOR, MONOLINE_DEPTH ve CAREER_POOL kayıtları.
                </p>
              </div>

              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-2">Log ID</th>
                      <th className="py-2 px-2">Sipariş</th>
                      <th className="py-2 px-2">Kaynak Üye</th>
                      <th className="py-2 px-2">Motor &amp; Hat</th>
                      <th className="py-2 px-2">Komisyon Tipi &amp; Derinlik</th>
                      <th className="py-2 pl-2 text-right">Kazanç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {memberCommissionLogs.slice(0, 30).map((log) => (
                      <tr key={log.id}>
                        <td className="py-2 pr-2 text-slate-500">#{log.id}</td>
                        <td className="py-2 px-2 text-slate-900 font-semibold">{log.order_id}</td>
                        <td className="py-2 px-2 font-sans text-slate-700">
                          {log.source_user_name}
                        </td>
                        <td className="py-2 px-2 font-sans">
                          {log.commission_type === 'UNILEVEL_COMMISSION' && (
                            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px]">
                              MOTOR 1 · Sponsor Ağacı
                            </span>
                          )}
                          {log.commission_type === 'MONOLINE_INCENTIVE' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
                              MOTOR 2 · Küresel Kuyruk
                            </span>
                          )}
                          {log.commission_type === 'SPONSOR' && (
                            <span className="px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold text-[10px]">
                              DİREKT SPONSOR
                            </span>
                          )}
                          {!['UNILEVEL_COMMISSION', 'MONOLINE_INCENTIVE', 'SPONSOR'].includes(log.commission_type) && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                              DİĞER / HAVUZ
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 font-sans">
                          {log.commission_type === 'UNILEVEL_COMMISSION' && (
                            <span className="text-indigo-800 font-semibold">
                              Unilevel {log.depth_level}. Derinlik Primi (Ekip Cirosu)
                            </span>
                          )}
                          {log.commission_type === 'MONOLINE_INCENTIVE' && (
                            <span className="text-emerald-800 font-semibold">
                              Monoline {log.depth_level}. Sıra Teşvik Primi
                            </span>
                          )}
                          {log.commission_type === 'SPONSOR' && (
                            <span className="text-emerald-700 font-medium">
                              Direkt Sponsor Satış Primi (%20)
                            </span>
                          )}
                          {log.commission_type === 'FAST_ROI_BONUS' && (
                            <span className="text-teal-700 font-bold">
                              3 Getir Bedavaya Getir (+%15 Fast-ROI)
                            </span>
                          )}
                          {log.commission_type === 'MONOLINE_DEPTH' && (
                            <span className="text-amber-800 font-medium">
                              Monoline {log.depth_level}. Üst Derinlik
                            </span>
                          )}
                          {log.commission_type === 'UNILEVEL_INFINITY' && (
                            <span className="text-indigo-700 font-bold">
                              Unilevel Sonsuzluk Fark Primi ({log.depth_level}. Nesil)
                            </span>
                          )}
                          {log.commission_type === 'MATCHING_BONUS' && (
                            <span className="text-purple-700 font-bold">
                              Liderlik Eşleşme Bonusu (Matching)
                            </span>
                          )}
                          {log.commission_type === 'CAREER_POOL' && (
                            <span className="text-slate-900 font-medium">
                              Kariyer Fonu ({log.depth_level}. Mertebe)
                            </span>
                          )}
                        </td>
                        <td className="py-2 pl-2 text-right font-bold text-emerald-700">
                          +{log.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REFERANS & PAZARLAMA ARAÇLARI ( DAVET LİNKİ, STATİK/DİNAMİK QR, SOSYAL MEDYA ) */}
      {subTab === 'referral' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <div className="text-xs font-mono text-slate-500">
                REFERANS & DİJİTAL PAZARLAMA MERKEZİ
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Kişiselleştirilmiş Davet Bağlantısı & Sosyal Medya Paylaşımı
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bu bağlantı üzerinden kaydolan her üye doğrudan sizin sponsor ekibinize (
                <strong>%20 Direkt Sponsor Primi</strong>) bağlanır ve Global Tek Hatta en son sıraya
                yerleşir.
              </p>
            </div>

            {/* Static vs Dynamic Generator Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Link & Karekod Üretim Modu:
                </label>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setQrMode('STATIC')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                      qrMode === 'STATIC' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Statik Referans Linki
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrMode('DYNAMIC')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                      qrMode === 'DYNAMIC' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Dinamik Paket / Kampanya QR
                  </button>
                </div>
              </div>

              {qrMode === 'DYNAMIC' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ön Seçili Başlangıç Paketi
                    </label>
                    <select
                      value={qrPackage}
                      onChange={(e) =>
                        setQrPackage(e.target.value as Exclude<PackageId, 'CUSTOM'>)
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      {Object.values(PACKAGES).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} ({p.defaultPrice.toLocaleString('tr-TR')} $)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Kampanya Takip Etiketi (UTM)
                    </label>
                    <input
                      type="text"
                      value={qrCampaign}
                      onChange={(e) => setQrCampaign(e.target.value)}
                      placeholder="Örn: INSTAGRAM_BIO"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Referral Link Copy Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">
                  Kişisel Davet Bağlantınız ({member.ref_code}):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleCopyRefLink}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Linki Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Social Media 1-Click Share Buttons */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-800">
                Sosyal Medya Tek Tıkla Paylaşım Butonları
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialShare('WHATSAPP')}
                  className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  WhatsApp'ta Paylaş
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialShare('TELEGRAM')}
                  className="py-2.5 px-3 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Telegram'da Paylaş
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialShare('INSTAGRAM')}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Instagram Hikaye / Bio
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialShare('FACEBOOK')}
                  className="py-2.5 px-3 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Facebook'ta Paylaş
                </button>
              </div>

              {shareFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  {shareFeedback}
                </div>
              )}
            </div>
          </section>

          {/* Right 5 cols: SVG Static/Dynamic QR Code Generator */}
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-slate-500">
                {qrMode === 'STATIC' ? 'STATİK KAREKOD (QR)' : 'DİNAMİK KAMPANYA KAREKODU (QR)'}
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {member.full_name} ({member.ref_code})
              </h4>
            </div>

            <div className="p-4 bg-white border-2 border-slate-900 rounded-xl shadow-xs">
              <svg
                viewBox="0 0 25 25"
                className="w-48 h-48 mx-auto"
                role="img"
                aria-label={`QR Code for ${referralUrl}`}
              >
                <rect width="25" height="25" fill="#ffffff" />
                {qrMatrix.map((row, rIdx) =>
                  row.map((cell, cIdx) =>
                    cell ? (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx + 2}
                        y={rIdx + 2}
                        width={1}
                        height={1}
                        fill="#0f172a"
                      />
                    ) : null
                  )
                )}
              </svg>
            </div>

            <div className="text-xs font-mono text-slate-500 break-all max-w-xs">
              {referralUrl}
            </div>

            <button
              type="button"
              onClick={handleDownloadQrSvg}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Karekodu İndir (.SVG)</span>
            </button>
          </section>
        </div>
      )}

      {/* SUB-TAB 3: AĞ YAPISI İZLEME (MONOLINE TEK HAT ALT BAYİ AĞACI & 7 DERİNLİK SPONSOR AĞACI) */}
      {subTab === 'network' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>İzole Sponsorluk &amp; Monoline Tek Hat Ağaç Yapısı</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Alt Bayi Ağaç Yapısı: Monoline Tek Hat Ağacı &amp; 7 Derinlik Sponsor Ekibi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Her bayi kendi kaydettiği bayinin sponsorudur. Bu ekranda sadece kendinizden sonraki
                alt bayilerinizi Monoline tek hat ağaç yapısında görürsünüz; üst sponsorların diğer
                bayileri gizlenmiştir.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start">
              <button
                type="button"
                onClick={() => {
                  setShowNetworkAddModal(false);
                  redirectToDealerRegistrationPortal({
                    user_id: member.user_id,
                    full_name: member.full_name,
                    ref_code: member.ref_code,
                    email: member.email,
                    phone: member.phone,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Alt Ekibe Yeni Bayi Ekle (Şifreli)</span>
              </button>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setNetworkViewMode('TREE')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md cursor-pointer flex items-center gap-1.5 transition-colors ${
                    networkViewMode === 'TREE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>İnteraktif Unilevel Ağaç</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkViewMode('MONOLINE')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                    networkViewMode === 'MONOLINE'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Monoline Tek Hat ({dealerDownlineTree.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkViewMode('UNILEVEL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                    networkViewMode === 'UNILEVEL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  7 Derinlik Kademeleri
                </button>
              </div>
            </div>
          </div>

          {/* ALT EKİP YENİ BAYİ EKLEME PANELİ (ŞİFRE BELİRLEME DESTEKLİ) */}
          {showNetworkAddModal && (
            <form
              onSubmit={handleAddSubDealerForActivity}
              className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-2 border-emerald-500/50 rounded-2xl text-white space-y-4 shadow-lg animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {member.full_name} Alt Ekibine Yeni Bayi Ekle (Giriş Şifresi Belirleyerek)
                    </h4>
                    <p className="text-[11px] text-emerald-300">
                      Yeni bayi direkt sizin alt ekibinize (#{dealerDownlineTree.length + 1}) kaydedilir ve belirlenen şifre ile sisteme giriş yapabilir.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNetworkAddModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Yeni Bayi Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubDealerName}
                    onChange={(e) => setNewSubDealerName(e.target.value)}
                    placeholder="Örn: Dr. Aylin Güneş"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/20 text-white font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Giriş Şifresi Belirle *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const rand = 'Aura' + Math.floor(100000 + Math.random() * 900000) + '!';
                        setNewSubDealerPassword(rand);
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      Rastgele Şifre
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewSubDealerPassword ? 'text' : 'password'}
                      required
                      value={newSubDealerPassword}
                      onChange={(e) => setNewSubDealerPassword(e.target.value)}
                      placeholder="Şifre belirleyin (Varsayılan: 123456)"
                      className="w-full pl-3 pr-8 py-2 rounded-lg bg-slate-900/90 border border-white/20 text-white font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewSubDealerPassword(!showNewSubDealerPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                      title={showNewSubDealerPassword ? 'Gizle' : 'Göster'}
                    >
                      {showNewSubDealerPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Telefon Numarası
                  </label>
                  <input
                    type="text"
                    value={newSubDealerPhone}
                    onChange={(e) => setNewSubDealerPhone(e.target.value)}
                    placeholder="0532 000 00 00"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/20 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    value={newSubDealerEmail}
                    onChange={(e) => setNewSubDealerEmail(e.target.value)}
                    placeholder="bayi@aurabio.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/20 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Şehir</label>
                  <input
                    type="text"
                    value={newSubDealerCity}
                    onChange={(e) => setNewSubDealerCity(e.target.value)}
                    placeholder="İstanbul"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/20 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Başlangıç Bayilik Paketi
                  </label>
                  <select
                    value={newSubDealerPkg}
                    onChange={(e) =>
                      setNewSubDealerPkg(e.target.value as Exclude<PackageId, 'CUSTOM'>)
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/20 text-white font-semibold"
                  >
                    {FREKANS_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — {pkg.defaultPrice.toLocaleString('tr-TR')} $ ({pkg.sessionCredits} Kredi)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kol Yerleşimi (Sol Kol / Sağ Kol / Otomatik) */}
                <div className="sm:col-span-2 lg:col-span-3 bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                      <GitBranch className="w-4 h-4 text-emerald-400" />
                      <span>Organizasyon Kol Seçimi (Sol Kol / Sağ Kol Yerleşimi) *</span>
                    </label>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        Sol Kol: {members.filter((m) => m.sponsor_id === member.user_id && (m as any).assigned_leg === 'LEFT').length} Bayi
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                        Sağ Kol: {members.filter((m) => m.sponsor_id === member.user_id && (m as any).assigned_leg === 'RIGHT').length} Bayi
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewSubDealerLeg('AUTO')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        newSubDealerLeg === 'AUTO'
                          ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-xs'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Otomatik Dengeleyici</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">
                        Sistem zayıf kola otomatik yönlendirir (%50 Kuralı)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewSubDealerLeg('LEFT')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        newSubDealerLeg === 'LEFT'
                          ? 'bg-blue-600/30 border-blue-400 text-white shadow-xs'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span>⬅️ Sol Kola Yerleştir</span>
                      </div>
                      <div className="text-[10px] text-blue-200 mt-0.5">
                        Yeni bayi doğrudan Sol Kol hattınıza bağlanır
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewSubDealerLeg('RIGHT')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        newSubDealerLeg === 'RIGHT'
                          ? 'bg-purple-600/30 border-purple-400 text-white shadow-xs'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        <span>➡️ Sağ Kola Yerleştir</span>
                      </div>
                      <div className="text-[10px] text-purple-200 mt-0.5">
                        Yeni bayi doğrudan Sağ Kol hattınıza bağlanır
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNetworkAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newSubDealerName.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Bayiyi Alt Ekibe Ekle &amp; Şifresini Tanımla</span>
                </button>
              </div>
            </form>
          )}

          {networkViewMode === 'TREE' ? (
            <div className="pt-2">
              <UnilevelOrganizationTreePanel
                mode="dealer"
                currentDealerId={member.user_id}
                embedded={true}
                onBack={() => setSubTab('wallet')}
              />
            </div>
          ) : networkViewMode === 'UNILEVEL' ? (
            <div className="space-y-4">
              {unilevelLevels.map((lvl) => (
                <div
                  key={lvl.depth}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {lvl.depth}. DERİNLİK SPONSOR EKİBİ
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {lvl.members.length} Alt Bayi
                      </span>
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-700">
                      Kademe Kişisel Ciro Toplamı:{' '}
                      <strong>
                        {lvl.totalPersonalVolume.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        $
                      </strong>
                    </div>
                  </div>

                  {lvl.members.length === 0 ? (
                    <div className="text-xs text-slate-400">
                      Bu derinlik kademesinde henüz davet edilmiş alt bayi bulunmamaktadır.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {lvl.members.map((child) => {
                        const childSponsor = sortedMembers.find(
                          (s) => s.user_id === child.sponsor_id
                        );
                        return (
                          <div
                            key={child.user_id}
                            onClick={() => {
                              if (isAdminAuthenticated) onSelectMember(child.user_id);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (
                                isAdminAuthenticated &&
                                (e.key === 'Enter' || e.key === ' ')
                              ) {
                                onSelectMember(child.user_id);
                              }
                            }}
                            className={`p-3 bg-white border border-slate-200 rounded-lg hover:border-emerald-400 transition-colors flex items-center justify-between gap-3 ${
                              isAdminAuthenticated ? 'cursor-pointer' : 'cursor-default'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                #{child.global_line_id} {child.full_name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Sponsor: {childSponsor?.full_name || member.full_name} ·{' '}
                                Kariyer Seviyesi {child.career_level}
                              </div>
                            </div>
                            <div className="text-right font-mono tabular-nums text-xs">
                              <div className="font-semibold text-slate-900">
                                {child.personal_volume.toLocaleString('tr-TR')} $
                              </div>
                              <div className="text-[10px] text-emerald-700">
                                {child.session_credits} Kredi
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* SOL KOL & SAĞ KOL (İKİLİ DENGE HATTI) + KARİYER YETERLİLİKLERİ VE EKSİKLER ANALİZ PANELİ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* SOL KOL PANELİ */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 text-[10px] font-bold">
                        SOL KOL (1. ANA KOL)
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                        Sol Kol Bayi &amp; Yeterlilik Durumu
                      </h4>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-lg font-black text-emerald-800">
                        {branchAndQualificationStats.leftMembers.length} Bayi
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        {branchAndQualificationStats.leftActive} Aktif · Ciro:{' '}
                        {branchAndQualificationStats.leftVol.toLocaleString('tr-TR')} $
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono bg-white p-2.5 rounded-xl border border-emerald-200">
                    <span>Hedef: Min. {branchAndQualificationStats.reqPerBranch} Aktif Bayi</span>
                    <strong
                      className={
                        branchAndQualificationStats.missingLeft === 0
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }
                    >
                      {branchAndQualificationStats.missingLeft === 0
                        ? '✓ SOL KOL YETERLİ'
                        : `⚠️ Eksik: +${branchAndQualificationStats.missingLeft} Aktif Bayi`}
                    </strong>
                  </div>
                </div>

                {/* SAĞ KOL PANELİ */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border-2 border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-950 text-[10px] font-bold">
                        SAĞ KOL (2. ANA KOL)
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                        Sağ Kol Bayi &amp; Yeterlilik Durumu
                      </h4>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-lg font-black text-indigo-800">
                        {branchAndQualificationStats.rightMembers.length} Bayi
                      </div>
                      <div className="text-[11px] text-indigo-700">
                        {branchAndQualificationStats.rightActive} Aktif · Ciro:{' '}
                        {branchAndQualificationStats.rightVol.toLocaleString('tr-TR')} $
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono bg-white p-2.5 rounded-xl border border-indigo-200">
                    <span>Hedef: Min. {branchAndQualificationStats.reqPerBranch} Aktif Bayi</span>
                    <strong
                      className={
                        branchAndQualificationStats.missingRight === 0
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }
                    >
                      {branchAndQualificationStats.missingRight === 0
                        ? '✓ SAĞ KOL YETERLİ'
                        : `⚠️ Eksik: +${branchAndQualificationStats.missingRight} Aktif Bayi`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* EKSİKLER & YETERLİLİKLER ÖZET BARI */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">
                    Hedef ({branchAndQualificationStats.nextTierLevel}. Kariyer Seviyesi) Direkt Bayi
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {branchAndQualificationStats.activeDirects} /{' '}
                    {branchAndQualificationStats.reqDirects} Bayi
                  </div>
                  <div className="text-[10px] text-amber-300">
                    {branchAndQualificationStats.missingDirects === 0
                      ? '✓ Tamamlandı'
                      : `Eksik: ${branchAndQualificationStats.missingDirects} Bayi`}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Sol / Sağ Kol Dengesi</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Sol: {branchAndQualificationStats.leftActive} · Sağ:{' '}
                    {branchAndQualificationStats.rightActive}
                  </div>
                  <div className="text-[10px] text-emerald-300">
                    {branchAndQualificationStats.missingLeft === 0 &&
                    branchAndQualificationStats.missingRight === 0
                      ? '✓ İki Kol Dengeli'
                      : `Sol Eksik: ${branchAndQualificationStats.missingLeft} / Sağ Eksik: ${branchAndQualificationStats.missingRight}`}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Toplam Ciro Yeterliliği</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {branchAndQualificationStats.totalVol.toLocaleString('tr-TR')} /{' '}
                    {branchAndQualificationStats.reqVol.toLocaleString('tr-TR')} $
                  </div>
                  <div className="text-[10px] text-amber-300">
                    {branchAndQualificationStats.missingVol === 0
                      ? '✓ Ciro Tamam'
                      : `Eksik: ${branchAndQualificationStats.missingVol.toLocaleString('tr-TR')} $`}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 space-y-1">
                <div className="font-bold text-slate-900">Sponsorunuz</div>
                {directSponsor ? (
                  <>
                    <div>Ad Soyad: <strong>{directSponsor.full_name}</strong></div>
                    <div>Telefon: <strong className="font-mono">{directSponsor.phone || 'Belirtilmedi'}</strong></div>
                  </>
                ) : (
                  <div className="text-slate-500">Bu hesap bir kök bayi olduğu için sponsoru bulunmuyor.</div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
                <div>
                  <strong>{member.full_name} — Monoline Tek Hat Alt Bayi Ağacı:</strong> Kendi
                  kaydettiğiniz bayilerin doğrudan sponsoru sizsiniz. Kendinizden sonra kendi
                  sponsorluk hattınıza eklenen <strong>{downlineSubDealers.length} alt bayi</strong>{' '}
                  aşağıda tek hat ağaç yapısında sıralanmaktadır. Üst sponsorların diğer bayileri
                  gizlenmiştir.
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNetworkAddModal(false);
                      redirectToDealerRegistrationPortal({
                        user_id: member.user_id,
                        full_name: member.full_name,
                        ref_code: member.ref_code,
                        email: member.email,
                        phone: member.phone,
                      });
                    }}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Bayi Kaydını Portalda Aç</span>
                  </button>

                </div>
              </div>

              {/* Yatay Monoline Tek Hat Ağaç Yapısı */}
              <div className="overflow-x-auto pb-3 pt-1">
                <div className="inline-flex items-stretch gap-3 min-w-full">
                  {dealerDownlineTree.map((node, idx) => {
                    const isRoot = node.user_id === member.user_id;
                    const isDirectSponsored = node.sponsor_id === member.user_id && !isRoot;
                    const nodeSponsor = node.sponsor_id
                      ? sortedMembers.find((s) => s.user_id === node.sponsor_id)
                      : null;

                    return (
                      <React.Fragment key={node.user_id}>
                        <div
                          className={`w-64 shrink-0 rounded-2xl p-4 border flex flex-col justify-between ${
                            isRoot
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : isDirectSponsored
                              ? 'bg-emerald-50/80 border-emerald-300 text-slate-900'
                              : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                              <span
                                className={`font-bold ${
                                  isRoot ? 'text-amber-300' : 'text-emerald-800'
                                }`}
                              >
                                {isRoot
                                  ? `KÖK BAYİ (SİZ) · #${node.global_line_id}`
                                  : `ALT SIRA #${idx} · (#${node.global_line_id})`}
                              </span>
                              <span className={isRoot ? 'text-slate-300' : 'text-slate-600'}>
                                {node.session_credits} Kredi
                              </span>
                            </div>

                            <div className="text-[11px] font-semibold">
                              {isRoot ? (
                                <span className="text-emerald-300">
                                  ★ Kendi Bayi Kök Noktanız
                                </span>
                              ) : isDirectSponsored ? (
                                <span className="text-emerald-700">
                                  ★ Doğrudan Kaydettiğiniz Bayi (Sponsor: Siz)
                                </span>
                              ) : (
                                <span className="text-slate-600">
                                  ↳ Alt Bayinizin Kaydı (Sponsor: {nodeSponsor?.full_name || '-'})
                                </span>
                              )}
                            </div>

                            <div>
                              <div className="font-bold text-sm truncate">{node.full_name}</div>
                              <div
                                className={`text-xs truncate ${
                                  isRoot ? 'text-slate-300' : 'text-slate-500'
                                }`}
                              >
                                {node.career_level > 0
                                  ? `Kariyer Seviyesi ${node.career_level}`
                                  : 'Aday'}{' '}
                                · Kod: {node.ref_code}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`mt-4 pt-3 border-t text-xs font-mono tabular-nums space-y-1 ${
                              isRoot
                                ? 'border-slate-700 text-slate-300'
                                : 'border-slate-200/80 text-slate-600'
                            }`}
                          >
                            <div className="flex justify-between">
                              <span>Sponsoru:</span>
                              <span className="font-semibold truncate max-w-[130px]">
                                {isRoot ? 'Siz (Kök)' : nodeSponsor?.full_name || member.full_name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Kişisel Hacim:</span>
                              <span className="font-semibold">
                                {node.personal_volume.toLocaleString('tr-TR')} $
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Toplam Kazanç:</span>
                              <span
                                className={`font-semibold ${
                                  isRoot ? 'text-emerald-300' : 'text-emerald-700'
                                }`}
                              >
                                {node.wallets.total_earnings.toLocaleString('tr-TR')} $
                              </span>
                            </div>
                          </div>
                        </div>

                        {idx < dealerDownlineTree.length - 1 && (
                          <div className="flex items-center justify-center text-emerald-500 shrink-0">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Dikey Tek Hat Alt Bayi Listesi */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900">
                    Kendi Sponsorluk Hattınızda Sizden Sonraki Alt Bayiler (+
                    {downlineSubDealers.length})
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold">
                    Üst sponsorların diğer bayileri gösterilmez
                  </span>
                </div>

                {downlineSubDealers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Henüz kendi sponsorluğunuzda sizden sonra kaydedilmiş bir alt bayi bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {downlineSubDealers.map((u, idx) => {
                      const uSponsor = u.sponsor_id
                        ? sortedMembers.find((s) => s.user_id === u.sponsor_id)
                        : null;
                      const isDirect = u.sponsor_id === member.user_id;
                      return (
                        <React.Fragment key={u.user_id}>
                          <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono font-bold">
                                  Alt Hat #{idx + 1}
                                </span>
                                <span className="font-mono font-bold text-slate-900">
                                  (Global #{u.global_line_id})
                                </span>
                                <span className="font-bold text-slate-900">{u.full_name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Direkt Sponsoru:{' '}
                                <strong className="text-slate-800">
                                  {isDirect
                                    ? `${member.full_name} (Siz — %20 Sponsor Primi)`
                                    : uSponsor?.full_name || '-'}
                                </strong>{' '}
                                · Kodu: <span className="font-mono">{u.ref_code}</span> · Kredi:{' '}
                                <span className="font-mono font-semibold">
                                  {u.session_credits} Seans
                                </span>
                              </div>
                            </div>
                            <span
                              className={`font-mono tabular-nums font-semibold ${
                                isDirect ? 'text-emerald-700' : 'text-teal-700'
                              }`}
                            >
                              {isDirect
                                ? '★ Doğrudan Sponsor Olduğunuz Bayi'
                                : '↓ Alt Bayinizin Kaydettiği Bayi'}
                            </span>
                          </div>
                          {idx < downlineSubDealers.length - 1 && (
                            <div className="flex justify-center">
                              <ArrowDown className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {(subTab === 'profile' || subTab === 'security') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {subTab === 'profile' && (
            <section className="lg:col-span-12 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Bayi Profil Güncelleme &amp; Resmi Banka (TR IBAN)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nakit çekim taleplerinde kullanılacak varsayılan resmi TR IBAN banka
                bilgilerinizi güncelleyin.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Giriş E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Telefon Numarası
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Şehir</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mevcut Giriş Parolası
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required={
                      editEmail.trim().toLowerCase() !== (member.email || '').trim().toLowerCase() ||
                      newLoginPassword.length > 0
                    }
                    value={currentLoginPassword}
                    onChange={(e) => setCurrentLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Yeni Giriş Parolası
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={newLoginPassword}
                    onChange={(e) => setNewLoginPassword(e.target.value)}
                    placeholder="Değiştirmek istemiyorsanız boş bırakın"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Yeni Parolayı Tekrarla
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required={newLoginPassword.length > 0}
                    value={confirmLoginPassword}
                    onChange={(e) => setConfirmLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <p className="sm:col-span-3 text-[11px] text-slate-500">
                  E-posta veya parola değişikliğinde mevcut parolanız doğrulanır. Yeni parola en az 8 karakter olmalıdır.
                </p>
                {loginCredentialsError && (
                  <p role="alert" className="sm:col-span-3 text-xs font-medium text-red-700">
                    {loginCredentialsError}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Banka Adı
                  </label>
                  <input
                    type="text"
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    IBAN Hesap Sahibi Adı Soyadı (Kayıtlı Ad Soyad ile Aynı Olmalıdır)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={member.full_name}
                    className="w-full px-3 py-2 text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-lg cursor-not-allowed"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    TR IBAN Numarası (Yalnızca Resmi Banka Havale/EFT)
                  </label>
                  <input
                    type="text"
                    value={editIban}
                    onChange={(e) => setEditIban(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Banka Uyum Denetimi: Kripto (USDT/TRC20) veya üçüncü şahıs IBAN hesaplarına komisyon ödemesi yapılmaz.
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Profil ve Cüzdan Bilgilerini Kaydet
                </button>
              </div>
            </form>
            </section>
          )}

          {subTab === 'security' && (
          <section className="lg:col-span-12 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-slate-500">HESAP GÜVENLİĞİ (TOTP)</div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  2FA (İki Faktörlü Doğrulama)
                </h3>
              </div>
              <span
                className={`text-xs font-mono font-bold ${
                  member.two_factor?.enabled ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {member.two_factor?.enabled ? '✓ ETKİN' : 'PASİF'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Resmi Banka TR IBAN çekim işlemlerinde maksimum güvenlik için Google Authenticator
              veya Authy uygulamanızla 2FA doğrulamasını yönetin.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="text-xs text-slate-500">TOTP Kurulum Anahtarı (Secret Key):</div>
              <div className="font-mono text-xs font-bold text-slate-900 bg-white p-2.5 rounded border border-slate-200">
                {member.two_factor?.secret_key || 'JBSWY3DPEHPK3P1'}
              </div>

              <div className="text-xs text-slate-500 pt-1">Yedek Kurtarma Kodları:</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-700">
                {(member.two_factor?.backup_codes || ['NF-1-A1', 'NF-1-B2', 'NF-1-C3', 'NF-1-D4']).map((code) => (
                  <div key={code} className="bg-white px-2.5 py-1.5 rounded border border-slate-200">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  6 Haneli Authenticator Doğrulama Kodu
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="482910"
                  className="w-full px-3 py-2 text-sm font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-3">
                {!member.two_factor?.enabled ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onToggle2FA(member.user_id, true, totpCode)}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    2FA Doğrula ve Etkinleştir
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onToggle2FA(member.user_id, false, totpCode)}
                    className="w-full py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    2FA Korumasını Devre Dışı Bırak
                  </button>
                )}
              </div>
            </div>
          </section>
          )}
        </div>
      )}

      {/* SUB-TAB 6: SİSTEM TARAFINDAN OTOMATİK ÜRETİLEN KARİYER TEBRİK BELGESİ & ONUR PLAKETİ */}
      {subTab === 'plaque' && (
        <div className="space-y-6">
          {/* Üst Bilgi & Tek Tıkla İndirme Barı (Tam Otomatik Sistem Üretimi) */}
          <section className="bg-white border border-amber-300/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SİSTEM TARAFINDAN OTOMATİK TANZİM EDİLEN RESMİ KARİYER ONUR PLAKETİ</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {member.full_name} — Otomatik Kariyer Tebrik Belgesi &amp; Onur Plaketi
                </h3>
                <p className="text-xs text-slate-600">
                  Bu onur plaketi ve başarı sertifikası, ulaştığınız{' '}
                  <strong>
                    {selectedPlaqueTier.level}. Kariyer Seviyesi
                  </strong>{' '}
                  mertebesi ve canlı organizasyon verileriniz baz alınarak sistem tarafından{' '}
                  <strong>otomatik olarak</strong> üretilmiştir.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={isDownloadingPlaque}
                  onClick={() => handleDownloadCareerPlaquePng('landscape')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isDownloadingPlaque
                      ? 'Plaket Hazırlanıyor...'
                      : '🖼️ Yatay HD Plaket İndir (PNG · 2000×1400)'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isDownloadingPlaque}
                  onClick={() => handleDownloadCareerPlaquePng('story')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>📱 Story Dikey Plaket İndir (PNG · 1080×1920)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCareerPlaqueSvg}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>📐 Vektörel Baskı İndir (SVG)</span>
                </button>
              </div>
            </div>

            {/* Sistem Tarafından Otomatik Açılan / Hak Edilen Kariyer Plaketleri Listesi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Sistem Tarafından Hak Edişinize Göre Otomatik Üretilen Kariyer Plaketleriniz ({maxAchievedLevel} / 7 Mertebe Açık):
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Üst mertebelere terfi ettiğinizde yeni plaketiniz otomatik açılır
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {INITIAL_CAREER_TIERS.map((tier) => {
                  const isEarned = tier.level <= maxAchievedLevel;
                  const isSelected = plaqueCareerLevel === tier.level;
                  return (
                    <button
                      key={tier.level}
                      type="button"
                      disabled={!isEarned}
                      onClick={() => isEarned && setPlaqueCareerLevel(tier.level)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500 ring-2 ring-amber-400/40 cursor-pointer'
                          : isEarned
                          ? 'bg-emerald-50/60 border-emerald-300 hover:bg-emerald-100/70 cursor-pointer'
                          : 'bg-slate-100 border-slate-200 opacity-55 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <span className={isEarned ? 'text-emerald-700' : 'text-slate-500'}>
                          {tier.level}. KARİYER
                        </span>
                        <span>{isEarned ? '✓ HAZIR' : '🔒 KİLİTLİ'}</span>
                      </div>
                      <div className="text-xs font-black text-slate-900 mt-0.5 truncate">
                        Kariyer Seviyesi {tier.level}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {isEarned ? 'Otomatik Üretildi' : 'Terfi Bekleniyor'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ŞIK KARİYER TEBRİK PLAKETİ CANLI GÖRSEL TASARIMI (MÜZE & VIP ÖDÜL PLAKETİ GÖRÜNÜMÜ) */}
          <section className="relative mx-auto max-w-5xl">
            <div
              className={`relative rounded-3xl p-4 sm:p-7 shadow-2xl border-4 border-amber-400/90 overflow-hidden ${
                plaqueTheme === 'emerald_gold'
                  ? 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950'
                  : plaqueTheme === 'royal_platinum'
                  ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900'
                  : 'bg-gradient-to-br from-slate-950 via-stone-950 to-neutral-950'
              }`}
            >
              {/* İç Altın Filigran Çerçeve */}
              <div className="relative rounded-2xl border-2 border-amber-400/50 p-6 sm:p-10 text-center space-y-6 bg-black/25 backdrop-blur-xs">
                {/* 4 Köşe Altın Rozet Süslemesi */}
                <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-slate-950 font-black text-xs absolute top-3 left-3 shadow-md">
                  ✦
                </div>
                <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-slate-950 font-black text-xs absolute top-3 right-3 shadow-md">
                  ✦
                </div>
                <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-slate-950 font-black text-xs absolute bottom-3 left-3 shadow-md">
                  ✦
                </div>
                <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-slate-950 font-black text-xs absolute bottom-3 right-3 shadow-md">
                  ✦
                </div>

                {/* Üst Akademi Başlığı ve Yıldız Tacı */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-bold tracking-widest uppercase">
                    <span>★ AURABIO FREKANS KARİYER AKADEMİSİ · OTOMATİK ONUR SERTİFİKASI ★</span>
                  </div>
                  <div className="text-amber-400 text-2xl sm:text-3xl tracking-[0.35em] font-serif select-none pt-1">
                    {Array.from({ length: 7 })
                      .map((_, idx) => (idx < selectedPlaqueTier.level ? '★' : '☆'))
                      .join(' ')}
                  </div>
                </div>

                {/* Plaket Ana Başlığı */}
                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-wide bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent uppercase">
                    Kariyer Başarı &amp; Onur Plaketi
                  </h2>
                  <p className="text-xs sm:text-sm font-serif italic text-slate-300">
                    Bu Resmi Onur Plaketi ve Kariyer Terfi Belgesi, Sistem Tarafından Otomatik Olarak Tanzim Edilmiştir
                  </p>
                </div>

                {/* Takdim Edilen Bayi İsmi */}
                <div className="py-2">
                  <div className="text-3xl sm:text-5xl font-serif font-black text-white tracking-wider uppercase drop-shadow-sm">
                    {member.full_name}
                  </div>
                  <div className="mx-auto mt-3 h-0.5 w-64 sm:w-96 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                </div>

                {/* Ulaşılan Kariyer Mertebesi Altın Plaka Kutusu */}
                <div className="inline-block px-6 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-2 border-amber-400/80 shadow-lg">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-200">
                    ONAYLANAN RESMİ KARİYER MAKAMI
                  </div>
                  <div className="text-xl sm:text-3xl font-serif font-black text-amber-300 mt-0.5">
                    {selectedPlaqueTier.level}. KARİYER SEVİYESİ
                  </div>
                  <div className="text-xs text-amber-100/90 mt-1 font-medium">
                    {selectedPlaqueTier.subtitle} · {selectedPlaqueTier.poolBonusLabel}
                  </div>
                </div>

                {/* Sistem Otomatik Tebrik Mesajı */}
                <p className="max-w-2xl mx-auto text-xs sm:text-sm font-serif italic text-slate-200 leading-relaxed px-2">
                  &ldquo;{autoSystemPlaqueNote}&rdquo;
                </p>

                {/* 4'lü Kariyer Performans Özeti */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2 text-left">
                  <div className="p-3 rounded-xl bg-white/5 border border-amber-400/30">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Açık Derinlik Yetkisi
                    </div>
                    <div className="text-sm font-black font-mono text-amber-300 mt-0.5">
                      {selectedPlaqueTier.unlockedDepth}. Derinlik (%{selectedPlaqueTier.depthCommissionPercent})
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-amber-400/30">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Kariyer Terfi Ödülü
                    </div>
                    <div className="text-sm font-black font-mono text-emerald-300 mt-0.5">
                      {(selectedPlaqueTier.fixedCareerBonusAmount || 1000).toLocaleString('tr-TR')} $ + Havuz
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-amber-400/30">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      30G Organizasyon Hacmi
                    </div>
                    <div className="text-sm font-black font-mono text-white mt-0.5">
                      {Math.max(
                        member.group_volume_30d || 0,
                        selectedPlaqueTier.minGroupVolume
                      ).toLocaleString('tr-TR')}{' '}
                      $
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-amber-400/30">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Küresel Hat &amp; Ref Kodu
                    </div>
                    <div className="text-sm font-black font-mono text-amber-200 mt-0.5">
                      #{member.global_line_id} · {member.ref_code}
                    </div>
                  </div>
                </div>

                {/* Alt İmzalar, Resmi Altın Mühür ve Karekod Doğrulama */}
                <div className="pt-6 border-t border-amber-500/25 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  {/* Sol İmza */}
                  <div className="space-y-1.5 text-center sm:text-left">
                    <div className="font-serif italic font-bold text-xl text-amber-300">
                      AuraBio Yönetim Kurulu
                    </div>
                    <div className="h-px w-52 mx-auto sm:mx-0 bg-gradient-to-r from-amber-400 to-amber-600/40" />
                    <div className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      Kurucu Yönetim Kurulu Başkanı Abdulkadir kan
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-300">
                      Belge No: {documentCertNo}
                    </div>
                  </div>

                  {/* Orta Altın Mühür */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-1 shadow-xl flex items-center justify-center ring-4 ring-amber-400/30">
                      <div className="w-full h-full rounded-full border-2 border-slate-950/80 flex flex-col items-center justify-center text-slate-950">
                        <Award className="w-6 h-6 stroke-[2.5]" />
                        <span className="text-[9px] font-black tracking-tighter uppercase leading-none mt-0.5">
                          RESMİ ONUR
                        </span>
                        <span className="text-[11px] font-black uppercase leading-tight">
                          MÜHRÜ
                        </span>
                        <span className="text-[8px] font-mono font-bold">★ 2026 ★</span>
                      </div>
                    </div>
                  </div>

                  {/* Sağ İmza */}
                  <div className="space-y-1.5 text-center sm:text-right">
                    <div className="font-serif italic font-bold text-xl text-amber-300">
                      Global Liderlik Akademisi
                    </div>
                    <div className="h-px w-52 mx-auto sm:ml-auto sm:mr-0 bg-gradient-to-l from-amber-400 to-amber-600/40" />
                    <div className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      Global Network Direktörlüğü
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-300">
                      Tanzim Tarihi: {new Date().toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* SUB-TAB: 💬 ŞİKAYETLER VE ÖNERİLER (YÖNETİCİYE DOĞRUDAN İLETİM & GERİ BİLDİRİM PANELİ) */}
      {subTab === 'documents' && !isAdminAuthenticated && (
        <SharedDocumentsPanel access="dealer" />
      )}

      {subTab === 'feedback' && (
        <div className="space-y-8">
          {/* Üst Karşılama Kartı */}
          <div className="bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 text-white rounded-2xl p-6 space-y-4 border border-rose-500/30 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Doğrudan Yönetim Kurulu Masası</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Şikayetler &amp; Öneriler Masası (Yöneticiye Bildirim)
                </h3>
                <p className="text-xs text-rose-200/80 mt-1 max-w-2xl">
                  AuraBio sisteminde karşılaştığınız tüm şikayet, teknik sorun, komisyon &amp; cüzdan konuları veya platformu geliştirecek kıymetli önerilerinizi doğrudan Yönetim Kurulu Başkanı Abdulkadir Kan'a iletebilir; yöneticiden gelen yanıt ve geri bildirimleri bu panelden anlık olarak takip edebilirsiniz.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-right font-mono">
                  <div className="text-[10px] text-rose-300 font-bold uppercase">Bayi Biletlerim</div>
                  <div className="text-lg font-extrabold text-white">{myFeedbackTickets.length} Adet</div>
                </div>
              </div>
            </div>
          </div>

          {/* İki Sütunlu Düzen: Sol = Yeni Şikayet & Öneri Gönderme Formu, Sağ = Geçmiş Bildirimlerim & Yönetici Geri Bildirimleri */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sol 5 Sütun: Yeni Bildirim Gönderme Formu */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xs">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-rose-700 font-bold">
                    YENİ BİLDİRİM OLUŞTUR
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    Yöneticiye Şikayet veya Öneri Gönder
                  </h4>
                </div>
                <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </span>
              </div>

              {ticketFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs ${
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
                    <span>{ticketFeedback.message}</span>
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

              <form onSubmit={handleSubmitDealerTicket} className="space-y-4 text-xs">
                {/* 1. Bildirim Türü */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Bildirim Türü Seçin
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'SUGGESTION', label: 'Öneri', icon: Sparkles, color: 'purple' },
                      { id: 'COMPLAINT', label: 'Şikayet', icon: AlertTriangle, color: 'rose' },
                      { id: 'REQUEST', label: 'Talep', icon: HelpCircle, color: 'blue' },
                      { id: 'INQUIRY', label: 'Soru', icon: MessageSquare, color: 'amber' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = ticketType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTicketType(item.id as any)}
                          className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? item.color === 'rose'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : item.color === 'purple'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : item.color === 'blue'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Kategori & Öncelik */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                    >
                      <option value="KOMISYON_VE_CUZDAN">💰 Komisyon &amp; Banka Çekimi</option>
                      <option value="AYLIK_AKTIFLIK">⏱️ Aktiflik Süresi &amp; Paketler</option>
                      <option value="FREKANS_SEANS_KREDI">✨ Frekans Seans &amp; Krediler</option>
                      <option value="MONOLINE_VE_AG">🌐 Monoline &amp; 7 Derinlik Ağı</option>
                      <option value="SISTEM_VE_YAZILIM">💻 Panel &amp; Yazılım / Arayüz</option>
                      <option value="YENI_OZELLIK_ONERISI">💡 Yeni Ürün &amp; Özellik Fikri</option>
                      <option value="DIGER">📌 Diğer Konular</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Öncelik Düzeyi
                    </label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                    >
                      <option value="NORMAL">🔵 Normal Öncelik</option>
                      <option value="HIGH">🟠 Yüksek Öncelik</option>
                      <option value="URGENT">🔴 Acil Değerlendirme</option>
                      <option value="LOW">⚪ Düşük / Bilgilendirme</option>
                    </select>
                  </div>
                </div>

                {/* 3. Konu Başlığı */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Konu Başlığı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Örn: Frekans Seans Kredisi Yükleme Talebi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:outline-hidden"
                  />
                </div>

                {/* 4. Mesaj İçeriği */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Şikayet veya Öneri Detayınız <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Lütfen şikayet, öneri veya talebinizi açık ve anlaşılır biçimde açıklayınız. Yönetici en kısa sürede inceleyerek geri bildirim sağlayacaktır..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:outline-hidden"
                  />
                </div>

                {/* Gönderen Bayi Özeti */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Gönderen Bayi Künyesi:</span>
                    <span className="text-rose-700 font-mono font-bold">
                      {member?.ref_code || 'AURA-BAYI'}
                    </span>
                  </div>
                  <div>
                    {member?.full_name} · Kariyer Seviyesi {member?.career_level}
                  </div>
                  <div className="text-slate-500">
                    İletişim: {member?.phone || member?.email || 'Kayıtlı Profil'}
                  </div>
                </div>

                {/* Gönder Butonu */}
                <button
                  type="submit"
                  disabled={ticketSubmitting || !ticketSubject.trim() || !ticketMessage.trim()}
                  className="w-full py-3 px-4 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all text-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {ticketSubmitting ? 'Bildirim İletiliyor...' : 'Yöneticiye Gönder'}
                  </span>
                </button>
              </form>
            </div>

            {/* Sağ 7 Sütun: Geçmiş Şikayet ve Önerilerim & Yönetici Geri Bildirimleri */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xs">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    BİLDİRİM GEÇMİŞİ &amp; GERİ BİLDİRİMLER
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    İlettiğim Bildirimler &amp; Yönetici Yanıtları
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                  {myFeedbackTickets.length} Kayıt
                </span>
              </div>

              {myFeedbackTickets.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <div className="w-12 h-12 rounded-full bg-white text-slate-400 mx-auto flex items-center justify-center shadow-2xs">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-900">
                      Henüz Bir Şikayet veya Öneri Göndermediniz
                    </h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Sol taraftaki formu doldurarak sistem, kazanç cüzdanı veya önerilerinizle ilgili yöneticiye anında bildirim iletebilirsiniz.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {myFeedbackTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-5 rounded-2xl border space-y-3.5 transition-all ${
                        ticket.status === 'RESOLVED'
                          ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-100'
                          : ticket.status === 'IN_REVIEW'
                          ? 'bg-blue-50/40 border-blue-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Üst Bilgi Satırı */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              ticket.type === 'COMPLAINT'
                                ? 'bg-rose-100 text-rose-800'
                                : ticket.type === 'SUGGESTION'
                                ? 'bg-purple-100 text-purple-800'
                                : ticket.type === 'REQUEST'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ticket.type === 'COMPLAINT'
                              ? '🛑 Şikayet'
                              : ticket.type === 'SUGGESTION'
                              ? '💡 Öneri'
                              : ticket.type === 'REQUEST'
                              ? '📋 Talep'
                              : '❓ Soru'}
                          </span>

                          <span className="text-xs font-mono font-bold text-slate-600">
                            #{ticket.id}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            {new Date(ticket.created_at).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Durum Rozeti */}
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
                              ? 'Yanıtlandı / Çözüldü'
                              : 'Kapatıldı'}
                          </span>
                        </span>
                      </div>

                      {/* Konu & Mesaj */}
                      <div className="space-y-1.5">
                        <h5 className="text-sm font-bold text-slate-900">{ticket.subject}</h5>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {ticket.message}
                        </p>
                      </div>

                      {/* YÖNETİCİ GERİ BİLDİRİMİ (Admin Cevabı) */}
                      {ticket.admin_reply ? (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 space-y-2 shadow-xs">
                          <div className="flex items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                                ✓
                              </div>
                              <span className="font-bold text-emerald-950 text-xs">
                                Yönetici Geri Bildirimi:
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-800 font-medium">
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
                          <p className="text-xs text-emerald-900 leading-relaxed font-semibold whitespace-pre-wrap">
                            {ticket.admin_reply}
                          </p>
                          <div className="text-[11px] text-emerald-700 italic pt-1">
                            Resmi Yanıt: {ticket.admin_replied_by || 'Abdulkadir kan (Yönetim Kurulu Başkanı)'}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Bildiriminiz yönetici inceleme sırasına alınmıştır. Yönetici tarafından geri bildirim sağlandığında burada görüntülenecektir.
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
