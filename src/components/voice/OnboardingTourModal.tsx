import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  Receipt,
  Users,
  Zap,
} from 'lucide-react';
import { SpeechEngine } from '../../services/voiceAssistant';
import avatarCpa from '../../assets/images/avatar_mali_musavir_1792512085316.jpg';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const tourSteps = [
    {
      title: 'Hoş Geldiniz! Ben Sizin Finans Akıl Hocanızım',
      subtitle: 'Muhasebe jargonu olmadan, her şeyi 2 dakikada öğrenin',
      speechText:
        'Merhaba! Ben sizin kişisel finans asistanınızım. Sizi hiç yormadan, tek bir karmaşık muhasebe terimi bile kullanmadan sistemimizi 2 dakikada anlatalım. Hazır mısınız?',
      description:
        'Bu sistemde KDV, stopaj veya yevmiye kodlarıyla boğuşmanıza gerek yok. Sistemimiz arkada çalışan akıllı motoruyla tüm vergi ve faturaları otomatik yönetir, size sadece işletmenizi büyütmek kalır.',
      targetTab: 'overview',
      highlightBadge: 'Giriş',
    },
    {
      title: '1. Adım: Tüm Satışlarınız ve Otomatik e-Faturalar',
      subtitle: 'Yurt içi ve $3x$ Dolar satışlarınız saniyeler içinde devlete iletilir',
      speechText:
        'İlk olarak satışlarınızı nereden takip edeceğinizi göstereyim. Hem Türkiye içi hem de yurt dışına yaptığınız tüm satışların e-faturaları burada otomatik oluşturulur.',
      description:
        'Kredi kartıyla ödeme alındığı anda müşterinizin faturası Gelir İdaresi Başkanlığı onaylı olarak saniyeler içinde kesilir ve müşterinin e-postasına PDF olarak iletilir. Yurt dışı satışlarda KDV sıfır olarak uygulanır.',
      targetTab: 'invoices',
      highlightBadge: 'e-Faturalar',
    },
    {
      title: '2. Adım: Devlete Ödenecek Vergi Yükünüz',
      subtitle: 'Sürpriz borç yok! Ay sonu ödenecek net tutarı anlık görün',
      speechText:
        'İkinci adımda en çok merak edilen konuya bakalım: Devlete bu ay ne kadar vergi ödeyeceğiz? Sistemimiz ay sonunu beklemeden tahmini KDV ve stopaj borcunuzu hesaplar.',
      description:
        'Müşterilerden emanet aldığınız KDV ile yaptığınız şirket masrafları karşılaştırılır. Gelecek ayın 26\'sına kadar bankada ne kadar para tutmanız gerektiğini net bir şekilde gösteriyoruz.',
      targetTab: 'taxReturns',
      highlightBadge: 'Vergi Durumu',
    },
    {
      title: '3. Adım: Temsilci Komisyonları & Gider Pusulası',
      subtitle: 'Şirketi olmayan bayilere yasal kesintili net ödeme',
      speechText:
        'Üçüncü adımda temsilcilerinize yapacağınız ödemeler var. Şirketi olmayan bayiler için yasal devlet kesintisini otomatik düşüp net ödeme makbuzunu hazırlıyoruz.',
      description:
        'Bireysel kişilere ödeme yaparken ceza yememek için devletin istediği yüzde 20 vergiyi otomatik kesiyor, bayiye net tutarı ödüyor ve resmi Gider Pusulasını hazırlıyoruz. Şirket olan bayilerden ise fatura istiyoruz.',
      targetTab: 'commissions',
      highlightBadge: 'Bayi Hakedişleri',
    },
    {
      title: '4. Adım: Canlı Satış ve Fatura Simülatörü',
      subtitle: 'Tek tuşla veya sesli komutla fatura kesme gücü',
      speechText:
        'Son olarak en pratik bölüme geldik. İstediğiniz an tek bir tıkla veya bana sesli olarak Mehmet Yılmaza fatura kes diyerek satışı tamamlayabilirsiniz.',
      description:
        'Paketinizi seçin, 3D Secure onayına basın; gerisini akıllı motorumuz halletsin: Fatura kesilir, TCMB kuru işlenir, bayinin primi cüzdanına yansıtılır.',
      targetTab: 'simulator',
      highlightBadge: 'Satış Yap',
    },
  ];

  const currentData = tourSteps[currentStep];

  useEffect(() => {
    if (isOpen && currentData) {
      onNavigateTab(currentData.targetTab);
      if (!isAudioMuted) {
        SpeechEngine.speak(currentData.speechText);
      }
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    SpeechEngine.stopSpeaking();
    onClose();
  };

  const handleToggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    SpeechEngine.setMuted(nextMuted);
  };

  const handleReplayAudio = () => {
    SpeechEngine.speak(currentData.speechText);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Üst Asistan Tanıtım Bandı */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={avatarCpa}
              alt="Mali Akıl Hocası"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border-2 border-slate-700 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Sesli Finans Rehberi</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">
                  {currentData.highlightBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Adım {currentStep + 1} / {tourSteps.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReplayAudio}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Sesli Anlatımı Tekrar Dinle"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={handleToggleMute}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isAudioMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleComplete}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* İlerleme Çubuğu */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          ></div>
        </div>

        {/* Gövde */}
        <div className="p-6 space-y-4 text-slate-900">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {currentData.title}
            </h3>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5">
              {currentData.subtitle}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Akıl Hocanızın Açıklaması:</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed italic">
              "{currentData.speechText}"
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {currentData.description}
          </p>
        </div>

        {/* Footer Navigasyon Kontrolleri */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleComplete}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Turu Geç
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Önceki</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
            >
              <span>{currentStep === tourSteps.length - 1 ? 'Turu Tamamla' : 'Sonraki Adım'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
