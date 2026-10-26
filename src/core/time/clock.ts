/**
 * Fixed-Timestep 60 Hz Simulation Clock with Hit-Stop & Re-orientation Countdown Ring
 * Layer 1 (core): Pure TypeScript.
 */

export const TICK_RATE = 60;
export const TICK_S = 1 / TICK_RATE;
export const TICK_MS = 1000 / TICK_RATE;
export const MAX_CATCHUP_TICKS = 5;
export const MAX_HITSTOP_MS = 80;

export class FixedClock {
  private accumulatorMs = 0;
  private hitstopMs = 0;
  private resumeCountdownMs = 0;
  private paused = false;

  /**
   * Triggers non-stacking hit-stop (longest active wins, hard-capped at 80ms per spec section 14).
   */
  public triggerHitstop(durationMs: number): void {
    const clamped = Math.min(Math.max(0, durationMs), MAX_HITSTOP_MS);
    if (clamped > this.hitstopMs) {
      this.hitstopMs = clamped;
    }
  }

  public startResumeCountdown(seconds = 1.0): void {
    this.resumeCountdownMs = Math.max(0, seconds * 1000);
    this.accumulatorMs = 0;
  }

  public getResumeCountdownRatio(): number {
    return Math.min(1, Math.max(0, this.resumeCountdownMs / 1000));
  }

  public isCountingDownResume(): boolean {
    return this.resumeCountdownMs > 0;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.accumulatorMs = 0;
    }
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public reset(): void {
    this.accumulatorMs = 0;
    this.hitstopMs = 0;
    this.resumeCountdownMs = 0;
    this.paused = false;
  }

  /**
   * Advances the clock by raw frame deltaMS, returning the number of discrete 60Hz ticks to run
   * and the sub-frame interpolation alpha in [0, 1).
   */
  public advance(rawDeltaMs: number): { ticksToRun: number; alpha: number; inHitstop: boolean } {
    if (this.paused) {
      return { ticksToRun: 0, alpha: 0, inHitstop: false };
    }

    // Clamp raw frame delta to 50ms per game craft & spec guidelines to prevent spiral of death
    const deltaMs = Math.min(Math.max(0, rawDeltaMs), 50);

    if (this.resumeCountdownMs > 0) {
      this.resumeCountdownMs = Math.max(0, this.resumeCountdownMs - deltaMs);
      return { ticksToRun: 0, alpha: 0, inHitstop: false };
    }

    if (this.hitstopMs > 0) {
      this.hitstopMs = Math.max(0, this.hitstopMs - deltaMs);
      return {
        ticksToRun: 0,
        alpha: this.accumulatorMs / TICK_MS,
        inHitstop: true,
      };
    }

    this.accumulatorMs += deltaMs;
    let ticksToRun = 0;

    while (this.accumulatorMs >= TICK_MS && ticksToRun < MAX_CATCHUP_TICKS) {
      this.accumulatorMs -= TICK_MS;
      ticksToRun++;
    }

    if (ticksToRun >= MAX_CATCHUP_TICKS) {
      this.accumulatorMs = 0;
    }

    return {
      ticksToRun,
      alpha: this.accumulatorMs / TICK_MS,
      inHitstop: false,
    };
  }
}
