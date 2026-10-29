import type { SimEnemy } from '../../../sim/Simulation';
import type { EnemyBehaviorRenderer } from './types';
import { GoldenSunflowerBossRenderer } from './GoldenSunflowerBossRenderer';
import { FinalBossRenderer } from './FinalBossRenderer';
import { MossColossusBossRenderer } from './MossColossusBossRenderer';
import { DasherEnemyRenderer } from './DasherEnemyRenderer';
import { SpitterEnemyRenderer } from './SpitterEnemyRenderer';
import { BruteEnemyRenderer } from './BruteEnemyRenderer';
import { SplitterEnemyRenderer } from './SplitterEnemyRenderer';
import { ShieldedEnemyRenderer } from './ShieldedEnemyRenderer';
import { SpecialEnemyRenderer } from './SpecialEnemyRenderer';
import { ChaserEnemyRenderer } from './ChaserEnemyRenderer';

/**
 * Strategy Registry mapping an enemy instance to its specialized behavior renderer,
 * completely eliminating long `if/else` checks for telegraphs, leg suppression, animations, and overlays.
 */
export class EnemyRegistry {
  private readonly renderers: EnemyBehaviorRenderer[] = [];
  private readonly defaultRenderer: EnemyBehaviorRenderer;

  constructor() {
    // Register specific/boss renderers first, falling back to archetype and chaser renderers
    this.defaultRenderer = new ChaserEnemyRenderer();

    this.register(new GoldenSunflowerBossRenderer());
    this.register(new FinalBossRenderer());
    this.register(new MossColossusBossRenderer());
    this.register(new SpecialEnemyRenderer());
    this.register(new DasherEnemyRenderer());
    this.register(new SpitterEnemyRenderer());
    this.register(new BruteEnemyRenderer());
    this.register(new SplitterEnemyRenderer());
    this.register(new ShieldedEnemyRenderer());
    this.register(this.defaultRenderer);
  }

  public register(renderer: EnemyBehaviorRenderer): void {
    this.renderers.push(renderer);
  }

  public get(enemy: SimEnemy): EnemyBehaviorRenderer {
    for (const r of this.renderers) {
      if (r.matches(enemy)) {
        return r;
      }
    }
    return this.defaultRenderer;
  }
}

export const enemyRegistry = new EnemyRegistry();
