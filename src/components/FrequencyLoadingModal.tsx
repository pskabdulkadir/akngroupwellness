import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Radio, 
  CheckCircle2, 
  Flame, 
  Compass, 
  Layers, 
  Waves,
  ShieldCheck,
  Pause,
  Play,
  StopCircle,
  Clock
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { EsmaItem, AyetItem, EasternMantraItem, MythologicalElementItem } from '../types';
import { HealingItem } from '../data/healingLibrary';

export interface TreatmentSelection {
  name: string;
  type: 'esma' | 'ayet' | 'mantra' | 'element' | 'healing' | 'letaif' | 'frequency' | string;
  frequencyHz: number;
  details?: EsmaItem | AyetItem | EasternMantraItem | MythologicalElementItem | HealingItem | any;
  targetLetaif?: string;
  durationSeconds?: number;
  description?: string;
  benefits?: string;
  [key: string]: any;
}

interface FrequencyLoadingModalProps {
  selection: TreatmentSelection;
  onClose: () => void;
  onCompleteTreatment: () => void;
}

export const FrequencyLoadingModal: React.FC<FrequencyLoadingModalProps> = ({
  selection,
  onClose,
  onCompleteTreatment,
}) => {
  const [sessionDuration, setSessionDuration] = useState<number>(30); // seconds
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<any>(null);
  const endTimeRef = useRef<number>(Date.now() + 30000);
  const remainingMsRef = useRef<number>(30000);
  const isFinishedRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onCompleteTreatment);

  useEffect(() => {
    onCompleteRef.current = onCompleteTreatment;
  }, [onCompleteTreatment]);

  // Clean stop on unmount or frequency change
  useEffect(() => {
    endTimeRef.current = Date.now() + 30000;
    remainingMsRef.current = 30000;
    isFinishedRef.current = false;
    setIsRunning(false);

    return () => {
      soundEngine.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selection?.frequencyHz]);

  // High-precision Wall-Clock Countdown: Zero drift, zero lag, zero stutter
  useEffect(() => {
    if (isRunning && !isFinished) {
      endTimeRef.current = Date.now() + remainingMsRef.current;

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remMs = Math.max(0, endTimeRef.current - now);
        remainingMsRef.current = remMs;
        const currentSec = Math.max(0, Math.ceil(remMs / 1000));

        setTimeLeft(currentSec);

        if (remMs <= 0 && !isFinishedRef.current) {
          isFinishedRef.current = true;
          clearInterval(timerRef.current);
          soundEngine.stop();
          setIsRunning(false);
          setIsFinished(true);

          setTimeout(() => {
            onCompleteRef.current();
          }, 300);
        }
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isFinished]);

  // Handle Pause / Resume
  const handleTogglePause = () => {
    if (isRunning) {
      // Pause
      soundEngine.stop();
      remainingMsRef.current = Math.max(0, endTimeRef.current - Date.now());
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      // Resume
      if (remainingMsRef.current > 0 && !isFinished) {
        endTimeRef.current = Date.now() + remainingMsRef.current;
        if (!isMuted) {
          soundEngine.playFrequency(selection?.frequencyHz || 528, 0.45);
        }
        setIsRunning(true);
      }
    }
  };

  // Handle Cancel & Close completely
  const handleCancelSession = () => {
    soundEngine.stop();
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (isMuted) {
      if (isRunning && remainingMsRef.current > 0) {
        soundEngine.playFrequency(selection?.frequencyHz || 528, 0.45);
      }
      setIsMuted(false);
    } else {
      soundEngine.stop();
      setIsMuted(true);
    }
  };

  // Quick duration adjustment (when not running)
  const handleChangeDuration = (newSecs: number) => {
    soundEngine.stop();
    setIsRunning(false);
    setSessionDuration(newSecs);
    setTimeLeft(newSecs);
    remainingMsRef.current = newSecs * 1000;
    endTimeRef.current = Date.now() + remainingMsRef.current;
    setIsFinished(false);
    isFinishedRef.current = false;
  };

  // Canvas visual harmonic wave generator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (isRunning && timeLeft > 0) {
        const centerY = h / 2;
        const speed = 0.06;
        phase += speed;

        // Draw multiple sine wave resonance curves
        const waveCount = 4;
        for (let i = 0; i < waveCount; i++) {
          ctx.beginPath();
          ctx.lineWidth = i === 0 ? 3 : 1.5;
          
          if (selection.type === 'esma') {
            ctx.strokeStyle = `rgba(52, 211, 153, ${0.8 - i * 0.18})`; // Emerald
          } else if (selection.type === 'ayet') {
            ctx.strokeStyle = `rgba(45, 212, 191, ${0.8 - i * 0.18})`; // Teal
          } else if (selection.type === 'mantra') {
            ctx.strokeStyle = `rgba(251, 146, 60, ${0.8 - i * 0.18})`; // Orange
          } else {
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.8 - i * 0.18})`; // Sky cyan
          }

          const freqFactor = (((selection?.frequencyHz || 528) % 200) + 40) / 70;
          const amp = (h / 3.5) * (1 - i * 0.2);

          for (let x = 0; x < w; x += 4) {
            const y = centerY + Math.sin(x * 0.02 * freqFactor + phase + i * 0.7) * amp * Math.sin(x / w * Math.PI);
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      } else {
        // Flat baseline when stopped or duration finished
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)';
        ctx.lineWidth = 1;
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRunning, timeLeft, selection]);

  const progressPercent = Math.min(100, Math.max(0, ((sessionDuration - timeLeft) / sessionDuration) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/80 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={handleCancelSession}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Frekans Yüklemeyi Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/60 shrink-0">
            {selection.type === 'esma' ? (
              <Radio className="w-6 h-6 animate-pulse text-emerald-400" />
            ) : selection.type === 'ayet' ? (
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            ) : selection.type === 'mantra' ? (
              <Compass className="w-6 h-6 text-orange-400" />
            ) : (
              <Flame className="w-6 h-6 text-cyan-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {selection.type === 'esma' ? 'Esmaü’l Hüsna' : selection.type === 'ayet' ? 'Şifa Ayeti' : selection.type === 'mantra' ? 'Çakra Mantrası' : 'Element'}
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {selection?.frequencyHz || 528} Hz
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 mt-0.5">
              {selection.name}
            </h2>
          </div>
        </div>

        {/* Oscilloscope Wave Visualizer */}
        <div className="relative rounded-2xl bg-slate-950/90 border border-slate-800 p-3 overflow-hidden shadow-inner">
          <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
            <Waves className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>{isRunning && timeLeft > 0 ? 'Frekans Aktarımı Devam Ediyor...' : 'Frekans Tamamlandı / Durduruldu'}</span>
          </div>

          <canvas
            ref={canvasRef}
            width={500}
            height={130}
            className="w-full h-28 sm:h-32 block"
          />

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Timer & Controls Display */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono text-base font-bold text-emerald-400">
              {timeLeft}s
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">
                {timeLeft > 0 ? 'Kalan Yükleme Süresi' : 'Süre Doldu (Frekans Kapandı)'}
              </div>
              <div className="text-[11px] text-slate-400">
                {timeLeft > 0 ? 'Süre bitiminde ses ve dalga otomatik kapanır' : 'Karşılaştırmalı rapor hazırlanıyor...'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className={`p-2.5 rounded-xl border transition-all ${
                isMuted 
                  ? 'bg-slate-800 text-slate-400 border-slate-700' 
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
              }`}
              title={isMuted ? 'Sesi Aç' : 'Sesi Sustur'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleTogglePause}
              disabled={timeLeft === 0}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                isRunning 
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-600/50' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Duraklat</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{timeLeft === sessionDuration ? 'Yüklemeyi Başlat' : 'Devam Et'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Details Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 text-slate-300">
          {'meaning' in selection.details && (
            <div>
              <span className="text-emerald-400 font-semibold">Anlam / Tesir: </span>
              <span>{(selection.details as any).meaning}</span>
            </div>
          )}
          {'transcription' in selection.details && (
            <div>
              <span className="text-teal-400 font-semibold">Okunuş: </span>
              <span className="italic">{(selection.details as any).transcription}</span>
            </div>
          )}
          {'targetChakra' in selection.details && (
            <div>
              <span className="text-orange-400 font-semibold">Hedef Merkez: </span>
              <span>{(selection.details as any).targetChakra}</span>
            </div>
          )}
        </div>

        {/* Quick Duration Preset Selector */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Süre Seçimi:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {[15, 30, 60].map((s) => (
              <button
                key={s}
                onClick={() => handleChangeDuration(s)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all ${
                  sessionDuration === s 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
