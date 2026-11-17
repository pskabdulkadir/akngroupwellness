import React, { useState } from 'react';
import { BookOpen, Eye, Info, Moon, Play, Search, Sparkles, Square, X } from 'lucide-react';
import { AYET_LIST } from '../data/ayetData';
import { ESMA_LIST } from '../data/esmaData';
import { PARANORMAL_ARCHIVE_ITEMS, ParanormalArchiveCategory, SPIRITUAL_FREQUENCY_PROTOCOLS } from '../data/paranormalArchive';
import { QURAN_SURAH_DISCLAIMER, QURAN_SURAH_THERAPY } from '../data/quranSurahTherapy';
import { soundEngine } from '../utils/soundEngine';
import { ActiveMeditation, FrequencyMeditationPanel } from './FrequencyMeditationPanel';
import { NazarSelfCheck } from './NazarSelfCheck';

interface ParanormalArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ArchiveTab = 'stories' | 'reflection' | 'protocols';
type StoryFilter = 'all' | ParanormalArchiveCategory;

const CATEGORY_LABELS: Record<ParanormalArchiveCategory, string> = {
  'ottoman-historical': 'Osmanlı arşivi ve tarihi vakalar',
  'classical-havas': 'Klasik havas ve manevi gözlemler',
  'sufi-hagiography': 'İslam âlimlerinin menkıbeleri',
  'islamic-folklore': 'Anadolu ve İslam coğrafyası folkloru',
  'global-historical-accounts': 'Küresel tarihsel anlatılar',
};

const PRACTICES = [
  ...AYET_LIST.map((item) => ({
    id: item.id,
    title: `${item.surah} ${item.verseNumber}`,
    arabic: item.arabic,
    meaning: item.turkishTranslation,
    kind: 'Ayet',
    frequencyHz: item.frequencyHz,
  })),
  ...ESMA_LIST.map((item) => ({
    id: item.id,
    title: item.name,
    arabic: item.arabic,
    meaning: item.meaning,
    kind: 'Esmaü’l Hüsna',
    frequencyHz: item.frequencyHz || item.frequency,
  })),
];

export const ParanormalArchiveModal: React.FC<ParanormalArchiveModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ArchiveTab>('stories');
  const [storyFilter, setStoryFilter] = useState<StoryFilter>('all');
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [meditation, setMeditation] = useState<ActiveMeditation | null>(null);

  if (!isOpen) return null;

  const query = search.trim().toLocaleLowerCase('tr');
  const stories = PARANORMAL_ARCHIVE_ITEMS.filter((item) => {
    const matchesCategory = storyFilter === 'all' || item.category === storyFilter;
    const matchesSearch = `${item.title} ${item.centuryOrPeriod} ${CATEGORY_LABELS[item.category]} ${item.narrative}`
      .toLocaleLowerCase('tr')
      .includes(query);
    return matchesCategory && matchesSearch;
  });
  const practices = PRACTICES.filter((item) => `${item.title} ${item.meaning} ${item.kind}`.toLocaleLowerCase('tr').includes(query));
  const protocols = SPIRITUAL_FREQUENCY_PROTOCOLS.filter((item) => `${item.title} ${item.spiritualBasis} ${item.reflectionText}`.toLocaleLowerCase('tr').includes(query));
  const surahs = QURAN_SURAH_THERAPY.filter((item) => `${item.name} ${item.theme} ${item.frequencyHz} ${item.applicationSteps.join(' ')}`.toLocaleLowerCase('tr').includes(query));

  const stopAllSound = () => {
    soundEngine.stopAll();
    setPlayingId(null);
    setMeditation(null);
  };

  const switchTab = (tab: ArchiveTab) => {
    stopAllSound();
    setActiveTab(tab);
    setSearch('');
  };

  const toggleTone = async (id: string, frequencyHz: number) => {
    if (playingId === id) {
      stopAllSound();
      return;
    }
    stopAllSound();
    await soundEngine.unlockAudio();
    soundEngine.playTone(frequencyHz, 0.07);
    soundEngine.playSoundscape('ocean', 0.25);
    setPlayingId(id);
  };

  const startMeditation = async (sessionKey: string, frequencyHz: number, durationMinutes: number) => {
    stopAllSound();
    await soundEngine.unlockAudio();
    soundEngine.playTone(frequencyHz, 0.07);
    soundEngine.playSoundscape('ocean', 0.25);
    setMeditation({ key: sessionKey, frequencyHz, durationMinutes, startedAt: Date.now() });
  };

  const close = () => {
    stopAllSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-2 backdrop-blur-md sm:p-5">
      <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-violet-500/30 bg-slate-900 shadow-2xl shadow-violet-950/30">
        <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-gradient-to-r from-violet-950 via-slate-950 to-indigo-950 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-violet-400/30 bg-violet-400/10 p-3 text-violet-200"><Eye className="h-5 w-5" /></div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Anlatılar ve Manevi Tefekkür</div>
              <h2 className="text-lg font-bold text-white sm:text-2xl">Paranormal Arşiv</h2>
            </div>
          </div>
          <button onClick={close} aria-label="Kapat" className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex gap-2 border-b border-amber-500/20 bg-amber-950/30 px-4 py-3 text-xs leading-relaxed text-amber-100/90 sm:px-6">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p>Bu ekran folklorik, tarihsel ve manevi tefekkür amaçlıdır; tıbbi veya psikiyatrik tanı/tedavi değildir. Tanıklıklar paranormal açıklamayı kanıtlamaz. Süregelen korku, uykusuzluk veya algı deneyimleri sıkıntı veriyorsa sağlık uzmanına başvurun.</p>
        </div>

        <div className="space-y-3 border-b border-slate-800 bg-slate-950/70 p-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => switchTab('stories')} className={`rounded-xl px-4 py-2 text-xs font-bold ${activeTab === 'stories' ? 'bg-violet-500 text-white' : 'border border-slate-700 bg-slate-900 text-slate-300'}`}><BookOpen className="mr-1.5 inline h-4 w-4" />Olay anlatıları · {PARANORMAL_ARCHIVE_ITEMS.length}</button>
            <button onClick={() => switchTab('reflection')} className={`rounded-xl px-4 py-2 text-xs font-bold ${activeTab === 'reflection' ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700 bg-slate-900 text-slate-300'}`}><Moon className="mr-1.5 inline h-4 w-4" />Ayet ve Esma · {PRACTICES.length}</button>
            <button onClick={() => switchTab('protocols')} className={`rounded-xl px-4 py-2 text-xs font-bold ${activeTab === 'protocols' ? 'bg-indigo-500 text-white' : 'border border-slate-700 bg-slate-900 text-slate-300'}`}><Sparkles className="mr-1.5 inline h-4 w-4" />Tefekkür seansları · {SPIRITUAL_FREQUENCY_PROTOCOLS.length}</button>
          </div>
          {activeTab === 'stories' && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['all', 'ottoman-historical', 'classical-havas', 'sufi-hagiography', 'islamic-folklore', 'global-historical-accounts'] as StoryFilter[]).map((category) => {
                const label = category === 'all' ? 'Tüm kategoriler' : CATEGORY_LABELS[category];
                const count = category === 'all' ? PARANORMAL_ARCHIVE_ITEMS.length : PARANORMAL_ARCHIVE_ITEMS.filter((item) => item.category === category).length;
                return <button key={category} onClick={() => setStoryFilter(category)} className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-semibold ${storyFilter === category ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/50' : 'bg-slate-900 text-slate-400 ring-1 ring-slate-800'}`}>{label} · {count}</button>;
              })}
            </div>
          )}
          <label className="relative block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={activeTab === 'stories' ? 'Olay, dönem veya kategori ara' : activeTab === 'reflection' ? 'Sure, ayet, Esma veya anlam ara' : 'Seans adı, manevi dayanak veya tefekkür metni ara'} className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'stories' ? (
            <>
              <div className="mb-4 text-[11px] text-slate-400">Kart görselleri temsili ve dekoratiftir; olay fotoğrafı değildir. Kayıtlarda farklı Hz ses seçenekleri kullanılır; frekansların konuya göre kanıtlanmış rahatlatıcı etkisi yoktur ve kişisel ses tercihi değişebilir. Arşivde {PARANORMAL_ARCHIVE_ITEMS.length} kaynak türü açıkça etiketlenmiş kayıt bulunuyor. Menkıbeler ve halk anlatıları tarihsel belgeyle doğrulanmış olaylar olarak sunulmaz.</div>
              {storyFilter === 'classical-havas' && <div className="mb-4"><NazarSelfCheck /></div>}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {stories.map((item, index) => (
                  <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                    <div className={`relative flex h-32 items-end overflow-hidden bg-gradient-to-br ${item.palette} p-4`}>
                      <div className="absolute right-4 top-3 opacity-25"><Eye className="h-16 w-16" /></div>
                      <div className="relative rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-semibold text-white/80">Temsili görsel · {String(index + 1).padStart(2, '0')}</div>
                    </div>
                    <div className="space-y-2.5 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-violet-300">{CATEGORY_LABELS[item.category]} · {item.centuryOrPeriod}</div>
                      <h3 className="text-sm font-bold leading-snug text-white">{item.title}</h3>
                      <p className="text-xs leading-relaxed text-slate-300">{item.narrative}</p>
                      <div className="rounded-xl bg-slate-900/80 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Kaydedilen anlatım</div>
                        <ul className="mt-1 list-inside list-disc space-y-1 text-[11px] text-slate-300">{item.symptomsOrPhenomena.map((phenomenon) => <li key={phenomenon}>{phenomenon}</li>)}</ul>
                      </div>
                      <p className="text-[11px] leading-relaxed text-emerald-100/80">{item.spiritualReflection}</p>
                      <p className="border-t border-slate-800 pt-2 text-[10px] leading-relaxed text-slate-500">Kaynak/başvuru: {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-violet-300 underline underline-offset-2">{item.historicalSource}</a> : item.historicalSource}</p>
                      <button onClick={() => void toggleTone(item.id, item.frequencyHz)} className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${playingId === item.id ? 'bg-rose-600 text-white' : 'bg-slate-800 text-emerald-200 hover:bg-slate-700'}`}>
                        {playingId === item.id ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        {playingId === item.id ? 'Sesi durdur' : `${item.frequencyHz} Hz ambient tonu dinle`}
                      </button>
                      <FrequencyMeditationPanel sessionKey={`story-${item.id}`} frequencyHz={item.frequencyHz} active={meditation} onStart={startMeditation} onStop={stopAllSound} />
                    </div>
                  </article>
                ))}
              </div>
              {stories.length === 0 && <p className="py-12 text-center text-sm text-slate-400">Bu filtre ve aramayla eşleşen kaynaklı kayıt bulunamadı.</p>}
            </>
          ) : activeTab === 'reflection' ? (
            <>
              <section className="mb-6 space-y-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-300">Kur’an-ı Kerim sûre frekansları</div>
                  <h3 className="mt-1 text-sm font-bold text-white">Sûre bazlı tefekkür ve terapi protokolü</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{QURAN_SURAH_DISCLAIMER}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {surahs.map((surah) => (
                    <article key={surah.id} className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-emerald-950 px-2.5 py-1 text-[10px] font-bold text-emerald-300">{surah.verseCount} ayet</span>
                        <span className="rounded-lg border border-emerald-400/20 bg-emerald-950/50 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-200">{surah.frequencyHz} Hz</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{surah.name} Sûresi</h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{surah.theme}</p>
                      <ol className="mt-3 space-y-1.5">
                        {surah.applicationSteps.map((step, index) => (
                          <li key={step} className="flex gap-2 text-[11px] leading-relaxed text-slate-300">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-200">{index + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                      <button onClick={() => void toggleTone(surah.id, surah.frequencyHz)} className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${playingId === surah.id ? 'bg-rose-600 text-white' : 'bg-slate-800 text-emerald-200 hover:bg-slate-700'}`}>
                        {playingId === surah.id ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        {playingId === surah.id ? 'Sesi durdur' : `${surah.frequencyHz} Hz tonu dinle`}
                      </button>
                      <FrequencyMeditationPanel sessionKey={`surah-${surah.id}`} frequencyHz={surah.frequencyHz} active={meditation} onStart={startMeditation} onStop={stopAllSound} />
                    </article>
                  ))}
                </div>
                {surahs.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Bu aramayla eşleşen sûre bulunamadı.</p>}
              </section>
              <div className="mb-4 flex gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs leading-relaxed text-emerald-100/80"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Bu bölüm dini metinleri kişisel tefekkür ve dinleme amacıyla sunar. İsteğe bağlı ses tonu genel bir ambient seçeneğidir; ayet veya Esma’ya ait bilimsel/tedavi edici frekans olduğu anlamına gelmez. Sağlık tanısı veya tedavisi yerine geçmez.</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {practices.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2"><span className="rounded-full bg-emerald-950 px-2.5 py-1 text-[10px] font-bold text-emerald-300">{item.kind}</span><button onClick={() => void toggleTone(item.id, item.frequencyHz)} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${playingId === item.id ? 'bg-rose-600 text-white' : 'bg-slate-800 text-emerald-200 hover:bg-slate-700'}`}>{playingId === item.id ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />} {playingId === item.id ? 'Durdur' : `${item.frequencyHz} Hz tefekkür tonu`}</button></div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p dir="rtl" className="mt-2 text-right font-serif text-xl leading-loose text-emerald-100">{item.arabic}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">{item.meaning}</p>
                    <FrequencyMeditationPanel sessionKey={`practice-${item.id}`} frequencyHz={item.frequencyHz} active={meditation} onStart={startMeditation} onStop={stopAllSound} />
                  </article>
                ))}
              </div>
              {practices.length === 0 && <p className="py-12 text-center text-sm text-slate-400">Bu aramayla eşleşen içerik yok.</p>}
            </>
          ) : (
            <>
              <div className="mb-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-3 text-xs leading-relaxed text-indigo-100/80">Hz değeri yalnızca ses üretim parametresidir; DNA, aura, çakra veya ruhsal durum üzerinde kanıtlanmış etkisi yoktur. “Aura arındırma” ve “yıldız yükseltme” ifadeleri kişisel tefekkür metaforlarıdır.</div>
              <div className="grid gap-4 lg:grid-cols-2">
                {protocols.map((protocol) => (
                  <article key={protocol.id} className="rounded-2xl border border-indigo-500/20 bg-slate-950/70 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><div className="text-[10px] font-bold uppercase tracking-wide text-indigo-300">Manevi tefekkür</div><h3 className="mt-1 text-base font-bold text-white">{protocol.title}</h3></div>
                      <span className="rounded-xl border border-indigo-400/20 bg-indigo-950/50 px-3 py-2 font-mono text-sm font-bold text-indigo-200">{protocol.frequencyHz} Hz</span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-300">Dayanak: {protocol.spiritualBasis}</p>
                    <ol className="mt-4 space-y-2">{protocol.applicationSteps.map((step, index) => <li key={step} className="flex gap-2 text-xs leading-relaxed text-slate-300"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-200">{index + 1}</span>{step}</li>)}</ol>
                    <button onClick={() => void toggleTone(protocol.id, protocol.frequencyHz)} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${playingId === protocol.id ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                      {playingId === protocol.id ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {playingId === protocol.id ? 'Seansı durdur' : `${protocol.frequencyHz} Hz tefekkür seansını başlat`}
                    </button>
                    {playingId === protocol.id && <p className="mt-3 rounded-xl bg-slate-900 p-3 text-sm leading-relaxed text-indigo-100">{protocol.reflectionText}</p>}
                    <FrequencyMeditationPanel sessionKey={`protocol-${protocol.id}`} frequencyHz={protocol.frequencyHz} active={meditation} onStart={startMeditation} onStop={stopAllSound} />
                    <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{protocol.disclaimer}</p>
                  </article>
                ))}
              </div>
              {protocols.length === 0 && <p className="py-12 text-center text-sm text-slate-400">Bu aramayla eşleşen seans bulunamadı.</p>}
            </>
          )}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950 px-4 py-3 text-[10px] text-slate-500 sm:px-6">
          <span>Tanıklıklar ile doğrulanmış açıklamalar birbirinden ayrı sunulur.</span>
          <button onClick={close} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700">Kapat</button>
        </footer>
      </section>
    </div>
  );
};
