import React, { useEffect, useState } from 'react';
import { subscribeToDigitalInvoices, type DigitalInvoice } from '../../utils/invoiceManager';
import { downloadInvoicePDF } from '../../utils/invoicePdfExporter';

const statusText = (status: DigitalInvoice['status']) =>
  status === 'paid' ? 'Ödendi' : status === 'cancelled' ? 'İptal' : status === 'sent_whatsapp' ? 'İletildi' : 'Ödeme bekliyor';

export const DealerSalesInvoicesPanel: React.FC = () => {
  const [invoices, setInvoices] = useState<DigitalInvoice[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = subscribeToDigitalInvoices((list) => setInvoices(list));
    const refresh = () => setInvoices((cur) => [...cur]);
    window.addEventListener('akn-smart-accounting-updated', refresh);
    return () => {
      unsub();
      window.removeEventListener('akn-smart-accounting-updated', refresh);
    };
  }, []);

  const rows = invoices
    .filter((inv) => (!from || inv.issueDate >= from) && (!to || inv.issueDate <= to))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const total = rows.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const downloadAll = async () => {
    setBusy(true);
    try {
      for (const inv of rows) await downloadInvoicePDF(inv);
    } finally {
      setBusy(false);
    }
  };

  const downloadCsv = () => {
    const header = ['Tarih', 'Fatura No', 'Ünvan / Ad Soyad', 'Vergi / TC No', 'Adres', 'E-posta', 'Telefon', 'Paket', 'Matrah', 'KDV', 'Toplam', 'Para Birimi', 'Durum'];
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((inv) => [
      inv.issueDate, inv.invoiceNumber, inv.recipient.companyName || inv.recipient.fullName, inv.recipient.taxNumber,
      inv.recipient.address, inv.recipient.email, inv.recipient.phone, inv.packageName || '',
      inv.subtotal.toFixed(2), inv.kdvTotal.toFixed(2), inv.grandTotal.toFixed(2), inv.currency, statusText(inv.status),
    ]);
    const csv = `\uFEFF${[header, ...lines].map((r) => r.map(cell).join(';')).join('\r\n')}\r\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `satis_faturalari_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Bayi satış faturaları (otomatik)</h2>
          <p className="mt-1 text-sm text-slate-600">Bayi kaydı ve paket alışverişinde AKN Global Group adına anında oluşturulur.</p>
        </div>
        <span className="rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-800">
          {rows.length} fatura · Toplam {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
        </span>
      </div>
      <div className="mb-3 flex flex-wrap items-end gap-2 text-xs">
        <label className="space-y-1"><span className="block text-slate-500">Başlangıç</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5" /></label>
        <label className="space-y-1"><span className="block text-slate-500">Bitiş</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5" /></label>
        <button type="button" onClick={() => void downloadAll()} disabled={busy || rows.length === 0} className="rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white disabled:opacity-40">
          {busy ? 'İndiriliyor…' : 'Tüm faturaları PDF indir'}
        </button>
        <button type="button" onClick={downloadCsv} disabled={rows.length === 0} className="rounded-lg border border-indigo-300 bg-white px-3 py-2 font-semibold text-indigo-900 disabled:opacity-40">
          Excel / CSV indir
        </button>
      </div>
      <div className="max-h-80 space-y-2 overflow-auto">
        {rows.map((inv) => (
          <article key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{inv.recipient.companyName || inv.recipient.fullName} · {inv.invoiceNumber}</p>
              <p className="break-words text-xs text-slate-500">
                {inv.issueDate} · {inv.packageName} · {inv.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {inv.currency} · {statusText(inv.status)}
              </p>
            </div>
            <button type="button" onClick={() => void downloadInvoicePDF(inv)} className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900">
              PDF indir
            </button>
          </article>
        ))}
        {rows.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Henüz otomatik satış faturası yok.</p>}
      </div>
    </section>
  );
};
