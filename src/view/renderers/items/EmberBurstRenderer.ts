import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Ember Burst / Ember Guard activation visual effect.
 */
export function drawEmberBurstEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number,
  fade: number
): void {
  const cx = fx.x * PPU;
  const cy = fx.y * PPU;
  const maxR = fx.radius * PPU;
  const easeOut = 1 - Math.pow(1 - progress, 2.0);
  const r = maxR * (0.35 + 0.65 * easeOut);

  g.circle(cx, cy, r)
    .fill({ color: 0xfb923c, alpha: 0.22 * fade })
    .stroke({ color: 0xf43f5e, width: 6 * fade, alpha: 0.92 * fade });
  g.circle(cx, cy, r * 0.75).stroke({
    color: PALETTE.BUTTER_YELLOW,
    width: 3 * fade,
    alpha: 0.9 * fade,
  });

  const tongues = 8;
  for (let tIdx = 0; tIdx < tongues; tIdx++) {
    const ta = fx.angle + progress * 2.2 + (tIdx / tongues) * Math.PI * 2;
    const tx = cx + Math.cos(ta) * r;
    const ty = cy + Math.sin(ta) * r;
    g.circle(tx, ty, 5.5 * fade)
      .fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.92 * fade })
      .stroke({ color: 0xf43f5e, width: 2 * fade, alpha: 0.85 * fade });
  }
}
