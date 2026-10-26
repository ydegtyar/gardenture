/**
 * Deterministic Seeded PRNG (Mulberry32) with Named Streams
 * Layer 1 (core): Zero Math.random() or Date.now() inside simulation.
 */

export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 0x6d2b79f5;
    }
  }

  public getState(): number {
    return this.state >>> 0;
  }

  public setState(state: number): void {
    this.state = (state >>> 0) || 0x6d2b79f5;
  }

  /** Returns deterministic float in [0, 1) */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    this.state = t >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns deterministic float in [min, max) */
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Returns deterministic integer in [min, max] inclusive */
  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** Returns true with probability p in [0, 1] */
  public chance(p: number): boolean {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.next() < p;
  }

  /** Picks one item from a non-empty array */
  public pick<T>(items: readonly T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx]!;
  }
}

export interface RNGStreamsState {
  spawn: number;
  cards: number;
  drops: number;
  combat: number;
}

export class RNGStreams {
  public readonly baseSeed: number;
  public readonly spawn: SeededRNG;
  public readonly cards: SeededRNG;
  public readonly drops: SeededRNG;
  public readonly combat: SeededRNG;
  public readonly cosmetic: SeededRNG;

  constructor(baseSeed: number, savedState?: RNGStreamsState) {
    this.baseSeed = baseSeed >>> 0;
    this.spawn = new SeededRNG(savedState ? savedState.spawn : (this.baseSeed ^ 0x13579bdf) >>> 0);
    this.cards = new SeededRNG(savedState ? savedState.cards : (this.baseSeed ^ 0x2468ace0) >>> 0);
    this.drops = new SeededRNG(savedState ? savedState.drops : (this.baseSeed ^ 0x9e3779b9) >>> 0);
    this.combat = new SeededRNG(savedState ? savedState.combat : (this.baseSeed ^ 0x85ebca6b) >>> 0);
    this.cosmetic = new SeededRNG((this.baseSeed ^ 0xc2b2ae35) >>> 0);
  }

  public serialize(): RNGStreamsState {
    return {
      spawn: this.spawn.getState(),
      cards: this.cards.getState(),
      drops: this.drops.getState(),
      combat: this.combat.getState(),
    };
  }

  public restore(state: RNGStreamsState): void {
    this.spawn.setState(state.spawn);
    this.cards.setState(state.cards);
    this.drops.setState(state.drops);
    this.combat.setState(state.combat);
  }
}

/**
 * Hashes a string (such as a UTC date '2026-10-23') into a 32-bit unsigned seed
 * for deterministic Daily Seeded Runs.
 */
export function hashStringToSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 0x12345678;
}
