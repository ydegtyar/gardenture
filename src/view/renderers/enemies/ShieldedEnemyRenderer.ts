import { PALETTE } from '../../../content/data/catalog';
import type { SimEnemy } from '../../../sim/Simulation';
import type {
  EnemyBehaviorRenderer,
  EnemyRenderContext,
  EnemyTransformModifiers,
} from './types';

export class ShieldedEnemyRenderer implements EnemyBehaviorRenderer {
  public readonly id = 'shielded';

  public matches(enemy: SimEnemy): boolean {
    return (
      enemy.archetypeId === 'shielded' &&
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

  public drawOverlay(
    ctx: EnemyRenderContext,
    _renderX: number,
    cy: number
  ): void {
    const { gOver, enemy: e, ex, rPx } = ctx;
    // Directional buckler arc showing exact block orientation
    const shieldArc = Math.PI / 2.1;
    const startA = e.facingAngle - shieldArc;
    const endA = e.facingAngle + shieldArc;
    const arcR = rPx + 4;
    const startX = ex + Math.cos(startA) * arcR;
    const startY = cy + Math.sin(startA) * arcR;

    gOver
      .moveTo(startX, startY)
      .arc(ex, cy, arcR, startA, endA)
      .stroke({
        color: PALETTE.INK_OUTLINE,
        width: 7.5,
        cap: 'round',
      });
    gOver
      .moveTo(startX, startY)
      .arc(ex, cy, arcR, startA, endA)
      .stroke({
        color: PALETTE.CREAM_WHITE,
        width: 4.0,
        cap: 'round',
      });
  }
}
