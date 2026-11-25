export interface MeditationMode {
  id: string;
  name: string;
  description: string;
  steps: readonly string[];
  recommendedMinutes: readonly number[];
}

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
