import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Compass,
  BookOpen,
  Radio,
  Moon,
  Search,
  Play,
  Square,
  Volume2,
  VolumeX,
  Sliders,
  CheckCircle2,
  Send,
  Shuffle,
  Tag,
  Layers,
  Clock,
  Music,
  Wind,
  ShieldCheck,
  Zap,
  Activity,
  HeartHandshake,
  Filter,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  HealingCategoryKey,
  HealingItem,
  HEALING_CATEGORIES,
  ALL_HEALING_ITEMS,
  getAllHealingItemsFlat,
  TOTAL_HEALING_COUNT,
} from '../data/healingLibrary';
import { soundEngine } from '../utils/soundEngine';
import { TreatmentSelection } from './FrequencyLoadingModal';
import { PageNavBar } from './PageNavBar';

interface AncientHealingMatrixProps {
  initialCategory?: HealingCategoryKey | 'all';
  onSelectFrequency: (selection: TreatmentSelection) => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export const AncientHealingMatrix: React.FC<AncientHealingMatrixProps> = ({
  initialCategory = 'all',
  onSelectFrequency,
  onGoBack,
  onGoHome,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<HealingCategoryKey | 'all'>(() => {
    try {
      const stored = localStorage.getItem('aurabio_healing_cat');
      if (stored && (stored === 'all' || HEALING_CATEGORIES.some((c) => c.key === stored))) {
        return stored as HealingCategoryKey | 'all';
      }
    } catch {}
    return initialCategory;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedNatureLayer, setSelectedNatureLayer] = useState<string>('all');
  const [selectedSoundType, setSelectedSoundType] = useState<string>('all');
  const [masterVolume, setMasterVolume] = useState<number>(0.5);
  const [activeItem, setActiveItem] = useState<HealingItem | null>(() => soundEngine.getActiveHealingItem());
  const [isPlaying, setIsPlaying] = useState<boolean>(() => soundEngine.getIsPlaying());
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);

  const handleCategoryChange = (catKey: HealingCategoryKey | 'all') => {
    setSelectedCategory(catKey);
    setSelectedTag('all');
    try {
      localStorage.setItem('aurabio_healing_cat', catKey);
    } catch {}
  };

  // Sync with sound engine status
  useEffect(() => {
    const timer = setInterval(() => {
      setIsPlaying(soundEngine.getIsPlaying());
      setActiveItem(soundEngine.getActiveHealingItem());
    }, 300);
    return () => clearInterval(timer);
  }, []);

  // Category items list
  const currentCategoryItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return getAllHealingItemsFlat();
    }
    return ALL_HEALING_ITEMS[selectedCategory] || [];
  }, [selectedCategory]);

  // Extract all unique tags for active category
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    currentCategoryItems.forEach(item => {
      item.tags?.forEach(t => set.add(t));
    });
    return Array.from(set).slice(0, 20);
  }, [currentCategoryItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return currentCategoryItems.filter(item => {
      // Search match
      const matchesSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.frequencyHz ? item.frequencyHz.toString().includes(q) : false) ||
        (item.bijaOrDhikr && item.bijaOrDhikr.toLowerCase().includes(q)) ||
        (item.traditionOrOrigin && item.traditionOrOrigin.toLowerCase().includes(q)) ||
        (item.benefits && item.benefits.toLowerCase().includes(q)) ||
        (item.makamOrScale && item.makamOrScale.toLowerCase().includes(q)) ||
        (item.treeOrRune && item.treeOrRune.toLowerCase().includes(q)) ||
        (item.elementOrChakra && item.elementOrChakra.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)));

      // Tag match
      const matchesTag = selectedTag === 'all' || (item.tags && item.tags.includes(selectedTag));

      // Nature Layer match
      const matchesNature =
        selectedNatureLayer === 'all' ||
        (selectedNatureLayer === 'none' && (!item.natureLayer || item.natureLayer === 'none')) ||
        item.natureLayer === selectedNatureLayer;

      // Sound Type match
      const matchesSoundType = selectedSoundType === 'all' || item.soundType === selectedSoundType;

      return matchesSearch && matchesTag && matchesNature && matchesSoundType;
    });
  }, [currentCategoryItems, searchQuery, selectedTag, selectedNatureLayer, selectedSoundType]);

  // Handle Play directly in real-time
  const handleTogglePlay = async (item: HealingItem) => {
    if (activeItem?.id === item.id && isPlaying) {
      soundEngine.stop();
      setActiveItem(null);
      setIsPlaying(false);
    } else {
      await soundEngine.startHealingItemSession(item, masterVolume);
      setActiveItem(item);
      setIsPlaying(true);
    }
  };

  // Transmit directly into camera HUD
  const handleTransmitToCamera = (item: HealingItem) => {
    const selection: TreatmentSelection = {
      type: 'healing',
      name: item.title,
      frequencyHz: item.frequencyHz,
      details: item,
      targetLetaif: item.elementOrChakra || item.makamOrScale || item.treeOrRune || item.traditionOrOrigin || 'Biyo-Alan Uyumu',
      durationSeconds: (item.durationMinutes || 15) * 60,
      description: item.description,
      benefits: item.benefits || 'Biyo-alan dengesi ve ruhsal frekans aktarımı',
    };
    onSelectFrequency(selection);
  };

  // Roll a random frequency
  const handleRandomPick = () => {
    if (filteredItems.length === 0) return;
    const random = filteredItems[Math.floor(Math.random() * filteredItems.length)];
    handleTogglePlay(random);
  };

  // Category Icon Resolver
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Compass': return <Compass className="w-4 h-4" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'Radio': return <Radio className="w-4 h-4" />;
      case 'Moon': return <Moon className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header Navigation */}
      <PageNavBar
        title="Evrensel 6'lı Kadim Şifa & Frekans Kütüphanesi"
        subtitle="302+ Akustik Frekans, Makam, Nefes & Kadim Ekol Sentezi"
        icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
        badge={`${filteredItems.length} / ${TOTAL_HEALING_COUNT} Frekans`}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />

      {/* Hero Banner & Live Sound status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/70 border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Web Audio API Canlı Frekans Sentezi • Gerçek Zamanlı Stereo Ayrımı
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Kadim Bilgelik & 6 Ana Frekans Ekolü
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              İslami Esma & Şifa Sureleri, 7 Çakra Solfejyo Matrisi, 5 Kadim Element, Anadolu Sufi Mûsikîsi, Şamanik Davul Teta Transı ve Keltik Doğal Akustiği arasından dilediğiniz şifa tınısını seçip anında dinleyin veya kameraya aktarın.
            </p>
          </div>

          {/* Quick Actions & Randomizer */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
            <button
              onClick={handleRandomPick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              Günün Frekansı (Rastgele)
            </button>

            {isPlaying && (
              <button
                onClick={() => soundEngine.stop()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-rose-400 text-rose-400" />
                Sesi Durdur
              </button>
            )}
          </div>
        </div>

        {/* Live Active Playing Mini Bar */}
        {isPlaying && activeItem && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-950/30 -mx-5 -mb-5 p-5 rounded-b-3xl border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 animate-pulse">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-bold tracking-wide uppercase">Şu An Oynatılıyor:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[11px] font-mono">
                    {activeItem.frequencyHz} Hz {activeItem.binauralBeat ? `+ ${activeItem.binauralBeat}Hz Binaural` : ''}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">{activeItem.title}</h4>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Volume Slider */}
              <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setMasterVolume(v);
                    soundEngine.setVolume(v);
                  }}
                  className="w-20 accent-emerald-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <span className="text-[11px] text-slate-300 font-mono w-7 text-right">
                  {Math.round(masterVolume * 100)}%
                </span>
              </div>

              <button
                onClick={() => handleTransmitToCamera(activeItem)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                HUD'a Aktar
              </button>

              <button
                onClick={() => soundEngine.stop()}
                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 cursor-pointer"
                title="Durdur"
              >
                <Square className="w-4 h-4 fill-rose-400 text-rose-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6-School Category Grid Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {/* 'All' Tab Button */}
        <button
          onClick={() => handleCategoryChange('all')}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5 mb-1 text-emerald-400" />
          <span className="text-xs font-bold">Tüm Ekoller</span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">({TOTAL_HEALING_COUNT})</span>
        </button>

        {/* 6 Schools Buttons */}
        {HEALING_CATEGORIES.map((cat) => {
          const isCatSelected = selectedCategory === cat.id;
          const count = (cat.id && ALL_HEALING_ITEMS[cat.id as HealingCategoryKey]?.length) || cat.totalCount;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id as HealingCategoryKey)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                isCatSelected
                  ? `bg-slate-900 border-emerald-500/60 text-slate-100 shadow-lg ring-1 ring-emerald-500/30`
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <div
                className="p-1.5 rounded-lg mb-1"
                style={{ color: cat.accentColor, backgroundColor: `${cat.accentColor}20` }}
              >
                {getCategoryIcon(cat.iconName)}
              </div>
              <span className="text-xs font-bold truncate max-w-[120px]">{cat.shortTitle}</span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-3 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Frekans (Hz), Esma, Çakra, Makam, Rün, Element veya Fayda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Nature Sound Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-cyan-400" /> Doğa Katmanı:
            </span>
            <select
              value={selectedNatureLayer}
              onChange={(e) => setSelectedNatureLayer(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tüm Katmanlar</option>
              <option value="ocean">🌊 Okyanus Dalgaları</option>
              <option value="rain">🌧️ Orman Yağmuru</option>
              <option value="campfire">🔥 Gece Kamp Ateşi</option>
              <option value="tibetan_bowls">🔔 Tibet Çanakları</option>
              <option value="none">Sadece Saf Ton</option>
            </select>
          </div>

          {/* Sound Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-amber-400" /> Ses Türü:
            </span>
            <select
              value={selectedSoundType}
              onChange={(e) => setSelectedSoundType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tüm Enstrümanlar</option>
              <option value="binaural">Çift Kanallı Binaural</option>
              <option value="ney">Ney & Sufi Nağmesi</option>
              <option value="drum">Şamanik Davul & Ritim</option>
              <option value="celtic_harp">Keltik Gümüş Arp</option>
              <option value="tagelharpa">İskandinav Yaylısı</option>
              <option value="sine">Saf Sinüs Dalgası</option>
            </select>
          </div>
        </div>

        {/* Quick Tag Pills */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
            <span className="text-slate-500 text-[11px] font-medium shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Hızlı Etiketler:
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                selectedTag === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Tümü
            </button>
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Count Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Toplam <strong className="text-emerald-400">{filteredItems.length}</strong> şifa frekansı listelendi
        </div>
        {searchQuery && (
          <div>
            «{searchQuery}» için arama sonuçları
          </div>
        )}
      </div>

      {/* Frequency Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isItemPlaying = isPlaying && activeItem?.id === item.id;

          return (
            <div
              key={item.id}
              className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all duration-200 bg-slate-900/80 backdrop-blur-md ${
                isItemPlaying
                  ? 'border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/40'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850/90'
              }`}
            >
              {/* Card Header & Frequency Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-wide shadow-sm"
                      style={{
                        backgroundColor: item.themeColorHex ? `${item.themeColorHex}25` : '#10b98125',
                        color: item.themeColorHex || '#10b981',
                        border: `1px solid ${item.themeColorHex ? `${item.themeColorHex}50` : '#10b98150'}`,
                      }}
                    >
                      {item.frequencyHz} Hz
                    </span>

                    {item.binauralBeat && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono">
                        +{item.binauralBeat}Hz Binaural
                      </span>
                    )}

                    {item.bpm && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono">
                        {item.bpm} BPM
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {item.durationMinutes} dk
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug">
                  {item.title}
                </h3>

                {/* Subtitle / Metadata Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  {item.bijaOrDhikr && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                      Zikir/Mantra: {item.bijaOrDhikr}
                    </span>
                  )}
                  {item.makamOrScale && (
                    <span className="px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                      {item.makamOrScale}
                    </span>
                  )}
                  {item.treeOrRune && (
                    <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      {item.treeOrRune}
                    </span>
                  )}
                  {item.elementOrChakra && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {item.elementOrChakra}
                    </span>
                  )}
                  {item.traditionOrOrigin && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.traditionOrOrigin}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {item.description}
                </p>

                {/* Benefits Note */}
                {item.benefits && (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-emerald-300/90 leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Şifa Etkisi:</strong> {item.benefits}</span>
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.map(t => (
                      <span
                        key={t}
                        onClick={() => setSelectedTag(t)}
                        className="text-[10px] text-slate-400 bg-slate-950 hover:text-slate-200 px-2 py-0.5 rounded border border-slate-800 cursor-pointer"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                
                {/* Play / Stop Button */}
                <button
                  onClick={() => handleTogglePlay(item)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md ${
                    isItemPlaying
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-950/50'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50'
                  }`}
                >
                  {isItemPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-white text-white" />
                      Durdur
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      Canlı Dinle
                    </>
                  )}
                </button>

                {/* Transmit to Camera HUD */}
                <button
                  onClick={() => handleTransmitToCamera(item)}
                  className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  title="Bu frekansı kamera biyo-alan tarama ekranında HUD aktarımı olarak yükle"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Kamerada</span> Aktar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">Aradığınız kriterlere uygun frekans bulunamadı</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Arama terimini değiştirebilir veya filtreleri sıfırlayarak 302+ kadim şifa frekansını görüntüleyebilirsiniz.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTag('all');
              setSelectedNatureLayer('all');
              setSelectedSoundType('all');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      )}
    </div>
  );
};
