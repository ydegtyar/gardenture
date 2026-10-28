import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { clamp, lerp } from '../../../core/math/vec2';
import { PPU } from '../EnvironmentRenderer';
import type { SimProjectile, SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Arbalete (formerly Thorn Spear) bolt projectiles and firing line visual effects.
 */
export function drawArbaleteLineEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number,
  fade: number
): void {
  // Arbalete Firing Animation: Bowstring release wave, muzzle flash & bolt launch slipstream
  const x1 = fx.x * PPU;
  const y1 = fx.y * PPU;
  const x2 = fx.targetX * PPU;
  const y2 = fx.targetY * PPU;
  const cosA = Math.cos(fx.angle);
  const sinA = Math.sin(fx.angle);
  const perpX = -sinA;
  const perpY = cosA;
  const muzzleX = x1 + cosA * 18;
  const muzzleY = y1 + sinA * 18;

  // 1. Bowstring snap crescent wave at the Arbalete muzzle
  const snapSpread = 16 * (0.6 + 0.5 * progress);
  g.moveTo(muzzleX - cosA * 6 + perpX * snapSpread, muzzleY - sinA * 6 + perpY * snapSpread)
    .quadraticCurveTo(
      muzzleX + cosA * 12,
      muzzleY + sinA * 12,
      muzzleX - cosA * 6 - perpX * snapSpread,
      muzzleY - sinA * 6 - perpY * snapSpread
    )
    .stroke({
      color: PALETTE.BUTTER_YELLOW,
      width: 3.5 * fade,
      alpha: 0.9 * fade,
      cap: 'round',
    });

  // 2. High-velocity bolt launch slipstream & wind-tunnel rails
  g.moveTo(muzzleX, muzzleY)
    .lineTo(x2, y2)
    .stroke({
      color: fx.color,
      width: Math.max(4, fx.radius * PPU * 0.55) * fade,
      alpha: 0.45 * fade,
      cap: 'round',
    });
  g.moveTo(muzzleX, muzzleY)
    .lineTo(x2, y2)
    .stroke({
      color: PALETTE.CREAM_WHITE,
      width: 2.8 * fade,
      alpha: 0.92 * fade,
      cap: 'round',
    });

  // 3. Sonic air-compression chevrons along the bolt flight path
  for (let wIdx = 1; wIdx <= 2; wIdx++) {
    const frac = clamp(progress * 0.85 + wIdx * 0.25, 0.15, 0.95);
    const wx = lerp(muzzleX, x2, frac);
    const wy = lerp(muzzleY, y2, frac);
    const wingSpan = (11 - wIdx * 2) * fade;
    g.moveTo(wx - cosA * 8 + perpX * wingSpan, wy - sinA * 8 + perpY * wingSpan)
      .lineTo(wx + cosA * 4, wy + sinA * 4)
      .lineTo(wx - cosA * 8 - perpX * wingSpan, wy - sinA * 8 - perpY * wingSpan)
      .stroke({
        color: fx.arcRad > 0 ? PALETTE.GOLD_STAR : PALETTE.CREAM_WHITE,
        width: 2.2 * fade,
        alpha: 0.82 * fade,
        cap: 'round',
        join: 'round',
      });
  }

  // Visible doubled parallel twin bolt trace when Echo Swing triggers!
  if (fx.isEcho) {
    const offX = perpX * 10;
    const offY = perpY * 10;
    g.moveTo(muzzleX + offX, muzzleY + offY)
      .lineTo(x2 + offX, y2 + offY)
      .stroke({
        color: PALETTE.BUTTER_YELLOW,
        width: 3.5 * fade,
        alpha: 0.85 * fade,
        cap: 'round',
      });
  }
}

export function drawArbaleteBoltProjectile(
  g: PIXI.Graphics,
  p: SimProjectile,
  px: number,
  py: number,
  rPx: number,
  angle: number
): void {
  // High-Velocity Fletched Crossbow Bolt fired from the Briar Arbalete
  const m = new PIXI.Matrix();
  m.rotate(angle);
  m.translate(px, py);
  g.setTransform(m);

  const boltLen = Math.max(18, rPx * 1.75);
  const finW = Math.max(5.5, rPx * 0.65);

  // High-speed slipstream wake lines behind bolt
  g.moveTo(-boltLen * 1.35, -finW * 0.45)
    .lineTo(-boltLen * 0.45, -finW * 0.45)
    .moveTo(-boltLen * 1.35, finW * 0.45)
    .lineTo(-boltLen * 0.45, finW * 0.45)
    .stroke({ color: PALETTE.CREAM_WHITE, width: 1.6, alpha: 0.65, cap: 'round' });

  // Fletched feather fins at rear of bolt
  g.moveTo(-boltLen * 0.88, -finW)
    .lineTo(-boltLen * 0.38, -1.8)
    .lineTo(-boltLen * 0.38, 1.8)
    .lineTo(-boltLen * 0.88, finW)
    .lineTo(-boltLen * 0.68, 0)
    .closePath()
    .fill({ color: p.explodesOnExpire ? PALETTE.BUTTER_YELLOW : PALETTE.CREAM_WHITE })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

  // Hardwood / Iron Bolt Shaft
  g.roundRect(-boltLen * 0.65, -2.4, boltLen * 1.15, 4.8, 2)
    .fill({ color: p.explodesOnExpire ? 0xbe123c : 0x8c5a3c })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0 });

  // Broad Barbed Crossbow Bolt Head
  g.moveTo(boltLen * 0.95, 0)
    .lineTo(boltLen * 0.22, -finW * 0.95)
    .lineTo(boltLen * 0.38, 0)
    .lineTo(boltLen * 0.22, finW * 0.95)
    .closePath()
    .fill({ color: p.color })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });

  // Evolved Explosive Warhead Core at bolt tip
  if (p.explodesOnExpire) {
    g.circle(boltLen * 0.55, 0, 4.2)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: 0xf43f5e, width: 1.8 });
  }

  g.setTransform(new PIXI.Matrix());
}
