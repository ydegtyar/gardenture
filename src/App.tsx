/**
 * Gardenture: Mystic Garden Roguelite
 * Layer 7 (app): Main Game Shell wiring PixiJS v8 View, 60Hz Deterministic Simulation,
 * Floating Joystick / Flick-Dash Input, Procedural WebAudio, and YouTube Playables SDK v1 Ports.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { hashStringToSeed } from './core/rng/rng';
import { FixedClock } from './core/time/clock';
import {
  CARDS,
  PERSONAS,
  POWER_UPS,
  PROFESSIONS,
  STYLE_RANKS,
  THEME_PACKS,
  WEAPONS,
} from './content/data/catalog';
import type { PowerUpId, ProfessionId } from './content/schema/types';
import { Simulation } from './sim/Simulation';
import type { DraftOfferItem } from './sim/systems/cardDraft';
import { InputManager } from './input/InputManager';
import { createPlatformFacade } from './platform/Adapters';
import {
  SaveManager,
  createDefaultSaveData,
  getCurrentUtcDateKey,
  updateDailyRunStreak,
  type SaveDataV1,
} from './meta/SaveManager';
import { GameAudioMixer } from './platform/audio/GameAudioMixer';
import { PixiGameRenderer } from './view/PixiRenderer';
import {
  CoinIcon,
  HeartSocketIcon,
  MuteSvgIcon,
  PauseSvgIcon,
  PowerUpAbilityIcon,
  RestartSvgIcon,
  SeedGemIcon,
  TitleLockupSvg,
} from './app/SvgIcons';
import {
  CardDraftModal,
  DebugCardModal,
  LoadoutAndStoreModal,
  PauseModal,
  RescueReviveModal,
  RunSummaryModal,
  type RunSummarySnapshot,
} from './app/Modals';

type ShellState = 'title' | 'playing' | 'paused' | 'gameover';

interface HudTelemetry {
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
  heldPowerUps: PowerUpId[];
  weapons: Array<{ id: string; level: number; evolved: boolean }>;
  ownedCards: Record<string, number>;
  activeAlert: string | null;
  isOutsideArena?: boolean;
}

export default function App() {
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

  const [saveData, setSaveData] = useState<SaveDataV1>(() => createDefaultSaveData());
  const saveDataRef = useRef<SaveDataV1>(saveData);

  const [sanctuaryTab, setSanctuaryTab] = useState<'loadout' | 'store' | 'quests' | null>(null);
  const [draftOffers, setDraftOffers] = useState<DraftOfferItem[]>([]);
  const [awaitingRevive, setAwaitingRevive] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [runSummary, setRunSummary] = useState<RunSummarySnapshot | null>(null);
  const [lastEndedRunRewards, setLastEndedRunRewards] = useState<{
    coinsEarned: number;
    gemsEarned: number;
    score: number;
    kills: number;
    elapsedSeconds: number;
  } | null>(null);
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
    inputRef.current.clearAllIntents();
    debugMenuOpenRef.current = true;
    setDebugMenuOpen(true);
  }, []);

  const closeDebugMenu = useCallback(() => {
    debugMenuOpenRef.current = false;
    setDebugMenuOpen(false);
    clockRef.current.reset();
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
    weapons: [{ id: 'garden_blade', level: 1, evolved: false }],
    ownedCards: {},
    activeAlert: null,
  });

  // Trailing damage bar state for visual polish
  const [trailingHpRatio, setTrailingHpRatio] = useState(1);

  // Style Rank increase aura effect state
  const [rankAura, setRankAura] = useState<{
    active: boolean;
    colorHex: string;
    letter: string;
    key: number;
  } | null>(null);
  const rankAuraTimeoutRef = useRef<number | null>(null);

  const updateShellState = useCallback((next: ShellState) => {
    shellStateRef.current = next;
    setShellState(next);
    document.body.dataset.state = next;
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
        sim.dashCharges > 0
          ? 1
          : 1 - sim.dashCooldownTimer / Math.max(0.5, sim.stats.dashCooldown),
      isDashInvisible: sim.dashIframeTimer > 0 || sim.dashTimer > 0,
      heldPowerUps: [...sim.heldPowerUps],
      weapons: sim.weapons.map((w) => ({ id: w.id, level: w.level, evolved: w.evolved })),
      ownedCards: { ...sim.cards },
      activeAlert: alertBanner !== undefined ? alertBanner : prev.activeAlert,
      isOutsideArena: sim.isOutsideArena,
    }));
  }, []);

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
        audioRef.current.playHit(ev.isCrit);
        rendererRef.current?.spawnFloatingDamage(ev.x, ev.y, ev.damage, ev.isCrit);
        if (ev.isCrit) {
          clockRef.current.triggerHitstop(38); // Spec Section 14: 40ms crit hit-stop
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
          clockRef.current.triggerHitstop(55); // Spec Section 14: 60ms hero hit-stop
          rendererRef.current?.addTrauma(0.38);
          rendererRef.current?.spawnParticleBurst(ev.x, ev.y, 0xffaaa6, 12);
        }
        syncHudFromSim(sim);
      });

      sim.events.on('HeroDashed', () => {
        audioRef.current.playDash();
        rendererRef.current?.addTrauma(0.1);
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
          true,
          ev.text,
          ev.color
        );
      });

      sim.events.on('LevelUp', () => {
        audioRef.current.playLevelUpOrRankUp(false);
        inputRef.current.clearAllIntents();
        setDraftOffers([...sim.pendingCardOffers]);
        syncHudFromSim(sim);
        // Save mid-run checkpoint on level-up
        const sd = saveDataRef.current;
        sd.activeRun = sim.serializeCheckpoint();
        void saveManagerRef.current.flushImmediate();
      });

      sim.events.on('StyleRankChanged', (ev) => {
        audioRef.current.setStyleRankIndex(ev.newRankIndex);
        if (ev.rankedUp) {
          audioRef.current.playLevelUpOrRankUp(true);
          if (rankAuraTimeoutRef.current) {
            window.clearTimeout(rankAuraTimeoutRef.current);
          }
          const rankDef = STYLE_RANKS[ev.newRankIndex] || STYLE_RANKS[0];
          setRankAura({
            active: true,
            colorHex: rankDef.colorHex,
            letter: rankDef.letter,
            key: Date.now(),
          });
          rankAuraTimeoutRef.current = window.setTimeout(() => {
            setRankAura((prev) => (prev ? { ...prev, active: false } : null));
          }, 950);
        }
        syncHudFromSim(sim);
      });

      sim.events.on('SpecialMonsterSpawned', (ev) => {
        syncHudFromSim(sim, `Special Target Sighted: ${ev.name}!`);
        setTimeout(() => {
          setHud((prev) =>
            prev.activeAlert?.includes(ev.name) ? { ...prev, activeAlert: null } : prev
          );
        }, 4000);
      });

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
          setAwaitingRevive(true);
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

        // Update consecutive daily run streak
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

        // Update Daily Quests progress
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

      const sim = new Simulation({
        seed,
        isDailySeed: sd.loadout.isDailySeedMode,
        dailyDateKey: sd.loadout.isDailySeedMode ? todayKey : null,
        difficultyTier: sd.unlocks.maxDifficultyTierByBiome[sd.loadout.biomeId] ?? 1,
        personaId: sd.loadout.personaId,
        professionId: sd.loadout.professionId,
        startingWeaponId: sd.loadout.startingWeaponId,
        equippedTrinkets: sd.loadout.trinketIds,
        activeCurses: sd.loadout.curseIds,
        unlockedWeapons: sd.unlocks.weapons,
      });
      attachSimListeners(sim);
      return sim;
    },
    [attachSimListeners]
  );

  const startNewOrResumedRun = useCallback(
    (resumeExisting = false) => {
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
        sim = createFreshSimulation(sd);
      }

      simRef.current = sim;
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
      rendererRef.current?.setPreferences({
        reducedMotion: sd.settings.reducedMotion,
        showDamageNumbers: sd.settings.showDamageNumbers,
        bloomIntensity: sd.settings.bloomIntensity,
        biome: sd.loadout.biomeId,
      });

      syncHudFromSim(sim, null);
      updateShellState('playing');
    },
    [attachSimListeners, createFreshSimulation, syncHudFromSim, updateShellState]
  );

  // Boot PixiJS v8, Platform Lifecycle, Input & 60Hz Loop ONCE on mount
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const platform = platformRef.current;
    const renderer = new PixiGameRenderer();
    rendererRef.current = renderer;

    // Create initial ambient simulation for Title Screen backdrop
    const initialSim = createFreshSimulation(saveDataRef.current);
    simRef.current = initialSim;

    let animFrameId = 0;
    let lastTimeMs = performance.now();
    let hudSyncCounter = 0;

    // Register YouTube Playables Pause / Resume & Audio Mute hooks [F]
    platform.lifecycle.registerHandlers({
      onPause: () => {
        inputRef.current.clearAllIntents();
        audioRef.current.onPlatformPause();
        if (shellStateRef.current === 'playing' && simRef.current) {
          saveDataRef.current.activeRun = simRef.current.serializeCheckpoint();
          void saveManagerRef.current.flushImmediate();
          updateShellState('paused');
        }
      },
      onResume: () => {
        audioRef.current.onPlatformResume(platform.audio.isAudioEnabled());
      },
    });

    platform.audio.onMuteChange((enabled) => {
      audioRef.current.setPlatformAudioEnabled(enabled);
    });

    const detachInput = inputRef.current.attach(container);

    // Boot async sequence
    void (async () => {
      await renderer.init(container);
      // 1. Signal First Frame Ready to YouTube Playables [F]
      platform.lifecycle.notifyFirstFrameReady();

      // 2. Load and reconcile SaveDataV1
      const loadedSave = await saveManagerRef.current.loadAndReconcile();
      saveDataRef.current = loadedSave;
      setSaveData({ ...loadedSave });
      audioRef.current.setPlatformAudioEnabled(platform.audio.isAudioEnabled());
      audioRef.current.setVolumes(loadedSave.settings.musicVolume, loadedSave.settings.sfxVolume);
      inputRef.current.setJoystickScale(loadedSave.settings.joystickSizeScale);
      renderer.setPreferences({
        reducedMotion: loadedSave.settings.reducedMotion,
        showDamageNumbers: loadedSave.settings.showDamageNumbers,
        bloomIntensity: loadedSave.settings.bloomIntensity,
        biome: loadedSave.loadout.biomeId,
      });

      // 3. Signal Game Ready [F]
      platform.lifecycle.notifyGameReady();
      refreshYtDiagnostics();

      // Support ?autostart=1 (and optional ?autodraft=1 / ?biome=...) to jump directly to 'playing' / CardDraftModal
      const params = new URLSearchParams(window.location.search);
      const biomeParam = params.get('biome');
      if (
        biomeParam === 'garden' ||
        biomeParam === 'dungeon' ||
        biomeParam === 'sakura_grove' ||
        biomeParam === 'sunlit_oasis'
      ) {
        loadedSave.loadout.biomeId = biomeParam;
        saveDataRef.current = loadedSave;
        setSaveData({ ...loadedSave });
        renderer.setPreferences({
          reducedMotion: loadedSave.settings.reducedMotion,
          showDamageNumbers: loadedSave.settings.showDamageNumbers,
          bloomIntensity: loadedSave.settings.bloomIntensity,
          biome: biomeParam,
        });
      }
      if (params.get('autostart') === '1') {
        startNewOrResumedRun(false);
        if (params.get('autodraft') === '1' && simRef.current) {
          simRef.current.triggerLevelUpCardDraft();
        }
      }
    })();

    const loop = (nowMs: number) => {
      const rawDtMs = nowMs - lastTimeMs;
      lastTimeMs = nowMs;
      const dtSec = Math.min(0.05, Math.max(0.001, rawDtMs / 1000));

      const sim = simRef.current;
      const state = shellStateRef.current;

      if (sim) {
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
          // Title / Paused / Gameover: keep rendering canvas smoothly without advancing combat
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
            isTitleMode: state === 'title',
          });
        }
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
  }, [createFreshSimulation, startNewOrResumedRun, syncHudFromSim, updateShellState]);

  // Smoothly decay trailing HP ghost bar toward actual HP ratio
  useEffect(() => {
    const targetRatio = hud.hp / Math.max(1, hud.maxHp);
    const timer = window.setTimeout(() => {
      setTrailingHpRatio(targetRatio);
    }, 260);
    return () => clearTimeout(timer);
  }, [hud.hp, hud.maxHp]);

  // Wire Input Callbacks (Dash & Keyboard Shortcuts: Enter/Space on Title, 1/2/3 Cards, Q/E Power-ups, P/Esc Pause, M Mute, R Restart)
  useEffect(() => {
    inputRef.current.setCallbacks({
      onDash: (angle) => {
        if (shellStateRef.current === 'title' && sanctuaryTab === null) {
          startNewOrResumedRun(false);
          return;
        }
        if (shellStateRef.current === 'playing' && simRef.current) {
          simRef.current.requestDash(angle);
        }
      },
      onKeyShortcut: (code) => {
        const state = shellStateRef.current;
        const sim = simRef.current;

        if (state === 'title' && sanctuaryTab === null && code === 'Enter') {
          startNewOrResumedRun(false);
          return;
        }

        if (code === 'KeyM') {
          const nextMute = !audioRef.current.isUserMuted();
          audioRef.current.setUserMuted(nextMute);
          setUserMuted(nextMute);
          return;
        }

        if (code === 'KeyR' && (state === 'playing' || state === 'paused' || state === 'gameover')) {
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

        if (state === 'playing' && sim) {
          if (draftOffers.length > 0) {
            if (code === 'Digit1' && draftOffers[0]) {
              sim.applyCardOffer(draftOffers[0].offerId);
              setDraftOffers([]);
              syncHudFromSim(sim);
            } else if (code === 'Digit2' && draftOffers[1]) {
              sim.applyCardOffer(draftOffers[1].offerId);
              setDraftOffers([]);
              syncHudFromSim(sim);
            } else if (code === 'Digit3' && draftOffers[2]) {
              sim.applyCardOffer(draftOffers[2].offerId);
              setDraftOffers([]);
              syncHudFromSim(sim);
            }
          } else {
            if (code === 'KeyQ') sim.requestUsePowerUp(0);
            if (code === 'KeyE') sim.requestUsePowerUp(1);
          }
        }
      },
    });
  }, [awaitingRevive, draftOffers, sanctuaryTab, startNewOrResumedRun, syncHudFromSim, updateShellState]);

  // Handlers for Card Draft, Revive, Store & Settings
  const handleSelectCardOffer = (offerId: string) => {
    const sim = simRef.current;
    if (!sim) return;
    sim.applyCardOffer(offerId);
    setDraftOffers([]);
    syncHudFromSim(sim);
    saveDataRef.current.activeRun = sim.serializeCheckpoint();
    void saveManagerRef.current.flushImmediate();
  };

  const handleRerollFree = () => {
    const sim = simRef.current;
    if (!sim) return;
    setDraftOffers([...sim.rerollCardDraft(true)]);
  };

  const handleRerollAd = async () => {
    const sim = simRef.current;
    if (!sim) return;
    setIsAdLoading(true);
    audioRef.current.setAdPlaying(true);
    const earned = await platformRef.current.ads.requestRewardedAd('reward_card_reroll_v1');
    audioRef.current.setAdPlaying(false);
    setIsAdLoading(false);
    if (earned) {
      saveManagerRef.current.recordAdWatched();
      setDraftOffers([...sim.rerollCardDraft(false)]);
      void saveManagerRef.current.flushImmediate();
    }
  };

  const handleRerollCoins = () => {
    const sim = simRef.current;
    const sd = saveDataRef.current;
    if (!sim || sd.currencies.coins < 40) return;
    sd.currencies.coins -= 40;
    setSaveData({ ...sd });
    setDraftOffers([...sim.rerollCardDraft(false)]);
    void saveManagerRef.current.flushImmediate();
  };

  const handleSkipDraft = () => {
    const sim = simRef.current;
    if (!sim) return;
    sim.skipCardDraft();
    setDraftOffers([]);
    syncHudFromSim(sim);
  };

  const handleWatchAdRevive = async () => {
    const sim = simRef.current;
    if (!sim) return;
    setIsAdLoading(true);
    audioRef.current.setAdPlaying(true);
    const earned = await platformRef.current.ads.requestRewardedAd('reward_revive_run_v1');
    audioRef.current.setAdPlaying(false);
    setIsAdLoading(false);
    if (earned) {
      saveManagerRef.current.recordAdWatched();
      sim.applyPlayerRevive();
      setAwaitingRevive(false);
      clockRef.current.startResumeCountdown(1.0); // 1.0s visible re-orientation countdown ring [F]
      syncHudFromSim(sim);
      saveDataRef.current.activeRun = sim.serializeCheckpoint();
      void saveManagerRef.current.flushImmediate();
    }
  };

  const handleSpendCoinsRevive = () => {
    const sim = simRef.current;
    const sd = saveDataRef.current;
    if (!sim || sd.currencies.coins < 150) return;
    sd.currencies.coins -= 150;
    setSaveData({ ...sd });
    sim.applyPlayerRevive();
    setAwaitingRevive(false);
    clockRef.current.startResumeCountdown(1.0);
    syncHudFromSim(sim);
    sd.activeRun = sim.serializeCheckpoint();
    void saveManagerRef.current.flushImmediate();
  };

  const handleWatchDoubleCoinsAd = async () => {
    if (!runSummary || runSummary.doubleCoinsClaimed) return;
    setIsAdLoading(true);
    audioRef.current.setAdPlaying(true);
    const earned = await platformRef.current.ads.requestRewardedAd('reward_double_coins_v1');
    audioRef.current.setAdPlaying(false);
    setIsAdLoading(false);
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
  };

  const currentRankDef = STYLE_RANKS[hud.rankIndex] ?? STYLE_RANKS[0]!;
  const hpRatio = Math.max(0, Math.min(1, hud.hp / Math.max(1, hud.maxHp)));
  const xpRatio = Math.max(0, Math.min(1, hud.xp / Math.max(1, hud.xpToNext)));
  const runMins = Math.floor(hud.elapsedSec / 60);
  const runSecs = hud.elapsedSec % 60;
  const clockText = `${runMins}:${runSecs.toString().padStart(2, '0')}`;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#18241E] select-none">
      {/* Isolated PixiJS v8 WebGL Canvas Mount */}
      <div
        ref={canvasContainerRef}
        data-testid="game-canvas-container"
        className="absolute inset-0 w-full h-full"
      />

      {/* =====================================================================
          STATE 1: TITLE SCREEN (Atmospheric Live World Tour + Bespoke SVG Lockup)
          ===================================================================== */}
      {shellState === 'title' && (
        <main className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-10 pointer-events-none bg-gradient-to-t from-[#140E16]/85 via-[#140E16]/35 to-[#140E16]/65">
          {/* Top-Right Currency & Best Score Cluster */}
          <div className="flex items-center justify-between gap-4 pointer-events-auto">
            <div className="px-3.5 py-2 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] text-xs font-semibold text-[#FFFDF0] flex items-center gap-3 shadow-lg">
              <span>
                Active: <strong className="text-[#A8E6CF]">{PROFESSIONS[saveData.loadout.professionId]?.name}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>{THEME_PACKS[saveData.loadout.biomeId].name}</span>
              {saveData.bestScores.allTime > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular text-[#FDFFB6]">
                    Best: {saveData.bestScores.allTime.toLocaleString()}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] font-mono-tabular text-sm font-bold shadow-lg">
              <span className="flex items-center gap-1.5 text-[#FDFFB6]">
                <CoinIcon />
                {saveData.currencies.coins}
              </span>
              <span className="flex items-center gap-1.5 text-[#DED2F9]">
                <SeedGemIcon />
                {saveData.currencies.gems}
              </span>
            </div>
          </div>

          {/* Center-Left / Center Hero Lockup over Calm Negative Space */}
          <div className="my-auto mx-auto w-full max-w-lg flex flex-col items-center text-center pointer-events-auto">
            <TitleLockupSvg className="w-full max-w-md mb-4 drop-shadow-xl" />

            <p
              className="text-sm md:text-base text-[#FFFDF0]/90 font-medium max-w-md mb-6"
              style={{ textWrap: 'balance' }}
            >
              Drag to glide through the mystic garden, flick to dash through telegraphed swarms, draft 30 botanical synergies, and climb to Style Rank SSS.
            </p>

            {lastEndedRunRewards && (
              <div
                data-testid="last-run-rewards-banner"
                className="w-full max-w-md mb-3 px-4 py-2.5 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#A8E6CF] text-xs font-bold text-[#FFFDF0] shadow-lg flex items-center justify-between gap-2"
              >
                <span className="text-[#A8E6CF] uppercase tracking-wider">Run Ended · Rewards</span>
                <span className="font-mono-tabular text-[#FDFFB6] flex items-center gap-2">
                  <span>+{lastEndedRunRewards.coinsEarned} Coins</span>
                  <span>·</span>
                  <span className="text-[#DED2F9]">+{lastEndedRunRewards.gemsEarned} Seeds</span>
                  <span>·</span>
                  <span>{lastEndedRunRewards.score.toLocaleString()} PTS</span>
                </span>
              </div>
            )}

            {/* Primary Start CTA + Optional Mid-Run Eviction Resume */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-3">
              <button
                type="button"
                data-start="true"
                onClick={() => startNewOrResumedRun(false)}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#A8E6CF] text-[#2D1E2F] font-display font-black text-lg border-4 border-[#2D1E2F] shadow-xl hover:bg-[#88D49E] active:translate-y-0.5 transition-all whitespace-nowrap"
              >
                Start Run
              </button>

              {saveData.activeRun && (
                <button
                  type="button"
                  onClick={() => startNewOrResumedRun(true)}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-[#FDFFB6] text-[#2D1E2F] font-bold text-sm border-4 border-[#2D1E2F] shadow-xl hover:bg-[#fbbf24] transition-all whitespace-nowrap"
                >
                  Resume Run (Lv {saveData.activeRun.level})
                </button>
              )}
            </div>

            {/* Secondary Sanctuary Actions (<= 3 total menu actions) */}
            <div className="flex items-center justify-center gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={() => setSanctuaryTab('loadout')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2B1F2D]/95 text-[#FFFDF0] font-bold text-xs border-2 border-[#2D1E2F] hover:border-[#A8E6CF] transition-colors whitespace-nowrap"
              >
                Loadout & Professions
              </button>
              <button
                type="button"
                onClick={() => setSanctuaryTab('store')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2B1F2D]/95 text-[#FDFFB6] font-bold text-xs border-2 border-[#2D1E2F] hover:border-[#FDFFB6] transition-colors whitespace-nowrap"
              >
                Relic Store & Quests
              </button>
            </div>
          </div>

          {/* Single Flat Borderless Control-Hint Line in Bottom Safe Margin */}
          <div className="text-center text-xs font-medium text-[#FFFDF0]/80 tracking-wide">
            Drag / WASD Move · Flick / Space Dash · Q / E Power-Up · P / Esc Pause
          </div>
        </main>
      )}

      {/* =====================================================================
          STATE 2: PLAYING HUD (World-Matched Botanical Perimeter, >85% Clear)
          ===================================================================== */}
      {shellState !== 'title' && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 md:p-5">
          {/* TOP PERIMETER ROW: 3 Compact Corner Clusters */}
          <div className="flex items-start justify-between gap-1.5 sm:gap-3 w-full">
            {/* Cluster 1 (Top-Left): Vitality Bar, Trailing Damage Bar, Level & Dash Charges */}
            <div className="w-36 sm:w-60 p-2 sm:p-2.5 rounded-xl bg-[#2B1F2D]/92 border-2 border-[#2D1E2F] shadow-md shrink-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1">
                  <HeartSocketIcon
                    state={hpRatio > 0.5 ? 'full' : hpRatio > 0.25 ? 'damaged' : 'empty'}
                  />
                  <span className="hidden sm:inline text-[10px] font-extrabold tracking-wider text-[#FFAAA6]">
                    VITALITY
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-mono-tabular font-bold text-[#FFFDF0] whitespace-nowrap">
                  {hud.hp}/{hud.maxHp}
                  {hud.shieldHp > 0 ? ` +${hud.shieldHp}` : ''}
                </span>
              </div>

              {/* Health Bar with Delayed Trailing Damage Ghost Bar */}
              <div className="relative h-2.5 sm:h-3 w-full rounded-full bg-[#18111A] border border-[#2D1E2F] overflow-hidden mb-1.5">
                <div
                  className="absolute inset-y-0 left-0 bg-[#FFD3B6]/60 transition-all duration-300"
                  style={{ width: `${Math.round(trailingHpRatio * 100)}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-[#88D49E] transition-all duration-75"
                  style={{
                    width: `${Math.round(hpRatio * 100)}%`,
                    backgroundColor: hpRatio <= 0.3 ? '#F43F5E' : '#88D49E',
                  }}
                />
              </div>

              {/* Level, XP Progress & Dash Charge Pips */}
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#A8E6CF] mb-1 whitespace-nowrap">
                <span>LV {hud.level}</span>
                <span
                  className={`font-mono-tabular ${
                    hud.isDashInvisible ? 'text-[#A0C4FF]' : ''
                  }`}
                >
                  {hud.isDashInvisible
                    ? 'I-FRAME'
                    : `DASH ${hud.dashCharges}/${hud.maxDashCharges}`}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#18111A] overflow-hidden">
                <div
                  className="h-full bg-[#FDFFB6] transition-all duration-100"
                  style={{ width: `${Math.round(xpRatio * 100)}%` }}
                />
              </div>
            </div>

            {/* Cluster 2 (Top-Center): Devil May Cry Style Rank Badge & Decaying SP Bar with Rank-Up Aura */}
            <div className="relative flex flex-col items-center shrink-0">
              {/* Temporary Rank-Up Aura Halo */}
              {rankAura?.active && (
                <div
                  key={rankAura.key}
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-1 sm:-inset-1.5 rounded-2xl animate-rank-aura-glow z-0"
                  style={
                    {
                      '--rank-aura-color': rankAura.colorHex,
                    } as React.CSSProperties
                  }
                >
                  {/* Expanding shockwave perimeter ring */}
                  <div
                    className="absolute -inset-1 sm:-inset-1.5 rounded-2xl border-2 animate-rank-aura-ring"
                    style={{ borderColor: rankAura.colorHex }}
                  />
                  {/* Subtle radiant botanical glint sparks */}
                  <div
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-rank-aura-spark"
                    style={{ boxShadow: `0 0 8px 2px ${rankAura.colorHex}` }}
                  />
                  <div
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-rank-aura-spark"
                    style={{ boxShadow: `0 0 8px 2px ${rankAura.colorHex}` }}
                  />
                </div>
              )}

              <div
                className={`relative flex flex-col items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#2B1F2D]/92 border-2 shadow-md shrink-0 transition-all duration-300 z-10 ${
                  rankAura?.active ? 'border-[#FDFFB6]' : 'border-[#2D1E2F]'
                }`}
                style={{
                  boxShadow: rankAura?.active
                    ? `0 0 22px 3px ${rankAura.colorHex}66, 0 4px 6px -1px rgba(0, 0, 0, 0.4)`
                    : undefined,
                }}
              >
                <div className="flex items-baseline gap-1 sm:gap-2 whitespace-nowrap">
                  <span className="hidden sm:inline text-[10px] font-extrabold tracking-wider text-[#FFFDF0]/75">
                    STYLE
                  </span>
                  <span
                    key={rankAura?.active ? `rank-${rankAura.key}` : 'rank-static'}
                    className={`text-xl sm:text-3xl font-display font-black leading-none stroke-plum ${
                      rankAura?.active ? 'animate-rank-letter-pop' : ''
                    }`}
                    style={{ color: currentRankDef.colorHex }}
                  >
                    {currentRankDef.letter}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono-tabular font-bold text-[#FDFFB6]">
                    ×{currentRankDef.scoreMult.toFixed(1)}
                  </span>
                </div>
                <div className="w-16 sm:w-28 h-2 rounded-full bg-[#18111A] border border-[#2D1E2F] overflow-hidden mt-1">
                  <div
                    className="h-full transition-all duration-75"
                    style={{
                      width: `${hud.stylePoints}%`,
                      backgroundColor:
                        hud.stylePoints < 15 ? '#F43F5E' : currentRankDef.colorHex,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Cluster 3 (Top-Right): Run Clock, Score, and Square <svg> Utility Buttons [M] [P] [R] */}
            <div className="flex flex-col sm:flex-row items-end sm:items-start gap-1.5 sm:gap-2 shrink-0">
              <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#2B1F2D]/92 border-2 border-[#2D1E2F] text-right shadow-md whitespace-nowrap">
                <div className="text-sm sm:text-lg font-mono-tabular font-bold text-[#FFFDF0] leading-tight">
                  {clockText}
                </div>
                <div className="text-[10px] sm:text-[11px] font-mono-tabular text-[#FDFFB6]">
                  {hud.score.toLocaleString()} PTS
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={userMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    const next = !audioRef.current.isUserMuted();
                    audioRef.current.setUserMuted(next);
                    setUserMuted(next);
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] flex items-center justify-center hover:border-[#A8E6CF] transition-colors shrink-0"
                >
                  <MuteSvgIcon muted={userMuted} />
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Pause Game [P]"
                  onClick={(e) => {
                    e.currentTarget.blur();
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
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] flex items-center justify-center hover:border-[#FDFFB6] transition-colors shrink-0"
                >
                  <PauseSvgIcon />
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="open-debug-cards-btn"
                  aria-label="Open Debug Card Menu"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    openDebugMenu();
                  }}
                  className="px-2.5 h-8 sm:h-10 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#FDFFB6]/70 text-[#FDFFB6] font-bold text-xs flex items-center justify-center hover:bg-[#3B2B3E] hover:border-[#FDFFB6] transition-colors whitespace-nowrap shrink-0"
                >
                  Debug
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Restart Run [R]"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    startNewOrResumedRun(false);
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] flex items-center justify-center hover:border-[#A8E6CF] transition-colors shrink-0"
                >
                  <RestartSvgIcon />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM PERIMETER STACK: Special Enemy / Boss Alert Banner at Bottom + Equipped Weapon & Power-Up Row */}
          <div className="flex flex-col items-center gap-2 w-full">
            {hud.isOutsideArena ? (
              <div
                data-testid="bottom-alert-banner"
                className="mx-auto px-4 py-1.5 rounded-xl bg-[#3B1622]/95 border-2 border-[#F43F5E] text-xs font-extrabold text-[#FFAAA6] shadow-lg whitespace-nowrap animate-pulse"
              >
                OUTSIDE THORN ARENA · TAKING BRIAR BLEED DPS!
              </div>
            ) : hud.activeAlert ? (
              <div
                data-testid="bottom-alert-banner"
                className="mx-auto px-4 py-1.5 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#FDFFB6] text-xs font-bold text-[#FDFFB6] shadow-lg whitespace-nowrap"
              >
                {hud.activeAlert}
              </div>
            ) : null}

            <div className="flex items-end justify-between gap-2 w-full">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2B1F2D]/90 border-2 border-[#2D1E2F] text-[11px] sm:text-xs font-semibold text-[#FFFDF0] whitespace-nowrap overflow-hidden max-w-[54vw] sm:max-w-none">
                {hud.weapons.map((w, idx) => {
                  const def = WEAPONS[w.id];
                  return (
                    <React.Fragment key={w.id}>
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <span className={`truncate ${w.evolved ? 'text-[#FDFFB6] font-bold' : ''}`}>
                        {w.evolved ? def?.evolvedName : def?.name}{' '}
                        <span className="font-mono-tabular text-[#A8E6CF]">Lv{w.level}</span>
                      </span>
                    </React.Fragment>
                  );
                })}
                {Object.keys(hud.ownedCards).length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#FDFFB6] font-mono-tabular">
                      {Object.entries(hud.ownedCards)
                        .slice(0, 3)
                        .map(([cid, lv]) => {
                          const cDef = CARDS.find((c) => c.id === cid);
                          if (cDef?.evolvedName && lv > cDef.maxLevel) {
                            return `${cDef.evolvedName} (Evo)`;
                          }
                          return `${cDef?.name ?? cid} Lv${lv}`;
                        })
                        .join(' · ')}
                      {Object.keys(hud.ownedCards).length > 3
                        ? ` +${Object.keys(hud.ownedCards).length - 3}`
                        : ''}
                    </span>
                  </>
                )}
              </div>

              {/* Held One-Time Power-Up Slots [Q] and [E] */}
              <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
                {[0, 1].map((slotIdx) => {
                  const pId = hud.heldPowerUps[slotIdx];
                  const pDef = pId ? POWER_UPS[pId] : null;
                  const keyBind = slotIdx === 0 ? 'Q' : 'E';
                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      data-testid={`hud-powerup-slot-${slotIdx}`}
                      disabled={!pDef}
                      aria-label={
                        pDef ? `Use ${pDef.name} [${keyBind}]` : `Empty Power-Up Slot [${keyBind}]`
                      }
                      onClick={(e) => {
                        e.currentTarget.blur();
                        simRef.current?.requestUsePowerUp(slotIdx);
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 border-[#2D1E2F] text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap shrink-0 ${
                        pDef
                          ? 'bg-[#2B1F2D] text-[#FFFDF0] shadow-md hover:border-[#FDFFB6]'
                          : 'bg-[#2B1F2D]/60 text-[#FFFDF0]/40'
                      }`}
                    >
                      <span className="font-mono-tabular text-[#A8E6CF]">[{keyBind}]</span>
                      {pDef && <PowerUpAbilityIcon powerUpId={pDef.id} className="w-5 h-5" />}
                      <span>{pDef ? pDef.name : 'Empty'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODALS: Card Draft, Rescue Revive, Pause, Outcome Summary & Sanctuary
          ===================================================================== */}
      {shellState === 'playing' && draftOffers.length > 0 && simRef.current && (
        <CardDraftModal
          level={hud.level}
          offers={draftOffers}
          freeRerollAvailable={!simRef.current.freeRerollUsed}
          canAdReroll={
            simRef.current.adRerollsUsed < 2 && saveManagerRef.current.canWatchRewardedAd()
          }
          coins={saveData.currencies.coins}
          onSelectOffer={handleSelectCardOffer}
          onRerollFree={handleRerollFree}
          onRerollAd={handleRerollAd}
          onRerollCoins={handleRerollCoins}
          onSkip={handleSkipDraft}
          onOpenDebugCards={openDebugMenu}
        />
      )}

      {shellState === 'playing' && awaitingRevive && simRef.current && (
        <RescueReviveModal
          coins={saveData.currencies.coins}
          canWatchAd={saveManagerRef.current.canWatchRewardedAd()}
          isAdLoading={isAdLoading}
          onWatchAdRevive={handleWatchAdRevive}
          onSpendCoinsRevive={handleSpendCoinsRevive}
          onDeclineRevive={() => {
            setAwaitingRevive(false);
            clockRef.current.reset();
            simRef.current?.declineReviveAndEndRun();
          }}
        />
      )}

      {shellState === 'paused' && simRef.current && (
        <PauseModal
          weapons={hud.weapons}
          ownedCards={hud.ownedCards}
          settings={saveData.settings}
          onUpdateSettings={(partial) => {
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
          }}
          onResume={() => {
            clockRef.current.startResumeCountdown(1.0); // 1.0s re-orientation countdown ring [F]
            updateShellState('playing');
          }}
          onRestart={() => startNewOrResumedRun(false)}
          onEndRunAndSummary={() => {
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
            syncHudFromSim(sim, 'SUDDEN DEATH · ENDING RUN & CLAIMING REWARDS...');
            updateShellState('playing');
          }}
          onReturnToTitle={() => updateShellState('title')}
          onOpenDebugCards={openDebugMenu}
        />
      )}

      {debugMenuOpen && simRef.current && (
        <DebugCardModal
          weapons={hud.weapons}
          ownedCards={hud.ownedCards}
          heldPowerUps={hud.heldPowerUps}
          onSetCardLevel={(cardId, level) => {
            const sim = simRef.current;
            if (!sim) return;
            sim.debugSetCardLevel(cardId, level);
            syncHudFromSim(sim);
            saveDataRef.current.activeRun = sim.serializeCheckpoint();
            void saveManagerRef.current.flushImmediate();
          }}
          onSetWeaponLevel={(weaponId, level, evolved) => {
            const sim = simRef.current;
            if (!sim) return;
            sim.debugSetWeaponLevel(weaponId, level, evolved);
            syncHudFromSim(sim);
            saveDataRef.current.activeRun = sim.serializeCheckpoint();
            void saveManagerRef.current.flushImmediate();
          }}
          onSpawnPowerUpDrop={(powerUpId) => {
            const sim = simRef.current;
            if (!sim) return;
            sim.debugSpawnPowerUpDrop(powerUpId);
            syncHudFromSim(sim);
          }}
          onGivePowerUp={(powerUpId) => {
            const sim = simRef.current;
            if (!sim) return;
            sim.debugGivePowerUp(powerUpId);
            syncHudFromSim(sim);
            saveDataRef.current.activeRun = sim.serializeCheckpoint();
            void saveManagerRef.current.flushImmediate();
          }}
          onTriggerPowerUp={(powerUpId) => {
            const sim = simRef.current;
            if (!sim) return;
            sim.debugTriggerPowerUp(powerUpId);
            syncHudFromSim(sim);
          }}
          onSpawnArenaFlower={() => {
            const sim = simRef.current;
            if (!sim) return;
            const angle = sim.heroFacingAngle;
            sim.spawnArenaFlower(
              sim.heroX + Math.cos(angle) * 2.2,
              sim.heroY + Math.sin(angle) * 2.2
            );
            syncHudFromSim(sim);
          }}
          onSpawnFinalBossArena={() => {
            const sim = simRef.current;
            if (!sim) return;
            sim.debugSpawnFinalBossArena();
            syncHudFromSim(sim);
          }}
          onTestHealHero={(amount) => {
            const sim = simRef.current;
            if (!sim) return;
            sim.healHero(amount);
            syncHudFromSim(sim);
          }}
          onResetAllCards={() => {
            const sim = simRef.current;
            if (!sim) return;
            for (const c of CARDS) {
              sim.debugSetCardLevel(c.id, 0);
            }
            syncHudFromSim(sim);
            saveDataRef.current.activeRun = sim.serializeCheckpoint();
            void saveManagerRef.current.flushImmediate();
          }}
          onClose={() => {
            closeDebugMenu();
            if (simRef.current) {
              syncHudFromSim(simRef.current);
            }
          }}
        />
      )}

      {shellState === 'gameover' && runSummary && (
        <RunSummaryModal
          summary={runSummary}
          canWatchDoubleAd={saveManagerRef.current.canWatchRewardedAd()}
          onWatchDoubleCoinsAd={handleWatchDoubleCoinsAd}
          onPlayAgain={() => startNewOrResumedRun(false)}
          onReturnToTitle={() => {
            setRunSummary(null);
            updateShellState('title');
          }}
        />
      )}

      {shellState === 'title' && sanctuaryTab !== null && (
        <LoadoutAndStoreModal
          saveData={saveData}
          initialTab={sanctuaryTab}
          ytDiagnostics={ytDiagnostics}
          lastSyncSource={saveManagerRef.current.lastSyncSource}
          statusBannerText={ytSdkBanner}
          isAdLoading={isAdLoading}
          onClose={() => setSanctuaryTab(null)}
          onSelectLoadout={(partial) => {
            const sd = saveDataRef.current;
            sd.loadout = { ...sd.loadout, ...partial };
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
            }
            void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
          }}
          onUnlockProfession={(profId: ProfessionId, cost: number) => {
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
          }}
          onUnlockTrinket={(trinketId: string, cost: number) => {
            const sd = saveDataRef.current;
            if (sd.currencies.coins < cost) return;
            sd.currencies.coins -= cost;
            if (!sd.unlocks.trinkets.includes(trinketId)) {
              sd.unlocks.trinkets.push(trinketId);
            }
            setSaveData({ ...sd });
            void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
          }}
          onUnlockCurse={(curseId: string, cost: number) => {
            const sd = saveDataRef.current;
            if (sd.currencies.coins < cost) return;
            sd.currencies.coins -= cost;
            if (!sd.unlocks.curses.includes(curseId)) {
              sd.unlocks.curses.push(curseId);
            }
            setSaveData({ ...sd });
            void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
          }}
          onWatchPersonaPipAd={async (personaId: string) => {
            setIsAdLoading(true);
            audioRef.current.setAdPlaying(true);
            const earned = await platformRef.current.ads.requestRewardedAd('reward_persona_pip_v1');
            audioRef.current.setAdPlaying(false);
            setIsAdLoading(false);
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
              sd.loadout.personaId = personaId;
              if (simRef.current) {
                simRef.current.personaId = personaId;
              }
            }
            setSaveData({ ...sd });
            await saveManagerRef.current.flushImmediate();
            refreshYtDiagnostics(
              `Rewarded Ad completed (${pDef?.name ?? personaId}: ${currentPips}/${pDef?.adPipsRequired ?? 1} watched ads).`
            );
          }}
          onWatchSanctuaryRewardAd={async () => {
            setIsAdLoading(true);
            audioRef.current.setAdPlaying(true);
            const earned = await platformRef.current.ads.requestRewardedAd(
              'reward_sanctuary_grant_v1'
            );
            audioRef.current.setAdPlaying(false);
            setIsAdLoading(false);
            if (!earned) {
              refreshYtDiagnostics('Ad skipped or unavailable — no Sanctuary reward granted.');
              return;
            }
            const { coinsAdded, gemsAdded } =
              saveManagerRef.current.claimSanctuaryAdReward(120, 2);
            const sd = saveDataRef.current;
            setSaveData({ ...sd });
            await saveManagerRef.current.flushImmediate();
            refreshYtDiagnostics(
              `Ad Reward Granted: +${coinsAdded} Coins & +${gemsAdded} Rare Seeds saved to player state!`
            );
          }}
          onIncrementPersonaAdPip={(personaId: string) => {
            const sd = saveDataRef.current;
            const currentPips = (sd.unlocks.personaAdPips[personaId] ?? 0) + 1;
            sd.unlocks.personaAdPips[personaId] = currentPips;
            const pDef = PERSONAS.find((p) => p.id === personaId);
            if (pDef && currentPips >= pDef.adPipsRequired) {
              if (!sd.unlocks.personas.includes(personaId)) {
                sd.unlocks.personas.push(personaId);
              }
              sd.loadout.personaId = personaId;
              if (simRef.current) {
                simRef.current.personaId = personaId;
              }
            }
            setSaveData({ ...sd });
            void saveManagerRef.current.flushImmediate().then(() => refreshYtDiagnostics());
          }}
          onIncrementAllPersonaAdPips={() => {
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
          }}
          onSavePlayerStateNow={async () => {
            const ok = await saveManagerRef.current.flushImmediate();
            const diag = platformRef.current.devStub.getDiagnostics();
            setSaveData({ ...saveDataRef.current });
            refreshYtDiagnostics(
              ok
                ? `Saved player state to YouTube Cloud & LocalStorage (${diag.lastSavedCloudBytes} B).`
                : 'YouTube Cloud offline — player state saved to LocalStorage backup.'
            );
          }}
          onReloadAndReconcileSave={async () => {
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
          }}
          onSetDevAdOutcomeMode={(mode) => {
            platformRef.current.devStub.setAdOutcomeMode(mode);
            refreshYtDiagnostics(`Dev Stub Ad Outcome set to: ${mode.toUpperCase()}`);
          }}
          onSetDevCloudStorageMode={(mode) => {
            platformRef.current.devStub.setCloudStorageMode(mode);
            refreshYtDiagnostics(`Dev Stub Cloud Storage set to: ${mode.toUpperCase()}`);
          }}
          onSimulateYtAudioToggle={() => {
            const enabled = platformRef.current.devStub.simulateAudioToggle();
            refreshYtDiagnostics(
              `Simulated ytgame.system.onAudioEnabledChange(${enabled})`
            );
          }}
          onSyncScoreNow={async () => {
            const scoreToSend = Math.max(saveDataRef.current.bestScores.allTime, 1500);
            const ok = await platformRef.current.engagement.sendScore(scoreToSend);
            refreshYtDiagnostics(
              ok
                ? `Sent score ${scoreToSend.toLocaleString()} via ytgame.engagement.sendScore()`
                : 'Score sync failed.'
            );
          }}
          onSpawnBestiaryEnemy={(bestiaryKey, mode) => {
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
          }}
          onClaimQuest={(questId: string) => {
            const sd = saveDataRef.current;
            const q = sd.retention.dailyQuests.find((item) => item.id === questId);
            if (!q || q.claimed || q.progress < q.target) return;
            q.claimed = true;
            sd.currencies.coins += q.rewardCoins;
            sd.currencies.gems += q.rewardGems;
            setSaveData({ ...sd });
            void saveManagerRef.current.flushImmediate();
          }}
          onAddDebugGold={(amount: number) => {
            const sd = saveDataRef.current;
            sd.currencies.coins += amount;
            setSaveData({ ...sd });
            void saveManagerRef.current.flushImmediate();
          }}
          onStartRun={() => startNewOrResumedRun(false)}
        />
      )}
    </div>
  );
}
