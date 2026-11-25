export interface QuranSurahInfo {
  number: number;
  name: string;
  verseCount: number;
  frequencyHz: number;
}

const SURAH_NAMES_AND_COUNTS = [
  ['Fâtiha', 7], ['Bakara', 286], ['Âl-i İmrân', 200], ['Nisâ', 176], ['Mâide', 120], ['En’âm', 165], ['A’râf', 206], ['Enfâl', 75], ['Tevbe', 129], ['Yûnus', 109],
  ['Hûd', 123], ['Yûsuf', 111], ['Ra’d', 43], ['İbrâhîm', 52], ['Hicr', 99], ['Nahl', 128], ['İsrâ', 111], ['Kehf', 110], ['Meryem', 98], ['Tâhâ', 135],
  ['Enbiyâ', 112], ['Hacc', 78], ['Mü’minûn', 118], ['Nûr', 64], ['Furkân', 77], ['Şuarâ', 227], ['Neml', 93], ['Kasas', 88], ['Ankebût', 69], ['Rûm', 60],
  ['Lokmân', 34], ['Secde', 30], ['Ahzâb', 73], ['Sebe', 54], ['Fâtır', 45], ['Yâsîn', 83], ['Sâffât', 182], ['Sâd', 88], ['Zümer', 75], ['Mü’min', 85],
  ['Fussilet', 54], ['Şûrâ', 53], ['Zuhruf', 89], ['Duhân', 59], ['Câsiye', 37], ['Ahkâf', 35], ['Muhammed', 38], ['Fetih', 29], ['Hucurât', 18], ['Kâf', 45],
  ['Zâriyât', 60], ['Tûr', 49], ['Necm', 62], ['Kamer', 55], ['Rahmân', 78], ['Vâkıa', 96], ['Hadîd', 29], ['Mücâdele', 22], ['Haşr', 24], ['Mümtehine', 13],
  ['Saf', 14], ['Cuma', 11], ['Münâfikûn', 11], ['Teğâbün', 18], ['Talâk', 12], ['Tahrîm', 12], ['Mülk', 30], ['Kalem', 52], ['Hâkka', 52], ['Meâric', 44],
  ['Nûh', 28], ['Cin', 28], ['Müzzemmil', 20], ['Müddessir', 56], ['Kıyâme', 40], ['İnsân', 31], ['Mürselât', 50], ['Nebe', 40], ['Nâziât', 46], ['Abese', 42],
  ['Tekvîr', 29], ['İnfitâr', 19], ['Mutaffifîn', 36], ['İnşikâk', 25], ['Burûc', 22], ['Târık', 17], ['A’lâ', 19], ['Gâşiye', 26], ['Fecr', 30], ['Beled', 20],
  ['Şems', 15], ['Leyl', 21], ['Duhâ', 11], ['İnşirâh', 8], ['Tîn', 8], ['Alak', 19], ['Kadr', 5], ['Beyyine', 8], ['Zilzâl', 8], ['Âdiyât', 11],
  ['Kâria', 11], ['Tekâsür', 8], ['Asr', 3], ['Hümeze', 9], ['Fîl', 5], ['Kureyş', 4], ['Mâûn', 7], ['Kevser', 3], ['Kâfirûn', 6], ['Nasr', 3],
  ['Tebbet', 5], ['İhlâs', 4], ['Felak', 5], ['Nâs', 6],
] as const;

export const getQuranSurahToneHz = (surahNumber: number) => 218 + surahNumber * 2;

export const QURAN_SURAHS: readonly QuranSurahInfo[] = SURAH_NAMES_AND_COUNTS.map(([name, verseCount], index) => ({
  number: index + 1,
  name,
  verseCount,
  frequencyHz: getQuranSurahToneHz(index + 1),
}));

export const QURAN_SURAH_COUNT = QURAN_SURAHS.length;
export const QURAN_VERSE_COUNT = QURAN_SURAHS.reduce((total, surah) => total + surah.verseCount, 0);
export const QURAN_VERSE_PAGE_SIZE = 30;
export const QURAN_SURAHS_PER_PAGE = 20;
