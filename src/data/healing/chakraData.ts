import { HealingItem } from '../healingLibrary';

export interface ChakraDetail {
  id: string;
  name: string;
  sanskrit: string;
  frequency: number;
  color: string;
  location: string;
  element: string;
  seedMantra: string;
  affirmation: string;
}

export const CHAKRA_LIST: ChakraDetail[] = [
  { id: 'root', name: 'Kök Çakra', sanskrit: 'Muladhara', frequency: 396, color: '#ef4444', location: 'Omurga tabanı', element: 'Toprak', seedMantra: 'LAM', affirmation: 'Güvendeyim ve kökleniyorum.' },
  { id: 'sacral', name: 'Sakral Çakra', sanskrit: 'Svadhisthana', frequency: 417, color: '#f97316', location: 'Göbek altı', element: 'Su', seedMantra: 'VAM', affirmation: 'Duygularımı ve yaratıcılığımı seviyorum.' },
  { id: 'solar', name: 'Solar Pleksus', sanskrit: 'Manipura', frequency: 528, color: '#eab308', location: 'Mide bölgesi', element: 'Ateş', seedMantra: 'RAM', affirmation: 'İçsel gücüme güveniyorum.' },
  { id: 'heart', name: 'Kalp Çakrası', sanskrit: 'Anahata', frequency: 639, color: '#10b981', location: 'Göğüs kafesi', element: 'Hava', seedMantra: 'YAM', affirmation: 'Koşulsuz sevgiyle doluyum.' },
  { id: 'throat', name: 'Boğaz Çakrası', sanskrit: 'Vishuddha', frequency: 741, color: '#06b6d4', location: 'Boğaz', element: 'Eter', seedMantra: 'HAM', affirmation: 'Hakikatimi sevgiyle ifade ediyorum.' },
  { id: 'thirdeye', name: 'Üçüncü Göz', sanskrit: 'Ajna', frequency: 852, color: '#6366f1', location: 'İki kaş arası', element: 'Işık', seedMantra: 'OM', affirmation: 'Sezgilerim berrak ve keskin.' },
  { id: 'crown', name: 'Taç Çakra', sanskrit: 'Sahasrara', frequency: 963, color: '#8b5cf6', location: 'Başın tepe noktası', element: 'Kozmos', seedMantra: 'AUM', affirmation: 'Evrensel bilinçle birim.' }
];

export const CHAKRA_HEALING_ITEMS: HealingItem[] = CHAKRA_LIST.map(c => ({
  id: `chakra_${c.id}`,
  category: 'chakras',
  title: `${c.name} (${c.sanskrit})`,
  description: `${c.location} bölgesinde yer alan enerji merkezi. ${c.affirmation}`,
  frequencyHz: c.frequency,
  binauralHz: 7.83,
  colorHex: c.color,
  bijaOrDhikr: c.seedMantra,
  traditionOrOrigin: 'Hindu & Vedik',
  benefits: 'Enerjetik denge, aura saflaştırma, çakra hizalama',
  elementOrChakra: c.name,
  tags: ['çakra', c.sanskrit.toLowerCase(), 'solfeggio', 'meditasyon']
}));
