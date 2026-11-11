import React, { useState } from 'react';
import avatarFinance from '../assets/images/avatar_finance_director_1792512086747.jpg';
import {
  Plus,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  FileText,
  RotateCcw,
  LayoutDashboard,
  FileSpreadsheet,
  Receipt,
  Users,
  Landmark,
  GitBranch,
  Package,
  Briefcase,
  Building2,
  DownloadCloud,
  Brain,
  Sliders,
  Zap,
  Globe,
  Menu,
  X,
  CheckCircle2,
  ListOrdered,
} from 'lucide-react';
import { COMPANY_PROFILE, LiveExchangeRates } from '../types/accounting';
import { LiveCurrencyTicker } from './common/LiveCurrencyTicker';

interface TopBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenSimulator: () => void;
  onStartTour?: () => void;
  onRunAutoPilot?: () => void;
  onExplainPage?: () => void;
  rates: LiveExchangeRates;
  onRefreshRates: () => Promise<void>;
  onOpenResetModal: () => void;
  onReturnToWellness?: () => void;
  onOpenCpaModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onTabChange,
  onOpenSimulator,
  onRunAutoPilot,
  onExplainPage,
  rates,
  onRefreshRates,
  onOpenResetModal,
  onReturnToWellness,
  onOpenCpaModal,
}) => {
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);

  // Sıralı Modül Listesi (Sayfa Taşmasını Önleyen Liste Yapısı)
  const orderedModuleList = [
    { id: 'cfoReport', label: 'CFO Raporu', icon: FileText, badge: 'CFO' },
    { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'invoices', label: 'e-Faturalar', icon: FileSpreadsheet, badge: 'GİB' },
    { id: 'taxReturns', label: 'Beyannameler', icon: Receipt, badge: 'VUK' },
    { id: 'commissions', label: 'Komisyon & Stopaj', icon: Users, badge: '%20' },
    { id: 'taxAccrual', label: 'Vergi Dairesi', icon: Landmark, badge: 'İVD' },
    { id: 'monolineReconciliation', label: 'Monoline Köprü', icon: GitBranch, badge: 'MLM' },
    { id: 'inventory', label: 'Stok & SMM (153/621)', icon: Package },
    { id: 'banking', label: 'Açık Bankacılık (102)', icon: Landmark },
    { id: 'expenses', label: 'Şirket Gideri & Bordro', icon: Briefcase },
    { id: 'reconciliation', label: 'Cari & Ba/Bs Mutabakat', icon: Building2 },
    { id: 'export', label: 'Luca / Zirve / e-Defter', icon: DownloadCloud, badge: 'XML' },
    { id: 'aiAdvisor', label: 'AI Mali Müşavir', icon: Brain, badge: 'AI' },
    { id: 'companySettings', label: 'Şirket & Vergi Profili', icon: Building2 },
    { id: 'simulator', label: 'Satış & 3DS Motoru', icon: Zap },
    { id: 'clawback', label: 'Clawback & İade', icon: RotateCcw },
    { id: 'oss', label: 'Uluslararası & AB OSS', icon: Globe },
    { id: 'integrator', label: 'GİB Entegratör API', icon: Sliders },
  ];

  return (
    <div className="w-full max-w-full overflow-hidden flex flex-col bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* 1. ÜST KADEME (Brand, Kurumsal Kimlik, Kurlar & Birincil İşlemler) */}
      <header className="w-full flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white border-b border-slate-100">
        {/* Sol Alan: Kurumsal Kimlik & Portala Dönüş */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('cfoReport');
            }}
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs border border-slate-800">
              AKN
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-950 text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                {COMPANY_PROFILE.legalName}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                Sanal Finans Direktörü (AI CFO &amp; Mali Müşavir)
              </span>
            </div>
          </a>

          {onReturnToWellness && (
            <button
              onClick={onReturnToWellness}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-amber-300 hover:text-white border border-amber-400/50 text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="AKN Group Wellness & Monoline MLM Portalına Dön"
            >
              <span className="text-xs leading-none">←</span>
              <span>Wellness &amp; Bayi Portalı</span>
            </button>
          )}

          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Monoline Bağlantısı: Aktif (PostgreSQL-18)</span>
          </span>
        </div>

        {/* Sağ Alan: Kurlar, Otopilot, Yeni Satış, Sistemi Sıfırla & Profil */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Canlı TCMB Kurları Ticker */}
          <div className="shrink-0">
            <LiveCurrencyTicker rates={rates} onRefresh={onRefreshRates} />
          </div>

          {/* Dışarıya İhtiyaçsız Mali Müşavirlik Görev Listesi Butonu */}
          {onOpenCpaModal && (
            <button
              onClick={onOpenCpaModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-950 bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 border border-amber-400/80 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="Dışarıdan hiçbir mali müşavire gerek duymadan tüm yasal beyanname ve defter işlemlerini yapın"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-950" />
              <span className="hidden sm:inline">Mali Müşavirlik Kokpiti</span>
              <span className="sm:hidden">Kokpit</span>
            </button>
          )}

          {/* Sistemi Sıfırla (Reset System Button) */}
          <button
            onClick={onOpenResetModal}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
            title="Tüm simülasyon ve sahte verileri temizle / sistemi sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Sistemi Sıfırla</span>
          </button>

          {/* Sayfa Eğitmeni */}
          {onExplainPage && (
            <button
              onClick={onExplainPage}
              className="hidden 2xl:flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
              title="Sesli asistan bu ekranın ne işe yaradığını anlatsın"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}

          {/* AKN Muhasebe Otopilotu */}
          {onRunAutoPilot && (
            <button
              onClick={onRunAutoPilot}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-all whitespace-nowrap shadow-xs cursor-pointer shrink-0"
              title="Bekleyen fatura, stopaj, TCMB kurları ve vergi tamponunu tek tıkla otomatik yönet"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Otopilot</span>
            </button>
          )}

          {/* Yeni Satış */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span>Yeni Satış</span>
          </button>

          {/* Mali İşler Direktörü Avatarı */}
          <div className="flex items-center gap-2 pl-1.5 border-l border-slate-200 shrink-0">
            <img
              src={avatarFinance}
              alt="Mali İşler Direktörü"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
            <div className="hidden 2xl:block text-left text-xs leading-tight">
              <p className="font-bold text-slate-900">Ece Yılmaz</p>
              <p className="text-[10px] text-slate-500">Mali İşler Direktörü</p>
            </div>
          </div>

          {/* Liste Menüsü Aç / Kapat Butonu */}
          <button
            onClick={() => setIsListDrawerOpen(!isListDrawerOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              isListDrawerOpen
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Tüm muhasebe ve mali müşavirlik modüllerini dikey liste olarak aç/kapat"
          >
            <ListOrdered className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Modül Listesi</span>
          </button>
        </div>
      </header>

      {/* 2. LİSTE OLARAK SIRALANMIŞ YATAY ŞERİT (Sayfa Taşmasını Önleyen, Yatay Kaydırılabilir Liste) */}
      <nav
        aria-label="Muhasebe Modül Butonları Listesi"
        className="w-full bg-slate-950 text-slate-300 border-t border-slate-800 px-3 sm:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap text-xs select-none"
      >
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400/90 pr-2 border-r border-slate-800 shrink-0 flex items-center gap-1">
          <ListOrdered className="w-3 h-3 text-amber-400" />
          <span>Hızlı Liste:</span>
        </span>

        {orderedModuleList.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all shrink-0 cursor-pointer text-xs font-semibold ${
                isActive
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    isActive
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. AÇILIR TAM LİSTE PENCERESİ (Dikey Liste Olarak Düzenlenmiş ve Sayfa Taşmasını Engelleyen Görünüm) */}
      {isListDrawerOpen && (
        <div className="w-full bg-slate-900 text-white border-t border-slate-800 p-4 sm:p-6 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <ListOrdered className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Akıllı Muhasebe &amp; Mali Müşavirlik Tüm Modüller Listesi</span>
                  <span className="text-[10px] font-mono font-normal text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Dışarıdan Müşavire Sıfır Bağımlılık
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Aşağıdaki listeden dilediğiniz mali müşavirlik ve beyanname modülünü doğrudan seçebilirsiniz.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsListDrawerOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dikey / Çoklu Kolon Liste Izgarası */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {orderedModuleList.map((item, idx) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsListDrawerOpen(false);
                  }}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[10px] text-slate-400 w-4">{idx + 1}.</span>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span className="text-xs truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                        isActive
                          ? 'bg-slate-950 text-amber-300'
                          : 'bg-slate-900 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
