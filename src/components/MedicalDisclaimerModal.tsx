import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Stethoscope, 
  HeartHandshake, 
  Lock,
  X
} from 'lucide-react';

interface MedicalDisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const MedicalDisclaimerModal: React.FC<MedicalDisclaimerModalProps> = ({
  isOpen,
  onAccept,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/80 space-y-6 animate-scale-up">
        
        <button
          type="button"
          onClick={onAccept}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center border border-slate-700/80 transition-colors shadow-md cursor-pointer"
          title="Kabul Et & Kapat"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Warning Icon Badge */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 via-amber-500/20 to-orange-500/20 border-2 border-rose-500/50 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-950/60 animate-bounce-subtle">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-extrabold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Yasal Zorunlu Bilgilendirme</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-2">
              Önemli Sağlık Uyarısı
            </h2>
            <p className="text-xs text-rose-300/90 font-semibold tracking-wide mt-0.5">
              Tıbbi Sorumluluk Reddi (Medical Disclaimer)
            </p>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-rose-500/30 space-y-3.5 text-slate-300 text-xs sm:text-sm leading-relaxed shadow-inner">
          <div className="flex items-start gap-3">
            <Stethoscope className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="font-medium text-slate-200">
              Bu sistem bir <strong className="text-rose-300 font-bold underline">tıbbi cihaz veya tedavi yöntemi değildir</strong>; yalnızca biyo-frekans analizi ve kişisel gelişim/enerji dengeleme amaçlı dijital bir yazılımdır.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Bu sistem <strong className="text-amber-300 font-bold">hastalıkları tedavi etmez</strong>. Herhangi bir sağlık sorununuz, rahatsızlığınız veya tıbbi durumunuz varsa lütfen derhal alanında uzman bir <strong className="text-slate-100 font-bold">doktorunuza veya sağlık kuruluşuna başvurun</strong>.
            </p>
          </div>
        </div>

        {/* Legal Acknowledgment Notice */}
        <p className="text-[11px] text-slate-400 text-center px-2">
          Uygulamaya erişebilmek ve analizleri görüntüleyebilmek için bu yasal bilgilendirmeyi okuyup onaylamanız zorunludur.
        </p>

        {/* Mandatory Accept Button */}
        <div>
          <button
            type="button"
            onClick={onAccept}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/70 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>Okudum, Anladım ve Kabul Ediyorum [Tamam]</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default MedicalDisclaimerModal;

