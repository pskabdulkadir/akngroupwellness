import React from 'react';
import { Invoice, CommissionPayout, AIAdvice, TaxReportSummary } from '../../types/accounting';
import {
  TrendingUp,
  Receipt,
  FileCheck,
  AlertCircle,
  ExternalLink,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';

interface OverviewViewProps {
  invoices: Invoice[];
  commissions: CommissionPayout[];
  summary: TaxReportSummary;
  aiAdvices: AIAdvice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  invoices,
  commissions,
  summary,
  aiAdvices,
  onSelectInvoice,
  onNavigateTab,
}) => {
  const topAdvice = aiAdvices[0];

  return (
    <div className="space-y-6">
      {/* Top Banner: AI Mali Müşavir Tavsiye Uyarısı */}
      {topAdvice && (
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono">
                  AI MALİ MÜŞAVİR TAVSİYESİ
                </span>
                <span className="text-slate-500 text-xs">·</span>
                <span className="text-xs text-slate-300 font-mono">
                  Vade: {topAdvice.statutoryDeadline}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                {topAdvice.title}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {topAdvice.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <button
              onClick={() => onNavigateTab('aiAdvisor')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <span>Tavsiyeyi İncele</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Grid (Single elevation, strictly tabular numerals, no decorative icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Toplam Ciro (TRY & USD) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Toplam Resmi Hasılat</span>
            <span className="font-mono text-[10px] text-slate-400">TRY Defter</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {summary.totalGrossRevenueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
            <span>Yurtiçi Satış:</span>
            <span className="font-semibold text-slate-700">
              {summary.totalDomesticSalesTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>

        {/* KPI 2: Global Hizmet İhracatı */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Yurt Dışı Hizmet İhracı</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              KDV %0 (Kod 301)
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ${summary.totalExportSalesUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
            <span>TCMB Karşılığı:</span>
            <span className="font-semibold text-slate-700">
              {summary.totalExportSalesTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>

        {/* KPI 3: Hesaplanan KDV (%20) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Hesaplanan KDV (391)</span>
            <span className="font-mono text-[10px] text-slate-400">1 No.lu Beyanname</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {summary.vatCalculated391.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
            <span>KDV İade Potansiyeli:</span>
            <span className="font-semibold text-emerald-700">
              +{summary.vatRefundEligibleTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>

        {/* KPI 4: Muhtasar Stopaj Kesintisi (Bireysel Bayiler) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Kesilen Stopaj (360)</span>
            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
              GVK 94/10-b (%20)
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {summary.totalWithholdingTax360.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
            <span>Net Komisyon Ödemesi:</span>
            <span className="font-semibold text-slate-700">
              {summary.totalNetCommissionsPaidTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>
      </div>

      {/* Enterprise Expansion Strip: 4 Additional Module KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Envanter & SMM */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Depo Stok Değeri (153)</span>
            <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
              SMM 621
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {summary.totalInventoryValueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <p className="text-[10px] text-slate-500">
            Dönem SMM Maliyeti: <strong className="font-mono text-slate-700">{summary.totalSmmCostTRY.toLocaleString('tr-TR')} ₺</strong>
          </p>
        </div>

        {/* Clawback & İadeler */}
        <div
          onClick={() => onNavigateTab('clawback')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Clawback / İadeler (610)</span>
            <span className="font-mono text-[10px] text-red-700 bg-red-50 px-1.5 py-0.2 rounded">
              e-İade Fatura
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-red-600">
            -{summary.totalClawbacksTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <p className="text-[10px] text-slate-500">
            İade Edilen Satış: <strong className="font-mono text-slate-700">{summary.totalRefundsTRY.toLocaleString('tr-TR')} ₺</strong>
          </p>
        </div>

        {/* AB OSS KDV Havuzu */}
        <div
          onClick={() => onNavigateTab('oss')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>AB OSS KDV Havuzu</span>
            <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
              B2C Yerel KDV
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-blue-900">
            €{summary.euOssVatPayableEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">
            TCMB Karşılığı: <strong className="font-mono text-slate-700">{(summary.euOssVatPayableEUR * summary.tcmbEurRate).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong>
          </p>
        </div>

        {/* Şirket İçi Giderler & KDV 191 */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Şirket Giderleri (760/770)</span>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
              191 KDV İndirimi
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {summary.totalExpenses770TRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <p className="text-[10px] text-slate-500">
            İndirilecek KDV: <strong className="font-mono text-emerald-700">+{summary.vatDeductible191.toLocaleString('tr-TR')} ₺</strong>
          </p>
        </div>
      </div>

      {/* İki Kolonlu Vergi Simülasyonu & Satış Dağılımı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol 2 Kolon: Ay Sonu Vergi Simülasyonu ve Yasal Takvim */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Ay Sonu Tahmini Vergi Yükümlülükleri Simülatörü
              </h3>
              <p className="text-xs text-slate-500">
                Resmi GİB Beyanname ödeme takvimi ve nakit akışı projeksiyonu
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('taxReturns')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Beyanname Detayı</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500 block">
                1 No.lu KDV Beyannamesi
              </span>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {summary.vatPayableNet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <p className="text-[10px] text-slate-500">
                Ödeme Son Günü: <span className="font-mono font-semibold text-slate-700">26 Ekim 2026</span>
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500 block">
                Muhtasar ve Prim Hizmet (Stopaj)
              </span>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {summary.totalWithholdingTax360.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <p className="text-[10px] text-slate-500">
                Ödeme Son Günü: <span className="font-mono font-semibold text-slate-700">26 Ekim 2026</span>
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500 block">
                Geçici Vergi Tahmini (%25)
              </span>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {summary.estimatedCorporateTaxTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <p className="text-[10px] text-slate-500">
                Dönem: <span className="font-mono font-semibold text-slate-700">4. Çeyrek (17 Kasım)</span>
              </p>
            </div>
          </div>

          {/* Nakit Likiditesi Rezerv Göstergesi */}
          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Öngörülen Toplam Vergi Ödeme Likiditesi (KDV + Stopaj)
              </span>
              <span className="font-mono font-bold text-amber-900 text-sm">
                {(summary.vatPayableNet + summary.totalWithholdingTax360).toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                })}{' '}
                ₺
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Sanal POS tahsilat hesabınızda ay sonuna kadar en az yukarıdaki tutar kadar likit blokaj
              sağlamanız vergi cezaları ve gecikme faizi riskini önleyecektir.
            </p>
          </div>
        </div>

        {/* Sağ Kolon: Çift Para Birimi & Satış Ayrımı */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Satış &amp; KDV Dağılımı
            </h3>
            <p className="text-xs text-slate-500">
              Yurt İçi (%20 KDV) vs Global ($3x$ Hizmet İhracı)
            </p>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Yurt İçi TRY Satışlar (%20 KDV)</span>
                <span className="font-semibold text-slate-900">
                  {summary.totalDomesticSalesTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (summary.totalDomesticSalesTRY / summary.totalGrossRevenueTRY) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Yurt Dışı Global Hizmet İhracı (%0 KDV)</span>
                <span className="font-semibold text-emerald-700">
                  {summary.totalExportSalesTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (summary.totalExportSalesTRY / summary.totalGrossRevenueTRY) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>TCMB Gösterge USD/TRY:</span>
                <span className="font-bold text-slate-800">{summary.tcmbUsdRate.toFixed(4)} ₺</span>
              </div>
              <div className="flex justify-between">
                <span>Resmi Muhasebe Senaryosu:</span>
                <span className="font-bold text-slate-800">Çift Para Birimli Yevmiye</span>
              </div>
              <div className="flex justify-between">
                <span>Özel Entegratör Protokolü:</span>
                <span className="font-bold text-emerald-700">Uyumsoft GİB API</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Son Kesilen e-Fatura / e-Arşiv Tablosu */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Son Düzenlenen e-Fatura &amp; e-Arşiv Belgeleri
            </h3>
            <p className="text-xs text-slate-500">
              3DS onaylı siparişlerden otomatik tanzim edilen yasal faturalar
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('invoices')}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>Tüm Faturaları Gör ({invoices.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Fatura No</th>
                <th className="py-2.5 px-4">Alıcı Müşteri</th>
                <th className="py-2.5 px-4">Senaryo / Tip</th>
                <th className="py-2.5 px-4">Tarih</th>
                <th className="py-2.5 px-4 text-right">Tutar</th>
                <th className="py-2.5 px-4 text-right">TRY Karşılığı</th>
                <th className="py-2.5 px-4 text-center">GİB Durumu</th>
                <th className="py-2.5 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">Henüz kayıtlı fatura bulunmuyor.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Sistem canlıya hazır şekilde sıfırlandı. Sağ üstteki &quot;Yeni Satış&quot; butonunu kullanarak ilk canlı faturanızı kesebilirsiniz.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 truncate max-w-xs">{inv.customer.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {inv.customer.taxNumber} · {inv.customer.city}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-700 font-medium">
                        {inv.scenario === 'IHRACAT' ? 'Hizmet İhracı (%0)' : inv.scenario}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{inv.issueDate}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {inv.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {inv.currency}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {inv.grandTotalTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        1200 Başarılı
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectInvoice(inv)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        Görüntüle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
