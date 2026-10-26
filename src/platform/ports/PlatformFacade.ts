/**
 * Platform Ports & YouTube Playables SDK v1 Ambient Types
 * Layer 5 (platform): Strict boundary between game logic and external SDKs.
 */

export type RewardAdPlacementId =
  | 'reward_revive_run_v1'
  | 'reward_card_reroll_v1'
  | 'reward_double_coins_v1'
  | 'reward_persona_pip_v1'
  | 'reward_sanctuary_grant_v1';

export type DevStubAdOutcomeMode = 'grant' | 'skip' | 'error';
export type DevStubStorageMode = 'synced' | 'offline';

export interface YtSdkDiagnosticsState {
  isPlayablesEnv: boolean;
  isDevStub: boolean;
  sdkVersion: string;
  firstFrameReadyCalled: boolean;
  gameReadyCalled: boolean;
  adOutcomeMode: DevStubAdOutcomeMode;
  cloudStorageMode: DevStubStorageMode;
  lastAdPlacement: RewardAdPlacementId | null;
  lastAdResult: 'granted' | 'skipped' | 'error' | null;
  totalAdsGranted: number;
  lastSavedCloudBytes: number;
  lastSavedAtEpochMs: number | null;
  lastSubmittedScore: number | null;
  simulatedAudioEnabled: boolean;
  simulatedPaused: boolean;
}

export interface LifecyclePort {
  notifyFirstFrameReady(): void;
  notifyGameReady(): void;
  registerHandlers(handlers: { onPause: () => void; onResume: () => void }): void;
}

export interface AudioPlatformPort {
  isAudioEnabled(): boolean;
  onMuteChange(callback: (enabled: boolean) => void): void;
}

export interface StoragePort {
  loadRaw(): Promise<string>;
  loadCloudRaw(): Promise<string>;
  loadLocalBackupRaw(): string;
  saveRaw(serialized: string): Promise<boolean>;
}

export interface AdsPort {
  requestRewardedAd(rewardId: RewardAdPlacementId): Promise<boolean>;
  requestInterstitialAd(): Promise<void>;
}

export interface EngagementPort {
  sendScore(scoreValue: number): Promise<boolean>;
  openYTContent(videoId: string): Promise<boolean>;
}

export interface I18nPlatformPort {
  getLanguage(): Promise<string>;
}

export interface HealthPort {
  logError(): void;
  logWarning(): void;
}

export interface DevStubControlsPort {
  getDiagnostics(): YtSdkDiagnosticsState;
  setAdOutcomeMode(mode: DevStubAdOutcomeMode): void;
  setCloudStorageMode(mode: DevStubStorageMode): void;
  simulateSystemPause(): void;
  simulateSystemResume(): void;
  simulateAudioToggle(): boolean;
}

export interface PlatformFacade {
  readonly isPlayablesEnv: boolean;
  readonly isDevStub: boolean;
  readonly sdkVersion: string;
  readonly lifecycle: LifecyclePort;
  readonly audio: AudioPlatformPort;
  readonly storage: StoragePort;
  readonly ads: AdsPort;
  readonly engagement: EngagementPort;
  readonly i18n: I18nPlatformPort;
  readonly health: HealthPort;
  readonly devStub: DevStubControlsPort;
}

export interface YtGameSdk {
  readonly SDK_VERSION: string;
  readonly IN_PLAYABLES_ENV: boolean;
  readonly __IS_DEV_STUB__?: boolean;
  game: {
    firstFrameReady(): void;
    gameReady(): void;
    saveData(data: string): Promise<void>;
    loadData(): Promise<string>;
  };
  system: {
    isAudioEnabled(): boolean;
    onAudioEnabledChange(cb: (enabled: boolean) => void): () => void;
    onPause(cb: () => void): () => void;
    onResume(cb: () => void): () => void;
    getLanguage(): Promise<string>;
  };
  ads: {
    requestInterstitialAd(): Promise<void>;
    requestRewardedAd(rewardId: string): Promise<boolean>;
  };
  engagement: {
    sendScore(score: { value: number }): Promise<void>;
    openYTContent(content: { id: string }): Promise<void>;
  };
  health: {
    logError(): void;
    logWarning(): void;
  };
}

declare global {
  interface Window {
    ytgame?: YtGameSdk;
  }
}
