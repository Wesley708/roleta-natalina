// Pure Web Audio API Christmas Sound Synthesizer (Zero external MP3 dependencies)

class ChristmasSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // Warm wooden clapper tick against brass peg
  public playWoodenTick(speedRatio: number = 0.6) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const clamped = Math.max(0.15, Math.min(1, speedRatio));
    const baseFreq = 520 + clamped * 340;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.038);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(2.4, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14 * (0.55 + clamped * 0.45), now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Joyful sleigh-bell shimmer + whoosh when gnome pushes the wheel
  public playSpinStart() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7 sleigh chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  // Magical Christmas Gift Box emergence & celesta reveal fanfare
  public playGiftRevealFanfare() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Sparkling celesta arpeggio
    const melody = [
      { freq: 523.25, delay: 0.0, dur: 0.45 },  // C5
      { freq: 659.25, delay: 0.09, dur: 0.45 }, // E5
      { freq: 783.99, delay: 0.18, dur: 0.45 }, // G5
      { freq: 1046.5, delay: 0.28, dur: 0.65 }, // C6
      { freq: 1318.5, delay: 0.42, dur: 0.85 }, // E6
      { freq: 1567.98, delay: 0.56, dur: 1.25 }, // G6
    ];

    melody.forEach(({ freq, delay, dur }) => {
      const t = now + delay;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, t);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.025, t);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0005, t + dur * 0.6);

      osc1.connect(gain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + dur + 0.04);
      osc2.stop(t + dur + 0.04);
    });
  }

  // Mechanical wooden gear ratchet click sound when opening/closing settings
  public playGearToggle() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.04, 0.09, 0.14].forEach((delay, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(460 + idx * 75, t);
      osc.frequency.exponentialRampToValueAtTime(170, t + 0.028);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.038);
    });
  }
}

export const soundEngine = new ChristmasSoundEngine();
