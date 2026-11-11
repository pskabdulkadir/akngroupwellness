import { 
  collection, 
  doc, 
  getDocs,
  query,
  getDoc,
  setDoc, 
  deleteDoc, 
  onSnapshot,
  where,
  limit,
  Unsubscribe,
  db
} from '../lib/db';
import { formatUsd } from './currency';
import { Reseller } from './resellerManager';
import { DealerPackageOrder } from './dealerOrderManager';
import { ADMIN_PHONE, ADMIN_EMAILS, BANK_INFO } from './authManager';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number; // KDV hariç
  kdvRate: number; // %20
  kdvAmount: number;
  totalAmount: number; // KDV dahil
}

export function calculateVAT(grossAmount: number, vatPercent: number = 20): { netAmount: number; vatAmount: number; grossAmount: number } {
  const gross = Math.max(0, grossAmount || 0);
  const net = Math.round((gross / (1 + vatPercent / 100)) * 100) / 100;
  const vat = Math.round((gross - net) * 100) / 100;
  return {
    netAmount: net,
    vatAmount: vat,
    grossAmount: gross,
  };
}

export interface DigitalInvoice {
  id: string;
  invoiceNumber: string; // e.g. "AUR2026000000042"
  ettn: string; // UUID v4 E-Arşiv Takip Kodu
  orderId?: string;
  packageId?: string;
  packageName?: string;
  
  // Recipient (Buyer / Dealer)
  recipient: {
    uid?: string;
    companyName: string;
    fullName: string;
    taxNumber: string; // Vergi No veya TCKN
    taxOffice: string; // Vergi Dairesi
    address: string;
    city?: string;
    phone: string;
    email: string;
    referralCode?: string;
  };

  // Issuer (Seller / AuraBio)
  issuer: {
    companyName: string;
    title: string;
    taxNumber: string;
    taxOffice: string;
    address: string;
    phone: string;
    email: string;
    web: string;
    mersisNo: string;
    tradeRegistryNo: string;
    bankName: string;
    iban: string;
    accountHolder: string;
  };

  issueDate: string; // YYYY-MM-DD
  issueTime: string; // HH:MM:SS
  serviceDate: string; // YYYY-MM-DD
  currency: 'USD' | 'TRY';

  items: InvoiceItem[];
  subtotal: number; // KDV Hariç Matrah ($)
  kdvTotal: number; // Toplam KDV Tutarı ($)
  grandTotal: number; // KDV Dahil Genel Toplam ($)
  grandTotalInWords: string; // YALNIZ ... USD

  paymentMethod: 'HAVALE_EFT' | 'KREDI_KARTI' | 'CARI_HESAP' | 'DIGER';
  paymentReference?: string;
  status: 'issued' | 'sent_whatsapp' | 'paid' | 'cancelled';
  invoiceType: 'SATIS' | 'ISTISNA' | 'HIZMET';
  notes: string;
  
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

export const DEFAULT_ISSUER_INFO = {
  companyName: 'AKN GLOBAL GROUP LTD',
  title: 'AuraBio Frekans Sistemleri ve Biyorezonans Yazılım Çözümleri',
  authorizedPerson: 'Abdulkadir Kan',
  taxNumber: '1420894512',
  taxOffice: 'Maslak Vergi Dairesi',
  address: 'Dijital Adres (Karekod)',
  phone: '05425783748',
  email: 'psikologabdulkadirkan@gmail.com',
  web: 'https://akngroupfrekans.web.app/',
  mersisNo: '0142089451200001',
  tradeRegistryNo: '849204-5',
  bankName: BANK_INFO.bankName,
  iban: BANK_INFO.iban,
  accountHolder: 'Abdulkadir Kan',
};

const STORAGE_INVOICES_KEY = 'aurabio_digital_invoices_v1';

// Generate standard UUID v4 for ETTN
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Convert amount to Turkish text format for invoices
export function numberToTurkishWords(num: number): string {
  const units = ['', 'BİR', 'İKİ', 'ÜÇ', 'DÖRT', 'BEŞ', 'ALTI', 'YEDİ', 'SEKİZ', 'DOKUZ'];
  const tens = ['', 'ON', 'YİRMİ', 'OTUZ', 'KIRK', 'ELLİ', 'ALTMIŞ', 'YETMİŞ', 'SEKSEN', 'DOKSAN'];
  
  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return 'SIFIR USD';

  function convertThreeDigits(n: number): string {
    let result = '';
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    const tensDigit = Math.floor(remainder / 10);
    const unitsDigit = remainder % 10;

    if (hundreds > 1) {
      result += units[hundreds] + ' YÜZ ';
    } else if (hundreds === 1) {
      result += 'YÜZ ';
    }

    if (tensDigit > 0) {
      result += tens[tensDigit] + ' ';
    }

    if (unitsDigit > 0) {
      result += units[unitsDigit] + ' ';
    }

    return result.trim();
  }

  let words = '';
  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (millions > 0) {
    words += convertThreeDigits(millions) + ' MİLYON ';
  }

  if (thousands > 1) {
    words += convertThreeDigits(thousands) + ' BİN ';
  } else if (thousands === 1) {
    words += 'BİN ';
  }

  if (remainder > 0) {
    words += convertThreeDigits(remainder) + ' ';
  }

  words = words.trim() + ' USD';

  if (decimalPart > 0) {
    words += ' ' + convertThreeDigits(decimalPart) + ' SENT';
  }

  return words;
}

// Generate sequential or standard e-Arşiv invoice number
export function generateInvoiceNumber(existingCount: number = 0): string {
  const year = new Date().getFullYear();
  const seq = (existingCount + 1).toString().padStart(6, '0');
  return `AUR${year}${seq}`;
}

export function getLocalDigitalInvoices(): DigitalInvoice[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_INVOICES_KEY);
    if (!raw) return [];
    const list: DigitalInvoice[] = JSON.parse(raw);
    let changed = false;
    const migrated = list.map(inv => {
      if (!inv.issuer || !inv.issuer.companyName.includes('AKN GLOBAL') || inv.issuer.address.includes('Nurol Plaza')) {
        changed = true;
        return {
          ...inv,
          issuer: {
            ...DEFAULT_ISSUER_INFO,
            ...inv.issuer,
            companyName: DEFAULT_ISSUER_INFO.companyName,
            title: DEFAULT_ISSUER_INFO.title,
            phone: DEFAULT_ISSUER_INFO.phone,
            web: DEFAULT_ISSUER_INFO.web,
            address: DEFAULT_ISSUER_INFO.address,
            accountHolder: DEFAULT_ISSUER_INFO.accountHolder,
          }
        };
      }
      return inv;
    });
    if (changed) {
      localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return [];
  }
}

export function saveLocalDigitalInvoices(invoices: DigitalInvoice[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(invoices));
    window.dispatchEvent(new CustomEvent('aurabio_invoices_updated'));
  } catch (e) {
    console.warn('Save local digital invoices notice:', e);
  }
}

/**
 * Fetch all digital invoices from Firestore with local fallback
 */
export async function getAllDigitalInvoices(): Promise<DigitalInvoice[]> {
  try {
    const colRef = collection(db, 'digital_invoices');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list: DigitalInvoice[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as DigitalInvoice);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveLocalDigitalInvoices(list);
      return list;
    }
  } catch (err) {
    console.debug('Firestore get digital invoices fallback:', err);
  }
  return getLocalDigitalInvoices();
}

/**
 * Filter invoices specifically belonging to a reseller
 */
function invoiceMatchesReseller(inv: DigitalInvoice, clean: string): boolean {
  const rUid = (inv.recipient?.uid || '').trim().toLowerCase();
  const rEmail = (inv.recipient?.email || '').trim().toLowerCase();
  const rCode = (inv.recipient?.referralCode || '').trim().toLowerCase();
  const rName = (inv.recipient?.companyName || '').trim().toLowerCase();

  return rUid === clean || rEmail === clean || rCode === clean || (clean.length > 3 && rName.includes(clean));
}

export async function getInvoicesForReseller(resellerIdOrEmailOrCode: string): Promise<DigitalInvoice[]> {
  const raw = (resellerIdOrEmailOrCode || '').trim();
  const clean = raw.toLowerCase();
  if (!clean) return [];

  const local = getLocalDigitalInvoices().filter(inv => invoiceMatchesReseller(inv, clean));
  try {
    const field = clean.includes('@') ? 'recipient.email' : clean.startsWith('AURA-') || clean.startsWith('BAYI-') ? 'recipient.referralCode' : 'recipient.uid';
    const snapshot = await getDocs(query(collection(db, 'digital_invoices'), where(field, '==', raw), limit(100)));
    const cloud = snapshot.docs.map(docSnap => {
      const data = docSnap.data() as DigitalInvoice;
      return { ...data, id: docSnap.id };
    });
    const merged = new Map<string, DigitalInvoice>();
    local.forEach(inv => merged.set(inv.id, inv));
    cloud.filter(inv => invoiceMatchesReseller(inv, clean)).forEach(inv => merged.set(inv.id, inv));
    const result = Array.from(merged.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (result.length > 0) return result;
  } catch (err) {
    console.debug('Firestore reseller invoice query fallback:', err);
  }

  return local;
}

/**
 * Save or update digital invoice
 */
export async function saveDigitalInvoice(invoice: DigitalInvoice): Promise<boolean> {
  try {
    const current = getLocalDigitalInvoices();
    const index = current.findIndex(inv => inv.id === invoice.id || inv.invoiceNumber === invoice.invoiceNumber);
    
    let updated: DigitalInvoice[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = invoice;
    } else {
      updated = [invoice, ...current];
    }
    
    saveLocalDigitalInvoices(updated);

    try {
      const docRef = doc(db, 'digital_invoices', invoice.id);
      await setDoc(docRef, invoice, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore set digital invoice notice:', fsErr);
    }

    window.dispatchEvent(new CustomEvent('aurabio_invoices_updated'));
    return true;
  } catch (e) {
    console.error('Save digital invoice error:', e);
    return false;
  }
}

/**
 * Delete a digital invoice
 */
export async function deleteDigitalInvoice(invoiceId: string): Promise<boolean> {
  try {
    const current = getLocalDigitalInvoices();
    const filtered = current.filter(inv => inv.id !== invoiceId);
    saveLocalDigitalInvoices(filtered);

    try {
      const docRef = doc(db, 'digital_invoices', invoiceId);
      await deleteDoc(docRef);
    } catch (fsErr) {
      console.warn('Firestore delete invoice notice:', fsErr);
    }

    window.dispatchEvent(new CustomEvent('aurabio_invoices_updated'));
    return true;
  } catch (e) {
    console.error('Delete digital invoice error:', e);
    return false;
  }
}

/**
 * Subscribe to real-time invoice changes
 */
export function subscribeToDigitalInvoices(
  onUpdate: (invoices: DigitalInvoice[]) => void,
  resellerFilter?: string
): Unsubscribe {
  const cleanFilter = (resellerFilter || '').trim().toLowerCase();
  const emitLocal = () => {
    const local = getLocalDigitalInvoices();
    onUpdate(cleanFilter ? local.filter(inv => invoiceMatchesReseller(inv, cleanFilter)) : local);
  };
  emitLocal();

  const handleLocal = () => emitLocal();
  window.addEventListener('storage', handleLocal);
  window.addEventListener('aurabio_invoices_updated', handleLocal);

  try {
    if (cleanFilter) {
      const rawFilter = (resellerFilter || '').trim();
      const field = cleanFilter.includes('@') ? 'recipient.email' : cleanFilter.startsWith('AURA-') || cleanFilter.startsWith('BAYI-') ? 'recipient.referralCode' : 'recipient.uid';
      const q = query(collection(db, 'digital_invoices'), where(field, '==', rawFilter), limit(100));
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map((docSnap: any) => ({ ...docSnap.data(), id: docSnap.id } as DigitalInvoice));
        list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      }, (err) => console.debug('Live reseller invoice sync notice:', err));
      return () => {
        window.removeEventListener('storage', handleLocal);
        window.removeEventListener('aurabio_invoices_updated', handleLocal);
        unsub();
      };
    }

    // Only admin views subscribe to the complete invoice collection.
    const unsub = onSnapshot(query(collection(db, 'digital_invoices'), limit(500)), (snapshot) => {
      const list = snapshot.docs.map((docSnap: any) => ({ ...docSnap.data(), id: docSnap.id } as DigitalInvoice));
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveLocalDigitalInvoices(list);
      onUpdate(list);
    }, (err) => console.debug('Live invoice sync notice:', err));

    return () => {
      window.removeEventListener('storage', handleLocal);
      window.removeEventListener('aurabio_invoices_updated', handleLocal);
      unsub();
    };
  } catch {
    return () => {
      window.removeEventListener('storage', handleLocal);
      window.removeEventListener('aurabio_invoices_updated', handleLocal);
    };
  }
}

/**
 * Automatically create a standard e-Arşiv Digital Invoice for a dealer order / topup
 */
export async function createInvoiceForDealerOrder(
  order: DealerPackageOrder,
  reseller?: Reseller | null,
  customRecipient?: Partial<DigitalInvoice['recipient']>
): Promise<DigitalInvoice> {
  const allInvoices = await getAllDigitalInvoices();
  
  // Check if invoice already exists for this order
  const existing = allInvoices.find(i => i.orderId === order.id);
  if (existing) {
    return existing;
  }

  const invoiceId = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const invoiceNumber = generateInvoiceNumber(allInvoices.length);
  const ettn = generateUUID();
  
  const now = new Date();
  const issueDate = now.toISOString().split('T')[0];
  const issueTime = now.toTimeString().split(' ')[0];

  // Calculate pricing (KDV %20 Dahil)
  // GrandTotal = Price
  // Subtotal = Price / 1.20
  // KdvTotal = Price - Subtotal
  const grandTotal = Math.max(0, Number(order.price) || 0);
  const subtotal = Math.round((grandTotal / 1.20) * 100) / 100;
  const kdvTotal = Math.round((grandTotal - subtotal) * 100) / 100;

  const itemDescription = `${order.packageName || 'Yetkili Bayilik Paketi'} - ${order.scanCredits} Seans Biyorezonans Kredisi & Lisans Hizmeti`;

  const item: InvoiceItem = {
    id: `item-1`,
    description: itemDescription,
    quantity: 1,
    unit: 'Paket',
    unitPrice: subtotal,
    kdvRate: 20,
    kdvAmount: kdvTotal,
    totalAmount: grandTotal,
  };

  const recipient: DigitalInvoice['recipient'] = {
    uid: order.resellerId || reseller?.uid || '',
    companyName: customRecipient?.companyName || reseller?.businessName || reseller?.resellerName || order.resellerName || 'Yetkili Bayi',
    fullName: customRecipient?.fullName || reseller?.fullName || reseller?.resellerName || order.resellerName || 'Yetkili Bayi',
    taxNumber: customRecipient?.taxNumber || (reseller as any)?.taxNumber || '11111111111',
    taxOffice: customRecipient?.taxOffice || (reseller as any)?.taxOffice || 'Vergi Dairesi',
    address: customRecipient?.address || (reseller as any)?.address || 'Türkiye',
    city: customRecipient?.city || 'İstanbul',
    phone: customRecipient?.phone || order.resellerPhone || reseller?.phone || '',
    email: customRecipient?.email || order.resellerEmail || reseller?.email || '',
    referralCode: customRecipient?.referralCode || reseller?.referralCode || '',
  };

  const newInvoice: DigitalInvoice = {
    id: invoiceId,
    invoiceNumber,
    ettn,
    orderId: order.id,
    packageId: order.packageId,
    packageName: order.packageName,
    recipient,
    issuer: DEFAULT_ISSUER_INFO,
    issueDate,
    issueTime,
    serviceDate: issueDate,
    currency: 'USD',
    items: [item],
    subtotal,
    kdvTotal,
    grandTotal,
    grandTotalInWords: numberToTurkishWords(grandTotal),
    paymentMethod: order.paymentMethod === 'bank_transfer' ? 'HAVALE_EFT' : 'HAVALE_EFT',
    paymentReference: order.paymentReference || `Sipariş #${order.id}`,
    status: 'issued',
    invoiceType: 'SATIS',
    notes: "509 Sıra No'lu VUK Genel Tebliği uyarınca e-Arşiv Fatura olarak elektronik ortamda tanzim edilmiştir. İşbu fatura AuraBio Frekans yazılım lisans bedeli ve seans kredi tahsisini içermektedir.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveDigitalInvoice(newInvoice);
  return newInvoice;
}

/**
 * Generate formatted WhatsApp message and share URL to send digital invoice to dealer
 */
export function generateInvoiceWhatsAppShareUrl(invoice: DigitalInvoice, customPhone?: string): string {
  const targetPhone = (customPhone || invoice.recipient.phone || '').replace(/[^0-9]/g, '');
  const cleanPhone = targetPhone.startsWith('0') 
    ? '90' + targetPhone.substring(1) 
    : (targetPhone.startsWith('90') ? targetPhone : (targetPhone ? '90' + targetPhone : ''));

  const text = `🧾 *AKN GLOBAL GROUP LTD - RESMİ DİJİTAL E-ARŞİV FATURANIZ*
_${invoice.issuer.title || 'AuraBio Frekans Sistemleri ve Biyorezonans Yazılım Çözümleri'}_

Sayın *${invoice.recipient.companyName || invoice.recipient.fullName}*,

Satın almış olduğunuz bayilik paketi ve seans kredisi için oluşturulan resmi e-Arşiv faturanız detayları aşağıda yer almaktadır:

📄 *Fatura No:* ${invoice.invoiceNumber}
🔢 *ETTN Takip No:* ${invoice.ettn}
📅 *Fatura Tarihi:* ${invoice.issueDate} ${invoice.issueTime}
📦 *Hizmet / Paket:* ${invoice.items[0]?.description || invoice.packageName || 'Yetkili Bayilik Paketi'}
📊 *Matrah (KDV Hariç):* ${formatUsd(invoice.subtotal, 2)}
📈 *Hesaplanan KDV (%20):* ${formatUsd(invoice.kdvTotal, 2)}
💰 *Genel Toplam (KDV Dahil):* ${formatUsd(invoice.grandTotal, 2)}
💳 *Ödeme Türü:* ${invoice.paymentMethod === 'HAVALE_EFT' ? 'Banka Havalesi / EFT' : 'Kredi Kartı / Diğer'}

🔗 *Faturanızı Görüntülemek ve PDF Olarak İndirmek İçin:*
Bayi panelinizdeki *"Faturalarım / E-Faturalar"* menüsünden dilediğiniz an faturanıza ulaşabilir ve yazdırabilirsiniz.

🏢 *Satıcı / Düzenleyen:* ${invoice.issuer.companyName}
👤 *Yetkili:* ${invoice.issuer.accountHolder || 'Abdulkadir Kan'}
📞 *Telefon:* ${invoice.issuer.phone}
🌐 *Web:* ${invoice.issuer.web}
📍 *Adres:* ${invoice.issuer.address}

_Bu belge sadece bilgilendirme amaçlıdır, farklı bir amaç ile kullanılamaz, fatura yerine geçmez._`;

  const encodedText = encodeURIComponent(text);
  return cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
}
