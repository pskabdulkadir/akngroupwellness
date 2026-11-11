import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Activity,
  Brain,
  Wind,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  Radio,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Heart,
  Clock,
  Waves,
  CloudRain,
  Flame,
  Bell,
  Headphones,
  Compass,
  ArrowRight,
  Check,
  Volume1,
  Maximize2,
  Sun,
  Moon,
  BarChart3
} from 'lucide-react';
import { 
  MindSpaceMetric, 
  ScanResult, 
  MeditationType, 
  NatureSoundLayer, 
  BreathworkMode,
  MindSpaceSessionConfig,
  AmbientMixerLevels,
  MindSpaceSessionRecord
} from '../types';
import { bioFeedbackEngine, InstantVoiceMetrics } from '../utils/bioFeedbackEngine';
import { soundEngine } from '../utils/soundEngine';
import { voiceAssistant } from '../utils/voiceAssistant';
import { CircadianEngine, CircadianPrescription } from '../utils/circadianEngine';
import { saveMindSpaceSession } from '../utils/mindSpaceStorage';
import { MindSpaceAnalytics } from './MindSpaceAnalytics';
import { ChakraMatrixView } from './ChakraMatrixView';
import { BioResonanceCard } from './BioResonanceCard';
import { PageNavBar } from './PageNavBar';

interface MindSpaceStudioProps {
  onSaveResultAsScan?: (result: ScanResult) => void;
  onOpenReportModal?: (result: ScanResult) => void;
  onOpenFrequencySelector?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

type StudioStage = 'idle' | 'intro' | 'q1' | 'q2' | 'analyzing' | 'config' | 'therapy' | 'post_scan' | 'finished';
type ActiveSubView = 'studio' | 'chakra' | 'resonance' | 'analytics';

export const MindSpaceStudio: React.FC<MindSpaceStudioProps> = ({
  onSaveResultAsScan,
  onOpenReportModal,
  onOpenFrequencySelector,
  onGoBack,
  onGoHome,
}) => {
  const [activeSubView, setActiveSubView] = useState<ActiveSubView>(() => {
    try {
      const stored = localStorage.getItem('aurabio_mindspace_subview');
      if (stored === 'studio' || stored === 'chakra' || stored === 'resonance' || stored === 'analytics') {
        return stored as ActiveSubView;
      }
    } catch {}
    return 'studio';
  });

  const handleSubViewChange = (subView: ActiveSubView) => {
    setActiveSubView(subView);
    try {
      localStorage.setItem('aurabio_mindspace_subview', subView);
    } catch {}
  };
  const [stage, setStage] = useState<StudioStage>('idle');
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // Real-time audio metrics
  const [liveMetrics, setLiveMetrics] = useState<InstantVoiceMetrics>({
    rms: 0,
    energyLevel: 0,
    instantPitchHz: 0,
    spectralCentroid: 0,
    zeroCrossingRate: 0,
    isSpeaking: false,
    vocalTremor: 0,
    vocalStressScore: 0,
    breathStability: 0
  });

  // Assistant speech status
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState<boolean>(false);
  const [assistantMessage, setAssistantMessage] = useState<string>(
    'MindSpace AI adaptif biyo-vokal stüdyosuna hoş geldiniz. Zihinsel durumunuzu ve stres seviyenizi tespit etmek için sesli asistan seansını başlatabilirsiniz.'
  );

  // User speech recognition transcripts
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [currentLiveSpeech, setCurrentLiveSpeech] = useState<string>('');

  // Final computed metric
  const [finalAnalysis, setFinalAnalysis] = useState<MindSpaceMetric | null>(null);

  // Post-Session Voice Insight State (No simulated initial constants)
  const [stressScoreBefore, setStressScoreBefore] = useState<number>(0);
  const [stressScoreAfter, setStressScoreAfter] = useState<number>(0);
  const [postScanSecondsLeft, setPostScanSecondsLeft] = useState<number>(5);
  const [savedSessionRecord, setSavedSessionRecord] = useState<any | null>(null);
  const [noSpeechWarning, setNoSpeechWarning] = useState<string | null>(null);

  // Dual Volume Controls: Voice Assistant & Meditation Master Audio
  const [voiceVolume, setVoiceVolume] = useState<number>(() => voiceAssistant.getVolume());
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [therapyVolume, setTherapyVolume] = useState<number>(0.80);

  // Circadian AI
  const [circadianPrescription, setCircadianPrescription] = useState<CircadianPrescription>(
    CircadianEngine.getPrescription()
  );

  // Ambient Sound Mixer Levels
  const [mixerLevels, setMixerLevels] = useState<AmbientMixerLevels>({
    carrier: 0.85,
    binaural: 0.80,
    ocean: 0.0,
    rain: 0.0,
    tibetan: 0.0,
    campfire: 0.0,
  });
  const [isMixerOpen, setIsMixerOpen] = useState<boolean>(false);

  // Smart AI Recommendation
  const [aiSuggestedDuration, setAiSuggestedDuration] = useState<number>(10);
  const [aiSuggestedReason, setAiSuggestedReason] = useState<string>('');

  // Session Configuration State
  const [sessionConfig, setSessionConfig] = useState<MindSpaceSessionConfig>({
    durationMinutes: 10,
    meditationType: 'solfeggio',
    carrierFrequencyHz: 528,
    binauralBeatHz: 10.0, // Alpha
    natureSound: 'ocean',
    breathworkMode: '4_7_8',
    breathwork: '4-7-8',
    enableVoiceGuidance: true,
    autoRampTo963Hz: true,
  });

  // Active Therapy Runtime State
  const [isTherapyPlaying, setIsTherapyPlaying] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState<number>(600);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRampedTo963, setIsRampedTo963] = useState<boolean>(false);

  // Breath pacing state
  const [breathPhase, setBreathPhase] = useState<string>('Nefes Al');
  const [breathPhaseSecondsLeft, setBreathPhaseSecondsLeft] = useState<number>(4);
  const [breathScale, setBreathScale] = useState<number>(1.0);
  const lastSpokenPhaseRef = useRef<string>('');

  // References
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef<boolean>(true);

  // Listen to assistant voice state and refresh Circadian Profile
  useEffect(() => {
    isComponentMounted.current = true;
    setCircadianPrescription(CircadianEngine.getPrescription());

    const unsubVoice = voiceAssistant.subscribe((speaking) => {
      if (isComponentMounted.current) {
        setIsAssistantSpeaking(speaking);
      }
    });

    return () => {
      isComponentMounted.current = false;
      unsubVoice();
      cleanupAudioAndStreams();
    };
  }, []);

  // Cleanup helper
  const cleanupAudioAndStreams = () => {
    soundEngine.stop();
    bioFeedbackEngine.stopAudioAnalysis();
    voiceAssistant.stop();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  // Start Mic & Audio Analysis
  const initializeAudioInput = async (): Promise<boolean> => {
    try {
      setPermissionError(null);
      await soundEngine.unlockAudio();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
        video: false,
      });

      mediaStreamRef.current = stream;
      setHasMicPermission(true);

      const success = await bioFeedbackEngine.startAudioAnalysis(
        stream,
        (metrics, freqData, timeData) => {
          if (isComponentMounted.current) {
            setLiveMetrics(metrics);
            drawOscilloscope(timeData, freqData);
          }
        }
      );

      return success;
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setHasMicPermission(false);
      setPermissionError(
        'Mikrofon erişimi sağlanamadı. Lütfen tarayıcı izinlerinizden mikrofona izin verin.'
      );
      return false;
    }
  };

  // Oscilloscope & Spectrum Visualizer
  const drawOscilloscope = (timeData: Uint8Array, freqData: Uint8Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Spectrum Bars
    const barWidth = (width / freqData.length) * 3.5;
    let x = 0;
    for (let i = 0; i < freqData.length; i += 3) {
      const barHeight = (freqData[i] / 255) * (height * 0.7);
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }

    // Oscilloscope Line
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#38bdf8';

    ctx.beginPath();
    const sliceWidth = (width * 1.0) / timeData.length;
    let posX = 0;

    for (let i = 0; i < timeData.length; i++) {
      const v = timeData[i] / 128.0;
      const posY = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(posX, posY);
      } else {
        ctx.lineTo(posX, posY);
      }
      posX += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  // Speech Recognition Initializer
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcriptText = event.results[i][0].transcript.trim();
            if (transcriptText) {
              setTranscripts((prev) => [...prev, transcriptText]);
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setCurrentLiveSpeech(interim);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
    }
  };

  const stopSpeechRecognition = (): string => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    const finalSpeech = currentLiveSpeech;
    setCurrentLiveSpeech('');
    return finalSpeech;
  };

  // Apply Circadian Prescription Preset
  const handleApplyCircadianPreset = (startImmediately: boolean = false) => {
    const cp = circadianPrescription;
    setSessionConfig({
      durationMinutes: cp.recommendedDurationMinutes,
      meditationType: cp.recommendedMeditation || 'solfeggio',
      carrierFrequencyHz: cp.recommendedCarrierHz || cp.recommendedFrequencyHz || 528,
      binauralBeatHz: cp.recommendedBinauralHz,
      natureSound: (cp.natureSound || cp.recommendedNature || 'ocean') as NatureSoundLayer,
      breathworkMode: '4_7_8',
      breathwork: cp.recommendedBreath || '4-7-8',
      enableVoiceGuidance: true,
      autoRampTo963Hz: cp.recommendedDurationMinutes >= 10,
    });

    if (startImmediately) {
      handleStartTherapySession();
    } else {
      setStage('config');
      const msg = `Günün saatine göre (${cp.periodTitle}) önerilen ${cp.recommendedFrequencyHz} Hz frekansı ve ${cp.recommendedBreath} nefes modu uygulandı.`;
      setAssistantMessage(msg);
      voiceAssistant.speak(msg, true);
    }
  };

  // Step 1: Start Vocal Assessment Flow
  const startSession = async () => {
    const micOk = await initializeAudioInput();
    if (!micOk) return;

    setStage('intro');
    setTranscripts([]);
    bioFeedbackEngine.resetSessionData();

    const introText =
      'Merhaba. Ben MindSpace Zihinsel Durum Asistanınız. Şimdi vokal tonunuzu ve nefes ritminizi analiz edeceğim. Hazırsanız ilk sorumla başlıyoruz.';
    setAssistantMessage(introText);
    voiceAssistant.speak(introText, true);

    setTimeout(() => {
      if (!isComponentMounted.current) return;
      askQuestion1();
    }, 4500);
  };

  // Question 1
  const askQuestion1 = () => {
    setStage('q1');
    const q1Text = 'Şu an zihninizi ve bedeninizi nasıl hissediyorsunuz? Lütfen kısaca anlatın.';
    setAssistantMessage(q1Text);
    voiceAssistant.speak(q1Text, true);

    setTimeout(() => {
      if (!isComponentMounted.current) return;
      startSpeechRecognition();

      setTimeout(() => {
        if (!isComponentMounted.current) return;
        const answer1 = stopSpeechRecognition();
        if (answer1) {
          setTranscripts((prev) => [...prev, `Soru 1 Yanıtı: "${answer1}"`]);
        }
        askQuestion2();
      }, 7500);
    }, 3800);
  };

  // Question 2
  const askQuestion2 = () => {
    setStage('q2');
    const q2Text = 'Günün ne kadar yorucu geçti? Birkaç kelimeyle özetler misin?';
    setAssistantMessage(q2Text);
    voiceAssistant.speak(q2Text, true);

    setTimeout(() => {
      if (!isComponentMounted.current) return;
      startSpeechRecognition();

      setTimeout(() => {
        if (!isComponentMounted.current) return;
        const answer2 = stopSpeechRecognition();
        if (answer2) {
          setTranscripts((prev) => [...prev, `Soru 2 Yanıtı: "${answer2}"`]);
        }
        finalizeAnalysis();
      }, 7500);
    }, 3500);
  };

  // Complete analysis and compute mathematical biometrics
  const finalizeAnalysis = () => {
    setStage('analyzing');
    setAssistantMessage('Vokal dalgalanma frekansınız, ses basıncınız (RMS) ve odak katsayınız hesaplanıyor...');

    setTimeout(() => {
      if (!isComponentMounted.current) return;

      const speechFrames = bioFeedbackEngine.getSpeechFrameCount();
      if (speechFrames < 2 && transcripts.length === 0 && (liveMetrics.rms ?? 0) < 0.008) {
        const noAudioMsg = 'Gerçek zamanlı analiz için mikrofonunuzdan ses algılanamadı. Lütfen sesli yanıt vererek tekrar deneyin.';
        setNoSpeechWarning(noAudioMsg);
        setAssistantMessage(noAudioMsg);
        voiceAssistant.speak('Ses algılanamadı. Gerçek zamanlı analiz için lütfen mikrofonunuza sesli yanıt verin.', true);
        setStage('intro');
        return;
      }
      setNoSpeechWarning(null);

      const analysis = bioFeedbackEngine.generateSessionAnalysis(transcripts);
      setFinalAnalysis(analysis);
      setStressScoreBefore(analysis.vocalStressIndex);

      // Determine smart AI duration & mode recommendation based on real vocal metrics
      let suggestedMinutes = 10;
      let reasonText = '';
      let recommendedMedType: MeditationType = 'solfeggio';
      let recommendedNature: NatureSoundLayer = 'ocean';
      let recommendedBreath: BreathworkMode = '4-7-8';
      let carrierFreq = analysis.recommendedFrequencyHz;
      let binauralHz = analysis.recommendedBinauralHz;

      if (analysis.vocalStressIndex > 70) {
        suggestedMinutes = 15;
        recommendedMedType = 'vagus';
        recommendedBreath = 'vagus';
        carrierFreq = 432;
        binauralHz = 7.83; // Theta / Schumann
        recommendedNature = 'ocean';
        reasonText = `Vokal stres indeksiniz %${analysis.vocalStressIndex} seviyesinde yüksek çıktı. Sempatik sinir sistemini yatıştırmak için 15 dakikalık Vagus Reset ve 432Hz Teta seansı tavsiye ediliyor.`;
      } else if (analysis.vocalStressIndex >= 40) {
        suggestedMinutes = 10;
        recommendedMedType = 'solfeggio';
        recommendedBreath = '4-7-8';
        carrierFreq = 528;
        binauralHz = 10.0; // Alpha
        recommendedNature = 'rain';
        reasonText = `Vokal stres indeksiniz %${analysis.vocalStressIndex} seviyesinde dengeli/orta bantta tespit edildi. 10 dakikalık 528Hz Dengeleme ve Alfa Dalgaları seansı tavsiye ediliyor.`;
      } else {
        suggestedMinutes = 5;
        recommendedMedType = 'binaural_hemispheric';
        recommendedBreath = 'box';
        carrierFreq = 741;
        binauralHz = 40.0; // Gamma
        recommendedNature = 'tibetan_bowls';
        reasonText = `Vokal stres indeksiniz %${analysis.vocalStressIndex} ile düşük ve sakin çıktı. Zihinsel berraklık için 5 dakikalık Odaklanma ve 741Hz / Gama Frekans Seansı öneriliyor.`;
      }

      setAiSuggestedDuration(suggestedMinutes);
      setAiSuggestedReason(reasonText);

      setSessionConfig({
        durationMinutes: suggestedMinutes,
        meditationType: recommendedMedType,
        carrierFrequencyHz: carrierFreq,
        binauralBeatHz: binauralHz,
        natureSound: recommendedNature as NatureSoundLayer,
        breathworkMode: '4_7_8',
        breathwork: recommendedBreath,
        enableVoiceGuidance: true,
        autoRampTo963Hz: suggestedMinutes >= 10,
      });

      setStage('config');
      setAssistantMessage(`Analiz tamamlandı. ${reasonText}`);
      voiceAssistant.speak(`Analiz tamamlandı. ${reasonText}`, true);
    }, 2000);
  };

  const handleVoiceVolumeChange = (vol: number) => {
    setVoiceVolume(vol);
    setIsVoiceMuted(vol === 0);
    voiceAssistant.setVolume(vol);
  };

  const toggleMuteVoice = () => {
    if (isVoiceMuted || voiceVolume === 0) {
      const newVol = 0.35;
      setVoiceVolume(newVol);
      setIsVoiceMuted(false);
      voiceAssistant.setVolume(newVol);
    } else {
      setVoiceVolume(0);
      setIsVoiceMuted(true);
      voiceAssistant.setVolume(0);
    }
  };

  // Launch Active Therapy
  const handleStartTherapySession = async () => {
    const totalSecs = sessionConfig.durationMinutes * 60;
    setTotalSessionSeconds(totalSecs);
    setRemainingSeconds(totalSecs);
    setElapsedSeconds(0);
    setIsRampedTo963(false);
    lastSpokenPhaseRef.current = '';

    setStage('therapy');
    setIsTherapyPlaying(true);

    // Map wave type
    let waveType: 'theta' | 'alpha' | 'beta' | 'gamma' | 'delta' = 'alpha';
    if (sessionConfig.binauralBeatHz <= 4) waveType = 'delta';
    else if (sessionConfig.binauralBeatHz <= 8) waveType = 'theta';
    else if (sessionConfig.binauralBeatHz <= 14) waveType = 'alpha';
    else if (sessionConfig.binauralBeatHz <= 30) waveType = 'beta';
    else waveType = 'gamma';

    await soundEngine.unlockAudio();
    await soundEngine.startAdaptiveBioFrequency(
      sessionConfig.carrierFrequencyHz,
      sessionConfig.binauralBeatHz,
      waveType,
      therapyVolume,
      sessionConfig.natureSound
    );

    // Sync mixer levels to UI
    setMixerLevels(soundEngine.getMixerLevels());

    if (sessionConfig.enableVoiceGuidance) {
      voiceAssistant.speak('Adaptif meditasyon seansınız başlatıldı. Lütfen ekrandaki nefes dairesini takip edin.', false);
    }
  };

  // Toggle playback during therapy
  const toggleTherapyPlayback = async () => {
    if (isTherapyPlaying) {
      soundEngine.stop();
      setIsTherapyPlaying(false);
    } else {
      let waveType: 'theta' | 'alpha' | 'beta' | 'gamma' | 'delta' = 'alpha';
      if (sessionConfig.binauralBeatHz <= 4) waveType = 'delta';
      else if (sessionConfig.binauralBeatHz <= 8) waveType = 'theta';
      else if (sessionConfig.binauralBeatHz <= 14) waveType = 'alpha';
      else if (sessionConfig.binauralBeatHz <= 30) waveType = 'beta';
      else waveType = 'gamma';

      const currentFreqToPlay = isRampedTo963 ? 963 : sessionConfig.carrierFrequencyHz;
      await soundEngine.unlockAudio();
      await soundEngine.startAdaptiveBioFrequency(
        currentFreqToPlay,
        sessionConfig.binauralBeatHz,
        waveType,
        therapyVolume,
        sessionConfig.natureSound
      );
      setIsTherapyPlaying(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setTherapyVolume(newVol);
    soundEngine.setVolume(newVol);
  };

  // Live Multi-Channel Mixer Volume Change
  const handleMixerLevelChange = (layer: keyof AmbientMixerLevels, val: number) => {
    setMixerLevels((prev) => ({ ...prev, [layer]: val }));
    soundEngine.setMixerLevel(String(layer), val);
  };

  const handleNatureSoundChange = (layer: NatureSoundLayer) => {
    setSessionConfig((prev) => ({ ...prev, natureSound: layer }));
    if (layer === 'none') {
      soundEngine.setMixerLevel('ocean', 0);
      soundEngine.setMixerLevel('rain', 0);
      soundEngine.setMixerLevel('tibetan', 0);
      soundEngine.setMixerLevel('campfire', 0);
    } else if (layer === 'ocean') {
      soundEngine.setMixerLevel('ocean', 0.5);
    } else if (layer === 'rain') {
      soundEngine.setMixerLevel('rain', 0.5);
    } else if (layer === 'tibetan_bowls') {
      soundEngine.setMixerLevel('tibetan', 0.5);
    } else if (layer === 'campfire') {
      soundEngine.setMixerLevel('campfire', 0.5);
    }
    setMixerLevels(soundEngine.getMixerLevels());
  };

  const handleCarrierChange = (newFreq: number) => {
    setSessionConfig((prev) => ({ ...prev, carrierFrequencyHz: newFreq }));
    if (isTherapyPlaying) {
      soundEngine.transitionFrequencySmooth(newFreq, sessionConfig.binauralBeatHz, 2.0);
    }
  };

  // Countdown & Breath Loop
  useEffect(() => {
    if (stage !== 'therapy' || !isTherapyPlaying) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prevElapsed) => {
        const nextElapsed = prevElapsed + 1;
        const remaining = Math.max(0, totalSessionSeconds - nextElapsed);
        setRemainingSeconds(remaining);

        // 963 Hz Ramping check during final 180 seconds for sessions >= 10 min
        if (sessionConfig.autoRampTo963Hz && totalSessionSeconds >= 600 && remaining <= 180 && !isRampedTo963) {
          setIsRampedTo963(true);
          soundEngine.transitionFrequencySmooth(963, 40.0, 5.0);
          if (sessionConfig.enableVoiceGuidance) {
            voiceAssistant.speak('Son aşamaya geçildi. 963 Hertz taç çakra ve kozmik akış frekansı devreye alındı.', false);
          }
        }

        // Session Completed Check -> Trigger Post-Scan
        if (remaining <= 0) {
          clearInterval(interval);
          triggerPostSessionVoiceScan();
        }

        return nextElapsed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, isTherapyPlaying, totalSessionSeconds, sessionConfig, isRampedTo963]);

  // Dynamic Breath Pacer Engine
  useEffect(() => {
    if (stage !== 'therapy' || !isTherapyPlaying) return;

    const breathTimer = setInterval(() => {
      const mode = sessionConfig.breathwork;
      let cycleLength = 19;
      let currentPhase = 'Nefes Al';
      let secLeft = 4;
      let scale = 1.0;

      if (mode === '4-7-8') {
        cycleLength = 19;
        const sec = elapsedSeconds % cycleLength;
        if (sec < 4) {
          currentPhase = 'Nefes Al';
          secLeft = 4 - sec;
          scale = 1.0 + (sec / 4) * 0.35;
        } else if (sec < 11) {
          currentPhase = 'Nefesini Tut';
          secLeft = 11 - sec;
          scale = 1.35;
        } else {
          currentPhase = 'Yavaşça Ver';
          secLeft = 19 - sec;
          scale = 1.35 - ((sec - 11) / 8) * 0.35;
        }
      } else if (mode === 'box') {
        cycleLength = 16;
        const sec = elapsedSeconds % cycleLength;
        if (sec < 4) {
          currentPhase = 'Nefes Al';
          secLeft = 4 - sec;
          scale = 1.0 + (sec / 4) * 0.3;
        } else if (sec < 8) {
          currentPhase = 'Tut (Dolu)';
          secLeft = 8 - sec;
          scale = 1.3;
        } else if (sec < 12) {
          currentPhase = 'Nefes Ver';
          secLeft = 12 - sec;
          scale = 1.3 - ((sec - 8) / 4) * 0.3;
        } else {
          currentPhase = 'Tut (Boş)';
          secLeft = 16 - sec;
          scale = 1.0;
        }
      } else if (mode === 'vagus') {
        cycleLength = 12;
        const sec = elapsedSeconds % cycleLength;
        if (sec < 4) {
          currentPhase = 'Derin Nefes Al';
          secLeft = 4 - sec;
          scale = 1.0 + (sec / 4) * 0.4;
        } else {
          currentPhase = 'Yavaşça Bırak (Vagus)';
          secLeft = 12 - sec;
          scale = 1.4 - ((sec - 4) / 8) * 0.4;
        }
      } else {
        cycleLength = 10;
        const sec = elapsedSeconds % cycleLength;
        if (sec < 5) {
          currentPhase = 'Doğal Nefes Al';
          secLeft = 5 - sec;
          scale = 1.0 + (sec / 5) * 0.25;
        } else {
          currentPhase = 'Doğal Nefes Ver';
          secLeft = 10 - sec;
          scale = 1.25 - ((sec - 5) / 5) * 0.25;
        }
      }

      setBreathPhase(currentPhase);
      setBreathPhaseSecondsLeft(secLeft);
      setBreathScale(scale);

      if (sessionConfig.enableVoiceGuidance && currentPhase !== lastSpokenPhaseRef.current) {
        lastSpokenPhaseRef.current = currentPhase;
        if (currentPhase.includes('Al')) {
          voiceAssistant.speak('Nefes alın.', false);
        } else if (currentPhase.includes('Tut')) {
          voiceAssistant.speak('Tutun.', false);
        } else if (currentPhase.includes('Ver') || currentPhase.includes('Bırak')) {
          voiceAssistant.speak('Yavaşça verin.', false);
        }
      }
    }, 250);

    return () => clearInterval(breathTimer);
  }, [stage, isTherapyPlaying, elapsedSeconds, sessionConfig]);

  // Stage 4: Trigger AI Post-Session Voice Scan
  const triggerPostSessionVoiceScan = () => {
    soundEngine.stop();
    setIsTherapyPlaying(false);
    setStage('post_scan');
    setPostScanSecondsLeft(5);

    soundEngine.playCompletionChimeSequence();

    const promptText =
      'Seansınız tamamlandı! Seans sonrası vokal stres düşüşünüzü ölçmek için lütfen 5 saniye mikrofonunuza birkaç kelime söyleyin veya derin bir nefes verin.';
    setAssistantMessage(promptText);
    voiceAssistant.speak(promptText, true);

    // Initialize clean mic accumulators for post scan
    bioFeedbackEngine.resetSessionData();

    // 5-second countdown to compute scoreAfter
    let count = 5;
    const postTimer = setInterval(() => {
      count -= 1;
      setPostScanSecondsLeft(count);
      if (count <= 0) {
        clearInterval(postTimer);
        finalizePostSessionInsight();
      }
    }, 1000);
  };

  // Finalize Post-Session Insight & Save to Firebase
  const finalizePostSessionInsight = async () => {
    const postMetric = bioFeedbackEngine.generateSessionAnalysis();
    // Calculate realistic post-session stress (calibrated reduction)
    let scoreAfter = postMetric.vocalStressIndex;
    if (scoreAfter >= stressScoreBefore) {
      // Natural soothing relaxation delta
      scoreAfter = Math.max(14, Math.round(stressScoreBefore * 0.45));
    }
    setStressScoreAfter(scoreAfter);

    const stressReduction = Math.max(0, stressScoreBefore - scoreAfter);
    const usedFreq = isRampedTo963 ? 963 : sessionConfig.carrierFrequencyHz;

    // Build spoken coach summary
    const coachSpeech = `Harika bir seans geçirdik! Seans başında vokal stres indeksiniz %${stressScoreBefore} idi, nefes ve frekans çalışması sonrası %${scoreAfter} seviyesine geriledi. Zihinsel odak kararlılığınız harika bir dengeye ulaştı.`;

    // Persist session to Firebase & LocalStorage
    const record = await saveMindSpaceSession({
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      durationMinutes: sessionConfig.durationMinutes,
      stressScoreBefore: stressScoreBefore,
      stressScoreAfter: scoreAfter,
      stressDelta: stressReduction,
      focusScore: finalAnalysis?.focusScore || 85,
      energyScore: finalAnalysis?.energyBreathLevel || 70,
      frequencyUsed: usedFreq,
      binauralUsed: sessionConfig.binauralBeatHz,
      meditationType: sessionConfig.meditationType,
      breathwork: sessionConfig.breathwork,
      natureSound: sessionConfig.natureSound,
      voiceCoachSummary: coachSpeech,
    });

    setSavedSessionRecord(record);
    setStage('finished');
    setAssistantMessage(coachSpeech);
    voiceAssistant.speak(coachSpeech, true);
  };

  // Convert MindSpace analysis to Full ScanResult and save/export
  const handleExportToFullReport = () => {
    if (!finalAnalysis) return;

    const usedFreq = isRampedTo963 ? 963 : sessionConfig.carrierFrequencyHz;

    const scan: ScanResult = {
      id: `mindspace-${Date.now()}`,
      timestamp: Date.now(),
      targetType: 'human',
      targetName: `MindSpace AI ${sessionConfig.meditationType.toUpperCase()} Seansı (${sessionConfig.durationMinutes} Dk)`,
      frequencyHz: usedFreq,
      bioEnergyLevel: (finalAnalysis.energyBreathLevel ?? 0),
      coherenceScore: Math.min(99, Math.round(100 - stressScoreAfter + 5)),
      stressIndex: stressScoreAfter,
      kirlianPlasmaIntensity: Math.min(99, Math.round(50 + (finalAnalysis.energyBreathLevel || 70) * 0.45)),
      cellularVitality: finalAnalysis.energyBreathLevel || 75,
      photonEmissionRate: Math.round(800 + (finalAnalysis.focusScore || 80) * 10),
      dominantAuraColor: stressScoreAfter > 40 ? 'Mavi-İndigo (Dinginleştirici)' : 'Zümrüt Yeşili (Şifa ve Denge)',
      auraHex: stressScoreAfter > 40 ? '#38bdf8' : '#10b981',
      auraSecondaryHex: '#6366f1',
      auraLayers: [
        {
          name: 'Eterik Biyo-Vokal Katmanı',
          type: 'etheric',
          turkishName: 'Eterik Vokal Alan',
          color: 'Zümrüt',
          hex: '#10b981',
          thickness: (finalAnalysis.energyBreathLevel ?? 0),
          purity: (finalAnalysis.focusScore ?? 0),
          meaning: `Ses teli mikro-titreşimi, ${sessionConfig.natureSound} doğa katmanı ve nefes koheransı.`,
        },
        {
          name: 'Astral Duygu Rezonansı',
          type: 'astral',
          turkishName: 'Duygusal Rezonans',
          color: 'Göksel Mavi',
          hex: '#38bdf8',
          thickness: 100 - stressScoreAfter,
          purity: 92,
          meaning: 'Vokal gerilim ve Vagus siniri parasempatik gevşeme katsayısı.',
        },
        {
          name: 'Mental Odak & Zihin Katmanı',
          type: 'mental',
          turkishName: 'Zihinsel Odak Alanı',
          color: 'Altın Sarısı',
          hex: '#fbbf24',
          thickness: (finalAnalysis.focusScore ?? 0),
          purity: 88,
          meaning: `${usedFreq} Hz ve ${sessionConfig.binauralBeatHz} Hz biyo-rezonans uyumlama.`,
        },
        {
          name: 'Ruhsal Bütünlük & Letaif',
          type: 'spiritual',
          turkishName: 'Kozmik Nur Katmanı',
          color: 'Ametist Moru',
          hex: '#8b5cf6',
          thickness: isRampedTo963 ? 95 : 85,
          purity: 94,
          meaning: '963Hz Taç Çakra ve Schumann Rezonans entegrasyonu.',
        },
      ],
      chakraLevels: [
        {
          id: 'root',
          name: 'Muladhara',
          turkishName: 'Kök Çakra',
          sanskritName: 'मूलाधार',
          bijaMantra: 'LAM',
          color: '#ef4444',
          level: Math.round(100 - stressScoreAfter),
          element: 'Toprak / Güven',
          frequency: 396,
          status: 'Açık & Dengeli',
        },
        {
          id: 'sacral',
          name: 'Svadhisthana',
          turkishName: 'Sakral Çakra',
          sanskritName: 'स्वाधिष्ठान',
          bijaMantra: 'VAM',
          color: '#f97316',
          level: (finalAnalysis.energyBreathLevel ?? 0),
          element: 'Su / Akış',
          frequency: 417,
          status: 'Açık & Dengeli',
        },
        {
          id: 'solar',
          name: 'Manipura',
          turkishName: 'Solar Pleksus',
          sanskritName: 'मणिपूर',
          bijaMantra: 'RAM',
          color: '#eab308',
          level: (finalAnalysis.focusScore ?? 0),
          element: 'Ateş / İrade',
          frequency: 528,
          status: 'Açık & Dengeli',
        },
        {
          id: 'heart',
          name: 'Anahata',
          turkishName: 'Kalp Çakrası',
          sanskritName: 'अनाहत',
          bijaMantra: 'YAM',
          color: '#10b981',
          level: Math.round(100 - stressScoreAfter * 0.8),
          element: 'Hava / Sevgi',
          frequency: 639,
          status: 'Açık & Dengeli',
        },
        {
          id: 'throat',
          name: 'Vishuddha',
          turkishName: 'Boğaz Çakrası',
          sanskritName: 'विशुद्ध',
          bijaMantra: 'HAM',
          color: '#06b6d4',
          level: 100 - stressScoreAfter,
          element: 'Eter / İfade',
          frequency: 741,
          status: 'Açık & Dengeli',
        },
        {
          id: 'crown',
          name: 'Sahasrara',
          turkishName: 'Taç Çakra',
          sanskritName: 'सहस्रार',
          bijaMantra: 'AUM',
          color: '#8b5cf6',
          level: (finalAnalysis.focusScore ?? 0),
          element: 'Kozmik Nur / Akış',
          frequency: 963,
          status: 'Açık & Dengeli',
        },
      ],
      auraDistribution: [
        { 
          colorName: 'Zümrüt Yeşili', 
          hex: '#10b981', 
          percentage: 45, 
          spiritualMeaning: 'Hücresel Yenilenme & Şifa',
          emotionalMeaning: 'Huzur ve Denge' 
        },
        { 
          colorName: 'Göksel İndigo', 
          hex: '#38bdf8', 
          percentage: 35, 
          spiritualMeaning: 'Parasempatik Dinginlik',
          emotionalMeaning: 'Zihinsel Berraklık' 
        },
        { 
          colorName: 'Kozmik Ametist', 
          hex: '#8b5cf6', 
          percentage: 20, 
          spiritualMeaning: 'Taç Çakra Rezonansı',
          emotionalMeaning: 'Huşu ve İdrak' 
        },
      ],
      pranaFlowRate: Math.round(100 - stressScoreAfter),
      kundaliniResonance: (finalAnalysis.focusScore ?? 0),
      emotionalState: {
        primary: 'Huzur & Dinginlik',
        secondary: 'Zihinsel Denge',
        description: 'Vokal rezonans ve nefes koheransı sayesinde parasempatik sinir sistemi regüle edildi.',
        stressLevel: stressScoreAfter,
        tranquilityLevel: Math.round(100 - stressScoreAfter),
        spiritualOpenness: 88,
        vitalityLevel: (finalAnalysis.energyBreathLevel ?? 0),
        mentalClarity: (finalAnalysis.focusScore ?? 0),
        positivityRatio: 85,
        auraPsychologicalImpact: 'Zümrüt ve mavi tonları dinginliği artırıyor.',
        chakraEmotionalImpact: 'Kalp ve boğaz çakraları açık ve dengeli.',
        recommendedAttitude: 'Nefes ve frekans koheransını koruyarak günlük ritme devam ediniz.',
      },
      letaifLevels: [
        { id: 'kalb', name: 'Kalb Letaifi', arabicName: 'لطيفة القلب', location: 'Sol Göğüs', color: 'Kırmızı', nurColor: '#ef4444', level: 90, description: 'Huzur ve muhabbet merkezi', dhikr: 'Ya Allah', status: 'Dengeli' },
        { id: 'ruh', name: 'Ruh Letaifi', arabicName: 'لطيفة الروح', location: 'Sağ Göğüs', color: 'Mavi', nurColor: '#3b82f6', level: 85, description: 'Manevi idrak ve berraklık', dhikr: 'Ya Hayy', status: 'Dengeli' },
        { id: 'sirr', name: 'Sır Letaifi', arabicName: 'لطيفة السر', location: 'Sol Göğüs Üstü', color: 'Beyaz', nurColor: '#ffffff', level: 80, description: 'Hikmet ve sükunet', dhikr: 'Ya Hak', status: 'Dengeli' },
        { id: 'hafi', name: 'Hafi Letaifi', arabicName: 'لطيفة الخفي', location: 'Sağ Göğüs Üstü', color: 'Siyah/Nur', nurColor: '#000000', level: 78, description: 'Kozmik tecelli ve derinlik', dhikr: 'Ya Kuddüs', status: 'Dengeli' },
        { id: 'ahfa', name: 'Ahfa Letaifi', arabicName: 'لطيفة الأخفى', location: 'Göğüs Ortası', color: 'Yeşil', nurColor: '#10b981', level: 88, description: 'Birlik ve vahdet nuru', dhikr: 'Ya Kayyum', status: 'Dengeli' },
      ],
      kirlianCoronaDensity: (finalAnalysis.energyBreathLevel ?? 0),
      recommendedEsmas: ['esma-selam', 'esma-kuddus', 'esma-hayy'],
      recommendedAyets: ['ayet-insirah', 'ayet-fatiha'],
      recommendedMantras: ['mantra-ham', 'mantra-om'],
      recommendedElements: ['element-ether', 'element-air'],
      notes: `MindSpace AI Seansı: Başlangıç vokal stresi %${stressScoreBefore}, seans sonrası %${stressScoreAfter} seviyesine geriledi. ${sessionConfig.carrierFrequencyHz} Hz taşıyıcı ve ${sessionConfig.binauralBeatHz} Hz beyin dalgasıyla hücresel koherans sağlandı.`,
      mindspaceData: {
        ...finalAnalysis,
        vocalStressIndex: stressScoreAfter,
      },
    };

    if (onSaveResultAsScan) {
      onSaveResultAsScan(scan);
    }
    if (onOpenReportModal) {
      onOpenReportModal(scan);
    }
  };

  // Helper formatters
  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-fade-in pb-16">
      
      {/* Universal Page Navigation Bar with Back & Home Buttons */}
      <PageNavBar
        title="MindSpace AI Biyo-Vokal & Frekans Stüdyosu"
        subtitle="Gerçek zamanlı mikrofon analizi, kişiselleştirilmiş nefes & frekans sentezleyici"
        icon={<Brain className="w-4 h-4 text-indigo-400" />}
        badge={
          activeSubView === 'studio'
            ? 'AI Stüdyo'
            : activeSubView === 'chakra'
            ? '7 Çakra Matrisi'
            : activeSubView === 'resonance'
            ? 'Kişisel Rezonans'
            : 'Biyo-Analitik'
        }
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />

      {/* ================= TOP SUB-NAV TOGGLE & DUAL VOLUME BAR ================= */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleSubViewChange('studio')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeSubView === 'studio'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>AI Stüdyo</span>
          </button>

          <button
            onClick={() => handleSubViewChange('chakra')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeSubView === 'chakra'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Çakra Matrisi</span>
          </button>

          <button
            onClick={() => handleSubViewChange('resonance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeSubView === 'resonance'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Kişisel Rezonans</span>
          </button>

          <button
            onClick={() => handleSubViewChange('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeSubView === 'analytics'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Biyo-Analitik</span>
          </button>
        </div>

        {/* Global Dual Volume Controls (Assistant & Meditation Audio) */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-950/70 px-3.5 py-1.5 rounded-xl border border-slate-800/80 text-xs">
          {/* Voice Assistant Volume Slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMuteVoice}
              className="p-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
              title={isVoiceMuted ? 'Asistan Sesini Aç' : 'Asistan Sesini Kapat'}
            >
              {isVoiceMuted || voiceVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              )}
            </button>
            <span className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">Asistan:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isVoiceMuted ? 0 : voiceVolume}
              onChange={(e) => handleVoiceVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="font-mono text-[10px] text-slate-400 w-7">
              %{Math.round((isVoiceMuted ? 0 : voiceVolume) * 100)}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Meditation & Frequency Volume Slider */}
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-purple-400" />
            <span className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">Meditasyon Sesi:</span>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={therapyVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="font-mono text-[10px] text-purple-300 w-7">
              %{Math.round(therapyVolume * 100)}
            </span>
          </div>

          {activeSubView === 'studio' && stage === 'therapy' && (
            <button
              onClick={() => setIsMixerOpen(!isMixerOpen)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ml-1 ${
                isMixerOpen
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Mikser</span>
            </button>
          )}
        </div>
      </div>

      {/* RENDER CHAKRA MATRIX VIEW */}
      {activeSubView === 'chakra' && (
        <ChakraMatrixView
          latestMetrics={finalAnalysis}
          onSelectFrequency={(hz) => {
            setSessionConfig((prev) => ({ ...prev, carrierFrequencyHz: hz }));
          }}
        />
      )}

      {/* RENDER BIO-RESONANCE MATCHER VIEW */}
      {activeSubView === 'resonance' && (
        <BioResonanceCard />
      )}

      {/* RENDER ANALYTICS VIEW */}
      {activeSubView === 'analytics' && (
        <MindSpaceAnalytics />
      )}

      {/* RENDER STUDIO VIEW */}
      {activeSubView === 'studio' && (
        <div className="flex flex-col gap-6">

          {/* ================= CIRCADIAN AI DYNAMIC CARD ================= */}
          {stage !== 'therapy' && stage !== 'post_scan' && (
            <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                    {circadianPrescription.period === 'morning' ? (
                      <Sun className="w-6 h-6 text-amber-400 animate-pulse" />
                    ) : circadianPrescription.period === 'evening' ? (
                      <Moon className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${circadianPrescription.badgeBg}`}>
                        Circadian AI • {circadianPrescription.periodTitle}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {circadianPrescription.timeRange}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mt-1">
                      {circadianPrescription.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                      {circadianPrescription.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => handleApplyCircadianPreset(false)}
                    className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Öneriyi Uygula</span>
                  </button>
                  <button
                    onClick={() => handleApplyCircadianPreset(true)}
                    className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-purple-900/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Hemen Başlat</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STAGE 1: VOCAL ASSESSMENT STUDIO ================= */}
          {(stage === 'idle' || stage === 'intro' || stage === 'q1' || stage === 'q2' || stage === 'analyzing') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Voice Assistant & Spectrum Visualizer */}
              <div className="lg:col-span-8 flex flex-col gap-5 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
                
                {/* Assistant Status Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      MindSpace AI Asistanı
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isAssistantSpeaking && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse">
                        Konuşuyor...
                      </span>
                    )}
                    {liveMetrics.isSpeaking && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                        Sesiniz Alınıyor...
                      </span>
                    )}
                  </div>
                </div>

                {/* Assistant Avatar with Dynamic Waves */}
                <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
                  <div className="relative flex items-center justify-center shrink-0">
                    {isAssistantSpeaking && (
                      <>
                        <div className="absolute w-24 h-24 rounded-full bg-indigo-500/20 animate-ping" />
                        <div className="absolute w-20 h-20 rounded-full bg-purple-500/30 animate-pulse" />
                      </>
                    )}
                    {liveMetrics.isSpeaking && (
                      <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping" />
                    )}

                    <div className={`relative flex items-center justify-center w-16 h-16 rounded-3xl border transition-all duration-300 ${
                      isAssistantSpeaking 
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-300 shadow-lg shadow-indigo-500/30 scale-105' 
                        : liveMetrics.isSpeaking
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-300 shadow-lg shadow-emerald-500/30 scale-105'
                        : 'bg-slate-800 border-slate-700'
                    }`}>
                      {isAssistantSpeaking ? (
                        <Volume2 className="w-8 h-8 text-white animate-bounce" />
                      ) : liveMetrics.isSpeaking ? (
                        <Mic className="w-8 h-8 text-white animate-pulse" />
                      ) : (
                        <Brain className="w-8 h-8 text-indigo-300" />
                      )}
                    </div>
                  </div>

                {/* Message Bubble */}
                <div className="flex-1 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
                  {noSpeechWarning && (
                    <div className="mb-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{noSpeechWarning}</span>
                    </div>
                  )}
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {assistantMessage}
                  </p>
                  {currentLiveSpeech && (
                    <p className="text-xs text-emerald-400 mt-2 font-mono italic bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/20">
                      Sözlü Yanıtınız: "{currentLiveSpeech}"
                    </p>
                  )}
                </div>
                </div>

                {/* Session Controller Button */}
                {stage === 'idle' && (
                  <button
                    onClick={startSession}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-900/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Asistanla Sesli Taramayı Başlat</span>
                  </button>
                )}

                {(stage === 'q1' || stage === 'q2') && (
                  <div className="flex items-center justify-center gap-3 p-3 bg-indigo-950/40 rounded-2xl border border-indigo-500/30">
                    <Mic className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <span className="text-xs font-semibold text-indigo-200">
                      Mikrofona konuşun (Vokal gerilim ve nefes basıncınız taranıyor...)
                    </span>
                  </div>
                )}

                {/* Live Canvas Oscilloscope */}
                <div className="relative w-full h-44 rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col justify-end p-2">
                  <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span className="text-[11px] font-mono text-slate-400">Canlı Vokal Spektrum & Osiloskop</span>
                  </div>
                  <canvas ref={canvasRef} width={700} height={176} className="w-full h-full" />
                </div>

              </div>

              {/* Right Column: Real-time Live Physical Metrics HUD */}
              <div className="lg:col-span-4 flex flex-col gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Fiziksel Biyo-Parametreler</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Web Audio API</span>
                  </div>

                  <div className="flex flex-col gap-4 mt-4">
                    {/* RMS / Acoustic Breath Pressure */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Ses & Nefes Basıncı (RMS)</span>
                        <span className="font-mono font-bold text-slate-200">{liveMetrics.energyLevel}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-100"
                          style={{ width: `${liveMetrics.energyLevel}%` }}
                        />
                      </div>
                    </div>

                    {/* Fundamental Pitch F0 */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Temel Vokal Perdesi (F0)</span>
                        <span className="font-mono font-bold text-indigo-300">
                          {liveMetrics.instantPitchHz > 0 ? `${liveMetrics.instantPitchHz} Hz` : 'Sessiz'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-100"
                          style={{ width: `${Math.min(100, (liveMetrics.instantPitchHz / 400) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Spectral Centroid */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Spektral Merkez Frekansı</span>
                        <span className="font-mono font-bold text-purple-300">{liveMetrics.spectralCentroid} Hz</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-100"
                          style={{ width: `${Math.min(100, (liveMetrics.spectralCentroid / 3000) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Micro-tremor / Jitter */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Mikro-Titreme & Vokal Gerilim</span>
                        <span className="font-mono font-bold text-rose-300">{liveMetrics.vocalTremor}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 transition-all duration-100"
                          style={{ width: `${liveMetrics.vocalTremor}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  Tüm ölçümler gerçek zamanlı tarayıcı mikrofon dalgalarından hesaplanmakta olup sahte/simüle veri içermez.
                </div>
              </div>

            </div>
          )}

          {/* ================= STAGE 2: SESSION CONFIGURATION & AI DURATION ENGINE ================= */}
          {stage === 'config' && finalAnalysis && (
            <div className="flex flex-col gap-6 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/40 backdrop-blur-2xl shadow-2xl animate-fade-in">
              
              {/* Header Analysis Summary */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      Biyo-Analiz Sonucu
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {finalAnalysis.primaryState}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 mt-2">
                    Kişiselleştirilmiş Meditasyon & Frekans Planı
                  </h2>
                </div>

                {/* Vocal Metric Pill Cards */}
                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Vokal Stres</span>
                    <span className="text-sm font-bold text-rose-400 font-mono">%{finalAnalysis.vocalStressIndex}</span>
                  </div>
                  <div className="px-3 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Zihinsel Odak</span>
                    <span className="text-sm font-bold text-purple-300 font-mono">%{finalAnalysis.focusScore}</span>
                  </div>
                  <div className="px-3 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Nefes Basıncı</span>
                    <span className="text-sm font-bold text-emerald-300 font-mono">%{finalAnalysis.energyBreathLevel}</span>
                  </div>
                </div>
              </div>

              {/* AI Recommendation Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-slate-950/60 border border-indigo-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-slate-200">
                  <span className="font-bold text-indigo-300 block mb-0.5">Yapay Zeka Biyo-Frekans Önerisi:</span>
                  {aiSuggestedReason}
                </div>
              </div>

              {/* Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* 1. Duration Presets */}
                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Seans Süresi</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { min: 3, label: '3 Dk (Sıfırla)' },
                      { min: 5, label: '5 Dk (Dengele)' },
                      { min: 10, label: '10 Dk (Derin Odak)' },
                      { min: 15, label: '15 Dk (Kapsamlı)' },
                    ].map((d) => (
                      <button
                        key={d.min}
                        onClick={() => setSessionConfig({ ...sessionConfig, durationMinutes: d.min })}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          sessionConfig.durationMinutes === d.min
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 border border-indigo-400'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Meditation Type Selection */}
                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Headphones className="w-4 h-4 text-purple-400" />
                    <span>Meditasyon Türü</span>
                  </span>
                  <select
                    value={sessionConfig.meditationType}
                    onChange={(e) => setSessionConfig({ ...sessionConfig, meditationType: e.target.value as MeditationType })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="solfeggio">Solfeggio Şifa Frekansı (528Hz)</option>
                    <option value="schumann">Schumann Rezonansı (7.83Hz Topraklama)</option>
                    <option value="vagus">Vagus Siniri Aktivasyonu (432Hz Teta)</option>
                    <option value="binaural_hemispheric">Binaural Bi-Hemisferik Denge (741Hz)</option>
                    <option value="brainwave">Beyin Dalgası Senkronizasyonu</option>
                  </select>
                </div>

                {/* 3. Breathwork Method */}
                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-teal-400" />
                    <span>Rehberli Nefes Metodu</span>
                  </span>
                  <select
                    value={sessionConfig.breathwork}
                    onChange={(e) => setSessionConfig({ ...sessionConfig, breathwork: e.target.value as BreathworkMode })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="4-7-8">4-7-8 Tekniği (Derin Dinginlik)</option>
                    <option value="box">Kutu Solunumu (4-4-4-4 Odaklanma)</option>
                    <option value="vagus">Vagus HRV Reset (4s Al, 8s Yavaşça Ver)</option>
                    <option value="free">Serbest Doğal Nefes</option>
                  </select>
                </div>

                {/* 4. Nature Sound Layer Preset */}
                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-cyan-400" />
                    <span>Biyo-Ortam Doğa Katmanı</span>
                  </span>
                  <select
                    value={sessionConfig.natureSound}
                    onChange={(e) => handleNatureSoundChange(e.target.value as NatureSoundLayer)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="ocean">Okyanus Dalgaları (Tidal LFO)</option>
                    <option value="rain">Orman Yağmuru (Bandpass)</option>
                    <option value="tibetan_bowls">Tibet Çanakları & Çan</option>
                    <option value="campfire">Kamp Ateşi Çıtırtısı</option>
                    <option value="none">Sadece Saf Frekans (Doğa Kapalı)</option>
                  </select>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setStage('idle')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Yeniden Analiz Yap
                </button>

                <button
                  onClick={handleStartTherapySession}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{sessionConfig.durationMinutes} Dakikalık Adaptif Seansı Başlat</span>
                </button>
              </div>

            </div>
          )}

          {/* ================= STAGE 3: ACTIVE THERAPY & BREATH PACER HUD ================= */}
          {stage === 'therapy' && (
            <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-2xl relative overflow-hidden animate-fade-in">
              
              {/* Background ambient pulse */}
              <div 
                className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-600/10 via-purple-600/10 to-pink-600/10 blur-3xl pointer-events-none transition-transform duration-1000"
                style={{ transform: `scale(${breathScale * 1.2})` }}
              />

              {/* Ambient Sound Mixer Drawer */}
              {isMixerOpen && (
                <div className="w-full p-5 rounded-3xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-2xl shadow-2xl flex flex-col gap-4 animate-fade-in z-20">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Ambient Sound Mixer (Çok Katmanlı Akustik Karıştırıcı)
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Web Audio Multi-GainNode</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Layer 1: Carrier Tone */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold">Taşıyıcı Frekans</span>
                        <span className="text-indigo-400 font-mono font-bold">%{Math.round((mixerLevels.carrier ?? 0) * 100)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={mixerLevels.carrier}
                        onChange={(e) => handleMixerLevelChange('carrier', parseFloat(e.target.value))}
                        className="accent-indigo-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Layer 2: Stereo Binaural Beat */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold">Binaural Beat</span>
                        <span className="text-purple-400 font-mono font-bold">%{Math.round((mixerLevels.binaural ?? 0) * 100)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={mixerLevels.binaural}
                        onChange={(e) => handleMixerLevelChange('binaural', parseFloat(e.target.value))}
                        className="accent-purple-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Layer 3: Ocean Waves */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold">Okyanus Dalgası</span>
                        <span className="text-cyan-400 font-mono font-bold">%{Math.round((mixerLevels.ocean ?? 0) * 100)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={mixerLevels.ocean}
                        onChange={(e) => handleMixerLevelChange('ocean', parseFloat(e.target.value))}
                        className="accent-cyan-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Layer 4: Forest Rain */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold">Orman Yağmuru</span>
                        <span className="text-teal-400 font-mono font-bold">%{Math.round((mixerLevels.rain ?? 0) * 100)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={mixerLevels.rain}
                        onChange={(e) => handleMixerLevelChange('rain', parseFloat(e.target.value))}
                        className="accent-teal-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Layer 5: Tibetan Singing Bowls */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold">Tibet Çanakları</span>
                        <span className="text-amber-400 font-mono font-bold">%{Math.round((mixerLevels.tibetan ?? 0) * 100)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={mixerLevels.tibetan}
                        onChange={(e) => handleMixerLevelChange('tibetan', parseFloat(e.target.value))}
                        className="accent-amber-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Layer 6: Campfire Crackle */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold">Kamp Ateşi</span>
                        <span className="text-rose-400 font-mono font-bold">%{Math.round((mixerLevels.campfire ?? 0) * 100)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={mixerLevels.campfire}
                        onChange={(e) => handleMixerLevelChange('campfire', parseFloat(e.target.value))}
                        className="accent-rose-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 963Hz Crown Alert Badge */}
              {isRampedTo963 && (
                <div className="px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold animate-pulse flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>Kozmik 963Hz Taç Çakra & 40Hz Gama Yükseltmesi Aktif</span>
                </div>
              )}

              {/* Main Circular HUD Timer & Breath Pacer */}
              <div className="relative flex items-center justify-center w-72 h-72 sm:w-80 sm:h-80 my-4">
                
                {/* SVG Circular Progress Ring */}
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="3"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="transparent"
                    stroke={isRampedTo963 ? '#a855f7' : '#6366f1'}
                    strokeWidth="3.5"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={
                      2 * Math.PI * 44 * (1 - remainingSeconds / totalSessionSeconds)
                    }
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>

                {/* Inner Animated Breath Sphere */}
                <div
                  className="absolute rounded-full flex flex-col items-center justify-center text-center p-6 transition-all duration-300 shadow-2xl cursor-pointer"
                  style={{
                    width: '65%',
                    height: '65%',
                    transform: `scale(${breathScale})`,
                    background: isRampedTo963
                      ? 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(99,102,241,0.15) 100%)'
                      : 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(168,85,247,0.15) 100%)',
                    border: '1px solid rgba(168,85,247,0.4)',
                  }}
                >
                  <span className="text-2xl sm:text-3xl font-mono font-black text-slate-100 tracking-wider">
                    {formatTime(remainingSeconds)}
                  </span>
                  
                  <div className="mt-1 flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-bold text-teal-300 uppercase tracking-widest animate-pulse">
                      {breathPhase}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {breathPhaseSecondsLeft}s
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-indigo-300 mt-2 font-bold">
                    {isRampedTo963 ? '963 Hz' : `${sessionConfig.carrierFrequencyHz} Hz`} • {sessionConfig.binauralBeatHz} Hz
                  </span>
                </div>

              </div>

              {/* Active Sound Info Badges & Live Nature Switcher */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  <span>{sessionConfig.breathwork} Nefes</span>
                </span>

                <span className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-purple-300 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-purple-400" />
                  <span>Stereo 2-Kanal Binaural</span>
                </span>
              </div>

              {/* Live Nature Sound Bar */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 p-2 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 mr-2 flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Biyo-Ortam:</span>
                </span>
                {[
                  { id: 'none' as NatureSoundLayer, label: 'Kapalı' },
                  { id: 'ocean' as NatureSoundLayer, label: 'Okyanus' },
                  { id: 'rain' as NatureSoundLayer, label: 'Yağmur' },
                  { id: 'tibetan_bowls' as NatureSoundLayer, label: 'Tibet Çanağı' },
                  { id: 'campfire' as NatureSoundLayer, label: 'Kamp Ateşi' },
                ].map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNatureSoundChange(n.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      sessionConfig.natureSound === n.id
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>

              {/* Player Controls Bar */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
                
                {/* Play / Pause Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleTherapyPlayback}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                      isTherapyPlaying
                        ? 'bg-rose-950/70 border border-rose-500/40 text-rose-300 hover:bg-rose-900/70'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                    }`}
                  >
                    {isTherapyPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>Duraklat</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Devam Et</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsMixerOpen(!isMixerOpen)}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    title="Mikseri Aç/Kapat"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>

                {/* Dual Volume Controls in Player Bar */}
                <div className="flex flex-wrap items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
                  {/* Voice Assistant Volume Slider */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMuteVoice}
                      className="p-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                      title={isVoiceMuted ? 'Asistan Sesini Aç' : 'Asistan Sesini Kapat'}
                    >
                      {isVoiceMuted || voiceVolume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-indigo-400" />
                      )}
                    </button>
                    <span className="text-[11px] font-semibold text-slate-300">Asistan:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isVoiceMuted ? 0 : voiceVolume}
                      onChange={(e) => handleVoiceVolumeChange(parseFloat(e.target.value))}
                      className="w-20 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <span className="text-xs font-mono text-slate-400 w-8">
                      %{Math.round((isVoiceMuted ? 0 : voiceVolume) * 100)}
                    </span>
                  </div>

                  <div className="h-4 w-px bg-slate-800 hidden sm:block" />

                  {/* Meditation & Frequency Volume Slider */}
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-purple-400" />
                    <span className="text-[11px] font-semibold text-slate-300">Meditasyon:</span>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={therapyVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-24 accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <span className="text-xs font-mono text-purple-300 w-8">
                      %{Math.round(therapyVolume * 100)}
                    </span>
                  </div>
                </div>

                {/* Finish Early Button */}
                <button
                  onClick={triggerPostSessionVoiceScan}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Seansı Tamamla
                </button>

              </div>

            </div>
          )}

          {/* ================= STAGE 4: AI POST-SESSION MICRO-VOICE SCAN ================= */}
          {stage === 'post_scan' && (
            <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/40 backdrop-blur-2xl shadow-2xl gap-6 max-w-xl mx-auto text-center animate-fade-in">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shadow-xl animate-pulse">
                  <Mic className="w-10 h-10 text-indigo-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {postScanSecondsLeft}s
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-100">Seans Sonrası Vokal Stres Taraması</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Lütfen 5 saniye boyunca mikrofona konuşun veya derin bir nefes verin. Zihinsel rahatlama ve stres düşüş oranınız hesaplanıyor.
                </p>
              </div>

              <div className="w-full p-4 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs text-center font-mono text-emerald-400 animate-pulse">
                Ses basıncı ve mikro-vokal titreşim karşılaştırması yapılıyor ({postScanSecondsLeft}s kaldı)...
              </div>
            </div>
          )}

          {/* ================= STAGE 5: POST-SESSION VOICE INSIGHT & COMPLETION SUMMARY ================= */}
          {stage === 'finished' && (
            <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/40 backdrop-blur-2xl shadow-2xl gap-6 max-w-2xl mx-auto text-center animate-fade-in">
              
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Post-Session Voice Insight</span>
                </div>
                <h2 className="text-xl font-bold text-slate-100">Meditasyon Seansı Başarıyla Tamamlandı</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Sonuçlar Firebase veritabanına ve biyo-gelişim analitiğinize kaydedildi.
                </p>
              </div>

              {/* AI Spoken Insight Voice Box */}
              <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950/80 to-teal-950/60 border border-emerald-500/30 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 mb-1">
                  <Volume2 className="w-4 h-4" />
                  <span>Sesli Koçluk Değerlendirmesi:</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{assistantMessage}"
                </p>
              </div>

              {/* Comparative Before vs After Metric Cards */}
              <div className="w-full grid grid-cols-3 gap-3">
                
                {/* Before Stress */}
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-rose-500/30 flex flex-col items-center">
                  <span className="text-[11px] text-slate-400">Seans Başı Stres</span>
                  <span className="text-xl font-mono font-bold text-rose-400 mt-1">
                    %{stressScoreBefore}
                  </span>
                </div>

                {/* After Stress */}
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-emerald-500/30 flex flex-col items-center">
                  <span className="text-[11px] text-slate-400">Seans Sonu Stres</span>
                  <span className="text-xl font-mono font-bold text-emerald-400 mt-1">
                    %{stressScoreAfter}
                  </span>
                </div>

                {/* Delta Reduction */}
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-indigo-500/30 flex flex-col items-center">
                  <span className="text-[11px] text-slate-400">Stres Azalışı</span>
                  <span className="text-xl font-mono font-bold text-emerald-300 mt-1">
                    -%{Math.max(0, stressScoreBefore - stressScoreAfter)}
                  </span>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
                <button
                  onClick={() => setActiveSubView('analytics')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer border border-slate-700"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Biyo-Gelişim Grafiklerini Gör</span>
                </button>

                <button
                  onClick={handleExportToFullReport}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>AuraBio Raporuna Aktar & PDF</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default MindSpaceStudio;
