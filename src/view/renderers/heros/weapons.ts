import * as PIXI from 'pixi.js';
import { PALETTE, WEAPONS } from '../../../content/data/catalog';
import { clamp, lerp } from '../../../core/math/vec2';
import {
  drawAttachedGardenBlade,
  attachGardenBladeToHero,
  getHeroWeaponSocket,
  getGardenBladeTipPosition,
  HERO_WEAPON_SOCKETS,
} from './GardenBladeAttachment';
import type { HeroWeaponSocket, SwordWeaponState, GardenBladeAttachmentContext } from './GardenBladeAttachment';

export {
  drawAttachedGardenBlade,
  attachGardenBladeToHero,
  getHeroWeaponSocket,
  getGardenBladeTipPosition,
  HERO_WEAPON_SOCKETS,
};
export type { HeroWeaponSocket, SwordWeaponState, GardenBladeAttachmentContext };

/**
 * Draws an articulated hero arm (shoulder -> elbow -> gloved hand) properly attached
 * to the hero's shoulder, gripping the Garden Blade / Verdant Edge.
 * Reusable across hero renderers via HeroWeaponSocket.
 */
export function drawHeroSword(
  g: PIXI.Graphics,
  hx: number,
  cy: number,
  facingAngle: number,
  swordWpn: {
    level: number;
    evolved: boolean;
    phase: string;
    phaseTimer: number;
    swingCounter: number;
  },
  elapsedSeconds: number,
  sleeveColor: number,
  cuffColor: number,
  customSocket?: Partial<HeroWeaponSocket>,
  flipX = 1
): void {
  const socket: HeroWeaponSocket = {
    handRestX: customSocket?.handRestX ?? customSocket?.socketX ?? 12.0,
    handRestY: customSocket?.handRestY ?? customSocket?.socketY ?? 5.5,
    socketX: customSocket?.socketX ?? customSocket?.handRestX ?? 12.0,
    socketY: customSocket?.socketY ?? customSocket?.handRestY ?? 5.5,
    shoulderX: customSocket?.shoulderX ?? 8.5,
    shoulderY: customSocket?.shoulderY ?? 1.0,
    sleeveColor,
    cuffColor,
    handColor: customSocket?.handColor ?? PALETTE.CREAM_WHITE,
  };

  drawAttachedGardenBlade(
    g,
    hx,
    cy,
    facingAngle,
    swordWpn,
    elapsedSeconds,
    socket,
    flipX
  );
}

/**
 * Renders the botanical Arbalete (crossbow):
 * - When `isBackSlung` is true (`phase === 'ready'`), it is rendered behind the hero's back (`gUnder`)
 *   in a static diagonal stowed position!
 * - When `isBackSlung` is false (`phase` in `'windup' | 'active' | 'recovery'`), it is brought to the front (`gOver`)
 *   with dynamic bowstring draw/release and recoil animation.
 */
export function drawHeroHalberd(
  g: PIXI.Graphics,
  hx: number,
  cy: number,
  facingAngle: number,
  spearWpn: {
    level: number;
    evolved: boolean;
    phase: string;
    phaseTimer: number;
    swingCounter: number;
    lockedAngle?: number;
  },
  _elapsedSeconds: number,
  isBackSlung = false,
  flipX = 1
): void {
  const def = WEAPONS.thorn_spear;
  const limbColor = spearWpn.evolved
    ? (def?.evolvedColor ?? PALETTE.CRIMSON_WARN)
    : (def?.color ?? PALETTE.BLUSH_ROSE);

  let localAngleOffset = 0;
  let recoilOffset = 15.5;
  let stringPullX = 2; // relative to stockRear
  let showLoadedBolt = true;

  if (isBackSlung) {
    // Static diagonal stowed position across the hero's back
    recoilOffset = -4;
    stringPullX = 2;
    showLoadedBolt = true;
  } else if (spearWpn.phase === 'windup') {
    const t = clamp(1 - spearWpn.phaseTimer / 0.14, 0, 1);
    localAngleOffset = 0;
    recoilOffset = lerp(11.0, 15.5, t);
    stringPullX = lerp(4, -2.0, t);
    showLoadedBolt = true;
  } else if (spearWpn.phase === 'active') {
    const t = clamp(1 - spearWpn.phaseTimer / 0.22, 0, 1);
    const easeOut = 1 - Math.pow(1 - t, 3);
    localAngleOffset = 0;
    // Sharp crossbow recoil kickback in front of the hero on release, then settling forward
    recoilOffset = t < 0.35 ? lerp(15.5, 9.0, t / 0.35) : lerp(9.0, 15.0, easeOut);
    // Bowstring snaps all the way forward to the prod limbs
    stringPullX = lerp(13.5, 11.0, easeOut);
    showLoadedBolt = false;
  } else if (spearWpn.phase === 'recovery') {
    const t = clamp(1 - spearWpn.phaseTimer / 0.20, 0, 1);
    localAngleOffset = 0;
    recoilOffset = lerp(15.0, 12.0, t);
    stringPullX = lerp(11.0, 2, t);
    showLoadedBolt = t > 0.4;
  }

  const attackAngle =
    typeof spearWpn.lockedAngle === 'number'
      ? spearWpn.lockedAngle
      : facingAngle;
  const totalAngle = isBackSlung
    ? flipX >= 0
      ? -Math.PI * 0.72
      : -Math.PI * 0.28
    : attackAngle + localAngleOffset;
  const originX = isBackSlung ? hx - flipX * 5 : hx;
  const originY = isBackSlung ? cy - 5 : cy + 1.5;
  const cosA = Math.cos(totalAngle);
  const sinA = Math.sin(totalAngle);
  const frontScale = isBackSlung ? 1.0 : 1.18;

  const toWX = (lx: number, ly: number) =>
    originX + (lx * cosA - ly * sinA) * frontScale;
  const toWY = (lx: number, ly: number) =>
    originY + (lx * sinA + ly * cosA) * frontScale;

  const yOff = isBackSlung ? 0 : 0;
  const stockRear = recoilOffset - 5;
  const stockLen = 18 + Math.min(8, spearWpn.level) * 0.65 + (spearWpn.evolved ? 3 : 0);
  const stockFront = stockRear + stockLen;
  const limbSpan = 12.5 + (spearWpn.evolved ? 2.5 : 0);
  const limbTipX = stockFront - 4.5;
  const nockX = stockRear + stringPullX;

  // 1. Taut golden bowstring (drawn from top limb tip -> nock -> bottom limb tip)
  g.moveTo(toWX(limbTipX, yOff - limbSpan), toWY(limbTipX, yOff - limbSpan))
    .lineTo(toWX(nockX, yOff), toWY(nockX, yOff))
    .lineTo(toWX(limbTipX, yOff + limbSpan), toWY(limbTipX, yOff + limbSpan))
    .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.0, alpha: 0.95, join: 'round' });

  // 2. Carved ironwood crossbow tiller / stock polygon
  const sHalfH = 2.9;
  g.moveTo(toWX(stockRear, yOff - sHalfH), toWY(stockRear, yOff - sHalfH))
    .lineTo(toWX(stockFront, yOff - sHalfH), toWY(stockFront, yOff - sHalfH))
    .lineTo(toWX(stockFront, yOff + sHalfH), toWY(stockFront, yOff + sHalfH))
    .lineTo(toWX(stockRear, yOff + sHalfH), toWY(stockRear, yOff + sHalfH))
    .closePath()
    .fill({ color: spearWpn.evolved ? 0x7f1d1d : 0x78350f })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.4 });

  // Central flight groove & golden stock pommel
  g.moveTo(toWX(stockRear + 2.5, yOff), toWY(stockRear + 2.5, yOff))
    .lineTo(toWX(stockFront - 1.5, yOff), toWY(stockFront - 1.5, yOff))
    .stroke({ color: PALETTE.CREAM_WHITE, width: 1.4, alpha: 0.75 });
  g.circle(toWX(stockRear, yOff), toWY(stockRear, yOff), 2.8 * frontScale)
    .fill({ color: PALETTE.BUTTER_YELLOW })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

  // 3. Curved botanical Arbalete prod limbs (top & bottom)
  g.moveTo(toWX(stockFront - 1.5, yOff - 2), toWY(stockFront - 1.5, yOff - 2))
    .quadraticCurveTo(
      toWX(stockFront + 2.5, yOff - limbSpan * 0.65),
      toWY(stockFront + 2.5, yOff - limbSpan * 0.65),
      toWX(limbTipX, yOff - limbSpan),
      toWY(limbTipX, yOff - limbSpan)
    )
    .quadraticCurveTo(
      toWX(stockFront - 2.5, yOff - limbSpan * 0.55),
      toWY(stockFront - 2.5, yOff - limbSpan * 0.55),
      toWX(stockFront - 4.2, yOff - 2),
      toWY(stockFront - 4.2, yOff - 2)
    )
    .closePath()
    .fill({ color: limbColor })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.3 });

  g.moveTo(toWX(stockFront - 1.5, yOff + 2), toWY(stockFront - 1.5, yOff + 2))
    .quadraticCurveTo(
      toWX(stockFront + 2.5, yOff + limbSpan * 0.65),
      toWY(stockFront + 2.5, yOff + limbSpan * 0.65),
      toWX(limbTipX, yOff + limbSpan),
      toWY(limbTipX, yOff + limbSpan)
    )
    .quadraticCurveTo(
      toWX(stockFront - 2.5, yOff + limbSpan * 0.55),
      toWY(stockFront - 2.5, yOff + limbSpan * 0.55),
      toWX(stockFront - 4.2, yOff + 2),
      toWY(stockFront - 4.2, yOff + 2)
    )
    .closePath()
    .fill({ color: limbColor })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.3 });

  // Prod nose stirrup / golden collar
  g.circle(toWX(stockFront - 1.0, yOff), toWY(stockFront - 1.0, yOff), 3.4 * frontScale)
    .fill({ color: PALETTE.BUTTER_YELLOW })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

  // 4. Loaded briar bolt sitting in the flight groove (or firing flash during 'active')
  if (showLoadedBolt) {
    const boltTailX = nockX;
    const boltTipX = stockFront + 9.5;
    // Bolt shaft
    g.moveTo(toWX(boltTailX, yOff), toWY(boltTailX, yOff))
      .lineTo(toWX(boltTipX - 4, yOff), toWY(boltTipX - 4, yOff))
      .stroke({ color: PALETTE.CREAM_WHITE, width: 2.4, cap: 'round' });
    // Barbed briar broadhead tip
    g.moveTo(toWX(boltTipX, yOff), toWY(boltTipX, yOff))
      .lineTo(toWX(boltTipX - 6.5, yOff - 3.8), toWY(boltTipX - 6.5, yOff - 3.8))
      .lineTo(toWX(boltTipX - 4.5, yOff), toWY(boltTipX - 4.5, yOff))
      .lineTo(toWX(boltTipX - 6.5, yOff + 3.8), toWY(boltTipX - 6.5, yOff + 3.8))
      .closePath()
      .fill({ color: spearWpn.evolved ? PALETTE.GOLD_STAR : limbColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });
  } else {
    // Firing snap flash at the Arbalete nose when bolt launches
    g.circle(toWX(stockFront + 3.5, yOff), toWY(stockFront + 3.5, yOff), 4.6)
      .fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.95 })
      .stroke({ color: limbColor, width: 2.0 });
  }

  // 5. When brought to the front on attack (!isBackSlung), draw the hero's front-gripping hands holding the stock!
  if (!isBackSlung) {
    g.circle(toWX(stockRear + 3.0, yOff + 2.2), toWY(stockRear + 3.0, yOff + 2.2), 3.6)
      .fill({ color: PALETTE.CREAM_WHITE })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0 });
    g.circle(toWX(stockFront - 6.5, yOff - 2.2), toWY(stockFront - 6.5, yOff - 2.2), 3.4)
      .fill({ color: PALETTE.CREAM_WHITE })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0 });
  }
}
