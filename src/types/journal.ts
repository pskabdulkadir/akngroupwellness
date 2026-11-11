export type ElementalType = 'Ateş' | 'Su' | 'Hava' | 'Toprak' | 'Eter' | string;

export interface JournalAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' | string;
  positivityScore: number; // 0 - 100
  dominantAuraColor: string;
  dominantEmotion?: string;
  auraHex: string;
  dominantElement: ElementalType;
  elementalFocus?: string;
  identifiedChakras: string[];
  recommendedFrequencyHz: number;
  recommendedBinauralHz: number;
  recommendedEsma: string;
  associatedEsma?: string;
  targetChakra?: string;
  breathingTechnique?: string;
  coachingTheme?: string;
  psychologicalInsight?: string;
  aiReflectionText: string;
  affirmation: string;
  suggestedAction: string;
  [key: string]: any;
}

export interface JournalEntry {
  id: string;
  userId?: string;
  date: string;
  timestamp?: number;
  rawContent?: string;
  rawText?: string;
  tags?: string[];
  selectedTags?: string[];
  emotionIntensity?: number;
  analysis?: JournalAnalysisResult;
  aiAnalysisResult?: JournalAnalysisResult;
  [key: string]: any;
}

export interface JournalUserStats {
  totalEntries: number;
  streakDays: number;
  streak?: number;
  averagePositivity: number;
  averageIntensity?: number;
  topChakras: { name: string; count: number }[];
  dominantAura: string;
  dominantElement?: string;
  hasMindfulnessBadge?: boolean;
  [key: string]: any;
}
