import React from 'react';
import {
  FileText,
  LayoutDashboard,
  FileSpreadsheet,
  Zap,
  RotateCcw,
  Package,
  Receipt,
  Globe,
  Users,
  Building2,
  Landmark,
  Briefcase,
  DownloadCloud,
  Brain,
  Sliders,
  DollarSign,
  Trash2,
  GitBranch,
} from 'lucide-react';
import { TCMB_RATES } from '../services/taxEngine';
import { LiveExchangeRates } from '../types/accounting';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingWithholdingCount: number;
  refundsCount: number;
  rates?: LiveExchangeRates;
  onOpenResetModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  pendingWithholdingCount,
  refundsCount,
  rates,
  onOpenResetModal,
}) => {
  const activeUsd = rates?.USD ?? TCMB_RATES.USD;
  const activeEur = rates?.EUR ?? TCMB_RATES.EUR;

  const navSections = [
    {
      title: 'YÖNETİM & DİREKTÖRLÜK',
      items: [
        {
          id: 'cfoReport',
          label: 'AKN CFO Yönetici Raporu',
          icon: FileText,
          badge: 'CFO',
        },
        {
          id: 'companySettings',
          label: 'Şirket & Vergi Profili',
          icon: Building2,
          badge: 'VUK',
        },
        { id: 'overview', label: 'Genel Mali Bakış', icon: LayoutDashboard },
        { id: 'invoices', label: 'e-Fatura & e-Arşiv', icon: FileSpreadsheet },
        { id: 'simulator', label: 'Satış & 3DS Motoru', icon: Zap },
        {
          id: 'clawback',
          label: 'Clawback & İade Motoru',
          icon: RotateCcw,
          badge: refundsCount > 0 ? `${refundsCount}` : undefined,
        },
      ],
    },
    {
      title: 'ENVANTER & VERGİ',
      items: [
        {
          id: 'taxAccrual',
          label: 'Vergi Dairesi Tahakkuk & İVD',
          icon: Landmark,
          badge: 'GİB',
        },
        { id: 'inventory', label: 'Stok & SMM (153/621)', icon: Package },
        { id: 'taxReturns', label: 'Vergi Simülasyonu & KDV', icon: Receipt },
        { id: 'oss', label: 'Uluslararası & AB OSS', icon: Globe },
      ],
    },
    {
      title: 'BAYİ & BANKACILIK',
      items: [
        {
          id: 'commissions',
          label: 'Bayi Komisyon & Stopaj',
          icon: Users,
          badge: pendingWithholdingCount > 0 ? `${pendingWithholdingCount}` : undefined,
        },
        { id: 'reconciliation', label: 'Cari & Ba/Bs Mutabakat', icon: Building2 },
        { id: 'banking', label: 'Açık Bankacılık (102)', icon: Landmark },
        { id: 'expenses', label: 'Şirket Gideri & Bordro', icon: Briefcase },
      ],
    },
    {
      title: 'DEFTER & ENTEGRASYON',
      items: [
        {
          id: 'monolineReconciliation',
          label: 'Monoline Mutabakat & Köprü',
          icon: GitBranch,
          badge: 'MLM',
        },
        { id: 'export', label: 'Luca / Zirve / e-Defter', icon: DownloadCloud },
        { id: 'aiAdvisor', label: 'AI Mali Müşavir Robotu', icon: Brain },
        { id: 'integrator', label: 'GİB Entegratör API', icon: Sliders },
      ],
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white flex-col shrink-0 select-none">
      {/* Live TCMB Ticker Bar */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Canlı TCMB Kurları
          </span>
          <span className="text-[10px] text-emerald-700 font-mono font-bold">Anlık İnternet</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block">USD/TRY</span>
            <span className="font-bold text-slate-900">{activeUsd.toFixed(3)} ₺</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block">EUR/TRY</span>
            <span className="font-bold text-slate-900">{activeEur.toFixed(3)} ₺</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="p-3 space-y-5 overflow-y-auto flex-1">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider">
              {sec.title}
            </p>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white text-slate-900' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Status & Reset Card */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 text-[11px] text-slate-500 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-700 font-semibold">GİB &amp; Open Banking</span>
          <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            Aktif (Sandbox)
          </span>
        </div>

        {onOpenResetModal && (
          <button
            onClick={onOpenResetModal}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-red-700 hover:text-red-800 bg-white hover:bg-red-50 border border-red-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Sistemi Sıfırla (Temizle)</span>
          </button>
        )}
      </div>
    </aside>
  );
};
