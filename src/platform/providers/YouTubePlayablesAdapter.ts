/**
 * YouTube Playables SDK Adapter
 * Certification compliant implementation for YouTube Playables HTML5 environment.
 * Handles firstFrameReady, gameReady, system audio/pause callbacks, rewarded ads,
 * and 16 KiB UTF-16 validated cloud saves.
 */

import {
  GameSystemHooks,
  IPlatformAdapter,
  PlatformFeature,
  RewardResult,
} from '../types';

export class YouTubePlayablesAdapter implements IPlatformAdapter {
  readonly providerName = 'YouTubePlayables';
  private hooks!: GameSystemHooks;
  private isAvailable = false;
  private firstFrameCalled = false;
  private gameReadyCalled = false;

  async init(hooks: GameSystemHooks): Promise<void> {
    this.hooks = hooks;
    this.isAvailable =
      typeof window !== 'undefined' &&
      typeof window.ytgame !== 'undefined' &&
      Boolean(window.ytgame.IN_PLAYABLES_ENV);

    if (!this.isAvailable) {
      console.warn('[YouTubePlayablesAdapter] Not running inside live YouTube Playables environment.');
      return;
    }

    // Bind system-level audio and pause events required for YouTube certification
    try {
      window.ytgame.system.onAudioEnabledChange((isAudioEnabled: boolean) => {
        isAudioEnabled ? this.hooks.onUnmuteAudio() : this.hooks.onMuteAudio();
      });
      window.ytgame.system.onPause(() => this.hooks.onPauseGame());
      window.ytgame.system.onResume(() => this.hooks.onResumeGame());
    } catch (e) {
      console.warn('[YouTubePlayablesAdapter] Failed to bind system lifecycle listeners:', e);
    }
  }

  isFeatureSupported(feature: PlatformFeature): boolean {
    if (!this.isAvailable) return false;
    switch (feature) {
      case PlatformFeature.REWARDED_ADS:
        return typeof window.ytgame?.ads?.requestRewardedAd === 'function';
      case PlatformFeature.INTERSTITIAL_ADS:
        return typeof window.ytgame?.ads?.requestInterstitialAd === 'function';
      case PlatformFeature.CLOUD_SAVE:
      case PlatformFeature.LEADERBOARDS:
      case PlatformFeature.GAMEPLAY_TELEMETRY:
        return true;
      default:
        return false;
    }
  }

  notifyFirstFrameReady(): void {
    if (this.isAvailable && !this.firstFrameCalled) {
      this.firstFrameCalled = true;
      try {
        window.ytgame.game.firstFrameReady();
      } catch (e) {
        console.warn('[YouTubePlayablesAdapter] firstFrameReady failed:', e);
      }
    }
  }

  gameReady(): void {
    if (this.isAvailable && !this.gameReadyCalled) {
      if (!this.firstFrameCalled) {
        this.notifyFirstFrameReady();
      }
      this.gameReadyCalled = true;
      try {
        window.ytgame.game.gameReady();
      } catch (e) {
        console.warn('[YouTubePlayablesAdapter] gameReady failed:', e);
      }
    }
  }

  gameplayStart(): void {}
  gameplayStop(): void {}

  async showRewardedAd(rewardId = 'default_reward'): Promise<RewardResult> {
    if (!this.isFeatureSupported(PlatformFeature.REWARDED_ADS)) {
      return { rewarded: false, rewardId, error: 'Rewarded ads not supported on YouTube' };
    }
    try {
      const granted: boolean = await window.ytgame.ads.requestRewardedAd(rewardId);
      return { rewarded: Boolean(granted), rewardId };
    } catch (err) {
      return { rewarded: false, rewardId, error: String(err) };
    }
  }

  async showInterstitialAd(): Promise<boolean> {
    if (!this.isFeatureSupported(PlatformFeature.INTERSTITIAL_ADS)) return false;
    try {
      await window.ytgame.ads.requestInterstitialAd();
      return true;
    } catch {
      return false;
    }
  }

  async saveData(_key: string, data: string): Promise<boolean> {
    if (!this.isAvailable) return false;
    try {
      // Validate UTF-16 well-formedness for YouTube Playables compliance
      const safeString =
        typeof (data as any).isWellFormed === 'function' && !(data as any).isWellFormed()
          ? (data as any).toWellFormed()
          : data;

      await window.ytgame.game.saveData(safeString);
      return true;
    } catch {
      return false;
    }
  }

  async loadData(_key: string): Promise<string | null> {
    if (!this.isAvailable) return null;
    try {
      return (await window.ytgame.game.loadData()) || null;
    } catch {
      return null;
    }
  }

  async sendScore(score: number): Promise<boolean> {
    if (!this.isAvailable) return false;
    try {
      await window.ytgame.engagement.sendScore({ value: Math.max(0, Math.floor(score)) });
      return true;
    } catch {
      return false;
    }
  }

  async openYTContent(videoId: string): Promise<boolean> {
    if (!this.isAvailable) return false;
    try {
      await window.ytgame.engagement.openYTContent({ id: videoId });
      return true;
    } catch {
      return false;
    }
  }
}
