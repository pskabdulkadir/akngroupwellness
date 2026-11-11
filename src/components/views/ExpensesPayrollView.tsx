import React, { useState } from 'react';
import { ExpenseRecord, PayrollRecord } from '../../types/accounting';
import {
  FileText,
  Users,
  DollarSign,
  TrendingDown,
  Building,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

interface ExpensesPayrollViewProps {
  expenses: ExpenseRecord[];
  payroll: PayrollRecord[];
  onAddExpense: (expense: ExpenseRecord) => void;
}

export const ExpensesPayrollView: React.FC<ExpensesPayrollViewProps> = ({
  expenses,
  payroll,
  onAddExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'PAYROLL'>('EXPENSES');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Yeni gider formu alanları
  const [vendorName, setVendorName] = useState('Google Cloud EMEA (Server Altyapısı)');
  const [vendorTaxNumber, setVendorTaxNumber] = useState('IE-6384920');
  const [category, setCategory] = useState<'760_PAZARLAMA' | '770_GENEL_YONETIM' | '770_BULUT_SERVER'>('770_BULUT_SERVER');
  const [description, setDescription] = useState('Google Cloud Kubernetes & AI API Barındırma');
  const [subtotalTRY, setSubtotalTRY] = useState<number>(14500);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const vat191 = Number((subtotalTRY * 0.20).toFixed(2));
    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: `GDR2026${Math.floor(100000 + Math.random() * 900000)}`,
      vendorName,
      vendorTaxNumber,
      category,
      description,
      subtotalTRY,
      vatRate: 0.20,
      vatDeductible191: vat191,
      totalTRY: subtotalTRY + vat191,
      paymentStatus: 'ODENDI',
    };

    onAddExpense(newExpense);
    setShowAddExpenseModal(false);
  };

  const totalExpensesTRY = expenses.reduce((sum, e) => sum + e.totalTRY, 0);
  const totalDeductibleVatTRY = expenses.reduce((sum, e) => sum + e.vatDeductible191, 0);
  const totalPayrollEmployerCostTRY = payroll.reduce((sum, p) => sum + p.totalEmployerCostTRY, 0);
  const totalNetSalariesTRY = payroll.reduce((sum, p) => sum + p.netSalaryTRY, 0);
  const totalSgkPayableTRY = payroll.reduce((sum, p) => sum + p.totalSgkPayable361, 0);

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Şirket İçi Gider (Expense) &amp; Personel Bordro Modülü
          </h2>
          <p className="text-xs text-slate-500">
            760 Pazarlama, 770 Genel Yönetim, 191 İndirilecek KDV ve 361 SGK bordro tahakkuklarının yönetimi
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('EXPENSES')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'EXPENSES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Şirket Harcamaları (760/770)
            </button>
            <button
              onClick={() => setActiveTab('PAYROLL')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'PAYROLL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Personel Bordrosu (SGK)
            </button>
          </div>

          {activeTab === 'EXPENSES' && (
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gider Faturası Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            Toplam Şirket Giderleri (760 &amp; 770)
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {totalExpensesTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] font-sans text-slate-400">AWS, Kira, Reklam ve Yazılım</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            İndirilecek KDV Toplamı (191)
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            {totalDeductibleVatTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] font-sans text-emerald-600 font-semibold">
            KDV 1 Beyannamesinde 391'den düşülür
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            Aylık Personel Toplam Maliyeti
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {totalPayrollEmployerCostTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <span className="text-[10px] font-sans text-slate-400">
            Net Maaş: {totalNetSalariesTRY.toLocaleString('tr-TR')} ₺ · SGK: {totalSgkPayableTRY.toLocaleString('tr-TR')} ₺
          </span>
        </div>
      </div>

      {/* Tab 1: GİDER FATURALARI TABLOSU */}
      {activeTab === 'EXPENSES' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Operasyonel Harcama &amp; Tedarikçi Faturaları
              </h3>
              <p className="text-xs text-slate-500">
                AWS sunucu, ofis kirası ve dijital reklam faturalarının KDV-2 tevkifat dökümü
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Tarih / Belge No</th>
                  <th className="py-3 px-4">Tedarikçi / Kurum</th>
                  <th className="py-3 px-4">Gider Hesabı</th>
                  <th className="py-3 px-4">Açıklama</th>
                  <th className="py-3 px-4 text-right">Matrah (TRY)</th>
                  <th className="py-3 px-4 text-right">İndirilecek KDV (191)</th>
                  <th className="py-3 px-4 text-right">Tevkifat / Stopaj</th>
                  <th className="py-3 px-4 text-right">Toplam Fatura</th>
                  <th className="py-3 px-4 text-center">Ödeme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{exp.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{exp.date}</div>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-800">
                      <div>{exp.vendorName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{exp.vendorTaxNumber}</span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                        {exp.category === '760_PAZARLAMA' ? '760 Pazarlama' : '770 Genel Yönetim'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 text-[11px] truncate max-w-xs">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {exp.subtotalTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      +{exp.vatDeductible191.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right font-sans text-[11px]">
                      {exp.vatWithholding2 ? (
                        <span className="text-amber-800 font-mono block">
                          2 No.lu KDV: {exp.vatWithholding2} ₺
                        </span>
                      ) : null}
                      {exp.stopajAmount360 ? (
                        <span className="text-red-700 font-mono block">
                          Stopaj (%15): {exp.stopajAmount360} ₺
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {exp.totalTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Ödendi
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: PERSONEL BORDRO TABLOSU */}
      {activeTab === 'PAYROLL' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Aylık SGK Personel Bordrosu &amp; Yasal Kesintiler (360 / 361)
              </h3>
              <p className="text-xs text-slate-500">
                Brüt ücret, SGK işçi/işveren payları ve gelir vergisi tahakkuk dökümü
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Personel Adı</th>
                  <th className="py-3 px-4">Unvan / Departman</th>
                  <th className="py-3 px-4 text-right">Brüt Ücret</th>
                  <th className="py-3 px-4 text-right">SGK İşçi (%14)</th>
                  <th className="py-3 px-4 text-right">Gelir Vergisi (360)</th>
                  <th className="py-3 px-4 text-right">Net Ödenen Maaş</th>
                  <th className="py-3 px-4 text-right">SGK İşveren (%20.5)</th>
                  <th className="py-3 px-4 text-right">Toplam İşveren Maliyeti (770)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {payroll.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      <div>{p.employeeName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">TC: {p.employeeIdNumber}</span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700">{p.department}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {p.grossSalaryTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      -{p.sgkWorkerShare14.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right text-amber-700 font-semibold">
                      {p.incomeTax360.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {p.netSalaryTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {p.sgkEmployerShare20_5.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {p.totalEmployerCostTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Yeni Gider Ekle Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Yeni Gider Faturası Kaydı</h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Tedarikçi Firma / Kurum</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">VKN / Vergi No</label>
                  <input
                    type="text"
                    required
                    value={vendorTaxNumber}
                    onChange={(e) => setVendorTaxNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Gider Hesabı</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="770_BULUT_SERVER">770 - Bulut Sunucu &amp; Altyapı</option>
                    <option value="760_PAZARLAMA">760 - Pazarlama &amp; Reklam</option>
                    <option value="770_GENEL_YONETIM">770 - Ofis Kirası &amp; Genel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Fatura Açıklaması</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Matrah Tutarı (TRY)</label>
                <input
                  type="number"
                  required
                  value={subtotalTRY}
                  onChange={(e) => setSubtotalTRY(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  %20 KDV ({Number((subtotalTRY * 0.2).toFixed(2))} ₺) otomatik hesaplanıp 191 İndirilecek KDV hesabına işlenecektir.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  Gideri Kaydet &amp; 191'e İşle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
