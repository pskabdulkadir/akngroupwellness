import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  ShieldCheck, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  UserCheck, 
  Lock,
  CreditCard,
  Ban,
  HelpCircle,
  Phone,
  Mail,
  Printer
} from 'lucide-react';
import { BANK_INFO, ADMIN_PHONE, ADMIN_EMAILS } from '../utils/authManager';

export type LegalContractTab = 'preInfo' | 'distanceSale' | 'cancellationRefund' | 'terms' | 'kvkk';

interface LegalContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalContractTab;
}

export const LegalContractsModal: React.FC<LegalContractsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'preInfo',
}) => {
  const [activeTab, setActiveTab] = useState<LegalContractTab>(initialTab);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-emerald-500/50 rounded-3xl p-4 sm:p-7 shadow-2xl shadow-emerald-950/80 space-y-4 sm:space-y-5 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 shrink-0 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-slate-100">
                  Yasal Sözleşmeler & Tüketici Bilgilendirme Merkezi
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Sanal POS & Banka Uyumlu
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                6502 Sayılı Tüketicinin Korunması Kanunu, Mesafeli Sözleşmeler Yönetmeliği & 6698 Sayılı KVKK Uyarınca
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs hidden sm:flex items-center gap-1.5"
              title="Sözleşmeyi Yazdır"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Buttons (5 Comprehensive Tabs) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('preInfo')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 text-center ${
              activeTab === 'preInfo'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Ön Bilgilendirme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('distanceSale')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 text-center ${
              activeTab === 'distanceSale'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Mesafeli Satış</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cancellationRefund')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 text-center ${
              activeTab === 'cancellationRefund'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-rose-400 hover:text-rose-200 hover:bg-slate-900'
            }`}
          >
            <Ban className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate font-black">İptal & Cayma İstisnası</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 text-center ${
              activeTab === 'terms'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Kullanıcı & Lisans</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kvkk')}
            className={`col-span-2 sm:col-span-1 py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 text-center ${
              activeTab === 'kvkk'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">KVKK & Gizlilik</span>
          </button>
        </div>

        {/* Scrollable Legal Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          
          {/* TAB 1: ÖN BİLGİLENDİRME KOŞULLARI */}
          {activeTab === 'preInfo' && (
            <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ön Bilgilendirme Formu - Dijital Yazılım Lisans & Seans Havuzu Hizmetleri</span>
              </div>

              <div className="space-y-3.5">
                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1.5 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>1. SATICI / HİZMET SAĞLAYICI VE ŞİRKET BİLGİLERİ</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div><strong>Ticari Unvan:</strong> AKN Global Group Ltd</div>
                  <div><strong>Marka:</strong> AuraBio Frekans Sistemleri</div>
                  <div><strong>Yetkili Yönetici:</strong> Psikolog Abdulkadir Kan</div>
                  <div><strong>Müşteri Hizmetleri / WhatsApp:</strong> {ADMIN_PHONE}</div>
                  <div><strong>E-Posta:</strong> {ADMIN_EMAILS[0]}</div>
                  <div><strong>Resmi Banka:</strong> {BANK_INFO.bankName}</div>
                  <div className="sm:col-span-2"><strong>Hesap Sahibi & IBAN:</strong> {BANK_INFO.accountHolder} — <span className="font-mono text-emerald-300 select-all">{BANK_INFO.iban}</span></div>
                </div>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1.5 pt-2">
                  2. HİZMETİN TEMEL NİTELİKLERİ VE İFA KAPSAMI
                </h4>
                <p>
                  AuraBio Frekans Sistemi; web tabanlı optik kamera spektral tarama analizörü, 7 Çakra & 5 Kalbi Letaif rezonans ölçüm modülleri, 99 Esmaü’l Hüsna & Şifa Ayetleri Solfeggio ses osiloskop frekans aktarım motoru, grup aura senkronizasyonu ve otomatik danışan PDF teknik raporlama araçlarını içeren <strong>dijital gayrimaddi yazılım lisansı ve seans kredi havuzu</strong> hizmetidir.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1.5 pt-2">
                  3. ÖDEME YÖNTEMLERİ, FİYATLANDIRMA VE VERGİLENDİRME
                </h4>
                <p>
                  Sistem üzerinden sipariş verilen tüm paket fiyatları ABD Doları (USD) cinsinden olup yürürlükteki yasal KDV dahildir. Ödemeler; <strong>Yetkili Sanal POS (Kredi Kartı / Banka Kartı / Taksitli Ödeme)</strong> veya <strong>Havale / EFT / FAST</strong> yöntemleri ile güvenli 256-bit SSL şifreleme altında tahsil edilir.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1.5 pt-2">
                  4. DİJİTAL İFA VE ANINDA ERİŞİM SAĞLANMASI
                </h4>
                <p>
                  Ödeme onayı sisteme ulaştığı anda, alıcının kullanıcı hesabı otomatik veya bayi yetkilendirmesi ile derhal aktif edilir; yazılım modüllerine, seans havuzuna ve frekans kütüphanesine anında kesintisiz erişim sağlanır. Fiziksel kargo teslimatı bulunmamaktadır.
                </p>

                <div className="p-3.5 rounded-xl bg-rose-950/50 border-2 border-rose-500/50 text-rose-200 text-xs space-y-1.5">
                  <div className="font-black text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>ÖNEMLİ CAYMA HAKKI İSTİSNASI BİLGİLENDİRMESİ:</span>
                  </div>
                  <p>
                    6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği Madde 15/1-ğ bendi uyarınca, <em>"Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmeler"</em> yasal cayma hakkı istisnası kapsamındadır. Ödeme yapılıp dijital erişim/hesap aktif edildiğinde cayma hakkı ve ücret iadesi talep edilemez.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MESAFELİ SATIŞ SÖZLEŞMESİ */}
          {activeTab === 'distanceSale' && (
            <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Mesafeli Satış Sözleşmesi (Kredi Kartı, Sanal POS & Banka İşlemleri Tam Uyumlu)</span>
              </div>

              <div className="space-y-3.5">
                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1">
                  MADDE 1 - TARAFLAR
                </h4>
                <div className="text-xs space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <p><strong>SATICI / HİZMET SAĞLAYICI:</strong> AKN Global Group Ltd (AuraBio Frekans Sistemleri)</p>
                  <p><strong>YETKİLİ TEMSİLCİ:</strong> Abdulkadir Kan (Psikolog & Biyo-Rezonans Uzmanı)</p>
                  <p><strong>İLETİŞİM / DESTEK:</strong> {ADMIN_PHONE} — {ADMIN_EMAILS[0]}</p>
                  <p><strong>ALICI (MÜŞTERİ / BAYİ):</strong> AuraBio Frekans platformu üzerinden kayıt formunu dolduran, paketi seçen ve Sanal POS / Havale ile ödemeyi gerçekleştiren gerçek veya tüzel kişidir.</p>
                </div>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  MADDE 2 - SÖZLEŞMENİN KONUSU VE HUKUKİ DAYANAĞI
                </h4>
                <p>
                  İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait www.aurabiofrekans.com veya web uygulaması üzerinden elektronik ortamda siparişini verdiği, özellikleri ve satış bedeli belirtilen dijital yazılım kullanım lisansı ve seans kredi paketlerinin satışı, teslimi ve tarafların hak ve yükümlülüklerinin 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince düzenlenmesidir.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  MADDE 3 - SÖZLEŞME KONUSU ÜRÜN, BEDEL VE ÖDEME KOŞULLARI
                </h4>
                <p>
                  Satın alınan ürün/hizmet; seçilen seans kredisi miktarına veya süreli lisans paketine göre belirlenen dijital erişim yetkisidir. ALICI, sipariş ekranında teyit ettiği bedeli Kredi Kartı (Tek çekim veya anlaşmalı banka taksitleri) veya Satıcı'nın resmi QNB Finansbank IBAN hesabına Havale/EFT/FAST yoluyla ödemeyi kabul ve taahhüt eder.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  MADDE 4 - İFA VE TESLİMAT ŞARTLARI
                </h4>
                <p>
                  Sözleşme konusu ürün gayrimaddi dijital içerik olduğundan, ödeme onayının akabinde ALICI'nın kullanıcı hesabına otomatik veya bayi paneli aracılığıyla derhal tanımlanır. ALICI'nın sisteme giriş yapması ile ifa ve teslimat hukuken eksiksiz tamamlanmış kabul edilir.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  MADDE 5 - KREDİ KARTI GÜVENLİĞİ VE HAKSIZ CHARGEBACK (TERS İBRAZ) YASAĞI
                </h4>
                <p>
                  Ödemeler 3D Secure güvenlik protokolü ve PCI-DSS standartlarına sahip sanal POS altyapısı üzerinden gerçekleştirilir. Dijital hizmetin eksiksiz ifa edilmesinden sonra, banka veya ödeme kuruluşuna gerçeğe aykırı 'hizmet alınmadı' veya yetkisiz işlem gerekçesiyle haksız chargeback (ters ibraz) başvurusunda bulunulması hukuka aykırıdır. Bu tür kötü niyetli girişimlerde SATICI; IP log kayıtları, cihaz parmak izi, oturum zaman damgaları ve kullanım loglarını bankaya ve adli makamlara sunarak tüm yasal haklarını, tazminat ve avukatlık ücretlerini ALICI'dan tahsil etme hakkını saklı tutar.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: İPTAL, İADE VE CAYMA HAKKI İSTİSNASI (DİJİTAL ÜRÜN KORUMASI) */}
          {activeTab === 'cancellationRefund' && (
            <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border-2 border-rose-500/40">
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 font-bold text-xs flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400 shrink-0" />
                <span>İptal, İade ve Cayma Hakkı Şartları — Dijital İçerik Gayrimaddi Mal İstisnası (No-Refund Policy)</span>
              </div>

              <div className="space-y-3.5 text-slate-200">
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                  <h4 className="font-black text-rose-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>YASAL CAYMA HAKKI İSTİSNASI VE KESİN İADE EDİLEMEZLİK KURALI</span>
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-200">
                    6502 Sayılı Tüketicinin Korunması Hakkında Kanun'un 48. Maddesi ve 29188 Sayılı Resmi Gazete'de yayımlanan <strong>Mesafeli Sözleşmeler Yönetmeliği'nin "Cayma Hakkının İstisnaları" başlıklı 15. Maddesi 1. Fıkrasının (ğ) bendi</strong> açık hükmü gereğince:
                  </p>
                  <blockquote className="p-3 rounded-xl bg-slate-900 border-l-4 border-rose-500 text-xs italic font-medium text-amber-200">
                    "Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmelerde cayma hakkı kullanılamaz."
                  </blockquote>
                </div>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  1. DİJİTAL LİSANS VE SEANS KREDİLERİNİN NİTELİĞİ
                </h4>
                <p>
                  AuraBio Frekans sistemi tarafından sağlanan yazılım erişim yetkileri, özel biyo-rezonans algoritma motorları, frekans ses kütüphaneleri, seans kredileri ve kaynak kodları gayrimaddi dijital ürün statüsündedir. Ödeme gerçekleştiği anda kullanıcının hesabına tanımlanmakta ve tüketim anında başlayabilmektedir.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  2. İPTAL VE İADE TALEPLERİNİN KABUL EDİLMEMESİ
                </h4>
                <p>
                  Siparişin onaylanması ve kullanıcı hesabının aktif edilmesiyle birlikte hizmet ifası tamamlanmış sayılır. Bu aşamadan sonra hiçbir surette kısmi veya tam ücret iadesi, cayma talebi veya paket iptali yapılamaz. Kullanıcı satın alma işlemini onaylayarak bu şartı peşinen ve gayrikabili rücu kabul etmiş sayılır.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  3. SEANS KREDİLERİNİN SÜRESİZ KULLANIM GÜVENCESİ
                </h4>
                <p>
                  İade yapılmamasına karşılık, satın alınan paketlerdeki seans kredileri <strong>hiçbir zaman yanmaz veya silinmez</strong>. Kullanıcı dilediği zaman aralığında kredilerini tüketebilir.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  4. HATA VE TEKNİK DESTEK SÜRECİ
                </h4>
                <p>
                  Sistemden kaynaklanan herhangi bir teknik erişim engeli veya seans yükleme hatası durumunda ALICI, {ADMIN_PHONE} numaralı resmi WhatsApp destek hattına bildirimde bulunarak teknik yardım, seans bakiye düzeltmesi veya telafi kredisi talep edebilir. Teknik aksaklıklar ivedilikle giderilir ancak cayma veya nakit iade sebebi teşkil etmez.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: KULLANICI & LİSANS & FİKRİ MÜLKİYET KOŞULLARI */}
          {activeTab === 'terms' && (
            <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-300 font-semibold text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Kullanıcı, Yazılım Lisans & Fikri Mülkiyet Sözleşmesi (Terms of Service)</span>
              </div>

              <div className="space-y-3.5">
                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1">
                  1. FİKRİ VE SINAİ MÜLKİYET HAKLARI KORUMASI (5846 SAYILI FSEK)
                </h4>
                <p>
                  AuraBio Frekans yazılımının tüm algoritmaları, görsel arayüzleri, veritabanı şemaları, 3D biyo-aura simülatörleri, ses sentez osiloskop motorları ve teknik mimarisi 5846 Sayılı Fikir ve Sanat Eserleri Kanunu ve 6769 Sayılı Sınai Mülkiyet Kanunu kapsamında AKN Global Group Ltd ve Abdulkadir Kan'a aittir.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  2. TERSİNE MÜHENDİSLİK, KOPYALAMA VE KORSAN YASAĞI
                </h4>
                <p>
                  Kullanıcı veya Bayi; yazılımı kaynak kodlarına ayrıştıramaz (decompile), tersine mühendisliğe (reverse engineering) tabi tutamaz, benzerini üretmek amacıyla kopyalayamaz veya yetkisiz 3. şahıslara kiralayamaz/satamaz. Tespit edilen ihlallerde 300.000 USD'den başlayan cezai şart ve suç duyurusu hakkı saklıdır.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  3. TIBBİ TEŞHİS VE TEDAVİ İKAMESİ OLMADIĞINA DAİR TAAHHÜT (MEDICAL DISCLAIMER)
                </h4>
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-1">
                  <p className="font-bold text-amber-300">
                    ⚠️ Yasal Sağlık ve Sorumluluk Reddi Beyanı:
                  </p>
                  <p>
                    AuraBio Frekans sistemi tıbbi bir teşhis, tanı, reçete veya tedavi cihazı/yazılımı değildir. Yalnızca bireysel farkındalık, biyo-rezonans, frekans analizi ve holistik danışmanlık amaçlı geliştirilmiştir. Tıbbi rahatsızlıklarda uzman bir hekime başvurulması zorunludur. Sistemin kullanımından doğabilecek tıbbi yorumlardan SATICI sorumlu tutulamaz.
                  </p>
                </div>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  4. HESAP GÜVENLİĞİ VE KÖTÜYE KULLANIM
                </h4>
                <p>
                  Kullanıcı hesabının şifresini gizli tutmakla yükümlüdür. Bir hesabın aynı anda yetkisiz biçimde birden fazla farklı lokasyon veya cihazda şüpheli aktivitelerle paylaşılması durumunda SATICI hesabı askıya alma hakkına sahiptir.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: KVKK & GİZLİLİK POLİTİKASI */}
          {activeTab === 'kvkk' && (
            <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>6698 Sayılı KVKK Aydınlatma Metni & Gizlilik Politikası (Privacy Policy)</span>
              </div>

              <div className="space-y-3.5">
                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1">
                  1. VERİ SORUMLUSU VE KAPSAM
                </h4>
                <p>
                  6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, veri sorumlusu sıfatıyla AKN Global Group Ltd, kullanıcıların kişisel bilgilerini (Ad Soyad, Telefon, E-Posta, Fatura Adresi, Ödeme Logları ve Seans Kayıtları) yalnızca hizmetin sunulması amacıyla işler ve korur.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  2. KREDİ KARTI BİLGİLERİNİN SAKLANMAMASI GÜVENCESİ
                </h4>
                <p>
                  Kullanıcıların kredi kartı veya banka kartı numaraları, son kullanma tarihleri ve CVV güvenlik kodları şirketimiz sunucularında <strong>asla saklanmaz ve kaydedilmez</strong>. Tüm işlemler BDDK lisanslı güvenli ödeme kuruluşlarının 256-bit SSL korumalı altyapısı üzerinden doğrudan bankaya iletilir.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  3. KAMERA VE OPTİK ÖLÇÜM VERİLERİ GÜVENLİĞİ
                </h4>
                <p>
                  Kamera optik spektral analizinde kullanılan anlık görüntü kareleri yalnızca kullanıcının tarayıcısında (client-side) piksellerin frekans dalga boyuna dönüştürülmesi için işlenir; kamera video kayıtları veya fotoğrafları sunuculara depolanmaz ve 3. şahıslarla paylaşılmaz.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  4. VERİ SAHİBİNİN HAKLARI (KVKK MADDE 11)
                </h4>
                <p>
                  Kullanıcılar; verilerinin işlenip işlenmediğini öğrenme, yanlış işlenmişse düzeltilmesini talep etme ve kanuni şartlar çerçevesinde silinmesini isteme haklarına sahiptir. Talepler {ADMIN_EMAILS[0]} adresine iletilebilir.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 text-center sm:text-left">
            AuraBio Frekans Sistemi © {new Date().getFullYear()} AKN Global Group Ltd • Tüm Hakları Saklıdır.
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
          >
            Okudum, Anladım & Kabul Ediyorum
          </button>
        </div>

      </div>
    </div>
  );
};
