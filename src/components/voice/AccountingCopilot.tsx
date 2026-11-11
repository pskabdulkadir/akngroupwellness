import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  HelpCircle,
  ArrowRight,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  History,
  Languages,
  Bell,
  Sun,
  FileCheck,
  Clock,
  RotateCcw,
} from 'lucide-react';
import {
  SpeechEngine,
  matchVoiceIntent,
  JARGON_DICTIONARY,
  SpeechAction,
  VoiceSuggestion,
  TAB_TUTORIAL_EXPLANATIONS,
} from '../../services/voiceAssistant';
import {
  Currency,
  SupportedLanguage,
  VoiceCommandLog,
  PendingVoiceAction,
  ProactiveAlert,
  CompanyProfile,
  COMPANY_PROFILE,
} from '../../types/accounting';
import avatarCpa from '../../assets/images/avatar_mali_musavir_1792512085316.jpg';

interface AccountingCopilotProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
  financialSnapshot: any;
  onStartTour: () => void;
  voiceLogs: VoiceCommandLog[];
  onAddVoiceLog: (log: VoiceCommandLog) => void;
  proactiveAlerts: ProactiveAlert[];
  companyProfile?: CompanyProfile;
  onDismissAlert?: (id: string) => void;
  onExecuteInvoiceAction?: (targetName: string, amount: number, currency: Currency) => void;
  onExecuteCommissionAction?: (targetName: string, amount: number) => void;
  onRunAutoPilot?: () => void;
}

export const AccountingCopilot: React.FC<AccountingCopilotProps> = ({
  currentTab,
  onNavigateTab,
  financialSnapshot,
  onStartTour,
  voiceLogs,
  onAddVoiceLog,
  proactiveAlerts,
  companyProfile,
  onDismissAlert,
  onExecuteInvoiceAction,
  onExecuteCommissionAction,
  onRunAutoPilot,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('tr');
  const [textInput, setTextInput] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'COPILOT' | 'DICTIONARY' | 'AUDIT'>('COPILOT');
  const [isLoading, setIsLoading] = useState(false);

  // Çift Onay & Güvenlik Kilidi State'i
  const [pendingGuardAction, setPendingGuardAction] = useState<PendingVoiceAction | null>(null);

  // Aktif Akıllı Öneriler (Fallback durumunda sunulan 3 seçenek)
  const [activeSuggestions, setActiveSuggestions] = useState<VoiceSuggestion[]>([]);

  // Proaktif Uyarı Bildirimi (Açılınca ilk gösterilen veya kapatılabilen)
  const [activeDailyAlert, setActiveDailyAlert] = useState<ProactiveAlert | null>(
    proactiveAlerts.find((a) => !a.dismissed) || null
  );

  const [conversation, setConversation] = useState<
    Array<{
      id: string;
      sender: 'user' | 'assistant';
      text: string;
      actionLabel?: string;
      actionTab?: string;
      isGuardCard?: boolean;
      pendingAction?: PendingVoiceAction;
      suggestions?: VoiceSuggestion[];
    }>
  >([
    {
      id: 'init-01',
      sender: 'assistant',
      text: 'Merhaba! Ben sizin Sesli Finans Akıl Hocanızım. Muhasebe ve vergi terimleriyle kafanızı hiç yormadan, her şeyi günlük dille konuşarak yönetebiliriz. Çift onaylı güvenlik kilidimiz sayesinde hiçbir hatalı işlem yapılmaz. Bana mikrofonla veya yazarak dilediğinizi sorabilirsiniz.',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading, pendingGuardAction, activeSuggestions]);

  // Dil Değişimi
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    SpeechEngine.setLanguage(lang);
    const greeting =
      lang === 'en'
        ? 'Language switched to English. How may I assist your financial accounting today?'
        : lang === 'de'
        ? 'Sprache auf Deutsch umgestellt. Wie kann ich Sie bei Ihrer Buchhaltung unterstützen?'
        : 'Dil Türkçe olarak ayarlandı. Size nasıl yardımcı olabilirim?';

    setConversation((prev) => [
      ...prev,
      {
        id: `lang-${Date.now()}`,
        sender: 'assistant',
        text: greeting,
      },
    ]);
    SpeechEngine.speak(greeting, undefined, lang);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    SpeechEngine.setMuted(nextMuted);
  };

  const handleToggleListening = () => {
    if (isListening) {
      SpeechEngine.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      SpeechEngine.startListening(
        (recognizedText) => {
          setIsListening(false);
          handleProcessVoiceInput(recognizedText);
        },
        (err) => {
          setIsListening(false);
          console.warn('Speech recognition warning:', err);
        },
        () => {
          setIsListening(false);
        },
        currentLanguage
      );
    }
  };

  // Günlük Özeti Sesli Dinle
  const handlePlayDailyBriefing = () => {
    const alert = proactiveAlerts.find((a) => a.type === 'DAILY_BRIEF') || proactiveAlerts[0];
    if (alert) {
      setConversation((prev) => [
        ...prev,
        {
          id: `brief-${Date.now()}`,
          sender: 'assistant',
          text: `☀️ ${alert.title}:\n${alert.message}`,
          actionLabel: alert.actionLabel,
          actionTab: alert.actionTab,
        },
      ]);
      SpeechEngine.speak(alert.speechText, undefined, currentLanguage);
    }
  };

  // Sesli veya Metin Girdisini İşleme Motoru
  const handleProcessVoiceInput = async (userInput: string) => {
    if (!userInput.trim()) return;

    // Kullanıcı mesajını ekle
    setConversation((prev) => [
      ...prev,
      { id: `usr-${Date.now()}`, sender: 'user', text: userInput },
    ]);
    setIsLoading(true);
    setActiveSuggestions([]);

    // 1. Kural Motoru ve Güvenlik Kilidi Denetimi
    const actionResult: SpeechAction = matchVoiceIntent(
      userInput,
      financialSnapshot,
      pendingGuardAction,
      currentLanguage
    );

    // Senaryo A: Çift Onay Alındı (CONFIRM_PENDING)
    if (actionResult.type === 'CONFIRM_PENDING' && actionResult.pendingAction) {
      const act = actionResult.pendingAction;
      setPendingGuardAction(null);
      setIsLoading(false);

      // İşlemi Gerçekleştir (Fatura / Komisyon)
      let docRef = `VRS2026${Math.floor(100000 + Math.random() * 900000)}`;
      if (act.type === 'ISSUE_INVOICE' && onExecuteInvoiceAction) {
        onExecuteInvoiceAction(act.details.targetName, act.details.amount, act.details.currency);
      } else if (act.type === 'APPROVE_COMMISSION' && onExecuteCommissionAction) {
        onExecuteCommissionAction(act.details.targetName, act.details.amount);
      }

      // Voice Audit Trail Log Kaydı Ekle
      const newLog: VoiceCommandLog = {
        id: `vlog-${Date.now()}`,
        timestamp: new Date().toLocaleString('tr-TR'),
        user: 'Ece Yılmaz (Mali İşler Direktörü)',
        spokenText: userInput,
        parsedAction: act.type,
        targetEntity: act.details.targetName,
        amount: act.details.amount,
        currency: act.details.currency,
        status: 'EXECUTED',
        responseSpoken: actionResult.spokenResponse,
        auditDetails: `Sesli çift onay tamamlandı. ${act.summary}`,
        documentRef: docRef,
      };
      onAddVoiceLog(newLog);

      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `✅ ${actionResult.spokenResponse}`,
          actionLabel: act.type === 'ISSUE_INVOICE' ? 'Faturalara Git' : 'Komisyonlara Git',
          actionTab: act.type === 'ISSUE_INVOICE' ? 'invoices' : 'commissions',
        },
      ]);

      SpeechEngine.speak(actionResult.spokenResponse, undefined, currentLanguage);
      return;
    }

    // Senaryo B: Çift Onay Reddedildi (REJECT_PENDING)
    if (actionResult.type === 'REJECT_PENDING' && actionResult.pendingAction) {
      const act = actionResult.pendingAction;
      setPendingGuardAction(null);
      setIsLoading(false);

      const cancelLog: VoiceCommandLog = {
        id: `vlog-${Date.now()}`,
        timestamp: new Date().toLocaleString('tr-TR'),
        user: 'Ece Yılmaz (Mali İşler Direktörü)',
        spokenText: userInput,
        parsedAction: act.type,
        targetEntity: act.details.targetName,
        amount: act.details.amount,
        currency: act.details.currency,
        status: 'REJECTED',
        responseSpoken: actionResult.spokenResponse,
        auditDetails: `Kullanıcı güvenlik onayını reddetti veya iptal etti.`,
      };
      onAddVoiceLog(cancelLog);

      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `🛡️ ${actionResult.spokenResponse}`,
        },
      ]);

      SpeechEngine.speak(actionResult.spokenResponse, undefined, currentLanguage);
      return;
    }

    // Senaryo C: Kritik İşlem Algılandı -> Çift Onay Kartı Aç (REQUIRES_CONFIRMATION)
    if (actionResult.type === 'REQUIRES_CONFIRMATION' && actionResult.pendingAction) {
      setIsLoading(false);
      setPendingGuardAction(actionResult.pendingAction);

      const guardLog: VoiceCommandLog = {
        id: `vlog-${Date.now()}`,
        timestamp: new Date().toLocaleString('tr-TR'),
        user: 'Ece Yılmaz (Mali İşler Direktörü)',
        spokenText: userInput,
        parsedAction: actionResult.pendingAction.type,
        targetEntity: actionResult.pendingAction.details.targetName,
        amount: actionResult.pendingAction.details.amount,
        currency: actionResult.pendingAction.details.currency,
        status: 'PENDING_CONFIRMATION',
        responseSpoken: actionResult.spokenResponse,
        auditDetails: 'Çift onay bekleniyor.',
      };
      onAddVoiceLog(guardLog);

      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: actionResult.spokenResponse,
          isGuardCard: true,
          pendingAction: actionResult.pendingAction,
        },
      ]);

      SpeechEngine.speak(actionResult.spokenResponse, undefined, currentLanguage);
      return;
    }

    // Senaryo D: Akıllı Niyet Fallback (Anlaşılmadı / Gürültü Senaryosu)
    if (actionResult.type === 'FALLBACK_WITH_SUGGESTIONS') {
      setIsLoading(false);
      setActiveSuggestions(actionResult.suggestions || []);

      const fallbackLog: VoiceCommandLog = {
        id: `vlog-${Date.now()}`,
        timestamp: new Date().toLocaleString('tr-TR'),
        user: 'Ece Yılmaz (Mali İşler Direktörü)',
        spokenText: userInput,
        parsedAction: 'UNKNOWN_FALLBACK',
        status: 'FALLBACK',
        responseSpoken: actionResult.spokenResponse,
        auditDetails: 'Anlaşılmayan ses girdisi. Akıllı alternatif öneriler sunuldu.',
      };
      onAddVoiceLog(fallbackLog);

      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: actionResult.spokenResponse,
          suggestions: actionResult.suggestions,
        },
      ]);

      SpeechEngine.speak(actionResult.spokenResponse, undefined, currentLanguage);
      return;
    }

    // Senaryo E: Rehber Tur
    if (actionResult.type === 'START_TOUR') {
      setIsLoading(false);
      onStartTour();
      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: actionResult.spokenResponse,
        },
      ]);
      SpeechEngine.speak(actionResult.spokenResponse, undefined, currentLanguage);
      return;
    }

    // Senaryo O: Otonom Otopilot Tetiklendi (RUN_AUTOPILOT)
    if (actionResult.type === 'RUN_AUTOPILOT') {
      setIsLoading(false);
      const autoLog: VoiceCommandLog = {
        id: `vlog-${Date.now()}`,
        timestamp: new Date().toLocaleString('tr-TR'),
        user: 'Ece Yılmaz (Mali İşler Direktörü & AI CFO)',
        spokenText: userInput,
        parsedAction: 'RUN_AUTOPILOT',
        status: 'EXECUTED',
        responseSpoken: actionResult.spokenResponse,
        auditDetails: 'Otopilot sesli komutla başlatıldı.',
      };
      onAddVoiceLog(autoLog);

      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `⚡ ${actionResult.spokenResponse}`,
          actionLabel: 'Otopilotu İzle',
        },
      ]);
      SpeechEngine.speak(actionResult.spokenResponse, undefined, currentLanguage);
      if (onRunAutoPilot) {
        onRunAutoPilot();
      }
      return;
    }

    // Senaryo F: Standart Bilgi / Sayfa Yönlendirme (NAVIGATE)
    if (actionResult.targetTab) {
      setIsLoading(false);
      onNavigateTab(actionResult.targetTab);

      const navLog: VoiceCommandLog = {
        id: `vlog-${Date.now()}`,
        timestamp: new Date().toLocaleString('tr-TR'),
        user: 'Ece Yılmaz (Mali İşler Direktörü)',
        spokenText: userInput,
        parsedAction: actionResult.auditActionName || 'QUERY_INFO',
        status: 'QUERY_SUCCESS',
        responseSpoken: actionResult.spokenResponse,
        auditDetails: `${actionResult.targetTab} ekranına geçiş yapıldı.`,
      };
      onAddVoiceLog(navLog);

      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: actionResult.spokenResponse,
          actionLabel: 'İlgili Sayfayı Aç',
          actionTab: actionResult.targetTab,
        },
      ]);

      SpeechEngine.speak(actionResult.spokenResponse, undefined, currentLanguage);
      return;
    }

    // Backend Gemini 3.8 Flash Fallback API
    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: userInput,
          currentTab,
          financialSnapshot,
          lang: currentLanguage,
        }),
      });

      const data = await response.json();
      const spokenText =
        data.spokenText ||
        (currentLanguage === 'en'
          ? 'Understood, preparing the relevant accounting summary.'
          : 'İşleminizi anladım, ilgili sayfayı sizin için hazırlıyorum.');

      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: spokenText,
          actionLabel: data.targetTab ? 'Sayfayı Aç' : undefined,
          actionTab: data.targetTab,
        },
      ]);

      SpeechEngine.speak(spokenText, undefined, currentLanguage);

      if (data.targetTab) {
        onNavigateTab(data.targetTab);
      }
    } catch (err) {
      const fallback =
        currentLanguage === 'en'
          ? 'Network timeout occurred. Please repeat your query.'
          : 'Bağlantı sırasında bir gecikme oldu. Dilerseniz sorunuzu tekrar iletin.';
      setConversation((prev) => [
        ...prev,
        { id: `asst-${Date.now()}`, sender: 'assistant', text: fallback },
      ]);
      SpeechEngine.speak(fallback, undefined, currentLanguage);
    } finally {
      setIsLoading(false);
    }
  };

  // Eğitimci Sesli Asistan: Aktif Ekranın Ne İşe Yaradığını Anlatır
  const handleExplainCurrentTab = () => {
    const tutor = TAB_TUTORIAL_EXPLANATIONS[currentTab] || {
      title: 'AKN Finans Portalı',
      speech: `Şu an ${COMPANY_PROFILE.legalName} yönetim ekranındasınız. Dilediğiniz işlemi sesli komutla gerçekleştirebilirsiniz.`,
    };

    setConversation((prev) => [
      ...prev,
      {
        id: `tutor-${Date.now()}`,
        sender: 'assistant',
        text: `🎓 ${tutor.title} Rehberliği:\n${tutor.speech}`,
      },
    ]);
    SpeechEngine.speak(tutor.speech, undefined, currentLanguage);
  };

  // Örnek Sesli Komut Kılavuzu (Voice Prompt Hints)
  const quickPromptsByLang: Record<SupportedLanguage, string[]> = {
    tr: [
      '🏛️ Hangi vergi dairesine ne kadar ödeyeceğiz?',
      '🏢 Şirket adresini değiştir',
      '🔑 Vergi dairesi API anahtarını güncelle',
      '📄 KDV İadesi dosyasını hazırla',
      '⚡ Otopilotu çalıştır',
      '📊 CFO günlük raporunu özetle',
      'Bu ay ne kadar vergi ödeyeceğim?',
      "Mehmet Yılmaz'a 1.000 TL fatura kes",
      'KDV iadesi başvurusunu nasıl yapmalıyım?',
      'Avrupa satışlarının faturası nasıl kesiliyor?',
      'Stopaj ve gider pusulası nedir?',
      'Son 5 satışı listele',
      'Yurtdışı ciromuz ne kadar?',
    ],
    en: [
      '🏛️ How much tax due to which tax office?',
      '🏢 Change company address',
      '🔑 Update tax office API key',
      '📄 Prepare VAT refund file',
      '⚡ Run Auto-Pilot',
      '📊 Summarize CFO daily report',
      'How much tax will I pay this month?',
      'Issue 1,000 TL invoice to Mehmet Yılmaz',
      'List latest 5 invoices',
    ],
    de: [
      '🏛️ Welche Steuerbehörde & Betrag?',
      '🏢 Firmenadresse ändern',
      '🔑 Finanzamt API-Schlüssel aktualisieren',
      '⚡ Auto-Pilot starten',
      '📊 CFO Tagesbericht zusammenfassen',
      'Wie viel Steuern muss ich diesen Monat zahlen?',
      'Erstelle eine Rechnung über 1.000 TL für Mehmet Yılmaz',
      'Aktuelle Rechnungen anzeigen',
    ],
  };

  const isVknMissing = Boolean(companyProfile && (!companyProfile.vkn || companyProfile.vkn.length !== 10));
  const isApiMissing = Boolean(companyProfile && !companyProfile.gibApiKey);
  const hasProfileDeficiency = isVknMissing || isApiMissing;

  const quickPrompts = quickPromptsByLang[currentLanguage] || quickPromptsByLang.tr;

  // Çift Onay Kartından Elle Tıklama ile Onaylama / Reddetme
  const handleConfirmGuardAction = () => {
    handleProcessVoiceInput(currentLanguage === 'en' ? 'Yes, I confirm' : 'Evet, onaylıyorum');
  };

  const handleCancelGuardAction = () => {
    handleProcessVoiceInput(currentLanguage === 'en' ? 'No, cancel' : 'Hayır, iptal');
  };

  const criticalDeadlineAlert = proactiveAlerts.find((a) => a.severity === 'critical');

  return (
    <>
      {/* Yüzen Asistan Butonu (Floating Mic Widget) */}
      <div className="fixed bottom-6 right-6 z-40 no-print flex flex-col items-end gap-2">
        {/* Proaktif Uyarı Rozeti / Balonu */}
        {!isOpen && criticalDeadlineAlert && (
          <div
            onClick={() => {
              setIsOpen(true);
              SpeechEngine.speak(criticalDeadlineAlert.speechText, undefined, currentLanguage);
            }}
            className="cursor-pointer bg-red-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-xl border border-red-500 flex items-center gap-2 animate-pulse hover:bg-red-700 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-white" />
            <span>Kritik Vergi Uyarısı (Tıklayın)</span>
          </div>
        )}

        {!isOpen && !criticalDeadlineAlert && (
          <div
            onClick={() => {
              setIsOpen(true);
              handlePlayDailyBriefing();
            }}
            className="cursor-pointer bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-xl border border-slate-700 flex items-center gap-2 hover:bg-slate-800 transition-colors group"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span>Günün Mali Özeti (Sesli Dinle)</span>
          </div>
        )}

        <button
          onClick={() => {
            const nextOpen = !isOpen;
            setIsOpen(nextOpen);
            if (nextOpen && !isMuted) {
              const welcome =
                currentLanguage === 'en'
                  ? 'Hello! How may I assist your accounting today?'
                  : 'Merhaba! Sesli asistanınız hazır. Size nasıl yardımcı olabilirim?';
              SpeechEngine.speak(welcome, undefined, currentLanguage);
            }
          }}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 ${
            isOpen
              ? 'bg-slate-800 text-white'
              : 'bg-slate-900 text-white ring-4 ring-slate-900/20'
          }`}
          title="Sesli Finans Asistanını Aç"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
            </div>
          )}
        </button>
      </div>

      {/* Genişletilmiş Asistan Kartı (Voice Drawer Modal) */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[420px] max-w-[calc(100vw-2rem)] h-[620px] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden no-print">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={avatarCpa}
                alt="Finans Akıl Hocası"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-slate-700"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold">Sesli Akıl Hocası</h3>
                  <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Çift Onay Korumalı
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Jargonsuz Canlı Rehber</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Çoklu Dil Seçici (TR / EN / DE) */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[10px] font-semibold text-slate-300">
                <button
                  onClick={() => handleLanguageChange('tr')}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    currentLanguage === 'tr' ? 'bg-slate-700 text-white font-bold' : 'hover:text-white'
                  }`}
                  title="Türkçe"
                >
                  TR
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    currentLanguage === 'en' ? 'bg-slate-700 text-white font-bold' : 'hover:text-white'
                  }`}
                  title="English"
                >
                  EN
                </button>
                <button
                  onClick={() => handleLanguageChange('de')}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    currentLanguage === 'de' ? 'bg-slate-700 text-white font-bold' : 'hover:text-white'
                  }`}
                  title="Deutsch"
                >
                  DE
                </button>
              </div>

              {/* Mute Toggle */}
              <button
                onClick={handleToggleMute}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs font-medium px-3 py-1.5 gap-1.5">
            <button
              onClick={() => setActiveSubTab('COPILOT')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'COPILOT'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Sesli Asistan</span>
            </button>
            <button
              onClick={() => setActiveSubTab('DICTIONARY')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'DICTIONARY'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Bana Anlat</span>
            </button>
            <button
              onClick={() => setActiveSubTab('AUDIT')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'AUDIT'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Denetim Kaydı</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded-full font-mono">
                {voiceLogs.length}
              </span>
            </button>
          </div>

          {/* Tab 1: Sesli Asistan Konuşma Akışı */}
          {activeSubTab === 'COPILOT' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Günlük Özet Proaktif Kartı */}
              {activeDailyAlert && (
                <div className="p-2.5 bg-amber-50/90 border-b border-amber-200 flex items-start justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <Sun className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950 text-[11px]">{activeDailyAlert.title}</p>
                      <p className="text-[11px] text-amber-800 leading-tight">{activeDailyAlert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handlePlayDailyBriefing}
                      className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-950 text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                      title="Sesli Oku"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Dinle</span>
                    </button>
                    <button
                      onClick={() => setActiveDailyAlert(null)}
                      className="text-amber-700 hover:text-amber-950 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* İhtiyaç / Eksiklik Analizi Proaktif Uyarısı */}
              {hasProfileDeficiency && (
                <div className="p-2.5 bg-rose-50 border-b border-rose-200 flex items-start justify-between gap-2 text-xs text-rose-950 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[11px] text-rose-950">Eksik Profil / Vergi Bilgisi Uyarısı</p>
                      <p className="text-[11px] text-rose-800 leading-tight">
                        {isVknMissing
                          ? 'Dikkat! Vergi Dairesi VKN bilginiz eksik veya geçersiz.'
                          : 'GİB e-Fatura API anahtarınız henüz girilmemiş.'}{' '}
                        e-Fatura kesebilmek için lütfen profil bilgilerinizi güncelleyin.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('companySettings')}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded shrink-0 transition-colors shadow-2xs"
                  >
                    Güncelle
                  </button>
                </div>
              )}

              {/* Mesaj Listesi */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
                {conversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-xl p-3 leading-relaxed shadow-2xs ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white rounded-br-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Standart Sayfa Yönlendirme Butonu */}
                      {msg.actionLabel && msg.actionTab && (
                        <button
                          onClick={() => onNavigateTab(msg.actionTab!)}
                          className="mt-2 flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded text-[11px] font-semibold transition-colors"
                        >
                          <span>{msg.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {/* Çift Onay Güvenlik Kartı (Voice Transaction Guard Card) */}
                      {msg.isGuardCard && msg.pendingAction && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between text-amber-900">
                            <span className="flex items-center gap-1.5 font-bold text-xs">
                              <ShieldAlert className="w-4 h-4 text-amber-600" />
                              {msg.pendingAction.title}
                            </span>
                            <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                              Onay Bekliyor
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-[11px] space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Alıcı:</span>
                              <span className="font-semibold text-slate-800">
                                {msg.pendingAction.details.targetName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">İşlem Tutarı:</span>
                              <span className="font-bold text-slate-900">
                                {msg.pendingAction.details.amount.toLocaleString('tr-TR')}{' '}
                                {msg.pendingAction.details.currency}
                              </span>
                            </div>
                            {msg.pendingAction.details.vatAmountTRY !== undefined && (
                              <div className="flex justify-between text-slate-600">
                                <span>Ayrıştırılan KDV (%20):</span>
                                <span>{msg.pendingAction.details.vatAmountTRY.toLocaleString('tr-TR')} ₺</span>
                              </div>
                            )}
                            {msg.pendingAction.details.taxDeductionTRY !== undefined && (
                              <div className="flex justify-between text-slate-600">
                                <span>Yasal Stopaj Kesintisi:</span>
                                <span>
                                  {msg.pendingAction.details.taxDeductionTRY.toLocaleString('tr-TR')} ₺
                                </span>
                              </div>
                            )}
                          </div>

                          <p className="text-[10px] text-amber-800 italic">
                            🎙️ Sesli olarak <strong>"Evet"</strong> veya <strong>"Onaylıyorum"</strong>{' '}
                            diyebilir veya aşağıdaki butonları kullanabilirsiniz:
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={handleConfirmGuardAction}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Evet, Onayla</span>
                            </button>
                            <button
                              onClick={handleCancelGuardAction}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Hayır, İptal</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Akıllı Niyet Fallback Butonları */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Önerilen Alternatifler:
                          </p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {msg.suggestions.map((sug) => (
                              <button
                                key={sug.id}
                                onClick={() => {
                                  handleProcessVoiceInput(sug.commandText);
                                }}
                                className="flex items-center justify-between text-left px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
                              >
                                <span>{sug.label}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs p-2">
                    <span className="w-2 h-2 rounded-full bg-slate-600 animate-ping"></span>
                    <span>Akıl hocanız düşünüyor...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Hızlı Örnek Komut Kartları (Voice Prompt Hints & Tutor) */}
              <div className="p-2 border-t border-slate-200 bg-white flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <button
                  onClick={handleExplainCurrentTab}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-full whitespace-nowrap transition-colors border border-amber-300 flex items-center gap-1 shrink-0 shadow-2xs"
                  title="Bu ekranın ne işe yaradığını dinle"
                >
                  <HelpCircle className="w-3 h-3 text-amber-700" />
                  <span>🎓 Bu Ekranı Anlat</span>
                </button>
                <span className="text-[10px] text-slate-400 font-bold shrink-0 px-1">Örnek:</span>
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (q.includes('Tur') || q.includes('tour')) {
                        onStartTour();
                      } else {
                        handleProcessVoiceInput(q);
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full whitespace-nowrap transition-colors border border-slate-200/70"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Dinleme & Metin Giriş Çubuğu */}
              <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                  title={isListening ? 'Dinlemeyi Durdur' : 'Konuşmak için Basın'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleProcessVoiceInput(textInput);
                      setTextInput('');
                    }
                  }}
                  placeholder={
                    isListening
                      ? currentLanguage === 'en'
                        ? 'Listening to your voice...'
                        : 'Sizi dinliyorum, konuşun...'
                      : currentLanguage === 'en'
                      ? 'Ask anything or issue a command...'
                      : 'Aklınıza takılanı sorun veya komut verin...'
                  }
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />

                <button
                  type="button"
                  onClick={() => {
                    handleProcessVoiceInput(textInput);
                    setTextInput('');
                  }}
                  disabled={!textInput.trim() || isLoading}
                  className="p-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: BANA ANLAT SÖZLÜĞÜ (Terminoloji Maskeleme) */}
          {activeSubTab === 'DICTIONARY' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] leading-relaxed">
                <strong>💡 Jargonsuz Finans Kuralı:</strong> Bu sistemde karmaşık muhasebe kodları yerine
                tamamen günlük hayatta kullanılan anlaşılır terimler geçerlidir.
              </div>

              <div className="space-y-2">
                {Object.entries(JARGON_DICTIONARY).map(([jargon, plain], idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="font-mono text-[10px] text-slate-400 block line-through">
                      {jargon}
                    </span>
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="text-emerald-600">➜</span> {plain}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: SESLİ KOMUT DENETİM KAYDI (Voice Audit Trail) */}
          {activeSubTab === 'AUDIT' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-[11px] leading-relaxed flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  <strong>Sesli Komut Denetim Kaydı:</strong> Çift onay mekanizmasıyla icra edilen veya
                  reddedilen tüm sesli komutlar resmi audit defterine işlenir.
                </span>
              </div>

              <div className="space-y-2.5">
                {voiceLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">{log.timestamp}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                          log.status === 'EXECUTED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : log.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : log.status === 'PENDING_CONFIRMATION'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.status === 'EXECUTED'
                          ? '✓ ONAYLANDI & İCRA EDİLDİ'
                          : log.status === 'REJECTED'
                          ? '✕ GÜVENLİK İPTALİ'
                          : log.status === 'PENDING_CONFIRMATION'
                          ? '⏳ ONAY BEKLENİYOR'
                          : 'BİLGİ SORGUSU'}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-900 text-xs">"{log.spokenText}"</p>

                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Komutu Veren:</span>
                        <span className="font-medium text-slate-700">{log.user}</span>
                      </div>
                      {log.targetEntity && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">İlgili Taraf:</span>
                          <span className="font-semibold text-slate-800">{log.targetEntity}</span>
                        </div>
                      )}
                      {log.amount && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tutar:</span>
                          <span className="font-bold text-slate-900">
                            {log.amount.toLocaleString('tr-TR')} {log.currency || 'TRY'}
                          </span>
                        </div>
                      )}
                      {log.documentRef && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Belge / Fatura Ref:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {log.documentRef}
                          </span>
                        </div>
                      )}
                    </div>

                    {log.auditDetails && (
                      <p className="text-[10px] text-slate-500 italic pt-0.5">
                        Not: {log.auditDetails}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
