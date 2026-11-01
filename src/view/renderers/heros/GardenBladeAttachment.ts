import * as PIXI from 'pixi.js';
import { PALETTE, WEAPONS } from '../../../content/data/catalog';
import { clamp, lerp } from '../../../core/math/vec2';
import type { Simulation } from '../../../sim/Simulation';
import { solveTwoBoneIK, type HeroPose, type SocketName } from './rig/HeroRigCore';
import type { Attachment } from './types';

/**
 * ============================================================================
 * GARDEN BLADE ATTACHMENT MODULE (Reusable Across All Hero Renderers)
 * ============================================================================
 * Implements both:
 * 1. The formal socket-bound `Attachment` interface (`GardenBladeAttachment` class)
 *    that binds to `handNear` / `handFar` on `HeroPose` without negative scale
 *    mirroring, driving 2-bone arm IK from shoulder -> elbow -> weapon grip
 *    across `anticipation -> active -> recovery` with cel-shaded slash smears.
 * 2. Full backwards compatibility with `attachGardenBladeToHero`,
 *    `drawAttachedGardenBlade`, `getHeroWeaponSocket`, and `getGardenBladeTipPosition`.
 */

export interface HeroWeaponSocket {
  /** Local X offset from hero center (hx) for the resting weapon hand */
  handRestX: number;
  /** Local Y offset from hero center (cy) for the resting weapon hand */
  handRestY: number;
  /** Alias for handRestX (exact place where hand with stick was placed) */
  socketX: number;
  /** Alias for handRestY (exact place where hand with stick was placed) */
  socketY: number;
  /** Local X offset from hero center (hx) for the shoulder anchor */
  shoulderX: number;
  /** Local Y offset from hero center (cy) for the shoulder anchor */
  shoulderY: number;
  /** Primary sleeve color */
  sleeveColor: number;
  /** Forearm cuff / gauntlet color */
  cuffColor: number;
  /** Hand / glove color */
  handColor: number;
  /** Optional callback to draw the hero's default idle tool (e.g., Herbalist's wooden stick) when Garden Blade is NOT equipped */
  drawDefaultWeapon?: (
    g: PIXI.Graphics,
    hx: number,
    cy: number,
    flipX: number,
    elapsedSeconds: number
  ) => void;
}

export interface SwordWeaponState {
  level: number;
  evolved: boolean;
  phase: string;
  phaseTimer: number;
  swingCounter: number;
  lockedAngle?: number;
}

export interface GardenBladeAttachmentContext {
  gOver: PIXI.Graphics;
  gUnder?: PIXI.Graphics;
  hx: number;
  cy: number;
  displayFacingAngle: number;
  flipX: number;
  elapsedSeconds: number;
  sim: Simulation;
  professionId: string;
  /** Optional active persona skin id (e.g. 'herbalist_frieren_strange') */
  personaId?: string | null;
  bodyColor?: number;
  accentColor?: number;
  customSocket?: Partial<HeroWeaponSocket>;
  /** Optional solved procedural hero pose for socket-bound rendering */
  heroPose?: HeroPose;
}

/**
 * Default weapon socket configurations per hero profession.
 */
export const HERO_WEAPON_SOCKETS: Record<string, HeroWeaponSocket> = {
  herbalist: {
    // Exact place where the hand with the stick was placed on the Herbalist
    handRestX: 13.0,
    handRestY: 4.5,
    socketX: 13.0,
    socketY: 4.5,
    shoulderX: 8.5,
    shoulderY: 0.5,
    sleeveColor: 0x22c55e, // Tunic green (#22c55e)
    cuffColor: 0xfffdf0,   // Cream white trim (#fffdf0)
    handColor: 0xfed7aa,   // Peach skin (#fed7aa)
    drawDefaultWeapon: (g, hx, cy, flipX, elapsedSeconds) => {
      // Base Herbalist hero: draws the wooden stick and peach hand when Garden Blade is NOT equipped
      const bob = Math.sin(elapsedSeconds * 3.2) * 0.6;
      const sx = hx + flipX * 13.0;
      const sy = cy + 4.5 + bob;
      const angle = flipX * 0.26; // ~15 deg tilt

      // Transform without any negative scale
      const m = new PIXI.Matrix();
      m.rotate(angle);
      m.translate(sx, sy);
      g.setTransform(m);

      // Short wooden staff (5x22px rounded rod)
      g.roundRect(-2.5, -11, 5, 22, 2.5)
        .fill({ color: 0xb45309 })
        .stroke({ color: 0x2a1a2e, width: 2.8, cap: 'round', join: 'round' });

      // Soft bottom shade on wooden staff
      g.roundRect(-2, 5, 4, 5, 1.5).fill({ color: 0x78350f });

      g.setTransform(new PIXI.Matrix());

      // Peach hand gripping the wooden stick
      g.circle(sx, sy, 3.3)
        .fill({ color: 0xfed7aa })
        .stroke({ color: 0x2a1a2e, width: 2.4 });
    },
  },
  warden: {
    handRestX: 12.0,
    handRestY: 5.5,
    socketX: 12.0,
    socketY: 5.5,
    shoulderX: 8.5,
    shoulderY: 1.0,
    sleeveColor: PALETTE.SAGE_GREEN,
    cuffColor: PALETTE.GOLD_STAR,
    handColor: PALETTE.CREAM_WHITE,
  },
  seeker: {
    handRestX: 12.0,
    handRestY: 5.5,
    socketX: 12.0,
    socketY: 5.5,
    shoulderX: 8.5,
    shoulderY: 1.0,
    sleeveColor: PALETTE.MINT_GREEN,
    cuffColor: PALETTE.BUTTER_YELLOW,
    handColor: PALETTE.CREAM_WHITE,
  },
  stormcaller: {
    handRestX: 12.0,
    handRestY: 5.5,
    socketX: 12.0,
    socketY: 5.5,
    shoulderX: 8.5,
    shoulderY: 1.0,
    sleeveColor: PALETTE.SKY_BLUE,
    cuffColor: PALETTE.BUTTER_YELLOW,
    handColor: PALETTE.CREAM_WHITE,
  },
};

/**
 * Resolves the HeroWeaponSocket for any hero profession, merging any custom overrides.
 */
export function getHeroWeaponSocket(
  professionId: string,
  bodyColor?: number,
  accentColor?: number,
  customSocket?: Partial<HeroWeaponSocket>,
  personaId?: string | null
): HeroWeaponSocket {
  const base = HERO_WEAPON_SOCKETS[professionId] ?? HERO_WEAPON_SOCKETS.warden!;
  const resolvedHandX =
    customSocket?.handRestX ?? customSocket?.socketX ?? base.handRestX;
  const resolvedHandY =
    customSocket?.handRestY ?? customSocket?.socketY ?? base.handRestY;

  const suppressStickForPersona =
    professionId === 'herbalist' &&
    Boolean(personaId && personaId !== 'adventurer_default');

  const resolvedDrawDefaultWeapon =
    customSocket && 'drawDefaultWeapon' in customSocket
      ? customSocket.drawDefaultWeapon
      : suppressStickForPersona
        ? undefined
        : base.drawDefaultWeapon;

  return {
    ...base,
    sleeveColor: customSocket?.sleeveColor ?? bodyColor ?? base.sleeveColor,
    cuffColor: customSocket?.cuffColor ?? accentColor ?? base.cuffColor,
    handColor: customSocket?.handColor ?? base.handColor,
    ...customSocket,
    handRestX: resolvedHandX,
    handRestY: resolvedHandY,
    socketX: resolvedHandX,
    socketY: resolvedHandY,
    drawDefaultWeapon: resolvedDrawDefaultWeapon,
  };
}

/**
 * Pure helper calculating the Garden Blade's grip position, blade angle,
 * slash smear arc, and world-space tip without any negative scale mirroring.
 */
export interface GardenBladePoseSample {
  shoulderX: number;
  shoulderY: number;
  elbowX: number;
  elbowY: number;
  handX: number;
  handY: number;
  bladeAngle: number;
  bladeLen: number;
  bladeHalfW: number;
  tipX: number;
  tipY: number;
  smearAlpha: number;
  smearStartAngle: number;
  smearEndAngle: number;
  drawToUnder: boolean;
}

export function computeGardenBladePoseSample(
  hx: number,
  cy: number,
  facingAngle: number,
  swordWpn: SwordWeaponState,
  elapsedSeconds: number,
  socket: HeroWeaponSocket,
  continuousFacing = 1,
  heroPose?: HeroPose
): GardenBladePoseSample {
  const swingDir = swordWpn.swingCounter % 2 === 0 ? 1 : -1;
  const isAttacking = swordWpn.phase !== 'ready';
  const facingSign: 1 | -1 = continuousFacing >= 0 ? 1 : -1;

  // Bind to heroPose near-hand / shoulder sockets when available
  const shoulderX = heroPose
    ? heroPose.rig.shoulderNear.x
    : hx + facingSign * socket.shoulderX;
  const shoulderY = heroPose
    ? heroPose.rig.shoulderNear.y
    : cy + socket.shoulderY;

  const restHandX = heroPose
    ? heroPose.sockets.handNear.x + facingSign * 2.5
    : hx + facingSign * socket.handRestX;
  const restHandY = heroPose
    ? heroPose.sockets.handNear.y
    : cy + socket.handRestY;

  let handX = restHandX;
  let handY = restHandY;
  let bladeAngle = 0;
  let smearAlpha = 0;
  let smearStartAngle = 0;
  let smearEndAngle = 0;

  const attackBaseAngle =
    isAttacking && typeof swordWpn.lockedAngle === 'number'
      ? swordWpn.lockedAngle
      : facingAngle;

  if (!isAttacking) {
    // Idle poised carry at the near-hand socket:
    // Note: blade points along local -Y, so bladeAngle = 0 points straight UP.
    // Tilt slightly outward by facingSign * 0.28 rad + gentle breathing sway.
    const idleBob = Math.sin(elapsedSeconds * 3.5);
    handX = restHandX + Math.cos(elapsedSeconds * 3.5) * 0.4 * facingSign;
    handY = restHandY + idleBob * 0.65;
    bladeAngle = facingSign * 0.28 + idleBob * 0.05;
  } else {
    // Active melee swing oriented along attackBaseAngle:
    // Because the blade geometry extends along local -Y (angle -PI/2 in world space when rotation=0),
    // rotating by (attackBaseAngle + Math.PI / 2) aligns the blade tip with attackBaseAngle!
    const forwardBladeAngle = attackBaseAngle + Math.PI / 2;
    const aimCos = Math.cos(attackBaseAngle);
    const aimSin = Math.sin(attackBaseAngle);

    if (swordWpn.phase === 'windup') {
      const t = clamp(1 - swordWpn.phaseTimer / 0.06, 0, 1);
      const windupArc = -swingDir * 1.15 * t;
      bladeAngle = forwardBladeAngle + windupArc;
      handX = lerp(restHandX, shoulderX + aimCos * 7.5 - aimSin * swingDir * 4.5, t);
      handY = lerp(restHandY, shoulderY + aimSin * 6.5 + aimCos * swingDir * 3.5, t);
    } else if (swordWpn.phase === 'active') {
      const t = clamp(1 - swordWpn.phaseTimer / 0.08, 0, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);
      const startArc = -swingDir * 1.15;
      const endArc = swingDir * 1.15;
      const curArc = lerp(startArc, endArc, easeOut);
      bladeAngle = forwardBladeAngle + curArc;
      const thrust = 11.5 + Math.sin(easeOut * Math.PI) * 3.2;
      const sweepAngle = attackBaseAngle + curArc * 0.45;
      handX = shoulderX + Math.cos(sweepAngle) * thrust;
      handY = shoulderY + Math.sin(sweepAngle) * thrust * 0.82;

      smearAlpha = (1 - t * 0.45) * 0.72;
      smearStartAngle = attackBaseAngle + startArc * 0.85;
      smearEndAngle = attackBaseAngle + curArc;
    } else {
      // recovery
      const t = clamp(1 - swordWpn.phaseTimer / 0.05, 0, 1);
      const recArc = swingDir * 1.15 * (1 - t);
      bladeAngle = lerp(forwardBladeAngle + recArc, facingSign * 0.28, t);
      handX = lerp(shoulderX + aimCos * 10.5, restHandX, t);
      handY = lerp(shoulderY + aimSin * 8.5, restHandY, t);
    }
  }

  // Solve 2-bone analytic IK for the weapon arm (shoulder -> elbow -> hand)
  const elbow = { x: 0, y: 0 };
  const clampedHand = { x: handX, y: handY };
  solveTwoBoneIK(
    shoulderX,
    shoulderY,
    handX,
    handY,
    7.2,
    7.2,
    -facingSign * 0.75,
    elbow,
    clampedHand
  );

  const bladeLen =
    17 + Math.min(8, swordWpn.level) * 1.15 + (swordWpn.evolved ? 4 : 0);
  const bladeHalfW = swordWpn.evolved ? 5.2 : 4.2;

  // Local (0, -bladeLen) rotated by bladeAngle:
  // worldX = handX + sin(bladeAngle) * bladeLen
  // worldY = handY - cos(bladeAngle) * bladeLen
  const tipX = clampedHand.x + Math.sin(bladeAngle) * bladeLen;
  const tipY = clampedHand.y - Math.cos(bladeAngle) * bladeLen;

  // If aiming steeply upward (sin < -0.55), draw weapon behind head/torso on gUnder
  const drawToUnder = isAttacking && Math.sin(attackBaseAngle) < -0.55;

  return {
    shoulderX,
    shoulderY,
    elbowX: elbow.x,
    elbowY: elbow.y,
    handX: clampedHand.x,
    handY: clampedHand.y,
    bladeAngle,
    bladeLen,
    bladeHalfW,
    tipX,
    tipY,
    smearAlpha,
    smearStartAngle,
    smearEndAngle,
    drawToUnder,
  };
}

/**
 * Draws the articulated hero arm (shoulder -> elbow -> hand) and the
 * cel-shaded Garden Blade / Verdant Edge WITHOUT any negative scale mirroring.
 * Fixed world-space top-left lighting is applied to the blade facets.
 */
export function drawAttachedGardenBlade(
  g: PIXI.Graphics,
  hx: number,
  cy: number,
  facingAngle: number,
  swordWpn: SwordWeaponState,
  elapsedSeconds: number,
  socket: HeroWeaponSocket,
  flipX = 1,
  heroPose?: HeroPose
): void {
  const def = WEAPONS.garden_blade;
  const isEvolved = swordWpn.evolved;
  const mainMintColor = isEvolved ? (def?.evolvedColor ?? 0xfbbf24) : 0x7be0a8;
  const shadedEdgeColor = isEvolved ? 0xd97706 : 0x4fb67f;
  const outlineColor = 0x2a1a2e;

  const sample = computeGardenBladePoseSample(
    hx,
    cy,
    facingAngle,
    swordWpn,
    elapsedSeconds,
    socket,
    heroPose ? heroPose.facing : flipX,
    heroPose
  );

  // 1. Slash arc smear during active swing phase
  if (sample.smearAlpha > 0.02) {
    const rOuter = sample.bladeLen + 7;
    const rInner = rOuter - 2.5;
    const startA = Math.min(sample.smearStartAngle, sample.smearEndAngle);
    const endA = Math.max(sample.smearStartAngle, sample.smearEndAngle);
    if (endA - startA > 0.05) {
      g.moveTo(
        sample.shoulderX + Math.cos(startA) * rOuter,
        sample.shoulderY + Math.sin(startA) * rOuter
      )
        .arc(sample.shoulderX, sample.shoulderY, rOuter, startA, endA)
        .stroke({
          color: mainMintColor,
          width: 6.5,
          alpha: sample.smearAlpha * 0.45,
          cap: 'round',
        });
      g.moveTo(
        sample.shoulderX + Math.cos(startA) * rInner,
        sample.shoulderY + Math.sin(startA) * rInner
      )
        .arc(sample.shoulderX, sample.shoulderY, rInner, startA, endA)
        .stroke({
          color: 0xffffff,
          width: 2.4,
          alpha: sample.smearAlpha * 0.75,
          cap: 'round',
        });
    }
  }

  // 2. Articulated 2-Bone Arm (Shoulder -> Elbow -> Hand)
  g.moveTo(sample.shoulderX, sample.shoulderY)
    .lineTo(sample.elbowX, sample.elbowY)
    .lineTo(sample.handX, sample.handY)
    .stroke({
      color: outlineColor,
      width: 6.6,
      cap: 'round',
      join: 'round',
    });
  g.moveTo(sample.shoulderX, sample.shoulderY)
    .lineTo(sample.elbowX, sample.elbowY)
    .stroke({ color: socket.sleeveColor, width: 3.8, cap: 'round' });
  g.moveTo(sample.elbowX, sample.elbowY)
    .lineTo(sample.handX, sample.handY)
    .stroke({ color: socket.cuffColor, width: 3.4, cap: 'round' });

  // 3. Transform to Hand Socket using pure rotation + translation (scale is strictly +1, +1)
  const m = new PIXI.Matrix();
  m.rotate(sample.bladeAngle);
  m.translate(sample.handX, sample.handY);
  g.setTransform(m);

  const { bladeLen, bladeHalfW } = sample;

  // Fixed world-space lighting check: determine which side of the blade faces top-left world light
  // Blade normal for left half is (-cos(bladeAngle), -sin(bladeAngle)); dot with (-0.707, -0.707)
  const leftNormalDotLight =
    Math.cos(sample.bladeAngle) * 0.7071 + Math.sin(sample.bladeAngle) * 0.7071;
  const leftFacetColor = leftNormalDotLight >= 0 ? mainMintColor : shadedEdgeColor;
  const rightFacetColor = leftNormalDotLight >= 0 ? shadedEdgeColor : mainMintColor;

  // 1. Round gold pommel at bottom of hilt
  g.circle(0, 5.2, 2.4)
    .fill({ color: 0xf59e0b })
    .stroke({ color: outlineColor, width: 2.0 });

  // 2. Short brown wrapped grip
  g.roundRect(-1.7, 0.8, 3.4, 4.4, 1.2)
    .fill({ color: 0x7a482b })
    .stroke({ color: outlineColor, width: 2.0 });
  g.moveTo(-1.3, 2.5)
    .lineTo(1.3, 3.3)
    .stroke({ color: 0x4a2612, width: 1.3, cap: 'round' });

  // 3. Golden crossguard shaped like two small leaves with tiny green gem in middle
  g.moveTo(-5.2, 0.8)
    .lineTo(-2.0, -0.8)
    .lineTo(0, -1.4)
    .lineTo(2.0, -0.8)
    .lineTo(5.2, 0.8)
    .lineTo(2.0, 2.0)
    .lineTo(0, 1.4)
    .lineTo(-2.0, 2.0)
    .closePath()
    .fill({ color: 0xf59e0b })
    .stroke({ color: outlineColor, width: 2.0, join: 'round' });

  // Tiny green leaf gem in center of crossguard
  g.circle(0, -0.2, 1.3)
    .fill({ color: 0x7be0a8 })
    .stroke({ color: outlineColor, width: 1.0 });

  // 4. Broad Leaf Blade (world-space lit left & right halves)
  g.moveTo(0, -1.4)
    .bezierCurveTo(
      -bladeHalfW * 1.08,
      -bladeLen * 0.35,
      -bladeHalfW * 0.88,
      -bladeLen * 0.74,
      0,
      -bladeLen
    )
    .lineTo(0, -1.4)
    .closePath()
    .fill({ color: leftFacetColor });

  g.moveTo(0, -1.4)
    .bezierCurveTo(
      bladeHalfW * 1.08,
      -bladeLen * 0.35,
      bladeHalfW * 0.88,
      -bladeLen * 0.74,
      0,
      -bladeLen
    )
    .lineTo(0, -1.4)
    .closePath()
    .fill({ color: rightFacetColor });

  // Uniform cel outline around leaf blade
  g.moveTo(0, -1.4)
    .bezierCurveTo(
      -bladeHalfW * 1.08,
      -bladeLen * 0.35,
      -bladeHalfW * 0.88,
      -bladeLen * 0.74,
      0,
      -bladeLen
    )
    .bezierCurveTo(
      bladeHalfW * 0.88,
      -bladeLen * 0.74,
      bladeHalfW * 1.08,
      -bladeLen * 0.35,
      0,
      -1.4
    )
    .closePath()
    .stroke({ color: outlineColor, width: 2.2, join: 'round' });

  // Pale midrib line (#e2f8eb) and 2 short side veins
  g.moveTo(0, -2.2)
    .lineTo(0, -bladeLen + 1.8)
    .stroke({ color: 0xe2f8eb, width: 1.35, alpha: 0.95, cap: 'round' });
  g.moveTo(0, -bladeLen * 0.38)
    .lineTo(bladeHalfW * 0.52, -bladeLen * 0.52)
    .stroke({ color: 0xe2f8eb, width: 1.1, alpha: 0.85, cap: 'round' });
  g.moveTo(0, -bladeLen * 0.54)
    .lineTo(-bladeHalfW * 0.5, -bladeLen * 0.67)
    .stroke({ color: 0xe2f8eb, width: 1.1, alpha: 0.85, cap: 'round' });

  g.setTransform(new PIXI.Matrix());

  // 4. Gripping Hand at the Hilt Socket (drawn in world space, no negative scale)
  g.circle(sample.handX, sample.handY, 3.4)
    .fill({ color: socket.handColor })
    .stroke({ color: outlineColor, width: 2.3 });
  // Fixed top-left catchlight on gripping hand
  g.circle(sample.handX - 0.9, sample.handY - 0.9, 1.0).fill({
    color: 0xffffff,
    alpha: 0.55,
  });
}

/**
 * Computes the exact world-space pixel coordinates (x, y) of the Garden Blade's tip.
 * Supports both object-context and positional `(sim, hx, hy, facingAngle, elapsedSeconds)` call signatures.
 */
export function getGardenBladeTipPosition(
  ctxOrSim:
    | {
        hx: number;
        cy: number;
        displayFacingAngle: number;
        flipX: number;
        elapsedSeconds: number;
        sim: Simulation;
        professionId: string;
        personaId?: string | null;
        heroPose?: HeroPose;
      }
    | Simulation,
  hxArg?: number,
  hyArg?: number,
  facingAngleArg?: number,
  elapsedSecondsArg?: number
): { x: number; y: number } | null {
  const isPositional = typeof hxArg === 'number';
  const sim = isPositional
    ? (ctxOrSim as Simulation)
    : (ctxOrSim as { sim: Simulation }).sim;
  const hx = isPositional ? hxArg! : (ctxOrSim as { hx: number }).hx;
  const cy = isPositional ? (hyArg ?? 0) - 2 : (ctxOrSim as { cy: number }).cy;
  const displayFacingAngle = isPositional
    ? (facingAngleArg ?? sim.heroFacingAngle)
    : (ctxOrSim as { displayFacingAngle: number }).displayFacingAngle;
  const elapsedSeconds = isPositional
    ? (elapsedSecondsArg ?? sim.elapsedSeconds)
    : (ctxOrSim as { elapsedSeconds: number }).elapsedSeconds;
  const professionId = isPositional
    ? sim.professionId
    : (ctxOrSim as { professionId: string }).professionId;
  const personaId = isPositional
    ? sim.personaId
    : ((ctxOrSim as { personaId?: string | null }).personaId ?? sim.personaId);
  const heroPose = isPositional
    ? undefined
    : (ctxOrSim as { heroPose?: HeroPose }).heroPose;
  const flipX = isPositional
    ? Math.cos(displayFacingAngle) < -0.15
      ? -1
      : 1
    : (ctxOrSim as { flipX: number }).flipX;

  const swordWpn = sim.weapons.find((w) => w.id === 'garden_blade') as
    | SwordWeaponState
    | undefined;
  if (!swordWpn) return null;

  const socket = getHeroWeaponSocket(
    professionId,
    undefined,
    undefined,
    undefined,
    personaId
  );

  const sample = computeGardenBladePoseSample(
    hx,
    cy,
    displayFacingAngle,
    swordWpn,
    elapsedSeconds,
    socket,
    heroPose ? heroPose.facing : flipX,
    heroPose
  );

  return { x: sample.tipX, y: sample.tipY };
}

/**
 * Formal Socket-Bound `GardenBladeAttachment` implementing `Attachment`.
 */
export class GardenBladeAttachment implements Attachment {
  public readonly id = 'garden_blade';
  public readonly suppressesDefaultWeapon = true;

  private swordWpn: SwordWeaponState | null = null;
  private socket: HeroWeaponSocket;
  private elapsedSeconds = 0;

  constructor(
    professionId = 'warden',
    personaId?: string | null,
    customSocket?: Partial<HeroWeaponSocket>
  ) {
    this.socket = getHeroWeaponSocket(
      professionId,
      undefined,
      undefined,
      customSocket,
      personaId
    );
  }

  public getSocketRequirements(): readonly SocketName[] {
    return ['handNear', 'handFar'] as const;
  }

  public configure(
    swordWpn: SwordWeaponState | null,
    socket: HeroWeaponSocket,
    elapsedSeconds: number
  ): void {
    this.swordWpn = swordWpn;
    this.socket = socket;
    this.elapsedSeconds = elapsedSeconds;
  }

  public update(_dt: number, heroPose: HeroPose): void {
    if (!this.swordWpn) return;

    const sample = computeGardenBladePoseSample(
      heroPose.rootX,
      heroPose.centerY,
      heroPose.facingAngle,
      this.swordWpn,
      this.elapsedSeconds,
      this.socket,
      heroPose.facing,
      heroPose
    );

    // Update heroPose near-arm IK & handNear/castOrigin sockets so other attachments (e.g. Chain Lightning)
    // can chain directly from the blade tip or gripping hand!
    heroPose.rig.elbowNear.x = sample.elbowX;
    heroPose.rig.elbowNear.y = sample.elbowY;
    heroPose.rig.handNear.x = sample.handX;
    heroPose.rig.handNear.y = sample.handY;
    heroPose.sockets.handNear.x = sample.handX;
    heroPose.sockets.handNear.y = sample.handY;
    heroPose.sockets.handNear.angle = sample.bladeAngle;
    heroPose.sockets.castOrigin.x = sample.tipX;
    heroPose.sockets.castOrigin.y = sample.tipY;
  }

  public draw(
    gUnder: PIXI.Graphics,
    gOver: PIXI.Graphics,
    heroPose: HeroPose
  ): void {
    if (!this.swordWpn) return;
    const sample = computeGardenBladePoseSample(
      heroPose.rootX,
      heroPose.centerY,
      heroPose.facingAngle,
      this.swordWpn,
      this.elapsedSeconds,
      this.socket,
      heroPose.facing,
      heroPose
    );
    const targetG = sample.drawToUnder ? gUnder : gOver;
    drawAttachedGardenBlade(
      targetG,
      heroPose.rootX,
      heroPose.centerY,
      heroPose.facingAngle,
      this.swordWpn,
      this.elapsedSeconds,
      this.socket,
      heroPose.facingSign,
      heroPose
    );
  }
}

/**
 * High-level attachment controller:
 * - Checks if the hero currently has the `garden_blade` weapon card equipped.
 * - If equipped: suppresses any default hand tool (such as the Herbalist's wooden stick)
 *   and attaches the Garden Blade to the hero's weapon socket.
 * - If NOT equipped: draws the hero's default hand tool if defined.
 */
export function attachGardenBladeToHero(ctx: GardenBladeAttachmentContext): boolean {
  const resolvedPersonaId = ctx.personaId ?? ctx.sim?.personaId;
  const socket = getHeroWeaponSocket(
    ctx.professionId,
    ctx.bodyColor,
    ctx.accentColor,
    ctx.customSocket,
    resolvedPersonaId
  );

  const swordWpn = ctx.sim.weapons.find((w) => w.id === 'garden_blade') as
    | SwordWeaponState
    | undefined;

  if (swordWpn) {
    drawAttachedGardenBlade(
      ctx.gOver,
      ctx.hx,
      ctx.cy,
      ctx.displayFacingAngle,
      swordWpn,
      ctx.elapsedSeconds,
      socket,
      ctx.flipX,
      ctx.heroPose
    );
    return true;
  }

  // Garden Blade is not equipped: render default hand weapon (e.g. Herbalist wooden stick) if present
  if (socket.drawDefaultWeapon) {
    socket.drawDefaultWeapon(
      ctx.gOver,
      ctx.hx,
      ctx.cy,
      ctx.flipX,
      ctx.elapsedSeconds
    );
  }

  return false;
}
