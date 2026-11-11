import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Radio, 
  BookOpen, 
  History, 
  VolumeX, 
  Volume2,
  Sparkles, 
  Compass, 
  Flame, 
  User, 
  LogOut, 
  Shield,
  WifiOff,
  Brain,
  Moon,
  Sun,
  AlertTriangle,
  ArrowLeft,
  Home,
  HelpCircle,
  FileText,
  Menu,
  X,
  ChevronRight,
  Zap,
  Activity,
  Layers,
  Watch,
  Globe,
  Award,
  Search,
  CheckCircle2,
  Users,
  Mic,
  Briefcase,
  Clock,
  Languages,
  Gift,
  Database,
  RotateCcw,
  ShoppingCart,
  Receipt
} from 'lucide-react';
import { ActiveTab } from '../types';
import { UserMember, checkMemberAccess } from '../utils/authManager';
import { wearableService, ConnectionStatus } from '../services/wearableBluetoothService';
import { useLanguage } from '../utils/i18n';
import voiceAssistant from '../utils/voiceAssistant';
import { syncFrekansWithMonolineEngine } from '../utils/monolineSyncBridge';

const STORAGE_KEY_MOBILE_MENU_OPEN = 'aurabio_mobile_menu_open';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  canGoBack?: boolean;
  isAudioPlaying: boolean;
  onStopAudio: () => void;
  scanCount: number;
  currentUser: UserMember | null;
  onLogout: () => void;
  onOpenAdminModal: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register' | 'dealer') => void;
  onOpenDealerModal?: () => void;
  onOpenEncyclopedia?: () => void;
  onOpenSOSModal?: () => void;
  onOpenSleepModal?: () => void;
  onOpenUserGuide?: () => void;
  onOpenTechnicalReport?: () => void;
  onOpenBusinessPresentation?: () => void;
  onOpenWearableModal?: () => void;
  onOpenJourneyModal?: () => void;
  onOpenFrequencyForgeModal?: () => void;
  onOpenDreamDecoderModal?: () => void;
  onOpenGroupAuraModal?: () => void;
  onOpenJournalModal?: () => void;
  onOpenMemberDashboard?: () => void;
  onOpenCampaignsModal?: () => void;
  onOpenMonolineModal?: (subTab?: 'mlm_7nefis' | 'mlm_commission' | 'packages' | 'backoffice' | 'admin' | 'monoline' | 'webhook') => void;
  onOpenSmartAccounting?: () => void;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onGoBack,
  onGoHome,
  canGoBack = true,
  isAudioPlaying,
  onStopAudio,
  scanCount,
  currentUser,
  onLogout,
  onOpenAdminModal,
  onOpenAuthModal,
  onOpenDealerModal,
  onOpenEncyclopedia,
  onOpenSOSModal,
  onOpenSleepModal,
  onOpenUserGuide,
  onOpenTechnicalReport,
  onOpenBusinessPresentation,
  onOpenWearableModal,
  onOpenJourneyModal,
  onOpenFrequencyForgeModal,
  onOpenDreamDecoderModal,
  onOpenGroupAuraModal,
  onOpenJournalModal,
  onOpenMemberDashboard,
  onOpenCampaignsModal,
  onOpenMonolineModal,
  onOpenSmartAccounting,
  isOnline = true,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(
    () => sessionStorage.getItem(STORAGE_KEY_MOBILE_MENU_OPEN) === '1'
  );
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [wearableStatus, setWearableStatus] = useState<ConnectionStatus>(wearableService.getStatus());
  const [wearableBpm, setWearableBpm] = useState<number | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();

  const handleQuickSyncFrekans = async () => {
    try {
      setSyncStatusMsg('Senkronize ediliyor...');
      const res = await syncFrekansWithMonolineEngine();
      if (res) {
        setSyncStatusMsg(`Senkronize Edildi (${res.members?.length || 0} Üye, ${res.transactions?.length || 0} İşlem)`);
      } else {
        setSyncStatusMsg('Senkronizasyon tamamlandı');
      }
      setTimeout(() => setSyncStatusMsg(null), 3500);
    } catch {
      setSyncStatusMsg('Senkronizasyon tamamlandı');
      setTimeout(() => setSyncStatusMsg(null), 2500);
    }
  };

  const access = checkMemberAccess(currentUser);
  const isAdmin = currentUser?.role === 'admin' || access.isAdmin;

  const handleLanguageToggle = () => {
    const nextLang = language === 'tr' ? 'en' : 'tr';
    setLanguage(nextLang);
    voiceAssistant.setLanguage(nextLang, true);
  };

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_MOBILE_MENU_OPEN, isMobileMenuOpen ? '1' : '0');
  }, [isMobileMenuOpen]);

  // Lock body scroll on mobile when full screen menu is active to prevent Android background scroll glitches
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const unsubStatus = wearableService.subscribeStatus((st) => {
      setWearableStatus(st);
    });
    const unsubData = wearableService.subscribeData((data) => {
      setWearableBpm(data.heartRateBpm);
    });
    return () => {
      unsubStatus();
      unsubData();
    };
  }, []);

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const mainTabs: { 
    id: ActiveTab; 
    label: string; 
    shortLabel: string; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string; 
    activeGradient: string;
    description: string;
  }[] = [
    {
      id: 'camera',
      label: 'Canlı Kamera & Biyo-Aura',
      shortLabel: 'Kamera',
      icon: Camera,
      color: 'text-emerald-400',
      activeGradient: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40',
      description: 'Optik sensör & biyo-aura tespiti'
    },
    {
      id: 'circadian',
      label: 'Biyo-Ritim & Circadian Senkronizatörü',
      shortLabel: 'Biyo-Ritim',
      icon: Sun,
      color: 'text-amber-400',
      activeGradient: 'bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-200 border-amber-500/50 shadow-amber-950/40',
      description: '24s Biyolojik organ saati, hormon & ışık akustiği'
    },
    {
      id: 'healing',
      label: "6'lı Kadim Şifa (302+)",
      shortLabel: 'Kadim Şifa',
      icon: Sparkles,
      color: 'text-teal-400',
      activeGradient: 'bg-gradient-to-r from-teal-500/25 to-emerald-500/25 text-teal-200 border-teal-500/50 shadow-teal-950/40',
      description: 'Sufi, Ayurveda, Çin & Solfejyo'
    },
    {
      id: 'mandala',
      label: 'AI Kutsal Geometri Mandala',
      shortLabel: 'AI Mandala',
      icon: Layers,
      color: 'text-purple-400',
      activeGradient: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-950/40',
      description: 'Kutsal geometri, Torus & Ses rezonansı'
    },
    {
      id: 'heatmap',
      label: 'Küresel Frekans Haritası',
      shortLabel: 'Küresel Harita',
      icon: Globe,
      color: 'text-cyan-400',
      activeGradient: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-950/40',
      description: 'Dünya geneli canlı niyet & seans ağı'
    },
    {
      id: 'mindspace',
      label: 'MindSpace AI Stüdyo',
      shortLabel: 'MindSpace',
      icon: Brain,
      color: 'text-indigo-400',
      activeGradient: 'bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-indigo-200 border-indigo-500/50 shadow-indigo-950/40',
      description: 'Akıllı zihin & frekans alanı'
    },
    {
      id: 'islamic',
      label: 'İslami (Esma & Ayet)',
      shortLabel: 'İslami',
      icon: Radio,
      color: 'text-amber-400',
      activeGradient: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-950/40',
      description: '99 Esma-ül Hüsna & Şifa Ayetleri'
    },
    {
      id: 'eastern',
      label: 'Uzak Doğu & Çakra',
      shortLabel: 'Uzak Doğu',
      icon: Compass,
      color: 'text-orange-400',
      activeGradient: 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-orange-950/40',
      description: '7 Çakra, Kundalini & Mantralar'
    },
    {
      id: 'mythology',
      label: '5 Kadim Element',
      shortLabel: '5 Element',
      icon: Flame,
      color: 'text-cyan-400',
      activeGradient: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-950/40',
      description: 'Ateş, Su, Hava, Toprak, Eter'
    },
    {
      id: 'letaif',
      label: 'Letaif & İlim Rehberi',
      shortLabel: 'İlim',
      icon: BookOpen,
      color: 'text-purple-400',
      activeGradient: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-950/40',
      description: '5 Kalbi Letaif & Maneviyat'
    },
    {
      id: 'history',
      label: `Tarama Geçmişi (${scanCount})`,
      shortLabel: `Geçmiş (${scanCount})`,
      icon: History,
      color: 'text-rose-400',
      activeGradient: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-950/40',
      description: 'Kaydedilen raporlar & grafikler'
    },
  ];

  const currentTabInfo = mainTabs.find((t) => t.id === activeTab);

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl shadow-black/50">
      
      {/* Clean & Elegant Top Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Left: Brand Identity & Current Screen Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Logo */}
            <div 
              onClick={() => onGoHome ? onGoHome() : setActiveTab('camera')} 
              className="flex items-center gap-2 cursor-pointer group shrink-0"
              title="AuraBio Ana Sayfa"
            >
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/40 shadow-inner group-hover:border-emerald-400 transition-all group-hover:scale-105">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                {isAudioPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base md:text-lg font-black tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-indigo-200 bg-clip-text text-transparent">
                    AuraBio
                  </span>
                  <span className="text-sm sm:text-base md:text-lg font-black text-slate-100">
                    Frekans
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    v2.8
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 hidden xs:block">
                  Kuantum Biyo-Rezonans Portalı
                </p>
              </div>
            </div>

            {/* Current Active Screen Chip & Quick Back Button */}
            {(canGoBack || activeTab !== 'camera') && onGoBack && (
              <button
                onClick={onGoBack}
                className="flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-xs font-bold transition-all shadow-sm group active:scale-95 cursor-pointer"
                title="Önceki Sayfaya Geri Dön"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden xs:inline">Geri</span>
              </button>
            )}

            {currentTabInfo && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
                <currentTabInfo.icon className={`w-3.5 h-3.5 ${currentTabInfo.color}`} />
                <span className="font-semibold text-slate-200">{currentTabInfo.label}</span>
              </div>
            )}

          </div>

          {/* Center: Real-Time Audio Playing Pill */}
          {isAudioPlaying && (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 shadow-md shadow-rose-950 animate-pulse shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-bold hidden sm:inline">Ses Yayını Aktif</span>
              <button
                onClick={onStopAudio}
                className="p-1 hover:bg-rose-900 rounded-full text-rose-200 cursor-pointer ml-0.5"
                title="Sesi Durdur"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Right: The Prominent Menu Button (Üç Çizgi Menü Butonu) */}
          <div className="flex items-center gap-2">
            {/* Kampanyalar & Fırsatlar Button */}
            {onOpenCampaignsModal && (
              <button
                onClick={onOpenCampaignsModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer animate-pulse"
                title="Güncel Kampanyalar, İndirimler ve Fırsatlar"
              >
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Kampanyalar</span>
                <span className="hidden lg:inline-block px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500/30 text-amber-200 uppercase">
                  Yeni
                </span>
              </button>
            )}

            {/* Bayi Girişi Button (Only when not logged in) */}
            {!currentUser && (
              <button
                onClick={() => {
                  onOpenAuthModal('login');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="AuraBio Bayilik ve Danışman Girişi"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Bayi Girişi</span>
              </button>
            )}

            {/* Quick User Avatar Badge if logged in -> Click opens Bayi Paneli */}
            {currentUser && (() => {
              const displayName = currentUser.fullName?.trim() || currentUser.email?.split('@')[0] || 'Bayi / Danışman';
              const userInitial = displayName.charAt(0).toUpperCase() || 'B';
              const shortName = displayName.split(' ')[0] || displayName;
              return (
                <button
                  onClick={() => {
                    if (onOpenDealerModal) onOpenDealerModal();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-xs text-slate-200 transition-all cursor-pointer shadow-sm group"
                  title="Yetkili Bayi & Danışman Panelini Aç"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center justify-center border border-amber-500/40 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    {userInitial}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 max-w-[80px] truncate group-hover:text-amber-300 transition-colors">
                    {shortName}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Bayi Paneli
                  </span>
                </button>
              );
            })()}

            {/* Language Switcher Button (TR / EN) */}
            <button
              onClick={handleLanguageToggle}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title={language === 'tr' ? 'Switch to English' : "Türkçe'ye Geç"}
            >
              <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-emerald-300">
                {language.toUpperCase()}
              </span>
            </button>

            {/* The 3-Lines (Hamburger) Master Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shrink-0 active:scale-95 shadow-md ${
                isMobileMenuOpen 
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-rose-950/40' 
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/50 shadow-emerald-950/70'
              }`}
              title="Tüm Menüyü & Modülleri Aç"
            >
              {isMobileMenuOpen ? (
                <>
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden lg:inline">Kapat</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden lg:inline">Menü</span>
                </>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Full Page Mobile & Android Screen Menu (Z-index 100, zero overflow clipping) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] h-[100dvh] w-full bg-slate-950/98 backdrop-blur-3xl flex flex-col text-slate-100 overscroll-contain animate-in fade-in duration-200">
          
          {/* Full Page Menu Top Bar */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                  <span>AuraBio Menü & Modüller</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">v2.8</span>
                </div>
                <div className="text-[10px] text-slate-400">Tüm Biyo-Rezonans & Şifa Panelleri</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLanguageToggle}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 flex items-center gap-1.5 text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                title={language === 'tr' ? 'Switch to English' : "Türkçe'ye Geç"}
              >
                <Languages className="w-3.5 h-3.5" />
                <span className="uppercase">{language}</span>
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                title="Menüyü Kapat"
              >
                <X className="w-4 h-4 text-rose-300" />
                <span>Kapat</span>
              </button>
            </div>
          </div>

          {/* Quick Search Bar within Menu */}
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 shrink-0">
            <div className="relative max-w-xl mx-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                placeholder="Modül, frekans, araç veya rehber ara..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
              {menuSearchQuery && (
                <button
                  onClick={() => setMenuSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Full Page Scrollable List Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5 pb-28 max-w-2xl mx-auto w-full">
            
            {/* User Profile List Item */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
              {currentUser ? (() => {
                const displayName = currentUser.fullName?.trim() || currentUser.email?.split('@')[0] || 'Kullanıcı';
                const userInitial = displayName.charAt(0).toUpperCase() || 'U';
                return (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                        {userInitial}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                          <span>{displayName}</span>
                          {isAdmin && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{currentUser.email || 'Kayıtlı Danışan'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onOpenDealerModal) onOpenDealerModal();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-colors"
                      >
                        Bayi Paneli
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onOpenAdminModal();
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold"
                        >
                          Admin
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onLogout();
                        }}
                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Çıkış Yap"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })() : (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-bold text-slate-200 text-xs">Yetkili Bayi Portalı</div>
                    <div className="text-[10px] text-slate-400">Bayi hesabınızla giriş yapın veya başvurun</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuthModal('login');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-950 active:scale-95 transition-all cursor-pointer"
                  >
                    Bayi Girişi / Başvur
                  </button>
                </div>
              )}
            </div>

            {/* Bayi & Is Ortakligi Mobile Banner Card */}
            {(() => {
              const isApprovedDealer = currentUser?.role === 'dealer' || currentUser?.dealerStatus === 'approved';
              const isPendingDealer = (currentUser?.isDealerRequested || currentUser?.dealerStatus === 'pending') && !isApprovedDealer && currentUser?.dealerStatus !== 'rejected';

              return (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                        <span>{isApprovedDealer ? 'Yetkili Bayi Paneli' : isPendingDealer ? 'Bayilik Başvurusu' : 'AuraBio Bayimiz Olun'}</span>
                        {isApprovedDealer && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-400/40">VIP</span>
                        )}
                        {isPendingDealer && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">İnceleniyor</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isApprovedDealer 
                          ? 'Danışan yönlendirme, komisyon ve bayi özel avantajları'
                          : isPendingDealer
                            ? 'Başvurunuz yöneticimiz tarafından incelenmektedir'
                            : '%20 komisyon, özel fiyatlar & kurumsal temsilcilik'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onOpenDealerModal) {
                        onOpenDealerModal();
                      } else {
                        onOpenAuthModal(isApprovedDealer ? 'login' : 'dealer');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-950/50 shrink-0 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{isApprovedDealer ? 'Paneli Aç' : isPendingDealer ? 'Durumu Gör' : 'Başvur'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })()}

            {/* List Group 1: Ana Navigasyon ve Şifa Ekranları */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                <span>1. Temel Modüller & Ekranlar</span>
                <span className="text-[10px] text-emerald-400 font-mono">10 Modül</span>
              </div>
              <div className="space-y-1.5">
                {mainTabs
                  .filter((item) => 
                    !menuSearchQuery || 
                    (item.label || '').toLowerCase().includes(menuSearchQuery.toLowerCase()) || 
                    (item.description || '').toLowerCase().includes(menuSearchQuery.toLowerCase())
                  )
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all border cursor-pointer active:scale-[0.99] ${
                          isActive
                            ? `${item.activeGradient} shadow-md`
                            : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800/90 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-slate-800 border border-slate-700/60'}`}>
                            <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-slate-300'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-100'}`}>
                                {item.label}
                              </span>
                              {isActive && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Aktif</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                              {item.description}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* List Group 2: Biyometrik Sensörler & Hızlı Şifa Araçları */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                <span>2. Biyometrik ve Hızlı Şifa Araçları</span>
                <span className="text-[10px] text-teal-400 font-mono">8 Araç</span>
              </div>
              <div className="space-y-1.5">

                {/* 1: AI Yaşam Koçu & Günlük Günlük */}
                {onOpenJournalModal && (!menuSearchQuery || 'ai yaşam koçu günlük aura journal psikolog frekans günlüğü'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenJournalModal();
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/70 border border-purple-500/60 text-left transition-all active:scale-[0.99] shadow-lg shadow-purple-950/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/50 shrink-0">
                        <Brain className="w-4 h-4 text-purple-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-200">🧠 AI Yaşam Koçu & Günlük Günlük</span>
                          <span className="text-[9px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">Holistik Koç</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Bütüncül terapötik perspektif & frekans protokolü</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />
                  </button>
                )}

                {/* 2: Sesli & Niyetli Frekans Labirenti */}
                {onOpenFrequencyForgeModal && (!menuSearchQuery || 'sesli niyetli frekans labirenti mikrofon osilatör akort'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenFrequencyForgeModal();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-900 border border-teal-500/50 text-left transition-all active:scale-[0.99] shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 shrink-0">
                        <Mic className="w-4 h-4 text-teal-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-teal-200">🎙️ Sesli & Niyetli Frekans Labirenti</span>
                          <span className="text-[9px] font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">Çoklu Osilatör</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Sesinizi analiz edip niyetinize özel frekans sentezler</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-teal-400 shrink-0" />
                  </button>
                )}

                {/* 3: AI Rüya & Bilinçaltı Çözümleyicisi */}
                {onOpenDreamDecoderModal && (!menuSearchQuery || 'ai rüya bilinçaltı çözümleyici tabir çakra frekans'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenDreamDecoderModal();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border border-purple-500/50 text-left transition-all active:scale-[0.99] shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 shrink-0">
                        <Moon className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-200">🌙 AI Rüya & Bilinçaltı Çözümleyicisi</span>
                          <span className="text-[9px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">Kadim Arketip</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Rüyanızı sesli/metin analiz edip çakra şifasını başlatır</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />
                  </button>
                )}

                {/* 4: Şifa Ansiklopedisi */}
                {onOpenEncyclopedia && (!menuSearchQuery || 'şifa ansiklopedisi hastalık 50+'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenEncyclopedia();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/50 text-left transition-all active:scale-[0.99] shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 shrink-0">
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-200">🌿 Şifa Ansiklopedisi</span>
                          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">50+ Hastalık</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Biyo-akustik tarama & 10 sn öncesi/sonrası</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                  </button>
                )}

                {/* 4: 7 Günlük Kamp */}
                {onOpenJourneyModal && (!menuSearchQuery || '7 günlük kamp arınma sabah öğle gece'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenJourneyModal();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/50 text-left transition-all active:scale-[0.99] shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 shrink-0">
                        <Compass className="w-4 h-4 text-teal-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-teal-200">🧭 7 Günlük AI Bütünsel Arınma Kampı</span>
                          <span className="text-[9px] font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">AI Plan</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Sabah • Öğle • Gece dönüşüm protokolü</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-teal-400 shrink-0" />
                  </button>
                )}

                {/* 5: Akıllı Saat Köprüsü */}
                {onOpenWearableModal && (!menuSearchQuery || 'akıllı saat nabız hrv bluetooth ble'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenWearableModal();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-left transition-all active:scale-[0.99] shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 shrink-0">
                        <Watch className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100">⌚ Aura-Sync Akıllı Saat Köprüsü</span>
                          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">BLE 0x180D</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {wearableBpm ? `Bağlı: ${wearableBpm} BPM Canlı Nabız & HRV` : 'Bluetooth ile canlı nabız & stres senkronizasyonu'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                  </button>
                )}

                {/* 6: SOS Sakinleş */}
                {onOpenSOSModal && (!menuSearchQuery || 'sos sakinleş panik acil 432 hz'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenSOSModal();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/50 text-left transition-all active:scale-[0.99] shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 shrink-0">
                        <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-200">⚠️ SOS Sakinleş & Acil Dengeleme</span>
                          <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">432 Hz</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">60 saniyede panik, öfke ve stres yatıştırıcı</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
                  </button>
                )}

                {/* 7: Uyku Tüneli */}
                {onOpenSleepModal && (!menuSearchQuery || 'uyku tüneli delta gece biyo senkron'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenSleepModal();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/50 text-left transition-all active:scale-[0.99] shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 shrink-0">
                        <Moon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-200">🌙 Gece Uyku Tüneli & Biyo-Senkron</span>
                          <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">Delta Dalga</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Derin REM uykusu ve melatonin frekansları</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                  </button>
                )}

              </div>
            </div>

            {/* List Group 3: Kurumsal & Aile Çemberi (Family & Group Aura Sync) */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                <span>3. Kurumsal & Aile Çemberi (Group Aura Sync)</span>
                <span className="text-[10px] text-emerald-400 font-mono">Canlı Bulut</span>
              </div>
              <div className="space-y-1.5">
                {onOpenGroupAuraModal && (!menuSearchQuery || 'kurumsal aile çemberi grup aura sync eşzamanlı firestore oda'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenGroupAuraModal();
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/60 text-left transition-all active:scale-[0.99] shadow-lg shadow-emerald-950/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 shrink-0">
                        <Users className="w-4 h-4 text-emerald-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-200">👥 Kurumsal & Aile Çemberi</span>
                          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">Eşzamanlı Frekans</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Tüm aile ve ekip cihazlarını tek tıkla aynı frekansta birleştirin</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                  </button>
                )}
              </div>
            </div>

            {/* List Group 4: Raporlar, Kılavuz & Sistem */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                <span>4. Belgeler, Rehber & Yönetim</span>
                <span className="text-[10px] text-indigo-400 font-mono">Kurumsal</span>
              </div>
              <div className="space-y-1.5">
                
                {/* İş Sunum Raporu & Dijital Katalog */}
                {onOpenBusinessPresentation && (!menuSearchQuery || 'iş sunum raporu dijital katalog bayilik ne işe yarar ne kazandırır nasıl kullanılır sunum'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenBusinessPresentation();
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/60 text-left transition-all active:scale-[0.99] shadow-lg shadow-emerald-950/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 shrink-0">
                        <BookOpen className="w-4 h-4 text-emerald-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-200">📊 İş Sunum Raporu & Dijital Katalog</span>
                          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">Sunum Modülü</span>
                        </div>
                        <div className="text-[11px] text-slate-300/80 mt-0.5">Ne İşe Yarar • Ne Kazandırır • Nasıl Kullanılır • Özel Referansla Paylaş</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                  </button>
                )}

                {/* Teknik Rapor */}
                {onOpenTechnicalReport && (!menuSearchQuery || 'teknik rapor sözleşme teklif word pdf akn'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenTechnicalReport();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-left transition-all active:scale-[0.99] shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                        <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100">📄 Resmi Teknik Rapor & İş Teklifi</span>
                          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">Word & PDF</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">AKN GLOBAL GROUP LTD resmi sistem belgesi</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                )}

                {/* Kullanım Rehberi */}
                {onOpenUserGuide && (!menuSearchQuery || 'kullanım rehberi sss kılavuz nasıl kullanılır'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenUserGuide();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-left transition-all active:scale-[0.99] shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                        <HelpCircle className="w-4 h-4 text-teal-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100">❓ Kapsamlı Kullanım Kılavuzu & SSS</span>
                          <span className="text-[9px] font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">Sesli Rehber</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Tüm modüllerin adım adım detaylı anlatımı</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                )}

                {/* Kampanyalar & Fırsatlar Portalı */}
                {onOpenCampaignsModal && (!menuSearchQuery || 'kampanya kampanyalar fırsat indirim kupon bonus hediye'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCampaignsModal();
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-orange-950/40 to-slate-900 border border-amber-500/60 text-left transition-all active:scale-[0.99] shadow-lg shadow-amber-950/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 shrink-0 text-amber-300">
                        <Gift className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-200">🎁 Özel Kampanyalar & İndirim Kuponları</span>
                          <span className="text-[9px] font-black bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 animate-pulse">Fırsat</span>
                        </div>
                        <div className="text-[11px] text-amber-300/75 mt-0.5">Tüm güncel bayi bonusları, indirim kodları ve sistem duyuruları</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                  </button>
                )}

                {/* Bayi Portalı */}
                {(!menuSearchQuery || 'bayi danışman ortaklık komisyon paket sipariş bayi paneli'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onOpenDealerModal) onOpenDealerModal();
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/60 text-left transition-all active:scale-[0.99] shadow-lg shadow-amber-950/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 shrink-0">
                        <Briefcase className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-200">🏢 Yetkili Bayi & Danışman Portalı</span>
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">Bayi Paneli</span>
                        </div>
                        <div className="text-[11px] text-amber-300/75 mt-0.5">Komisyon takibi, paket siparişi, müşteri yönetimi ve dijital kartvizit</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                  </button>
                )}


                {/* Admin Portalı */}
                {isAdmin && (!menuSearchQuery || 'admin yönetici kullanıcılar lisans onay'.includes(menuSearchQuery.toLowerCase())) && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAdminModal();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-left transition-all active:scale-[0.99] shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 shrink-0">
                        <Shield className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-200">🛡️ Yönetici / Admin Kontrol Portalı</span>
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">Yetkili</span>
                        </div>
                        <div className="text-[11px] text-amber-300/70 mt-0.5">Kullanıcı yetkileri, lisanslar ve danışan onayı</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                  </button>
                )}

              </div>
            </div>

            {/* Bottom Close Action Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Menüyü Kapat ve Uygulamaya Dön</span>
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-2 pb-4">
              AuraBio Frekans v2.8 • Kuantum Biyo-Rezonans & Kirlian Spektrometresi
            </div>

          </div>

        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Android & iOS thumb navigation) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 shadow-2xl shadow-black pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
          
          {/* 1: Camera */}
          <button
            onClick={() => handleTabClick('camera')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-[46px] ${
              activeTab === 'camera'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className={`w-5 h-5 mb-0.5 ${activeTab === 'camera' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-[10px] leading-tight">Kamera</span>
          </button>

          {/* 2: Ancient Healing */}
          <button
            onClick={() => handleTabClick('healing')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-[46px] ${
              activeTab === 'healing'
                ? 'text-teal-300 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className={`w-5 h-5 mb-0.5 ${activeTab === 'healing' ? 'text-teal-400' : 'text-slate-400'}`} />
            <span className="text-[10px] leading-tight">Şifa</span>
          </button>

          {/* 3: AI Mandala */}
          <button
            onClick={() => handleTabClick('mandala')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-[46px] ${
              activeTab === 'mandala'
                ? 'text-purple-300 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className={`w-5 h-5 mb-0.5 ${activeTab === 'mandala' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span className="text-[10px] leading-tight">Mandala</span>
          </button>

          {/* 4: Global Heatmap */}
          <button
            onClick={() => handleTabClick('heatmap')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-[46px] ${
              activeTab === 'heatmap'
                ? 'text-cyan-300 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className={`w-5 h-5 mb-0.5 ${activeTab === 'heatmap' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="text-[10px] leading-tight">Harita</span>
          </button>

          {/* 5: Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-[46px] ${
              isMobileMenuOpen
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 mb-0.5 text-emerald-400" />
            ) : (
              <Menu className="w-5 h-5 mb-0.5 text-slate-400" />
            )}
            <span className="text-[10px] leading-tight">Menü</span>
          </button>

        </div>
      </div>

    </header>
  );
};
