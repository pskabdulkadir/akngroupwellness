export type BerhetiyyePurpose = 'Arınma' | 'Koruma' | 'Denge' | 'Canlılık' | 'Odak';

export interface BerhetiyyeReading {
  order: number;
  name: string;
  arabic: string;
  letter: string;
  frequencyHz: number;
  waveProfile: string;
  purpose: BerhetiyyePurpose;
  focus: string;
  readingGuide: string;
}

export interface BerhetiyyeFrequency {
  id: string;
  name: string;
  frequencyHz: number;
  category: BerhetiyyePurpose;
  purpose: string;
  profile: string;
  durationMinutes: number;
  binauralHz: number;
}

export const BERHETIYYE_READINGS: BerhetiyyeReading[] = [
  { order: 1, name: 'Berhetîhin', arabic: 'بَرْهَتِيهٍ', letter: 'ا · Elif', frequencyHz: 174, waveProfile: 'Saf sinüs · yumuşak başlangıç', purpose: 'Arınma', focus: 'Başlangıçta dikkati toplama ve seansa geçiş.', readingGuide: 'Rahatça oturun; nefesi zorlamadan verin, adı sessizce veya alçak sesle 3 kez okuyun. İsterseniz 3 dakika dinleyin.' },
  { order: 2, name: 'Kerirîn', arabic: 'كَرِيرٍ', letter: 'ب · Be', frequencyHz: 285, waveProfile: 'Saf sinüs · düşük yoğunluk', purpose: 'Koruma', focus: 'Kişisel sınır ve güven hissine odaklanma.', readingGuide: 'Bir nefes alıp daha uzun verin; adı 3 kez okuyun ve çevrenizde rahat hissettiğiniz sınırları düşünün.' },
  { order: 3, name: 'Tetlîhin', arabic: 'تَتْلِيهٍ', letter: 'ج · Cim', frequencyHz: 396, waveProfile: 'Saf sinüs · yumuşak geçiş', purpose: 'Denge', focus: 'Dikkati mevcut ana getirme.', readingGuide: 'Omuzları gevşetin; adı 3 kez, her tekrar arasında bir doğal nefesle okuyun.' },
  { order: 4, name: 'Turânin', arabic: 'طُورَانٍ', letter: 'د · Dal', frequencyHz: 417, waveProfile: 'Saf sinüs · dengeli taşıyıcı', purpose: 'Arınma', focus: 'Seans öncesi zihinsel geçiş ve yenilenme niyeti.', readingGuide: 'Nefes verirken adı 3 kez okuyun; ardından 3 dakika düşük sesle dinleyin.' },
  { order: 5, name: 'Mezcelin', arabic: 'مَزْجَلٍ', letter: 'هـ · He', frequencyHz: 432, waveProfile: 'Saf sinüs · yumuşak taşıyıcı', purpose: 'Denge', focus: 'Sakin ve düzenli bir ritme yerleşme.', readingGuide: 'Nefesi doğal akışında tutun; adı 5 kez okuyun veya 5 dakikalık dinleme seçin.' },
  { order: 6, name: 'Bezcelin', arabic: 'بَزْجَلٍ', letter: 'و · Vav', frequencyHz: 528, waveProfile: 'Saf sinüs · orta taşıyıcı', purpose: 'Canlılık', focus: 'Niyet belirleme ve seans enerjisini yükseltme.', readingGuide: 'Seans niyetinizi kısa bir cümleyle belirleyin; adı 5 kez okuyun, sonra sessizce dinleyin.' },
  { order: 7, name: 'Terkabin', arabic: 'تَرْقَبٍ', letter: 'ز · Ze', frequencyHz: 639, waveProfile: 'Saf sinüs · orta-yüksek taşıyıcı', purpose: 'Denge', focus: 'İlişki ve çevreyle uyum niyetine odaklanma.', readingGuide: 'Nefesi eşitlemeye çalışmadan rahatça izleyin; adı 3 kez okuyun.' },
  { order: 8, name: 'Berheşin', arabic: 'بَرْهَشٍ', letter: 'ح · Ha', frequencyHz: 741, waveProfile: 'Saf sinüs · berrak üst ton', purpose: 'Odak', focus: 'Dikkati tek bir niyette toplama.', readingGuide: 'Gözleri açık veya kapalı tutun; adı 3 kez okuyup 3 dakika dinleyin.' },
  { order: 9, name: 'Ğalmeşin', arabic: 'غَلْمَشٍ', letter: 'ط · Tı', frequencyHz: 852, waveProfile: 'Saf sinüs · parlak üst ton', purpose: 'Koruma', focus: 'Kişisel sınırları ve güven hissini hatırlama.', readingGuide: 'Çevrenizde sizi rahatlatan bir alan imgeleyin; adı 3 kez, yavaşça okuyun.' },
  { order: 10, name: 'Hûtîrin', arabic: 'خُوطِيرٍ', letter: 'ي · Ye', frequencyHz: 963, waveProfile: 'Saf sinüs · hafif üst taşıyıcı', purpose: 'Odak', focus: 'Kapanışta sessiz dikkat ve tefekkür.', readingGuide: 'Ses seviyesini düşük tutun; adı 3 kez okuyup bir dakika sessiz kalın.' },
  { order: 11, name: 'Kalnehûdin', arabic: 'قَلْنَهُودٍ', letter: 'ك · Kef', frequencyHz: 174, waveProfile: 'Saf sinüs · yumuşak başlangıç', purpose: 'Denge', focus: 'Zihinsel yoğunluğu azaltmaya yönelik mola.', readingGuide: 'Rahat bir oturuş alın; adı 3 kez okuyun ve nefesinizi değiştirmeden izleyin.' },
  { order: 12, name: 'Berşânin', arabic: 'بَرْشَانٍ', letter: 'ل · Lam', frequencyHz: 285, waveProfile: 'Saf sinüs · düşük yoğunluk', purpose: 'Koruma', focus: 'Güvenli alan ve kişisel sınır niyeti.', readingGuide: 'Adı 5 kez okuyun; her okumadan sonra kısa bir sessizlik bırakın.' },
  { order: 13, name: 'Kazhîrin', arabic: 'كَظْهِيرٍ', letter: 'م · Mim', frequencyHz: 396, waveProfile: 'Saf sinüs · yumuşak geçiş', purpose: 'Arınma', focus: 'Günün yükünü bırakma niyeti.', readingGuide: 'Nefes verirken adı 3 kez okuyun; seans sonunda su için ve kısa mola verin.' },
  { order: 14, name: 'Nemûşelhın', arabic: 'نَمُوشَلْخٍ', letter: 'ن · Nun', frequencyHz: 417, waveProfile: 'Saf sinüs · dengeli taşıyıcı', purpose: 'Odak', focus: 'Dikkati bir sonraki işe hazırlama.', readingGuide: 'Adı 3 kez okuyun; ardından 5 dakika tek bir göreve odaklanın.' },
  { order: 15, name: 'Berheyûlâ', arabic: 'بَرْهَيُولاَ', letter: 'س · Sin', frequencyHz: 432, waveProfile: 'Saf sinüs · yumuşak taşıyıcı', purpose: 'Denge', focus: 'İçsel denge ve sükûnet niyeti.', readingGuide: 'Nefesi rahatça izleyin; adı 5 kez okuyun veya 5 dakika dinleyin.' },
  { order: 16, name: 'Beşkeylehın', arabic: 'بَشْكَيْلَخٍ', letter: 'ع · Ayın', frequencyHz: 528, waveProfile: 'Saf sinüs · orta taşıyıcı', purpose: 'Canlılık', focus: 'Seans için olumlu ve sakin bir niyet belirleme.', readingGuide: 'Niyetinizi belirleyin; adı 3 kez okuyun ve dinleme boyunca rahat oturun.' },
  { order: 17, name: 'Kazmezin', arabic: 'قَزْمَزٍ', letter: 'ف · Fe', frequencyHz: 639, waveProfile: 'Saf sinüs · orta-yüksek taşıyıcı', purpose: 'Koruma', focus: 'Kendini güvende hissetmeye yönelik odak.', readingGuide: 'Adı 3 kez okuyun; ardından dikkatinizi bulunduğunuz odadaki nötr bir nesneye verin.' },
  { order: 18, name: 'Enğalelîtin', arabic: 'اَنْغَلَلِيطٍ', letter: 'ص · Sad', frequencyHz: 741, waveProfile: 'Saf sinüs · berrak üst ton', purpose: 'Arınma', focus: 'Ortam değişikliği veya kısa mola ile yenilenme.', readingGuide: 'Pencereyi açmak gibi güvenli bir ortam molası verin; adı 3 kez okuyup 3 dakika dinleyin.' },
  { order: 19, name: 'Kabarâtın', arabic: 'قَبَرَاطٍ', letter: 'ق · Kaf', frequencyHz: 852, waveProfile: 'Saf sinüs · parlak üst ton', purpose: 'Denge', focus: 'Dikkati çevre ve beden farkındalığına getirme.', readingGuide: 'Ayakların zemine temasını fark edin; adı 3 kez okuyun.' },
  { order: 20, name: 'Ğayâhâ', arabic: 'غَيَاهَا', letter: 'ر · Ra', frequencyHz: 963, waveProfile: 'Saf sinüs · hafif üst taşıyıcı', purpose: 'Odak', focus: 'Kapanış ve kısa tefekkür.', readingGuide: 'Adı 3 kez okuyun; dinleme bitince bir dakika sessizce oturun.' },
  { order: 21, name: 'Keydehûlâ', arabic: 'كَيْدَهُولاَ', letter: 'ش · Şın', frequencyHz: 174, waveProfile: 'Saf sinüs · yumuşak başlangıç', purpose: 'Koruma', focus: 'Güven ve kişisel sınırları düşünme.', readingGuide: 'Rahat bir pozisyon seçin; adı 3 kez, sakin bir tempoda okuyun.' },
  { order: 22, name: 'Şemhahirin', arabic: 'شَمْخَاهِرٍ', letter: 'ت · Te', frequencyHz: 285, waveProfile: 'Saf sinüs · düşük yoğunluk', purpose: 'Denge', focus: 'Ortamda sakin ve düzenli bir ritim oluşturma.', readingGuide: 'Ortam sesini azaltın; adı 5 kez okuyup bir doğal nefeslik ara verin.' },
  { order: 23, name: 'Şemhahirin', arabic: 'شَمْخَاهِيرٍ', letter: 'ث · Se', frequencyHz: 396, waveProfile: 'Saf sinüs · yumuşak geçiş', purpose: 'Arınma', focus: 'Kısa mola ve seans geçişi.', readingGuide: 'Adı 3 kez okuyun; isterseniz pencereyi açıp ortamı havalandırın.' },
  { order: 24, name: 'Şemhâhîrin', arabic: 'شَمْهَاهِيرٍ', letter: 'خ · Hı', frequencyHz: 417, waveProfile: 'Saf sinüs · dengeli taşıyıcı', purpose: 'Odak', focus: 'Dikkati toparlayıp seansı sadeleştirme.', readingGuide: 'Adı 3 kez okuyun; bir sonraki adım için tek bir niyet seçin.' },
  { order: 25, name: 'Bikehtahûnîhin', arabic: 'بِكَهْطَهُونِيهٍ', letter: 'ذ · Zel', frequencyHz: 432, waveProfile: 'Saf sinüs · yumuşak taşıyıcı', purpose: 'Denge', focus: 'Düzenli ritim ve sabırlı dikkat.', readingGuide: 'Adı 5 kez, acele etmeden okuyun; ardından 3 dakika sessiz dinleyin.' },
  { order: 26, name: 'Beşârişin', arabic: 'بَشارِشٍ', letter: 'ض · Dat', frequencyHz: 528, waveProfile: 'Saf sinüs · orta taşıyıcı', purpose: 'Canlılık', focus: 'Seans sonunda tazelenme niyeti.', readingGuide: 'Adı 3 kez okuyun; seans sonunda ayağa kalkıp kısa bir esneme yapın.' },
  { order: 27, name: 'Tûneşin', arabic: 'طُونَشٍ', letter: 'ظ · Zı', frequencyHz: 639, waveProfile: 'Saf sinüs · orta-yüksek taşıyıcı', purpose: 'Odak', focus: 'Niyet bütünlüğü ve seansın son bölümü.', readingGuide: 'Adı 3 kez okuyup bir dakika sessiz kalın; rahat değilse dinlemeyi durdurun.' },
  { order: 28, name: 'Şemhâbârûhin', arabic: 'شَمْخَابَارُوحٍ', letter: 'غ · Ğayn', frequencyHz: 741, waveProfile: 'Saf sinüs · berrak üst ton', purpose: 'Denge', focus: 'Tertip sonu, seansı kapatma ve gündelik yaşama dönme.', readingGuide: 'Adı 3 kez okuyun; sesi kapatıp bir dakika dinlenin ve çevrenize yeniden odaklanın.' },
];

export const BERHETIYYE_FREQUENCIES: BerhetiyyeFrequency[] = [
  { id: 'clear', name: 'Alan ve ortam için sakin başlangıç', frequencyHz: 174, category: 'Arınma', purpose: 'Ortam değişimi ve seans başlangıcı için düşük tempolu odak.', profile: 'Saf sinüs, düşük taşıyıcı; uygulama içi kürasyon.', durationMinutes: 3, binauralHz: 4 },
  { id: 'settle', name: 'Dengeleyici geçiş', frequencyHz: 285, category: 'Denge', purpose: 'Nefesi fark etme ve kısa mola.', profile: 'Saf sinüs; yumuşak taşıyıcı.', durationMinutes: 3, binauralHz: 5 },
  { id: 'release', name: 'Yenilenme ve bırakma', frequencyHz: 396, category: 'Arınma', purpose: 'Seans başında dikkat geçişi için.', profile: 'Saf sinüs; yumuşak geçiş.', durationMinutes: 3, binauralHz: 6 },
  { id: 'reset', name: 'Odak tazeleme', frequencyHz: 417, category: 'Odak', purpose: 'Kısa çalışma veya tefekkür öncesi mola.', profile: 'Saf sinüs; dengeli taşıyıcı.', durationMinutes: 5, binauralHz: 7 },
  { id: 'calm', name: 'Sükûnet ve merkezlenme', frequencyHz: 432, category: 'Denge', purpose: 'Rahat bir dinleme ve nefes farkındalığı.', profile: 'Saf sinüs; yumuşak taşıyıcı.', durationMinutes: 5, binauralHz: 7.83 },
  { id: 'intention', name: 'Niyet ve canlılık', frequencyHz: 528, category: 'Canlılık', purpose: 'Günlük niyet belirleme ve seans odağı.', profile: 'Saf sinüs; orta taşıyıcı.', durationMinutes: 5, binauralHz: 8 },
  { id: 'boundary', name: 'Sınır ve uyum odağı', frequencyHz: 639, category: 'Koruma', purpose: 'Güven hissi ve kişisel sınırları hatırlama.', profile: 'Saf sinüs; orta-yüksek taşıyıcı.', durationMinutes: 5, binauralHz: 8 },
  { id: 'clarity', name: 'Berrak dikkat', frequencyHz: 741, category: 'Odak', purpose: 'Sessiz çalışma veya dikkat toparlama.', profile: 'Saf sinüs; berrak üst ton.', durationMinutes: 3, binauralHz: 10 },
  { id: 'reflect', name: 'Tefekkür ve kapanış', frequencyHz: 852, category: 'Odak', purpose: 'Kısa tefekkür ve seans sonu.', profile: 'Saf sinüs; parlak üst ton.', durationMinutes: 3, binauralHz: 10 },
  { id: 'close', name: 'Sessiz kapanış', frequencyHz: 963, category: 'Denge', purpose: 'Dinleme sonrası sessizliğe geçiş.', profile: 'Saf sinüs; hafif üst taşıyıcı.', durationMinutes: 3, binauralHz: 7.83 },
];

export const BERHETIYYE_PURPOSES = [
  { title: 'Zihinsel odak ve sükûnet', category: 'Odak' as const, frequencies: '417, 741, 852 ve 963 Hz', readingGroups: '8–10, 14, 20, 24 ve 27–28. maddeler', note: 'Sessiz okuma, kısa mola ve tek bir niyetle kullanılabilir.' },
  { title: 'Alan ve ortam dengesi', category: 'Arınma' as const, frequencies: '174, 396 ve 417 Hz', readingGroups: '1, 4, 13, 18 ve 23. maddeler', note: 'Havalandırma ve düzenleme gibi somut ortam adımlarıyla eşleştirilen uygulama içi odak.' },
  { title: 'Güven ve kişisel sınır', category: 'Koruma' as const, frequencies: '285, 639 ve 852 Hz', readingGroups: '2, 9, 12, 17 ve 21. maddeler', note: 'Güvenli alanı hatırlamaya yönelik kültürel/kişisel niyet çalışması.' },
  { title: 'Uygulama disiplini ve niyet', category: 'Canlılık' as const, frequencies: '432, 528 ve 639 Hz', readingGroups: '5–7, 15–16 ve 25–27. maddeler', note: 'Düzenli kısa seans, not alma ve tek bir hedef seçmeyle desteklenir.' },
];

export const BERHETIYYE_CLEANING_STAGES = [
  { order: 1, title: 'Alan ve ortam arındırma', frequencyHz: 174, minutes: 3, instructions: 'Odayı havalandırın, rahat bir oturuş seçin ve düşük sesle dinleyin. İsterseniz 1–4 veya 13. maddeyi sessizce okuyun.' },
  { order: 2, title: 'Frekans dengeleme ve sınır odağı', frequencyHz: 432, minutes: 3, instructions: 'Nefesi doğal akışında izleyin; kişisel güven ve sınır niyetinizi hatırlayın. İsterseniz 2, 5 veya 12. maddeyi okuyun.' },
  { order: 3, title: 'Kapanış ve sabitleme', frequencyHz: 639, minutes: 3, instructions: 'Dinleme sonunda sesi kapatın, çevrenizi fark edin ve bir dakika dinlenin. İsterseniz 7 veya 27. maddeyi okuyun.' },
];
