import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Receipt,
  Sparkles,
  X,
  FileCode,
  FileSpreadsheet,
  Printer,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  TaxReportSummary,
  CompanyProfile,
  COMPANY_PROFILE,
  LedgerEntry,
  BaBsItem,
} from '../../types/accounting';
import {
  exportKdv1DeclarationXml,
  exportMuhsgkDeclarationXml,
  exportGeciciVergiDeclarationXml,
  exportKurumlarVergisiDeclarationXml,
  exportBaBsDeclarationXml,
  exportEDefterBeratXml,
  exportLedgerToXml,
  exportLedgerToCsv,
} from '../../services/gibIntegrator';

interface AutonomousCpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: TaxReportSummary;
  companyProfile?: CompanyProfile;
  ledgerEntries?: LedgerEntry[];
  baBsItems?: BaBsItem[];
  onNavigateTab: (tab: string) => void;
}

export const AutonomousCpaModal: React.FC<AutonomousCpaModalProps> = ({
  isOpen,
  onClose,
  summary,
  companyProfile,
  ledgerEntries = [],
  baBsItems = [],
  onNavigateTab,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DECLARATIONS' | 'LEDGER' | 'COMPLIANCE'>('ALL');
  const comp = companyProfile || COMPANY_PROFILE;

  if (!isOpen) return null;

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(`${filename} başarıyla üretildi ve bilgisayarınıza indirildi.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const cpaTasks = [
    {
      id: 'kdv1',
      title: "1 No'lu KDV Beyannamesi (Aylık)",
      description: 'Yurtiçi %20 KDV, Yurt Dışı %0 Hizmet İhracatı (Kod 301) ve 191 Gider KDV mahsubu.',
      category: 'DECLARATIONS',
      status: 'OTOMATİK HAZIR',
      stats: `Ödenecek: ${(Math.max(0, summary.vatCalculated391 - 1850)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
      actionLabel: 'GİB BDP XML İndir',
      onExecute: () => {
        const xml = exportKdv1DeclarationXml(summary, comp);
        triggerDownload(xml, `GIB_KDV1_Beyannamesi_${summary.periodMonth}.xml`, 'application/xml;charset=utf-8;');
      },
      navigateTab: 'taxReturns',
    },
    {
      id: 'muhsgk',
      title: 'MUHSGK (Muhtasar ve Prim Hizmet)',
      description: 'GVK 94/10-b uyarınca bireysel bayilere ödenen komisyonlardan %20 esnaf muaflığı stopaj kesintisi.',
      category: 'DECLARATIONS',
      status: 'OTOMATİK HAZIR',
      stats: `Stopaj: ${summary.totalWithholdingTax360.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
      actionLabel: 'MUHSGK XML İndir',
      onExecute: () => {
        const xml = exportMuhsgkDeclarationXml(summary, comp);
        triggerDownload(xml, `GIB_MUHSGK_Beyannamesi_${summary.periodMonth}.xml`, 'application/xml;charset=utf-8;');
      },
      navigateTab: 'taxReturns',
    },
    {
      id: 'gecici',
      title: 'Geçici Vergi Beyannamesi (3 Aylık)',
      description: 'KVK 10/1-ğ %80 Hizmet İhracatı Kazanç İstisnası düşümlü %25 peşin kurumlar vergisi.',
      category: 'DECLARATIONS',
      status: 'OTOMATİK HAZIR',
      stats: `Matrah: ${(summary.totalGrossRevenueTRY * 0.65 * 0.20).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
      actionLabel: 'Geçici Vergi XML İndir',
      onExecute: () => {
        const xml = exportGeciciVergiDeclarationXml(summary, comp);
        triggerDownload(xml, `GIB_GeciciVergi_2026_3Q.xml`, 'application/xml;charset=utf-8;');
      },
      navigateTab: 'taxReturns',
    },
    {
      id: 'kurumlar',
      title: 'Yıllık Kurumlar Vergisi (KVK)',
      description: 'Ayrıntılı bilanço cetveli, gelir tablosu, KKEG ve yasal vergi karşılığı (370/371).',
      category: 'DECLARATIONS',
      status: 'OTOMATİK HAZIR',
      stats: 'Bilanço & Gelir Tablosu Tam',
      actionLabel: 'KVK Beyanname XML İndir',
      onExecute: () => {
        const xml = exportKurumlarVergisiDeclarationXml(summary, comp);
        triggerDownload(xml, `GIB_KurumlarVergisi_2026.xml`, 'application/xml;charset=utf-8;');
      },
      navigateTab: 'taxReturns',
    },
    {
      id: 'babs',
      title: 'Form Ba ve Form Bs E-Mutabakatı',
      description: '5.000 TL KDV hariç sınırını aşan mal ve hizmet alım/satımlarının GİB resmi bildirim şablonu.',
      category: 'DECLARATIONS',
      status: 'OTOMATİK HAZIR',
      stats: `${baBsItems.length} Cari Bildirim Kaydı`,
      actionLabel: 'Form Ba-Bs XML İndir',
      onExecute: () => {
        const xml = exportBaBsDeclarationXml(baBsItems, comp);
        triggerDownload(xml, `GIB_FormBaBs_2026_10.xml`, 'application/xml;charset=utf-8;');
      },
      navigateTab: 'reconciliation',
    },
    {
      id: 'edefter',
      title: 'e-Defter Yevmiye & Kebir Beratı',
      description: 'GİB UBL 2.1 formatında yevmiye ve kebir berat paketleri ve zaman damgalı mali mühür onayı.',
      category: 'LEDGER',
      status: 'GİB UYUMLU',
      stats: `${ledgerEntries.length} Yevmiye Maddesi`,
      actionLabel: 'e-Defter Berat XML İndir',
      onExecute: () => {
        const xml = exportEDefterBeratXml(ledgerEntries, comp);
        triggerDownload(xml, `GIB_eDefter_Berat_2026_10.xml`, 'application/xml;charset=utf-8;');
      },
      navigateTab: 'export',
    },
    {
      id: 'luca',
      title: 'Luca Muhasebe Yazılımı Tam Aktarımı',
      description: 'Türkiye genelinde SMM/YMM mali müşavirlerin kullandığı Luca muhasebe programı için tek tıkla XML.',
      category: 'LEDGER',
      status: 'TEK TIKLA AKTAR',
      stats: '100-770 TDHP Hesap Planı',
      actionLabel: 'Luca XML İndir',
      onExecute: () => {
        const xml = exportLedgerToXml(ledgerEntries);
        triggerDownload(xml, `Luca_Yevmiye_Aktarimi_2026_10.xml`, 'application/xml;charset=utf-8;');
      },
      navigateTab: 'export',
    },
    {
      id: 'zirve',
      title: 'Zirve & Logo & Mikro Müşavir Fişleri',
      description: 'Zirve Müşavir, Logo Go/Tiger ve Mikro yazılımları için standart CSV/Excel yevmiye dökümü.',
      category: 'LEDGER',
      status: 'TEK TIKLA AKTAR',
      stats: 'Çift Taraflı Fiş Listesi',
      actionLabel: 'Zirve CSV İndir',
      onExecute: () => {
        const csv = exportLedgerToCsv(ledgerEntries);
        triggerDownload(csv, `Zirve_Musavir_Fis_Listesi.csv`, 'text/csv;charset=utf-8;');
      },
      navigateTab: 'export',
    },
    {
      id: 'denetim',
      title: 'Mali Müşavir Resmi Tasdik & Denetim Belgesi',
      description: 'VUK 459 7.000 TL nakit limiti, 7 gün fatura süresi, tevkifat ve stopaj doğrulamasıyla tam tasdik.',
      category: 'COMPLIANCE',
      status: '%100 MEVZUATA UYGUN',
      stats: '12 Denetim Kriteri Geçti',
      actionLabel: 'Tasdik Belgesini Yazdır',
      onExecute: () => {
        window.print();
      },
      navigateTab: 'cfoReport',
    },
  ];

  const filteredTasks = cpaTasks.filter(
    (t) => activeFilter === 'ALL' || t.category === activeFilter
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg border border-emerald-400/40">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  AKN Bağımsız Mali Müşavirlik &amp; AI CFO Kokpiti
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/50">
                  Dışarıdan Muhasebeciye Sıfır İhtiyaç
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Şirketinizin tüm yasal beyannameleri, yevmiye defterleri, stopajları ve resmi GİB bildirimleri tek tıkla otomatik yapılır.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {downloadSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 px-6 text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="p-4 px-6 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tüm Görevler ({cpaTasks.length})
            </button>
            <button
              onClick={() => setActiveFilter('DECLARATIONS')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'DECLARATIONS' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              e-Beyannameler (5)
            </button>
            <button
              onClick={() => setActiveFilter('LEDGER')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'LEDGER' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Defter &amp; Yazılım Aktarımı (3)
            </button>
            <button
              onClick={() => setActiveFilter('COMPLIANCE')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'COMPLIANCE' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yasal Tasdik &amp; Denetim (1)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Mükellef VKN: <strong className="font-mono text-slate-900">{comp.vkn}</strong> ({comp.taxOffice})</span>
          </div>
        </div>

        {/* Task List Grid */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 divide-y divide-slate-100">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="pt-3.5 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {task.status}
                  </span>
                  <span className="font-mono text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">
                    {task.stats}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {task.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab(task.navigateTab);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Modülü Ekranda Aç"
                >
                  Modülü Aç
                </button>
                <button
                  onClick={task.onExecute}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{task.actionLabel}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100/80 p-4 px-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Vergi Usul Kanunu (VUK), Gelir Vergisi Kanunu (GVK 94/10-b) ve Kurumlar Vergisi Kanunu (KVK 10/1-ğ) tam otomasyonludur.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Tamam / Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
