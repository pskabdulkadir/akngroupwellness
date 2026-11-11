export interface DailySessionProtocol {
  id: string;
  name: string;
  title?: string;
  timeOfDay: 'morning' | 'noon' | 'evening' | 'night' | string;
  frequencyHz: number;
  binauralHz: number;
  durationMinutes: number;
  focusArea: string;
  esmaOrMantra: string;
  affirmation: string;
  guidanceText: string;
  [key: string]: any;
}

export interface HolisticJourneyDay {
  dayNumber: number;
  title: string;
  theme: string;
  chakraFocus: string;
  colorHex: string;
  morningSession: DailySessionProtocol;
  middaySession?: DailySessionProtocol;
  eveningSession: DailySessionProtocol;
  dailyGoal: string;
  dailyJournalPrompt: string;
  [key: string]: any;
}

export interface HolisticJourneyProgram {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  durationDays: number;
  totalDays?: number;
  difficulty: 'Başlangıç' | 'Orta Seviye' | 'İleri Rezonans' | string;
  colorGradient: string;
  badgeIcon: string;
  days: HolisticJourneyDay[];
  [key: string]: any;
}

export const TRANSFORMATION_JOURNEYS: HolisticJourneyProgram[] = [
  {
    id: 'chakra_reboot_7',
    title: '7 Günlük Kutsal Çakra & Aura Yenilenme Kampı',
    subtitle: 'Kökten Taca Tam Biyo-Enerji Hizalaması',
    category: 'Enerji & Çakra',
    description: 'Her gün bir çakrayı Solfeggio frekansları, özel nefes teknikleri ve Esma rezonansları ile arındıran bütünsel program.',
    durationDays: 7,
    difficulty: 'Başlangıç',
    colorGradient: 'from-emerald-600 to-teal-800',
    badgeIcon: 'Sparkles',
    days: [
      {
        dayNumber: 1,
        title: '1. Gün: Kök Çakra & Topraklanma',
        theme: 'Güven, Maddi İstikrar ve Köklenme',
        chakraFocus: 'Muladhara (Kök Çakra)',
        colorHex: '#ef4444',
        dailyGoal: 'Korku ve kaygılardan arınarak yeryüzüyle güven bağı kurmak.',
        dailyJournalPrompt: 'Hayatta kendimi en güvende hissettiğim anlar nelerdir?',
        morningSession: {
          id: 'day1_m',
          name: 'Sabah Köklenme Rezonansı',
          timeOfDay: 'morning',
          frequencyHz: 396,
          binauralHz: 7.83,
          durationMinutes: 10,
          focusArea: 'Omurga kökü ve bacaklar',
          esmaOrMantra: 'Yâ Hayy Yâ Kayyûm / LAM',
          affirmation: 'Dünyaya ve hayata güveniyorum, sağlam bir temeldeyim.',
          guidanceText: '396 Hz Solfeggio tonunu dinlerken kırmızı ışığın kuyruk sokumunuzdan toprağa kök saldığını hayal edin.'
        },
        eveningSession: {
          id: 'day1_e',
          name: 'Akşam Topraklanma Meditasyonu',
          timeOfDay: 'evening',
          frequencyHz: 432,
          binauralHz: 4.0,
          durationMinutes: 15,
          focusArea: 'Tüm beden gevşemesi',
          esmaOrMantra: 'Yâ Selâm',
          affirmation: 'Günün tüm ağırlığını toprağa bırakıyorum, huzurluyum.',
          guidanceText: 'Yatmadan önce nefesinizi yavaşlatarak derin bir dinginliğe teslim olun.'
        }
      },
      {
        dayNumber: 2,
        title: '2. Gün: Sakral Çakra & Akış',
        theme: 'Duygusal Arınma ve Yaratıcılık',
        chakraFocus: 'Svadhisthana (Sakral Çakra)',
        colorHex: '#f97316',
        dailyGoal: 'Geçmiş kırgınlıkları serbest bırakıp yaşam coşkusunu açığa çıkarmak.',
        dailyJournalPrompt: 'Hangi duygumu uzun zamandır bastırıyorum?',
        morningSession: {
          id: 'day2_m',
          name: 'Sabah Yaratıcılık Akışı',
          timeOfDay: 'morning',
          frequencyHz: 417,
          binauralHz: 10.0,
          durationMinutes: 10,
          focusArea: 'Göbek altı ve pelvis',
          esmaOrMantra: 'Yâ Bâsıt / VAM',
          affirmation: 'Duygularımı ve yaratıcılığımı özgürce ifade ediyorum.',
          guidanceText: '417 Hz frekansı ile turuncu bir ırmağın duygusal blokajlarınızı temizlediğini hissedin.'
        },
        eveningSession: {
          id: 'day2_e',
          name: 'Akşam Duygusal Detoks',
          timeOfDay: 'evening',
          frequencyHz: 528,
          binauralHz: 3.5,
          durationMinutes: 15,
          focusArea: 'Pelvik rahatlama',
          esmaOrMantra: 'Yâ Kuddûs',
          affirmation: 'Bütün negatif yükleri affederek serbest bırakıyorum.',
          guidanceText: 'Derin gevşeme ile hücresel arınmayı başlatın.'
        }
      },
      {
        dayNumber: 3,
        title: '3. Gün: Solar Pleksus & İçsel Güç',
        theme: 'İrade, Kararlılık ve Özgüven',
        chakraFocus: 'Manipura (Solar Pleksus)',
        colorHex: '#eab308',
        dailyGoal: 'Kendi iradenize sahip çıkmak ve içsel gücünüzü hissetmek.',
        dailyJournalPrompt: 'Kendi gücümü başkalarına teslim ettiğim alanlar nelerdir?',
        morningSession: {
          id: 'day3_m',
          name: 'Sabah İrade Güneşi',
          timeOfDay: 'morning',
          frequencyHz: 528,
          binauralHz: 12.0,
          durationMinutes: 10,
          focusArea: 'Mide ve solar pleksus',
          esmaOrMantra: 'Yâ Kaviyy / RAM',
          affirmation: 'Kendi hayatımın iradesine sahibim, güçlüyüm.',
          guidanceText: 'Midenizde parlayan parlak sarı bir güneşin tüm bedeninize cesaret yaydığını imgeleyin.'
        },
        eveningSession: {
          id: 'day3_e',
          name: 'Akşam Sindirim & Dinginlik',
          timeOfDay: 'evening',
          frequencyHz: 432,
          binauralHz: 4.5,
          durationMinutes: 15,
          focusArea: 'Mide ve karın bölgesi',
          esmaOrMantra: 'Yâ Şâfî',
          affirmation: 'Hayatın bana sunduğu tüm deneyimleri kolaylıkla sindiriyorum.',
          guidanceText: 'Mide kaslarınızı gevşeterek sükûnete odaklanın.'
        }
      },
      {
        dayNumber: 4,
        title: '4. Gün: Kalp Çakrası & Koşulsuz Sevgi',
        theme: 'Bağışlama, Merhamet ve Kalp Genişliği',
        chakraFocus: 'Anahata (Kalp Çakrası)',
        colorHex: '#10b981',
        dailyGoal: 'Kalpteki kırgınlıkları şifalandırmak ve sevgiye açılmak.',
        dailyJournalPrompt: 'Kimi koşulsuz olarak affetmeye ihtiyacım var?',
        morningSession: {
          id: 'day4_m',
          name: 'Sabah Kalp Zümrüdü Rezonansı',
          timeOfDay: 'morning',
          frequencyHz: 639,
          binauralHz: 10.0,
          durationMinutes: 10,
          focusArea: 'Göğüs kafesi ve timus',
          esmaOrMantra: 'Yâ Vedûd Yâ Rahmân / YAM',
          affirmation: 'Kalbimi saf sevgiye ve ilahi merhamete açıyorum.',
          guidanceText: '639 Hz tonuyla göğsünüzden yayılan zümrüt yeşili ışığın tüm dünyayı sardığını hissedin.'
        },
        eveningSession: {
          id: 'day4_e',
          name: 'Akşam Bağışlama Terapisi',
          timeOfDay: 'evening',
          frequencyHz: 528,
          binauralHz: 3.0,
          durationMinutes: 15,
          focusArea: 'Kalp merkezi',
          esmaOrMantra: 'Yâ Gafûr Yâ Rahîm',
          affirmation: 'Kendimi ve geçmişi şefkatle bağışlıyorum.',
          guidanceText: 'Tüm kalbinizi ısıtan huzur dalgasını soluyun.'
        }
      },
      {
        dayNumber: 5,
        title: '5. Gün: Boğaz Çakrası & Hakikat',
        theme: 'Dürüst İfade ve İletişim',
        chakraFocus: 'Vishuddha (Boğaz Çakrası)',
        colorHex: '#06b6d4',
        dailyGoal: 'İçinizdeki hakikati sevgiyle ve çekinmeden dile getirmek.',
        dailyJournalPrompt: 'Söylemekten korktuğum en derin gerçeğim nedir?',
        morningSession: {
          id: 'day5_m',
          name: 'Sabah Berrak İfade Dalgaları',
          timeOfDay: 'morning',
          frequencyHz: 741,
          binauralHz: 10.5,
          durationMinutes: 10,
          focusArea: 'Boğaz, boyun ve ses telleri',
          esmaOrMantra: 'Yâ Mütekellim / HAM',
          affirmation: 'Hakikatimi sevgiyle, dürüstlükle ve güvenle konuşuyorum.',
          guidanceText: '741 Hz frekansı boğazınızdaki tüm düğümleri ve söylenmemiş sözleri arındırıyor.'
        },
        eveningSession: {
          id: 'day5_e',
          name: 'Akşam Sessizlik ve Tefekkür',
          timeOfDay: 'evening',
          frequencyHz: 432,
          binauralHz: 4.0,
          durationMinutes: 15,
          focusArea: 'Boyun ve omuzlar',
          esmaOrMantra: 'Yâ Hakîm',
          affirmation: 'Sözlerim şifa, sessizliğim huzur kaynağıdır.',
          guidanceText: 'Günün kelimelerini geride bırakıp derin içsel sessizliğe geçin.'
        }
      },
      {
        dayNumber: 6,
        title: '6. Gün: Üçüncü Göz & Sezgisel İdrak',
        theme: 'Epifiz Bezi Aktivasyonu ve Zihinsel Berraklık',
        chakraFocus: 'Ajna (Üçüncü Göz)',
        colorHex: '#6366f1',
        dailyGoal: 'Zihin karmaşasını durdurup sezgisel rehberliğe güvenmek.',
        dailyJournalPrompt: 'İç sesim bana bugün ne fısıldıyor?',
        morningSession: {
          id: 'day6_m',
          name: 'Sabah Epifiz Aydınlanması',
          timeOfDay: 'morning',
          frequencyHz: 852,
          binauralHz: 11.0,
          durationMinutes: 10,
          focusArea: 'İki kaşın ortası ve alın',
          esmaOrMantra: 'Yâ Nûr Yâ Basîr / OM',
          affirmation: 'Sezgilerime güveniyorum; zihnim aydınlık ve berrak.',
          guidanceText: '852 Hz saf tonu alnınızdaki indigo ışığı parlatarak içsel görüşünüzü keskinleştirir.'
        },
        eveningSession: {
          id: 'day6_e',
          name: 'Akşam Rüya ve Bilinçaltı Köprüsü',
          timeOfDay: 'evening',
          frequencyHz: 528,
          binauralHz: 3.5,
          durationMinutes: 15,
          focusArea: 'Alın ve başın üst kısmı',
          esmaOrMantra: 'Yâ Alîm',
          affirmation: 'Rüyalarım bana hakikati ve şifayı fısıldar.',
          guidanceText: 'Zihinsel gevezeliği kapatarak bilinçaltınızı temizleyin.'
        }
      },
      {
        dayNumber: 7,
        title: '7. Gün: Taç Çakra & Kozmik Birlik',
        theme: 'İlahi Birlik, Tevhid ve Kozmik Uyanış',
        chakraFocus: 'Sahasrara (Taç Çakra)',
        colorHex: '#8b5cf6',
        dailyGoal: 'Evrensel kaynakla ve sonsuz sevgiyle bir olduğunu idrak etmek.',
        dailyJournalPrompt: 'Kainatla aramdaki bağı nasıl daha güçlü hissedebilirim?',
        morningSession: {
          id: 'day7_m',
          name: 'Sabah Kozmik Birlik Portalı',
          timeOfDay: 'morning',
          frequencyHz: 963,
          binauralHz: 12.5,
          durationMinutes: 12,
          focusArea: 'Başın tepesi ve taç bölgesi',
          esmaOrMantra: 'Allâh / Yâ Câmi / AUM',
          affirmation: 'Evrensel kaynakla, saf ışıkla ve sevgiyle birim.',
          guidanceText: '963 Hz kozmik birlik frekansı taç bölgenizden tüm bedeninize saf altın-menekşe ışık akıtır.'
        },
        eveningSession: {
          id: 'day7_e',
          name: 'Büyük Entegrasyon ve Şükran Kapanışı',
          timeOfDay: 'evening',
          frequencyHz: 528,
          binauralHz: 2.5,
          durationMinutes: 20,
          focusArea: 'Bütün aura alanı',
          esmaOrMantra: 'Elhamdülillâh / Yâ Şekûr',
          affirmation: 'Tüm bedenim, zihnim ve ruhum kusursuz bir ahenk içinde parlıyor.',
          guidanceText: '7 günlük kampınızı kutlayın; yenilenmiş auranızla şükran frekansına geçin.'
        }
      }
    ]
  }
];
