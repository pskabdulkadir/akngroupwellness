import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Clock, Headphones, Play, Search, Square, X } from 'lucide-react';
import { DUA_DURATIONS, MEDITATION_MODES } from '../data/duaCatalog';
import { fetchQuranSurah, fetchQuranTranslationInfo, QuranTranslationInfo, QuranVerse, QURAN_DATA_ATTRIBUTION } from '../data/quranApi';
import { QURAN_SURAHS, QURAN_SURAH_COUNT, QURAN_SURAHS_PER_PAGE, QURAN_VERSE_COUNT, QURAN_VERSE_PAGE_SIZE } from '../data/quranSurahs';

type Session = { context: AudioContext; oscillator: OscillatorNode; gain: GainNode; endAt: number };

export function DuaModal({ onClose }: { onClose: () => void }) {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState(2);
  const [selectedVerseNumber, setSelectedVerseNumber] = useState(255);
  const [query, setQuery] = useState('');
  const [purpose, setPurpose] = useState('Tümü');
  const [surahPage, setSurahPage] = useState(0);
  const [versePage, setVersePage] = useState(0);
  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [translationInfo, setTranslationInfo] = useState<QuranTranslationInfo | null>(null);
  const [minutes, setMinutes] = useState<number>(5);
  const [frequency, setFrequency] = useState(QURAN_SURAHS[1].frequencyHz);
  const [volume, setVolume] = useState(0.12);
  const [remaining, setRemaining] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const session = useRef<Session | null>(null);
  const requestId = useRef(0);
  const verseCache = useRef(new Map<number, QuranVerse[]>());
  const selectedSurah = QURAN_SURAHS[selectedSurahNumber - 1];
  const selectedVerse = verses.find((verse) => verse.verseNumber === selectedVerseNumber) ?? null;
  const queryText = query.toLocaleLowerCase('tr').trim();
  const filteredSurahs = useMemo(() => QURAN_SURAHS.filter((surah) => {
    const purposeMatches = purpose === 'Tümü' || (purpose === 'Sığınma ve korunma' ? [113, 114].includes(surah.number) : purpose === 'Huzur ve ferahlık' ? [1, 93, 94].includes(surah.number) : purpose === 'Şükür ve tefekkür' ? [55, 56, 59].includes(surah.number) : true);
    return purposeMatches && (!queryText || `${surah.name} ${surah.number} ${surah.verseCount}`.toLocaleLowerCase('tr').includes(queryText));
  }), [purpose, queryText]);
  const visibleSurahs = filteredSurahs.slice(surahPage * QURAN_SURAHS_PER_PAGE, (surahPage + 1) * QURAN_SURAHS_PER_PAGE);
  const filteredVerses = useMemo(() => verses.filter((verse) => !queryText || `${verse.verseNumber} ${verse.arabic} ${verse.translation} ${verse.footnotes}`.toLocaleLowerCase('tr').includes(queryText)), [verses, queryText]);
  const visibleVerses = filteredVerses.slice(versePage * QURAN_VERSE_PAGE_SIZE, (versePage + 1) * QURAN_VERSE_PAGE_SIZE);
  const versePageCount = Math.max(1, Math.ceil(filteredVerses.length / QURAN_VERSE_PAGE_SIZE));

  const stop = useCallback(() => {
    const current = session.current;
    session.current = null;
    if (current) {
      current.oscillator.onended = null;
      try { current.oscillator.stop(); } catch { /* Oscillator may already have ended. */ }
      void current.context.close();
    }
    setPlaying(false);
    setRemaining(0);
  }, []);

  useEffect(() => () => {
    requestId.current += 1;
    const current = session.current;
    session.current = null;
    if (current) {
      current.oscillator.onended = null;
      try { current.oscillator.stop(); } catch { /* Oscillator may already have ended. */ }
      void current.context.close();
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchQuranTranslationInfo(controller.signal).then(setTranslationInfo).catch(() => {
      if (!controller.signal.aborted) setTranslationInfo(null);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    stop();
    const cachedVerses = verseCache.current.get(selectedSurahNumber);
    setLoading(!cachedVerses);
    setLoadError('');
    setVerses(cachedVerses ?? []);
    setFrequency(selectedSurah.frequencyHz);
    if (cachedVerses) return () => controller.abort();
    void fetchQuranSurah(selectedSurahNumber, controller.signal).then((result) => {
      if (requestId.current !== currentRequest) return;
      verseCache.current.set(selectedSurahNumber, result);
      setVerses(result);
      setSelectedVerseNumber((current) => current <= result.length ? current : 1);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && requestId.current === currentRequest) {
        setLoadError(error instanceof Error ? error.message : 'Sure metni yüklenemedi.');
      }
    }).finally(() => {
      if (!controller.signal.aborted && requestId.current === currentRequest) setLoading(false);
    });
    return () => controller.abort();
  }, [selectedSurahNumber, selectedSurah.frequencyHz, reloadKey, stop]);

  useEffect(() => {
    setVersePage(0);
    setSurahPage(0);
  }, [query, purpose]);

  useEffect(() => {
    if (!playing) return;
    const update = () => {
      const current = session.current;
      if (!current) return;
      const seconds = Math.max(0, Math.ceil((current.endAt - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) {
        stop();
        setMessage('Seans tamamlandı.');
      }
    };
    const timer = window.setInterval(update, 250);
    document.addEventListener('visibilitychange', update);
    update();
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [playing, stop]);

  const start = () => {
    stop();
    setMessage('');
    let context: AudioContext | null = null;
    try {
      context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.15);
      gain.gain.setValueAtTime(volume, context.currentTime + minutes * 60 - 0.15);
      gain.gain.linearRampToValueAtTime(0, context.currentTime + minutes * 60);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + minutes * 60);
      const current: Session = { context, oscillator, gain, endAt: Date.now() + minutes * 60000 };
      session.current = current;
      oscillator.onended = () => {
        if (session.current !== current) return;
        session.current = null;
        void current.context.close();
        setPlaying(false);
        setRemaining(0);
        setMessage('Seans tamamlandı.');
      };
      setRemaining(minutes * 60);
      setPlaying(true);
      void context.resume().catch(() => {
        if (session.current !== current) return;
        stop();
        setMessage('Ses başlatılamadı. Tarayıcınızın ses izinlerini kontrol edin.');
      });
    } catch {
      if (context && context.state !== 'closed') void context.close();
      session.current = null;
      setPlaying(false);
      setMessage('Ses başlatılamadı. Tarayıcınızın ses izinlerini kontrol edin.');
    }
  };

  const selectSurah = (number: number) => {
    if (number === selectedSurahNumber) return;
    setSelectedSurahNumber(number);
    setSelectedVerseNumber(1);
    setVersePage(0);
  };
  const chooseFrequency = (value: number) => { stop(); setFrequency(value); setMessage(''); };
  const setLevel = (value: number) => {
    setVolume(value);
    const current = session.current;
    if (current) {
      const now = current.context.currentTime;
      const end = now + Math.max(0, (current.endAt - Date.now()) / 1000);
      current.gain.gain.cancelScheduledValues(now);
      current.gain.gain.setTargetAtTime(value, now, 0.05);
      if (end > now + 0.15) current.gain.gain.setValueAtTime(value, end - 0.15);
      current.gain.gain.linearRampToValueAtTime(0, end);
    }
  };
  const chooseVerse = (verseNumber: number) => { setSelectedVerseNumber(verseNumber); stop(); setMessage(''); };
  const time = `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`;
  const chip = (active: boolean) => `rounded-xl border px-3 py-2 text-xs font-semibold transition ${active ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-emerald-500/60'}`;
  const onMeditationClick = () => playing ? (stop(), setMessage('Seans durduruldu.')) : start();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-labelledby="dua-title">
      <div className="flex max-h-[95dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-emerald-950 p-4 sm:p-6">
          <div className="flex items-center gap-3"><div className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-3"><BookOpen className="h-5 w-5 text-emerald-300" /></div><div><h1 id="dua-title" className="text-xl font-bold text-white">Dualar</h1><p className="text-xs text-slate-400">{QURAN_SURAH_COUNT} sure · {QURAN_VERSE_COUNT.toLocaleString('tr-TR')} ayet</p></div></div>
          <button type="button" onClick={onClose} aria-label="Duaları kapat" className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white"><X className="h-5 w-5" /></button>
        </header>
        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs leading-relaxed text-amber-100/90">Arapça ayet metni ve Türkçe meal QuranEnc.com kaynağından seçilen sure için yüklenir. Türkçe mealin anlam çevirisi olduğu ve kaynak metnin yerine geçmediği unutulmamalıdır. Her ayet için ayrı doğrulanmış Türkçe okunuş veya tefsir bu veri kaynağında bulunmadığından bunlar uydurulmaz; mevcutsa kaynak dipnotları gösterilir. Gösterilen Hz değeri sureye atanmış uygulama ses tercihidir, ayetin özelliği veya bilimsel/tedavi edici bir eşleşme değildir. Yalnızca frekans tonu üretilir; Kur’an tilaveti/okuması yapılmaz. Tıbbi bakımın yerine geçmez; sesi düşük tutun ve rahatsızlık hissederseniz durdurun.</div>
          <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="min-w-0 space-y-3">
              <h2 className="font-bold text-white">Sure kataloğu <span className="text-xs font-normal text-slate-400">({filteredSurahs.length})</span></h2>
              <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sure; seçili surede ayet veya meal" aria-label="Sure veya seçili surede ayet ve meal ara" className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500" /></div>
              <select aria-label="Sure temasına göre filtrele" value={purpose} onChange={(event) => setPurpose(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-200"><option>Tümü</option><option>Sığınma ve korunma</option><option>Huzur ve ferahlık</option><option>Şükür ve tefekkür</option></select>
              <div className="max-h-64 space-y-2 overflow-y-auto lg:max-h-[430px]">{visibleSurahs.map((surah) => <button type="button" key={surah.number} onClick={() => selectSurah(surah.number)} aria-pressed={surah.number === selectedSurahNumber} className={`w-full rounded-xl border p-3 text-left transition ${surah.number === selectedSurahNumber ? 'border-emerald-400/70 bg-emerald-500/15' : 'border-slate-700 bg-slate-950/50 hover:border-emerald-500/50'}`}><span className="block text-sm font-bold text-slate-100">{surah.number}. {surah.name}</span><span className="mt-1 block text-xs text-slate-400">{surah.verseCount} ayet · {surah.frequencyHz} Hz</span></button>)}</div>
              <div className="flex items-center justify-between text-xs text-slate-400"><button type="button" disabled={surahPage === 0} onClick={() => setSurahPage((page) => Math.max(0, page - 1))} className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Önceki</button><span>{filteredSurahs.length ? surahPage + 1 : 0} / {Math.max(1, Math.ceil(filteredSurahs.length / QURAN_SURAHS_PER_PAGE))}</span><button type="button" disabled={(surahPage + 1) * QURAN_SURAHS_PER_PAGE >= filteredSurahs.length} onClick={() => setSurahPage((page) => page + 1)} className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 disabled:opacity-40">Sonraki <ChevronRight className="h-4 w-4" /></button></div>
            </aside>
            <main className="min-w-0 space-y-5">
              <section className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-xl font-bold text-white">{selectedSurah.number}. {selectedSurah.name}</h2><p className="mt-1 text-sm text-emerald-300">{selectedSurah.verseCount} ayet · Sure tonu {selectedSurah.frequencyHz} Hz</p></div><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">Sure {selectedSurah.number} / {QURAN_SURAH_COUNT}</span></div>
                {loading && <p role="status" className="mt-5 text-sm text-slate-300">Sure ayetleri yükleniyor…</p>}
                {loadError && <div role="alert" className="mt-5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-200">{loadError}<button type="button" onClick={() => setReloadKey((key) => key + 1)} className="ml-3 underline">Yeniden dene</button></div>}
                {!loading && !loadError && <>
                  <div className="my-5 space-y-2"><h3 className="text-sm font-bold text-slate-200">Ayetler ({filteredVerses.length})</h3><div className="max-h-72 space-y-2 overflow-y-auto">{visibleVerses.map((verse) => <button type="button" key={verse.id} onClick={() => chooseVerse(verse.verseNumber)} aria-pressed={verse.verseNumber === selectedVerseNumber} className={`w-full rounded-xl border p-3 text-left transition ${verse.verseNumber === selectedVerseNumber ? 'border-emerald-400/70 bg-emerald-500/15' : 'border-slate-700 bg-slate-950/50 hover:border-emerald-500/50'}`}><span className="mb-1 block text-xs font-semibold text-emerald-300">Ayet {verse.verseNumber}</span><span lang="ar" dir="rtl" className="block break-words text-right text-lg leading-loose text-slate-100">{verse.arabic}</span><span className="mt-1 block text-xs leading-relaxed text-slate-400">{verse.translation}</span></button>)}{visibleVerses.length === 0 && <p className="py-4 text-sm text-slate-400">Bu surede aramanızla eşleşen ayet bulunamadı.</p>}</div><div className="flex items-center justify-between text-xs text-slate-400"><button type="button" disabled={versePage === 0} onClick={() => setVersePage((page) => Math.max(0, page - 1))} className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Önceki ayetler</button><span>{versePage + 1} / {versePageCount}</span><button type="button" disabled={(versePage + 1) * QURAN_VERSE_PAGE_SIZE >= filteredVerses.length} onClick={() => setVersePage((page) => page + 1)} className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 disabled:opacity-40">Sonraki ayetler <ChevronRight className="h-4 w-4" /></button></div></div>
                  {selectedVerse && <div className="border-t border-slate-800 pt-5"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-bold text-white">{selectedSurah.name} {selectedSurah.number}:{selectedVerse.verseNumber}</h3><span className="rounded-full border border-emerald-500/30 px-3 py-1 text-xs text-emerald-300">{frequency} Hz</span></div><p lang="ar" dir="rtl" className="my-5 break-words text-right text-2xl leading-loose text-white">{selectedVerse.arabic}</p><h4 className="font-bold text-emerald-300">Türkçe meal</h4><p className="mt-1 text-sm leading-relaxed text-slate-200">{selectedVerse.translation}</p><h4 className="mt-4 font-bold text-emerald-300">Okunuş</h4><p className="mt-1 text-sm text-slate-400">{selectedVerse.transliteration ?? 'QuranEnc’in seçilen meal API’si okunuş/transliterasyon alanı sağlamıyor. Teyitli okunuş kaynağı eklenmemiştir.'}</p><h4 className="mt-4 font-bold text-emerald-300">Anlam ve açıklama</h4><p className="mt-1 text-sm leading-relaxed text-slate-300">{selectedVerse.meaning || 'Kaynakta bu ayet için dipnot veya tefsir açıklaması bulunmuyor. Anlam için yukarıdaki kaynak mealini inceleyin.'}</p><h4 className="mt-4 font-bold text-emerald-300">Kullanım amacı</h4><p className="mt-1 text-sm text-slate-300">{selectedVerse.purposes.join(' · ')}. Belirli bir sonuç veya tedavi vaadi değildir.</p><p className="mt-4 text-[11px] text-slate-500">{QURAN_DATA_ATTRIBUTION} {translationInfo ? `Meal sürümü ${translationInfo.version}: ${translationInfo.title}.` : ''}</p></div>}
                </>}
              </section>
              <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-6">
                <h2 className="flex items-center gap-2 font-bold text-white"><Headphones className="h-5 w-5 text-emerald-300" /> Frekans seansı</h2><p className="mt-2 text-xs text-slate-400">Ayet {selectedVerseNumber} için uygulamanın ses tercihini seçin. Bu ses frekans tonudur; Kur’an tilaveti değildir.</p>
                <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => chooseFrequency(selectedSurah.frequencyHz)} aria-pressed={frequency === selectedSurah.frequencyHz} className={chip(frequency === selectedSurah.frequencyHz)}>Sure tonu · {selectedSurah.frequencyHz} Hz</button></div>
                <h3 className="mb-2 mt-4 text-xs font-bold text-slate-300">Süre</h3><div className="flex flex-wrap gap-2">{DUA_DURATIONS.map((duration) => <button type="button" key={duration} disabled={playing} onClick={() => { setMinutes(duration); setMessage(''); }} aria-pressed={minutes === duration} className={`${chip(minutes === duration)} disabled:opacity-60`}>{duration} dk</button>)}</div>
                <label className="mt-4 flex max-w-sm items-center gap-3 text-xs font-semibold text-slate-300">Ses seviyesi <input type="range" min="0" max="0.3" step="0.01" value={volume} onChange={(event) => setLevel(Number(event.target.value))} className="min-w-0 flex-1 accent-emerald-400" /> {Math.round(volume / 0.3 * 100)}%</label>
                <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={loading || Boolean(loadError)} onClick={playing ? () => { stop(); setMessage('Seans durduruldu.'); } : start} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{playing ? <><Square className="h-4 w-4" /> Durdur</> : <><Play className="h-4 w-4" /> Frekansı oynat</>}</button><span className="flex items-center gap-1 font-mono text-sm text-slate-200"><Clock className="h-4 w-4" /> {playing ? time : `${minutes.toString().padStart(2, '0')}:00`}</span><span role="status" className="text-sm text-emerald-300">{message}</span></div>
              </section>
              <section><h2 className="mb-3 text-lg font-bold text-white">Meditasyon Sistemleri</h2><p className="mb-3 text-xs text-slate-400">Akışlar seçili sure ve ayeti kullanır: {selectedSurah.name} {selectedSurah.number}:{selectedVerseNumber}.</p><div className="grid gap-3 sm:grid-cols-2">{MEDITATION_MODES.map((mode) => <article key={mode.id} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4"><h3 className="font-bold text-emerald-200">{mode.name}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{mode.description}</p><ol className="mt-3 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-slate-300">{mode.steps.map((step) => <li key={step}>{step}</li>)}</ol><p className="mt-3 text-xs text-slate-400">Önerilen: {mode.recommendedMinutes.join(', ')} dk</p><button type="button" disabled={loading || Boolean(loadError)} onClick={onMeditationClick} className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50">{playing ? 'Seansı durdur' : 'Seansı başlat'}</button></article>)}</div></section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
