// Pure Web Audio API Synthesizer — Zero External MP3 Dependencies

class CyberAudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private isUnlocked: boolean = false;

  private initContext() {
    if (this.ctx) return;
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  public playBlip(freq: number = 880, duration: number = 0.05) {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  public playWarp() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.45);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      };

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }

  public playChime() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);

        gain.gain.setValueAtTime(0.001, now + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.04, now + idx * 0.035 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };

        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.22);
      });
    } catch {}
  }
}

export const cyberAudio = new CyberAudioEngine();
