import { JournalEntry, JournalAnalysisResult, JournalUserStats, ElementalType } from '../types/journal';
import { db, doc, setDoc, deleteDoc, collection, getDocs, limit, query } from '../lib/db';

const STORAGE_JOURNAL_KEY = 'aurabio_user_journal_history_v1';

export function analyzeJournalContent(text: string, tags: string[] = [], intensity?: number): JournalAnalysisResult {
  const lower = (text || '').toLowerCase();
  
  let positivityScore = 65;
  let sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral';
  let dominantAuraColor = 'Zümrüt Yeşili (Kalp Şifası)';
  let dominantEmotion = 'Huzurlu';
  let auraHex = '#10b981';
  let dominantElement: ElementalType = 'Hava';
  let recommendedFrequencyHz = 528;
  let recommendedBinauralHz = 7.83;
  let recommendedEsma = 'Yâ Selâm (131 Kez) - Yâ Vedûd (20 Kez)';
  let identifiedChakras: string[] = ['Kalp Çakrası'];
  let aiReflectionText = 'İç sesinizde derin bir sükûnet ve dönüşüm arzusu hissediliyor. Zihninizdeki düşünce yüklerini sevgiyle serbest bırakıyorsunuz.';
  let affirmation = 'Hayatın akışına güveniyorum; kalbim huzurla ve ilahi sevgiyle doluyor.';
  let suggestedAction = '10 dakika 528 Hz hücresel şifa rezonansı dinleyerek 4-7-8 nefes egzersizi yapın.';

  if (lower.includes('stres') || lower.includes('korku') || lower.includes('kaygı') || lower.includes('panik') || tags.includes('kaygili')) {
    positivityScore = 42;
    sentiment = 'negative';
    dominantEmotion = 'Kaygılı';
    dominantAuraColor = 'Turuncu & Güneş Sarısı (Yatıştırıcı Rezonans)';
    auraHex = '#f59e0b';
    dominantElement = 'Ateş';
    recommendedFrequencyHz = 432;
    recommendedBinauralHz = 4.0;
    recommendedEsma = 'Yâ Selâm (131 Kez) - Yâ Kuddûs (170 Kez)';
    identifiedChakras = ['Solar Pleksus', 'Kök Çakra'];
    aiReflectionText = 'Bedeninizde sempatik sinir sistemi uyarılması tespit edildi. Bu duyguları yargılamadan karşılayıp derin nefesle topraklanma vaktidir.';
    affirmation = 'Tüm endişelerimi serbest bırakıyorum; şu anda tamamen güvendeyim.';
    suggestedAction = '432 Hz Schumann frekansı eşliğinde topraklanma meditasyonu uygulayın.';
  } else if (lower.includes('yorgun') || lower.includes('tükenmiş') || lower.includes('uyku') || tags.includes('yorgun')) {
    positivityScore = 48;
    sentiment = 'mixed';
    dominantEmotion = 'Yorgun';
    dominantAuraColor = 'Koyu İndigo & Gece Mavisi';
    auraHex = '#6366f1';
    dominantElement = 'Su';
    recommendedFrequencyHz = 396;
    recommendedBinauralHz = 2.5;
    recommendedEsma = 'Yâ Hayy Yâ Kayyûm (156 Kez)';
    identifiedChakras = ['Kök Çakra', 'Üçüncü Göz'];
    aiReflectionText = 'Biyo-enerji rezervleriniz dinlenme talep ediyor. Hücrelerinizin yenilenmesi için zihinsel gevezeliği kapatıp dinlenmeye izin verin.';
    affirmation = 'Bedenimin dinlenme ihtiyacına saygı duyuyorum; uyurken hücrelerim yenileniyor.';
    suggestedAction = '396 Hz + Delta dalgaları eşliğinde 20 dakika dinlenmeye çekilin.';
  } else if (lower.includes('mutlu') || lower.includes('şükür') || lower.includes('huzur') || lower.includes('harika') || tags.includes('huzurlu')) {
    positivityScore = 92;
    sentiment = 'positive';
    dominantEmotion = 'Huzurlu';
    dominantAuraColor = 'Saf Beyaz Işık & Altın Menekşe';
    auraHex = '#f8fafc';
    dominantElement = 'Eter';
    recommendedFrequencyHz = 963;
    recommendedBinauralHz = 10.0;
    recommendedEsma = 'Elhamdülillâh - Yâ Şekûr (526 Kez)';
    identifiedChakras = ['Taç Çakra', 'Kalp Çakrası'];
    aiReflectionText = 'Yüksek bir şükran ve kozmik rezonans frekansındasınız. Bu saf ışık auranızı genişletip çevrenize de şifa yayıyor.';
    affirmation = 'Evrenin sonsuz bereketi ve sevgisiyle birim; her an şükürdeyim.';
    suggestedAction = '963 Hz kozmik taç frekansı ile niyetlerinizi evrene mühürleyin.';
  }

  return {
    sentiment,
    positivityScore,
    dominantAuraColor,
    dominantEmotion,
    auraHex,
    dominantElement,
    identifiedChakras,
    recommendedFrequencyHz,
    recommendedBinauralHz,
    recommendedEsma,
    aiReflectionText,
    affirmation,
    suggestedAction
  };
}

export function saveJournalEntry(entry: JournalEntry, userId?: string): JournalEntry[] {
  try {
    const list = getLocalJournalHistory();
    const normalized: JournalEntry = {
      ...entry,
      rawContent: entry.rawContent || entry.rawText || '',
      rawText: entry.rawText || entry.rawContent || '',
      analysis: entry.analysis || entry.aiAnalysisResult,
      aiAnalysisResult: entry.aiAnalysisResult || entry.analysis,
      tags: entry.tags || entry.selectedTags || [],
      selectedTags: entry.selectedTags || entry.tags || [],
    };
    const updated = [normalized, ...list.filter(e => e.id !== entry.id)].slice(0, 100);
    localStorage.setItem(STORAGE_JOURNAL_KEY, JSON.stringify(updated));

    // Asynchronously save to Firestore collection 'aura_journals'
    try {
      const docRef = doc(db, 'aura_journals', entry.id);
      setDoc(docRef, { ...normalized, userId: userId || 'anonymous', syncedAt: new Date().toISOString() }, { merge: true }).catch(err => {
        console.debug('Firestore journal save notice:', err?.message);
      });
    } catch (fsErr) {
      console.debug('Firestore journal save notice:', fsErr);
    }

    return updated;
  } catch (e) {
    console.warn('Journal save error:', e);
    return getLocalJournalHistory();
  }
}

export function getLocalJournalHistory(userId?: string): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_JOURNAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    if (userId && userId !== 'guest' && userId !== 'anonymous') {
      return (parsed as JournalEntry[]).filter(e => e.userId === userId || (e as any).userUid === userId);
    }
    return parsed as JournalEntry[];
  } catch {
    return [];
  }
}

export async function syncJournalFromFirestore(userId?: string): Promise<JournalEntry[]> {
  try {
    const colRef = collection(db, 'aura_journals');
    const q = query(colRef, limit(50));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: JournalEntry[] = [];
      snap.forEach(d => {
        const item = d.data() as JournalEntry;
        if (item.id) {
          if (!userId || userId === 'guest' || item.userId === userId || (item as any).userUid === userId) {
            list.push(item);
          }
        }
      });
      if (list.length > 0) {
        const local = getLocalJournalHistory(userId);
        const map = new Map<string, JournalEntry>();
        list.forEach(item => map.set(item.id, item));
        local.forEach(item => map.set(item.id, item));
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        localStorage.setItem(STORAGE_JOURNAL_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (err) {
    console.debug('Firestore journal sync notice:', err);
  }
  return getLocalJournalHistory(userId);
}

export function deleteJournalEntry(id: string, userId?: string): JournalEntry[] {
  try {
    const list = getLocalJournalHistory();
    const updated = list.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_JOURNAL_KEY, JSON.stringify(updated));

    // Delete from Firestore
    try {
      const docRef = doc(db, 'aura_journals', id);
      deleteDoc(docRef).catch(err => console.debug('Firestore journal delete notice:', err?.message));
    } catch (fsErr) {
      console.debug('Firestore journal delete notice:', fsErr);
    }

    return updated;
  } catch (e) {
    console.warn('Journal delete error:', e);
    return getLocalJournalHistory();
  }
}

export function calculateUserJournalStats(entries: JournalEntry[]): JournalUserStats {
  if (!entries || entries.length === 0) {
    return {
      totalEntries: 0,
      streakDays: 0,
      averagePositivity: 70,
      topChakras: [{ name: 'Kalp Çakrası', count: 1 }],
      dominantAura: 'Zümrüt Yeşili'
    };
  }

  const avgPos = Math.round(entries.reduce((acc, e) => acc + ((e.analysis || e.aiAnalysisResult)?.positivityScore || 70), 0) / entries.length);
  
  return {
    totalEntries: entries.length,
    streakDays: Math.min(entries.length, 7),
    averagePositivity: avgPos,
    topChakras: [
      { name: 'Kalp Çakrası', count: Math.ceil(entries.length * 0.6) },
      { name: 'Üçüncü Göz', count: Math.ceil(entries.length * 0.4) }
    ],
    dominantAura: (entries[0]?.analysis || entries[0]?.aiAnalysisResult)?.dominantAuraColor || 'Zümrüt Yeşili'
  };
}

export function exportJournalReportToTXT(entries: JournalEntry[], stats?: any): string {
  if (!entries || entries.length === 0) {
    return 'AuraBio Günlük Raporu - Henüz kayıt bulunmuyor.';
  }
  return entries.map(e => {
    const analysis = e.analysis || e.aiAnalysisResult;
    const text = e.rawContent || e.rawText || '';
    return `[${e.date}] (Pozitiflik: %${analysis?.positivityScore || 0})\n${text}\nÖneri: ${analysis?.aiReflectionText || ''}\n---`;
  }).join('\n\n');
}
