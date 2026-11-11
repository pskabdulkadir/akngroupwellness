import { HealingItem } from '../healingLibrary';

export const CELTIC_HEALING_ITEMS: HealingItem[] = [
  {
    id: 'celtic_oak_ogham',
    category: 'celtic',
    title: 'Kutsal Meşe (Duir - Ogham Şifası)',
    description: 'Kadim Druidlerin güç ve bilgelik ağacı olan Meşe ağacının koruyucu titreşimi.',
    frequencyHz: 432,
    binauralHz: 7.83,
    colorHex: '#14b8a6',
    treeOrRune: 'Duir (Meşe)',
    traditionOrOrigin: 'Kelt Druid Geleneği',
    benefits: 'Aura kalkanı oluşturma, psişik dayanıklılık.',
    tags: ['kelt', 'druid', 'meşe', 'ogham']
  },
  {
    id: 'celtic_sacred_spring',
    category: 'celtic',
    title: 'Kutsal Kelt Pınarı (Brigid Şifası)',
    description: 'Yeraltı sularının ve tanrıça Brigid pınarlarının hücresel yenileyici frekansı.',
    frequencyHz: 528,
    binauralHz: 6.0,
    colorHex: '#06b6d4',
    traditionOrOrigin: 'Kelt Şifa Havzaları',
    benefits: 'Göz nuru, ilham, bağışıklık aktivasyonu.',
    tags: ['kelt', 'pınar', 'brigid', 'şifa']
  }
];
