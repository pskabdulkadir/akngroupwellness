import { QURAN_SURAHS } from './quranSurahs';

export interface QuranVerse {
  id: number;
  surahNumber: number;
  verseNumber: number;
  arabic: string;
  translation: string;
  footnotes: string;
  transliteration: null;
  meaning: string;
  purposes: readonly string[];
  frequencyHz: number;
}

export interface QuranTranslationInfo {
  key: string;
  title: string;
  version: string;
  description: string;
}

interface QuranEncVerse {
  id: string;
  sura: string;
  aya: string;
  arabic_text: string;
  translation: string;
  footnotes: string;
}

const API_ROOT = 'https://quranenc.com/api/v1';
const TRANSLATION_KEY = 'turkish_shahin';

export async function fetchQuranTranslationInfo(signal?: AbortSignal): Promise<QuranTranslationInfo> {
  const response = await fetch(`${API_ROOT}/translations/list/tr?localization=tr`, { signal });
  if (!response.ok) throw new Error('Meal kaynağı bilgisi alınamadı.');
  const data = await response.json() as { translations?: Array<{ key: string; title: string; version: string; description: string }> };
  const translation = data.translations?.find((item) => item.key === TRANSLATION_KEY);
  if (!translation) throw new Error('Seçilen Türkçe meal kaynağı bulunamadı.');
  return translation;
}

export async function fetchQuranSurah(surahNumber: number, signal?: AbortSignal): Promise<QuranVerse[]> {
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > QURAN_SURAHS.length) {
    throw new RangeError('Geçersiz sure numarası.');
  }
  const response = await fetch(`${API_ROOT}/translation/sura/${TRANSLATION_KEY}/${surahNumber}`, { signal });
  if (!response.ok) throw new Error('Sure metni alınamadı. Bağlantınızı kontrol edip yeniden deneyin.');
  const data = await response.json() as { result?: QuranEncVerse[] };
  const expectedCount = QURAN_SURAHS[surahNumber - 1].verseCount;
  if (!Array.isArray(data.result) || data.result.length !== expectedCount) {
    throw new Error(`Sure verisi doğrulanamadı. Beklenen ayet sayısı: ${expectedCount}.`);
  }
  return data.result.map((verse, index) => {
    const verseNumber = index + 1;
    if (Number(verse.sura) !== surahNumber || Number(verse.aya) !== verseNumber || !verse.arabic_text?.trim() || !verse.translation?.trim()) {
      throw new Error(`Sure verisi doğrulanamadı: ${surahNumber}:${verseNumber} eksik veya hatalı.`);
    }
    return {
      id: Number(verse.id),
      surahNumber,
      verseNumber,
      arabic: verse.arabic_text,
      translation: verse.translation,
      footnotes: verse.footnotes || '',
      transliteration: null,
      meaning: verse.footnotes || '',
      purposes: ['okuma', 'meal inceleme', 'tefekkür'],
      frequencyHz: QURAN_SURAHS[surahNumber - 1].frequencyHz,
    };
  });
}

export const QURAN_DATA_ATTRIBUTION = 'Arapça metin ve Türkçe meal kaynağı: QuranEnc.com. Türkçe meal çevirmeni: Dr. Ali Özek ve Diğerleri.';
export const QURAN_TRANSLATION_KEY = TRANSLATION_KEY;
