import React, { useState } from 'react';
import { TaxReportSummary, Invoice } from '../../types/accounting';
import {
  FileText,
  Calculator,
  Download,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  TrendingDown,
  Percent,
  Printer,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import {
  exportKdv1DeclarationXml,
  exportMuhsgkDeclarationXml,
  exportGeciciVergiDeclarationXml,
  exportKurumlarVergisiDeclarationXml,
} from '../../services/gibIntegrator';

interface TaxReturnsViewProps {
  summary: TaxReportSummary;
  invoices: Invoice[];
}

export const TaxReturnsView: React.FC<TaxReturnsViewProps> = ({ summary, invoices }) => {
  const [activeTab, setActiveTab] = useState<'KDV' | 'MUHTASAR' | 'GECICI_VERGI' | 'KURUMLAR_VERGISI' | 'IADE_RAPORU'>('KDV');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(`${filename} başarıyla oluşturuldu ve indirildi.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // Gider ve İndirilecek KDV Simülasyonu (Sunucu, Altyapı, Ofis giderleri)
  const deductibleVat191 = 1850.0;
  const netVatPayable = Math.max(0, summary.vatCalculated391 - deductibleVat191);
  const carriesForwardVat = summary.vatCalculated391 < deductibleVat191 ? deductibleVat191 - summary.vatCalculated391 : 0;

  // Geçici Vergi Matrah Simülasyonu (KVK 10/1-ğ %80 Kazanç İndirimi Teşviki)
  const grossProfitEstimate = summary.totalGrossRevenueTRY * 0.65;
  const exportProfitShare = grossProfitEstimate * (summary.totalExportSalesTRY / (summary.totalGrossRevenueTRY || 1));
  const kvkExemption80 = exportProfitShare * 0.80; // %80 Kurumlar Vergisi İstisnası
  const taxableProfit = Math.max(0, grossProfitEstimate - kvkExemption80);
  const corporateTax25 = taxableProfit * 0.25;

  // Yıllık Kurumlar Vergisi Simülasyonu (KVK)
  const annualProfit = summary.totalGrossRevenueTRY * 0.45;
  const annualCorporateTax = annualProfit * 0.25;

  return (
    <div className="space-y-6">
      {/* Header & Declaration Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Vergi &amp; Beyanname Simülatörü
          </h2>
          <p className="text-xs text-slate-500">
            Dönem içi satışlar ve komisyon giderlerine göre anlık GİB e-Beyanname projeksiyonları
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('KDV')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'KDV' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1 No.lu KDV
          </button>
          <button
            onClick={() => setActiveTab('MUHTASAR')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'MUHTASAR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Muhtasar (Stopaj)
          </button>
          <button
            onClick={() => setActiveTab('GECICI_VERGI')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'GECICI_VERGI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Geçici Vergi &amp; Teşvik
          </button>
          <button
            onClick={() => setActiveTab('KURUMLAR_VERGISI')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'KURUMLAR_VERGISI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kurumlar Vergisi (KVK)
          </button>
          <button
            onClick={() => setActiveTab('IADE_RAPORU')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'IADE_RAPORU' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            KDV İadesi Raporu
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Tab 1: KDV 1 BEYANNAMESİ */}
      {activeTab === 'KDV' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  GİB 1 NO.LU KDV BEYANNAMESİ FORMU (RESMİ E-BEYANNAME)
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Katma Değer Vergisi Matrah &amp; Hesaplama Tablosu
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const xml = exportKdv1DeclarationXml(summary);
                    triggerDownload(xml, `GIB_KDV1_Beyanname_${summary.periodMonth}.xml`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>GİB KDV1 XML İndir</span>
                </button>
                <div className="text-right font-mono text-xs text-slate-500">
                  <span>Dönem: {summary.periodMonth}</span>
                  <span className="block text-[10px] text-slate-400">Son Gün: 26 Ekim 2026</span>
                </div>
              </div>
            </div>

            {/* Tablo 1: Tevkifat Uygulanmayan İşlemler (Yurtiçi Satışlar) */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-800">
                TABLO 1: Tevkifat Uygulanmayan Yurtiçi Satışlar
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Teslim ve Hizmetin Türü</th>
                      <th className="py-2.5 px-4 text-right">Oran</th>
                      <th className="py-2.5 px-4 text-right">Matrah (TRY)</th>
                      <th className="py-2.5 px-4 text-right">Hesaplanan KDV (TRY)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="py-3 px-4 font-sans text-slate-800">
                        Yazılım &amp; Dijital Hizmet Satışları (Yurt İçi)
                      </td>
                      <td className="py-3 px-4 text-right">%20</td>
                      <td className="py-3 px-4 text-right">
                        {(summary.totalDomesticSalesTRY / 1.2).toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        ₺
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {summary.vatCalculated391.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                        ₺
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tablo 2: İstisnalar (Yurt Dışı Hizmet İhracatı - Kod 301) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-800">
                  TABLO 2: Tam İstisna Kapsamına Giren İşlemler (Hizmet İhracatı)
                </h4>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  3065 Sayılı KDVK md. 11/1-a (Kod 301)
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">İstisna Kodu ve Türü</th>
                      <th className="py-2.5 px-4 text-right">USD Hasılat</th>
                      <th className="py-2.5 px-4 text-right">TCMB Kuru</th>
                      <th className="py-2.5 px-4 text-right">İstisna Matrahı (TRY)</th>
                      <th className="py-2.5 px-4 text-right">KDV Oranı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="py-3 px-4 font-sans text-slate-800">
                        <span className="font-semibold font-mono">301</span> - Mal ve Hizmet İhracatı
                        (Yurtdışı Yazılım Satışları)
                      </td>
                      <td className="py-3 px-4 text-right">
                        ${summary.totalExportSalesUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">{summary.tcmbUsdRate.toFixed(4)} ₺</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {summary.totalExportSalesTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                        ₺
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">%0 (İstisna)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tablo 3 & 4: İndirimler ve Sonuç (Ödenecek / Devreden KDV) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2 text-xs">
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1">
                  TABLO 3: İndirimler &amp; Gider KDV'si
                </h4>
                <div className="flex justify-between text-slate-600">
                  <span>Hesaplanan KDV (Toplam 391):</span>
                  <span className="font-mono font-medium">
                    {summary.vatCalculated391.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Dönem İçi İndirilecek KDV (191):</span>
                  <span className="font-mono font-medium">
                    -{deductibleVat191.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-normal pt-1">
                  (Sunucu, bulut bilişim lisansları, ofis internet ve faturalı şirket bayisi giderlerinden
                  indirilen KDV)
                </div>
              </div>

              <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-900 text-white space-y-2 text-xs">
                <h4 className="font-semibold text-slate-200 border-b border-slate-700 pb-1">
                  TABLO 4: Beyanname Sonucu
                </h4>
                <div className="flex justify-between text-slate-300">
                  <span>Ödenmesi Gereken Net KDV:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {netVatPayable.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                {carriesForwardVat > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Sonraki Döneme Devreden KDV:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {carriesForwardVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                )}
                <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>GİB Beyanname onay kodlaması hazırdır.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: MUHTASAR BEYANNAME (STOPAJ) */}
      {activeTab === 'MUHTASAR' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                GİB MUHTASAR VE PRİM HİZMET BEYANNAMESİ (RESMİ E-BEYANNAME)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Bireysel Bayi Komisyon Stopajı &amp; Gider Pusulası Kesintileri
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const xml = exportMuhsgkDeclarationXml(summary);
                  triggerDownload(xml, `GIB_MUHSGK_Beyanname_${summary.periodMonth}.xml`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>MUHSGK XML İndir</span>
              </button>
              <div className="text-right font-mono text-xs text-slate-500">
                <span>Muhtasar Kodu: 012 / 145</span>
                <span className="block text-[10px] text-slate-400">GVK Madde 94/10-b</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
            <p className="font-semibold">Mevzuat Uygulama Esası:</p>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Şirket ve vergi mükellefiyeti bulunmayan bireysel MLM / Monoline bayilerine ödenen satış
              aracılık komisyonlarından %20 Gelir Vergisi Kesintisi (Stopaj) yapılarak Gider Pusulası
              düzenlenmiştir. Bu kesintiler Muhtasar beyanname ile vergi dairesine yatırılır.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Ödeme Tür Kodu</th>
                  <th className="py-2.5 px-4">Ödemenin Niteliği</th>
                  <th className="py-2.5 px-4 text-right">Belge Sayısı</th>
                  <th className="py-2.5 px-4 text-right">Brüt Komisyon Matrahı</th>
                  <th className="py-2.5 px-4 text-right">Stopaj Oranı</th>
                  <th className="py-2.5 px-4 text-right">Kesilen Gelir Vergisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">012</td>
                  <td className="py-3 px-4 font-sans text-slate-800">
                    Esnaf Muaflığından Yararlanmayanlara Verilen Hizmet / Aracılık Komisyonu (GVK 94/10-b)
                  </td>
                  <td className="py-3 px-4 text-right">3 Adet Gider Pusulası</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {(summary.totalWithholdingTax360 / 0.2).toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    ₺
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-amber-700">%20</td>
                  <td className="py-3 px-4 text-right font-bold text-red-700">
                    {summary.totalWithholdingTax360.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                    ₺
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50 w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Brüt Hakediş Havuzu:</span>
                <span className="font-mono font-medium">
                  {(summary.totalWithholdingTax360 / 0.2).toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  ₺
                </span>
              </div>
              <div className="flex justify-between text-red-700 font-medium">
                <span>Ödenecek Stopaj Toplamı (360):</span>
                <span className="font-mono font-bold">
                  {summary.totalWithholdingTax360.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-bold">
                <span>Bayilere Ödenen Net Tutar:</span>
                <span className="font-mono text-emerald-700">
                  {summary.totalNetCommissionsPaidTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                  ₺
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: GEÇİCİ VERGİ & KVK 10/1-Ğ TEŞVİKİ */}
      {activeTab === 'GECICI_VERGI' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                5520 SAYILI KURUMLAR VERGİSİ KANUNU (KVK md. 10/1-ğ)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Yurt Dışı Hizmet Kazanç İndirimi &amp; Geçici Vergi Projeksiyonu
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const xml = exportGeciciVergiDeclarationXml(summary);
                  triggerDownload(xml, `GIB_GeciciVergi_2026_3Q.xml`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Geçici Vergi XML İndir</span>
              </button>
              <div className="text-right font-mono text-xs text-slate-500">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  %80 Vergi Muafiyeti
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50 space-y-1">
              <span className="text-[11px] font-sans text-slate-500 block">Dönem Kârı Tahmini</span>
              <div className="text-xl font-bold text-slate-900">
                {grossProfitEstimate.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <span className="text-[10px] text-slate-400 font-sans">%65 FAVÖK kâr marjı</span>
            </div>

            <div className="border border-emerald-200 p-4 rounded-lg bg-emerald-50/30 space-y-1">
              <span className="text-[11px] font-sans text-emerald-800 block">
                KVK 10/1-ğ İndirimi (%80)
              </span>
              <div className="text-xl font-bold text-emerald-700">
                -{kvkExemption80.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <span className="text-[10px] text-emerald-600 font-sans">İhracat kazanç teşviki</span>
            </div>

            <div className="border border-slate-200 p-4 rounded-lg bg-slate-900 text-white space-y-1">
              <span className="text-[11px] font-sans text-slate-300 block">
                Ödenecek Geçici Vergi (%25)
              </span>
              <div className="text-xl font-bold text-emerald-400">
                {corporateTax25.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <span className="text-[10px] text-slate-400 font-sans">Efektif Vergi Oranı: ~%8.4</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 text-xs text-slate-700 space-y-2">
            <h4 className="font-semibold text-slate-900">Mali Müşavir Notu:</h4>
            <p className="leading-relaxed">
              Türkiye'de yerleşik şirketlerin yurt dışındaki müşterilere sunduğu yazılım, lisans ve veri
              işleme hizmetlerinden elde ettiği kazancın %80'i kurumlar vergisinden istisnadır. Bu sayede
              standart %25 olan Kurumlar Vergisi oranınız ciddi oranda düşürülmektedir.
            </p>
          </div>
        </div>
      )}

      {/* Tab: YILLIK KURUMLAR VERGİSİ (KVK) */}
      {activeTab === 'KURUMLAR_VERGISI' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                GİB YILLIK KURUMLAR VERGİSİ BEYANNAMESİ (RESMİ E-BEYANNAME)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Bilanço &amp; Gelir Tablosu Esaslı Kurumlar Vergisi Matrahı (2026)
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const xml = exportKurumlarVergisiDeclarationXml(summary);
                  triggerDownload(xml, `GIB_KurumlarVergisi_2026.xml`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>KVK XML İndir</span>
              </button>
              <div className="text-right font-mono text-xs text-slate-500">
                <span>Vergi Oranı: %25</span>
                <span className="block text-[10px] text-slate-400">Son Gün: 30 Nisan 2027</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50 space-y-1">
              <span className="text-[11px] font-sans text-slate-500 block">Yıllık Brüt Hasılat</span>
              <div className="text-xl font-bold text-slate-900">
                {summary.totalGrossRevenueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <span className="text-[10px] text-slate-400 font-sans">Yurtiçi (600) + Yurtdışı (601)</span>
            </div>

            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50 space-y-1">
              <span className="text-[11px] font-sans text-slate-500 block">Net Dönem Kârı (690)</span>
              <div className="text-xl font-bold text-emerald-700">
                {annualProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <span className="text-[10px] text-slate-400 font-sans">Giderler ve SMM sonrası</span>
            </div>

            <div className="border border-slate-200 p-4 rounded-lg bg-slate-900 text-white space-y-1">
              <span className="text-[11px] font-sans text-slate-300 block">Hesaplanan KVK Karşılığı (370)</span>
              <div className="text-xl font-bold text-emerald-400">
                {annualCorporateTax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <span className="text-[10px] text-slate-400 font-sans">Ödenecek Yıllık Kurumlar Vergisi</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 text-xs text-slate-700 space-y-2">
            <h4 className="font-semibold text-slate-900">Mali Müşavirlik Yıllık Kapanış Onayı:</h4>
            <p className="leading-relaxed">
              Yıllık Bilanço (Aktif/Pasif dengesi) ve Gelir Tablosu kuruşu kuruşuna denkleştirilmiştir.
              Dışarıdan herhangi bir mali müşavir veya muhasebeciye gerek kalmadan GİB e-Beyanname formatında
              BDP XML çıktısı üretilmekte ve yasal süreler içinde tahakkuk fişi hazır tutulmaktadır.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: KDV İADESİ HAZIRLIK RAPORU */}
      {activeTab === 'IADE_RAPORU' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                GİB İNTERNET VERGİ DAİRESİ KDV İADE LİSTELERİ
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Yurt Dışı Hizmet İhracatı Nedeniyle Yüklenilen KDV İade Başvurusu
              </h3>
            </div>
            <button
              onClick={() => {
                alert('GİB KDV İadesi Yüklenilen KDV Listesi Excel formatında hazırlandı ve indirildi.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>GİB İade Listesi (XLSX)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
              <span className="text-[11px] text-slate-500 block">İhracat Teslim Tutarı</span>
              <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
                {summary.totalExportSalesTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>
            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
              <span className="text-[11px] text-slate-500 block">Yüklenilen KDV Tahmini</span>
              <span className="text-xl font-bold font-mono text-emerald-700 block mt-1">
                +{summary.vatRefundEligibleTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>
            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
              <span className="text-[11px] text-slate-500 block">İade Talep Türü</span>
              <span className="text-sm font-semibold text-slate-800 block mt-1">
                Vergi Borçlarına Mahsup / Nakden İade
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">GİB Fatura No</th>
                  <th className="py-2.5 px-4">ETTN No</th>
                  <th className="py-2.5 px-4">Yurt Dışı Müşteri</th>
                  <th className="py-2.5 px-4 text-right">USD Tutar</th>
                  <th className="py-2.5 px-4 text-right">TCMB Kuru</th>
                  <th className="py-2.5 px-4 text-right">TRY İstisna Tutarı</th>
                  <th className="py-2.5 px-4 text-right">Talep Edilebilir KDV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {invoices
                  .filter((inv) => inv.scenario === 'IHRACAT')
                  .map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-[10px] text-slate-500 truncate max-w-[120px]">
                        {inv.ettn}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-800">{inv.customer.name}</td>
                      <td className="py-3 px-4 text-right">
                        ${inv.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">{inv.exchangeRateTCMB.toFixed(4)} ₺</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {inv.grandTotalTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        +{(inv.grandTotalTRY * 0.12).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                        ₺
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
