/**
 * AuraBio Voice Assistant Engine - Bidirectional Speech Synthesis & Recognition
 * Provides real-time Turkish voice command recognition (STT), expressive voice guidance (TTS),
 * mobile/iOS/Android/Tablet audio unlocking, chunked sequential playback, and automatic page narration.
 */

import { ScanResult } from '../types';
import { Language, getLanguage as getI18nLanguage } from './i18n';

const STORAGE_VOICE_MUTED_KEY = 'aurabio_voice_assistant_muted_v1';
const STORAGE_VOICE_RATE_KEY = 'aurabio_voice_assistant_rate_v1';
const STORAGE_VOICE_VOLUME_KEY = 'aurabio_voice_assistant_vol_v1';
const STORAGE_VOICE_LISTENING_KEY = 'aurabio_voice_assistant_listening_v1';
const STORAGE_AUTO_NARRATE_KEY = 'aurabio_voice_auto_narrate_v1';

export type VoiceCommandType =
  | 'START_SCAN'
  | 'CANCEL_SCAN'
  | 'OPEN_REPORT'
  | 'CLOSE_REPORT'
  | 'DOWNLOAD_PDF'
  | 'START_FREQUENCY'
  | 'STOP_AUDIO'
  | 'TOGGLE_CAMERA'
  | 'OPEN_GUIDE'
  | 'MUTE_VOICE'
  | 'UNMUTE_VOICE'
  | 'NAVIGATE_TAB'
  | 'OPEN_MODAL'
  | 'ASSISTANT_INTRO'
  | 'UNKNOWN';

export interface VoiceCommandEvent {
  type: VoiceCommandType;
  rawText: string;
  payload?: string;
  confidence?: number;
  timestamp: number;
}

type SpeakingListener = (isSpeaking: boolean) => void;
type ListeningListener = (isListening: boolean) => void;
type TranscriptListener = (transcript: string, isFinal: boolean) => void;
export type VoiceErrorCode =
  | 'UNSUPPORTED'
  | 'MIC_DENIED'
  | 'NO_MIC'
  | 'NETWORK'
  | 'START_FAILED'
  | 'UNKNOWN';
type VoiceErrorListener = (code: VoiceErrorCode) => void;

const VOICE_ERROR_MESSAGES: Record<VoiceErrorCode, { tr: string; en: string }> = {
  UNSUPPORTED: {
    tr: 'Bu tarayıcıda sesli komut desteklenmiyor. Butonları kullanabilirsiniz.',
    en: 'Voice commands are not supported in this browser. You can use the buttons instead.',
  },
  MIC_DENIED: {
    tr: 'Mikrofon izni verilmediği için sesli komut durduruldu. Lütfen tarayıcı ayarlarından mikrofona izin verin.',
    en: 'Voice commands stopped because microphone permission was denied. Please allow the microphone in browser settings.',
  },
  NO_MIC: {
    tr: 'Mikrofon bulunamadı. Lütfen bir mikrofon bağlayın.',
    en: 'No microphone was found. Please connect a microphone.',
  },
  NETWORK: {
    tr: 'İnternet bağlantısı koptuğu için ses tanıma durduruldu.',
    en: 'Voice recognition stopped because the internet connection was lost.',
  },
  START_FAILED: {
    tr: 'Sesli komut başlatılamadı. Lütfen tekrar deneyin.',
    en: 'Voice commands could not be started. Please try again.',
  },
  UNKNOWN: {
    tr: 'Ses tanıma sırasında bir sorun oluştu.',
    en: 'A problem occurred during voice recognition.',
  },
};

export function getVoiceErrorMessage(code: VoiceErrorCode, language: Language): string {
  return language === 'en' ? VOICE_ERROR_MESSAGES[code].en : VOICE_ERROR_MESSAGES[code].tr;
}

const VOICE_FATAL_ERROR_CODES: Record<string, VoiceErrorCode> = {
  'not-allowed': 'MIC_DENIED',
  'service-not-allowed': 'MIC_DENIED',
  'audio-capture': 'NO_MIC',
  network: 'NETWORK',
};
type CommandListener = (cmd: VoiceCommandEvent) => void;

// Comprehensive Turkish & English narrations for every page, tab, panel, modal and workflow stage in the application
export const PAGE_NARRATIONS: Record<string, { tr: string; en: string }> = {
  camera: {
    tr: 'Canlı Kamera ve Biyo-Aura Spektrometresi ekranındasınız. Lütfen kameranızı yüzünüze ve üst bedeninize hizalayarak sabit durun. Sistemimiz canlı foton matrisi, 7 çakra ve 5 letaif nur merkezlerinizi tarayarak biyo-enerjinizi ve frekansınızı hesaplar. Taramayı başlatmak için Canlı Aura Taramasını Başlat butonuna dokunabilirsiniz.',
    en: 'You are on the Live Camera and Bio-Aura Spectrometry screen. Please align your face and upper body to the camera and remain still. Our system scans live photon matrix, 7 chakras, and 5 lataif spiritual centers to compute your bio-energy and resonant frequency.'
  },
  eastern: {
    tr: "Kadim Şifa Ekolleri ve Kuantum Frekans Kütüphanesi ekranındasınız. İslami Esmalar, Solfejyo frekansları, 5 Element, Sufi Makamları, Şamanik Teta Davulları ve Keltik rün akustiğinden oluşan 302'den fazla kadim şifa frekansını tek tıkla dinleyebilir ve biyo-alanınıza aktarabilirsiniz.",
    en: 'You are in the Ancient Healing Schools and Quantum Frequency Library. Explore over 302 ancient healing frequencies including Solfeggio, Islamic Asma, 5 Elements, Sufi Maqams, Shamanic Theta Drums, and Celtic acoustics.'
  },
  circadian: {
    tr: '24 Saatlik Biyo-Ritim ve Sirkadiyen Senkronizatörü ekranındasınız. Biyolojik organ saatlerinizi, meridyen enerjilerinizi ve melatonin döngülerinizi canlı olarak takip edebilir, o anki biyolojik saate en uygun frekansı anında başlatabilirsiniz.',
    en: 'You are in the 24-Hour Bio-Rhythm and Circadian Synchronizer. Monitor biological organ clocks, meridian flows, and melatonin cycles in real-time, and trigger matching acoustic frequencies.'
  },
  mindspace: {
    tr: 'MindSpace Stüdyosu AI Zihin ve Bilinçaltı Laboratuvarındasınız. Aura-Journal yapay zekâ yaşam koçu, rüya analizörü, sesli niyet labirenti ve grup aura senkronizasyonu modüllerini buradan dilediğinizce kullanabilirsiniz.',
    en: 'Welcome to MindSpace Studio AI Mind and Subconscious Lab. Access the Aura-Journal AI life coach, dream decoder, voice intention labyrinth, and group aura synchronization modules.'
  },
  chakras: {
    tr: '7 Çakra ve Kutsal Enerji Merkezleri ekranındasınız. Kök, Sakral, Solar Pleksus, Kalp, Boğaz, Üçüncü Göz ve Taç çakralarınızın enerji akışını, blokaj seviyelerini ve rezonans denge durumunu canlı olarak inceleyebilirsiniz.',
    en: 'You are viewing the 7 Chakras and Sacred Energy Centers. Analyze energy flows, blockage levels, and resonance balance for Root, Sacral, Solar Plexus, Heart, Throat, Third Eye, and Crown chakras.'
  },
  mandala: {
    tr: 'AI Kutsal Geometri Mandala Üreticisi ekranındasınız. Dinlediğiniz frekans dalga boyuna göre canlı Yaşam Çiçeği, Torus ve Metatron Küpü geometrilerini oluşturup görsel meditasyon yapabilirsiniz.',
    en: 'You are in the AI Sacred Geometry Mandala Generator. Create real-time Flower of Life, Torus, and Metatron Cube animations responsive to frequency sound waves.'
  },
  heatmap: {
    tr: 'Küresel Frekans ve Kolektif Isı Haritası ekranındasınız. Dünya genelindeki canlı frekans seanslarını ve kolektif niyet yayılımını gerçek zamanlı olarak izleyebilirsiniz.',
    en: 'You are in the Global Frequency and Collective Heatmap. View real-time active frequency sessions and collective intention transmissions across the globe.'
  },
  letaif: {
    tr: 'Biyo-Enerji ve Tasavvufi Letaif Ansiklopedisi ekranındasınız. Kalb, Ruh, Sır, Hafi ve Ahfa nur merkezleri ile kadim elementler ve 3 aura katmanı rehberini detaylarıyla inceleyebilirsiniz.',
    en: 'You are in the Bio-Energy and Spiritual Lataif Encyclopedia. Explore the Qalb, Ruh, Sirr, Khafi, and Akhfa light centers, ancient elements, and 3 aura layers.'
  },
  history: {
    tr: 'Geçmiş Aura Taramaları ve Biyo-Rezonans Arşivi ekranındasınız. Kayıtlı tüm seans analizlerinizi inceleyebilir, Öncesi ve Sonrası dönüşüm karşılaştırmalarını yapabilir ve PDF raporlarınızı indirebilir veya silebilirsiniz.',
    en: 'You are in the Scan History and Bio-Resonance Archive. Review past session reports, compare before/after transformations, and download or manage your PDF files.'
  },
  userGuide: {
    tr: 'Kullanım Kılavuzu ve Sesli Rehber açıldı. Dört adımda sistemin nasıl kullanılacağını, akıllı saat bağlantısını, 6 kadim ekolü ve şifa ansiklopedisini detaylarıyla inceleyebilir veya sekmelere dokunarak sesli dinleyebilirsiniz.',
    en: 'User Guide and Audio Assistant opened. Learn how to perform live biometrics in 4 steps, connect smart wearables, and navigate frequency protocols.'
  },
  healingEncyclopedia: {
    tr: "50'den fazla biyo-alan dengesi için hazırlanmış Kuantum Şifa Ansiklopedisi açıldı. Nörolojik, dolaşım, metabolik ve ruhsal alanlardaki frekans reçetelerini inceleyebilir ve akustik tarama başlatabilirsiniz.",
    en: 'Quantum Healing Encyclopedia opened. Explore targeted frequency prescriptions across neurological, cardiovascular, metabolic, and spiritual balance.'
  },
  emergencySOS: {
    tr: 'Acil Durum Sakinleştirici ve Panik Dengeleyici açıldı. 432 Hertz kalp frekansı ve ritmik diyafram nefesi animasyonu ile 60 saniyede sakinleşebilirsiniz.',
    en: 'Emergency Calming and SOS Panic Stabilizer opened. Relax in 60 seconds with 432 Hertz soothing audio and guided rhythmic diaphragmatic breathing.'
  },
  sleepMode: {
    tr: 'Derin Uyku Tüneli açıldı. Delta beyin dalgaları, yağmur ve ney katmanları ile rahatlatıcı bir uykuya geçiş yapabilirsiniz.',
    en: 'Deep Sleep Tunnel opened. Transition smoothly into restorative sleep with Delta brainwaves, acoustic rain, and harmonic Ney layers.'
  },
  wearableBridge: {
    tr: 'Aura-Sync Akıllı Saat Bluetooth Köprüsü açıldı. Apple Watch, Galaxy Watch veya nabız bandınızı bağlayarak canlı biyometrik kalp ritminizi ve HRV grafiğinizi izleyebilirsiniz.',
    en: 'Aura-Sync Smartwatch Bluetooth Bridge opened. Connect your Apple Watch, Galaxy Watch, or pulse sensor to stream live heart rate and HRV telemetry.'
  },
  holisticJourney: {
    tr: '7 Günlük Bütünsel Arınma ve Çakra Kampı açıldı. Sabah uyanış, öğle odak ve gece detoks mikro seanslarıyla enerjinizi dönüştürün.',
    en: '7-Day Holistic Cleanse and Chakra Retreat opened. Transform your vitality with morning wake-up, noon focus, and nighttime detox frequencies.'
  },
  voiceIntentionForge: {
    tr: 'Sesli ve Niyetli Frekans Labirenti açıldı. Mikrofona niyetinizi okuyarak sesinizi 7.83 Hertz Schumann rezonansıyla mühürleyebilirsiniz.',
    en: 'Voice & Intention Frequency Forge opened. Speak your intention into the microphone to imprint your voice with 7.83 Hertz Schumann resonance.'
  },
  dreamDecoder: {
    tr: 'AI Bilinçaltı ve Rüya Çözümleyicisi açıldı. Rüyalarınızı aktararak arketipleri çözebilir ve gece dinleyeceğiniz Delta frekansınızı oluşturabilirsiniz.',
    en: 'AI Subconscious & Dream Decoder opened. Translate dream symbolism and synthesize custom nighttime Delta frequency audio.'
  },
  groupAuraSync: {
    tr: 'Kolektif Aile ve Grup Aura Çemberi açıldı. Birden fazla cihazı aynı frekans rezonansında buluşturarak ortak enerji alanını güçlendirebilirsiniz.',
    en: 'Group & Family Aura Circle opened. Harmonize multiple devices onto synchronized acoustic frequencies to amplify shared bio-fields.'
  },
  auraJournal: {
    tr: 'Aura-Journal Yapay Zekâ Yaşam Koçu açıldı. Günlük duygu ve düşüncelerinizi kaydederek size özel 7 günlük dönüşüm reçetenizi alabilirsiniz.',
    en: 'Aura-Journal AI Life Coach opened. Journal your emotions and thoughts to receive personalized 7-day holistic frequency protocols.'
  },
  memberDashboard: {
    tr: 'Üye Paneli açıldı. Kalan sürenizi, aktif paketinizi, geçmiş raporlarınızı ve hesap bilgilerinizi buradan yönetebilirsiniz.',
    en: 'Member Dashboard opened. Manage remaining license time, active packages, scan history, and account settings.'
  },
  reportModal: {
    tr: 'Detaylı Aura Analiz Raporu açıldı. Ölçülen baskın auranızı, 7 çakra ve 5 letaif dengenizi inceleyebilir, önerilen frekansı dinleyebilir veya raporunuzu PDF olarak indirebilirsiniz.',
    en: 'Detailed Aura Analysis Report opened. Review measured dominant aura colors, chakra alignments, and download PDF reports.'
  },
  technicalReport: {
    tr: 'Kurumsal ve Teknik Sunum Raporu açıldı. AuraBio kuantum biyo-rezonans sisteminin akademik temellerini, patentli algoritmalarını ve donanım mimarisini inceleyebilirsiniz.',
    en: 'Technical and Corporate Presentation Report opened. Explore academic foundations, patented spectral algorithms, and hardware architecture.'
  },
  businessPresentation: {
    tr: 'Biyo-Rezonans İş ve Ürün Sunum Kataloğu açıldı. AuraBio sisteminin sunduğu teknolojik yenilikleri, kurumsal bayilik fırsatlarını ve frekans cihaz özelliklerini inceleyebilirsiniz.',
    en: 'Bio-Resonance Business and Product Presentation Catalog opened. Review technological breakthroughs, enterprise reseller opportunities, and spectral device features.'
  },
  dealerBusinessCard: {
    tr: 'Bayi Dijital Kartviziti ve QR Kod Paylaşım Ekranı açıldı. Özel karekodunuzu veya bağlantılarınızı danışanlarınızla paylaşarak doğrudan kayıt oluşturabilirsiniz.',
    en: 'Dealer Digital Business Card and QR Sharing screen opened. Share your custom QR code and referral links to register clients.'
  },
  resellerDashboard: {
    tr: 'Bayilik ve Ortaklık Yönetim Paneli açıldı. Size özel referans davet kodunuzu, kalan seans kredilerinizi, kayıtlı danışanlarınızı, kazandığınız komisyonları ve banka bilgilerinizi buradan görüntüleyip yönetebilirsiniz.',
    en: 'Reseller & Partnership Dashboard opened. Manage your unique referral invite link, remaining session credits, registered clients, commissions, and bank settings.'
  },
  adminPanel: {
    tr: 'Yönetici Kontrol Merkezi açıldı. Kayıtlı üyeleri, üyelik ve bayi paketlerini, yetkili bayilerin kalan seans kredilerini ve detaylı kredi harcama geçmişini buradan kontrol edip yönetebilirsiniz.',
    en: 'Administrator Control Center opened. Manage registered members, subscription & dealer packages, dealer session credit balances, and detailed audit usage logs.'
  },
  admin_members: {
    tr: 'Yönetici Paneli: Üye Yönetimi sekmesindesiniz. Kayıtlı tüm kullanıcıları, rollerini, lisans durumlarını ve hesap detaylarını listeleyebilir ve düzenleyebilirsiniz.',
    en: 'Admin Panel: Members Management tab. View and manage registered users, roles, licenses, and accounts.'
  },
  admin_resellers: {
    tr: 'Yönetici Paneli: Bayi ve Kredi Yönetimi sekmesindesiniz. Tüm bayilerin kalan seans kredilerini, komisyon oranlarını ve detaylı kredi kullanım geçmişlerini inceleyebilir, anında kredi ekleyip çıkarabilirsiniz.',
    en: 'Admin Panel: Resellers & Credits tab. Inspect remaining session credits, commission rates, and audit logs for all authorized dealers with direct credit management.'
  },
  admin_packages: {
    tr: 'Yönetici Paneli: Üyelik ve Bayi Paketleri sekmesindesiniz. Sistemdeki paket fiyatlarını, sürelerini ve kredi miktarlarını güncelleyebilirsiniz.',
    en: 'Admin Panel: Packages tab. Update pricing, duration, and credit quotas for user and dealer packages.'
  },
  admin_demos: {
    tr: 'Yönetici Paneli: Cihaz ve Demo Yönetimi sekmesindesiniz. 30 dakikalık cihaz deneme sürelerini, kilit durumlarını ve cihaz onaylarını yönetebilirsiniz.',
    en: 'Admin Panel: Device & Demo Management tab. Manage 30-minute trial periods, device locks, and authorizations.'
  },
  admin_commissions: {
    tr: 'Yönetici Paneli: Komisyon ve Ödeme Yönetimi sekmesindesiniz. Bayilerin hakediş taleplerini onaylayabilir, ödeme durumlarını güncelleyebilirsiniz.',
    en: 'Admin Panel: Commissions tab. Approve dealer earnings requests and manage payment statuses.'
  },
  diseaseDetail: {
    tr: 'Kişiselleştirilmiş Rahatsızlık ve Şifa Frekans Protokolü detayındasınız. Bu rahatsızlığa özel kadim esma, solfejyo ve organ rezonans frekanslarını tek tuşla başlatabilirsiniz.',
    en: 'Personalized Health Protocol Detail. Access targeted ancient Asma, Solfeggio, and organ resonance frequencies for this condition.'
  },
  authModal: {
    tr: 'Güvenli Üye ve Bayi Giriş / Kayıt Ekranı açıldı. Hesabınıza giriş yapabilir veya yeni bir üyelik oluşturarak frekans sistemini kullanmaya başlayabilirsiniz.',
    en: 'Secure Member & Reseller Portal opened. Sign in to your account or register to start utilizing the frequency platform.'
  },
  paymentModal: {
    tr: 'Güvenli Ödeme ve Kredi Satın Alma Ekranı açıldı. İhtiyacınıza uygun frekans veya bayilik paketini seçerek anında seans kredisi yükleyebilirsiniz.',
    en: 'Secure Checkout & License Top-up opened. Select your preferred frequency license or dealer package to add session credits.'
  },
  digitalInvoice: {
    tr: 'Dijital E-Arşiv Fatura ve Mali Belge Görüntüleyicisi açıldı. Siparişinize ait resmi fatura dökümünü inceleyebilir veya PDF olarak indirebilirsiniz.',
    en: 'Digital E-Invoice and Financial Document Viewer opened. Review your official invoice or download it as a PDF.'
  },
  ancientMatrix: {
    tr: 'Kadim Şifa Matrisi açıldı. Kadim elementler, organ meridyenleri ve biyo-rezonans frekans eşleşmelerini inceleyebilirsiniz.',
    en: 'Ancient Healing Matrix opened. Explore ancient elements, meridian mappings, and acoustic resonance pairings.'
  },
  comparison: {
    tr: 'Öncesi ve Sonrası Dönüşüm Karşılaştırması açıldı. Frekans seansı öncesindeki ve sonrasındaki aura gelişim grafiğinizi inceleyebilirsiniz.',
    en: 'Before & After Transformation Comparison opened. Review your visual bio-resonance evolution across sessions.'
  },
  acoustic_pre_scan: {
    tr: 'Seans Öncesi Referans Aura Taraması aşamasındasınız. Dinleti öncesi biyometrik durumunuzu ölçmek için lütfen kameraya bakın.',
    en: 'Pre-Session Reference Aura Scan stage. Please look into the camera to record baseline biometrics prior to frequency playback.'
  },
  acoustic_in_session: {
    tr: 'Akustik Şifa ve Biyo-Frekans Dinletisi aşamasındasınız. Kulaklığınızı takarak frekans dalga boyuna odaklanın ve derin nefes alın.',
    en: 'Acoustic Healing and Bio-Frequency Session stage. Wear headphones, focus on harmonic sound waves, and breathe deeply.'
  },
  acoustic_post_scan: {
    tr: 'Seans Sonrası Dönüşüm Taraması aşamasındasınız. Frekansın biyo-alanınızda oluşturduğu olumlu etkiyi ölçmek için lütfen kameraya bakın.',
    en: 'Post-Session Transformation Scan stage. Please look into the camera to measure the positive bio-field shift.'
  },
  acoustic_report: {
    tr: 'Biyo-Akustik Dönüşüm ve Gelişim Raporu hazırlandı. Öncesi ve sonrası çakra ve biyo-alan değişim grafiğinizi inceleyebilirsiniz.',
    en: 'Bio-Acoustic Transformation Report ready. Inspect your before-and-after chakra and bio-field evolution charts.'
  }
};

class VoiceAssistantEngine {
  private isSynthesisAvailable: boolean = false;
  private isMuted: boolean = false;
  private isAutoNarrateEnabled: boolean = true;
  private speechRate: number = 1.0;
  private speechVolume: number = 0.85;
  private language: Language = 'tr';
  private lastSpokenTime: Map<string, number> = new Map();
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private activeSpeakingState: boolean = false;
  private isUnlocked: boolean = false;
  private audioCtx: AudioContext | null = null;
  private currentPlayQueueId: number = 0;
  private keepAliveInterval: any = null;
  private chunkWatchdogTimer: any = null;
  private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();

  private isRecognitionAvailable: boolean = false;
  private recognitionInstance: any = null;
  private isListeningActive: boolean = false;
  private shouldKeepListening: boolean = false;
  private lastProcessedTranscript: string = '';
  private lastCommandTime: number = 0;
  private currentTranscript: string = '';
  private restartTimeout: any = null;
  private micPermissionGranted: boolean | null = null;

  private speakingListeners: Set<SpeakingListener> = new Set();
  private listeningListeners: Set<ListeningListener> = new Set();
  private transcriptListeners: Set<TranscriptListener> = new Set();
  private errorListeners: Set<VoiceErrorListener> = new Set();
  private commandListeners: Set<CommandListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.language = getI18nLanguage();
      if ('speechSynthesis' in window) {
        this.isSynthesisAvailable = true;
        this.isMuted = localStorage.getItem(STORAGE_VOICE_MUTED_KEY) === 'true';
        const autoNarrate = localStorage.getItem(STORAGE_AUTO_NARRATE_KEY);
        this.isAutoNarrateEnabled = autoNarrate === null ? true : autoNarrate === 'true';
        
        const savedRate = localStorage.getItem(STORAGE_VOICE_RATE_KEY);
        if (savedRate) this.speechRate = parseFloat(savedRate) || 1.0;
        const savedVol = localStorage.getItem(STORAGE_VOICE_VOLUME_KEY);
        if (savedVol) this.speechVolume = Math.max(0, Math.min(1.0, parseFloat(savedVol) || 0.85));

        this.initVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.initVoices();
        }

        // Add universal user-gesture listeners to unlock audio & speech synthesis on mobile/tablet/desktop
        this.setupMobileUnlockListeners();
      }

      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition ||
        (window as any).msSpeechRecognition;

      if (SpeechRecognitionClass) {
        this.isRecognitionAvailable = true;
        this.setupRecognition(SpeechRecognitionClass);

        const savedListening = localStorage.getItem(STORAGE_VOICE_LISTENING_KEY) === 'true';
        if (savedListening) {
          this.shouldKeepListening = true;
        }
      }

      // Handle visibilitychange to resume audio pipeline when tab re-opens
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.unlockMobileSpeech();
        }
      });
    }
  }

  public getLanguage(): Language {
    return this.language;
  }

  public setLanguage(lang: Language, announce: boolean = true): void {
    this.language = lang;
    this.initVoices();
    if (this.recognitionInstance) {
      this.recognitionInstance.lang = lang === 'en' ? 'en-US' : 'tr-TR';
    }
    if (announce && !this.isMuted) {
      if (lang === 'en') {
        this.speak('Language set to English. Voice assistant is active on all devices.', true);
      } else {
        this.speak('Dil Türkçe olarak ayarlandı. Sesli asistan tüm cihazlarda aktif.', true);
      }
    }
  }

  /**
   * Sets up touch/click listeners to unlock Web Audio & SpeechSynthesis on iOS / Android / iPad / Tablet / Desktop
   */
  private setupMobileUnlockListeners(): void {
    if (typeof window === 'undefined') return;

    const events = ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'];
    const unlockHandler = () => {
      this.unlockMobileSpeech();
      this.initVoices();
      events.forEach((evtName) => {
        window.removeEventListener(evtName, unlockHandler, { capture: true } as any);
      });
    };

    events.forEach((evtName) => {
      window.addEventListener(evtName, unlockHandler, { capture: true, passive: true });
    });
  }

  /**
   * Directly unlocks AudioContext, audio hardware pipeline and SpeechSynthesis on user gesture
   */
  public unlockMobileSpeech(): void {
    try {
      // 1. Unlock Web Audio Context with silent buffer
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        if (this.audioCtx && !this.isUnlocked) {
          try {
            const buffer = this.audioCtx.createBuffer(1, 1, 22050);
            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioCtx.destination);
            source.start(0);
          } catch (e) {}
        }
      }

      // 2. Unlock SpeechSynthesis on iOS/Safari/Android
      if (this.isSynthesisAvailable && window.speechSynthesis) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        if (!this.isUnlocked) {
          try {
            // Prime speech synthesis with a zero-length silent utterance
            const silent = new SpeechSynthesisUtterance(' ');
            silent.volume = 0.001;
            silent.rate = 2.0;
            this.activeUtterances.add(silent);
            silent.onend = () => { this.activeUtterances.delete(silent); };
            silent.onerror = () => { this.activeUtterances.delete(silent); };
            window.speechSynthesis.speak(silent);
          } catch (e) {}
        }
      }

      this.isUnlocked = true;
    } catch (e) {
      console.warn('Speech unlock note:', e);
    }
  }

  /**
   * Generates a harmonic bio-resonance acoustic chime across all devices
   */
  public playChime(type: 'start' | 'success' | 'alert' | 'listen'): void {
    if (this.isMuted && type !== 'start') return;
    try {
      this.unlockMobileSpeech();
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'start' || type === 'listen') {
        // Solfeggio 528Hz rising gentle chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, now);
        osc.frequency.exponentialRampToValueAtTime(528, now + 0.15);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12 * this.speechVolume, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'success') {
        // Harmonic 528Hz -> 639Hz chord
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, now);
        osc.frequency.setValueAtTime(639, now + 0.1);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.15 * this.speechVolume, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else {
        // Soft alert tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(432, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.1 * this.speechVolume, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {}
  }

  private initVoices(): void {
    if (!this.isSynthesisAvailable || typeof window === 'undefined') return;
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      if (this.language === 'en') {
        // Priority matching for English voices
        const enVoice = voices.find((v) => {
          const l = (v.lang || '').toLowerCase();
          const n = (v.name || '').toLowerCase();
          return (
            l.startsWith('en-us') ||
            l.startsWith('en-gb') ||
            l.startsWith('en') ||
            n.includes('english') ||
            n.includes('samantha') ||
            n.includes('karen') ||
            n.includes('daniel') ||
            n.includes('alex') ||
            n.includes('google us english') ||
            n.includes('google uk english')
          );
        });
        this.selectedVoice = enVoice || voices.find(v => v.default) || voices[0];
      } else {
        // Priority matching for Turkish voices
        const trVoice = voices.find((v) => {
          const l = (v.lang || '').toLowerCase();
          const n = (v.name || '').toLowerCase();
          return (
            l.startsWith('tr') ||
            l.includes('tr-tr') ||
            l.includes('tr_tr') ||
            n.includes('turkish') ||
            n.includes('türkçe') ||
            n.includes('yelda') ||
            n.includes('tolga') ||
            n.includes('sinan') ||
            n.includes('cem') ||
            n.includes('filiz') ||
            n.includes('grandpa') ||
            n.includes('siri') ||
            n.includes('google türkçe')
          );
        });
        this.selectedVoice = trVoice || voices.find(v => v.default) || voices[0];
      }
    } catch (e) {
      console.warn('Voice initialization warning:', e);
    }
  }

  private setSpeaking(state: boolean): void {
    this.activeSpeakingState = state;
    if (state) {
      this.startKeepAlive();
    } else {
      this.stopKeepAlive();
    }
    this.speakingListeners.forEach((l) => {
      try { l(state); } catch (e) {}
    });
  }

  /**
   * Keeps SpeechSynthesis active on iOS Safari which pauses synthesis after 10-15s
   */
  private startKeepAlive(): void {
    this.stopKeepAlive();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.keepAliveInterval = setInterval(() => {
      try {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      } catch (e) {}
    }, 4500);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  public subscribe(listener: SpeakingListener): () => void {
    this.speakingListeners.add(listener);
    listener(this.activeSpeakingState);
    return () => {
      this.speakingListeners.delete(listener);
    };
  }

  public subscribeSpeaking(listener: SpeakingListener): () => void {
    return this.subscribe(listener);
  }

  public isMute(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_VOICE_MUTED_KEY, this.isMuted.toString());
    }
    if (this.isMuted) {
      this.stop();
    } else {
      this.playChime('start');
      this.speak('Sesli asistan aktif edildi. Komutlarınızı ve sayfaları seslendiriyorum.', true);
    }
    return this.isMuted;
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_VOICE_MUTED_KEY, muted.toString());
    }
    if (muted) {
      this.stop();
    }
  }

  public isAutoNarrate(): boolean {
    return this.isAutoNarrateEnabled;
  }

  public setAutoNarrate(enabled: boolean): void {
    this.isAutoNarrateEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_AUTO_NARRATE_KEY, enabled.toString());
    }
  }

  public setVolume(volume: number): void {
    this.speechVolume = Math.max(0, Math.min(1.0, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_VOICE_VOLUME_KEY, this.speechVolume.toString());
    }
  }

  public getVolume(): number {
    return this.speechVolume;
  }

  public setRate(rate: number): void {
    this.speechRate = Math.max(0.7, Math.min(1.5, rate));
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_VOICE_RATE_KEY, this.speechRate.toString());
    }
  }

  public getRate(): number {
    return this.speechRate;
  }

  public stop(): void {
    this.currentPlayQueueId++;
    if (this.chunkWatchdogTimer) {
      clearTimeout(this.chunkWatchdogTimer);
      this.chunkWatchdogTimer = null;
    }
    this.activeUtterances.clear();
    if (!this.isSynthesisAvailable || typeof window === 'undefined') return;
    try {
      window.speechSynthesis.cancel();
      this.setSpeaking(false);
    } catch (e) {
      console.warn('Speech stop error:', e);
    }
  }

  public pause(): void {
    if (!this.isSynthesisAvailable || typeof window === 'undefined') return;
    try {
      window.speechSynthesis.pause();
      this.setSpeaking(false);
    } catch (e) {
      console.warn('Speech pause error:', e);
    }
  }

  public resume(): void {
    if (!this.isSynthesisAvailable || typeof window === 'undefined') return;
    try {
      window.speechSynthesis.resume();
      this.setSpeaking(true);
    } catch (e) {
      console.warn('Speech resume error:', e);
    }
  }

  public isCurrentlySpeaking(): boolean {
    if (!this.isSynthesisAvailable || typeof window === 'undefined') return false;
    return window.speechSynthesis.speaking || this.activeSpeakingState;
  }

  /**
   * Splits text into smaller chunks (~100-140 chars) for smooth, uninterrupted playback on iOS/Android
   */
  private splitIntoSentenceChunks(text: string): string[] {
    if (!text) return [];
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length <= 130) return [cleanText];

    const rawSentences = cleanText.split(/([.!?;\n]+)/g);
    const chunks: string[] = [];
    let currentChunk = '';

    for (let i = 0; i < rawSentences.length; i++) {
      const part = rawSentences[i].trim();
      if (!part) continue;

      if ((currentChunk + ' ' + part).length > 130 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = part;
      } else {
        currentChunk = currentChunk ? `${currentChunk} ${part}` : part;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [cleanText];
  }

  /**
   * Expressive Speech Synthesis with direct user gesture activation & chunk queueing
   */
  public speak(
    text: string,
    forced: boolean = false,
    throttleKey?: string,
    throttleMs: number = 2000
  ): void {
    if (!this.isSynthesisAvailable || typeof window === 'undefined') return;
    if (this.isMuted && !forced) return;
    if (!text || text.trim().length === 0) return;

    if (throttleKey) {
      const now = Date.now();
      const last = this.lastSpokenTime.get(throttleKey) || 0;
      if (now - last < throttleMs) {
        return;
      }
      this.lastSpokenTime.set(throttleKey, now);
    }

    this.unlockMobileSpeech();

    const queueId = ++this.currentPlayQueueId;
    const chunks = this.splitIntoSentenceChunks(text);

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    // Immediately trigger chunk queue
    this.playChunkQueue(chunks, 0, queueId);
  }

  private playChunkQueue(chunks: string[], index: number, queueId: number): void {
    if (queueId !== this.currentPlayQueueId) return;
    if (this.chunkWatchdogTimer) {
      clearTimeout(this.chunkWatchdogTimer);
      this.chunkWatchdogTimer = null;
    }

    if (index >= chunks.length) {
      this.setSpeaking(false);
      return;
    }

    const chunkText = chunks[index];
    if (!chunkText || !chunkText.trim()) {
      this.playChunkQueue(chunks, index + 1, queueId);
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = this.language === 'en' ? 'en-US' : 'tr-TR';
      utterance.rate = this.speechRate;
      utterance.pitch = 1.0;
      utterance.volume = this.speechVolume;

      if (!this.selectedVoice) {
        this.initVoices();
      }
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Keep reference to prevent GC from collecting utterance on Safari/Chrome
      this.activeUtterances.add(utterance);

      const cleanupUtterance = () => {
        this.activeUtterances.delete(utterance);
        if (this.chunkWatchdogTimer) {
          clearTimeout(this.chunkWatchdogTimer);
          this.chunkWatchdogTimer = null;
        }
      };

      utterance.onstart = () => {
        if (queueId === this.currentPlayQueueId) {
          this.setSpeaking(true);
        }
      };

      utterance.onend = () => {
        cleanupUtterance();
        if (queueId === this.currentPlayQueueId) {
          this.playChunkQueue(chunks, index + 1, queueId);
        }
      };

      utterance.onerror = (err) => {
        console.warn('Speech synthesis utterance notice:', err);
        cleanupUtterance();
        if (queueId === this.currentPlayQueueId) {
          this.playChunkQueue(chunks, index + 1, queueId);
        }
      };

      // Watchdog timer: In case mobile browser drops onend event, automatically advance
      const expectedDurationMs = Math.max(3000, (chunkText.length * 110) + 2500);
      this.chunkWatchdogTimer = setTimeout(() => {
        if (queueId === this.currentPlayQueueId && this.activeSpeakingState) {
          cleanupUtterance();
          this.playChunkQueue(chunks, index + 1, queueId);
        }
      }, expectedDurationMs);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech speak exception:', err);
      this.setSpeaking(false);
    }
  }

  /**
   * Narrates whichever page, tab or modal is currently active in chosen language
   */
  public speakPageNarration(pageKey: string, forced: boolean = false): void {
    if (!this.isAutoNarrateEnabled && !forced) return;
    const item = PAGE_NARRATIONS[pageKey];
    if (!item) return;
    const text = item[this.language] || item.tr;
    if (!text) return;
    this.speak(text, forced, `page_narration_${pageKey}_${this.language}`, 2500);
  }

  private setupRecognition(SpeechRecognitionClass: any): void {
    try {
      const recognizer = new SpeechRecognitionClass();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = this.language === 'en' ? 'en-US' : 'tr-TR';
      recognizer.maxAlternatives = 3;

      recognizer.onstart = () => {
        this.isListeningActive = true;
        this.notifyListeningState(true);
        this.playChime('listen');
      };

      recognizer.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcriptPart = item[0].transcript;
          if (item.isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        const activeText = (finalTranscript || interimTranscript).trim();
        if (activeText) {
          this.currentTranscript = activeText;
          this.notifyTranscript(activeText, Boolean(finalTranscript));

          if (finalTranscript) {
            this.handleIncomingSpeechText(finalTranscript);
          }
        }
      };

      recognizer.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        console.warn('Speech recognition error:', event.error);
        const fatalCode = VOICE_FATAL_ERROR_CODES[event.error as string];
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.micPermissionGranted = false;
        }
        if (fatalCode) {
          this.shouldKeepListening = false;
          this.isListeningActive = false;
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_VOICE_LISTENING_KEY, 'false');
          }
          this.notifyListeningState(false);
          this.notifyError(fatalCode);
          this.speak(getVoiceErrorMessage(fatalCode, this.language), true);
          return;
        }
        this.notifyError('UNKNOWN');
      };

      recognizer.onend = () => {
        this.isListeningActive = false;
        this.notifyListeningState(false);

        if (this.shouldKeepListening) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.shouldKeepListening && !this.isListeningActive) {
              try {
                this.recognitionInstance?.start();
              } catch (e) {}
            }
          }, 450);
        }
      };

      this.recognitionInstance = recognizer;
    } catch (err) {
      console.warn('Failed to setup speech recognizer:', err);
      this.isRecognitionAvailable = false;
    }
  }

  /**
   * Proactively request mic permissions on mobile/Safari/Chrome
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return this.isRecognitionAvailable;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micPermissionGranted = true;
      // Release tracks immediately
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (e) {
      console.warn('Microphone permission request note:', e);
      this.micPermissionGranted = false;
      return false;
    }
  }

  public isVoiceRecognitionSupported(): boolean {
    return this.isRecognitionAvailable;
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  public async startListening(): Promise<boolean> {
    this.unlockMobileSpeech();

    if (!this.isRecognitionAvailable || !this.recognitionInstance) {
      this.playChime('alert');
      this.notifyError('UNSUPPORTED');
      this.speak(getVoiceErrorMessage('UNSUPPORTED', this.language), true);
      return false;
    }

    try {
      // Proactively ensure mic permission on iOS/Android
      if (this.micPermissionGranted === null) {
        await this.requestMicrophonePermission();
      }

      this.shouldKeepListening = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_VOICE_LISTENING_KEY, 'true');
      }
      if (!this.isListeningActive) {
        this.recognitionInstance.lang = this.language === 'en' ? 'en-US' : 'tr-TR';
        this.recognitionInstance.start();
      }
      return true;
    } catch (e) {
      console.warn('Start listening notice:', e);
      this.shouldKeepListening = false;
      this.notifyError('START_FAILED');
      return false;
    }
  }

  public stopListening(): void {
    this.shouldKeepListening = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_VOICE_LISTENING_KEY, 'false');
    }
    if (this.recognitionInstance && this.isListeningActive) {
      try {
        this.recognitionInstance.stop();
      } catch (e) {
        console.warn('Stop listening notice:', e);
      }
    }
    this.isListeningActive = false;
    this.notifyListeningState(false);
  }

  public async toggleListening(): Promise<boolean> {
    this.unlockMobileSpeech();
    if (this.isListeningActive || this.shouldKeepListening) {
      this.stopListening();
      this.speak(
        this.language === 'en' ? 'Voice listening stopped.' : 'Sesli komut dinleme durduruldu.',
        false,
        'listen_toggle',
        2000
      );
      return false;
    } else {
      const ok = await this.startListening();
      if (ok) {
        this.speak(
          this.language === 'en' ? 'Voice assistant is listening.' : 'Sesli asistan dinliyor. Komut verebilirsiniz.',
          true,
          'listen_toggle',
          2000
        );
      }
      return ok;
    }
  }

  public subscribeListening(listener: ListeningListener): () => void {
    this.listeningListeners.add(listener);
    listener(this.isListeningActive);
    return () => {
      this.listeningListeners.delete(listener);
    };
  }

  public subscribeError(listener: VoiceErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  public subscribeTranscript(listener: TranscriptListener): () => void {
    this.transcriptListeners.add(listener);
    if (this.currentTranscript) {
      listener(this.currentTranscript, false);
    }
    return () => {
      this.transcriptListeners.delete(listener);
    };
  }

  public subscribeCommand(listener: CommandListener): () => void {
    this.commandListeners.add(listener);
    return () => {
      this.commandListeners.delete(listener);
    };
  }

  private notifyListeningState(state: boolean): void {
    this.listeningListeners.forEach((l) => {
      try { l(state); } catch (e) {}
    });
  }

  private notifyError(code: VoiceErrorCode): void {
    this.errorListeners.forEach((l) => {
      try { l(code); } catch (e) {}
    });
  }

  private notifyTranscript(text: string, isFinal: boolean): void {
    this.transcriptListeners.forEach((l) => {
      try { l(text, isFinal); } catch (e) {}
    });
  }

  public dispatchCommand(event: VoiceCommandEvent): void {
    this.playChime('success');
    this.commandListeners.forEach((l) => {
      try { l(event); } catch (e) {}
    });
  }

  /**
   * Rich natural language speech command parser for Turkish & English
   */
  public handleIncomingSpeechText(raw: string): VoiceCommandEvent | null {
    if (!raw) return null;
    const text = raw.toLowerCase().trim();
    const now = Date.now();

    if (text === this.lastProcessedTranscript && now - this.lastCommandTime < 1200) {
      return null;
    }
    this.lastProcessedTranscript = text;
    this.lastCommandTime = now;

    let detected: VoiceCommandEvent | null = null;

    // 1. Scan Commands
    if (
      text.includes('tara') ||
      text.includes('tarama') ||
      text.includes('analiz et') ||
      text.includes('beni tara') ||
      text.includes('başlat') ||
      text.includes('ölçüm') ||
      text.includes('scan') ||
      text.includes('start scan') ||
      text.includes('begin scan') ||
      text.includes('analyze')
    ) {
      detected = { type: 'START_SCAN', rawText: raw, timestamp: now };
    }
    // 2. PDF Download Commands
    else if (
      text.includes('pdf') ||
      text.includes('indir') ||
      text.includes('kaydet') ||
      text.includes('belge') ||
      text.includes('download') ||
      text.includes('save')
    ) {
      detected = { type: 'DOWNLOAD_PDF', rawText: raw, timestamp: now };
    }
    // 3. Report Commands
    else if (
      text.includes('rapor') ||
      text.includes('sonuç') ||
      text.includes('report') ||
      text.includes('results')
    ) {
      detected = { type: 'OPEN_REPORT', rawText: raw, timestamp: now };
    }
    // 4. Stop / Mute Commands
    else if (
      text.includes('durdur') ||
      text.includes('sustur') ||
      text.includes('sesi kes') ||
      text.includes('sesi kapat') ||
      text.includes('kapat') ||
      text.includes('dur') ||
      text.includes('stop') ||
      text.includes('mute') ||
      text.includes('silence') ||
      text.includes('quiet')
    ) {
      detected = { type: 'STOP_AUDIO', rawText: raw, timestamp: now };
      this.stop();
    }
    // 5. Unmute / Speak Commands
    else if (
      text.includes('sesi aç') ||
      text.includes('konuş') ||
      text.includes('asistanı aç') ||
      text.includes('unmute') ||
      text.includes('speak')
    ) {
      detected = { type: 'UNMUTE_VOICE', rawText: raw, timestamp: now };
      this.setMute(false);
      this.speak('Sesli asistan açıldı.', true);
    }
    // 6. User Guide Commands
    else if (
      text.includes('kılavuz') ||
      text.includes('rehber') ||
      text.includes('yardım') ||
      text.includes('nasıl') ||
      text.includes('guide') ||
      text.includes('help') ||
      text.includes('tutorial')
    ) {
      detected = { type: 'OPEN_GUIDE', rawText: raw, timestamp: now };
    }
    // 7. Frequency Playback Commands
    else if (
      text.includes('frekans') ||
      text.includes('şifa') ||
      text.includes('müzik') ||
      text.includes('çal') ||
      text.includes('dinlet') ||
      text.includes('frequency') ||
      text.includes('solfeggio')
    ) {
      detected = { type: 'START_FREQUENCY', rawText: raw, timestamp: now };
    }
    // 8. Emergency SOS / Calming
    else if (
      text.includes('acil') ||
      text.includes('panik') ||
      text.includes('sakinleş') ||
      text.includes('nefes') ||
      text.includes('sos') ||
      text.includes('emergency') ||
      text.includes('calm') ||
      text.includes('panic')
    ) {
      detected = { type: 'OPEN_MODAL', payload: 'sos', rawText: raw, timestamp: now };
    }
    // 9. Sleep Mode
    else if (
      text.includes('uyku') ||
      text.includes('uyu') ||
      text.includes('sleep')
    ) {
      detected = { type: 'OPEN_MODAL', payload: 'sleep', rawText: raw, timestamp: now };
    }
    // 10. Navigation to specific tabs
    else if (text.includes('kamera') || text.includes('camera')) {
      detected = { type: 'NAVIGATE_TAB', payload: 'camera', rawText: raw, timestamp: now };
    } else if (text.includes('kadim') || text.includes('doğu') || text.includes('eastern')) {
      detected = { type: 'NAVIGATE_TAB', payload: 'eastern', rawText: raw, timestamp: now };
    } else if (text.includes('çakra') || text.includes('chakra')) {
      detected = { type: 'NAVIGATE_TAB', payload: 'chakras', rawText: raw, timestamp: now };
    } else if (text.includes('ritim') || text.includes('sirkadiyen') || text.includes('circadian')) {
      detected = { type: 'NAVIGATE_TAB', payload: 'circadian', rawText: raw, timestamp: now };
    } else if (text.includes('zihin') || text.includes('mindspace')) {
      detected = { type: 'NAVIGATE_TAB', payload: 'mindspace', rawText: raw, timestamp: now };
    } else if (text.includes('mandala')) {
      detected = { type: 'NAVIGATE_TAB', payload: 'mandala', rawText: raw, timestamp: now };
    } else if (text.includes('harita') || text.includes('heatmap')) {
      detected = { type: 'NAVIGATE_TAB', payload: 'heatmap', rawText: raw, timestamp: now };
    } else if (text.includes('letaif') || text.includes('lataif')) {
      detected = { type: 'NAVIGATE_TAB', payload: 'letaif', rawText: raw, timestamp: now };
    } else if (text.includes('geçmiş') || text.includes('arşiv') || text.includes('history')) {
      detected = { type: 'NAVIGATE_TAB', payload: 'history', rawText: raw, timestamp: now };
    }
    // 11. Assistant Introduction
    else if (
      text.includes('sen kimsin') ||
      text.includes('neler yapabilirsin') ||
      text.includes('komutlar') ||
      text.includes('who are you') ||
      text.includes('what can you do')
    ) {
      detected = { type: 'ASSISTANT_INTRO', rawText: raw, timestamp: now };
      this.speak(
        this.language === 'en'
          ? 'I am the AuraBio Quantum Voice Assistant. You can command me to start scanning, download PDF reports, play healing frequencies, activate SOS calming, or narrate any page.'
          : 'Ben AuraBio Kuantum Sesli Asistanıyım. Beni kullanarak kamera taraması başlatabilir, PDF raporu indirebilir, şifa frekanslarını çalabilir, acil durum modunu açabilir veya sayfaları dinleyebilirsiniz.',
        true
      );
    }

    if (detected) {
      this.dispatchCommand(detected);
    }
    return detected;
  }

  public speakHumanWarning(): void {
    this.playChime('alert');
    this.speak(
      this.language === 'en'
        ? 'Please face the camera. Scanning cannot begin without detecting a person in frame.'
        : 'Lütfen kamerayı insana çevirin. Kadrajda insan tespit edilmeden tarama başlatılamaz.',
      false,
      'human_warning',
      6000
    );
  }

  public speakScanLockedNotice(): void {
    this.playChime('alert');
    this.speak(
      this.language === 'en' ? 'Face the camera! Objects cannot be scanned.' : 'Kamerayı insana çevirin! Nesneler taranamaz.',
      true,
      'scan_locked_click',
      3000
    );
  }

  public speakHumanDetected(): void {
    this.speak(
      this.language === 'en'
        ? 'Human bio-field detected. You can start the scan.'
        : 'İnsan biyo-alanı algılandı. Taramayı başlatabilirsiniz.',
      false,
      'human_detected',
      10000
    );
  }

  public speakScanStart(): void {
    this.playChime('start');
    this.speak(
      this.language === 'en'
        ? 'Bio-resonance aura scanning started. Please look at the camera and remain still.'
        : 'Biyo-rezonans aura taraması başlatıldı. Lütfen kameraya bakarak sabit durun.',
      true
    );
  }

  public speakScanProgress(progress: number): void {
    if (progress === 30) {
      this.speak(
        this.language === 'en'
          ? 'Scanning photon matrix and Kirlian plasma density.'
          : 'Foton matrisi ve Kirlian plazma yoğunluğu taranıyor.',
        false,
        'prog_30',
        5000
      );
    } else if (progress === 70) {
      this.speak(
        this.language === 'en'
          ? 'Calculating seven chakras and spiritual energy centers.'
          : 'Yedi çakra ve letaif nur merkezleri hesaplanıyor.',
        false,
        'prog_70',
        5000
      );
    }
  }

  public speakScanComplete(scan: ScanResult): void {
    this.playChime('success');
    const dominantName = scan.dominantAuraColor ? scan.dominantAuraColor.split('(')[0].trim() : (this.language === 'en' ? 'Emerald Green' : 'Zümrüt Yeşili');
    const energy = scan.bioEnergyLevel || 85;
    const hz = scan.frequencyHz || 528;
    this.speak(
      this.language === 'en'
        ? `Aura scan complete. Dominant aura is ${dominantName}, bio-energy level is ${energy} percent, resonant frequency is ${hz} Hertz.`
        : `Aura taraması tamamlandı. Baskın auranız ${dominantName}, biyo-enerji seviyeniz yüzde ${energy}, frekansınız ${hz} Hertz olarak ölçüldü.`,
      true
    );
  }

  public speakFrequencyStart(name: string, hz: number): void {
    this.playChime('start');
    this.speak(
      this.language === 'en'
        ? `Frequency transmission started for ${name}. Transmitting ${hz} Hertz quantum wave.`
        : `${name} frekansı yüklemesi başlatıldı. ${hz} Hertz Solfeggio kuantum dalgası aktarılıyor.`,
      true
    );
  }

  public speakFrequencyComplete(name: string): void {
    this.playChime('success');
    this.speak(
      this.language === 'en'
        ? `${name} frequency transmission completed successfully. Bio-energy renewed.`
        : `${name} frekans yüklemesi başarıyla tamamlandı. Biyo-enerji seviyeniz yenilendi.`,
      true
    );
  }

  public speakPdfDownloaded(): void {
    this.playChime('success');
    this.speak(
      this.language === 'en'
        ? 'Your aura analysis report and protocol have been downloaded as a PDF document.'
        : 'Aura analiz raporunuz ve frekans protokolünüz PDF belgesi olarak indirildi.',
      true
    );
  }
}

export const voiceAssistant = new VoiceAssistantEngine();
export default voiceAssistant;
