import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Dash Strike Burst visual effect:
 * Directional wind-slash crescents, 8-point starburst lances, and flying shards.
 */
export function drawDashStrikeBurstEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number,
  fade: number
): void {
  const cx = fx.x * PPU;
  const cy = fx.y * PPU;
  const maxR = fx.radius * PPU;
  const easeOut = 1 - Math.pow(1 - progress, 2.2);
  const r = maxR * (0.35 + 0.75 * easeOut);

  // 8-point starburst of sharp lances radiating outward
  const spikes = 8;
  for (let i = 0; i < spikes; i++) {
    const a = fx.angle + (i * Math.PI * 2) / spikes + progress * 0.35;
    const isMajor = i % 2 === 0;
    const innerR = r * (0.18 + 0.35 * progress);
    const outerR = r * (isMajor ? 1.12 : 0.78);
    const halfSpread = isMajor ? 0.14 : 0.09;

    const xIn = cx + Math.cos(a) * innerR;
    const yIn = cy + Math.sin(a) * innerR;
    const xTip = cx + Math.cos(a) * outerR;
    const yTip = cy + Math.sin(a) * outerR;
    const midR = (innerR + outerR) * 0.48;
    const xL = cx + Math.cos(a - halfSpread) * midR;
    const yL = cy + Math.sin(a - halfSpread) * midR;
    const xR = cx + Math.cos(a + halfSpread) * midR;
    const yR = cy + Math.sin(a + halfSpread) * midR;

    g.moveTo(xIn, yIn)
      .lineTo(xL, yL)
      .lineTo(xTip, yTip)
      .lineTo(xR, yR)
      .closePath()
      .fill({
        color: isMajor ? fx.color : PALETTE.BUTTER_YELLOW,
        alpha: (isMajor ? 0.88 : 0.75) * fade,
      })
      .stroke({
        color: PALETTE.INK_OUTLINE,
        width: 1.6 * fade,
        alpha: 0.75 * fade,
      });
  }

  // Directional wind-slash crescent blades along dash angle
  for (let w = -1; w <= 1; w += 2) {
    const arcAngle = fx.angle + w * 0.45;
    const arcR = r * 0.86;
    const ax0 = cx + Math.cos(arcAngle - 0.55) * (arcR * 0.75);
    const ay0 = cy + Math.sin(arcAngle - 0.55) * (arcR * 0.75);
    const axMid = cx + Math.cos(arcAngle) * (arcR * 1.15);
    const ayMid = cy + Math.sin(arcAngle) * (arcR * 1.15);
    const ax1 = cx + Math.cos(arcAngle + 0.55) * (arcR * 0.75);
    const ay1 = cy + Math.sin(arcAngle + 0.55) * (arcR * 0.75);

    g.moveTo(ax0, ay0)
      .quadraticCurveTo(axMid, ayMid, ax1, ay1)
      .stroke({
        color: PALETTE.CREAM_WHITE,
        width: 3.2 * fade,
        alpha: 0.88 * fade,
        cap: 'round',
      });
  }
}
