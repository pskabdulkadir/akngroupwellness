export interface LetaifInfo {
  id: string;
  name: string;
  arabicName: string;
  location: string;
  color: string;
  colorHex: string;
  esma: string;
  esmaMeaning: string;
  esmaFrequency: number;
  dhikrCount: number;
  spiritualMeaning: string;
  effectOnBody: string;
  prophetConnection: string;
}

export const LETAIF_POINTS: LetaifInfo[] = [
  {
    id: 'kalb',
    name: 'Kalp Letaifi',
    arabicName: 'لطيفة القلب',
    location: 'Sol memenin iki parmak altı',
    color: 'Sarı Işık',
    colorHex: '#eab308',
    esma: 'Yâ Allâh / Yâ Hayy',
    esmaMeaning: 'Bütün kemal sıfatların sahibi, ezeli hayat veren.',
    esmaFrequency: 528,
    dhikrCount: 5000,
    spiritualMeaning: 'Nefsin masivadan (dünyalık takıntılardan) temizlenmesi, ilahi muhabbetin kalpte tutuşması.',
    effectOnBody: 'Kalp ritmini (HRV), koroner dolaşımı ve bağışıklık sistemini regüle eder.',
    prophetConnection: 'Hz. Âdem (a.s) meşrebi'
  },
  {
    id: 'ruh',
    name: 'Ruh Letaifi',
    arabicName: 'لطيفة الروح',
    location: 'Sağ memenin iki parmak altı',
    color: 'Kırmızı Işık',
    colorHex: '#ef4444',
    esma: 'Yâ Allâh / Yâ Kuddûs',
    esmaMeaning: 'Kusurlardan münezzeh, tertemiz kılan.',
    esmaFrequency: 639,
    dhikrCount: 5000,
    spiritualMeaning: 'İlahi aşk, vecd, şevk ve seyr-i ilallah makamı; ruhun aslına yönelişi.',
    effectOnBody: 'Akciğerleri, hücresel oksijenasyonu ve göğüs kafesi elastikiyetini destekler.',
    prophetConnection: 'Hz. Nuh ve Hz. İbrahim (a.s) meşrebi'
  },
  {
    id: 'sirr',
    name: 'Sır Letaifi',
    arabicName: 'لطيفة السر',
    location: 'Sol memenin iki parmak üstü',
    color: 'Beyaz Işık',
    colorHex: '#f8fafc',
    esma: 'Yâ Allâh / Yâ Rahmân',
    esmaMeaning: 'Sonsuz rahmet ve lütuf saçan.',
    esmaFrequency: 741,
    dhikrCount: 5000,
    spiritualMeaning: 'İlahi sıfatların, gayb nurlarının ve marifetullahın tecelli ettiği sır hazinesi.',
    effectOnBody: 'Timus bezini ve lenfatik drenaj kalkanını aktive eder.',
    prophetConnection: 'Hz. Musa (a.s) meşrebi'
  },
  {
    id: 'hafi',
    name: 'Hafî Letaifi',
    arabicName: 'لطيفة الخفي',
    location: 'Sağ memenin iki parmak üstü',
    color: 'Siyah / Nur-ı Siyah Işık (Zümrüt Mavi)',
    colorHex: '#06b6d4',
    esma: 'Yâ Allâh / Yâ Rahîm',
    esmaMeaning: 'Hususi merhametiyle kulunu selamete erdiren.',
    esmaFrequency: 852,
    dhikrCount: 5000,
    spiritualMeaning: 'Manevi cezbe, fena ve beka hallerinin gerçekleştiği derin idrak makamı.',
    effectOnBody: 'Karaciğer detoksu, safra dengesi ve otonom sinir sistemini teskin eder.',
    prophetConnection: 'Hz. İsa (a.s) meşrebi'
  },
  {
    id: 'ahfa',
    name: 'Ahfâ Letaifi',
    arabicName: 'لطيفة الأخفى',
    location: 'Göğüs kafesinin tam ortası (İman Tahtı)',
    color: 'Yeşil Işık',
    colorHex: '#10b981',
    esma: 'Yâ Allâh / Yâ Vedûd / Yâ Nûr',
    esmaMeaning: 'Kullarını çok seven ve sevilen, nurların kaynağı.',
    esmaFrequency: 963,
    dhikrCount: 5000,
    spiritualMeaning: 'En gizli ilahi tecellilerin toplandığı vuslat noktası; tecelli-i zat.',
    effectOnBody: 'Bütün endokrin hormon sistemini ve merkezi biyo-alan dengesini sağlar.',
    prophetConnection: 'Hz. Muhammed Mustafâ (s.a.v) meşrebi'
  },
  {
    id: 'nefs',
    name: 'Nefs-i Nâtıka',
    arabicName: 'النفس الناطقة',
    location: 'İki kaş arası / Dimağ (Alın merkezi)',
    color: 'Mavi-Şeffaf Işık',
    colorHex: '#6366f1',
    esma: 'Yâ Hakem / Yâ Adl / Yâ Hâdî',
    esmaMeaning: 'Hüküm veren, adaletle hidayete erdiren.',
    esmaFrequency: 852,
    dhikrCount: 3000,
    spiritualMeaning: 'Nefsin tezkiye edilerek (Nefs-i Mutmainne) ruhun emrine girmesi, akıl ve basiret berraklığı.',
    effectOnBody: 'Epifiz ve hipofiz bezlerini aktive eder, zihinsel odaklanmayı artırır.',
    prophetConnection: 'Sıddıkıyyet Makamı'
  },
  {
    id: 'kulliye',
    name: 'Letaif-i Külliye (Külli Beden)',
    arabicName: 'اللطائف الكلية',
    location: 'Tüm beden zerreleri ve hücreler',
    color: 'Elmas Platin Işık',
    colorHex: '#ffffff',
    esma: 'Yâ Allâh / Yâ Müheymin / Yâ Bâki',
    esmaMeaning: 'Bütün zerreleri kuşatan, ebedi olan.',
    esmaFrequency: 963,
    dhikrCount: 10000,
    spiritualMeaning: 'Bedenin bütün trilyonlarca hücresinin ve zerrelerinin zikr-i ilahiye iştirak etmesi.',
    effectOnBody: 'Tüm hücresel biyofoton ışımasını ve manyetik koruma kalkanını güçlendirir.',
    prophetConnection: 'Kamil İnsan (İnsan-ı Kâmil) Rezonansı'
  }
];

export const LETAIF_GUIDE = LETAIF_POINTS;

export interface ChakraGuideItem {
  id: string;
  name: string;
  sanskrit: string;
  location: string;
  frequencyHz: number;
  colorHex: string;
  element: string;
  bijaMantra: string;
  spiritualMeaning: string;
  effectOnBody: string;
  balancedTraits: string;
}

export const CHAKRA_GUIDE: ChakraGuideItem[] = [
  {
    id: 'c1',
    name: 'Kök Çakra',
    sanskrit: 'Muladhara',
    location: 'Omurga tabanı, kuyruk sokumu',
    frequencyHz: 396,
    colorHex: '#ef4444',
    element: 'Toprak',
    bijaMantra: 'LAM',
    spiritualMeaning: 'Fiziksel dünyada güvenlik, hayata tutunma ve sarsılmaz köklenme.',
    effectOnBody: 'İskelet sistemi, omurga, bacaklar, bağırsaklar ve böbreküstü bezleri.',
    balancedTraits: 'Korkusuzluk, finansal/fiziksel güven, istikrar ve canlılık.'
  },
  {
    id: 'c2',
    name: 'Sakral Çakra',
    sanskrit: 'Svadhisthana',
    location: 'Göbeğin 2 parmak altı, alt karın',
    frequencyHz: 417,
    colorHex: '#f97316',
    element: 'Su',
    bijaMantra: 'VAM',
    spiritualMeaning: 'Duygusal akış, yaratıcılık, üretkenlik ve yaşam sevinci.',
    effectOnBody: 'Üreme organları, böbrekler, mesane ve lenfatik dolaşım.',
    balancedTraits: 'Duygusal esneklik, yaratıcı ilham, haz alma ve uyum yeteneği.'
  },
  {
    id: 'c3',
    name: 'Solar Pleksus (Güneş Sinirağı)',
    sanskrit: 'Manipura',
    location: 'Mide üzeri, göğüs kafesi altı',
    frequencyHz: 528,
    colorHex: '#eab308',
    element: 'Ateş',
    bijaMantra: 'RAM',
    spiritualMeaning: 'İrade ateşi, kişisel güç, özsaygı ve zihinsel berraklık.',
    effectOnBody: 'Mide, karaciğer, safra kesesi, pankreas ve sindirim sistemi.',
    balancedTraits: 'Güçlü irade, liderlik, kararlılık ve yüksek motivasyon.'
  },
  {
    id: 'c4',
    name: 'Kalp Çakrası',
    sanskrit: 'Anahata',
    location: 'Göğüs ortası, kalp bölgesi',
    frequencyHz: 639,
    colorHex: '#10b981',
    element: 'Hava',
    bijaMantra: 'YAM',
    spiritualMeaning: 'Koşulsuz sevgi, şefkat, affedicilik ve kalp inşirahı.',
    effectOnBody: 'Kalp, dolaşım sistemi, timus bezi, akciğerler ve bağışıklık.',
    balancedTraits: 'Derin merhamet, empati, affetme sevinci ve kalbi huzur.'
  },
  {
    id: 'c5',
    name: 'Boğaz Çakrası',
    sanskrit: 'Vishuddha',
    location: 'Boğaz çukuru, boyun tabanı',
    frequencyHz: 741,
    colorHex: '#06b6d4',
    element: 'Eter / Akasya',
    bijaMantra: 'HAM',
    spiritualMeaning: 'Hakikat beyanı, dürüst ve şifalı iletişim, özgün ifade.',
    effectOnBody: 'Tiroid ve paratiroid bezleri, ses telleri, boyun ve kulaklar.',
    balancedTraits: 'Akıcı konuşma, dürüstlük, sanatsal ifade ve dinleme yetisi.'
  },
  {
    id: 'c6',
    name: 'Üçüncü Göz (Alın Çakrası)',
    sanskrit: 'Ajna',
    location: 'İki kaş ortası, alın',
    frequencyHz: 852,
    colorHex: '#6366f1',
    element: 'Işık',
    bijaMantra: 'OM',
    spiritualMeaning: 'Basiret, altıncı his, içsel rehberlik ve yüksek sezgi.',
    effectOnBody: 'Epifiz bezi, hipofiz bezi, gözler, beyin yarıküreleri.',
    balancedTraits: 'Keskin basiret, doğru sezgiler, berrak zihin ve vizyon.'
  },
  {
    id: 'c7',
    name: 'Taç Çakra',
    sanskrit: 'Sahasrara',
    location: 'Başın tepe noktası (Bıngıldak)',
    frequencyHz: 963,
    colorHex: '#8b5cf6',
    element: 'Tevhid / Saf Bilinç',
    bijaMantra: 'AUM',
    spiritualMeaning: 'Kozmik birlik, ilahi teslimiyet, manevi uyanış ve aydınlanma.',
    effectOnBody: 'Serebral korteks, merkezi sinir sistemi ve tüm biyo-alan kubbesi.',
    balancedTraits: 'Manevi olgunluk, derin huzur, evrensel birlik ve teslimiyet.'
  }
];

export interface AuraLayerGuideItem {
  id: string;
  name: string;
  distanceCm: string;
  colorFrequency: string;
  description: string;
  role: string;
}

export const AURA_LAYERS_GUIDE: AuraLayerGuideItem[] = [
  {
    id: 'layer_etheric',
    name: '1. Eterik Beden (Fiziksel Canlılık Şablonu)',
    distanceCm: '1 - 5 cm',
    colorFrequency: 'Açık Mavi / Beyaz Işıma • 174-396 Hz',
    description: 'Fiziksel bedenin tam bir enerji kopyasıdır. Meridyen kanalları ve akupunktur noktaları bu katmanda akar.',
    role: 'Hücrelere hayati enerji (Prana/Chi) taşır, fiziksel dokuların onarım şablonunu oluşturur.'
  },
  {
    id: 'layer_astral',
    name: '2. Duygusal & Astral Katman (Hisler & Arzu Alanı)',
    distanceCm: '5 - 20 cm',
    colorFrequency: 'Gökkuşağı Renk Spektrumu • 417-639 Hz',
    description: 'Bütün duygular, hisler, korkular ve sevinçler bu katmanda dalgalanır. Ruh haline göre anlık renk değişimleri gösterir.',
    role: 'Duygusal enerjileri işler, sevgi ve empati rezonansını çevreye iletir.'
  },
  {
    id: 'layer_mental',
    name: '3. Zihinsel & Mental Katman (Düşünce Formları)',
    distanceCm: '20 - 45 cm',
    colorFrequency: 'Altın Sarısı & Parlak Zümrüt • 528-741 Hz',
    description: 'Fikirler, inanç kalıpları ve zihinsel konsantrasyon bu katmanı şekillendirir.',
    role: 'Zihinsel berraklığı korur, yaratıcı düşünce projeksiyonlarını yönetir.'
  },
  {
    id: 'layer_causal',
    name: '4. Kausal / Ruhsal Katman (Manevi Kalkan & Yüksek Benlik)',
    distanceCm: '45 - 120+ cm',
    colorFrequency: 'Saf Beyaz & Menekşe Nuru • 852-963 Hz',
    description: 'Ruhun ezeli hafızasını ve yüksek manevi bağlantısını barındıran en dış koruma zırhıdır.',
    role: 'Dışarıdan gelebilecek negatif manyetik tesirlere karşı biyo-alanı mühürler.'
  }
];

export interface AuraColorGuideItem {
  name: string;
  hex: string;
  meaning: string;
  traits: string[];
}

export const AURA_COLORS_GUIDE: AuraColorGuideItem[] = [
  { name: 'Saf Beyaz Işık (Tevhid & Kuddus Zırhı)', hex: '#f8fafc', meaning: 'Yüksek manevi bilinç, arınma ve tam teslimiyet.', traits: ['Huzur', 'Tevhid', 'Koruma'] },
  { name: 'Platin Gümüş (Manevi Kalkan & Sezgi)', hex: '#e2e8f0', meaning: 'Negatif yansıtıcı ayna, berrak sezgi ve feyiz.', traits: ['Koruma', 'Basiret', 'Berraklık'] },
  { name: 'Zümrüt Yeşili (Kalp Şifası & Merhamet)', hex: '#10b981', meaning: 'Hücresel şifa, inşirah, koşulsuz sevgi ve yenilenme.', traits: ['Şifa', 'Empati', 'Denge'] },
  { name: 'Menekşe & Mor (Kozmik İdrak & Bilgelik)', hex: '#8b5cf6', meaning: 'Manevi idrak, ilham ve yüksek şuur uyanışı.', traits: ['Sezgi', 'Bilgelik', 'Feyiz'] },
  { name: 'Çivit Mavisi & İndigo (Basiret & 3. Göz)', hex: '#6366f1', meaning: 'İçsel görüş, keskin altıncı his ve derin odaklanma.', traits: ['Basiret', 'Konsantrasyon', 'İçgörü'] },
  { name: 'Gök Mavisi & Turkuaz (Selamet & İfade)', hex: '#06b6d4', meaning: 'Doğru söz, selamet, içsel barış ve açık iletişim.', traits: ['İletişim', 'Huzur', 'Arınma'] },
  { name: 'Gül Pembesi (İlahi Muhabbet & Şefkat)', hex: '#ec4899', meaning: 'Nezaket, incelik, duygusal iyileşme ve sevgi dolu bağlar.', traits: ['Şefkat', 'Zarafet', 'Muhabbet'] },
  { name: 'Altın Sarısı (Güneş & İrade Ateşi)', hex: '#eab308', meaning: 'Özgüven, zihinsel güç, sindirim ateşi ve bilgelik.', traits: ['İrade', 'Canlılık', 'Neşe'] },
  { name: 'Canlı Turuncu (Üretkenlik & Akış)', hex: '#f97316', meaning: 'Yaşam sevinci, üretkenlik ve duygusal esneklik.', traits: ['Yaratıcılık', 'Uyum', 'Neşe'] },
  { name: 'Yakut Kırmızısı (Köklenme & Hayat Gücü)', hex: '#ef4444', meaning: 'Fiziksel canlılık, köklenme, cesaret ve güven.', traits: ['Güç', 'Dayanıklılık', 'İstikrar'] }
];
