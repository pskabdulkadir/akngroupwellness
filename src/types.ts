export type ActiveTab = 
  | 'camera' 
  | 'circadian' 
  | 'healing' 
  | 'mandala' 
  | 'heatmap' 
  | 'mindspace' 
  | 'islamic' 
  | 'eastern' 
  | 'mythology' 
  | 'letaif' 
  | 'history';

export type TargetClassification = 
  | 'human' 
  | 'crystal' 
  | 'plant' 
  | 'water_liquid' 
  | 'electronic_device' 
  | 'book_paper' 
  | 'metal_tool' 
  | 'inanimate_object'
  | 'device'
  | 'glass'
  | 'book'
  | 'metal'
  | 'object';

export type MeditationType = 
  | 'chakras' 
  | 'stress_relief' 
  | 'sleep_delta' 
  | 'focus_alpha' 
  | 'cosmic_theta' 
  | 'cellular_repair' 
  | 'esma_dhikr'
  | 'solfeggio'
  | 'vagus'
  | 'binaural_hemispheric'
  | string;

export type NatureSoundLayer = 
  | 'ocean' 
  | 'rain' 
  | 'forest' 
  | 'campfire' 
  | 'tibetan_bowls' 
  | 'tibetan'
  | 'none'
  | string;

export type BreathworkMode = 
  | 'box' 
  | '4_7_8' 
  | '4-7-8'
  | 'coherent_5_5' 
  | 'deep_calm' 
  | 'vagus'
  | 'none'
  | string;

export interface AmbientMixerLevels {
  carrier?: number;
  binaural?: number;
  pinkNoise?: number;
  nature?: number;
  tibetanBowls?: number;
  subHarmonics?: number;
  ocean?: number;
  rain?: number;
  tibetan?: number;
  campfire?: number;
  [key: string]: number | undefined;
}

export interface SleepModeConfig {
  mode?: '45min_timer' | 'all_night' | 'smart_alarm' | string;
  timerMinutes?: number;
  carrierHz?: number;
  binauralHz?: number;
  soundscape?: 'delta_deep' | 'schumann_night' | 'cosmos_drift' | 'rain_forest' | NatureSoundLayer | string;
  fadeDurationMinutes?: number;
  smartWakeup?: boolean;
  deltaInduction?: boolean;
}

export interface InstantVoiceMetrics {
  rms?: number;
  pitchHz?: number;
  vocalTremor?: number;
  stressLevel?: number;
  coherenceScore?: number;
  [key: string]: any;
}

export interface CircadianPrescription {
  recommendedMeditation?: string;
  recommendedFrequencyHz?: number;
  recommendedNature?: string;
  recommendedBreath?: string;
  [key: string]: any;
}

export interface MindSpaceMetric {
  vocalStressScore: number;
  breathStability: number;
  dominantBrainwave: string;
  recommendedHz: number;
  chakraResonance: string;
  description: string;
  focusScore?: number;
  energyBreathLevel?: number;
  vocalStressIndex?: number;
  primaryState?: string;
  vocalTremor?: number;
  [key: string]: any;
}

export interface MindSpaceSessionConfig {
  carrierFrequencyHz: number;
  binauralBeatHz: number;
  durationMinutes: number;
  meditationType: MeditationType;
  natureSound: NatureSoundLayer;
  breathworkMode: BreathworkMode;
  breathwork?: any;
  enableVoiceGuidance?: boolean;
  autoRampTo963Hz?: boolean;
  [key: string]: any;
}

export interface MindSpaceSessionRecord {
  id: string;
  timestamp: number;
  durationMinutes: number;
  carrierFrequencyHz: number;
  initialStress: number;
  finalStress: number;
  meditationType: MeditationType;
  completed: boolean;
  dateFormatted?: string;
  notes?: string;
  [key: string]: any;
}

export interface PersonalBioResonanceProfile {
  fullName: string;
  birthDate: string;
  personalBaseFreqHz: number;
  signatureBinauralHz: number;
  lifePathNumber: number;
  harmonicTitle: string;
  associatedChakra: string;
  astralElement: string;
  description?: string;
  sanskritNote?: string;
  recommendedDailyMinutes?: number;
  acousticBlueprint?: string;
  [key: string]: any;
}

export interface AuraColorDistribution {
  colorName: string;
  hex: string;
  percentage: number;
  spiritualMeaning: string;
  emotionalMeaning: string;
}

export interface ChakraEnergy {
  id: string;
  name: string;
  sanskrit?: string;
  sanskritName?: string;
  turkishName?: string;
  color: string;
  frequency?: number;
  location?: string;
  description?: string;
  level: number;
  balanced?: boolean;
  status?: any;
  affirmation?: string;
  mantra?: string;
  bijaMantra?: string;
  note?: string;
  element?: string;
  benefits?: string[];
}

export interface LetaifEnergy {
  id: string;
  name: string;
  arabicName: string;
  color: string;
  nurColor?: string;
  location?: string;
  description?: string;
  level: number;
  balanced?: boolean;
  esma?: string;
  esmaMeaning?: string;
  esmaFrequency?: number;
  spiritualMeaning?: string;
  dhikrCount?: number;
  dhikr?: string;
  status?: string;
}

export interface AuraLayer {
  name: string;
  turkishName?: string;
  layerIndex?: number;
  thicknessMm?: number;
  thickness?: number;
  purity?: number;
  type?: string;
  colorHex?: string;
  color?: string;
  hex?: string;
  vibrationalHz?: number;
  integrityScore?: number;
  description?: string;
  meaning?: string;
}

export interface EmotionalStateData {
  primary: string;
  intensity?: number; // 0-100
  secondary?: string;
  secondaryIntensity?: number;
  balanceScore?: number;
  stressLevel: number;
  vitalityLevel: number;
  tranquilityLevel?: number;
  spiritualOpenness?: number;
  mentalClarity?: number;
  positivityRatio?: number;
  description?: string;
  recommendedAttitude?: string;
  auraPsychologicalImpact?: string;
  chakraEmotionalImpact?: string;
  chakraStatus?: {
    root?: number;
    sacral?: number;
    solarPlexus?: number;
    heart?: number;
    throat?: number;
    thirdEye?: number;
    crown?: number;
  };
}

export interface EsmaRecommendation {
  name: string;
  arabic?: string;
  meaning?: string;
  frequency?: number;
  frequencyHz?: number;
  recommendedCount?: number;
  targetAuraColor?: string;
  benefit?: string;
  benefits?: string;
  matchedReason?: string;
  [key: string]: any;
}

export interface AyetRecommendation {
  surah?: string;
  title?: string;
  verseNumber?: number;
  arabic?: string;
  turkishTranslation?: string;
  frequencyHz?: number;
  healingCategory?: string;
  benefit?: string;
  benefits?: string;
  dhikrDurationMinutes?: number;
  [key: string]: any;
}

export interface ScanResult {
  id: string;
  timestamp: number;
  dominantAuraColor: string;
  auraHex: string;
  auraSecondaryHex?: string;
  bioEnergyLevel: number; // 0-100
  frequencyHz: number;
  measuredFrequencyHz?: number;
  coherenceScore: number; // 0-100
  overallHarmonyScore?: number;
  stressIndex: number; // 0-100
  vitalityLevel?: number;
  emotionalState: EmotionalStateData;
  auraDistribution: AuraColorDistribution[];
  chakraLevels: ChakraEnergy[];
  letaifLevels: LetaifEnergy[];
  auraLayers: AuraLayer[];
  pranaFlowRate: number;
  kundaliniResonance: number;
  isAfterTreatment?: boolean;
  treatmentName?: string;
  recommendedEsmas: any[];
  recommendedAyets: any[];
  recommendedMantras?: any[];
  recommendedElements?: any[];
  kirlianPlasmaIntensity: number;
  kirlianCoronaDensity?: number;
  cellularVitality: number;
  photonEmissionRate: number;
  notes?: string;
  photoSnapshotUrl?: string;
  snapshotUrl?: string;
  targetType?: string;
  targetName?: string;
  chakras?: ChakraEnergy[];
  letaifs?: LetaifEnergy[];
  mindspaceData?: any;
  userId?: string;
  userUid?: string;
  userEmail?: string;
  userName?: string;
}

export type ChakraMatrixItem = any;
export type CircadianPhaseInfo = any;
export type DreamAnalysisResult = any;
export type EasternMantraItem = any;
export type MythologicalElementItem = any;

export interface GroupAuraMember {
  uid: string;
  displayName: string;
  email?: string;
  status: string;
  joinedAt: number;
  lastHeartbeat: number;
  isHost: boolean;
  currentAuraColor: string;
  energyLevel: number;
}

export interface GroupAuraRoom {
  roomId: string;
  roomCode: string;
  roomName: string;
  description: string;
  hostUid: string;
  hostName: string;
  createdAt: number;
  updatedAt: number;
  activeFrequencyHz: number;
  activeBinauralHz: number;
  activeSessionTitle: string;
  isPlaying: boolean;
  targetIntention: string;
  members: Record<string, GroupAuraMember>;
  memberCount: number;
  coherenceScore: number;
}

export type { EsmaItem } from './data/esmaData';
export type { AyetItem } from './data/ayetData';

export interface DealerDetails {
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  businessField: string;
  whatsapp: string;
  phone?: string;
  bankInfo?: {
    bankName?: string;
    iban?: string;
    accountHolder?: string;
    [key: string]: any;
  } | any;
  address?: string;
  notes?: string;
  appliedAt?: string;
  referralCode?: string;
  commissionRate?: number;
  creditsBalance?: number; // Available scan/session credits pool
  dealerPackageId?: string; // e.g. 'bronze_dealer', 'silver_dealer', 'gold_dealer'
  assignedLeg?: 'LEFT' | 'RIGHT' | 'AUTO';
  [key: string]: any;
}

export type DealerStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface DealerPackage {
  id: string;
  name: string;
  scanCredits: number;
  price: number;
  priceText: string;
  badge: string;
  popular?: boolean;
  targetAudience: string;
  unitCostText: string;
  features: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'therapist' | 'premium' | 'dealer' | 'customer';
  isApproved: boolean;
  createdAt: number;
  lastLogin: number;
  subscriptionPlan?: 'free_demo' | 'monthly_pro' | 'annual_vip' | 'lifetime_master';
  subscriptionValidUntil?: number;
  creditsBalance?: number;
  isDealerRequested?: boolean;
  dealerStatus?: DealerStatus;
  dealerDetails?: DealerDetails;
}
