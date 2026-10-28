/**
 * STUB Platform Adapter (Default Provider)
 * Provides simulated rewarded and interstitial ads with an in-game UI overlay,
 * pause/resume lifecycle hooks, localStorage cloud save emulation, and guaranteed bonus rewards.
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  RewardResult,
} from '../types';

export type StubAdOutcomeMode = 'grant' | 'skip' | 'error';
export type StubStorageMode = 'synced' | 'offline';

export interface StubDiagnosticsState {
  isPlayablesEnv: boolean;
  isDevStub: boolean;
  sdkVersion: string;
  firstFrameReadyCalled: boolean;
  gameReadyCalled: boolean;
  adOutcomeMode: StubAdOutcomeMode;
  cloudStorageMode: StubStorageMode;
  lastAdPlacement: string | null;
  lastAdResult: 'granted' | 'skipped' | 'error' | null;
  totalAdsGranted: number;
  lastSavedCloudBytes: number;
  lastSavedAtEpochMs: number | null;
  lastSubmittedScore: number | null;
  simulatedAudioEnabled: boolean;
  simulatedPaused: boolean;
}

const memoryStorageFallback = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) ?? memoryStorageFallback.get(key) ?? null;
    }
  } catch {
    // Sandboxed or unavailable
  }
  return memoryStorageFallback.get(key) ?? null;
}

function safeSetItem(key: string, value: string): void {
  memoryStorageFallback.set(key, value);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Quota or sandboxed
  }
}

export class StubPlatformAdapter implements IPlatformAdapter {
  readonly providerName = 'STUB';
  private hooks: GameSystemHooks = {
    onPauseGame: () => {},
    onResumeGame: () => {},
    onMuteAudio: () => {},
    onUnmuteAudio: () => {},
  };

  private adDurationMs = 1000;
  private adOutcomeMode: StubAdOutcomeMode = 'grant';
  private cloudStorageMode: StubStorageMode = 'synced';
  private firstFrameReadySignaled = false;
  private gameReadySignaled = false;
  private lastAdPlacement: string | null = null;
  private lastAdResult: 'granted' | 'skipped' | 'error' | null = null;
  private totalAdsGranted = 0;
  private lastSavedCloudBytes = 0;
  private lastSavedAtEpochMs: number | null = null;
  private lastSubmittedScore: number | null = null;
  private simulatedAudioEnabled = true;
  private simulatedPaused = false;

  constructor(options?: { adDurationMs?: number }) {
    if (options?.adDurationMs !== undefined) {
      this.adDurationMs = options.adDurationMs;
    } else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STUB_AD_DURATION_MS) {
      const parsed = parseInt(import.meta.env.VITE_STUB_AD_DURATION_MS, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        this.adDurationMs = parsed;
      }
    }
  }

  async init(hooks: GameSystemHooks): Promise<void> {
    this.hooks = hooks;
    console.info(`[StubPlatformAdapter] Initialized STUB ads provider (adDuration: ${this.adDurationMs}ms)`);
  }

  isFeatureSupported(feature: PlatformFeature): boolean {
    switch (feature) {
      case PlatformFeature.REWARDED_ADS:
      case PlatformFeature.INTERSTITIAL_ADS:
      case PlatformFeature.CLOUD_SAVE:
      case PlatformFeature.LEADERBOARDS:
      case PlatformFeature.GAMEPLAY_TELEMETRY:
        return true;
      default:
        return false;
    }
  }

  gameReady(): void {
    this.gameReadySignaled = true;
  }

  notifyFirstFrameReady(): void {
    this.firstFrameReadySignaled = true;
  }

  gameplayStart(): void {
    this.simulatedPaused = false;
  }

  gameplayStop(): void {
    this.simulatedPaused = true;
  }

  async showRewardedAd(rewardId = 'default_reward'): Promise<RewardResult> {
    this.lastAdPlacement = rewardId;
    this.hooks.onPauseGame();
    this.hooks.onMuteAudio();

    // Check test/debug forced outcome
    if (this.adOutcomeMode === 'error') {
      this.lastAdResult = 'error';
      this.hooks.onUnmuteAudio();
      this.hooks.onResumeGame();
      return { rewarded: false, rewardId, error: 'Simulated Ad Error (Stub Mode)' };
    }

    if (this.adOutcomeMode === 'skip') {
      this.lastAdResult = 'skipped';
      this.hooks.onUnmuteAudio();
      this.hooks.onResumeGame();
      return { rewarded: false, rewardId, error: 'Simulated Ad Skipped' };
    }

    // Render visual stub ad modal if DOM is available and duration > 0
    if (typeof document !== 'undefined' && this.adDurationMs > 0) {
      await this.renderVisualStubOverlay(rewardId, this.adDurationMs);
    } else if (this.adDurationMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.adDurationMs));
    }

    this.hooks.onUnmuteAudio();
    this.hooks.onResumeGame();
    this.lastAdResult = 'granted';
    this.totalAdsGranted++;

    return { rewarded: true, rewardId };
  }

  async showInterstitialAd(placement = 'next'): Promise<boolean> {
    this.hooks.onPauseGame();
    this.hooks.onMuteAudio();

    const duration = Math.min(800, Math.max(300, this.adDurationMs * 0.6));
    if (typeof document !== 'undefined' && duration > 0) {
      await this.renderVisualInterstitialOverlay(placement, duration);
    } else if (duration > 0) {
      await new Promise((resolve) => setTimeout(resolve, duration));
    }

    this.hooks.onUnmuteAudio();
    this.hooks.onResumeGame();
    return true;
  }

  async saveData(key: string, data: string): Promise<boolean> {
    if (this.cloudStorageMode === 'offline') {
      return false;
    }
    safeSetItem(key, data);
    this.lastSavedCloudBytes = data.length;
    this.lastSavedAtEpochMs = Date.now();
    return true;
  }

  async loadData(key: string): Promise<string | null> {
    if (this.cloudStorageMode === 'offline') {
      return null;
    }
    const val = safeGetItem(key);
    if (val) {
      this.lastSavedCloudBytes = val.length;
    }
    return val;
  }

  async sendScore(score: number): Promise<boolean> {
    this.lastSubmittedScore = Math.floor(score);
    return true;
  }

  // ── Visual In-Game Stub Ad Overlays ───────────────────────────────────────

  private renderVisualStubOverlay(placement: string, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const containerId = 'gardenture-stub-rewarded-overlay';
      const existing = document.getElementById(containerId);
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = containerId;
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(16, 14, 4, 0.88);
        backdrop-filter: blur(8px);
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #e9e2cc;
        user-select: none;
      `;

      const card = document.createElement('div');
      card.style.cssText = `
        width: 90%;
        max-width: 440px;
        background: #1e1c0e;
        border: 2px solid rgba(242, 191, 82, 0.6);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
        text-align: center;
        position: relative;
      `;

      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;">
          <span style="font-size:24px;">📺</span>
          <h2 style="margin:0;font-size:20px;font-weight:700;color:#f2bf52;letter-spacing:0.5px;">SIMULATED REWARDED AD</h2>
        </div>
        <div style="font-size:12px;color:rgba(233,226,204,0.7);margin-bottom:16px;word-break:break-all;">
          Placement: <code style="color:#59dbc3;background:rgba(89,219,195,0.15);padding:2px 6px;border-radius:4px;">${placement}</code>
        </div>
        <div style="background:rgba(0,0,0,0.5);border-radius:8px;padding:12px;margin-bottom:18px;border:1px solid rgba(65,73,63,0.4);">
          <div style="font-size:13px;color:#c9c2ad;margin-bottom:8px;">
            Simulating video ad playback... <span style="color:#f2bf52;font-weight:700;">Bonuses will be granted!</span>
          </div>
          <div style="width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:999px;overflow:hidden;position:relative;">
            <div id="gardenture-stub-progress" style="width:0%;height:100%;background:linear-gradient(90deg,#59dbc3,#f2bf52);border-radius:999px;transition:width 50ms linear;"></div>
          </div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button id="gardenture-stub-skip-btn" style="
            background: linear-gradient(135deg, #f2bf52, #d49c25);
            color: #1a1604;
            font-weight: 700;
            font-size: 13px;
            padding: 10px 20px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(242,191,82,0.3);
            transition: transform 0.1s;
          ">
            ⚡ Skip & Grant Bonus
          </button>
        </div>
        <div style="margin-top:14px;font-size:11px;color:rgba(233,226,204,0.5);">
          Provider: STUB • Audio & Simulation Paused
        </div>
      `;

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const progressBar = card.querySelector('#gardenture-stub-progress') as HTMLElement;
      const skipBtn = card.querySelector('#gardenture-stub-skip-btn') as HTMLButtonElement;

      const startTime = performance.now();
      let animId = 0;
      let finished = false;

      const cleanup = () => {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(animId);
        overlay.remove();
        resolve();
      };

      skipBtn?.addEventListener('click', cleanup);

      const updateProgress = () => {
        if (finished) return;
        const elapsed = performance.now() - startTime;
        const ratio = Math.min(1, elapsed / durationMs);
        if (progressBar) progressBar.style.width = `${ratio * 100}%`;

        if (ratio >= 1) {
          cleanup();
        } else {
          animId = requestAnimationFrame(updateProgress);
        }
      };

      animId = requestAnimationFrame(updateProgress);
    });
  }

  private renderVisualInterstitialOverlay(placement: string, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const containerId = 'gardenture-stub-interstitial-overlay';
      const existing = document.getElementById(containerId);
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = containerId;
      overlay.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        background: rgba(30, 28, 14, 0.95);
        border: 1px solid #f2bf52;
        border-radius: 10px;
        padding: 10px 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #e9e2cc;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 10px;
        user-select: none;
      `;

      overlay.innerHTML = `
        <span>📺</span>
        <div>
          <strong style="color:#f2bf52;">SIMULATED INTERSTITIAL AD</strong>
          <span style="opacity:0.7;margin-left:6px;">(${placement})</span>
        </div>
      `;

      document.body.appendChild(overlay);

      setTimeout(() => {
        overlay.remove();
        resolve();
      }, durationMs);
    });
  }

  // ── Dev & Test Controls (Compatible with PlatformFacade.devStub) ──────────

  getDiagnostics(): StubDiagnosticsState {
    return {
      isPlayablesEnv: false,
      isDevStub: true,
      sdkVersion: 'stub-1.0.0',
      firstFrameReadyCalled: this.firstFrameReadySignaled,
      gameReadyCalled: this.gameReadySignaled,
      adOutcomeMode: this.adOutcomeMode,
      cloudStorageMode: this.cloudStorageMode,
      lastAdPlacement: this.lastAdPlacement,
      lastAdResult: this.lastAdResult,
      totalAdsGranted: this.totalAdsGranted,
      lastSavedCloudBytes: this.lastSavedCloudBytes,
      lastSavedAtEpochMs: this.lastSavedAtEpochMs,
      lastSubmittedScore: this.lastSubmittedScore,
      simulatedAudioEnabled: this.simulatedAudioEnabled,
      simulatedPaused: this.simulatedPaused,
    };
  }

  setAdOutcomeMode(mode: StubAdOutcomeMode): void {
    this.adOutcomeMode = mode;
  }

  setCloudStorageMode(mode: StubStorageMode): void {
    this.cloudStorageMode = mode;
  }

  simulateSystemPause(): void {
    this.simulatedPaused = true;
    this.hooks.onPauseGame();
  }

  simulateSystemResume(): void {
    this.simulatedPaused = false;
    this.hooks.onResumeGame();
  }

  simulateAudioToggle(): boolean {
    this.simulatedAudioEnabled = !this.simulatedAudioEnabled;
    if (this.simulatedAudioEnabled) {
      this.hooks.onUnmuteAudio();
    } else {
      this.hooks.onMuteAudio();
    }
    return this.simulatedAudioEnabled;
  }
}
