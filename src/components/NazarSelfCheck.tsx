import React, { useState } from 'react';
import { Info, RotateCcw } from 'lucide-react';

const QUESTIONS = [
  'Sebebi belli olmayan, dinlenmekle geçmeyen bir halsizlik yaşıyor musunuz?',
  'Sık tekrarlayan baş ağrısı ya da migren benzeri ağrılarınız oldu mu?',
  'Nedensiz mide bulantısı veya ani iştahsızlık yaşadınız mı?',
  'Gözlerinizde sebepsiz sulanma ya da yanma oldu mu?',
  'Çevrenizdeki insanlardan uzaklaşıp yalnız kalma isteği duydunuz mu?',
  'Sebepsiz bir huzursuzluk ya da iç sıkıntısı hissettiniz mi?',
  'Yakın çevrenizde eşyaların aniden bozulduğunu veya kırıldığını fark ettiniz mi?',
];

const LEVELS = [
  {
    max: 1,
    label: 'Düşük',
    tone: 'text-emerald-300',
    text: 'Bildirdiğiniz belirtiler az. Mevcut düzeninizi ve dinlenmenizi sürdürmeniz yeterli olabilir.',
  },
  {
    max: 4,
    label: 'Orta',
    tone: 'text-amber-300',
    text: 'Birkaç belirti işaretlendi. Uyku, beslenme ve stres düzeninizi gözden geçirin; bu belirtiler tıbbi nedenlerle de ortaya çıkabilir.',
  },
  {
    max: QUESTIONS.length,
    label: 'Yüksek',
    tone: 'text-rose-300',
    text: 'Birçok belirti işaretlendi. Bu bir nazar tespiti değildir; yakınmalarınız sürer veya ağırlaşırsa bir hekime başvurun.',
  },
];

const RECOMMENDATIONS = [
  'Geleneksel uygulama olarak Felak, Nâs ve Âyetel Kürsî okunabilir.',
  'Beğendiğiniz bir şeye bakınca “Maşaallah” demek geleneksel olarak önerilir.',
  'Uyku, beslenme ve dinlenme düzeninizi gözden geçirin.',
];

export const NazarSelfCheck: React.FC = () => {
  const [answers, setAnswers] = useState<Array<boolean | null>>(() => QUESTIONS.map(() => null));

  const answeredCount = answers.filter((answer) => answer !== null).length;
  const yesCount = answers.filter((answer) => answer === true).length;
  const level = LEVELS.find((item) => yesCount <= item.max) ?? LEVELS[LEVELS.length - 1];

  const setAnswer = (index: number, value: boolean) => {
    setAnswers((current) => current.map((answer, i) => (i === index ? value : answer)));
  };

  return (
    <section className="space-y-4 rounded-2xl border border-amber-500/30 bg-slate-950/70 p-4 sm:p-5">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-amber-300">Nazar öz-değerlendirmesi</div>
        <h3 className="mt-1 text-base font-bold text-white">Bildirdiğiniz belirtileri işaretleyin</h3>
        <p className="mt-2 flex gap-2 text-[11px] leading-relaxed text-amber-100/80">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          Bu anket kendi bildirdiğiniz belirtileri sayar; nazarı ölçmez, tanı koymaz ve bilimsel olarak doğrulanmış değildir.
        </p>
      </div>

      <ul className="space-y-2">
        {QUESTIONS.map((question, index) => (
          <li key={question} className="flex flex-col gap-2 rounded-xl bg-slate-900/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs leading-relaxed text-slate-300">{question}</span>
            <div className="flex shrink-0 gap-2">
              {([true, false] as const).map((value) => {
                const selected = answers[index] === value;
                return (
                  <button
                    key={value ? 'yes' : 'no'}
                    onClick={() => setAnswer(index, value)}
                    aria-pressed={selected}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${
                      selected
                        ? value ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                        : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {value ? 'Evet' : 'Hayır'}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      {answeredCount > 0 && (
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400">
              Yanıtlanan: {answeredCount}/{QUESTIONS.length} · Bildirilen belirti: {yesCount}
            </span>
            <span className={`text-xs font-bold ${level.tone}`}>Düzey: {level.label}</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">{level.text}</p>
          <ul className="list-inside list-disc space-y-1 text-[11px] text-slate-400">
            {RECOMMENDATIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button
            onClick={() => setAnswers(QUESTIONS.map(() => null))}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="h-3 w-3" /> Anketi sıfırla
          </button>
        </div>
      )}
    </section>
  );
};
