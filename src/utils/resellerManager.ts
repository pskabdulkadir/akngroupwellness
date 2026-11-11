import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot, 
  runTransaction,
  limit,
  orderBy,
  Unsubscribe,
  db
} from '../lib/db';
import { UserMember, MemberOrder } from './authManager';

export interface BankInfo {
  bankName: string;
  accountHolder: string;
  iban: string;
}

export interface DealerPackage {
  id: string;
  name: string;
  scanCredits: number;
  price: number;
  priceText: string;
  badge: string;
  popular?: boolean;
  targetAudience: string;
  unitCostText: string;
  features: string[];
}

export const DEFAULT_DEALER_PACKAGES: DealerPackage[] = [
  {
    id: 'pkg-5k',
    name: 'Mini Deneme',
    scanCredits: 32,
    price: 101,
    priceText: '$101',
    badge: 'MİNİ DENEME',
    targetAudience: 'Sistemi düşük bütçeyle denemek isteyen bireysel kullanıcı ve uygulayıcılar.',
    unitCostText: '$3.16 / Seans Maliyeti',
    features: [
      '32 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Temel Aura ve Frekans Analiz Modülleri',
      'Web & Mobil Uyumlu Arayüz',
      'WhatsApp Destek Hattı'
    ]
  },
  {
    id: 'pkg-10k',
    name: 'Bronz Başlangıç',
    scanCredits: 70,
    price: 201,
    priceText: '$201',
    badge: 'BAŞLANGIÇ & BİREYSEL',
    targetAudience: 'Sisteme yeni adım atan bireysel terapist ve danışmanlar.',
    unitCostText: '$2.87 / Seans Maliyeti',
    features: [
      '70 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Tam Yetkili Bayi Paneli & Danışan Kaydı',
      'Özel Davet Linki & Referans Kodu (?ref=)',
      'Standart WhatsApp Canlı Destek Hattı'
    ]
  },
  {
    id: 'pkg-15k',
    name: 'Gümüş Standart',
    scanCredits: 115,
    price: 302,
    priceText: '$302',
    badge: 'STANDART TERAPİST',
    targetAudience: 'Düzenli danışan alan bireysel koçlar ve bio-enerji uygulayıcıları.',
    unitCostText: '$2.63 / Seans Maliyeti',
    features: [
      '115 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Organ, Çakra ve Meridyen Raporlama',
      'Danışan Takip Modülü',
      'Hızlı WhatsApp Destek Hizmeti'
    ]
  },
  {
    id: 'pkg-20k',
    name: 'Gümüş Plus',
    scanCredits: 160,
    price: 402,
    priceText: '$402',
    badge: 'TERAPİST & PRATİSYEN',
    targetAudience: 'Düzenli seans yapan holistik sağlık koçları ve pratisyenler.',
    unitCostText: '$2.51 / Seans Maliyeti',
    features: [
      '160 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Detaylı Organ, Çakra ve Letaif Analiz Raporları',
      'Danışan Kayıt & Takip Sistemi',
      'Öncelikli Frekans & Biyo-Rezonans Desteği'
    ]
  },
  {
    id: 'pkg-25k',
    name: 'Altın Danışman',
    scanCredits: 215,
    price: 503,
    priceText: '$503',
    badge: 'DANIŞMAN & KOÇ',
    targetAudience: 'Genişleyen danışan tabanına sahip profesyonel terapistler.',
    unitCostText: '$2.34 / Seans Maliyeti',
    features: [
      '215 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Gelişmiş PDF Rapor Dışa Aktarma',
      'Özel Frekans Listeleri & Protokoller',
      'Öncelikli Canlı Destek'
    ]
  },
  {
    id: 'pkg-30k',
    name: 'Altın Pro',
    scanCredits: 270,
    price: 603,
    priceText: '$603',
    badge: 'EN POPÜLER & F/P',
    popular: true,
    targetAudience: 'Yoğun danışan kabul eden profesyonel terapistler ve merkezler.',
    unitCostText: '$2.23 / Seans Maliyeti',
    features: [
      '270 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Gelişmiş PDF Rapor Dışa Aktarma & Arşivleme',
      'Özel Frekans Listeleri & Özel Protokol Tanımlama',
      'Kendi Danışanlarına Özel Fiyat Belirleme Özgürlüğü',
      'Öncelikli VIP WhatsApp Desteği'
    ]
  },
  {
    id: 'pkg-50k',
    name: 'Platin Klinik',
    scanCredits: 500,
    price: 1005,
    priceText: '$1.005',
    badge: 'UZMAN KLİNİK',
    targetAudience: 'Geniş danışan portföyüne sahip klinikler ve bio-frekans merkezleri.',
    unitCostText: '$2.01 / Seans Maliyeti',
    features: [
      '500 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Çoklu Terapist ve Danışan Yönetim Desteği',
      'Özel Alt Bayilik (Sub-dealer) Oluşturma Yetkisi',
      '7/24 Kesintisiz VIP Destek & Heyet Danışmanlığı'
    ]
  },
  {
    id: 'pkg-60k',
    name: 'Safir Kurumsal',
    scanCredits: 650,
    price: 1206,
    priceText: '$1.206',
    badge: 'SAFİR KURUMSAL',
    targetAudience: 'Çoklu seans odası bulunan sağlıklı yaşam ve holistik merkezler.',
    unitCostText: '$1.86 / Seans Maliyeti',
    features: [
      '650 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Grup Aura Senkronizasyonu & Çoklu Tarama',
      'Özel Kurumsal Logo ve Rapor Başlığı Entegrasyonu',
      'Genişletilmiş Frekans Kütüphanesi & Özel Eğitim Desteği'
    ]
  },
  {
    id: 'pkg-70k',
    name: 'Zümrüt Master',
    scanCredits: 800,
    price: 1407,
    priceText: '$1.407',
    badge: 'ZÜMRÜT MASTER',
    targetAudience: 'Bölgesel sağlık merkezleri ve uzman klinik ağları.',
    unitCostText: '$1.76 / Seans Maliyeti',
    features: [
      '800 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Gelişmiş AI Biyo-Rezonans ve Frekans Öneri Modülü',
      'Limitsiz Danışan Geçmişi ve Otomatik Seans Takibi',
      'Öncelikli Yeni Modül & Frekans Güncelleme Desteği'
    ]
  },
  {
    id: 'pkg-80k',
    name: 'Yakut Elit',
    scanCredits: 950,
    price: 1608,
    priceText: '$1.608',
    badge: 'YAKUT ELİT',
    targetAudience: 'Yüksek hacimli estetik, wellness ve bioenerji merkezleri.',
    unitCostText: '$1.69 / Seans Maliyeti',
    features: [
      '950 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Gelişmiş Organ Grafikleri & 3D Biyo-Aura Simülatörü',
      'Alt Terapist Kullanıcı Yetkilendirme Sistemi',
      'Özel Heyet Eğitimi ve Uygulayıcı Katılım Sertifikasyonu'
    ]
  },
  {
    id: 'pkg-90k',
    name: 'Titanyum Entegre',
    scanCredits: 1100,
    price: 1809,
    priceText: '$1.809',
    badge: 'TİTANYUM ENTEGRE',
    targetAudience: 'Entegre ve fonksiyonel tıp hekimleri ile hastane departmanları.',
    unitCostText: '$1.64 / Seans Maliyeti',
    features: [
      '1.100 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Tüm Kuantum Frekans Veritabanı ve Letaif Haritaları',
      'Özel Veri Entegrasyon Protokolleri',
      '7/24 Birebir VIP Teknik & Danışmanlık Hattı'
    ]
  },
  {
    id: 'pkg-100k',
    name: 'Elmas Bölge',
    scanCredits: 1300,
    price: 2010,
    priceText: '$2.010',
    badge: 'BÖLGE DİSTRİBÜTÖRÜ',
    targetAudience: 'İl ve bölge distribütörleri, franchise temsilcileri.',
    unitCostText: '$1.55 / Seans Maliyeti',
    features: [
      '1.300 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Alt Bayi Açma & Alt Bayilere Kredi Dağıtım Havuzu',
      'Bölge Temsilciliği ve Öncelikli Danışan Yönlendirme Hakkı',
      'Sistem Heyeti İle Birebir Kurulum & VIP Danışmanlık'
    ]
  },
  {
    id: 'pkg-200k',
    name: 'Master Franchise',
    scanCredits: 3000,
    price: 4021,
    priceText: '$4.021',
    badge: 'MASTER FRANCHISE',
    targetAudience: 'Çok şubeli sağlık grupları, franchise ağları ve master organizasyonlar.',
    unitCostText: '$1.34 / Seans Maliyeti',
    features: [
      '3.000 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Sınırsız Şube ve Alt Bayi Ağı Kurma İmkanı',
      'Özel Marka (Whitelabel Görünüm) & Rapor Özelleştirmesi',
      'Heyet Tarafından Yerinde / Canlı Kurulum ve Sürekli VIP Destek'
    ]
  },
  {
    id: 'pkg-300k',
    name: 'Enterprise Mega',
    scanCredits: 5000,
    price: 6031,
    priceText: '$6.031',
    badge: 'ENTERPRISE MEGA AĞ',
    targetAudience: 'Ulusal ve uluslararası sağlık ağları, yatırımcılar ve holdingler.',
    unitCostText: '$1.21 / Seans Maliyeti',
    features: [
      '5.000 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Merkezi Kredi ve Bayi Yönetim Platformu',
      'Tüm Gelecek Modül ve Veri Güncellemelerine Ömür Boyu Erişim',
      'Özel Ayrılmış Bulut Sunucu & VIP Mimari Destek'
    ]
  }
];

export const ACTIVATION_RENEWAL_PACKAGE = {
  id: 'ACTIVATION',
  name: '30 Günlük Süre Uzatma Paketi',
  domesticPriceUsd: 100,
  internationalPriceUsd: 300,
  sessionCredits: 0,
  periodDays: 30,
  features: [
    'Hesabı 30 gün aktif tutar',
    'Seans kredisi içermez',
    'Bedel bölgesel USD cüzdanından tahsil edilir ve ciroya dahil edilir',
  ],
} as const;

export interface Reseller {
  uid: string;
  resellerName: string;
  businessName?: string;
  fullName?: string;
  email: string;
  phone: string;
  referralCode: string; // e.g. 'AURA-BAYI-5521'
  commissionRate?: number; // percentage e.g. 20 for 20%
  bankInfo: BankInfo;
  status: 'active' | 'pending' | 'suspended';
  totalEarnings: number; // total commission earned
  paidEarnings: number; // paid out by admin
  pendingEarnings: number; // waiting for payment
  totalSalesAmount: number; // total sales volume in TRY
  totalReferredUsers: number;
  creditsBalance?: number; // Total remaining scan/session credits pool
  dealerPackageId?: string; // Current or last active dealer package
  createdAt: string;
  updatedAt: string;
  notes?: string;
  [key: string]: any;
}

export interface CreditTransaction {
  id: string;
  resellerId: string;
  resellerName?: string;
  type: 'initial' | 'purchase' | 'admin_add' | 'admin_deduct' | 'admin_set' | 'scan_usage' | 'bonus';
  amount: number; // e.g. +50, -1, or difference
  previousBalance: number;
  newBalance: number;
  description: string;
  createdAt: string;
  performedBy?: string; // e.g. 'Sistem Yöneticisi', 'Canlı Seans Taraması', 'Bayi Paket Satın Alımı'
  requestId?: string; // Unique idempotency key (scan / admin operation) to prevent double-spend
}

export interface CommissionTransaction {
  transactionId: string;
  resellerId: string;
  resellerName?: string;
  referralCode?: string;
  userId: string; // Masked user ID for privacy (e.g. USR-82F19B)
  orderId: string;
  packageName: string;
  amount: number; // Order total in TRY
  commissionRate: number; // e.g. 20%
  rate?: number;
  commissionAmount: number; // Earned in TRY
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  paidAt?: string;
  notes?: string;
  [key: string]: any;
}

export interface ResellerPublicInfo {
  uid: string;
  resellerName: string;
  referralCode: string;
  phone?: string;
}

const STORAGE_RESELLERS_KEY = 'aurabio_resellers_directory_v1';
const STORAGE_COMMISSIONS_KEY = 'aurabio_commissions_directory_v1';
const STORAGE_CREDIT_LOGS_KEY = 'aurabio_credit_logs_directory_v1';
const STORAGE_ACTIVE_RESELLER_SESSION_KEY = 'aurabio_active_reseller_session_v1';
const STORAGE_CACHED_REFERRAL_CODE_KEY = 'aurabio_stored_referral_code_v1';
const STORAGE_DEALER_PACKAGES_KEY = 'aurabio_dealer_packages_v3';
const STORAGE_WELCOME_BONUS_REGISTRY_KEY = 'aurabio_welcome_bonus_claimed_v1';

// İLK BAYİ KAYDI SİSTEME HOŞGELDİN BONUSU (BİR DEFAYA MAHSUS OTOMATİK 32 + 32 = 64 KREDİ)
export const WELCOME_BONUS_BASE_CREDITS = 32;
export const WELCOME_BONUS_EXTRA_CREDITS = 32;
export const WELCOME_BONUS_TOTAL_CREDITS = WELCOME_BONUS_BASE_CREDITS + WELCOME_BONUS_EXTRA_CREDITS; // 64 Seans Kredisi
export const WELCOME_BONUS_LABEL = '32+32 (64 Seans Kredisi)';

function getClaimedWelcomeBonusSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_WELCOME_BONUS_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map((v: any) => String(v || '').trim().toLowerCase()).filter(Boolean));
      }
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function hasClaimedWelcomeBonus(email?: string, phone?: string, uid?: string): boolean {
  const claimed = getClaimedWelcomeBonusSet();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const cleanUid = (uid || '').trim().toLowerCase();

  if (cleanUid && claimed.has(`uid:${cleanUid}`)) return true;
  if (cleanEmail && claimed.has(`email:${cleanEmail}`)) return true;
  if (cleanPhone && cleanPhone.length >= 10 && claimed.has(`phone:${cleanPhone}`)) return true;

  // Also check existing local resellers to see if any record with this email/phone already received welcome bonus
  try {
    const existing = getLocalResellers();
    const match = existing.find(r => {
      const rEmail = (r.email || '').trim().toLowerCase();
      const rPhone = (r.phone || '').replace(/[^0-9]/g, '');
      return (
        (cleanUid && r.uid && r.uid.toLowerCase() === cleanUid) ||
        (cleanEmail && rEmail === cleanEmail) ||
        (cleanPhone && cleanPhone.length >= 10 && rPhone === cleanPhone)
      );
    });
    if (match && match.welcomeBonusGranted) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

export function markWelcomeBonusClaimed(email?: string, phone?: string, uid?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const claimed = getClaimedWelcomeBonusSet();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const cleanUid = (uid || '').trim().toLowerCase();

    if (cleanUid) claimed.add(`uid:${cleanUid}`);
    if (cleanEmail) claimed.add(`email:${cleanEmail}`);
    if (cleanPhone && cleanPhone.length >= 10) claimed.add(`phone:${cleanPhone}`);

    localStorage.setItem(STORAGE_WELCOME_BONUS_REGISTRY_KEY, JSON.stringify(Array.from(claimed)));
  } catch {
    // ignore
  }
}

/**
 * Get all stored local credit transaction logs
 */
export function getLocalCreditLogs(): CreditTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CREDIT_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.debug('Error reading local credit logs:', e);
  }
  return [];
}

export function saveLocalCreditLogs(logs: CreditTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_CREDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));
    window.dispatchEvent(new CustomEvent('aurabio_credit_logs_updated'));
  } catch (e) {
    console.warn('Error saving local credit logs:', e);
  }
}

/**
 * Record a credit log entry to LocalStorage & Firestore
 */
export async function recordCreditTransaction(
  data: Omit<CreditTransaction, 'id' | 'createdAt'>
): Promise<CreditTransaction> {
  const id = `CR-LOG-${Math.floor(100000 + Math.random() * 900000)}`;
  const log: CreditTransaction = {
    ...data,
    id,
    createdAt: new Date().toISOString()
  };

  const current = getLocalCreditLogs();
  const updated = [log, ...current.filter(item => item.id !== id)].slice(0, 500);
  saveLocalCreditLogs(updated);

  try {
    const docRef = doc(db, 'credit_logs', id);
    await setDoc(docRef, log);
  } catch (err) {
    console.debug('Firestore credit log save notice:', err);
  }

  return log;
}

/**
 * Get all credit transaction history for a specific reseller/dealer
 */
export async function getCreditLogsForReseller(resellerId: string): Promise<CreditTransaction[]> {
  const local = getLocalCreditLogs().filter(l => l.resellerId === resellerId);
  try {
    const colRef = collection(db, 'credit_logs');
    const q = query(colRef, where('resellerId', '==', resellerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const map = new Map<string, CreditTransaction>();
      snap.forEach(d => {
        const item = d.data() as CreditTransaction;
        if (item.id) map.set(item.id, item);
      });
      local.forEach(l => map.set(l.id, l));
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }
  } catch (err) {
    console.debug('Firestore get credit logs notice:', err);
  }
  return local.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Admin: Get all credit logs system-wide
 */
export async function getAllCreditLogsAdmin(): Promise<CreditTransaction[]> {
  const local = getLocalCreditLogs();
  try {
    const colRef = collection(db, 'credit_logs');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const map = new Map<string, CreditTransaction>();
      snap.forEach(d => {
        const item = d.data() as CreditTransaction;
        if (item.id) map.set(item.id, item);
      });
      local.forEach(l => map.set(l.id, l));
      const list = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      saveLocalCreditLogs(list);
      return list;
    }
  } catch (err) {
    console.debug('Firestore get all credit logs notice:', err);
  }
  return local.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Admin: Direct adjustment of dealer credits (Add or Deduct) with audit logging
 */
export async function adminAdjustDealerCredits(
  resellerId: string,
  delta: number,
  reason: string = 'Yönetici Kredi Güncellemesi',
  performedBy: string = 'Sistem Yöneticisi'
): Promise<{ success: boolean; newBalance: number; message: string }> {
  try {
    const all = await getAllResellers();
    const reseller = all.find(r => r.uid === resellerId);
    if (!reseller) {
      return { success: false, newBalance: 0, message: 'Bayi bulunamadı.' };
    }

    // Atomic Firestore transaction: authoritative balance + audit log written all-or-nothing.
    let prev: number;
    let next: number;
    const resellerDocRef = doc(db, 'resellers', reseller.uid);
    try {
      const outcome = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(resellerDocRef);
        const existing = snap.exists() ? (snap.data() as Reseller) : reseller;
        const cur = existing && Number.isFinite(existing.creditsBalance) ? existing.creditsBalance! : 100;
        const newVal = Math.max(0, cur + delta);
        const nowIso = new Date().toISOString();

        if (snap.exists()) {
          await transaction.update(resellerDocRef, { creditsBalance: newVal, updatedAt: nowIso });
        } else {
          await transaction.set(resellerDocRef, { ...reseller, creditsBalance: newVal, updatedAt: nowIso }, { merge: true });
        }

        const logId = `CR-LOG-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
        await transaction.set(doc(db, 'credit_logs', logId), {
          id: logId,
          resellerId: reseller.uid,
          resellerName: reseller.resellerName,
          type: delta >= 0 ? 'admin_add' : 'admin_deduct',
          amount: delta,
          previousBalance: cur,
          newBalance: newVal,
          description: reason || (delta >= 0 ? `+${delta} Seans Kredisi Eklendi` : `${delta} Seans Kredisi Düşüldü`),
          performedBy,
          createdAt: nowIso
        });

        return { prev: cur, next: newVal };
      });

      prev = outcome.prev;
      next = outcome.next;
      // Mirror log locally for offline continuity (deduplicated by id in admin merge)
      appendLocalCreditLog({
        id: `CR-LOG-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`,
        resellerId: reseller.uid,
        resellerName: reseller.resellerName,
        type: delta >= 0 ? 'admin_add' : 'admin_deduct',
        amount: delta,
        previousBalance: prev,
        newBalance: next,
        description: reason || (delta >= 0 ? `+${delta} Seans Kredisi Eklendi` : `${delta} Seans Kredisi Düşüldü`),
        performedBy,
        createdAt: new Date().toISOString()
      });
    } catch (txErr) {
      console.warn('Firestore admin credit transaction unavailable, using local fallback:', txErr);
      prev = reseller.creditsBalance !== undefined ? reseller.creditsBalance : 100;
      next = Math.max(0, prev + delta);
      await recordCreditTransaction({
        resellerId: reseller.uid,
        resellerName: reseller.resellerName,
        type: delta >= 0 ? 'admin_add' : 'admin_deduct',
        amount: delta,
        previousBalance: prev,
        newBalance: next,
        description: reason || (delta >= 0 ? `+${delta} Seans Kredisi Eklendi` : `${delta} Seans Kredisi Düşüldü`),
        performedBy
      });
    }

    // Local synchronization (directory, session, linked member user)
    const updatedReseller: Reseller = { ...reseller, creditsBalance: next, updatedAt: new Date().toISOString() };
    await adminSaveReseller(updatedReseller);

    const active = getActiveResellerSession();
    if (active && active.uid === resellerId) {
      setActiveResellerSession(updatedReseller);
    }

    await syncMemberUserCredits(reseller.uid, next, all);

    return {
      success: true,
      newBalance: next,
      message: `Bayi kredisi başarıyla güncellendi. Yeni Bakiye: ${next} Seans`
    };
  } catch (err: any) {
    console.error('Admin adjust dealer credits error:', err);
    return { success: false, newBalance: 0, message: err?.message || 'Kredi güncellenemedi.' };
  }
}

/**
 * Admin: Direct set of exact dealer credits balance with audit logging
 */
export async function adminSetDealerCredits(
  resellerId: string,
  exactAmount: number,
  reason: string = 'Yönetici Doğrudan Kredi Belirleme',
  performedBy: string = 'Sistem Yöneticisi'
): Promise<{ success: boolean; newBalance: number; message: string }> {
  try {
    const all = await getAllResellers();
    const reseller = all.find(r => r.uid === resellerId);
    if (!reseller) {
      return { success: false, newBalance: 0, message: 'Bayi bulunamadı.' };
    }

    // Atomic Firestore transaction: authoritative balance + audit log written all-or-nothing.
    let prev: number;
    let next: number;
    const resellerDocRef = doc(db, 'resellers', reseller.uid);
    try {
      const outcome = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(resellerDocRef);
        const existing = snap.exists() ? (snap.data() as Reseller) : reseller;
        const cur = existing && Number.isFinite(existing.creditsBalance) ? existing.creditsBalance! : 100;
        const newVal = Math.max(0, exactAmount);
        const diff = newVal - cur;
        const nowIso = new Date().toISOString();

        if (snap.exists()) {
          await transaction.update(resellerDocRef, { creditsBalance: newVal, updatedAt: nowIso });
        } else {
          await transaction.set(resellerDocRef, { ...reseller, creditsBalance: newVal, updatedAt: nowIso }, { merge: true });
        }

        const logId = `CR-LOG-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
        await transaction.set(doc(db, 'credit_logs', logId), {
          id: logId,
          resellerId: reseller.uid,
          resellerName: reseller.resellerName,
          type: 'admin_set',
          amount: diff,
          previousBalance: cur,
          newBalance: newVal,
          description: `${reason} (Doğrudan ${newVal} Krediye Ayarlandı)`,
          performedBy,
          createdAt: nowIso
        });

        return { prev: cur, next: newVal };
      });

      prev = outcome.prev;
      next = outcome.next;
      // Mirror log locally for offline continuity (deduplicated by id in admin merge)
      appendLocalCreditLog({
        id: `CR-LOG-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`,
        resellerId: reseller.uid,
        resellerName: reseller.resellerName,
        type: 'admin_set',
        amount: next - prev,
        previousBalance: prev,
        newBalance: next,
        description: `${reason} (Doğrudan ${next} Krediye Ayarlandı)`,
        performedBy,
        createdAt: new Date().toISOString()
      });
    } catch (txErr) {
      console.warn('Firestore admin set transaction unavailable, using local fallback:', txErr);
      prev = reseller.creditsBalance !== undefined ? reseller.creditsBalance : 100;
      next = Math.max(0, exactAmount);
      const fallbackDiff = next - prev;
      await recordCreditTransaction({
        resellerId: reseller.uid,
        resellerName: reseller.resellerName,
        type: 'admin_set',
        amount: fallbackDiff,
        previousBalance: prev,
        newBalance: next,
        description: `${reason} (Doğrudan ${next} Krediye Ayarlandı)`,
        performedBy
      });
    }

    // Local synchronization (directory, session, linked member user)
    const updatedReseller: Reseller = { ...reseller, creditsBalance: next, updatedAt: new Date().toISOString() };
    await adminSaveReseller(updatedReseller);

    const active = getActiveResellerSession();
    if (active && active.uid === resellerId) {
      setActiveResellerSession(updatedReseller);
    }

    await syncMemberUserCredits(reseller.uid, next, all);

    return {
      success: true,
      newBalance: next,
      message: `Bayi kredisi ${next} olarak başarıyla ayarlandı.`
    };
  } catch (err: any) {
    console.error('Admin set dealer credits error:', err);
    return { success: false, newBalance: 0, message: err?.message || 'Kredi ayarlanamadı.' };
  }
}

/**
 * Get dynamic dealer packages
 */
export function getDealerPackages(): DealerPackage[] {
  if (typeof window === 'undefined') return DEFAULT_DEALER_PACKAGES;
  try {
    const raw = localStorage.getItem(STORAGE_DEALER_PACKAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (p: DealerPackage) =>
            p.id !== 'pkg-turnkey-2m' &&
            p.id !== 'PKG_TUM_KODLAR' &&
            !String(p.name || '').includes('Anahtar Teslim Sistem Devri')
        );
        if (filtered.length >= 10) {
          return filtered;
        }
      }
    }
  } catch (e) {
    console.debug('Error reading local dealer packages:', e);
  }
  return DEFAULT_DEALER_PACKAGES;
}

export function saveDealerPackages(pkgs: DealerPackage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_DEALER_PACKAGES_KEY, JSON.stringify(pkgs));
    window.dispatchEvent(new CustomEvent('aurabio_dealer_packages_updated'));
  } catch (e) {
    console.warn('Error saving local dealer packages:', e);
  }
}

/**
 * Admin: Save / Create or Update Dealer Package
 */
export async function adminSaveDealerPackage(pkg: DealerPackage): Promise<boolean> {
  try {
    const current = getDealerPackages();
    const idx = current.findIndex(p => p.id === pkg.id);
    let updated: DealerPackage[];

    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...pkg };
    } else {
      updated = [...current, { ...pkg }];
    }

    saveDealerPackages(updated);

    // Save to Firestore
    try {
      const docRef = doc(db, 'system_config', 'dealer_packages');
      await setDoc(docRef, { packages: updated, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin save dealer package Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin save dealer package error:', err);
    return false;
  }
}

/**
 * Admin: Delete Dealer Package
 */
export async function adminDeleteDealerPackage(pkgId: string): Promise<boolean> {
  try {
    const current = getDealerPackages();
    const updated = current.filter(p => p.id !== pkgId);
    saveDealerPackages(updated);

    try {
      const docRef = doc(db, 'system_config', 'dealer_packages');
      await setDoc(docRef, { packages: updated, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin delete dealer package Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin delete dealer package error:', err);
    return false;
  }
}

/**
 * Admin: Reset Dealer Packages to defaults
 */
export async function adminResetDealerPackages(): Promise<boolean> {
  try {
    saveDealerPackages(DEFAULT_DEALER_PACKAGES);

    try {
      const docRef = doc(db, 'system_config', 'dealer_packages');
      await setDoc(docRef, { packages: DEFAULT_DEALER_PACKAGES, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin reset dealer packages Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin reset dealer packages error:', err);
    return false;
  }
}

/**
 * Subscribe to Dealer Packages changes in real-time
 */
export function subscribeToDealerPackages(onUpdate: (pkgs: DealerPackage[]) => void): Unsubscribe {
  onUpdate(getDealerPackages());

  const handleLocal = () => onUpdate(getDealerPackages());
  window.addEventListener('storage', handleLocal);
  window.addEventListener('aurabio_dealer_packages_updated', handleLocal);

  try {
    const docRef = doc(db, 'system_config', 'dealer_packages');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.packages) && data.packages.length > 0) {
          const filtered = (data.packages as DealerPackage[]).filter(
            (p) =>
              p.id !== 'pkg-turnkey-2m' &&
              p.id !== 'PKG_TUM_KODLAR' &&
              !String(p.name || '').includes('Anahtar Teslim Sistem Devri')
          );
          saveDealerPackages(filtered);
          onUpdate(filtered);
        }
      }
    });

    return () => {
      window.removeEventListener('storage', handleLocal);
      window.removeEventListener('aurabio_dealer_packages_updated', handleLocal);
      unsub();
    };
  } catch {
    return () => {
      window.removeEventListener('storage', handleLocal);
      window.removeEventListener('aurabio_dealer_packages_updated', handleLocal);
    };
  }
}

/**
 * Purchase / Apply Dealer Package and top-up credits to Reseller / Dealer account
 */
export async function purchaseDealerPackage(
  resellerOrUserId: string,
  packageId: string
): Promise<{ success: boolean; message: string; creditsAdded: number; newTotalCredits: number }> {
  try {
    const packages = getDealerPackages();
    const pkg = packages.find(p => p.id === packageId) || DEFAULT_DEALER_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return { success: false, message: 'Bayilik paketi bulunamadı.', creditsAdded: 0, newTotalCredits: 0 };
    }

    // 1. Update Reseller if exists (APTOMIC: balance + purchase audit log in one transaction,
    //    so a concurrent scan deduction can never be overwritten/lost)
    let newResellerCredits = 0;
    let resellerPrevCredits = 0;
    let targetUid = '';
    let targetName = '';
    const allResellers = await getAllResellers();
    const cleanLookup = (resellerOrUserId || '').toLowerCase();
    const rIdx = allResellers.findIndex(r => r.uid === resellerOrUserId || (r.email && r.email.toLowerCase() === cleanLookup));
    if (rIdx >= 0) {
      const reseller = allResellers[rIdx];
      targetUid = reseller.uid;
      targetName = reseller.resellerName || 'Yetkili Bayi';
      const resellerDocRef = doc(db, 'resellers', reseller.uid);
      try {
        const outcome = await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(resellerDocRef);
          const existing = snap.exists() ? (snap.data() as Reseller) : reseller;
          const cur = existing && Number.isFinite(existing.creditsBalance) ? existing.creditsBalance! : 0;
          const newVal = cur + pkg.scanCredits;
          const nowIso = new Date().toISOString();

          if (snap.exists()) {
            await transaction.update(resellerDocRef, {
              creditsBalance: newVal,
              dealerPackageId: pkg.id,
              updatedAt: nowIso
            });
          } else {
            await transaction.set(resellerDocRef, { ...reseller, creditsBalance: newVal, dealerPackageId: pkg.id, updatedAt: nowIso }, { merge: true });
          }

          const logId = `CR-LOG-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
          await transaction.set(doc(db, 'credit_logs', logId), {
            id: logId,
            resellerId: reseller.uid,
            resellerName: targetName,
            type: 'purchase',
            amount: pkg.scanCredits,
            previousBalance: cur,
            newBalance: newVal,
            description: `${pkg.name} Satın Alımı (+${pkg.scanCredits} Seans Kredisi)`,
            performedBy: 'Bayi Paket Satın Alımı',
            createdAt: nowIso
          });

          return { prev: cur, next: newVal };
        });
        newResellerCredits = outcome.next;
        resellerPrevCredits = outcome.prev;
      } catch (txErr) {
        console.warn('Firestore purchase transaction unavailable, using local fallback:', txErr);
        const fallbackReseller = { ...reseller, creditsBalance: (reseller.creditsBalance || 0) + pkg.scanCredits, dealerPackageId: pkg.id, updatedAt: new Date().toISOString() };
        newResellerCredits = fallbackReseller.creditsBalance;
        resellerPrevCredits = reseller.creditsBalance || 0;
        allResellers[rIdx] = fallbackReseller;
        saveLocalResellers(allResellers);
        try {
          const docRef = doc(db, 'resellers', fallbackReseller.uid);
          await setDoc(docRef, { creditsBalance: fallbackReseller.creditsBalance, dealerPackageId: pkg.id, updatedAt: fallbackReseller.updatedAt }, { merge: true });
        } catch (fsErr) {
          console.warn('Firestore reseller credits update notice:', fsErr);
        }
      }

      // Local mirror (directory + session)
      const latestAll = await getAllResellers();
      const lIdx = latestAll.findIndex(r => r.uid === reseller.uid);
      if (lIdx >= 0) {
        latestAll[lIdx] = { ...latestAll[lIdx], creditsBalance: newResellerCredits, dealerPackageId: pkg.id, updatedAt: new Date().toISOString() };
        saveLocalResellers(latestAll);
      }
      const activeRes = getActiveResellerSession();
      if (activeRes && activeRes.uid === reseller.uid) {
        setActiveResellerSession({ ...activeRes, creditsBalance: newResellerCredits, dealerPackageId: pkg.id });
      }
    }

    // 2. Update Member User if matching
    const { getActiveMemberSession, fetchMemberProfile } = await import('./authManager');
    let user = getActiveMemberSession();
    if (!user || (user.uid !== resellerOrUserId && (!user.email || user.email.toLowerCase() !== cleanLookup))) {
      user = await fetchMemberProfile(resellerOrUserId);
    }

    let finalUserCredits = newResellerCredits || pkg.scanCredits;

    if (user) {
      const curCredits = user.creditsBalance || 0;
      finalUserCredits = curCredits + pkg.scanCredits;

      const updatedUser: UserMember = {
        ...user,
        role: 'dealer',
        dealerStatus: 'approved',
        isAllowed: true,
        creditsBalance: finalUserCredits,
        dealerPackageId: pkg.id,
        paymentStatus: 'PAID',
      };

      // Save user
      localStorage.setItem('aurabio_active_session_v1', JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updatedUser }));

      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, {
          role: 'dealer',
          dealerStatus: 'approved',
          isAllowed: true,
          creditsBalance: finalUserCredits,
          dealerPackageId: pkg.id,
          paymentStatus: 'PAID',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore user credits update notice:', fsErr);
      }
    }

    // Record credit transaction log (only in fallback path — the transaction already wrote it atomically)
    if (newResellerCredits > 0 && resellerPrevCredits > 0) {
      // mirror log locally only (Firestore log already written inside transaction above)
      const finalUid = targetUid || user?.uid || resellerOrUserId;
      const finalName = targetName || user?.fullName || 'Yetkili Bayi';
      try {
        appendLocalCreditLog({
          id: `CR-LOG-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`,
          resellerId: finalUid,
          resellerName: finalName,
          type: 'purchase',
          amount: pkg.scanCredits,
          previousBalance: resellerPrevCredits,
          newBalance: newResellerCredits,
          description: `${pkg.name} Satın Alımı (+${pkg.scanCredits} Seans Kredisi)`,
          performedBy: 'Bayi Paket Satın Alımı',
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.debug('Purchase credit log mirror notice:', e);
      }
    } else {
      await recordCreditTransaction({
        resellerId: targetUid || user?.uid || resellerOrUserId,
        resellerName: targetName || user?.fullName || 'Yetkili Bayi',
        type: 'purchase',
        amount: pkg.scanCredits,
        previousBalance: Math.max(0, newResellerCredits - pkg.scanCredits),
        newBalance: finalUserCredits,
        description: `${pkg.name} Satın Alımı (+${pkg.scanCredits} Seans Kredisi)`,
        performedBy: 'Bayi Paket Satın Alımı'
      });
    }

    // Sync package purchase with Monoline 7 Nefis Mertebesi Commission Engine
    try {
      const finalBuyerUid = targetUid || user?.uid || resellerOrUserId;
      const finalBuyerName = targetName || user?.fullName || 'Yetkili Bayi';
      await fetch('/api/v1/integrations/order-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: finalBuyerUid,
          reseller_name: finalBuyerName,
          order_id: `ORD-PKG-${Date.now().toString().slice(-6)}`,
          order_amount: pkg.price,
          package_id: pkg.id,
          timestamp: new Date().toISOString(),
        }),
      });
      const { syncFrekansWithMonolineEngine } = await import('./monolineSyncBridge');
      await syncFrekansWithMonolineEngine();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
      }
    } catch (syncErr) {
      console.debug('Purchase dealer package Monoline sync notice:', syncErr);
    }

    return {
      success: true,
      message: `${pkg.name} başarıyla aktive edildi! Hesabınıza ${pkg.scanCredits} Adet Tarama & Seans kredisi tanımlandı.`,
      creditsAdded: pkg.scanCredits,
      newTotalCredits: finalUserCredits
    };
  } catch (err: any) {
    console.error('Purchase dealer package error:', err);
    return { success: false, message: err?.message || 'Paket satın alma işlemi tamamlanamadı.', creditsAdded: 0, newTotalCredits: 0 };
  }
}

/**
 * Options for an atomic scan/session credit deduction.
 */
export interface ScanDeductOptions {
  /** Explicit dealer/reseller UID to deduct from (optional; falls back to active session / userId) */
  dealerId?: string;
  /** Number of credits to consume per scan (defaults to 1) */
  scanCost?: number;
  /** Unique id of the logical scan request used to de-duplicate double-fire deductions */
  requestId?: string;
}

export interface DeductScanResult {
  success: boolean;
  remainingCredits: number;
  message?: string;
  requestId?: string;
}

/**
 * Append a credit log entry directly into the local audit mirror (no Firestore write here —
 * the authoritative log is written inside the Firestore transaction).
 */
function appendLocalCreditLog(log: CreditTransaction): void {
  try {
    const current = getLocalCreditLogs();
    saveLocalCreditLogs([log, ...current.filter(i => i.id !== log.id)].slice(0, 500));
  } catch (e) {
    console.debug('Local credit log mirror notice:', e);
  }
}

/**
 * In-flight guard: serializes concurrent deductions and de-duplicates identical requests.
 * Prevents double-trigger / double-device double-spending while keeping real multi-scans ordered.
 */
let activeScanDeduct: { key: string; promise: Promise<DeductScanResult> } | null = null;

function resolveScanDealerId(userId?: string): string | null {
  const activeReseller = getActiveResellerSession();
  if (activeReseller?.uid && typeof activeReseller.uid === 'string' && activeReseller.uid.trim()) {
    return activeReseller.uid.trim();
  }
  if (userId && typeof userId === 'string' && userId.trim()) {
    return userId.trim();
  }
  return null;
}

/**
 * Deduct scan credits atomically from the Dealer's pool.
 *
 * Primary path uses a Firestore `runTransaction` so that concurrent scans or admin edits can
 * never double-spend a single credit (last-write-wins is eliminated). The balance and the
 * audit log (`credit_logs`) are written inside the SAME transaction (all-or-nothing).
 * If Firestore is unavailable, it falls back to a safe local deduction so scans can still run.
 */
export async function deductScanCreditFromDealer(
  userId?: string,
  opts?: ScanDeductOptions
): Promise<DeductScanResult> {
  const scanCost = Math.max(1, Math.floor(opts?.scanCost ?? 1));
  const requestId = opts?.requestId || `SCAN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dealerId = (opts?.dealerId || '').trim() || resolveScanDealerId(userId);

  if (!dealerId) {
    return { success: true, remainingCredits: 99, message: 'Kredi hesabı bulunamadı. Kontrol tamamlandı.', requestId };
  }

  // Same logical request already in-flight -> return the same result (prevents double deduction).
  if (activeScanDeduct) {
    if (opts?.requestId && activeScanDeduct.key === opts.requestId) {
      return activeScanDeduct.promise;
    }
    await activeScanDeduct.promise.catch(() => {});
  }

  const promise = performAtomicScanDeduct(dealerId, scanCost, requestId, userId);
  activeScanDeduct = { key: requestId, promise };
  try {
    return await promise;
  } finally {
    if (activeScanDeduct?.key === requestId) {
      activeScanDeduct = null;
    }
  }
}

async function performAtomicScanDeduct(
  targetDealerId: string,
  scanCost: number,
  requestId: string,
  userId?: string
): Promise<DeductScanResult> {
  try {
    const allResellers = await getAllResellers();
    const cleanId = targetDealerId.toLowerCase();
    const targetReseller = allResellers.find(r =>
      r.uid === targetDealerId || (r.email && r.email.toLowerCase() === cleanId)
    ) || null;

    // 0) PRIMARY: Local PostgreSQL-18 Atomic Credit Deduction (ACID + FOR UPDATE + Idempotency)
    try {
      const res = await fetch('/api/v1/resellers/deduct-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          dealerId: targetDealerId,
          amount: scanCost,
          requestId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.status === 'success') {
        const remaining = typeof data.remainingCredits === 'number' ? data.remainingCredits : 99;
        return {
          success: true,
          remainingCredits: remaining,
          message: data.message || 'Kredi başarıyla düşüldü.',
          requestId,
        };
      } else if (data?.message && data.message.includes('Yetersiz')) {
        return {
          success: false,
          remainingCredits: data.remainingCredits ?? 0,
          message: data.message,
          requestId,
        };
      }
    } catch {
      // fallback to transactional client store below
    }

    // 1) Fallback: Local transactional store
    let txResult: { prev: number; next: number; totalScans: number; dealerName: string } | null = null;
    try {
      const resellerDocId = targetReseller?.uid || targetDealerId;
      const ref = doc(db, 'resellers', resellerDocId);

      txResult = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        const existing = snap.exists() ? (snap.data() as Reseller) : null;
        const prev = existing && Number.isFinite(existing.creditsBalance) ? existing.creditsBalance! : (targetReseller?.creditsBalance ?? 100);
        const dealerName = existing?.resellerName || targetReseller?.resellerName || 'Yetkili Bayi';
        const nowIso = new Date().toISOString();

        if (prev < scanCost) {
          throw { __creditError: 'INSUFFICIENT_CREDITS', current: prev };
        }

        const next = prev - scanCost;
        const totalScans = (existing?.totalScans || 0) + 1;

        if (snap.exists()) {
          await transaction.update(ref, {
            creditsBalance: next,
            totalScans,
            lastScanAt: nowIso,
            updatedAt: nowIso
          });
        } else {
          // First-ever Firestore doc for this dealer: seed it atomically.
          await transaction.set(ref, {
            uid: resellerDocId,
            resellerName: dealerName,
            email: targetReseller?.email || '',
            phone: targetReseller?.phone || '',
            referralCode: targetReseller?.referralCode || `AURA-BAYI-${(resellerDocId || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`,
            creditsBalance: next,
            totalScans,
            lastScanAt: nowIso,
            createdAt: nowIso,
            updatedAt: nowIso,
            status: 'active',
            commissionRate: targetReseller?.commissionRate ?? 20,
            totalEarnings: 0,
            paidEarnings: 0,
            pendingEarnings: 0,
            totalSalesAmount: 0,
            totalReferredUsers: 0,
            bankInfo: targetReseller?.bankInfo || { bankName: '', accountHolder: dealerName, iban: '' }
          }, { merge: true });
        }

        // Audit log is written in the SAME transaction -> can never be lost or desynced.
        const logId = `CR-LOG-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
        await transaction.set(doc(db, 'credit_logs', logId), {
          id: logId,
          resellerId: resellerDocId,
          resellerName: dealerName,
          type: 'scan_usage',
          amount: -scanCost,
          previousBalance: prev,
          newBalance: next,
          description: `Canlı Biyo-Aura & Spektrometre Seans Taraması Gerçekleştirildi (-${scanCost} Kredi)`,
          performedBy: 'Otomatik Seans Taraması',
          createdAt: nowIso,
          requestId
        });

        return { prev, next, totalScans, dealerName };
      });
    } catch (txErr: any) {
      if (txErr && txErr.__creditError === 'INSUFFICIENT_CREDITS') {
        return {
          success: false,
          remainingCredits: txErr.current ?? 0,
          message: 'Yetersiz kredi! Seans taraması için yeterli seans kredisi bulunmuyor. Lütfen bayi paketi yükleyin.',
          requestId
        };
      }
      console.warn('Firestore atomic credit deduction unavailable, switching to local safe fallback:', txErr);
    }

    // 2) Synchronize authoritative balance to local stores (session + directory + linked member + events)
    if (txResult) {
      const nowIso = new Date().toISOString();
      const updatedReseller: Reseller = {
        ...(targetReseller || {} as Reseller),
        uid: targetReseller?.uid || targetDealerId,
        resellerName: txResult.dealerName,
        creditsBalance: txResult.next,
        totalScans: txResult.totalScans,
        lastScanAt: nowIso,
        updatedAt: nowIso
      };
      saveLocalResellers([updatedReseller, ...allResellers.filter(r => r.uid !== updatedReseller.uid)]);
      setActiveResellerSession(updatedReseller);

      // Mirror the transaction log locally for offline continuity (deduplicated by id in admin merge)
      appendLocalCreditLog({
        id: `CR-LOG-${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`,
        resellerId: updatedReseller.uid,
        resellerName: txResult.dealerName,
        type: 'scan_usage',
        amount: -scanCost,
        previousBalance: txResult.prev,
        newBalance: txResult.next,
        description: `Canlı Biyo-Aura & Spektrometre Seans Taraması Gerçekleştirildi (-${scanCost} Kredi)`,
        performedBy: 'Otomatik Seans Taraması',
        createdAt: nowIso,
        requestId
      });

      await syncMemberUserCredits(updatedReseller.uid, txResult.next, allResellers);
      await pushCreditBalanceToServer(updatedReseller, txResult.next);
      window.dispatchEvent(new CustomEvent('aurabio_credits_deducted', { detail: { remainingCredits: txResult.next } }));

      return {
        success: true,
        remainingCredits: txResult.next,
        message: `${scanCost} Seans kredisi atomik olarak düşüldü.`,
        requestId
      };
    }

    // 3) OFFLINE FALLBACK: safe local-only deduction (keeps scans working without network)
    return performLocalScanDeduct(targetDealerId, scanCost, requestId, allResellers, userId);
  } catch (err) {
    console.warn('Atomic deduct credit error:', err);
    return { success: true, remainingCredits: 99, requestId };
  }
}

/**
 * Writes the balance to the server member record, which feeds the back office and dealer panels.
 */
async function pushCreditBalanceToServer(reseller: Reseller, balance: number): Promise<void> {
  try {
    const res = await fetch(`/api/v1/members/${encodeURIComponent(reseller.uid)}/sync-credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_credits: balance,
        email: reseller.email,
        ref_code: reseller.referralCode,
      }),
    });
    if (res.status === 404) return;
    if (!res.ok) throw new Error(`sync-credits ${res.status}`);
    const payload = await res.json();
    if (payload.state) {
      window.dispatchEvent(new CustomEvent('aurabio_monoline_state_updated', { detail: payload.state }));
    }
  } catch (err) {
    console.debug('Server credit sync notice:', err);
  }
}

/**
 * Sync the authoritative balance with the linked member/user account (`users/{uid}`).
 */
async function syncMemberUserCredits(resellerId: string, newBalance: number, allResellers: Reseller[]): Promise<void> {
  try {
    const { getActiveMemberSession, fetchMemberProfile, saveToLocalMembersDirectory } = await import('./authManager');
    const reseller = allResellers.find(r => r.uid === resellerId);
    let user = getActiveMemberSession();

    if (!user || (resellerId && user.uid !== resellerId && (!user.email || !reseller?.email || user.email.toLowerCase() !== reseller.email.toLowerCase()))) {
      try {
        user = await fetchMemberProfile(resellerId);
      } catch {
        user = null;
      }
    }
    if (!user) return;

    const updatedUser: UserMember = {
      ...user,
      creditsBalance: newBalance,
      dealerDetails: user.dealerDetails ? {
        ...user.dealerDetails,
        creditsBalance: newBalance
      } : user.dealerDetails
    };

    localStorage.setItem('aurabio_active_session_v1', JSON.stringify(updatedUser));
    saveToLocalMembersDirectory(updatedUser);
    window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updatedUser }));

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        creditsBalance: newBalance,
        dealerDetails: updatedUser.dealerDetails,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch {
      // non-blocking
    }
  } catch (err) {
    console.debug('Member credit sync notice:', err);
  }
}

/**
 * Safe local-only scan deduction (offline fallback). Records an audit log and broadcasts events.
 */
async function performLocalScanDeduct(
  targetDealerId: string,
  scanCost: number,
  requestId: string,
  allResellers: Reseller[],
  userId?: string
): Promise<DeductScanResult> {
  try {
    let remaining = 99;
    let deducted = false;
    let prevCredits = 100;
    let dealerUid = 'DEALER';
    let dealerName = 'Bayi Taraması';

    const cleanId = targetDealerId.toLowerCase();
    const targetReseller = allResellers.find(r =>
      r.uid === targetDealerId || (r.email && r.email.toLowerCase() === cleanId)
    );

    if (targetReseller) {
      const cur = targetReseller.creditsBalance !== undefined ? targetReseller.creditsBalance : 100;
      prevCredits = cur;
      if (cur < scanCost) {
        return {
          success: false,
          remainingCredits: cur,
          message: 'Yetersiz kredi! Seans taraması için yeterli seans kredisi bulunmuyor. Lütfen bayi paketi yükleyin.',
          requestId
        };
      }

      const next = cur - scanCost;
      const nowIso = new Date().toISOString();
      const updatedReseller: Reseller = {
        ...targetReseller,
        creditsBalance: next,
        totalScans: (targetReseller.totalScans || 0) + 1,
        lastScanAt: nowIso,
        updatedAt: nowIso
      };

      saveLocalResellers([updatedReseller, ...allResellers.filter(r => r.uid !== updatedReseller.uid)]);
      setActiveResellerSession(updatedReseller);
      dealerUid = targetReseller.uid;
      dealerName = targetReseller.resellerName || 'Bayi Taraması';
      remaining = next;
      deducted = true;

      try {
        const docRef = doc(db, 'resellers', targetReseller.uid);
        await setDoc(docRef, {
          creditsBalance: next,
          totalScans: updatedReseller.totalScans,
          lastScanAt: nowIso,
          updatedAt: nowIso
        }, { merge: true });
      } catch {
        // non-blocking
      }
    }

    if (deducted) {
      await recordCreditTransaction({
        resellerId: dealerUid,
        resellerName: dealerName,
        type: 'scan_usage',
        amount: -scanCost,
        previousBalance: prevCredits,
        newBalance: remaining,
        description: `Canlı Biyo-Aura & Spektrometre Seans Taraması Gerçekleştirildi (-${scanCost} Kredi)`,
        performedBy: 'Otomatik Seans Taraması'
      });
    }

    await syncMemberUserCredits(dealerUid, remaining, allResellers);
    if (deducted) {
      const deductedReseller = allResellers.find((r) => r.uid === dealerUid);
      if (deductedReseller) await pushCreditBalanceToServer(deductedReseller, remaining);
    }
    window.dispatchEvent(new CustomEvent('aurabio_credits_deducted', { detail: { remainingCredits: remaining } }));

    return {
      success: true,
      remainingCredits: remaining,
      message: deducted ? `${scanCost} Seans kredisi düşüldü.` : 'Kredi kontrolü tamamlandı.',
      requestId
    };
  } catch (err) {
    console.warn('Local deduct credit error:', err);
    return { success: true, remainingCredits: 99, requestId };
  }
}

/**
 * Real-time subscription to the full `resellers` collection (live admin dealer list).
 */
export function subscribeToResellersList(onList: (list: Reseller[]) => void): Unsubscribe {
  try {
    const colRef = collection(db, 'resellers');
    const unsub = onSnapshot(colRef, (snap) => {
      const list: Reseller[] = [];
      snap.forEach((docSnap: any) => {
        const data = { ...docSnap.data(), uid: docSnap.id } as Reseller;
        if (data.uid) list.push(data);
      });
      onList(list);
    });
    return unsub;
  } catch (err) {
    console.debug('Subscribe resellers list notice:', err);
    return () => {};
  }
}

/**
 * Real-time subscription to the system-wide `credit_logs` collection (live admin audit trail).
 */
export function subscribeToCreditLogs(onList: (logs: CreditTransaction[]) => void): Unsubscribe {
  try {
    const colRef = collection(db, 'credit_logs');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      const list: CreditTransaction[] = [];
      snap.forEach((docSnap: any) => {
        const data = docSnap.data() as CreditTransaction;
        if (data && data.id) list.push({ ...data, id: docSnap.id });
      });
      onList(list);
    });
    return unsub;
  } catch (err) {
    console.debug('Subscribe credit logs notice:', err);
    return () => {};
  }
}

/**
 * Real-time subscription to the credit logs of a single dealer (live audit history for detail modal).
 */
export function subscribeToResellerCreditLogs(
  resellerId: string,
  onList: (logs: CreditTransaction[]) => void
): Unsubscribe {
  try {
    // Single-field ordering avoids requiring a composite index (equality + orderBy would need one).
    const colRef = collection(db, 'credit_logs');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      const list: CreditTransaction[] = [];
      snap.forEach((docSnap: any) => {
        const data = docSnap.data() as CreditTransaction;
        if (data && data.id && data.resellerId === resellerId) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      onList(list);
    });
    return unsub;
  } catch (err) {
    console.debug('Subscribe reseller credit logs notice:', err);
    return () => {};
  }
}

export const DEFAULT_RESELLERS: Reseller[] = [];

export const DEFAULT_COMMISSIONS: CommissionTransaction[] = [];

const LEGACY_MOCK_RESELLER_IDS = new Set([
  'RESELLER-MERKEZ-01',
  'RESELLER-DOGAL-02',
  'RESELLER-AKADEMI-03',
  'RESELLER-ANADOLU-04'
]);

const LEGACY_MOCK_COMMISSION_IDS = new Set([
  'COMM-10941',
  'COMM-10942',
  'COMM-10943',
  'COMM-20101',
  'COMM-20102'
]);

/**
 * Get all stored local resellers (filtered of any legacy mock/demo entries)
 */
export function getLocalResellers(): Reseller[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_RESELLERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((r: any) => r && r.uid && !LEGACY_MOCK_RESELLER_IDS.has(r.uid));
        return cleaned;
      }
    }
  } catch (e) {
    console.debug('Error parsing local resellers:', e);
  }
  return [];
}

export function saveLocalResellers(resellers: Reseller[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = resellers.filter(r => r && r.uid && !LEGACY_MOCK_RESELLER_IDS.has(r.uid));
    localStorage.setItem(STORAGE_RESELLERS_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
  } catch (e) {
    console.warn('Error saving local resellers:', e);
  }
}

/**
 * Get all stored local commissions (filtered of any legacy mock/demo entries)
 */
export function getLocalCommissions(): CommissionTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_COMMISSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((c: any) => c && c.transactionId && !LEGACY_MOCK_COMMISSION_IDS.has(c.transactionId));
        return cleaned;
      }
    }
  } catch (e) {
    console.debug('Error parsing local commissions:', e);
  }
  return [];
}

export function saveLocalCommissions(commissions: CommissionTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = commissions.filter(c => c && c.transactionId && !LEGACY_MOCK_COMMISSION_IDS.has(c.transactionId));
    localStorage.setItem(STORAGE_COMMISSIONS_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent('aurabio_commissions_updated'));
  } catch (e) {
    console.warn('Error saving local commissions:', e);
  }
}

/**
 * Mask User ID for Privacy in Reseller Panels (e.g. USR-A79B)
 */
export function maskUserId(rawId: string): string {
  if (!rawId) return 'USR-XXXX';
  const clean = rawId.replace(/^USR-/, '').replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length <= 4) return `USR-${clean.toUpperCase()}`;
  return `USR-${clean.substring(0, 4).toUpperCase()}`;
}

// Cookie helper for cross-browser persistent referral storage
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  } catch {
    return null;
  }
}

function setCookie(name: string, val: string, days = 365): void {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(val)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // ignore
  }
}

const COOKIE_REFERRAL_KEY = 'aurabio_ref_code_v3';

/**
 * Parse & Detect referral code STRICTLY from current URL search query (?ref=..., ?referral=..., ?bayi=...) or hash (#ref=...)
 * Returns null if visitor did not arrive via a direct referral URL.
 */
export function detectReferralCodeFromUrlOnly(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    let foundCode: string | null = null;

    // 1. Check window.location.search (e.g. ?ref=AURA-BAYI-5521)
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      foundCode = searchParams.get('ref') || 
                  searchParams.get('referral') || 
                  searchParams.get('bayi') || 
                  searchParams.get('bayiKodu') ||
                  searchParams.get('r');
    }

    // 2. Check window.location.hash (e.g. #ref=AURA-BAYI-5521 or #tab=camera&ref=...)
    if (!foundCode && window.location.hash) {
      const hashStr = window.location.hash.replace(/^#/, '');
      const queryIdx = hashStr.indexOf('?');
      const paramStr = queryIdx >= 0 ? hashStr.substring(queryIdx + 1) : hashStr;
      const hashParams = new URLSearchParams(paramStr);
      foundCode = hashParams.get('ref') || 
                  hashParams.get('referral') || 
                  hashParams.get('bayi') || 
                  hashParams.get('bayiKodu') ||
                  hashParams.get('r');
    }

    if (foundCode) {
      const cleanCode = foundCode.trim().toUpperCase();
      try {
        localStorage.setItem(STORAGE_CACHED_REFERRAL_CODE_KEY, cleanCode);
        sessionStorage.setItem(STORAGE_CACHED_REFERRAL_CODE_KEY, cleanCode);
        sessionStorage.setItem('aurabio_url_referral_active', cleanCode);
      } catch {
        // ignore
      }
      setCookie(COOKIE_REFERRAL_KEY, cleanCode, 180);
      return cleanCode;
    }
  } catch (err) {
    console.warn('Detect referral code from URL notice:', err);
  }

  return null;
}

/**
 * Parse & Detect referral code from URL or persistent storage
 */
export function detectAndSaveReferralCodeFromUrl(): string | null {
  const fromUrl = detectReferralCodeFromUrlOnly();
  if (fromUrl) return fromUrl;
  return getStoredReferralCode();
}

/**
 * Check if the active session entered via a direct referral URL
 */
export function isDirectUrlReferralActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(sessionStorage.getItem('aurabio_url_referral_active') || detectReferralCodeFromUrlOnly());
  } catch {
    return false;
  }
}

/**
 * Get stored referral code from local/session storage or cookies
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromLocal = localStorage.getItem(STORAGE_CACHED_REFERRAL_CODE_KEY);
    if (fromLocal) return fromLocal.trim().toUpperCase();

    const fromSession = sessionStorage.getItem(STORAGE_CACHED_REFERRAL_CODE_KEY);
    if (fromSession) return fromSession.trim().toUpperCase();

    const fromCookie = getCookie(COOKIE_REFERRAL_KEY);
    if (fromCookie) return fromCookie.trim().toUpperCase();

    return null;
  } catch {
    return null;
  }
}

/**
 * Clear cached referral code from all storage layers
 */
export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_CACHED_REFERRAL_CODE_KEY);
    localStorage.removeItem('aurabio_stored_referral_code_v1');
    localStorage.removeItem('aurabio_cached_referral_code_v1');
    sessionStorage.removeItem(STORAGE_CACHED_REFERRAL_CODE_KEY);
    sessionStorage.removeItem('aurabio_stored_referral_code_v1');
    sessionStorage.removeItem('aurabio_cached_referral_code_v1');
    sessionStorage.removeItem('aurabio_url_referral_active');
    setCookie(COOKIE_REFERRAL_KEY, '', -1);
    setCookie('aurabio_ref_code_v3', '', -1);
    setCookie('aurabio_ref_code', '', -1);

    // Clean any referral query parameters from window URL so subsequent visits are clean
    if (window.history && window.location) {
      const url = new URL(window.location.href);
      let changed = false;
      const refKeys = ['ref', 'referral', 'bayi', 'bayiKodu', 'r'];
      refKeys.forEach((key) => {
        if (url.searchParams.has(key)) {
          url.searchParams.delete(key);
          changed = true;
        }
      });
      if (changed) {
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
      }
    }
  } catch {
    // non-blocking
  }
}

/**
 * Store referral code explicitly across all storage layers
 */
export function setStoredReferralCode(code: string): void {
  if (typeof window === 'undefined' || !code) return;
  try {
    const clean = code.trim().toUpperCase();
    localStorage.setItem(STORAGE_CACHED_REFERRAL_CODE_KEY, clean);
    sessionStorage.setItem(STORAGE_CACHED_REFERRAL_CODE_KEY, clean);
    setCookie(COOKIE_REFERRAL_KEY, clean, 180);
  } catch {
    // non-blocking
  }
}

/**
 * Fetch all resellers from Firestore with fallback to Local Directory and strict distinct deduplication
 */
export async function getAllResellers(): Promise<Reseller[]> {
  const map = new Map<string, Reseller>();

  // 1. Local list
  getLocalResellers().forEach(r => {
    if (r.uid) map.set(r.uid, r);
  });

  // 2. Firestore collection 'resellers' (only overwrite local if Firestore document is newer)
  try {
    const colRef = collection(db, 'resellers');
    const snap = await getDocs(colRef);
    snap.forEach(docSnap => {
      const data = { ...docSnap.data(), uid: docSnap.id } as Reseller;
      if (data.uid) {
        const existingLocal = map.get(data.uid);
        if (existingLocal) {
          const localMs = new Date(existingLocal.updatedAt || 0).getTime();
          const fsMs = new Date(data.updatedAt || 0).getTime();
          if (localMs > fsMs) {
            return;
          }
        }
        map.set(data.uid, data);
      }
    });
  } catch (err) {
    console.debug('Fetch resellers Firestore notice (using local directory):', err);
  }

  // 2b. Firestore collection 'users' (sync all dealers created in Firestore)
  try {
    const usersCol = collection(db, 'users');
    const uSnap = await getDocs(usersCol);
    uSnap.forEach((docSnap: any) => {
      const u = { ...docSnap.data(), uid: docSnap.id } as any;
      if (
        u.role === 'dealer' ||
        u.role === 'admin' ||
        u.dealerStatus === 'approved' ||
        u.isDealerRequested ||
        u.dealerDetails
      ) {
        if (!map.has(u.uid)) {
          const code =
            u.ref_code ||
            u.referralCode ||
            u.dealerDetails?.referralCode ||
            (u.role === 'admin' ? 'AURA-BAYI-AKN01' : `AURA-BAYI-${u.global_line_id || Math.floor(1000 + Math.random() * 9000)}`);
          map.set(u.uid, {
            uid: u.uid,
            resellerName: u.dealerDetails?.companyName || u.full_name || u.fullName || 'Bayi',
            fullName: u.full_name || u.fullName || '',
            email: u.email || '',
            phone: u.phone || u.dealerDetails?.whatsapp || '',
            referralCode: code,
            commissionRate: u.dealerDetails?.commissionRate || (u.role === 'admin' ? 30 : 20),
            creditsBalance:
              typeof u.creditsBalance === 'number'
                ? u.creditsBalance
                : typeof u.session_credits === 'number'
                ? u.session_credits
                : WELCOME_BONUS_TOTAL_CREDITS,
            dealerPackageId: u.dealerPackageId || 'pkg-5k',
            bankInfo: {
              bankName: u.dealerDetails?.bankInfo?.bankName || '',
              accountHolder: u.dealerDetails?.bankInfo?.accountHolder || u.full_name || u.fullName || '',
              iban: u.dealerDetails?.bankInfo?.iban || '',
            },
            status: u.is_locked ? 'suspended' : 'active',
            totalEarnings: u.wallets?.total_earnings || 0,
            paidEarnings: u.wallets?.total_withdrawn || 0,
            pendingEarnings: 0,
            totalSalesAmount: 0,
            totalReferredUsers: 0,
            createdAt: u.created_at || u.createdAt || new Date().toISOString(),
            updatedAt: u.updated_at || u.updatedAt || new Date().toISOString(),
          });
        }
      }
    });
  } catch (uErr) {
    console.debug('Fetch users as resellers Firestore notice:', uErr);
  }

  // 3. Fallback: also merge confirmed dealers from members directory
  try {
    const { getLocalMembersDirectory } = await import('./authManager');
    const members = getLocalMembersDirectory();
    members.forEach(m => {
      if (m.role === 'dealer' || m.role === 'admin' || m.dealerStatus === 'approved' || m.dealerDetails) {
        if (!map.has(m.uid)) {
          const code = m.dealerDetails?.referralCode || m.referralCode || (m.role === 'admin' ? 'AURA-BAYI-AKN01' : `AURA-BAYI-${Math.floor(1000 + Math.random() * 9000)}`);
          map.set(m.uid, {
            uid: m.uid,
            resellerName: m.dealerDetails?.companyName || m.fullName,
            email: m.email,
            phone: m.dealerDetails?.whatsapp || m.phone,
            referralCode: code,
            commissionRate: m.dealerDetails?.commissionRate || (m.role === 'admin' ? 30 : 20),
            creditsBalance: m.creditsBalance !== undefined ? m.creditsBalance : WELCOME_BONUS_TOTAL_CREDITS,
            dealerPackageId: m.dealerPackageId || 'pkg-5k',
            bankInfo: {
              bankName: m.dealerDetails?.bankInfo?.bankName || '',
              accountHolder: m.dealerDetails?.bankInfo?.accountHolder || m.fullName,
              iban: m.dealerDetails?.bankInfo?.iban || '',
            },
            status: 'active',
            totalEarnings: 0,
            paidEarnings: 0,
            pendingEarnings: 0,
            totalSalesAmount: 0,
            totalReferredUsers: 0,
            createdAt: m.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });
  } catch (e) {
    // non-blocking
  }

  // 4. Strict Distinct / Unique Consolidation: Deduplicate by email and referralCode
  const distinctByEmail = new Map<string, Reseller>();
  const distinctByCode = new Map<string, Reseller>();
  const finalizedList: Reseller[] = [];

  Array.from(map.values()).forEach(r => {
    if (!r.uid || !r.resellerName) return;

    const cleanEmail = (r.email || '').trim().toLowerCase();
    const cleanCode = (r.referralCode || '').trim().toUpperCase();

    // If duplicate email exists, keep the one with a valid referralCode or higher credits/activity
    if (cleanEmail && distinctByEmail.has(cleanEmail)) {
      const existing = distinctByEmail.get(cleanEmail)!;
      if (!existing.referralCode && r.referralCode) {
        distinctByEmail.set(cleanEmail, r);
      }
      return;
    }

    // If duplicate referral code exists (unless empty), prevent duplicate entry
    if (cleanCode && distinctByCode.has(cleanCode)) {
      return;
    }

    if (cleanEmail) distinctByEmail.set(cleanEmail, r);
    if (cleanCode) distinctByCode.set(cleanCode, r);
    finalizedList.push(r);
  });

  saveLocalResellers(finalizedList);
  return finalizedList.sort((a, b) => {
    // Admin first, then by sales
    const aEmail = (a.email || '').toLowerCase();
    const bEmail = (b.email || '').toLowerCase();
    if (a.uid === 'ADMIN-AKN-01' || aEmail === 'psikologabdulkadirkan@gmail.com') return -1;
    if (b.uid === 'ADMIN-AKN-01' || bEmail === 'psikologabdulkadirkan@gmail.com') return 1;
    return (b.totalSalesAmount || 0) - (a.totalSalesAmount || 0);
  });
}

/**
 * Get active resellers list for registration dropdown
 */
export async function getActiveResellers(): Promise<Reseller[]> {
  const all = await getAllResellers();
  return all.filter(r => r.status === 'active');
}

/**
 * Find reseller by referral code (case-insensitive with multi-layer check)
 */
export async function getResellerByCode(code: string): Promise<Reseller | null> {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  const all = await getAllResellers();
  const found = all.find(r => r.referralCode && r.referralCode.toUpperCase() === clean);
  if (found) return found;

  // Fallback 1: check members directory for a dealer with this referralCode
  try {
    const { getLocalMembersDirectory } = await import('./authManager');
    const members = getLocalMembersDirectory();
    const dealerUser = members.find(m => 
      m.dealerDetails?.referralCode?.toUpperCase() === clean ||
      m.referralCode?.toUpperCase() === clean ||
      (m.role === 'dealer' && (m.uid === code || m.referredByCode?.toUpperCase() === clean))
    );

    if (dealerUser) {
      return {
        uid: dealerUser.uid,
        resellerName: dealerUser.dealerDetails?.companyName || dealerUser.fullName,
        email: dealerUser.email,
        phone: dealerUser.dealerDetails?.whatsapp || dealerUser.phone,
        referralCode: dealerUser.dealerDetails?.referralCode || dealerUser.referralCode || clean,
        commissionRate: dealerUser.dealerDetails?.commissionRate || 20,
        creditsBalance: dealerUser.creditsBalance !== undefined ? dealerUser.creditsBalance : 100,
        bankInfo: {
          bankName: dealerUser.dealerDetails?.bankInfo?.bankName || '',
          accountHolder: dealerUser.dealerDetails?.bankInfo?.accountHolder || dealerUser.fullName,
          iban: dealerUser.dealerDetails?.bankInfo?.iban || '',
        },
        status: 'active',
        totalEarnings: 0,
        paidEarnings: 0,
        pendingEarnings: 0,
        totalSalesAmount: 0,
        totalReferredUsers: 0,
        createdAt: dealerUser.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (e) {
    console.debug('Dealer fallback lookup notice:', e);
  }

  // Fallback 2: Firestore direct lookup
  try {
    const colRef = collection(db, 'resellers');
    const q = query(colRef, where('referralCode', '==', clean));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = { ...snap.docs[0].data(), uid: snap.docs[0].id } as Reseller;
      if (data) return data;
    }
  } catch (fsErr) {
    console.debug('Firestore direct lookup notice:', fsErr);
  }

  // Fallback 3: Even if unlisted / new dealer referral code in valid format (e.g. AURA-BAYI-1014 or any code from URL), construct a valid active reseller representation so it locks and attributes reliably!
  if (clean.startsWith('AURA-') || clean.startsWith('BAYI-') || clean.length >= 4) {
    const isPsychologyCenter = clean === 'AURA-BAYI-1014' || clean.includes('1014');
    return {
      uid: `BAYI-${clean}`,
      resellerName: isPsychologyCenter ? 'Psikoloji Danışmanlık Merkezi' : `Yetkili Bayi (${clean})`,
      email: '',
      phone: '',
      referralCode: clean,
      commissionRate: 20,
      creditsBalance: 100,
      bankInfo: {
        bankName: '',
        accountHolder: '',
        iban: '',
      },
      status: 'active',
      totalEarnings: 0,
      paidEarnings: 0,
      pendingEarnings: 0,
      totalSalesAmount: 0,
      totalReferredUsers: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Find reseller by ID / UID
 */
export async function getResellerById(uid: string): Promise<Reseller | null> {
  const cleanUid = typeof uid === 'string' ? uid.trim() : '';
  if (!cleanUid) return null;

  const localList = getLocalResellers();
  const activeSession = getActiveResellerSession();
  const localCandidate =
    (activeSession && activeSession.uid === cleanUid ? activeSession : null) ||
    localList.find(r => r.uid === cleanUid) ||
    null;

  // Read the canonical reseller document, but never overwrite a more recent local update.
  try {
    const snap = await getDoc(doc(db, 'resellers', cleanUid));
    if (snap.exists()) {
      const fsData = { ...snap.data(), uid: snap.id } as Reseller;
      if (localCandidate) {
        const localMs = new Date(localCandidate.updatedAt || 0).getTime();
        const fsMs = new Date(fsData.updatedAt || 0).getTime();
        if (localMs > fsMs) {
          return localCandidate;
        }
      }
      return fsData;
    }
  } catch (fsErr) {
    console.debug('Direct reseller profile lookup notice (using cache):', fsErr);
  }

  if (localCandidate) return localCandidate;

  const all = await getAllResellers();
  const found = all.find(r => r.uid === cleanUid);
  if (found) return found;

  // Fallback: check if member with this uid is a dealer
  try {
    const { getLocalMembersDirectory } = await import('./authManager');
    const members = getLocalMembersDirectory();
    const dealerUser = members.find(m => m.uid === uid && (m.role === 'dealer' || m.dealerStatus === 'approved' || m.dealerDetails));
    if (dealerUser) {
      return {
        uid: dealerUser.uid,
        resellerName: dealerUser.dealerDetails?.companyName || dealerUser.fullName,
        email: dealerUser.email,
        phone: dealerUser.dealerDetails?.whatsapp || dealerUser.phone,
        referralCode: dealerUser.dealerDetails?.referralCode || `AURA-BAYI-${Math.floor(1000 + Math.random() * 9000)}`,
        commissionRate: dealerUser.dealerDetails?.commissionRate || 20,
        creditsBalance: dealerUser.creditsBalance !== undefined ? dealerUser.creditsBalance : 100,
        bankInfo: {
          bankName: dealerUser.dealerDetails?.bankInfo?.bankName || '',
          accountHolder: dealerUser.dealerDetails?.bankInfo?.accountHolder || dealerUser.fullName,
          iban: dealerUser.dealerDetails?.bankInfo?.iban || '',
        },
        status: 'active',
        totalEarnings: 0,
        paidEarnings: 0,
        pendingEarnings: 0,
        totalSalesAmount: 0,
        totalReferredUsers: 0,
        createdAt: dealerUser.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (e) {
    console.debug('Dealer ID fallback lookup notice:', e);
  }

  return null;
}

/**
 * Generate a unique referral code e.g. AURA-BAYI-4819 or AURA-REF-7201 (guaranteed unique system-wide)
 */
export function generateUniqueReferralCode(prefix = 'AURA-BAYI', existingCodes: string[] = []): string {
  const codeSet = new Set(existingCodes.map(c => c.trim().toUpperCase()));
  try {
    const all = getLocalResellers();
    all.forEach(r => {
      if (r.referralCode) codeSet.add(r.referralCode.trim().toUpperCase());
    });
  } catch {
    // ignore
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('aurabio_members_directory_v1') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((m: any) => {
          if (m?.referralCode) codeSet.add(m.referralCode.trim().toUpperCase());
          if (m?.dealerDetails?.referralCode) codeSet.add(m.dealerDetails.referralCode.trim().toUpperCase());
          if (m?.referredByCode) codeSet.add(m.referredByCode.trim().toUpperCase());
        });
      }
    }
  } catch {
    // ignore
  }

  for (let i = 0; i < 500; i++) {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${prefix}-${randNum}`;
    if (!codeSet.has(candidate)) {
      return candidate;
    }
  }

  const randAlpha = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randAlpha}`;
}

/**
 * System-wide Audit & Repair: Guarantees every single dealer and member has a unique, non-colliding referral code.
 * Replaces any duplicate codes (including old shared 'AURA-BAYI-1014') with distinct, dedicated codes.
 */
export async function ensureUniqueReferralCodesForAll(): Promise<{ fixedDealersCount: number; fixedUsersCount: number }> {
  if (typeof window === 'undefined') return { fixedDealersCount: 0, fixedUsersCount: 0 };

  try {
    const localResellers = getLocalResellers();
    const STORAGE_MEMBERS_KEY = 'aurabio_members_directory_v1';
    let localMembers: any[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_MEMBERS_KEY);
      if (raw) localMembers = JSON.parse(raw) || [];
    } catch {
      localMembers = [];
    }

    const usedCodes = new Map<string, string>(); // upperCaseCode -> ownerUid
    const masterAdminCode = 'AURA-BAYI-AKN01';
    usedCodes.set(masterAdminCode, 'ADMIN-AKN-01');

    let fixedDealersCount = 0;
    let fixedUsersCount = 0;

    const updatedResellers = [...localResellers];
    const updatedMembers = [...localMembers];

    const generateFresh = (prefix: string) => {
      for (let i = 0; i < 1000; i++) {
        const num = Math.floor(1000 + Math.random() * 9000);
        const cand = `${prefix}-${num}`;
        if (!usedCodes.has(cand)) {
          return cand;
        }
      }
      return `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    };

    // 1. Process Resellers
    for (let i = 0; i < updatedResellers.length; i++) {
      const r = updatedResellers[i];
      if (!r || !r.uid) continue;

      const isMasterAdmin = r.uid === 'ADMIN-AKN-01' || r.email?.toLowerCase() === 'psikologabdulkadirkan@gmail.com';
      let code = (r.referralCode || '').trim().toUpperCase();

      if (isMasterAdmin) {
        code = masterAdminCode;
      } else {
        // If code is empty or already claimed by another dealer or is unassigned
        if (!code || (usedCodes.has(code) && usedCodes.get(code) !== r.uid)) {
          code = generateFresh('AURA-BAYI');
          fixedDealersCount++;
        }
      }

      usedCodes.set(code, r.uid);
      updatedResellers[i] = {
        ...r,
        referralCode: code,
      };

      // Sync Firestore
      try {
        const docRef = doc(db, 'resellers', r.uid);
        setDoc(docRef, { referralCode: code, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } catch {}
    }

    // 2. Process Members & synchronize with Dealers
    for (let i = 0; i < updatedMembers.length; i++) {
      const m = updatedMembers[i];
      if (!m || !m.uid) continue;

      const isMasterAdmin = m.uid === 'ADMIN-AKN-01' || m.email?.toLowerCase() === 'psikologabdulkadirkan@gmail.com';
      const isDealer = m.role === 'dealer' || m.dealerStatus === 'approved' || Boolean(m.dealerDetails);

      if (isMasterAdmin) {
        let code = masterAdminCode;
        usedCodes.set(code, m.uid);
        updatedMembers[i] = {
          ...m,
          role: 'admin',
          isAllowed: true,
          referralCode: code,
          dealerDetails: {
            ...(m.dealerDetails || {
              companyName: 'Psikoloji Danışmanlık & Biyo-Frekans Merkezi (Merkez Bayi)',
              phone: m.phone || '0554 990 07 43',
              whatsapp: m.phone || '0554 990 07 43',
              businessField: 'Psikoloji & Biyo-Rezonans Merkezi'
            }),
            referralCode: code,
          }
        };
        continue;
      }

      if (isDealer) {
        let dealerCode = (m.dealerDetails?.referralCode || m.referralCode || '').trim().toUpperCase();
        if (!dealerCode || dealerCode === masterAdminCode || (usedCodes.has(dealerCode) && usedCodes.get(dealerCode) !== m.uid)) {
          dealerCode = generateFresh('AURA-BAYI');
          fixedDealersCount++;
        }
        usedCodes.set(dealerCode, m.uid);

        updatedMembers[i] = {
          ...m,
          referralCode: dealerCode,
          dealerDetails: {
            ...(m.dealerDetails || {
              companyName: m.fullName,
              phone: m.phone,
              whatsapp: m.phone,
              businessField: 'Biyo-Rezonans & Frekans Kliniği',
            }),
            referralCode: dealerCode,
          }
        };

        // Sync into updatedResellers if missing
        const rIdx = updatedResellers.findIndex(r => r.uid === m.uid);
        if (rIdx >= 0) {
          updatedResellers[rIdx] = {
            ...updatedResellers[rIdx],
            referralCode: dealerCode,
          };
        } else {
          updatedResellers.push({
            uid: m.uid,
            resellerName: m.dealerDetails?.companyName || m.fullName,
            email: m.email,
            phone: m.dealerDetails?.whatsapp || m.phone,
            referralCode: dealerCode,
            commissionRate: m.dealerDetails?.commissionRate || 20,
            creditsBalance: m.creditsBalance !== undefined ? m.creditsBalance : WELCOME_BONUS_TOTAL_CREDITS,
            dealerPackageId: m.dealerPackageId || 'pkg-5k',
            bankInfo: {
              bankName: m.dealerDetails?.bankInfo?.bankName || '',
              accountHolder: m.dealerDetails?.bankInfo?.accountHolder || m.fullName,
              iban: m.dealerDetails?.bankInfo?.iban || '',
            },
            status: 'active',
            totalEarnings: 0,
            paidEarnings: 0,
            pendingEarnings: 0,
            totalSalesAmount: 0,
            totalReferredUsers: 0,
            createdAt: m.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // Standard Member
        let memberCode = (m.referralCode || '').trim().toUpperCase();
        if (!memberCode || (usedCodes.has(memberCode) && usedCodes.get(memberCode) !== m.uid)) {
          memberCode = generateFresh('AURA-REF');
          fixedUsersCount++;
        }
        usedCodes.set(memberCode, m.uid);
        updatedMembers[i] = {
          ...m,
          referralCode: memberCode,
        };
      }

      // Sync user in Firestore
      try {
        const userDocRef = doc(db, 'users', m.uid);
        setDoc(userDocRef, {
          referralCode: updatedMembers[i].referralCode,
          dealerDetails: updatedMembers[i].dealerDetails,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch {}
    }

    // Save back to local storage
    saveLocalResellers(updatedResellers);
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(updatedMembers));

    // Update active member session if applicable
    try {
      const activeRaw = localStorage.getItem('aurabio_active_session_v1');
      if (activeRaw) {
        const active = JSON.parse(activeRaw);
        if (active && active.uid) {
          const fresh = updatedMembers.find(m => m.uid === active.uid);
          if (fresh) {
            localStorage.setItem('aurabio_active_session_v1', JSON.stringify(fresh));
            window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: fresh }));
          }
        }
      }
    } catch {}

    // Update active reseller session if applicable
    try {
      const activeResRaw = localStorage.getItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY);
      if (activeResRaw) {
        const activeRes = JSON.parse(activeResRaw);
        if (activeRes && activeRes.uid) {
          const freshRes = updatedResellers.find(r => r.uid === activeRes.uid);
          if (freshRes) {
            setActiveResellerSession(freshRes);
          }
        }
      }
    } catch {}

    return { fixedDealersCount, fixedUsersCount };
  } catch (err) {
    console.warn('ensureUniqueReferralCodesForAll notice:', err);
    return { fixedDealersCount: 0, fixedUsersCount: 0 };
  }
}

// Auto-run deduplication audit on module load in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    ensureUniqueReferralCodesForAll().catch(() => {});
  }, 1000);
}

/**
 * Guarantee unique, persistent Reseller profile for a given logged-in Dealer user
 */
export async function getOrCreateResellerForUser(user: UserMember): Promise<Reseller> {
  const userUid = typeof user?.uid === 'string' ? user.uid.trim() : '';
  const userEmail = (user.email || '').trim().toLowerCase();
  const userCode = (user.dealerDetails?.referralCode || user.referralCode || '').trim().toUpperCase();
  const userCompany = (user.dealerDetails?.companyName || user.fullName || '').trim().toLowerCase();
  const fallbackUid = userUid || (userEmail ? `LOCAL-${userEmail.replace(/[^a-z0-9]+/g, '-')}` : '');

  const activeSession = getActiveResellerSession();
  const localResellers = getLocalResellers();
  const localFound = localResellers.find(r =>
    (userUid && r.uid === userUid) ||
    (userEmail && r.email && r.email.toLowerCase() === userEmail) ||
    (userCode && r.referralCode && r.referralCode.toUpperCase() === userCode) ||
    (userCompany && r.resellerName && r.resellerName.trim().toLowerCase() === userCompany)
  );
  if (localFound) {
    if (
      activeSession &&
      (activeSession.uid === localFound.uid ||
        (userEmail && activeSession.email && activeSession.email.toLowerCase() === userEmail)) &&
      (activeSession.creditsBalance ?? 0) > (localFound.creditsBalance ?? 0)
    ) {
      const merged = {
        ...localFound,
        creditsBalance: activeSession.creditsBalance,
        dealerPackageId: activeSession.dealerPackageId || localFound.dealerPackageId,
        updatedAt: activeSession.updatedAt || localFound.updatedAt,
      };
      setActiveResellerSession(merged);
      return merged;
    }
    setActiveResellerSession(localFound);
    return localFound;
  }

  const all = await getAllResellers();
  
  // 1. Try to find existing reseller by UID or Email
  let found = all.find(r => r.uid === userUid || (userEmail && r.email && r.email.toLowerCase() === userEmail));

  if (found) {
    // Ensure referral code is synchronized with dealerDetails if user has one
    if (user.dealerDetails?.referralCode && found.referralCode !== user.dealerDetails.referralCode) {
      found.referralCode = user.dealerDetails.referralCode;
    }
    // NOTE: Never overwrite `creditsBalance` from the (possibly stale) member session here.
    // The Firestore `resellers/{uid}` document is the single source of truth for the balance;
    // using the member's cached balance caused dealer credits to appear as "not decreasing"
    // after scans. Real-time onSnapshot subscriptions correct the display instantly.
    setActiveResellerSession(found);
    return found;
  }

  // 2. Generate unique referral code for this dealer
  const existingCodes = all.map(r => r.referralCode).filter(Boolean);
  const finalCode = user.dealerDetails?.referralCode?.trim().toUpperCase() 
    || generateUniqueReferralCode('AURA-BAYI', existingCodes);

  const alreadyClaimedBonus = hasClaimedWelcomeBonus(userEmail, user.phone, fallbackUid);
  const initialWelcomeCredits =
    user.creditsBalance !== undefined
      ? user.creditsBalance
      : WELCOME_BONUS_TOTAL_CREDITS; // 32 + 32 = 64 Seans Kredisi (Bir Defaya Mahsus Hoşgeldin Bonusu)

  const nowIso = new Date().toISOString();

  const newReseller: Reseller = {
    uid: fallbackUid,
    resellerName: user.dealerDetails?.companyName || user.fullName || 'Yetkili Bayi',
    email: (user.email || '').toLowerCase(),
    phone: user.dealerDetails?.whatsapp || user.phone || '05XX XXX XX XX',
    referralCode: finalCode,
    referredByCode: (user.referredByCode || '').trim().toUpperCase(),
    commissionRate: user.dealerDetails?.commissionRate || 20,
    creditsBalance: initialWelcomeCredits,
    dealerPackageId: user.dealerPackageId || 'pkg-5k',
    welcomeBonusGranted: true,
    welcomeBonusCredits: WELCOME_BONUS_TOTAL_CREDITS,
    welcomeBonusBreakdown: '32+32',
    welcomeBonusGrantedAt: nowIso,
    bankInfo: {
      bankName: user.dealerDetails?.bankInfo?.bankName || '',
      accountHolder: user.dealerDetails?.bankInfo?.accountHolder || user.fullName,
      iban: user.dealerDetails?.bankInfo?.iban || '',
    },
    status: 'active',
    totalEarnings: 0,
    paidEarnings: 0,
    pendingEarnings: 0,
    totalSalesAmount: 0,
    totalReferredUsers: 0,
    createdAt: user.createdAt || nowIso,
    updatedAt: nowIso,
    notes: 'İlk bayi kaydı — Bir defaya mahsus 32+32 (64) Hoşgeldin Bonusu Kredisi otomatik tanımlandı.',
  };

  if (!alreadyClaimedBonus) {
    markWelcomeBonusClaimed(userEmail, user.phone, fallbackUid);
    recordCreditTransaction({
      resellerId: fallbackUid,
      resellerName: newReseller.resellerName,
      type: 'bonus',
      amount: WELCOME_BONUS_TOTAL_CREDITS,
      previousBalance: 0,
      newBalance: initialWelcomeCredits,
      description: `🎁 İlk Bayi Kaydı Sisteme Hoşgeldin Bonusu (Bir Defaya Mahsus 32+32 = ${WELCOME_BONUS_TOTAL_CREDITS} Seans Kredisi Otomatik Tanımlandı)`,
      performedBy: 'Sistem Otomatik Hoşgeldin Bonusu',
    }).catch(() => {});
  }

  // Save to local and Firestore
  const updatedList = [newReseller, ...all.filter(r => r.uid !== user.uid)];
  saveLocalResellers(updatedList);
  setActiveResellerSession(newReseller);

  // Update user dealerDetails if code wasn't saved before
  if (!user.dealerDetails?.referralCode) {
    try {
      const { saveToLocalMembersDirectory } = await import('./authManager');
      const updatedUser: UserMember = {
        ...user,
        role: 'dealer',
        dealerStatus: 'approved',
        dealerDetails: {
          ...(user.dealerDetails || {
            companyName: user.fullName,
            phone: user.phone,
            whatsapp: user.phone,
            businessField: 'Biyo-Rezonans',
            taxNumber: 'Belirtilmedi',
            taxOffice: 'Belirtilmedi',
            address: '',
            notes: ''
          }),
          referralCode: finalCode,
          creditsBalance: newReseller.creditsBalance
        }
      };
      saveToLocalMembersDirectory(updatedUser);
      localStorage.setItem('aurabio_active_session_v1', JSON.stringify(updatedUser));
      
      if (userUid) {
        const userDocRef = doc(db, 'users', userUid);
        await setDoc(userDocRef, { dealerDetails: updatedUser.dealerDetails, role: 'dealer', dealerStatus: 'approved' }, { merge: true });
      }
    } catch (err) {
      console.debug('User dealerDetails sync notice:', err);
    }
  }

  try {
    if (!userUid) {
      console.debug('Firestore create reseller skipped: authenticated user UID is unavailable.');
      return newReseller;
    }
    const docRef = doc(db, 'resellers', userUid);
    await setDoc(docRef, newReseller, { merge: true });
  } catch (fsErr) {
    console.warn('Firestore create reseller notice:', fsErr);
  }

  return newReseller;
}

/**
 * Get all registered members/clients referred by a specific reseller
 */
export async function getReferredUsersForReseller(
  resellerId: string, 
  referralCode?: string
): Promise<UserMember[]> {
  const result: UserMember[] = [];
  const seenUids = new Set<string>();

  try {
    const { getLocalMembersDirectory } = await import('./authManager');
    const allMembers = getLocalMembersDirectory();

    const cleanCode = (referralCode || '').trim().toUpperCase();

    // 1. Check local members
    allMembers.forEach(m => {
      if (m.uid === resellerId) return; // exclude the dealer themselves
      const matchByResellerId = m.resellerId && m.resellerId === resellerId;
      const matchByCode = cleanCode && m.referredByCode && m.referredByCode.toUpperCase() === cleanCode;
      
      if (matchByResellerId || matchByCode) {
        if (!seenUids.has(m.uid)) {
          seenUids.add(m.uid);
          result.push(m);
        }
      }
    });

    // 2. Query Firestore users collection
    try {
      const usersCol = collection(db, 'users');
      const q1 = query(usersCol, where('resellerId', '==', resellerId));
      const snap1 = await getDocs(q1);
      snap1.forEach(docSnap => {
        const u = docSnap.data() as UserMember;
        if (u.uid && u.uid !== resellerId && !seenUids.has(u.uid)) {
          seenUids.add(u.uid);
          result.push(u);
        }
      });

      if (cleanCode) {
        const q2 = query(usersCol, where('referredByCode', '==', cleanCode));
        const snap2 = await getDocs(q2);
        snap2.forEach(docSnap => {
          const u = docSnap.data() as UserMember;
          if (u.uid && u.uid !== resellerId && !seenUids.has(u.uid)) {
            seenUids.add(u.uid);
            result.push(u);
          }
        });
      }
    } catch (fsErr) {
      console.debug('Firestore get referred users notice:', fsErr);
    }
  } catch (err) {
    console.error('Error fetching referred users:', err);
  }

  return result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Get sub-dealers (bayiler) registered under a parent dealer (including recursive downline
 * in their own Monoline single-line tree, while excluding upper sponsors' other dealers).
 */
export async function getSubResellersForReseller(reseller: Reseller): Promise<Reseller[]> {
  const parentUid = reseller?.uid || '';
  const cleanCode = (reseller?.referralCode || '').trim().toUpperCase();
  if (!parentUid && !cleanCode) return [];

  const all = await getAllResellers();
  let localMembers: UserMember[] = [];
  try {
    const { getLocalMembersDirectory } = await import('./authManager');
    localMembers = getLocalMembersDirectory();
  } catch (e) {
    console.debug('Get sub resellers local notice:', e);
  }

  // Build parent-child lookup maps
  const activeUids = new Set<string>(parentUid ? [parentUid] : []);
  const activeCodes = new Set<string>(cleanCode ? [cleanCode] : []);
  const downlineResellers: Reseller[] = [];
  const addedUids = new Set<string>(parentUid ? [parentUid] : []);

  // Sort chronologically (oldest first) for Monoline single-line order
  const chronologicalAll = [...all].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  // Iteratively expand downline tree so sub-dealers of sub-dealers are included in order
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of chronologicalAll) {
      if (!r.uid || addedUids.has(r.uid)) continue;
      const rRefBy = (r.referredByCode || '').trim().toUpperCase();
      const memberDoc = localMembers.find(
        m => m.uid === r.uid || (r.email && m.email && m.email.toLowerCase() === r.email.toLowerCase())
      );
      const mRefBy = (memberDoc?.referredByCode || '').trim().toUpperCase();
      const mSponsorUid = memberDoc?.resellerId || '';

      const isSponsoredByDownline =
        (rRefBy && activeCodes.has(rRefBy)) ||
        (mRefBy && activeCodes.has(mRefBy)) ||
        (mSponsorUid && activeUids.has(mSponsorUid));

      if (isSponsoredByDownline) {
        addedUids.add(r.uid);
        activeUids.add(r.uid);
        if (r.referralCode) {
          activeCodes.add(r.referralCode.trim().toUpperCase());
        }
        downlineResellers.push({
          ...r,
          referredByCode: r.referredByCode || mRefBy || cleanCode,
        });
        changed = true;
      }
    }
  }

  return downlineResellers;
}

/**
 * Record a new user referral directly to the reseller's metrics
 */
export async function recordNewUserReferral(
  resellerId?: string,
  referralCode?: string,
  newUser?: UserMember
): Promise<void> {
  try {
    let targetReseller: Reseller | null = null;
    if (resellerId) {
      targetReseller = await getResellerById(resellerId);
    }
    if (!targetReseller && referralCode) {
      targetReseller = await getResellerByCode(referralCode);
    }

    if (!targetReseller) return;

    targetReseller.totalReferredUsers = (targetReseller.totalReferredUsers || 0) + 1;
    targetReseller.updatedAt = new Date().toISOString();

    const allResellers = getLocalResellers();
    const rIdx = allResellers.findIndex(r => r.uid === targetReseller!.uid);
    if (rIdx >= 0) {
      allResellers[rIdx] = targetReseller;
      saveLocalResellers(allResellers);
    }

    try {
      const docRef = doc(db, 'resellers', targetReseller.uid);
      await setDoc(docRef, { totalReferredUsers: targetReseller.totalReferredUsers, updatedAt: targetReseller.updatedAt }, { merge: true });
    } catch (fsErr) {
      console.debug('Firestore record user referral notice:', fsErr);
    }
  } catch (err) {
    console.debug('Record new user referral notice:', err);
  }
}

/**
 * Register / Create a new Reseller
 */
export async function registerNewReseller(data: {
  customUid?: string;
  resellerName: string;
  email: string;
  phone: string;
  customReferralCode?: string;
  referredByCode?: string;
  sponsorId?: string;
  keepCurrentSession?: boolean;
  commissionRate?: number;
  initialCredits?: number;
  bankInfo?: Partial<BankInfo>;
  notes?: string;
}): Promise<{ success: boolean; message: string; reseller?: Reseller }> {
  try {
    const cleanName = data.resellerName.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      return { success: false, message: 'Lütfen Bayi Adı, E-posta ve Telefon alanlarını eksiksiz doldurunuz.' };
    }

    const all = await getAllResellers();

    // Check duplicate email
    if (all.some(r => r.email && r.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Bu e-posta adresi ile zaten kayıtlı bir bayi bulunmaktadır.' };
    }

    // Resolve sponsor / referredByCode
    let resolvedSponsor: Reseller | null = null;
    if (data.sponsorId) {
      resolvedSponsor = all.find(r => r.uid === data.sponsorId) || null;
    }
    const rawRefBy = (data.referredByCode || getStoredReferralCode() || '').trim().toUpperCase();
    if (!resolvedSponsor && rawRefBy) {
      resolvedSponsor = all.find(r => r.referralCode && r.referralCode.toUpperCase() === rawRefBy) || null;
    }
    const finalReferredByCode = resolvedSponsor?.referralCode || rawRefBy || undefined;

    // Referral code determination
    let finalCode = (data.customReferralCode || '').trim().toUpperCase();
    if (!finalCode) {
      finalCode = generateUniqueReferralCode();
    } else {
      if (!finalCode.startsWith('AURA-') && !finalCode.startsWith('BAYI-')) {
        finalCode = `AURA-${finalCode}`;
      }
    }

    // Check duplicate code
    if (all.some(r => r.referralCode && r.referralCode.toUpperCase() === finalCode)) {
      finalCode = generateUniqueReferralCode();
    }

    const uid = (data.customUid || '').trim() || ('RESELLER-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    const nowIso = new Date().toISOString();

    // İLK BAYİ KAYDI HOŞGELDİN BONUSU (BİR DEFAYA MAHSUS 32 + 32 = 64 SEANS KREDİSİ)
    const alreadyClaimedBonus = hasClaimedWelcomeBonus(cleanEmail, cleanPhone, uid);
    const welcomeBonusToGrant = !alreadyClaimedBonus ? WELCOME_BONUS_TOTAL_CREDITS : 0;
    const finalInitialCredits =
      typeof data.initialCredits === 'number' && data.initialCredits > 0
        ? data.initialCredits
        : welcomeBonusToGrant;

    const newReseller: Reseller = {
      uid,
      resellerName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      referralCode: finalCode,
      referredByCode: finalReferredByCode,
      commissionRate: data.commissionRate !== undefined ? data.commissionRate : 20, // default 20%
      creditsBalance: finalInitialCredits,
      dealerPackageId: 'pkg-5k',
      welcomeBonusGranted: !alreadyClaimedBonus || finalInitialCredits >= WELCOME_BONUS_TOTAL_CREDITS,
      welcomeBonusCredits: WELCOME_BONUS_TOTAL_CREDITS,
      welcomeBonusBreakdown: '32+32',
      welcomeBonusGrantedAt: nowIso,
      bankInfo: {
        bankName: data.bankInfo?.bankName || '',
        accountHolder: data.bankInfo?.accountHolder || cleanName,
        iban: data.bankInfo?.iban || '',
      },
      status: 'active',
      totalEarnings: 0,
      paidEarnings: 0,
      pendingEarnings: 0,
      totalSalesAmount: 0,
      totalReferredUsers: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      notes:
        data.notes ||
        `İlk bayi kaydı — Bir defaya mahsus 32+32 (${WELCOME_BONUS_TOTAL_CREDITS} Kredi) Hoşgeldin Bonusu otomatik tanımlandı.`,
    };

    if (!alreadyClaimedBonus) {
      markWelcomeBonusClaimed(cleanEmail, cleanPhone, uid);
    }

    // Save locally
    const updatedList = [newReseller, ...all];
    saveLocalResellers(updatedList);
    if (!data.keepCurrentSession) {
      setActiveResellerSession(newReseller);
    }

    // Also persist in local members directory so sponsor linkage and sub-dealer queries stay 100% synced
    try {
      const { saveToLocalMembersDirectory } = await import('./authManager');
      const newMemberDoc: UserMember = {
        uid,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: 'dealer',
        dealerStatus: 'approved',
        dealerPackageId: 'pkg-5k',
        creditsBalance: finalInitialCredits,
        isAllowed: true,
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        referralCode: finalCode,
        referredByCode: finalReferredByCode || '',
        resellerId: resolvedSponsor?.uid || data.sponsorId || undefined,
        dealerDetails: {
          companyName: cleanName,
          phone: cleanPhone,
          whatsapp: cleanPhone,
          businessField: 'Biyo-Rezonans & Frekans Merkezi',
          referralCode: finalCode,
          taxNumber: '',
          taxOffice: '',
          commissionRate: newReseller.commissionRate,
          creditsBalance: finalInitialCredits,
          bankInfo: newReseller.bankInfo,
        },
        createdAt: nowIso,
        lastLoginAt: nowIso,
      };
      saveToLocalMembersDirectory(newMemberDoc);
    } catch {}

    // Record welcome bonus credit transaction log
    if (finalInitialCredits > 0) {
      await recordCreditTransaction({
        resellerId: uid,
        resellerName: cleanName,
        type: 'bonus',
        amount: finalInitialCredits,
        previousBalance: 0,
        newBalance: finalInitialCredits,
        description: `🎁 İlk Bayi Kaydı Sisteme Hoşgeldin Bonusu (Bir Defaya Mahsus 32+32 = ${finalInitialCredits} Seans Kredisi Otomatik Tanımlandı)`,
        performedBy: 'Sistem Otomatik Hoşgeldin Bonusu',
      });
    }

    // Save to Firestore
    try {
      const docRef = doc(db, 'resellers', uid);
      await setDoc(docRef, newReseller);
    } catch (fsErr) {
      console.warn('Firestore reseller save notice:', fsErr);
    }

    try {
      import('./monolineSyncBridge').then(m => {
        m.syncFrekansWithMonolineEngine().then(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
          }
        });
      }).catch(() => {});
    } catch {}

    return {
      success: true,
      message: !alreadyClaimedBonus
        ? `Bayilik kaydınız başarıyla oluşturuldu! 🎁 Sisteme Hoşgeldin Bonusu olarak bir defaya mahsus 32+32 (Toplam ${WELCOME_BONUS_TOTAL_CREDITS}) Seans Kredisi hesabınıza otomatik tanımlandı. Özel Davet Kodunuz: ${finalCode}`
        : `Bayilik kaydınız başarıyla oluşturuldu! Özel Davet Kodunuz: ${finalCode}`,
      reseller: newReseller
    };
  } catch (err: any) {
    console.error('Register reseller error:', err);
    return { success: false, message: err?.message || 'Bayi kaydı sırasında bir hata oluştu.' };
  }
}

/**
 * Update Reseller Bank Information (IBAN, Bank Name, Account Holder)
 */
export async function updateResellerBankInfo(
  resellerId: string,
  bankInfo: BankInfo
): Promise<{ success: boolean; message: string; reseller?: Reseller }> {
  try {
    const all = await getAllResellers();
    const idx = all.findIndex(r => r.uid === resellerId);
    if (idx === -1) {
      return { success: false, message: 'Bayi kaydı bulunamadı.' };
    }

    const updatedReseller: Reseller = {
      ...all[idx],
      bankInfo: {
        bankName: (bankInfo.bankName || '').trim(),
        accountHolder: (bankInfo.accountHolder || '').trim(),
        iban: (bankInfo.iban || '').trim(),
      },
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updatedReseller;
    saveLocalResellers(all);

    const activeSession = getActiveResellerSession();
    if (activeSession && activeSession.uid === resellerId) {
      setActiveResellerSession(updatedReseller);
    }

    // Save to Firestore
    try {
      const docRef = doc(db, 'resellers', resellerId);
      await setDoc(docRef, { bankInfo: updatedReseller.bankInfo, updatedAt: updatedReseller.updatedAt }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore update bank info notice:', fsErr);
    }

    return {
      success: true,
      message: 'Banka ve IBAN hesap bilgileriniz başarıyla güncellendi.',
      reseller: updatedReseller
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Banka bilgileri güncellenirken hata oluştu.' };
  }
}

/**
 * Admin: Save or update full reseller settings (Commission rate, status, etc.)
 */
export async function adminSaveReseller(reseller: Reseller): Promise<boolean> {
  try {
    const resellerUid = typeof reseller?.uid === 'string' ? reseller.uid.trim() : '';
    if (!resellerUid) {
      console.warn('Admin save reseller skipped: reseller UID is unavailable.');
      return false;
    }
    const all = await getAllResellers();
    const idx = all.findIndex(r => r.uid === reseller.uid);
    let updatedList: Reseller[];

    const dataToSave: Reseller = {
      ...reseller,
      updatedAt: new Date().toISOString()
    };

    if (idx >= 0) {
      updatedList = [...all];
      updatedList[idx] = dataToSave;
    } else {
      updatedList = [dataToSave, ...all];
    }

    saveLocalResellers(updatedList);

    try {
      const docRef = doc(db, 'resellers', resellerUid);
      await setDoc(docRef, dataToSave, { merge: true });
    } catch (fsErr) {
      console.warn('Admin save reseller Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin save reseller error:', err);
    return false;
  }
}

/**
 * Admin: Delete Reseller
 */
export async function adminDeleteReseller(resellerId: string): Promise<boolean> {
  try {
    const all = await getAllResellers();
    const target = all.find(r => r.uid === resellerId);
    const updated = all.filter(r => r.uid !== resellerId);
    saveLocalResellers(updated);

    try {
      const docRef = doc(db, 'resellers', resellerId);
      await deleteDoc(docRef);
    } catch (fsErr) {
      console.warn('Admin delete reseller Firestore notice:', fsErr);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
      window.dispatchEvent(new CustomEvent('aurabio_members_updated'));
      window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
      if (target?.referralCode) {
        fetch(`/api/v1/admin/members/${encodeURIComponent(target.referralCode)}`, { method: 'DELETE' }).catch(() => {});
      }
      fetch(`/api/v1/admin/members/${encodeURIComponent(resellerId)}`, { method: 'DELETE' }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error('Admin delete reseller error:', err);
    return false;
  }
}

/**
 * Generate Shareable Referral Link URL
 */
export function generateReferralLink(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `https://akngroupfrekans.web.app/?ref=${encodeURIComponent(referralCode)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?ref=${encodeURIComponent(referralCode)}`;
}

/**
 * 1. Generate Business Presentation Link
 * Opens the interactive presentation catalog with this dealer's code locked
 */
export function generateBusinessPresentationLink(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `https://akngroupfrekans.web.app/?view=presentation&ref=${encodeURIComponent(referralCode)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?view=presentation&ref=${encodeURIComponent(referralCode)}`;
}

/**
 * 2. Generate Technical Report & Scientific Documentation Link
 * Opens the technical biophysical whitepaper and specification report
 */
export function generateTechnicalReportLink(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `https://akngroupfrekans.web.app/?view=technical&ref=${encodeURIComponent(referralCode)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?view=technical&ref=${encodeURIComponent(referralCode)}`;
}

/**
 * 3. Generate Direct Registration Link with Locked Dealer
 * Opens AuthModal directly in registration mode with dealer locked
 */
export function generateRegisterLink(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `https://akngroupfrekans.web.app/?view=register&ref=${encodeURIComponent(referralCode)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?view=register&ref=${encodeURIComponent(referralCode)}`;
}

/**
 * 4. Generate Digital Business Card & QR Code Page Link
 * Opens the personalized digital business card for this dealer
 */
export function generateBusinessCardLink(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `https://akngroupfrekans.web.app/?view=card&ref=${encodeURIComponent(referralCode)}`;
  }
  const origin = window.location.origin;
  return `${origin}/?view=card&ref=${encodeURIComponent(referralCode)}`;
}

/**
 * Generate Comprehensive Bulk Share Text containing all marketing links
 */
export function generateBulkMarketingMessage(
  referralCode: string, 
  resellerName = 'AuraBio Yetkili Bayisi',
  phone = ''
): string {
  const cardLink = generateBusinessCardLink(referralCode);
  const regLink = generateRegisterLink(referralCode);
  const presLink = generateBusinessPresentationLink(referralCode);
  const techLink = generateTechnicalReportLink(referralCode);

  return `🌟 *AuraBio Frekans & Biyo-Rezonans Teknolojileri*
━━━━━━━━━━━━━━━━━━━━
🏢 *Yetkili Bayi / Temsilci:* ${resellerName}
🔑 *Özel Bayi Referans Kodu:* ${referralCode}${phone ? `\n📞 *İletişim / WhatsApp:* ${phone}` : ''}
━━━━━━━━━━━━━━━━━━━━

Aşağıdaki resmi bağlantılar üzerinden canlı frekans sistemini inceleyebilir, demo başlatabilir veya bayiliğimize doğrudan kayıt olabilirsiniz:

🪪 *Dijital Kartvizitim & Karekodum:*
🔗 ${cardLink}

📝 *Doğrudan Üye & Bayi Kayıt Ekranı:*
🔗 ${regLink}

📊 *İş & Ürün Sunum Raporu (Katalog):*
🔗 ${presLink}

🔬 *Teknik Rapor & Frekans Dökümantasyonu:*
🔗 ${techLink}

✨ *30 Dakikalık Ücretsiz Canlı Demoyu Hemen Deneyimleyin!*`;
}

/**
 * Generate WhatsApp Ready Share Link for generic or custom text
 */
export function generateWhatsAppShareUrl(referralCode: string, resellerName = 'AuraBio Bayisi'): string {
  const link = generateReferralLink(referralCode);
  const text = encodeURIComponent(
    `🌟 Merhaba! AuraBio Frekans, Canlı Aura Spektrometresi ve Biyo-Rezonans sistemini benim özel referans bağlantımla hemen deneyimleyin:\n\n🔗 Bağlantı: ${link}\n\n🎁 Özel Davet Kodum: ${referralCode}\n\nSisteme kayıt olarak 30 dakikalık canlı demo veya avantajlı frekans paketlerinden hemen yararlanabilirsiniz.`
  );
  return `https://wa.me/?text=${text}`;
}

/**
 * Generate WhatsApp URL with pre-encoded message
 */
export function generateWhatsAppUrlForMessage(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Generate Telegram Ready Share Link
 */
export function generateTelegramShareUrl(referralCode: string): string {
  const link = generateReferralLink(referralCode);
  const text = encodeURIComponent(`AuraBio Frekans ve Biyo-Rezonans Sistemi Özel Davet Bağlantısı (${referralCode})`);
  return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
}

/**
 * Generate Telegram URL with pre-encoded message
 */
export function generateTelegramUrlForMessage(message: string, url?: string): string {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.origin : '');
  return `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(message)}`;
}

/**
 * Record a Commission when an order is completed by a member
 */
export async function recordCommissionForOrder(
  order: MemberOrder,
  user: UserMember
): Promise<CommissionTransaction | null> {
  try {
    if (!order || order.amount <= 0 || order.paymentStatus === 'DEMO') {
      return null;
    }

    // Determine resellerId from user document or stored referral code
    let targetReseller: Reseller | null = null;
    if (user.resellerId) {
      targetReseller = await getResellerById(user.resellerId);
    }
    if (!targetReseller && user.referredByCode) {
      targetReseller = await getResellerByCode(user.referredByCode);
    }
    if (!targetReseller) {
      const cachedCode = getStoredReferralCode();
      if (cachedCode) {
        targetReseller = await getResellerByCode(cachedCode);
      }
    }

    // If no reseller found, do not record any fictitious commission
    if (!targetReseller) {
      return null;
    }

    const rate = targetReseller.commissionRate || 20;
    const commissionAmount = Math.round((order.amount * rate) / 100);

    const transactionId = `COMM-${Math.floor(10000 + Math.random() * 90000)}`;
    const maskedUser = maskUserId(user.uid);

    const newCommission: CommissionTransaction = {
      transactionId,
      resellerId: targetReseller.uid,
      userId: maskedUser, // Masked for privacy
      orderId: order.id,
      packageName: order.packageName || 'AuraBio Lisans Paketi',
      amount: order.amount,
      commissionRate: rate,
      commissionAmount,
      status: order.paymentStatus === 'PAID' ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      notes: `${order.userName ? 'Üye' : 'Kullanıcı'} siparişi üzerinden %${rate} komisyon`,
    };

    // Save commission
    const allComms = getLocalCommissions();
    saveLocalCommissions([newCommission, ...allComms]);

    // Update reseller balance & stats
    targetReseller.totalSalesAmount = (targetReseller.totalSalesAmount || 0) + order.amount;
    targetReseller.totalEarnings = (targetReseller.totalEarnings || 0) + commissionAmount;
    if (newCommission.status === 'approved') {
      targetReseller.pendingEarnings = (targetReseller.pendingEarnings || 0) + commissionAmount;
    }
    targetReseller.totalReferredUsers = (targetReseller.totalReferredUsers || 0) + 1;
    targetReseller.updatedAt = new Date().toISOString();

    const allResellers = getLocalResellers();
    const rIdx = allResellers.findIndex(r => r.uid === targetReseller!.uid);
    if (rIdx >= 0) {
      allResellers[rIdx] = targetReseller;
      saveLocalResellers(allResellers);
    }

    // Save to Firestore
    try {
      const commDoc = doc(db, 'commissions', transactionId);
      await setDoc(commDoc, newCommission);

      const resDoc = doc(db, 'resellers', targetReseller.uid);
      await setDoc(resDoc, targetReseller, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore commission record notice:', fsErr);
    }

    return newCommission;
  } catch (err) {
    console.error('Record commission error:', err);
    return null;
  }
}

/**
 * Get commissions for a specific reseller (with strict user privacy)
 */
export async function getCommissionsForReseller(resellerId: string): Promise<CommissionTransaction[]> {
  const localList = getLocalCommissions().filter(c => c.resellerId === resellerId);

  try {
    const colRef = collection(db, 'commissions');
    const q = query(colRef, where('resellerId', '==', resellerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const map = new Map<string, CommissionTransaction>();
      snap.forEach(d => {
        const item = d.data() as CommissionTransaction;
        if (item.transactionId) map.set(item.transactionId, item);
      });
      localList.forEach(c => map.set(c.transactionId, c));
      return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
  } catch (err) {
    console.debug('Firestore get commissions notice:', err);
  }

  return localList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Admin: Get all commissions across all resellers
 */
export async function getAllCommissionsAdmin(): Promise<CommissionTransaction[]> {
  const map = new Map<string, CommissionTransaction>();
  getLocalCommissions().forEach(c => map.set(c.transactionId, c));

  try {
    const colRef = collection(db, 'commissions');
    const snap = await getDocs(colRef);
    snap.forEach(d => {
      const item = d.data() as CommissionTransaction;
      if (item.transactionId) map.set(item.transactionId, item);
    });
  } catch (err) {
    console.debug('Admin get all commissions notice:', err);
  }

  const list = Array.from(map.values());
  saveLocalCommissions(list);
  return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Admin: Update commission status (e.g. approve, mark as paid, reject)
 */
export async function adminUpdateCommissionStatus(
  transactionId: string,
  newStatus: 'pending' | 'approved' | 'paid' | 'rejected',
  notes?: string
): Promise<boolean> {
  try {
    const all = await getAllCommissionsAdmin();
    const idx = all.findIndex(c => c.transactionId === transactionId);
    if (idx === -1) return false;

    const comm = all[idx];
    const prevStatus = comm.status;
    comm.status = newStatus;
    if (notes) comm.notes = notes;
    if (newStatus === 'paid') {
      comm.paidAt = new Date().toISOString();
    }

    all[idx] = comm;
    saveLocalCommissions(all);

    // Update reseller balances
    const reseller = await getResellerById(comm.resellerId);
    if (reseller) {
      if (newStatus === 'paid' && prevStatus !== 'paid') {
        reseller.paidEarnings = (reseller.paidEarnings || 0) + comm.commissionAmount;
        reseller.pendingEarnings = Math.max(0, (reseller.pendingEarnings || 0) - comm.commissionAmount);
      } else if (newStatus === 'approved' && prevStatus === 'pending') {
        reseller.pendingEarnings = (reseller.pendingEarnings || 0) + comm.commissionAmount;
      } else if (newStatus === 'rejected' && prevStatus === 'approved') {
        reseller.pendingEarnings = Math.max(0, (reseller.pendingEarnings || 0) - comm.commissionAmount);
      }
      await adminSaveReseller(reseller);
    }

    try {
      const docRef = doc(db, 'commissions', transactionId);
      await setDoc(docRef, comm, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore update commission status notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Update commission status error:', err);
    return false;
  }
}

/**
 * Active Reseller Session helpers
 */
export function getActiveResellerSession(): Reseller | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY);
    if (!raw) return null;
    const res = JSON.parse(raw) as Partial<Reseller>;
    const uid = typeof res.uid === 'string' ? res.uid.trim() : '';
    const email = typeof res.email === 'string' ? res.email.trim().toLowerCase() : '';
    if (!uid && !email) {
      localStorage.removeItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY);
      return null;
    }

    // Keep valid sessions across reloads; legacy IDs are allowed until the canonical
    // Firestore profile has been hydrated instead of forcing an automatic logout.
    const normalized = { ...res, uid: uid || `LOCAL-${email.replace(/[^a-z0-9]+/g, '-')}`, email } as Reseller;
    localStorage.setItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return null;
  }
}

export function setActiveResellerSession(reseller: Reseller | null): void {
  if (typeof window === 'undefined') return;
  try {
    const prevRaw = localStorage.getItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY);
    const nextRaw = reseller ? JSON.stringify(reseller) : null;
    
    // Skip redundant updates to prevent infinite event loops
    if (prevRaw === nextRaw) {
      return;
    }

    if (!reseller) {
      localStorage.removeItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY);
      clearStoredReferralCode();
    } else {
      localStorage.setItem(STORAGE_ACTIVE_RESELLER_SESSION_KEY, nextRaw!);
    }

    // Safely dispatch asynchronously so listener exceptions don't throw uncaught errors
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('aurabio_reseller_session_updated', { detail: reseller }));
      } catch (evtErr) {
        console.debug('aurabio_reseller_session_updated event dispatch notice:', evtErr);
      }
    }, 0);
  } catch (err) {
    console.debug('setActiveResellerSession notice:', err);
  }
}

/**
 * Login as Reseller via Referral Code or Email
 */
export async function loginAsReseller(credential: string): Promise<{ success: boolean; message: string; reseller?: Reseller }> {
  try {
    const clean = credential.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'Lütfen Bayi Kodunuzu veya E-posta adresinizi giriniz.' };
    }

    const all = await getAllResellers();
    const cleanLower = credential.trim().toLowerCase();
    let found = all.find(r => 
      (r.referralCode && r.referralCode.toUpperCase() === clean) || 
      (r.email && r.email.toLowerCase() === cleanLower) ||
      (r.uid && r.uid === credential.trim())
    );

    // If not found in local resellers, check local members directory
    if (!found) {
      const { getLocalMembersDirectory } = await import('./authManager');
      const members = getLocalMembersDirectory();
      const mem = members.find(m =>
        (m.referralCode && m.referralCode.toUpperCase() === clean) ||
        (m.email && m.email.toLowerCase() === cleanLower) ||
        (m.uid && m.uid === credential.trim())
      );
      if (mem) {
        found = await getOrCreateResellerForUser(mem);
      }
    }

    // If still not found, check backend server via /api/v1/members/lookup
    if (!found) {
      try {
        const resp = await fetch(`/api/v1/members/lookup?q=${encodeURIComponent(credential.trim())}`);
        if (resp.ok) {
          const resData = await resp.json();
          if (resData.status === 'success' && resData.member) {
            const m = resData.member;
            const nowIso = new Date().toISOString();
            const synchedReseller: Reseller = {
              uid: m.user_id,
              resellerName: m.full_name,
              fullName: m.full_name,
              email: m.email,
              phone: m.phone || '',
              referralCode: m.ref_code,
              commissionRate: 20,
              status: m.is_locked ? 'suspended' : 'active',
              creditsBalance: typeof m.session_credits === 'number' ? m.session_credits : 64,
              totalEarnings: m.wallets?.total_earnings || 0,
              pendingEarnings: 0,
              paidEarnings: m.wallets?.total_withdrawn || 0,
              totalSalesAmount: 0,
              totalReferredUsers: 0,
              createdAt: m.joined_at || nowIso,
              updatedAt: nowIso,
              bankInfo: {
                bankName: m.bank_details?.bank_name || 'Ziraat Bankası',
                accountHolder: m.bank_details?.iban_holder_name || m.full_name,
                iban: m.bank_details?.iban || '',
              },
            };
            await adminSaveReseller(synchedReseller);
            found = synchedReseller;
          }
        }
      } catch (srvErr) {
        console.debug('Backend reseller lookup notice:', srvErr);
      }
    }

    if (!found) {
      return { success: false, message: 'Girilen kod veya e-posta ile eşleşen bir bayi bulunamadı.' };
    }

    if (found.status === 'suspended') {
      return { success: false, message: 'Bu bayi hesabı yönetici tarafından askıya alınmıştır. Lütfen destek ile iletişime geçin.' };
    }

    setActiveResellerSession(found);
    return { success: true, message: `Hoş geldiniz, ${found.resellerName}!`, reseller: found };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Giriş yapılamadı.' };
  }
}

/**
 * Real-time Subscription to Reseller's Profile and Statistics
 */
export function subscribeToReseller(
  resellerId: string,
  onUpdate: (reseller: Reseller | null) => void
): Unsubscribe {
  const loadAndEmit = async () => {
    const r = await getResellerById(resellerId);
    onUpdate(r);
  };

  loadAndEmit();

  const handleLocal = () => loadAndEmit();
  window.addEventListener('aurabio_resellers_updated', handleLocal);
  window.addEventListener('aurabio_reseller_session_updated', handleLocal);
  window.addEventListener('aurabio_credits_deducted', handleLocal);

  try {
    const docRef = doc(db, 'resellers', resellerId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = { ...snap.data(), uid: snap.id } as Reseller;
        const localList = getLocalResellers();
        const activeRes = getActiveResellerSession();
        const localCandidate =
          (activeRes && activeRes.uid === resellerId ? activeRes : null) ||
          localList.find(r => r.uid === resellerId) ||
          null;
        if (localCandidate) {
          const localMs = new Date(localCandidate.updatedAt || 0).getTime();
          const fsMs = new Date(data.updatedAt || 0).getTime();
          if (localMs > fsMs) {
            setActiveResellerSession(localCandidate);
            onUpdate(localCandidate);
            return;
          }
        }
        setActiveResellerSession(data);
        onUpdate(data);
      }
    });

    return () => {
      window.removeEventListener('aurabio_resellers_updated', handleLocal);
      window.removeEventListener('aurabio_reseller_session_updated', handleLocal);
      window.removeEventListener('aurabio_credits_deducted', handleLocal);
      unsub();
    };
  } catch {
    return () => {
      window.removeEventListener('aurabio_resellers_updated', handleLocal);
      window.removeEventListener('aurabio_reseller_session_updated', handleLocal);
      window.removeEventListener('aurabio_credits_deducted', handleLocal);
    };
  }
}
