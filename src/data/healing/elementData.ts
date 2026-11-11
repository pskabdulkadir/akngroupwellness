import { HealingItem } from '../healingLibrary';

export const ELEMENT_HEALING_ITEMS: HealingItem[] = [
  {
    id: 'element_earth',
    category: 'elements',
    title: 'Toprak Elementi (Köklenme & Bereket)',
    description: 'Bedenin fiziksel dokularını ve kemik yapısını destekleyen yoğun topraklanma frekansı.',
    frequencyHz: 396,
    binauralHz: 7.83,
    colorHex: '#ef4444',
    elementOrChakra: 'Toprak',
    traditionOrOrigin: 'Kadim Simya & 5 Element',
    benefits: 'Fiziksel dayanıklılık, köklenme, güven hissi.',
    tags: ['element', 'toprak', '396hz', 'köklenme']
  },
  {
    id: 'element_water',
    category: 'elements',
    title: 'Su Elementi (Akış & Duygusal Arınma)',
    description: 'Hücre içi sıvıları ve lenf akışını düzenleyen arındırıcı su titreşimi.',
    frequencyHz: 417,
    binauralHz: 6.0,
    colorHex: '#06b6d4',
    elementOrChakra: 'Su',
    traditionOrOrigin: 'Kadim Simya & 5 Element',
    benefits: 'Duygusal esneklik, lenfatik detoks, akışkanlık.',
    tags: ['element', 'su', '417hz', 'arınma']
  },
  {
    id: 'element_fire',
    category: 'elements',
    title: 'Ateş Elementi (Dönüşüm & İrade)',
    description: 'Metabolizmayı hızlandıran ve negatif enerjileri yakan güçlü foton rezonansı.',
    frequencyHz: 528,
    binauralHz: 12.0,
    colorHex: '#eab308',
    elementOrChakra: 'Ateş',
    traditionOrOrigin: 'Kadim Simya & 5 Element',
    benefits: 'Metabolik canlılık, cesaret, irade gücü.',
    tags: ['element', 'ateş', '528hz', 'dönüşüm']
  }
];
