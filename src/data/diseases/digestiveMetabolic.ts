import { DiseaseHealingProtocol } from './types';

export const digestiveMetabolicDiseases: DiseaseHealingProtocol[] = [
  {
    id: 'digestive_ibs',
    name: 'İBS, Huzursuz Bağırsak, Spazm & Şişkinlik',
    diseaseName: 'İBS, Huzursuz Bağırsak, Spazm & Şişkinlik',
    system: 'Gastrointestinal & Enterik Sinir Ağı',
    category: 'Sindirim & Metabolizma',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [417, 396, 639],
    secondaryFrequencyHz: 6.0,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Bâsıt (72 Kez) - Yâ Nâfi (201 Kez) - Yâ Şâfî (391 Kez)',
    ayetRecommendation: 'Kureyş Suresi & Fatiha Suresi',
    culturalOrReligiousContext: 'Hüseyni makamının karın ağrılarını ve bağırsak spazmlarını gideren Selçuklu darüşşifa uygulamasıdır.',
    binauralBeatHz: 6.0,
    carrierHz: 528,
    description: 'Enterik sinir sistemini (ikinci beyin) yatıştırır, bağırsak peristaltik dalgalarını ritmik hale getirir.',
    healingBenefits: 'Gaz, şişkinlik ve krampları dindirir, bağırsak mikrobiyota dengesini destekler.',
    symptoms: ['Yemek sonrası ani şişkinlik', 'Karın krampları', 'Düzensiz bağırsak hareketleri', 'Hazımsızlık'],
    protocolSteps: [
      'Yemekten 30 dakika sonra sırtüstü uzanın.',
      'Sağ elinizi göbek deliğinizin etrafına koyarak saat yönünde hafifçe gezdirin.',
      '528 Hz frekansı eşliğinde diyaframdan derin nefesler alın.'
    ],
    affectedChakras: ['Solar Pleksus (Manipura)', 'Sakral'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Öğle ve akşam yemeklerinden 30 dk sonra',
      guidelines: 'Karın bölgesine sağ el temasıyla hafif saat yönü dairesel masaj önerilir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Yemek sonrası gaz ve kramplarda %50 azalma.',
      phase2Days8to21: 'Bağırsak geçiş süresi ve dışkılama ritmi düzene girer.',
      phase3Days22Plus: 'Hassas bağırsak sendromunda kalıcı remisyon.'
    }
  },
  {
    id: 'gastritis_reflux',
    name: 'Gastrit, Reflü & Mide Yanması',
    diseaseName: 'Gastrit, Reflü & Mide Yanması',
    system: 'Mide Mukozası & Alt Özofagus Sfinkteri',
    category: 'Sindirim & Metabolizma',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [174, 432, 639],
    secondaryFrequencyHz: 7.0,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Şâfî (391 Kez) - Yâ Muhyî (68 Kez) - Yâ Bâtın (62 Kez)',
    ayetRecommendation: 'Fatiha Suresi (7 Kez)',
    culturalOrReligiousContext: 'Mide asidinin aşındırdığı mukozayı onaran 528 Hz hücresel onarım frekansıdır.',
    binauralBeatHz: 7.0,
    carrierHz: 528,
    description: 'Mide asit salgısını nöral yolla dengeler, mide duvarı epitel rejenerasyonunu uyarır.',
    healingBenefits: 'Göğüs arkasındaki yanma hissini söndürür, mide kramplarını çözer.',
    symptoms: ['Ağza ekşi/acı su gelmesi', 'Mide ağzında yanma', 'Geğirme ve dolgunluk', 'Boğazda gıcıklanma'],
    protocolSteps: [
      'Yemekten hemen sonra uzanmayın, dik pozisyonda oturun.',
      'Bir bardak ılık su içtikten sonra 528 Hz frekansını başlatın.',
      'Midenizin üzerinde altın sarısı iyileştirici bir ışık küresi canlandırın.'
    ],
    affectedChakras: ['Solar Pleksus'],
    soundscapePreset: 'rain',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 14,
      bestTimeOfDay: 'Yemeklerden sonra ve gece yatarken',
      guidelines: 'Yarı dik oturur vaziyette dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Gece reflü nöbetleri ve mide yanması kesilir.',
      phase2Days8to21: 'Mide mukozası epitelizasyonu hızlanır, tokluk konforu gelir.',
      phase3Days22Plus: 'Mide sfinkter tonusu güçlenir, asit dengesi oturur.'
    }
  },
  {
    id: 'fatty_liver_detox',
    name: 'Karaciğer Yağlanması, Toksin Arınma & Safra Desteği',
    diseaseName: 'Karaciğer Yağlanması, Toksin Arınma & Safra Desteği',
    system: 'Hepatobiliyer Sistem & Detoksifikasyon',
    category: 'Sindirim & Metabolizma',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [528, 639, 396],
    secondaryFrequencyHz: 8.0,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Kuddûs (170 Kez) - Yâ Tahîr (Arındıran) - Yâ Şâfî (391 Kez)',
    ayetRecommendation: 'Bakara Suresi 222. Ayet (Şüphesiz Allah temizlenenleri sever)',
    culturalOrReligiousContext: 'Hücre içi toksinleri ve ağır metalleri temizleyen Solfejyo 741 Hz frekansıdır.',
    binauralBeatHz: 8.0,
    carrierHz: 741,
    description: 'Hepatositlerde glutatyon sentezini ve Faz 1 / Faz 2 karaciğer detoks yolaklarını uyarır.',
    healingBenefits: 'Karaciğer enzimlerini dengeler, safra akışını hızlandırır, kronik halsizliği giderir.',
    symptoms: ['Sağ kaburga altında dolgunluk hissi', 'Ciltte matlık ve kaşıntı', 'Yemek sonrası ağır uyku hali', 'Ağızda acılık'],
    protocolSteps: [
      'Sağ kaburga altınıza ılık kompres veya elinizi koyun.',
      '741 Hz arınma frekansını dinlerken vücudunuzdan karanlık toksinlerin atıldığını hayal edin.',
      'Limonlu ılık su tüketimiyle destekleyin.'
    ],
    affectedChakras: ['Solar Pleksus', 'Kalp Çakrası'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Sabah aç karnına veya gece 23:00 öncesi',
      guidelines: 'Bol alkali su eşliğinde dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Sabah ağız kokusu ve ağırlık hissi azalır, enerji yükselir.',
      phase2Days8to21: 'Karaciğer enzimleri (ALT/AST) normal sınırlara yaklaşır.',
      phase3Days22Plus: 'Hepatik yağlanma geriler, cilt berraklaşır.'
    }
  },
  {
    id: 'diabetes_metabolism',
    name: 'İnsülin Direnci, Tip-2 Diyabet & Şeker Dalgalanmaları',
    diseaseName: 'İnsülin Direnci, Tip-2 Diyabet & Şeker Dalgalanmaları',
    system: 'Endokrin Pankreas & Glikoz Metabolizması',
    category: 'Sindirim & Metabolizma',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [432, 741, 174],
    secondaryFrequencyHz: 10.0,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Hakîm (78 Kez) - Yâ Mukît (550 Kez) - Yâ Fettâh (489 Kez)',
    ayetRecommendation: 'Kamer Suresi 49. Ayet (Biz her şeyi bir ölçüye göre yarattık)',
    culturalOrReligiousContext: 'Bedenin glukoz dengesini ve pankreasın beta hücre rezonansını düzenleyen harmonik frekanstır.',
    binauralBeatHz: 10.0,
    carrierHz: 528,
    description: 'Pankreas Langerhans adacıklarının membran potansiyelini optimize eder, periferik insülin duyarlılığını artırır.',
    healingBenefits: 'Yemek sonrası ani şeker düşmesi ve tatlı krizlerini engeller, hücresel enerjiyi dengeler.',
    symptoms: ['Yemekten sonra aşırı uyku hali', 'Sürekli tatlı arayışı', 'Göbek çevresinde yağlanma', 'Halsizlik'],
    protocolSteps: [
      'Günde 2 kez ana yemeklerden 45 dakika sonra frekansı açın.',
      'Gözler kapalı olarak pankreas ve karın bölgesine odaklanın.',
      'Günde 30 dakika tempolu yürüyüşle birleştirin.'
    ],
    affectedChakras: ['Solar Pleksus (Manipura)'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 45,
      bestTimeOfDay: 'Öğle ve akşam yemeklerinden 45 dk sonra',
      guidelines: 'Düzenli egzersiz ve sağlıklı beslenme ile kombine edilmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Ani tatlı krizleri ve yemek sonrası halsizlik azalır.',
      phase2Days8to21: 'Açlık kan şekeri ve tokluk eğrisinde belirgin denge.',
      phase3Days22Plus: 'HOMA-IR insülin direnci indeksinde düşüş.'
    }
  },
  {
    id: 'chronic_constipation',
    name: 'Kronik Kabızlık, Tembel Bağırsak & Kolon Toksinleri',
    diseaseName: 'Kronik Kabızlık, Tembel Bağırsak & Kolon Toksinleri',
    system: 'Kolon Motilitesi & Rektal Refleks',
    category: 'Sindirim & Metabolizma',
    primaryFrequency: 396,
    primaryFrequencyHz: 396,
    secondaryFrequencies: [528, 417, 741],
    secondaryFrequencyHz: 7.0,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Bâsıt (72 Kez) - Yâ Fettâh (489 Kez) - Yâ Nâfi (201 Kez)',
    ayetRecommendation: 'İnşirâh Suresi & Fatiha Suresi',
    culturalOrReligiousContext: 'Kök çakranın tutunma ve bırakamama blokajlarını çözen, bedensel atılımı kolaylaştıran 396 Hz serbest bırakma frekansıdır.',
    binauralBeatHz: 7.0,
    carrierHz: 396,
    description: 'Kolon düz kaslarının peristaltik dalgalarını stimüle eder, dışkı kütlesinin bağırsak içi ilerlemesini hızlandırır.',
    healingBenefits: 'Karındaki şişkinlik ve ağırlık hissini temizler, her sabah düzenli boşaltım sağlar.',
    symptoms: ['Haftada 3\'ten az dışkılama', 'Sert ve zorlu dışkılama', 'Karında taş gibi ağırlık', 'Ağız kokusu'],
    protocolSteps: [
      'Sabah kalkınca 2 bardak ılık su için.',
      '396 Hz frekansını dinlerken karnınıza saat yönünde hafif baskıyla masaj yapın.',
      'Tuvalette dizlerinizi hafifçe yukarı kaldıran bir tabure kullanın (doğal çömelme açısı).'
    ],
    affectedChakras: ['Kök Çakra (Muladhara)', 'Sakral Çakra'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Sabah kalkınca aç karnına ve akşam',
      guidelines: 'Ilık su tüketimi ve karın masajı ile kombine edilmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Bağırsak hareketleri canlanır, ilk rahat boşaltım gerçekleşir.',
      phase2Days8to21: 'Günlük düzenli tuvalet alışkanlığı oturur.',
      phase3Days22Plus: 'Kolon peristaltizminde kalıcı doğal ritim.'
    }
  },
  {
    id: 'ulcerative_colitis_crohn_support',
    name: 'İnflamatuar Bağırsak (Kolit/Crohn Desteği) & Mukozal Yangı',
    diseaseName: 'İnflamatuar Bağırsak (Kolit/Crohn Desteği) & Mukozal Yangı',
    system: 'İntestinal Mukoza & Bağırsak İmmün Bariyeri',
    category: 'Sindirim & Metabolizma',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [285, 174, 639],
    secondaryFrequencyHz: 6.5,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Selâm (131 Kez) - Yâ Şâfî (391 Kez) - Yâ Latîf (129 Kez)',
    ayetRecommendation: 'Şuarâ Suresi 80. Ayet & Fatiha Suresi',
    culturalOrReligiousContext: 'Bağırsak duvarındaki mikro-ülserleri ve yangılı yaraları hücresel düzeyde yatıştıran derin 285 & 528 Hz rezonansıdır.',
    binauralBeatHz: 6.5,
    carrierHz: 528,
    description: 'Bağırsak epitel hücrelerindeki TNF-alfa ve interlökin yangı moleküllerini baskılar, epitel onarımını uyarır.',
    healingBenefits: 'Karın içi yangıyı ve kramplı acil tuvalet dürtülerini sakinleştirir.',
    symptoms: ['Sık ve sulu dışkılama', 'Karında yanma ve kramp', 'İştahsızlık ve kilo kaybı', 'Halsizlik'],
    protocolSteps: [
      'Sakin bir odada sırtüstü uzanın.',
      '528 Hz tonunu dinlerken bağırsaklarınıza serinletici mavi-yeşil bir ışık gönderin.',
      'Stres faktörlerini minimuma indirin.'
    ],
    affectedChakras: ['Solar Pleksus', 'Sakral Çakra', 'Kök Çakra'],
    soundscapePreset: 'rain',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 45,
      bestTimeOfDay: 'Öğle dinlenmesi ve gece yatmadan önce',
      guidelines: 'Yemeklerden en az 1 saat sonra sakin uzanır halde uygulanır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Karın içi yanma hissi ve kramplar hafifler.',
      phase2Days8to21: 'Dışkılama sıklığı azalır, kıvam toparlanır.',
      phase3Days22Plus: 'İntestinal mukozada hücresel epitelizasyon.'
    }
  },
  {
    id: 'gallbladder_sludge_biliary',
    name: 'Safra Kesesi Tembelliği, Safra Çamuru & Hazımsızlık',
    diseaseName: 'Safra Kesesi Tembelliği, Safra Çamuru & Hazımsızlık',
    system: 'Safra Yolları & Koledok Kanalı',
    category: 'Sindirim & Metabolizma',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [528, 417, 639],
    secondaryFrequencyHz: 8.5,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Fettâh (489 Kez) - Yâ Hâdî (20 Kez) - Yâ Şâfî (391 Kez)',
    ayetRecommendation: 'Fatiha Suresi & Kureyş Suresi',
    culturalOrReligiousContext: 'Safra kanallarındaki blokajları ve akışkanlık durgunluğunu gideren titreşimsel arınma tonudur.',
    binauralBeatHz: 8.5,
    carrierHz: 741,
    description: 'Safra kesesi sfinkter kasılmasını regüle eder, safra asitlerinin akışkanlığını artırarak yağ sindirimini destekler.',
    healingBenefits: 'Yağlı yemek sonrası sağ kaburga altındaki batmayı ve bulantıyı keser.',
    symptoms: ['Sağ kaburga altında sırta vuran ağrı', 'Yağlı yiyeceklere tahammülsüzlük', 'Ağızda acı tat', 'Mide bulantısı'],
    protocolSteps: [
      'Yemeklerden 20 dakika sonra sağ tarafınıza hafif eğik oturun.',
      '741 Hz frekansını dinlerken safra kanallarınızın açıldığını ve altuni renkli safranın rahatça aktığını tahayyül edin.',
      'Enginar ve karahindiba çayı ile destekleyin.'
    ],
    affectedChakras: ['Solar Pleksus'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Öğle ve akşam yemeklerinden 20 dk sonra',
      guidelines: 'Sağ tarafa hafif yaslanarak dinlenilmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Yemek sonrası sırta vuran batma hissi hafifler.',
      phase2Days8to21: 'Safra akışı düzenli hale gelir, ağızdaki acılık kaybolur.',
      phase3Days22Plus: 'Safra kesesi motilitesinde tam rahatlama.'
    }
  },
  {
    id: 'food_intolerance_leaky_gut',
    name: 'Geçirgen Bağırsak (Leaky Gut), Gıda İntoleransı & Şişkinlik',
    diseaseName: 'Geçirgen Bağırsak (Leaky Gut), Gıda İntoleransı & Şişkinlik',
    system: 'Sıkı Bağlantılar (Tight Junctions) & Bağırsak Astarı',
    category: 'Sindirim & Metabolizma',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [741, 285, 432],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Cebbâr (206 Kez) - Yâ Hâfız (998 Kez) - Yâ Muhyî (68 Kez)',
    ayetRecommendation: 'Bakara Suresi 168. Ayet (Yeryüzündeki helal ve temiz şeylerden yiyin)',
    culturalOrReligiousContext: 'Hücreler arası mikro-açıklıkları tamir eden ve biyo-bariyeri onaran 528 & 285 Hz frekans kombinasyonudur.',
    binauralBeatHz: 7.83,
    carrierHz: 528,
    description: 'Zonulin protein seviyesini düşürerek enterositler arasındaki sıkı bağlantıları onarır, kana toksin sızmasını engeller.',
    healingBenefits: 'Gıda alerjilerini ve yemek sonrası vücutta oluşan genel ödem ve beyin sisini temizler.',
    symptoms: ['Yemeklerden sonra yüzde ve bedende ödem', 'Beyin sisi ve halsizlik', 'Farklı gıdalara karşı ani reaksiyonlar'],
    protocolSteps: [
      'Güne kemik suyu veya glutamin takviyesi eşliğinde başlayın.',
      '528 Hz frekansı çalarken bağırsak duvarınızın pürüzsüz ve sağlam bir zırha dönüştüğünü imgeleyin.',
      'İşlenmiş gıdalardan uzak durun.'
    ],
    affectedChakras: ['Solar Pleksus', 'Sakral Çakra'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 45,
      bestTimeOfDay: 'Sabah kahvaltı öncesi',
      guidelines: 'Aç karnına bağırsak onarım niyet ve meditasyonu ile uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Yemek sonrası ani şişlik ve uyku hali geriler.',
      phase2Days8to21: 'Gıda toleransı artar, beyin sisi dağılır.',
      phase3Days22Plus: 'İntestinal bariyer bütünlüğünün tam restorasyonu.'
    }
  }
];
