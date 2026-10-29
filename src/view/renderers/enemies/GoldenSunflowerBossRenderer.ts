import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimEnemy } from '../../../sim/Simulation';
import type {
  EnemyBehaviorRenderer,
  EnemyRenderContext,
  EnemyTransformModifiers,
} from './types';

export class GoldenSunflowerBossRenderer implements EnemyBehaviorRenderer {
  public readonly id = 'bloom_giant';

  public matches(enemy: SimEnemy): boolean {
    return Boolean(enemy.isSpecial && enemy.specialId === 'bloom_giant');
  }

  public hasLegs(_enemy: SimEnemy): boolean {
    return true;
  }

  public drawTelegraph(ctx: EnemyRenderContext, progress: number): void {
    const { telegraphGraphic: g, enemy: e, ex, ey, rPx, sim } = ctx;
    const mode = e.bossAttackMode ?? 'sunflower_charge';

    if (mode === 'sunflower_charge') {
      // Yellow Charging Arrow instead of red rectangle
      const tx = e.telegraphTargetX * PPU;
      const ty = e.telegraphTargetY * PPU;
      const len = Math.max(36, Math.hypot(tx - ex, ty - ey));
      const m = new PIXI.Matrix();
      m.rotate(e.telegraphAngle);
      m.translate(ex, ey);
      g.setTransform(m);

      const shaftHalfW = rPx * 0.46;
      const headHalfW = rPx * 0.95;
      const shaftLen = Math.max(18, len - 24);

      // Outer yellow arrow silhouette
      g.moveTo(0, -shaftHalfW)
        .lineTo(shaftLen, -shaftHalfW)
        .lineTo(shaftLen, -headHalfW)
        .lineTo(len + 6, 0)
        .lineTo(shaftLen, headHalfW)
        .lineTo(shaftLen, shaftHalfW)
        .lineTo(0, shaftHalfW)
        .closePath()
        .fill({ color: 0xfbbf24, alpha: 0.24 })
        .stroke({ color: PALETTE.BUTTER_YELLOW, width: 3, alpha: 0.92 });

      // Inner filling golden charge arrow
      const fillLen = shaftLen * progress;
      g.rect(0, -shaftHalfW * 0.78, fillLen, shaftHalfW * 1.56).fill({
        color: PALETTE.BUTTER_YELLOW,
        alpha: 0.52 + 0.25 * progress,
      });

      // Scrolling golden chevrons inside the arrow shaft
      for (let c = 0; c < 3; c++) {
        const cx = (((c + sim.elapsedSeconds * 4) % 3) / 3) * (shaftLen - 12) + 8;
        g.moveTo(cx - 6, -shaftHalfW * 0.65)
          .lineTo(cx + 4, 0)
          .lineTo(cx - 6, shaftHalfW * 0.65)
          .setTransform(m)
          .stroke({ color: PALETTE.CREAM_WHITE, width: 2.5, alpha: 0.9, cap: 'round' });
      }

      g.setTransform(new PIXI.Matrix());
    } else if (mode === 'sunflower_seed_volley') {
      // 5 Golden Seed Fan Volley aim lines
      for (let s = -2; s <= 2; s++) {
        const a = e.telegraphAngle + s * 0.19;
        const rayLen = 155 * (0.4 + 0.6 * progress);
        const rx = ex + Math.cos(a) * rayLen;
        const ry = ey + Math.sin(a) * rayLen;
        g.moveTo(ex, ey)
          .lineTo(rx, ry)
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.2, alpha: 0.65 });
        g.circle(rx, ry, 4.5)
          .fill({ color: 0xfbbf24, alpha: 0.9 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
      }
    } else {
      // 8-Leaf Radial Spiral telegraph vortex around Sunflower
      const vortexR = rPx * (1.35 + progress * 0.85);
      g.circle(ex, ey, vortexR).stroke({
        color: PALETTE.MINT_GREEN,
        width: 3,
        alpha: 0.78,
      });
      for (let l = 0; l < 8; l++) {
        const a = e.telegraphAngle + (l / 8) * Math.PI * 2 + progress * 1.6;
        const lx = ex + Math.cos(a) * vortexR;
        const ly = ey + Math.sin(a) * vortexR;
        g.ellipse(lx, ly, 6.5, 3.2)
          .fill({ color: PALETTE.MINT_GREEN, alpha: 0.9 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
      }
    }
  }

  public modifyTransform(
    ctx: EnemyRenderContext,
    baseCy: number
  ): EnemyTransformModifiers {
    const { enemy: e, ex, sim } = ctx;
    const mode = e.bossAttackMode ?? 'sunflower_charge';

    if (e.aiState === 'telegraph') {
      if (mode === 'sunflower_charge') {
        const jitter = Math.sin(sim.elapsedSeconds * 42) * 2.2;
        return {
          renderX: ex - (Math.cos(e.telegraphAngle) * 7 - jitter),
          cy: baseCy - Math.sin(e.telegraphAngle) * 7,
          animScaleX: 1.14,
          animScaleY: 0.88,
        };
      }
      if (mode === 'sunflower_seed_volley') {
        const swell = 1.12 + Math.sin(sim.elapsedSeconds * 24) * 0.1;
        return {
          animScaleX: swell,
          animScaleY: swell,
        };
      }
      return {
        animRotation: sim.elapsedSeconds * 7.5,
      };
    }
    return {};
  }

  public drawOverlay(
    ctx: EnemyRenderContext,
    renderX: number,
    cy: number
  ): void {
    const { gOver, enemy: e, rPx, sim } = ctx;
    if (e.aiState !== 'telegraph') return;
    const mode = e.bossAttackMode ?? 'sunflower_charge';

    if (mode === 'sunflower_seed_volley') {
      const coreScale = 1.0 + Math.sin(sim.elapsedSeconds * 24) * 0.18;
      gOver.circle(renderX, cy, rPx * 0.48 * coreScale)
        .fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.45 })
        .stroke({ color: 0xfbbf24, width: 2.2 });
      for (let d = 0; d < 5; d++) {
        const da = (d / 5) * Math.PI * 2 + sim.elapsedSeconds * 4;
        gOver.circle(
          renderX + Math.cos(da) * (rPx * 0.32 * coreScale),
          cy + Math.sin(da) * (rPx * 0.32 * coreScale),
          3.2
        )
          .fill({ color: 0x78350f })
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 1.5 });
      }
    } else if (mode === 'sunflower_leaf_spiral') {
      for (let p = 0; p < 6; p++) {
        const pa = sim.elapsedSeconds * 6 + (p / 6) * Math.PI * 2;
        const px = renderX + Math.cos(pa) * (rPx * 0.92);
        const py = cy + Math.sin(pa) * (rPx * 0.92);
        gOver.ellipse(px, py, 5.5, 2.8)
          .fill({ color: PALETTE.MINT_GREEN, alpha: 0.92 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
      }
    }
  }
}
