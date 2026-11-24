import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Clock, Info, Music, Play, Search, ShieldCheck, Sparkles, Square, Volume2, Waves } from 'lucide-react';
import { BERHETIYYE_CLEANING_STAGES, BERHETIYYE_FREQUENCIES, BERHETIYYE_PURPOSES, BERHETIYYE_READINGS } from '../data/berhetiyye';
import type { BerhetiyyeFrequency, BerhetiyyePurpose, BerhetiyyeReading } from '../data/berhetiyye';
import { soundEngine } from '../utils/soundEngine';
import { PageNavBar } from './PageNavBar';

interface BerhetiyyePanelProps {
  onGoBack?: () => void;
  onGoHome?: () => void;
}

type SectionKey = 'overview' | 'readings' | 'frequencies' | 'cleaning' | 'purposes' | 'practice';
type SessionState = {
  name: string;
  frequencyHz: number;
  binauralHz: number;
  startedAt: number;
  durationSeconds: number;
  loop: boolean;
  kind: 'single' | 'cleaning';
  phaseIndex: number;
};

const SECTIONS: { id: SectionKey; title: string }[] = [
  { id: 'overview', title: 'Genel Bakış' },
  { id: 'readings', title: '28 Maddelik Tertip' },
  { id: 'frequencies', title: 'Frekans Kataloğu' },
  { id: 'cleaning', title: 'Arınma Seansı' },
  { id: 'purposes', title: 'Amaçlar' },
  { id: 'practice', title: 'Kullanım Rehberi' },
];

const PURPOSE_FILTERS: (BerhetiyyePurpose | 'Tümü')[] = ['Tümü', 'Arınma', 'Koruma', 'Denge', 'Canlılık', 'Odak'];

const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.max(0, seconds % 60).toString().padStart(2, '0')}`;

export const BerhetiyyePanel: React.FC<BerhetiyyePanelProps> = ({ onGoBack, onGoHome }) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState<BerhetiyyePurpose | 'Tümü'>('Tümü');
  const [durationChoice, setDurationChoice] = useState('5');
  const [customMinutes, setCustomMinutes] = useState('10');
  const [loop, setLoop] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [session, setSession] = useState<SessionState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sessionRef = useRef<SessionState | null>(null);

  const setActiveSession = (next: SessionState | null) => {
    sessionRef.current = next;
    setSession(next);
  };

  const sessionMinutes = durationChoice === 'custom'
    ? Math.max(1, Math.min(180, Number(customMinutes) || 1))
    : Number(durationChoice);
  const filteredReadings = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr');
    return BERHETIYYE_READINGS.filter((reading) => {
      const matchesPurpose = purposeFilter === 'Tümü' || reading.purpose === purposeFilter;
      const searchText = `${reading.order} ${reading.name} ${reading.arabic} ${reading.letter} ${reading.focus} ${reading.purpose}`.toLocaleLowerCase('tr');
      return matchesPurpose && (!query || searchText.includes(query));
    });
  }, [purposeFilter, searchQuery]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => {
      if (!soundEngine.getIsPlaying()) {
        setActiveSession(null);
        return;
      }
      const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      setElapsedSeconds(session.loop ? elapsed % session.durationSeconds : Math.min(elapsed, session.durationSeconds));

      if (session.kind === 'cleaning') {
        const phaseDuration = session.durationSeconds / BERHETIYYE_CLEANING_STAGES.length;
        const cycleLength = phaseDuration * BERHETIYYE_CLEANING_STAGES.length;
        const cycleElapsed = session.loop ? elapsed % cycleLength : elapsed;
        const nextPhaseIndex = Math.min(BERHETIYYE_CLEANING_STAGES.length - 1, Math.floor(cycleElapsed / phaseDuration));
        if (nextPhaseIndex !== session.phaseIndex) {
          const phase = BERHETIYYE_CLEANING_STAGES[nextPhaseIndex];
          soundEngine.transitionFrequencySmooth(phase.frequencyHz, 7.83, 2);
          setActiveSession({ ...session, frequencyHz: phase.frequencyHz, name: phase.title, phaseIndex: nextPhaseIndex });
        }
        if (!session.loop && elapsed >= cycleLength) {
          soundEngine.stop();
          setActiveSession(null);
        }
      } else if (!session.loop && elapsed >= session.durationSeconds) {
        soundEngine.stop();
        setActiveSession(null);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  useEffect(() => () => {
    if (sessionRef.current) soundEngine.stop();
  }, []);

  const startFrequency = async (frequency: BerhetiyyeFrequency) => {
    if (session?.name === frequency.name && session.frequencyHz === frequency.frequencyHz) {
      soundEngine.stop();
      setActiveSession(null);
      return;
    }
    await soundEngine.unlockAudio();
    soundEngine.startAdaptiveBioFrequency(frequency.frequencyHz, frequency.binauralHz, 'alpha', volume, 'none');
    soundEngine.setVolume(volume);
    setElapsedSeconds(0);
    setActiveSession({
      name: frequency.name,
      frequencyHz: frequency.frequencyHz,
      binauralHz: frequency.binauralHz,
      startedAt: Date.now(),
      durationSeconds: sessionMinutes * 60,
      loop,
      kind: 'single',
      phaseIndex: 0,
    });
  };

  const startCleaningSession = async () => {
    await soundEngine.unlockAudio();
    const firstStage = BERHETIYYE_CLEANING_STAGES[0];
    soundEngine.startAdaptiveBioFrequency(firstStage.frequencyHz, 7.83, 'alpha', volume, 'none');
    soundEngine.setVolume(volume);
    setElapsedSeconds(0);
    setActiveSession({
      name: firstStage.title,
      frequencyHz: firstStage.frequencyHz,
      binauralHz: 7.83,
      startedAt: Date.now(),
      durationSeconds: sessionMinutes * BERHETIYYE_CLEANING_STAGES.length * 60,
      loop,
      kind: 'cleaning',
      phaseIndex: 0,
    });
  };

  const stopSession = () => {
    soundEngine.stop();
    setActiveSession(null);
    setElapsedSeconds(0);
  };

  const updateVolume = (value: number) => {
    setVolume(value);
    soundEngine.setVolume(value);
  };

  const renderReadingCard = (reading: BerhetiyyeReading) => (
    <article key={reading.order} className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-sm font-bold text-violet-200">{reading.order}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-100">{reading.name}</h3>
            <p className="text-xs text-slate-400">{reading.letter} · {reading.purpose}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs font-bold text-cyan-200">{reading.frequencyHz} Hz</span>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-right font-arabic text-lg text-amber-200">{reading.arabic}</div>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <p className="rounded-lg bg-slate-950/50 p-2.5 text-slate-300"><strong className="text-slate-100">Odak:</strong> {reading.focus}</p>
        <p className="rounded-lg bg-slate-950/50 p-2.5 text-slate-300"><strong className="text-slate-100">Ses profili:</strong> {reading.waveProfile}</p>
      </div>
      <p className="text-xs leading-relaxed text-slate-300"><strong className="text-violet-200">Uygulama:</strong> {reading.readingGuide}</p>
    </article>
  );

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-5 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <PageNavBar
        title="Berhetiyye"
        subtitle="Geleneksel tertip ve uygulama içi sesli odak rehberi"
        icon={<Sparkles className="h-4 w-4 text-violet-300" />}
        badge={`${BERHETIYYE_READINGS.length} tertip maddesi`}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Berhetiyye bölümleri">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`min-h-11 shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${activeSection === section.id ? 'border-violet-400/50 bg-violet-500/20 text-violet-200' : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200'}`}
          >
            {section.title}
          </button>
        ))}
      </nav>

      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-violet-950/50 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-200"><Waves className="h-3.5 w-3.5" /> AuraBio uygulama içi sesli odak deneyimi</p>
            <h2 className="mt-3 text-xl font-black text-slate-100">Berhetiyye tertibi ve frekans rehberi</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-300">Bu bölüm, geleneksel metinlerde farklı yazım ve okunuşlarla aktarılan 28 maddelik bir tertip varyantını kültürel bilgi ve kişisel tefekkür amacıyla sunar. Frekans eşleştirmeleri AuraBio içi ses kürasyonudur; tarihsel metnin parçası veya kanıtlanmış bir etki değildir.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <Clock className="h-4 w-4 text-cyan-300" />
              <select value={durationChoice} onChange={(event) => setDurationChoice(event.target.value)} className="min-h-10 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100">
                {[3, 5, 11, 21, 33].map((minutes) => <option key={minutes} value={minutes}>{minutes} dakika</option>)}
                <option value="custom">Özel süre</option>
              </select>
            </label>
            {durationChoice === 'custom' && <input aria-label="Özel seans süresi dakika" type="number" min="1" max="180" value={customMinutes} onChange={(event) => setCustomMinutes(event.target.value)} className="h-10 w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100" />}
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-2 text-xs text-slate-300">
              <input type="checkbox" checked={loop} onChange={(event) => {
                const nextLoop = event.target.checked;
                setLoop(nextLoop);
                if (session) setActiveSession({ ...session, loop: nextLoop });
              }} /> Döngü
            </label>
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-2 text-xs text-slate-300">
              <Volume2 className="h-4 w-4" />
              <input aria-label="Ses seviyesi" type="range" min="0" max="0.8" step="0.05" value={volume} onChange={(event) => updateVolume(Number(event.target.value))} className="w-20 accent-violet-400" />
              {Math.round(volume * 100)}%
            </label>
          </div>
        </div>
        {session && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300"><Music className="h-4 w-4" /></span>
              <div><p className="text-xs font-bold text-emerald-200">{session.name} · {session.frequencyHz} Hz {session.loop ? '· Döngü açık' : ''}</p><p className="text-[11px] text-slate-300">{session.kind === 'cleaning' ? `Aşama ${session.phaseIndex + 1}/3` : 'Seans sürüyor'} · Geçen {formatTime(elapsedSeconds)}{session.loop ? ' · Döngü açık' : ` · Kalan ${formatTime(Math.max(0, session.durationSeconds - elapsedSeconds))}`}</p></div>
            </div>
            <button onClick={stopSession} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 text-xs font-bold text-rose-200"><Square className="h-3.5 w-3.5 fill-current" /> Durdur</button>
          </div>
        )}
      </section>

      {activeSection === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <h3 className="flex items-center gap-2 font-bold text-slate-100"><BookOpen className="h-4 w-4 text-violet-300" /> Tanıtım ve kültürel çerçeve</h3>
            <p className="text-xs leading-relaxed text-slate-300">Berhetiyye adı, bazı geleneksel havas ve dua literatüründe belirli isimlerden oluşan sıralı bir tertip için kullanılır. Yazım, okunuş ve açıklamalar kaynaklar arasında değişebilir; bu ekrandaki adlar yaygın aktarımlardan bir okunuş varyantıdır.</p>
            <p className="text-xs leading-relaxed text-slate-300">Uygulamada sıralı okuma; metni dikkatle takip etme, ritimli nefes ve sesli odak deneyimi olarak ele alınır. Buradaki Hz değerleri modern uygulama içi ton seçimleridir; isimlerin geleneksel veya tarihsel frekansları oldukları ileri sürülmez.</p>
          </article>
          <article className="rounded-2xl border border-amber-500/20 bg-amber-950/15 p-5 space-y-3">
            <h3 className="flex items-center gap-2 font-bold text-amber-100"><Info className="h-4 w-4" /> Okuma ve ses güvenliği</h3>
            <p className="text-xs leading-relaxed text-slate-300">Okumayı sessiz veya rahat bir sesle yapın; tekrar sayılarını zorunluluk değil, isteğe bağlı odak önerisi olarak görün. Sesi düşük seviyeden başlatın, kulaklıkta rahatsızlık hissederseniz durdurun ve sessizce dinlenin.</p>
            <p className="text-xs leading-relaxed text-slate-300">Bu içerik kültürel/kişisel tefekkür ve ses deneyimidir; varlık tespiti, musallat giderme, tıbbi, psikiyatrik veya hukuki tanı/tedavi değildir.</p>
          </article>
        </div>
      )}

      {activeSection === 'readings' && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Sıra, isim, harf veya amaç ara..." className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 text-xs text-slate-100 placeholder:text-slate-500" /></label>
              <select aria-label="Amaca göre filtrele" value={purposeFilter} onChange={(event) => setPurposeFilter(event.target.value as BerhetiyyePurpose | 'Tümü')} className="min-h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100">{PURPOSE_FILTERS.map((purpose) => <option key={purpose} value={purpose}>{purpose === 'Tümü' ? 'Tüm amaçlar' : purpose}</option>)}</select>
            </div>
            <p className="text-[11px] text-slate-400">{filteredReadings.length} / 28 madde · Yazım ve okunuşlar aktarım varyantı içerebilir.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">{filteredReadings.map(renderReadingCard)}</div>
          {filteredReadings.length === 0 && <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">Bu arama ölçütlerine uygun tertip maddesi bulunamadı.</p>}
        </section>
      )}

      {activeSection === 'frequencies' && (
        <section className="space-y-3">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/15 p-4 text-xs leading-relaxed text-slate-300">Katalogdaki taşıyıcı tonlar ve binaural aralıklar, oynatıcı için seçilmiş uygulama parametreleridir. Belirli sağlık, ruhsal veya metafizik etkileri olduğu iddia edilmez.</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{BERHETIYYE_FREQUENCIES.map((frequency) => (
            <FrequencyCard key={frequency.id} frequency={frequency} active={session?.frequencyHz === frequency.frequencyHz && session.kind === 'single'} onPlay={() => void startFrequency(frequency)} />
          ))}</div>
        </section>
      )}

      {activeSection === 'cleaning' && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-violet-200">Ağır enerji / musallat hissi için sakinleşme ve ortam düzenleme</p>
            <h3 className="mt-2 text-lg font-bold text-slate-100">3 aşamalı sesli odak seansı</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">Bu akış geleneksel/kişisel bir rahatlama deneyimidir; bir varlığın bulunduğunu doğrulamaz veya varlık temizleme garantisi vermez. Kendinizi güvende hissetmiyorsanız güvendiğiniz bir kişiden destek alın; acil tehlikede yerel acil yardım hizmetlerine başvurun.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">{BERHETIYYE_CLEANING_STAGES.map((stage) => (
            <article key={stage.order} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <p className="text-[11px] font-semibold text-violet-300">Aşama {stage.order} · {sessionMinutes} dakika · {stage.frequencyHz} Hz</p>
              <h4 className="font-bold text-slate-100">{stage.title}</h4>
              <p className="text-xs leading-relaxed text-slate-300">{stage.instructions}</p>
            </article>
          ))}</div>
          <button onClick={() => void startCleaningSession()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-violet-400 sm:w-auto"><Play className="h-4 w-4 fill-current" /> Temizleme Seansı Başlat</button>
          <p className="text-[11px] text-slate-500">Her aşama üstte seçili süre kadar sürer; aşamalar 174 → 432 → 639 Hz şeklinde yumuşak geçişle oynatılır. Döngü seçeneği açık ise program baştan tekrar eder.</p>
        </section>
      )}

      {activeSection === 'purposes' && (
        <section className="grid gap-3 md:grid-cols-2">{BERHETIYYE_PURPOSES.map((purpose) => (
          <article key={purpose.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300">{purpose.category}</p>
            <h3 className="font-bold text-slate-100">{purpose.title}</h3>
            <p className="text-xs text-slate-300"><strong className="text-slate-100">Uygulama içi frekans önerileri:</strong> {purpose.frequencies}</p>
            <p className="text-xs text-slate-300"><strong className="text-slate-100">Öne çıkan tertip maddeleri:</strong> {purpose.readingGroups}</p>
            <p className="text-xs leading-relaxed text-slate-400">{purpose.note}</p>
          </article>
        ))}</section>
      )}

      {activeSection === 'practice' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <h3 className="font-bold text-slate-100">Günlük veya ihtiyaç bazlı kullanım</h3>
            <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed text-slate-300">
              <li>Sessiz ve rahat bir ortam seçin; isterseniz ortamı havalandırıp cihaz sesini kapatın.</li>
              <li>Genel bakıştan veya arama/filtreyle 1–28 arasındaki maddelerden birini seçin.</li>
              <li>İsmi sessiz ya da rahat sesle okuyun; tekrar önerileri zorunlu değildir.</li>
              <li>İsterseniz frekans kataloğundan ton, süre ve ses seviyesini seçip dinlemeyi başlatın.</li>
              <li>Haftalık kullanımda kısa ve düzenli seansları tercih edin; her seans sonrası birkaç dakika dinlenin.</li>
            </ol>
          </article>
          <article className="rounded-2xl border border-amber-500/20 bg-amber-950/15 p-5 space-y-3">
            <h3 className="flex items-center gap-2 font-bold text-amber-100"><ShieldCheck className="h-4 w-4" /> Güvenlik ve sorumluluk</h3>
            <p className="text-xs leading-relaxed text-slate-300">Frekans/ses tercihleri kişisel konfor içindir; duyma hassasiyeti veya rahatsızlık durumunda sesi durdurun. Bu içerik geleneksel-kültürel ve frekans temelli bir uygulama içi deneyim sunar; tıbbi, psikiyatrik veya hukuki tanı/tedavi yerine geçmez.</p>
            <p className="text-xs leading-relaxed text-slate-300">Korku, uykusuzluk veya yoğun sıkıntı sürüyorsa uygulamadaki ses seansına dayanmak yerine güvendiğiniz biriyle ve uygun bir sağlık uzmanıyla görüşün.</p>
          </article>
        </section>
      )}
    </div>
  );
};

const FrequencyCard: React.FC<{ frequency: BerhetiyyeFrequency; active: boolean; onPlay: () => void }> = ({ frequency, active, onPlay }) => (
  <article className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-slate-100">{frequency.name}</h3>
        <span className="shrink-0 rounded-lg bg-cyan-500/10 px-2 py-1 font-mono text-xs font-bold text-cyan-200">{frequency.frequencyHz} Hz</span>
      </div>
      <p className="text-[11px] font-semibold text-violet-300">{frequency.category} · Önerilen {frequency.durationMinutes} dk</p>
      <p className="text-xs leading-relaxed text-slate-300">{frequency.purpose}</p>
      <p className="text-[11px] text-slate-400">{frequency.profile} · Binaural aralık {frequency.binauralHz} Hz</p>
    </div>
    <button onClick={onPlay} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${active ? 'bg-rose-500/15 text-rose-200 border border-rose-400/30' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'}`}>
      {active ? <><Square className="h-3.5 w-3.5 fill-current" /> Durdur</> : <><Play className="h-3.5 w-3.5 fill-current" /> Oynat</>}
    </button>
  </article>
);
