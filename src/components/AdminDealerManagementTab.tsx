import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { getAdminToken } from '../utils/adminSession';
import { updateResellerNickname } from '../utils/resellerManager';

type DealerRecord = {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  referral_code: string;
  sponsor_id: string | null;
  sponsor_name: string | null;
  upline?: Array<{ user_id: string; full_name: string; depth: number }>;
  monoline_position: number;
  career_level: number;
  max_career_level: number;
  active_career_level: number;
  activity_expires_at: string | null;
  active_direct_referrals_30d: number;
  is_active: boolean;
  is_locked: boolean;
  scan_credits: number;
  assigned_leg: 'LEFT' | 'RIGHT' | 'AUTO';
  created_at: string;
  role: 'customer' | 'member' | 'dealer';
  profile?: Record<string, any>;
  wallet_balance: number | string;
  wallet_pending_balance: number | string;
  wallet_total_earned: number | string;
  wallet_total_withdrawn: number | string;
  wallet_sponsor_earnings: number | string;
  wallet_unilevel_earnings: number | string;
  wallet_monoline_earnings: number | string;
};

type DealerEditForm = Pick<DealerRecord, 'full_name' | 'email' | 'phone' | 'city' | 'role' | 'is_active' | 'is_locked' | 'assigned_leg'> & {
  activity_expires_at: string;
  sponsor_id: string;
  monoline_position: string;
  company_name: string;
  nickname: string;
  tax_number: string;
  tax_office: string;
  business_field: string;
  address: string;
};

type WalletAdjustment = {
  id: number;
  admin_user_id: string;
  region: 'DOMESTIC' | 'INTERNATIONAL';
  direction: 'CREDIT' | 'DEBIT';
  amount: number | string;
  balance_before: number | string;
  balance_after: number | string;
  reason: string;
  created_at: string;
};

const PAGE_SIZE = 25;
const money = (value: number | string) => `${(Number(value) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('tr-TR') : '—';
const dateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const AdminDealerManagementTab: React.FC = () => {
  const [dealers, setDealers] = useState<DealerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DealerRecord | null>(null);
  const [form, setForm] = useState<DealerEditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [walletAdjustments, setWalletAdjustments] = useState<WalletAdjustment[]>([]);
  const [walletDirection, setWalletDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [walletRegion, setWalletRegion] = useState<'DOMESTIC' | 'INTERNATIONAL'>('DOMESTIC');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [walletSaving, setWalletSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ search, status, page: String(page), pageSize: String(PAGE_SIZE) });
    fetch(`/api/v1/admin/dealers?${params}`, {
      headers: { Authorization: `Bearer ${getAdminToken() || ''}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Bayi listesi alınamadı.');
        if (active) {
          setDealers(data.dealers || []);
          setTotal(Number(data.total) || 0);
        }
      })
      .catch((err) => {
        if (active && err.name !== 'AbortError') setError(err.message || 'Bayi listesi alınamadı.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [search, status, page]);

  const openDealer = async (id: string) => {
    setError(null);
    setSaveMessage(null);
    try {
      const headers = { Authorization: `Bearer ${getAdminToken() || ''}` };
      const [response, adjustmentResponse] = await Promise.all([
        fetch(`/api/v1/admin/dealers/${encodeURIComponent(id)}`, { headers }),
        fetch(`/api/v1/admin/dealers/${encodeURIComponent(id)}/wallet-adjustments`, { headers }),
      ]);
      const [data, adjustmentData] = await Promise.all([
        response.json().catch(() => ({})),
        adjustmentResponse.json().catch(() => ({})),
      ]);
      if (!response.ok) throw new Error(data.message || 'Bayi ayrıntıları alınamadı.');
      if (!adjustmentResponse.ok) throw new Error(adjustmentData.message || 'Cüzdan geçmişi alınamadı.');
      setWalletAdjustments(adjustmentData.adjustments || []);
      const dealer = data.dealer as DealerRecord;
      setSelected(dealer);
      setNewPassword('');
      setConfirmPassword('');
      const profile = dealer.profile || {};
      const dealerDetails = (profile.dealerDetails || {}) as Record<string, string | undefined>;
      setForm({
        full_name: dealer.full_name || '',
        email: dealer.email || '',
        nickname: String(profile.nickname || ''),
        phone: dealer.phone || '',
        city: dealer.city || '',
        role: dealer.role || 'member',
        is_active: dealer.is_active,
        is_locked: dealer.is_locked,
        activity_expires_at: dateTimeLocal(dealer.activity_expires_at),
        sponsor_id: dealer.sponsor_id || '',
        assigned_leg: dealer.assigned_leg || 'AUTO',
        monoline_position: String(dealer.monoline_position || 1),
        company_name: dealerDetails.companyName || '',
        tax_number: dealerDetails.taxNumber || '',
        tax_office: dealerDetails.taxOffice || '',
        business_field: dealerDetails.businessField || '',
        address: dealerDetails.address || '',
      });
    } catch (err: any) {
      setError(err.message || 'Bayi ayrıntıları alınamadı.');
    }
  };

  const saveDealer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !form) return;
    if (Boolean(newPassword) !== Boolean(confirmPassword) || newPassword !== confirmPassword) {
      setError('Yeni parola doğrulaması eşleşmiyor.');
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/dealers/${encodeURIComponent(selected.user_id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken() || ''}`,
        },
        body: JSON.stringify({
          full_name: form.full_name,
          nickname: form.nickname,
          email: form.email,
          phone: form.phone,
          city: form.city,
          company_name: form.company_name,
          tax_number: form.tax_number,
          tax_office: form.tax_office,
          business_field: form.business_field,
          address: form.address,
          ...(newPassword ? { new_password: newPassword } : {}),
          role: form.role,
          is_active: form.is_active,
          is_locked: form.is_locked,
          activity_expires_at: new Date(form.activity_expires_at).toISOString(),
          sponsor_id: form.sponsor_id || null,
          assigned_leg: form.assigned_leg,
          monoline_position: Number(form.monoline_position),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Bayi bilgileri kaydedilemedi.');
      const updated = data.dealer as DealerRecord;
      await updateResellerNickname(updated.user_id, form.nickname);
      setSelected(updated);
      setDealers((current) => current.map((dealer) => dealer.user_id === updated.user_id ? updated : dealer));
      if (data.state) window.dispatchEvent(new CustomEvent('aurabio_monoline_state_updated', { detail: data.state }));
      window.dispatchEvent(new CustomEvent('aurabio_members_updated'));
      window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
      window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
      setNewPassword('');
      setConfirmPassword('');
      setSaveMessage('Profil ve giriş bilgileri PostgreSQL’e kaydedildi.');
    } catch (err: any) {
      setError(err.message || 'Bayi bilgileri kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const saveWalletAdjustment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setWalletSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/dealers/${encodeURIComponent(selected.user_id)}/wallet-adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken() || ''}` },
        body: JSON.stringify({
          request_id: crypto.randomUUID(),
          direction: walletDirection,
          region: walletRegion,
          amount: Number(walletAmount),
          reason: walletReason,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Cüzdan düzeltmesi kaydedilemedi.');
      setSelected((current) => current ? { ...current, wallet_balance: data.adjustment.balance } : current);
      setDealers((current) => current.map((dealer) => dealer.user_id === selected.user_id ? { ...dealer, wallet_balance: data.adjustment.balance } : dealer));
      setWalletAdjustments((current) => [{ ...data.adjustment, admin_user_id: 'Yönetici', reason: walletReason }, ...current].slice(0, 50));
      setWalletAmount('');
      setWalletReason('');
      setSaveMessage(data.message || 'Cüzdan düzeltmesi kaydedildi.');
    } catch (err: any) {
      setError(err.message || 'Cüzdan düzeltmesi kaydedilemedi.');
    } finally {
      setWalletSaving(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const dealerDetails = (selected?.profile?.dealerDetails || {}) as Record<string, string | undefined>;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-slate-100 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Bayi ve Üye Yönetimi</h2>
          <p className="text-xs text-slate-400">PostgreSQL kayıtları, hiyerarşi ve cüzdan özetleri</p>
        </div>
        <span className="text-xs text-slate-400">{total.toLocaleString('tr-TR')} kayıt</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Ad, rumuz, e-posta, telefon, kullanıcı veya referans kodu" className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-500" />
        </label>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-cyan-500">
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
          <option value="locked">Kilitli</option>
        </select>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-slate-900 text-slate-400">
            <tr><th className="p-3">Bayi / Üye</th><th className="p-3">İletişim</th><th className="p-3">Rol / Durum</th><th className="p-3">Sponsor / Sıra</th><th className="p-3 text-right">Cüzdan</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="p-8 text-center text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr> : dealers.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">Kayıt bulunamadı.</td></tr> : dealers.map((dealer) => (
              <tr key={dealer.user_id} onClick={() => void openDealer(dealer.user_id)} className="cursor-pointer border-t border-slate-800 hover:bg-slate-900/80">
                <td className="p-3"><div className="font-semibold">{dealer.full_name}</div>{dealer.profile?.nickname && <div className="mt-0.5 text-cyan-300">@{dealer.profile.nickname}</div>}<div className="mt-1 font-mono text-[10px] text-slate-500">{dealer.user_id}</div></td>
                <td className="p-3"><div>{dealer.email}</div><div className="mt-1 text-slate-500">{dealer.phone || '—'}</div></td>
                <td className="p-3"><div className="capitalize">{dealer.role}</div><div className={dealer.is_locked ? 'mt-1 text-rose-300' : dealer.is_active ? 'mt-1 text-emerald-300' : 'mt-1 text-amber-300'}>{dealer.is_locked ? 'Kilitli' : dealer.is_active ? 'Aktif' : 'Pasif'}</div></td>
                <td className="p-3"><div>{dealer.sponsor_name || dealer.sponsor_id || '—'}</div><div className="mt-1 text-slate-500">Monoline #{dealer.monoline_position || '—'} · {dealer.assigned_leg || 'AUTO'}</div></td>
                <td className="p-3 text-right"><div>{money(dealer.wallet_balance)}</div><div className="mt-1 text-amber-300">Bekleyen {money(dealer.wallet_pending_balance)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Sayfa {page} / {pages}</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /> Önceki</button>
          <button type="button" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-40">Sonraki <ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {selected && form && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); setForm(null); } }}>
          <div role="dialog" aria-modal="true" aria-labelledby="dealer-detail-title" className="max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 sm:px-6">
              <div><h3 id="dealer-detail-title" className="font-bold">Bayi / Üye Detayı</h3><p className="text-xs text-slate-500">{selected.user_id} · Kayıt: {date(selected.created_at)}</p></div>
              <button type="button" aria-label="Kapat" onClick={() => { setSelected(null); setForm(null); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
              <form onSubmit={saveDealer} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-slate-400">Ad Soyad<input required minLength={2} maxLength={150} value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Görünen rumuz<input required minLength={3} maxLength={24} value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} placeholder="3–24 karakter" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Giriş e-postası<input required type="email" maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Telefon<input maxLength={50} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Şehir<input maxLength={80} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Firma / işletme<input maxLength={160} value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Vergi numarası<input maxLength={50} value={form.tax_number} onChange={(event) => setForm({ ...form, tax_number: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Vergi dairesi<input maxLength={80} value={form.tax_office} onChange={(event) => setForm({ ...form, tax_office: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Faaliyet alanı<input maxLength={160} value={form.business_field} onChange={(event) => setForm({ ...form, business_field: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400 sm:col-span-2">Adres<input maxLength={500} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Yeni parola<input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Değiştirmeyecekseniz boş bırakın" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Yeni parola tekrar<input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Rol<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as DealerEditForm['role'] })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"><option value="customer">Müşteri</option><option value="member">Üye</option><option value="dealer">Bayi</option></select></label>
                  <label className="text-xs text-slate-400">Bayi referans kodu<input readOnly value={selected.referral_code || '—'} className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-500" /></label>
                  <label className="text-xs text-slate-400">Sponsor kullanıcı ID<input value={form.sponsor_id} onChange={(event) => setForm({ ...form, sponsor_id: event.target.value })} placeholder="Boş bırak: sponsorsuz" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Monoline sırası<input type="number" min="1" step="1" required value={form.monoline_position} onChange={(event) => setForm({ ...form, monoline_position: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-slate-400">Monoline kolu<select value={form.assigned_leg} onChange={(event) => setForm({ ...form, assigned_leg: event.target.value as DealerEditForm['assigned_leg'] })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"><option value="AUTO">Otomatik</option><option value="LEFT">Sol</option><option value="RIGHT">Sağ</option></select></label>
                  <label className="text-xs text-slate-400">Aktiflik bitiş tarihi ve saati<input required type="datetime-local" value={form.activity_expires_at} onChange={(event) => setForm({ ...form, activity_expires_at: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white [color-scheme:dark]" /></label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Aktif hesap</label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm"><input type="checkbox" checked={form.is_locked} onChange={(event) => setForm({ ...form, is_locked: event.target.checked })} /> Hesap kilitli</label>
                </div>
                {error && <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</div>}
                {saveMessage && <div role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-sm text-emerald-200">{saveMessage}</div>}
                <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                  <button type="button" onClick={() => { setSelected(null); setForm(null); }} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Kapat</button>
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
                </div>
              </form>

              <aside className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <h4 className="mb-3 text-sm font-semibold">Cüzdan özeti · görüntüleme</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-500">Kullanılabilir</span><div className="mt-1 font-semibold">{money(selected.wallet_balance)}</div></div>
                    <div><span className="text-slate-500">Bekleyen</span><div className="mt-1 font-semibold text-amber-300">{money(selected.wallet_pending_balance)}</div></div>
                    <div><span className="text-slate-500">Toplam kazanım</span><div className="mt-1">{money(selected.wallet_total_earned)}</div></div>
                    <div><span className="text-slate-500">Çekilen</span><div className="mt-1">{money(selected.wallet_total_withdrawn)}</div></div>
                    <div><span className="text-slate-500">Sponsor</span><div className="mt-1">{money(selected.wallet_sponsor_earnings)}</div></div>
                    <div><span className="text-slate-500">Unilevel</span><div className="mt-1">{money(selected.wallet_unilevel_earnings)}</div></div>
                    <div><span className="text-slate-500">Monoline teşvik</span><div className="mt-1">{money(selected.wallet_monoline_earnings)}</div></div>
                  </div>
                </div>
                <form onSubmit={saveWalletAdjustment} className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                  <div><h4 className="text-sm font-semibold text-amber-100">Cüzdan düzeltmesi</h4><p className="mt-1 text-[11px] leading-relaxed text-amber-200/70">Bekleyen bakiye değiştirilemez. Her işlem açıklamasıyla kayda alınır.</p></div>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={walletDirection} onChange={(event) => setWalletDirection(event.target.value as 'CREDIT' | 'DEBIT')} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs"><option value="CREDIT">Bakiye ekle</option><option value="DEBIT">Bakiye düş</option></select>
                    <select value={walletRegion} onChange={(event) => setWalletRegion(event.target.value as 'DOMESTIC' | 'INTERNATIONAL')} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs"><option value="DOMESTIC">Yurt içi USD</option><option value="INTERNATIONAL">Yurt dışı USD</option></select>
                  </div>
                  <input required type="number" min="0.01" max="1000000" step="0.01" value={walletAmount} onChange={(event) => setWalletAmount(event.target.value)} placeholder="Tutar (USD)" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
                  <textarea required minLength={10} maxLength={300} value={walletReason} onChange={(event) => setWalletReason(event.target.value)} placeholder="Düzeltme gerekçesi (en az 10 karakter)" className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs" rows={3} />
                  <button type="submit" disabled={walletSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{walletSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{walletSaving ? 'İşleniyor…' : 'Düzeltmeyi kaydet'}</button>
                </form>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs">
                  <h4 className="mb-3 text-sm font-semibold">Hiyerarşi ve profil</h4>
                  <p className="text-slate-400">Sponsor <span className="float-right text-slate-200">{selected.sponsor_name || selected.sponsor_id || '—'}</span></p>
                  <p className="mt-2 text-slate-400">Kariyer seviyesi <span className="float-right text-slate-200">{selected.career_level} · en yüksek {selected.max_career_level}</span></p>
                  <p className="mt-2 text-slate-400">Aktif doğrudan ekip <span className="float-right text-slate-200">{selected.active_direct_referrals_30d}</span></p>
                  <p className="mt-2 text-slate-400">Seans kredisi <span className="float-right text-slate-200">{selected.scan_credits}</span></p>
                  <p className="mt-2 text-slate-400">Aktiflik bitişi <span className="float-right text-slate-200">{selected.activity_expires_at ? new Date(selected.activity_expires_at).toLocaleString('tr-TR') : '—'}</span></p>
                  <p className="mt-2 text-slate-400">Kayıt tarihi <span className="float-right text-slate-200">{date(selected.created_at)}</span></p>
                  <p className="mt-2 text-slate-400">E-posta değişimi <span className="float-right text-slate-500">Kimlik doğrulama nedeniyle kapalı</span></p>
                  {selected.upline?.map((ancestor) => <p key={ancestor.user_id} className="mt-2 text-slate-400">Üst sıra {ancestor.depth} <span className="float-right text-slate-200">{ancestor.full_name} · {ancestor.user_id}</span></p>)}
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs">
                  <h4 className="mb-3 text-sm font-semibold">Bayi profili</h4>
                  <p className="text-slate-400">Firma <span className="float-right text-right text-slate-200">{dealerDetails.companyName || '—'}</span></p>
                  <p className="mt-2 text-slate-400">Vergi no <span className="float-right text-slate-200">{dealerDetails.taxNumber || '—'}</span></p>
                  <p className="mt-2 text-slate-400">Vergi dairesi <span className="float-right text-slate-200">{dealerDetails.taxOffice || '—'}</span></p>
                  <p className="mt-2 text-slate-400">Faaliyet alanı <span className="float-right text-right text-slate-200">{dealerDetails.businessField || '—'}</span></p>
                  <p className="mt-2 text-slate-400">Adres <span className="float-right max-w-[65%] text-right text-slate-200">{dealerDetails.address || '—'}</span></p>
                  <p className="mt-2 text-slate-400">Paket <span className="float-right text-slate-200">{selected.profile?.dealerPackageId || selected.profile?.selectedPackage || '—'}</span></p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <h4 className="mb-3 text-sm font-semibold">Son cüzdan düzeltmeleri</h4>
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {walletAdjustments.length === 0 ? <p className="text-xs text-slate-500">Henüz düzeltme kaydı yok.</p> : walletAdjustments.map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-[11px]">
                        <div className="flex justify-between gap-2"><span className={item.direction === 'CREDIT' ? 'font-semibold text-emerald-300' : 'font-semibold text-rose-300'}>{item.direction === 'CREDIT' ? '+' : '−'}{money(item.amount)}</span><span className="text-slate-500">{item.region === 'DOMESTIC' ? 'Yurt içi' : 'Yurt dışı'} · {date(item.created_at)}</span></div>
                        <p className="mt-1 text-slate-300">{item.reason}</p>
                        <p className="mt-1 text-slate-500">Yönetici: {item.admin_user_id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
