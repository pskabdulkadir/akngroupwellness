import React, { useState, useEffect } from 'react';
import { formatUsd } from '../utils/currency';
import QRCode from 'qrcode';
import { 
  X, 
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
  Sliders,
  ChevronRight
} from 'lucide-react';
import { UserMember } from '../utils/authManager';
import { 
  Reseller, 
  DealerPackage, 
  getDealerPackages, 
  getActiveResellerSession, 
  getStoredReferralCode, 
  setStoredReferralCode, 
  getResellerByCode, 
  detectAndSaveReferralCodeFromUrl 
} from '../utils/resellerManager';
import { CAREER_TIERS, FREKANS_PACKAGES, MONOLINE_DEPTH_RATES } from '../types/monoline';
import { downloadTechnicalReportWord, downloadTechnicalReportPDF } from '../utils/technicalReportExport';

interface BusinessPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserMember | null;
  onOpenAuthModal?: (mode?: 'login' | 'register' | 'dealer') => void;
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
  const [activeReseller, setActiveReseller] = useState<Reseller | null>(() => getActiveResellerSession());
  const [referredDealerInfo, setReferredDealerInfo] = useState<Reseller | null>(null);
  const [dealerPackages, setDealerPackages] = useState<DealerPackage[]>(() => getDealerPackages());
  const [pkgCatalogFilter, setPkgCatalogFilter] = useState<'ALL_15' | 'STARTER' | 'CLINIC' | 'ENTERPRISE' | 'STARTER_3'>('ALL_15');
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
  const [includeInfinityBonus, setIncludeInfinityBonus] = useState<boolean>(true);

  // Active Referral Code Determination
  const activeReferralCode = activeReseller?.referralCode 
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

  // WhatsApp Share Message
  const waShareText = encodeURIComponent(
    `🌟 AuraBio Kuantum Biyo-Rezonans & Monoline 7 Nefis MLM İş Sunum Raporu (v6.0 Enterprise)\n\n` +
    `Canlı optik & 3D biyo-aura spektrometresi, 10s vokal biyo-akustik analiz, Web BLE akıllı saat nabız köprüsü, 302+ kadim şifa frekansı, 50+ hastalık ansiklopedisi, MindSpace Studio, 14 resmi bayilik kredi paketi ve %20 Direkt Sponsor + %25 Monoline 7 Derinlik Tek Hat + %5 Sistem / Kariyer Fonu gelir modelini inceleyin:\n\n` +
    `📊 Resmi Dijital Katalog & İnteraktif İş Sunumu:\n${fullShareUrl}\n\n` +
    `🎁 Yetkili Bayi Referans Kodu: ${activeReferralCode}`
  );
  const waShareLink = `https://wa.me/?text=${waShareText}`;

  // Telegram Share Link
  const tgShareLink = `https://t.me/share/url?url=${encodeURIComponent(fullShareUrl)}&text=${encodeURIComponent('AuraBio Frekans & Monoline 7 Nefis MLM Dijital İş Sunumu ve Tanıtım Kataloğu (v6.0 Enterprise)')}`;

  // Multi-Way Earnings Calculations (v6.0 Enterprise)
  const unitSessionCost = 100; // Ortalama birim seans maliyeti (~Altın Pro Paket seviyesi)
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

  // Unilevel Infinity differential bonus (%1 - %7 on deep downline)
  const infinityRate = calcCareerLevel * 0.01;
  const monthlyInfinityBonus = includeInfinityBonus && calcCareerLevel >= 2
    ? Math.round(calcMonolineTeamOrders * calcAvgPackagePrice * infinityRate * 0.3)
    : 0;

  const totalMonthlyEarnings =
    monthlySessionProfit +
    monthlyDirectSponsorCommission +
    monthlyMonolineCommission +
    monthlyCareerPoolBonus +
    monthlyMatchingBonus +
    monthlyFastRoiBonus +
    monthlyInfinityBonus;

  const yearlyProjectedEarnings = totalMonthlyEarnings * 12;

  // ROI Payback Calculation
  const dailyEarnings = totalMonthlyEarnings / 30;
  const estimatedRoiDays = dailyEarnings > 0 ? Math.max(1, Math.round(calcAvgPackagePrice / dailyEarnings)) : 30;

  // Filtered packages
  const filteredPackages = FREKANS_PACKAGES.filter((pkg) => {
    if (pkgCatalogFilter === 'ALL_15') return true;
    if (pkgCatalogFilter === 'STARTER') return pkg.defaultPrice <= 20000;
    if (pkgCatalogFilter === 'CLINIC') return pkg.defaultPrice > 20000 && pkg.defaultPrice <= 100000;
    if (pkgCatalogFilter === 'ENTERPRISE') return pkg.defaultPrice > 100000;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shadow-inner">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-[11px] border border-emerald-500/30 tracking-wider">
                  AuraBio Frekans v6.0 Enterprise
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/40">
                  Resmi İş Sunum Raporu &amp; Dijital Tanıtım Kataloğu
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                  15 Kredi Paketi · Monoline 7 Nefis MLM
                </span>
                {activeReferralCode && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Ref: {activeReferralCode}</span>
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 mt-1">
                Kuantum Biyo-Rezonans, 16 Bütüncül Teknoloji, 15 Bayi Paketi &amp; Monoline 7 Nefis MLM Kataloğu
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
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
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Listeli Butonlar Navigasyon Paneli (1..7 Sıralı Liste) */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/95 border-b border-slate-800/90 shrink-0">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 text-xs">
            <span className="font-extrabold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>İş Sunum Raporu &amp; Dijital Katalog Bölümleri (1 - 7)</span>
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              İncelemek istediğiniz konuya tıklayarak doğrudan ilgili bölüme geçebilirsiniz
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
            {[
              {
                id: 'what_it_is' as TabSection,
                num: '1',
                title: '1. 16 Bütüncül Teknoloji & Modül',
                short: '16 Bütüncül Modül',
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
                title: '5. 14 Resmi Bayilik Paketi',
                short: '14 Bayilik Paketi',
                icon: Coins,
                color: 'purple',
              },
              {
                id: 'compliance' as TabSection,
                num: '6',
                title: '6. Yasal Uyum & Güvenlik Standartları',
                short: 'Yasal Uyum & Standartlar',
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
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between sm:flex-col sm:items-start gap-1.5 cursor-pointer text-xs ${
                    isActive
                      ? 'bg-gradient-to-r sm:bg-gradient-to-b from-amber-950/80 via-slate-900 to-amber-950/60 border-amber-400/90 text-amber-200 shadow-md ring-1 ring-amber-400/40 font-black'
                      : 'bg-slate-900/70 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-700 font-semibold'
                  }`}
                  title={btn.title}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {btn.num}
                    </span>
                    <IconComp
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-amber-300' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate text-[11px] leading-tight">
                      {btn.title}
                    </span>
                  </div>
                  {isActive && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 sm:self-end">
                      Aktif ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6">

          {/* SİZİ DAVET EDEN YETKİLİ BAYİ KARTI (REFERRAL SHOWCASE BANNER) */}
          {referredDealerInfo && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-950 to-indigo-950/90 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/40 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-black text-emerald-400">
                      Sizi Davet Eden Yetkili Bayimiz
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                      Ref Kodu: {referredDealerInfo.referralCode}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2 mt-0.5">
                    <span>{referredDealerInfo.resellerName}</span>
                    <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      Onaylı AKN Bayisi ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Bu dijital katalog üzerinden yapacağınız her üyelik veya paket alımı doğrudan bu bayiye ve Küresel Tek Hat (Monoline) sistemine bağlanır.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
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
                  onClick={() => {
                    setStoredReferralCode(referredDealerInfo.referralCode);
                    onClose();
                    if (onOpenAuthModal) onOpenAuthModal('register');
                  }}
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
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-teal-950/60 border border-emerald-500/40 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Kuantum Biyo-Rezonans, Optik Spektrometre &amp; Akustik Titreşim Mimarisi (v6.0)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  İnsan Enerji Alanlarını Optik, Vokal ve Biyometrik Olarak Tarayan, Dengeleyen ve 8 Sekmeli Raporlayan Tam Donanımlı Klinik Ekosistem
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                  AuraBio Frekans; web kamerası üzerinden canlı foton/PPG analizi, mikrofon üzerinden <strong>10s Öncesi/Sonrası Vokal Biyo-Akustik Spektrometre</strong> ve <strong>Web BLE Akıllı Saat Nabız/HRV Canlı Köprüsü</strong> ile danışanın biyolojik ve enerjetik durumunu ölçer. <strong>302+ Kadim Şifa Frekansı</strong>, <strong>50+ Hastalık Şifa Ansiklopedisi</strong>, <strong>MindSpace Nöro-Akustik Stüdyosu</strong>, <strong>Dinamik Kutsal Geometri Mandala</strong> ve <strong>8 Sekmeli Öncesi/Sonrası Klinik Raporlama</strong> ile danışanlarınıza eşsiz bir deneyim yaşatır.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-emerald-400 font-mono font-black text-lg">16 Modül</div>
                    <div className="text-[10px] text-slate-400">Entegre Biyo-Sistem</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-amber-400 font-mono font-black text-lg">302+ Frekans</div>
                    <div className="text-[10px] text-slate-400">Kadim Şifa Kütüphanesi</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-cyan-400 font-mono font-black text-lg">50+ Hastalık</div>
                    <div className="text-[10px] text-slate-400">Rezonans Ansiklopedisi</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-purple-400 font-mono font-black text-lg">8 Sekmeli</div>
                    <div className="text-[10px] text-slate-400">Ön/Son Klinik Rapor</div>
                  </div>
                </div>
              </div>

              {/* 16 Comprehensive Technology Cards Grouped by Domain */}
              <div className="space-y-4">
                
                {/* Domain 1: Biyometrik Tarama & 3D Spektrometre */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-400 tracking-wider">
                    <HeartPulse className="w-4 h-4" />
                    <span>A. Canlı Biyometrik Tarama &amp; 3D Kuantum Spektrometre</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-emerald-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span>1. Canlı Optik Spektrometre &amp; Biyo-Aura Taraması</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Kamera üzerinden foton ve elektromanyetik renk tayfı analiziyle 7 ana çakra (Kök, Sakral, Solar, Kalp, Boğaz, Alın, Tepe), 7 aura katmanı ve 5 kalp letaifinin enerjetik blokajlarını gerçek zamanlı olarak tarar ve hizalar.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-teal-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-teal-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/40">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span>2. 3D İnteraktif Kuantum Biyo-Aura Simülatörü</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        WebGL / Three.js tabanlı 3D toroidal enerji alanı simülatörü. Danışanın aurik katman kalınlığını, renk polarizasyonunu ve 7 çakrasının dönme yönü ile hızını canlı 360 derece döndürülebilir model üzerinde görselleştirir.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-cyan-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40">
                          <Mic className="w-4 h-4" />
                        </div>
                        <span>3. 10s Ön / Son Vokal Biyo-Akustik &amp; F0 Harmonik Analiz</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Mikrofon üzerinden seans öncesi ve sonrası 10 saniyelik ses kaydı alarak temel vokal frekans (F0) ve harmonik dağılımını ölçer; hücresel rezonans gelişimini somut matematiksel delta (%) değerleriyle raporlar.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-indigo-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40">
                          <Watch className="w-4 h-4" />
                        </div>
                        <span>4. Web BLE Akıllı Saat Nabız &amp; HRV Canlı Köprüsü</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Standart Bluetooth GATT Kalp Hızı Profili (UUID 0x180D) ile Apple Watch, Galaxy Watch, Fitbit ve nabız bantlarından anlık BPM ve HRV okur; taşikardi veya stres anında otomatik frekans yatıştırması devreye girer.
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
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-amber-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
                          <Flame className="w-4 h-4" />
                        </div>
                        <span>5. 302+ Kadim Şifa &amp; Solfejyo Frekans Kütüphanesi</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        99 Esma-ül Hüsna titreşimleri (Ya Şafi 391Hz vb.), 25 Anadolu Sufi Makamı (Rast, Hicaz, Nihavend), Antik Solfejyo (174Hz, 285Hz, 396Hz, 417Hz, 528Hz, 639Hz, 741Hz, 852Hz, 963Hz), Rife, Tesla 3-6-9 ve Nogier rezonansları.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-rose-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-rose-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span>6. 50+ Holistik Hastalık &amp; Patoloji Ansiklopedisi</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Nörolojik, kardiyovasküler, metabolik, psikosomatik, iskelet-kas ve bağışıklık kategorilerinde 50'den fazla rahatsızlık için 3 aşamalı (Detoks, Dengeleme, Hücresel Yenilenme) kanıta dayalı frekans ve meridyen protokolleri.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-purple-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-purple-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <span>7. Sesli &amp; Niyetli Frekans Labirenti (Voice Forge)</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Web Audio API çoklu osilatör mimarisi ile danışanın niyetinin ses tonu üzerinden spektral analizini yapar; Schumann 7.83Hz topraklaması eşliğinde kişiye özel akortlanmış frekans titreşimleri üretir.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-fuchsia-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-fuchsia-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span>8. Dinamik Kutsal Geometri Mandala Jeneratörü</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
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
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-indigo-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40">
                          <Brain className="w-4 h-4" />
                        </div>
                        <span>9. MindSpace Studio &amp; 6-Kanal Nöro-Akustik Mikser</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Binaural vuruşlar, Isochronic tonlar ve 5 beyin dalgası (Delta, Theta, Alpha, Beta, Gamma) eşliğinde; Taşıyıcı Dalga, Okyanus, Yağmur, Tibet Çanağı ve Şömine seslerinden oluşan 6 kanallı kişiselleştirilebilir stüdyo mikseri.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-sky-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-sky-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/40">
                          <Moon className="w-4 h-4" />
                        </div>
                        <span>10. Kadim Arketip Rüya &amp; Bilinçaltı Çözümleyicisi</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Rüya metinlerini Jungiyen arketipler ve kadim Doğu sembolizmi süzgecinde analiz ederek bilinçaltı blokajlarını tespit eder; danışana özel gece psiko-akustik dinleme protokolü önerir.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-amber-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
                          <Sun className="w-4 h-4" />
                        </div>
                        <span>11. 24 Saatlik Sirkadiyen Biyo-Ritim Senkronizatörü</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Geleneksel Çin Tıbbı (TCM) 24 saatlik organ meridyen saatleri ile biyolojik kortizol/melatonin hormon fazlarını eşzamanlayarak günün saatine uygun organ frekanslarını otomatik aktive eder.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-blue-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-blue-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40">
                          <Moon className="w-4 h-4" />
                        </div>
                        <span>12. Gece Uyku &amp; Epifiz Melatonin Protokolü</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Derin NREM uyku fazına geçişi hızlandıran 0.5 - 2.5 Hz Delta vuruşları, epifiz bezi melatonin stimülasyonu ve otomatik kapanma zamanlayıcısı ile gece hücresel yenilenme sağlar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Domain 4: Bütüncül Denge, Grup Şifası & Klinik Raporlama */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-cyan-400 tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>D. Bütüncül Denge, Grup Şifası &amp; Klinik Çıktılar</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-rose-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-rose-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span>13. Acil Durum Hızlı Denge SOS Modu</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Akut panik, anksiyete, taşikardi veya duygu durum krizlerinde tek tıkla 528Hz DNA onarımı ve 7.83Hz Schumann topraklama rezonansını başlatarak danışanın otonom sinir sistemini dakikalar içinde dengeler.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-teal-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-teal-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/40">
                          <Users className="w-4 h-4" />
                        </div>
                        <span>14. Kurumsal &amp; Aile Çemberi (Group Aura Sync)</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Çoklu cihazların QR kod veya sesli senkronizasyonla bağlandığı, grup içi kalp tutarlılığı (Group Coherence Index) üreten kolektif şifa ve meditasyon çemberi.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-emerald-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span>15. Aura Günlüğü &amp; 21 Günlük Dönüşüm Kampları</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Kökten Taç çakraya kadar Sabah (Uyanış), Öğle (Hizalanma) ve Gece (Hücresel Detoks) mikro seanslarıyla yapılandırılmış rehberli 21 günlük program ve bulut ilerleme takip sistemi.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-amber-500/40 transition-all">
                      <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span>16. 8 Sekmeli Klinik Öncesi/Sonrası Rapor &amp; Dünya Haritası</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        İlim Kapı, Çakralar, Letaifler, Aura Katmanları, Vokal Frekans ve Organ Rezonansını içeren 8 sekmeli kapsamlı klinik raporu tek tıkla resmi PDF ve Word olarak hazırlar; Küresel Şifa Isı Haritası ile canlı frekans akışını gösterir.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Funnel */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Monoline 7 Nefis MLM &amp; Bayi Gelir Modelini Keşfedin</h4>
                  <p className="text-xs text-slate-400">Danışan seans kârı, %20 Direkt Sponsor, %25 Monoline Tek Hat ve %5 Sistem / Kariyer Fonu gelirlerini inceleyin.</p>
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
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700"
                  >
                    15 Bayi Paketini İncele
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 2: 7'Lİ GELİR MİMARİSİ & MONOLINE 7 NEFİS MLM */}
          {activeSection === 'earnings' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-emerald-950/60 border border-amber-500/40 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" />
                  <span>Çift Motorlu Hibrit Komisyon Mimarisi &amp; 7 Nefis Mertebesi MLM Kazanç Planı</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Danışan Seans Geliri + %20 Direkt Sponsor + Motor 1: %25 Unilevel (7 Derinlik) + Motor 2: %5 Küresel Sıra Teşviki + %5 Sistem Fonu
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                  Sistemimizin finansal sürdürülebilirliğini sağlamak, çalışan liderleri ödüllendirmek ve pasif üyeleri sistemde tutabilmek amacıyla komisyon altyapısı <strong>Çift Motorlu Hibrit Model</strong> ile güçlendirilmiştir. Bir sipariş gerçekleştiğinde iki bağımsız motor eşzamanlı olarak tetiklenir.
                </p>
              </div>

              {/* SİDE-BY-SİDE ÇİFT MOTORLU HİBRİT MİMARİ GÖRSEL ŞEMASI */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-6 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-xl">
                {/* SOL TARAF: Motor 1 - Sizin Sponsorluğunuzla Genişleyen 7 Derinlikli Sponsorluk Ağacı (Unilevel) */}
                <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-mono font-black border border-indigo-500/40">
                          MOTOR 1
                        </span>
                        <h4 className="text-base font-bold text-white">Ekip Kurma &amp; Liderlik Kazancı</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-400/30">
                        Unilevel 7 Derinlik · Toplam %25
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-900/30 border border-indigo-500/40 text-xs font-medium text-indigo-200 leading-relaxed">
                      &ldquo;Kendi ekibinizi kurun, dikeyde 7 derinliğe kadar oluşan tüm cirodan %25&apos;e varan pay alın! Ne kadar geniş hat açarsanız kazancınız o kadar katlanır.&rdquo;
                    </div>

                    <div className="text-[11px] text-slate-300 font-mono space-y-1">
                      <div className="text-indigo-300 font-bold mb-1">🌿 Sponsor Bağına Dayalı Derinlik Oranları:</div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <div className="p-1.5 rounded bg-indigo-950/60 border border-indigo-500/20 flex justify-between">
                          <span>1. Derinlik (Direkt):</span> <strong className="text-indigo-300">%7</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-950/60 border border-indigo-500/20 flex justify-between">
                          <span>2. Derinlik:</span> <strong className="text-indigo-300">%5</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-950/60 border border-indigo-500/20 flex justify-between">
                          <span>3. Derinlik:</span> <strong className="text-indigo-300">%4</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-950/60 border border-indigo-500/20 flex justify-between">
                          <span>4. Derinlik:</span> <strong className="text-indigo-300">%3</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-950/60 border border-indigo-500/20 flex justify-between">
                          <span>5. Derinlik:</span> <strong className="text-indigo-300">%2</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-950/60 border border-indigo-500/20 flex justify-between">
                          <span>6. Derinlik:</span> <strong className="text-indigo-300">%2</strong>
                        </div>
                        <div className="p-1.5 rounded bg-indigo-950/60 border border-indigo-500/20 flex justify-between col-span-2">
                          <span>7. Derinlik:</span> <strong className="text-indigo-300">%2</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-[10px] text-indigo-300 font-mono">
                    ⚠️ 8. Ebeveyn Kuralı: 8. derinlik ve sonrasına prim aktarılmaz, tarama 7. basamakta durdurulur.
                  </div>
                </div>

                {/* SAĞ TARAF: Motor 2 - Dünya Genelinde Arkadan Gelen Küresel Tek Sıra (Monoline) */}
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-mono font-black border border-emerald-500/40">
                          MOTOR 2
                        </span>
                        <h4 className="text-base font-bold text-white">Küresel Sıra Pasif Teşviki</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-400/30">
                        Monoline Global Line · Toplam %5
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-900/30 border border-emerald-500/40 text-xs font-medium text-emerald-200 leading-relaxed">
                      &ldquo;Sisteme erken dahil olmanın avantajını yaşayın! Arkanızdan gelen küresel sıranın ilk 7 derinliğinden %5&apos;lik havuzdan sembolik teşvik primi kazanın.&rdquo;
                    </div>

                    <div className="text-[11px] text-slate-300 font-mono space-y-1">
                      <div className="text-emerald-300 font-bold mb-1">🌍 Global Line ID Sıralı Üst 7 Sıra Oranları:</div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 flex justify-between">
                          <span>1. Üst Sıra:</span> <strong className="text-emerald-300">%1.50</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 flex justify-between">
                          <span>2. Üst Sıra:</span> <strong className="text-emerald-300">%1.00</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 flex justify-between">
                          <span>3. Üst Sıra:</span> <strong className="text-emerald-300">%0.80</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 flex justify-between">
                          <span>4. Üst Sıra:</span> <strong className="text-emerald-300">%0.60</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 flex justify-between">
                          <span>5. Üst Sıra:</span> <strong className="text-emerald-300">%0.50</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 flex justify-between">
                          <span>6. Üst Sıra:</span> <strong className="text-emerald-300">%0.30</strong>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 flex justify-between col-span-2">
                          <span>7. Üst Sıra:</span> <strong className="text-emerald-300">%0.30</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                    🛡️ Havuz Güvencesi: Üst sırada aktif üye yoksa tutar POOL_TRANSFER_NO_UPLINE ile havuza aktarılır.
                  </div>
                </div>
              </div>

              {/* 7 Revenue Streams Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                      1. GELİR KAPISI
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-100">1. Danışan Seans Başı %1000'e Varan Perakende Kâr</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    15 kademeli seans kredi paketlerinde birim seans maliyetiniz <strong>$1.31 – $3.14</strong> seviyesine düşerken, danışanlarınıza uygulayacağınız seansları <strong>$30 – $70</strong> arasında ücretlendirerek doğrudan perakende kâr sağlarsınız.
                  </p>
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] font-bold text-amber-300">
                    Örn: 30 Seans x $30 = $905 Aylık Seans Geliri
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                      <Percent className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                      2. GELİR KAPISI (%20)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-100">2. %20 Direkt Sponsor Satış Primi</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Kendi özel referans kodunuzla davet ettiğiniz her yeni bayi veya üyenin satın aldığı tüm paketlerden <strong>anında %20 Direkt Sponsor Primi</strong> Sponsor Cüzdanınıza yansır.
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                    Örn: $603 Paket Satışı = Anında $121 Direkt Sponsor Primi
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/30">
                      MOTOR 1 (%25)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-100">3. Motor 1: Sponsorlu Unilevel 7 Derinlik (%25)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Kendi kurduğunuz dikey organizasyonun 7 derinliğine kadar gerçekleşen tüm paket alışverişlerinden kademeli olarak <strong>%7, %5, %4, %3, %2, %2, %2</strong> oranında liderlik ekip kazancı sağlar.
                  </p>
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] font-bold text-indigo-300">
                    1. Derinlik %7 · 2. Derinlik %5 · 3. Derinlik %4 · 4. %3 · 5-7. %2
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-teal-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-black border border-teal-500/30">
                      MOTOR 2 (%5)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-100">4. Motor 2: Küresel Monoline Sıra Teşviki (%5)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sponsorluk bağından bağımsız olarak dünyada sisteme giren her siparişte, sipariş veren üyenin arkasındaki ilk 7 üst sıraya <strong>%1.50, %1.00, %0.80, %0.60, %0.50, %0.30, %0.30</strong> sembolik sıra teşviki ödenir.
                  </p>
                  <div className="p-2.5 rounded-xl bg-teal-950/40 border border-teal-500/30 text-[11px] font-bold text-teal-300">
                    1. Sıra %1.50 · 2. %1.00 · 3. %0.80 · 4. %0.60 · 5. %0.50 · 6-7. %0.30
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/30">
                      5. GELİR KAPISI (%5 FON)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-100">5. 7 Nefis Kariyer Havuzu &amp; Cüzdan Bonusları</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Her siparişin <strong>%5'i Sistem ve Kariyer Fonuna</strong> aktarılır. Nefs-i Emmâre'den Nefs-i Kâmile'ye 7 basamağa ulaşan bayiler havuzdan <strong>%2 ile %10 arasında ek kâr payı</strong> ve cüzdana nakit bonuslar kazanır.
                  </p>
                  <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] font-bold text-purple-300">
                    7 Nefis Mertebesi Havuz Payı (%2 – %10) · Anlık Nakit Bonuslar
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/30">
                      5. GELİR KAPISI (%20 MATCHING)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-100">5. Liderlik Eşleşme Bonusu (Matching %20)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Alt ekibinizde yetiştirdiğiniz liderlerin kazançları üzerinden <strong>1. Nesil %10</strong>, <strong>2. Nesil %5</strong> ve <strong>3. Nesil %5</strong> olmak üzere toplamda %20 Liderlik Eşleşme Bonusu doğrudan cüzdanınıza yansır.
                  </p>
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] font-bold text-indigo-300">
                    1. Nesil %10 (Mülhime+) · 2. Nesil %5 (Râzıye+) · 3. Nesil %5 (Mardıyye+)
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                      6. FAST-ROI (%75 İADE)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-100">6. &ldquo;3 Getir Bedavaya Getir&rdquo; Fast-ROI İkramiyesi</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    İlk 3 direkt satışınızın her birinden aldığınız %20 Direkt Sponsor Primine (3×%20 = %60) ek olarak, 3. satışta <strong>+%15 Fast-ROI Hızlı Amortisman İkramiyesi</strong> ödenir. Toplam %75 iade ile paket maliyetiniz sıfırlanır!
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                    %60 Direkt Sponsor + %15 Fast-ROI = Toplam %75 Nakit İade
                  </div>
                </div>

              </div>

              {/* 7 Nefis Mertebesi Career Matrix Table */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>7 Nefis Mertebesi Kariyer, Derinlik Kilidi &amp; Havuz Payı Matrisi</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Kişisel aktiflik durumu, direkt aktif referans sayısı ve PGV ciroya göre açılan Çift Motorlu (Unilevel 7 Derinlik + Monoline) derinlikleri ve liderlik havuz fonu oranları:
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
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
                          <tr key={tier.level} className="hover:bg-slate-900/60">
                            <td className="py-2.5 pr-3 font-mono font-bold text-amber-300">{tier.label}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-100">{tier.title}</div>
                              <div className="text-[10px] text-slate-500">{tier.meaning}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">{tier.minPackageLabel}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">{tier.minActiveDirects} Aktif Üye</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-300 font-semibold">
                              {tier.unlockedDepth}. Derinlik (%{depthRule?.percentage})
                            </td>
                            <td className="py-2.5 pl-3 text-right font-mono font-bold text-amber-300">
                              {tier.poolBonusLabel}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Unilevel Infinity Fark Primi & Esnek Aktiflik Kutusu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-950 to-slate-900 border border-indigo-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/40">
                      7. GELİR KAPISI: INFINITY (%1 - %7)
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-300">Sınırsız Derinlik</span>
                  </div>
                  <h4 className="text-sm font-black text-white">Unilevel Sonsuzluk (Infinity) Fark Primi</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    8. derinlikten sonsuza kadar tüm organizasyon cironuzdan aldığınız diferansiyel fark primi: Emmâre %1, Levvâme %2, Mülhime %3, Mutmainne %4, Râzıye %5, Mardıyye %6, Kâmile %7.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/70 via-slate-950 to-slate-900 border border-amber-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                      ESNEK AKTİFLİK ("VEYA" KURALI)
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">Zorunlu Alım Yok</span>
                  </div>
                  <h4 className="text-sm font-black text-white">Esnek Aktiflik Şartı</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Her ay zorunlu paket satın alma şartı kaldırılmıştır!</strong> Bayi her ay ya kendi için 1 adet paket satın alır <span className="text-amber-300 font-bold">VEYA</span> o ay içinde sadece 1 yeni direkt üye kaydederek aktifliğini ücretsiz korur.
                  </p>
                </div>

              </div>

              {/* Navigation CTA */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Kazancınızı İnteraktif Simülatörde Canlı Test Edin</h4>
                  <p className="text-xs text-slate-400">Danışan seans sayısı, direkt referans ve organizasyon hacminize göre tahmini net kazancınızı hesaplayın.</p>
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
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-950/70 via-slate-900 to-slate-950 border border-teal-500/40 shadow-xl space-y-2">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>Uygulama, Seans &amp; Back-Office İşleyiş Yol Haritası</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Kayıttan Danışan Raporlamasına ve Monoline Komisyon Çekimine 6 Kolay Adım
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  AuraBio Frekans sistemini kullanmak, danışanlarınıza klinik ve holistik seanslar uygulamak ve Bayi Back-Office üzerinden kazançlarınızı yönetmek tamamen otomatize edilmiş adımlardan oluşur.
                </p>
              </div>

              {/* Step by Step Timeline */}
              <div className="space-y-3.5">
                
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-start gap-4 hover:border-emerald-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-base flex items-center justify-center border border-emerald-500/40 shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-100">Referans Kodu İle Kaydolun &amp; Küresel Tek Hatta (Monoline) Yerleşin</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sponsor bayinizin referans linki ile kaydolarak hesabınızı açın. Kayıt anında küresel tek hatta (Global Single Line) kronolojik sıranız otomatik tanımlanır ve sizden sonra katılan herkes alt sıranıza dökülür (spillover).
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-start gap-4 hover:border-amber-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 font-black text-base flex items-center justify-center border border-amber-500/40 shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-100">14 Resmi Paketten Seçim Yapın &amp; Seans Kredisi Yükleyin</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Bayi Back-Office içerisindeki <strong>14 Resmi Alışveriş Paketi</strong> sekmesinden 32 krediden 5.000 krediye kadar bütçenize uygun paketi seçin. BDDK uyumlu 3D Secure Sanal POS, Havale/EFT veya Kripto (USDT TRC-20) ile ödemenizi tamamlayın; krediniz anında havuzunuza aktarılır.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-start gap-4 hover:border-teal-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 font-black text-base flex items-center justify-center border border-teal-500/40 shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-100">Canlı Optik Spektrometre, 10s Akustik Ses &amp; Akıllı Saat Taraması Başlatın</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Kamera, mikrofon ve Bluetooth akıllı saat sensörlerini devreye sokarak danışanınızın 7 çakrasını, 5 letaif noktasını, vokal harmonik frekans spektrumunu ve nabız/HRV stres değerlerini eşzamanlı olarak ölçün.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-start gap-4 hover:border-indigo-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 font-black text-base flex items-center justify-center border border-indigo-500/40 shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-100">302+ Kadim Şifa veya 50+ Hastalık Protokolünü Uygulayın</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Biyometrik analiz sonucuna göre sistemin önerdiği Esma-ül Hüsna, Solfejyo, Sufi Makamı veya Şifa Ansiklopedisi protokolünü başlatın. Seans tamamlandığında kredi havuzunuzdan otomatik olarak 1 seans kredisi düşülür.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-start gap-4 hover:border-purple-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 font-black text-base flex items-center justify-center border border-purple-500/40 shrink-0">
                    5
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-100">8 Sekmeli Öncesi/Sonrası Raporu PDF ve Word Olarak Teslim Edin</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Seans öncesi ve sonrasındaki hücresel titreşim artışını gösteren 8 sekmeli karşılaştırmalı klinik raporu tek tıkla PDF veya Word (.doc) olarak indirin; danışanınıza WhatsApp veya e-posta üzerinden iletin.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-start gap-4 hover:border-cyan-500/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 font-black text-base flex items-center justify-center border border-cyan-500/40 shrink-0">
                    6
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-100">Bayi Back-Office'ten Monoline Ağacınızı ve Cüzdanınızı Yönetin</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Bayi Back-Office ekranında küresel tek hat ağacınızı, alt ekip siparişlerinizi ve cüzdan hareketlerinizi izleyin; biriken %20 Direkt Sponsor, %25 Monoline ve %5 Sistem / Kariyer Fonu gelirlerinizi resmi TR IBAN hesabınıza nakit olarak çekin.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SECTION 4: GELİŞMİŞ ÇOKLU GELİR SİMÜLATÖRÜ & YATIRIM ROI */}
          {activeSection === 'simulator' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/60 border border-indigo-500/40 shadow-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Calculator className="w-4 h-4" />
                  <span>Çok Boyutlu Finansal Kazanç &amp; Amortisman (ROI) Hesaplayıcı</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Danışan Seansı + %20 Direkt Sponsor + %25 Monoline + %5 Sistem Fonu + Ekstra Prim Simülatörü
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Uyguladığınız danışan seansları, direkt davet ettiğiniz üyeler, küresel tek hat (Monoline) siparişleri ve Nefis kariyer mertebenize göre aylık net gelirinizi ve yatırım geri dönüş (ROI) sürenizi canlı simüle edin.
                </p>
              </div>

              {/* Sliders and Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">1. Aylık Danışan Seansı Sayısı:</span>
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
                      <span className="text-slate-300">2. Seans Başı Danışan Ücreti (USD):</span>
                      <span className="text-amber-300 font-mono text-sm">{formatUsd(calcPricePerSession, 2)}</span>
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
                      <span className="text-slate-300">3. Direkt Referans Olunan Bayi/Üye (Ayda):</span>
                      <span className="text-indigo-300 font-mono text-sm">{calcReferredMembers} Direkt Satış</span>
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
                      <span className="text-slate-300">4. Küresel Tek Hat (Monoline) Alt Sıra Siparişi:</span>
                      <span className="text-teal-300 font-mono text-sm">{calcMonolineTeamOrders} Sipariş / Ay</span>
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
                      <label className="text-[11px] font-bold text-slate-300 block">Ortalama Paket Fiyatı:</label>
                      <select
                        value={calcAvgPackagePrice}
                        onChange={(e) => setCalcAvgPackagePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none"
                      >
                        {FREKANS_PACKAGES.map((pkg) => (
                          <option key={pkg.id} value={pkg.defaultPrice}>
                            {pkg.name} ({formatUsd(pkg.defaultPrice)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">Nefis Kariyer Mertebeniz:</label>
                      <select
                        value={calcCareerLevel}
                        onChange={(e) => setCalcCareerLevel(Number(e.target.value))}
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

                  {/* Bonus Toggles */}
                  <div className="pt-2 border-t border-slate-850 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 block">Ekstra Liderlik ve Hızlı Başlangıç Primleri:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={includeMatchingBonus}
                          onChange={(e) => setIncludeMatchingBonus(e.target.checked)}
                          className="accent-purple-500 rounded"
                        />
                        <span className="text-purple-300 font-semibold text-[11px]">Matching (%20)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={includeFastRoi}
                          onChange={(e) => setIncludeFastRoi(e.target.checked)}
                          className="accent-emerald-500 rounded"
                        />
                        <span className="text-emerald-300 font-semibold text-[11px]">Fast-ROI (+%15)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={includeInfinityBonus}
                          onChange={(e) => setIncludeInfinityBonus(e.target.checked)}
                          className="accent-indigo-500 rounded"
                        />
                        <span className="text-indigo-300 font-semibold text-[11px]">Infinity (%1-%7)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Calculation Output Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/50 flex flex-col justify-between space-y-4 shadow-xl">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400">Danışan Seans Cirosu ({calcClientsPerMonth} Seans):</span>
                      <span className="text-xs font-mono font-bold text-slate-200">{formatUsd(monthlySessionRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400">Tahmini Kredi Maliyeti (~{formatUsd(unitSessionCost, 2)}/Seans):</span>
                      <span className="text-xs font-mono font-bold text-rose-400">-{formatUsd(monthlySessionCost)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-emerald-400 font-bold">1. Danışan Seans Net Kârı:</span>
                      <span className="text-sm font-mono font-black text-emerald-400">+{formatUsd(monthlySessionProfit)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-indigo-300 font-bold">2. %20 Direkt Sponsor Primi:</span>
                      <span className="text-sm font-mono font-black text-indigo-300">+{formatUsd(monthlyDirectSponsorCommission)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-teal-300 font-bold">
                        3. Monoline Tek Hat Primi ({calcCareerLevel} Derinlik):
                      </span>
                      <span className="text-sm font-mono font-black text-teal-300">+{formatUsd(monthlyMonolineCommission)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-amber-300 font-bold">
                        4. {selectedCareerTier.title} Kariyer Havuz Payı:
                      </span>
                      <span className="text-sm font-mono font-black text-amber-300">+{formatUsd(monthlyCareerPoolBonus)}</span>
                    </div>
                    {monthlyMatchingBonus > 0 && (
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs text-purple-300 font-bold">
                          5. Liderlik Eşleşme (Matching %{Math.round(matchingRate * 100)}):
                        </span>
                        <span className="text-sm font-mono font-black text-purple-300">+{formatUsd(monthlyMatchingBonus)}</span>
                      </div>
                    )}
                    {monthlyFastRoiBonus > 0 && (
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs text-emerald-300 font-bold">
                          6. Fast-ROI Hızlı İkramiye (+%15):
                        </span>
                        <span className="text-sm font-mono font-black text-emerald-300">+{formatUsd(monthlyFastRoiBonus)}</span>
                      </div>
                    )}
                    {monthlyInfinityBonus > 0 && (
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs text-sky-300 font-bold">
                          7. Infinity Sonsuzluk Farkı (%{calcCareerLevel}):
                        </span>
                        <span className="text-sm font-mono font-black text-sky-300">+{formatUsd(monthlyInfinityBonus)}</span>
                      </div>
                    )}
                  </div>

                  {/* Highlighted Results Box */}
                  <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 space-y-2 text-center shadow-lg">
                    <div className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
                      Tahmini Toplam Aylık Net Gelir
                    </div>
                    <div className="text-3xl font-black text-white font-mono">
                      {formatUsd(totalMonthlyEarnings)}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] text-emerald-200/90 font-mono">
                      <span>Yıllık: <strong>{formatUsd(yearlyProjectedEarnings)}</strong></span>
                      <span>·</span>
                      <span className="text-amber-300 font-bold">
                        Yatırım Geri Dönüş (ROI): ~{estimatedRoiDays} Günde Amorti!
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveSection('packages')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>14 Resmi Bayi Paketini İncele &amp; Başla</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* SECTION 5: 15 RESMİ BAYİLİK KREDİ PAKETİ KATALOĞU */}
          {activeSection === 'packages' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950 border border-purple-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                    <Coins className="w-4 h-4" />
                    <span>Resmi Bayilik Seans Kredisi Havuzu &amp; Monoline Alışveriş Paketleri</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    32 Seans Kredisinden 5.000 Seans Kredisine 14 Resmi Paket
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                    Paket satın alındığında seans kredileri anında havuzunuza yüklenir. Baz dağıtım %20 direkt sponsor, %25 yedi derinlik ve %5 sistem fonudur; ek V2.2 bonusları ayrıca hesaplanır.
                  </p>
                </div>

                {/* Filter Selector */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPkgCatalogFilter('ALL_15')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      pkgCatalogFilter === 'ALL_15'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tüm 14 Paket
                  </button>
                  <button
                    type="button"
                    onClick={() => setPkgCatalogFilter('STARTER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      pkgCatalogFilter === 'STARTER'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
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
                        : 'text-slate-400 hover:text-slate-200'
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
                        : 'text-slate-400 hover:text-slate-200'
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
                          ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/60 border-emerald-500/70 shadow-xl ring-1 ring-emerald-500/40'
                          : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 text-amber-300 border border-slate-700">
                            {pkg.badgeCategory}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                            Kademe {pkg.rankOrder}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-100">{pkg.name}</h4>
                          <div className="text-xs text-emerald-400 font-bold mt-0.5 font-mono flex items-center justify-between">
                            <span>{pkg.sessionCreditsLabel}</span>
                            <span className="text-slate-400 text-[11px]">({pkg.perSessionCostLabel})</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-black text-white font-mono">
                              {formatUsd(pkg.defaultPrice)}
                            </div>
                            <div className="text-[10px] font-mono text-indigo-300">
                              Sponsor Primi: {formatUsd(pkg.defaultPrice * 0.2)}
                            </div>
                          </div>
                          <div className="text-[10px] text-amber-300 font-mono">
                            Perakende Seans Gelir Potansiyeli: ~{formatUsd(retailPotential)}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {pkg.shortDescription || pkg.description}
                        </p>

                        <ul className="space-y-1 pt-1 text-xs text-slate-300">
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
                          } else if (onOpenAuthModal) {
                            onOpenAuthModal('dealer');
                          }
                        }}
                        className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                          isPopular
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
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
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/70 via-slate-900 to-slate-950 border border-cyan-500/40 shadow-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mevzuat, Finans &amp; Hukuki Güvenlik Standartları (v6.0 Enterprise)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  BDDK / TCMB 3D Sanal POS, Resmi TR IBAN, E-Fatura &amp; CE Sınıf I Wellness Uyum Güvencesi
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  AuraBio Frekans sistemi; finansal işlemler, bayi hakları, tüketici koruması ve sağlık mevzuatı bakımından ulusal ve uluslararası standartlara tam uyumlu olarak yapılandırılmıştır.
                </p>
              </div>

              {/* 6 Core Legal & Compliance Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span>1. BDDK &amp; TCMB Uyumlu 256-Bit SSL 3D Secure Sanal POS</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tüm paket ödemeleri doğrudan PCI-DSS Seviye 1 sertifikalı lisanslı Sanal POS altyapısı üzerinden Kredi / Banka Kartı ve 3D Secure SMS doğrulaması ile alınır. Sistemde elden nakit veya kayıt dışı ödeme kabul edilmez.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                      <Scale className="w-4 h-4" />
                    </div>
                    <span>2. 4'lü Yasal Sözleşme Paketi (Zaman Damgalı Onay)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Her alışverişte; <strong>Ön Bilgilendirme Formu</strong>, <strong>Mesafeli Satış Sözleşmesi</strong>, <strong>KVKK Açık Rıza ve Aydınlatma Metni</strong> ve <strong>MLM Bayilik Şartları</strong> kullanıcının IP adresi ve zaman damgasıyla kayıt altına alınır.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span>3. 14 Günlük Yasal Cayma Hakkı Blokesi (Pending Balance)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    6502 sayılı Tüketicinin Korunması Hakkında Kanun gereğince oluşturulan 14 günlük yasal cayma süresi boyunca oluşan komisyonlar &ldquo;Bekleyen Bakiye&rdquo; havuzunda güvende tutulur; iptal ve iadelerde Clawback mekanizması işletilir.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span>4. Resmi TR IBAN Çekimi &amp; Çapraz Ad-Soyad Eşleşmesi</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hak edilen tüm komisyon ve bonus ödemeleri yalnızca bayinin kendi adına kayıtlı Türkiye Cumhuriyeti banka hesabına (TR IBAN) transfer edilir. 3. şahıslara veya sahte hesaplara kesinlikle ödeme yapılmaz.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span>5. %100 USD Bazlı Şeffaf Cüzdan ve Küresel Çekim Güvencesi</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tüm kazançlar, komisyonlar ve bonuslar doğrudan ABD Doları (USD) olarak şeffaf şekilde cüzdanınıza yansıtılır. Bayilerimiz hak edişlerini resmi banka TR IBAN veya TRC20 kripto cüzdanlarına kur kaybı yaşamadan güvenle çekebilir.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-teal-400 font-bold text-sm">
                    <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/40">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <span>6. Tıbbi Sorumluluk Beyanı &amp; CE Sınıf I / Wellness Standartları</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    AuraBio Frekans; tıbbi teşhis ve tedavi cihazı olmayıp, tamamlayıcı sağlıklı yaşam, biyo-rezonans enerji dengesi ve biyo-akustik uyum yazılımıdır. Tüm raporlar ve bilgilendirmeler tıbbi tedavi tavsiyesi niteliği taşımadığı beyanıyla sunulur.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* SECTION 7: ÖZEL REFERANSLI PAYLAŞIM, QR KOD VE RESMİ BELGELER */}
          {activeSection === 'share' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/70 border border-emerald-500/50 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Share2 className="w-4 h-4" />
                  <span>Özel Referanslı Paylaşım, Canlı QR Kod &amp; Resmi Kurumsal Belgeler</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Tek Tuşla WhatsApp ve Sosyal Ağlarda Paylaşın • Canlı QR Kod Gösterin • Resmi Word ve PDF İndirin
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  Bu dijital sunum ve kataloğu danışanlarınıza, hekimlere, kliniklere ve iş ortaklarınıza gönderdiğinizde; ziyaretçiler sizin referans kodunuzla kaydedilir, küresel tek hatta bağlanır ve yaptıkları her işlemden anında komisyon kazanırsınız.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Link, Code and QR Code Card */}
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-200 flex items-center gap-1.5">
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
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-300 font-mono outline-none select-all"
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
                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                    {qrDataUrl && (
                      <div className="p-2 bg-white rounded-2xl shadow-lg border border-emerald-500/30 shrink-0">
                        <img src={qrDataUrl} alt="Bayi QR Kodu" className="w-32 h-32 object-contain" />
                      </div>
                    )}
                    <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                      <div className="text-[11px] text-slate-400 font-bold uppercase">Bayi / Referans Kodunuz</div>
                      <div className="text-base font-black font-mono text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-emerald-500/30 inline-block">
                        {activeReferralCode}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Danışanlarınız telefon kameralarıyla bu QR kodu tarayarak doğrudan sizin yetkili sayfanıza erişebilir.
                      </p>
                      <button
                        onClick={handleCopyCode}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{copiedCode ? 'Kod Kopyalandı' : 'Kodu Kopyala'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Social Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-slate-300 block">Sosyal Ağlarda Paylaşın:</span>
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
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>Resmi Kurumsal Katalog &amp; Rapor İndir</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                        v6.0 Enterprise
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Kurumlara, kliniklere veya ortaklarınıza fiziki sunum yapabilmeniz için sistemin en güncel 16 modülünü, 14 resmi kredi paketini ve Monoline 7 Nefis MLM gelir modelini içeren resmi Word (.doc) ve vektör PDF kataloğunu indirebilirsiniz.
                    </p>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                      <div className="font-bold text-emerald-300">Belge İçeriği (v6.0 Enterprise):</div>
                      <div>• AKN Global Group Ltd Şirket Heyet Onayı &amp; Teknik Mimari</div>
                      <div>• 16 Bütüncül Biyo-Rezonans &amp; Spektrometre Teknolojisi</div>
                      <div>• 302+ Kadim Şifa Frekansı &amp; 50+ Hastalık Protokolü Matrisi</div>
                      <div>• Monoline 7 Nefis MLM (%20 Sponsor • %25 Tek Hat • %5 Sistem Fonu)</div>
                      <div>• 14 Resmi Alışveriş Paketi Fiyatlandırma &amp; Birim Maliyet Tabloları</div>
                      <div>• BDDK / TCMB 3D Secure Sanal POS &amp; Yasal Uyum Beyanları</div>
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
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-amber-500/30 transition-colors cursor-pointer"
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

        {/* Bottom Footer Bar with Quick Action CTAs */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AuraBio Frekans v6.0 Enterprise • Kuantum Biyo-Rezonans &amp; Monoline 7 Nefis MLM Sistemi</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                if (activeReferralCode) setStoredReferralCode(activeReferralCode);
                onClose();
                if (onOpenAuthModal) onOpenAuthModal('dealer');
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black shadow-md shadow-amber-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Bayilik Başvurusu Yap</span>
            </button>

            <button
              onClick={() => {
                if (activeReferralCode) setStoredReferralCode(activeReferralCode);
                onClose();
                if (onOpenAuthModal) onOpenAuthModal('register');
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hemen Kayıt Ol</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
