// Pure Web Audio API Synthesizer — Ethereal Organic Harmonics & Crystal Bowls

class EtherealAudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private isUnlocked: boolean = false;

  private initContext() {
    if (this.ctx) return;
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      this.ctx = new AudioCtxClass();
    }
  }

  public unlock() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      });
    } else {
      this.isUnlocked = true;
    }
  }

  // Soft crystalline water droplet ripple
  public playRipple(baseFreq: number = 620) {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  // Meditative Singing Crystal Bowl / Ethereal Swell
  public playCrystalBowl(freq: number = 432) {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Dual detuned oscillators for singing bowl chorus beating
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.503, now); // Sweet fifth harmonic

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.onended = () => {
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      };

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } catch {}
  }

  // Ethereal Pentatonic Wind Chime
  public playChime() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    try {
      // Ethereal Pentatonic Frequencies (F4, Ab4, Bb4, C5, Eb5)
      const notes = [349.23, 415.30, 466.16, 523.25, 622.25];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.035, now + idx * 0.045 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };

        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.45);
      });
    } catch {}
  }

  // Backward compatibility alias for blip
  public playBlip(freq: number = 880, duration: number = 0.05) {
    this.playRipple(freq);
  }

  // Backward compatibility alias for warp
  public playWarp() {
    this.playCrystalBowl(320);
  }

  public playDreamChime() {
    this.playChime();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const cyberAudio = new EtherealAudioEngine();
