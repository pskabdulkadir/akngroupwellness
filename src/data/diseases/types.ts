export interface DiseaseHealingProtocol {
  id: string;
  name: string;
  diseaseName: string;
  system: string;
  category: string;
  primaryFrequency: number;
  primaryFrequencyHz: number;
  secondaryFrequencies: number[];
  secondaryFrequencyHz: number;
  recommendedDurationMinutes: number;
  esmaRecommendation: string;
  ayetRecommendation: string;
  culturalOrReligiousContext: string;
  binauralBeatHz: number;
  carrierHz: number;
  description: string;
  healingBenefits: string;
  symptoms: string[];
  protocolSteps: string[];
  affectedChakras: string[];
  soundscapePreset: 'ocean' | 'rain' | 'forest' | 'white_noise' | 'tibetan_bowls' | string;
  usagePrescription: {
    durationPerSessionMinutes: number;
    frequencyOfUsePerDay: number;
    recommendedTotalDays: number;
    bestTimeOfDay: string;
    guidelines: string;
  };
  recoveryProcessTimeline: {
    phase1Days1to7: string;
    phase2Days8to21: string;
    phase3Days22Plus: string;
  };
  [key: string]: any;
}

export type DiseaseCategoryFilter = 
  | 'Tümü'
  | 'Nörolojik & Zihinsel'
  | 'Kardiyovasküler & Dolaşım'
  | 'Sindirim & Metabolizma'
  | 'İskelet, Eklem & Kas'
  | 'Bağışıklık & Hücresel'
  | 'Solunum & Akciğer'
  | 'Endokrin & Hormon'
  | 'Duyu & Cilt'
  | 'Kadim & Enerjetik';
