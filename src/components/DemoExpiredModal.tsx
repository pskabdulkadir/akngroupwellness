import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Sparkles, 
  UserPlus, 
  LogIn, 
  Building2, 
  BookOpen, 
  Smartphone, 
  CheckCircle2, 
  Radio, 
  Activity, 
  Layers, 
  FileText,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  HelpCircle,
  X,
  RotateCcw,
  ShieldCheck,
  Send,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  getStoredReferralCode, 
  getResellerByCode, 
  Reseller 
} from '../utils/resellerManager';
import { 
  DeviceDemoStatus, 
  requestDemoRenewal, 
  getDemoRenewalState,
  clearDemoRenewalPendingState
} from '../utils/deviceDemoManager';
import { ADMIN_PHONE_CLEAN, ADMIN_PHONE } from '../utils/authManager';
import { useLanguage } from '../utils/i18n';

interface DemoExpiredModalProps {
  isOpen: boolean;
  demoStatus: DeviceDemoStatus;
  onClose?: () => void;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onOpenDealer: () => void;
  onOpenPresentation?: () => void;
}

export const DemoExpiredModal: React.FC<DemoExpiredModalProps> = ({
  isOpen,
  demoStatus,
  onClose,
  onOpenRegister,
  onOpenLogin,
  onOpenDealer,
  onOpenPresentation
}) => {
  const [referringDealer, setReferringDealer] = useState<Reseller | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<'none' | 'yes' | 'no'>('none');
  const [showRenewalFlow, setShowRenewalFlow] = useState<boolean>(false);
  const [requesterName, setRequesterName] = useState<string>('');
  const [requesterPhone, setRequesterPhone] = useState<string>('');
  const [requesterNote, setRequesterNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [renewalState, setRenewalState] = useState(getDemoRenewalState());
  const [manualCheckMsg, setManualCheckMsg] = useState<string | null>(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    setSelectedFeedback('none');
    setRenewalState(getDemoRenewalState());

    const refCode = getStoredReferralCode();
    if (refCode) {
      getResellerByCode(refCode).then(dealer => {
        if (dealer) setReferringDealer(dealer);
      });
    }
  }, [isOpen]);

  // If demo is reactivated by admin approval, close modal if open
  useEffect(() => {
    if (!demoStatus.isExpired && isOpen) {
      if (onClose) {
        onClose();
      }
    }
  }, [demoStatus.isExpired, isOpen, onClose]);

  if (!isOpen) return null;

  const adminWhatsappUrl = `https://wa.me/${ADMIN_PHONE_CLEAN}?text=${encodeURIComponent(
    language === 'en'
      ? `Hello, my 30-minute AuraBio trial has expired on device ${demoStatus.deviceUUID.substring(0, 10)}. I would like to request a trial extension or assistance.`
      : `Merhaba, AuraBio 30 dakikalık deneme sürem bitti (Cihaz No: ${demoStatus.deviceUUID.substring(0, 10)}). Sistemi tekrar denemek veya lisans almak için görüşmek istiyorum.`
  )}`;

  const handleSendRenewalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await requestDemoRenewal({
        fullName: requesterName,
        phone: requesterPhone,
        note: requesterNote
      });

      setRenewalState(getDemoRenewalState());
      setShowRenewalFlow(false);

      // Open WhatsApp to send the message to the admin
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Demo renewal request error:', err);
      alert('Talebiniz iletilirken bir hata oluştu. Lütfen doğrudan WhatsApp üzerinden iletişime geçiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCheck = () => {
    setManualCheckMsg(
      language === 'en'
        ? 'Checking approval status with server...'
        : 'Yönetici onay durumu kontrol ediliyor... Henüz onaylanmadıysa lütfen yöneticinize WhatsApp üzerinden onay isteğinizi hatırlatınız.'
    );
    setRenewalState(getDemoRenewalState());
    setTimeout(() => {
      setManualCheckMsg(null);
    }, 4500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/95 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-expired-title"
    >
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/60 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Glow Header Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center border border-slate-700/80 transition-colors shadow-md cursor-pointer"
            title="Kapat / Önizlemeye Geç"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto">

          {/* Icon and Main Announcement */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-400 shadow-xl shadow-amber-950/50 animate-pulse">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'en' ? '30-MINUTE TRIAL FINISHED' : '30 DAKİKALIK DENEME SÜRESİ TAMAMLANDI'}</span>
              </div>
              <h2 
                id="demo-expired-title"
                className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight"
              >
                {language === 'en' ? 'Free Demo Period Has Ended' : 'Ücretsiz Demo Süreniz Sona Ermiştir'}
              </h2>
            </div>
          </div>

          {/* PENDING APPROVAL ALERT BANNER IF USER ALREADY SENT A REQUEST */}
          {renewalState.isPending && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/80 border-2 border-amber-500/60 text-left space-y-3 shadow-xl shadow-amber-950/40 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 animate-spin-slow">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                    <span>⏳ Yönetici Onayı Bekleniyor</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-500/40 font-mono">
                      Onay Gerekli
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    Demo sürenizin yeniden başlatılması için WhatsApp üzerinden yöneticinize onay talebi iletildi. 
                    <strong> Yönetici sistem panelinden onay verdiği anda demo süreniz otomatik olarak 30 dakika yenilenecek ve bu ekran açılacaktır.</strong>
                  </p>
                  {renewalState.requestedAt && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      Talep Zamanı: {new Date(renewalState.requestedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              {manualCheckMsg && (
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/40 text-xs text-amber-300 font-medium">
                  {manualCheckMsg}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualCheck}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Onay Durumunu Sorgula</span>
                </button>

                <a
                  href={adminWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp’tan Hatırlat</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    clearDemoRenewalPendingState();
                    setRenewalState({ isPending: false });
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                  title="Yeni talep formu aç"
                >
                  Yeniden Talep Et
                </button>
              </div>
            </div>
          )}

          {/* RENEWAL REQUEST FORM CARD (WHEN USER CLICKS RENEW DEMO) */}
          {showRenewalFlow && !renewalState.isPending && (
            <form onSubmit={handleSendRenewalRequest} className="p-5 rounded-2xl bg-slate-900/95 border-2 border-teal-500/50 text-left space-y-4 shadow-xl shadow-teal-950/40 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <span>Yönetici Onayı İle Demo Yenileme</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRenewalFlow(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Yöneticiden Onay İsteyin</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  30 dakikalık deneme süresini yeniden başlatabilmek için sistem yöneticisine WhatsApp üzerinden onay talebi gönderilir. 
                  <strong> Yönetici panele girip onaylamadan demo tekrar açılmaz.</strong> Yönetici onay verdiği anda demo süreniz 30 dakika olarak hemen başlayacaktır.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Adınız Soyadınız / Klinik veya Kurum İsmi
                  </label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="Örn: Dr. Ahmet Yılmaz / Yaşam Danışmanlık"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    WhatsApp Telefon Numaranız
                  </label>
                  <input
                    type="tel"
                    value={requesterPhone}
                    onChange={(e) => setRequesterPhone(e.target.value)}
                    placeholder="Örn: 0532 123 45 67"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Not / Ek Açıklama (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={requesterNote}
                    onChange={(e) => setRequesterNote(e.target.value)}
                    placeholder="Örn: Cihazı danışanımla birlikte test ediyorum, tekrar demo açılmasını rica ederim."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'İletiliyor...' : 'WhatsApp ile Yöneticiye Onay Talebi Gönder'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRenewalFlow(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          )}

          {/* Primary Feedback Box (Nasıl, faydalı oldu değil mi?) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-center space-y-4 shadow-lg">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-emerald-300">
                {language === 'en' ? 'How was it, was it helpful for you?' : 'Nasıl, faydalı oldu değil mi?'}
              </h3>
              <p className="text-xs text-slate-300">
                {language === 'en' 
                  ? 'Please share your experience to continue or request further guidance.'
                  : 'Deneyiminizi seçerek üyeliğinizi başlatabilir veya destek talep edebilirsiniz.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <button
                onClick={() => {
                  setSelectedFeedback('yes');
                  onOpenRegister();
                }}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-95 transition-all cursor-pointer"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{language === 'en' ? 'Yes, very useful!' : 'Evet, Çok Faydalı Oldu'}</span>
              </button>

              <button
                onClick={() => setSelectedFeedback('no')}
                className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedFeedback === 'no'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>{language === 'en' ? 'No / Need Help' : 'Hayır'}</span>
              </button>
            </div>

            {/* If user clicked 'Hayır' -> Show admin contact message & WhatsApp redirect button */}
            {selectedFeedback === 'no' && (
              <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-left space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-rose-200">
                      {language === 'en' 
                        ? 'Contact the administrator to try again'
                        : 'Yöneticiden Onay İsteyin'}
                    </div>
                    <div className="text-[11px] text-slate-300 leading-relaxed">
                      {language === 'en'
                        ? 'If you encountered issues or need a demo reset, send an approval request to the administrator. The demo will reopen once approved from the admin panel.'
                        : '30 dakikalık demoyu yeniden başlatabilmek için sistem yöneticisine WhatsApp üzerinden onay talebi gönderebilirsiniz. Yönetici onaylamadan demo tekrar açılmaz.'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRenewalFlow(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Yönetici Onayı ile Demo Yenile</span>
                  </button>

                  <a
                    href={adminWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp’tan İletişime Geç</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Referring Dealer Banner if present */}
          {referringDealer && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">
                    {language === 'en' ? 'Invited by Authorized Dealer' : 'Sizi Davet Eden Yetkili Bayi'}
                  </div>
                  <div className="font-extrabold text-slate-100 text-sm">{referringDealer.resellerName}</div>
                  <div className="text-[10px] text-slate-300">
                    {language === 'en' 
                      ? 'Your registration will be directly linked to this authorized dealer network.'
                      : 'Kayıt olduğunuzda üyeliğiniz doğrudan bu bayinin yetkili ağına bağlanacaktır.'}
                  </div>
                </div>
              </div>

              {referringDealer.phone && (
                <a
                  href={`https://wa.me/${referringDealer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    language === 'en'
                      ? `Hello ${referringDealer.resellerName}, my 30-minute AuraBio demo has ended. I would like to discuss license details.`
                      : `Merhaba ${referringDealer.resellerName}, AuraBio 30 dakikalık demom tamamlandı. Lisans ve bayilik detayları hakkında görüşmek istiyorum.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-md shadow-emerald-950"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Consult via WhatsApp' : 'WhatsApp ile Danış'}</span>
                </a>
              )}
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={onOpenRegister}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              <span>{language === 'en' ? 'Register Now & Continue with Full Access' : 'Hemen Kayıt Ol & Sınırsız Devam Et'}</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={onOpenLogin}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                <span>{language === 'en' ? 'Already have an account? Log In' : 'Zaten Hesabım Var (Giriş Yap)'}</span>
              </button>

              <button
                onClick={onOpenDealer}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>{language === 'en' ? 'Become an Authorized Dealer' : 'Bayilik Başvurusu Yap'}</span>
              </button>
            </div>

            {onOpenPresentation && (
              <button
                onClick={onOpenPresentation}
                className="w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === 'en' ? 'View Business & Dealership Presentation' : 'İş & Bayilik Sunumunu İncele'}</span>
              </button>
            )}

            {/* DEMO RENEWAL WITH ADMIN APPROVAL */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRenewalFlow(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-teal-950/80 hover:bg-teal-900/90 text-teal-300 hover:text-teal-100 text-xs font-semibold border border-teal-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                title="Yöneticiden onay isteyerek 30 dakikalık demoyu yeniden başlatır"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Request Demo Renewal (Admin Approval)' : '30 Dk Demoyu Yenile & Test Et (Yönetici Onaylı)'}</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{language === 'en' ? 'Close Modal' : 'Önizlemeye Geç'}</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer Security Notice */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>{language === 'en' ? 'Device ID:' : 'Cihaz Kimliği:'} {demoStatus.deviceUUID.substring(0, 16)}...</span>
          <span>AKN Global Group Güvencesiyle</span>
        </div>

      </div>
    </div>
  );
};
