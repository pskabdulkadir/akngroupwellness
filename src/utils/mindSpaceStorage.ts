export interface MindSpaceSession {
  id: string;
  timestamp: number;
  dateFormatted?: string;
  mode?: 'meditation' | 'frequency_therapy' | 'breathing' | 'subconscious' | string;
  durationMinutes: number;
  targetFrequencyHz?: number;
  initialStress?: number;
  finalStress?: number;
  stressScoreBefore?: number;
  stressScoreAfter?: number;
  stressDelta?: number;
  focusScore?: number;
  energyScore?: number;
  frequencyUsed?: number;
  binauralUsed?: number;
  meditationType?: any;
  breathwork?: any;
  natureSound?: any;
  voiceCoachSummary?: string;
  notes?: string;
  completed?: boolean;
  [key: string]: any;
}

const STORAGE_MINDSPACE_KEY = 'aurabio_mindspace_sessions_v1';

export function saveMindSpaceSession(session: Partial<MindSpaceSession>): MindSpaceSession {
  const completeSession: MindSpaceSession = {
    id: session.id || `session-${Date.now()}`,
    timestamp: session.timestamp || Date.now(),
    durationMinutes: session.durationMinutes || 15,
    ...session,
  };

  try {
    const list = getMindSpaceSessions();
    const updated = [completeSession, ...list].slice(0, 50);
    localStorage.setItem(STORAGE_MINDSPACE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save MindSpace session:', e);
  }

  return completeSession;
}

export function getMindSpaceSessions(): MindSpaceSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_MINDSPACE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
