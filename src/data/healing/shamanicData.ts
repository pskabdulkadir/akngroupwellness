import { HealingItem } from '../healingLibrary';

export const SHAMANIC_HEALING_ITEMS: HealingItem[] = [
  {
    id: 'shamanic_drum_trance',
    category: 'shamanic',
    title: 'Orta Asya Şaman Davulu (Tengri Transı)',
    description: '4-7 Hz Teta ritminde atan kutsal davul ile biyo-alan koruması ve derin trans.',
    frequencyHz: 174,
    binauralHz: 4.5,
    colorHex: '#f97316',
    traditionOrOrigin: 'Sibirya & Tengricilik',
    benefits: 'Topraklanma, korkuların salınımı, derin trans hali.',
    tags: ['şamanik', 'davul', 'teta', 'topraklanma']
  },
  {
    id: 'shamanic_four_directions',
    category: 'shamanic',
    title: 'Dört Yönün Ruhu & Doğa Şifası',
    description: 'Kuzey, Güney, Doğu ve Batı elementlerinin dengelendiği kutsal çember frekansı.',
    frequencyHz: 285,
    binauralHz: 6.0,
    colorHex: '#eab308',
    traditionOrOrigin: 'Kadim Şamanik Çember',
    benefits: 'Mekansal aura arındırma, doğal ritimle senkronizasyon.',
    tags: ['şamanik', 'dört_yön', 'çember', 'doğa']
  }
];
