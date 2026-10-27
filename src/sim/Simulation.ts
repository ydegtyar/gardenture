/**
 * Headless Deterministic 60 Hz Simulation Engine
 * Layer 3 (sim): 100% pure TypeScript. Zero DOM, Zero PixiJS imports.
 */

import {
  angleDifference,
  arcOverlapsCircle,
  capsuleOverlapsCircle,
  ccdSegmentHitsCircle,
  circlesOverlap,
  clamp,
  dist,
  distSq,
} from '../core/math/vec2';
import { RNGStreams, type RNGStreamsState } from '../core/rng/rng';
import { TICK_S } from '../core/time/clock';
import { TypedEventBus } from '../core/events/eventBus';
import {
  CARDS,
  CURSES,
  ENEMY_ARCHETYPES,
  PALETTE,
  PERSONAS,
  PROFESSIONS,
  SPECIAL_MONSTERS,
  STYLE_RANKS,
  WAVE_SCRIPT,
  WEAPONS,
  getXpRequiredForLevel,
} from '../content/data/catalog';
import type {
  EnemyArchetypeId,
  PersonaStepEffectKind,
  PowerUpId,
  ProfessionId,
  SpecialMonsterId,
  WeaponShape,
} from '../content/schema/types';
import { SpatialHashGrid } from './world/spatialHash';
import {
  type ComputedHeroStats,
  calculateEnemySpeedScaling,
  calculateEnemyTimeScaling,
  calculateHitDamage,
  calculateRunCoins,
  computeHeroStats,
  stepStyleRank,
} from './rules/formulas';
import { type DraftOfferItem, generateCardDraftOffers } from './systems/cardDraft';

export interface SimEnemy {
  id: number;
  archetypeId: EnemyArchetypeId;
  name: string;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  facingAngle: number;
  hp: number;
  maxHp: number;
  speed: number;
  contactDamage: number;
  radius: number;
  xpValue: number;
  killPoints: number;
  knockbackResist: number;
  color: number;
  accentColor: number;
  isElite: boolean;
  isSpecial: boolean;
  specialId?: SpecialMonsterId;
  despawnTimer: number;
  isMiniBoss: boolean;
  isFinalBoss: boolean;
  isArenaFlower?: boolean;
  isHeroGrave?: boolean;
  isInfiniteHp?: boolean;
  respawnOnDeath?: boolean;
  bestiaryKey?: string;
  bossAttackMode?: 'sunflower_charge' | 'sunflower_seed_volley' | 'sunflower_leaf_spiral';
  bossPhase: 1 | 2 | 3;

  // AI State machine
  aiState: 'seek' | 'telegraph' | 'charge' | 'recover' | 'hold';
  aiTimer: number;
  telegraphAngle: number;
  telegraphTargetX: number;
  telegraphTargetY: number;
  telegraphDuration: number;

  // Status effects & feedback
  hitFlashTimer: number;
  burnTimer: number;
  burnDps: number;
  poisonTimer: number;
  poisonDps: number;
  slowTimer: number;
  webSlowTimer: number; // > 0 when snared in sticky spider-web glue from Petal Orbit
  freezeTimer: number;
  stormMarkTimer: number; // > 0 when marked with storm debuff from lightning
  koTimer: number; // > 0 when dying in brief KO topple
}

export type BestiaryEnemySpawnMode = 'infinite_hp' | 'swarm' | 'respawn_on_death';

export interface SimProjectile {
  id: number;
  isEnemy: boolean;
  projectileKind?: 'default' | 'sunflower_seed' | 'sunflower_leaf';
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isCrit: boolean;
  pierceRemaining: number;
  lifeTimer: number;
  color: number;
  weaponTags: string[];
  hitEnemyIds: Set<number>;
}

export interface SimPickup {
  id: number;
  kind:
    | 'xp_gem'
    | 'xp_cluster'
    | 'gold_coin'
    | 'healing_seed'
    | 'heal_potion'
    | 'power_up'
    | 'chest';
  x: number;
  y: number;
  value: number;
  powerUpId?: PowerUpId;
  magnetized: boolean;
  pullSpeed: number;
}

export interface SimGroundHazard {
  id: number;
  kind: 'thorn_trail' | 'seed_trap' | 'hammer_telegraph' | 'pollen_zone' | 'spore_cloud';
  x: number;
  y: number;
  radius: number;
  damage: number;
  tickTimer: number;
  lifeTimer: number;
  color: number;
}

export interface SimVisualEffect {
  id: number;
  kind:
    | 'slash_arc'
    | 'spear_line'
    | 'circle_blast'
    | 'dash_strike_burst'
    | 'aegis_burst'
    | 'shockwave_blast'
    | 'ember_burst'
    | 'chain_bolt'
    | 'dash_ghost'
    | 'fire_cone'
    | 'lightning_strike'
    | 'spore_cloud'
    | 'bloom_hammer'
    | 'clover_step'
    | 'heal_pulse'
    | 'second_wind_blast'
    | PersonaStepEffectKind;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  radius: number;
  arcRad: number;
  color: number;
  timer: number;
  maxTimer: number;
  isEcho?: boolean;
}

export interface WeaponRuntimeState {
  id: string;
  level: number;
  evolved: boolean;
  cooldownTimer: number;
  phase: 'ready' | 'windup' | 'active' | 'recovery';
  phaseTimer: number;
  lockedAngle: number;
  lockedTargetX: number;
  lockedTargetY: number;
  swingCounter: number;
  orbitAngle: number;
  orbitHitCooldowns: Map<number, number>;
}

export interface MidRunCheckpointV1 {
  readonly baseSeed: number;
  readonly rngState: RNGStreamsState;
  readonly isDailySeed: boolean;
  readonly dailyDateKey: string | null;
  readonly difficultyTier: number;
  readonly elapsedTicks: number;
  readonly personaId: string;
  readonly professionId: ProfessionId;
  readonly heroX: number;
  readonly heroY: number;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly currentXp: number;
  readonly level: number;
  readonly weapons: Array<{ id: string; level: number; evolved: boolean }>;
  readonly cards: Record<string, number>;
  readonly heldPowerUps: PowerUpId[];
  readonly equippedTrinkets: string[];
  readonly activeCurses: string[];
  readonly rankIndex: number;
  readonly stylePoints: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly peakRankIndex: number;
  readonly ticksPerRank: number[];
  readonly score: number;
  readonly kills: number;
  readonly specialMonstersSpawned: SpecialMonsterId[];
  readonly directorBankedBudget: number;
  readonly miniBossDefeated: boolean;
  readonly reviveUsed: boolean;
  readonly freeRerollUsed: boolean;
  readonly adRerollsUsed: number;
  readonly coinRerollsUsed?: number;
  readonly totalCardsReceived?: number;
  readonly pendingCardOfferIds: string[] | null;
}

export interface SimConfig {
  seed: number;
  isDailySeed?: boolean;
  dailyDateKey?: string | null;
  difficultyTier?: number;
  personaId?: string;
  professionId?: ProfessionId;
  startingWeaponId?: string;
  equippedTrinkets?: string[];
  activeCurses?: string[];
  unlockedWeapons?: string[];
}

export class Simulation {
  public readonly events = new TypedEventBus();
  public readonly rng: RNGStreams;
  public readonly spatialGrid = new SpatialHashGrid(2.0);
  private readonly queryScratch: number[] = [];

  public isDailySeed: boolean;
  public dailyDateKey: string | null;
  public difficultyTier: number;
  public elapsedTicks = 0;
  public elapsedSeconds = 0;

  // Hero state
  public personaId: string;
  public professionId: ProfessionId;
  public heroX = 0;
  public heroY = 0;
  public heroPrevX = 0;
  public heroPrevY = 0;
  public heroVx = 0;
  public heroVy = 0;
  public heroFacingAngle = 0;
  public heroRadius = 0.35;
  public currentHp = 100;
  public maxHp = 100;
  public regenAccumulator = 0;
  public currentXp = 0;
  public xpToNext = 6;
  public level = 1;
  public invulnTimer = 0;
  public hitFlashTimer = 0;
  public shieldHp = 0;
  public shieldTimer = 0;
  public fireBreathTimer = 0;
  public timeSlowTimer = 0;
  public freezeAuraTimer = 0; // Active Frost Flask duration during which no new enemies spawn
  public secondWindUsed = false;
  public deathSequenceTimer = 0; // > 0 when playing hero grave collapse animation before defeat screen
  public victorySequenceTimer = 0; // > 0 when playing victory sequence (boss death + white angel wings ascension)
  public bossDeathTimer = 0; // > 0 during first phase of victory while Final Boss plays death animation

  // Dash state & Invisibility Frames (i-frames)
  public dashTimer = 0;
  public dashIframeTimer = 0; // Active invisibility / invulnerability frames during + after dash
  public cardPickInvisTimer = 0; // Silent 0.5s invisibility after choosing a card (no visual effects)
  public dashDirX = 1;
  public dashDirY = 0;
  public dashCooldownTimer = 0;
  public dashCharges = 1;
  public maxDashCharges = 1;
  public dashBufferTimer = 0;
  public dashBufferAngle = 0;
  public dashHistoryTimestamps: number[] = [];
  public dashHitIds = new Set<number>();
  public ghostSpawnTimer = 0;
  private cloverStepDistanceAccum = 0;
  private cloverStepSide: 1 | -1 = 1;
  private personaStepDistanceAccum = 0;
  private personaStepSide: 1 | -1 = 1;
  private isProcessingRegrowthNova = false;

  public isRegrowthEvolved(): boolean {
    return (this.cards.regrowth ?? 0) > 5;
  }

  public isHeroDashInvisible(): boolean {
    return this.dashIframeTimer > 0 || this.dashTimer > 0 || this.cardPickInvisTimer > 0;
  }

  // Build & Inventory
  public weapons: WeaponRuntimeState[] = [];
  public cards: Record<string, number> = {};
  public heldPowerUps: PowerUpId[] = [];
  public equippedTrinkets: string[] = [];
  public activeCurses: string[] = [];
  public unlockedWeapons: string[] = [];
  public stats: ComputedHeroStats;

  // Combat & Card Counters
  public totalHitsDealt = 0;
  public totalCardsReceived = 0;
  public bonusCoinsCollected = 0;
  public vampiricKillCounter = 0;
  public bonusOrbitAngle = 0;
  public bonusOrbitCooldowns = new Map<number, number>();

  public getEffectiveCardsReceived(): number {
    const cardsFromRecord = Object.values(this.cards).reduce((sum, v) => sum + v, 0);
    const cardsFromWeapons = this.weapons.reduce(
      (sum, w) => sum + (w.level - 1) + (w.evolved ? 1 : 0),
      0
    );
    return Math.max(this.totalCardsReceived, cardsFromRecord + cardsFromWeapons);
  }

  // Style Rank & Score (Spec Section 13)
  public rankIndex = 0;
  public stylePoints = 0;
  public currentStreak = 0;
  public bestStreak = 0;
  public streakResetTimer = 0;
  public lastKillWeaponId = '';
  public varietyBonusCooldown = 0;
  public noDamageTimer = 0;
  public noDamageSpGrantedInWindow = 0;
  public recentDamageWindowTimer = 0;
  public peakRankIndex = 0;
  public ticksPerRank: number[] = [0, 0, 0, 0, 0, 0, 0];
  public score = 0;
  public kills = 0;

  // Entities
  private nextEntityId = 1;
  public enemies: SimEnemy[] = [];
  public projectiles: SimProjectile[] = [];
  public pickups: SimPickup[] = [];
  public hazards: SimGroundHazard[] = [];
  public visualEffects: SimVisualEffect[] = [];

  // Wave Director & Bosses
  public directorBankedBudget = 2.5;
  public spawnTimer = 0;
  public specialMonstersSpawned: SpecialMonsterId[] = [];
  public miniBossSpawned = false;
  public miniBossDefeated = false;
  public static readonly INITIAL_ARENA_RADIUS_U = 28.0;
  public static readonly FINAL_BOSS_ARENA_RADIUS_P1_U = 13.5;
  public static readonly FINAL_BOSS_ARENA_RADIUS_P2_U = 12.0;
  public static readonly FINAL_BOSS_ARENA_RADIUS_P3_U = 10.5;
  public static readonly FINAL_BOSS_SPAWN_SEC = 225;
  public finalBossSpawned = false;
  public finalBossId: number | null = null;
  public arenaActive = true; // Active from the start of the run and slowly collapses toward the Final Boss arena
  public arenaCenterX = 0;
  public arenaCenterY = 0;
  public arenaRadiusU = Simulation.INITIAL_ARENA_RADIUS_U;
  public isOutsideArena = false;
  private arenaOutDpsAccumulator = 0;
  private arenaFlowerSpawnTimer = 14.0;

  // Draft & Modal state
  public static readonly MAX_AD_REROLLS = 3;
  public static readonly MAX_COIN_REROLLS = 3;
  public pendingCardOffers: DraftOfferItem[] = [];
  public consecutiveAllCommonOffers = 0;
  public freeRerollUsed = false;
  public adRerollsUsed = 0;
  public coinRerollsUsed = 0;
  public reviveUsed = false;
  public awaitingReviveDecision = false;
  public runEnded = false;
  public runOutcome: 'victory' | 'defeat' | 'timeout' | null = null;

  // Input intents for the next tick
  private moveIntentX = 0;
  private moveIntentY = 0;
  private pendingPowerUpSlot: number | null = null;

  constructor(config: SimConfig) {
    this.rng = new RNGStreams(config.seed);
    this.isDailySeed = config.isDailySeed ?? false;
    this.dailyDateKey = config.dailyDateKey ?? null;
    this.difficultyTier = config.difficultyTier ?? 1;
    this.personaId = config.personaId ?? 'adventurer_default';
    this.professionId = config.professionId ?? 'warden';
    this.equippedTrinkets = [...(config.equippedTrinkets ?? [])];
    this.activeCurses = [...(config.activeCurses ?? [])];
    this.unlockedWeapons = config.unlockedWeapons ?? Object.keys(WEAPONS);

    this.stats = computeHeroStats(
      this.professionId,
      this.cards,
      this.equippedTrinkets,
      this.activeCurses
    );
    this.maxHp = this.stats.maxHp;
    this.currentHp = this.maxHp;
    this.maxDashCharges = 1 + this.stats.extraDashCharges;
    this.dashCharges = this.maxDashCharges;
    this.xpToNext = getXpRequiredForLevel(1);

    // Equip starting weapon
    const prof = PROFESSIONS[this.professionId] ?? PROFESSIONS.warden!;
    const startWpnId = config.startingWeaponId ?? prof.startingWeaponId;
    this.addOrUpgradeWeapon(startWpnId);

    // Apply starting trinket bonuses
    if (this.equippedTrinkets.includes('aegis_leaf')) {
      this.heldPowerUps.push('shield');
    }

    // Spawn initial weak Chasers outside the viewport (12u away) so enemies move inward
    // @llm-hook spawn-distance: ensure opening enemies spawn outside camera viewport
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.4;
      this.spawnEnemy('chaser', Math.cos(angle) * 12.0, Math.sin(angle) * 12.0, false);
    }

    // Spawn 1 initial gold coin near hero spawn, placed a bit farther away in the clearing
    const initialCoins = [{ x: 3.2, y: -0.85, value: 1 }];
    for (const c of initialCoins) {
      this.pickups.push({
        id: this.nextEntityId++,
        kind: 'gold_coin',
        x: c.x,
        y: c.y,
        value: c.value,
        magnetized: false,
        pullSpeed: 0,
      });
    }

    // Scatter 6 Big Flowers randomly around the world (7.5u to 24.0u away, never directly on spawn point)
    const seedAngleOffset = ((config.seed % 360) * Math.PI) / 180;
    for (let i = 0; i < 6; i++) {
      const hashA = Math.abs(Math.sin(config.seed * 0.173 + (i + 1) * 12.9898) * 43758.5453);
      const fracR = hashA - Math.floor(hashA);
      const hashB = Math.abs(Math.cos(config.seed * 0.317 + (i + 1) * 78.233) * 29431.123);
      const fracJ = hashB - Math.floor(hashB);
      const distU = 7.5 + fracR * 16.5; // 7.5u .. 24.0u away from (0,0)
      const angle = seedAngleOffset + i * ((Math.PI * 2) / 6) + (fracJ - 0.5) * 0.65;
      this.spawnArenaFlower(Math.cos(angle) * distU, Math.sin(angle) * distU);
    }
  }

  public setMoveIntent(x: number, y: number): void {
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      this.moveIntentX = x / mag;
      this.moveIntentY = y / mag;
    } else {
      this.moveIntentX = x;
      this.moveIntentY = y;
    }
  }

  public requestDash(angle?: number): boolean {
    const dashAngle =
      angle !== undefined
        ? angle
        : Math.hypot(this.moveIntentX, this.moveIntentY) > 0.05
          ? Math.atan2(this.moveIntentY, this.moveIntentX)
          : this.heroFacingAngle;

    if (this.dashTimer <= 0 && this.dashCharges > 0) {
      this.executeDash(dashAngle);
      return true;
    }

    // Input buffer: if dash is within 0.15s of cooldown ready, buffer it (Spec Section 4)
    this.dashBufferTimer = 0.15;
    this.dashBufferAngle = dashAngle;
    return false;
  }

  public requestUsePowerUp(slotIndex: number): void {
    this.pendingPowerUpSlot = slotIndex;
  }

  private executeDash(angle: number): void {
    this.dashCharges = Math.max(0, this.dashCharges - 1);
    if (this.dashCooldownTimer <= 0) {
      this.dashCooldownTimer = this.stats.dashCooldown;
    }
    this.dashTimer = 0.14; // Spec Section 4: 0.14 s duration, 2.6 u distance
    // Grant invisibility frames (i-frames) for the 0.14s dash + 0.12s post-dash phase window (0.32s for Stormcaller)
    const iframeDuration = this.professionId === 'stormcaller' ? 0.32 : 0.26;
    this.dashIframeTimer = Math.max(this.dashIframeTimer, iframeDuration);
    this.invulnTimer = Math.max(this.invulnTimer, iframeDuration);
    this.dashDirX = Math.cos(angle);
    this.dashDirY = Math.sin(angle);
    this.heroFacingAngle = angle;
    this.dashHitIds.clear();
    this.ghostSpawnTimer = 0;

    // Anti-spam check (Spec Section 13: > 3 dashes in 4 s reduces style gain by 50%)
    this.dashHistoryTimestamps.push(this.elapsedSeconds);
    while (
      this.dashHistoryTimestamps.length > 0 &&
      this.elapsedSeconds - this.dashHistoryTimestamps[0]! > 4.0
    ) {
      this.dashHistoryTimestamps.shift();
    }

    // Check Perfect Dodge: did the hero dash while near an active enemy telegraph or projectile?
    let perfectDodge = false;
    for (const e of this.enemies) {
      if (
        e.aiState === 'telegraph' &&
        distSq(this.heroX, this.heroY, e.x, e.y) <= 4.5 * 4.5
      ) {
        perfectDodge = true;
        break;
      }
    }
    if (!perfectDodge) {
      for (const p of this.projectiles) {
        if (p.isEnemy && distSq(this.heroX, this.heroY, p.x, p.y) <= 2.2 * 2.2) {
          perfectDodge = true;
          break;
        }
      }
    }
    if (perfectDodge) {
      const spamMult = this.dashHistoryTimestamps.length > 3 ? 0.5 : 1.0;
      const addedSp = Math.round(12 * spamMult);
      this.addStylePoints(addedSp);
      this.events.emit('PerfectDodge', {
        x: this.heroX,
        y: this.heroY,
        stylePointsAdded: addedSp,
      });
      this.events.emit('FloatingText', {
        x: this.heroX,
        y: this.heroY - 0.6,
        text: `PERFECT DODGE +${addedSp}`,
        color: PALETTE.GOLD_STAR,
        scale: 1.25,
      });
    }

    // Profession Dash start effects
    if (this.professionId === 'seeker') {
      // Seeker: leaves a seed trap at starting point for 3 s
      this.hazards.push({
        id: this.nextEntityId++,
        kind: 'seed_trap',
        x: this.heroX,
        y: this.heroY,
        radius: 1.4 * this.stats.areaMult,
        damage: Math.round(12 * this.stats.damageMult),
        tickTimer: 0.1,
        lifeTimer: 3.0,
        color: PALETTE.MINT_GREEN,
      });
    } else if (this.professionId === 'herbalist') {
      // Herbalist: heal pulse restores 8 HP and clears slow
      this.healHero(8);
      this.damageEnemiesInCircle(
        this.heroX,
        this.heroY,
        1.7 * this.stats.areaMult,
        10 * this.stats.damageMult,
        0.5,
        ['area', 'nature']
      );
      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'dash_strike_burst',
        x: this.heroX,
        y: this.heroY,
        targetX: this.heroX,
        targetY: this.heroY,
        angle: this.heroFacingAngle,
        radius: 1.7 * this.stats.areaMult,
        arcRad: Math.PI * 2,
        color: PALETTE.MINT_GREEN,
        timer: 0.34,
        maxTimer: 0.34,
      });
    }

    // Spawn initial petal motion trail anchor at dash takeoff (0.3s fade)
    this.visualEffects.push({
      id: this.nextEntityId++,
      kind: 'dash_ghost',
      x: this.heroX,
      y: this.heroY,
      targetX: this.heroX - this.dashDirX * 0.45,
      targetY: this.heroY - this.dashDirY * 0.45,
      angle: this.heroFacingAngle,
      radius: 0.44,
      arcRad: 0,
      color: PROFESSIONS[this.professionId]?.primaryColor ?? PALETTE.MINT_GREEN,
      timer: 0.3,
      maxTimer: 0.3,
    });
    this.ghostSpawnTimer = 0.025;

    this.events.emit('HeroDashed', {
      startX: this.heroX,
      startY: this.heroY,
      endX: this.heroX + this.dashDirX * 2.6,
      endY: this.heroY + this.dashDirY * 2.6,
      professionId: this.professionId,
    });
  }

  public addOrUpgradeWeapon(weaponId: string): void {
    const existing = this.weapons.find((w) => w.id === weaponId);
    if (existing) {
      existing.level = Math.min(8, existing.level + 1);
      return;
    }
    if (this.weapons.length >= 3) return;
    this.weapons.push({
      id: weaponId,
      level: 1,
      evolved: false,
      cooldownTimer: 0.15,
      phase: 'ready',
      phaseTimer: 0,
      lockedAngle: 0,
      lockedTargetX: 0,
      lockedTargetY: 0,
      swingCounter: 0,
      orbitAngle: 0,
      orbitHitCooldowns: new Map(),
    });
  }

  public applyCardOffer(offerId: string): boolean {
    const offer =
      this.pendingCardOffers.find((o) => o.offerId === offerId) ??
      this.pendingCardOffers[0];
    if (!offer) {
      this.pendingCardOffers = [];
      return false;
    }

    if (offer.kind === 'weapon_new' || offer.kind === 'weapon_upgrade') {
      this.addOrUpgradeWeapon(offer.targetId);
    } else if (offer.kind === 'weapon_evolution') {
      const w = this.weapons.find((item) => item.id === offer.targetId);
      if (w) {
        w.evolved = true;
      }
    } else if (offer.kind === 'card') {
      const prevLv = this.cards[offer.targetId] ?? 0;
      this.cards[offer.targetId] = prevLv + 1;
    }

    const prevMaxHp = this.maxHp;
    this.stats = computeHeroStats(
      this.professionId,
      this.cards,
      this.equippedTrinkets,
      this.activeCurses
    );
    this.maxHp = this.stats.maxHp;
    if (this.maxHp > prevMaxHp) {
      this.currentHp = Math.min(this.maxHp, this.currentHp + (this.maxHp - prevMaxHp));
    } else {
      this.currentHp = Math.min(this.maxHp, this.currentHp);
    }
    if (offer.targetId === 'hardy_bark') {
      this.healHero(15);
    } else if (offer.targetId === 'regrowth' && (this.cards.regrowth ?? 0) > 5) {
      // Evolving Regrowth into Overgrowth Surge immediately restores full HP and unleashes a map-wide heal surge
      this.currentHp = this.maxHp;
      this.healHero(24);
    }

    this.maxDashCharges = 1 + this.stats.extraDashCharges;
    this.totalCardsReceived++;
    this.pendingCardOffers = [];
    this.cardPickInvisTimer = Math.max(this.cardPickInvisTimer, 0.5); // 0.5s invisibility after card choose without visible effects
    return true;
  }

  public debugSetCardLevel(cardId: string, level: number): boolean {
    const cardDef = CARDS.find((c) => c.id === cardId);
    if (!cardDef) return false;
    const maxAllowed = cardDef.evolvedName ? cardDef.maxLevel + 1 : cardDef.maxLevel;
    const clampedLv = clamp(Math.floor(level), 0, maxAllowed);
    const prevLv = this.cards[cardId] ?? 0;
    if (clampedLv <= 0) {
      delete this.cards[cardId];
    } else {
      this.cards[cardId] = clampedLv;
    }
    const bonusHeal =
      cardId === 'hardy_bark' && clampedLv > prevLv ? (clampedLv - prevLv) * 15 : 0;
    this.recalculateStatsAfterDebug(bonusHeal);
    this.cardPickInvisTimer = Math.max(this.cardPickInvisTimer, 0.5);

    if (cardId === 'shockwave' && clampedLv > 0) {
      const swRadius = (2.8 + clampedLv * 0.15) * this.stats.areaMult;
      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'shockwave_blast',
        x: this.heroX,
        y: this.heroY,
        targetX: this.heroX,
        targetY: this.heroY,
        angle: 0,
        radius: swRadius,
        arcRad: clampedLv,
        color: PALETTE.BUTTER_YELLOW,
        timer: 0.48,
        maxTimer: 0.48,
      });
    } else if (cardId === 'lucky_clover' && clampedLv > 0) {
      this.spawnLuckyCloverStep(clampedLv);
    } else if (
      (cardId === 'regrowth' || cardId === 'vampiric_bloom' || cardId === 'healing_bloom') &&
      clampedLv > 0
    ) {
      if (cardId === 'regrowth' && clampedLv > cardDef.maxLevel) {
        this.currentHp = this.maxHp;
      }
      this.healHero(clampedLv * 4);
    }
    return true;
  }

  private spawnLuckyCloverStep(cloverLv: number): void {
    const lv = clamp(cloverLv, 1, 5);
    this.cloverStepSide = this.cloverStepSide === 1 ? -1 : 1;
    const perpAngle = this.heroFacingAngle + Math.PI * 0.5;
    const footOffset = 0.14 * this.cloverStepSide;
    const stepX = this.heroX + Math.cos(perpAngle) * footOffset;
    const stepY = this.heroY + Math.sin(perpAngle) * footOffset + 0.16;
    const duration = 0.55 + lv * 0.18;
    const radius = 0.16 + lv * 0.07;

    this.visualEffects.push({
      id: this.nextEntityId++,
      kind: 'clover_step',
      x: stepX,
      y: stepY,
      targetX: stepX,
      targetY: stepY,
      angle: this.heroFacingAngle + this.cloverStepSide * 0.22,
      radius,
      arcRad: lv,
      color: PALETTE.MINT_GREEN,
      timer: duration,
      maxTimer: duration,
    });
  }

  private spawnPersonaStepEffect(stepKind: PersonaStepEffectKind, color: number): void {
    this.personaStepSide = this.personaStepSide === 1 ? -1 : 1;
    const perpAngle = this.heroFacingAngle + Math.PI * 0.5;
    const footOffset = 0.14 * this.personaStepSide;
    const backOffset = -0.08;
    const stepX =
      this.heroX +
      Math.cos(perpAngle) * footOffset +
      Math.cos(this.heroFacingAngle) * backOffset;
    const stepY =
      this.heroY +
      Math.sin(perpAngle) * footOffset +
      Math.sin(this.heroFacingAngle) * backOffset +
      0.16;
    const duration = 0.78;
    const radius = 0.34;

    this.visualEffects.push({
      id: this.nextEntityId++,
      kind: stepKind,
      x: stepX,
      y: stepY,
      targetX: stepX,
      targetY: stepY,
      angle: this.heroFacingAngle + this.personaStepSide * 0.18,
      radius,
      arcRad: this.personaStepSide,
      color,
      timer: duration,
      maxTimer: duration,
    });
  }

  public debugTriggerPowerUp(powerUpId: PowerUpId): void {
    this.activatePowerUp(powerUpId);
  }

  public debugSpawnPowerUpDrop(powerUpId: PowerUpId = 'fire_breath'): void {
    if (powerUpId === 'heal_potion') {
      this.debugSpawnHeal20Drop();
      return;
    }
    const angle = this.heroFacingAngle;
    this.pickups.push({
      id: this.nextEntityId++,
      kind: 'power_up',
      powerUpId,
      x: this.heroX + Math.cos(angle) * 1.35,
      y: this.heroY + Math.sin(angle) * 1.35,
      value: 1,
      magnetized: false,
      pullSpeed: 0,
    });
  }

  public debugSpawnHeal20Drop(): SimPickup {
    const angle = this.heroFacingAngle;
    const pickup: SimPickup = {
      id: this.nextEntityId++,
      kind: 'heal_potion',
      powerUpId: 'heal_potion',
      x: this.heroX + Math.cos(angle) * 1.35,
      y: this.heroY + Math.sin(angle) * 1.35,
      value: 20,
      magnetized: false,
      pullSpeed: 0,
    };
    this.pickups.push(pickup);
    return pickup;
  }

  public debugGivePowerUp(powerUpId: PowerUpId = 'fire_breath'): void {
    if (this.heldPowerUps.length >= 2) {
      this.heldPowerUps.shift();
    }
    this.heldPowerUps.push(powerUpId);
    this.events.emit('PowerUpPicked', {
      powerUpId,
      slotIndex: this.heldPowerUps.length - 1,
    });
  }

  public debugSetWeaponLevel(weaponId: string, level: number, evolved = false): boolean {
    if (!WEAPONS[weaponId]) return false;
    if (level <= 0) {
      this.weapons = this.weapons.filter((w) => w.id !== weaponId);
    } else {
      const clampedLv = clamp(Math.floor(level), 1, 8);
      const existing = this.weapons.find((w) => w.id === weaponId);
      if (existing) {
        existing.level = clampedLv;
        existing.evolved = evolved;
      } else {
        this.weapons.push({
          id: weaponId,
          level: clampedLv,
          evolved,
          cooldownTimer: 0.15,
          phase: 'ready',
          phaseTimer: 0,
          lockedAngle: 0,
          lockedTargetX: 0,
          lockedTargetY: 0,
          swingCounter: 0,
          orbitAngle: 0,
          orbitHitCooldowns: new Map(),
        });
      }
    }
    this.recalculateStatsAfterDebug(0);
    this.cardPickInvisTimer = Math.max(this.cardPickInvisTimer, 0.5);
    return true;
  }

  private recalculateStatsAfterDebug(bonusHeal = 0): void {
    const prevMaxHp = this.maxHp;
    this.stats = computeHeroStats(
      this.professionId,
      this.cards,
      this.equippedTrinkets,
      this.activeCurses
    );
    this.maxHp = this.stats.maxHp;
    if (this.maxHp > prevMaxHp) {
      this.currentHp = Math.min(this.maxHp, this.currentHp + (this.maxHp - prevMaxHp));
    } else {
      this.currentHp = Math.min(this.maxHp, this.currentHp);
    }
    if (bonusHeal > 0) {
      this.healHero(bonusHeal);
    }
    this.maxDashCharges = 1 + this.stats.extraDashCharges;
    this.dashCharges = Math.min(this.maxDashCharges, Math.max(1, this.dashCharges));
    const cardsSum = Object.values(this.cards).reduce((s, v) => s + v, 0);
    const weaponsSum = this.weapons.reduce(
      (s, w) => s + (w.level - 1) + (w.evolved ? 1 : 0),
      0
    );
    this.totalCardsReceived = cardsSum + weaponsSum;
  }

  public skipCardDraft(): void {
    if (this.pendingCardOffers.length === 0) return;
    this.pendingCardOffers = [];
    this.healHero(10);
    this.score += 100;
    this.cardPickInvisTimer = Math.max(this.cardPickInvisTimer, 0.5);
  }

  public rerollCardDraft(mode: boolean | 'free' | 'ad' | 'coins'): DraftOfferItem[] {
    if (mode === true || mode === 'free') {
      this.freeRerollUsed = true;
    } else if (mode === 'coins') {
      if (this.coinRerollsUsed >= Simulation.MAX_COIN_REROLLS) {
        return this.pendingCardOffers;
      }
      this.coinRerollsUsed++;
    } else {
      if (this.adRerollsUsed >= Simulation.MAX_AD_REROLLS) {
        return this.pendingCardOffers;
      }
      this.adRerollsUsed++;
    }
    const prevIds = this.pendingCardOffers.map((o) => o.offerId);
    const { offers, allCommon } = generateCardDraftOffers({
      rng: this.rng.cards,
      luck: this.stats.luck,
      weapons: this.weapons,
      ownedCards: this.cards,
      unlockedWeapons: this.unlockedWeapons,
      consecutiveAllCommonOffers: this.consecutiveAllCommonOffers,
      excludeOfferIds: prevIds,
    });
    if (allCommon) this.consecutiveAllCommonOffers++;
    else this.consecutiveAllCommonOffers = 0;

    this.pendingCardOffers = offers;
    return offers;
  }

  /**
   * Deterministic Revive mutation per YouTube Playables SDK Spec Section 7.2
   */
  public applyPlayerRevive(params?: {
    healRatio?: number;
    invulnerabilitySeconds?: number;
    knockbackRadiusU?: number;
    knockbackForceU?: number;
  }): void {
    this.reviveUsed = true;
    this.awaitingReviveDecision = false;
    const healRatio = params?.healRatio ?? 0.5;
    const healAmt = Math.max(1, Math.round(this.maxHp * healRatio));
    this.currentHp = healAmt;
    this.invulnTimer = params?.invulnerabilitySeconds ?? 3.0;
    this.stylePoints = Math.max(this.stylePoints, 30);
    this.spawnHeroHealEffect(healAmt, healAmt);

    const kbRadius = params?.knockbackRadiusU ?? 2.8;
    const kbForce = params?.knockbackForceU ?? 3.5;
    for (const e of this.enemies) {
      const d = dist(this.heroX, this.heroY, e.x, e.y);
      if (d <= kbRadius && d > 0.001) {
        const nx = (e.x - this.heroX) / d;
        const ny = (e.y - this.heroY) / d;
        e.x += nx * kbForce * (1 - e.knockbackResist * 0.5);
        e.y += ny * kbForce * (1 - e.knockbackResist * 0.5);
      }
    }
  }

  /**
   * Forces immediate Sudden Death on the hero (e.g. when clicking End Run from Pause or declining revive),
   * bypassing all extra lives (Second Wind, Rescue Revive, Shield HP, and Invulnerability),
   * leaving a Hero Grave at the hero's position before concluding the run and awarding rewards.
   */
  public triggerSuddenDeath(): void {
    if (this.runEnded || this.deathSequenceTimer > 0) return;
    this.secondWindUsed = true;
    this.reviveUsed = true;
    this.awaitingReviveDecision = false;
    this.pendingCardOffers = [];
    this.shieldHp = 0;
    this.shieldTimer = 0;
    this.invulnTimer = 0;
    this.dashIframeTimer = 0;
    this.cardPickInvisTimer = 0;
    this.dashTimer = 0;
    this.heroVx = 0;
    this.heroVy = 0;
    this.currentHp = 0;
    this.hitFlashTimer = 0.28;

    this.visualEffects.push({
      id: this.nextEntityId++,
      kind: 'circle_blast',
      x: this.heroX,
      y: this.heroY,
      targetX: this.heroX,
      targetY: this.heroY,
      angle: 0,
      radius: 2.2,
      arcRad: Math.PI * 2,
      color: PALETTE.CRIMSON_WARN,
      timer: 0.45,
      maxTimer: 0.45,
    });

    this.events.emit('HeroHit', {
      x: this.heroX,
      y: this.heroY,
      damage: this.maxHp,
      currentHp: 0,
      maxHp: this.maxHp,
      shieldAbsorbed: false,
    });

    this.startDefeatSequence();
  }

  public declineReviveAndEndRun(): void {
    this.triggerSuddenDeath();
  }

  public startDefeatSequence(): void {
    if (this.runEnded || this.deathSequenceTimer > 0) return;
    this.secondWindUsed = true;
    this.reviveUsed = true;
    this.awaitingReviveDecision = false;
    this.pendingCardOffers = [];
    this.shieldHp = 0;
    this.currentHp = 0;
    this.deathSequenceTimer = 1.65;
    const hasNearbyGrave = this.enemies.some(
      (e) => e.isHeroGrave && Math.hypot(e.x - this.heroX, e.y - this.heroY) < 1.2
    );
    if (!hasNearbyGrave) {
      this.spawnHeroGrave(this.heroX, this.heroY);
    }
  }

  public startVictorySequence(): void {
    if (this.runEnded || this.victorySequenceTimer > 0) return;
    // Despawn all enemies except the Final Boss, then play Final Boss death animation before Angel Wings ascension
    this.enemies = this.enemies.filter((e) => e.isFinalBoss);
    this.projectiles = [];
    this.hazards = [];
    const hasFinalBoss = this.enemies.length > 0;
    this.bossDeathTimer = hasFinalBoss ? 0.85 : 0;
    this.victorySequenceTimer = hasFinalBoss ? 1.95 : 1.1;
    for (const boss of this.enemies) {
      boss.hp = 0;
      boss.koTimer = 0.85;
      boss.vx = 0;
      boss.vy = 0;
    }
  }

  /**
   * Executes one discrete 60 Hz simulation step (16.667 ms)
   */
  public tick(): void {
    if (this.runEnded) {
      return;
    }

    if (this.deathSequenceTimer > 0) {
      this.deathSequenceTimer = Math.max(0, this.deathSequenceTimer - TICK_S);
      this.updateVisualEffects(TICK_S);
      if (this.deathSequenceTimer <= 0) {
        this.finishRun('defeat');
      }
      return;
    }

    if (this.victorySequenceTimer > 0) {
      if (this.bossDeathTimer > 0) {
        const prevStep = Math.floor(this.bossDeathTimer * 12);
        this.bossDeathTimer = Math.max(0, this.bossDeathTimer - TICK_S);
        const nextStep = Math.floor(this.bossDeathTimer * 12);
        const boss = this.enemies.find((e) => e.isFinalBoss);
        if (boss) {
          boss.koTimer = Math.max(0.05, this.bossDeathTimer);
          if (nextStep !== prevStep) {
            const burstAngle = nextStep * 1.35;
            const burstDist = boss.radius * 0.55;
            this.visualEffects.push({
              id: this.nextEntityId++,
              kind: 'dash_strike_burst',
              x: boss.x + Math.cos(burstAngle) * burstDist,
              y: boss.y + Math.sin(burstAngle) * burstDist,
              targetX: boss.x,
              targetY: boss.y,
              angle: burstAngle,
              radius: 1.35,
              arcRad: Math.PI * 2,
              color: PALETTE.GOLD_STAR,
              timer: 0.28,
              maxTimer: 0.28,
            });
          }
          if (this.bossDeathTimer <= 0) {
            this.visualEffects.push({
              id: this.nextEntityId++,
              kind: 'second_wind_blast',
              x: boss.x,
              y: boss.y,
              targetX: boss.x,
              targetY: boss.y,
              angle: 0,
              radius: 3.2,
              arcRad: Math.PI * 2,
              color: PALETTE.GOLD_STAR,
              timer: 0.55,
              maxTimer: 0.55,
            });
            this.enemies = [];
          }
        }
      }
      this.victorySequenceTimer = Math.max(0, this.victorySequenceTimer - TICK_S);
      this.updateVisualEffects(TICK_S);
      if (this.victorySequenceTimer <= 0) {
        this.finishRun('victory');
      }
      return;
    }

    if (
      this.awaitingReviveDecision ||
      this.pendingCardOffers.length > 0
    ) {
      return;
    }

    this.elapsedTicks++;
    this.elapsedSeconds = this.elapsedTicks * TICK_S;

    // 1. Move entities (Hero, Enemies, Projectiles)
    this.updateHeroMovementAndStatus(TICK_S);
    this.updateEnemiesMovementAndAI(TICK_S);
    this.updateProjectiles(TICK_S);

    // 2. Rebuild 2.0u Spatial Hash Grid
    this.spatialGrid.clear();
    for (const e of this.enemies) {
      if (e.koTimer <= 0 && e.hp > 0) {
        this.spatialGrid.insert(e.id, e.x, e.y, e.radius);
      }
    }

    // 3. Update Weapons & Ground Hazards
    this.updateWeapons(TICK_S);
    this.updateGroundHazards(TICK_S);

    // 4. Resolve Pickups & Gems
    this.updatePickups(TICK_S);

    // 5. Update Style Rank meter & Wave Director
    this.updateStyleRank(TICK_S);
    this.updateWaveDirector(TICK_S);

    // 6. Cleanup visual effects & check 5:00 timeout (+30s for extended Final Boss timer)
    this.updateVisualEffects(TICK_S);
    if (this.elapsedSeconds >= 300 && !this.runEnded) {
      this.finishRun('timeout');
    }
  }

  private updateHeroMovementAndStatus(dt: number): void {
    this.heroPrevX = this.heroX;
    this.heroPrevY = this.heroY;

    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.dashIframeTimer > 0) this.dashIframeTimer = Math.max(0, this.dashIframeTimer - dt);
    if (this.cardPickInvisTimer > 0) this.cardPickInvisTimer = Math.max(0, this.cardPickInvisTimer - dt);
    if (this.hitFlashTimer > 0) this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      if (this.shieldTimer <= 0) this.shieldHp = 0;
    }
    if (this.timeSlowTimer > 0) this.timeSlowTimer = Math.max(0, this.timeSlowTimer - dt);
    if (this.freezeAuraTimer > 0) this.freezeAuraTimer = Math.max(0, this.freezeAuraTimer - dt);

    // Ember Guard ("fire_breath") usable item active flame barrier & blazing cone
    if (this.fireBreathTimer > 0) {
      this.fireBreathTimer = Math.max(0, this.fireBreathTimer - dt);
      const egRadius = 2.1 * this.stats.areaMult;
      if (this.elapsedTicks % 10 === 0) {
        this.damageEnemiesInArc(
          this.heroX,
          this.heroY,
          3.5,
          this.heroFacingAngle,
          (70 * Math.PI) / 180,
          20 * this.stats.damageMult,
          0.3,
          ['fire', 'area'],
          true
        );
        // Protective Ember Guard ring around the hero ignites & damages close attackers
        for (const e of this.enemies) {
          if (e.hp <= 0 || e.koTimer > 0) continue;
          if (circlesOverlap(this.heroX, this.heroY, egRadius, e.x, e.y, e.radius)) {
            e.burnTimer = Math.max(e.burnTimer, 3.0);
            e.burnDps = Math.max(e.burnDps, 12 * this.stats.damageMult);
            this.applyDamageToEnemy(e, 12 * this.stats.damageMult, false, 0.25, [
              'fire',
              'area',
            ]);
          }
        }
        this.visualEffects.push({
          id: this.nextEntityId++,
          kind: 'fire_cone',
          x: this.heroX,
          y: this.heroY,
          targetX: this.heroX + Math.cos(this.heroFacingAngle) * 3.5,
          targetY: this.heroY + Math.sin(this.heroFacingAngle) * 3.5,
          angle: this.heroFacingAngle,
          radius: 3.5,
          arcRad: (70 * Math.PI) / 180,
          color: 0xfb923c,
          timer: 0.24,
          maxTimer: 0.24,
        });
      }
      if (this.elapsedTicks % 24 === 0) {
        this.visualEffects.push({
          id: this.nextEntityId++,
          kind: 'ember_burst',
          x: this.heroX,
          y: this.heroY,
          targetX: this.heroX,
          targetY: this.heroY,
          angle: this.heroFacingAngle,
          radius: egRadius,
          arcRad: 3,
          color: 0xfb923c,
          timer: 0.42,
          maxTimer: 0.42,
        });
      }
    }

    // Pending Held Power-up use
    if (this.pendingPowerUpSlot !== null) {
      const slot = this.pendingPowerUpSlot;
      this.pendingPowerUpSlot = null;
      if (slot >= 0 && slot < this.heldPowerUps.length) {
        const pId = this.heldPowerUps.splice(slot, 1)[0]!;
        this.activatePowerUp(pId);
      }
    }

    // Continuous HP regeneration (continues ticking at full HP when Regrowth is evolved so Overgrowth Surge damages all enemies)
    if (this.stats.regenPerSec > 0 && (this.currentHp < this.maxHp || this.isRegrowthEvolved())) {
      this.regenAccumulator += this.stats.regenPerSec * dt;
      if (this.regenAccumulator >= 1) {
        const whole = Math.floor(this.regenAccumulator);
        this.regenAccumulator -= whole;
        this.healHero(whole);
      }
    }

    // Dash cooldown & buffered dash
    if (this.dashCharges < this.maxDashCharges) {
      this.dashCooldownTimer -= dt;
      if (this.dashCooldownTimer <= 0) {
        this.dashCharges++;
        if (this.dashCharges < this.maxDashCharges) {
          this.dashCooldownTimer = this.stats.dashCooldown;
        } else {
          this.dashCooldownTimer = 0;
        }
      }
    }

    if (this.dashBufferTimer > 0) {
      this.dashBufferTimer = Math.max(0, this.dashBufferTimer - dt);
      if (this.dashTimer <= 0 && this.dashCharges > 0) {
        this.dashBufferTimer = 0;
        this.executeDash(this.dashBufferAngle);
      }
    }

    // Movement vs Active Dash
    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - dt);
      const dashSpeed = 2.6 / 0.14; // 18.57 u/s
      this.heroVx = this.dashDirX * dashSpeed;
      this.heroVy = this.dashDirY * dashSpeed;
      this.heroX += this.heroVx * dt;
      this.heroY += this.heroVy * dt;

      // Spawn petal motion trail ghost every 0.025s fading out over 0.3s (Spec Section 12)
      this.ghostSpawnTimer -= dt;
      if (this.ghostSpawnTimer <= 0) {
        this.ghostSpawnTimer = 0.025;
        this.visualEffects.push({
          id: this.nextEntityId++,
          kind: 'dash_ghost',
          x: this.heroX,
          y: this.heroY,
          targetX: this.heroX - this.dashDirX * 0.45,
          targetY: this.heroY - this.dashDirY * 0.45,
          angle: this.heroFacingAngle,
          radius: 0.44,
          arcRad: 0,
          color: PROFESSIONS[this.professionId]?.primaryColor ?? PALETTE.MINT_GREEN,
          timer: 0.3,
          maxTimer: 0.3,
        });
      }

      // Thorn Trail card: drop briar thorns along dash path
      const thornTrailLv = this.cards.thorn_trail ?? 0;
      if (thornTrailLv > 0 && this.elapsedTicks % 3 === 0) {
        this.hazards.push({
          id: this.nextEntityId++,
          kind: 'thorn_trail',
          x: this.heroX,
          y: this.heroY,
          radius: 0.9 * this.stats.areaMult,
          damage: Math.round(6 * thornTrailLv * this.stats.damageMult),
          tickTimer: 0.2,
          lifeTimer: 2.0,
          color: PALETTE.BLUSH_ROSE,
        });
      }

      // Dash-through enemy detection (+3 SP up to 5 enemies, plus Stormcaller teleport strike)
      for (const e of this.enemies) {
        if (e.hp <= 0 || this.dashHitIds.has(e.id)) continue;
        if (circlesOverlap(this.heroX, this.heroY, this.heroRadius + 0.35, e.x, e.y, e.radius)) {
          this.dashHitIds.add(e.id);
          if (this.dashHitIds.size <= 5) {
            const spamMult = this.dashHistoryTimestamps.length > 3 ? 0.5 : 1.0;
            this.addStylePoints(3 * spamMult);
          }
          if (this.professionId === 'stormcaller') {
            this.applyDamageToEnemy(e, 10 * this.stats.damageMult, false, 0.3, ['pierce', 'lightning']);
            this.visualEffects.push({
              id: this.nextEntityId++,
              kind: 'dash_strike_burst',
              x: e.x,
              y: e.y,
              targetX: e.x,
              targetY: e.y,
              angle: this.heroFacingAngle,
              radius: 0.95,
              arcRad: Math.PI * 2,
              color: PALETTE.SKY_BLUE,
              timer: 0.28,
              maxTimer: 0.28,
            });
          }
        }
      }

      // End of dash: Warden Thorn Burst & Shockwave / Ember Guard arrival bursts
      if (this.dashTimer <= 0) {
        if (this.professionId === 'warden') {
          const radius = 1.5 * this.stats.areaMult;
          this.damageEnemiesInCircle(
            this.heroX,
            this.heroY,
            radius,
            12 * this.stats.damageMult,
            0.8,
            ['area', 'pierce']
          );
          this.visualEffects.push({
            id: this.nextEntityId++,
            kind: 'dash_strike_burst',
            x: this.heroX,
            y: this.heroY,
            targetX: this.heroX,
            targetY: this.heroY,
            angle: this.heroFacingAngle,
            radius,
            arcRad: Math.PI * 2,
            color: PALETTE.BLUSH_ROSE,
            timer: 0.34,
            maxTimer: 0.34,
          });
        }

        const dashShockwaveLv = this.cards.shockwave ?? 0;
        if (dashShockwaveLv > 0) {
          const swRadius = (2.8 + dashShockwaveLv * 0.15) * this.stats.areaMult;
          this.damageEnemiesInCircle(
            this.heroX,
            this.heroY,
            swRadius,
            10 * dashShockwaveLv * this.stats.damageMult,
            0.55,
            ['shockwave_proc', 'area', 'impact']
          );
          this.visualEffects.push({
            id: this.nextEntityId++,
            kind: 'shockwave_blast',
            x: this.heroX,
            y: this.heroY,
            targetX: this.heroX,
            targetY: this.heroY,
            angle: this.heroFacingAngle,
            radius: swRadius,
            arcRad: dashShockwaveLv,
            color: PALETTE.BUTTER_YELLOW,
            timer: 0.46,
            maxTimer: 0.46,
          });
        }
      }
    } else {
      // Normal walking acceleration (30 u/s^2) and deceleration (24 u/s^2)
      const targetVx = this.moveIntentX * this.stats.moveSpeed;
      const targetVy = this.moveIntentY * this.stats.moveSpeed;
      const isMoving = Math.hypot(targetVx, targetVy) > 0.05;
      const accel = isMoving ? 30.0 : 24.0;

      const dvx = targetVx - this.heroVx;
      const dvy = targetVy - this.heroVy;
      const dvMag = Math.hypot(dvx, dvy);
      const maxStep = accel * dt;

      if (dvMag <= maxStep) {
        this.heroVx = targetVx;
        this.heroVy = targetVy;
      } else {
        this.heroVx += (dvx / dvMag) * maxStep;
        this.heroVy += (dvy / dvMag) * maxStep;
      }

      this.heroX += this.heroVx * dt;
      this.heroY += this.heroVy * dt;

      if (isMoving) {
        this.heroFacingAngle = Math.atan2(this.moveIntentY, this.moveIntentX);
      }
    }

    // Thorn border arena is spawned from the start of the game (28.0u) and slowly collapses
    // toward the Final Boss arena size (13.5u), then shrinks further in Boss Phases 2 & 3.
    if (this.arenaActive) {
      if (!this.finalBossSpawned) {
        const collapseT = clamp(
          this.elapsedSeconds / Simulation.FINAL_BOSS_SPAWN_SEC,
          0,
          1
        );
        this.arenaRadiusU =
          Simulation.INITIAL_ARENA_RADIUS_U +
          (Simulation.FINAL_BOSS_ARENA_RADIUS_P1_U - Simulation.INITIAL_ARENA_RADIUS_U) *
            collapseT;
      }
      const distFromArena = Math.hypot(
        this.heroX - this.arenaCenterX,
        this.heroY - this.arenaCenterY
      );
      this.isOutsideArena = distFromArena > this.arenaRadiusU;
      if (this.isOutsideArena && !this.runEnded) {
        const thornDps = 14.0;
        this.arenaOutDpsAccumulator += thornDps * dt;
        if (this.arenaOutDpsAccumulator >= 1) {
          const dmg = Math.floor(this.arenaOutDpsAccumulator);
          this.arenaOutDpsAccumulator -= dmg;
          this.applyArenaThornDamage(dmg);
        }
      } else {
        this.arenaOutDpsAccumulator = 0;
      }
    } else {
      this.isOutsideArena = false;
      this.arenaOutDpsAccumulator = 0;
    }

    // Lucky Clover step trail: spawns footstep clovers along the hero's path
    // Starts at really low intensity/frequency at Lv 1 (every 0.68u) and scales up with each level (Lv 5: every 0.20u)
    const movedDist = Math.hypot(this.heroX - this.heroPrevX, this.heroY - this.heroPrevY);
    const cloverLv = this.cards.lucky_clover ?? 0;
    if (cloverLv > 0) {
      if (movedDist > 0.001) {
        this.cloverStepDistanceAccum += movedDist;
        const stepSpacingU = Math.max(0.18, 0.80 - cloverLv * 0.12);
        while (this.cloverStepDistanceAccum >= stepSpacingU) {
          this.cloverStepDistanceAccum -= stepSpacingU;
          this.spawnLuckyCloverStep(cloverLv);
        }
      }
    } else {
      this.cloverStepDistanceAccum = 0;
    }

    // Permanent Arcana Persona Skin step trail (e.g. Zagreus × Naruto Hellfire footsteps, Void-ODM steps, Alchemy runes, Godspeed lightning)
    const activePersona =
      this.personaId && this.personaId !== 'adventurer_default'
        ? PERSONAS.find((p) => p.id === this.personaId)
        : undefined;
    if (activePersona) {
      if (movedDist > 0.001) {
        this.personaStepDistanceAccum += movedDist;
        const personaStepSpacingU = 0.26;
        while (this.personaStepDistanceAccum >= personaStepSpacingU) {
          this.personaStepDistanceAccum -= personaStepSpacingU;
          this.spawnPersonaStepEffect(activePersona.stepEffectKind, activePersona.accentColor);
        }
      }
    } else {
      this.personaStepDistanceAccum = 0;
    }
  }

  private activatePowerUp(powerUpId: PowerUpId): void {
    if (powerUpId === 'shield') {
      this.shieldHp = 40;
      this.shieldTimer = 20.0;
      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'aegis_burst',
        x: this.heroX,
        y: this.heroY,
        targetX: this.heroX,
        targetY: this.heroY,
        angle: this.heroFacingAngle,
        radius: 1.85,
        arcRad: Math.PI * 2,
        color: PALETTE.MINT_GREEN,
        timer: 0.42,
        maxTimer: 0.42,
      });
    } else if (powerUpId === 'freeze') {
      this.freezeAuraTimer = 3.5;
      for (const e of this.enemies) {
        e.freezeTimer = e.isFinalBoss || e.isMiniBoss ? 1.5 : 3.5;
      }
    } else if (powerUpId === 'fire_breath') {
      this.fireBreathTimer = 3.0;
      const egRadius = 2.15 * this.stats.areaMult;
      for (const e of this.enemies) {
        if (e.hp <= 0 || e.koTimer > 0) continue;
        if (circlesOverlap(this.heroX, this.heroY, egRadius, e.x, e.y, e.radius)) {
          e.burnTimer = Math.max(e.burnTimer, 3.0);
          e.burnDps = Math.max(e.burnDps, 12 * this.stats.damageMult);
          this.applyDamageToEnemy(e, 18 * this.stats.damageMult, false, 0.35, ['fire', 'area']);
        }
      }
      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'ember_burst',
        x: this.heroX,
        y: this.heroY,
        targetX: this.heroX,
        targetY: this.heroY,
        angle: this.heroFacingAngle,
        radius: egRadius,
        arcRad: 3,
        color: 0xfb923c,
        timer: 0.46,
        maxTimer: 0.46,
      });
      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'fire_cone',
        x: this.heroX,
        y: this.heroY,
        targetX: this.heroX + Math.cos(this.heroFacingAngle) * 3.5,
        targetY: this.heroY + Math.sin(this.heroFacingAngle) * 3.5,
        angle: this.heroFacingAngle,
        radius: 3.5,
        arcRad: (70 * Math.PI) / 180,
        color: 0xfb923c,
        timer: 0.28,
        maxTimer: 0.28,
      });
    } else if (powerUpId === 'magnet') {
      for (const p of this.pickups) {
        if (
          p.kind === 'xp_gem' ||
          p.kind === 'xp_cluster' ||
          p.kind === 'healing_seed' ||
          p.kind === 'heal_potion' ||
          p.kind === 'gold_coin'
        ) {
          p.magnetized = true;
          p.pullSpeed = 14.0;
        }
      }
    } else if (powerUpId === 'time_slow') {
      this.timeSlowTimer = 4.0;
    } else if (powerUpId === 'heal_potion') {
      this.healHero(20);
    }
    this.events.emit('PowerUpUsed', {
      powerUpId,
      x: this.heroX,
      y: this.heroY,
    });
  }

  private updateEnemiesMovementAndAI(dt: number): void {
    const timeSlowFactor = this.timeSlowTimer > 0 ? 0.4 : 1.0;
    const speedScale = calculateEnemySpeedScaling(this.elapsedSeconds) * this.stats.enemySpeedMult;

    // Limit concurrent active enemy telegraphs (crowd token pool <= 5) so waves remain readable
    let activeTelegraphs = 0;
    for (const e of this.enemies) {
      if (e.aiState === 'telegraph') activeTelegraphs++;
    }

    let overlappingHeroEnemies = 0;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]!;
      e.prevX = e.x;
      e.prevY = e.y;

      if (e.hitFlashTimer > 0) e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);

      // KO topple transition (0.22s before despawn)
      if (e.koTimer > 0) {
        e.koTimer -= dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.koTimer <= 0) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Burn damage over time
      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        if (this.elapsedTicks % 30 === 0) {
          this.applyDamageToEnemy(e, e.burnDps * 0.5, false, 0, ['burn_dot', 'fire']);
          if (e.hp <= 0) continue;
        }
      }

      // Poison damage over time (low DPS from Spore Pop gas cloud or Seed Blades Lv 2+ Venom)
      if (e.poisonTimer > 0) {
        e.poisonTimer = Math.max(0, e.poisonTimer - dt);
        if (this.elapsedTicks % 30 === 0) {
          this.applyDamageToEnemy(e, e.poisonDps * 0.5, false, 0, [
            'poison_dot',
            'spore_proc',
            'nature',
          ]);
          if (e.hp <= 0) continue;
        }
      }

      if (e.stormMarkTimer > 0) e.stormMarkTimer = Math.max(0, e.stormMarkTimer - dt);
      if (e.slowTimer > 0) e.slowTimer = Math.max(0, e.slowTimer - dt);
      if (e.webSlowTimer > 0) e.webSlowTimer = Math.max(0, e.webSlowTimer - dt);
      if (e.freezeTimer > 0) {
        e.freezeTimer = Math.max(0, e.freezeTimer - dt);
        if (!e.isFinalBoss && !e.isMiniBoss && !e.isArenaFlower && !e.isHeroGrave) continue;
      }

      // Stationary Big Arena Flowers & Hero Graves: stay rooted in place, never move, and never deal contact damage
      if (e.isArenaFlower || e.isHeroGrave) {
        e.vx = 0;
        e.vy = 0;
        if (
          e.isArenaFlower &&
          !this.finalBossSpawned &&
          Math.hypot(this.heroX - e.x, this.heroY - e.y) > 38.0
        ) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Special Monster despawn timer (Golden Beast & longer-lived Special Targets)
      if (e.isSpecial && !e.isInfiniteHp && !e.respawnOnDeath && !e.bestiaryKey) {
        e.despawnTimer -= dt;
        if (e.despawnTimer <= 0) {
          this.enemies.splice(i, 1);
          continue;
        }
      }

      // Recycle ordinary enemies that wander > 18u away from hero (Spec Section 8)
      // @llm-hook spawn-distance: respawn recycled enemies outside camera viewport (11.5 - 13.0u)
      const dxHero = this.heroX - e.x;
      const dyHero = this.heroY - e.y;
      const dHero = Math.hypot(dxHero, dyHero);
      if (
        (!e.isSpecial && !e.isMiniBoss && !e.isFinalBoss && dHero > 18.0) ||
        (e.bestiaryKey && dHero > 9.5)
      ) {
        if (e.bestiaryKey) {
          const respawnAngle = this.rng.spawn.range(0, Math.PI * 2);
          e.x = this.heroX + Math.cos(respawnAngle) * 5.2;
          e.y = this.heroY + Math.sin(respawnAngle) * 5.2;
        } else {
          const respawnPos = this.pickRingSpawnPoint(11.5, 13.0);
          e.x = respawnPos.x;
          e.y = respawnPos.y;
        }
        e.prevX = e.x;
        e.prevY = e.y;
        continue;
      }

      const petalWpn = this.weapons.find((w) => w.id === 'petal_orbit');
      const webSlowFactor =
        e.webSlowTimer > 0
          ? petalWpn?.evolved
            ? 0.55
            : clamp(0.7 - (petalWpn?.level ?? 1) * 0.015, 0.58, 0.7)
          : 1.0;
      const frostSlowFactor = e.slowTimer > 0 ? 0.65 : 1.0;
      const slowFactor = Math.min(webSlowFactor, frostSlowFactor);
      const bossFreezeFactor = e.freezeTimer > 0 ? 0.4 : 1.0;
      const moveSpeed = e.speed * speedScale * timeSlowFactor * slowFactor * bossFreezeFactor;
      // While Hero is in dash invisibility frames, enemies cannot update their tracking angle to the hero
      const heroInvisible = this.isHeroDashInvisible();
      const angleToHero = heroInvisible ? e.facingAngle : Math.atan2(dyHero, dxHero);

      // Update Final Boss Phases & Arena Rule (Spec Section 12)
      if (e.isFinalBoss) {
        const hpRatio = e.hp / e.maxHp;
        if (hpRatio <= 0.33 && e.bossPhase < 3) {
          e.bossPhase = 3;
          this.arenaRadiusU = Simulation.FINAL_BOSS_ARENA_RADIUS_P3_U;
          this.addStylePoints(25);
          this.events.emit('BossPhaseChanged', { phase: 3, arenaRadiusU: this.arenaRadiusU });
        } else if (hpRatio <= 0.66 && e.bossPhase < 2) {
          e.bossPhase = 2;
          this.arenaRadiusU = Simulation.FINAL_BOSS_ARENA_RADIUS_P2_U;
          this.addStylePoints(25);
          this.events.emit('BossPhaseChanged', { phase: 2, arenaRadiusU: this.arenaRadiusU });
        }
      }

      // Archetype AI State Machines
      if (e.isSpecial && e.specialId === 'golden_beast') {
        // Flees from hero
        e.facingAngle = angleToHero + Math.PI;
        e.x += Math.cos(e.facingAngle) * moveSpeed * dt;
        e.y += Math.sin(e.facingAngle) * moveSpeed * dt;
      } else if (e.isSpecial && e.specialId === 'bloom_giant') {
        // Golden Sunflower: randomly chooses between 3 telegraphed attack modes:
        // 1. 'sunflower_charge' (yellow charging arrow + slide charge)
        // 2. 'sunflower_seed_volley' (golden core swelling telegraph + 5-seed fan volley)
        // 3. 'sunflower_leaf_spiral' (rapid petal spin telegraph + 8-leaf 360 spiral throw)
        if (e.aiState === 'seek') {
          e.facingAngle = angleToHero;
          e.x += Math.cos(angleToHero) * moveSpeed * dt;
          e.y += Math.sin(angleToHero) * moveSpeed * dt;
          e.aiTimer = Math.max(0, e.aiTimer - dt);
          if (!heroInvisible && dHero <= 6.2 && e.aiTimer <= 0 && activeTelegraphs < 5) {
            const modes = [
              'sunflower_charge',
              'sunflower_seed_volley',
              'sunflower_leaf_spiral',
            ] as const;
            const pickedMode = this.rng.combat.pick(modes);
            e.bossAttackMode = pickedMode;
            e.aiState = 'telegraph';
            e.telegraphAngle = angleToHero;
            if (pickedMode === 'sunflower_charge') {
              e.telegraphDuration = 0.72;
              e.aiTimer = 0.72;
              e.telegraphTargetX = e.x + Math.cos(angleToHero) * 3.8;
              e.telegraphTargetY = e.y + Math.sin(angleToHero) * 3.8;
            } else if (pickedMode === 'sunflower_seed_volley') {
              e.telegraphDuration = 0.68;
              e.aiTimer = 0.68;
              e.telegraphTargetX = this.heroX;
              e.telegraphTargetY = this.heroY;
            } else {
              e.telegraphDuration = 0.75;
              e.aiTimer = 0.75;
              e.telegraphTargetX = e.x;
              e.telegraphTargetY = e.y;
            }
            activeTelegraphs++;
          }
        } else if (e.aiState === 'telegraph') {
          e.aiTimer -= dt;
          const mode = e.bossAttackMode ?? 'sunflower_charge';
          if (mode === 'sunflower_leaf_spiral') {
            // Telegraph behavior: spins petals rapidly in place
            e.facingAngle += 14.0 * dt;
          } else if (mode === 'sunflower_seed_volley') {
            // Telegraph behavior: tracks hero while puffing golden seed core
            if (!heroInvisible) {
              e.facingAngle = angleToHero;
              e.telegraphAngle = angleToHero;
              e.telegraphTargetX = this.heroX;
              e.telegraphTargetY = this.heroY;
            }
          } else {
            // Telegraph behavior: crouches slightly backward before sliding along yellow arrow
            e.facingAngle = e.telegraphAngle;
          }

          if (e.aiTimer <= 0) {
            if (mode === 'sunflower_charge') {
              e.aiState = 'charge';
              e.aiTimer = 0.42;
            } else if (mode === 'sunflower_seed_volley') {
              // Fire 5 sunflower seeds in a fan
              for (let s = -2; s <= 2; s++) {
                const a = e.telegraphAngle + s * 0.19;
                this.projectiles.push({
                  id: this.nextEntityId++,
                  isEnemy: true,
                  projectileKind: 'sunflower_seed',
                  x: e.x,
                  y: e.y,
                  prevX: e.x,
                  prevY: e.y,
                  vx: Math.cos(a) * 5.6,
                  vy: Math.sin(a) * 5.6,
                  radius: 0.24,
                  damage: Math.round(e.contactDamage * 1.4),
                  isCrit: false,
                  pierceRemaining: 0,
                  lifeTimer: 2.6,
                  color: PALETTE.BUTTER_YELLOW,
                  weaponTags: [],
                  hitEnemyIds: new Set(),
                });
              }
              e.aiState = 'recover';
              e.aiTimer = 1.05;
            } else {
              // Fire 8 razor sunflower leaves in a radial spiral
              for (let l = 0; l < 8; l++) {
                const a = e.telegraphAngle + (l / 8) * Math.PI * 2;
                this.projectiles.push({
                  id: this.nextEntityId++,
                  isEnemy: true,
                  projectileKind: 'sunflower_leaf',
                  x: e.x,
                  y: e.y,
                  prevX: e.x,
                  prevY: e.y,
                  vx: Math.cos(a) * 4.8,
                  vy: Math.sin(a) * 4.8,
                  radius: 0.28,
                  damage: Math.round(e.contactDamage * 1.35),
                  isCrit: false,
                  pierceRemaining: 0,
                  lifeTimer: 2.8,
                  color: PALETTE.MINT_GREEN,
                  weaponTags: [],
                  hitEnemyIds: new Set(),
                });
              }
              e.aiState = 'recover';
              e.aiTimer = 1.15;
            }
          }
        } else if (e.aiState === 'charge') {
          e.aiTimer -= dt;
          const chargeSpeed = 7.6 * timeSlowFactor;
          e.x += Math.cos(e.telegraphAngle) * chargeSpeed * dt;
          e.y += Math.sin(e.telegraphAngle) * chargeSpeed * dt;
          if (e.aiTimer <= 0) {
            e.aiState = 'recover';
            e.aiTimer = 0.95;
          }
        } else {
          e.aiTimer -= dt;
          if (e.aiTimer <= 0) {
            e.aiState = 'seek';
            e.aiTimer = 0.35;
          }
        }
      } else if (e.archetypeId === 'dasher') {
        if (e.aiState === 'seek') {
          e.facingAngle = angleToHero;
          e.x += Math.cos(angleToHero) * moveSpeed * dt;
          e.y += Math.sin(angleToHero) * moveSpeed * dt;
          if (!heroInvisible && dHero <= 4.5 && activeTelegraphs < 5) {
            e.aiState = 'telegraph';
            e.aiTimer = 0.6; // Spec Section 8: 0.6s telegraph
            e.telegraphDuration = 0.6;
            e.telegraphAngle = angleToHero;
            e.telegraphTargetX = e.x + Math.cos(angleToHero) * 3.2;
            e.telegraphTargetY = e.y + Math.sin(angleToHero) * 3.2;
            activeTelegraphs++;
          }
        } else if (e.aiState === 'telegraph') {
          e.aiTimer -= dt;
          if (e.aiTimer <= 0) {
            e.aiState = 'charge';
            e.aiTimer = 0.35;
          }
        } else if (e.aiState === 'charge') {
          e.aiTimer -= dt;
          const chargeSpeed = 7.0 * timeSlowFactor;
          e.x += Math.cos(e.telegraphAngle) * chargeSpeed * dt;
          e.y += Math.sin(e.telegraphAngle) * chargeSpeed * dt;
          if (e.aiTimer <= 0) {
            e.aiState = 'recover';
            e.aiTimer = 0.9;
          }
        } else {
          e.aiTimer -= dt;
          if (e.aiTimer <= 0) e.aiState = 'seek';
        }
      } else if (e.archetypeId === 'spitter') {
        e.facingAngle = angleToHero;
        if (dHero > 4.6) {
          e.x += Math.cos(angleToHero) * moveSpeed * dt;
          e.y += Math.sin(angleToHero) * moveSpeed * dt;
        } else if (dHero < 2.8) {
          e.x -= Math.cos(angleToHero) * moveSpeed * 0.85 * dt;
          e.y -= Math.sin(angleToHero) * moveSpeed * 0.85 * dt;
        }
        e.aiTimer -= dt;
        // Spitters cannot acquire lock to fire while hero is in dash invisibility frames
        if (!heroInvisible && e.aiTimer <= 0 && dHero <= 6.5) {
          e.aiTimer = 2.2;
          const shots = e.isSpecial && e.specialId === 'mirror_wisp' ? 3 : 1;
          for (let s = 0; s < shots; s++) {
            const spread = shots === 1 ? 0 : (s - 1) * 0.25;
            const shotAngle = angleToHero + spread;
            this.projectiles.push({
              id: this.nextEntityId++,
              isEnemy: true,
              x: e.x,
              y: e.y,
              prevX: e.x,
              prevY: e.y,
              vx: Math.cos(shotAngle) * 4.5,
              vy: Math.sin(shotAngle) * 4.5,
              radius: 0.22,
              damage: Math.round(e.contactDamage * 1.6),
              isCrit: false,
              pierceRemaining: 0,
              lifeTimer: 2.5,
              color: PALETTE.CRIMSON_WARN,
              weaponTags: [],
              hitEnemyIds: new Set(),
            });
          }
        }
      } else if (e.archetypeId === 'brute' || e.isMiniBoss || e.isFinalBoss) {
        if (e.aiState === 'seek') {
          e.facingAngle = angleToHero;
          e.x += Math.cos(angleToHero) * moveSpeed * dt;
          e.y += Math.sin(angleToHero) * moveSpeed * dt;
          e.aiTimer -= dt;
          const slamRange = e.isFinalBoss ? 2.4 : 1.6;
          if (
            !heroInvisible &&
            (dHero <= slamRange || (e.isFinalBoss && e.aiTimer <= 0)) &&
            activeTelegraphs < 5
          ) {
            e.aiState = 'telegraph';
            e.telegraphDuration = e.isMiniBoss || e.isFinalBoss ? 0.85 : 0.75;
            e.aiTimer = e.telegraphDuration;
            e.telegraphTargetX = e.x;
            e.telegraphTargetY = e.y;
            activeTelegraphs++;
          }
        } else if (e.aiState === 'telegraph') {
          e.aiTimer -= dt;
          if (e.aiTimer <= 0) {
            // Execute ground slam + radial boss burst in Phase 2/3
            const slamRadius = e.isFinalBoss ? 2.3 : e.isMiniBoss ? 2.0 : 1.6;
            if (
              !this.isHeroDashInvisible() &&
              dist(this.heroX, this.heroY, e.telegraphTargetX, e.telegraphTargetY) <=
                slamRadius + this.heroRadius
            ) {
              this.damageHero(Math.round(e.contactDamage * 1.4));
            }
            if (e.isFinalBoss && e.bossPhase >= 2) {
              const burstCount = e.bossPhase === 3 ? 10 : 8;
              for (let b = 0; b < burstCount; b++) {
                const a = (b / burstCount) * Math.PI * 2 + this.elapsedSeconds;
                this.projectiles.push({
                  id: this.nextEntityId++,
                  isEnemy: true,
                  x: e.x,
                  y: e.y,
                  prevX: e.x,
                  prevY: e.y,
                  vx: Math.cos(a) * 4.2,
                  vy: Math.sin(a) * 4.2,
                  radius: 0.25,
                  damage: Math.round(e.contactDamage * 1.1),
                  isCrit: false,
                  pierceRemaining: 0,
                  lifeTimer: 2.6,
                  color: PALETTE.CRIMSON_WARN,
                  weaponTags: [],
                  hitEnemyIds: new Set(),
                });
              }
            }
            e.aiState = 'recover';
            e.aiTimer = e.isFinalBoss && e.bossPhase === 3 ? 1.8 : 2.6;
          }
        } else {
          e.aiTimer -= dt;
          if (e.aiTimer <= 0) e.aiState = 'seek';
        }
      } else if (e.archetypeId === 'shielded') {
        // Rotates facing angle with capped speed so flanking works (cannot track while hero is invisible)
        if (!heroInvisible) {
          const diff = angleDifference(e.facingAngle, angleToHero);
          const maxTurn = 2.1 * dt;
          e.facingAngle += clamp(diff, -maxTurn, maxTurn);
        }
        e.x += Math.cos(e.facingAngle) * moveSpeed * dt;
        e.y += Math.sin(e.facingAngle) * moveSpeed * dt;
      } else {
        // Chaser & Splitter
        e.facingAngle = angleToHero;
        e.x += Math.cos(angleToHero) * moveSpeed * dt;
        e.y += Math.sin(angleToHero) * moveSpeed * dt;
        if (e.isSpecial && e.specialId === 'brood_mother') {
          e.aiTimer -= dt;
          if (e.aiTimer <= 0 && this.enemies.length < 140) {
            e.aiTimer = 2.5;
            this.spawnEnemy('chaser', e.x + 0.6, e.y, false);
            this.spawnEnemy('chaser', e.x - 0.6, e.y, false);
          }
        }
      }

      // Keep Final Boss inside its circular thorn arena so it never wanders outside the briar ring
      if (e.isFinalBoss && this.arenaActive) {
        const bDx = e.x - this.arenaCenterX;
        const bDy = e.y - this.arenaCenterY;
        const bDist = Math.hypot(bDx, bDy);
        const maxBossDist = Math.max(2.0, this.arenaRadiusU - e.radius * 0.65);
        if (bDist > maxBossDist && bDist > 0.001) {
          e.x = this.arenaCenterX + (bDx / bDist) * maxBossDist;
          e.y = this.arenaCenterY + (bDy / bDist) * maxBossDist;
        }
      }

      // Soft separation between nearby enemies & contact damage vs Hero (ignored during dash invisibility frames)
      if (
        !heroInvisible &&
        circlesOverlap(this.heroX, this.heroY, this.heroRadius, e.x, e.y, e.radius)
      ) {
        overlappingHeroEnemies++;
        if (dHero > 0.001 && overlappingHeroEnemies <= 4) {
          // Soft push on hero (0.3 u/s per overlapping enemy)
          this.heroX += (dxHero / dHero) * 0.3 * dt;
          this.heroY += (dyHero / dHero) * 0.3 * dt;
        }
        const contactDmg = e.aiState === 'charge' ? e.contactDamage * 1.4 : e.contactDamage;
        this.damageHero(Math.round(contactDmg));
      }
    }

    // Soft enemy-to-enemy separation pass so swarms form a readable ring rather than 1 stacked pixel
    const len = this.enemies.length;
    for (let i = 0; i < len; i++) {
      const a = this.enemies[i]!;
      if (a.koTimer > 0) continue;
      for (let j = i + 1; j < Math.min(i + 12, len); j++) {
        const b = this.enemies[j]!;
        if (b.koTimer > 0) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = (a.radius + b.radius) * 0.85;
        const dSq = dx * dx + dy * dy;
        if (dSq > 0.0001 && dSq < minDist * minDist) {
          const aStatic = Boolean(a.isArenaFlower || a.isHeroGrave);
          const bStatic = Boolean(b.isArenaFlower || b.isHeroGrave);
          if (aStatic && bStatic) continue;
          const d = Math.sqrt(dSq);
          const overlap = (minDist - d) * 0.35;
          const nx = dx / d;
          const ny = dy / d;
          if (aStatic) {
            b.x += nx * overlap * 2;
            b.y += ny * overlap * 2;
          } else if (bStatic) {
            a.x -= nx * overlap * 2;
            a.y -= ny * overlap * 2;
          } else {
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;
          }
        }
      }
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]!;
      p.prevX = p.x;
      p.prevY = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifeTimer -= dt;

      if (p.lifeTimer <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.isEnemy) {
        if (
          !this.isHeroDashInvisible() &&
          ccdSegmentHitsCircle(
            p.prevX,
            p.prevY,
            p.x,
            p.y,
            p.radius,
            this.heroX,
            this.heroY,
            this.heroRadius
          )
        ) {
          this.damageHero(p.damage);
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      // Player projectile vs Enemies (using SpatialHashGrid + CCD sweep)
      const hitCandidates: number[] = [];
      this.spatialGrid.queryCircle(p.x, p.y, p.radius + 1.2, hitCandidates);
      let consumed = false;
      for (const enemyId of hitCandidates) {
        if (p.hitEnemyIds.has(enemyId)) continue;
        const enemy = this.enemies.find((e) => e.id === enemyId);
        if (!enemy || enemy.hp <= 0 || enemy.koTimer > 0) continue;

        if (
          ccdSegmentHitsCircle(
            p.prevX,
            p.prevY,
            p.x,
            p.y,
            p.radius,
            enemy.x,
            enemy.y,
            enemy.radius
          )
        ) {
          p.hitEnemyIds.add(enemy.id);
          this.applyDamageToEnemy(enemy, p.damage, p.isCrit, 0.35, p.weaponTags);

          // Chain Bloom synergy card: projectiles chain to 1 nearby enemy for 60% damage
          const chainBloomLv = this.cards.chain_bloom ?? 0;
          if (chainBloomLv > 0) {
            const chainTarget = this.findNearestEnemy(enemy.x, enemy.y, 2.8, p.hitEnemyIds);
            if (chainTarget) {
              this.applyDamageToEnemy(
                chainTarget,
                p.damage * (0.5 + 0.1 * chainBloomLv),
                false,
                0.2,
                ['projectile', 'lightning']
              );
              this.visualEffects.push({
                id: this.nextEntityId++,
                kind: 'chain_bolt',
                x: enemy.x,
                y: enemy.y,
                targetX: chainTarget.x,
                targetY: chainTarget.y,
                angle: 0,
                radius: 0.2,
                arcRad: 0,
                color: PALETTE.SKY_BLUE,
                timer: 0.16,
                maxTimer: 0.16,
              });
            }
          }

          if (p.pierceRemaining > 0) {
            p.pierceRemaining--;
          } else {
            consumed = true;
            break;
          }
        }
      }

      if (consumed) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  public getOrbitPetalCount(): number {
    const petalStormLv = this.cards.petal_storm ?? 0;
    const petalWpn = this.weapons.find((w) => w.id === 'petal_orbit');
    if (!petalWpn) return petalStormLv;
    const baseCount = WEAPONS.petal_orbit?.baseCount ?? 2;
    return baseCount + Math.floor(petalWpn.level / 2) + (petalWpn.evolved ? 2 : 0) + petalStormLv;
  }

  public getOrbitRadiusU(): number {
    const petalWpn = this.weapons.find((w) => w.id === 'petal_orbit');
    if (!petalWpn) {
      return 1.35 * this.stats.areaMult;
    }
    const baseReach = WEAPONS.petal_orbit?.baseReach ?? 1.45;
    const effectiveReach =
      (baseReach + (petalWpn.level >= 6 ? 0.35 : 0)) * this.stats.reachMult;
    const effectiveArea = this.stats.areaMult * (petalWpn.level >= 3 ? 1.18 : 1.0);
    return effectiveReach * effectiveArea;
  }

  private updateWeapons(dt: number): void {
    // Update bonus orbiting petals from Petal Storm card if Hero doesn't own Petal Orbit
    const petalStormLv = this.cards.petal_storm ?? 0;
    const ownsPetalOrbit = this.weapons.some((w) => w.id === 'petal_orbit');
    if (petalStormLv > 0 && !ownsPetalOrbit) {
      this.stepOrbitingPetals(
        dt,
        this.getOrbitPetalCount(),
        this.getOrbitRadiusU(),
        8 * this.stats.damageMult,
        0.35,
        this.bonusOrbitCooldowns,
        false
      );
    }

    for (const w of this.weapons) {
      const def = WEAPONS[w.id];
      if (!def) continue;

      const lvMult = 1 + (w.level - 1) * 0.18 + (w.evolved ? 0.35 : 0);
      const effectiveDamage = def.baseDamage * lvMult * this.stats.damageMult;
      const effectiveReach =
        (def.baseReach + (w.level >= 6 ? 0.35 : 0)) * this.stats.reachMult;
      const effectiveArea = this.stats.areaMult * (w.level >= 3 ? 1.18 : 1.0);
      const baseCd =
        def.baseCooldown *
        (w.level >= 7 ? 0.78 : w.level >= 4 ? 0.88 : 1.0) *
        (w.evolved ? 0.85 : 1.0);
      const effectiveCooldown = Math.max(0.18, baseCd / this.stats.attackSpeedMult);

      if (def.shape === 'orbit') {
        this.stepOrbitingPetals(
          dt,
          this.getOrbitPetalCount(),
          this.getOrbitRadiusU(),
          effectiveDamage,
          effectiveCooldown,
          w.orbitHitCooldowns,
          w.evolved
        );
        continue;
      }

      if (w.cooldownTimer > 0) {
        w.cooldownTimer = Math.max(0, w.cooldownTimer - dt);
      }

      if (w.phase === 'ready') {
        if (w.cooldownTimer <= 0) {
          // Acquire target within reach + 1.0u (Spec Section 5)
          const acquireRange = effectiveReach + 1.0;
          const target = this.acquireTarget(acquireRange);
          if (target) {
            w.phase = 'windup';
            w.phaseTimer = 0.06; // 60ms wind-up
            w.lockedTargetX = target.x;
            w.lockedTargetY = target.y;
            w.lockedAngle = Math.atan2(target.y - this.heroY, target.x - this.heroX);
            this.heroFacingAngle = w.lockedAngle;
          }
        }
      } else if (w.phase === 'windup') {
        w.phaseTimer -= dt;
        if (w.phaseTimer <= 0) {
          w.phase = 'active';
          w.phaseTimer = 0.08;
          w.cooldownTimer = effectiveCooldown;
          w.swingCounter++;

          this.fireWeaponAttack(w, def.shape, effectiveDamage, effectiveReach, effectiveArea, false);

          // Echo Swing behavior card: repeat swing every Nth attack with a visible doubled echo animation
          const echoLv = this.cards.echo_swing ?? 0;
          if (echoLv > 0) {
            const everyN = echoLv >= 3 ? 2 : echoLv === 2 ? 3 : 4;
            if (w.swingCounter % everyN === 0) {
              this.fireWeaponAttack(
                w,
                def.shape,
                effectiveDamage * 0.85,
                effectiveReach,
                effectiveArea,
                true
              );
            }
          }
        }
      } else if (w.phase === 'active') {
        w.phaseTimer -= dt;
        if (w.phaseTimer <= 0) {
          w.phase = 'recovery';
          w.phaseTimer = 0.05;
        }
      } else if (w.phase === 'recovery') {
        w.phaseTimer -= dt;
        if (w.phaseTimer <= 0) {
          w.phase = 'ready';
        }
      }
    }
  }

  private stepOrbitingPetals(
    dt: number,
    petalCount: number,
    orbitRadius: number,
    damage: number,
    hitInterval: number,
    cooldownMap: Map<number, number>,
    evolved: boolean
  ): void {
    const quickHandsLv = this.cards.quick_hands ?? 0;
    const spinSpeedMult = this.stats.attackSpeedMult * (1 + quickHandsLv * 0.15);
    this.bonusOrbitAngle =
      (this.bonusOrbitAngle + (evolved ? 3.4 : 2.5) * spinSpeedMult * dt) % (Math.PI * 2);

    for (const [eId, timer] of cooldownMap.entries()) {
      if (timer <= dt) cooldownMap.delete(eId);
      else cooldownMap.set(eId, timer - dt);
    }

    for (let i = 0; i < petalCount; i++) {
      const a = this.bonusOrbitAngle + (i / petalCount) * Math.PI * 2;
      const px = this.heroX + Math.cos(a) * orbitRadius;
      const py = this.heroY + Math.sin(a) * orbitRadius;

      const petalHits: number[] = [];
      this.spatialGrid.queryCircle(px, py, 0.45, petalHits);
      for (const enemyId of petalHits) {
        if (cooldownMap.has(enemyId)) continue;
        const enemy = this.enemies.find((e) => e.id === enemyId);
        if (!enemy || enemy.hp <= 0 || enemy.koTimer > 0) continue;
        if (circlesOverlap(px, py, 0.38, enemy.x, enemy.y, enemy.radius)) {
          cooldownMap.set(enemyId, hitInterval);
          const petalWpn = this.weapons.find((w) => w.id === 'petal_orbit');
          const pLv = petalWpn?.level ?? 1;
          const webSlowDur = 1.65 + pLv * 0.12 + (evolved ? 0.55 : 0);
          enemy.slowTimer = Math.max(enemy.slowTimer, webSlowDur);
          enemy.webSlowTimer = Math.max(enemy.webSlowTimer, webSlowDur);
          const isCrit = this.rng.combat.chance(this.stats.critChance);
          this.applyDamageToEnemy(enemy, damage, isCrit, 0.3, ['area', 'nature']);
        }
      }
    }
  }

  private fireWeaponAttack(
    w: WeaponRuntimeState,
    shape: WeaponShape,
    damage: number,
    reach: number,
    areaMult: number,
    isEcho = false
  ): void {
    const def = WEAPONS[w.id]!;
    const color = isEcho ? PALETTE.SKY_BLUE : w.evolved ? def.evolvedColor : def.color;
    const isCrit = this.rng.combat.chance(this.stats.critChance);
    const echoAngleOffset = isEcho ? 0.24 : 0;
    const attackAngle = w.lockedAngle + echoAngleOffset;

    if (shape === 'arc') {
      const arcDeg = (def.baseArcDeg ?? 115) * (w.level >= 3 ? 1.2 : 1.0);
      const arcRad = (arcDeg * Math.PI) / 180;
      this.damageEnemiesInArc(
        this.heroX,
        this.heroY,
        reach,
        attackAngle,
        arcRad,
        damage,
        def.baseKnockback,
        def.tags,
        false,
        isCrit
      );
      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'slash_arc',
        x: this.heroX,
        y: this.heroY,
        targetX: w.lockedTargetX,
        targetY: w.lockedTargetY,
        angle: attackAngle,
        radius: isEcho ? reach * 1.08 : reach,
        arcRad,
        color,
        timer: isEcho ? 0.24 : 0.18,
        maxTimer: isEcho ? 0.24 : 0.18,
        isEcho,
      });

      // Lv 8 or Evolved back-swing
      if (w.level >= 8 || w.evolved) {
        const backAngle = attackAngle + Math.PI;
        this.damageEnemiesInArc(
          this.heroX,
          this.heroY,
          reach * 0.9,
          backAngle,
          arcRad * 0.85,
          damage * 0.75,
          def.baseKnockback,
          def.tags,
          false,
          isCrit
        );
        this.visualEffects.push({
          id: this.nextEntityId++,
          kind: 'slash_arc',
          x: this.heroX,
          y: this.heroY,
          targetX: this.heroX + Math.cos(backAngle) * reach,
          targetY: this.heroY + Math.sin(backAngle) * reach,
          angle: backAngle,
          radius: reach * 0.9,
          arcRad: arcRad * 0.85,
          color,
          timer: isEcho ? 0.24 : 0.18,
          maxTimer: isEcho ? 0.24 : 0.18,
          isEcho,
        });
      }

      // Evolved Verdant Edge or Piercing Slash synergy: fire a piercing crescent projectile
      const piercingSlashLv = this.cards.piercing_slash ?? 0;
      if (w.evolved || piercingSlashLv > 0) {
        this.projectiles.push({
          id: this.nextEntityId++,
          isEnemy: false,
          x: this.heroX,
          y: this.heroY,
          prevX: this.heroX,
          prevY: this.heroY,
          vx: Math.cos(attackAngle) * 8.5,
          vy: Math.sin(attackAngle) * 8.5,
          radius: 0.45 * areaMult,
          damage: damage * (w.evolved ? 0.65 : 0.45),
          isCrit,
          pierceRemaining: 2 + piercingSlashLv,
          lifeTimer: 0.55,
          color,
          weaponTags: ['slash', 'pierce'],
          hitEnemyIds: new Set(),
        });
      }
    } else if (shape === 'line') {
      const endX = this.heroX + Math.cos(attackAngle) * reach;
      const endY = this.heroY + Math.sin(attackAngle) * reach;
      const halfWidth = ((def.baseWidth ?? 0.5) * areaMult) / 2;
      const maxPierce = (def.basePierce ?? 3) + (w.level >= 3 ? 2 : 0) + (w.evolved ? 3 : 0);

      const candidates = this.enemies
        .filter(
          (e) =>
            e.hp > 0 &&
            e.koTimer <= 0 &&
            capsuleOverlapsCircle(
              this.heroX,
              this.heroY,
              endX,
              endY,
              halfWidth,
              e.x,
              e.y,
              e.radius
            )
        )
        .sort(
          (a, b) =>
            distSq(this.heroX, this.heroY, a.x, a.y) -
            distSq(this.heroX, this.heroY, b.x, b.y)
        );

      for (let i = 0; i < Math.min(maxPierce, candidates.length); i++) {
        this.applyDamageToEnemy(
          candidates[i]!,
          damage,
          isCrit,
          def.baseKnockback,
          def.tags
        );
      }

      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'spear_line',
        x: this.heroX,
        y: this.heroY,
        targetX: endX,
        targetY: endY,
        angle: attackAngle,
        radius: halfWidth * 2,
        arcRad: 0,
        color,
        timer: isEcho ? 0.22 : 0.16,
        maxTimer: isEcho ? 0.22 : 0.16,
        isEcho,
      });
    } else if (shape === 'circle') {
      const radius = (def.baseRadius ?? 1.6) * areaMult;
      const impactX = isEcho ? w.lockedTargetX + Math.cos(attackAngle) * 0.35 : w.lockedTargetX;
      const impactY = isEcho ? w.lockedTargetY + Math.sin(attackAngle) * 0.35 : w.lockedTargetY;
      this.damageEnemiesInCircle(
        impactX,
        impactY,
        radius,
        damage,
        def.baseKnockback,
        def.tags,
        isCrit
      );
      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: w.id === 'bloom_hammer' ? 'bloom_hammer' : 'circle_blast',
        x: impactX,
        y: impactY,
        targetX: impactX,
        targetY: impactY,
        angle: attackAngle,
        radius,
        arcRad: Math.PI * 2,
        color,
        timer: w.id === 'bloom_hammer' ? (isEcho ? 0.54 : 0.46) : (isEcho ? 0.32 : 0.25),
        maxTimer: w.id === 'bloom_hammer' ? (isEcho ? 0.54 : 0.46) : (isEcho ? 0.32 : 0.25),
        isEcho,
      });
    } else if (shape === 'projectile') {
      const count =
        (def.baseCount ?? 1) +
        (w.level >= 6 ? 2 : w.level >= 3 ? 1 : 0) +
        (w.evolved ? 2 : 0);
      const speed = (def.baseProjSpeed ?? 9.5) * this.stats.reachMult;
      const pierce = (def.basePierce ?? 1) + (w.level >= 5 ? 1 : 0) + (w.evolved ? 2 : 0);

      const projTags =
        w.id === 'seed_blades' && (w.level >= 2 || w.evolved)
          ? [...def.tags, 'seed_venom']
          : def.tags;

      for (let i = 0; i < count; i++) {
        const spread = count === 1 ? 0 : (i - (count - 1) / 2) * 0.16;
        const a = attackAngle + spread;
        this.projectiles.push({
          id: this.nextEntityId++,
          isEnemy: false,
          x: this.heroX,
          y: this.heroY,
          prevX: this.heroX,
          prevY: this.heroY,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          radius: 0.26 * areaMult,
          damage,
          isCrit,
          pierceRemaining: pierce,
          lifeTimer: reach / speed,
          color,
          weaponTags: projTags,
          hitEnemyIds: new Set(),
        });
      }
      if (isEcho) {
        this.visualEffects.push({
          id: this.nextEntityId++,
          kind: 'slash_arc',
          x: this.heroX,
          y: this.heroY,
          targetX: w.lockedTargetX,
          targetY: w.lockedTargetY,
          angle: attackAngle,
          radius: 1.15,
          arcRad: 1.2,
          color: PALETTE.SKY_BLUE,
          timer: 0.22,
          maxTimer: 0.22,
          isEcho: true,
        });
      }
    } else if (shape === 'chain') {
      const bounces =
        (def.baseCount ?? 3) +
        (w.level >= 6 ? 2 : w.level >= 3 ? 1 : 0) +
        (w.evolved ? 2 : 0);
      const hitIds = new Set<number>();
      let currX = this.heroX;
      let currY = this.heroY;

      for (let b = 0; b < bounces; b++) {
        const nextTarget = this.findNearestEnemy(currX, currY, reach, hitIds);
        if (!nextTarget) break;
        hitIds.add(nextTarget.id);
        this.applyDamageToEnemy(
          nextTarget,
          damage * Math.pow(0.9, b),
          isCrit || w.evolved,
          def.baseKnockback,
          [...def.tags, 'lightning']
        );
        this.visualEffects.push({
          id: this.nextEntityId++,
          kind: 'chain_bolt',
          x: currX,
          y: currY,
          targetX: nextTarget.x,
          targetY: nextTarget.y,
          angle: 0,
          radius: 0.2,
          arcRad: 0,
          color,
          timer: isEcho ? 0.22 : 0.16,
          maxTimer: isEcho ? 0.22 : 0.16,
          isEcho,
        });
        currX = nextTarget.x;
        currY = nextTarget.y;
      }
    }

    this.events.emit('WeaponSwung', {
      weaponId: w.id,
      shape,
      x: this.heroX,
      y: this.heroY,
      targetX: w.lockedTargetX,
      targetY: w.lockedTargetY,
      angle: w.lockedAngle,
      reach,
      arcRad: ((def.baseArcDeg ?? 115) * Math.PI) / 180,
      color,
      evolved: w.evolved,
    });
  }

  /**
   * Target Selection Priority (Spec Section 5):
   * 1. Special Monsters & Bosses within acquireRange
   * 2. Nearest living enemy
   * 3. Tie-breaker: lowest current HP, then lowest enemy ID
   */
  private acquireTarget(acquireRange: number): SimEnemy | null {
    const maxDistSq = acquireRange * acquireRange;
    let best: SimEnemy | null = null;
    let bestIsPriority = false;
    let bestDistSq = Infinity;

    for (const e of this.enemies) {
      if (e.hp <= 0 || e.koTimer > 0) continue;
      const dSq = distSq(this.heroX, this.heroY, e.x, e.y);
      if (dSq > maxDistSq) continue;

      const isPriority = e.isSpecial || e.isMiniBoss || e.isFinalBoss;
      if (isPriority && !bestIsPriority) {
        best = e;
        bestIsPriority = true;
        bestDistSq = dSq;
      } else if (isPriority === bestIsPriority) {
        if (dSq < bestDistSq - 0.01) {
          best = e;
          bestDistSq = dSq;
        } else if (Math.abs(dSq - bestDistSq) <= 0.01 && best) {
          if (e.hp < best.hp || (e.hp === best.hp && e.id < best.id)) {
            best = e;
            bestDistSq = dSq;
          }
        }
      }
    }
    return best;
  }

  private findNearestEnemy(
    x: number,
    y: number,
    maxRange: number,
    excludeIds: Set<number>
  ): SimEnemy | null {
    const maxDistSq = maxRange * maxRange;
    let best: SimEnemy | null = null;
    let bestDistSq = maxDistSq;

    for (const e of this.enemies) {
      if (e.hp <= 0 || e.koTimer > 0 || excludeIds.has(e.id)) continue;
      const dSq = distSq(x, y, e.x, e.y);
      if (dSq <= bestDistSq) {
        bestDistSq = dSq;
        best = e;
      }
    }
    return best;
  }

  private damageEnemiesInArc(
    originX: number,
    originY: number,
    reach: number,
    facingAngle: number,
    arcRad: number,
    rawDamage: number,
    knockback: number,
    tags: string[],
    applyBurn = false,
    isCrit = false
  ): void {
    const arcHits: number[] = [];
    this.spatialGrid.queryCircle(originX, originY, reach + 1.0, arcHits);
    for (const enemyId of arcHits) {
      const enemy = this.enemies.find((e) => e.id === enemyId);
      if (!enemy || enemy.hp <= 0 || enemy.koTimer > 0) continue;
      if (
        arcOverlapsCircle(
          originX,
          originY,
          reach,
          facingAngle,
          arcRad,
          enemy.x,
          enemy.y,
          enemy.radius
        )
      ) {
        if (applyBurn) {
          enemy.burnTimer = 2.5;
          enemy.burnDps = 8;
        }
        this.applyDamageToEnemy(enemy, rawDamage, isCrit, knockback, tags);
      }
    }
  }

  private damageEnemiesInCircle(
    cx: number,
    cy: number,
    radius: number,
    rawDamage: number,
    knockback: number,
    tags: string[],
    isCrit = false
  ): void {
    const circleHits: number[] = [];
    this.spatialGrid.queryCircle(cx, cy, radius + 1.0, circleHits);
    for (const enemyId of circleHits) {
      const enemy = this.enemies.find((e) => e.id === enemyId);
      if (!enemy || enemy.hp <= 0 || enemy.koTimer > 0) continue;
      if (circlesOverlap(cx, cy, radius, enemy.x, enemy.y, enemy.radius)) {
        this.applyDamageToEnemy(enemy, rawDamage, isCrit, knockback, tags);
      }
    }
  }

  private applyDamageToEnemy(
    enemy: SimEnemy,
    rawDamage: number,
    isCrit: boolean,
    knockback: number,
    tags: string[]
  ): void {
    if (enemy.hp <= 0 || enemy.koTimer > 0) return;

    const isDotTick = tags.includes('poison_dot') || tags.includes('burn_dot');

    // Storm Mark Debuff: Check if enemy was previously marked by lightning (only direct attacks detonate)
    const hadStormMark =
      !isDotTick && enemy.stormMarkTimer > 0 && !tags.includes('storm_detonation');
    if (hadStormMark) {
      // Consume mark for this attack
      enemy.stormMarkTimer = 0;
    }

    // Shielded archetype takes 50% less damage from the front 120-degree arc (Spec Section 8)
    let damageReduction = 0;
    if (enemy.archetypeId === 'shielded' && !isDotTick) {
      const angleFromEnemyToHero = Math.atan2(this.heroY - enemy.y, this.heroX - enemy.x);
      const diff = Math.abs(angleDifference(enemy.facingAngle, angleFromEnemyToHero));
      if (diff <= Math.PI / 3) {
        damageReduction = 0.5;
      }
    } else if (enemy.isFinalBoss && enemy.bossPhase === 3) {
      damageReduction = -0.2; // Spec Section 12: Phase 3 boss takes +20% damage
    }

    const finalDamage = calculateHitDamage({
      baseDamage: rawDamage,
      additiveBonusSum: 0,
      multiplicativeProduct: 1.0,
      isCrit,
      critMultiplier: this.stats.critDamage,
      targetDamageReduction: damageReduction,
    });

    enemy.hp -= finalDamage;
    if (enemy.isInfiniteHp) {
      enemy.hp = enemy.maxHp;
    }
    if (!isDotTick) {
      enemy.hitFlashTimer = 0.08;
      this.totalHitsDealt++;
    }

    // Apply Knockback
    if (knockback > 0 && enemy.knockbackResist < 1.0) {
      const dx = enemy.x - this.heroX;
      const dy = enemy.y - this.heroY;
      const d = Math.hypot(dx, dy);
      if (d > 0.001) {
        const kbDist = knockback * (1 - enemy.knockbackResist) * 0.45;
        enemy.x += (dx / d) * kbDist;
        enemy.y += (dy / d) * kbDist;
      }
    }

    // Apply Synergy Status Effects
    const burningThornsLv = this.cards.burning_thorns ?? 0;
    if (burningThornsLv > 0 && tags.includes('pierce')) {
      enemy.burnTimer = 3.0;
      enemy.burnDps = 4 * burningThornsLv;
    }

    const frostTouchLv = this.cards.frost_touch ?? 0;
    if (frostTouchLv > 0 && (tags.includes('impact') || tags.includes('area'))) {
      enemy.slowTimer = 1.8;
    }

    // Spore Pop poison status: applies low-DPS poison over 4.0s
    if (tags.includes('spore_proc') && !tags.includes('poison_dot') && enemy.hp > 0) {
      const sporePopLv = Math.max(1, this.cards.spore_pop ?? 1);
      enemy.poisonTimer = 4.0;
      enemy.poisonDps = (2 + sporePopLv * 1.5) * this.stats.damageMult;
    }

    // Seed Blades Venom DPS (starting from Seed Blades Level 2+): applies small venom poison DPS
    if (tags.includes('seed_venom') && !tags.includes('poison_dot') && enemy.hp > 0) {
      const sbWpn = this.weapons.find((w) => w.id === 'seed_blades');
      const sbLv = sbWpn?.level ?? 2;
      const sbEvo = Boolean(sbWpn?.evolved);
      enemy.poisonTimer = Math.max(enemy.poisonTimer, sbEvo ? 4.5 : 3.5);
      const venomDps =
        (1.5 + Math.max(1, sbLv - 1) * 1.2 + (sbEvo ? 2.5 : 0)) * this.stats.damageMult;
      enemy.poisonDps = Math.max(enemy.poisonDps, venomDps);
    }

    // Shockwave behavior card: every 5th direct hit triggers a 3.0u seismic shockwave
    const shockwaveLv = this.cards.shockwave ?? 0;
    if (
      !isDotTick &&
      shockwaveLv > 0 &&
      this.totalHitsDealt % 5 === 0 &&
      !tags.includes('shockwave_proc')
    ) {
      const swRadius = (2.8 + shockwaveLv * 0.15) * this.stats.areaMult;
      this.damageEnemiesInCircle(
        enemy.x,
        enemy.y,
        swRadius,
        10 * shockwaveLv * this.stats.damageMult,
        0.55,
        ['shockwave_proc', 'area', 'impact']
      );
      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'shockwave_blast',
        x: enemy.x,
        y: enemy.y,
        targetX: enemy.x,
        targetY: enemy.y,
        angle: Math.atan2(enemy.y - this.heroY, enemy.x - this.heroX),
        radius: swRadius,
        arcRad: shockwaveLv,
        color: PALETTE.BUTTER_YELLOW,
        timer: 0.46,
        maxTimer: 0.46,
      });
    }

    // Crit Burst synergy card
    const critBurstLv = this.cards.crit_burst ?? 0;
    if (isCrit && critBurstLv > 0 && !tags.includes('crit_proc')) {
      this.damageEnemiesInCircle(
        enemy.x,
        enemy.y,
        1.6 * this.stats.areaMult,
        8 * critBurstLv * this.stats.damageMult,
        0.3,
        ['crit_proc', 'area']
      );
    }

    this.events.emit('EnemyHit', {
      enemyId: enemy.id,
      x: enemy.x,
      y: enemy.y,
      damage: finalDamage,
      isCrit,
      isElite: enemy.isElite,
      isSpecialOrBoss: enemy.isSpecial || enemy.isMiniBoss || enemy.isFinalBoss,
      weaponTag: tags[0] ?? 'slash',
    });

    // Storm Mark Detonation: The next attack triggers an overhead lightning strike!
    // Detonation damage increases with each card received across the run.
    if (hadStormMark) {
      const cardCount = this.getEffectiveCardsReceived();
      const baseShock = 20;
      const bonusPerCard = 8;
      const detonationDamage = (baseShock + cardCount * bonusPerCard) * this.stats.damageMult;

      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'lightning_strike',
        x: enemy.x,
        y: enemy.y,
        targetX: enemy.x,
        targetY: enemy.y,
        angle: -Math.PI / 2,
        radius: 1.35 * this.stats.areaMult,
        arcRad: 0,
        color: PALETTE.SKY_BLUE,
        timer: 0.28,
        maxTimer: 0.28,
      });

      this.events.emit('FloatingText', {
        x: enemy.x,
        y: enemy.y - 0.75,
        text: `${Math.round(detonationDamage)}`,
        color: PALETTE.SKY_BLUE,
        scale: 1.25,
      });

      this.applyDamageToEnemy(
        enemy,
        detonationDamage,
        isCrit || this.rng.combat.chance(this.stats.critChance),
        0.4,
        ['storm_detonation', 'lightning', 'area']
      );
    }

    // Lightning strike debuff: leaves a mark on struck enemies for 5.0s for the next attack
    if (
      tags.includes('lightning') &&
      !tags.includes('storm_detonation') &&
      enemy.hp > 0 &&
      enemy.koTimer <= 0
    ) {
      enemy.stormMarkTimer = 5.0;
    }

    if (enemy.hp <= 0) {
      this.handleEnemyKilled(enemy, tags);
    }
  }

  private handleEnemyKilled(enemy: SimEnemy, weaponTags: string[]): void {
    enemy.hp = 0;
    enemy.koTimer = 0.18; // Brief KO knockback arc before removal
    const dx = enemy.x - this.heroX;
    const dy = enemy.y - this.heroY;
    const d = Math.max(0.1, Math.hypot(dx, dy));
    enemy.vx = (dx / d) * 3.2;
    enemy.vy = (dy / d) * 3.2;

    this.kills++;
    this.currentStreak++;
    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak;
    }
    this.streakResetTimer = 2.5; // Spec Section 13: streak resets after 2.5s without kill

    // Style Points Gain (Spec Section 13)
    let spGain = this.currentStreak >= 15 ? 4 : this.currentStreak >= 5 ? 3 : 2;
    const primaryTag = weaponTags[0] ?? 'slash';
    if (primaryTag !== this.lastKillWeaponId && this.varietyBonusCooldown <= 0) {
      spGain += 1; // Variety bonus
      this.varietyBonusCooldown = 0.5;
    }
    this.lastKillWeaponId = primaryTag;

    if (enemy.isElite) spGain += 8;
    if (enemy.isSpecial) spGain += 30;
    if (enemy.isMiniBoss || enemy.isFinalBoss) spGain += 25;
    this.addStylePoints(spGain);

    // Score addition (Spec Section 13: killPoints * rankMultiplier)
    const rankDef = STYLE_RANKS[this.rankIndex] ?? STYLE_RANKS[0]!;
    const baseKillPts = enemy.isSpecial
      ? 500
      : enemy.isMiniBoss
        ? 1000
        : enemy.isFinalBoss
          ? 2500
          : enemy.killPoints * (enemy.isElite ? 5 : 1);
    this.score += Math.round(baseKillPts * rankDef.scoreMult);

    // Vampiric Bloom behavior card: heal 1 HP per 10 kills
    const vampLv = this.cards.vampiric_bloom ?? 0;
    if (vampLv > 0) {
      this.vampiricKillCounter++;
      const threshold = Math.max(4, 11 - vampLv * 2);
      if (this.vampiricKillCounter >= threshold) {
        this.vampiricKillCounter = 0;
        this.healHero(1);
      }
    }

    // Spore Pop behavior card: kills have 20% chance to release a green poison gas cloud in 1.25u
    const sporePopLv = this.cards.spore_pop ?? 0;
    if (sporePopLv > 0 && !weaponTags.includes('spore_proc') && this.rng.combat.chance(0.2)) {
      const popRadius = 1.25 * this.stats.areaMult;
      this.damageEnemiesInCircle(
        enemy.x,
        enemy.y,
        popRadius,
        9 * sporePopLv * this.stats.damageMult,
        0.4,
        ['spore_proc', 'area', 'nature']
      );
      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'spore_cloud',
        x: enemy.x,
        y: enemy.y,
        targetX: enemy.x,
        targetY: enemy.y,
        angle: 0,
        radius: popRadius,
        arcRad: Math.PI * 2,
        color: PALETTE.MINT_GREEN,
        timer: 0.75,
        maxTimer: 0.75,
      });
      this.hazards.push({
        id: this.nextEntityId++,
        kind: 'spore_cloud',
        x: enemy.x,
        y: enemy.y,
        radius: popRadius,
        damage: Math.max(1, Math.round(2 * sporePopLv * this.stats.damageMult)),
        tickTimer: 0.45,
        lifeTimer: 2.2,
        color: PALETTE.MINT_GREEN,
      });
    }

    // Healing Bloom synergy card: area kills have 8% chance to drop a Healing Seed
    const healingBloomLv = this.cards.healing_bloom ?? 0;
    if (
      healingBloomLv > 0 &&
      weaponTags.includes('area') &&
      this.rng.drops.chance(0.06 + healingBloomLv * 0.02)
    ) {
      this.pickups.push({
        id: this.nextEntityId++,
        kind: 'healing_seed',
        x: enemy.x,
        y: enemy.y,
        value: 10,
        magnetized: false,
        pullSpeed: 0,
      });
    }

    // Splitter archetype spawns 2 smaller Chasers on death (Spec Section 8)
    if (enemy.archetypeId === 'splitter' && !enemy.isSpecial && this.enemies.length < 150) {
      for (let s = 0; s < 2; s++) {
        const offsetAngle = s * Math.PI + 0.5;
        const child = this.spawnEnemy(
          'chaser',
          enemy.x + Math.cos(offsetAngle) * 0.45,
          enemy.y + Math.sin(offsetAngle) * 0.45,
          false
        );
        if (child) {
          child.hp = 8;
          child.maxHp = 8;
          child.speed = 2.4;
          child.radius = 0.3;
        }
      }
    }

    // Destroying a Hero Grave left behind by Second Wind restores +25 HP!
    if (enemy.isHeroGrave) {
      this.healHero(25);
      this.events.emit('EnemyKilled', {
        enemyId: enemy.id,
        archetypeId: enemy.archetypeId,
        x: enemy.x,
        y: enemy.y,
        isElite: false,
        isSpecial: false,
        isBoss: false,
        color: enemy.color,
      });
      return;
    }

    // Drop XP Gem or Special/Boss Rewards
    this.spawnDropsForEnemy(enemy);

    this.events.emit('EnemyKilled', {
      enemyId: enemy.id,
      archetypeId: enemy.archetypeId,
      x: enemy.x,
      y: enemy.y,
      isElite: enemy.isElite,
      isSpecial: enemy.isSpecial,
      isBoss: enemy.isMiniBoss || enemy.isFinalBoss,
      color: enemy.color,
    });

    if (enemy.respawnOnDeath && enemy.bestiaryKey) {
      const respawnAngle = this.rng.spawn.range(0, Math.PI * 2);
      const respawnDist = 3.6;
      const rx = this.heroX + Math.cos(respawnAngle) * respawnDist;
      const ry = this.heroY + Math.sin(respawnAngle) * respawnDist;
      const respawned = this.spawnBestiarySingleUnit(enemy.bestiaryKey, rx, ry);
      if (respawned) {
        respawned.respawnOnDeath = true;
        respawned.bestiaryKey = enemy.bestiaryKey;
        respawned.despawnTimer = 999999;
        this.visualEffects.push({
          id: this.nextEntityId++,
          kind: 'circle_blast',
          x: respawned.x,
          y: respawned.y,
          targetX: respawned.x,
          targetY: respawned.y,
          angle: 0,
          radius: 1.4,
          arcRad: Math.PI * 2,
          color: PALETTE.MINT_GREEN,
          timer: 0.35,
          maxTimer: 0.35,
        });
        this.events.emit('FloatingText', {
          x: respawned.x,
          y: respawned.y - 0.7,
          text: 'RESPAWNED!',
          color: PALETTE.MINT_GREEN,
          scale: 1.15,
        });
      }
      return;
    }

    if (enemy.isMiniBoss) {
      this.miniBossDefeated = true;
    }
    if (enemy.isFinalBoss) {
      this.startVictorySequence();
    }
  }

  public getBasicCoinDropChance(): number {
    const cloverLv = this.cards.lucky_clover ?? 0;
    const luckBonus = Math.max(0, this.stats.luck) * 0.008 + cloverLv * 0.06;
    return clamp(0.10 + luckBonus, 0.10, 0.85);
  }

  private spawnDropsForEnemy(enemy: SimEnemy): void {
    if (enemy.isHeroGrave) return;

    // Big Arena Flowers always drop a random usable Power-Up item + Heal +20HP + an XP cluster when destroyed!
    if (enemy.isArenaFlower) {
      const allPowerUpIds: PowerUpId[] = ['shield', 'freeze', 'fire_breath', 'magnet', 'time_slow'];
      const randomPowerUp = this.rng.drops.pick(allPowerUpIds);
      this.pickups.push({
        id: this.nextEntityId++,
        kind: 'power_up',
        x: enemy.x,
        y: enemy.y,
        value: 1,
        powerUpId: randomPowerUp,
        magnetized: false,
        pullSpeed: 0,
      });
      this.pickups.push({
        id: this.nextEntityId++,
        kind: 'heal_potion',
        x: enemy.x - 0.28,
        y: enemy.y + 0.16,
        value: 20,
        magnetized: false,
        pullSpeed: 0,
      });
      this.pickups.push({
        id: this.nextEntityId++,
        kind: 'xp_cluster',
        x: enemy.x + 0.25,
        y: enemy.y + 0.15,
        value: enemy.xpValue,
        magnetized: false,
        pullSpeed: 0,
      });
      return;
    }

    // Merge XP gems into a cluster if > 40 gems are already on the ground (Spec Section 10 [F])
    const gemCount = this.pickups.filter(
      (p) => p.kind === 'xp_gem' || p.kind === 'xp_cluster'
    ).length;

    if (gemCount > 40) {
      const nearestGem = this.pickups.find(
        (p) =>
          (p.kind === 'xp_gem' || p.kind === 'xp_cluster') &&
          distSq(p.x, p.y, enemy.x, enemy.y) <= 3.5 * 3.5
      );
      if (nearestGem) {
        nearestGem.kind = 'xp_cluster';
        nearestGem.value += enemy.xpValue * (enemy.isElite ? 3 : 1);
      } else {
        this.pickups.push({
          id: this.nextEntityId++,
          kind: 'xp_cluster',
          x: enemy.x,
          y: enemy.y,
          value: enemy.xpValue * (enemy.isElite ? 3 : 1),
          magnetized: false,
          pullSpeed: 0,
        });
      }
    } else {
      this.pickups.push({
        id: this.nextEntityId++,
        kind: enemy.isElite || enemy.xpValue >= 4 ? 'xp_cluster' : 'xp_gem',
        x: enemy.x,
        y: enemy.y,
        value: enemy.xpValue * (enemy.isElite ? 3 : 1),
        magnetized: false,
        pullSpeed: 0,
      });
    }

    // Elites (6% chance), Special Monsters with power_up reward, or every 45th kill drop a weighted Power-Up
    // Ember Guard (fire_breath) has a significantly reduced spawn weight (6%) compared to other drops
    const isPowerUpSpecial =
      enemy.isSpecial &&
      (enemy.specialId === 'bloom_giant' || enemy.specialId === 'mirror_wisp');
    if (
      isPowerUpSpecial ||
      (enemy.isElite && this.rng.drops.chance(0.06)) ||
      (this.kills > 0 && this.kills % 45 === 0)
    ) {
      this.pickups.push({
        id: this.nextEntityId++,
        kind: 'power_up',
        x: enemy.x + 0.3,
        y: enemy.y,
        value: 1,
        powerUpId: this.rollPowerUpDrop(),
        magnetized: false,
        pullSpeed: 0,
      });
      if (enemy.isSpecial && enemy.specialId === 'mirror_wisp') {
        this.pickups.push({
          id: this.nextEntityId++,
          kind: 'healing_seed',
          x: enemy.x - 0.3,
          y: enemy.y + 0.2,
          value: 12,
          magnetized: false,
          pullSpeed: 0,
        });
      }
    }

    // New item drop: Heal +20HP ('heal_potion')
    const healPotionChance = enemy.isSpecial
      ? 0.65
      : enemy.isElite
        ? 0.18
        : clamp(0.025 + Math.max(0, this.stats.luck) * 0.0015, 0.025, 0.14);
    if (this.rng.drops.chance(healPotionChance)) {
      this.pickups.push({
        id: this.nextEntityId++,
        kind: 'heal_potion',
        x: enemy.x - 0.24,
        y: enemy.y + 0.18,
        value: 20,
        magnetized: false,
        pullSpeed: 0,
      });
    }

    // Decreased basic coin drop rate (10% base), amplified by Lucky Clover & Luck stat; elites/bosses/specials always drop coins
    if (
      enemy.isElite ||
      enemy.isSpecial ||
      enemy.isMiniBoss ||
      enemy.isFinalBoss ||
      this.rng.drops.chance(this.getBasicCoinDropChance())
    ) {
      const coinValue =
        enemy.isFinalBoss || enemy.isMiniBoss
          ? 10
          : enemy.isSpecial
            ? 5
            : enemy.isElite
              ? 3
              : 1;
      this.pickups.push({
        id: this.nextEntityId++,
        kind: 'gold_coin',
        x: enemy.x + 0.2,
        y: enemy.y - 0.14,
        value: coinValue,
        magnetized: false,
        pullSpeed: 0,
      });
    }

    // Special Monsters & Mini-Boss drop Chests
    if (enemy.isSpecial || enemy.isMiniBoss) {
      this.pickups.push({
        id: this.nextEntityId++,
        kind: 'chest',
        x: enemy.x,
        y: enemy.y,
        value: 1,
        magnetized: false,
        pullSpeed: 0,
      });
    }
  }

  /**
   * Weighted Power-Up drop selector:
   * Ember Guard ('fire_breath') has a low 6% drop weight (and won't duplicate if already held or on ground),
   * while standard utility drops share the remaining 94%.
   */
  public rollPowerUpDrop(): PowerUpId {
    const emberAlreadyPresent =
      this.heldPowerUps.includes('fire_breath') ||
      this.pickups.some((p) => p.kind === 'power_up' && p.powerUpId === 'fire_breath');

    const weights: ReadonlyArray<{ id: PowerUpId; weight: number }> = [
      { id: 'shield', weight: 28 },
      { id: 'magnet', weight: 26 },
      { id: 'freeze', weight: 22 },
      { id: 'time_slow', weight: 18 },
      { id: 'fire_breath', weight: emberAlreadyPresent ? 0 : 6 },
    ];

    let totalWeight = 0;
    for (const entry of weights) {
      totalWeight += entry.weight;
    }

    let roll = this.rng.drops.range(0, totalWeight);
    for (const entry of weights) {
      if (entry.weight <= 0) continue;
      if (roll < entry.weight) {
        return entry.id;
      }
      roll -= entry.weight;
    }
    return 'shield';
  }

  private updateGroundHazards(dt: number): void {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i]!;
      h.lifeTimer -= dt;
      h.tickTimer -= dt;
      if (h.tickTimer <= 0) {
        h.tickTimer = 0.45;
        const hTags =
          h.kind === 'spore_cloud' ? ['spore_proc', 'area', 'nature'] : ['area', 'nature'];
        this.damageEnemiesInCircle(h.x, h.y, h.radius, h.damage, 0.15, hTags);
      }
      if (h.lifeTimer <= 0) {
        this.hazards.splice(i, 1);
      }
    }
  }

  private updatePickups(dt: number): void {
    const pickupRad = this.stats.pickupRadius;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i]!;
      const dx = this.heroX - p.x;
      const dy = this.heroY - p.y;
      const d = Math.hypot(dx, dy);

      if (d <= pickupRad && !p.magnetized) {
        p.magnetized = true;
        p.pullSpeed = 3.5;
      }

      if (p.magnetized && d > 0.001) {
        p.pullSpeed = Math.min(13.0, p.pullSpeed + 18.0 * dt);
        p.x += (dx / d) * p.pullSpeed * dt;
        p.y += (dy / d) * p.pullSpeed * dt;
      }

      if (d <= this.heroRadius + 0.45) {
        this.collectPickup(p);
        this.pickups.splice(i, 1);
      }
    }
  }

  private collectPickup(p: SimPickup): void {
    if (p.kind === 'xp_gem' || p.kind === 'xp_cluster') {
      const gainedXp = Math.max(1, Math.round(p.value * this.stats.xpGainMult));
      this.currentXp += gainedXp;
      this.events.emit('GemCollected', { x: p.x, y: p.y, xpValue: gainedXp, kind: p.kind });

      if (this.currentXp >= this.xpToNext && this.pendingCardOffers.length === 0) {
        this.currentXp -= this.xpToNext;
        this.level++;
        this.xpToNext = getXpRequiredForLevel(this.level);
        this.triggerLevelUpCardDraft();
      }
    } else if (p.kind === 'gold_coin') {
      const coinVal = Math.max(1, p.value);
      this.bonusCoinsCollected += coinVal;
      this.events.emit('CoinCollected', { x: p.x, y: p.y, value: coinVal });
    } else if (p.kind === 'healing_seed') {
      this.healHero(p.value);
    } else if (p.kind === 'heal_potion') {
      const healId: PowerUpId = 'heal_potion';
      if (this.heldPowerUps.length >= 2) {
        this.heldPowerUps.shift(); // Replace oldest if holding 2
      }
      this.heldPowerUps.push(healId);
      this.events.emit('PowerUpPicked', {
        powerUpId: healId,
        slotIndex: this.heldPowerUps.length - 1,
      });
    } else if (p.kind === 'power_up' && p.powerUpId) {
      if (this.heldPowerUps.length >= 2) {
        this.heldPowerUps.shift(); // Replace oldest if holding 2 (Spec Section 12)
      }
      this.heldPowerUps.push(p.powerUpId);
      this.events.emit('PowerUpPicked', {
        powerUpId: p.powerUpId,
        slotIndex: this.heldPowerUps.length - 1,
      });
    } else if (p.kind === 'chest') {
      this.healHero(20);
      this.score += 350;
      if (this.pendingCardOffers.length === 0) {
        this.triggerLevelUpCardDraft();
      }
    }
  }

  public triggerLevelUpCardDraft(): void {
    const { offers, allCommon } = generateCardDraftOffers({
      rng: this.rng.cards,
      luck: this.stats.luck,
      weapons: this.weapons,
      ownedCards: this.cards,
      unlockedWeapons: this.unlockedWeapons,
      consecutiveAllCommonOffers: this.consecutiveAllCommonOffers,
    });
    if (allCommon) this.consecutiveAllCommonOffers++;
    else this.consecutiveAllCommonOffers = 0;

    this.pendingCardOffers = offers;
    this.events.emit('LevelUp', {
      newLevel: this.level,
      offeredCardIds: offers.map((o) => o.offerId),
    });
  }

  public healHero(amount: number): void {
    if (amount <= 0 || this.currentHp <= 0) return;
    const healPower = Math.max(1, Math.round(amount));
    const prevHp = this.currentHp;
    this.currentHp = Math.min(this.maxHp, this.currentHp + healPower);
    const actualHealed = this.currentHp - prevHp;
    this.spawnHeroHealEffect(healPower, actualHealed);

    // Regrowth Evolution ("Overgrowth Surge"): on ANY heal, if the hero is fully healed,
    // deal that exact same heal amount as damage to ALL enemies on the map!
    if (this.isRegrowthEvolved() && this.currentHp >= this.maxHp && !this.isProcessingRegrowthNova) {
      this.triggerRegrowthEvolutionFullHpDamage(healPower);
    }
  }

  private triggerRegrowthEvolutionFullHpDamage(healDamage: number): void {
    const dmg = Math.max(1, Math.round(healDamage));
    this.isProcessingRegrowthNova = true;
    try {
      const livingEnemies = [...this.enemies];
      for (const e of livingEnemies) {
        if (e.hp <= 0 || e.koTimer > 0) continue;
        e.hp -= dmg;
        if (e.isInfiniteHp) {
          e.hp = e.maxHp;
        }
        e.hitFlashTimer = 0.1;
        this.totalHitsDealt++;

        this.events.emit('EnemyHit', {
          enemyId: e.id,
          x: e.x,
          y: e.y,
          damage: dmg,
          isCrit: false,
          isElite: e.isElite,
          isSpecialOrBoss: e.isSpecial || e.isMiniBoss || e.isFinalBoss,
          weaponTag: 'nature',
        });

        if (e.hp <= 0) {
          this.handleEnemyKilled(e, ['nature', 'area', 'regrowth_evo']);
        }
      }

      this.visualEffects.push({
        id: this.nextEntityId++,
        kind: 'circle_blast',
        x: this.heroX,
        y: this.heroY,
        targetX: this.heroX,
        targetY: this.heroY,
        angle: 0,
        radius: clamp(2.4 + dmg * 0.08, 2.4, 4.8),
        arcRad: Math.PI * 2,
        color: PALETTE.MINT_GREEN,
        timer: 0.36,
        maxTimer: 0.36,
      });

      if (dmg >= 10) {
        this.events.emit('FloatingText', {
          x: this.heroX,
          y: this.heroY - 0.85,
          text: `OVERGROWTH SURGE -${dmg}`,
          color: PALETTE.MINT_GREEN,
          scale: 1.1,
        });
      }
    } finally {
      this.isProcessingRegrowthNova = false;
    }
  }

  private spawnHeroHealEffect(healPower: number, actualHealed: number): void {
    const powerNorm = clamp(healPower / 25, 0.06, 1.5);
    const duration = clamp(0.36 + powerNorm * 0.44, 0.38, 0.92);
    const radius = clamp(0.62 + powerNorm * 1.15, 0.65, 2.15);

    this.visualEffects.push({
      id: this.nextEntityId++,
      kind: 'heal_pulse',
      x: this.heroX,
      y: this.heroY,
      targetX: this.heroX,
      targetY: this.heroY,
      angle: 0,
      radius,
      arcRad: healPower,
      color: PALETTE.MINT_GREEN,
      timer: duration,
      maxTimer: duration,
    });

    this.events.emit('HeroHealed', {
      x: this.heroX,
      y: this.heroY,
      amount: healPower,
      actualHealed,
      currentHp: this.currentHp,
      maxHp: this.maxHp,
    });
  }

  private triggerSecondWindRevival(): void {
    this.secondWindUsed = true;
    const secondWindHeal = Math.max(1, Math.round(this.maxHp * 0.35));
    this.currentHp = secondWindHeal;
    this.invulnTimer = 1.8;
    this.spawnHeroHealEffect(secondWindHeal, secondWindHeal);
    this.spawnHeroGrave(this.heroX, this.heroY);
    this.visualEffects.push({
      id: this.nextEntityId++,
      kind: 'second_wind_blast',
      x: this.heroX,
      y: this.heroY,
      targetX: this.heroX,
      targetY: this.heroY,
      angle: 0,
      radius: 2.6,
      arcRad: Math.PI * 2,
      color: PALETTE.BUTTER_YELLOW,
      timer: 0.72,
      maxTimer: 0.72,
    });
    this.events.emit('LethalHitIntercepted', { reason: 'second_wind' });
    this.events.emit('FloatingText', {
      x: this.heroX,
      y: this.heroY - 0.7,
      text: 'SECOND WIND!',
      color: PALETTE.BUTTER_YELLOW,
      scale: 1.35,
    });
  }

  private damageHero(rawEnemyDamage: number): void {
    if (
      this.invulnTimer > 0 ||
      this.isHeroDashInvisible() ||
      this.runEnded ||
      this.deathSequenceTimer > 0 ||
      this.victorySequenceTimer > 0
    ) {
      return;
    }

    // Apply Armor flat reduction (minimum 1 damage) & Blood Pact multiplier (Spec Section 6)
    let dmg = Math.max(
      1,
      Math.round((rawEnemyDamage - this.stats.armor) * this.stats.damageTakenMult)
    );
    this.invulnTimer = 0.5; // Spec Section 5: 0.5s contact invulnerability window
    this.hitFlashTimer = 0.14;

    // Check Shield power-up absorption
    if (this.shieldHp > 0) {
      const absorbed = Math.min(this.shieldHp, dmg);
      this.shieldHp -= absorbed;
      dmg -= absorbed;
      if (dmg <= 0) {
        this.events.emit('HeroHit', {
          x: this.heroX,
          y: this.heroY,
          damage: 0,
          currentHp: this.currentHp,
          maxHp: this.maxHp,
          shieldAbsorbed: true,
        });
        return;
      }
    }

    this.currentHp -= dmg;
    this.noDamageTimer = 0;

    // Style Rank penalty on taking damage: -15 SP, plus -5 if hit again within 2s (Spec Section 13)
    const extraPenalty = this.recentDamageWindowTimer > 0 ? -5 : 0;
    this.recentDamageWindowTimer = 2.0;
    this.addStylePoints(-15 + extraPenalty);

    this.events.emit('HeroHit', {
      x: this.heroX,
      y: this.heroY,
      damage: dmg,
      currentHp: Math.max(0, this.currentHp),
      maxHp: this.maxHp,
      shieldAbsorbed: false,
    });

    if (this.currentHp <= 0) {
      // Check Second Wind card (Spec Section 11: Once per run, survive lethal damage with 35% HP and leave a destructible grave)
      if ((this.cards.second_wind ?? 0) > 0 && !this.secondWindUsed) {
        this.triggerSecondWindRevival();
        return;
      }

      // Offer Rescue Revive Modal if not yet revived this run (GDD Section 12)
      if (!this.reviveUsed) {
        this.currentHp = 0;
        this.awaitingReviveDecision = true;
        this.events.emit('LethalHitIntercepted', { reason: 'rescue_offer' });
        return;
      }

      this.startDefeatSequence();
    }
  }

  /**
   * Applies continuous thorn bleed damage when the hero exits the Final Boss thorn circle arena.
   */
  private applyArenaThornDamage(dmg: number): void {
    if (
      dmg <= 0 ||
      this.runEnded ||
      this.currentHp <= 0 ||
      this.cardPickInvisTimer > 0 ||
      this.deathSequenceTimer > 0 ||
      this.victorySequenceTimer > 0
    ) {
      return;
    }

    this.currentHp -= dmg;
    this.hitFlashTimer = Math.max(this.hitFlashTimer, 0.12);
    this.noDamageTimer = 0;

    this.events.emit('HeroHit', {
      x: this.heroX,
      y: this.heroY,
      damage: dmg,
      currentHp: Math.max(0, this.currentHp),
      maxHp: this.maxHp,
      shieldAbsorbed: false,
    });

    this.events.emit('FloatingText', {
      x: this.heroX,
      y: this.heroY - 0.6,
      text: `-${dmg} THORN`,
      color: PALETTE.CRIMSON_WARN,
      scale: 1.05,
    });

    if (this.currentHp <= 0) {
      if ((this.cards.second_wind ?? 0) > 0 && !this.secondWindUsed) {
        this.triggerSecondWindRevival();
        return;
      }

      if (!this.reviveUsed) {
        this.currentHp = 0;
        this.awaitingReviveDecision = true;
        this.events.emit('LethalHitIntercepted', { reason: 'rescue_offer' });
        return;
      }

      this.startDefeatSequence();
    }
  }

  public addStylePoints(deltaSp: number): void {
    const prevRank = this.rankIndex;
    const res = stepStyleRank(this.rankIndex, this.stylePoints, deltaSp);
    this.rankIndex = res.rankIndex;
    this.stylePoints = res.stylePoints;
    if (this.rankIndex > this.peakRankIndex) {
      this.peakRankIndex = this.rankIndex;
    }
    if (res.changed) {
      const rankDef = STYLE_RANKS[this.rankIndex] ?? STYLE_RANKS[0]!;
      this.events.emit('StyleRankChanged', {
        prevRankIndex: prevRank,
        newRankIndex: this.rankIndex,
        rankLetter: rankDef.letter,
        rankedUp: res.changed === 'up',
      });
    }
  }

  private updateStyleRank(dt: number): void {
    this.ticksPerRank[this.rankIndex] = (this.ticksPerRank[this.rankIndex] ?? 0) + 1;

    if (this.varietyBonusCooldown > 0) {
      this.varietyBonusCooldown = Math.max(0, this.varietyBonusCooldown - dt);
    }
    if (this.recentDamageWindowTimer > 0) {
      this.recentDamageWindowTimer = Math.max(0, this.recentDamageWindowTimer - dt);
    }

    if (this.streakResetTimer > 0) {
      this.streakResetTimer -= dt;
      if (this.streakResetTimer <= 0) {
        this.currentStreak = 0;
      }
    }

    // Passive clean-play gain: +1 SP/s after 8s without damage, capped at +10 per 20s
    this.noDamageTimer += dt;
    if (this.noDamageTimer >= 8.0 && this.noDamageSpGrantedInWindow < 10) {
      const grant = dt * 1.0;
      this.noDamageSpGrantedInWindow += grant;
      this.addStylePoints(grant);
    }
    if (this.noDamageTimer >= 28.0) {
      this.noDamageTimer = 8.0;
      this.noDamageSpGrantedInWindow = 0;
    }

    // Continuous Rank Drain (triples if idle without kill for > 3s, Spec Section 13)
    const rankDef = STYLE_RANKS[this.rankIndex] ?? STYLE_RANKS[0]!;
    const isIdleNoKills = this.streakResetTimer <= 0 && this.elapsedSeconds > 6;
    const drainMult = isIdleNoKills ? 1.8 : 1.0;
    if (this.rankIndex > 0 || this.stylePoints > 0) {
      this.addStylePoints(-rankDef.drainPerSec * drainMult * dt);
    }
  }

  private updateWaveDirector(dt: number): void {
    const tSec = this.elapsedSeconds;
    const phase =
      WAVE_SCRIPT.find((p) => tSec >= p.startSec && tSec < p.endSec) ??
      WAVE_SCRIPT[WAVE_SCRIPT.length - 1]!;

    // Catch-up mechanic (Spec Section 9): +15% budget if killing fast, -15% if low HP
    let budgetMod = 1.0;
    if (this.currentHp / this.maxHp < 0.35) budgetMod = 0.85;
    else if (this.currentStreak >= 10) budgetMod = 1.15;
    if (this.activeCurses.includes('swarm_brand')) budgetMod *= 1.25;
    if (this.finalBossSpawned) budgetMod *= 0.4;

    this.directorBankedBudget = Math.min(
      phase.budgetPerSec * 2.2,
      this.directorBankedBudget + phase.budgetPerSec * budgetMod * dt
    );

    this.spawnTimer -= dt;
    // Pause regular wave enemy spawning while Frost Flask (freezeAuraTimer) is active!
    if (
      this.freezeAuraTimer <= 0 &&
      this.spawnTimer <= 0 &&
      this.enemies.length < phase.activeCap
    ) {
      this.spawnTimer = this.finalBossSpawned ? 2.1 : 0.85;
      const archetypeId = this.rng.spawn.pick(phase.allowedArchetypes);
      const archDef = ENEMY_ARCHETYPES[archetypeId];
      if (archDef && this.directorBankedBudget >= archDef.budgetCost) {
        const maxCount = Math.min(
          this.finalBossSpawned ? 2 : 5,
          Math.floor(this.directorBankedBudget / archDef.budgetCost),
          phase.activeCap - this.enemies.length
        );
        const groupCount = Math.max(1, this.rng.spawn.int(1, Math.max(1, maxCount)));
        const basePos = this.finalBossSpawned
          ? {
              x:
                this.arenaCenterX +
                Math.cos(this.rng.spawn.range(0, Math.PI * 2)) * (this.arenaRadiusU * 0.85),
              y:
                this.arenaCenterY +
                Math.sin(this.rng.spawn.range(0, Math.PI * 2)) * (this.arenaRadiusU * 0.85),
            }
          // @llm-hook spawn-distance: director wave enemies spawn outside camera ring (12.0 - 14.0u)
          : this.pickRingSpawnPoint(12.0, 14.0);

        for (let g = 0; g < groupCount; g++) {
          const isElite = this.rng.spawn.chance(phase.eliteChance);
          const jitterX = this.rng.spawn.range(-0.9, 0.9);
          const jitterY = this.rng.spawn.range(-0.9, 0.9);
          this.spawnEnemy(archetypeId, basePos.x + jitterX, basePos.y + jitterY, isElite);
          this.directorBankedBudget -= archDef.budgetCost;
        }
      }
    }

    // Maintain Big Arena Flowers scattered randomly around the world so the player can find and attack them for item drops
    this.arenaFlowerSpawnTimer -= dt;
    if (this.arenaFlowerSpawnTimer <= 0) {
      this.arenaFlowerSpawnTimer = 14.0;
      const nearbyFlowers = this.enemies.filter(
        (e) =>
          e.isArenaFlower &&
          e.hp > 0 &&
          e.koTimer <= 0 &&
          Math.hypot(e.x - this.heroX, e.y - this.heroY) <= 24.0
      );
      if (nearbyFlowers.length < 4) {
        const pos = this.pickRingSpawnPoint(9.5, 22.0);
        this.spawnArenaFlower(pos.x, pos.y);
      }
    }

    // Scheduled Special Monsters at 0:50, 2:00, and 2:45 (Spec Section 9 & 12)
    const specialSchedule = [50, 120, 165];
    for (let sIdx = 0; sIdx < specialSchedule.length; sIdx++) {
      if (
        tSec >= specialSchedule[sIdx]! &&
        this.specialMonstersSpawned.length === sIdx
      ) {
        this.spawnSpecialMonster();
      }
    }

    // Scheduled Mini-Boss at 1:30 (90s)
    if (tSec >= 90 && !this.miniBossSpawned) {
      this.miniBossSpawned = true;
      this.spawnBoss(false);
    }

    // Scheduled Final Boss at 3:45 (225s = +30s from original 195s)
    if (tSec >= Simulation.FINAL_BOSS_SPAWN_SEC && !this.finalBossSpawned) {
      this.finalBossSpawned = true;
      this.spawnBoss(true);
    }
  }

  /**
   * Spawn on a 9–11u ring around the hero, avoiding the 60-degree cone in front of hero movement (Spec Section 9 [F])
   */
  private pickRingSpawnPoint(minR: number, maxR: number): { x: number; y: number } {
    const r = this.rng.spawn.range(minR, maxR);
    let angle = this.rng.spawn.range(0, Math.PI * 2);
    if (Math.hypot(this.heroVx, this.heroVy) > 0.2) {
      const moveAngle = Math.atan2(this.heroVy, this.heroVx);
      if (Math.abs(angleDifference(moveAngle, angle)) < Math.PI / 6) {
        angle += Math.PI; // Flip away from the forward 60-deg cone
      }
    }
    return {
      x: this.heroX + Math.cos(angle) * r,
      y: this.heroY + Math.sin(angle) * r,
    };
  }

  public spawnEnemy(
    archetypeId: EnemyArchetypeId,
    x: number,
    y: number,
    isElite: boolean
  ): SimEnemy | null {
    const def = ENEMY_ARCHETYPES[archetypeId];
    if (!def) return null;

    const scale = calculateEnemyTimeScaling(this.elapsedSeconds, this.difficultyTier);
    const eliteHpMult = isElite ? 3.0 : 1.0;
    const eliteDmgMult = isElite ? 1.5 : 1.0;
    const eliteSizeMult = isElite ? 1.35 : 1.0;

    const hp = Math.max(1, Math.round(def.baseHp * scale * eliteHpMult));
    const enemy: SimEnemy = {
      id: this.nextEntityId++,
      archetypeId,
      name: def.name,
      x,
      y,
      prevX: x,
      prevY: y,
      vx: 0,
      vy: 0,
      facingAngle: Math.atan2(this.heroY - y, this.heroX - x),
      hp,
      maxHp: hp,
      speed: def.speed,
      contactDamage: Math.max(1, Math.round(def.contactDamage * Math.sqrt(scale) * eliteDmgMult)),
      radius: def.radius * eliteSizeMult,
      xpValue: def.xpValue,
      killPoints: def.killPoints,
      knockbackResist: def.knockbackResist,
      color: def.color,
      accentColor: def.accentColor,
      isElite,
      isSpecial: false,
      despawnTimer: 999,
      isMiniBoss: false,
      isFinalBoss: false,
      bossPhase: 1,
      aiState: 'seek',
      aiTimer: archetypeId === 'spitter' ? 1.2 : 2.0,
      telegraphAngle: 0,
      telegraphTargetX: x,
      telegraphTargetY: y,
      telegraphDuration: 0.6,
      hitFlashTimer: 0,
      burnTimer: 0,
      burnDps: 0,
      poisonTimer: 0,
      poisonDps: 0,
      slowTimer: 0,
      webSlowTimer: 0,
      freezeTimer: 0,
      stormMarkTimer: 0,
      koTimer: 0,
    };

    this.enemies.push(enemy);
    return enemy;
  }

  public spawnSpecialMonster(forceSpecialId?: SpecialMonsterId): SimEnemy | null {
    const forcedDef = forceSpecialId
      ? SPECIAL_MONSTERS.find((m) => m.id === forceSpecialId)
      : undefined;
    const remaining = SPECIAL_MONSTERS.filter(
      (m) => !this.specialMonstersSpawned.includes(m.id)
    );
    const chosen =
      forcedDef ??
      (remaining.length > 0
        ? this.rng.spawn.pick(remaining)
        : this.rng.spawn.pick(SPECIAL_MONSTERS));

    if (!this.specialMonstersSpawned.includes(chosen.id)) {
      this.specialMonstersSpawned.push(chosen.id);
    }
    // @llm-hook spawn-distance: special monsters spawn outside camera viewport (12.0 - 13.5u)
    const pos = this.pickRingSpawnPoint(12.0, 13.5);
    const e = this.spawnEnemy(chosen.baseArchetype, pos.x, pos.y, false);
    if (!e) return null;

    e.name = chosen.name;
    e.isSpecial = true;
    e.specialId = chosen.id;
    e.hp = Math.round(e.hp * chosen.hpMultiplier);
    e.maxHp = e.hp;
    if (chosen.speedOverride) e.speed = chosen.speedOverride;
    e.radius *= 1.45;
    e.color = chosen.color;
    e.despawnTimer = chosen.id === 'golden_beast' ? 35.0 : 90.0;
    e.xpValue = 8;
    if (chosen.id === 'bloom_giant') {
      e.aiTimer = 0.25;
      e.bossAttackMode = 'sunflower_charge';
    }

    this.events.emit('SpecialMonsterSpawned', {
      enemyId: e.id,
      name: chosen.name,
      archetypeId: chosen.baseArchetype,
    });
    return e;
  }

  /**
   * Spawns a stationary Hero Grave left behind by Second Wind (or Hero Death).
   * Attacking and destroying the grave heals the hero for +25 HP!
   */
  public spawnHeroGrave(x: number, y: number): SimEnemy {
    const grave: SimEnemy = {
      id: this.nextEntityId++,
      archetypeId: 'brute',
      name: 'Hero Grave',
      x,
      y,
      prevX: x,
      prevY: y,
      vx: 0,
      vy: 0,
      facingAngle: 0,
      hp: 45,
      maxHp: 45,
      speed: 0,
      contactDamage: 0,
      radius: 0.56,
      xpValue: 0,
      killPoints: 50,
      knockbackResist: 1.0,
      color: 0x94a3b8,
      accentColor: PALETTE.MINT_GREEN,
      isElite: false,
      isSpecial: false,
      despawnTimer: 9999,
      isMiniBoss: false,
      isFinalBoss: false,
      isHeroGrave: true,
      bossPhase: 1,
      aiState: 'hold',
      aiTimer: 9999,
      telegraphAngle: 0,
      telegraphTargetX: x,
      telegraphTargetY: y,
      telegraphDuration: 1.0,
      hitFlashTimer: 0,
      burnTimer: 0,
      burnDps: 0,
      poisonTimer: 0,
      poisonDps: 0,
      slowTimer: 0,
      webSlowTimer: 0,
      freezeTimer: 0,
      stormMarkTimer: 0,
      koTimer: 0,
    };
    this.enemies.push(grave);
    return grave;
  }

  /**
   * Spawns a stationary Big Arena Flower with high HP stats that can be attacked
   * and drops a random usable item ('power_up') when destroyed.
   */
  public spawnArenaFlower(x: number, y: number): SimEnemy {
    const scale = calculateEnemyTimeScaling(this.elapsedSeconds, this.difficultyTier);
    const hp = Math.max(120, Math.round(180 * (0.8 + 0.2 * scale)));
    const flower: SimEnemy = {
      id: this.nextEntityId++,
      archetypeId: 'spitter',
      name: 'Elder Lotus Blossom',
      x,
      y,
      prevX: x,
      prevY: y,
      vx: 0,
      vy: 0,
      facingAngle: 0,
      hp,
      maxHp: hp,
      speed: 0,
      contactDamage: 0,
      radius: 0.88,
      xpValue: 6,
      killPoints: 150,
      knockbackResist: 1.0,
      color: PALETTE.BLUSH_ROSE,
      accentColor: PALETTE.BUTTER_YELLOW,
      isElite: false,
      isSpecial: false,
      despawnTimer: 9999,
      isMiniBoss: false,
      isFinalBoss: false,
      isArenaFlower: true,
      bossPhase: 1,
      aiState: 'hold',
      aiTimer: 9999,
      telegraphAngle: 0,
      telegraphTargetX: x,
      telegraphTargetY: y,
      telegraphDuration: 1.0,
      hitFlashTimer: 0,
      burnTimer: 0,
      burnDps: 0,
      poisonTimer: 0,
      poisonDps: 0,
      slowTimer: 0,
      webSlowTimer: 0,
      freezeTimer: 0,
      stormMarkTimer: 0,
      koTimer: 0,
    };
    this.enemies.push(flower);
    return flower;
  }

  public debugSpawnFinalBossArena(): SimEnemy | null {
    this.finalBossSpawned = true;
    return this.spawnBoss(true);
  }

  /**
   * Spawns a Bestiary enemy entry onto the arena with the hero in one of 3 debug modes:
   * - 'infinite_hp': Single enemy that takes hits & debuffs but never dies (HP stays at maxHp).
   * - 'swarm': Spawns a large swarm of that enemy around the hero on the arena.
   * - 'respawn_on_death': Single enemy that automatically respawns on the arena whenever killed.
   */
  public debugSpawnBestiaryEnemy(
    bestiaryKey: string,
    mode: BestiaryEnemySpawnMode
  ): SimEnemy[] {
    // Clear existing non-flower enemies so the arena focuses on the hero and the Bestiary test target(s)
    this.enemies = this.enemies.filter((e) => e.isArenaFlower || e.isHeroGrave);
    this.spawnTimer = Math.max(this.spawnTimer, 45.0);

    const spawned: SimEnemy[] = [];
    if (mode === 'swarm') {
      const isHeavy =
        bestiaryKey.startsWith('special_') || bestiaryKey.startsWith('boss_');
      const count = isHeavy ? 8 : 14;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + this.rng.spawn.range(-0.12, 0.12);
        const distU = 3.2 + (i % 3) * 0.95;
        const sx = this.heroX + Math.cos(angle) * distU;
        const sy = this.heroY + Math.sin(angle) * distU;
        const unit = this.spawnBestiarySingleUnit(bestiaryKey, sx, sy);
        if (unit) {
          unit.bestiaryKey = bestiaryKey;
          unit.despawnTimer = 999999;
          spawned.push(unit);
        }
      }
      this.events.emit('FloatingText', {
        x: this.heroX,
        y: this.heroY - 0.85,
        text: `SWARM ×${spawned.length}!`,
        color: PALETTE.BUTTER_YELLOW,
        scale: 1.25,
      });
    } else {
      const sx = this.heroX + Math.cos(this.heroFacingAngle) * 3.2;
      const sy = this.heroY + Math.sin(this.heroFacingAngle) * 3.2;
      const unit = this.spawnBestiarySingleUnit(bestiaryKey, sx, sy);
      if (unit) {
        unit.bestiaryKey = bestiaryKey;
        unit.despawnTimer = 999999;
        if (mode === 'infinite_hp') {
          unit.isInfiniteHp = true;
          this.events.emit('FloatingText', {
            x: unit.x,
            y: unit.y - 0.8,
            text: '∞ INFINITE HP',
            color: PALETTE.GOLD_STAR,
            scale: 1.25,
          });
        } else if (mode === 'respawn_on_death') {
          unit.respawnOnDeath = true;
          this.events.emit('FloatingText', {
            x: unit.x,
            y: unit.y - 0.8,
            text: 'AUTO-RESPAWN ON DEATH',
            color: PALETTE.MINT_GREEN,
            scale: 1.2,
          });
        }
        spawned.push(unit);
      }
    }

    return spawned;
  }

  private spawnBestiarySingleUnit(
    bestiaryKey: string,
    x: number,
    y: number
  ): SimEnemy | null {
    const archetypeMap: Record<string, EnemyArchetypeId> = {
      enemy_chaser_norm: 'chaser',
      enemy_chaser: 'chaser',
      enemy_swarm: 'chaser',
      enemy_dasher_norm: 'dasher',
      enemy_dasher: 'dasher',
      enemy_spitter_norm: 'spitter',
      enemy_spitter: 'spitter',
      enemy_brute_norm: 'brute',
      enemy_brute: 'brute',
      enemy_splitter_norm: 'splitter',
      enemy_splitter: 'splitter',
      enemy_shielded_norm: 'shielded',
      enemy_shielded: 'shielded',
    };
    const specialMap: Record<string, SpecialMonsterId> = {
      special_golden_beast: 'golden_beast',
      special_bloom_giant: 'bloom_giant',
      special_brood_mother: 'brood_mother',
      special_mirror_wisp: 'mirror_wisp',
    };

    if (archetypeMap[bestiaryKey]) {
      return this.spawnEnemy(archetypeMap[bestiaryKey]!, x, y, false);
    }

    if (specialMap[bestiaryKey]) {
      const sp = this.spawnSpecialMonster(specialMap[bestiaryKey]!);
      if (sp) {
        sp.x = x;
        sp.y = y;
        sp.prevX = x;
        sp.prevY = y;
        sp.despawnTimer = 999999;
      }
      return sp;
    }

    if (bestiaryKey === 'boss_moss_colossus') {
      const mini = this.spawnBoss(false);
      if (mini) {
        mini.x = x;
        mini.y = y;
        mini.prevX = x;
        mini.prevY = y;
      }
      return mini;
    }

    if (
      bestiaryKey === 'boss_thornheart_p1' ||
      bestiaryKey === 'boss_thornheart_p2' ||
      bestiaryKey === 'boss_thornheart_p3'
    ) {
      const boss = this.spawnBoss(true);
      if (boss) {
        boss.x = x;
        boss.y = y;
        boss.prevX = x;
        boss.prevY = y;
        if (bestiaryKey === 'boss_thornheart_p2') {
          boss.bossPhase = 2;
          boss.name = 'Frenzied Bloom';
          boss.hp = Math.max(1, Math.round(boss.maxHp * 0.6));
          this.arenaRadiusU = Simulation.FINAL_BOSS_ARENA_RADIUS_P2_U;
        } else if (bestiaryKey === 'boss_thornheart_p3') {
          boss.bossPhase = 3;
          boss.name = 'Apex Briar Overlord';
          boss.hp = Math.max(1, Math.round(boss.maxHp * 0.3));
          this.arenaRadiusU = Simulation.FINAL_BOSS_ARENA_RADIUS_P3_U;
        }
      }
      return boss;
    }

    return this.spawnEnemy('chaser', x, y, false);
  }

  private spawnBoss(isFinalBoss: boolean): SimEnemy | null {
    if (isFinalBoss) {
      this.finalBossSpawned = true;
      this.arenaActive = true;
      this.arenaCenterX = this.heroX;
      this.arenaCenterY = this.heroY;
      this.arenaRadiusU = Simulation.FINAL_BOSS_ARENA_RADIUS_P1_U;

      // Place 3 Big Flowers inside the Final Boss thorn circle arena
      for (let i = 0; i < 3; i++) {
        const fa = (i / 3) * Math.PI * 2 + 0.5;
        this.spawnArenaFlower(
          this.arenaCenterX + Math.cos(fa) * (this.arenaRadiusU * 0.58),
          this.arenaCenterY + Math.sin(fa) * (this.arenaRadiusU * 0.58)
        );
      }
    }

    const pos = isFinalBoss
      ? {
          x: this.arenaCenterX + 4.8,
          y: this.arenaCenterY - 1.5,
        }
      // @llm-hook spawn-distance: mini-bosses spawn outside camera ring (12.0 - 13.5u)
      : this.pickRingSpawnPoint(12.0, 13.5);
    const e = this.spawnEnemy('brute', pos.x, pos.y, false);
    if (!e) return null;

    const scale = calculateEnemyTimeScaling(this.elapsedSeconds, this.difficultyTier);
    if (isFinalBoss) {
      e.name = 'Primordial Thornheart';
      e.isFinalBoss = true;
      e.hp = Math.round(1200 * (0.6 + 0.4 * scale));
      e.maxHp = e.hp;
      e.radius = 1.15;
      e.color = PALETTE.BLUSH_ROSE;
      e.accentColor = PALETTE.BUTTER_YELLOW;
      e.knockbackResist = 0.95;
      e.xpValue = 25;
      this.finalBossId = e.id;
    } else {
      e.name = 'Ancient Moss Colossus';
      e.isMiniBoss = true;
      e.hp = Math.round(420 * scale);
      e.maxHp = e.hp;
      e.radius = 0.95;
      e.color = PALETTE.MINT_GREEN;
      e.accentColor = PALETTE.GOLD_STAR;
      e.knockbackResist = 0.88;
      e.xpValue = 12;
    }

    this.events.emit('BossSpawned', {
      enemyId: e.id,
      name: e.name,
      isFinalBoss,
    });
    return e;
  }

  private updateVisualEffects(dt: number): void {
    for (let i = this.visualEffects.length - 1; i >= 0; i--) {
      const fx = this.visualEffects[i]!;
      fx.timer -= dt;
      if (fx.timer <= 0) {
        this.visualEffects.splice(i, 1);
      }
    }
  }

  private finishRun(outcome: 'victory' | 'defeat' | 'timeout'): void {
    if (this.runEnded) return;
    this.runEnded = true;
    this.runOutcome = outcome;

    const secondsSurvived = Math.floor(this.elapsedSeconds);
    const bossBonus = outcome === 'victory' ? 5000 : 0;
    this.score += 50 * secondsSurvived + bossBonus;

    // Calculate weighted average currency multiplier across ranks (Spec Section 13)
    let totalTicks = 0;
    let weightedMultSum = 0;
    for (let r = 0; r < STYLE_RANKS.length; r++) {
      const t = this.ticksPerRank[r] ?? 0;
      totalTicks += t;
      weightedMultSum += t * (STYLE_RANKS[r]?.currencyMult ?? 1.0);
    }
    const avgCurrencyMult = totalTicks > 0 ? weightedMultSum / totalTicks : 1.0;

    let curseRewardMult = 1.0;
    for (const cId of this.activeCurses) {
      const cDef = CURSES.find((c) => c.id === cId);
      if (cDef) curseRewardMult += cDef.rewardMultAdd;
    }

    const coinsEarned =
      calculateRunCoins({
        kills: this.kills,
        secondsSurvived,
        victory: outcome === 'victory',
        avgCurrencyMult,
        curseRewardMult,
        hasMagnetRoot: this.equippedTrinkets.includes('magnet_root'),
      }) + this.bonusCoinsCollected;

    const gemsEarned =
      (outcome === 'victory' ? 5 : 0) +
      (this.miniBossDefeated ? 2 : 0) +
      (this.peakRankIndex >= 4 ? 2 : 0);

    let bossHpRemainingRatio = 0;
    if (this.finalBossId !== null) {
      const boss = this.enemies.find((e) => e.id === this.finalBossId);
      if (boss && boss.maxHp > 0) {
        bossHpRemainingRatio = clamp(boss.hp / boss.maxHp, 0, 1);
      }
    }

    this.events.emit('RunEnded', {
      outcome,
      score: Math.floor(this.score),
      coinsEarned,
      gemsEarned,
      peakRankIndex: this.peakRankIndex,
      bestStreak: this.bestStreak,
      kills: this.kills,
      elapsedSeconds: secondsSurvived,
      bossHpRemainingRatio,
    });
  }

  public serializeCheckpoint(): MidRunCheckpointV1 {
    return {
      baseSeed: this.rng.baseSeed,
      rngState: this.rng.serialize(),
      isDailySeed: this.isDailySeed,
      dailyDateKey: this.dailyDateKey,
      difficultyTier: this.difficultyTier,
      elapsedTicks: this.elapsedTicks,
      personaId: this.personaId,
      professionId: this.professionId,
      heroX: this.heroX,
      heroY: this.heroY,
      currentHp: this.currentHp,
      maxHp: this.maxHp,
      currentXp: this.currentXp,
      level: this.level,
      weapons: this.weapons.map((w) => ({ id: w.id, level: w.level, evolved: w.evolved })),
      cards: { ...this.cards },
      heldPowerUps: [...this.heldPowerUps],
      equippedTrinkets: [...this.equippedTrinkets],
      activeCurses: [...this.activeCurses],
      rankIndex: this.rankIndex,
      stylePoints: this.stylePoints,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      peakRankIndex: this.peakRankIndex,
      ticksPerRank: [...this.ticksPerRank],
      score: this.score,
      kills: this.kills,
      specialMonstersSpawned: [...this.specialMonstersSpawned],
      directorBankedBudget: this.directorBankedBudget,
      miniBossDefeated: this.miniBossDefeated,
      reviveUsed: this.reviveUsed,
      freeRerollUsed: this.freeRerollUsed,
      adRerollsUsed: this.adRerollsUsed,
      coinRerollsUsed: this.coinRerollsUsed,
      totalCardsReceived: this.totalCardsReceived,
      pendingCardOfferIds:
        this.pendingCardOffers.length > 0
          ? this.pendingCardOffers.map((o) => o.offerId)
          : null,
    };
  }

  public static fromCheckpoint(
    cp: MidRunCheckpointV1,
    unlockedWeapons: string[]
  ): Simulation {
    const sim = new Simulation({
      seed: cp.baseSeed,
      isDailySeed: cp.isDailySeed,
      dailyDateKey: cp.dailyDateKey,
      difficultyTier: cp.difficultyTier,
      personaId: cp.personaId,
      professionId: cp.professionId,
      equippedTrinkets: cp.equippedTrinkets,
      activeCurses: cp.activeCurses,
      unlockedWeapons,
    });

    sim.rng.restore(cp.rngState);
    sim.elapsedTicks = cp.elapsedTicks;
    sim.elapsedSeconds = cp.elapsedTicks * TICK_S;
    sim.heroX = cp.heroX;
    sim.heroY = cp.heroY;
    sim.heroPrevX = cp.heroX;
    sim.heroPrevY = cp.heroY;
    sim.cards = { ...cp.cards };
    delete sim.cards.ember_guard;
    sim.weapons = [];
    for (const w of cp.weapons) {
      sim.weapons.push({
        id: w.id,
        level: w.level,
        evolved: w.evolved,
        cooldownTimer: 0.1,
        phase: 'ready',
        phaseTimer: 0,
        lockedAngle: 0,
        lockedTargetX: 0,
        lockedTargetY: 0,
        swingCounter: 0,
        orbitAngle: 0,
        orbitHitCooldowns: new Map(),
      });
    }
    sim.stats = computeHeroStats(
      sim.professionId,
      sim.cards,
      sim.equippedTrinkets,
      sim.activeCurses
    );
    sim.maxHp = cp.maxHp;
    sim.currentHp = cp.currentHp;
    sim.currentXp = cp.currentXp;
    sim.level = cp.level;
    sim.xpToNext = getXpRequiredForLevel(cp.level);
    sim.heldPowerUps = [...cp.heldPowerUps];
    sim.rankIndex = cp.rankIndex;
    sim.stylePoints = cp.stylePoints;
    sim.currentStreak = cp.currentStreak;
    sim.bestStreak = cp.bestStreak;
    sim.peakRankIndex = cp.peakRankIndex;
    sim.ticksPerRank = [...cp.ticksPerRank];
    sim.score = cp.score;
    sim.kills = cp.kills;
    sim.specialMonstersSpawned = [...cp.specialMonstersSpawned];
    sim.directorBankedBudget = cp.directorBankedBudget;
    sim.miniBossDefeated = cp.miniBossDefeated;
    sim.miniBossSpawned = cp.elapsedTicks * TICK_S >= 90;
    sim.finalBossSpawned = cp.elapsedTicks * TICK_S >= 195;
    if (sim.finalBossSpawned && !sim.runEnded) {
      sim.spawnBoss(true);
    }
    sim.reviveUsed = cp.reviveUsed;
    sim.freeRerollUsed = cp.freeRerollUsed;
    sim.adRerollsUsed = cp.adRerollsUsed;
    sim.coinRerollsUsed = cp.coinRerollsUsed ?? 0;
    sim.totalCardsReceived =
      cp.totalCardsReceived ??
      Object.values(cp.cards).reduce((sum, v) => sum + v, 0);
    return sim;
  }
}
