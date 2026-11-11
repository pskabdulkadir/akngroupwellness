import { CHAKRA_HEALING_ITEMS } from './healing/chakraData';
import { ISLAMIC_HEALING_ITEMS } from './healing/islamicData';
import { SUFI_HEALING_ITEMS } from './healing/sufiData';
import { SHAMANIC_HEALING_ITEMS } from './healing/shamanicData';
import { ELEMENT_HEALING_ITEMS } from './healing/elementData';
import { CELTIC_HEALING_ITEMS } from './healing/celticData';

export { 
  CHAKRA_HEALING_ITEMS, 
  ISLAMIC_HEALING_ITEMS, 
  SUFI_HEALING_ITEMS, 
  SHAMANIC_HEALING_ITEMS, 
  ELEMENT_HEALING_ITEMS, 
  CELTIC_HEALING_ITEMS 
};

export type HealingCategoryKey = 'chakras' | 'islamic' | 'sufi' | 'shamanic' | 'elements' | 'celtic';

export interface HealingItem {
  id: string;
  category: HealingCategoryKey;
  title: string;
  description: string;
  frequencyHz: number;
  binauralHz?: number;
  binauralBeat?: number;
  colorHex: string;
  themeColorHex?: string;
  bpm?: number;
  bijaOrDhikr?: string;
  traditionOrOrigin?: string;
  benefits?: string;
  makamOrScale?: string;
  treeOrRune?: string;
  elementOrChakra?: string;
  natureLayer?: string;
  soundType?: string;
  durationMinutes?: number;
  tags?: string[];
  [key: string]: any;
}

export interface HealingCategoryMeta {
  id?: string;
  key: HealingCategoryKey;
  title: string;
  shortTitle?: string;
  subtitle: string;
  tradition: string;
  iconName: string;
  colorHex: string;
  accentColor?: string;
  badge: string;
  totalCount?: number;
}

export const HEALING_CATEGORIES: HealingCategoryMeta[] = [
  {
    id: 'chakras',
    key: 'chakras',
    title: '7 Çakra & Solfeggio',
    shortTitle: '7 Çakra',
    subtitle: 'Sanskrit Kök Frekanslar & Bija Mantraları',
    tradition: 'Uzak Doğu & Hinduizm',
    iconName: 'Sparkles',
    colorHex: '#8b5cf6',
    accentColor: '#8b5cf6',
    badge: '7 Ana Merkez',
    totalCount: CHAKRA_HEALING_ITEMS.length
  },
  {
    id: 'islamic',
    key: 'islamic',
    title: 'İslami Şifa Frekansları',
    shortTitle: 'İslami Şifa',
    subtitle: '99 Esma-i Hüsna & Şifa Ayetleri Rezonansı',
    tradition: 'İslamiyet & Tasavvuf',
    iconName: 'Flame',
    colorHex: '#10b981',
    accentColor: '#10b981',
    badge: 'Kuddus & Şafi',
    totalCount: ISLAMIC_HEALING_ITEMS.length
  },
  {
    id: 'sufi',
    key: 'sufi',
    title: 'Sufi & Makam Terapisi',
    shortTitle: 'Sufi Makam',
    subtitle: '5 Letaif & Kadim Türk/İslam Musiki Makamları',
    tradition: 'Anadolu & Horasan Tasavvufu',
    iconName: 'Compass',
    colorHex: '#06b6d4',
    accentColor: '#06b6d4',
    badge: 'Ruhani Denge',
    totalCount: SUFI_HEALING_ITEMS.length
  },
  {
    id: 'shamanic',
    key: 'shamanic',
    title: 'Şamanik Ritim & Doğa',
    shortTitle: 'Şamanik Ritim',
    subtitle: 'Dört Yön, Ruh Hayvanları & Davul Transı',
    tradition: 'Sibirya & Orta Asya Tengricilik',
    iconName: 'Wind',
    colorHex: '#f97316',
    accentColor: '#f97316',
    badge: 'Doğa Bağı',
    totalCount: SHAMANIC_HEALING_ITEMS.length
  },
  {
    id: 'elements',
    key: 'elements',
    title: '5 Kadim Element',
    shortTitle: '5 Element',
    subtitle: 'Toprak, Su, Ateş, Hava, Eter Frekansları',
    tradition: 'Simya & Hermetizm',
    iconName: 'Layers',
    colorHex: '#eab308',
    accentColor: '#eab308',
    badge: 'Elementer Denge',
    totalCount: ELEMENT_HEALING_ITEMS.length
  },
  {
    id: 'celtic',
    key: 'celtic',
    title: 'Kelt & Druid Şifası',
    shortTitle: 'Kelt & Druid',
    subtitle: 'Ogham Ağaçları & Kutsal Pınar Frekansları',
    tradition: 'Kadim Kelt Druidizmi',
    iconName: 'Moon',
    colorHex: '#14b8a6',
    accentColor: '#14b8a6',
    badge: 'Kelt Mirası',
    totalCount: CELTIC_HEALING_ITEMS.length
  }
];

export const ALL_HEALING_ITEMS: Record<HealingCategoryKey, HealingItem[]> = {
  chakras: CHAKRA_HEALING_ITEMS,
  islamic: ISLAMIC_HEALING_ITEMS,
  sufi: SUFI_HEALING_ITEMS,
  shamanic: SHAMANIC_HEALING_ITEMS,
  elements: ELEMENT_HEALING_ITEMS,
  celtic: CELTIC_HEALING_ITEMS
};

export function getAllHealingItemsFlat(): HealingItem[] {
  return [
    ...CHAKRA_HEALING_ITEMS,
    ...ISLAMIC_HEALING_ITEMS,
    ...SUFI_HEALING_ITEMS,
    ...SHAMANIC_HEALING_ITEMS,
    ...ELEMENT_HEALING_ITEMS,
    ...CELTIC_HEALING_ITEMS
  ];
}

export const TOTAL_HEALING_COUNT = getAllHealingItemsFlat().length;
