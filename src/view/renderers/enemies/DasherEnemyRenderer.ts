import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimEnemy } from '../../../sim/Simulation';
import type {
  EnemyBehaviorRenderer,
  EnemyRenderContext,
  EnemyTransformModifiers,
} from './types';

export class DasherEnemyRenderer implements EnemyBehaviorRenderer {
  public readonly id = 'dasher';

  public matches(enemy: SimEnemy): boolean {
    return (
      enemy.archetypeId === 'dasher' &&
      !enemy.isSpecial &&
      !enemy.isMiniBoss &&
      !enemy.isFinalBoss
    );
  }

  public hasLegs(_enemy: SimEnemy): boolean {
    return true;
  }

  public drawTelegraph(ctx: EnemyRenderContext, progress: number): void {
    const { telegraphGraphic: g, enemy: e, ex, ey, rPx, sim } = ctx;
    const tx = e.telegraphTargetX * PPU;
    const ty = e.telegraphTargetY * PPU;
    const dx = tx - ex;
    const dy = ty - ey;
    const len = Math.max(24, Math.hypot(dx, dy));
    const angle = e.telegraphAngle;

    const m = new PIXI.Matrix();
    m.rotate(angle);
    m.translate(ex, ey);
    g.setTransform(m);

    const halfW = rPx * 0.65;

    // Soft danger corridor base
    g.roundRect(0, -halfW, len, halfW * 2, 6).fill({
      color: PALETTE.CRIMSON_WARN,
      alpha: 0.14,
    });

    // Filling progress bar inside corridor
    g.roundRect(0, -halfW * 0.8, len * progress, halfW * 1.6, 5).fill({
      color: PALETTE.CRIMSON_WARN,
      alpha: 0.28 + 0.25 * progress,
    });

    // Animated scrolling chevron arrows (>>>) along the dash lane
    const chevronCount = 3;
    const scroll = (sim.elapsedSeconds * 3.5) % 1;
    for (let c = 0; c < chevronCount; c++) {
      const tPos = ((c + scroll) / chevronCount) * (len - 22) + 12;
      const chevAlpha = 0.55 + 0.4 * Math.sin(progress * Math.PI);
      g.moveTo(tPos - 7, -halfW * 0.65)
        .lineTo(tPos + 3, 0)
        .lineTo(tPos - 7, halfW * 0.65)
        .stroke({
          color: PALETTE.BUTTER_YELLOW,
          width: 2.6,
          alpha: chevAlpha,
          cap: 'round',
          join: 'round',
        });
    }

    // Pointed vanguard spearhead at the end of the charge lane
    g.moveTo(len - 10, -halfW * 0.95)
      .lineTo(len + 6, 0)
      .lineTo(len - 10, halfW * 0.95)
      .closePath()
      .fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.85 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

    g.setTransform(new PIXI.Matrix());

    // Overhead charge indicator fill bar directly above the charger
    const barW = rPx * 1.8;
    const barH = 5;
    const barX = ex - barW / 2;
    const barY = ey - rPx - 16;
    g.roundRect(barX, barY, barW, barH, 2.5)
      .fill({ color: 0x18111a, alpha: 0.85 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.4 });
    g.roundRect(barX + 1, barY + 1, Math.max(0, (barW - 2) * progress), barH - 2, 1.5)
      .fill({
        color: progress > 0.82 ? PALETTE.BUTTER_YELLOW : PALETTE.CRIMSON_WARN,
        alpha: 0.95,
      });

    // Target lock reticle at destination
    g.circle(tx, ty, 9 * (1.2 - progress * 0.35)).stroke({
      color: PALETTE.BUTTER_YELLOW,
      width: 2,
      alpha: 0.85,
    });
  }

  public modifyTransform(
    ctx: EnemyRenderContext,
    baseCy: number
  ): EnemyTransformModifiers {
    const { enemy: e, ex, cosA, sinA } = ctx;
    if (e.aiState === 'telegraph') {
      return {
        animScaleX: 1.15,
        animScaleY: 0.86,
        renderX: ex - cosA * 3.5,
        cy: baseCy - sinA * 3.5,
      };
    }
    if (e.aiState === 'charge') {
      return {
        animScaleX: 1.24,
        animScaleY: 0.82,
      };
    }
    return {};
  }
}
