import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Play, 
  Pause, 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Activity, 
  Radio, 
  Zap,
  Info
} from 'lucide-react';
import { ChakraMatrixItem, MindSpaceMetric, ScanResult } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface ChakraMatrixViewProps {
  latestMetrics?: MindSpaceMetric | null;
  latestScan?: ScanResult | null;
  onSelectFrequency?: (hz: number) => void;
}

const CHAKRAS_BASE_DATA: Omit<ChakraMatrixItem, 'status' | 'isBlocked' | 'blockageScore'>[] = [
  {
    id: 'sahasrara',
    index: 7,
    name: 'Sahasrara',
    turkishName: 'Taç Çakra',
    sanskritName: 'Sahasrāra (सहस्रार)',
    location: 'Başın Tepesi / Bıngıldak',
    frequencyHz: 963,
    colorHex: '#a855f7',
    element: 'Saf Bilinç / Kozmik Işık',
    bijaMantra: 'AUM',
    associatedOrgan: 'Epifiz Bezi & Üst Beyin Korteksi',
    harmonicEffect: 'Yüksek kozmik bilinç, birlik hissi ve evrensel manevi bağlantı.'
  },
  {
    id: 'ajna',
    index: 6,
    name: 'Ajna',
    turkishName: 'Üçüncü Göz Çakrası',
    sanskritName: 'Ājñā (आज्ञा)',
    location: 'İki Kaşın Ortası',
    frequencyHz: 852,
    colorHex: '#6366f1',
    element: 'Eter / Sezgi',
    bijaMantra: 'OM',
    associatedOrgan: 'Hipofiz Bezi, Gözler & Sinir Sistemi',
    harmonicEffect: 'Zihinsel berraklık, içsel görü, sezgisel rehberlik ve illüzyonların aşılması.'
  },
  {
    id: 'vishuddha',
    index: 5,
    name: 'Vishuddha',
    turkishName: 'Boğaz Çakrası',
    sanskritName: 'Viśuddha (विशुद्ध)',
    location: 'Boğaz / Ses Telleri',
    frequencyHz: 741,
    colorHex: '#0ea5e9',
    element: 'Hava & Ses',
    bijaMantra: 'HAM',
    associatedOrgan: 'Tiroid, Ses Telleri & Bronşlar',
    harmonicEffect: 'Hakikati ifade etme, vokal netlik, iletişim yeteneği ve hücresel detoks.'
  },
  {
    id: 'anahata',
    index: 4,
    name: 'Anahata',
    turkishName: 'Kalp Çakrası',
    sanskritName: 'Anāhata (अनाहत)',
    location: 'Göğüs Kafesi Merkezi',
    frequencyHz: 639,
    colorHex: '#10b981',
    element: 'Hava (Air)',
    bijaMantra: 'YAM',
    associatedOrgan: 'Kalp, Dolaşım Sistemi & Timus Bezi',
    harmonicEffect: 'Koşulsuz sevgi, şefkat, affetme ve ilişkilerde derin biyo-rezonans uyumu.'
  },
  {
    id: 'manipura',
    index: 3,
    name: 'Manipura',
    turkishName: 'Solar Pleksus Çakrası',
    sanskritName: 'Maṇipūra (मणिपूर)',
    location: 'Mide / Göbek Deliği Üstü',
    frequencyHz: 528,
    colorHex: '#eab308',
    element: 'Ateş (Fire)',
    bijaMantra: 'RAM',
    associatedOrgan: 'Mide, Karaciğer, Pankreas & Sindirim',
    harmonicEffect: 'Kişisel irade gücü, özgüven, metabolik biyo-enerji ve DNA onarımı.'
  },
  {
    id: 'svadhisthana',
    index: 2,
    name: 'Svadhisthana',
    turkishName: 'Sakral Çakra',
    sanskritName: 'Svādhiṣṭhāna (स्वाधिष्ठान)',
    location: 'Alt Karın / Göbek Altı',
    frequencyHz: 417,
    colorHex: '#f97316',
    element: 'Su (Water)',
    bijaMantra: 'VAM',
    associatedOrgan: 'Böbrekler, Üreme Organları & Lenf',
    harmonicEffect: 'Yaratıcılık, duygusal akışkanlık, geçmiş travmaların çözülmesi ve neşe.'
  },
  {
    id: 'muladhara',
    index: 1,
    name: 'Muladhara',
    turkishName: 'Kök Çakra',
    sanskritName: 'Mūlādhāra (मूलाधार)',
    location: 'Omurga Tabanı / Kuyruk Sokumu',
    frequencyHz: 396,
    colorHex: '#ef4444',
    element: 'Toprak (Earth)',
    bijaMantra: 'LAM',
    associatedOrgan: 'Omurga, Bacaklar, Bağışıklık & Kemikler',
    harmonicEffect: 'Yaşamsal güvenlik hissi, topraklanma, korkuların arınması ve temel direnç.'
  }
];

export const ChakraMatrixView: React.FC<ChakraMatrixViewProps> = ({
  latestMetrics,
  latestScan,
  onSelectFrequency,
}) => {
  const [chakras, setChakras] = useState<ChakraMatrixItem[]>([]);
  const [selectedChakra, setSelectedChakra] = useState<ChakraMatrixItem | null>(null);
  const [isPlayingChakra, setIsPlayingChakra] = useState<boolean>(false);
  const [activeFreqHz, setActiveFreqHz] = useState<number | null>(null);
  const [balanceProgress, setBalanceProgress] = useState<number>(0);
  const [balancedChakraIds, setBalancedChakraIds] = useState<Set<string>>(new Set());

  // Compute deterministic chakra blockage states from live vocal biometrics & camera scan
  useEffect(() => {
    const stress = latestMetrics?.vocalStressIndex ?? latestScan?.emotionalState?.stressLevel ?? 50;
    const energy = latestMetrics?.energyBreathLevel ?? latestScan?.bioEnergyLevel ?? 50;
    const focus = latestMetrics?.focusScore ?? latestScan?.emotionalState?.mentalClarity ?? 50;
    const pitch = latestMetrics?.averagePitchHz ?? 160;

    const computed: ChakraMatrixItem[] = CHAKRAS_BASE_DATA.map((base) => {
      let isBlocked = false;
      let score = 25; // Base normal variance

      if (base.id === 'muladhara') {
        // High stress or very low energy triggers Root Chakra blockage
        if (stress > 65) {
          isBlocked = true;
          score = Math.min(95, Math.round(stress * 1.1));
        } else if (energy < 35) {
          isBlocked = true;
          score = 75;
        }
      } else if (base.id === 'svadhisthana') {
        // Low vitality & low energy triggers Sacral blockage
        if (energy < 40 && stress > 50) {
          isBlocked = true;
          score = Math.round((100 - energy) * 0.85);
        }
      } else if (base.id === 'manipura') {
        // High vocal tension or moderate stress triggers Solar Plexus
        if (stress >= 55) {
          isBlocked = true;
          score = Math.min(90, Math.round(stress * 0.95));
        }
      } else if (base.id === 'vishuddha') {
        // Pitch instability or jitter > 40 triggers Throat Chakra
        if (pitch > 220 || stress > 70 || (latestMetrics && latestMetrics.recordedSampleCount > 5 && stress > 60)) {
          isBlocked = true;
          score = 85;
        }
      } else if (base.id === 'anahata') {
        // Low focus & high stress triggers Heart Chakra
        if (focus < 45 && stress > 60) {
          isBlocked = true;
          score = 70;
        }
      } else if (base.id === 'ajna') {
        // Low mental clarity
        if (focus < 40) {
          isBlocked = true;
          score = 65;
        }
      } else if (base.id === 'sahasrara') {
        // Low spiritual openness / high stress
        if (stress > 80) {
          isBlocked = true;
          score = 75;
        }
      }

      // Check if already harmonized in this session
      if (balancedChakraIds.has(base.id)) {
        isBlocked = false;
        score = 10;
      }

      const status: ChakraMatrixItem['status'] = isBlocked
        ? 'Bloke & Müdahale Gerekli'
        : score > 40
        ? 'Hafif Dengesiz'
        : 'Dengeli & Uyumlu';

      return {
        ...base,
        isBlocked,
        blockageScore: score,
        status,
      };
    });

    setChakras(computed);
    if (!selectedChakra) {
      // Find the most blocked chakra as default selection
      const worst = [...computed].sort((a, b) => b.blockageScore - a.blockageScore)[0];
      setSelectedChakra(worst || computed[0]);
    }
  }, [latestMetrics, latestScan, balancedChakraIds]);

  const handleSelectChakra = (chakra: ChakraMatrixItem) => {
    setSelectedChakra(chakra);
  };

  const handlePlayChakraFrequency = async (chakra: ChakraMatrixItem) => {
    if (isPlayingChakra && activeFreqHz === chakra.frequencyHz) {
      soundEngine.stop();
      setIsPlayingChakra(false);
      setActiveFreqHz(null);
    } else {
      await soundEngine.startChakraTone(chakra.frequencyHz, 7.83, 0.7);
      setIsPlayingChakra(true);
      setActiveFreqHz(chakra.frequencyHz);
      setBalanceProgress(0);

      if (onSelectFrequency) {
        onSelectFrequency(chakra.frequencyHz);
      }
    }
  };

  // Balancing progress simulation loop during playback
  useEffect(() => {
    if (!isPlayingChakra || !selectedChakra) return;

    const interval = setInterval(() => {
      setBalanceProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          setBalancedChakraIds((old) => new Set(old).add(selectedChakra.id));
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayingChakra, selectedChakra]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      if (isPlayingChakra) {
        soundEngine.stop();
      }
    };
  }, [isPlayingChakra]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Chakra Frequency Matrix</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Canlı Meridyen Haritası
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Vokal analiz ve biyo-alan verilerinizle 7 temel enerji merkezinin gerçek zamanlı rezonans matrisi
            </p>
          </div>
        </div>

        {/* Real Data Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Kaynak: {latestMetrics ? 'MindSpace Canlı Vokal Analizi' : 'Biyo-Enerji Sensörleri'}</span>
        </div>
      </div>

      {/* Main Grid: Body Silhouette & Chakra Card List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Visual Human Body Energy Column SVG (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Sushumna & Kundalini Ekseni</span>
          </div>

          {/* Interactive Chakras Vertical Axis */}
          <div className="relative w-48 h-[420px] flex flex-col items-center justify-between mt-8 py-4">
            
            {/* Central Pranic Channel Line */}
            <div className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-emerald-400 to-red-500 rounded-full opacity-40 shadow-lg shadow-purple-500/50" />

            {chakras.map((c) => {
              const isSelected = selectedChakra?.id === c.id;
              const isPlayingThis = isPlayingChakra && activeFreqHz === c.frequencyHz;

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectChakra(c)}
                  className="relative z-10 flex items-center gap-3 cursor-pointer group select-none"
                >
                  {/* Glowing Node Button */}
                  <div className="relative flex items-center justify-center">
                    {c.isBlocked && (
                      <span className="absolute w-8 h-8 rounded-full bg-rose-500/40 animate-ping" />
                    )}
                    {isPlayingThis && (
                      <span className="absolute w-10 h-10 rounded-full bg-cyan-400/40 animate-ping" />
                    )}

                    <div 
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isSelected 
                          ? 'scale-125 shadow-xl shadow-white/30' 
                          : 'group-hover:scale-110 opacity-80 group-hover:opacity-100'
                      }`}
                      style={{ 
                        backgroundColor: isSelected ? c.colorHex : `${c.colorHex}33`,
                        borderColor: c.colorHex 
                      }}
                    >
                      <span className="text-[10px] font-bold text-white">
                        {c.index}
                      </span>
                    </div>
                  </div>

                  {/* Label */}
                  <div className={`px-2 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected 
                      ? 'bg-slate-950 text-slate-100 border border-slate-700 shadow-sm' 
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {c.turkishName} ({c.frequencyHz}Hz)
                  </div>
                </div>
              );
            })}

          </div>

          <p className="text-[11px] text-slate-500 mt-4 text-center font-mono">
            Bir enerji merkezine dokunarak detaylı rezonans analizini görüntüleyin
          </p>
        </div>

        {/* Right Column: Detailed Chakra Inspector & Frequency Synthesizer (8 Cols) */}
        {selectedChakra && (
          <div className="lg:col-span-8 flex flex-col gap-5 p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
            
            {/* Header: Title & Blockage Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ backgroundColor: selectedChakra.colorHex }}
                >
                  {selectedChakra.bijaMantra}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {selectedChakra.turkishName} • {selectedChakra.sanskritName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konum: {selectedChakra.location} • Element: {selectedChakra.element}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                selectedChakra.isBlocked
                  ? 'bg-rose-950/70 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
              }`}>
                {selectedChakra.isBlocked ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Blokaj Tespit Edildi (%{selectedChakra.blockageScore})</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Dengeli & Uyumlu</span>
                  </>
                )}
              </div>
            </div>

            {/* Chakra Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Solfeggio Frekansı</span>
                <span className="text-base font-mono font-bold text-slate-200">
                  {selectedChakra.frequencyHz} Hz
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Bija Mantrası</span>
                <span className="text-base font-bold text-indigo-300">
                  {selectedChakra.bijaMantra}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">İlişkili Fizyoloji</span>
                <span className="text-xs font-medium text-slate-300">
                  {selectedChakra.associatedOrgan}
                </span>
              </div>
            </div>

            {/* Description & Harmonic Effect */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Biyo-Rezonans Harmonik Etkisi</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {selectedChakra.harmonicEffect}
              </p>
            </div>

            {/* Real-time Balancing Progress Bar */}
            {isPlayingChakra && activeFreqHz === selectedChakra.frequencyHz && (
              <div className="flex flex-col gap-2 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 animate-fade-in">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-indigo-200 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span>{selectedChakra.frequencyHz} Hz Dengeleme Frekansı Yükleniyor...</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-400">%{balanceProgress}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${balanceProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Interactive Player Button Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-mono">
                Saf Akustik Sinüs + 7.83Hz Schumann Overtonu
              </div>

              <button
                onClick={() => handlePlayChakraFrequency(selectedChakra)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs shadow-xl transition-all cursor-pointer ${
                  isPlayingChakra && activeFreqHz === selectedChakra.frequencyHz
                    ? 'bg-rose-900/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/80'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-950'
                }`}
              >
                {isPlayingChakra && activeFreqHz === selectedChakra.frequencyHz ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Dengeleme Sesini Durdur</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{selectedChakra.turkishName} Frekansını Çal ({selectedChakra.frequencyHz} Hz)</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
