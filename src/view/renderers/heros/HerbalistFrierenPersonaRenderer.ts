import type * as PIXI from 'pixi.js';
import type { PersonaRenderer, PersonaRenderContext } from './types';
import type { HeroWeaponSocket } from './GardenBladeAttachment';

export interface HitenJadeCondensationFacetSample {
  dx: number;
  dy: number;
  rx: number;
  ry: number;
  tiltRad: number;
  scale: number;
  alpha: number;
  glintFactor: number;
  isFront: boolean;
  fill: number;
  core: number;
}

export interface HitenJadeVaporPuffSample {
  dx: number;
  dy: number;
  radiusX: number;
  radiusY: number;
  curlX: number;
  curlY: number;
  alpha: number;
  isFront: boolean;
  isJade: boolean;
  color: number;
  coreColor: number;
}

export interface HitenJadeAuraAnimationSample {
  /** Primary harmonic sway of the lower ice-blue orbital */
  iceSwayX: number;
  iceLiftY: number;
  iceBreathWidth: number;
  /** Primary harmonic sway of the upper diamond-green orbital */
  jadeSwayX: number;
  jadeLiftY: number;
  jadeBreathWidth: number;
  /** Continuous orbital revolution angle (radians) */
  orbitAngle: number;
  /** Normalized 0..1 travelling condensation surges along the orbitals */
  flowPulseA: number;
  flowPulseB: number;
  flowPulseC: number;
  /** Shoulder plume curl offset */
  plumeSwayX: number;
  plumeLiftY: number;
  /** Animated diamond condensation facets orbiting along the green & blue orbitals */
  facets: HitenJadeCondensationFacetSample[];
  /** Rising wispy water vapor puffs & mist tendrils evaporating from the orbitals */
  vaporPuffs: HitenJadeVaporPuffSample[];
}

/**
 * Pure deterministic animation sampler for Hiten Jade's revolving diamond-green
 * and ice-blue orbitals, orbiting diamond condensation facets, and rising water vapor mist.
 */
export function computeHitenJadeAuraSample(
  elapsedSeconds: number,
  heroVx = 0,
  heroVy = 0
): HitenJadeAuraAnimationSample {
  const t = elapsedSeconds;
  // Reactive trailing lean when moving
  const velLeanX = Math.max(-4.5, Math.min(4.5, -heroVx * 0.55));
  const velLeanY = Math.max(-2.8, Math.min(2.8, -heroVy * 0.35));

  // Pronounced, fluid 3D orbital undulation & vertical cross-sweep so the two crossing orbitals visibly move
  const orbitAngle = t * 2.35;
  const iceSwayX = Math.sin(t * 3.1) * 6.8 + Math.cos(t * 1.85) * 2.4 + velLeanX * 0.7;
  const iceLiftY = Math.cos(t * 2.65) * 5.2 + Math.sin(t * 4.1) * 1.8 + velLeanY * 0.55;
  const iceBreathWidth = 1 + 0.22 * Math.sin(t * 3.8);

  const jadeSwayX = -Math.sin(t * 2.95 + 0.9) * 6.8 + Math.sin(t * 2.05) * 2.4 + velLeanX * 0.7;
  const jadeLiftY = Math.sin(t * 2.75 + 0.65) * 5.2 - Math.cos(t * 3.9) * 1.8 + velLeanY * 0.55;
  const jadeBreathWidth = 1 + 0.22 * Math.cos(t * 3.6 + 0.7);

  const flowPulseA = ((t * 0.95) % 1 + 1) % 1;
  const flowPulseB = ((t * 0.95 + 0.333) % 1 + 1) % 1;
  const flowPulseC = ((t * 0.95 + 0.667) % 1 + 1) % 1;

  const plumeSwayX = Math.sin(t * 3.5) * 4.6 + velLeanX * 0.85;
  const plumeLiftY = Math.cos(t * 2.8) * 3.6;

  // 8 diamond condensation facets (4 orbiting along the tilted Emerald-Jade orbital, 4 along the tilted Glacier-Blue orbital)
  const facets: HitenJadeCondensationFacetSample[] = [];
  for (let i = 0; i < 8; i++) {
    const isJade = i % 2 === 0;
    const ringIndex = Math.floor(i / 2); // 0..3 around each orbital ring
    const direction = isJade ? 1 : -1;
    const theta =
      t * 2.25 * direction +
      ringIndex * (Math.PI * 0.5) +
      (isJade ? 0.25 : 1.05);

    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    // Tilted 3D orbital ellipse matching the crossing green & blue orbitals indicated on the screenshot
    const tiltSlope = isJade ? 0.42 : -0.42;
    const radiusX = 23.5 + Math.sin(t * 3.0 + i) * 2.2;
    const swayX = isJade ? jadeSwayX * 0.38 : iceSwayX * 0.38;
    const liftY = isJade ? jadeLiftY * 0.38 : iceLiftY * 0.38;

    const dx = cosT * radiusX + swayX + velLeanX * 0.4;
    const dy =
      -1.5 +
      cosT * radiusX * tiltSlope +
      sinT * 6.8 +
      liftY +
      Math.sin(t * 4.2 + i * 1.3) * 1.4;

    const depth = (sinT + 1) * 0.5; // 0 = furthest back, 1 = furthest front
    const pulse = 0.5 + 0.5 * Math.sin(t * 5.0 + i * 1.57);
    const scale = (0.76 + 0.34 * depth) * (0.88 + 0.22 * pulse);
    const tiltRad = Math.sin(theta) * 0.28 + (isJade ? -0.18 : 0.18);

    facets.push({
      dx,
      dy,
      rx: 2.6,
      ry: 3.9,
      tiltRad,
      scale,
      alpha: (0.58 + 0.42 * depth) * (0.84 + 0.16 * pulse),
      glintFactor: sinT >= -0.1 ? Math.max(0, (pulse - 0.52) / 0.48) : 0,
      isFront: sinT >= 0,
      fill: isJade ? 0x10b981 : 0x38bdf8,
      core: isJade ? 0xa7f3d0 : 0xe0f2fe,
    });
  }

  // 10 continuous rising wispy water vapor puffs & mist tendrils evaporating upward from the orbitals
  const vaporPuffs: HitenJadeVaporPuffSample[] = [];
  const puffCount = 10;
  for (let p = 0; p < puffCount; p++) {
    const isJade = p % 2 === 0;
    const cycleRate = 0.62 + (p % 3) * 0.11;
    const lifePhase = ((t * cycleRate + p / puffCount) % 1 + 1) % 1; // 0 (bottom of coil) -> 1 (evaporated above crown)
    const env = Math.sin(lifePhase * Math.PI); // Smooth fade-in and fade-out

    // Spawn around the orbital ring and rise upward while curling in S-waves
    const spawnAngle = p * ((Math.PI * 2) / puffCount) + t * 0.85 * (isJade ? 1 : -1);
    const baseRingX = Math.cos(spawnAngle) * 20.5;
    const waveDriftX =
      Math.sin(lifePhase * Math.PI * 2.2 + t * 3.2 + p) * 5.2 +
      (isJade ? jadeSwayX * 0.3 : iceSwayX * 0.3) +
      velLeanX * (0.4 + lifePhase * 0.6);

    const dx = baseRingX + waveDriftX;
    // Ascend from lower robe (+13) up past the head/shoulders (-27)
    const dy = 13.0 - lifePhase * 40.0 + Math.sin(spawnAngle) * 3.5 + velLeanY * 0.4;

    const growth = 0.65 + lifePhase * 0.85;
    const radiusX = (4.2 + (p % 3) * 1.1) * growth;
    const radiusY = (2.6 + (p % 2) * 0.8) * growth;
    const curlX = Math.cos(t * 3.6 + p * 1.7) * 5.5;
    const curlY = -4.5 - lifePhase * 4.5;

    vaporPuffs.push({
      dx,
      dy,
      radiusX,
      radiusY,
      curlX,
      curlY,
      alpha: (0.28 + 0.24 * (p % 2)) * env,
      isFront: Math.sin(spawnAngle) >= -0.15,
      isJade,
      color: isJade ? 0x10b981 : 0x38bdf8,
      coreColor: isJade ? 0xa7f3d0 : 0xe0f2fe,
    });
  }

  return {
    iceSwayX,
    iceLiftY,
    iceBreathWidth,
    jadeSwayX,
    jadeLiftY,
    jadeBreathWidth,
    orbitAngle,
    flowPulseA,
    flowPulseB,
    flowPulseC,
    plumeSwayX,
    plumeLiftY,
    facets,
    vaporPuffs,
  };
}

function cubicBezierPoint(
  t: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number
): { x: number; y: number } {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * x0 + 3 * uu * t * x1 + 3 * u * tt * x2 + ttt * x3,
    y: uuu * y0 + 3 * uu * t * y1 + 3 * u * tt * y2 + ttt * y3,
  };
}

function drawCondensationDiamondFacet(
  g: PIXI.Graphics,
  vx: number,
  vy: number,
  facet: HitenJadeCondensationFacetSample
): void {
  const rx = facet.rx * facet.scale;
  const ry = facet.ry * facet.scale;
  const cosT = Math.cos(facet.tiltRad);
  const sinT = Math.sin(facet.tiltRad);

  const topX = vx + sinT * ry;
  const topY = vy - cosT * ry;
  const rightX = vx + cosT * rx;
  const rightY = vy + sinT * rx;
  const botX = vx - sinT * ry;
  const botY = vy + cosT * ry;
  const leftX = vx - cosT * rx;
  const leftY = vy - sinT * rx;

  // Soft outer vapor condensation halo around each diamond facet
  g.circle(vx, vy, Math.max(rx, ry) * 1.2).fill({
    color: facet.fill,
    alpha: 0.24 * facet.alpha,
  });

  // Outer diamond body with crisp cel outline matching the character art
  g.moveTo(topX, topY)
    .lineTo(rightX, rightY)
    .lineTo(botX, botY)
    .lineTo(leftX, leftY)
    .closePath()
    .fill({ color: facet.fill, alpha: 0.94 * facet.alpha })
    .stroke({ color: 0x2d1e2f, width: 1.35, alpha: 0.9 * facet.alpha, join: 'round' });

  // Inner crystalline facet core
  const irx = rx * 0.54;
  const iry = ry * 0.54;
  g.moveTo(vx + sinT * iry, vy - cosT * iry)
    .lineTo(vx + cosT * irx, vy + sinT * irx)
    .lineTo(vx - sinT * iry, vy + cosT * iry)
    .lineTo(vx - cosT * irx, vy - sinT * irx)
    .closePath()
    .fill({ color: facet.core, alpha: 0.98 * facet.alpha });

  // High-grade 4-point star glint when condensation facet shimmers at peak phase
  if (facet.glintFactor > 0.05) {
    const glintLen = (ry + 2.4) * (0.65 + 0.55 * facet.glintFactor);
    const glintAlpha = 0.85 * facet.glintFactor * facet.alpha;
    g.moveTo(vx - glintLen, vy)
      .lineTo(vx + glintLen, vy)
      .moveTo(vx, vy - glintLen)
      .lineTo(vx, vy + glintLen)
      .stroke({
        color: 0xffffff,
        width: 1.35,
        alpha: glintAlpha,
        cap: 'round',
      });
  }
}

function drawVaporPuffAndWisp(
  g: PIXI.Graphics,
  hx: number,
  cy: number,
  puff: HitenJadeVaporPuffSample
): void {
  const px = hx + puff.dx;
  const py = cy + puff.dy;

  // Soft billowing water vapor cloud puff
  g.ellipse(px, py, puff.radiusX, puff.radiusY).fill({
    color: puff.color,
    alpha: puff.alpha * 0.55,
  });
  g.ellipse(px + puff.curlX * 0.22, py - 0.8, puff.radiusX * 0.62, puff.radiusY * 0.62).fill({
    color: puff.coreColor,
    alpha: puff.alpha * 0.72,
  });

  // Rising S-curve wispy steam tendril trailing upward from the vapor puff
  g.moveTo(px - puff.curlX * 0.35, py + puff.radiusY * 0.5)
    .quadraticCurveTo(
      px + puff.curlX * 0.65,
      py + puff.curlY * 0.45,
      px - puff.curlX * 0.25,
      py + puff.curlY
    )
    .stroke({
      color: puff.coreColor,
      width: 2.1,
      alpha: puff.alpha * 0.85,
      cap: 'round',
    });
}

/**
 * Hiten Jade persona aura renderer (Mist-Spring Dew Weaver of the Jade Sanctuary):
 * - No spinning mechanical orbs, no pulsing spheres on sprite, and no duplicate mouth rhombus.
 * - High-grade animated emerald-jade and glacier-blue crossing orbitals that revolve and wave around the hero.
 * - Orbiting crystalline diamond condensation facets travelling along the orbitals.
 * - Rising, billowing wispy water vapor clouds and steam tendrils.
 */
export class HerbalistFrierenPersonaRenderer implements PersonaRenderer {
  public readonly id = 'herbalist_frieren_strange';

  /**
   * Hiten Jade does not use a wooden staff; her hands channel living mist-spring dew.
   * The Herbalist's default wooden stick with hand is suppressed completely.
   */
  public readonly suppressDefaultWeapon = true;
  public readonly hasDefaultWeapon = false;

  /**
   * Weapon socket configuration when Hiten Jade equips the Garden Blade card.
   * Matches her frost-trimmed cerulean robe and porcelain skin.
   */
  public readonly weaponSocket: Partial<HeroWeaponSocket> = {
    sleeveColor: 0x0284c7, // Cerulean blue dress-robe
    cuffColor: 0xf8fafc,   // Snowy frost white cuff
    handColor: 0xffe4d6,   // Soft porcelain peach skin
    drawDefaultWeapon: undefined,
  };

  public drawAura(ctx: PersonaRenderContext): void {
    const { gUnder, gOver, hx, cy, groundY, elapsedSeconds, heroVx, heroVy } = ctx;
    const t = elapsedSeconds;
    const sample = computeHitenJadeAuraSample(t, heroVx, heroVy);

    // =========================================================================
    // 1. BACK ORBITAL ARCS & RISING WATER VAPOR MIST (gUnder - behind body)
    // =========================================================================

    // 1A. Back-hemisphere rising wispy water vapor puffs & steam tendrils
    for (const puff of sample.vaporPuffs) {
      if (!puff.isFront) {
        drawVaporPuffAndWisp(gUnder, hx, cy, puff);
      }
    }

    // 1B. Cyclic ascending mist wisp rings that rise from hem to crown behind the silhouette
    for (let m = 0; m < 4; m++) {
      const mPhase = ((t * 0.58 + m / 4) % 1 + 1) % 1;
      const env = Math.sin(mPhase * Math.PI);
      const my = groundY + 6 - mPhase * 36;
      const mHalfW = 17 + Math.sin(mPhase * Math.PI * 1.6 + m) * 7.5;
      const mWaveY = Math.sin(t * 3.8 + m * 1.9) * 3.8;
      const mColor = m % 2 === 0 ? 0x38bdf8 : 0x10b981;
      const mCore = m % 2 === 0 ? 0xe0f2fe : 0xa7f3d0;

      gUnder
        .moveTo(hx - mHalfW, my + 2)
        .quadraticCurveTo(hx + (m % 2 === 0 ? 6 : -6), my - 5.5 + mWaveY, hx + mHalfW, my - 1)
        .stroke({
          color: mColor,
          width: 5.8 * env,
          alpha: 0.34 * env,
          cap: 'round',
        });
      gUnder
        .moveTo(hx - mHalfW * 0.84, my + 1)
        .quadraticCurveTo(
          hx + (m % 2 === 0 ? 4.5 : -4.5),
          my - 4.8 + mWaveY,
          hx + mHalfW * 0.84,
          my - 0.5
        )
        .stroke({
          color: mCore,
          width: 2.2 * env,
          alpha: 0.72 * env,
          cap: 'round',
        });
    }

    // 1C. Back Helical Orbital Arcs (undulating counter-revolving orbital ribbons behind body)
    const bIceX0 = hx - 20 + sample.iceSwayX * 0.55;
    const bIceY0 = groundY + 6 + sample.iceLiftY * 0.45;
    const bIceX1 = hx - 31 - sample.iceSwayX * 0.95;
    const bIceY1 = cy + 7 + sample.iceLiftY * 0.85;
    const bIceX2 = hx + 31 + sample.iceSwayX * 0.95;
    const bIceY2 = cy - 3 - sample.iceLiftY * 0.85;
    const bIceX3 = hx + 20 - sample.iceSwayX * 0.55;
    const bIceY3 = cy - 16 + sample.iceLiftY * 0.5;

    const bJadeX0 = hx + 20 + sample.jadeSwayX * 0.55;
    const bJadeY0 = groundY + 5 + sample.jadeLiftY * 0.45;
    const bJadeX1 = hx + 30 - sample.jadeSwayX * 0.95;
    const bJadeY1 = cy + 5 + sample.jadeLiftY * 0.85;
    const bJadeX2 = hx - 30 + sample.jadeSwayX * 0.95;
    const bJadeY2 = cy - 5 - sample.jadeLiftY * 0.85;
    const bJadeX3 = hx - 20 - sample.jadeSwayX * 0.55;
    const bJadeY3 = cy - 17 + sample.jadeLiftY * 0.5;

    // Outer soft translucent vapor bands behind legs, torso, and shoulders
    gUnder
      .moveTo(bIceX0, bIceY0)
      .bezierCurveTo(bIceX1, bIceY1, bIceX2, bIceY2, bIceX3, bIceY3)
      .stroke({
        color: 0x38bdf8,
        width: 10.4 * sample.iceBreathWidth,
        alpha: 0.34,
        cap: 'round',
        join: 'round',
      });
    gUnder
      .moveTo(bJadeX0, bJadeY0)
      .bezierCurveTo(bJadeX1, bJadeY1, bJadeX2, bJadeY2, bJadeX3, bJadeY3)
      .stroke({
        color: 0x10b981,
        width: 10.0 * sample.jadeBreathWidth,
        alpha: 0.32,
        cap: 'round',
        join: 'round',
      });

    // Mid-layer sculpted back orbitals
    gUnder
      .moveTo(bIceX0 + 0.8, bIceY0)
      .bezierCurveTo(bIceX1 + 1.5, bIceY1, bIceX2 - 1.5, bIceY2, bIceX3 - 0.8, bIceY3)
      .stroke({
        color: 0x7dd3fc,
        width: 5.5 * sample.iceBreathWidth,
        alpha: 0.68,
        cap: 'round',
        join: 'round',
      });
    gUnder
      .moveTo(bJadeX0 - 0.8, bJadeY0)
      .bezierCurveTo(bJadeX1 - 1.5, bJadeY1, bJadeX2 + 1.5, bJadeY2, bJadeX3 + 0.8, bJadeY3)
      .stroke({
        color: 0x34d399,
        width: 5.3 * sample.jadeBreathWidth,
        alpha: 0.66,
        cap: 'round',
        join: 'round',
      });

    // Inner bright frost & jade core filaments on back orbitals
    gUnder
      .moveTo(bIceX0 + 1.2, bIceY0)
      .bezierCurveTo(bIceX1 + 2.0, bIceY1, bIceX2 - 2.0, bIceY2, bIceX3 - 1.0, bIceY3)
      .stroke({
        color: 0xe0f2fe,
        width: 2.2,
        alpha: 0.86,
        cap: 'round',
        join: 'round',
      });
    gUnder
      .moveTo(bJadeX0 - 1.2, bJadeY0)
      .bezierCurveTo(bJadeX1 - 2.0, bJadeY1, bJadeX2 + 2.0, bJadeY2, bJadeX3 + 1.0, bJadeY3)
      .stroke({
        color: 0xa7f3d0,
        width: 2.2,
        alpha: 0.86,
        cap: 'round',
        join: 'round',
      });

    // 1D. Animated Wispy Upper Vapor Plumes curling & unfurling behind left & right shoulders
    const lPlumeTipX = hx - 12 + sample.plumeSwayX;
    const lPlumeTipY = cy - 30 + sample.plumeLiftY;
    const lPlumeCtrl1X = hx - 28 - sample.plumeSwayX * 0.8;
    const lPlumeCtrl1Y = cy - 16 + sample.plumeLiftY * 0.6;
    const lPlumeCtrl2X = hx - 23 + sample.plumeSwayX * 0.95;
    const lPlumeCtrl2Y = cy - 27 - sample.plumeLiftY * 0.7;

    gUnder
      .moveTo(hx - 15, cy - 8)
      .bezierCurveTo(lPlumeCtrl1X, lPlumeCtrl1Y, lPlumeCtrl2X, lPlumeCtrl2Y, lPlumeTipX, lPlumeTipY)
      .stroke({ color: 0x38bdf8, width: 6.2 * sample.iceBreathWidth, alpha: 0.52, cap: 'round' });
    gUnder
      .moveTo(hx - 15, cy - 8)
      .bezierCurveTo(
        lPlumeCtrl1X + 1,
        lPlumeCtrl1Y,
        lPlumeCtrl2X + 1,
        lPlumeCtrl2Y + 1,
        lPlumeTipX,
        lPlumeTipY
      )
      .stroke({ color: 0xe0f2fe, width: 2.4, alpha: 0.9, cap: 'round' });

    const rPlumeTipX = hx + 12 - sample.plumeSwayX;
    const rPlumeTipY = cy - 30 - sample.plumeLiftY;
    const rPlumeCtrl1X = hx + 28 + sample.plumeSwayX * 0.8;
    const rPlumeCtrl1Y = cy - 16 - sample.plumeLiftY * 0.6;
    const rPlumeCtrl2X = hx + 23 - sample.plumeSwayX * 0.95;
    const rPlumeCtrl2Y = cy - 27 + sample.plumeLiftY * 0.7;

    gUnder
      .moveTo(hx + 15, cy - 8)
      .bezierCurveTo(rPlumeCtrl1X, rPlumeCtrl1Y, rPlumeCtrl2X, rPlumeCtrl2Y, rPlumeTipX, rPlumeTipY)
      .stroke({ color: 0x10b981, width: 6.2 * sample.jadeBreathWidth, alpha: 0.52, cap: 'round' });
    gUnder
      .moveTo(hx + 15, cy - 8)
      .bezierCurveTo(
        rPlumeCtrl1X - 1,
        rPlumeCtrl1Y,
        rPlumeCtrl2X - 1,
        rPlumeCtrl2Y + 1,
        rPlumeTipX,
        rPlumeTipY
      )
      .stroke({ color: 0xa7f3d0, width: 2.4, alpha: 0.9, cap: 'round' });

    // Render back-hemisphere orbiting diamond condensation facets on gUnder
    for (const facet of sample.facets) {
      if (!facet.isFront) {
        drawCondensationDiamondFacet(gUnder, hx + facet.dx, cy + facet.dy, facet);
      }
    }

    // =========================================================================
    // 2. FRONT CROSSING ORBITALS, FLOWING VAPOR STREAMS & FACETS (gOver)
    // =========================================================================

    // 2A. Right-to-Left / Lower-to-Upper Glacier-Blue Orbital Ribbon (indicated by right arrow)
    const fIceX0 = hx - 22 + sample.iceSwayX * 0.6;
    const fIceY0 = groundY + 4 + sample.iceLiftY * 0.55;
    const fIceX1 = hx - 9 + sample.iceSwayX * 0.95;
    const fIceY1 = groundY + 11 - sample.iceLiftY * 0.9;
    const fIceX2 = hx + 15 - sample.iceSwayX * 0.85;
    const fIceY2 = cy + 9 + sample.iceLiftY * 0.95;
    const fIceX3 = hx + 23 + sample.iceSwayX * 0.7;
    const fIceY3 = cy - 2 + sample.iceLiftY * 0.6;
    const fIceX4 = hx + 28 + sample.plumeSwayX * 0.8;
    const fIceY4 = cy - 8 + sample.iceLiftY * 0.5;
    const fIceX5 = hx + 21 - sample.plumeSwayX * 0.6;
    const fIceY5 = cy - 15 - sample.iceLiftY * 0.5;
    const fIceX6 = hx + 14 + sample.plumeSwayX * 0.45;
    const fIceY6 = cy - 19 + sample.plumeLiftY * 0.5;

    gOver
      .moveTo(fIceX0, fIceY0)
      .bezierCurveTo(fIceX1, fIceY1, fIceX2, fIceY2, fIceX3, fIceY3)
      .bezierCurveTo(fIceX4, fIceY4, fIceX5, fIceY5, fIceX6, fIceY6)
      .stroke({
        color: 0x0284c7,
        width: 10.5 * sample.iceBreathWidth,
        alpha: 0.34,
        cap: 'round',
        join: 'round',
      });
    gOver
      .moveTo(fIceX0, fIceY0)
      .bezierCurveTo(fIceX1, fIceY1, fIceX2, fIceY2, fIceX3, fIceY3)
      .bezierCurveTo(fIceX4, fIceY4, fIceX5, fIceY5, fIceX6, fIceY6)
      .stroke({
        color: 0x38bdf8,
        width: 5.8 * sample.iceBreathWidth,
        alpha: 0.82,
        cap: 'round',
        join: 'round',
      });
    gOver
      .moveTo(fIceX0 + 1.5, fIceY0)
      .bezierCurveTo(fIceX1 + 1, fIceY1 - 1, fIceX2 - 1, fIceY2 - 1, fIceX3 - 1, fIceY3)
      .bezierCurveTo(fIceX4 - 1.5, fIceY4 + 1, fIceX5 - 1, fIceY5 + 1, fIceX6, fIceY6)
      .stroke({
        color: 0xe0f2fe,
        width: 2.35,
        alpha: 0.96,
        cap: 'round',
        join: 'round',
      });

    // 2B. Left-to-Right / Upper-to-Lower Emerald-Jade Orbital Ribbon (indicated by left arrow)
    const fJadeX0 = hx + 22 + sample.jadeSwayX * 0.6;
    const fJadeY0 = groundY + 3 + sample.jadeLiftY * 0.55;
    const fJadeX1 = hx + 11 + sample.jadeSwayX * 0.95;
    const fJadeY1 = cy + 12 - sample.jadeLiftY * 0.9;
    const fJadeX2 = hx - 15 - sample.jadeSwayX * 0.85;
    const fJadeY2 = cy + 5 + sample.jadeLiftY * 0.95;
    const fJadeX3 = hx - 23 + sample.jadeSwayX * 0.7;
    const fJadeY3 = cy - 4 + sample.jadeLiftY * 0.6;
    const fJadeX4 = hx - 28 - sample.plumeSwayX * 0.8;
    const fJadeY4 = cy - 10 + sample.jadeLiftY * 0.5;
    const fJadeX5 = hx - 20 + sample.plumeSwayX * 0.6;
    const fJadeY5 = cy - 17 - sample.jadeLiftY * 0.5;
    const fJadeX6 = hx - 12 - sample.plumeSwayX * 0.45;
    const fJadeY6 = cy - 21 - sample.plumeLiftY * 0.5;

    gOver
      .moveTo(fJadeX0, fJadeY0)
      .bezierCurveTo(fJadeX1, fJadeY1, fJadeX2, fJadeY2, fJadeX3, fJadeY3)
      .bezierCurveTo(fJadeX4, fJadeY4, fJadeX5, fJadeY5, fJadeX6, fJadeY6)
      .stroke({
        color: 0x059669,
        width: 10.5 * sample.jadeBreathWidth,
        alpha: 0.34,
        cap: 'round',
        join: 'round',
      });
    gOver
      .moveTo(fJadeX0, fJadeY0)
      .bezierCurveTo(fJadeX1, fJadeY1, fJadeX2, fJadeY2, fJadeX3, fJadeY3)
      .bezierCurveTo(fJadeX4, fJadeY4, fJadeX5, fJadeY5, fJadeX6, fJadeY6)
      .stroke({
        color: 0x10b981,
        width: 5.8 * sample.jadeBreathWidth,
        alpha: 0.82,
        cap: 'round',
        join: 'round',
      });
    gOver
      .moveTo(fJadeX0 - 1.5, fJadeY0)
      .bezierCurveTo(fJadeX1 - 1, fJadeY1 - 1, fJadeX2 + 1, fJadeY2 - 1, fJadeX3 + 1, fJadeY3)
      .bezierCurveTo(fJadeX4 + 1.5, fJadeY4 + 1, fJadeX5 + 1, fJadeY5 + 1, fJadeX6, fJadeY6)
      .stroke({
        color: 0xa7f3d0,
        width: 2.35,
        alpha: 0.96,
        cap: 'round',
        join: 'round',
      });

    // 2C. Travelling Condensation Surge Waves racing along both Front Orbitals
    for (const rawPhase of [sample.flowPulseA, sample.flowPulseB, sample.flowPulseC]) {
      const surgeEnv = Math.sin(rawPhase * Math.PI);
      const tPrev = Math.max(0, rawPhase - 0.16);
      const tNext = Math.min(1, rawPhase + 0.16);

      const iceP0 = cubicBezierPoint(tPrev, fIceX0, fIceY0, fIceX1, fIceY1, fIceX2, fIceY2, fIceX3, fIceY3);
      const icePM = cubicBezierPoint(rawPhase, fIceX0, fIceY0, fIceX1, fIceY1, fIceX2, fIceY2, fIceX3, fIceY3);
      const iceP1 = cubicBezierPoint(tNext, fIceX0, fIceY0, fIceX1, fIceY1, fIceX2, fIceY2, fIceX3, fIceY3);

      gOver
        .moveTo(iceP0.x, iceP0.y)
        .quadraticCurveTo(icePM.x, icePM.y, iceP1.x, iceP1.y)
        .stroke({
          color: 0xffffff,
          width: 3.6 * surgeEnv,
          alpha: 0.88 * surgeEnv,
          cap: 'round',
        });

      const jadeP0 = cubicBezierPoint(tPrev, fJadeX0, fJadeY0, fJadeX1, fJadeY1, fJadeX2, fJadeY2, fJadeX3, fJadeY3);
      const jadePM = cubicBezierPoint(rawPhase, fJadeX0, fJadeY0, fJadeX1, fJadeY1, fJadeX2, fJadeY2, fJadeX3, fJadeY3);
      const jadeP1 = cubicBezierPoint(tNext, fJadeX0, fJadeY0, fJadeX1, fJadeY1, fJadeX2, fJadeY2, fJadeX3, fJadeY3);

      gOver
        .moveTo(jadeP0.x, jadeP0.y)
        .quadraticCurveTo(jadePM.x, jadePM.y, jadeP1.x, jadeP1.y)
        .stroke({
          color: 0xffffff,
          width: 3.6 * surgeEnv,
          alpha: 0.88 * surgeEnv,
          cap: 'round',
        });
    }

    // 2D. Secondary Wispy Intertwining Vapor Tendrils & Rising Front Vapor Puffs
    const lTendrilSway = Math.sin(t * 4.1 + 0.4) * 3.8;
    const rTendrilSway = Math.cos(t * 3.9 + 1.1) * 3.8;
    gOver
      .moveTo(hx - 23 + lTendrilSway * 0.4, cy + 4 + sample.iceLiftY * 0.45)
      .quadraticCurveTo(
        hx - 31 - lTendrilSway,
        cy - 5 + sample.jadeLiftY * 0.55,
        hx - 20 + lTendrilSway * 0.6,
        cy - 14 - sample.iceLiftY * 0.45
      )
      .stroke({
        color: 0x7dd3fc,
        width: 3.8 * sample.iceBreathWidth,
        alpha: 0.84,
        cap: 'round',
      });
    gOver
      .moveTo(hx + 23 + rTendrilSway * 0.4, cy + 3 + sample.jadeLiftY * 0.45)
      .quadraticCurveTo(
        hx + 31 - rTendrilSway,
        cy - 6 + sample.iceLiftY * 0.55,
        hx + 20 + rTendrilSway * 0.6,
        cy - 15 - sample.jadeLiftY * 0.45
      )
      .stroke({
        color: 0x6ee7b7,
        width: 3.8 * sample.jadeBreathWidth,
        alpha: 0.84,
        cap: 'round',
      });

    // Front-hemisphere rising wispy water vapor puffs & steam tendrils
    for (const puff of sample.vaporPuffs) {
      if (puff.isFront) {
        drawVaporPuffAndWisp(gOver, hx, cy, puff);
      }
    }

    // 2E. Render front-hemisphere orbiting diamond condensation facets on gOver
    for (const facet of sample.facets) {
      if (facet.isFront) {
        drawCondensationDiamondFacet(gOver, hx + facet.dx, cy + facet.dy, facet);
      }
    }
  }
}



