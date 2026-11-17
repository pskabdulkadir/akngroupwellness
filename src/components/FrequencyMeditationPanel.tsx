import React, { useEffect, useState } from 'react';
import { ChevronDown, Clock, Square, Wind } from 'lucide-react';
import { BreathingPattern, MEDITATION_DURATION_OPTIONS, getMeditationProcess } from '../data/meditationProcesses';

export interface ActiveMeditation {
  key: string;
  frequencyHz: number;
  durationMinutes: number;
  startedAt: number;
}

interface FrequencyMeditationPanelProps {
  sessionKey: string;
  frequencyHz: number;
  active: ActiveMeditation | null;
  onStart: (sessionKey: string, frequencyHz: number, durationMinutes: number) => void;
  onStop: () => void;
}

const getPhases = (pattern: BreathingPattern) => [
  { label: 'Nefes alın', seconds: pattern.inhaleSec },
  { label: 'Tutun', seconds: pattern.holdInSec },
  { label: 'Nefes verin', seconds: pattern.exhaleSec },
  { label: 'Bekleyin', seconds: pattern.holdOutSec },
].filter((phase) => phase.seconds > 0);

const getCurrentPhase = (pattern: BreathingPattern, elapsedMs: number) => {
  const phases = getPhases(pattern);
  const cycleSeconds = phases.reduce((sum, phase) => sum + phase.seconds, 0);
  let cursor = (Math.max(0, elapsedMs) / 1000) % cycleSeconds;
  for (const phase of phases) {
    if (cursor < phase.seconds) return { label: phase.label, remaining: Math.ceil(phase.seconds - cursor) };
    cursor -= phase.seconds;
  }
  return { label: phases[0].label, remaining: phases[0].seconds };
};

const describePattern = (pattern: BreathingPattern) =>
  getPhases(pattern)
    .map((phase) => `${phase.seconds} sn ${phase.label.toLocaleLowerCase('tr')}`)
    .join(' · ');

const formatClock = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const FrequencyMeditationPanel: React.FC<FrequencyMeditationPanelProps> = ({
  sessionKey,
  frequencyHz,
  active,
  onStart,
  onStop,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const process = getMeditationProcess(frequencyHz);
  const isRunning = active !== null && active.key === sessionKey;
  const startedAt = active?.startedAt ?? 0;
  const totalMs = isRunning && active ? active.durationMinutes * 60_000 : 0;
  const elapsedMs = isRunning ? Math.max(0, now - startedAt) : 0;
  const remainingMs = Math.max(0, totalMs - elapsedMs);

  useEffect(() => {
    if (!isRunning) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [isRunning, startedAt]);

  useEffect(() => {
    if (isRunning && remainingMs <= 0) onStop();
  }, [isRunning, remainingMs, onStop]);

  const phase = isRunning ? getCurrentPhase(process.breathing, elapsedMs) : null;
  const progressPercent = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-violet-500/20 bg-slate-900/70 p-3">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 text-left text-[11px] font-bold text-violet-200"
      >
        <span className="flex items-center gap-1.5">
          <Wind className="h-3.5 w-3.5" />
          Meditasyon süreci · {frequencyHz} Hz
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-950/70 p-2.5 text-[11px] leading-relaxed text-slate-300">
            <div className="font-bold text-violet-200">{process.breathing.name}</div>
            <div className="text-slate-400">{describePattern(process.breathing)}</div>
          </div>
          <ol className="space-y-1.5">
            {process.steps.map((step, index) => (
              <li key={step} className="flex gap-2 text-[11px] leading-relaxed text-slate-300">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[9px] font-bold text-violet-200">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <Clock className="h-3 w-3" /> Süre seçin
            </div>
            <div className="flex flex-wrap gap-2">
              {MEDITATION_DURATION_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => onStart(sessionKey, frequencyHz, minutes)}
                  className="rounded-lg border border-violet-500/30 bg-violet-950/40 px-3 py-1.5 text-[11px] font-bold text-violet-200 hover:bg-violet-900/60"
                >
                  {minutes} dk
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500">
            Ses {frequencyHz} Hz ambient tondur; etkisi kanıtlanmış değildir. Rahatsızlık hissederseniz durdurun.
          </p>
        </div>
      )}

      {phase && (
        <div className="space-y-2 rounded-xl bg-violet-950/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-violet-100">{phase.label}</span>
            <span className="font-mono text-sm font-bold text-violet-200">{phase.remaining} sn</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-slate-300">Kalan süre {formatClock(remainingMs)}</span>
            <button
              onClick={onStop}
              className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-rose-500"
            >
              <Square className="h-3 w-3" /> Durdur
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
