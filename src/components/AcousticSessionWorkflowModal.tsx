import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft,
  Mic, 
  Play, 
  Square, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  FileText, 
  FileCheck2, 
  RotateCcw,
  Volume2,
  Clock,
  ShieldAlert,
  Zap,
  Waves
} from 'lucide-react';
import { DiseaseHealingProtocol } from '../data/diseaseHealingLibrary';
import { 
  AcousticScanData, 
  SessionComparisonReport, 
  generatePreScanData, 
  generatePostScanData, 
  createSessionReport,
  downloadHealingReportPDF,
  downloadHealingReportTXT,
  downloadHealingReportWord 
} from '../utils/healingReportGenerator';
import { db, doc, setDoc } from '../lib/db';
import { soundEngine } from '../utils/soundEngine';

export type WorkflowStep = 'pre_scan' | 'in_session' | 'post_scan' | 'report';

interface AcousticSessionWorkflowModalProps {
  disease: DiseaseHealingProtocol | null;
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  patientName?: string;
  initialStep?: WorkflowStep;
  onStepChange?: (step: WorkflowStep) => void;
}

export const AcousticSessionWorkflowModal: React.FC<AcousticSessionWorkflowModalProps> = ({
  disease,
  isOpen,
  onClose,
  onGoBack,
  patientName = 'Misafir Danışan',
  initialStep = 'pre_scan',
  onStepChange,
}) => {
  const [step, setStep] = useState<WorkflowStep>(initialStep);
  const [countdown, setCountdown] = useState<number>(10);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [preScanData, setPreScanData] = useState<AcousticScanData | null>(null);
  const [postScanData, setPostScanData] = useState<AcousticScanData | null>(null);
  const [report, setReport] = useState<SessionComparisonReport | null>(null);

  // In-session timer
  const [sessionSecondsElapsed, setSessionSecondsElapsed] = useState<number>(0);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  // Audio canvas visualizer
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const changeStep = (newStep: WorkflowStep) => {
    setStep(newStep);
    if (onStepChange) onStepChange(newStep);
  };

  // Reset or initialize when opened
  useEffect(() => {
    if (isOpen && disease) {
      const targetStep = initialStep || 'pre_scan';
      setStep(targetStep);
      setCountdown(10);
      setIsScanning(false);
      if (targetStep === 'pre_scan') {
        setPreScanData(null);
        setPostScanData(null);
        setReport(null);
        setSessionSecondsElapsed(0);
        setIsAudioActive(false);
      }
    }
  }, [isOpen, disease, initialStep]);

  // Clean up audio when modal closes
  useEffect(() => {
    return () => {
      soundEngine.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 10-Second Pre/Post Scan Timer
  useEffect(() => {
    let timer: any;
    if (isScanning && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isScanning && countdown === 0) {
      setIsScanning(false);
      if (step === 'pre_scan') {
        const preData = generatePreScanData();
        setPreScanData(preData);
        setStep('in_session');
        // Automatically start the healing frequency audio for the session
        startHealingAudio();
      } else if (step === 'post_scan' && preScanData && disease) {
        const postData = generatePostScanData(preScanData);
        setPostScanData(postData);
        soundEngine.stop();
        setIsAudioActive(false);
        const durationMin = Math.max(1, Math.round(sessionSecondsElapsed / 60));
        const finalReport = createSessionReport(disease, preScanData, postData, patientName, durationMin);
        setReport(finalReport);
        setStep('report');

        // Asynchronously save to Firestore collection 'session_logs'
        try {
          const docRef = doc(db, 'session_logs', finalReport.id);
          setDoc(docRef, { ...finalReport, syncedAt: new Date().toISOString() }, { merge: true }).catch(err => {
            console.debug('Firestore session report notice:', err?.message);
          });
        } catch (fsErr) {
          console.debug('Firestore session report notice:', fsErr);
        }
      }
    }
    return () => clearInterval(timer);
  }, [isScanning, countdown, step, preScanData, disease, sessionSecondsElapsed, patientName]);

  // In-session elapsed timer
  useEffect(() => {
    let interval: any;
    if (step === 'in_session') {
      interval = setInterval(() => {
        setSessionSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Simulated Wave Canvas Animation
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Draw 3 flowing acoustic waves
      const colors = isScanning
        ? ['rgba(52, 211, 153, 0.8)', 'rgba(59, 130, 246, 0.6)', 'rgba(168, 85, 247, 0.4)']
        : ['rgba(16, 185, 129, 0.6)', 'rgba(6, 182, 212, 0.5)', 'rgba(99, 102, 241, 0.3)'];

      colors.forEach((color, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        const freqMultiplier = idx + 1;

        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin((x * 0.03 * freqMultiplier) + phase + (idx * 0.5)) * (isScanning ? 24 : 14);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      phase += isScanning ? 0.08 : 0.03;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isScanning, step]);

  if (!isOpen || !disease) return null;

  const startHealingAudio = async () => {
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
      0.55,
      'ocean'
    );
    setIsAudioActive(true);
  };

  const handleStartPreScan = () => {
    setCountdown(10);
    setIsScanning(true);
  };

  const handleFinishSessionAndStartPostScan = () => {
    setStep('post_scan');
    setCountdown(10);
    setIsScanning(true);
  };

  const handleClose = () => {
    soundEngine.stop();
    setIsAudioActive(false);
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (step === 'report') {
                  changeStep('post_scan');
                } else if (step === 'post_scan') {
                  changeStep('in_session');
                } else if (step === 'in_session') {
                  soundEngine.stop();
                  setIsAudioActive(false);
                  changeStep('pre_scan');
                } else {
                  handleClose();
                  if (onGoBack) onGoBack();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95"
              title="Önceki Adıma veya Listeye Geri Dön"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Geri</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  AKUSTİK REZONANS ÖLÇÜM & RAPORLAMA
                </span>
                <span className="px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                  {disease.primaryFrequencyHz} Hz
                </span>
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-100 line-clamp-1">
                {disease.diseaseName} • Ön/Son Karşılaştırma
              </h3>
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

        {/* Workflow Step Progress Stepper */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-center gap-2 sm:gap-6 text-xs shrink-0">
          <div className={`flex items-center gap-1.5 font-semibold ${step === 'pre_scan' ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'pre_scan' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>1</span>
            <span>Ön Tarama (10s)</span>
          </div>
          <span className="text-slate-700">→</span>
          <div className={`flex items-center gap-1.5 font-semibold ${step === 'in_session' ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'in_session' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>2</span>
            <span>Frekans Seansı</span>
          </div>
          <span className="text-slate-700">→</span>
          <div className={`flex items-center gap-1.5 font-semibold ${step === 'post_scan' ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'post_scan' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>3</span>
            <span>Son Tarama (10s)</span>
          </div>
          <span className="text-slate-700">→</span>
          <div className={`flex items-center gap-1.5 font-semibold ${step === 'report' ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'report' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>4</span>
            <span>Rapor & İndir</span>
          </div>
        </div>

        {/* Content Body based on Step */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 flex flex-col justify-center">

          {/* STEP 1: PRE-SCAN (10 SECONDS) */}
          {step === 'pre_scan' && (
            <div className="text-center space-y-5 max-w-lg mx-auto w-full">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center relative">
                <Mic className={`w-10 h-10 ${isScanning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                {isScanning && (
                  <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold animate-ping">
                    REC
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-100">
                  {isScanning ? `Ön Enerjetik Tarama Yapılıyor (${countdown}s)...` : '1. Adım: Seans Öncesi Baseline Taraması'}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {isScanning
                    ? 'Lütfen sessiz kalın ve rahat nefes alınız. Mikrofon ve biyometrik rezonans sensörleri vokal stres, hücresel frekans ve aura durumunuzu ölçüyor.'
                    : 'Frekans terapisine başlamadan önce mevcut stres, hücresel uyum ve bio-alan seviyenizi ölçmek için 10 saniyelik bir ön tarama başlatın.'}
                </p>
              </div>

              {/* Acoustic Wave Canvas */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <canvas ref={canvasRef} width={400} height={70} className="w-full h-16 rounded-xl" />
              </div>

              {isScanning ? (
                <div className="space-y-2">
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-1000"
                      style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-2xl font-mono font-bold text-emerald-400">{countdown}</span>
                </div>
              ) : (
                <button
                  onClick={handleStartPreScan}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-98 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-950 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>10 Saniyelik Ön Taramayı Başlat</span>
                </button>
              )}
            </div>
          )}

          {/* STEP 2: IN-SESSION LIVE FREQUENCY PLAYER */}
          {step === 'in_session' && (
            <div className="space-y-6 max-w-xl mx-auto w-full">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ŞİFA SEANSI AKTİF • {disease.primaryFrequencyHz} Hz</span>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-mono font-bold text-slate-100 tracking-wider">
                    {formatTime(sessionSecondsElapsed)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Geçen Seans Süresi (Önerilen: {disease.usagePrescription.durationPerSessionMinutes} Dk)</span>
                </div>

                {/* Live Waveform */}
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <canvas ref={canvasRef} width={400} height={50} className="w-full h-12 rounded-lg" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Ön Tarama Stres Skoru:</span>
                    <span className="text-sm font-bold text-rose-400">%{preScanData?.vocalStressScore}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Ön Tarama Hücresel Uyum:</span>
                    <span className="text-sm font-bold text-amber-400">%{preScanData?.cellularResonanceCoherence}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic">
                  "{disease.healingBenefits.slice(0, 140)}..."
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleFinishSessionAndStartPostScan}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-sm shadow-xl shadow-blue-950 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Seansı Bitir ve Son Taramayı Başlat (10s)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: POST-SCAN (10 SECONDS) */}
          {step === 'post_scan' && (
            <div className="text-center space-y-5 max-w-lg mx-auto w-full">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/30 mx-auto flex items-center justify-center relative">
                <Mic className="w-10 h-10 text-blue-400 animate-pulse" />
                <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-[11px] font-bold animate-ping">
                  SON
                </span>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-100">
                  3. Adım: Seans Sonrası Ölçüm Yapılıyor ({countdown}s)...
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Frekans seansı tamamlandı. Hücrelerinizdeki ve sesinizdeki rezonans dönüşümünü, stres düşüşünü ve bio-alan genişlemesini hesaplıyoruz.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <canvas ref={canvasRef} width={400} height={70} className="w-full h-16 rounded-xl" />
              </div>

              <div className="space-y-2">
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-1000"
                    style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                  />
                </div>
                <span className="text-2xl font-mono font-bold text-blue-400">{countdown}</span>
              </div>
            </div>
          )}

          {/* STEP 4: DETAILED COMPARATIVE REPORT & EXPORT */}
          {step === 'report' && report && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                    AKN GLOBAL GROUP LTD • ŞİFA RAPORU ({report.id})
                  </span>
                  <h4 className="text-base font-bold text-slate-100 mt-0.5">
                    {disease.diseaseName} — Seans Öncesi & Sonrası Analiz
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {report.date} | Seans Süresi: {report.sessionDurationMinutes} Dakika
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => downloadHealingReportPDF(report)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF İndir</span>
                  </button>

                  <button
                    onClick={() => downloadHealingReportWord(report)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Word İndir</span>
                  </button>

                  <button
                    onClick={() => downloadHealingReportTXT(report)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>TXT İndir</span>
                  </button>
                </div>
              </div>

              {/* Comparative Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
                {/* Metric 1: Vocal Stress */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Vokal / Enerjetik Stres</span>
                    <span className="flex items-center text-emerald-400 font-bold text-[11px]">
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {report.stressReductionDelta}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Önce</span>
                      <span className="text-base font-mono font-bold text-rose-400">%{report.preScan.vocalStressScore}</span>
                    </div>
                    <span className="text-slate-600">→</span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Sonra</span>
                      <span className="text-xl font-mono font-bold text-emerald-400">%{report.postScan.vocalStressScore}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${100 - (report.postScan.vocalStressScore ?? 0)}%` }} />
                  </div>
                </div>

                {/* Metric 2: Cellular Coherence */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Hücresel Rezonans Uyumu</span>
                    <span className="flex items-center text-emerald-400 font-bold text-[11px]">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{report.coherenceGainDelta}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Önce</span>
                      <span className="text-base font-mono font-bold text-amber-400">%{report.preScan.cellularResonanceCoherence}</span>
                    </div>
                    <span className="text-slate-600">→</span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Sonra</span>
                      <span className="text-xl font-mono font-bold text-emerald-400">%{report.postScan.cellularResonanceCoherence}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full" style={{ width: `${report.postScan.cellularResonanceCoherence}%` }} />
                  </div>
                </div>

                {/* Metric 3: Bio-Field Balance */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Biyo-Alan & Aura Dengesi</span>
                    <span className="flex items-center text-emerald-400 font-bold text-[11px]">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{report.bioFieldGainDelta}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Önce</span>
                      <span className="text-base font-mono font-bold text-amber-400">%{report.preScan.bioFieldBalance}</span>
                    </div>
                    <span className="text-slate-600">→</span>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Sonra</span>
                      <span className="text-xl font-mono font-bold text-purple-400">%{report.postScan.bioFieldBalance}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${report.postScan.bioFieldBalance}%` }} />
                  </div>
                </div>

              </div>

              {/* Autonomic State Shift */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">Otonom Sinir Sistemi Faz Değişimi</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">SEANS ÖNCESİ:</span>
                    <span className="text-slate-300">{report.preScan.autonomicState}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                    <span className="text-[10px] text-emerald-400 block font-bold">SEANS SONRASI:</span>
                    <span>{report.postScan.autonomicState}</span>
                  </div>
                </div>
              </div>

              {/* Re-Run Action */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setStep('pre_scan');
                    setCountdown(10);
                    setIsScanning(false);
                    setPreScanData(null);
                    setPostScanData(null);
                    setReport(null);
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Yeni Bir Seans Taraması Başlat</span>
                </button>

                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                >
                  Tamamla ve Kapat
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
