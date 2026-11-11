import React, { useState } from 'react';
import { 
  Lock, 
  Clock, 
  MessageSquare, 
  RefreshCw, 
  LogOut, 
  User, 
  Mail, 
  Phone, 
  Sparkles, 
  CreditCard, 
  Building2, 
  Copy, 
  Check, 
  ChevronRight, 
  Scale,
  X
} from 'lucide-react';
import { 
  UserMember, 
  ADMIN_PHONE, 
  BANK_INFO, 
  MEMBERSHIP_PACKAGES,
  getWhatsAppPaymentReceiptUrl, 
  checkMemberAccess 
} from '../utils/authManager';
import { LegalContractsModal, LegalContractTab } from './LegalContractsModal';

interface MembershipWaitingOverlayProps {
  user: UserMember;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
  onOpenPaymentModal: () => void;
  onOpenDealerDashboard?: () => void;
  onDismiss?: () => void;
}

export const MembershipWaitingOverlay: React.FC<MembershipWaitingOverlayProps> = ({
  user,
  onRefresh,
  onLogout,
  onOpenPaymentModal,
  onOpenDealerDashboard,
  onDismiss,
}) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [activeLegalTab, setActiveLegalTab] = useState<LegalContractTab>('preInfo');

  const access = checkMemberAccess(user);
  const selectedPkg = MEMBERSHIP_PACKAGES.find(p => p.id === user.selectedPackage) || MEMBERSHIP_PACKAGES[1];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshNotice(null);
    try {
      await onRefresh();
      setRefreshNotice('Üyelik durumunuz kontrol edildi.');
      setTimeout(() => setRefreshNotice(null), 3500);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyIban = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(BANK_INFO.iban);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const openLegalTab = (tab: LegalContractTab) => {
    setActiveLegalTab(tab);
    setIsLegalModalOpen(true);
  };

  const whatsappUrl = getWhatsAppPaymentReceiptUrl(user, selectedPkg);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/80 space-y-6 max-h-[92vh] overflow-y-auto">
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center border border-slate-700/80 transition-colors shadow-md cursor-pointer"
            title="Kapat / Önizlemeye Geç"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Status Icon & Title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-500/40 text-amber-300 mx-auto flex items-center justify-center shadow-lg shadow-amber-950/50">
            {access.isExpired ? (
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            ) : (
              <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
            )}
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{access.isExpired ? 'Kullanım Süresi Bitti • Ödeme Yapınız' : 'Ödeme & Yönetici Onayı Bekleniyor'}</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-100 mt-2">
              Hoş Geldiniz, {user?.fullName || user?.email || 'Danışan'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {access.isExpired
                ? 'Üyelik paketinizin kullanım süresi sona ermiştir. Yeniden paket satın alıp dekontunuzu ileterek sürenizi uzatabilirsiniz.'
                : 'Üyeliğiniz kaydedildi. Seçtiğiniz paketin ödemesini IBAN adresine yapıp dekontunuzu iletmeniz gerekmektedir.'}
            </p>
          </div>
        </div>

        {/* Selected Package Banner */}
        <div 
          onClick={onOpenPaymentModal}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 cursor-pointer transition-all flex items-center justify-between group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Seçilen Paket
              </div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{selectedPkg.name}</span>
                <span className="text-emerald-400 font-mono">({selectedPkg.priceText})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Paketi Değiştir</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Quick IBAN Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-850 pb-2">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{BANK_INFO.bankName} - {BANK_INFO.accountHolder}</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="font-mono text-emerald-400 font-bold text-xs sm:text-sm truncate select-all">
              {BANK_INFO.iban}
            </div>
            <button
              type="button"
              onClick={handleCopyIban}
              className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 shrink-0"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>
          </div>
        </div>

        {/* Member Info Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-850 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>Üye No: <strong className="text-slate-200 font-mono">{user.uid}</strong></span>
          <span>E-Posta: <strong className="text-slate-200">{user.email}</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* WhatsApp Direct Receipt Request */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/50 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Ödeme Dekontunu WhatsApp ile Gönder ({ADMIN_PHONE})</span>
          </a>

          {/* Open Full Payment Modal */}
          <button
            type="button"
            onClick={onOpenPaymentModal}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Tüm Üyelik Paketlerini & IBAN Bilgilerini Gör</span>
          </button>

          {/* Refresh Firestore Status */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Kontrol Ediliyor...' : 'Durumu Kontrol Et / Yenile'}</span>
          </button>

          {refreshNotice && (
            <div className="text-[11px] text-center text-emerald-400 animate-fade-in font-medium">
              {refreshNotice}
            </div>
          )}
        </div>

        {/* Real-time Notice */}
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300 text-center flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Yönetici onayladığı anda bu kilit ekranı otomatik olarak açılacaktır.</span>
        </div>

        {/* Legal Links */}
        <div className="text-[11px] text-slate-500 text-center flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={() => openLegalTab('preInfo')}
            className="hover:text-emerald-400 underline transition-colors"
          >
            Ön Bilgilendirme
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => openLegalTab('distanceSale')}
            className="hover:text-emerald-400 underline transition-colors"
          >
            Mesafeli Satış Sözleşmesi
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => openLegalTab('terms')}
            className="hover:text-emerald-400 underline transition-colors"
          >
            Kullanım Koşulları
          </button>
        </div>

        {/* Member Profile & Logout Option */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            {onOpenDealerDashboard && (
              <button
                type="button"
                onClick={onOpenDealerDashboard}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bayi Paneli</span>
              </button>
            )}

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-slate-400 hover:text-emerald-400 font-semibold transition-colors cursor-pointer text-xs"
              >
                Önizlemeye Geç & İncele
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış Yap</span>
          </button>
        </div>

        {/* Sub-modal: Full-text Legal Contracts Viewer */}
        <LegalContractsModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={activeLegalTab}
        />

      </div>
    </div>
  );
};

export default MembershipWaitingOverlay;

