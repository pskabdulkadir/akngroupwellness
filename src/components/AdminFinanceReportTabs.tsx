import React, { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, RefreshCw, Search } from 'lucide-react';
import { getAdminToken } from '../utils/adminSession';
import type { DigitalInvoice } from '../utils/invoiceManager';

type CommissionBalanceRow = {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  referral_code: string;
  career_level: number;
  balance: number | string;
  pending_balance: number | string;
  total_withdrawn: number | string;
  iban: string;
  iban_holder_name: string;
  bank_name: string;
};

type WithdrawalRow = {
  id: number;
  user_id: number | string;
  external_user_id?: string;
  user_full_name?: string;
  amount?: number;
  gross_amount?: number;
  tax_deduction?: number;
  net_amount?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at?: string;
  payout_method?: string;
  payout_address?: string;
  bank_details?: { holder_name?: string; bank_name?: string; iban?: string; trc20_address?: string };
};

const money = (value: number | string | null | undefined) =>
  `${(Number(value) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

const dateText = (value?: string | null) => (value ? new Date(value).toLocaleDateString('tr-TR') : '—');

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const csvCell = (value: unknown) => {
  const text = String(value ?? '');
  const safe = typeof value === 'string' && /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

const downloadCsv = (filename: string, headers: string[], rows: unknown[][]) => {
  const content = [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const adminFetch = async <T,>(path: string): Promise<T> => {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${getAdminToken() || ''}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Veri alınamadı.');
  return data as T;
};

const statusLabel = (status?: string) => {
  if (status === 'sent_whatsapp') return 'WhatsApp İletildi';
  return status || 'Oluşturuldu';
};

export const AdminPurchaseInvoicesTab: React.FC<{ invoices: DigitalInvoice[] }> = ({ invoices }) => {
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? invoices.filter((inv) =>
          [inv.invoiceNumber, inv.recipient?.fullName, inv.recipient?.companyName, inv.recipient?.uid, inv.packageName]
            .some((value) => String(value || '').toLowerCase().includes(term))
        )
      : invoices;
    return [...filtered].sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
  }, [invoices, search]);

  const totals = rows.reduce(
    (acc, inv) => ({
      subtotal: acc.subtotal + (inv.subtotal || 0),
      kdv: acc.kdv + (inv.kdvTotal || 0),
      grand: acc.grand + (inv.grandTotal || 0),
    }),
    { subtotal: 0, kdv: 0, grand: 0 }
  );

  const exportCsv = () =>
    downloadCsv(
      `alis-verisi-faturalari-${currentMonth()}.csv`,
      ['Tarih', 'Fatura No', 'Alıcı Bayi', 'Bayi ID', 'Paket', 'Matrah', 'KDV', 'Toplam', 'Durum'],
      rows.map((inv) => [
        dateText(inv.issueDate),
        inv.invoiceNumber,
        inv.recipient?.fullName || inv.recipient?.companyName || '',
        inv.recipient?.uid || '',
        inv.packageName || '',
        inv.subtotal || 0,
        inv.kdvTotal || 0,
        inv.grandTotal || 0,
        statusLabel(inv.status),
      ])
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-violet-500/30">
          <div className="text-[11px] font-semibold text-slate-400">Fatura Sayısı</div>
          <div className="text-xl font-mono font-bold text-slate-100">{rows.length} Adet</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-500/30">
          <div className="text-[11px] font-semibold text-slate-400">Toplam Matrah / KDV</div>
          <div className="text-xl font-mono font-bold text-teal-300">
            {money(totals.subtotal)} / {money(totals.kdv)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30">
          <div className="text-[11px] font-semibold text-slate-400">Toplam Alış Verişi (KDV Dahil)</div>
          <div className="text-xl font-mono font-bold text-emerald-400">{money(totals.grand)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Fatura No, bayi adı, bayi ID veya paket ile ara..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500"
          />
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          CSV İndir
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-xs text-left text-slate-200">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-3 py-2.5">Tarih</th>
              <th className="px-3 py-2.5">Fatura No</th>
              <th className="px-3 py-2.5">Alıcı Bayi</th>
              <th className="px-3 py-2.5">Bayi ID</th>
              <th className="px-3 py-2.5">Paket</th>
              <th className="px-3 py-2.5 text-right">Matrah</th>
              <th className="px-3 py-2.5 text-right">KDV</th>
              <th className="px-3 py-2.5 text-right">Toplam</th>
              <th className="px-3 py-2.5">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/60">
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                  Gösterilecek fatura bulunamadı.
                </td>
              </tr>
            )}
            {rows.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-900/70">
                <td className="px-3 py-2 font-mono">{dateText(inv.issueDate)}</td>
                <td className="px-3 py-2 font-mono">{inv.invoiceNumber}</td>
                <td className="px-3 py-2">{inv.recipient?.fullName || inv.recipient?.companyName || '—'}</td>
                <td className="px-3 py-2 font-mono text-slate-400">{inv.recipient?.uid || '—'}</td>
                <td className="px-3 py-2">{inv.packageName || '—'}</td>
                <td className="px-3 py-2 text-right font-mono">{money(inv.subtotal)}</td>
                <td className="px-3 py-2 text-right font-mono">{money(inv.kdvTotal)}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-300">{money(inv.grandTotal)}</td>
                <td className="px-3 py-2">{statusLabel(inv.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminBankCommissionTab: React.FC = () => {
  const [balances, setBalances] = useState<CommissionBalanceRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [month, setMonth] = useState<string>(currentMonth());
  const [statusFilter, setStatusFilter] = useState<'ALL' | WithdrawalRow['status']>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [balanceData, withdrawalData] = await Promise.all([
        adminFetch<{ data: CommissionBalanceRow[] }>('/api/v1/admin/banking/commission-balances'),
        adminFetch<{ data: WithdrawalRow[] }>('/api/v1/admin/withdrawals'),
      ]);
      setBalances(balanceData.data || []);
      setWithdrawals(withdrawalData.data || []);
    } catch (err: any) {
      setError(err?.message || 'Banka komisyon verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const monthlyWithdrawals = useMemo(
    () =>
      withdrawals
        .filter((w) => (w.created_at || '').slice(0, 7) === month)
        .filter((w) => statusFilter === 'ALL' || w.status === statusFilter)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    [withdrawals, month, statusFilter]
  );

  const withdrawalTotals = monthlyWithdrawals.reduce(
    (acc, w) => ({
      gross: acc.gross + (w.gross_amount ?? w.amount ?? 0),
      tax: acc.tax + (w.tax_deduction || 0),
      net: acc.net + (w.net_amount ?? w.amount ?? 0),
    }),
    { gross: 0, tax: 0, net: 0 }
  );

  const balanceTotals = balances.reduce(
    (acc, b) => ({
      available: acc.available + (Number(b.balance) || 0),
      pending: acc.pending + (Number(b.pending_balance) || 0),
    }),
    { available: 0, pending: 0 }
  );

  const exportBalances = () =>
    downloadCsv(
      `komisyon-bakiyeleri-${currentMonth()}.csv`,
      ['Bayi ID', 'Ad Soyad', 'Hesap Sahibi', 'Banka', 'IBAN', 'Kullanılabilir Bakiye', 'Bekleyen Bakiye', 'Toplam Çekilen'],
      balances.map((b) => [
        b.user_id,
        b.full_name,
        b.iban_holder_name,
        b.bank_name,
        b.iban,
        Number(b.balance) || 0,
        Number(b.pending_balance) || 0,
        Number(b.total_withdrawn) || 0,
      ])
    );

  const exportWithdrawals = () =>
    downloadCsv(
      `aylik-cekim-talepleri-${month}.csv`,
      ['Talep Tarihi', 'Bayi ID', 'Ad Soyad', 'Hesap Sahibi', 'Banka', 'IBAN / Adres', 'Brüt Talep', 'Stopaj', 'Net Ödeme', 'Durum'],
      monthlyWithdrawals.map((w) => [
        dateText(w.created_at),
        w.external_user_id || String(w.user_id),
        w.user_full_name || '',
        w.bank_details?.holder_name || w.user_full_name || '',
        w.bank_details?.bank_name || '',
        w.bank_details?.iban || w.payout_address || '',
        w.gross_amount ?? w.amount ?? 0,
        w.tax_deduction || 0,
        w.net_amount ?? w.amount ?? 0,
        w.status,
      ])
    );

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-xs">
        <Loader2 className="w-4 h-4 animate-spin" />
        Banka komisyon verileri yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{error}</div>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={loadAll}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Yenile
        </button>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white">Komisyon Alacak Bayiler</h3>
            <p className="text-[11px] text-slate-400">
              Kullanılabilir ve bekleyen komisyon bakiyesi olan tüm bayiler. Toplam kullanılabilir: {money(balanceTotals.available)} · Bekleyen: {money(balanceTotals.pending)}
            </p>
          </div>
          <button
            type="button"
            onClick={exportBalances}
            disabled={balances.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            CSV İndir
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs text-left text-slate-200">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2.5">Bayi ID</th>
                <th className="px-3 py-2.5">Ad Soyad</th>
                <th className="px-3 py-2.5">Banka / Hesap Sahibi</th>
                <th className="px-3 py-2.5">IBAN</th>
                <th className="px-3 py-2.5 text-right">Kullanılabilir</th>
                <th className="px-3 py-2.5 text-right">Bekleyen</th>
                <th className="px-3 py-2.5 text-right">Toplam Çekilen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/60">
              {balances.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    Komisyon bakiyesi olan bayi bulunmuyor.
                  </td>
                </tr>
              )}
              {balances.map((b) => (
                <tr key={b.user_id} className="hover:bg-slate-900/70">
                  <td className="px-3 py-2 font-mono">{b.user_id}</td>
                  <td className="px-3 py-2">{b.full_name}</td>
                  <td className="px-3 py-2">
                    <div>{b.bank_name || '—'}</div>
                    <div className="text-[10px] text-slate-400">{b.iban_holder_name || '—'}</div>
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {b.iban ? b.iban : <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300">IBAN yok</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-emerald-300">{money(b.balance)}</td>
                  <td className="px-3 py-2 text-right font-mono text-amber-300">{money(b.pending_balance)}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-400">{money(b.total_withdrawn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white">Aylık Çekim Talepleri (Bankaya Gönderilecek Liste)</h3>
            <p className="text-[11px] text-slate-400">
              Seçilen ayda çekim talebinde bulunan bayilerin talep ettiği tutarlar. Toplam net ödeme: {money(withdrawalTotals.net)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | WithdrawalRow['status'])}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="PENDING">Bekleyen</option>
              <option value="APPROVED">Onaylanan</option>
              <option value="REJECTED">Reddedilen</option>
            </select>
            <button
              type="button"
              onClick={exportWithdrawals}
              disabled={monthlyWithdrawals.length === 0}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Banka Listesi (CSV)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs text-left text-slate-200">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2.5">Talep Tarihi</th>
                <th className="px-3 py-2.5">Bayi ID</th>
                <th className="px-3 py-2.5">Ad Soyad</th>
                <th className="px-3 py-2.5">Banka / Hesap Sahibi</th>
                <th className="px-3 py-2.5">IBAN</th>
                <th className="px-3 py-2.5 text-right">Brüt Talep</th>
                <th className="px-3 py-2.5 text-right">Stopaj</th>
                <th className="px-3 py-2.5 text-right">Net Ödeme</th>
                <th className="px-3 py-2.5">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/60">
              {monthlyWithdrawals.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                    Seçilen ayda çekim talebi bulunmuyor.
                  </td>
                </tr>
              )}
              {monthlyWithdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-900/70">
                  <td className="px-3 py-2 font-mono">{dateText(w.created_at)}</td>
                  <td className="px-3 py-2 font-mono">{w.external_user_id || String(w.user_id)}</td>
                  <td className="px-3 py-2">{w.user_full_name || '—'}</td>
                  <td className="px-3 py-2">
                    <div>{w.bank_details?.bank_name || '—'}</div>
                    <div className="text-[10px] text-slate-400">{w.bank_details?.holder_name || '—'}</div>
                  </td>
                  <td className="px-3 py-2 font-mono">{w.bank_details?.iban || w.payout_address || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono">{money(w.gross_amount ?? w.amount)}</td>
                  <td className="px-3 py-2 text-right font-mono text-red-300">{money(w.tax_deduction)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-emerald-300">{money(w.net_amount ?? w.amount)}</td>
                  <td className="px-3 py-2">{w.status}</td>
                </tr>
              ))}
            </tbody>
            {monthlyWithdrawals.length > 0 && (
              <tfoot className="bg-slate-900 text-xs font-bold">
                <tr>
                  <td colSpan={5} className="px-3 py-2.5 text-right text-slate-400">Toplam ({monthlyWithdrawals.length} talep)</td>
                  <td className="px-3 py-2.5 text-right font-mono">{money(withdrawalTotals.gross)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-red-300">{money(withdrawalTotals.tax)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-300">{money(withdrawalTotals.net)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
};
