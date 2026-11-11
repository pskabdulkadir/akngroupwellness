import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Tag, 
  Gift, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  MessageCircle, 
  Layers, 
  Zap, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  CampaignItem, 
  subscribeToCampaigns, 
  saveOrUpdateCampaign, 
  deleteCampaign, 
  DEFAULT_CAMPAIGNS 
} from '../utils/campaignManager';
import { ADMIN_PHONE } from '../utils/authManager';

interface CampaignsManagerAdminTabProps {
  onSuccessMessage?: (msg: string) => void;
}

export const CampaignsManagerAdminTab: React.FC<CampaignsManagerAdminTabProps> = ({
  onSuccessMessage,
}) => {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteCandidate, setDeleteCandidate] = useState<CampaignItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [detailedContent, setDetailedContent] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [validUntilText, setValidUntilText] = useState('Bu Ay Sonuna Kadar');
  const [targetAudience, setTargetAudience] = useState<'all' | 'dealers' | 'members'>('all');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [featured, setFeatured] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState('Hemen Başvur');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  useEffect(() => {
    const unsub = subscribeToCampaigns((list) => {
      setCampaigns(list);
    });
    return () => unsub();
  }, []);

  const handleOpenCreate = () => {
    setIsCreating(true);
    setEditingCampaign(null);
    setTitle('');
    setBadge('🔥 %20 İNDİRİM');
    setDescription('');
    setDetailedContent('');
    setDiscountRate('%20 İndirim');
    setCouponCode(`AURA-${Math.floor(100 + Math.random() * 900)}`);
    setValidUntilText('Sınırlı Süre');
    setTargetAudience('all');
    setIsActive(true);
    setFeatured(false);
    setButtonText('Kampanyadan Yararlan');
    setWhatsappMessage('Merhaba, güncel kampanya hakkında bilgi almak ve sipariş vermek istiyorum.');
  };

  const handleOpenEdit = (camp: CampaignItem) => {
    setEditingCampaign(camp);
    setIsCreating(false);
    setTitle(camp.title);
    setBadge(camp.badge || '');
    setDescription(camp.description);
    setDetailedContent(camp.detailedContent || '');
    setDiscountRate(camp.discountRate || '');
    setCouponCode(camp.couponCode || '');
    setValidUntilText(camp.validUntilText || '');
    setTargetAudience(camp.targetAudience || 'all');
    setIsActive(camp.isActive);
    setFeatured(Boolean(camp.featured));
    setButtonText(camp.buttonText || 'Kampanyadan Yararlan');
    setWhatsappMessage(camp.whatsappMessage || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Lütfen Başlık ve Açıklama alanlarını doldurunuz.');
      return;
    }

    setLoading(true);
    const item: CampaignItem = {
      id: editingCampaign ? editingCampaign.id : `camp_${Date.now()}`,
      title: title.trim(),
      badge: badge.trim() || '🔥 FIRSAT',
      description: description.trim(),
      detailedContent: detailedContent.trim(),
      discountRate: discountRate.trim(),
      couponCode: couponCode.trim().toUpperCase(),
      validUntilText: validUntilText.trim() || 'Süresiz',
      targetAudience,
      isActive,
      featured,
      buttonText: buttonText.trim() || 'Kampanyadan Yararlan',
      whatsappMessage: whatsappMessage.trim(),
      createdAt: editingCampaign?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    const res = await saveOrUpdateCampaign(item);
    setLoading(false);
    if (res.success) {
      setIsCreating(false);
      setEditingCampaign(null);
      if (onSuccessMessage) {
        onSuccessMessage(res.message);
      }
    } else {
      alert(res.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setLoading(true);
    const res = await deleteCampaign(deleteCandidate.id);
    setLoading(false);
    if (res.success) {
      setDeleteCandidate(null);
      if (onSuccessMessage) {
        onSuccessMessage('Kampanya başarıyla silindi.');
      }
    } else {
      alert(res.message);
    }
  };

  const handleToggleStatus = async (camp: CampaignItem) => {
    const updated = { ...camp, isActive: !camp.isActive };
    await saveOrUpdateCampaign(updated);
    if (onSuccessMessage) {
      onSuccessMessage(`Kampanya durumu ${updated.isActive ? 'Aktif' : 'Pasif'} olarak güncellendi.`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Kampanyalar & Güncel Duyuru Yönetimi</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Kullanıcıların ve bayilerin ana ekrandaki "Kampanyalar" panelinde göreceği özel fırsatlar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-950 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kampanya Ekle</span>
          </button>
        </div>
      </div>

      {/* Campaign Form (Create / Edit) */}
      {(isCreating || editingCampaign) && (
        <form onSubmit={handleSave} className="p-5 rounded-2xl bg-slate-950 border border-amber-500/50 space-y-4 animate-fade-in shadow-xl shadow-amber-950/30">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isCreating ? 'Yeni Kampanya & Fırsat Tanımla' : 'Kampanyayı Düzenle'}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingCampaign(null);
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-300">Kampanya Başlığı *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Yeni Bayilere Özel %25 Ek Seans Kredisi"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Rozet / Etiket Metni</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Örn: 🔥 %25 EKSTRA KREDİ"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Kupon / İndirim Kodu</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Örn: AURA-BAYI-25"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono font-bold uppercase focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">İndirim / Bonus Oranı</label>
              <input
                type="text"
                value={discountRate}
                onChange={(e) => setDiscountRate(e.target.value)}
                placeholder="Örn: %25 İlave Bonus veya $101 İndirim"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Geçerlilik Tarihi</label>
              <input
                type="text"
                value={validUntilText}
                onChange={(e) => setValidUntilText(e.target.value)}
                placeholder="Örn: Sınırlı Kontenjan (İlk 50 Bayi)"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Hedef Kitle</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 outline-none cursor-pointer"
              >
                <option value="all">Tüm Kullanıcılar & Bayiler</option>
                <option value="dealers">Yalnızca Yetkili Bayiler</option>
                <option value="members">Bireysel Danışanlar</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Buton Metni</label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Örn: Bayilik Başvurusu Yap"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-300">Kısa Açıklama (Özet) *</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kampanyanın ana temasını ve fırsatını özetleyiniz..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-300">Detaylı İçerik & Şartlar (Opsiyonel)</label>
              <textarea
                rows={2}
                value={detailedContent}
                onChange={(e) => setDetailedContent(e.target.value)}
                placeholder="Kampanyanın şartları, modül detayları veya eğitim kapsamı..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-300">Özel WhatsApp Mesaj Şablonu</label>
              <input
                type="text"
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Kullanıcı WhatsApp'a tıkladığında otomatik gidecek mesaj..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>Yayında (Aktif Kampanya)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>⭐ Öne Çıkar (En Üstte Göster)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingCampaign(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-950 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Kaydediliyor...' : 'Kampanyayı Kaydet & Yayınla'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Campaigns List */}
      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            Kayıtlı kampanya bulunmamaktadır.
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                camp.isActive
                  ? camp.featured 
                    ? 'bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-900 border-amber-500/50 shadow-md shadow-amber-950/20'
                    : 'bg-slate-950/90 border-slate-800'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {camp.badge}
                  </span>
                  {camp.featured && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                      ⭐ ÖNE ÇIKAN
                    </span>
                  )}
                  {camp.couponCode && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-900 text-amber-300 border border-dashed border-amber-500/40">
                      Kupon: {camp.couponCode}
                    </span>
                  )}
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    camp.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {camp.isActive ? 'Yayında' : 'Pasif'}
                  </span>
                </div>

                <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                  {camp.title}
                </h4>

                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {camp.description}
                </p>

                <div className="text-[10px] text-slate-500 flex items-center gap-3 pt-0.5">
                  <span>Hedef: {camp.targetAudience === 'dealers' ? 'Yalnızca Bayiler' : camp.targetAudience === 'members' ? 'Danışanlar' : 'Herkes'}</span>
                  <span>•</span>
                  <span>Geçerlilik: {camp.validUntilText}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(camp)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    camp.isActive
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
                  }`}
                  title={camp.isActive ? 'Yayından Kaldır' : 'Yayına Al'}
                >
                  {camp.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(camp)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 transition-colors cursor-pointer"
                  title="Kampanyayı Düzenle"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteCandidate(camp)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
                  title="Kampanyayı Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-100 text-sm">Kampanyayı Silmek İstediğinize Emin Misiniz?</h4>
            </div>
            <p className="text-xs text-slate-300">
              "{deleteCandidate.title}" başlıklı kampanya sistemden kalıcı olarak silinecektir.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950 cursor-pointer"
              >
                {loading ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
