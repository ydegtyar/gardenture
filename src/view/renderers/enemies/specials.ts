import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { clamp } from '../../../core/math/vec2';
import type { SimEnemy } from '../../../sim/Simulation';

/**
 * Stationary Big Arena Flower (`isArenaFlower`).
 */
export function drawArenaFlowerModel(
  g: PIXI.Graphics,
  e: SimEnemy,
  ex: number,
  ey: number,
  rPx: number,
  elapsedSeconds: number
): void {
  const sway = Math.sin(elapsedSeconds * 2.4 + e.id) * 2.5;
  const pulse = 0.94 + 0.06 * Math.sin(elapsedSeconds * 4.2 + e.id);
  const isHit = e.hitFlashTimer > 0;

  for (let i = 0; i < 4; i++) {
    const la = (i / 4) * Math.PI * 2 + 0.35;
    const lx = ex + Math.cos(la) * (rPx * 0.72);
    const ly = ey + Math.sin(la) * (rPx * 0.55) + 6;
    g.ellipse(lx, ly, rPx * 0.55, rPx * 0.32)
      .fill({ color: isHit ? PALETTE.CREAM_WHITE : 0x10b981, alpha: 0.92 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
  }

  const cx = ex + sway;
  const cy = ey - 4;
  const petalCount = 8;
  for (let p = 0; p < petalCount; p++) {
    const pa = (p / petalCount) * Math.PI * 2 + elapsedSeconds * 0.35;
    const px = cx + Math.cos(pa) * (rPx * 0.62 * pulse);
    const py = cy + Math.sin(pa) * (rPx * 0.62 * pulse);
    const petalCol = isHit
      ? PALETTE.CREAM_WHITE
      : p % 2 === 0
        ? PALETTE.BLUSH_ROSE
        : 0xfb7185;
    g.circle(px, py, rPx * 0.42 * pulse)
      .fill({ color: petalCol, alpha: 0.96 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
  }

  g.circle(cx, cy, rPx * 0.46 * pulse)
    .fill({ color: isHit ? PALETTE.CREAM_WHITE : PALETTE.BUTTER_YELLOW })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.8 });
  g.circle(cx - rPx * 0.12, cy - rPx * 0.12, rPx * 0.16).fill({
    color: PALETTE.CREAM_WHITE,
    alpha: 0.85,
  });

  const bw = rPx * 2.2;
  const bh = 6;
  const bx = ex - bw / 2;
  const by = cy - rPx - 14;
  g.rect(bx, by, bw, bh)
    .fill({ color: PALETTE.DEEP_SLATE, alpha: 0.9 })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });
  g.rect(bx + 1, by + 1, (bw - 2) * clamp(e.hp / e.maxHp, 0, 1), bh - 2).fill({
    color: PALETTE.BUTTER_YELLOW,
  });
}

/**
 * Stationary destructible Hero Grave (`isHeroGrave`).
 */
export function drawHeroGraveModel(
  g: PIXI.Graphics,
  e: SimEnemy,
  ex: number,
  ey: number,
  rPx: number,
  _elapsedSeconds: number
): void {
  const isHit = e.hitFlashTimer > 0;

  // Mossy stone base plinth
  g.roundRect(ex - rPx * 0.92, ey + 2, rPx * 1.84, rPx * 0.52, 5)
    .fill({ color: isHit ? PALETTE.CREAM_WHITE : 0x475569 })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.8 });

  // Arched headstone tablet
  g.roundRect(ex - rPx * 0.72, ey - rPx * 1.15, rPx * 1.44, rPx * 1.35, 11)
    .fill({ color: isHit ? PALETTE.CREAM_WHITE : 0x64748b })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });

  // Carved "RIP" inscription on the headstone
  const ripY = ey - rPx * 0.48;
  const rx = ex - 8.2;
  const ix = ex;
  const px = ex + 8.2;

  const drawRipStrokes = (color: number, width: number) => {
    // 'R'
    g.moveTo(rx - 2.6, ripY + 5.2)
      .lineTo(rx - 2.6, ripY - 5.2)
      .lineTo(rx + 1.4, ripY - 5.2)
      .lineTo(rx + 2.6, ripY - 2.6)
      .lineTo(rx + 1.4, ripY)
      .lineTo(rx - 2.6, ripY)
      .moveTo(rx + 0.4, ripY)
      .lineTo(rx + 2.8, ripY + 5.2)
      // 'I'
      .moveTo(ix - 1.8, ripY - 5.2)
      .lineTo(ix + 1.8, ripY - 5.2)
      .moveTo(ix, ripY - 5.2)
      .lineTo(ix, ripY + 5.2)
      .moveTo(ix - 1.8, ripY + 5.2)
      .lineTo(ix + 1.8, ripY + 5.2)
      // 'P'
      .moveTo(px - 2.4, ripY + 5.2)
      .lineTo(px - 2.4, ripY - 5.2)
      .lineTo(px + 1.6, ripY - 5.2)
      .lineTo(px + 2.8, ripY - 2.4)
      .lineTo(px + 1.6, ripY + 0.2)
      .lineTo(px - 2.4, ripY + 0.2)
      .stroke({ color, width, cap: 'round', join: 'round' });
  };

  drawRipStrokes(PALETTE.INK_OUTLINE, 3.8);
  drawRipStrokes(PALETTE.CREAM_WHITE, 1.8);

  // Small wildflower offering at base of grave
  g.circle(ex - rPx * 0.45, ey + 4, 4.2)
    .fill({ color: PALETTE.BLUSH_ROSE })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
  g.circle(ex + rPx * 0.45, ey + 4, 3.8)
    .fill({ color: PALETTE.BUTTER_YELLOW })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
}
