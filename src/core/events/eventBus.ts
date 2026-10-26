/**
 * Typed Event Bus for Upward Simulation-to-View/Audio Communication
 * Layer 1 (core): Pure TypeScript.
 */

export interface SimEventMap {
  EnemyHit: {
    enemyId: number;
    x: number;
    y: number;
    damage: number;
    isCrit: boolean;
    isElite: boolean;
    isSpecialOrBoss: boolean;
    weaponTag: string;
  };
  EnemyKilled: {
    enemyId: number;
    archetypeId: string;
    x: number;
    y: number;
    isElite: boolean;
    isSpecial: boolean;
    isBoss: boolean;
    color: number;
  };
  HeroHit: {
    x: number;
    y: number;
    damage: number;
    currentHp: number;
    maxHp: number;
    shieldAbsorbed: boolean;
  };
  HeroHealed: {
    x: number;
    y: number;
    amount: number;
    actualHealed: number;
    currentHp: number;
    maxHp: number;
  };
  HeroDashed: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    professionId: string;
  };
  PerfectDodge: {
    x: number;
    y: number;
    stylePointsAdded: number;
  };
  WeaponSwung: {
    weaponId: string;
    shape: 'arc' | 'line' | 'circle' | 'projectile' | 'orbit' | 'chain';
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    angle: number;
    reach: number;
    arcRad: number;
    color: number;
    evolved: boolean;
  };
  GemCollected: {
    x: number;
    y: number;
    xpValue: number;
    kind?: string;
  };
  CoinCollected: {
    x: number;
    y: number;
    value: number;
  };
  LevelUp: {
    newLevel: number;
    offeredCardIds: string[];
  };
  StyleRankChanged: {
    prevRankIndex: number;
    newRankIndex: number;
    rankLetter: string;
    rankedUp: boolean;
  };
  SpecialMonsterSpawned: {
    enemyId: number;
    name: string;
    archetypeId: string;
  };
  BossSpawned: {
    enemyId: number;
    name: string;
    isFinalBoss: boolean;
  };
  BossPhaseChanged: {
    phase: 1 | 2 | 3;
    arenaRadiusU: number;
  };
  PowerUpPicked: {
    powerUpId: string;
    slotIndex: number;
  };
  PowerUpUsed: {
    powerUpId: string;
    x: number;
    y: number;
  };
  FloatingText: {
    x: number;
    y: number;
    text: string;
    color: number;
    scale: number;
  };
  LethalHitIntercepted: {
    reason: 'second_wind' | 'rescue_offer';
  };
  RunEnded: {
    outcome: 'victory' | 'defeat' | 'timeout';
    score: number;
    coinsEarned: number;
    gemsEarned: number;
    peakRankIndex: number;
    bestStreak: number;
    kills: number;
    elapsedSeconds: number;
    bossHpRemainingRatio: number;
  };
}

type Handler<T> = (payload: T) => void;

export class TypedEventBus {
  private listeners: { [K in keyof SimEventMap]?: Set<Handler<any>> } = {};

  public on<K extends keyof SimEventMap>(event: K, handler: Handler<SimEventMap[K]>): () => void {
    let set = this.listeners[event];
    if (!set) {
      set = new Set();
      this.listeners[event] = set;
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  }

  public emit<K extends keyof SimEventMap>(event: K, payload: SimEventMap[K]): void {
    const set = this.listeners[event];
    if (!set) return;
    for (const handler of set) {
      handler(payload);
    }
  }

  public clear(): void {
    this.listeners = {};
  }
}
