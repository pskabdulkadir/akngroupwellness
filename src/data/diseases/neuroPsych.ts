import { DiseaseHealingProtocol } from './types';

export const neuroPsychDiseases: DiseaseHealingProtocol[] = [
  {
    id: 'anxiety_panic',
    name: 'Anksiyete, Kaygı & Panik Bozukluğu',
    diseaseName: 'Anksiyete, Kaygı & Panik Bozukluğu',
    system: 'Sinir Sistemi & Psikolojik',
    category: 'Nörolojik & Zihinsel',
    primaryFrequency: 432,
    primaryFrequencyHz: 432,
    secondaryFrequencies: [528, 396, 174],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Selâm (131 Kez) - Yâ Kuddûs (170 Kez)',
    ayetRecommendation: 'İnşirâh Suresi & Rad Suresi 28. Ayet (Kalpler ancak Allah\'ın zikriyle mutmain olur)',
    culturalOrReligiousContext: 'Sufi darüşşifalarında Nihavend ve Rast makamı ile tedavi edilen vehim ve vesvese durumlarına tekabül eder. 432 Hz evrensel harmoni tonu kalp ve beyin frekansını eşitler.',
    binauralBeatHz: 7.83,
    carrierHz: 432,
    description: 'Aşırı sempatik sinir uyarılmasını baskılar, vagus sinirini uyararak kalp atımını ve nefes ritmini dengeler.',
    healingBenefits: 'Amigdala aşırı aktivitesini düşürür, kortizolü dengeler ve zihinsel dinginlik sağlar.',
    symptoms: ['Çarpıntı', 'Nefes darlığı hissi', 'Sürekli felaket beklentisi', 'Huzursuz bacak', 'İç titremesi'],
    protocolSteps: [
      'Kulaklık takarak 432 Hz + 7.83 Hz Schumann tonunu başlatın.',
      '4 saniye burundan nefes alıp 7 saniye tutun, 8 saniyede ağızdan yavaşça verin.',
      'Zihinde göğüs merkezinde yeşil şifa aurasını imgeleyin.'
    ],
    affectedChakras: ['Solar Pleksus', 'Kalp Çakrası'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Sabah uyanınca ve akşam yatmadan önce',
      guidelines: 'Stereo kulaklık ile gözler kapalı, rahat bir oturma pozisyonunda uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Akut çarpıntı ve huzursuzluk ataklarında %40 azalma, nefes derinliği artışı.',
      phase2Days8to21: 'Panik tetikleyicilerine karşı duyarsızlaşma ve sinir sisteminde gevşeme.',
      phase3Days22Plus: 'Otonom sinir sistemi dengesi ve kalıcı iç huzur.'
    }
  },
  {
    id: 'insomnia_sleep',
    name: 'Kronik Uykusuzluk (İnsomnia) & Gece Uyanmaları',
    diseaseName: 'Kronik Uykusuzluk (İnsomnia) & Gece Uyanmaları',
    system: 'Epifiz Bezi & Sirkadiyen Ritim',
    category: 'Nörolojik & Zihinsel',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [432, 174, 285],
    secondaryFrequencyHz: 2.5,
    recommendedDurationMinutes: 30,
    esmaRecommendation: 'Yâ Hayy Yâ Kayyûm (156 Kez) - Yâ Bâsıt (72 Kez)',
    ayetRecommendation: 'Nebe Suresi 9. Ayet (Uykunuzu bir dinlenme kıldık)',
    culturalOrReligiousContext: 'İbn-i Sina ve Gevrekzade\'nin Rehavi makamı ile gece terennüm ettiği derin istirahat ve sekine frekansıdır.',
    binauralBeatHz: 2.5,
    carrierHz: 528,
    description: 'Melatonin salgılanmasını uyarır, kortizolü düşürerek derin Delta uyku fazına geçişi hızlandırır.',
    healingBenefits: 'Derin uyku süresini uzatır, REM döngüsünü onarır, sabah zinde uyanmayı sağlar.',
    symptoms: ['Uykuya dalmada 30+ dk gecikme', 'Gece sık sık bölünme', 'Sabah bitkin kalkma', 'Zihin gevezeliği'],
    protocolSteps: [
      'Odayı tamamen karartın, mavi ışık kaynaklarını kapatın.',
      'Yatmadan 15 dakika önce 2.5 Hz Delta binaural tonunu açın.',
      'Bedeninizi baştan ayağa gevşeterek pasif dinleme modunda kalın.'
    ],
    affectedChakras: ['Taç Çakra', 'Üçüncü Göz'],
    soundscapePreset: 'rain',
    usagePrescription: {
      durationPerSessionMinutes: 30,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Gece uyku öncesi',
      guidelines: 'Loş/karanlık ortamda yatakta uzanarak kulaklıkla dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Uykuya dalma süresi 15 dakikanın altına iner.',
      phase2Days8to21: 'Gece uyanma sıklığı azalır, derin delta evresi uzar.',
      phase3Days22Plus: 'Doğal biyolojik saat ve sirkadiyen ritim onarılır.'
    }
  },
  {
    id: 'chronic_migraine',
    name: 'Migren, Gerilim Tipi Baş Ağrısı & Beyin Sisi',
    diseaseName: 'Migren, Gerilim Tipi Baş Ağrısı & Beyin Sisi',
    system: 'Serebral Dolaşım & Nörolojik',
    category: 'Nörolojik & Zihinsel',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [174, 528, 852],
    secondaryFrequencyHz: 10.0,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Şâfî (391 Kez) - Yâ Nûr (256 Kez)',
    ayetRecommendation: 'Vâkıa Suresi 19. Ayet (Ondan ne başları ağrır ne de akılları gider)',
    culturalOrReligiousContext: 'Hicaz makamının beyin damarlarını gevşeten kadim şifa etkisiyle Solfejyo 741 Hz toksin atıcı rezonansının birleşimidir.',
    binauralBeatHz: 10.0,
    carrierHz: 741,
    description: 'Trigeminal sinir uyarımını yatıştırır, serebral damar spazmını çözer ve nöral ödemi azaltır.',
    healingBenefits: 'Ağrı şiddetini hafifletir, ışık/ses hassasiyetini kırar, zihinsel berraklık kazandırır.',
    symptoms: ['Tek taraflı zonklama', 'Göz arkasında basınç', 'Bulantı', 'Işık ve koku hassasiyeti', 'Konsantrasyon güçlüğü'],
    protocolSteps: [
      'Karanlık bir odada baş altına ince bir yastık koyarak uzanın.',
      'Alın ve şakaklara hafif dairesel dokunuş yaparken 741 Hz + 10 Hz Alfa frekansını dinleyin.',
      'Günde en az 2.5 litre ılık alkali su için.'
    ],
    affectedChakras: ['Üçüncü Göz (Ajna)', 'Taç Çakra'],
    soundscapePreset: 'tibetan_bowls',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 14,
      bestTimeOfDay: 'Ağrı başlangıcında veya öğle molasında',
      guidelines: 'Karanlık ve sessiz ortamda göz bandı ile uygulanması önerilir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Akut atak süresi ve şiddetinde %50 azalma.',
      phase2Days8to21: 'Aura evresi kısalır, atak sıklığı haftada 1\'in altına düşer.',
      phase3Days22Plus: 'Kronikleşmiş migren döngüsünde kalıcı hafifleme.'
    }
  },
  {
    id: 'depression_mood',
    name: 'Depresyon, Melankoli & Yaşama Sevinci Kaybı',
    diseaseName: 'Depresyon, Melankoli & Yaşama Sevinci Kaybı',
    system: 'Limbik Sistem & Nörotransmitterler',
    category: 'Nörolojik & Zihinsel',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [639, 852, 432],
    secondaryFrequencyHz: 12.0,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Vedûd (20 Kez) - Yâ Fettâh (489 Kez) - Yâ Bâsıt (72 Kez)',
    ayetRecommendation: 'Duha Suresi & Yusuf Suresi 86. Ayet (Ben kederimi ve hüznümü sadece Allah\'a arz ederim)',
    culturalOrReligiousContext: 'Mahur ve Uşşak makamlarının neşe, canlılık ve ferahlık veren kadim terennümüdür.',
    binauralBeatHz: 12.0,
    carrierHz: 528,
    description: 'Serotonin ve dopamin reseptör duyarlılığını artırır, sol prefrontal korteks aktivitesini dengeler.',
    healingBenefits: 'Ruhsal ağırlığı dağıtır, motivasyonu ve yaşamsal coşkuyu canlandırır.',
    symptoms: ['Sürekli hüzün ve keder', 'Enerjisizlik', 'İlgi ve zevk kaybı', 'Değersizlik hissi'],
    protocolSteps: [
      'Sabah pencereyi açıp gün ışığında 528 Hz frekansını dinleyin.',
      'Nefes alırken kalbinize beyaz ve pembe nur indiğini tahayyül edin.',
      'Günde 20 dakika hafif yürüyüşle birleştirin.'
    ],
    affectedChakras: ['Kalp Çakrası', 'Taç Çakra', 'Solar Pleksus'],
    soundscapePreset: 'forest',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 40,
      bestTimeOfDay: 'Sabah erken saatlerde ve ikindi vakti',
      guidelines: 'Güneş ışığı alan aydınlık bir ortamda uygulanmalıdır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Zihinsel karamsarlıkta kırılma, sabah kalkış enerjisinde artış.',
      phase2Days8to21: 'Duygusal tepkisellik azalır, günlük aktivitelere ilgi geri döner.',
      phase3Days22Plus: 'İçsel dinginlik ve dengeli duygu durumu.'
    }
  },
  {
    id: 'adhd_focus',
    name: 'Dikkat Dağınıklığı, DEHB & Odaklanma Problemi',
    diseaseName: 'Dikkat Dağınıklığı, DEHB & Odaklanma Problemi',
    system: 'Prefrontal Korteks & Dopaminerjik Ağ',
    category: 'Nörolojik & Zihinsel',
    primaryFrequency: 741,
    primaryFrequencyHz: 741,
    secondaryFrequencies: [852, 528, 432],
    secondaryFrequencyHz: 14.5,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Alîm (150 Kez) - Yâ Hakîm (78 Kez) - Yâ Hâdî (20 Kez)',
    ayetRecommendation: 'Tâhâ Suresi 114. Ayet (Rabbim benim ilmimi artır)',
    culturalOrReligiousContext: 'İsfahan makamının zihni toparlayıcı ve hafızayı keskinleştirici medrese şifa geleneğidir.',
    binauralBeatHz: 14.5,
    carrierHz: 741,
    description: 'Beta-1 beyin dalgalarını güçlendirerek duyusal filtrelemeyi geliştirir ve zihinsel sekmeleri önler.',
    healingBenefits: 'Çalışma odağını 3 katına çıkarır, zihinsel yorgunluğu azaltır, hafızayı kuvvetlendirir.',
    symptoms: ['Sürekli dikkat dağılması', 'İşleri tamamlayamama', 'Zihinsel hiperaktivite', 'Unutkanlık'],
    protocolSteps: [
      'Çalışmaya başlamadan 5 dakika önce kulaklıkla başlatın.',
      'Gereksiz bildirimleri kapatın ve tek bir göreve odaklanın.',
      'Her 45 dakikalık çalışma sonrası 5 dakika frekansla mola verin.'
    ],
    affectedChakras: ['Üçüncü Göz', 'Taç Çakra'],
    soundscapePreset: 'white_noise',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Çalışma veya ders başlangıcında',
      guidelines: 'Arka planda düşük ses seviyesinde (%40) dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Tek konuya odaklanma süresi 15 dakikadan 35 dakikaya yükselir.',
      phase2Days8to21: 'Zihinsel sıçramalar kontrol altına alınır, verimlilik artar.',
      phase3Days22Plus: 'Kalıcı odaklanma disiplini ve bilişsel netlik.'
    }
  },
  {
    id: 'ocd_rumination',
    name: 'OKB, Takıntılı Düşünceler & Zihinsel Gevezelik',
    diseaseName: 'OKB, Takıntılı Düşünceler & Zihinsel Gevezelik',
    system: 'Orbitofrontal Korteks & Bazal Gangliyon',
    category: 'Nörolojik & Zihinsel',
    primaryFrequency: 396,
    primaryFrequencyHz: 396,
    secondaryFrequencies: [417, 741, 528],
    secondaryFrequencyHz: 6.5,
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Kuddûs (170 Kez) - Yâ Vâcid (14 Kez) - Yâ Hâlık (731 Kez)',
    ayetRecommendation: 'Nâs Suresi & Felak Suresi',
    culturalOrReligiousContext: 'Vesvese ve takıntı döngülerini kıran 396 Hz kök frekansı, zihni arındırıcı Kuddûs esmasıyla tam uyumludur.',
    binauralBeatHz: 6.5,
    carrierHz: 396,
    description: 'Döngüsel nöral patikaları resetler, suçluluk ve kaygı kökenli kompulsiyon dürtülerini yatıştırır.',
    healingBenefits: 'Takıntılı düşüncelerin gücünü kırar, zihinsel esneklik ve kabulleniş sağlar.',
    symptoms: ['Tekrarlayan istenmeyen düşünceler', 'Sürekli kontrol etme dürtüsü', 'Kirlenme korkusu', 'Zihinsel sayma'],
    protocolSteps: [
      'Gözlerinizi kapatın ve düşünceleri izleyen bir gözlemci konumuna geçin.',
      '396 Hz sesini dinlerken nefesi verirken düşüncelerin suya bırakıldığını hayal edin.',
      'Kompulsiyon dürtüsü geldiğinde 3 dakika duraklayıp frekansa odaklanın.'
    ],
    affectedChakras: ['Kök Çakra', 'Üçüncü Göz'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 30,
      bestTimeOfDay: 'Öğle saatleri ve gece yatmadan önce',
      guidelines: 'Gözler kapalı ve diyafram nefesi eşliğinde dinlenmelidir.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Kompulsiyonu erteleme süresi uzar, zihinsel direnç artar.',
      phase2Days8to21: 'Takıntıların yarattığı anksiyete %50 azalır.',
      phase3Days22Plus: 'Döngüsel düşüncelerin otomatik sönümlenmesi.'
    }
  },
  {
    id: 'vertigo_tinnitus',
    name: 'Vertigo, Baş Dönmesi & Kulak Çınlaması (Tinnitus)',
    diseaseName: 'Vertigo, Baş Dönmesi & Kulak Çınlaması (Tinnitus)',
    system: 'Vestibüler Sistem & Koklear Sinir',
    category: 'Nörolojik & Zihinsel',
    primaryFrequency: 528,
    primaryFrequencyHz: 528,
    secondaryFrequencies: [741, 174, 432],
    secondaryFrequencyHz: 7.83,
    recommendedDurationMinutes: 20,
    esmaRecommendation: 'Yâ Semî (180 Kez) - Yâ Latîf (129 Kez)',
    ayetRecommendation: 'İsrâ Suresi 36. Ayet (Kulak, göz ve kalp; bunların hepsi sorumludur)',
    culturalOrReligiousContext: 'Kulak salyangozu ve denge kanallarındaki sıvı basıncını dengeleyen hücresel rezonanstır.',
    binauralBeatHz: 7.83,
    carrierHz: 528,
    description: 'İç kulak mikrosirkülasyonunu uyarır, koklear sinir liflerindeki elektriksel statik gürültüyü maskeleyip yatıştırır.',
    healingBenefits: 'Baş dönmesi hissini keser, çınlama frekansını bastırır ve denge merkezini güçlendirir.',
    symptoms: ['Yataktan kalkarken dönme hissi', 'Kulakta tiz düdük/uğultu sesi', 'Denge kaybı', 'Mide bulantısı'],
    protocolSteps: [
      'Göz seviyesinde sabit bir noktaya odaklanın.',
      '528 Hz frekansını hafif ses seviyesinde açarak başı ani hareket ettirmeden dinleyin.',
      'Bol su için ve tuz tüketimini sınırlandırın.'
    ],
    affectedChakras: ['Boğaz Çakrası', 'Üçüncü Göz'],
    soundscapePreset: 'ocean',
    usagePrescription: {
      durationPerSessionMinutes: 20,
      frequencyOfUsePerDay: 2,
      recommendedTotalDays: 21,
      bestTimeOfDay: 'Sabah kalkınca ve öğleden sonra',
      guidelines: 'Gözler açık sabit noktaya bakarak veya uzanarak uygulanır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Dönme nöbetlerinin süresi kısalır, çınlama şiddeti azalır.',
      phase2Days8to21: 'Vestibüler denge toparlanır, yürümede sersemlik hissi kaybolur.',
      phase3Days22Plus: 'İç kulak sıvı dengesi ve stabil işitme konforu.'
    }
  },
  {
    id: 'alzheimer_memory_support',
    name: 'Unutkanlık, Erken Evre Demans & Nöronal Hafıza Koruması',
    diseaseName: 'Unutkanlık, Erken Evre Demans & Nöronal Hafıza Koruması',
    system: 'Hipokampus & Sinaptik Plastisite',
    category: 'Nörolojik & Zihinsel',
    primaryFrequency: 852,
    primaryFrequencyHz: 852,
    secondaryFrequencies: [528, 963, 741],
    secondaryFrequencyHz: 40.0, // Gama 40Hz frekansı (MİT araştırması)
    recommendedDurationMinutes: 25,
    esmaRecommendation: 'Yâ Alîm (150 Kez) - Yâ Hâfız (998 Kez) - Yâ Muhsî (148 Kez)',
    ayetRecommendation: 'A\'lâ Suresi 6. Ayet (Sana okutacağız da asla unutmayacaksın)',
    culturalOrReligiousContext: 'Gama 40 Hz ışık ve ses dalgalarının beyindeki amiloid plak temizliğini uyardığı MIT laboratuvar bulguları ve Solfejyo 852 Hz berraklığıdır.',
    binauralBeatHz: 40.0,
    carrierHz: 852,
    description: 'Mikroglia hücrelerini uyararak serebral plak temizliğini destekler, hipokampal sinaptik bağlantıları güçlendirir.',
    healingBenefits: 'Kısa süreli hafızayı korur, kelime bulma zorluğunu ve zihinsel durgunluğu hafifletir.',
    symptoms: ['Yakın zamanlı olayları unutma', 'Kelime hatırlamada zorluk', 'Yön ve mekan karıştırma', 'Zihinsel yavaşlama'],
    protocolSteps: [
      'Günde 25 dakika 852 Hz + 40 Hz Gama frekansını kulaklıkla dinleyin.',
      'Dinleme esnasında zihinsel bulmacalar veya kelime oyunları oynayın.',
      'Omega-3 ve biberiye kokusu ile destekleyin.'
    ],
    affectedChakras: ['Üçüncü Göz', 'Taç Çakra'],
    soundscapePreset: 'tibetan_bowls',
    usagePrescription: {
      durationPerSessionMinutes: 25,
      frequencyOfUsePerDay: 1,
      recommendedTotalDays: 60,
      bestTimeOfDay: 'Sabah saatlerinde zihin dinçken',
      guidelines: 'Gama 40Hz nöral stimülasyon için düzenli günlük seanslar esastır.'
    },
    recoveryProcessTimeline: {
      phase1Days1to7: 'Günlük olayları hatırlama berraklığında artış.',
      phase2Days8to21: 'Kelime akıcılığı ve odaklanma süresinde güçlenme.',
      phase3Days22Plus: 'Sinaptik iletim hızında kalıcı direnç ve stabilite.'
    }
  }
];
