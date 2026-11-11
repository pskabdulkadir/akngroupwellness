import React, { useState, useRef } from 'react';
import { 
  Moon, 
  Sparkles, 
  Brain, 
  Play, 
  Square, 
  Compass, 
  Wand2, 
  Flame, 
  Droplets, 
  Wind, 
  Mountain, 
  Eye, 
  Radio, 
  CheckCircle2, 
  X, 
  Mic, 
  MicOff, 
  BookOpen, 
  SunMedium, 
  Layers 
} from 'lucide-react';
import { DreamAnalysisResult } from '../types';
import { soundEngine } from '../utils/soundEngine';
import { db, doc, setDoc } from '../lib/db';

interface DreamDecoderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_DREAMS = [
  {
    title: 'Berrak Denizde Yüzmek / Su & Akış',
    text: 'Kendimi masmavi, sonsuz ve çok berrak bir denizde derin bir huzurla yüzerken gördüm. Su sıcaktı ve hiçbir korku hissetmiyordum.',
    element: 'Su (Duygusal Akış)' as const,
  },
  {
    title: 'Gökyüzünde Uçmak & Kuşbakışı Bakış',
    text: 'Kollarımı açıp bulutların üzerine doğru yükseldiğimi, şehirlerin ve dağların üzerinden süzülerek rüzgarı yüzümde hissettiğimi gördüm.',
    element: 'Hava (Zihinsel İlham)' as const,
  },
  {
    title: 'Eski Labirent / Antik Ev Odaları',
    text: 'Büyük ve gizemli tarihi bir evin içinde kapıları tek tek açıyor, her kapının ardında farklı ışıklar ve unutulmuş odalar keşfediyordum.',
    element: 'Boşluk/Eter (Manevi İdrak)' as const,
  },
  {
    title: 'Kutsal Işık / Kandil & Manevi Rehber',
    text: 'Karanlık bir vadide yürürken gökten altın sarısı bir nur indi ve elinde kandil tutan nur yüzlü bir rehber bana yol gösterdi.',
    element: 'Ateş (Dönüşüm)' as const,
  },
  {
    title: 'Kök Salan Ağaç & Toprak Bahçesi',
    text: 'Ayaklarımın bereketli nemli toprağa kök saldığını, yemyeşil ulu bir çınar ağacına dönüşerek meyveler verdiğimi gördüm.',
    element: 'Toprak (Köklenme/Güven)' as const,
  },
];

export const DreamDecoderModal: React.FC<DreamDecoderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [dreamInput, setDreamInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DreamAnalysisResult | null>(null);
  const [isPlayingSession, setIsPlayingSession] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const speechRecognitionRef = useRef<any>(null);

  const handleVoiceRecordToggle = () => {
    setSpeechError(null);
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechError('Tarayıcınız ses tanıma özelliğini desteklemiyor. Lütfen rüyanızı metin olarak yazınız.');
      return;
    }

    if (isRecordingVoice) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
        speechRecognitionRef.current = null;
      }
      setIsRecordingVoice(false);
    } else {
      try {
        const recognizer = new SpeechRecognitionClass();
        recognizer.lang = 'tr-TR';
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript + ' ';
          }
          if (text.trim()) {
            setDreamInput(text.trim());
          }
        };
        recognizer.onerror = () => {
          setIsRecordingVoice(false);
        };
        recognizer.start();
        speechRecognitionRef.current = recognizer;
        setIsRecordingVoice(true);
      } catch (err) {
        setSpeechError('Mikrofon başlatılamadı. İzinleri kontrol edin.');
        setIsRecordingVoice(false);
      }
    }
  };

  // AI Archetypal Subconscious Decoder Algorithm
  const decodeDreamText = () => {
    const text = dreamInput.trim();
    if (!text) return;

    if (isRecordingVoice && speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch {}
      setIsRecordingVoice(false);
    }

    setIsDecoding(true);
    setAnalysisResult(null);

    setTimeout(() => {
      const lower = text.toLowerCase();

      let dominantElement: DreamAnalysisResult['dominantElement'] = 'Boşluk/Eter (Manevi İdrak)';
      let elementIcon = '✨';
      let dominantChakra = '6. Çakra (Ajna / Üçüncü Göz)';
      let chakraNumber = 6;
      let subconsciousTheme = 'Manevi Sezgi, Rehberlik ve Zihinsel Arınma';
      let archetypalSymbol = 'Kutsal Ayna & Bilge Kılavuz (Self Archetype)';
      let psychologicalInterpretation = 'Bilinçaltınız günlük hayatın gürültüsünden sıyrılarak içsel bir farkındalık ve sezgisel netlik inşa etmeye çalışıyor. Gördüğünüz simgeler, bastırılmış hakikatlerin aydınlığa kavuşma arzusunu simgeliyor.';
      let spiritualWisdom = 'İbn Arabî ve Sufi rüya tabir geleneğinde bu rüya "Alem-i Misâl" (İmgeler Alemi) kapılarının açıldığına, kalbin basiret gözünün uyandığına işaret eder.';
      let recommendedFrequencyHz = 852;
      let recommendedBinauralHz = 4.5;
      let recommendedWave: 'theta' | 'alpha' | 'delta' | 'gamma' = 'theta';
      let recommendedEsma = 'Yâ Habîr (812 Hz / Gizliyi Bilen) & Yâ Basîr';
      let recommendedAyet = 'Yusuf Suresi 101. Ayet (Rüyaların ve sırların tevili ilmi)';
      let recommendedMantra = 'OM SHAM (Üçüncü Göz Aydınlanma Frekansı)';
      let healingProtocolTitle = '852Hz Lucid İdrak & Teta Sezgi Protokolü';

      if (lower.includes('su') || lower.includes('deniz') || lower.includes('nehir') || lower.includes('yağmur') || lower.includes('göl') || lower.includes('yüzmek')) {
        dominantElement = 'Su (Duygusal Akış)';
        elementIcon = '💧';
        dominantChakra = '2. Çakra (Svadhisthana / Sakral Çakra)';
        chakraNumber = 2;
        subconsciousTheme = 'Duygusal Katarsis, Arınma ve Şifa Akışı';
        archetypalSymbol = 'Hayat Çeşmesi & Bilinçdışı Okyanusu';
        psychologicalInterpretation = 'Berrak su rüyaları, zihinsel ve duygusal yüklerin serbest bırakıldığını, bilinçaltınızın kendini tazeleyip şifalandırdığını gösterir.';
        spiritualWisdom = 'Tasavvufta su, "Hayat ve İlim" kaynağıdır. Rüyada temiz suya girmek, günahlardan ve kederlerden paklanmaya delalet eder.';
        recommendedFrequencyHz = 417;
        recommendedBinauralHz = 5.5;
        recommendedWave = 'theta';
        recommendedEsma = 'Yâ Hayy (18 Hz / Ebced: 18) & Yâ Latîf';
        recommendedAyet = 'Enbiya Suresi 30. Ayet: "Her canlı şeyi sudan yarattık"';
        recommendedMantra = 'VAM (Sakral Çakra Akış Mantrası)';
        healingProtocolTitle = '417Hz Travma Çözümleme & Sakral Akış Protokolü';
      } else if (lower.includes('uçmak') || lower.includes('gök') || lower.includes('kuş') || lower.includes('rüzgar') || lower.includes('kanat') || lower.includes('uçak')) {
        dominantElement = 'Hava (Zihinsel İlham)';
        elementIcon = '🌪️';
        dominantChakra = '4. Kalp & 5. Boğaz Çakrası (Anahata / Vishuddha)';
        chakraNumber = 4;
        subconsciousTheme = 'Özgürleşme, Yüksek Bakış Açısı ve İfade Gücü';
        archetypalSymbol = 'Kozmik Kanatlar & Zümrüd-ü Anka';
        psychologicalInterpretation = 'Uçma rüyaları sınırları aşma, endişelerden yükselerek olaylara geniş bir perspektiften bakabilme gücünü temsil eder.';
        spiritualWisdom = 'Mevlana rüyada göğe yükselmeyi "Ruhun kafesten kurtulup arş-ı âlâya seyr ü süluku" olarak tanımlar.';
        recommendedFrequencyHz = 639;
        recommendedBinauralHz = 7.83;
        recommendedWave = 'alpha';
        recommendedEsma = 'Yâ Vâsi (137 Hz / Genişleten) & Yâ Semî';
        recommendedAyet = 'İnşirah Suresi: "Biz senin göğsünü açıp genişletmedik mi?"';
        recommendedMantra = 'YAM / HAM (Kalp & İfade Uyumlaması)';
        healingProtocolTitle = '639Hz Kalp Genişlemesi & Schumann Rezonansı';
      } else if (lower.includes('ateş') || lower.includes('güneş') || lower.includes('ışık') || lower.includes('nur') || lower.includes('alev') || lower.includes('kandil')) {
        dominantElement = 'Ateş (Dönüşüm)';
        elementIcon = '🔥';
        dominantChakra = '3. Çakra (Manipura / Solar Pleksus) & 7. Taç Çakra';
        chakraNumber = 3;
        subconsciousTheme = 'Simyevi Dönüşüm, İrade ve Manevi Uyanış';
        archetypalSymbol = 'Güneş Kahramanı & İlahi Meşale';
        psychologicalInterpretation = 'Ateş ve ışık, eskimiş kalıpların yakılarak yeni bir benliğin doğmasını, iradenin ve manevi tutkunun parlamasını ifade eder.';
        spiritualWisdom = 'Nur Suresi 35. Ayetteki "Nur üstüne nur" tecellisi; kalbe inen ilahi hidayet ve feraset kıvılcımıdır.';
        recommendedFrequencyHz = 528;
        recommendedBinauralHz = 10.0;
        recommendedWave = 'alpha';
        recommendedEsma = 'Yâ Nûr (256 Hz / Ebced: 256) & Yâ Hâdî';
        recommendedAyet = 'Nur Suresi 35. Ayet (Ayet-el Nur)';
        recommendedMantra = 'RAM (Solar Pleksus Ateş Gücü)';
        healingProtocolTitle = '528Hz DNA Onarımı & Nur Dönüşüm Protokolü';
      } else if (lower.includes('toprak') || lower.includes('ağaç') || lower.includes('ev') || lower.includes('bahçe') || lower.includes('dağ') || lower.includes('taş')) {
        dominantElement = 'Toprak (Köklenme/Güven)';
        elementIcon = '🌿';
        dominantChakra = '1. Çakra (Muladhara / Kök Çakra)';
        chakraNumber = 1;
        subconsciousTheme = 'Köklenme, Güvenlik, Bereket ve Beden Farkındalığı';
        archetypalSymbol = 'Hayat Ağacı (Tuba) & Bereket Toprağı';
        psychologicalInterpretation = 'Toprak ve sağlam yapılar, hayatınızda sağlam temeller kurma, güvende hissetme ve maddi-manevi istikrar ihtiyacınızı gösterir.';
        spiritualWisdom = 'Toprak tevazu ve yaratılışın aslıdır. Rüyada toprağa dokunmak, aslî fıtrata dönmeye ve hayırlı rızka işarettir.';
        recommendedFrequencyHz = 396;
        recommendedBinauralHz = 6.0;
        recommendedWave = 'alpha';
        recommendedEsma = 'Yâ Melik (90 Hz / Ebced: 90) & Yâ Metîn';
        recommendedAyet = 'Mülk Suresi 15. Ayet: "O yeri sizin için boyun eğici kıldı"';
        recommendedMantra = 'LAM (Kök Çakra Köklenme Mantrası)';
        healingProtocolTitle = '396Hz Korkulardan Kurtuluş & Köklenme Protokolü';
      }

      const result: DreamAnalysisResult = {
        id: `dream-${Date.now()}`,
        timestamp: Date.now(),
        dreamText: text,
        dominantElement,
        elementIcon,
        dominantChakra,
        chakraNumber,
        subconsciousTheme,
        archetypalSymbol,
        psychologicalInterpretation,
        spiritualWisdom,
        recommendedFrequencyHz,
        recommendedBinauralHz,
        recommendedWave,
        recommendedEsma,
        recommendedAyet,
        recommendedMantra,
        healingProtocolTitle,
      };

      setAnalysisResult(result);
      setIsDecoding(false);

      // Asynchronously save to Firestore collection 'dream_records'
      try {
        const docRef = doc(db, 'dream_records', result.id);
        setDoc(docRef, { ...result, savedAt: new Date().toISOString() }, { merge: true }).catch(err => {
          console.debug('Firestore dream save notice:', err?.message);
        });
      } catch (fsErr) {
        console.debug('Firestore dream notice:', fsErr);
      }
    }, 1200);
  };

  const handleStartDreamSoundSession = async () => {
    if (!analysisResult) return;

    if (isPlayingSession) {
      soundEngine.stop();
      setIsPlayingSession(false);
    } else {
      await soundEngine.startDreamDecoderSession(
        analysisResult.recommendedFrequencyHz,
        analysisResult.recommendedBinauralHz,
        analysisResult.recommendedWave,
        0.55
      );
      setIsPlayingSession(true);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_DREAMS[0]) => {
    setDreamInput(preset.text);
    setTimeout(() => {
      decodeDreamText();
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-950/80 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/90 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
              <Moon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  AI Rüya & Bilinçaltı Çözümleyicisi
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Kadim Arketip Motoru
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gördüğünüz rüyayı analiz edip çakra, element ve şifa frekansı eşleşmesini çıkarır
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isPlayingSession) soundEngine.stop();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Section 1: Input & Mic Record */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                Rüyanızı Anlatın veya Yazın
              </label>
              <button
                onClick={handleVoiceRecordToggle}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isRecordingVoice
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-950'
                    : 'bg-slate-800 text-purple-300 hover:bg-slate-750 border border-purple-500/30'
                }`}
              >
                {isRecordingVoice ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Kaydı Bitir</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Sesli Anlat</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={dreamInput}
              onChange={(e) => setDreamInput(e.target.value)}
              placeholder="Örn: Bu gece rüyamda berrak masmavi bir denizde yüzüyordum, gökyüzünde parlak bir kandil vardı ve içimde tarifsiz bir sekinet hissettim..."
              rows={3}
              className="w-full p-3.5 text-xs rounded-2xl bg-slate-950/80 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors resize-none leading-relaxed"
            />

            {speechError && (
              <div className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-500/40 p-2 rounded-xl">
                {speechError}
              </div>
            )}

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400">Popüler Rüya Sembolleri ile Hızlı Deneme:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {PRESET_DREAMS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-750 border border-slate-700/60 text-left transition-all text-[11px] text-slate-300 hover:text-purple-200 flex items-center justify-between group"
                  >
                    <span className="truncate">{preset.title}</span>
                    <Sparkles className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Action Decode Button */}
            <button
              onClick={decodeDreamText}
              disabled={!dreamInput.trim() || isDecoding}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-950/80 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              {isDecoding ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Kadim Arketipler ve Çakra Katmanları Çözümleniyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Rüyayı ve Bilinçaltını Çözümle</span>
                </>
              )}
            </button>
          </div>

          {/* Section 2: Analysis Results */}
          {analysisResult && (
            <div className="rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 p-4 sm:p-5 space-y-4 shadow-xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    Bilinçaltı Odak Katmanı
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>{analysisResult.elementIcon}</span>
                    <span>{analysisResult.subconsciousTheme}</span>
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-500/40">
                    {analysisResult.dominantElement}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-500/40">
                    {(analysisResult.dominantChakra || 'Çakra').split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* 3 Main Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-1">
                  <div className="text-[10px] font-bold text-slate-400">Baskın Arketip</div>
                  <div className="text-xs font-bold text-purple-300">
                    {analysisResult.archetypalSymbol}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-1">
                  <div className="text-[10px] font-bold text-slate-400">Önerilen Esma & Ayet</div>
                  <div className="text-xs font-bold text-teal-300 truncate" title={analysisResult.recommendedEsma}>
                    {(analysisResult.recommendedEsma || 'Esma').split(' ')[0]}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-1">
                  <div className="text-[10px] font-bold text-slate-400">Nokta Atışı Frekans</div>
                  <div className="text-xs font-mono font-bold text-amber-300">
                    {analysisResult.recommendedFrequencyHz} Hz (+{analysisResult.recommendedBinauralHz}Hz)
                  </div>
                </div>
              </div>

              {/* Deep Interpretations */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-1 text-xs">
                  <div className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    Psikolojik & Bilinçaltı Yorumu:
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    {analysisResult.psychologicalInterpretation}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-teal-500/30 space-y-1 text-xs">
                  <div className="font-bold text-teal-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Kadim İrfan & Tasavvufi Hikmet:
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    {analysisResult.spiritualWisdom}
                  </p>
                </div>
              </div>

              {/* Action Sound Button */}
              <div className="pt-2">
                <button
                  onClick={handleStartDreamSoundSession}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer ${
                    isPlayingSession
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/80 animate-pulse'
                      : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-purple-950/80'
                  }`}
                >
                  {isPlayingSession ? (
                    <>
                      <Square className="w-4 h-4 fill-white" />
                      <span>Rüya Şifa Frekansını Durdur</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Önerilen Rüya Şifa Seansını Başlat ({analysisResult.recommendedFrequencyHz} Hz + {analysisResult.recommendedBinauralHz} Hz Teta)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Esma-ül Hüsna & 5 Kadim Element Arketip Veritabanı</span>
          </div>
          <button
            onClick={() => {
              if (isPlayingSession) soundEngine.stop();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
