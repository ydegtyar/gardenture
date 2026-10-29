/**
 * Y8 HTML5 SDK Adapter
 * Integration according to official Y8 SDK specification:
 * https://docs.y8.com/sdk/intro/
 *
 * Implements:
 * - Lazy-loading of minimal SDK (https://cdn.y8.com/minimal-sdk/2-0/y8.min.js)
 * - y8sdk.ready event handling and fallback initialization
 * - y8Sdk.init(appConfig, adConfig) with Game ID (290159) and App ID (6ae32a67ba1f868b83779a1f)
 * - y8Sdk.showAd({ type: 'reward', ... }) for rewarded video ads
 * - y8Sdk.showAd({ type: 'next' | 'pause', ... }) for interstitial ads
 * - Full audio mute / game pause handling during ad playback
 * - Full audio unmute / game resume handling after ad playback
 * - Safety timeouts guarding against ad blockers or unhandled errors
 * - Cloud data persistence via y8Sdk.saveData / y8Sdk.loadData with localStorage fallback
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  RewardResult,
} from '../types';
import { loadExternalScript } from '../scriptLoader';

export interface Y8AdapterOptions {
  gameId?: string;
  appId?: string;
}

export class Y8Adapter implements IPlatformAdapter {
  readonly providerName = 'Y8';
  private hooks!: GameSystemHooks;
  private gameId: string;
  private appId: string;
  private sdk: any = null;
  private isReady = false;

  constructor(options: Y8AdapterOptions = {}) {
    this.gameId =
      options.gameId ||
      (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_Y8_GAME_ID as string) : '') ||
      '290159';
    this.appId =
      options.appId ||
      (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_Y8_APP_ID as string) : '') ||
      '6ae32a67ba1f868b83779a1f';
  }

  async init(hooks: GameSystemHooks): Promise<void> {
    this.hooks = hooks;

    if (typeof window === 'undefined') {
      return;
    }

    // Check if SDK instance is already available
    if (window.y8Sdk && typeof window.y8Sdk.showAd === 'function') {
      this.sdk = window.y8Sdk;
      this.isReady = true;
      console.info('[Y8Adapter] Y8 SDK already initialized on window.');
      return;
    }

    // If y8 is already loaded, get sdk instance
    if (window.y8 && typeof window.y8.sdk === 'function') {
      this.initializeSdkInstance(window.y8.sdk());
      return;
    }

    // Prepare ready listener before loading script
    const readyPromise = new Promise<void>((resolve) => {
      const onReady = () => {
        window.removeEventListener('y8sdk.ready', onReady);
        if (window.y8 && typeof window.y8.sdk === 'function') {
          this.initializeSdkInstance(window.y8.sdk());
        }
        resolve();
      };

      window.addEventListener('y8sdk.ready', onReady, { once: true });

      // Safety fallback timeout in case the event doesn't fire
      setTimeout(() => {
        if (!this.isReady) {
          if (window.y8 && typeof window.y8.sdk === 'function') {
            this.initializeSdkInstance(window.y8.sdk());
          }
          resolve();
        }
      }, 5000);
    });

    try {
      await loadExternalScript('https://cdn.y8.com/minimal-sdk/2-0/y8.min.js', {
        id: 'y8-minimal-sdk',
        async: true,
      });

      if (window.y8 && typeof window.y8.emitReadyEvent === 'function') {
        window.y8.emitReadyEvent();
      }

      await readyPromise;
    } catch (e) {
      console.warn('[Y8Adapter] Failed to load Y8 SDK script:', e);
    }
  }

  private initializeSdkInstance(sdkInstance: any): void {
    if (!sdkInstance) return;
    this.sdk = sdkInstance;
    window.y8Sdk = sdkInstance;

    const appConfig = {
      appId: this.appId,
      autoLogin: true,
    };

    const adConfig = {
      gameId: this.gameId,
      preloadAdBreaks: 'on',
      sound: 'on',
      onReady: () => {
        console.info('[Y8Adapter] Ads system ready');
      },
    };

    try {
      if (typeof this.sdk.init === 'function') {
        this.sdk.init(appConfig, adConfig);
      }
      if (typeof this.sdk.onAuth === 'function') {
        this.sdk.onAuth((user: any, error: any) => {
          if (error) {
            console.warn('[Y8Adapter] Auth notice:', error);
          } else if (user) {
            console.info('[Y8Adapter] User authenticated:', user);
          }
        });
      }
      this.isReady = true;
      console.info(`[Y8Adapter] Initialized with Game ID: ${this.gameId}, App ID: ${this.appId}`);
    } catch (err) {
      console.warn('[Y8Adapter] Error during SDK init call:', err);
    }
  }

  isFeatureSupported(feature: PlatformFeature): boolean {
    switch (feature) {
      case PlatformFeature.REWARDED_ADS:
      case PlatformFeature.INTERSTITIAL_ADS:
      case PlatformFeature.CLOUD_SAVE:
      case PlatformFeature.GAMEPLAY_TELEMETRY:
      case PlatformFeature.LEADERBOARDS:
        return true;
      default:
        return false;
    }
  }

  gameReady(): void {
    console.debug('[Y8Adapter] Game ready');
  }

  gameplayStart(): void {
    console.debug('[Y8Adapter] Gameplay started');
  }

  gameplayStop(): void {
    console.debug('[Y8Adapter] Gameplay stopped');
  }

  async showRewardedAd(rewardId = 'reward-ad'): Promise<RewardResult> {
    if (!this.sdk || typeof this.sdk.showAd !== 'function') {
      console.warn('[Y8Adapter] SDK not ready or showAd not available. Granting fallback reward.');
      return { rewarded: true, rewardId };
    }

    return new Promise<RewardResult>((resolve) => {
      let settled = false;
      let rewardEarned = false;

      const finish = (rewarded: boolean, err?: string) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        this.hooks.onUnmuteAudio();
        this.hooks.onResumeGame();
        resolve({ rewarded, rewardId, error: err });
      };

      const timeout = setTimeout(() => {
        console.warn('[Y8Adapter] Rewarded ad timed out, safely restoring game state.');
        finish(false, 'TIMEOUT');
      }, 15000);

      this.hooks.onPauseGame();
      this.hooks.onMuteAudio();

      this.sdk
        .showAd({
          type: 'reward',
          name: rewardId,
          beforeAd: () => {
            this.hooks.onPauseGame();
            this.hooks.onMuteAudio();
          },
          beforeReward: (showAdFn: () => void) => {
            if (typeof showAdFn === 'function') {
              showAdFn();
            }
          },
          adViewed: () => {
            console.info('[Y8Adapter] Rewarded ad completed, reward granted.');
            rewardEarned = true;
          },
          adDismissed: () => {
            console.info('[Y8Adapter] Rewarded ad dismissed before completion.');
          },
          adBreakDone: (info: any) => {
            console.debug('[Y8Adapter] Ad break finished:', info);
            finish(rewardEarned);
          },
        })
        .catch((e: any) => {
          console.warn('[Y8Adapter] showAd reward caught error:', e);
          finish(false, String(e));
        });
    });
  }

  async showInterstitialAd(placement = 'interstitial'): Promise<boolean> {
    if (!this.sdk || typeof this.sdk.showAd !== 'function') {
      console.warn('[Y8Adapter] SDK not ready for interstitial, skipping.');
      return false;
    }

    return new Promise<boolean>((resolve) => {
      let settled = false;

      const finish = (success: boolean) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        this.hooks.onUnmuteAudio();
        this.hooks.onResumeGame();
        resolve(success);
      };

      const timeout = setTimeout(() => {
        console.warn('[Y8Adapter] Interstitial ad timed out, restoring game.');
        finish(false);
      }, 12000);

      this.hooks.onPauseGame();
      this.hooks.onMuteAudio();

      const adType = placement === 'pause' ? 'pause' : 'next';

      this.sdk
        .showAd({
          type: adType,
          name: placement,
          beforeAd: () => {
            this.hooks.onPauseGame();
            this.hooks.onMuteAudio();
          },
          afterAd: () => {
            this.hooks.onUnmuteAudio();
            this.hooks.onResumeGame();
          },
          adBreakDone: (info: any) => {
            console.debug('[Y8Adapter] Interstitial ad break done:', info);
            finish(true);
          },
        })
        .catch((e: any) => {
          console.warn('[Y8Adapter] Interstitial ad error:', e);
          finish(false);
        });
    });
  }

  async saveData(key: string, data: string): Promise<boolean> {
    try {
      if (this.sdk && typeof this.sdk.saveData === 'function') {
        await this.sdk.saveData({ key, value: data, retries: true });
        return true;
      }
    } catch (e) {
      console.warn('[Y8Adapter] Cloud save error, falling back to localStorage:', e);
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, data);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async loadData(key: string): Promise<string | null> {
    try {
      if (this.sdk && typeof this.sdk.loadData === 'function') {
        const val = await this.sdk.loadData({ key });
        if (val !== undefined && val !== null) {
          return val;
        }
      }
    } catch (e) {
      console.warn('[Y8Adapter] Cloud load error, checking localStorage fallback:', e);
    }

    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  }
}
