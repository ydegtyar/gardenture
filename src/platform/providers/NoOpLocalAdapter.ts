/**
 * NoOp / Local / Itch.io Platform Adapter
 * For environments where ad networks are disabled or not supported.
 * All feature checks return false to cleanly hide ad buttons in UI.
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  RewardResult,
} from '../types';

export class NoOpLocalAdapter implements IPlatformAdapter {
  readonly providerName = 'LocalOrItchIo';

  async init(_hooks: GameSystemHooks): Promise<void> {
    console.info('[NoOpLocalAdapter] Initialized Local/Itch.io provider (ads disabled)');
  }

  isFeatureSupported(_feature: PlatformFeature): boolean {
    return false; // Cleanly hides ad watch buttons in UI
  }

  gameReady(): void {}
  gameplayStart(): void {}
  gameplayStop(): void {}

  async showRewardedAd(rewardId?: string): Promise<RewardResult> {
    return {
      rewarded: false,
      rewardId,
      error: 'Ads disabled in this environment',
    };
  }

  async showInterstitialAd(): Promise<boolean> {
    return false;
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
