import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders an AAA-grade Botanical Seismic Shockwave Blast visual effect
 * ("Every 5th hit unleashes a 3.0 u seismic ring for 50% damage"):
 * - Supersonic multi-layered golden & emerald-mint seismic compression rings
 * - Segmented acoustic shockfront arcs
 * - Branching jagged tectonic ground fissures radiating from the impact crater
 * - Epicenter golden starburst flash + ejected earth clods & leaf shards
 */
export function drawShockwaveBlastEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number,
  fade: number
): void {
  const cx = fx.x * PPU;
  const cy = fx.y * PPU;
  const maxR = fx.radius * PPU;

  // Fast explosive ease-out for the supersonic shockfront
  const easeOut = 1 - Math.pow(1 - progress, 2.8);
  const outerR = maxR * (0.16 + 0.84 * easeOut);
  const midR = maxR * Math.max(0.1, easeOut * 0.74);
  const innerR = maxR * Math.max(0.05, easeOut * 0.44);

  const primaryGold = fx.color || 0xfdffb6;
  const warmAmber = 0xf59e0b;
  const dewyMint = 0x6ee7b7;

  // 1. Sub-surface seismic pressure dome & outer refractive amber halo
  g.circle(cx, cy, outerR).fill({ color: primaryGold, alpha: 0.11 * fade });
  g.circle(cx, cy, midR).fill({ color: dewyMint, alpha: 0.08 * fade });
  g.circle(cx, cy, outerR).stroke({
    color: warmAmber,
    width: Math.max(4, 16 * fade),
    alpha: 0.28 * fade,
  });

  // 2. Branching jagged tectonic ground fissures radiating from epicenter
  const fissureCount = 10;
  const fissureReach = outerR * 0.92;
  for (let i = 0; i < fissureCount; i++) {
    const seed = fx.id * 1.37 + i * 2.19;
    const baseAngle = fx.angle + (i / fissureCount) * Math.PI * 2 + Math.sin(seed) * 0.08;
    const r1 = fissureReach * 0.28;
    const r2 = fissureReach * 0.62;
    const r3 = fissureReach * (0.86 + 0.12 * Math.cos(seed * 1.7));

    const jitter1 = (i % 2 === 0 ? 1 : -1) * 0.11;
    const jitter2 = (i % 2 === 0 ? -1 : 1) * 0.09;

    const x0 = cx + Math.cos(baseAngle) * ( maxR * 0.06 );
    const y0 = cy + Math.sin(baseAngle) * ( maxR * 0.06 );
    const x1 = cx + Math.cos(baseAngle + jitter1) * r1;
    const y1 = cy + Math.sin(baseAngle + jitter1) * r1;
    const x2 = cx + Math.cos(baseAngle + jitter2) * r2;
    const y2 = cy + Math.sin(baseAngle + jitter2) * r2;
    const x3 = cx + Math.cos(baseAngle) * r3;
    const y3 = cy + Math.sin(baseAngle) * r3;

    // Dark earth crevice shadow
    g.moveTo(x0, y0)
      .lineTo(x1, y1)
      .lineTo(x2, y2)
      .lineTo(x3, y3)
      .stroke({
        color: PALETTE.INK_OUTLINE,
        width: 3.6 * fade,
        alpha: 0.55 * fade,
        cap: 'round',
        join: 'round',
      });

    // Luminous golden-amber magma/leyline crack
    g.moveTo(x0, y0)
      .lineTo(x1, y1)
      .lineTo(x2, y2)
      .lineTo(x3, y3)
      .stroke({
        color: i % 2 === 0 ? primaryGold : dewyMint,
        width: 1.8 * fade,
        alpha: 0.88 * fade,
        cap: 'round',
        join: 'round',
      });

    // Secondary tectonic fork on alternating fissures
    if (i % 2 === 0) {
      const forkAngle = baseAngle + jitter1 + 0.28;
      const fxEnd = x1 + Math.cos(forkAngle) * (fissureReach * 0.26);
      const fyEnd = y1 + Math.sin(forkAngle) * (fissureReach * 0.26);
      g.moveTo(x1, y1)
        .lineTo(fxEnd, fyEnd)
        .stroke({
          color: PALETTE.CREAM_WHITE,
          width: 1.3 * fade,
          alpha: 0.75 * fade,
          cap: 'round',
        });
    }
  }

  // 3. Concentric Harmonic Seismic Rings (Inner Gold -> Mid Dewy Mint -> Leading Supersonic Rim)
  // Inner reverberation ring
  g.circle(cx, cy, innerR).stroke({
    color: primaryGold,
    width: Math.max(1.5, 2.8 * fade),
    alpha: 0.72 * fade,
  });

  // Secondary dewy-mint botanical resonance ring
  g.circle(cx, cy, midR).stroke({
    color: dewyMint,
    width: Math.max(2, 4.2 * fade),
    alpha: 0.85 * fade,
  });

  // Leading supersonic shockfront: dark cel-outline + brilliant golden-white core
  g.circle(cx, cy, outerR).stroke({
    color: PALETTE.INK_OUTLINE,
    width: Math.max(3, 7.5 * fade),
    alpha: 0.42 * fade,
  });
  g.circle(cx, cy, outerR).stroke({
    color: primaryGold,
    width: Math.max(2.5, 5.2 * fade),
    alpha: 0.96 * fade,
  });
  g.circle(cx, cy, Math.max(2, outerR - 1.5)).stroke({
    color: PALETTE.CREAM_WHITE,
    width: Math.max(1.2, 2.4 * fade),
    alpha: 0.92 * fade,
  });

  // 4. Segmented Supersonic Arcs & Radial Shock Spikes around the perimeter
  const arcSegments = 8;
  const arcSpan = (Math.PI * 2) / arcSegments;
  for (let s = 0; s < arcSegments; s++) {
    const aStart = fx.angle + s * arcSpan + progress * 0.45;
    const aMid = aStart + arcSpan * 0.32;
    const aEnd = aStart + arcSpan * 0.64;

    g.arc(cx, cy, outerR * 1.04, aStart, aEnd).stroke({
      color: PALETTE.CREAM_WHITE,
      width: 2.2 * fade,
      alpha: 0.82 * fade,
      cap: 'round',
    });

    // Outward kinetic shock spike at segment midpoint
    const spIn = outerR * 0.88;
    const spOut = outerR * 1.11;
    g.moveTo(cx + Math.cos(aMid) * spIn, cy + Math.sin(aMid) * spIn)
      .lineTo(cx + Math.cos(aMid) * spOut, cy + Math.sin(aMid) * spOut)
      .stroke({
        color: PALETTE.CREAM_WHITE,
        width: 2.4 * fade,
        alpha: 0.88 * fade,
        cap: 'round',
      });
  }

  // 5. Ejected Earth Clods, Golden Pollen Sparks & Uprooted Leaf Shards
  const debrisCount = 12;
  for (let d = 0; d < debrisCount; d++) {
    const da = fx.angle + (d / debrisCount) * Math.PI * 2 + (d % 3) * 0.14;
    const distRatio = 0.58 + ((d * 7) % 5) * 0.11;
    const dr = outerR * distRatio;
    const liftY = -Math.sin(progress * Math.PI) * (8 + (d % 3) * 4);
    const dx = cx + Math.cos(da) * dr;
    const dy = cy + Math.sin(da) * dr + liftY;
    const sz = (2.2 + (d % 3) * 1.1) * fade;

    if (d % 2 === 0) {
      // Diamond golden-earth shard
      g.poly([
        dx, dy - sz,
        dx + sz * 0.85, dy,
        dx, dy + sz,
        dx - sz * 0.85, dy,
      ])
        .fill({ color: d % 4 === 0 ? primaryGold : warmAmber, alpha: 0.9 * fade })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1, alpha: 0.65 * fade });
    } else {
      // Uprooted emerald-mint leaf mote
      g.circle(dx, dy, sz * 0.78)
        .fill({ color: dewyMint, alpha: 0.9 * fade })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 0.9, alpha: 0.6 * fade });
    }
  }

  // 6. Epicenter Impact Starburst Flash (strongest during the first 65% of the blast)
  const epicenterFade = Math.max(0, 1 - progress * 1.45);
  if (epicenterFade > 0.02) {
    const starOuter = maxR * (0.26 + 0.12 * (1 - epicenterFade));
    const starInner = starOuter * 0.36;
    const points: number[] = [];
    const spikes = 8;
    for (let p = 0; p < spikes * 2; p++) {
      const r = p % 2 === 0 ? starOuter : starInner;
      const a = fx.angle + (p * Math.PI) / spikes;
      points.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    g.poly(points)
      .fill({ color: primaryGold, alpha: 0.85 * epicenterFade })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.6 * epicenterFade, alpha: 0.7 * epicenterFade });
    g.circle(cx, cy, starInner * 0.85).fill({
      color: PALETTE.CREAM_WHITE,
      alpha: 0.95 * epicenterFade,
    });
  }
}
