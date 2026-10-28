import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Chain Lightning visual effects (arcing zig-zag bolts and Echo Swing secondary arcs).
 */
export function drawChainLightningEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  fade: number
): void {
  const x1 = fx.x * PPU;
  const y1 = fx.y * PPU;
  const x2 = fx.targetX * PPU;
  const y2 = fx.targetY * PPU;
  const midX = (x1 + x2) / 2 + (y2 - y1) * 0.18;
  const midY = (y1 + y2) / 2 - (x2 - x1) * 0.18;

  g.moveTo(x1, y1)
    .lineTo(midX, midY)
    .lineTo(x2, y2)
    .stroke({
      color: fx.color,
      width: 5 * fade,
      alpha: 0.9 * fade,
    });

  if (fx.isEcho) {
    const midX2 = (x1 + x2) / 2 - (y2 - y1) * 0.18;
    const midY2 = (y1 + y2) / 2 + (x2 - x1) * 0.18;
    g.moveTo(x1, y1)
      .lineTo(midX2, midY2)
      .lineTo(x2, y2)
      .stroke({
        color: PALETTE.BUTTER_YELLOW,
        width: 3.5 * fade,
        alpha: 0.85 * fade,
      });
  }
}
