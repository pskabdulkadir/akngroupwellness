import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Sparkles, 
  Zap, 
  Heart, 
  Volume2, 
  ShieldCheck, 
  Compass, 
  CheckCircle2 
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface VoiceIntentionForgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceIntentionForgeModal: React.FC<VoiceIntentionForgeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [intentionText, setIntentionText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlayingFrequency, setIsPlayingFrequency] = useState(false);
  const [forgedFrequency, setForgedFrequency] = useState<number | null>(null);
  const [resonanceAnalysis, setResonanceAnalysis] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartForge = () => {
    if (!intentionText.trim()) return;
    setIsSynthesizing(true);

    setTimeout(() => {
      // Calculate custom harmonic based on intention text character spectrum
      let hash = 0;
      for (let i = 0; i < intentionText.length; i++) {
        hash = (hash << 5) - hash + intentionText.charCodeAt(i);
        hash |= 0;
      }
      const baseFreqs = [396, 417, 432, 528, 639, 741, 852, 963];
      const selectedBase = baseFreqs[Math.abs(hash) % baseFreqs.length];
      const offset = (Math.abs(hash) % 20) * 0.5;
      const customFreq = selectedBase + offset;

      setForgedFrequency(customFreq);
      setResonanceAnalysis(`Niyetinizin harmonik rezonansı: ${selectedBase} Hz Solfeggio ana tonu ile %${88 + (Math.abs(hash) % 11)} uyumlu özel kuantum matrisi oluşturuldu.`);
      setIsSynthesizing(false);
    }, 1200);
  };

  const handleTogglePlay = () => {
    if (isPlayingFrequency) {
      soundEngine.stop();
      setIsPlayingFrequency(false);
    } else if (forgedFrequency) {
      soundEngine.playBinaural(forgedFrequency, 7.83, 0.6);
      setIsPlayingFrequency(true);
    }
  };

  const handleClose = () => {
    if (isPlayingFrequency) {
      soundEngine.stop();
      setIsPlayingFrequency(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Sesli & Niyetli Frekans Labirenti</h2>
              <p className="text-xs text-slate-400">Kendi ses tonunuz ve niyetinizden özel kuantum şifa frekansı sentezleyin</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Kalbinizdeki Niyeti Yazın veya Fısıldayın:
            </label>
            <div className="relative">
              <textarea
                value={intentionText}
                onChange={(e) => setIntentionText(e.target.value)}
                placeholder="Örnek: Kalbimdeki tüm kaygıları sevgiye dönüştürüyorum. Bedenim ilahi şifa ile doluyor..."
                rows={3}
                className="w-full bg-slate-950/60 border border-slate-700/60 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartForge}
              disabled={isSynthesizing || !intentionText.trim()}
              className="flex-1 py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {isSynthesizing ? 'Harmonik Sentezleniyor...' : 'Niyet Frekansını Sentezle'}
            </button>
          </div>

          {forgedFrequency && (
            <div className="mt-6 p-5 bg-slate-950/70 border border-emerald-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-400 font-semibold tracking-wider uppercase">Sentezlenen Frekans:</span>
                  <p className="text-2xl font-black text-white">{forgedFrequency.toFixed(1)} <span className="text-sm font-normal text-slate-400">Hz</span></p>
                </div>
                <button
                  onClick={handleTogglePlay}
                  className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                    isPlayingFrequency
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  {isPlayingFrequency ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlayingFrequency ? 'Durdur' : 'Rezonansı Başlat'}
                </button>
              </div>
              <p className="text-xs text-slate-300 border-t border-slate-800/80 pt-2">{resonanceAnalysis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceIntentionForgeModal;
