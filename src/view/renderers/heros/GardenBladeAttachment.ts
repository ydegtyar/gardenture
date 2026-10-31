import * as PIXI from 'pixi.js';
import { PALETTE, WEAPONS } from '../../../content/data/catalog';
import { clamp, lerp } from '../../../core/math/vec2';
import type { Simulation } from '../../../sim/Simulation';
import { HERBALIST_PALETTE_NUM } from './HerbalistCharacter';

/**
 * Interface defining a hero's weapon attachment socket for Garden Blade / Verdant Edge.
 * Connects the Garden Blade directly to the hand, and the hand directly to the hero's shoulder.
 */
export interface HeroWeaponSocket {
  /** Right shoulder X offset from hero center (at flipX = 1) */
  shoulderX: number;
  /** Right shoulder Y offset from hero center */
  shoulderY: number;
  /** Right hand resting X offset from hero center (at flipX = 1) */
  handRestX: number;
  /** Right hand resting Y offset from hero center */
  handRestY: number;
  /** Legacy alias for handRestX */
  socketX?: number;
  /** Legacy alias for handRestY */
  socketY?: number;
  /** Primary sleeve / clothing color */
  sleeveColor: number;
  /** Cuff / trim accent color */
  cuffColor: number;
  /** Gripping hand skin / glove color */
  handColor: number;
  /** Resting blade angle (radians) */
  restBladeAngle?: number;
  /**
   * Optional custom default hand / weapon renderer when Garden Blade is NOT equipped.
   * E.g. Herbalist renders her wooden stick (staff) and peach hand; when Garden Blade is drafted,
   * this is removed and replaced by the Garden Blade gripping hand.
   */
  drawDefaultWeapon?: (
    g: PIXI.Graphics,
    hx: number,
    cy: number,
    flipX: number,
    elapsedSeconds: number,
    facingAngle: number
  ) => void;
}

export interface SwordWeaponState {
  level: number;
  evolved: boolean;
  phase: string;
  phaseTimer: number;
  swingCounter: number;
}

export interface GardenBladeAttachmentContext {
  gOver: PIXI.Graphics;
  hx: number;
  cy: number;
  displayFacingAngle: number;
  flipX: number;
  elapsedSeconds: number;
  sim: Simulation;
  professionId: string;
  personaId?: string | null;
  bodyColor?: number;
  accentColor?: number;
  customSocket?: Partial<HeroWeaponSocket>;
}

// ============================================================================
// 1. REUSABLE HERO WEAPON SOCKET DEFINITIONS
// ============================================================================

/**
 * Standard weapon sockets for each hero profession in Gardenture.
 * Positions are defined relative to the hero center (hx, cy) at flipX = 1.
 * Shoulders are aligned to the hero's shoulder seam, hands to the weapon grip socket.
 */
export const HERO_WEAPON_SOCKETS: Record<string, HeroWeaponSocket> = {
  herbalist: {
    // Shoulder on the right shoulder seam of the green tunic
    shoulderX: 8.5,
    shoulderY: 1.0,
    // Resting hand right at the stick socket (where hand with stick was placed)
    handRestX: 11.5,
    handRestY: 5.5,
    sleeveColor: HERBALIST_PALETTE_NUM.tunicGreen,
    cuffColor: HERBALIST_PALETTE_NUM.creamWhite,
    handColor: HERBALIST_PALETTE_NUM.peachSkin,
    restBladeAngle: 0.65,
    /**
     * Default weapon: Hand with short wooden stick attached to hero's shoulder.
     * When Garden Blade card is drafted, this is removed and replaced by the Garden Blade.
     */
    drawDefaultWeapon: (g, hx, cy, flipX, elapsedSeconds) => {
      const shoulderX = hx + 8.5 * flipX;
      const shoulderY = cy + 1.0;
      const breathSway = Math.sin(elapsedSeconds * 3.5);
      const handX = hx + 11.5 * flipX + Math.cos(elapsedSeconds * 3.5) * 0.3;
      const handY = cy + 5.5 + breathSway * 0.4;
      const P = HERBALIST_PALETTE_NUM;

      // 1. Arm connecting shoulder of hero to the hand
      const midX = (shoulderX + handX) * 0.5 + 1.2 * flipX;
      const midY = (shoulderY + handY) * 0.5;

      g.moveTo(shoulderX, shoulderY)
        .lineTo(midX, midY)
        .lineTo(handX, handY)
        .stroke({ color: P.plumOutline, width: 6.0, cap: 'round', join: 'round' });
      g.moveTo(shoulderX, shoulderY)
        .lineTo(midX, midY)
        .stroke({ color: P.tunicGreen, width: 3.8, cap: 'round' });
      g.moveTo(midX, midY)
        .lineTo(handX, handY)
        .stroke({ color: P.creamWhite, width: 3.2, cap: 'round' });

      // 2. Staff subtle breathing sway attached to hand
      const staffAngle = (0.26 + breathSway * 0.04) * flipX;

      const m = new PIXI.Matrix();
      m.rotate(staffAngle);
      m.translate(handX + 1.5 * flipX, handY);
      g.setTransform(m);

      // Wooden staff shaft (22px long, 5px wide)
      g.roundRect(-2.5, -9, 5, 22, 2.5)
        .fill({ color: P.woodBrown })
        .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });

      // Staff bottom shade
      g.roundRect(-2, 7, 4, 5, 1.5)
        .fill({ color: P.woodShadow });

      g.setTransform(new PIXI.Matrix());

      // 3. Peach hand gripping the staff
      g.circle(handX, handY, 3.2)
        .fill({ color: P.peachSkin })
        .stroke({ color: P.plumOutline, width: 2.5 });
    },
  },

  warden: {
    shoulderX: 9.5,
    shoulderY: 1.0,
    handRestX: 12.0,
    handRestY: 5.5,
    sleeveColor: 0xd9a066,
    cuffColor: 0xa8e6cf,
    handColor: PALETTE.CREAM_WHITE,
    restBladeAngle: 0.65,
  },

  seeker: {
    shoulderX: 9.0,
    shoulderY: 1.0,
    handRestX: 12.0,
    handRestY: 5.5,
    sleeveColor: 0xded2f9,
    cuffColor: 0x5e4b75,
    handColor: 0xffd3b6,
    restBladeAngle: 0.65,
  },

  stormcaller: {
    shoulderX: 8.5,
    shoulderY: 1.0,
    handRestX: 11.5,
    handRestY: 5.5,
    sleeveColor: 0xa0c4ff,
    cuffColor: 0xded2f9,
    handColor: 0xffd3b6,
    restBladeAngle: 0.65,
  },
};

/**
 * Resolves the weapon socket for any hero, allowing custom overrides.
 */
export function getHeroWeaponSocket(
  professionId: string,
  bodyColor?: number,
  accentColor?: number,
  customSocket?: Partial<HeroWeaponSocket>,
  personaId?: string | null
): HeroWeaponSocket {
  const base = HERO_WEAPON_SOCKETS[professionId] ?? HERO_WEAPON_SOCKETS.warden!;
  const isHerbalist = professionId === 'herbalist';
  const isHitenJade = personaId === 'herbalist_frieren_strange';

  let sleeveColor = customSocket?.sleeveColor ?? (isHerbalist ? base.sleeveColor : (bodyColor ?? base.sleeveColor));
  let cuffColor = customSocket?.cuffColor ?? (isHerbalist ? base.cuffColor : (accentColor ?? base.cuffColor));
  let handColor = customSocket?.handColor ?? base.handColor;
  let drawDefaultWeapon = customSocket?.drawDefaultWeapon ?? base.drawDefaultWeapon;

  if (isHitenJade) {
    // Hiten Jade uses frost-trimmed cerulean robes and soft porcelain skin
    sleeveColor = customSocket?.sleeveColor ?? 0x0284c7; // Cerulean blue dress-robe
    cuffColor = customSocket?.cuffColor ?? 0xf8fafc;     // Snowy frost white cuff
    handColor = customSocket?.handColor ?? 0xffe4d6;     // Soft porcelain peach skin
    // Hiten Jade never uses a wooden stick or default weapon
    drawDefaultWeapon = undefined;
  }

  return {
    ...base,
    sleeveColor,
    cuffColor,
    handColor,
    drawDefaultWeapon,
    ...customSocket,
    ...(isHitenJade && !customSocket?.drawDefaultWeapon ? { drawDefaultWeapon: undefined } : {}),
  };
}

// ============================================================================
// 2. REUSABLE GARDEN BLADE ATTACHMENT DRAWING
// ============================================================================

/**
 * Renders the articulated Garden Blade arm and weapon:
 * - Garden Blade is attached directly to the hand sprite.
 * - The hand sprite is attached directly to the shoulder of the hero.
 */
export function drawAttachedGardenBlade(
  g: PIXI.Graphics,
  hx: number,
  cy: number,
  facingAngle: number,
  swordWpn: SwordWeaponState,
  elapsedSeconds: number,
  socket: HeroWeaponSocket,
  flipX = 1
): void {
  const def = WEAPONS.garden_blade;
  const bladeColor = swordWpn.evolved
    ? (def?.evolvedColor ?? PALETTE.GOLD_STAR)
    : (def?.color ?? PALETTE.MINT_GREEN);
  const swingDir = swordWpn.swingCounter % 2 === 0 ? 1 : -1;

  // 1. Shoulder of the hero (anchored right on the hero's shoulder seam)
  const shoulderX = hx + socket.shoulderX * flipX;
  const shoulderY = cy + socket.shoulderY;

  // 2. Hand Position & Blade Angle
  let handX: number;
  let handY: number;
  let bladeAngle: number;
  const isAttacking = swordWpn.phase !== 'ready';

  if (isAttacking) {
    let localAngleOffset = swingDir * -0.58;
    let reach = 12.5;

    if (swordWpn.phase === 'windup') {
      const t = clamp(1 - swordWpn.phaseTimer / 0.06, 0, 1);
      localAngleOffset = lerp(swingDir * -0.58, swingDir * -1.28, t);
      reach = lerp(12.5, 9.0, t);
    } else if (swordWpn.phase === 'active') {
      const t = clamp(1 - swordWpn.phaseTimer / 0.08, 0, 1);
      const easeOut = 1 - Math.pow(1 - t, 2);
      localAngleOffset = lerp(swingDir * -1.28, swingDir * 1.28, easeOut);
      reach = 14.5;
    } else if (swordWpn.phase === 'recovery') {
      const t = clamp(1 - swordWpn.phaseTimer / 0.05, 0, 1);
      localAngleOffset = lerp(swingDir * 1.28, -swingDir * -0.58, t);
      reach = lerp(14.5, 12.5, t);
    }

    const swingAngle = facingAngle + localAngleOffset;
    // Hand is positioned along swing reach from the hero's shoulder
    handX = shoulderX + Math.cos(swingAngle) * reach;
    handY = shoulderY + Math.sin(swingAngle) * reach;
    bladeAngle = swingAngle;
  } else {
    // Resting/idle: Hand sits at hero's side socket (where hand with stick was placed)
    const breathSway = Math.sin(elapsedSeconds * 3.5);
    handX = hx + socket.handRestX * flipX + Math.cos(elapsedSeconds * 3.5) * 0.3;
    handY = cy + socket.handRestY + breathSway * 0.5;
    // Sword rests naturally pointing forward-down / forward-up
    bladeAngle = (socket.restBladeAngle ?? 0.65) * flipX + breathSway * 0.05;
  }

  // 3. Hand attached to the shoulder of the hero
  // Articulated sleeve connecting shoulder -> elbow -> hand
  const midX = (shoulderX + handX) * 0.5 + (isAttacking ? Math.cos(bladeAngle + 1.2 * swingDir) * 2.5 : 1.2 * flipX);
  const midY = (shoulderY + handY) * 0.5 + (isAttacking ? Math.sin(bladeAngle + 1.2 * swingDir) * 2.5 : 0);

  // Arm ink outline
  g.moveTo(shoulderX, shoulderY)
    .lineTo(midX, midY)
    .lineTo(handX, handY)
    .stroke({ color: PALETTE.INK_OUTLINE, width: 6.5, cap: 'round', join: 'round' });

  // Sleeve (hero clothing color)
  g.moveTo(shoulderX, shoulderY)
    .lineTo(midX, midY)
    .stroke({ color: socket.sleeveColor, width: 4.0, cap: 'round' });

  // Cuff (accent trim)
  g.moveTo(midX, midY)
    .lineTo(handX, handY)
    .stroke({ color: socket.cuffColor, width: 3.6, cap: 'round' });

  // 4. Garden Blade attached directly to the hand sprite
  // Transform matrix centered exactly at handX, handY
  const m = new PIXI.Matrix();
  m.rotate(bladeAngle);
  m.translate(handX, handY);
  g.setTransform(m);

  const bladeLen = 20 + Math.min(8, swordWpn.level) * 1.1 + (swordWpn.evolved ? 5 : 0);
  const bladeHalfW = (swordWpn.evolved ? 5.8 : 4.6) + swordWpn.level * 0.15;
  const mainMintColor = swordWpn.evolved ? (def?.evolvedColor ?? PALETTE.GOLD_STAR) : 0x7be0a8;
  const shadedEdgeColor = swordWpn.evolved ? 0xeab308 : 0x4fb67f;

  // 1. Golden pommel at base of hilt
  g.circle(-5.5, 0, 2.8)
    .fill({ color: PALETTE.BUTTER_YELLOW })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

  // 2. Leather-wrapped hilt (grip) running through the hand
  g.moveTo(-4, 0)
    .lineTo(2, 0)
    .stroke({ color: 0x7a482b, width: 3.8, cap: 'round' });
  // Diagonal wrap marks
  g.moveTo(-2.5, -1.2)
    .lineTo(-1.2, 1.2)
    .stroke({ color: 0x4a2612, width: 1.4, cap: 'round' });
  g.moveTo(-0.2, -1.2)
    .lineTo(1.1, 1.2)
    .stroke({ color: 0x4a2612, width: 1.4, cap: 'round' });

  // 3. Rounded golden crossguard with tiny center leaf gem
  g.moveTo(1, -4.8)
    .lineTo(3.2, -1.8)
    .lineTo(4.0, 0)
    .lineTo(3.2, 1.8)
    .lineTo(1, 4.8)
    .lineTo(0.2, 2.2)
    .lineTo(-0.8, 0)
    .lineTo(0.2, -2.2)
    .closePath()
    .fill({ color: PALETTE.BUTTER_YELLOW })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0, join: 'round' });

  // Tiny leaf gem in center of crossguard
  g.circle(1.8, 0, 1.3)
    .fill({ color: 0x7be0a8 })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.0 });

  // 4. Chunky Chibi Leaf Blade: smooth curved broad leaf with pointed tip
  // Lower shaded half (#4fb67f)
  g.moveTo(3.0, 0)
    .bezierCurveTo(bladeLen * 0.35, bladeHalfW * 1.05, bladeLen * 0.72, bladeHalfW * 0.85, bladeLen, 0)
    .lineTo(3.0, 0)
    .closePath()
    .fill({ color: shadedEdgeColor });

  // Upper main mint-green half (#7be0a8)
  g.moveTo(3.0, 0)
    .bezierCurveTo(bladeLen * 0.35, -bladeHalfW * 1.05, bladeLen * 0.72, -bladeHalfW * 0.85, bladeLen, 0)
    .lineTo(3.0, 0)
    .closePath()
    .fill({ color: mainMintColor });

  // Entire Leaf Blade Plum-Navy Cel Outline
  g.moveTo(3.0, 0)
    .bezierCurveTo(bladeLen * 0.35, -bladeHalfW * 1.05, bladeLen * 0.72, -bladeHalfW * 0.85, bladeLen, 0)
    .bezierCurveTo(bladeLen * 0.72, bladeHalfW * 0.85, bladeLen * 0.35, bladeHalfW * 1.05, 3.0, 0)
    .closePath()
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2, join: 'round' });

  // Pale-green central midrib line (#e2f8eb) & short side veins
  g.moveTo(4, 0)
    .lineTo(bladeLen - 2, 0)
    .stroke({ color: 0xe2f8eb, width: 1.4, alpha: 0.95, cap: 'round' });

  // Short side veins
  g.moveTo(bladeLen * 0.38, 0)
    .lineTo(bladeLen * 0.52, -bladeHalfW * 0.52)
    .stroke({ color: 0xe2f8eb, width: 1.1, alpha: 0.85, cap: 'round' });
  g.moveTo(bladeLen * 0.52, 0)
    .lineTo(bladeLen * 0.65, bladeHalfW * 0.48)
    .stroke({ color: 0xe2f8eb, width: 1.1, alpha: 0.85, cap: 'round' });

  // 5. Hand sprite gripping the hilt (centered directly at the hand position 0, 0)
  g.circle(0, 0, 3.4)
    .fill({ color: socket.handColor })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });

  g.setTransform(new PIXI.Matrix());
}

// ============================================================================
// 3. MAIN REUSABLE ATTACHMENT MECHANIC
// ============================================================================

/**
 * Universal Garden Blade attachment handler reusable across ALL hero renderers.
 *
 * Rules:
 * 1. Checks if the hero has drafted/equipped a 'garden_blade' card.
 * 2. If 'garden_blade' IS present:
 *    - Removes/omits any default hand weapon (e.g. Herbalist's hand with stick).
 *    - Attaches the Garden Blade directly to the hand, and hand to the hero's shoulder.
 * 3. If 'garden_blade' IS NOT present:
 *    - Renders the hero's default weapon (e.g. Herbalist's wooden stick and hand).
 *
 * @returns true if Garden Blade is attached; false if default weapon is active.
 */
export function attachGardenBladeToHero(ctx: GardenBladeAttachmentContext): boolean {
  const {
    gOver,
    hx,
    cy,
    displayFacingAngle,
    flipX,
    elapsedSeconds,
    sim,
    professionId,
    personaId,
    bodyColor,
    accentColor,
    customSocket,
  } = ctx;

  const resolvedPersonaId = personaId ?? sim?.personaId;
  const isHitenJade = resolvedPersonaId === 'herbalist_frieren_strange';

  const socket = getHeroWeaponSocket(
    professionId,
    bodyColor,
    accentColor,
    customSocket,
    resolvedPersonaId
  );
  const swordWpn = sim.weapons.find((w) => w.id === 'garden_blade');

  if (swordWpn) {
    // 1. Garden Blade card was taken:
    // Hand with stick is removed, and Garden Blade hand attaches directly to shoulder!
    drawAttachedGardenBlade(
      gOver,
      hx,
      cy,
      displayFacingAngle,
      swordWpn,
      elapsedSeconds,
      socket,
      flipX
    );
    return true;
  }

  // 2. Garden Blade card was NOT taken:
  // Render default weapon/hand ONLY if defined and not suppressed (e.g. Herbalist draws stick with hand; Hiten Jade suppresses it)
  if (!isHitenJade && socket.drawDefaultWeapon) {
    socket.drawDefaultWeapon(gOver, hx, cy, flipX, elapsedSeconds, displayFacingAngle);
  }

  return false;
}

/**
 * Calculates the exact world pixel coordinate of the tip/edge of the equipped Garden Blade.
 * Used to anchor Chain Lightning strikes to the edge of the blade when equipped.
 * Returns null if Garden Blade is not equipped on the hero.
 */
export function getGardenBladeTipPosition(
  sim: Simulation,
  hx: number,
  hy: number,
  displayFacingAngle?: number,
  elapsedSeconds?: number
): { x: number; y: number } | null {
  let swordWpn = sim.weapons.find((w) => w.id === 'garden_blade');
  if (!swordWpn && (sim.cards.garden_blade ?? 0) > 0) {
    swordWpn = {
      level: sim.cards.garden_blade,
      evolved: false,
      phase: 'ready',
      phaseTimer: 0,
      swingCounter: 0,
    } as any;
  }
  if (!swordWpn) {
    return null;
  }

  const socket = getHeroWeaponSocket(
    sim.professionId,
    undefined,
    undefined,
    undefined,
    sim.personaId
  );
  const facingAngle = displayFacingAngle ?? sim.heroFacingAngle ?? 0;
  const facingCos = Math.cos(facingAngle);
  const flipX = facingCos < -0.15 ? -1 : 1;
  const t = elapsedSeconds ?? sim.elapsedSeconds ?? 0;

  // Center Y of hero (matching cy in HeroRenderer / BaseHeroProfessionRenderer)
  const cy = hy;

  // 1. Shoulder of the hero
  const shoulderX = hx + socket.shoulderX * flipX;
  const shoulderY = cy + socket.shoulderY;

  // 2. Hand Position & Blade Angle
  let handX: number;
  let handY: number;
  let bladeAngle: number;
  const isAttacking = swordWpn.phase !== 'ready';
  const swingDir = swordWpn.swingCounter % 2 === 0 ? 1 : -1;

  if (isAttacking) {
    let localAngleOffset = swingDir * -0.58;
    let reach = 12.5;

    if (swordWpn.phase === 'windup') {
      const p = clamp(1 - swordWpn.phaseTimer / 0.06, 0, 1);
      localAngleOffset = lerp(swingDir * -0.58, swingDir * -1.28, p);
      reach = lerp(12.5, 9.0, p);
    } else if (swordWpn.phase === 'active') {
      const p = clamp(1 - swordWpn.phaseTimer / 0.08, 0, 1);
      const easeOut = 1 - Math.pow(1 - p, 2);
      localAngleOffset = lerp(swingDir * -1.28, swingDir * 1.28, easeOut);
      reach = 14.5;
    } else if (swordWpn.phase === 'recovery') {
      const p = clamp(1 - swordWpn.phaseTimer / 0.05, 0, 1);
      localAngleOffset = lerp(swingDir * 1.28, -swingDir * -0.58, p);
      reach = lerp(14.5, 12.5, p);
    }

    const swingAngle = facingAngle + localAngleOffset;
    handX = shoulderX + Math.cos(swingAngle) * reach;
    handY = shoulderY + Math.sin(swingAngle) * reach;
    bladeAngle = swingAngle;
  } else {
    // Resting/idle: Hand sits at hero's side socket
    const breathSway = Math.sin(t * 3.5);
    handX = hx + socket.handRestX * flipX + Math.cos(t * 3.5) * 0.3;
    handY = cy + socket.handRestY + breathSway * 0.5;
    bladeAngle = (socket.restBladeAngle ?? 0.65) * flipX + breathSway * 0.05;
  }

  // Blade length matching drawAttachedGardenBlade
  const bladeLen = 20 + Math.min(8, swordWpn.level) * 1.1 + (swordWpn.evolved ? 5 : 0);
  const tipX = handX + Math.cos(bladeAngle) * bladeLen;
  const tipY = handY + Math.sin(bladeAngle) * bladeLen;

  return { x: tipX, y: tipY };
}
