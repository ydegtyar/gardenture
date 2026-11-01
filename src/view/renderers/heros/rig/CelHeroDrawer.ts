import * as PIXI from 'pixi.js';
import { clamp, lerp } from '../../../../core/math/vec2';
import type { HeroPose, SpringChain2D, Vec2 } from './HeroRigCore';

/**
 * ============================================================================
 * AAA CEL-SHADED VECTOR HERO & PERSONA PRIMITIVE RENDERER
 * ============================================================================
 * Renders any hero profession or Arcana persona entirely from PIXI.Graphics
 * vector primitives (circle, ellipse, rect, roundRect, poly, moveTo/lineTo/
 * bezierCurveTo/quadraticCurveTo, fill, stroke) with:
 * - Uniform dark cel outline (1.35 - 1.6 px, round joins & caps)
 * - Fixed world-space top-left lighting (highlights & shadows never flip!)
 * - Continuous facing redraw (near/far limb depth swap, asymmetric costume
 *   details, torso twist, head/gaze turn, zero negative scale mirroring)
 * - Expressive faces (Idle, Move, Dash, Attack, Cast, Hit, Dead + blink)
 * - Reactive ground contact shadow & status overlays (hit flash, dash blink,
 *   low-health crimson tell, sleeve cast glow)
 */

export interface PersonaCelPalette {
  id: string;
  /** Primary garment / tunic / armor base color */
  base: number;
  /** Cel shadow tone (fixed bottom-right world space) */
  shade: number;
  /** Cel highlight tone (fixed top-left world space) */
  highlight: number;
  /** Bright rim light on top-left world-facing edge */
  rim: number;
  /** Uniform cel-shaded dark outline color */
  outline: number;
  /** Secondary trim / cape / scarf / ribbon accent */
  accent: number;
  /** Secondary accent shade */
  accentShade: number;
  /** Magical / elemental glow color */
  glow: number;
  /** Skin base tone */
  skin: number;
  /** Skin shadow tone under chin / brim */
  skinShade: number;
  /** Hair / hood / helm primary color */
  hair: number;
  /** Hair highlight tone */
  hairHighlight: number;
  /** Boots / greaves color */
  boot: number;
  /** Left & right eye colors (supports heterochromia & mystic eyes) */
  eyeLeft: number;
  eyeRight: number;
  /** Costume archetype for procedural vector silhouette details */
  archetype:
    | 'warden_base'
    | 'warden_zagreus'
    | 'seeker_base'
    | 'seeker_hollow'
    | 'herbalist_base'
    | 'herbalist_hiten'
    | 'stormcaller_base'
    | 'stormcaller_gojo';
}

export const HERO_CEL_PALETTES: Record<string, PersonaCelPalette> = {
  warden: {
    id: 'warden',
    base: 0x16a34a,
    shade: 0x14532d,
    highlight: 0x4ade80,
    rim: 0xbbf7d0,
    outline: 0x1e1324,
    accent: 0xf59e0b,
    accentShade: 0xb45309,
    glow: 0x86efac,
    skin: 0xfed7aa,
    skinShade: 0xfbb696,
    hair: 0x78350f,
    hairHighlight: 0xb45309,
    boot: 0x451a03,
    eyeLeft: 0x1e1324,
    eyeRight: 0x1e1324,
    archetype: 'warden_base',
  },
  warden_zagreus_naruto: {
    id: 'warden_zagreus_naruto',
    base: 0x1e293b,
    shade: 0x0f172a,
    highlight: 0x475569,
    rim: 0xfde047,
    outline: 0x180e1e,
    accent: 0xef4444,
    accentShade: 0x991b1b,
    glow: 0xf97316,
    skin: 0xfed7aa,
    skinShade: 0xfca5a5,
    hair: 0x0f172a,
    hairHighlight: 0xfbbf24,
    boot: 0x7f1d1d,
    eyeLeft: 0xef4444,
    eyeRight: 0x22c55e,
    archetype: 'warden_zagreus',
  },
  seeker: {
    id: 'seeker',
    base: 0x059669,
    shade: 0x064e3b,
    highlight: 0x34d399,
    rim: 0xa7f3d0,
    outline: 0x1a1221,
    accent: 0xfacc15,
    accentShade: 0xca8a04,
    glow: 0x6ee7b7,
    skin: 0xfde68a,
    skinShade: 0xfcd34d,
    hair: 0x065f46,
    hairHighlight: 0x10b981,
    boot: 0x064e3b,
    eyeLeft: 0xfef08a,
    eyeRight: 0xfef08a,
    archetype: 'seeker_base',
  },
  seeker_hollow_levi: {
    id: 'seeker_hollow_levi',
    base: 0x1e293b,
    shade: 0x090d16,
    highlight: 0x475569,
    rim: 0xe2e8f0,
    outline: 0x0f0914,
    accent: 0x15803d,
    accentShade: 0x14532d,
    glow: 0x38bdf8,
    skin: 0xf8fafc,
    skinShade: 0xcbd5e1,
    hair: 0x0f172a,
    hairHighlight: 0x334155,
    boot: 0x0f172a,
    eyeLeft: 0x38bdf8,
    eyeRight: 0x38bdf8,
    archetype: 'seeker_hollow',
  },
  herbalist: {
    id: 'herbalist',
    base: 0x22c55e,
    shade: 0x15803d,
    highlight: 0x86efac,
    rim: 0xfffdf0,
    outline: 0x2a1a2e,
    accent: 0xf59e0b,
    accentShade: 0xd97706,
    glow: 0x5eead4,
    skin: 0xfed7aa,
    skinShade: 0xfbb696,
    hair: 0x78350f,
    hairHighlight: 0xb45309,
    boot: 0x78350f,
    eyeLeft: 0x2a1a2e,
    eyeRight: 0x2a1a2e,
    archetype: 'herbalist_base',
  },
  herbalist_frieren_strange: {
    id: 'herbalist_frieren_strange',
    base: 0xf8fafc,
    shade: 0xcbd5e1,
    highlight: 0xffffff,
    rim: 0xe0f2fe,
    outline: 0x1e1b2e,
    accent: 0x0284c7,
    accentShade: 0x0369a1,
    glow: 0x38bdf8,
    skin: 0xffe4d6,
    skinShade: 0xfecdd3,
    hair: 0xf1f5f9,
    hairHighlight: 0xffffff,
    boot: 0x475569,
    eyeLeft: 0x10b981,
    eyeRight: 0x38bdf8,
    archetype: 'herbalist_hiten',
  },
  stormcaller: {
    id: 'stormcaller',
    base: 0x0284c7,
    shade: 0x0c4a6e,
    highlight: 0x38bdf8,
    rim: 0xe0f2fe,
    outline: 0x171326,
    accent: 0xfacc15,
    accentShade: 0xca8a04,
    glow: 0x7dd3fc,
    skin: 0xfed7aa,
    skinShade: 0xfbb696,
    hair: 0xe0f2fe,
    hairHighlight: 0xffffff,
    boot: 0x1e293b,
    eyeLeft: 0x38bdf8,
    eyeRight: 0x38bdf8,
    archetype: 'stormcaller_base',
  },
  stormcaller_gojo_killua: {
    id: 'stormcaller_gojo_killua',
    base: 0x1e1b4b,
    shade: 0x0f172a,
    highlight: 0x312e81,
    rim: 0x7dd3fc,
    outline: 0x0f0a1c,
    accent: 0x38bdf8,
    accentShade: 0x0284c7,
    glow: 0x38bdf8,
    skin: 0xffe4d6,
    skinShade: 0xfecdd3,
    hair: 0xf8fafc,
    hairHighlight: 0xffffff,
    boot: 0x0f172a,
    eyeLeft: 0x38bdf8,
    eyeRight: 0x38bdf8,
    archetype: 'stormcaller_gojo',
  },
};

export function resolveHeroCelPalette(
  professionId: string,
  personaId?: string | null
): PersonaCelPalette {
  if (personaId && HERO_CEL_PALETTES[personaId]) {
    return HERO_CEL_PALETTES[personaId]!;
  }
  return HERO_CEL_PALETTES[professionId] ?? HERO_CEL_PALETTES.warden!;
}

/**
 * Fixed world-space light direction (top-left of screen):
 * Highlights and rim lights are ALWAYS placed on the (-X, -Y) side in world space,
 * and shade tones on the (+X, +Y) side, regardless of which direction the hero faces.
 */
export const WORLD_LIGHT_DIR = {
  x: -0.7071,
  y: -0.7071,
} as const;

export const CEL_OUTLINE_WIDTH = 1.45;

/**
 * Draws the reactive soft ground contact shadow ellipse beneath the hero.
 * Shrinks and softens as `liftHeight` increases (during dash/levitation) and
 * widens slightly during downward squash.
 */
export function drawReactiveGroundShadow(
  gUnder: PIXI.Graphics,
  pose: HeroPose
): void {
  const heightAtten = clamp(1 - pose.liftHeight / 28, 0.42, 1.0);
  const rx = 14.5 * pose.scaleX * heightAtten;
  const ry = 6.2 * heightAtten;
  const alpha = 0.34 * heightAtten;

  gUnder
    .ellipse(pose.rootX, pose.rootY, rx * 1.18, ry * 1.18)
    .fill({ color: 0x090612, alpha: alpha * 0.45 });
  gUnder
    .ellipse(pose.rootX, pose.rootY, rx, ry)
    .fill({ color: 0x090612, alpha });
}

/**
 * Draws a 2-bone articulated limb (thigh+shin+boot or upperArm+forearm+hand)
 * with cel-shaded base, fixed world-space rim highlight, and uniform dark outline.
 */
function drawArticulatedLeg(
  g: PIXI.Graphics,
  hip: Vec2,
  knee: Vec2,
  foot: Vec2,
  facing: number,
  palette: PersonaCelPalette,
  isFar: boolean
): void {
  const legColor = isFar ? palette.shade : palette.base;
  const bootColor = palette.boot;

  // Uniform dark cel outline
  g.moveTo(hip.x, hip.y)
    .lineTo(knee.x, knee.y)
    .lineTo(foot.x, foot.y)
    .stroke({
      color: palette.outline,
      width: 5.8 + CEL_OUTLINE_WIDTH,
      cap: 'round',
      join: 'round',
    });

  // Base fill stroke
  g.moveTo(hip.x, hip.y)
    .lineTo(knee.x, knee.y)
    .lineTo(foot.x, foot.y)
    .stroke({
      color: legColor,
      width: 3.6,
      cap: 'round',
      join: 'round',
    });

  // Fixed world-space top-left highlight edge (never flips!)
  if (!isFar) {
    g.moveTo(hip.x - 0.8, hip.y - 0.5)
      .lineTo(knee.x - 0.8, knee.y - 0.5)
      .stroke({
        color: palette.highlight,
        width: 1.1,
        alpha: 0.75,
        cap: 'round',
      });
  }

  // Sculpted boot with toe oriented by continuous facing
  const toeShift = facing * 1.8;
  g.ellipse(foot.x + toeShift, foot.y, 4.3, 2.7)
    .fill({ color: bootColor })
    .stroke({
      color: palette.outline,
      width: CEL_OUTLINE_WIDTH * 1.15,
      join: 'round',
    });

  // Fixed top-left boot specular highlight
  g.ellipse(foot.x + toeShift - 1.1, foot.y - 0.8, 1.8, 0.9).fill({
    color: palette.rim,
    alpha: isFar ? 0.25 : 0.45,
  });
}

function drawArticulatedArm(
  g: PIXI.Graphics,
  shoulder: Vec2,
  elbow: Vec2,
  hand: Vec2,
  palette: PersonaCelPalette,
  isFar: boolean,
  sleeveGlow = 0
): void {
  const sleeveColor = isFar ? palette.shade : palette.base;

  // Uniform dark cel outline
  g.moveTo(shoulder.x, shoulder.y)
    .lineTo(elbow.x, elbow.y)
    .lineTo(hand.x, hand.y)
    .stroke({
      color: palette.outline,
      width: 5.4 + CEL_OUTLINE_WIDTH,
      cap: 'round',
      join: 'round',
    });

  // Upper & lower sleeve
  g.moveTo(shoulder.x, shoulder.y)
    .lineTo(elbow.x, elbow.y)
    .lineTo(hand.x, hand.y)
    .stroke({
      color: sleeveColor,
      width: 3.3,
      cap: 'round',
      join: 'round',
    });

  // Cuff accent near wrist
  const cuffX = lerp(elbow.x, hand.x, 0.78);
  const cuffY = lerp(elbow.y, hand.y, 0.78);
  g.circle(cuffX, cuffY, 2.1).fill({ color: palette.accent });

  // Sleeve cast glow when channeling Chain Lightning or spells
  if (sleeveGlow > 0.02) {
    g.moveTo(elbow.x, elbow.y)
      .lineTo(hand.x, hand.y)
      .stroke({
        color: palette.glow,
        width: 4.5,
        alpha: sleeveGlow * 0.65,
        cap: 'round',
      });
  }

  // Hand sphere with cel outline
  g.circle(hand.x, hand.y, 2.8)
    .fill({ color: palette.skin })
    .stroke({
      color: palette.outline,
      width: CEL_OUTLINE_WIDTH,
      join: 'round',
    });

  // Fixed world-space top-left highlight on hand
  g.circle(hand.x - 0.8, hand.y - 0.8, 0.9).fill({
    color: 0xffffff,
    alpha: 0.55,
  });
}

/**
 * Draws a spring-driven cape, scarf, or twin-tail ribbon polygon with cel shading.
 */
function drawSpringRibbon(
  g: PIXI.Graphics,
  chain: SpringChain2D,
  baseWidth: number,
  tipWidth: number,
  fillColor: number,
  shadeColor: number,
  outlineColor: number
): void {
  const nodes = chain.nodes;
  if (nodes.length < 2) return;

  const leftPts: Vec2[] = [];
  const rightPts: Vec2[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const cur = nodes[i]!;
    const prev = nodes[Math.max(0, i - 1)]!;
    const next = nodes[Math.min(nodes.length - 1, i + 1)]!;
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;
    const t = i / (nodes.length - 1);
    const halfW = lerp(baseWidth, tipWidth, t) * 0.5;
    leftPts.push({ x: cur.x + nx * halfW, y: cur.y + ny * halfW });
    rightPts.push({ x: cur.x - nx * halfW, y: cur.y - ny * halfW });
  }

  g.moveTo(leftPts[0]!.x, leftPts[0]!.y);
  for (let i = 1; i < leftPts.length; i++) {
    g.lineTo(leftPts[i]!.x, leftPts[i]!.y);
  }
  for (let i = rightPts.length - 1; i >= 0; i--) {
    g.lineTo(rightPts[i]!.x, rightPts[i]!.y);
  }
  g.closePath()
    .fill({ color: fillColor })
    .stroke({
      color: outlineColor,
      width: CEL_OUTLINE_WIDTH,
      join: 'round',
      cap: 'round',
    });

  // Fixed world-space bottom-right shade strip along right edge
  if (rightPts.length >= 2) {
    g.moveTo(rightPts[0]!.x, rightPts[0]!.y);
    for (let i = 1; i < rightPts.length; i++) {
      g.lineTo(rightPts[i]!.x, rightPts[i]!.y);
    }
    g.stroke({
      color: shadeColor,
      width: 1.4,
      alpha: 0.65,
      cap: 'round',
    });
  }
}

/**
 * Draws the hero's torso, tunic/robe hem, asymmetric sash/satchel, and collar
 * driven by `pose.facing` and `pose.torsoTwist`, with fixed top-left world lighting.
 */
function drawCelTorsoAndCostume(
  gUnder: PIXI.Graphics,
  gOver: PIXI.Graphics,
  pose: HeroPose,
  palette: PersonaCelPalette
): void {
  const { rig, facing, torsoTwist, secondary, lodLevel } = pose;

  // 1. Far-side Cape / Scarf / Twin-tails behind body (on gUnder)
  if (
    palette.archetype === 'warden_base' ||
    palette.archetype === 'warden_zagreus' ||
    palette.archetype === 'seeker_base' ||
    palette.archetype === 'seeker_hollow' ||
    palette.archetype === 'stormcaller_base'
  ) {
    drawSpringRibbon(
      gUnder,
      secondary.cape,
      9.5,
      4.2,
      palette.accent,
      palette.accentShade,
      palette.outline
    );
  }

  // Hiten Jade / Frieren long silver-white twin-tails driven by spring physics
  if (palette.archetype === 'herbalist_hiten') {
    const leftG = facing >= 0 ? gUnder : gOver;
    const rightG = facing >= 0 ? gOver : gUnder;
    drawSpringRibbon(
      leftG,
      secondary.hairLeft,
      5.6,
      2.2,
      palette.hair,
      palette.shade,
      palette.outline
    );
    drawSpringRibbon(
      rightG,
      secondary.hairRight,
      5.6,
      2.2,
      palette.hair,
      palette.shade,
      palette.outline
    );
  }

  // 2. Torso Block (trapezoid from neck/shoulders down to pelvis/robe hem)
  const topW = 7.4 * pose.scaleX;
  const botW =
    (palette.archetype === 'herbalist_hiten' ||
    palette.archetype === 'herbalist_base' ||
    palette.archetype === 'stormcaller_base'
      ? 9.2
      : 6.4) * pose.scaleX;

  const hemNode = secondary.robeHem.nodes[1] ?? rig.pelvis;
  const hemSwayX = (hemNode.x - rig.pelvis.x) * 0.45;

  const tlX = rig.neck.x - topW + torsoTwist * 0.8;
  const tlY = rig.neck.y + 0.5;
  const trX = rig.neck.x + topW + torsoTwist * 0.8;
  const trY = rig.neck.y + 0.5;
  const brX = rig.pelvis.x + botW + hemSwayX;
  const brY = rig.pelvis.y + 3.2;
  const blX = rig.pelvis.x - botW + hemSwayX;
  const blY = rig.pelvis.y + 3.2;

  // Base torso polygon
  gOver
    .moveTo(tlX, tlY)
    .lineTo(trX, trY)
    .quadraticCurveTo(brX + 0.8, (trY + brY) * 0.5, brX, brY)
    .quadraticCurveTo(rig.pelvis.x + hemSwayX, brY + 2.2, blX, blY)
    .quadraticCurveTo(blX - 0.8, (tlY + blY) * 0.5, tlX, tlY)
    .closePath()
    .fill({ color: palette.base })
    .stroke({
      color: palette.outline,
      width: CEL_OUTLINE_WIDTH,
      join: 'round',
    });

  // Fixed world-space bottom-right cel shade band (never flips when facing changes!)
  gOver
    .moveTo(lerp(tlX, trX, 0.58), tlY + 1.0)
    .lineTo(trX - 0.6, trY + 1.0)
    .lineTo(brX - 0.8, brY - 0.5)
    .lineTo(lerp(blX, brX, 0.45), brY + 0.5)
    .closePath()
    .fill({ color: palette.shade, alpha: 0.72 });

  // Fixed world-space top-left rim light stroke
  gOver
    .moveTo(tlX + 1.0, brY - 2.0)
    .lineTo(tlX + 0.8, tlY + 1.2)
    .lineTo(lerp(tlX, trX, 0.45), tlY + 0.8)
    .stroke({
      color: palette.rim,
      width: 1.3,
      alpha: 0.82,
      cap: 'round',
      join: 'round',
    });

  // 3. Asymmetric Center Panel / Tabard / Jacket Lapel shifted by continuous `facing`
  const centerShiftX = facing * 2.4 + torsoTwist * 1.2;
  const panelTopX = rig.neck.x + centerShiftX;
  const panelBotX = rig.pelvis.x + centerShiftX * 0.85 + hemSwayX * 0.6;

  if (palette.archetype === 'herbalist_hiten') {
    // Cerulean blue dress-robe under white mage capelet with gold trim
    gOver
      .moveTo(panelTopX - 3.6, tlY + 4.5)
      .lineTo(panelTopX + 3.6, tlY + 4.5)
      .lineTo(panelBotX + 5.2, brY + 0.5)
      .lineTo(panelBotX - 5.2, brY + 0.5)
      .closePath()
      .fill({ color: palette.accent })
      .stroke({ color: palette.outline, width: 1.1, join: 'round' });

    // White & gold mage capelet over shoulders
    gOver
      .moveTo(tlX - 1.2, tlY + 0.5)
      .quadraticCurveTo(panelTopX, tlY + 7.2, trX + 1.2, trY + 0.5)
      .lineTo(trX - 0.5, trY - 1.2)
      .quadraticCurveTo(panelTopX, tlY + 1.5, tlX + 0.5, tlY - 1.2)
      .closePath()
      .fill({ color: palette.base })
      .stroke({ color: palette.outline, width: CEL_OUTLINE_WIDTH, join: 'round' });

    // Golden clasp brooch at chest center (shifted by facing)
    gOver
      .circle(panelTopX, tlY + 3.4, 2.1)
      .fill({ color: 0xfbbf24 })
      .stroke({ color: palette.outline, width: 1.1 });
  } else if (palette.archetype === 'herbalist_base') {
    // Light mint center apron panel + white curved shoulder trim
    gOver
      .roundRect(panelTopX - 3.8, tlY + 1.5, 7.6, brY - tlY - 3.0, 2.5)
      .fill({ color: palette.highlight });
    // Asymmetric herb satchel on hip
    const satchelX = rig.pelvis.x - facing * 5.2;
    const satchelY = rig.pelvis.y + 0.8;
    gOver
      .roundRect(satchelX - 2.8, satchelY - 2.2, 5.6, 4.6, 1.6)
      .fill({ color: 0xb45309 })
      .stroke({ color: palette.outline, width: 1.2 });
  } else if (
    palette.archetype === 'warden_base' ||
    palette.archetype === 'warden_zagreus'
  ) {
    // Diagonal chest strap + asymmetric shoulder pauldron on near shoulder
    gOver
      .moveTo(tlX + 1.5, tlY + 1.0)
      .lineTo(brX - 1.5, brY - 2.0)
      .stroke({ color: palette.accent, width: 2.6, cap: 'round' });

    const pauldronX = rig.shoulderNear.x - facing * 1.2;
    const pauldronY = rig.shoulderNear.y - 0.5;
    gOver
      .ellipse(pauldronX, pauldronY, 4.6, 3.2)
      .fill({ color: palette.accent })
      .stroke({ color: palette.outline, width: CEL_OUTLINE_WIDTH });
  } else if (
    palette.archetype === 'seeker_base' ||
    palette.archetype === 'seeker_hollow'
  ) {
    // Scout survey mantle & crisp V-collar
    gOver
      .moveTo(tlX - 0.8, tlY)
      .lineTo(panelTopX, tlY + 6.8)
      .lineTo(trX + 0.8, trY)
      .closePath()
      .fill({ color: palette.accent })
      .stroke({ color: palette.outline, width: 1.2, join: 'round' });
  } else if (
    palette.archetype === 'stormcaller_base' ||
    palette.archetype === 'stormcaller_gojo'
  ) {
    // High arcane collar with glowing lightning trim
    gOver
      .roundRect(rig.neck.x - 5.2, rig.neck.y - 2.8, 10.4, 4.4, 1.8)
      .fill({ color: palette.base })
      .stroke({ color: palette.outline, width: CEL_OUTLINE_WIDTH });
    gOver
      .moveTo(panelTopX, tlY + 2.0)
      .lineTo(panelBotX, brY - 1.5)
      .stroke({ color: palette.accent, width: 1.8, cap: 'round' });
  }

  // 4. Belt & Spring-Driven Waist Sash (when LOD == 0)
  gOver
    .moveTo(blX + 0.8, rig.pelvis.y - 0.5)
    .lineTo(brX - 0.8, rig.pelvis.y - 0.5)
    .stroke({ color: palette.outline, width: 2.8, cap: 'round' });
  gOver
    .circle(panelBotX, rig.pelvis.y - 0.5, 2.0)
    .fill({ color: palette.accent })
    .stroke({ color: palette.outline, width: 1.1 });

  if (lodLevel === 0) {
    drawSpringRibbon(
      gOver,
      secondary.sash,
      3.4,
      1.6,
      palette.accent,
      palette.accentShade,
      palette.outline
    );
  }
}

/**
 * Draws the hero's head, hair/headgear, and expressive cel-shaded face
 * driven by `pose.facing`, `pose.headGazeX/Y`, `pose.actionState`, and `pose.blinkAmount`.
 */
function drawCelHeadAndFace(
  gOver: PIXI.Graphics,
  pose: HeroPose,
  palette: PersonaCelPalette,
  headRadius = 10.4
): void {
  const { rig, facing, headGazeX, headGazeY, actionState, blinkAmount } = pose;
  const hx = rig.head.x;
  const hy = rig.head.y;
  const rx = headRadius * pose.scaleX;
  const ry = headRadius * pose.scaleY;

  // 1. Elf ears for Hiten Jade (positioned asymmetrically by facing)
  if (palette.archetype === 'herbalist_hiten') {
    const leftEarX = hx - rx * (0.95 - facing * 0.12);
    const rightEarX = hx + rx * (0.95 + facing * 0.12);
    const earY = hy + 0.8;

    gOver
      .moveTo(leftEarX + 1.5, earY - 2.0)
      .lineTo(leftEarX - 4.8, earY - 0.8)
      .lineTo(leftEarX + 1.5, earY + 2.0)
      .closePath()
      .fill({ color: palette.skin })
      .stroke({ color: palette.outline, width: 1.2, join: 'round' });

    gOver
      .moveTo(rightEarX - 1.5, earY - 2.0)
      .lineTo(rightEarX + 4.8, earY - 0.8)
      .lineTo(rightEarX - 1.5, earY + 2.0)
      .closePath()
      .fill({ color: palette.skin })
      .stroke({ color: palette.outline, width: 1.2, join: 'round' });
  }

  // 2. Head Base Sphere with Fixed World-Space Cel Shade & Rim Light
  gOver
    .ellipse(hx, hy, rx, ry)
    .fill({ color: palette.skin })
    .stroke({
      color: palette.outline,
      width: CEL_OUTLINE_WIDTH,
      join: 'round',
    });

  // Chin / right-side cel shadow crescent (fixed world-space bottom-right)
  const shadeArcR = rx * 0.92;
  const shadeArcStart = 0.15;
  gOver
    .moveTo(
      hx + Math.cos(shadeArcStart) * shadeArcR,
      hy + Math.sin(shadeArcStart) * shadeArcR
    )
    .arc(hx, hy, shadeArcR, shadeArcStart, Math.PI * 0.78)
    .stroke({
      color: palette.skinShade,
      width: 2.2,
      alpha: 0.75,
      cap: 'round',
    });

  // 3. Expressive Face (shifted smoothly by `headGazeX` and `headGazeY` without mirroring!)
  const faceCenterX = hx + headGazeX;
  const faceCenterY = hy + headGazeY + 1.2;
  // Perspective foreshortening compresses the far-side eye distance slightly in 3/4 view
  const eyeSpread = 3.9;
  const leftEyeX = faceCenterX - eyeSpread * (1 - Math.max(0, facing) * 0.18);
  const rightEyeX = faceCenterX + eyeSpread * (1 - Math.max(0, -facing) * 0.18);
  const eyeY = faceCenterY - 0.5;

  // Rosy cheek blush
  gOver
    .ellipse(leftEyeX - 1.4, eyeY + 2.6, 1.9, 1.0)
    .fill({ color: 0xf472b6, alpha: 0.45 });
  gOver
    .ellipse(rightEyeX + 1.4, eyeY + 2.6, 1.9, 1.0)
    .fill({ color: 0xf472b6, alpha: 0.45 });

  // Eyes: Dead ('X'), Blink/Hit ('> <' or closed arc), or Open with catchlight
  if (actionState === 'Dead') {
    for (const ex of [leftEyeX, rightEyeX]) {
      gOver
        .moveTo(ex - 1.6, eyeY - 1.6)
        .lineTo(ex + 1.6, eyeY + 1.6)
        .moveTo(ex + 1.6, eyeY - 1.6)
        .lineTo(ex - 1.6, eyeY + 1.6)
        .stroke({ color: palette.outline, width: 1.5, cap: 'round' });
    }
  } else if (actionState === 'Hit') {
    // Tightly wincing '> <' eyes on hit
    gOver
      .moveTo(leftEyeX - 1.8, eyeY - 1.2)
      .lineTo(leftEyeX + 1.2, eyeY)
      .lineTo(leftEyeX - 1.8, eyeY + 1.2)
      .moveTo(rightEyeX + 1.8, eyeY - 1.2)
      .lineTo(rightEyeX - 1.2, eyeY)
      .lineTo(rightEyeX + 1.8, eyeY + 1.2)
      .stroke({ color: palette.outline, width: 1.6, cap: 'round', join: 'round' });
  } else if (blinkAmount > 0.5) {
    // Closed peaceful eyelid arcs during spontaneous blink
    gOver
      .moveTo(leftEyeX - 1.9, eyeY)
      .quadraticCurveTo(leftEyeX, eyeY + 1.3, leftEyeX + 1.9, eyeY)
      .moveTo(rightEyeX - 1.9, eyeY)
      .quadraticCurveTo(rightEyeX, eyeY + 1.3, rightEyeX + 1.9, eyeY)
      .stroke({ color: palette.outline, width: 1.6, cap: 'round' });
  } else {
    const eyeH = actionState === 'Attack' || actionState === 'Dash' ? 1.65 : 2.05;
    // Left eye
    gOver
      .ellipse(leftEyeX, eyeY, 1.55, eyeH)
      .fill({ color: palette.eyeLeft })
      .stroke({ color: palette.outline, width: 0.9 });
    // Fixed top-left white specular catchlight
    gOver.circle(leftEyeX - 0.55, eyeY - 0.65, 0.62).fill({ color: 0xffffff });

    // Right eye
    gOver
      .ellipse(rightEyeX, eyeY, 1.55, eyeH)
      .fill({ color: palette.eyeRight })
      .stroke({ color: palette.outline, width: 0.9 });
    gOver.circle(rightEyeX - 0.55, eyeY - 0.65, 0.62).fill({ color: 0xffffff });
  }

  // Expressive Brows (angled for Attack/Dash/Hit, raised for Cast, relaxed for Idle/Move)
  const browSlant =
    actionState === 'Attack' || actionState === 'Dash'
      ? 1.15
      : actionState === 'Cast'
        ? -0.65
        : actionState === 'Hit'
          ? 1.35
          : 0.0;
  gOver
    .moveTo(leftEyeX - 2.0, eyeY - 3.0 - browSlant * 0.5)
    .lineTo(leftEyeX + 1.6, eyeY - 3.0 + browSlant)
    .moveTo(rightEyeX - 1.6, eyeY - 3.0 + browSlant)
    .lineTo(rightEyeX + 2.0, eyeY - 3.0 - browSlant * 0.5)
    .stroke({ color: palette.outline, width: 1.4, cap: 'round' });

  // Expressive Mouth (determined grit in Attack, open chant in Cast, small smile in Idle)
  const mouthY = faceCenterY + 3.1;
  if (actionState === 'Attack' || actionState === 'Cast') {
    gOver
      .ellipse(faceCenterX, mouthY, 1.4, 1.1)
      .fill({ color: 0x9f1239 })
      .stroke({ color: palette.outline, width: 1.0 });
  } else if (actionState === 'Hit') {
    gOver
      .moveTo(faceCenterX - 1.6, mouthY + 0.5)
      .quadraticCurveTo(faceCenterX, mouthY - 0.8, faceCenterX + 1.6, mouthY + 0.5)
      .stroke({ color: palette.outline, width: 1.2, cap: 'round' });
  } else {
    gOver
      .moveTo(faceCenterX - 1.3, mouthY - 0.2)
      .quadraticCurveTo(faceCenterX, mouthY + 0.9, faceCenterX + 1.3, mouthY - 0.2)
      .stroke({ color: palette.outline, width: 1.15, cap: 'round' });
  }

  // 4. Hair Bangs & Profession/Persona Headgear (tilted and shifted by continuous `facing`)
  const hatTilt = -facing * 1.4 + pose.headTilt * 8.0;

  if (palette.archetype === 'herbalist_base') {
    // Wide Straw Sun-Hat with golden cloche dome, green ribbon band, and asymmetric pink daisy
    const brimY = hy - ry * 0.58;
    // Golden dome
    gOver
      .moveTo(hx - 10.5, brimY)
      .quadraticCurveTo(hx + hatTilt * 0.5, brimY - 13.5, hx + 10.5, brimY)
      .closePath()
      .fill({ color: palette.accent })
      .stroke({ color: palette.outline, width: CEL_OUTLINE_WIDTH, join: 'round' });

    // Wide straw brim
    gOver
      .ellipse(hx + hatTilt * 0.35, brimY, 19.5, 5.8)
      .fill({ color: 0xfef08a })
      .stroke({ color: palette.outline, width: CEL_OUTLINE_WIDTH, join: 'round' });

    // Green ribbon band
    gOver
      .moveTo(hx - 10.2, brimY - 0.6)
      .quadraticCurveTo(hx, brimY + 1.4, hx + 10.2, brimY - 0.6)
      .stroke({ color: 0x10b981, width: 2.8, cap: 'round' });

    // Asymmetric pink daisy on the far side of the hat band
    const fx = hx + facing * 8.2;
    const fy = brimY - 2.2;
    for (let p = 0; p < 5; p++) {
      const a = (p * Math.PI * 2) / 5;
      gOver
        .circle(fx + Math.cos(a) * 2.4, fy + Math.sin(a) * 2.4, 1.8)
        .fill({ color: 0xf472b6 })
        .stroke({ color: palette.outline, width: 1.0 });
    }
    gOver.circle(fx, fy, 1.4).fill({ color: 0xf59e0b });
  } else if (palette.archetype === 'herbalist_hiten') {
    // Silver-white parted bangs framing the face + delicate jade-frost hairpin on side
    gOver
      .moveTo(hx - rx, hy - 1.5)
      .quadraticCurveTo(hx - rx * 0.5, hy - ry * 1.15, hx + facing * 1.5, hy - ry * 0.95)
      .quadraticCurveTo(hx + rx * 0.5, hy - ry * 1.15, hx + rx, hy - 1.5)
      .quadraticCurveTo(hx + facing * 2.0, hy - ry * 0.35, hx - rx, hy - 1.5)
      .closePath()
      .fill({ color: palette.hair })
      .stroke({ color: palette.outline, width: CEL_OUTLINE_WIDTH, join: 'round' });

    // Fixed world-space top-left hair sheen arc
    gOver
      .moveTo(hx - rx * 0.65, hy - ry * 0.65)
      .quadraticCurveTo(hx - 1.0, hy - ry * 0.9, hx + 2.5, hy - ry * 0.65)
      .stroke({ color: palette.hairHighlight, width: 1.4, alpha: 0.9, cap: 'round' });
  } else if (palette.archetype === 'stormcaller_base') {
    // Pointed Arcane Storm-Wizard Hat with golden lightning crest
    const brimY = hy - ry * 0.55;
    const tipX = hx - facing * 4.5 + hatTilt;
    const tipY = brimY - 15.5;
    gOver
      .moveTo(hx - 10.5, brimY)
      .quadraticCurveTo(hx - 2.0, brimY - 9.0, tipX, tipY)
      .quadraticCurveTo(hx + 4.0, brimY - 8.0, hx + 10.5, brimY)
      .closePath()
      .fill({ color: palette.base })
      .stroke({ color: palette.outline, width: CEL_OUTLINE_WIDTH, join: 'round' });
    gOver
      .ellipse(hx, brimY, 16.5, 4.6)
      .fill({ color: palette.shade })
      .stroke({ color: palette.outline, width: CEL_OUTLINE_WIDTH });
  } else if (palette.archetype === 'stormcaller_gojo') {
    // Spiky white-silver hair + dark blindfold visor with glowing electric eye slits
    gOver
      .roundRect(hx - rx * 0.96, eyeY - 2.4, rx * 1.92, 4.4, 1.5)
      .fill({ color: 0x0f172a })
      .stroke({ color: palette.outline, width: 1.2 });

    // Crown of spiky white hair tufts
    gOver
      .moveTo(hx - rx, hy - 2.5)
      .lineTo(hx - rx * 0.75, hy - ry - 4.5)
      .lineTo(hx - rx * 0.25, hy - ry + 0.5)
      .lineTo(hx + facing * 1.2, hy - ry - 6.0)
      .lineTo(hx + rx * 0.35, hy - ry + 0.5)
      .lineTo(hx + rx * 0.82, hy - ry - 4.0)
      .lineTo(hx + rx, hy - 2.5)
      .closePath()
      .fill({ color: palette.hair })
      .stroke({ color: palette.outline, width: CEL_OUTLINE_WIDTH, join: 'round' });
  } else {
    // Spiky / windswept hero hair & headband/laurel for Warden & Seeker
    gOver
      .moveTo(hx - rx, hy - 1.8)
      .quadraticCurveTo(hx - rx * 0.6, hy - ry - 3.5, hx + facing * 2.0, hy - ry - 2.5)
      .quadraticCurveTo(hx + rx * 0.6, hy - ry - 3.5, hx + rx, hy - 1.8)
      .quadraticCurveTo(hx + facing * 1.5, hy - ry * 0.45, hx - rx, hy - 1.8)
      .closePath()
      .fill({ color: palette.hair })
      .stroke({ color: palette.outline, width: CEL_OUTLINE_WIDTH, join: 'round' });

    if (palette.archetype === 'warden_zagreus') {
      // Golden laurel / headband across brow
      gOver
        .moveTo(hx - rx * 0.92, hy - 3.2)
        .quadraticCurveTo(hx, hy - 4.8, hx + rx * 0.92, hy - 3.2)
        .stroke({ color: 0xfbbf24, width: 2.2, cap: 'round' });
    }
  }
}

/**
 * Master entry point to draw a complete cel-shaded procedural vector hero or persona
 * onto `gUnder` (behind body) and `gOver` (in front of body).
 */
export function drawProceduralHeroBody(
  gUnder: PIXI.Graphics,
  gOver: PIXI.Graphics,
  pose: HeroPose,
  palette: PersonaCelPalette,
  headRadius = 10.4
): void {
  const { rig, facing } = pose;

  // 1. Reactive ground contact shadow ellipse
  drawReactiveGroundShadow(gUnder, pose);

  // 2. Far-side Leg & Arm drawn to `gUnder` (behind torso)
  drawArticulatedLeg(gUnder, rig.hipFar, rig.kneeFar, rig.footFar, facing, palette, true);
  drawArticulatedArm(
    gUnder,
    rig.shoulderFar,
    rig.elbowFar,
    rig.handFar,
    palette,
    true,
    pose.sleeveGlow * 0.5
  );

  // 3. Torso, Robe/Tunic, Asymmetric Costume Details & Spring Chains
  drawCelTorsoAndCostume(gUnder, gOver, pose, palette);

  // 4. Near-side Leg drawn to `gOver`
  drawArticulatedLeg(gOver, rig.hipNear, rig.kneeNear, rig.footNear, facing, palette, false);

  // 5. Head, Expressive Face & Headgear
  drawCelHeadAndFace(gOver, pose, palette, headRadius);

  // 6. Near-side Arm drawn to `gOver` (in front of torso)
  drawArticulatedArm(
    gOver,
    rig.shoulderNear,
    rig.elbowNear,
    rig.handNear,
    palette,
    false,
    pose.sleeveGlow
  );

  // 7. Status Overlays: Hit Flash, Dash Invulnerability Shimmer, Low-Health Tell
  if (pose.hitFlash > 0.05) {
    gOver
      .ellipse(rig.torso.x, rig.torso.y - 2, 12.5, 18.0)
      .fill({ color: 0xffffff, alpha: pose.hitFlash * 0.65 })
      .stroke({ color: 0xfef08a, width: 2.0, alpha: pose.hitFlash * 0.85 });
  }

  if (pose.invulnBlink > 0.05) {
    gOver
      .ellipse(rig.torso.x, rig.torso.y - 2, 13.5, 19.0)
      .stroke({
        color: palette.glow,
        width: 2.2,
        alpha: pose.invulnBlink * 0.75,
      });
  }

  if (pose.lowHealthIntensity > 0.05) {
    const pulse = 0.5 + 0.5 * Math.sin(pose.gaitPhase * 2 + Date.now() * 0.01);
    gUnder
      .ellipse(pose.rootX, pose.rootY, 16, 7)
      .stroke({
        color: 0xff0033,
        width: 1.8,
        alpha: pose.lowHealthIntensity * pulse * 0.65,
      });
  }
}
