import React, { useState } from 'react';
import {
  TaxReportSummary,
  CompanyProfile,
  TaxOfficeAccrual,
  Invoice,
} from '../../types/accounting';
import { SpeechEngine } from '../../services/voiceAssistant';
import {
  Landmark,
  Receipt,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Download,
  ExternalLink,
  CreditCard,
  Building2,
  FileSpreadsheet,
  Clock,
  Copy,
  Check,
  Printer,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  FileCode,
  X,
} from 'lucide-react';

interface TaxOfficeAccrualsViewProps {
  summary: TaxReportSummary;
  companyProfile: CompanyProfile;
  accruals: TaxOfficeAccrual[];
  invoices: Invoice[];
  onUpdateAccrual: (updated: TaxOfficeAccrual) => void;
  onNavigateTab: (tab: string) => void;
}

export const TaxOfficeAccrualsView: React.FC<TaxOfficeAccrualsViewProps> = ({
  summary,
  companyProfile,
  accruals,
  onUpdateAccrual,
  onNavigateTab,
}) => {
  const [selectedAccrualForPayment, setSelectedAccrualForPayment] = useState<TaxOfficeAccrual | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [kdvIadeDownloaded, setKdvIadeDownloaded] = useState(false);
  const [showSmmmModal, setShowSmmmModal] = useState(false);

  // Toplam Devlete Ödenecek Tahakkuk
  const totalUnpaidTax = accruals
    .filter((a) => a.paymentStatus === 'UNPAID')
    .reduce((sum, a) => sum + a.totalDueTRY, 0);

  const totalPaidTax = accruals
    .filter((a) => a.paymentStatus === 'PAID')
    .reduce((sum, a) => sum + a.totalDueTRY, 0);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleMarkAsPaid = (accrual: TaxOfficeAccrual) => {
    const updated: TaxOfficeAccrual = {
      ...accrual,
      paymentStatus: 'PAID',
      paidAt: new Date().toLocaleString('tr-TR'),
      bankReceiptNo: `DEK-TCMB-${Math.floor(100000 + Math.random() * 900000)}`,
    };
    onUpdateAccrual(updated);
    if (selectedAccrualForPayment?.id === accrual.id) {
      setSelectedAccrualForPayment(updated);
    }
    SpeechEngine.speak(
      `${accrual.title} tutarı ${accrual.totalDueTRY.toLocaleString('tr-TR')} TL başarıyla ödendi olarak işaretlendi.`
    );
  };

  // KDV İadesi Dosyası (GİB Yüklenilen KDV Listesi) İndir
  const handleDownloadKdvIadeReport = () => {
    const kdvXml = `<?xml version="1.0" encoding="UTF-8"?>
<KdvIadeDosyasi xmlns="urn:gib:gov:tr:kdv:iade:v1">
  <MukellefBilgileri>
    <Unvan>${companyProfile.legalName}</Unvan>
    <VKN>${companyProfile.vkn}</VKN>
    <VergiDairesi>${companyProfile.taxOffice}</VergiDairesi>
    <Donem>${summary.periodMonth}</Donem>
  </MukellefBilgileri>
  <IstisnaTuru>
    <Kod>301</Kod>
    <Aciklama>3065 Sayılı KDVK 11/1-a Hizmet İhracatı</Aciklama>
    <IhracatTutariUSD>${summary.totalExportSalesUSD}</IhracatTutariUSD>
    <IhracatTutariTRY>${summary.totalExportSalesTRY}</IhracatTutariTRY>
    <TalepEdilenKdvIadesiTRY>${summary.vatRefundEligibleTRY}</TalepEdilenKdvIadesiTRY>
  </IstisnaTuru>
  <YuklenilenKdvListesi>
    <SiraNo>1</SiraNo>
    <GiderTuru>Yazılım Sunucu ve Bulut Altyapısı</GiderTuru>
    <FaturaNo>GİB2026000019284</FaturaNo>
    <KdvTutariTRY>1850.00</KdvTutariTRY>
  </YuklenilenKdvListesi>
</KdvIadeDosyasi>`;

    const blob = new Blob([kdvXml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GIB_Yuklenilen_KDV_Listesi_${companyProfile.vkn}_Ekim2026.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setKdvIadeDownloaded(true);
    setTimeout(() => setKdvIadeDownloaded(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xl tracking-wider text-emerald-400 shrink-0">
              <Landmark className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-widest">
                  Vergi Dairesi Tahakkuk ve İVD Ödeme Takip Modülü
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  GİB İnteraktif VD Entegre
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight mt-1">
                {companyProfile.taxOffice} — Vergi Borç &amp; Tahakkuk Dökümü
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {companyProfile.legalName} adına tahakkuk eden KDV-1, Muhtasar Stopaj ve Geçici Vergi
                yükümlülüklerinin kuruşu kuruşuna resmi vergi dairesi dökümü, ödeme referansları ve GİB barkodları.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadKdvIadeReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{kdvIadeDownloaded ? 'İade Dosyası İndirildi ✓' : 'KDV İadesi XML Dosyası'}</span>
            </button>

            <button
              onClick={() => setShowSmmmModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>SMMM Portalı</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Özet Metrik Kartı */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Kart 1: Kayıtlı Vergi Dairesi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-700" />
              Kayıtlı Vergi Dairesi
            </span>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
              Kod: {companyProfile.taxOfficeCode || '34251'}
            </span>
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 block truncate">
              {companyProfile.taxOffice}
            </span>
            <span className="text-xs font-mono text-slate-500">
              VKN: {companyProfile.vkn}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Şirket Profili:</span>
            <button
              onClick={() => onNavigateTab('companySettings')}
              className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Vergi Dairesini Değiştir</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Kart 2: Ödenecek Toplam Vergi Borcu */}
        <div className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Ödeme Bekleyen Tahakkuklar
            </span>
            <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              {accruals.filter((a) => a.paymentStatus === 'UNPAID').length} Adet
            </span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-amber-950 font-mono">
              {totalUnpaidTax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
            <p className="text-[11px] text-amber-800 mt-0.5">
              KDV-1 + Muhtasar Stopaj + Yasal Damga Vergileri
            </p>
          </div>
          <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-xs text-amber-900">
            <span>En Erken Son Ödeme:</span>
            <span className="font-mono font-bold text-rose-700">26 Ekim 2026</span>
          </div>
        </div>

        {/* Kart 3: Korumalı Vergi Tamponu & Ödenenler */}
        <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Korumalı Vergi Tamponu
            </span>
            <span className="text-[10px] font-mono bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded font-bold">
              Kasadaki Emanet
            </span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white font-mono">
              {(summary.vatPayableNet + summary.totalWithholdingTax360).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
            <p className="text-[11px] text-emerald-200 mt-0.5">
              Hesap 102.99 Vergi Rezervinde bloke tutulmaktadır
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-100">
            <span>Dönem İçi Ödenen:</span>
            <span className="font-mono font-bold">{totalPaidTax.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>
      </div>

      {/* Sesli Asistan Örnek Soru Banner'ı */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Sesli Asistan Vergi Danışmanı:</span>{' '}
            Asistana <em>"Bu ay hangi vergi dairesine ne kadar yatıracağız?"</em> diye sorduğunuzda,
            {companyProfile.taxOffice} vergi dairesine ait KDV ve stopaj borçlarını kuruşu kuruşuna seslendirir.
          </div>
        </div>
        <button
          onClick={() =>
            SpeechEngine.speak(
              `${companyProfile.legalName} adına ${companyProfile.taxOffice} vergi dairesine bu ay toplam ${totalUnpaidTax.toLocaleString(
                'tr-TR'
              )} Türk Lirası tahakkuk ödememiz var. Bunun 4.300 TL'si KDV, 3.820 TL'si ise bayilerimizin komisyon stopajıdır. Ödeme son günü ayın 26'sıdır.`
            )
          }
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition-colors ml-4"
        >
          Sesli Dinle
        </button>
      </div>

      {/* Detaylı Tahakkuk Tablosu */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Resmî Vergi Dairesi Tahakkuk Fişleri &amp; Ödeme Referansları
            </h3>
            <p className="text-[11px] text-slate-500">
              3065 KDVK ve 193 GVK uyarınca GİB sistemine intikal eden resmî vergi tahakkuk dökümü
            </p>
          </div>
          <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded">
            {accruals.length} Aktif Tahakkuk Fişi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 font-semibold">Vergi Kodu / Beyanname</th>
                <th className="py-3 px-3 font-semibold">Dönem</th>
                <th className="py-3 px-3 font-semibold">Vergi Dairesi</th>
                <th className="py-3 px-3 font-semibold text-right">Vergi Matrahı</th>
                <th className="py-3 px-3 font-semibold text-right">Net Vergi</th>
                <th className="py-3 px-3 font-semibold text-right">Damga Vergisi</th>
                <th className="py-3 px-3 font-semibold text-right">Toplam Ödenecek</th>
                <th className="py-3 px-3 font-semibold">Son Ödeme</th>
                <th className="py-3 px-3 font-semibold text-center">Durum</th>
                <th className="py-3 px-3 font-semibold text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {accruals.map((item) => {
                const isPaid = item.paymentStatus === 'PAID';
                const isScheduled = item.paymentStatus === 'SCHEDULED';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Vergi Kodu / Başlık */}
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-mono">
                          {item.taxCode}
                        </span>
                        <span>{item.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Fiş: {item.accrualSlipNumber}
                      </span>
                    </td>

                    {/* Dönem */}
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">{item.taxPeriod}</td>

                    {/* Vergi Dairesi */}
                    <td className="py-3 px-3 font-sans text-slate-700 whitespace-nowrap">
                      {companyProfile.taxOffice}
                    </td>

                    {/* Matrah */}
                    <td className="py-3 px-3 text-right text-slate-700">
                      {item.taxableBaseTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>

                    {/* Net Vergi */}
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {item.netTaxTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>

                    {/* Damga Vergisi */}
                    <td className="py-3 px-3 text-right text-slate-600">
                      {item.stampDutyTRY.toFixed(2)} ₺
                    </td>

                    {/* Toplam Ödenecek */}
                    <td className="py-3 px-3 text-right font-extrabold text-slate-950 text-xs">
                      {item.totalDueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>

                    {/* Son Ödeme */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`font-sans font-semibold ${isPaid ? 'text-slate-400' : 'text-rose-700'}`}>
                        {item.statutoryDeadline}
                      </span>
                    </td>

                    {/* Durum */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> ÖDENDİ
                        </span>
                      ) : isScheduled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3" /> ÇEYREK SONU
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" /> BEKLİYOR
                        </span>
                      )}
                    </td>

                    {/* İşlem */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedAccrualForPayment(item)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3 text-emerald-400" />
                          <span>İVD / Öde</span>
                        </button>

                        {!isPaid && (
                          <button
                            onClick={() => handleMarkAsPaid(item)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold transition-colors"
                            title="Ödendi olarak işaretle"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* İVD Ödeme Referansı & Barkod Modalı */}
      {selectedAccrualForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold">GİB İnteraktif Vergi Dairesi Ödeme Referansı</h4>
                  <p className="text-[11px] text-slate-300">
                    {selectedAccrualForPayment.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccrualForPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Tutar & Durum Özeti */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Ödenecek Toplam Tutar:</span>
                  <span className="text-2xl font-black font-mono text-slate-900">
                    {selectedAccrualForPayment.totalDueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Son Ödeme Tarihi:</span>
                  <span className="font-mono font-bold text-rose-700 text-xs">
                    {selectedAccrualForPayment.statutoryDeadline}
                  </span>
                </div>
              </div>

              {/* Vergi Dairesi & Mükellef Bilgisi */}
              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Mükellef Unvanı:</span>
                  <span className="font-semibold text-slate-900">{companyProfile.legalName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Vergi Dairesi:</span>
                  <span className="font-semibold text-slate-900">{companyProfile.taxOffice}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">VKN (Vergi Kimlik No):</span>
                  <span className="font-mono font-bold text-slate-900">{companyProfile.vkn}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Vergi Türü Kodu:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedAccrualForPayment.taxCode} — {selectedAccrualForPayment.title}
                  </span>
                </div>
              </div>

              {/* 16 Haneli GİB Takip Referansı & Barkod */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                    GİB Resmî Ödeme Takip Numarası
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(selectedAccrualForPayment.gibTrackingReference, 'gibRef')
                    }
                    className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white"
                  >
                    {copiedCode === 'gibRef' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="font-mono font-bold text-lg tracking-widest text-center text-emerald-300 bg-white/5 py-2 rounded-lg border border-white/10">
                  {selectedAccrualForPayment.gibTrackingReference.replace(/(\d{4})/g, '$1 ').trim()}
                </div>

                {/* Barkod Görsel Simülasyonu */}
                <div className="bg-white text-slate-950 p-2.5 rounded-lg flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 h-10 w-full justify-center">
                    {Array.from({ length: 42 }).map((_, i) => (
                      <span
                        key={i}
                        className="bg-black inline-block h-full"
                        style={{
                          width: `${(i % 3) + 1.5}px`,
                          opacity: i % 5 === 0 ? 0.3 : 1,
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] text-slate-500 mt-1">
                    *{selectedAccrualForPayment.gibTrackingReference}*
                  </span>
                </div>
              </div>

              {/* Banka Entegrasyon Açıklaması */}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Bu referans numarası ile <strong>Ziraat Bankası, Halkbank, Vakıfbank, Garanti, İş Bankası, Akbank</strong> veya <strong>ivd.gib.gov.tr</strong> üzerinden kredi kartı veya hesaptan vergi ödemenizi anında gerçekleştirebilirsiniz.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <a
                href="https://ivd.gib.gov.tr"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-slate-950 underline"
              >
                <span>İnteraktif Vergi Dairesi (İVD) Portalı</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                {selectedAccrualForPayment.paymentStatus !== 'PAID' && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedAccrualForPayment)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Ödendi Olarak İşle
                  </button>
                )}
                <button
                  onClick={() => setSelectedAccrualForPayment(null)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMMM Read-Only Portalı Modalı */}
      {showSmmmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 bg-purple-950 text-white">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-purple-300" />
                <div>
                  <h4 className="text-sm font-bold">Mali Müşavir (SMMM) Doğrudan Salt Okunur Portalı</h4>
                  <p className="text-[11px] text-purple-200">
                    Dışarıdan hizmet alınan Mali Müşavirler için güvenli yasal defter ve tahakkuk indirme alanı
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSmmmModal(false)}
                className="p-1 rounded-lg text-purple-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 flex items-center justify-between">
                <div>
                  <span className="font-bold block">SMMM Erişim Durumu: AKTİF (Salt Okunur)</span>
                  <span className="text-[11px] text-purple-800">
                    Mali müşavir sisteme müdahale edemez; yalnızca defter ve beyanname eklerini indirebilir.
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-purple-200 text-purple-900 font-mono text-[10px] rounded font-bold">
                  TOKEN: SMMM-AKN-2026
                </span>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">Hazır İndirilebilir Yasal Paketler:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 border border-slate-200 rounded-lg hover:border-purple-300 transition-colors flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">Yevmiye &amp; Kebir Defteri</span>
                      <span className="text-[10px] text-slate-400 font-mono">GİB XML &amp; Luca CSV</span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('export')}
                      className="text-xs font-bold text-purple-700 hover:underline"
                    >
                      Dışa Aktar →
                    </button>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-lg hover:border-purple-300 transition-colors flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">KDV-1 &amp; Muhtasar Tahakkukları</span>
                      <span className="text-[10px] text-slate-400 font-mono">PDF &amp; İVD Fişleri</span>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="text-xs font-bold text-purple-700 hover:underline"
                    >
                      Yazdır / PDF →
                    </button>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-lg hover:border-purple-300 transition-colors flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">GİB Yüklenilen KDV Listesi</span>
                      <span className="text-[10px] text-slate-400 font-mono">İhracat İadesi XML</span>
                    </div>
                    <button
                      onClick={handleDownloadKdvIadeReport}
                      className="text-xs font-bold text-purple-700 hover:underline"
                    >
                      İndir (XML) →
                    </button>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-lg hover:border-purple-300 transition-colors flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">Form Ba-Bs Mutabakat Paketi</span>
                      <span className="text-[10px] text-slate-400 font-mono">5.000 TL Üzeri Faturalar</span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('reconciliation')}
                      className="text-xs font-bold text-purple-700 hover:underline"
                    >
                      İncele →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSmmmModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
