import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { clamp, lerp } from '../../../core/math/vec2';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Celestial Starfall effect when Crit Burst procs:
 * Falling shooting stars and ground starburst impacts.
 */
export function drawCritStarfallEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number,
  fade: number
): void {
  const cx = fx.x * PPU;
  const cy = fx.y * PPU;
  const maxR = fx.radius * PPU;
  const lv = clamp(Math.round(fx.arcRad), 1, 3);
  const starCount = 3 + lv;

  const drawFourPointStar = (
    sx: number,
    sy: number,
    outerR: number,
    innerR: number,
    rot: number,
    col: number,
    alphaVal: number
  ) => {
    for (let i = 0; i < 8; i++) {
      const a = rot + (i * Math.PI) / 4;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = sx + Math.cos(a) * r;
      const py = sy + Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath()
      .fill({ color: col, alpha: alphaVal })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 * fade, alpha: alphaVal * 0.85 });
  };

  // 1. Falling Shooting Stars streaking down from the sky in staggered cascade
  for (let s = 0; s < starCount; s++) {
    const stagger = s * (0.38 / starCount);
    const localT = clamp((progress - stagger) / (1 - stagger * 0.7), 0, 1);
    if (localT <= 0) continue;

    const seedAngle = fx.angle + (s / starCount) * Math.PI * 2 + fx.id * 0.7;
    const offsetDist = s === 0 ? 0 : maxR * (0.32 + (s % 2) * 0.26);
    const landX = cx + Math.cos(seedAngle) * offsetDist;
    const landY = cy + Math.sin(seedAngle) * (offsetDist * 0.75);

    const fallPhase = clamp(localT / 0.52, 0, 1);
    const impactPhase = clamp((localT - 0.45) / 0.55, 0, 1);

    if (fallPhase < 1) {
      const skyStartX = landX + 52;
      const skyStartY = landY - 145;
      const headX = lerp(skyStartX, landX, fallPhase);
      const headY = lerp(skyStartY, landY, fallPhase);
      const tailFrac = Math.max(0, fallPhase - 0.35);
      const tailX = lerp(skyStartX, landX, tailFrac);
      const tailY = lerp(skyStartY, landY, tailFrac);

      // Luminous shooting-star comet tail
      g.moveTo(tailX, tailY)
        .lineTo(headX, headY)
        .stroke({
          color: s % 2 === 0 ? PALETTE.GOLD_STAR : PALETTE.SKY_BLUE,
          width: 6.5,
          alpha: 0.65 * (1 - fallPhase * 0.2),
          cap: 'round',
        });
      g.moveTo(tailX, tailY)
        .lineTo(headX, headY)
        .stroke({
          color: PALETTE.CREAM_WHITE,
          width: 2.6,
          alpha: 0.95,
          cap: 'round',
        });

      // Falling 4-point star head
      drawFourPointStar(
        headX,
        headY,
        10.5,
        3.6,
        fallPhase * 4.5 + s,
        PALETTE.BUTTER_YELLOW,
        0.98
      );
    }

    // 2. Ground Starburst Impact when each shooting star strikes
    if (impactPhase > 0) {
      const impFade = 1 - impactPhase;
      const burstR = (s === 0 ? maxR * 0.68 : maxR * 0.42) * (0.35 + 0.65 * impactPhase);

      // Starburst cross rays at impact site
      for (let ray = 0; ray < 4; ray++) {
        const ra = (ray * Math.PI) / 4 + s * 0.4;
        g.moveTo(landX - Math.cos(ra) * burstR, landY - Math.sin(ra) * burstR)
          .lineTo(landX + Math.cos(ra) * burstR, landY + Math.sin(ra) * burstR)
          .stroke({
            color: ray % 2 === 0 ? PALETTE.GOLD_STAR : PALETTE.CREAM_WHITE,
            width: (s === 0 ? 3.2 : 2.2) * impFade,
            alpha: 0.9 * impFade,
            cap: 'round',
          });
      }

      drawFourPointStar(
        landX,
        landY,
        (s === 0 ? 13 : 9) * impFade,
        (s === 0 ? 4.2 : 3.0) * impFade,
        impactPhase * 2.2 + s,
        s % 2 === 0 ? PALETTE.GOLD_STAR : PALETTE.BUTTER_YELLOW,
        0.92 * impFade
      );
    }
  }
}
