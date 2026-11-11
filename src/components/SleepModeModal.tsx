import React, { useState, useEffect, useRef } from 'react';
import { 
  Moon, 
  X, 
  Play, 
  Pause, 
  Volume2, 
  Clock, 
  Sparkles, 
  Waves, 
  CloudRain, 
  Bell, 
  ShieldCheck, 
  EyeOff, 
  Sun,
  Headphones
} from 'lucide-react';
import { NatureSoundLayer, SleepModeConfig } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface SleepModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SleepModeModal: React.FC<SleepModeModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<SleepModeConfig['mode']>('45min_timer');
  const [selectedSoundscape, setSelectedSoundscape] = useState<SleepModeConfig['soundscape']>('delta_deep');
  const [natureSound, setNatureSound] = useState<NatureSoundLayer>('ocean');
  const [deltaHz, setDeltaHz] = useState<number>(1.5);
  const [sleepVolume, setSleepVolume] = useState<number>(0.4);
  const [wakeUpTime, setWakeUpTime] = useState<string>('07:00');
  const [isScreenDimmed, setIsScreenDimmed] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(45);

  const timerRef = useRef<any>(null);

  // Soundscape presets
  const soundscapes = [
    {
      id: 'delta_deep' as const,
      title: 'Derin Delta Tüneli',
      desc: '1.5 Hz Yavaş Dalga Uykusu (NREM) & 432 Hz',
      hz: 1.5,
      nature: 'ocean' as NatureSoundLayer,
      icon: Waves,
      color: 'from-blue-900 to-indigo-950'
    },
    {
      id: 'schumann_night' as const,
      title: 'Schumann Gece Yağmuru',
      desc: '7.83 Hz Biyo-Uyum & Yağmur Damlaları',
      hz: 7.83,
      nature: 'rain' as NatureSoundLayer,
      icon: CloudRain,
      color: 'from-cyan-950 to-slate-950'
    },
    {
      id: 'cosmos_drift' as const,
      title: 'Kozmik Dinginlik',
      desc: '0.8 Hz Ultra-Derin Delta & Tibet Çanakları',
      hz: 0.8,
      nature: 'tibetan_bowls' as NatureSoundLayer,
      icon: Sparkles,
      color: 'from-purple-950 to-slate-950'
    },
    {
      id: 'rain_forest' as const,
      title: 'Gece Ormanı & Kamp Ateşi',
      desc: '2.5 Hz Delta & Hafif Gece Çıtırtısı',
      hz: 2.5,
      nature: 'campfire' as NatureSoundLayer,
      icon: Moon,
      color: 'from-amber-950 to-stone-950'
    }
  ];

  const handleSelectSoundscape = (s: typeof soundscapes[0]) => {
    setSelectedSoundscape(s.id);
    setDeltaHz(s.hz);
    setNatureSound(s.nature);

    if (isPlaying) {
      soundEngine.startSleepSoundscape(s.hz, s.nature, sleepVolume);
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      await soundEngine.unlockAudio();
      await soundEngine.startSleepSoundscape(deltaHz, natureSound, sleepVolume);
      setIsPlaying(true);
      setElapsedSeconds(0);
    }
  };

  // Timer & Alarm monitoring loop
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;

        if (mode === '45min_timer') {
          const totalSecs = 45 * 60;
          const left = Math.max(0, Math.ceil((totalSecs - next) / 60));
          setRemainingMinutes(left);

          // Smooth fade out in the last 3 minutes
          if (next >= totalSecs - 180 && next < totalSecs) {
            const ratio = (totalSecs - next) / 180;
            soundEngine.setVolume(sleepVolume * ratio);
          }

          if (next >= totalSecs) {
            soundEngine.stop();
            setIsPlaying(false);
            clearInterval(timerRef.current);
          }
        } else if (mode === 'alarm_wake') {
          // Check if current time matches alarm
          const now = new Date();
          const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          if (currentHourMin === wakeUpTime && next % 60 === 0) {
            // Alarm trigger: transition to 528Hz Alpha wake tone
            soundEngine.transitionFrequencySmooth(528, 10.0, 10.0);
            soundEngine.setVolume(0.7);
          }
        }

        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, mode, sleepVolume, wakeUpTime]);

  const handleVolume = (vol: number) => {
    setSleepVolume(vol);
    if (isPlaying) {
      soundEngine.setVolume(vol);
    }
  };

  const handleClose = () => {
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      {/* Dimmed Screen Overlay for night sleep */}
      {isScreenDimmed ? (
        <div 
          onClick={() => setIsScreenDimmed(false)}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
        >
          <div className="w-16 h-16 rounded-full bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 animate-pulse">
            <Moon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-300">Gece Uyku Tüneli Aktif</h2>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            {mode === '45min_timer' ? `${remainingMinutes} dakika kaldı` : 'Sabaha kadar kesintisiz akış'}
          </p>
          <p className="text-[11px] text-slate-600 mt-8">
            Ekranı uyandırmak için herhangi bir yere dokunun
          </p>
        </div>
      ) : (
        <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/80 my-8">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-850">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Bio-Sync Sleep Soundscape</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Gece Uyku Modu
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Sirkadiyen biyolojik saat uyumlu Delta (0.5 - 4 Hz) ve 432 Hz uyku tüneli
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[
              { id: '45min_timer' as const, label: '45 Dk. Otomatik Kapan', icon: Clock },
              { id: 'continuous_night' as const, label: 'Sabaha Kadar (Sürekli)', icon: Moon },
              { id: 'alarm_wake' as const, label: 'Yumuşak Uyanma Alarmı', icon: Bell },
            ].map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex flex-col items-center text-center p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-md shadow-indigo-950'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-indigo-300' : 'text-slate-400'}`} />
                  <span className="leading-tight">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* If Alarm Mode: Show time picker */}
          {mode === 'alarm_wake' && (
            <div className="mt-4 p-3 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-indigo-300">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Sabah Yumuşak Uyanış Saati:</span>
              </div>
              <input
                type="time"
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-indigo-200 text-xs rounded-xl px-3 py-1 font-mono font-bold outline-none focus:border-indigo-400"
              />
            </div>
          )}

          {/* Soundscape Card List */}
          <div className="mt-6 flex flex-col gap-2.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Uyku Ses Akışı (Delta & Schumann)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {soundscapes.map((s) => {
                const Icon = s.icon;
                const isSelected = selectedSoundscape === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSoundscape(s)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/30 border-indigo-400 shadow-lg shadow-indigo-950/60'
                        : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-850/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-200">{s.title}</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                        {s.hz} Hz
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volume and Dim Screen Controls */}
          <div className="mt-6 pt-4 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Sleep Volume Slider */}
            <div className="flex items-center gap-3 w-full sm:w-56">
              <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex flex-col w-full">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Ses Şiddeti</span>
                  <span className="font-mono font-bold text-slate-300">%{Math.round(sleepVolume * 100)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={sleepVolume}
                  onChange={(e) => handleVolume(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {isPlaying && (
                <button
                  onClick={() => setIsScreenDimmed(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
                  title="Ekranı Karart"
                >
                  <EyeOff className="w-4 h-4 text-indigo-400" />
                  <span>Karanlık Mod</span>
                </button>
              )}

              <button
                onClick={togglePlayback}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-xs shadow-xl transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-rose-900/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/80'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-950/60'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Uyku Akışını Durdur</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Uykuyu Başlat</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default SleepModeModal;

