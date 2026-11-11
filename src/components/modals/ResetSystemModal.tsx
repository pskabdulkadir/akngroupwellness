import React, { useState } from 'react';
import {
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Database,
  ArrowRight,
  X,
} from 'lucide-react';
import { SpeechEngine } from '../../services/voiceAssistant';

interface ResetSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToClean: () => void;
  onRestoreDemo: () => void;
  invoicesCount: number;
  commissionsCount: number;
  totalGrossRevenueTRY: number;
}

export const ResetSystemModal: React.FC<ResetSystemModalProps> = ({
  isOpen,
  onClose,
  onResetToClean,
  onRestoreDemo,
  invoicesCount,
  commissionsCount,
  totalGrossRevenueTRY,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeAction, setActiveAction] = useState<'clean' | 'demo' | null>(null);

  if (!isOpen) return null;

  const handleExecuteCleanReset = () => {
    if (!confirmed) return;
    setResetting(true);
    setActiveAction('clean');

    setTimeout(() => {
      onResetToClean();
      setResetting(false);
      SpeechEngine.speak(
        'AKN Global Group Ltd. muhasebe altyapısı başarıyla sıfırlandı. Tüm sahte veriler silindi, sistem canlıya yüzde yüz hazır olarak sıfır TL bakiye ile açıldı.'
      );
      onClose();
    }, 700);
  };

  const handleExecuteRestoreDemo = () => {
    setResetting(true);
    setActiveAction('demo');

    setTimeout(() => {
      onRestoreDemo();
      setResetting(false);
      SpeechEngine.speak(
        'Örnek simülasyon ve test verileri başarıyla sisteme geri yüklendi.'
      );
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold block">
                SİSTEM &amp; VERİTABANI YÖNETİMİ
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Sistemi Sıfırla &amp; Sahte Verileri Temizle
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Active Data Overview Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Şu An Sistemde Bulunan Veriler:</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {invoicesCount} Adet Fatura · {commissionsCount} Bayi Hakedişi
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Kayıtlı Ciro:</span>
              <p className="font-bold font-mono text-slate-900 mt-0.5">
                {totalGrossRevenueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </p>
            </div>
          </div>

          {/* Action 1: Full Clean Reset (Production Ready 0 Balance) */}
          <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50/50 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-950">
                  Tüm Sahte ve Simülasyon Verilerini Temizle (Canlıya Hazır 0 Modu)
                </h3>
                <p className="text-xs text-red-800/80 leading-relaxed mt-1">
                  Tüm simülasyon faturalarını, bayi komisyonlarını, clawback/iade kayıtlarını, stok
                  ve banka hareketlerini sıfırlar. Cironuz <strong>0,00 ₺</strong> olur ve şirket
                  resmî unvanı ile vergi dairesi ayarlarınız korunarak sistem sıfırdan canlı satışa
                  başlar.
                </p>
              </div>
            </div>

            {/* Checkbox confirmation */}
            <label className="flex items-center gap-2.5 pt-2 border-t border-red-200 text-xs text-red-900 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-red-300"
              />
              <span>Tüm test kayıtlarının temizlenmesini ve bilançonun 0 ₺ olmasını onaylıyorum.</span>
            </label>

            <button
              onClick={handleExecuteCleanReset}
              disabled={!confirmed || resetting}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                confirmed && !resetting
                  ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                  : 'bg-red-200 text-red-400 cursor-not-allowed'
              }`}
            >
              <RotateCcw className={`w-4 h-4 ${resetting && activeAction === 'clean' ? 'animate-spin' : ''}`} />
              <span>
                {resetting && activeAction === 'clean'
                  ? 'Sistem Sıfırlanıyor...'
                  : 'Tüm Verileri Temizle ve Sistemi Sıfırla (0 TL)'}
              </span>
            </button>
          </div>

          {/* Action 2: Restore Demo Data (Optional for presentations) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-800">
                  Örnek Simülasyon Verilerini Yeniden Yükle
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Demo &amp; Test
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Sistemi yöneticilere veya mali müşavire sunmak istediğinizde, hazır örnek faturaları
              ve 498 $ hizmet ihracatı senaryolarını tek tıkla geri getirebilirsiniz.
            </p>
            <button
              onClick={handleExecuteRestoreDemo}
              disabled={resetting}
              className="mt-2 w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>Örnek Demo Verilerini Yükle</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            AKN Global Group Ltd. Vergi &amp; Finans Altyapısı
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
