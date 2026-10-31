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

  // Visual tier flairs based on Garden Blade projectile-slicing level:
  const lvl = fx.bladeLevel ?? 1;
  if (lvl >= 2) {
    const midA = fx.angle;
    const midX = cx + Math.cos(midA) * r;
    const midY = cy + Math.sin(midA) * r;
    g.circle(midX, midY, (lvl >= 5 ? 5.5 : lvl >= 3 ? 4.2 : 3.2) * fade).fill({
      color: lvl >= 5 ? PALETTE.BUTTER_YELLOW : lvl >= 3 ? PALETTE.MINT_GREEN : PALETTE.CREAM_WHITE,
      alpha: 0.9 * fade,
    });
  }
}

/**
 * Renders the satisfying projectile slice / shatter effect when Garden Blade destroys an enemy projectile.
 */
export function drawGardenBladeProjectileSliceEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number,
  fade: number
): void {
  const cx = fx.x * PPU;
  const cy = fx.y * PPU;
  const rPx = Math.max(12, fx.radius * PPU * (1 + progress * 0.4));
  const slashAngle = fx.angle;
  const perpA = slashAngle + Math.PI / 2;

  // 1. Sharp clean razor cut line through projectile center
  const cutLen = rPx * (1.8 + progress * 0.8);
  const cosS = Math.cos(slashAngle);
  const sinS = Math.sin(slashAngle);
  g.moveTo(cx - cosS * cutLen, cy - sinS * cutLen)
    .lineTo(cx + cosS * cutLen, cy + sinS * cutLen)
    .stroke({
      color: PALETTE.CREAM_WHITE,
      width: 4 * fade,
      alpha: 0.95 * fade,
      cap: 'round',
    });

  // 2. Twin severed halves drifting outward perpendicular to the slice cut
  const drift = progress * rPx * 1.25;
  const perpX = Math.cos(perpA) * drift;
  const perpY = Math.sin(perpA) * drift;

  for (const dir of [-1, 1] as const) {
    const halfX = cx + perpX * dir;
    const halfY = cy + perpY * dir;
    g.circle(halfX, halfY, rPx * 0.45 * fade)
      .fill({ color: fx.color || PALETTE.CRIMSON_WARN, alpha: 0.8 * fade })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 * fade, alpha: 0.8 * fade });
  }

  // 3. Botanical spark burst around the slice
  for (let s = 0; s < 4; s++) {
    const sparkAngle = slashAngle + (s / 4) * Math.PI * 2 + progress * 2.5;
    const sparkDist = rPx * (0.8 + progress * 1.5);
    const sx = cx + Math.cos(sparkAngle) * sparkDist;
    const sy = cy + Math.sin(sparkAngle) * sparkDist;
    g.circle(sx, sy, Math.max(1, 2.8 * fade)).fill({
      color: PALETTE.MINT_GREEN,
      alpha: 0.85 * fade,
    });
  }
}

/** Convenience alias for Leaf Blade slash effect */
export const drawLeafBladeEffect = drawGardenBladeEffect;
