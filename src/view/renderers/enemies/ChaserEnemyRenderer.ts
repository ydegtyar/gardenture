import type { SimEnemy } from '../../../sim/Simulation';
import type {
  EnemyBehaviorRenderer,
  EnemyRenderContext,
  EnemyTransformModifiers,
} from './types';

export class ChaserEnemyRenderer implements EnemyBehaviorRenderer {
  public readonly id = 'chaser';

  public matches(enemy: SimEnemy): boolean {
    return (
      enemy.archetypeId === 'chaser' &&
      !enemy.isSpecial &&
      !enemy.isMiniBoss &&
      !enemy.isFinalBoss
    );
  }

  public hasLegs(_enemy: SimEnemy): boolean {
    return true;
  }

  public modifyTransform(
    _ctx: EnemyRenderContext,
    _baseCy: number
  ): EnemyTransformModifiers {
    return {};
  }
}
