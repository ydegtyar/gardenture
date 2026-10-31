import { PALETTE } from '../../../content/data/catalog';
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

  public drawOverlay(
    ctx: EnemyRenderContext,
    renderX: number,
    cy: number
  ): void {
    if (ctx.enemy.isSpecial && ctx.enemy.specialId === 'golden_beast') {
      // Golden Wheat Fox: glittering wheat sparkles & trailing golden coins
      const t = ctx.sim.elapsedSeconds;
      const g = ctx.gOver;
      const trailAngle = ctx.enemy.facingAngle + Math.PI;
      const cosT = Math.cos(trailAngle);
      const sinT = Math.sin(trailAngle);

      for (let i = 0; i < 3; i++) {
        const offsetDist = ctx.rPx * (0.82 + i * 0.42);
        const wobble = Math.sin(t * 8.5 + i * 2.3 + ctx.enemy.id) * (ctx.rPx * 0.22);
        const perpX = -sinT * wobble;
        const perpY = cosT * wobble;
        const px = renderX + cosT * offsetDist + perpX;
        const py = cy + sinT * offsetDist + perpY;
        const sparkPhase = (t * 3.6 + i * 0.33) % 1;
        const sparkAlpha = (1 - sparkPhase) * 0.72;
        const sparkSize = ctx.rPx * 0.14 * (1 - sparkPhase * 0.35);

        g.circle(px, py, sparkSize).fill({
          color: i === 0 ? PALETTE.GOLD_STAR : PALETTE.BUTTER_YELLOW,
          alpha: sparkAlpha,
        });
      }
    }
  }
}
