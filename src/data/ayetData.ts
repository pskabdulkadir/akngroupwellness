export interface AyetItem {
  id: string;
  surah: string;
  verseNumber: number;
  arabic: string;
  turkishTranslation: string;
  frequencyHz: number;
  healingCategory: 'Şifa Ayetleri' | 'Sekinet & İnşirah' | 'Korunma & Zırh' | 'Nazar & Arınma' | 'Kalp Nuru';
  benefit: string;
  dhikrDurationMinutes: number;
  targetChakra: string;
}

export const AYET_LIST: AyetItem[] = [
  {
    id: 'ayet_isra_82',
    surah: 'İsrâ',
    verseNumber: 82,
    arabic: 'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِلْمُؤْمِنِينَ',
    turkishTranslation: 'Biz Kur\'an\'dan, müminler için bir şifa ve rahmet olan şeyleri indiriyoruz.',
    frequencyHz: 528,
    healingCategory: 'Şifa Ayetleri',
    benefit: 'Bütün hücresel yapılara ilahi şifa ve rahmet frekansı yükler.',
    dhikrDurationMinutes: 10,
    targetChakra: 'Kalp & Taç Çakra'
  },
  {
    id: 'ayet_insirah_1_8',
    surah: 'İnşirâh',
    verseNumber: 1,
    arabic: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ',
    turkishTranslation: 'Biz senin göğsünü açıp genişletmedik mi?',
    frequencyHz: 432,
    healingCategory: 'Sekinet & İnşirah',
    benefit: 'Göğüsteki ağırlığı, stresi ve bunalımı tamamen dağıtır.',
    dhikrDurationMinutes: 15,
    targetChakra: 'Kalp Çakrası'
  },
  {
    id: 'ayet_ayete_l_kursi',
    surah: 'Bakara',
    verseNumber: 255,
    arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...',
    turkishTranslation: 'Allah O\'dur ki O\'ndan başka ilah yoktur. Hayy\'dır, Kayyûm\'dur...',
    frequencyHz: 963,
    healingCategory: 'Korunma & Zırh',
    benefit: 'Aurayı aşılmaz bir manyetik nur kalkanı ile korur, negatif enerjileri savar.',
    dhikrDurationMinutes: 12,
    targetChakra: 'Bütün Çakralar & Aura Kalkanı'
  },
  {
    id: 'ayet_nur_35',
    surah: 'Nûr',
    verseNumber: 35,
    arabic: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالأَرْضِ...',
    turkishTranslation: 'Allah, göklerin ve yerin nurudur...',
    frequencyHz: 852,
    healingCategory: 'Kalp Nuru',
    benefit: 'Bilinçte ilahi aydınlanma, sezgisel berraklık ve kalp gözünün açılması.',
    dhikrDurationMinutes: 15,
    targetChakra: 'Alın & Taç Çakra'
  },
  {
    id: 'ayet_kalem_51',
    surah: 'Kalem',
    verseNumber: 51,
    arabic: 'وَإِن يَكَادُ الَّذِينَ كَفَرُوا لَيُزْلِقُونَكَ بِأَبْصَارِهِمْ...',
    turkishTranslation: 'O inkarcılar neredeyse seni gözleriyle devireceklerdi...',
    frequencyHz: 741,
    healingCategory: 'Nazar & Arınma',
    benefit: 'Göz nazarını, psişik saldırıları ve biyolojik enerji sızıntılarını nötrler.',
    dhikrDurationMinutes: 10,
    targetChakra: 'Solar Pleksus & Boğaz'
  },
  {
    id: 'ayet_yunus_57',
    surah: 'Yûnus',
    verseNumber: 57,
    arabic: 'يَا أَيُّهَا النَّاسُ قَدْ جَاءَتْكُم مَّوْعِظَةٌ مِّن رَّبِّكُمْ وَشِفَاءٌ لِّمَا فِي الصُّدُورِ',
    turkishTranslation: 'Ey insanlar! Size Rabbinizden bir öğüt, gönüllerdeki dertlere bir şifa geldi.',
    frequencyHz: 639,
    healingCategory: 'Şifa Ayetleri',
    benefit: 'Gönül kırgınlıklarına, kederlere ve duygusal travmalara şifa verir.',
    dhikrDurationMinutes: 10,
    targetChakra: 'Kalp Çakrası'
  }
];
