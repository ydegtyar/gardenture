import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Garden Blade visual effects (slash arc & Echo Swing doubled crescent).
 */
export function drawGardenBladeEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  fade: number
): void {
  const cx = fx.x * PPU;
  const cy = fx.y * PPU;
  const r = fx.radius * PPU;
  const startA = fx.angle - fx.arcRad / 2;
  const endA = fx.angle + fx.arcRad / 2;
  const startX = cx + Math.cos(startA) * r;
  const startY = cy + Math.sin(startA) * r;

  g.moveTo(startX, startY)
    .arc(cx, cy, r, startA, endA)
    .stroke({
      color: fx.color,
      width: 14 * fade,
      alpha: 0.78 * fade,
      cap: 'round',
    });
  g.moveTo(startX, startY)
    .arc(cx, cy, r, startA, endA)
    .stroke({
      color: PALETTE.CREAM_WHITE,
      width: 5 * fade,
      alpha: 0.92 * fade,
      cap: 'round',
    });

  // Visible doubled twin crescent animation when Echo Swing triggers!
  if (fx.isEcho) {
    const innerR = r * 0.82;
    const innerStartX = cx + Math.cos(startA) * innerR;
    const innerStartY = cy + Math.sin(startA) * innerR;
    g.moveTo(innerStartX, innerStartY)
      .arc(cx, cy, innerR, startA, endA)
      .stroke({
        color: PALETTE.BUTTER_YELLOW,
        width: 10 * fade,
        alpha: 0.85 * fade,
        cap: 'round',
      });
    g.moveTo(innerStartX, innerStartY)
      .arc(cx, cy, innerR, startA, endA)
      .stroke({
        color: PALETTE.CREAM_WHITE,
        width: 3.5 * fade,
        alpha: 0.95 * fade,
        cap: 'round',
      });
  }
}

/** Convenience alias for Leaf Blade slash effect */
export const drawLeafBladeEffect = drawGardenBladeEffect;
