import { DiseaseHealingProtocol } from './types';

export const endocrineSensoryDiseases: DiseaseHealingProtocol[] = [
  {
    id: 'thyroid_hashimoto',
    name: 'Tiroid Nodülü, Hipotiroidi, Haşimato & Boğaz Blokajı',
    diseaseName: 'Tiroid Nodülü, Hipotiroidi, Haşimato & Boğaz Blokajı',
    system: 'Tiroid Bezi & Metabolik Hız',
    category: 'Endokrin & Hormon',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [528, 639, 432],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Kuddûs (170 Kez) - Yâ Semî (180 Kez) - Yâ Fettâh (489 Kez)',
    ayetRecommendation: 'Tâhâ Suresi 25-28. Ayetler (Rabbim göğsümü genişlet, işimi kolaylaştır, dilimdeki düğümü çöz)',
    culturalOrReligiousContext: 'Boğaz çakrasının bastırılmış duygularını, ifade edilememiş sözlerini serbest bırakan mavi şifa titreşimidir.',
    binauralBeatHz: 7.83,
    carrierHz: 741,
    description: 'Tiroid folikül hücrelerinde T3 ve T4 hormon sentez dengesini uyarır, boğaz bölgesindeki hücresel yangıyı yatıştırır.',
    healingBenefits: 'Boğazdaki düğümlenme ve yutkunma zorluğunu çözer, metabolik yavaşlığı dengeler.',
    symptoms: ['Boğazda yumru/tıkanma hissi', 'Kilo verememe ve ödem', 'Sürekli üşüme', 'Cilt kuruluğu ve saç dökülmesi'],
    protocolSteps: [
      'Boğazınızı hafifçe geriye doğru esnetin.',
      '741 Hz frekansı çalarken sesli olarak "HAAAK" veya derin nefes veriş sesleri çıkararak boğazınızı titreştirin.',
      'Boğazınızda masmavi gökyüzü gibi açık ve ferah bir alan canlandırın.'
    ],
    affectedChakras: ['Boğaz Çakrası (Vishuddha)'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 45,
      bestTimeOfDay: 'Sabah kahvaltı öncesi ve akşam',
      guidelines: 'Boğazı sıkmayan rahat giysilerle uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Boğazdaki baskı ve yutkunma takıntısı rahatlar.',
      phase2Days8to21: 'Enerji seviyesi yükselir, metabolik hızlanma hissedilir.',
      phase3Days22Plus: 'Tiroid hormon dengesi ve otoantikorlarda yatışma.'
    }
  },
  {
    id: 'eczema_psoriasis_skin',
    name: 'Egzama, Sedef, Cilt Yangısı & Kaşıntı',
    diseaseName: 'Egzama, Sedef, Cilt Yangısı & Kaşıntı',
    system: 'Epidermis & Kütanöz Sinir Uçları',
    category: 'Duyu & Cilt',
    primaryFrequency: 285,
    primaryFrequencyHz: 285,
    secondaryFrequencies: [528, 741, 174],
    secondaryFrequencyHz: 6.5,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Latîf (129 Kez) - Yâ Şâfî (391 Kez) - Yâ Selâm (131 Kez)',
    ayetRecommendation: 'Enbiyâ Suresi 83. Ayet (Ey Rabbim, bu dert bana dokundu, Sen merhametlilerin en merhametlisisin)',
    culturalOrReligiousContext: 'Hz. Eyyüb (a.s.) şifa duasıyla rezonansa giren ve cildin hasarlı tabakasını onaran 285 Hz doku yenileme tonudur.',
    binauralBeatHz: 6.5,
    carrierHz: 285,
    description: 'Keratinositlerin aşırı çoğalmasını dengeler, histamin salgısını baskılayarak şiddetli kaşıntıyı durdurur.',
    healingBenefits: 'Ciltteki kızarıklık, pullanma ve çatlakları iyileştirir, cilde serinlik verir.',
    symptoms: ['Gece artıran dayanılmaz kaşıntı', 'Ciltte kızarık pullu lezyonlar', 'Deride kuruluk ve kanama'],
    protocolSteps: [
      'Etkilenen cilt bölgesine doğal soğuk sıkım zeytinyağı veya çörekotu yağı sürün.',
      '285 Hz frekansını dinlerken cildinize buz mavisi serinletici bir suyun aktığını hayal edin.',
      'Kaşıma dürtüsü geldiğinde frekansa odaklanarak derin nefes alın.'
    ],
    affectedChakras: ['Kök Çakra', 'Sakral Çakra'],
    soundscapePreset: 'rain',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Kaşıntı arttığında ve banyo sonrası',
      guidelines: 'Cilde doğal nemlendirici sürüldükten sonra dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Kaşıntı nöbetleri ve ciltteki yangı hissi söner.',
      phase2Days8to21: 'Pullanma ve lezyon boyutları küçülür, deri elastikiyeti artar.',
      phase3Days22Plus: 'Epidermal bariyerin tam onarımı.'
    }
  },
  {
    id: 'adrenal_fatigue_cortisol',
    name: 'Adrenal Yorgunluk, Aşırı Kortizol & Tükenmiş Böbreküstü',
    diseaseName: 'Adrenal Yorgunluk, Aşırı Kortizol & Tükenmiş Böbreküstü',
    system: 'HPA Aksı & Adrenal Korteks',
    category: 'Endokrin & Hormon',
    primaryFrequency: 432,
    primaryFrequencyHz: 432,
    secondaryFrequencies: [528, 396, 639],
    secondaryFrequencyHz: 4.5,
    recommendedDurationMinutes: 30,
    esmaRecommendation: 'Yâ Samed (134 Kez) - Yâ Kaviyy (116 Kez) - Yâ Selâm (131 Kez)',
    ayetRecommendation: 'Bakara Suresi 286. Ayet (Allah hiçbir kimseye güç yetiremeyeceği yükü yüklemez)',
    culturalOrReligiousContext: 'Böbreküstü bezlerinin sürekli "savaş ya da kaç" modunda tükenmesini önleyen, derin sekine ve teslimiyet tonudur.',
    binauralBeatHz: 4.5,
    carrierHz: 432,
    description: 'HPA (Hipotalamus-Hipofiz-Adrenal) aksını resetler, aşırı kortizol ve adrenalin deşarjını normalleştirir.',
    healingBenefits: 'Kronik stres krizlerini yatıştırır, sabah uyanamama ve akşamları aşırı huzursuzluk hissini giderir.',
    symptoms: ['Sürekli tetikte olma hissi', 'Sabahları sürünerek uyanma', 'Tuzlu yiyecek aşermesi', 'Tahammülsüzlük'],
    protocolSteps: [
      'Sırtüstü uzanın, ellerinizi böbreklerinizin üzerine (belin hemen arkasına) koyun.',
      '432 Hz frekansı dinlerken böbreküstü bezlerinize ılık altın sarısı bir enerjinin dolduğunu hissedin.',
      'Kafein tüketimini kesin.'
    ],
    affectedChakras: ['Kök Çakra', 'Solar Pleksus'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 30,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 45,
      bestTimeOfDay: 'Öğleden sonra 15:00-17:00 (kortizol düşüş saati)',
      guidelines: 'Karanlık ve sessiz bir odada derin gevşeme pozisyonunda uygulanır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Tetiklilik hali ve anksiyöz gerginlik yerini sükunete bırakır.',
      phase2Days8to21: 'Sabah uyanma enerjisi belirgin şekilde düzelir.',
      phase3Days22Plus: 'HPA aksında kalıcı sirkadiyen denge.'
    }
  },
  {
    id: 'dry_eye_vision_strain',
    name: 'Göz Yorgunluğu, Göz Kuruluğu & Görme Bulanıklığı',
    diseaseName: 'Göz Yorgunluğu, Göz Kuruluğu & Görme Bulanıklığı',
    system: 'Oküler Kaslar, Kornea & Meibomian Bezleri',
    category: 'Duyu & Cilt',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [852, 741, 432],
    secondaryFrequencyHz: 9.0,
    recommendedDurationMinutes: 15,
    esmaRecommendation: 'Yâ Basîr (302 Kez) - Yâ Nûr (256 Kez)',
    ayetRecommendation: 'Kaf Suresi 22. Ayet (Artık senin gözünden perdeyi kaldırdık, bugün bakışın keskindir)',
    culturalOrReligiousContext: 'Gözlerin nurunu ve odaklanma keskinliğini artıran, ekran yorgunluğunu dindiren rezonanstır.',
    binauralBeatHz: 9.0,
    carrierHz: 528,
    description: 'Siliyer kas spazmını çözer, gözyaşı filminin lipit tabakasını ve lakrimal bez salgısını uyarır.',
    healingBenefits: 'Gözdeki kum batması hissini, kızarıklığı ve ekran sonrası bulanık görmeyi giderir.',
    symptoms: ['Gözlerde yanma ve batma', 'Akşamları bulanık görme', 'Işığa hassasiyet', 'Göz çevresinde ağrı'],
    protocolSteps: [
      'Gözlerinizi kapatın ve avuç içlerinizi hafifçe gözlerinizin üzerine kapatın (Palming yöntemi).',
      '528 Hz frekansı dinlerken göz kaslarınızı tamamen serbest bırakın.',
      'Uzak bir ufka bakıyormuş gibi zihinsel derinlik oluşturun.'
    ],
    affectedChakras: ['Üçüncü Göz (Ajna)'],
    soundscapePreset: 'rain',
    usagePrescription: {
      durationPerSessionMinutes: 15,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Ekran çalışması molalarında ve akşam',
      guidelines: 'Gözler kapalı avuç içi kapatma (palming) ile uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Göz batması ve yanma hissi anında hafifler.',
      phase2Days8to21: 'Gözyaşı kalitesi artar, gün sonu bulanıklığı kaybolur.',
      phase3Days22Plus: 'Oküler kas esnekliği ve keskin odaklanma.'
    }
  },
  {
    id: 'pms_hormonal_balance',
    name: 'PMS, Adet Ağrısı (Dismenore) & Hormonal Dalgalanma',
    diseaseName: 'PMS, Adet Ağrısı (Dismenore) & Hormonal Dalgalanma',
    system: 'Uterus Düz Kasları & Östrojen/Progesteron Aksı',
    category: 'Endokrin & Hormon',
    primaryFrequency: 417,
    primaryFrequencyHz: 417,
    secondaryFrequencies: [528, 174, 639],
    secondaryFrequencyHz: 6.0,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Latîf (129 Kez) - Yâ Rahmân (298 Kez) - Yâ Şâfî (391 Kez)',
    ayetRecommendation: 'Meryem Suresi & Fatiha Suresi',
    culturalOrReligiousContext: 'Sakral çakranın dişil enerjisini ve hormonal ritmini dengeleyen 417 Hz dönüşüm tonudur.',
    binauralBeatHz: 6.0,
    carrierHz: 417,
    description: 'Prostaglandin sentezini düzenleyerek rahim kramplarını çözer, östrojen-progesteron oranını harmonize eder.',
    healingBenefits: 'Şiddetli kasık ve bel kramplarını dindirir, adet öncesi gerginlik ve ağlama krizlerini sakinleştirir.',
    symptoms: ['Kasıklarda kıvrandıran kramplar', 'Aşırı sinirlilik ve duygusal çöküntü', 'Göğüslerde hassasiyet ve ödem'],
    protocolSteps: [
      'Karnın alt bölgesine ılık su torbası koyun.',
      '417 Hz frekansını dinlerken rahminizin gevşediğini ve ılık bir huzurla dolduğunu hissedin.',
      'Papatya ve civanperçemi çayı ile destekleyin.'
    ],
    affectedChakras: ['Sakral Çakra (Svadhisthana)', 'Kök Çakra'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 14,
      bestTimeOfDay: 'Adet öncesi 3 gün ve döngünün ilk günleri',
      guidelines: 'Karına ılık kompres eşliğinde uzanarak uygulanır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Kasık krampları ve bel ağrısı %60 hafifler.',
      phase2Days8to21: 'PMS kaynaklı öfke ve keder dalgaları sönümlenir.',
      phase3Days22Plus: 'Düzenli ve ağrısız menstrüel döngü.'
    }
  },
  {
    id: 'hair_loss_alopecia_scalp',
    name: 'Saç Dökülmesi, Kellik, Kepek & Saç Kökü Canlandırma',
    diseaseName: 'Saç Dökülmesi, Kellik, Kepek & Saç Kökü Canlandırma',
    system: 'Saç Folikülleri & Kafa Derisi Mikrosirkülasyonu',
    category: 'Duyu & Cilt',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [285, 741, 852],
    secondaryFrequencyHz: 10.0,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Muhyî (68 Kez) - Yâ Bâri (214 Kez) - Yâ Musavvir (336 Kez)',
    ayetRecommendation: 'Hac Suresi 5. Ayet (Biz onun üzerine suyu indirdiğimiz zaman titreşir, kabarır ve her güzel çiftten bitkiler bitirir)',
    culturalOrReligiousContext: 'Saç köklerindeki kök hücreleri ve hücresel bölünmeyi uyaran 528 Hz DNA onarım rezonansıdır.',
    binauralBeatHz: 10.0,
    carrierHz: 528,
    description: 'Dermal papilla hücrelerini aktive eder, kafa derisindeki kılcal damar kan akışını hızlandırarak dökülmeyi durdurur.',
    healingBenefits: 'Dökülen saç tellerini azaltır, yeni bebek saçların çıkışını hızlandırır, saçları kalınlaştırır.',
    symptoms: ['Taramada avuç avuç saç dökülmesi', 'Tepe bölgesinde seyrelme', 'Kafa derisinde kaşıntı ve yağlanma'],
    protocolSteps: [
      'Biberiye yağı ile kafa derisine parmak uçlarıyla 2 dakika dairesel masaj yapın.',
      '528 Hz frekansı dinlerken saç diplerinizin canlandığını ve gürleştiğini hayal edin.',
      'Biotin ve Çinko alımına dikkat edin.'
    ],
    affectedChakras: ['Taç Çakra (Sahasrara)'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 60,
      bestTimeOfDay: 'Sabah saç bakımı sonrası veya gece yatarken',
      guidelines: 'Kafa derisi masajı ile birleştirilmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Dökülen günlük tel sayısı belirgin şekilde azalır.',
      phase2Days8to21: 'Saç telleri kalınlaşır, kafa derisindeki kaşıntı biter.',
      phase3Days22Plus: 'Uyuyan köklerden yeni saç çıkışının başlaması.'
    }
  },
  {
    id: 'acne_skin_inflammation',
    name: 'Akne, Sivilce, Yağlı Cilt & Gözenek İltihabı',
    diseaseName: 'Akne, Sivilce, Yağlı Cilt & Gözenek İltihabı',
    system: 'Pilosebase Ünite & Sebasöz Bezler',
    category: 'Duyu & Cilt',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [285, 528, 396],
    secondaryFrequencyHz: 8.5,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Kuddûs (170 Kez) - Yâ Latîf (129 Kez) - Yâ Şâfî (391 Kez)',
    ayetRecommendation: 'Fatiha Suresi & İhlâs Suresi',
    culturalOrReligiousContext: 'Cildi mikrop ve aşırı yağ birikiminden arındıran 741 Hz detoks tonu ve 285 Hz doku yenileyicisidir.',
    binauralBeatHz: 8.5,
    carrierHz: 741,
    description: 'Cutibacterium acnes bakteriyel yükünü zayıflatır, sebum üretimini dengeler ve kızarık lezyonları söndürür.',
    healingBenefits: 'Kistik aknelerin ağrısını ve şişliğini dindirir, leke kalmadan cildi pürüzsüzleştirir.',
    symptoms: ['Yüzde ağrılı iltihaplı sivilceler', 'T bölgesinde aşırı yağlanma', 'Gözenek tıkanıklığı ve siyah noktalar'],
    protocolSteps: [
      'Yüzünüzü nazikçe yıkayıp kurulayın.',
      '741 Hz frekansı çalarken yüzünüze kristal gibi berrak bir suyun değdiğini hayal edin.',
      'Sivilceleri sıkmayın, şeker ve süt ürünlerini azaltın.'
    ],
    affectedChakras: ['Solar Pleksus', 'Boğaz Çakrası'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Sabah cilt temizliği sonrası ve gece yatarken',
      guidelines: 'Temiz bir ciltle ve bol su içerek dinlenilmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Ağrılı kistik akneler söner, kızarıklık geriler.',
      phase2Days8to21: 'Yeni akne oluşumu durur, sebum üretimi dengelenir.',
      phase3Days22Plus: 'Cilt tonunun eşitlenmesi ve pürüzsüzleşme.'
    }
  },
  {
    id: 'menopause_hot_flashes',
    name: 'Menopoz, Sıcak Basması, Gece Terlemesi & Ruhsal Dalgalanma',
    diseaseName: 'Menopoz, Sıcak Basması, Gece Terlemesi & Ruhsal Dalgalanma',
    system: 'Termoregülatuar Merkez (Hipotalamus) & Over Hormonları',
    category: 'Endokrin & Hormon',
    primaryFrequency: 639,
    primaryFrequencyHz: 639,
    secondaryFrequencies: [432, 528, 174],
    secondaryFrequencyHz: 5.0,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Selâm (131 Kez) - Yâ Latîf (129 Kez) - Yâ Halîm (88 Kez)',
    ayetRecommendation: 'Enbiyâ Suresi 69. Ayet (Ey ateş, serin ve selamet ol!)',
    culturalOrReligiousContext: 'Hipotalamik termostatı sakinleştiren, içsel harareti serinliğe çeviren ferahlatıcı ahenk tonudur.',
    binauralBeatHz: 5.0,
    carrierHz: 639,
    description: 'Norepinefrin dalgalanmalarını yatıştırır, hipotalamusun ısı merkezini stabilize ederek ani vazodilatasyonu engeller.',
    healingBenefits: 'Gece terlemelerini ve aniden gelen alev basmalarını söndürür, ruhsal denge sağlar.',
    symptoms: ['Göğüsten yüze yükselen ani ateş dalgası', 'Gece çamaşır değiştirecek kadar terleme', 'Sinirlilik ve uyku bölünmesi'],
    protocolSteps: [
      'Serin bir odada rahat bir şekilde uzanın.',
      '639 Hz frekansı dinlerken göğsünüze serinletici bir dağ rüzgarının estiğini hissedin.',
      'Adaçayı tüketimi ile destekleyin.'
    ],
    affectedChakras: ['Kalp Çakrası', 'Sakral Çakra'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Sıcak basması hissedildiğinde ve gece yatarken',
      guidelines: 'Pamuklu hafif giysilerle, serin bir odada dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Sıcak basması ataklarının sıklığı ve şiddeti %50 azalır.',
      phase2Days8to21: 'Gece terlemeleri kesilir, kesintisiz uyku sağlanır.',
      phase3Days22Plus: 'Termoregülasyonda tam denge ve içsel serinlik.'
    }
  }
];
