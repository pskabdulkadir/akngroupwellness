import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Play, 
  Sparkles, 
  Radio, 
  Heart, 
  Compass, 
  Activity, 
  BookOpen, 
  ShieldCheck,
  CheckCircle2,
  Zap,
  Flame,
  Layers,
  ArrowRight,
  Wind,
  Moon,
  Music,
  Brain,
  Sliders
} from 'lucide-react';
import { ESMA_LIST } from '../data/esmaData';
import { AYET_LIST } from '../data/ayetData';
import { EASTERN_MANTRAS } from '../data/easternData';
import { DISEASE_HEALING_LIBRARY } from '../data/diseaseHealingLibrary';
import { LETAIF_POINTS } from '../data/letaifData';
import { 
  CHAKRA_HEALING_ITEMS, 
  ISLAMIC_HEALING_ITEMS, 
  SUFI_HEALING_ITEMS, 
  SHAMANIC_HEALING_ITEMS, 
  ELEMENT_HEALING_ITEMS, 
  CELTIC_HEALING_ITEMS,
  HealingItem
} from '../data/healingLibrary';
import { TreatmentSelection } from './FrequencyLoadingModal';

export type MenuCategory = 
  | 'all' 
  | 'islamic' 
  | 'sufi' 
  | 'chakras' 
  | 'eastern' 
  | 'disease' 
  | 'solfeggio' 
  | 'shamanic' 
  | 'elements' 
  | 'celtic'
  | 'brainwaves';

interface FrequencyMenuPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFrequency: (selection: TreatmentSelection) => void;
  onNavigateTab?: (tab: string) => void;
  initialCategory?: MenuCategory;
}

export const FrequencyMenuPickerModal: React.FC<FrequencyMenuPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFrequency,
  onNavigateTab,
  initialCategory = 'all',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  // 7 Chakras standard Solfeggio / Bija mapping
  const CHAKRA_ITEMS = useMemo(() => [
    { id: 'c1', name: 'Muladhara (Kök Çakra)', sub: 'LAM • Köklenme & Hayati Güven', hz: 396, color: '#ef4444' },
    { id: 'c2', name: 'Svadhisthana (Sakral Çakra)', sub: 'VAM • Duygusal Akış & Üretkenlik', hz: 417, color: '#f97316' },
    { id: 'c3', name: 'Manipura (Solar Pleksus)', sub: 'RAM • Özgüven & İrade Ateşi', hz: 528, color: '#eab308' },
    { id: 'c4', name: 'Anahata (Kalp Çakrası)', sub: 'YAM • Şifa-i Tâmme & Merhamet', hz: 639, color: '#10b981' },
    { id: 'c5', name: 'Vishuddha (Boğaz Çakrası)', sub: 'HAM • İfade & Hakikat Beyanı', hz: 741, color: '#06b6d4' },
    { id: 'c6', name: 'Ajna (Üçüncü Göz)', sub: 'OM • Basiret & İçsel Sezgi', hz: 852, color: '#6366f1' },
    { id: 'c7', name: 'Sahasrara (Taç Çakra)', sub: 'AUM • Tevhid & Kozmik Bütünlük', hz: 963, color: '#a855f7' },
  ], []);

  // Solfeggio items
  const SOLFEGGIO_ITEMS = useMemo(() => [
    { id: 's174', name: '174 Hz • Ağrı Giderme & Doğal Anestezi', hz: 174, category: 'Fiziksel Rahatlama' },
    { id: 's285', name: '285 Hz • Hücre Dokusu Onarımı & Kuantum Kalkan', hz: 285, category: 'Doku Yenilenmesi' },
    { id: 's396', name: '396 Hz • Korku & Suçluluktan Arınma (Kök Rezonans)', hz: 396, category: 'Köklenme' },
    { id: 's417', name: '417 Hz • Travma Çözülümü & Negatif Blokaj Temizliği', hz: 417, category: 'Dönüşüm' },
    { id: 's432', name: '432 Hz • Evrensel Doğal Akort & Zihinsel Dinginlik', hz: 432, category: 'Doğal Harmoni' },
    { id: 's528', name: '528 Hz • Mucize & DNA Hücresel Şifa (Aşk Frekansı)', hz: 528, category: 'Hücresel Şifa' },
    { id: 's639', name: '639 Hz • Kalp Genişliği, İlişkiler & Muhabbet', hz: 639, category: 'Kalp Rezonansı' },
    { id: 's741', name: '741 Hz • Toksin & Hücre Arınması, Sezgi Açılımı', hz: 741, category: 'Arınma & Basiret' },
    { id: 's852', name: '852 Hz • Ruhsal Farkındalık & Üçüncü Göz Aydınlanması', hz: 852, category: 'Sezgi' },
    { id: 's963', name: '963 Hz • Tevhid Nuru & Taç Çakra Zirve Rezonansı', hz: 963, category: 'Kozmik Birlik' },
  ], []);

  // Brainwave frequencies
  const BRAINWAVE_ITEMS = useMemo(() => [
    { id: 'bw-schumann', name: '7.83 Hz • Schumann Rezonansı (Dünya Kalp Atışı)', hz: 432, binaural: 7.83, category: 'Topraklanma & Küresel Uyum' },
    { id: 'bw-delta', name: '2.5 Hz Delta • Derin Yenilenme & Büyüme Hormonu', hz: 174, binaural: 2.5, category: 'Derin Uyku & Hücresel Onarım' },
    { id: 'bw-theta', name: '4.5 Hz Teta • Şamanik Trans & Bilinçaltı Arınması', hz: 528, binaural: 4.5, category: 'Derin Meditasyon' },
    { id: 'bw-alpha', name: '10.0 Hz Alfa • Zihinsel Berraklık & Dingin Odak', hz: 639, binaural: 10.0, category: 'Sakin Odaklanma' },
    { id: 'bw-beta', name: '15.0 Hz Beta • Bilişsel Hız & Yüksek Analiz Gücü', hz: 741, binaural: 15.0, category: 'Konsantrasyon & Mantık' },
    { id: 'bw-gamma', name: '40.0 Hz Gama • Kuantum İçgörü & Epifani Rezonansı', hz: 963, binaural: 40.0, category: 'Üst Bilinç & Farkındalık' },
  ], []);

  // Filtered lists
  const filteredEsmas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ESMA_LIST.filter(e => {
      const item = e as any;
      return !q || 
        (item.name && item.name.toLowerCase().includes(q)) || 
        (item.meaning && item.meaning.toLowerCase().includes(q)) || 
        (item.arabic && item.arabic.includes(q)) ||
        (item.frequency && item.frequency.toString().includes(q)) || 
        (item.frequencyHz && item.frequencyHz.toString().includes(q)) || 
        (item.category && item.category.toLowerCase().includes(q));
    });
  }, [searchQuery]);

  const filteredAyets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return AYET_LIST.filter(a => {
      const item = a as any;
      return !q || 
        (item.name && item.name.toLowerCase().includes(q)) || 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.turkish && item.turkish.toLowerCase().includes(q)) || 
        (item.meaning && item.meaning.toLowerCase().includes(q)) || 
        (item.frequency && item.frequency.toString().includes(q)) ||
        (item.frequencyHz && item.frequencyHz.toString().includes(q));
    });
  }, [searchQuery]);

  const filteredMantras = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return EASTERN_MANTRAS.filter(m => {
      const item = m as any;
      return !q || 
        (item.name && item.name.toLowerCase().includes(q)) || 
        (item.benefit && item.benefit.toLowerCase().includes(q)) || 
        (item.meaning && item.meaning.toLowerCase().includes(q)) || 
        (item.bijaSound && item.bijaSound.toLowerCase().includes(q)) || 
        (item.frequencyHz && item.frequencyHz.toString().includes(q));
    });
  }, [searchQuery]);

  const filteredDiseases = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return DISEASE_HEALING_LIBRARY.filter(d => {
      const item = d as any;
      return !q || 
        (item.name && item.name.toLowerCase().includes(q)) || 
        (item.diseaseName && item.diseaseName.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) || 
        (item.benefits && item.benefits.toLowerCase().includes(q)) || 
        (item.healingBenefits && item.healingBenefits.toLowerCase().includes(q)) || 
        (item.primaryFrequency && item.primaryFrequency.toString().includes(q)) ||
        (item.primaryFrequencyHz && item.primaryFrequencyHz.toString().includes(q));
    });
  }, [searchQuery]);

  const filteredSufi = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SUFI_HEALING_ITEMS.filter(s => 
      !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.frequencyHz.toString().includes(q) || (s.makamOrScale && s.makamOrScale.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const filteredShamanic = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SHAMANIC_HEALING_ITEMS.filter(s => 
      !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.frequencyHz.toString().includes(q)
    );
  }, [searchQuery]);

  const filteredElements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ELEMENT_HEALING_ITEMS.filter(e => 
      !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.frequencyHz.toString().includes(q)
    );
  }, [searchQuery]);

  const filteredCeltic = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CELTIC_HEALING_ITEMS.filter(c => 
      !q || c.title.toLowerCase().includes(c.title.toLowerCase()) || c.description.toLowerCase().includes(q) || c.frequencyHz.toString().includes(q) || (c.treeOrRune && c.treeOrRune.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const filteredLetaif = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return LETAIF_POINTS.filter(l => 
      !q || l.name.toLowerCase().includes(q) || l.esma.toLowerCase().includes(q) || l.esmaFrequency.toString().includes(q) || l.spiritualMeaning.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredChakras = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CHAKRA_ITEMS.filter(c => 
      !q || c.name.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q) || c.hz.toString().includes(q)
    );
  }, [searchQuery]);

  const filteredSolfeggio = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SOLFEGGIO_ITEMS.filter(s => 
      !q || s.name.toLowerCase().includes(q) || s.hz.toString().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredBrainwaves = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return BRAINWAVE_ITEMS.filter(b => 
      !q || b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.hz.toString().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl shadow-indigo-950/60 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">Evrensel Frekans & Şifa Menüsü</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                  300+ Biyo-Rezonans Frekansı
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aura taramanıza entegre etmek istediğiniz şifa frekansını seçip doğrudan yükleyin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Pencereyi Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Frekans adı, Esma, Hastalık, Çakra, Makam veya Hz (örn: 528, Er-Rahmân, Rast, Migren)..."
              className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Categories Tab Pill Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🌟 Tümü (300+)
            </button>
            <button
              onClick={() => setSelectedCategory('islamic')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'islamic'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🕌 İslami & 99 Esma
            </button>
            <button
              onClick={() => setSelectedCategory('sufi')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'sufi'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🎶 Sufi Makam & Letaif
            </button>
            <button
              onClick={() => setSelectedCategory('chakras')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'chakras'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🌈 7 Çakra & Bija
            </button>
            <button
              onClick={() => setSelectedCategory('eastern')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'eastern'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🧘 Doğu Mantraları
            </button>
            <button
              onClick={() => setSelectedCategory('disease')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'disease'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              💊 50+ Biyo-Denge & Rife
            </button>
            <button
              onClick={() => setSelectedCategory('solfeggio')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'solfeggio'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🔬 Solfeggio Skalası
            </button>
            <button
              onClick={() => setSelectedCategory('brainwaves')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'brainwaves'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🧠 Beyin Dalgaları & Schumann
            </button>
            <button
              onClick={() => setSelectedCategory('shamanic')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'shamanic'
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🦅 Şamanik Ritim
            </button>
            <button
              onClick={() => setSelectedCategory('elements')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'elements'
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🌋 5 Element
            </button>
            <button
              onClick={() => setSelectedCategory('celtic')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'celtic'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🌳 Kelt Ogham
            </button>
          </div>
        </div>

        {/* Content List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">

          {/* 1. İSLAMİ ESMA & AYETLER */}
          {(selectedCategory === 'all' || selectedCategory === 'islamic') && (filteredEsmas.length > 0 || filteredAyets.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>İslami Şifa & 99 Esma-i Hüsna ({filteredEsmas.length})</span>
                </h4>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab('islamic');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>İslami Panele Git</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredEsmas.slice(0, selectedCategory === 'islamic' ? 99 : 6).map((esma) => (
                  <div key={esma.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-100">{esma.name}</h5>
                        <span className="text-xs font-arabic text-amber-300">{esma.arabic}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{esma.frequencyHz} Hz • {esma.benefits || esma.meaning}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: esma.name,
                          type: 'esma',
                          frequencyHz: esma.frequencyHz ?? 0,
                          details: esma,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. SUFİ MAKAM TERAPİSİ & 5 LETAİF */}
          {(selectedCategory === 'all' || selectedCategory === 'sufi') && (filteredSufi.length > 0 || filteredLetaif.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-cyan-400" />
                  <span>Sufi Makam Terapisi & 5 Letaif Nurları ({filteredSufi.length + filteredLetaif.length})</span>
                </h4>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab('letaif');
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>Letaif Paneline Git</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Letaif Points */}
                {filteredLetaif.map((letItem) => (
                  <div key={letItem.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: letItem.colorHex }} />
                      <div>
                        <h5 className="text-xs font-bold text-slate-100">{letItem.name} ({letItem.arabicName})</h5>
                        <span className="text-[10px] text-slate-400">{letItem.esmaFrequency} Hz • {letItem.esma}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: `${letItem.name} (${letItem.esma})`,
                          type: 'letaif',
                          frequencyHz: letItem.esmaFrequency,
                          details: letItem,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}

                {/* Sufi Makams */}
                {filteredSufi.slice(0, selectedCategory === 'sufi' ? 30 : 6).map((sufi) => (
                  <div key={sufi.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-100">{sufi.title}</h5>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{sufi.frequencyHz} Hz • {sufi.makamOrScale} • {sufi.description}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: sufi.title,
                          type: 'frequency',
                          frequencyHz: sufi.frequencyHz,
                          details: sufi,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 7 ÇAKRA & BİJA MANTRALARI */}
          {(selectedCategory === 'all' || selectedCategory === 'chakras') && filteredChakras.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-rose-400" />
                  <span>7 Çakra Bija & Solfeggio Frekansları</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredChakras.map((chakra) => (
                  <div key={chakra.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-rose-500/40 transition-all flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow" style={{ backgroundColor: chakra.color }} />
                      <div>
                        <h5 className="text-xs font-bold text-slate-100">{chakra.name}</h5>
                        <span className="text-[10px] text-slate-400">{chakra.hz} Hz • {chakra.sub}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: `${chakra.name} (${chakra.hz} Hz)`,
                          type: 'mantra',
                          frequencyHz: chakra.hz,
                          details: chakra,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. UZAK DOĞU & TİBET MANTRALARI */}
          {(selectedCategory === 'all' || selectedCategory === 'eastern') && filteredMantras.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Uzak Doğu & Tibet Mantraları ({filteredMantras.length})</span>
                </h4>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab('eastern');
                    }}
                    className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>Doğu Paneline Git</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMantras.slice(0, selectedCategory === 'eastern' ? 40 : 6).map((mantra) => (
                  <div key={mantra.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-orange-500/40 transition-all flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-100">{mantra.name}</h5>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{mantra.frequencyHz} Hz • {mantra.bijaSound || mantra.meaning}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: mantra.name,
                          type: 'mantra',
                          frequencyHz: mantra.frequencyHz,
                          details: mantra,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. 50+ BİYO-DENGE & ŞİFA KÜTÜPHANESİ & RİFE */}
          {(selectedCategory === 'all' || selectedCategory === 'disease') && filteredDiseases.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>50+ Biyo-Denge & Rife Şifa Kütüphanesi ({filteredDiseases.length})</span>
                </h4>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab('healing');
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>Şifa Matrisine Git</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDiseases.slice(0, selectedCategory === 'disease' ? 50 : 6).map((disease) => (
                  <div key={disease.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-100">{disease.diseaseName}</h5>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px]">{disease.category}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{disease.primaryFrequencyHz} Hz • {disease.healingBenefits}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: `${disease.diseaseName} Şifa Protokolü`,
                          type: 'frequency',
                          frequencyHz: disease.primaryFrequencyHz,
                          details: disease,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. SOLFEGGIO SKALASI */}
          {(selectedCategory === 'all' || selectedCategory === 'solfeggio') && filteredSolfeggio.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-teal-400" />
                  <span>Kadim Solfeggio & Kuantum Biyo-Rezonans Skalası</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSolfeggio.map((solf) => (
                  <div key={solf.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 transition-all flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-100">{solf.name}</h5>
                      <span className="text-[10px] text-teal-400">{solf.category}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: solf.name,
                          type: 'frequency',
                          frequencyHz: solf.hz,
                          details: solf,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. BEYİN DALGALARI & SCHUMANN */}
          {(selectedCategory === 'all' || selectedCategory === 'brainwaves') && filteredBrainwaves.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>Beyin Dalgaları & Schumann Rezonansı</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredBrainwaves.map((bw) => (
                  <div key={bw.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 transition-all flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-100">{bw.name}</h5>
                      <span className="text-[10px] text-purple-400">{bw.category}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: bw.name,
                          type: 'frequency',
                          frequencyHz: bw.hz,
                          details: bw,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. ŞAMANİK RİTİM & DOĞA */}
          {(selectedCategory === 'all' || selectedCategory === 'shamanic') && filteredShamanic.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-amber-400" />
                  <span>Orta Asya & Şamanik Davul Transı ({filteredShamanic.length})</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredShamanic.slice(0, selectedCategory === 'shamanic' ? 30 : 6).map((item) => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-600/40 transition-all flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-100">{item.title}</h5>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{item.frequencyHz} Hz • {item.description}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: item.title,
                          type: 'frequency',
                          frequencyHz: item.frequencyHz,
                          details: item,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. 5 KADİM ELEMENT */}
          {(selectedCategory === 'all' || selectedCategory === 'elements') && filteredElements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>5 Kadim Element & Hermetik Simya ({filteredElements.length})</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredElements.slice(0, selectedCategory === 'elements' ? 30 : 6).map((elem) => (
                  <div key={elem.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-yellow-500/40 transition-all flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-100">{elem.title}</h5>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{elem.frequencyHz} Hz • {elem.description}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: elem.title,
                          type: 'frequency',
                          frequencyHz: elem.frequencyHz,
                          details: elem,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. KELT & DRUİD OGHAM */}
          {(selectedCategory === 'all' || selectedCategory === 'celtic') && filteredCeltic.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-emerald-400" />
                  <span>Kelt Ogham Ağaçları & Kutsal Pınar Frekansları ({filteredCeltic.length})</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCeltic.slice(0, selectedCategory === 'celtic' ? 30 : 6).map((celt) => (
                  <div key={celt.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-600/40 transition-all flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-100">{celt.title}</h5>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{celt.frequencyHz} Hz • {celt.treeOrRune} • {celt.description}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectFrequency({
                          name: celt.title,
                          type: 'frequency',
                          frequencyHz: celt.frequencyHz,
                          details: celt,
                        });
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Yükle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            Seçtiğiniz frekans biyo-alanınıza anında aktarılacak ve tarama raporunuza entegre edilecektir.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
