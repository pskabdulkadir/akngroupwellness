import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  TrendingUp, 
  Layers, 
  Activity, 
  Copy, 
  Check, 
  BookOpen, 
  Mic, 
  Smartphone, 
  Moon, 
  LifeBuoy, 
  Watch, 
  Globe, 
  Compass, 
  Brain, 
  Sun, 
  Users,
  Clock,
  Repeat,
  Crown
} from 'lucide-react';
import { MEMBERSHIP_PACKAGES, BANK_INFO, ADMIN_PHONE, ADMIN_EMAILS } from '../utils/authManager';
import { TOTAL_HEALING_COUNT } from '../data/healingLibrary';
import { downloadTechnicalReportWord, downloadTechnicalReportPDF } from '../utils/technicalReportExport';

interface TechnicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalReportModal: React.FC<TechnicalReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [downloadingWord, setDownloadingWord] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadWord = () => {
    setDownloadingWord(true);
    try {
      downloadTechnicalReportWord();
    } catch (err) {
      console.error('Word download error:', err);
    }
    setTimeout(() => setDownloadingWord(false), 1200);
  };

  const handleDownloadPDF = () => {
    setDownloadingPdf(true);
    try {
      downloadTechnicalReportPDF();
    } catch (err) {
      console.error('PDF download error:', err);
    }
    setTimeout(() => setDownloadingPdf(false), 1200);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/60 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 font-bold text-xs border border-emerald-500/30 tracking-wider">
                  AKN GLOBAL GROUP LTD
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/40">
                  v6.0 Enterprise &amp; Monoline MLM
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                  Kurumsal İş Sunumu, Katalog &amp; Teknik Sistem Raporu
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kurumlara, kliniklere, bayilere ve danışanlara sunum için hazır resmi Word (.doc) ve PDF teknik iş teklif ve Monoline 7 Nefis MLM katalog belgesi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Download Action Bar - WORD & PDF */}
        <div className="p-3.5 sm:p-4 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>AKN GLOBAL GROUP LTD resmi teknik iş teklifi ve sistem raporunu <strong>Word (.doc)</strong> veya <strong>PDF</strong> formatında indirin:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${downloadingPdf ? 'animate-bounce' : ''}`} />
              <span>{downloadingPdf ? 'PDF İndiriliyor...' : 'Vektör PDF İndir'}</span>
            </button>

            <button
              onClick={handleDownloadWord}
              disabled={downloadingWord}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${downloadingWord ? 'animate-bounce' : ''}`} />
              <span>{downloadingWord ? 'Word İndiriliyor...' : 'Word (.doc) İndir'}</span>
            </button>
          </div>
        </div>

        {/* Report Content Body (Scrollable) */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-8 text-slate-300 text-xs sm:text-sm leading-relaxed">
          
          {/* Executive Summary Card */}
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-emerald-500/40 relative overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold uppercase tracking-wider">
                YÖNETİCİ ÖZETİ & TEKNİK KİMLİK
              </span>
              <button
                onClick={() => handleCopyText("AuraBio Frekans Kuantum Biyo-Rezonans & Şifa Sistemi Teknik Raporu v5.5 Enterprise", "summary")}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {copiedSection === "summary" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === "summary" ? "Kopyalandı" : "Metni Kopyala"}</span>
              </button>
            </div>
            
            <p className="text-slate-200 leading-relaxed">
              <strong>AuraBio Frekans;</strong> modern optik foton spektrometresi, Kirlian biyo-plazma modellemesi, <strong>Aura-Sync Akıllı Saat Canlı Biyometrik Köprüsü (Web BLE)</strong>, <strong>MindSpace Studio (Aura-Journal, Circadian, Voice Forge, Dream Decoder, Group Sync)</strong>, <strong>AI Kutsal Geometri Mandala Üreticisi</strong>, <strong>7 Günlük AI Bütünsel Arınma Kampları</strong>, <strong>Anonim Küresel Huzur Isı Haritası</strong>, <strong>50+ Hastalık Şifa Ansiklopedisi</strong>, <strong>10s Ön/Son Biyo-Akustik Tarama Motoru</strong>, <strong>8 Sekmeli Entegre Raporlama</strong> ve <strong>{TOTAL_HEALING_COUNT}+ Kadim Şifa Frekansını</strong> tek bir dijital platformda birleştiren yeni nesil Kuantum Biyo-Rezonans ve Frekans Terapi Sistemidir. Özel elektrot veya hantal donanıma ihtiyaç duymadan standart kamera, mikrofon ve Bluetooth cihazlar üzerinden canlı tarama ve Web Audio ses sentezi gerçekleştirir.
            </p>
          </div>

          {/* Section 1: Core System Architecture & Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                1. Temel Sistem Özellikleri ve Teknolojik Mimarisi (v5.5 Enterprise)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <Watch className="w-4 h-4 text-emerald-400" />
                  <span>1. Aura-Sync Akıllı Saat Köprüsü (Web BLE)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Standart Bluetooth GATT Kalp Hızı Profili (UUID 0x180D) ile anlık nabız ve HRV okuma. Taşikardi veya stres anında otomatik frekans gevşeme adaptasyonu.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <span>2. AI Yaşam Koçu & Günlük (Aura-Journal)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Bütüncül terapötik perspektifle yazılı/sesli günlük analizi, duygu eğrisi, içsel rehberlik ve kişiye özel frekans protokolü.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>3. Biyo-Ritim & Circadian Synchronizer</span>
                </div>
                <p className="text-xs text-slate-400">
                  24 saatlik Geleneksel Çin Tıbbı (TCM) organ saati, biyolojik kortizol/melatonin hormon fazları ve ışık dalga boyu optimizasyonu.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-teal-300 text-xs flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-teal-400" />
                  <span>4. Sesli & Niyetli Frekans Labirenti (Forge)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Web Audio çoklu osilatör mimarisi ile ses analizi, taşıyıcı ve harmonik frekans sentezi, Schumann 7.83 Hz eşliğinde interaktif akort.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-purple-400" />
                  <span>5. AI Rüya & Bilinçaltı Çözümleyicisi</span>
                </div>
                <p className="text-xs text-slate-400">
                  Rüya metni veya sesinden Jungiyen/Kadim arketipleri, psiko-spiritüel anlamları ve bloke çakraları saptayıp gece frekans reçetesi sunma.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>6. Kurumsal & Aile Çemberi (Group Aura Sync)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Çoklu cihazların sesle veya QR ile eşleştiği, ortak HRV ve kolektif aura tutarlılık indeksi (Group Coherence) üreten rezonans ağı.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>7. AI Kutsal Geometri Mandala Üreticisi</span>
                </div>
                <p className="text-xs text-slate-400">
                  HTML5 Canvas tabanlı Çakra ve Solfejyo frekansına göre dinamik Yaşam Çiçeği, Torus, Sri Yantra ve Metatron Küpü geometrileri. Yüksek çözünürlüklü PNG dışa aktarma.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-teal-300 text-xs flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-teal-400" />
                  <span>8. 7 Günlük AI Bütünsel Arınma Kampları</span>
                </div>
                <p className="text-xs text-slate-400">
                  Kökten Taç çakraya kadar Sabah (Uyanış), Öğle (Hizalanma) ve Gece (Hücresel Detoks) mikro seanslarıyla yapılandırılmış program ve bulut ilerleme sistemi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>9. Anonim Küresel Frekans Haritası (Heatmap)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Dünya genelinde o anda aktif olan biyo-rezonans seanslarını, baskın küresel niyet dalgasını ve kıtasal enerji dağılımını canlı görselleştirme.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>10. 🌿 Şifa Ansiklopedisi (50+ Hastalık)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Nörolojik, kardiyovasküler, metabolik, psikosomatik ve kas-iskelet rahatsızlıkları için kanıta dayalı frekans protokolleri ve 3 aşamalı iyileşme takvimleri.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span>11. 🎙️ 10s Ön / Son Biyo-Akustik Tarama</span>
                </div>
                <p className="text-xs text-slate-400">
                  Mikrofon üzerinden vokal spektrometre analizi ile seans öncesi ve sonrası hücresel titreşim harmoniklerini karşılaştırıp somut puanlama üretme.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-indigo-400" />
                  <span>12. 📊 8 Sekmeli Rapor &amp; Karşılaştırma</span>
                </div>
                <p className="text-xs text-slate-400">
                  İlim Kapı, Genel Bakış, Duygular, Katmanlar, Çakralar, Letaifler, Reçeteler ve İnovasyonlar. Yüklenen şifa frekansının otomatik teyidi ve PDF/Word dışa aktarımı.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/40 space-y-1.5">
                <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>13. 💎 Monoline 7 Nefis MLM &amp; Komisyon Motoru</span>
                </div>
                <p className="text-xs text-slate-400">
                  Küresel Tek Hat (Global Single Line) üzerinde %20 Direkt Sponsor Primi, %25 7 Derinlik Tek Hat Primi (%7-%5-%4-%3-%2-%2-%2) ve %5 Sistem / Kariyer Havuzu / Anlık Bonus sistemi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/40 space-y-1.5">
                <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>14. 🏢 Bayi Back-Office &amp; 13 Kredi Havuzu Paketi</span>
                </div>
                <p className="text-xs text-slate-400">
                  32 Seans Kredisinden 5.000 Enterprise Seans Kredisine kadar 13 resmi alışveriş paketi, Nefs-i Emmâre’den Nefs-i Kâmile’ye 7 kariyer mertebesi ve IBAN / TRC-20 çekim yönetimi.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Corporate Integration & Sectoral Value */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                2. Kurumsal Entegrasyon ve Sektörel Kullanım Alanları
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Bütüncül Tıp, Klinikler & Tamamlayıcı Sağlık Merkezleri</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hacamat, akupunktur, ozon tedavisi ve biyo-rezonans seansları öncesinde ve sonrasında danışanın enerji değişimini ölçümleme, akıllı saat nabzıyla doğrulanmış fotoğraflı PDF rapor sunma.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Spa, Termal Tesisler & Sağlıklı Yaşam (Wellness / Resort) Otelleri</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    VIP check-in sırasında 3 dakikalık biyo-alan analizi ve sonuca göre kişiselleştirilmiş 6 ekol masaj & frekans odası yönlendirmesi.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Kurumsal Şirketler & İK Departmanları (Corporate Wellness)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Çalışan tükenmişliğini (burnout) önleme, zihinsel odaklanma ve stres seviyesini düşürmek için 10 dakikalık MindSpace Alfa seansları ve 7 günlük kamplar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Official Membership & License Packages */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                3. Sistem İçerisindeki Resmi Üyelik ve Lisans Paketleri
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {MEMBERSHIP_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                    pkg.popular
                      ? 'bg-emerald-950/40 border-emerald-400/60 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/30'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 text-xs">{pkg.name}</span>
                      {pkg.popular && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[9px] uppercase">
                          En Çok Tercih Edilen
                        </span>
                      )}
                    </div>

                    <div className="text-lg font-black text-emerald-400">
                      {pkg.priceText}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">/ {pkg.durationText}</span>
                    </div>

                    <ul className="space-y-1 pt-1 border-t border-slate-800/80">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <div className="text-[10px] text-slate-400 text-center bg-slate-900/80 py-1.5 rounded-xl border border-slate-800">
                      Kullanım Süresi: <strong>{pkg.durationText}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Member Dashboard Integration Highlight */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 mt-4">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <Crown className="w-4 h-4 text-emerald-400" />
                <span>Kapsamlı Üye Paneli (Member Dashboard) Entegrasyonu</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Her üye için özel panel arayüzü; canlı gün, saat, dakika ve saniye bazlı kalan süre sayacı, tek tıkla süre uzatma ve paket yenileme mağazası, 256-bit güvenli profil ve şifre güncelleme, sipariş ve ödeme onay geçmişi ile bulut tabanlı seans loglarını merkezi olarak yönetir.
              </p>
            </div>
          </div>

          {/* Section 4: Official Bank & Contact Info */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Resmi Üretici & İletişim Bilgileri</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="text-slate-400">Hesap Sahibi / Yetkili:</div>
                <div className="font-bold text-slate-200">{BANK_INFO.accountHolder}</div>
                <div className="text-[11px] text-emerald-400">Psikolog & Kuantum Biyo-Rezonans Uzmanı</div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-400">Banka & IBAN:</div>
                <div className="font-bold text-slate-200">{BANK_INFO.bankName}</div>
                <div className="font-mono text-xs text-emerald-400 select-all">{BANK_INFO.iban}</div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-400">İletişim & WhatsApp Destek:</div>
                <div className="font-bold text-slate-200">{ADMIN_PHONE}</div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-400">Resmi E-Posta:</div>
                <div className="font-bold text-slate-200">{ADMIN_EMAILS[0]}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>AKN GLOBAL GROUP LTD • Resmi Kurumsal ve Teknik Sunum Dokümanı</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadWord}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Word Belgesini İndir (.doc)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
