import { clamp } from '../../../core/math/vec2';
import type { SimEnemy } from '../../../sim/Simulation';
import type {
  EnemyBehaviorRenderer,
  EnemyRenderContext,
  EnemyTransformModifiers,
} from './types';

export class BruteEnemyRenderer implements EnemyBehaviorRenderer {
  public readonly id = 'brute';

  public matches(enemy: SimEnemy): boolean {
    return (
      enemy.archetypeId === 'brute' &&
      !enemy.isSpecial &&
      !enemy.isMiniBoss &&
      !enemy.isFinalBoss
    );
  }

  public hasLegs(_enemy: SimEnemy): boolean {
    return true;
  }

  public modifyTransform(
    ctx: EnemyRenderContext,
    baseCy: number
  ): EnemyTransformModifiers {
    const { enemy: e } = ctx;
    if (e.aiState === 'telegraph') {
      const prog = clamp(1 - e.aiTimer / Math.max(0.01, e.telegraphDuration), 0, 1);
      return {
        animScaleX: 1 + prog * 0.16,
        animScaleY: 1 + prog * 0.12,
        cy: baseCy - Math.sin(prog * Math.PI) * 5.5,
      };
    }
    return {};
  }
}
