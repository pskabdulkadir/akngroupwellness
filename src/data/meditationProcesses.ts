export interface BreathingPattern {
  name: string;
  inhaleSec: number;
  holdInSec: number;
  exhaleSec: number;
  holdOutSec: number;
}

export interface MeditationProcess {
  breathing: BreathingPattern;
  steps: string[];
}

export const MEDITATION_DURATION_OPTIONS = [3, 5, 10, 15, 20];

const DEFAULT_PROCESS: MeditationProcess = {
  breathing: { name: 'Dengeli nefes', inhaleSec: 4, holdInSec: 0, exhaleSec: 4, holdOutSec: 0 },
  steps: [
    'Rahat bir pozisyon alın ve sesi düşük seviyede başlatın.',
    '4 sayıda nefes alıp 4 sayıda yavaşça verin.',
    'Süre bitince nefesinizi doğal ritmine bırakın.',
  ],
};

export const MEDITATION_PROCESSES: Record<number, MeditationProcess> = {
  174: {
    breathing: { name: 'Diyafram nefesi', inhaleSec: 4, holdInSec: 2, exhaleSec: 6, holdOutSec: 0 },
    steps: [
      'Sırtınızı dik ama gergin olmadan oturun; ellerinizi kucağınızda dinlendirin.',
      'Burnunuzdan yavaşça nefes alırken karnınızın şişmesini izleyin.',
      'Ağzınızdan uzun ve sakin bir nefes verirken omuzlarınızı bırakın.',
    ],
  },
  285: {
    breathing: { name: 'Kutu nefesi (4-4-4-4)', inhaleSec: 4, holdInSec: 4, exhaleSec: 4, holdOutSec: 4 },
    steps: [
      'Gözlerinizi yumun ve nefesinizi saymaya başlayın.',
      'Dört sayıda alın, dört sayıda tutun, dört sayıda verin, dört sayıda bekleyin.',
      'Dikkatiniz dağılırsa yeniden saymaya dönün.',
    ],
  },
  396: {
    breathing: { name: 'Uzun nefes verme (4-0-8)', inhaleSec: 4, holdInSec: 0, exhaleSec: 8, holdOutSec: 0 },
    steps: [
      'Dört sayıda sessizce nefes alın.',
      'Sekiz sayıda ağzınızdan yavaşça verin; nefesi zorlamayın.',
      'Her verişte bırakmak istediğiniz bir gerginliği zihninizden geçirin.',
    ],
  },
  432: {
    breathing: { name: 'Eşit nefes (5-0-5)', inhaleSec: 5, holdInSec: 0, exhaleSec: 5, holdOutSec: 0 },
    steps: [
      'Beş sayıda nefes alın ve beş sayıda verin.',
      'Ritmi bir metronom gibi sabit tutmaya çalışın.',
      'Ritim oturunca dikkatinizi göğüs ve karın hareketine verin.',
    ],
  },
  528: {
    breathing: { name: '4-7-8 sakinleştirici nefes', inhaleSec: 4, holdInSec: 7, exhaleSec: 8, holdOutSec: 0 },
    steps: [
      '4 sayıda burnunuzdan alın, 7 sayıda tutun, 8 sayıda ağzınızdan verin.',
      'Verişte dilinizin ucunu üst ön dişlerin arkasında tutabilirsiniz.',
      'Tutma süresi zorlayıcı gelirse sayıları kısaltın.',
    ],
  },
  639: {
    breathing: { name: 'Koherans nefesi (6-0-6)', inhaleSec: 6, holdInSec: 0, exhaleSec: 6, holdOutSec: 0 },
    steps: [
      '6 sayıda nefes alın, 6 sayıda verin; dakikada yaklaşık beş döngü hedefleyin.',
      'İsterseniz bir elinizi göğsünüzün üzerine koyun.',
      'Düşüncelerin gelip geçmesine izin verin ve tekrar nefese dönün.',
    ],
  },
  741: {
    breathing: { name: 'Odak nefesi (3-1-4)', inhaleSec: 3, holdInSec: 1, exhaleSec: 4, holdOutSec: 0 },
    steps: [
      '3 sayıda nefes alın, 1 sayı tutun, 4 sayıda verin.',
      'Dikkatinizi burun ucunuzdaki serinliğe verin.',
      'Dikkat dağılırsa yargılamadan nefese geri dönün.',
    ],
  },
};

export function getMeditationProcess(frequencyHz: number): MeditationProcess {
  return MEDITATION_PROCESSES[frequencyHz] ?? DEFAULT_PROCESS;
}
