export interface HeatmapZone {
  name: string;
  intensity: number; // 0-100
  xPct: number;
  yPct: number;
  status: string;
  recommendedHz: number;
}

export function generateBioHeatmap(bioEnergy: number, stressIndex: number): HeatmapZone[] {
  return [
    { name: 'Taç Bölgesi (Kranial)', intensity: Math.min(99, bioEnergy + 5), xPct: 50, yPct: 15, status: 'Aktif Rezonans', recommendedHz: 963 },
    { name: 'Alın & Epifiz (Üçüncü Göz)', intensity: Math.min(95, bioEnergy - 2), xPct: 50, yPct: 25, status: 'Dengeli', recommendedHz: 852 },
    { name: 'Boğaz & Tiroid', intensity: Math.max(30, 90 - stressIndex), xPct: 50, yPct: 35, status: 'Normal', recommendedHz: 741 },
    { name: 'Kalp & Timus Bezi', intensity: Math.min(98, bioEnergy + 8), xPct: 50, yPct: 48, status: 'Yüksek Koherans', recommendedHz: 639 },
    { name: 'Solar Pleksus (Mide)', intensity: Math.max(25, 100 - stressIndex * 0.8), xPct: 50, yPct: 60, status: stressIndex > 50 ? 'Hafif Gerilim' : 'Dengeli', recommendedHz: 528 },
    { name: 'Pelvik & Kök Enerji', intensity: Math.min(92, bioEnergy), xPct: 50, yPct: 78, status: 'Topraklanmış', recommendedHz: 396 }
  ];
}

export interface GlobalHeatmapNode {
  id: string;
  cityName: string;
  country: string;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  frequencyHz: number;
  binauralHz: number;
  intention: string;
  activeUsers: number;
  meditatorCount?: number;
  colorHex: string;
  timestamp: number;
  [key: string]: any;
}

export interface GlobalStatsData {
  totalActivePings: number;
  dominantGlobalFreqHz: number;
  averageCoherencePercent: number;
  topActiveRegion: string;
  totalActiveMeditators?: number;
  highestResonanceCity?: string;
  dominantIntention?: string;
  globalCoherenceScore?: number;
  globalCoherencePercent?: number;
  topFrequencyToday?: number;
  totalPingsToday?: number;
  [key: string]: any;
}

class HeatmapService {
  private nodes: GlobalHeatmapNode[] = [
    {
      id: 'node_ist',
      cityName: 'İstanbul',
      country: 'Türkiye',
      lat: 41.0082,
      lng: 28.9784,
      latitude: 41.0082,
      longitude: 28.9784,
      frequencyHz: 528,
      binauralHz: 7.83,
      intention: 'Kalp Açıklığı & Birlik Rezonansı',
      activeUsers: 1420,
      meditatorCount: 1420,
      colorHex: '#10b981',
      timestamp: Date.now()
    },
    {
      id: 'node_ank',
      cityName: 'Ankara',
      country: 'Türkiye',
      lat: 39.9334,
      lng: 32.8597,
      latitude: 39.9334,
      longitude: 32.8597,
      frequencyHz: 432,
      binauralHz: 10.0,
      intention: 'Huzur ve Zihinsel Berraklık',
      activeUsers: 850,
      meditatorCount: 850,
      colorHex: '#eab308',
      timestamp: Date.now()
    },
    {
      id: 'node_izm',
      cityName: 'İzmir',
      country: 'Türkiye',
      lat: 38.4237,
      lng: 27.1428,
      latitude: 38.4237,
      longitude: 27.1428,
      frequencyHz: 639,
      binauralHz: 6.0,
      intention: 'Sevgi Bağı ve Koherans',
      activeUsers: 620,
      meditatorCount: 620,
      colorHex: '#06b6d4',
      timestamp: Date.now()
    },
    {
      id: 'node_lon',
      cityName: 'Londra',
      country: 'İngiltere',
      lat: 51.5074,
      lng: -0.1278,
      latitude: 51.5074,
      longitude: -0.1278,
      frequencyHz: 528,
      binauralHz: 7.83,
      intention: 'Derin İyileşme ve Şifa',
      activeUsers: 410,
      meditatorCount: 410,
      colorHex: '#10b981',
      timestamp: Date.now()
    },
    {
      id: 'node_ber',
      cityName: 'Berlin',
      country: 'Almanya',
      lat: 52.5200,
      lng: 13.4050,
      latitude: 52.5200,
      longitude: 13.4050,
      frequencyHz: 963,
      binauralHz: 4.5,
      intention: 'Taç Çakra Kozmik Farkındalık',
      activeUsers: 380,
      meditatorCount: 380,
      colorHex: '#8b5cf6',
      timestamp: Date.now()
    },
    {
      id: 'node_tok',
      cityName: 'Tokyo',
      country: 'Japonya',
      lat: 35.6762,
      lng: 139.6503,
      latitude: 35.6762,
      longitude: 139.6503,
      frequencyHz: 528,
      binauralHz: 8.0,
      intention: 'Zen Sükuneti ve Hücresel Uyum',
      activeUsers: 590,
      meditatorCount: 590,
      colorHex: '#10b981',
      timestamp: Date.now()
    }
  ];

  private listeners: ((nodes: GlobalHeatmapNode[], stats: GlobalStatsData) => void)[] = [];

  public getStats(): GlobalStatsData {
    const total = this.nodes.reduce((acc, n) => acc + (n.meditatorCount || n.activeUsers || 1), 0);
    const dominant = this.nodes.length > 0 ? this.nodes[0].frequencyHz : 528;
    return {
      totalActivePings: total,
      totalActiveMeditators: total,
      dominantGlobalFreqHz: dominant,
      averageCoherencePercent: 96,
      globalCoherencePercent: 96,
      globalCoherenceScore: 96,
      topFrequencyToday: dominant,
      totalPingsToday: 4280,
      highestResonanceCity: this.nodes.length > 0 ? `${this.nodes[0].cityName}` : 'İstanbul',
      topActiveRegion: this.nodes.length > 0 ? `${this.nodes[0].cityName} (${this.nodes[0].country})` : 'İstanbul (Türkiye)',
      dominantIntention: this.nodes.length > 0 ? this.nodes[0].intention : 'Küresel Kalp Şifası & Barış'
    };
  }

  public subscribe(callback: (nodes: GlobalHeatmapNode[], stats: GlobalStatsData) => void): () => void {
    this.listeners.push(callback);
    callback(this.nodes, this.getStats());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public async emitAnonymousPing(freqHz: number, binauralHz: number, intention: string): Promise<void> {
    const lat = 39.9 + (Math.random() - 0.5) * 4;
    const lng = 32.8 + (Math.random() - 0.5) * 4;
    const newNode: GlobalHeatmapNode = {
      id: `ping_${Date.now()}`,
      cityName: 'Canlı Katılımcı',
      country: 'Kozmik Ağ',
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      frequencyHz: freqHz,
      binauralHz,
      intention,
      activeUsers: 1,
      meditatorCount: 1,
      colorHex: '#10b981',
      timestamp: Date.now()
    };

    this.nodes = [newNode, ...this.nodes];
    const stats = this.getStats();
    this.listeners.forEach(l => l(this.nodes, stats));
  }
}

export const heatmapService = new HeatmapService();
export default heatmapService;
