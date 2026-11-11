import React, { useState } from 'react';
import { LedgerEntry } from '../../types/accounting';
import { exportLedgerToXml, exportLedgerToCsv } from '../../services/gibIntegrator';
import { Download, FileSpreadsheet, FileCode, CheckCircle2, BookOpen } from 'lucide-react';

interface ExportLedgerViewProps {
  ledgerEntries: LedgerEntry[];
}

export const ExportLedgerView: React.FC<ExportLedgerViewProps> = ({ ledgerEntries }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = (type: 'LUCA_XML' | 'ZIRVE_CSV' | 'GIB_EDEFFER_XML' | 'EXCEL_CSV') => {
    let content = '';
    let mime = 'text/plain;charset=utf-8;';
    let filename = '';

    if (type === 'LUCA_XML' || type === 'GIB_EDEFFER_XML') {
      content = exportLedgerToXml(ledgerEntries);
      mime = 'application/xml;charset=utf-8;';
      filename = type === 'LUCA_XML' ? 'Luca_Yevmiye_Aktarimi_2026_10.xml' : 'GIB_eDefter_Yevmiye_v1.5.xml';
    } else {
      content = exportLedgerToCsv(ledgerEntries);
      mime = 'text/csv;charset=utf-8;';
      filename = type === 'ZIRVE_CSV' ? 'Zirve_Musavir_Fis_Listesi.csv' : 'Yevmiye_Defteri_2026_10.csv';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(`${filename} başarıyla oluşturuldu ve indirildi.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debitTRY, 0);
  const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.creditTRY, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            e-Defter &amp; Mali Müşavir Programı Aktarım Merkezi
          </h2>
          <p className="text-xs text-slate-500">
            Luca, Zirve, Mikro, Logo ve GİB e-Defter uyumlu yasal yevmiye defteri çift taraflı kayıtları
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDownload('LUCA_XML')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            <span>Luca XML Aktar</span>
          </button>
          <button
            onClick={() => handleDownload('ZIRVE_CSV')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zirve Müşavir CSV</span>
          </button>
          <button
            onClick={() => handleDownload('GIB_EDEFFER_XML')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GİB e-Defter XML</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Yevmiye Defteri (General Ledger) Tablosu */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Resmi Yevmiye Defteri Maddeleri (Tekdüzen Hesap Planı)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Dönem: 2026 / 10 · Madde Sayısı: {ledgerEntries.length} kayıt
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Toplam Borç: </span>
              <span className="font-bold text-slate-900">
                {totalDebit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>
            <div>
              <span className="text-slate-400">Toplam Alacak: </span>
              <span className="font-bold text-slate-900">
                {totalCredit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Madde No</th>
                <th className="py-2.5 px-4">Tarih</th>
                <th className="py-2.5 px-4">Hesap Kodu</th>
                <th className="py-2.5 px-4">Hesap Adı</th>
                <th className="py-2.5 px-4 text-right">Borç (TRY)</th>
                <th className="py-2.5 px-4 text-right">Alacak (TRY)</th>
                <th className="py-2.5 px-4">Belge Ref</th>
                <th className="py-2.5 px-4">Yasal Açıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {ledgerEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500">{e.entryNumber}</td>
                  <td className="py-2.5 px-4 text-slate-600">{e.date}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{e.accountCode}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-800">{e.accountName}</td>
                  <td className="py-2.5 px-4 text-right">
                    {e.debitTRY > 0 ? (
                      <span className="font-bold text-slate-900">
                        {e.debitTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {e.creditTRY > 0 ? (
                      <span className="font-bold text-slate-900">
                        {e.creditTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-sans text-[11px]">{e.documentNumber}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-600 text-[11px] truncate max-w-xs">
                    {e.description}
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
