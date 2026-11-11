import React, { useState } from 'react';
import {
  TaxReportSummary,
  Invoice,
  CommissionPayout,
  COMPANY_PROFILE,
  CompanyProfile,
  AutoPilotExecutionSummary,
  VoiceCommandLog,
  ProactiveAlert,
} from '../../types/accounting';
import { SpeechEngine } from '../../services/voiceAssistant';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Receipt,
  Lock,
  Printer,
  Download,
  Volume2,
  VolumeX,
  FileText,
  Sparkles,
  Building2,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Mic,
  History,
  Bell,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import avatarCpa from '../../assets/images/avatar_mali_musavir_1792512085316.jpg';

interface CfoExecutiveReportViewProps {
  summary: TaxReportSummary;
  invoices: Invoice[];
  commissions: CommissionPayout[];
  taxBufferVaultTRY: number;
  lastAutoPilotRun?: AutoPilotExecutionSummary | null;
  onRunAutoPilot: () => void;
  onNavigateTab: (tab: string) => void;
  voiceLogs?: VoiceCommandLog[];
  proactiveAlerts?: ProactiveAlert[];
  companyProfile?: CompanyProfile;
}

export const CfoExecutiveReportView: React.FC<CfoExecutiveReportViewProps> = ({
  summary,
  invoices,
  commissions,
  taxBufferVaultTRY,
  lastAutoPilotRun,
  onRunAutoPilot,
  onNavigateTab,
  voiceLogs = [],
  proactiveAlerts = [],
  companyProfile,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const profile = companyProfile || COMPANY_PROFILE;

  // Vergi Karşılıkları Havuzu (Kasadaki devlete ait paranın tam kuruş hesabı)
  const taxReservePoolTRY = summary.vatPayableNet + summary.totalWithholdingTax360;

  // Net Şirket Hakedişi (Tüm vergiler ve komisyonlar çıktıktan sonra şirkete kalan saf nakit)
  const netCompanyProfitTRY = Math.max(
    0,
    summary.totalGrossRevenueTRY -
      taxReservePoolTRY -
      summary.totalNetCommissionsPaidTRY -
      summary.totalExpenses770TRY
  );

  const executiveSpeechText = `Sayın Yönetici, AKN Global Group Ltd. günlük mali durum raporunu sunuyorum. Bu ay yurt dışı hizmet ihracatı ciromuz ${summary.totalExportSalesUSD.toLocaleString(
    'en-US'
  )} Dolar seviyesindedir ve toplam brüt ciromuz ${summary.totalGrossRevenueTRY.toLocaleString(
    'tr-TR'
  )} Türk Lirası oldu. Kasadaki nakdin ${taxReservePoolTRY.toLocaleString(
    'tr-TR'
  )} lirası devlete ait olup, vergi tampon cüzdanında güvenceye alınmıştır. Tüm vergi ve bayi komisyonları düşüldükten sonra AKN Global Group Ltd.'nin net şirket kârı ${netCompanyProfitTRY.toLocaleString(
    'tr-TR'
  )} Türk Lirasıdır.`;

  const handleToggleSpeak = () => {
    if (isPlayingAudio) {
      SpeechEngine.stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      SpeechEngine.speak(executiveSpeechText, () => setIsPlayingAudio(false));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xl tracking-wider text-emerald-400 shrink-0">
              AKN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-widest">
                  Otonom Finans Direktörü (AI CFO)
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Tam Yetkili
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight mt-1">
                {profile.legalName} — Günlük Yönetici Mali Raporu
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Yurt içi (TRY) ve yurt dışı ($3x$ USD) satışların, GİB e-Faturaların, monoline bayi
                stopajlarının ve vergi tampon cüzdanının anlık resmî denetim özeti.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 no-print">
            <button
              onClick={handleToggleSpeak}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                isPlayingAudio
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-emerald-200" />
                  <span>Durdur</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Raporu Sesli Dinle</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>PDF / Yazdır</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Ana Mali Havuz Kartı (CFO 3-Pillar Treasury) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Sütun 1: Brüt Ciro */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              1. Toplam Brüt Ciro
            </span>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
              Yurt İçi + Global
            </span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {summary.totalGrossRevenueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              GİB'e iletilen resmi e-Fatura ve e-Arşiv satış hasılatı
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Yurt İçi Satışlar:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {summary.totalDomesticSalesTRY.toLocaleString('tr-TR')} ₺
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Global ($3x$ USD Satışlar):</span>
              <span className="font-bold text-emerald-700 font-mono">
                ${summary.totalExportSalesUSD} USD ({summary.totalExportSalesTRY.toLocaleString('tr-TR')} ₺)
              </span>
            </div>
          </div>
        </div>

        {/* Sütun 2: Vergi Karşılıkları Havuzu */}
        <div className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-amber-600" />
              2. Vergi Karşılıkları Havuzu
            </span>
            <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              Devletin Emaneti
            </span>
          </div>

          <div>
            <span className="text-2xl font-extrabold text-amber-950 font-mono">
              {taxReservePoolTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
            <p className="text-[11px] text-amber-800 mt-1">
              Kasadaki paranın devlete ait olan, harcanmaması gereken kısmı
            </p>
          </div>

          <div className="pt-2 border-t border-amber-100 space-y-1.5 text-xs text-amber-950">
            <div className="flex justify-between">
              <span className="text-amber-800">Ödenecek Net KDV:</span>
              <span className="font-semibold font-mono">
                {summary.vatPayableNet.toLocaleString('tr-TR')} ₺
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-800">Bireysel Bayi Stopajı (%20):</span>
              <span className="font-semibold font-mono">
                {summary.totalWithholdingTax360.toLocaleString('tr-TR')} ₺
              </span>
            </div>
          </div>
        </div>

        {/* Sütun 3: Net Şirket Hakedişi */}
        <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-md space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              3. Net Şirket Hakedişi
            </span>
            <span className="text-[10px] font-mono bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Saf Şirket Kârı
            </span>
          </div>

          <div>
            <span className="text-2xl font-extrabold text-white font-mono">
              {netCompanyProfitTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
            <p className="text-[11px] text-emerald-200 mt-1">
              Tüm vergiler, bayi komisyonları ve giderler sonrası AKN Global Group Ltd.'ye kalan nakit
            </p>
          </div>

          <div className="pt-2 border-t border-emerald-800/60 space-y-1.5 text-xs text-emerald-100">
            <div className="flex justify-between">
              <span>Bayi Komisyon Ödemeleri:</span>
              <span className="font-mono">
                {summary.totalNetCommissionsPaidTRY.toLocaleString('tr-TR')} ₺
              </span>
            </div>
            <div className="flex justify-between">
              <span>Kilitli Vergi Tamponu:</span>
              <span className="font-mono font-bold text-emerald-300">
                {taxBufferVaultTRY.toLocaleString('tr-TR')} ₺
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vergi Tampon Cüzdanı (Tax Buffer Vault) & Otopilot Entegrasyonu */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-950">
                AKN Vergi Tampon Cüzdanı (Tax Buffer Vault)
              </h3>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                Korumalı
              </span>
            </div>
            <p className="text-xs text-amber-900 mt-1 max-w-2xl leading-relaxed">
              Otonom motorumuz, önümüzdeki ayın 26'sına kadar devlete ödenecek <strong>{taxReservePoolTRY.toLocaleString('tr-TR')} ₺</strong> vergi tutarını şirket ana operasyon hesabından ayırıp güvenceye almıştır. Böylece vergi ödeme gününde nakit krizi yaşanması engellenir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[11px] text-amber-800 block">Kilitli Vergi Rezervi:</span>
            <span className="text-xl font-bold font-mono text-amber-950">
              {taxBufferVaultTRY.toLocaleString('tr-TR')} ₺
            </span>
          </div>
          <button
            onClick={onRunAutoPilot}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Otopilotu Yenile</span>
          </button>
        </div>
      </div>

      {/* Resmi Mali Müşavir Yönetim Kurulu Raporu (Executive Official Letterhead) */}
      <div className="bg-white border border-slate-300 rounded-2xl p-8 shadow-sm text-slate-800 text-xs leading-relaxed space-y-6">
        {/* Antet */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                AKN
              </span>
              <h2 className="text-base font-bold text-slate-950 uppercase tracking-tight">
                {profile.legalName}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500">{profile.address}</p>
            <p className="text-[11px] text-slate-500 font-mono">
              VKN: {profile.vkn} · {profile.taxOffice} · Tic. Sicil:{' '}
              {profile.tradeRegistryNumber}
            </p>
          </div>

          <div className="text-right space-y-0.5">
            <p className="font-bold text-slate-900 uppercase">Mali Müşavirlik & CFO Raporu</p>
            <p className="font-mono text-slate-500 text-[11px]">
              Dönem: {summary.periodMonth} · Rapor No: CFO-2026-108
            </p>
            <p className="font-mono text-slate-500 text-[11px]">
              Tarih: {new Date().toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>

        {/* Hitap ve Giriş */}
        <div>
          <p className="font-bold text-slate-900 text-sm">
            AKN Global Group Ltd. Yönetim Kurulu Başkanlığına,
          </p>
          <p className="mt-2 text-slate-700">
            Şirketimizin {summary.periodMonth} dönemine ait tüm yurt içi (TRY) ve yurt dışı ($3x$ USD)
            satış hareketleri, 3065 sayılı Katma Değer Vergisi Kanunu, 193 sayılı Gelir Vergisi Kanunu ve
            213 sayılı Vergi Usul Kanunu uyarınca otonom muhasebe motorumuz tarafından incelenmiş olup,
            mali bulgular ve eylem planı aşağıda bilgilerinize sunulmuştur:
          </p>
        </div>

        {/* 4 Kritik Mali Müşavir Değerlendirmesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              Hizmet İhracatı ve KDV İadesi Fırsatı (KDVK 11/1-a)
            </h4>
            <p className="text-slate-600 text-[11px]">
              Bu ay yurt dışı müşterilerimize yapılan ${summary.totalExportSalesUSD} USD tutarındaki dijital
              yazılım/paket satışlarımızda İstisna Kodu 301 uygulanarak %0 KDV kesilmiştir. Şirketimiz
              adına <strong>{summary.vatRefundEligibleTRY.toLocaleString('tr-TR')} TL</strong> KDV iade
              alacağı doğmuştur.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              Bireysel Bayi Stopajı & Gider Pusulası (GVK 94/10-b)
            </h4>
            <p className="text-slate-600 text-[11px]">
              Vergi mükellefiyeti bulunmayan bireysel bayilerimizin hakedişlerinden %20 yasal gelir vergisi
              stopajı ({summary.totalWithholdingTax360.toLocaleString('tr-TR')} TL) kesilmiş ve her biri
              için resmi e-Gider Pusulası tanzim edilmiştir. Muhtasar beyanname ile beyan edilecektir.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              Nakit Akışı ve Vergi Tampon Cüzdanı
            </h4>
            <p className="text-slate-600 text-[11px]">
              Gelecek ayın 26'sında devlete ödenecek toplam{' '}
              <strong>{taxReservePoolTRY.toLocaleString('tr-TR')} TL</strong> tutarındaki KDV ve Stopaj
              yükümlülüğü için şirket ana hesabından likit karşılık ayrılmıştır. Kasada nakit sıkışıklığı
              riski bulunmamaktadır.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">
                4
              </span>
              Kurumlar Vergisi İndirimi Teşviki (KVK 10/1-ğ)
            </h4>
            <p className="text-slate-600 text-[11px]">
              Yurt dışına sağlanan yazılım ve bilişim hizmetlerinden elde edilen kazancın %80'i kurumlar
              vergisi matrahından indirilecektir. Bu teşvik dönem sonu vergi yükümüzü yaklaşık{' '}
              <strong>18.400 TL</strong> azaltacaktır.
            </p>
          </div>
        </div>

        {/* İmza ve Mühür Bloğu */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px]">
          <div className="space-y-1">
            <p className="font-bold text-slate-900">{profile.directorName}</p>
            <p className="text-slate-500">{profile.cfoTitle}</p>
            <p className="text-emerald-700 font-mono text-[10px]">
              Elektronik Otonom İmza Damgası: 0xAKN9482F1D0
            </p>
          </div>

          <div className="w-28 h-28 border-2 border-slate-800 rounded-full flex flex-col items-center justify-center text-center p-2 text-[9px] font-bold text-slate-800 select-none uppercase tracking-tighter">
            <span>★ RESMİ CFO ★</span>
            <span className="text-[8px] font-mono">AKN GLOBAL</span>
            <span className="text-[7px] text-slate-500">Mühür & Onay</span>
            <span className="text-[8px] text-emerald-700">✓ ONAYLANDI</span>
          </div>
        </div>
      </div>

      {/* Proaktif Uyarılar & Takvim Eşikleri (Proactive Voice & Tax Alerts) */}
      {proactiveAlerts && proactiveAlerts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Otonom Sesli Hatırlatıcılar & Kritik Vergi Eşikleri
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
              {proactiveAlerts.filter((a) => !a.dismissed).length} Aktif Bildirim
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proactiveAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.severity === 'critical'
                    ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                    : 'bg-blue-50/60 border-blue-200 text-blue-950'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    {alert.severity === 'critical' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                    {alert.severity === 'warning' && <Calendar className="w-3.5 h-3.5 text-amber-600" />}
                    {alert.severity === 'info' && <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                    {alert.title}
                  </span>
                  <button
                    onClick={() => SpeechEngine.speak(alert.speechText)}
                    className="p-1 rounded-md hover:bg-black/5 text-slate-700 transition-colors"
                    title="Sesli Dinle"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] mt-1.5 opacity-85 leading-relaxed">{alert.message}</p>
                {alert.actionLabel && alert.actionTab && (
                  <button
                    onClick={() => onNavigateTab(alert.actionTab!)}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold underline hover:opacity-80"
                  >
                    <span>{alert.actionLabel}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sesli İşlem & Çift Onay Güvenlik Denetim Günlüğü (Voice Audit Trail) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Sesli İşlem & Çift Onay Güvenlik Günlüğü (Voice Audit Trail)
              </h3>
              <p className="text-[11px] text-slate-500">
                Mikrofon veya ses komutlarıyla icra edilen tüm işlemlerin VUK ve 6698 KVKK uyumlu denetim izi.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            voice_command_logs ({voiceLogs.length} Kayıt)
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold">Tarih / Saat</th>
                <th className="py-2.5 px-3 font-semibold">Yetkili Kullanıcı</th>
                <th className="py-2.5 px-3 font-semibold">Söylenen Komut</th>
                <th className="py-2.5 px-3 font-semibold">Algılanan Eylem</th>
                <th className="py-2.5 px-3 font-semibold">Tutar / Para</th>
                <th className="py-2.5 px-3 font-semibold">Güvenlik Durumu</th>
                <th className="py-2.5 px-3 font-semibold">Resmi Belge Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {voiceLogs.map((log) => {
                const isExecuted = log.status === 'EXECUTED';
                const isRejected = log.status === 'REJECTED';
                const isPending = log.status === 'PENDING_CONFIRMATION';
                const isFallback = log.status === 'FALLBACK';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-900 font-medium whitespace-nowrap">
                      {log.user}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-700 italic max-w-xs truncate">
                      "{log.spokenText}"
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-bold whitespace-nowrap">
                      {log.parsedAction}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 font-bold whitespace-nowrap">
                      {log.amount
                        ? `${log.amount.toLocaleString('tr-TR')} ${log.currency || 'TRY'}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isExecuted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> İcra Edildi
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <ShieldCheck className="w-3 h-3" /> Çift Onay Bekliyor
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3" /> Güvenlik İptali
                        </span>
                      )}
                      {isFallback && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          <HelpCircle className="w-3 h-3" /> Öneri Sunuldu
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold whitespace-nowrap">
                      {log.documentRef || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
