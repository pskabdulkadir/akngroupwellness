import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Lock, 
  Mail, 
  Phone, 
  Calendar,
  KeyRound,
  CreditCard,
  Building2,
  ShoppingCart,
  Zap,
  AlertTriangle,
  Loader2,
  Package,
  Plus,
  Edit2,
  RotateCcw,
  Sparkles,
  Check,
  Tag,
  Clock,
  Coins,
  DollarSign,
  TrendingUp,
  Percent,
  Award,
  Users,
  Briefcase,
  MessageCircle,
  ExternalLink,
  Smartphone,
  Power,
  Eye,
  Receipt,
  FileText,
  Printer,
  Download,
  Gift,
  Database,
  GitBranch,
  ShieldAlert,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { db, wipeAllLocalApplicationData, doc, setDoc } from '../lib/db';
import { DataBackupRestoreModal } from './DataBackupRestoreModal';
import { UnilevelOrganizationTreePanel } from './UnilevelOrganizationTreePanel';
import { loginAdminWithMessage } from '../utils/adminSession';
import {
  ADMIN_EMAILS,
  ADMIN_PHONE,
  BANK_INFO,
  DEFAULT_MEMBERSHIP_PACKAGES,
  MembershipPackage,
  getMembershipPackages,
  subscribeToMembershipPackages,
  adminSaveMembershipPackage,
  adminDeleteMembershipPackage,
  adminResetMembershipPackages,
  UserMember, 
  adminGetAllMembers, 
  adminSetMemberAccess, 
  adminDeleteMember,
  checkMemberAccess,
  adminApproveDealer,
  adminRejectDealer,
  adminCreateDealerDirectly,
  adminAddCreditsToMember,
  getWhatsAppDealerApplicationUrl,
  saveToLocalMembersDirectory
} from '../utils/authManager';
import { 
  adminGetAllDeviceSessions, 
  adminResetDeviceDemo, 
  adminExpireDeviceDemo, 
  adminDeleteDeviceSession, 
  adminApproveDemoRenewal,
  adminRejectDemoRenewal,
  DeviceSessionDoc 
} from '../utils/deviceDemoManager';
import { 
  DealerPackageOrder, 
  getAllDealerPackageOrders, 
  subscribeToDealerPackageOrders, 
  adminApproveDealerPackageOrder, 
  adminRejectDealerPackageOrder 
} from '../utils/dealerOrderManager';
import { 
  Reseller, 
  CommissionTransaction, 
  DealerPackage,
  DEFAULT_DEALER_PACKAGES,
  getDealerPackages,
  subscribeToDealerPackages,
  adminSaveDealerPackage,
  adminDeleteDealerPackage,
  adminResetDealerPackages,
  getAllResellers, 
  adminSaveReseller, 
  adminDeleteReseller, 
  getAllCommissionsAdmin, 
  adminUpdateCommissionStatus,
  adminAdjustDealerCredits,
  adminSetDealerCredits,
  getAllCreditLogsAdmin,
  getCreditLogsForReseller,
  subscribeToResellersList,
  subscribeToCreditLogs,
  CreditTransaction
} from '../utils/resellerManager';
import { 
  DigitalInvoice, 
  getAllDigitalInvoices, 
  getLocalDigitalInvoices,
  subscribeToDigitalInvoices, 
  createInvoiceForDealerOrder, 
  generateInvoiceWhatsAppShareUrl, 
  deleteDigitalInvoice, 
  saveDigitalInvoice,
  calculateVAT,
  DEFAULT_ISSUER_INFO,
  numberToTurkishWords
} from '../utils/invoiceManager';
import { DealerDetails, ScanResult } from '../types';
import { ResellerDetailModal } from './ResellerDetailModal';
import { DigitalInvoiceModal } from './DigitalInvoiceModal';
import { CampaignsManagerAdminTab } from './CampaignsManagerAdminTab';
import { SiteContentAdminTab } from './SiteContentAdminTab';
import { EthicsGuidelinesAdminTab } from './EthicsGuidelinesAdminTab';
import { MonolineMlmPortalModal } from './MonolineMlmPortalModal';
import { SharedDocumentsPanel } from './SharedDocumentsPanel';
import { 
  downloadInvoicePDF, 
  shareInvoiceViaWhatsAppWithPDF 
} from '../utils/invoicePdfExporter';
import { 
  getAllScanRecordsAdmin,
  deleteScanResult,
  deleteScanRecordsByIds,
  clearAllScanRecords,
  subscribeToScanRecords
} from '../utils/storage';

interface AdminPanelModalProps {
  onClose: () => void;
  onMemberUpdated?: () => void;
  onOpenSmartAccounting?: () => void;
}

export const ADMIN_SESSION_KEY = 'aurabio_admin_session_v1';
export const ADMIN_TAB_KEY = 'aurabio_admin_tab_v1';
const ADMIN_TABS = ['organization_tree', 'members', 'packages', 'resellers', 'dealers', 'devices', 'invoices', 'campaigns', 'scans', 'monoline_sql', 'site_content', 'ethics_guidelines'] as const;
type AdminTab = typeof ADMIN_TABS[number];
const ADMIN_MODULE_LINKS: { id: Exclude<AdminTab, 'monoline_sql'>; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: 'organization_tree', label: 'Unilevel & Monoline Ağaç Yönetimi', icon: GitBranch, color: 'emerald' },
  { id: 'members', label: 'Üye & Ödeme Onayları', icon: Users, color: 'emerald' },
  { id: 'packages', label: 'Dinamik Paket Yönetimi', icon: Package, color: 'teal' },
  { id: 'resellers', label: 'Bayi & Komisyon Yönetimi', icon: Building2, color: 'cyan' },
  { id: 'dealers', label: 'Bayi Başvuruları', icon: Briefcase, color: 'amber' },
  { id: 'devices', label: 'Cihaz Demo Yönetimi', icon: Smartphone, color: 'blue' },
  { id: 'invoices', label: 'Dijital E-Fatura Yönetimi', icon: Receipt, color: 'violet' },
  { id: 'campaigns', label: 'Kampanyalar & Fırsatlar', icon: Gift, color: 'pink' },
  { id: 'site_content', label: 'Site İçerikleri', icon: FileText, color: 'sky' },
  { id: 'ethics_guidelines', label: 'Etik Kurallar', icon: ShieldAlert, color: 'orange' },
  { id: 'scans', label: 'Tarama Kayıtları', icon: Clock, color: 'rose' },
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  onClose,
  onMemberUpdated,
  onOpenSmartAccounting,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1');
  const [adminEmailInput, setAdminEmailInput] = useState<string>('psikologabdulkadirkan@gmail.com');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('Abdulkadir1983');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Admin Subtab
  const [adminTab, setAdminTab] = useState<AdminTab>('monoline_sql');

  // Single-Page Full Panel Mode State (opens full-width view with Back button when any tab/button is clicked)
  const [isSinglePageView, setIsSinglePageView] = useState<boolean>(true);

  const openSinglePageSection = (tab: AdminTab, subAction?: () => void) => {
    setAdminTab(tab);
    setIsSinglePageView(true);
    if (tab === 'devices') loadDeviceSessions();
    if (tab === 'scans') loadScanRecords(true);
    if (subAction) {
      subAction();
    }
  };

  useEffect(() => {
    sessionStorage.setItem(ADMIN_TAB_KEY, adminTab);
  }, [adminTab]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadMembers();
    if (adminTab === 'devices') loadDeviceSessions();
    if (adminTab === 'scans') loadScanRecords(true);
  }, []);

// Scan Records (Seans Geçmişi) Management State
const [scanRecords, setScanRecords] = useState<ScanResult[]>([]);
const [scanRecordsLoading, setScanRecordsLoading] = useState<boolean>(false);
const [scanRecordsSearch, setScanRecordsSearch] = useState<string>('');
const [selectedScanIds, setSelectedScanIds] = useState<Set<string>>(new Set());
const [isBulkDeletingScans, setIsBulkDeletingScans] = useState<boolean>(false);
const [isClearingAllScans, setIsClearingAllScans] = useState<boolean>(false);
const [scanActionMsg, setScanActionMsg] = useState<string | null>(null);

  // Digital Invoices Management State
  const [invoices, setInvoices] = useState<DigitalInvoice[]>(getLocalDigitalInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<DigitalInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<'all' | 'issued' | 'sent_whatsapp' | 'paid' | 'cancelled'>('all');
  const [isCreatingCustomInvoice, setIsCreatingCustomInvoice] = useState<boolean>(false);
  const [customInvRecipientName, setCustomInvRecipientName] = useState<string>('');
  const [customInvTaxNumber, setCustomInvTaxNumber] = useState<string>('');
  const [customInvTaxOffice, setCustomInvTaxOffice] = useState<string>('');
  const [customInvPhone, setCustomInvPhone] = useState<string>('');
  const [customInvEmail, setCustomInvEmail] = useState<string>('');
  const [customInvAddress, setCustomInvAddress] = useState<string>('');
  const [customInvItemName, setCustomInvItemName] = useState<string>('Yetkili Bayi Lisans & Frekans Tarama Kredi Paketi');
  const [customInvCredits, setCustomInvCredits] = useState<number>(30);
  const [customInvGrossAmount, setCustomInvGrossAmount] = useState<number>(4950);
  const [customInvSaveLoading, setCustomInvSaveLoading] = useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<DigitalInvoice | null>(null);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState<boolean>(false);
  const [invoicePdfDownloadingId, setInvoicePdfDownloadingId] = useState<string | null>(null);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [invoiceWhatsAppSendingId, setInvoiceWhatsAppSendingId] = useState<string | null>(null);

  // Device Demo Management State
  const [deviceSessions, setDeviceSessions] = useState<DeviceSessionDoc[]>([]);
  const [deviceLoading, setDeviceLoading] = useState<boolean>(false);
  const [deviceSearch, setDeviceSearch] = useState<string>('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'pending_renewal' | 'active' | 'expired'>('all');

  const loadDeviceSessions = async () => {
    setDeviceLoading(true);
    try {
      const list = await adminGetAllDeviceSessions();
      setDeviceSessions(list);
    } catch (e) {
      console.error('Error loading device sessions:', e);
    } finally {
      setDeviceLoading(false);
    }
  };

  const handleApproveRenewal = async (deviceUUID: string) => {
    setDeviceLoading(true);
    const ok = await adminApproveDemoRenewal(deviceUUID, 30);
    setDeviceLoading(false);
    if (ok) {
      setActionSuccessMsg(`Cihaz (${deviceUUID.substring(0, 8)}...) demo yenileme talebi ONAYLANDI ve 30 dakika demo süresi başlatıldı!`);
      await loadDeviceSessions();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      alert('Demo yenileme onaylanırken hata oluştu.');
    }
  };

  const handleRejectRenewal = async (deviceUUID: string) => {
    if (!confirm('Bu demo yenileme talebini reddetmek istediğinize emin misiniz?')) return;
    setDeviceLoading(true);
    const ok = await adminRejectDemoRenewal(deviceUUID);
    setDeviceLoading(false);
    if (ok) {
      setActionSuccessMsg(`Cihaz (${deviceUUID.substring(0, 8)}...) demo yenileme talebi reddedildi.`);
      await loadDeviceSessions();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleResetDevice = async (deviceUUID: string) => {
    setDeviceLoading(true);
    const ok = await adminResetDeviceDemo(deviceUUID);
    setDeviceLoading(false);
    if (ok) {
      setActionSuccessMsg(`Cihaz (${deviceUUID.substring(0, 8)}...) demo süresi 30 dakikaya başarıyla sıfırlandı ve yenilendi!`);
      await loadDeviceSessions();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      alert('Cihaz demo durumu sıfırlanırken hata oluştu.');
    }
  };

  const handleExpireDevice = async (deviceUUID: string) => {
    setDeviceLoading(true);
    const ok = await adminExpireDeviceDemo(deviceUUID);
    setDeviceLoading(false);
    if (ok) {
      setActionSuccessMsg(`Cihaz (${deviceUUID.substring(0, 8)}...) demosu sonlandırıldı.`);
      await loadDeviceSessions();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleDeleteDevice = async (deviceUUID: string) => {
    if (!confirm('Bu cihaz kaydını Supabase ve sistemden silmek istediğinize emin misiniz?')) return;
    setDeviceLoading(true);
    const ok = await adminDeleteDeviceSession(deviceUUID);
    setDeviceLoading(false);
    if (ok) {
      setActionSuccessMsg('Cihaz kaydı silindi.');
      await loadDeviceSessions();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  // Dealer Applications & Manual Dealer Addition State
  const [dealerSearch, setDealerSearch] = useState<string>('');
  const [dealerFilter, setDealerFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedDealerUser, setSelectedDealerUser] = useState<UserMember | null>(null);
  const [showApproveDealerModal, setShowApproveDealerModal] = useState<boolean>(false);
  const [showRejectDealerModal, setShowRejectDealerModal] = useState<boolean>(false);
  const [showManualDealerModal, setShowManualDealerModal] = useState<boolean>(false);
  const [dealerApproveCode, setDealerApproveCode] = useState<string>('');
  const [dealerApproveRate, setDealerApproveRate] = useState<number>(20);
  const [dealerRejectReason, setDealerRejectReason] = useState<string>('');
  const [isDealerProcessing, setIsDealerProcessing] = useState<boolean>(false);

  // Manual Dealer Addition Form State
  const [manFullName, setManFullName] = useState<string>('');
  const [manEmail, setManEmail] = useState<string>('');
  const [manPassword, setManPassword] = useState<string>('');
  const [manPhone, setManPhone] = useState<string>('');
  const [manCompanyName, setManCompanyName] = useState<string>('');
  const [manTaxNumber, setManTaxNumber] = useState<string>('');
  const [manTaxOffice, setManTaxOffice] = useState<string>('');
  const [manBusinessField, setManBusinessField] = useState<string>('Biyo-Rezonans / Holistik Klinik');
  const [manCredits, setManCredits] = useState<number>(100);
  const [manReferralCode, setManReferralCode] = useState<string>('');
  const [manCommissionRate, setManCommissionRate] = useState<number>(20);
  const [manDealerPackageId, setManDealerPackageId] = useState<string>('silver-dealer');
  const [manNotes, setManNotes] = useState<string>('');
  const [manIsProcessing, setManIsProcessing] = useState<boolean>(false);

  // Dealer Packages CRUD State
  const [dealerPackages, setDealerPackages] = useState<DealerPackage[]>(() => getDealerPackages());
  const [editingDealerPkg, setEditingDealerPkg] = useState<DealerPackage | null>(null);
  const [isCreatingDealerPkg, setIsCreatingDealerPkg] = useState<boolean>(false);
  const [dealerPkgToDelete, setDealerPkgToDelete] = useState<DealerPackage | null>(null);
  const [dealerPkgSaveLoading, setDealerPkgSaveLoading] = useState<boolean>(false);

  // Dealer Package Form State
  const [dpFormId, setDpFormId] = useState<string>('');
  const [dpFormName, setDpFormName] = useState<string>('');
  const [dpFormCredits, setDpFormCredits] = useState<number>(30);
  const [dpFormPrice, setDpFormPrice] = useState<number>(4950);
  const [dpFormPriceText, setDpFormPriceText] = useState<string>('');
  const [dpFormBadge, setDpFormBadge] = useState<string>('');
  const [dpFormPopular, setDpFormPopular] = useState<boolean>(false);
  const [dpFormTargetAudience, setDpFormTargetAudience] = useState<string>('');
  const [dpFormUnitCostText, setDpFormUnitCostText] = useState<string>('');
  const [dpFormFeaturesText, setDpFormFeaturesText] = useState<string>('');

  // Member Management State
  const [members, setMembers] = useState<UserMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'expired'>('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Delete Member Confirmation State
  const [memberToDelete, setMemberToDelete] = useState<UserMember | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Custom Credit Modal State
  const [creditTargetMember, setCreditTargetMember] = useState<UserMember | null>(null);
  const [customCreditInput, setCustomCreditInput] = useState<string>('50');
  const [creditSaveLoading, setCreditSaveLoading] = useState<boolean>(false);

  // Data Backup / Restore & System Reset States
  const [showDataBackupModal, setShowDataBackupModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [isResettingSystem, setIsResettingSystem] = useState<boolean>(false);

  // Member Sponsorship & Branch / Leg Balance Edit State
  const [memberToEditSponsorship, setMemberToEditSponsorship] = useState<UserMember | null>(null);
  const [editMemberFullName, setEditMemberFullName] = useState<string>('');
  const [editMemberEmail, setEditMemberEmail] = useState<string>('');
  const [editMemberPhone, setEditMemberPhone] = useState<string>('');
  const [editMemberRole, setEditMemberRole] = useState<'customer' | 'member' | 'dealer' | 'admin'>('member');
  const [editMemberSponsorCode, setEditMemberSponsorCode] = useState<string>('');
  const [editMemberAssignedLeg, setEditMemberAssignedLeg] = useState<'LEFT' | 'RIGHT' | 'AUTO'>('AUTO');
  const [editMemberLeftLegVol, setEditMemberLeftLegVol] = useState<number>(0);
  const [editMemberRightLegVol, setEditMemberRightLegVol] = useState<number>(0);
  const [editMemberCredits, setEditMemberCredits] = useState<number>(100);
  const [editMemberCareerLevel, setEditMemberCareerLevel] = useState<number>(1);
  const [editMemberIsAllowed, setEditMemberIsAllowed] = useState<boolean>(true);
  const [isSavingMemberEdit, setIsSavingMemberEdit] = useState<boolean>(false);

  // Package Management State
  const [packages, setPackages] = useState<MembershipPackage[]>(() => getMembershipPackages());
  const [editingPackage, setEditingPackage] = useState<MembershipPackage | null>(null);
  const [isCreatingNewPackage, setIsCreatingNewPackage] = useState<boolean>(false);
  const [packageToDelete, setPackageToDelete] = useState<MembershipPackage | null>(null);
  const [pkgSaveLoading, setPkgSaveLoading] = useState<boolean>(false);

  // Package Form State
  const [pkgFormId, setPkgFormId] = useState<string>('');
  const [pkgFormName, setPkgFormName] = useState<string>('');
  const [pkgFormCredits, setPkgFormCredits] = useState<number>(30);
  const [pkgFormDurationText, setPkgFormDurationText] = useState<string>('');
  const [pkgFormDays, setPkgFormDays] = useState<string>('30');
  const [pkgFormIsUnlimited, setPkgFormIsUnlimited] = useState<boolean>(false);
  const [pkgFormPrice, setPkgFormPrice] = useState<string>('4950');
  const [pkgFormPriceText, setPkgFormPriceText] = useState<string>('');
  const [pkgFormBadge, setPkgFormBadge] = useState<string>('');
  const [pkgFormPopular, setPkgFormPopular] = useState<boolean>(false);
  const [pkgFormIsDemo, setPkgFormIsDemo] = useState<boolean>(false);
  const [pkgFormTargetAudience, setPkgFormTargetAudience] = useState<string>('');
  const [pkgFormUnitCostText, setPkgFormUnitCostText] = useState<string>('');
  const [pkgFormFeaturesText, setPkgFormFeaturesText] = useState<string>('');

  // Reseller Management State
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [commissions, setCommissions] = useState<CommissionTransaction[]>([]);
  const [dealerOrders, setDealerOrders] = useState<DealerPackageOrder[]>([]);
  const [creditLogs, setCreditLogs] = useState<CreditTransaction[]>([]);
  const [resellerSearch, setResellerSearch] = useState<string>('');
  const [resellerSubView, setResellerSubView] = useState<'list' | 'credits' | 'commissions' | 'orders'>('list');
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [isCreatingReseller, setIsCreatingReseller] = useState<boolean>(false);
  const [resellerToDelete, setResellerToDelete] = useState<Reseller | null>(null);
  const [resellerSaveLoading, setResellerSaveLoading] = useState<boolean>(false);
  const [selectedResellerForDetails, setSelectedResellerForDetails] = useState<Reseller | null>(null);

  // Dedicated Reseller Credit Adjustment Modal State
  const [showResellerCreditModal, setShowResellerCreditModal] = useState<boolean>(false);
  const [creditModalReseller, setCreditModalReseller] = useState<Reseller | null>(null);
  const [creditModalActionType, setCreditModalActionType] = useState<'add' | 'deduct' | 'set'>('add');
  const [creditModalAmount, setCreditModalAmount] = useState<string>('30');
  const [creditModalReason, setCreditModalReason] = useState<string>('Yönetici Kredi Yüklemesi');
  const [creditModalLoading, setCreditModalLoading] = useState<boolean>(false);

  // Credit Logs Filters & Search
  const [creditLogSearch, setCreditLogSearch] = useState<string>('');
  const [creditLogTypeFilter, setCreditLogTypeFilter] = useState<'all' | 'scan_deduct' | 'package_purchase' | 'admin_adjust' | 'admin_set'>('all');
  const [dealerCreditFilter, setDealerCreditFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Helper to open full dealer details modal for Reseller or UserMember
  const handleOpenDealerDetails = (target: Reseller | UserMember) => {
    if ('resellerName' in target) {
      setSelectedResellerForDetails(target);
    } else {
      const existing = resellers.find(
        r => r.uid === target.uid || 
             Boolean(target.email && r.email && r.email.toLowerCase() === target.email.toLowerCase()) || 
             (target.referralCode && r.referralCode === target.referralCode) ||
             (target.dealerDetails?.referralCode && r.referralCode === target.dealerDetails.referralCode)
      );
      if (existing) {
        setSelectedResellerForDetails(existing);
      } else {
        const tempReseller: Reseller = {
          uid: target.uid,
          resellerName: target.dealerDetails?.companyName || target.fullName || 'Bayi Ünvanı',
          fullName: target.fullName,
          businessName: target.dealerDetails?.companyName,
          email: target.email,
          phone: target.dealerDetails?.whatsapp || target.phone || '',
          referralCode: target.dealerDetails?.referralCode || target.referralCode || `AURA-BAYI-${target.uid.slice(0, 4).toUpperCase()}`,
          commissionRate: target.dealerDetails?.commissionRate || 20,
          bankInfo: {
            bankName: 'Banka Belirtilmedi',
            accountHolder: target.fullName,
            iban: ''
          },
          status: target.role === 'dealer' || target.dealerStatus === 'approved' ? 'active' : 'pending',
          totalEarnings: 0,
          paidEarnings: 0,
          pendingEarnings: 0,
          totalSalesAmount: 0,
          totalReferredUsers: 0,
          creditsBalance: target.creditsBalance ?? 100,
          dealerPackageId: target.dealerPackageId || 'silver-dealer',
          createdAt: target.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: target.notes || ''
        };
        setSelectedResellerForDetails(tempReseller);
      }
    }
  };

  // Dealer Orders Management State
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [orderProcessingId, setOrderProcessingId] = useState<string | null>(null);

  // Reseller Form State
  const [resFormUid, setResFormUid] = useState<string>('');
  const [resFormName, setResFormName] = useState<string>('');
  const [resFormEmail, setResFormEmail] = useState<string>('');
  const [resFormPhone, setResFormPhone] = useState<string>('');
  const [resFormCode, setResFormCode] = useState<string>('');
  const [resFormRate, setResFormRate] = useState<string>('20');
  const [resFormStatus, setResFormStatus] = useState<'active' | 'pending' | 'suspended'>('active');
  const [resFormBankName, setResFormBankName] = useState<string>('');
  const [resFormAccountHolder, setResFormAccountHolder] = useState<string>('');
  const [resFormIban, setResFormIban] = useState<string>('');
  const [resFormNotes, setResFormNotes] = useState<string>('');
  const [resFormSponsorCode, setResFormSponsorCode] = useState<string>('');
  const [resFormAssignedLeg, setResFormAssignedLeg] = useState<'AUTO' | 'LEFT' | 'RIGHT'>('AUTO');
  const [resFormLeftLegVol, setResFormLeftLegVol] = useState<number | string>(0);
  const [resFormRightLegVol, setResFormRightLegVol] = useState<number | string>(0);
  const [resFormCareerLevel, setResFormCareerLevel] = useState<number | string>(1);

  // Commissions filters
  const [commSearch, setCommSearch] = useState<string>('');
  const [commFilterStatus, setCommFilterStatus] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  const [commFilterReseller, setCommFilterReseller] = useState<string>('all');

  useEffect(() => {
    const unsub = subscribeToMembershipPackages((list) => {
      setPackages(list);
    });
    const unsubDp = subscribeToDealerPackages((list) => {
      setDealerPackages(list);
    });
    const unsubOrders = subscribeToDealerPackageOrders((list) => {
      setDealerOrders(list);
    });
    const unsubInvoices = subscribeToDigitalInvoices((list) => {
      setInvoices(list);
    });
    // LIVE SYNC: Dealers list + credit audit trail — the admin grid and credit history
    // update instantly (onSnapshot) whenever a dealer scans or credits are adjusted.
    const unsubResellers = subscribeToResellersList((liveList) => {
      setResellers(prev => {
        // Merge live Firestore snapshot onto existing (member-merged) list so no data is lost
        const map = new Map<string, Reseller>(prev.map(r => [r.uid, r]));
        return liveList.map(live => {
          const existing = map.get(live.uid);
          return existing ? { ...existing, ...live, uid: live.uid } : live;
        });
      });
    });
    const unsubCreditLogs = subscribeToCreditLogs((liveLogs) => {
      setCreditLogs(prev => {
        const map = new Map<string, CreditTransaction>(liveLogs.map(l => [l.id, l]));
        prev.forEach(l => { if (!map.has(l.id)) map.set(l.id, l); });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      });
    });
    // LIVE SYNC: full scan history — new scans appear instantly in the admin history tab
    const unsubScans = subscribeToScanRecords((list) => {
      setScanRecords(prev => {
        const map = new Map<string, ScanResult>(list.map(s => [s.id, s]));
        prev.forEach(s => { if (!map.has(s.id)) map.set(s.id, s); });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
      });
      setSelectedScanIds(prev => new Set([...Array.from(prev)].filter(id => list.some(s => s.id === id))));
    });
    return () => {
      unsub();
      unsubDp();
      unsubOrders();
      unsubInvoices();
      unsubResellers();
      unsubCreditLogs();
      unsubScans();
    };
  }, []);

  // Invoice Handlers
  const handleOpenViewInvoice = (inv: DigitalInvoice) => {
    setSelectedInvoice(inv);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoicePDF = async (inv: DigitalInvoice) => {
    setInvoicePdfDownloadingId(inv.id);
    try {
      await downloadInvoicePDF(inv);
      setActionSuccessMsg(`Fatura (${inv.invoiceNumber}) PDF formatında başarıyla cihazınıza indirildi.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (e) {
      console.error('PDF download error:', e);
      alert('PDF oluşturulurken bir hata meydana geldi.');
    } finally {
      setInvoicePdfDownloadingId(null);
    }
  };

  const handleSendInvoiceViaWhatsApp = async (inv: DigitalInvoice) => {
    setInvoiceWhatsAppSendingId(inv.id);
    try {
      const res = await shareInvoiceViaWhatsAppWithPDF(inv, inv.recipient.phone);
      // Update local invoice state
      setInvoices(prev => prev.map(item => item.id === inv.id ? { ...item, status: 'sent_whatsapp', sentAt: new Date().toISOString() } : item));
      setActionSuccessMsg(`Fatura (${inv.invoiceNumber}) PDF formatında oluşturuldu, indirildi ve WhatsApp paylaşımına aktarıldı.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (e) {
      console.error('WhatsApp invoice error:', e);
      const url = generateInvoiceWhatsAppShareUrl(inv, inv.recipient.phone);
      window.open(url, '_blank');
    } finally {
      setInvoiceWhatsAppSendingId(null);
    }
  };

  const handleConfirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeletingInvoice(true);
    try {
      const invId = invoiceToDelete.id;
      const invNum = invoiceToDelete.invoiceNumber;
      await deleteDigitalInvoice(invId);
      // Immediately filter from state
      setInvoices(prev => prev.filter(i => i.id !== invId && i.invoiceNumber !== invNum));
      if (selectedInvoice && (selectedInvoice.id === invId || selectedInvoice.invoiceNumber === invNum)) {
        setSelectedInvoice(null);
        setShowInvoiceModal(false);
      }
      setActionSuccessMsg(`Fatura (${invNum}) başarıyla silindi.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (e) {
      console.error('Error deleting invoice:', e);
      alert('Fatura silinirken bir hata oluştu.');
    } finally {
      setIsDeletingInvoice(false);
      setInvoiceToDelete(null);
    }
  };

  const handleDeleteInvoice = (inv: DigitalInvoice) => {
    setInvoiceToDelete(inv);
  };

  // ---- Scan Records (Seans Geçmişi) Handlers ----
  const loadScanRecords = async (silent = false) => {
    if (!silent) setScanRecordsLoading(true);
    try {
      const list = await getAllScanRecordsAdmin();
      setScanRecords(list);
      setSelectedScanIds(prev => new Set([...Array.from(prev)].filter(id => list.some(s => s.id === id))));
    } catch (e) {
      console.error('Load scan records error:', e);
    } finally {
      if (!silent) setScanRecordsLoading(false);
    }
  };

  const handleDeleteSingleScan = (id: string) => {
    deleteScanResult(id, 'global');
    setScanRecords(prev => prev.filter(s => s.id !== id));
    setSelectedScanIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setScanActionMsg('Tarama kaydı kalıcı olarak silindi.');
    setTimeout(() => setScanActionMsg(null), 3000);
  };

  const toggleScanSelection = (id: string) => {
    setSelectedScanIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllScans = () => {
    setSelectedScanIds(prev => prev.size === scanRecords.length && scanRecords.length > 0
      ? new Set()
      : new Set(scanRecords.map(s => s.id)));
  };

  const handleBulkDeleteSelectedScans = async () => {
    const ids = Array.from(selectedScanIds);
    if (ids.length === 0) return;
    const ok = window.confirm(`${ids.length} adet tarama kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?`);
    if (!ok) return;
    setIsBulkDeletingScans(true);
    try {
      await deleteScanRecordsByIds(ids, 'global');
      setScanRecords(prev => prev.filter(s => !ids.includes(s.id)));
      setSelectedScanIds(new Set());
      setScanActionMsg(`${ids.length} adet tarama kaydı başarıyla silindi.`);
      setTimeout(() => setScanActionMsg(null), 3500);
    } catch (e) {
      console.error('Bulk delete scans error:', e);
      alert('Tarama kayıtları silinirken bir hata oluştu.');
    } finally {
      setIsBulkDeletingScans(false);
    }
  };

  const handleClearAllScans = async () => {
    if (scanRecords.length === 0) return;
    const ok = window.confirm(`TÜM tarama kayıtları (${scanRecords.length} adet) Supabase veritabanından kalıcı olarak silinecek. Bu işlem geri alınamaz! Emin misiniz?`);
    if (!ok) return;
    setIsClearingAllScans(true);
    try {
      const deleted = await clearAllScanRecords();
      setScanRecords([]);
      setSelectedScanIds(new Set());
      setScanActionMsg(`${deleted} adet tarama kaydı başarıyla temizlendi.`);
      setTimeout(() => setScanActionMsg(null), 4000);
    } catch (e) {
      console.error('Clear all scans error:', e);
      alert('Tarama kayıtları temizlenirken bir hata oluştu.');
    } finally {
      setIsClearingAllScans(false);
    }
  };

  const handleOpenCreateCustomInvoice = () => {
    setIsCreatingCustomInvoice(true);
    setCustomInvRecipientName('');
    setCustomInvTaxNumber('');
    setCustomInvTaxOffice('');
    setCustomInvPhone('');
    setCustomInvEmail('');
    setCustomInvAddress('');
    setCustomInvItemName('Yetkili Bayi Lisans & Frekans Tarama Kredi Paketi');
    setCustomInvCredits(30);
    setCustomInvGrossAmount(4950);
  };

  const handleSaveCustomInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInvRecipientName.trim()) {
      alert('Lütfen alıcı adını giriniz.');
      return;
    }
    setCustomInvSaveLoading(true);

    const gross = Number(customInvGrossAmount) || 0;
    const vatCalc = calculateVAT(gross, 20);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const invNumber = `AUR${new Date().getFullYear()}${Date.now().toString().slice(-6)}`;
    const ettn = `a1b2c3d4-${Date.now().toString().slice(-4)}-4f9a-8e2b-${Date.now().toString().slice(-12)}`;

    const newInv: DigitalInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invNumber,
      ettn,
      issueDate: dateStr,
      issueTime: timeStr,
      serviceDate: dateStr,
      status: 'issued',
      recipient: {
        companyName: customInvRecipientName.trim(),
        fullName: customInvRecipientName.trim(),
        taxNumber: customInvTaxNumber.trim() || '11111111111',
        taxOffice: customInvTaxOffice.trim() || 'Vergi Dairesi',
        phone: customInvPhone.trim() || '',
        email: customInvEmail.trim() || '',
        address: customInvAddress.trim() || 'Türkiye',
        city: 'İstanbul'
      },
      issuer: DEFAULT_ISSUER_INFO,
      items: [
        {
          id: `item_1`,
          description: `${customInvItemName.trim()} (${customInvCredits} Adet Biyo-Rezonans & Frekans Seans Kredisi, Yetkili Bayi Lisansı)`,
          quantity: 1,
          unit: 'Paket',
          unitPrice: vatCalc.netAmount,
          kdvRate: 20,
          kdvAmount: vatCalc.vatAmount,
          totalAmount: vatCalc.grossAmount
        }
      ],
      subtotal: vatCalc.netAmount,
      kdvTotal: vatCalc.vatAmount,
      grandTotal: vatCalc.grossAmount,
      grandTotalInWords: numberToTurkishWords(vatCalc.grossAmount),
      currency: 'TRY',
      paymentMethod: 'HAVALE_EFT',
      invoiceType: 'SATIS',
      notes: '509 Sıra No\'lu VUK Genel Tebliği uyarınca e-Arşiv Fatura olarak elektronik ortamda tanzim edilmiştir.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    const ok = await saveDigitalInvoice(newInv);
    setCustomInvSaveLoading(false);
    if (ok) {
      setIsCreatingCustomInvoice(false);
      setSelectedInvoice(newInv);
      setShowInvoiceModal(true);
      setActionSuccessMsg(`Yeni fatura (${newInv.invoiceNumber}) başarıyla oluşturuldu!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      alert('Fatura kaydedilirken hata oluştu.');
    }
  };

  // Dealer Package Form Handlers
  const handleOpenCreateDealerPkg = () => {
    setEditingDealerPkg(null);
    setIsCreatingDealerPkg(true);
    setDpFormId(`pkg_dealer_${Date.now()}`);
    setDpFormName('');
    setDpFormCredits(30);
    setDpFormPrice(4950);
    setDpFormPriceText('4.950 $');
    setDpFormBadge('YENİ');
    setDpFormPopular(false);
    setDpFormTargetAudience('');
    setDpFormUnitCostText('');
    setDpFormFeaturesText('Tarama Kredisi\nBayi Paneli Erişimi\nÖzel Davet Linki');
  };

  const handleOpenEditDealerPkg = (pkg: DealerPackage) => {
    setEditingDealerPkg(pkg);
    setIsCreatingDealerPkg(false);
    setDpFormId(pkg.id);
    setDpFormName(pkg.name);
    setDpFormCredits(pkg.scanCredits || 30);
    setDpFormPrice(pkg.price || 0);
    setDpFormPriceText(pkg.priceText || `${pkg.price} $`);
    setDpFormBadge(pkg.badge || '');
    setDpFormPopular(Boolean(pkg.popular));
    setDpFormTargetAudience(pkg.targetAudience || '');
    setDpFormUnitCostText(pkg.unitCostText || '');
    setDpFormFeaturesText((pkg.features || []).join('\n'));
  };

  const handleSaveDealerPkg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dpFormName.trim()) {
      alert('Lütfen paket adını giriniz.');
      return;
    }

    setDealerPkgSaveLoading(true);
    const features = dpFormFeaturesText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const priceNum = Number(dpFormPrice) || 0;
    const creditsNum = Number(dpFormCredits) || 1;
    const unitPrice = Math.round(priceNum / (creditsNum || 1));

    const finalPkg: DealerPackage = {
      id: dpFormId.trim() || `pkg_dealer_${Date.now()}`,
      name: dpFormName.trim(),
      scanCredits: creditsNum,
      price: priceNum,
      priceText: dpFormPriceText.trim() || `${priceNum.toLocaleString('tr-TR')} $`,
      badge: dpFormBadge.trim(),
      popular: dpFormPopular,
      targetAudience: dpFormTargetAudience.trim() || 'Bayilik & Frekans Terapistleri',
      unitCostText: dpFormUnitCostText.trim() || `${unitPrice} $ / Seans Maliyeti`,
      features: features.length > 0 ? features : [`${creditsNum} Adet Tarama & Seans Kredisi`, 'Bayi Paneli & Raporlama']
    };

    const ok = await adminSaveDealerPackage(finalPkg);
    setDealerPkgSaveLoading(false);
    if (ok) {
      setEditingDealerPkg(null);
      setIsCreatingDealerPkg(false);
      setActionSuccessMsg(`Bayilik paketi "${finalPkg.name}" başarıyla kaydedildi.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      alert('Paket kaydedilirken hata oluştu.');
    }
  };

  const handleDeleteDealerPkg = async (pkgId: string) => {
    setDealerPkgSaveLoading(true);
    const ok = await adminDeleteDealerPackage(pkgId);
    setDealerPkgSaveLoading(false);
    setDealerPkgToDelete(null);
    if (ok) {
      setActionSuccessMsg('Bayilik paketi silindi.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      alert('Paket silinirken hata oluştu.');
    }
  };

  const handleResetDealerPkgs = async () => {
    setDealerPkgSaveLoading(true);
    await adminResetDealerPackages();
    setDealerPkgSaveLoading(false);
    setActionSuccessMsg('Bayilik paketleri varsayılana sıfırlandı.');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Manual Dealer Addition Handler
  const handleOpenManualDealerModal = () => {
    setManFullName('');
    setManEmail('');
    setManPassword('');
    setManPhone('');
    setManCompanyName('');
    setManTaxNumber('');
    setManTaxOffice('');
    setManBusinessField('Biyo-Rezonans / Holistik Klinik');
    setManCredits(100);
    setManReferralCode(`AURA-BAYI-${Math.floor(1000 + Math.random() * 9000)}`);
    setManCommissionRate(20);
    setManDealerPackageId('silver-dealer');
    setManNotes('');
    setShowManualDealerModal(true);
  };

  const handleSubmitManualDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manFullName.trim() || !manEmail.trim() || !manPassword.trim() || !manCompanyName.trim() || !manPhone.trim()) {
      alert('Lütfen Ad Soyad, E-posta, Şifre, Telefon ve Firma Adı alanlarını doldurunuz.');
      return;
    }

    if (manPassword.trim().length < 4) {
      alert('Şifre en az 4 karakter olmalıdır.');
      return;
    }

    setManIsProcessing(true);
    try {
      const res = await adminCreateDealerDirectly({
        fullName: manFullName.trim(),
        email: manEmail.trim(),
        password: manPassword.trim(),
        phone: manPhone.trim(),
        companyName: manCompanyName.trim(),
        taxNumber: manTaxNumber.trim(),
        taxOffice: manTaxOffice.trim(),
        businessField: manBusinessField.trim(),
        initialCredits: Number(manCredits) || 30,
        customReferralCode: manReferralCode.trim().toUpperCase(),
        commissionRate: Number(manCommissionRate) || 20,
        dealerPackageId: manDealerPackageId,
        notes: manNotes.trim(),
        sponsorId: 'USR-ADMIN',
      });

      if (res.success) {
        setShowManualDealerModal(false);
        setActionSuccessMsg(`Onaylı Bayi Hesabı Açıldı: ${manFullName} (${res.referralCode})`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
        await loadMembers();
        if (onMemberUpdated) onMemberUpdated();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err?.message || 'Bayi oluşturulurken hata meydana geldi.');
    } finally {
      setManIsProcessing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginAdminWithMessage(adminEmailInput, adminPasswordInput);
    if (result.success) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      sessionStorage.setItem(ADMIN_TAB_KEY, 'monoline_sql');
      setAdminTab('monoline_sql');
      setIsAuthenticated(true);
      setLoginError(null);
      loadMembers();
    } else {
      setLoginError(result.message || 'Yönetici girişi başarısız oldu.');
    }
  };

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const list = await adminGetAllMembers();
      setMembers(list);
      await loadResellersAndCommissions();
    } finally {
      setIsLoading(false);
    }
  };

  const loadResellersAndCommissions = async () => {
    try {
      const rList = await getAllResellers();
      setResellers(rList);
      const cList = await getAllCommissionsAdmin();
      setCommissions(cList);
      const logs = await getAllCreditLogsAdmin();
      setCreditLogs(logs);
    } catch (e) {
      console.warn('Error loading resellers/commissions/credit logs:', e);
    }
  };

  // Reseller Direct Credit Adjustment Handlers
  const handleOpenResellerCreditModal = (r: Reseller, action: 'add' | 'deduct' | 'set' = 'add') => {
    setCreditModalReseller(r);
    setCreditModalActionType(action);
    setCreditModalAmount(action === 'set' ? (r.creditsBalance ?? 100).toString() : '30');
    setCreditModalReason(
      action === 'add' ? 'Yetkili Bayi Satın Alma / Manuel Kredi Yükleme' :
      action === 'deduct' ? 'Manuel Kredi Düzeltmesi / İade' : 'Yönetici Doğrudan Bakiye Güncellemesi'
    );
    setShowResellerCreditModal(true);
  };

  const handleApplyResellerCreditAdjustment = async () => {
    if (!creditModalReseller) return;
    const val = Number(creditModalAmount);
    if (isNaN(val) || val < 0) {
      alert('Lütfen geçerli bir seans kredi miktarı giriniz.');
      return;
    }

    setCreditModalLoading(true);
    try {
      let res;
      if (creditModalActionType === 'set') {
        res = await adminSetDealerCredits(creditModalReseller.uid, val, creditModalReason || 'Yönetici Doğrudan Kredi Belirleme');
      } else {
        const delta = creditModalActionType === 'add' ? val : -val;
        res = await adminAdjustDealerCredits(
          creditModalReseller.uid, 
          delta, 
          creditModalReason || (creditModalActionType === 'add' ? 'Yönetici Kredi Yüklemesi' : 'Yönetici Kredi Düşümü')
        );
      }

      if (res.success) {
        setActionSuccessMsg(`${creditModalReseller.resellerName} için kredi bakiyesi güncellendi: Yeni Bakiye ${res.newBalance} Seans.`);
        setShowResellerCreditModal(false);
        setCreditModalReseller(null);
        await loadResellersAndCommissions();
        await loadMembers();
        if (onMemberUpdated) onMemberUpdated();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        alert(res.message || 'Kredi güncellenirken hata oluştu.');
      }
    } catch (e: any) {
      alert(e?.message || 'İşlem sırasında beklenmedik hata oluştu.');
    } finally {
      setCreditModalLoading(false);
    }
  };

  // Reseller CRUD Handlers
  const handleOpenCreateReseller = () => {
    setEditingReseller(null);
    setIsCreatingReseller(true);
    setResFormUid(`res_${Date.now()}`);
    setResFormName('');
    setResFormEmail('');
    setResFormPhone('');
    setResFormCode(`AURA-BAYI-${Math.floor(1000 + Math.random() * 9000)}`);
    setResFormRate('20');
    setResFormStatus('active');
    setResFormBankName('');
    setResFormAccountHolder('');
    setResFormIban('');
    setResFormNotes('');
  };

  const handleOpenEditReseller = (reseller: Reseller) => {
    setEditingReseller(reseller);
    setIsCreatingReseller(false);
    setResFormUid(reseller.uid);
    setResFormName(reseller.resellerName);
    setResFormEmail(reseller.email);
    setResFormPhone(reseller.phone || '');
    setResFormCode(reseller.referralCode);
    setResFormRate(String(reseller.commissionRate || 20));
    setResFormStatus(reseller.status);
    setResFormBankName(reseller.bankInfo?.bankName || '');
    setResFormAccountHolder(reseller.bankInfo?.accountHolder || reseller.resellerName);
    setResFormIban(reseller.bankInfo?.iban || '');
    setResFormNotes(reseller.notes || '');

    const matchingMember = members.find(
      (m) =>
        m.uid === reseller.uid ||
        m.email.toLowerCase() === reseller.email.toLowerCase() ||
        (m.resellerId && m.resellerId === reseller.referralCode)
    );
    setResFormSponsorCode(matchingMember?.referredByCode || (reseller as any).sponsorCode || '');
    setResFormAssignedLeg((matchingMember as any)?.assignedLeg || (reseller as any).assignedLeg || 'AUTO');
    setResFormLeftLegVol((matchingMember as any)?.leftLegVolume || (reseller as any).leftLegVolume || 0);
    setResFormRightLegVol((matchingMember as any)?.rightLegVolume || (reseller as any).rightLegVolume || 0);
    setResFormCareerLevel((matchingMember as any)?.careerLevel || (reseller as any).careerLevel || 1);
  };

  const handleSaveReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resFormName.trim() || !resFormCode.trim()) {
      alert('Lütfen Bayi Adı ve Referans Kodunu eksiksiz doldurun.');
      return;
    }

    setResellerSaveLoading(true);
    const updatedRes: Reseller = {
      uid: resFormUid || `res_${Date.now()}`,
      resellerName: resFormName.trim(),
      email: resFormEmail.trim(),
      phone: resFormPhone.trim(),
      referralCode: resFormCode.trim().toUpperCase(),
      commissionRate: Math.max(1, Math.min(100, Number(resFormRate) || 20)),
      status: resFormStatus,
      bankInfo: {
        bankName: resFormBankName.trim(),
        accountHolder: resFormAccountHolder.trim() || resFormName.trim(),
        iban: resFormIban.trim().toUpperCase(),
      },
      totalSalesAmount: editingReseller?.totalSalesAmount || 0,
      totalEarnings: editingReseller?.totalEarnings || 0,
      paidEarnings: editingReseller?.paidEarnings || 0,
      pendingEarnings: editingReseller?.pendingEarnings || 0,
      totalReferredUsers: editingReseller?.totalReferredUsers || 0,
      createdAt: editingReseller?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: resFormNotes.trim(),
      ...({
        sponsorCode: resFormSponsorCode.trim().toUpperCase(),
        assignedLeg: resFormAssignedLeg,
        leftLegVolume: Number(resFormLeftLegVol) || 0,
        rightLegVolume: Number(resFormRightLegVol) || 0,
        careerLevel: Number(resFormCareerLevel) || 1,
      } as any),
    };

    try {
      const ok = await adminSaveReseller(updatedRes);
      if (ok) {
        // Also sync corresponding member record if exists
        const matchingMember = members.find(
          (m) =>
            m.uid === updatedRes.uid ||
            m.email.toLowerCase() === updatedRes.email.toLowerCase() ||
            (m.resellerId && m.resellerId === updatedRes.referralCode)
        );

        if (matchingMember) {
          const updatedUser: UserMember = {
            ...matchingMember,
            fullName: updatedRes.resellerName,
            email: updatedRes.email,
            phone: updatedRes.phone,
            referredByCode: resFormSponsorCode.trim().toUpperCase() || undefined,
            resellerId: updatedRes.referralCode,
            ...({
              assignedLeg: resFormAssignedLeg,
              leftLegVolume: Number(resFormLeftLegVol) || 0,
              rightLegVolume: Number(resFormRightLegVol) || 0,
              careerLevel: Number(resFormCareerLevel) || 1,
            } as any),
          };
          saveToLocalMembersDirectory(updatedUser);

          try {
            const docRef = doc(db, 'users', matchingMember.uid);
            await setDoc(docRef, {
              fullName: updatedUser.fullName,
              email: updatedUser.email,
              phone: updatedUser.phone,
              referredByCode: updatedUser.referredByCode || null,
              resellerId: updatedUser.resellerId || null,
              assignedLeg: resFormAssignedLeg,
              leftLegVolume: Number(resFormLeftLegVol) || 0,
              rightLegVolume: Number(resFormRightLegVol) || 0,
              careerLevel: Number(resFormCareerLevel) || 1,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          } catch (fsErr) {
            console.debug('Firestore sync notice:', fsErr);
          }

          try {
            await fetch(`/api/v1/admin/members/${matchingMember.uid}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                full_name: updatedUser.fullName,
                sponsor_id: resFormSponsorCode.trim().toUpperCase(),
                assigned_leg: resFormAssignedLeg,
                left_leg_volume: Number(resFormLeftLegVol) || 0,
                right_leg_volume: Number(resFormRightLegVol) || 0,
                manual_career_override: Number(resFormCareerLevel) || 1,
                is_active: updatedRes.status === 'active',
              }),
            });
          } catch (srvErr) {
            console.debug('Server member update notice:', srvErr);
          }
        }

        window.dispatchEvent(new CustomEvent('aurabio_members_updated'));
        window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
        window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));

        setActionSuccessMsg(`"${updatedRes.resellerName}" bayisi, sponsorluk ve kol dengesi başarıyla kaydedildi!`);
        setEditingReseller(null);
        setIsCreatingReseller(false);
        await loadResellersAndCommissions();
        setTimeout(() => setActionSuccessMsg(null), 3500);
      } else {
        alert('Bayi kaydedilirken hata oluştu.');
      }
    } finally {
      setResellerSaveLoading(false);
    }
  };

  const handleDeleteResellerConfirm = async () => {
    if (!resellerToDelete) return;
    setResellerSaveLoading(true);
    try {
      const ok = await adminDeleteReseller(resellerToDelete.uid);
      if (ok) {
        setActionSuccessMsg(`"${resellerToDelete.resellerName}" bayisi silindi.`);
        setResellerToDelete(null);
        await loadResellersAndCommissions();
        setTimeout(() => setActionSuccessMsg(null), 3500);
      }
    } finally {
      setResellerSaveLoading(false);
    }
  };

  const handleUpdateCommissionStatus = async (
    transactionId: string, 
    newStatus: 'approved' | 'paid' | 'rejected', 
    note?: string
  ) => {
    try {
      const ok = await adminUpdateCommissionStatus(transactionId, newStatus, note);
      if (ok) {
        setActionSuccessMsg(
          newStatus === 'paid' 
            ? 'Komisyon ödendi olarak işaretlendi ve bayi bakiyesine yansıtıldı.'
            : newStatus === 'approved'
            ? 'Komisyon onaylandı.'
            : 'Komisyon reddedildi.'
        );
        await loadResellersAndCommissions();
        setTimeout(() => setActionSuccessMsg(null), 3500);
      }
    } catch (e: any) {
      alert('Komisyon durumu güncellenirken hata: ' + (e?.message || ''));
    }
  };

  // Dealer Package Order Approval & Rejection Handlers
  const handleApproveDealerOrder = async (order: DealerPackageOrder) => {
    setOrderProcessingId(order.id);
    try {
      const res = await adminApproveDealerPackageOrder(order.id, 'Yönetici tarafından onaylandı ve krediler hesaba yüklendi.');
      if (res.success) {
        setActionSuccessMsg(res.message);
        await loadResellersAndCommissions();
        setTimeout(() => setActionSuccessMsg(null), 5000);
      } else {
        setActionSuccessMsg(res.message);
        setTimeout(() => setActionSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      setActionSuccessMsg(err?.message || 'Sipariş onaylanırken hata oluştu.');
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } finally {
      setOrderProcessingId(null);
    }
  };

  const handleRejectDealerOrder = async (order: DealerPackageOrder) => {
    setOrderProcessingId(order.id);
    try {
      const res = await adminRejectDealerPackageOrder(order.id, 'Ödeme teyidi alınamadı veya yönetici tarafından reddedildi.');
      if (res.success) {
        setActionSuccessMsg(res.message);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        setActionSuccessMsg(res.message);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setActionSuccessMsg(err?.message || 'Sipariş reddedilirken hata oluştu.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setOrderProcessingId(null);
    }
  };

  const handleSetAccess = async (uid: string, isAllowed: boolean, durationDays?: number | null) => {
    const ok = await adminSetMemberAccess(uid, isAllowed, durationDays);
    if (ok) {
      setActionSuccessMsg(
        isAllowed 
          ? `Üyelik onaylandı (isAllowed: true${durationDays ? `, ${durationDays} Gün` : ', Süresiz'})!` 
          : `Üyelik askıya alındı / kilitlendi!`
      );
      loadMembers();
      if (onMemberUpdated) onMemberUpdated();
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  // Direct Credit Top-up Handler
  const handleAddCredits = async (uid: string, credits: number) => {
    const res = await adminAddCreditsToMember(uid, credits);
    if (res.success) {
      setActionSuccessMsg(res.message);
      loadMembers();
      if (onMemberUpdated) onMemberUpdated();
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      alert(res.message);
    }
  };

  // Approve Cart and Add Cart Credits Handler
  const handleApproveCartCredits = async (member: UserMember, credits: number, price: number) => {
    const res = await adminAddCreditsToMember(member.uid, credits);
    if (res.success) {
      await adminSetMemberAccess(member.uid, true, null);
      setActionSuccessMsg(`Sipariş Onaylandı: ${member.fullName} hesabına +${credits} Seans Kredisi tanımlandı (${price.toLocaleString('tr-TR')} $).`);
      loadMembers();
      if (onMemberUpdated) onMemberUpdated();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      alert(res.message);
    }
  };

  // Custom Credit Submission
  const handleConfirmCustomCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditTargetMember) return;
    const creditsNum = parseInt(customCreditInput, 10);
    if (isNaN(creditsNum) || creditsNum <= 0) {
      alert('Lütfen geçerli bir pozitif kredi miktarı giriniz.');
      return;
    }

    setCreditSaveLoading(true);
    try {
      const res = await adminAddCreditsToMember(creditTargetMember.uid, creditsNum);
      if (res.success) {
        setActionSuccessMsg(`Başarılı: ${creditTargetMember.fullName} hesabına +${creditsNum} Seans Kredisi yüklendi.`);
        setCreditTargetMember(null);
        loadMembers();
        if (onMemberUpdated) onMemberUpdated();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        alert(res.message);
      }
    } finally {
      setCreditSaveLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      const targetName = memberToDelete.fullName;
      const targetUid = memberToDelete.uid;
      const ok = await adminDeleteMember(targetUid);
      if (ok) {
        setMembers((prev) => prev.filter((m) => m.uid !== targetUid));
        setActionSuccessMsg(`"${targetName}" adlı üye veritabanından kalıcı olarak silindi.`);
        setMemberToDelete(null);
        if (onMemberUpdated) onMemberUpdated();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        alert('Üye silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Member Sponsorship & Leg Balance Handlers
  const handleOpenEditMemberSponsorship = (m: UserMember) => {
    setMemberToEditSponsorship(m);
    setEditMemberFullName(m.fullName || '');
    setEditMemberEmail(m.email || '');
    setEditMemberPhone(m.phone || '');
    setEditMemberRole(m.role || 'member');
    setEditMemberSponsorCode(m.referredByCode || m.resellerId || '');
    setEditMemberAssignedLeg((m as any).assignedLeg || 'AUTO');
    setEditMemberLeftLegVol((m as any).leftLegVolume || 0);
    setEditMemberRightLegVol((m as any).rightLegVolume || 0);
    setEditMemberCredits(m.creditsBalance ?? 100);
    setEditMemberCareerLevel((m as any).careerLevel || 1);
    setEditMemberIsAllowed(m.isAllowed ?? true);
  };

  const handleSaveMemberSponsorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToEditSponsorship) return;
    setIsSavingMemberEdit(true);
    try {
      const targetUid = memberToEditSponsorship.uid;
      const updatedUser: UserMember = {
        ...memberToEditSponsorship,
        fullName: editMemberFullName.trim(),
        email: editMemberEmail.trim().toLowerCase(),
        phone: editMemberPhone.trim(),
        role: editMemberRole,
        referredByCode: editMemberSponsorCode.trim().toUpperCase() || undefined,
        resellerId: editMemberSponsorCode.trim().toUpperCase() || undefined,
        creditsBalance: Number(editMemberCredits) || 0,
        isAllowed: editMemberIsAllowed,
        ...({
          assignedLeg: editMemberAssignedLeg,
          leftLegVolume: Number(editMemberLeftLegVol) || 0,
          rightLegVolume: Number(editMemberRightLegVol) || 0,
          careerLevel: Number(editMemberCareerLevel) || 1,
        } as any),
      };

      // 1. Update in local storage
      saveToLocalMembersDirectory(updatedUser);

      // 2. Update in Firestore
      try {
        const docRef = doc(db, 'users', targetUid);
        await setDoc(docRef, {
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          referredByCode: updatedUser.referredByCode || null,
          resellerId: updatedUser.resellerId || null,
          creditsBalance: updatedUser.creditsBalance,
          isAllowed: updatedUser.isAllowed,
          assignedLeg: editMemberAssignedLeg,
          leftLegVolume: Number(editMemberLeftLegVol) || 0,
          rightLegVolume: Number(editMemberRightLegVol) || 0,
          careerLevel: Number(editMemberCareerLevel) || 1,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore member update notice:', fsErr);
      }

      // 3. Sync to Monoline server
      try {
        await fetch(`/api/v1/admin/members/${targetUid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: updatedUser.fullName,
            session_credits: updatedUser.creditsBalance,
            sponsor_id: editMemberSponsorCode.trim().toUpperCase(),
            assigned_leg: editMemberAssignedLeg,
            left_leg_volume: Number(editMemberLeftLegVol) || 0,
            right_leg_volume: Number(editMemberRightLegVol) || 0,
            manual_career_override: Number(editMemberCareerLevel) || 1,
            is_active: editMemberIsAllowed,
          }),
        });
      } catch (srvErr) {
        console.debug('Server member update notice:', srvErr);
      }

      // 4. Update state and dispatch events
      setMembers(prev => prev.map(m => m.uid === targetUid ? updatedUser : m));
      window.dispatchEvent(new CustomEvent('aurabio_members_updated'));
      window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
      window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
      if (onMemberUpdated) onMemberUpdated();

      setActionSuccessMsg(`"${updatedUser.fullName}" üyesinin sponsorluk, kol dengesi ve üyelik bilgileri başarıyla güncellendi!`);
      setMemberToEditSponsorship(null);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('Üye güncellenirken hata: ' + (err?.message || ''));
    } finally {
      setIsSavingMemberEdit(false);
    }
  };

  // Full System Reset Handler
  const handleExecuteResetSystem = async () => {
    setIsResettingSystem(true);
    try {
      wipeAllLocalApplicationData();
      const res = await fetch('/api/v1/reset', { method: 'POST' });
      await res.json();

      await loadMembers();
      await loadResellersAndCommissions();
      await loadDeviceSessions();
      await loadScanRecords(true);

      window.dispatchEvent(new CustomEvent('aurabio_members_updated'));
      window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
      window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));

      setShowResetConfirmModal(false);
      setActionSuccessMsg('Sistem tamamen sıfırlandı! Tüm simülasyon, demo ve sahte veriler silindi, sistem temiz olarak sıfırdan başlatıldı.');
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      alert('Sistem sıfırlanırken hata oluştu: ' + (err?.message || ''));
    } finally {
      setIsResettingSystem(false);
    }
  };

  // Package Management Handlers
  const handleOpenEditPackage = (pkg: MembershipPackage) => {
    setEditingPackage(pkg);
    setIsCreatingNewPackage(false);
    setPkgFormId(pkg.id);
    setPkgFormName(pkg.name);
    setPkgFormCredits(pkg.scanCredits || 30);
    setPkgFormDurationText(pkg.durationText || '');
    setPkgFormIsUnlimited(pkg.days === null && !pkg.isDemo);
    setPkgFormDays(pkg.days ? pkg.days.toString() : '');
    setPkgFormPrice(pkg.price.toString());
    setPkgFormPriceText(pkg.priceText || `${pkg.price.toLocaleString('tr-TR')} $`);
    setPkgFormBadge(pkg.badge || '');
    setPkgFormPopular(Boolean(pkg.popular));
    setPkgFormIsDemo(Boolean(pkg.isDemo));
    setPkgFormTargetAudience(pkg.targetAudience || '');
    setPkgFormUnitCostText(pkg.unitCostText || '');
    setPkgFormFeaturesText((pkg.features || []).join('\n'));
  };

  const handleOpenCreatePackage = () => {
    setEditingPackage(null);
    setIsCreatingNewPackage(true);
    const newId = `pkg-bayi-${Date.now().toString().slice(-4)}`;
    setPkgFormId(newId);
    setPkgFormName('');
    setPkgFormCredits(30);
    setPkgFormDurationText('30 Seans Kredisi');
    setPkgFormIsUnlimited(true);
    setPkgFormDays('30');
    setPkgFormPrice('4950');
    setPkgFormPriceText('4.950 $');
    setPkgFormBadge('YENİ');
    setPkgFormPopular(false);
    setPkgFormIsDemo(false);
    setPkgFormTargetAudience('Frekans Terapistleri & Bayiler');
    setPkgFormUnitCostText('165 $ / Seans');
    setPkgFormFeaturesText('30 Adet Tarama & Seans Kredisi\nCanlı Frekans Yüklemesi & PDF Raporu\nBayi Paneli & Raporlama');
  };

  const handleSavePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgFormName.trim()) {
      alert('Lütfen paket adını giriniz.');
      return;
    }
    setPkgSaveLoading(true);

    const priceNum = parseFloat(pkgFormPrice) || 0;
    const creditsNum = parseInt(pkgFormCredits.toString(), 10) || 1;
    const unitPrice = Math.round(priceNum / (creditsNum || 1));
    const featuresList = pkgFormFeaturesText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const updatedPkg: MembershipPackage = {
      id: pkgFormId || `pkg-${Date.now()}`,
      name: pkgFormName.trim(),
      scanCredits: creditsNum,
      durationText: pkgFormDurationText.trim() || `${creditsNum} Seans Kredisi (${unitPrice} $/Seans)`,
      days: null,
      price: priceNum,
      priceText: pkgFormPriceText.trim() || (priceNum === 0 ? '0 $ (Ücretsiz)' : `${priceNum.toLocaleString('tr-TR')} $`),
      badge: pkgFormBadge.trim() || undefined,
      popular: pkgFormPopular,
      isDemo: pkgFormIsDemo,
      targetAudience: pkgFormTargetAudience.trim() || 'Bayilik & Frekans Terapistleri',
      unitCostText: pkgFormUnitCostText.trim() || `${unitPrice} $ / Seans`,
      features: featuresList.length > 0 ? featuresList : [`${creditsNum} Adet Tarama & Seans Kredisi`, 'Tüm Biyo-Rezonans Özellikleri'],
    };

    try {
      const ok = await adminSaveMembershipPackage(updatedPkg);
      // Also sync to dealer packages
      await adminSaveDealerPackage({
        id: updatedPkg.id,
        name: updatedPkg.name,
        scanCredits: creditsNum,
        price: priceNum,
        priceText: updatedPkg.priceText || `${priceNum.toLocaleString('tr-TR')} $`,
        badge: updatedPkg.badge ?? '',
        popular: updatedPkg.popular,
        targetAudience: updatedPkg.targetAudience ?? '',
        unitCostText: updatedPkg.unitCostText ?? '',
        features: updatedPkg.features
      });

      if (ok) {
        setActionSuccessMsg(`"${updatedPkg.name}" paketi (${creditsNum} Kredi) başarıyla kaydedildi!`);
        setEditingPackage(null);
        setIsCreatingNewPackage(false);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        alert('Paket kaydedilirken hata oluştu.');
      }
    } finally {
      setPkgSaveLoading(false);
    }
  };

  const handleDeletePackageConfirm = async () => {
    if (!packageToDelete) return;
    setPkgSaveLoading(true);
    try {
      const ok = await adminDeleteMembershipPackage(packageToDelete.id);
      await adminDeleteDealerPackage(packageToDelete.id);
      if (ok) {
        setActionSuccessMsg(`"${packageToDelete.name}" paketi silindi.`);
        setPackageToDelete(null);
        setTimeout(() => setActionSuccessMsg(null), 3500);
      }
    } finally {
      setPkgSaveLoading(false);
    }
  };

  const handleResetPackages = async () => {
    setPkgSaveLoading(true);
    try {
      const ok = await adminResetMembershipPackages();
      await adminResetDealerPackages();
      if (ok) {
        setActionSuccessMsg('Tüm paketler 5 Kredili Bayilik Paketi standardına sıfırlandı.');
        setTimeout(() => setActionSuccessMsg(null), 3500);
      }
    } finally {
      setPkgSaveLoading(false);
    }
  };

  const getWhatsAppNotifyUrl = (member: UserMember, creditOrDurationText: string) => {
    const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Merhaba ${member.fullName},\n\nAKN AuraBio Frekans sistemi ödemeniz onaylanmış ve ${creditOrDurationText} hesabınıza tanımlanmıştır.\n\nUygulamaya hemen giriş yaparak taramalarınızı ve frekans seanslarınızı gerçekleştirebilirsiniz.\n\nİyi çalışmalar dileriz.`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  const handleOpenApproveDealer = (user: UserMember) => {
    setSelectedDealerUser(user);
    const suggestedCode = `AURA-BAYI-${Math.floor(1000 + Math.random() * 9000)}`;
    setDealerApproveCode(suggestedCode);
    setDealerApproveRate(20);
    setShowApproveDealerModal(true);
  };

  const handleConfirmApproveDealer = async () => {
    if (!selectedDealerUser) return;
    setIsDealerProcessing(true);
    try {
      const res = await adminApproveDealer(selectedDealerUser.uid, dealerApproveCode, Number(dealerApproveRate) || 20);
      if (res.success) {
        setActionSuccessMsg(`${selectedDealerUser.fullName} bayilik başvurusu ONAYLANDI (${dealerApproveCode} kodu atandı).`);
        setShowApproveDealerModal(false);
        setSelectedDealerUser(null);
        await loadMembers();
        await loadResellersAndCommissions();
        onMemberUpdated?.();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err?.message || 'Onay işlemi sırasında hata oluştu.');
    } finally {
      setIsDealerProcessing(false);
    }
  };

  const handleOpenRejectDealer = (user: UserMember) => {
    setSelectedDealerUser(user);
    setDealerRejectReason('Şirket veya vergi bilgileri yetersiz / doğrulanamadı.');
    setShowRejectDealerModal(true);
  };

  const handleConfirmRejectDealer = async () => {
    if (!selectedDealerUser) return;
    setIsDealerProcessing(true);
    try {
      const res = await adminRejectDealer(selectedDealerUser.uid, dealerRejectReason);
      if (res.success) {
        setActionSuccessMsg(`${selectedDealerUser.fullName} bayilik başvurusu reddedildi.`);
        setShowRejectDealerModal(false);
        setSelectedDealerUser(null);
        await loadMembers();
        onMemberUpdated?.();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err?.message || 'Red işlemi sırasında hata oluştu.');
    } finally {
      setIsDealerProcessing(false);
    }
  };

  const getDealerWhatsAppNotifyUrl = (user: UserMember, status: 'approved' | 'rejected', code?: string, reason?: string) => {
    const rawPhone = user.dealerDetails?.whatsapp || user.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    let msg = '';
    if (status === 'approved') {
      msg = `Sayın ${user.fullName} (${user.dealerDetails?.companyName || 'Yetkili'}),\n\nAKN AuraBio Frekans Bayilik başvurunuz onaylanmıştır!\n\nBayi Kodunuz: ${code || user.dealerDetails?.referralCode || 'AURA-BAYI-XXXX'}\n\nArtık Bayi Panelinize giriş yaparak özel bayi indirimlerinden yararlanabilir, danışanlarınızı kaydedebilir ve komisyon raporlarınızı takip edebilirsiniz.\n\nAuraBio Ailesine Hoş Geldiniz.`;
    } else {
      msg = `Sayın ${user.fullName} (${user.dealerDetails?.companyName || 'Yetkili'}),\n\nAKN AuraBio Frekans Bayilik başvurunuz incelenmiş olup şu an için onaylanamamıştır.\nGerekçe: ${reason || 'Bilgi eksikliği'}\n\nDetaylı bilgi için merkezimizle iletişime geçebilirsiniz.`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const access = checkMemberAccess(m);
    const matchesSearch = 
      (m.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.phone || '').includes(searchQuery) ||
      (m.uid || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return !access.isAllowed && !access.isExpired;
    if (statusFilter === 'active') return access.isAllowed;
    if (statusFilter === 'expired') return access.isExpired;
    return true;
  });

  const isFullPageAdmin = isAuthenticated;
  const pendingDealerCount = members.filter((member) =>
    (member.isDealerRequested || member.dealerStatus === 'pending') &&
    member.dealerStatus !== 'approved' &&
    member.dealerStatus !== 'rejected'
  ).length;
  const adminModuleCounts: Partial<Record<AdminTab, number>> = {
    members: members.length,
    packages: packages.length,
    resellers: resellers.length,
    dealers: pendingDealerCount || members.filter((member) =>
      member.isDealerRequested ||
      member.role === 'dealer' ||
      member.dealerStatus === 'pending' ||
      member.dealerStatus === 'approved' ||
      member.dealerStatus === 'rejected'
    ).length,
    devices: deviceSessions.length,
    invoices: invoices.length,
    scans: scanRecords.length,
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in ${
        isFullPageAdmin ? 'p-0' : 'p-3 sm:p-6'
      }`}
    >
      <div
        className={`relative w-full bg-slate-900 overflow-hidden flex flex-col ${
          isFullPageAdmin
            ? 'max-w-none h-screen max-h-screen rounded-none border-0'
            : 'max-w-5xl border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/60 max-h-[92vh]'
        }`}
      >
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">7 Nefis Kariyer Piramidi, Organizasyon &amp; SQL Yönetimi</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  Canlı Supabase &amp; SQL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Yönetici: <strong className="text-emerald-300">Sistem Yöneticisi</strong> ({BANK_INFO.bankName} - IBAN: TR32...775122)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => setShowDataBackupModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Tüm sistem verilerini indir veya geri yükle"
                >
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Veri / Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Sistemdeki tüm simülasyon ve test verilerini sıfırla"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sistemi Sıfırla</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher if Authenticated */}
        {isAuthenticated && (
          <div className="hidden">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAdminTab('monoline_sql')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'monoline_sql'
                    ? 'bg-gradient-to-r from-indigo-600/40 via-emerald-600/30 to-teal-600/30 text-emerald-200 border border-emerald-400/60 shadow-sm'
                    : 'text-emerald-300 hover:text-white bg-emerald-950/40 border border-emerald-500/30'
                }`}
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>7 Nefis Kariyer Piramidi, Organizasyon &amp; SQL Yönetimi</span>
              </button>
              <div className="hidden">
              <button
                onClick={() => setAdminTab('members')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'members'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Üye & Ödeme Onayları ({members.length})</span>
              </button>

              <button
                onClick={() => setAdminTab('packages')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'packages'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Package className="w-4 h-4 text-teal-400" />
                <span>Dinamik Paket Yönetimi ({packages.length})</span>
              </button>

              <button
                onClick={() => setAdminTab('resellers')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'resellers'
                    ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Bayi & Komisyon Yönetimi ({resellers.length})</span>
                {commissions.filter(c => c.status === 'pending').length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px]">
                    {commissions.filter(c => c.status === 'pending').length} Bekleyen
                  </span>
                )}
              </button>

              <button
                onClick={() => setAdminTab('dealers')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'dealers'
                    ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>Bayi Başvuruları</span>
                {members.filter(m => (m.isDealerRequested || m.dealerStatus === 'pending') && m.dealerStatus !== 'approved' && m.dealerStatus !== 'rejected').length > 0 ? (
                  <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-300 border border-amber-500/60 rounded-full text-[10px] animate-pulse">
                    {members.filter(m => (m.isDealerRequested || m.dealerStatus === 'pending') && m.dealerStatus !== 'approved' && m.dealerStatus !== 'rejected').length} Yeni
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">
                    ({members.filter(m => m.isDealerRequested || m.role === 'dealer' || m.dealerStatus === 'pending' || m.dealerStatus === 'approved' || m.dealerStatus === 'rejected').length})
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setAdminTab('devices');
                  loadDeviceSessions();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'devices'
                    ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Cihaz Demo Yönetimi</span>
              </button>

              <button
                onClick={() => setAdminTab('invoices')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'invoices'
                    ? 'bg-gradient-to-r from-violet-600/30 via-purple-600/30 to-teal-600/30 text-purple-300 border border-purple-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Receipt className="w-4 h-4 text-purple-400" />
                <span>Dijital E-Fatura Yönetimi ({invoices.length})</span>
                {invoices.filter(i => i.status === 'sent_whatsapp').length > 0 && (
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px]">
                    {invoices.filter(i => i.status === 'sent_whatsapp').length} WhatsApp
                  </span>
                )}
              </button>

              <button
                onClick={() => setAdminTab('campaigns')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'campaigns'
                    ? 'bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-amber-600/30 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Kampanyalar & Fırsatlar</span>
              </button>

              <button
                onClick={() => setAdminTab('site_content')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'site_content'
                    ? 'bg-gradient-to-r from-emerald-600/30 via-teal-600/30 to-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>Site İçerikleri</span>
              </button>

              <button
                onClick={() => setAdminTab('ethics_guidelines')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'ethics_guidelines'
                    ? 'bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-amber-600/30 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Etik Kurallar</span>
              </button>

              <button
                onClick={() => {
                  setAdminTab('scans');
                  loadScanRecords(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminTab === 'scans'
                    ? 'bg-gradient-to-r from-rose-600/30 via-red-600/30 to-rose-600/30 text-rose-300 border border-rose-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Clock className="w-4 h-4 text-rose-400" />
                <span>Tarama Kayıtları ({scanRecords.length})</span>
              </button>

              </div>
            </div>

            {adminTab === 'devices' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={loadDeviceSessions}
                  disabled={deviceLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Cihaz Listesini Yenile"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${deviceLoading ? 'animate-spin' : ''}`} />
                  <span>Cihazları Yenile</span>
                </button>
              </div>
            )}

            {adminTab === 'invoices' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCreateCustomInvoice}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Dijital Fatura Kes</span>
                </button>
              </div>
            )}

            {adminTab === 'packages' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCreatePackage}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Paket Ekle</span>
                </button>
                <button
                  onClick={handleResetPackages}
                  disabled={pkgSaveLoading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Varsayılan Paketlere Sıfırla"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span className="hidden sm:inline">Varsayılana Sıfırla</span>
                </button>
              </div>
            )}

            {adminTab === 'resellers' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCreateReseller}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Bayi Tanımla</span>
                </button>
                <button
                  onClick={loadResellersAndCommissions}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  title="Bayi Verilerini Yenile"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}

            {adminTab === 'dealers' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenManualDealerModal}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Bayi Ekle (Manuel)</span>
                </button>
                <button
                  onClick={handleOpenCreateDealerPkg}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-950/50 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Bayilik Paketi Ekle</span>
                </button>
                <button
                  onClick={loadMembers}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  title="Bayi Verilerini Yenile"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Login Barrier if not authenticated */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-100">Yönetici Girişi</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Üyelerin ödemelerini onaylamak, paketleri yönetmek ve fiyatları düzenlemek için giriş yapınız.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Yönetici E-Postası:</span>
                </label>
                <input
                  type="email"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder="psikologabdulkadirkan@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Yönetici Şifresi:</span>
                </label>
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs text-slate-100"
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-300 text-center font-semibold">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Yönetici Olarak Giriş Yap</span>
              </button>
            </form>
          </div>
        ) : (
          /* Main Admin Workspace */
          <div className="flex-1 min-h-0 flex flex-col w-full h-full">
            {isSinglePageView ? (
              /* BÜYÜK TEK SAYFA PANEL (100% Full Width, Prominent Back Button) */
              <div className="flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden">
                {/* Sticky Top Header with Geri Butonu and Module Info */}
                <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-800 shadow-md shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsSinglePageView(false)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-emerald-400/50"
                      title="Yönetim modülleri ana menüsüne dön"
                    >
                      <ArrowLeft className="w-4 h-4 text-white" />
                      <span>← Yönetim Menüsüne Dön</span>
                    </button>

                    <div className="h-6 w-px bg-slate-700 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {adminTab === 'monoline_sql' ? (
                          <Award className="h-4 w-4" />
                        ) : (
                          (() => {
                            const IconComp = ADMIN_MODULE_LINKS.find(l => l.id === adminTab)?.icon || ShieldCheck;
                            return <IconComp className="h-4 w-4" />;
                          })()
                        )}
                      </span>
                      <div>
                        <h2 className="text-sm font-black text-white">
                          {adminTab === 'monoline_sql'
                            ? '7 Nefis Kariyer Piramidi, Organizasyon & SQL Yönetimi'
                            : ADMIN_MODULE_LINKS.find(l => l.id === adminTab)?.label || 'Yönetim Modülü'}
                        </h2>
                        <span className="text-[10px] text-emerald-400 font-medium">Büyük Tek Sayfa Panel &bull; Supabase Canlı</span>
                      </div>
                    </div>
                  </div>

                  {/* Module quick jumper pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenSmartAccounting) onOpenSmartAccounting();
                        else window.dispatchEvent(new CustomEvent('open-smart-accounting'));
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-400" />
                      <span>Akıllı Muhasebe (CFO)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openSinglePageSection('monoline_sql')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        adminTab === 'monoline_sql'
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 shadow-xs'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                      }`}
                    >
                      Monoline MLM
                    </button>
                    {ADMIN_MODULE_LINKS.map(link => (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => openSinglePageSection(link.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          adminTab === link.id
                            ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 shadow-xs'
                            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                        }`}
                      >
                        {link.label}
                        {adminModuleCounts[link.id] !== undefined && (
                          <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-300">
                            {adminModuleCounts[link.id]}
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsDocumentsOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-slate-900/80 hover:bg-slate-800 text-fuchsia-300 border border-slate-700/60 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>Dökümanlar</span>
                    </button>
                  </div>
                </div>

                {/* Main Content Area in Large Single Page View */}
                <main className="w-full flex-1 overflow-auto overscroll-contain p-4 sm:p-6 space-y-6">
            {/* Notification Banner */}
            {actionSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 flex items-center justify-between animate-fade-in shadow-lg">
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {actionSuccessMsg}
                </span>
                <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* TAB 0: UNILEVEL & MONOLINE AĞAÇ VE ORGANİZASYON YÖNETİMİ */}
            {adminTab === 'organization_tree' && (
              <UnilevelOrganizationTreePanel
                mode="admin"
                embedded={true}
                onBack={() => setIsSinglePageView(false)}
                onMemberUpdated={onMemberUpdated}
              />
            )}

            {/* TAB 1: MEMBERS MANAGEMENT */}
            {adminTab === 'members' && (
              <div className="space-y-6">
                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="İsim, E-posta veya Telefon Ara..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tümü ({members.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Onay Bekleyenler ({members.filter(m => !m.isAllowed).length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('active')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Aktif ({members.filter(m => m.isAllowed).length})
                    </button>
                    <button
                      onClick={loadMembers}
                      disabled={isLoading}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
                      title="Listeyi Yenile"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Member Cards List */}
                <div className="space-y-3.5">
                  {filteredMembers.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-xs rounded-2xl bg-slate-950/40 border border-slate-850">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Arama kriterlerine uygun üye bulunamadı.' 
                        : 'Henüz kayıtlı üye bulunmamaktadır.'}
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const access = checkMemberAccess(member);

                      const memberCart = member.cart || [{ packageId: member.selectedPackage || 'silver-dealer', quantity: 1 }];
                      let cartTotalPrice = 0;
                      let cartTotalCredits = 0;

                      const cartBadges = memberCart.map((c) => {
                        const p = packages.find(pkg => pkg.id === c.packageId) || DEFAULT_MEMBERSHIP_PACKAGES.find(pkg => pkg.id === c.packageId);
                        if (!p) return null;
                        if (!p.isDemo) {
                          cartTotalPrice += (p.price * c.quantity);
                          cartTotalCredits += ((p.scanCredits || 30) * c.quantity);
                        }
                        return `${c.quantity}x ${p.name}`;
                      }).filter(Boolean);

                      const currentCredits = member.creditsBalance ?? (access.isAllowed ? 100 : 0);

                      return (
                        <div
                          key={member.uid}
                          className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5 shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-slate-100">
                                  {member.fullName}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                  {member.uid}
                                </span>
                                
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-extrabold flex items-center gap-1">
                                  <Coins className="w-3 h-3 text-emerald-400" />
                                  <span>{currentCredits} SEANS KREDİSİ</span>
                                </span>

                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  access.isAllowed 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                    : access.isExpired
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}>
                                  {access.statusBadge}
                                </span>

                                {member.demoUsed && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    <span>Demo Kullanıldı</span>
                                  </span>
                                )}

                                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-semibold flex items-center gap-1">
                                  <ShoppingCart className="w-3 h-3 text-teal-400" />
                                  <span>Sepet: <strong>{cartBadges.join(', ')} ({cartTotalPrice.toLocaleString('tr-TR')} $ • +{cartTotalCredits} Kredi)</strong></span>
                                </span>

                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-indigo-400" />
                                  <span>Bayi: {member.referredByCode || member.resellerId || 'Doğrudan Kayıt'}</span>
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{member.email}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{member.phone}</span>
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <Calendar className="w-3 h-3 text-slate-600" />
                                  <span>Kayıt: {new Date(member.createdAt).toLocaleDateString('tr-TR')}</span>
                                </span>
                              </div>
                            </div>

                            <div className="text-left sm:text-right">
                              <div className={`text-xs font-bold font-mono ${access.isAllowed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {access.remainingText}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {currentCredits > 0 ? `${currentCredits} Seans Yapılabilir` : 'Kredi Bitti / Yükleme Gerekli'}
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-850 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {cartTotalCredits > 0 && (
                                <button
                                  onClick={() => handleApproveCartCredits(member, cartTotalCredits, cartTotalPrice)}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Sepet Siparişini Onayla (+{cartTotalCredits} Kredi • {cartTotalPrice.toLocaleString('tr-TR')} $)</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleAddCredits(member.uid, 30)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Hesaba 30 Seans Kredisi Yükle"
                              >
                                <Plus className="w-3 h-3 text-emerald-400" />
                                <span>+30 Kredi</span>
                              </button>

                              <button
                                onClick={() => handleAddCredits(member.uid, 100)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Hesaba 100 Seans Kredisi Yükle"
                              >
                                <Plus className="w-3 h-3 text-emerald-400" />
                                <span>+100 Kredi</span>
                              </button>

                              <button
                                onClick={() => handleAddCredits(member.uid, 300)}
                                className="px-2.5 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 border border-teal-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Hesaba 300 Seans Kredisi Yükle"
                              >
                                <Plus className="w-3 h-3 text-teal-400" />
                                <span>+300 Kredi</span>
                              </button>

                              <button
                                onClick={() => handleAddCredits(member.uid, 1000)}
                                className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Hesaba 1000 Seans Kredisi Yükle"
                              >
                                <Plus className="w-3 h-3 text-purple-400" />
                                <span>+1.000 Kredi</span>
                              </button>

                              <button
                                onClick={() => {
                                  setCreditTargetMember(member);
                                  setCustomCreditInput('50');
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="İstediğiniz Miktarda Özel Kredi Tanımlayın"
                              >
                                <Coins className="w-3 h-3 text-amber-400" />
                                <span>+Özel Kredi...</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditMemberSponsorship(member)}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Sponsoru, Sol/Sağ Kolu, Kariyeri ve Üyelik Bilgilerini Değiştir"
                              >
                                <GitBranch className="w-3 h-3 text-indigo-400" />
                                <span>Sponsor &amp; Kol Düzenle</span>
                              </button>

                              <button
                                onClick={() => handleSetAccess(member.uid, true, null)}
                                className="px-2.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all cursor-pointer"
                                title="Limitsiz VIP Giriş Yetkisi Ver"
                              >
                                VIP Onayla
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              {member.phone && (
                                <a
                                  href={getWhatsAppNotifyUrl(member, `${currentCredits} Seans Kredisi`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Üyeye WhatsApp ile Bilgi Ver"
                                >
                                  <Send className="w-3 h-3 text-emerald-400" />
                                  <span>WhatsApp Bilgilendir</span>
                                </a>
                              )}

                              {access.isAllowed && (
                                <button
                                  onClick={() => handleSetAccess(member.uid, false)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-500/40 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                                  title="Üyeliği Askıya Al"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Askıya Al</span>
                                </button>
                              )}

                              <button
                                onClick={() => setMemberToDelete(member)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-rose-100 border border-rose-500/50 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-rose-950/40 cursor-pointer"
                                title="Üyeyi Veritabanından Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Üyeyi Sil</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PACKAGES MANAGEMENT */}
            {adminTab === 'packages' && (
              <div className="space-y-6">
                
                {/* Intro notice */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
                      <Coins className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">Kredili Bayilik ve Seans Paketleri Yönetimi</h3>
                      <p className="text-xs text-slate-400">
                        Tüm üyelikler kredi havuzu sistemine dönüştürülmüştür. Paketleri düzenleyebilir, kredi miktarlarını değiştirebilir veya yeni bayilik paketleri ekleyebilirsiniz.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetPackages}
                      disabled={pkgSaveLoading}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Varsayılan 5 Kademeli Kredili Bayilik Paketlerine Sıfırla"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Standart Paketlere Sıfırla</span>
                    </button>

                    <button
                      onClick={handleOpenCreatePackage}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/60 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Yeni Bayilik Paketi Ekle</span>
                    </button>
                  </div>
                </div>

                {/* Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-5 rounded-2xl bg-slate-950/90 border transition-all flex flex-col justify-between gap-4 shadow-md ${
                        pkg.popular
                          ? 'border-amber-500/60 shadow-amber-950/20 ring-1 ring-amber-500/30'
                          : 'border-slate-800 hover:border-teal-500/40'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-100">{pkg.name}</h4>
                              {pkg.badge && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  pkg.popular ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {pkg.badge}
                                </span>
                              )}
                            </div>

                            {pkg.targetAudience && (
                              <div className="text-[11px] text-amber-300/90 font-medium mt-0.5 flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-amber-400" />
                                <span>{pkg.targetAudience}</span>
                              </div>
                            )}

                            <div className="text-xs text-slate-300 mt-2 flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 font-mono font-extrabold text-emerald-400 text-sm">
                                <Coins className="w-4 h-4 text-emerald-400" />
                                <span>{pkg.scanCredits || 30} Seans Kredisi</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                                <span className="font-bold text-slate-200">{pkg.priceText || `${pkg.price.toLocaleString('tr-TR')} $`}</span>
                                {pkg.unitCostText && (
                                  <span className="text-teal-400 text-[11px]">({pkg.unitCostText})</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenEditPackage(pkg)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Paketi Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPackageToDelete(pkg)}
                              className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white transition-colors cursor-pointer"
                              title="Paketi Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-850 space-y-1.5 text-xs text-slate-300">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Özellikler ({pkg.features?.length || 0})
                          </span>
                          {(pkg.features || []).map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                              <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-850">
                        <span>ID: {pkg.id}</span>
                        <span className="text-emerald-400 font-semibold">{pkg.scanCredits || 30} Seans Kredili</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 3: RESELLERS & AFFILIATE MANAGEMENT */}
            {adminTab === 'resellers' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Admin Reseller Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold">Kayıtlı Bayi Sayısı</span>
                      <Building2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
                      {resellers.length} Bayi
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {resellers.filter(r => r.status === 'active').length} Aktif • {resellers.filter(r => r.status === 'suspended').length} Askıda
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-950 border-2 border-emerald-500/50 space-y-1.5 shadow-lg shadow-emerald-950/40">
                    <div className="flex items-center justify-between text-emerald-300">
                      <span className="text-xs font-bold">Toplam Bayi Kredi Havuzu</span>
                      <Coins className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                      {resellers.reduce((sum, r) => sum + (r.creditsBalance ?? 100), 0)} <span className="text-xs font-sans text-emerald-300">Seans</span>
                    </div>
                    <div className="text-[10px] text-emerald-300/80">
                      Bayilerin sistemdeki kullanılabilir kredisi
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold">Toplam Bayi Cirosu</span>
                      <TrendingUp className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-teal-300 font-mono">
                      {resellers.reduce((sum, r) => sum + (r.totalSalesAmount || 0), 0).toLocaleString('tr-TR')} $
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Bayiler üzerinden gerçekleşen satışlar
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5">
                    <div className="flex items-center justify-between text-emerald-300">
                      <span className="text-xs font-semibold">Toplam Hak Edilen Komisyon</span>
                      <Award className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-300 font-mono">
                      {resellers.reduce((sum, r) => sum + (r.totalEarnings || 0), 0).toLocaleString('tr-TR')} $
                    </div>
                    <div className="text-[10px] text-emerald-400/80">
                      Ödenen: {resellers.reduce((sum, r) => sum + (r.paidEarnings || 0), 0).toLocaleString('tr-TR')} $
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 space-y-1.5 col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="text-xs font-semibold">Bekleyen Komisyon Talebi</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-amber-300 font-mono">
                      {commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0).toLocaleString('tr-TR')} $
                    </div>
                    <div className="text-[10px] text-amber-400/80">
                      {commissions.filter(c => c.status === 'pending').length} Onay Bekleyen İşlem
                    </div>
                  </div>
                </div>

                {/* Subview Selector */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setResellerSubView('list')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        resellerSubView === 'list'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Bayiler Listesi ({resellers.length})</span>
                    </button>

                    <button
                      onClick={() => setResellerSubView('credits')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        resellerSubView === 'credits'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/60'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bayi Kredi Kullanımı & Havuz Yönetimi</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-mono font-bold border border-emerald-500/40">
                        {resellers.reduce((sum, r) => sum + (r.creditsBalance ?? 100), 0)} Kredi
                      </span>
                    </button>

                    <button
                      onClick={() => setResellerSubView('commissions')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        resellerSubView === 'commissions'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Komisyon Onayları & İşlemler ({commissions.length})</span>
                      {commissions.filter(c => c.status === 'pending').length > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-bold">
                          {commissions.filter(c => c.status === 'pending').length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setResellerSubView('orders')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        resellerSubView === 'orders'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Bayi Paket & Kredi Satın Alma Talepleri ({dealerOrders.length})</span>
                      {dealerOrders.filter(o => o.status === 'pending').length > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-bold animate-pulse">
                          {dealerOrders.filter(o => o.status === 'pending').length} Onay Bekliyor
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* RESELLERS SUBVIEW: LIST */}
                {resellerSubView === 'list' && (
                  <div className="space-y-4">
                    {/* Search & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={resellerSearch}
                          onChange={(e) => setResellerSearch(e.target.value)}
                          placeholder="Bayi Adı, Kod (AURA-BAYI-...), E-Posta veya Telefon Ara..."
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                        />
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      </div>

                      <button
                        onClick={handleOpenCreateReseller}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/60 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Yeni Bayi Ekle</span>
                      </button>
                    </div>

                    {/* Reseller Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resellers
                        .filter(r => {
                          if (!resellerSearch.trim()) return true;
                          const q = resellerSearch.toLowerCase();
                          return (
                            (r.resellerName || '').toLowerCase().includes(q) ||
                            (r.referralCode || '').toLowerCase().includes(q) ||
                            (r.email || '').toLowerCase().includes(q) ||
                            (r.phone || '').includes(q)
                          );
                        })
                        .map((r) => (
                            <div
                            key={r.uid}
                            className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 shadow-md flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div 
                                  onClick={() => handleOpenDealerDetails(r)}
                                  className="cursor-pointer group flex-1"
                                  title="Tüm Bayi Detaylarını Aç"
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                                      <span>{r.resellerName}</span>
                                      <Eye className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                                      {r.referralCode}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      r.status === 'active' 
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    }`}>
                                      {r.status === 'active' ? 'Aktif' : 'Askıda'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                                    <span>{r.email}</span>
                                    {r.phone && <span>• {r.phone}</span>}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenDealerDetails(r)}
                                    className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
                                    title="Tüm Bayi Detaylarını & Raporlarını Görüntüle"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditReseller(r)}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Bayiyi Düzenle & Komisyon Oranını Güncelle"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setResellerToDelete(r)}
                                    className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white transition-colors cursor-pointer"
                                    title="Bayiyi Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Prominent Credits & Balance Bar */}
                              <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                    <Coins className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 block font-medium">Kalan Seans Kredisi</span>
                                    <span className="text-sm font-black font-mono text-emerald-400">
                                      {r.creditsBalance ?? 100} <span className="text-[11px] font-sans font-bold text-slate-300">Seans</span>
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleOpenResellerCreditModal(r, 'add')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md shadow-emerald-950/50 flex items-center gap-1 cursor-pointer transition-all"
                                  title="Bayiye Kredi Ekle veya Düzenle"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Kredi Yönet</span>
                                </button>
                              </div>

                              {/* Financial Overview for this reseller */}
                              <div 
                                onClick={() => handleOpenDealerDetails(r)}
                                className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-850 hover:border-emerald-500/30 text-center cursor-pointer transition-colors"
                                title="Detayları İncele"
                              >
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Komisyon Oranı</span>
                                  <span className="text-xs font-bold text-emerald-400">%{r.commissionRate || 20}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Toplam Ciro</span>
                                  <span className="text-xs font-bold text-slate-200">{(r.totalSalesAmount || 0).toLocaleString('tr-TR')} $</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Toplam Komisyon</span>
                                  <span className="text-xs font-bold text-teal-300">{(r.totalEarnings || 0).toLocaleString('tr-TR')} $</span>
                                </div>
                              </div>

                              {/* Bank Info & Action Button */}
                              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-850 text-[11px] text-slate-400 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Banka & Hesap:</span>
                                  <span className="text-slate-200 font-medium">{r.bankInfo?.bankName || 'Banka Belirtilmedi'} ({r.bankInfo?.accountHolder || r.resellerName})</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">IBAN:</span>
                                  <span className="font-mono text-emerald-400/90 select-all">{r.bankInfo?.iban || 'Belirtilmedi'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-850 gap-2">
                              <button
                                onClick={() => handleOpenDealerDetails(r)}
                                className="w-full py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Tüm Bayi Detaylarını & Hareketlerini Gör</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* RESELLERS SUBVIEW: DETAILED CREDITS POOL & AUDIT LOGS */}
                {resellerSubView === 'credits' && (
                  <div className="space-y-6">
                    {/* Header & Quick Summary */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-950 to-teal-950/80 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/70 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 flex items-center justify-center shadow-inner">
                            <Coins className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                              <span>Bayi Kredi Havuzu & Detaylı Kullanım Kontrolü</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                Yönetici Denetimi
                              </span>
                            </h3>
                            <p className="text-xs text-emerald-300/80">
                              Bayilerin mevcut kalan tarama kredilerini detaylıca takip edin, tek tıkla kredi tanımlayın veya düzeltme yapın.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              await loadResellersAndCommissions();
                              setActionSuccessMsg('Bayi kredileri ve denetim logları yenilendi.');
                              setTimeout(() => setActionSuccessMsg(null), 3000);
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                            title="Verileri Yenile"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Yenile</span>
                          </button>
                        </div>
                      </div>

                      {/* 4-Stat Micro Dashboard */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                          <span className="text-[11px] text-slate-400 block font-medium">Toplam Kalan Bayi Kredisi</span>
                          <span className="text-2xl font-black font-mono text-emerald-400">
                            {resellers.reduce((sum, r) => sum + (r.creditsBalance ?? 100), 0)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">Sistemdeki Aktif Havuz</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                          <span className="text-[11px] text-slate-400 block font-medium">Aktif Bayi Sayısı</span>
                          <span className="text-2xl font-black font-mono text-teal-300">
                            {resellers.filter(r => r.status === 'active').length}
                          </span>
                          <span className="text-[10px] text-slate-500 block">/ {resellers.length} Toplam Bayi</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                          <span className="text-[11px] text-slate-400 block font-medium">Kayıtlı Kredi Hareketi</span>
                          <span className="text-2xl font-black font-mono text-amber-400">
                            {creditLogs.length}
                          </span>
                          <span className="text-[10px] text-slate-500 block">Denetim & Seans Kaydı</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                          <span className="text-[11px] text-slate-400 block font-medium">Kritik Seviye (&lt;10 Kredi)</span>
                          <span className="text-2xl font-black font-mono text-rose-400">
                            {resellers.filter(r => (r.creditsBalance ?? 100) < 10).length}
                          </span>
                          <span className="text-[10px] text-slate-500 block">Kredisi Azalan Bayiler</span>
                        </div>
                      </div>
                    </div>

                    {/* DEALERS CREDITS MONITORING & MANAGEMENT TABLE */}
                    <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                          <Coins className="w-4 h-4" />
                          <span>Bayi Bazında Kredi Durumu & Müdahale Tablosu</span>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative w-56">
                            <input
                              type="text"
                              value={resellerSearch}
                              onChange={(e) => setResellerSearch(e.target.value)}
                              placeholder="Bayi veya Kod Ara..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                          </div>

                          <select
                            value={dealerCreditFilter}
                            onChange={(e) => setDealerCreditFilter(e.target.value as any)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none font-medium cursor-pointer"
                          >
                            <option value="all">Tüm Bakiyeler</option>
                            <option value="low">Kritik (&lt; 10 Kredi)</option>
                            <option value="medium">Orta (10 - 50 Kredi)</option>
                            <option value="high">Yüksek (&gt; 50 Kredi)</option>
                          </select>
                        </div>
                      </div>

                      {/* Dealers Table */}
                      <div className="overflow-x-auto rounded-2xl border border-slate-800">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                              <th className="p-3.5">Bayi / Firma</th>
                              <th className="p-3.5">Yetkili & İletişim</th>
                              <th className="p-3.5">Referans Kodu</th>
                              <th className="p-3.5 text-center">Mevcut Kalan Kredi</th>
                              <th className="p-3.5 text-center">Durum</th>
                              <th className="p-3.5 text-center">Kayıtlı Danışan</th>
                              <th className="p-3.5 text-right">Yönetici Kredi İşlemleri</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {resellers
                              .filter(r => {
                                if (resellerSearch.trim()) {
                                  const q = resellerSearch.toLowerCase();
                                  const match = 
                                    (r.resellerName || '').toLowerCase().includes(q) ||
                                    (r.referralCode || '').toLowerCase().includes(q) ||
                                    (r.email || '').toLowerCase().includes(q);
                                  if (!match) return false;
                                }
                                const cred = r.creditsBalance ?? 100;
                                if (dealerCreditFilter === 'low') return cred < 10;
                                if (dealerCreditFilter === 'medium') return cred >= 10 && cred <= 50;
                                if (dealerCreditFilter === 'high') return cred > 50;
                                return true;
                              })
                              .map(r => {
                                const cred = r.creditsBalance ?? 100;
                                const isLow = cred < 10;
                                const isZero = cred === 0;

                                return (
                                  <tr key={r.uid} className="hover:bg-slate-900/60 transition-colors">
                                    <td className="p-3.5 font-bold text-slate-100">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                                          {r.resellerName.slice(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                          <div>{r.resellerName}</div>
                                          <div className="text-[10px] text-slate-500 font-normal">{r.businessName || 'Yetkili Bayi'}</div>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="p-3.5">
                                      <div className="font-medium text-slate-200">{r.fullName || r.resellerName}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">{r.email}</div>
                                      {r.phone && <div className="text-[10px] text-emerald-400 font-mono">{r.phone}</div>}
                                    </td>

                                    <td className="p-3.5">
                                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-teal-300 font-mono font-bold text-[11px]">
                                        {r.referralCode}
                                      </span>
                                    </td>

                                    <td className="p-3.5 text-center">
                                      <div className="inline-flex flex-col items-center">
                                        <span className={`px-3 py-1 rounded-xl font-mono font-black text-xs border ${
                                          isZero
                                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                            : isLow
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                        }`}>
                                          {cred} Seans
                                        </span>
                                        {isLow && !isZero && (
                                          <span className="text-[9px] text-amber-400 font-bold mt-0.5">Kritik Bakiye</span>
                                        )}
                                        {isZero && (
                                          <span className="text-[9px] text-rose-400 font-bold mt-0.5">Tükendi</span>
                                        )}
                                      </div>
                                    </td>

                                    <td className="p-3.5 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        r.status === 'active' 
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      }`}>
                                        {r.status === 'active' ? 'Aktif' : 'Askıda'}
                                      </span>
                                    </td>

                                    <td className="p-3.5 text-center font-mono font-bold text-slate-200">
                                      {r.totalReferredUsers || 0} Danışan
                                    </td>

                                    <td className="p-3.5 text-right">
                                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                        <button
                                          onClick={() => handleOpenResellerCreditModal(r, 'add')}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                                          title="Hızlı Kredi Yükle"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Kredi Ekle</span>
                                        </button>

                                        <button
                                          onClick={() => handleOpenResellerCreditModal(r, 'deduct')}
                                          className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-500/30 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                                          title="Kredi Düşür"
                                        >
                                          <span>- Düş</span>
                                        </button>

                                        <button
                                          onClick={() => handleOpenResellerCreditModal(r, 'set')}
                                          className="px-2.5 py-1 rounded-lg bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-500/40 font-bold text-[10px] cursor-pointer transition-all"
                                          title="Bakiyeyi Doğrudan Ayarla"
                                        >
                                          <span>Ayarla</span>
                                        </button>

                                        <button
                                          onClick={() => handleOpenDealerDetails(r)}
                                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                          title="Tüm Bayi Detaylarını Aç"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>Detay</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}

                            {resellers.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                                  Sistemde kayıtlı bayi bulunmuyor.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* REAL-TIME CREDIT AUDIT LOGS / USAGE TIMELINE */}
                    <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                          <Clock className="w-4 h-4" />
                          <span>Canlı Kredi Hareketleri & Seans Kullanım Günlüğü (Audit Logs)</span>
                        </div>

                        {/* Search and Filters for Audit Log */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative w-56">
                            <input
                              type="text"
                              value={creditLogSearch}
                              onChange={(e) => setCreditLogSearch(e.target.value)}
                              placeholder="Log No, Bayi veya Danışan..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                          </div>

                          <select
                            value={creditLogTypeFilter}
                            onChange={(e) => setCreditLogTypeFilter(e.target.value as any)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none font-medium cursor-pointer"
                          >
                            <option value="all">Tüm Hareketler</option>
                            <option value="scan_usage">Tarama Seansı Harcaması (-)</option>
                            <option value="purchase">Paket Satın Alma (+)</option>
                            <option value="admin_add">Yönetici Kredi Yükleme (+)</option>
                            <option value="admin_deduct">Yönetici Kredi Düşümü (-)</option>
                            <option value="admin_set">Yönetici Bakiye Sabitleme (=)</option>
                            <option value="bonus">Bonus Kredi (+)</option>
                            <option value="initial">Başlangıç Kredisi</option>
                          </select>
                        </div>
                      </div>

                      {/* Audit Log Table */}
                      <div className="overflow-x-auto rounded-2xl border border-slate-800">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                              <th className="p-3.5">İşlem ID & Tarih</th>
                              <th className="p-3.5">Bayi / Kurum</th>
                              <th className="p-3.5">İşlem Türü</th>
                              <th className="p-3.5 text-center">Kredi Değişimi</th>
                              <th className="p-3.5 text-center">Bakiye Değişimi</th>
                              <th className="p-3.5">Açıklama / Denetim Detayı</th>
                              <th className="p-3.5 text-right">İşlemi Yapan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850 font-mono">
                            {creditLogs
                              .filter(log => {
                                if (creditLogTypeFilter !== 'all' && log.type !== creditLogTypeFilter) {
                                  return false;
                                }
                                if (creditLogSearch.trim()) {
                                  const q = creditLogSearch.toLowerCase();
                                  const match = 
                                    (log.id || '').toLowerCase().includes(q) ||
                                    (log.resellerName || '').toLowerCase().includes(q) ||
                                    (log.description || '').toLowerCase().includes(q) ||
                                    (log.performedBy || '').toLowerCase().includes(q);
                                  if (!match) return false;
                                }
                                return true;
                              })
                              .map(log => {
                                const isPositive = log.amount > 0;
                                const isZero = log.amount === 0;

                                return (
                                  <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                                    <td className="p-3.5 text-slate-400">
                                      <div className="text-[11px] font-bold text-teal-300 select-all">{log.id}</div>
                                      <div className="text-[10px] text-slate-500 font-sans">
                                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                      </div>
                                    </td>

                                    <td className="p-3.5 font-sans">
                                      <div className="font-bold text-slate-100">{log.resellerName || 'Bayi'}</div>
                                      <div className="text-[10px] text-slate-500 font-mono">{log.resellerId.slice(0, 10)}...</div>
                                    </td>

                                    <td className="p-3.5 font-sans">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                        log.type === 'scan_usage'
                                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                          : log.type === 'purchase'
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                          : log.type === 'admin_set'
                                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                          : log.type === 'admin_deduct'
                                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                          : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                                      }`}>
                                        {log.type === 'scan_usage' ? 'Tarama Seansı Harcaması (-)' :
                                         log.type === 'purchase' ? 'Paket Satın Alma (+)' :
                                         log.type === 'admin_add' ? 'Yönetici Kredi Yükleme (+)' :
                                         log.type === 'admin_deduct' ? 'Yönetici Kredi Düşümü (-)' :
                                         log.type === 'admin_set' ? 'Yönetici Bakiye Sabitleme (=)' :
                                         log.type === 'bonus' ? 'Bonus Kredi (+)' :
                                         'Başlangıç Kredisi'}
                                      </span>
                                    </td>

                                    <td className="p-3.5 text-center font-bold text-sm">
                                      <span className={isPositive ? 'text-emerald-400' : isZero ? 'text-slate-400' : 'text-rose-400'}>
                                        {isPositive ? `+${log.amount}` : log.amount}
                                      </span>
                                    </td>

                                    <td className="p-3.5 text-center text-xs">
                                      <span className="text-slate-400">{log.previousBalance}</span>
                                      <span className="text-slate-600 mx-1">➔</span>
                                      <span className="font-bold text-slate-100">{log.newBalance}</span>
                                    </td>

                                    <td className="p-3.5 font-sans text-xs text-slate-300 max-w-xs">
                                      <div>{log.description}</div>
                                    </td>

                                    <td className="p-3.5 text-right font-sans text-[11px] text-slate-400">
                                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                                        {log.performedBy || 'Sistem'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}

                            {creditLogs.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500 font-sans text-xs">
                                  Henüz sistemde kayıtlı bir kredi harcama veya yükleme kaydı bulunmuyor.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* RESELLERS SUBVIEW: COMMISSIONS TABLE & APPROVAL */}
                {resellerSubView === 'commissions' && (
                  <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={commSearch}
                          onChange={(e) => setCommSearch(e.target.value)}
                          placeholder="İşlem No, Maskeli Üye ID veya Paket Adı Ara..."
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                        />
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Filter */}
                        <div className="flex items-center gap-1 text-xs">
                          {(['all', 'pending', 'approved', 'paid', 'rejected'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => setCommFilterStatus(st)}
                              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                                commFilterStatus === st
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {st === 'all' && 'Tümü'}
                              {st === 'pending' && 'Bekleyenler'}
                              {st === 'approved' && 'Onaylananlar'}
                              {st === 'paid' && 'Ödenenler'}
                              {st === 'rejected' && 'Reddedilen'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
                            <tr>
                              <th className="py-3 px-4">İşlem ID</th>
                              <th className="py-3 px-4">Bayi (Referans Kodu)</th>
                              <th className="py-3 px-4">Maskeli Üye</th>
                              <th className="py-3 px-4">Satış Paketi</th>
                              <th className="py-3 px-4 text-right">Satış Tutarı</th>
                              <th className="py-3 px-4 text-right">Komisyon Tutarı</th>
                              <th className="py-3 px-4 text-center">Durum</th>
                              <th className="py-3 px-4 text-right">Tarih</th>
                              <th className="py-3 px-4 text-center">Yönetici İşlemi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 text-slate-300">
                            {commissions
                              .filter((c) => {
                                if (commFilterStatus !== 'all' && c.status !== commFilterStatus) return false;
                                if (commSearch.trim()) {
                                  const q = commSearch.toLowerCase();
                                  return (
                                    (c.transactionId || '').toLowerCase().includes(q) ||
                                    (c.userId || '').toLowerCase().includes(q) ||
                                    (c.packageName || '').toLowerCase().includes(q) ||
                                    (c.referralCode || '').toLowerCase().includes(q)
                                  );
                                }
                                return true;
                              })
                              .map((c) => (
                                <tr key={c.transactionId} className="hover:bg-slate-900/50 transition-colors">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                                    {c.transactionId}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-slate-100">{c.resellerName || 'Bayi'}</div>
                                    <div className="font-mono text-[10px] text-emerald-400">{c.referralCode}</div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
                                      {c.userId}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-medium text-slate-200">
                                    {c.packageName}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-300">
                                    {(c.amount || 0).toLocaleString('tr-TR')} $
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                                    +{(c.commissionAmount || 0).toLocaleString('tr-TR')} $
                                    <span className="text-[10px] text-slate-500 block">%{c.rate}</span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {c.status === 'paid' && (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                        ✓ Ödendi
                                      </span>
                                    )}
                                    {c.status === 'approved' && (
                                      <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold">
                                        ● Onaylandı
                                      </span>
                                    )}
                                    {c.status === 'pending' && (
                                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                                        ⏳ Onay Bekliyor
                                      </span>
                                    )}
                                    {c.status === 'rejected' && (
                                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                        ✕ Reddedildi
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                                    {new Date(c.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {c.status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => handleUpdateCommissionStatus(c.transactionId, 'approved')}
                                            className="px-2 py-1 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/40 text-[10px] font-bold transition-all cursor-pointer"
                                            title="Komisyonu Onayla"
                                          >
                                            Onayla
                                          </button>
                                          <button
                                            onClick={() => handleUpdateCommissionStatus(c.transactionId, 'rejected')}
                                            className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-medium transition-all cursor-pointer"
                                            title="Reddet"
                                          >
                                            Reddet
                                          </button>
                                        </>
                                      )}
                                      {c.status === 'approved' && (
                                        <button
                                          onClick={() => handleUpdateCommissionStatus(c.transactionId, 'paid')}
                                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10px] shadow-sm flex items-center gap-1 cursor-pointer"
                                          title="Havale Yapıldı, Ödendi Olarak Kaydet"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Ödendi İşaretle</span>
                                        </button>
                                      )}
                                      {c.status === 'paid' && (
                                        <span className="text-[10px] text-slate-500 italic">
                                          Tamamlandı
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* RESELLERS SUBVIEW: PACKAGE & CREDIT ORDERS (YÖNETİCİ ONAYI BEKLEYEN BAYİ PAKET SİPARİŞLERİ) */}
                {resellerSubView === 'orders' && (
                  <div className="space-y-4">
                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <div className="relative flex-1 w-full">
                        <input
                          type="text"
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          placeholder="Sipariş No (DORD-...), Bayi Adı veya E-Posta Ara..."
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                        />
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                        <button
                          onClick={() => setOrderStatusFilter('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            orderStatusFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Tümü ({dealerOrders.length})
                        </button>
                        <button
                          onClick={() => setOrderStatusFilter('pending')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            orderStatusFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Onay Bekleyenler ({dealerOrders.filter(o => o.status === 'pending').length})
                        </button>
                        <button
                          onClick={() => setOrderStatusFilter('approved')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            orderStatusFilter === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Onaylananlar ({dealerOrders.filter(o => o.status === 'approved').length})
                        </button>
                      </div>
                    </div>

                    {/* Notice */}
                    <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 text-xs text-slate-300 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-300">
                        Bayiler tarafından talep edilen paketlerin ücretleri şirket banka hesabına havale/EFT yapıldıktan sonra buradan <strong>"Onayla & Kredileri Yükle"</strong> butonuna basıldığında seans hakları bayinin ve üyenin hesabına otomatik olarak tanımlanır.
                      </p>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-3 px-4">Sipariş No</th>
                              <th className="py-3 px-4">Bayi Bilgisi</th>
                              <th className="py-3 px-4">Satın Alınan Paket</th>
                              <th className="py-3 px-4">Kredi Miktarı</th>
                              <th className="py-3 px-4 text-right">Tutar</th>
                              <th className="py-3 px-4">Açıklama / Dekont</th>
                              <th className="py-3 px-4 text-center">Durum</th>
                              <th className="py-3 px-4 text-right">Tarih</th>
                              <th className="py-3 px-4 text-center">Yönetici İşlemi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {dealerOrders
                              .filter(o => {
                                if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
                                if (!orderSearch.trim()) return true;
                                const q = orderSearch.toLowerCase();
                                return (
                                  (o.id || '').toLowerCase().includes(q) ||
                                  (o.resellerName || '').toLowerCase().includes(q) ||
                                  (o.resellerEmail || '').toLowerCase().includes(q) ||
                                  (o.packageName || '').toLowerCase().includes(q)
                                );
                              })
                              .map((order) => {
                                const isProcessing = orderProcessingId === order.id;

                                return (
                                  <tr key={order.id} className="hover:bg-slate-900/60 transition-colors">
                                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                                      {order.id}
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <div className="font-bold text-slate-100">{order.resellerName}</div>
                                      <div className="text-[10px] text-slate-400">{order.resellerEmail}</div>
                                      {order.resellerPhone && <div className="text-[10px] text-slate-500">{order.resellerPhone}</div>}
                                    </td>
                                    <td className="py-3.5 px-4 font-bold text-teal-300">
                                      {order.packageName}
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <span className="px-2 py-0.5 rounded-md bg-teal-950 border border-teal-500/40 text-teal-300 font-mono font-bold text-xs">
                                        +{order.scanCredits} Seans
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                                      {order.priceText || `${order.price.toLocaleString('tr-TR')} $`}
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate text-[11px]">
                                      {order.paymentReference || <span className="text-slate-500 italic">Belirtilmedi</span>}
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      {order.status === 'pending' && (
                                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                                          ⏳ Ödeme Onayı Bekliyor
                                        </span>
                                      )}
                                      {order.status === 'approved' && (
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                          ✓ Onaylandı & Kredi Yüklendi
                                        </span>
                                      )}
                                      {order.status === 'rejected' && (
                                        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                          ✕ Reddedildi
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px] font-mono">
                                      {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      {order.status === 'pending' ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            onClick={() => handleApproveDealerOrder(order)}
                                            disabled={isProcessing}
                                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] shadow-md flex items-center gap-1 cursor-pointer"
                                            title="Ödemeyi Onayla ve Krediyi Bayiye Yükle"
                                          >
                                            {isProcessing ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                              <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Onayla & Kredi Yükle</span>
                                              </>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => handleRejectDealerOrder(order)}
                                            disabled={isProcessing}
                                            className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-[10px] transition-all cursor-pointer"
                                            title="Siparişi Reddet"
                                          >
                                            Reddet
                                          </button>
                                        </div>
                                      ) : order.status === 'approved' ? (
                                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                          <button
                                            onClick={async () => {
                                              let inv = invoices.find(i => i.orderId === order.id);
                                              if (!inv) {
                                                const resObj = resellers.find(r => r.id === order.resellerId || r.uid === order.resellerId || Boolean(r.email && order.resellerEmail && r.email.toLowerCase() === order.resellerEmail.toLowerCase()));
                                                inv = await createInvoiceForDealerOrder(order, resObj);
                                              }
                                              handleOpenViewInvoice(inv);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                            title="Dijital E-Faturayı Görüntüle / Düzenle / Yazdır / PDF"
                                          >
                                            <FileText className="w-3 h-3 text-purple-400" />
                                            <span>E-Fatura</span>
                                          </button>

                                          <button
                                            onClick={async () => {
                                              let inv = invoices.find(i => i.orderId === order.id);
                                              if (!inv) {
                                                const resObj = resellers.find(r => r.id === order.resellerId || r.uid === order.resellerId || Boolean(r.email && order.resellerEmail && r.email.toLowerCase() === order.resellerEmail.toLowerCase()));
                                                inv = await createInvoiceForDealerOrder(order, resObj);
                                              }
                                              handleSendInvoiceViaWhatsApp(inv);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                            title="Faturayı Bayiye WhatsApp İle İlet"
                                          >
                                            <MessageCircle className="w-3 h-3 text-emerald-400" />
                                            <span>WhatsApp</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          Reddedildi
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}

                            {dealerOrders.length === 0 && (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                                  Henüz bayilerden gelen bir paket satın alma talebi bulunmuyor.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 4: BAYI BAŞVURULARI (DEALER APPLICATIONS) */}
            {adminTab === 'dealers' && (
              <div className="space-y-6">
                
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={dealerSearch}
                      onChange={(e) => setDealerSearch(e.target.value)}
                      placeholder="Firma, Yetkili, Vergi No veya Tel Ara..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <button
                      onClick={() => setDealerFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        dealerFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tümü ({members.filter(m => m.isDealerRequested || m.role === 'dealer' || m.dealerStatus).length})
                    </button>
                    <button
                      onClick={() => setDealerFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        dealerFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Onay Bekleyenler ({members.filter(m => (m.isDealerRequested || m.dealerStatus === 'pending') && m.dealerStatus !== 'approved' && m.dealerStatus !== 'rejected').length})
                    </button>
                    <button
                      onClick={() => setDealerFilter('approved')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        dealerFilter === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Onaylanan Bayiler ({members.filter(m => m.role === 'dealer' || m.dealerStatus === 'approved').length})
                    </button>
                    <button
                      onClick={() => setDealerFilter('rejected')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        dealerFilter === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Reddedilenler ({members.filter(m => m.dealerStatus === 'rejected').length})
                    </button>
                    <button
                      onClick={loadMembers}
                      disabled={isLoading}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
                      title="Listeyi Yenile"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Applications Cards List */}
                <div className="space-y-4">
                  {members
                    .filter((m) => {
                      const isDealerCandidate = Boolean(
                        m.isDealerRequested || 
                        m.role === 'dealer' || 
                        m.dealerStatus === 'pending' || 
                        m.dealerStatus === 'approved' || 
                        m.dealerStatus === 'rejected'
                      );
                      if (!isDealerCandidate) return false;

                      // Status filter
                      if (dealerFilter === 'pending') {
                        return (m.isDealerRequested || m.dealerStatus === 'pending') && m.dealerStatus !== 'approved' && m.dealerStatus !== 'rejected';
                      }
                      if (dealerFilter === 'approved') {
                        return m.role === 'dealer' || m.dealerStatus === 'approved';
                      }
                      if (dealerFilter === 'rejected') {
                        return m.dealerStatus === 'rejected';
                      }

                      // Search
                      if (dealerSearch) {
                        const q = dealerSearch.toLowerCase();
                        const comp = (m.dealerDetails?.companyName || '').toLowerCase();
                        const name = (m.fullName || '').toLowerCase();
                        const tax = (m.dealerDetails?.taxNumber || '').toLowerCase();
                        const phone = (m.dealerDetails?.whatsapp || m.phone || '').toLowerCase();
                        return comp.includes(q) || name.includes(q) || tax.includes(q) || phone.includes(q);
                      }
                      return true;
                    })
                    .map((user) => {
                      const details = (user.dealerDetails || {}) as DealerDetails;
                      const isApproved = user.role === 'dealer' || user.dealerStatus === 'approved';
                      const isRejected = user.dealerStatus === 'rejected';
                      const isPending = !isApproved && !isRejected;

                      const waContactUrl = `https://wa.me/${(details.whatsapp || user.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Merhaba Sayın ${user.fullName}, AKN AuraBio Frekans Bayilik başvurunuz ile ilgili merkezimizden yazmaktayız.`
                      )}`;

                      return (
                        <div
                          key={user.uid}
                          className={`p-5 rounded-2xl border transition-all space-y-4 shadow-md ${
                            isPending 
                              ? 'bg-slate-950/90 border-amber-500/50 shadow-amber-950/20' 
                              : isApproved 
                                ? 'bg-slate-950/90 border-emerald-500/40 shadow-emerald-950/20' 
                                : 'bg-slate-950/80 border-slate-800 opacity-80'
                          }`}
                        >
                          {/* Top Row: Company & Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-amber-400" />
                                  <span>{details.companyName || 'Kurumsal Firma Bilgisi Girilmemiş'}</span>
                                </h3>
                                
                                {isPending && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold animate-pulse flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>İnceleme Bekliyor</span>
                                  </span>
                                )}

                                {isApproved && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Yetkili Bayi (Onaylandı)</span>
                                  </span>
                                )}

                                {isRejected && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    <span>Reddedildi</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>Yetkili: <strong className="text-slate-200">{user.fullName}</strong></span>
                                <span>•</span>
                                <span>Sektör: <span className="text-amber-300/90 font-medium">{details.businessField || 'Biyo-Rezonans / Sağlık'}</span></span>
                              </div>
                            </div>

                            {/* Assigned Code (If Approved) */}
                            {details.referralCode && (
                              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-right">
                                <div className="text-[10px] text-emerald-400 font-medium">Bayi Referans Kodu</div>
                                <div className="text-xs font-mono font-bold text-emerald-300 tracking-wider">
                                  {details.referralCode}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Middle: Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                              <span className="text-[10px] text-slate-400 block font-medium">Vergi & TC Bilgileri</span>
                              <div className="text-slate-200 font-mono font-bold text-xs">{details.taxNumber || 'Belirtilmedi'}</div>
                              <div className="text-[10px] text-slate-400">{details.taxOffice || 'Daire Belirtilmedi'}</div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                              <span className="text-[10px] text-slate-400 block font-medium flex items-center gap-1">
                                <MessageCircle className="w-3 h-3 text-emerald-400" />
                                <span>WhatsApp & İletişim</span>
                              </span>
                              <div className="text-emerald-300 font-mono font-bold text-xs">{details.whatsapp || user.phone}</div>
                              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                              <span className="text-[10px] text-slate-400 block font-medium">Adres & Lokasyon</span>
                              <div className="text-slate-300 text-[11px] leading-tight">
                                {details.address || 'Açık adres belirtilmemiş'}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                              <span className="text-[10px] text-slate-400 block font-medium">Başvuru Tarihi & ID</span>
                              <div className="text-slate-300 font-mono text-[11px]">
                                {details.appliedAt ? new Date(details.appliedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Yeni'}
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono">UID: {user.uid.slice(0, 14)}...</div>
                            </div>
                          </div>

                          {/* Rejection reason if any */}
                          {details.rejectionReason && (
                            <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                              <span>Red Gerekçesi: <strong>{details.rejectionReason}</strong></span>
                            </div>
                          )}

                          {/* Bottom Actions Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                            
                            {/* WhatsApp Direct Chat */}
                            <a
                              href={waContactUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>WhatsApp'tan Görüş</span>
                              <ExternalLink className="w-3 h-3 text-emerald-400/80" />
                            </a>

                            {/* Decision Buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => handleOpenDealerDetails(user)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                                title="Bayi Detaylı Bilgilerini, Kredi Havuzunu ve Danışanlarını Görüntüle"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detaylı Bayi Kartı</span>
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleOpenRejectDealer(user)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all cursor-pointer"
                                  >
                                    Başvuruyu Reddet
                                  </button>
                                  <button
                                    onClick={() => handleOpenApproveDealer(user)}
                                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/60 flex items-center gap-1.5 transition-all cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Bayiliği Onayla & Kod Ata</span>
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <button
                                  onClick={() => handleOpenApproveDealer(user)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Referans Kodu veya Komisyon Oranını Güncelle"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Bayi Ayarlarını Güncelle</span>
                                </button>
                              )}

                              {isRejected && (
                                <button
                                  onClick={() => handleOpenApproveDealer(user)}
                                  className="px-3 py-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Yeniden İncele ve Onayla
                                </button>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })}

                  {members.filter(m => m.isDealerRequested || m.role === 'dealer' || m.dealerStatus).length === 0 && (
                    <div className="p-12 text-center text-slate-500 text-xs rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                      <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-400">Henüz hiç bayi başvurusu bulunmamaktadır.</p>
                      <p className="text-[11px] text-slate-500">
                        Kullanıcılar kayıt ekranında veya menüdeki "Bayimiz Olun" butonu üzerinden başvuru yaptıklarında burada listelenecektir.
                      </p>
                    </div>
                  )}
                </div>

                {/* DEALER PACKAGES MANAGEMENT (LISANS & KREDI HAVUZU PAKETLERI) */}
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-teal-950/40 to-slate-950/80 p-4 rounded-2xl border border-teal-500/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-teal-400" />
                        <h3 className="text-sm font-bold text-slate-100">Bayilik Paket & Kredi Havuzu Yönetimi</h3>
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                          {dealerPackages.length} Paket Aktif
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Piyasa ve enflasyon şartlarına göre paket fiyatlarını, seans adetlerini ve birim maliyetlerini tek tıkla güncelleyin.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleOpenCreateDealerPkg}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-950/60 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Yeni Paket Tanımla</span>
                      </button>
                      <button
                        onClick={handleResetDealerPkgs}
                        disabled={dealerPkgSaveLoading}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Bronz, Gümüş, Altın Fabrika Ayarlarına Sıfırla"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden sm:inline">Sıfırla</span>
                      </button>
                    </div>
                  </div>

                  {/* Dealer Packages Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dealerPackages.map((dp) => (
                      <div
                        key={dp.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                          dp.popular 
                            ? 'bg-slate-950/90 border-teal-500/50 shadow-xl shadow-teal-950/30 ring-1 ring-teal-500/30' 
                            : 'bg-slate-950/70 border-slate-800'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold">
                              {dp.badge || 'BAYİ PAKETİ'}
                            </span>
                            {dp.popular && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                EN ÇOK TERCİH EDİLEN
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-base font-extrabold text-slate-100">{dp.name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{dp.targetAudience}</p>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xl font-black text-emerald-400 font-mono">{dp.priceText || `${dp.price} $`}</span>
                              <span className="text-xs font-bold text-teal-300 font-mono bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-500/30">
                                {dp.scanCredits} Seans
                              </span>
                            </div>
                            <div className="text-[11px] text-amber-300/90 font-medium">
                              {dp.unitCostText || `${Math.round(dp.price / dp.scanCredits)} $ / Seans`}
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Özellikler:</span>
                            {dp.features.map((feat, fIdx) => (
                              <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                          <button
                            onClick={() => handleOpenEditDealerPkg(dp)}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-teal-400" />
                            <span>Düzenle</span>
                          </button>
                          <button
                            onClick={() => setDealerPkgToDelete(dp)}
                            className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/80 text-rose-400 hover:text-rose-200 border border-rose-500/30 transition-colors cursor-pointer"
                            title="Paketi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: DEVICE DEMO MANAGEMENT & RESET */}
            {adminTab === 'devices' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>Kayıtlı Cihazlar</span>
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
                      {deviceSessions.length} Cihaz
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Sistemde demo başlatan tüm cihazlar
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>Aktif Demolar</span>
                      <Clock className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
                      {deviceSessions.filter(d => !d.isDemoExpired && (d.remainingSeconds ?? 0) > 0).length}
                    </div>
                    <div className="text-[10px] text-emerald-400/70">
                      Süresi devam eden cihazlar
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>Süresi Bitenler</span>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono">
                      {deviceSessions.filter(d => d.isDemoExpired || (d.remainingSeconds ?? 0) === 0).length}
                    </div>
                    <div className="text-[10px] text-rose-400/70">
                      30 dakikayı tamamlayanlar
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                      <span>Yenilenen Demolar</span>
                      <RotateCcw className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-teal-300 font-mono">
                      {deviceSessions.filter(d => (d.resetCount ?? 0) > 0).length}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Yönetici tarafından sıfırlanan
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      value={deviceSearch}
                      onChange={(e) => setDeviceSearch(e.target.value)}
                      placeholder="Cihaz UUID, İsim veya Bayi Kodu ile Ara..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    <button
                      onClick={() => setDeviceFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        deviceFilter === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tümü ({deviceSessions.length})
                    </button>
                    {deviceSessions.filter(d => d.renewalRequested || d.renewalRequestStatus === 'pending').length > 0 && (
                      <button
                        onClick={() => setDeviceFilter('pending_renewal')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          deviceFilter === 'pending_renewal' 
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/50' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Onay Bekleyenler ({deviceSessions.filter(d => d.renewalRequested || d.renewalRequestStatus === 'pending').length})</span>
                      </button>
                    )}
                    <button
                      onClick={() => setDeviceFilter('active')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        deviceFilter === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Aktif ({deviceSessions.filter(d => !d.isDemoExpired && (d.remainingSeconds ?? 0) > 0).length})
                    </button>
                    <button
                      onClick={() => setDeviceFilter('expired')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        deviceFilter === 'expired' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Süresi Dolanlar ({deviceSessions.filter(d => d.isDemoExpired || (d.remainingSeconds ?? 0) === 0).length})
                    </button>
                  </div>
                </div>

                {/* PENDING APPROVAL ALERT BANNER */}
                {deviceSessions.filter(d => d.renewalRequested || d.renewalRequestStatus === 'pending').length > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-amber-950/90 border-2 border-amber-500/50 shadow-xl shadow-amber-950/40 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 animate-pulse">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-amber-300">
                            🔔 {deviceSessions.filter(d => d.renewalRequested || d.renewalRequestStatus === 'pending').length} Adet Demo Yenileme Onay Talebi Bekliyor!
                          </h4>
                          <p className="text-xs text-slate-300">
                            Kullanıcılar 30 dakikalık deneme süresini yenilemek için talep göndermiştir. Panelden onay verdiğiniz anda demo süresi otomatik olarak tekrar başlatılacaktır.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Device List */}
                <div className="space-y-3">
                  {deviceSessions.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
                      <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-300">Henüz Demo Başlatmış Cihaz Bulunmuyor</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Kullanıcılar veya bayiler demo butonuna tıkladığında cihaz kimlikleri ve 30 dakikalık sayaç durumları bu panelde listelenecektir.
                      </p>
                    </div>
                  ) : (
                    deviceSessions
                      .filter(d => {
                        if (deviceFilter === 'pending_renewal') {
                          if (!d.renewalRequested && d.renewalRequestStatus !== 'pending') return false;
                        }
                        if (deviceFilter === 'active') {
                          if (d.isDemoExpired || (d.remainingSeconds ?? 0) <= 0) return false;
                        }
                        if (deviceFilter === 'expired') {
                          if (!d.isDemoExpired && (d.remainingSeconds ?? 0) > 0) return false;
                        }
                        if (!deviceSearch.trim()) return true;
                        const q = deviceSearch.toLowerCase();
                        return (
                          (d.deviceUUID || '').toLowerCase().includes(q) ||
                          (d.referralCode || '').toLowerCase().includes(q) ||
                          (d.renewalRequesterName || '').toLowerCase().includes(q) ||
                          (d.renewalRequesterPhone || '').toLowerCase().includes(q)
                        );
                      })
                      .map((doc) => {
                        const remSec = doc.remainingSeconds ?? 0;
                        const remMin = Math.floor(remSec / 60);
                        const remS = remSec % 60;
                        const isExpired = doc.isDemoExpired || remSec <= 0;
                        const isPendingRenewal = doc.renewalRequested || doc.renewalRequestStatus === 'pending';

                        return (
                          <div
                            key={doc.deviceUUID}
                            className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                              isPendingRenewal
                                ? 'bg-amber-950/30 border-amber-500/70 shadow-amber-950/40 ring-1 ring-amber-500/40'
                                : !isExpired
                                ? 'bg-slate-950/90 border-emerald-500/40 shadow-emerald-950/20'
                                : 'bg-slate-950/80 border-slate-800'
                            }`}
                          >
                            {/* Device Info */}
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-1 rounded-lg">
                                  {doc.deviceUUID}
                                </span>

                                {isPendingRenewal && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[11px] font-extrabold flex items-center gap-1 animate-pulse">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>⏳ Demo Yenileme Onay Talebi Var</span>
                                  </span>
                                )}

                                {!isExpired ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-emerald-400" />
                                    <span>Aktif ({remMin.toString().padStart(2, '0')}:{remS.toString().padStart(2, '0')} Kaldı)</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                                    <span>Demo Süresi Doldu (30 Dk Bitti)</span>
                                  </span>
                                )}

                                {(doc.resetCount ?? 0) > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-semibold">
                                    {doc.resetCount} Kez Sıfırlandı
                                  </span>
                                )}
                              </div>

                              {/* Requester Information Card if renewal requested */}
                              {isPendingRenewal && (
                                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs space-y-1">
                                  <div className="text-amber-300 font-bold flex items-center gap-2">
                                    <span>👤 Talep Eden: {doc.renewalRequesterName || 'Belirtilmedi'}</span>
                                    {doc.renewalRequesterPhone && (
                                      <span className="text-slate-300 font-mono">📱 {doc.renewalRequesterPhone}</span>
                                    )}
                                  </div>
                                  {doc.renewalRequesterNote && (
                                    <div className="text-slate-300 text-[11px]">
                                      💬 Not: <em>"{doc.renewalRequesterNote}"</em>
                                    </div>
                                  )}
                                  {doc.renewalRequestedAt && (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      Talep Zamanı: {new Date(doc.renewalRequestedAt).toLocaleString('tr-TR')}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                                {doc.referralCode && (
                                  <span className="flex items-center gap-1 text-amber-300 font-medium">
                                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Bayi Referansı: <strong className="font-mono">{doc.referralCode}</strong></span>
                                  </span>
                                )}
                                {doc.createdAt && (
                                  <span>Kayıt: <span className="text-slate-300">{new Date(doc.createdAt).toLocaleDateString('tr-TR')} {new Date(doc.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span></span>
                                )}
                                {doc.lastActiveAt && (
                                  <span>Son Aktivite: <span className="text-slate-300">{new Date(doc.lastActiveAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span></span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 flex-wrap">
                              {isPendingRenewal ? (
                                <>
                                  <button
                                    onClick={() => handleApproveRenewal(doc.deviceUUID)}
                                    disabled={deviceLoading}
                                    className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                                    title="Demo yenileme talebini onayla ve 30 dakika demo başlat"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                    <span>Onayla & 30 Dk Demo Başlat</span>
                                  </button>

                                  <button
                                    onClick={() => handleRejectRenewal(doc.deviceUUID)}
                                    disabled={deviceLoading}
                                    className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Demo yenileme talebini reddet"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reddet</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleResetDevice(doc.deviceUUID)}
                                  disabled={deviceLoading}
                                  className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                  title="Cihazın demo hakkını tekrar 30 dakikaya yeniler"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>30 Dk Demoyu Sıfırla</span>
                                </button>
                              )}

                              {!isExpired && (
                                <button
                                  onClick={() => handleExpireDevice(doc.deviceUUID)}
                                  disabled={deviceLoading}
                                  className="p-2 rounded-xl bg-amber-950/50 hover:bg-amber-900/80 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                                  title="Demoyu Anında Bitir (Süresi Doldu Olarak İşaretle)"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteDevice(doc.deviceUUID)}
                                disabled={deviceLoading}
                                className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                                title="Cihaz Kaydını Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

              </div>
            )}

            {/* TAB 6: DİJİTAL E-FATURA YÖNETİMİ (INVOICES) */}
            {adminTab === 'invoices' && (
              <div className="space-y-6">

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30 shadow-lg flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400">Toplam Fatura Sayısı</div>
                      <div className="text-xl font-mono font-bold text-slate-100">{invoices.length} Adet</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-lg flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400">Toplam Faturalanan Ciro</div>
                      <div className="text-xl font-mono font-bold text-emerald-400">
                        {invoices.reduce((acc, i) => acc + (i.grandTotal || 0), 0).toLocaleString('tr-TR')} $
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-500/30 shadow-lg flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400">Tahakkuk Eden KDV (%20)</div>
                      <div className="text-xl font-mono font-bold text-teal-300">
                        {invoices.reduce((acc, i) => acc + (i.kdvTotal || 0), 0).toLocaleString('tr-TR')} $
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 shadow-lg flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400">WhatsApp İletilenler</div>
                      <div className="text-xl font-mono font-bold text-cyan-300">
                        {invoices.filter(i => i.status === 'sent_whatsapp').length} Fatura
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter & Action Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      placeholder="Fatura No (AUR...), ETTN, Bayi / Alıcı Adı, Tel veya E-Posta ile ara..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-purple-500 font-mono"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={invoiceFilterStatus}
                      onChange={(e) => setInvoiceFilterStatus(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Faturalar ({invoices.length})</option>
                      <option value="sent_whatsapp">WhatsApp İle Gönderilenler</option>
                      <option value="issued">Düzenlenen / E-Arşiv</option>
                      <option value="paid">Ödenenler</option>
                      <option value="cancelled">İptal Edilenler</option>
                    </select>

                    <button
                      onClick={handleOpenCreateCustomInvoice}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/50 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Fatura Kes</span>
                    </button>
                  </div>
                </div>

                {/* Invoices List Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                          <th className="py-3 px-4 font-semibold">Fatura No & ETTN</th>
                          <th className="py-3 px-4 font-semibold">Bayi / Müşteri (Alıcı)</th>
                          <th className="py-3 px-4 font-semibold">Hizmet / Paket Kalemi</th>
                          <th className="py-3 px-4 font-semibold text-right">KDV Hariç</th>
                          <th className="py-3 px-4 font-semibold text-right">KDV (%20)</th>
                          <th className="py-3 px-4 font-semibold text-right">Genel Toplam</th>
                          <th className="py-3 px-4 font-semibold text-center">Tarih</th>
                          <th className="py-3 px-4 font-semibold text-center">Durum</th>
                          <th className="py-3 px-4 font-semibold text-center">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {invoices
                          .filter(inv => {
                            if (invoiceFilterStatus === 'sent_whatsapp') return inv.status === 'sent_whatsapp';
                            if (invoiceFilterStatus === 'issued') return inv.status === 'issued' || inv.status === 'sent_whatsapp';
                            if (invoiceFilterStatus === 'paid') return inv.status === 'paid';
                            if (invoiceFilterStatus === 'cancelled') return inv.status === 'cancelled';
                            return true;
                          })
                          .filter(inv => {
                            if (!invoiceSearch.trim()) return true;
                            const q = (invoiceSearch || '').toLowerCase();
                            const recName = (inv.recipient?.companyName || inv.recipient?.fullName || '').toLowerCase();
                            return (
                              (inv.invoiceNumber || '').toLowerCase().includes(q) ||
                              (inv.ettn || '').toLowerCase().includes(q) ||
                              recName.includes(q) ||
                              Boolean(inv.recipient?.email && inv.recipient.email.toLowerCase().includes(q)) ||
                              Boolean(inv.recipient?.phone && inv.recipient.phone.includes(q)) ||
                              Boolean(inv.recipient?.taxNumber && inv.recipient.taxNumber.includes(q))
                            );
                          })
                          .map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-mono font-bold text-purple-300 flex items-center gap-1">
                                  <span>{inv.invoiceNumber}</span>
                                </div>
                                <div className="font-mono text-[10px] text-slate-500 truncate max-w-[130px]" title={inv.ettn}>
                                  {inv.ettn}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-100">{inv.recipient.companyName || inv.recipient.fullName}</div>
                                {inv.recipient.taxNumber && (
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    VN/TC: {inv.recipient.taxNumber} {inv.recipient.taxOffice ? `(${inv.recipient.taxOffice})` : ''}
                                  </div>
                                )}
                                {inv.recipient.phone && (
                                  <div className="text-[10px] text-emerald-400 font-mono">{inv.recipient.phone}</div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="font-semibold text-slate-200 truncate">
                                  {inv.items?.[0]?.description || inv.packageName || 'Yetkili Bayi Lisansı'}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {inv.packageName ? `Paket: ${inv.packageName}` : 'Lisans ve Kredi Hizmeti'}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                                {inv.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                              </td>

                              <td className="py-3.5 px-4 text-right font-mono text-teal-400">
                                {inv.kdvTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                              </td>

                              <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                                {inv.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                                {new Date(inv.issueDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                {inv.status === 'sent_whatsapp' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>WhatsApp Gönderildi</span>
                                  </span>
                                ) : inv.status === 'issued' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                                    E-Arşiv Düzenlendi
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                    Taslak
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Görüntüle / Düzenle */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenViewInvoice(inv)}
                                    className="p-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-xs transition-colors cursor-pointer"
                                    title="Faturayı Görüntüle & Düzenle"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Direct PDF Download */}
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadInvoicePDF(inv)}
                                    disabled={invoicePdfDownloadingId === inv.id}
                                    className="p-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-xs transition-colors cursor-pointer"
                                    title="Faturayı PDF Formatında İndir"
                                  >
                                    {invoicePdfDownloadingId === inv.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Download className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {/* Send WhatsApp with PDF */}
                                  <button
                                    type="button"
                                    onClick={() => handleSendInvoiceViaWhatsApp(inv)}
                                    disabled={invoiceWhatsAppSendingId === inv.id}
                                    className="p-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs transition-colors cursor-pointer"
                                    title="Faturayı PDF Olarak İndir ve WhatsApp İle Gönder"
                                  >
                                    {invoiceWhatsAppSendingId === inv.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {/* Kalıcı Sil */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteInvoice(inv)}
                                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs transition-colors cursor-pointer"
                                    title="Faturayı Kalıcı Olarak Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                        {invoices.length === 0 && (
                          <tr>
                            <td colSpan={9} className="p-10 text-center text-slate-500 text-xs space-y-3">
                              <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                              <div>Henüz kayıtlı bir dijital e-fatura bulunmamaktadır.</div>
                              <p className="text-[11px] text-slate-600">
                                Bayilik paket siparişleri onaylandığında faturalar otomatik olarak üretilir veya "Fatura Kes" butonundan manuel oluşturabilirsiniz.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 7: KAMPANYALAR & DUYURU YÖNETİMİ */}
            {adminTab === 'campaigns' && (
              <CampaignsManagerAdminTab
                onSuccessMessage={(msg) => setActionSuccessMsg(msg)}
              />
            )}

            {adminTab === 'site_content' && (
              <SiteContentAdminTab
                onSuccessMessage={(msg) => setActionSuccessMsg(msg)}
              />
            )}

            {adminTab === 'ethics_guidelines' && (
              <EthicsGuidelinesAdminTab
                onSuccessMessage={(msg) => setActionSuccessMsg(msg)}
              />
            )}

            {adminTab === 'scans' && (
              <div className="space-y-4">
                {/* Header + Actions */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/60">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">Tarama Kayıtları (Seans Geçmişi)</h3>
                      <p className="text-[11px] text-slate-400">
                        Tüm bayiler ve danışanlara ait canlı tarama kayıtları. Silme işlemi Supabase veritabanından kalıcı olarak kaldırır.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => loadScanRecords(true)}
                      disabled={scanRecordsLoading}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Tarama kayıtlarını yenile"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${scanRecordsLoading ? 'animate-spin' : ''}`} />
                      <span>Canlı Liste</span>
                    </button>

                    <button
                      onClick={handleBulkDeleteSelectedScans}
                      disabled={selectedScanIds.size === 0 || isBulkDeletingScans}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedScanIds.size > 0
                          ? 'bg-orange-600/80 hover:bg-orange-600 text-white shadow-md shadow-orange-950/60'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isBulkDeletingScans ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Seçilileri Sil ({selectedScanIds.size})</span>
                    </button>

                    <button
                      onClick={handleClearAllScans}
                      disabled={scanRecords.length === 0 || isClearingAllScans}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        scanRecords.length > 0
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/60'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isClearingAllScans ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>Tümünü Sil ({scanRecords.length})</span>
                    </button>
                  </div>
                </div>

                {scanActionMsg && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{scanActionMsg}</span>
                  </div>
                )}

                {/* Search + Select All */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={scanRecordsSearch}
                      onChange={(e) => setScanRecordsSearch(e.target.value)}
                      placeholder="Danışan adı, e-posta, tarama tipi veya ID ile ara..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-rose-500 placeholder:text-slate-600"
                    />
                  </div>
                  <button
                    onClick={toggleSelectAllScans}
                    disabled={scanRecords.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className={`w-3.5 h-3.5 ${selectedScanIds.size === scanRecords.length && scanRecords.length > 0 ? 'text-emerald-400' : ''}`} />
                    <span>{selectedScanIds.size === scanRecords.length && scanRecords.length > 0 ? 'Seçimi Kaldır' : 'Tümünü Seç'}</span>
                  </button>
                </div>

                {/* Records table */}
                {scanRecordsLoading && scanRecords.length === 0 ? (
                  <div className="flex items-center justify-center gap-3 p-10 text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    <span>Tarama kayıtları yükleniyor...</span>
                  </div>
                ) : scanRecords.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    Henüz hiç tarama kaydı bulunmuyor. Bayiler tarama yaptıkça kayıtlar burada anlık olarak görünecektir.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="p-3 w-8">
                            <input
                              type="checkbox"
                              checked={selectedScanIds.size === scanRecords.length && scanRecords.length > 0}
                              onChange={toggleSelectAllScans}
                              className="accent-rose-500 cursor-pointer"
                            />
                          </th>
                          <th className="p-3">Tarih / Saat</th>
                          <th className="p-3">Danışan</th>
                          <th className="p-3">Tarama Türü</th>
                          <th className="p-3">Frekans</th>
                          <th className="p-3">Durum</th>
                          <th className="p-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {scanRecords
                          .filter(s => {
                            const q = scanRecordsSearch.trim().toLowerCase();
                            if (!q) return true;
                            return (
                              (s.userName || '').toLowerCase().includes(q) ||
                              (s.userEmail || '').toLowerCase().includes(q) ||
                              (s.userUid || s.userId || '').toLowerCase().includes(q) ||
                              (s.id || '').toLowerCase().includes(q) ||
                              ((s.treatmentName || s.targetName || s.targetType || '') as string).toLowerCase().includes(q)
                            );
                          })
                          .map(s => {
                            const isSelected = selectedScanIds.has(s.id);
                            return (
                              <tr key={s.id} className={`hover:bg-slate-900/60 transition-colors ${isSelected ? 'bg-rose-900/10' : ''}`}>
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleScanSelection(s.id)}
                                    className="accent-rose-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 text-[11px] text-slate-400 whitespace-nowrap font-mono">
                                  {s.timestamp ? new Date(s.timestamp).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-100">{s.userName || 'Misafir Danışan'}</div>
                                  {s.userEmail && <div className="text-[10px] text-slate-500">{s.userEmail}</div>}
                                  <div className="font-mono text-[9px] text-slate-600">{s.userUid || s.userId || ''}</div>
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                                    {(s.treatmentName || s.targetName || s.targetType || 'Biyo-Aura Tarama')}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-amber-300">
                                  {s.frequencyHz ? `${s.frequencyHz} Hz` : '-'}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${s.isAfterTreatment ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30'}`}>
                                    {s.isAfterTreatment ? 'Tedavi Sonrası' : s.treatmentName ? 'Seans Kaydı' : 'Tarama'}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleDeleteSingleScan(s.id)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
                                    title="Bu tarama kaydını sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    {scanRecords.filter(s => {
                      const q = scanRecordsSearch.trim().toLowerCase();
                      return !q || (s.userName || '').toLowerCase().includes(q) || (s.userEmail || '').toLowerCase().includes(q) || (s.userUid || s.userId || '').toLowerCase().includes(q) || (s.id || '').toLowerCase().includes(q) || ((s.treatmentName || s.targetName || s.targetType || '') as string).toLowerCase().includes(q);
                    }).length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-500">Arama sonucu bulunamadı.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 9: MONOLINE 7 NEFIS MLM YÖNETİCİ PANELİ & SQL (ONLY VISIBLE WHEN ADMIN IS AUTHENTICATED) */}
            {adminTab === 'monoline_sql' && (
              <div className="min-w-0 w-full max-w-full bg-slate-50">
                <MonolineMlmPortalModal
                  isOpen={true}
                  embedded={true}
                  initialSubTab="admin"
                  isAdminAuthenticated={true}
                  onClose={() => setAdminTab('members')}
                />
                {isDocumentsOpen && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
                      <button
                        type="button"
                        onClick={() => setIsDocumentsOpen(false)}
                        className="absolute right-4 top-4 rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        Kapat
                      </button>
                      <div className="pt-8">
                        <SharedDocumentsPanel access="admin" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
                </main>
              </div>
            ) : (
              /* HUB MENU SCREEN (Left navigation buttons + Comprehensive interactive cards) */
              <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="max-h-64 overflow-y-auto border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-4 xl:max-h-none xl:border-b-0 xl:border-r xl:p-5">
                  <div className="mb-4 px-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">Yönetim Merkezi</p>
                    <h3 className="mt-1 text-lg font-extrabold text-white">Kontrol Paneli</h3>
                    <p className="mt-1 text-xs text-slate-400">Herhangi bir butona tıklayarak büyük tek sayfa paneli açın.</p>
                  </div>
                  <nav className="space-y-1.5" aria-label="Yönetici bölümleri">
                    {/* Akıllı Muhasebe (CFO Suite) Butonu */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenSmartAccounting) {
                          onOpenSmartAccounting();
                        } else {
                          window.dispatchEvent(new CustomEvent('open-smart-accounting'));
                        }
                      }}
                      className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-amber-400/80 bg-gradient-to-r from-emerald-600/40 via-teal-700/35 to-amber-500/30 px-3 py-3 text-left text-xs font-bold text-white shadow-xl shadow-emerald-950/50 hover:border-amber-300 hover:from-emerald-600/50 hover:to-amber-500/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/30 to-emerald-400/30 text-amber-300 border border-amber-400/50 group-hover:scale-105 transition-transform">
                          <Receipt className="h-4 w-4 text-amber-300" />
                        </span>
                        <div>
                          <div className="text-white font-black text-xs flex items-center gap-1.5">
                            <span>Akıllı Muhasebe</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider">CFO</span>
                          </div>
                          <div className="text-[10px] text-amber-200/90 font-normal">Vergi Dairesi, Stopaj &amp; Yevmiye</div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-400/25 text-amber-300 font-mono border border-amber-400/40 font-bold">CANLI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSinglePageSection('monoline_sql')}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-xs font-bold transition-all cursor-pointer ${
                        adminTab === 'monoline_sql'
                          ? 'border-emerald-300/50 bg-gradient-to-r from-emerald-500/25 to-teal-500/15 text-white shadow-lg shadow-emerald-950/30'
                          : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-emerald-400/40 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300"><Award className="h-4 w-4" /></span>
                      <span>Monoline Yönetimi</span>
                    </button>

                    {ADMIN_MODULE_LINKS.map(({ id, label, icon: Icon, color }) => {
                      const isActive = adminTab === id;
                      const iconColors: Record<string, string> = {
                        emerald: 'bg-emerald-400/15 text-emerald-300',
                        teal: 'bg-teal-400/15 text-teal-300',
                        cyan: 'bg-cyan-400/15 text-cyan-300',
                        amber: 'bg-amber-400/15 text-amber-300',
                        blue: 'bg-blue-400/15 text-blue-300',
                        violet: 'bg-violet-400/15 text-violet-300',
                        pink: 'bg-pink-400/15 text-pink-300',
                        sky: 'bg-sky-400/15 text-sky-300',
                        orange: 'bg-orange-400/15 text-orange-300',
                        rose: 'bg-rose-400/15 text-rose-300',
                      };
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => openSinglePageSection(id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'border-indigo-300/50 bg-gradient-to-r from-indigo-500/25 to-violet-500/15 text-white shadow-lg shadow-indigo-950/30'
                              : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                          }`}
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColors[color]}`}><Icon className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1">{label}</span>
                          {adminModuleCounts[id] !== undefined && (
                            <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-300">
                              {adminModuleCounts[id]}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setIsDocumentsOpen(true)}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-left text-xs font-semibold text-slate-300 transition-all hover:border-emerald-400/40 hover:bg-slate-800 cursor-pointer"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-400/15 text-fuchsia-300"><FileText className="h-4 w-4" /></span>
                      <span>Dökümanlar</span>
                    </button>
                  </nav>
                </aside>

                {/* Hub Central View: Cards for All Modules */}
                <div className="min-w-0 min-h-0 max-w-full overflow-auto overscroll-contain p-4 sm:p-6 space-y-6">
                  {/* Top Stats Banner */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-teal-950/50 p-5 shadow-xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Merkezi Yönetim Konsolu</span>
                        </div>
                        <h2 className="mt-1 text-xl font-black text-white">AKN Biyo-Rezonans &amp; Monoline Sistem Yönetimi</h2>
                        <p className="mt-1 text-xs text-slate-300">
                          Aşağıdaki modüllerden birine veya sol menüdeki butonlara tıklayarak <strong>Büyük Tek Sayfa Paneli</strong> açabilirsiniz.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
                          <div className="text-[10px] text-slate-400">Veritabanı</div>
                          <div className="text-xs font-extrabold text-emerald-300">Supabase Canlı</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
                          <div className="text-[10px] text-slate-400">Toplam Üye</div>
                          <div className="text-xs font-extrabold text-white">{members.length}</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
                          <div className="text-[10px] text-slate-400">Bekleyen Bayi</div>
                          <div className="text-xs font-extrabold text-amber-300">
                            {members.filter(m => (m.isDealerRequested || m.dealerStatus === 'pending') && m.dealerStatus !== 'approved' && m.dealerStatus !== 'rejected').length}
                          </div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
                          <div className="text-[10px] text-slate-400">Aktif Cihazlar</div>
                          <div className="text-xs font-extrabold text-cyan-300">{deviceSessions.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Module Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* 0. Unilevel & Monoline Ağaç Yönetimi (Yeni Kapsamlı Modül) */}
                    <div className="rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-br from-slate-900/95 via-emerald-950/40 to-slate-900/95 p-5 space-y-4 hover:border-emerald-400 transition-all flex flex-col justify-between group shadow-xl">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 group-hover:scale-105 transition-transform">
                            <GitBranch className="h-5 w-5 text-emerald-300" />
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/50 text-[10px] font-black uppercase tracking-wider">
                            AĞAÇ &amp; BAYİ YÖNETİMİ
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-emerald-200 transition-colors flex items-center gap-1.5">
                          <span>Unilevel &amp; Monoline Ağaç Yönetimi</span>
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Tüm bayilerin 7 derinlik ağaç yapısı, sponsor hiyerarşisi, tek tıkla aktif/pasif yetkilendirmesi, kariyer ataması ve kol yerleşimi.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('organization_tree')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Ağaç &amp; Organizasyon Panelini Aç</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 1. Akıllı Muhasebe (CFO) */}
                    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900/90 to-amber-950/30 p-5 space-y-4 hover:border-amber-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Receipt className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase">
                            CFO CANLI
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-amber-200 transition-colors">
                          Akıllı Muhasebe (CFO Suite)
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Vergi Dairesi, Stopaj &amp; Yevmiye Defteri, resmi KDV beyannameleri ve çift taraflı kayıt sistemi.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onOpenSmartAccounting) onOpenSmartAccounting();
                            else window.dispatchEvent(new CustomEvent('open-smart-accounting'));
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>CFO Akıllı Muhasebe Paneline Gir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 2. Monoline Yönetimi */}
                    <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900/90 to-emerald-950/30 p-5 space-y-4 hover:border-emerald-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <Award className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase">
                            7 NEFİS &amp; SQL
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-emerald-200 transition-colors">
                          7 Nefis Kariyer Piramidi &amp; Monoline
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Sıralı tek hat monoline derinlik, kariyer piramidi kademeleri, anlık SQL sorgu &amp; cüzdan yönetimi.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('monoline_sql')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Büyük Tek Sayfa Paneli Aç</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 3. Üyeler & Ödeme Onayları */}
                    <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-slate-900/90 to-indigo-950/30 p-5 space-y-4 hover:border-indigo-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            <ShieldCheck className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300 border border-indigo-400/40 text-[10px] font-black">
                            {members.length} Üye
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-indigo-200 transition-colors">
                          Üye &amp; Ödeme Onayları
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Kullanıcı profilleri, havale dekont ve kripto ödeme onayları, kredi bakiye yüklemeleri.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('members')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Üyeleri Yönet (Büyük Panel)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setStatusFilter('pending');
                              openSinglePageSection('members');
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold text-center border border-slate-700 cursor-pointer"
                          >
                            Bekleyen Onaylar ({members.filter(m => !m.isAllowed).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusFilter('all');
                              openSinglePageSection('members');
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold text-center border border-slate-700 cursor-pointer"
                          >
                            Tüm Üyeler
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Dinamik Paket Yönetimi */}
                    <div className="rounded-2xl border border-teal-500/40 bg-gradient-to-br from-slate-900/90 to-teal-950/30 p-5 space-y-4 hover:border-teal-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
                            <Package className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/40 text-[10px] font-black">
                            {packages.length} Paket
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-teal-200 transition-colors">
                          Dinamik Paket Yönetimi
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Seans kredisi, analiz paketleri, fiyatlandırma, popülerlik rozetleri ve dinamik eklemeler.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('packages')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Paketleri Yönet (Büyük Panel)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 5. Bayi & Komisyon Yönetimi */}
                    <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/90 to-cyan-950/30 p-5 space-y-4 hover:border-cyan-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            <Building2 className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-black">
                            {resellers.length} Bayi
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-cyan-200 transition-colors">
                          Bayi &amp; Komisyon Yönetimi
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Bayilik ağı, komisyon oranları, hakediş onayları, cüzdan çekim talepleri ve IBAN transferleri.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('resellers')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Bayileri &amp; Komisyonları Yönet</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 6. Bayi Başvuruları */}
                    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900/90 to-amber-950/30 p-5 space-y-4 hover:border-amber-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Briefcase className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black">
                            {members.filter(m => (m.isDealerRequested || m.dealerStatus === 'pending') && m.dealerStatus !== 'approved' && m.dealerStatus !== 'rejected').length} Bekleyen
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-amber-200 transition-colors">
                          Bayi Başvuruları &amp; Paket Siparişleri
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Onay bekleyen bayi müracaatları, bayi paket talepleri ve manuel bayi ekleme formu.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('dealers')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Başvuruları İncele (Büyük Panel)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 7. Cihaz Demo Yönetimi */}
                    <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-br from-slate-900/90 to-blue-950/30 p-5 space-y-4 hover:border-blue-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            <Smartphone className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/40 text-[10px] font-black">
                            {deviceSessions.length} Cihaz
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-blue-200 transition-colors">
                          Cihaz Demo Yönetimi
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Aktif donanım oturumları, biyo-rezonans donanım kilitleri ve demo süreleri.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('devices')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Cihazları Görüntüle (Büyük Panel)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 8. Dijital E-Fatura Yönetimi */}
                    <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-slate-900/90 to-violet-950/30 p-5 space-y-4 hover:border-violet-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/40">
                            <Receipt className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-violet-400/20 text-violet-300 border border-violet-400/40 text-[10px] font-black">
                            {invoices.length} Fatura
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-violet-200 transition-colors">
                          Dijital E-Fatura Yönetimi
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          E-Arşiv / E-Fatura seri no, vergi hesaplamaları, PDF önizleme ve yazdırma.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('invoices')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Faturaları Yönet (Büyük Panel)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 9. Kampanyalar & Fırsatlar */}
                    <div className="rounded-2xl border border-pink-500/40 bg-gradient-to-br from-slate-900/90 to-pink-950/30 p-5 space-y-4 hover:border-pink-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/40">
                            <Gift className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-pink-400/20 text-pink-300 border border-pink-400/40 text-[10px] font-black">
                            Promosyonlar
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-pink-200 transition-colors">
                          Kampanyalar &amp; Fırsatlar
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Flash indirimler, kupon kodları ve dönemsel promosyon bannerları.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('campaigns')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Kampanyaları Yönet (Büyük Panel)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 10. Site İçerikleri */}
                    <div className="rounded-2xl border border-sky-500/40 bg-gradient-to-br from-slate-900/90 to-sky-950/30 p-5 space-y-4 hover:border-sky-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40">
                            <FileText className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/40 text-[10px] font-black">
                            CMS
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-sky-200 transition-colors">
                          Site İçerikleri &amp; Metinler
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Ana sayfa duyuruları, bilgilendirme panelleri ve dinamik web metinleri.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('site_content')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>İçerikleri Düzenle (Büyük Panel)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 11. Etik Kurallar */}
                    <div className="rounded-2xl border border-orange-500/40 bg-gradient-to-br from-slate-900/90 to-orange-950/30 p-5 space-y-4 hover:border-orange-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40">
                            <ShieldAlert className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-orange-400/20 text-orange-300 border border-orange-400/40 text-[10px] font-black">
                            Yasal Uyum
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-orange-200 transition-colors">
                          Etik Kurallar &amp; Mevzuat
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Tıbbi teşhis/tedavi sınırlamaları, KVKK ve danışan onam kılavuzları.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('ethics_guidelines')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Kuralları İncele (Büyük Panel)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 12. Tarama Kayıtları */}
                    <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-br from-slate-900/90 to-rose-950/30 p-5 space-y-4 hover:border-rose-400 transition-all flex flex-col justify-between group shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <Clock className="h-5 w-5" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-rose-400/20 text-rose-300 border border-rose-400/40 text-[10px] font-black">
                            {scanRecords.length} Seans
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-rose-200 transition-colors">
                          Tarama Kayıtları (Seans Geçmişi)
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Tüm bayiler ve danışanlara ait canlı seans ve analiz geçmişi kayıtları.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => openSinglePageSection('scans')}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <span>Kayıtları Gör (Büyük Panel)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Member Confirmation Modal */}
        {memberToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/70 rounded-3xl p-6 shadow-2xl shadow-rose-950/90 space-y-5">
              
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/60 shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Üyeyi Silmek İstiyor Musunuz?
                  </h3>
                  <p className="text-xs text-rose-300/90 font-medium">
                    Bu işlem geri alınamaz ve Supabase veritabanından kalıcı olarak siler.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Üye Adı:</span>
                  <span className="font-bold text-slate-100">{memberToDelete.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">E-Posta:</span>
                  <span className="font-mono text-slate-300">{memberToDelete.email}</span>
                </div>
                {memberToDelete.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Telefon:</span>
                    <span className="font-mono text-slate-300">{memberToDelete.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Üye ID (UID):</span>
                  <span className="font-mono text-[11px] text-emerald-400">{memberToDelete.uid}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setMemberToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-950/70 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Siliniyor...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Evet, Kalıcı Olarak Sil</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Edit Member Sponsorship, Leg Balance & Career Modal */}
        {memberToEditSponsorship && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 shadow-2xl shadow-indigo-950/90 space-y-5 max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shadow-inner">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      Sponsorluk, Kol Dengesi &amp; Üye Bilgisi Düzenle
                    </h3>
                    <p className="text-xs text-slate-400">
                      Üyenin sponsorunu, organizasyon kolunu, kol cirolarını ve kariyerini anında güncelleyin.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMemberToEditSponsorship(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMemberSponsorship} className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Ad Soyad *</label>
                    <input
                      type="text"
                      required
                      value={editMemberFullName}
                      onChange={(e) => setEditMemberFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">E-Posta *</label>
                    <input
                      type="email"
                      required
                      value={editMemberEmail}
                      onChange={(e) => setEditMemberEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Telefon</label>
                    <input
                      type="text"
                      value={editMemberPhone}
                      onChange={(e) => setEditMemberPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Hesap Rolü</label>
                    <select
                      value={editMemberRole}
                      onChange={(e) => setEditMemberRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500"
                    >
                      <option value="member">Bireysel Üye (Member)</option>
                      <option value="dealer">Yetkili Bayi (Dealer)</option>
                      <option value="admin">Sistem Yöneticisi (Admin)</option>
                    </select>
                  </div>

                  {/* SPONSOR DEĞİŞTİRME */}
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-2">
                    <label className="block text-slate-200 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-indigo-300">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>Bağlı Olduğu Direkt Sponsor (Bayi Referans Kodu)</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Değiştirildiğinde ağ anında güncellenir</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={editMemberSponsorCode}
                        onChange={(e) => setEditMemberSponsorCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500 font-mono text-xs"
                      >
                        <option value="">Kök Sponsor (Sponsorsuz Doğrudan Sistem)</option>
                        {resellers.map((r) => (
                          <option key={r.uid} value={r.referralCode}>
                            {r.resellerName} ({r.referralCode}) — %{r.commissionRate || 20} Prim
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={editMemberSponsorCode}
                        onChange={(e) => setEditMemberSponsorCode(e.target.value.toUpperCase())}
                        placeholder="Özel Kod: AURA-BAYI-XXXX"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500 font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  {/* KOL ATAMASI & SOL / SAĞ KOL DENGESİ */}
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <label className="block text-slate-200 font-bold flex items-center gap-1.5 text-xs text-emerald-300">
                      <GitBranch className="w-4 h-4 text-emerald-400" />
                      <span>Organizasyon Kol Dengesi (Sol Kol / Sağ Kol Ataması)</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Yerleşim Kolu</span>
                        <select
                          value={editMemberAssignedLeg}
                          onChange={(e) => setEditMemberAssignedLeg(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500"
                        >
                          <option value="AUTO">Otomatik Denge (Smart Leg)</option>
                          <option value="LEFT">Sol Kol (1. Güçlü Kol)</option>
                          <option value="RIGHT">Sağ Kol (2. Denge Kolu)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Sol Kol Cirosu ($)</span>
                        <input
                          type="number"
                          min={0}
                          value={editMemberLeftLegVol}
                          onChange={(e) => setEditMemberLeftLegVol(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Sağ Kol Cirosu ($)</span>
                        <input
                          type="number"
                          min={0}
                          value={editMemberRightLegVol}
                          onChange={(e) => setEditMemberRightLegVol(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KARİYER & SEANS KREDİSİ */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kariyer Mertebesi</label>
                    <select
                      value={editMemberCareerLevel}
                      onChange={(e) => setEditMemberCareerLevel(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500"
                    >
                      <option value={1}>Kariyer Seviyesi 1</option>
                      <option value={2}>Kariyer Seviyesi 2</option>
                      <option value={3}>Kariyer Seviyesi 3</option>
                      <option value={4}>Kariyer Seviyesi 4</option>
                      <option value={5}>Kariyer Seviyesi 5</option>
                      <option value={6}>Kariyer Seviyesi 6</option>
                      <option value={7}>Kariyer Seviyesi 7</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Seans Kredi Bakiyesi</label>
                    <input
                      type="number"
                      min={0}
                      value={editMemberCredits}
                      onChange={(e) => setEditMemberCredits(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={editMemberIsAllowed}
                        onChange={(e) => setEditMemberIsAllowed(e.target.checked)}
                        className="rounded border-slate-700"
                      />
                      <span>Hesap Aktif ve Giriş İzni Açık (isAllowed)</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={isSavingMemberEdit}
                    onClick={() => setMemberToEditSponsorship(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingMemberEdit}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/60 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingMemberEdit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isSavingMemberEdit ? 'Kaydediliyor...' : 'Güncelle ve Sisteme Entegre Et'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global System Reset Confirmation Modal */}
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/70 rounded-3xl p-6 shadow-2xl shadow-rose-950/90 space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/60 shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Sistemi Sıfırlamak İstediğinizden Emin Misiniz?
                  </h3>
                  <p className="text-xs text-rose-300 font-medium">
                    Tüm simülasyon, test ve sahte veriler silinecektir.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                <p className="font-semibold text-rose-300">Devam edildiğinde yapılacak işlemler:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Sistemdeki tüm simülasyon, demo ve sahte kullanıcılar silinir</li>
                  <li>Finans sistemleri, cüzdanlar ve komisyon kayıtları temizlenir</li>
                  <li>Havuz ve seans kredisi sayaçları sıfırlanır</li>
                  <li><strong>Yönetici hesabı hariç</strong> her şey sıfırlanır ve sistem temiz olarak sıfırdan başlar</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isResettingSystem}
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  disabled={isResettingSystem}
                  onClick={handleExecuteResetSystem}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/70 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isResettingSystem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{isResettingSystem ? 'Sıfırlanıyor...' : 'Evet, Sistemi Tamamen Sıfırla'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Backup / Restore Modal */}
        {showDataBackupModal && (
          <DataBackupRestoreModal
            isOpen={showDataBackupModal}
            onClose={() => setShowDataBackupModal(false)}
            onRestoreSuccess={() => {
              loadMembers();
              loadResellersAndCommissions();
            }}
          />
        )}

        {/* Delete Package Confirmation Modal */}
        {packageToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/70 rounded-3xl p-6 shadow-2xl shadow-rose-950/90 space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Paketi Silmek İstiyor Musunuz?
                  </h3>
                  <p className="text-xs text-rose-300 font-medium">
                    "{packageToDelete.name}" paketi silinecektir.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={pkgSaveLoading}
                  onClick={() => setPackageToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={pkgSaveLoading}
                  onClick={handleDeletePackageConfirm}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/70"
                >
                  {pkgSaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Paketi Sil</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Package Modal Form */}
        {(editingPackage || isCreatingNewPackage) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-xl bg-slate-900 border border-teal-500/50 rounded-3xl p-6 shadow-2xl shadow-teal-950/80 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">
                    {isCreatingNewPackage ? 'Yeni Paket Oluştur' : `Paketi Düzenle: ${editingPackage?.name}`}
                  </h3>
                </div>

                <button
                  onClick={() => { setEditingPackage(null); setIsCreatingNewPackage(false); }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePackageSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Paket ID (Benzersiz):</label>
                    <input
                      type="text"
                      required
                      value={pkgFormId}
                      onChange={(e) => setPkgFormId(e.target.value)}
                      placeholder="e.g. silver-dealer veya gold-dealer"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Paket Adı:</label>
                    <input
                      type="text"
                      required
                      value={pkgFormName}
                      onChange={(e) => setPkgFormName(e.target.value)}
                      placeholder="e.g. Silver Bayi (30 Seans Kredisi)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Seans / Tarama Kredisi:</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pkgFormCredits}
                      onChange={(e) => {
                        const cr = parseInt(e.target.value, 10) || 1;
                        setPkgFormCredits(cr);
                        const priceVal = parseFloat(pkgFormPrice) || 0;
                        const unitVal = Math.round(priceVal / cr);
                        setPkgFormUnitCostText(`${unitVal} $ / Seans`);
                      }}
                      placeholder="30"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-xs focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Paket Fiyatı ($):</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={pkgFormPrice}
                      onChange={(e) => {
                        setPkgFormPrice(e.target.value);
                        const val = parseFloat(e.target.value) || 0;
                        setPkgFormPriceText(val === 0 ? '0 $ (Ücretsiz)' : `${val.toLocaleString('tr-TR')} $`);
                        const unitVal = Math.round(val / (pkgFormCredits || 1));
                        setPkgFormUnitCostText(`${unitVal} $ / Seans`);
                      }}
                      placeholder="4950"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Görünen Fiyat Metni:</label>
                    <input
                      type="text"
                      value={pkgFormPriceText}
                      onChange={(e) => setPkgFormPriceText(e.target.value)}
                      placeholder="4.950 $"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Hedef Kitle / Segment:</label>
                    <input
                      type="text"
                      value={pkgFormTargetAudience}
                      onChange={(e) => setPkgFormTargetAudience(e.target.value)}
                      placeholder="e.g. Bireysel Terapist / Klinik & Sağlık Merkezi"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Birim Seans Maliyeti Metni:</label>
                    <input
                      type="text"
                      value={pkgFormUnitCostText}
                      onChange={(e) => setPkgFormUnitCostText(e.target.value)}
                      placeholder="e.g. 165 $ / Seans"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Süre / Kredi Metni (Görünen):</label>
                    <input
                      type="text"
                      value={pkgFormDurationText}
                      onChange={(e) => setPkgFormDurationText(e.target.value)}
                      placeholder="e.g. 30 Seans Kredisi (165 $/Seans)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Rozet / Etiket (Opsiyonel):</label>
                    <input
                      type="text"
                      value={pkgFormBadge}
                      onChange={(e) => setPkgFormBadge(e.target.value)}
                      placeholder="e.g. POPÜLER veya VIP"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Additional Flags */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgFormPopular}
                      onChange={(e) => setPkgFormPopular(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-amber-300 font-medium">Öne Çıkan / En Çok Tercih Edilen Olarak İşaretle</span>
                  </label>
                </div>

                {/* Features Multi-line */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold flex items-center justify-between">
                    <span>Paket Özellikleri & İçerikleri (Her Satıra 1 Özellik):</span>
                    <span className="text-[10px] text-slate-500 font-normal">Enter ile yeni satıra geçin</span>
                  </label>
                  <textarea
                    rows={4}
                    value={pkgFormFeaturesText}
                    onChange={(e) => setPkgFormFeaturesText(e.target.value)}
                    placeholder="30 Adet Tarama & Seans Kredisi&#10;Bayi Paneli & Raporlama&#10;Tüm Biyo-Rezonans & Canlı Sensör Taramaları"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setEditingPackage(null); setIsCreatingNewPackage(false); }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    disabled={pkgSaveLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/80 flex items-center gap-2 cursor-pointer"
                  >
                    {pkgSaveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Paketi Kaydet & Canlı Yayına Al</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* Reseller Create / Edit Modal */}
        {(editingReseller || isCreatingReseller) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 shadow-2xl shadow-emerald-950/80 space-y-5 my-8">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      {isCreatingReseller ? 'Yeni Yetkili Bayi Tanımla' : 'Bayi Bilgileri & Komisyon Oranını Düzenle'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Bayilik sistemi ve komisyon hak ediş ayarları
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setEditingReseller(null); setIsCreatingReseller(false); }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveReseller} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-300 text-xs font-semibold">Bayi / İşletme Adı:</label>
                  <input
                    type="text"
                    required
                    value={resFormName}
                    onChange={(e) => setResFormName(e.target.value)}
                    placeholder="Örn: BioFrekans Ankara Merkezi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 text-xs font-semibold">E-Posta:</label>
                    <input
                      type="email"
                      required
                      value={resFormEmail}
                      onChange={(e) => setResFormEmail(e.target.value)}
                      placeholder="bayi@mail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 text-xs font-semibold">Telefon:</label>
                    <input
                      type="tel"
                      value={resFormPhone}
                      onChange={(e) => setResFormPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 text-xs font-semibold">Referans Kodu (Özel Slug):</label>
                    <input
                      type="text"
                      required
                      value={resFormCode}
                      onChange={(e) => setResFormCode(e.target.value.toUpperCase())}
                      placeholder="AURA-BAYI-5521"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono uppercase text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 text-xs font-semibold">Komisyon Oranı (%):</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={resFormRate}
                      onChange={(e) => setResFormRate(e.target.value)}
                      placeholder="20"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 text-xs font-semibold">Bayi Durumu:</label>
                  <select
                    value={resFormStatus}
                    onChange={(e) => setResFormStatus(e.target.value as 'active' | 'suspended')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 outline-none"
                  >
                    <option value="active">Aktif (Kullanıcılar referans olabilir, komisyon işlenir)</option>
                    <option value="suspended">Askıya Alınmış / Pasif</option>
                  </select>
                </div>

                {/* Sponsorluk, Kol Ataması & İkili Kol Hacim Dengesi */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                    <GitBranch className="w-4 h-4 text-indigo-400" />
                    <span>Sponsorluk, Kol Ataması &amp; Hacim Dengesi</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px]">Direkt Sponsor Seçimi / Kodu:</label>
                      <input
                        type="text"
                        value={resFormSponsorCode}
                        onChange={(e) => setResFormSponsorCode(e.target.value.toUpperCase())}
                        placeholder="Örn: AURA-BAYI-1001 veya Kök için boş"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono uppercase outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px]">Yerleşim Kolu (Binary Leg):</label>
                      <select
                        value={resFormAssignedLeg}
                        onChange={(e) => setResFormAssignedLeg(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-indigo-500"
                      >
                        <option value="AUTO">AUTO (Dengeli / Zayıf Kol)</option>
                        <option value="LEFT">SOL KOL</option>
                        <option value="RIGHT">SAĞ KOL</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[10px]">Sol Kol Hacmi ($):</label>
                      <input
                        type="number"
                        min="0"
                        value={resFormLeftLegVol}
                        onChange={(e) => setResFormLeftLegVol(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[10px]">Sağ Kol Hacmi ($):</label>
                      <input
                        type="number"
                        min="0"
                        value={resFormRightLegVol}
                        onChange={(e) => setResFormRightLegVol(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[10px]">Kariyer Seviyesi (1-7):</label>
                      <select
                        value={resFormCareerLevel}
                        onChange={(e) => setResFormCareerLevel(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none"
                      >
                        <option value={1}>Kariyer Seviyesi 1</option>
                        <option value={2}>Kariyer Seviyesi 2</option>
                        <option value={3}>Kariyer Seviyesi 3</option>
                        <option value={4}>Kariyer Seviyesi 4</option>
                        <option value={5}>Kariyer Seviyesi 5</option>
                        <option value={6}>Kariyer Seviyesi 6</option>
                        <option value={7}>Kariyer Seviyesi 7</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CreditCard className="w-4 h-4" />
                    <span>Bayi Banka & IBAN Ödeme Bilgileri</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px]">Banka Adı:</label>
                      <input
                        type="text"
                        value={resFormBankName}
                        onChange={(e) => setResFormBankName(e.target.value)}
                        placeholder="Örn: Garanti BBVA"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px]">Hesap Sahibi:</label>
                      <input
                        type="text"
                        value={resFormAccountHolder}
                        onChange={(e) => setResFormAccountHolder(e.target.value)}
                        placeholder="Ad Soyad veya Ünvan"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">IBAN (TR...):</label>
                    <input
                      type="text"
                      value={resFormIban}
                      onChange={(e) => setResFormIban(e.target.value.toUpperCase())}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono uppercase outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setEditingReseller(null); setIsCreatingReseller(false); }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    disabled={resellerSaveLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/80 flex items-center gap-2 cursor-pointer"
                  >
                    {resellerSaveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Bayiyi Kaydet</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* Reseller Delete Confirmation Modal */}
        {resellerToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/70 rounded-3xl p-6 shadow-2xl shadow-rose-950/90 space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Bayiyi Silmek İstiyor Musunuz?
                  </h3>
                  <p className="text-xs text-rose-300/90 font-medium">
                    Bu bayinin kaydı ve referans bağlantısı silinecektir.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bayi Adı:</span>
                  <span className="font-bold text-slate-100">{resellerToDelete.resellerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Referans Kodu:</span>
                  <span className="font-mono text-emerald-400">{resellerToDelete.referralCode}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={resellerSaveLoading}
                  onClick={() => setResellerToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  disabled={resellerSaveLoading}
                  onClick={handleDeleteResellerConfirm}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-950/70 flex items-center gap-2 cursor-pointer"
                >
                  {resellerSaveLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Siliniyor...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Evet, Bayiyi Sil</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Dealer Approve & Assign Code */}
        {showApproveDealerModal && selectedDealerUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/70 rounded-3xl p-6 shadow-2xl shadow-emerald-950/90 space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-inner">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      Bayilik Başvurusunu Onayla
                    </h3>
                    <p className="text-xs text-slate-400">
                      Yetkili: <strong className="text-slate-200">{selectedDealerUser.fullName}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowApproveDealerModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Applicant Company Info Preview */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Firma Adı:</span>
                  <span className="font-bold text-slate-200">{selectedDealerUser.dealerDetails?.companyName || 'Bireysel / Belirtilmedi'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vergi / TC No:</span>
                  <span className="font-mono text-slate-300">{selectedDealerUser.dealerDetails?.taxNumber || '-'} ({selectedDealerUser.dealerDetails?.taxOffice || '-'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">WhatsApp / Tel:</span>
                  <span className="text-emerald-400 font-mono">{selectedDealerUser.dealerDetails?.whatsapp || selectedDealerUser.phone}</span>
                </div>
              </div>

              {/* Form to Assign Code & Rate */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Tahsis Edilecek Bayi Referans Kodu:</span>
                    <span className="text-emerald-400 text-[11px] font-mono">Örn: AURA-BAYI-XXXX</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dealerApproveCode}
                    onChange={(e) => setDealerApproveCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono uppercase font-bold text-sm outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Bu kod ile kaydolan danışanların lisans ödemelerinden komisyon otomatik olarak bu bayiye aktarılacaktır.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Komisyon Oranı (%):</span>
                    <span className="text-teal-400 font-bold text-xs">Standart: %20</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={dealerApproveRate}
                    onChange={(e) => setDealerApproveRate(Number(e.target.value) || 20)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <a
                  href={getDealerWhatsAppNotifyUrl(selectedDealerUser, 'approved', dealerApproveCode)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Tebrik Mesajı Hazırla</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApproveDealerModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="button"
                    disabled={isDealerProcessing || !dealerApproveCode.trim()}
                    onClick={handleConfirmApproveDealer}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/70 flex items-center gap-2 cursor-pointer"
                  >
                    {isDealerProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Onaylanıyor...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Onayla ve Bayi Panelini Aç</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal: Dealer Reject Application */}
        {showRejectDealerModal && selectedDealerUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/70 rounded-3xl p-6 shadow-2xl shadow-rose-950/90 space-y-5">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Bayilik Başvurusunu Reddet
                  </h3>
                  <p className="text-xs text-rose-300">
                    {selectedDealerUser.fullName} ({selectedDealerUser.dealerDetails?.companyName || 'Firma'})
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Red Gerekçesi / Açıklama:
                </label>
                <textarea
                  rows={3}
                  value={dealerRejectReason}
                  onChange={(e) => setDealerRejectReason(e.target.value)}
                  placeholder="Başvurunun neden reddedildiğini yazınız..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <a
                  href={getDealerWhatsAppNotifyUrl(selectedDealerUser, 'rejected', undefined, dealerRejectReason)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-rose-400 hover:text-rose-300 inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Bildirimi</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectDealerModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="button"
                    disabled={isDealerProcessing}
                    onClick={handleConfirmRejectDealer}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/70 flex items-center gap-2 cursor-pointer"
                  >
                    {isDealerProcessing ? 'İşleniyor...' : 'Reddet'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: MANUEL BAYİ EKLEME (ADMIN DIRECT DEALER CREATION) */}
        {showManualDealerModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-950/90 space-y-5 my-8">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center shadow-inner">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                      <span>Yeni Bayi Tanımla (Manuel Bayi Ekleme)</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                        YÖNETİCİ ÖZEL
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Giriş e-posta ve şifresini belirleyerek doğrudan onaylı bayi hesabı ve kredi havuzu oluşturun.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowManualDealerModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitManualDealer} className="space-y-4">
                
                {/* Credentials Grid */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    <span>1. Bayi Giriş ve Kimlik Bilgileri</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Bayi Yetkili Ad Soyad *</label>
                      <input
                        type="text"
                        required
                        value={manFullName}
                        onChange={(e) => setManFullName(e.target.value)}
                        placeholder="Örn: Dr. Ahmet Yılmaz"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">İşletme / Kurum Adı *</label>
                      <input
                        type="text"
                        required
                        value={manCompanyName}
                        onChange={(e) => setManCompanyName(e.target.value)}
                        placeholder="Örn: Aura Sağlık & Frekans Kliniği"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Giriş E-Posta Adresi *</label>
                      <input
                        type="email"
                        required
                        value={manEmail}
                        onChange={(e) => setManEmail(e.target.value)}
                        placeholder="bayi@klinik.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Giriş Şifresi Belirle *</label>
                      <input
                        type="text"
                        required
                        minLength={4}
                        value={manPassword}
                        onChange={(e) => setManPassword(e.target.value)}
                        placeholder="En az 4 karakter (örn: 123456)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Telefon / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={manPhone}
                        onChange={(e) => setManPhone(e.target.value)}
                        placeholder="05XX XXX XX XX"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Faaliyet Alanı / Sektör</label>
                      <input
                        type="text"
                        value={manBusinessField}
                        onChange={(e) => setManBusinessField(e.target.value)}
                        placeholder="Örn: Biyo-Rezonans & Holistik Terapi"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Credits & Package Configuration */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Coins className="w-4 h-4" />
                    <span>2. Kredi Havuzu ve Komisyon Ayarları</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Başlangıç Seans Kredisi *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={manCredits}
                        onChange={(e) => setManCredits(Number(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold text-sm outline-none focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500">Bayinin yapabileceği tarama adedi</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Özel Davet / Bayi Kodu</label>
                      <input
                        type="text"
                        value={manReferralCode}
                        onChange={(e) => setManReferralCode(e.target.value.toUpperCase())}
                        placeholder="AURA-BAYI-XXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-teal-300 font-mono uppercase font-bold text-xs outline-none focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500">Boş bırakılırsa otomatik üretilir</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Komisyon Oranı (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={manCommissionRate}
                        onChange={(e) => setManCommissionRate(Number(e.target.value) || 20)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs outline-none focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500">Satış ortaklığı payı (Standart: %20)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Vergi No / TC No (Opsiyonel)</label>
                      <input
                        type="text"
                        value={manTaxNumber}
                        onChange={(e) => setManTaxNumber(e.target.value)}
                        placeholder="Vergi Numarası"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono outline-none focus:border-slate-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Vergi Dairesi (Opsiyonel)</label>
                      <input
                        type="text"
                        value={manTaxOffice}
                        onChange={(e) => setManTaxOffice(e.target.value)}
                        placeholder="Vergi Dairesi"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-medium text-slate-300">Yönetici Notu (Özel Notlar)</label>
                    <input
                      type="text"
                      value={manNotes}
                      onChange={(e) => setManNotes(e.target.value)}
                      placeholder="Örn: AKN VIP İstanbul Bayisi - Telefonla anlaşıldı."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowManualDealerModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    disabled={manIsProcessing}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-amber-950/80 flex items-center gap-2 cursor-pointer"
                  >
                    {manIsProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Hesap Oluşturuluyor...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Onaylı Bayi Hesabını Aç</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* MODAL: BAYİLİK PAKETİ OLUŞTUR / DÜZENLE (DEALER PACKAGE CRUD) */}
        {(isCreatingDealerPkg || editingDealerPkg) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-lg bg-slate-900 border-2 border-teal-500/70 rounded-3xl p-6 shadow-2xl shadow-teal-950/90 space-y-5 my-8">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/50 text-teal-400 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      {isCreatingDealerPkg ? 'Yeni Bayilik Paketi Tanımla' : 'Bayilik Paketini Düzenle'}
                    </h3>
                    <p className="text-xs text-teal-300">
                      Lisans & Kredi Havuzu Paketi
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { setIsCreatingDealerPkg(false); setEditingDealerPkg(null); }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDealerPkg} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Paket Adı *</label>
                    <input
                      type="text"
                      required
                      value={dpFormName}
                      onChange={(e) => setDpFormName(e.target.value)}
                      placeholder="Örn: Bronz Bayilik Paketi"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-bold outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Tarama & Seans Kredisi (Adet) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={dpFormCredits}
                      onChange={(e) => setDpFormCredits(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Paket Fiyatı ($) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={dpFormPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setDpFormPrice(val);
                        setDpFormPriceText(`${val.toLocaleString('tr-TR')} $`);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Fiyat Metni (Görünüm)</label>
                    <input
                      type="text"
                      value={dpFormPriceText}
                      onChange={(e) => setDpFormPriceText(e.target.value)}
                      placeholder="Örn: 4.950 $"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-bold outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Rozet Metni (Badge)</label>
                    <input
                      type="text"
                      value={dpFormBadge}
                      onChange={(e) => setDpFormBadge(e.target.value)}
                      placeholder="Örn: BAŞLANGIÇ & TEST"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Birim Maliyet Metni</label>
                    <input
                      type="text"
                      value={dpFormUnitCostText}
                      onChange={(e) => setDpFormUnitCostText(e.target.value)}
                      placeholder="Örn: 165 $ / Seans Maliyeti"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Hedef Kitle Açıklaması</label>
                  <input
                    type="text"
                    value={dpFormTargetAudience}
                    onChange={(e) => setDpFormTargetAudience(e.target.value)}
                    placeholder="Örn: Sistemi risk almadan test etmek isteyen başlangıç klinikleri."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Paket Maddeleri & Özellikleri (Her satıra bir özellik):</span>
                  </label>
                  <textarea
                    rows={4}
                    value={dpFormFeaturesText}
                    onChange={(e) => setDpFormFeaturesText(e.target.value)}
                    placeholder="30 Adet Tarama & Seans Kredisi&#10;Tam Yetkili Bayi Paneli Erişimi&#10;Standart Destek"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-sans outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dpFormPopular}
                      onChange={(e) => setDpFormPopular(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-xs font-semibold text-slate-300">En Çok Tercih Edilen (Vurgulu) Olarak İşaretle</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setIsCreatingDealerPkg(false); setEditingDealerPkg(null); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="submit"
                    disabled={dealerPkgSaveLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold shadow-md shadow-teal-950/70 flex items-center gap-2 cursor-pointer"
                  >
                    {dealerPkgSaveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Paketi Kaydet</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* MODAL: BAYİLİK PAKETİ SİLME ONAYI */}
        {dealerPkgToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/70 rounded-3xl p-6 shadow-2xl shadow-rose-950/90 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Bayilik Paketini Sil</h3>
                  <p className="text-xs text-rose-300 font-medium">{dealerPkgToDelete.name}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Bu bayilik paketini silmek istediğinize emin misiniz? Bayiler bu paketi listede göremeyecektir.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDealerPkgToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={dealerPkgSaveLoading}
                  onClick={() => handleDeleteDealerPkg(dealerPkgToDelete.id)}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/70 cursor-pointer"
                >
                  {dealerPkgSaveLoading ? 'Siliniyor...' : 'Evet, Paketi Sil'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ÖZEL KREDİ YÜKLEME POPUP */}
        {creditTargetMember && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 shadow-2xl shadow-amber-950/90 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center shrink-0">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Özel Seans Kredisi Yükle</h3>
                  <p className="text-xs text-amber-300 font-medium">{creditTargetMember.fullName}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Mevcut Kredi Bakiyesi:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {creditTargetMember.creditsBalance ?? (checkMemberAccess(creditTargetMember).isAllowed ? 100 : 0)} Seans
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Üye E-posta:</span>
                  <span className="font-mono text-slate-300">{creditTargetMember.email}</span>
                </div>
              </div>

              <form onSubmit={handleConfirmCustomCredit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Yüklenecek Ek Seans Kredisi Miktarı:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={customCreditInput}
                    onChange={(e) => setCustomCreditInput(e.target.value)}
                    placeholder="Örn: 50"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-500/60 text-slate-100 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    {[20, 50, 150, 500, 2000].map((quickVal) => (
                      <button
                        key={quickVal}
                        type="button"
                        onClick={() => setCustomCreditInput(quickVal.toString())}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border border-slate-700 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                      >
                        +{quickVal}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreditTargetMember(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={creditSaveLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-950/80 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {creditSaveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Kredi Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        <span>Krediyi Hesaba Tanımla</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: RESELLER / DEALER FULL DETAIL MODAL */}
        {selectedResellerForDetails && (
          <ResellerDetailModal
            reseller={selectedResellerForDetails}
            onClose={() => setSelectedResellerForDetails(null)}
            onUpdateReseller={(updated) => {
              setResellers(prev => prev.map(r => r.uid === updated.uid ? updated : r));
              setSelectedResellerForDetails(updated);
            }}
          />
        )}

        {/* MODAL: CREATE CUSTOM DIGITAL INVOICE (MANUEL E-FATURA KESME) */}
        {isCreatingCustomInvoice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-xl bg-slate-900 border border-purple-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-purple-950/80 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      Yeni Dijital E-Fatura Kes
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Yetkili bayilere veya kurumlara %20 KDV dahil resmi formatta fatura düzenleyin.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingCustomInvoice(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomInvoice} className="space-y-4 text-xs">
                
                {/* Recipient Information */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Alıcı / Bayi Bilgileri</span>
                  </span>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Alıcı / Bayi / Kurum Adı *</label>
                    <input
                      type="text"
                      required
                      value={customInvRecipientName}
                      onChange={(e) => setCustomInvRecipientName(e.target.value)}
                      placeholder="Örn: Psikoloji Danışmanlık Merkezi Ltd. Şti."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Vergi No / T.C. Kimlik No</label>
                      <input
                        type="text"
                        value={customInvTaxNumber}
                        onChange={(e) => setCustomInvTaxNumber(e.target.value)}
                        placeholder="Örn: 1234567890"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-purple-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Vergi Dairesi</label>
                      <input
                        type="text"
                        value={customInvTaxOffice}
                        onChange={(e) => setCustomInvTaxOffice(e.target.value)}
                        placeholder="Örn: Kadıköy V.D."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Telefon (WhatsApp Gönderimi İçin)</label>
                      <input
                        type="text"
                        value={customInvPhone}
                        onChange={(e) => setCustomInvPhone(e.target.value)}
                        placeholder="Örn: 05551234567"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-purple-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">E-Posta Adresi</label>
                      <input
                        type="email"
                        value={customInvEmail}
                        onChange={(e) => setCustomInvEmail(e.target.value)}
                        placeholder="bayi@example.com"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Adres</label>
                    <input
                      type="text"
                      value={customInvAddress}
                      onChange={(e) => setCustomInvAddress(e.target.value)}
                      placeholder="İşletme Adresi, İlçe / İl"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>

                {/* Product / Service Details */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>Hizmet & Fatura Kalemi</span>
                  </span>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Hizmet / Paket Tanımı *</label>
                    <input
                      type="text"
                      required
                      value={customInvItemName}
                      onChange={(e) => setCustomInvItemName(e.target.value)}
                      placeholder="Örn: Yetkili Bayi Lisans & Frekans Tarama Kredi Paketi"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-teal-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Kredi / Seans Miktarı</label>
                      <input
                        type="number"
                        min="1"
                        value={customInvCredits}
                        onChange={(e) => setCustomInvCredits(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-teal-300 font-mono font-bold focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Toplam Tutar (KDV Dahil, $) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={customInvGrossAmount}
                        onChange={(e) => setCustomInvGrossAmount(Number(e.target.value) || 0)}
                        placeholder="4950"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Realtime VAT calculation preview */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>KDV Hariç Tutar:</span>
                      <span className="font-mono text-slate-200">
                        {calculateVAT(customInvGrossAmount, 20).netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Hesaplanan KDV (%20):</span>
                      <span className="font-mono text-teal-400">
                        {calculateVAT(customInvGrossAmount, 20).vatAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                      <span>Ödenecek Toplam Tutar:</span>
                      <span className="font-mono text-sm">
                        {Number(customInvGrossAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustomInvoice(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    disabled={customInvSaveLoading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-purple-950/80 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {customInvSaveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Fatura Kesiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4" />
                        <span>E-Faturayı Oluştur & Aç</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* Delete Invoice Confirmation Modal */}
        {invoiceToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/70 rounded-3xl p-6 shadow-2xl shadow-rose-950/90 space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/60 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Faturayı Silmek İstiyor Musunuz?</h3>
                  <p className="text-xs text-rose-300/90 font-medium">Bu işlem e-Arşiv faturasını sistemden kalıcı olarak silecektir.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fatura No:</span>
                  <span className="font-mono font-bold text-purple-300">{invoiceToDelete.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Alıcı / Müşteri:</span>
                  <span className="font-bold text-slate-100">{invoiceToDelete.recipient.companyName || invoiceToDelete.recipient.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Toplam Tutar:</span>
                  <span className="font-mono font-bold text-emerald-400">{invoiceToDelete.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tarih:</span>
                  <span className="font-mono text-slate-300">{invoiceToDelete.issueDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingInvoice}
                  onClick={() => setInvoiceToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  disabled={isDeletingInvoice}
                  onClick={handleConfirmDeleteInvoice}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-950/70 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isDeletingInvoice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Siliniyor...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Evet, Kalıcı Olarak Sil</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: RESELLER CREDIT ADJUSTMENT MODAL */}
        {showResellerCreditModal && creditModalReseller && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl shadow-emerald-950/90 space-y-5">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/60 shrink-0">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                      <span>Bayi Kredisi Yönetimi</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
                        {creditModalReseller.referralCode}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      {creditModalReseller.resellerName} ({creditModalReseller.businessName || 'Yetkili Bayi'})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowResellerCreditModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Balance & Target Simulation */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-900">
                  <span className="text-[10px] text-slate-400 block">Mevcut Bakiye</span>
                  <span className="text-lg font-black font-mono text-slate-100">
                    {creditModalReseller.creditsBalance ?? 100}
                  </span>
                  <span className="text-[9px] text-slate-500 block">Seans</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 flex flex-col justify-center items-center">
                  <span className="text-[10px] text-slate-400 block">İşlem Türü</span>
                  <span className={`text-xs font-black uppercase ${
                    creditModalActionType === 'add' ? 'text-emerald-400' :
                    creditModalActionType === 'deduct' ? 'text-rose-400' : 'text-teal-300'
                  }`}>
                    {creditModalActionType === 'add' ? '+ Ekleme' : creditModalActionType === 'deduct' ? '- Düşüm' : '= Sabitleme'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-300 font-bold">
                    {creditModalActionType === 'add' ? `+${creditModalAmount}` :
                     creditModalActionType === 'deduct' ? `-${creditModalAmount}` :
                     `${creditModalAmount}`}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-300 block font-bold">Yeni Bakiye</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {creditModalActionType === 'add' 
                      ? (creditModalReseller.creditsBalance ?? 100) + Number(creditModalAmount || 0)
                      : creditModalActionType === 'deduct'
                      ? Math.max(0, (creditModalReseller.creditsBalance ?? 100) - Number(creditModalAmount || 0))
                      : Number(creditModalAmount || 0)}
                  </span>
                  <span className="text-[9px] text-emerald-300/80 block">Seans</span>
                </div>
              </div>

              {/* Mode Selection Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCreditModalActionType('add')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    creditModalActionType === 'add'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/60'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kredi Ekle (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreditModalActionType('deduct')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    creditModalActionType === 'deduct'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/60'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>Kredi Düş (-)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreditModalActionType('set')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    creditModalActionType === 'set'
                      ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-950/60'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>Sabitle (=)</span>
                </button>
              </div>

              {/* Amount Input & Quick Value Chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  {creditModalActionType === 'set' ? 'Belirlenecek Yeni Net Kredi Sayısı' : 'İşlem Yapılacak Kredi / Seans Miktarı'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={creditModalAmount}
                    onChange={(e) => setCreditModalAmount(e.target.value)}
                    className="w-full pl-4 pr-16 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-base font-mono font-bold focus:border-emerald-500 outline-none"
                    placeholder="Miktar giriniz..."
                  />
                  <span className="absolute right-4 top-3 text-xs text-slate-400 font-bold">Seans</span>
                </div>

                {/* Quick Selection Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[10, 25, 50, 100, 250, 500].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCreditModalAmount(val.toString())}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono font-bold cursor-pointer transition-colors"
                    >
                      {creditModalActionType === 'add' ? `+${val}` : creditModalActionType === 'deduct' ? `-${val}` : val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  İşlem Açıklaması & Denetim Gerekçesi (Audit Log) *
                </label>
                <input
                  type="text"
                  value={creditModalReason}
                  onChange={(e) => setCreditModalReason(e.target.value)}
                  placeholder="Örn: Havale ile 100 Seans Kredi Satın Alımı, Demo Desteği vb."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 outline-none"
                />

                {/* Quick Reason Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Havale / EFT ile Paket Satın Alma',
                    'Aylık Bayi Kota / Hediye Tanımlaması',
                    'Teknik Destek & Seans İadesi',
                    'Yönetici Özel İzni & Demo Hibesi',
                    'Hatalı Giriş Bakiye Düzeltmesi'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCreditModalReason(preset)}
                      className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResellerCreditModal(false)}
                  disabled={creditModalLoading}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>

                <button
                  type="button"
                  onClick={handleApplyResellerCreditAdjustment}
                  disabled={creditModalLoading || !Number(creditModalAmount)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950/80 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {creditModalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Krediyi Onayla & Bakiye Güncelle</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: DIGITAL INVOICE VIEW / PRINT / SHARE MODAL */}
        {showInvoiceModal && selectedInvoice && (
          <DigitalInvoiceModal
            isOpen={showInvoiceModal}
            invoice={selectedInvoice}
            onClose={() => {
              setShowInvoiceModal(false);
              setSelectedInvoice(null);
            }}
            isAdmin={true}
            onInvoiceUpdated={(updated) => {
              setSelectedInvoice(updated);
              setInvoices(prev => prev.map(item => item.id === updated.id ? updated : item));
            }}
            onInvoiceDeleted={(deletedId) => {
              setInvoices(prev => prev.filter(i => i.id !== deletedId && i.invoiceNumber !== deletedId));
              setShowInvoiceModal(false);
              setSelectedInvoice(null);
              setActionSuccessMsg('Fatura başarıyla silindi.');
              setTimeout(() => setActionSuccessMsg(null), 3000);
            }}
          />
        )}

      </div>
    </div>
  );
};
