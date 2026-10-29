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
  | 'GAMEDISTRIBUTION'
  | 'Y8'
  | 'FACEBOOK'
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
  gameDistributionGameId?: string;
  y8GameId?: string;
  y8AppId?: string;
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
    GD_OPTIONS?: {
      gameId: string;
      onEvent: (event: { name: string; [key: string]: any }) => void;
      [key: string]: any;
    };
    gdsdk?: {
      showAd: (type?: string | any) => Promise<void>;
      preloadAd?: (type?: string | any) => Promise<void>;
      openConsole?: () => void;
      AdType?: {
        Rewarded?: any;
        Interstitial?: any;
        [key: string]: any;
      };
      [key: string]: any;
    };
    __gdPause?: () => void;
    __gdResume?: () => void;
    __gdRewardedComplete?: () => void;
    __gmPause?: () => void;
    __gmResume?: () => void;
    __gmReady?: () => void;
    // Facebook Instant Games SDK (declared fully in FacebookInstantGamesAdapter.ts)
    FBInstant?: any;
    y8?: {
      sdk: () => any;
      emitReadyEvent?: () => void;
      [key: string]: any;
    };
    y8Sdk?: {
      init: (appConfig?: any, adConfig?: any) => void;
      showAd: (options: any) => Promise<any>;
      saveData?: (options: { key: string; value: string; retries?: boolean }) => Promise<any>;
      loadData?: (options: { key: string }) => Promise<string | null>;
      saveLeaderboardScore?: (options: any) => Promise<any>;
      onAuth?: (callback: (user: any, error: any) => void) => void;
      login?: () => void;
      [key: string]: any;
    };
  }
}
