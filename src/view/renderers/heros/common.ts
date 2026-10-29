import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { clamp } from '../../../core/math/vec2';

/**
 * Common articulated legs rendering for heroes and personas.
 */
export function drawCharacterLegs(
  g: PIXI.Graphics,
  hx: number,
  hy: number,
  isMoving: boolean,
  walkPhase: number,
  facingAngle: number,
  bootColor: number,
  legColor: number,
  isLevitating = false
): void {
  const strideX = Math.cos(facingAngle);
  const strideY = Math.sin(facingAngle);

  if (isLevitating) {
    // Levitating Thunder-God flight stance: poised boots hovering in mid-air without walking swing
    const hoverFloat = Math.sin(walkPhase * 0.3) * 1.8 - 4.5;
    const leftHipX = hx - 4.5;
    const leftHipY = hy + hoverFloat;
    const rightHipX = hx + 4.5;
    const rightHipY = hy + hoverFloat;

    const leftFootX = leftHipX - strideX * 1.5;
    const leftFootY = leftHipY + 5.5;
    const rightFootX = rightHipX + strideX * 1.5;
    const rightFootY = rightHipY + 7.5;

    g.moveTo(leftHipX, leftHipY)
      .lineTo(leftFootX, leftFootY)
      .stroke({ color: PALETTE.INK_OUTLINE, width: 6.2, cap: 'round' });
    g.moveTo(leftHipX, leftHipY)
      .lineTo(leftFootX, leftFootY)
      .stroke({ color: legColor, width: 3.4, cap: 'round' });
    g.ellipse(leftFootX, leftFootY, 4.2, 2.8)
      .fill({ color: bootColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

    g.moveTo(rightHipX, rightHipY)
      .lineTo(rightFootX, rightFootY)
      .stroke({ color: PALETTE.INK_OUTLINE, width: 6.2, cap: 'round' });
    g.moveTo(rightHipX, rightHipY)
      .lineTo(rightFootX, rightFootY)
      .stroke({ color: legColor, width: 3.4, cap: 'round' });
    g.ellipse(rightFootX, rightFootY, 4.2, 2.8)
      .fill({ color: bootColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
    return;
  }

  const leftSwing = isMoving ? Math.sin(walkPhase) : 0;
  const rightSwing = isMoving ? Math.sin(walkPhase + Math.PI) : 0;

  const leftHipX = hx - 5;
  const leftHipY = hy + 4;
  const rightHipX = hx + 5;
  const rightHipY = hy + 4;

  const leftFootX = leftHipX + leftSwing * strideX * 7;
  const leftFootY =
    leftHipY + 8 + leftSwing * strideY * 3.5 - Math.max(0, leftSwing) * 4.5;

  const rightFootX = rightHipX + rightSwing * strideX * 7;
  const rightFootY =
    rightHipY + 8 + rightSwing * strideY * 3.5 - Math.max(0, rightSwing) * 4.5;

  g.moveTo(leftHipX, leftHipY)
    .lineTo(leftFootX, leftFootY)
    .stroke({ color: PALETTE.INK_OUTLINE, width: 6.5, cap: 'round' });
  g.moveTo(leftHipX, leftHipY)
    .lineTo(leftFootX, leftFootY)
    .stroke({ color: legColor, width: 3.5, cap: 'round' });
  g.ellipse(leftFootX + strideX * 1.8, leftFootY, 4.5, 3.0)
    .fill({ color: bootColor })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

  g.moveTo(rightHipX, rightHipY)
    .lineTo(rightFootX, rightFootY)
    .stroke({ color: PALETTE.INK_OUTLINE, width: 6.5, cap: 'round' });
  g.moveTo(rightHipX, rightHipY)
    .lineTo(rightFootX, rightFootY)
    .stroke({ color: legColor, width: 3.5, cap: 'round' });
  g.ellipse(rightFootX + strideX * 1.8, rightFootY, 4.5, 3.0)
    .fill({ color: bootColor })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
}

/**
 * Renders grand white feathered Angel Wings & golden halo when the hero wins the run.
 */
export function drawHeroAngelWings(
  g: PIXI.Graphics,
  hx: number,
  cy: number,
  elapsedSeconds: number,
  winProgress: number
): void {
  const wingScale = clamp(winProgress * 2.4, 0.35, 1.0);
  const flapAngle = Math.sin(elapsedSeconds * 13) * 0.34;

  // Radiant golden halo above hero's head
  g.ellipse(hx, cy - 29, 12 * wingScale, 4.5 * wingScale).stroke({
    color: PALETTE.GOLD_STAR,
    width: 3,
    alpha: 0.95,
  });

  for (const side of [-1, 1] as const) {
    const m = new PIXI.Matrix();
    m.scale(side * wingScale, wingScale);
    m.rotate(side * (-0.22 + flapAngle));
    m.translate(hx + side * 8, cy - 6);

    g.setTransform(m);

    // Outer primary wing pinion
    g.moveTo(0, 0)
      .bezierCurveTo(14, -22, 34, -26, 44, -12)
      .bezierCurveTo(38, -2, 26, 6, 4, 8)
      .closePath()
      .fill({ color: 0xffffff, alpha: 0.98 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });

    // Layered secondary feathers
    for (let f = 0; f < 4; f++) {
      const fx = 10 + f * 7.5;
      const fy = -8 - f * 2.2;
      g.ellipse(fx, fy, 9 - f * 1.1, 4.2)
        .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.96 })
        .stroke({ color: 0x93c5fd, width: 1.2, alpha: 0.7 });
    }
  }
  g.setTransform(new PIXI.Matrix());
}

/**
 * Active Aegis Orb aura: rotating hexagonal botanical rune ward underfoot +
 * 3 orbiting crystalline shield crests with shimmering cyan-mint energy ribbons.
 */
export function drawAegisShieldAura(
  gUnder: PIXI.Graphics,
  gOver: PIXI.Graphics,
  hx: number,
  hy: number,
  elapsedSeconds: number,
  shieldHp: number
): void {
  const rot = elapsedSeconds * 1.8;
  const wardR = 27 + Math.sin(elapsedSeconds * 6) * 1.5;

  // Rotating 6-sided crystalline ward polygon underfoot
  for (let i = 0; i < 6; i++) {
    const a = rot + (i * Math.PI) / 3;
    const vx = hx + Math.cos(a) * wardR;
    const vy = hy + Math.sin(a) * (wardR * 0.72);
    if (i === 0) gUnder.moveTo(vx, vy);
    else gUnder.lineTo(vx, vy);
  }
  gUnder
    .closePath()
    .fill({ color: PALETTE.SKY_BLUE, alpha: 0.14 })
    .stroke({ color: PALETTE.SKY_BLUE, width: 2.2, alpha: 0.78 });

  // Inner counter-rotating star-hex rune lines
  for (let i = 0; i < 6; i++) {
    const a = -rot * 1.2 + (i * Math.PI) / 3;
    const vx = hx + Math.cos(a) * (wardR * 0.62);
    const vy = hy + Math.sin(a) * (wardR * 0.45);
    if (i === 0) gUnder.moveTo(vx, vy);
    else gUnder.lineTo(vx, vy);
  }
  gUnder.closePath().stroke({
    color: PALETTE.MINT_GREEN,
    width: 1.5,
    alpha: 0.68,
  });

  // 3 orbiting miniature Aegis shield crests around the hero
  const crestCount = 3;
  for (let c = 0; c < crestCount; c++) {
    const ca = elapsedSeconds * 3.2 + (c * Math.PI * 2) / crestCount;
    const cx = hx + Math.cos(ca) * 25;
    const cy = hy - 4 + Math.sin(ca) * 17;
    const targetG = Math.sin(ca) >= 0 ? gOver : gUnder;

    // Trailing energy ribbon
    const tailA = ca - 0.35;
    const tx = hx + Math.cos(tailA) * 25;
    const ty = hy - 4 + Math.sin(tailA) * 17;
    targetG
      .moveTo(tx, ty)
      .lineTo(cx, cy)
      .stroke({ color: PALETTE.SKY_BLUE, width: 2.6, alpha: 0.65, cap: 'round' });

    // Kite-shaped Aegis crest
    targetG
      .moveTo(cx, cy - 5.5)
      .lineTo(cx + 4.5, cy - 2)
      .lineTo(cx + 3.2, cy + 3.5)
      .lineTo(cx, cy + 6.0)
      .lineTo(cx - 3.2, cy + 3.5)
      .lineTo(cx - 4.5, cy - 2)
      .closePath()
      .fill({ color: shieldHp > 20 ? PALETTE.SKY_BLUE : PALETTE.MINT_GREEN, alpha: 0.95 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

    targetG
      .moveTo(cx, cy - 3.5)
      .lineTo(cx + 2.2, cy)
      .lineTo(cx, cy + 3.5)
      .lineTo(cx - 2.2, cy)
      .closePath()
      .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.9 });
  }
}
