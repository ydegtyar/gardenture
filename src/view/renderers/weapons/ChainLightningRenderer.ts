/**
 * Chain Lightning Renderer (Visuals & Animation)
 * Layer 4 (view): PixiJS v8 graphics rendering with electric arc midpoint displacement,
 * crackling side branches, multi-layered bloom glow, additive impact flashes & sparks,
 * and zero-allocation display pooling.
 */

import * as PIXI from 'pixi.js';
import {
  CHAIN_LIGHTNING_CONFIG,
  type ChainLightningConfig,
} from '../../../content/data/chainLightningConfig';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

export { CHAIN_LIGHTNING_CONFIG, type ChainLightningConfig };

// --- Display Pooling & Buffer Constants ---
const MAX_POOLED_BOLTS = 32;
const MAX_POOLED_BRANCHES = 6;
const MAIN_BOLT_MAX_POINTS = 65; // supports up to level 6 (2^6 + 1)
const MAIN_BOLT_BUFFER_SIZE = MAIN_BOLT_MAX_POINTS * 2;
const BRANCH_MAX_POINTS = 17; // supports up to level 4 (2^4 + 1)
const BRANCH_BUFFER_SIZE = BRANCH_MAX_POINTS * 2;

interface PooledBranchState {
  pointCount: number;
  coords: Float32Array;
  hasFork: boolean;
  forkPointCount: number;
  forkCoords: Float32Array;
}

interface PooledBoltState {
  id: number;
  inUse: boolean;
  lastFlickerTime: number;
  nextFlickerInterval: number;
  pointCount: number;
  coords: Float32Array;
  branchCount: number;
  branches: PooledBranchState[];
  lastSeenTimestamp: number;
  lastStartX: number;
  lastStartY: number;
}

// Pre-allocate bolt states pool to eliminate runtime GC allocations
const boltStatePool: PooledBoltState[] = Array.from(
  { length: MAX_POOLED_BOLTS },
  () => ({
    id: -1,
    inUse: false,
    lastFlickerTime: -1,
    nextFlickerInterval: 0.05,
    pointCount: 0,
    coords: new Float32Array(MAIN_BOLT_BUFFER_SIZE),
    branchCount: 0,
    branches: Array.from({ length: MAX_POOLED_BRANCHES }, () => ({
      pointCount: 0,
      coords: new Float32Array(BRANCH_BUFFER_SIZE),
      hasFork: false,
      forkPointCount: 0,
      forkCoords: new Float32Array(BRANCH_BUFFER_SIZE),
    })),
    lastSeenTimestamp: 0,
    lastStartX: 0,
    lastStartY: 0,
  })
);

const activeBoltMap = new Map<number, PooledBoltState>();

/**
 * Midpoint displacement algorithm:
 * Recursively subdivides segments, offsetting midpoints perpendicular to the chord.
 * Halves offset at each recursion level, resulting in large wander at low frequency
 * and fine electric jitter at high frequency.
 * Preserves endpoints (x1, y1) and (x2, y2) exactly.
 */
function computeMidpointDisplacement(
  outCoords: Float32Array,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  levels: number,
  roughness: number
): number {
  const totalSegments = 1 << levels;
  const pointCount = totalSegments + 1;

  outCoords[0] = x1;
  outCoords[1] = y1;
  outCoords[totalSegments * 2] = x2;
  outCoords[totalSegments * 2 + 1] = y2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const totalLen = Math.hypot(dx, dy);
  if (totalLen < 1e-4) {
    for (let i = 1; i < totalSegments; i++) {
      outCoords[i * 2] = x1;
      outCoords[i * 2 + 1] = y1;
    }
    return pointCount;
  }

  let displacement = totalLen * roughness;
  let step = totalSegments;

  for (let l = 0; l < levels; l++) {
    const halfStep = step >> 1;
    for (let i = 0; i < totalSegments; i += step) {
      const leftIdx = i;
      const rightIdx = i + step;
      const midIdx = i + halfStep;

      const lx = outCoords[leftIdx * 2]!;
      const ly = outCoords[leftIdx * 2 + 1]!;
      const rx = outCoords[rightIdx * 2]!;
      const ry = outCoords[rightIdx * 2 + 1]!;

      const segDx = rx - lx;
      const segDy = ry - ly;
      const segLen = Math.hypot(segDx, segDy);

      let perpX = 0;
      let perpY = 0;
      if (segLen > 1e-4) {
        perpX = -segDy / segLen;
        perpY = segDx / segLen;
      }

      const offset = (Math.random() * 2 - 1) * displacement;
      outCoords[midIdx * 2] = (lx + rx) * 0.5 + perpX * offset;
      outCoords[midIdx * 2 + 1] = (ly + ry) * 0.5 + perpY * offset;
    }
    displacement *= 0.5;
    step = halfStep;
  }

  return pointCount;
}

/**
 * Traces a polyline of (x, y) coordinates onto a PixiJS v8 Graphics object.
 */
function tracePolyline(
  g: PIXI.Graphics,
  coords: Float32Array,
  pointCount: number
): void {
  if (pointCount < 2) return;
  g.moveTo(coords[0]!, coords[1]!);
  for (let i = 1; i < pointCount; i++) {
    g.lineTo(coords[i * 2]!, coords[i * 2 + 1]!);
  }
}

export type LightningStyleMode = 'standard' | 'bloom' | 'strike';

/**
 * Regenerates the jagged polyline and side arcs for a bolt state.
 */
function regenerateBoltJitter(
  state: PooledBoltState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  mode: LightningStyleMode | boolean = 'standard'
): void {
  const cfg = CHAIN_LIGHTNING_CONFIG;
  const isBloom = mode === 'bloom' || mode === true;
  const isStrike = mode === 'strike';

  const roughness = isStrike
    ? cfg.strike.roughness
    : isBloom
      ? cfg.bloom.roughness
      : cfg.roughness;

  const levels = isStrike ? cfg.strike.levels : cfg.levels;

  state.pointCount = computeMidpointDisplacement(
    state.coords,
    x1,
    y1,
    x2,
    y2,
    levels,
    roughness
  );

  const dx = x2 - x1;
  const dy = y2 - y1;
  const boltLen = Math.hypot(dx, dy);
  const boltAngle = Math.atan2(dy, dx);

  const minBranches = isStrike
    ? cfg.strike.branchCountMin
    : isBloom
      ? cfg.bloom.branchCountMin
      : cfg.branchCountMin;

  const maxBranches = isStrike
    ? cfg.strike.branchCountMax
    : isBloom
      ? cfg.bloom.branchCountMax
      : cfg.branchCountMax;

  state.branchCount =
    minBranches +
    Math.floor(Math.random() * (maxBranches - minBranches + 1));

  const branchLengthMin = isStrike
    ? cfg.strike.branchLengthMinRatio
    : cfg.branchLengthMinRatio;
  const branchLengthMax = isStrike
    ? cfg.strike.branchLengthMaxRatio
    : cfg.branchLengthMaxRatio;
  const branchAngleMin = isStrike
    ? cfg.strike.branchAngleMinDeg
    : cfg.branchAngleMinDeg;
  const branchAngleMax = isStrike
    ? cfg.strike.branchAngleMaxDeg
    : cfg.branchAngleMaxDeg;
  const branchLevels = isStrike ? cfg.strike.branchLevels : cfg.branchLevels;
  const branchForkProb = isStrike
    ? cfg.strike.branchForkProbability
    : isBloom
      ? 0.5
      : cfg.branchForkProbability;

  for (let b = 0; b < state.branchCount; b++) {
    const branch = state.branches[b]!;
    if (state.pointCount <= 3) {
      branch.pointCount = 0;
      continue;
    }

    // Pick a random vertex index strictly between 1 and pointCount - 2 (not endpoints)
    const vIdx = 1 + Math.floor(Math.random() * (state.pointCount - 2));
    const bx = state.coords[vIdx * 2]!;
    const by = state.coords[vIdx * 2 + 1]!;

    const lenRatio =
      branchLengthMin +
      Math.random() * (branchLengthMax - branchLengthMin);
    const branchLen = boltLen * lenRatio;

    // Branch angle: 25-65° on a random side
    const side = Math.random() < 0.5 ? 1 : -1;
    const angleDeg =
      branchAngleMin +
      Math.random() * (branchAngleMax - branchAngleMin);
    const branchAngle = boltAngle + side * ((angleDeg * Math.PI) / 180);

    const tipX = bx + Math.cos(branchAngle) * branchLen;
    const tipY = by + Math.sin(branchAngle) * branchLen;

    branch.pointCount = computeMidpointDisplacement(
      branch.coords,
      bx,
      by,
      tipX,
      tipY,
      branchLevels,
      roughness * 1.2
    );

    // Occasional tiny secondary fork on longer branches
    if (
      lenRatio > 0.12 &&
      Math.random() < branchForkProb &&
      branch.pointCount >= 3
    ) {
      branch.hasFork = true;
      const forkVIdx = Math.floor(branch.pointCount / 2);
      const fbx = branch.coords[forkVIdx * 2]!;
      const fby = branch.coords[forkVIdx * 2 + 1]!;
      const forkLen = branchLen * 0.45;
      const forkAngle = branchAngle - side * (0.5 + Math.random() * 0.4);
      const forkTipX = fbx + Math.cos(forkAngle) * forkLen;
      const forkTipY = fby + Math.sin(forkAngle) * forkLen;

      branch.forkPointCount = computeMidpointDisplacement(
        branch.forkCoords,
        fbx,
        fby,
        forkTipX,
        forkTipY,
        1,
        roughness
      );
    } else {
      branch.hasFork = false;
    }
  }
}

/**
 * Acquires a pooled bolt state for a visual effect id.
 */
function acquireBoltState(id: number): PooledBoltState {
  if (activeBoltMap.has(id)) {
    return activeBoltMap.get(id)!;
  }

  for (const b of boltStatePool) {
    if (!b.inUse) {
      b.inUse = true;
      b.id = id;
      b.lastFlickerTime = -1;
      activeBoltMap.set(id, b);
      return b;
    }
  }

  // Pool saturated: reuse the oldest
  const oldest = boltStatePool[0]!;
  if (oldest.id >= 0) activeBoltMap.delete(oldest.id);
  oldest.inUse = true;
  oldest.id = id;
  oldest.lastFlickerTime = -1;
  activeBoltMap.set(id, oldest);
  return oldest;
}

/**
 * Prunes expired bolt states from the active pool.
 */
function pruneStaleBolts(currentTimestamp: number): void {
  for (const b of boltStatePool) {
    if (b.inUse && currentTimestamp - b.lastSeenTimestamp > 400) {
      b.inUse = false;
      if (b.id >= 0) activeBoltMap.delete(b.id);
      b.id = -1;
    }
  }
}

/**
 * Standalone LightningRenderer class.
 * Separates visual presentation from game logic.
 */
export class LightningRenderer {
  public config: ChainLightningConfig = CHAIN_LIGHTNING_CONFIG;
  public readonly rootContainer: PIXI.Container;
  public readonly glowContainer: PIXI.Container;
  public readonly glowGraphics: PIXI.Graphics;
  public readonly coreGraphics: PIXI.Graphics;
  private blurFilter: PIXI.BlurFilter | null = null;

  constructor(config: ChainLightningConfig = CHAIN_LIGHTNING_CONFIG) {
    this.config = config;
    this.rootContainer = new PIXI.Container();
    this.rootContainer.label = 'LightningRenderer_Root';

    this.glowContainer = new PIXI.Container();
    this.glowContainer.label = 'LightningRenderer_GlowContainer';
    this.glowContainer.blendMode = 'add';

    if (config.blur.enabled) {
      try {
        this.blurFilter = new PIXI.BlurFilter({
          strength: config.blur.strength,
          quality: config.blur.quality,
        });
        this.glowContainer.filters = [this.blurFilter];
      } catch {
        this.blurFilter = null;
      }
    }

    this.glowGraphics = new PIXI.Graphics();
    this.glowContainer.addChild(this.glowGraphics);
    this.coreGraphics = new PIXI.Graphics();
    this.rootContainer.addChild(this.glowContainer, this.coreGraphics);
  }

  public clear(): void {
    this.glowGraphics.clear();
    this.coreGraphics.clear();
  }

  public destroy(): void {
    this.clear();
    this.blurFilter?.destroy();
    this.glowGraphics.destroy();
    this.coreGraphics.destroy();
    this.glowContainer.destroy();
    this.rootContainer.destroy({ children: true });
  }
}

/**
 * Primary draw function called for each active 'chain_bolt' visual effect.
 *
 * Renders directly onto the scene's cleared `g` (fxGraphic) with:
 * 1. Midpoint displacement jagged polyline (4-6 levels).
 * 2. Dynamic flicker crackle (~40-70 ms intervals).
 * 3. Short side branches (2-5 points, tapering alpha/width).
 * 4. Multi-layered glow strokes (Outer -> Mid -> Inner -> Crisp Core).
 * 5. Additive impact flashes & sparks flying outward.
 * 6. Smooth alpha fade-out & width shrink over the final 40% of lifetime.
 * 7. Guaranteed zero lingering graphics after attack completes because `g`
 *    is cleared by PixiRenderer at the beginning of each frame.
 */
export function drawChainLightningEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  _fade: number,
  heroX?: number,
  heroY?: number
): void {
  const cfg = CHAIN_LIGHTNING_CONFIG;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  pruneStaleBolts(now);

  // Initial strike starts at the hero (angle === 0). When the hero moves,
  // the start of the lightning follows the hero's position smoothly (or the edge of Garden Blade).
  const isInitial = (fx.angle || 0) === 0 && !fx.isBloom;
  const x1 = isInitial && heroX !== undefined ? heroX : fx.x * PPU;
  const y1 = isInitial && heroY !== undefined ? heroY : fx.y * PPU;
  const x2 = fx.targetX * PPU;
  const y2 = fx.targetY * PPU;
  const isEcho = Boolean(fx.isEcho);

  // Stagger delay was encoded in angle (in seconds)
  const delaySec = Math.max(0, fx.angle || 0);
  const lifetimeSec = Math.max(0.08, cfg.lifetimeMs / 1000);
  const timeElapsed = fx.maxTimer - fx.timer;

  // 1. Still in stagger delay: do not draw yet (bolt has not arrived)
  if (timeElapsed < delaySec) {
    return;
  }

  const activeElapsed = timeElapsed - delaySec;

  // 2. Bolt lifetime has expired: do not draw anything
  if (activeElapsed >= lifetimeSec || activeElapsed < 0) {
    return;
  }

  // 3. Normalized progress of the visible bolt in [0, 1]
  const progress = Math.min(1, Math.max(0, activeElapsed / lifetimeSec));

  // Quick fade-out and slight width shrink over the last 40% of the bolt's life
  let boltFade = 1.0;
  let boltWidthScale = 1.0;
  if (progress >= cfg.fadeStartRatio) {
    const fadeProgress =
      (progress - cfg.fadeStartRatio) / (1 - cfg.fadeStartRatio);
    boltFade = Math.max(0, 1 - fadeProgress);
    boltWidthScale =
      cfg.fadeMinWidthScale + (1 - cfg.fadeMinWidthScale) * boltFade;
  }

  if (boltFade <= 0.01) {
    return;
  }

  // 4. Acquire pooled bolt state and handle flicker crackle + movement tracking
  const state = acquireBoltState(fx.id);
  state.lastSeenTimestamp = now;
  const isBloom = Boolean(fx.isBloom);

  const shouldRegen =
    state.lastFlickerTime < 0 ||
    activeElapsed - state.lastFlickerTime >= state.nextFlickerInterval;

  if (shouldRegen) {
    regenerateBoltJitter(state, x1, y1, x2, y2, isBloom);
    state.lastFlickerTime = activeElapsed;
    state.nextFlickerInterval =
      (cfg.flickerIntervalMinMs +
        Math.random() * (cfg.flickerIntervalMaxMs - cfg.flickerIntervalMinMs)) /
      1000;
    state.lastStartX = x1;
    state.lastStartY = y1;
  } else if (
    state.pointCount >= 2 &&
    (x1 !== state.lastStartX || y1 !== state.lastStartY)
  ) {
    // Hero moved between flicker intervals: smoothly stretch the polyline so start tracks hero
    const deltaX = x1 - state.lastStartX;
    const deltaY = y1 - state.lastStartY;
    const maxIdx = state.pointCount - 1;

    for (let i = 0; i < state.pointCount; i++) {
      // Weight t: 1.0 at caster/start (i=0), 0.0 at target (i=maxIdx)
      const t = 1 - i / maxIdx;
      state.coords[i * 2] += deltaX * t;
      state.coords[i * 2 + 1] += deltaY * t;
    }
    state.coords[0] = x1;
    state.coords[1] = y1;

    // Shift branch positions along with the moved chord
    for (let b = 0; b < state.branchCount; b++) {
      const br = state.branches[b]!;
      for (let p = 0; p < br.pointCount; p++) {
        br.coords[p * 2] += deltaX * 0.7;
        br.coords[p * 2 + 1] += deltaY * 0.7;
      }
    }

    state.lastStartX = x1;
    state.lastStartY = y1;
  }

  // 5. Widths, Alphas & Colors (Chain Bloom uses bolder profiles)
  const widths = isBloom ? cfg.bloom.widths : cfg.widths;
  const alphas = isBloom ? cfg.bloom.alphas : cfg.alphas;
  const outerColor = isBloom
    ? cfg.bloom.colors.outerGlow
    : isEcho
      ? cfg.colors.echoOuterGlow
      : cfg.colors.outerGlow;
  const midColor = isBloom
    ? cfg.bloom.colors.midGlow
    : isEcho
      ? cfg.colors.echoMidGlow
      : cfg.colors.midGlow;
  const innerColor = isBloom
    ? cfg.bloom.colors.innerGlow
    : isEcho
      ? cfg.colors.echoInnerGlow
      : cfg.colors.innerGlow;
  const coreColor = isBloom ? cfg.bloom.colors.core : cfg.colors.core;

  // 6. Draw Main Bolt in 4 Layered Strokes, widest and dimmest first
  // Layer 1: Outer glow (bolder for bloom)
  tracePolyline(g, state.coords, state.pointCount);
  g.stroke({
    color: outerColor,
    width: widths.outerGlow * boltWidthScale,
    alpha: alphas.outerGlow * boltFade,
    cap: 'round',
    join: 'round',
  });

  // Layer 2: Mid glow
  tracePolyline(g, state.coords, state.pointCount);
  g.stroke({
    color: midColor,
    width: widths.midGlow * boltWidthScale,
    alpha: alphas.midGlow * boltFade,
    cap: 'round',
    join: 'round',
  });

  // Layer 3: Inner glow
  tracePolyline(g, state.coords, state.pointCount);
  g.stroke({
    color: innerColor,
    width: widths.innerGlow * boltWidthScale,
    alpha: alphas.innerGlow * boltFade,
    cap: 'round',
    join: 'round',
  });

  // Layer 4: Core (thicker for bloom)
  tracePolyline(g, state.coords, state.pointCount);
  g.stroke({
    color: coreColor,
    width: widths.core * boltWidthScale,
    alpha: alphas.core * boltFade,
    cap: 'round',
    join: 'round',
  });

  // 7. Draw Short Side Arcs (Branches)
  const branchBaseAlpha = isBloom
    ? cfg.bloom.branchBaseAlpha
    : cfg.branchBaseAlpha;
  const branchWidthRatio = isBloom
    ? cfg.bloom.branchCoreWidthRatio
    : cfg.branchCoreWidthRatio;

  for (let b = 0; b < state.branchCount; b++) {
    const br = state.branches[b]!;
    if (br.pointCount < 2) continue;

    const segCount = br.pointCount - 1;
    const subSteps = Math.min(cfg.branchSubSegments, segCount);

    for (let s = 0; s < subSteps; s++) {
      const t1 = s / subSteps;
      const t2 = (s + 1) / subSteps;
      const startIdx = Math.floor(t1 * segCount);
      const endIdx = Math.min(segCount, Math.ceil(t2 * segCount));

      const sx = br.coords[startIdx * 2]!;
      const sy = br.coords[startIdx * 2 + 1]!;
      const ex = br.coords[endIdx * 2]!;
      const ey = br.coords[endIdx * 2 + 1]!;

      // Alpha tapering from base to 0 at tip
      const segAlpha =
        branchBaseAlpha * (1 - (s / subSteps) * 0.85) * boltFade;
      const segWidth =
        widths.core *
        branchWidthRatio *
        (1 - (s / subSteps) * 0.45) *
        boltWidthScale;

      // Branch glow
      g.moveTo(sx, sy)
        .lineTo(ex, ey)
        .stroke({
          color: midColor,
          width: (segWidth + (isBloom ? 3.5 : 2.5)) * boltWidthScale,
          alpha: segAlpha * (isBloom ? 0.45 : 0.35),
          cap: 'round',
          join: 'round',
        });

      // Branch core
      g.moveTo(sx, sy)
        .lineTo(ex, ey)
        .stroke({
          color: coreColor,
          width: segWidth,
          alpha: segAlpha,
          cap: 'round',
          join: 'round',
        });
    }

    // Branch fork if present
    if (br.hasFork && br.forkPointCount >= 2) {
      tracePolyline(g, br.forkCoords, br.forkPointCount);
      g.stroke({
        color: coreColor,
        width: widths.core * branchWidthRatio * 0.7 * boltWidthScale,
        alpha: branchBaseAlpha * 0.5 * boltFade,
        cap: 'round',
        join: 'round',
      });
    }
  }

  // 8. Impact Flash at Strike Point (bolder radius & flash for bloom)
  const flashRadius = isBloom ? cfg.bloom.flashRadius : cfg.impact.flashRadius;
  const flashDurSec = cfg.impact.flashDurationMs / 1000;
  if (activeElapsed < flashDurSec) {
    const flashProgress = activeElapsed / flashDurSec;
    const flashFade = 1 - flashProgress;
    const r =
      flashRadius *
      (0.35 + 0.65 * Math.sin(flashProgress * Math.PI * 0.5));

    // Outer glow
    g.circle(x2, y2, r).fill({
      color: outerColor,
      alpha: (isBloom ? 0.38 : 0.30) * flashFade,
    });
    // Mid glow
    g.circle(x2, y2, r * 0.65).fill({
      color: innerColor,
      alpha: (isBloom ? 0.65 : 0.50) * flashFade,
    });
    // Core white
    g.circle(x2, y2, r * (isBloom ? 0.35 : 0.28)).fill({
      color: coreColor,
      alpha: (isBloom ? 0.95 : 0.85) * flashFade,
    });

    // 9. Tiny sparks flying outward (bolder for bloom)
    const sparkCount = isBloom
      ? cfg.bloom.sparkCountMin +
        (fx.id % (cfg.bloom.sparkCountMax - cfg.bloom.sparkCountMin + 1))
      : cfg.impact.sparkCountMin + (fx.id % 4);
    const sparkColor = isBloom ? cfg.bloom.colors.spark : cfg.colors.spark;
    const sparkWidth = (isBloom ? 2.5 : 1.5) * flashFade;

    for (let i = 0; i < sparkCount; i++) {
      const sparkAngle = (i / sparkCount) * Math.PI * 2 + (fx.id * 0.7);
      const sparkSpeed =
        (isBloom ? 120 : 90) +
        ((fx.id * 17 + i * 29) % (isBloom ? 100 : 70));
      const sparkDist = sparkSpeed * activeElapsed;
      const spX = x2 + Math.cos(sparkAngle) * sparkDist;
      const spY = y2 + Math.sin(sparkAngle) * sparkDist;
      const tailLen = isBloom ? 6.0 : 4.0;
      const tailX = spX - Math.cos(sparkAngle) * tailLen;
      const tailY = spY - Math.sin(sparkAngle) * tailLen;

      g.moveTo(tailX, tailY)
        .lineTo(spX, spY)
        .stroke({
          color: sparkColor,
          width: sparkWidth,
          alpha: (isBloom ? 0.95 : 0.85) * flashFade,
          cap: 'round',
        });
    }
  }

  // 10. Origin Flash at Caster/Start (initial strike only)
  if (delaySec === 0 && !isBloom) {
    const originDurSec = cfg.impact.originFlashDurationMs / 1000;
    if (activeElapsed < originDurSec) {
      const originProgress = activeElapsed / originDurSec;
      const originFade = 1 - originProgress;
      const orR =
        cfg.impact.originFlashRadius * (0.4 + 0.6 * originProgress);

      g.circle(x1, y1, orR).fill({
        color: cfg.colors.innerGlow,
        alpha: 0.45 * originFade,
      });
      g.circle(x1, y1, orR * 0.4).fill({
        color: cfg.colors.core,
        alpha: 0.75 * originFade,
      });
    }
  }
}

/**
 * Renders an overhead lightning strike for enemies marked by lightning when taking damage.
 * Applies the new lightning style:
 * 1. Midpoint displacement jagged polyline (5 levels) descending from overhead clouds.
 * 2. Dynamic flicker crackle (~40-70 ms) throughout its duration.
 * 3. Short side branch arcs crackling outward and tapering to tips.
 * 4. 4 Layered strokes: Outer Glow -> Mid Glow -> Inner Glow -> Crisp Core.
 * 5. Ground impact detonation flash circle + outward flying sparks.
 * 6. Atmospheric cloud origin flash burst in the sky.
 * 7. Smooth fade-out and width shrink over final 40% of lifetime.
 * 8. Zero allocations per frame via pooled bolt states.
 */
export function drawLightningStrikeEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  _fade: number
): void {
  const cfg = CHAIN_LIGHTNING_CONFIG;
  const strikeCfg = cfg.strike;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  pruneStaleBolts(now);

  const tx = fx.x * PPU;
  const ty = fx.y * PPU;
  const skyHeight = strikeCfg.skyHeight;
  const skySlant = (((fx.id * 17) % 31) - 15) * 1.5;
  const sx = tx + skySlant;
  const sy = ty - skyHeight;

  const lifetimeSec = fx.maxTimer > 0 ? fx.maxTimer : cfg.lifetimeMs / 1000;
  const timeElapsed = fx.maxTimer - fx.timer;

  if (timeElapsed >= lifetimeSec || timeElapsed < 0) {
    return;
  }

  const progress = Math.min(1, Math.max(0, timeElapsed / lifetimeSec));

  let boltFade = 1.0;
  let boltWidthScale = 1.0;
  if (progress >= cfg.fadeStartRatio) {
    const fadeProgress =
      (progress - cfg.fadeStartRatio) / (1 - cfg.fadeStartRatio);
    boltFade = Math.max(0, 1 - fadeProgress);
    boltWidthScale =
      cfg.fadeMinWidthScale + (1 - cfg.fadeMinWidthScale) * boltFade;
  }

  if (boltFade <= 0.01) {
    return;
  }

  const state = acquireBoltState(fx.id);
  state.lastSeenTimestamp = now;

  const shouldRegen =
    state.lastFlickerTime < 0 ||
    timeElapsed - state.lastFlickerTime >= state.nextFlickerInterval;

  if (shouldRegen) {
    regenerateBoltJitter(state, sx, sy, tx, ty, 'strike');
    state.lastFlickerTime = timeElapsed;
    state.nextFlickerInterval =
      (cfg.flickerIntervalMinMs +
        Math.random() * (cfg.flickerIntervalMaxMs - cfg.flickerIntervalMinMs)) /
      1000;
    state.lastStartX = sx;
    state.lastStartY = sy;
  }

  const widths = strikeCfg.widths;
  const alphas = strikeCfg.alphas;
  const colors = strikeCfg.colors;

  // Layer 1: Outer glow
  tracePolyline(g, state.coords, state.pointCount);
  g.stroke({
    color: colors.outerGlow,
    width: widths.outerGlow * boltWidthScale,
    alpha: alphas.outerGlow * boltFade,
    cap: 'round',
    join: 'round',
  });

  // Layer 2: Mid glow
  tracePolyline(g, state.coords, state.pointCount);
  g.stroke({
    color: colors.midGlow,
    width: widths.midGlow * boltWidthScale,
    alpha: alphas.midGlow * boltFade,
    cap: 'round',
    join: 'round',
  });

  // Layer 3: Inner glow
  tracePolyline(g, state.coords, state.pointCount);
  g.stroke({
    color: colors.innerGlow,
    width: widths.innerGlow * boltWidthScale,
    alpha: alphas.innerGlow * boltFade,
    cap: 'round',
    join: 'round',
  });

  // Layer 4: Core
  tracePolyline(g, state.coords, state.pointCount);
  g.stroke({
    color: colors.core,
    width: widths.core * boltWidthScale,
    alpha: alphas.core * boltFade,
    cap: 'round',
    join: 'round',
  });

  // Short Side Arcs (Branches)
  const branchBaseAlpha = strikeCfg.branchBaseAlpha;
  const branchWidthRatio = strikeCfg.branchCoreWidthRatio;

  for (let b = 0; b < state.branchCount; b++) {
    const br = state.branches[b]!;
    if (br.pointCount < 2) continue;

    const segCount = br.pointCount - 1;
    const subSteps = Math.min(strikeCfg.branchSubSegments, segCount);

    for (let s = 0; s < subSteps; s++) {
      const t1 = s / subSteps;
      const t2 = (s + 1) / subSteps;
      const startIdx = Math.floor(t1 * segCount);
      const endIdx = Math.min(segCount, Math.ceil(t2 * segCount));

      const bsx = br.coords[startIdx * 2]!;
      const bsy = br.coords[startIdx * 2 + 1]!;
      const bex = br.coords[endIdx * 2]!;
      const bey = br.coords[endIdx * 2 + 1]!;

      const segAlpha = branchBaseAlpha * (1 - (s / subSteps) * 0.85) * boltFade;
      const segWidth =
        widths.core * branchWidthRatio * (1 - (s / subSteps) * 0.45) * boltWidthScale;

      g.moveTo(bsx, bsy)
        .lineTo(bex, bey)
        .stroke({
          color: colors.midGlow,
          width: (segWidth + 3.0) * boltWidthScale,
          alpha: segAlpha * 0.4,
          cap: 'round',
          join: 'round',
        });

      g.moveTo(bsx, bsy)
        .lineTo(bex, bey)
        .stroke({
          color: colors.core,
          width: segWidth,
          alpha: segAlpha,
          cap: 'round',
          join: 'round',
        });
    }

    if (br.hasFork && br.forkPointCount >= 2) {
      tracePolyline(g, br.forkCoords, br.forkPointCount);
      g.stroke({
        color: colors.core,
        width: widths.core * branchWidthRatio * 0.7 * boltWidthScale,
        alpha: branchBaseAlpha * 0.5 * boltFade,
        cap: 'round',
        join: 'round',
      });
    }
  }

  // Ground Impact Flash at target point (scaled by areaMult via fx.radius)
  const flashRadius = Math.max(strikeCfg.impact.flashRadius, (fx.radius || 1) * PPU * 0.45);
  const flashDurSec = cfg.impact.flashDurationMs / 1000;
  if (timeElapsed < flashDurSec) {
    const flashProgress = timeElapsed / flashDurSec;
    const flashFade = 1 - flashProgress;
    const r = flashRadius * (0.35 + 0.65 * Math.sin(flashProgress * Math.PI * 0.5));

    g.circle(tx, ty, r).fill({
      color: colors.outerGlow,
      alpha: 0.35 * flashFade,
    });
    g.circle(tx, ty, r * 0.65).fill({
      color: colors.innerGlow,
      alpha: 0.60 * flashFade,
    });
    g.circle(tx, ty, r * 0.32).fill({
      color: colors.core,
      alpha: 0.95 * flashFade,
    });

    // Flying sparks
    const sparkCount =
      strikeCfg.impact.sparkCountMin +
      (fx.id % (strikeCfg.impact.sparkCountMax - strikeCfg.impact.sparkCountMin + 1));
    const sparkColor = colors.spark;
    const sparkWidth = 2.0 * flashFade;

    for (let i = 0; i < sparkCount; i++) {
      const sparkAngle = (i / sparkCount) * Math.PI * 2 + fx.id * 0.7;
      const sparkSpeed =
        strikeCfg.impact.sparkSpeedMin +
        ((fx.id * 19 + i * 31) % (strikeCfg.impact.sparkSpeedMax - strikeCfg.impact.sparkSpeedMin));
      const sparkDist = sparkSpeed * timeElapsed;
      const spX = tx + Math.cos(sparkAngle) * sparkDist;
      const spY = ty + Math.sin(sparkAngle) * sparkDist;
      const tailLen = 5.0;
      const tailX = spX - Math.cos(sparkAngle) * tailLen;
      const tailY = spY - Math.sin(sparkAngle) * tailLen;

      g.moveTo(tailX, tailY)
        .lineTo(spX, spY)
        .stroke({
          color: sparkColor,
          width: sparkWidth,
          alpha: 0.9 * flashFade,
          cap: 'round',
        });
    }
  }

  // Cloud / Sky Origin Flash (atmospheric cloud flash where the bolt descends)
  const cloudDurSec = strikeCfg.cloud.durationMs / 1000;
  if (timeElapsed < cloudDurSec) {
    const cloudProgress = timeElapsed / cloudDurSec;
    const cloudFade = 1 - cloudProgress;
    const cloudR = strikeCfg.cloud.flashRadius * (0.4 + 0.6 * cloudProgress);

    g.circle(sx, sy, cloudR).fill({
      color: colors.cloudOuter,
      alpha: 0.30 * cloudFade,
    });
    g.circle(sx, sy, cloudR * 0.55).fill({
      color: colors.cloudMid,
      alpha: 0.55 * cloudFade,
    });
    g.circle(sx, sy, cloudR * 0.25).fill({
      color: colors.cloudCore,
      alpha: 0.85 * cloudFade,
    });
  }
}
