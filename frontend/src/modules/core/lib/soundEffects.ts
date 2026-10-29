/**
 * VeloX Audio Engine — Synthesizes premium system notification chimes
 * Built on HTML5 Web Audio API — 100% reliable, zero external MP3 dependencies, instant.
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('velox_sound_muted') === 'true';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Browser autoplay policy requires user interaction before audio can play.
   * This unlocks the AudioContext automatically upon first tap/click/keypress.
   */
  public initUnlockListener() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      try {
        const ctx = this.getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      } catch {}
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { passive: true, once: true });
    window.addEventListener('keydown', unlock, { passive: true, once: true });
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('velox_sound_muted', muted ? 'true' : 'false');
    }
  }

  public toggleMute(): boolean {
    const next = !this.isMuted;
    this.setMuted(next);
    return next;
  }

  /**
   * Premium 2-tone harmonic chime for new incoming Admin updates & messages
   * Notes: E5 (659.25Hz) -> A5 (880.00Hz) with natural acoustic bell resonance
   */
  public playNotificationChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime + 0.01;

      // 2 melodic bell tones
      const notes = [
        { freq: 659.25, time: now, duration: 0.5, gainVal: 0.22 },
        { freq: 880.00, time: now + 0.14, duration: 0.85, gainVal: 0.28 },
      ];

      notes.forEach(({ freq, time, duration, gainVal }) => {
        // Main fundamental tone (Pure Sine)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        // Harmonic overtone for sparkling crystal chime texture
        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2.01, time); // slight harmonic shimmer

        // Volume Envelope: Crisp soft attack, exponential acoustic decay
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(gainVal, time + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        overtoneGain.gain.setValueAtTime(0.0001, time);
        overtoneGain.gain.linearRampToValueAtTime(gainVal * 0.35, time + 0.02);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.65);

        osc.connect(gain);
        overtone.connect(overtoneGain);
        gain.connect(ctx.destination);
        overtoneGain.connect(ctx.destination);

        osc.start(time);
        overtone.start(time);
        osc.stop(time + duration);
        overtone.stop(time + duration);
      });
    } catch (e) {
      console.warn('[VeloX Sound] Could not play notification chime:', e);
    }
  }

  /**
   * Alert chime for urgent events such as Maintenance Mode toggles
   * Notes: Descending alert sequence (A5: 880Hz -> F5: 698.46Hz -> D5: 587.33Hz)
   */
  public playMaintenanceAlertSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime + 0.01;
      const tones = [
        { freq: 880.00, time: now, duration: 0.22, vol: 0.26 },
        { freq: 698.46, time: now + 0.16, duration: 0.24, vol: 0.26 },
        { freq: 587.33, time: now + 0.32, duration: 0.75, vol: 0.3 },
      ];

      tones.forEach(({ freq, time, duration, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
      });
    } catch (e) {
      console.warn('[VeloX Sound] Could not play alert sound:', e);
    }
  }
}

export const soundEffects = new SoundEffectsManager();
