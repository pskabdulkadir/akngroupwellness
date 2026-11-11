import { DiseaseHealingProtocol } from './types';

export const immuneRespiratoryDiseases: DiseaseHealingProtocol[] = [
  {
    id: 'asthma_bronchitis',
    name: 'Astım, Bronşit, Hırıltılı Solunum & Nefes Darlığı',
    diseaseName: 'Astım, Bronşit, Hırıltılı Solunum & Nefes Darlığı',
    system: 'Bronşiyal Ağaç & Alveoller',
    category: 'Solunum & Akciğer',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [528, 639, 432],
    secondaryFrequencyHz: 8.0,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Bâsıt (72 Kez) - Yâ Muhyî (68 Kez) - Yâ Selâm (131 Kez)',
    ayetRecommendation: 'İnşirâh Suresi (Elem neşrah leke sadrak - Biz senin göğsünü açıp genişletmedik mi?)',
    culturalOrReligiousContext: 'Göğüs darlığını ferahlatan, akciğer kapasitesini artıran ve solunum yollarını temizleyen Solfejyo 741 Hz arınma tonudur.',
    binauralBeatHz: 8.0,
    carrierHz: 741,
    description: 'Bronşiyal düz kas spazmını çözer, mukus sekresyonunu sıvılaştırarak akciğerlerden tahliyesini kolaylaştırır.',
    healingBenefits: 'Göğüsteki ıslık/hırıltı sesini keser, derin ve engelsiz nefes almayı sağlar.',
    symptoms: ['Nefes alıp verirken hırıltı', 'Göğüste daralma ve baskı', 'Gece tutan öksürük krizleri', 'Çabuk nefes nefese kalma'],
    protocolSteps: [
      'Dik oturun, omuzları rahat bırakın.',
      '741 Hz frekansı dinlerken burnunuzdan 4 saniyede nefes alıp akciğerlerinizi tamamen hava ile doldurun.',
      'Dudaklarınızı büzerek 6 saniyede yavaşça üfleyin.'
    ],
    affectedChakras: ['Kalp Çakrası (Anahata)', 'Boğaz Çakrası'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Sabah erken saatlerde ve akşam yatmadan önce',
      guidelines: 'Temiz havalandırılmış bir odada dik oturarak uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Hırıltılı solunum ve gece öksürükleri hafifler.',
      phase2Days8to21: 'Akciğer vital kapasitesi artar, bronş aşırı duyarlılığı azalır.',
      phase3Days22Plus: 'Solunum yollarında tam rahatlama ve ferahlık.'
    }
  },
  {
    id: 'sinusitis_rhinitis',
    name: 'Kronik Sinüzit, Burun Tıkanıklığı & Geniz Akıntısı',
    diseaseName: 'Kronik Sinüzit, Burun Tıkanıklığı & Geniz Akıntısı',
    system: 'Paranazal Sinüsler & Nazal Mukoza',
    category: 'Solunum & Akciğer',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [852, 528, 174],
    secondaryFrequencyHz: 10.0,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Kuddûs (170 Kez) - Yâ Şâfî (391 Kez) - Yâ Fettâh (489 Kez)',
    ayetRecommendation: 'Fatiha Suresi & İnşirâh Suresi',
    culturalOrReligiousContext: 'Sinüs kanallarındaki katılaşmış mukusu titreştirerek açan ve kafa içi basıncı boşaltan 741 Hz tonudur.',
    binauralBeatHz: 10.0,
    carrierHz: 741,
    description: 'Nazal mukozadaki silia hareketini hızlandırır, ostium sinüs kanallarının drenajını sağlayarak iltihabı boşaltır.',
    healingBenefits: 'Göz ve alın bölgesindeki zonklayıcı ağırlığı yok eder, burundan rahat nefes almayı sağlar.',
    symptoms: ['Alında ve elmacık kemiklerinde dolgunluk ağrısı', 'Sürekli burun tıkanıklığı', 'Sarı-yeşil geniz akıntısı', 'Koku kaybı'],
    protocolSteps: [
      'Tuzlu su ile burun yıkaması yapın.',
      '741 Hz frekansı dinlerken elmacık kemikleri ve kaş arasına hafifçe parmak uçlarıyla vuruş (tapping) yapın.',
      'Sinüs kanallarının berrak su gibi aktığını hayal edin.'
    ],
    affectedChakras: ['Üçüncü Göz (Ajna)', 'Boğaz Çakrası'],
    soundscapePreset: 'rain',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 14,
      bestTimeOfDay: 'Sabah ve akşam sinüs temizliği sonrası',
      guidelines: 'Nazal buhar banyosu veya tuzlu su lavajı sonrası önerilir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Sinüs boşlukları drene olmaya başlar, alın basıncı düşer.',
      phase2Days8to21: 'Burun solunumu tamamen açılır, koku duyusu geri gelir.',
      phase3Days22Plus: 'Sinüs mukozasında kronik yangının temizlenmesi.'
    }
  },
  {
    id: 'copd_lung_regeneration',
    name: 'KOAH, Akciğer Yıpranması, Sigara Hasarı & Alveol Onarımı',
    diseaseName: 'KOAH, Akciğer Yıpranması, Sigara Hasarı & Alveol Onarımı',
    system: 'Alveolokapiller Membran & Gaz Değişimi',
    category: 'Solunum & Akciğer',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [741, 639, 285],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Muhyî (68 Kez) - Yâ Bâsıt (72 Kez) - Yâ Hâdî (20 Kez)',
    ayetRecommendation: 'İnşirâh Suresi & Fatiha Suresi',
    culturalOrReligiousContext: 'Akciğer dokusunun hücresel DNA onarımını ve oksijen bağlama kapasitesini artıran 528 Hz yenileyici frekanstır.',
    binauralBeatHz: 7.83,
    carrierHz: 528,
    description: 'Alveoler makrofajların temizleme aktivitesini uyarır, elastaz enzim aktivitesini dengeleyerek elastik dokuyu korur.',
    healingBenefits: 'Kandaki oksijen satürasyonunu (%SpO2) destekler, efor kapasitesini artırır.',
    symptoms: ['Azıcık yürüyünce tıkanma', 'Kronik balgamlı sabah öksürüğü', 'Göğüste hapsolan hava hissi'],
    protocolSteps: [
      'Gevşeyerek arkanıza yaslanın.',
      '528 Hz frekansı eşliğinde diyaframınızı şişirerek nazikçe nefes alın.',
      'Akciğerlerinizin taze sabah ormanı gibi pembeleştiğini hayal edin.'
    ],
    affectedChakras: ['Kalp Çakrası', 'Boğaz Çakrası'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 60,
      bestTimeOfDay: 'Sabah ve ikindi saatleri',
      guidelines: 'Büzük dudak nefes egzersizi ile birlikte uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Sabah balgam sökme kolaylaşır, göğüs ferahlar.',
      phase2Days8to21: 'Yürüyüş mesafesi uzar, oksijenlenme hissi güçlenir.',
      phase3Days22Plus: 'Alveoler gaz değişim konforunda belirgin yükselme.'
    }
  },
  {
    id: 'immune_strengthen_rife',
    name: 'Düşük Bağışıklık, Sık Hastalanma & Lökosit Aktivasyonu',
    diseaseName: 'Düşük Bağışıklık, Sık Hastalanma & Lökosit Aktivasyonu',
    system: 'İmmün Sistem & Kemik İliği / Timus',
    category: 'Bağışıklık & Hücresel',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [852, 741, 963],
    secondaryFrequencyHz: 10.0,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Kaviyy (116 Kez) - Yâ Hâfız (998 Kez) - Yâ Mâni (161 Kez)',
    ayetRecommendation: 'Âyet-el Kûrsî & İhlâs Suresi',
    culturalOrReligiousContext: 'Timus bezini aktive ederek bedenin biyo-kalkanını güçlendiren yüksek titreşimli şifa enerjisidir.',
    binauralBeatHz: 10.0,
    carrierHz: 528,
    description: 'Doğal katil (NK) hücrelerini ve T-lenfosit aktivitesini güçlendirir, immünoglobulin üretimini destekler.',
    healingBenefits: 'Mevsimsel hastalıklara yakalanma riskini azaltır, hastalık süresini yarı yarıya kısaltır.',
    symptoms: ['Sık sık grip/soğuk algınlığına yakalanma', 'Yavaş iyileşen yaralar', 'Sürekli yorgunluk ve kırgınlık'],
    protocolSteps: [
      'Göğüs kemiğinizin ortasına (Timus bezi) parmak uçlarınızla hafifçe 20 kez vurun.',
      '528 Hz tonunu dinlerken etrafınızda altın renkli geçilmez bir koruyucu kalkan imgeleyin.',
      'C vitamini ve propolis ile destekleyin.'
    ],
    affectedChakras: ['Kalp Çakrası (Timus)', 'Solar Pleksus'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Sabah güne başlarken',
      guidelines: 'Timus bezi uyarımı (hafif vuruşlar) eşliğinde dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Vücut kırgınlığı ve halsizlik yerini canlılığa bırakır.',
      phase2Days8to21: 'Antikor yanıtı ve lökosit canlılığı optimize olur.',
      phase3Days22Plus: 'Güçlü biyolojik savunma kalkanı.'
    }
  },
  {
    id: 'autoimmune_rebalance',
    name: 'Otoimmün Dengeleme (Haşimato, Lupus, Sedef Desteği)',
    diseaseName: 'Otoimmün Dengeleme (Haşimato, Lupus, Sedef Desteği)',
    system: 'İmmün Tolerans & Regülatuvar T (Treg) Hücreleri',
    category: 'Bağışıklık & Hücresel',
    primaryFrequency: 639,
    primaryFrequencyHz: 639,
    secondaryFrequencies: [528, 432, 174],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 30,
    esmaRecommendation: 'Yâ Selâm (131 Kez) - Yâ Adl (104 Kez) - Yâ Latîf (129 Kez)',
    ayetRecommendation: 'Şuarâ Suresi 80. Ayet & Fatiha Suresi',
    culturalOrReligiousContext: 'Bedenin kendi hücrelerine saldırmasını durduran, hücresel barış ve af frekansı 639 Hz kalp ahengidir.',
    binauralBeatHz: 7.83,
    carrierHz: 639,
    description: 'Aşırı reaktif otoantikor üretimini baskılar, Treg hücrelerini uyararak bağışıklık sistemine tolerans kazandırır.',
    healingBenefits: 'Otoimmün alevlenme (flare-up) şiddetini kırar, doku yıkımını ve yangıyı durdurur.',
    symptoms: ['Vücutta açıklanamayan yangı ve ateş hissi', 'Eklemlerde ve ciltte otoimmün reaksiyonlar', 'Kronik yorgunluk'],
    protocolSteps: [
      'Derin bir teslimiyetle sırtüstü uzanın.',
      '639 Hz + 7.83 Hz Schumann tonunu açın.',
      'Bedeninizin her bir hücresine sevgi ve barış mesajı gönderin, içsel savaşı sonlandırın.'
    ],
    affectedChakras: ['Kalp Çakrası', 'Solar Pleksus'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 30,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 60,
      bestTimeOfDay: 'Akşam sakin bir saatte',
      guidelines: 'Hücresel barış ve affediş meditasyonu ile uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Otoimmün alevlenmedeki akut yangı hissi geriler.',
      phase2Days8to21: 'Antikor titrelerinde dengelenme eğilimi başlar.',
      phase3Days22Plus: 'İmmün sistemin kendi dokusuna tolerans kazanması.'
    }
  },
  {
    id: 'tonsillitis_pharyngitis',
    name: 'Tonsillit (Bademcik), Faranjit & Boğaz Ağrısı',
    diseaseName: 'Tonsillit (Bademcik), Faranjit & Boğaz Ağrısı',
    system: 'Waldeyer Lenfatik Halkası & Farenks',
    category: 'Solunum & Akciğer',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [528, 285, 174],
    secondaryFrequencyHz: 8.5,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Şâfî (391 Kez) - Yâ Kuddûs (170 Kez)',
    ayetRecommendation: 'Fatiha Suresi & Felak Suresi',
    culturalOrReligiousContext: 'Boğaz çakrasının düğümlerini ve enfeksiyonunu temizleyen parlak mavi rezonans frekansıdır.',
    binauralBeatHz: 8.5,
    carrierHz: 741,
    description: 'Bademcik kriptlerindeki bakteriyel ve viral biyofilmi zayıflatır, lenf drenajını hızlandırır.',
    healingBenefits: 'Yutkunurken boğazdaki cam kırığı batması hissini dindirir, bademcik şişliğini indirir.',
    symptoms: ['Yutkunma güçlüğü ve şiddetli boğaz yanması', 'Bademciklerde beyaz plaklar', 'Boyun lenf bezlerinde şişme'],
    protocolSteps: [
      'Adaçayı veya ılık tuzlu su ile gargara yapın.',
      '741 Hz frekansı dinlerken boğazınıza mavi serinletici bir nur aktığını hayal edin.',
      'Sıcak değil ılık sıvılar tüketin.'
    ],
    affectedChakras: ['Boğaz Çakrası (Vishuddha)'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 3,
      recommendedTotalDays: 7,
      bestTimeOfDay: 'Sabah, öğle ve gece yatmadan önce',
      guidelines: 'Ilık bitki çayları ve boğaz dinlendirmesi ile uygulanır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Yutkunma ağrısı ilk 48 saatte yarıya iner.',
      phase2Days8to21: 'Bademcik şişliği ve kızarıklık tamamen söner.',
      phase3Days22Plus: 'Boğaz mukozasında tam epitelizasyon.'
    }
  },
  {
    id: 'chronic_fatigue_syndrome_cfs',
    name: 'Kronik Yorgunluk Sendromu (CFS), Tükenmişlik & Mitokondri Enerjisi',
    diseaseName: 'Kronik Yorgunluk Sendromu (CFS), Tükenmişlik & Mitokondri Enerjisi',
    system: 'Hücresel Mitokondri & ATP Biyosentezi',
    category: 'Bağışıklık & Hücresel',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [852, 963, 432],
    secondaryFrequencyHz: 12.0,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Hayy (324 Kez) - Yâ Kaviyy (116 Kez) - Yâ Nûr (256 Kez)',
    ayetRecommendation: 'Bakara Suresi 255. Ayet (Âyet-el Kûrsî) & Fatiha Suresi',
    culturalOrReligiousContext: 'Tükenmiş hücresel bataryaları evrensel kozmik enerjiyle şarj eden altın rezonanstır.',
    binauralBeatHz: 12.0,
    carrierHz: 528,
    description: 'Mitokondriyal elektron taşıma zincirini uyarır, ATP (hücresel enerji birimi) üretimini maksimize eder.',
    healingBenefits: 'Sabah yataktan kalkamama hissini kırar, gün boyu süren zindelik ve enerji sağlar.',
    symptoms: ['Dinlenmekle geçmeyen derin tükenmişlik', 'Kaslarda güçsüzlük', 'Konsantre olamama', 'Efor sonrası tükenme'],
    protocolSteps: [
      'Sabah gün doğumunda güneş ışığı alırken dinleyin.',
      '528 Hz frekansı çalarken her nefeste hücrelerinizin altın ışıkla dolduğunu hissedin.',
      'CoQ10 ve Magnezyum desteği ile güçlendirin.'
    ],
    affectedChakras: ['Solar Pleksus', 'Taç Çakra'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 45,
      bestTimeOfDay: 'Sabah kalkınca ve öğleden sonra 14:00\'te',
      guidelines: 'Güneş ışığı altında veya aydınlık odada dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Göz kapaklarındaki ağırlık ve kas yorgunluğu hafifler.',
      phase2Days8to21: 'Gün içi enerji dalgalanmaları durur, zindelik kalıcılaşır.',
      phase3Days22Plus: 'Mitokondriyal biyogenez ve yüksek hücresel enerji.'
    }
  },
  {
    id: 'cellular_detox_radiation_emf',
    name: 'Hücresel Radyasyon & EMF Temizliği (Telefon/Wi-Fi Arınması)',
    diseaseName: 'Hücresel Radyasyon & EMF Temizliği (Telefon/Wi-Fi Arınması)',
    system: 'Hücre Zarı Potansiyeli & Elektromanyetik Denge',
    category: 'Bağışıklık & Hücresel',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [432, 528, 396],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Kuddûs (170 Kez) - Yâ Hâfız (998 Kez) - Yâ Selâm (131 Kez)',
    ayetRecommendation: 'Fatiha Suresi & Âyet-el Kûrsî',
    culturalOrReligiousContext: 'Modern yapay elektromanyetik kirliliği (EMF) temizleyip bedeni Dünya\'nın doğal rezonansına topraklayan frekanstır.',
    binauralBeatHz: 7.83,
    carrierHz: 741,
    description: 'Yapay yüksek frekansların bozduğu hücre zarı voltaj-kapılı kalsiyum kanallarını (VGCC) stabilize eder.',
    healingBenefits: 'Elektronik cihaz yorgunluğunu, baş sızısını ve ciltteki statik elektriği toprağa aktarır.',
    symptoms: ['Ekran maruziyeti sonrası baş sızısı', 'Gözlerde batma ve kuruluk', 'Zihinsel bulanıklık', 'Huzursuzluk'],
    protocolSteps: [
      'Ayakkabı ve çorapları çıkarıp çıplak ayakla toprağa veya ahşaba basın.',
      '741 Hz + 7.83 Hz Schumann tonunu kulaklıkla dinleyin.',
      'Vücudunuzdaki tüm elektromanyetik statik yükün ayaklarınızdan toprağa aktığını hissedin.'
    ],
    affectedChakras: ['Kök Çakra (Topraklanma)', 'Taç Çakra'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'İş bitiminde veya yatmadan önce',
      guidelines: 'Topraklanarak (çıplak ayak teması) dinlenmesi önerilir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Göz yanması ve başın arkasındaki statik basınç kaybolur.',
      phase2Days8to21: 'Hücre zarı biyoelektrik dengesi oturur, uyku kalitesi artar.',
      phase3Days22Plus: 'Doğal biyomanyetik alanın tam korunması.'
    }
  }
];
