import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  EyeOff, 
  Radio,
  Activity,
  Compass,
  Palette,
  Layers,
  Zap,
  ArrowRight,
  Lock,
  Leaf,
  Gem,
  Box,
  UserCheck,
  Smartphone,
  BookOpen,
  Disc,
  AlertCircle,
  Scan,
  Sun,
  SunMedium,
  Volume2,
  VolumeX,
  StopCircle,
  Play,
  Pause,
  Clock,
  SwitchCamera,
  ChevronDown,
  Video,
  HelpCircle,
  Mic,
  MicOff,
  Droplets,
  Target
} from 'lucide-react';
import { ScanResult, TargetClassification } from '../types';
import { analyzeVideoFrame, generateDeepBioScan, DetectionStatus } from '../utils/bioEngine';
import { soundEngine } from '../utils/soundEngine';
import { voiceAssistant, VoiceCommandEvent } from '../utils/voiceAssistant';
import { TreatmentSelection } from './FrequencyLoadingModal';

interface CameraViewProps {
  onScanComplete: (result: ScanResult) => void;
  onOpenFrequencySelector: () => void;
  onOpenUserGuide?: () => void;
  preScanData?: ScanResult;
  isTransmitting?: boolean;
  activeFrequency?: number;
  autoStartScan?: boolean;
  activeTreatment?: TreatmentSelection | null;
  onCompleteTreatment?: (treatment?: TreatmentSelection) => void;
  onCancelTreatment?: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onScanComplete,
  onOpenFrequencySelector,
  onOpenUserGuide,
  preScanData,
  isTransmitting = false,
  activeFrequency,
  autoStartScan = false,
  activeTreatment = null,
  onCompleteTreatment,
  onCancelTreatment,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastAnalysisTimeRef = useRef<number>(0);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanSecondsLeft, setScanSecondsLeft] = useState<number>(15);
  const [scanPhaseText, setScanPhaseText] = useState<string>('Optik Foton & Biyo-Alan Sensörleri Okunuyor...');
  const [humanWarningMessage, setHumanWarningMessage] = useState<string | null>(null);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState<boolean>(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);

  // Frequency Loading on Camera View State
  const [treatmentTimeLeft, setTreatmentTimeLeft] = useState<number>(30);
  const [treatmentDuration, setTreatmentDuration] = useState<number>(30);
  const [isTreatmentRunning, setIsTreatmentRunning] = useState<boolean>(false);
  const [isTreatmentMuted, setIsTreatmentMuted] = useState<boolean>(false);
  const treatmentTimerRef = useRef<any>(null);
  const treatmentEndTimeRef = useRef<number>(Date.now() + 30000);
  const treatmentRemainingMsRef = useRef<number>(30000);
  const isTreatmentRunningRef = useRef<boolean>(false);
  const isScanningRef = useRef<boolean>(false);
  const scanIntervalRef = useRef<any>(null);

  // Handle Cancel/Stop Scan
  const handleCancelScan = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
    setScanProgress(0);
    voiceAssistant.speak('Tarama durduruldu.');
  }, []);

  useEffect(() => {
    isTreatmentRunningRef.current = isTreatmentRunning;
  }, [isTreatmentRunning]);

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>({
    isTargetDetected: false,
    isHumanDetected: false,
    canLoadFrequency: true,
    targetType: 'human',
    targetName: 'Hedef Aranıyor',
    objectCategory: 'Bekleniyor',
    confidence: 0,
    targetBounds: null,
    luminanceAverage: 0,
    chromaVariation: 0,
    spectralPurity: 0,
    reflectanceIndex: 0,
    opticalSignature: 'Kamera başlatılıyor',
    humanPromptMessage: 'Kamerayı hedefe çevirin',
    isLowLight: false,
    isOverexposed: false,
    lightingQuality: 'optimal',
    lightingAdvice: 'Işık seviyesi uygun',
    detectedEnergies: [],
    message: 'Kamerayı hedefe çevirin...',
    colorTemperatureK: 5500,
    quantumCoherence: 75,
    dominantAuraHex: '#10b981',
    dominantAuraName: 'Zümrüt Yeşili (Kalp Şifası)',
    secondaryAuraHex: '#06b6d4',
    auraFrequencyHz: 528
  });

  const [showSunIndicator, setShowSunIndicator] = useState<boolean>(true);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(() => voiceAssistant.isListening());

  // Subscribe to voice assistant
  useEffect(() => {
    setIsVoiceMuted(voiceAssistant.isMute());
    const unsubSpeaking = voiceAssistant.subscribeSpeaking((speaking) => {
      setIsVoiceSpeaking(speaking);
    });
    const unsubListening = voiceAssistant.subscribeListening((listening) => {
      setIsVoiceListening(listening);
    });
    const unsubCommand = voiceAssistant.subscribeCommand((cmd: VoiceCommandEvent) => {
      if (cmd.type === 'START_SCAN') {
        handleStartScan();
      } else if (cmd.type === 'CANCEL_SCAN') {
        handleCancelScan();
      } else if (cmd.type === 'TOGGLE_CAMERA') {
        toggleFacingMode();
      } else if (cmd.type === 'MUTE_VOICE') {
        setIsVoiceMuted(true);
      } else if (cmd.type === 'UNMUTE_VOICE') {
        setIsVoiceMuted(false);
      }
    });

    return () => {
      unsubSpeaking();
      unsubListening();
      unsubCommand();
    };
  }, []);

  const toggleVoiceMute = () => {
    const next = voiceAssistant.toggleMute();
    setIsVoiceMuted(next);
  };

  const toggleVoiceListening = async () => {
    voiceAssistant.unlockMobileSpeech();
    const next = await voiceAssistant.toggleListening();
    setIsVoiceListening(next);
  };

  // Enumerate available camera video inputs
  const refreshDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
      }
    } catch (e) {
      console.warn('Enumerate devices warning:', e);
    }
  }, []);

  // Canlı kamerayı güvenli şekilde başlat (ideal çözünürlük veya temel video kısıtlaması ile)
  const startCamera = useCallback(async (facing: 'user' | 'environment', deviceId?: string) => {
    try {
      setCameraError(null);
      setIsCameraInitializing(true);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      let mediaStream: MediaStream | null = null;

      try {
        const videoConstraints: MediaTrackConstraints = deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: facing,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            };

        const constraints: MediaStreamConstraints = {
          video: videoConstraints,
          audio: false,
        };

        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        // İzin açıkça reddedildiyse doğrudan hatayı fırlat
        if (firstErr?.name === 'NotAllowedError' || firstErr?.name === 'PermissionDeniedError') {
          throw firstErr;
        }
        console.warn('Gelişmiş kısıtlamalar desteklenmedi, temel video akışına geçiliyor:', firstErr);
        // Bazı donanım/tarayıcılarda ideal çözünürlük hata verebilir; temel video parametresi ile dene
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (!mediaStream) {
        throw new Error('Kamera video akışı alınamadı.');
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsCameraInitializing(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        const onCanPlay = () => {
          if (videoRef.current) {
            videoRef.current.play().catch((playErr: any) => {
              if (playErr?.name !== 'AbortError') {
                console.warn('Video oynatma bildirimi:', playErr);
              }
            });
            // İlk biyometrik analiz karesini hemen çalıştır
            let canvas = analysisCanvasRef.current;
            if (!canvas && typeof document !== 'undefined') {
              canvas = document.createElement('canvas');
              canvas.width = 160;
              canvas.height = 120;
              analysisCanvasRef.current = canvas;
            }
            if (canvas && videoRef.current.videoWidth > 0) {
              const instant = analyzeVideoFrame(videoRef.current, canvas);
              setDetectionStatus(instant);
            }
          }
        };
        videoRef.current.onloadedmetadata = onCanPlay;
        videoRef.current.oncanplay = onCanPlay;
      }

      refreshDevices();
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setIsCameraInitializing(false);
      console.warn('Canlı kamera başlatma hatası:', err);

      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        String(err?.message || '').toLowerCase().includes('permission');

      if (isPermissionDenied) {
        setCameraError(
          'Kamera erişim izni verilmedi veya engellendi. Gerçek seans ve biyo-rezonans ölçümü için lütfen tarayıcı ayarlarından (adres çubuğundaki kilit simgesi) kamera iznini onaylayın.'
        );
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraError('Cihazınızda aktif bir web kamerası bulunamadı. Lütfen kamera donanımınızı bağlayıp yeniden deneyin.');
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        setCameraError('Kamera başka bir uygulama veya sekme tarafından kullanılıyor. Lütfen diğer uygulamaları kapatıp tekrar deneyin.');
      } else {
        setCameraError(err?.message || 'Canlı kamera akışı açılamadı. Lütfen kamera izninizi kontrol edin.');
      }
    }
  }, [refreshDevices]);

  useEffect(() => {
    startCamera(facingMode, selectedDeviceId || undefined);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, selectedDeviceId, startCamera]);

  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    setSelectedDeviceId('');
    startCamera(nextFacing);
  };

  const handleSelectDevice = (devId: string) => {
    setSelectedDeviceId(devId);
    setIsDeviceMenuOpen(false);
    startCamera(facingMode, devId);
  };

  // Optical Analysis Loop - Real-time human biometric detection
  useEffect(() => {
    let animFrameId: number;

    const processFrame = (timestamp: number) => {
      if (
        !isScanningRef.current &&
        !isTreatmentRunningRef.current &&
        timestamp - lastAnalysisTimeRef.current >= 150
      ) {
        lastAnalysisTimeRef.current = timestamp;

        const video = videoRef.current;
        let canvas = analysisCanvasRef.current;
        if (!canvas && typeof document !== 'undefined') {
          canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 120;
          analysisCanvasRef.current = canvas;
        }

        if (
          video &&
          canvas &&
          (video.readyState >= 2 || (video.currentTime > 0 && !video.paused)) &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          const detection = analyzeVideoFrame(video, canvas);
          setDetectionStatus(detection);
          setIsCameraInitializing(false);
        }
      }

      animFrameId = requestAnimationFrame(processFrame);
    };

    animFrameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  // Handle User Clicking "Start Frequency Loading" Button
  const handleStartTreatmentSession = () => {
    if (!activeTreatment) return;
    treatmentRemainingMsRef.current = treatmentDuration * 1000;
    treatmentEndTimeRef.current = Date.now() + treatmentRemainingMsRef.current;
    setIsTreatmentRunning(true);

    if (!isTreatmentMuted && activeTreatment) {
      soundEngine.playFrequency(activeTreatment.frequencyHz || 528, 0.45);
    }

    if (activeTreatment) {
      voiceAssistant.speakFrequencyStart(activeTreatment.name || 'Frekans Yükleme', activeTreatment.frequencyHz || 528);
    }
  };

  // Handle Duration Preset Selection
  const handleSelectTreatmentDuration = (seconds: number) => {
    setTreatmentDuration(seconds);
    setTreatmentTimeLeft(seconds);
    treatmentRemainingMsRef.current = seconds * 1000;
    treatmentEndTimeRef.current = Date.now() + treatmentRemainingMsRef.current;

    if (isTreatmentRunning) {
      if (!isTreatmentMuted && activeTreatment) {
        soundEngine.playFrequency(activeTreatment.frequencyHz || 528, 0.45);
      }
    }
  };

  // Handle treatment timer: Ultra-precise wall-clock countdown
  useEffect(() => {
    if (activeTreatment && isTreatmentRunning) {
      treatmentEndTimeRef.current = Date.now() + treatmentRemainingMsRef.current;

      treatmentTimerRef.current = setInterval(() => {
        const now = Date.now();
        const remMs = Math.max(0, treatmentEndTimeRef.current - now);
        treatmentRemainingMsRef.current = remMs;
        const curSec = Math.max(0, Math.ceil(remMs / 1000));

        setTreatmentTimeLeft(curSec);

        if (remMs <= 0) {
          clearInterval(treatmentTimerRef.current);
          soundEngine.stop();
          setIsTreatmentRunning(false);
          
          if (activeTreatment) {
            voiceAssistant.speakFrequencyComplete(activeTreatment.name || 'Frekans');
          }

          if (onCompleteTreatment) {
            setTimeout(() => {
              onCompleteTreatment(activeTreatment || undefined);
            }, 300);
          }
        }
      }, 100);
    } else {
      if (treatmentTimerRef.current) clearInterval(treatmentTimerRef.current);
    }

    return () => {
      if (treatmentTimerRef.current) clearInterval(treatmentTimerRef.current);
    };
  }, [activeTreatment, isTreatmentRunning, onCompleteTreatment]);

  // Toggle treatment mute
  const handleToggleTreatmentMute = () => {
    if (isTreatmentMuted) {
      if (activeTreatment && isTreatmentRunning && treatmentRemainingMsRef.current > 0) {
        soundEngine.playFrequency(activeTreatment.frequencyHz || 528, 0.45);
      }
      setIsTreatmentMuted(false);
    } else {
      soundEngine.stop();
      setIsTreatmentMuted(true);
    }
  };

  // Toggle treatment pause/play
  const handleToggleTreatmentPause = () => {
    if (isTreatmentRunning) {
      soundEngine.stop();
      treatmentRemainingMsRef.current = Math.max(0, treatmentEndTimeRef.current - Date.now());
      setIsTreatmentRunning(false);
      if (treatmentTimerRef.current) clearInterval(treatmentTimerRef.current);
    } else {
      if (activeTreatment && treatmentRemainingMsRef.current > 0) {
        treatmentEndTimeRef.current = Date.now() + treatmentRemainingMsRef.current;
        if (!isTreatmentMuted) {
          soundEngine.playFrequency(activeTreatment.frequencyHz || 528, 0.45);
        }
        setIsTreatmentRunning(true);
      }
    }
  };

  // Handle Stop/Cancel Treatment
  const handleStopTreatment = () => {
    soundEngine.stop();
    setIsTreatmentRunning(false);
    if (treatmentTimerRef.current) clearInterval(treatmentTimerRef.current);
    if (onCancelTreatment) onCancelTreatment();
  };

  // Start Real 15-Second Live Scanning Sequence for Human Bio-Field
  const handleStartScan = () => {
    const video = videoRef.current;

    setHumanWarningMessage(null);
    setCameraError(null);
    setIsScanning(true);
    setScanProgress(0);
    setScanSecondsLeft(15);
    setScanPhaseText('1/5: İnsan Biyo-Aura Foton & Elektromanyetik Alanı Ölçülüyor...');

    voiceAssistant.speakScanStart();

    const totalDurationMs = 15000;
    const startTime = Date.now();
    const endTime = startTime + totalDurationMs;
    let spokenMilestone30 = false;
    let spokenMilestone70 = false;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = Math.min(totalDurationMs, now - startTime);
      const curProgress = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));
      const curSecondsLeft = Math.max(0, Math.ceil((endTime - now) / 1000));

      setScanProgress(curProgress);
      setScanSecondsLeft(curSecondsLeft);

      if (elapsedMs < 3000) {
        setScanPhaseText('1/5: İnsan Biyo-Aura Foton & Elektromanyetik Alanı Ölçülüyor...');
      } else if (elapsedMs < 6000) {
        setScanPhaseText('2/5: Spektral Letaif & Çakra Enerji Dağılımı Analiz Ediliyor...');
      } else if (elapsedMs < 9000) {
        setScanPhaseText('3/5: 3 Aurik Katman & Kuantum Biyo-Rezonans Haritası Çıkarılıyor...');
      } else if (elapsedMs < 12000) {
        setScanPhaseText('4/5: Meridyen & Yaşam Enerjisi Seviyeleri Hesaplanıyor...');
      } else {
        setScanPhaseText('5/5: Biyo-Rezonans ve Frekans Raporu Derleniyor...');
      }

      if (elapsedMs >= 4500 && !spokenMilestone30) {
        spokenMilestone30 = true;
        voiceAssistant.speakScanProgress(30);
      } else if (elapsedMs >= 10500 && !spokenMilestone70) {
        spokenMilestone70 = true;
        voiceAssistant.speakScanProgress(70);
      }

      if (now >= endTime) {
        clearInterval(interval);
        setIsScanning(false);

        let snapshotDataUrl = '';
        try {
          const snapCanvas = document.createElement('canvas');
          snapCanvas.width = 320;
          snapCanvas.height = 240;
          const sCtx = snapCanvas.getContext('2d');
          if (sCtx) {
            if (video && video.videoWidth > 0 && video.readyState >= 2) {
              if (facingMode === 'user') {
                sCtx.translate(snapCanvas.width, 0);
                sCtx.scale(-1, 1);
              }
              sCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
            } else {
              // Simulated quantum bio-field representation if webcam is not accessible
              const gradient = sCtx.createRadialGradient(160, 120, 20, 160, 120, 140);
              gradient.addColorStop(0, '#10b981');
              gradient.addColorStop(0.5, '#06b6d4');
              gradient.addColorStop(1, '#0f172a');
              sCtx.fillStyle = gradient;
              sCtx.fillRect(0, 0, 320, 240);
            }
            snapshotDataUrl = snapCanvas.toDataURL('image/jpeg', 0.65);
          }
        } catch (snapErr) {
          console.warn('Snapshot capture warning:', snapErr);
        }

        const scanResult = generateDeepBioScan(video, preScanData, snapshotDataUrl, 'human');
        scanResult.snapshotUrl = snapshotDataUrl;

        voiceAssistant.speakScanComplete(scanResult);
        onScanComplete(scanResult);
      }
    }, 50);
  };

  const activeAuraColor = detectionStatus.dominantAuraHex || '#10b981';
  const activeSecondaryColor = detectionStatus.secondaryAuraHex || '#06b6d4';

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Main Video Viewport & Overlays */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        
        {/* Video Element - Live Camera Mode */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Dynamic Holographic Human Bounding Box */}
        {detectionStatus.targetBounds && detectionStatus.isHumanDetected && !isScanning && (
          <div
            className="absolute z-10 pointer-events-none transition-all duration-300 rounded-2xl border-2 shadow-2xl flex flex-col justify-between p-2"
            style={{
              left: `${detectionStatus.targetBounds.x * 100}%`,
              top: `${detectionStatus.targetBounds.y * 100}%`,
              width: `${detectionStatus.targetBounds.width * 100}%`,
              height: `${detectionStatus.targetBounds.height * 100}%`,
              borderColor: activeAuraColor,
              boxShadow: `0 0 25px ${activeAuraColor}40, inset 0 0 15px ${activeAuraColor}20`
            }}
          >
            {/* Top Corner Reticles */}
            <div className="flex justify-between items-start">
              <span className="w-3 h-3 border-t-2 border-l-2" style={{ borderColor: activeAuraColor }} />
              <div className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: activeAuraColor }}>
                <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: activeAuraColor }} />
                <span>İNSAN BİYO-ALANI</span>
              </div>
              <span className="w-3 h-3 border-t-2 border-r-2" style={{ borderColor: activeAuraColor }} />
            </div>

            {/* Bottom Corner Reticles */}
            <div className="flex justify-between items-end">
              <span className="w-3 h-3 border-b-2 border-l-2" style={{ borderColor: activeAuraColor }} />
              <span className="text-[9px] font-mono text-white/90 bg-slate-950/80 px-1.5 py-0.5 rounded">
                %{detectionStatus.confidence} Rezonans
              </span>
              <span className="w-3 h-3 border-b-2 border-r-2" style={{ borderColor: activeAuraColor }} />
            </div>
          </div>
        )}

        {/* Top-Left Camera Device Indicator */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-750 text-[11px] sm:text-xs font-bold text-slate-200 flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">{facingMode === 'user' ? 'Canlı Ön Kamera (Selfie)' : 'Canlı Arka Kamera (Biyo-Alan)'}</span>
            <span className="sm:hidden">{facingMode === 'user' ? 'Ön Kamera' : 'Arka Kamera'}</span>
          </div>

          {videoDevices.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setIsDeviceMenuOpen((prev) => !prev)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 hover:border-emerald-500/50 text-slate-300 text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all"
                title="Kamera Cihazını Seç"
              >
                <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden md:inline">Kamera Seçimi</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isDeviceMenuOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-56 sm:w-60 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800">
                    Cihaz Kameraları
                  </div>
                  {videoDevices.map((dev, idx) => (
                    <button
                      key={dev.deviceId || idx}
                      onClick={() => handleSelectDevice(dev.deviceId)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        selectedDeviceId === dev.deviceId
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{dev.label || `Kamera ${idx + 1}`}</span>
                      {selectedDeviceId === dev.deviceId && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-Right Voice Assistant & User Guide Quick Bar */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleVoiceListening}
            className={`min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0 justify-center p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl backdrop-blur-md border text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 ${
              isVoiceListening
                ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/40 ring-2 ring-emerald-400/40 animate-pulse'
                : 'bg-slate-950/85 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title={isVoiceListening ? 'Sesli Komut Dinlemeyi Kapat' : 'Sesli Komut Dinlemeyi Başlat (Mikrofon)'}
          >
            {isVoiceListening ? <Mic className="w-4 h-4 text-white animate-bounce" /> : <MicOff className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{isVoiceListening ? 'Dinliyor' : 'Sesli Komut'}</span>
          </button>

          <button
            onClick={toggleVoiceMute}
            className={`min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0 justify-center p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl backdrop-blur-md border text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
              isVoiceSpeaking
                ? 'bg-indigo-500/30 text-indigo-300 border-indigo-400 shadow-indigo-500/30 animate-pulse'
                : isVoiceMuted
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                : 'bg-slate-950/85 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title={isVoiceMuted ? 'Sesli Asistanı Aç' : 'Sesli Asistanı Sessize Al'}
          >
            {isVoiceMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isVoiceMuted ? 'Ses Kapalı' : 'Asistan Sesi'}</span>
          </button>

          {onOpenUserGuide && (
            <button
              onClick={onOpenUserGuide}
              className="min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0 justify-center p-1.5 sm:px-3.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-950/90 to-slate-900/90 backdrop-blur-md border border-indigo-500/40 hover:border-indigo-400 text-indigo-200 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
              title="Kullanım Kılavuzu & Sesli Rehber"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Kılavuz</span>
            </button>
          )}
        </div>

        {/* HUMAN DETECTION STATUS BANNER */}
        <div className="absolute top-16 sm:top-20 z-20 flex flex-col items-center pointer-events-none animate-fade-in px-2 max-w-[92vw]">
          {isCameraInitializing ? (
            <div className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/50 shadow-2xl flex items-center gap-2 text-cyan-300 text-[11px] sm:text-xs font-black text-center">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
              <span>KAMERA BAŞLATILIYOR...</span>
            </div>
          ) : detectionStatus.isHumanDetected ? (
            <div 
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border shadow-2xl flex items-center gap-2 text-[11px] sm:text-xs font-black text-center border-emerald-500/60 text-emerald-300"
            >
              <span className="w-2 h-2 rounded-full animate-ping shrink-0 bg-emerald-400" />
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>İNSAN TESPİT EDİLDİ — %{detectionStatus.confidence} REZONANS (TARAMA HAZIR)</span>
            </div>
          ) : (
            <div 
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border shadow-2xl flex items-center gap-2 text-[11px] sm:text-xs font-black text-center border-amber-500/50 text-amber-300"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>İNSAN BEKLENİYOR (Kadraja Giriniz)</span>
            </div>
          )}
        </div>

        {/* HUMAN WARNING PROMPT BANNER */}
        {humanWarningMessage && (
          <div className="absolute top-28 sm:top-32 z-30 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-amber-950/95 border border-amber-500/70 shadow-2xl text-amber-200 text-xs font-bold max-w-md mx-4 animate-bounce">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{humanWarningMessage}</span>
            </div>
            <button 
              onClick={() => setHumanWarningMessage(null)}
              className="p-1 rounded-lg bg-amber-900/60 hover:bg-amber-900 text-amber-300 font-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Canlı Kamera İzin & Başlatma Modalı (Sanal Simülasyon Yoktur) */}
        {cameraError && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-5 animate-fade-in max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-xl shadow-emerald-500/10 animate-pulse">
              <Camera className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white">Canlı Kamera Erişimi Gerekli</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">{cameraError}</p>
            </div>

            <div className="w-full flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => startCamera(facingMode, selectedDeviceId || undefined)}
                className="w-full px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 active:scale-95 transition-all cursor-pointer ring-2 ring-emerald-400/50"
              >
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                <span>Canlı Kamerayı Başlat / İzni Tekrar Dene</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 text-left w-full space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="font-bold text-slate-200">💡 Tarayıcı Kamera İzni Nasıl Onaylanır?</div>
              <div>1. Tarayıcınızın adres çubuğundaki kilit (🔒) veya kamera simgesine tıklayın.</div>
              <div>2. <strong>Kamera</strong> iznini <strong>"İzin Ver"</strong> (Allow) konumuna getirin.</div>
              <div>3. Sayfayı yenileyin veya yukarıdaki <strong>"Canlı Kamerayı Başlat"</strong> butonuna basın.</div>
            </div>
          </div>
        )}

        {/* RADIANT SUN-LIKE GLOWING AURA ORB */}
        {showSunIndicator && (
          <div className="absolute bottom-24 right-4 z-20 pointer-events-none animate-fade-in flex flex-col items-end gap-2.5">
            <div className="relative flex items-center justify-center p-2">
              <div 
                className="absolute w-36 h-36 rounded-full blur-2xl opacity-65 transition-all duration-700 animate-pulse"
                style={{ backgroundColor: activeAuraColor }}
              />

              <div 
                className="absolute w-24 h-24 rounded-full blur-lg opacity-80 transition-all duration-700"
                style={{ backgroundColor: activeSecondaryColor }}
              />

              <svg 
                className="w-28 h-28 animate-[spin_10s_linear_infinite] opacity-95 drop-shadow-[0_0_16px_rgba(255,255,255,0.5)]" 
                viewBox="0 0 100 100"
              >
                {[...Array(16)].map((_, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1={i % 2 === 0 ? "13" : "18"}
                    x2="50"
                    y2={i % 2 === 0 ? "3" : "7"}
                    stroke={i % 2 === 0 ? activeAuraColor : activeSecondaryColor}
                    strokeWidth={i % 2 === 0 ? '4' : '2.5'}
                    strokeLinecap="round"
                    transform={`rotate(${i * 22.5} 50 50)`}
                  />
                ))}
              </svg>

              <div 
                className="absolute w-16 h-16 rounded-full border-2 border-white/90 shadow-2xl flex items-center justify-center transition-all duration-500 overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${activeAuraColor} 50%, ${activeSecondaryColor} 100%)`,
                  boxShadow: `0 0 35px ${activeAuraColor}, inset 0 0 15px rgba(255, 255, 255, 0.9)`
                }}
              >
                <div className="w-4 h-4 rounded-full bg-white/90 blur-[1px] -translate-x-1 -translate-y-1 animate-ping opacity-60" />
                <SunMedium className="w-8 h-8 text-white/95 drop-shadow-md" />
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-white/20 shadow-2xl text-right max-w-[220px] space-y-1">
              <div className="flex items-center justify-end gap-1.5 border-b border-slate-800/80 pb-1">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: activeAuraColor }} />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 truncate">
                  {detectionStatus.targetName}
                </span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>

              <div className="text-xs sm:text-sm font-black leading-tight" style={{ color: activeAuraColor }}>
                {detectionStatus.dominantAuraName}
              </div>

              <div className="text-[9px] font-mono text-slate-400 flex items-center justify-end gap-1.5 pt-0.5">
                <span className="text-cyan-300 font-bold">{detectionStatus.auraFrequencyHz} Hz</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">%{detectionStatus.confidence} Rezonans</span>
              </div>
            </div>
          </div>
        )}

        {/* FREQUENCY LOADING OVERLAY */}
        {activeTreatment && (
          <div className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900/95 border-2 border-emerald-400/80 shadow-2xl shadow-emerald-950/90 space-y-5 text-center">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                {isTreatmentRunning ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span>CANLI FREKANS YÜKLEMESİ AKTİF</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>SÜRE SEÇİN & BAŞLATIN</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleTreatmentMute}
                    className={`p-2 rounded-xl border transition-colors ${
                      isTreatmentMuted 
                        ? 'bg-rose-950/60 text-rose-300 border-rose-500/40' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title={isTreatmentMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                  >
                    {isTreatmentMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleStopTreatment}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                    title="Yüklemeyi Kapat"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-100">
                  {activeTreatment.name}
                </h3>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  {activeTreatment.frequencyHz || 528} Hz Solfeggio Kuantum Dalgası
                </div>
              </div>

              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke={isTreatmentRunning ? '#10b981' : '#f59e0b'}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={377}
                    strokeDashoffset={
                      isTreatmentRunning
                        ? 377 - (377 * (treatmentDuration - treatmentTimeLeft)) / treatmentDuration
                        : 0
                    }
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-mono text-slate-100">
                    {isTreatmentRunning ? `${treatmentTimeLeft}s` : `${treatmentDuration}s`}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    {isTreatmentRunning ? 'Kalan Süre' : 'Seçilen Süre'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Yükleme Süresini Seçin</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {[
                    { secs: 15, label: '15 sn (Hızlı)' },
                    { secs: 30, label: '30 sn (Önerilen)' },
                    { secs: 60, label: '1 dk (Derin)' },
                    { secs: 180, label: '3 dk (Bütünleşik)' },
                    { secs: 300, label: '5 dk (Kapsamlı)' },
                  ].map((preset) => (
                    <button
                      key={preset.secs}
                      onClick={() => handleSelectTreatmentDuration(preset.secs)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        treatmentDuration === preset.secs
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 scale-105 font-black'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                {!isTreatmentRunning ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      onClick={handleStartTreatmentSession}
                      className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-950/80 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
                      <span>FREKANS YÜKLEMESİNİ BAŞLAT ({treatmentDuration >= 60 ? `${treatmentDuration / 60} dk` : `${treatmentDuration} sn`})</span>
                    </button>

                    <button
                      onClick={handleStopTreatment}
                      className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Vazgeç</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleToggleTreatmentPause}
                      className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Duraklat</span>
                    </button>

                    <button
                      onClick={() => {
                        soundEngine.stop();
                        setIsTreatmentRunning(false);
                        if (onCompleteTreatment) onCompleteTreatment(activeTreatment || undefined);
                      }}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/60 flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tamamla & Raporu Göster</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 15-Second Real Live Sensor & Optical Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-5 animate-fade-in">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="#1e293b"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={390}
                  strokeDashoffset={390 - (390 * scanProgress) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black font-mono text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                  {scanSecondsLeft}s
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Kalan Süre
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-center max-w-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>15 SN CANLI SENSÖR TARAMASI</span>
              </div>
              <h4 className="text-xl font-bold text-slate-100">{detectionStatus.targetName}</h4>
              <p className="text-xs font-semibold text-emerald-400 animate-pulse transition-all">
                {scanPhaseText}
              </p>
            </div>

            <div className="w-72 sm:w-80 space-y-1.5">
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700 p-0.5 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-150 shadow-md shadow-emerald-500/50"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-slate-400 px-1">
                <span>0 sn</span>
                <span className="text-emerald-300 font-black text-xs">%{scanProgress} Tamamlandı</span>
                <span>15 sn</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-teal-300">
                Foton: %{detectionStatus.confidence}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300">
                Rezonans: {detectionStatus.auraFrequencyHz} Hz
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Control Bar */}
      <div className="w-full bg-slate-950/95 border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between gap-3 z-20">
        
        {/* Front / Back Camera Switch Button */}
        <button
          onClick={toggleFacingMode}
          className="px-3.5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all hover:border-emerald-500/50 shadow-md cursor-pointer"
          title="Ön / Arka Kamera Arasında Geçiş Yap"
        >
          <SwitchCamera className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold hidden sm:inline">
            {facingMode === 'user' ? 'Arka Kameraya Geç' : 'Ön Kameraya Geç'}
          </span>
        </button>

        {/* Primary Scan Button strictly for Human Bio-Aura */}
        <button
          onClick={handleStartScan}
          disabled={isScanning || isCameraInitializing}
          className={`flex-1 max-w-md py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all ${
            isCameraInitializing || isScanning
              ? 'bg-slate-900/90 text-slate-400 border border-slate-800 cursor-not-allowed opacity-80 shadow-lg'
              : detectionStatus.isHumanDetected
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-950/60 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ring-2 ring-emerald-400/40'
              : 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border border-amber-500/50 shadow-amber-950/40 hover:scale-[1.01] cursor-pointer'
          }`}
        >
          {isCameraInitializing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              <span>KAMERA HAZIRLANIYOR...</span>
            </>
          ) : isScanning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              <span>BİYO-AURA TARAMASI SÜRÜYOR (%{scanProgress})</span>
            </>
          ) : detectionStatus.isHumanDetected ? (
            <>
              <UserCheck className="w-5 h-5 text-slate-950" />
              <span>15 SN BİYO-AURA TARAMASINI BAŞLAT</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>KADRAJDA İNSAN BEKLENİYOR</span>
            </>
          )}
        </button>

        {/* Sun Indicator Toggle Button */}
        <button
          onClick={() => setShowSunIndicator((prev) => !prev)}
          className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
            showSunIndicator 
              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40' 
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          title={showSunIndicator ? 'Aura Güneşini Gizle' : 'Aura Güneşini Göster'}
        >
          {showSunIndicator ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>

      </div>

    </div>
  );
};
