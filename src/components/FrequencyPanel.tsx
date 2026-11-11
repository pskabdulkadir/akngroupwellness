import React, { useState } from 'react';
import { 
  Search, 
  Radio, 
  ShieldCheck, 
  Sparkles, 
  Play, 
  Filter, 
  Info,
  Heart,
  Volume2
} from 'lucide-react';
import { ESMA_LIST, EsmaItem } from '../data/esmaData';
import { AYET_LIST, AyetItem } from '../data/ayetData';
import { TreatmentSelection } from './FrequencyLoadingModal';
import { PageNavBar } from './PageNavBar';

interface FrequencyPanelProps {
  initialTab?: 'esma' | 'ayet';
  onSelectFrequency: (selection: TreatmentSelection) => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export const FrequencyPanel: React.FC<FrequencyPanelProps> = ({
  initialTab = 'esma',
  onSelectFrequency,
  onGoBack,
  onGoHome,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'esma' | 'ayet'>(() => {
    try {
      const stored = localStorage.getItem('aurabio_islamic_subtab');
      if (stored === 'esma' || stored === 'ayet') return stored;
    } catch {}
    return initialTab;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

  const handleSubTabChange = (tab: 'esma' | 'ayet') => {
    setActiveSubTab(tab);
    setSelectedCategory('Tümü');
    try {
      localStorage.setItem('aurabio_islamic_subtab', tab);
    } catch {}
  };

  const esmaCategories = ['Tümü', 'Şifa & Sağlık', 'Huzur & Sekinet', 'Nur & İlim', 'Rızık & Bereket', 'Koruma & Heybet', 'Aşk & Muhabbet', 'Tevekkül & İrade'];
  const ayetCategories = ['Tümü', 'Şifa Ayetleri', 'Sekinet & İnşirah', 'Korunma & Zırh', 'Nazar & Arınma', 'Kalp Nuru'];

  const filteredEsmas = ESMA_LIST.filter((item) => {
    const ebcedVal = (item as any).ebced || item.ebjed || '';
    const cat = (item as any).category || item.healingTarget || '';
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.arabic.includes(searchQuery) ||
      ebcedVal.toString().includes(searchQuery);
    const matchesCat = selectedCategory === 'Tümü' || cat.includes(selectedCategory);
    return matchesSearch && matchesCat;
  });

  const filteredAyets = AYET_LIST.filter((item) => {
    const title = (item as any).title || `${item.surah} Suresi (${item.verseNumber}. Ayet)`;
    const trans = (item as any).transcription || item.turkishTranslation || '';
    const meaning = (item as any).meaning || item.turkishTranslation || '';
    const surahInfo = (item as any).surahInfo || `${item.surah} ${item.verseNumber}`;
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trans.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surahInfo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'Tümü' || item.healingCategory === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Navigation Bar with Back & Home Buttons */}
      <PageNavBar
        title="Panel A: İslami Frekanslar"
        subtitle="Esmaü'l Hüsna & Şifa Ayetleri Ebced Rezonansı"
        icon={<Radio className="w-4 h-4" />}
        badge={activeSubTab === 'esma' ? `99 Esma (${ESMA_LIST.length})` : `Şifa Ayetleri (${AYET_LIST.length})`}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />

      {/* Main Filter & Subtab Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => handleSubTabChange('esma')}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              activeSubTab === 'esma'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Esmaü'l Hüsna (99 İsim)
          </button>
          <button
            onClick={() => handleSubTabChange('ayet')}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              activeSubTab === 'ayet'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Şifa Ayetleri & Sureler
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeSubTab === 'esma' ? 'Esma adı, mana, ebced ara...' : 'Ayet, sure, şifa meali ara...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(activeSubTab === 'esma' ? esmaCategories : ayetCategories).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategory === cat
                ? activeSubTab === 'esma'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PANEL 1: ESMALAR GRID */}
      {activeSubTab === 'esma' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEsmas.map((esma) => {
            const freq = esma.frequency || (esma as any).frequencyHz || 528;
            const ebced = (esma as any).ebced || esma.ebjed || 66;
            const benefit = (esma as any).benefits || esma.benefit || esma.spiritualSecret;
            const cat = (esma as any).category || esma.healingTarget || 'Genel Şifa';
            const letaif = (esma as any).associatedLetaif || esma.chakraCorrelation || 'Kalp Nuru';

            return (
              <div
                key={esma.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 group hover:shadow-xl hover:shadow-amber-950/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                        {esma.name}
                      </h3>
                      <span className="text-[11px] text-amber-400/80 font-medium">{cat}</span>
                    </div>
                    <span className="text-xl font-arabic text-amber-300/90 font-bold bg-slate-950/60 px-3 py-1 rounded-lg border border-amber-500/20">
                      {esma.arabic}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {esma.meaning}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-850 space-y-1 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Manevi Fayda:</span>
                      <span className="text-slate-300 font-medium text-right line-clamp-1">{benefit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Letaif / Çakra:</span>
                      <span className="text-indigo-300 font-medium">{letaif}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-amber-300">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold">{freq} Hz</span>
                    <span className="text-[10px] text-slate-500">(Ebced: {ebced})</span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectFrequency({
                        name: esma.name,
                        type: 'esma',
                        frequencyHz: freq,
                        details: esma,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Frekans Yükle</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PANEL 2: AYETLER VE SURELER GRID */}
      {activeSubTab === 'ayet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAyets.map((ayet) => {
            const title = (ayet as any).title || `${ayet.surah} Suresi (${ayet.verseNumber}. Ayet)`;
            const surahInfo = (ayet as any).surahInfo || `${ayet.surah} Suresi`;
            const meaning = (ayet as any).meaning || ayet.turkishTranslation;
            const benefit = (ayet as any).benefits || ayet.benefit;
            const field = (ayet as any).spiritualField || ayet.targetChakra || 'Kalp Nuru';

            return (
              <div
                key={ayet.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-4 group hover:shadow-xl hover:shadow-teal-950/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                        {title}
                      </h3>
                      <span className="text-[11px] text-teal-400/80 font-medium">{surahInfo} • {ayet.healingCategory}</span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-300">
                      {ayet.frequencyHz} Hz
                    </span>
                  </div>

                  {/* Arabic Text Display */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-850 mb-3 text-right">
                    <p className="text-base sm:text-lg font-arabic text-amber-200 leading-loose">
                      {ayet.arabic}
                    </p>
                  </div>

                  {/* Transcription & Meaning */}
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-200">
                      <strong>Meali:</strong> {meaning}
                    </p>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950/50 border border-slate-850 text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Tesir Alanı:</span>
                      <span className="text-teal-300 font-medium">{field}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Manevi Fayda:</span>
                      <span className="text-slate-300">{benefit}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Solfeggio & Biyo-Rezonans Dalgaları</span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectFrequency({
                        name: title,
                        type: 'ayet',
                        frequencyHz: ayet.frequencyHz,
                        details: ayet,
                      });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all hover:scale-105"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Frekansı Yükle</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
