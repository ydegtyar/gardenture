import * as PIXI from 'pixi.js';
import { clamp, lerp } from '../../../core/math/vec2';
import type { Simulation } from '../../../sim/Simulation';

/**
 * ============================================================================
 * AAA BOTANICAL DARK FANTASY ARENA BOUNDARY & PROCEDURAL THORN WALL (PixiJS v8)
 * ============================================================================
 * Visual & Technical Architecture:
 * 1. Botanical Dark Fantasy Aesthetic:
 *    - Deep emerald / slate-green floor transitions & abyssal outer forest void.
 *    - Multi-tiered scalloped forest canopy silhouettes & ambient floor shadows.
 *    - Deep radial thicket (~220px thick) of overlapping briar leaf clusters, compound
 *      serrated fern fronds, twilight-plum succulent rosettes, and spiky guardian pods.
 *    - Tapering gnarled dark-walnut wood trunks & spiral root curls with bark grain.
 *    - 4 concentric bands of sweeping braided teal-jade & slate-cyan Bezier briar vines
 *      with coiled fiddlehead tendrils and vine-anchored rose-pink thorns.
 *    - Organic Bioluminescent Cyan & Rose-Magenta blooms nestled in S-curved vine cradles,
 *      casting multi-layered radial light halos onto surrounding foliage.
 * 2. Dynamic Inward Growth & Living Motion:
 *    - Smoothly interpolates boundary radius and increases vine/thorn density as the
 *      arena constricts inward over the course of a run.
 * 3. Clean Separation of Concerns & Zero Memory Leaks:
 *    - `ArenaBoundary`: Pre-computes deterministic procedural node tables (zero per-frame GC)
 *      and renders the living thorn wall with `update()`, `getGrowthState()`, and `destroy()`.
 *    - `RenderPipeline`: Manages WebGL-accelerated layered `PIXI.Container` sorting,
 *      blend modes, and aspect-ratio-preserving responsive viewport scaling.
 *    - `GameManager`: Orchestrates PixiJS v8 `Application`, `Ticker` loop, resize listener,
 *      and full resource disposal.
 */

export const THORN_WALL_PALETTE = {
  /** Deep abyssal outer forest void */
  abyssVoid: 0x07080d,
  abyssDangerVoid: 0x1e0711,
  /** Inner ground shadow & canopy shelves */
  groundShadow: 0x06130e,
  canopyDeep: 0x091618,
  undergrowthShelf: 0x0d2220,
  canopyMid: 0x13302c,

  /** Cel-shaded dark ink outline */
  inkOutline: 0x0d0811,

  /** Gnarled wood roots & bark */
  woodShadow: 0x1d1110,
  woodDark: 0x2b1916,
  woodBase: 0x442822,
  woodHighlight: 0x663f35,
  woodRim: 0x87584a,

  /** Sweeping teal-emerald & slate-cyan briar vines */
  vineDeep: 0x0f2d30,
  vineMid: 0x19474a,
  vineLight: 0x286b6d,
  vineHighlight: 0x469694,
  vineRim: 0x7ad1cb,

  /** Serrated fern fronds, briar leaf clusters & twilight succulents */
  fernShadow: 0x0d2418,
  fernDark: 0x153a27,
  fernMid: 0x235b3d,
  fernBright: 0x3a865d,
  fernTip: 0x62b083,
  leafTealDark: 0x113336,
  leafTealMid: 0x1d4f52,
  leafTealBright: 0x31787a,
  succulentDark: 0x2d1b36,
  succulentMid: 0x482c57,
  succulentBright: 0x6c4580,
  succulentTip: 0xa874bd,

  /** Curved rose-pink & coral-ivory briar thorns */
  thornShadow: 0x9f1239,
  thornBase: 0xe11d48,
  thornRose: 0xfb7185,
  thornPink: 0xfda4af,
  thornTip: 0xffe4e6,

  /** Bioluminescent Cyan & Rose-Magenta sanctuary alcoves */
  bioCyanOuter: 0x0891b2,
  bioCyanMid: 0x22d3ee,
  bioCyanCore: 0xa5f3fc,
  bioMagentaOuter: 0xbe185d,
  bioMagentaMid: 0xf472b6,
  bioMagentaCore: 0xfecdd3,
  bioWhiteHot: 0xffffff,
} as const;

// ============================================================================
// 1. DETERMINISTIC PROCEDURAL NODE TYPES (Pre-Allocated, Zero Frame GC)
// ============================================================================

interface BriarBushMoundNode {
  angle: number;
  radialOffset: number;
  radiusX: number;
  radiusY: number;
  leafCount: number;
  colorVariant: 0 | 1 | 2;
  phaseOffset: number;
}

interface FoliageClusterNode {
  angle: number;
  radialOffset: number;
  scale: number;
  frondCount: number;
  kind: 'fern' | 'succulent' | 'spikyPod';
  phaseOffset: number;
}

interface GnarledRootNode {
  startAngle: number;
  spanAngle: number;
  startRadialOffset: number;
  midRadialOffset: number;
  endRadialOffset: number;
  baseWidth: number;
  tipWidth: number;
  curlDir: 1 | -1;
  phaseOffset: number;
}

interface BriarVineRibbonNode {
  startAngle: number;
  spanAngle: number;
  rStartOffset: number;
  rCtrl1Offset: number;
  rCtrl2Offset: number;
  rEndOffset: number;
  baseThickness: number;
  tipThickness: number;
  colorVariant: 0 | 1 | 2;
  curlDir: 1 | -1;
  hasSpiralTip: boolean;
  thornCount: number;
  thornSeed: number;
  phaseOffset: number;
}

interface BiolumSanctuaryNode {
  angle: number;
  radialOffset: number;
  scale: number;
  isCyan: boolean;
  phaseOffset: number;
  lobeCount: number;
}

interface RimThornNode {
  angle: number;
  radialOffset: number;
  tiltAngle: number;
  length: number;
  baseWidth: number;
  curveAmount: number;
  colorVariant: 0 | 1 | 2;
}

function deterministicHash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Evaluates a cubic Bezier point at parameter `t` in [0, 1].
 */
function cubicBezier(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const u = 1 - t;
  return (
    u * u * u * p0 +
    3 * u * u * t * p1 +
    3 * u * t * t * p2 +
    t * t * t * p3
  );
}

/**
 * Evaluates the first derivative (tangent) of a cubic Bezier at parameter `t` in [0, 1].
 */
function cubicBezierTangent(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const u = 1 - t;
  return (
    3 * u * u * (p1 - p0) +
    6 * u * t * (p2 - p1) +
    3 * t * t * (p3 - p2)
  );
}

// ============================================================================
// 2. ARENA BOUNDARY (Procedural Thorn Wall Generator & Dynamic Growth Engine)
// ============================================================================

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ArenaBoundaryConfig {
  initialRadiusPx?: number;
  minRadiusPx?: number;
  bushMoundCount?: number;
  foliageClusterCount?: number;
  gnarledRootCount?: number;
  vineRibbonCount?: number;
  sanctuaryCount?: number;
  rimThornCount?: number;
}

interface PooledThornItem {
  particle: PIXI.Particle;
  active: boolean;
}

interface PooledMoteItem {
  particle: PIXI.Particle;
  active: boolean;
}

let sharedThornAtlas: {
  source: PIXI.BufferImageSource;
  rose: PIXI.Texture;
  pink: PIXI.Texture;
  base: PIXI.Texture;
} | null = null;

let sharedMoteAtlas: {
  source: PIXI.BufferImageSource;
  cyan: PIXI.Texture;
  magenta: PIXI.Texture;
} | null = null;

export function getSharedThornAtlas(): {
  rose: PIXI.Texture;
  pink: PIXI.Texture;
  base: PIXI.Texture;
} {
  if (!sharedThornAtlas) {
    const w = 24;
    const h = 36;
    const totalW = w * 3;
    const buf = new Uint8Array(totalW * h * 4);
    const colors = [
      THORN_WALL_PALETTE.thornRose,
      THORN_WALL_PALETTE.thornPink,
      THORN_WALL_PALETTE.thornBase,
    ];
    for (let c = 0; c < 3; c++) {
      const colorHex = colors[c];
      const cr = (colorHex >> 16) & 0xff;
      const cg = (colorHex >> 8) & 0xff;
      const cb = colorHex & 0xff;
      const colOffset = c * w;
      for (let y = 0; y < h; y++) {
        const ty = y / h;
        const curve = Math.sin(ty * Math.PI) * (w * 0.18);
        const halfWidth = (1 - Math.pow(ty, 0.72)) * (w * 0.44);
        const centerX = colOffset + w * 0.5 + curve;
        for (let x = 0; x < w; x++) {
          const px = colOffset + x;
          const dx = Math.abs(px - centerX);
          const idx = (y * totalW + px) * 4;
          if (dx <= halfWidth) {
            const isOutline = dx >= halfWidth - 1.3 || y >= h - 2 || y <= 1;
            const isTip = ty > 0.62 && dx < halfWidth * 0.42;
            if (isTip) {
              buf[idx] = 255;
              buf[idx + 1] = 232;
              buf[idx + 2] = 240;
              buf[idx + 3] = 255;
            } else if (isOutline) {
              buf[idx] = 13;
              buf[idx + 1] = 8;
              buf[idx + 2] = 17;
              buf[idx + 3] = 255;
            } else {
              buf[idx] = cr;
              buf[idx + 1] = cg;
              buf[idx + 2] = cb;
              buf[idx + 3] = 255;
            }
          }
        }
      }
    }
    const source = new PIXI.BufferImageSource({
      resource: buf,
      width: totalW,
      height: h,
      alphaMode: 'premultiply-alpha-on-upload',
      format: 'rgba8unorm',
    });
    sharedThornAtlas = {
      source,
      rose: new PIXI.Texture({
        source,
        frame: new PIXI.Rectangle(0, 0, w, h),
      }),
      pink: new PIXI.Texture({
        source,
        frame: new PIXI.Rectangle(w, 0, w, h),
      }),
      base: new PIXI.Texture({
        source,
        frame: new PIXI.Rectangle(w * 2, 0, w, h),
      }),
    };
  }
  return sharedThornAtlas;
}

export function getSharedMoteAtlas(): {
  cyan: PIXI.Texture;
  magenta: PIXI.Texture;
} {
  if (!sharedMoteAtlas) {
    const size = 24;
    const totalW = size * 2;
    const buf = new Uint8Array(totalW * size * 4);
    const radius = size / 2;
    const colors = [
      THORN_WALL_PALETTE.bioCyanMid,
      THORN_WALL_PALETTE.bioMagentaMid,
    ];
    for (let c = 0; c < 2; c++) {
      const colorHex = colors[c];
      const cr = (colorHex >> 16) & 0xff;
      const cg = (colorHex >> 8) & 0xff;
      const cb = colorHex & 0xff;
      const colOffset = c * size;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x + 0.5 - radius;
          const dy = y + 0.5 - radius;
          const dist = Math.hypot(dx, dy) / radius;
          const idx = (y * totalW + colOffset + x) * 4;
          if (dist <= 1) {
            const falloff = 1 - dist * dist;
            const alpha = Math.max(0, Math.min(255, Math.round(falloff * 255)));
            const coreBoost = dist < 0.4 ? (1 - dist / 0.4) * 90 : 0;
            buf[idx] = Math.min(255, cr + coreBoost);
            buf[idx + 1] = Math.min(255, cg + coreBoost);
            buf[idx + 2] = Math.min(255, cb + coreBoost);
            buf[idx + 3] = alpha;
          }
        }
      }
    }
    const source = new PIXI.BufferImageSource({
      resource: buf,
      width: totalW,
      height: size,
      alphaMode: 'premultiply-alpha-on-upload',
      format: 'rgba8unorm',
    });
    sharedMoteAtlas = {
      source,
      cyan: new PIXI.Texture({
        source,
        frame: new PIXI.Rectangle(0, 0, size, size),
      }),
      magenta: new PIXI.Texture({
        source,
        frame: new PIXI.Rectangle(size, 0, size, size),
      }),
    };
  }
  return sharedMoteAtlas;
}

export class ArenaBoundary {
  public readonly container: PIXI.Container;
  public readonly wallGraphics: PIXI.Graphics;
  public readonly glowGraphics: PIXI.Graphics;
  public readonly thornParticleContainer: PIXI.ParticleContainer;
  public readonly moteParticleContainer: PIXI.ParticleContainer;

  private readonly thornPool: PooledThornItem[] = [];
  private readonly motePool: PooledMoteItem[] = [];

  private currentRadiusPx: number;
  private targetRadiusPx: number;
  private readonly initialRadiusPx: number;
  private readonly minRadiusPx: number;
  private elapsedSeconds = 0;
  private growthProgress = 0; // 0 = initial open grove, 1 = maximum inward constriction
  private isDestroyed = false;

  // Pre-allocated deterministic procedural geometry tables
  private readonly bushMounds: BriarBushMoundNode[] = [];
  private readonly foliageClusters: FoliageClusterNode[] = [];
  private readonly gnarledRoots: GnarledRootNode[] = [];
  private readonly vineRibbons: BriarVineRibbonNode[] = [];
  private readonly sanctuaries: BiolumSanctuaryNode[] = [];
  private readonly rimThorns: RimThornNode[] = [];

  constructor(config: ArenaBoundaryConfig = {}) {
    this.initialRadiusPx = config.initialRadiusPx ?? 1344;
    this.minRadiusPx = config.minRadiusPx ?? 480;
    this.currentRadiusPx = this.initialRadiusPx;
    this.targetRadiusPx = this.initialRadiusPx;

    this.container = new PIXI.Container();
    this.container.label = 'ArenaBoundary_Container';

    this.wallGraphics = new PIXI.Graphics();
    this.wallGraphics.label = 'ArenaBoundary_WallGraphics';

    this.glowGraphics = new PIXI.Graphics();
    this.glowGraphics.label = 'ArenaBoundary_GlowGraphics';
    this.glowGraphics.blendMode = 'add';

    this.thornParticleContainer = new PIXI.ParticleContainer({
      dynamicProperties: {
        position: true,
        scale: true,
        rotation: true,
        color: true,
      },
    });
    this.thornParticleContainer.label = 'ArenaBoundary_ThornParticleContainer';

    this.moteParticleContainer = new PIXI.ParticleContainer({
      dynamicProperties: {
        position: true,
        scale: true,
        rotation: true,
        color: true,
      },
    });
    this.moteParticleContainer.label = 'ArenaBoundary_MoteParticleContainer';
    this.moteParticleContainer.blendMode = 'add';

    this.container.addChild(
      this.wallGraphics,
      this.thornParticleContainer,
      this.glowGraphics,
      this.moteParticleContainer
    );

    this.buildProceduralTables(
      config.bushMoundCount ?? 52,
      config.foliageClusterCount ?? 64,
      config.gnarledRootCount ?? 44,
      config.vineRibbonCount ?? 88,
      config.sanctuaryCount ?? 8,
      config.rimThornCount ?? 72
    );

    this.initParticlePools();
  }

  /**
   * Pre-allocates pooled Particle instances in the ParticleContainers for zero-GC 60fps rendering.
   */
  private initParticlePools(): void {
    const thornAtlas = getSharedThornAtlas();
    for (let i = 0; i < 240; i++) {
      const p = new PIXI.Particle({
        texture: thornAtlas.rose,
        x: -9999,
        y: -9999,
        anchorX: 0.5,
        anchorY: 0.05,
        scaleX: 0,
        scaleY: 0,
        rotation: 0,
        alpha: 0,
      });
      this.thornParticleContainer.addParticle(p);
      this.thornPool.push({ particle: p, active: false });
    }

    const moteAtlas = getSharedMoteAtlas();
    for (let i = 0; i < 80; i++) {
      const p = new PIXI.Particle({
        texture: i % 2 === 0 ? moteAtlas.cyan : moteAtlas.magenta,
        x: -9999,
        y: -9999,
        anchorX: 0.5,
        anchorY: 0.5,
        scaleX: 0,
        scaleY: 0,
        rotation: 0,
        alpha: 0,
      });
      this.moteParticleContainer.addParticle(p);
      this.motePool.push({ particle: p, active: false });
    }
  }

  /**
   * Resets all pooled particles to inactive and moves them off-screen.
   */
  public deactivateParticles(): void {
    for (let i = 0; i < this.thornPool.length; i++) {
      if (this.thornPool[i].active) {
        this.thornPool[i].active = false;
        const p = this.thornPool[i].particle;
        p.x = -9999;
        p.y = -9999;
        p.scaleX = 0;
        p.scaleY = 0;
        p.alpha = 0;
      }
    }
    for (let i = 0; i < this.motePool.length; i++) {
      if (this.motePool[i].active) {
        this.motePool[i].active = false;
        const p = this.motePool[i].particle;
        p.x = -9999;
        p.y = -9999;
        p.scaleX = 0;
        p.scaleY = 0;
        p.alpha = 0;
      }
    }
  }

  /**
   * Populates deterministic node tables once on initialization so per-frame
   * rendering allocates zero objects.
   */
  private buildProceduralTables(
    bushCount: number,
    foliageCount: number,
    rootCount: number,
    vineCount: number,
    sanctuaryCount: number,
    rimThornCount: number
  ): void {
    // 1. Dense overlapping briar bush mounds & teal leaf clusters across the full 200px thicket depth
    for (let i = 0; i < bushCount; i++) {
      const h1 = deterministicHash(i * 11 + 5);
      const h2 = deterministicHash(i * 11 + 6);
      const h3 = deterministicHash(i * 11 + 7);
      const depthBand = (i % 3) * 46;
      this.bushMounds.push({
        angle: (i / bushCount) * Math.PI * 2 + (h1 - 0.5) * 0.08,
        radialOffset: 18 + depthBand + h2 * 44,
        radiusX: 34 + h1 * 26,
        radiusY: 26 + h3 * 20,
        leafCount: 5 + (i % 4),
        colorVariant: (i % 3) as 0 | 1 | 2,
        phaseOffset: h1 * Math.PI * 2,
      });
    }

    // 2. Inner & mid-thicket compound fern fronds, twilight succulents & spiky briar pods
    for (let i = 0; i < foliageCount; i++) {
      const h1 = deterministicHash(i * 13 + 1);
      const h2 = deterministicHash(i * 13 + 2);
      const h3 = deterministicHash(i * 13 + 3);
      const kind: FoliageClusterNode['kind'] =
        i % 8 === 0 ? 'spikyPod' : i % 3 === 1 ? 'succulent' : 'fern';
      const isOuter = i % 3 === 2;
      this.foliageClusters.push({
        angle: (i / foliageCount) * Math.PI * 2 + (h1 - 0.5) * 0.07,
        radialOffset: isOuter ? 42 + h2 * 68 : -6 + h2 * 36,
        scale: (isOuter ? 1.05 : 0.92) + h3 * 0.48,
        frondCount: kind === 'spikyPod' ? 7 : 5 + (i % 3),
        kind,
        phaseOffset: h1 * Math.PI * 2,
      });
    }

    // 3. Tangentially-weaving gnarled dark-wood roots & twisted trunks across inner & outer thicket
    for (let i = 0; i < rootCount; i++) {
      const h1 = deterministicHash(i * 19 + 101);
      const h2 = deterministicHash(i * 19 + 102);
      const h3 = deterministicHash(i * 19 + 103);
      const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      const depthBand = (i % 3) * 42;
      this.gnarledRoots.push({
        startAngle: (i / rootCount) * Math.PI * 2 + (h1 - 0.5) * 0.08,
        spanAngle: dir * (0.26 + h2 * 0.24),
        startRadialOffset: 44 + depthBand + h1 * 56,
        midRadialOffset: 14 + depthBand * 0.8 + h2 * 44,
        endRadialOffset: 2 + depthBand * 0.5 + h3 * 34,
        baseWidth: 16 + (i % 3) * 5.0,
        tipWidth: 4.5 + h1 * 3.0,
        curlDir: dir,
        phaseOffset: h1 * Math.PI * 2,
      });
    }

    // 4. Sweeping braided teal-emerald & slate-cyan Bezier vine ribbons (4 concentric depth bands)
    for (let i = 0; i < vineCount; i++) {
      const h1 = deterministicHash(i * 23 + 201);
      const h2 = deterministicHash(i * 23 + 202);
      const h3 = deterministicHash(i * 23 + 203);
      const h4 = deterministicHash(i * 23 + 204);
      const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      const layerBand = (i % 4) * 34; // 4 concentric braided depth bands (0..102px + offsets)
      this.vineRibbons.push({
        startAngle: (i / vineCount) * Math.PI * 2 + (h1 - 0.5) * 0.06,
        spanAngle: dir * (0.24 + h2 * 0.22),
        rStartOffset: 6 + layerBand + h1 * 28,
        rCtrl1Offset: -10 + layerBand + h2 * 54,
        rCtrl2Offset: 26 + layerBand + h3 * 52,
        rEndOffset: 2 + layerBand * 0.75 + h4 * 28,
        baseThickness: 12.5 + (i % 3) * 3.8,
        tipThickness: 4.2 + h1 * 2.5,
        colorVariant: (i % 3) as 0 | 1 | 2,
        curlDir: h2 > 0.5 ? 1 : -1,
        hasSpiralTip: i % 2 === 0,
        thornCount: 2 + (i % 3),
        thornSeed: i * 41 + 7,
        phaseOffset: h1 * Math.PI * 2,
      });
    }

    // 5. Bioluminescent Cyan & Rose-Magenta lantern sanctuaries nestled in organic vine hollows
    for (let i = 0; i < sanctuaryCount; i++) {
      const h1 = deterministicHash(i * 31 + 301);
      const h2 = deterministicHash(i * 31 + 302);
      this.sanctuaries.push({
        angle: (i / sanctuaryCount) * Math.PI * 2 + (h1 - 0.5) * 0.12,
        radialOffset: 48 + h2 * 44,
        scale: 1.0 + h1 * 0.35,
        isCyan: i % 2 === 0,
        phaseOffset: h1 * Math.PI * 2,
        lobeCount: 5,
      });
    }

    // 6. Inner rim guardian briar thorns jutting menacingly toward the glade
    for (let i = 0; i < rimThornCount; i++) {
      const h1 = deterministicHash(i * 37 + 401);
      const h2 = deterministicHash(i * 37 + 402);
      const h3 = deterministicHash(i * 37 + 403);
      this.rimThorns.push({
        angle: (i / rimThornCount) * Math.PI * 2 + (h1 - 0.5) * 0.04,
        radialOffset: -2 + h2 * 22,
        tiltAngle: Math.PI + (h3 - 0.5) * 0.65,
        length: 14 + h1 * 11,
        baseWidth: 7.0 + h2 * 4.2,
        curveAmount: (i % 2 === 0 ? 1 : -1) * (3.0 + h3 * 3.5),
        colorVariant: (i % 3) as 0 | 1 | 2,
      });
    }
  }

  /**
   * Computes the organic, non-circular multi-harmonic clearing radius at `angle`.
   * Produces natural coves, root buttresses, and living breathing undulation.
   */
  public getOrganicEdgeRadius(
    angle: number,
    baseRadiusPx = this.currentRadiusPx,
    layerSeed = 0
  ): number {
    const t = this.elapsedSeconds;
    const w1 = Math.sin(angle * 5 + t * 0.65 + layerSeed) * 18;
    const w2 = Math.cos(angle * 9 - t * 0.45 + layerSeed * 1.7) * 12;
    const w3 = Math.sin(angle * 15 + layerSeed * 2.3) * 7;
    const gladeAspect = 1.0 + Math.cos(angle * 2) * 0.035;
    return baseRadiusPx * gladeAspect + w1 + w2 + w3;
  }

  /**
   * Advances dynamic inward growth interpolation and living flora animation timers.
   */
  public update(
    dtSec: number,
    targetRadiusPx?: number,
    elapsedSeconds?: number
  ): void {
    if (this.isDestroyed) return;

    if (typeof elapsedSeconds === 'number') {
      this.elapsedSeconds = elapsedSeconds;
    } else {
      this.elapsedSeconds += clamp(dtSec, 0, 0.1);
    }

    if (typeof targetRadiusPx === 'number' && targetRadiusPx > 0) {
      this.targetRadiusPx = targetRadiusPx;
      if (Math.abs(this.currentRadiusPx - targetRadiusPx) > 240) {
        this.currentRadiusPx = targetRadiusPx;
      } else {
        this.currentRadiusPx = lerp(
          this.currentRadiusPx,
          targetRadiusPx,
          Math.min(1, clamp(dtSec, 0.001, 0.1) * 12)
        );
      }
    }

    const span = Math.max(1, this.initialRadiusPx - this.minRadiusPx);
    this.growthProgress = clamp(
      (this.initialRadiusPx - this.currentRadiusPx) / span,
      0,
      1
    );
  }

  /**
   * Returns current dynamic growth state for telemetry and testing.
   */
  public getGrowthState(): {
    radiusPx: number;
    targetRadiusPx: number;
    growthProgress: number;
    elapsedSeconds: number;
  } {
    return {
      radiusPx: this.currentRadiusPx,
      targetRadiusPx: this.targetRadiusPx,
      growthProgress: this.growthProgress,
      elapsedSeconds: this.elapsedSeconds,
    };
  }

  /**
   * Helper: Draws a curved cel-shaded rose thorn at `(bx, by)` pointing along `worldTilt`.
   */
  private drawCurvedRoseThorn(
    g: PIXI.Graphics,
    bx: number,
    by: number,
    worldTilt: number,
    len: number,
    halfW: number,
    curveAmount: number,
    colorVariant: 0 | 1 | 2,
    isOutsideArena: boolean
  ): void {
    const P = THORN_WALL_PALETTE;
    const cosT = Math.cos(worldTilt);
    const sinT = Math.sin(worldTilt);
    const perpX = -sinT;
    const perpY = cosT;

    const b1x = bx + perpX * halfW;
    const b1y = by + perpY * halfW;
    const b2x = bx - perpX * halfW;
    const b2y = by - perpY * halfW;

    const tipX = bx + cosT * len + perpX * curveAmount;
    const tipY = by + sinT * len + perpY * curveAmount;

    const ctrl1X =
      bx + cosT * (len * 0.48) + perpX * (halfW * 0.65 + curveAmount * 0.42);
    const ctrl1Y =
      by + sinT * (len * 0.48) + perpY * (halfW * 0.65 + curveAmount * 0.42);
    const ctrl2X =
      bx + cosT * (len * 0.48) - perpX * (halfW * 0.45 - curveAmount * 0.42);
    const ctrl2Y =
      by + sinT * (len * 0.48) - perpY * (halfW * 0.45 - curveAmount * 0.42);

    const fillColor = isOutsideArena
      ? P.thornBase
      : colorVariant === 0
        ? P.thornRose
        : colorVariant === 1
          ? P.thornPink
          : P.thornBase;

    g.moveTo(b1x, b1y)
      .quadraticCurveTo(ctrl1X, ctrl1Y, tipX, tipY)
      .quadraticCurveTo(ctrl2X, ctrl2Y, b2x, b2y)
      .closePath()
      .fill({ color: fillColor })
      .stroke({ color: P.inkOutline, width: 1.7, join: 'round' });

    // Ivory-white razor tip highlight
    const midX = bx + cosT * (len * 0.52) + perpX * (curveAmount * 0.45);
    const midY = by + sinT * (len * 0.52) + perpY * (curveAmount * 0.45);
    g.moveTo(midX, midY)
      .lineTo(tipX, tipY)
      .stroke({
        color: P.thornTip,
        width: 1.4,
        alpha: 0.92,
        cap: 'round',
      });
  }

  /**
   * Renders the complete AAA procedural thorn wall onto the provided `PIXI.Graphics`
   * (or internal `wallGraphics` if omitted).
   */
  public render(
    g: PIXI.Graphics = this.wallGraphics,
    cx = 0,
    cy = 0,
    isOutsideArena = false,
    viewport?: ViewportBounds
  ): void {
    if (this.isDestroyed) return;

    const P = THORN_WALL_PALETTE;
    const t = this.elapsedSeconds;
    const rPx = this.currentRadiusPx;
    const growthBoost = 1.0 + this.growthProgress * 0.25;
    const dangerPulse = isOutsideArena ? 0.5 + 0.5 * Math.sin(t * 7.5) : 0;

    // ========================================================================
    // FAST VIEWPORT CULLING & FRUSTUM REJECTION
    // ========================================================================
    let cullActive = false;
    let baseAngle = 0;
    let visMinRel = -Math.PI;
    let visMaxRel = Math.PI;

    if (viewport) {
      // 1. Check if viewport is strictly inside the inner glade clearing:
      // Furthest point of rectangle [minX, maxX] x [minY, maxY] from (cx, cy)
      // is always one of its four corners.
      const maxCornerDist = Math.hypot(
        Math.max(Math.abs(viewport.minX - cx), Math.abs(viewport.maxX - cx)),
        Math.max(Math.abs(viewport.minY - cy), Math.abs(viewport.maxY - cy))
      );
      const innerClearingR = rPx - 45;
      if (maxCornerDist < innerClearingR) {
        // Entire camera viewport is inside the arena glade!
        // 100% of the thorn wall is off-screen -> Skip all calculations & draws!
        this.deactivateParticles();
        return;
      }

      // 2. Check if viewport is completely outside the arena beyond the dark void:
      const nearDx = Math.max(0, Math.max(viewport.minX - cx, cx - viewport.maxX));
      const nearDy = Math.max(0, Math.max(viewport.minY - cy, cy - viewport.maxY));
      const minCornerDist = Math.hypot(nearDx, nearDy);
      if (minCornerDist > rPx + 1600) {
        this.deactivateParticles();
        return;
      }

      // 3. Check if arena center is inside viewport:
      const centerInside =
        cx >= viewport.minX &&
        cx <= viewport.maxX &&
        cy >= viewport.minY &&
        cy <= viewport.maxY;

      if (!centerInside) {
        cullActive = true;
        const camCenterX = (viewport.minX + viewport.maxX) * 0.5;
        const camCenterY = (viewport.minY + viewport.maxY) * 0.5;
        baseAngle = Math.atan2(camCenterY - cy, camCenterX - cx);

        const corners = [
          Math.atan2(viewport.minY - cy, viewport.minX - cx),
          Math.atan2(viewport.minY - cy, viewport.maxX - cx),
          Math.atan2(viewport.maxY - cy, viewport.minX - cx),
          Math.atan2(viewport.maxY - cy, viewport.maxX - cx),
        ];

        let minRel = 0;
        let maxRel = 0;
        for (let i = 0; i < 4; i++) {
          let diff = corners[i] - baseAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          if (diff < minRel) minRel = diff;
          if (diff > maxRel) maxRel = diff;
        }

        const pad = 0.45; // ~26 deg margin for thicket width, vine curves, and frond length
        visMinRel = minRel - pad;
        visMaxRel = maxRel + pad;
      }
    }

    const isAngleInSector = (a: number): boolean => {
      if (!cullActive) return true;
      let diff = a - baseAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      return diff >= visMinRel && diff <= visMaxRel;
    };

    const isSpanInSector = (startA: number, spanA: number): boolean => {
      if (!cullActive) return true;
      const midA = startA + spanA * 0.5;
      const halfSpan = Math.abs(spanA) * 0.5;
      let diff = midA - baseAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      return diff >= (visMinRel - halfSpan) && diff <= (visMaxRel + halfSpan);
    };

    // ========================================================================
    // LAYER 1: ABYSSAL OUTER VOID & DEEP SCALLOPED BOTANICAL CANOPY MASSES
    // ========================================================================
    const outerVoidR = rPx + 1500;
    const sectorCount = 12;
    const stepsPerSector = 16;

    for (let s = 0; s < sectorCount; s++) {
      const aStart = (s / sectorCount) * Math.PI * 2;
      const aEnd = ((s + 1) / sectorCount) * Math.PI * 2;

      if (cullActive && !isSpanInSector(aStart, aEnd - aStart)) {
        continue;
      }

      // 1A. Deep dark-fantasy abyss shroud outside the briar wall
      g.moveTo(
        cx + Math.cos(aStart) * outerVoidR,
        cy + Math.sin(aStart) * outerVoidR
      );
      for (let step = 1; step <= 6; step++) {
        const a = aStart + ((aEnd - aStart) * step) / 6;
        g.lineTo(cx + Math.cos(a) * outerVoidR, cy + Math.sin(a) * outerVoidR);
      }
      for (let step = stepsPerSector; step >= 0; step--) {
        const a = aStart + ((aEnd - aStart) * step) / stepsPerSector;
        const scallop = Math.abs(Math.sin(a * 14)) * 28;
        const midWallR = this.getOrganicEdgeRadius(a, rPx, 0.5) + 155 + scallop;
        g.lineTo(cx + Math.cos(a) * midWallR, cy + Math.sin(a) * midWallR);
      }
      g.closePath().fill({
        color: isOutsideArena ? P.abyssDangerVoid : P.abyssVoid,
        alpha: 0.98,
      });

      // 1B. Deep slate-pine outer foliage canopy mass (scalloped bush silhouettes ~210px deep)
      const firstDeepR =
        this.getOrganicEdgeRadius(aStart, rPx, 1.4) +
        195 +
        Math.abs(Math.sin(aStart * 12)) * 32;
      g.moveTo(
        cx + Math.cos(aStart) * firstDeepR,
        cy + Math.sin(aStart) * firstDeepR
      );
      for (let step = 1; step <= stepsPerSector; step++) {
        const a = aStart + ((aEnd - aStart) * step) / stepsPerSector;
        const bushScallop = Math.abs(Math.sin(a * 12)) * 32;
        const outerCanopyR =
          this.getOrganicEdgeRadius(a, rPx, 1.4) + 195 + bushScallop;
        g.lineTo(
          cx + Math.cos(a) * outerCanopyR,
          cy + Math.sin(a) * outerCanopyR
        );
      }
      for (let step = stepsPerSector; step >= 0; step--) {
        const a = aStart + ((aEnd - aStart) * step) / stepsPerSector;
        const innerCanopyR =
          this.getOrganicEdgeRadius(a, rPx, 0) -
          8 -
          Math.abs(Math.cos(a * 10)) * 12;
        g.lineTo(
          cx + Math.cos(a) * innerCanopyR,
          cy + Math.sin(a) * innerCanopyR
        );
      }
      g.closePath()
        .fill({ color: P.canopyDeep, alpha: 0.97 })
        .stroke({ color: P.inkOutline, width: 2.8, join: 'round' });

      // 1C. Mid emerald-slate bramble undergrowth shelf (~135px deep)
      const firstMidR =
        this.getOrganicEdgeRadius(aStart, rPx, 0.9) +
        132 +
        Math.abs(Math.cos(aStart * 14)) * 24;
      g.moveTo(
        cx + Math.cos(aStart) * firstMidR,
        cy + Math.sin(aStart) * firstMidR
      );
      for (let step = 1; step <= stepsPerSector; step++) {
        const a = aStart + ((aEnd - aStart) * step) / stepsPerSector;
        const midScallop = Math.abs(Math.cos(a * 14)) * 24;
        const r = this.getOrganicEdgeRadius(a, rPx, 0.9) + 132 + midScallop;
        g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      for (let step = stepsPerSector; step >= 0; step--) {
        const a = aStart + ((aEnd - aStart) * step) / stepsPerSector;
        const innerR =
          this.getOrganicEdgeRadius(a, rPx, 0) -
          4 -
          Math.abs(Math.sin(a * 12)) * 10;
        g.lineTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
      }
      g.closePath().fill({
        color: P.undergrowthShelf,
        alpha: 0.94,
      });

      // 1D. Soft ambient occlusion shadow rim bleeding onto the inner clearing floor
      const firstShadowR = this.getOrganicEdgeRadius(aStart, rPx, 0) + 18;
      g.moveTo(
        cx + Math.cos(aStart) * firstShadowR,
        cy + Math.sin(aStart) * firstShadowR
      );
      for (let step = 1; step <= stepsPerSector; step++) {
        const a = aStart + ((aEnd - aStart) * step) / stepsPerSector;
        const rimOuter = this.getOrganicEdgeRadius(a, rPx, 0) + 18;
        g.lineTo(cx + Math.cos(a) * rimOuter, cy + Math.sin(a) * rimOuter);
      }
      for (let step = stepsPerSector; step >= 0; step--) {
        const a = aStart + ((aEnd - aStart) * step) / stepsPerSector;
        const rimInner =
          this.getOrganicEdgeRadius(a, rPx, 0) - 32 * growthBoost;
        g.lineTo(cx + Math.cos(a) * rimInner, cy + Math.sin(a) * rimInner);
      }
      g.closePath().fill({
        color: P.groundShadow,
        alpha: 0.56,
      });
    }

    // ========================================================================
    // LAYER 1.5: BILLOWING BRIAR BUSH MOUNDS & TEAL LEAF CLUSTERS
    // ========================================================================
    for (const mound of this.bushMounds) {
      if (cullActive && !isAngleInSector(mound.angle)) continue;

      const edgeR =
        this.getOrganicEdgeRadius(mound.angle, rPx, 0.3) + mound.radialOffset;
      const mx = cx + Math.cos(mound.angle) * edgeR;
      const my = cy + Math.sin(mound.angle) * edgeR;
      const s = growthBoost;
      const moundColor =
        mound.colorVariant === 0
          ? P.leafTealDark
          : mound.colorVariant === 1
            ? P.fernShadow
            : P.canopyMid;
      const leafHighlight =
        mound.colorVariant === 0 ? P.leafTealMid : P.fernDark;

      // Billowing dark foliage cushion
      g.ellipse(mx, my, mound.radiusX * s, mound.radiusY * s)
        .fill({ color: moundColor, alpha: 0.94 })
        .stroke({ color: P.inkOutline, width: 2.2 });

      // Overlapping ovate briar leaves fanning across the mound
      const inwardA = mound.angle + Math.PI;
      for (let l = 0; l < mound.leafCount; l++) {
        const la =
          inwardA +
          ((l / (mound.leafCount - 1)) - 0.5) * 2.2 +
          Math.sin(t * 1.4 + mound.phaseOffset + l) * 0.05;
        const cosL = Math.cos(la);
        const sinL = Math.sin(la);
        const perpX = -sinL;
        const perpY = cosL;
        const leafLen = (18 + (l % 2) * 6) * s;
        const leafW = 6.8 * s;
        const lx = mx + cosL * (mound.radiusY * 0.35);
        const ly = my + sinL * (mound.radiusY * 0.35);
        const tipX = lx + cosL * leafLen;
        const tipY = ly + sinL * leafLen;

        g.moveTo(lx, ly)
          .quadraticCurveTo(
            lx + cosL * (leafLen * 0.5) + perpX * leafW,
            ly + sinL * (leafLen * 0.5) + perpY * leafW,
            tipX,
            tipY
          )
          .quadraticCurveTo(
            lx + cosL * (leafLen * 0.5) - perpX * leafW,
            ly + sinL * (leafLen * 0.5) - perpY * leafW,
            lx,
            ly
          )
          .closePath()
          .fill({ color: l % 2 === 0 ? leafHighlight : P.leafTealBright })
          .stroke({ color: P.inkOutline, width: 1.5, join: 'round' });
      }
    }

    // ========================================================================
    // LAYER 2: SERRATED COMPOUND FERNS, TWILIGHT SUCCULENTS & SPIKY BRIAR PODS
    // ========================================================================
    for (const cluster of this.foliageClusters) {
      if (cullActive && !isAngleInSector(cluster.angle)) continue;

      const edgeR =
        this.getOrganicEdgeRadius(cluster.angle, rPx, 0) + cluster.radialOffset;
      const fx = cx + Math.cos(cluster.angle) * edgeR;
      const fy = cy + Math.sin(cluster.angle) * edgeR;
      const inwardAngle = cluster.angle + Math.PI;
      const sway =
        Math.sin(t * 1.7 + cluster.phaseOffset) *
        0.06 *
        (1 + this.growthProgress * 0.35);
      const s = cluster.scale * growthBoost;

      // Scalloped dark moss cushion base
      g.circle(fx, fy, 16 * s)
        .fill({ color: P.fernShadow, alpha: 0.92 })
        .stroke({ color: P.inkOutline, width: 1.8 });

      if (cluster.kind === 'spikyPod') {
        // Spiky botanical guardian rosette with coral-pink thorn tips
        const spikeCount = cluster.frondCount;
        for (let k = 0; k < spikeCount; k++) {
          const spread = (k / (spikeCount - 1) - 0.5) * 2.15;
          const la = inwardAngle + spread + sway;
          const cosA = Math.cos(la);
          const sinA = Math.sin(la);
          const perpX = -sinA;
          const perpY = cosA;
          const len = (32 - Math.abs(spread) * 6.5) * s;
          const halfW = 6.8 * s;

          const tipX = fx + cosA * len;
          const tipY = fy + sinA * len;
          const midX = fx + cosA * (len * 0.45);
          const midY = fy + sinA * (len * 0.45);

          g.moveTo(fx, fy)
            .quadraticCurveTo(
              midX + perpX * halfW,
              midY + perpY * halfW,
              tipX,
              tipY
            )
            .quadraticCurveTo(
              midX - perpX * halfW,
              midY - perpY * halfW,
              fx,
              fy
            )
            .closePath()
            .fill({ color: k % 2 === 0 ? P.fernBright : P.fernMid })
            .stroke({ color: P.inkOutline, width: 1.8, join: 'round' });

          // Coral-rose thorny tip cap
          const capStartX = fx + cosA * (len * 0.66);
          const capStartY = fy + sinA * (len * 0.66);
          g.moveTo(
            capStartX + perpX * (halfW * 0.38),
            capStartY + perpY * (halfW * 0.38)
          )
            .lineTo(tipX, tipY)
            .lineTo(
              capStartX - perpX * (halfW * 0.38),
              capStartY - perpY * (halfW * 0.38)
            )
            .closePath()
            .fill({ color: P.thornRose });
        }
        // Glowing core bud at base of spiky pod
        g.circle(
          fx + Math.cos(inwardAngle) * 4.5 * s,
          fy + Math.sin(inwardAngle) * 4.5 * s,
          5.2 * s
        )
          .fill({ color: P.thornPink })
          .stroke({ color: P.inkOutline, width: 1.5 });
      } else if (cluster.kind === 'succulent') {
        // Twilight-plum / amethyst multi-layered rosette leaves
        const leafCount = cluster.frondCount;
        for (let l = 0; l < leafCount; l++) {
          const spread = (l / (leafCount - 1) - 0.5) * 1.75;
          const la = inwardAngle + spread + sway;
          const cosA = Math.cos(la);
          const sinA = Math.sin(la);
          const perpX = -sinA;
          const perpY = cosA;
          const len = (27 - Math.abs(spread) * 6.5) * s;
          const halfW = 6.2 * s;

          const tipX = fx + cosA * len;
          const tipY = fy + sinA * len;
          const midX = fx + cosA * (len * 0.5);
          const midY = fy + sinA * (len * 0.5);

          g.moveTo(fx, fy)
            .quadraticCurveTo(
              midX + perpX * halfW,
              midY + perpY * halfW,
              tipX,
              tipY
            )
            .quadraticCurveTo(
              midX - perpX * halfW,
              midY - perpY * halfW,
              fx,
              fy
            )
            .closePath()
            .fill({
              color: l % 2 === 0 ? P.succulentBright : P.succulentMid,
            })
            .stroke({ color: P.inkOutline, width: 1.6, join: 'round' });

          g.moveTo(midX, midY)
            .lineTo(tipX, tipY)
            .stroke({
              color: P.succulentTip,
              width: 1.4,
              alpha: 0.85,
              cap: 'round',
            });
        }
      } else {
        // Compound serrated botanical fern fronds with paired pinnae (leaflets)
        const frondCount = cluster.frondCount;
        for (let f = 0; f < frondCount; f++) {
          const spread = (f / (frondCount - 1) - 0.5) * 1.85;
          const fa = inwardAngle + spread + sway;
          const cosA = Math.cos(fa);
          const sinA = Math.sin(fa);
          const perpX = -sinA;
          const perpY = cosA;
          const frondLen = (34 - Math.abs(spread) * 8) * s;

          // Draw 5 pairs of serrated leaflets along the frond stem
          const pinnaPairs = 5;
          for (let p = 0; p < pinnaPairs; p++) {
            const pFrac = (p + 0.45) / (pinnaPairs + 0.35);
            const stemX = fx + cosA * (frondLen * pFrac);
            const stemY = fy + sinA * (frondLen * pFrac);
            const pinnaLen = (1 - pFrac * 0.62) * 11.0 * s;
            const pinnaW = 3.6 * s;

            for (const side of [-1, 1] as const) {
              const ptx =
                stemX + cosA * (pinnaLen * 0.55) + perpX * side * pinnaLen;
              const pty =
                stemY + sinA * (pinnaLen * 0.55) + perpY * side * pinnaLen;
              g.moveTo(stemX, stemY)
                .lineTo(
                  stemX + cosA * pinnaW + perpX * side * (pinnaLen * 0.5),
                  stemY + sinA * pinnaW + perpY * side * (pinnaLen * 0.5)
                )
                .lineTo(ptx, pty)
                .lineTo(
                  stemX - cosA * (pinnaW * 0.4),
                  stemY - sinA * (pinnaW * 0.4)
                )
                .closePath()
                .fill({
                  color: p % 2 === 0 ? P.fernMid : P.fernDark,
                })
                .stroke({ color: P.inkOutline, width: 1.25, join: 'round' });
            }
          }

          // Central fern rachis stem & bright emerald tip
          const tipX = fx + cosA * frondLen;
          const tipY = fy + sinA * frondLen;
          g.moveTo(fx, fy)
            .lineTo(tipX, tipY)
            .stroke({
              color: P.fernTip,
              width: 1.6,
              alpha: 0.9,
              cap: 'round',
            });
        }
      }
    }

    // ========================================================================
    // LAYER 3: BIOLUMINESCENT AMBIENT LIGHT POOLS (Soft Multi-Ring Glow)
    // ========================================================================
    for (const pod of this.sanctuaries) {
      if (cullActive && !isAngleInSector(pod.angle)) continue;

      const edgeR =
        this.getOrganicEdgeRadius(pod.angle, rPx, 0.8) + pod.radialOffset;
      const px = cx + Math.cos(pod.angle) * edgeR;
      const py = cy + Math.sin(pod.angle) * edgeR;
      const pulse = 0.86 + 0.14 * Math.sin(t * 2.6 + pod.phaseOffset);
      const glowR = 105 * pod.scale * pulse;
      const outerColor = pod.isCyan ? P.bioCyanOuter : P.bioMagentaOuter;
      const midColor = pod.isCyan ? P.bioCyanMid : P.bioMagentaMid;

      g.circle(px, py, glowR).fill({ color: outerColor, alpha: 0.08 });
      g.circle(px, py, glowR * 0.72).fill({ color: outerColor, alpha: 0.14 });
      g.circle(px, py, glowR * 0.48).fill({ color: midColor, alpha: 0.22 });
    }

    // ========================================================================
    // LAYER 4: TAPERING GNARLED DARK-WOOD ROOTS & SPIRAL BARK TENDRILS
    // ========================================================================
    for (const root of this.gnarledRoots) {
      if (cullActive && !isSpanInSector(root.startAngle, root.spanAngle)) continue;

      const a0 = root.startAngle;
      const a1 = root.startAngle + root.spanAngle * 0.35;
      const a2 = root.startAngle + root.spanAngle * 0.72;
      const a3 = root.startAngle + root.spanAngle;

      const r0 =
        this.getOrganicEdgeRadius(a0, rPx, 0.4) + root.startRadialOffset;
      const r1 =
        this.getOrganicEdgeRadius(a1, rPx, 0.4) +
        root.midRadialOffset +
        Math.sin(t * 1.3 + root.phaseOffset) * 2.5;
      const r2 =
        this.getOrganicEdgeRadius(a2, rPx, 0.4) +
        root.endRadialOffset +
        16;
      const r3 =
        this.getOrganicEdgeRadius(a3, rPx, 0.4) +
        root.endRadialOffset -
        this.growthProgress * 8;

      const x0 = cx + Math.cos(a0) * r0;
      const y0 = cy + Math.sin(a0) * r0;
      const x1 = cx + Math.cos(a1) * r1;
      const y1 = cy + Math.sin(a1) * r1;
      const x2 = cx + Math.cos(a2) * r2;
      const y2 = cy + Math.sin(a2) * r2;
      const x3 = cx + Math.cos(a3) * r3;
      const y3 = cy + Math.sin(a3) * r3;

      const wBase = root.baseWidth * growthBoost;
      const wMid = (root.baseWidth * 0.62 + root.tipWidth * 0.38) * growthBoost;
      const wTip = root.tipWidth * growthBoost;

      // 1. Thick cel-shaded ink outline pass
      g.moveTo(x0, y0)
        .bezierCurveTo(x1, y1, x2, y2, x3, y3)
        .stroke({
          color: P.inkOutline,
          width: wBase + 5.2,
          cap: 'round',
          join: 'round',
        });

      // 2. Dark walnut wood shadow body
      g.moveTo(x0, y0)
        .bezierCurveTo(x1, y1, x2, y2, x3, y3)
        .stroke({
          color: P.woodDark,
          width: wBase,
          cap: 'round',
          join: 'round',
        });

      // 3. Warm bark mid-tone & inner wood grain highlight
      g.moveTo(x0, y0)
        .bezierCurveTo(x1 - 1.5, y1 - 1.5, x2 - 1.5, y2 - 1.5, x3, y3)
        .stroke({
          color: P.woodBase,
          width: wMid,
          cap: 'round',
          join: 'round',
        });

      g.moveTo(x0, y0)
        .bezierCurveTo(x1 - 3, y1 - 3, x2 - 2.5, y2 - 2.5, x3, y3)
        .stroke({
          color: P.woodHighlight,
          width: wTip * 0.78,
          alpha: 0.86,
          cap: 'round',
        });

      // 4. Curled spiral fiddlehead root tip at `(x3, y3)`
      const curlRadius = 9.0 * growthBoost;
      const curlCenterA = a3 + root.curlDir * 0.35;
      const curlCx = x3 + Math.cos(curlCenterA) * curlRadius;
      const curlCy = y3 + Math.sin(curlCenterA) * curlRadius;
      const startArc = curlCenterA + Math.PI;
      const endArc = startArc + root.curlDir * Math.PI * 1.35;
      g.moveTo(
        curlCx + Math.cos(startArc) * curlRadius,
        curlCy + Math.sin(startArc) * curlRadius
      )
        .arc(curlCx, curlCy, curlRadius, startArc, endArc, root.curlDir < 0)
        .stroke({
          color: P.inkOutline,
          width: wTip + 3.6,
          cap: 'round',
        });
      g.moveTo(
        curlCx + Math.cos(startArc) * curlRadius,
        curlCy + Math.sin(startArc) * curlRadius
      )
        .arc(curlCx, curlCy, curlRadius, startArc, endArc, root.curlDir < 0)
        .stroke({
          color: P.woodBase,
          width: wTip,
          cap: 'round',
        });
    }

    // ========================================================================
    // LAYER 5: SWEEPING BRAIDED TEAL-EMERALD BRIAR VINE RIBBONS & VINE THORNS
    // ========================================================================
    for (const vine of this.vineRibbons) {
      if (cullActive && !isSpanInSector(vine.startAngle, vine.spanAngle)) continue;

      const a0 = vine.startAngle;
      const a1 = vine.startAngle + vine.spanAngle * 0.33;
      const a2 = vine.startAngle + vine.spanAngle * 0.67;
      const a3 = vine.startAngle + vine.spanAngle;

      const breath = Math.sin(t * 1.9 + vine.phaseOffset) * 3.0;
      const r0 =
        this.getOrganicEdgeRadius(a0, rPx, 0.2) + vine.rStartOffset + breath;
      const r1 =
        this.getOrganicEdgeRadius(a1, rPx, 0.2) + vine.rCtrl1Offset - breath;
      const r2 =
        this.getOrganicEdgeRadius(a2, rPx, 0.2) + vine.rCtrl2Offset + breath;
      const r3 =
        this.getOrganicEdgeRadius(a3, rPx, 0.2) +
        vine.rEndOffset -
        this.growthProgress * 6;

      const x0 = cx + Math.cos(a0) * r0;
      const y0 = cy + Math.sin(a0) * r0;
      const x1 = cx + Math.cos(a1) * r1;
      const y1 = cy + Math.sin(a1) * r1;
      const x2 = cx + Math.cos(a2) * r2;
      const y2 = cy + Math.sin(a2) * r2;
      const x3 = cx + Math.cos(a3) * r3;
      const y3 = cy + Math.sin(a3) * r3;

      const w = vine.baseThickness * growthBoost;
      const wTip = vine.tipThickness * growthBoost;

      const baseColor =
        vine.colorVariant === 0
          ? P.vineMid
          : vine.colorVariant === 1
            ? P.vineLight
            : P.vineDeep;
      const highlightColor =
        vine.colorVariant === 1 ? P.vineRim : P.vineHighlight;

      // Pass 1: Thick cel-shaded dark ink outline along smooth cubic Bezier
      g.moveTo(x0, y0)
        .bezierCurveTo(x1, y1, x2, y2, x3, y3)
        .stroke({
          color: P.inkOutline,
          width: w + 4.8,
          cap: 'round',
          join: 'round',
        });

      // Pass 2: Teal-emerald vine body fill
      g.moveTo(x0, y0)
        .bezierCurveTo(x1, y1, x2, y2, x3, y3)
        .stroke({
          color: baseColor,
          width: w,
          cap: 'round',
          join: 'round',
        });

      // Pass 3: Cel-shaded top ridge highlight along the sweeping vine
      g.moveTo(x0, y0)
        .bezierCurveTo(x1 - 2, y1 - 2, x2 - 2, y2 - 2, x3, y3)
        .stroke({
          color: highlightColor,
          width: w * 0.34,
          alpha: 0.85,
          cap: 'round',
          join: 'round',
        });

      // Pass 4: Coiled fiddlehead spiral tendril at vine tip
      if (vine.hasSpiralTip) {
        const spiralR = 8.0 * growthBoost;
        const spiralAngle = a3 + vine.curlDir * 0.4;
        const scx = x3 + Math.cos(spiralAngle) * spiralR;
        const scy = y3 + Math.sin(spiralAngle) * spiralR;
        const sStart = spiralAngle + Math.PI;
        const sEnd = sStart + vine.curlDir * Math.PI * 1.45;
        g.moveTo(
          scx + Math.cos(sStart) * spiralR,
          scy + Math.sin(sStart) * spiralR
        )
          .arc(scx, scy, spiralR, sStart, sEnd, vine.curlDir < 0)
          .stroke({
            color: P.inkOutline,
            width: wTip + 3.4,
            cap: 'round',
          });
        g.moveTo(
          scx + Math.cos(sStart) * spiralR,
          scy + Math.sin(sStart) * spiralR
        )
          .arc(scx, scy, spiralR, sStart, sEnd, vine.curlDir < 0)
          .stroke({
            color: baseColor,
            width: wTip,
            cap: 'round',
          });
      }

      // Pass 5: Curved rose-pink briar thorns anchored directly onto this Bezier vine
      for (let k = 0; k < vine.thornCount; k++) {
        const u = (k + 0.5) / vine.thornCount;
        const bx = cubicBezier(x0, x1, x2, x3, u);
        const by = cubicBezier(y0, y1, y2, y3, u);
        const tx = cubicBezierTangent(x0, x1, x2, x3, u);
        const ty = cubicBezierTangent(y0, y1, y2, y3, u);
        const tangentAngle = Math.atan2(ty, tx);
        const side: 1 | -1 = (k + vine.thornSeed) % 2 === 0 ? 1 : -1;
        const normalAngle = tangentAngle + side * (Math.PI * 0.42);
        const h = deterministicHash(vine.thornSeed + k * 7);
        const thornLen =
          (11.5 + h * 7.5) * growthBoost * (1 + dangerPulse * 0.18);
        const thornHalfW = (3.4 + h * 1.6) * growthBoost;
        const curveAmt = side * (2.5 + h * 2.5);

        this.drawCurvedRoseThorn(
          g,
          bx,
          by,
          normalAngle,
          thornLen,
          thornHalfW,
          curveAmt,
          ((k + vine.colorVariant) % 3) as 0 | 1 | 2,
          isOutsideArena
        );
      }
    }

    // ========================================================================
    // LAYER 6: ORGANIC BIOLUMINESCENT CYAN & ROSE-MAGENTA SANCTUARY BLOOMS
    // ========================================================================
    const moteAtlas = getSharedMoteAtlas();
    let moteParticleIdx = 0;

    for (const pod of this.sanctuaries) {
      if (cullActive && !isAngleInSector(pod.angle)) continue;

      const edgeR =
        this.getOrganicEdgeRadius(pod.angle, rPx, 0.8) + pod.radialOffset;
      const px = cx + Math.cos(pod.angle) * edgeR;
      const py = cy + Math.sin(pod.angle) * edgeR;
      const pulse = 0.88 + 0.12 * Math.sin(t * 3.1 + pod.phaseOffset);
      const s = pod.scale * growthBoost;

      const outerColor = pod.isCyan ? P.bioCyanOuter : P.bioMagentaOuter;
      const midColor = pod.isCyan ? P.bioCyanMid : P.bioMagentaMid;
      const coreColor = pod.isCyan ? P.bioCyanCore : P.bioMagentaCore;

      // 1. Soft atmospheric radial bloom glow bathing nearby vines
      g.circle(px, py, 52 * s * pulse).fill({ color: outerColor, alpha: 0.16 });
      g.circle(px, py, 34 * s * pulse).fill({ color: midColor, alpha: 0.26 });

      // 2. Luminous organic flame-petal / crystal cluster nestled in the vines
      const inwardAngle = pod.angle + Math.PI;
      for (let k = 0; k < pod.lobeCount; k++) {
        const spread = (k - (pod.lobeCount - 1) * 0.5) * 0.38;
        const ka =
          inwardAngle +
          spread +
          Math.sin(t * 2.2 + pod.phaseOffset + k) * 0.04;
        const cosK = Math.cos(ka);
        const sinK = Math.sin(ka);
        const perpX = -sinK;
        const perpY = cosK;

        const distFromMid = Math.abs(k - (pod.lobeCount - 1) * 0.5);
        const cLen = (32 - distFromMid * 6.5) * s * pulse;
        const cHalfW = (9.5 - distFromMid * 1.6) * s;

        const tipX = px + cosK * cLen;
        const tipY = py + sinK * cLen;
        const ctrl1X = px + cosK * (cLen * 0.45) + perpX * cHalfW;
        const ctrl1Y = py + sinK * (cLen * 0.45) + perpY * cHalfW;
        const ctrl2X = px + cosK * (cLen * 0.45) - perpX * cHalfW;
        const ctrl2Y = py + sinK * (cLen * 0.45) - perpY * cHalfW;
        const baseX = px - cosK * 5 * s;
        const baseY = py - sinK * 5 * s;

        // Outer glowing petal/flame lobe
        g.moveTo(baseX, baseY)
          .quadraticCurveTo(ctrl1X, ctrl1Y, tipX, tipY)
          .quadraticCurveTo(ctrl2X, ctrl2Y, baseX, baseY)
          .closePath()
          .fill({ color: midColor, alpha: 0.92 })
          .stroke({ color: P.inkOutline, width: 1.6, join: 'round' });

        // Bright inner core lobe
        g.moveTo(px, py)
          .quadraticCurveTo(
            (ctrl1X + px) * 0.5,
            (ctrl1Y + py) * 0.5,
            tipX - cosK * 3,
            tipY - sinK * 3
          )
          .quadraticCurveTo(
            (ctrl2X + px) * 0.5,
            (ctrl2Y + py) * 0.5,
            px,
            py
          )
          .closePath()
          .fill({ color: coreColor, alpha: 0.95 });
      }

      // 3. White-hot bioluminescent heart
      g.circle(px, py, 8.0 * s * pulse).fill({
        color: P.bioWhiteHot,
        alpha: 0.95,
      });

      // 4. Organic S-curved briar vine & root tendrils embracing the base of the bloom
      for (const side of [-1, 1] as const) {
        const embraceStartA = inwardAngle + side * 1.45;
        const embraceMidA = inwardAngle + side * 0.85;
        const embraceEndA = inwardAngle + side * 0.28;

        const sx = px + Math.cos(embraceStartA) * (28 * s);
        const sy = py + Math.sin(embraceStartA) * (28 * s);
        const c1x = px + Math.cos(embraceMidA) * (24 * s);
        const c1y = py + Math.sin(embraceMidA) * (24 * s);
        const ex = px - Math.cos(embraceEndA) * (12 * s);
        const ey = py - Math.sin(embraceEndA) * (12 * s);

        g.moveTo(sx, sy)
          .quadraticCurveTo(c1x, c1y, ex, ey)
          .stroke({
            color: P.inkOutline,
            width: 9.0 * s,
            cap: 'round',
          });
        g.moveTo(sx, sy)
          .quadraticCurveTo(c1x, c1y, ex, ey)
          .stroke({
            color: side === -1 ? P.vineLight : P.woodBase,
            width: 5.2 * s,
            cap: 'round',
          });
        // Rim light from the bioluminescent bloom reflecting on the embracing vine
        g.moveTo(sx, sy)
          .quadraticCurveTo(c1x, c1y, ex, ey)
          .stroke({
            color: coreColor,
            width: 1.6 * s,
            alpha: 0.75,
            cap: 'round',
          });
      }

      // 5. Drifting bioluminescent spore motes in ParticleContainer
      for (let m = 0; m < 5; m++) {
        if (moteParticleIdx < this.motePool.length) {
          const item = this.motePool[moteParticleIdx++];
          item.active = true;
          const p = item.particle;
          const motePhase = t * 1.5 + pod.phaseOffset + m * 1.25;
          const moteDist = 16 + ((motePhase * 9) % 32);
          const moteA = inwardAngle + Math.sin(motePhase) * 0.9;
          const mx = px + Math.cos(moteA) * moteDist;
          const my = py + Math.sin(moteA) * moteDist;
          const moteAlpha = 0.45 + 0.5 * Math.sin(motePhase * 2);

          p.texture = pod.isCyan ? moteAtlas.cyan : moteAtlas.magenta;
          p.x = mx;
          p.y = my;
          p.scaleX = (2.4 * pod.scale * growthBoost) / 12;
          p.scaleY = (2.4 * pod.scale * growthBoost) / 12;
          p.alpha = moteAlpha;
        }
      }
    }

    // Deactivate unused mote particles
    for (let i = moteParticleIdx; i < this.motePool.length; i++) {
      if (this.motePool[i].active) {
        this.motePool[i].active = false;
        const p = this.motePool[i].particle;
        p.x = -9999;
        p.y = -9999;
        p.scaleX = 0;
        p.scaleY = 0;
        p.alpha = 0;
      }
    }

    // ========================================================================
    // LAYER 7: INNER RIM GUARDIAN ROSE-THORNS JUTTING INTO THE GLADE
    // ========================================================================
    const thornAtlas = getSharedThornAtlas();
    let thornParticleIdx = 0;

    for (const thorn of this.rimThorns) {
      if (cullActive && !isAngleInSector(thorn.angle)) continue;

      const edgeR =
        this.getOrganicEdgeRadius(thorn.angle, rPx, 0.1) + thorn.radialOffset;
      const bx = cx + Math.cos(thorn.angle) * edgeR;
      const by = cy + Math.sin(thorn.angle) * edgeR;

      if (viewport) {
        if (
          bx < viewport.minX - 50 ||
          bx > viewport.maxX + 50 ||
          by < viewport.minY - 50 ||
          by > viewport.maxY + 50
        ) {
          continue;
        }
      }

      const worldTilt = thorn.angle + thorn.tiltAngle;
      const len = thorn.length * growthBoost * (1 + dangerPulse * 0.22);
      const halfW = thorn.baseWidth * 0.5 * growthBoost;

      if (thornParticleIdx < this.thornPool.length) {
        const item = this.thornPool[thornParticleIdx++];
        item.active = true;
        const p = item.particle;
        p.texture = isOutsideArena
          ? thornAtlas.base
          : thorn.colorVariant === 0
            ? thornAtlas.rose
            : thorn.colorVariant === 1
              ? thornAtlas.pink
              : thornAtlas.base;
        p.x = bx;
        p.y = by;
        p.rotation = worldTilt - Math.PI * 0.5;
        p.scaleX = (halfW * 2) / 24;
        p.scaleY = len / 36;
        p.alpha = 1.0;
      }

      // Fallback vector drawing when rendering directly to a detached graphics object (e.g. unit tests)
      if (!this.container.parent) {
        this.drawCurvedRoseThorn(
          g,
          bx,
          by,
          worldTilt,
          len,
          halfW,
          thorn.curveAmount,
          thorn.colorVariant,
          isOutsideArena
        );
      }
    }

    // Deactivate unused thorn particles
    for (let i = thornParticleIdx; i < this.thornPool.length; i++) {
      if (this.thornPool[i].active) {
        this.thornPool[i].active = false;
        const p = this.thornPool[i].particle;
        p.x = -9999;
        p.y = -9999;
        p.scaleX = 0;
        p.scaleY = 0;
        p.alpha = 0;
      }
    }
  }

  /**
   * Disposes all PixiJS Graphics and Container resources to guarantee zero memory leaks.
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.wallGraphics.clear();
    this.glowGraphics.clear();
    this.wallGraphics.destroy();
    this.glowGraphics.destroy();
    this.thornParticleContainer.destroy({ children: true });
    this.moteParticleContainer.destroy({ children: true });
    this.container.destroy({ children: true });
    this.thornPool.length = 0;
    this.motePool.length = 0;
    this.bushMounds.length = 0;
    this.foliageClusters.length = 0;
    this.gnarledRoots.length = 0;
    this.vineRibbons.length = 0;
    this.sanctuaries.length = 0;
    this.rimThorns.length = 0;
  }
}

// ============================================================================
// 3. RENDER PIPELINE & GAME MANAGER (Modular PixiJS v8 Stage & Ticker Setup)
// ============================================================================

export class RenderPipeline {
  public readonly stage: PIXI.Container;
  public readonly worldContainer: PIXI.Container;
  public readonly floorLayer: PIXI.Container;
  public readonly boundaryLayer: PIXI.Container;
  public readonly entityLayer: PIXI.Container;
  public readonly lightingLayer: PIXI.Container;

  private readonly designWidth: number;
  private readonly designHeight: number;

  constructor(
    stage: PIXI.Container,
    designWidth = 1280,
    designHeight = 800
  ) {
    this.stage = stage;
    this.designWidth = designWidth;
    this.designHeight = designHeight;

    this.worldContainer = new PIXI.Container();
    this.worldContainer.sortableChildren = true;

    this.floorLayer = new PIXI.Container();
    this.floorLayer.zIndex = 10;

    this.boundaryLayer = new PIXI.Container();
    this.boundaryLayer.zIndex = 20;

    this.entityLayer = new PIXI.Container();
    this.entityLayer.zIndex = 30;
    this.entityLayer.sortableChildren = true;

    this.lightingLayer = new PIXI.Container();
    this.lightingLayer.zIndex = 40;
    this.lightingLayer.blendMode = 'add';

    this.worldContainer.addChild(
      this.floorLayer,
      this.boundaryLayer,
      this.entityLayer,
      this.lightingLayer
    );
    this.stage.addChild(this.worldContainer);
  }

  /**
   * Scales and centers `worldContainer` to maintain aspect ratio across window resizes.
   */
  public resize(screenWidth: number, screenHeight: number): void {
    const scaleX = screenWidth / this.designWidth;
    const scaleY = screenHeight / this.designHeight;
    const uniformScale = Math.max(0.35, Math.min(scaleX, scaleY));

    this.worldContainer.scale.set(uniformScale);
    this.worldContainer.position.set(screenWidth * 0.5, screenHeight * 0.5);
  }

  public destroy(): void {
    this.worldContainer.destroy({ children: true });
  }
}

export class GameManager {
  public app: PIXI.Application | null = null;
  public pipeline: RenderPipeline | null = null;
  public arenaBoundary: ArenaBoundary | null = null;

  private hostElement: HTMLElement | null = null;
  private resizeHandler: (() => void) | null = null;
  private tickerCallback: ((ticker: PIXI.Ticker) => void) | null = null;
  private isDestroyed = false;

  public async init(hostElement: HTMLElement): Promise<void> {
    if (this.isDestroyed) return;
    this.hostElement = hostElement;

    const app = new PIXI.Application();
    await app.init({
      resizeTo: hostElement,
      backgroundColor: THORN_WALL_PALETTE.abyssVoid,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    if (this.isDestroyed) {
      app.destroy(true);
      return;
    }

    this.app = app;
    hostElement.appendChild(app.canvas);

    this.pipeline = new RenderPipeline(app.stage);
    this.arenaBoundary = new ArenaBoundary();
    this.pipeline.boundaryLayer.addChild(this.arenaBoundary.container);

    this.resizeHandler = () => {
      if (!this.app || !this.pipeline || !this.hostElement) return;
      const w = Math.max(320, this.hostElement.clientWidth || window.innerWidth);
      const h = Math.max(240, this.hostElement.clientHeight || window.innerHeight);
      this.app.renderer.resize(w, h);
      this.pipeline.resize(w, h);
    };
    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();

    this.tickerCallback = (ticker: PIXI.Ticker) => {
      const dtSec = ticker.deltaMS / 1000;
      if (this.arenaBoundary) {
        this.arenaBoundary.update(dtSec);
        this.arenaBoundary.wallGraphics.clear();
        this.arenaBoundary.render(this.arenaBoundary.wallGraphics, 0, 0, false);
      }
    };
    app.ticker.add(this.tickerCallback);
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.app && this.tickerCallback) {
      this.app.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
    this.arenaBoundary?.destroy();
    this.arenaBoundary = null;
    this.pipeline?.destroy();
    this.pipeline = null;
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
  }
}

// ============================================================================
// 4. SHARED SINGLETON BRIDGE FOR LIVE GAME SIMULATION RENDERING
// ============================================================================

let sharedArenaBoundary: ArenaBoundary | null = null;

export function getSharedArenaBoundary(): ArenaBoundary {
  if (!sharedArenaBoundary) {
    sharedArenaBoundary = new ArenaBoundary();
  }
  return sharedArenaBoundary;
}

/**
 * Renders the circular organic thorn arena boundary for the live game encounter.
 */
export function drawFinalBossThornArena(
  g: PIXI.Graphics,
  sim: Simulation,
  elapsedSeconds: number,
  ppu: number,
  viewport?: ViewportBounds
): void {
  const boundary = getSharedArenaBoundary();
  if (!sim.arenaActive) {
    boundary.container.visible = false;
    boundary.deactivateParticles();
    return;
  }
  boundary.container.visible = true;

  const cx = sim.arenaCenterX * ppu;
  const cy = sim.arenaCenterY * ppu;
  const rPx = sim.arenaRadiusU * ppu;

  boundary.update(1 / 60, rPx, elapsedSeconds);
  boundary.render(g, cx, cy, Boolean(sim.isOutsideArena), viewport);
}

