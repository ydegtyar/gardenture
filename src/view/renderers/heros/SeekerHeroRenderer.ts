import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { BaseHeroProfessionRenderer } from './BaseHeroProfessionRenderer';

/**
 * Pretty Seed Trap visual effect for Seeker hero dash:
 * A swirling botanical vortex pit with sunken shadowy abyss depth,
 * spiraling suction wind streams, fluttering mint/emerald leaves,
 * and whirling golden botanical seeds being drawn into the center eye.
 */
export function drawSeedTrapHazard(
  g: PIXI.Graphics,
  hx: number,
  hy: number,
  rPx: number,
  fade: number,
  id: number,
  elapsedSeconds: number,
  lifeTimer = 3.0
): void {
  // 1. Dynamic vortex animation parameters
  const spin = elapsedSeconds * 4.4 + (id * 1.618);
  const breath = 1.0 + Math.sin(elapsedSeconds * 5.2 + id) * 0.035;
  const spawnMult = lifeTimer > 2.75 ? Math.min(1, (3.0 - lifeTimer) / 0.25) : 1.0;
  const effectiveR = rPx * breath * spawnMult;

  // 2. Sunken Vortex Pit Abyss Depth (layered organic shadow & singularity eye)
  // Outer sunken pit depression
  g.ellipse(hx, hy, effectiveR * 0.96, effectiveR * 0.88).fill({
    color: 0x064e3b,
    alpha: 0.28 * fade,
  });

  // Mid sinkhole depth
  g.ellipse(hx, hy, effectiveR * 0.64, effectiveR * 0.58).fill({
    color: 0x022c22,
    alpha: 0.48 * fade,
  });

  // Core abyss singularity
  const coreR = effectiveR * 0.28;
  g.circle(hx, hy, coreR)
    .fill({ color: 0x01170e, alpha: 0.82 * fade })
    .stroke({ color: 0x064e3b, width: 2.2 * fade, alpha: 0.9 * fade });

  // Rotating inner dark whirlpool eye
  const eyeRot = spin * 1.6;
  const eyeOffX = hx + Math.cos(eyeRot) * (effectiveR * 0.05);
  const eyeOffY = hy + Math.sin(eyeRot) * (effectiveR * 0.05);
  g.ellipse(eyeOffX, eyeOffY, effectiveR * 0.14, effectiveR * 0.1).fill({
    color: PALETTE.INK_OUTLINE,
    alpha: 0.95 * fade,
  });

  // 3. Spiraling Suction Wind Currents (5 Archimedean spiral arms)
  const armCount = 5;
  for (let a = 0; a < armCount; a++) {
    const armStart = spin + (a * Math.PI * 2) / armCount;
    const steps = 7;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps; // 0 at outer perimeter, 1 at inner pit
      const curR = effectiveR * (0.92 - t * 0.7);
      const theta = armStart + t * 2.35;
      const px = hx + Math.cos(theta) * curR;
      const py = hy + Math.sin(theta) * (curR * 0.92);
      if (s === 0) {
        g.moveTo(px, py);
      } else {
        g.lineTo(px, py);
      }
    }
    g.stroke({
      color: a % 2 === 0 ? PALETTE.MINT_GREEN : 0x34d399,
      width: (2.2 - (a % 2) * 0.6) * fade,
      alpha: (0.72 - (a % 2) * 0.18) * fade,
      cap: 'round',
    });
  }

  // Fast inner suction tendrils spiraling into the abyss
  for (let w = 0; w < 3; w++) {
    const wAngle = spin * 2.1 + (w * Math.PI * 2) / 3;
    const rOuter = effectiveR * 0.46;
    const rInner = effectiveR * 0.12;
    const x0 = hx + Math.cos(wAngle) * rOuter;
    const y0 = hy + Math.sin(wAngle) * (rOuter * 0.9);
    const x1 = hx + Math.cos(wAngle + 1.8) * rInner;
    const y1 = hy + Math.sin(wAngle + 1.8) * (rInner * 0.9);
    const cx = hx + Math.cos(wAngle + 0.9) * (effectiveR * 0.32);
    const cy = hy + Math.sin(wAngle + 0.9) * (effectiveR * 0.28);
    g.moveTo(x0, y0)
      .quadraticCurveTo(cx, cy, x1, y1)
      .stroke({
        color: PALETTE.CREAM_WHITE,
        width: 1.5 * fade,
        alpha: 0.82 * fade,
        cap: 'round',
      });
  }

  // 4. Dynamic Whirling Whirlpool Arcs (replaces static simple circle outline)
  for (let b = 0; b < 3; b++) {
    const arcStart = spin * 1.1 + (b * Math.PI * 2) / 3;
    const arcSpan = 1.38;
    const arcEnd = arcStart + arcSpan;
    const bR = effectiveR * (0.93 + (b % 2) * 0.03);
    const startX = hx + Math.cos(arcStart) * bR;
    const startY = hy + Math.sin(arcStart) * (bR * 0.92);

    g.moveTo(startX, startY)
      .arc(hx, hy, bR, arcStart, arcEnd)
      .stroke({
        color: b === 0 ? PALETTE.MINT_GREEN : 0x10b981,
        width: 2.2 * fade,
        alpha: 0.65 * fade,
        cap: 'round',
      });
  }

  // 5. Whirling Botanical Seeds (7 golden teardrop seeds tumbling into the vortex)
  const seedCount = 7;
  for (let s = 0; s < seedCount; s++) {
    const distFrac = 0.28 + s * 0.092 + ((id * 3 + s) % 4) * 0.02;
    const speedMult = 1.0 + (1.0 - distFrac) * 2.3;
    const seedA = spin * speedMult + (s * Math.PI * 2) / seedCount + id * 0.45;
    const seedDist = effectiveR * distFrac;
    const sx = hx + Math.cos(seedA) * seedDist;
    const sy = hy + Math.sin(seedA) * (seedDist * 0.92);

    // Tangential direction tilted inwards toward center
    const tangentA = seedA + Math.PI / 2 + 0.28;
    const cA = Math.cos(tangentA);
    const sA = Math.sin(tangentA);
    const perpX = -sA;
    const perpY = cA;

    const seedLen = (7.5 + (s % 3) * 1.4) * fade;
    const seedWidth = (4.2 + (s % 3) * 0.8) * fade;

    const tipX = sx + cA * (seedLen * 0.58);
    const tipY = sy + sA * (seedLen * 0.58);
    const baseX = sx - cA * (seedLen * 0.42);
    const baseY = sy - sA * (seedLen * 0.42);
    const sh1X = sx - cA * (seedLen * 0.08) + perpX * (seedWidth * 0.5);
    const sh1Y = sy - sA * (seedLen * 0.08) + perpY * (seedWidth * 0.5);
    const sh2X = sx - cA * (seedLen * 0.08) - perpX * (seedWidth * 0.5);
    const sh2Y = sy - sA * (seedLen * 0.08) - perpY * (seedWidth * 0.5);

    g.moveTo(tipX, tipY)
      .quadraticCurveTo(sh1X + cA * (seedLen * 0.12), sh1Y + sA * (seedLen * 0.12), sh1X, sh1Y)
      .quadraticCurveTo(baseX + perpX * (seedWidth * 0.28), baseY + perpY * (seedWidth * 0.28), baseX, baseY)
      .quadraticCurveTo(baseX - perpX * (seedWidth * 0.28), baseY - perpY * (seedWidth * 0.28), sh2X, sh2Y)
      .quadraticCurveTo(sh2X + cA * (seedLen * 0.12), sh2Y + sA * (seedLen * 0.12), tipX, tipY)
      .closePath()
      .fill({ color: s % 2 === 0 ? PALETTE.GOLD_STAR : 0xf59e0b, alpha: 0.94 * fade })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.2, alpha: 0.85 * fade });

    // Seed center husk gleam
    g.moveTo(baseX + cA * (seedLen * 0.15), baseY + sA * (seedLen * 0.15))
      .lineTo(tipX - cA * (seedLen * 0.18), tipY - sA * (seedLen * 0.18))
      .stroke({ color: PALETTE.BUTTER_YELLOW, width: 1.1, alpha: 0.9 * fade, cap: 'round' });
  }

  // 6. Swirling Botanical Leaves (6 organic mint & emerald leaves caught in the vortex)
  const leafCount = 6;
  for (let l = 0; l < leafCount; l++) {
    const leafDistFrac = 0.36 + l * 0.095 + ((id + l) % 3) * 0.025;
    const leafSpeedMult = 0.85 + (1.0 - leafDistFrac) * 1.9;
    const leafA = spin * leafSpeedMult + (l * Math.PI * 2) / leafCount + 0.75;
    const lx = hx + Math.cos(leafA) * (effectiveR * leafDistFrac);
    const ly = hy + Math.sin(leafA) * (effectiveR * leafDistFrac * 0.92);

    const flutter = Math.sin(elapsedSeconds * 6.5 + l * 2.2) * 0.38;
    const leafAng = leafA + Math.PI / 2 + 0.32 + flutter;
    const lCos = Math.cos(leafAng);
    const lSin = Math.sin(leafAng);
    const lPerpX = -lSin;
    const lPerpY = lCos;

    const leafL = (10.5 + (l % 2) * 2.5) * fade;
    const leafW = (5.6 + (l % 2) * 1.2) * fade;

    const lTipX = lx + lCos * (leafL * 0.55);
    const lTipY = ly + lSin * (leafL * 0.55);
    const lBaseX = lx - lCos * (leafL * 0.45);
    const lBaseY = ly - lSin * (leafL * 0.45);
    const side1X = lx + lPerpX * (leafW * 0.5);
    const side1Y = ly + lPerpY * (leafW * 0.5);
    const side2X = lx - lPerpX * (leafW * 0.5);
    const side2Y = ly - lPerpY * (leafW * 0.5);

    const leafColor = l % 3 === 0 ? PALETTE.MINT_GREEN : l % 3 === 1 ? 0x10b981 : 0x84cc16;

    g.moveTo(lBaseX, lBaseY)
      .quadraticCurveTo(side1X, side1Y, lTipX, lTipY)
      .quadraticCurveTo(side2X, side2Y, lBaseX, lBaseY)
      .closePath()
      .fill({ color: leafColor, alpha: 0.92 * fade })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.2, alpha: 0.8 * fade });

    // Center leaf vein
    g.moveTo(lBaseX, lBaseY)
      .lineTo(lTipX - lCos * (leafL * 0.16), lTipY - lSin * (leafL * 0.16))
      .stroke({
        color: l % 3 === 0 ? 0x064e3b : PALETTE.CREAM_WHITE,
        width: 1.0,
        alpha: 0.65 * fade,
        cap: 'round',
      });
  }

  // 7. Micro-spore suction sparks pulling toward the core
  for (let p = 0; p < 6; p++) {
    const pFrac = (0.18 + (p * 0.12 + (elapsedSeconds * 0.45 + p * 0.22) % 0.72)) % 0.85;
    const pSpeed = 1.4 + (1.0 - pFrac) * 3.0;
    const pAngle = spin * pSpeed + (p * Math.PI) / 3;
    const px = hx + Math.cos(pAngle) * (effectiveR * pFrac);
    const py = hy + Math.sin(pAngle) * (effectiveR * pFrac * 0.92);
    const pRadius = (1.2 + (p % 2) * 0.8) * fade;

    g.circle(px, py, pRadius).fill({
      color: p % 2 === 0 ? PALETTE.BUTTER_YELLOW : PALETTE.MINT_GREEN,
      alpha: (0.7 + (p % 2) * 0.25) * fade,
    });
  }
}

export class SeekerHeroRenderer extends BaseHeroProfessionRenderer {
  public readonly professionId = 'seeker';
  public static drawSeedTrapHazard = drawSeedTrapHazard;
}

