/**
 * AuraBio Quantum Web Audio Synthesizer & Binaural Beat Engine
 * Real Web Audio API - Pure sine wave generation, harmonic overtone stacking, pink/white noise, nature soundscapes.
 */

import { HealingItem } from '../data/healingLibrary';
import { SleepModeConfig, NatureSoundLayer, AmbientMixerLevels } from '../types';

export type BrainwaveMode = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';
export type SoundscapeType = 'ocean' | 'rain' | 'forest' | 'white_noise' | 'tibetan_bowls' | 'tibetan' | 'campfire' | 'none' | NatureSoundLayer | string;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private primaryOsc: OscillatorNode | null = null;
  private secondaryOsc: OscillatorNode | null = null;
  private binauralLeftOsc: OscillatorNode | null = null;
  private binauralRightOsc: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentFrequency: number = 528;
  private volume: number = 0.5;
  private activeHealingItem: HealingItem | null = null;
  private mixerLevels: AmbientMixerLevels = {
    carrier: 0.7,
    binaural: 0.5,
    pinkNoise: 0.2,
    nature: 0.4,
    tibetanBowls: 0.3,
    subHarmonics: 0.2,
    ocean: 0.4,
    rain: 0.4,
    campfire: 0.3,
  };

  public async unlockAudio(): Promise<void> {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentFrequency(): number {
    return this.currentFrequency;
  }

  public getActiveHealingItem(): HealingItem | null {
    return this.activeHealingItem;
  }

  public setActiveHealingItem(item: HealingItem | null): void {
    this.activeHealingItem = item;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getMixerLevels(): AmbientMixerLevels {
    return { ...this.mixerLevels };
  }

  public setMixerLevel(key: string, val: number): void {
    this.mixerLevels[key] = Math.max(0, Math.min(1, val));
  }

  public stop(): void {
    this.stopAll();
  }

  public stopImmediate(): void {
    this.stopAll();
  }

  public playFrequency(freq: number, volumeOrLabel?: any, label?: string): void {
    const vol = typeof volumeOrLabel === 'number' ? volumeOrLabel : 0.5;
    this.playTone(freq, vol);
  }

  public startChakraTone(chakraOrFreq: any, ...rest: any[]): void {
    let freq = 528;
    if (typeof chakraOrFreq === 'number') {
      freq = chakraOrFreq;
    } else if (typeof rest[0] === 'number') {
      freq = rest[0];
    }
    this.playTone(freq, 0.5);
  }

  public startCircadianFrequency(freq: number, ...rest: any[]): void {
    const binaural = typeof rest[0] === 'number' ? rest[0] : 7.83;
    this.startAdaptiveBioFrequency(freq, binaural, 'alpha', 0.5, 'ocean');
  }

  public startDreamDecoderSession(...rest: any[]): void {
    const freq = typeof rest[0] === 'number' ? rest[0] : 432;
    this.startAdaptiveBioFrequency(freq, 4.0, 'theta', 0.5, 'ocean');
  }

  public startEmergencyCalmFrequency(
    carrierHz: number = 432,
    binauralHz: number = 6.0,
    volume: number = 0.7,
    enableHarmonics: boolean = true
  ): void {
    // If caller accidentally passes volume as first argument (< 20 Hz other than Schumann 7.83)
    let actualCarrier = carrierHz;
    let actualVolume = volume;
    if (carrierHz > 0 && carrierHz <= 1.0) {
      actualVolume = carrierHz;
      actualCarrier = 432;
    }

    this.stopAll();
    this.initContext();
    if (!this.ctx) return;

    this.currentFrequency = actualCarrier;
    this.volume = actualVolume;

    // Master Gain with smooth attack ramp
    this.masterGain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(actualVolume, now + 0.5);
    this.masterGain.connect(this.ctx.destination);

    // Stereo Binaural Beat
    const merger = this.ctx.createChannelMerger(2);
    const leftFreq = actualCarrier - (binauralHz / 2);
    const rightFreq = actualCarrier + (binauralHz / 2);

    this.binauralLeftOsc = this.ctx.createOscillator();
    this.binauralLeftOsc.type = 'sine';
    this.binauralLeftOsc.frequency.setValueAtTime(leftFreq, now);

    this.binauralRightOsc = this.ctx.createOscillator();
    this.binauralRightOsc.type = 'sine';
    this.binauralRightOsc.frequency.setValueAtTime(rightFreq, now);

    const binauralGain = this.ctx.createGain();
    binauralGain.gain.setValueAtTime(0.75, now);

    this.binauralLeftOsc.connect(merger, 0, 0);
    this.binauralRightOsc.connect(merger, 0, 1);
    merger.connect(binauralGain);
    binauralGain.connect(this.masterGain);

    this.binauralLeftOsc.start(now);
    this.binauralRightOsc.start(now);

    // Warm Harmonic Foundation (Sub-harmonic 0.5x and 1.5x overtone)
    if (enableHarmonics) {
      // Sub-harmonic for soothing acoustic body warmth
      this.primaryOsc = this.ctx.createOscillator();
      this.primaryOsc.type = 'sine';
      this.primaryOsc.frequency.setValueAtTime(actualCarrier * 0.5, now);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.25, now);
      this.primaryOsc.connect(subGain);
      subGain.connect(this.masterGain);
      this.primaryOsc.start(now);

      // Soft Solfeggio 3rd harmonic for calming brain resonance
      this.secondaryOsc = this.ctx.createOscillator();
      this.secondaryOsc.type = 'sine';
      this.secondaryOsc.frequency.setValueAtTime(actualCarrier * 1.5, now);

      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.12, now);
      this.secondaryOsc.connect(overtoneGain);
      overtoneGain.connect(this.masterGain);
      this.secondaryOsc.start(now);
    }

    this.isPlaying = true;
  }

  public async startHealingItemSession(item: any, volume: number = 0.6): Promise<void> {
    await this.unlockAudio();
    const freq = item?.frequencyHz || 528;
    const binaural = item?.binauralHz || 7.83;
    this.startAdaptiveBioFrequency(freq, binaural, 'alpha', volume, 'ocean');
  }

  public transitionFrequencySmooth(targetHz: number, arg2: number = 2, arg3?: number, ...rest: any[]): void {
    let binauralHz = 7.83;
    let rampTimeSec = 2;
    if (typeof arg3 === 'number') {
      binauralHz = arg2;
      rampTimeSec = arg3;
    } else if (typeof arg2 === 'number') {
      rampTimeSec = arg2;
    }
    this.currentFrequency = targetHz;
    if (this.ctx && this.primaryOsc) {
      this.primaryOsc.frequency.linearRampToValueAtTime(targetHz, this.ctx.currentTime + rampTimeSec);
    }
    if (this.ctx && this.binauralLeftOsc && this.binauralRightOsc) {
      this.binauralLeftOsc.frequency.linearRampToValueAtTime(targetHz - binauralHz / 2, this.ctx.currentTime + rampTimeSec);
      this.binauralRightOsc.frequency.linearRampToValueAtTime(targetHz + binauralHz / 2, this.ctx.currentTime + rampTimeSec);
    }
  }

  public stopAll(): void {
    if (this.primaryOsc) {
      try { this.primaryOsc.stop(); this.primaryOsc.disconnect(); } catch {}
      this.primaryOsc = null;
    }
    if (this.secondaryOsc) {
      try { this.secondaryOsc.stop(); this.secondaryOsc.disconnect(); } catch {}
      this.secondaryOsc = null;
    }
    if (this.binauralLeftOsc) {
      try { this.binauralLeftOsc.stop(); this.binauralLeftOsc.disconnect(); } catch {}
      this.binauralLeftOsc = null;
    }
    if (this.binauralRightOsc) {
      try { this.binauralRightOsc.stop(); this.binauralRightOsc.disconnect(); } catch {}
      this.binauralRightOsc = null;
    }
    if (this.noiseNode) {
      try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch {}
      this.noiseNode = null;
    }
    this.isPlaying = false;
    this.activeHealingItem = null;
  }

  public playTone(freq: number, volume: number = 0.5, type: OscillatorType = 'sine'): void {
    this.stopAll();
    this.initContext();
    if (!this.ctx) return;

    this.currentFrequency = freq;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.primaryOsc = this.ctx.createOscillator();
    this.primaryOsc.type = type;
    this.primaryOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    this.primaryOsc.connect(this.masterGain);
    this.primaryOsc.start();
    this.isPlaying = true;
  }

  public playBinaural(carrierHz: number, beatHz: number, volume: number = 0.5): void {
    this.stopAll();
    this.initContext();
    if (!this.ctx) return;

    this.currentFrequency = carrierHz;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    const merger = this.ctx.createChannelMerger(2);

    const leftFreq = carrierHz - beatHz / 2;
    const rightFreq = carrierHz + beatHz / 2;

    this.binauralLeftOsc = this.ctx.createOscillator();
    this.binauralLeftOsc.type = 'sine';
    this.binauralLeftOsc.frequency.setValueAtTime(leftFreq, this.ctx.currentTime);

    this.binauralRightOsc = this.ctx.createOscillator();
    this.binauralRightOsc.type = 'sine';
    this.binauralRightOsc.frequency.setValueAtTime(rightFreq, this.ctx.currentTime);

    this.binauralLeftOsc.connect(merger, 0, 0);
    this.binauralRightOsc.connect(merger, 0, 1);

    merger.connect(this.masterGain);

    this.binauralLeftOsc.start();
    this.binauralRightOsc.start();
    this.isPlaying = true;
  }

  public playHarmonics(baseFreq: number, volume: number = 0.5): void {
    this.stopAll();
    this.initContext();
    if (!this.ctx) return;

    this.currentFrequency = baseFreq;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.primaryOsc = this.ctx.createOscillator();
    this.primaryOsc.type = 'sine';
    this.primaryOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    this.primaryOsc.connect(this.masterGain);

    this.secondaryOsc = this.ctx.createOscillator();
    this.secondaryOsc.type = 'sine';
    this.secondaryOsc.frequency.setValueAtTime(baseFreq * 1.5, this.ctx.currentTime);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.secondaryOsc.connect(subGain);
    subGain.connect(this.masterGain);

    this.primaryOsc.start();
    this.secondaryOsc.start();
    this.isPlaying = true;
  }

  public playHealingItem(item: HealingItem, volume: number = 0.5): void {
    this.activeHealingItem = item;
    this.playBinaural(item.frequencyHz, item.binauralHz || 7.83, volume);
  }

  public async startPersonalResonance(carrierHz: number, binauralHz: number, volume: number = 0.7): Promise<void> {
    await this.unlockAudio();
    this.playBinaural(carrierHz, binauralHz, volume);
  }

  public startAdaptiveBioFrequency(
    carrierHz: number,
    binauralHz: number,
    mode: string = 'alpha',
    volume: number = 0.5,
    soundscape: SoundscapeType = 'ocean'
  ): void {
    this.playBinaural(carrierHz, binauralHz, volume);
    if (soundscape !== 'none') {
      this.playSoundscape(soundscape, volume * 0.6);
    }
  }

  public startSleepSoundscape(deltaHzOrConfig: number | SleepModeConfig | any, natureSound?: NatureSoundLayer | string, volume?: number): void {
    if (typeof deltaHzOrConfig === 'number') {
      const binaural = deltaHzOrConfig || 1.5;
      const soundscape = (natureSound as SoundscapeType) || 'ocean';
      const vol = volume !== undefined ? volume : 0.4;
      this.startAdaptiveBioFrequency(174, binaural, 'delta', vol, soundscape);
    } else {
      const carrier = deltaHzOrConfig?.carrierHz || 174;
      const binaural = deltaHzOrConfig?.binauralHz || 1.5; // Delta sleep
      const soundscape = (deltaHzOrConfig?.soundscape as SoundscapeType) || 'ocean';
      const vol = deltaHzOrConfig?.volume || volume || 0.4;
      this.startAdaptiveBioFrequency(carrier, binaural, 'delta', vol, soundscape);
    }
  }

  public playCompletionChimeSequence(): void {
    this.initContext();
    if (!this.ctx) return;

    const notes = [528, 639, 741, 852, 963];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.25);

      gain.gain.setValueAtTime(0, now + idx * 0.25);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.25 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.25 + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.25);
      osc.stop(now + idx * 0.25 + 1.2);
    });
  }

  public playSoundscape(type: SoundscapeType, volume: number = 0.3): void {
    if (type === 'none') {
      if (this.noiseNode) {
        try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch {}
        this.noiseNode = null;
      }
      return;
    }
    this.initContext();
    if (!this.ctx) return;

    if (this.noiseNode) {
      try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch {}
      this.noiseNode = null;
    }
    if (this.noiseGain) {
      try { this.noiseGain.disconnect(); } catch {}
      this.noiseGain = null;
    }

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = type === 'ocean' ? 'lowpass' : 'bandpass';
    filter.frequency.value = type === 'ocean' ? 400 : 800;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(volume * 0.2, this.ctx.currentTime);

    this.noiseNode.connect(filter);
    filter.connect(this.noiseGain);
    this.noiseGain.connect(this.ctx.destination);

    this.noiseNode.start();
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;
