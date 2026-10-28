/**
 * Google H5 Games Ads Adapter (Ad Placement API)
 * Implements Google H5 Games Ads with inverted control flow:
 * adBreak({ type: 'reward', beforeReward(showAdFn), adViewed, adDismissed, adBreakDone })
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  RewardResult,
} from '../types';
import { loadExternalScript } from '../scriptLoader';

export interface GoogleH5AdsOptions {
  clientId?: string;
  channelId?: string;
  frequencyHint?: string;
}

export class GoogleH5AdsAdapter implements IPlatformAdapter {
  readonly providerName = 'GoogleH5Ads';
  private hooks!: GameSystemHooks;
  private isReady = false;

  constructor(private readonly options: GoogleH5AdsOptions = {}) {}

  async init(hooks: GameSystemHooks): Promise<void> {
    this.hooks = hooks;

    const clientId =
      this.options.clientId ||
      (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_H5_CLIENT_ID : '');

    if (!clientId || clientId === 'ca-pub-0000000000000000') {
      console.warn('[GoogleH5AdsAdapter] Missing or placeholder VITE_GOOGLE_H5_CLIENT_ID');
      return;
    }

    // Load Google H5 Ads SDK script
    const scriptUrl = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    const attributes: Record<string, string> = {
      'crossorigin': 'anonymous',
    };
    if (this.options.channelId) {
      attributes['data-ad-channel'] = this.options.channelId;
    }
    if (this.options.frequencyHint) {
      attributes['data-ad-frequency-hint'] = this.options.frequencyHint;
    }

    await loadExternalScript(scriptUrl, {
      id: 'google-ads-h5-sdk',
      attributes,
    });

    if (typeof window === 'undefined' || typeof window.adConfig !== 'function' || typeof window.adBreak !== 'function') {
      console.warn('[GoogleH5AdsAdapter] window.adConfig or window.adBreak not available');
      return;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[GoogleH5AdsAdapter] Timed out waiting for adConfig onReady');
        resolve();
      }, 3000);

      window.adConfig!({
        preloadAdBreaks: 'on',
        sound: 'on',
        onReady: () => {
          this.isReady = true;
          clearTimeout(timeout);
          console.info('[GoogleH5AdsAdapter] Google H5 Ads initialized and ready.');
          resolve();
        },
      });
    });
  }

  isFeatureSupported(feature: PlatformFeature): boolean {
    switch (feature) {
      case PlatformFeature.REWARDED_ADS:
      case PlatformFeature.INTERSTITIAL_ADS:
        return this.isReady && typeof window !== 'undefined' && typeof window.adBreak === 'function';
      default:
        return false;
    }
  }

  gameReady(): void {}
  gameplayStart(): void {}
  gameplayStop(): void {}

  async showRewardedAd(rewardId = 'reward_prompt'): Promise<RewardResult> {
    if (!this.isFeatureSupported(PlatformFeature.REWARDED_ADS)) {
      return { rewarded: false, rewardId, error: 'Google H5 Ads not ready' };
    }

    return new Promise((resolve) => {
      let isRewarded = false;

      window.adBreak!({
        type: 'reward',
        name: rewardId,
        beforeReward: (showAdFn: () => void) => {
          // Immediately trigger the ad once the user clicks your in-game reward button
          showAdFn();
        },
        beforeAd: () => {
          this.hooks.onPauseGame();
          this.hooks.onMuteAudio();
        },
        adViewed: () => {
          isRewarded = true;
        },
        adDismissed: () => {
          isRewarded = false;
        },
        afterAd: () => {
          this.hooks.onUnmuteAudio();
          this.hooks.onResumeGame();
        },
        adBreakDone: (placementInfo: { breakStatus: string }) => {
          resolve({
            rewarded: isRewarded,
            rewardId,
            error: isRewarded ? undefined : `Break status: ${placementInfo?.breakStatus ?? 'unknown'}`,
          });
        },
      });
    });
  }

  async showInterstitialAd(placement = 'next'): Promise<boolean> {
    if (!this.isFeatureSupported(PlatformFeature.INTERSTITIAL_ADS)) return false;

    return new Promise((resolve) => {
      window.adBreak!({
        type: 'next',
        name: placement,
        beforeAd: () => {
          this.hooks.onPauseGame();
          this.hooks.onMuteAudio();
        },
        afterAd: () => {
          this.hooks.onUnmuteAudio();
          this.hooks.onResumeGame();
        },
        adBreakDone: (info: { breakStatus: string }) => {
          resolve(info?.breakStatus === 'viewed');
        },
      });
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
