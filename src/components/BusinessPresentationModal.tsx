import React, { useCallback, useState, useEffect } from 'react';
import { formatUsd } from '../utils/currency';
import QRCode from 'qrcode';
import { 
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  CheckCircle2, 
  FileText, 
  Download, 
  TrendingUp, 
  ShieldCheck, 
  Coins, 
  Briefcase, 
  Users, 
  Smartphone, 
  Activity, 
  Zap, 
  Award, 
  ArrowRight, 
  DollarSign, 
  Compass, 
  Brain, 
  Layers, 
  Calculator, 
  BookOpen, 
  Building2,
  Percent,
  Send,
  Watch,
  Mic,
  Globe,
  CreditCard,
  Lock,
  Scale,
  QrCode,
  HeartPulse,
  Flame,
  Moon,
  Sun,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { UserMember } from '../utils/authManager';
import type { DealerPackage } from '../config/dealerPackages';
import { 
  Reseller, 
  getDealerPackages, 
  getActiveResellerSession, 
  getStoredReferralCode, 
  setStoredReferralCode, 
  getResellerByCode, 
  detectAndSaveReferralCodeFromUrl 
} from '../utils/resellerManager';
import { CAREER_TIERS, FREKANS_PACKAGES, MONOLINE_DEPTH_RATES } from '../types/monoline';
import { HEALING_CATEGORIES, TOTAL_HEALING_COUNT } from '../data/healingLibrary';
import { downloadTechnicalReportWord, downloadTechnicalReportPDF } from '../utils/technicalReportExport';

interface BusinessPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserMember | null;
  onOpenAuthModal?: (
    mode?: 'login' | 'register' | 'dealer',
    sponsor?: { uid: string; resellerName: string; referralCode: string; email?: string; phone?: string }
  ) => void;
  onOpenResellerModal?: (tab?: 'overview' | 'packages' | 'share') => void;
  onOpenDealerBusinessCard?: () => void;
}

type TabSection = 
  | 'what_it_is' 
  | 'earnings' 
  | 'how_to_use' 
  | 'simulator' 
  | 'packages' 
  | 'compliance'
  | 'share';

const PRESENTATION_SLIDES: TabSection[] = [
  'what_it_is',
  'earnings',
  'how_to_use',
  'simulator',
  'packages',
  'compliance',
  'share',
];

export const BusinessPresentationModal: React.FC<BusinessPresentationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuthModal,
  onOpenResellerModal,
  onOpenDealerBusinessCard,
}) => {
  const [activeSection, setActiveSection] = useState<TabSection>('what_it_is');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [activeReseller, setActiveReseller] = useState<Reseller | null>(() => getActiveResellerSession());
  const [referredDealerInfo, setReferredDealerInfo] = useState<Reseller | null>(null);
  const [dealerPackages, setDealerPackages] = useState<DealerPackage[]>(() => getDealerPackages());
  const [pkgCatalogFilter, setPkgCatalogFilter] = useState<'ALL' | 'STARTER' | 'CLINIC' | 'ENTERPRISE' | 'STARTER_3'>('ALL');
  const packageCount = FREKANS_PACKAGES.length;
  const packageCreditRange = FREKANS_PACKAGES.map((pkg) => pkg.sessionCredits);
  const minPackageCredits = Math.min(...packageCreditRange);
  const maxPackageCredits = Math.max(...packageCreditRange);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Interactive Multi-Way Earnings Calculator State (100% Pure USD Architecture)
  const [calcClientsPerMonth, setCalcClientsPerMonth] = useState<number>(30);
  const [calcPricePerSession, setCalcPricePerSession] = useState<number>(50); // $50/seans
  const [calcReferredMembers, setCalcReferredMembers] = useState<number>(5);
  const [calcAvgPackagePrice, setCalcAvgPackagePrice] = useState<number>(() => FREKANS_PACKAGES[2]?.defaultPrice || 603);
  const [calcMonolineTeamOrders, setCalcMonolineTeamOrders] = useState<number>(12);
  const [calcCareerLevel, setCalcCareerLevel] = useState<number>(4);
  const [includeMatchingBonus, setIncludeMatchingBonus] = useState<boolean>(true);
  const [includeFastRoi, setIncludeFastRoi] = useState<boolean>(true);

  // Active Referral Code Determination
  const urlReferralCode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase()
    : '';
  const activeReferralCode = urlReferralCode
    || activeReseller?.referralCode
    || currentUser?.dealerDetails?.referralCode
    || currentUser?.referredByCode
    || detectAndSaveReferralCodeFromUrl()
    || getStoredReferralCode() 
    || '';

  useEffect(() => {
    if (!isOpen) return;
    const res = getActiveResellerSession();
    if (res) {
      setActiveReseller(res);
      setReferredDealerInfo(res);
    }
    setDealerPackages(getDealerPackages());

    const resolveDealer = async () => {
      const code = activeReferralCode || detectAndSaveReferralCodeFromUrl() || getStoredReferralCode();
      if (code) {
        setStoredReferralCode(code);
        const match = await getResellerByCode(code);
        if (match) {
          setReferredDealerInfo(match);
        }
      }
    };
    resolveDealer();
  }, [isOpen, currentUser, activeReferralCode]);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://akngroupfrekans.web.app';
  const fullShareUrl = `${currentOrigin}/?ref=${encodeURIComponent(activeReferralCode)}&view=presentation`;

  // Generate QR Code dynamically
  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(
      fullShareUrl,
      {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#064e3b',
          light: '#ffffff'
        }
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [fullShareUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeReferralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDealerRegistration = async () => {
    setRegistrationError(null);
    const referralCode = activeReferralCode.trim().toUpperCase();
    if (!referralCode) {
      onClose();
      onOpenAuthModal?.('dealer');
      return;
    }

    let sponsor: Reseller | null;
    try {
      sponsor = referredDealerInfo?.referralCode.toUpperCase() === referralCode
        ? referredDealerInfo
        : await getResellerByCode(referralCode);
    } catch {
      sponsor = null;
    }
    if (!sponsor) {
      setRegistrationError('Paylaşım yapan bayinin referans kodu doğrulanamadı. Lütfen katalog bağlantısını yeniden açın.');
      return;
    }

    setStoredReferralCode(sponsor.referralCode);
    onClose();
    onOpenAuthModal?.('dealer', {
      uid: sponsor.uid,
      resellerName: sponsor.resellerName,
      referralCode: sponsor.referralCode,
      email: sponsor.email,
      phone: sponsor.phone,
    });
  };

  // WhatsApp Share Message
  const waShareText = encodeURIComponent(
    `AuraBio iş sunumu ve dijital katalog\n\n` +
    `Kamera raporu, ses içerikleri, MindSpace araçları, ${packageCount} kredi paketi ve koşullu gelir simülasyonunu inceleyin. Uygulama tıbbi teşhis veya tedavi sunmaz; kazanç garantisi yoktur. Kart ödemesi sandbox test ortamındadır.\n\n` +
    `Sunum bağlantısı: ${fullShareUrl}\n\n` +
    `Referans kodu: ${activeReferralCode}`
  );
  const waShareLink = `https://wa.me/?text=${waShareText}`;

  // Telegram Share Link
  const tgShareLink = `https://t.me/share/url?url=${encodeURIComponent(fullShareUrl)}&text=${encodeURIComponent('AuraBio Frekans iş sunumu ve dijital katalog')}`;

  const selectedCalculatorPackage =
    FREKANS_PACKAGES.find((pkg) => pkg.defaultPrice === calcAvgPackagePrice) || FREKANS_PACKAGES[0];
  const unitSessionCost =
    selectedCalculatorPackage.defaultPrice / selectedCalculatorPackage.sessionCredits;

  // Gelir simülatörü varsayımları
  const monthlySessionRevenue = calcClientsPerMonth * calcPricePerSession;
  const monthlySessionCost = calcClientsPerMonth * unitSessionCost;
  const monthlySessionProfit = monthlySessionRevenue - monthlySessionCost;
  const monthlyDirectSponsorCommission = (calcReferredMembers * calcAvgPackagePrice * 20) / 100;

  // Monoline 7 depth commission across unlocked depths
  const unlockedRatesSum = (MONOLINE_DEPTH_RATES || []).slice(0, calcCareerLevel).reduce((s, r) => s + r.percentage, 0);
  const avgDepthRate = calcCareerLevel > 0 ? unlockedRatesSum / 7 : 0;
  const monthlyMonolineCommission = Math.round((calcMonolineTeamOrders * calcAvgPackagePrice * avgDepthRate) / 100);

  const selectedCareerTier = CAREER_TIERS.find((t) => t.level === calcCareerLevel) || CAREER_TIERS[3];
  const monthlyCareerPoolBonus = Math.round(
    ((calcReferredMembers + calcMonolineTeamOrders) * calcAvgPackagePrice * 0.5) * selectedCareerTier.poolBonusRate
  );

  // Liderlik Eşleşme (Matching Bonus: %10 + %5 + %5 = max %20)
  const matchingRate = calcCareerLevel >= 6 ? 0.20 : calcCareerLevel >= 5 ? 0.15 : calcCareerLevel >= 3 ? 0.10 : 0;
  const monthlyMatchingBonus = includeMatchingBonus && calcCareerLevel >= 3
    ? Math.round(monthlyMonolineCommission * matchingRate)
    : 0;

  // Fast-ROI bonus: If referred members >= 3, +15% ekstra ikramiye (toplam %75 nakit geri dönüş)
  const monthlyFastRoiBonus = includeFastRoi && calcReferredMembers >= 3
    ? Math.round(3 * calcAvgPackagePrice * 0.15)
    : 0;

  const totalMonthlyEarnings =
    monthlySessionProfit +
    monthlyDirectSponsorCommission +
    monthlyMonolineCommission +
    monthlyCareerPoolBonus +
    monthlyMatchingBonus +
    monthlyFastRoiBonus;

  const yearlyProjectedEarnings = totalMonthlyEarnings * 12;
  const activeSlideIndex = PRESENTATION_SLIDES.indexOf(activeSection);
  const moveSlide = useCallback((direction: -1 | 1) => {
    const nextIndex = (activeSlideIndex + direction + PRESENTATION_SLIDES.length) % PRESENTATION_SLIDES.length;
    setActiveSection(PRESENTATION_SLIDES[nextIndex]);
  }, [activeSlideIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      if (event.key === 'ArrowRight') moveSlide(1);
      if (event.key === 'ArrowLeft') moveSlide(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, moveSlide]);

  // ROI Payback Calculation
  const dailyEarnings = totalMonthlyEarnings / 30;
  const estimatedRoiDays = dailyEarnings > 0 ? Math.max(1, Math.round(calcAvgPackagePrice / dailyEarnings)) : 30;

  // Filtered packages
  const filteredPackages = FREKANS_PACKAGES.filter((pkg) => {
    if (pkgCatalogFilter === 'ALL') return true;
    if (pkgCatalogFilter === 'STARTER') return pkg.defaultPrice <= 20000;
    if (pkgCatalogFilter === 'CLINIC') return pkg.defaultPrice > 20000 && pkg.defaultPrice <= 100000;
    if (pkgCatalogFilter === 'ENTERPRISE') return pkg.defaultPrice > 100000;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[60] flex h-[100dvh] w-full items-stretch justify-stretch bg-slate-100 text-slate-800 animate-in fade-in duration-200">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.10),_transparent_36%),radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.08),_transparent_38%),#f8fafc]">
        
        {/* Top Header Bar */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-emerald-50 px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/30 to-teal-500/20 text-emerald-700 shadow-inner sm:h-12 sm:w-12">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 font-black text-[11px] border border-emerald-500/30 tracking-wider">
                  AuraBio Frekans
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 font-bold text-[10px] border border-indigo-500/40">
                  İş Sunumu &amp; Dijital Katalog
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 font-bold text-[10px] border border-amber-500/40">
                  {packageCount} Kredi Paketi · Monoline 7 Nefis MLM
                </span>
                {activeReferralCode && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Ref: {activeReferralCode}</span>
                  </span>
                )}
              </div>
              <h2 className="mt-1 break-words text-sm font-black text-slate-900 sm:text-lg">
                Uygulama özellikleri, {packageCount} paket ve Monoline gelir modeli
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-all cursor-pointer"
              title="Sunum Linkini Kopyala"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedLink ? 'Kopyalandı' : 'Linki Kopyala'}</span>
            </button>

            <a
              href={waShareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950"
              title="WhatsApp İle Paylaş"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-white transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="shrink-0 border-b border-white/10 bg-white/75 px-4 py-3 backdrop-blur-xl sm:px-7">
          <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
            <span>Sunum bölümleri</span>
            <span>{activeSlideIndex + 1} / {PRESENTATION_SLIDES.length}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              {
                id: 'what_it_is' as TabSection,
                num: '1',
                title: '1. Uygulama Özellikleri',
                short: 'Uygulama Özellikleri',
                icon: Activity,
                color: 'emerald',
              },
              {
                id: 'earnings' as TabSection,
                num: '2',
                title: "2. 7'li Gelir Mimarisi & Monoline MLM",
                short: "7'li Gelir & Monoline",
                icon: TrendingUp,
                color: 'amber',
              },
              {
                id: 'how_to_use' as TabSection,
                num: '3',
                title: '3. 6 Adımlı Süreç & Kullanım Rehberi',
                short: '6 Adımlı Rehber',
                icon: Compass,
                color: 'teal',
              },
              {
                id: 'simulator' as TabSection,
                num: '4',
                title: '4. Gelişmiş Gelir Simülatörü & ROI',
                short: 'Gelir Simülatörü',
                icon: Calculator,
                color: 'indigo',
              },
              {
                id: 'packages' as TabSection,
                num: '5',
                title: `5. ${packageCount} Bayilik Paketi`,
                short: `${packageCount} Bayilik Paketi`,
                icon: Coins,
                color: 'purple',
              },
              {
                id: 'compliance' as TabSection,
                num: '6',
                title: '6. Ödeme ve Ürün Sınırları',
                short: 'Ödeme ve Sınırlar',
                icon: ShieldCheck,
                color: 'cyan',
              },
              {
                id: 'share' as TabSection,
                num: '7',
                title: '7. Paylaş, QR Kod & Rapor İndir',
                short: 'Paylaş & QR Rapor',
                icon: Share2,
                color: 'emerald',
              },
            ].map((btn) => {
              const isActive = activeSection === btn.id;
              const IconComp = btn.icon;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setActiveSection(btn.id)}
                  className={`min-w-[190px] text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-1.5 cursor-pointer text-xs ${
                    isActive
                      ? 'bg-gradient-to-r sm:bg-gradient-to-b from-amber-50 via-white to-amber-50 border-amber-300 text-amber-800 shadow-md ring-1 ring-amber-400/40 font-black'
                      : 'bg-slate-50/70 hover:bg-slate-850 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 font-semibold'
                  }`}
                  title={btn.title}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isActive
                          ? 'bg-amber-400 text-slate-900 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {btn.num}
                    </span>
                    <IconComp
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-amber-700' : 'text-slate-600'
                      }`}
                    />
                    <span className="truncate text-[11px] leading-tight">
                      {btn.title}
                    </span>
                  </div>
                  {isActive && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-700 font-bold border border-amber-400/30">
                      Aktif ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div key={activeSection} className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-8 space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">

          {/* SİZİ DAVET EDEN YETKİLİ BAYİ KARTI (REFERRAL SHOWCASE BANNER) */}
          {referredDealerInfo && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-indigo-50 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/40 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-700 shrink-0 shadow-inner">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-black text-emerald-400">
                      Sizi Davet Eden Yetkili Bayimiz
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-500/40">
                      Ref Kodu: {referredDealerInfo.referralCode}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 mt-0.5">
                    <span>{referredDealerInfo.resellerName}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-500/40">
                      Onaylı AKN Bayisi ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 mt-0.5">
                    Bu dijital katalog üzerinden yapacağınız her üyelik veya paket alımı doğrudan bu bayiye ve Küresel Tek Hat (Monoline) sistemine bağlanır.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                {referredDealerInfo.phone && (
                  <a
                    href={`https://wa.me/${referredDealerInfo.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Merhaba ${referredDealerInfo.resellerName}, AuraBio Frekans İş Sunumu ve Kataloğunuzu inceliyorum. Bayilik, seans paketleri ve Monoline gelir modeli hakkında bilgi alabilir miyim?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>WhatsApp ile Danış</span>
                  </a>
                )}

                <button
                  onClick={() => void handleDealerRegistration()}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-950"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bu Bayiyle Kaydol</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 1: 16 BÜTÜNCÜL TEKNOLOJİ & TÜM GELİŞMİŞ MODÜLLER */}
          {activeSection === 'what_it_is' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Hero Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-500/40 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Kamera görselleştirmeleri, ses araçları ve frekans kütüphanesi</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Kamera tabanlı görseller, ses araçları ve 11 bölümlü rapor sunan dijital platform
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl">
                  AuraBio; kamera raporu, isteğe bağlı mikrofon ve uyumlu Bluetooth cihazı, ses kütüphanesi, MindSpace ve mandala araçlarını bir araya getirir. Rapor ve görseller sembolik veya uygulama içi yorumlardır; sağlık, enerji alanı ya da hücresel durum ölçümü, tıbbi teşhis veya tedavi değildir.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200">
                    <div className="text-emerald-400 font-mono font-black text-lg">16 Modül</div>
                    <div className="text-[10px] text-slate-600">Entegre Biyo-Sistem</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200">
                    <div className="text-amber-400 font-mono font-black text-lg">{TOTAL_HEALING_COUNT} içerik</div>
                    <div className="text-[10px] text-slate-600">Ses ve frekans kütüphanesi</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200">
                    <div className="text-cyan-400 font-mono font-black text-lg">{HEALING_CATEGORIES.length} kategori</div>
                    <div className="text-[10px] text-slate-600">Kütüphane sınıflandırması</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200">
                    <div className="text-purple-400 font-mono font-black text-lg">11 Bölümlü</div>
                    <div className="text-[10px] text-slate-600">Uygulama içi rapor</div>
                  </div>
                </div>
              </div>

              {/* Uygulama özellikleri */}
              <div className="space-y-4">
                
                {/* Domain 1: Biyometrik Tarama & 3D Spektrometre */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-400 tracking-wider">
                    <HeartPulse className="w-4 h-4" />
                    <span>A. Canlı Biyometrik Tarama &amp; 3D Kuantum Spektrometre</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-emerald-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span>1. Canlı Optik Spektrometre &amp; Biyo-Aura Taraması</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Kamera girdisinden sembolik renk ve rehberlik görselleri oluşturur. Enerji alanlarını veya sağlık durumunu ölçmez ve blokajları gidermez.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-teal-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-teal-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/40">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span>2. 3D İnteraktif Kuantum Biyo-Aura Simülatörü</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Döndürülebilir 3D model, rapordaki sembolik değerleri görselleştirir; enerji alanı veya çakra ölçümü değildir. Önceki tarama yoksa karşılaştırma örnek veriler kullanabilir.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-cyan-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40">
                          <Mic className="w-4 h-4" />
                        </div>
                        <span>3. 10s Ön / Son Vokal Biyo-Akustik &amp; F0 Harmonik Analiz</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Mikrofon izniyle kısa öncesi ve sonrası ses örneklerini uygulama içinde karşılaştırır. Bu karşılaştırma hücresel değişim veya sağlık ölçümü değildir.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-indigo-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40">
                          <Watch className="w-4 h-4" />
                        </div>
                        <span>4. Web BLE Akıllı Saat Nabız &amp; HRV Canlı Köprüsü</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Web Bluetooth destekleyen tarayıcı ve uyumlu kalp hızı hizmeti sunan cihaz gerektirir. Cihaz desteği değişir; simülasyon verileri gerçek sensör ölçümü değildir ve sağlık kararlarında kullanılmamalıdır.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Domain 2: Frekans Kütüphanesi & Kuantum Rezonans */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
                    <Zap className="w-4 h-4" />
                    <span>B. Kuantum Frekans Üretimi &amp; Şifa Ansiklopedisi</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-amber-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-amber-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
                          <Flame className="w-4 h-4" />
                        </div>
                        <span>5. {TOTAL_HEALING_COUNT} içerikli ses ve frekans kütüphanesi</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        99 Esma-ül Hüsna titreşimleri (Ya Şafi 391Hz vb.), 25 Anadolu Sufi Makamı (Rast, Hicaz, Nihavend), Antik Solfejyo (174Hz, 285Hz, 396Hz, 417Hz, 528Hz, 639Hz, 741Hz, 852Hz, 963Hz), Rife, Tesla 3-6-9 ve Nogier rezonansları.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-rose-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-rose-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span>6. Kategorilere ayrılmış içerik ansiklopedisi</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Ansiklopedideki açıklamalar ve ses seçenekleri bilgilendirme amaçlıdır; kanıta dayalı tedavi veya hastalık protokolü olarak değerlendirilmemelidir.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-purple-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-purple-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <span>7. Sesli &amp; Niyetli Frekans Labirenti (Voice Forge)</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Web Audio API çoklu osilatör mimarisi ile danışanın niyetinin ses tonu üzerinden spektral analizini yapar; Schumann 7.83Hz topraklaması eşliğinde kişiye özel akortlanmış frekans titreşimleri üretir.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-fuchsia-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-fuchsia-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span>8. Dinamik Kutsal Geometri Mandala Jeneratörü</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Oynatılan çakra ve Solfejyo frekansına göre dinamik olarak Yaşam Çiçeği, Torus, Metatron Küpü ve Sri Yantra fraktal geometrileri üreterek hem görsel hem işitsel rezonans sağlar; yüksek çözünürlükte dışa aktarılabilir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Domain 3: Nöro-Akustik, Uyku & Zihin Laboratuvarı */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-400 tracking-wider">
                    <Brain className="w-4 h-4" />
                    <span>C. Nöro-Akustik, Zihin &amp; Biyolojik Ritim Mimarisi</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-indigo-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40">
                          <Brain className="w-4 h-4" />
                        </div>
                        <span>9. MindSpace Studio &amp; 6-Kanal Nöro-Akustik Mikser</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Binaural vuruşlar, Isochronic tonlar ve 5 beyin dalgası (Delta, Theta, Alpha, Beta, Gamma) eşliğinde; Taşıyıcı Dalga, Okyanus, Yağmur, Tibet Çanağı ve Şömine seslerinden oluşan 6 kanallı kişiselleştirilebilir stüdyo mikseri.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-sky-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-sky-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/40">
                          <Moon className="w-4 h-4" />
                        </div>
                        <span>10. Kadim Arketip Rüya &amp; Bilinçaltı Çözümleyicisi</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Rüya notları için sembolik yorumlar ve ses önerileri sunar; bilinçaltı blokajı tespit etmez ve psikolojik değerlendirme değildir.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-amber-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-amber-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
                          <Sun className="w-4 h-4" />
                        </div>
                        <span>11. 24 Saatlik Sirkadiyen Biyo-Ritim Senkronizatörü</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Günün saatine göre içerik önerileri gösterir; hormonları, organ işlevlerini veya biyolojik ritmi ölçmez ya da eşzamanladığını kanıtlamaz.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-blue-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-blue-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40">
                          <Moon className="w-4 h-4" />
                        </div>
                        <span>12. Gece Uyku &amp; Epifiz Melatonin Protokolü</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Dinleme ve zamanlayıcı seçenekleri sunar; uyku evrelerini, melatonini veya hücresel yenilenmeyi etkilediği doğrulanmamıştır ve uyku bozukluklarını tedavi etmez.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uygulama raporu, grup ve rehberli araçlar */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-cyan-400 tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>D. Grup ve rehberli uygulama araçları</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-rose-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-rose-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span>13. Acil Durum Hızlı Denge SOS Modu</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Kısa ses ve nefes rehberi sunar; acil sağlık hizmeti veya tedavi değildir. Acil durumda yerel acil servisleri arayın.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-teal-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-teal-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/40">
                          <Users className="w-4 h-4" />
                        </div>
                        <span>14. Kurumsal &amp; Aile Çemberi (Group Aura Sync)</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Grup oturumu ve senkronizasyon arayüzünü sunar. Gösterilen grup değerleri tıbbi kalp ölçümü veya şifa kanıtı değildir.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-emerald-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span>15. Günlük ve 7 günlük rehberli içerikler</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Uygulamada sunulan rehberli içerikler yedi günlük akışta listelenir. Bunlar hücresel detoks veya sağlık etkisi kanıtı değildir.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-2 hover:border-amber-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-amber-700 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span>16. 11 bölümlü uygulama raporu ve harita görünümü</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        İlim Kapı, Genel Bakış, renk ve duygu görünümleri, aurik katmanlar, çakra rehberi, letaif, Esma/frekans, yaşam koçu, 3D görünüm ve paranormal ölçüm yapılmadığını bildiren bölümden oluşan 11 bölümlü raporu ve ayrı harita ekranını sunar. Bölümler açılır listeden seçilir. Rapor PDF olarak indirilebilir; görseller klinik ölçüm değildir.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Funnel */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-slate-50 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Monoline 7 Nefis MLM &amp; Bayi Gelir Modelini Keşfedin</h4>
                  <p className="text-xs text-slate-600">Danışan seans kârı, %20 Direkt Sponsor, %25 Monoline Tek Hat ve %5 Sistem / Kariyer Fonu gelirlerini inceleyin.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveSection('earnings')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-950 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <span>Monoline Gelir Modelini Gör</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveSection('packages')}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-300"
                  >
                    {packageCount} Bayi Paketini İncele
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 2: 7'Lİ GELİR MİMARİSİ & MONOLINE 7 NEFİS MLM */}
          {activeSection === 'earnings' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 border border-amber-500/40 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" />
                  <span>Çift Motorlu Hibrit Komisyon Mimarisi &amp; 7 Nefis Mertebesi MLM Kazanç Planı</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Danışan Seans Geliri + %20 Direkt Sponsor + Motor 1: %25 Unilevel (7 Derinlik) + Motor 2: %5 Küresel Sıra Teşviki + %5 Sistem Fonu
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl">
                  Sistemimizin finansal sürdürülebilirliğini sağlamak, çalışan liderleri ödüllendirmek ve pasif üyeleri sistemde tutabilmek amacıyla komisyon altyapısı <strong>Çift Motorlu Hibrit Model</strong> ile güçlendirilmiştir. Bir sipariş gerçekleştiğinde iki bağımsız motor eşzamanlı olarak tetiklenir.
                </p>
              </div>

              {/* SİDE-BY-SİDE ÇİFT MOTORLU HİBRİT MİMARİ GÖRSEL ŞEMASI */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-6 rounded-3xl bg-white/90 border border-slate-200 shadow-xl">
                {/* SOL TARAF: Motor 1 - Sizin Sponsorluğunuzla Genişleyen 7 Derinlikli Sponsorluk Ağacı (Unilevel) */}
                <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-500/40 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-700 text-xs font-mono font-black border border-indigo-500/40">
                          MOTOR 1
                        </span>
                        <h4 className="text-base font-bold text-slate-900">Ekip Kurma &amp; Liderlik Kazancı</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-400/30">
                        Unilevel 7 Derinlik · Toplam %25
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-500/40 text-xs font-medium text-indigo-800 leading-relaxed">
                      &ldquo;Kendi ekibinizi kurun, dikeyde 7 derinliğe kadar oluşan tüm cirodan %25&apos;e varan pay alın! Ne kadar geniş hat açarsanız kazancınız o kadar katlanır.&rdquo;
                    </div>

                    <div className="text-[11px] text-slate-700 font-mono space-y-1">
                      <div className="text-indigo-700 font-bold mb-1">🌿 Sponsor Bağına Dayalı Derinlik Oranları:</div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <div className="p-1.5 rounded bg-indigo-50 border border-indigo-500/20 flex justify-between">
                          <span>1. Derinlik (Direkt):</span> <strong className="text-indigo-700">%7</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-50 border border-indigo-500/20 flex justify-between">
                          <span>2. Derinlik:</span> <strong className="text-indigo-700">%5</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-50 border border-indigo-500/20 flex justify-between">
                          <span>3. Derinlik:</span> <strong className="text-indigo-700">%4</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-50 border border-indigo-500/20 flex justify-between">
                          <span>4. Derinlik:</span> <strong className="text-indigo-700">%3</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-50 border border-indigo-500/20 flex justify-between">
                          <span>5. Derinlik:</span> <strong className="text-indigo-700">%2</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-50 border border-indigo-500/20 flex justify-between">
                          <span>6. Derinlik:</span> <strong className="text-indigo-700">%2</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-50 border border-indigo-500/20 flex justify-between col-span-2">
                          <span>7. Derinlik:</span> <strong className="text-indigo-700">%2</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-500/30 text-[10px] text-indigo-700 font-mono">
                    ⚠️ 8. Ebeveyn Kuralı: 8. derinlik ve sonrasına prim aktarılmaz, tarama 7. basamakta durdurulur.
                  </div>
                </div>

                {/* SAĞ TARAF: Motor 2 - Dünya Genelinde Arkadan Gelen Küresel Tek Sıra (Monoline) */}
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-500/40 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 text-xs font-mono font-black border border-emerald-500/40">
                          MOTOR 2
                        </span>
                        <h4 className="text-base font-bold text-slate-900">Küresel Sıra Pasif Teşviki</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-400/30">
                        Monoline Global Line · Toplam %5
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-500/40 text-xs font-medium text-emerald-800 leading-relaxed">
                      &ldquo;Sisteme erken dahil olmanın avantajını yaşayın! Arkanızdan gelen küresel sıranın ilk 7 derinliğinden %5&apos;lik havuzdan sembolik teşvik primi kazanın.&rdquo;
                    </div>

                    <div className="text-[11px] text-slate-700 font-mono space-y-1">
                      <div className="text-emerald-700 font-bold mb-1">🌍 Global Line ID Sıralı Üst 7 Sıra Oranları:</div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <div className="p-1.5 rounded bg-emerald-50 border border-emerald-500/20 flex justify-between">
                          <span>1. Üst Sıra:</span> <strong className="text-emerald-700">%1.50</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-50 border border-emerald-500/20 flex justify-between">
                          <span>2. Üst Sıra:</span> <strong className="text-emerald-700">%1.00</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-50 border border-emerald-500/20 flex justify-between">
                          <span>3. Üst Sıra:</span> <strong className="text-emerald-700">%0.80</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-50 border border-emerald-500/20 flex justify-between">
                          <span>4. Üst Sıra:</span> <strong className="text-emerald-700">%0.60</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-50 border border-emerald-500/20 flex justify-between">
                          <span>5. Üst Sıra:</span> <strong className="text-emerald-700">%0.50</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-50 border border-emerald-500/20 flex justify-between">
                          <span>6. Üst Sıra:</span> <strong className="text-emerald-700">%0.30</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-50 border border-emerald-500/20 flex justify-between col-span-2">
                          <span>7. Üst Sıra:</span> <strong className="text-emerald-700">%0.30</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-500/30 text-[10px] text-emerald-700 font-mono">
                    🛡️ Havuz Güvencesi: Üst sırada aktif üye yoksa tutar POOL_TRANSFER_NO_UPLINE ile havuza aktarılır.
                  </div>
                </div>
              </div>

              {/* 7 Revenue Streams Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div className="p-5 rounded-2xl bg-white/80 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 text-[10px] font-black border border-amber-500/30">
                      1. GELİR KAPISI
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">1. Danışan Seans Başı %1000'e Varan Perakende Kâr</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    14 kademeli seans kredi paketlerinde birim seans maliyetiniz <strong>$1.00</strong> olarak sabitlenirken, danışanlarınıza uygulayacağınız seansları <strong>$30 – $70</strong> arasında ücretlendirerek doğrudan perakende kâr sağlarsınız.
                  </p>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-500/30 text-[11px] font-bold text-amber-700">
                    Örn: 30 Seans x $30 = $905 Aylık Seans Geliri
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-700">
                      <Percent className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 text-[10px] font-black border border-emerald-500/30">
                      2. GELİR KAPISI (%20)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">2. %20 Direkt Sponsor Satış Primi</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kendi özel referans kodunuzla davet ettiğiniz her yeni bayi veya üyenin satın aldığı tüm paketlerden <strong>nominal %20 direkt sponsor oranı</strong> hesaplanabilir; hak ediş ve kullanılabilir bakiye sipariş, hesap ve sistem kurallarına bağlıdır.
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-500/30 text-[11px] font-bold text-emerald-700">
                    Örnek hesap: $603 x %20 = yaklaşık $121 brüt nominal komisyon; ödeme garantisi değildir.
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-indigo-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-700">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 text-[10px] font-black border border-indigo-500/30">
                      MOTOR 1 (%25)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">3. Motor 1: Sponsorlu Unilevel 7 Derinlik (%25)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kendi kurduğunuz dikey organizasyonun 7 derinliğine kadar gerçekleşen tüm paket alışverişlerinden kademeli olarak <strong>%7, %5, %4, %3, %2, %2, %2</strong> oranında liderlik ekip kazancı sağlar.
                  </p>
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-500/30 text-[11px] font-bold text-indigo-700">
                    1. Derinlik %7 · 2. Derinlik %5 · 3. Derinlik %4 · 4. %3 · 5-7. %2
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-teal-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-700">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-700 text-[10px] font-black border border-teal-500/30">
                      MOTOR 2 (%5)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">4. Motor 2: Küresel Monoline Sıra Teşviki (%5)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sponsorluk bağından bağımsız olarak dünyada sisteme giren her siparişte, sipariş veren üyenin arkasındaki ilk 7 üst sıraya <strong>%1.50, %1.00, %0.80, %0.60, %0.50, %0.30, %0.30</strong> sembolik sıra teşviki ödenir.
                  </p>
                  <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-500/30 text-[11px] font-bold text-teal-700">
                    1. Sıra %1.50 · 2. %1.00 · 3. %0.80 · 4. %0.60 · 5. %0.50 · 6-7. %0.30
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-700">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 text-[10px] font-black border border-purple-500/30">
                      5. GELİR KAPISI (%5 FON)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">5. 7 Nefis Kariyer Havuzu &amp; Cüzdan Bonusları</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sistem, yapılandırılmış oranları ve kariyer koşullarını kullanarak komisyon/havuz hesaplamaları sunar. Gerçek hak ediş, kullanılabilir bakiye veya ödeme bu ekrandaki simülasyonla garanti edilmez; güncel kurallar panelden doğrulanmalıdır.
                  </p>
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-500/30 text-[11px] font-bold text-purple-700">
                    Kariyer ve aktiflik koşullarına bağlı hesaplama; garanti edilmiş gelir değildir
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-700">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 text-[10px] font-black border border-indigo-500/30">
                      5. GELİR KAPISI (%20 MATCHING)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">5. Liderlik Eşleşme Bonusu (Matching %20)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kodda liderlik eşleşmesi için kariyer seviyesine göre oranlar tanımlıdır. Hak ediş ve cüzdanda kullanılabilir bakiye; sistem koşulları ve onaylı işlemlere bağlıdır.
                  </p>
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-500/30 text-[11px] font-bold text-indigo-700">
                    1. Nesil %10 (Mülhime+) · 2. Nesil %5 (Râzıye+) · 3. Nesil %5 (Mardıyye+)
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-700">
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 text-[10px] font-black border border-emerald-500/30">
                      6. ÖRNEK BONUS SENARYOSU
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">6. &ldquo;3 Getir Bedavaya Getir&rdquo; Fast-ROI İkramiyesi</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Simülatör, belirli kullanıcı girdileriyle bu örnek bonus senaryosunu hesaplar. Gerçek hak ediş; onaylı sipariş, aktiflik, kariyer ve güncel kurallara bağlıdır; paket maliyetinin geri kazanılacağı veya ödeme yapılacağı garanti edilmez.
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-500/30 text-[11px] font-bold text-emerald-700">
                    Varsayımsal hesaplama; gelir ve iade garantisi değildir
                  </div>
                </div>

              </div>

              {/* 7 Nefis Mertebesi Career Matrix Table */}
              <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>7 Nefis Mertebesi Kariyer, Derinlik Kilidi &amp; Havuz Payı Matrisi</span>
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Kişisel aktiflik durumu, direkt aktif referans sayısı ve PGV ciroya göre açılan Çift Motorlu (Unilevel 7 Derinlik + Monoline) derinlikleri ve liderlik havuz fonu oranları:
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-600">
                        <th className="py-2.5 pr-3">Kariyer</th>
                        <th className="py-2.5 px-3">Nefis Mertebesi</th>
                        <th className="py-2.5 px-3">Kişisel Şart</th>
                        <th className="py-2.5 px-3">Direkt Referans</th>
                        <th className="py-2.5 px-3">Açılan Derinlik</th>
                        <th className="py-2.5 pl-3 text-right">Kariyer Havuz Payı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {CAREER_TIERS.map((tier) => {
                        const depthRule = MONOLINE_DEPTH_RATES.find((d) => d.depth === tier.unlockedDepth);
                        return (
                          <tr key={tier.level} className="hover:bg-slate-50/60">
                            <td className="py-2.5 pr-3 font-mono font-bold text-amber-700">{tier.label}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{tier.title}</div>
                              <div className="text-[10px] text-slate-500">{tier.meaning}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{tier.minPackageLabel}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{tier.minActiveDirects} Aktif Üye</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
                              {tier.unlockedDepth}. Derinlik (%{depthRule?.percentage})
                            </td>
                            <td className="py-2.5 pl-3 text-right font-mono font-bold text-amber-700">
                              {tier.poolBonusLabel}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-slate-50 border border-amber-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 text-[10px] font-black border border-amber-500/40">
                      ESNEK AKTİFLİK ("VEYA" KURALI)
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-700">Zorunlu Alım Yok</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Esnek Aktiflik Şartı</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>Her ay zorunlu paket satın alma şartı kaldırılmıştır!</strong> Bayi her ay ya kendi için 1 adet paket satın alır <span className="text-amber-700 font-bold">VEYA</span> o ay içinde sadece 1 yeni direkt üye kaydederek aktifliğini ücretsiz korur.
                  </p>
                </div>

              </div>

              {/* Navigation CTA */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Kazancınızı İnteraktif Simülatörde Canlı Test Edin</h4>
                  <p className="text-xs text-slate-600">Danışan seans sayısı, direkt referans ve organizasyon hacminize göre tahmini net kazancınızı hesaplayın.</p>
                </div>
                <button
                  onClick={() => setActiveSection('simulator')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Gelir Simülatörünü Aç</span>
                </button>
              </div>

            </div>
          )}

          {/* SECTION 3: 6 ADIMLI SÜREÇ & KULLANIM REHBERİ */}
          {activeSection === 'how_to_use' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-50 via-white to-slate-50 border border-teal-500/40 shadow-xl space-y-2">
                <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>Uygulama ve Bayi Paneli Kullanım Özeti</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Kayıttan uygulama raporuna ve bayi paneline 6 adım
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Bu özet, Wellness özelliklerini ve bayi panelindeki temel akışları açıklar. Ekranlarda sunulan içerikler tıbbi hizmet değildir; ödeme, komisyon ve çekim durumlarını ilgili panelden ayrıca doğrulayın.
                </p>
              </div>

              {/* Step by Step Timeline */}
              <div className="space-y-3.5">
                
                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 flex items-start gap-4 hover:border-emerald-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-base flex items-center justify-center border border-emerald-500/40 shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">Referans Kodu İle Kaydolun &amp; Küresel Tek Hatta (Monoline) Yerleşin</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sponsor bayinizin referans linki ile kaydolarak hesabınızı açın. Kayıt sırasında yönlendirme ve ağ yerleşimi, uygulamadaki güncel kayıt akışında gösterilen kurallara göre yapılır; sonuç veya komisyon garantisi verilmez.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 flex items-start gap-4 hover:border-amber-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 font-black text-base flex items-center justify-center border border-amber-500/40 shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{packageCount} katalog paketini inceleyin</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Bayi Back-Office içindeki paket kataloğunda fiyatı ve kredi miktarını kontrol edin. Kart ödeme sağlayıcısı varsayılan olarak sandbox test ortamıdır; canlı ödeme yöntemi bağlı olmayabilir. Kredi, yalnızca sunucuda onaylanan siparişe göre işlenir.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 flex items-start gap-4 hover:border-teal-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 font-black text-base flex items-center justify-center border border-teal-500/40 shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">Canlı Optik Spektrometre, 10s Akustik Ses &amp; Akıllı Saat Taraması Başlatın</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      İzin verirseniz kamera ve mikrofon özelliklerini deneyin; uyumlu tarayıcı ve Bluetooth cihazında nabız verisi görüntülenebilir. Renk, ses ve rapor çıktıları uygulama içi görselleştirmelerdir; çakra, letaif, stres veya sağlık durumu ölçümü değildir.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 flex items-start gap-4 hover:border-indigo-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 font-black text-base flex items-center justify-center border border-indigo-500/40 shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">Kütüphanedeki içerikleri keşfedin</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Şifa ve ses kütüphanesindeki kategorileri inceleyip sunulan dinleme seçeneklerini kullanın. İçerikler tedavi protokolü değildir; kredi kullanımı ve varsa ücret paneldeki güncel koşullara bağlıdır.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 flex items-start gap-4 hover:border-purple-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 font-black text-base flex items-center justify-center border border-purple-500/40 shrink-0">
                    5
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">11 bölümlü uygulama raporunu inceleyin</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tarama ekranındaki 11 bölümlü uygulama raporunu açılır listeden inceleyin ve PDF dışa aktarma seçeneğini kullanın. Paranormal enerji/varlık ölçümü yapılmaz; rapor bu konuda sonuç üretmez. Rapor kamera girdisinden üretilen uygulama içi görsellerdir; hücresel değişim veya klinik sonuç ölçmez.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 flex items-start gap-4 hover:border-cyan-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 font-black text-base flex items-center justify-center border border-cyan-500/40 shrink-0">
                    6
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">Bayi Back-Office'ten Monoline Ağacınızı ve Cüzdanınızı Yönetin</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Bayi Back-Office ekranında ağ, sipariş, kariyer ve cüzdan bilgilerinizi inceleyin. Çekim talebi oluşturulabilmesi ve banka transferinin gerçekleşmesi ayrı adımlardır; onay, ödemenin bankaya gönderildiğini tek başına göstermez.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SECTION 4: GELİŞMİŞ ÇOKLU GELİR SİMÜLATÖRÜ & YATIRIM ROI */}
          {activeSection === 'simulator' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-500/40 shadow-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                  <Calculator className="w-4 h-4" />
                  <span>Çok Boyutlu Finansal Kazanç &amp; Amortisman (ROI) Hesaplayıcı</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Danışan Seansı + %20 Direkt Sponsor + %25 Monoline + %5 Sistem Fonu + Ekstra Prim Simülatörü
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Uyguladığınız danışan seansları, direkt davet ettiğiniz üyeler, küresel tek hat (Monoline) siparişleri ve Nefis kariyer mertebenize göre aylık net gelirinizi ve yatırım geri dönüş (ROI) sürenizi canlı simüle edin.
                </p>
              </div>

              {/* Sliders and Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">1. Aylık Danışan Seansı Sayısı:</span>
                      <span className="text-emerald-400 font-mono text-sm">{calcClientsPerMonth} Seans / Ay</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="250"
                      step="5"
                      value={calcClientsPerMonth}
                      onChange={(e) => setCalcClientsPerMonth(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-850">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">2. Seans Başı Danışan Ücreti (USD):</span>
                      <span className="text-amber-700 font-mono text-sm">{formatUsd(calcPricePerSession, 2)}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="250"
                      step="5"
                      value={calcPricePerSession}
                      onChange={(e) => setCalcPricePerSession(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-850">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">3. Direkt Referans Olunan Bayi/Üye (Ayda):</span>
                      <span className="text-indigo-700 font-mono text-sm">{calcReferredMembers} Direkt Satış</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={calcReferredMembers}
                      onChange={(e) => setCalcReferredMembers(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-850">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">4. Küresel Tek Hat (Monoline) Alt Sıra Siparişi:</span>
                      <span className="text-teal-700 font-mono text-sm">{calcMonolineTeamOrders} Sipariş / Ay</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="1"
                      value={calcMonolineTeamOrders}
                      onChange={(e) => setCalcMonolineTeamOrders(Number(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Ortalama Paket Fiyatı:</label>
                      <select
                        value={calcAvgPackagePrice}
                        onChange={(e) => setCalcAvgPackagePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 outline-none"
                      >
                        {FREKANS_PACKAGES.map((pkg) => (
                          <option key={pkg.id} value={pkg.defaultPrice}>
                            {pkg.name} ({formatUsd(pkg.defaultPrice)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Nefis Kariyer Mertebeniz:</label>
                      <select
                        value={calcCareerLevel}
                        onChange={(e) => setCalcCareerLevel(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 outline-none"
                      >
                        {CAREER_TIERS.map((tier) => (
                          <option key={tier.level} value={tier.level}>
                            {tier.label}: {tier.title} ({tier.unlockedDepth} Derinlik)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bonus Toggles */}
                  <div className="pt-2 border-t border-slate-850 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 block">Ekstra Liderlik ve Hızlı Başlangıç Primleri:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={includeMatchingBonus}
                          onChange={(e) => setIncludeMatchingBonus(e.target.checked)}
                          className="accent-purple-500 rounded"
                        />
                        <span className="text-purple-700 font-semibold text-[11px]">Matching (%20)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={includeFastRoi}
                          onChange={(e) => setIncludeFastRoi(e.target.checked)}
                          className="accent-emerald-500 rounded"
                        />
                        <span className="text-emerald-700 font-semibold text-[11px]">Fast-ROI (+%15)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Calculation Output Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50 border border-emerald-500/50 flex flex-col justify-between space-y-4 shadow-xl">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs text-slate-600">Danışan Seans Cirosu ({calcClientsPerMonth} Seans):</span>
                      <span className="text-xs font-mono font-bold text-slate-800">{formatUsd(monthlySessionRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs text-slate-600">{selectedCalculatorPackage.name} Birim Kredi Maliyeti ({formatUsd(unitSessionCost, 2)}/Seans):</span>
                      <span className="text-xs font-mono font-bold text-rose-400">-{formatUsd(monthlySessionCost)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs text-emerald-400 font-bold">1. Danışan Seans Net Kârı:</span>
                      <span className="text-sm font-mono font-black text-emerald-400">+{formatUsd(monthlySessionProfit)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs text-indigo-700 font-bold">2. %20 Direkt Sponsor Primi:</span>
                      <span className="text-sm font-mono font-black text-indigo-700">+{formatUsd(monthlyDirectSponsorCommission)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs text-teal-700 font-bold">
                        3. Monoline Tek Hat Primi ({calcCareerLevel} Derinlik):
                      </span>
                      <span className="text-sm font-mono font-black text-teal-700">+{formatUsd(monthlyMonolineCommission)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs text-amber-700 font-bold">
                        4. {selectedCareerTier.title} Kariyer Havuz Payı:
                      </span>
                      <span className="text-sm font-mono font-black text-amber-700">+{formatUsd(monthlyCareerPoolBonus)}</span>
                    </div>
                    {monthlyMatchingBonus > 0 && (
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs text-purple-700 font-bold">
                          5. Liderlik Eşleşme (Matching %{Math.round(matchingRate * 100)}):
                        </span>
                        <span className="text-sm font-mono font-black text-purple-700">+{formatUsd(monthlyMatchingBonus)}</span>
                      </div>
                    )}
                    {monthlyFastRoiBonus > 0 && (
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs text-emerald-700 font-bold">
                          6. Fast-ROI Hızlı İkramiye (+%15):
                        </span>
                        <span className="text-sm font-mono font-black text-emerald-700">+{formatUsd(monthlyFastRoiBonus)}</span>
                      </div>
                    )}
                  </div>

                  {/* Highlighted Results Box */}
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-500/60 space-y-2 text-center shadow-lg">
                    <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                      Tahmini Toplam Aylık Net Gelir
                    </div>
                    <div className="text-3xl font-black text-slate-900 font-mono">
                      {formatUsd(totalMonthlyEarnings)}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] text-emerald-800/90 font-mono">
                      <span>Yıllık: <strong>{formatUsd(yearlyProjectedEarnings)}</strong></span>
                      <span>·</span>
                      <span className="text-amber-700 font-bold">
                        Yatırım Geri Dönüş (ROI): ~{estimatedRoiDays} Günde Amorti!
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveSection('packages')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>{packageCount} Resmi Bayi Paketini İncele &amp; Başla</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* SECTION 5: RESMİ BAYİLİK KREDİ PAKETİ KATALOĞU */}
          {activeSection === 'packages' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50 via-white to-slate-50 border border-purple-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-700 text-xs font-bold uppercase tracking-wider">
                    <Coins className="w-4 h-4" />
                    <span>Bayi seans kredisi ve Monoline paketleri</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {minPackageCredits.toLocaleString('tr-TR')} Seans Kredisinden {maxPackageCredits.toLocaleString('tr-TR')} Seans Kredisine {packageCount} Resmi Paket
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
                    Paket satın alındığında katalogda belirtilen seans kredileri havuzunuza yüklenir. Paket alımında katalog fiyatı ve kredi miktarı esas alınır; sabit ek kredi bonusu uygulanmaz. Komisyon ve diğer ödüller ilgili sistem kurallarına göre hesaplanır.
                  </p>
                </div>

                {/* Filter Selector */}
                <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPkgCatalogFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      pkgCatalogFilter === 'ALL'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Tüm {packageCount} Paket
                  </button>
                  <button
                    type="button"
                    onClick={() => setPkgCatalogFilter('STARTER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      pkgCatalogFilter === 'STARTER'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Başlangıç
                  </button>
                  <button
                    type="button"
                    onClick={() => setPkgCatalogFilter('CLINIC')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      pkgCatalogFilter === 'CLINIC'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Klinik &amp; Terapist
                  </button>
                  <button
                    type="button"
                    onClick={() => setPkgCatalogFilter('ENTERPRISE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      pkgCatalogFilter === 'ENTERPRISE'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Kurumsal
                  </button>
                </div>
              </div>

              {/* Package Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPackages.map((pkg) => {
                  const isPopular = pkg.id === 'PKG_ALTIN_DANISMAN' || pkg.id === 'PKG_ALTIN_PRO';
                  const retailPotential = pkg.sessionCredits * 1500;
                  return (
                    <div
                      key={pkg.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between transition-all space-y-4 ${
                        isPopular
                          ? 'bg-gradient-to-b from-white via-slate-50 to-emerald-50 border-emerald-500/70 shadow-xl ring-1 ring-emerald-500/40'
                          : 'bg-white/90 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-amber-700 border border-slate-300">
                            {pkg.badgeCategory}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-500/30">
                            Kademe {pkg.rankOrder}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-900">{pkg.name}</h4>
                          <div className="text-xs text-emerald-400 font-bold mt-0.5 font-mono flex items-center justify-between">
                            <span>{pkg.sessionCreditsLabel}</span>
                            <span className="text-slate-600 text-[11px]">({pkg.perSessionCostLabel})</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 space-y-1">
                          <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-black text-slate-900 font-mono">
                              {formatUsd(pkg.defaultPrice)}
                            </div>
                            <div className="text-[10px] font-mono text-indigo-700">
                              Sponsor Primi: {formatUsd(pkg.defaultPrice * 0.2)}
                            </div>
                          </div>
                          <div className="text-[10px] text-amber-700 font-mono">
                            Perakende Seans Gelir Potansiyeli: ~{formatUsd(retailPotential)}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {pkg.shortDescription || pkg.description}
                        </p>

                        <ul className="space-y-1 pt-1 text-xs text-slate-700">
                          {(pkg.features || pkg.includedFeatures || []).slice(0, 3).map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-[11px]">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenResellerModal) {
                            onOpenResellerModal('packages');
                          } else {
                            void handleDealerRegistration();
                          }
                        }}
                        className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                          isPopular
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Paketi Seç / Kredi Yükle</span>
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* SECTION 6: YASAL UYUM, FİNANS VE TIBBİ GÜVENLİK STANDARTLARI */}
          {activeSection === 'compliance' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-50 via-white to-slate-50 border border-cyan-500/40 shadow-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-700 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ödeme, veri ve sağlık beyanlarının kapsamı</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Test ödeme ortamı, CSV banka içe aktarımı ve ürün sınırları
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Bu sunum yasal uygunluk, lisans, sertifikasyon veya canlı banka bağlantısını doğrulamaz. Ödeme sağlayıcısı ve mevzuat gereklilikleri canlıya geçmeden önce yetkili uzmanlarca ayrıca teyit edilmelidir.
                </p>
              </div>

              {/* 6 Core Legal & Compliance Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span>1. Kart ödeme sağlayıcısı</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kodda varsayılan sağlayıcı sandbox test sağlayıcısıdır; canlı POS, PCI-DSS sertifikasyonu veya BDDK/TCMB uygunluğu bu belgede doğrulanmamıştır. Canlı ödeme yöntemi ve durumu satın alma ekranında kontrol edilmelidir.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                      <Scale className="w-4 h-4" />
                    </div>
                    <span>2. 4'lü Yasal Sözleşme Paketi (Zaman Damgalı Onay)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Her alışverişte; <strong>Ön Bilgilendirme Formu</strong>, <strong>Mesafeli Satış Sözleşmesi</strong>, <strong>KVKK Açık Rıza ve Aydınlatma Metni</strong> ve <strong>MLM Bayilik Şartları</strong> kullanıcının IP adresi ve zaman damgasıyla kayıt altına alınır.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span>3. 14 Günlük Yasal Cayma Hakkı Blokesi (Pending Balance)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    6502 sayılı Tüketicinin Korunması Hakkında Kanun gereğince oluşturulan 14 günlük yasal cayma süresi boyunca oluşan komisyonlar &ldquo;Bekleyen Bakiye&rdquo; havuzunda güvende tutulur; iptal ve iadelerde Clawback mekanizması işletilir.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span>4. Çekim talebi ve banka mutabakatı</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Yönetici çekim onayı ile gerçek banka transferi ayrı durumlardır. Banka çıkışı, dekont veya payout referansı ile ayrıca teyit edilmelidir; bu sunum bir ödeme taahhüdü değildir.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span>5. %100 USD Bazlı Şeffaf Cüzdan ve Küresel Çekim Güvencesi</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Panelde gösterilen cüzdan para birimi, çekilebilir bakiye ve kur bilgisi işlem anındaki kayıtlara bağlıdır. Çekim onayı banka transferinin gerçekleştiği anlamına gelmez; banka çıkışı ayrıca doğrulanmalıdır.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-teal-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/40">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <span>6. Tıbbi kullanım sınırı</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bu uygulama tıbbi cihaz olarak doğrulanmamıştır. Kamera, ses, Bluetooth ve rapor görselleri tanı, tedavi veya klinik ölçüm yerine kullanılmamalıdır. Sağlık kararları için sağlık uzmanına başvurun.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* SECTION 7: ÖZEL REFERANSLI PAYLAŞIM, QR KOD VE RESMİ BELGELER */}
          {activeSection === 'share' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-500/50 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  <Share2 className="w-4 h-4" />
                  <span>Referans bağlantısı, QR kod ve belge indirme</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  WhatsApp ve sosyal ağlarda paylaşın • QR kod gösterin • Word ve PDF indirin
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
                  Paylaşım bağlantısı referans kodunu içerebilir. Kayıt, sipariş, komisyon hak edişi ve ödeme ilgili sistem koşullarına bağlıdır; her işlem için gelir garantisi verilmez.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Link, Code and QR Code Card */}
                <div className="p-5 rounded-2xl bg-white/90 border border-emerald-500/40 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Özel Sunum &amp; Katalog Bağlantınız:</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px]">Canlı Link</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={fullShareUrl}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-emerald-700 font-mono outline-none select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>
                  </div>

                  {/* QR Code and Code Details */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    {qrDataUrl && (
                      <div className="p-2 bg-white rounded-2xl shadow-lg border border-emerald-500/30 shrink-0">
                        <img src={qrDataUrl} alt="Bayi QR Kodu" className="w-32 h-32 object-contain" />
                      </div>
                    )}
                    <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                      <div className="text-[11px] text-slate-600 font-bold uppercase">Bayi / Referans Kodunuz</div>
                      <div className="text-base font-black font-mono text-emerald-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-emerald-500/30 inline-block">
                        {activeReferralCode}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Danışanlarınız telefon kameralarıyla bu QR kodu tarayarak doğrudan sizin yetkili sayfanıza erişebilir.
                      </p>
                      <button
                        onClick={handleCopyCode}
                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{copiedCode ? 'Kod Kopyalandı' : 'Kodu Kopyala'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Social Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block">Sosyal Ağlarda Paylaşın:</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href={waShareLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950 transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={tgShareLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-950 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        <span>Telegram</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Official Documents Download Card */}
                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>İş sunumu, katalog ve teknik raporu indir</span>
                      </div>
                                          </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Uygulama özellikleri, {packageCount} frekans paketi ve gelir modeli varsayımlarının özetlendiği Word uyumlu (.doc) veya PDF çıktısını indirebilirsiniz. Bu belgeler yasal uygunluk, sağlık etkisi ya da kazanç garantisi değildir.
                    </p>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1.5">
                      <div className="font-bold text-emerald-700">Belge İçeriği:</div>
                      <div>• Uygulama özellikleri, 11 bölümlü tarama raporu ve paranormal ölçüm sınırı</div>
                      <div>• {TOTAL_HEALING_COUNT} ses/frekans içeriği ve tematik kategoriler</div>
                      <div>• {packageCount} frekans paketi ve katalogdaki fiyat/kredi bilgileri</div>
                      <div>• Komisyon oranları ve örnek hesaplama varsayımları</div>
                      <div>• Sandbox ödeme sağlayıcısı ve banka içe aktarma sınırları</div>
                      <div>• Tıbbi, finansal ve mevzuat doğrulama uyarıları</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => downloadTechnicalReportWord()}
                        className="py-2.5 px-3 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Word (.doc) İndir</span>
                      </button>
                      <button
                        onClick={() => downloadTechnicalReportPDF()}
                        className="py-2.5 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Olarak İndir</span>
                      </button>
                    </div>

                    {onOpenDealerBusinessCard && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenDealerBusinessCard();
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-700 text-amber-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-amber-500/30 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bayi Dijital Kartvizitini Aç</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-7">
          <button type="button" aria-label="Önceki slayt" onClick={() => moveSlide(-1)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-800 transition hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Önceki slayt</span>
          </button>
          <div className="flex flex-1 items-center justify-center gap-1.5">
            {PRESENTATION_SLIDES.map((slide, index) => (
              <button key={slide} type="button" aria-label={`${index + 1}. slayta git`} aria-current={activeSlideIndex === index ? 'step' : undefined} onClick={() => setActiveSection(slide)} className={`h-1.5 rounded-full transition-all ${activeSlideIndex === index ? 'w-8 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-500'}`} />
            ))}
          </div>
          <button type="button" aria-label="Sonraki slayt" onClick={() => moveSlide(1)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-500/20">
            <span className="hidden sm:inline">Sonraki slayt</span><ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Bottom Footer Bar with Quick Action CTAs */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AuraBio Frekans • Wellness ve bayi araçları</span>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleDealerRegistration()}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black shadow-md shadow-amber-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Bayilik Başvurusu Yap</span>
              </button>

              <button
                onClick={() => void handleDealerRegistration()}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hemen Bayi Kaydı Başlat</span>
              </button>
            </div>
            {registrationError && <p role="alert" className="text-xs font-semibold text-rose-700">{registrationError}</p>}
          </div>
        </div>

      </div>
    </div>
  );
};
