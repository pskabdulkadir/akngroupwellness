import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft,
  Search, 
  Sparkles, 
  Play, 
  Square, 
  Activity, 
  BookOpen, 
  FileCheck2, 
  Filter, 
  Volume2, 
  Headphones, 
  Clock, 
  Compass, 
  Info,
  Layers,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { 
  DISEASE_HEALING_LIBRARY, 
  DISEASE_CATEGORIES, 
  DiseaseCategoryFilter, 
  DiseaseHealingProtocol, 
  filterDiseases,
  TOTAL_DISEASE_COUNT
} from '../data/diseaseHealingLibrary';
import { soundEngine } from '../utils/soundEngine';

interface HealingEncyclopediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  onSelectDiseaseForDetail: (disease: DiseaseHealingProtocol) => void;
  onStartScanWorkflow: (disease: DiseaseHealingProtocol) => void;
}

export const HealingEncyclopediaModal: React.FC<HealingEncyclopediaModalProps> = ({
  isOpen,
  onClose,
  onGoBack,
  onSelectDiseaseForDetail,
  onStartScanWorkflow,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<DiseaseCategoryFilter>('Tümü');
  const [playingDiseaseId, setPlayingDiseaseId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredDiseases = filterDiseases(searchQuery, selectedCategory);

  const handleTogglePlay = async (disease: DiseaseHealingProtocol, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingDiseaseId === disease.id) {
      soundEngine.stopAll();
      setPlayingDiseaseId(null);
    } else {
      const binaural = disease.binauralBeatHz || (disease.secondaryFrequencies && disease.secondaryFrequencies[0]) || 7.83;
      let wave: 'theta' | 'alpha' | 'beta' | 'gamma' | 'delta' = 'alpha';
      if (binaural < 4) wave = 'delta';
      else if (binaural < 8) wave = 'theta';
      else if (binaural < 13) wave = 'alpha';
      else if (binaural < 30) wave = 'beta';
      else wave = 'gamma';

      await soundEngine.unlockAudio();
      soundEngine.startAdaptiveBioFrequency(
        disease.primaryFrequency || (disease as any).primaryFrequencyHz || 528,
        binaural,
        wave,
        0.55,
        (disease.soundscapePreset as any) || 'ocean'
      );
      setPlayingDiseaseId(disease.id);
    }
  };

  const handleClose = () => {
    if (playingDiseaseId) {
      soundEngine.stopAll();
      setPlayingDiseaseId(null);
    }
    onClose();
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Nörolojik': return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'Kardiyovasküler': return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      case 'Metabolik': return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'Psikosomatik': return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      case 'İskelet-Kas': return 'bg-teal-950/80 text-teal-300 border-teal-500/40';
      case 'Bağışıklık': return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'Kadim & Enerjetik': return 'bg-yellow-950/80 text-yellow-300 border-yellow-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              onClick={() => {
                handleClose();
                if (onGoBack) onGoBack();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95 shrink-0"
              title="Geri Dön"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Geri</span>
            </button>

            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950 shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">
                  AKN GLOBAL GROUP LTD • ŞİFA ANSİKLOPEDİSİ
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  {TOTAL_DISEASE_COUNT}+ Evrensel Frekans Matrisi
                </span>
              </div>
              <h2 className="text-base sm:text-2xl font-bold text-slate-100 mt-0.5">
                🌿 Evrensel Hastalık & Şifa Frekans Matrisi
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {playingDiseaseId && (
              <button
                onClick={() => {
                  soundEngine.stop();
                  setPlayingDiseaseId(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/40 text-xs font-bold animate-pulse cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Sesi Kapat</span>
              </button>
            )}

            <button
              onClick={handleClose}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Category Filter Strip */}
        <div className="p-4 sm:p-5 bg-slate-950/95 border-b border-slate-800/90 space-y-3 shrink-0">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hastalık adı, semptom, organ, frekans (Hz) veya kadim ekol arayın (Örn: Migren, Tansiyon, 528 Hz, Sufi, Rife, Çakra)..."
              className="w-full pl-12 pr-10 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500/80 text-slate-100 text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {DISEASE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = cat === 'Tümü' 
                ? TOTAL_DISEASE_COUNT 
                : DISEASE_HEALING_LIBRARY.filter(d => d.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950 scale-102'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Informative Intro Banner */}
        <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-blue-950/30 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Tüm ekoller (Sufi Tıbbı, Ayurveda, Çin Tıbbı, Solfejyo, Rife) tek çatı altında. Her hastalık için <strong className="text-emerald-300">10 Sn Ön/Son Tarama</strong> yapabilir ve <strong className="text-emerald-300">Karşılaştırma Raporu</strong> alabilirsiniz.
            </span>
          </div>
          <span className="hidden md:inline font-mono text-emerald-400/80 font-bold">
            {filteredDiseases.length} Protokol Listelendi
          </span>
        </div>

        {/* Disease Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-900/50">
          {filteredDiseases.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-300">Aradığınız kriterlere uygun protokol bulunamadı</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Farklı bir hastalık ismi, kategori veya frekans değeri (Örn: "Uykusuzluk", "432 Hz", "Sufi") deneyiniz.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Tümü');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDiseases.map((disease) => {
                const isThisPlaying = playingDiseaseId === disease.id;

                return (
                  <div
                    key={disease.id}
                    onClick={() => onSelectDiseaseForDetail(disease)}
                    className={`group relative p-5 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border transition-all duration-200 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-xl ${
                      isThisPlaying
                        ? 'border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-emerald-950/50'
                        : 'border-slate-800/80 hover:border-emerald-500/40 hover:-translate-y-0.5'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getCategoryBadgeClass(disease.category)}`}>
                          {disease.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px] font-bold">
                            {disease.primaryFrequency || (disease as any).primaryFrequencyHz} Hz
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                        <span>{disease.name || (disease as any).diseaseName}</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0 ml-1" />
                      </h3>

                      {/* Cultural Context Snippet */}
                      <p className="text-[11px] text-amber-400/90 font-medium mt-1.5 line-clamp-1 flex items-center gap-1">
                        <Compass className="w-3 h-3 shrink-0" />
                        <span>{disease.esmaRecommendation || (disease as any).culturalOrReligiousContext}</span>
                      </p>

                      {/* Benefits Teaser */}
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {disease.description || (disease as any).healingBenefits}
                      </p>

                      {/* Quick Usage Pill */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-3 pt-2.5 border-t border-slate-900">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{disease.recommendedDurationMinutes || 15} Dk Seans</span>
                        <span className="text-slate-700">•</span>
                        <span>{disease.system}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
                      {/* Direct Audio Play / Stop */}
                      <button
                        onClick={(e) => handleTogglePlay(disease, e)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isThisPlaying
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800'
                        }`}
                        title={isThisPlaying ? 'Sesi Durdur' : 'Hızlı Frekans Dinle'}
                      >
                        {isThisPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isThisPlaying ? 'Durdur' : 'Dinle'}</span>
                      </button>

                      {/* Scan & Compare Workflow */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isThisPlaying) {
                            soundEngine.stop();
                            setPlayingDiseaseId(null);
                          }
                          onStartScanWorkflow(disease);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                        title="10 Sn Ön/Son Tarama & Rapor"
                      >
                        <FileCheck2 className="w-3 h-3" />
                        <span>Ön/Son Rapor</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <div>
            AKN GLOBAL GROUP LTD • Evrensel Şifa Frekans Veritabanı
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
              Toplam <strong>{TOTAL_DISEASE_COUNT}</strong> Klinik & Kadim Frekans Formülü
            </span>
            <button
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
