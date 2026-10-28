/**
 * Poki SDK Adapter
 * Implements Poki SDK with gameLoadingFinished, gameplayStart, gameplayStop,
 * and rewarded/commercial breaks.
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  RewardResult,
} from '../types';
import { loadExternalScript } from '../scriptLoader';

export class PokiAdapter implements IPlatformAdapter {
  readonly providerName = 'Poki';
  private hooks!: GameSystemHooks;
  private isInitialized = false;

  async init(hooks: GameSystemHooks): Promise<void> {
    this.hooks = hooks;

    // Load Poki SDK script dynamically
    await loadExternalScript('https://game-cdn.poki.com/scripts/v2/poki-sdk.js', {
      id: 'poki-sdk-script',
    });

    if (typeof window === 'undefined' || typeof window.PokiSDK === 'undefined') {
      console.warn('[PokiAdapter] PokiSDK not found on window');
      return;
    }

    try {
      await window.PokiSDK.init();
      this.isInitialized = true;
      console.info('[PokiAdapter] Poki SDK initialized.');
    } catch {
      // Poki resolves/rejects when AdBlock is active; game must still run
      this.isInitialized = true;
      console.warn('[PokiAdapter] Poki SDK init completed with adblock/error flag');
    }
  }

  isFeatureSupported(feature: PlatformFeature): boolean {
    if (!this.isInitialized) return false;
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
    if (this.isInitialized && window.PokiSDK?.gameLoadingFinished) {
      window.PokiSDK.gameLoadingFinished();
    }
  }

  gameplayStart(): void {
    if (this.isInitialized && window.PokiSDK?.gameplayStart) {
      window.PokiSDK.gameplayStart();
    }
  }

  gameplayStop(): void {
    if (this.isInitialized && window.PokiSDK?.gameplayStop) {
      window.PokiSDK.gameplayStop();
    }
  }

  async showRewardedAd(rewardId = 'default'): Promise<RewardResult> {
    if (!this.isFeatureSupported(PlatformFeature.REWARDED_ADS) || !window.PokiSDK?.rewardedBreak) {
      return { rewarded: false, rewardId, error: 'Poki SDK not initialized' };
    }
    try {
      const success: boolean = await window.PokiSDK.rewardedBreak(() => {
        this.hooks.onPauseGame();
        this.hooks.onMuteAudio();
      });
      this.hooks.onUnmuteAudio();
      this.hooks.onResumeGame();
      return { rewarded: Boolean(success), rewardId };
    } catch (e) {
      this.hooks.onUnmuteAudio();
      this.hooks.onResumeGame();
      return { rewarded: false, rewardId, error: String(e) };
    }
  }

  async showInterstitialAd(): Promise<boolean> {
    if (!this.isFeatureSupported(PlatformFeature.INTERSTITIAL_ADS) || !window.PokiSDK?.commercialBreak) {
      return false;
    }
    try {
      await window.PokiSDK.commercialBreak(() => {
        this.hooks.onPauseGame();
        this.hooks.onMuteAudio();
      });
      this.hooks.onUnmuteAudio();
      this.hooks.onResumeGame();
      return true;
    } catch {
      this.hooks.onUnmuteAudio();
      this.hooks.onResumeGame();
      return false;
    }
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
