export interface CircadianSlot {
  hour: number;
  organ: string;
  element: string;
  chakra: string;
  recommendedHz: number;
  optimalActivity: string;
  colorHex: string;
}

export interface CircadianPrescription {
  period: 'morning' | 'noon' | 'evening' | 'night';
  periodTitle: string;
  timeRange: string;
  badgeBg: string;
  title: string;
  description: string;
  recommendedCarrierHz: number;
  recommendedBinauralHz: number;
  recommendedDurationMinutes: number;
  natureSound: 'ocean' | 'rain' | 'forest' | 'campfire' | 'tibetan_bowls' | 'none';
  recommendedMeditation?: string;
  recommendedFrequencyHz?: number;
  recommendedNature?: string;
  recommendedBreath?: string;
  [key: string]: any;
}

export const CIRCADIAN_ORGAN_CLOCK: CircadianSlot[] = [
  { hour: 5, organ: 'Kalın Bağırsak', element: 'Metal / Toprak', chakra: 'Kök Çakra', recommendedHz: 396, optimalActivity: 'Uyanış, su içme, arınma', colorHex: '#ef4444' },
  { hour: 7, organ: 'Mide', element: 'Toprak', chakra: 'Solar Pleksus', recommendedHz: 528, optimalActivity: 'Besleyici kahvaltı', colorHex: '#eab308' },
  { hour: 9, organ: 'Dalak / Pankreas', element: 'Toprak', chakra: 'Sakral Çakra', recommendedHz: 417, optimalActivity: 'Zihinsel odak ve çalışma', colorHex: '#f97316' },
  { hour: 11, organ: 'Kalp', element: 'Ateş', chakra: 'Kalp Çakrası', recommendedHz: 639, optimalActivity: 'Hafif öğle yemeği, sevgi ve tebessüm', colorHex: '#10b981' },
  { hour: 13, organ: 'İnce Bağırsak', element: 'Ateş', chakra: 'Solar Pleksus', recommendedHz: 528, optimalActivity: 'Sindirimi tamamlama, kısa yürüyüş', colorHex: '#eab308' },
  { hour: 15, organ: 'Mesane', element: 'Su', chakra: 'Sakral Çakra', recommendedHz: 417, optimalActivity: 'Sıvı tüketimi, verimli çalışma', colorHex: '#f97316' },
  { hour: 17, organ: 'Böbrekler', element: 'Su', chakra: 'Kök Çakra', recommendedHz: 396, optimalActivity: 'Biyo-enerji yenileme, hafif egzersiz', colorHex: '#ef4444' },
  { hour: 19, organ: 'Perikard (Kalp Zarı)', element: 'Ateş', chakra: 'Kalp & Boğaz', recommendedHz: 639, optimalActivity: 'Akşam yemeği, aile sohbeti', colorHex: '#10b981' },
  { hour: 21, organ: 'Üçlü Isıtıcı (Endokrin)', element: 'Ateş', chakra: 'Boğaz & Alın', recommendedHz: 741, optimalActivity: 'Gevşeme, ekranları kapatma, okuma', colorHex: '#06b6d4' },
  { hour: 23, organ: 'Safra Kesesi', element: 'Ağaç', chakra: 'Alın Çakrası', recommendedHz: 852, optimalActivity: 'Uykuya geçiş, hücresel dinlenme', colorHex: '#6366f1' },
  { hour: 1, organ: 'Karaciğer', element: 'Ağaç', chakra: 'Solar & Alın', recommendedHz: 528, optimalActivity: 'Derin detoks uykusu', colorHex: '#10b981' },
  { hour: 3, organ: 'Akciğerler', element: 'Metal', chakra: 'Boğaz & Taç', recommendedHz: 963, optimalActivity: 'Derin oksijenlenme, sahur / teheccüd vakti', colorHex: '#8b5cf6' }
];

export function getCurrentCircadianSlot(): CircadianSlot {
  const curHour = new Date().getHours();
  const sorted = [...CIRCADIAN_ORGAN_CLOCK].sort((a, b) => a.hour - b.hour);
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (curHour >= sorted[i].hour) {
      return sorted[i];
    }
  }
  return sorted[sorted.length - 1];
}

export class CircadianEngine {
  public static getPrescription(): CircadianPrescription {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
      return {
        period: 'morning',
        periodTitle: 'Sabah Canlanma & Odak',
        timeRange: '05:00 - 11:00',
        badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        title: 'Güne Yüksek Biyo-Enerji ve Zihinsel Berraklıkla Başlayın',
        description: 'Günün bu saatinde kortizol ve metabolizma uyanışı gerçekleşir. 528 Hz DNA onarım ve 10 Hz Alfa dalgaları zihni berraklaştırır.',
        recommendedCarrierHz: 528,
        recommendedBinauralHz: 10.0,
        recommendedDurationMinutes: 10,
        natureSound: 'forest'
      };
    } else if (hour >= 11 && hour < 17) {
      return {
        period: 'noon',
        periodTitle: 'Öğle & İkindi Dengesi',
        timeRange: '11:00 - 17:00',
        badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        title: 'Öğle Stresi Boşaltımı ve Kalp Koheransı',
        description: 'Yoğun iş temposunun getirdiği zihinsel yorgunluğu ve kalp ritmini dengelemek için 639 Hz kalp armonisi önerilir.',
        recommendedCarrierHz: 639,
        recommendedBinauralHz: 7.83,
        recommendedDurationMinutes: 15,
        natureSound: 'ocean'
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        period: 'evening',
        periodTitle: 'Akşam Sakinleşme & Arınma',
        timeRange: '17:00 - 22:00',
        badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
        title: 'Günün Yorgunluğunu Bırakma & Parasempatik Geçiş',
        description: 'Akşam saatlerinde sinir sistemini gevşetmek ve melatonin sentezine zemin hazırlamak için 432 Hz Schumann frekansı idealdir.',
        recommendedCarrierHz: 432,
        recommendedBinauralHz: 4.5,
        recommendedDurationMinutes: 15,
        natureSound: 'rain'
      };
    } else {
      return {
        period: 'night',
        periodTitle: 'Gece Derin Detoks & Uyku',
        timeRange: '22:00 - 05:00',
        badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        title: 'Derin Delta Uykusu & Hücresel Gece Onarımı',
        description: 'Karaciğer ve hücresel detoks fazı için 396 Hz + 2.5 Hz Delta beyin dalgaları önerilir.',
        recommendedCarrierHz: 396,
        recommendedBinauralHz: 2.5,
        recommendedDurationMinutes: 20,
        natureSound: 'tibetan_bowls'
      };
    }
  }
}

export default CircadianEngine;
