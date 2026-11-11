import React, { useState } from 'react';
import { getSiteContent, saveSiteContent, SiteContent } from '../utils/siteContentManager';

interface SiteContentAdminTabProps {
  onSuccessMessage: (msg: string) => void;
}

const FIELDS: { key: keyof SiteContent; label: string; hint: string }[] = [
  { key: 'bankName', label: 'Banka Adı', hint: 'Bayi ve ödeme ekranlarında görünür.' },
  { key: 'accountHolder', label: 'Hesap Sahibi', hint: '' },
  { key: 'iban', label: 'IBAN', hint: 'Boşluklu veya boşluksuz girilebilir.' },
  { key: 'supportPhone', label: 'WhatsApp / Destek Telefonu', hint: 'Örnek: +90 542 578 37 48' },
  { key: 'affiliateBadge', label: 'Bayi Paneli Rozet Metni', hint: 'Bayi panelinin başlığındaki rozet.' },
  { key: 'welcomeBonusLabel', label: 'Hoşgeldin Bonusu Metni', hint: 'Yalnızca metin değişir; kredi miktarı kodda sabittir.' },
];

export const SiteContentAdminTab: React.FC<SiteContentAdminTabProps> = ({ onSuccessMessage }) => {
  const [form, setForm] = useState<SiteContent>(() => getSiteContent());
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveSiteContent(form);
      onSuccessMessage('Site içerikleri kaydedildi ve tüm ekranlara yansıtıldı.');
    } catch (err: any) {
      alert(err?.message || 'Site içerikleri kaydedilirken hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-2xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-100">Site İçerik Yönetimi</h3>
        <p className="text-xs text-slate-400 mt-1">
          Banka, IBAN ve WhatsApp bilgileri tüm sistemde; rozet ve bonus metinleri bayi panelinde anında güncellenir.
        </p>
      </div>

      {FIELDS.map((field) => (
        <label key={field.key} className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-300">{field.label}</span>
          <input
            type="text"
            value={form[field.key]}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          {field.hint && <span className="block text-[11px] text-slate-500">{field.hint}</span>}
        </label>
      ))}

      <button
        type="submit"
        disabled={isSaving}
        className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 cursor-pointer"
      >
        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </form>
  );
};
