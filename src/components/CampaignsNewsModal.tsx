import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Tag, 
  Copy, 
  Check, 
  MessageCircle, 
  ExternalLink, 
  Gift, 
  Flame, 
  Award, 
  Calendar, 
  Bell, 
  Briefcase,
  ChevronRight,
  Zap,
  ArrowRight
} from 'lucide-react';
import { CampaignItem, subscribeToCampaigns } from '../utils/campaignManager';
import { ADMIN_PHONE } from '../utils/authManager';

interface CampaignsNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPackage?: () => void;
  onOpenDealerRegister?: () => void;
}

export const CampaignsNewsModal: React.FC<CampaignsNewsModalProps> = ({
  isOpen,
  onClose,
  onSelectPackage,
  onOpenDealerRegister,
}) => {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'dealers' | 'featured'>('all');

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToCampaigns((list) => {
      setCampaigns(list.filter(c => c.isActive));
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const getWhatsAppUrl = (camp: CampaignItem) => {
    const phone = ADMIN_PHONE.replace(/\D/g, '');
    const msg = camp.whatsappMessage || `Merhaba, AuraBio ${camp.title} kampanyasından yararlanmak istiyorum. Kupon: ${camp.couponCode || 'Yok'}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (selectedFilter === 'dealers') return c.targetAudience === 'dealers';
    if (selectedFilter === 'featured') return c.featured;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-amber-500/50 rounded-3xl p-4 sm:p-7 shadow-2xl shadow-amber-950/80 space-y-5 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 shrink-0 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold bg-gradient-to-r from-amber-300 via-orange-200 to-amber-100 bg-clip-text text-transparent">
                  AuraBio Kampanyalar & Güncel Duyurular
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Aktif Fırsatlar</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Yetkili bayilerimiz ve danışanlarımız için özel seans bonusları, paket indirimleri ve yenilikler
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'all'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tüm Kampanyalar ({campaigns.length})</span>
          </button>

          <button
            onClick={() => setSelectedFilter('featured')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'featured'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Öne Çıkan Fırsatlar</span>
          </button>

          <button
            onClick={() => setSelectedFilter('dealers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'dealers'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>Bayilere Özel Fırsatlar</span>
          </button>
        </div>

        {/* Scrollable Campaign Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {filteredCampaigns.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <Bell className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">Şu anda bu kategoride aktif kampanya bulunmuyor.</div>
              <div className="text-xs text-slate-500">Yeni duyurular için lütfen bu ekranı takip ediniz.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between relative space-y-3 ${
                    camp.featured
                      ? 'bg-gradient-to-br from-amber-950/70 via-slate-950 to-slate-900 border-amber-500/60 shadow-xl shadow-amber-950/30'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge & Target Audience */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400 fill-current" />
                      <span>{camp.badge}</span>
                    </span>

                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{camp.validUntilText}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-100 leading-snug">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {camp.description}
                    </p>
                    {camp.detailedContent && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                        {camp.detailedContent}
                      </p>
                    )}
                  </div>

                  {/* Coupon & Action Area */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                    {camp.couponCode && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-dashed border-amber-500/50">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px] text-slate-400">Kampanya Kodu:</span>
                          <span className="font-mono font-black text-xs text-amber-300 tracking-wider">
                            {camp.couponCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(camp.couponCode!)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        >
                          {copiedCode === camp.couponCode ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">Kopyalandı!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Kodu Kopyala</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <a
                        href={getWhatsAppUrl(camp)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp'tan Yararlan</span>
                      </a>

                      {camp.targetAudience === 'dealers' && onOpenDealerRegister ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenDealerRegister();
                          }}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-98 cursor-pointer shrink-0"
                        >
                          <span>Bayi Ol</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : onSelectPackage ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectPackage();
                          }}
                          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 border border-slate-700 transition-all active:scale-98 cursor-pointer shrink-0"
                        >
                          <span>Paketleri Gör</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="text-[10px] text-slate-400 text-center sm:text-left">
            Kampanyalar sınırlı kontenjan ile geçerlidir. AuraBio önceden haber vermeksizin koşulları değiştirme hakkını saklı tutar.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
