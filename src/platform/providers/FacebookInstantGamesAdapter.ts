/**
 * Facebook Instant Games SDK Adapter
 * Implements the Facebook Instant Games SDK v6.3 integration:
 * https://developers.facebook.com/docs/games/instant-games/sdk/fbinstant6.3
 *
 * Implements:
 * - FBInstant.initializeAsync() → setLoadingProgress() → startGameAsync() lifecycle
 * - FBInstant.getRewardedVideoAsync(placementId) with preloading
 * - FBInstant.getInterstitialAdAsync(placementId) with preloading
 * - Full audio mute / game pause handling during ad playback
 * - Safety timeouts guarding against ad blockers or unresolved promises
 * - LocalStorage-backed data persistence (FBInstant.player.setDataAsync / getDataAsync
 *   with localStorage fallback for pre-startGame stages)
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  RewardResult,
} from '../types';

interface FBInstantSDK {
  initializeAsync(): Promise<void>;
  startGameAsync(): Promise<void>;
  setLoadingProgress(value: number): void;
  quit(): void;
  player: {
    getName(): string | null;
    getID(): string | null;
    setDataAsync(data: Record<string, unknown>): Promise<void>;
    getDataAsync(keys: string[]): Promise<Record<string, unknown>>;
    flushDataAsync(): Promise<void>;
  };
  getRewardedVideoAsync(placementId: string): Promise<FBAdInstance>;
  getInterstitialAdAsync(placementId: string): Promise<FBAdInstance>;
  getLocale(): string;
  getPlatform(): string;
  on(eventName: string, callback: (...args: any[]) => void): void;
}

interface FBAdInstance {
  loadAsync(): Promise<void>;
  showAsync(): Promise<void>;
}

export interface FacebookInstantGamesAdapterOptions {
  /** Rewarded video placement ID from your Audience Network dashboard */
  rewardedPlacementId?: string;
  /** Interstitial ad placement ID from your Audience Network dashboard */
  interstitialPlacementId?: string;
}

export class FacebookInstantGamesAdapter implements IPlatformAdapter {
  readonly providerName = 'FacebookInstantGames';
  private hooks!: GameSystemHooks;
  private sdk: FBInstantSDK | null = null;
  private isStarted = false;

  private rewardedPlacementId: string;
  private interstitialPlacementId: string;

  // Preloaded ad instances (reused for minimal latency)
  private preloadedRewardedAd: FBAdInstance | null = null;
  private preloadedInterstitialAd: FBAdInstance | null = null;

  constructor(options: FacebookInstantGamesAdapterOptions = {}) {
    this.rewardedPlacementId =
      options.rewardedPlacementId ||
      (typeof import.meta !== 'undefined'
        ? (import.meta.env?.VITE_FACEBOOK_REWARDED_PLACEMENT_ID as string)
        : '') ||
      '';
    this.interstitialPlacementId =
      options.interstitialPlacementId ||
      (typeof import.meta !== 'undefined'
        ? (import.meta.env?.VITE_FACEBOOK_INTERSTITIAL_PLACEMENT_ID as string)
        : '') ||
      '';
  }

  async init(hooks: GameSystemHooks): Promise<void> {
    this.hooks = hooks;

    if (typeof window === 'undefined' || !window.FBInstant) {
      console.warn('[FacebookInstantGamesAdapter] FBInstant SDK not found on window.');
      return;
    }

    this.sdk = window.FBInstant as FBInstantSDK;

    try {
      // Phase 1: Wait for early init promise or call initializeAsync directly
      if ((window as any).__fbInstantInitPromise) {
        await (window as any).__fbInstantInitPromise;
      } else {
        await this.sdk.initializeAsync();
      }
      console.info('[FacebookInstantGamesAdapter] FBInstant.initializeAsync() resolved.');

      // Phase 2: Report loading complete (100% loaded)
      this.sdk.setLoadingProgress(100);

      // Phase 3: Start the game session
      await this.sdk.startGameAsync();
      this.isStarted = true;
      const sdk = this.sdk;
      console.info(
        `[FacebookInstantGamesAdapter] Game started. Platform: ${sdk.getPlatform()}, Locale: ${sdk.getLocale()}`
      );

      // Phase 4: Preload ads in background (non-blocking)
      this._preloadAds().catch((e) =>
        console.warn('[FacebookInstantGamesAdapter] Ad preload failed silently:', e)
      );
    } catch (e) {
      console.warn('[FacebookInstantGamesAdapter] Initialization error:', e);
    }
  }

  /**
   * Preloads both rewarded and interstitial ad instances for immediate display.
   * Facebook recommends caching up to 3 ads. We cache 1 of each.
   */
  private async _preloadAds(): Promise<void> {
    await Promise.allSettled([
      this._loadRewardedAd(),
      this._loadInterstitialAd(),
    ]);
  }

  private async _loadRewardedAd(): Promise<void> {
    if (!this.sdk || !this.rewardedPlacementId) return;
    try {
      const ad = await this.sdk.getRewardedVideoAsync(this.rewardedPlacementId);
      await ad.loadAsync();
      this.preloadedRewardedAd = ad;
      console.debug('[FacebookInstantGamesAdapter] Rewarded video preloaded.');
    } catch (e) {
      this.preloadedRewardedAd = null;
      console.warn('[FacebookInstantGamesAdapter] Rewarded ad preload error:', e);
    }
  }

  private async _loadInterstitialAd(): Promise<void> {
    if (!this.sdk || !this.interstitialPlacementId) return;
    try {
      const ad = await this.sdk.getInterstitialAdAsync(this.interstitialPlacementId);
      await ad.loadAsync();
      this.preloadedInterstitialAd = ad;
      console.debug('[FacebookInstantGamesAdapter] Interstitial ad preloaded.');
    } catch (e) {
      this.preloadedInterstitialAd = null;
      console.warn('[FacebookInstantGamesAdapter] Interstitial ad preload error:', e);
    }
  }

  isFeatureSupported(feature: PlatformFeature): boolean {
    if (!this.isStarted) return false;
    switch (feature) {
      case PlatformFeature.REWARDED_ADS:
        return !!this.rewardedPlacementId;
      case PlatformFeature.INTERSTITIAL_ADS:
        return !!this.interstitialPlacementId;
      case PlatformFeature.CLOUD_SAVE:
        return true;
      case PlatformFeature.GAMEPLAY_TELEMETRY:
        return true;
      default:
        return false;
    }
  }

  gameReady(): void {
    // FBInstant.setLoadingProgress(100) and startGameAsync() are handled in init.
    // This is a no-op for the Facebook platform.
  }

  gameplayStart(): void {
    // Gameplay telemetry: can be extended with FBInstant.logEvent() if needed
    console.debug('[FacebookInstantGamesAdapter] Gameplay started.');
  }

  gameplayStop(): void {
    console.debug('[FacebookInstantGamesAdapter] Gameplay stopped.');
  }

  async showRewardedAd(rewardId = 'rewarded-ad'): Promise<RewardResult> {
    if (!this.isFeatureSupported(PlatformFeature.REWARDED_ADS) || !this.sdk) {
      return { rewarded: false, rewardId, error: 'Rewarded ads not available' };
    }

    return new Promise<RewardResult>(async (resolve) => {
      let settled = false;
      const finish = (rewarded: boolean, err?: string) => {
        if (settled) return;
        settled = true;
        if (timeoutHandle) clearTimeout(timeoutHandle);
        this.hooks.onUnmuteAudio();
        this.hooks.onResumeGame();
        // Preload next ad instance asynchronously
        this._loadRewardedAd().catch(() => {});
        resolve({ rewarded, rewardId, error: err });
      };

      const timeoutHandle = setTimeout(() => {
        console.warn('[FacebookInstantGamesAdapter] Rewarded ad timed out.');
        finish(false, 'TIMEOUT');
      }, 20000);

      this.hooks.onPauseGame();
      this.hooks.onMuteAudio();

      try {
        // Use preloaded ad or fetch a fresh one
        let ad = this.preloadedRewardedAd;
        if (!ad) {
          ad = await this.sdk!.getRewardedVideoAsync(this.rewardedPlacementId);
          await ad.loadAsync();
        }
        this.preloadedRewardedAd = null; // consume the cached instance
        await ad.showAsync();
        finish(true);
      } catch (e: any) {
        const msg = e?.message || String(e);
        // USER_INPUT error means the user closed the ad early — not a reward
        const rewarded = false;
        finish(rewarded, msg);
      }
    });
  }

  async showInterstitialAd(placement = 'interstitial'): Promise<boolean> {
    if (!this.isFeatureSupported(PlatformFeature.INTERSTITIAL_ADS) || !this.sdk) {
      return false;
    }

    return new Promise<boolean>(async (resolve) => {
      let settled = false;
      const finish = (success: boolean) => {
        if (settled) return;
        settled = true;
        if (timeoutHandle) clearTimeout(timeoutHandle);
        this.hooks.onUnmuteAudio();
        this.hooks.onResumeGame();
        this._loadInterstitialAd().catch(() => {});
        resolve(success);
      };

      const timeoutHandle = setTimeout(() => {
        console.warn('[FacebookInstantGamesAdapter] Interstitial ad timed out.');
        finish(false);
      }, 15000);

      this.hooks.onPauseGame();
      this.hooks.onMuteAudio();

      try {
        let ad = this.preloadedInterstitialAd;
        if (!ad) {
          ad = await this.sdk!.getInterstitialAdAsync(this.interstitialPlacementId);
          await ad.loadAsync();
        }
        this.preloadedInterstitialAd = null;
        await ad.showAsync();
        finish(true);
      } catch (e: any) {
        console.warn('[FacebookInstantGamesAdapter] Interstitial show error:', e?.message);
        finish(false);
      }
    });
  }

  async saveData(key: string, data: string): Promise<boolean> {
    // FBInstant player data storage uses object-based key-value pairs
    if (this.sdk && this.isStarted) {
      try {
        await this.sdk.player.setDataAsync({ [key]: data });
        // Immediately flush to persist (avoids data loss on unexpected exits)
        await this.sdk.player.flushDataAsync();
        return true;
      } catch (e) {
        console.warn('[FacebookInstantGamesAdapter] Cloud save error, falling back to localStorage:', e);
      }
    }
    try {
      localStorage.setItem(key, data);
      return true;
    } catch {
      return false;
    }
  }

  async loadData(key: string): Promise<string | null> {
    if (this.sdk && this.isStarted) {
      try {
        const result = await this.sdk.player.getDataAsync([key]);
        const value = result[key];
        if (value !== undefined && value !== null) {
          return typeof value === 'string' ? value : JSON.stringify(value);
        }
      } catch (e) {
        console.warn('[FacebookInstantGamesAdapter] Cloud load error, falling back to localStorage:', e);
      }
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}
