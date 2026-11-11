import React, { useState } from 'react';
import { Invoice } from '../../types/accounting';
import { Search, Filter, Download, Eye, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';
import { generateUblTrXml } from '../../services/gibIntegrator';

interface InvoicesViewProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ invoices, onSelectInvoice }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CORPORATE' | 'INDIVIDUAL' | 'EXPORT'>('ALL');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.taxNumber.includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterType === 'CORPORATE') return inv.scenario === 'TICARIFATURA';
    if (filterType === 'INDIVIDUAL') return inv.scenario === 'EARSIVBELGE';
    if (filterType === 'EXPORT') return inv.scenario === 'IHRACAT';
    return true;
  });

  const handleDownloadXml = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const xml = generateUblTrXml(inv);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${inv.invoiceNumber}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            e-Fatura &amp; e-Arşiv Takip Merkezi
          </h2>
          <p className="text-xs text-slate-500">
            GİB ve Özel Entegratör API üzerinden otomatik kesilen tüm yasal belgeler
          </p>
        </div>

        {/* Filter Tabs (Functional segmented buttons as allowed in frontend design) */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tümü ({invoices.length})
          </button>
          <button
            onClick={() => setFilterType('CORPORATE')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterType === 'CORPORATE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            e-Fatura (Kurumsal)
          </button>
          <button
            onClick={() => setFilterType('INDIVIDUAL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterType === 'INDIVIDUAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            e-Arşiv (Bireysel)
          </button>
          <button
            onClick={() => setFilterType('EXPORT')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterType === 'EXPORT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hizmet İhracı (USD)
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Fatura No, Müşteri Adı veya TCKN/VKN ile arayın..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors shadow-2xs"
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Fatura No &amp; ETTN</th>
                <th className="py-3 px-4">Müşteri / Vergi No</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Senaryo / İstisna</th>
                <th className="py-3 px-4 text-right">Matrah</th>
                <th className="py-3 px-4 text-right">KDV Tutarı</th>
                <th className="py-3 px-4 text-right">Genel Toplam</th>
                <th className="py-3 px-4 text-right">TRY Kaydı</th>
                <th className="py-3 px-4 text-center">GİB Durumu</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    Arama kriterlerinize uygun fatura bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isGlobal = inv.scenario === 'IHRACAT';
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                          {inv.ettn}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 truncate max-w-[180px]">
                          {inv.customer.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.customer.isCorporate ? 'VKN:' : 'TCKN:'} {inv.customer.taxNumber} · {inv.customer.country}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {inv.issueDate}
                        <span className="block text-[10px] text-slate-400">{inv.issueTime}</span>
                      </td>
                      <td className="py-3 px-4">
                        {isGlobal ? (
                          <div>
                            <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block w-fit">
                              İhracat / Kod 301
                            </span>
                            <span className="text-[10px] text-slate-400">KDV %0 İstisnası</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-800 font-medium">{inv.scenario}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">KDV %20</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {inv.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {inv.currency}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {inv.vatTotal === 0 ? (
                          <span className="text-slate-400">0.00 {inv.currency}</span>
                        ) : (
                          <span className="text-slate-900 font-medium">
                            {inv.vatTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {inv.currency}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {inv.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {inv.currency}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">
                        {inv.grandTotalTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        {isGlobal && (
                          <span className="block text-[10px] text-slate-400">
                            TCMB: {inv.exchangeRateTCMB.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {inv.gibStatus.code} Onaylandı
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectInvoice(inv);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                            title="Fatura Görselini Aç"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDownloadXml(inv, e)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                            title="UBL-TR XML İndir"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
