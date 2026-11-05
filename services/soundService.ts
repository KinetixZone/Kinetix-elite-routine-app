
class SoundService {
  private audioCtx: AudioContext | null = null;

  private async init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn("AudioContext resume failed (user interaction needed).", e);
      }
    }
  }

  // Explicit user interaction unlock (e.g. iOS Safari)
  async resume() {
    await this.init();
  }

  async playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15) {
    try {
      await this.init();
      if (!this.audioCtx) return;

      const oscillator = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      oscillator.start();
      oscillator.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback not allowed yet", e);
    }
  }

  // 440 Hz countdown beep (3, 2, 1)
  beepCountdown() {
    this.playTone(440, 0.12, 'sine', 0.2);
  }

  // 880 Hz finish / go high-pitch beep
  beepGo() {
    this.playTone(880, 0.35, 'square', 0.18);
  }

  // Double chime for rest start
  beepRest() {
    this.playTone(660, 0.15, 'sine', 0.15);
    setTimeout(() => {
      this.playTone(440, 0.25, 'sine', 0.15);
    }, 120);
  }

  beepLow() {
    this.beepCountdown();
  }

  beepHigh() {
    this.beepGo();
  }
}

export const soundService = new SoundService();
