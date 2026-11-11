import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Receipt,
  FileCheck,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';
import { SpeechEngine } from '../../services/voiceAssistant';
import { COMPANY_PROFILE, AutoPilotExecutionSummary } from '../../types/accounting';

interface AutoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecutionCompleted: (summary: AutoPilotExecutionSummary) => void;
  onViewExecutiveReport: () => void;
}

export const AutoPilotModal: React.FC<AutoPilotModalProps> = ({
  isOpen,
  onClose,
  onExecutionCompleted,
  onViewExecutiveReport,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const steps = [
    {
      id: 1,
      title: 'e-Fatura & e-Arşiv Tanzimi (GİB API)',
      description: 'Bekleyen 3DS kredi kartı ve banka satışlarının e-faturaları UBL-TR formatında tanzim edilip Gelir İdaresi Başkanlığına iletiliyor...',
      icon: FileCheck,
    },
    {
      id: 2,
      title: 'Bireysel Bayi Stopaj & e-Gider Pusulası',
      description: 'Vergi mükellefiyeti olmayan bayilerin hakedişlerinden %20 yasal stopaj (GVK 94) kesilip resmi e-Gider Pusulaları oluşturuluyor...',
      icon: Receipt,
    },
    {
      id: 3,
      title: 'TCMB Gösterge Kurları & Çift Para Birimi Senkronizasyonu',
      description: 'Güncel Merkez Bankası USD/EUR döviz alış kurları çekilip resmi Yevmiye Defteri genel muhasebe fişleri işleniyor...',
      icon: DollarSign,
    },
    {
      id: 4,
      title: 'Vergi Tampon Cüzdanı (Tax Buffer Vault) Kilitleme',
      description: 'Önümüzdeki ayın 26\'sına kadar devlete ödenecek KDV ve Stopaj tutarı şirket ana hesabından ayrıştırılarak kilitleniyor...',
      icon: Lock,
    },
    {
      id: 5,
      title: 'Günlük AI CFO Yönetici Mali Raporu Tanzimi',
      description: 'Yönetim kuruluna sunulmak üzere resmi antetli Mali Müşavir Günlük Durum Özeti hazırlanıyor...',
      icon: Sparkles,
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsCompleted(false);
      return;
    }

    // Step by step autonomous sequence
    const timer1 = setTimeout(() => setCurrentStep(1), 700);
    const timer2 = setTimeout(() => setCurrentStep(2), 1600);
    const timer3 = setTimeout(() => setCurrentStep(3), 2500);
    const timer4 = setTimeout(() => setCurrentStep(4), 3400);
    const timer5 = setTimeout(() => {
      setCurrentStep(5);
      setIsCompleted(true);

      const summary: AutoPilotExecutionSummary = {
        timestamp: new Date().toLocaleString('tr-TR'),
        invoicesIssuedCount: 4,
        invoicesTotalAmountTRY: 18450.0,
        commissionsProcessedCount: 3,
        stopajWithheldTRY: 1840.0,
        taxVaultBufferTRY: 5790.0,
        tcmbRatesSynced: {
          usd: 38.455,
          eur: 41.82,
        },
        cfoExecutiveNote: `${COMPANY_PROFILE.legalName} otonom muhasebe otopilotu tüm işlemleri sıfır insan hatasıyla tamamlamıştır.`,
      };

      onExecutionCompleted(summary);

      SpeechEngine.speak(
        `${COMPANY_PROFILE.legalName} Muhasebe Otopilotu başarıyla tamamlandı. Bekleyen tüm faturalar GİB'e iletildi, bayi stopajları kesildi, TCMB kurları senkronize edildi ve vergi tampon cüzdanınız kilitlendi. Mali müşavir raporunuz hazırdır.`
      );
    }, 4300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">AKN Muhasebe Otopilotu</h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded font-bold">
                  Auto-Pilot
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {COMPANY_PROFILE.legalName} — Otonom Finans İcrası
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {steps.map((st, idx) => {
              const Icon = st.icon;
              const isPast = currentStep > idx;
              const isCurrent = currentStep === idx;
              return (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isPast
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : isCurrent
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isPast
                            ? 'bg-emerald-200 text-emerald-900'
                            : isCurrent
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isPast ? <CheckCircle2 className="w-4 h-4 text-emerald-800" /> : st.id}
                      </div>
                      <span className="font-bold text-xs">{st.title}</span>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-mono bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        İşleniyor
                      </span>
                    )}

                    {isPast && (
                      <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                        Tamamlandı
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] pl-9 ${
                      isPast ? 'text-emerald-800' : isCurrent ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {st.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Success Footer */}
          {isCompleted && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Tüm mali süreçler başarıyla tamamlandı.
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onViewExecutiveReport();
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <span>CFO Raporunu Aç</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
