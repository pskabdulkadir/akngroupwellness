import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Brain,
  Mic,
  MicOff,
  Flame,
  Droplet,
  Wind,
  Mountain,
  Sun,
  Play,
  Square,
  Volume2,
  Calendar,
  Award,
  Download,
  Trash2,
  TrendingUp,
  Heart,
  Compass,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Smile,
  Zap,
  Activity,
  Layers,
  FileText
} from 'lucide-react';
import { JournalEntry, JournalAnalysisResult, JournalUserStats, ElementalType } from '../types/journal';
import {
  analyzeJournalContent,
  saveJournalEntry,
  getLocalJournalHistory,
  deleteJournalEntry,
  calculateUserJournalStats,
  exportJournalReportToTXT
} from '../services/aiJournalAnalyzer';
import { soundEngine } from '../utils/soundEngine';
import { UserMember } from '../utils/authManager';

interface AuraJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserMember | null;
  onApplyDirectFrequency?: (freqHz: number, name: string) => void;
}

const DEFAULT_TAGS = [
  { id: 'yorgun', label: 'Yorgun', emoji: '💤', color: 'border-blue-500/40 text-blue-300 bg-blue-500/10' },
  { id: 'huzurlu', label: 'Huzurlu', emoji: '🕊️', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' },
  { id: 'kaygili', label: 'Kaygılı', emoji: '⚡', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
  { id: 'odaklanmis', label: 'Odaklanmış', emoji: '🎯', color: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10' },
  { id: 'donusume_acik', label: 'Dönüşüme Açık', emoji: '🌌', color: 'border-purple-500/40 text-purple-300 bg-purple-500/10' },
  { id: 'ofkeli', label: 'Öfkeli', emoji: '🔥', color: 'border-rose-500/40 text-rose-300 bg-rose-500/10' },
  { id: 'minnettar', label: 'Minnettar', emoji: '🌸', color: 'border-teal-500/40 text-teal-300 bg-teal-500/10' },
  { id: 'daganik', label: 'Dağınık', emoji: '🌪️', color: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10' }
];

export const AuraJournalModal: React.FC<AuraJournalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onApplyDirectFrequency
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'timeline' | 'archive'>('write');
  const [rawText, setRawText] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Huzurlu']);
  const [emotionIntensity, setEmotionIntensity] = useState<number>(5);

  // Voice Speech Recognition State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [latestEntry, setLatestEntry] = useState<JournalEntry | null>(null);

  // History & Stats
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<JournalUserStats>({
    streakDays: 0,
    streak: 0,
    totalEntries: 0,
    averagePositivity: 75,
    topChakras: [],
    dominantAura: '#10b981',
    hasMindfulnessBadge: false,
    dominantElement: 'Toprak',
    averageIntensity: 5.0
  });

  // Sound Engine Playback State
  const [isPlayingFrequency, setIsPlayingFrequency] = useState<boolean>(false);
  const [activePlayFrequency, setActivePlayFrequency] = useState<number | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Initialize Speech Recognition & Load Entries
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'tr-TR';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setRawText((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }

    // Load History
    loadHistoryData();
  }, [isOpen]);

  const loadHistoryData = () => {
    const list = getLocalJournalHistory();
    setEntries(list);
    const calculatedStats = calculateUserJournalStats(list);
    setStats(calculatedStats);
    if (list.length > 0 && !latestEntry) {
      setLatestEntry(list[0]);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.warn('Mic start failed:', e);
      }
    }
  };

  const toggleTag = (label: string) => {
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  // Perform AI Analysis & Save
  const handleStartAnalysis = async () => {
    if (!rawText.trim() && selectedTags.length === 0) {
      alert('Lütfen hislerinizi anlatan bir metin yazın, sesinizi kaydedin veya en az bir duygu etiketi seçin.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep('Bütüncül arketipler taranıyor ve duygusal titreşim ayrıştırılıyor...');

    await new Promise((r) => setTimeout(r, 600));
    setAnalysisStep('Çakra blokajları, 5 Element dengesi ve meridyen baskıları hesaplanıyor...');

    await new Promise((r) => setTimeout(r, 700));
    setAnalysisStep('Biyo-denge ve terapötik rehberlik matrisi süzgecinden geçiriliyor...');

    await new Promise((r) => setTimeout(r, 600));
    setAnalysisStep('Günün kişiye özel frekans protokolü ve içsel rehberlik mesajı sentezleniyor...');

    await new Promise((r) => setTimeout(r, 500));

    const result = analyzeJournalContent(rawText, selectedTags, emotionIntensity);

    const newEntry: JournalEntry = {
      id: `journal-${Date.now()}`,
      date: new Date().toISOString(),
      rawText: rawText.trim() || selectedTags.join(', '),
      selectedTags: selectedTags.length > 0 ? selectedTags : [result.dominantEmotion ?? 'Huzurlu'],
      emotionIntensity,
      aiAnalysisResult: result
    };

    const updatedList = await saveJournalEntry(newEntry, currentUser?.uid);
    setEntries(updatedList);
    setLatestEntry(newEntry);
    setStats(calculateUserJournalStats(updatedList));

    setIsAnalyzing(false);
    setSaveSuccessNotice('Günün içsel analizi ve frekans reçetesi başarıyla kaydedildi!');
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  // Play / Stop Frequency
  const handleTogglePlay = async (freqHz: number) => {
    if (isPlayingFrequency && activePlayFrequency === freqHz) {
      soundEngine.stop();
      setIsPlayingFrequency(false);
      setActivePlayFrequency(null);
    } else {
      soundEngine.stopImmediate();
      await soundEngine.unlockAudio();
      await soundEngine.startAdaptiveBioFrequency(
        freqHz,
        latestEntry?.aiAnalysisResult?.recommendedBinauralHz || 6.0,
        'alpha',
        0.55,
        'tibetan_bowls'
      );
      soundEngine.setMixerLevel('carrier', 0.85);
      soundEngine.setMixerLevel('binaural', 0.75);
      soundEngine.setMixerLevel('tibetan', 0.40);
      setIsPlayingFrequency(true);
      setActivePlayFrequency(freqHz);
    }
  };

  // Delete Entry
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu günlük kaydını silmek istediğinize emin misiniz?')) return;
    const updated = await deleteJournalEntry(id, currentUser?.uid);
    setEntries(updated);
    setStats(calculateUserJournalStats(updated));
    if (latestEntry?.id === id) {
      setLatestEntry(updated[0] || null);
    }
  };

  // Export TXT
  const handleExportTXT = () => {
    const textReport = exportJournalReportToTXT(entries, stats);
    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AuraBio-Gunluk-Raporu-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const latestAi = latestEntry?.aiAnalysisResult;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xl overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-purple-950/40 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-500/30 border border-purple-500/50 flex items-center justify-center shadow-lg shadow-purple-950/50">
              <Brain className="w-5 h-5 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-100">
                  AI Yaşam Koçu & Günlük Frekans Günlüğü
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                  Aura-Journal & AI Reflector
                </span>
                {(stats.streak ?? 0) > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>{stats.streak} Günlük Zincir</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Bütüncül Terapötik Rehberlik & Kadim Arketipler (Esma, Çakra, 5 Element)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stats.hasMindfulnessBadge && (
              <div 
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold shadow-md shadow-amber-950/40"
                title="7 Günlük Düzenli İçsel Gözlem Rozeti Kazanıldı!"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Farkındalık Rozeti</span>
              </div>
            )}
            <button
              onClick={() => {
                soundEngine.stop();
                setIsPlayingFrequency(false);
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('write')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'write'
                  ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>✍️ Yeni Günlük & Klinik Analiz</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>📈 Ruhsal Gelişim Grafiği</span>
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'archive'
                  ? 'bg-teal-500/20 text-teal-200 border border-teal-500/40 shadow-sm shadow-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>📜 Geçmiş Kayıtlar ({entries.length})</span>
            </button>
          </div>

          <button
            onClick={handleExportTXT}
            disabled={entries.length === 0}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Tüm Günlükleri ve Psikolojik Raporu İndir"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Raporu İndir (TXT)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: WRITE & ANALYZE */}
          {activeTab === 'write' && (
            <div className="space-y-6">
              
              {/* Informative Intro Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/30 border border-purple-500/30 flex items-start gap-3 shadow-md">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-purple-200">
                    Bilinçli Farkındalık & İçsel Ses Aynası
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bugün zihnini kurcalayan düşünceleri, hissettiğin duygusal dalgalanmaları veya kalbindeki ağırlıkları dilediğince dök. Yapay zeka karar motoru bu girdiyi klinik psikoloji ve kadim esma/çakra frekanslarıyla harmanlayarak sana özel reçeteyi çıkaracaktır.
                  </p>
                </div>
              </div>

              {/* Free Text & Voice Recording Input Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span>İçsel Notlarınızı Yazın veya Sesli Dikte Edin</span>
                  </label>
                  {speechSupported && (
                    <button
                      onClick={toggleRecording}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md ${
                        isRecording
                          ? 'bg-rose-600 text-white animate-pulse shadow-rose-900/60'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Kaydı Bitir</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 text-purple-400" />
                          <span>🎙️ Sesli Dikte</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Bugün zihnimde neler oluyor, içimde hangi duygular var? Kendini yargılamadan, tüm samimiyetinle ifade et..."
                    rows={4}
                    className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-purple-500/70 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all leading-relaxed"
                  />
                  {isRecording && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      <span>Sesiniz dinleniyor & metne dökülüyor...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-Dimensional Emotion Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Smile className="w-3.5 h-3.5 text-teal-400" />
                  <span>Ana Duygu ve Durum Etiketleri (Çoklu Seçilebilir)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEFAULT_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag.label);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.label)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                          isSelected
                            ? `${tag.color} ring-1 ring-purple-500 shadow-md shadow-purple-950/30 scale-[1.02]`
                            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-base">{tag.emoji}</span>
                        <span>{tag.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-purple-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emotion Intensity Slider (1 to 10) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Duygu Yoğunluk Skoru (Hissedilen Şiddet)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Yoğunluk:</span>
                    <span className={`px-2 py-0.5 rounded-lg font-black text-sm font-mono border ${
                      emotionIntensity <= 3
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : emotionIntensity <= 6
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {emotionIntensity} / 10
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={emotionIntensity}
                    onChange={(e) => setEmotionIntensity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
                    <span>1 (Hafif / Sakin)</span>
                    <span>5 (Dengeli)</span>
                    <span>10 (Çok Yoğun / Zirve)</span>
                  </div>
                </div>
              </div>

              {/* Start Analysis Button */}
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm transition-all shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin text-purple-200" />
                    <span>Klinik Analiz & Frekans Reçetesi Hazırlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 text-purple-200" />
                    <span>🧠 Yapay Zeka Analizini Başlat & Reçeteyi Al</span>
                  </>
                )}
              </button>

              {/* Animated Loading Overlay when Analyzing */}
              {isAnalyzing && (
                <div className="p-6 rounded-3xl bg-slate-950/90 border border-purple-500/50 text-center space-y-4 shadow-2xl animate-fade-in">
                  <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center animate-spin">
                    <Sparkles className="w-7 h-7 text-purple-300" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-purple-200">
                      Biyo-Denge Matrisi & Arketip Taraması
                    </h4>
                    <p className="text-xs text-slate-300 font-mono animate-pulse">
                      {analysisStep}
                    </p>
                  </div>
                </div>
              )}

              {/* Success notice */}
              {saveSuccessNotice && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessNotice}</span>
                </div>
              )}

              {/* LATEST RESULT CARD DISPLAY */}
              {latestEntry && latestAi && !isAnalyzing && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/30 border border-purple-500/40 space-y-5 shadow-2xl animate-fade-in">
                  
                  {/* Title & Metadata */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40">
                        <Sparkles className="w-5 h-5 text-purple-300" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                          GÜNÜN İÇSEL REHBERLİK & FREKANS REÇETESİ
                        </span>
                        <h3 className="text-base font-black text-slate-100">
                          {latestAi.dominantEmotion} • {latestAi.coachingTheme}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                        Element: {latestAi.elementalFocus}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold font-mono">
                        {latestAi.recommendedFrequencyHz} Hz
                      </span>
                    </div>
                  </div>

                  {/* Holistic Psychological Insight */}
                  <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span>Bütüncül Terapötik İçgörü & Biyo-Rezonans Modeli</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                      "{latestAi.psychologicalInsight}"
                    </p>
                  </div>

                  {/* Associated Esma & Chakra & Breathing Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                        <Sun className="w-3 h-3" />
                        <span>Esma & Manevi Şifa</span>
                      </div>
                      <div className="text-xs font-bold text-slate-200">
                        {latestAi.associatedEsma || 'Yâ Şâfî & Yâ Selâm'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-indigo-400 flex items-center gap-1">
                        <Compass className="w-3 h-3" />
                        <span>Hedef Enerji Merkezi</span>
                      </div>
                      <div className="text-xs font-bold text-slate-200">
                        {latestAi.targetChakra || 'Kalp Çakrası'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-teal-400 flex items-center gap-1">
                        <Wind className="w-3 h-3" />
                        <span>Nefes & Akustik Ritim</span>
                      </div>
                      <div className="text-xs font-bold text-slate-200 line-clamp-1">
                        {latestAi.breathingTechnique || '4-7-8 Köklenme Nefesi'}
                      </div>
                    </div>
                  </div>

                  {/* Daily Affirmation Card */}
                  {latestAi.affirmation && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-950/30 to-slate-950/50 border border-teal-500/30 flex items-center gap-3">
                      <Heart className="w-4 h-4 text-teal-400 shrink-0" />
                      <div className="text-xs text-teal-200 font-medium">
                        <span className="font-bold text-teal-300">Günün Olumlaması: </span>
                        "{latestAi.affirmation}"
                      </div>
                    </div>
                  )}

                  {/* PRIMARY ACTION BUTTON: PLAY FREQUENCY DIRECTLY VIA SOUND ENGINE */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => handleTogglePlay(latestAi.recommendedFrequencyHz)}
                      className={`flex-1 w-full py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-[0.99] ${
                        isPlayingFrequency && activePlayFrequency === latestAi.recommendedFrequencyHz
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 animate-pulse'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
                      }`}
                    >
                      {isPlayingFrequency && activePlayFrequency === latestAi.recommendedFrequencyHz ? (
                        <>
                          <Square className="w-4 h-4 text-white" />
                          <span>⏹️ Frekansı Durdur ({latestAi.recommendedFrequencyHz} Hz)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 text-white fill-white" />
                          <span>▶️ Günün Reçete Edilen Frekansını Şimdi Başlat ({latestAi.recommendedFrequencyHz} Hz)</span>
                        </>
                      )}
                    </button>

                    {onApplyDirectFrequency && (
                      <button
                        onClick={() => {
                          onApplyDirectFrequency(
                            latestAi.recommendedFrequencyHz,
                            `${latestAi.dominantEmotion} Rezonansı (${latestAi.recommendedFrequencyHz} Hz)`
                          );
                          onClose();
                        }}
                        className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
                        title="Ana Ekrana Taşı"
                      >
                        <span>Ana Ekrana Aktar</span>
                      </button>
                    )}
                  </div>

                  {/* Equalizer Wave Visualizer when playing */}
                  {isPlayingFrequency && activePlayFrequency === latestAi.recommendedFrequencyHz && (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                        <span className="text-xs font-bold text-emerald-300">
                          {latestAi.recommendedFrequencyHz} Hz + {latestAi.recommendedBinauralHz || 6.0} Hz Binaural Titreşim Aktif
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse"></span>
                        <span className="w-1 h-6 bg-teal-400 rounded-full animate-pulse delay-75"></span>
                        <span className="w-1 h-3 bg-emerald-300 rounded-full animate-pulse delay-150"></span>
                        <span className="w-1 h-5 bg-teal-300 rounded-full animate-pulse delay-100"></span>
                        <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse"></span>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB 2: TIMELINE & SPIRITUAL GROWTH ANALYTICS */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              
              {/* Analytics Header Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Günlük Zinciri</span>
                  </div>
                  <div className="text-xl font-black text-amber-300 font-mono">
                    {stats.streak} Gün
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Toplam Kayıt</span>
                  </div>
                  <div className="text-xl font-black text-purple-300 font-mono">
                    {stats.totalEntries}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ortalama Yoğunluk</span>
                  </div>
                  <div className="text-xl font-black text-indigo-300 font-mono">
                    {stats.averageIntensity} / 10
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Baskın Element</span>
                  </div>
                  <div className="text-xl font-black text-emerald-300">
                    {stats.dominantElement}
                  </div>
                </div>
              </div>

              {/* 7-Day Mindfulness Badge Unlocked Card */}
              {stats.hasMindfulnessBadge ? (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-yellow-950/50 border border-amber-500/50 flex items-center gap-4 shadow-xl">
                  <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300">
                    <Award className="w-8 h-8 text-amber-400 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-200">
                      🏆 Bilinçli Farkındalık ve İçsel Gözlem Rozeti Kazanıldı!
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      Tebrikler! 7 günlük düzenli içsel gözlem ritmini koruyarak zihinsel tutarlılık ve duygusal regülasyon eşiğini başarıyla aştınız.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-slate-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-300">
                        7 Günlük Farkındalık Rozeti İlerlemesi: {stats.streak}/7 Gün
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Düzenli günlük tutmaya devam ederek profil rozetini aktifleştirin.
                      </div>
                    </div>
                  </div>
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${Math.min(100, ((stats.streak ?? 0) / 7) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Interactive Intensity Progression Graph */}
              <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Duygu Yoğunluk Eğrisi & Zaman Çizelgesi</span>
                </h4>

                {entries.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Henüz kayıt bulunamadı. Yeni bir günlük yazarak gelişim eğrinizi başlatın.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-36 flex items-end gap-2 pt-6 pb-2 px-2 overflow-x-auto">
                      {entries.slice(0, 10).reverse().map((entry, idx) => {
                        const heightPercent = Math.max(15, ((entry.emotionIntensity ?? 0) / 10) * 100);
                        const isHigh = (entry.emotionIntensity ?? 0) >= 7;
                        return (
                          <div key={entry.id || idx} className="flex-1 min-w-[36px] max-w-[60px] flex flex-col items-center gap-1.5 group">
                            <span className="text-[10px] font-mono text-slate-400 group-hover:text-purple-300">
                              {entry.emotionIntensity}
                            </span>
                            <div 
                              className={`w-full rounded-t-lg transition-all duration-300 ${
                                isHigh
                                  ? 'bg-gradient-to-t from-rose-600 to-rose-400 group-hover:brightness-125'
                                  : (entry.emotionIntensity ?? 0) <= 3
                                  ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-125'
                                  : 'bg-gradient-to-t from-purple-600 to-indigo-400 group-hover:brightness-125'
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            />
                            <span className="text-[9px] text-slate-500 truncate w-full text-center">
                              {new Date(entry.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Geçmiş Seanslar ➔</span>
                      <span>En Yeni Seans (Sağ)</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: ARCHIVE & PREVIOUS ENTRIES */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
              {entries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Calendar className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-bold">Kayıtlı Günlük Bulunmuyor</p>
                  <p className="text-xs text-slate-400">
                    "Yeni Günlük & Biyo-Analiz" sekmesinden ilk içsel notunuzu kaydedebilirsiniz.
                  </p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-md"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">
                          {new Date(entry.date).toLocaleString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          {entry.aiAnalysisResult?.dominantEmotion}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                          Yoğunluk: {entry.emotionIntensity}/10
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => entry.aiAnalysisResult && handleTogglePlay(entry.aiAnalysisResult?.recommendedFrequencyHz)}
                          className="px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Play className="w-3 h-3 fill-emerald-300" />
                          <span>{entry.aiAnalysisResult?.recommendedFrequencyHz} Hz Çal</span>
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors"
                          title="Kaydı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                      "{entry.rawText}"
                    </p>

                    <div className="text-xs text-purple-200 bg-purple-950/20 p-3 rounded-xl border border-purple-500/20 leading-relaxed italic">
                      <span className="font-bold text-purple-300">Psikolojik İçgörü: </span>
                      {entry.aiAnalysisResult?.psychologicalInsight}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span>🏷️ Etiketler: {entry.selectedTags?.join(', ')}</span>
                      <span>🌐 Element: {entry.aiAnalysisResult?.elementalFocus}</span>
                      <span>🤲 Esma: {entry.aiAnalysisResult?.associatedEsma || '-'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kişisel verileriniz ve içsel notlarınız cihazınızda güvenle şifrelenir.</span>
          </div>
          <button
            onClick={() => {
              soundEngine.stop();
              setIsPlayingFrequency(false);
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
