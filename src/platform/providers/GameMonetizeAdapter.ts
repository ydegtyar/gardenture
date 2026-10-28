/**
 * GameMonetize SDK Adapter
 * Certification & integration according to official GameMonetize HTML5 SDK specification:
 * https://github.com/MonetizeGame/GameMonetize.com-SDK
 *
 * Implements:
 * - window.SDK_OPTIONS with gameId and onEvent (SDK_GAME_PAUSE, SDK_GAME_START, SDK_READY)
 * - sdk.showBanner() advertisement invocation
 * - Audio mute / pause game logic handling during SDK_GAME_PAUSE
 * - Audio unmute / resume game logic handling during SDK_GAME_START
 * - Rewarded ad capability with interstitial fallback for in-game rewards (revive, reroll, etc.)
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
  private allowBannerAsRewardFallback = true;
  private gameId = '';
  private adTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEventName: string | null = null;
  private lastEventTime = 0;

  constructor(options: GameMonetizeOptions = {}) {
    this.allowBannerAsRewardFallback = options.allowBannerAsRewardFallback ?? true;
    this.gameId = options.gameId ?? '';
  }

  async init(hooks: GameSystemHooks): Promise<void> {
    this.hooks = hooks;

    const gameId =
      this.gameId ||
      (typeof window !== 'undefined' && window.SDK_OPTIONS?.gameId ? window.SDK_OPTIONS.gameId : '') ||
      (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GAMEMONETIZE_GAME_ID : '') ||
      '';

    if (!gameId) {
      console.warn('[GameMonetizeAdapter] Missing VITE_GAMEMONETIZE_GAME_ID');
      return;
    }

    if (typeof window !== 'undefined') {
      // Wire global helper bridges for index.html inline script delegation
      window.__gmPause = () => this.handleGlobalSdkEvent('SDK_GAME_PAUSE');
      window.__gmResume = () => this.handleGlobalSdkEvent('SDK_GAME_START');
      window.__gmReady = () => this.handleGlobalSdkEvent('SDK_READY');

      (window as any).pauseGame = () => this.handleGlobalSdkEvent('SDK_GAME_PAUSE');
      (window as any).resumeGame = () => this.handleGlobalSdkEvent('SDK_GAME_START');
      (window as any).showBanner = () => {
        void this.showInterstitialAd();
      };

      // Flush any early events buffered prior to adapter initialization
      const earlyEvents: string[] = (window as any).__gmEventQueue || [];
      (window as any).__gmEventQueue = [];
      for (const ev of earlyEvents) {
        this.handleGlobalSdkEvent(ev);
      }

      const existingOptions = window.SDK_OPTIONS || ({} as any);
      window.SDK_OPTIONS = {
        ...existingOptions,
        gameId,
        onEvent: (event: { name: string; [key: string]: any }) => {
          this.handleGlobalSdkEvent(event.name);
        },
        pauseGame: () => this.handleGlobalSdkEvent('SDK_GAME_PAUSE'),
        resumeGame: () => this.handleGlobalSdkEvent('SDK_GAME_START'),
      };
    }

    const currentSdk = typeof window !== 'undefined' ? (window.sdk || (window as any).sdk) : null;
    if (currentSdk && typeof currentSdk.showBanner === 'function') {
      this.isReady = true;
      console.info('[GameMonetizeAdapter] GameMonetize SDK ready.');
    } else {
      if (
        typeof document !== 'undefined' &&
        !document.getElementById('gamemonetize-sdk') &&
        !document.getElementById('gamemonetize-sdk-script')
      ) {
        await loadExternalScript('https://api.gamemonetize.com/sdk.js', {
          id: 'gamemonetize-sdk-script',
        });
      }
      const loadedSdk = typeof window !== 'undefined' ? (window.sdk || (window as any).sdk) : null;
      if (loadedSdk && typeof loadedSdk.showBanner === 'function') {
        this.isReady = true;
        console.info('[GameMonetizeAdapter] GameMonetize SDK ready.');
      }
    }
  }

  public handleGlobalSdkEvent(eventName: string): void {
    const now = Date.now();
    // Debounce duplicate events arriving within 50ms (e.g. from both bridge and onEvent)
    if (this.lastEventName === eventName && now - this.lastEventTime < 50) {
      return;
    }
    this.lastEventName = eventName;
    this.lastEventTime = now;

    switch (eventName) {
      case 'SDK_GAME_PAUSE':
        if (this.adTimeoutTimer) {
          clearTimeout(this.adTimeoutTimer);
          // Ad video has started. Set 90s safety timeout in case video freezes or hangs
          this.adTimeoutTimer = setTimeout(() => {
            if (this.pendingAdResolver) {
              this.pendingAdResolver(true);
              this.pendingAdResolver = null;
            }
            this.hooks.onUnmuteAudio();
            this.hooks.onResumeGame();
          }, 90000);
        }
        this.hooks.onPauseGame();
        this.hooks.onMuteAudio();
        break;

      case 'SDK_GAME_START':
        if (this.adTimeoutTimer) {
          clearTimeout(this.adTimeoutTimer);
          this.adTimeoutTimer = null;
        }
        this.hooks.onUnmuteAudio();
        this.hooks.onResumeGame();
        if (this.pendingAdResolver) {
          this.pendingAdResolver(true);
          this.pendingAdResolver = null;
        }
        break;

      case 'SDK_READY':
        this.isReady = true;
        console.info('[GameMonetizeAdapter] GameMonetize SDK ready.');
        break;
    }
  }

  isFeatureSupported(feature: PlatformFeature): boolean {
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
    // If window.sdk is still initializing, wait briefly for it (up to 2s)
    let sdk = typeof window !== 'undefined' ? (window.sdk || (window as any).sdk) : null;
    if (!sdk?.showBanner && typeof window !== 'undefined') {
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 100));
        sdk = window.sdk || (window as any).sdk;
        if (typeof sdk?.showBanner === 'function') {
          this.isReady = true;
          break;
        }
      }
    }

    if (!sdk || typeof sdk.showBanner !== 'function') {
      console.warn('[GameMonetizeAdapter] sdk.showBanner is not available');
      return false;
    }

    return new Promise((resolve) => {
      this.pendingAdResolver = resolve;
      try {
        sdk.showBanner();
      } catch (e) {
        console.warn('[GameMonetizeAdapter] showBanner threw:', e);
        this.pendingAdResolver = null;
        resolve(false);
        return;
      }

      // Safety fallback: if neither SDK_GAME_PAUSE nor SDK_GAME_START fires within 8s (e.g. adblocker)
      this.adTimeoutTimer = setTimeout(() => {
        if (this.pendingAdResolver) {
          console.warn('[GameMonetizeAdapter] Ad response timed out.');
          this.pendingAdResolver(false);
          this.pendingAdResolver = null;
        }
      }, 8000);
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
