import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimEnemy } from '../../../sim/Simulation';
import type {
  EnemyBehaviorRenderer,
  EnemyRenderContext,
  EnemyTransformModifiers,
} from './types';

export class FinalBossRenderer implements EnemyBehaviorRenderer {
  public readonly id = 'final_boss';

  public matches(enemy: SimEnemy): boolean {
    return Boolean(enemy.isFinalBoss);
  }

  public hasLegs(_enemy: SimEnemy): boolean {
    return true;
  }

  public drawTelegraph(ctx: EnemyRenderContext, progress: number): void {
    const { telegraphGraphic: g, enemy: e, ex, ey, rPx, sim } = ctx;
    const mode = e.bossAttackMode ?? 'boss_p1_root_slam';

    if (mode === 'boss_p1_vine_whip') {
      const len = 6.0 * PPU;
      const halfW = 0.85 * PPU;
      const m = new PIXI.Matrix();
      m.rotate(e.telegraphAngle);
      m.translate(ex, ey);
      g.setTransform(m);

      // Emerald vine lash lane
      g.roundRect(0, -halfW, len, halfW * 2, 10)
        .fill({ color: 0x059669, alpha: 0.18 })
        .stroke({ color: PALETTE.MINT_GREEN, width: 2.5, alpha: 0.85 });
      g.roundRect(0, -halfW * 0.82, len * progress, halfW * 1.64, 8).fill({
        color: 0x10b981,
        alpha: 0.34 + 0.25 * progress,
      });

      // Coiling vine wave along the corridor
      g.moveTo(0, 0);
      for (let step = 1; step <= 8; step++) {
        const sx = (step / 8) * len * progress;
        const sy = Math.sin(step * 1.3 + sim.elapsedSeconds * 12) * (halfW * 0.55);
        g.lineTo(sx, sy);
      }
      g.stroke({ color: PALETTE.BUTTER_YELLOW, width: 3.0, alpha: 0.9, cap: 'round' });
      g.setTransform(new PIXI.Matrix());

      // 5 Emerald Thorn fan rays
      for (let s = -2; s <= 2; s++) {
        const a = e.telegraphAngle + s * 0.16;
        const rayR = 3.8 * PPU * (0.4 + 0.6 * progress);
        g.moveTo(ex, ey)
          .lineTo(ex + Math.cos(a) * rayR, ey + Math.sin(a) * rayR)
          .stroke({ color: PALETTE.MINT_GREEN, width: 2.0, alpha: 0.72 });
      }
    } else if (mode === 'boss_p1_root_slam') {
      const slamR = 2.5 * PPU;
      const tx = e.telegraphTargetX * PPU;
      const ty = e.telegraphTargetY * PPU;
      g.circle(tx, ty, slamR)
        .fill({ color: 0x10b981, alpha: 0.15 })
        .stroke({ color: PALETTE.MINT_GREEN, width: 3.0, alpha: 0.88 });
      g.circle(tx, ty, slamR * progress).fill({
        color: 0x059669,
        alpha: 0.35,
      });
      for (let b = 0; b < 8; b++) {
        const a = e.telegraphAngle + (b / 8) * Math.PI * 2;
        const rx = tx + Math.cos(a) * (slamR * 1.25);
        const ry = ty + Math.sin(a) * (slamR * 1.25);
        g.moveTo(tx + Math.cos(a) * (slamR * 0.5), ty + Math.sin(a) * (slamR * 0.5))
          .lineTo(rx, ry)
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.2, alpha: 0.78, cap: 'round' });
      }
    } else if (mode === 'boss_p2_bramble_charge') {
      const len = 5.2 * PPU;
      const halfW = rPx * 0.78;
      const m = new PIXI.Matrix();
      m.rotate(e.telegraphAngle);
      m.translate(ex, ey);
      g.setTransform(m);

      g.roundRect(0, -halfW, len, halfW * 2, 10)
        .fill({ color: 0xec4899, alpha: 0.18 })
        .stroke({ color: 0xf472b6, width: 2.8, alpha: 0.9 });
      g.roundRect(0, -halfW * 0.8, len * progress, halfW * 1.6, 8).fill({
        color: 0xec4899,
        alpha: 0.36 + 0.25 * progress,
      });
      for (let c = 0; c < 4; c++) {
        const cx = (((c + sim.elapsedSeconds * 4.5) % 4) / 4) * (len - 24) + 12;
        g.moveTo(cx - 8, -halfW * 0.6)
          .lineTo(cx + 5, 0)
          .lineTo(cx - 8, halfW * 0.6)
          .setTransform(m)
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.8, alpha: 0.9, cap: 'round' });
      }
      g.setTransform(new PIXI.Matrix());
    } else if (mode === 'boss_p2_petal_spiral') {
      const ringR = rPx * (1.5 + progress * 1.15);
      g.circle(ex, ey, ringR)
        .fill({ color: 0xec4899, alpha: 0.16 })
        .stroke({ color: 0xf472b6, width: 3.2, alpha: 0.9 });
      for (let b = 0; b < 10; b++) {
        const a = (b / 10) * Math.PI * 2 + sim.elapsedSeconds * 3.5;
        const px = ex + Math.cos(a) * ringR;
        const py = ey + Math.sin(a) * ringR;
        g.ellipse(px, py, 7.0, 3.8)
          .fill({ color: 0xec4899, alpha: 0.92 })
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 1.5 });
      }
    } else if (mode === 'boss_p3_crimson_cross') {
      const armLen = 7.2 * PPU;
      const halfW = 0.72 * PPU;
      for (let arm = 0; arm < 4; arm++) {
        const armAngle = e.telegraphAngle + (arm * Math.PI) / 2;
        const m = new PIXI.Matrix();
        m.rotate(armAngle);
        m.translate(ex, ey);
        g.setTransform(m);

        g.roundRect(0, -halfW, armLen, halfW * 2, 8)
          .fill({ color: 0x581c87, alpha: 0.24 })
          .stroke({ color: 0xf43f5e, width: 2.8, alpha: 0.92 });
        g.roundRect(0, -halfW * 0.75, armLen * progress, halfW * 1.5, 6).fill({
          color: 0xe11d48,
          alpha: 0.42 + 0.28 * progress,
        });
      }
      g.setTransform(new PIXI.Matrix());
      g.circle(ex, ey, rPx * 1.35).stroke({
        color: PALETTE.BUTTER_YELLOW,
        width: 3.2,
        alpha: 0.95,
      });
    } else {
      // 'boss_p3_abyssal_nova'
      const slamR = 2.8 * PPU;
      const tx = e.telegraphTargetX * PPU;
      const ty = e.telegraphTargetY * PPU;
      g.circle(tx, ty, slamR)
        .fill({ color: 0x581c87, alpha: 0.22 })
        .stroke({ color: 0xf43f5e, width: 3.4, alpha: 0.92 });
      g.circle(tx, ty, slamR * progress)
        .fill({ color: 0xe11d48, alpha: 0.36 })
        .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.2, alpha: 0.88 });
      for (let b = 0; b < 12; b++) {
        const a = (b / 12) * Math.PI * 2 - sim.elapsedSeconds * 3.0;
        const rOut = slamR * (1.05 + (b % 2) * 0.28);
        g.moveTo(tx + Math.cos(a) * (slamR * 0.65), ty + Math.sin(a) * (slamR * 0.65))
          .lineTo(tx + Math.cos(a) * rOut, ty + Math.sin(a) * rOut)
          .stroke({
            color: b % 2 === 0 ? 0xf43f5e : 0xa855f7,
            width: 2.4,
            alpha: 0.85,
            cap: 'round',
          });
      }
    }
  }

  public modifyTransform(
    _ctx: EnemyRenderContext,
    _baseCy: number
  ): EnemyTransformModifiers {
    return {};
  }
}
