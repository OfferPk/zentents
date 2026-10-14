/**
 * ZenTents - Procedural Woodland Acoustic Sound Synthesizer
 * Pure Web Audio API - Zero External Audio Files
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('zentents_sound');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch (e) {
      this.enabled = true;
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('zentents_sound', String(this.enabled));
    } catch (e) {}
  }

  toggleSound() {
    this.enabled = !this.enabled;
    this.saveSettings();
    if (this.enabled) {
      this.playTap();
    }
    return this.enabled;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Resonant wooden tent peg tap
   */
  playTent() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Woodblock pitch sweep
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);

    // Subtle mallet overtone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1160, t);
    osc2.frequency.exponentialRampToValueAtTime(440, t + 0.06);

    gain2.gain.setValueAtTime(0.15, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(t);
    osc2.stop(t + 0.07);
  }

  /**
   * Gentle grass mark rustle
   */
  playGrass() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.04);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Soft clear / erase tap
   */
  playClear() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Simple UI tap
   */
  playTap() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Woodland chime when row or col quota is met
   */
  playQuotaChime() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [659.25, 880.0]; // E5, A5 harmonic chime

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);

      gain.gain.setValueAtTime(0.18, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.25);
    });
  }

  /**
   * Campfire victory cascade on level completion
   */
  playVictory() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [
      392.00, // G4
      440.00, // A4
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00, // A5
      1046.50 // C6
    ];

    const t = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      const delay = i * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.22, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.55);
    });
  }
}

const sounds = new SoundManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundManager, sounds };
}
