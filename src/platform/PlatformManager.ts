/**
 * Unified Platform Manager (Singleton Facade)
 * Evaluates environment configuration, lazy-loads the selected provider adapter on demand,
 * injects external scripts only when provider keys are configured, and exposes a capability-driven API.
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  PlatformProviderType,
  RewardResult,
} from './types';

export class PlatformManager {
  private adapter: IPlatformAdapter | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private pendingHooks: GameSystemHooks = {
    onPauseGame: () => {},
    onResumeGame: () => {},
    onMuteAudio: () => {},
    onUnmuteAudio: () => {},
  };

  /**
   * Lazily loads and initializes the configured portal SDK adapter.
   * If a provider requires a key that is missing, it automatically falls back to STUB.
   */
  public async initialize(
    hooks: GameSystemHooks,
    forcedAdapter?: IPlatformAdapter
  ): Promise<void> {
    this.pendingHooks = hooks;
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      if (forcedAdapter) {
        this.adapter = forcedAdapter;
        await this.adapter.init(hooks);
        this.isInitialized = true;
        console.info(`[PlatformManager] Using forced provider: ${this.adapter.providerName}`);
        return;
      }

      const env = typeof import.meta !== 'undefined' ? import.meta.env : ({} as Record<string, string>);
      const rawProvider = (env?.VITE_PLATFORM_PROVIDER || 'STUB').toUpperCase() as PlatformProviderType;

      const googleClientId = env?.VITE_GOOGLE_H5_CLIENT_ID || '';
      const googleChannelId = env?.VITE_GOOGLE_H5_CHANNEL_ID || '';
      const googleFrequencyHint = env?.VITE_GOOGLE_H5_DATA_AD_FREQUENCY_HINT || '';
      const pokiGameId = env?.VITE_POKI_GAME_ID || '';
      const crazyGamesGameId = env?.VITE_CRAZYGAMES_GAME_ID || '';
      const gameMonetizeGameId = env?.VITE_GAMEMONETIZE_GAME_ID || '';

      // Check auto-detection for live YouTube environment
      const isLiveYouTube =
        typeof window !== 'undefined' &&
        window.ytgame &&
        window.ytgame.IN_PLAYABLES_ENV &&
        !window.ytgame.__IS_DEV_STUB__;

      let resolvedProvider: PlatformProviderType = rawProvider;
      if (isLiveYouTube) {
        resolvedProvider = 'YOUTUBE';
      }

      // Validate provider key requirements before loading external SDKs
      switch (resolvedProvider) {
        case 'GOOGLE_H5': {
          const hasValidKey = googleClientId && googleClientId !== 'ca-pub-0000000000000000';
          if (!hasValidKey) {
            console.warn(
              "[PlatformManager] Provider 'GOOGLE_H5' requested but VITE_GOOGLE_H5_CLIENT_ID is not configured. Falling back to lazy STUB provider."
            );
            resolvedProvider = 'STUB';
          }
          break;
        }
        case 'POKI': {
          const hasKeyOrSdk = pokiGameId || (typeof window !== 'undefined' && typeof window.PokiSDK !== 'undefined');
          if (!hasKeyOrSdk) {
            console.warn(
              "[PlatformManager] Provider 'POKI' requested but VITE_POKI_GAME_ID is empty. Falling back to lazy STUB provider."
            );
            resolvedProvider = 'STUB';
          }
          break;
        }
        case 'CRAZYGAMES': {
          const hasKeyOrSdk = crazyGamesGameId || (typeof window !== 'undefined' && typeof window.CrazyGames !== 'undefined');
          if (!hasKeyOrSdk) {
            console.warn(
              "[PlatformManager] Provider 'CRAZYGAMES' requested but VITE_CRAZYGAMES_GAME_ID is empty. Falling back to lazy STUB provider."
            );
            resolvedProvider = 'STUB';
          }
          break;
        }
        case 'GAMEMONETIZE': {
          const hasKeyOrSdk = gameMonetizeGameId || (typeof window !== 'undefined' && typeof window.sdk !== 'undefined');
          if (!hasKeyOrSdk) {
            console.warn(
              "[PlatformManager] Provider 'GAMEMONETIZE' requested but VITE_GAMEMONETIZE_GAME_ID is empty. Falling back to lazy STUB provider."
            );
            resolvedProvider = 'STUB';
          }
          break;
        }
      }

      // Dynamic lazy imports: Vite splits each provider into a separate asynchronous chunk!
      switch (resolvedProvider) {
        case 'YOUTUBE': {
          const { YouTubePlayablesAdapter } = await import('./providers/YouTubePlayablesAdapter');
          this.adapter = new YouTubePlayablesAdapter();
          break;
        }
        case 'GOOGLE_H5': {
          const { GoogleH5AdsAdapter } = await import('./providers/GoogleH5AdsAdapter');
          this.adapter = new GoogleH5AdsAdapter({
            clientId: googleClientId,
            channelId: googleChannelId,
            frequencyHint: googleFrequencyHint,
          });
          break;
        }
        case 'POKI': {
          const { PokiAdapter } = await import('./providers/PokiAdapter');
          this.adapter = new PokiAdapter();
          break;
        }
        case 'CRAZYGAMES': {
          const { CrazyGamesAdapter } = await import('./providers/CrazyGamesAdapter');
          this.adapter = new CrazyGamesAdapter();
          break;
        }
        case 'GAMEMONETIZE': {
          const { GameMonetizeAdapter } = await import('./providers/GameMonetizeAdapter');
          this.adapter = new GameMonetizeAdapter({ gameId: gameMonetizeGameId });
          break;
        }
        case 'NONE': {
          const { NoOpLocalAdapter } = await import('./providers/NoOpLocalAdapter');
          this.adapter = new NoOpLocalAdapter();
          break;
        }
        case 'STUB':
        default: {
          const { StubPlatformAdapter } = await import('./providers/StubPlatformAdapter');
          this.adapter = new StubPlatformAdapter();
          break;
        }
      }

      await this.adapter.init(hooks);
      this.isInitialized = true;
      console.info(`[PlatformManager] Successfully initialized provider: ${this.adapter.providerName}`);
    })();

    return this.initPromise;
  }

  public get provider(): string {
    return this.adapter?.providerName ?? 'UNINITIALIZED';
  }

  public get activeAdapter(): IPlatformAdapter | null {
    return this.adapter;
  }

  /**
   * Primary handle to check if a feature (e.g. REWARDED_ADS) is available right now.
   */
  public canUse(feature: PlatformFeature): boolean {
    if (!this.adapter) return false;
    return this.adapter.isFeatureSupported(feature);
  }

  public notifyGameReady(): void {
    this.adapter?.gameReady();
  }

  public notifyGameplayStart(): void {
    this.adapter?.gameplayStart();
  }

  public notifyGameplayStop(): void {
    this.adapter?.gameplayStop();
  }

  public async requestRewardAd(rewardId: string): Promise<RewardResult> {
    if (!this.canUse(PlatformFeature.REWARDED_ADS) || !this.adapter) {
      return { rewarded: false, rewardId, error: 'REWARDED_ADS not available' };
    }
    return this.adapter.showRewardedAd(rewardId);
  }

  public async requestInterstitialAd(placement?: string): Promise<boolean> {
    if (!this.canUse(PlatformFeature.INTERSTITIAL_ADS) || !this.adapter) {
      return false;
    }
    return this.adapter.showInterstitialAd(placement);
  }

  public async save(key: string, data: object | string): Promise<boolean> {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    const safeString =
      typeof (serialized as any).isWellFormed === 'function' && !(serialized as any).isWellFormed()
        ? (serialized as any).toWellFormed()
        : serialized;

    if (this.canUse(PlatformFeature.CLOUD_SAVE) && this.adapter) {
      return this.adapter.saveData(key, safeString);
    }
    try {
      localStorage.setItem(key, safeString);
      return true;
    } catch {
      return false;
    }
  }

  public async load<T>(key: string): Promise<T | null> {
    const raw =
      this.canUse(PlatformFeature.CLOUD_SAVE) && this.adapter
        ? await this.adapter.loadData(key)
        : (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);

    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }
}

export const platform = new PlatformManager();
