import { PersonalBioResonanceProfile } from '../types';

export function calculatePersonalBioResonance(fullName: string, birthDate: string): PersonalBioResonanceProfile {
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = (hash << 5) - hash + fullName.charCodeAt(i);
    hash |= 0;
  }
  if (birthDate) {
    const cleanDate = birthDate.replace(/[^0-9]/g, '');
    for (let i = 0; i < cleanDate.length; i++) {
      hash += parseInt(cleanDate[i], 10) * (i + 1);
    }
  }

  const baseFreqs = [396, 417, 432, 528, 639, 741, 852, 963];
  const selectedBase = baseFreqs[Math.abs(hash) % baseFreqs.length];
  const binauralFreqs = [4.5, 6.0, 7.83, 10.0, 12.0];
  const selectedBinaural = binauralFreqs[Math.abs(hash) % binauralFreqs.length];

  // Life path calculation
  let lifePathNumber = 7;
  if (birthDate) {
    const digits = birthDate.replace(/[^0-9]/g, '').split('').map(Number);
    let sum = digits.reduce((a, b) => a + b, 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
    }
    lifePathNumber = sum;
  }

  const chakras = ['Kök Çakra (Muladhara)', 'Sakral Çakra (Svadhisthana)', 'Solar Pleksus (Manipura)', 'Kalp Çakrası (Anahata)', 'Boğaz Çakrası (Vishuddha)', 'Üçüncü Göz (Ajna)', 'Taç Çakra (Sahasrara)'];
  const elements = ['Toprak & Kristal', 'Su & Akışkanlık', 'Ateş & İrade', 'Hava & Sevgi', 'Eter & Kozmos'];

  const profile: PersonalBioResonanceProfile = {
    fullName,
    birthDate,
    personalBaseFreqHz: selectedBase,
    signatureBinauralHz: selectedBinaural,
    lifePathNumber,
    harmonicTitle: `${fullName.split(' ')[0]} İçin Harmonik Rezonans Matrisi`,
    associatedChakra: chakras[Math.abs(hash) % chakras.length],
    astralElement: elements[Math.abs(hash) % elements.length],
    description: `Adınızın akustik armonisi ve doğum döngünüzün kozmik titreşimi ${selectedBase} Hz temel frekansı ile en yüksek rezonansı vermektedir.`
  };

  try {
    localStorage.setItem('aurabio_personal_resonance', JSON.stringify(profile));
  } catch {}

  return profile;
}

export function getSavedPersonalResonance(): PersonalBioResonanceProfile | null {
  try {
    const saved = localStorage.getItem('aurabio_personal_resonance');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return null;
}
