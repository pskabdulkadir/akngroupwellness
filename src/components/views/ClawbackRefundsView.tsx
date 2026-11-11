import React, { useState } from 'react';
import { Invoice, CommissionPayout, Distributor, RefundRecord } from '../../types/accounting';
import { processRefundAndClawback } from '../../services/taxEngine';
import {
  RotateCcw,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Users,
  DollarSign,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface ClawbackRefundsViewProps {
  invoices: Invoice[];
  commissions: CommissionPayout[];
  distributors: Distributor[];
  refunds: RefundRecord[];
  onRefundCreated: (refund: RefundRecord, updatedCommissions: CommissionPayout[], updatedDistributors: Distributor[]) => void;
}

export const ClawbackRefundsView: React.FC<ClawbackRefundsViewProps> = ({
  invoices,
  commissions,
  distributors,
  refunds,
  onRefundCreated,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [refundReason, setRefundReason] = useState<'MUSTERI_IADE_TALEBI' | 'CHARGEBACK_ITIRAZ' | 'HIZMET_IPTALI'>('MUSTERI_IADE_TALEBI');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // İade edilmeye uygun faturalar
  const refundableInvoices = invoices.filter((inv) => !inv.isRefunded && inv.scenario !== 'IADE');

  const handleProcessRefund = () => {
    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    if (!inv) return;

    const { refundRecord, updatedCommissions, updatedDistributors } = processRefundAndClawback(
      inv,
      refundReason,
      commissions,
      distributors
    );

    inv.isRefunded = true;
    inv.refundDate = refundRecord.date;
    inv.refundInvoiceNumber = refundRecord.refundInvoiceNumber;

    onRefundCreated(refundRecord, updatedCommissions, updatedDistributors);
    setSelectedInvoiceId('');
    setSuccessMessage(`${inv.invoiceNumber} faturası için ${refundRecord.refundInvoiceNumber} numaralı e-Arşiv İade Faturası kesildi ve komisyonlar başarıyla geri çekildi (Clawback uygulandı).`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const totalRefundAmountTRY = refunds.reduce((sum, r) => sum + r.refundAmountTRY, 0);
  const totalClawbacksTRY = refunds.reduce(
    (sum, r) => sum + r.clawbacksApplied.reduce((cSum, cb) => cSum + cb.grossClawbackTRY, 0),
    0
  );
  const totalStopajReversalsTRY = refunds.reduce(
    (sum, r) => sum + r.clawbacksApplied.reduce((sSum, cb) => sSum + cb.stopajReversedTRY, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>MLM Komisyon İptalleri &amp; Clawback (Geri Alma) Motoru</span>
        </h2>
        <p className="text-xs text-slate-500">
          Müşteri iadesi ve chargeback (harcama itirazı) durumlarında e-Arşiv İade Faturası kesme, üst kolların cüzdanlarından komisyon düşümü ve Muhtasar stopaj düzeltmesi
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Toplam Sipariş İadeleri (610.01)</span>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {totalRefundAmountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] text-red-700 font-medium">e-Arşiv İade Faturaları Kesildi</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Geri Çekilen Komisyon (Clawback)</span>
          <div className="text-2xl font-bold font-mono text-red-600">
            -{totalClawbacksTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] text-slate-400">Bayi cüzdan bakiyelerinden tenzil edildi</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Vergi Dairesi Stopaj Düzeltmesi</span>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            +{totalStopajReversalsTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Muhtasar beyannameden düşülecek</span>
        </div>
      </div>

      {/* İade ve Clawback İşleme Paneli */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Yeni İade &amp; Chargeback Clawback Başlat
            </h3>
            <p className="text-xs text-slate-500">
              Fatura seçildiğinde ilişkili MLM bayisine dağıtılmış komisyon tutarları otomatik tespit edilir
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block text-slate-600 font-medium mb-1">
              İade Edilecek Fatura / Müşteri Siparişi
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white"
            >
              <option value="">Fatura seçiniz...</option>
              {refundableInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} · {inv.customer.name} · {inv.grandTotal.toLocaleString('tr-TR')} {inv.currency} ({inv.issueDate})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">İptal / İade Nedeni</label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white"
            >
              <option value="MUSTERI_IADE_TALEBI">Müşteri Yasal Cayma / İade Talebi</option>
              <option value="CHARGEBACK_ITIRAZ">Banka Kart Harcama İtirazı (Chargeback)</option>
              <option value="HIZMET_IPTALI">Hizmet Sağlanamadı / İptal</option>
            </select>
          </div>
        </div>

        {selectedInvoiceId && (
          <div className="p-4 bg-red-50/60 border border-red-200/80 rounded-lg text-xs space-y-2 text-red-900">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Otomatik Tetiklenecek Yasal İşlemler:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-red-800">
              <li>Müşteri adına resmi <strong>e-Arşiv İade Faturası</strong> kesilecek ve GİB portalına iletilecek.</li>
              <li>İlgili satıştan komisyon almış olan MLM bayilerinin cüzdanından <strong>net hakediş tutarı otomatik düşülecek / borç kaydedilecek</strong>.</li>
              <li>Vergi dairesine yatırılmak üzere ayrılan <strong>%20 Gelir Vergisi Stopajı</strong> Muhtasar Düzeltme Beyannamesine tenzil kaydı olarak eklenecek.</li>
              <li>Yevmiye defterine <strong>610.01 Satıştan İadeler</strong> ve <strong>191 İade KDV</strong> ters kayıtları işlenecek.</li>
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleProcessRefund}
            disabled={!selectedInvoiceId}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>İadeyi Onayla &amp; Komisyonu Geri Çek (Clawback)</span>
          </button>
        </div>
      </div>

      {/* İade ve Clawback Kayıtları Tablosu */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Gerçekleşen İade &amp; Clawback Kayıtları
            </h3>
            <p className="text-xs text-slate-500">
              GİB e-Arşiv İade faturaları ve cüzdandan tenzil edilen komisyon dökümü
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">İade Fatura No</th>
                <th className="py-3 px-4">Orijinal Fatura</th>
                <th className="py-3 px-4">Müşteri</th>
                <th className="py-3 px-4">Tarih / Neden</th>
                <th className="py-3 px-4 text-right">İade Tutarı</th>
                <th className="py-3 px-4">Etkilenen Bayiler (Clawback)</th>
                <th className="py-3 px-4 text-right">Stopaj Düzeltmesi</th>
                <th className="py-3 px-4 text-center">GİB Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {refunds.map((ref) => (
                <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{ref.refundInvoiceNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{ref.originalInvoiceNumber}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-800">{ref.customerName}</td>
                  <td className="py-3 px-4 font-sans text-slate-600">
                    <div>{ref.date}</div>
                    <span className="text-[10px] text-slate-400">
                      {ref.reason === 'CHARGEBACK_ITIRAZ'
                        ? 'Chargeback İtirazı'
                        : ref.reason === 'MUSTERI_IADE_TALEBI'
                        ? 'Müşteri Cayma Hakkı'
                        : 'Hizmet İptali'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-red-600">
                    -{ref.refundAmountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {ref.clawbacksApplied.map((cb, idx) => (
                      <div key={idx} className="text-[11px] text-slate-800">
                        <span className="font-semibold">{cb.distributorName}:</span>{' '}
                        <span className="text-red-700 font-mono">
                          -{cb.netClawbackTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                    +{ref.clawbacksApplied.reduce((s, c) => s + c.stopajReversedTRY, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      e-Arşiv İade Tanzim Edildi
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
