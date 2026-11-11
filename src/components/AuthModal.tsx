import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  Unlock,
  User, 
  Phone, 
  Check, 
  ArrowRight, 
  AlertCircle, 
  X, 
  Building2, 
  Tag, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard,
  Briefcase,
  MapPin,
  MessageCircle,
  ExternalLink,
  Coins,
  GitBranch,
  Info
} from 'lucide-react';
import { 
  registerMember, 
  loginMember, 
  UserMember, 
  MembershipPackage,
  getMembershipPackages,
  subscribeToMembershipPackages,
  MEMBERSHIP_PACKAGES,
  getWhatsAppDealerApplicationUrl 
} from '../utils/authManager';
import { DealerDetails } from '../types';
import { getPackagePriceForRegion, MEMBER_COUNTRY_OPTIONS, resolveMemberRegion } from '../utils/walletRegion';
import { formatUsd } from '../utils/currency';
import { 
  Reseller, 
  DealerPackage,
  DEFAULT_DEALER_PACKAGES,
  getActiveResellers, 
  getResellerByCode, 
  detectReferralCodeFromUrlOnly,
  detectAndSaveReferralCodeFromUrl, 
  getStoredReferralCode,
  clearStoredReferralCode
} from '../utils/resellerManager';
import { 
  startDeviceDemoSession, 
  getDeviceDemoStatus, 
  DeviceDemoStatus 
} from '../utils/deviceDemoManager';
import { PackageDetailModal } from './PackageDetailModal';
import { LegalContractsModal, LegalContractTab } from './LegalContractsModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthSuccess: (user: UserMember, isNewRegistration?: boolean) => void;
  onStartDemo?: () => void;
  allowClose?: boolean;
  initialMode?: 'login' | 'register' | 'dealer';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onStartDemo,
  allowClose = false,
  initialMode = 'login',
}) => {
  // Check if URL specifies dealer mode
  const checkIsDealerFromUrl = (): boolean => {
    if (typeof window === 'undefined') return false;
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';
    return (
      searchParams.get('dealer') === '1' ||
      searchParams.get('mode') === 'dealer' ||
      searchParams.get('bayilik') === '1' ||
      searchParams.get('isDealer') === '1' ||
      hash.includes('dealer') ||
      hash.includes('bayilik')
    );
  };

  const initialIsDealer = (initialMode as string) === 'dealer' || checkIsDealerFromUrl();
  const [tab, setTab] = useState<'login' | 'register'>(initialIsDealer ? 'register' : (initialMode === 'register' ? 'register' : 'login'));
  const [demoStatus, setDemoStatus] = useState<DeviceDemoStatus>(() => getDeviceDemoStatus());
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Register fields
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regCountryCode, setRegCountryCode] = useState<string>('TR');

  // Dealer Application Specific State (AKN Global Spec)
  const [isDealerRequested, setIsDealerRequested] = useState<boolean>(initialIsDealer);
  const [membershipPackages, setMembershipPackages] = useState<MembershipPackage[]>(() => getMembershipPackages());
  const [dealerPackages] = useState<DealerPackage[]>(DEFAULT_DEALER_PACKAGES);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-5k');

  const [dealerCompanyName, setDealerCompanyName] = useState<string>('');
  const [dealerTaxNumber, setDealerTaxNumber] = useState<string>('');
  const [dealerTaxOffice, setDealerTaxOffice] = useState<string>('');
  const [dealerBusinessField, setDealerBusinessField] = useState<string>('Biyo-Rezonans & Frekans Merkezi');
  const [dealerWhatsapp, setDealerWhatsapp] = useState<string>('');
  const [dealerAddress, setDealerAddress] = useState<string>('');
  const [dealerNotes, setDealerNotes] = useState<string>('');
  const [dealerAssignedLeg, setDealerAssignedLeg] = useState<'AUTO' | 'LEFT' | 'RIGHT'>('AUTO');

  // Post-submit WhatsApp notification link
  const [pendingWhatsappUrl, setPendingWhatsappUrl] = useState<string | null>(null);

  // Package Inspection & Legal Contracts Modal State
  const [inspectingPackage, setInspectingPackage] = useState<DealerPackage | null>(null);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalContractType, setLegalContractType] = useState<LegalContractTab>('terms');

  // Reseller / Referral selection state
  const [resellersList, setResellersList] = useState<Reseller[]>([]);
  const [selectedResellerId, setSelectedResellerId] = useState<string>('');
  const [customReferralCode, setCustomReferralCode] = useState<string>('');
  const [isCustomReferralMode, setIsCustomReferralMode] = useState<boolean>(false);
  const [validatedReseller, setValidatedReseller] = useState<Reseller | null>(null);
  const [isUrlReferralDetected, setIsUrlReferralDetected] = useState<boolean>(false);
  const [isManualSponsorMode, setIsManualSponsorMode] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const registrationRegion = resolveMemberRegion(regCountryCode);
  const isInternationalRegistration = registrationRegion === 'INTERNATIONAL';
  const getRegionalDealerPackage = (pkg: DealerPackage): DealerPackage => {
    const price = getPackagePriceForRegion(pkg.price, registrationRegion);
    return {
      ...pkg,
      price,
      priceText: formatUsd(price),
      unitCostText: `${formatUsd(price / pkg.scanCredits, 2)} / Seans Maliyeti`,
    };
  };

  // Live subscription to membership packages
  useEffect(() => {
    const unsubMember = subscribeToMembershipPackages((pkgs) => {
      if (pkgs && pkgs.length > 0) setMembershipPackages(pkgs);
    });
    return () => unsubMember();
  }, []);

  // Load and check referral and mode on modal open
  useEffect(() => {
    if (!isOpen) return;

    const isDealerUrl = checkIsDealerFromUrl();
    if (initialMode === 'dealer' || isDealerUrl) {
      setTab('register');
      setIsDealerRequested(true);
      setSelectedPackageId('pkg-5k');
    }

    const loadResellers = async () => {
      try {
        const list = await getActiveResellers();
        setResellersList(list);

        // Check if referral code is STRICTLY present in current URL query or hash (?ref=... or ?bayi=...)
        const directUrlCode = detectReferralCodeFromUrlOnly();
        if (directUrlCode) {
          const match = await getResellerByCode(directUrlCode);
          if (match) {
            setSelectedResellerId(match.uid);
            setValidatedReseller(match);
            setCustomReferralCode(match.referralCode);
            setIsUrlReferralDetected(true);
            setIsManualSponsorMode(false);
            setIsCustomReferralMode(false);
            setTab('register'); // Switch to register automatically if opened via invite link
            return;
          }
        }

        // If no referral in current URL: do NOT lock to any cached dealer!
        // Allow user to select sponsor manually from list, enter custom code, or choose Direct Central.
        setIsUrlReferralDetected(false);
        setIsManualSponsorMode(true);
        setSelectedResellerId('DIRECT_CENTRAL');
        setValidatedReseller(null);
        setCustomReferralCode('');
        setIsCustomReferralMode(false);
      } catch (err) {
        console.debug('Load resellers notice:', err);
      }
    };

    loadResellers();
  }, [isOpen, initialMode]);

  // Strict enforcement: ensure selected package exists
  useEffect(() => {
    if (dealerPackages.length > 0 && !dealerPackages.some(p => p.id === selectedPackageId)) {
      setSelectedPackageId(dealerPackages[0].id);
    }
  }, [isDealerRequested, selectedPackageId, dealerPackages]);

  const handleDealerToggle = (checked: boolean) => {
    setIsDealerRequested(checked);
    if (dealerPackages.length > 0) {
      setSelectedPackageId(dealerPackages[0].id);
    }
  };

  // Sync WhatsApp field with user phone if empty
  useEffect(() => {
    if (regPhone && !dealerWhatsapp) {
      setDealerWhatsapp(regPhone);
    }
  }, [regPhone, dealerWhatsapp]);

  // Handle dropdown reseller change
  const handleResellerDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM_CODE') {
      setIsCustomReferralMode(true);
      setSelectedResellerId('');
      setValidatedReseller(null);
    } else if (val === 'DIRECT_CENTRAL') {
      setIsCustomReferralMode(false);
      setSelectedResellerId('DIRECT_CENTRAL');
      setValidatedReseller(null);
      setCustomReferralCode('');
    } else {
      setIsCustomReferralMode(false);
      setSelectedResellerId(val);
      const found = resellersList.find(r => r.uid === val);
      setValidatedReseller(found || null);
      if (found) {
        setCustomReferralCode(found.referralCode);
      }
    }
  };

  // Handle custom code check
  const handleCustomCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toUpperCase();
    setCustomReferralCode(val);
    if (!val) {
      setValidatedReseller(null);
      setSelectedResellerId('');
      return;
    }
    const match = await getResellerByCode(val);
    if (match) {
      setValidatedReseller(match);
      setSelectedResellerId(match.uid);
    } else {
      setValidatedReseller(null);
      setSelectedResellerId('');
    }
  };

  const isResellerSelected = Boolean(
    selectedResellerId === 'DIRECT_CENTRAL' ||
    selectedResellerId || 
    validatedReseller || 
    (isCustomReferralMode && customReferralCode.trim().length > 0)
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await loginMember(loginEmail, loginPassword);
      if (res.success && res.user) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onAuthSuccess(res.user!, false);
        }, 500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isResellerSelected) {
      setErrorMsg('Lütfen kayıt olmak için listeden bir Bayi seçiniz, doğrudan kaydı seçiniz veya Referans Kodu giriniz.');
      return;
    }

    if (isDealerRequested && !dealerCompanyName.trim()) {
      setErrorMsg('Lütfen Bayilik Başvurusu için Firma Adı / Ticari Unvan bilgisini giriniz.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const targetResellerId = selectedResellerId === 'DIRECT_CENTRAL' 
        ? '' 
        : (selectedResellerId || validatedReseller?.uid || '');
      const targetReferralCode = selectedResellerId === 'DIRECT_CENTRAL'
        ? ''
        : (validatedReseller?.referralCode || (customReferralCode ? customReferralCode.trim().toUpperCase() : ''));

      const dealerData: DealerDetails | undefined = isDealerRequested ? {
        companyName: dealerCompanyName.trim(),
        taxNumber: dealerTaxNumber.trim() || 'Belirtilmedi',
        taxOffice: dealerTaxOffice.trim() || 'Belirtilmedi',
        businessField: dealerBusinessField,
        whatsapp: dealerWhatsapp.trim() || regPhone.trim(),
        address: dealerAddress.trim(),
        notes: dealerNotes.trim(),
        assignedLeg: dealerAssignedLeg,
      } : undefined;

      const res = await registerMember(
        regFullName, 
        regEmail, 
        regPhone, 
        regPassword, 
        selectedPackageId,
        targetResellerId,
        targetReferralCode,
        dealerData,
        regCountryCode
      );

      if (res.success && res.user) {
        setSuccessMsg(res.message);
        
        if (res.whatsappDealerUrl) {
          setPendingWhatsappUrl(res.whatsappDealerUrl);
          // Wait a moment so user sees the message, or allow click
          setTimeout(() => {
            onAuthSuccess(res.user!, true);
          }, 1500);
        } else {
          setTimeout(() => {
            onAuthSuccess(res.user!, true);
          }, 600);
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Kayıt işlemi başarısız.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInstantDemo = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const current = getDeviceDemoStatus();
      if (current.isStarted && !current.isExpired) {
        // Demo session is already ongoing in background, smoothly return to demo without resetting the 30-minute timer!
        setDemoStatus(current);
        if (onStartDemo) {
          onStartDemo();
        } else if (onClose) {
          onClose();
        }
        return;
      }

      const activeRefCode = customReferralCode || validatedReseller?.referralCode || getStoredReferralCode() || '';
      await startDeviceDemoSession(activeRefCode, false);
      const updated = getDeviceDemoStatus();
      setDemoStatus(updated);
      if (onStartDemo) {
        onStartDemo();
      } else if (onClose) {
        onClose();
      }
    } catch (err: any) {
      console.error('Start demo error:', err);
      setErrorMsg('Demo başlatılırken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-emerald-950/70 space-y-5 max-h-[94vh] overflow-y-auto">
        
        {allowClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-500/40 shadow-inner mb-1">
            <Briefcase className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
            AuraBio Bayi & Temsilcilik Portalı
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {tab === 'login' 
              ? 'Yetkili Bayi veya Yönetici Girişi' 
              : 'AKN Yetkili Bayilik Başvuru & Kayıt Formu'}
          </p>
        </div>

        {/* 30-Minute Free Demo Highlight Card */}
        {!demoStatus.isExpired ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-teal-950/80 to-slate-950 border-2 border-emerald-500/50 shadow-xl shadow-emerald-950/60 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                    30 Dk Ücretsiz Demo
                  </span>
                  {demoStatus.isStarted && (
                    <span className="text-[11px] font-mono font-bold text-amber-300">
                      (Kalan: {demoStatus.formattedTime})
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-100">
                  30 Dakikalık Ücretsiz Bayi Deneme Sürümünü Kullanmak İster misiniz?
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Kayıt olmadan önce optik kamera aura taraması, çakra tespiti ve tüm şifa frekanslarını canlı olarak test edin.
                </p>
              </div>
            </div>

            {validatedReseller && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Yetkili Bayi <strong>{validatedReseller.businessName || validatedReseller.fullName}</strong> daveti ile 30 dk deneme tanımlandı</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleStartInstantDemo}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{demoStatus.isStarted ? '✨ Demoyu Kullanmaya Devam Et' : '✨ Ücretsiz 30 Dakikalık Demoyu Deneyin'}</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>30 Dakikalık Ücretsiz Demo Süreniz Tamamlandı</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Uygulamayı kullanmaya devam etmek için lütfen aşağıdaki formdan bayi girişi yapın veya bayilik kaydı oluşturun.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'login' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Bayi / Yönetici Girişi</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'register' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Bayilik Başvurusu / Kayıt</span>
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-start gap-2 text-rose-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            {pendingWhatsappUrl && (
              <a
                href={pendingWhatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Yöneticiye WhatsApp Bildirimi Gönder</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Bayi / Yönetici E-Posta Adresi:</span>
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="bayi@klinik.com"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Şifreniz:</span>
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Kontrol Ediliyor...' : 'Bayi Girişi Yap'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Dealer Registration Prompt */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setIsDealerRequested(true);
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Briefcase className="w-3 h-3" />
                <span>Henüz Bayilik Hesabınız Yok mu? Hemen Bayi Başvurusu Yapın</span>
              </button>
            </div>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            
            {/* DEALER BANNER */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-950 to-amber-950/50 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
                <span>AKN Yetkili Bayilik & Danışman Kayıt Formu</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] border border-amber-500/40 ml-auto">
                  Toptan Lisans & Panel
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Klinikler, biyo-rezonans merkezleri ve danışmanlar için toptan seans havuzu, özel danışan linkleri, komisyon kazancı ve izole Bayi Paneli yetkisi sağlar.
              </p>
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-300 text-[11px] font-bold">
                  <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>🎁 İlk Bayi Kaydı Hoşgeldin Bonusu: 32 + 32 = 64 Seans Kredisi</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-black text-emerald-200 shrink-0">
                  Bir Defaya Mahsus Otomatik
                </span>
              </div>
            </div>

            {/* KURUMSAL / BAYİ BİLGİLERİ */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kurumsal / Bayi Bilgileri</span>
                </span>
                <span className="text-[9px] text-amber-400/80 font-mono">AKN Yetkili İş Ortaklığı</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Firma Adı / Ticari Unvan:</span>
                  <span className="text-rose-400 text-[9px]">* Zorunlu</span>
                </label>
                <input
                  type="text"
                  required
                  value={dealerCompanyName}
                  onChange={(e) => setDealerCompanyName(e.target.value)}
                  placeholder="Örn: AKN Holistik Sağlık Danışmanlık Ltd."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300">
                    Vergi Kimlik No / TC:
                  </label>
                  <input
                    type="text"
                    value={dealerTaxNumber}
                    onChange={(e) => setDealerTaxNumber(e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300">
                    Vergi Dairesi:
                  </label>
                  <input
                    type="text"
                    value={dealerTaxOffice}
                    onChange={(e) => setDealerTaxOffice(e.target.value)}
                    placeholder="Örn: Kadıköy V.D."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-300">
                  Faaliyet Alanı / Sektör:
                </label>
                <select
                  value={dealerBusinessField}
                  onChange={(e) => setDealerBusinessField(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 outline-none"
                >
                  <option value="Biyo-Rezonans & Frekans Merkezi">Biyo-Rezonans & Frekans Merkezi</option>
                  <option value="Klinik / Doktor & Sağlık Profesyoneli">Klinik / Doktor & Sağlık Profesyoneli</option>
                  <option value="Holistik Danışmanlık & Yaşam Koçluğu">Holistik Danışmanlık & Yaşam Koçluğu</option>
                  <option value="Psikoloji & Terapi Merkezi">Psikoloji & Terapi Merkezi</option>
                  <option value="Eczane & Medikal Ürünler">Eczane & Medikal Ürünler</option>
                  <option value="Spa & Wellness & Yoga Merkezi">Spa & Wellness & Yoga Merkezi</option>
                  <option value="Bireysel Terapist / Uygulayıcı">Bireysel Terapist / Uygulayıcı</option>
                  <option value="Diğer Ticari İşletme">Diğer Ticari İşletme</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp İletişim Hattı:</span>
                  </span>
                  <span className="text-amber-400 text-[9px]">Anlık bildirim için</span>
                </label>
                <input
                  type="tel"
                  value={dealerWhatsapp}
                  onChange={(e) => setDealerWhatsapp(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Şirket Adresi / Şehir (Opsiyonel):</span>
                </label>
                <input
                  type="text"
                  value={dealerAddress}
                  onChange={(e) => setDealerAddress(e.target.value)}
                  placeholder="Şehir, İlçe, Açık Adres"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Yetkili Danışman Bilgileri */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Yetkili Ad Soyad:</span>
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Telefon Numarası:</span>
                </label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>E-Posta Adresi (Giriş için):</span>
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="bayi@eposta.com"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                <span>Kayıt Ülkesi:</span>
              </label>
              <select
                required
                value={regCountryCode}
                onChange={(e) => setRegCountryCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 outline-none"
              >
                {MEMBER_COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label} ({country.code})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Yurt dışı kayıtlarda paket fiyatı 3x uygulanır.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Şifre Belirleyin:</span>
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="En az 4 karakter"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 outline-none"
              />
            </div>

            {/* MANDATORY RESELLER / REFERRAL SECTION */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bağlı Olduğunuz Bayi / Referans Seçimi:</span>
                  <span className="text-rose-400 text-xs">*</span>
                </label>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  Zorunlu Alan
                </span>
              </div>

              {isUrlReferralDetected && validatedReseller ? (
                /* Bayi Paylaşım Linki ile Gelenler İçin: Kilitli Sponsor Kartı */
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-950 to-amber-950/70 border border-amber-500/60 flex items-center justify-between gap-3 text-xs shadow-lg ring-1 ring-amber-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-amber-200 text-xs sm:text-sm">
                          {validatedReseller.resellerName}
                        </span>
                        <span className="text-[9px] text-amber-300 bg-amber-900/90 px-2 py-0.5 rounded-full border border-amber-500/50 font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Yetkili Üst Bayi (Kilitli Sponsor)</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-400 font-mono font-bold">
                        Davet Kodu: <strong className="text-amber-200">{validatedReseller.referralCode}</strong>
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Bu bayi davet bağlantısı üzerinden kayıt işleminiz doğrudan bu yetkili bayinin sponsorluğuna kilitlenmiştir.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Normal Link ile Giriş Yapanlar İçin: Serbest / Manuel Sponsor Seçimi */
                <div className="space-y-2.5 animate-fade-in">

                  {/* Hızlı Seçim Butonları (Pills) */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedResellerId('DIRECT_CENTRAL');
                        setIsCustomReferralMode(false);
                        setCustomReferralCode('');
                        setValidatedReseller(null);
                      }}
                      className={`px-2 py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        !isCustomReferralMode && selectedResellerId === 'DIRECT_CENTRAL'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      🌐 Doğrudan Merkez
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomReferralMode(false);
                        if (resellersList.length > 0 && selectedResellerId === 'DIRECT_CENTRAL') {
                          setSelectedResellerId(resellersList[0].uid);
                        }
                      }}
                      className={`px-2 py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        !isCustomReferralMode && selectedResellerId !== 'DIRECT_CENTRAL'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      🏢 Listeden Bayi Seç
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomReferralMode(true);
                      }}
                      className={`px-2 py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        isCustomReferralMode
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      ✏️ Kod Gir
                    </button>
                  </div>

                  {!isCustomReferralMode ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedResellerId}
                        onChange={handleResellerDropdownChange}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 outline-none"
                      >
                        <option value="DIRECT_CENTRAL">🌐 AuraBio Genel / Doğrudan Kayıt (Merkez Lisanslama - Sponsorsuz)</option>
                        {resellersList.map((r) => (
                          <option key={r.uid} value={r.uid}>
                            🏢 {r.resellerName} (Bayi Kodu: {r.referralCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1 animate-fade-in">
                      <div className="relative">
                        <input
                          type="text"
                          value={customReferralCode}
                          onChange={handleCustomCodeChange}
                          placeholder="Örn: AURA-BAYI-8726 veya AURA-REF-1049"
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-slate-100 placeholder:text-slate-600 uppercase font-mono outline-none"
                        />
                        <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                      </div>
                      {validatedReseller ? (
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Onaylandı: <strong>{validatedReseller.resellerName}</strong> ({validatedReseller.referralCode})</span>
                        </div>
                      ) : customReferralCode.length > 3 ? (
                        <div className="text-[10px] text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Bu referans kodu sistemde aranıyor veya bulunamadı.</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-slate-400">
                AuraBio Frekans sistemi kurumsal lisanslama ve teknik danışmanlık hizmetleri yetkili bayi ağı üzerinden sağlanmaktadır.
              </p>

              {/* Kol Yerleşimi Tercihi (Sol Kol / Sağ Kol / Otomatik Dengeleyici) */}
              <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                    <span>Organizasyon Kol Tercihi (Sol Kol / Sağ Kol):</span>
                  </label>
                  <span className="text-[10px] text-amber-400/90 font-mono">Hibrit Ağaç</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setDealerAssignedLeg('AUTO')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      dealerAssignedLeg === 'AUTO'
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold shadow-xs'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⚖️ Otomatik
                  </button>
                  <button
                    type="button"
                    onClick={() => setDealerAssignedLeg('LEFT')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      dealerAssignedLeg === 'LEFT'
                        ? 'bg-blue-600/30 border-blue-400 text-blue-200 font-bold shadow-xs'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⬅️ Sol Kol
                  </button>
                  <button
                    type="button"
                    onClick={() => setDealerAssignedLeg('RIGHT')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      dealerAssignedLeg === 'RIGHT'
                        ? 'bg-purple-600/30 border-purple-400 text-purple-200 font-bold shadow-xs'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ➡️ Sağ Kol
                  </button>
                </div>
              </div>
            </div>

            {/* Bayilik Başlangıç Paketi ve Kredi Havuzu */}
            <div className="space-y-2 pt-1 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bayilik Başlangıç Paketi ve Kredi Havuzu:</span>
                  <span className="text-rose-400 text-xs">*</span>
                </label>
                <span className="text-[10px] text-amber-400 font-semibold">(Bayi Seans Kredisi)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {dealerPackages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  const regionalPackage = getRegionalDealerPackage(pkg);
                  return (
                    <div
                      key={pkg.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between relative ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-950/80 via-slate-900 to-amber-950/50 border-amber-400 text-slate-100 shadow-md ring-1 ring-amber-400/60'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {pkg.badge && (
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isSelected 
                              ? 'bg-amber-500/30 text-amber-200 border-amber-500/50' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {pkg.badge}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isInternationalRegistration && <span className="px-1.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-300 text-[8px] font-black">3x Yurt Dışı</span>}
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </div>
                        </div>
                      )}

                      <div className="cursor-pointer" onClick={() => setSelectedPackageId(pkg.id)}>
                        <div className="font-bold text-xs text-slate-100 leading-tight">
                          {pkg.name}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                          <span>{pkg.scanCredits} Seans Kredisi</span>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-800/80">
                        <div className="flex items-baseline justify-between mb-2">
                          <div className="text-sm font-black text-amber-300 font-mono">
                            {regionalPackage.priceText}
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">
                            {formatUsd(regionalPackage.price / pkg.scanCredits, 2)}/seans
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingPackage(pkg);
                            }}
                            className="flex-1 py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Info className="w-3 h-3 text-amber-400" />
                            <span>İncele</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPackageId(pkg.id)}
                            className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isSelected ? 'Seçildi' : 'Seç'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className={`text-[10px] italic ${isInternationalRegistration ? 'text-sky-300' : 'text-amber-300/80'}`}>
                {isInternationalRegistration
                  ? 'Yurt dışı kayıtlarda tüm paket ve seans bedelleri 3x uygulanır. Kartlardaki tutarlar seçtiğiniz ülkeye göre güncellenir.'
                  : 'Türkiye kayıtlarında paket fiyatları yerel katalog tutarlarıdır. Bayi seans kredilerinin son kullanma tarihi yoktur; paket ayrıntılarını “İncele” ile görüntüleyebilirsiniz.'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[10px] text-slate-400 text-center leading-relaxed space-y-1">
              <div>
                Kayıt olarak{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLegalContractType('terms');
                    setIsLegalModalOpen(true);
                  }}
                  className="text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  Bayilik Şartlarını
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLegalContractType('kvkk');
                    setIsLegalModalOpen(true);
                  }}
                  className="text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  Gizlilik & KVKK Sözleşmesini
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLegalContractType('distanceSale');
                    setIsLegalModalOpen(true);
                  }}
                  className="text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  Mesafeli Satış Sözleşmesini
                </button>
                {' '}ve{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLegalContractType('cancellationRefund');
                    setIsLegalModalOpen(true);
                  }}
                  className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Dijital Ürün İade & Cayma Koşullarını
                </button>
                {' '}kabul etmiş sayılırsınız.
              </div>
              <div className="text-[9px] text-slate-500">
                (6502 Sayılı TKHK ve Mesafeli Sözleşmeler Yönetmeliği Md 15/1-ğ uyarınca dijital lisans teslimatı sonrası cayma hakkı bulunmamaktadır.)
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isResellerSelected}
              className={`w-full mt-1 py-3.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                isResellerSelected && !isLoading
                  ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-950/60 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                'Bayilik Hesabı Oluşturuluyor...'
              ) : !isResellerSelected ? (
                'Lütfen Bayi / Referans Seçiniz'
              ) : (
                'Bayilik Başvurusunu Tamamla ve Giriş Yap'
              )}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>

      {/* Package Detail Modal for in-depth inspection */}
      <PackageDetailModal
        pkg={inspectingPackage ? getRegionalDealerPackage(inspectingPackage) : null}
        isOpen={Boolean(inspectingPackage)}
        onClose={() => setInspectingPackage(null)}
        onSelectPackage={(pkg) => {
          setSelectedPackageId(pkg.id);
          setInspectingPackage(null);
        }}
        isDealerMode={true}
        isInternational={isInternationalRegistration}
      />

      {/* Legal Contracts Modal */}
      <LegalContractsModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalContractType}
      />
    </div>
  );
};
