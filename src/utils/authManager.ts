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
  Unsubscribe,
  db,
  ensureFirebaseAuthUser
} from '../lib/db';
import { formatUsd } from './currency';
import { getPackagePriceForRegion, resolveMemberRegion } from './walletRegion';
import { loginAdmin, loginAdminWithMessage } from './adminSession';

// ADMIN CREDENTIALS & CONSTANTS
export const ADMIN_EMAILS = [
  'psikologabdulkadirkan@gmail.com',
];
export let ADMIN_PHONE = '+90 542 578 37 48';
export let ADMIN_PHONE_CLEAN = '905425783748';

export function setAdminPhone(phone: string): void {
  ADMIN_PHONE = phone;
  ADMIN_PHONE_CLEAN = phone.replace(/\D/g, '');
}

// BANK & PAYMENT DETAILS (yönetici panelinden güncellenir, bkz. siteContentManager)
export const BANK_INFO = {
  bankName: 'QNB Finansbank',
  accountHolder: 'Abdulkadir Kan',
  iban: 'TR32 0015 7000 0000 0091 7751 22',
  ibanClean: 'TR320015700000000091775122'
};

export interface MembershipPackage {
  id: string;
  name: string;
  durationText: string;
  days?: number | null; // null for unlimited
  scanCredits: number;
  minutes?: number; // for demo
  price: number;
  priceText: string;
  isDemo?: boolean;
  popular?: boolean;
  badge?: string;
  targetAudience?: string;
  unitCostText?: string;
  features: string[];
}

export interface CartItem {
  packageId: string;
  quantity: number;
}

export const DEFAULT_MEMBERSHIP_PACKAGES: MembershipPackage[] = [
  {
    id: 'pkg-5k',
    name: 'Mini Başlangıç & Deneme Paketi',
    durationText: '32 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 32,
    days: null,
    price: 101,
    priceText: '$101',
    badge: 'MİNİ DENEME',
    unitCostText: '$3.16 / Seans',
    targetAudience: 'Sistemi düşük bütçeyle denemek isteyen bireysel kullanıcı ve uygulayıcılar.',
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
    name: 'Bronz Başlangıç & Seans Paketi',
    durationText: '70 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 70,
    days: null,
    price: 201,
    priceText: '$201',
    badge: 'BAŞLANGIÇ & BİREYSEL',
    unitCostText: '$2.87 / Seans',
    targetAudience: 'Sisteme yeni adım atan bireysel terapist ve danışmanlar.',
    features: [
      '70 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Standart Raporlama & Aura Analizi',
      'Web & Mobil Uyumlu Erişim',
      'Standart WhatsApp Canlı Destek Hattı'
    ]
  },
  {
    id: 'pkg-15k',
    name: 'Gümüş Standart Terapist Paketi',
    durationText: '115 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 115,
    days: null,
    price: 302,
    priceText: '$302',
    badge: 'STANDART TERAPİST',
    unitCostText: '$2.63 / Seans',
    targetAudience: 'Düzenli danışan alan bireysel koçlar ve bio-enerji uygulayıcıları.',
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
    name: 'Gümüş Plus Terapist Paketi',
    durationText: '160 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 160,
    days: null,
    price: 402,
    priceText: '$402',
    badge: 'TERAPİST & PRATİSYEN',
    unitCostText: '$2.51 / Seans',
    targetAudience: 'Düzenli seans yapan holistik sağlık koçları ve pratisyenler.',
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
    name: 'Altın Danışman Paketi',
    durationText: '215 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 215,
    days: null,
    price: 503,
    priceText: '$503',
    badge: 'DANIŞMAN & KOÇ',
    unitCostText: '$2.34 / Seans',
    targetAudience: 'Genişleyen danışan tabanına sahip profesyonel terapistler.',
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
    name: 'Altın Pro Danışman Paketi',
    durationText: '270 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 270,
    days: null,
    price: 603,
    priceText: '$603',
    popular: true,
    badge: 'EN POPÜLER & F/P',
    unitCostText: '$2.23 / Seans',
    targetAudience: 'Yoğun danışan kabul eden profesyonel terapistler ve merkezler.',
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
    name: 'Platin Klinik & Uzman Paketi',
    durationText: '500 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 500,
    days: null,
    price: 1005,
    priceText: '$1.005',
    badge: 'UZMAN KLİNİK',
    unitCostText: '$2.01 / Seans',
    targetAudience: 'Geniş danışan portföyüne sahip klinikler ve bio-frekans merkezleri.',
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
    name: 'Safir Kurumsal Merkez Paketi',
    durationText: '650 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 650,
    days: null,
    price: 1206,
    priceText: '$1.206',
    badge: 'SAFİR KURUMSAL',
    unitCostText: '$1.86 / Seans',
    targetAudience: 'Çoklu seans odası bulunan sağlıklı yaşam ve holistik merkezler.',
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
    name: 'Zümrüt Master Klinik Paketi',
    durationText: '800 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 800,
    days: null,
    price: 1407,
    priceText: '$1.407',
    badge: 'ZÜMRÜT MASTER',
    unitCostText: '$1.76 / Seans',
    targetAudience: 'Bölgesel sağlık merkezleri ve uzman klinik ağları.',
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
    name: 'Yakut Elit Sağlık Paketi',
    durationText: '950 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 950,
    days: null,
    price: 1608,
    priceText: '$1.608',
    badge: 'YAKUT ELİT',
    unitCostText: '$1.69 / Seans',
    targetAudience: 'Yüksek hacimli estetik, wellness ve bioenerji merkezleri.',
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
    name: 'Titanyum Entegre Tıp Paketi',
    durationText: '1.100 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 1100,
    days: null,
    price: 1809,
    priceText: '$1.809',
    badge: 'TİTANYUM ENTEGRE',
    unitCostText: '$1.64 / Seans',
    targetAudience: 'Entegre ve fonksiyonel tıp hekimleri ile hastane departmanları.',
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
    name: 'Elmas Bölge Distribütör Paketi',
    durationText: '1.300 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 1300,
    days: null,
    price: 2010,
    priceText: '$2.010',
    badge: 'BÖLGE DİSTRİBÜTÖRÜ',
    unitCostText: '$1.55 / Seans',
    targetAudience: 'İl ve bölge distribütörleri, franchise temsilcileri.',
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
    name: 'Master Franchise & Çoklu Şube Paketi',
    durationText: '3.000 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 3000,
    days: null,
    price: 4021,
    priceText: '$4.021',
    badge: 'MASTER FRANCHISE',
    unitCostText: '$1.34 / Seans',
    targetAudience: 'Çok şubeli sağlık grupları, franchise ağları ve master organizasyonlar.',
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
    name: 'Enterprise Mega Ağ & Holding Paketi',
    durationText: '5.000 Seans Kredisi (Süre Sınırı Yok)',
    scanCredits: 5000,
    days: null,
    price: 6031,
    priceText: '$6.031',
    badge: 'ENTERPRISE MEGA AĞ',
    unitCostText: '$1.21 / Seans',
    targetAudience: 'Ulusal ve uluslararası sağlık ağları, yatırımcılar ve holdingler.',
    features: [
      '5.000 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Merkezi Kredi ve Bayi Yönetim Platformu',
      'Tüm Gelecek Modül ve Veri Güncellemelerine Ömür Boyu Erişim',
      'Özel Ayrılmış Bulut Sunucu & VIP Mimari Destek'
    ]
  }
];

export const MEMBERSHIP_PACKAGES: MembershipPackage[] = DEFAULT_MEMBERSHIP_PACKAGES;

const STORAGE_CUSTOM_PACKAGES_KEY = 'aurabio_dynamic_packages_v3';

/**
 * Get active dynamic membership packages (combining local storage & defaults)
 */
export function getMembershipPackages(): MembershipPackage[] {
  if (typeof window === 'undefined') return DEFAULT_MEMBERSHIP_PACKAGES;
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PACKAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (p: MembershipPackage) =>
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
    console.debug('Error reading local packages:', e);
  }
  return DEFAULT_MEMBERSHIP_PACKAGES;
}

/**
 * Realtime subscription to dynamic packages from Firestore & local storage
 */
export function subscribeToMembershipPackages(
  onUpdate: (packages: MembershipPackage[]) => void
): Unsubscribe {
  // Immediately call with local/cached packages
  onUpdate(getMembershipPackages());

  // Listen for local changes across tabs / components
  const handleLocalChange = () => {
    onUpdate(getMembershipPackages());
  };
  window.addEventListener('storage', handleLocalChange);
  window.addEventListener('aurabio_packages_updated', handleLocalChange);

  // Firestore live listener
  try {
    const docRef = doc(db, 'system_config', 'membership_packages');
    const unsubFs = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && Array.isArray(data.packages) && data.packages.length > 0) {
            const filtered = (data.packages as MembershipPackage[]).filter(
              (p) =>
                p.id !== 'pkg-turnkey-2m' &&
                p.id !== 'PKG_TUM_KODLAR' &&
                !String(p.name || '').includes('Anahtar Teslim Sistem Devri')
            );
            localStorage.setItem(STORAGE_CUSTOM_PACKAGES_KEY, JSON.stringify(filtered));
            onUpdate(filtered);
          }
        }
      },
      (err) => {
        console.debug('Packages Firestore sync notice (using local active cache):', err?.message);
      }
    );

    return () => {
      window.removeEventListener('storage', handleLocalChange);
      window.removeEventListener('aurabio_packages_updated', handleLocalChange);
      unsubFs();
    };
  } catch {
    return () => {
      window.removeEventListener('storage', handleLocalChange);
      window.removeEventListener('aurabio_packages_updated', handleLocalChange);
    };
  }
}

/**
 * Admin: Create or update a membership package
 */
export async function adminSaveMembershipPackage(pkg: MembershipPackage): Promise<boolean> {
  try {
    const current = getMembershipPackages();
    const existingIndex = current.findIndex(p => p.id === pkg.id);
    let updated: MembershipPackage[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...pkg };
    } else {
      updated = [...current, { ...pkg }];
    }

    // Save locally
    localStorage.setItem(STORAGE_CUSTOM_PACKAGES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('aurabio_packages_updated'));

    // Save to Firestore
    try {
      const docRef = doc(db, 'system_config', 'membership_packages');
      await setDoc(docRef, { packages: updated, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin save package Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin save package error:', err);
    return false;
  }
}

/**
 * Admin: Delete a membership package
 */
export async function adminDeleteMembershipPackage(pkgId: string): Promise<boolean> {
  try {
    const current = getMembershipPackages();
    const updated = current.filter(p => p.id !== pkgId);

    localStorage.setItem(STORAGE_CUSTOM_PACKAGES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('aurabio_packages_updated'));

    try {
      const docRef = doc(db, 'system_config', 'membership_packages');
      await setDoc(docRef, { packages: updated, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin delete package Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin delete package error:', err);
    return false;
  }
}

/**
 * Admin: Reset membership packages to system defaults
 */
export async function adminResetMembershipPackages(): Promise<boolean> {
  try {
    localStorage.setItem(STORAGE_CUSTOM_PACKAGES_KEY, JSON.stringify(DEFAULT_MEMBERSHIP_PACKAGES));
    window.dispatchEvent(new CustomEvent('aurabio_packages_updated'));

    try {
      const docRef = doc(db, 'system_config', 'membership_packages');
      await setDoc(docRef, { packages: DEFAULT_MEMBERSHIP_PACKAGES, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin reset packages Firestore notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin reset packages error:', err);
    return false;
  }
}

import { DealerDetails, DealerStatus } from '../types';

export interface UserMember {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  passwordHash?: string;
  isAllowed: boolean; // Set by admin (or true during active demo)
  isApproved?: boolean; // License approval
  expiryDate: string | null; // ISO string or null for unlimited
  selectedPackage?: string; // e.g. '3-months' or 'demo-10m'
  cart?: CartItem[];
  paymentStatus?: 'PENDING' | 'PAID' | 'REJECTED' | 'DEMO';
  demoUsed?: boolean;
  demoUsedAt?: string;
  resellerId?: string; // ID of the affiliated reseller (Mandatory requirement)
  referredByCode?: string; // Invitation code used during registration
  referralCode?: string; // Personal unique invite code for this user or dealer
  country_code?: string; // Kayıtta seçilen ülke (ISO 3166-1 alpha-2); bölge bu değerden türetilir
  createdAt: string;
  lastLoginAt?: string;
  role?: 'customer' | 'member' | 'dealer' | 'admin';
  notes?: string;
  // Dynamic Dealer & Reseller Integration Fields (AKN Spec):
  isDealerRequested?: boolean;
  dealerStatus?: DealerStatus; // 'none' | 'pending' | 'approved' | 'rejected'
  dealerDetails?: DealerDetails;
  creditsBalance?: number; // Available scan / session credits pool
  dealerPackageId?: string; // e.g. 'bronze-dealer', 'silver-dealer', 'gold-dealer'
  welcomeBonusGranted?: boolean;
  welcomeBonusCredits?: number;
  welcomeBonusBreakdown?: string;
  welcomeBonusGrantedAt?: string;
}

const STORAGE_SESSION_KEY = 'aurabio_active_session_v1';
const MEMBER_WALLET_TOKEN_KEY = 'aurabio_member_wallet_token_v1';
const STORAGE_DEMO_BLACKLIST_KEY = 'aurabio_demo_used_blacklist_v1';

async function requestMemberWalletToken(
  email: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch('/api/v1/member/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data?.token !== 'string') {
      return {
        success: false,
        message: data?.message || 'Bayi oturumu sunucuda doğrulanamadı.',
      };
    }
    saveMemberWalletToken(data.token);
    return { success: true };
  } catch {
    return { success: false, message: 'Bayi giriş servisine ulaşılamadı.' };
  }
}
const STORAGE_MEMBERS_DIRECTORY_KEY = 'aurabio_members_directory_v1';

/**
 * Local persistent directory helper for fallback offline resilience
 */
export function getLocalMembersDirectory(): UserMember[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_MEMBERS_DIRECTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToLocalMembersDirectory(user: UserMember): void {
  if (typeof window === 'undefined' || !user.uid) return;
  try {
    const list = getLocalMembersDirectory();
    const userEmail = (user.email || '').toLowerCase();
    const idx = list.findIndex(m => m.uid === user.uid || (userEmail && m.email && m.email.toLowerCase() === userEmail));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    localStorage.setItem(STORAGE_MEMBERS_DIRECTORY_KEY, JSON.stringify(list));
  } catch {
    // non-blocking
  }
}

export async function completePaidDealerRegistration(
  user: UserMember,
  creditsBalance: number
): Promise<UserMember> {
  const existing = getLocalMembersDirectory().find((member) => member.uid === user.uid) || user;
  const wasPending = existing.paymentStatus !== 'PAID';
  const now = new Date().toISOString();
  const companyName = existing.dealerDetails?.companyName || existing.fullName;
  const updated: UserMember = {
    ...existing,
    isAllowed: true,
    isApproved: true,
    paymentStatus: 'PAID',
    dealerStatus: 'approved',
    creditsBalance,
    welcomeBonusGranted: true,
    welcomeBonusCredits: creditsBalance,
    welcomeBonusBreakdown: '32+32',
    welcomeBonusGrantedAt: now,
    dealerDetails: {
      ...existing.dealerDetails,
      companyName,
      creditsBalance,
      approvedAt: now,
    },
  };

  saveToLocalMembersDirectory(updated);
  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updated }));

  try {
    await setDoc(doc(db, 'users', updated.uid), updated, { merge: true });
  } catch (error) {
    console.debug('Paid dealer registration Firestore notice:', error);
  }

  const {
    adminSaveReseller,
    setActiveResellerSession,
    markWelcomeBonusClaimed,
    recordCreditTransaction,
  } = await import('./resellerManager');
  const resellerProfile = {
    uid: updated.uid,
    email: updated.email,
    fullName: updated.fullName,
    phone: updated.phone,
    whatsapp: updated.dealerDetails?.whatsapp || updated.phone,
    resellerName: companyName,
    businessName: companyName,
    referralCode: updated.referralCode || updated.dealerDetails?.referralCode || '',
    referredByCode: updated.referredByCode || '',
    resellerId: updated.resellerId || '',
    sponsorId: updated.resellerId || '',
    taxNumber: updated.dealerDetails?.taxNumber || 'Belirtilmedi',
    taxOffice: updated.dealerDetails?.taxOffice || 'Belirtilmedi',
    commissionRate: 20,
    creditsBalance,
    dealerPackageId: updated.dealerPackageId || 'pkg-5k',
    welcomeBonusGranted: true,
    welcomeBonusCredits: creditsBalance,
    welcomeBonusBreakdown: '32+32',
    welcomeBonusGrantedAt: now,
    status: 'active' as const,
    joinedAt: updated.createdAt,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    clientsCount: 0,
    salesCount: 0,
    totalSalesAmount: 0,
    totalReferredUsers: 0,
    createdAt: updated.createdAt,
    updatedAt: now,
    bankInfo: {
      bankName: updated.dealerDetails?.bankInfo?.bankName || '',
      accountHolder: updated.fullName,
      iban: updated.dealerDetails?.bankInfo?.iban || '',
    },
  };
  await adminSaveReseller(resellerProfile);
  setActiveResellerSession(resellerProfile);

  if (wasPending) {
    markWelcomeBonusClaimed(updated.email, updated.phone, updated.uid);
    await recordCreditTransaction({
      resellerId: updated.uid,
      resellerName: companyName,
      type: 'bonus',
      amount: creditsBalance,
      previousBalance: 0,
      newBalance: creditsBalance,
      description: 'Ödemesi onaylanan yeni bayi için 32+32 hoşgeldin kredisi tanımlandı.',
      performedBy: 'Sistem Ödeme Onayı',
    });
  }

  return updated;
}

function removeFromLocalMembersDirectory(uid: string): void {
  if (typeof window === 'undefined' || !uid) return;
  try {
    const list = getLocalMembersDirectory().filter(m => m.uid !== uid);
    localStorage.setItem(STORAGE_MEMBERS_DIRECTORY_KEY, JSON.stringify(list));
  } catch {
    // non-blocking
  }
}

/**
 * Helper to check local demo blacklist
 */
function getLocalDemoBlacklist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_DEMO_BLACKLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToLocalDemoBlacklist(val: string): void {
  if (typeof window === 'undefined' || !val) return;
  try {
    const list = getLocalDemoBlacklist();
    const clean = val.trim().toLowerCase();
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(STORAGE_DEMO_BLACKLIST_KEY, JSON.stringify(list));
    }
  } catch {
    // non-blocking
  }
}

/**
 * Simple password hashing for member authentication storage
 */
function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'AKN_PWD_' + Math.abs(hash).toString(16);
}

/**
 * Helper to generate a unique member UID
 */
function generateUid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'USR-' + crypto.randomUUID().substring(0, 8).toUpperCase();
  }
  return 'USR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Check if a user's phone, email, or name has already consumed the 30-minute demo
 */
export async function checkIfDemoAlreadyUsed(phone: string, email: string, fullName?: string): Promise<boolean> {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (fullName || '').trim().toLowerCase();

  // 1. Check local device blacklist
  const localList = getLocalDemoBlacklist();
  if (localList.includes(cleanPhone) || localList.includes(cleanEmail) || (cleanName && localList.includes(cleanName))) {
    return true;
  }

  // 2. Check local directory
  const localMembers = getLocalMembersDirectory();
  const foundInLocal = localMembers.find(
    m => (cleanEmail && m.email && m.email.toLowerCase() === cleanEmail) || 
         (cleanPhone && m.phone && m.phone.replace(/[^0-9]/g, '') === cleanPhone)
  );
  if (foundInLocal && foundInLocal.demoUsed) {
    return true;
  }

  // 3. Query Firestore for phone/email match with demoUsed == true
  try {
    const usersCol = collection(db, 'users');
    
    // Check by email
    const qEmail = query(usersCol, where('email', '==', cleanEmail));
    const snapEmail = await getDocs(qEmail);
    for (const docSnap of snapEmail.docs) {
      const data = docSnap.data() as UserMember;
      if (data.demoUsed) return true;
    }

    // Check by phone
    if (cleanPhone) {
      const qPhone = query(usersCol, where('phone', '==', phone.trim()));
      const snapPhone = await getDocs(qPhone);
      for (const docSnap of snapPhone.docs) {
        const data = docSnap.data() as UserMember;
        if (data.demoUsed) return true;
      }
    }
  } catch (err) {
    console.warn('Check demo used warning:', err);
  }

  return false;
}

/**
 * Activates 30-minute Free Demo for a member (strictly 1 time per email/phone/name)
 */
export async function activateDemoSession(
  user: UserMember
): Promise<{ success: boolean; message: string; user?: UserMember }> {
  try {
    // Check if already used
    const alreadyUsed = user.demoUsed || await checkIfDemoAlreadyUsed(user.phone, user.email, user.fullName);
    if (alreadyUsed) {
      return {
        success: false,
        message: 'Bu telefon numarası, e-posta veya isim ile daha önce 30 dakikalık ücretsiz demo kullanılmıştır. Devam etmek için lütfen üyelik paketi satın alınız.'
      };
    }

    // Set expiry 30 minutes from now
    const now = Date.now();
    const expiryMs = now + 30 * 60 * 1000; // 30 minutes
    const expiryDateStr = new Date(expiryMs).toISOString();

    const updatedUser: UserMember = {
      ...user,
      isAllowed: true, // Active for 30 minutes
      expiryDate: expiryDateStr,
      selectedPackage: 'demo-30m',
      demoUsed: true,
      demoUsedAt: new Date().toISOString(),
      paymentStatus: 'DEMO',
    };

    // Save to Local Directory & Session immediately
    saveToLocalMembersDirectory(updatedUser);
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));

    // Save to Firestore with auth verification
    try {
      await ensureFirebaseAuthUser(user.email);
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, updatedUser, { merge: true });
    } catch (fsErr) {
      console.warn('Demo session Firestore sync (cached locally):', fsErr);
    }

    // Add to local blacklist to prevent repeated demo creation
    if (user.phone) addToLocalDemoBlacklist(user.phone.replace(/[^0-9]/g, ''));
    if (user.email) addToLocalDemoBlacklist(user.email.toLowerCase());
    if (user.fullName) addToLocalDemoBlacklist(user.fullName.toLowerCase());

    return {
      success: true,
      message: '30 dakikalık ücretsiz demo hesabınız aktif edildi! Süre başladı, iyi kullanımlar dileriz.',
      user: updatedUser
    };
  } catch (err: any) {
    console.error('Activate demo error:', err);
    return {
      success: false,
      message: err?.message || 'Demo başlatılırken bir hata oluştu.'
    };
  }
}

/**
 * Returns WhatsApp chat link with multi-package CART receipt details (supports both membership and dealer packages)
 */
export function getWhatsAppCartOrderUrl(user: UserMember, cartItems: CartItem[]): string {
  const activeItems = cartItems.filter(item => item.quantity > 0);
  
  let totalPrice = 0;
  const itemsTextList: string[] = [];

  const dealerPackagesFallback = [
    { id: 'bronze-dealer', name: 'Bronz Bayilik Paketi', durationText: '30 Seans Kredisi ($3.33/Seans)', price: 100 },
    { id: 'silver-dealer', name: 'Gümüş Bayilik Paketi', durationText: '100 Seans Kredisi ($2.92/Seans)', price: 292 },
    { id: 'gold-dealer', name: 'Altın Bayilik Paketi', durationText: '300 Seans Kredisi ($2.35/Seans)', price: 704 },
  ];

  const allAvailablePackages = [
    ...MEMBERSHIP_PACKAGES,
    ...dealerPackagesFallback
  ];

  activeItems.forEach(item => {
    const pkg = allAvailablePackages.find(p => p.id === item.packageId);
    if (pkg && !('isDemo' in pkg && pkg.isDemo)) {
      const subtotal = pkg.price * item.quantity;
      totalPrice += subtotal;
      itemsTextList.push(`• ${item.quantity} Adet x ${pkg.name} (${pkg.durationText}) = ${formatUsd(subtotal)}`);
    }
  });

  const cartSummary = itemsTextList.length > 0 
    ? itemsTextList.join('\n') 
    : '• 1 Adet Standart Paket';

  const message = encodeURIComponent(
    `Merhaba AuraBio Destek Ekibi,\n\nAuraBio Frekans sistemi için sepetimdeki paketlerin ödemesini gerçekleştirdim.\n\n🛒 Sepet / Paket Detayları:\n${cartSummary}\n\n💰 Toplam Tutar: ${formatUsd(totalPrice)}\n👤 Ad Soyad: ${user.fullName}\n📧 E-Posta: ${user.email}\n📱 Telefon: ${user.phone}\n🆔 Üye No: ${user.uid}\n\n💳 Ödeme Bilgileri:\nBanka: ${BANK_INFO.bankName}\nAlıcı: ${BANK_INFO.accountHolder}\nIBAN: ${BANK_INFO.iban}\n\nÖdeme dekontumu bu mesaja ek olarak iletiyorum. Lütfen ${user.isDealerRequested ? 'bayilik ve seans kredi havuzumu' : 'üyeliğimi'} onaylayınız.`
  );
  return `https://wa.me/${ADMIN_PHONE_CLEAN}?text=${message}`;
}

/**
 * Single package fallback link
 */
export function getWhatsAppPaymentReceiptUrl(user: UserMember, selectedPkg?: MembershipPackage): string {
  if (!selectedPkg || selectedPkg.isDemo) {
    selectedPkg = MEMBERSHIP_PACKAGES[1];
  }
  return getWhatsAppCartOrderUrl(user, [{ packageId: selectedPkg.id, quantity: 1 }]);
}

export function getWhatsAppMemberApprovalUrl(user: UserMember): string {
  const pkg = MEMBERSHIP_PACKAGES.find(p => p.id === user.selectedPackage) || MEMBERSHIP_PACKAGES[1];
  return getWhatsAppPaymentReceiptUrl(user, pkg);
}

/**
 * WhatsApp instant notification URL for new dealer application (AKN Global Spec)
 */
export function getWhatsAppDealerApplicationUrl(data: {
  fullName: string;
  phone: string;
  email?: string;
  packageName?: string;
  packagePriceText?: string;
  countryCode?: string;
  dealerDetails?: DealerDetails;
}): string {
  const company = data.dealerDetails?.companyName || 'Belirtilmedi';
  const field = data.dealerDetails?.businessField || 'Biyo-Rezonans / Holistik Terapi';
  const phone = data.dealerDetails?.whatsapp || data.phone || 'Belirtilmedi';
  const taxInfo = data.dealerDetails?.taxNumber ? `${data.dealerDetails.taxNumber} (${data.dealerDetails.taxOffice || '-'})` : 'Bireysel / Belirtilmedi';
  const address = data.dealerDetails?.address ? `\nAdres: ${data.dealerDetails.address}` : '';
  const countryCode = (data.countryCode || 'TR').trim().toUpperCase();
  const isInternational = resolveMemberRegion(countryCode) === 'INTERNATIONAL';
  const countryInfo = `\n🌍 Kayıt Ülkesi: ${countryCode}${isInternational ? ' (3x Yurt Dışı)' : ' (Türkiye)'}`;
  const pkgInfo = data.packageName ? `\n🏷️ Seçilen Bayilik Paketi: ${data.packageName} ${data.packagePriceText ? `(${data.packagePriceText})` : ''}` : '';

  const text = `🌟 Yeni Bayilik Başvurusu!\n👤 Ad Soyad: ${data.fullName}${countryInfo}\n🏢 Firma: ${company}\n📱 Telefon: ${phone}\n💼 Faaliyet Alanı: ${field}\n📋 Vergi Bilgisi: ${taxInfo}${address}${pkgInfo}\n\nOnaylamak ve kredi havuzunu aktifleştirmek için Yönetici Paneline Gidin.`;

  return `https://wa.me/${ADMIN_PHONE_CLEAN}?text=${encodeURIComponent(text)}`;
}

/**
 * Register a new member (with optional dealer application & affiliate / reseller connection)
 */
export async function registerMember(
  fullName: string,
  email: string,
  phone: string,
  password: string,
  selectedPackage: string = '3-months',
  resellerId?: string,
  referredByCode?: string,
  dealerApplicationData?: DealerDetails,
  countryCode: string = 'TR'
): Promise<{ success: boolean; message: string; user?: UserMember; whatsappDealerUrl?: string; pendingPayment?: boolean }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanCountryCode = (countryCode || 'TR').trim().toUpperCase();

    if (!cleanEmail || !cleanFullName || !cleanPhone || !password) {
      return { success: false, message: 'Lütfen tüm alanları doldurunuz.' };
    }

    if (password.length < 4) {
      return { success: false, message: 'Şifre en az 4 karakter olmalıdır.' };
    }

    // If registering with admin email -> automatically elevate to Admin
    if (ADMIN_EMAILS.includes(cleanEmail) && (await loginAdmin(cleanEmail, password))) {
      const adminCode = 'AURA-BAYI-AKN01';
      const adminUser: UserMember = {
        uid: 'ADMIN-AKN-01',
        email: cleanEmail,
        fullName: cleanFullName || 'Sistem Yöneticisi (AuraBio Admin)',
        phone: cleanPhone || ADMIN_PHONE,
        isAllowed: true,
        expiryDate: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'admin',
        referralCode: adminCode,
        dealerStatus: 'approved',
        isDealerRequested: true,
        dealerDetails: {
          companyName: 'Psikoloji Danışmanlık & Biyo-Frekans Merkezi (Merkez Bayi)',
          phone: cleanPhone || ADMIN_PHONE,
          whatsapp: cleanPhone || ADMIN_PHONE,
          businessField: 'Psikoloji & Biyo-Rezonans Merkezi',
          taxNumber: 'MERKEZ-01',
          taxOffice: 'Bursa / Nilüfer',
          referralCode: adminCode,
          commissionRate: 30,
          creditsBalance: 9999,
          appliedAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
        }
      };
      saveToLocalMembersDirectory(adminUser);
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(adminUser));
      return { success: true, message: 'Yönetici hesabı başarıyla açıldı!', user: adminUser };
    }

    // Check if email already exists in local directory
    const localDirectory = getLocalMembersDirectory();
    if (localDirectory.some(m => m.email && m.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Bu e-posta adresi ile zaten kayıtlı bir üye bulunmaktadır.' };
    }

    // Check if demo was previously used by this phone or email
    const wasDemoUsed = await checkIfDemoAlreadyUsed(cleanPhone, cleanEmail, cleanFullName);

    const uid = generateUid();
    const isDealer = true; // In the unified dealer architecture, all registrations are Dealer registrations
    const isPendingDealerRegistration = Boolean(dealerApplicationData);

    const {
      generateUniqueReferralCode,
      adminSaveReseller,
      setActiveResellerSession,
      WELCOME_BONUS_TOTAL_CREDITS,
      hasClaimedWelcomeBonus,
      markWelcomeBonusClaimed,
      recordCreditTransaction,
      DEFAULT_DEALER_PACKAGES,
    } = await import('./resellerManager');
    const personalReferralCode = dealerApplicationData?.referralCode?.trim().toUpperCase() || generateUniqueReferralCode('AURA-BAYI');

    // İLK BAYİ KAYDI SİSTEME HOŞGELDİN BONUSU (BİR DEFAYA MAHSUS OTOMATİK 32 + 32 = 64 SEANS KREDİSİ)
    const alreadyClaimedBonus = hasClaimedWelcomeBonus(cleanEmail, cleanPhone, uid);
    const initialCredits = !alreadyClaimedBonus ? WELCOME_BONUS_TOTAL_CREDITS : 0; // 32 + 32 = 64 Kredi
    const effectiveStarterPkg = selectedPackage || 'pkg-5k';
    const nowIso = new Date().toISOString();

    const companyName = dealerApplicationData?.companyName?.trim() || cleanFullName + ' Frekans & Biyo-Rezonans';

    const completeDealerDetails: DealerDetails = {
      companyName,
      taxNumber: dealerApplicationData?.taxNumber?.trim() || 'Belirtilmedi',
      taxOffice: dealerApplicationData?.taxOffice?.trim() || 'Belirtilmedi',
      businessField: dealerApplicationData?.businessField || 'Biyo-Rezonans & Frekans Merkezi',
      phone: cleanPhone,
      whatsapp: dealerApplicationData?.whatsapp?.trim() || cleanPhone,
      address: dealerApplicationData?.address?.trim() || '',
      notes:
        dealerApplicationData?.notes?.trim() ||
        'İlk bayi kaydı — Bir defaya mahsus 32+32 (64) Hoşgeldin Bonusu Kredisi otomatik tanımlandı.',
      referralCode: personalReferralCode,
      commissionRate: 20,
      creditsBalance: isPendingDealerRegistration ? 0 : initialCredits,
      appliedAt: nowIso,
      approvedAt: isPendingDealerRegistration ? undefined : nowIso,
    };

    const newUser: UserMember = {
      uid,
      email: cleanEmail,
      fullName: cleanFullName,
      phone: cleanPhone,
      passwordHash: hashPassword(password),
      isAllowed: !isPendingDealerRegistration,
      isApproved: !isPendingDealerRegistration,
      expiryDate: null,
      selectedPackage: effectiveStarterPkg,
      dealerPackageId: 'pkg-5k',
      creditsBalance: isPendingDealerRegistration ? 0 : initialCredits,
      welcomeBonusGranted: !isPendingDealerRegistration && !alreadyClaimedBonus,
      welcomeBonusCredits: isPendingDealerRegistration ? 0 : initialCredits,
      welcomeBonusBreakdown: isPendingDealerRegistration ? undefined : '32+32',
      welcomeBonusGrantedAt: isPendingDealerRegistration ? undefined : nowIso,
      cart: [{ packageId: effectiveStarterPkg, quantity: 1 }],
      paymentStatus: isPendingDealerRegistration ? 'PENDING' : 'PAID',
      demoUsed: wasDemoUsed,
      resellerId: resellerId || '',
      referredByCode: referredByCode || '',
      referralCode: personalReferralCode,
      country_code: cleanCountryCode,
      createdAt: nowIso,
      lastLoginAt: nowIso,
      role: 'dealer', // Unified B2B Dealer Role
      isDealerRequested: true,
      dealerStatus: isPendingDealerRegistration ? 'pending' : 'approved',
      dealerDetails: completeDealerDetails
    };

    if (!alreadyClaimedBonus && !isPendingDealerRegistration) {
      markWelcomeBonusClaimed(cleanEmail, cleanPhone, uid);
    }

    // 1. Save to local persistent storage immediately
    saveToLocalMembersDirectory(newUser);
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newUser));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: newUser }));
    }
    // 2. Create the reseller profile only after the initial payment is confirmed

    if (!isPendingDealerRegistration) try {
      const resellerProfile = {
        uid,
        email: cleanEmail,
        fullName: cleanFullName,
        phone: cleanPhone,
        whatsapp: completeDealerDetails.whatsapp,
        resellerName: companyName,
        businessName: companyName,
        referralCode: personalReferralCode,
        referredByCode: referredByCode || '',
        resellerId: resellerId || '',
        sponsorId: resellerId || '',
        taxNumber: completeDealerDetails.taxNumber,
        taxOffice: completeDealerDetails.taxOffice,
        commissionRate: 20,
        creditsBalance: initialCredits,
        dealerPackageId: effectiveStarterPkg,
        welcomeBonusGranted: !alreadyClaimedBonus,
        welcomeBonusCredits: initialCredits,
        welcomeBonusBreakdown: '32+32',
        welcomeBonusGrantedAt: nowIso,
        status: 'active' as const,
        joinedAt: nowIso,
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        clientsCount: 0,
        salesCount: 0,
        totalSalesAmount: 0,
        totalReferredUsers: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
        bankInfo: {
          bankName: '',
          accountHolder: cleanFullName,
          iban: ''
        }
      };
      await adminSaveReseller(resellerProfile);
      setActiveResellerSession(resellerProfile);

      if (initialCredits > 0) {
        await recordCreditTransaction({
          resellerId: uid,
          resellerName: companyName,
          type: 'bonus',
          amount: initialCredits,
          previousBalance: 0,
          newBalance: initialCredits,
          description: `🎁 İlk Bayi Kaydı Sisteme Hoşgeldin Bonusu (Bir Defaya Mahsus 32+32 = ${initialCredits} Seans Kredisi Otomatik Tanımlandı)`,
          performedBy: 'Sistem Otomatik Hoşgeldin Bonusu',
        });
      }
    } catch (resellerSyncErr) {
      console.debug('Auto-create reseller profile notice:', resellerSyncErr);
    }

    // 3. Ensure Firebase Auth token is active and sync to Firestore
    try {
      await ensureFirebaseAuthUser(cleanEmail, password);
      
      // Check Firestore uniqueness if online & permitted
      try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('email', '==', cleanEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return { success: false, message: 'Bu e-posta adresi ile zaten kayıtlı bir bayi bulunmaktadır.' };
        }
      } catch (checkErr) {
        console.debug('Firestore duplicate check notice:', checkErr);
      }

      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, newUser);
    } catch (firestoreSyncErr) {
      console.warn('Firestore sync notice (member stored securely in local app registry):', firestoreSyncErr);
    }

    // 4. Immediately attribute and increment referral statistics for the referring Reseller / Dealer
    if (!isPendingDealerRegistration && (resellerId || referredByCode)) {
      try {
        const { recordNewUserReferral } = await import('./resellerManager');
        await recordNewUserReferral(resellerId, referredByCode, newUser);
      } catch (refRecordErr) {
        console.debug('Record referral attribution notice:', refRecordErr);
      }
    }

    const chosenDealerPkg = DEFAULT_DEALER_PACKAGES.find((pkg) => pkg.id === effectiveStarterPkg);
    const regionalPackagePrice = chosenDealerPkg
      ? getPackagePriceForRegion(chosenDealerPkg.price, resolveMemberRegion(cleanCountryCode))
      : undefined;

    const whatsappDealerUrl = getWhatsAppDealerApplicationUrl({
      fullName: cleanFullName,
      phone: cleanPhone,
      email: cleanEmail,
      packageName: chosenDealerPkg?.name || selectedPackage,
      packagePriceText: regionalPackagePrice === undefined ? undefined : formatUsd(regionalPackagePrice),
      countryCode: cleanCountryCode,
      dealerDetails: completeDealerDetails
    });

    // 5. Sync new registration & package order with Monoline 7 Nefis MLM & Commission Engine
    try {
      const m = await import('./monolineSyncBridge');
      const monolinePkgId = m.mapFrekansPkgToMonolinePkgId(effectiveStarterPkg);
      const memberResponse = await fetch('/api/v1/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid,
          full_name: companyName || cleanFullName,
          city: completeDealerDetails.address || completeDealerDetails.taxOffice || 'İstanbul',
          email: cleanEmail,
          phone: cleanPhone,
          ref_code: personalReferralCode,
          country_code: cleanCountryCode,
          sponsor_id: resellerId || '',
          initial_package_id: monolinePkgId,
          password,
          assigned_leg: dealerApplicationData?.assignedLeg || 'AUTO',
          pending_payment: isPendingDealerRegistration,
        }),
      });
      if (!memberResponse.ok && isPendingDealerRegistration) {
        const error = await memberResponse.json().catch(() => ({}));
        throw new Error(error?.message || 'Bayi hesabı ödeme için hazırlanamıyor.');
      }
      if (memberResponse.ok && !isPendingDealerRegistration) {
        await requestMemberWalletToken(cleanEmail, password);
      }

      if (!isPendingDealerRegistration) {
        m.syncFrekansWithMonolineEngine().then(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
          }
        }).catch(() => {});
      }
    } catch (err) {
      if (isPendingDealerRegistration) throw err;
    }

    return {
      success: true,
      message: isPendingDealerRegistration
        ? `${companyName} bayi kaydınız alındı. Hesabınız ödeme bekliyor; sandbox sanal kart ödemesi tamamlanınca 32+32 toplam 64 kredi tanımlanacak.`
        : `Tebrikler! ${companyName} yetkili bayilik hesabınız başarıyla oluşturuldu. Sisteme Hoşgeldin Bonusu olarak bir defaya mahsus 32+32 (Toplam ${initialCredits}) Seans Kredisi hesabınıza otomatik tanımlandı!`,
      user: newUser,
      whatsappDealerUrl,
      pendingPayment: isPendingDealerRegistration,
    };
  } catch (err: any) {
    console.error('Member registration error:', err);
    return { success: false, message: err?.message || 'Üyelik oluşturulurken bir hata meydana geldi.' };
  }
}

/**
 * Apply for dealership from active member account
 */
export async function applyForDealership(
  uid: string,
  dealerData: DealerDetails
): Promise<{ success: boolean; message: string; user?: UserMember; whatsappDealerUrl?: string }> {
  try {
    const localList = getLocalMembersDirectory();
    let user = localList.find(m => m.uid === uid) || getActiveMemberSession();
    if (!user || user.uid !== uid) {
      user = await fetchMemberProfile(uid);
    }
    if (!user) {
      return { success: false, message: 'Kullanıcı hesabı bulunamadı.' };
    }

    const updatedUser: UserMember = {
      ...user,
      isDealerRequested: true,
      dealerStatus: 'pending',
      dealerDetails: {
        ...dealerData,
        appliedAt: new Date().toISOString(),
      },
    };

    saveToLocalMembersDirectory(updatedUser);
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
    window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updatedUser }));

    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(
        docRef,
        {
          isDealerRequested: true,
          dealerStatus: 'pending',
          dealerDetails: updatedUser.dealerDetails,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('Dealer application Firestore notice:', fsErr);
    }

    const whatsappDealerUrl = getWhatsAppDealerApplicationUrl({
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      dealerDetails: updatedUser.dealerDetails
    });

    return {
      success: true,
      message: 'Bayilik başvurunuz başarıyla alındı! Yönetici onayından sonra Bayi Panelinize tam yetkiyle erişebileceksiniz.',
      user: updatedUser,
      whatsappDealerUrl
    };
  } catch (err: any) {
    console.error('Apply for dealership error:', err);
    return { success: false, message: err?.message || 'Başvuru gönderilirken bir hata oluştu.' };
  }
}

/**
 * Admin: Approve dealer application and grant 'dealer' role
 */
export async function adminApproveDealer(
  uid: string,
  referralCode?: string,
  commissionRate: number = 20
): Promise<{ success: boolean; message: string; user?: UserMember }> {
  try {
    const localList = getLocalMembersDirectory();
    let user = localList.find(m => m.uid === uid) || getActiveMemberSession();
    if (!user || user.uid !== uid) {
      user = await fetchMemberProfile(uid);
    }
    if (!user) {
      return { success: false, message: 'Kullanıcı hesabı bulunamadı.' };
    }

    const { generateUniqueReferralCode } = await import('./resellerManager');
    const code = referralCode || user.dealerDetails?.referralCode || generateUniqueReferralCode('AURA-BAYI');

    const updatedUser: UserMember = {
      ...user,
      role: 'dealer',
      dealerStatus: 'approved',
      isDealerRequested: true,
      isAllowed: true, // Grant access
      referralCode: code,
      dealerDetails: {
        ...(user.dealerDetails || {
          companyName: user.fullName,
          phone: user.phone,
          whatsapp: user.phone,
          businessField: 'Biyo-Rezonans & Frekans Kliniği',
          taxNumber: 'Belirtilmedi',
          taxOffice: 'Belirtilmedi',
          address: '',
          notes: ''
        }),
        referralCode: code,
        commissionRate,
        approvedAt: new Date().toISOString(),
        creditsBalance: user.creditsBalance !== undefined ? user.creditsBalance : 100
      }
    };

    saveToLocalMembersDirectory(updatedUser);
    const active = getActiveMemberSession();
    if (active && active.uid === uid) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updatedUser }));
    }

    // Sync to Firestore
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(
        docRef,
        {
          role: 'dealer',
          dealerStatus: 'approved',
          isDealerRequested: true,
          isAllowed: true,
          dealerDetails: updatedUser.dealerDetails,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('Admin approve dealer Firestore notice:', fsErr);
    }

    // Auto-create / register Reseller profile in resellerManager
    try {
      const { registerNewReseller } = await import('./resellerManager');
      await registerNewReseller({
        resellerName: user.dealerDetails?.companyName || user.fullName,
        email: user.email,
        phone: user.dealerDetails?.whatsapp || user.phone,
        customReferralCode: code,
        commissionRate,
        notes: `AKN Bayilik Onaylandı. Faaliyet: ${user.dealerDetails?.businessField || 'Genel'}`,
        bankInfo: {
          bankName: 'Belirtilmedi',
          accountHolder: user.dealerDetails?.companyName || user.fullName,
          iban: 'TR',
        }
      });
    } catch (rErr) {
      console.warn('Reseller sync notice:', rErr);
    }

    return {
      success: true,
      message: `${user.fullName} bayilik başvurusu onaylandı ve Bayi yetkisi verildi.`,
      user: updatedUser
    };
  } catch (err: any) {
    console.error('Admin approve dealer error:', err);
    return { success: false, message: err?.message || 'Bayi onaylanırken hata oluştu.' };
  }
}

/**
 * Admin: Create Dealer Account Directly (Manual Admin Dealer Creation with Firebase Auth & Credits Pool)
 */
export async function adminCreateDealerDirectly(data: {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  companyName: string;
  taxNumber?: string;
  taxOffice?: string;
  businessField?: string;
  initialCredits?: number;
  customReferralCode?: string;
  commissionRate?: number;
  dealerPackageId?: string;
  notes?: string;
  sponsorId?: string;
  assignedLeg?: 'LEFT' | 'RIGHT' | 'AUTO';
}): Promise<{ success: boolean; message: string; user?: UserMember; referralCode?: string }> {
  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanFullName = data.fullName.trim();
    const cleanPhone = data.phone.trim();
    const cleanCompany = data.companyName.trim();
    const cleanPassword = data.password.trim();

    if (!cleanEmail || !cleanFullName || !cleanPhone || !cleanCompany || !cleanPassword) {
      return { success: false, message: 'Lütfen Ad Soyad, E-posta, Şifre, Telefon ve Firma Adı alanlarını doldurunuz.' };
    }

    if (cleanPassword.length < 4) {
      return { success: false, message: 'Şifre en az 4 karakter olmalıdır.' };
    }

    const localList = getLocalMembersDirectory();
    if (localList.some(m => m.email && m.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcuttur.' };
    }

    const uid = generateUid();
    const initialCredits = Number(data.initialCredits) || 64; // Varsayılan: 32+32 = 64 Hoşgeldin Bonusu Kredisi
    const { generateUniqueReferralCode } = await import('./resellerManager');
    const referralCode = (data.customReferralCode || '').trim().toUpperCase() || generateUniqueReferralCode('AURA-BAYI');
    const commissionRate = data.commissionRate !== undefined ? Number(data.commissionRate) : 20;

    const newDealerUser: UserMember = {
      uid,
      email: cleanEmail,
      fullName: cleanFullName,
      phone: cleanPhone,
      passwordHash: hashPassword(cleanPassword),
      isAllowed: true, // Directly approved by admin
      isApproved: true,
      expiryDate: null, // Unlimited access
      selectedPackage: data.dealerPackageId || 'pkg-5k',
      paymentStatus: 'PAID',
      role: 'dealer',
      dealerStatus: 'approved',
      isDealerRequested: true,
      referralCode,
      creditsBalance: initialCredits,
      welcomeBonusGranted: true,
      welcomeBonusCredits: 64,
      welcomeBonusBreakdown: '32+32',
      welcomeBonusGrantedAt: new Date().toISOString(),
      dealerPackageId: data.dealerPackageId || 'pkg-5k',
      dealerDetails: {
        companyName: cleanCompany,
        taxNumber: data.taxNumber || '',
        taxOffice: data.taxOffice || '',
        businessField: data.businessField || 'Biyo-Rezonans & Frekans Kliniği',
        whatsapp: cleanPhone,
        referralCode,
        commissionRate,
        creditsBalance: initialCredits,
        dealerPackageId: data.dealerPackageId || 'silver-dealer',
        appliedAt: new Date().toISOString(),
        notes: data.notes || 'Yönetici tarafından doğrudan tanımlandı.',
      },
      resellerId: uid,
      referredByCode: referralCode,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      notes: data.notes || 'Yönetici tarafından doğrudan oluşturulmuş onaylı bayi hesabı.',
    };

    // Save to Local Directory
    saveToLocalMembersDirectory(newDealerUser);

    // Save to Firestore & Firebase Auth
    try {
      await ensureFirebaseAuthUser(cleanEmail, cleanPassword);
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, {
        ...newDealerUser,
        uid,
        email: cleanEmail,
        full_name: cleanFullName,
        fullName: cleanFullName,
        phone: cleanPhone,
        city: data.taxOffice || 'Türkiye',
        country_code: 'TR',
        ref_code: referralCode,
        referralCode: referralCode,
        sponsor_id: data.sponsorId || 'USR-ADMIN',
        role: 'dealer',
        dealerStatus: 'approved',
        isDealerRequested: true,
        created_at: newDealerUser.createdAt,
      }, { merge: true });

      const walletRef = doc(db, 'wallets', uid);
      await setDoc(walletRef, {
        userId: uid,
        balance: 0,
        total_earned: 0,
        updated_at: new Date().toISOString(),
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin create dealer Firestore notice:', fsErr);
    }

    // Register into Reseller Directory
    try {
      const { registerNewReseller } = await import('./resellerManager');
      await registerNewReseller({
        customUid: uid,
        resellerName: cleanCompany || cleanFullName,
        email: cleanEmail,
        phone: cleanPhone,
        customReferralCode: referralCode,
        sponsorId: data.sponsorId || 'USR-ADMIN',
        keepCurrentSession: true,
        commissionRate,
        initialCredits,
        notes: `Yönetici tarafından oluşturuldu. Hoşgeldin Bonusu Kredisi: ${initialCredits} (32+32)`,
        bankInfo: {
          bankName: data.taxOffice || 'Belirtilmedi',
          accountHolder: cleanCompany || cleanFullName,
          iban: 'TR',
        }
      });

      // Register into Monoline Server & Firestore
      try {
        const { getAdminToken } = await import('./adminSession');
        const adminToken = getAdminToken();
        await fetch('/api/v1/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
          },
          body: JSON.stringify({
            user_id: uid,
            full_name: cleanFullName,
            email: cleanEmail,
            phone: cleanPhone,
            ref_code: referralCode,
            sponsor_id: data.sponsorId || 'USR-ADMIN',
            password: cleanPassword,
            skip_initial_order: true,
            session_credits: initialCredits,
            company_title: cleanCompany,
            tax_id: data.taxNumber,
            tax_office: data.taxOffice,
            has_tax_company: Boolean(data.taxNumber),
            assigned_leg: data.assignedLeg === 'RIGHT' ? 'RIGHT' : 'LEFT',
          }),
        });
      } catch (srvRegErr) {
        console.warn('Backend dealer registration notice:', srvRegErr);
      }

      const { syncFrekansWithMonolineEngine } = await import('./monolineSyncBridge');
      await syncFrekansWithMonolineEngine();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
      }
    } catch (rErr) {
      console.warn('Reseller directory sync notice:', rErr);
    }

    return {
      success: true,
      message: `Bayi hesabı başarıyla oluşturuldu! Belirlenen şifre ile anında giriş yapabilir. Kredi Havuzu: ${initialCredits} Seans, Referans Kodu: ${referralCode}`,
      user: newDealerUser,
      referralCode
    };
  } catch (err: any) {
    console.error('Admin create dealer error:', err);
    return { success: false, message: err?.message || 'Bayi hesabı oluşturulurken bir hata meydana geldi.' };
  }
}

/**
 * Admin: Reject dealer application
 */
export async function adminRejectDealer(
  uid: string,
  reason?: string
): Promise<{ success: boolean; message: string; user?: UserMember }> {
  try {
    const localList = getLocalMembersDirectory();
    let user = localList.find(m => m.uid === uid) || getActiveMemberSession();
    if (!user || user.uid !== uid) {
      user = await fetchMemberProfile(uid);
    }
    if (!user) {
      return { success: false, message: 'Kullanıcı hesabı bulunamadı.' };
    }

    const updatedUser: UserMember = {
      ...user,
      dealerStatus: 'rejected',
      notes: reason ? `${user.notes || ''} [Bayilik Red: ${reason}]` : user.notes,
    };

    saveToLocalMembersDirectory(updatedUser);
    const active = getActiveMemberSession();
    if (active && active.uid === uid) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updatedUser }));
    }

    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(
        docRef,
        {
          dealerStatus: 'rejected',
          notes: updatedUser.notes,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('Admin reject dealer Firestore notice:', fsErr);
    }

    return {
      success: true,
      message: `${user.fullName} bayilik başvurusu reddedildi.`,
      user: updatedUser
    };
  } catch (err: any) {
    console.error('Admin reject dealer error:', err);
    return { success: false, message: err?.message || 'İşlem başarısız.' };
  }
}

/**
 * Update member's cart
 */
export async function updateMemberCart(uid: string, cart: CartItem[]): Promise<boolean> {
  try {
    const current = getActiveMemberSession();
    if (current && current.uid === uid) {
      current.cart = cart;
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(current));
      saveToLocalMembersDirectory(current);
    }
    
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { cart });
    } catch (fsErr) {
      console.debug('Update cart Firestore sync notice:', fsErr);
    }
    
    return true;
  } catch (err) {
    console.warn('Update cart warning:', err);
    return false;
  }
}

export interface MemberOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  packageId?: string;
  packageName: string;
  durationText: string;
  amount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REJECTED' | 'DEMO';
  date: string;
  referenceNumber?: string;
  paymentMethod?: string;
  notes?: string;
  items?: { packageId: string; name: string; quantity: number; price: number }[];
}

const STORAGE_ORDERS_KEY = 'aurabio_member_orders_history_v1';

/**
 * Update member's chosen package
 */
export async function updateMemberSelectedPackage(uid: string, packageId: string): Promise<boolean> {
  try {
    const current = getActiveMemberSession();
    if (current && current.uid === uid) {
      current.selectedPackage = packageId;
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(current));
      saveToLocalMembersDirectory(current);
    }
    
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { selectedPackage: packageId });
    } catch (fsErr) {
      console.debug('Update selected package Firestore sync notice:', fsErr);
    }
    
    return true;
  } catch (err) {
    console.warn('Update selected package warning:', err);
    return false;
  }
}

/**
 * Update Member Profile information (Name, Email, Phone, Password)
 */
export async function updateMemberProfile(
  uid: string,
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    newPassword?: string;
  }
): Promise<{ success: boolean; message: string; user?: UserMember }> {
  try {
    const localList = getLocalMembersDirectory();
    let user = localList.find(m => m.uid === uid) || getActiveMemberSession();

    if (!user || user.uid !== uid) {
      // Try to fetch from firestore if not in local
      user = await fetchMemberProfile(uid);
    }

    if (!user) {
      return { success: false, message: 'Kullanıcı hesabı bulunamadı.' };
    }

    const cleanFullName = data.fullName !== undefined ? data.fullName.trim() : user.fullName;
    const cleanEmail = data.email !== undefined ? data.email.trim().toLowerCase() : user.email;
    const cleanPhone = data.phone !== undefined ? data.phone.trim() : user.phone;

    if (!cleanFullName || !cleanEmail || !cleanPhone) {
      return { success: false, message: 'Ad Soyad, E-posta ve Telefon alanları boş bırakılamaz.' };
    }

    // Check if new email conflicts with another user
    if (cleanEmail !== user.email) {
      const conflict = localList.find(m => m.uid !== uid && m.email && m.email.toLowerCase() === cleanEmail);
      if (conflict) {
        return { success: false, message: 'Bu e-posta adresi başka bir üye tarafından kullanılmaktadır.' };
      }
    }

    const updatedUser: UserMember = {
      ...user,
      fullName: cleanFullName,
      email: cleanEmail,
      phone: cleanPhone,
    };

    if (data.newPassword && data.newPassword.trim().length >= 4) {
      updatedUser.passwordHash = hashPassword(data.newPassword.trim());
    }

    // Save to Local directory & active session
    saveToLocalMembersDirectory(updatedUser);
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
    window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updatedUser }));

    // Sync to Firestore
    try {
      const docRef = doc(db, 'users', uid);
      const updatePayload: Record<string, any> = {
        fullName: cleanFullName,
        email: cleanEmail,
        phone: cleanPhone,
        updatedAt: new Date().toISOString(),
      };
      if (updatedUser.passwordHash) {
        updatePayload.passwordHash = updatedUser.passwordHash;
      }
      await setDoc(docRef, updatePayload, { merge: true });
    } catch (fsErr) {
      console.warn('Profile Firestore update notice:', fsErr);
    }

    return {
      success: true,
      message: 'Profil ve hesap bilgileriniz başarıyla güncellendi.',
      user: updatedUser,
    };
  } catch (err: any) {
    console.error('Update profile error:', err);
    return {
      success: false,
      message: err?.message || 'Profil güncellenirken bir hata meydana geldi.',
    };
  }
}

/**
 * Record a member order/transaction to LocalStorage and Firestore
 */
export async function recordMemberOrder(order: MemberOrder, user?: UserMember): Promise<boolean> {
  try {
    // 1. Save to LocalStorage
    let orders: MemberOrder[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
      orders = raw ? JSON.parse(raw) : [];
    } catch {
      orders = [];
    }

    const updated = [order, ...orders.filter(o => o.id !== order.id)].slice(0, 100);
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('aurabio_orders_updated'));

    // 2. Save to Firestore collection 'orders'
    try {
      const docRef = doc(db, 'orders', order.id);
      await setDoc(docRef, { ...order, syncedAt: new Date().toISOString() }, { merge: true });
    } catch (fsErr) {
      console.debug('Firestore order record notice:', fsErr);
    }

    // 3. Trigger Affiliate Commission Record & Monoline 7 Nefis MLM Engine Sync
    try {
      const activeUser = user || getActiveMemberSession();
      if (activeUser && order.amount > 0 && order.paymentStatus !== 'DEMO') {
        import('./resellerManager').then(m => {
          m.recordCommissionForOrder(order, activeUser);
        }).catch(() => {});
        import('./monolineSyncBridge').then(m => {
          m.syncFrekansWithMonolineEngine().then(() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
            }
          });
        }).catch(() => {});
      }
    } catch {
      // non-blocking
    }

    return true;
  } catch (err) {
    console.warn('Record order error:', err);
    return false;
  }
}

/**
 * Retrieve past orders/purchases for a member
 */
export async function getMemberOrders(uid: string): Promise<MemberOrder[]> {
  const localOrders: MemberOrder[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (raw) {
      const parsed: MemberOrder[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localOrders.push(...parsed.filter(o => o.userId === uid || (o.userEmail && uid.includes(o.userEmail))));
      }
    }
  } catch {
    // non-blocking
  }

  // Also query Firestore collection 'orders'
  try {
    const colRef = collection(db, 'orders');
    const q = query(colRef, where('userId', '==', uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const map = new Map<string, MemberOrder>();
      snap.forEach(d => {
        const item = d.data() as MemberOrder;
        if (item.id) map.set(item.id, item);
      });
      localOrders.forEach(o => map.set(o.id, o));
      const merged = Array.from(map.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (fsErr) {
    console.debug('Firestore getMemberOrders notice:', fsErr);
  }

  return localOrders.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
}

/**
 * Login existing member or administrator
 */
export async function loginMember(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: UserMember }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, message: 'E-posta ve şifre giriniz.' };
    }

    // 1. Direct Admin Login Check (admin email / password)
    if (ADMIN_EMAILS.includes(cleanEmail)) {
      const adminLogin = await loginAdminWithMessage(cleanEmail, cleanPassword);
      if (!adminLogin.success) {
        return {
          success: false,
          message: adminLogin.message || 'Yönetici girişi başarısız oldu.',
        };
      }
      const adminCode = 'AURA-BAYI-AKN01';
      const adminUser: UserMember = {
        uid: 'ADMIN-AKN-01',
        email: cleanEmail,
        fullName: 'Sistem Yöneticisi (AuraBio Admin)',
        phone: ADMIN_PHONE,
        isAllowed: true,
        isApproved: true,
        expiryDate: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'admin',
        referralCode: adminCode,
        isDealerRequested: true,
        dealerStatus: 'approved',
        creditsBalance: 9999,
        dealerDetails: {
          companyName: 'Psikoloji Danışmanlık & Biyo-Frekans Merkezi (Merkez Bayi)',
          phone: ADMIN_PHONE,
          whatsapp: ADMIN_PHONE,
          businessField: 'Psikoloji & Biyo-Rezonans Merkezi',
          taxNumber: 'MERKEZ-01',
          taxOffice: 'Bursa / Nilüfer',
          referralCode: adminCode,
          commissionRate: 30,
          creditsBalance: 9999,
          appliedAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
        }
      };
      saveToLocalMembersDirectory(adminUser);
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(adminUser));

      // Activate Master Dealer session for Admin
      try {
        const { setActiveResellerSession, adminSaveReseller } = await import('./resellerManager');
        const adminNowIso = new Date().toISOString();
        const adminReseller = {
          uid: 'ADMIN-AKN-01',
          email: cleanEmail,
          fullName: 'Sistem Yöneticisi (AuraBio Admin)',
          phone: ADMIN_PHONE,
          whatsapp: ADMIN_PHONE,
          resellerName: 'AuraBio Merkez Bayilik & Yönetim',
          businessName: 'AuraBio Merkez Bayilik & Yönetim',
          referralCode: adminCode,
          taxNumber: 'MERKEZ-01',
          taxOffice: 'Bursa / Nilüfer',
          commissionRate: 30,
          creditsBalance: 9999,
          status: 'active' as const,
          joinedAt: adminNowIso,
          totalEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          clientsCount: 0,
          salesCount: 0,
          totalSalesAmount: 0,
          totalReferredUsers: 0,
          createdAt: adminNowIso,
          updatedAt: adminNowIso,
          bankInfo: {
            bankName: BANK_INFO.bankName,
            accountHolder: BANK_INFO.accountHolder,
            iban: BANK_INFO.iban
          }
        };
        await adminSaveReseller(adminReseller);
        setActiveResellerSession(adminReseller);
      } catch (adminResErr) {
        console.debug('Admin master reseller session notice:', adminResErr);
      }

      return { success: true, message: 'Yönetici & Bayi Yetkili girişi başarılı!', user: adminUser };
    }

    // 2. Try Firestore lookup with auth assurance
    let userData: UserMember | null = null;
    try {
      await ensureFirebaseAuthUser(cleanEmail, cleanPassword);
      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('email', '==', cleanEmail));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const userDoc = snap.docs[0];
        // Firestore document data may not contain uid in legacy records; the document ID is authoritative.
        userData = { ...userDoc.data(), uid: userDoc.id } as UserMember;
      }
    } catch (fsErr) {
      console.debug('Firestore lookup notice:', fsErr);
    }

    // 3. Fallback to local members directory if Firestore unavailable
    if (!userData) {
      const localList = getLocalMembersDirectory();
      const localMatch = localList.find(m => m.email && m.email.toLowerCase() === cleanEmail);
      if (localMatch) {
        userData = localMatch;
      }
    }

    // 4. Fallback to server session /api/v1/member/session if not in local directory or Firestore
    if (!userData) {
      try {
        const srvRes = await fetch('/api/v1/member/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        });
        if (srvRes.ok) {
          const srvData = await srvRes.json();
          if (srvData.status === 'success' && srvData.member) {
            const m = srvData.member;
            userData = {
              uid: m.user_id,
              email: m.email || cleanEmail,
              fullName: m.full_name,
              phone: m.phone || '',
              passwordHash: hashPassword(cleanPassword),
              isAllowed: true,
              isApproved: true,
              expiryDate: null,
              role: 'dealer',
              dealerStatus: 'approved',
              isDealerRequested: true,
              referralCode: m.ref_code,
              creditsBalance: typeof m.session_credits === 'number' ? m.session_credits : 64,
              referredByCode: m.sponsor_id || undefined,
              dealerPackageId: 'silver-dealer',
              createdAt: m.joined_at || new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              dealerDetails: {
                companyName: m.full_name,
                taxNumber: '',
                taxOffice: '',
                businessField: 'Biyo-Rezonans & Holistik Terapi',
                whatsapp: m.phone || '',
                referralCode: m.ref_code,
                commissionRate: 20,
                creditsBalance: typeof m.session_credits === 'number' ? m.session_credits : 64,
                dealerPackageId: 'silver-dealer',
                appliedAt: m.joined_at || new Date().toISOString(),
                bankInfo: {
                  bankName: m.bank_details?.bank_name || 'Ziraat Bankası',
                  accountHolder: m.bank_details?.iban_holder_name || m.full_name,
                  iban: m.bank_details?.iban || '',
                },
              },
            };
            if (srvData.token) {
              sessionStorage.setItem('aurabio_member_wallet_token_v1', srvData.token);
              localStorage.setItem('aurabio_member_wallet_token_v1', srvData.token);
            }
          }
        }
      } catch (srvLoginErr) {
        console.debug('Login server fallback notice:', srvLoginErr);
      }
    }

    if (!userData) {
      return { success: false, message: 'Bu e-posta adresine ait kayıt bulunamadı.' };
    }

    // Verify password
    if (userData.passwordHash && userData.passwordHash !== hashPassword(cleanPassword)) {
      return { success: false, message: 'Hatalı şifre girdiniz. Lütfen tekrar deneyin.' };
    }

    // Ensure dealer role and permissions
    if (userData.role !== 'admin') {
      userData.role = 'dealer';
      userData.isDealerRequested = true;
      userData.dealerStatus = 'approved';
      userData.isAllowed = true;
      if (typeof userData.creditsBalance !== 'number') {
        userData.creditsBalance = 100;
      }
    }

    const walletSession = await requestMemberWalletToken(cleanEmail, cleanPassword);
    if (!walletSession.success) {
      return {
        success: false,
        message: walletSession.message || 'Bayi oturumu sunucuda doğrulanamadı.',
      };
    }

    // Update lastLoginAt
    userData.lastLoginAt = new Date().toISOString();
    saveToLocalMembersDirectory(userData);
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(userData));

    // Sync active reseller session
    try {
      const { getOrCreateResellerForUser, setActiveResellerSession } = await import('./resellerManager');
      const resProfile = await getOrCreateResellerForUser(userData);
      if (resProfile) {
        setActiveResellerSession(resProfile);
      }
    } catch (rErr) {
      console.debug('Login reseller sync notice:', rErr);
    }

    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        lastLoginAt: userData.lastLoginAt,
        role: userData.role,
        isAllowed: true,
        dealerStatus: 'approved',
      });
    } catch {
      // non-blocking
    }

    return { success: true, message: 'Bayi girişi başarılı!', user: userData };
  } catch (err: any) {
    console.error('Member login error:', err);
    return { success: false, message: err?.message || 'Giriş yapılırken bir hata oluştu.' };
  }
}

/**
 * Returns locally active session user
 */
export function getActiveMemberSession(): UserMember | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UserMember>;
    const email = typeof parsed.email === 'string' ? parsed.email.trim().toLowerCase() : '';
    const uid = typeof parsed.uid === 'string' ? parsed.uid.trim() : '';
    const normalizedUid = uid || (email ? `LOCAL-${email.replace(/[^a-z0-9]+/g, '-')}` : '');
    if (!normalizedUid || !email) return null;

    const normalized = { ...parsed, uid: normalizedUid, email } as UserMember;
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Log out active member
 */
export function getMemberWalletToken(): string | null {
  return typeof window === 'undefined' ? null : sessionStorage.getItem(MEMBER_WALLET_TOKEN_KEY);
}

export function saveMemberWalletToken(token: string): void {
  if (typeof window !== 'undefined') sessionStorage.setItem(MEMBER_WALLET_TOKEN_KEY, token);
}

export function logoutMemberSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(MEMBER_WALLET_TOKEN_KEY);
  localStorage.removeItem(STORAGE_SESSION_KEY);
  localStorage.removeItem('aurabio_active_reseller_session_v1');
  sessionStorage.removeItem('aurabio_reseller_manual_logged_out');
  // Clear any cached dealer referral code so subsequent visitors are not locked to logged-out dealer
  localStorage.removeItem('aurabio_cached_referral_code_v1');
  localStorage.removeItem('aurabio_stored_referral_code_v1');
  sessionStorage.removeItem('aurabio_cached_referral_code_v1');
  sessionStorage.removeItem('aurabio_stored_referral_code_v1');
  sessionStorage.removeItem('aurabio_url_referral_active');
  try {
    document.cookie = 'aurabio_ref_code_v3=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'aurabio_ref_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    if (window.history && window.location) {
      const url = new URL(window.location.href);
      let changed = false;
      ['ref', 'referral', 'bayi', 'bayiKodu', 'r'].forEach((k) => {
        if (url.searchParams.has(k)) {
          url.searchParams.delete(k);
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
  window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: null }));
  window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
}

/**
 * Fetch latest user document from Firestore
 */
export async function fetchMemberProfile(uid: string): Promise<UserMember | null> {
  if (uid === 'ADMIN-AKN-01') {
    return getActiveMemberSession();
  }

  // 1. Try local cache first
  const localList = getLocalMembersDirectory();
  const localUser = localList.find(m => m.uid === uid);

  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      // Always hydrate uid from the document path so legacy documents remain usable.
      const data = { ...snap.data(), uid: snap.id } as UserMember;
      saveToLocalMembersDirectory(data);
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Fetch member profile Firestore notice (using local session):', err);
  }

  return localUser || getActiveMemberSession();
}

/**
 * Real-time Live Subscription to Member's Approval & Expiry Status
 */
export function subscribeToMemberStatus(
  uid: string,
  onUpdate: (user: UserMember | null) => void
): Unsubscribe {
  if (uid === 'ADMIN-AKN-01') {
    const admin = getActiveMemberSession();
    onUpdate(admin);
    return () => {};
  }

  try {
    const docRef = doc(db, 'users', uid);

    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserMember;
          saveToLocalMembersDirectory(data);
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(data));
          onUpdate(data);
        }
      },
      (err) => {
        console.debug('Realtime member subscription notice (using local active cache):', err?.message);
        const active = getActiveMemberSession();
        if (active && active.uid === uid) {
          onUpdate(active);
        }
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Evaluates whether a user currently has access permissions to the application.
 */
export function checkMemberAccess(user: UserMember | null): {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isAllowed: boolean;
  isExpired: boolean;
  isPending: boolean;
  isDemo: boolean;
  remainingDays: number;
  remainingSeconds: number;
  remainingText: string;
  statusBadge: string;
} {
  if (!user) {
    return {
      isLoggedIn: false,
      isAdmin: false,
      isAllowed: false,
      isExpired: false,
      isPending: false,
      isDemo: false,
      remainingDays: 0,
      remainingSeconds: 0,
      remainingText: 'Giriş Yapılmadı',
      statusBadge: 'GİRİŞ GEREKLİ',
    };
  }

  // Super-admin user role
  if (user.role === 'admin' || user.uid === 'ADMIN-AKN-01' || ADMIN_EMAILS.includes(user.email)) {
    return {
      isLoggedIn: true,
      isAdmin: true,
      isAllowed: true,
      isExpired: false,
      isPending: false,
      isDemo: false,
      remainingDays: 9999,
      remainingSeconds: 999999,
      remainingText: 'Yönetici Hesabı (Sınırsız)',
      statusBadge: 'YÖNETİCİ',
    };
  }

  if (user.role === 'dealer' && user.paymentStatus === 'PENDING') {
    return {
      isLoggedIn: true,
      isAdmin: false,
      isAllowed: false,
      isExpired: false,
      isPending: true,
      isDemo: false,
      remainingDays: 0,
      remainingSeconds: 0,
      remainingText: 'Sandbox ödemesi bekleniyor',
      statusBadge: 'ÖDEME BEKLİYOR',
    };
  }

  // 2. Dealer / Reseller User Access
  const isDealerAccount = user.role === 'dealer' || 
                          user.dealerStatus === 'approved' || 
                          Boolean(user.dealerDetails) ||
                          (typeof user.selectedPackage === 'string' && user.selectedPackage.includes('dealer')) ||
                          Boolean(user.isDealerRequested);

  if (isDealerAccount) {
    const credits = typeof user.creditsBalance === 'number' ? user.creditsBalance : 100;
    return {
      isLoggedIn: true,
      isAdmin: false,
      isAllowed: true, // Dealer accounts have full access to the app & dealer portal
      isExpired: false,
      isPending: false,
      isDemo: false,
      remainingDays: 999,
      remainingSeconds: 999999,
      remainingText: `${credits} Seans Kredisi (Yetkili Bayi)`,
      statusBadge: `${credits} SEANS`,
    };
  }

  // If credit system is active on user
  const credits = typeof user.creditsBalance === 'number' ? user.creditsBalance : undefined;

  if (credits !== undefined) {
    if (credits > 0) {
      return {
        isLoggedIn: true,
        isAdmin: false,
        isAllowed: true,
        isExpired: false,
        isPending: false,
        isDemo: false,
        remainingDays: 999,
        remainingSeconds: 999999,
        remainingText: `${credits} Seans Kredisi Kaldı`,
        statusBadge: `${credits} SEANS`,
      };
    } else if (user.isAllowed && credits === 0) {
      return {
        isLoggedIn: true,
        isAdmin: false,
        isAllowed: false,
        isExpired: true,
        isPending: false,
        isDemo: false,
        remainingDays: 0,
        remainingSeconds: 0,
        remainingText: '0 Seans Kredisi (Kredi Satın Alınız)',
        statusBadge: 'KREDİ BİTTİ',
      };
    }
  }

  // If not allowed yet
  if (!user.isAllowed) {
    return {
      isLoggedIn: true,
      isAdmin: false,
      isAllowed: false,
      isExpired: false,
      isPending: true,
      isDemo: false,
      remainingDays: 0,
      remainingSeconds: 0,
      remainingText: 'Ödeme Onayı Bekleniyor',
      statusBadge: 'ONAY BEKLİYOR',
    };
  }

  // If expiryDate is null, access is unlimited / indefinite
  if (!user.expiryDate) {
    return {
      isLoggedIn: true,
      isAdmin: false,
      isAllowed: true,
      isExpired: false,
      isPending: false,
      isDemo: false,
      remainingDays: 999,
      remainingSeconds: 999999,
      remainingText: credits !== undefined ? `${credits} Seans Kredisi` : 'Süresiz Lisans',
      statusBadge: credits !== undefined ? `${credits} SEANS` : 'AKTİF',
    };
  }

  const now = Date.now();
  const expTime = new Date(user.expiryDate).getTime();
  const diffMs = expTime - now;

  const isDemo = user.selectedPackage === 'demo-30m' || user.selectedPackage === 'demo-10m' || user.paymentStatus === 'DEMO';

  if (diffMs <= 0) {
    return {
      isLoggedIn: true,
      isAdmin: false,
      isAllowed: false,
      isExpired: true,
      isPending: false,
      isDemo,
      remainingDays: 0,
      remainingSeconds: 0,
      remainingText: isDemo ? 'Demo Süresi Doldu (Paket Satın Alınız)' : 'Süre Doldu (Kredi Alınız)',
      statusBadge: isDemo ? 'DEMO BİTTİ' : 'SÜRESİ BİTTİ',
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let remainingText = '';
  if (days > 0) {
    remainingText = `${days} Gün Kaldı`;
  } else if (hours > 0) {
    remainingText = `${hours}s ${minutes}dk Kaldı`;
  } else {
    // Less than 1 hour (e.g. demo)
    remainingText = `${minutes}dk ${seconds}sn Kaldı ${isDemo ? '(DEMO)' : ''}`;
  }

  return {
    isLoggedIn: true,
    isAdmin: false,
    isAllowed: true,
    isExpired: false,
    isPending: false,
    isDemo,
    remainingDays: days,
    remainingSeconds: totalSeconds,
    remainingText,
    statusBadge: isDemo ? 'DEMO AKTİF' : 'AKTİF',
  };
}

/**
 * Admin: Add / Top-up Scan & Session Credits to a Member or Dealer
 */
export async function adminAddCreditsToMember(
  uid: string,
  creditsToAdd: number
): Promise<{ success: boolean; newBalance: number; message: string }> {
  try {
    const localList = getLocalMembersDirectory();
    let user = localList.find(m => m.uid === uid) || getActiveMemberSession();
    if (!user || user.uid !== uid) {
      user = await fetchMemberProfile(uid);
    }
    if (!user) {
      return { success: false, newBalance: 0, message: 'Kullanıcı bulunamadı.' };
    }

    const currentBalance = Number(user.creditsBalance) || 0;
    const newBalance = Math.max(0, currentBalance + creditsToAdd);

    const updatedUser: UserMember = {
      ...user,
      creditsBalance: newBalance,
      isAllowed: newBalance > 0 ? true : user.isAllowed,
      paymentStatus: newBalance > 0 ? 'PAID' : user.paymentStatus,
    };

    saveToLocalMembersDirectory(updatedUser);
    const active = getActiveMemberSession();
    if (active && active.uid === uid) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent('aurabio_session_updated', { detail: updatedUser }));
    }

    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, {
        creditsBalance: newBalance,
        isAllowed: newBalance > 0 ? true : user.isAllowed,
        paymentStatus: newBalance > 0 ? 'PAID' : user.paymentStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Admin add credits Firestore notice:', fsErr);
    }

    return {
      success: true,
      newBalance,
      message: `${user.fullName} kullanıcısına ${creditsToAdd > 0 ? `+${creditsToAdd}` : creditsToAdd} seans kredisi tanımlandı. Yeni Bakiye: ${newBalance} Seans`
    };
  } catch (err: any) {
    console.error('Admin add credits error:', err);
    return { success: false, newBalance: 0, message: err?.message || 'Kredi tanımlanırken hata oluştu.' };
  }
}

/**
 * Admin: Get all members from Firestore & local persistent directory
 */
export async function adminGetAllMembers(): Promise<UserMember[]> {
  const memberMap = new Map<string, UserMember>();

  // 1. Load local directory
  getLocalMembersDirectory().forEach(m => {
    if (m.uid) memberMap.set(m.uid, m);
  });

  // 2. Query Firestore and merge
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    snap.forEach((d) => {
      // Legacy user documents may not store uid; Firestore document ID is canonical.
      const data = { ...d.data(), uid: d.id } as UserMember;
      if (data.uid) {
        memberMap.set(data.uid, data);
        saveToLocalMembersDirectory(data);
      }
    });
  } catch (err) {
    console.debug('Admin get all members Firestore query notice (loaded local list):', err);
  }

  const list = Array.from(memberMap.values());
  return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Admin: Set member access permission and duration (days)
 */
export async function adminSetMemberAccess(
  uid: string,
  isAllowed: boolean,
  durationDays?: number | null
): Promise<boolean> {
  try {
    let expiryDateStr: string | null = null;

    if (isAllowed) {
      if (durationDays && durationDays > 0) {
        const exp = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        expiryDateStr = exp.toISOString();
      } else {
        expiryDateStr = null; // Indefinite / Unlimited
      }
    }

    // Update in local directory
    const localList = getLocalMembersDirectory();
    const userToUpdate = localList.find(m => m.uid === uid);
    if (userToUpdate) {
      userToUpdate.isAllowed = isAllowed;
      userToUpdate.expiryDate = expiryDateStr;
      userToUpdate.paymentStatus = isAllowed ? 'PAID' : 'REJECTED';
      saveToLocalMembersDirectory(userToUpdate);
    }

    // If updating current active session
    const current = getActiveMemberSession();
    if (current && current.uid === uid) {
      current.isAllowed = isAllowed;
      current.expiryDate = expiryDateStr;
      current.paymentStatus = isAllowed ? 'PAID' : 'REJECTED';
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(current));
    }

    // Update in Firestore
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(
        docRef,
        {
          uid,
          isAllowed,
          expiryDate: expiryDateStr,
          paymentStatus: isAllowed ? 'PAID' : 'REJECTED',
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('Admin set member access Firestore update notice:', fsErr);
    }

    return true;
  } catch (err) {
    console.error('Admin set member access error:', err);
    return false;
  }
}

/**
 * Admin: Delete member record completely
 */
export async function adminDeleteMember(uid: string): Promise<boolean> {
  try {
    removeFromLocalMembersDirectory(uid);

    // If the currently active session in browser was this user, clear it
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_SESSION_KEY);
        if (raw) {
          const activeUser = JSON.parse(raw);
          if (activeUser && activeUser.uid === uid) {
            localStorage.removeItem(STORAGE_SESSION_KEY);
          }
        }
      } catch {
        // non-blocking
      }
    }

    try {
      const docRef = doc(db, 'users', uid);
      await deleteDoc(docRef);
    } catch (fsErr) {
      console.warn('Admin delete member Firestore notice:', fsErr);
    }

    try {
      await fetch(`/api/v1/admin/members/${uid}`, { method: 'DELETE' });
    } catch (srvErr) {
      console.debug('Server delete member notice:', srvErr);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aurabio_members_updated'));
      window.dispatchEvent(new CustomEvent('aurabio_resellers_updated'));
      window.dispatchEvent(new CustomEvent('monoline_webhook_triggered'));
    }

    return true;
  } catch (err) {
    console.error('Admin delete member error:', err);
    return false;
  }
}
