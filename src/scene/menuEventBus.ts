/**
 * @file menuEventBus.ts
 * Internal event bus and adaptive frame-time quality monitor for the isolated MenuScene.
 * Zero imports from game logic, simulation, or game renderer.
 */

export type MenuQualityTier = 'high' | 'medium' | 'low';

export interface MenuEventMap {
  'menu:start': { mode: 'new' | 'resume' };
  'scene:transitionDone': { mode: 'new' | 'resume' };
  'menu:qualityChanged': { tier: MenuQualityTier; avgFrameMs: number };
  'menu:contextLost': Record<string, never>;
  'menu:contextRestored': Record<string, never>;
}

type Listener<T> = (payload: T) => void;

export class MenuEventBus {
  private listeners = new Map<keyof MenuEventMap, Set<Listener< never >>>();

  public on<K extends keyof MenuEventMap>(
    event: K,
    listener: Listener<MenuEventMap[K]>
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<never>);
    return () => {
      set?.delete(listener as Listener<never>);
      if (set && set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  public emit<K extends keyof MenuEventMap>(event: K, payload: MenuEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of Array.from(set)) {
      (fn as Listener<MenuEventMap[K]>)(payload);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }

  public listenerCount(event?: keyof MenuEventMap): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0;
    }
    let total = 0;
    for (const s of this.listeners.values()) {
      total += s.size;
    }
    return total;
  }
}

export interface MenuQualityBudget {
  tier: MenuQualityTier;
  bokehPetalCount: number;
  fireflyCount: number;
  enableBlurFilter: boolean;
  resolutionCap: number;
}

export const MENU_QUALITY_BUDGETS: Record<MenuQualityTier, MenuQualityBudget> = {
  high: {
    tier: 'high',
    bokehPetalCount: 34,
    fireflyCount: 30,
    enableBlurFilter: true,
    resolutionCap: 2,
  },
  medium: {
    tier: 'medium',
    bokehPetalCount: 22,
    fireflyCount: 20,
    enableBlurFilter: true,
    resolutionCap: 1.5,
  },
  low: {
    tier: 'low',
    bokehPetalCount: 12,
    fireflyCount: 10,
    enableBlurFilter: false,
    resolutionCap: 1,
  },
};

/**
 * Standalone frame-time monitor for MenuScene.
 * Completely independent of the game's settings or performance monitors.
 */
export class MenuQualityMonitor {
  private tier: MenuQualityTier;
  private samples: number[] = [];
  private readonly windowSize: number;
  private cooldownFrames = 0;

  constructor(initialTier: MenuQualityTier = 'high', windowSize = 30) {
    this.tier = initialTier;
    this.windowSize = Math.max(5, windowSize);
  }

  public getTier(): MenuQualityTier {
    return this.tier;
  }

  public setTier(tier: MenuQualityTier): void {
    this.tier = tier;
    this.samples.length = 0;
    this.cooldownFrames = 0;
  }

  public getBudget(): MenuQualityBudget {
    return MENU_QUALITY_BUDGETS[this.tier];
  }

  public getAverageFrameMs(): number {
    if (this.samples.length === 0) return 16.67;
    let sum = 0;
    for (let i = 0; i < this.samples.length; i++) {
      sum += this.samples[i]!;
    }
    return sum / this.samples.length;
  }

  /**
   * Records a frame delta in milliseconds and returns the new tier if a tier shift occurred.
   */
  public recordFrame(dtMs: number): MenuQualityTier | null {
    const clamped = Math.max(1, Math.min(200, dtMs));
    this.samples.push(clamped);
    if (this.samples.length > this.windowSize) {
      this.samples.shift();
    }
    if (this.cooldownFrames > 0) {
      this.cooldownFrames--;
      return null;
    }
    if (this.samples.length < this.windowSize) {
      return null;
    }

    const avg = this.getAverageFrameMs();
    if (avg > 28 && this.tier === 'high') {
      this.tier = 'medium';
      this.cooldownFrames = this.windowSize;
      this.samples.length = 0;
      return this.tier;
    }
    if (avg > 36 && this.tier === 'medium') {
      this.tier = 'low';
      this.cooldownFrames = this.windowSize;
      this.samples.length = 0;
      return this.tier;
    }
    if (avg < 18 && this.tier === 'low') {
      this.tier = 'medium';
      this.cooldownFrames = this.windowSize * 2;
      this.samples.length = 0;
      return this.tier;
    }
    return null;
  }

  public reset(): void {
    this.samples.length = 0;
    this.cooldownFrames = 0;
  }
}
