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
import { ADMIN_PHONE, ADMIN_EMAILS } from '../utils/authManager';
import { COMPANY_IDENTITY } from '../config/companyIdentity';

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
                  <div className="sm:col-span-2"><strong>Ticari Unvan:</strong> {COMPANY_IDENTITY.legalName}</div>
                  <div><strong>Marka:</strong> {COMPANY_IDENTITY.brandName}</div>
                  <div><strong>Yetkili:</strong> {COMPANY_IDENTITY.authorizedPerson}</div>
                  <div><strong>T.C. Kimlik No:</strong> {COMPANY_IDENTITY.taxNumber}</div>
                  <div><strong>Telefon / WhatsApp:</strong> {COMPANY_IDENTITY.internationalPhone}</div>
                  <div><strong>E-Posta:</strong> {COMPANY_IDENTITY.contactEmail}</div>
                  <div className="sm:col-span-2"><strong>Açık Adres:</strong> {COMPANY_IDENTITY.address}</div>
                  <div className="sm:col-span-2"><strong>Web:</strong> <a href={COMPANY_IDENTITY.website} target="_blank" rel="noreferrer">{COMPANY_IDENTITY.website}</a></div>
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
                  Paket bedeli, para birimi, vergiler ve kullanılabilir ödeme yöntemi sipariş özeti ile ödeme adımında gösterilir. Ödeme, yalnızca ödeme adımında açıkça sunulan yöntem üzerinden yapılmalıdır.
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
                    <span>CAYMA HAKKI BİLGİLENDİRMESİ:</span>
                  </div>
                  <p>
                    Cayma hakkı ve olası istisnalar işlemin niteliğine, ifa durumuna ve yürürlükteki mevzuata göre değerlendirilir. Bu metin kanuni hakları ortadan kaldırmaz; somut işlem için hukuk danışmanlığı alınmalıdır.
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
                <span>Mesafeli Satış Sözleşmesi (3D Secure Kart Ödemesi)</span>
              </div>

              <div className="space-y-3.5">
                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1">
                  MADDE 1 - TARAFLAR
                </h4>
                <div className="text-xs space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <p><strong>SATICI / HİZMET SAĞLAYICI:</strong> {COMPANY_IDENTITY.legalName}</p>
                  <p><strong>MARKA / YETKİLİ:</strong> {COMPANY_IDENTITY.brandName} — {COMPANY_IDENTITY.authorizedPerson}</p>
                  <p><strong>T.C. KİMLİK NO:</strong> {COMPANY_IDENTITY.taxNumber}</p>
                  <p><strong>ADRES:</strong> {COMPANY_IDENTITY.address}</p>
                  <p><strong>İLETİŞİM:</strong> {COMPANY_IDENTITY.internationalPhone} — {COMPANY_IDENTITY.contactEmail} — {COMPANY_IDENTITY.website}</p>
                  <p><strong>ALICI (MÜŞTERİ / BAYİ):</strong> AuraBio Frekans platformu üzerinden kayıt formunu dolduran, paketi seçen ve 3D Secure Sanal POS üzerinden ödemeyi gerçekleştiren gerçek veya tüzel kişidir.</p>
                </div>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  MADDE 2 - SÖZLEŞMENİN KONUSU VE HUKUKİ DAYANAĞI
                </h4>
                <p>
                  İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait akngroupwellness.com web uygulaması üzerinden elektronik ortamda siparişini verdiği, özellikleri ve satış bedeli belirtilen dijital yazılım kullanım lisansı ve seans kredi paketlerinin satışı, teslimi ve tarafların hak ve yükümlülüklerinin 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince düzenlenmesidir.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  MADDE 3 - SÖZLEŞME KONUSU ÜRÜN, BEDEL VE ÖDEME KOŞULLARI
                </h4>
                <p>
                  Satın alınan ürün/hizmet; seçilen seans kredisi miktarına veya süreli lisans paketine göre belirlenen dijital erişim yetkisidir. ALICI, sipariş ekranında teyit ettiği bedeli 3D Secure Sanal POS üzerinden kredi veya banka kartıyla ödemeyi kabul ve taahhüt eder.
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
                  Ödeme güvenliği ve itiraz süreçleri, işlemde kullanılan ödeme sağlayıcısının koşulları ve yürürlükteki mevzuat çerçevesinde değerlendirilir. Alıcı ve satıcının kanuni başvuru ve itiraz hakları saklıdır.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: İPTAL, İADE VE CAYMA HAKKI İSTİSNASI (DİJİTAL ÜRÜN KORUMASI) */}
          {activeTab === 'cancellationRefund' && (
            <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border-2 border-rose-500/40">
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 font-bold text-xs flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400 shrink-0" />
                <span>İptal, İade ve Cayma Hakkı Şartları</span>
              </div>

              <div className="space-y-3.5 text-slate-200">
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                  <h4 className="font-black text-rose-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>İPTAL, İADE VE CAYMA KOŞULLARI</span>
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-200">
                    Cayma, iptal ve iade koşulları işlemin niteliğine ve yürürlükteki tüketici mevzuatına göre değerlendirilir. Aşağıdaki metin hukuki danışman incelemesi gerektiren bilgilendirmedir:
                  </p>
                  <blockquote className="p-3 rounded-xl bg-slate-900 border-l-4 border-rose-500 text-xs italic font-medium text-amber-200">
                    "Cayma hakkına uygulanacak istisnalar, yürürlükteki mevzuat ve somut işlem koşullarına göre belirlenir."
                  </blockquote>
                </div>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  1. DİJİTAL LİSANS VE SEANS KREDİLERİNİN NİTELİĞİ
                </h4>
                <p>
                  AuraBio Frekans sistemi üzerinden sunulan dijital hizmet ve seans kredilerinin teslim/başlangıç zamanı sipariş kaydında gösterilir. Cayma, iptal ve iade koşulları yürürlükteki mevzuat ve somut sipariş durumuna göre uygulanır.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  2. İPTAL VE İADE TALEPLERİ
                </h4>
                <p>
                  İptal veya iade talepleri destek kanallarından iletilir ve mevzuata uygun olarak değerlendirilir. Kullanıcıların kanuni hakları bu bilgilendirme ile sınırlandırılmaz.
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
                  AuraBio Frekans markası ve içerikleri üzerindeki haklar, ilgili kayıtlar ve yürürlükteki mevzuat çerçevesinde değerlendirilir. Sistem işletmecisinin bilgileri: {COMPANY_IDENTITY.legalName}; yetkili: {COMPANY_IDENTITY.authorizedPerson}.
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
                  6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu bilgileri: {COMPANY_IDENTITY.legalName}, {COMPANY_IDENTITY.address}, {COMPANY_IDENTITY.phone}, {COMPANY_IDENTITY.contactEmail}. Kişisel veriler hizmetin sunulması ve mevzuattan doğan yükümlülükler kapsamında işlenir.
                </p>

                <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1 pt-2">
                  2. KREDİ KARTI BİLGİLERİNİN SAKLANMAMASI GÜVENCESİ
                </h4>
                <p>
                  Ödeme sırasında kart verilerinin işlenme biçimi, kullanılan ödeme sağlayıcısının altyapısına bağlıdır. Sağlayıcı ve veri işleme bilgileri ödeme adımında ayrıca açıklanmalı; bu metin tek başına kart verilerinin saklanmadığını doğrulamaz.
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
            {COMPANY_IDENTITY.brandName} © {new Date().getFullYear()} • {COMPANY_IDENTITY.legalName}
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
