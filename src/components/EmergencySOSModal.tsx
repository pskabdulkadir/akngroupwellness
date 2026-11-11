import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  X, 
  Heart, 
  ShieldCheck, 
  Volume2, 
  Sparkles, 
  RotateCcw,
  CheckCircle2,
  Sliders,
  Play,
  Pause,
  Layers,
  Activity,
  Wind,
  Clock,
  Compass,
  Radio,
  Flame,
  Zap,
  Info
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import voiceAssistant from '../utils/voiceAssistant';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface EmergencyFrequencyPreset {
  id: string;
  carrierHz: number;
  binauralHz: number;
  brainwave: 'delta' | 'theta' | 'alpha';
  name: string;
  subtitle: string;
  tag: string;
  category: 'panic' | 'pain' | 'emotional' | 'mind' | 'cellular';
  color: string;
  borderActive: string;
  bgActive: string;
  description: string;
  guidance: string;
}

export const EMERGENCY_PRESETS: EmergencyFrequencyPreset[] = [
  {
    id: 'sos_432',
    carrierHz: 432,
    binauralHz: 6.0,
    brainwave: 'theta',
    name: '432 Hz Kalp Koheransı & Derin Yatışma',
    subtitle: 'Anksiyete, Çarpıntı & Anlık Panik Dindirici',
    tag: 'En Çok Tercih Edilen',
    category: 'panic',
    color: 'text-rose-400',
    borderActive: 'border-rose-500 shadow-rose-500/30',
    bgActive: 'bg-rose-950/50',
    description: 'Doğal evrensel akort frekansı; sempatik sinir sistemini yatıştırır ve vagus sinirini uyararak nabzı dengeler.',
    guidance: 'Derin nefes alın... Bedeniniz güvende, kalp atışlarınız 432 Hz ile doğal ritmine kavuşuyor.'
  },
  {
    id: 'sos_528',
    carrierHz: 528,
    binauralHz: 8.0,
    brainwave: 'alpha',
    name: '528 Hz Mucize Rezonans & Hücresel Güç',
    subtitle: 'Hücresel Onarım, Sevgi & Enerji Dengeleme',
    tag: 'Solfeggio Mucizesi',
    category: 'cellular',
    color: 'text-emerald-400',
    borderActive: 'border-emerald-500 shadow-emerald-500/30',
    bgActive: 'bg-emerald-950/50',
    description: 'Biyofiziksel doku onarımı ve derin içsel denge frekansı. Hücre zarlarını stabilize ederek stres hormonlarını baskılar.',
    guidance: 'Hücrelerinizin sevgi ve yenilenme enerjisiyle dolduğunu hissedin. Güç ve şifa sizinle.'
  },
  {
    id: 'sos_396',
    carrierHz: 396,
    binauralHz: 5.5,
    brainwave: 'theta',
    name: '396 Hz Korku & Suçluluk Blokaj Çözücü',
    subtitle: 'Kök Çakra Acil Topraklanma & Güven',
    tag: 'Korku Giderici',
    category: 'panic',
    color: 'text-amber-400',
    borderActive: 'border-amber-500 shadow-amber-500/30',
    bgActive: 'bg-amber-950/50',
    description: 'Bilinçaltındaki ani dehşet, suçluluk ve panik dalgalarını topraklayarak kök çakra güven alanını yeniden kurar.',
    guidance: 'Korkularınız eriyip gidiyor. Ayaklarınızın altındaki güçlü topraklanmayı ve güven hissini içinize çekin.'
  },
  {
    id: 'sos_639',
    carrierHz: 639,
    binauralHz: 10.0,
    brainwave: 'alpha',
    name: '639 Hz Kalp Çakrası & Travma Yatıştırma',
    subtitle: 'Duygusal Kriz, Kırgınlık & İçsel Şefkat',
    tag: 'Duygusal İlk Yardım',
    category: 'emotional',
    color: 'text-pink-400',
    borderActive: 'border-pink-500 shadow-pink-500/30',
    bgActive: 'bg-pink-950/50',
    description: 'Duygusal şok, keder ve ilişki krizlerinde kalp merkezini sararak derin bir şefkat ve kabulleniş alanı açar.',
    guidance: 'Elinizi kalbinizin üzerine koyun. Kalbinizdeki ağırlık yumuşayarak huzurlu bir akışa dönüşüyor.'
  },
  {
    id: 'sos_741',
    carrierHz: 741,
    binauralHz: 9.5,
    brainwave: 'alpha',
    name: '741 Hz Zihinsel Detoks & Bunalım Temizliği',
    subtitle: 'Aşırı Düşünme, Beyin Sisi & Zihin Berraklığı',
    tag: 'Zihin Temizleyici',
    category: 'mind',
    color: 'text-cyan-400',
    borderActive: 'border-cyan-500 shadow-cyan-500/30',
    bgActive: 'bg-cyan-950/50',
    description: 'Zihinsel geviş getirme (rumination) ve bunaltıcı düşünce fırtınalarını nötralize ederek zihinsel netlik sağlar.',
    guidance: 'Zihninizdeki düşünce bulutları dağılıyor. Berrak ve sessiz bir gökyüzü gibi dinginleşiyorsunuz.'
  },
  {
    id: 'sos_174',
    carrierHz: 174,
    binauralHz: 2.5,
    brainwave: 'delta',
    name: '174 Hz Doğal Ağrı & Spazm Giderici',
    subtitle: 'Fiziksel Kasılma, Migren & Beden Gerginliği',
    tag: 'Ağrı Dindirici',
    category: 'pain',
    color: 'text-indigo-400',
    borderActive: 'border-indigo-500 shadow-indigo-500/30',
    bgActive: 'bg-indigo-950/50',
    description: 'Doğal bir biyo-anestezik gibi çalışır; omuz, boyun, baş ve karın bölgesindeki kas kilitlenmelerini çözer.',
    guidance: 'Bedeninizdeki tüm kaslar gevşiyor... Ağrı ve gerginlik nefesinizle birlikte bedeninizi terk ediyor.'
  },
  {
    id: 'sos_schumann',
    carrierHz: 432,
    binauralHz: 7.83,
    brainwave: 'theta',
    name: '7.83 Hz Schumann + 432 Hz Manyetik Denge',
    subtitle: 'Dünya Kalp Atışı & Biyo-Ritim Senkronizasyonu',
    tag: 'Tam Topraklanma',
    category: 'cellular',
    color: 'text-teal-400',
    borderActive: 'border-teal-500 shadow-teal-500/30',
    bgActive: 'bg-teal-950/50',
    description: 'Yerkürenin iyonosferik rezonansı; elektromanyetik stres, şok ve aşırı uyarılmış sinir sistemini dengeler.',
    guidance: 'Dünyanın doğal ritmiyle birsiniz. Bütün bedeniniz manyetik olarak hizalanıyor ve dinginleşiyor.'
  },
  {
    id: 'sos_852',
    carrierHz: 852,
    binauralHz: 6.5,
    brainwave: 'theta',
    name: '852 Hz Sezgisel Dinginlik & Ruhsal Ferahlık',
    subtitle: 'Ruhsal Daralma, Huzursuzluk & Yüksek Bilinç',
    tag: 'Ruhsal Ferahlık',
    category: 'mind',
    color: 'text-violet-400',
    borderActive: 'border-violet-500 shadow-violet-500/30',
    bgActive: 'bg-violet-950/50',
    description: 'Ruhsal bunalma hissini aşındırarak üçüncü göz ve yüksek bilinçte berrak bir ferahlık meydana getirir.',
    guidance: 'İçinizdeki sonsuz huzur pınarına bağlanın. Her şey olması gerektiği gibi dengede.'
  },
  {
    id: 'sos_963',
    carrierHz: 963,
    binauralHz: 7.0,
    brainwave: 'theta',
    name: '963 Hz Taç Çakra & Saf Bilinç Huzuru',
    subtitle: 'Aşkın Dinginlik, Tam Teslimiyet & Kozmik Birlik',
    tag: 'Taç Çakra Şifası',
    category: 'mind',
    color: 'text-purple-400',
    borderActive: 'border-purple-500 shadow-purple-500/30',
    bgActive: 'bg-purple-950/50',
    description: 'Taç çakrayı aktive eder; varoluşsal anksiyete, yalnızlık ve panik hissini yerini evrensel birliğe bırakır.',
    guidance: 'Sonsuz ışık ve koruma altındasınız. Zihniniz ve ruhunuz saf bir sükunetle yıkanıyor.'
  }
];

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ isOpen, onClose }) => {
  const [selectedPreset, setSelectedPreset] = useState<EmergencyFrequencyPreset>(EMERGENCY_PRESETS[0]);
  const [durationOption, setDurationOption] = useState<number>(60); // 60, 120, 300, -1 (infinite)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.75);
  const [enableHarmonics, setEnableHarmonics] = useState<boolean>(true);
  const [breathingPattern, setBreathingPattern] = useState<'4-4-6' | '4-7-8' | '4-4-4-4'>('4-4-6');
  const [breathPhase, setBreathPhase] = useState<string>('Nefes Al (Genişle)');
  const [breathScale, setBreathScale] = useState<number>(1.0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [spokenGuidance, setSpokenGuidance] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const breathTimerRef = useRef<any>(null);

  // Play sound function with currently selected parameters
  const playActiveSound = (preset = selectedPreset, vol = volume, harmonics = enableHarmonics) => {
    soundEngine.unlockAudio();
    soundEngine.startEmergencyCalmFrequency(
      preset.carrierHz,
      preset.binauralHz,
      vol,
      harmonics
    );
    setIsPlaying(true);
  };

  // Start SOS Session immediately upon open or preset change
  useEffect(() => {
    if (!isOpen) {
      soundEngine.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      return;
    }

    setIsCompleted(false);
    setSecondsRemaining(durationOption === -1 ? 9999 : durationOption);
    setBreathPhase('Nefes Al (Genişle)');
    setBreathScale(1.0);

    // Start powerful harmonic frequency immediately
    playActiveSound(selectedPreset, volume, enableHarmonics);

    // Optional short reassurance voice
    if (spokenGuidance) {
      voiceAssistant.unlockMobileSpeech();
      voiceAssistant.speak(selectedPreset.guidance, true);
    }

    // Countdown Timer Loop
    if (timerRef.current) clearInterval(timerRef.current);
    if (durationOption !== -1) {
      let left = durationOption;
      timerRef.current = setInterval(() => {
        left -= 1;
        setSecondsRemaining(left);

        if (left <= 0) {
          clearInterval(timerRef.current);
          if (breathTimerRef.current) clearInterval(breathTimerRef.current);
          setIsCompleted(true);
          soundEngine.stop();
          soundEngine.playCompletionChimeSequence();
        }
      }, 1000);
    }

    // Dynamic Breathing Loop based on selected pattern
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    let cycleSec = 0;
    const totalCycle = breathingPattern === '4-7-8' ? 19 : (breathingPattern === '4-4-4-4' ? 16 : 14);

    breathTimerRef.current = setInterval(() => {
      cycleSec = (cycleSec + 1) % totalCycle;

      if (breathingPattern === '4-4-6') {
        if (cycleSec < 4) {
          setBreathPhase('Nefes Al (Genişle)');
          setBreathScale(1.0 + (cycleSec / 4) * 0.35);
        } else if (cycleSec < 8) {
          setBreathPhase('Nefesini Tut (Dinginlik)');
          setBreathScale(1.35);
        } else {
          setBreathPhase('Yavaşça Ver (Bırak)');
          setBreathScale(1.35 - ((cycleSec - 8) / 6) * 0.35);
        }
      } else if (breathingPattern === '4-7-8') {
        if (cycleSec < 4) {
          setBreathPhase('Derin Nefes Al');
          setBreathScale(1.0 + (cycleSec / 4) * 0.4);
        } else if (cycleSec < 11) {
          setBreathPhase('Nefesini Tut (7sn)');
          setBreathScale(1.4);
        } else {
          setBreathPhase('Yavaşça Ağızdan Ver (8sn)');
          setBreathScale(1.4 - ((cycleSec - 11) / 8) * 0.4);
        }
      } else { // 4-4-4-4 Box breathing
        if (cycleSec < 4) {
          setBreathPhase('Nefes Al (4sn)');
          setBreathScale(1.0 + (cycleSec / 4) * 0.35);
        } else if (cycleSec < 8) {
          setBreathPhase('Nefesini Tut (4sn)');
          setBreathScale(1.35);
        } else if (cycleSec < 12) {
          setBreathPhase('Nefes Ver (4sn)');
          setBreathScale(1.35 - ((cycleSec - 8) / 4) * 0.35);
        } else {
          setBreathPhase('Boşlukta Kal (4sn)');
          setBreathScale(1.0);
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      soundEngine.stop();
    };
  }, [isOpen, selectedPreset, durationOption, breathingPattern]);

  const handleSelectPreset = (preset: EmergencyFrequencyPreset) => {
    setSelectedPreset(preset);
    setIsCompleted(false);
    playActiveSound(preset, volume, enableHarmonics);
    if (spokenGuidance) {
      voiceAssistant.speak(preset.guidance, true);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    } else {
      playActiveSound(selectedPreset, volume, enableHarmonics);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundEngine.setVolume(val);
  };

  const handleToggleHarmonics = () => {
    const next = !enableHarmonics;
    setEnableHarmonics(next);
    playActiveSound(selectedPreset, volume, next);
  };

  const handleRestart = () => {
    setIsCompleted(false);
    setSecondsRemaining(durationOption === -1 ? 9999 : durationOption);
    playActiveSound(selectedPreset, volume, enableHarmonics);
  };

  const handleClose = () => {
    soundEngine.stop();
    onClose();
  };

  if (!isOpen) return null;

  const totalTime = durationOption === -1 ? 1 : durationOption;
  const progressPercentage = durationOption === -1 ? 100 : Math.max(0, Math.min(100, Math.round(((totalTime - secondsRemaining) / totalTime) * 100)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fade-in overflow-y-auto font-sans">
      <div className="relative w-full max-w-3xl my-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-rose-500/50 rounded-3xl p-4 sm:p-7 shadow-2xl shadow-rose-950/80 text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  ⚠️ SOS Acil Sakinleş & Dengeleme
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {selectedPreset.carrierHz} Hz ({selectedPreset.binauralHz} Hz {selectedPreset.brainwave.toUpperCase()})
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Saf Biyo-Harmonik Frekanslar & Vagus Siniri Parasempatik Regülasyonu
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Guidance Banner */}
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900/60 to-indigo-950/40 border border-rose-500/30 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-rose-200">{selectedPreset.name}: </span>
            {selectedPreset.guidance}
          </div>
        </div>

        {/* Main Central Workspace: Visualizer Sphere + Breathing + Quick Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-4">
          
          {/* Left: Breathing Sphere & Timer Display (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80">
            <div className="relative w-44 h-44 flex items-center justify-center my-2">
              
              {/* Outer Pulsing Waves */}
              <div 
                className="absolute rounded-full bg-rose-500/10 border border-rose-500/20 transition-transform duration-1000 ease-in-out"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  transform: `scale(${breathScale * 1.15})` 
                }}
              />
              <div 
                className="absolute rounded-full bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 border border-rose-400/40 transition-transform duration-1000 ease-in-out shadow-2xl shadow-rose-900/50"
                style={{ 
                  width: '80%', 
                  height: '80%', 
                  transform: `scale(${breathScale})` 
                }}
              />

              {/* Core Heart / Counter */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce mb-1" />
                    <span className="text-xs font-bold text-emerald-300">Dengelendi</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-7 h-7 text-rose-400 mb-1 animate-pulse" />
                    <span className="text-2xl font-mono font-bold text-slate-100">
                      {durationOption === -1 ? '∞' : `${secondsRemaining}s`}
                    </span>
                    <span className="text-[10px] font-bold text-rose-200 mt-1 uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/30">
                      {breathPhase}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Breathing Pattern Switcher */}
            <div className="w-full mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                Nefes:
              </span>
              <div className="flex gap-1">
                {(['4-4-6', '4-7-8', '4-4-4-4'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBreathingPattern(p)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                      breathingPattern === p 
                        ? 'bg-rose-500 text-white font-bold' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Audio Tuner, Duration & Harmonic Controls (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            
            {/* Live Audio Status & Controls */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`p-2 rounded-xl flex items-center justify-center transition cursor-pointer ${
                    isPlaying 
                      ? 'bg-rose-500 text-white ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/40 animate-pulse' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={isPlaying ? 'Sesi Duraklat' : 'Sesi Başlat'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{selectedPreset.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {selectedPreset.description}
                  </div>
                </div>
              </div>

              {/* Completion chime sequence */}
              <button
                type="button"
                onClick={() => soundEngine.playCompletionChimeSequence()}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-amber-300 flex items-center gap-1 border border-slate-700"
                title="Akustik Tibet Çanı Çal"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Tibet Çanı</span>
              </button>
            </div>

            {/* Volume & Harmonics Sliders */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                  Ses Seviyesi: %{Math.round(volume * 100)}
                </span>
                
                <button
                  type="button"
                  onClick={handleToggleHarmonics}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition cursor-pointer flex items-center gap-1 ${
                    enableHarmonics 
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Harmonik Sıcaklık: {enableHarmonics ? 'Açık' : 'Kapalı'}</span>
                </button>
              </div>

              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Duration Selector */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Süre Seçimi:
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: '60s', value: 60 },
                  { label: '2 Dk', value: 120 },
                  { label: '5 Dk', value: 300 },
                  { label: 'Sürekli (∞)', value: -1 }
                ].map((dur) => (
                  <button
                    key={dur.value}
                    type="button"
                    onClick={() => {
                      setDurationOption(dur.value);
                      setSecondsRemaining(dur.value === -1 ? 9999 : dur.value);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      durationOption === dur.value
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Guidance Reassurance Toggle */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-violet-400" />
                Sesli Telkin & Yönlendirme:
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !spokenGuidance;
                  setSpokenGuidance(next);
                  if (next) {
                    voiceAssistant.unlockMobileSpeech();
                    voiceAssistant.speak(selectedPreset.guidance, true);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  spokenGuidance 
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {spokenGuidance ? 'Sesli Telkin Açık' : 'Kapalı (Sadece Frekans)'}
              </button>
            </div>

          </div>
        </div>

        {/* Emergency Frequency Selection Grid (Multiple Choices) */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              Acil Durum Frekans Seçenekleri (Anlık Değiştirilebilir)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              9 Biyo-Rezonans Protokolü
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {EMERGENCY_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border relative flex flex-col justify-between ${
                    isSelected 
                      ? `${preset.bgActive} ${preset.borderActive} ring-1 ring-rose-500/40 shadow-lg` 
                      : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-white' : preset.color}`}>
                        {preset.carrierHz} Hz - {(preset.name || '').split(' ')[1] || preset.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-800/90 text-slate-400 rounded-md font-mono flex-shrink-0">
                        {preset.binauralHz} Hz {preset.brainwave.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-300 line-clamp-1 mb-1">
                      {preset.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/60 text-[9px]">
                    <span className="text-slate-400 truncate max-w-[150px]">
                      {preset.tag}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Aktif
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Klinik biyo-rezonans standardında saf sinüs dalgaları üretilmektedir.</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yeniden Başlat</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xl shadow-emerald-950 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Dengeye Ulaştım & Kapat</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmergencySOSModal;

