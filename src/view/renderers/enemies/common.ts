import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { clamp, lerp } from '../../../core/math/vec2';
import type { SimEnemy } from '../../../sim/Simulation';

/**
 * Animated enemy legs beneath Bestiary sprite.
 */
export function drawEnemyLegs(
  g: PIXI.Graphics,
  ex: number,
  ey: number,
  rPx: number,
  isMoving: boolean,
  walkPhase: number,
  facingAngle: number,
  footColor: number
): void {
  const strideX = Math.cos(facingAngle);
  const strideY = Math.sin(facingAngle);
  const leftSwing = isMoving ? Math.sin(walkPhase) : 0;
  const rightSwing = isMoving ? Math.sin(walkPhase + Math.PI) : 0;

  const hipOffset = rPx * 0.42;
  const legLen = Math.max(5, rPx * 0.45);
  const strideAmp = Math.max(4, rPx * 0.35);

  const lFootX = ex - hipOffset + leftSwing * strideX * strideAmp;
  const lFootY =
    ey +
    rPx * 0.45 +
    legLen * 0.5 +
    leftSwing * strideY * (strideAmp * 0.5) -
    Math.max(0, leftSwing) * 3.5;

  const rFootX = ex + hipOffset + rightSwing * strideX * strideAmp;
  const rFootY =
    ey +
    rPx * 0.45 +
    legLen * 0.5 +
    rightSwing * strideY * (strideAmp * 0.5) -
    Math.max(0, rightSwing) * 3.5;

  const footR = Math.max(3.0, rPx * 0.22);

  g.moveTo(ex - hipOffset * 0.7, ey + rPx * 0.3)
    .lineTo(lFootX, lFootY)
    .stroke({ color: PALETTE.INK_OUTLINE, width: Math.max(4, footR * 1.5), cap: 'round' });
  g.circle(lFootX, lFootY, footR)
    .fill({ color: footColor })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

  g.moveTo(ex + hipOffset * 0.7, ey + rPx * 0.3)
    .lineTo(rFootX, rFootY)
    .stroke({ color: PALETTE.INK_OUTLINE, width: Math.max(4, footR * 1.5), cap: 'round' });
  g.circle(rFootX, rFootY, footR)
    .fill({ color: footColor })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
}

/**
 * Floating Crown / Rhombus & Radiant Lines above Special, Elite, Mini-Boss, and Final Boss enemies.
 */
export function drawSpecialOrEliteCrestAbove(
  g: PIXI.Graphics,
  e: SimEnemy,
  ex: number,
  cy: number,
  rPx: number,
  elapsedSeconds: number
): void {
  const bob = Math.sin(elapsedSeconds * 5.2 + e.id * 0.9) * 2.4;
  const crestY = cy - rPx * 1.18 - 10 + bob;
  const isBossTier = e.isFinalBoss || e.isMiniBoss;
  const primaryCol = isBossTier
    ? PALETTE.CRIMSON_WARN
    : e.isSpecial
      ? PALETTE.GOLD_STAR
      : PALETTE.BUTTER_YELLOW;
  const secondaryCol = isBossTier ? PALETTE.GOLD_STAR : PALETTE.CREAM_WHITE;

  // 1. Radiant vertical & angled accent lines above the crest
  const lineRays: ReadonlyArray<readonly [number, number, number, number]> = [
    [-12, -3, -17, -9],
    [-6, -6, -8, -13],
    [0, -8, 0, -16],
    [6, -6, 8, -13],
    [12, -3, 17, -9],
  ];
  for (let i = 0; i < lineRays.length; i++) {
    const [x1, y1, x2, y2] = lineRays[i]!;
    const pulse = 0.75 + 0.25 * Math.sin(elapsedSeconds * 8 + i + e.id);
    g.moveTo(ex + x1, crestY + y1)
      .lineTo(ex + x2, crestY + y2)
      .stroke({
        color: i % 2 === 0 ? primaryCol : secondaryCol,
        width: 2.2,
        alpha: 0.92 * pulse,
        cap: 'round',
      });
  }

  if (e.isSpecial || isBossTier) {
    // 3-spired sovereign crown + center floating rhombus jewel for Special & Boss enemies
    g.moveTo(ex - 11, crestY + 3)
      .lineTo(ex - 9, crestY - 5)
      .lineTo(ex - 4, crestY - 1)
      .lineTo(ex, crestY - 8)
      .lineTo(ex + 4, crestY - 1)
      .lineTo(ex + 9, crestY - 5)
      .lineTo(ex + 11, crestY + 3)
      .closePath()
      .fill({ color: primaryCol, alpha: 0.96 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0, join: 'round' });

    // Floating center rhombus gem inside/above the crown
    g.moveTo(ex, crestY - 4.5)
      .lineTo(ex + 3.2, crestY - 0.5)
      .lineTo(ex, crestY + 3.0)
      .lineTo(ex - 3.2, crestY - 0.5)
      .closePath()
      .fill({ color: secondaryCol })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.3 });
  } else {
    // Floating twin-horn rhombus crest for Elites
    g.moveTo(ex, crestY - 6.5)
      .lineTo(ex + 5.5, crestY)
      .lineTo(ex, crestY + 5.5)
      .lineTo(ex - 5.5, crestY)
      .closePath()
      .fill({ color: primaryCol, alpha: 0.96 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0 });

    g.moveTo(ex, crestY - 3.0)
      .lineTo(ex + 2.4, crestY)
      .lineTo(ex + 2.4, crestY)
      .lineTo(ex - 2.4, crestY)
      .closePath()
      .fill({ color: secondaryCol });
  }
}

/**
 * Crystalline snowflake & frost-needle overlay for enemies slowed by Frost Touch.
 */
export function drawFrostTouchFilter(
  g: PIXI.Graphics,
  ex: number,
  cy: number,
  rPx: number,
  elapsedSeconds: number,
  enemyId: number
): void {
  const flakeCount = 3;
  for (let f = 0; f < flakeCount; f++) {
    const orbitA =
      elapsedSeconds * (1.35 + f * 0.25) +
      enemyId * 1.47 +
      (f * Math.PI * 2) / flakeCount;
    const dist = rPx * (0.48 + (f % 2) * 0.28);
    const fx = ex + Math.cos(orbitA) * dist;
    const fy =
      cy - rPx * 0.15 + Math.sin(orbitA * 1.3) * (rPx * 0.42);
    const flakeSize = (6.2 + (f === 0 ? 2.0 : 0)) * (0.88 + 0.12 * Math.sin(elapsedSeconds * 6 + f));
    const spin = elapsedSeconds * (f % 2 === 0 ? 1.8 : -1.5) + f * 0.9;

    // Draw 6-pointed crystalline snowflake with dendrite side-branches
    for (let arm = 0; arm < 6; arm++) {
      const a = spin + (arm * Math.PI) / 3;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      const tipX = fx + cosA * flakeSize;
      const tipY = fy + sinA * flakeSize;

      g.moveTo(fx, fy)
        .lineTo(tipX, tipY)
        .stroke({
          color: arm % 2 === 0 ? PALETTE.CREAM_WHITE : 0xbae6fd,
          width: 1.9,
          alpha: 0.94,
          cap: 'round',
        });

      // Side crystal barbs on each arm
      const midX = fx + cosA * (flakeSize * 0.56);
      const midY = fy + sinA * (flakeSize * 0.56);
      const barbLen = flakeSize * 0.38;
      const b1 = a + Math.PI / 3;
      const b2 = a - Math.PI / 3;
      g.moveTo(midX + Math.cos(b1) * barbLen, midY + Math.sin(b1) * barbLen)
        .lineTo(midX, midY)
        .lineTo(midX + Math.cos(b2) * barbLen, midY + Math.sin(b2) * barbLen)
        .stroke({
          color: PALETTE.SKY_BLUE,
          width: 1.35,
          alpha: 0.88,
          cap: 'round',
          join: 'round',
        });
    }

    // Crisp diamond ice crystal core at the center of the snowflake
    g.moveTo(fx, fy - 2.2)
      .lineTo(fx + 2.2, fy)
      .lineTo(fx, fy + 2.2)
      .lineTo(fx - 2.2, fy)
      .closePath()
      .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.95 });
  }
}

/**
 * Spider-web glue debuff overlay for enemies touched by Petal Orbit / Petal Blossom.
 */
export function drawSpiderWebGlueDebuff(
  g: PIXI.Graphics,
  ex: number,
  cy: number,
  rPx: number,
  elapsedSeconds: number,
  enemyId: number
): void {
  const webR = rPx * 1.18;
  const pulse = 0.92 + 0.08 * Math.sin(elapsedSeconds * 6.0 + enemyId);
  const rot = Math.sin(elapsedSeconds * 1.5 + enemyId) * 0.12;

  g.ellipse(ex, cy + rPx * 0.55, webR * 0.95 * pulse, webR * 0.45 * pulse).fill({
    color: PALETTE.CREAM_WHITE,
    alpha: 0.26,
  });

  const spokes = 6;
  for (let i = 0; i < spokes; i++) {
    const a = rot + (i / spokes) * Math.PI * 2;
    const sx = ex + Math.cos(a) * webR * pulse;
    const sy = cy + Math.sin(a) * webR * pulse;
    g.moveTo(ex, cy)
      .lineTo(sx, sy)
      .stroke({ color: PALETTE.CREAM_WHITE, width: 1.6, alpha: 0.78 });
  }

  for (const ringFrac of [0.48, 0.82]) {
    const rr = webR * ringFrac * pulse;
    for (let i = 0; i < spokes; i++) {
      const a1 = rot + (i / spokes) * Math.PI * 2;
      const a2 = rot + ((i + 1) / spokes) * Math.PI * 2;
      g.moveTo(ex + Math.cos(a1) * rr, cy + Math.sin(a1) * rr)
        .lineTo(ex + Math.cos(a2) * rr, cy + Math.sin(a2) * rr)
        .stroke({ color: PALETTE.CREAM_WHITE, width: 1.4, alpha: 0.72 });
    }
  }

  for (let d = 0; d < 3; d++) {
    const da = rot + (d * Math.PI * 2) / 3 + 0.4;
    const dx = ex + Math.cos(da) * (webR * 0.75);
    const dy = cy + Math.sin(da) * (webR * 0.75);
    g.circle(dx, dy, 2.4)
      .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.92 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.1 });
  }
}

/**
 * Animated Poison Teardrop Icon:
 * Synchronized with the 0.5s poison tick cycle.
 */
export function drawPoisonDropIcon(
  g: PIXI.Graphics,
  x: number,
  baseY: number,
  enemyCenterY: number,
  rPx: number,
  elapsedSeconds: number,
  enemyId: number
): void {
  // 2 ticks per second (every 30 frames at 60Hz)
  const cycle = (elapsedSeconds * 2.0 + (enemyId % 5) * 0.03) % 1.0;

  let dropScale = 1.0;
  let currentY = baseY;

  if (cycle < 0.68) {
    // Growing a new poison drop above the enemy
    const growT = cycle / 0.68;
    dropScale = 0.25 + 0.85 * Math.sin(growT * (Math.PI * 0.5));
    currentY = baseY - (1 - growT) * 3;
  } else {
    // Dropping the poison icon down into the enemy body on the poison tick!
    const fallT = (cycle - 0.68) / 0.32;
    const easeIn = fallT * fallT;
    currentY = lerp(baseY, enemyCenterY - rPx * 0.15, easeIn);
    dropScale = 1.1 - fallT * 0.35;

    // Splash droplets when hitting the enemy body at the end of the drop
    if (fallT > 0.65) {
      const splashT = (fallT - 0.65) / 0.35;
      for (const side of [-1, 1] as const) {
        g.circle(
          x + side * (4 + splashT * 9),
          enemyCenterY - rPx * 0.2 - Math.sin(splashT * Math.PI) * 6,
          2.2 * (1 - splashT * 0.4)
        ).fill({ color: PALETTE.MINT_GREEN, alpha: (1 - splashT) * 0.95 });
      }
    }
  }

  const r = 4.6 * dropScale;
  g.moveTo(x, currentY - r * 1.45)
    .lineTo(x + r * 0.92, currentY + r * 0.15)
    .arc(x, currentY + r * 0.25, r * 0.92, 0, Math.PI, false)
    .lineTo(x - r * 0.92, currentY + r * 0.15)
    .closePath()
    .fill({ color: 0x22c55e })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

  g.circle(x, currentY + r * 0.2, r * 0.52).fill({
    color: PALETTE.MINT_GREEN,
    alpha: 0.95,
  });
  g.circle(x - r * 0.28, currentY - r * 0.05, r * 0.22).fill({
    color: PALETTE.CREAM_WHITE,
    alpha: 0.9,
  });
}
