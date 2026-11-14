import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, BarChart3, Camera, ChevronDown, ChevronUp, Database, RefreshCw, RotateCcw, X } from 'lucide-react';
import { AdminConsoleView } from './AdminConsoleView';
import { CareerMatrixView } from './CareerMatrixView';
import { CommissionEngineView } from './CommissionEngineView';
import { DataBackupRestoreModal } from './DataBackupRestoreModal';
import { DealerBackOfficeView, type DealerBackOfficeSubTab } from './DealerBackOfficeView';
import { LedgerTransactionsView } from './LedgerTransactionsView';
import { MonolineTimelineView } from './MonolineTimelineView';
import { PackagesCatalogView } from './PackagesCatalogView';
import { SalesVolumeD3Chart } from './SalesVolumeD3Chart';
import {
  mirrorMonolineStateBackToFrekans,
  recordMonolinePackageOrderToFrekans,
  registerMonolineMemberToFrekans,
  syncFrekansWithMonolineEngine,
} from '../utils/monolineSyncBridge';
import { getActiveResellerSession } from '../utils/resellerManager';
import { getAdminToken } from '../utils/adminSession';
import { getActiveMemberSession, getMemberWalletToken, updateMemberProfile, type UserMember } from '../utils/authManager';
import { wipeAllLocalApplicationData } from '../lib/db';
import {
  CareerTier,
  CommissionTransaction,
  MonolineMember,
  OrderCommissionPayload,
  PackageId,
  SystemStateResponse,
} from '../types/monoline';
import { formatUsd } from '../utils/currency';

export type MonolineSubTab =
  | 'mlm_7nefis'
  | 'mlm_commission'
  | 'packages'
  | 'backoffice'
  | 'admin'
  | 'monoline'
  | 'webhook';

interface MonolineMlmPortalModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
  authenticatedUser?: UserMember | null;
  onGoToCamera?: () => void;
  initialSubTab?: MonolineSubTab;
  onSubTabChange?: (tab: MonolineSubTab) => void;
  embedded?: boolean;
  isAdminAuthenticated?: boolean;
  onOpenSmartAccounting?: () => void;
}

export const MonolineMlmPortalModal: React.FC<MonolineMlmPortalModalProps> = ({
  isOpen = true,
  onClose,
  onLogout,
  authenticatedUser,
  onGoToCamera,
  initialSubTab = 'backoffice',
  onSubTabChange,
  embedded = false,
  isAdminAuthenticated = false,
  onOpenSmartAccounting,

}) => {
  const safeInitialTab: MonolineSubTab =
    !isAdminAuthenticated &&
    (initialSubTab === 'admin' || initialSubTab === 'webhook' || initialSubTab === 'mlm_commission')
      ? 'backoffice'
      : initialSubTab;
  const [state, setState] = useState<SystemStateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MonolineSubTab>(safeInitialTab);
  const [isPanelDetailOpen, setIsPanelDetailOpen] = useState(false);
  const [adminSection, setAdminSection] = useState<
    | 'params'
    | 'bonuses'
    | 'strategic_growth'
    | 'members'
    | 'finance'
    | 'webhooks_sql'
    | 'rest_api'
    | undefined
  >(undefined);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [dealerBackOfficeTab, setDealerBackOfficeTab] = useState<DealerBackOfficeSubTab>('wallet');
  const [lastTransaction, setLastTransaction] = useState<CommissionTransaction | null>(null);
  const [checkoutRequest, setCheckoutRequest] = useState<{
    packageId: string;
    nonce: number;
  } | null>(null);
  const [isLivePolling, setIsLivePolling] = useState<boolean>(true);
  const [showSalesChart, setShowSalesChart] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(new Date());
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showDataBackupModal, setShowDataBackupModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    setActiveTab(
      !isAdminAuthenticated &&
        (initialSubTab === 'admin' ||
          initialSubTab === 'webhook' ||
          initialSubTab === 'mlm_commission')
        ? 'backoffice'
        : initialSubTab
    );
  }, [initialSubTab, isAdminAuthenticated]);

  useEffect(() => {
    onSubTabChange?.(activeTab);
  }, [activeTab, onSubTabChange]);

  const resolveLoggedDealerId = useCallback((membersList: MonolineMember[]): string | null => {
    const user = authenticatedUser || getActiveMemberSession();
    if (user) {
      const matchByUid = membersList.find((member) => member.user_id === user.uid);
      if (matchByUid) return matchByUid.user_id;
      const cleanEmail = user.email.trim().toLowerCase();
      const matchByEmail = membersList.find(
        (member) => member.email && member.email.toLowerCase() === cleanEmail
      );
      if (matchByEmail) return matchByEmail.user_id;
      const referralCode = (user.dealerDetails?.referralCode || user.referralCode || '').trim().toUpperCase();
      if (referralCode) {
        const matchByCode = membersList.find(
          (member) => member.ref_code && member.ref_code.toUpperCase() === referralCode
        );
        if (matchByCode) return matchByCode.user_id;
      }
      return null;
    }

    const activeReseller = getActiveResellerSession();
    if (!activeReseller) return null;
    const matchByUid = membersList.find((member) => member.user_id === activeReseller.uid);
    if (matchByUid) return matchByUid.user_id;
    const cleanEmail = (activeReseller.email || '').trim().toLowerCase();
    const matchByEmail = membersList.find(
      (member) => cleanEmail && member.email && member.email.toLowerCase() === cleanEmail
    );
    if (matchByEmail) return matchByEmail.user_id;
    const referralCode = (activeReseller.referralCode || '').trim().toUpperCase();
    const matchByCode = membersList.find(
      (member) => referralCode && member.ref_code && member.ref_code.toUpperCase() === referralCode
    );
    return matchByCode?.user_id || null;
  }, [authenticatedUser]);

  const applyServerState = (data: SystemStateResponse) => {
    setState(data);
    setLastUpdatedAt(new Date());
    if (data.members.length > 0) {
      const loggedDealerId = !isAdminAuthenticated ? resolveLoggedDealerId(data.members) : null;
      setSelectedMemberId((prev) => {
        if (!isAdminAuthenticated) return loggedDealerId || '';
        return data.members.some((member) => member.user_id === prev)
          ? prev
          : data.members[0].user_id;
      });
    } else {
      setSelectedMemberId('');
    }
    setLastTransaction(data.transactions[0] || null);
    mirrorMonolineStateBackToFrekans(data);
  };

  useEffect(() => {
    if (state) {
      mirrorMonolineStateBackToFrekans(state);
    }
  }, [state]);

  useEffect(() => {
    const handleServerStateUpdated = (e: Event) => {
      const incoming = (e as CustomEvent<SystemStateResponse>).detail;
      if (!incoming || !Array.isArray(incoming.members)) return;
      setState((prev) => (prev && JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming));
      setSelectedMemberId((prev) => {
        if (!isAdminAuthenticated) return resolveLoggedDealerId(incoming.members) || '';
        return incoming.members.some((member) => member.user_id === prev)
          ? prev
          : incoming.members[0]?.user_id || '';
      });
    };
    window.addEventListener('aurabio_monoline_state_updated', handleServerStateUpdated);
    return () => {
      window.removeEventListener('aurabio_monoline_state_updated', handleServerStateUpdated);
    };
  }, [authenticatedUser, isAdminAuthenticated, resolveLoggedDealerId]);

  const fetchSystemState = async (runLiveSync = false) => {
    try {
      if (runLiveSync) {
        const syncedState = await syncFrekansWithMonolineEngine();
        if (syncedState) {
          applyServerState(syncedState);
          return;
        }
      }
      const token = getAdminToken() || getMemberWalletToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/v1/state', { headers, cache: 'no-store' });
      if (!res.ok) throw new Error('Sunucu durum bilgisi alınamadı.');
      const data: SystemStateResponse = await res.json();
      applyServerState(data);
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        message: err?.message || 'Veri yüklenirken hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSystemState(true);
    }
  }, [isOpen]);

  // Listen for live order-commission webhook events fired from PaymentModal or DealerOrderManager
  useEffect(() => {
    const handleLiveOrderWebhook = () => {
      fetchSystemState();
    };
    window.addEventListener('monoline_webhook_triggered', handleLiveOrderWebhook);
    return () => {
      window.removeEventListener('monoline_webhook_triggered', handleLiveOrderWebhook);
    };
  }, []);

  // Periodic real-time polling for live D3 Sales Volume Chart when portal is open
  useEffect(() => {
    if (!isOpen || !isLivePolling) return;
    const intervalId = window.setInterval(() => {
      fetchSystemState(false);
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [isOpen, isLivePolling]);

  if (!isOpen) return null;

  const showNotice = (type: 'success' | 'error', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  const handleTriggerWebhook = async (
    payload: OrderCommissionPayload
  ): Promise<CommissionTransaction | null> => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/integrations/order-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.state) setState(data.state);
      if (data.status === 'ALREADY_RECEIVED') {
        showNotice(
          'error',
          `[200 ALREADY_RECEIVED] ${data.message || 'Sipariş zaten kayıtlı.'} (order_id: ${payload.order_id})`
        );
        return null;
      }
      if (!res.ok) {
        throw new Error(data.message || 'Webhook hatası');
      }
      if (data.transaction) {
        setLastTransaction(data.transaction);
        const latestMembers: MonolineMember[] = data.state?.members || state?.members || [];
        const buyerMember = latestMembers.find((m) => m.user_id === payload.user_id);
        await recordMonolinePackageOrderToFrekans(payload, data.transaction, buyerMember);
      }
      showNotice(
        'success',
        data.detail_message ||
          data.message ||
          `Sipariş kuyruğa alındı ve işleniyor (${payload.order_id}).`
      );
      return data.transaction || null;
    } catch (err: any) {
      showNotice('error', err?.message || 'Sipariş işlenemedi.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterMember = async (formData: {
    full_name: string;
    city: string;
    sponsor_id: string;
    initial_package_id: Exclude<PackageId, 'CUSTOM'>;
    email?: string;
    phone?: string;
    ref_code?: string;
    manual_career_override?: number | null;
    skip_initial?: boolean;
    password?: string;
    assigned_leg?: 'LEFT' | 'RIGHT' | 'AUTO';
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Üye kaydı başarısız.');
      if (data.member) {
        await registerMonolineMemberToFrekans(data.member);
      }
      setState(data.state);
      if (data.member?.user_id) {
        // If registered by a dealer, keep the dealer's own view selected so they see their new sub-dealer in their tree
        if (isAdminAuthenticated) {
          setSelectedMemberId(data.member.user_id);
        } else {
          setSelectedMemberId((prev) => prev || data.member.sponsor_id || data.member.user_id);
        }
      }
      if (data.transaction) {
        setLastTransaction(data.transaction);
      }
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Üye eklenirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTriggerOrder = async (member: MonolineMember, _amount = 5000) => {
    setSelectedMemberId(member.user_id);
    setCheckoutRequest({
      packageId: 'PKG_MINI_DENEME',
      nonce: Date.now(),
    });
    setActiveTab('packages');
    showNotice(
      'success',
      `${member.full_name} için Sipariş Sepeti & Ödeme sayfasına yönlendirildiniz. Ödeme tamamlandığında aktiflik süresi uzayacaktır.`
    );
  };

  const handleDistributePool = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/career-pool/distribute', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Havuz dağıtımı başarısız.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Kariyer havuzu dağıtılırken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDepthLock = async (enforce: boolean) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/settings/depth-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enforce }),
      });
      const data = await res.json();
      if (res.ok) {
        setState(data.state);
        showNotice(
          'success',
          enforce
            ? 'Kariyer Derinlik Kilidi aktif edildi: Üst sıra üyeleri hak kazandıkları derinliğe kadar prim alır.'
            : 'Koşulsuz 7 Derinlik modu aktif edildi: Üstteki 7 üyenin tamamına kariyer şartı aranmaksızın ödeme yapılır.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBoostMemberCareer = async (userId: string, targetLevel: number) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/members/${userId}/boost-career`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_level: targetLevel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Terfi işlemi başarısız.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWithdrawal = async (payload: {
    user_id: string;
    amount: number;
    method: 'IBAN' | 'TRC20';
    holder_name: string;
    bank_name?: string;
    iban?: string;
    region?: 'DOMESTIC' | 'INTERNATIONAL';
    channel?: 'TR_IBAN' | 'SWIFT' | 'SEPA' | 'WISE' | 'TRC20';
    swift_code?: string;
    trc20_address?: string;
    wants_tax_refund?: boolean;
    invoice_number?: string;
    invoice_file_name?: string;
    invoice_file_data_url?: string;
    invoice_file_type?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const token = getMemberWalletToken();
      if (!token) throw new Error('Güvenli bayi oturumu yok; yeniden giriş yapın.');
      const res = await fetch('/api/v1/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Çekim talebi oluşturulamadı.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Çekim talebi sırasında hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleasePendingBalance = async (userId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/members/${userId}/release-pending`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem başarısız.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (
    userId: string,
    profileData: {
      full_name: string;
      phone: string;
      city: string;
      iban_holder_name: string;
      bank_name: string;
      iban: string;
      trc20_address: string;
      preferred_method: 'IBAN' | 'TRC20';
    }
  ) => {
    setIsSubmitting(true);
    try {
      const token = getAdminToken() || getMemberWalletToken();
      if (!token) throw new Error('Güvenli bayi oturumu yok; yeniden giriş yapın.');
      const res = await fetch(`/api/v1/members/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Profil güncellenemedi.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCredentials = async (
    userId: string,
    credentials: { current_password: string; email: string; new_password?: string }
  ): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const token = getAdminToken() || getMemberWalletToken();
      if (!token) throw new Error('Güvenli bayi oturumu yok; yeniden giriş yapın.');
      const res = await fetch(`/api/v1/members/${userId}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Giriş bilgileri güncellenemedi.');
      const localUpdate = await updateMemberProfile(userId, {
        email: data.email,
        newPassword: credentials.new_password,
      });
      if (!localUpdate.success) throw new Error(localUpdate.message);
      setState(data.state);
      showNotice('success', data.message);
      return true;
    } catch (err: any) {
      showNotice('error', err?.message || 'Giriş bilgileri güncellenemedi.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle2FA = async (userId: string, enabled: boolean, code: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/members/${userId}/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, verification_code: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '2FA işlemi başarısız.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCareers = async (tiers: CareerTier[]) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({ tiers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kariyer şartları güncellenemedi.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecideWithdrawal = async (
    id: number,
    decision: 'APPROVED' | 'REJECTED',
    note?: string
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/withdrawals/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, admin_note: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem başarısız.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkApproveWithdrawals = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/withdrawals/bulk-approve', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Toplu onay başarısız.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminUpdateMember = async (
    userId: string,
    payload: {
      is_active?: boolean;
      is_locked?: boolean;
      manual_career_override?: number | null;
      sponsor_id?: string;
      swap_direction?: 'UP' | 'DOWN';
      target_monoline_order?: number;
      action?: 'DELETE';
      full_name?: string;
      email?: string;
      phone?: string;
      city?: string;
    }
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Üye güncellenemedi.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminDeleteMember = async (userId: string) => {
    if (!window.confirm('Bu bayiyi/üyeyi sistemden silmek istediğinizden emin misiniz? Alt ekibi ve Monoline sıra numaraları otomatik olarak yeniden düzenlenecektir.')) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/members/${userId}`, {
        method: 'DELETE',
        headers: {

        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Üye silinemedi.');
      if (data.state) {
        applyServerState(data.state);
      }
      showNotice('success', data.message || 'Bayi sistemden silindi.');
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/v1/admin/export-data');
      const json = await res.json();
      return json;
    } catch (err: any) {
      showNotice('error', 'Veri dışa aktarılırken hata oluştu: ' + (err?.message || ''));
      throw err;
    }
  };

  const handleRestoreData = async (payloadData: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/restore-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payloadData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Veri geri yüklenemedi.');
      if (data.state) {
        applyServerState(data.state);
      }
      showNotice('success', data.message || 'Tüm veriler başarıyla geri yüklendi ve sisteme anında entegre edildi.');
      return true;
    } catch (err: any) {
      showNotice('error', err?.message || 'Geri yükleme hatası.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayoutCareerBonus = async (payload: {
    career_level?: number | 'ALL';
    bonus_amount?: number;
    tier_bonuses?: Record<number, number>;
    match_mode?: 'EXACT_LEVEL' | 'MIN_LEVEL';
    target_user_id?: string;
    note?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/bonuses/career-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kariyer bonusu aktarılamadı.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Kariyer bonusu aktarılırken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerTestErrorWebhook = async () => {
    await handleTriggerWebhook({
      user_id: 'GECERSIZ-USER-999',
      order_id: `ORD-FAIL-${Math.floor(Math.random() * 899 + 100)}`,
      order_amount: 15000,
      package_id: 'PKG_GUMUS_STANDART',
      timestamp: new Date().toISOString(),
    });
  };

  const handleTriggerIdempotencyDuplicateWebhook = async () => {
    const existingTx = state?.transactions[0];
    if (!existingTx) {
      showNotice(
        'error',
        'Idempotency testi için sistemde en az 1 tamamlanmış gerçek sipariş bulunmalıdır.'
      );
      return;
    }
    await handleTriggerWebhook({
      user_id: existingTx.buyer_user_id,
      order_id: existingTx.order_id,
      order_amount: existingTx.order_amount,
      package_id: existingTx.package_id,
      timestamp: new Date().toISOString(),
    });
  };

  const handleTriggerCareerCronJob = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/cron/career-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cron Job çalıştırılamadı.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerActivityCheckCron = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/cron/activity-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Aktiflik Cron Job çalıştırılamadı.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Aktiflik Cron Job çalıştırılırken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberActivityAction = async (userId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/member-activity-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          user_id: userId,
          action: 'EXPIRE_NOW',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bayi aktiflik işlemi yapılamadı.');
      setState(data.state);
      showNotice('success', data.message);
    } catch (err: any) {
      showNotice('error', err?.message || 'Bayi aktiflik işleminde hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenewActivityPackage = async (
    userId: string,
    packageId: Exclude<PackageId, 'CUSTOM'>
  ) => {
    setSelectedMemberId(userId);
    setCheckoutRequest({
      packageId: packageId || 'PKG_MINI_DENEME',
      nonce: Date.now(),
    });
    setActiveTab('packages');
    showNotice(
      'success',
      'Sipariş Sepeti & Ödeme sayfasına yönlendirildiniz. Ödemeyi tamamladığınızda aktiflik süresi uzayacaktır.'
    );
  };

  const handleSyncFrekansRecords = async () => {
    setIsSubmitting(true);
    try {
      const synced = await syncFrekansWithMonolineEngine();
      if (synced) {
        applyServerState(synced);
        showNotice(
          'success',
          `Frekans uygulamasındaki gerçek kayıtlar ve alışverişler senkronize edildi (${synced.members.length} Üye/Bayi · ${synced.transactions.length} Sipariş).`
        );
      } else {
        await fetchSystemState(false);
      }
    } catch (err: any) {
      showNotice('error', err?.message || 'Senkronizasyon sırasında hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetMetrics = async () => {
    if (!window.confirm('Tüm havuz, satış hacmi, dağıtılan prim ve seans kredisi sayaçlarını sıfırlamak istediğinizden emin misiniz?')) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/reset-metrics', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.state) {
        applyServerState(data.state);
        showNotice('success', 'Tüm havuz, satış hacmi ve komisyon sayaçları başarıyla sıfırlandı.');
      } else {
        showNotice('error', data?.message || 'Sayaçlar sıfırlanırken hata oluştu.');
      }
    } catch (err: any) {
      showNotice('error', err?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSystem = () => {
    setShowResetConfirmModal(true);
  };

  const executeResetSystem = async () => {
    setIsSubmitting(true);
    try {
      wipeAllLocalApplicationData();
      const res = await fetch('/api/v1/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.state) {
        applyServerState(data.state);
        showNotice(
          'success',
          'Sistem sıfırlandı. Tüm simülasyon ve sahte veriler silindi, sistem temiz ve sıfırdan canlı üretime hazır.'
        );
        window.dispatchEvent(new CustomEvent('aurabio_members_updated'));
        window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
        window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
      }
    } catch (err: any) {
      showNotice('error', err?.message || 'Sistem sıfırlanırken hata oluştu.');
    } finally {
      setIsSubmitting(false);
      setShowResetConfirmModal(false);
    }
  };

  if (!isOpen && !embedded) return null;

  const innerContent = (
    <div className={`flex flex-col bg-slate-50 text-slate-900 lg:flex-row ${embedded ? 'h-full min-h-0 overflow-hidden' : 'h-screen min-h-0 overflow-hidden'}`}>
      <div className="z-30 max-h-[40vh] shrink-0 overflow-y-auto border-b border-slate-200 bg-white/95 backdrop-blur-xs lg:sticky lg:top-0 lg:h-full lg:max-h-full lg:w-72 lg:border-b-0 lg:border-r">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-stretch gap-4 px-4 py-4 lg:px-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setActiveTab('backoffice'); setIsPanelDetailOpen(true); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full justify-start text-left whitespace-normal border cursor-pointer ${
                activeTab === 'backoffice'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              Bayi Back-Office
            </button>

            {activeTab === 'backoffice' && !isAdminAuthenticated && (
              <div className="ml-2 flex flex-col gap-1.5 border-l border-slate-200 pl-2.5">
                {([
                  ['wallet', '1. Cüzdan & Banka'],
                  ['activity', '2. Aktiflik & Paket'],
                  ['referral', '3. Referans & QR'],
                  ['network', '4. Ağ Yapısı'],
                  ['profile', '5. Bayi Profil Güncelleme'],
                  ['security', '6. Hesap Güvenliği & 2FA'],
                  ['plaque', '7. Kariyer Plaketi'],
                  ['feedback', '8. Şikayet & Öneri'],
                  ['documents', '9. Dökümanlar'],
                ] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => { setDealerBackOfficeTab(tab); setIsPanelDetailOpen(true); }}
                    aria-current={dealerBackOfficeTab === tab ? 'page' : undefined}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-[11px] font-semibold leading-snug whitespace-normal transition-colors cursor-pointer ${
                      dealerBackOfficeTab === tab
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => { setActiveTab('packages'); setIsPanelDetailOpen(true); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full justify-start text-left whitespace-normal border cursor-pointer ${
                activeTab === 'packages'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              Alışveriş Paketleri (13)
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('mlm_7nefis'); setIsPanelDetailOpen(true); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full justify-start text-left whitespace-normal border cursor-pointer ${
                activeTab === 'mlm_7nefis'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              7 Nefis Kariyer &amp; Organizasyon Matrisi
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('monoline'); setIsPanelDetailOpen(true); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full justify-start text-left whitespace-normal border cursor-pointer ${
                activeTab === 'monoline'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              Monoline Tek Hat Ağacı
            </button>

            {isAdminAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAdminSection('params');
                    setActiveTab('admin');
                    setIsPanelDetailOpen(true);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all w-full justify-start text-left whitespace-normal border cursor-pointer ${
                    activeTab === 'admin' && adminSection === 'params'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-indigo-50 text-indigo-950 border-indigo-300 hover:bg-indigo-100'
                  }`}
                >
                  🎯 7 Nefis Kariyer, PGV &amp; Organizasyon Yönetimi
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminSection(undefined);
                    setActiveTab('admin');
                    setIsPanelDetailOpen(true);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full justify-start text-left whitespace-normal border cursor-pointer ${
                    activeTab === 'admin' &&
                    adminSection !== 'bonuses' &&
                    adminSection !== 'strategic_growth' &&
                    adminSection !== 'params'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Yönetici Paneli &amp; SQL
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminSection('strategic_growth');
                    setActiveTab('admin');
                    setIsPanelDetailOpen(true);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all w-full justify-start text-left whitespace-normal border cursor-pointer ${
                    activeTab === 'admin' && adminSection === 'strategic_growth'
                      ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                      : 'bg-purple-50 text-purple-950 border-purple-300 hover:bg-purple-100'
                  }`}
                >
                  🚀 5 Stratejik Büyüme Modülü &amp; V2.2 Ayarları
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminSection('bonuses');
                    setActiveTab('admin');
                    setIsPanelDetailOpen(true);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all w-full justify-start text-left whitespace-normal border cursor-pointer ${
                    activeTab === 'admin' && adminSection === 'bonuses'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  Bonus Yönetimi (Kariyer Bonusları)
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('webhook'); setIsPanelDetailOpen(true); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all w-full justify-start text-left whitespace-normal border cursor-pointer ${
                    activeTab === 'webhook'
                      ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-xs'
                      : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  ⚡ Webhook &amp; 7 Mertebe
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {isAdminAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => setShowDataBackupModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-cyan-950 bg-cyan-100 hover:bg-cyan-200 border border-cyan-300 rounded-xl cursor-pointer shadow-xs"
                >
                  <Database className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Veri / Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncFrekansRecords}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Frekans Kayıtlarını Senkronize Et</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetSystem}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sistemi Sıfırla</span>
                </button>
              </>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Frekans Uygulamasına Dön</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 min-w-0 max-w-full flex-1 space-y-8 overflow-auto p-4 sm:p-6 xl:p-8">
        {isPanelDetailOpen && (
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <button
              type="button"
              onClick={() => setIsPanelDetailOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" /> Geri
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {activeTab === 'backoffice' ? 'Bayi Back-Office' : activeTab === 'packages' ? 'Alışveriş Paketleri' : activeTab === 'mlm_7nefis' ? '7 Nefis Kariyer & Organizasyon Matrisi' : activeTab === 'monoline' ? 'Monoline Tek Hat Ağacı' : activeTab === 'admin' ? 'Yönetici Paneli' : 'Webhook & 7 Mertebe'}
            </span>
          </div>
        )}

        {feedbackBanner && (
          <div
            className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-4 ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-red-50 border-red-200 text-red-950'
            }`}
          >
            <span>{feedbackBanner.message}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-xs underline shrink-0 cursor-pointer"
            >
              Gizle
            </button>
          </div>
        )}

        {state && isAdminAuthenticated && !isPanelDetailOpen && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-800">
                  Canlı Finans, Havuz &amp; Monoline İstatistikleri
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  (Otomatik Canlı Entegre)
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetMetrics}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl cursor-pointer shadow-xs transition-all disabled:opacity-50"
                title="Tüm havuz, satış hacmi ve komisyon sayaçlarını sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Havuz &amp; Finans Sayaçlarını Sıfırla</span>
              </button>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1.5 shadow-2xs">
              <div className="text-xs font-medium text-slate-500">
                Toplam Dağıtılan Seans Kredisi Havuzu
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {state.system_metrics.total_session_credits_issued.toLocaleString('tr-TR')}{' '}
                <span className="text-sm font-normal text-slate-500">Seans Kredisi</span>
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                Global Tek Hat: {state.members.length} Aktif Bayi
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1.5 shadow-2xs">
              <div className="text-xs font-medium text-slate-500">
                Toplam Paket Satış Hacmi ({state.system_metrics.total_orders_count} İşlem)
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {formatUsd(state.system_metrics.total_order_volume, 2)}
              </div>
              <div className="text-xs text-slate-500">
                POST /api/v1/integrations/order-commission
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1.5 shadow-2xs">
              <div className="text-xs font-medium text-slate-500">
                Sistem / Kariyer Fonu Bakiyesi (%{state.distribution_params.system_fund_percent})
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {formatUsd(state.system_metrics.system_career_fund_balance, 2)}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                Kümülatif Fon:{' '}
                {formatUsd(state.system_metrics.system_career_fund_cumulative)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1.5 shadow-2xs">
              <div className="text-xs font-medium text-slate-500">
                Dağıtılan Direkt (%{state.distribution_params.direct_sponsor_percent}) & Monoline (%
                {state.distribution_params.monoline_total_percent}) Prim
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                {formatUsd(
                  state.system_metrics.total_sponsor_commissions_paid +
                  state.system_metrics.total_monoline_commissions_paid,
                  2
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                Bekleyen Çekim: {state.system_metrics.pending_withdrawals_count} Talep (
                {formatUsd(state.system_metrics.pending_withdrawals_amount)})
              </div>
            </div>
          </section>
        </div>
      )}

        {loading || !state ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <div className="text-sm font-semibold text-slate-700">
              Bayilik Paketleri, Kredi Havuzu ve Monoline Komisyon Motoru Yükleniyor...
            </div>
          </div>
        ) : (
          <>
            {isAdminAuthenticated && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        30 Günlük Kümülatif Paket Satış Hacmi ($) &amp; Günlük Paket Satış Hacmi ($) Grafiği
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Canlı D3.js trend analizi ve günlük/kümülatif satış hacmi grafiğini görüntülemek için butona tıklayın.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSalesChart((prev) => !prev)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                      showSalesChart
                        ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500 shadow-xs'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>
                      {showSalesChart
                        ? 'Satış Hacmi Grafiğini Gizle'
                        : '30 Günlük Satış Hacmi Grafiğini Göster'}
                    </span>
                    {showSalesChart ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {showSalesChart && (
                  <SalesVolumeD3Chart
                    transactions={state.transactions}
                    members={state.members}
                    selectedMemberId={selectedMemberId}
                    onSelectMember={(id) => setSelectedMemberId(id)}
                    onQuickTriggerOrder={handleQuickTriggerOrder}
                    onRefreshLiveState={() => fetchSystemState(true)}
                    isSubmitting={isSubmitting}
                    isLivePolling={isLivePolling}
                    onToggleLivePolling={() => setIsLivePolling((prev) => !prev)}
                    lastUpdatedAt={lastUpdatedAt}
                  />
                )}
              </div>
            )}

            {activeTab === 'mlm_7nefis' && (
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                      7 Nefis Mertebesi MLM Sistemi
                    </div>
                    <h2 className="text-xl font-bold">
                      Monoline 7 Nefis MLM Kariyer Matrisi &amp; Havuz Sistemi
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100/90 max-w-3xl">
                      Kariyer seviyeleri boyunca ilerleyen basamaklar, derinlik kilidi kuralları ve kariyer havuzu dağıtım tablosu.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('monoline')}
                      className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 cursor-pointer"
                    >
                      Tek Hat Ağacını Gör
                    </button>
                    {isAdminAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('mlm_commission')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Komisyon Motoruna Geç
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTab('backoffice')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Bayi Back-Office&apos;e Dön
                      </button>
                    )}
                  </div>
                </div>

                <CareerMatrixView
                  members={state.members}
                  careerTiers={state.career_tiers}
                  selectedMemberId={selectedMemberId}
                  onSelectMember={(id) => setSelectedMemberId(id)}
                  systemFundBalance={state.system_metrics.system_career_fund_balance}
                  poolDistributions={state.pool_distributions}
                  cronLogs={state.cron_logs}
                  onDistributePool={handleDistributePool}
                  onBoostMemberCareer={handleBoostMemberCareer}
                  onTriggerCron={handleTriggerCareerCronJob}
                  isSubmitting={isSubmitting}
                  isAdminAuthenticated={isAdminAuthenticated}
                />
              </div>
            )}

            {activeTab === 'mlm_commission' && (
              <div className="space-y-8">
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                      Monoline 7 Nefis MLM &amp; Komisyon Motoru
                    </div>
                    <h2 className="text-xl font-bold">
                      Monoline 7 Nefis MLM &amp; Komisyon Dağıtım ve Muhasebe Merkezi
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                      %{state.distribution_params.direct_sponsor_percent} Direkt Sponsor Primi, %{state.distribution_params.monoline_total_percent} 7 Kademe Monoline Primi ve %{state.distribution_params.system_fund_percent} Kariyer Havuzu hesaplama motoru ve işlem defteri.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('backoffice')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Bayi Back-Office Cüzdanı
                    </button>
                  </div>
                </div>

                <CommissionEngineView
                  members={state.members}
                  selectedMemberId={selectedMemberId}
                  enforceDepthLock={state.system_metrics.enforce_career_depth_lock}
                  onToggleDepthLock={handleToggleDepthLock}
                  onTriggerWebhook={handleTriggerWebhook}
                  lastTransaction={lastTransaction}
                  isSubmitting={isSubmitting}
                  transactions={state.transactions}
                  unclaimedCommissions={state.unclaimed_commissions}
                  queueJobs={state.queue_jobs}
                  v2Config={state.v2_architecture_config}
                  withdrawalRequests={state.withdrawal_requests}
                  userRewardsLog={state.user_rewards_log}
                  notificationOutbox={state.notification_outbox}
                  fomoAlerts={state.fomo_countdown_alerts}
                  p2pTransfers={state.p2p_transfers}
                  activationVouchers={state.activation_vouchers}
                  fraudAlerts={state.fraud_alerts}
                  systemFundBalance={state.system_metrics.system_career_fund_balance}
                  onRefreshState={() => fetchSystemState(true)}
                />

                <LedgerTransactionsView
                  transactions={state.transactions}
                  members={state.members}
                  onSelectMemberInTimeline={(userId) => {
                    setSelectedMemberId(userId);
                    setActiveTab('backoffice');
                  }}
                />
              </div>
            )}

            {activeTab === 'packages' && (
              <PackagesCatalogView
                members={state.members}
                selectedMemberId={selectedMemberId}
                onSelectMember={(id) => setSelectedMemberId(id)}
                distributionParams={state.distribution_params}

                initialCheckoutRequest={checkoutRequest}
                onPurchasePackage={handleTriggerWebhook}
                onReturnToBackOffice={() => setActiveTab('backoffice')}
                isSubmitting={isSubmitting}
              />
            )}

            {activeTab === 'backoffice' && (
              <DealerBackOfficeView
                subTab={dealerBackOfficeTab}
                onSubTabChange={setDealerBackOfficeTab}
                onReturnToMenu={() => setIsPanelDetailOpen(false)}
                onLogout={onLogout}
                members={state.members}
                selectedMemberId={
                  isAdminAuthenticated
                    ? selectedMemberId
                    : resolveLoggedDealerId(state.members) || ''
                }
                onSelectMember={(id) => {
                  if (isAdminAuthenticated) {
                    setSelectedMemberId(id);
                    return;
                  }
                  setSelectedMemberId(resolveLoggedDealerId(state.members) || '');
                }}
                withdrawalRequests={state.withdrawal_requests}
                taxRefundInvoices={state.tax_refund_invoices}
                feedbackTickets={state.feedback_tickets}
                commissionLogs={state.commission_logs}

                activityLogs={state.activity_logs}
                fomoAlerts={state.fomo_countdown_alerts}
                p2pTransfers={state.p2p_transfers}
                walletTransactions={state.wallet_transactions}
                activationVouchers={state.activation_vouchers}
                notificationOutbox={state.notification_outbox}
                v2Config={state.v2_architecture_config}
                onRefreshState={() => fetchSystemState(true)}
                onRecordWalletOrder={async (payload: any, tx?: any, buyerMember?: any) => {
                  await recordMonolinePackageOrderToFrekans(payload, tx, buyerMember);
                }}
                onRecordWalletNewMember={async (newMember: any, tx?: any) => {
                  await registerMonolineMemberToFrekans(newMember, tx, state.members);
                }}
                onCreateWithdrawal={handleCreateWithdrawal}
                onReleasePendingBalance={handleReleasePendingBalance}
                onUpdateProfile={handleUpdateProfile}
                onUpdateCredentials={handleUpdateCredentials}
                onToggle2FA={handleToggle2FA}
                onRenewActivityPackage={handleRenewActivityPackage}
                onRegisterReferralMember={handleRegisterMember}
                isSubmitting={isSubmitting}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            )}

            {isAdminAuthenticated && activeTab === 'admin' && (
              <AdminConsoleView
                members={state.members}
                careerTiers={state.career_tiers}
                distributionParams={state.distribution_params}
                onOpenSmartAccounting={() => {
                  onClose?.();
                  if (onOpenSmartAccounting) {
                    onOpenSmartAccounting();
                  } else {
                    window.dispatchEvent(new CustomEvent('open-smart-accounting'));
                  }
                }}

                activityLogs={state.activity_logs}
                withdrawalRequests={state.withdrawal_requests}
                taxRefundInvoices={state.tax_refund_invoices}
                feedbackTickets={state.feedback_tickets}
                userRewardsLog={state.user_rewards_log}
                notificationOutbox={state.notification_outbox}
                fraudAlerts={state.fraud_alerts}
                fomoAlerts={state.fomo_countdown_alerts}
                p2pTransfers={state.p2p_transfers}
                activationVouchers={state.activation_vouchers}
                v2Config={state.v2_architecture_config}
                onRefreshState={() => fetchSystemState(true)}
                onOpenWebhookTab={() => setActiveTab('webhook')}
                webhookLogs={state.webhook_logs}
                commissionLogs={state.commission_logs}
                systemWallet={state.system_wallet}
                ordersLog={state.orders_log}
                cronLogs={state.cron_logs}
                poolDistributions={state.pool_distributions}
                systemFundBalance={state.system_metrics.system_career_fund_balance}
                idempotentBlockedCount={state.system_metrics.idempotent_blocked_count}
                initialSection={adminSection}
                onUpdateCareers={handleUpdateCareers}
                onTriggerActivityCheckCron={handleTriggerActivityCheckCron}
                onMemberActivityAction={handleMemberActivityAction}
                onDecideWithdrawal={handleDecideWithdrawal}
                onBulkApproveWithdrawals={handleBulkApproveWithdrawals}
                onDistributePool={handleDistributePool}
                onPayoutCareerBonus={handlePayoutCareerBonus}
                onRegisterMember={handleRegisterMember}
                onAdminUpdateMember={handleAdminUpdateMember}
                onAdminDeleteMember={handleAdminDeleteMember}
                onResetSystem={handleResetSystem}
                onExportData={handleExportData}
                onRestoreData={handleRestoreData}
                onTriggerTestErrorWebhook={handleTriggerTestErrorWebhook}
                onTriggerIdempotencyDuplicateWebhook={handleTriggerIdempotencyDuplicateWebhook}
                onTriggerCareerCronJob={handleTriggerCareerCronJob}
                isSubmitting={isSubmitting}
              />
            )}

            {activeTab === 'monoline' && (
              <MonolineTimelineView
                members={state.members}
                selectedMemberId={selectedMemberId}
                onSelectMember={(id) => setSelectedMemberId(id)}
                lastTransaction={lastTransaction}
                onRegisterMember={handleRegisterMember}
                onQuickTriggerOrder={handleQuickTriggerOrder}
                isSubmitting={isSubmitting}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            )}

            {isAdminAuthenticated && activeTab === 'webhook' && (
              <div className="space-y-10">
                <CommissionEngineView
                  members={state.members}
                  selectedMemberId={selectedMemberId}
                  enforceDepthLock={state.system_metrics.enforce_career_depth_lock}
                  onToggleDepthLock={handleToggleDepthLock}
                  onTriggerWebhook={handleTriggerWebhook}
                  lastTransaction={lastTransaction}
                  isSubmitting={isSubmitting}
                  transactions={state.transactions}
                  unclaimedCommissions={state.unclaimed_commissions}
                  queueJobs={state.queue_jobs}
                  v2Config={state.v2_architecture_config}
                  withdrawalRequests={state.withdrawal_requests}
                  userRewardsLog={state.user_rewards_log}
                  notificationOutbox={state.notification_outbox}
                  fomoAlerts={state.fomo_countdown_alerts}
                  p2pTransfers={state.p2p_transfers}
                  activationVouchers={state.activation_vouchers}
                  fraudAlerts={state.fraud_alerts}
                  systemFundBalance={state.system_metrics.system_career_fund_balance}
                  onRefreshState={() => fetchSystemState(true)}
                />
                <CareerMatrixView
                  members={state.members}
                  careerTiers={state.career_tiers}
                  selectedMemberId={selectedMemberId}
                  onSelectMember={(id) => setSelectedMemberId(id)}
                  systemFundBalance={state.system_metrics.system_career_fund_balance}
                  poolDistributions={state.pool_distributions}
                  cronLogs={state.cron_logs}
                  onDistributePool={handleDistributePool}
                  onBoostMemberCareer={handleBoostMemberCareer}
                  onTriggerCron={handleTriggerCareerCronJob}
                  isSubmitting={isSubmitting}
                  isAdminAuthenticated={isAdminAuthenticated}
                />
                <LedgerTransactionsView
                  transactions={state.transactions}
                  members={state.members}
                  onSelectMemberInTimeline={(userId) => {
                    setSelectedMemberId(userId);
                    setActiveTab('backoffice');
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {showDataBackupModal && (
        <DataBackupRestoreModal
          isOpen={showDataBackupModal}
          onClose={() => setShowDataBackupModal(false)}
          onRestoreSuccess={() => fetchSystemState(true)}
        />
      )}

      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Sistemi Sıfırlamak İstediğinizden Emin Misiniz?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tüm simülasyon ve demo sahte veriler silinecektir.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-2">
              <p className="font-semibold">Bu işlem devam ettirildiğinde:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>Sistemdeki tüm simülasyon, demo ve sahte veriler ve kullanıcılar silinir</li>
                <li>Finans sistemleri, cüzdanlar, komisyonlar ve siparişler temizlenir</li>
                <li>Havuz sayaçları ve seans kredisi havuzu sıfırlanır</li>
                <li><strong>Yönetici hesabı hariç</strong> her şey sıfırlanır ve sistem sıfırdan başlar</li>
              </ul>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={executeResetSystem}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Sıfırlanıyor...' : 'Evet, Sistemi Tamamen Sıfırla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return innerContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs">
      {innerContent}
    </div>
  );
};
