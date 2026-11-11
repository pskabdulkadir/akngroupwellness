import { DiseaseHealingProtocol, DiseaseCategoryFilter } from './diseases/types';
import { neuroPsychDiseases } from './diseases/neuroPsych';
import { cardiovascularDiseases } from './diseases/cardiovascular';
import { digestiveMetabolicDiseases } from './diseases/digestiveMetabolic';
import { musculoskeletalDiseases } from './diseases/musculoskeletal';
import { immuneRespiratoryDiseases } from './diseases/immuneRespiratory';
import { endocrineSensoryDiseases } from './diseases/endocrineSensory';
import { ancientSpiritualDiseases } from './diseases/ancientSpiritual';

export type { DiseaseHealingProtocol, DiseaseCategoryFilter };

export const DISEASE_CATEGORIES: DiseaseCategoryFilter[] = [
  'Tümü',
  'Nörolojik & Zihinsel',
  'Kardiyovasküler & Dolaşım',
  'Sindirim & Metabolizma',
  'İskelet, Eklem & Kas',
  'Bağışıklık & Hücresel',
  'Solunum & Akciğer',
  'Endokrin & Hormon',
  'Duyu & Cilt',
  'Kadim & Enerjetik'
];

export const DISEASE_HEALING_LIBRARY: DiseaseHealingProtocol[] = [
  ...neuroPsychDiseases,
  ...cardiovascularDiseases,
  ...digestiveMetabolicDiseases,
  ...musculoskeletalDiseases,
  ...immuneRespiratoryDiseases,
  ...endocrineSensoryDiseases,
  ...ancientSpiritualDiseases
];

export const TOTAL_DISEASE_COUNT = DISEASE_HEALING_LIBRARY.length;

export function filterDiseases(
  query: string = '',
  category: DiseaseCategoryFilter = 'Tümü'
): DiseaseHealingProtocol[] {
  const normalizedQuery = (query || '').trim().toLowerCase();

  return DISEASE_HEALING_LIBRARY.filter((disease) => {
    // Category match
    const categoryMatches =
      category === 'Tümü' ||
      disease.category === category ||
      (category === 'Solunum & Akciğer' && disease.category.includes('Solunum')) ||
      (category === 'Bağışıklık & Hücresel' && disease.category.includes('Bağışıklık')) ||
      (category === 'Duyu & Cilt' && disease.category.includes('Cilt')) ||
      (category === 'Endokrin & Hormon' && disease.category.includes('Endokrin'));

    if (!categoryMatches) return false;

    // Text search query
    if (!normalizedQuery) return true;

    const nameMatch = (disease.name || '').toLowerCase().includes(normalizedQuery);
    const diseaseNameMatch = (disease.diseaseName || '').toLowerCase().includes(normalizedQuery);
    const systemMatch = (disease.system || '').toLowerCase().includes(normalizedQuery);
    const esmaMatch = Boolean(disease.esmaRecommendation && disease.esmaRecommendation.toLowerCase().includes(normalizedQuery));
    const ayetMatch = Boolean(disease.ayetRecommendation && disease.ayetRecommendation.toLowerCase().includes(normalizedQuery));
    const symptomMatch = Boolean(disease.symptoms?.some((s) => s && s.toLowerCase().includes(normalizedQuery)));
    const benefitsMatch = Boolean(disease.healingBenefits && disease.healingBenefits.toLowerCase().includes(normalizedQuery));
    const freqMatch = 
      Boolean(disease.primaryFrequency && disease.primaryFrequency.toString().includes(normalizedQuery)) ||
      Boolean(disease.primaryFrequencyHz && disease.primaryFrequencyHz.toString().includes(normalizedQuery));

    return (
      nameMatch ||
      diseaseNameMatch ||
      systemMatch ||
      esmaMatch ||
      ayetMatch ||
      symptomMatch ||
      benefitsMatch ||
      freqMatch
    );
  });
}

export function getDiseaseById(id: string): DiseaseHealingProtocol | undefined {
  return DISEASE_HEALING_LIBRARY.find((d) => d.id === id);
}
