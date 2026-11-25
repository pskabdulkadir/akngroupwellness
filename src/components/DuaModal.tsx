import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Clock, Headphones, Play, Search, Square, X } from 'lucide-react';
import { DUA_CATALOG, DUA_DURATIONS, MEDITATION_MODES } from '../data/duaCatalog';

type Session = { context: AudioContext; oscillator: OscillatorNode; gain: GainNode; endAt: number };

export function DuaModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [purpose, setPurpose] = useState('Tümü');
  const [selectedId, setSelectedId] = useState<string>(DUA_CATALOG[0].id);
  const [minutes, setMinutes] = useState<number>(5);
  const [frequency, setFrequency] = useState<number>(DUA_CATALOG[0].frequencyHz);
  const [volume, setVolume] = useState(0.12);
  const [remaining, setRemaining] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const session = useRef<Session | null>(null);
  const selected = DUA_CATALOG.find((item) => item.id === selectedId)!;
  const purposes = Array.from(new Set(DUA_CATALOG.flatMap((item) => [...item.purposes]))).sort((a, b) => a.localeCompare(b, 'tr'));
  const search = query.toLocaleLowerCase('tr').trim();
  const filtered = DUA_CATALOG.filter((item) => (purpose === 'Tümü' || (item.purposes as readonly string[]).includes(purpose)) && `${item.name} ${item.reference} ${item.meaning} ${item.purposes.join(' ')}`.toLocaleLowerCase('tr').includes(search));

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
    const current = session.current;
    session.current = null;
    if (current) {
      current.oscillator.onended = null;
      try { current.oscillator.stop(); } catch { /* Oscillator may already have ended. */ }
      void current.context.close();
    }
  }, []);

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

  const selectEntry = (id: string) => {
    stop();
    const entry = DUA_CATALOG.find((item) => item.id === id)!;
    setSelectedId(id);
    setFrequency(entry.frequencyHz);
    setMessage('');
  };
  const chooseFrequency = (value: number) => {
    stop();
    setFrequency(value);
    setMessage('');
  };
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
  const time = `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`;
  const chip = (active: boolean) => `rounded-xl border px-3 py-2 text-xs font-semibold transition ${active ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-emerald-500/60'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-labelledby="dua-title">
      <div className="flex max-h-[95dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-emerald-950 p-4 sm:p-6">
          <div className="flex items-center gap-3"><div className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-3"><BookOpen className="h-5 w-5 text-emerald-300" /></div><div><h1 id="dua-title" className="text-xl font-bold text-white">Dualar</h1><p className="text-xs text-slate-400">Ayetler, anlam ve tefekkür</p></div></div>
          <button type="button" onClick={onClose} aria-label="Duaları kapat" className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white"><X className="h-5 w-5" /></button>
        </header>
        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs leading-relaxed text-amber-100/90">Buradaki metinler seçili ayetler veya açıkça belirtilmiş bölümlerdir; Türkçe metinler kısa anlam aktarımlarıdır. Hz değerleri yalnızca uygulamanın ses tercihleridir; ayetlerle dinî, bilimsel veya tedavi edici bir bağlantısı gösterilmemiştir. Bu uygulama tıbbi bakımın yerine geçmez. Yalnızca ton üretilir, sesli Kur’an okuması yapılmaz. Sesi düşük tutun ve rahatsızlık hissederseniz durdurun.</div>
          <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="min-w-0 space-y-3">
              <h2 className="font-bold text-white">Sure ve ayet kataloğu <span className="text-xs font-normal text-slate-400">({DUA_CATALOG.length})</span></h2>
              <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sure, ayet veya konu ara" aria-label="Sure veya ayet ara" className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500" /></div>
              <select aria-label="Amaca göre filtrele" value={purpose} onChange={(event) => setPurpose(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-200"><option value="Tümü">Tüm konular</option>{purposes.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <div className="max-h-72 space-y-2 overflow-y-auto lg:max-h-[560px]">{filtered.length === 0 ? <p className="py-4 text-sm text-slate-400">Aramanızla eşleşen kayıt bulunamadı.</p> : filtered.map((item) => <button type="button" key={item.id} onClick={() => selectEntry(item.id)} aria-pressed={item.id === selectedId} className={`w-full rounded-xl border p-3 text-left transition ${item.id === selectedId ? 'border-emerald-400/70 bg-emerald-500/15' : 'border-slate-700 bg-slate-950/50 hover:border-emerald-500/50'}`}><span className="block text-sm font-bold text-slate-100">{item.name}</span><span className="mt-1 block text-xs text-slate-400">{item.reference} · {item.frequencyHz} Hz</span></button>)}</div>
            </aside>
            <main className="min-w-0 space-y-5">
              <section className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-xl font-bold text-white">{selected.name}</h2><p className="mt-1 text-sm text-emerald-300">{selected.reference}</p></div><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">{selected.frequencyHz} Hz</span></div>
                <p lang="ar" dir="rtl" className="my-6 break-words text-right text-2xl leading-loose text-white sm:text-3xl">{selected.arabic}</p>
                <div className="space-y-4 text-sm leading-relaxed"><div><h3 className="mb-1 font-bold text-emerald-300">Okunuş</h3><p className="text-slate-200">{selected.transliteration}</p></div><div><h3 className="mb-1 font-bold text-emerald-300">Türkçe anlam aktarımı</h3><p className="text-slate-200">{selected.translation}</p></div><div><h3 className="mb-1 font-bold text-emerald-300">Anlam ve yorum özeti</h3><p className="text-slate-300">{selected.meaning}</p></div><div><h3 className="mb-1 font-bold text-emerald-300">Tercih edilebilecek niyetler</h3><p className="text-slate-300">{selected.purposes.join(' · ')}</p></div></div>
              </section>
              <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-6">
                <h2 className="flex items-center gap-2 font-bold text-white"><Headphones className="h-5 w-5 text-emerald-300" /> Frekans seansı</h2>
                <p className="mt-2 text-xs text-slate-400">Bir ton ve süre seçin. Ton, süre sonunda otomatik olarak durur.</p>
                <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => chooseFrequency(selected.frequencyHz)} aria-pressed={frequency === selected.frequencyHz} className={chip(frequency === selected.frequencyHz)}>Sure tonu · {selected.frequencyHz} Hz</button>{selected.frequencyHz !== 432 && <button type="button" onClick={() => chooseFrequency(432)} aria-pressed={frequency === 432} className={chip(frequency === 432)}>Alternatif ton · 432 Hz</button>}</div>
                <h3 className="mb-2 mt-4 text-xs font-bold text-slate-300">Süre</h3><div className="flex flex-wrap gap-2">{DUA_DURATIONS.map((duration) => <button type="button" key={duration} disabled={playing} onClick={() => { setMinutes(duration); setMessage(''); }} aria-pressed={minutes === duration} className={`${chip(minutes === duration)} disabled:opacity-60`}>{duration} dk</button>)}</div>
                <label className="mt-4 flex max-w-sm items-center gap-3 text-xs font-semibold text-slate-300">Ses seviyesi <input type="range" min="0" max="0.3" step="0.01" value={volume} onChange={(event) => setLevel(Number(event.target.value))} className="min-w-0 flex-1 accent-emerald-400" /> {Math.round(volume / 0.3 * 100)}%</label>
                <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={playing ? () => { stop(); setMessage('Seans durduruldu.'); } : start} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400">{playing ? <><Square className="h-4 w-4" /> Durdur</> : <><Play className="h-4 w-4" /> Frekansı oynat</>}</button><span className="flex items-center gap-1 font-mono text-sm text-slate-200"><Clock className="h-4 w-4" /> {playing ? time : `${minutes.toString().padStart(2, '0')}:00`}</span><span role="status" className="text-sm text-emerald-300">{message}</span></div>
              </section>
              <section><h2 className="mb-3 text-lg font-bold text-white">Meditasyon Sistemleri</h2><div className="grid gap-3 sm:grid-cols-2">{MEDITATION_MODES.map((mode) => <article key={mode.id} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4"><h3 className="font-bold text-emerald-200">{mode.name}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{mode.description}</p><ol className="mt-3 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-slate-300">{mode.steps.map((step) => <li key={step}>{step}</li>)}</ol><p className="mt-3 text-xs text-slate-400">Önerilen: {mode.recommendedMinutes.join(', ')} dk</p><button type="button" onClick={() => playing ? (stop(), setMessage('Seans durduruldu.')) : void start()} className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20">{playing ? 'Seansı durdur' : 'Seansı başlat'}</button></article>)}</div></section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
