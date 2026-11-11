import { DiseaseHealingProtocol } from './types';

export const cardiovascularDiseases: DiseaseHealingProtocol[] = [
  {
    id: 'hypertension_bp',
    name: 'Hipertansiyon, Yüksek Tansiyon & Damar Sertliği',
    diseaseName: 'Hipertansiyon, Yüksek Tansiyon & Damar Sertliği',
    system: 'Kardiyovasküler & Endotel Fonksiyonu',
    category: 'Kardiyovasküler & Dolaşım',
    primaryFrequency: 639,
    primaryFrequencyHz: 639,
    secondaryFrequencies: [432, 528, 174],
    secondaryFrequencyHz: 6.0,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Latîf (129 Kez) - Yâ Hâlim (88 Kez) - Yâ Selâm (131 Kez)',
    ayetRecommendation: 'Şuarâ Suresi 80. Ayet & Fatiha Suresi',
    culturalOrReligiousContext: 'Gevrekzade Hasan Efendi\'nin Büzürk makamı ile kan basıncını düşürdüğü tarihi tıp metodudur.',
    binauralBeatHz: 6.0,
    carrierHz: 639,
    description: 'Damar endotelinde Nitrik Oksit (NO) sentezini uyarır, periferik damar direncini düşürerek tansiyonu regüle eder.',
    healingBenefits: 'Sistolik ve diyastolik basıncı 10-15 mmHg dengeler, damar elastikiyetini korur.',
    symptoms: ['Ense kökünde zonklama', 'Yüzde ateş basması', 'Gözlerde kızarma ve ağırlık', 'Hızlı nabız'],
    protocolSteps: [
      'Oturur pozisyonda ayakları yere düz basın, bacak bacak üstüne atmayın.',
      '639 Hz + 6 Hz Teta tonunu dinlerken kalp ritmine odaklanın.',
      'Her nefes verişte damarların genişlediğini ve ılık kanın rahatça aktığını hissedin.'
    ],
    affectedChakras: ['Kalp Çakrası (Anahata)', 'Kök Çakra'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Sabah tansiyon ölçümünden sonra ve akşam',
      guidelines: 'Gevşek kıyafetlerle, tansiyon ölçümünden hemen önce veya sonra dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Gün içi ani tansiyon sıçramaları azalır, nabız ritmi sakinleşir.',
      phase2Days8to21: 'Ense ağrısı ve basınç hissi kaybolur, damar elastikiyeti artar.',
      phase3Days22Plus: 'Kardiyovasküler otonomik dengelenme ve stabil tansiyon.'
    }
  },
  {
    id: 'heart_arrhythmia',
    name: 'Kalp Çarpıntısı, Aritmi & Ekstrasistol',
    diseaseName: 'Kalp Çarpıntısı, Aritmi & Ekstrasistol',
    system: 'Kardiyak İleti Sistemi & SA Düğüm',
    category: 'Kardiyovasküler & Dolaşım',
    primaryFrequency: 639,
    primaryFrequencyHz: 639,
    secondaryFrequencies: [528, 432, 174],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Muhyî (68 Kez) - Yâ Mümin (137 Kez) - Yâ Selâm (131 Kez)',
    ayetRecommendation: 'Ra\'d Suresi 28. Ayet (Kalpler ancak Allah\'ın zikriyle mutmain olur)',
    culturalOrReligiousContext: 'Kalbin biyomanyetik alanını Dünya\'nın 7.83 Hz Schumann rezonansıyla senkronize eden yeşil nur frekansıdır.',
    binauralBeatHz: 7.83,
    carrierHz: 639,
    description: 'Sinoatriyal düğümün elektriksel iletim ritmini stabilize eder, sempatik deşarjları filtreler.',
    healingBenefits: 'Düzensiz kalp vurumlarını yatıştırır, göğüsteki sıkışma hissini çözer.',
    symptoms: ['Göğüste kuş kanadı çırpıntısı hissi', 'Boşlukta düşme hissi', 'Ani nabız fırlaması', 'Huzursuzluk'],
    protocolSteps: [
      'Sol elinizi göğsünüzün ortasına yerleştirin.',
      '639 Hz kalp ahengini dinlerken nefesinizi kalp atışınızla senkronize edin.',
      'Zihinde kalbinizin etrafında zümrüt yeşili bir kalkan imgeleyin.'
    ],
    affectedChakras: ['Kalp Çakrası (Anahata)'],
    soundscapePreset: 'rain',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Çarpıntı hissi geldiğinde ve akşam dinlenirken',
      guidelines: 'Sırtüstü uzanıp sol el kalbin üzerindeyken uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Ekstrasistol ve teklemelerde %60 azalma.',
      phase2Days8to21: 'Kalp hızı değişkenliği (HRV) belirgin şekilde artar.',
      phase3Days22Plus: 'Kardiyak ritimde tam koherans ve huzur.'
    }
  },
  {
    id: 'varicose_circulation',
    name: 'Varis, Bacak Ağrısı & Venöz Dolaşım Yetersizliği',
    diseaseName: 'Varis, Bacak Ağrısı & Venöz Dolaşım Yetersizliği',
    system: 'Venöz Kapakçıklar & Lenfatik Drenaj',
    category: 'Kardiyovasküler & Dolaşım',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [174, 285, 432],
    secondaryFrequencyHz: 8.5,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Bâsıt (72 Kez) - Yâ Cebbâr (206 Kez)',
    ayetRecommendation: 'Nahl Suresi 69. Ayet & Fatiha Suresi',
    culturalOrReligiousContext: 'Venöz duvarların elastikiyetini ve kanın kalbe doğru yukarı akışını destekleyen hidrodinamik rezonanstır.',
    binauralBeatHz: 8.5,
    carrierHz: 528,
    description: 'Venöz kapakçıkların tonusunu artırır, bacaklardaki mikrokapiller dolaşımı ve lenfatik sıvıyı harekete geçirir.',
    healingBenefits: 'Bacaklardaki ağırlık ve ödemi çözer, gece kramplarını engeller.',
    symptoms: ['Bacaklarda kurşun gibi ağırlık hissi', 'Ayak bileklerinde şişlik', 'Gece bacak krampları', 'Belirginleşen mavi damarlar'],
    protocolSteps: [
      'Bacakları bir yastıkla kalp seviyesinden 20 cm yukarı kaldırın.',
      '528 Hz hücresel onarım frekansını açın.',
      'Ayak bileklerinizi öne ve arkaya hafifçe pompalayın.'
    ],
    affectedChakras: ['Kök Çakra', 'Sakral Çakra'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Akşam iş dönüşü',
      guidelines: 'Bacaklar yukarı kaldırılmış şekilde dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Akşam ödemi ve ayak şişliklerinde hızlı rahatlama.',
      phase2Days8to21: 'Gece krampları tamamen kesilir, bacak ağırlığı kaybolur.',
      phase3Days22Plus: 'Venöz tonusta kalıcı güçlenme.'
    }
  },
  {
    id: 'raynaud_cold_extremities',
    name: 'Raynaud Sendromu, El-Ayak Üşümesi & Kapiller Spazm',
    diseaseName: 'Raynaud Sendromu, El-Ayak Üşümesi & Kapiller Spazm',
    system: 'Periferik Mikrodolaşım & Sempatik Vazomotor Tonus',
    category: 'Kardiyovasküler & Dolaşım',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [639, 174, 432],
    secondaryFrequencyHz: 9.0,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Nûr (256 Kez) - Yâ Muhyî (68 Kez) - Yâ Latîf (129 Kez)',
    ayetRecommendation: 'Enbiyâ Suresi 69. Ayet & Fatiha Suresi',
    culturalOrReligiousContext: 'Ellere ve ayaklara hayat veren sıcak kan akışını uyaran, periferik damarları genişleten rezonans frekansıdır.',
    binauralBeatHz: 9.0,
    carrierHz: 528,
    description: 'Parmak uçlarındaki kılcal damar spazmını çözer, sempatik sinir sisteminin aşırı vazokonstriksiyonunu durdurur.',
    healingBenefits: 'Parmaklarda morarma ve beyazlamayı engeller, el ve ayakları doğal ısısına kavuşturur.',
    symptoms: ['Soğukta parmakların bembeyaz veya mor olması', 'Parmak uçlarında iğnelenme ve sızı', 'Sürekli buz gibi ayaklar'],
    protocolSteps: [
      'Ellerinizi birbirine sürterek hafifçe ısıtın.',
      '528 Hz frekansı dinlerken parmak uçlarınıza kızıl-altın rengi sıcak bir ışığın aktığını hayal edin.',
      'Derin burun nefesiyle göğsünüzü genişletin.'
    ],
    affectedChakras: ['Kök Çakra', 'Kalp Çakrası'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Sabah evden çıkmadan önce ve soğuk maruziyetinde',
      guidelines: 'Eller ılık pozisyonda tutularak uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Parmak uçlarındaki buz kesilme hissi yumuşar.',
      phase2Days8to21: 'Morarma atakları seyrekleşir, kılcal damar dolumu hızlanır.',
      phase3Days22Plus: 'Periferik mikrosirkülasyonda kalıcı stabilite.'
    }
  },
  {
    id: 'coronary_atherosclerosis_support',
    name: 'Koroner Damar Esnekliği, Plak Koruma & Kalp Beslenmesi',
    diseaseName: 'Koroner Damar Esnekliği, Plak Koruma & Kalp Beslenmesi',
    system: 'Koroner Arterler & Miyokardiyal Oksijenlenme',
    category: 'Kardiyovasküler & Dolaşım',
    primaryFrequency: 639,
    primaryFrequencyHz: 639,
    secondaryFrequencies: [528, 741, 174],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Selâm (131 Kez) - Yâ Şâfî (391 Kez) - Yâ Muhyî (68 Kez)',
    ayetRecommendation: 'Ra\'d Suresi 28. Ayet & İnşirâh Suresi',
    culturalOrReligiousContext: 'Kalp kasının yeterli oksijen almasını sağlayan ve göğüs sıkışmalarına şifa olan yeşil rezonans frekansıdır.',
    binauralBeatHz: 7.83,
    carrierHz: 639,
    description: 'Miyokardiyal dokuya giden koroner kan akışını rahatlatır, endotel hücrelerindeki yangıyı sakinleştirir.',
    healingBenefits: 'Göğüsteki dolgunluk ve baskı hissini hafifletir, efor kapasitesini artırır.',
    symptoms: ['Yürürken göğüste ağırlık', 'Merdiven çıkarken çabuk tıkanma', 'Kalp bölgesinde tedirginlik'],
    protocolSteps: [
      'Gevşek kıyafetlerle arkaya yaslanarak oturun.',
      '639 Hz kalp tonunu dinlerken nefesinizin göğüs kafesini ferahlattığını hissedin.',
      'Zihinde kalbinizi parlak bir zümrüt gibi imgeleyin.'
    ],
    affectedChakras: ['Kalp Çakrası (Anahata)'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 40,
      bestTimeOfDay: 'Sabah kahvaltıdan 1 saat sonra ve akşam',
      guidelines: 'Rahat bir koltukta derin dinlenme modunda uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Göğüs kafesindeki sıkışma hissi ve nefes darlığı geriler.',
      phase2Days8to21: 'Yürüyüş ve hafif efor kapasitesi güçlenir.',
      phase3Days22Plus: 'Kardiyak koherans ve damar elastikiyeti artışı.'
    }
  },
  {
    id: 'lymphedema_drainage',
    name: 'Lenfödem, Toksin Birikimi & Sıvı Tutulumu',
    diseaseName: 'Lenfödem, Toksin Birikimi & Sıvı Tutulumu',
    system: 'Lenfatik Damarlar & Lenf Düğümleri',
    category: 'Kardiyovasküler & Dolaşım',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [528, 285, 174],
    secondaryFrequencyHz: 8.0,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Kuddûs (170 Kez) - Yâ Bâsıt (72 Kez)',
    ayetRecommendation: 'Fatiha Suresi & İnşirâh Suresi',
    culturalOrReligiousContext: 'Vücuttaki durgun lenf sıvısını harekete geçiren ve dokulardan toksik drenajı hızlandıran 741 Hz arınma titreşimidir.',
    binauralBeatHz: 8.0,
    carrierHz: 741,
    description: 'Lenfatik endotel kasılmasını uyarır, interstisyel sıvı basıncını düşürerek şişlikleri tahliye eder.',
    healingBenefits: 'Kol ve bacaklardaki gergin şişliği indirir, doku sertliğini yumuşatır.',
    symptoms: ['Tek taraflı kol veya bacakta belirgin kalınlaşma', 'Ciltte gerginlik ve sertlik', 'Takıların/yüzüklerin sıkması'],
    protocolSteps: [
      'Şiş uzvu kalp seviyesinin üzerine kaldırın.',
      '741 Hz tonu eşliğinde uzvun ucundan gövdeye doğru nazikçe sıvazlayın.',
      'Seans sonrası bol ılık su tüketin.'
    ],
    affectedChakras: ['Solar Pleksus', 'Kök Çakra'],
    soundscapePreset: 'rain',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Öğle ve akşam dinlenmelerinde',
      guidelines: 'Hafif manuel lenf drenaj masajı ile birleştirilmesi tavsiye edilir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Doku gerginliğinde gevşeme, ekstremite çapında ilk santimetre azalması.',
      phase2Days8to21: 'Lenf sıvısı akışı hızlanır, ödem kalıcı olarak geriler.',
      phase3Days22Plus: 'Doku elastikiyeti ve lenfatik kanal açıklığı.'
    }
  },
  {
    id: 'postural_orthostatic_tachycardia',
    name: 'POTS Sendromu, Ortostatik Hipotansiyon & Ayağa Kalkınca Çarpıntı',
    diseaseName: 'POTS Sendromu, Ortostatik Hipotansiyon & Ayağa Kalkınca Çarpıntı',
    system: 'Otonomik Baroreseptörler & Venöz Dönüş',
    category: 'Kardiyovasküler & Dolaşım',
    primaryFrequency: 432,
    primaryFrequencyHz: 432,
    secondaryFrequencies: [639, 528, 174],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Müheymin (145 Kez) - Yâ Kayyûm (156 Kez)',
    ayetRecommendation: 'Âl-i İmrân Suresi 173. Ayet (Hasbünallahu ve ni\'mel vekîl)',
    culturalOrReligiousContext: 'Otonom sinir sisteminin barorefleks duyarlılığını düzenleyen ve ani baş dönmelerini önleyen armoni tonudur.',
    binauralBeatHz: 7.83,
    carrierHz: 432,
    description: 'Ayağa kalkış anındaki serebral kan akışını dengeler, sempatik taşikardi fırlamasını yumuşatır.',
    healingBenefits: 'Ayağa kalkınca göz kararmasını ve nabzın aniden 120+ fırlamasını engeller.',
    symptoms: ['Ayağa kalkınca göz kararması', 'Ani kalp çarpıntısı', 'Bacaklarda kan göllenmesi', 'Bayılma hissi'],
    protocolSteps: [
      'Yataktan kalkmadan önce 5 dakika 432 Hz frekansını dinleyin.',
      'Önce oturur pozisyona geçip ayaklarınızı hareket ettirin, sonra yavaşça kalkın.',
      'Yeterli tuz ve su alımına dikkat edin.'
    ],
    affectedChakras: ['Kök Çakra', 'Kalp Çakrası'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Sabah yataktan kalkmadan önce ve akşam',
      guidelines: 'Yatar pozisyondan kalkış geçişlerinde uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Kalkıştaki baş dönmesi ve göz kararması hafifler.',
      phase2Days8to21: 'Postüral nabız sıçraması normal aralığa döner.',
      phase3Days22Plus: 'Otonom barorefleks yanıtında stabilizasyon.'
    }
  },
  {
    id: 'hemorrhoids_pelvic_congestion',
    name: 'Hemoroid (Basur), Pelvik Konjesyon & Anal Basınç',
    diseaseName: 'Hemoroid (Basur), Pelvik Konjesyon & Anal Basınç',
    system: 'Rektal Venöz Pleksus & Pelvik Taban',
    category: 'Kardiyovasküler & Dolaşım',
    primaryFrequency: 285,
    primaryFrequencyHz: 285,
    secondaryFrequencies: [174, 528, 396],
    secondaryFrequencyHz: 6.5,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Şâfî (391 Kez) - Yâ Cebbâr (206 Kez) - Yâ Bâsıt (72 Kez)',
    ayetRecommendation: 'Şuarâ Suresi 80. Ayet & Fatiha Suresi',
    culturalOrReligiousContext: 'Pelvik bölgedeki venöz göllenmeyi dağıtan ve hasarlı damar duvarlarını yenileyen 285 Hz doku onarım tonudur.',
    binauralBeatHz: 6.5,
    carrierHz: 285,
    description: 'Hemoroidal venlerdeki tromboz ve ödemi yatıştırır, anal sfinkter spazmını çözer.',
    healingBenefits: 'Otururken duyulan batıcı acıyı ve kanamayı dindirir, şişliği küçültür.',
    symptoms: ['Otururken şiddetli acı ve zonklama', 'Dışkılama sonrası kanama', 'Makat bölgesinde şişlik/meme'],
    protocolSteps: [
      'Ilık oturma banyosu sonrası rahatça uzanın.',
      '285 Hz frekansını dinlerken pelvik taban kaslarınızı tamamen gevşetin.',
      'Lifli beslenin ve bol su tüketin.'
    ],
    affectedChakras: ['Kök Çakra (Muladhara)'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 14,
      bestTimeOfDay: 'Ilık banyo sonrası ve gece yatarken',
      guidelines: 'Pelvik bölge kasları tamamen serbest bırakılarak uygulanır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Zonklama ve batma hissi ilk 3 günde söner.',
      phase2Days8to21: 'Hemoroid paketlerindeki ödem geriler, kanama durur.',
      phase3Days22Plus: 'Venöz tonus onarımı ve rahat oturma konforu.'
    }
  }
];
