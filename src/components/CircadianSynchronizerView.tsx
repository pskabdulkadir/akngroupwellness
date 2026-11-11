import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Clock, 
  Activity, 
  Play, 
  Square, 
  Sparkles, 
  Volume2, 
  Zap, 
  Heart, 
  Brain, 
  Shield, 
  Compass, 
  Sliders, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  Flame, 
  Layers 
} from 'lucide-react';
import { CircadianPhaseInfo, NatureSoundLayer } from '../types';
import { soundEngine } from '../utils/soundEngine';
import { PageNavBar } from './PageNavBar';

interface CircadianSynchronizerViewProps {
  onGoBack?: () => void;
  onGoHome?: () => void;
  onApplyFrequency?: (freqHz: number, binauralHz: number, name: string) => void;
}

const CIRCADIAN_PHASES: CircadianPhaseInfo[] = [
  {
    period: 'dawn',
    title: 'Şafak & Uyanış Evresi',
    turkishName: 'Fecr & Doğal Sirkadiyen Reset',
    timeRange: '05:00 - 07:00',
    dominantOrgan: 'Kalın Bağırsak (Arınma & Boşaltım)',
    organTCM: 'TCM Enerji Kanalları Uyanışı',
    hormonePhase: 'Kortizol Zirve Yükselişi • Melatonin Baskılanması',
    cortisolLevel: 'Yükselmeye Başlıyor',
    melatoninLevel: 'Baskılanıyor',
    recommendedFrequencyHz: 528,
    recommendedBinauralHz: 10.0,
    recommendedWave: 'alpha',
    colorPalette: {
      bgGradient: 'from-amber-950/40 via-orange-950/30 to-slate-900',
      ambientColor: 'rgba(245, 158, 11, 0.15)',
      accentColor: '#f59e0b',
      badgeBg: 'bg-amber-500/20',
      badgeBorder: 'border-amber-500/40',
    },
    guidanceText: 'Güneşin ilk fotonları göz retinasına ulaşırken epifiz bezi melatonin salgısını durdurur. 528Hz ile biyo-alanınızı güne şarj edin.',
    suggestedAction: 'Işığa bakın, 2 bardak ılık su için ve hafif esneme yapın.',
  },
  {
    period: 'morning',
    title: 'Sabah & Yüksek Bilişsel Performans',
    turkishName: 'Kuşluk & Zihinsel Netlik',
    timeRange: '07:00 - 11:00',
    dominantOrgan: 'Mide & Dalak (Besin Emilimi & Zihinsel Odak)',
    organTCM: 'Zeka, Hafıza ve Prefrontal Korteks',
    hormonePhase: 'Optimum Uyanıklık & Maksimum Dopamin/Kortizol',
    cortisolLevel: 'Yüksek (Zirve)',
    melatoninLevel: 'Baskılanıyor',
    recommendedFrequencyHz: 639,
    recommendedBinauralHz: 14.0,
    recommendedWave: 'beta',
    colorPalette: {
      bgGradient: 'from-yellow-950/30 via-slate-900 to-emerald-950/30',
      ambientColor: 'rgba(234, 179, 8, 0.15)',
      accentColor: '#eab308',
      badgeBg: 'bg-yellow-500/20',
      badgeBorder: 'border-yellow-500/40',
    },
    guidanceText: 'Günün en yüksek odaklanma ve karar alma penceresi. 639Hz ve 14Hz Beta ritmi bilişsel işleme hızını maksimize eder.',
    suggestedAction: 'En zorlu zihinsel görevleri, stratejik analizleri ve analizleri bu saatte yapın.',
  },
  {
    period: 'noon',
    title: 'Öğle & Kalp Enerji Zirvesi',
    turkishName: 'Zeval & Sirkadiyen Denge',
    timeRange: '11:00 - 15:00',
    dominantOrgan: 'Kalp & İnce Bağırsak (Dolaşım & Hayatiyet)',
    organTCM: 'Anahata Nuru ve Kardiyovasküler Dinamizm',
    hormonePhase: 'Enerji Dengelenmesi • Post-Prandiyal Dinlenme',
    cortisolLevel: 'Düşüşte',
    melatoninLevel: 'Düşük',
    recommendedFrequencyHz: 741,
    recommendedBinauralHz: 8.5,
    recommendedWave: 'alpha',
    colorPalette: {
      bgGradient: 'from-teal-950/40 via-slate-900 to-cyan-950/30',
      ambientColor: 'rgba(20, 184, 166, 0.15)',
      accentColor: '#14b8a6',
      badgeBg: 'bg-teal-500/20',
      badgeBorder: 'border-teal-500/40',
    },
    guidanceText: 'Kalp meridyeninin en güçlü olduğu saatler. 741Hz hücreleri toksinlerden arındırır ve zihinsel ferahlık sağlar.',
    suggestedAction: 'Hafif bir öğün tüketin, 15-20 dakika kaylule (göz dinlendirme) yapın.',
  },
  {
    period: 'afternoon',
    title: 'İkindi & Biyolojik Sakinleşme',
    turkishName: 'Asr & Schumann Rezonansı',
    timeRange: '15:00 - 19:00',
    dominantOrgan: 'Mesane & Böbrek (Su Dengesi & Vital Enerji)',
    organTCM: 'Jing Enerjisi & Hücresel Mukavemet',
    hormonePhase: 'Vücut Sıcaklığı Zirvesi • Fiziksel Koordinasyon',
    cortisolLevel: 'Düşüşte',
    melatoninLevel: 'Düşük',
    recommendedFrequencyHz: 432,
    recommendedBinauralHz: 7.83,
    recommendedWave: 'alpha',
    colorPalette: {
      bgGradient: 'from-blue-950/40 via-slate-900 to-indigo-950/30',
      ambientColor: 'rgba(59, 130, 246, 0.15)',
      accentColor: '#3b82f6',
      badgeBg: 'bg-blue-500/20',
      badgeBorder: 'border-blue-500/40',
    },
    guidanceText: 'Yerkürenin 7.83Hz Schumann nabzı ile tam rezonans. Günün stresini nötrleyerek akşam fazına geçişi hazırlar.',
    suggestedAction: 'Bol su için, yürüyüş yapın ve 432Hz ile zihninizi dinginleştirin.',
  },
  {
    period: 'evening',
    title: 'Akşam & Melatonin Başlangıcı',
    turkishName: 'Mağrib & Sekinet',
    timeRange: '19:00 - 21:00',
    dominantOrgan: 'Perikard (Kalp Koruyucu Zarı & Dolaşım)',
    organTCM: 'Duygusal Huzur & Ailevi İletişim',
    hormonePhase: 'Epifiz Bezi Uyarımı • Melatonin Salgısı Başlangıcı',
    cortisolLevel: 'En Düşük Seviye',
    melatoninLevel: 'Salgılanma Başlıyor',
    recommendedFrequencyHz: 396,
    recommendedBinauralHz: 6.0,
    recommendedWave: 'theta',
    colorPalette: {
      bgGradient: 'from-purple-950/40 via-slate-900 to-violet-950/40',
      ambientColor: 'rgba(168, 85, 247, 0.15)',
      accentColor: '#a855f7',
      badgeBg: 'bg-purple-500/20',
      badgeBorder: 'border-purple-500/40',
    },
    guidanceText: 'Mavi ışıktan uzaklaşma zamanı. 396Hz frekansı kök çakrayı yatıştırarak kortizolü tamamen sıfırlar.',
    suggestedAction: 'Ekran parlaklığını kısın, loş sarı ışıklar kullanın ve ağır yemekten kaçının.',
  },
  {
    period: 'night',
    title: 'Gece & Biyo-Alan Kalkanı',
    turkishName: 'Yatsı & Hücresel Hazırlık',
    timeRange: '21:00 - 23:00',
    dominantOrgan: 'Üçlü Isıtıcı (Sanjiao / Termal & Lenfatik Denge)',
    organTCM: 'Hormonal Koordinasyon & Lenfatik Drenaj',
    hormonePhase: 'Hızlı Melatonin Artışı • Vücut Isısında Düşüş',
    cortisolLevel: 'En Düşük Seviye',
    melatoninLevel: 'Zirve (Derin REM)',
    recommendedFrequencyHz: 174,
    recommendedBinauralHz: 4.0,
    recommendedWave: 'theta',
    colorPalette: {
      bgGradient: 'from-indigo-950/50 via-slate-900 to-slate-950',
      ambientColor: 'rgba(99, 102, 241, 0.15)',
      accentColor: '#6366f1',
      badgeBg: 'bg-indigo-500/20',
      badgeBorder: 'border-indigo-500/40',
    },
    guidanceText: '174Hz doğal anestezik etkisiyle kas gerginliklerini çözer, zihni derin uyku tüneline hazırlar.',
    suggestedAction: 'Tüm parlak ışıkları kapatın, derin nefes egzersizi (4-7-8) uygulayın.',
  },
  {
    period: 'deep_sleep',
    title: 'Derin Uyku & Karaciğer Hücresel Detoksu',
    turkishName: 'Gece Yarısı & Hücre Yenilenmesi',
    timeRange: '23:00 - 05:00',
    dominantOrgan: 'Safra Kesesi & Karaciğer (DNA Onarımı & Toksin Boşaltımı)',
    organTCM: 'Kan Temizliği, Büyüme Hormonu & Hücresel Mitoz',
    hormonePhase: 'Maksimum Büyüme Hormonu (HGH) & Derin Delta Senkronu',
    cortisolLevel: 'En Düşük Seviye',
    melatoninLevel: 'Zirve (Derin REM)',
    recommendedFrequencyHz: 432,
    recommendedBinauralHz: 1.5,
    recommendedWave: 'delta',
    colorPalette: {
      bgGradient: 'from-slate-950 via-slate-900 to-indigo-950/60',
      ambientColor: 'rgba(30, 27, 75, 0.3)',
      accentColor: '#818cf8',
      badgeBg: 'bg-indigo-500/20',
      badgeBorder: 'border-indigo-500/40',
    },
    guidanceText: 'Karaciğer ve beynin glimfatik sistemi tüm hücresel atıkları temizler. 1.5Hz Delta ritmi en derin uykuyu sağlar.',
    suggestedAction: 'Tamamen karanlık ve serin bir ortamda derin dinlenmeye geçin.',
  },
];

export const CircadianSynchronizerView: React.FC<CircadianSynchronizerViewProps> = ({
  onGoBack,
  onGoHome,
  onApplyFrequency,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [customHour, setCustomHour] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedNature, setSelectedNature] = useState<NatureSoundLayer>('ocean');
  const [volume, setVolume] = useState<number>(0.55);

  // Live Clock Interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (customHour === null) {
        setCurrentTime(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [customHour]);

  // Determine current active Circadian Phase based on hour
  const activeHour = customHour !== null ? customHour : currentTime.getHours();

  const getPhaseByHour = (hour: number): CircadianPhaseInfo => {
    if (hour >= 5 && hour < 7) return CIRCADIAN_PHASES[0]; // dawn
    if (hour >= 7 && hour < 11) return CIRCADIAN_PHASES[1]; // morning
    if (hour >= 11 && hour < 15) return CIRCADIAN_PHASES[2]; // noon
    if (hour >= 15 && hour < 19) return CIRCADIAN_PHASES[3]; // afternoon
    if (hour >= 19 && hour < 21) return CIRCADIAN_PHASES[4]; // evening
    if (hour >= 21 && hour < 23) return CIRCADIAN_PHASES[5]; // night
    return CIRCADIAN_PHASES[6]; // deep_sleep (23 - 05)
  };

  const currentPhase = getPhaseByHour(activeHour);

  // Handle Play/Stop Circadian Acoustic Session
  const handleTogglePlay = async () => {
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    } else {
      if (onApplyFrequency) {
        onApplyFrequency(
          currentPhase.recommendedFrequencyHz,
          currentPhase.recommendedBinauralHz,
          currentPhase.title
        );
      }
      await soundEngine.startCircadianFrequency(
        currentPhase.recommendedFrequencyHz,
        currentPhase.recommendedBinauralHz,
        currentPhase.recommendedWave,
        selectedNature,
        volume
      );
      setIsPlaying(true);
    }
  };

  return (
    <div className={`w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 bg-gradient-to-b ${currentPhase.colorPalette.bgGradient} rounded-3xl border border-slate-800 transition-colors duration-700 shadow-2xl`}>
      
      {/* Top Universal Navigation Bar */}
      <PageNavBar
        title="Biyo-Ritim & Circadian Senkronizatörü"
        subtitle="Organ Saatleri, Hormon Döngüleri ve Kuantum Biyo-Rezonans"
        icon={<Clock className="w-4 h-4 text-teal-400" />}
        badge={currentPhase.turkishName}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-2xl border transition-all"
            style={{ 
              backgroundColor: currentPhase.colorPalette.ambientColor,
              borderColor: currentPhase.colorPalette.accentColor
            }}
          >
            {activeHour >= 6 && activeHour < 19 ? (
              <Sun className="w-6 h-6 text-amber-300 animate-pulse" />
            ) : (
              <Moon className="w-6 h-6 text-indigo-300 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Biyo-Ritim & Circadian Senkronizatörü
              </h1>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${currentPhase.colorPalette.badgeBg} text-white border ${currentPhase.colorPalette.badgeBorder}`}>
                Biyolojik Saat
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Günün saatine ve güneşin açısına göre organ saatlerini, hormon dengesini ve akustik frekansı senkronize eder
            </p>
          </div>
        </div>

        {/* Live Clock & Time Mode Indicator */}
        <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 px-4 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <Clock className="w-4 h-4 text-teal-400" />
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-slate-200">
              {customHour !== null ? `${String(customHour).padStart(2, '0')}:00 (Simüle)` : currentTime.toLocaleTimeString('tr-TR')}
            </div>
            <div className="text-[10px] text-teal-400">
              {currentPhase.timeRange}
            </div>
          </div>
          {customHour !== null && (
            <button
              onClick={() => setCustomHour(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Gerçek Saate Dön"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Active Circadian Stage Spotlight Card */}
      <div className="rounded-3xl border border-slate-700/80 bg-slate-950/75 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Glow Halo */}
        <div 
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: currentPhase.colorPalette.accentColor }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Aktif Biyolojik Faz
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {currentPhase.title}
            </h2>
            <div className="text-xs text-slate-300 font-medium">
              {currentPhase.turkishName} • {currentPhase.timeRange}
            </div>
          </div>

          {/* Big Frequency Tag */}
          <div className="flex items-center gap-2">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Ana Taşıyıcı Frekans</div>
              <div className="text-lg font-mono font-bold text-teal-300">
                {currentPhase.recommendedFrequencyHz} Hz
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Beyin Dalgası</div>
              <div className="text-lg font-mono font-bold text-indigo-300">
                +{currentPhase.recommendedBinauralHz} Hz ({currentPhase.recommendedWave.toUpperCase()})
              </div>
            </div>
          </div>
        </div>

        {/* 3 Biological Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Aktif Meridyen & Organ (TCM)
            </div>
            <div className="text-xs font-bold text-slate-100">
              {currentPhase.dominantOrgan}
            </div>
            <div className="text-[11px] text-slate-400">
              {currentPhase.organTCM}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Kortizol Seviyesi
            </div>
            <div className="text-xs font-bold text-amber-300">
              {currentPhase.cortisolLevel}
            </div>
            <div className="text-[11px] text-slate-400">
              Uyanıklık & Stres Metabolizması
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Melatonin Sentezi
            </div>
            <div className="text-xs font-bold text-indigo-300">
              {currentPhase.melatoninLevel}
            </div>
            <div className="text-[11px] text-slate-400">
              Epifiz Bezi Uyku Döngüsü
            </div>
          </div>

        </div>

        {/* Guidance & Bio-Recommendation */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 relative z-10">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-teal-400" />
            Biyolojik Saat Tavsiyesi:
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            {currentPhase.guidanceText}
          </p>
          <div className="text-[11px] text-teal-300 font-semibold pt-1">
            💡 Önerilen Eylem: {currentPhase.suggestedAction}
          </div>
        </div>

        {/* Sound Controls & Play Button */}
        <div className="space-y-3 pt-2 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
              Doğa Katmanı:
            </span>
            <div className="flex items-center gap-1">
              {(['none', 'ocean', 'rain', 'tibetan_bowls', 'campfire'] as NatureSoundLayer[]).map((nat) => (
                <button
                  key={nat}
                  onClick={() => {
                    setSelectedNature(nat);
                    if (isPlaying) {
                      soundEngine.startCircadianFrequency(
                        currentPhase.recommendedFrequencyHz,
                        currentPhase.recommendedBinauralHz,
                        currentPhase.recommendedWave,
                        nat,
                        volume
                      );
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedNature === nat
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {nat === 'none' ? 'Yalın' : nat === 'ocean' ? 'Okyanus' : nat === 'rain' ? 'Yağmur' : nat === 'tibetan_bowls' ? 'Tibet Çanı' : 'Ateş'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleTogglePlay}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950 animate-pulse'
                : 'bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-950'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>Sirkadiyen Akustiği Durdur</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{currentPhase.title} Akustiğini Başlat ({currentPhase.recommendedFrequencyHz} Hz + {currentPhase.recommendedBinauralHz} Hz)</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* 24-Hour Time Travel & Organ Clock Slider */}
      <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              24 Saatlik Zaman Gezgini & Biyolojik Saat Simülasyonu
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-teal-300">
            Saat: {String(activeHour).padStart(2, '0')}:00
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={23}
          value={activeHour}
          onChange={(e) => setCustomHour(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
        />

        {/* 7 Circadian Phase Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {CIRCADIAN_PHASES.map((phase, idx) => {
            const isSelected = phase.period === currentPhase.period;
            return (
              <button
                key={idx}
                onClick={() => {
                  const startHour = parseInt((phase.timeRange || '08:00').split(':')[0], 10);
                  setCustomHour(startHour);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-teal-500/20 border-teal-400 text-white shadow-lg'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono text-teal-400">{phase.timeRange}</div>
                <div className="text-xs font-bold truncate mt-0.5">{(phase.title || '').split('&')[0]}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">{phase.recommendedFrequencyHz} Hz</div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
