/**
 * Concrete Platform Adapters: YouTubePlatformAdapter & Development Mode ytgame SDK Stub
 * Layer 5 (platform): Implements YouTube Playables SDK Integration Specification Section 11,
 * Rewarded Ads lifecycle, 16 KiB Cloud Save + LocalStorage backup, and Dev Mode Stubs.
 */

import type {
  DevStubAdOutcomeMode,
  DevStubControlsPort,
  DevStubStorageMode,
  PlatformFacade,
  RewardAdPlacementId,
  YtGameSdk,
  YtSdkDiagnosticsState,
} from './ports/PlatformFacade';

export const LOCAL_STORAGE_KEY = 'swipe_roguelite_save_v1';
export const YT_CLOUD_STUB_STORAGE_KEY = 'swipe_roguelite_ytcloud_stub_v1';
export const MAX_YT_CLOUD_SAVE_BYTES = 16_384;

const memoryStorageFallback = new Map<string, string>();

function readStorageItem(key: string): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) ?? memoryStorageFallback.get(key) ?? '';
    }
  } catch {
    // Fallback to in-memory map if sandboxed
  }
  return memoryStorageFallback.get(key) ?? '';
}

function writeStorageItem(key: string, value: string): void {
  memoryStorageFallback.set(key, value);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage quota or sandboxed restrictions
  }
}

export function getUtf8ByteLength(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return str.length;
}

export function readLocalBackup(): string {
  return readStorageItem(LOCAL_STORAGE_KEY);
}

export function writeLocalBackup(serialized: string): void {
  writeStorageItem(LOCAL_STORAGE_KEY, serialized);
}

export interface DevModeYtGameStubInstance {
  sdk: YtGameSdk;
  controls: DevStubControlsPort;
}

/**
 * Creates a complete YouTube Playables SDK v1 Development Mode Stub (`window.ytgame`).
 * Simulates `game.firstFrameReady`, `game.gameReady`, `game.saveData` (with 16 KiB quota enforcement),
 * `game.loadData`, `ads.requestRewardedAd` (with pause/resume lifecycle & configurable grant/skip/error),
 * `engagement.sendScore`, `system.onPause`/`onResume`/`onAudioEnabledChange`, and `health`.
 */
export function createDevModeYtGameStub(options?: {
  adDelayMs?: number;
  initialAdOutcome?: DevStubAdOutcomeMode;
  initialCloudStorageMode?: DevStubStorageMode;
}): DevModeYtGameStubInstance {
  const adDelayMs = options?.adDelayMs ?? 180;
  const pauseListeners = new Set<() => void>();
  const resumeListeners = new Set<() => void>();
  const audioListeners = new Set<(enabled: boolean) => void>();

  // Initialize cloud stub bytes from any existing persisted cloud stub payload
  const existingCloud = readStorageItem(YT_CLOUD_STUB_STORAGE_KEY);

  const state: YtSdkDiagnosticsState = {
    isPlayablesEnv: false,
    isDevStub: true,
    sdkVersion: 'ytgame-dev-stub-1.0.0',
    firstFrameReadyCalled: false,
    gameReadyCalled: false,
    adOutcomeMode: options?.initialAdOutcome ?? 'grant',
    cloudStorageMode: options?.initialCloudStorageMode ?? 'synced',
    lastAdPlacement: null,
    lastAdResult: null,
    totalAdsGranted: 0,
    lastSavedCloudBytes: existingCloud ? getUtf8ByteLength(existingCloud) : 0,
    lastSavedAtEpochMs: existingCloud ? Date.now() : null,
    lastSubmittedScore: null,
    simulatedAudioEnabled: true,
    simulatedPaused: false,
  };

  const controls: DevStubControlsPort = {
    getDiagnostics: (): YtSdkDiagnosticsState => ({ ...state }),
    setAdOutcomeMode: (mode: DevStubAdOutcomeMode): void => {
      state.adOutcomeMode = mode;
    },
    setCloudStorageMode: (mode: DevStubStorageMode): void => {
      state.cloudStorageMode = mode;
    },
    simulateSystemPause: (): void => {
      state.simulatedPaused = true;
      for (const cb of pauseListeners) {
        try {
          cb();
        } catch {
          // Ignore listener error
        }
      }
    },
    simulateSystemResume: (): void => {
      state.simulatedPaused = false;
      for (const cb of resumeListeners) {
        try {
          cb();
        } catch {
          // Ignore listener error
        }
      }
    },
    simulateAudioToggle: (): boolean => {
      state.simulatedAudioEnabled = !state.simulatedAudioEnabled;
      for (const cb of audioListeners) {
        try {
          cb(state.simulatedAudioEnabled);
        } catch {
          // Ignore listener error
        }
      }
      return state.simulatedAudioEnabled;
    },
  };

  const sdk: YtGameSdk = {
    SDK_VERSION: state.sdkVersion,
    IN_PLAYABLES_ENV: false,
    __IS_DEV_STUB__: true,
    game: {
      firstFrameReady: (): void => {
        state.firstFrameReadyCalled = true;
      },
      gameReady: (): void => {
        state.gameReadyCalled = true;
      },
      saveData: async (data: string): Promise<void> => {
        if (state.cloudStorageMode === 'offline') {
          throw new Error('Simulated YouTube Cloud Save offline in dev stub');
        }
        const byteLen = getUtf8ByteLength(data);
        if (byteLen > MAX_YT_CLOUD_SAVE_BYTES) {
          throw new Error(
            `YouTube Playables saveData exceeds 16 KiB quota (${byteLen} > ${MAX_YT_CLOUD_SAVE_BYTES})`
          );
        }
        writeStorageItem(YT_CLOUD_STUB_STORAGE_KEY, data);
        state.lastSavedCloudBytes = byteLen;
        state.lastSavedAtEpochMs = Date.now();
      },
      loadData: async (): Promise<string> => {
        if (state.cloudStorageMode === 'offline') {
          throw new Error('Simulated YouTube Cloud Load offline in dev stub');
        }
        const raw = readStorageItem(YT_CLOUD_STUB_STORAGE_KEY);
        if (raw) {
          state.lastSavedCloudBytes = getUtf8ByteLength(raw);
        }
        return raw;
      },
    },
    system: {
      isAudioEnabled: (): boolean => state.simulatedAudioEnabled,
      onAudioEnabledChange: (cb: (enabled: boolean) => void): (() => void) => {
        audioListeners.add(cb);
        return () => audioListeners.delete(cb);
      },
      onPause: (cb: () => void): (() => void) => {
        pauseListeners.add(cb);
        return () => pauseListeners.delete(cb);
      },
      onResume: (cb: () => void): (() => void) => {
        resumeListeners.add(cb);
        return () => resumeListeners.delete(cb);
      },
      getLanguage: async (): Promise<string> => {
        if (typeof navigator !== 'undefined' && navigator.language) {
          return navigator.language;
        }
        return 'en';
      },
    },
    ads: {
      requestInterstitialAd: async (): Promise<void> => {
        if (adDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(80, adDelayMs)));
        }
      },
      requestRewardedAd: async (rewardId: string): Promise<boolean> => {
        state.lastAdPlacement = rewardId as RewardAdPlacementId;
        if (adDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, adDelayMs));
        }
        if (state.adOutcomeMode === 'error') {
          state.lastAdResult = 'error';
          throw new Error('Simulated Rewarded Ad unavailable in dev stub');
        }
        if (state.adOutcomeMode === 'skip') {
          state.lastAdResult = 'skipped';
          return false;
        }
        state.lastAdResult = 'granted';
        state.totalAdsGranted++;
        return true;
      },
    },
    engagement: {
      sendScore: async (score: { value: number }): Promise<void> => {
        state.lastSubmittedScore = Math.max(0, Math.floor(score.value));
      },
      openYTContent: async (_content: { id: string }): Promise<void> => {},
    },
    health: {
      logError: (): void => {},
      logWarning: (): void => {},
    },
  };

  return { sdk, controls };
}

export class YouTubePlatformAdapter implements PlatformFacade {
  public readonly isPlayablesEnv: boolean;
  public readonly isDevStub: boolean;
  public readonly sdkVersion: string;
  public readonly devStub: DevStubControlsPort;

  private pauseUnsub: (() => void) | null = null;
  private resumeUnsub: (() => void) | null = null;
  private audioUnsub: (() => void) | null = null;
  private firstFrameSignaled = false;
  private gameReadySignaled = false;
  private errorCount = 0;
  private warningCount = 0;

  private lastAdPlacement: RewardAdPlacementId | null = null;
  private lastAdResult: 'granted' | 'skipped' | 'error' | null = null;
  private totalAdsGranted = 0;
  private lastSavedCloudBytes = 0;
  private lastSavedAtEpochMs: number | null = null;
  private lastSubmittedScore: number | null = null;

  constructor(
    private readonly sdk: YtGameSdk,
    devStubControls?: DevStubControlsPort
  ) {
    this.isPlayablesEnv = Boolean(sdk.IN_PLAYABLES_ENV);
    this.isDevStub = Boolean(sdk.__IS_DEV_STUB__ || !sdk.IN_PLAYABLES_ENV);
    this.sdkVersion = sdk.SDK_VERSION || '1.0.0';

    if (typeof window !== 'undefined') {
      window.addEventListener('error', () => this.health.logError());
      window.addEventListener('unhandledrejection', () => this.health.logError());
      document.addEventListener('visibilitychange', () => {
        if (!this.isPlayablesEnv && devStubControls) {
          if (document.hidden) devStubControls.simulateSystemPause();
          else devStubControls.simulateSystemResume();
        }
      });
    }

    this.devStub =
      devStubControls ?? {
        getDiagnostics: (): YtSdkDiagnosticsState => ({
          isPlayablesEnv: this.isPlayablesEnv,
          isDevStub: this.isDevStub,
          sdkVersion: this.sdkVersion,
          firstFrameReadyCalled: this.firstFrameSignaled,
          gameReadyCalled: this.gameReadySignaled,
          adOutcomeMode: 'grant',
          cloudStorageMode: 'synced',
          lastAdPlacement: this.lastAdPlacement,
          lastAdResult: this.lastAdResult,
          totalAdsGranted: this.totalAdsGranted,
          lastSavedCloudBytes: this.lastSavedCloudBytes,
          lastSavedAtEpochMs: this.lastSavedAtEpochMs,
          lastSubmittedScore: this.lastSubmittedScore,
          simulatedAudioEnabled: this.audio.isAudioEnabled(),
          simulatedPaused: false,
        }),
        setAdOutcomeMode: () => {},
        setCloudStorageMode: () => {},
        simulateSystemPause: () => {},
        simulateSystemResume: () => {},
        simulateAudioToggle: () => this.audio.isAudioEnabled(),
      };
  }

  public readonly lifecycle = {
    notifyFirstFrameReady: (): void => {
      if (this.firstFrameSignaled) return;
      this.firstFrameSignaled = true;
      try {
        this.sdk.game.firstFrameReady();
      } catch {
        this.health.logWarning();
      }
    },
    notifyGameReady: (): void => {
      if (!this.firstFrameSignaled) {
        this.lifecycle.notifyFirstFrameReady();
      }
      if (this.gameReadySignaled) return;
      this.gameReadySignaled = true;
      try {
        this.sdk.game.gameReady();
      } catch {
        this.health.logWarning();
      }
    },
    registerHandlers: (handlers: { onPause: () => void; onResume: () => void }): void => {
      this.pauseUnsub?.();
      this.resumeUnsub?.();
      try {
        this.pauseUnsub = this.sdk.system.onPause(handlers.onPause);
        this.resumeUnsub = this.sdk.system.onResume(handlers.onResume);
      } catch {
        // Ignore if host SDK does not support pause hooks
      }
    },
  };

  public readonly audio = {
    isAudioEnabled: (): boolean => {
      try {
        return this.sdk.system.isAudioEnabled();
      } catch {
        return true;
      }
    },
    onMuteChange: (cb: (enabled: boolean) => void): void => {
      this.audioUnsub?.();
      try {
        this.audioUnsub = this.sdk.system.onAudioEnabledChange(cb);
      } catch {
        // Ignore
      }
    },
  };

  public readonly storage = {
    loadCloudRaw: async (): Promise<string> => {
      try {
        const cloud = await this.sdk.game.loadData();
        if (cloud && cloud.length > 2) {
          this.lastSavedCloudBytes = getUtf8ByteLength(cloud);
          return cloud;
        }
      } catch {
        this.health.logWarning();
      }
      return '';
    },
    loadLocalBackupRaw: (): string => {
      return readLocalBackup();
    },
    loadRaw: async (): Promise<string> => {
      const cloud = await this.storage.loadCloudRaw();
      if (cloud) return cloud;
      return readLocalBackup();
    },
    saveRaw: async (serialized: string): Promise<boolean> => {
      const byteLen = getUtf8ByteLength(serialized);
      if (byteLen > MAX_YT_CLOUD_SAVE_BYTES) {
        this.health.logWarning();
      }
      writeLocalBackup(serialized);
      try {
        await this.sdk.game.saveData(serialized);
        this.lastSavedCloudBytes = byteLen;
        this.lastSavedAtEpochMs = Date.now();
        return true;
      } catch {
        this.health.logError();
        return false;
      }
    },
  };

  public readonly ads = {
    requestRewardedAd: async (rewardId: RewardAdPlacementId): Promise<boolean> => {
      this.lastAdPlacement = rewardId;
      try {
        const earned = await this.sdk.ads.requestRewardedAd(rewardId);
        const granted = Boolean(earned);
        this.lastAdResult = granted ? 'granted' : 'skipped';
        if (granted) {
          this.totalAdsGranted++;
        }
        return granted;
      } catch {
        this.lastAdResult = 'error';
        return false;
      }
    },
    requestInterstitialAd: async (): Promise<void> => {
      try {
        await this.sdk.ads.requestInterstitialAd();
      } catch {
        // Interstitial skipped or unavailable
      }
    },
  };

  public readonly engagement = {
    sendScore: async (scoreValue: number): Promise<boolean> => {
      const cleanScore = Math.max(0, Math.floor(scoreValue));
      try {
        await this.sdk.engagement.sendScore({ value: cleanScore });
        this.lastSubmittedScore = cleanScore;
        return true;
      } catch {
        this.health.logWarning();
        return false;
      }
    },
    openYTContent: async (videoId: string): Promise<boolean> => {
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return false;
      try {
        await this.sdk.engagement.openYTContent({ id: videoId });
        return true;
      } catch {
        return false;
      }
    },
  };

  public readonly i18n = {
    getLanguage: async (): Promise<string> => {
      try {
        return (await this.sdk.system.getLanguage()) || 'en';
      } catch {
        return 'en';
      }
    },
  };

  public readonly health = {
    logError: (): void => {
      if (this.errorCount >= 10) return;
      this.errorCount++;
      try {
        this.sdk.health.logError();
      } catch {
        // Ignore
      }
    },
    logWarning: (): void => {
      if (this.warningCount >= 10) return;
      this.warningCount++;
      try {
        this.sdk.health.logWarning();
      } catch {
        // Ignore
      }
    },
  };
}

export function createPlatformFacade(options?: {
  adDelayMs?: number;
  initialAdOutcome?: DevStubAdOutcomeMode;
  initialCloudStorageMode?: DevStubStorageMode;
}): PlatformFacade {
  if (
    typeof window !== 'undefined' &&
    window.ytgame &&
    window.ytgame.IN_PLAYABLES_ENV &&
    !window.ytgame.__IS_DEV_STUB__
  ) {
    return new YouTubePlatformAdapter(window.ytgame);
  }

  // Install Development Mode ytgame SDK stub onto window.ytgame when outside the live Playables host
  const { sdk, controls } = createDevModeYtGameStub(options);
  if (typeof window !== 'undefined') {
    window.ytgame = sdk;
  }
  return new YouTubePlatformAdapter(sdk, controls);
}
