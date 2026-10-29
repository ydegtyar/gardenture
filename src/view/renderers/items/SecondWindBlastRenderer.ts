import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Second Wind resurrection blast + rising feathers.
 */
export function drawSecondWindBlastEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number,
  fade: number
): void {
  const cx = fx.x * PPU;
  const cy = fx.y * PPU;
  const maxR = fx.radius * PPU;
  const easeOut = 1 - Math.pow(1 - progress, 2.2);
  const r = maxR * (0.25 + 0.75 * easeOut);

  g.circle(cx, cy, r)
    .fill({ color: PALETTE.MINT_GREEN, alpha: 0.22 * fade })
    .stroke({ color: PALETTE.BUTTER_YELLOW, width: 6 * fade, alpha: 0.95 * fade });
  g.circle(cx, cy, r * 0.72).stroke({
    color: PALETTE.MINT_GREEN,
    width: 3.5 * fade,
    alpha: 0.9 * fade,
  });

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + progress * 1.5;
    const px = cx + Math.cos(a) * (r * 0.65);
    const py = cy + Math.sin(a) * (r * 0.5) - progress * 34;
    g.ellipse(px, py, 5 * fade, 2.4 * fade)
      .fill({ color: i % 2 === 0 ? PALETTE.BUTTER_YELLOW : PALETTE.MINT_GREEN, alpha: 0.95 * fade })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.4, alpha: 0.75 * fade });
  }
}
