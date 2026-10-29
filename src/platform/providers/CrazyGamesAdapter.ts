/**
 * CrazyGames SDK v3 Adapter
 * Implements CrazyGames SDK v3 environment detection, cloud data storage,
 * gameplay telemetry, and rewarded / midgame ad callbacks.
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  RewardResult,
} from '../types';
import { loadExternalScript } from '../scriptLoader';

export class CrazyGamesAdapter implements IPlatformAdapter {
  readonly providerName = 'CrazyGames';
  private hooks!: GameSystemHooks;
  private isSupportedEnv = false;

  async init(hooks: GameSystemHooks): Promise<void> {
    this.hooks = hooks;

    await loadExternalScript('https://sdk.crazygames.com/crazygames-sdk-v3.js', {
      id: 'crazygames-sdk-v3-script',
    });

    const cg = (typeof window !== 'undefined' ? window.CrazyGames?.SDK : null);
    if (!cg) {
      console.warn('[CrazyGamesAdapter] CrazyGames.SDK not found on window');
      return;
    }

    try {
      await cg.init();
      const env = (cg as any).environment ?? (typeof cg.getEnvironment === 'function' ? await cg.getEnvironment() : 'crazygames');
      this.isSupportedEnv = env === 'crazygames' || env === 'local';
      console.info(`[CrazyGamesAdapter] Initialized in environment: ${env}`);

      if (this.isSupportedEnv && cg.game?.loadingStart) {
        cg.game.loadingStart();
      }
    } catch (e) {
      console.warn('[CrazyGamesAdapter] Init error:', e);
      this.isSupportedEnv = false;
    }
  }

  isFeatureSupported(feature: PlatformFeature): boolean {
    if (!this.isSupportedEnv) return false;
    switch (feature) {
      case PlatformFeature.REWARDED_ADS:
      case PlatformFeature.INTERSTITIAL_ADS:
      case PlatformFeature.CLOUD_SAVE:
      case PlatformFeature.GAMEPLAY_TELEMETRY:
        return true;
      default:
        return false;
    }
  }

  gameReady(): void {
    if (this.isSupportedEnv && window.CrazyGames?.SDK?.game?.loadingStop) {
      window.CrazyGames.SDK.game.loadingStop();
    }
  }

  gameplayStart(): void {
    if (this.isSupportedEnv && window.CrazyGames?.SDK?.game?.gameplayStart) {
      window.CrazyGames.SDK.game.gameplayStart();
    }
  }

  gameplayStop(): void {
    if (this.isSupportedEnv && window.CrazyGames?.SDK?.game?.gameplayStop) {
      window.CrazyGames.SDK.game.gameplayStop();
    }
  }

  happytime(): void {
    if (this.isSupportedEnv && window.CrazyGames?.SDK?.game?.happytime) {
      window.CrazyGames.SDK.game.happytime();
    }
  }

  async showRewardedAd(rewardId = 'default'): Promise<RewardResult> {
    if (!this.isFeatureSupported(PlatformFeature.REWARDED_ADS) || !window.CrazyGames?.SDK?.ad?.requestAd) {
      return { rewarded: false, rewardId, error: 'CrazyGames environment disabled or ad unsupported' };
    }

    return new Promise((resolve) => {
      let settled = false;
      window.CrazyGames!.SDK.ad.requestAd('rewarded', {
        adStarted: () => {
          this.hooks.onPauseGame();
          this.hooks.onMuteAudio();
        },
        adFinished: () => {
          if (settled) return;
          settled = true;
          this.hooks.onUnmuteAudio();
          this.hooks.onResumeGame();
          resolve({ rewarded: true, rewardId });
        },
        adError: (error: any) => {
          if (settled) return;
          settled = true;
          this.hooks.onUnmuteAudio();
          this.hooks.onResumeGame();
          resolve({ rewarded: false, rewardId, error: typeof error === 'string' ? error : JSON.stringify(error) });
        },
      });
    });
  }

  async showInterstitialAd(placement?: string): Promise<boolean> {
    if (!this.isFeatureSupported(PlatformFeature.INTERSTITIAL_ADS) || !window.CrazyGames?.SDK?.ad?.requestAd) {
      return false;
    }

    return new Promise((resolve) => {
      let settled = false;
      window.CrazyGames!.SDK.ad.requestAd('midgame', {
        adStarted: () => {
          this.hooks.onPauseGame();
          this.hooks.onMuteAudio();
        },
        adFinished: () => {
          if (settled) return;
          settled = true;
          this.hooks.onUnmuteAudio();
          this.hooks.onResumeGame();
          resolve(true);
        },
        adError: () => {
          if (settled) return;
          settled = true;
          this.hooks.onUnmuteAudio();
          this.hooks.onResumeGame();
          resolve(false);
        },
      });
    });
  }

  async saveData(key: string, data: string): Promise<boolean> {
    if (!this.isSupportedEnv || !window.CrazyGames?.SDK?.data?.setItem) {
      try {
        localStorage.setItem(key, data);
        return true;
      } catch {
        return false;
      }
    }
    try {
      window.CrazyGames.SDK.data.setItem(key, data);
      return true;
    } catch {
      return false;
    }
  }

  async loadData(key: string): Promise<string | null> {
    if (!this.isSupportedEnv || !window.CrazyGames?.SDK?.data?.getItem) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return window.CrazyGames.SDK.data.getItem(key);
    } catch {
      return null;
    }
  }
}
