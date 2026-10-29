import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Shockwave Blast visual effect (from shockwave power-up / arrival).
 */
export function drawShockwaveBlastEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number,
  fade: number
): void {
  const cx = fx.x * PPU;
  const cy = fx.y * PPU;
  const maxR = fx.radius * PPU;
  const easeOut = 1 - Math.pow(1 - progress, 2.4);
  const outerR = maxR * (0.22 + 0.78 * easeOut);
  const innerR = maxR * Math.max(0.08, easeOut - 0.24);

  g.circle(cx, cy, outerR)
    .fill({ color: fx.color, alpha: 0.2 * fade })
    .stroke({ color: fx.color, width: 7 * fade, alpha: 0.95 * fade });
  g.circle(cx, cy, innerR).stroke({
    color: PALETTE.CREAM_WHITE,
    width: 3.5 * fade,
    alpha: 0.9 * fade,
  });

  const rays = 8;
  for (let rIdx = 0; rIdx < rays; rIdx++) {
    const ra = fx.angle + (rIdx / rays) * Math.PI * 2;
    const rStart = innerR * 0.45;
    const rEnd = outerR * 1.06;
    g.moveTo(cx + Math.cos(ra) * rStart, cy + Math.sin(ra) * rStart)
      .lineTo(cx + Math.cos(ra) * rEnd, cy + Math.sin(ra) * rEnd)
      .stroke({
        color: PALETTE.CREAM_WHITE,
        width: 2.8 * fade,
        alpha: 0.85 * fade,
        cap: 'round',
      });
  }
}
