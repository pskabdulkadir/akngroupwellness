import React, { useState } from 'react';
import { InventoryProduct, StockMovement, LedgerEntry } from '../../types/accounting';
import { calculateInflationAdjustment } from '../../services/taxEngine';
import {
  Package,
  Layers,
  Truck,
  TrendingUp,
  Percent,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
} from 'lucide-react';

interface InventoryStockViewProps {
  products: InventoryProduct[];
  movements: StockMovement[];
  onProductsUpdated: (products: InventoryProduct[], ledgerEntry: LedgerEntry) => void;
}

export const InventoryStockView: React.FC<InventoryStockViewProps> = ({
  products,
  movements,
  onProductsUpdated,
}) => {
  const [inflationRate, setInflationRate] = useState<number>(44.2); // %44.2 Yİ-ÜFE katsayısı
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentResult, setAdjustmentResult] = useState<{
    diff: number;
    coeff: number;
  } | null>(null);

  const handleApplyInflationAdjustment = () => {
    setIsAdjusting(true);
    const coeff = 1 + inflationRate / 100;
    const { adjustedProducts, totalAdjustmentDifferenceTRY, ledgerEntry } = calculateInflationAdjustment(
      products,
      coeff
    );

    setTimeout(() => {
      setIsAdjusting(false);
      setAdjustmentResult({
        diff: totalAdjustmentDifferenceTRY,
        coeff,
      });
      onProductsUpdated(adjustedProducts, ledgerEntry);
    }, 600);
  };

  const totalStockValueTRY = products.reduce((sum, p) => sum + p.unitCostTRY * p.currentStock, 0);
  const totalAdjustedStockValueTRY = products.reduce(
    (sum, p) => sum + (p.inflationAdjustedCostTRY || p.unitCostTRY) * p.currentStock,
    0
  );
  const totalSmmCostTRY = movements
    .filter((m) => m.movementType === 'CIKIS_SATIS')
    .reduce((sum, m) => sum + m.totalCostTRY, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Fiziksel Ürün &amp; Stok Maliyet Muhasebesi (153 / 621)
          </h2>
          <p className="text-xs text-slate-500">
            Envanter takibi, Satılan Malın Maliyeti (SMM), GİB e-İrsaliye düzenleme ve VUK 298/A Enflasyon Muhasebesi
          </p>
        </div>

        <button
          onClick={handleApplyInflationAdjustment}
          disabled={isAdjusting}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{isAdjusting ? 'Düzeltme Yapılıyor...' : 'VUK 298/A Enflasyon Düzeltmesi Yap'}</span>
        </button>
      </div>

      {adjustmentResult && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">
                Enflasyon Düzeltmesi Başarıyla Uygulandı (Katsayı: {adjustmentResult.coeff.toFixed(3)})
              </p>
              <p className="text-[11px] text-emerald-800">
                153 Ticari Mallar hesabına +{adjustmentResult.diff.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ değerleme farkı eklendi ve 698 Enflasyon Düzeltme Hesabına alacak kaydı açıldı.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            Depo Envanter Maliyeti (153.01)
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {totalStockValueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] font-sans text-slate-400">
            TFRS / VUK Tarihi Maliyet Değeri
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            Enflasyon Düzeltmeli Değer (698)
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            {totalAdjustedStockValueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] font-sans text-emerald-600 font-semibold">
            VUK Mükerrer 298/A Katsayılı
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            Dönem İçi Toplam SMM (621.01)
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {totalSmmCostTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] font-sans text-slate-400">
            Satılan Ticari Mallar Maliyeti
          </span>
        </div>
      </div>

      {/* Envanter Listesi Tablosu */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Fiziksel Ticari Mallar Envanter &amp; Depo Durumu
            </h3>
            <p className="text-xs text-slate-500">
              Cihaz, gıda takviyesi ve kozmetik ürünlerinin maliyet &amp; stok seviyeleri
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">SKU / Barkod</th>
                <th className="py-3 px-4">Ürün Adı &amp; Kategori</th>
                <th className="py-3 px-4">Depo Lokasyonu</th>
                <th className="py-3 px-4 text-center">Mevcut Stok</th>
                <th className="py-3 px-4 text-right">Birim Maliyet (153)</th>
                <th className="py-3 px-4 text-right">Enflasyonlu Maliyet</th>
                <th className="py-3 px-4 text-right">Satış Fiyatı</th>
                <th className="py-3 px-4 text-center">KDV %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {products.map((p) => {
                const isLowStock = p.currentStock <= p.reorderLevel;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.sku}</td>
                    <td className="py-3 px-4 font-sans">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <span className="text-[10px] text-slate-400">{p.category}</span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 text-[11px]">
                      {p.warehouseLocation}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          isLowStock
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {p.currentStock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {p.unitCostTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {(p.inflationAdjustedCostTRY || p.unitCostTRY).toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      ₺
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {p.sellingPriceTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100">
                        %{Math.round(p.vatRate * 100)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Depo Çıkış & e-İrsaliye Hareketleri */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              GİB e-İrsaliye ve Depo Çıkış Hareketleri (SMM 621)
            </h3>
            <p className="text-xs text-slate-500">
              Satılan ürünlerin yasal sevk irsaliyeleri ve maliyet muhasebesi dökümü
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">e-İrsaliye No</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Ürün</th>
                <th className="py-3 px-4 text-center">Çıkan Miktar</th>
                <th className="py-3 px-4 text-right">Birim SMM</th>
                <th className="py-3 px-4 text-right">Toplam SMM Tutarı (621)</th>
                <th className="py-3 px-4">Fatura Referansı</th>
                <th className="py-3 px-4 text-center">GİB Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{m.eWaybillNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{m.date}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-800">{m.productName}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900">{m.quantity} Adet</td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {m.unitPriceTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {m.totalCostTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td className="py-3 px-4 font-sans text-[11px] text-slate-600">{m.referenceDocument}</td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      GİB e-İrsaliye İmzalandı
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
