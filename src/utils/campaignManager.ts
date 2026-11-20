import { 
  db,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from '../lib/db';

export interface CampaignItem {
  id: string;
  title: string;
  badge: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple';
  description: string;
  detailedContent?: string;
  discountRate?: string;
  couponCode?: string;
  validUntilText: string;
  targetAudience: 'all' | 'dealers' | 'members';
  isActive: boolean;
  featured?: boolean;
  buttonText?: string;
  whatsappMessage?: string;
  createdAt: number;
  updatedAt?: number;
}

const STORAGE_CAMPAIGNS_KEY = 'aurabio_campaigns_news_v1';

export const DEFAULT_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'camp-dealer-welcome',
    title: 'Paket Kredilerinde 1 USD = 1 Kredi',
    badge: 'KREDİ KURALI',
    badgeColor: 'amber',
    description: 'Tüm bayi paketlerinde her 1 USD karşılığında 1 kredi tanımlanır. Paket alımında ek bonus kredi uygulanmaz.',
    detailedContent: 'Paket kredisi, ödenen paket tutarına göre sunucu tarafından belirlenir ve kredi defterine tek seferde kaydedilir.',
    discountRate: '1 USD = 1 Kredi',
    couponCode: '',
    validUntilText: 'Sınırlı Kontenjan (İlk 50 Bayi)',
    targetAudience: 'dealers',
    isActive: false,
    featured: false,
    buttonText: 'Bayilik Başvurusu Yap',
    whatsappMessage: 'Merhaba, bayi paketleri ve kredi fiyatlandırması hakkında bilgi almak istiyorum.',
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'camp-altin-pro-special',
    title: 'Altın Pro Danışman Paketi',
    badge: '💎 EN POPÜLER FIRSAT',
    badgeColor: 'emerald',
    description: 'Altın Pro paketi, 603 USD karşılığında 603 seans kredisi içerir. Ek paket bonusu uygulanmaz.',
    detailedContent: 'Tam Biyo-Rezonans frekans modülleri, özel PDF danışan raporlama, 3D biyo-aura simülatörü ve VIP danışman desteği pakete dahildir.',
    discountRate: '1 USD = 1 Kredi',
    couponCode: '',
    validUntilText: 'Bu Ay Sonuna Kadar',
    targetAudience: 'all',
    isActive: false,
    featured: false,
    buttonText: 'Paketi İncele & Sipariş Ver',
    whatsappMessage: 'Merhaba, Altın Pro Danışman Paketi hakkında bilgi almak istiyorum.',
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: 'camp-quantum-upgrade',
    title: 'v2.8 Kuantum Frekans Güncellemesi ve Yeni Esma Modülleri Yayında',
    badge: '📢 SİSTEM DUYURUSU',
    badgeColor: 'cyan',
    description: 'AuraBio web yazılımına 99 Esma-ül Hüsna Solfeggio ses osiloskop aktarımı, 5 Letaif meridyen simülatörü ve akıllı saat nabız köprüsü eklendi.',
    detailedContent: 'Yeni sürümümüz ile birlikte tarama hassasiyeti %40 artırılmış, kamera optik spektrum ölçümleri yenilenmiş ve PDF teknik rapor ihracı kurumsal düzeye yükseltilmiştir. Tüm aktif üyelerimiz ücretsiz faydalanabilir.',
    discountRate: 'Ücretsiz Güncelleme',
    validUntilText: 'Süresiz / Canlıda',
    targetAudience: 'all',
    isActive: true,
    featured: false,
    buttonText: 'Modülleri Keşfet',
    whatsappMessage: 'Merhaba, v2.8 Kuantum güncellemesi ve sistem hakkında bilgi almak istiyorum.',
    createdAt: Date.now() - 86400000 * 6
  },
  {
    id: 'camp-clinic-master',
    title: 'Kurumsal Klinikler İçin Heyet Danışmanlığı & Eğitim Desteği',
    badge: '🏥 KLİNİK & MERKEZ',
    badgeColor: 'purple',
    description: '500 ve üzeri seans paketi alan tıp merkezleri ve kliniklere özel 1-e-1 online sistem oryantasyonu ve psikolojik heyet danışmanlığı hediye.',
    detailedContent: 'Psikolog Abdulkadir Kan ve biyo-rezonans heyetimiz tarafından kliniğinizin terapistlerine özel online sistem eğitimi, protokol hazırlama ve danışan analiz eğitimi ücretsiz verilmektedir.',
    discountRate: 'Ücretsiz Eğitim & Destek',
    couponCode: 'KLINIK-VIP',
    validUntilText: 'Aktif Kampanya',
    targetAudience: 'dealers',
    isActive: true,
    featured: false,
    buttonText: 'Klinik Bilgi Hattı',
    whatsappMessage: 'Merhaba, Klinik Heyet Danışmanlığı ve Eğitim Desteği kampanyası hakkında detaylı bilgi almak istiyorum.',
    createdAt: Date.now() - 86400000 * 8
  }
];

const PACKAGE_CREDIT_CAMPAIGN_IDS = new Set(['camp-dealer-welcome', 'camp-altin-pro-special']);

function normalizeCampaign(campaign: CampaignItem): CampaignItem {
  if (!PACKAGE_CREDIT_CAMPAIGN_IDS.has(campaign.id)) return campaign;
  const canonical = DEFAULT_CAMPAIGNS.find((item) => item.id === campaign.id)!;
  return {
    ...campaign,
    title: canonical.title,
    badge: canonical.badge,
    description: canonical.description,
    detailedContent: canonical.detailedContent,
    discountRate: canonical.discountRate,
    couponCode: '',
    isActive: false,
    featured: false,
    whatsappMessage: canonical.whatsappMessage,
  };
}

export function getLocalCampaigns(): CampaignItem[] {
  if (typeof window === 'undefined') return DEFAULT_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(STORAGE_CAMPAIGNS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeCampaign);
      }
    }
  } catch (e) {
    console.error('Failed to parse local campaigns:', e);
  }
  return DEFAULT_CAMPAIGNS;
}

export const getStoredCampaigns = getLocalCampaigns;

export function saveLocalCampaigns(campaigns: CampaignItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_CAMPAIGNS_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error('Failed to save local campaigns:', e);
  }
}

export async function fetchRemoteCampaigns(): Promise<CampaignItem[]> {
  try {
    if (!db) return getLocalCampaigns();
    const colRef = collection(db, 'campaigns_news');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      // Seed default campaigns if empty
      for (const camp of DEFAULT_CAMPAIGNS) {
        await setDoc(doc(db, 'campaigns_news', camp.id), camp, { merge: true });
      }
      saveLocalCampaigns(DEFAULT_CAMPAIGNS);
      return DEFAULT_CAMPAIGNS;
    }
    const items: CampaignItem[] = [];
    snapshot.forEach((d) => {
      items.push(normalizeCampaign({ ...(d.data() as CampaignItem), id: d.id }));
    });
    // Sort featured first, then newest
    items.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    saveLocalCampaigns(items);
    return items;
  } catch (e) {
    console.warn('Could not fetch remote campaigns, using local:', e);
    return getLocalCampaigns();
  }
}

export function subscribeToCampaigns(callback: (campaigns: CampaignItem[]) => void): () => void {
  // First emit local cached version
  callback(getLocalCampaigns());

  if (!db) {
    return () => {};
  }

  try {
    const colRef = collection(db, 'campaigns_news');
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        callback(getLocalCampaigns());
        return;
      }
      const items: CampaignItem[] = [];
      snapshot.forEach((d: any) => {
        items.push(normalizeCampaign({ ...(d.data() as CampaignItem), id: d.id }));
      });
      items.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      saveLocalCampaigns(items);
      callback(items);
    }, (err) => {
      console.warn('Campaigns onSnapshot error:', err);
      callback(getLocalCampaigns());
    });
  } catch (e) {
    console.warn('subscribeToCampaigns setup failed:', e);
    return () => {};
  }
}

export async function saveOrUpdateCampaign(campaign: CampaignItem): Promise<{ success: boolean; message: string }> {
  try {
    const updatedCamp: CampaignItem = normalizeCampaign({
      ...campaign,
      updatedAt: Date.now(),
      createdAt: campaign.createdAt || Date.now()
    });

    // Update local cache
    const current = getLocalCampaigns();
    const idx = current.findIndex(c => c.id === campaign.id);
    let newList: CampaignItem[];
    if (idx >= 0) {
      newList = [...current];
      newList[idx] = updatedCamp;
    } else {
      newList = [updatedCamp, ...current];
    }
    saveLocalCampaigns(newList);

    // Update Firestore if available
    if (db) {
      await setDoc(doc(db, 'campaigns_news', campaign.id), updatedCamp, { merge: true });
    }

    return { success: true, message: 'Kampanya başarıyla kaydedildi ve yayınlandı.' };
  } catch (e: any) {
    console.error('saveOrUpdateCampaign error:', e);
    return { success: false, message: e?.message || 'Kampanya kaydedilemedi.' };
  }
}

export async function deleteCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
  try {
    const current = getLocalCampaigns();
    const newList = current.filter(c => c.id !== campaignId);
    saveLocalCampaigns(newList);

    if (db) {
      await deleteDoc(doc(db, 'campaigns_news', campaignId));
    }

    return { success: true, message: 'Kampanya sistemden kaldırıldı.' };
  } catch (e: any) {
    console.error('deleteCampaign error:', e);
    return { success: false, message: e?.message || 'Kampanya silinemedi.' };
  }
}
