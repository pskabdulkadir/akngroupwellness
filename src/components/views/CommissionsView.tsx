import React, { useState, useEffect } from 'react';
import { CommissionPayout, Distributor, ExpenseVoucherRecord, PayoutBatchRecord, PendingPayoutItem } from '../../types/accounting';
import {
  Users,
  FileText,
  Building2,
  UserCheck,
  CheckCircle,
  Eye,
  AlertCircle,
  FileCheck,
  Percent,
  Download,
  CreditCard,
  Landmark,
  ShieldCheck,
  RefreshCw,
  CheckSquare,
  Square,
  ArrowRight,
  FileCode,
  Clock,
  Sparkles,
} from 'lucide-react';
import avatarDistributor from '../../assets/images/avatar_distributor_lead_1792512086444.jpg';

interface CommissionsViewProps {
  distributors: Distributor[];
  commissions: CommissionPayout[];
  onOpenGiderPusulasi: (comm: CommissionPayout) => void;
  onRefreshData?: () => void;
}

export const CommissionsView: React.FC<CommissionsViewProps> = ({
  distributors,
  commissions,
  onOpenGiderPusulasi,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'PAYOUTS' | 'VOUCHERS' | 'BATCHES'>('PAYOUTS');
  const [filterType, setFilterType] = useState<'ALL' | 'INDIVIDUAL' | 'COMPANY'>('ALL');

  // Live Payouts & Vouchers from Backend
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayoutItem[]>([]);
  const [expenseVouchers, setExpenseVouchers] = useState<ExpenseVoucherRecord[]>([]);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatchRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBank, setSelectedBank] = useState<'GARANTI' | 'AKBANK' | 'ISBANK' | 'ZIRAAT'>('GARANTI');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Verileri Backend'den Çek
  const fetchLiveData = async () => {
    setIsLoading(true);
    setActionErrorMsg(null);
    try {
      const [pendingRes, vouchersRes, batchesRes] = await Promise.all([
        fetch('/api/v1/accounting/payouts/pending'),
        fetch('/api/v1/accounting/vouchers'),
        fetch('/api/v1/accounting/payouts/batches'),
      ]);

      if (pendingRes.ok) {
        const pData = await pendingRes.json();
        if (pData.items) {
          setPendingPayouts(pData.items);
          // Varsayılan olarak tüm bekleyenleri seç
          setSelectedIds(new Set(pData.items.map((i: PendingPayoutItem) => i.voucher_number || i.commission_id)));
        }
      }

      if (vouchersRes.ok) {
        const vData = await vouchersRes.json();
        if (vData.vouchers) setExpenseVouchers(vData.vouchers);
      }

      if (batchesRes.ok) {
        const bData = await batchesRes.json();
        if (bData.batches) setPayoutBatches(bData.batches);
      }
    } catch (err: any) {
      console.warn('Muhasebe verileri çekilirken hata:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  // Checkbox Seçim Yönetimi
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === pendingPayouts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingPayouts.map((i) => i.voucher_number || i.commission_id)));
    }
  };

  // 14 Günlük Süresi Dolanları Otomatik Tetikle (Job Worker Trigger)
  const handleTriggerMaturedJob = async () => {
    setIsLoading(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await fetch('/api/v1/accounting/vouchers/generate-matured', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccessMsg(
          data.message || `${data.generatedCount || 0} adet süresi dolan hakediş için resmi e-gider pusulası üretildi.`
        );
        await fetchLiveData();
        if (onRefreshData) onRefreshData();
      } else {
        setActionErrorMsg(data.error || 'İşlem başarısız oldu.');
      }
    } catch (e: any) {
      setActionErrorMsg(e.message || 'Bağlantı hatası.');
    } finally {
      setIsLoading(false);
    }
  };

  // Banka İçin Toplu Transfer Dosyası İndir (.csv)
  const handleDownloadBankFile = () => {
    if (selectedIds.size === 0) {
      setActionErrorMsg('Lütfen dosyaya eklenecek en az bir bayi hakedişi seçin.');
      return;
    }
    const idsParam = Array.from(selectedIds).join(',');
    const downloadUrl = `/api/v1/accounting/payouts/export-bank-file?bank=${selectedBank}&commission_ids=${encodeURIComponent(
      idsParam
    )}`;
    window.open(downloadUrl, '_blank');
    setActionSuccessMsg(
      `${selectedBank} formatında toplu ödeme dosyası başarıyla indirildi. Banka kurumsal internet şubesine yüklenebilir.`
    );
  };

  // Seçilenleri Onayla ve Ödemeyi Tamamla (Atomik PostgreSQL Transaction)
  const handleExecutePayout = async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/v1/accounting/payouts/execute-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commission_ids: Array.from(selectedIds),
          bank_name: selectedBank,
          executed_by: 'CFO / Finans Direktörü',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccessMsg(data.message || 'Toplu bayi ödemesi başarıyla tamamlandı!');
        setSelectedIds(new Set());
        await fetchLiveData();
        if (onRefreshData) onRefreshData();
      } else {
        setActionErrorMsg(data.error || 'Toplu ödeme gerçekleştirilemedi.');
      }
    } catch (e: any) {
      setActionErrorMsg(e.message || 'Ağ hatası.');
    } finally {
      setIsLoading(false);
    }
  };

  // Seçili Hakedişlerin Toplamları
  const selectedItems = pendingPayouts.filter((i) =>
    selectedIds.has(i.voucher_number || i.commission_id)
  );
  const selectedTotalGross = selectedItems.reduce((acc, i) => acc + i.gross_amount, 0);
  const selectedTotalStopaj = selectedItems.reduce((acc, i) => acc + i.withholding_amount, 0);
  const selectedTotalNet = selectedItems.reduce((acc, i) => acc + i.net_amount, 0);

  // Gider Pusulası Görüntüleme Köprüsü
  const handleOpenVoucherModal = (v: ExpenseVoucherRecord | PendingPayoutItem) => {
    const matchedComm: CommissionPayout = {
      id: v.voucher_number,
      invoiceId: v.order_id,
      invoiceNumber: v.order_id,
      distributorId: v.dealer_user_id,
      distributorName: 'dealer_full_name' in v ? v.dealer_full_name : v.dealer_name,
      isCompany: v.is_company,
      tierLevel: 1,
      commissionRate: 0.20,
      baseAmountTRY: v.gross_amount,
      grossCommissionTRY: v.gross_amount,
      withholdingRate: 'withholding_rate' in v ? v.withholding_rate : 0.20,
      withholdingAmountTRY: v.withholding_amount,
      netPayableTRY: v.net_amount,
      payoutDate: 'release_at' in v ? v.release_at : v.created_at,
      documentType: 'GIDER_PUSULASI',
      documentNumber: v.voucher_number,
      isPaid: v.status === 'PAID_SETTLED',
      ledgerPosted: true,
    };
    onOpenGiderPusulasi(matchedComm);
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-700" />
            Monoline MLM Muhasebe, e-Gider Pusulası &amp; Toplu Bayi Ödeme Motoru
          </h2>
          <p className="text-xs text-slate-500">
            14 günlük yasal cayma süresi korumalı otomatik e-gider pusulası tanzimi, GVK 94/10-b stopaj kesintisi ve banka toplu transfer konsolu
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('PAYOUTS')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'PAYOUTS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Toplu Bayi Ödeme Konsolu ({pendingPayouts.length})
          </button>
          <button
            onClick={() => setActiveTab('VOUCHERS')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'VOUCHERS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Resmi Gider Pusulaları ({expenseVouchers.length})
          </button>
          <button
            onClick={() => setActiveTab('BATCHES')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'BATCHES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Ödeme Paket Geçmişi ({payoutBatches.length})
          </button>
        </div>
      </div>

      {/* Success & Error Feedback Alerts */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-medium">{actionSuccessMsg}</p>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
          >
            Kapat
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="font-medium">{actionErrorMsg}</p>
          </div>
          <button
            onClick={() => setActionErrorMsg(null)}
            className="text-red-700 hover:text-red-900 text-xs font-bold px-2 py-1"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Ödenecek Net Tutar (320.01)</span>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {pendingPayouts
              .reduce((s, i) => s + i.net_amount, 0)
              .toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] text-slate-400">
            {pendingPayouts.length} bayiye FAST/EFT ile tediye edilmeye hazır
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Tahakkuk Eden Stopaj (360.01)</span>
          <div className="text-2xl font-bold font-mono text-amber-700">
            {pendingPayouts
              .reduce((s, i) => s + i.withholding_amount, 0)
              .toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] text-amber-800 font-medium">GVK 94/10-b (%20 Gelir Vergisi Kesintisi)</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Aktif Bayi Ağı</span>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {distributors.length > 0 ? distributors.length : 3} Bayi
            </div>
            <span className="text-[10px] text-slate-400">1 Kurumsal · 2 Bireysel</span>
          </div>
          <img
            src={avatarDistributor}
            alt="Bayi Ağı Yöneticisi"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover border border-slate-200"
          />
        </div>
      </div>

      {/* TAB 1: TOPLU BAYİ ÖDEME KONSOLU (BATCH PAYOUT ENGINE) */}
      {activeTab === 'PAYOUTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Action Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors"
              >
                {selectedIds.size === pendingPayouts.length && pendingPayouts.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                Tümünü Seç ({selectedIds.size}/{pendingPayouts.length})
              </button>

              <button
                onClick={handleTriggerMaturedJob}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors"
                title="14 günlük süresi dolan tüm hak edişler için arka plan kuyruğunu tetikler"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                14 Gün Süresi Dolanları Tetikle
              </button>
            </div>

            {/* Toplu Banka İndirme ve Onay Butonları */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-slate-500 font-medium">Banka:</span>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="GARANTI">Garanti BBVA</option>
                  <option value="AKBANK">Akbank</option>
                  <option value="ISBANK">İş Bankası</option>
                  <option value="ZIRAAT">Ziraat Bankası</option>
                </select>
              </div>

              <button
                onClick={handleDownloadBankFile}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Banka İçin Toplu Ödeme Listesi İndir (.CSV)
              </button>

              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={selectedIds.size === 0 || isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Seçilenleri Onayla ve Ödemeyi Tamamla
              </button>
            </div>
          </div>

          {/* Pending Payouts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4 w-10 text-center">Seç</th>
                  <th className="py-3 px-4">Pusula No / Hakediş</th>
                  <th className="py-3 px-4">Hak Sahibi Bayi (TCKN/VKN)</th>
                  <th className="py-3 px-4">Banka &amp; IBAN Bilgisi</th>
                  <th className="py-3 px-4 text-right">Brüt Hakediş</th>
                  <th className="py-3 px-4 text-right">Stopaj (%20)</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-800">Net Ödenecek</th>
                  <th className="py-3 px-4 text-center">Yasal Statü</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {pendingPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                      Ödeme bekleyen hakediş bulunmuyor. Tüm hak edişler tediye edildi.
                    </td>
                  </tr>
                ) : (
                  pendingPayouts.map((item) => {
                    const isSelected = selectedIds.has(item.voucher_number || item.commission_id);
                    return (
                      <tr
                        key={item.voucher_number || item.commission_id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-sans">
                          <button
                            onClick={() => handleToggleSelect(item.voucher_number || item.commission_id)}
                            className="text-slate-600 hover:text-indigo-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{item.voucher_number}</span>
                          <span className="block text-[10px] text-slate-400 font-sans">
                            Sipariş: {item.order_id}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <p className="font-bold text-slate-900">{item.dealer_name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.is_company ? `VKN: ${item.dealer_tckn}` : `TCKN: ${item.dealer_tckn}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="text-slate-800 font-medium">{item.dealer_iban}</span>
                          <span className="block text-[10px] text-slate-400 font-sans">Garanti BBVA / FAST</span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {item.gross_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {item.is_company ? (
                            <span className="text-slate-400">0.00 ₺ (%0 Şirket)</span>
                          ) : (
                            <span className="text-red-700">
                              -{item.withholding_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                          {item.net_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td className="py-3 px-4 text-center font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Onay Bekliyor
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <button
                            onClick={() => handleOpenVoucherModal(item)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md shadow-2xs transition-colors"
                          >
                            Pusulayı İncele
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Selected Summary Footer Bar */}
          {selectedIds.size > 0 && (
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Seçilen Bayi</span>
                  <span className="text-base font-bold font-mono">{selectedItems.length} Bayi</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Toplam Brüt</span>
                  <span className="text-base font-bold font-mono">
                    {selectedTotalGross.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-amber-300 uppercase tracking-wider block">Kesilecek Stopaj</span>
                  <span className="text-base font-bold font-mono text-amber-400">
                    -{selectedTotalStopaj.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-300 uppercase tracking-wider block">Banka Net Tutar</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {selectedTotalNet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadBankFile}
                  className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-slate-700" />
                  {selectedBank} Dosyası İndir
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Ödemeyi Tamamla ({selectedTotalNet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESMİ GİDER PUSULALARI & GİB XML ARŞİVİ */}
      {activeTab === 'VOUCHERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Resmi e-Gider Pusulası &amp; e-Dönüşüm Arşivi (213 Sayılı VUK Madde 234)
              </h3>
              <p className="text-xs text-slate-500">
                GİB standartlarında üretilen, stopajı ayrıştırılmış resmi belgeler ve XML çıktıları
              </p>
            </div>
            <button
              onClick={fetchLiveData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Yenile
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Pusula No</th>
                  <th className="py-3 px-4">ETTN (UUID)</th>
                  <th className="py-3 px-4">Hak Sahibi Bayi</th>
                  <th className="py-3 px-4">Vergi Tipi</th>
                  <th className="py-3 px-4 text-right">Brüt Tutar</th>
                  <th className="py-3 px-4 text-right">Stopaj (%20)</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-800">Net Tutar</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-right">Resmi Çıktılar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {expenseVouchers.map((v) => (
                  <tr key={v.voucher_number} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{v.voucher_number}</td>
                    <td className="py-3 px-4 text-slate-500 text-[10px]">{v.ettn_uuid.slice(0, 18)}...</td>
                    <td className="py-3 px-4 font-sans">
                      <p className="font-semibold text-slate-900">{v.dealer_full_name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{v.dealer_tckn}</span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {v.is_company ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          Şirket (Fatura Keser)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Gider Pusulası (Stopajlı)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {v.gross_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-red-700">
                      {v.is_company ? '0.00 ₺' : `-${v.withholding_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {v.net_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      {v.status === 'PAID_SETTLED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Ödendi &amp; İşlendi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Ödeme Bekliyor
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenVoucherModal(v)}
                          className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md shadow-2xs"
                        >
                          İncele
                        </button>
                        <a
                          href={`/api/v1/accounting/vouchers/${v.voucher_number}/xml`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={`${v.voucher_number}.xml`}
                          className="px-2 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md shadow-2xs flex items-center gap-1"
                        >
                          <FileCode className="w-3 h-3" />
                          GİB XML
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ÖDEME PAKET GEÇMİŞİ (PAYOUT BATCHES) */}
      {activeTab === 'BATCHES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Toplu Banka Transfer Paketleri (Batch Payout History)
              </h3>
              <p className="text-xs text-slate-500">
                Yönetici tarafından onaylanarak bankaya gönderilen ve cüzdanlardan düşülen toplu ödeme paketleri
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Paket ID</th>
                  <th className="py-3 px-4">Banka Adı</th>
                  <th className="py-3 px-4 text-center">Bayi Adedi</th>
                  <th className="py-3 px-4 text-right">Toplam Brüt</th>
                  <th className="py-3 px-4 text-right">Kesilen Stopaj</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-800">Ödenen Net Nakit</th>
                  <th className="py-3 px-4">Onaylayan</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4 text-center">Statü</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {payoutBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                      Henüz onaylanmış bir toplu transfer paketi bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  payoutBatches.map((b) => (
                    <tr key={b.batch_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{b.batch_id}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-indigo-700">{b.bank_name}</td>
                      <td className="py-3 px-4 text-center">{b.item_count} Bayi</td>
                      <td className="py-3 px-4 text-right">
                        {b.total_gross.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </td>
                      <td className="py-3 px-4 text-right text-red-700">
                        -{b.total_withholding.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {b.total_net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600">{b.executed_by || 'Yönetici'}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{b.created_at.split('T')[0]}</td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Başarıyla Tediye Edildi
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR ATOMIC BATCH PAYOUT */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-800">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Toplu Bayi Banka Ödemesi Onayı
                </h3>
                <p className="text-xs text-slate-500">
                  Veritabanı seviyesinde tek bir atomik transaction (BEGIN ... COMMIT) ile yürütülür.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Ödenecek Bayi Adedi:</span>
                <span className="font-bold font-mono text-slate-900">{selectedItems.length} Bayi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Seçilen Banka Transfer Kanalı:</span>
                <span className="font-bold text-indigo-700">{selectedBank} BBVA Kurumsal EFT/FAST</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Toplam Brüt Hakediş:</span>
                <span className="font-bold font-mono text-slate-900">
                  {selectedTotalGross.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GVK 94/10-b Stopaj Kesintisi:</span>
                <span className="font-bold font-mono text-red-700">
                  -{selectedTotalStopaj.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold">
                <span className="text-slate-900">Bankadan Çıkacak Net Tutar:</span>
                <span className="font-mono text-emerald-700">
                  {selectedTotalNet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                Otomatik Yevmiye Fişi (Double-Entry Ledger):
              </p>
              <p>
                Borç (Debit): <strong>320.01 Satıcılar / Bayi Cari Borçları</strong> ({selectedTotalNet.toLocaleString('tr-TR')} ₺)<br />
                Alacak (Credit): <strong>102.01 {selectedBank} Ticari Mevduat Hesabı</strong> ({selectedTotalNet.toLocaleString('tr-TR')} ₺)
              </p>
              <p className="text-[10px] text-blue-700">
                Bayilerin cüzdanlarından net tutar anlık düşülecek ve hakedişler `PAID_SETTLED` durumuna kilitlenecektir.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                İptal Et
              </button>
              <button
                onClick={handleExecutePayout}
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Onayla ve Banka Transferini Gerçekleştir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
