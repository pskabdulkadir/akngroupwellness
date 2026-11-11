import React, { useState } from 'react';
import { B2BReconciliation, BaBsItem } from '../../types/accounting';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building,
  Download,
  Search,
  Filter,
} from 'lucide-react';

interface ReconciliationBaBsViewProps {
  reconciliations: B2BReconciliation[];
  baBsItems: BaBsItem[];
}

export const ReconciliationBaBsView: React.FC<ReconciliationBaBsViewProps> = ({
  reconciliations,
  baBsItems,
}) => {
  const [activeTab, setActiveTab] = useState<'MUTABAKAT' | 'BABS'>('MUTABAKAT');
  const [notificationSent, setNotificationSent] = useState<string | null>(null);

  const handleSendReconciliationNotice = (rec: B2BReconciliation) => {
    setNotificationSent(`${rec.companyTitle} firmasına resmi e-Mutabakat mektubu ve bakiye onay linki e-posta ile iletildi.`);
    setTimeout(() => setNotificationSent(null), 4000);
  };

  const totalBaAmountTRY = baBsItems
    .filter((b) => b.type === 'FORM_BA')
    .reduce((sum, b) => sum + b.totalExcludingVatTRY, 0);

  const totalBsAmountTRY = baBsItems
    .filter((b) => b.type === 'FORM_BS')
    .reduce((sum, b) => sum + b.totalExcludingVatTRY, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>B2B Cari Hesap &amp; GİB Form Ba/Bs E-Mutabakat Modülü</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kurumsal bayiler ile aylık bakiye mutabakatı ve 5.000 TL üzeri mal/hizmet alım-satım bildirim kontrolü
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('MUTABAKAT')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'MUTABAKAT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cari E-Mutabakat ({reconciliations.length})
          </button>
          <button
            onClick={() => setActiveTab('BABS')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'BABS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GİB Form Ba / Bs ({baBsItems.length})
          </button>
        </div>
      </div>

      {notificationSent && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationSent}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            Form Ba (5.000 TL Üzeri Alışlar)
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {totalBaAmountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] font-sans text-slate-400">
            Kira, AWS ve Sunucu Alış Bildirimi
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            Form Bs (5.000 TL Üzeri Satışlar)
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {totalBsAmountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] font-sans text-slate-400">
            Mavi Yelken ve Kurumsal Müşteri Satışları
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            Mutabakat Durumu
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            %92 Mutabık
          </div>
          <span className="text-[10px] font-sans text-amber-700 font-medium">
            1 Bayi İtiraz İncelemede
          </span>
        </div>
      </div>

      {/* Tab 1: E-MUTABAKAT TABLOSU */}
      {activeTab === 'MUTABAKAT' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Kurumsal B2B Bayiler ile Aylık Cari Hesap Mutabakatı
              </h3>
              <p className="text-xs text-slate-500">
                Şirket bayilerinin sisteme kestiği faturalar ile cari hesap defter bakiyelerinin doğrulanması
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Kurumsal Bayi Adı</th>
                  <th className="py-3 px-4">VKN / Vergi Dairesi</th>
                  <th className="py-3 px-4 text-center">Dönem</th>
                  <th className="py-3 px-4 text-right">Bizim Bakiyemiz (320)</th>
                  <th className="py-3 px-4 text-right">Bayi Bildirimi</th>
                  <th className="py-3 px-4 text-right">Fark</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {reconciliations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      <div>{rec.companyTitle}</div>
                      {rec.disputeNotes && (
                        <span className="text-[10px] text-red-600 font-normal block mt-0.5">
                          İtiraz Notu: {rec.disputeNotes}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600">
                      <div>VKN: {rec.vkn}</div>
                      <span className="text-[10px] text-slate-400">{rec.taxOffice}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">{rec.period}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {rec.ourLedgerBalanceTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {rec.theirLedgerBalanceTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {rec.differenceTRY === 0 ? (
                        <span className="text-emerald-700">0.00 ₺</span>
                      ) : (
                        <span className="text-red-600">
                          {rec.differenceTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      {rec.status === 'MUTABIK' ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Mutabıkız
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          İtiraz Edildi
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => handleSendReconciliationNotice(rec)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors ml-auto shadow-2xs"
                      >
                        <Send className="w-3 h-3 text-slate-500" />
                        <span>Mektup Gönder</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: FORM BA / FORM BS TABLOSU */}
      {activeTab === 'BABS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                GİB 5.000 TL KDV Hariç Had Bildirimleri (Form Ba &amp; Form Bs)
              </h3>
              <p className="text-xs text-slate-500">
                213 sayılı VUK uyarınca aylık 5.000 TL ve üzeri mal/hizmet alım ve satımlarının yasal bildirim dökümü
              </p>
            </div>
            <button
              onClick={() => alert('GİB Form Ba ve Form Bs XML paketi e-Beyanname formatında indirildi.')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>GİB Ba/Bs XML Paketi</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Form Türü</th>
                  <th className="py-3 px-4">Muhatap Firma / Kurum</th>
                  <th className="py-3 px-4">VKN / Ülke</th>
                  <th className="py-3 px-4 text-center">Belge Adedi</th>
                  <th className="py-3 px-4 text-right">Toplam Matrah (KDV Hariç)</th>
                  <th className="py-3 px-4 text-center">5.000 TL Haddi</th>
                  <th className="py-3 px-4 text-center">GİB Bildirim Durumu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {baBsItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          item.type === 'FORM_BS'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.type === 'FORM_BS' ? 'Form Bs (Satış)' : 'Form Ba (Alış)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      {item.partnerName}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600">
                      <span className="font-mono">{item.taxNumber}</span> · {item.country}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-800">{item.documentCount} Belge</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {item.totalExcludingVatTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Haddi Aşıyor (Zorunlu)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        GİB Paketinde Hazır
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
