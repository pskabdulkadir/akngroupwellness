import React from 'react';
import { 
  X, 
  Sparkles, 
  Droplet, 
  Zap, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react';

interface DemoProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DemoProtocolModal: React.FC<DemoProtocolModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-amber-950/70 space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Frekans Kalibrasyon & Hazırlık Protokolü</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center justify-center gap-2">
            <span>Demo Öncesi Biyo-Frekans ve İletkenlik Kalibrasyon Uyarısı</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            30 dakikalık biyo-rezonans demo seansına başlamadan önce hücresel rezonans doğruluğu için aşağıdaki adımları tamamlayınız.
          </p>
        </div>

        {/* Warning & Instructions Card */}
        <div className="space-y-3.5">
          
          {/* Item 1: Tuz Pratiği */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 to-slate-950/80 border border-amber-500/40 space-y-1.5 shadow-md">
            <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <span>Sodyum Klorür (Tuz) Pratiği</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-10.5">
              Vücudun elektriksel iletkenliğini ve biyo-rezonans hassasiyetini artırmak için çok az miktarda saf tuz (sodyum klorür) tadılması tavsiye edilir.
            </p>
          </div>

          {/* Item 2: Su İçme Zorunluluğu */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 to-slate-950/80 border border-cyan-500/40 space-y-1.5 shadow-md">
            <div className="flex items-center gap-2.5 text-cyan-300 font-bold text-sm">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <Droplet className="w-4 h-4 text-cyan-400" />
              </div>
              <span>Su İçme Zorunluluğu</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-10.5">
              Frekans dalgalarının hücre içi sıvılarda etkin iletimi ve detoks etkisi için seans öncesinde <strong className="text-cyan-200">bir bardak su içilmesi zorunludur</strong>.
            </p>
          </div>

          {/* Item 3: Faydaları */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-slate-950/80 border border-emerald-500/40 space-y-1.5 shadow-md">
            <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <span>Biyo-Fiziksel Faydaları</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-10.5">
              Su ve mineral dengesi, hücresel iletkenliği optimize eder, elektromanyetik frekansların tarama doğruluğunu artırır ve bedensel direnci dengeler.
            </p>
          </div>

        </div>

        {/* Notice Badge */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Butona basıldığı an <strong>30 dakikalık canlı demo süresi</strong> başlayacaktır. Süre dolduğunda sistem otomatik kilitlenecektir.
          </span>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-amber-950/60 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
          >
            <CheckCircle2 className="w-5 h-5 fill-current" />
            <span>
              {isLoading ? 'Demo Başlatılıyor...' : 'Suyu İçtim ve Tuz Tattım, Demoyu Başlat'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
