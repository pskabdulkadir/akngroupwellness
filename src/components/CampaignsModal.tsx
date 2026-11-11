import React, { useState, useEffect } from 'react';
import { 
  X, 
  Gift, 
  Sparkles, 
  Tag, 
  Flame, 
  Copy, 
  Check, 
  MessageCircle, 
  ArrowRight, 
  Calendar, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Building2,
  Zap,
  Info
} from 'lucide-react';
import { 
  CampaignItem, 
  subscribeToCampaigns, 
  getStoredCampaigns 
} from '../utils/campaignManager';
import { ADMIN_PHONE_CLEAN, ADMIN_PHONE } from '../utils/authManager';

interface CampaignsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: (tab: 'login' | 'register') => void;
  onOpenPayment?: () => void;
}

export const CampaignsModal: React.FC<CampaignsModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onOpenPayment,
}) => {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(() => getStoredCampaigns());
  const [activeFilter, setActiveFilter] = useState<'all' | 'featured' | 'dealers' | 'news'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedCampId, setExpandedCampId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToCampaigns((list) => {
      setCampaigns(list.filter(c => c.isActive));
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredCampaigns = campaigns.filter((camp) => {
    if (activeFilter === 'featured') return camp.featured;
    if (activeFilter === 'dealers') return camp.targetAudience === 'dealers';
    if (activeFilter === 'news') return !camp.couponCode && !camp.discountRate;
    return true;
  });

  const getWhatsAppLink = (camp: CampaignItem) => {
    const text = camp.whatsappMessage || 
      `Merhaba, AuraBio Frekans sisteminde "${camp.title}" kampanyası hakkında bilgi almak istiyorum.${camp.couponCode ? ` (Kupon Kodu: ${camp.couponCode})` : ''}`;
    return `https://wa.me/${ADMIN_PHONE_CLEAN}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/50 rounded-3xl p-4 sm:p-7 shadow-2xl shadow-amber-950/80 space-y-4 sm:space-y-5 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 shrink-0 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
              <Gift className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-slate-100">
                  Özel Kampanyalar, Fırsatlar & Duyurular
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  🔥 Aktif Fırsatlar
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                AuraBio Kuantum Biyo-Rezonans sistemine özel güncel indirim kodları ve bayi avantajları
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

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tüm Kampanyalar ({campaigns.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('featured')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'featured'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⭐ Öne Çıkanlar
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('dealers')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'dealers'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏢 Bayilere Özel Fırsatlar
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('news')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'news'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📢 Sistem Güncellemeleri
          </button>
        </div>

        {/* Campaign List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
          {filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              Bu kategoride şu anda listelenen aktif kampanya bulunmamaktadır.
            </div>
          ) : (
            filteredCampaigns.map((camp) => {
              const isExpanded = expandedCampId === camp.id;
              return (
                <div
                  key={camp.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                    camp.featured
                      ? 'bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-900 border-amber-500/50 shadow-xl shadow-amber-950/30'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {camp.badge}
                      </span>
                      {camp.featured && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                          ⭐ ÖNE ÇIKAN FIRSAT
                        </span>
                      )}
                      {camp.discountRate && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {camp.discountRate}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Geçerlilik: <strong>{camp.validUntilText}</strong></span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {camp.description}
                    </p>
                  </div>

                  {/* Detailed expandable section */}
                  {camp.detailedContent && (
                    <div>
                      {isExpanded && (
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2 mt-2 animate-fade-in">
                          <div className="font-bold text-amber-300 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-amber-400" />
                            <span>Kampanya Detayları & Koşulları:</span>
                          </div>
                          <p>{camp.detailedContent}</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedCampId(isExpanded ? null : camp.id)}
                        className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Daha Az Göster' : 'Detaylı Bilgi & Şartları Gör'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Action row with coupon code & CTA */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {camp.couponCode ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">İndirim Kodu:</span>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs">
                          <span>{camp.couponCode}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(camp.couponCode!)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Kodu Kopyala"
                          >
                            {copiedCode === camp.couponCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {copiedCode === camp.couponCode && (
                          <span className="text-[10px] text-emerald-400 font-bold animate-fade-in">
                            Kopyalandı!
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">
                        AuraBio Resmi Duyurusu
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <a
                        href={getWhatsAppLink(camp)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp’tan Bilgi Al</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {camp.targetAudience === 'dealers' && onOpenAuth ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAuth('register');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Bayi Kaydı Yap</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : onOpenPayment ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenPayment();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Paketleri İncele</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            Kampanyalar ve bayilik şartları hakkında anlık canlı destek: <strong>{ADMIN_PHONE}</strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
