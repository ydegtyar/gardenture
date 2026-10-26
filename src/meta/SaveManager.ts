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
      musicVolume: 0.0,
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

export function parseSavePayload(raw: string): SaveDataV1 | null {
  if (!raw || raw.trim().length < 2) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveDataV1>;
    if (!parsed || parsed.schemaVersion !== 1) return null;
    const defaults = createDefaultSaveData();
    return {
      ...defaults,
      ...parsed,
      currencies: { ...defaults.currencies, ...parsed.currencies },
      unlocks: {
        ...defaults.unlocks,
        ...parsed.unlocks,
        maxDifficultyTierByBiome: {
          ...defaults.unlocks.maxDifficultyTierByBiome,
          ...(parsed.unlocks?.maxDifficultyTierByBiome ?? {}),
        },
        personaAdPips: {
          ...defaults.unlocks.personaAdPips,
          ...(parsed.unlocks?.personaAdPips ?? {}),
        },
      },
      loadout: { ...defaults.loadout, ...parsed.loadout },
      bestScores: {
        ...defaults.bestScores,
        ...parsed.bestScores,
        dailyBest: {
          ...defaults.bestScores.dailyBest,
          ...(parsed.bestScores?.dailyBest ?? {}),
        },
      },
      retention: { ...defaults.retention, ...parsed.retention },
      settings: { ...defaults.settings, ...parsed.settings },
    };
  } catch {
    return null;
  }
}

function mergeUniqueStrings<T extends string>(a: readonly T[], b: readonly T[]): T[] {
  return Array.from(new Set([...a, ...b]));
}

/**
 * Deterministic Dual-Storage Reconciliation between YouTube Playables Cloud Save (`ytgame.game.loadData`)
 * and LocalStorage backup (`swipe_roguelite_save_v1`).
 * - Selects the snapshot with the newer `updatedAtEpochMs` as the primary state.
 * - Merges all permanent unlocks (`personas`, `professions`, `weapons`, `trinkets`, `curses`),
 *   highest `personaAdPips` per persona, and highest `bestScores.allTime` so progress is never lost.
 */
export function reconcileSaveData(
  cloudRaw: string,
  localRaw: string
): { state: SaveDataV1; source: 'cloud' | 'local' | 'merged' | 'default' } {
  const cloudState = parseSavePayload(cloudRaw);
  const localState = parseSavePayload(localRaw);

  let resolved: SaveDataV1;
  let source: 'cloud' | 'local' | 'merged' | 'default';

  if (cloudState && localState) {
    const primary =
      cloudState.updatedAtEpochMs >= localState.updatedAtEpochMs ? cloudState : localState;
    const secondary = primary === cloudState ? localState : cloudState;

    const mergedPips: Record<string, number> = {
      ...secondary.unlocks.personaAdPips,
      ...primary.unlocks.personaAdPips,
    };
    for (const [k, v] of Object.entries(secondary.unlocks.personaAdPips)) {
      mergedPips[k] = Math.max(mergedPips[k] ?? 0, v ?? 0);
    }

    const mergedTierByBiome: Record<string, number> = {
      ...secondary.unlocks.maxDifficultyTierByBiome,
      ...primary.unlocks.maxDifficultyTierByBiome,
    };
    for (const [k, v] of Object.entries(secondary.unlocks.maxDifficultyTierByBiome)) {
      mergedTierByBiome[k] = Math.max(mergedTierByBiome[k] ?? 1, v ?? 1);
    }

    const bestAllTime = Math.max(
      primary.bestScores.allTime,
      secondary.bestScores.allTime
    );

    resolved = {
      ...primary,
      updatedAtEpochMs: Math.max(primary.updatedAtEpochMs, secondary.updatedAtEpochMs),
      currencies: {
        ...primary.currencies,
        coins:
          primary.updatedAtEpochMs === secondary.updatedAtEpochMs
            ? Math.max(primary.currencies.coins, secondary.currencies.coins)
            : primary.currencies.coins,
        gems:
          primary.updatedAtEpochMs === secondary.updatedAtEpochMs
            ? Math.max(primary.currencies.gems, secondary.currencies.gems)
            : primary.currencies.gems,
        adTokensToday: Math.max(
          primary.currencies.adTokensToday,
          secondary.currencies.adTokensToday
        ),
      },
      unlocks: {
        personas: mergeUniqueStrings(primary.unlocks.personas, secondary.unlocks.personas),
        professions: mergeUniqueStrings(
          primary.unlocks.professions,
          secondary.unlocks.professions
        ),
        weapons: mergeUniqueStrings(primary.unlocks.weapons, secondary.unlocks.weapons),
        trinkets: mergeUniqueStrings(primary.unlocks.trinkets, secondary.unlocks.trinkets),
        curses: mergeUniqueStrings(primary.unlocks.curses, secondary.unlocks.curses),
        maxDifficultyTierByBiome: mergedTierByBiome,
        personaAdPips: mergedPips,
      },
      bestScores: {
        ...primary.bestScores,
        allTime: bestAllTime,
        unsynced: primary.bestScores.unsynced || secondary.bestScores.unsynced,
      },
      retention: {
        ...primary.retention,
        totalRunsCompleted: Math.max(
          primary.retention.totalRunsCompleted,
          secondary.retention.totalRunsCompleted
        ),
        streakDays: Math.max(
          primary.retention.streakDays,
          secondary.retention.streakDays
        ),
        achievementsUnlocked: mergeUniqueStrings(
          primary.retention.achievementsUnlocked,
          secondary.retention.achievementsUnlocked
        ),
      },
    };
    source = 'merged';
  } else if (cloudState) {
    resolved = cloudState;
    source = 'cloud';
  } else if (localState) {
    resolved = localState;
    source = 'local';
  } else {
    resolved = createDefaultSaveData();
    source = 'default';
  }

  // Reset daily ad counters if UTC date rolled over
  const today = getCurrentUtcDateKey();
  if (resolved.currencies.lastAdResetUtcDate !== today) {
    resolved.currencies.adWatchCountToday = 0;
    resolved.currencies.lastAdResetUtcDate = today;
  }

  return { state: resolved, source };
}

export class SaveManager {
  private state: SaveDataV1 = createDefaultSaveData();
  public lastSyncSource: 'cloud' | 'local' | 'merged' | 'default' = 'default';
  public lastSaveSucceeded = true;

  constructor(private readonly platform: PlatformFacade) {}

  public getState(): SaveDataV1 {
    return this.state;
  }

  public setState(nextState: SaveDataV1): void {
    this.state = nextState;
  }

  public async loadAndReconcile(): Promise<SaveDataV1> {
    const cloudRaw = await this.platform.storage.loadCloudRaw();
    const localRaw = this.platform.storage.loadLocalBackupRaw();
    const { state, source } = reconcileSaveData(cloudRaw, localRaw);
    this.state = state;
    this.lastSyncSource = source;

    // If reconciled from local or merged, flush back so cloud & local match
    if (source === 'local' || source === 'merged') {
      await this.flushImmediate();
    }

    // Retry syncing any unsynced high score to YouTube Playables engagement API
    if (this.state.bestScores.unsynced && this.state.bestScores.allTime > 0) {
      const ok = await this.platform.engagement.sendScore(this.state.bestScores.allTime);
      if (ok) {
        this.state.bestScores.unsynced = false;
        await this.flushImmediate();
      }
    }

    return this.state;
  }

  public async flushImmediate(): Promise<boolean> {
    this.state.updatedAtEpochMs = Date.now();
    const serialized = JSON.stringify(this.state);
    const ok = await this.platform.storage.saveRaw(serialized);
    this.lastSaveSucceeded = ok;
    return ok;
  }

  public recordAdWatched(): void {
    this.state.currencies.adWatchCountToday++;
    this.state.currencies.adTokensToday++;
  }

  public claimSanctuaryAdReward(rewardCoins = 120, rewardGems = 2): {
    coinsAdded: number;
    gemsAdded: number;
  } {
    this.recordAdWatched();
    this.state.currencies.coins += rewardCoins;
    this.state.currencies.gems += rewardGems;
    this.state.updatedAtEpochMs = Date.now();
    return { coinsAdded: rewardCoins, gemsAdded: rewardGems };
  }

  public canWatchRewardedAd(): boolean {
    return this.state.currencies.adWatchCountToday < 6;
  }
}

