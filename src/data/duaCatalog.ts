export interface DuaEntry {
  id: string;
  name: string;
  reference: string;
  arabic: string;
  transliteration: string;
  translation: string;
  meaning: string;
  purposes: readonly string[];
  frequencyHz: number;
}

export interface MeditationMode {
  id: string;
  name: string;
  description: string;
  steps: readonly string[];
  recommendedMinutes: readonly number[];
}

// Çeviriler birebir meal değil, Türkçe anlam aktarımlarıdır.
// Hz değerleri uygulamanın ses tercihleridir; ayetlerle bilimsel veya tıbbi bir bağlantı iddia etmez.
export const DUA_CATALOG = [
  {
    id: 'fatiha-5',
    name: 'Fâtiha',
    reference: 'Fâtiha 1:1–7',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    transliteration: 'Bismillâhirrahmânirrahîm. Elhamdu lillâhi rabbi’l-âlemîn. Errahmânirrahîm. Mâliki yevmi’d-dîn. İyyâke na‘budu ve iyyâke neste‘în. İhdine’s-sırâta’l-müstakîm. Sırâtallezîne en‘amte aleyhim ğayri’l-mağdûbi aleyhim ve le’d-dâllîn.',
    translation: 'Rahmân ve Rahîm olan Allah’ın adıyla. Hamd, âlemlerin Rabbi, Rahmân ve Rahîm, hesap gününün sahibi Allah’a mahsustur. Yalnız sana kulluk eder, yalnız senden yardım isteriz. Bizi doğru yola; kendilerine nimet verdiklerinin yoluna ilet, gazaba uğrayanların ve sapanların yoluna değil.',
    meaning: 'Hamd, rahmet, kulluk ve doğru yola yöneliş duası.',
    purposes: ['dua', 'huzur', 'manevi destek'],
    frequencyHz: 528,
  },
  {
    id: 'bakara-255',
    name: 'Ayetü’l Kürsî’den bölüm',
    reference: 'Bakara 2:255, başlangıcından bir bölüm',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    transliteration: 'Allâhu lâ ilâhe illâ huve’l-hayyu’l-kayyûm.',
    translation: 'Allah; O’ndan başka ilah yoktur. O, diridir ve her şeyi ayakta tutandır.',
    meaning: 'Allah’ın birliği, hayatı ve her şeyi ayakta tutması üzerine tefekkür.',
    purposes: ['tevhid', 'tefekkür'],
    frequencyHz: 963,
  },
  {
    id: 'ali-imran-159',
    name: 'Âl-i İmrân’dan bölüm',
    reference: 'Âl-i İmrân 3:159, ayetten bir bölüm',
    arabic: 'فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ',
    transliteration: 'Fe izâ azemte fe tevekkel alellâh.',
    translation: 'Karar verdiğinde Allah’a güvenip dayan.',
    meaning: 'Kararlılık ve tevekkül üzerine düşünme.',
    purposes: ['tevekkül', 'kararlılık', 'odaklanma'],
    frequencyHz: 432,
  },
  {
    id: 'yasin-58',
    name: 'Yâsîn',
    reference: 'Yâsîn 36:58',
    arabic: 'سَلَامٌ قَوْلًا مِن رَّبٍّ رَّحِيمٍ',
    transliteration: 'Selâmun kavlen min rabbin rahîm.',
    translation: 'Çok merhametli Rab’den bir söz olarak: Selam!',
    meaning: 'İlahi selam ve rahmet üzerine tefekkür.',
    purposes: ['selam', 'rahmet'],
    frequencyHz: 432,
  },
  {
    id: 'rahman-13',
    name: 'Rahmân',
    reference: 'Rahmân 55:13',
    arabic: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
    transliteration: 'Fe bi eyyi âlâi rabbikumâ tukezzibân.',
    translation: 'Öyleyse Rabbinizin hangi nimetlerini yalanlayabilirsiniz?',
    meaning: 'Nimetleri fark etme ve şükür üzerine düşünme.',
    purposes: ['şükür', 'farkındalık'],
    frequencyHz: 639,
  },
  {
    id: 'vakia-74',
    name: 'Vâkıa',
    reference: 'Vâkıa 56:74',
    arabic: 'فَسَبِّحْ بِاسْمِ رَبِّكَ الْعَظِيمِ',
    transliteration: 'Fe sebbih bismi rabbike’l-azîm.',
    translation: 'Öyleyse yüce Rabbinin adını tesbih et.',
    meaning: 'Allah’ı yüceltme ve anma.',
    purposes: ['tesbih', 'rızık ve bereket', 'zikir'],
    frequencyHz: 741,
  },
  {
    id: 'hasr-24',
    name: 'Haşr sonundan bölüm',
    reference: 'Haşr 59:24, ayetin son bölümü',
    arabic: 'يُسَبِّحُ لَهُ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ وَهُوَ الْعَزِيزُ الْحَكِيمُ',
    transliteration: 'Yusebbihu lehu mâ fi’s-semâvâti ve’l-ard, ve huve’l-azîzu’l-hakîm.',
    translation: 'Göklerde ve yerde olanlar O’nu tesbih eder. O, mutlak güç ve hikmet sahibidir.',
    meaning: 'Yaratılış ve ilahi hikmet üzerine tefekkür.',
    purposes: ['tesbih', 'tefekkür'],
    frequencyHz: 528,
  },
  {
    id: 'ihlas-1-4',
    name: 'İhlâs',
    reference: 'İhlâs 112:1–4',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
    transliteration: 'Kul huvallâhu ehad. Allâhu’s-samed. Lem yelid ve lem yûled. Ve lem yekun lehu kufuven ehad.',
    translation: 'De ki: O Allah birdir. Allah sameddir; her şey O’na muhtaçtır. O doğurmamış ve doğurulmamıştır. Hiçbir şey O’na denk değildir.',
    meaning: 'Allah’ın birliği ve benzersizliği üzerine düşünme.',
    purposes: ['tevhid', 'tefekkür'],
    frequencyHz: 528,
  },
  {
    id: 'felak-1',
    name: 'Felak',
    reference: 'Felak 113:1–5',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    transliteration: 'Kul eûzu bi rabbi’l-felak. Min şerri mâ halak. Ve min şerri ğâsikın izâ vekab. Ve min şerri’n-neffâsâti fi’l-ukad. Ve min şerri hâsidin izâ hased.',
    translation: 'De ki: Yarattığı şeylerin şerrinden, karanlığı çöktüğünde gecenin şerrinden, düğümlere üfleyenlerin şerrinden ve kıskandığı zaman kıskanç kişinin şerrinden sabahın Rabbine sığınırım.',
    meaning: 'Farklı kötülüklerden Allah’a sığınmayı dile getirir.',
    purposes: ['sığınma', 'korunma', 'dua'],
    frequencyHz: 396,
  },
  {
    id: 'nas-1',
    name: 'Nâs',
    reference: 'Nâs 114:1–6',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
    transliteration: 'Kul eûzu bi rabbi’n-nâs. Meliki’n-nâs. İlâhi’n-nâs. Min şerri’l-vesvâsi’l-hannâs. Ellezî yuvesvisu fî sudûri’n-nâs. Mine’l-cinneti ve’n-nâs.',
    translation: 'De ki: İnsanların göğüslerine vesvese veren, cinlerden ve insanlardan olan sinsi vesvesecinin şerrinden insanların Rabbine, insanların hükümdarına, insanların ilahına sığınırım.',
    meaning: 'İnsanı huzursuz eden vesveselerden Allah’a sığınmayı anlatır.',
    purposes: ['sığınma', 'korunma', 'huzur'],
    frequencyHz: 396,
  },
  {
    id: 'insirah-5-6',
    name: 'İnşirâh',
    reference: 'İnşirâh 94:5–6',
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    transliteration: 'Fe inne mea’l-usri yusrâ. İnne mea’l-usri yusrâ.',
    translation: 'Şüphesiz güçlükle beraber bir kolaylık vardır. Evet, güçlükle beraber bir kolaylık vardır.',
    meaning: 'Zorluk ve kolaylık üzerine umutla düşünme.',
    purposes: ['umut', 'sabır', 'ferahlık'],
    frequencyHz: 432,
  },
  {
    id: 'duha-5',
    name: 'Duhâ',
    reference: 'Duhâ 93:5',
    arabic: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ',
    transliteration: 'Ve le sevfe yu‘tîke rabbuke fe terdâ.',
    translation: 'Rabbin sana verecek ve sen de hoşnut olacaksın.',
    meaning: 'Peygambere yöneltilen ilahi vaat üzerine düşünme.',
    purposes: ['umut', 'tefekkür'],
    frequencyHz: 432,
  },
  {
    id: 'yunus-57',
    name: 'Yûnus’tan bölüm',
    reference: 'Yûnus 10:57, ayetten bir bölüm',
    arabic: 'يَا أَيُّهَا النَّاسُ قَدْ جَاءَتْكُم مَّوْعِظَةٌ مِّن رَّبِّكُمْ وَشِفَاءٌ لِّمَا فِي الصُّدُورِ',
    transliteration: 'Yâ eyyuhe’n-nâsu kad câetkum mev‘izatun min rabbikum ve şifâun limâ fi’s-sudûr.',
    translation: 'Ey insanlar! Size Rabbinizden bir öğüt ve gönüllerde olana bir şifa geldi.',
    meaning: 'İlahi öğüt ve gönüllere yönelik manevi şifa üzerine düşünme.',
    purposes: ['manevi destek', 'tefekkür'],
    frequencyHz: 639,
  },
  {
    id: 'yusuf-86',
    name: 'Yûsuf’tan bölüm',
    reference: 'Yûsuf 12:86, ayetten bir bölüm',
    arabic: 'إِنَّمَا أَشْكُو بَثِّي وَحُزْنِي إِلَى اللَّهِ',
    transliteration: 'İnnemâ eşkû bessî ve huznî ilallâh.',
    translation: 'Ben sıkıntımı ve üzüntümü yalnız Allah’a arz ediyorum.',
    meaning: 'Yakub’un üzüntüsünü Allah’a arz etmesi üzerine düşünme.',
    purposes: ['dua', 'sabır'],
    frequencyHz: 432,
  },
] as const satisfies readonly DuaEntry[];

export const MEDITATION_MODES = [
  {
    id: 'nefes', name: 'Nefes ve Sükûnet Meditasyonu',
    description: 'Doğal nefes, sakin bir ton ve anlam üzerine düşünme.',
    steps: ['Rahatça oturun ve nefesinizi zorlamadan izleyin.', 'Seçtiğiniz ayeti ve anlamını okuyun.', 'İsterseniz 432 Hz tonunu başlatın; nefesinize ve anlama dönün.', 'Seans sonunda kısa bir süre sessiz kalın.'],
    recommendedMinutes: [1, 3, 5, 10],
  },
  {
    id: 'tefekkur', name: 'Frekans Eşliğinde Tefekkür / Derin Odak',
    description: 'Seçilen ayetin anlamına sessizce odaklanma.',
    steps: ['Bir ayet ve süre seçin.', 'Metni ve anlamını okuyup bir düşünce belirleyin.', 'Seçili frekansı başlatın ve bu düşünce üzerinde durun.', 'Seans sonunda dikkatinizi çevrenize yöneltin.'],
    recommendedMinutes: [5, 10, 15, 30],
  },
  {
    id: 'korunma', name: 'Korunma, Ferahlık ve Arınma Meditasyonu',
    description: 'Sığınma niyetiyle okuma ve ardından sessiz tefekkür.',
    steps: ['Sığınma veya ferahlık temalı bir bölüm seçin.', 'Metni okuyun ve anlamını düşünün.', 'Bir süre seçip frekans seansını başlatın.', 'Seansı sakin bir dua veya sessizlikle tamamlayın.'],
    recommendedMinutes: [1, 3, 5, 10, 15, 30],
  },
  {
    id: 'aksam', name: 'Akşam / Uyku Öncesi Huzur Meditasyonu',
    description: 'Günü sakin bir okuma ve düşük sesli tonla bitirme.',
    steps: ['Rahat bir ortam ve kısa bir bölüm seçin.', 'Metni okuyun ve gününüzü sakinlikle değerlendirin.', 'Düşük sesle uygun süreyi başlatın.', 'Ses bittiğinde dinlenmeye geçin.'],
    recommendedMinutes: [1, 3, 5, 10, 15],
  },
] as const satisfies readonly MeditationMode[];

export const DUA_DURATIONS = [1, 3, 5, 10, 15, 30] as const;
