import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { clamp } from '../../../core/math/vec2';
import type { SimEnemy, SimProjectile } from '../../../sim/Simulation';
import type {
  EnemyBehaviorRenderer,
  EnemyRenderContext,
  EnemyTransformModifiers,
} from './types';

/**
 * Renders the toxic acidic spore projectile fired by Spitter enemies.
 */
export function drawSpitterProjectile(
  g: PIXI.Graphics,
  p: SimProjectile,
  px: number,
  py: number,
  rPx: number,
  angle: number
): void {
  const m = new PIXI.Matrix();
  m.rotate(angle);
  m.translate(px, py);
  g.setTransform(m);

  // Outer elongated toxic spore droplet
  g.moveTo(rPx * 1.35, 0)
    .quadraticCurveTo(0, -rPx * 0.9, -rPx * 1.1, 0)
    .quadraticCurveTo(0, rPx * 0.9, rPx * 1.35, 0)
    .closePath()
    .fill({ color: p.color || PALETTE.CRIMSON_WARN })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });

  // Inner acidic spore core
  g.circle(0, 0, rPx * 0.42).fill({ color: PALETTE.BLUSH_ROSE, alpha: 0.9 });
  g.circle(rPx * 0.25, 0, rPx * 0.2).fill({ color: PALETTE.CREAM_WHITE });

  // Trailing spore flecks
  g.circle(-rPx * 1.4, -rPx * 0.35, rPx * 0.2).fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.75 });
  g.circle(-rPx * 1.4, rPx * 0.35, rPx * 0.2).fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.75 });

  g.setTransform(new PIXI.Matrix());
}

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
