import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Aegis Orb activation burst:
 * Expanding hexagonal crystalline rune ward with 6 flying shield crests.
 */
export function drawAegisBurstEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number,
  fade: number
): void {
  const cx = fx.x * PPU;
  const cy = fx.y * PPU;
  const easeOut = 1 - Math.pow(1 - progress, 2.0);
  const r = fx.radius * PPU * (0.42 + 0.65 * easeOut);
  const rot = progress * 0.9;

  // Outer & inner rotating hexagonal ward lines
  for (let layer = 0; layer < 2; layer++) {
    const polyR = r * (layer === 0 ? 1.0 : 0.64);
    const layerRot = layer === 0 ? rot : -rot;
    for (let i = 0; i < 6; i++) {
      const a = layerRot + (i * Math.PI) / 3;
      const px = cx + Math.cos(a) * polyR;
      const py = cy + Math.sin(a) * polyR;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath().stroke({
      color: layer === 0 ? PALETTE.SKY_BLUE : PALETTE.MINT_GREEN,
      width: (layer === 0 ? 3.2 : 2.0) * fade,
      alpha: 0.88 * fade,
    });
  }

  // 6 crystalline shield crests at the hexagon vertices
  for (let i = 0; i < 6; i++) {
    const a = rot + (i * Math.PI) / 3;
    const vx = cx + Math.cos(a) * r;
    const vy = cy + Math.sin(a) * r;
    const s = 5.5 * fade;
    g.moveTo(vx, vy - s)
      .lineTo(vx + s * 0.8, vy)
      .lineTo(vx, vy + s)
      .lineTo(vx - s * 0.8, vy)
      .closePath()
      .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.92 * fade })
      .stroke({ color: PALETTE.SKY_BLUE, width: 1.8 * fade, alpha: 0.9 * fade });
  }
}
