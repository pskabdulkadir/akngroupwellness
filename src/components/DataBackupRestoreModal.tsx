import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  Check, 
  Copy, 
  FileText, 
  X, 
  AlertTriangle, 
  RefreshCw,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Server
} from 'lucide-react';
import { getLocalMembersDirectory } from '../utils/authManager';
import { getLocalResellers, getLocalCommissions } from '../utils/resellerManager';
import { getLocalDigitalInvoices } from '../utils/invoiceManager';

interface DataBackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess?: () => void;
}

export const DataBackupRestoreModal: React.FC<DataBackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  
  // Export State
  const [exportJson, setExportJson] = useState<string>('');
  const [exportStats, setExportStats] = useState<{
    membersCount: number;
    resellersCount: number;
    invoicesCount: number;
    commissionsCount: number;
    serverMembersCount: number;
  }>({ membersCount: 0, resellersCount: 0, invoicesCount: 0, commissionsCount: 0, serverMembersCount: 0 });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Import State
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importFileName, setImportFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Load current system data for export
  const loadExportData = async () => {
    setIsExporting(true);
    try {
      const localMembers = getLocalMembersDirectory();
      const localResellers = getLocalResellers();
      const localCommissions = getLocalCommissions();
      const localInvoices = getLocalDigitalInvoices();

      // Read local custom packages, orders, scans
      let packages = [];
      let dealerOrders = [];
      let scanRecords = [];
      let creditLogs = [];
      try {
        const pRaw = localStorage.getItem('aurabio_membership_packages_v1');
        if (pRaw) packages = JSON.parse(pRaw);
      } catch {}
      try {
        const oRaw = localStorage.getItem('aurabio_dealer_package_orders_v1');
        if (oRaw) dealerOrders = JSON.parse(oRaw);
      } catch {}
      try {
        const sRaw = localStorage.getItem('aurabio_scan_records_v1');
        if (sRaw) scanRecords = JSON.parse(sRaw);
      } catch {}
      try {
        const cRaw = localStorage.getItem('aurabio_credit_transactions_v1');
        if (cRaw) creditLogs = JSON.parse(cRaw);
      } catch {}

      // Fetch server data if available
      let serverData: any = null;
      try {
        const sRes = await fetch('/api/v1/admin/export-data');
        if (sRes.ok) {
          const sJson = await sRes.json();
          serverData = sJson.data;
        }
      } catch (err) {
        console.debug('Server export note:', err);
      }

      const backupBundle = {
        exportDate: new Date().toISOString(),
        system: 'AuraBio & Frekans Holistic Health & Monoline MLM',
        version: '2.1.0',
        metadata: {
          clientMembers: localMembers.length,
          clientResellers: localResellers.length,
          clientInvoices: localInvoices.length,
          clientOrders: dealerOrders.length,
          serverMembers: serverData?.members?.length ?? 0,
        },
        members: localMembers,
        resellers: localResellers,
        commissions: localCommissions,
        digitalInvoices: localInvoices,
        packages,
        dealerOrders,
        scanRecords,
        creditLogs,
        serverState: serverData,
      };

      const jsonStr = JSON.stringify(backupBundle, null, 2);
      setExportJson(jsonStr);
      setExportStats({
        membersCount: localMembers.length,
        resellersCount: localResellers.length,
        invoicesCount: localInvoices.length,
        commissionsCount: localCommissions.length,
        serverMembersCount: serverData?.members?.length ?? 0,
      });
    } catch (err) {
      console.error('Error generating export data:', err);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadExportData();
      setImportSuccessMsg(null);
      setParseError(null);
    }
  }, [isOpen]);

  // Download JSON file
  const handleDownloadFile = () => {
    if (!exportJson) return;
    const blob = new Blob([exportJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `aurabio_sistem_tam_veri_paketi_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy JSON Code
  const handleCopyCode = async () => {
    if (!exportJson) return;
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error('Copy error:', e);
    }
  };

  // Handle File Input for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportJsonText(text);
      validateJson(text);
    };
    reader.readAsText(file);
  };

  // Validate JSON string
  const validateJson = (text: string) => {
    setParseError(null);
    setParsedData(null);
    if (!text.trim()) return;

    try {
      const data = JSON.parse(text);
      if (typeof data !== 'object' || data === null) {
        throw new Error('Geçersiz JSON nesnesi.');
      }
      setParsedData(data);
    } catch (err: any) {
      setParseError(`JSON formatı geçersiz: ${err?.message || 'Bilinmeyen sözdizimi hatası'}`);
    }
  };

  // Execute Restore / Import
  const handleExecuteRestore = async () => {
    if (!parsedData) return;
    setIsImporting(true);
    setImportSuccessMsg(null);
    setParseError(null);

    try {
      // 1. Restore local members
      if (Array.isArray(parsedData.members)) {
        localStorage.setItem('aurabio_members_directory_v1', JSON.stringify(parsedData.members));
      }

      // 2. Restore local resellers
      if (Array.isArray(parsedData.resellers)) {
        localStorage.setItem('aurabio_resellers_directory_v1', JSON.stringify(parsedData.resellers));
      }

      // 3. Restore commissions
      if (Array.isArray(parsedData.commissions)) {
        localStorage.setItem('aurabio_commissions_directory_v1', JSON.stringify(parsedData.commissions));
      }

      // 4. Restore digital invoices
      if (Array.isArray(parsedData.digitalInvoices)) {
        localStorage.setItem('aurabio_digital_invoices_v1', JSON.stringify(parsedData.digitalInvoices));
      }

      // 5. Restore packages & orders
      if (Array.isArray(parsedData.packages)) {
        localStorage.setItem('aurabio_membership_packages_v1', JSON.stringify(parsedData.packages));
      }
      if (Array.isArray(parsedData.dealerOrders)) {
        localStorage.setItem('aurabio_dealer_package_orders_v1', JSON.stringify(parsedData.dealerOrders));
      }
      if (Array.isArray(parsedData.scanRecords)) {
        localStorage.setItem('aurabio_scan_records_v1', JSON.stringify(parsedData.scanRecords));
      }
      if (Array.isArray(parsedData.creditLogs)) {
        localStorage.setItem('aurabio_credit_transactions_v1', JSON.stringify(parsedData.creditLogs));
      }

      // 6. Restore server state if available
      const serverPayload = parsedData.serverState || {
        members: parsedData.members,
        transactions: parsedData.transactions,
        distributionParams: parsedData.distributionParams,
        careerTiers: parsedData.careerTiers,
      };

      try {
        await fetch('/api/v1/admin/restore-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: serverPayload }),
        });
      } catch (srvErr) {
        console.debug('Server restore notification:', srvErr);
      }

      // 7. Dispatch events so all UI components update live
      window.dispatchEvent(new CustomEvent('aurabio_members_updated'));
      window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
      window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));

      setImportSuccessMsg('Tüm veriler, bayiler, kullanıcılar, komisyonlar ve sistem ayarları başarıyla yüklendi ve anında sisteme entegre edildi!');

      if (onRestoreSuccess) {
        onRestoreSuccess();
      }
    } catch (err: any) {
      setParseError(err?.message || 'Veri geri yüklenirken hata oluştu.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl shadow-emerald-950/70 space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Veri / Data Yönetim Portalı</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  Yedekle &amp; Geri Yükle
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tüm bayiler, kullanıcılar, komisyonlar, kariyerler, siparişler ve sistem ayarlarını kod olarak indirin ve geri yükleyin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Veri İndir (JSON Kodu Olarak İndir)</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Veri Yükle (Geri Yükle &amp; Uygula)</span>
          </button>
        </div>

        {/* TAB 1: VERİ İNDİR (EXPORT) */}
        {activeTab === 'export' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sistemdeki Tüm Aktif Veriler Paketleniyor</span>
                </span>
                <button
                  onClick={loadExportData}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isExporting ? 'animate-spin' : ''}`} />
                  <span>Yenile</span>
                </button>
              </div>

              {/* Data Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Kayıtlı Üyeler</span>
                  <span className="font-mono font-bold text-emerald-300 text-sm">{exportStats.membersCount} Üye</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Yetkili Bayiler</span>
                  <span className="font-mono font-bold text-teal-300 text-sm">{exportStats.resellersCount} Bayi</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">E-Faturalar</span>
                  <span className="font-mono font-bold text-purple-300 text-sm">{exportStats.invoicesCount} Fatura</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Komisyonlar &amp; Ağ</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">{exportStats.commissionsCount} Kayıt</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleDownloadFile}
                disabled={!exportJson || isExporting}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>JSON Dosyası Olarak İndir (.json)</span>
              </button>

              <button
                onClick={handleCopyCode}
                disabled={!exportJson || isExporting}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kopyalandı!' : 'JSON Kodunu Kopyala'}</span>
              </button>
            </div>

            {/* Preview of Code */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-500" />
                <span>İndirilecek Veri Paketi Önizlemesi (JSON Kod):</span>
              </span>
              <textarea
                readOnly
                value={exportJson}
                rows={9}
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed outline-none select-all"
              />
            </div>
          </div>
        )}

        {/* TAB 2: VERİ YÜKLE (IMPORT) */}
        {activeTab === 'import' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {importSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span className="font-semibold">{importSuccessMsg}</span>
              </div>
            )}

            {parseError && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{parseError}</span>
              </div>
            )}

            {/* File Upload Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                1. Yöntem: Bilgisayarınızdan JSON Yedek Dosyası Seçin
              </label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
              />
              {importFileName && (
                <div className="text-[11px] text-emerald-400 font-mono">
                  Seçilen Dosya: {importFileName}
                </div>
              )}
            </div>

            {/* Paste JSON Text Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">
                2. Yöntem: Veya JSON Kodunu Doğrudan Buraya Yapıştırın
              </label>
              <textarea
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  validateJson(e.target.value);
                }}
                placeholder="İndirilen sistem yedekleme JSON kodunu buraya yapıştırın..."
                rows={7}
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-[11px] leading-relaxed outline-none focus:border-cyan-500"
              />
            </div>

            {/* Parsed Summary Preview if Valid */}
            {parsedData && (
              <div className="p-4 rounded-2xl bg-cyan-950/50 border border-cyan-500/50 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Yedekleme Veri Paketi Doğrulandı ve Yüklenmeye Hazır</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-cyan-900/50 text-slate-300">
                    <span className="text-[10px] text-slate-400 block">Üyeler:</span>
                    <strong className="text-cyan-300 font-mono">{parsedData.members?.length ?? 0} Adet</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-cyan-900/50 text-slate-300">
                    <span className="text-[10px] text-slate-400 block">Bayiler:</span>
                    <strong className="text-teal-300 font-mono">{parsedData.resellers?.length ?? 0} Adet</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-cyan-900/50 text-slate-300">
                    <span className="text-[10px] text-slate-400 block">Siparişler:</span>
                    <strong className="text-emerald-300 font-mono">{parsedData.dealerOrders?.length ?? 0} Adet</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-cyan-900/50 text-slate-300">
                    <span className="text-[10px] text-slate-400 block">Faturalar:</span>
                    <strong className="text-purple-300 font-mono">{parsedData.digitalInvoices?.length ?? 0} Adet</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleExecuteRestore}
              disabled={!parsedData || isImporting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/60 cursor-pointer disabled:opacity-50"
            >
              {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{isImporting ? 'Veriler Sisteme Yükleniyor...' : 'Verileri Sisteme Yükle ve Geri Yükle'}</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>AuraBio Canlı Veri Yedekleme &amp; Entegrasyon Protokolü</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
