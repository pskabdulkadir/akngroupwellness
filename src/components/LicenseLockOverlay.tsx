import React, { useState } from 'react';
import { 
  ShieldAlert, 
  KeyRound, 
  Copy, 
  Check, 
  MessageSquare, 
  Clock, 
  Lock, 
  ArrowRight, 
  Sparkles,
  PhoneCall,
  Settings,
  RefreshCw
} from 'lucide-react';
import { 
  ADMIN_PHONE, 
  getWhatsAppContactUrl, 
  activateDeviceViaKey, 
  DeviceLicense,
  checkLicenseAccess 
} from '../utils/licenseManager';

interface LicenseLockOverlayProps {
  deviceId: string;
  currentLicense: DeviceLicense | null;
  onRefreshStatus: () => Promise<void>;
  onOpenAdmin: () => void;
}

export const LicenseLockOverlay: React.FC<LicenseLockOverlayProps> = ({
  deviceId,
  currentLicense,
  onRefreshStatus,
  onOpenAdmin,
}) => {
  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  const access = checkLicenseAccess(currentLicense);

  const handleCopyDeviceId = async () => {
    try {
      await navigator.clipboard.writeText(deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = deviceId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshNotice(null);
    try {
      await onRefreshStatus();
      setRefreshNotice('Durum güncellendi. Firebase Firestore kontrol edildi.');
      setTimeout(() => setRefreshNotice(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) {
      setErrorMessage('Lütfen lisans anahtarınızı giriniz.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await activateDeviceViaKey(deviceId, licenseKeyInput);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(async () => {
          await onRefreshStatus();
        }, 1000);
      } else {
        setErrorMessage(res.message || 'Lisans anahtarı doğrulanamadı.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Aktivasyon sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/70 space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-amber-500/20 border border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/60">
            {access.isExpired ? (
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            ) : (
              <Lock className="w-8 h-8 text-emerald-400 animate-pulse" />
            )}
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{access.isExpired ? 'Lisans Süresi Doldu' : 'Yönetici Onayı Bekleniyor'}</span>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-100 mt-2">
              AuraBio Lisans & Erişim Kilidi
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Cihazınız sisteme otomatik kaydedilmiştir. Uygulamayı kullanabilmek için yönetici onayı (<code className="text-emerald-300">isAllowed: true</code>) gereklidir.
            </p>
          </div>
        </div>

        {/* 1. Device ID Card */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              CİHAZ KİMLİĞİNİZ (DEVICE ID)
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Otomatik Kayıtlı</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs sm:text-sm font-bold text-emerald-300 tracking-wider overflow-x-auto select-all">
              {deviceId}
            </div>
            <button
              type="button"
              onClick={handleCopyDeviceId}
              className={`p-3 rounded-xl border text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                copied 
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Cihaz Kodunu Kopyala"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Kodu Kopyala</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Action Buttons: WhatsApp & Refresh Status */}
        <div className="space-y-2.5">
          <a
            href={getWhatsAppContactUrl(deviceId)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/50 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Yöneticiye WhatsApp ile İlet ({ADMIN_PHONE})</span>
          </a>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Firestore Kontrol Ediliyor...' : 'Durumu Kontrol Et / Yenile'}</span>
          </button>

          {refreshNotice && (
            <div className="text-[11px] text-center text-emerald-400 animate-fade-in font-medium">
              {refreshNotice}
            </div>
          )}
        </div>

        {/* 3. Optional Key Activation Form */}
        <div className="pt-4 border-t border-slate-800/80">
          <form onSubmit={handleActivateKey} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Lisans Anahtarınız Varsa Giriniz:</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  placeholder="AKN-30D-XXXX-XXXX"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs font-mono text-slate-100 uppercase"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                >
                  {isSubmitting ? 'Doğrulanıyor...' : 'Aktifleştir'}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer Admin Portal Button */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-[11px]">
            <PhoneCall className="w-3 h-3 text-emerald-500" />
            <span>Destek: {ADMIN_PHONE}</span>
          </span>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors font-medium text-[11px]"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Yönetici Paneli</span>
          </button>
        </div>

      </div>
    </div>
  );
};
