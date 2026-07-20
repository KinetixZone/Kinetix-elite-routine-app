
class SoundService {
  private audioCtx: AudioContext | null = null;

  private async init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn("AudioContext resume failed (user interaction needed).", e);
      }
    }
  }

  // Método explícito para llamar desde un evento de clic (Unlock iOS Audio)
  async resume() {
    await this.init();
  }

  async playTone(frequency: number, duration: number) {
    await this.init();
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.start();
    oscillator.stop(this.audioCtx.currentTime + duration);
  }

  beepLow() {
    this.playTone(800, 0.1);
  }

  beepHigh() {
    this.playTone(1200, 0.3);
  }
}

export const soundService = new SoundService();
