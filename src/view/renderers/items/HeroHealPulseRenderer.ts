import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { clamp } from '../../../core/math/vec2';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Hero Heal pulse centered on the hero with rising green particles.
 */
export function drawHeroHealPulseEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  heroPxX: number,
  heroPxY: number,
  progress: number,
  fade: number
): void {
  const healPower = Math.max(1, fx.arcRad);
  const powerNorm = clamp(healPower / 25, 0.08, 1.5);
  const maxR = fx.radius * PPU;
  const easeOut = 1 - Math.pow(1 - progress, 2.1);
  const currentR = maxR * (0.32 + 0.68 * easeOut);

  // Expanding emerald aura ring around hero
  const ringAlpha = clamp((0.28 + powerNorm * 0.42) * fade, 0.12, 0.85);
  const ringWidth = (2.2 + powerNorm * 3.8) * fade;
  g.circle(heroPxX, heroPxY, currentR)
    .fill({ color: PALETTE.MINT_GREEN, alpha: ringAlpha * 0.28 })
    .stroke({ color: PALETTE.MINT_GREEN, width: ringWidth, alpha: ringAlpha });

  // Rising green particles around the hero (motes + leaves + emerald '+' crosses)
  const particleCount = clamp(Math.round(5 + powerNorm * 7), 5, 14);
  for (let i = 0; i < particleCount; i++) {
    const seedA = (i / particleCount) * Math.PI * 2 + fx.id * 0.65;
    const spreadR = 10 + (i % 3) * 8 + powerNorm * 8;
    const riseHeight = (26 + (i % 4) * 9 + powerNorm * 22) * easeOut;
    const px = heroPxX + Math.cos(seedA + progress * 1.1) * spreadR;
    const py = heroPxY + 10 + Math.sin(seedA) * (spreadR * 0.45) - riseHeight;
    const pSize = (3.4 + (i % 2) * 1.4 + powerNorm * 1.5) * fade;

    if (i % 3 === 0) {
      // Rising emerald '+' cross particle
      g.rect(px - pSize * 0.32, py - pSize, pSize * 0.64, pSize * 2).fill({
        color: PALETTE.MINT_GREEN,
        alpha: 0.92 * fade,
      });
      g.rect(px - pSize, py - pSize * 0.32, pSize * 2, pSize * 0.64).fill({
        color: PALETTE.MINT_GREEN,
        alpha: 0.92 * fade,
      });
    } else if (i % 3 === 1) {
      // Rising green leaf particle
      g.ellipse(px, py, pSize * 1.15, pSize * 0.62)
        .fill({ color: 0x22c55e, alpha: 0.9 * fade })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.1, alpha: 0.65 * fade });
    } else {
      // Glowing mint mote particle going up
      g.circle(px, py, pSize * 0.85)
        .fill({ color: PALETTE.MINT_GREEN, alpha: 0.92 * fade })
        .stroke({ color: PALETTE.CREAM_WHITE, width: 1.0, alpha: 0.75 * fade });
    }
  }
}
