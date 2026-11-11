import { HealingItem } from '../healingLibrary';

export const SUFI_HEALING_ITEMS: HealingItem[] = [
  {
    id: 'sufi_rast_makam',
    category: 'sufi',
    title: 'Rast Makamı (Neşe & İçsel Canlılık)',
    description: 'Güne başlarken ve öğle saatlerinde zihne ferahlık ve manevi neşe veren kadim Türk musikisi makamı.',
    frequencyHz: 432,
    binauralHz: 10.0,
    colorHex: '#eab308',
    makamOrScale: 'Rast Makamı',
    traditionOrOrigin: 'Horasan & Anadolu Tasavvufu',
    benefits: 'Zihinsel canlılık, depresyon ve kederin giderilmesi.',
    tags: ['sufi', 'makam', 'rast', 'tasavvuf']
  },
  {
    id: 'sufi_nihavend_makam',
    category: 'sufi',
    title: 'Nihâvend Makamı (Huzur & Dinginlik)',
    description: 'Kalp ritmini dengeleyen, derin sükûnet ve sevgi hissi uyandıran şifa makamı.',
    frequencyHz: 639,
    binauralHz: 7.83,
    colorHex: '#10b981',
    makamOrScale: 'Nihâvend Makamı',
    traditionOrOrigin: 'Osmanlı Darüşşifaları',
    benefits: 'Kan basıncını düzenleme, kalp koheransı.',
    tags: ['sufi', 'makam', 'nihavend', 'kalp']
  },
  {
    id: 'sufi_hicaz_makam',
    category: 'sufi',
    title: 'Hicaz Makamı (Derin Tefekkür & Arınma)',
    description: 'Nefsi terbiye eden, derin huşu ve tefekkür sağlayan tasavvufi frekans.',
    frequencyHz: 528,
    binauralHz: 4.5,
    colorHex: '#8b5cf6',
    makamOrScale: 'Hicaz Makamı',
    traditionOrOrigin: 'Tasavvuf Sema Terapisi',
    benefits: 'Duygusal arınma, manevi derinlik ve tefekkür.',
    tags: ['sufi', 'makam', 'hicaz', 'sema']
  }
];
