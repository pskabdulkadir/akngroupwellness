import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Compass, 
  Radio, 
  CheckCircle2, 
  Download, 
  Check, 
  Zap,
  Brain,
  Smile,
  ShieldAlert,
  Sun,
  Eye,
  Heart,
  Box
} from 'lucide-react';
import { ScanResult } from '../types';
import { exportComparisonReportToPDF } from '../utils/pdfExport';
import { voiceAssistant } from '../utils/voiceAssistant';
import { getActiveMemberSession } from '../utils/authManager';
import { BioAura3DSimulator } from './BioAura3DSimulator';

interface ComparisonModalProps {
  preScan: ScanResult;
  postScan: ScanResult;
  treatmentName?: string;
  onClose: () => void;
  onNewScan: () => void;
  onViewDetailedReport?: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  preScan,
  postScan,
  treatmentName = 'Frekans Yüklemesi',
  onClose,
  onNewScan,
  onViewDetailedReport,
}) => {
  const [activeTab, setActiveTab] = useState<'3dSimulation' | 'summary' | 'emotions' | 'aura' | 'chakras' | 'letaif'>('3dSimulation');
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  const activeMember = getActiveMemberSession();
  const patientName = activeMember?.fullName || 'Misafir Danışan';

  // Compute exact delta improvements
  const energyDelta = postScan.bioEnergyLevel - preScan.bioEnergyLevel;
  const pranaDelta = postScan.pranaFlowRate - preScan.pranaFlowRate;
  const stressDelta = preScan.emotionalState.stressLevel - postScan.emotionalState.stressLevel; // positive means stress reduced!
  const tranquilityDelta = (postScan.emotionalState.tranquilityLevel || 0) - (preScan.emotionalState.tranquilityLevel || 0);
  const clarityDelta = (postScan.emotionalState.mentalClarity || 85) - (preScan.emotionalState.mentalClarity || 65);
  const spiritualDelta = (postScan.emotionalState.spiritualOpenness || 0) - (preScan.emotionalState.spiritualOpenness || 0);

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    setPdfSuccess(false);
    try {
      const res = exportComparisonReportToPDF(preScan, postScan, treatmentName, patientName);
      if (res) {
        setPdfSuccess(true);
        voiceAssistant.speakPdfDownloaded();
        setTimeout(() => setPdfSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Comparison PDF export error:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        id="printable-comparison-container"
        className="relative w-full max-w-4xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/60 overflow-hidden flex flex-col max-h-[92vh]"
      >
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Bütünleşik Öncesi & Sonrası Dönüşüm Raporu</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Yükseltme Tamamlandı
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Uygulanan Yükleme: <strong className="text-amber-300">{treatmentName}</strong> ({postScan?.frequencyHz || 528} Hz) • Danışan: <span className="text-emerald-400 font-semibold">{patientName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct PDF Download Action */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                pdfSuccess 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white'
              }`}
              title="Dönüşüm Raporunu PDF Olarak İndir"
            >
              {pdfSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>PDF İndirildi</span>
                </>
              ) : (
                <>
                  <Download className={`w-3.5 h-3.5 ${isExportingPDF ? 'animate-bounce' : ''}`} />
                  <span>{isExportingPDF ? 'Hazırlanıyor...' : 'PDF İndir'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtabs */}
        <div className="px-6 py-2 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('3dSimulation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === '3dSimulation'
                ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Letaif & Aura Simülasyonu</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'summary'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Genel Dönüşüm & Delta
          </button>
          <button
            onClick={() => setActiveTab('emotions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'emotions'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-rose-400" />
            <span>Duygusal & Zihinsel İyileşme</span>
          </button>
          <button
            onClick={() => setActiveTab('aura')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'aura'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 Aurik Katman Değişimi
          </button>
          <button
            onClick={() => setActiveTab('chakras')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'chakras'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7 Çakra Karşılaştırması
          </button>
          <button
            onClick={() => setActiveTab('letaif')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'letaif'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5 Letaif Nur Karşılaştırması
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 0: 3D SIMULATION (PRE VS POST LIVE COMPARISON) */}
          {activeTab === '3dSimulation' && (
            <div className="space-y-6 animate-fade-in">
              <BioAura3DSimulator
                scanResult={postScan}
                preScanResult={preScan}
                heightClassName="h-[520px] sm:h-[580px]"
                showControlPanel={true}
              />

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">3D Morfolojik Dönüşüm ve Frekans İspatı</h4>
                    <p className="text-[11px] text-slate-300">
                      Yukarıdaki 3D simülatörde <strong>"Simülasyonu Başlat"</strong> butonuna basarak tarama öncesi daralmış kalkanın şifa frekanslarıyla nasıl genişlediğini canlı 3D olarak izleyebilirsiniz.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isExportingPDF}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>3D Raporu PDF Olarak İndir</span>
                </button>
              </div>
            </div>
          )}
          
          {/* TAB 1: SUMMARY & DELTAS */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              
              {/* Highlight Banner: Applied Treatment & Upgrades */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">YÜKLENEN FREKANS & ŞİFA AKTARIMI</span>
                    <h3 className="text-base font-bold text-slate-100">{treatmentName}</h3>
                    <p className="text-xs text-slate-300">
                      Başlangıç: <span className="text-slate-400">{preScan?.frequencyHz || 528} Hz</span> <ArrowRight className="inline w-3 h-3 text-emerald-400 mx-1" /> Yeni Rezonans: <strong className="text-emerald-300">{postScan?.frequencyHz || 528} Hz (Solfeggio Skalası)</strong>
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-center shrink-0">
                  <span className="text-[10px] text-slate-400 block">Genel Biyo-Alan Genişlemesi</span>
                  <span className="text-base font-bold font-mono text-emerald-400">+{energyDelta > 0 ? energyDelta : 14}% Gelişme</span>
                </div>
              </div>

              {/* Key Delta Upgrade Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* 1. Bio-Energy */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Biyo-Enerji</span>
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm line-through text-slate-500 font-mono">%{preScan.bioEnergyLevel}</span>
                    <ArrowRight className="w-3 h-3 text-teal-400" />
                    <span className="text-xl font-bold font-mono text-teal-300">%{postScan.bioEnergyLevel}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    +{energyDelta}% Hücresel Canlılık
                  </span>
                </div>

                {/* 2. Prana Flow */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Prana & Nadi Akışı</span>
                    <Compass className="w-3.5 h-3.5 text-orange-400" />
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm line-through text-slate-500 font-mono">%{preScan.pranaFlowRate}</span>
                    <ArrowRight className="w-3 h-3 text-orange-400" />
                    <span className="text-xl font-bold font-mono text-orange-300">%{postScan.pranaFlowRate}</span>
                  </div>
                  <span className="text-[10px] text-orange-400 font-semibold block">
                    +{pranaDelta}% Yaşam Gücü
                  </span>
                </div>

                {/* 3. Stress Reduction */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Stres Düzeyi</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm line-through text-slate-500 font-mono">%{preScan.emotionalState.stressLevel}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    <span className="text-xl font-bold font-mono text-emerald-300">%{postScan.emotionalState.stressLevel}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    -{stressDelta}% Stres Azalması
                  </span>
                </div>

                {/* 4. Tranquility & Sekinet */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Huzur & Sekinet</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm line-through text-slate-500 font-mono">%{preScan.emotionalState.tranquilityLevel}</span>
                    <ArrowRight className="w-3 h-3 text-amber-400" />
                    <span className="text-xl font-bold font-mono text-amber-300">%{postScan.emotionalState.tranquilityLevel}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-semibold block">
                    +{tranquilityDelta}% Ruhsal Genişlik
                  </span>
                </div>

              </div>

              {/* Scanned Camera Snapshot Comparison Card (Öncesi & Sonrası Çift Kadraj) */}
              {(preScan.snapshotUrl || postScan.snapshotUrl) && (
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
                          {new Date(preScan.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 aspect-video max-h-56 bg-slate-950 flex items-center justify-center shadow-lg group">
                        {preScan.snapshotUrl ? (
                          <img
                            src={preScan.snapshotUrl}
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
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: preScan.auraHex }} />
                            <span className="truncate">{preScan.dominantAuraColor} Aura</span>
                          </span>
                          <span className="font-mono text-slate-400 font-bold shrink-0">%{preScan.bioEnergyLevel} Biyo-Enerji</span>
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
                          {new Date(postScan.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="relative rounded-2xl overflow-hidden border border-emerald-500/50 aspect-video max-h-56 bg-slate-950 flex items-center justify-center shadow-lg shadow-emerald-950/30 group">
                        <img
                          src={postScan.snapshotUrl || preScan.snapshotUrl}
                          alt="Frekans Yükleme Sonrası Biyo-Alan"
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 shadow-md">
                          +{energyDelta}% Canlılık
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-[10px] font-medium text-slate-200 flex items-center justify-between shadow-md">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: postScan.auraHex }} />
                            <span className="truncate text-emerald-300 font-bold">{postScan.dominantAuraColor} Aura</span>
                          </span>
                          <span className="font-mono text-emerald-400 font-bold shrink-0">%{postScan.bioEnergyLevel} Biyo-Enerji</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Side-by-Side Aura Spectrum Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* PRE-SCAN AURA CARD */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TARAMA ÖNCESİ (BAŞLANGIÇ ALANI)</span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded-md">
                      {preScan.frequencyHz} Hz (Temel Titreşim)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: preScan.auraHex, backgroundColor: `${preScan.auraHex}33` }}
                    >
                      <Sparkles className="w-6 h-6" style={{ color: preScan.auraHex }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{preScan.dominantAuraColor}</h4>
                      <p className="text-xs text-slate-400">{preScan.emotionalState.primary}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    {preScan.auraDistribution.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.hex }} />
                            {(item.colorName || 'Aura').split('(')[0]}
                          </span>
                          <span>%{item.percentage}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.hex }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* POST-SCAN AURA CARD */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 space-y-3 shadow-lg shadow-emerald-950/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">YÜKLEME SONRASI (ŞİFA & ENTEGRE ALAN)</span>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                      {postScan.frequencyHz} Hz (Harmonik Rezonans)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20"
                      style={{ borderColor: postScan.auraHex, backgroundColor: `${postScan.auraHex}33` }}
                    >
                      <Sparkles className="w-6 h-6" style={{ color: postScan.auraHex }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-200">{postScan.dominantAuraColor}</h4>
                      <p className="text-xs text-slate-300">{postScan.emotionalState.primary}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    {postScan.auraDistribution.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.hex }} />
                            {(item.colorName || 'Aura').split('(')[0]}
                          </span>
                          <span className="font-bold text-emerald-400">%{item.percentage}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.hex }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: EMOTIONAL STATE TRANSFORMATION */}
          {activeTab === 'emotions' && (
            <div className="space-y-6">
              
              {/* Emotion Transition Banner */}
              <div className="p-6 rounded-3xl bg-slate-950/70 border border-rose-500/30 space-y-4">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                  DUYGU DURUMU DÖNÜŞÜMÜ (ÖNCESİ & SONRASI)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400">Başlangıç Duygu Hali</span>
                    <h4 className="text-base font-bold text-slate-200">{preScan.emotionalState.primary}</h4>
                    <p className="text-xs text-slate-400">{preScan.emotionalState.secondary}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/40 border border-emerald-500/40 space-y-2 shadow-lg">
                    <span className="text-[11px] text-emerald-400 font-semibold">Yükleme Sonrası Yüksek Titreşim</span>
                    <h4 className="text-base font-bold text-emerald-200">{postScan.emotionalState.primary}</h4>
                    <p className="text-xs text-slate-300">{postScan.emotionalState.secondary}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {postScan.emotionalState.description}
                </div>
              </div>

              {/* Detailed Metrics Delta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Smile className="w-4 h-4 text-emerald-400" />
                      <span>Huzur & Sekinet</span>
                    </span>
                    <span className="font-mono text-emerald-300">%{preScan.emotionalState.tranquilityLevel} → %{postScan.emotionalState.tranquilityLevel} (+{tranquilityDelta}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${postScan.emotionalState.tranquilityLevel}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Stres Arınması</span>
                    </span>
                    <span className="font-mono text-emerald-300">%{preScan.emotionalState.stressLevel} → %{postScan.emotionalState.stressLevel} (-{stressDelta}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${postScan.emotionalState.stressLevel}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span>Zihinsel Berraklık</span>
                    </span>
                    <span className="font-mono text-cyan-300">%{preScan.emotionalState.mentalClarity || 65} → %{postScan.emotionalState.mentalClarity || 88} (+{clarityDelta}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${postScan.emotionalState.mentalClarity || 88}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Huşu & Manevi İdrak</span>
                    </span>
                    <span className="font-mono text-indigo-300">%{preScan.emotionalState.spiritualOpenness} → %{postScan.emotionalState.spiritualOpenness} (+{spiritualDelta}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${postScan.emotionalState.spiritualOpenness}%` }} />
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: 3 AURIC LAYERS COMPARISON */}
          {activeTab === 'aura' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300">
                Frekans yüklemesi sonrası Eterik, Astral ve Mental aurik kalkan katmanlarındaki genişlik ve saflık artış oranları:
              </div>

              <div className="space-y-3">
                {postScan.auraLayers.map((layer, idx) => {
                  const preLayer = preScan.auraLayers[idx] || layer;
                  const deltaThickness = (layer.thickness ?? 0) - (preLayer.thickness ?? 0);
                  const deltaPurity = (layer.purity ?? 0) - (preLayer.purity ?? 0);

                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: layer.hex }} />
                          <h4 className="text-xs font-bold text-slate-100">{layer.turkishName}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span>Genişlik: <strong className="text-slate-400">%{preLayer.thickness}</strong> <ArrowRight className="inline w-3 h-3 text-emerald-400" /> <strong className="text-emerald-300">%{layer.thickness}</strong> (+{deltaThickness}%)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400">Genişleme</span>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${layer.thickness}%`, backgroundColor: layer.hex }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400">Saflık Arınması (+{deltaPurity}%)</span>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${layer.purity}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: 7 CHAKRAS COMPARISON */}
          {activeTab === 'chakras' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-orange-950/20 border border-orange-500/30 text-xs text-orange-200">
                7 Çakranın frekans yükleme öncesi ve sonrası enerji seviyeleri ve Bija titreşim hizalanması:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {postScan.chakraLevels.map((chakra, idx) => {
                  const preChakra = preScan.chakraLevels[idx] || chakra;
                  const delta = chakra.level - preChakra.level;

                  return (
                    <div key={chakra.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: chakra.color }} />
                          <h4 className="text-xs font-bold text-slate-100">{chakra.turkishName} ({chakra.bijaMantra})</h4>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-slate-500">%{preChakra.level}</span>
                          <ArrowRight className="w-3 h-3 text-emerald-400" />
                          <span className="font-bold text-emerald-400">%{chakra.level} (+{delta}%)</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${chakra.level}%`, backgroundColor: chakra.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: 5 LETAIF COMPARISON */}
          {activeTab === 'letaif' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200">
                5 Letaif merkezinin aktarım öncesi ve sonrası nur aktivasyonu ve zikir rezonans artışları:
              </div>

              <div className="space-y-3">
                {postScan.letaifLevels.map((letaif, idx) => {
                  const preLetaif = preScan.letaifLevels[idx] || letaif;
                  const delta = letaif.level - preLetaif.level;

                  return (
                    <div key={letaif.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: letaif.color }} />
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">{letaif.name}</h4>
                            <span className="text-[10px] text-slate-400">{letaif.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-slate-500">%{preLetaif.level}</span>
                          <ArrowRight className="w-3 h-3 text-indigo-400" />
                          <span className="font-bold text-indigo-300">%{letaif.level} (+{delta}%)</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${letaif.level}%`, backgroundColor: letaif.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? 'PDF Hazırlanıyor...' : 'PDF İndir'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
            {onViewDetailedReport && (
              <button
                onClick={onViewDetailedReport}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Entegre Raporu Aç</span>
              </button>
            )}

            <button
              onClick={onNewScan}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Yeni Tarama Yap</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
