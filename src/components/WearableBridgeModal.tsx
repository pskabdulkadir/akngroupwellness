import React, { useState, useEffect, useRef } from 'react';
import { 
  Watch, 
  Heart, 
  Activity, 
  Battery, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Volume2, 
  Sliders, 
  ShieldCheck, 
  Info,
  Radio,
  Play,
  FileText,
  Download,
  ExternalLink,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { 
  wearableService, 
  WearableBiometricData, 
  ConnectionStatus, 
  BioTuningSuggestion 
} from '../services/wearableBluetoothService';
import { soundEngine } from '../utils/soundEngine';
import { downloadWearableReportWord, downloadWearableReportPDF } from '../utils/moduleReportsExport';

interface WearableBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFrequency?: (freqHz: number, binauralHz: number, name: string) => void;
}

export const WearableBridgeModal: React.FC<WearableBridgeModalProps> = ({
  isOpen,
  onClose,
  onApplyFrequency,
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(wearableService.getStatus());
  const [data, setData] = useState<WearableBiometricData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [autoTuning, setAutoTuning] = useState<boolean>(wearableService.isAutoTuningActive());
  const [lastBioSuggestion, setLastBioSuggestion] = useState<BioTuningSuggestion | null>(null);
  const [ecgData, setEcgData] = useState<number[]>([]);
  const [showPairingGuide, setShowPairingGuide] = useState<boolean>(false);
  const [isIframe, setIsIframe] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsIframe(wearableService.isRunningInIframe());

    const unsubStatus = wearableService.subscribeStatus((st, msg) => {
      setStatus(st);
      if (msg) setErrorMessage(msg);
      else setErrorMessage('');
    });

    const unsubData = wearableService.subscribeData((biometrics) => {
      setData(biometrics);
      setEcgData((prev) => {
        const next = [...prev, biometrics.heartRateBpm];
        if (next.length > 50) return next.slice(-50);
        return next;
      });
    });

    const unsubTuning = wearableService.subscribeBioTuning((suggestion) => {
      setLastBioSuggestion(suggestion);
      // If audio is playing and auto tuning is on, automatically smooth-shift the frequency
      if (soundEngine.getIsPlaying() && wearableService.isAutoTuningActive()) {
        soundEngine.transitionFrequencySmooth(suggestion.recommendedCarrierHz, suggestion.recommendedBinauralHz, 2.5);
      }
    });

    return () => {
      unsubStatus();
      unsubData();
      unsubTuning();
    };
  }, [isOpen]);

  // Real-time canvas ECG wave generator
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (status === 'connected' && data) {
        // ECG waveform with realistic P-QRS-T complex
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const bpm = data.heartRateBpm;
        const wavePeriod = Math.max(20, (60 / bpm) * 120);

        for (let x = 0; x < w; x++) {
          const posInCycle = (x + offset) % wavePeriod;
          const normPos = posInCycle / wavePeriod;
          let y = h / 2;

          // P-wave
          if (normPos > 0.15 && normPos < 0.25) {
            y -= Math.sin((normPos - 0.15) * 10 * Math.PI) * 8;
          }
          // Q-dip
          else if (normPos >= 0.28 && normPos < 0.32) {
            y += 6;
          }
          // R-spike
          else if (normPos >= 0.32 && normPos < 0.38) {
            y -= Math.sin((normPos - 0.32) / 0.06 * Math.PI) * 48;
          }
          // S-dip
          else if (normPos >= 0.38 && normPos < 0.42) {
            y += 12;
          }
          // T-wave
          else if (normPos > 0.50 && normPos < 0.68) {
            y -= Math.sin((normPos - 0.50) / 0.18 * Math.PI) * 14;
          }

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        offset += 2.5;
      } else {
        // Flat baseline with slight noise
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * 0.05 + offset * 0.1) * 2;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        offset += 1;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, status, data]);

  if (!isOpen) return null;

  const handleConnectReal = async (useAcceptAll = false) => {
    setErrorMessage('');
    await wearableService.connectRealDevice(useAcceptAll);
  };

  const handleOpenInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStartSim = (bpm = 74) => {
    setErrorMessage('');
    wearableService.startSimulatedWatch(bpm);
  };

  const handleDisconnect = () => {
    wearableService.disconnect();
    setData(null);
  };

  const handleToggleAutoTuning = () => {
    const next = !autoTuning;
    setAutoTuning(next);
    wearableService.setAutoTuning(next);
  };

  const handleApplyOptimalFrequency = (freqHz: number, binauralHz: number, name: string) => {
    if (onApplyFrequency) {
      onApplyFrequency(freqHz, binauralHz, name);
    } else {
      soundEngine.startAdaptiveBioFrequency(freqHz, binauralHz, 'alpha', 0.5, 'ocean');
    }
  };

  const isIframeBlocked = errorMessage === 'IFRAME_POLICY_BLOCKED' || Boolean(errorMessage && errorMessage.toLowerCase().includes('permission'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/60 flex flex-col scrollbar-none">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Aura-Sync Akıllı Saat & Biyometrik Köprü
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v3.0 Live BLE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bluetooth Heart Rate (0x180D) • Canlı Nabız, HRV & Dinamik Frekans Uyarlaması
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* IFRAME PERMISSIONS POLICY SPECIAL RESOLUTION CARD */}
          {isIframeBlocked && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-950 to-rose-950/60 border border-amber-500/50 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-200">
                    Önizleme Güvenlik Kuralı: Bluetooth İzni Kısıtlandı
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Google AI Studio önizleme penceresi (iframe) tarayıcı güvenlik ilkeleri nedeniyle doğrudan Bluetooth donanımına erişimi engellemektedir. Bu durum uygulamanın bir hatası değil, tarayıcınızın iframe güvenlik standardıdır.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  onClick={handleOpenInNewTab}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 active:scale-95 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>1. Yeni Sekmede Aç (Gerçek Bluetooth İzniyle)</span>
                </button>
                <button
                  onClick={() => handleStartSim(74)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/50 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>2. Canlı Simülasyonu Başlat (Cihazsız Test)</span>
                </button>
              </div>
            </div>
          )}

          {/* Connection Control Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  status === 'connected' ? 'bg-emerald-400 animate-pulse' :
                  status === 'connecting' ? 'bg-amber-400 animate-ping' :
                  'bg-slate-600'
                }`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {status === 'connected' ? 'Cihaz Senkronize Edildi' :
                   status === 'connecting' ? 'Bluetooth Cihazı Aranıyor...' :
                   'Bağlantı Bekleniyor'}
                </span>
                {data?.isSimulated && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                    Canlı Biyo-Simülasyon
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold text-slate-100">
                {status === 'connected' ? wearableService.getDeviceName() : 'Standart BLE Akıllı Saat / Polar / Garmin / Apple Watch'}
              </div>
              {errorMessage && !isIframeBlocked && (
                <div className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {status === 'connected' ? (
                <button
                  onClick={handleDisconnect}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
                >
                  Bağlantıyı Kes
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleConnectReal(false)}
                    disabled={status === 'connecting'}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 active:scale-95 transition-all"
                  >
                    <Watch className="w-4 h-4" />
                    <span>Saati Bağla (BLE)</span>
                  </button>
                  <button
                    onClick={() => handleStartSim(74)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold active:scale-95 transition-all"
                    title="Cihaz olmadan test et"
                  >
                    Simüle Et
                  </button>
                  {isIframe && (
                    <button
                      onClick={handleOpenInNewTab}
                      className="p-2.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all"
                      title="Yeni Sekmede Aç"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Real-Time Pulse & ECG Canvas */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Activity className="w-4 h-4 animate-pulse" />
                Gerçek Zamanlı Biyometrik EKG & Nabız Dalgası
              </span>
              {data?.batteryLevelPercent !== null && data?.batteryLevelPercent !== undefined && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  %{data.batteryLevelPercent}
                </span>
              )}
            </div>
            <div className="w-full h-28 bg-slate-950 rounded-xl overflow-hidden border border-slate-850 relative">
              <canvas
                ref={canvasRef}
                width={560}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 4-Metric Biometric Dashboard Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* 1. Real-time Heart Rate (BPM) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Nabız</span>
                <Heart className={`w-3.5 h-3.5 ${status === 'connected' ? 'text-rose-500 animate-ping' : 'text-slate-600'}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">
                  {status === 'connected' && data ? data.heartRateBpm : '--'}
                </span>
                <span className="text-xs text-slate-400 font-bold">BPM</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {status === 'connected' && data ? (
                  data.heartRateBpm < 60 ? 'Bradikardi / Derin Dinlenme' :
                  data.heartRateBpm > 95 ? 'Yüksek Hızlanma' : 'Optimum Dinlenme Aralığı'
                ) : 'Sensör beklemede'}
              </div>
            </div>

            {/* 2. HRV (RMSSD in ms) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>HRV (RMSSD)</span>
                <Activity className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-teal-300">
                  {status === 'connected' && data ? data.hrvRmssdMs : '--'}
                </span>
                <span className="text-xs text-teal-400/80 font-bold">ms</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {status === 'connected' && data ? (
                  data.hrvRmssdMs > 60 ? 'Yüksek Otonom Esneklik' :
                  data.hrvRmssdMs < 30 ? 'Düşük Vagus Tonusu' : 'Dengeli Doku Yanıtı'
                ) : 'RR aralıkları'}
              </div>
            </div>

            {/* 3. Stress Index (0-100%) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Stres İndeksi</span>
                <Zap className={`w-3.5 h-3.5 ${
                  (data?.stressIndex || 0) > 60 ? 'text-amber-400' : 'text-emerald-400'
                }`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black ${
                  !data ? 'text-slate-500' :
                  data.stressIndex > 65 ? 'text-rose-400' :
                  data.stressIndex > 40 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {status === 'connected' && data ? `%${data.stressIndex}` : '--'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {status === 'connected' && data ? (
                  data.stressIndex > 65 ? 'Yüksek Sempatik Yük' :
                  data.stressIndex > 40 ? 'Hafif Zihinsel Gerilim' : 'Huzurlu & Sakin'
                ) : 'Biyofeedback'}
              </div>
            </div>

            {/* 4. Coherence Score (0-100%) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Kalp Koheransı</span>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-indigo-300">
                  {status === 'connected' && data ? `%${data.coherenceScore}` : '--'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {status === 'connected' && data ? (
                  data.coherenceScore > 75 ? 'Mükemmel Sinüzoidal Ritim' :
                  'Gelişen Uyum'
                ) : 'Kardiyo-rezonans'}
              </div>
            </div>

          </div>

          {/* Simulated Quick Heart States (Allows testing the biofeedback engine immediately) */}
          {status === 'connected' && data?.isSimulated && (
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
                <span>⚡ Hızlı Biyo-Simülasyon Durum Testi</span>
                <span className="text-slate-400 font-normal">Frekans motorunun adaptasyonunu test edin:</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => handleStartSim(62)}
                  className="p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold transition-all text-center"
                >
                  🟢 Sakin (62 BPM)
                </button>
                <button
                  onClick={() => handleStartSim(76)}
                  className="p-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-bold transition-all text-center"
                >
                  🔵 Normal (76 BPM)
                </button>
                <button
                  onClick={() => handleStartSim(108)}
                  className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 border border-rose-500/30 text-rose-300 font-bold transition-all text-center"
                >
                  🔴 Taşikardi / Stres (108 BPM)
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Frequency Auto-Tuning Control */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Dinamik Biyo-Frekans Otomatik Uyarlama (Biofeedback Loop)
                </span>
              </div>
              <button
                onClick={handleToggleAutoTuning}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoTuning ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoTuning ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bu mod açıkken AuraBio, akıllı saatinizden gelen nabız ve HRV dalgalanmalarını anlık takip eder. Nabzınız yükseldiğinde seansı kesmeden frekansı yumuşakça <strong>432 Hz Solfeggio & 5.5 Hz Teta</strong> dalgasına; kalp koheransı dengelendiğinde ise <strong>528 Hz Hücresel Sevgi Frekansına</strong> otomatik taşır.
            </p>

            {lastBioSuggestion && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-500/40 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Önerilen Ayar: {lastBioSuggestion.recommendedCarrierHz} Hz + {lastBioSuggestion.recommendedBinauralHz} Hz Binaural</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{lastBioSuggestion.reason}</div>
                </div>
                <button
                  onClick={() => handleApplyOptimalFrequency(lastBioSuggestion.recommendedCarrierHz, lastBioSuggestion.recommendedBinauralHz, 'Biyometrik Optimize Frekans')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow"
                >
                  <Play className="w-3 h-3" />
                  <span>Uygula</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Frequency Sync Presets based on current biometrics */}
          {status === 'connected' && data && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nabzınıza Özel Hızlı Akustik Rezonanslar
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handleApplyOptimalFrequency(432, 5.5, 'Vagus Siniri & Kalp Sakinleştirici')}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center justify-between group transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                      432 Hz + 5.5 Hz Teta (Vagus Rahatlatma)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Nabız düşürme, tansiyon dengeleme ve derin sakinlik
                    </div>
                  </div>
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </button>

                <button
                  onClick={() => handleApplyOptimalFrequency(528, 7.83, 'Kalp Çakrası & DNA Koheransı')}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-left flex items-center justify-between group transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                      528 Hz + 7.83 Hz Schumann (Kalp Koheransı)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Ritim stabilitesi, hücresel şifa ve sevgi alanı
                    </div>
                  </div>
                  <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* PAIRING GUIDE ACCORDION */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
            <button
              onClick={() => setShowPairingGuide(!showPairingGuide)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  📖 Akıllı Saat Eşleştirme & Bluetooth Rehberi (Apple, Garmin, Xiaomi, Polar, Huawei)
                </span>
              </div>
              {showPairingGuide ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showPairingGuide && (
              <div className="p-4 pt-1 text-xs text-slate-300 space-y-3 border-t border-slate-850 bg-slate-900/40">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-300 block">⌚ Apple Watch</span>
                  <p className="text-slate-400">
                    Apple Watch doğrudan BLE kalp hızı yayını yapmak için <strong>HeartCast</strong> veya <strong>Echo</strong> ücretsiz uygulamasını kullanır. Uygulamadan yayını başlatıp buradaki "Saati Bağla" butonuna tıklayınız.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-teal-300 block">⌚ Garmin</span>
                  <p className="text-slate-400">
                    Garmin saatinizde <em>Ayarlar &gt; Bilekten Kalp Hızı &gt; Kalp Hızı Yayını Yap (Broadcast HR)</em> seçeneğini aktif edin.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-indigo-300 block">⌚ Xiaomi / Mi Band / Amazfit</span>
                  <p className="text-slate-400">
                    Mi Fitness veya Zepp Life uygulamasından <em>Cihaz Ayarları &gt; Kalp Atış Hızı Paylaşımı (Heart Rate Sharing)</em> ayarını açın.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-purple-300 block">⌚ Polar (H10, Verity Sense) / BLE Göğüs Bandı / Smart Ring</span>
                  <p className="text-slate-400">
                    Cihazı takın veya şarj yuvasından çıkarın. Standart BLE Kalp Hızı Profili (0x180D) otomatik taranacaktır.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleConnectReal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Genişletilmiş BLE Cihaz Taraması Yap (Tüm Cihazlar)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer & Export */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const bpm = data?.heartRateBpm || 72;
                const hrv = data?.hrvRmssdMs || 48;
                const stress = !data ? 'Düşük (Sakin)' : data.stressIndex > 65 ? 'Yüksek (Stresli/Taşikardi)' : data.stressIndex > 40 ? 'Orta (Normal)' : 'Düşük (Sakin)';
                const coherence = data?.coherenceScore || 82;
                const carrier = lastBioSuggestion?.recommendedCarrierHz || 528;
                const binaural = lastBioSuggestion?.recommendedBinauralHz || 7.83;
                const rec = lastBioSuggestion?.reason || 'Kalp ritmi dengeli. 528 Hz hücresel onarım frekansı ile biyolojik ahenk desteklenmektedir.';
                downloadWearableReportPDF({
                  deviceModel: data?.deviceLabel || 'Bluetooth Akıllı Saat',
                  heartRateBpm: bpm,
                  hrvMs: hrv,
                  stressLevel: stress,
                  coherenceScore: coherence,
                  carrierHz: carrier,
                  binauralHz: binaural,
                  recommendation: rec,
                  durationSeconds: 900,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
              title="Biyometrik Rapor (PDF) İndir"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Biyometrik PDF</span>
            </button>

            <button
              onClick={() => {
                const bpm = data?.heartRateBpm || 72;
                const hrv = data?.hrvRmssdMs || 48;
                const stress = !data ? 'Düşük (Sakin)' : data.stressIndex > 65 ? 'Yüksek (Stresli/Taşikardi)' : data.stressIndex > 40 ? 'Orta (Normal)' : 'Düşük (Sakin)';
                const coherence = data?.coherenceScore || 82;
                const carrier = lastBioSuggestion?.recommendedCarrierHz || 528;
                const binaural = lastBioSuggestion?.recommendedBinauralHz || 7.83;
                const rec = lastBioSuggestion?.reason || 'Kalp ritmi dengeli. 528 Hz hücresel onarım frekansı ile biyolojik ahenk desteklenmektedir.';
                downloadWearableReportWord({
                  deviceModel: data?.deviceLabel || 'Bluetooth Akıllı Saat',
                  heartRateBpm: bpm,
                  hrvMs: hrv,
                  stressLevel: stress,
                  coherenceScore: coherence,
                  carrierHz: carrier,
                  binauralHz: binaural,
                  recommendation: rec,
                  durationSeconds: 900,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
              title="Biyometrik Rapor (Word .doc) İndir"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Biyometrik Word</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Web Bluetooth GATT 0x180D</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WearableBridgeModal;


