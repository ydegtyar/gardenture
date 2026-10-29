import type { SimEnemy } from '../../../sim/Simulation';
import type {
  EnemyBehaviorRenderer,
  EnemyRenderContext,
  EnemyTransformModifiers,
} from './types';

export class SpecialEnemyRenderer implements EnemyBehaviorRenderer {
  public readonly id = 'special_generic';

  public matches(enemy: SimEnemy): boolean {
    return Boolean(
      enemy.isSpecial &&
      enemy.specialId !== 'bloom_giant'
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
