import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Radio, 
  Activity, 
  Play, 
  BookOpen, 
  Flame, 
  Compass, 
  ShieldCheck, 
  Layers, 
  Heart, 
  ArrowRight, 
  Zap, 
  Download, 
  Check, 
  Lock, 
  Leaf, 
  Gem, 
  Box, 
  UserCheck, 
  Brain, 
  Smile, 
  ShieldAlert, 
  Sun, 
  Eye, 
  Info, 
  Mic, 
  Grid, 
  TrendingUp, 
  CheckCircle2, 
  Palette, 
  Search, 
  ArrowLeft,
  Trash2,
  Rotate3d
} from 'lucide-react';
import { ScanResult, ChakraEnergy, LetaifEnergy } from '../types';
import { ESMA_LIST } from '../data/esmaData';
import { AYET_LIST } from '../data/ayetData';
import { EASTERN_MANTRAS, MYTHOLOGICAL_ELEMENTS } from '../data/easternData';
import { TreatmentSelection } from './FrequencyLoadingModal';
import { exportScanReportToPDF } from '../utils/pdfExport';
import { voiceAssistant } from '../utils/voiceAssistant';
import { getActiveMemberSession } from '../utils/authManager';
import { deleteScanResult } from '../utils/storage';
import { soundEngine } from '../utils/soundEngine';
import { FrequencyMenuPickerModal } from './FrequencyMenuPickerModal';
import { BioAura3DSimulator } from './BioAura3DSimulator';
import { getDetailedColorAnalysis, DETAILED_COLOR_ANALYSIS_LIST } from '../data/colorAnalysisData';
import { CHAKRA_GUIDE, LETAIF_POINTS, AURA_LAYERS_GUIDE } from '../data/letaifData';

interface ReportModalProps {
  scanResult: ScanResult;
  preScanResult?: ScanResult | null;
  onClose: () => void;
  onGoBack?: () => void;
  onDeleteReport?: (id: string) => void;
  onSelectFrequencyForTreatment: (selection: TreatmentSelection) => void;
  onOpenGuide: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenComparison?: () => void;
  comparisonPairAvailable?: boolean;
}

export type ReportTab = 
  | 'ilimKapi' 
  | 'overview' 
  | 'colorAnalysis'
  | 'emotions' 
  | 'auraLayers' 
  | 'chakras' 
  | 'letaif' 
  | 'recommendations' 
  | 'allInnovations'
  | 'simulation3d';

export const ReportModal: React.FC<ReportModalProps> = ({
  scanResult,
  preScanResult,
  onClose,
  onGoBack,
  onDeleteReport,
  onSelectFrequencyForTreatment,
  onOpenGuide,
  onNavigateTab,
  onOpenComparison,
  comparisonPairAvailable = false,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('ilimKapi');
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);
  const [isMenuPickerOpen, setIsMenuPickerOpen] = useState<boolean>(false);
  const [esmaSearchQuery, setEsmaSearchQuery] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const activeMember = getActiveMemberSession();
  const patientName = activeMember?.fullName || 'Misafir Danışan';

  const isHuman = scanResult.targetType === 'human' || !scanResult.targetType;
  const emo = scanResult.emotionalState;

  // Synthesize or use provided pre-scan baseline for 3D comparison simulation
  const effectivePreScan = useMemo<ScanResult>(() => {
    if (preScanResult) return preScanResult;
    return {
      ...scanResult,
      id: `${scanResult.id}_pre_sim`,
      timestamp: (scanResult.timestamp || Date.now()) - 300000,
      bioEnergyLevel: Math.max(25, scanResult.bioEnergyLevel - 32),
      pranaFlowRate: Math.max(30, scanResult.pranaFlowRate - 30),
      frequencyHz: scanResult.frequencyHz > 400 ? 320 : 256,
      dominantAuraColor: 'Kırmızı',
      auraHex: '#ef4444',
      coherenceScore: 50,
      isAfterTreatment: false,
      emotionalState: {
        ...scanResult.emotionalState,
        primary: 'Zihinsel Yorgunluk & Düşük Enerji',
        stressLevel: Math.min(85, (scanResult.emotionalState?.stressLevel || 30) + 40),
        tranquilityLevel: Math.max(20, (scanResult.emotionalState?.tranquilityLevel || 75) - 35),
      },
      letaifLevels: (scanResult.letaifLevels || []).map((l) => ({
        ...l,
        level: Math.max(20, l.level - 35),
      })),
      chakraLevels: (scanResult.chakraLevels || []).map((c) => ({
        ...c,
        level: Math.max(25, c.level - 30),
      })),
    };
  }, [preScanResult, scanResult]);

  // Matched recommendations
  const matchedEsmas = ESMA_LIST.filter((e) => (scanResult.recommendedEsmas || []).includes(e.id));
  const matchedAyets = AYET_LIST.filter((a) => (scanResult.recommendedAyets || []).includes(a.id));
  const matchedMantras = EASTERN_MANTRAS.filter((m) => (scanResult.recommendedMantras || []).includes(m.id));
  const matchedElements = MYTHOLOGICAL_ELEMENTS.filter((el) => (scanResult.recommendedElements || []).includes(el.id));

  // Find primary corrective frequency for fast one-click action
  const topEsma = matchedEsmas[0] || ESMA_LIST[0] || { name: 'Eş-Şâfî', frequency: 528 };
  const topMantra = matchedMantras[0] || EASTERN_MANTRAS[0] || { name: 'Om Mane Padme Hum', frequencyHz: 528 };

  // Detailed analysis of dominant color
  const dominantColorInfo = useMemo(() => {
    return getDetailedColorAnalysis(scanResult.dominantAuraColor);
  }, [scanResult.dominantAuraColor]);

  // Filtered 99 Esma list for in-report browser
  const filteredEsmaList = useMemo(() => {
    const q = esmaSearchQuery.toLowerCase().trim();
    if (!q) return ESMA_LIST;
    return ESMA_LIST.filter(e => 
      e.name.toLowerCase().includes(q) ||
      e.meaning.toLowerCase().includes(q) ||
      e.arabic.includes(q) ||
      e.frequency.toString().includes(q) ||
      (e.ebjed && e.ebjed.toString().includes(q))
    );
  }, [esmaSearchQuery]);

  // Helper to trigger frequency loading directly from a chakra
  const handleLoadChakraFrequency = (chakra: ChakraEnergy) => {
    if (!isHuman) return;
    const bija = chakra.bijaMantra || chakra.mantra || 'OM';
    const sName = chakra.sanskritName || chakra.sanskrit || '';
    const tName = chakra.turkishName || chakra.name;
    const freq = chakra.frequency || 528;
    const matchingMantra = EASTERN_MANTRAS.find((m) => m && m.frequencyHz === freq) || {
      id: `chakra-${chakra.id}`,
      name: `${tName} (${bija})`,
      sanskrit: sName,
      chakra: chakra.name,
      frequencyHz: freq,
      colorHex: chakra.color || '#10b981',
      affirmation: `${tName} enerji merkezini dengeleme ve arındırma frekansı.`,
      benefit: `${bija} kök titreşimiyle omurga hizasında tefekkür edin.`
    };

    onSelectFrequencyForTreatment({
      name: `${tName} Frekansı (${bija})`,
      type: 'mantra',
      frequencyHz: freq,
      details: matchingMantra,
    });
  };

  // Helper to trigger frequency loading directly from a Letaif
  const handleLoadLetaifFrequency = (letaif: LetaifEnergy) => {
    if (!isHuman) return;
    const dhikrStr = letaif.dhikr || letaif.esma || '';
    const matchingEsma = ESMA_LIST.find((e) => dhikrStr && dhikrStr.includes(e.name)) || ESMA_LIST[0];
    onSelectFrequencyForTreatment({
      name: `${letaif.name} Nuru (${dhikrStr.split(',')[0] || letaif.name})`,
      type: 'esma',
      frequencyHz: scanResult.frequencyHz || 528,
      details: matchingEsma,
    });
  };

  // PDF Export Trigger
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    setPdfSuccess(false);
    try {
      const res = exportScanReportToPDF(scanResult, patientName, effectivePreScan);
      if (res) {
        setPdfSuccess(true);
        voiceAssistant.speakPdfDownloaded();
        setTimeout(() => setPdfSuccess(false), 3500);
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDeleteCurrentReport = () => {
    setIsDeleting(true);
    try {
      soundEngine.playFrequency(432, 0.1);
      deleteScanResult(scanResult.id, activeMember?.uid);
      if (onDeleteReport) {
        onDeleteReport(scanResult.id);
      }
      onClose();
    } catch (err) {
      console.error('Delete report error:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const renderTargetIcon = () => {
    switch (scanResult.targetType) {
      case 'plant':
        return <Leaf className="w-4 h-4 text-emerald-400" />;
      case 'crystal':
        return <Gem className="w-4 h-4 text-purple-400" />;
      case 'object':
        return <Box className="w-4 h-4 text-cyan-400" />;
      default:
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        id="printable-scan-report-container"
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-emerald-950/40 overflow-hidden flex flex-col max-h-[92vh]"
      >
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                onClose();
                if (onGoBack) onGoBack();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95 shrink-0"
              title="Geri Dön"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Geri</span>
            </button>

            <div 
              className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner shrink-0"
              style={{ backgroundColor: `${scanResult.auraHex}22`, borderColor: scanResult.auraHex }}
            >
              <Sparkles className="w-5 h-5" style={{ color: scanResult.auraHex }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-100 line-clamp-1">Biyo-Aura & Frekans Analiz Raporu</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                  {renderTargetIcon()}
                  <span>{scanResult.targetName || 'İnsan Biyo-Alanı'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold font-mono">
                  {scanResult.frequencyHz} Hz
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Danışan: <strong className="text-slate-200">{patientName}</strong> • {new Date(scanResult.timestamp || Date.now()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Bu raporu hesabımdan kalıcı olarak sil"
              className="p-2 rounded-xl bg-slate-850 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Raporu Sil</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="px-6 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('ilimKapi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ilimKapi'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>1. İlim Kapı</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab('colorAnalysis')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'colorAnalysis'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>3. Detaylı Renk Analizi</span>
          </button>
          <button
            onClick={() => setActiveTab('emotions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'emotions'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-rose-400" />
            <span>4. Duygu Analizi</span>
          </button>
          <button
            onClick={() => setActiveTab('auraLayers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'auraLayers'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5. 4 Aurik Katman
          </button>
          <button
            onClick={() => setActiveTab('chakras')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'chakras'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            6. 7 Çakra Rehberi
          </button>
          <button
            onClick={() => setActiveTab('letaif')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'letaif'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7. Letaif Nurları
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'recommendations'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            8. 99 Esma & Frekans Yükle
          </button>
          <button
            onClick={() => setActiveTab('allInnovations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'allInnovations'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>9. Yaşam Koçu Matrisi</span>
          </button>
          <button
            onClick={() => setActiveTab('simulation3d')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'simulation3d'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-400 shadow-md shadow-indigo-600/30'
                : 'text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-800/50'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>10. 3D Canlı Aura & Letaif (Öncesi/Sonrası)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* POST-TREATMENT INTEGRATED FREQUENCY BANNER */}
          {(scanResult.isAfterTreatment || scanResult.treatmentName) && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border-2 border-emerald-500/60 shadow-xl shadow-emerald-950/50 space-y-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      UYGULANAN BİYO-FREKANS & ŞİFA SEANSI RAPORA ENTEGRE EDİLDİ
                    </span>
                    <h4 className="text-base font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                      <span>{scanResult.treatmentName || 'Frekans Yüklemesi'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono">
                        {scanResult.frequencyHz} Hz
                      </span>
                    </h4>
                  </div>
                </div>

                {onOpenComparison && comparisonPairAvailable && (
                  <button
                    onClick={onOpenComparison}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Öncesi & Sonrası Dönüşüm Raporu</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Bu analiz raporu, uygulanan <strong>{scanResult.treatmentName || 'Frekans Yüklemesi'}</strong> ({scanResult.frequencyHz} Hz) seansı sonrası biyo-alanınıza, aurik kalkanınıza ve hücresel canlılığınıza işlenen harmonik rezonans değerlerini yansıtmaktadır.
              </p>
            </div>
          )}
          
          {/* TAB 10: 3D CANLI AURA & LETAİF SİMÜLASYONU */}
          {activeTab === 'simulation3d' && (
            <div className="space-y-6 animate-fade-in">
              <BioAura3DSimulator
                scanResult={scanResult}
                preScanResult={effectivePreScan}
                onSelectFrequencyForTreatment={onSelectFrequencyForTreatment}
                heightClassName="h-[520px] sm:h-[580px]"
                showControlPanel={true}
                initialComparisonMode="morph"
              />

              {/* Deep Analysis & Spiritual Guidance Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Letaif & Nur Katmanları</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    3D model üzerindeki 7 Letaif küresi (Kalp, Ruh, Sır, Hafi, Ahfa, Nefs, Külliye); canlı optik biyofoton taramanızdan beslenen dinamik parlaklık ve nabız hızına sahiptir.
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Layers className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Aurik Torus & Koruma Kalkanı</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    İnsan silüetini çevreleyen 2800 dinamik parçacık, biyo-enerji seviyenize (%{scanResult.bioEnergyLevel}) ve rezonans frekansınıza ({scanResult.frequencyHz} Hz) göre genişleyip dalgalanmaktadır.
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Activity className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">İnteraktif Kontroller</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Fare veya parmağınızla modeli 360° döndürebilir, yakınlaştırabilir, Letaif/Çakra kürelerine tıklayarak zikir ve frekans reçetesini dinleyebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: İLİM KAPI */}
          {activeTab === 'ilimKapi' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 space-y-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">KADİM BİLGELİK & MANEVİ İLİMLER</span>
                    <h3 className="text-xl font-black text-slate-100">İlim Kapısı • Biyo-Aura, Çakra ve Letaif Hakikati</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  İnsan, mikro-kozmos (Zübde-i Âlem) olarak yaratılmıştır. Maddi bedeni kuşatan biyomanyetik enerji alanı (Aura), içsel enerji girdapları (7 Çakra) ve ruhi merkezler (7 Letaif), esma ve nurların insandaki tecelligâhıdır. Canlı optik sensör taramamız, bu nurlu alanların frekansını ve rezonans dengesini tespit eder.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">1. Biyo-Aura ve Fotonik Kalkan</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Aura; hücrelerin yaydığı ultra-zayıf biyofoton ışımasıdır. Eterik, Astral, Zihinsel ve Kausal olmak üzere 4 temel katmandan oluşur. Kalbin huzuru ve teslimiyet, aura kalkanını zümrüt yeşili ve saf beyaz nur ile güçlendirerek negatif rezonanslara karşı korur.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-orange-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-300">2. 7 Çakra & Prana Akışı</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Omurga boyunca sıralanan 7 ana çakra, evrensel yaşam enerjisini (Prana / Hayat Enerjisi) bedene aktaran biyomanyetik girdaplardır. Bija sesleri ve harmonik frekanslar bu merkezleri akort ederek fiziksel ve duygusal denge sağlar.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">3. 7 Letaif Nurları & Zikir Rezonansı</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Kalp, Ruh, Sır, Hafi, Ahfa, Nefs ve Külli Letaif; Âlem-i Emr'den insana lütfedilen ilahi şuur kapılarıdır. Belirli esma zikirleri ve ses frekansları bu merkezleri uyandırarak içsel aydınlanmayı başlatır.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">4. 99 Esma-i Hüsna & Biyo-Rezonans</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Evrendeki her atom ve biyolojik doku bir titreşim frekansına sahiptir. 99 Esma-i Hüsna isimleri, ebced hesapları ve kadim solfeggio rezonansları ile hücrelerin bozulan frekansını fabrika ayarlarına döndürür.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Biyo-Rezonans</span>
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                  <div className="mt-2 text-xl font-bold font-mono text-emerald-300">
                    {scanResult.frequencyHz} Hz
                  </div>
                  <span className="text-[10px] text-slate-500">Solfeggio Skalası</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Biyo-Enerji</span>
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                  </span>
                  <div className="mt-2 text-xl font-bold font-mono text-teal-300">
                    %{scanResult.bioEnergyLevel}
                  </div>
                  <span className="text-[10px] text-slate-500">Hücresel Canlılık</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Duygu Durumu</span>
                    <Brain className="w-3.5 h-3.5 text-rose-400" />
                  </span>
                  <div className="mt-2 text-sm font-bold text-rose-300 truncate" title={emo.primary}>
                    {emo.primary}
                  </div>
                  <span className="text-[10px] text-slate-400">Huzur: %{emo.tranquilityLevel} • Stres: %{emo.stressLevel}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Prana & Nadi Akışı</span>
                    <Compass className="w-3.5 h-3.5 text-orange-400" />
                  </span>
                  <div className="mt-2 text-xl font-bold font-mono text-orange-300">
                    %{scanResult.pranaFlowRate}
                  </div>
                  <span className="text-[10px] text-slate-500">Yaşam Gücü Debisi</span>
                </div>
              </div>

              {/* DIRECT ACTION: FAST FREQUENCY LOADING BANNER */}
              {isHuman ? (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-emerald-950/40">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 flex items-center justify-center shrink-0">
                      <Zap className="w-6 h-6 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">Düzeltici & Dengeleyici Frekansı Hemen Yükle</h4>
                      <p className="text-xs text-slate-300">
                        Taranan biyo-alanınıza en uygun tavsiye: <strong className="text-amber-300">{topEsma.name}</strong> ({(topEsma as any).frequency || (topEsma as any).frequencyHz || 528} Hz) veya <strong className="text-orange-300">{topMantra.name}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => onSelectFrequencyForTreatment({
                        name: topEsma.name,
                        type: 'esma',
                        frequencyHz: (topEsma as any).frequency || (topEsma as any).frequencyHz || 528,
                        details: topEsma,
                      })}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Frekansı Yükle (Esma)</span>
                    </button>

                    <button
                      onClick={() => onSelectFrequencyForTreatment({
                        name: topMantra.name,
                        type: 'mantra',
                        frequencyHz: topMantra.frequencyHz,
                        details: topMantra,
                      })}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600/90 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/25 transition-all cursor-pointer"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Mantra Yükle</span>
                    </button>

                    <button
                      onClick={() => setIsMenuPickerOpen(true)}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                      title="Tüm İslami, Doğu ve Çakra Frekans Menüsünü Aç"
                    >
                      <Grid className="w-4 h-4" />
                      <span>99 Esma & Menü</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* 3D Dynamic Live Energy & Letaif Simulation Engine */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                    <Rotate3d className="w-4 h-4 text-indigo-400" />
                    <span>3D Canlı Enerji ve Letaif Haritası (İnteraktif Simülasyon)</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('simulation3d')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Tam Ekran İncele</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <BioAura3DSimulator
                  scanResult={scanResult}
                  preScanResult={effectivePreScan}
                  onSelectFrequencyForTreatment={onSelectFrequencyForTreatment}
                  heightClassName="h-[440px] sm:h-[500px]"
                  showControlPanel={true}
                  initialComparisonMode="morph"
                />
              </div>

              {/* Scanned Camera Snapshot Comparison Card (Öncesi & Sonrası Çift Kadraj) */}
              {(scanResult.snapshotUrl || effectivePreScan?.snapshotUrl) && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>Kamera Biyo-Alan Görüntü Kayıtları (Öncesi & Sonrası)</span>
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
                      📸 Çift Kadraj Dönüşüm Doğrulaması
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tarama Öncesi Frame */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          1. Tarama Öncesi Kadraj
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {effectivePreScan ? new Date(effectivePreScan.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Başlangıç'}
                        </span>
                      </div>
                      <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 aspect-video max-h-56 bg-slate-950 flex items-center justify-center shadow-lg group">
                        {(effectivePreScan?.snapshotUrl || scanResult.snapshotUrl) ? (
                          <img
                            src={effectivePreScan?.snapshotUrl || scanResult.snapshotUrl}
                            alt="Tarama Öncesi Biyo-Alan"
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-xs text-slate-500 flex flex-col items-center gap-1">
                            <Eye className="w-6 h-6 text-slate-600" />
                            <span>Ön Tarama Görseli Alınmadı</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[10px] font-medium text-slate-300 flex items-center justify-between shadow-md">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: effectivePreScan?.auraHex || '#ef4444' }} />
                            <span className="truncate">{effectivePreScan?.dominantAuraColor || 'Kırmızı'} Aura</span>
                          </span>
                          <span className="font-mono text-slate-400 font-bold shrink-0">%{effectivePreScan?.bioEnergyLevel || 45} Biyo-Enerji</span>
                        </div>
                      </div>
                    </div>

                    {/* Frekans Yükleme Sonrası Frame */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          2. Frekans Yükleme Sonrası Kadraj
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400/80">
                          {new Date(scanResult.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="relative rounded-2xl overflow-hidden border border-emerald-500/50 aspect-video max-h-56 bg-slate-950 flex items-center justify-center shadow-lg shadow-emerald-950/30 group">
                        <img
                          src={scanResult.snapshotUrl || effectivePreScan?.snapshotUrl}
                          alt="Frekans Yükleme Sonrası Biyo-Alan"
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 shadow-md">
                          +{Math.max(1, scanResult.bioEnergyLevel - (effectivePreScan?.bioEnergyLevel || 45))}% Canlılık
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-[10px] font-medium text-slate-200 flex items-center justify-between shadow-md">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: scanResult.auraHex }} />
                            <span className="truncate text-emerald-300 font-bold">{scanResult.dominantAuraColor} Aura</span>
                          </span>
                          <span className="font-mono text-emerald-400 font-bold shrink-0">%{scanResult.bioEnergyLevel} Biyo-Enerji</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dominant Aura Card with Quick Analysis */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-center gap-6">
                <div 
                  className="w-24 h-24 rounded-full border-4 flex items-center justify-center shrink-0 shadow-2xl transition-all"
                  style={{ borderColor: scanResult.auraHex, backgroundColor: `${scanResult.auraHex}33`, boxShadow: `0 0 35px ${scanResult.auraHex}44` }}
                >
                  <Sparkles className="w-10 h-10" style={{ color: scanResult.auraHex }} />
                </div>

                <div className="space-y-2 text-center md:text-left flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">BASKIN AURA RENK SPEKTRUMU</span>
                  <h3 className="text-xl font-bold text-slate-100">{dominantColorInfo.turkishName}</h3>
                  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                      Duygu: {emo.primary}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono">
                      Frekans: {dominantColorInfo.frequencyRangeHz}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {dominantColorInfo.spiritualMeaning}
                  </p>
                </div>
              </div>

              {/* Aura Color Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Aura Spektrum Dağılımı</h4>
                <div className="space-y-2">
                  {scanResult.auraDistribution.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.hex }} />
                          {item.colorName}
                        </span>
                        <span className="font-mono text-slate-400">%{item.percentage}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${item.percentage}%`, backgroundColor: item.hex }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: DETAYLI RENK ANALİZİ VE ENERJİ KARŞILIKLARI */}
          {activeTab === 'colorAnalysis' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Dominant Detected Color Hero Banner */}
              <div 
                className="p-6 rounded-3xl border space-y-4 shadow-xl"
                style={{ 
                  backgroundColor: `${dominantColorInfo.hex}15`, 
                  borderColor: `${dominantColorInfo.hex}55` 
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-lg"
                      style={{ backgroundColor: `${dominantColorInfo.hex}33`, borderColor: dominantColorInfo.hex }}
                    >
                      <Sparkles className="w-7 h-7" style={{ color: dominantColorInfo.hex }} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        CANLI TARAMADA TESPİT EDİLEN BASKIN RENK
                      </span>
                      <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <span>{dominantColorInfo.turkishName}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 font-mono">
                          {dominantColorInfo.frequencyRangeHz}
                        </span>
                      </h3>
                    </div>
                  </div>

                  {isHuman && (
                    <button
                      onClick={() => onSelectFrequencyForTreatment({
                        name: `${dominantColorInfo.turkishName} Frekansı`,
                        type: 'esma',
                        frequencyHz: dominantColorInfo.recommendedFrequencies[0]?.hz || 528,
                        details: dominantColorInfo
                      })}
                      className="px-4 py-2 rounded-xl text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                      style={{ backgroundColor: dominantColorInfo.hex }}
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Rengin Frekansını Yükle</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Ruhsal & Bilinç Anlamı</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {dominantColorInfo.spiritualMeaning}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Zihinsel & Duygusal Durum</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {dominantColorInfo.mentalEmotionalState}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Eterik Beden & Biyofoton</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {dominantColorInfo.ethericBodyImpact}
                    </p>
                  </div>
                </div>

                {/* Affirmation & Balanced traits */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Tefekkür ve Olumlama Rezonansı</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {dominantColorInfo.balancedTraits.map((trait, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-300">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    "{dominantColorInfo.affirmation}"
                  </p>
                  <p className="text-xs text-emerald-400">
                    <strong>Bütünsel Rehberlik:</strong> {dominantColorInfo.holisticGuidance}
                  </p>
                </div>
              </div>

              {/* Detected Colors Breakdown with In-Depth Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Taranan Kadrajda Tespit Edilen Diğer Aura Renkleri ve Etkileri</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scanResult.auraDistribution.map((dist, dIdx) => {
                    const info = getDetailedColorAnalysis(dist.colorName);
                    return (
                      <div 
                        key={dIdx} 
                        className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 transition-all hover:border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: dist.hex, borderColor: dist.hex }} />
                            <div>
                              <h5 className="text-xs font-bold text-slate-100">{info.turkishName}</h5>
                              <span className="text-[10px] text-slate-400 font-mono">Kadraj Dağılımı: %{dist.percentage}</span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                            {info.frequencyRangeHz}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {info.spiritualMeaning}
                        </p>

                        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                          <span>Rezonans: <strong className="text-slate-300">{info.recommendedFrequencies.map(f => f.name).join(', ')}</strong></span>
                          {isHuman && (
                            <button
                              onClick={() => onSelectFrequencyForTreatment({
                                name: `${info.turkishName} Frekansı`,
                                type: 'esma',
                                frequencyHz: info.recommendedFrequencies[0]?.hz || 528,
                                details: info
                              })}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3 text-cyan-400" />
                              <span>Frekans Yükle</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Complete Reference of All 10 Sacred Colors */}
              <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Aura Renk Spektrumu Kütüphanesi (10 Temel Biyo-Alan Nuru)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Tüm biyo-alan renklerinin metafiziksel ve frekans karşılıkları
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {DETAILED_COLOR_ANALYSIS_LIST.map((colorItem) => (
                    <div 
                      key={colorItem.id} 
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: colorItem.hex }} />
                          <h6 className="text-xs font-bold text-slate-100">{colorItem.turkishName}</h6>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{colorItem.frequencyRangeHz}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2">
                        {colorItem.spiritualMeaning}
                      </p>
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
                        <span className="text-slate-400 truncate max-w-[140px]">{colorItem.recommendedFrequencies[0]?.name}</span>
                        {isHuman && (
                          <button
                            onClick={() => onSelectFrequencyForTreatment({
                              name: `${colorItem.turkishName} Frekansı`,
                              type: 'esma',
                              frequencyHz: colorItem.recommendedFrequencies[0]?.hz || 528,
                              details: colorItem
                            })}
                            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-emerald-400" />
                            <span>Yükle</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: EMOTIONS */}
          {activeTab === 'emotions' && (
            <div className="space-y-6">
              {/* Primary Emotion Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      <Brain className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">ÖLÇÜLEN ANA DUYGU DURUMU</span>
                      <h3 className="text-xl font-bold text-slate-100">{emo.primary}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs font-mono text-emerald-400">
                      Rezonans: {scanResult.frequencyHz} Hz
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-400">
                      Aura: {(scanResult.dominantAuraColor || 'Aura').split(' ')[0]}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  {emo.description}
                </p>
              </div>

              {/* Indicators */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Duygusal ve Zihinsel Enerji Parametreleri</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <Smile className="w-4 h-4 text-emerald-400" />
                        <span>Huzur & Sekinet (İçsel Dinginlik)</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-300">%{emo.tranquilityLevel}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full" style={{ width: `${emo.tranquilityLevel}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400">Kalp ve zihin dinginliğinin dengeli olma oranı.</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>Stres & Zihinsel Baskı Seviyesi</span>
                      </span>
                      <span className="font-mono font-bold text-rose-300">%{emo.stressLevel}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: `${emo.stressLevel}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {emo.stressLevel > 50 ? 'Yüksek sempatik uyarılma, köklenme ihtiyacı.' : 'Düşük gerilim, rahat sinir sistemi.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AURA LAYERS */}
          {activeTab === 'auraLayers' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 text-xs text-slate-300">
                Kadim ve modern biyofotonik ilme göre biyo-alan 4 temel kuantum aurik katmandan oluşur.
              </div>

              <div className="grid grid-cols-1 gap-4">
                {AURA_LAYERS_GUIDE.map((layer, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: layer.colorFrequency.includes('Kırmızı') ? '#ef4444' : layer.colorFrequency.includes('Gökkuşağı') ? '#f59e0b' : layer.colorFrequency.includes('Sarı') ? '#06b6d4' : '#a855f7' }} />
                        <div>
                          <h4 className="text-sm font-bold text-slate-100">{layer.name}</h4>
                          <span className="text-[11px] text-slate-400">{layer.distanceCm} • {layer.colorFrequency}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-teal-300 font-mono">
                        {layer.role}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{layer.description}</p>
                    <p className="text-xs text-teal-400/90 font-medium"><strong>Koruma ve Rol:</strong> {layer.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: 7 CHAKRAS & PRANA */}
          {activeTab === 'chakras' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/30 flex items-center justify-between text-xs flex-wrap gap-2">
                <span className="text-orange-200">
                  Prana Akış Hızı: <strong>%{scanResult.pranaFlowRate}</strong> • Kundalini Omurga Rezonansı: <strong>%{scanResult.kundaliniResonance}</strong>
                </span>
                <span className="font-mono text-slate-400">7 Çakra Sanskrit & Bija Mantraları</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scanResult.chakraLevels.map((chakra, idx) => {
                  const guide = CHAKRA_GUIDE[idx] || CHAKRA_GUIDE[0];
                  return (
                    <div key={chakra.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: chakra.color }} />
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">{chakra.turkishName} ({guide.sanskrit})</h4>
                            <span className="text-[10px] text-orange-400 font-mono">Bija: {guide.bijaMantra} • {guide.element} • {chakra.frequency || guide.frequencyHz} Hz</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-200">%{chakra.level}</span>
                      </div>

                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${chakra.level}%`, backgroundColor: chakra.color }} />
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {guide.spiritualMeaning}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span className="text-[10px] text-slate-400">Fiziksel Etki: {guide.effectOnBody}</span>
                        {isHuman && (
                          <button
                            onClick={() => handleLoadChakraFrequency(chakra)}
                            className="px-2.5 py-1 rounded-lg bg-orange-600/90 hover:bg-orange-500 text-white font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Frekans Yükle</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: 7 LETAIF */}
          {activeTab === 'letaif' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200">
                Tasavvufta Âlem-i Emr'den insana lütfedilen 7 Letaif merkezinin anlık nur ve zikir aktivasyon oranları.
              </div>

              <div className="space-y-3">
                {LETAIF_POINTS.map((letaif, idx) => {
                  const scannedLevel = scanResult.letaifLevels[idx]?.level || 75;
                  return (
                    <div key={letaif.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: letaif.colorHex }} />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-100">{letaif.name}</h4>
                              <span className="text-xs font-arabic text-amber-300">{letaif.arabicName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{letaif.location} • Nur: {letaif.color} • Peygamber Meşrebi: {letaif.prophetConnection}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-indigo-300">%{scannedLevel}</span>
                      </div>

                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${scannedLevel}%`, backgroundColor: letaif.colorHex }} />
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {letaif.spiritualMeaning}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>Tavsiye Zikir: <strong className="text-slate-300">{letaif.esma}</strong></span>
                        {isHuman && (
                          <button
                            onClick={() => {
                              const matchingEsma = ESMA_LIST.find((e) => letaif.esma && letaif.esma.includes(e.name)) || ESMA_LIST[0];
                              onSelectFrequencyForTreatment({
                                name: `${letaif.name} Nuru (${(letaif.esma || letaif.name).split('/')[0] || letaif.name})`,
                                type: 'esma',
                                frequencyHz: scanResult.frequencyHz || 528,
                                details: matchingEsma,
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Nur Yükle</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: 99 ESMA-İ HÜSNA & FREKANS YÜKLE */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              
              {/* Esma 99 Browser & Search Header */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">99 Esma-i Hüsna ve Şifa Frekansları Menüsü</h4>
                      <p className="text-xs text-slate-300">Tüm 99 ilahi ismin ebced değeri, frekans karşılığı ve tefekkür şifası.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuPickerOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Grid className="w-4 h-4" />
                    <span>Gelişmiş Frekans Kütüphanesini Aç</span>
                  </button>
                </div>

                {/* In-Report Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={esmaSearchQuery}
                    onChange={(e) => setEsmaSearchQuery(e.target.value)}
                    placeholder="99 Esma içinde ara (örn: Şâfî, Nûr, Vedûd, 528, 66)..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {esmaSearchQuery && (
                    <button 
                      onClick={() => setEsmaSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>

              {/* 99 Esma Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredEsmaList.map((esma) => (
                  <div 
                    key={esma.id} 
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-100">{esma.name}</h5>
                        <span className="text-xs font-arabic text-amber-400">{esma.arabic}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{esma.meaning}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-bold">{esma.frequency} Hz</span>
                        {esma.ebjed && (
                          <span className="text-slate-500">Ebced: {esma.ebjed}</span>
                        )}
                      </div>
                      {isHuman && (
                        <button
                          onClick={() => onSelectFrequencyForTreatment({
                            name: esma.name,
                            type: 'esma',
                            frequencyHz: esma.frequency,
                            details: esma,
                          })}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-amber-300" />
                          <span>Yükle</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 9: ALL INNOVATIONS & LIFE COACH MATRIX */}
          {activeTab === 'allInnovations' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/40 space-y-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/50 text-purple-300 flex items-center justify-center shrink-0">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                      BÜTÜNSEL İÇSEL REHBERLİK & YAŞAM KOÇU MATRİSİ
                    </span>
                    <h3 className="text-xl font-black text-slate-100">
                      Bütünsel Biyo-Rezonans & Yaşam Koçu Matrisi
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bu tarama, kameradan alınan kuantum biyofoton verilerini Bütüncül Terapötik Rehberlik, 24 Saatlik Çin Tıbbı Organ Saati (Circadian) ve Kolektif Aura Rezonansı ile eşleştirerek bütüncül bir içsel harita sunar.
                </p>
              </div>

              {/* AI Life Coach Card */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/40 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      1. Bütüncül Terapötik İçgörü
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                    Duygusal Biyo-Alan Regülasyonu
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                  "{emo?.stressLevel && emo.stressLevel > 50 
                    ? `[Biyo-Alan Tespiti]: Mevcut biyo-alanında stres ve sempatik uyarılma eşiği (%${emo.stressLevel}) yüksek seyrediyor. Sinir sistemin bir savunma veya aşırı yüklenme hali deneyimliyor. Bu anı yargılamadan karşıla; zihnin dağıldığında bedenin köklenmeye ihtiyaç duyar. 396 Hz veya 528 Hz frekansları ile 4-7-8 ritminde nefes alarak güven hissini yeniden inşa et.`
                    : `[Biyo-Alan Tespiti]: Biyo-alanında huzur ve sekinet oranı (%${emo?.tranquilityLevel || 75}) dengeli bir rezonansta. Kalp tutarlılığın (HRV Coherence) açık bir bilinç durumuna işaret ediyor. Bu dinginliği hücrelerine mühürle ve 639 Hz kalp frekansıyla içsel genişliğini koru.`}"
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-400">Günün Terapötik Olumlaması</span>
                    <p className="text-xs text-slate-300 font-medium">
                      "Bedenimin ve ruhumun bilgeliğine güveniyorum. Anın akışında huzurla kökleniyor, esenliğe açılıyorum."
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-teal-400">Önerilen Nefes & Rezonans</span>
                    <p className="text-xs text-slate-300 font-medium">
                      4-7-8 Köklenme & Vagus Siniri Sakinleştirme Nefesi ({scanResult.frequencyHz} Hz eşliğinde)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            {isHuman 
              ? 'Frekans butonuna tıklayarak biyo-alanınıza anında rezonans aktarımını başlatabilirsiniz.'
              : 'Nesne / Cisim analizi tamamlandı. Frekans yüklemesi için kamerada insan algılanmalıdır.'}
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow transition-all cursor-pointer ${
                pdfSuccess
                  ? 'bg-emerald-600 ring-2 ring-emerald-400/50'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              title="Raporu ve Frekans Reçetesini PDF Olarak İndir"
            >
              {pdfSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>PDF İndirildi</span>
                </>
              ) : (
                <>
                  <Download className={`w-3.5 h-3.5 ${isExportingPDF ? 'animate-bounce' : ''}`} />
                  <span>{isExportingPDF ? 'PDF Hazırlanıyor...' : 'PDF İndir'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>

      {/* DELETE SCAN REPORT CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl shadow-rose-950/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Bu Raporu Sil</h3>
                <p className="text-xs text-slate-400">Bu işlem geri alınamaz.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rapor Tarihi:</span>
                <span className="text-slate-200 font-semibold">{new Date(scanResult.timestamp).toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Aura / Frekans:</span>
                <span className="text-emerald-400 font-semibold">
                  {scanResult.dominantAuraColor || 'Aura'} ({scanResult.frequencyHz || 528} Hz)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>ID:</span>
                <span>#{scanResult.id.slice(-8).toUpperCase()}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Bu aura tarama kaydı hesabınızdan ve cihazınızdan kalıcı olarak silinecektir.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteCurrentReport}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Evet, Raporu Sil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global In-Modal Frequency & Healing Menu Picker */}
      <FrequencyMenuPickerModal
        isOpen={isMenuPickerOpen}
        onClose={() => setIsMenuPickerOpen(false)}
        onSelectFrequency={onSelectFrequencyForTreatment}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
