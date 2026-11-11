export interface DetailedColorAnalysis {
  id: string;
  name: string;
  turkishName: string;
  hex: string;
  secondaryHex?: string;
  frequencyRangeHz: string;
  chakraCorrelation: string;
  letaifCorrelation: string;
  element: string;
  archetype: string;
  spiritualMeaning: string;
  mentalEmotionalState: string;
  ethericBodyImpact: string;
  balancedTraits: string[];
  disharmonySigns: string[];
  recommendedFrequencies: { name: string; hz: number; type: 'esma' | 'solfeggio' | 'mantra' }[];
  affirmation: string;
  holisticGuidance: string;
}

export const DETAILED_COLOR_ANALYSIS_LIST: DetailedColorAnalysis[] = [
  {
    id: 'pure_white',
    name: 'Pure White Light',
    turkishName: 'Saf Beyaz Işık (Tevhid & Kuddûs Nuru)',
    hex: '#f8fafc',
    frequencyRangeHz: '963 - 1080 Hz',
    chakraCorrelation: 'Taç Çakra (Sahasrara)',
    letaifCorrelation: 'Sır Letaifi & Letaif-i Külliye',
    element: 'Eter / Nur-ı Mutlak',
    archetype: 'Arınmış Bilinç & Tevhid',
    spiritualMeaning: 'En yüksek titreşimli ışıma katmanıdır. Ruhun dünyevi yüklerden arınarak ilahi kaynağa tam teslimiyetini ve saf koruma kalkanını temsil eder. Âlem-i Emr ile doğrudan irtibat halindedir.',
    mentalEmotionalState: 'Kusursuz zihinsel sükûnet, içsel dinginlik ve teslimiyet hali. Korku ve dünyevi kaygıların tamamen eridiği, derin bir hakikat idraki.',
    ethericBodyImpact: 'Biyofoton emisyonunu en yüksek tutarlılık (Coherence) düzeyine ulaştırır. Tüm hücre zarlarını ve manyetik alanı negatif dış etkilere karşı bir ışık zırhı gibi sarar.',
    balancedTraits: ['Manevi Sezgi', 'Tam Teslimiyet', 'Kusursuz Kalkan', 'Derin Dinginlik'],
    disharmonySigns: ['Dünyadan kopma hissi', 'Aşırı soyutlanma', 'Topraklanma eksikliği'],
    recommendedFrequencies: [
      { name: 'Allâh (963 Hz)', hz: 963, type: 'esma' },
      { name: 'El-Kuddûs (741 Hz)', hz: 741, type: 'esma' },
      { name: 'Sahasrara AUM (963 Hz)', hz: 963, type: 'mantra' }
    ],
    affirmation: 'İlahi nurun ve hakikatin huzurunda arınıyor, saf şifayı kabul ediyorum.',
    holisticGuidance: 'Bu ışımanın kalıcı olması için günlük 10 dakika topraklanma (çıplak ayakla çim/toprak teması) ve 963 Hz Tevhid zikri uygulayınız.'
  },
  {
    id: 'platinum_silver',
    name: 'Platinum Silver',
    turkishName: 'Platin Gümüş (Manevi Kalkan & Sezgi Aynası)',
    hex: '#e2e8f0',
    frequencyRangeHz: '852 - 963 Hz',
    chakraCorrelation: 'Üçüncü Göz & Taç Çakra',
    letaifCorrelation: 'Hafî & Sır Letaifi',
    element: 'Eter & Kozmik Işık',
    archetype: 'İçsel Basiret & Aynalık',
    spiritualMeaning: 'Negatif enerjileri anında yansıtan bir ayna işlevi görür. Manevi derinlik, feyiz ve saf sezgisel iletişim kanalının açık olduğuna işaret eder.',
    mentalEmotionalState: 'Yüksek odaklanma, berrak rüyalar ve olayların arka planını sezme kabiliyeti. Zihinsel karmaşadan uzak, net ve objektif bakış açısı.',
    ethericBodyImpact: 'Epifiz bezi ve merkezi sinir sisteminde biyoelektrik denge sağlar. Aurik tabakadaki mikro yırtıkları ve enerji sızıntılarını onarır.',
    balancedTraits: ['Güçlü Sezgi', 'Negatifi Yansıtma', 'Telepatik Duyarlılık', 'Berrak Hafıza'],
    disharmonySigns: ['Aşırı zihinsel yorgunluk', 'Uykusuzluk', 'Duygusal mesafelilik'],
    recommendedFrequencies: [
      { name: 'En-Nûr (852 Hz)', hz: 852, type: 'esma' },
      { name: '852 Hz Solfeggio', hz: 852, type: 'solfeggio' },
      { name: 'Ajna OM (852 Hz)', hz: 852, type: 'mantra' }
    ],
    affirmation: 'Zihnim berrak bir ayna gibi hakikati yansıtır; korunuyor ve aydınlanıyorum.',
    holisticGuidance: 'Gece uyku öncesi lavanta esansı ve 852 Hz akustik rezonans ile zihinsel detoks yapılması önerilir.'
  },
  {
    id: 'violet_purple',
    name: 'Violet Purple',
    turkishName: 'Menekşe & Mor (Kozmik İdrak & Bilgelik)',
    hex: '#8b5cf6',
    frequencyRangeHz: '852 - 963 Hz',
    chakraCorrelation: 'Taç Çakra (Sahasrara)',
    letaifCorrelation: 'Ahfâ & Ruh Letaifi',
    element: 'Işık / Akıl-ı Küll',
    archetype: 'Manevi Rehberlik & Yüksek Bilinç',
    spiritualMeaning: 'İlahi ilhamların, manevi keşiflerin ve evrensel bilgeliğin rengidir. Kişinin yüksek benliğiyle ve manevi rehberliğiyle güçlü bir bağ içinde olduğunu gösterir.',
    mentalEmotionalState: 'Geniş vizyon, yüksek idealler ve derin felsefi/manevi tefekkür. Dünyevi geçici heveslerden sıyrılıp kalıcı hakikatlere yönelme hali.',
    ethericBodyImpact: 'Korteks nöronları ve hipofiz-epifiz eksenini uyararak seratonin ve melatonin salınımını dengeler. Biyo-alanın üst kubbesini güçlendirir.',
    balancedTraits: ['Yüksek Bilgelik', 'İlham Vericilik', 'Manevi Asalet', 'Ruhsal Uyanış'],
    disharmonySigns: ['Gerçeklikten kopma', 'Aşırı kibir veya gurur', 'Yalnızlık hissi'],
    recommendedFrequencies: [
      { name: 'El-Aliyy (963 Hz)', hz: 963, type: 'esma' },
      { name: '963 Hz Solfeggio', hz: 963, type: 'solfeggio' },
      { name: 'Sahasrara Tevhid (963 Hz)', hz: 963, type: 'mantra' }
    ],
    affirmation: 'Evrensel bilgeliğe açığım; ruhum hakikatle besleniyor.',
    holisticGuidance: 'Sabah saatlerinde 15 dakika derin tefekkür veya nefes egzersizi ile bu yüksek rezonansı koruyunuz.'
  },
  {
    id: 'indigo_blue',
    name: 'Indigo Blue',
    turkishName: 'Çivit Mavisi & İndigo (Basiret & 3. Göz)',
    hex: '#6366f1',
    frequencyRangeHz: '741 - 852 Hz',
    chakraCorrelation: 'Üçüncü Göz (Ajna)',
    letaifCorrelation: 'Nefs-i Nâtıka & Sır Letaifi',
    element: 'Işık & Sezgi',
    archetype: 'Gören Göz & İçgörü',
    spiritualMeaning: 'İçsel gözün (Basiret) ve altıncı hissin aktif olduğunu belirtir. Hakikati zahir ve batın yönüyle kavrama kabiliyetini temsil eder.',
    mentalEmotionalState: 'Güçlü konsantrasyon, derin sezgisel anlama ve illüzyonları delip geçme kabiliyeti. Doğruyu yanlıştan hızla ayırt edebilme.',
    ethericBodyImpact: 'Gözler, alın sinüsleri ve baş bölgesindeki elektromanyetik basıncı regüle eder. Zihinsel yorgunluğu azaltır.',
    balancedTraits: ['Keskin Basiret', 'Doğru Sezgiler', 'Güçlü Hafıza', 'Manevi Derinlik'],
    disharmonySigns: ['Göz yorgunluğu', 'Sinüs tıkanıklığı', 'Kabuslar veya aşırı zihinsel kurgular'],
    recommendedFrequencies: [
      { name: 'El-Basîr (852 Hz)', hz: 852, type: 'esma' },
      { name: 'En-Nûr (852 Hz)', hz: 852, type: 'esma' },
      { name: 'Ajna OM (852 Hz)', hz: 852, type: 'mantra' }
    ],
    affirmation: 'İçsel gözüm açık; hakikati tüm berraklığıyla görüyorum.',
    holisticGuidance: 'Mavi ışık yayan ekranlardan dinlenme araları verip mavi kantaşı veya lapis lazuli rezonansı ile destekleyiniz.'
  },
  {
    id: 'sky_blue',
    name: 'Sky Blue / Turquoise',
    turkishName: 'Gök Mavisi & Turkuaz (Hakikat Beyanı & Selamet)',
    hex: '#06b6d4',
    frequencyRangeHz: '639 - 741 Hz',
    chakraCorrelation: 'Boğaz Çakrası (Vishuddha)',
    letaifCorrelation: 'Hafî Letaifi',
    element: 'Eter / Akasya',
    archetype: 'Dürüst İfade & Şifa Sesi',
    spiritualMeaning: 'İçsel hakikatin dış dünyaya berrak, dürüst ve şefkatli bir dille aktarılmasıdır. Selamet, esenlik ve ruhsal arınma titreşimidir.',
    mentalEmotionalState: 'Sakin, barışçıl ve etkileyici iletişim yeteneği. Duyguları bastırmadan, nezaketle ve cesaretle ifade edebilme gücü.',
    ethericBodyImpact: 'Tiroid bezi, ses telleri ve boyun omurlarını destekler. Boğazdaki enerji tıkanıklıklarını açar.',
    balancedTraits: ['Akıcı İfade', 'Doğruluk', 'İçsel Huzur', 'Sanatsal Yetenek'],
    disharmonySigns: ['Duyguları içine atma', 'Boğaz düğümlenmesi', 'İfade edememe korkusu'],
    recommendedFrequencies: [
      { name: 'Es-Selâm (432 Hz)', hz: 432, type: 'esma' },
      { name: 'El-Kuddûs (741 Hz)', hz: 741, type: 'esma' },
      { name: 'Vishuddha HAM (741 Hz)', hz: 741, type: 'mantra' }
    ],
    affirmation: 'Hakikati sevgiyle ve cesaretle ifade ediyorum; sesim şifadır.',
    holisticGuidance: 'Günde 2 litre canlandırılmış alkali su içiniz ve 741 Hz frekansı eşliğinde boğaz bölgenize odaklanarak derin nefes alınız.'
  },
  {
    id: 'emerald_green',
    name: 'Emerald Green',
    turkishName: 'Zümrüt Yeşili (Kalp Şifası & Hücresel Yenilenme)',
    hex: '#10b981',
    frequencyRangeHz: '528 - 639 Hz',
    chakraCorrelation: 'Kalp Çakrası (Anahata)',
    letaifCorrelation: 'Ahfâ & Kalp Letaifi',
    element: 'Hava & Canlılık',
    archetype: 'Şifacı & Koşulsuz Sevgi',
    spiritualMeaning: 'Evrensel şifa frekansının doruk noktasıdır. Kalp inşirahı, hücresel yenilenme, merhamet ve ilahi muhabbetin tecellisidir.',
    mentalEmotionalState: 'Geniş bir empati, affedicilik, iç huzur ve sevgi genişliği. Kin, nefret ve geçmiş kırgınlıkların şifalanması.',
    ethericBodyImpact: 'Timus bezini aktive ederek lökosit ve bağışıklık fonksiyonlarını kuvvetlendirir. Kalp ritmini (HRV) ve kan dolaşımını dengeler.',
    balancedTraits: ['Derin Merhamet', 'Hücresel Şifa', 'Empati', 'Koşulsuz Sevgi'],
    disharmonySigns: ['Aşırı fedakarlıkla tükenme', 'Kırgınlıkları bırakamama', 'Göğüs baskısı'],
    recommendedFrequencies: [
      { name: 'Eş-Şâfî (528 Hz)', hz: 528, type: 'esma' },
      { name: 'Er-Rahmân (528 Hz)', hz: 528, type: 'esma' },
      { name: '528 Hz DNA Onarımı', hz: 528, type: 'solfeggio' },
      { name: 'Anahata YAM (639 Hz)', hz: 639, type: 'mantra' }
    ],
    affirmation: 'Kalbim sonsuz şifaya ve ilahi muhabbete açıktır; affediyor ve yenileniyorum.',
    holisticGuidance: 'Her gün 15 dakika 528 Hz frekansı dinleyerek kalp bölgesinde zümrüt yeşili bir ışık küresinin genişlediğini tefekkür ediniz.'
  },
  {
    id: 'rose_pink',
    name: 'Rose Pink',
    turkishName: 'Gül Pembesi (İlahi Muhabbet & Şefkat)',
    hex: '#ec4899',
    frequencyRangeHz: '528 - 639 Hz',
    chakraCorrelation: 'Yüksek Kalp (Timus)',
    letaifCorrelation: 'Ruh & Kalp Letaifi',
    element: 'Hava & Aşk Nuru',
    archetype: 'Şefkatli Kalp & Zarafet',
    spiritualMeaning: 'Nezaket, incelik ve ilahi aşkın naif ışımasıdır. Kişinin hem kendisine hem de tüm yaratılmışlara derin bir şefkat duyduğunu gösterir.',
    mentalEmotionalState: 'Duygusal yaraların kabuk bağlayıp iyileşmesi. İçsel barış, zarafet, affetme sevinci ve sevgi dolu ilişkiler kurma kabiliyeti.',
    ethericBodyImpact: 'Kılcal damar dolaşımını ve doku esnekliğini artırır. Kalp çevresindeki gergin kas liflerini gevşetir.',
    balancedTraits: ['Zarafet', 'Derin Şefkat', 'Duygusal İyileşme', 'Huzurlu İlişkiler'],
    disharmonySigns: ['Alınganlık', 'Duygusal bağımlılık', 'Kırılganlık'],
    recommendedFrequencies: [
      { name: 'El-Vedûd (639 Hz)', hz: 639, type: 'esma' },
      { name: 'Er-Rahîm (639 Hz)', hz: 639, type: 'esma' },
      { name: '639 Hz Harmoni', hz: 639, type: 'solfeggio' }
    ],
    affirmation: 'Kendimi ve herkesi sevgiyle kabul ediyorum; sevgim ilahi kaynaktan beslenir.',
    holisticGuidance: 'Gül suyu ve 639 Hz frekans eşliğinde kalp odaklı nefes meditasyonu yapınız.'
  },
  {
    id: 'golden_yellow',
    name: 'Golden Yellow',
    turkishName: 'Altın Sarısı (Güneş & İrade Ateşi)',
    hex: '#eab308',
    frequencyRangeHz: '432 - 528 Hz',
    chakraCorrelation: 'Solar Pleksus (Manipura)',
    letaifCorrelation: 'Kalp Letaifi (Sarı Nur)',
    element: 'Ateş & Güneş',
    archetype: 'İrade, Özgüven & Liderlik',
    spiritualMeaning: 'Ruhsal özgüvenin, ilmin, zihinsel aydınlanmanın ve yaşam amacını hayata geçirme kudretinin ışımasıdır. Güneş gibi aydınlatıcıdır.',
    mentalEmotionalState: 'Yüksek motivasyon, kararlılık, güçlü sindirim ateşi ve zihinsel berraklık. Kendi sınırlarını bilerek güvenle adım atabilme.',
    ethericBodyImpact: 'Mide, pankreas, karaciğer ve sindirim meridyenlerini canlandırır. Hücresel enerji metabolizmasını hızlandırır.',
    balancedTraits: ['Güçlü İrade', 'Manevi Özgüven', 'Neşe & Canlılık', 'Çalışma Disiplini'],
    disharmonySigns: ['Öfke patlamaları', 'Mide yanması', 'Aşırı kontrolcülük veya çaresizlik hissi'],
    recommendedFrequencies: [
      { name: 'El-Azîz (528 Hz)', hz: 528, type: 'esma' },
      { name: 'El-Bâsıt (417 Hz)', hz: 417, type: 'esma' },
      { name: 'Manipura RAM (528 Hz)', hz: 528, type: 'mantra' }
    ],
    affirmation: 'İçimdeki ilahi güç ve irade aktiftir; yaşamımı güvenle inşa ediyorum.',
    holisticGuidance: 'Sabah güneşiyle 10 dakika temas ediniz ve sarı renkli doğal gıdalarla beslenmeyi destekleyiniz.'
  },
  {
    id: 'warm_orange',
    name: 'Warm Amber Orange',
    turkishName: 'Canlı Turuncu (Üretkenlik & Duygusal Akış)',
    hex: '#f97316',
    frequencyRangeHz: '417 - 432 Hz',
    chakraCorrelation: 'Sakral Çakra (Svadhisthana)',
    letaifCorrelation: 'Âlem-i Halk / Duygu Merkezi',
    element: 'Su & Akış',
    archetype: 'Yaratıcı Sanatçı & Hayat Coşkusu',
    spiritualMeaning: 'Yaşam coşkusu, üretkenlik, duygusal esneklik ve yaratıcı ilhamların akışıdır. Su gibi engellerin etrafından akıp gitme kabiliyetidir.',
    mentalEmotionalState: 'Yaşamdan zevk alma, pozitif adaptasyon kabiliyeti, sanatsal üretim şevki ve geçmiş travmalardan kolayca arınabilme.',
    ethericBodyImpact: 'Böbrekler, üreme organları, lenf drenajı ve vücut sıvı dengesini düzenler. Duygusal blokajları çözer.',
    balancedTraits: ['Yüksek Yaratıcılık', 'Duygusal Esneklik', 'Yaşam Sevinci', 'Sosyal Uyum'],
    disharmonySigns: ['Suçluluk duygusu', 'Yaratıcı kısırlık', 'Duygusal donukluk veya aşırı taşkınlık'],
    recommendedFrequencies: [
      { name: 'El-Musavvir (639 Hz)', hz: 639, type: 'esma' },
      { name: '417 Hz Travma Temizliği', hz: 417, type: 'solfeggio' },
      { name: 'Svadhisthana VAM (417 Hz)', hz: 417, type: 'mantra' }
    ],
    affirmation: 'Duygularım özgürce akıyor; hayatın coşkusunu ve bereketini kutluyorum.',
    holisticGuidance: 'Su tüketimini artırınız, hareket ve ritmik nefes çalışmalarıyla sakral merkezi canlandırınız.'
  },
  {
    id: 'ruby_red',
    name: 'Ruby Red',
    turkishName: 'Yakut Kırmızısı (Köklenme & Hayat Gücü)',
    hex: '#ef4444',
    frequencyRangeHz: '396 - 417 Hz',
    chakraCorrelation: 'Kök Çakra (Muladhara)',
    letaifCorrelation: 'Ruh Letaifi (Kırmızı Nur) & Cesaret',
    element: 'Toprak & Kök',
    archetype: 'Sarsılmaz Dayanak & Canlılık',
    spiritualMeaning: 'Fiziksel bedenin dünyaya sarsılmaz köklerle bağlanması, hayatta kalma gücü, cesaret ve ilahi güven duygusudur.',
    mentalEmotionalState: 'Korkusuzluk, istikrar, güçlü pratik zeka ve hedefleri fiziksel dünyada gerçekleştirebilme dayanıklılığı.',
    ethericBodyImpact: 'Omurga kökü, kemikler, bacaklar, böbreküstü bezleri ve hücresel hemoglobin üretimini destekler.',
    balancedTraits: ['Sarsılmaz Güven', 'Fiziksel Canlılık', 'Cesaret', 'Maddi İstikrar'],
    disharmonySigns: ['Gelecek korkusu', 'Güvensizlik', 'Kronik halsizlik veya kabızlık'],
    recommendedFrequencies: [
      { name: 'El-Mü\'min (396 Hz)', hz: 396, type: 'esma' },
      { name: 'El-Kaviyy (396 Hz)', hz: 396, type: 'esma' },
      { name: '396 Hz Köklenme', hz: 396, type: 'solfeggio' },
      { name: 'Muladhara LAM (396 Hz)', hz: 396, type: 'mantra' }
    ],
    affirmation: 'Güvendeyim, dünyada kökleniyorum ve ilahi kudretle destekleniyorum.',
    holisticGuidance: 'Doğada yürüyüş yapınız, kırmızı pancar ve kök sebzeler tüketiniz; 396 Hz ile kök çakrayı dengeleyiniz.'
  }
];

export function getDetailedColorAnalysis(colorNameOrHex?: string): DetailedColorAnalysis {
  const query = (colorNameOrHex || '').toLowerCase();
  
  if (query.includes('beyaz') || query.includes('white') || query.includes('tevhid') || query.includes('#f') || query.includes('#fff')) {
    return DETAILED_COLOR_ANALYSIS_LIST[0];
  }
  if (query.includes('gümüş') || query.includes('silver') || query.includes('platin') || query.includes('#e2')) {
    return DETAILED_COLOR_ANALYSIS_LIST[1];
  }
  if (query.includes('mor') || query.includes('violet') || query.includes('purple') || query.includes('menekşe') || query.includes('#8b') || query.includes('#a8')) {
    return DETAILED_COLOR_ANALYSIS_LIST[2];
  }
  if (query.includes('indigo') || query.includes('lacivert') || query.includes('çivit') || query.includes('#63') || query.includes('#4f')) {
    return DETAILED_COLOR_ANALYSIS_LIST[3];
  }
  if (query.includes('mavi') || query.includes('blue') || query.includes('turkuaz') || query.includes('cyan') || query.includes('#06') || query.includes('#38')) {
    return DETAILED_COLOR_ANALYSIS_LIST[4];
  }
  if (query.includes('yeşil') || query.includes('green') || query.includes('zümrüt') || query.includes('#10') || query.includes('#05')) {
    return DETAILED_COLOR_ANALYSIS_LIST[5];
  }
  if (query.includes('pembe') || query.includes('pink') || query.includes('gül') || query.includes('#ec') || query.includes('#f4')) {
    return DETAILED_COLOR_ANALYSIS_LIST[6];
  }
  if (query.includes('sarı') || query.includes('yellow') || query.includes('altın') || query.includes('gold') || query.includes('#ea') || query.includes('#f5')) {
    return DETAILED_COLOR_ANALYSIS_LIST[7];
  }
  if (query.includes('turuncu') || query.includes('orange') || query.includes('amber') || query.includes('#f9') || query.includes('#ea580c')) {
    return DETAILED_COLOR_ANALYSIS_LIST[8];
  }
  if (query.includes('kırmızı') || query.includes('red') || query.includes('yakut') || query.includes('#ef') || query.includes('#dc') || query.includes('#b9')) {
    return DETAILED_COLOR_ANALYSIS_LIST[9];
  }
  
  // Default to Emerald Green
  return DETAILED_COLOR_ANALYSIS_LIST[5];
}
