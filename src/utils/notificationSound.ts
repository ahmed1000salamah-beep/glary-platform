/**
 * Sound Notification Service for Glary Platform
 * Generates an elegant, crystal-clear chime alert using Web Audio API
 * without external audio asset dependencies.
 */

class NotificationSoundService {
  private audioCtx: AudioContext | null = null;

  public playNotificationChime(): void {
    try {
      if (typeof window === 'undefined') return;

      // Check user setting in localStorage
      const soundSetting = localStorage.getItem('glary_notification_sound_enabled');
      if (soundSetting === 'false') {
        return;
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Harmonic three-tone chime (E5 -> B5 -> E6)
      const playTone = (freq: number, start: number, duration: number, peakGain: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        // Exponential decay envelope
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(659.25, now, 0.35, 0.22);       // Note 1: E5
      playTone(987.77, now + 0.12, 0.42, 0.25); // Note 2: B5
      playTone(1318.51, now + 0.24, 0.55, 0.18); // Note 3: E6
    } catch (err) {
      console.warn('Notification audio alert could not play:', err);
    }
  }
}

export const notificationSound = new NotificationSoundService();
