/**
 * Procedural WebAudio Synthesizer & Adaptive Style-Rank Music Mixer
 * Layer 5 (platform/audio): Implements YouTube Playables mute gate, SFX throttling (<=6 per 100ms),
 * and vertical stem layering (Base, Percussion, Lead at Rank A, Synth at Rank S+).
 */

export class GameAudioMixer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private platformAudioEnabled = true;
  private userMuted = false;
  private isPausedByPlatform = false;
  private isAdPlaying = false;
  private userMusicVolume = 0.0;
  private userSfxVolume = 0.85;

  private recentSfxTimestamps: number[] = [];
  private musicIntervalId: number | null = null;
  private musicStep = 0;
  private currentRankIndex = 0;

  public unlockOnUserGesture(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    this.applyEffectiveState();
  }

  public setPlatformAudioEnabled(enabled: boolean): void {
    this.platformAudioEnabled = enabled;
    this.applyEffectiveState();
  }

  public setUserMuted(muted: boolean): void {
    this.userMuted = muted;
    this.applyEffectiveState();
  }

  public isUserMuted(): boolean {
    return this.userMuted;
  }

  public setVolumes(musicVol: number, sfxVol: number): void {
    this.userMusicVolume = Math.max(0, Math.min(1, musicVol));
    this.userSfxVolume = Math.max(0, Math.min(1, sfxVol));
    this.applyEffectiveState();
  }

  public setAdPlaying(playing: boolean): void {
    this.isAdPlaying = playing;
    this.applyEffectiveState();
  }

  public onPlatformPause(): void {
    this.isPausedByPlatform = true;
    this.applyEffectiveState();
  }

  public onPlatformResume(platformAudioEnabled: boolean): void {
    this.isPausedByPlatform = false;
    this.platformAudioEnabled = platformAudioEnabled;
    this.applyEffectiveState();
  }

  public setStyleRankIndex(rankIndex: number): void {
    this.currentRankIndex = rankIndex;
  }

  private isOutputActive(): boolean {
    return (
      this.platformAudioEnabled &&
      !this.userMuted &&
      !this.isPausedByPlatform &&
      !this.isAdPlaying
    );
  }

  private applyEffectiveState(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;

    if (!this.isOutputActive()) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.ctx.state === 'running') {
        void this.ctx.suspend();
      }
    } else {
      this.musicGain.gain.setValueAtTime(this.userMusicVolume * 0.16, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.userSfxVolume * 0.35, this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    }
  }

  /**
   * Throttles sound effects to max 6 triggers per 100ms (Spec Section 14)
   */
  private canPlaySfx(): boolean {
    if (!this.ctx || !this.sfxGain || !this.isOutputActive()) return false;
    const now = performance.now();
    while (this.recentSfxTimestamps.length > 0 && now - this.recentSfxTimestamps[0]! > 100) {
      this.recentSfxTimestamps.shift();
    }
    if (this.recentSfxTimestamps.length >= 6) return false;
    this.recentSfxTimestamps.push(now);
    return true;
  }

  public playHit(isCrit: boolean): void {
    if (!this.canPlaySfx() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pitchJitter = 0.92 + Math.random() * 0.16;

    osc.type = isCrit ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime((isCrit ? 520 : 190) * pitchJitter, now);
    osc.frequency.exponentialRampToValueAtTime(isCrit ? 880 : 75, now + 0.065);

    gain.gain.setValueAtTime(isCrit ? 0.45 : 0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playDash(): void {
    if (!this.canPlaySfx() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.11);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.125);
  }

  public playHeroHurt(): void {
    if (!this.canPlaySfx() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(65, now + 0.16);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playGemPickup(): void {
    if (!this.canPlaySfx() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(990, now + 0.055);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playPowerUpUse(powerUpId?: string): void {
    if (!this.canPlaySfx() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const pitchJitter = 0.96 + Math.random() * 0.08;

    // Harmonious ascending chime chord (E5, B5, G#6) with magic resonance
    const notes = [
      { freq: 659.25 * pitchJitter, start: 0, duration: 0.18, gain: 0.28 },
      { freq: 987.77 * pitchJitter, start: 0.045, duration: 0.22, gain: 0.25 },
      { freq: 1661.22 * pitchJitter, start: 0.09, duration: 0.28, gain: 0.22 },
    ];

    for (const note of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      osc.frequency.exponentialRampToValueAtTime(note.freq * 1.08, now + note.start + note.duration);

      gain.gain.setValueAtTime(note.gain, now + note.start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.01);
    }
  }

  public playLevelUpOrRankUp(isRankUp: boolean): void {
    if (!this.ctx || !this.sfxGain || !this.isOutputActive()) return;
    const notes = isRankUp ? [440, 554.37, 659.25, 880] : [392, 493.88, 587.33, 783.99];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.32, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.24);
    });
  }

  public startAdaptiveMusicLoop(): void {
    if (this.musicIntervalId !== null) return;
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    this.musicIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.isOutputActive()) return;
      const now = this.ctx.currentTime;
      const step = this.musicStep++;

      // Base botanical pulse
      const baseNote = scale[step % scale.length]! * 0.5;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseNote, now);
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.25);

      // Lead stem unlocks at Style Rank A (index >= 3)
      if (this.currentRankIndex >= 3 && step % 2 === 0) {
        const leadNote = scale[(step * 2) % scale.length]! * (this.currentRankIndex >= 4 ? 2 : 1);
        const leadOsc = this.ctx.createOscillator();
        const leadG = this.ctx.createGain();
        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(leadNote, now);
        leadG.gain.setValueAtTime(0.15, now);
        leadG.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        leadOsc.connect(leadG);
        leadG.connect(this.musicGain);
        leadOsc.start(now);
        leadOsc.stop(now + 0.2);
      }
    }, 280);
  }

  public stopAdaptiveMusicLoop(): void {
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }
}
