/**
 * GameMonetize SDK Adapter
 * Implements GameMonetize with global event bus:
 * window.SDK_OPTIONS.onEvent handles SDK_GAME_PAUSE and SDK_GAME_START.
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  RewardResult,
} from '../types';
import { loadExternalScript } from '../scriptLoader';

export interface GameMonetizeOptions {
  gameId?: string;
  allowBannerAsRewardFallback?: boolean;
}

export class GameMonetizeAdapter implements IPlatformAdapter {
  readonly providerName = 'GameMonetize';
  private hooks!: GameSystemHooks;
  private isReady = false;
  private pendingAdResolver: ((completed: boolean) => void) | null = null;
  private allowBannerAsRewardFallback = false;

  constructor(options: GameMonetizeOptions = {}) {
    this.allowBannerAsRewardFallback = options.allowBannerAsRewardFallback ?? false;
  }

  async init(hooks: GameSystemHooks): Promise<void> {
    this.hooks = hooks;

    const gameId =
      (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GAMEMONETIZE_GAME_ID : '') ||
      '';

    if (!gameId) {
      console.warn('[GameMonetizeAdapter] Missing VITE_GAMEMONETIZE_GAME_ID');
      return;
    }

    if (typeof window !== 'undefined') {
      window.SDK_OPTIONS = {
        gameId,
        onEvent: (event: { name: string }) => {
          this.handleGlobalSdkEvent(event.name);
        },
      };
    }

    await loadExternalScript('https://api.gamemonetize.com/sdk.js', {
      id: 'gamemonetize-sdk-script',
    });

    if (typeof window !== 'undefined' && typeof window.sdk !== 'undefined') {
      this.isReady = true;
      console.info('[GameMonetizeAdapter] GameMonetize SDK ready.');
    }
  }

  public handleGlobalSdkEvent(eventName: string): void {
    switch (eventName) {
      case 'SDK_GAME_PAUSE':
        this.hooks.onPauseGame();
        this.hooks.onMuteAudio();
        break;
      case 'SDK_GAME_START':
        this.hooks.onUnmuteAudio();
        this.hooks.onResumeGame();
        if (this.pendingAdResolver) {
          this.pendingAdResolver(true);
          this.pendingAdResolver = null;
        }
        break;
    }
  }

  isFeatureSupported(feature: PlatformFeature): boolean {
    if (!this.isReady || typeof window === 'undefined' || typeof window.sdk?.showBanner !== 'function') {
      return false;
    }
    switch (feature) {
      case PlatformFeature.INTERSTITIAL_ADS:
        return true;
      case PlatformFeature.REWARDED_ADS:
        return this.allowBannerAsRewardFallback;
      default:
        return false;
    }
  }

  gameReady(): void {}
  gameplayStart(): void {}
  gameplayStop(): void {}

  async showRewardedAd(rewardId = 'default'): Promise<RewardResult> {
    if (!this.isFeatureSupported(PlatformFeature.REWARDED_ADS)) {
      return {
        rewarded: false,
        rewardId,
        error: 'Dedicated rewarded ads not supported by GameMonetize',
      };
    }
    const shown = await this.showInterstitialAd();
    return { rewarded: shown, rewardId };
  }

  async showInterstitialAd(): Promise<boolean> {
    if (!this.isFeatureSupported(PlatformFeature.INTERSTITIAL_ADS) || !window.sdk?.showBanner) {
      return false;
    }

    return new Promise((resolve) => {
      this.pendingAdResolver = resolve;
      try {
        window.sdk!.showBanner();
      } catch (e) {
        console.warn('[GameMonetizeAdapter] showBanner threw:', e);
        this.pendingAdResolver = null;
        resolve(false);
        return;
      }

      // Safety fallback in case adblocker blocks SDK_GAME_START from firing
      setTimeout(() => {
        if (this.pendingAdResolver) {
          this.pendingAdResolver(false);
          this.pendingAdResolver = null;
        }
      }, 7000);
    });
  }

  async saveData(key: string, data: string): Promise<boolean> {
    try {
      localStorage.setItem(key, data);
      return true;
    } catch {
      return false;
    }
  }

  async loadData(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}
