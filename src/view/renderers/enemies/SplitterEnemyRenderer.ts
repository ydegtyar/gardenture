import type { SimEnemy } from '../../../sim/Simulation';
import type {
  EnemyBehaviorRenderer,
  EnemyRenderContext,
  EnemyTransformModifiers,
} from './types';

export class SplitterEnemyRenderer implements EnemyBehaviorRenderer {
  public readonly id = 'splitter';

  public matches(enemy: SimEnemy): boolean {
    return (
      enemy.archetypeId === 'splitter' &&
      !enemy.isSpecial &&
      !enemy.isMiniBoss &&
      !enemy.isFinalBoss
    );
  }

  public hasLegs(_enemy: SimEnemy): boolean {
    return false; // Splitter has jelly-like bounce rather than walking legs
  }

  public modifyTransform(
    ctx: EnemyRenderContext,
    _baseCy: number
  ): EnemyTransformModifiers {
    const { walkPhase } = ctx;
    const jellySquash = Math.sin(walkPhase * 1.5) * 0.12;
    return {
      animScaleX: 1 + jellySquash,
      animScaleY: 1 - jellySquash * 0.85,
    };
  }
}
