/**
 * GameDistribution SDK Adapter
 * Certification & integration according to official GameDistribution HTML5 SDK specification:
 * https://developer.gamedistribution.com/html5-sdk
 * https://github.com/GameDistribution/GD-HTML5
 *
 * Implements:
 * - window.GD_OPTIONS with gameId and onEvent (SDK_GAME_PAUSE, SDK_GAME_START, SDK_REWARDED_WATCH_COMPLETE)
 * - gdsdk.showAd() for interstitial ads
 * - gdsdk.showAd(gdsdk.AdType.Rewarded || 'rewarded') for rewarded video ads
 * - gdsdk.preloadAd('rewarded') for ad caching
 * - Full audio mute / game pause handling during ad playback
 * - Full audio unmute / game resume handling after ad completion
 * - Timeout fallback guards to prevent game freezing if ads are blocked or delayed
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  RewardResult,
} from '../types';
import { loadExternalScript } from '../scriptLoader';

export interface GameDistributionOptions {
  gameId?: string;
}

export class GameDistributionAdapter implements IPlatformAdapter {
  readonly providerName = 'GameDistribution';
  private hooks!: GameSystemHooks;
  private isReady = false;
  private pendingRewardedResolver: ((result: RewardResult) => void) | null = null;
  private pendingInterstitialResolver: ((completed: boolean) => void) | null = null;
  private rewardedGranted = false;
  private gameId = '';
  private adTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: GameDistributionOptions = {}) {
    this.gameId = options.gameId ?? '';
  }

  async init(hooks: GameSystemHooks): Promise<void> {
    this.hooks = hooks;

    const gameId =
      this.gameId ||
      (typeof window !== 'undefined' && window.GD_OPTIONS?.gameId ? window.GD_OPTIONS.gameId : '') ||
      (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GAMEDISTRIBUTION_GAME_ID as string) : '') ||
      '';

    if (typeof window !== 'undefined') {
      window.__gdPause = () => this.handleGlobalSdkEvent('SDK_GAME_PAUSE');
      window.__gdResume = () => this.handleGlobalSdkEvent('SDK_GAME_START');
      window.__gdRewardedComplete = () => this.handleGlobalSdkEvent('SDK_REWARDED_WATCH_COMPLETE');

      const existingOptions = window.GD_OPTIONS || ({} as any);
      window.GD_OPTIONS = {
        ...existingOptions,
        gameId: gameId || existingOptions.gameId || '',
        onEvent: (event: { name: string; [key: string]: any }) => {
          this.handleGlobalSdkEvent(event.name);
        },
      };

      // Flush any pre-buffered events
      const earlyEvents: string[] = (window as any).__gdEventQueue || [];
      (window as any).__gdEventQueue = [];
      for (const ev of earlyEvents) {
        this.handleGlobalSdkEvent(ev);
      }
    }

    const currentSdk = typeof window !== 'undefined' ? window.gdsdk : null;
    if (currentSdk && typeof currentSdk.showAd === 'function') {
      this.isReady = true;
      console.info('[GameDistributionAdapter] GameDistribution SDK already available on window.');
    } else {
      if (
        typeof document !== 'undefined' &&
        !document.getElementById('gamedistribution-jssdk')
      ) {
        try {
          await loadExternalScript('https://html5.api.gamedistribution.com/main.min.js', {
            id: 'gamedistribution-jssdk',
          });
          this.isReady = true;
          console.info('[GameDistributionAdapter] GameDistribution SDK script loaded successfully.');
        } catch (e) {
          console.warn('[GameDistributionAdapter] Failed to load GameDistribution SDK script:', e);
        }
      }
    }
  }

  private handleGlobalSdkEvent(eventName: string): void {
    console.debug(`[GameDistributionAdapter] SDK Event received: ${eventName}`);

    switch (eventName) {
      case 'SDK_GAME_PAUSE':
        this.hooks.onMuteAudio();
        this.hooks.onPauseGame();
        break;

      case 'SDK_GAME_START':
        this.hooks.onUnmuteAudio();
        this.hooks.onResumeGame();
        this.finishPendingAds();
        break;

      case 'SDK_REWARDED_WATCH_COMPLETE':
        this.rewardedGranted = true;
        break;

      case 'SDK_GDPR_TRACKING':
      case 'SDK_GDPR_TARGETING':
        break;

      default:
        break;
    }
  }

  private finishPendingAds(): void {
    if (this.adTimeoutTimer) {
      clearTimeout(this.adTimeoutTimer);
      this.adTimeoutTimer = null;
    }

    if (this.pendingRewardedResolver) {
      const resolver = this.pendingRewardedResolver;
      const wasRewarded = this.rewardedGranted;
      this.pendingRewardedResolver = null;
      this.rewardedGranted = false;
      resolver({ rewarded: wasRewarded });
    }

    if (this.pendingInterstitialResolver) {
      const resolver = this.pendingInterstitialResolver;
      this.pendingInterstitialResolver = null;
      resolver(true);
    }
  }

  isFeatureSupported(feature: PlatformFeature): boolean {
    switch (feature) {
      case PlatformFeature.REWARDED_ADS:
      case PlatformFeature.INTERSTITIAL_ADS:
      case PlatformFeature.GAMEPLAY_TELEMETRY:
        return true;
      default:
        return false;
    }
  }

  gameReady(): void {
    if (typeof window !== 'undefined' && window.gdsdk?.preloadAd) {
      try {
        window.gdsdk.preloadAd('rewarded').catch(() => {});
      } catch {
        // Safe preload catch
      }
    }
  }

  gameplayStart(): void {
    // GD handles tracking automatically through SDK
  }

  gameplayStop(): void {
    // GD handles tracking automatically through SDK
  }

  async showInterstitialAd(): Promise<boolean> {
    if (this.pendingInterstitialResolver || this.pendingRewardedResolver) {
      console.warn('[GameDistributionAdapter] Ad already in progress, skipping interstitial');
      return false;
    }

    const gdsdk = typeof window !== 'undefined' ? window.gdsdk : null;
    if (!gdsdk || typeof gdsdk.showAd !== 'function') {
      console.warn('[GameDistributionAdapter] gdsdk not available on window, skipping interstitial');
      return false;
    }

    return new Promise<boolean>((resolve) => {
      this.pendingInterstitialResolver = resolve;

      this.adTimeoutTimer = setTimeout(() => {
        console.warn('[GameDistributionAdapter] Interstitial ad timeout reached (15s fallback)');
        this.finishPendingAds();
      }, 15000);

      this.hooks.onMuteAudio();
      this.hooks.onPauseGame();

      try {
        gdsdk.showAd()
          .then(() => {
            // Wait for SDK_GAME_START event; if not fired, finish gracefully
            setTimeout(() => {
              if (this.pendingInterstitialResolver) {
                this.finishPendingAds();
              }
            }, 500);
          })
          .catch((err) => {
            console.warn('[GameDistributionAdapter] gdsdk.showAd error:', err);
            this.finishPendingAds();
          });
      } catch (err) {
        console.warn('[GameDistributionAdapter] gdsdk.showAd threw exception:', err);
        this.finishPendingAds();
      }
    });
  }

  async showRewardedAd(rewardId = 'default'): Promise<RewardResult> {
    if (this.pendingInterstitialResolver || this.pendingRewardedResolver) {
      console.warn('[GameDistributionAdapter] Ad already in progress, skipping rewarded ad');
      return { rewarded: false, rewardId, error: 'Ad already in progress' };
    }

    const gdsdk = typeof window !== 'undefined' ? window.gdsdk : null;
    if (!gdsdk || typeof gdsdk.showAd !== 'function') {
      console.warn('[GameDistributionAdapter] gdsdk not available, falling back without reward');
      return { rewarded: false, rewardId, error: 'gdsdk not available' };
    }

    this.rewardedGranted = false;

    return new Promise<RewardResult>((resolve) => {
      this.pendingRewardedResolver = (result) => {
        resolve({ ...result, rewardId });
      };

      this.adTimeoutTimer = setTimeout(() => {
        console.warn('[GameDistributionAdapter] Rewarded ad timeout reached (25s fallback)');
        this.finishPendingAds();
      }, 25000);

      this.hooks.onMuteAudio();
      this.hooks.onPauseGame();

      try {
        const adType = gdsdk.AdType?.Rewarded || 'rewarded';
        gdsdk.showAd(adType)
          .then(() => {
            setTimeout(() => {
              if (this.pendingRewardedResolver) {
                this.finishPendingAds();
              }
            }, 600);
          })
          .catch((err) => {
            console.warn('[GameDistributionAdapter] gdsdk.showAd(rewarded) error:', err);
            this.finishPendingAds();
          });
      } catch (err) {
        console.warn('[GameDistributionAdapter] gdsdk.showAd(rewarded) threw exception:', err);
        this.finishPendingAds();
      }
    });
  }

  async saveData(key: string, data: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async loadData(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  }
}
