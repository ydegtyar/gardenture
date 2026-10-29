import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { clamp } from '../../../core/math/vec2';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Lucky Clover footstep decals with intensity scaling from Lv 1 to Lv 5.
 */
export function drawLuckyCloverStepEffect(
  decalGraphic: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number,
  fade: number
): void {
  const lv = clamp(Math.round(fx.arcRad), 1, 5);
  const cx = fx.x * PPU;
  const cy = fx.y * PPU;

  const popScale = progress < 0.16 ? progress / 0.16 : 1 - (progress - 0.16) * 0.22;
  const baseR = fx.radius * PPU * popScale;
  const baseAlpha = clamp((0.42 + lv * 0.09) * fade, 0.08, 0.92);

  const drawSingleClover = (
    ox: number,
    oy: number,
    cloverR: number,
    rotAngle: number,
    leaves: number,
    withVeins: boolean
  ) => {
    // Curved botanical stem first so leaves sit cleanly on top
    const stemAngle = rotAngle + Math.PI * 0.72;
    const stemLen = cloverR * 1.15;
    decalGraphic
      .moveTo(ox, oy)
      .quadraticCurveTo(
        ox + Math.cos(stemAngle - 0.3) * (stemLen * 0.55),
        oy + Math.sin(stemAngle - 0.3) * (stemLen * 0.55),
        ox + Math.cos(stemAngle) * stemLen,
        oy + Math.sin(stemAngle) * stemLen
      )
      .stroke({
        color: 0x047857,
        width: Math.max(1.2, cloverR * 0.22),
        alpha: baseAlpha,
        cap: 'round',
      });

    // Heart-cleft clover leaflets (formed by two angled lobes per leaflet)
    const leafDist = cloverR * 0.56;
    const lobeR = cloverR * 0.34;
    for (let i = 0; i < leaves; i++) {
      const a = rotAngle + (i / leaves) * Math.PI * 2;
      const lx = ox + Math.cos(a) * leafDist;
      const ly = oy + Math.sin(a) * leafDist;
      const perpX = -Math.sin(a);
      const perpY = Math.cos(a);
      const lobeSpread = cloverR * 0.16;
      const leafCol = i % 2 === 0 ? PALETTE.MINT_GREEN : 0x10b981;

      for (const side of [-1, 1] as const) {
        decalGraphic
          .circle(lx + perpX * lobeSpread * side, ly + perpY * lobeSpread * side, lobeR)
          .fill({ color: leafCol, alpha: baseAlpha })
          .stroke({
            color: PALETTE.INK_OUTLINE,
            width: 1.1,
            alpha: baseAlpha * 0.82,
          });
      }

      if (withVeins) {
        decalGraphic
          .moveTo(ox + Math.cos(a) * (cloverR * 0.12), oy + Math.sin(a) * (cloverR * 0.12))
          .lineTo(lx + Math.cos(a) * (cloverR * 0.14), ly + Math.sin(a) * (cloverR * 0.14))
          .stroke({
            color: 0xd1fae5,
            width: 1.0,
            alpha: baseAlpha * 0.9,
            cap: 'round',
          });
      }
    }
  };

  // Primary compact clover
  drawSingleClover(cx, cy, baseR, fx.angle, lv >= 2 ? 4 : 3, lv >= 2);

  // Lv 3+: Companion miniature clover sprouts beside the main step
  if (lv >= 3) {
    const subAngle1 = fx.angle + 2.15;
    const subDist1 = baseR * 1.38;
    drawSingleClover(
      cx + Math.cos(subAngle1) * subDist1,
      cy + Math.sin(subAngle1) * subDist1,
      baseR * 0.62,
      fx.angle - 0.6,
      3,
      lv >= 4
    );
  }
  if (lv >= 4) {
    const subAngle2 = fx.angle - 1.95;
    const subDist2 = baseR * 1.28;
    drawSingleClover(
      cx + Math.cos(subAngle2) * subDist2,
      cy + Math.sin(subAngle2) * subDist2,
      baseR * 0.54,
      fx.angle + 0.85,
      4,
      true
    );
  }

  // Lv 3+: Tiny rising emerald-mint luck sparkles & star glints that drift upward and vanish
  if (lv >= 3) {
    const sparkleCount = lv - 1;
    for (let s = 0; s < sparkleCount; s++) {
      const sa = fx.id * 1.37 + (s * Math.PI * 2) / sparkleCount;
      const sx = cx + Math.cos(sa) * (baseR * (0.65 + (s % 2) * 0.45));
      const sy = cy + Math.sin(sa) * (baseR * 0.4) - progress * (10 + s * 4.5);
      const spSize = (2.2 + (lv >= 5 ? 1.1 : 0.4)) * fade;

      // Crisp 4-point mint-emerald star glint
      decalGraphic
        .moveTo(sx - spSize, sy)
        .lineTo(sx + spSize, sy)
        .moveTo(sx, sy - spSize)
        .lineTo(sx, sy + spSize)
        .stroke({
          color: s % 2 === 0 ? 0xa7f3d0 : PALETTE.MINT_GREEN,
          width: 1.4,
          alpha: baseAlpha * 0.95,
          cap: 'round',
        });
    }
  }
}
