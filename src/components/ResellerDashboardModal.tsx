import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Wallet, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Share2, 
  ExternalLink, 
  X, 
  DollarSign, 
  Users, 
  ShieldCheck, 
  CreditCard, 
  Award, 
  AlertCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  QrCode, 
  Check, 
  ArrowUpRight, 
  Smartphone,
  Lock,
  ChevronRight,
  LogOut,
  Sparkles,
  HelpCircle,
  FileText,
  Percent,
  Package,
  Coins,
  Loader2,
  Zap,
  Plus,
  BookOpen,
  Receipt,
  Home,
  ArrowLeft,
  Trash2,
  Camera,
  ShoppingCart,
  Briefcase,
  Calculator,
  Mic,
  Brain,
  Watch,
  Globe,
  Download,
  ArrowRight
} from 'lucide-react';
import { 
  Reseller, 
  CommissionTransaction, 
  BankInfo, 
  DealerPackage,
  DEFAULT_DEALER_PACKAGES,
  getDealerPackages,
  subscribeToDealerPackages,
  purchaseDealerPackage,
  getActiveResellerSession, 
  setActiveResellerSession, 
  clearStoredReferralCode, 
  loginAsReseller, 
  registerNewReseller, 
  updateResellerBankInfo, 
  getCommissionsForReseller, 
  generateReferralLink, 
  generateBusinessPresentationLink,
  generateTechnicalReportLink,
  generateRegisterLink,
  generateBusinessCardLink,
  generateBulkMarketingMessage,
  generateWhatsAppShareUrl, 
  generateTelegramShareUrl,
  generateWhatsAppUrlForMessage,
  generateTelegramUrlForMessage,
  subscribeToReseller, 
  getLocalResellers,
  getOrCreateResellerForUser,
  getReferredUsersForReseller,
  subscribeToResellersList
} from '../utils/resellerManager';
import { UserMember, BANK_INFO, ADMIN_PHONE } from '../utils/authManager';
import { getMemberRegionalPendingUsd, getMemberRegionalUsdBalance } from '../utils/walletRegion';
import { redirectToDealerRegistrationPortal, syncFrekansWithMonolineEngine } from '../utils/monolineSyncBridge';
import { getSiteContent } from '../utils/siteContentManager';
import { DealerEthicsGuidelines } from './DealerEthicsGuidelines';
import {
  CAREER_TIERS,
  FREKANS_PACKAGES,
  MONOLINE_DEPTH_RATES,
  MonolineMember,
  SystemStateResponse,
} from '../types/monoline';
import {
  ContractType,
  defaultPaymentProcessor,
  LEGAL_CONTRACT_TEXTS,
  recordUserContractApprovals,
  SANDBOX_SMS_CODE,
  SANDBOX_TEST_CARD_CVV,
  SANDBOX_TEST_CARD_EXPIRY,
  SANDBOX_TEST_CARDS,
  fetchRegionalPackagePrices,
} from '../utils/paymentProcessor';
import { downloadTechnicalReportWord, downloadTechnicalReportPDF } from '../utils/technicalReportExport';
import { 
  DealerPackageOrder, 
  requestDealerPackagePurchase, 
  subscribeToDealerPackageOrders 
} from '../utils/dealerOrderManager';
import { 
  DigitalInvoice, 
  subscribeToDigitalInvoices, 
  getInvoicesForReseller, 
  generateInvoiceWhatsAppShareUrl,
  createInvoiceForDealerOrder
} from '../utils/invoiceManager';
import { DealerBusinessCardModal } from './DealerBusinessCardModal';
import { DigitalInvoiceModal } from './DigitalInvoiceModal';
import { SharedDocumentsPanel } from './SharedDocumentsPanel';
import { ScanResult } from '../types';
import { syncUserScansFromFirestore, deleteScanResult, deleteScanRecordsByIds } from '../utils/storage';
import { formatUsd } from '../utils/currency';

interface ResellerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserMember | null;
  onOpenAuthModal?: () => void;
  onOpenBusinessPresentation?: () => void;
  onOpenTechnicalReport?: () => void;
  onOpenMonolineModal?: (
    subTab?: 'mlm_7nefis' | 'mlm_commission' | 'packages' | 'backoffice' | 'monoline' | 'webhook'
  ) => void;
  onGoToCamera?: () => void;
  initialTab?: 'overview' | 'clients' | 'bayilerim' | 'scans' | 'presentation' | 'packages' | 'share' | 'commissions' | 'invoices' | 'bank' | 'apply' | 'documents';
}

export const ResellerDashboardModal: React.FC<ResellerDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuthModal,
  onOpenBusinessPresentation,
  onOpenTechnicalReport,
  onOpenMonolineModal,
  onGoToCamera,
  initialTab = 'overview'
}) => {
  const [activeReseller, setActiveReseller] = useState<Reseller | null>(() => getActiveResellerSession());
  const [commissions, setCommissions] = useState<CommissionTransaction[]>([]);
  const [referredUsers, setReferredUsers] = useState<UserMember[]>([]);
  const [referredUserSearch, setReferredUserSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'bayilerim' | 'scans' | 'presentation' | 'packages' | 'share' | 'commissions' | 'invoices' | 'bank' | 'apply' | 'documents'>(initialTab);

  // Dealer's own scan history state
  const [dealerScans, setDealerScans] = useState<ScanResult[]>([]);
  const [dealerScansLoading, setDealerScansLoading] = useState<boolean>(false);
  const [dealerScansSearch, setDealerScansSearch] = useState<string>('');
  const [isDeletingScanId, setIsDeletingScanId] = useState<string | null>(null);
  const [isClearingDealerScans, setIsClearingDealerScans] = useState<boolean>(false);
  const [scanActionMsg, setScanActionMsg] = useState<string | null>(null);

  // Bayilerim tab: referred members (danisanlar/uyeler) + their live remaining credits
  const [subResellers, setSubResellers] = useState<Reseller[]>([]);
  const [subResellersLoading, setSubResellersLoading] = useState<boolean>(false);
  const [subResellersSearch, setSubResellersSearch] = useState<string>('');
  const [liveResellers, setLiveResellers] = useState<Reseller[]>([]);
  const [showAddSubDealerForm, setShowAddSubDealerForm] = useState<boolean>(false);
  const [subDealerName, setSubDealerName] = useState<string>('');
  const [subDealerEmail, setSubDealerEmail] = useState<string>('');
  const [subDealerPhone, setSubDealerPhone] = useState<string>('');
  const [subDealerCity, setSubDealerCity] = useState<string>('İstanbul');
  const [isAddingSubDealer, setIsAddingSubDealer] = useState<boolean>(false);
  const [subDealerFeedback, setSubDealerFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Digital Invoices State
  const [invoices, setInvoices] = useState<DigitalInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<DigitalInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<'all' | 'sent_whatsapp' | 'issued'>('all');

  // Card Modal State
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);

  // Dealer Packages State
  const [dealerPackages, setDealerPackages] = useState<DealerPackage[]>(() => getDealerPackages());
  const [regionalPrices, setRegionalPrices] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (!activeReseller) return;
    let cancelled = false;
    fetchRegionalPackagePrices(activeReseller.uid, dealerPackages.map((dp) => dp.id))
      .then((prices) => {
        if (!cancelled) setRegionalPrices(prices);
      })
      .catch(() => {
        if (!cancelled) setRegionalPrices(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeReseller?.uid, dealerPackages]);

  const regionalPriceText = (dp: DealerPackage): string => {
    const price = regionalPrices?.[dp.id];
    return price === undefined ? '—' : formatUsd(price);
  };

  const regionalUnitCostText = (dp: DealerPackage): string => {
    const price = regionalPrices?.[dp.id];
    return price === undefined ? '—' : `${formatUsd(price / dp.scanCredits, 2)} / Seans`;
  };
  const [purchasingPkgId, setPurchasingPkgId] = useState<string | null>(null);
  const [purchaseSuccessMsg, setPurchaseSuccessMsg] = useState<string | null>(null);
  const [selectedPkgForOrder, setSelectedPkgForOrder] = useState<DealerPackage | null>(null);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [orderPaymentRef, setOrderPaymentRef] = useState<string>('');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'credit_card_3d'>('credit_card_3d');
  const [posCardHolder, setPosCardHolder] = useState<string>('');
  const [posCardNumber, setPosCardNumber] = useState<string>(SANDBOX_TEST_CARDS.SUCCESS.number);
  const [posCardExpiry, setPosCardExpiry] = useState<string>(SANDBOX_TEST_CARD_EXPIRY);
  const [posCardCvv, setPosCardCvv] = useState<string>(SANDBOX_TEST_CARD_CVV);
  const [chkSalesContract, setChkSalesContract] = useState<boolean>(false);
  const [chkKvkk, setChkKvkk] = useState<boolean>(false);
  const [chkMlmTerms, setChkMlmTerms] = useState<boolean>(false);
  const [inspectedContractType, setInspectedContractType] = useState<ContractType | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [dealerOrders, setDealerOrders] = useState<DealerPackageOrder[]>([]);
  const [liveMonolineMember, setLiveMonolineMember] = useState<MonolineMember | null>(null);

  // Filter & Search in commissions
  const [commFilter, setCommFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [commSearch, setCommSearch] = useState<string>('');

  // Login form state
  const [loginInput, setLoginInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Application / New Reseller Form
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regCustomCode, setRegCustomCode] = useState<string>('');
  const [regBankName, setRegBankName] = useState<string>('');
  const [regAccountHolder, setRegAccountHolder] = useState<string>('');
  const [regIban, setRegIban] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applyMsg, setApplyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bank edit state
  const [bankForm, setBankForm] = useState<BankInfo>({
    bankName: '',
    accountHolder: '',
    iban: '',
  });
  const [isSavingBank, setIsSavingBank] = useState<boolean>(false);
  const [bankMsg, setBankMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Copy state
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedPresLink, setCopiedPresLink] = useState<boolean>(false);
  const [copiedTechLink, setCopiedTechLink] = useState<boolean>(false);
  const [copiedRegLink, setCopiedRegLink] = useState<boolean>(false);
  const [copiedCardLink, setCopiedCardLink] = useState<boolean>(false);
  const [copiedBulkMessage, setCopiedBulkMessage] = useState<boolean>(false);

  // Presentation Tab Interactive Simulator State
  const [presCalcClients, setPresCalcClients] = useState<number>(30);
  const [presCalcPrice, setPresCalcPrice] = useState<number>(1500);
  const [presCalcDirects, setPresCalcDirects] = useState<number>(5);
  const [presCalcTeamOrders, setPresCalcTeamOrders] = useState<number>(10);
  const [presCalcCareer, setPresCalcCareer] = useState<number>(4);
  const [presCalcPackagePrice, setPresCalcPackagePrice] = useState<number>(30000);
  const [presIncludeMatching, setPresIncludeMatching] = useState<boolean>(true);
  const [presIncludeFastRoi, setPresIncludeFastRoi] = useState<boolean>(true);

  // Presentation Multi-Way Earnings Formulas (V2.2)
  const presMonthlySessionRevenue = presCalcClients * presCalcPrice;
  const presMonthlySessionCost = presCalcClients * 100;
  const presMonthlySessionProfit = presMonthlySessionRevenue - presMonthlySessionCost;
  const presMonthlyDirectSponsor = (presCalcDirects * presCalcPackagePrice * 20) / 100;
  const presUnlockedRatesSum = (MONOLINE_DEPTH_RATES || []).slice(0, presCalcCareer).reduce((s, r) => s + r.percentage, 0);
  const presAvgDepthRate = presCalcCareer > 0 ? presUnlockedRatesSum / 7 : 0;
  const presMonthlyMonoline = Math.round((presCalcTeamOrders * presCalcPackagePrice * presAvgDepthRate) / 100);
  const presSelectedTier = CAREER_TIERS.find((t) => t.level === presCalcCareer) || CAREER_TIERS[3];
  const presMonthlyCareerPool = Math.round(
    ((presCalcDirects + presCalcTeamOrders) * presCalcPackagePrice * 0.5) * presSelectedTier.poolBonusRate
  );
  const presMatchingRate = presCalcCareer >= 6 ? 0.20 : presCalcCareer >= 5 ? 0.15 : presCalcCareer >= 3 ? 0.10 : 0;
  const presMonthlyMatching = presIncludeMatching && presCalcCareer >= 3 ? Math.round(presMonthlyMonoline * presMatchingRate) : 0;
  const presMonthlyFastRoi = presIncludeFastRoi && presCalcDirects >= 3 ? Math.round(3 * presCalcPackagePrice * 0.15) : 0;
  const presTotalMonthlyEarnings = presMonthlySessionProfit + presMonthlyDirectSponsor + presMonthlyMonoline + presMonthlyCareerPool + presMonthlyMatching + presMonthlyFastRoi;
  const presYearlyEarnings = presTotalMonthlyEarnings * 12;

  useEffect(() => {
    if (!isOpen) return;
    syncFrekansWithMonolineEngine().catch((err) => console.debug('Reseller balance sync failed:', err));
  }, [isOpen]);

  // Sync active reseller session & real-time updates
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    let isSyncing = false;

    const syncSessionData = async () => {
      if (isSyncing || !isSubscribed) return;
      isSyncing = true;

      try {
        const isManualLoggedOut = sessionStorage.getItem('aurabio_reseller_manual_logged_out') === 'true';
        let currentSession = getActiveResellerSession();

        // If user is logged in -> ALWAYS link to this user's unique reseller profile
        if (!isManualLoggedOut && currentUser) {
          try {
            const userReseller = await getOrCreateResellerForUser(currentUser);
            currentSession = userReseller;
          } catch (err) {
            console.debug('Sync dealer profile error:', err);
          }
        }

        if (currentSession && isSubscribed) {
          // NOTE: The active reseller session is the single source of truth for the balance.
          // Do NOT overwrite it from currentUser (cached member session may be stale on reload,
          // which made dealer credits look like they were not decreasing after scans).
          setActiveReseller(currentSession);
          
          // Auto-redirect to packages tab if credits are 0 or negative
          if (currentSession.creditsBalance !== undefined && currentSession.creditsBalance <= 0) {
            setActiveTab('packages');
          }

          setBankForm({
            bankName: currentSession.bankInfo?.bankName || '',
            accountHolder: currentSession.bankInfo?.accountHolder || currentSession.resellerName,
            iban: currentSession.bankInfo?.iban || '',
          });

          getCommissionsForReseller(currentSession.uid)
            .then(data => { if (isSubscribed) setCommissions(data); })
            .catch(() => {});
          getReferredUsersForReseller(currentSession.uid, currentSession.referralCode)
            .then(data => { if (isSubscribed) setReferredUsers(data); })
            .catch(() => {});
          getInvoicesForReseller(currentSession.uid)
            .then(data => { if (isSubscribed) setInvoices(data); })
            .catch(() => {});
        }
      } catch (syncErr) {
        console.debug('syncSessionData caught error:', syncErr);
      } finally {
        isSyncing = false;
      }
    };

    syncSessionData();

    // Listen to local & broadcasted events
    const handleCreditsDeducted = (e: any) => {
      const remaining = e.detail?.remainingCredits;
      if (typeof remaining === 'number') {
        setActiveReseller(prev => prev ? { ...prev, creditsBalance: remaining } : prev);
        if (remaining <= 0) {
          setActiveTab('packages');
        }
      } else {
        syncSessionData();
      }
    };

    const handleSessionUpdated = () => {
      syncSessionData();
    };

    const handleInvoicesUpdated = () => {
      syncSessionData();
    };

    const handleMonolineStateUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<SystemStateResponse>;
      const st = customEvt?.detail;
      const cur = getActiveResellerSession();
      if (st && Array.isArray(st.members) && cur) {
        const cleanEmail = (cur.email || '').trim().toLowerCase();
        const cleanCode = (cur.referralCode || '').trim().toUpperCase();
        const cleanName = (cur.resellerName || cur.fullName || '').trim().toLowerCase();
        const matched = st.members.find(
          (m) =>
            m.user_id === cur.uid ||
            (cleanEmail && m.email && m.email.toLowerCase() === cleanEmail) ||
            (cleanCode && m.ref_code && m.ref_code.toUpperCase() === cleanCode) ||
            (cleanName && m.full_name && m.full_name.trim().toLowerCase() === cleanName)
        );
        if (matched) {
          setLiveMonolineMember(matched);
          setActiveReseller((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              creditsBalance: matched.session_credits,
              totalSalesAmount: matched.personal_volume + matched.group_volume,
              totalEarnings: matched.wallets.total_earnings,
              paidEarnings: matched.wallets.total_withdrawn,
              pendingEarnings:
                getMemberRegionalUsdBalance(matched) + getMemberRegionalPendingUsd(matched),
            };
          });
        }
      }
      syncSessionData();
    };

    window.addEventListener('aurabio_credits_deducted', handleCreditsDeducted);
    window.addEventListener('aurabio_resellers_updated', handleSessionUpdated);
    window.addEventListener('aurabio_reseller_session_updated', handleSessionUpdated);
    window.addEventListener('aurabio_dealer_orders_updated', handleSessionUpdated);
    window.addEventListener('aurabio_session_updated', handleSessionUpdated);
    window.addEventListener('aurabio_invoices_updated', handleInvoicesUpdated);
    window.addEventListener('aurabio_monoline_state_updated', handleMonolineStateUpdated);

    let unsubReseller = () => {};
    const curRes = getActiveResellerSession();
    if (curRes?.uid) {
      unsubReseller = subscribeToReseller(curRes.uid, (updated) => {
        if (updated) {
          setActiveReseller(updated);
        }
      });
    }

    const unsubDp = subscribeToDealerPackages((packages) => {
      setDealerPackages(packages);
    });

    const liveResellerFilter = getActiveResellerSession()?.uid || currentUser?.uid || '';
    const unsubOrders = subscribeToDealerPackageOrders((orders) => {
      setDealerOrders(orders);
    }, liveResellerFilter);

    const unsubInvoices = subscribeToDigitalInvoices((allInvoices) => {
      const cur = getActiveResellerSession();
      if (cur) {
        const curUid = (cur.uid || '').toLowerCase();
        const curCode = (cur.referralCode || '').toLowerCase();
        const curEmail = (cur.email || '').toLowerCase();

        const filtered = allInvoices.filter(inv => {
          const rUid = (inv.recipient.uid || '').toLowerCase();
          const rEmail = (inv.recipient.email || '').toLowerCase();
          const rCode = (inv.recipient.referralCode || '').toLowerCase();

          if (curUid && rUid === curUid) return true;
          if (curCode && rCode === curCode) return true;
          if (curEmail && rEmail === curEmail) return true;
          return false;
        });
        setInvoices(filtered);
      }
    }, liveResellerFilter);

    return () => {
      isSubscribed = false;
      window.removeEventListener('aurabio_credits_deducted', handleCreditsDeducted);
      window.removeEventListener('aurabio_resellers_updated', handleSessionUpdated);
      window.removeEventListener('aurabio_reseller_session_updated', handleSessionUpdated);
      window.removeEventListener('aurabio_dealer_orders_updated', handleSessionUpdated);
      window.removeEventListener('aurabio_session_updated', handleSessionUpdated);
      window.removeEventListener('aurabio_invoices_updated', handleInvoicesUpdated);
      window.removeEventListener('aurabio_monoline_state_updated', handleMonolineStateUpdated);
      unsubReseller();
      unsubDp();
      unsubOrders();
      unsubInvoices();
    };
  }, [isOpen, currentUser]);

  const handleOpenOrderModal = (pkg: DealerPackage) => {
    setSelectedPkgForOrder(pkg);
    setOrderPaymentRef('');
    setOrderPaymentMethod('credit_card_3d');
    setPosCardHolder(activeReseller?.resellerName || 'YETKİLİ BAYİ');
    setChkSalesContract(false);
    setChkKvkk(false);
    setChkMlmTerms(false);
    setInspectedContractType(null);
    setShowOrderModal(true);
  };

  const handleConfirmOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReseller || !selectedPkgForOrder) return;
    if (!chkSalesContract || !chkKvkk || !chkMlmTerms) {
      alert(
        'Banka ve Ticaret Bakanlığı Uyum Denetimi: Ödemeyi tamamlamadan önce 3 zorunlu yasal sözleşme onay kutusunu işaretlemeniz gerekmektedir.'
      );
      return;
    }
    const orderPrice = regionalPrices?.[selectedPkgForOrder.id];
    if (orderPrice === undefined) {
      alert('Paket fiyatı sunucuda doğrulanamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
      return;
    }
    setIsSubmittingOrder(true);
    try {
      const simOrderId = `DORD-${crypto.randomUUID()}`;
      const approvals = await recordUserContractApprovals({
        user_id: activeReseller.uid,
        user_name: activeReseller.resellerName,
        order_id: simOrderId,
        order_amount: orderPrice,
        product_summary: `${selectedPkgForOrder.name} · ${selectedPkgForOrder.scanCredits} seans kredisi`,
        version: 'v2.2',
        contracts: ['PRE_INFORMATION', 'DISTANCE_SALES', 'KVKK', 'MLM_TERMS'],
      });
      if (approvals.length !== 4) throw new Error('Sözleşme onayları sunucuya kaydedilemedi. Ödeme başlatılmadı.');
      const posRes = await defaultPaymentProcessor.chargeCreditCard(
        {
          cardHolder: posCardHolder || activeReseller.resellerName,
          cardNumber: posCardNumber,
          cardExpiry: posCardExpiry,
          cardCvv: posCardCvv,
        },
        orderPrice,
        simOrderId,
        activeReseller.uid,
        [{ package_id: selectedPkgForOrder.id, quantity: 1 }]
      );

      const res = await requestDealerPackagePurchase(
        activeReseller.uid,
        activeReseller.resellerName,
        activeReseller.email,
        activeReseller.phone,
        { ...selectedPkgForOrder, price: orderPrice, priceText: formatUsd(orderPrice) },
        `${posRes.transaction_id} · ${orderPaymentRef.trim() || 'Sandbox Sanal POS'}`,
        'credit_card_3d',
        {
          order_id: posRes.order_id,
          merchant_oid: posRes.merchant_oid,
          transaction_id: posRes.transaction_id,
        }
      );

      if (res.success) {
        const refreshedSession = getActiveResellerSession();
        if (refreshedSession) {
          setActiveReseller(refreshedSession);
        }
        setShowOrderModal(false);
        setPurchaseSuccessMsg(`${res.message} (Sanal POS İşlem No: ${posRes.transaction_id})`);
        setTimeout(() => {
          setPurchaseSuccessMsg(null);
        }, 10000);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err?.message || 'Sipariş oluşturulamadı.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // ---- Dealer's own scan history (load + delete + bulk delete) ----
  const loadDealerScans = async (silent = false) => {
    const uid = currentUser?.uid || activeReseller?.uid || '';
    const email = currentUser?.email || activeReseller?.email || '';
    if (!uid) return;
    if (!silent) setDealerScansLoading(true);
    try {
      const list = await syncUserScansFromFirestore(uid, email);
      setDealerScans(list);
    } catch (e) {
      console.debug('Load dealer scans notice:', e);
    } finally {
      if (!silent) setDealerScansLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadDealerScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUser?.uid, currentUser?.email]);

  const handleDeleteDealerScan = (id: string) => {
    const uid = currentUser?.uid || activeReseller?.uid;
    setIsDeletingScanId(id);
    try {
      deleteScanResult(id, uid);
      setDealerScans(prev => prev.filter(s => s.id !== id));
      setScanActionMsg('Tarama kaydı kalıcı olarak silindi.');
      setTimeout(() => setScanActionMsg(null), 3000);
    } finally {
      setIsDeletingScanId(null);
    }
  };

  const handleClearAllDealerScans = async () => {
    if (dealerScans.length === 0) return;
    const uid = currentUser?.uid || activeReseller?.uid;
    const ok = window.confirm(`Tüm tarama kayıtlarınız (toplam ${dealerScans.length} adet) kalıcı olarak silinecek. Bu işlem geri alınamaz! Emin misiniz?`);
    if (!ok) return;
    setIsClearingDealerScans(true);
    try {
      await deleteScanRecordsByIds(dealerScans.map(s => s.id), uid);
      setDealerScans([]);
      setScanActionMsg(`Toplam ${dealerScans.length} tarama kaydı başarıyla silindi.`);
      setTimeout(() => setScanActionMsg(null), 4000);
    } catch (e) {
      console.error('Bulk delete dealer scans error:', e);
      alert('Tarama kayıtları silinirken bir hata oluştu.');
    } finally {
      setIsClearingDealerScans(false);
    }
  };

  // ---- Bayilerim tab: referred members (danisanlar/uyeler) + live credit sync ----
  const loadReferredUsersList = async (silent = false) => {
    if (!activeReseller) return;
    if (!silent) setSubResellersLoading(true);
    try {
      const data = await getReferredUsersForReseller(activeReseller.uid, activeReseller.referralCode);
      setReferredUsers(data);
    } catch (e) {
      console.debug('Load referred users notice:', e);
    } finally {
      if (!silent) setSubResellersLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'bayilerim' || !activeReseller) return;
    let cancelled = false;
    loadReferredUsersList();
    const unsub = subscribeToResellersList(list => {
      if (!cancelled) setLiveResellers(list);
    });
    return () => {
      cancelled = true;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab, activeReseller?.uid, activeReseller?.referralCode]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'bayilerim') return;
    setSubResellersLoading(true);
    const byUid = new Map<string, Reseller>();
    liveResellers.forEach(r => { if (r.uid) byUid.set(r.uid, r); });
    const merged = referredUsers.map(m => {
      const live = m.uid ? byUid.get(m.uid) : undefined;
      const statusRaw = live?.status || m.dealerStatus || (m.isApproved || m.isAllowed ? 'active' : 'active');
      return {
        uid: m.uid,
        resellerName: m.fullName || live?.resellerName || 'Davet Edilen Üye',
        fullName: m.fullName,
        email: m.email || live?.email || '',
        phone: m.phone || live?.phone || '',
        referralCode: m.referralCode || live?.referralCode || '-',
        commissionRate: live?.commissionRate ?? 20,
        bankInfo: live?.bankInfo || { bankName: '', accountHolder: m.fullName || '', iban: '' },
        status: statusRaw as Reseller['status'],
        totalEarnings: live?.totalEarnings || 0,
        paidEarnings: live?.paidEarnings || 0,
        pendingEarnings: live?.pendingEarnings || 0,
        totalSalesAmount: live?.totalSalesAmount || 0,
        totalReferredUsers: live?.totalReferredUsers || 0,
        creditsBalance: Number.isFinite(live?.creditsBalance) ? live!.creditsBalance! : (m.creditsBalance ?? 100),
        totalScans: live?.totalScans || 0,
        createdAt: m.createdAt || live?.createdAt || '',
        updatedAt: live?.updatedAt || '',
      } as Reseller;
    });
    setSubResellers(merged);
    setSubResellersLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab, referredUsers, liveResellers]);

  const creditColor = (c: number | undefined) => {
    if (c === undefined) return 'text-slate-400';
    if (c > 50) return 'text-emerald-300';
    if (c >= 20) return 'text-amber-300';
    return 'text-rose-300';
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    setLoginSuccess(null);

    try {
      const res = await loginAsReseller(loginInput);
      if (res.success && res.reseller) {
        try {
          sessionStorage.removeItem('aurabio_reseller_manual_logged_out');
        } catch {}
        setActiveReseller(res.reseller);
        setLoginSuccess(res.message);
        setBankForm({
          bankName: res.reseller.bankInfo?.bankName || '',
          accountHolder: res.reseller.bankInfo?.accountHolder || res.reseller.resellerName,
          iban: res.reseller.bankInfo?.iban || '',
        });
        const list = await getCommissionsForReseller(res.reseller.uid);
        setCommissions(list);
        setActiveTab('overview');
      } else {
        setLoginError(res.message);
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Giriş yapılamadı.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleNewResellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplying(true);
    setApplyMsg(null);

    try {
      const res = await registerNewReseller({
        resellerName: regName,
        email: regEmail,
        phone: regPhone,
        customReferralCode: regCustomCode,
        bankInfo: {
          bankName: regBankName,
          accountHolder: regAccountHolder || regName,
          iban: regIban,
        }
      });

      if (res.success && res.reseller) {
        try {
          sessionStorage.removeItem('aurabio_reseller_manual_logged_out');
        } catch {}
        setActiveReseller(res.reseller);
        setApplyMsg({ type: 'success', text: res.message });
        setBankForm(res.reseller.bankInfo);
        const list = await getCommissionsForReseller(res.reseller.uid);
        setCommissions(list);
        setTimeout(() => {
          setActiveTab('share');
        }, 1200);
      } else {
        setApplyMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setApplyMsg({ type: 'error', text: err?.message || 'Başvuru yapılamadı.' });
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReseller) return;

    setIsSavingBank(true);
    setBankMsg(null);

    try {
      const res = await updateResellerBankInfo(activeReseller.uid, bankForm);
      if (res.success && res.reseller) {
        setActiveReseller(res.reseller);
        setBankMsg({ type: 'success', text: res.message });
      } else {
        setBankMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setBankMsg({ type: 'error', text: err?.message || 'Banka bilgileri kaydedilemedi.' });
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleCopyLink = () => {
    if (!activeReseller) return;
    const link = generateReferralLink(activeReseller.referralCode);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!activeReseller) return;
    navigator.clipboard.writeText(activeReseller.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleLogout = () => {
    try {
      sessionStorage.setItem('aurabio_reseller_manual_logged_out', 'true');
    } catch {
      // non-blocking
    }
    clearStoredReferralCode();
    setActiveResellerSession(null);
    setActiveReseller(null);
    setCommissions([]);
    setLoginInput('');
    setLoginSuccess(null);
    setLoginError(null);
    setActiveTab('overview');
    onClose();
  };

  // Filter commissions
  const filteredCommissions = commissions.filter(c => {
    if (commFilter !== 'all' && c.status !== commFilter) return false;
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
  });

  const referralLink = activeReseller ? generateReferralLink(activeReseller.referralCode) : '';
  const waUrl = activeReseller ? generateWhatsAppShareUrl(activeReseller.referralCode, activeReseller.resellerName) : '#';
  const tgUrl = activeReseller ? generateTelegramShareUrl(activeReseller.referralCode) : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-emerald-500/40 rounded-3xl p-4 sm:p-7 shadow-2xl shadow-emerald-950/80 space-y-6 max-h-[95vh] overflow-y-auto">
        
        {/* Top Quick Navigation Bar (Geri, Ana Sayfa, Kapat & Aksiyonlar) */}
        <div className="flex items-center justify-between gap-2 pb-1">
          {/* Left: Geri and Ana Sayfa navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab !== 'overview' && activeReseller) {
                  setActiveTab('overview');
                } else {
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
              title="Önceki ekrana veya ana özete geri dön"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Geri</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-teal-500/50 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
              title="AuraBio Ana Sayfasına Dön"
            >
              <Home className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <span>Ana Sayfa</span>
            </button>
          </div>

          {/* Right: Quick commission / logout and close */}
          <div className="flex items-center gap-2">
            {activeReseller && (
              <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>%{activeReseller.commissionRate || 20} Komisyon</span>
              </div>
            )}
            {activeReseller && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="Bayi Panelinden Çıkış Yap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bayi Çıkışı</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Pencereyi Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/60 shrink-0">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
                  AuraBio Bayi & Komisyon Paneli
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
                  {getSiteContent().affiliateBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeReseller 
                  ? `Aktif Bayi: ${activeReseller.resellerName} • Kod: ${activeReseller.referralCode}`
                  : 'Yetkili bayi ve danışmanlık gelir takip yönetim merkezi'}
              </p>
            </div>
          </div>
        </div>

        {/* Dealer-Only Back-Office Navigation Bar (No Admin / SQL Panel) */}
        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <DealerEthicsGuidelines />
            <button
              type="button"
              onClick={() => onOpenMonolineModal?.('backoffice')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Bayi Back-Office</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Frekans Uygulamasına Dön</span>
          </button>
        </div>

        {/* If NO Active Reseller Logged In */}
        {!activeReseller ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            
            {/* Quick Reseller Login */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  Kayıtlı Bayi Girişi
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Size tanımlanmış yetkili Referans Kodunuz veya kayıtlı e-posta adresiniz ile bayi panelinize güvenle erişin.
                </p>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {loginSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{loginSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Bayi Referans Kodu veya E-Posta:
                    </label>
                    <input
                      type="text"
                      required
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      placeholder="Bayi Kodu veya ornek@bayi.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none uppercase font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoggingIn ? 'Giriş Doğrulanıyor...' : 'Bayi Paneline Giriş Yap'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Become a Reseller Application */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-emerald-500/30 space-y-4 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Yeni Bayilik Başvurusu & Ortaklık
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AuraBio Frekans sisteminin resmi bayisi ve çözüm ortağı olun. Üyelerinize frekans sağlarken her lisans yenilemesinden <strong className="text-emerald-400">%20-%25 komisyon</strong> kazanın.
              </p>

              <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>🎁 İlk Bayi Kaydına Özel Hoşgeldin Bonusu: 32 + 32 = 64 Seans Kredisi</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-black text-emerald-200 shrink-0">
                  Bir Defaya Mahsus Otomatik
                </span>
              </div>

              {applyMsg && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  applyMsg.type === 'success' 
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                }`}>
                  {applyMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{applyMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleNewResellerSubmit} className="space-y-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">İşletme / Bayi Adı:</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Örn: BioRezonans Frekans Merkezi"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs text-slate-100 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">E-Posta:</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="bayi@mail.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs text-slate-100 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Telefon / WhatsApp:</label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>Tercih Edilen Referans Kodu (Opsiyonel):</span>
                    <span className="text-[10px] text-slate-500">Boş bırakılırsa otomatik üretilir</span>
                  </label>
                  <input
                    type="text"
                    value={regCustomCode}
                    onChange={(e) => setRegCustomCode(e.target.value)}
                    placeholder="Örn: AURA-BAYI-4820"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs text-slate-100 uppercase font-mono outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isApplying}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-950/60 transition-all flex items-center justify-center gap-2"
                >
                  {isApplying ? 'Başvuru Kaydediliyor...' : 'Bayilik Hesabını Anında Oluştur'}
                  <Sparkles className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        ) : (
          /* Logged In Reseller Workspace */
          <div className="space-y-6">

            {/* OUT OF CREDITS NOTIFICATION BANNER */}
            {activeReseller.creditsBalance !== undefined && activeReseller.creditsBalance <= 0 && (
              <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/90 via-amber-950/80 to-slate-950 border border-rose-500/60 shadow-xl shadow-rose-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-rose-200">
                      Kredi Havuzunuz Bitti (0 Seans Hakkı)
                    </h4>
                    <p className="text-xs text-rose-300/80">
                      Danışanlarınıza tarama ve frekans seansı uygulayabilmek için lütfen paket satın alma talebi oluşturun.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('packages')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shrink-0 cursor-pointer"
                >
                  <Coins className="w-4 h-4" />
                  <span>Paket Satın Al / Kredi Yükle</span>
                </button>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Finansal Özet</span>
              </button>

              <button
                onClick={() => setActiveTab('clients')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'clients'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-emerald-400 hover:text-emerald-200 bg-emerald-950/30 border border-emerald-500/20'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Danışanlarım & Üyelerim</span>
                <span className="px-1.5 py-0.2 bg-emerald-900 text-emerald-200 border border-emerald-500/40 rounded-full text-[10px] font-mono font-bold">
                  {referredUsers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('scans')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'scans'
                    ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-md'
                    : 'text-rose-400 hover:text-rose-200 bg-rose-950/40 border border-rose-500/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Tarama Geçmişim</span>
                <span className="px-1.5 py-0.2 bg-rose-950 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-mono font-bold">
                  {dealerScans.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('bayilerim')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'bayilerim'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                    : 'text-teal-400 hover:text-teal-200 bg-teal-950/40 border border-teal-500/30'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Bayilerim & Kredi</span>
                <span className="px-1.5 py-0.2 bg-teal-950 text-teal-300 border border-teal-500/40 rounded-full text-[10px] font-mono font-bold">
                  {subResellers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('presentation')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'presentation'
                    ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md'
                    : 'text-indigo-400 hover:text-indigo-200 bg-indigo-950/40 border border-indigo-500/30'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>İş Sunum Raporu & Katalog</span>
                <span className="px-1.5 py-0.2 bg-indigo-900 text-indigo-200 border border-indigo-500/50 rounded-full text-[10px] font-bold">
                  PDF / Web
                </span>
              </button>

              <button
                onClick={() => setActiveTab('packages')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'packages'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                    : activeReseller.creditsBalance !== undefined && activeReseller.creditsBalance <= 0
                    ? 'text-rose-300 bg-rose-950/60 border border-rose-500/50 animate-pulse'
                    : 'text-teal-400 hover:text-teal-200 bg-teal-950/40 border border-teal-500/30'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Paket Satın Al / Kredi Yükle</span>
                {typeof activeReseller.creditsBalance === 'number' && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeReseller.creditsBalance <= 0 
                      ? 'bg-rose-900 text-rose-200 border border-rose-500/60' 
                      : 'bg-teal-950 text-teal-300 border border-teal-500/50'
                  }`}>
                    {activeReseller.creditsBalance} Seans
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('share')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'share'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Özel Davet Linki & Paylaşım</span>
              </button>

              <button
                onClick={() => setActiveTab('commissions')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'commissions'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Satış & Komisyon Geçmişi</span>
                <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px]">
                  {commissions.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'invoices'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-400 hover:text-purple-200 bg-purple-950/40 border border-purple-500/30'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Faturalarım</span>
                <span className="px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-500/40 rounded-full text-[10px] font-mono font-bold">
                  {invoices.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'documents'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-indigo-400 hover:text-indigo-200 bg-indigo-950/40 border border-indigo-500/30'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dökümanlar</span>
              </button>

              <button
                onClick={() => setActiveTab('bank')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'bank'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Banka & IBAN Bilgileri</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & FINANCIAL METRICS */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* 5 Cards Metrics including Credits Balance */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                  
                  {/* Active Scan Credits Pool */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 col-span-2 sm:col-span-1 shadow-lg transition-all ${
                    activeReseller.creditsBalance !== undefined && activeReseller.creditsBalance <= 0
                      ? 'bg-gradient-to-br from-rose-950/90 to-slate-950 border-rose-500/60 shadow-rose-950/50 ring-1 ring-rose-500/40'
                      : 'bg-gradient-to-br from-teal-950/80 to-slate-950 border-teal-500/50 shadow-teal-950/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        activeReseller.creditsBalance !== undefined && activeReseller.creditsBalance <= 0
                          ? 'text-rose-300'
                          : 'text-teal-300'
                      }`}>
                        Kredi Havuzu
                      </span>
                      <Coins className={`w-4 h-4 ${
                        activeReseller.creditsBalance !== undefined && activeReseller.creditsBalance <= 0
                          ? 'text-rose-400 animate-bounce'
                          : 'text-teal-400 animate-pulse'
                      }`} />
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl sm:text-3xl font-black font-mono ${
                        activeReseller.creditsBalance !== undefined && activeReseller.creditsBalance <= 0
                          ? 'text-rose-400'
                          : 'text-teal-300'
                      }`}>
                        {activeReseller.creditsBalance !== undefined ? activeReseller.creditsBalance : 64}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">Seans</span>
                    </div>

                    <div className="text-[10px] text-emerald-300/90 font-semibold flex items-center gap-1">
                      <span>🎁 Hoşgeldin Bonusu: {getSiteContent().welcomeBonusLabel} • 1/1</span>
                    </div>

                    <div className="text-[10px] flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className={activeReseller.creditsBalance !== undefined && activeReseller.creditsBalance <= 0 ? 'text-rose-400 font-bold' : 'text-teal-400/90'}>
                        {activeReseller.creditsBalance !== undefined && activeReseller.creditsBalance <= 0 ? 'Tükendi (0 Hak)' : 'Kalan Seans Hakkı'}
                      </span>
                      <button
                        onClick={() => setActiveTab('packages')}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Paket Satın Al & Kredi Yükle"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Kredi Yükle</span>
                      </button>
                    </div>
                  </div>

                  {/* Total Sales Volume */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-medium">Toplam Oluşturulan Ciro</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
                      {formatUsd(activeReseller.totalSalesAmount || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Yönlendirilen üye cirosu
                    </div>
                  </div>

                  {/* Total Earned Commission */}
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between text-emerald-300">
                      <span className="text-xs font-bold">Kazanılan Komisyon</span>
                      <Award className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-300 font-mono">
                      {formatUsd(activeReseller.totalEarnings || 0)}
                    </div>
                    <div className="text-[10px] text-emerald-400/70 font-medium">
                      %{activeReseller.commissionRate || 20} hak ediş oranı
                    </div>
                  </div>

                  {/* Paid Commission */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-teal-400">
                      <span className="text-xs font-medium">Ödenen Komisyon</span>
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-teal-300 font-mono">
                      {formatUsd(activeReseller.paidEarnings || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Hesaba aktarılan tutar
                    </div>
                  </div>

                  {/* Pending / Available Balance */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="text-xs font-medium">Bekleyen Bakiye</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-amber-300 font-mono">
                      {formatUsd(activeReseller.pendingEarnings || 0)}
                    </div>
                    <div className="text-[10px] text-amber-400/80">
                      Transfer edilecek
                    </div>
                  </div>
                </div>

                {/* Quick Share Callout Banner */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-950/90 border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        ÖZEL DAVET KODUNUZ
                      </span>
                      <strong className="text-sm sm:text-base font-mono text-emerald-200">
                        {activeReseller.referralCode}
                      </strong>
                    </div>
                    <p className="text-xs text-slate-300">
                      Bu bağlantı üzerinden kayıt olan tüm üyelerin lisans yenilemelerinden komisyon otomatik olarak hesabınıza işlenir.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {onOpenBusinessPresentation && (
                      <button
                        onClick={onOpenBusinessPresentation}
                        className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/50 cursor-pointer"
                        title="İş Sunum Raporunu ve Dijital Kataloğu Aç"
                      >
                        <BookOpen className="w-4 h-4 text-teal-200" />
                        <span>📊 İş Sunum Raporu & Katalog</span>
                      </button>
                    )}
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Link Kopyalandı!' : 'Davet Linkini Kopyala'}</span>
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>WhatsApp Paylaş</span>
                    </a>
                  </div>
                </div>

                {/* Privacy & Reseller Rules */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Gizlilik ve KVKK Kuralı:</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    AuraBio Frekans sisteminde üyelerin kişisel verileri KVKK standartları gereği korunmaktadır. Bayi panelinizde davet linkinizle kayıt olan tüm danışanlarınızın seans paketleri, onay durumları ve komisyon getirileri anlık olarak listelenir.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: DANIŞANLARIM & KAYITLI ÜYELERİM (CLIENTS & REFERRED USERS) */}
            {activeTab === 'clients' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-950 to-teal-950/70 border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base font-extrabold text-slate-100">Danışanlarım & Kayıtlı Üyelerim</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                        {activeReseller.referralCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Sizin özel referans linkiniz (<strong className="text-emerald-300">{activeReseller.referralCode}</strong>) ile kayıt olan tüm danışanlarınız doğrudan bayinize bağlıdır. Bu üyelerin tüm seans ve paket alımları komisyon havuzunuza otomatik aktarılır.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => {
                        const link = generateReferralLink(activeReseller.referralCode);
                        navigator.clipboard.writeText(link);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Davet Linki Kopyalandı!' : 'Davet Linkimi Kopyala'}</span>
                    </button>
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-medium">Toplam Kayıtlı Danışan</span>
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-slate-100 font-mono">
                      {referredUsers.length}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Bayi davetinizle bağlanan kullanıcılar
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between text-emerald-300">
                      <span className="text-xs font-medium">Aktif / Onaylı Danışan</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-300 font-mono">
                      {referredUsers.filter(u => u.isAllowed || u.isApproved).length}
                    </div>
                    <div className="text-[10px] text-emerald-400/80">
                      Sistemi aktif kullanan üyeler
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/30 space-y-1">
                    <div className="flex items-center justify-between text-teal-300">
                      <span className="text-xs font-medium">Komisyon Üreten İşlemler</span>
                      <DollarSign className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-2xl font-bold text-teal-300 font-mono">
                      {commissions.length} İşlem
                    </div>
                    <div className="text-[10px] text-teal-400/80">
                      Üyelerinizin gerçekleştirdiği siparişler
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={referredUserSearch}
                      onChange={(e) => setReferredUserSearch(e.target.value)}
                      placeholder="Danışan Adı, E-Posta veya Paket Ara..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                  <span className="text-xs text-slate-400 px-2 font-mono">
                    {referredUsers.filter(u => {
                      if (!referredUserSearch.trim()) return true;
                      const q = referredUserSearch.toLowerCase();
                      return (
                        (u.fullName || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q) ||
                        (u.selectedPackage || '').toLowerCase().includes(q)
                      );
                    }).length} Danışan Bulundu
                  </span>
                </div>

                {/* Clients Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                        <th className="py-3 px-4">Danışan / Üye Adı</th>
                        <th className="py-3 px-4">İletişim & E-Posta</th>
                        <th className="py-3 px-4">Seçilen Paket</th>
                        <th className="py-3 px-4">Kayıt Tarihi</th>
                        <th className="py-3 px-4">Durum</th>
                        <th className="py-3 px-4 text-right">Referans Kodu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {referredUsers
                        .filter(u => {
                          if (!referredUserSearch.trim()) return true;
                          const q = referredUserSearch.toLowerCase();
                          return (
                            (u.fullName || '').toLowerCase().includes(q) ||
                            (u.email || '').toLowerCase().includes(q) ||
                            (u.selectedPackage || '').toLowerCase().includes(q)
                          );
                        })
                        .map(u => (
                          <tr key={u.uid} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-100 flex items-center gap-2">
                                <span>{u.fullName || 'İsimsiz Üye'}</span>
                                {u.demoUsed && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold border border-indigo-500/30">
                                    Demo
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                ID: {u.uid.substring(0, 8)}...
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                              <div>{u.email}</div>
                              {u.phone && <div className="text-[10px] text-slate-500">{u.phone}</div>}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 font-medium text-[11px] border border-slate-700">
                                {u.selectedPackage || 'Standart Üyelik'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '—'}
                            </td>
                            <td className="py-3.5 px-4">
                              {u.isAllowed || u.isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Aktif Üye</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                  <Clock className="w-3 h-3" />
                                  <span>Beklemede</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="px-2 py-1 rounded-md bg-emerald-950/80 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                                {u.referredByCode || activeReseller.referralCode}
                              </span>
                            </td>
                          </tr>
                        ))}

                      {referredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                                <Users className="w-6 h-6" />
                              </div>
                              <div className="space-y-1 max-w-sm">
                                <h4 className="text-sm font-bold text-slate-300">Henüz Kayıtlı Danışanınız Yok</h4>
                                <p className="text-xs text-slate-400">
                                  Size özel davet linkinizi danışanlarınızla paylaşarak kayıt olmalarını sağlayabilir ve komisyon kazanabilirsiniz.
                                </p>
                              </div>
                              <button
                                onClick={() => setActiveTab('share')}
                                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Özel Paylaşım Linkimi Aç</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: BAYİLERİM, MONOLINE TEK HAT AĞACI & KREDİ DURUMLARI */}
            {activeTab === 'bayilerim' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-950/80 via-slate-950 to-emerald-950/70 border border-teal-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-400" />
                      <h3 className="text-base font-extrabold text-slate-100">
                        Alt Bayilerim &amp; Monoline Tek Hat Ağaç Yapısı
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold font-mono">
                        Sponsor Kodunuz: {activeReseller.referralCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Her bayi kendi kaydettiği bayinin doğrudan sponsorudur. Bu ekranda yalnızca{' '}
                      <strong className="text-teal-300">kendinizden sonraki kendi alt bayilerinizi</strong>{' '}
                      Monoline tek hat ağaç yapısında görürsünüz. Üst sponsorların diğer bayileri ağaç
                      yapısında gizlenmiştir.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        redirectToDealerRegistrationPortal({
                          user_id: activeReseller.uid,
                          full_name: activeReseller.resellerName,
                          ref_code: activeReseller.referralCode,
                          email: activeReseller.email,
                          phone: activeReseller.phone,
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Kendi Altınıza Yeni Bayi Kaydet</span>
                    </button>
                    <button
                      onClick={() => loadReferredUsersList()}
                      disabled={subResellersLoading}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw className={`w-4 h-4 ${subResellersLoading ? 'animate-spin' : ''}`} />
                      <span>Yenile</span>
                    </button>
                  </div>
                </div>

                {subDealerFeedback && (
                  <div
                    className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                      subDealerFeedback.type === 'success'
                        ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    <span>{subDealerFeedback.text}</span>
                    <button
                      type="button"
                      onClick={() => setSubDealerFeedback(null)}
                      className="text-xs underline cursor-pointer"
                    >
                      Kapat
                    </button>
                  </div>
                )}

                {showAddSubDealerForm && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!subDealerName.trim() || !subDealerEmail.trim() || !subDealerPhone.trim()) return;
                      setIsAddingSubDealer(true);
                      setSubDealerFeedback(null);
                      try {
                        const res = await registerNewReseller({
                          resellerName: subDealerName.trim(),
                          email: subDealerEmail.trim(),
                          phone: subDealerPhone.trim(),
                          referredByCode: activeReseller.referralCode,
                          sponsorId: activeReseller.uid,
                          keepCurrentSession: true,
                        });
                        if (!res.success) {
                          setSubDealerFeedback({ type: 'error', text: res.message });
                        } else {
                          try {
                            await fetch('/api/v1/members', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                user_id: res.reseller?.uid,
                                full_name: subDealerName.trim(),
                                city: subDealerCity.trim() || 'İstanbul',
                                email: subDealerEmail.trim(),
                                phone: subDealerPhone.trim(),
                                ref_code: res.reseller?.referralCode,
                                sponsor_id: activeReseller.uid,
                                initial_package_id: 'PKG_MINI_DENEME',
                              }),
                            });
                          } catch {}
                          setSubDealerFeedback({
                            type: 'success',
                            text: `${subDealerName.trim()} sizin doğrudan sponsorluğunuzda (${activeReseller.referralCode}) alt bayi olarak kaydedildi ve Monoline tek hat ağacınıza eklendi!`,
                          });
                          setSubDealerName('');
                          setSubDealerEmail('');
                          setSubDealerPhone('');
                          setShowAddSubDealerForm(false);
                          await loadReferredUsersList();
                        }
                      } catch (err: any) {
                        setSubDealerFeedback({
                          type: 'error',
                          text: err?.message || 'Alt bayi kaydedilirken hata oluştu.',
                        });
                      } finally {
                        setIsAddingSubDealer(false);
                      }
                    }}
                    className="p-5 rounded-3xl bg-slate-950/90 border border-emerald-500/40 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-emerald-300">
                          Kendi Sponsorluğunuzda Yeni Alt Bayi Oluştur
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Yeni kaydedilen bayinin Direkt Sponsoru otomatik olarak siz (
                          <strong className="text-white">{activeReseller.resellerName}</strong> —{' '}
                          <span className="font-mono text-emerald-300">
                            {activeReseller.referralCode}
                          </span>
                          ) olursunuz ve Monoline tek hat ağacınızda sizden sonraki sıraya eklenir.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddSubDealerForm(false)}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Kapat
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Alt Bayi Adı / Unvanı
                        </label>
                        <input
                          type="text"
                          required
                          value={subDealerName}
                          onChange={(e) => setSubDealerName(e.target.value)}
                          placeholder="Örn: Ege Frekans Merkezi"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          E-Posta Adresi
                        </label>
                        <input
                          type="email"
                          required
                          value={subDealerEmail}
                          onChange={(e) => setSubDealerEmail(e.target.value)}
                          placeholder="altbayi@mail.com"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Telefon / WhatsApp
                        </label>
                        <input
                          type="tel"
                          required
                          value={subDealerPhone}
                          onChange={(e) => setSubDealerPhone(e.target.value)}
                          placeholder="05XX XXX XX XX"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Direkt Sponsoru (Otomatik Kilitli)
                        </label>
                        <div className="w-full px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-1.5 truncate">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {activeReseller.resellerName} ({activeReseller.referralCode})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        disabled={isAddingSubDealer}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                      >
                        {isAddingSubDealer
                          ? 'Alt Bayi Kaydediliyor...'
                          : 'Sponsorluğumda Kaydet ve Tek Hat Ağacıma Ekle'}
                      </button>
                    </div>
                  </form>
                )}

                {/* SOL KOL & SAĞ KOL (İKİLİ DENGE HATTI) + YETERLİLİKLER VE EKSİKLER ANALİZ PANELİ */}
                {(() => {
                  const leftSubDealers = subResellers.filter((_, idx) => idx % 2 === 0);
                  const rightSubDealers = subResellers.filter((_, idx) => idx % 2 === 1);
                  const leftActiveCount = leftSubDealers.filter(
                    (r) => !['suspended', 'rejected', 'pending'].includes(String(r.status))
                  ).length;
                  const rightActiveCount = rightSubDealers.filter(
                    (r) => !['suspended', 'rejected', 'pending'].includes(String(r.status))
                  ).length;
                  const leftVol = leftSubDealers.reduce(
                    (s, r) => s + Number(r.totalSalesAmount || 5000),
                    0
                  );
                  const rightVol = rightSubDealers.reduce(
                    (s, r) => s + Number(r.totalSalesAmount || 5000),
                    0
                  );

                  const missingLeft = Math.max(0, 1 - leftActiveCount);
                  const missingRight = Math.max(0, 1 - rightActiveCount);


                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* SOL KOL */}
                        <div className="p-5 rounded-3xl bg-slate-950/90 border border-emerald-500/40 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                SOL KOL (1. ANA KOL · GÜÇLÜ HAT)
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-100 mt-1">
                                Sol Kol Bayi &amp; Yeterlilik Durumu
                              </h4>
                            </div>
                            <div className="text-right font-mono">
                              <div className="text-xl font-black text-emerald-400">
                                {leftSubDealers.length} Bayi
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {leftActiveCount} Aktif · Ciro: {formatUsd(leftVol)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                            <span className="text-slate-300">Sol Kol Yeterliliği:</span>
                            <span
                              className={`font-bold ${
                                missingLeft === 0 ? 'text-emerald-400' : 'text-amber-300'
                              }`}
                            >
                              {missingLeft === 0
                                ? '✓ SOL KOL TAMAMLANDI'
                                : `⚠️ Eksik: +${missingLeft} Aktif Bayi`}
                            </span>
                          </div>
                        </div>

                        {/* SAĞ KOL */}
                        <div className="p-5 rounded-3xl bg-slate-950/90 border border-indigo-500/40 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                                SAĞ KOL (2. ANA KOL · DENGE HATTI)
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-100 mt-1">
                                Sağ Kol Bayi &amp; Yeterlilik Durumu
                              </h4>
                            </div>
                            <div className="text-right font-mono">
                              <div className="text-xl font-black text-indigo-400">
                                {rightSubDealers.length} Bayi
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {rightActiveCount} Aktif · Ciro: {formatUsd(rightVol)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                            <span className="text-slate-300">Sağ Kol Yeterliliği:</span>
                            <span
                              className={`font-bold ${
                                missingRight === 0 ? 'text-emerald-400' : 'text-amber-300'
                              }`}
                            >
                              {missingRight === 0
                                ? '✓ SAĞ KOL TAMAMLANDI'
                                : `⚠️ Eksik: +${missingRight} Aktif Bayi`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Eksikler & Yeterlilikler Özet Kutusu */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Sol / Sağ Kol Dengesi</div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            Sol: {leftActiveCount} Aktif · Sağ: {rightActiveCount} Aktif
                          </div>
                          <div className="text-[11px] text-emerald-400 mt-0.5">
                            {missingLeft === 0 && missingRight === 0
                              ? '✓ İki Kol Aktif ve Dengeli'
                              : `Eksikler: Sol (${missingLeft}) / Sağ (${missingRight})`}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800">
                          <div className="text-[10px] text-slate-400">
                            Aktiflik Kuralı
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            Her Paket Alımı = 30 Gün Aktiflik
                          </div>
                          <div className="text-[11px] text-emerald-400 mt-0.5">
                            ✓ Süre devam ederken alım yapılırsa kalan süreye 30 gün eklenir
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* MONOLINE TEK HAT ALT BAYİ AĞAÇ YAPISI (SADECE BAYİ VE ALT EKİBİ) */}
                <div className="p-5 rounded-3xl bg-slate-950/90 border border-emerald-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                        Monoline Tek Hat Alt Bayi Ağaç Yapısı (Kendi Sponsorluk Hattınız)
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Kök noktanızdan başlayarak sadece sizin ve alt bayilerinizin kaydettiği
                        bayiler tek hat üzerinde sıralanır. Üst sponsorların diğer bayileri
                        gösterilmez.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold self-start">
                      Kök + {subResellers.length} Alt Bayi
                    </span>
                  </div>

                  <div className="overflow-x-auto pb-2 pt-1">
                    <div className="inline-flex items-stretch gap-3 min-w-full">
                      {/* Root Node: The Dealer Themselves */}
                      <div className="w-60 shrink-0 rounded-2xl p-4 bg-gradient-to-b from-emerald-950/90 to-slate-900 border-2 border-emerald-500/60 text-white flex flex-col justify-between shadow-lg">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">
                              KÖK BAYİ (SİZ)
                            </span>
                            <span className="text-emerald-300 font-bold">
                              {activeReseller.creditsBalance ?? 0} Kredi
                            </span>
                          </div>
                          <div className="text-sm font-extrabold truncate pt-1">
                            {activeReseller.resellerName}
                          </div>
                          <div className="text-[11px] font-mono text-teal-300">
                            Kod: {activeReseller.referralCode}
                          </div>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-300 flex justify-between">
                          <span>Alt Ağaç:</span>
                          <span className="font-bold text-emerald-300">
                            +{subResellers.length} Alt Bayi
                          </span>
                        </div>
                      </div>

                      {subResellers.map((sub, idx) => {
                        const isDirect =
                          (sub.referredByCode || '').trim().toUpperCase() ===
                          (activeReseller.referralCode || '').trim().toUpperCase();
                        return (
                          <React.Fragment key={sub.uid}>
                            <div className="flex items-center justify-center text-emerald-400 shrink-0">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                            <div className="w-60 shrink-0 rounded-2xl p-4 bg-slate-900/90 border border-slate-700 hover:border-teal-500/50 text-slate-100 flex flex-col justify-between">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                                    ALT HAT #{idx + 1}
                                  </span>
                                  <span className="text-amber-300 font-bold">
                                    {sub.creditsBalance ?? 0} Kredi
                                  </span>
                                </div>
                                <div className="text-sm font-bold truncate pt-1">
                                  {sub.resellerName || sub.fullName || 'Alt Bayi'}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  Kod: {sub.referralCode}
                                </div>
                              </div>
                              <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Sponsoru:</span>
                                  <span className="font-bold text-emerald-300 truncate max-w-[115px]">
                                    {isDirect
                                      ? 'Siz (Doğrudan)'
                                      : sub.referredByCode || activeReseller.referralCode}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-medium">Toplam Danışan / Üye</span>
                      <Users className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-2xl font-bold text-slate-100 font-mono">
                      {subResellers.length}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Davet kodunuza bağlı üyeler
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-1">
                    <div className="flex items-center justify-between text-teal-300">
                      <span className="text-xs font-medium">Toplam Kalan Kredi</span>
                      <Coins className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-2xl font-bold text-teal-300 font-mono">
                      {subResellers.reduce((t, r) => t + (typeof r.creditsBalance === 'number' ? r.creditsBalance : 0), 0).toLocaleString('tr-TR')}
                    </div>
                    <div className="text-[10px] text-teal-400/80">
                      Tüm danışanlarınızın seans kredi havuzu
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="text-xs font-medium">Düşük / Yetersiz Kredi</span>
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-amber-300 font-mono">
                      {subResellers.filter(r => (r.creditsBalance ?? 0) < 20).length}
                    </div>
                    <div className="text-[10px] text-amber-400/80">
                      20 seansın altında kredisi olan üyeler
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={subResellersSearch}
                      onChange={(e) => setSubResellersSearch(e.target.value)}
                      placeholder="Danışan adı, e-posta veya referans kodu ara..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                  <span className="text-xs text-slate-400 px-2 font-mono">
                    {subResellers.filter(r => {
                      if (!subResellersSearch.trim()) return true;
                      const q = subResellersSearch.toLowerCase();
                      return (
                        (r.resellerName || r.fullName || '').toLowerCase().includes(q) ||
                        (r.email || '').toLowerCase().includes(q) ||
                        (r.referralCode || '').toLowerCase().includes(q)
                      );
                    }).length} Danışan Bulundu
                  </span>
                </div>

                {/* Sub-dealers Table */}
                {subResellersLoading && subResellers.length === 0 ? (
                  <div className="flex items-center justify-center gap-3 p-10 text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Alt bayilerinizi listeliyoruz...</span>
                  </div>
                ) : subResellers.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    Henüz davet kodunuza bağlı bir danışan / üye bulunmuyor. Davet linkinizi paylaştığınız üyeler otomatik olarak burada listelenir.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                          <th className="py-3 px-4">Danışan / Üye</th>
                          <th className="py-3 px-4">Referans Kodu</th>
                          <th className="py-3 px-4">Durum</th>
                          <th className="py-3 px-4 text-right">Kalan Kredi</th>
                          <th className="py-3 px-4 text-right">Toplam Tarama</th>
                          <th className="py-3 px-4">Kayıt Tarihi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {subResellers
                          .filter(r => {
                            if (!subResellersSearch.trim()) return true;
                            const q = subResellersSearch.toLowerCase();
                            return (
                              (r.resellerName || r.fullName || '').toLowerCase().includes(q) ||
                              (r.email || '').toLowerCase().includes(q) ||
                              (r.referralCode || '').toLowerCase().includes(q)
                            );
                          })
                          .map(r => (
                            <tr key={r.uid} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-100 flex items-center gap-2">
                                  <span>{r.resellerName || r.fullName || 'Yetkili Bayi'}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {r.email || '-'}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[10px] font-mono font-bold">
                                  {r.referralCode || '-'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  r.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : ['suspended', 'rejected'].includes(String(r.status))
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }`}>
                                  {r.status === 'pending' ? 'Beklemede' : ['suspended', 'rejected'].includes(String(r.status)) ? 'Askıda' : 'Aktif'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Coins className="w-3.5 h-3.5 text-teal-500" />
                                  <span className={`text-sm font-extrabold font-mono ${creditColor(r.creditsBalance)}`}>
                                    {r.creditsBalance ?? 0}
                                  </span>
                                  <span className="text-[10px] text-slate-500">seans</span>
                                </div>
                                {(r.creditsBalance ?? 0) < 20 && (
                                  <div className="text-[10px] text-rose-400 mt-0.5">Kredi azalıyor - yükleme önerilir</div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                                {r.totalScans ?? 0}
                              </td>
                              <td className="py-3.5 px-4 text-[11px] text-slate-500">
                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {subResellers.filter(r => {
                      if (!subResellersSearch.trim()) return true;
                      const q = subResellersSearch.toLowerCase();
                      return (
                        (r.resellerName || r.fullName || '').toLowerCase().includes(q) ||
                        (r.email || '').toLowerCase().includes(q) ||
                        (r.referralCode || '').toLowerCase().includes(q)
                      );
                    }).length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-500">Arama sonucu bulunamadı.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'scans' && (
              <div className="space-y-4">
                {/* Header + Actions */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/60">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">Tarama Geçmişim</h3>
                      <p className="text-[11px] text-slate-400">
                        Kendi panelinizde yapılan tüm tarama kayıtları. Silme işlemi kalıcıdır ve Firestore veritabanından kaldırır.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => loadDealerScans()}
                      disabled={dealerScansLoading}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${dealerScansLoading ? 'animate-spin' : ''}`} />
                      <span>Yenile</span>
                    </button>
                    <button
                      onClick={handleClearAllDealerScans}
                      disabled={dealerScans.length === 0 || isClearingDealerScans}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        dealerScans.length > 0
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/60'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isClearingDealerScans ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Tüm Geçmişi Sil ({dealerScans.length})</span>
                    </button>
                  </div>
                </div>

                {scanActionMsg && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{scanActionMsg}</span>
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={dealerScansSearch}
                    onChange={(e) => setDealerScansSearch(e.target.value)}
                    placeholder="Tarih, tarama tipi veya frekans arayın..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-rose-500 placeholder:text-slate-600"
                  />
                </div>

                {/* Records */}
                {dealerScansLoading && dealerScans.length === 0 ? (
                  <div className="flex items-center justify-center gap-3 p-10 text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    <span>Tarama kayıtlarınız yükleniyor...</span>
                  </div>
                ) : dealerScans.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    Henüz hiç tarama kaydınız bulunmuyor. Yaptığınız taramalar burada anlık olarak görünecektir.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="p-3">Tarih / Saat</th>
                          <th className="p-3">Tarama Türü</th>
                          <th className="p-3">Frekans</th>
                          <th className="p-3">Enerji</th>
                          <th className="p-3">Durum</th>
                          <th className="p-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {dealerScans
                          .filter(s => {
                            const q = dealerScansSearch.trim().toLowerCase();
                            if (!q) return true;
                            return (
                              (s.treatmentName || s.targetName || s.targetType || '').toString().toLowerCase().includes(q) ||
                              String(s.frequencyHz || '').includes(q) ||
                              new Date(s.timestamp).toLocaleString('tr-TR').toLowerCase().includes(q)
                            );
                          })
                          .map(s => (
                            <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="p-3 text-[11px] text-slate-400 whitespace-nowrap font-mono">
                                {new Date(s.timestamp).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                                  {(s.treatmentName || s.targetName || s.targetType || 'Biyo-Aura Tarama')}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-amber-300">
                                {s.frequencyHz ? `${s.frequencyHz} Hz` : '-'}
                              </td>
                              <td className="p-3 font-mono text-[11px]">
                                <span className="text-emerald-300">{s.bioEnergyLevel}%</span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${s.isAfterTreatment ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30'}`}>
                                  {s.isAfterTreatment ? 'Tedavi Sonrası' : 'Tarama'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleDeleteDealerScan(s.id)}
                                  disabled={isDeletingScanId === s.id}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer disabled:opacity-40"
                                  title="Bu tarama kaydını sil"
                                >
                                  {isDeletingScanId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {dealerScans.filter(s => {
                      const q = dealerScansSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (s.treatmentName || s.targetName || s.targetType || '').toString().toLowerCase().includes(q) || String(s.frequencyHz || '').includes(q) || new Date(s.timestamp).toLocaleString('tr-TR').toLowerCase().includes(q);
                    }).length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-500">Arama sonucu bulunamadı.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'presentation' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner with Clean Typographic Hierarchy */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/95 via-slate-950 to-teal-950/90 border border-indigo-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl shadow-indigo-950/60">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold tracking-wide">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>AuraBio Frekans Enterprise</span>
                      <span aria-hidden="true" className="text-slate-500">·</span>
                      <span className="text-emerald-400 font-bold">v6.0 Güncel</span>
                      <span aria-hidden="true" className="text-slate-500">·</span>
                      <span className="text-amber-300 font-bold">BDDK &amp; TCMB Uyumlu</span>
                      <span aria-hidden="true" className="text-slate-500">·</span>
                      <span className="text-teal-300 font-bold">Monoline 7 Nefis MLM</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
                      Dijital İş Sunum Raporu &amp; Tanıtım Kataloğu (v6.0 Enterprise)
                    </h3>
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                      Danışanlarınıza, kliniklere, terapistlere ve potansiyel alt bayilerinize gönderebileceğiniz; <strong>Canlı Optik Spektrometre &amp; 3D Biyo-Aura</strong>, <strong>10s Vokal Akustik F0 Spektrometre</strong>, <strong>Web BLE Akıllı Saat Nabız/HRV Köprüsü</strong>, <strong>302+ Kadim Şifa &amp; 50+ Hastalık Ansiklopedisi</strong>, <strong>15 Resmi Kredi Havuzu Paketi</strong>, <strong>BDDK/TCMB 3D Secure Sanal POS</strong> ve <strong>Monoline 7 Nefis MLM</strong> (Direkt Sponsor %20 + Tek Hat %25 + Kariyer Havuzu %50 + Liderlik Eşleşme %20) gelir simülatörünü içeren en kapsamlı sunum ve katalog merkezi. Paylaştığınız linkten kaydolan herkes doğrudan <strong className="text-emerald-300">{activeReseller.resellerName}</strong> bayinize ve küresel tek hatta bağlanır.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                    {onOpenBusinessPresentation && (
                      <button
                        onClick={onOpenBusinessPresentation}
                        className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/70 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Tam Ekran İnteraktif Sunumu Aç</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Yasal Uyum ve Güvenlik Güvencesi Şeridi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">3D Secure Sanal POS</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Sandbox Sanal POS simülasyonu; gerçek kart tahsilatı yapılmaz. Sözleşme onayları işlemle ilişkilendirilir.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-teal-500/30 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">14 Gün Cayma Koruması</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Pending Balance güvencesi &amp; iptallerde yasal Clawback iade mekanizması.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">Resmi TR IBAN Transferi</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Yalnızca bayinin kendi banka hesabına ad-soyad çapraz kontrollü çekim.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">%20 Stopaj / Fatura İadesi</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Fatura kesen şirket sahibi bayiler %20 vergi kesintisini geri alır.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share URL & Buttons Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-5 rounded-3xl bg-slate-950/85 border border-indigo-500/30 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                        <Share2 className="w-4 h-4 text-indigo-400" />
                        <span>Özel Sunum &amp; Kayıt Linkiniz</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-950/90 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                        Ref: {activeReseller.referralCode}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300">Tıklanabilir Sunum Bağlantısı:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={typeof window !== 'undefined' ? `${window.location.origin}/?ref=${encodeURIComponent(activeReseller.referralCode)}&view=presentation` : ''}
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-indigo-300 font-mono outline-none select-all"
                        />
                        <button
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              navigator.clipboard.writeText(`${window.location.origin}/?ref=${encodeURIComponent(activeReseller.referralCode)}&view=presentation`);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2500);
                            }
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
                        >
                          {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedLink ? 'Kopyalandı' : 'Kopyala'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Social Media Sharing */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `🌟 AuraBio Kuantum Biyo-Rezonans & Monoline 7 Nefis MLM İş Sunum Raporu (v6.0 Enterprise)\n\n` +
                          `Canlı optik & 3D biyo-aura taraması, 10s vokal akustik F0 analizi, Web BLE akıllı saat nabız köprüsü, 302+ kadim şifa, 14 resmi kredi paketi ve %20 Direkt Sponsor + %25 Monoline Tek Hat + %5 Sistem Fonu gelir modelini interaktif kataloğumuzdan inceleyin:\n` +
                          `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${encodeURIComponent(activeReseller.referralCode)}&view=presentation\n\n` +
                          `🎁 Yetkili Bayi Referans Kodu: ${activeReseller.referralCode}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>WhatsApp'ta Paylaş</span>
                      </a>

                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(
                          `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${encodeURIComponent(activeReseller.referralCode)}&view=presentation`
                        )}&text=${encodeURIComponent('AuraBio Frekans & Monoline 7 Nefis MLM Güncel İş Sunum Raporu (v6.0 Enterprise)')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Telegram'da Paylaş</span>
                      </a>
                    </div>
                  </div>

                  {/* Official PDF / DOC Download Card */}
                  <div className="p-5 rounded-3xl bg-slate-950/85 border border-slate-800 space-y-4 flex flex-col justify-between shadow-lg">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          <span>Güncel Kurumsal Rapor &amp; Katalog İndir (PDF / Word)</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                          v6.0 Enterprise
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Fiziki görüşmelerde, klinik sunumlarında ve bayilik toplantılarında kullanmak üzere sistemin en son halini içeren resmi teknik ve ticari kataloğu tek tıkla indirebilirsiniz.
                      </p>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                        <div className="text-emerald-400 font-semibold">• Biyo-Rezonans, 302+ Frekans, 50+ Hastalık &amp; MindSpace Stüdyo</div>
                        <div className="text-amber-300 font-semibold">• Monoline 7 Nefis MLM (%20 Sponsor • %25 Tek Hat • %5 Sistem Fonu)</div>
                        <div className="text-indigo-300 font-semibold">• V2.2 Liderlik Eşleşme (%20) • Unilevel Sonsuzluk (%1-%7) • Fast-ROI (%75 İade)</div>
                        <div className="text-slate-400">• 14 Resmi Alışveriş Paketi (32 Krediden 999.999 Krediye)</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => downloadTechnicalReportWord()}
                        className="py-2.5 px-3 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Word (.doc) İndir</span>
                      </button>
                      <button
                        onClick={() => downloadTechnicalReportPDF()}
                        className="py-2.5 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF Formatında İndir</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* İnteraktif Hızlı Gelir Simülatörü (Direct In-Tab Live Estimator) */}
                <div className="p-6 rounded-3xl bg-slate-950/90 border border-indigo-500/30 space-y-5 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                        <Calculator className="w-4 h-4" />
                        <span>Canlı Hızlı Gelir Simülatörü</span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-100 mt-0.5">
                        Danışan Seansı + 14 Paket + Monoline 7 Nefis MLM Tahmini Kazanç
                      </h4>
                    </div>
                    {onOpenBusinessPresentation && (
                      <button
                        onClick={onOpenBusinessPresentation}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                      >
                        <span>Detaylı Simülatör</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-300">1. Aylık Danışan Seansı:</span>
                          <span className="text-emerald-400 font-mono">{presCalcClients} Seans / Ay</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="200"
                          step="5"
                          value={presCalcClients}
                          onChange={(e) => setPresCalcClients(Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-300">2. Seans Başı Danışan Ücreti:</span>
                          <span className="text-amber-300 font-mono">{formatUsd(presCalcPrice)}</span>
                        </div>
                        <input
                          type="range"
                          min="500"
                          max="4000"
                          step="100"
                          value={presCalcPrice}
                          onChange={(e) => setPresCalcPrice(Number(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-300">3. Direkt Referans Bayi:</span>
                            <span className="text-indigo-300 font-mono">{presCalcDirects} Üye</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={presCalcDirects}
                            onChange={(e) => setPresCalcDirects(Number(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-300">4. Tek Hat Ekip Siparişi:</span>
                            <span className="text-teal-300 font-mono">{presCalcTeamOrders} Sipariş</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="1"
                            value={presCalcTeamOrders}
                            onChange={(e) => setPresCalcTeamOrders(Number(e.target.value))}
                            className="w-full accent-teal-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-300 block">Ortalama Paket:</label>
                          <select
                            value={presCalcPackagePrice}
                            onChange={(e) => setPresCalcPackagePrice(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none"
                          >
                            {FREKANS_PACKAGES.slice(0, 8).map((pkg) => (
                              <option key={pkg.id} value={pkg.defaultPrice}>
                                {pkg.name} ({formatUsd(pkg.defaultPrice)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-300 block">Kariyer Mertebeniz:</label>
                          <select
                            value={presCalcCareer}
                            onChange={(e) => setPresCalcCareer(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none"
                          >
                            {CAREER_TIERS.map((tier) => (
                              <option key={tier.level} value={tier.level}>
                                {tier.label}: {tier.title} ({tier.unlockedDepth} Derinlik)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-2 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={presIncludeMatching}
                            onChange={(e) => setPresIncludeMatching(e.target.checked)}
                            className="accent-purple-500 rounded"
                          />
                          <span className="text-purple-300 font-semibold text-[11px]">Matching (%10..%20)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={presIncludeFastRoi}
                            onChange={(e) => setPresIncludeFastRoi(e.target.checked)}
                            className="accent-emerald-500 rounded"
                          />
                          <span className="text-emerald-300 font-semibold text-[11px]">Fast-ROI (+%15 İade)</span>
                        </label>
                      </div>
                    </div>

                    <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/40 flex flex-col justify-between space-y-3">
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400">Danışan Seans Kârı:</span>
                          <span className="font-mono font-bold text-emerald-400">+{formatUsd(presMonthlySessionProfit)}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400">Direkt Sponsor (%20):</span>
                          <span className="font-mono font-bold text-indigo-300">+{formatUsd(presMonthlyDirectSponsor)}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400">Monoline Tek Hat (%25):</span>
                          <span className="font-mono font-bold text-teal-300">+{formatUsd(presMonthlyMonoline)}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400">{presSelectedTier.title} Havuz Payı:</span>
                          <span className="font-mono font-bold text-amber-300">+{formatUsd(presMonthlyCareerPool)}</span>
                        </div>
                        {presMonthlyMatching > 0 && (
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <span className="text-slate-400">Matching Bonus:</span>
                            <span className="font-mono font-bold text-purple-300">+{formatUsd(presMonthlyMatching)}</span>
                          </div>
                        )}
                        {presMonthlyFastRoi > 0 && (
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <span className="text-slate-400">Fast-ROI Bonusu:</span>
                            <span className="font-mono font-bold text-emerald-300">+{formatUsd(presMonthlyFastRoi)}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-center space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          Aylık Net Kazanç Potansiyeli
                        </div>
                        <div className="text-2xl font-black text-white font-mono">
                          {formatUsd(presTotalMonthlyEarnings)}
                        </div>
                        <div className="text-[10px] text-emerald-300/80 font-mono">
                          Yıllık: <strong>{formatUsd(presYearlyEarnings)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Updated 8-Pillar System & Catalog Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-teal-500/40 transition-all">
                    <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-teal-400" />
                      <span>1. Optik Spektrometre &amp; 3D Aura</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Kamera foton renk analizi, 3D Biyo-Aura alanı, 7 Çakra ve 5 Kalp Letaifi canlı blokaj tespiti.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-cyan-500/40 transition-all">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-cyan-400" />
                      <span>2. 10s Vokal Akustik &amp; Ses Labirenti</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Mikrofon ile 10 saniye Ön/Son vokal harmonik F0 frekans analizi ve çoklu osilatör Voice Forge labirenti.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-emerald-500/40 transition-all">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>3. 302+ Kadim Şifa &amp; 50+ Hastalık</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      99 Esma, 25 Sufi Makamı, Solfejyo, 5 Element, Şamanik Davul ve 50+ hastalık için 3 aşamalı frekans takvimleri.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-purple-500/40 transition-all">
                    <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span>4. MindSpace AI Stüdyosu &amp; Kamp</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Aura-Journal Yaşam Koçu, 24s TCM Circadian Biyo-Ritim, Dream Decoder ve Sabah-Öğle-Gece 7 Günlük Kamplar.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-indigo-500/40 transition-all">
                    <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Watch className="w-4 h-4 text-indigo-400" />
                      <span>5. Akıllı Saat BLE &amp; Aile Çemberi</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Web Bluetooth (0x180D) ile akıllı saat nabız/HRV okuma ve çoklu cihazı bağlayan Group Aura Sync çemberi.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-amber-500/40 transition-all">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span>6. Monoline 7 Nefis MLM &amp; 4 Gelir</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Danışan seans kârı, %20 Direkt Sponsor, %25 Küresel Tek Hat (7 Derinlik) ve %5 Sistem / Kariyer Fonu &amp; Bonusları.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-emerald-500/40 transition-all">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>7. 3D Secure POS &amp; Cayma Blokesi</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      BDDK lisanslı Sanal POS, 4&apos;lü yasal sözleşme onayı, 14 gün cayma koruması (Pending Balance &amp; Clawback).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-blue-500/40 transition-all">
                    <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-blue-400" />
                      <span>8. TR IBAN &amp; %20 Vergi İadesi</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Ad-soyad kontrollü resmi TR IBAN çekimi ve kurumsal e-fatura yüklemesiyle %20 stopaj iadesi.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BAYİ PAKETLERİ / KREDİ YÜKLEME (PACKAGES & CREDITS) */}
            {activeTab === 'packages' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Header Banner */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-950/80 via-slate-950 to-emerald-950/80 border border-teal-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-teal-400" />
                      <h3 className="text-base font-extrabold text-slate-100">Bayi Lisans & Seans Kredi Havuzu</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        +30 GÜN SÜRE BİRİKİMİ
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Toplu seans paketleri satın alarak birim seans maliyetinizi düşürün. <strong className="text-emerald-300">Kendi panelinizden kredi satın aldığınızda aktifliğiniz 30 gün uzar.</strong>
                    </p>
                  </div>

                  <div className="px-4 py-2 rounded-2xl bg-teal-950/90 border border-teal-500/50 text-right shrink-0">
                    <div className="text-[10px] text-teal-400 font-semibold">Mevcut Seans Krediniz:</div>
                    <div className="text-xl font-black font-mono text-emerald-300">
                      {activeReseller.creditsBalance !== undefined ? activeReseller.creditsBalance : 100} <span className="text-xs font-normal">Kredi</span>
                    </div>
                  </div>
                </div>

                {/* Activity period status banner inside Dealer Credits tab */}
                {(() => {
                  const expAt = (activeReseller as any).activityExpiresAt;
                  const expMs = expAt ? new Date(expAt).getTime() : 0;
                  const isActivityValid = Boolean((activeReseller as any).isActive) && expMs > Date.now();
                  const remainingDays = Math.max(0, Math.ceil((expMs - Date.now()) / 86400000));

                  return (
                    <div
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActivityValid
                          ? 'bg-emerald-950/40 border-emerald-500/40'
                          : 'bg-amber-950/35 border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl border shrink-0 ${
                            isActivityValid
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-slate-100 font-bold">
                              Bayi Aktiflik Durumu:
                            </strong>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                                isActivityValid
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-amber-400 text-slate-950'
                              }`}
                            >
                              {isActivityValid
                                ? `AKTİF (${remainingDays} Gün Kaldı)`
                                : 'AKTİF DEĞİL — PAKET ALIMI İLE AKTİFLEŞİN'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {isActivityValid
                              ? 'Her paket alımı aktifliğinizi 30 gün uzatır. Aktifken yapılan alım, mevcut bitiş tarihine eklenir.'
                              : 'Aşağıdaki kredi paketlerinden herhangi birini satın aldığınızda seans kredileriniz yüklenir ve aktifliğiniz 30 gün uzar.'}
                          </p>
                        </div>
                      </div>

                      {onOpenMonolineModal && (
                        <button
                          type="button"
                          onClick={() => onOpenMonolineModal('backoffice')}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                        >
                          Aktiflik Sayacını Gör →
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Out of credits warning in Packages tab */}
                {activeReseller.creditsBalance !== undefined && activeReseller.creditsBalance <= 0 && (
                  <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-xs text-rose-200 flex items-center gap-3 shadow-lg">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <strong className="block text-rose-100 font-bold">Kredi Havuzunuz Boş (0 Kalan Seans)</strong>
                      <span>Danışanlarınıza tarama ve frekans seansı uygulayabilmek için lütfen aşağıdaki paketlerden birini seçerek bakiye yükleme talebi oluşturun. Krediniz onaylandıktan sonra seans hakkınız artacaktır.</span>
                    </div>
                  </div>
                )}

                {purchaseSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-xs text-emerald-300 flex items-center gap-2 shadow-lg shadow-emerald-950/80">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="font-bold">{purchaseSuccessMsg}</span>
                  </div>
                )}

                {/* Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {dealerPackages.map((dp) => {
                    const isPurchasing = purchasingPkgId === dp.id;
                    const isPopular = Boolean(dp.popular);

                    return (
                      <div
                        key={dp.id}
                        className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 relative overflow-hidden ${
                          isPopular
                            ? 'bg-slate-950/95 border-teal-500/60 shadow-2xl shadow-teal-950/50 ring-2 ring-teal-500/40'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-teal-500 text-slate-950 font-black text-[9px] uppercase px-3 py-1 rounded-bl-xl shadow-md">
                            EN ÇOK TERCİH EDİLEN
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold">
                              {dp.badge || 'BAYİ PAKETİ'}
                            </span>
                            <h4 className="text-lg font-black text-slate-100 mt-2">{dp.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">{dp.targetAudience}</p>
                          </div>

                          {/* Price & Credit box */}
                          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                            <div className="flex items-baseline justify-between">
                              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                                {regionalPriceText(dp)}
                              </span>
                              <span className="text-xs font-bold text-teal-300 font-mono bg-teal-950 px-2.5 py-1 rounded-xl border border-teal-500/40">
                                +{dp.scanCredits} Seans
                              </span>
                            </div>
                            <div className="text-xs text-amber-300/90 font-semibold flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              <span>{regionalUnitCostText(dp)}</span>
                            </div>
                          </div>

                          {/* Feature List */}
                          <div className="space-y-2 pt-1">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Paket Avantajları:</span>
                            {dp.features.map((feat, fIdx) => (
                              <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Purchase Button */}
                        <button
                          onClick={() => handleOpenOrderModal(dp)}
                          className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                            isPopular
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-950/70'
                              : 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-950/50'
                          }`}
                        >
                          <Coins className="w-4 h-4" />
                          <span>Paketi Seç & Satın Alma Talebi Oluştur</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Dealer Package Orders History for this Reseller */}
                {dealerOrders.filter(o => o.resellerId === activeReseller.uid || Boolean(o.resellerEmail && activeReseller.email && o.resellerEmail.toLowerCase() === activeReseller.email.toLowerCase())).length > 0 && (
                  <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-bold text-slate-100">Son Kredi & Paket Satın Alma Talepleriniz</h4>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {dealerOrders.filter(o => o.resellerId === activeReseller.uid || Boolean(o.resellerEmail && activeReseller.email && o.resellerEmail.toLowerCase() === activeReseller.email.toLowerCase())).length} Sipariş
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dealerOrders
                        .filter(o => o.resellerId === activeReseller.uid || Boolean(o.resellerEmail && activeReseller.email && o.resellerEmail.toLowerCase() === activeReseller.email.toLowerCase()))
                        .map((ord) => (
                          <div key={ord.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-slate-200">{ord.id}</span>
                                <span className="font-semibold text-emerald-400">{ord.packageName} (+{ord.scanCredits} Seans)</span>
                                <span className="font-mono text-slate-300 font-bold">{ord.priceText}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                <span>Tarih: {new Date(ord.createdAt).toLocaleDateString('tr-TR')} {new Date(ord.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                {ord.paymentReference && <span>• Açıklama: <strong className="text-slate-300">{ord.paymentReference}</strong></span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {ord.status === 'pending' && (
                                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Ödeme & Yönetici Onayı Bekleniyor</span>
                                </span>
                              )}
                              {ord.status === 'approved' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Yönetici Onayladı & Krediler Yüklendi</span>
                                  </span>

                                  <button
                                    onClick={async () => {
                                      let inv = invoices.find(i => i.orderId === ord.id);
                                      if (!inv) {
                                        inv = await createInvoiceForDealerOrder(ord);
                                      }
                                      if (inv) {
                                        setSelectedInvoice(inv);
                                        setShowInvoiceModal(true);
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-md"
                                    title="Dijital E-Faturayı Görüntüle / Yazdır"
                                  >
                                    <Receipt className="w-3.5 h-3.5 text-purple-400" />
                                    <span>E-Fatura</span>
                                  </button>
                                </div>
                              )}
                              {ord.status === 'rejected' && (
                                <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Talebiniz Reddedildi</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Info Note */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30 text-xs text-slate-300 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-amber-300 block font-bold">Güvenli Ödeme & Yönetici Onay Kuralı:</strong>
                    <p className="leading-relaxed text-[11px] text-slate-400">
                      Seçilen seans ve bayilik paketlerinin ücreti şirket banka hesabımıza havale/EFT yapıldıktan sonra sistem yöneticisi tarafından incelenir. Yönetici ödemeyi onayladığı anda seans kredileriniz hesabınıza anında tanımlanır. Ücret ödenmeden veya yönetici onayı alınmadan seans hakkı yüklenmez.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: REFERRAL LINK & SHARE & MARKETING HUB */}
            {activeTab === 'share' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Top Action Header Banner */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-teal-950/70 to-slate-950 border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                        RESMİ BAYİ BAĞLANTI MERKEZİ
                      </span>
                      <strong className="text-sm sm:text-base font-mono text-emerald-200">
                        {activeReseller.referralCode}
                      </strong>
                    </div>
                    <p className="text-xs text-slate-300 max-w-2xl">
                      Aşağıdaki özel bağlantılar üzerinden üyelerinize veya potansiyel danışanlarınıza tanıtım yapabilir, tüm linklerinizde bayinizin referans kodunu (<span className="text-emerald-300 font-mono font-bold">{activeReseller.referralCode}</span>) kilitli tutabilirsiniz.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setIsCardModalOpen(true)}
                      className="w-full md:w-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>🪪 Dijital Kartvizit & Karekodu Aç</span>
                    </button>
                  </div>
                </div>

                {/* 4 CORE OFFICIAL MARKETING LINKS GRID */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Özel Bayi Referans Link Listesi (Tıklanabilir ve Kilitli):</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* 1. BUSINESS PRESENTATION LINK */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-teal-500/40 space-y-3 flex flex-col justify-between hover:border-teal-500/70 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                            <BookOpen className="w-4 h-4 text-teal-400" />
                            <span>1. İş Sunum Raporu & Dijital Katalog</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-semibold border border-teal-500/30">
                            Tanıtım & Rapor
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Sistemin optik biyofizik analizini, çakra/letaif haritalamasını ve gelir modelini içeren interaktif sunum linki.
                        </p>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-teal-300 truncate select-all">
                          {generateBusinessPresentationLink(activeReseller.referralCode)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generateBusinessPresentationLink(activeReseller.referralCode));
                            setCopiedPresLink(true);
                            setTimeout(() => setCopiedPresLink(false), 2500);
                          }}
                          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {copiedPresLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPresLink ? 'Kopyalandı' : 'Linki Kopyala'}</span>
                        </button>
                        
                        {onOpenBusinessPresentation && (
                          <button
                            onClick={onOpenBusinessPresentation}
                            className="py-2 px-2.5 rounded-xl bg-teal-700/80 hover:bg-teal-600 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Sunumu Aç</span>
                          </button>
                        )}

                        <a
                          href={generateWhatsAppUrlForMessage(
                            `📊 *AuraBio Frekans İş Sunumu & Raporu*\n\nMerhaba! Biyo-Rezonans ve Frekans teknolojimizin iş sunum raporunu ve kataloğunu linkten inceleyebilirsiniz:\n🔗 ${generateBusinessPresentationLink(activeReseller.referralCode)}\n\n🎁 Bayi Kodu: ${activeReseller.referralCode}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* 2. TECHNICAL REPORT & DOCUMENTATION LINK */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-indigo-500/40 space-y-3 flex flex-col justify-between hover:border-indigo-500/70 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            <span>2. Teknik Rapor & Bilimsel Dökümantasyon</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                            Bilimsel Heyet
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Optik spektrometre sensör protokolleri, biyo-rezonans algoritması ve heyet onaylı teknik döküman bağlantısı.
                        </p>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300 truncate select-all">
                          {generateTechnicalReportLink(activeReseller.referralCode)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generateTechnicalReportLink(activeReseller.referralCode));
                            setCopiedTechLink(true);
                            setTimeout(() => setCopiedTechLink(false), 2500);
                          }}
                          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {copiedTechLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedTechLink ? 'Kopyalandı' : 'Linki Kopyala'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onOpenTechnicalReport) {
                              onOpenTechnicalReport();
                            } else {
                              downloadTechnicalReportPDF();
                            }
                          }}
                          className="py-2 px-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-600 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Raporu Gör</span>
                        </button>

                        <a
                          href={generateWhatsAppUrlForMessage(
                            `🔬 *AuraBio Frekans Teknik Dökümantasyon & Bilimsel Rapor*\n\nMerhaba! Biyo-Rezonans ve Spektrometre sistemimizin resmi teknik raporunu aşağıdaki bağlantıdan inceleyebilirsiniz:\n🔗 ${generateTechnicalReportLink(activeReseller.referralCode)}\n\n🎁 Bayi Kodu: ${activeReseller.referralCode}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* 3. DIRECT REGISTRATION LINK WITH LOCKED DEALER */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-emerald-500/40 space-y-3 flex flex-col justify-between hover:border-emerald-500/70 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span>3. Doğrudan Bayi & Üye Kayıt Ekranı Linki</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            🔒 Kilitli Bayi
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Kullanıcı bu linke tıkladığında kayıt ekranı açılır ve bağlı olduğu bayi alanı otomatik olarak sizin adınıza kilitlenir.
                        </p>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 truncate select-all">
                          {generateRegisterLink(activeReseller.referralCode)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generateRegisterLink(activeReseller.referralCode));
                            setCopiedRegLink(true);
                            setTimeout(() => setCopiedRegLink(false), 2500);
                          }}
                          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {copiedRegLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedRegLink ? 'Kopyalandı' : 'Linki Kopyala'}</span>
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            if (onOpenAuthModal) onOpenAuthModal();
                          }}
                          className="py-2 px-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Kayıt Formu</span>
                        </button>

                        <a
                          href={generateWhatsAppUrlForMessage(
                            `✨ *AuraBio Frekans Özel Üyelik & Demo Kaydı*\n\nMerhaba! Biyo-Rezonans ve Frekans sistemimizi hemen ücretsiz test etmek ve hesabınızı oluşturmak için kayıt linkim:\n🔗 ${generateRegisterLink(activeReseller.referralCode)}\n\n🎁 Davet Kodum: ${activeReseller.referralCode}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* 4. DIGITAL BUSINESS CARD & QR CODE LINK */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-amber-500/40 space-y-3 flex flex-col justify-between hover:border-amber-500/70 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                            <QrCode className="w-4 h-4 text-amber-400" />
                            <span>4. Kişiselleştirilmiş Kartvizit & Karekod Linki</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                            Karekod & Profil
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Bayinizin resmi kimliğini, iletişim bilgilerini ve yüksek çözünürlüklü tarama karekodunu gösteren özel kartvizit web sayfası.
                        </p>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300 truncate select-all">
                          {generateBusinessCardLink(activeReseller.referralCode)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generateBusinessCardLink(activeReseller.referralCode));
                            setCopiedCardLink(true);
                            setTimeout(() => setCopiedCardLink(false), 2500);
                          }}
                          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {copiedCardLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCardLink ? 'Kopyalandı' : 'Linki Kopyala'}</span>
                        </button>

                        <button
                          onClick={() => setIsCardModalOpen(true)}
                          className="py-2 px-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-slate-950 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Kartviziti Aç</span>
                        </button>

                        <a
                          href={generateWhatsAppUrlForMessage(
                            `🪪 *AuraBio Frekans Bayi Dijital Kartvizitim*\n\nMerhaba! Biyo-Rezonans ve Frekans Yetkili Bayi dijital kartvizitimi ve karekodumu aşağıdaki bağlantıdan görüntüleyebilirsiniz:\n🔗 ${generateBusinessCardLink(activeReseller.referralCode)}\n\n🏢 ${activeReseller.resellerName}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                  </div>
                </div>

                {/* BULK MARKETING BROADCAST CENTER (Tüm Bağlantıları İçeren Toplu Paylaşım Metni) */}
                <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Toplu Tanıtım & Yayın Bülteni (Tüm Bağlantılar Tek Metinde)</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      WhatsApp Grupları, Telegram Kanalları ve Sosyal Medya Paylaşımı İçin
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line select-all max-h-56 overflow-y-auto">
                    {generateBulkMarketingMessage(activeReseller.referralCode, activeReseller.resellerName, activeReseller.phone)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        const bulkText = generateBulkMarketingMessage(activeReseller.referralCode, activeReseller.resellerName, activeReseller.phone);
                        navigator.clipboard.writeText(bulkText);
                        setCopiedBulkMessage(true);
                        setTimeout(() => setCopiedBulkMessage(false), 2500);
                      }}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {copiedBulkMessage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                      <span>{copiedBulkMessage ? 'Toplu Metin Kopyalandı!' : 'Toplu Tanıtım Metnini Kopyala'}</span>
                    </button>

                    <a
                      href={generateWhatsAppUrlForMessage(
                        generateBulkMarketingMessage(activeReseller.referralCode, activeReseller.resellerName, activeReseller.phone)
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-950"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>WhatsApp ile Toplu Gönder</span>
                    </a>

                    <a
                      href={generateTelegramUrlForMessage(
                        generateBulkMarketingMessage(activeReseller.referralCode, activeReseller.resellerName, activeReseller.phone),
                        generateBusinessCardLink(activeReseller.referralCode)
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-sky-950"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Telegram'da Yayınla</span>
                    </a>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: COMMISSIONS & TRANSACTIONS TABLE */}
            {activeTab === 'commissions' && (
              <div className="space-y-4 animate-fade-in">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
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

                  <div className="flex items-center gap-1.5 text-xs">
                    {(['all', 'pending', 'approved', 'paid'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setCommFilter(st)}
                        className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                          commFilter === st
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st === 'all' && 'Tümü'}
                        {st === 'pending' && 'Bekleyenler'}
                        {st === 'approved' && 'Onaylananlar'}
                        {st === 'paid' && 'Ödenenler'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
                        <tr>
                          <th className="py-3 px-4">İşlem ID</th>
                          <th className="py-3 px-4">Maskeli Üye</th>
                          <th className="py-3 px-4">Satın Alınan Paket</th>
                          <th className="py-3 px-4 text-right">Satış Tutarı</th>
                          <th className="py-3 px-4 text-right">Komisyon Tutarı</th>
                          <th className="py-3 px-4 text-center">Durum</th>
                          <th className="py-3 px-4 text-right">Tarih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-300">
                        {filteredCommissions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                              Henüz kriterlere uygun bir komisyon kaydı bulunmamaktadır.
                            </td>
                          </tr>
                        ) : (
                          filteredCommissions.map((c) => (
                            <tr key={c.transactionId} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-200">
                                {c.transactionId}
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
                                {formatUsd(c.amount || 0)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                                +{formatUsd(c.commissionAmount || 0)}
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
                                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                    ⏳ Bekliyor
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
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RESELLER DİJİTAL E-FATURALAR (MY INVOICES) */}
            {activeTab === 'invoices' && (
              <div className="space-y-5 animate-fade-in">
                
                {/* Summary Header */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-950 to-teal-950/80 border border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-purple-400" />
                      <h3 className="text-base font-extrabold text-slate-100">Resmi Dijital E-Faturalarım</h3>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Satın aldığınız tüm bayi lisans paketleri ve seans kredisi yüklemelerinize ait %20 KDV dahil resmi dijital e-arşiv faturalarınızı buradan görüntüleyebilir, PDF olarak yazdırabilir veya WhatsApp ile paylaşabilirsiniz.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-purple-950/90 border border-purple-500/50 text-right shrink-0">
                      <div className="text-[10px] text-purple-300 font-semibold">Toplam Fatura:</div>
                      <div className="text-lg font-black font-mono text-purple-200">
                        {invoices.length} Adet
                      </div>
                    </div>

                    <div className="px-4 py-2 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-right shrink-0">
                      <div className="text-[10px] text-emerald-400 font-semibold">Toplam Tutar:</div>
                      <div className="text-lg font-black font-mono text-emerald-300">
                        {formatUsd(invoices.reduce((acc, i) => acc + (i.grandTotal || 0), 0))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      placeholder="Fatura No (AUR-...), ETTN veya Hizmet Açıklaması ile ara..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none font-mono focus:border-purple-500"
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
                      <option value="sent_whatsapp">WhatsApp İletilenler</option>
                      <option value="issued">Düzenlenen / E-Arşiv</option>
                    </select>
                  </div>
                </div>

                {/* Invoices List Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                          <th className="py-3 px-4 font-semibold">Fatura No & ETTN</th>
                          <th className="py-3 px-4 font-semibold">Paket & Hizmet Detayı</th>
                          <th className="py-3 px-4 font-semibold text-right">KDV Hariç</th>
                          <th className="py-3 px-4 font-semibold text-right">KDV (%20)</th>
                          <th className="py-3 px-4 font-semibold text-right">Genel Toplam</th>
                          <th className="py-3 px-4 font-semibold text-center">Tarih</th>
                          <th className="py-3 px-4 font-semibold text-center">Durum</th>
                          <th className="py-3 px-4 font-semibold text-center">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {invoices
                          .filter(inv => {
                            if (invoiceFilterStatus === 'sent_whatsapp') return inv.status === 'sent_whatsapp';
                            if (invoiceFilterStatus === 'issued') return inv.status === 'issued' || inv.status === 'sent_whatsapp';
                            return true;
                          })
                          .filter(inv => {
                            if (!invoiceSearch.trim()) return true;
                            const q = invoiceSearch.toLowerCase();
                            return (
                              (inv.invoiceNumber || '').toLowerCase().includes(q) ||
                              (inv.ettn || '').toLowerCase().includes(q) ||
                              Boolean(inv.items?.some(it => it.description && it.description.toLowerCase().includes(q)))
                            );
                          })
                          .map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-mono font-bold text-purple-300">
                                  {inv.invoiceNumber}
                                </div>
                                <div className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]" title={inv.ettn}>
                                  {inv.ettn}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="font-bold text-slate-100">
                                  {inv.items?.[0]?.description || inv.packageName || 'Yetkili Bayi Lisansı'}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {inv.packageName ? `Paket: ${inv.packageName}` : 'Lisans ve Seans Kredisi'}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                                {formatUsd(inv.subtotal, 2)}
                              </td>

                              <td className="py-3.5 px-4 text-right font-mono text-teal-400">
                                {formatUsd(inv.kdvTotal, 2)}
                              </td>

                              <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                                {formatUsd(inv.grandTotal, 2)}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                                {new Date(inv.issueDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>E-Arşiv Düzenlendi</span>
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(inv);
                                      setShowInvoiceModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Faturayı Aç</span>
                                  </button>

                                  <a
                                    href={generateInvoiceWhatsAppShareUrl(inv, activeReseller.phone || '')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs transition-all cursor-pointer"
                                    title="WhatsApp İle İlet / Paylaş"
                                  >
                                    <Smartphone className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}

                        {invoices.length === 0 && (
                          <tr>
                            <td colSpan={8} className="p-10 text-center text-slate-500 text-xs space-y-3">
                              <Receipt className="w-9 h-9 text-slate-600 mx-auto" />
                              <div className="text-slate-400 font-semibold">Henüz adınıza düzenlenmiş bir fatura bulunmamaktadır.</div>
                              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                                "Paket Satın Al / Kredi Yükle" sekmesinden satın aldığınız bayi paketleri yönetici tarafından onaylandığında resmi e-arşiv faturanız burada otomatik olarak listelenecektir.
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

            {/* TAB 4: BANK & IBAN SETTINGS */}
            {activeTab === 'documents' && <SharedDocumentsPanel access="dealer" />}

            {activeTab === 'bank' && (
              <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
                <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-3">
                    <CreditCard className="w-5 h-5" />
                    <span>Komisyon Kazanç Transferi Banka Bilgileri</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Kazanmış olduğunuz komisyon ödemeleri, periyodik ödeme günlerinde aşağıda belirttiğiniz resmi IBAN hesabına aktarılmaktadır.
                  </p>

                  {bankMsg && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      bankMsg.type === 'success' 
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
                        : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                    }`}>
                      {bankMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{bankMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveBankInfo} className="space-y-3.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300">Banka Adı:</label>
                      <input
                        type="text"
                        required
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                        placeholder="Örn: QNB Finansbank, Ziraat Bankası, Garanti BBVA"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs text-slate-100 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Hesap Sahibi Ad Soyad (Banka Uyum Denetimi — Kendi Adınıza Kayıtlı Olmalıdır):
                      </label>
                      <input
                        type="text"
                        required
                        readOnly
                        value={activeReseller.resellerName}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs text-emerald-300 font-bold outline-none cursor-not-allowed"
                      />
                      <p className="text-[10px] text-emerald-400/90">
                        ✓ Banka denetimi ve yasal uyum gereği yalnızca sistemde kayıtlı kendi adınıza ({activeReseller.resellerName}) ait resmi TR IBAN hesabına çekim yapılabilir.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300">IBAN Numarası (TR ile başlayan 26 karakter):</label>
                      <input
                        type="text"
                        required
                        value={bankForm.iban}
                        onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value.toUpperCase() })}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs text-slate-100 font-mono uppercase outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingBank}
                      className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2"
                    >
                      {isSavingBank ? 'Kaydediliyor...' : 'Banka ve IBAN Bilgilerini Güncelle'}
                      <Check className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* POPUP MODAL: DEALER PACKAGE PURCHASE & PAYMENT CHECKOUT */}
        {showOrderModal && selectedPkgForOrder && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-teal-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative my-auto">
              <button
                onClick={() => setShowOrderModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold">
                    KREDİ SATIN ALMA &amp; SEPET ÖDEMESİ
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    +30 GÜN SÜRE DAHİL
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 pt-1">
                  <Package className="w-5 h-5 text-teal-400" />
                  <span>{selectedPkgForOrder.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Kendi panelinizden seans kredisi satın aldığınızda krediniz yüklenir ve <strong className="text-emerald-300">aktifliğiniz 30 gün uzar</strong>.
                </p>
              </div>

              {/* Package Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Yüklenecek Kredi:</div>
                  <div className="text-base font-bold text-teal-300 font-mono">+{selectedPkgForOrder.scanCredits} Seans Kredisi</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Ödenecek Tutar:</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">{regionalPriceText(selectedPkgForOrder)}</div>
                </div>
              </div>

              {/* Sadece Kredi Kartı / Sanal POS (Banka Denetimi Uyumlu) */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 text-xs">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>3D Secure Sanal POS Kredi Kartı Ödemesi</span>
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded">
                    SANDBOX TEST POS · 3D SİMÜLASYON
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Sandbox simülasyonunda yalnızca tanımlı test kartları kabul edilir; gerçek tahsilat yapılmaz.
                </p>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2">
                    <div className="text-[11px] font-bold text-amber-300">Sandbox Test Kartları</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(Object.keys(SANDBOX_TEST_CARDS) as (keyof typeof SANDBOX_TEST_CARDS)[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setPosCardNumber(SANDBOX_TEST_CARDS[key].number);
                            setPosCardExpiry(SANDBOX_TEST_CARD_EXPIRY);
                            setPosCardCvv(SANDBOX_TEST_CARD_CVV);
                          }}
                          className="text-left px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500/60 cursor-pointer"
                        >
                          <div className="text-[11px] text-slate-200 font-semibold">{SANDBOX_TEST_CARDS[key].label}</div>
                          <div className="text-[10px] font-mono text-slate-400">{SANDBOX_TEST_CARDS[key].number}</div>
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Son kullanma: {SANDBOX_TEST_CARD_EXPIRY} · CVV: {SANDBOX_TEST_CARD_CVV} · SMS: {SANDBOX_SMS_CODE}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Kart Üzerindeki Ad Soyad</label>
                    <input
                      type="text"
                      required
                      value={posCardHolder}
                      onChange={(e) => setPosCardHolder(e.target.value)}
                      placeholder="Kart Üzerindeki İsim"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Kart Numarası</label>
                    <input
                      type="text"
                      required
                      value={posCardNumber}
                      onChange={(e) => setPosCardNumber(e.target.value)}
                      placeholder="4543 6012 8941 5000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-emerald-300 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Son Kullanma (AA/YY)</label>
                      <input
                        type="text"
                        required
                        value={posCardExpiry}
                        onChange={(e) => setPosCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">CVV Kodu</label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={posCardCvv}
                        onChange={(e) => setPosCardCvv(e.target.value)}
                        placeholder="842"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-200/90">
                  ✓ Ödeme onaylandığı anda <strong>+{selectedPkgForOrder.scanCredits} Seans Kredisi</strong> ve <strong>aktifliğiniz uzar</strong>.
                </p>
              </div>

              {/* Form & Yasal Sözleşme Onay Kutuları (Compliance Checkboxes) */}
              <form onSubmit={handleConfirmOrderSubmit} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200">
                  <div className="font-bold">Sipariş Özeti</div>
                  <div>{selectedPkgForOrder?.name} · {selectedPkgForOrder?.scanCredits} kredi · {regionalPriceText(selectedPkgForOrder)}</div>
                  <div className="text-slate-400">Alıcı: {activeReseller?.resellerName}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-[11px] text-slate-300">
                  <div className="text-[10px] font-mono font-bold uppercase text-amber-300">
                    YASAL SÖZLEŞMELER VE ZORUNLU ONAY MEKANİZMASI (v2.2)
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chkSalesContract}
                      onChange={(e) => setChkSalesContract(e.target.checked)}
                      className="mt-0.5 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>
                      <button
                        type="button"
                        onClick={() => setInspectedContractType('PRE_INFORMATION')}
                        className="text-emerald-300 underline font-semibold cursor-pointer"
                      >
                        Ön Bilgilendirme Formu&apos;nu
                      </button>{' '}
                      ve{' '}
                      <button
                        type="button"
                        onClick={() => setInspectedContractType('DISTANCE_SALES')}
                        className="text-emerald-300 underline font-semibold cursor-pointer"
                      >
                        Mesafeli Satış Sözleşmesi&apos;ni
                      </button>{' '}
                      okudum, onaylıyorum.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chkKvkk}
                      onChange={(e) => setChkKvkk(e.target.checked)}
                      className="mt-0.5 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>
                      <button
                        type="button"
                        onClick={() => setInspectedContractType('KVKK')}
                        className="text-emerald-300 underline font-semibold cursor-pointer"
                      >
                        Kişisel Verilerin Korunması (KVKK) Aydınlatma Metni&apos;ni
                      </button>{' '}
                      okudum, onaylıyorum.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chkMlmTerms}
                      onChange={(e) => setChkMlmTerms(e.target.checked)}
                      className="mt-0.5 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>
                      <button
                        type="button"
                        onClick={() => setInspectedContractType('MLM_TERMS')}
                        className="text-emerald-300 underline font-semibold cursor-pointer"
                      >
                        AuraBio Bağımsız Bayilik (MLM) ve Kazanç Planı Kuralları&apos;nı
                      </button>{' '}
                      (14 Günlük Cayma Hakkı dahil) okudum, kabul ediyorum.
                    </span>
                  </label>

                  {inspectedContractType && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-emerald-300">
                        <span>
                          {LEGAL_CONTRACT_TEXTS[inspectedContractType].title} (
                          {LEGAL_CONTRACT_TEXTS[inspectedContractType].version})
                        </span>
                        <button
                          type="button"
                          onClick={() => setInspectedContractType(null)}
                          className="text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          Kapat
                        </button>
                      </div>
                      <p className="text-slate-300">
                        {LEGAL_CONTRACT_TEXTS[inspectedContractType].summary}
                      </p>
                      <ul className="space-y-1 text-slate-400">
                        {LEGAL_CONTRACT_TEXTS[inspectedContractType].clauses.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmittingOrder || !chkSalesContract || !chkKvkk || !chkMlmTerms
                    }
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-950/60 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sanal POS İşleniyor...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Ödemeyi Tamamla &amp; Kredi + Aktifliği Başlat</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* Dealer Digital Business Card & QR Code Modal */}
        {activeReseller && (
          <DealerBusinessCardModal
            isOpen={isCardModalOpen}
            onClose={() => setIsCardModalOpen(false)}
            reseller={activeReseller}
          />
        )}

        {/* Dealer Digital E-Invoice View Modal */}
        {showInvoiceModal && selectedInvoice && (
          <DigitalInvoiceModal
            isOpen={showInvoiceModal}
            invoice={selectedInvoice}
            onClose={() => {
              setShowInvoiceModal(false);
              setSelectedInvoice(null);
            }}
            isAdmin={false}
          />
        )}

      </div>
    </div>
  );
};
