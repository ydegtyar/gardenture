import { PALETTE } from '../../../content/data/catalog';
import { clamp } from '../../../core/math/vec2';
import type { SimEnemy } from '../../../sim/Simulation';
import type {
  EnemyBehaviorRenderer,
  EnemyRenderContext,
  EnemyTransformModifiers,
} from './types';

export class SpitterEnemyRenderer implements EnemyBehaviorRenderer {
  public readonly id = 'spitter';

  public matches(enemy: SimEnemy): boolean {
    return (
      enemy.archetypeId === 'spitter' &&
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
    _baseCy: number
  ): EnemyTransformModifiers {
    const { enemy: e } = ctx;
    const isWindingUpToSpit = e.aiTimer < 0.55;
    const isSpitRecoil = e.aiTimer > 1.75;
    const windupNorm = isWindingUpToSpit ? clamp((0.55 - e.aiTimer) / 0.55, 0, 1) : 0;
    const recoilNorm = isSpitRecoil ? clamp((e.aiTimer - 1.75) / 0.45, 0, 1) : 0;

    return {
      animScaleX: 1 + windupNorm * 0.18 - recoilNorm * 0.12,
      animScaleY: 1 - windupNorm * 0.1 + recoilNorm * 0.16,
    };
  }

  public drawOverlay(
    ctx: EnemyRenderContext,
    _renderX: number,
    cy: number
  ): void {
    const { gOver, enemy: e, ex, rPx, cosA, sinA, accentColor } = ctx;
    const isWindingUpToSpit = e.aiTimer < 0.55;
    const isSpitRecoil = e.aiTimer > 1.75;
    const windupNorm = isWindingUpToSpit ? clamp((0.55 - e.aiTimer) / 0.55, 0, 1) : 0;
    const recoilNorm = isSpitRecoil ? clamp((e.aiTimer - 1.75) / 0.45, 0, 1) : 0;

    if (windupNorm <= 0.02 && recoilNorm <= 0.02) return;

    const cheekSwell = 1.0 + windupNorm * 0.85 + recoilNorm * 0.35;
    const perpX = -sinA;
    const perpY = cosA;
    const cheekForward = rPx * 0.25;
    const cheekSide = rPx * (0.46 + windupNorm * 0.14);
    const cheekRad = rPx * 0.24 * cheekSwell;

    for (const side of [-1, 1] as const) {
      const chX = ex + cosA * cheekForward + perpX * cheekSide * side;
      const chY = cy + sinA * cheekForward + perpY * cheekSide * side;
      gOver.circle(chX, chY, cheekRad)
        .fill({
          color: windupNorm > 0.2 ? PALETTE.BLUSH_ROSE : accentColor,
          alpha: 0.95,
        })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
    }

    // Animated puckered spitting mouth nozzle at front of Spitter
    const mouthReach = rPx * (0.52 + windupNorm * 0.22 + recoilNorm * 0.28);
    const mouthX = ex + cosA * mouthReach;
    const mouthY = cy + sinA * mouthReach;
    const mouthOuterR = rPx * (0.22 + windupNorm * 0.12 + recoilNorm * 0.16);
    const mouthInnerR = mouthOuterR * (0.48 + recoilNorm * 0.28);

    gOver.circle(mouthX, mouthY, mouthOuterR)
      .fill({ color: accentColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
    gOver.circle(mouthX + cosA * 1.5, mouthY + sinA * 1.5, mouthInnerR).fill({
      color: recoilNorm > 0.1 || windupNorm > 0.4 ? PALETTE.CRIMSON_WARN : PALETTE.INK_OUTLINE,
    });
  }
}
