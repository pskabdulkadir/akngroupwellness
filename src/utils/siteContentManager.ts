import { doc, onSnapshot, setDoc, Unsubscribe, db } from '../lib/db';
import { BANK_INFO, setAdminPhone } from './authManager';

export interface SiteContent {
  bankName: string;
  accountHolder: string;
  iban: string;
  supportPhone: string;
  affiliateBadge: string;
  welcomeBonusLabel: string;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  bankName: 'QNB Finansbank',
  accountHolder: 'Abdulkadir Kan',
  iban: 'TR32 0015 7000 0000 0091 7751 22',
  supportPhone: '+90 542 578 37 48',
  affiliateBadge: 'AFFILIATE v2.5',
  welcomeBonusLabel: '32+32 (64 Kredi)',
};

const SITE_CONTENT_DOC_PATH = ['system_config', 'site_content'] as const;

let currentSiteContent: SiteContent = { ...DEFAULT_SITE_CONTENT };

export function getSiteContent(): SiteContent {
  return currentSiteContent;
}

function applySiteContent(content: SiteContent): void {
  currentSiteContent = content;
  BANK_INFO.bankName = content.bankName;
  BANK_INFO.accountHolder = content.accountHolder;
  BANK_INFO.iban = content.iban;
  BANK_INFO.ibanClean = content.iban.replace(/\s/g, '');
  setAdminPhone(content.supportPhone);
}

function normalizeSiteContent(raw: Partial<SiteContent> | undefined): SiteContent {
  const merged: SiteContent = { ...DEFAULT_SITE_CONTENT };
  (Object.keys(DEFAULT_SITE_CONTENT) as (keyof SiteContent)[]).forEach((key) => {
    const value = raw?.[key];
    if (typeof value === 'string' && value.trim()) merged[key] = value.trim();
  });
  return merged;
}

export function subscribeToSiteContent(onUpdate: () => void): Unsubscribe {
  const docRef = doc(db, ...SITE_CONTENT_DOC_PATH);
  return onSnapshot(
    docRef,
    (snap) => {
      applySiteContent(normalizeSiteContent(snap.exists() ? (snap.data() as Partial<SiteContent>) : undefined));
      onUpdate();
    },
    (err) => {
      console.warn('Site içeriği Firestore bildirimi (varsayılan içerik devrede):', err?.message || err);
      applySiteContent(DEFAULT_SITE_CONTENT);
      onUpdate();
    }
  );
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  const normalized = normalizeSiteContent(content);
  const docRef = doc(db, ...SITE_CONTENT_DOC_PATH);
  await setDoc(docRef, { ...normalized, updatedAt: new Date().toISOString() }, { merge: true });
  applySiteContent(normalized);
}
