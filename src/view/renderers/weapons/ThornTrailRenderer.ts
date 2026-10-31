import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';

/**
 * Pretty Thorn Trail hazard visual effect:
 * Intertwined curving dark-emerald & mint briar vines with sharp rose/crimson thorns,
 * small leaves, and blooming rosebuds.
 */
export function drawThornTrailHazard(
  g: PIXI.Graphics,
  hx: number,
  hy: number,
  rPx: number,
  fade: number,
  id: number,
  elapsedSeconds: number
): void {
  const seedRot = (id * 1.37) % (Math.PI * 2);
  const sway = Math.sin(elapsedSeconds * 3.2 + id) * 0.08;

  // 3 intertwined S-curved thorny briar vines across the patch
  for (let v = 0; v < 3; v++) {
    const a = seedRot + sway + (v * Math.PI) / 3;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const perpX = -sinA;
    const perpY = cosA;
    const span = rPx * (0.82 - v * 0.08);
    const wave = rPx * 0.26 * (v % 2 === 0 ? 1 : -1);

    const x0 = hx - cosA * span;
    const y0 = hy - sinA * span;
    const x1 = hx + cosA * span;
    const y1 = hy + sinA * span;
    const cx1 = hx - cosA * (span * 0.35) + perpX * wave;
    const cy1 = hy - sinA * (span * 0.35) + perpY * wave;
    const cx2 = hx + cosA * (span * 0.35) - perpX * wave;
    const cy2 = hy + sinA * (span * 0.35) - perpY * wave;

    // Dark forest outline + vibrant emerald/mint vine stem
    g.moveTo(x0, y0)
      .bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1)
      .stroke({ color: 0x064e3b, width: 5.2 * fade, alpha: 0.85 * fade, cap: 'round' });
    g.moveTo(x0, y0)
      .bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1)
      .stroke({
        color: v === 0 ? PALETTE.MINT_GREEN : 0x10b981,
        width: 2.6 * fade,
        alpha: 0.92 * fade,
        cap: 'round',
      });

    // Sharp crimson/rose thorns jutting along each vine (3 thorns per vine with 1 extra thorn added)
    const thornOffsets = [-0.58, 0.05, 0.62];
    for (let i = 0; i < thornOffsets.length; i++) {
      const t = thornOffsets[i];
      const tx = hx + cosA * (span * t);
      const ty = hy + sinA * (span * t);
      // Alternate sides along the vine for realistic briar growth
      const side = (i % 2 === 0 ? 1 : -1) * (v % 2 === 0 ? 1 : -1);
      const forwardLean = i === 1 ? (v % 2 === 0 ? 1.4 : -1.4) : (t > 0 ? 2.5 : -2.5);
      const tipX = tx + perpX * 6.5 * side + cosA * forwardLean;
      const tipY = ty + perpY * 6.5 * side + sinA * forwardLean;
      g.moveTo(tx - cosA * 2.2, ty - sinA * 2.2)
        .lineTo(tipX, tipY)
        .lineTo(tx + cosA * 2.2, ty + sinA * 2.2)
        .closePath()
        .fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.92 * fade })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.2, alpha: 0.75 * fade });
    }
  }

  // Small emerald leaves & a central blooming rosebud
  for (let l = 0; l < 4; l++) {
    const la = seedRot + (l * Math.PI) / 2 + 0.35;
    const lx = hx + Math.cos(la) * (rPx * 0.45);
    const ly = hy + Math.sin(la) * (rPx * 0.45);
    const m = new PIXI.Matrix();
    m.rotate(la);
    m.translate(lx, ly);
    g.setTransform(m);
    g.moveTo(0, 0)
      .lineTo(4.5, -2.5)
      .lineTo(8.5, 0)
      .lineTo(4.5, 2.5)
      .closePath()
      .fill({ color: PALETTE.MINT_GREEN, alpha: 0.88 * fade })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.2, alpha: 0.7 * fade });
  }
  g.setTransform(new PIXI.Matrix());

  // Center rosebud diamond
  const budSize = 4.8 * fade;
  g.moveTo(hx, hy - budSize)
    .lineTo(hx + budSize, hy)
    .lineTo(hx, hy + budSize)
    .lineTo(hx - budSize, hy)
    .closePath()
    .fill({ color: PALETTE.BLUSH_ROSE, alpha: 0.95 * fade })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5, alpha: 0.8 * fade });
}
