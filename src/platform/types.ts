/**
 * Unified Platform & Ads Architecture Types
 * Defines feature capabilities, lifecycle contracts, ad reward results,
 * and ambient window SDK declarations.
 */

export enum PlatformFeature {
  REWARDED_ADS = 'REWARDED_ADS',
  INTERSTITIAL_ADS = 'INTERSTITIAL_ADS',
  CLOUD_SAVE = 'CLOUD_SAVE',
  LEADERBOARDS = 'LEADERBOARDS',
  GAMEPLAY_TELEMETRY = 'GAMEPLAY_TELEMETRY',
}

export type PlatformProviderType =
  | 'STUB'
  | 'YOUTUBE'
  | 'GOOGLE_H5'
  | 'POKI'
  | 'CRAZYGAMES'
  | 'GAMEMONETIZE'
  | 'NONE';

export interface RewardResult {
  rewarded: boolean;
  rewardId?: string;
  error?: string;
}

export interface GameSystemHooks {
  onPauseGame: () => void;
  onResumeGame: () => void;
  onMuteAudio: () => void;
  onUnmuteAudio: () => void;
}

export interface IPlatformAdapter {
  readonly providerName: string;
  init(hooks: GameSystemHooks): Promise<void>;
  isFeatureSupported(feature: PlatformFeature): boolean;

  // Lifecycle & Telemetry
  gameReady(): void;
  gameplayStart(): void;
  gameplayStop(): void;

  // Monetization
  showRewardedAd(rewardId?: string): Promise<RewardResult>;
  showInterstitialAd(placement?: string): Promise<boolean>;

  // Data Persistence
  saveData(key: string, data: string): Promise<boolean>;
  loadData(key: string): Promise<string | null>;
}

export interface PlatformConfig {
  provider: PlatformProviderType;
  googleClientId?: string;
  googleChannelId?: string;
  googleFrequencyHint?: string;
  pokiGameId?: string;
  crazyGamesGameId?: string;
  gameMonetizeGameId?: string;
  stubAdDurationMs?: number;
}

// Ambient declarations for external SDK globals injected dynamically or by host iframe
declare global {
  interface Window {
    adBreak?: (config: any) => void;
    adConfig?: (config: any) => void;
    PokiSDK?: {
      init: () => Promise<void>;
      gameLoadingFinished: () => void;
      gameplayStart: () => void;
      gameplayStop: () => void;
      rewardedBreak: (fn: () => void) => Promise<boolean>;
      commercialBreak: (fn: () => void) => Promise<void>;
      [key: string]: any;
    };
    CrazyGames?: {
      SDK: {
        init: () => Promise<void>;
        getEnvironment: () => Promise<string>;
        game: {
          loadingStart?: () => void;
          loadingStop: () => void;
          gameplayStart: () => void;
          gameplayStop: () => void;
          happytime?: () => void;
        };
        ad: {
          requestAd: (
            type: 'rewarded' | 'midgame',
            callbacks: {
              adStarted?: () => void;
              adFinished?: () => void;
              adError?: (err: any) => void;
            }
          ) => void;
        };
        data: {
          setItem: (key: string, value: string) => void;
          getItem: (key: string) => string | null;
        };
        [key: string]: any;
      };
    };
    sdk?: {
      showBanner: () => void;
      [key: string]: any;
    };
    SDK_OPTIONS?: {
      gameId: string;
      onEvent: (event: { name: string; [key: string]: any }) => void;
      [key: string]: any;
    };
    __gmPause?: () => void;
    __gmResume?: () => void;
    __gmReady?: () => void;
  }
}
