export interface WearableBiometricData {
  heartRate: number; // BPM
  heartRateBpm: number; // BPM alias
  hrvMs: number; // Heart Rate Variability (SDNN / RMSSD)
  hrvRmssdMs: number; // RMSSD alias
  galvanicStressScore: number; // 0-100
  stressIndex: number; // 0-100
  coherenceScore: number; // 0-100
  skinTempCelsius: number;
  batteryPercent: number;
  batteryLevelPercent: number;
  deviceName: string;
  deviceLabel: string;
  isConnected: boolean;
  isSimulated: boolean;
  timestamp?: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BioTuningSuggestion {
  recommendedHz: number;
  recommendedCarrierHz: number;
  binauralHz: number;
  recommendedBinauralHz: number;
  reason: string;
  stressDropExpected: number;
}

export class WearableBluetoothService {
  private status: ConnectionStatus = 'disconnected';
  private isConnected: boolean = false;
  private isSimulated: boolean = false;
  private deviceName: string = '';
  private autoTuning: boolean = true;
  private baseBpm: number = 72;
  private currentBpm: number = 72;
  private timer: any = null;

  private dataListeners: ((data: WearableBiometricData) => void)[] = [];
  private statusListeners: ((status: ConnectionStatus, message?: string) => void)[] = [];
  private tuningListeners: ((suggestion: BioTuningSuggestion) => void)[] = [];

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isRunningInIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  public isAutoTuningActive(): boolean {
    return this.autoTuning;
  }

  public setAutoTuning(active: boolean): void {
    this.autoTuning = active;
  }

  public getDeviceName(): string {
    return this.deviceName || 'AuraSync SmartWatch';
  }

  public subscribeStatus(cb: (status: ConnectionStatus, message?: string) => void): () => void {
    this.statusListeners.push(cb);
    cb(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== cb);
    };
  }

  public subscribeData(cb: (data: WearableBiometricData) => void): () => void {
    this.dataListeners.push(cb);
    if (this.isConnected) {
      cb(this.getLatestData());
    }
    return () => {
      this.dataListeners = this.dataListeners.filter(l => l !== cb);
    };
  }

  public subscribe(cb: (data: WearableBiometricData) => void): () => void {
    return this.subscribeData(cb);
  }

  public subscribeBioTuning(cb: (suggestion: BioTuningSuggestion) => void): () => void {
    this.tuningListeners.push(cb);
    return () => {
      this.tuningListeners = this.tuningListeners.filter(l => l !== cb);
    };
  }

  private setStatusState(newStatus: ConnectionStatus, message?: string): void {
    this.status = newStatus;
    this.statusListeners.forEach(l => l(newStatus, message));
  }

  public async connectRealDevice(useAcceptAll: boolean = false): Promise<boolean> {
    this.setStatusState('connecting');

    if (this.isRunningInIframe()) {
      const isFeaturePolicyBlocked = true;
      if (isFeaturePolicyBlocked) {
        this.setStatusState('error', 'IFRAME_POLICY_BLOCKED');
        return false;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
        const options: any = useAcceptAll
          ? {
              acceptAllDevices: true,
              optionalServices: ['heart_rate', 'battery_service']
            }
          : {
              filters: [{ services: ['heart_rate'] }],
              optionalServices: ['battery_service']
            };

        const device = await (navigator as any).bluetooth.requestDevice(options);
        this.deviceName = device.name || 'Polar / BLE Sensör';
        this.isConnected = true;
        this.isSimulated = false;
        this.setStatusState('connected');
        this.startDataStream();
        return true;
      } else {
        this.setStatusState('error', 'Tarayıcınız Web Bluetooth API desteklemiyor veya izin verilmedi.');
        return false;
      }
    } catch (e: any) {
      console.warn('Bluetooth Web API error:', e);
      const msg = e?.name === 'SecurityError' || e?.message?.includes('Permissions policy') 
        ? 'IFRAME_POLICY_BLOCKED' 
        : (e?.message || 'Bluetooth bağlantısı kurulamadı.');
      this.setStatusState('error', msg);
      return false;
    }
  }

  public connectDevice(): Promise<boolean> {
    return this.connectRealDevice(false);
  }

  public startSimulatedWatch(initialBpm: number = 74): boolean {
    this.baseBpm = initialBpm;
    this.currentBpm = initialBpm;
    this.deviceName = 'Aura-Sync Akıllı Saat (Canlı Simülasyon)';
    this.isConnected = true;
    this.isSimulated = true;
    this.setStatusState('connected');
    this.startDataStream();
    this.notify();
    return true;
  }

  public disconnect(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isConnected = false;
    this.isSimulated = false;
    this.setStatusState('disconnected');
    this.notify();
  }

  public getLatestData(): WearableBiometricData {
    const time = Date.now();
    const bpmVariation = Math.floor(Math.sin(time / 2500) * 3);
    const bpm = Math.max(48, Math.min(180, this.currentBpm + bpmVariation));
    
    // Calculate HRV inverse to heart rate stress
    const hrv = Math.round(Math.max(20, Math.min(110, 85 - (bpm - 60) * 0.7 + Math.cos(time / 3000) * 5)));
    
    // Stress calculation
    let stress = Math.round(Math.max(10, Math.min(95, (bpm - 55) * 1.2 + (70 - hrv) * 0.4)));
    if (stress < 0) stress = 15;
    
    // Coherence calculation
    const coherence = Math.round(Math.max(25, Math.min(98, 100 - stress * 0.8 + Math.sin(time / 4000) * 8)));

    const name = this.getDeviceName();

    return {
      heartRate: bpm,
      heartRateBpm: bpm,
      hrvMs: hrv,
      hrvRmssdMs: hrv,
      galvanicStressScore: stress,
      stressIndex: stress,
      coherenceScore: coherence,
      skinTempCelsius: 36.6,
      batteryPercent: 88,
      batteryLevelPercent: 88,
      deviceName: name,
      deviceLabel: name,
      isConnected: this.isConnected,
      isSimulated: this.isSimulated,
      timestamp: time
    };
  }

  private startDataStream(): void {
    if (this.timer) clearInterval(this.timer);
    let counter = 0;
    this.timer = setInterval(() => {
      if (this.isConnected) {
        this.notify();
        counter++;
        if (counter % 3 === 0) {
          this.evaluateTuning();
        }
      }
    }, 1000);
  }

  private evaluateTuning(): void {
    const data = this.getLatestData();
    let suggestion: BioTuningSuggestion;

    if (data.heartRateBpm > 95 || data.stressIndex > 60) {
      suggestion = {
        recommendedHz: 432,
        recommendedCarrierHz: 432,
        binauralHz: 5.5,
        recommendedBinauralHz: 5.5,
        reason: 'Yüksek nabız & sempatik stres tespit edildi. 432 Hz Solfeggio ve 5.5 Hz Teta ile vagus siniri uyarılıyor.',
        stressDropExpected: 35
      };
    } else if (data.heartRateBpm < 60) {
      suggestion = {
        recommendedHz: 639,
        recommendedCarrierHz: 639,
        binauralHz: 10.0,
        recommendedBinauralHz: 10.0,
        reason: 'Derin bradikardi / gevşeme tespit edildi. 639 Hz Kalp & 10.0 Hz Alfa ile dengeli farkındalık sağlanıyor.',
        stressDropExpected: 15
      };
    } else {
      suggestion = {
        recommendedHz: 528,
        recommendedCarrierHz: 528,
        binauralHz: 7.83,
        recommendedBinauralHz: 7.83,
        reason: 'Kalp koheransı optimum seviyede. 528 Hz Hücresel Onarım ve 7.83 Hz Schumann ile biyo-rezonans pekiştiriliyor.',
        stressDropExpected: 20
      };
    }

    this.tuningListeners.forEach(l => l(suggestion));
  }

  private notify(): void {
    const data = this.getLatestData();
    this.dataListeners.forEach(l => l(data));
  }
}

export const wearableBluetoothService = new WearableBluetoothService();
export const wearableService = wearableBluetoothService;
export default wearableBluetoothService;
