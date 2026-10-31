import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { hashStringToSeed } from '../../core/rng/rng';
import { FixedClock } from '../../core/time/clock';
import { NO_ADS, PERSONA_NO_ADS_COST_SEEDS } from '../../config/ads';
import {
  CARDS,
  CURSES,
  PERSONAS,
  PROFESSIONS,
  STYLE_RANKS,
  TRINKETS,
  isPersonaRelatedToProfession,
} from '../../content/data/catalog';
import type { BiomeId, PowerUpId, ProfessionId } from '../../content/schema/types';
import { Simulation } from '../../sim/Simulation';
import type { DraftOfferItem } from '../../sim/systems/cardDraft';
import { InputManager } from '../../input/InputManager';
import { createPlatformFacade, platform, PlatformFeature } from '../../platform/Adapters';
import type {
  DevStubAdOutcomeMode,
  DevStubStorageMode,
  YtSdkDiagnosticsState,
} from '../../platform/ports/PlatformFacade';
import {
  SaveManager,
  createDefaultSaveData,
  getCurrentUtcDateKey,
  updateDailyRunStreak,
  type SaveDataV1,
} from '../../meta/SaveManager';
import { GameAudioMixer } from '../../platform/audio/GameAudioMixer';
import { PixiGameRenderer } from '../../view/PixiRenderer';
import type { RunSummarySnapshot } from '../Modals';
import type { ActiveBuff } from '../components/ActiveBuffs';
import { POWERUPS } from '../../game/data/powerups';
import { IS_DEV } from '../debug/devGate';
import {
  areGameScreenAssetsReady,
  prefetchGameScreenAssets,
} from '../utils/prefetchGameScreenAssets';

export type ShellState = 'title' | 'playing' | 'paused' | 'gameover';
export type SanctuaryTab = 'loadout' | 'store' | 'quests' | 'bestiary' | null;

const ALL_BIOMES: readonly BiomeId[] = [
  'garden',
  'dungeon',
  'sakura_grove',
  'sunlit_oasis',
  'frostbite_glade',
  'crimson_ashlands',
];

function pickRandomBiome(): BiomeId {
  return ALL_BIOMES[Math.floor(Math.random() * ALL_BIOMES.length)] ?? 'garden';
}

export interface HudTelemetry {
  hp: number;
  maxHp: number;
  shieldHp: number;
  xp: number;
  xpToNext: number;
  level: number;
  rankIndex: number;
  stylePoints: number;
  score: number;
  kills: number;
  streak: number;
  elapsedSec: number;
  dashCharges: number;
  maxDashCharges: number;
  dashReadyRatio: number;
  isDashInvisible: boolean;
  heldPowerUps: (PowerUpId | null)[];
  activeBuffs: ActiveBuff[];
  weapons: Array<{ id: string; level: number; evolved: boolean }>;
  ownedCards: Record<string, number>;
  activeAlert: string | null;
  isOutsideArena?: boolean;
}

export interface RankAuraState {
  active: boolean;
  colorHex: string;
  letter: string;
  key: number;
}

export interface EndedRunRewardsSummary {
  coinsEarned: number;
  gemsEarned: number;
  score: number;
  kills: number;
  elapsedSeconds: number;
}

export interface GameShellContextValue {
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  shellState: ShellState;
  saveData: SaveDataV1;
  sanctuaryTab: SanctuaryTab;
  setSanctuaryTab: (tab: SanctuaryTab) => void;
  draftOffers: DraftOfferItem[];
  awaitingRevive: boolean;
  isAdLoading: boolean;
  runSummary: RunSummarySnapshot | null;
  lastEndedRunRewards: EndedRunRewardsSummary | null;
  userMuted: boolean;
  debugMenuOpen: boolean;
  ytDiagnostics: YtSdkDiagnosticsState;
  ytSdkBanner: string | null;
  lastSyncSource: 'cloud' | 'local' | 'merged' | 'default';
  hud: HudTelemetry;
  trailingHpRatio: number;
  rankAura: RankAuraState | null;
  freeRerollAvailable: boolean;
  freeRerollsRemaining: number;
  maxFreeRerolls: number;
  canAdReroll: boolean;
  adRerollsRemaining: number;
  coinRerollsRemaining: number;
  canWatchRewardedAd: boolean;
  platformProvider: string;
  isMenuTransitioning: boolean;

  // Core Actions
  startNewOrResumedRun: (resumeExisting?: boolean, withMenuCrossfade?: boolean) => void;
  completeMenuTransition: () => void;
  updateShellState: (next: ShellState) => void;
  toggleMute: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  endRunWithSuddenDeath: () => void;
  usePowerUpSlot: (slotIndex: number) => void;
  updateSettings: (partial: Partial<SaveDataV1['settings']>) => void;

  // Card Draft & Revive Actions
  handleSelectCardOffer: (offerId: string) => void;
  handleRerollFree: () => void;
  handleRerollAd: () => Promise<void>;
  handleRerollCoins: () => void;
  handleSkipDraft: () => void;
  handleWatchAdRevive: () => Promise<void>;
  handleSpendCoinsRevive: () => void;
  handleDeclineRevive: () => void;
  handleWatchDoubleCoinsAd: () => Promise<void>;
  handleReturnToTitleFromSummary: () => void;

  // Sanctuary / Loadout / Store / Quests / YouTube SDK Actions
  handleSelectLoadout: (partial: Partial<SaveDataV1['loadout']>) => void;
  handleUnlockProfession: (profId: ProfessionId, cost: number) => void;
  handleUnlockTrinket: (trinketId: string, cost: number) => void;
  handleUpgradeTrinket: (trinketId: string) => void;
  handleUnlockCurse: (curseId: string, cost: number) => void;
  handleUpgradeCurse: (curseId: string) => void;
  handleWatchPersonaPipAd: (personaId: string) => Promise<void>;
  handleBuyPersonaWithSeeds: (personaId: string) => Promise<boolean>;
  handleWatchSanctuaryRewardAd: () => Promise<void>;
  handleWatchCoinsAd: () => Promise<void>;
  handleSavePlayerStateNow: () => Promise<void>;
  handleReloadAndReconcileSave: () => Promise<void>;
  handleClaimQuest: (questId: string) => void;

  // Dev-Only Debug Actions (gated by IS_DEV)
  openDebugMenu: () => void;
  closeDebugMenu: () => void;
  handleDebugSetCardLevel: (cardId: string, level: number) => void;
  handleDebugSetWeaponLevel: (weaponId: string, level: number, evolved: boolean) => void;
  handleDebugSpawnPowerUpDrop: (powerUpId: PowerUpId) => void;
  handleDebugGivePowerUp: (powerUpId: PowerUpId) => void;
  handleDebugTriggerPowerUp: (powerUpId: PowerUpId) => void;
  handleDebugSpawnArenaFlower: () => void;
  handleDebugSpawnFinalBossArena: () => void;
  handleDebugTestHealHero: (amount: number) => void;
  handleDebugResetAllCards: () => void;
  handleDebugAddGold: (amount: number) => void;
  handleDebugIncrementPersonaAdPip: (personaId: string) => void;
  handleDebugIncrementAllPersonaAdPips: () => void;
  handleDebugSpawnBestiaryEnemy: (
    bestiaryKey: string,
    mode: 'infinite_hp' | 'swarm' | 'respawn_on_death'
  ) => void;
  handleSetDevAdOutcomeMode: (mode: DevStubAdOutcomeMode) => void;
  handleSetDevCloudStorageMode: (mode: DevStubStorageMode) => void;
  handleSimulateYtAudioToggle: () => void;
  handleSyncScoreNow: () => Promise<void>;
}

const GameShellContext = createContext<GameShellContextValue | null>(null);

export function useGameShell(): GameShellContextValue {
  const ctx = useContext(GameShellContext);
  if (!ctx) {
    throw new Error('useGameShell must be used within a GameShellProvider');
  }
  return ctx;
}

export function GameShellProvider({ children }: { children: React.ReactNode }) {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<PixiGameRenderer | null>(null);
  const simRef = useRef<Simulation | null>(null);
  const clockRef = useRef<FixedClock>(new FixedClock());
  const inputRef = useRef<InputManager>(new InputManager());
  const audioRef = useRef<GameAudioMixer>(new GameAudioMixer());
  const platformRef = useRef(createPlatformFacade());
  const saveManagerRef = useRef(new SaveManager(platformRef.current));

  const [shellState, setShellState] = useState<ShellState>('title');
  const shellStateRef = useRef<ShellState>('title');
  const [isMenuTransitioning, setIsMenuTransitioning] = useState(false);
  const isMenuTransitioningRef = useRef(false);

  const [saveData, setSaveData] = useState<SaveDataV1>(() => createDefaultSaveData());
  const saveDataRef = useRef<SaveDataV1>(saveData);

  const [sanctuaryTab, setSanctuaryTab] = useState<SanctuaryTab>(null);
  const [draftOffers, setDraftOffers] = useState<DraftOfferItem[]>([]);
  const draftOffersRef = useRef<DraftOfferItem[]>([]);
  draftOffersRef.current = draftOffers;
  const [awaitingRevive, setAwaitingRevive] = useState(false);
  const awaitingReviveRef = useRef(false);
  awaitingReviveRef.current = awaitingRevive;
  const [isAdLoading, setIsAdLoading] = useState(false);
  const isAdPlayingRef = useRef(false);
  const [runSummary, setRunSummary] = useState<RunSummarySnapshot | null>(null);
  const [lastEndedRunRewards, setLastEndedRunRewards] =
    useState<EndedRunRewardsSummary | null>(null);
  const exitToTitleAfterEndRunRef = useRef(false);
  const [userMuted, setUserMuted] = useState(false);
  const [debugMenuOpen, setDebugMenuOpen] = useState(false);
  const debugMenuOpenRef = useRef(false);
  const [ytDiagnostics, setYtDiagnostics] = useState(() =>
    platformRef.current.devStub.getDiagnostics()
  );
  const [ytSdkBanner, setYtSdkBanner] = useState<string | null>(null);

  const refreshYtDiagnostics = useCallback((banner?: string | null) => {
    setYtDiagnostics(platformRef.current.devStub.getDiagnostics());
    if (banner !== undefined) {
      setYtSdkBanner(banner);
    }
  }, []);

  const openDebugMenu = useCallback(() => {
    if (!IS_DEV) return;
    inputRef.current.clearAllIntents();
    debugMenuOpenRef.current = true;
    setDebugMenuOpen(true);
  }, []);

  const closeDebugMenu = useCallback(() => {
    debugMenuOpenRef.current = false;
    setDebugMenuOpen(false);
    clockRef.current.reset();
    if (simRef.current) {
      syncHudFromSimRef.current?.(simRef.current);
    }
  }, []);

  const [hud, setHud] = useState<HudTelemetry>({
    hp: 100,
    maxHp: 100,
    shieldHp: 0,
    xp: 0,
    xpToNext: 6,
    level: 1,
    rankIndex: 0,
    stylePoints: 0,
    score: 0,
    kills: 0,
    streak: 0,
    elapsedSec: 0,
    dashCharges: 1,
    maxDashCharges: 1,
    dashReadyRatio: 1,
    isDashInvisible: false,
    heldPowerUps: [],
    activeBuffs: [],
    weapons: [{ id: 'garden_blade', level: 1, evolved: false }],
    ownedCards: {},
    activeAlert: null,
  });

  const [trailingHpRatio, setTrailingHpRatio] = useState(1);
  const [rankAura, setRankAura] = useState<RankAuraState | null>(null);
  const rankAuraTimeoutRef = useRef<number | null>(null);

  const completeMenuTransition = useCallback(() => {
    const finalize = () => {
      isMenuTransitioningRef.current = false;
      setIsMenuTransitioning(false);
      clockRef.current.reset();
    };
    if (areGameScreenAssetsReady()) {
      finalize();
    } else {
      void prefetchGameScreenAssets().finally(finalize);
    }
  }, []);

  const updateShellState = useCallback((next: ShellState) => {
    shellStateRef.current = next;
    setShellState(next);
    document.body.dataset.state = next;
    if (next === 'title') {
      isMenuTransitioningRef.current = false;
      setIsMenuTransitioning(false);
      rendererRef.current?.suspendAndDetachCanvas();
    } else {
      rendererRef.current?.attachCanvas(canvasContainerRef.current);
    }
    if (next === 'playing') {
      platform.notifyGameplayStart();
    } else {
      platform.notifyGameplayStop();
    }
    if (next !== 'playing') {
      document.exitPointerLock?.();
    }
  }, []);

  const syncHudFromSim = useCallback((sim: Simulation, alertBanner?: string | null) => {
    setHud((prev) => ({
      hp: Math.max(0, Math.round(sim.currentHp)),
      maxHp: Math.max(1, Math.round(sim.maxHp)),
      shieldHp: Math.round(sim.shieldHp),
      xp: Math.round(sim.currentXp),
      xpToNext: Math.max(1, Math.round(sim.xpToNext)),
      level: sim.level,
      rankIndex: sim.rankIndex,
      stylePoints: Math.round(sim.stylePoints),
      score: Math.floor(sim.score),
      kills: sim.kills,
      streak: sim.currentStreak,
      elapsedSec: Math.floor(sim.elapsedSeconds),
      dashCharges: sim.dashCharges,
      maxDashCharges: sim.maxDashCharges,
      dashReadyRatio:
        sim.dashCharges >= sim.maxDashCharges
          ? 1
          : Math.max(
              0,
              Math.min(
                1,
                1 - sim.dashCooldownTimer / Math.max(0.2, sim.stats.dashCooldown)
              )
            ),
      isDashInvisible: sim.dashIframeTimer > 0 || sim.dashTimer > 0,
      heldPowerUps: [...sim.heldPowerUps],
      activeBuffs: [
        ...(sim.shieldTimer > 0 && sim.shieldHp > 0
          ? [
              {
                id: 'aegis-orb' as const,
                remainingSec: sim.shieldTimer,
                totalSec: POWERUPS['aegis-orb'].durationSec,
              },
            ]
          : []),
        ...(sim.freezeAuraTimer > 0
          ? [
              {
                id: 'frost-flask' as const,
                remainingSec: sim.freezeAuraTimer,
                totalSec: POWERUPS['frost-flask'].durationSec,
              },
            ]
          : []),
        ...(sim.fireBreathTimer > 0
          ? [
              {
                id: 'ember-guard' as const,
                remainingSec: sim.fireBreathTimer,
                totalSec: POWERUPS['ember-guard'].durationSec,
              },
            ]
          : []),
        ...(sim.magnetBuffTimer > 0
          ? [
              {
                id: 'clover-magnet' as const,
                remainingSec: sim.magnetBuffTimer,
                totalSec: POWERUPS['clover-magnet'].durationSec,
              },
            ]
          : []),
        ...(sim.timeSlowTimer > 0
          ? [
              {
                id: 'sundial-watch' as const,
                remainingSec: sim.timeSlowTimer,
                totalSec: POWERUPS['sundial-watch'].durationSec,
              },
            ]
          : []),
        ...(sim.healBuffTimer > 0
          ? [
              {
                id: 'heal-20hp' as const,
                remainingSec: sim.healBuffTimer,
                totalSec: POWERUPS['heal-20hp'].durationSec,
              },
            ]
          : []),
      ],
      weapons: sim.weapons.map((w) => ({ id: w.id, level: w.level, evolved: w.evolved })),
      ownedCards: { ...sim.cards },
      activeAlert: alertBanner !== undefined ? alertBanner : prev.activeAlert,
      isOutsideArena: sim.isOutsideArena,
    }));
    const shouldShowDraft =
      !sim.awaitingReviveDecision &&
      sim.currentHp > 0 &&
      sim.deathSequenceTimer <= 0 &&
      sim.victorySequenceTimer <= 0 &&
      !sim.runEnded &&
      sim.pendingCardOffers.length > 0 &&
      sim.isHeroSafeForCardDraft();
    setDraftOffers((prev) => {
      if (!shouldShowDraft) {
        return prev.length === 0 ? prev : [];
      }
      if (
        prev.length === sim.pendingCardOffers.length &&
        prev.every((item, idx) => item.offerId === sim.pendingCardOffers[idx]?.offerId)
      ) {
        return prev;
      }
      return [...sim.pendingCardOffers];
    });
  }, []);
  const syncHudFromSimRef = useRef(syncHudFromSim);
  syncHudFromSimRef.current = syncHudFromSim;

  const attachSimListeners = useCallback(
    (sim: Simulation) => {
      sim.events.clear();

      sim.events.on('EnemyHit', (ev) => {
        if (ev.weaponTag === 'poison_dot') {
          rendererRef.current?.spawnFloatingDamage(
            ev.x,
            ev.y,
            ev.damage,
            false,
            `${ev.damage}`,
            0x4ade80,
            0.72
          );
          return;
        }
        if (ev.weaponTag === 'burn_dot') {
          rendererRef.current?.spawnFloatingDamage(
            ev.x,
            ev.y,
            ev.damage,
            false,
            `${ev.damage}`,
            0xfb923c,
            0.85
          );
          return;
        }
        if (ev.weaponTag === 'storm_detonation') {
          audioRef.current.playHit(false);
          rendererRef.current?.spawnFloatingDamage(
            ev.x,
            ev.y,
            ev.damage,
            false,
            `${Math.round(ev.damage)}`,
            0x5c8cff
          );
          return;
        }
        audioRef.current.playHit(ev.isCrit);
        rendererRef.current?.spawnFloatingDamage(ev.x, ev.y, ev.damage, ev.isCrit);
        if (ev.isCrit) {
          clockRef.current.triggerHitstop(38);
          rendererRef.current?.addTrauma(0.16);
          rendererRef.current?.spawnParticleBurst(ev.x, ev.y, 0xfdffb6, 6);
        } else if (ev.isSpecialOrBoss) {
          clockRef.current.triggerHitstop(28);
        }
      });

      sim.events.on('EnemyKilled', (ev) => {
        rendererRef.current?.spawnParticleBurst(
          ev.x,
          ev.y,
          ev.color,
          ev.isBoss ? 22 : ev.isElite ? 14 : 7
        );
        if (ev.isElite || ev.isSpecial || ev.isBoss) {
          rendererRef.current?.addTrauma(ev.isBoss ? 0.45 : 0.24);
        }
      });

      sim.events.on('HeroHit', (ev) => {
        audioRef.current.playHeroHurt();
        if (!ev.shieldAbsorbed) {
          clockRef.current.triggerHitstop(55);
          rendererRef.current?.addTrauma(0.38);
          rendererRef.current?.spawnParticleBurst(ev.x, ev.y, 0xffaaa6, 12);
        }
        syncHudFromSim(sim);
      });

      sim.events.on('HeroDashed', () => {
        audioRef.current.playDash();
        rendererRef.current?.addTrauma(0.1);
      });

      sim.events.on('PowerUpUsed', (ev) => {
        audioRef.current.playPowerUpUse(ev.powerUpId);
      });

      sim.events.on('GemCollected', (ev) => {
        audioRef.current.playGemPickup();
        if (ev.kind === 'xp_cluster') {
          rendererRef.current?.spawnGoldenPetalBurst(ev.x, ev.y, 6);
        }
      });

      sim.events.on('CoinCollected', (ev) => {
        audioRef.current.playGemPickup();
        rendererRef.current?.spawnGoldenPetalBurst(ev.x, ev.y, 7);
      });

      sim.events.on('FloatingText', (ev) => {
        rendererRef.current?.spawnFloatingDamage(
          ev.x,
          ev.y,
          0,
          false,
          ev.text,
          ev.color,
          ev.scale
        );
      });

      sim.events.on('LevelUp', () => {
        audioRef.current.playLevelUpOrRankUp(false);
        if (sim.isHeroSafeForCardDraft()) {
          inputRef.current.clearAllIntents();
          setDraftOffers([...sim.pendingCardOffers]);
        } else {
          setDraftOffers([]);
        }
        syncHudFromSim(sim);
        const sd = saveDataRef.current;
        sd.activeRun = sim.serializeCheckpoint();
        void saveManagerRef.current.flushImmediate();
      });

      sim.events.on('StyleRankChanged', (ev) => {
        audioRef.current.setStyleRankIndex(ev.newRankIndex);
        if (ev.rankedUp) {
          audioRef.current.playLevelUpOrRankUp(true);
        }
        if (rankAuraTimeoutRef.current) {
          window.clearTimeout(rankAuraTimeoutRef.current);
        }
        const rankDef = STYLE_RANKS[ev.newRankIndex] || STYLE_RANKS[0]!;
        setRankAura({
          active: true,
          colorHex: rankDef.colorHex,
          letter: rankDef.letter,
          key: Date.now(),
        });
        rankAuraTimeoutRef.current = window.setTimeout(() => {
          setRankAura((prev) => (prev ? { ...prev, active: false } : null));
        }, 950);
        syncHudFromSim(sim);
      });

      // SpecialMonsterSpawned HUD announcement intentionally removed per user request

      sim.events.on('BossSpawned', (ev) => {
        audioRef.current.playLevelUpOrRankUp(true);
        syncHudFromSim(
          sim,
          ev.isFinalBoss
            ? `FINAL BOSS: ${ev.name} Awakens!`
            : `MINI-BOSS: ${ev.name} Approaches!`
        );
        setTimeout(() => {
          setHud((prev) =>
            prev.activeAlert?.includes(ev.name) ? { ...prev, activeAlert: null } : prev
          );
        }, 4500);
      });

      sim.events.on('LethalHitIntercepted', (ev) => {
        if (ev.reason === 'rescue_offer') {
          inputRef.current.clearAllIntents();
          setIsAdLoading(false);
          awaitingReviveRef.current = true;
          setAwaitingRevive(true);
          setDraftOffers([]);
          syncHudFromSim(sim);
        }
      });

      sim.events.on('RunEnded', (ev) => {
        inputRef.current.clearAllIntents();
        setAwaitingRevive(false);
        setDraftOffers([]);

        const sd = saveDataRef.current;
        sd.activeRun = null;
        sd.currencies.coins += ev.coinsEarned;
        sd.currencies.gems += ev.gemsEarned;
        sd.retention.totalRunsCompleted++;

        const todayUtc = getCurrentUtcDateKey();
        const streakUpdate = updateDailyRunStreak(
          sd.retention.streakDays,
          sd.retention.lastPlayedUtcDate,
          todayUtc
        );
        sd.retention.streakDays = streakUpdate.streakDays;
        sd.retention.lastPlayedUtcDate = streakUpdate.lastPlayedUtcDate;

        const prevBest = sd.bestScores.allTime;
        const isNewBest = ev.score > prevBest;
        if (isNewBest) {
          sd.bestScores.allTime = ev.score;
          sd.bestScores.unsynced = true;
        }

        for (const q of sd.retention.dailyQuests) {
          if (q.id === 'q_slay_80') q.progress += ev.kills;
          if (q.id === 'q_rank_b' && ev.peakRankIndex >= 2) q.progress = 1;
          if (q.id === 'q_survive_120') {
            q.progress = Math.max(q.progress, ev.elapsedSeconds);
          }
        }

        setSaveData({ ...sd });
        void saveManagerRef.current.flushImmediate();
        if (isNewBest && ev.score > 0) {
          void platformRef.current.engagement.sendScore(ev.score).then((ok) => {
            if (ok) {
              sd.bestScores.unsynced = false;
              void saveManagerRef.current.flushImmediate();
            }
          });
        }

        const summarySnapshot: RunSummarySnapshot = {
          outcome: ev.outcome,
          score: ev.score,
          bestScore: Math.max(prevBest, ev.score),
          isNewBest,
          coinsEarned: ev.coinsEarned,
          gemsEarned: ev.gemsEarned,
          peakRankIndex: ev.peakRankIndex,
          bestStreak: ev.bestStreak,
          kills: ev.kills,
          elapsedSeconds: ev.elapsedSeconds,
          bossHpRemainingRatio: ev.bossHpRemainingRatio,
          doubleCoinsClaimed: false,
          dailyStreakDays: streakUpdate.streakDays,
          dailyStreakIncremented: streakUpdate.streakIncremented,
        };

        if (exitToTitleAfterEndRunRef.current) {
          exitToTitleAfterEndRunRef.current = false;
          setLastEndedRunRewards({
            coinsEarned: ev.coinsEarned,
            gemsEarned: ev.gemsEarned,
            score: ev.score,
            kills: ev.kills,
            elapsedSeconds: ev.elapsedSeconds,
          });
          setRunSummary(null);
          updateShellState('title');
        } else {
          setRunSummary(summarySnapshot);
          updateShellState('gameover');
        }
      });
    },
    [syncHudFromSim, updateShellState]
  );

  const createFreshSimulation = useCallback(
    (sd: SaveDataV1): Simulation => {
      const todayKey = getCurrentUtcDateKey();
      const seed = sd.loadout.isDailySeedMode
        ? hashStringToSeed(`daily_${todayKey}`)
        : Math.floor(Math.random() * 0x7fffffff) + 1;

      const activePersonaId =
        isPersonaRelatedToProfession(sd.loadout.personaId, sd.loadout.professionId) &&
        sd.unlocks.personas.includes(sd.loadout.personaId)
          ? sd.loadout.personaId
          : sd.loadout.personaByProfession?.[sd.loadout.professionId] &&
             sd.unlocks.personas.includes(sd.loadout.personaByProfession[sd.loadout.professionId]!) &&
             isPersonaRelatedToProfession(
               sd.loadout.personaByProfession[sd.loadout.professionId]!,
               sd.loadout.professionId
             )
            ? sd.loadout.personaByProfession[sd.loadout.professionId]!
            : 'adventurer_default';

      const sim = new Simulation({
        seed,
        isDailySeed: sd.loadout.isDailySeedMode,
        dailyDateKey: sd.loadout.isDailySeedMode ? todayKey : null,
        difficultyTier: sd.unlocks.maxDifficultyTierByBiome[sd.loadout.biomeId] ?? 1,
        personaId: activePersonaId,
        professionId: sd.loadout.professionId,
        startingWeaponId: sd.loadout.startingWeaponId,
        equippedTrinkets: sd.loadout.trinketIds,
        trinketLevels: sd.unlocks.trinketLevels,
        activeCurses: sd.loadout.curseIds,
        curseLevels: sd.unlocks.curseLevels,
        unlockedWeapons: sd.unlocks.weapons,
      });
      attachSimListeners(sim);
      return sim;
    },
    [attachSimListeners]
  );

  const startNewOrResumedRun = useCallback(
    (resumeExisting = false, withMenuCrossfade = false) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      audioRef.current.unlockOnUserGesture();
      audioRef.current.startAdaptiveMusicLoop();

      const sd = saveDataRef.current;
      let sim: Simulation;
      if (resumeExisting && sd.activeRun) {
        sim = Simulation.fromCheckpoint(sd.activeRun, sd.unlocks.weapons);
        attachSimListeners(sim);
      } else {
        sd.activeRun = null;
        if (!sd.loadout.biomeExplicitlyChosen) {
          sd.loadout.biomeId = pickRandomBiome();
          setSaveData({ ...sd });
        }
        sim = createFreshSimulation(sd);
      }

      simRef.current = sim;
      if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>).__BLOSSOM_SIM__ = sim;
      }
      clockRef.current.reset();
      inputRef.current.clearAllIntents();
      exitToTitleAfterEndRunRef.current = false;
      setLastEndedRunRewards(null);
      setSanctuaryTab(null);
      setRunSummary(null);
      setAwaitingRevive(false);
      debugMenuOpenRef.current = false;
      setDebugMenuOpen(false);
      setDraftOffers([...sim.pendingCardOffers]);
      setTrailingHpRatio(sim.currentHp / Math.max(1, sim.maxHp));
      if (rankAuraTimeoutRef.current) {
        window.clearTimeout(rankAuraTimeoutRef.current);
      }
      setRankAura(null);

      const needsAssetWait = !areGameScreenAssetsReady();
      const holdTransition = withMenuCrossfade || needsAssetWait;
      isMenuTransitioningRef.current = holdTransition;
      setIsMenuTransitioning(holdTransition);
      if (!withMenuCrossfade && needsAssetWait) {
        void prefetchGameScreenAssets().finally(() => {
          isMenuTransitioningRef.current = false;
          setIsMenuTransitioning(false);
          clockRef.current.reset();
        });
      }

      if (rendererRef.current) {
        rendererRef.current.attachCanvas(canvasContainerRef.current);
        rendererRef.current.setPreferences({
          reducedMotion: sd.settings.reducedMotion,
          showDamageNumbers: sd.settings.showDamageNumbers,
          bloomIntensity: sd.settings.bloomIntensity,
          biome: sd.loadout.biomeId,
        });
        // Render one static frame underneath the crossfading menu while game logic stays paused
        rendererRef.current.renderFrame({
          sim,
          alpha: 0,
          dtSec: 0.016,
          joystick: {
            active: false,
            anchorX: 0,
            anchorY: 0,
            knobX: 0,
            knobY: 0,
            maxRadiusPx: 56,
          },
          resumeCountdownRatio: 0,
          isTitleMode: false,
        });
      }

      syncHudFromSim(sim, null);
      updateShellState('playing');
    },
    [attachSimListeners, createFreshSimulation, syncHudFromSim, updateShellState]
  );

  // Boot PixiJS v8, Platform Lifecycle, Input & 60Hz Loop ONCE on mount
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const facade = platformRef.current;
    const renderer = new PixiGameRenderer();
    rendererRef.current = renderer;

    const initialSim = createFreshSimulation(saveDataRef.current);
    simRef.current = initialSim;
    if (typeof window !== 'undefined') {
      const win = window as unknown as Record<string, unknown>;
      win.__BLOSSOM_SIM__ = initialSim;
      win.__BLOSSOM_RENDERER__ = renderer;
      win.render_game_to_text = () => {
        const s = simRef.current;
        const r = rendererRef.current;
        if (!s) return JSON.stringify({ state: shellStateRef.current });
        return JSON.stringify({
          state: shellStateRef.current,
          hp: Math.round(s.currentHp),
          maxHp: Math.round(s.maxHp),
          score: s.score,
          kills: s.kills,
          elapsedSeconds: Number(s.elapsedSeconds.toFixed(2)),
          victory: s.runOutcome === 'victory',
          runEnded: s.runEnded,
          bossDeathTimer: Number(s.bossDeathTimer.toFixed(2)),
          victorySequenceTimer: Number(s.victorySequenceTimer.toFixed(2)),
          deathSequenceTimer: Number(s.deathSequenceTimer.toFixed(2)),
          enemiesCount: s.enemies.length,
          projectilesCount: s.projectiles.length,
          powerUpDropsCount: s.pickups.filter((p) => p.kind === 'power_up').length,
          cameraZoom: r ? Number(r.camera.zoom.toFixed(4)) : 1,
          cameraThreat: r ? Number(r.camera.threat.toFixed(4)) : 0,
          cameraInCombat: r ? r.camera.inCombat : false,
        });
      };
      win.advanceTime = (ms: number) => {
        const s = simRef.current;
        if (!s) return;
        if (isMenuTransitioningRef.current) {
          isMenuTransitioningRef.current = false;
          setIsMenuTransitioning(false);
        }
        const steps = Math.max(1, Math.round(ms / (1000 / 60)));
        for (let i = 0; i < steps; i++) {
          s.tick();
        }
        syncHudFromSim(s);
      };
    }

    let animFrameId = 0;
    let lastTimeMs = performance.now();
    let hudSyncCounter = 0;

    facade.lifecycle.registerHandlers({
      onPause: () => {
        inputRef.current.clearAllIntents();
        audioRef.current.onPlatformPause();
        if (
          shellStateRef.current === 'playing' &&
          simRef.current &&
          !isAdPlayingRef.current &&
          !awaitingReviveRef.current &&
          !simRef.current.awaitingReviveDecision &&
          draftOffersRef.current.length === 0
        ) {
          saveDataRef.current.activeRun = simRef.current.serializeCheckpoint();
          void saveManagerRef.current.flushImmediate();
          updateShellState('paused');
        }
      },
      onResume: () => {
        audioRef.current.onPlatformResume(facade.audio.isAudioEnabled());
      },
    });

    facade.audio.onMuteChange((enabled) => {
      audioRef.current.setPlatformAudioEnabled(enabled);
    });

    const detachInput = inputRef.current.attach(container);

    const initialParams = new URLSearchParams(window.location.search);
    if (initialParams.get('autostart') === '1') {
      startNewOrResumedRun(false);
      if (initialParams.get('autodraft') === '1' && simRef.current) {
        simRef.current.triggerLevelUpCardDraft();
        syncHudFromSim(simRef.current);
      }
    }

    void prefetchGameScreenAssets();
    void (async () => {
      await Promise.all([
        renderer.init(container, saveDataRef.current.loadout.biomeId, false),
        prefetchGameScreenAssets(),
      ]);
      if (shellStateRef.current !== 'title') {
        renderer.attachCanvas(container);
      }
      facade.lifecycle.notifyFirstFrameReady();

      // Initialize Unified Platform Manager
      await platform.initialize({
        onPauseGame: () => {
          inputRef.current.clearAllIntents();
          audioRef.current.onPlatformPause();
          // If an ad is actively playing, revive modal is open, or Tarot card drafting is open,
          // mute audio and clear inputs, but DO NOT switch shellState to 'paused'
          // which would unmount the active modal.
          if (
            shellStateRef.current === 'playing' &&
            simRef.current &&
            !isAdPlayingRef.current &&
            !awaitingReviveRef.current &&
            !simRef.current.awaitingReviveDecision &&
            draftOffersRef.current.length === 0
          ) {
            saveDataRef.current.activeRun = simRef.current.serializeCheckpoint();
            void saveManagerRef.current.flushImmediate();
            updateShellState('paused');
          }
        },
        onResumeGame: () => {
          audioRef.current.onPlatformResume(platform.canUse(PlatformFeature.REWARDED_ADS));
        },
        onMuteAudio: () => {
          audioRef.current.setPlatformAudioEnabled(false);
        },
        onUnmuteAudio: () => {
          audioRef.current.setPlatformAudioEnabled(true);
        },
      });

      const loadedSave = await saveManagerRef.current.loadAndReconcile();
      saveDataRef.current = loadedSave;
      setSaveData({ ...loadedSave });
      audioRef.current.setPlatformAudioEnabled(facade.audio.isAudioEnabled());
      audioRef.current.setVolumes(loadedSave.settings.musicVolume, loadedSave.settings.sfxVolume);
      inputRef.current.setJoystickScale(loadedSave.settings.joystickSizeScale);
      renderer.setPreferences({
        reducedMotion: loadedSave.settings.reducedMotion,
        showDamageNumbers: loadedSave.settings.showDamageNumbers,
        bloomIntensity: loadedSave.settings.bloomIntensity,
        biome: loadedSave.loadout.biomeId,
      });

      facade.lifecycle.notifyGameReady();
      platform.notifyGameReady();
      refreshYtDiagnostics();

      const params = new URLSearchParams(window.location.search);
      const biomeParam = params.get('biome');
      if (
        biomeParam === 'garden' ||
        biomeParam === 'dungeon' ||
        biomeParam === 'sakura_grove' ||
        biomeParam === 'sunlit_oasis' ||
        biomeParam === 'frostbite_glade' ||
        biomeParam === 'crimson_ashlands'
      ) {
        loadedSave.loadout.biomeId = biomeParam;
        loadedSave.loadout.biomeExplicitlyChosen = true;
        saveDataRef.current = loadedSave;
        setSaveData({ ...loadedSave });
        renderer.setPreferences({
          reducedMotion: loadedSave.settings.reducedMotion,
          showDamageNumbers: loadedSave.settings.showDamageNumbers,
          bloomIntensity: loadedSave.settings.bloomIntensity,
          biome: biomeParam,
        });
      } else if (!loadedSave.loadout.biomeExplicitlyChosen) {
        const initialRandomBiome = pickRandomBiome();
        loadedSave.loadout.biomeId = initialRandomBiome;
        saveDataRef.current = loadedSave;
        setSaveData({ ...loadedSave });
        renderer.setPreferences({
          reducedMotion: loadedSave.settings.reducedMotion,
          showDamageNumbers: loadedSave.settings.showDamageNumbers,
          bloomIntensity: loadedSave.settings.bloomIntensity,
          biome: initialRandomBiome,
        });
      }
      if (params.get('autostart') === '1' && shellStateRef.current === 'title') {
        startNewOrResumedRun(false);
        if (params.get('autodraft') === '1' && simRef.current) {
          simRef.current.triggerLevelUpCardDraft();
          syncHudFromSim(simRef.current);
        }
      }
    })();

    const loop = (nowMs: number) => {
      const rawDtMs = nowMs - lastTimeMs;
      lastTimeMs = nowMs;
      const dtSec = Math.min(0.05, Math.max(0.001, rawDtMs / 1000));

      const sim = simRef.current;
      const state = shellStateRef.current;

      try {
        // Mutual exclusion (Rule 7): When Menu is visible (`state === 'title'`) or during
        // the short menu->game crossfade (`isMenuTransitioningRef.current`), never run
        // the game render loop or game simulation tick!
        if (sim && state !== 'title' && !isMenuTransitioningRef.current) {
          if (state === 'playing' && !debugMenuOpenRef.current) {
            const moveVec = inputRef.current.getMoveVector();
            sim.setMoveIntent(moveVec.x, moveVec.y);

            const { ticksToRun, alpha } = clockRef.current.advance(rawDtMs);
            for (let i = 0; i < ticksToRun; i++) {
              sim.tick();
            }

            renderer.renderFrame({
              sim,
              alpha,
              dtSec,
              joystick: inputRef.current.getJoystickVisualState(),
              resumeCountdownRatio: clockRef.current.getResumeCountdownRatio(),
              isTitleMode: false,
            });

            hudSyncCounter++;
            if (hudSyncCounter % 4 === 0) {
              syncHudFromSim(sim);
            }
          } else {
            renderer.renderFrame({
              sim,
              alpha: 0,
              dtSec,
              joystick: {
                active: false,
                anchorX: 0,
                anchorY: 0,
                knobX: 0,
                knobY: 0,
                maxRadiusPx: 56,
              },
              resumeCountdownRatio: 0,
              isTitleMode: false,
            });
          }
        }
      } catch (err) {
        console.error('Game loop frame error:', err);
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId);
      detachInput();
      audioRef.current.stopAdaptiveMusicLoop();
      if (rankAuraTimeoutRef.current) {
        window.clearTimeout(rankAuraTimeoutRef.current);
      }
      renderer.destroy();
    };
  }, [createFreshSimulation, refreshYtDiagnostics, startNewOrResumedRun, syncHudFromSim, updateShellState]);

  useEffect(() => {
    const targetRatio = hud.hp / Math.max(1, hud.maxHp);
    const timer = window.setTimeout(() => {
      setTrailingHpRatio(targetRatio);
    }, 260);
    return () => clearTimeout(timer);
  }, [hud.hp, hud.maxHp]);

  useEffect(() => {
    inputRef.current.setCallbacks({
      onDash: (angle) => {
        if (shellStateRef.current === 'playing' && !isMenuTransitioningRef.current && simRef.current) {
          simRef.current.requestDash(angle);
        }
      },
      onKeyShortcut: (code) => {
        const state = shellStateRef.current;
        const sim = simRef.current;

        if (state === 'title') {
          return;
        }

        if (code === 'KeyM') {
          const nextMute = !audioRef.current.isUserMuted();
          audioRef.current.setUserMuted(nextMute);
          setUserMuted(nextMute);
          return;
        }

        if (
          code === 'KeyR' &&
          draftOffers.length === 0 &&
          (state === 'playing' || state === 'paused' || state === 'gameover')
        ) {
          startNewOrResumedRun(false);
          return;
        }

        if (code === 'Escape' || code === 'KeyP') {
          if (
            state === 'playing' &&
            draftOffers.length === 0 &&
            !awaitingRevive &&
            (!sim || (sim.deathSequenceTimer <= 0 && sim.victorySequenceTimer <= 0))
          ) {
            inputRef.current.clearAllIntents();
            if (sim) {
              saveDataRef.current.activeRun = sim.serializeCheckpoint();
              void saveManagerRef.current.flushImmediate();
            }
            updateShellState('paused');
          } else if (state === 'paused') {
            clockRef.current.startResumeCountdown(1.0);
            updateShellState('playing');
          }
          return;
        }

        if (state === 'playing' && sim && draftOffers.length === 0) {
          if (code === 'KeyQ') sim.requestUsePowerUp(0);
          if (code === 'KeyE') sim.requestUsePowerUp(1);
        }
      },
    });
  }, [awaitingRevive, draftOffers, sanctuaryTab, startNewOrResumedRun, syncHudFromSim, updateShellState]);

  const toggleMute = useCallback(() => {
    const next = !audioRef.current.isUserMuted();
    audioRef.current.setUserMuted(next);
    setUserMuted(next);
  }, []);

  const pauseRun = useCallback(() => {
    const sim = simRef.current;
    if (
      shellStateRef.current === 'playing' &&
      (!sim || (sim.deathSequenceTimer <= 0 && sim.victorySequenceTimer <= 0))
    ) {
      inputRef.current.clearAllIntents();
      if (sim) {
        saveDataRef.current.activeRun = sim.serializeCheckpoint();
        void saveManagerRef.current.flushImmediate();
      }
      updateShellState('paused');
    }
  }, [updateShellState]);

  const resumeRun = useCallback(() => {
    clockRef.current.startResumeCountdown(1.0);
    updateShellState('playing');
  }, [updateShellState]);

  const endRunWithSuddenDeath = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    exitToTitleAfterEndRunRef.current = true;
    inputRef.current.clearAllIntents();
    clockRef.current.reset();
    setAwaitingRevive(false);
    setDraftOffers([]);
    saveDataRef.current.activeRun = null;
    setSaveData({ ...saveDataRef.current });
    void saveManagerRef.current.flushImmediate();
    sim.triggerSuddenDeath();
    syncHudFromSim(sim, null);
    updateShellState('playing');
  }, [syncHudFromSim, updateShellState]);

  const usePowerUpSlot = useCallback((slotIndex: number) => {
    simRef.current?.requestUsePowerUp(slotIndex);
  }, []);

  const updateSettings = useCallback((partial: Partial<SaveDataV1['settings']>) => {
    const sd = saveDataRef.current;
    sd.settings = { ...sd.settings, ...partial };
    setSaveData({ ...sd });
    audioRef.current.setVolumes(sd.settings.musicVolume, sd.settings.sfxVolume);
    rendererRef.current?.setPreferences({
      reducedMotion: sd.settings.reducedMotion,
      showDamageNumbers: sd.settings.showDamageNumbers,
      bloomIntensity: sd.settings.bloomIntensity,
      biome: sd.loadout.biomeId,
    });
    void saveManagerRef.current.flushImmediate();
  }, []);

  const handleSelectCardOffer = useCallback(
    (offerId: string) => {
      const sim = simRef.current;
      if (!sim) return;
      sim.applyCardOffer(offerId);
      if (sim.currentHp > 0 && sim.awaitingReviveDecision) {
        sim.awaitingReviveDecision = false;
      }
      awaitingReviveRef.current = false;
      setAwaitingRevive(false);
      clockRef.current.setPaused(false);
      setDraftOffers(
        sim.pendingCardOffers.length > 0 && sim.isHeroSafeForCardDraft()
          ? [...sim.pendingCardOffers]
          : []
      );
      syncHudFromSim(sim);
      saveDataRef.current.activeRun = sim.serializeCheckpoint();
      void saveManagerRef.current.flushImmediate();
    },
    [syncHudFromSim]
  );

  const handleRerollFree = useCallback(() => {
    const sim = simRef.current;
    if (!sim || sim.freeRerollUsed) return;
    setDraftOffers([...sim.rerollCardDraft('free')]);
    syncHudFromSim(sim);
    saveDataRef.current.activeRun = sim.serializeCheckpoint();
    void saveManagerRef.current.flushImmediate();
  }, [syncHudFromSim]);

  const handleRerollAd = useCallback(async () => {
    const sim = simRef.current;
    if (!sim || sim.adRerollsUsed >= Simulation.MAX_AD_REROLLS || isAdLoading) return;
    setIsAdLoading(true);
    isAdPlayingRef.current = true;
    audioRef.current.setAdPlaying(true);
    try {
      const earned = await platformRef.current.ads.requestRewardedAd('reward_card_reroll_v1');
      if (earned) {
        saveManagerRef.current.recordAdWatched();
        setDraftOffers([...sim.rerollCardDraft('ad')]);
        saveDataRef.current.activeRun = sim.serializeCheckpoint();
        void saveManagerRef.current.flushImmediate();
      }
    } finally {
      audioRef.current.setAdPlaying(false);
      isAdPlayingRef.current = false;
      setIsAdLoading(false);
    }
  }, [isAdLoading]);

  const handleRerollCoins = useCallback(() => {
    const sim = simRef.current;
    const sd = saveDataRef.current;
    if (!sim || sim.coinRerollsUsed >= Simulation.MAX_COIN_REROLLS || sd.currencies.coins < 40) {
      return;
    }
    sd.currencies.coins -= 40;
    setSaveData({ ...sd });
    setDraftOffers([...sim.rerollCardDraft('coins')]);
    sd.activeRun = sim.serializeCheckpoint();
    void saveManagerRef.current.flushImmediate();
  }, []);

  const handleSkipDraft = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.skipCardDraft();
    if (sim.currentHp > 0 && sim.awaitingReviveDecision) {
      sim.awaitingReviveDecision = false;
    }
    awaitingReviveRef.current = false;
    setAwaitingRevive(false);
    clockRef.current.setPaused(false);
    setDraftOffers(
      sim.pendingCardOffers.length > 0 && sim.isHeroSafeForCardDraft()
        ? [...sim.pendingCardOffers]
        : []
    );
    syncHudFromSim(sim);
  }, [syncHudFromSim]);

  const handleWatchAdRevive = useCallback(async () => {
    const sim = simRef.current;
    if (!sim || isAdLoading) return;
    setIsAdLoading(true);
    isAdPlayingRef.current = true;
    audioRef.current.setAdPlaying(true);
    try {
      const earned = await platformRef.current.ads.requestRewardedAd('reward_revive_run_v1');
      if (earned) {
        saveManagerRef.current.recordAdWatched();
        sim.applyPlayerRevive({ isAdRevive: true });
        awaitingReviveRef.current = false;
        setAwaitingRevive(false);
        setDraftOffers([]);
        clockRef.current.setPaused(false);
        clockRef.current.startResumeCountdown(1.0);
        if (shellStateRef.current !== 'playing') {
          updateShellState('playing');
        }
        syncHudFromSim(sim);
        saveDataRef.current.activeRun = sim.serializeCheckpoint();
        void saveManagerRef.current.flushImmediate();
      }
    } finally {
      audioRef.current.setAdPlaying(false);
      isAdPlayingRef.current = false;
      setIsAdLoading(false);
    }
  }, [isAdLoading, syncHudFromSim, updateShellState]);

  const handleSpendCoinsRevive = useCallback(() => {
    const sim = simRef.current;
    const sd = saveDataRef.current;
    if (!sim || sd.currencies.coins < 150) return;
    setIsAdLoading(false);
    audioRef.current.setAdPlaying(false);
    sd.currencies.coins -= 150;
    setSaveData({ ...sd });
    sim.applyPlayerRevive();
    awaitingReviveRef.current = false;
    setAwaitingRevive(false);
    setDraftOffers([]);
    clockRef.current.setPaused(false);
    clockRef.current.startResumeCountdown(1.0);
    if (shellStateRef.current !== 'playing') {
      updateShellState('playing');
    }
    syncHudFromSim(sim);
    sd.activeRun = sim.serializeCheckpoint();
    void saveManagerRef.current.flushImmediate();
  }, [syncHudFromSim, updateShellState]);

  const handleDeclineRevive = useCallback(() => {
    setIsAdLoading(false);
    audioRef.current.setAdPlaying(false);
    setAwaitingRevive(false);
    clockRef.current.reset();
    simRef.current?.declineReviveAndEndRun();
  }, []);

  const handleWatchDoubleCoinsAd = useCallback(async () => {
    if (!runSummary || runSummary.doubleCoinsClaimed || isAdLoading) return;
    setIsAdLoading(true);
    isAdPlayingRef.current = true;
    audioRef.current.setAdPlaying(true);
    try {
      const earned = await platformRef.current.ads.requestRewardedAd('reward_double_coins_v1');
      if (earned) {
        saveManagerRef.current.recordAdWatched();
        const sd = saveDataRef.current;
        sd.currencies.coins += runSummary.coinsEarned;
        setSaveData({ ...sd });
        setRunSummary({
          ...runSummary,
          coinsEarned: runSummary.coinsEarned * 2,
          doubleCoinsClaimed: true,
        });
        void saveManagerRef.current.flushImmediate();
      }
    } finally {
      audioRef.current.setAdPlaying(false);
      isAdPlayingRef.current = false;
      setIsAdLoading(false);
    }
  }, [isAdLoading, runSummary]);

  const handleReturnToTitleFromSummary = useCallback(() => {
    setRunSummary(null);
    updateShellState('title');
    if (platform.canUse(PlatformFeature.INTERSTITIAL_ADS)) {
      void platformRef.current.ads.requestInterstitialAd();
    }
  }, [updateShellState]);

  const handleSelectLoadout = useCallback(
    (partial: Partial<SaveDataV1['loadout']>) => {
      const sd = saveDataRef.current;
      const newProfessionId = partial.professionId ?? sd.loadout.professionId;
      const personaByProf: Partial<Record<ProfessionId, string>> = {
        ...(sd.loadout.personaByProfession ?? {}),
      };

      let newPersonaId = partial.personaId !== undefined ? partial.personaId : sd.loadout.personaId;

      if (partial.personaId !== undefined) {
        if (partial.personaId === 'adventurer_default') {
          personaByProf[newProfessionId] = 'adventurer_default';
        } else {
          const pDef = PERSONAS.find((p) => p.id === partial.personaId);
          if (pDef) {
            personaByProf[pDef.professionId] = pDef.id;
          }
        }
      } else if (partial.professionId !== undefined && partial.professionId !== sd.loadout.professionId) {
        // Switched profession without explicitly passing personaId:
        // Use this profession's applied persona, or default if none
        newPersonaId = personaByProf[newProfessionId] ?? 'adventurer_default';
      }

      // Guard: personaId must always be related to newProfessionId
      if (newPersonaId && newPersonaId !== 'adventurer_default') {
        if (!isPersonaRelatedToProfession(newPersonaId, newProfessionId)) {
          newPersonaId = personaByProf[newProfessionId] ?? 'adventurer_default';
          if (!isPersonaRelatedToProfession(newPersonaId, newProfessionId)) {
            newPersonaId = 'adventurer_default';
          }
        }
      }

      sd.loadout = {
        ...sd.loadout,
        ...partial,
        professionId: newProfessionId,
        personaId: newPersonaId,
        personaByProfession: personaByProf,
        ...(partial.biomeId !== undefined ? { biomeExplicitlyChosen: true } : {}),
      };
      setSaveData({ ...sd });
      rendererRef.current?.setPreferences({
        reducedMotion: sd.settings.reducedMotion,
        showDamageNumbers: sd.settings.showDamageNumbers,
        bloomIntensity: sd.settings.bloomIntensity,
        biome: sd.loadout.biomeId,
      });
      if (simRef.current) {
        simRef.current.personaId = sd.loadout.personaId;
        simRef.current.professionId = sd.loadout.professionId;
        if (simRef.current.elapsedTicks === 0) {
          simRef.current.equippedTrinkets = [...sd.loadout.trinketIds];
          simRef.current.trinketLevels = { ...sd.unlocks.trinketLevels };
          simRef.current.activeCurses = [...sd.loadout.curseIds];
          simRef.current.curseLevels = { ...sd.unlocks.curseLevels };
          if (simRef.current.equippedTrinkets.includes('clover_charm')) {
            const cloverLv = Math.max(
              1,
              Math.min(3, Math.floor(simRef.current.trinketLevels.clover_charm ?? 1))
            );
            simRef.current.maxFreeRerolls = cloverLv;
            simRef.current.freeRerollsRemaining = cloverLv;
            simRef.current.freeRerollUsed = false;
          } else {
            simRef.current.maxFreeRerolls = 0;
            simRef.current.freeRerollsRemaining = 0;
            simRef.current.freeRerollUsed = true;
          }
        }
      }
      void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
    },
    [refreshYtDiagnostics]
  );

  const handleUnlockProfession = useCallback(
    (profId: ProfessionId, cost: number) => {
      const sd = saveDataRef.current;
      if (sd.currencies.coins < cost) return;
      sd.currencies.coins -= cost;
      if (!sd.unlocks.professions.includes(profId)) {
        sd.unlocks.professions.push(profId);
      }
      sd.loadout.professionId = profId;
      sd.loadout.startingWeaponId = PROFESSIONS[profId]?.startingWeaponId ?? 'garden_blade';
      setSaveData({ ...sd });
      void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
    },
    [refreshYtDiagnostics]
  );

  const handleUnlockTrinket = useCallback(
    (trinketId: string, cost: number) => {
      const sd = saveDataRef.current;
      if (sd.currencies.coins < cost) return;
      sd.currencies.coins -= cost;
      if (!sd.unlocks.trinkets.includes(trinketId)) {
        sd.unlocks.trinkets.push(trinketId);
      }
      sd.unlocks.trinketLevels = {
        ...sd.unlocks.trinketLevels,
        [trinketId]: Math.max(1, sd.unlocks.trinketLevels?.[trinketId] ?? 1),
      };
      setSaveData({ ...sd });
      void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
    },
    [refreshYtDiagnostics]
  );

  const handleUpgradeTrinket = useCallback(
    (trinketId: string) => {
      const sd = saveDataRef.current;
      if (!sd.unlocks.trinkets.includes(trinketId)) return;
      const tDef = TRINKETS.find((t) => t.id === trinketId);
      if (!tDef) return;
      const currentLv = Math.max(1, Math.min(3, Math.floor(sd.unlocks.trinketLevels?.[trinketId] ?? 1)));
      if (currentLv >= 3) return;

      if (currentLv === 1) {
        // Level 2 upgrade costs Coins
        const coinCost = tDef.upgradeCostCoinsLv2;
        if (sd.currencies.coins < coinCost) return;
        sd.currencies.coins -= coinCost;
        sd.unlocks.trinketLevels = {
          ...sd.unlocks.trinketLevels,
          [trinketId]: 2,
        };
      } else if (currentLv === 2) {
        // Level 3 upgrade costs Seeds (gems) instead of Coins
        const seedCost = tDef.upgradeCostSeedsLv3;
        if (sd.currencies.gems < seedCost) return;
        sd.currencies.gems -= seedCost;
        sd.unlocks.trinketLevels = {
          ...sd.unlocks.trinketLevels,
          [trinketId]: 3,
        };
      }
      if (simRef.current) {
        simRef.current.trinketLevels = { ...sd.unlocks.trinketLevels };
        if (
          trinketId === 'clover_charm' &&
          simRef.current.equippedTrinkets.includes('clover_charm')
        ) {
          const nextCloverLv = Math.max(
            1,
            Math.min(3, Math.floor(sd.unlocks.trinketLevels?.clover_charm ?? 1))
          );
          const delta = Math.max(0, nextCloverLv - simRef.current.maxFreeRerolls);
          simRef.current.maxFreeRerolls = nextCloverLv;
          simRef.current.freeRerollsRemaining += delta;
          simRef.current.freeRerollUsed = simRef.current.freeRerollsRemaining <= 0;
        }
      }
      setSaveData({ ...sd });
      void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
    },
    [refreshYtDiagnostics]
  );

  const handleUnlockCurse = useCallback(
    (curseId: string, cost: number) => {
      const sd = saveDataRef.current;
      if (sd.currencies.coins < cost) return;
      sd.currencies.coins -= cost;
      if (!sd.unlocks.curses.includes(curseId)) {
        sd.unlocks.curses.push(curseId);
      }
      sd.unlocks.curseLevels = {
        ...sd.unlocks.curseLevels,
        [curseId]: Math.max(1, sd.unlocks.curseLevels?.[curseId] ?? 1),
      };
      setSaveData({ ...sd });
      void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
    },
    [refreshYtDiagnostics]
  );

  const handleUpgradeCurse = useCallback(
    (curseId: string) => {
      const sd = saveDataRef.current;
      if (!sd.unlocks.curses.includes(curseId)) return;
      const cDef = CURSES.find((c) => c.id === curseId);
      if (!cDef) return;
      const currentLv = Math.max(1, Math.min(3, Math.floor(sd.unlocks.curseLevels?.[curseId] ?? 1)));
      if (currentLv >= 3) return;

      const coinCost = currentLv === 1 ? cDef.upgradeCostCoinsLv2 : cDef.upgradeCostCoinsLv3;
      if (sd.currencies.coins < coinCost) return;
      sd.currencies.coins -= coinCost;
      const nextLv = currentLv + 1;
      sd.unlocks.curseLevels = {
        ...sd.unlocks.curseLevels,
        [curseId]: nextLv,
      };
      if (simRef.current) {
        simRef.current.curseLevels = { ...sd.unlocks.curseLevels };
      }
      setSaveData({ ...sd });
      void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
    },
    [refreshYtDiagnostics]
  );

  const handleWatchPersonaPipAd = useCallback(
    async (personaId: string) => {
      if (isAdLoading) return;
      setIsAdLoading(true);
      isAdPlayingRef.current = true;
      audioRef.current.setAdPlaying(true);
      try {
        const earned = await platformRef.current.ads.requestRewardedAd('reward_persona_pip_v1');
        if (!earned) {
          refreshYtDiagnostics('Ad skipped or unavailable — no Persona pip awarded.');
          return;
        }
        saveManagerRef.current.recordAdWatched();
        const sd = saveDataRef.current;
        const currentPips = (sd.unlocks.personaAdPips[personaId] ?? 0) + 1;
        sd.unlocks.personaAdPips[personaId] = currentPips;
        const pDef = PERSONAS.find((p) => p.id === personaId);
        if (pDef && currentPips >= pDef.adPipsRequired) {
          if (!sd.unlocks.personas.includes(personaId)) {
            sd.unlocks.personas.push(personaId);
          }
          if (!sd.unlocks.professions.includes(pDef.professionId)) {
            sd.unlocks.professions.push(pDef.professionId);
          }
          sd.loadout.personaByProfession = {
            ...(sd.loadout.personaByProfession ?? {}),
            [pDef.professionId]: personaId,
          };
          sd.loadout.personaId = personaId;
          sd.loadout.professionId = pDef.professionId;
          sd.loadout.startingWeaponId =
            PROFESSIONS[pDef.professionId]?.startingWeaponId ?? sd.loadout.startingWeaponId;
          if (simRef.current) {
            simRef.current.personaId = personaId;
            simRef.current.professionId = pDef.professionId;
          }
        }
        setSaveData({ ...sd });
        await saveManagerRef.current.flushImmediate();
        refreshYtDiagnostics(
          `Rewarded Ad completed (${pDef?.name ?? personaId}: ${currentPips}/${pDef?.adPipsRequired ?? 1} watched ads).`
        );
      } finally {
        audioRef.current.setAdPlaying(false);
        isAdPlayingRef.current = false;
        setIsAdLoading(false);
      }
    },
    [isAdLoading, refreshYtDiagnostics]
  );

  const handleBuyPersonaWithSeeds = useCallback(
    async (personaId: string): Promise<boolean> => {
      const pDef = PERSONAS.find((p) => p.id === personaId);
      if (!pDef) return false;
      const cost =
        pDef.unlockCostSeeds > 0 ? pDef.unlockCostSeeds : PERSONA_NO_ADS_COST_SEEDS;
      const sd = saveDataRef.current;
      if (sd.currencies.gems < cost) {
        refreshYtDiagnostics(
          `Need ${cost} Rare Seeds to unlock ${pDef.name} (have ${sd.currencies.gems}).`
        );
        return false;
      }
      sd.currencies.gems -= cost;
      if (!sd.unlocks.personas.includes(personaId)) {
        sd.unlocks.personas.push(personaId);
      }
      if (!sd.unlocks.professions.includes(pDef.professionId)) {
        sd.unlocks.professions.push(pDef.professionId);
      }
      sd.loadout.personaByProfession = {
        ...(sd.loadout.personaByProfession ?? {}),
        [pDef.professionId]: personaId,
      };
      sd.loadout.personaId = personaId;
      sd.loadout.professionId = pDef.professionId;
      sd.loadout.startingWeaponId =
        PROFESSIONS[pDef.professionId]?.startingWeaponId ?? sd.loadout.startingWeaponId;
      if (simRef.current) {
        simRef.current.personaId = personaId;
        simRef.current.professionId = pDef.professionId;
      }
      setSaveData({ ...sd });
      await saveManagerRef.current.flushImmediate();
      refreshYtDiagnostics(
        `Arcana Persona Unlocked: ${pDef.name} for ${cost} Rare Seeds!`
      );
      return true;
    },
    [refreshYtDiagnostics]
  );

  const handleWatchSanctuaryRewardAd = useCallback(async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    isAdPlayingRef.current = true;
    audioRef.current.setAdPlaying(true);
    try {
      const earned = await platformRef.current.ads.requestRewardedAd('reward_sanctuary_grant_v1');
      if (!earned) {
        refreshYtDiagnostics('Ad skipped or unavailable — no Sanctuary reward granted.');
        return;
      }
      const { coinsAdded, gemsAdded } = saveManagerRef.current.claimSanctuaryAdReward(120, 2);
      const sd = saveDataRef.current;
      setSaveData({ ...sd });
      await saveManagerRef.current.flushImmediate();
      refreshYtDiagnostics(
        `Ad Reward Granted: +${coinsAdded} Coins & +${gemsAdded} Rare Seeds saved to player state!`
      );
    } finally {
      audioRef.current.setAdPlaying(false);
      isAdPlayingRef.current = false;
      setIsAdLoading(false);
    }
  }, [isAdLoading, refreshYtDiagnostics]);

  const handleWatchCoinsAd = useCallback(async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    isAdPlayingRef.current = true;
    audioRef.current.setAdPlaying(true);
    try {
      const earned = await platformRef.current.ads.requestRewardedAd('reward_loadout_coins_v1');
      if (earned) {
        saveManagerRef.current.recordAdWatched();
        const sd = saveDataRef.current;
        sd.currencies.coins += 100;
        setSaveData({ ...sd });
        await saveManagerRef.current.flushImmediate();
        refreshYtDiagnostics('Ad Reward Granted: +100 Coins added to your purse!');
      } else {
        refreshYtDiagnostics('Ad skipped or unavailable — no Coins granted.');
      }
    } finally {
      audioRef.current.setAdPlaying(false);
      isAdPlayingRef.current = false;
      setIsAdLoading(false);
    }
  }, [isAdLoading, refreshYtDiagnostics]);

  const handleSavePlayerStateNow = useCallback(async () => {
    const ok = await saveManagerRef.current.flushImmediate();
    const diag = platformRef.current.devStub.getDiagnostics();
    setSaveData({ ...saveDataRef.current });
    refreshYtDiagnostics(
      ok
        ? `Saved player state to YouTube Cloud & LocalStorage (${diag.lastSavedCloudBytes} B).`
        : 'YouTube Cloud offline — player state saved to LocalStorage backup.'
    );
  }, [refreshYtDiagnostics]);

  const handleReloadAndReconcileSave = useCallback(async () => {
    const reconciled = await saveManagerRef.current.loadAndReconcile();
    saveDataRef.current = reconciled;
    setSaveData({ ...reconciled });
    if (simRef.current) {
      simRef.current.personaId = reconciled.loadout.personaId;
      simRef.current.professionId = reconciled.loadout.professionId;
    }
    refreshYtDiagnostics(
      `Reconciled player state from ${saveManagerRef.current.lastSyncSource.toUpperCase()} storage.`
    );
  }, [refreshYtDiagnostics]);

  const handleClaimQuest = useCallback((questId: string) => {
    const sd = saveDataRef.current;
    const q = sd.retention.dailyQuests.find((item) => item.id === questId);
    if (!q || q.claimed || q.progress < q.target) return;
    q.claimed = true;
    sd.currencies.coins += q.rewardCoins;
    sd.currencies.gems += q.rewardGems;
    setSaveData({ ...sd });
    void saveManagerRef.current.flushImmediate();
  }, []);

  // Dev-Only Debug Handlers (no-op if !IS_DEV)
  const handleDebugSetCardLevel = useCallback(
    (cardId: string, level: number) => {
      if (!IS_DEV) return;
      const sim = simRef.current;
      if (!sim) return;
      sim.debugSetCardLevel(cardId, level);
      syncHudFromSim(sim);
      saveDataRef.current.activeRun = sim.serializeCheckpoint();
      void saveManagerRef.current.flushImmediate();
    },
    [syncHudFromSim]
  );

  const handleDebugSetWeaponLevel = useCallback(
    (weaponId: string, level: number, evolved: boolean) => {
      if (!IS_DEV) return;
      const sim = simRef.current;
      if (!sim) return;
      sim.debugSetWeaponLevel(weaponId, level, evolved);
      syncHudFromSim(sim);
      saveDataRef.current.activeRun = sim.serializeCheckpoint();
      void saveManagerRef.current.flushImmediate();
    },
    [syncHudFromSim]
  );

  const handleDebugSpawnPowerUpDrop = useCallback(
    (powerUpId: PowerUpId) => {
      if (!IS_DEV) return;
      const sim = simRef.current;
      if (!sim) return;
      sim.debugSpawnPowerUpDrop(powerUpId);
      syncHudFromSim(sim);
    },
    [syncHudFromSim]
  );

  const handleDebugGivePowerUp = useCallback(
    (powerUpId: PowerUpId) => {
      if (!IS_DEV) return;
      const sim = simRef.current;
      if (!sim) return;
      sim.debugGivePowerUp(powerUpId);
      syncHudFromSim(sim);
      saveDataRef.current.activeRun = sim.serializeCheckpoint();
      void saveManagerRef.current.flushImmediate();
    },
    [syncHudFromSim]
  );

  const handleDebugTriggerPowerUp = useCallback(
    (powerUpId: PowerUpId) => {
      if (!IS_DEV) return;
      const sim = simRef.current;
      if (!sim) return;
      sim.debugTriggerPowerUp(powerUpId);
      syncHudFromSim(sim);
    },
    [syncHudFromSim]
  );

  const handleDebugSpawnArenaFlower = useCallback(() => {
    if (!IS_DEV) return;
    const sim = simRef.current;
    if (!sim) return;
    const angle = sim.heroFacingAngle;
    sim.spawnArenaFlower(
      sim.heroX + Math.cos(angle) * 2.2,
      sim.heroY + Math.sin(angle) * 2.2
    );
    syncHudFromSim(sim);
  }, [syncHudFromSim]);

  const handleDebugSpawnFinalBossArena = useCallback(() => {
    if (!IS_DEV) return;
    const sim = simRef.current;
    if (!sim) return;
    sim.debugSpawnFinalBossArena();
    syncHudFromSim(sim);
  }, [syncHudFromSim]);

  const handleDebugTestHealHero = useCallback(
    (amount: number) => {
      if (!IS_DEV) return;
      const sim = simRef.current;
      if (!sim) return;
      sim.healHero(amount);
      syncHudFromSim(sim);
    },
    [syncHudFromSim]
  );

  const handleDebugResetAllCards = useCallback(() => {
    if (!IS_DEV) return;
    const sim = simRef.current;
    if (!sim) return;
    for (const c of CARDS) {
      sim.debugSetCardLevel(c.id, 0);
    }
    syncHudFromSim(sim);
    saveDataRef.current.activeRun = sim.serializeCheckpoint();
    void saveManagerRef.current.flushImmediate();
  }, [syncHudFromSim]);

  const handleDebugAddGold = useCallback((amount: number) => {
    if (!IS_DEV) return;
    const sd = saveDataRef.current;
    sd.currencies.coins += amount;
    setSaveData({ ...sd });
    void saveManagerRef.current.flushImmediate();
  }, []);

  const handleDebugIncrementPersonaAdPip = useCallback(
    (personaId: string) => {
      if (!IS_DEV) return;
      const sd = saveDataRef.current;
      const currentPips = (sd.unlocks.personaAdPips[personaId] ?? 0) + 1;
      sd.unlocks.personaAdPips[personaId] = currentPips;
      const pDef = PERSONAS.find((p) => p.id === personaId);
      if (pDef && currentPips >= pDef.adPipsRequired) {
        if (!sd.unlocks.personas.includes(personaId)) {
          sd.unlocks.personas.push(personaId);
        }
        if (!sd.unlocks.professions.includes(pDef.professionId)) {
          sd.unlocks.professions.push(pDef.professionId);
        }
        sd.loadout.personaByProfession = {
          ...(sd.loadout.personaByProfession ?? {}),
          [pDef.professionId]: personaId,
        };
        sd.loadout.personaId = personaId;
        sd.loadout.professionId = pDef.professionId;
        sd.loadout.startingWeaponId =
          PROFESSIONS[pDef.professionId]?.startingWeaponId ?? sd.loadout.startingWeaponId;
        if (simRef.current) {
          simRef.current.personaId = personaId;
          simRef.current.professionId = pDef.professionId;
        }
      }
      setSaveData({ ...sd });
      void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
    },
    [refreshYtDiagnostics]
  );

  const handleDebugIncrementAllPersonaAdPips = useCallback(() => {
    if (!IS_DEV) return;
    const sd = saveDataRef.current;
    for (const pDef of PERSONAS) {
      if (pDef.adPipsRequired <= 0) continue;
      const nextPips = (sd.unlocks.personaAdPips[pDef.id] ?? 0) + 1;
      sd.unlocks.personaAdPips[pDef.id] = nextPips;
      if (nextPips >= pDef.adPipsRequired && !sd.unlocks.personas.includes(pDef.id)) {
        sd.unlocks.personas.push(pDef.id);
      }
    }
    setSaveData({ ...sd });
    void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
  }, [refreshYtDiagnostics]);

  const handleDebugSpawnBestiaryEnemy = useCallback(
    (bestiaryKey: string, mode: 'infinite_hp' | 'swarm' | 'respawn_on_death') => {
      if (!IS_DEV) return;
      startNewOrResumedRun(false);
      const sim = simRef.current;
      if (!sim) return;
      const spawned = sim.debugSpawnBestiaryEnemy(bestiaryKey, mode);
      const unitName = spawned[0]?.name ?? bestiaryKey;
      const modeLabel =
        mode === 'infinite_hp'
          ? '∞ Infinite Health'
          : mode === 'swarm'
            ? `Swarm ×${spawned.length}`
            : 'Respawns After Death';
      syncHudFromSim(sim, `BESTIARY SANDBOX · ${unitName} (${modeLabel})`);
    },
    [startNewOrResumedRun, syncHudFromSim]
  );

  const handleSetDevAdOutcomeMode = useCallback(
    (mode: DevStubAdOutcomeMode) => {
      if (!IS_DEV) return;
      platformRef.current.devStub.setAdOutcomeMode(mode);
      refreshYtDiagnostics(`Dev Stub Ad Outcome set to: ${mode.toUpperCase()}`);
    },
    [refreshYtDiagnostics]
  );

  const handleSetDevCloudStorageMode = useCallback(
    (mode: DevStubStorageMode) => {
      if (!IS_DEV) return;
      platformRef.current.devStub.setCloudStorageMode(mode);
      refreshYtDiagnostics(`Dev Stub Cloud Storage set to: ${mode.toUpperCase()}`);
    },
    [refreshYtDiagnostics]
  );

  const handleSimulateYtAudioToggle = useCallback(() => {
    if (!IS_DEV) return;
    const enabled = platformRef.current.devStub.simulateAudioToggle();
    refreshYtDiagnostics(`Simulated ytgame.system.onAudioEnabledChange(${enabled})`);
  }, [refreshYtDiagnostics]);

  const handleSyncScoreNow = useCallback(async () => {
    if (!IS_DEV) return;
    const scoreToSend = Math.max(saveDataRef.current.bestScores.allTime, 1500);
    const ok = await platformRef.current.engagement.sendScore(scoreToSend);
    refreshYtDiagnostics(
      ok
        ? `Sent score ${scoreToSend.toLocaleString()} via ytgame.engagement.sendScore()`
        : 'Score sync failed.'
    );
  }, [refreshYtDiagnostics]);

  const freeRerollsRemaining = simRef.current
    ? Math.max(
        0,
        simRef.current.freeRerollsRemaining ?? (simRef.current.freeRerollUsed ? 0 : 1)
      )
    : 0;
  const maxFreeRerolls = simRef.current
    ? Math.max(freeRerollsRemaining, simRef.current.maxFreeRerolls || 1)
    : 0;
  const freeRerollAvailable = Boolean(
    simRef.current && !simRef.current.freeRerollUsed && freeRerollsRemaining > 0
  );
  const adRerollsRemaining = simRef.current
    ? Math.max(0, Simulation.MAX_AD_REROLLS - simRef.current.adRerollsUsed)
    : Simulation.MAX_AD_REROLLS;
  const coinRerollsRemaining = simRef.current
    ? Math.max(0, Simulation.MAX_COIN_REROLLS - simRef.current.coinRerollsUsed)
    : Simulation.MAX_COIN_REROLLS;
  const canWatchRewardedAd =
    !NO_ADS &&
    saveManagerRef.current.canWatchRewardedAd() &&
    (!platform.activeAdapter || platform.canUse(PlatformFeature.REWARDED_ADS));
  const canAdReroll = Boolean(
    simRef.current && adRerollsRemaining > 0 && canWatchRewardedAd
  );

  const value: GameShellContextValue = {
    canvasContainerRef,
    shellState,
    saveData,
    sanctuaryTab,
    setSanctuaryTab,
    draftOffers,
    awaitingRevive,
    isAdLoading,
    runSummary,
    lastEndedRunRewards,
    userMuted,
    debugMenuOpen,
    ytDiagnostics,
    ytSdkBanner,
    lastSyncSource: saveManagerRef.current.lastSyncSource,
    hud,
    trailingHpRatio,
    rankAura,
    freeRerollAvailable,
    freeRerollsRemaining,
    maxFreeRerolls,
    canAdReroll,
    adRerollsRemaining,
    coinRerollsRemaining,
    canWatchRewardedAd,
    platformProvider: platform.provider,
    isMenuTransitioning,
    startNewOrResumedRun,
    completeMenuTransition,
    updateShellState,
    toggleMute,
    pauseRun,
    resumeRun,
    endRunWithSuddenDeath,
    usePowerUpSlot,
    updateSettings,
    handleSelectCardOffer,
    handleRerollFree,
    handleRerollAd,
    handleRerollCoins,
    handleSkipDraft,
    handleWatchAdRevive,
    handleSpendCoinsRevive,
    handleDeclineRevive,
    handleWatchDoubleCoinsAd,
    handleReturnToTitleFromSummary,
    handleSelectLoadout,
    handleUnlockProfession,
    handleUnlockTrinket,
    handleUpgradeTrinket,
    handleUnlockCurse,
    handleUpgradeCurse,
    handleWatchPersonaPipAd,
    handleBuyPersonaWithSeeds,
    handleWatchSanctuaryRewardAd,
    handleWatchCoinsAd,
    handleSavePlayerStateNow,
    handleReloadAndReconcileSave,
    handleClaimQuest,
    openDebugMenu,
    closeDebugMenu,
    handleDebugSetCardLevel,
    handleDebugSetWeaponLevel,
    handleDebugSpawnPowerUpDrop,
    handleDebugGivePowerUp,
    handleDebugTriggerPowerUp,
    handleDebugSpawnArenaFlower,
    handleDebugSpawnFinalBossArena,
    handleDebugTestHealHero,
    handleDebugResetAllCards,
    handleDebugAddGold,
    handleDebugIncrementPersonaAdPip,
    handleDebugIncrementAllPersonaAdPips,
    handleDebugSpawnBestiaryEnemy,
    handleSetDevAdOutcomeMode,
    handleSetDevCloudStorageMode,
    handleSimulateYtAudioToggle,
    handleSyncScoreNow,
  };

  return <GameShellContext.Provider value={value}>{children}</GameShellContext.Provider>;
}
