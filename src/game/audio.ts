import { EnemyKind } from './types';

export class HollowAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private droneOscA: OscillatorNode | null = null;
  private droneOscB: OscillatorNode | null = null;
  private muted: boolean = false;
  private masterVolume: number = 0.85;
  private ambientActive: boolean = false;
  private lastHeartbeatTime: number = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getDest(): AudioNode | null {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    return this.masterGain ?? ctx.destination;
  }

  public unlock(): void {
    this.ensureContext();
    this.startAmbient();
  }

  public setMasterVolume(percent: number): void {
    this.masterVolume = Math.max(0, Math.min(1, percent / 100));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public getMasterVolume(): number {
    return Math.round(this.masterVolume * 100);
  }

  public toggleMute(): boolean {
    const next = !this.muted;
    this.setMuted(next);
    if (!next) {
      this.startAmbient();
    }
    return next;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        mute ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.04
      );
    }
    if (mute) {
      this.stopAmbient();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public startAmbient(): void {
    if (this.muted || this.ambientActive) return;
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 1.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(175, ctx.currentTime);

    const oscA = ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscA.frequency.setValueAtTime(46.25, ctx.currentTime);

    const oscB = ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.setValueAtTime(69.3, ctx.currentTime);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    oscA.start();
    oscB.start();

    this.droneGain = gain;
    this.droneOscA = oscA;
    this.droneOscB = oscB;
    this.ambientActive = true;
  }

  public stopAmbient(): void {
    if (!this.ambientActive) return;
    try {
      if (this.droneGain && this.ctx) {
        this.droneGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      }
      this.droneOscA?.stop();
      this.droneOscB?.stop();
      this.droneOscA?.disconnect();
      this.droneOscB?.disconnect();
      this.droneGain?.disconnect();
    } catch {
      // Ignore already stopped oscillators
    }
    this.droneOscA = null;
    this.droneOscB = null;
    this.droneGain = null;
    this.ambientActive = false;
  }

  public playFootstep(sprinting: boolean): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    const pitchVar = 0.92 + Math.random() * 0.16;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime((sprinting ? 115 : 88) * pitchVar, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.068);

    gain.gain.setValueAtTime(sprinting ? 0.07 : 0.042, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.072);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.078);
  }

  /**
   * Procedural Lub-Dub Heartbeat when Grandfather approaches or chases Mark!
   */
  public stepHeartbeat(threatRatio: number): void {
    if (threatRatio <= 0.08 || this.muted) return;
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    // Interval accelerates from 0.92s (65 BPM) down to 0.42s (142 BPM)
    const interval = 0.92 - threatRatio * 0.5;
    if (now - this.lastHeartbeatTime < interval) return;
    this.lastHeartbeatTime = now;

    const vol = 0.05 + threatRatio * 0.11;
    // Lub
    const lub = ctx.createOscillator();
    const lubGain = ctx.createGain();
    lub.type = 'sine';
    lub.frequency.setValueAtTime(64, now);
    lub.frequency.exponentialRampToValueAtTime(32, now + 0.11);
    lubGain.gain.setValueAtTime(vol, now);
    lubGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    lub.connect(lubGain);
    lubGain.connect(dest);
    lub.start(now);
    lub.stop(now + 0.13);

    // Dub (+0.16s)
    const dub = ctx.createOscillator();
    const dubGain = ctx.createGain();
    dub.type = 'sine';
    dub.frequency.setValueAtTime(76, now + 0.16);
    dub.frequency.exponentialRampToValueAtTime(38, now + 0.27);
    dubGain.gain.setValueAtTime(vol * 0.78, now + 0.16);
    dubGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    dub.connect(dubGain);
    dubGain.connect(dest);
    dub.start(now + 0.16);
    dub.stop(now + 0.29);
  }

  public playFlashlightToggle(on: boolean): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(on ? 980 : 680, now);
    osc.frequency.exponentialRampToValueAtTime(on ? 1420 : 410, now + 0.035);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playDash(): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190 * (0.94 + Math.random() * 0.12), now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.16);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playDoorUnlock(unlocked: boolean): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    if (!unlocked) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(125, now);
      osc.frequency.setValueAtTime(92, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.15);
      return;
    }
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(620, now);
    clickOsc.frequency.exponentialRampToValueAtTime(210, now + 0.08);
    clickGain.gain.setValueAtTime(0.11, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    clickOsc.connect(clickGain);
    clickGain.connect(dest);
    clickOsc.start(now);
    clickOsc.stop(now + 0.1);

    const creakOsc = ctx.createOscillator();
    const creakGain = ctx.createGain();
    creakOsc.type = 'sawtooth';
    creakOsc.frequency.setValueAtTime(148, now + 0.08);
    creakOsc.frequency.linearRampToValueAtTime(196, now + 0.34);
    creakOsc.frequency.exponentialRampToValueAtTime(112, now + 0.56);
    creakGain.gain.setValueAtTime(0.045, now + 0.08);
    creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    creakOsc.connect(creakGain);
    creakGain.connect(dest);
    creakOsc.start(now + 0.08);
    creakOsc.stop(now + 0.6);
  }

  public playSigilAttune(collectedCount: number): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const baseFreq = 293.66 + collectedCount * 32;
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.07 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.65);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.68);
    });
  }

  public playRelicPickup(): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    [392.0, 493.88, 587.33, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.085, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.55);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.58);
    });
  }

  public playAchievementUnlock(): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.095, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.72);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.75);
    });
  }

  public playTombEruption(): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const rumble = ctx.createOscillator();
    const rGain = ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(68, now);
    rumble.frequency.exponentialRampToValueAtTime(31, now + 1.35);
    rGain.gain.setValueAtTime(0.2, now);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    rumble.connect(rGain);
    rGain.connect(dest);
    rumble.start(now);
    rumble.stop(now + 1.45);

    [220, 233.08, 311.13].forEach((f) => {
      const shriek = ctx.createOscillator();
      const sGain = ctx.createGain();
      shriek.type = 'sawtooth';
      shriek.frequency.setValueAtTime(f, now + 0.18);
      shriek.frequency.exponentialRampToValueAtTime(f * 1.65, now + 1.1);
      sGain.gain.setValueAtTime(0.055, now + 0.18);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      shriek.connect(sGain);
      sGain.connect(dest);
      shriek.start(now + 0.18);
      shriek.stop(now + 1.25);
    });
  }

  public playKillExecutionScream(): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    [185, 261.6, 370, 554.37].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.18, now + 0.55);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + 1.4);
      gain.gain.setValueAtTime(0.075, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 1.5);
    });

    const thud = ctx.createOscillator();
    const tGain = ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(140, now + 0.68);
    thud.frequency.exponentialRampToValueAtTime(24, now + 1.15);
    tGain.gain.setValueAtTime(0.25, now + 0.68);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    thud.connect(tGain);
    tGain.connect(dest);
    thud.start(now + 0.68);
    thud.stop(now + 1.22);
  }

  public playPickup(kind: 'battery' | 'tincture' | 'adrenaline'): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const startFreq = kind === 'adrenaline' ? 620 : kind === 'battery' ? 520 : 440;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.45, now + 0.18);

    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playEnemyTelegraph(kind: EnemyKind): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (kind === 'grandfather') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(165, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.42);
    } else if (kind === 'watcher') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.28);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.45);
    }

    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  public playHeavyHit(): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.34);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playBellTone(freq: number): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    overtone.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    overtone.frequency.setValueAtTime(freq * 2.02, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(dest);
    osc.start(now);
    overtone.start(now);
    osc.stop(now + 0.9);
    overtone.stop(now + 0.9);
  }

  public playWardBurst(): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.45);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playOutcomeSting(victory: boolean): void {
    this.stopAmbient();
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const freqs = victory ? [261.63, 329.63, 392.0, 523.25] : [196.0, 185.0, 146.83, 98.0];

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = victory ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(f, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.14 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.85);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.9);
    });
  }

  public playFlashlightClick(on: boolean): void {
    this.playFlashlightToggle(on);
  }

  public playPickupChime(): void {
    this.playPickup('tincture');
  }

  public playSigilSolved(): void {
    this.playSigilAttune(2);
  }

  public playBellNote(freq: number): void {
    this.playBellTone(freq);
  }

  public playDamageShock(): void {
    this.playHeavyHit();
  }

  public playMechanicalClick(pitchMul = 1.0): void {
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540 * pitchMul, now);
    osc.frequency.exponentialRampToValueAtTime(190 * pitchMul, now + 0.045);
    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playDistantThunder(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const dest = this.getDest();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(135, now);
    filter.frequency.exponentialRampToValueAtTime(48, now + 2.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    [52, 67, 89].forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.58, now + 2.3);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + 2.45);
    });

    filter.connect(gain);
    gain.connect(dest);
  }

  public updateTension(nearestDist: number, isChased: boolean): void {
    const proximity = Math.max(0, Math.min(1, (16 - nearestDist) / 14));
    this.stepHeartbeat(isChased ? Math.max(0.65, proximity) : proximity);

    if (!this.ambientActive || !this.droneGain || !this.ctx || this.muted) return;
    const targetGain = isChased ? 0.095 : 0.04 + proximity * 0.04;
    this.droneGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.25);
  }
}

export { HollowAudioEngine as HollowSoundEngine };
export const hollowAudio = new HollowAudioEngine();
