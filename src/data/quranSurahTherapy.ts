export interface QuranSurahTherapy {
  id: string;
  name: string;
  verseCount: number;
  theme: string;
  frequencyHz: number;
  applicationSteps: [string, string, string];
}

export const QURAN_SURAH_DISCLAIMER = 'Sûre ile Hz değeri arasındaki eşleşme uygulamanın ses ayarıdır; bilimsel veya tedavi edici bir bağlantısı yoktur. Bu protokol tıbbi terapi değildir; sağlık sorunlarında hekime başvurulmalıdır.';

export const QURAN_SURAH_THERAPY: QuranSurahTherapy[] = [
  {
    id: 'fatiha',
    name: 'Fâtiha',
    verseCount: 7,
    theme: 'Hamd, rahmet ve hidayet duası',
    frequencyHz: 528,
    applicationSteps: [
      'Sabah veya akşam, kendinize uygun bir sesle Fâtiha’yı üç kez okuyun ya da dinleyin.',
      'Her okuyuştan sonra anlamındaki bir cümle üzerinde kısa süre düşünün.',
      'Seansı sakin bir nefesle tamamlayın.',
    ],
  },
  {
    id: 'yasin',
    name: 'Yâsîn',
    verseCount: 83,
    theme: 'Ahiret ve diriliş üzerine tefekkür',
    frequencyHz: 432,
    applicationSteps: [
      'Sûreyi acele etmeden, bölümler hâlinde okuyun veya dinleyin.',
      'Her bölümden sonra kısa bir sessizlik bırakın.',
      'Tamamladıktan sonra en çok dikkat çeken mesajı bir yere not edin.',
    ],
  },
  {
    id: 'rahman',
    name: 'Rahmân',
    verseCount: 78,
    theme: 'Allah’ın nimetlerini hatırlama ve şükür',
    frequencyHz: 639,
    applicationSteps: [
      'Sûrede tekrarlanan nimet hatırlatmalarından birini seçip hayatınızdaki karşılığını düşünün.',
      'Okuyuşu yavaş tempoda yapın.',
      'Şükür cümlesiyle seansı kapatın.',
    ],
  },
  {
    id: 'vakia',
    name: 'Vâkıa',
    verseCount: 96,
    theme: 'Rızık, şükür ve kıyamet üzerine tefekkür',
    frequencyHz: 741,
    applicationSteps: [
      'Rızık ve kazanç konusundaki niyetinizi sessizce belirleyin.',
      'Sûreyi bir kez tamamen dinleyin, ikinci okuyuşta anlamına odaklanın.',
      'Seansı kısa bir nefes farkındalığıyla bitirin.',
    ],
  },
  {
    id: 'mulk',
    name: 'Mülk',
    verseCount: 30,
    theme: 'Kâinattaki düzen ve kudret üzerine tefekkür',
    frequencyHz: 396,
    applicationSteps: [
      'Gökyüzü veya doğa üzerine düşünerek sûreyi okuyun ya da dinleyin.',
      'Her beş ayette bir durup kısa bir sessizlik bırakın.',
      'Tefekkürünüzü bir cümle olarak yazın.',
    ],
  },
  {
    id: 'kehf',
    name: 'Kehf',
    verseCount: 110,
    theme: 'Sabır, iman ve kıssalar üzerine tefekkür',
    frequencyHz: 174,
    applicationSteps: [
      'Sûreyi cuma gününe özgü bir alışkanlık olarak okuyun veya dinleyin.',
      'Kıssalardan birini seçip sabır teması üzerinde düşünün.',
      'Seansı nefes egzersiziyle sonlandırın.',
    ],
  },
  {
    id: 'insirah',
    name: 'İnşirâh',
    verseCount: 8,
    theme: 'Zorlukların ardından gelen ferahlık üzerine tefekkür',
    frequencyHz: 432,
    applicationSteps: [
      'Kısa sûreyi üç kez okuyun ya da dinleyin.',
      'Yaşadığınız bir zorluğu düşünüp “yüsr” kavramı üzerinde kısa süre durun.',
      'Omuzlarınızı bırakarak seansı tamamlayın.',
    ],
  },
  {
    id: 'ihlas',
    name: 'İhlâs',
    verseCount: 4,
    theme: 'Tevhid ve sadelik üzerine tefekkür',
    frequencyHz: 852,
    applicationSteps: [
      'Sûreyi üç kez, her okuyuşta bir öncekinden yavaş okuyun.',
      'Tevhid cümlesi üzerinde kısa bir sessizlik bırakın.',
      'Seansı sakin bir nefesle kapatın.',
    ],
  },
  {
    id: 'felak',
    name: 'Felak',
    verseCount: 5,
    theme: 'Korunma sığınağı; geleneksel olarak nazar ve kötülüklerden korunma için okunur',
    frequencyHz: 285,
    applicationSteps: [
      'Muavvizeteyn’in ilk sûresini üç kez okuyun ya da dinleyin.',
      'Her okuyuşta korunma niyetinizi sessizce yenileyin.',
      'Seansı Nâs sûresiyle sürdürebilir ya da burada bitirebilirsiniz.',
    ],
  },
  {
    id: 'nas',
    name: 'Nâs',
    verseCount: 6,
    theme: 'Korunma sığınağı; Felak ile birlikte Muavvizeteyn olarak okunur',
    frequencyHz: 285,
    applicationSteps: [
      'Muavvizeteyn’in ikinci sûresini üç kez okuyun ya da dinleyin.',
      'Her okuyuşta korunma niyetinizi sessizce yenileyin.',
      'Seansı nefes farkındalığıyla tamamlayın.',
    ],
  },
];
