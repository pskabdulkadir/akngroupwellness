import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft,
  Play, 
  Square, 
  Sparkles, 
  Volume2, 
  Clock, 
  Calendar, 
  BookOpen, 
  Activity, 
  CheckCircle2, 
  Layers, 
  HeartHandshake, 
  Compass, 
  ShieldCheck, 
  ArrowRight,
  Headphones,
  FileCheck2,
  Zap
} from 'lucide-react';
import { DiseaseHealingProtocol } from '../data/diseaseHealingLibrary';
import { soundEngine } from '../utils/soundEngine';

interface DiseaseDetailModalProps {
  disease: DiseaseHealingProtocol | null;
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  onStartScanWorkflow: (disease: DiseaseHealingProtocol) => void;
}

export const DiseaseDetailModal: React.FC<DiseaseDetailModalProps> = ({
  disease,
  isOpen,
  onClose,
  onGoBack,
  onStartScanWorkflow,
}) => {
  const [activeTab, setActiveTab] = useState<'frequency' | 'culture' | 'science' | 'prescription' | 'timeline'>('frequency');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);

  if (!isOpen || !disease) return null;

  const handleTogglePlay = async () => {
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    } else {
      const binaural = disease.secondaryFrequencyHz || 7.83;
      let wave: 'theta' | 'alpha' | 'beta' | 'gamma' | 'delta' = 'alpha';
      if (binaural < 4) wave = 'delta';
      else if (binaural < 8) wave = 'theta';
      else if (binaural < 13) wave = 'alpha';
      else if (binaural < 30) wave = 'beta';
      else wave = 'gamma';

      await soundEngine.unlockAudio();
      await soundEngine.startAdaptiveBioFrequency(
        disease.primaryFrequencyHz,
        binaural,
        wave,
        volume,
        'ocean'
      );
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    }
    onClose();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Nörolojik': return 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/40';
      case 'Kardiyovasküler': return 'from-rose-500/20 to-red-500/20 text-rose-300 border-rose-500/40';
      case 'Metabolik': return 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40';
      case 'Psikosomatik': return 'from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/40';
      case 'İskelet-Kas': return 'from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-500/40';
      case 'Bağışıklık': return 'from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/40';
      case 'Kadim & Enerjetik': return 'from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/40';
      default: return 'from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header with Category & Title */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
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

            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${getCategoryColor(disease.category)} border flex items-center justify-center shadow-inner shrink-0`}>
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getCategoryColor(disease.category)}`}>
                  {disease.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold border border-slate-700">
                  {disease.primaryFrequencyHz} Hz
                  {disease.secondaryFrequencyHz ? ` + ${disease.secondaryFrequencyHz} Hz` : ''}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-slate-100 mt-1 line-clamp-1">
                {disease.diseaseName}
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Bar: Direct Frequency Play & 10s Comparative Scan Workflow */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950'
              }`}
            >
              {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Sesi Durdur' : 'Bu Frekansı Canlı Başlat'}</span>
            </button>

            {isPlaying && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs animate-pulse">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="font-mono">{disease.primaryFrequencyHz} Hz Aktif</span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (isPlaying) {
                soundEngine.stop();
                setIsPlaying(false);
              }
              onStartScanWorkflow(disease);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-950 transition-all cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Ön/Son Tarama & Rapor Başlat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/60 border-b border-slate-800 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('frequency')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'frequency'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1. Frekans & Akustik Motor</span>
          </button>

          <button
            onClick={() => setActiveTab('culture')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'culture'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. Kültürel & Kadim Arka Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('science')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'science'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3. Hastalığa Hücresel Etkisi</span>
          </button>

          <button
            onClick={() => setActiveTab('prescription')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'prescription'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>4. Kullanım Reçetesi</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>5. İyileşme Takvimi</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-slate-200 text-xs sm:text-sm leading-relaxed">
          
          {/* TAB 1: FREQUENCY & ACOUSTICS */}
          {activeTab === 'frequency' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> Biyo-Rezonans Akustik Parametreleri
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                    CANLI W3C WEB AUDIO API
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Taşıyıcı Ana Frekans (Carrier):</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{disease.primaryFrequencyHz} Hz</span>
                    <p className="text-[11px] text-slate-400 mt-1">Hücre zarı rezonansına doğrudan etki eden saf sinüzoidal dalga.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Binaural Beyin Dalgası:</span>
                    <span className="text-lg font-bold font-mono text-cyan-400">{disease.secondaryFrequencyHz || 7.83} Hz</span>
                    <p className="text-[11px] text-slate-400 mt-1">Sol ve sağ kulak faz farkıyla beyin dalgalarını sakinleştirir.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3 mt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Headphones className="w-4 h-4 text-emerald-400" />
                    <span>Stereo Kulaklık Önerilir (Çift Kanallı Beyin Senkronizasyonu için)</span>
                  </div>
                  <button
                    onClick={handleTogglePlay}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    {isPlaying ? 'Durdur' : 'Sesi Dinle'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200">Rezonans Prensibi</h4>
                <p className="text-slate-300 text-xs">
                  AuraBio Frekans motoru, kaydedilmiş MP3 yerine tarayıcınızın donanımsal ses yongasını kullanarak matematiksel saflıkta ses dalgaları üretir. Bu dalgalar hücresel osilasyonu doğrudan uyarır.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CULTURAL & ANCIENT BACKGROUND */}
          {activeTab === 'culture' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 border border-amber-500/30 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Compass className="w-4 h-4" /> Kadim Şifa Ekolleri & Kültürel Köken
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {disease.culturalOrReligiousContext}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200">Kadim Tıp & Biyo-Rezonans Uyumu</h4>
                <p className="text-slate-300 text-xs">
                  Sufi Darüşşifalarındaki makam terapilerinden Antik Solfejyo ilahilerine, Ayurveda çakra çanaklarından Çin meridyen seslerine kadar asırlardır kullanılan bu frekans formülü, modern fizikteki rezonans kanunlarıyla tam örtüşmektedir.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: BIOLOGICAL & CELLULAR MECHANISM */}
          {activeTab === 'science' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/20 via-slate-900 to-slate-950 border border-blue-500/30 space-y-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Biyo-Fizyolojik ve Ruhsal Faydaları
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {disease.healingBenefits}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Hücresel Düzey</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 block">Mitokondri & ATP</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Sinir Sistemi</span>
                  <span className="text-xs font-bold text-cyan-400 mt-1 block">Vagus Uyarımı</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Biyo-Alan</span>
                  <span className="text-xs font-bold text-purple-400 mt-1 block">Aura Polarizasyonu</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USAGE PRESCRIPTION */}
          {activeTab === 'prescription' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Klinik & Kadim Kullanım Protokolü
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Seans Süresi</span>
                      <span className="text-xs font-bold text-slate-200">{disease.usagePrescription.durationPerSessionMinutes} Dakika</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Günlük Sıklık</span>
                      <span className="text-xs font-bold text-slate-200">Günde {disease.usagePrescription.frequencyOfUsePerDay} Kez</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Önerilen Kür</span>
                      <span className="text-xs font-bold text-slate-200">{disease.usagePrescription.recommendedTotalDays} Gün</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> En Uygun Uygulama Zamanı:
                  </span>
                  <p className="text-slate-300 text-xs">{disease.usagePrescription.bestTimeOfDay}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-teal-400 flex items-center gap-1">
                    <Headphones className="w-3.5 h-3.5" /> Uygulama Talimatı & Kulaklık Rehberi:
                  </span>
                  <p className="text-slate-300 text-xs">{disease.usagePrescription.guidelines}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RECOVERY PROCESS TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> İyileşme ve Adaptasyon Takvimi
                </span>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                  
                  {/* Phase 1 */}
                  <div className="relative pl-8 space-y-1">
                    <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 ring-2 ring-emerald-500/30" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400">1 - 7. Günler (Faz 1)</span>
                      <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">İlk Tepki & Akut Rahatlama</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      {disease.recoveryProcessTimeline.phase1Days1to7}
                    </p>
                  </div>

                  {/* Phase 2 */}
                  <div className="relative pl-8 space-y-1">
                    <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-slate-950 ring-2 ring-cyan-500/30" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400">8 - 21. Günler (Faz 2)</span>
                      <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">Hücresel Adaptasyon</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      {disease.recoveryProcessTimeline.phase2Days8to21}
                    </p>
                  </div>

                  {/* Phase 3 */}
                  <div className="relative pl-8 space-y-1">
                    <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-slate-950 ring-2 ring-purple-500/30" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-400">22+ Günler (Faz 3)</span>
                      <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">Kalıcı Biyo-Denge</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      {disease.recoveryProcessTimeline.phase3Days22Plus}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            AKN GLOBAL GROUP LTD • Şifa Ansiklopedisi
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isPlaying) {
                  soundEngine.stop();
                  setIsPlaying(false);
                }
                onStartScanWorkflow(disease);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-blue-950"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Ön/Son Tarama & Rapor</span>
            </button>

            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
