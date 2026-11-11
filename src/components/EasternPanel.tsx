import React, { useState } from 'react';
import { 
  Sparkles, 
  Radio, 
  Flame, 
  Wind, 
  Droplets, 
  Mountain, 
  CircleDot, 
  Search, 
  Play, 
  Compass,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { EASTERN_MANTRAS, MYTHOLOGICAL_ELEMENTS } from '../data/easternData';
import { EasternMantraItem, MythologicalElementItem } from '../types';
import { TreatmentSelection } from './FrequencyLoadingModal';
import { PageNavBar } from './PageNavBar';

interface EasternPanelProps {
  initialSubTab?: 'mantras' | 'elements';
  onSelectFrequency: (selection: TreatmentSelection) => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export const EasternPanel: React.FC<EasternPanelProps> = ({
  initialSubTab = 'mantras',
  onSelectFrequency,
  onGoBack,
  onGoHome,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'mantras' | 'elements'>(() => {
    try {
      const stored = localStorage.getItem('aurabio_eastern_subtab');
      if (stored === 'mantras' || stored === 'elements') return stored;
    } catch {}
    return initialSubTab;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

  const handleSubTabChange = (tab: 'mantras' | 'elements') => {
    setActiveSubTab(tab);
    setSelectedCategory('Tümü');
    try {
      localStorage.setItem('aurabio_eastern_subtab', tab);
    } catch {}
  };

  const mantraCategories = ['Tümü', 'Çakra Dengeleme', 'Prana Akışı', 'Kundalini Uyumlama', 'Zihinsel Aydınlanma'];
  const elementCategories = ['Tümü', '5 Kadim Element', 'Mitolojik Arketipler'];

  const filteredMantras = EASTERN_MANTRAS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bijaSound?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meaning?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetChakra?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'Tümü' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredElements = MYTHOLOGICAL_ELEMENTS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.archetype.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.attributes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sanskritName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'Tümü' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Navigation Bar with Back & Home Buttons */}
      <PageNavBar
        title={activeSubTab === 'mantras' ? 'Panel B: Uzak Doğu & Çakra' : 'Panel C: 5 Kadim Element'}
        subtitle={activeSubTab === 'mantras' ? 'Bija Kök Sesleri, Kundalini & 7 Çakra' : 'Kadim Doğu Elementleri & Mitolojik Arketipler'}
        icon={activeSubTab === 'mantras' ? <Compass className="w-4 h-4 text-orange-400" /> : <Flame className="w-4 h-4 text-cyan-400" />}
        badge={activeSubTab === 'mantras' ? `${EASTERN_MANTRAS.length} Mantra` : `${MYTHOLOGICAL_ELEMENTS.length} Element`}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30">
              <Compass className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
              {activeSubTab === 'mantras' ? 'Uzak Doğu & Hindu Çakra Mantraları' : 'Mitolojik 5 Element & Arketipik Frekanslar'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {activeSubTab === 'mantras' 
              ? 'Bija kök sesleri (LAM, VAM, RAM, YAM, HAM, OM), Prana ve Kundalini omurga uyumlama frekansları.'
              : 'Kadim Doğu mitolojisindeki Toprak, Su, Ateş, Hava, Eter elementleri ve arketipik ses dalgaları.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => handleSubTabChange('mantras')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'mantras'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CircleDot className="w-4 h-4 text-orange-400" />
            <span>Panel B: Çakra & Prana ({EASTERN_MANTRAS.length})</span>
          </button>

          <button
            onClick={() => handleSubTabChange('elements')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'elements'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Panel C: 5 Element & Mitoloji ({MYTHOLOGICAL_ELEMENTS.length})</span>
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'mantras'
                ? "Mantra adı, Bija sesi veya çakra ara (Örn: LAM, Anahata, Kundalini)..."
                : "Element veya arketip adı ara (Örn: Agni, Anka, Su, Akasha)..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {(activeSubTab === 'mantras' ? mantraCategories : elementCategories).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PANEL B: UZAK DOĞU & HINDU MANTRALARI GRID */}
      {activeSubTab === 'mantras' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMantras.map((mantra) => (
            <div
              key={mantra.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-orange-500/40 transition-all flex flex-col justify-between space-y-4 group hover:shadow-xl hover:shadow-orange-950/20"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-orange-300 transition-colors">
                      {mantra.name}
                    </h3>
                    <span className="text-[11px] text-orange-400/80 font-medium">{mantra.category} • {mantra.targetChakra}</span>
                  </div>
                  <span className="text-xl font-bold font-arabic text-amber-300 bg-slate-950/60 px-3 py-1 rounded-lg border border-amber-500/20">
                    {mantra.sanskrit}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-orange-950/20 border border-orange-500/30 mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-300">{mantra.bijaSound}</span>
                  <span className="text-[11px] font-mono text-slate-400">{mantra.harmonicNote}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {mantra.meaning}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-850 space-y-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Manevi Tesir:</span>
                    <span className="text-slate-200 font-medium text-right line-clamp-1">{mantra.benefits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Meditasyon Rehberi:</span>
                    <span className="text-indigo-300 font-medium text-right line-clamp-1">{mantra.meditationGuide}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Action */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 font-mono text-xs text-orange-300">
                  <Radio className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-bold">{mantra.frequencyHz} Hz</span>
                </div>

                <button
                  onClick={() => {
                    onSelectFrequency({
                      name: mantra.name,
                      type: 'mantra',
                      frequencyHz: mantra.frequencyHz,
                      details: mantra,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Frekansı Yükle</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PANEL C: MİTOLOJİK 5 ELEMENT & ARKETİPLER GRID */}
      {activeSubTab === 'elements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredElements.map((elem) => (
            <div
              key={elem.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group hover:shadow-xl hover:shadow-cyan-950/20"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {elem.name}
                    </h3>
                    <span className="text-[11px] text-cyan-400/80 font-medium">{elem.category} • {elem.archetype}</span>
                  </div>
                  <span className="text-2xl p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {elem.elementSymbol}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {elem.attributes}
                </p>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Aurik & Biyo-Fiziksel Etki:</span>
                    <span className="text-emerald-300 font-medium">{elem.effects}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Kutsal Ses & Frekans Karakteristiği:</span>
                    <span className="text-slate-200">{elem.sacredSound}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 font-mono text-xs text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold">{elem.frequencyHz} Hz</span>
                </div>

                <button
                  onClick={() => {
                    onSelectFrequency({
                      name: elem.name,
                      type: 'element',
                      frequencyHz: elem.frequencyHz,
                      details: elem,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Element Frekansı Yükle</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
