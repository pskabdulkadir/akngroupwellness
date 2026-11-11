export interface EasternMantra {
  id: string;
  name: string;
  sanskrit: string;
  chakra: string;
  frequencyHz: number;
  colorHex: string;
  affirmation: string;
  benefit: string;
  bijaSound?: string;
  meaning?: string;
  targetChakra?: string;
  category?: string;
  harmonicNote?: string;
  benefits?: string;
  meditationGuide?: string;
}

export interface MythologicalElement {
  id: string;
  name: string;
  element: 'Ateş' | 'Su' | 'Hava' | 'Toprak' | 'Eter (Akaşa)';
  frequencyHz: number;
  colorHex: string;
  archetype: string;
  benefit: string;
  balancingAction: string;
  category?: string;
  elementSymbol?: string;
  attributes?: string;
  sanskritName?: string;
  effects?: string;
  sacredSound?: string;
}

export const EASTERN_MANTRAS: EasternMantra[] = [
  {
    id: 'lam',
    name: 'LAM (Kök Çakra / Muladhara)',
    sanskrit: 'लं',
    chakra: 'Muladhara',
    targetChakra: 'Muladhara (Kök Çakra)',
    bijaSound: 'LAM',
    harmonicNote: 'C (Do)',
    meaning: 'Köklenme ve güven titreşimi',
    category: 'Çakra Dengeleme',
    frequencyHz: 396,
    colorHex: '#ef4444',
    affirmation: 'Dünyaya ve hayata güvenle bağlıyım, güvendeyim.',
    benefit: 'Korku ve suçluluktan özgürleşme, topraklanma ve fiziksel canlılık.',
    benefits: 'Korku ve suçluluktan özgürleşme, topraklanma ve fiziksel canlılık.',
    meditationGuide: 'Kuyruk sokumuna odaklanıp kırmızı ışık imgeleyerek LAM sesini nefesle tekrarlayın.'
  },
  {
    id: 'vam',
    name: 'VAM (Sakral Çakra / Svadhisthana)',
    sanskrit: 'वं',
    chakra: 'Svadhisthana',
    targetChakra: 'Svadhisthana (Sakral Çakra)',
    bijaSound: 'VAM',
    harmonicNote: 'D (Re)',
    meaning: 'Akışkanlık ve yaratıcılık titreşimi',
    category: 'Prana Akışı',
    frequencyHz: 417,
    colorHex: '#f97316',
    affirmation: 'Duygularımı ve yaratıcılığımı özgürce ifade ediyorum.',
    benefit: 'Geçmiş travmaları çözme, duygusal denge ve cinsel/üretken enerji akışı.',
    benefits: 'Geçmiş travmaları çözme, duygusal denge ve cinsel/üretken enerji akışı.',
    meditationGuide: 'Göbek deliğinin altına turuncu ay ışığı odaklayarak VAM sesini rezone edin.'
  },
  {
    id: 'ram',
    name: 'RAM (Solar Pleksus / Manipura)',
    sanskrit: 'रं',
    chakra: 'Manipura',
    targetChakra: 'Manipura (Solar Pleksus)',
    bijaSound: 'RAM',
    harmonicNote: 'E (Mi)',
    meaning: 'İrade ve dönüşüm ateşi',
    category: 'Kundalini Uyumlama',
    frequencyHz: 528,
    colorHex: '#eab308',
    affirmation: 'İçsel gücümün ve irademin farkındayım.',
    benefit: 'Özgüven, sindirim ateşi ve kararlılık.',
    benefits: 'Özgüven, sindirim ateşi ve kararlılık.',
    meditationGuide: 'Mide bölgesinde parlayan sarı bir güneş canlandırıp RAM sesini titreştirin.'
  },
  {
    id: 'yam',
    name: 'YAM (Kalp Çakrası / Anahata)',
    sanskrit: 'यं',
    chakra: 'Anahata',
    targetChakra: 'Anahata (Kalp Çakrası)',
    bijaSound: 'YAM',
    harmonicNote: 'F (Fa)',
    meaning: 'Kayıtsız şartsız sevgi ve şefkat',
    category: 'Çakra Dengeleme',
    frequencyHz: 639,
    colorHex: '#10b981',
    affirmation: 'Kalbim evrensel sevgiye ve şifaya açık.',
    benefit: 'İlişkileri iyileştirme, affetme ve kalp ritmi uyumu.',
    benefits: 'İlişkileri iyileştirme, affetme ve kalp ritmi uyumu.',
    meditationGuide: 'Göğüs kafesi merkezine yeşil zümrüt ışık yerleştirip YAM tohum sesini zikredin.'
  },
  {
    id: 'ham',
    name: 'HAM (Boğaz Çakrası / Vishuddha)',
    sanskrit: 'हं',
    chakra: 'Vishuddha',
    targetChakra: 'Vishuddha (Boğaz Çakrası)',
    bijaSound: 'HAM',
    harmonicNote: 'G (Sol)',
    meaning: 'Doğruluk ve özgün ifade',
    category: 'Zihinsel Aydınlanma',
    frequencyHz: 741,
    colorHex: '#06b6d4',
    affirmation: 'Hakikati sevgiyle ve cesaretle ifade ediyorum.',
    benefit: 'İletişim tıkanıklıklarını açma, sezgisel berraklık.',
    benefits: 'İlişkisel iletişim tıkanıklıklarını açma, sezgisel berraklık.',
    meditationGuide: 'Boğaz merkezinde turkuaz bir gökyüzü vizyonuyla HAM sesini titreştirin.'
  },
  {
    id: 'om',
    name: 'AUM / OM (Üçüncü Göz / Ajna)',
    sanskrit: 'ॐ',
    chakra: 'Ajna',
    targetChakra: 'Ajna (Üçüncü Göz)',
    bijaSound: 'OM',
    harmonicNote: 'A (La)',
    meaning: 'Evrensel kozmik titreşim ve birlik şuuru',
    category: 'Zihinsel Aydınlanma',
    frequencyHz: 852,
    colorHex: '#6366f1',
    affirmation: 'İçsel bilgeliğime ve sezgilerime güveniyorum.',
    benefit: 'Yüksek sezgi, epifiz bezi aktivasyonu ve derin tefekkür.',
    benefits: 'Yüksek sezgi, epifiz bezi aktivasyonu ve derin tefekkür.',
    meditationGuide: 'İki kaş arasına koyu mavi bir yıldız yerleştirerek derin AUM sesini uzatın.'
  },
  {
    id: 'ah',
    name: 'AH / Sessiz Işık (Taç Çakra / Sahasrara)',
    sanskrit: 'अः',
    chakra: 'Sahasrara',
    targetChakra: 'Sahasrara (Taç Çakra)',
    bijaSound: 'AH / SO HAM',
    harmonicNote: 'B (Si)',
    meaning: 'İlahi vahdet ve kozmik kaynakla birleşme',
    category: 'Zihinsel Aydınlanma',
    frequencyHz: 963,
    colorHex: '#a855f7',
    affirmation: 'Kozmik kaynak ve yaratıcı nur ile birim.',
    benefit: 'Birlik bilinci, ilahi tecelli ve yüksek aydınlanma.',
    benefits: 'Birlik bilinci, ilahi tecelli ve yüksek aydınlanma.',
    meditationGuide: 'Başın tepesinde bin yapraklı mor-beyaz bir nilüfer çiçeğinin açıldığını imgeleyin.'
  }
];

export const MYTHOLOGICAL_ELEMENTS: MythologicalElement[] = [
  {
    id: 'agni',
    name: 'Agni (Kutsal Ateş)',
    element: 'Ateş',
    frequencyHz: 528,
    colorHex: '#ef4444',
    archetype: 'Dönüştürücü Ruh Ateşi & Solar Arketip',
    category: '5 Kadim Element',
    elementSymbol: '🔥',
    sanskritName: 'अग्नि (Agni)',
    attributes: 'Sindirim ateşi (Jatharagni), irade gücü, arınma ve metabolik canlılık.',
    benefit: 'Negatif yükleri yakarak hücresel seviyede arınma ve canlılık sağlar.',
    balancingAction: 'Solar Pleksus ve kan dolaşımı aktivasyonu.',
    effects: 'Kirlian plazma ışımasını hızlandırır, ataleti kırar.',
    sacredSound: 'RAM • 528 Hz Ateş Matrisi'
  },
  {
    id: 'varuna',
    name: 'Varuna (Kozmik Okyanus / Su)',
    element: 'Su',
    frequencyHz: 417,
    colorHex: '#3b82f6',
    archetype: 'Duygusal Akışkanlık & Ruhsal Şifa',
    category: '5 Kadim Element',
    elementSymbol: '💧',
    sanskritName: 'वरुण (Varuna)',
    attributes: 'Lenf akışı, duygusal esneklik, böbrek meridyeni dengesi ve dinginlik.',
    benefit: 'Duygusal katılıkları çözerek ruhsal esneklik ve içsel huzur kazandırır.',
    balancingAction: 'Sakral Çakra ve lenfatik drenaj uyarımı.',
    effects: 'Aura foton akışkanlığını artırır, stres gerilimini yatıştırır.',
    sacredSound: 'VAM • 417 Hz Su Matrisi'
  },
  {
    id: 'vayu',
    name: 'Vayu (Kozmik Nefes / Hava)',
    element: 'Hava',
    frequencyHz: 639,
    colorHex: '#10b981',
    archetype: 'Prana Taşıyıcısı & Kalp Genişlemesi',
    category: '5 Kadim Element',
    elementSymbol: '💨',
    sanskritName: 'वायु (Vayu)',
    attributes: 'Solunum ritmi, Prana dolaşımı, akciğer meridyeni ve sevgi kanalları.',
    benefit: 'Akciğer kapasitesini ve kalbin elektromanyetik alanını genişletir.',
    balancingAction: 'Kalp Çakrası ve diyafram serbestisi.',
    effects: 'Aura çapını genişletir, biyo-alan koheransını yükseltir.',
    sacredSound: 'YAM • 639 Hz Hava Matrisi'
  },
  {
    id: 'prithvi',
    name: 'Prithvi (Kutsal Toprak / Bhumi)',
    element: 'Toprak',
    frequencyHz: 396,
    colorHex: '#eab308',
    archetype: 'Köklenme, Madde & Beden Kalkanı',
    category: '5 Kadim Element',
    elementSymbol: '⛰️',
    sanskritName: 'पृथ्वी (Prithvi)',
    attributes: 'Kemik-iskelet dokusu, manyetik topraklanma ve fiziksel dayanıklılık.',
    benefit: 'Bedenin yerçekimi ve dünya manyetik alanıyla uyumlanmasını sağlar.',
    balancingAction: 'Kök Çakra ve bağ dokusu stabilitesi.',
    effects: 'Kirlian taban yoğunluğunu artırır, elektromanyetik kirliliği nötrler.',
    sacredSound: 'LAM • 396 Hz Toprak Matrisi'
  },
  {
    id: 'akasha',
    name: 'Akasha (Eter / Sonsuz Uzay)',
    element: 'Eter (Akaşa)',
    frequencyHz: 963,
    colorHex: '#8b5cf6',
    archetype: 'Kozmik Boşluk & Tevhid Alanı',
    category: 'Mitolojik Arketipler',
    elementSymbol: '🌌',
    sanskritName: 'आकाश (Akasha)',
    attributes: 'Kuantum bilgi alanı, epifiz sezgisi, sıfır noktası enerjisi.',
    benefit: 'Şuur genişlemesi ve kuantum rezonans alanıyla tam uyum.',
    balancingAction: 'Taç Çakra ve epifiz bezi aktivasyonu.',
    effects: 'Biyo-alan foton frekansını tepe noktasına taşır.',
    sacredSound: 'AUM • 963 Hz Eter Matrisi'
  }
];
