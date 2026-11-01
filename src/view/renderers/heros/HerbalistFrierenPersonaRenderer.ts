import * as PIXI from 'pixi.js';
import { clamp } from '../../../core/math/vec2';
import type { HeroWeaponSocket } from './GardenBladeAttachment';
import {
  drawProceduralHeroBody,
  HERO_CEL_PALETTES,
  type PersonaCelPalette,
} from './rig/CelHeroDrawer';
import type { HeroGaitStyle, HeroPose, HeroRigProportions } from './rig/HeroRigCore';
import type { PersonaRenderer, PersonaRenderContext } from './types';

export interface HitenJadeOrbitalSample {
  /** 0 = Jade Water stream, 1 = Crystalline Ice stream */
  streamIndex: 0 | 1;
  /** Head position of the orbital stream relative to (hx, cy) */
  headX: number;
  headY: number;
  /** Depth coordinate in [-1, 1]: < 0 is behind the hero (gUnder), >= 0 is in front (gOver) */
  depthZ: number;
  /** Scale multiplier from perspective depth (smaller behind, larger in front) */
  depthScale: number;
  /** Trail ribbon points from tail (index 0) to head (last index) relative to (hx, cy) */
  ribbonPoints: Array<{ x: number; y: number; z: number; alpha: number; width: number }>;
}

export interface HitenJadeFacetSample {
  x: number;
  y: number;
  dx: number;
  dy: number;
  z: number;
  isFront: boolean;
  rotation: number;
  scale: number;
  alpha: number;
  isIce: boolean;
}

export interface HitenJadeVaporPuffSample {
  x: number;
  y: number;
  dx: number;
  dy: number;
  isFront: boolean;
  radiusX: number;
  radiusY: number;
  alpha: number;
  color: number;
}

export interface HitenJadeAuraSample {
  iceSwayX: number;
  jadeSwayX: number;
  flowPulseA: number;
  orbitals: [HitenJadeOrbitalSample, HitenJadeOrbitalSample];
  facets: HitenJadeFacetSample[];
  vaporPuffs: HitenJadeVaporPuffSample[];
}

/**
 * Pure deterministic sampler for the Hiten Jade ('herbalist_frieren_strange')
 * Living Mist-Spring Dew Aura:
 * - Two counter-tilted 3D elliptical orbital streams (Jade Water & Crystalline Ice)
 *   that weave behind (`z < 0`) and in front of (`z >= 0`) the hero's body.
 * - 8 sparkling diamond condensation facets suspended along the orbital paths.
 * - 10 rising water-vapor puffs & steam tendrils that billow in front and behind.
 */
export function computeHitenJadeAuraSample(
  elapsedSeconds: number,
  heroVx = 0,
  heroVy = 0
): HitenJadeAuraSample {
  const rx = 20.5;
  const ry = 7.5;
  const tiltRad = 0.38; // ~22 deg tilted orbital planes
  const cosTilt = Math.cos(tiltRad);
  const sinTilt = Math.sin(tiltRad);

  const velDragX = clamp(-heroVx * 0.45, -6, 6);
  const velDragY = clamp(-heroVy * 0.45, -6, 6);

  const iceSwayX = Math.sin(elapsedSeconds * 2.4 + 0.8) * 3.8 + velDragX * 0.5;
  const jadeSwayX = Math.cos(elapsedSeconds * 2.1 - 0.4) * 3.8 + velDragX * 0.5;
  const flowPulseA = 0.5 + 0.5 * Math.sin(elapsedSeconds * 4.2);

  const buildOrbital = (streamIndex: 0 | 1): HitenJadeOrbitalSample => {
    const dir = streamIndex === 0 ? 1 : -1;
    const planeSign = streamIndex === 0 ? 1 : -1;
    const baseAngle =
      elapsedSeconds * 2.5 * dir + (streamIndex === 1 ? Math.PI * 0.65 : 0);
    const ribbonSegments = 9;
    const arcSpan = 1.35;
    const ribbonPoints: Array<{
      x: number;
      y: number;
      z: number;
      alpha: number;
      width: number;
    }> = [];

    for (let s = 0; s <= ribbonSegments; s++) {
      const frac = s / ribbonSegments; // 0 = tail, 1 = head
      const theta = baseAngle - dir * (1 - frac) * arcSpan;

      const rawX = Math.cos(theta) * rx;
      const rawY = Math.sin(theta) * ry;
      const z = Math.sin(theta);

      const rotX = rawX * cosTilt - rawY * (sinTilt * planeSign);
      const rotY = rawX * (sinTilt * planeSign) + rawY * cosTilt - 2.0;

      const tailFactor = 1 - frac;
      const px = rotX + velDragX * tailFactor;
      const py = rotY + velDragY * tailFactor;

      const depthScale = 0.82 + 0.24 * ((z + 1) * 0.5);
      ribbonPoints.push({
        x: px,
        y: py,
        z,
        alpha: (0.12 + 0.78 * Math.pow(frac, 1.4)) * (z < 0 ? 0.78 : 0.96),
        width: (1.0 + 3.4 * Math.pow(frac, 1.2)) * depthScale,
      });
    }

    const head = ribbonPoints[ribbonPoints.length - 1]!;
    const headDepthScale = 0.82 + 0.24 * ((head.z + 1) * 0.5);

    return {
      streamIndex,
      headX: head.x,
      headY: head.y,
      depthZ: head.z,
      depthScale: headDepthScale,
      ribbonPoints,
    };
  };

  const orbital0 = buildOrbital(0);
  const orbital1 = buildOrbital(1);

  // 8 diamond condensation facets orbiting full-circle between front and back hemispheres
  const facets: HitenJadeFacetSample[] = [];
  const facetCount = 8;
  for (let i = 0; i < facetCount; i++) {
    const phase = elapsedSeconds * 2.35 + (i * Math.PI * 2) / facetCount;
    const z = Math.sin(phase);
    const isFront = z >= 0;
    const bobY = Math.sin(elapsedSeconds * 3.1 + i * 1.7) * 2.4;
    const fx = Math.cos(phase) * (rx * 1.06) + velDragX * 0.35;
    const fy = z * (ry * 0.75) - 3.5 + bobY + velDragY * 0.35;
    const twinkle = 0.5 + 0.5 * Math.sin(elapsedSeconds * 5.4 + i * 2.1);

    facets.push({
      x: fx,
      y: fy,
      dx: fx,
      dy: fy,
      z,
      isFront,
      rotation: elapsedSeconds * (i % 2 === 0 ? 1.8 : -1.8) + i,
      scale: (0.65 + 0.45 * twinkle) * (z < 0 ? 0.82 : 1.05),
      alpha: (0.45 + 0.5 * twinkle) * (z < 0 ? 0.72 : 0.95),
      isIce: i % 2 === 1,
    });
  }

  // 10 rising wispy water vapor puffs & steam tendrils billowing both in front and behind
  const vaporPuffs: HitenJadeVaporPuffSample[] = [];
  const puffCount = 10;
  for (let p = 0; p < puffCount; p++) {
    const cycle = (elapsedSeconds * 0.75 + p / puffCount) % 1.0;
    const fade = Math.sin(cycle * Math.PI);
    const spreadAngle = (p * Math.PI * 2) / puffCount + elapsedSeconds * 0.4;
    const puffX =
      Math.cos(spreadAngle) * (9.5 + cycle * 5.0) + velDragX * cycle * 0.8;
    const puffY = 9.5 - cycle * 11.0 + velDragY * cycle * 0.5;
    const isFront = Math.sin(spreadAngle) >= 0;

    vaporPuffs.push({
      x: puffX,
      y: puffY,
      dx: puffX,
      dy: puffY,
      isFront,
      radiusX: 5.5 + cycle * 5.5,
      radiusY: 2.6 + cycle * 2.2,
      alpha: 0.32 * fade,
      color: p % 2 === 0 ? 0x6ee7b7 : 0xbae6fd,
    });
  }

  return {
    iceSwayX,
    jadeSwayX,
    flowPulseA,
    orbitals: [orbital0, orbital1],
    facets,
    vaporPuffs,
  };
}

/**
 * Hiten Jade ('herbalist_frieren_strange') Persona Renderer — Reference Implementation:
 * - Full procedural vector rig & cel-shaded body (`drawVectorBody`) with silver-white
 *   twin-tails driven by deterministic fixed-step spring physics, cerulean dress-robe,
 *   snowy frost capelet, and golden brooch.
 * - Suppresses the base Herbalist's wooden stick with hand (`suppressDefaultWeapon = true`).
 * - When Garden Blade is drafted, attaches the Garden Blade to her `handNear` socket
 *   with cerulean-blue mage sleeves and snowy frost cuffs.
 * - Surrounds Hiten Jade with a 3D depth-sorted Living Mist-Spring Dew Aura (`gUnder` & `gOver`).
 */
export class HerbalistFrierenPersonaRenderer implements PersonaRenderer {
  public readonly id = 'herbalist_frieren_strange';
  public readonly suppressDefaultWeapon = true;
  public readonly hasDefaultWeapon = false;
  public readonly palette: PersonaCelPalette =
    HERO_CEL_PALETTES.herbalist_frieren_strange!;
  public readonly gaitStyle: HeroGaitStyle = 'serene';
  public readonly rigProportions: Partial<HeroRigProportions> = {
    pelvisHeight: 10.8,
    torsoLength: 14.2,
    chestWidth: 12.6,
    hipWidth: 10.4,
    headRadius: 10.6,
    strideLength: 7.2,
    strideFrequency: 0.22,
    bobAmplitude: 1.35,
    leanMultiplier: 0.026,
  };

  /**
   * Custom weapon socket for Hiten Jade when she equips the Garden Blade:
   * - Uses her cerulean-blue dress sleeve (`0x0284c7`), snowy frost white cuff (`0xf8fafc`),
   *   and soft porcelain skin (`0xffe4d6`).
   * - `drawDefaultWeapon` is explicitly `undefined` so she NEVER carries the wooden stick.
   */
  public readonly weaponSocket: Partial<HeroWeaponSocket> = {
    handRestX: 12.5,
    handRestY: 4.8,
    socketX: 12.5,
    socketY: 4.8,
    shoulderX: 8.5,
    shoulderY: 0.8,
    sleeveColor: 0x0284c7,
    cuffColor: 0xf8fafc,
    handColor: 0xffe4d6,
    drawDefaultWeapon: undefined,
  };

  /**
   * Renders Hiten Jade's procedural cel-shaded vector body, twin-tails, and mage attire
   * without any sprites or negative scale mirroring.
   */
  public drawVectorBody(
    gUnder: PIXI.Graphics,
    gOver: PIXI.Graphics,
    pose: HeroPose,
    _elapsedSeconds: number
  ): void {
    drawProceduralHeroBody(
      gUnder,
      gOver,
      pose,
      this.palette,
      this.rigProportions.headRadius ?? 10.6
    );
  }

  public drawAura(ctx: PersonaRenderContext): void {
    const { gUnder, gOver, hx, cy, groundY, elapsedSeconds, heroVx, heroVy } = ctx;
    const sample = computeHitenJadeAuraSample(elapsedSeconds, heroVx, heroVy);

    // 1. Subtle Mist-Spring Ground Shimmer & Rising Vapor Puffs (depth-sorted between gUnder & gOver)
    const groundPulse = 0.85 + 0.15 * Math.sin(elapsedSeconds * 3.2);
    gUnder
      .ellipse(hx, groundY + 10.5, 17.5 * groundPulse, 7.2 * groundPulse)
      .fill({ color: 0x0d9488, alpha: 0.18 })
      .stroke({ color: 0x5eead4, width: 1.3, alpha: 0.42 });

    for (const puff of sample.vaporPuffs) {
      const targetG = puff.isFront ? gOver : gUnder;
      targetG
        .ellipse(hx + puff.x, cy + puff.y, puff.radiusX, puff.radiusY)
        .fill({ color: puff.color, alpha: puff.alpha });
    }

    // 2. Depth-Sorted 3D Crossing Orbital Ribbons (z < 0 -> gUnder, z >= 0 -> gOver)
    for (const orb of sample.orbitals) {
      const isJade = orb.streamIndex === 0;
      const outerColor = isJade ? 0x10b981 : 0x38bdf8;
      const innerColor = isJade ? 0x6ee7b7 : 0xbae6fd;
      const coreColor = 0xffffff;

      const pts = orb.ribbonPoints;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i]!;
        const p1 = pts[i + 1]!;
        const targetG = (p0.z + p1.z) * 0.5 < 0 ? gUnder : gOver;

        targetG
          .moveTo(hx + p0.x, cy + p0.y)
          .lineTo(hx + p1.x, cy + p1.y)
          .stroke({
            color: outerColor,
            width: p1.width * 1.45,
            alpha: p1.alpha * 0.52,
            cap: 'round',
          });

        targetG
          .moveTo(hx + p0.x, cy + p0.y)
          .lineTo(hx + p1.x, cy + p1.y)
          .stroke({
            color: innerColor,
            width: p1.width * 0.72,
            alpha: p1.alpha * 0.92,
            cap: 'round',
          });
      }

      // 3. Sculpted Teardrop Dew / Ice Droplet at the Head of Each Orbital Stream
      const headG = orb.depthZ < 0 ? gUnder : gOver;
      const dhx = hx + orb.headX;
      const dhy = cy + orb.headY;
      const r = 3.6 * orb.depthScale;

      headG
        .circle(dhx, dhy, r * 1.9)
        .fill({ color: innerColor, alpha: orb.depthZ < 0 ? 0.22 : 0.34 });

      headG
        .circle(dhx, dhy, r)
        .fill({ color: innerColor, alpha: 0.96 })
        .stroke({ color: 0x0f172a, width: 1.4, alpha: 0.85 });

      headG
        .circle(dhx - r * 0.3, dhy - r * 0.3, r * 0.42)
        .fill({ color: coreColor, alpha: 0.98 });
    }

    // 4. Sparkling Diamond Condensation Facets (depth-sorted between gUnder and gOver)
    for (const facet of sample.facets) {
      const targetG = facet.z < 0 ? gUnder : gOver;
      const fx = hx + facet.x;
      const fy = cy + facet.y;
      const s = 3.2 * facet.scale;
      const color = facet.isIce ? 0xe0f2fe : 0xa7f3d0;
      const rimColor = facet.isIce ? 0x38bdf8 : 0x10b981;

      const cosR = Math.cos(facet.rotation);
      const sinR = Math.sin(facet.rotation);
      const dx1 = cosR * s;
      const dy1 = sinR * s;
      const dx2 = -sinR * (s * 0.58);
      const dy2 = cosR * (s * 0.58);

      targetG
        .moveTo(fx + dx1, fy + dy1)
        .lineTo(fx + dx2, fy + dy2)
        .lineTo(fx - dx1, fy - dy1)
        .lineTo(fx - dx2, fy - dy2)
        .closePath()
        .fill({ color, alpha: facet.alpha })
        .stroke({ color: rimColor, width: 1.0, alpha: facet.alpha * 0.85 });
    }
  }
}
