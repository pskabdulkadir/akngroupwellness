import { DiseaseHealingProtocol } from './types';

export const musculoskeletalDiseases: DiseaseHealingProtocol[] = [
  {
    id: 'lumbar_disc_hernia',
    name: 'Bel Fıtığı, Disk Dejenerasyonu & Siyatik Ağrısı',
    diseaseName: 'Bel Fıtığı, Disk Dejenerasyonu & Siyatik Ağrısı',
    system: 'Lumbosakral Omurga & Siyatik Sinir',
    category: 'İskelet, Eklem & Kas',
    primaryFrequency: 174,
    primaryFrequencyHz: 174,
    secondaryFrequencies: [528, 285, 396],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Cebbâr (206 Kez) - Yâ Kaviyy (116 Kez) - Yâ Metîn (500 Kez)',
    ayetRecommendation: 'İnşirâh Suresi 2-3. Ayetler (Senin o sırtını büken ağır yükünü indirmedik mi?)',
    culturalOrReligiousContext: 'Ağrıyı dondurarak hücreleri rahatlatan ve omurga dizilimini destekleyen 174 Hz temel Solfejyo anestezik frekansıdır.',
    binauralBeatHz: 7.83,
    carrierHz: 174,
    description: 'Paravertebral kas spazmını çözer, intervertebral disklerin hidrasyonunu ve siyatik sinir dekompresyonunu hızlandırır.',
    healingBenefits: 'Bacağa vuran batıcı siyatik ağrısını dindirir, bel omurlarındaki hareket açıklığını artırır.',
    symptoms: ['Belden kalçaya ve topuğa vuran ağrı', 'Uyuşma ve karıncalanma', 'Eğilirken kilitlenme', 'Sabah bel tutukluğu'],
    protocolSteps: [
      'Sert bir zemine sırtüstü uzanıp dizlerin altına kalın bir minder koyun (Psoas gevşeme pozisyonu).',
      '174 Hz + 7.83 Hz tonunu başlatıp bel bölgesini tamamen gevşetin.',
      'Nefes verirken belinizdeki basıncın toprağa aktığını hissedin.'
    ],
    affectedChakras: ['Kök Çakra (Muladhara)', 'Sakral Çakra'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Sabah kalkınca ve gece yatmadan önce',
      guidelines: 'Sert zeminde diz altı destekli psoas pozisyonunda uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Akut batıcı bacak ağrısında %50 hafifleme, hareket kolaylığı.',
      phase2Days8to21: 'Kas spazmları çözülür, sabah tutukluğu süresi 5 dakikaya iner.',
      phase3Days22Plus: 'Omurga disk elastikiyeti ve sinir iletiminde tam toparlanma.'
    }
  },
  {
    id: 'cervical_neck_pain',
    name: 'Boyun Fıtığı, Düzleşme & Omuz-Kol Uyuşması',
    diseaseName: 'Boyun Fıtığı, Düzleşme & Omuz-Kol Uyuşması',
    system: 'Servikal Omurga & Brakial Pleksus',
    category: 'İskelet, Eklem & Kas',
    primaryFrequency: 174,
    primaryFrequencyHz: 174,
    secondaryFrequencies: [528, 741, 432],
    secondaryFrequencyHz: 9.0,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Şâfî (391 Kez) - Yâ Cebbâr (206 Kez)',
    ayetRecommendation: 'Şuarâ Suresi 80. Ayet & Fatiha Suresi',
    culturalOrReligiousContext: 'Masa başı duruş bozuklukları ve stres kaynaklı boyun kilitlenmelerini çözen gevşetici akustik dalgadır.',
    binauralBeatHz: 9.0,
    carrierHz: 174,
    description: 'Trapez ve servikal kas gerginliğini giderir, kola giden sinir köklerindeki basıyı ve ödemi hafifletir.',
    healingBenefits: 'Kola yayılan elektriklenme hissini keser, başı sağa/sola çevirme açısını genişletir.',
    symptoms: ['Boyundan kürek kemiğine ve parmaklara vuran sızı', 'Ellerde uyuşma', 'Boyun sertliği', 'Baş ağrısı'],
    protocolSteps: [
      'Boyun altına rulo yapılmış küçük bir havlu koyarak uzanın.',
      '174 Hz frekansını dinlerken çenenizi hafifçe içeri çekip boyun arkasını uzatın.',
      'Omuzlarınızı kulaklarınızdan uzaklaştırıp serbest bırakın.'
    ],
    affectedChakras: ['Boğaz Çakrası (Vishuddha)', 'Kalp Çakrası'],
    soundscapePreset: 'rain',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 14,
      bestTimeOfDay: 'İş bitimi ve gece yatarken',
      guidelines: 'Boyun destekli ortopedik pozisyonda dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Boyun kaslarındaki sertlik yumuşar, kola vuran uyuşma azalır.',
      phase2Days8to21: 'Servikal hareket kabiliyeti açılır, omuz baskısı kalkar.',
      phase3Days22Plus: 'Doğal boyun kavisi ve duruş stabilitesi.'
    }
  },
  {
    id: 'osteoarthritis_knee',
    name: 'Diz Kireçlenmesi (Gonartroz), Menisküs & Sıvı Kaybı',
    diseaseName: 'Diz Kireçlenmesi (Gonartroz), Menisküs & Sıvı Kaybı',
    system: 'Eklem Kıkırdağı & Sinovyal Sıvı',
    category: 'İskelet, Eklem & Kas',
    primaryFrequency: 285,
    primaryFrequencyHz: 285,
    secondaryFrequencies: [528, 174, 432],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Muhyî (68 Kez) - Yâ Cebbâr (206 Kez) - Yâ Kâdir (305 Kez)',
    ayetRecommendation: 'Yâsîn Suresi 78-79. Ayetler (Çürümüş kemikleri kim diriltecek?... De ki: Onları ilk defa yaratan diriltecektir)',
    culturalOrReligiousContext: 'Hasarlı dokuların ve eklem kıkırdaklarının hücresel hafızasını yenileyen 285 Hz Solfejyo doku rejenerasyon frekansıdır.',
    binauralBeatHz: 7.83,
    carrierHz: 285,
    description: 'Kondrosit hücrelerinde kolajen Tip-2 sentezini stimüle eder, sinovyal sıvının viskozitesini artırır.',
    healingBenefits: 'Merdiven inip çıkarken oluşan batmayı engeller, dizdeki gıcırtı ve sürtünme hissini azaltır.',
    symptoms: ['Merdiven çıkarken dizde bıçak saplanması', 'Çömelip kalkamama', 'Dizde krepitasyon (gıcırtı)', 'Şişlik ve sıcaklık'],
    protocolSteps: [
      'Dizlerinizi rahat bir açıda uzatın.',
      '285 Hz frekansını dinlerken ellerinizi diz kapaklarınızın üzerine koyun.',
      'Diz ekleminin içine parlak mavi-yeşil bir şifa sıvısının dolduğunu imgeleyin.'
    ],
    affectedChakras: ['Kök Çakra'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Sabah ve akşam istirahat halindeyken',
      guidelines: 'Diz eklemine sıcak-ılık kompres sonrası uygulanması etkiyi artırır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Yürürken duyulan eklem ağrısı ve batma hissi belirgin azalır.',
      phase2Days8to21: 'Eklem sıvısı üretimi uyarılır, merdiven inip çıkma kolaylaşır.',
      phase3Days22Plus: 'Kıkırdak mikro-çatlaklarında hücresel yenilenme.'
    }
  },
  {
    id: 'fibromyalgia_pain',
    name: 'Fibromiyalji, Gezici Kas Ağrıları & Tetik Noktalar',
    diseaseName: 'Fibromiyalji, Gezici Kas Ağrıları & Tetik Noktalar',
    system: 'Merkezi Ağrı İşleme & Miyofasiyal Sistem',
    category: 'İskelet, Eklem & Kas',
    primaryFrequency: 174,
    primaryFrequencyHz: 174,
    secondaryFrequencies: [528, 639, 432],
    secondaryFrequencyHz: 5.5,
    recommendedDurationMinutes: 30,
    esmaRecommendation: 'Yâ Şâfî (391 Kez) - Yâ Latîf (129 Kez) - Yâ Selâm (131 Kez)',
    ayetRecommendation: 'İnşirâh Suresi & Fatiha Suresi',
    culturalOrReligiousContext: 'Tüm vücuda yayılmış gezici ağrıları dindiren, merkezi ağrı amplifikasyonunu sıfırlayan derin şifa frekansıdır.',
    binauralBeatHz: 5.5,
    carrierHz: 174,
    description: 'Santral duyarlılaşmayı (ağrı eşiğinin düşmesi) baskılar, fasyal dokudaki mikrosirkülasyonu canlandırır.',
    healingBenefits: 'Tetik nokta hassasiyetini düşürür, sabah yorgun uyanmayı ve tutukluğu engeller.',
    symptoms: ['Sırt, omuz ve kalçalarda yaygın ağrı', 'Dokunmaya aşırı hassasiyet', 'Dinlendirmeyen uyku', 'Hava değişimlerinde artan sızılar'],
    protocolSteps: [
      'Ilık bir duş sonrası yatağa uzanın.',
      '174 Hz + 5.5 Hz Teta frekansını kulaklıkla açın.',
      'Ağrıyan her noktaya nefes gönderip gerginliği serbest bırakın.'
    ],
    affectedChakras: ['Tüm Çakralar & Meridyen Ağı'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 30,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 40,
      bestTimeOfDay: 'Gece uyku öncesi',
      guidelines: 'Ilık duş sonrası sakin ve ılık bir ortamda uzanarak dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Tetik noktaların batma şiddetinde %40 azalma, uyku kalitesinde artış.',
      phase2Days8to21: 'Gezici kas sızıları seyrekleşir, günlük enerji seviyesi yükselir.',
      phase3Days22Plus: 'Merkezi ağrı duyarlılığında kalıcı normalleşme.'
    }
  },
  {
    id: 'heel_spur_plantar',
    name: 'Topuk Dikeni & Plantar Fasiit Ağrısı',
    diseaseName: 'Topuk Dikeni & Plantar Fasiit Ağrısı',
    system: 'Ayak Tabanı Fasyası & Kalkaneus Kemiği',
    category: 'İskelet, Eklem & Kas',
    primaryFrequency: 285,
    primaryFrequencyHz: 285,
    secondaryFrequencies: [174, 528, 432],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Cebbâr (206 Kez) - Yâ Şâfî (391 Kez)',
    ayetRecommendation: 'Şuarâ Suresi 80. Ayet',
    culturalOrReligiousContext: 'Ayak tabanındaki iltihaplı fasyayı onaran ve kalsiyum birikiminin yarattığı gerilimi çözen titreşimdir.',
    binauralBeatHz: 7.83,
    carrierHz: 285,
    description: 'Plantar fasyadaki mikroyırtıkları tamir eder, topuk kemiğine yapışma noktasındaki enflamasyonu söndürür.',
    healingBenefits: 'Sabah yataktan kalkarken yere basamama hissini ortadan kaldırır.',
    symptoms: ['Sabah ilk adımda topukta çivi batması hissi', 'Uzun süre oturduktan sonra kalkarken topuk acısı', 'Topukta hassasiyet'],
    protocolSteps: [
      'Ayak tabanınızın altına bir tenis topu veya su şişesi koyup hafifçe yuvarlayın.',
      '285 Hz doku onarım tonunu başlatın.',
      'Ayak tabanına doğru ılık kan ve oksijen aktığını tahayyül edin.'
    ],
    affectedChakras: ['Kök Çakra'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Sabah kalkmadan önce ve akşam istirahatinde',
      guidelines: 'Ayak tabanı germe egzersizleri ile birlikte uygulanması önerilir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Sabah ilk adımdaki şiddetli batma hissi hafifler.',
      phase2Days8to21: 'Gün boyu ayakta kalabilme süresi uzar, fasyadaki ödem çözülür.',
      phase3Days22Plus: 'Topuk dikeni çevresindeki enflamasyonun tamamen sönmesi.'
    }
  },
  {
    id: 'carpal_tunnel_hand',
    name: 'Karpal Tünel Sendromu, El Bileği Sinir Sıkışması & Parmak Uyuşması',
    diseaseName: 'Karpal Tünel Sendromu, El Bileği Sinir Sıkışması & Parmak Uyuşması',
    system: 'Median Sinir & Fleksör Retinakulum',
    category: 'İskelet, Eklem & Kas',
    primaryFrequency: 174,
    primaryFrequencyHz: 174,
    secondaryFrequencies: [285, 528, 741],
    secondaryFrequencyHz: 8.5,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Şâfî (391 Kez) - Yâ Latîf (129 Kez) - Yâ Cebbâr (206 Kez)',
    ayetRecommendation: 'İnşirâh Suresi & Fatiha Suresi',
    culturalOrReligiousContext: 'El bileğindeki sinir kanalını rahatlatan ve parmaklara hayat veren nörolojik gevşeme frekansıdır.',
    binauralBeatHz: 8.5,
    carrierHz: 174,
    description: 'Median sinir etrafındaki fleksör tendon kılıflarının ödemini çözer, tünel içi basıncı düşürür.',
    healingBenefits: 'Gece uykudan uyandıran el uyuşmalarını ve eşya düşürme hissini engeller.',
    symptoms: ['İlk 3 parmakta gece uyuşması', 'El bileğinde elektrik çarpması hissi', 'Kavrama gücünde zayıflık'],
    protocolSteps: [
      'Bileğinizi nötr pozisyonda tutacak şekilde masaya koyun.',
      '174 Hz frekansı dinlerken parmaklarınızı tek tek açıp kapatın.',
      'Bilek içine serinletici mavi bir ışığın dolduğunu hissedin.'
    ],
    affectedChakras: ['Kalp Çakrası', 'Boğaz Çakrası'],
    soundscapePreset: 'rain',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Bilgisayar/iş molalarında ve gece yatarken',
      guidelines: 'El bileği hafif esnetilerek uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Gece parmak uyuşması ile uyanmalar kesilir.',
      phase2Days8to21: 'Kavrama kuvveti geri döner, tünel ödemi geriler.',
      phase3Days22Plus: 'Median sinir iletim hızında tam iyileşme.'
    }
  },
  {
    id: 'scoliosis_posture_alignment',
    name: 'Skolyoz, Postür Bozukluğu, Sırt Eğriliği & Kas Dengesizliği',
    diseaseName: 'Skolyoz, Postür Bozukluğu, Sırt Eğriliği & Kas Dengesizliği',
    system: 'Aksiyel İskelet & Derin Omurga Kasları (Multifidus)',
    category: 'İskelet, Eklem & Kas',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [174, 432, 639],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Adl (104 Kez) - Yâ Müstakîm (Dosdoğru kılan) - Yâ Cebbâr (206 Kez)',
    ayetRecommendation: 'Fâtiha Suresi (İhdinas sırâtal mustakîm - Bizi dosdoğru yola ilet)',
    culturalOrReligiousContext: 'Omurganın göğe yükselen merkez kanalını (Sushumna) hizalayan ve kas asimetrilerini dengeleyen altın oran rezonansıdır.',
    binauralBeatHz: 7.83,
    carrierHz: 528,
    description: 'Omurga boyunca asimetrik kasılan kas zincirlerini simetrik tonusa kavuşturur, fasyal gerilimi eşitler.',
    healingBenefits: 'Sırt ve beldeki orantısız ağrıları dindirir, dik duruş farkındalığını artırır.',
    symptoms: ['Bir omuzun diğerinden yüksek durması', 'Tek taraflı sırt kamburluğu', 'Uzun süre ayakta durunca sırt ağrısı'],
    protocolSteps: [
      'Sırtınızı düz bir duvara yaslayarak topuk, kalça ve kürek kemiklerinizi temas ettirin.',
      '528 Hz frekansı eşliğinde omurganızı yukarıya doğru uzatın.',
      'Derin nefes alarak göğüs kafesini simetrik olarak şişirin.'
    ],
    affectedChakras: ['Kök Çakra', 'Kalp Çakrası', 'Taç Çakra'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 45,
      bestTimeOfDay: 'Sabah egzersizleri sonrası',
      guidelines: 'Duruş düzeltme egzersizleri ile entegre edilmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Tek taraflı sırt kası spazmı ve yanması yumuşar.',
      phase2Days8to21: 'Postüral diklik koruma süresi zahmetsizce uzar.',
      phase3Days22Plus: 'Kas hafızasında simetrik denge ve dik duruş.'
    }
  },
  {
    id: 'ankylosing_spondylitis_support',
    name: 'Ankilozan Spondilit & Sakroiliak Eklem Yangısı',
    diseaseName: 'Ankilozan Spondilit & Sakroiliak Eklem Yangısı',
    system: 'Sakroiliak Eklemler & Entezis Bölgeleri',
    category: 'İskelet, Eklem & Kas',
    primaryFrequency: 174,
    primaryFrequencyHz: 174,
    secondaryFrequencies: [528, 285, 432],
    secondaryFrequencyHz: 6.0,
    recommendedDurationMinutes: 30,
    esmaRecommendation: 'Yâ Selâm (131 Kez) - Yâ Şâfî (391 Kez) - Yâ Latîf (129 Kez)',
    ayetRecommendation: 'İnşirâh Suresi & Şuarâ Suresi 80. Ayet',
    culturalOrReligiousContext: 'Omurga kemikleşmesini ve sabah tutukluğunu çözmek için hücresel yangıyı dindiren derin rahatlama titreşimidir.',
    binauralBeatHz: 6.0,
    carrierHz: 174,
    description: 'Entezis bölgelerindeki otoimmün enflamasyonu yatıştırır, sakroiliak eklem hareket açıklığını korur.',
    healingBenefits: 'Sabahları 30+ dakika süren şiddetli bel-kalça tutukluğunu 10 dakikaya indirir.',
    symptoms: ['Sabah yataktan zorlukla kalkma', 'Kalçalarda yer değiştiren ağrı', 'Göğüs kafesi genişlemesinde kısıtlılık'],
    protocolSteps: [
      'Sabah kalkınca yatakta hafif germe hareketleri yapın.',
      '174 Hz frekansı çalarken sakroiliak bölgenize ılık kompres uygulayın.',
      'Her nefeste omurganızın esnek ve genç bir fidan gibi dalgalandığını hayal edin.'
    ],
    affectedChakras: ['Kök Çakra', 'Sakral Çakra'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 30,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 60,
      bestTimeOfDay: 'Sabah uyanınca ve akşam yatarken',
      guidelines: 'Düzenli solunum ve esneme egzersizleri ile uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Sabah tutukluğunun çözülme süresi yarıya iner.',
      phase2Days8to21: 'Sakroiliak eklem yangısı hafifler, gece uykudan uyandıran ağrılar biter.',
      phase3Days22Plus: 'Omurga hareketliliği ve esnekliğinin korunması.'
    }
  }
];
