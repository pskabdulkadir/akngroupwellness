import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Layers,
  Compass,
  Sun,
  Info,
  Mic,
  Moon,
  LifeBuoy,
  Smartphone,
  Watch,
  Globe,
  Brain,
  Clock,
  Users,
  Repeat,
  Crown
} from 'lucide-react';
import { voiceAssistant } from '../utils/voiceAssistant';
import { HEALING_CATEGORIES, TOTAL_HEALING_COUNT } from '../data/healingLibrary';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type GuideTab = 
  | 'steps' 
  | 'wearables' 
  | 'mindspace'
  | 'mandala_ecosystem' 
  | 'encyclopedia' 
  | 'acoustic' 
  | 'schools' 
  | 'reports_comparison'
  | 'mobile_tools' 
  | 'theory' 
  | 'tips' 
  | 'faq';

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<GuideTab>('steps');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeSpeechStep, setActiveSpeechStep] = useState<number | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);

  useEffect(() => {
    setIsVoiceMuted(voiceAssistant.isMute());
    const unsubscribe = voiceAssistant.subscribe((speaking) => {
      setIsSpeaking(speaking);
      if (!speaking) {
        setActiveSpeechStep(null);
      }
    });

    return () => {
      unsubscribe();
      voiceAssistant.stop();
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    voiceAssistant.stop();
    onClose();
  };

  const toggleVoiceMute = () => {
    const nextMuted = voiceAssistant.toggleMute();
    setIsVoiceMuted(nextMuted);
  };

  const handleRateChange = (rate: number) => {
    setSpeechRate(rate);
    voiceAssistant.setRate(rate);
  };

  // Full Narration Script
  const playFullGuide = () => {
    voiceAssistant.unlockMobileSpeech();
    const script = `Kullanım kılavuzuna hoş geldiniz. Başlamak için giriş yapabilir, kayıt olabilir veya varsa demo seçeneğini kullanabilirsiniz. Kamera bölümünde tarama iznini verin, yüzünüzü iyi ışıkta kadraja alın ve ekrandaki tarama düğmesine basın. Tarama yaklaşık 15 saniye sürer. Sonuç ekranında on rapor sekmesini inceleyebilir ve raporu PDF olarak indirebilirsiniz. İsterseniz şifa kütüphanesinden bir ses seçip süre belirleyerek dinleme oturumu başlatabilirsiniz. Akıllı saat, mikrofon, mandala, harita, MindSpace, günlük ve mobil araçlar isteğe bağlı bölümlerdir. Bu uygulama tıbbi teşhis veya tedavi sağlamaz; ekrandaki analizler klinik ölçüm değildir. Acil durumda sağlık hizmetlerine başvurun.`;

    setActiveSpeechStep(-1);
    voiceAssistant.speak(script, true);
  };

  const playSection = (stepNum: number, text: string) => {
    voiceAssistant.unlockMobileSpeech();
    setActiveSpeechStep(stepNum);
    voiceAssistant.speak(text, true);
  };

  const stopVoice = () => {
    voiceAssistant.stop();
    setActiveSpeechStep(null);
  };

  const stepTexts = [
    {
      step: 1,
      title: "1. Adım: Giriş, kayıt veya demo",
      desc: "Ana menüdeki giriş/kayıt akışını kullanın. Yeni kayıt sırasında istenen hesap ve bayi/referans bilgilerini tamamlayın. Demo seçeneği görünüyorsa hesabınızı oluşturmadan önce deneyebilirsiniz.",
      voiceText: "Birinci adım: Giriş, kayıt veya demo. Mevcut hesabınızla giriş yapın, yeni hesap oluşturun ya da ekranda sunuluyorsa demo seçeneğini kullanın."
    },
    {
      step: 2,
      title: "2. Adım: Kamera ve izinleri hazırlama",
      desc: "Tarayıcı kamera iznini istediğinde onaylayın. Yüzünüzü kadrajda tutun, telefonu sabitleyin ve yüzünüzü eşit aydınlatan bir ortam seçin. İzin penceresi görünmüyorsa tarayıcı ayarlarından kamera erişimini kontrol edin.",
      voiceText: "İkinci adım: Kamera ve izinleri hazırlama. Tarayıcının kamera erişimine izin verin, telefonu sabitleyin ve yüzünüzü iyi ışıkta kadrajda tutun."
    },
    {
      step: 3,
      title: "3. Adım: Tarama başlatma",
      desc: "Kamera ekranındaki tarama düğmesine basın ve yaklaşık 15 saniyelik işlemin bitmesini bekleyin. Bu sırada kadrajdan çıkmamaya ve telefonu hareket ettirmemeye çalışın.",
      voiceText: "Üçüncü adım: Tarama başlatma. Kamera ekranındaki düğmeye basın ve yaklaşık on beş saniye boyunca sabit kalın. İşlem tamamlandığında rapor açılır."
    },
    {
      step: 4,
      title: "4. Adım: Raporu inceleme ve isteğe bağlı ses oturumu",
      desc: "Raporun on rapor sekmesini gözden geçirin; isterseniz PDF indirin. Ses oturumu için Şifa bölümünden bir içerik seçin, süreyi belirleyin ve oynatmayı başlatın. Önerileri sağlık kararı yerine kullanmayın.",
      voiceText: "Dördüncü adım: Raporu inceleme ve isteğe bağlı ses oturumu. Raporun on sekmesini açabilir ve PDF olarak indirebilirsiniz. Ses içeriği dinlemek için Şifa bölümünden bir içerik seçip süreyi belirleyin."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-100">Kullanım Kılavuzu & Sesli Rehber</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
                  Güncel Kullanım Rehberi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tarama, rapor, ses oturumları ve kişisel araçlar için adım adım yardım
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Voice Assistant Control Banner */}
        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
              isSpeaking 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400 shadow-md shadow-emerald-500/30 animate-pulse' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>Türkçe Sesli Rehber Asistanı</span>
                {isSpeaking && (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Seslendiriliyor...
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Tüm kılavuzu veya seçeceğiniz modülü sesli olarak dinleyebilirsiniz.
              </p>
            </div>
          </div>

          {/* Voice Action Controls */}
          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <button
                onClick={stopVoice}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950 transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Seslendirmeyi Durdur</span>
              </button>
            ) : (
              <button
                onClick={playFullGuide}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all hover:scale-105 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tüm Kılavuzu Dinle</span>
              </button>
            )}

            {/* Voice Speed Selector */}
            <div className="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800">
              {[1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                    speechRate === rate 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Mute / Unmute */}
            <button
              onClick={toggleVoiceMute}
              className={`min-h-[48px] min-w-[48px] flex items-center justify-center p-2 rounded-xl border transition-colors cursor-pointer ${
                isVoiceMuted 
                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isVoiceMuted ? 'Sesli Asistanı Aç' : 'Sesli Asistanı Sessize Al'}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 items-stretch px-3 sm:px-6 pt-2.5 bg-slate-950/50 border-b border-slate-800 gap-1 overflow-y-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveSection('steps')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'steps'
                ? 'bg-slate-900 text-emerald-400 border-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>4 Adımda Kullanım</span>
          </button>

          <button
            onClick={() => setActiveSection('wearables')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'wearables'
                ? 'bg-slate-900 text-emerald-400 border-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Watch className="w-4 h-4 text-emerald-400" />
            <span>⌚ Akıllı Saat Köprüsü</span>
          </button>

          <button
            onClick={() => setActiveSection('mindspace')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'mindspace'
                ? 'bg-slate-900 text-indigo-400 border-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>🧠 MindSpace Studio</span>
          </button>

          <button
            onClick={() => setActiveSection('mandala_ecosystem')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'mandala_ecosystem'
                ? 'bg-slate-900 text-purple-400 border-purple-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>🌌 AI Mandala & Küresel Harita</span>
          </button>

          <button
            onClick={() => setActiveSection('encyclopedia')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'encyclopedia'
                ? 'bg-slate-900 text-teal-400 border-teal-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>🌿 Şifa Ansiklopedisi ({TOTAL_HEALING_COUNT})</span>
          </button>

          <button
            onClick={() => setActiveSection('acoustic')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'acoustic'
                ? 'bg-slate-900 text-cyan-400 border-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Mic className="w-4 h-4 text-cyan-400" />
            <span>🎙️ 10s Biyo-Akustik Tarama</span>
          </button>

          <button
            onClick={() => setActiveSection('schools')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'schools'
                ? 'bg-slate-900 text-purple-400 border-purple-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ses Kütüphanesi ({TOTAL_HEALING_COUNT})</span>
          </button>

          <button
            onClick={() => setActiveSection('reports_comparison')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'reports_comparison'
                ? 'bg-slate-900 text-emerald-400 border-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Repeat className="w-4 h-4 text-emerald-400" />
            <span>📊 10 Sekmeli Rapor</span>
          </button>

          <button
            onClick={() => setActiveSection('mobile_tools')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'mobile_tools'
                ? 'bg-slate-900 text-amber-400 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>📱 Mobil & Acil Araçlar</span>
          </button>

          <button
            onClick={() => setActiveSection('theory')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'theory'
                ? 'bg-slate-900 text-blue-400 border-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Analiz Sınırları</span>
          </button>

          <button
            onClick={() => setActiveSection('tips')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'tips'
                ? 'bg-slate-900 text-amber-400 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>İpuçları</span>
          </button>

          <button
            onClick={() => setActiveSection('faq')}
            className={`min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-normal break-words text-left cursor-pointer ${
              activeSection === 'faq'
                ? 'bg-slate-900 text-indigo-400 border-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>SSS</span>
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* TAB 1: 4 ADIMDA KULLANIM */}
          {activeSection === 'steps' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  Başlangıçtan rapora kadar aşağıdaki 4 adımı izleyin. Her adımın yanındaki hoparlör düğmesiyle açıklamayı dinleyebilirsiniz.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stepTexts.map((item) => (
                  <div
                    key={item.step}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                      activeSpeechStep === item.step
                        ? 'bg-emerald-950/40 border-emerald-400 shadow-xl shadow-emerald-950/80 ring-2 ring-emerald-400/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-sm flex items-center justify-center">
                          {item.step}
                        </span>

                        <button
                          onClick={() => playSection(item.step, item.voiceText)}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeSpeechStep === item.step
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md animate-pulse'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                          title="Bu Adımı Sesli Dinle"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>{activeSpeechStep === item.step ? 'Dinleniyor' : 'Sesli Dinle'}</span>
                        </button>
                      </div>

                      <h3 className="text-base font-bold text-slate-100">{item.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                    </div>

                    {item.step === 2 && (
                      <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        <span><strong>Akıllı Güvenlik:</strong> Cansız nesnelerin taranması engellenmiştir.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AURA-SYNC AKILLI SAAT KÖPRÜSÜ (WEARABLES) */}
          {activeSection === 'wearables' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Watch className="w-5 h-5 text-emerald-400" />
                    Akıllı Saat ve Bluetooth Köprüsü (Web BLE)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Uyumlu cihazı tarayıcı üzerinden eşleştirin; bağlantı desteği cihaz ve tarayıcıya göre değişebilir.
                  </p>
                </div>

                <button
                  onClick={() => playSection(201, `Akıllı saat köprüsünü kullanmak için tarayıcıda Bluetooth desteği ve uyumlu bir Bluetooth kalp atış hızı cihazı gerekir. Bağlan düğmesine basıp tarayıcının cihaz seçicisinden sensörü seçin. İzin verilmez veya cihaz desteklenmezse simülasyon seçeneğini yalnızca arayüzü denemek için kullanın. Görüntülenen veriler tıbbi ölçüm değildir.`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Bu Bölümü Dinle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold">1</div>
                  <h4 className="text-sm font-bold text-slate-100">Bluetooth Cihazı Eşleştirin</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong>Bluetooth cihazını bağla</strong> seçeneğine tıklayın ve tarayıcıdaki cihaz listesinden uyumlu sensörü seçin. Web Bluetooth için uyumlu tarayıcı ve güvenli bağlantı gerekir.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold">2</div>
                  <h4 className="text-sm font-bold text-slate-100">Bağlantı verileri</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bağlantı durumu ve uygulamanın sunduğu değerler ekranda görünür. Simülasyon açıksa değerler örnekseldir; sağlık kararı vermek için kullanmayın.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold">3</div>
                  <h4 className="text-sm font-bold text-slate-100">Dinamik Frekans Adaptasyonu</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Otomatik uyarlama açıksa köprü ses önerilerini etkileyebilir. Özelliği kapatabilir ve oturumu dilediğiniz an durdurabilirsiniz.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Bağlantı notu</span>
                  <p className="text-xs text-slate-300">
                    Cihazın Bluetooth Kalp Hızı hizmetini sunması ve tarayıcının Web Bluetooth desteklemesi gerekir. Uyum model ve tarayıcıya göre değişir; önizleme iframe’lerinde donanım izni kısıtlanabilir.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold whitespace-nowrap">
                  Web Bluetooth
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MINDSPACE STUDIO */}
          {activeSection === 'mindspace' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    MindSpace Studio — günlük, ses ve farkındalık araçları
                  </h3>
                  <p className="text-xs text-slate-400">
                    Günlük, zaman dilimi önerileri, sesli araçlar ve rehberli içerikler tek alanda
                  </p>
                </div>

                <button
                  onClick={() => playSection(301, `MindSpace Studio içindeki günlük ve ses araçlarını kişisel notlar, odaklanma ve rehberli dinleme için kullanabilirsiniz. Biyo-ritim alanı günün saatine göre içerik önerir. Öneriler genel niteliktedir; tanı, terapi veya kişiye özel tıbbi tavsiye değildir.`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  <span>Bu Bölümü Dinle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Brain className="w-4 h-4" />
                    <span>1. Aura-Journal (AI Yaşam Koçu & Günlük)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Günlük alanına düşüncelerinizi yazın veya destekleniyorsa sesli giriş kullanın. Oluşan yanıtları yazma ve öz değerlendirme desteği olarak görün; klinik değerlendirme yerine koymayın.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    <span>2. Biyo-Ritim & Circadian Synchronizer</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Günün saatine göre zaman dilimi ve içerik önerisi görüntüler. Bu bölüm vücut saatini, hormon düzeylerini veya organ işlevlerini ölçmez.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                    <Mic className="w-4 h-4" />
                    <span>3. Sesli & Niyetli Frekans Labirenti (Forge)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sesli niyet aracında kısa bir metin kaydedip görsel ve sesli etkileşimi deneyin. Mikrofon kullanımı için tarayıcı izni gerekebilir; çıktı yorumlayıcıdır.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Moon className="w-4 h-4" />
                    <span>4. AI Rüya & Bilinçaltı Çözümleyicisi</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Rüya notlarınızı yazıp uygulamanın sunduğu yorumları gözden geçirin. Yorumlar kesin anlam, psikolojik değerlendirme veya tedavi önerisi değildir.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3">
                <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-200">Kullanım notu</h4>
                  <p className="text-xs text-indigo-300/80 leading-relaxed mt-0.5">
                    Öneriler genel bilgilendirme ve kişisel farkındalık amaçlıdır; sağlık hizmetlerinin veya uzman değerlendirmesinin yerini tutmaz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI MANDALA, 7 GÜNLÜK KAMP & KÜRESEL HARİTA */}
          {activeSection === 'mandala_ecosystem' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Mandala, 7 Günlük Yolculuk ve Küresel Harita
                  </h3>
                  <p className="text-xs text-slate-400">
                    Görsel içerikleri, günlük rehberli akışı ve harita görünümünü keşfedin
                  </p>
                </div>

                <button
                  onClick={() => playSection(401, `Mandala bölümünde görsel tasarımlarla etkileşebilir, 7 günlük yolculukta sunulan rehberli adımları takip edebilir ve küresel harita ekranını inceleyebilirsiniz. Bu araçlar görsel ve kişisel kullanım içindir; sağlık sonucu vaat etmez.`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span>Bu Bölümü Dinle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-purple-400 font-bold text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Kutsal Geometri Mandala</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Görsel oluşturucuda tasarımları inceleyin, kontrollerle görünümü değiştirin ve ekranda sunulan indirme seçeneğini kullanın.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-teal-400 font-bold text-sm flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    <span>7 Günlük AI Bütünsel Kamplar</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Günlük rehberli içerikleri kendi temponuzda açın. Günün saatine veya adımına göre sunulan egzersizler sağlık tedavisi değildir.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-cyan-400 font-bold text-sm flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    <span>Anonim Küresel Isı Haritası</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Harita görünümündeki bilgileri inceleyin. Paylaşılan konum veya etkinlik verilerinin anlamı ekranda belirtilen açıklamalara bağlıdır; bunları gerçek zamanlı sağlık verisi olarak yorumlamayın.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30 space-y-2 sm:col-span-2">
                  <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                    <Crown className="w-4 h-4" />
                    <span>Hesap ve Bayi Paneli (Monoline 7 Nefis MLM - USD)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Giriş yaptıktan sonra menüdeki <strong>Bayi Paneli</strong> alanını açın. Sistemimiz <strong>%100 ABD Doları (USD)</strong> para birimiyle çalışan <strong>Küresel Tek Hat (Monoline) 7 Derinlik</strong> kazanç mimarisine sahiptir. Buradan 15 kademeli seans kredi paketlerinizi yönetebilir, %20 Direkt Sponsor ve %25 Monoline derinlik kazançlarınızı anlık USD cüzdanınızda takip edebilir, bakiye transferlerinizi ve çekim taleplerinizi güvenle gerçekleştirebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ŞİFA ANSİKLOPEDİSİ */}
          {activeSection === 'encyclopedia' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    🌿 Şifa Ansiklopedisi
                  </h3>
                  <p className="text-xs text-slate-400">
                    Uygulamadaki içerikleri kategori, açıklama ve ses seçeneğine göre keşfedin. İçerikler tıbbi tedavi değildir.
                  </p>
                </div>

                <button
                  onClick={() => playSection(501, `Şifa Ansiklopedisinde içerikleri kategorilere göre gözden geçirin. Bir öğeyi seçtiğinizde uygulamada sunulan açıklama ve ses seçeneklerini takip edin. Frekanslar ve içerik açıklamaları tıbbi teşhis veya tedavi değildir.`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Bu Bölümü Dinle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {HEALING_CATEGORIES.map((category) => (
                  <div key={category.key} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-emerald-300">{category.title}</div>
                    <p className="text-[11px] text-slate-400">{category.subtitle}</p>
                    <div className="text-[10px] text-slate-500 font-mono">{category.totalCount ?? 0} içerik · {category.tradition}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: 10S BİYO-AKUSTİK TARAMA */}
          {activeSection === 'acoustic' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Mic className="w-5 h-5 text-cyan-400" />
                    🎙️ 10 Saniyelik Ön / Son Biyo-Akustik Tarama Motoru
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mikrofonla alınan ses örneklerinin uygulama içi karşılaştırması
                  </p>
                </div>

                <button
                  onClick={() => playSection(601, `Biyo-akustik akışta mikrofon izni verin, ekrandaki yönergeye göre ön taramayı kaydedin, isterseniz bir ses oturumu yapın ve son taramayı alın. Uygulama iki ses örneğini karşılaştırır; bu işlem hücreleri veya sağlık durumunu ölçmez.`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Bu Bölümü Dinle</span>
                </button>
              </div>

              <div className="p-4 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-slate-100">Nasıl Kullanılır?</h4>
                <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                  <li><strong>Mikrofon İzni:</strong> Tarayıcınızın mikrofon erişimine izin verin.</li>
                  <li><strong>Ön Tarama:</strong> Ekrandaki yönergeyi izleyerek kısa ses örneğini kaydedin; sessiz bir ortam tercih edin.</li>
                  <li><strong>İsteğe bağlı dinleme:</strong> İsterseniz ses içeriği seçip oturum başlatın; rahatsızlık hissederseniz durdurun.</li>
                  <li><strong>Son Tarama:</strong> Aynı yönergeyle ikinci örneği kaydedip uygulamanın karşılaştırma ekranını inceleyin. Sonuç tıbbi değerlendirme değildir.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 7: 6 KADİM ŞİFA EKOLÜ */}
          {activeSection === 'schools' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Ses ve içerik kütüphanesi ({TOTAL_HEALING_COUNT} içerik)
                  </h3>
                  <p className="text-xs text-slate-400">
                    İçerikler altı kültürel ve tematik kategori altında listelenir
                  </p>
                </div>

                <button
                  onClick={() => playSection(701, `Kütüphane altı tematik kategoriden oluşur: çakra ve Solfeggio, İslami içerikler, Sufi makamları, şamanik ritimler, elementler ve Kelt içerikleri. Bir kategori seçip öğelerin açıklama ve oynatma seçeneklerini inceleyebilirsiniz. Bu içerikler tıbbi tedavi değildir.`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span>Bu Bölümü Dinle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {HEALING_CATEGORIES.map((category) => (
                  <div key={category.key} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-300 text-xs">{category.title}</div>
                    <p className="text-xs text-slate-400">{category.subtitle}</p>
                    <div className="text-[10px] text-slate-500">{category.totalCount ?? 0} içerik</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: 10 SEKME RAPOR */}
          {activeSection === 'reports_comparison' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-emerald-400" />
                    10 Sekmeli Tarama Raporu ve Öncesi/Sonrası Görünümü
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tarama özetini, renk görsellerini ve rehberlik sekmelerini inceleyin; raporu PDF olarak indirebilirsiniz.
                  </p>
                </div>

                <button
                  onClick={() => playSection(801, `Tarama raporunda toplam on sekme vardır: İlim Kapı, Genel Bakış, Detaylı Renk Analizi, Duygu Analizi, dört Aurik Katman, Çakra Rehberi, Letaif Nurları, Esma ve frekans seçimi, Yaşam Koçu Matrisi ve 3D görünüm. İsterseniz PDF indirebilirsiniz. Görseller ve öneriler uygulama içi rehberlik içindir; klinik ölçüm değildir.`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Bu Bölümü Dinle</span>
                </button>
              </div>

              <div className="p-4 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-slate-100">Rapor sekmeleri</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {['İlim Kapı', 'Genel Bakış', 'Detaylı Renk Analizi', 'Duygu Analizi', '4 Aurik Katman', '7 Çakra Rehberi', 'Letaif Nurları', '99 Esma & Frekans Yükle', 'Yaşam Koçu Matrisi', '3D Canlı Aura & Letaif'].map((tab, index) => (
                    <div key={tab} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800"><strong>{index + 1}. {tab}</strong></div>
                  ))}
                </div>
                <p className="text-xs text-slate-400">Raporu PDF olarak indirebilirsiniz. Uygulama içi görselleştirmeler tıbbi teşhis veya ölçüm değildir.</p>
              </div>
            </div>
          )}

          {/* TAB 9: MOBİL & ACİL ARAÇLAR */}
          {activeSection === 'mobile_tools' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-amber-400" />
                    Mobil menü ve ses araçları
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mobil alt menüden ana bölümlere erişin; ses araçlarını rahatınıza göre kullanın
                  </p>
                </div>

                <button
                  onClick={() => playSection(901, `Mobil alt menüden Kamera, Şifa, Mandala, Harita ve Menü bölümlerine erişin. Menüdeki ses ve nefes araçlarını rahatlama amacıyla kullanabilirsiniz; bunlar acil servis veya tıbbi tedavi değildir.`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>Bu Bölümü Dinle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-amber-400 font-bold text-sm flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>Başparmak Alt Navigasyonu</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Alt menüde Kamera, Şifa, Mandala, Harita ve Menü kısayolları bulunur. Diğer ekranlara Menü üzerinden geçin.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-rose-400 font-bold text-sm flex items-center gap-1.5">
                    <LifeBuoy className="w-4 h-4" />
                    <span>🚨 SOS Rahatlama Aracı</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uygulamadaki kısa ses ve nefes rehberini açar. Acil sağlık hizmeti değildir; acil durumda yerel acil numarayı arayın.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-indigo-400 font-bold text-sm flex items-center gap-1.5">
                    <Moon className="w-4 h-4" />
                    <span>🌙 Uyku için ses araçları</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uygulamada sunulan sesleri dinleyebilir ve varsa oynatıcıdaki zamanlayıcıyı kullanabilirsiniz. Bu içerikler uyku bozukluklarını tedavi etmez.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: KUANTUM TEORİ */}
          {activeSection === 'theory' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-950/30 rounded-2xl border border-blue-900/40">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Kamera analizinin sınırları
                </h3>
                <button
                  type="button"
                  onClick={() => playSection(10, `Bu bölüm uygulamanın renk ve görselleri yorumlamak için kullandığı kavramsal yaklaşımı açıklar. Kamera görüntüsünden üretilen grafikler kuantum, aura, organ veya sağlık ölçümü değildir; bilimsel teşhis olarak yorumlanmamalıdır.`)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeSpeechStep === 10 && isSpeaking
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{activeSpeechStep === 10 && isSpeaking ? 'Durdur' : 'Bu Bölümü Seslendir'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bu bölümdeki kuantum, aura ve renk eşleştirmeleri uygulamanın görsel anlatım modelidir. Kamera görüntüsünden sağlık durumu, hücresel işlev veya enerji alanı ölçümü çıkarılamaz.
              </p>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="text-emerald-400 font-bold">Nasıl yorumlanmalı?</div>
                <p>1. Rapor, uygulamanın kamera girdisi ve görsel modelinden oluşturduğu içerikleri gösterir.</p>
                <p>2. Renk, aura, çakra ve benzeri görseller sembolik/rehberlik amaçlıdır; tıbbi ölçüm değildir.</p>
                <p>3. Sağlıkla ilgili kararlar için nitelikli sağlık uzmanına başvurun.</p>
              </div>
            </div>
          )}

          {/* TAB 11: İPUÇLARI */}
          {activeSection === 'tips' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-950/30 rounded-2xl border border-amber-900/40">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-400" />
                  Daha iyi kullanım için ipuçları
                </h3>
                <button
                  type="button"
                  onClick={() => playSection(11, `Daha tutarlı kullanım için yüzünüzü eşit aydınlatın, telefonu sabitleyin ve tarama boyunca kadrajda kalın. Mikrofon veya Bluetooth kullanırken tarayıcı izinlerini kontrol edin. Ses seviyesini rahat duyacağınız düzeyde tutun ve uygulamayı araç kullanırken kullanmayın.`)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeSpeechStep === 11 && isSpeaking
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{activeSpeechStep === 11 && isSpeaking ? 'Durdur' : 'Bu Bölümü Seslendir'}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-300 text-xs">☀️ Doğal ve Dengeli Işık</div>
                  <p className="text-xs text-slate-400">Karanlık veya aşırı parlak ortamlar yerine yüzünüzü eşit aydınlatan doğal gün ışığı tercih edin.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-teal-300 text-xs">📱 Telefonu sabitleyin</div>
                  <p className="text-xs text-slate-400">Yaklaşık 15 saniyelik tarama boyunca cihazı sabit tutup kadrajda kalın.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-300 text-xs">🎧 Rahat ses seviyesi</div>
                  <p className="text-xs text-slate-400">Sesleri düşük ve rahat bir düzeyde dinleyin; kulaklık kullanımı isteğe bağlıdır.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-purple-300 text-xs">🔒 İzinleri kontrol edin</div>
                  <p className="text-xs text-slate-400">Kamera, mikrofon veya Bluetooth çalışmıyorsa tarayıcı izinlerini ve cihaz desteğini kontrol edin.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: SSS */}
          {activeSection === 'faq' && (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-950/30 rounded-2xl border border-indigo-900/40">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  Sıkça Sorulan Sorular (SSS)
                </h3>
                <button
                  type="button"
                  onClick={() => playSection(12, `Sıkça sorulan sorular. Bu uygulama tıbbi teşhis veya tedavi sunmaz. Kamera ya da mikrofon açılmazsa tarayıcı izinlerini kontrol edin. Bluetooth bağlantısı uyumlu cihaz ve tarayıcı gerektirir; simülasyon değerleri örnekseldir. Tarama raporunda toplam on sekme vardır ve PDF indirilebilir.`)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeSpeechStep === 12 && isSpeaking
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{activeSpeechStep === 12 && isSpeaking ? 'Durdur' : 'Bu Bölümü Seslendir'}</span>
                </button>
              </div>
              
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 text-xs">Soru: AuraBio tıbbi bir teşhis cihazı mıdır?</div>
                <p className="text-xs text-slate-400">Cevap: Hayır. Tarama görselleri ve uygulama önerileri klinik ölçüm veya teşhis değildir; sağlık kararları için nitelikli bir sağlık uzmanına başvurun.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 text-xs">Soru: Kamera veya mikrofon açılmıyorsa ne yapmalıyım?</div>
                <p className="text-xs text-slate-400">Cevap: Tarayıcı ayarlarında bu site için kamera veya mikrofon iznini kontrol edin. Sayfayı yeniden yüklemek veya izinleri tekrar vermek gerekebilir.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 text-xs">Soru: Akıllı saat veya Bluetooth bağlantısı zorunlu mu?</div>
                <p className="text-xs text-slate-400">Cevap: Hayır. Bluetooth köprüsü isteğe bağlıdır. Bağlantı için Web Bluetooth destekleyen tarayıcı ve uyumlu cihaz gerekir; simülasyon açıksa değerler gerçek sensör ölçümü değildir.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 text-xs">Soru: Raporu nasıl kaydedebilirim?</div>
                <p className="text-xs text-slate-400">Cevap: Tarama raporunda PDF İndir seçeneğini kullanın. Dosyayı cihazınıza indirdikten sonra kendi dosyalarınız gibi saklayabilirsiniz.</p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Bilgilendirme amaçlıdır; tıbbi teşhis veya tedavi yerine geçmez.</span>
          </div>

          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Anladım, Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
