/**
 * Concrete Platform Adapters: YouTubePlayablesAdapter, WebPlatformAdapter & MockPlatformAdapter
 * Layer 5 (platform): Implements YouTube Playables SDK Integration Specification Section 11.
 */

import type {
  PlatformFacade,
  RewardAdPlacementId,
  YtGameSdk,
} from './ports/PlatformFacade';

const LOCAL_STORAGE_KEY = 'swipe_roguelite_save_v1';

function readLocalBackup(): string {
  try {
    return window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeLocalBackup(serialized: string): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage quota or sandboxed restrictions
  }
}

export class YouTubePlatformAdapter implements PlatformFacade {
  public readonly isPlayablesEnv = true;
  public readonly sdkVersion: string;

  private pauseUnsub: (() => void) | null = null;
  private resumeUnsub: (() => void) | null = null;
  private audioUnsub: (() => void) | null = null;
  private firstFrameSignaled = false;
  private gameReadySignaled = false;
  private errorCount = 0;
  private warningCount = 0;

  constructor(private readonly sdk: YtGameSdk) {
    this.sdkVersion = sdk.SDK_VERSION || '1.0.0';
    window.addEventListener('error', () => this.health.logError());
    window.addEventListener('unhandledrejection', () => this.health.logError());
  }

  public readonly lifecycle = {
    notifyFirstFrameReady: (): void => {
      if (this.firstFrameSignaled) return;
      this.firstFrameSignaled = true;
      this.sdk.game.firstFrameReady();
    },
    notifyGameReady: (): void => {
      if (!this.firstFrameSignaled) {
        this.sdk.game.firstFrameReady();
        this.firstFrameSignaled = true;
      }
      if (this.gameReadySignaled) return;
      this.gameReadySignaled = true;
      this.sdk.game.gameReady();
    },
    registerHandlers: (handlers: { onPause: () => void; onResume: () => void }): void => {
      this.pauseUnsub?.();
      this.resumeUnsub?.();
      this.pauseUnsub = this.sdk.system.onPause(handlers.onPause);
      this.resumeUnsub = this.sdk.system.onResume(handlers.onResume);
    },
  };

  public readonly audio = {
    isAudioEnabled: (): boolean => {
      try {
        return this.sdk.system.isAudioEnabled();
      } catch {
        return true;
      }
    },
    onMuteChange: (cb: (enabled: boolean) => void): void => {
      this.audioUnsub?.();
      this.audioUnsub = this.sdk.system.onAudioEnabledChange(cb);
    },
  };

  public readonly storage = {
    loadRaw: async (): Promise<string> => {
      try {
        const cloud = await this.sdk.game.loadData();
        if (cloud && cloud.length > 2) return cloud;
      } catch {
        this.health.logWarning();
      }
      return readLocalBackup();
    },
    saveRaw: async (serialized: string): Promise<boolean> => {
      if (serialized.length > 16_384) {
        this.health.logWarning();
      }
      writeLocalBackup(serialized);
      try {
        await this.sdk.game.saveData(serialized);
        return true;
      } catch {
        this.health.logError();
        return false;
      }
    },
  };

  public readonly ads = {
    requestRewardedAd: async (rewardId: RewardAdPlacementId): Promise<boolean> => {
      try {
        const earned = await this.sdk.ads.requestRewardedAd(rewardId);
        return Boolean(earned);
      } catch {
        return false;
      }
    },
    requestInterstitialAd: async (): Promise<void> => {
      try {
        await this.sdk.ads.requestInterstitialAd();
      } catch {
        // Interstitial skipped or unavailable
      }
    },
  };

  public readonly engagement = {
    sendScore: async (scoreValue: number): Promise<boolean> => {
      const cleanScore = Math.max(0, Math.floor(scoreValue));
      try {
        await this.sdk.engagement.sendScore({ value: cleanScore });
        return true;
      } catch {
        this.health.logWarning();
        return false;
      }
    },
    openYTContent: async (videoId: string): Promise<boolean> => {
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return false;
      try {
        await this.sdk.engagement.openYTContent({ id: videoId });
        return true;
      } catch {
        return false;
      }
    },
  };

  public readonly i18n = {
    getLanguage: async (): Promise<string> => {
      try {
        return (await this.sdk.system.getLanguage()) || 'en';
      } catch {
        return 'en';
      }
    },
  };

  public readonly health = {
    logError: (): void => {
      if (this.errorCount >= 10) return;
      this.errorCount++;
      try {
        this.sdk.health.logError();
      } catch {
        // Ignore
      }
    },
    logWarning: (): void => {
      if (this.warningCount >= 10) return;
      this.warningCount++;
      try {
        this.sdk.health.logWarning();
      } catch {
        // Ignore
      }
    },
  };
}

export class WebPlatformAdapter implements PlatformFacade {
  public readonly isPlayablesEnv = false;
  public readonly sdkVersion = 'web-fallback-1.0';

  public readonly lifecycle = {
    notifyFirstFrameReady: (): void => {
      window.ytgame?.game?.firstFrameReady?.();
    },
    notifyGameReady: (): void => {
      window.ytgame?.game?.gameReady?.();
    },
    registerHandlers: (handlers: { onPause: () => void; onResume: () => void }): void => {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) handlers.onPause();
        else handlers.onResume();
      });
    },
  };

  public readonly audio = {
    isAudioEnabled: (): boolean => true,
    onMuteChange: (): void => {},
  };

  public readonly storage = {
    loadRaw: async (): Promise<string> => readLocalBackup(),
    saveRaw: async (serialized: string): Promise<boolean> => {
      writeLocalBackup(serialized);
      return true;
    },
  };

  public readonly ads = {
    requestRewardedAd: async (_rewardId: RewardAdPlacementId): Promise<boolean> => {
      // Simulate brief 350ms rewarded ad completion in web preview
      await new Promise((resolve) => setTimeout(resolve, 350));
      return true;
    },
    requestInterstitialAd: async (): Promise<void> => {},
  };

  public readonly engagement = {
    sendScore: async (_scoreValue: number): Promise<boolean> => true,
    openYTContent: async (_videoId: string): Promise<boolean> => true,
  };

  public readonly i18n = {
    getLanguage: async (): Promise<string> => navigator.language || 'en',
  };

  public readonly health = {
    logError: (): void => {},
    logWarning: (): void => {},
  };
}

export function createPlatformFacade(): PlatformFacade {
  if (typeof window !== 'undefined' && window.ytgame && window.ytgame.IN_PLAYABLES_ENV) {
    return new YouTubePlatformAdapter(window.ytgame);
  }
  return new WebPlatformAdapter();
}
