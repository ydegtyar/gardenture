/**
 * SaveDataV1 Persistence, Dual-Storage Reconciliation, Quests & Store Manager
 * Layer 5 (meta): Implements YouTube Playables SDK Spec Section 6 & GDD Sections 10–11.
 */

import type { BiomeId, ProfessionId } from '../content/schema/types';
import type { MidRunCheckpointV1 } from '../sim/Simulation';
import type { PlatformFacade } from '../platform/ports/PlatformFacade';

export interface DailyQuestState {
  id: string;
  title: string;
  progress: number;
  target: number;
  rewardCoins: number;
  rewardGems: number;
  claimed: boolean;
}

export interface SaveDataV1 {
  readonly schemaVersion: 1;
  updatedAtEpochMs: number;
  currencies: {
    coins: number;
    gems: number;
    adTokensToday: number;
    adWatchCountToday: number;
    lastAdResetUtcDate: string;
  };
  unlocks: {
    personas: string[];
    professions: ProfessionId[];
    weapons: string[];
    trinkets: string[];
    curses: string[];
    maxDifficultyTierByBiome: Record<string, number>;
    personaAdPips: Record<string, number>;
  };
  loadout: {
    personaId: string;
    professionId: ProfessionId;
    startingWeaponId: string;
    trinketIds: string[];
    curseIds: string[];
    biomeId: BiomeId;
    isDailySeedMode: boolean;
  };
  bestScores: {
    allTime: number;
    unsynced: boolean;
    dailyBest: {
      dateKey: string;
      score: number;
      scoredAttemptUsed: boolean;
    };
  };
  retention: {
    totalRunsCompleted: number;
    streakDays: number;
    lastPlayedUtcDate: string;
    dailyQuestsDate: string;
    dailyQuests: DailyQuestState[];
    weaponMasteryXp: Record<string, number>;
    professionMasteryXp: Record<string, number>;
    achievementsUnlocked: string[];
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
    reducedMotion: boolean;
    colorblindPalette: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
    joystickSizeScale: number;
    hapticsEnabled: boolean;
    showDamageNumbers: boolean;
    bloomIntensity: number;
  };
  activeRun: MidRunCheckpointV1 | null;
}

export function getCurrentUtcDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Pure helper that updates the consecutive daily run streak when a player completes a run.
 * - First run ever (lastPlayedUtcDate === ''): sets streak to 1.
 * - Same UTC day as last completed run: keeps current streak (min 1).
 * - Exactly 1 UTC day after last completed run: increments streak by +1.
 * - More than 1 UTC day gap: resets consecutive counter to 1 for the new streak.
 */
export function updateDailyRunStreak(
  currentStreakDays: number,
  lastPlayedUtcDate: string,
  todayUtcDate: string
): { streakDays: number; lastPlayedUtcDate: string; streakIncremented: boolean } {
  if (!lastPlayedUtcDate) {
    return {
      streakDays: Math.max(1, currentStreakDays || 1),
      lastPlayedUtcDate: todayUtcDate,
      streakIncremented: true,
    };
  }

  if (lastPlayedUtcDate === todayUtcDate) {
    return {
      streakDays: Math.max(1, currentStreakDays),
      lastPlayedUtcDate: todayUtcDate,
      streakIncremented: false,
    };
  }

  const prevMs = Date.parse(`${lastPlayedUtcDate}T00:00:00Z`);
  const currMs = Date.parse(`${todayUtcDate}T00:00:00Z`);
  if (!Number.isNaN(prevMs) && !Number.isNaN(currMs)) {
    const diffDays = Math.round((currMs - prevMs) / 86_400_000);
    if (diffDays === 1) {
      return {
        streakDays: Math.max(1, currentStreakDays) + 1,
        lastPlayedUtcDate: todayUtcDate,
        streakIncremented: true,
      };
    }
  }

  return {
    streakDays: 1,
    lastPlayedUtcDate: todayUtcDate,
    streakIncremented: true,
  };
}

export const STREAK_MILESTONES: readonly number[] = [3, 5, 7, 10, 14, 21, 30];

export interface DailyStreakHighlightInfo {
  isHighlighted: boolean;
  isMilestone: boolean;
  isHighStreak: boolean;
  badgeText: string | null;
  statusLabel: string;
}

/**
 * Evaluates whether the player's current daily streak should trigger a highlight
 * pulse or milestone radiance effect in RunSummaryModal.
 */
export function getDailyStreakHighlight(
  streakDays: number,
  streakIncremented: boolean
): DailyStreakHighlightInfo {
  const safeDays = Math.max(0, Math.floor(streakDays));
  const isMilestone =
    safeDays >= 3 && (STREAK_MILESTONES.includes(safeDays) || safeDays % 7 === 0);
  const isHighStreak = safeDays >= 3;
  const isHighlighted = streakIncremented || isMilestone || isHighStreak;

  let badgeText: string | null = null;
  if (isMilestone) {
    badgeText = 'MILESTONE';
  } else if (isHighStreak) {
    badgeText = 'HOT STREAK';
  } else if (streakIncremented) {
    badgeText = 'NEW';
  }

  let statusLabel = 'Active Today';
  if (isMilestone) {
    statusLabel = `${safeDays}-Day Milestone!`;
  } else if (isHighStreak && streakIncremented) {
    statusLabel = 'High Streak Extended!';
  } else if (isHighStreak) {
    statusLabel = 'High Streak Active!';
  } else if (streakIncremented) {
    statusLabel = 'Streak Extended!';
  }

  return {
    isHighlighted,
    isMilestone,
    isHighStreak,
    badgeText,
    statusLabel,
  };
}


export function createDefaultSaveData(): SaveDataV1 {
  const today = getCurrentUtcDateKey();
  return {
    schemaVersion: 1,
    updatedAtEpochMs: Date.now(),
    currencies: {
      coins: 160, // Enough for an early unlock or revive to make first session rewarding
      gems: 5,
      adTokensToday: 0,
      adWatchCountToday: 0,
      lastAdResetUtcDate: today,
    },
    unlocks: {
      personas: ['adventurer_default'],
      professions: ['warden'],
      weapons: [
        'garden_blade',
        'thorn_spear',
        'bloom_hammer',
        'seed_blades',
        'petal_orbit',
        'chain_lightning',
      ],
      trinkets: ['aegis_leaf'],
      curses: ['swarm_brand'],
      maxDifficultyTierByBiome: {
        garden: 1,
        dungeon: 1,
        sakura_grove: 1,
        sunlit_oasis: 1,
      },
      personaAdPips: {},
    },
    loadout: {
      personaId: 'adventurer_default',
      professionId: 'warden',
      startingWeaponId: 'garden_blade',
      trinketIds: ['aegis_leaf'],
      curseIds: [],
      biomeId: 'garden',
      isDailySeedMode: false,
    },
    bestScores: {
      allTime: 0,
      unsynced: false,
      dailyBest: {
        dateKey: today,
        score: 0,
        scoredAttemptUsed: false,
      },
    },
    retention: {
      totalRunsCompleted: 0,
      streakDays: 0,
      lastPlayedUtcDate: '',
      dailyQuestsDate: today,
      dailyQuests: [
        {
          id: 'q_slay_80',
          title: 'Defeat 80 Swarm Enemies',
          progress: 0,
          target: 80,
          rewardCoins: 80,
          rewardGems: 1,
          claimed: false,
        },
        {
          id: 'q_rank_b',
          title: 'Reach Style Rank B or Higher',
          progress: 0,
          target: 1,
          rewardCoins: 100,
          rewardGems: 2,
          claimed: false,
        },
        {
          id: 'q_survive_120',
          title: 'Survive 120 Seconds in the Garden',
          progress: 0,
          target: 120,
          rewardCoins: 90,
          rewardGems: 1,
          claimed: false,
        },
      ],
      weaponMasteryXp: {},
      professionMasteryXp: {},
      achievementsUnlocked: [],
    },
    settings: {
      musicVolume: 0.7,
      sfxVolume: 0.85,
      reducedMotion: false,
      colorblindPalette: 'none',
      joystickSizeScale: 1.0,
      hapticsEnabled: true,
      showDamageNumbers: true,
      bloomIntensity: 1.0,
    },
    activeRun: null,
  };
}

export class SaveManager {
  private state: SaveDataV1 = createDefaultSaveData();

  constructor(private readonly platform: PlatformFacade) {}

  public getState(): SaveDataV1 {
    return this.state;
  }

  public async loadAndReconcile(): Promise<SaveDataV1> {
    const raw = await this.platform.storage.loadRaw();
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<SaveDataV1>;
        if (parsed && parsed.schemaVersion === 1) {
          this.state = {
            ...createDefaultSaveData(),
            ...parsed,
            currencies: { ...createDefaultSaveData().currencies, ...parsed.currencies },
            unlocks: { ...createDefaultSaveData().unlocks, ...parsed.unlocks },
            loadout: { ...createDefaultSaveData().loadout, ...parsed.loadout },
            bestScores: { ...createDefaultSaveData().bestScores, ...parsed.bestScores },
            retention: { ...createDefaultSaveData().retention, ...parsed.retention },
            settings: { ...createDefaultSaveData().settings, ...parsed.settings },
          };
        }
      } catch {
        this.platform.health.logWarning();
      }
    }

    // Reset daily ad counters if UTC date rolled over
    const today = getCurrentUtcDateKey();
    if (this.state.currencies.lastAdResetUtcDate !== today) {
      this.state.currencies.adWatchCountToday = 0;
      this.state.currencies.lastAdResetUtcDate = today;
    }

    return this.state;
  }

  public async flushImmediate(): Promise<boolean> {
    this.state.updatedAtEpochMs = Date.now();
    const serialized = JSON.stringify(this.state);
    return this.platform.storage.saveRaw(serialized);
  }

  public recordAdWatched(): void {
    this.state.currencies.adWatchCountToday++;
    this.state.currencies.adTokensToday++;
  }

  public canWatchRewardedAd(): boolean {
    return this.state.currencies.adWatchCountToday < 6;
  }
}
