import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  Shield, 
  Flame, 
  Radio, 
  Info, 
  ChevronRight,
  Sun,
  Layers,
  Compass,
  Wind,
  Droplets,
  Mountain,
  CircleDot,
  Rotate3d
} from 'lucide-react';
import { LETAIF_GUIDE, AURA_COLORS_GUIDE, LetaifInfo, LETAIF_POINTS, CHAKRA_GUIDE } from '../data/letaifData';
import { EASTERN_MANTRAS, MYTHOLOGICAL_ELEMENTS } from '../data/easternData';
import { PageNavBar } from './PageNavBar';
import { BioAura3DSimulator } from './BioAura3DSimulator';
import { ScanResult } from '../types';
import { getLastPreScan } from '../utils/storage';

interface GuideViewProps {
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export const GuideView: React.FC<GuideViewProps> = ({
  onGoBack,
  onGoHome,
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<'simulation3d' | 'letaif' | 'auraLayers' | 'chakras' | 'elements'>(() => {
    try {
      const stored = localStorage.getItem('aurabio_guide_subtab');
      if (stored === 'simulation3d' || stored === 'letaif' || stored === 'auraLayers' || stored === 'chakras' || stored === 'elements') {
        return stored;
      }
    } catch {}
    return 'simulation3d';
  });

  const [selectedLetaifId, setSelectedLetaifId] = useState<string>('kalb');

  const handleTabChange = (tab: 'simulation3d' | 'letaif' | 'auraLayers' | 'chakras' | 'elements') => {
    setActiveGuideTab(tab);
    try {
      localStorage.setItem('aurabio_guide_subtab', tab);
    } catch {}
  };

  const sampleScanResult: ScanResult = getLastPreScan() || {
    id: 'sample-guide-scan',
    timestamp: Date.now(),
    dominantAuraColor: 'Zümrüt Yeşili',
    auraHex: '#10b981',
    auraSecondaryHex: '#38bdf8',
    bioEnergyLevel: 88,
    frequencyHz: 528,
    measuredFrequencyHz: 528,
    coherenceScore: 92,
    stressIndex: 18,
    emotionalState: {
      primary: 'Huzur & İlahi Rezonans',
      stressLevel: 18,
      vitalityLevel: 88,
      tranquilityLevel: 94,
    },
    auraDistribution: [],
    chakraLevels: CHAKRA_GUIDE.map(c => ({
      id: c.id,
      name: c.name,
      level: 85,
      color: c.colorHex,
      frequency: c.frequencyHz,
    })),
    letaifLevels: LETAIF_POINTS.map(l => ({
      id: l.id,
      name: l.name,
      arabicName: l.arabicName,
      color: l.colorHex,
      level: 90,
      esma: l.esma,
      dhikr: l.esma,
    })),
    auraLayers: [],
    pranaFlowRate: 85,
    kundaliniResonance: 80,
    recommendedEsmas: [],
    recommendedAyets: [],
    kirlianPlasmaIntensity: 90,
    cellularVitality: 88,
    photonEmissionRate: 92,
  };

  const selectedLetaif = LETAIF_GUIDE.find(l => l.id === selectedLetaifId) || LETAIF_GUIDE[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Navigation Bar with Back & Home Buttons */}
      <PageNavBar
        title="Biyo-Enerji & Rezonans Ansiklopedisi"
        subtitle="Kadim Doğu, Tasavvufi Letaif ve Kuantum Frekans Rehberi"
        icon={<BookOpen className="w-4 h-4" />}
        badge="Ansiklopedi v2.5"
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />

      {/* Guide Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleTabChange('simulation3d')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeGuideTab === 'simulation3d'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
              : 'text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-800/40'
          }`}
        >
          <Rotate3d className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          <span>🌟 3D Canlı Aura & Letaif Simülatörü</span>
        </button>

        <button
          onClick={() => handleTabChange('letaif')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeGuideTab === 'letaif'
              ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>5 Tasavvufi Letaif (İslam)</span>
        </button>

        <button
          onClick={() => handleTabChange('auraLayers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeGuideTab === 'auraLayers'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3 Aura Katmanı & Renk Anlamları</span>
        </button>

        <button
          onClick={() => handleTabChange('chakras')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeGuideTab === 'chakras'
              ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>7 Çakra & Bija Tohum Mantraları</span>
        </button>

        <button
          onClick={() => handleTabChange('elements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeGuideTab === 'elements'
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>5 Kadim Element & Mitoloji</span>
        </button>
      </div>

      {/* TAB 0: 3D CANLI SİMÜLATÖR */}
      {activeGuideTab === 'simulation3d' && (
        <div className="space-y-6 animate-fade-in">
          <BioAura3DSimulator
            scanResult={sampleScanResult}
            heightClassName="h-[520px] sm:h-[600px]"
            showControlPanel={true}
          />
        </div>
      )}

      {/* TAB 1: 5 LETAIF-İ ERBAA VE AHFA */}
      {activeGuideTab === 'letaif' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Letaif List Navigation */}
          <div className="lg:col-span-4 space-y-2">
            {LETAIF_GUIDE.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedLetaifId(item.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                  selectedLetaifId === item.id
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span 
                    className="w-3 h-3 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: item.colorHex || item.color }}
                  />
                  <div>
                    <h3 className={`text-sm font-bold transition-colors ${selectedLetaifId === item.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {item.name}
                    </h3>
                    <span className="text-[11px] font-arabic text-amber-400/90">{item.arabicName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30">
                    {item.esmaFrequency} Hz
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedLetaifId === item.id ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner"
                  style={{ backgroundColor: `${selectedLetaif.colorHex}22`, borderColor: selectedLetaif.colorHex }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: selectedLetaif.colorHex }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-100">{selectedLetaif.name}</h2>
                    <span className="text-sm font-arabic text-amber-300">{selectedLetaif.arabicName}</span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedLetaif.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {selectedLetaif.esmaFrequency} Hz Rezonans
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-850">
                <span className="text-[11px] text-slate-400 block mb-1">Tecelli Nuru Rengi:</span>
                <span className="text-xs font-bold text-slate-100">{selectedLetaif.color}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-850">
                <span className="text-[11px] text-slate-400 block mb-1">Peygamberi Meşreb:</span>
                <span className="text-xs font-bold text-amber-300">{selectedLetaif.prophetConnection}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Batıni Hakikati ve Manevi Anlamı</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                {selectedLetaif.spiritualMeaning}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Beden & Organ Üzerindeki Tesiri</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedLetaif.effectOnBody}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-amber-400 block">Tavsiye Edilen Frekans ve Zikir:</span>
                <span className="text-xs font-semibold text-slate-100">{selectedLetaif.esma} ({selectedLetaif.dhikrCount} Adet) - {selectedLetaif.esmaMeaning}</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300 px-3 py-1 rounded-xl bg-amber-950/60 border border-amber-500/40">
                {selectedLetaif.esmaFrequency} Hz
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 3 AURA LAYERS & COLORS */}
      {activeGuideTab === 'auraLayers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 space-y-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">1. ETERİK (FİZİKSEL) KATMAN</span>
              <h3 className="text-sm font-bold text-slate-100">Hücresel Biyo-Plazma Kalkanı</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Fiziksel bedenin 2 ila 5 cm dışını saran manyetik koruma zırhıdır. Bedenin organ sağlığını, canlılığını ve Prana enerjisini yansıtır.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">2. ASTRAL (DUYGUSAL) KATMAN</span>
              <h3 className="text-sm font-bold text-slate-100">Duygu & Kalp Titreşim Alanı</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bedenin 10 ila 30 cm dışına yayılan, anlık duygulara, sevgiye, korkulara ve neşeye göre renk değiştiren akışkan foton alanıdır.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/40 space-y-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">3. MENTAL & SPRİTÜEL KATMAN</span>
              <h3 className="text-sm font-bold text-slate-100">Yüksek Şuur ve Işık Matrisi</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bedenin 50 cm ve ötesine uzanan tefekkür, ilahi ilham, akıl ve kozmik birlik (Tevhid) boyutudur.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {AURA_COLORS_GUIDE.map((aura, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-4 h-4 rounded-full shadow-lg"
                      style={{ backgroundColor: aura.hex }}
                    />
                    <h3 className="text-sm font-bold text-slate-100">{aura.name}</h3>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Manevi Anlamı:</span>
                    <p className="text-slate-200 font-medium">{aura.meaning}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Nitelikler:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {aura.traits.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] border border-slate-800">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 7 CHAKRAS & BIJA MANTRAS */}
      {activeGuideTab === 'chakras' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/30 text-xs text-orange-200">
            Hindu ve Doğu felsefesinde 7 ana çakra, omurga boyunca dizilen ve belirli Bija (tohum) mantralarıyla rezone edilen enerji girdaplarıdır.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EASTERN_MANTRAS.map((mantra) => (
              <div key={mantra.id} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100">{mantra.name}</h4>
                      <span className="text-xs font-arabic text-amber-300 font-bold">{mantra.sanskrit}</span>
                    </div>
                    <span className="text-[11px] text-orange-400">{mantra.chakra}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-orange-300 px-2.5 py-1 rounded-lg bg-orange-950/60 border border-orange-500/30">
                    {mantra.frequencyHz} Hz
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{mantra.benefit || (mantra as any).meaning}</p>
                
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 text-xs space-y-1">
                  <p className="text-slate-400"><strong>Kök Ses:</strong> <span className="text-orange-300">{(mantra as any).bijaSound || mantra.sanskrit}</span></p>
                  <p className="text-slate-400"><strong>Olumlama / Meditasyon:</strong> <span className="text-slate-300">{mantra.affirmation || (mantra as any).meditationGuide}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 5 ELEMENTS & MYTHOLOGY */}
      {activeGuideTab === 'elements' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200">
            Kadim Doğu mitolojisi (Pancha Mahabhuta) evrenin ve insan biyo-alanının 5 temel elementin ahengiyle var olduğunu öğretir.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MYTHOLOGICAL_ELEMENTS.map((elem) => (
              <div key={elem.id} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{(elem as any).elementSymbol || '✨'}</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{elem.name}</h4>
                      <span className="text-[11px] text-cyan-400 font-arabic">{(elem as any).sanskritName || elem.archetype}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                    {elem.frequencyHz} Hz
                  </span>
                </div>

                <p className="text-xs text-slate-300">{elem.benefit || (elem as any).attributes}</p>

                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-850 text-[11px] space-y-1">
                  <p className="text-emerald-400"><strong>Dengeleme:</strong> {elem.balancingAction || (elem as any).effects}</p>
                  <p className="text-slate-400"><strong>Arketip:</strong> {elem.archetype || (elem as any).sacredSound}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
