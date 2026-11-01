/**
 * Spore Pop Gas Cloud & Botanical Spore Particle Renderer
 * Layer 4 (view): High-performance PixiJS v8 native ParticleContainer & Particle renderer.
 *
 * Implements:
 * 1. Native PixiJS v8 ParticleContainers:
 *    - groundPuffContainer: Billowing organic mist cloud base rendered beneath entities.
 *    - overlayParticleContainer: Rising pollen motes & drifting spore motes rendered directly OVER enemies.
 * 2. Pre-allocated zero-garbage-collection Particle pools for 60fps web and mobile performance.
 * 3. Procedurally baked GPU Texture sources (soft spore puff + luminescent bubble ring) using
 *    BufferImageSource for instant startup without DOM/Canvas dependencies.
 * 4. Billowing organic mist Graphics (clean botanical gas puffs with spinning central artifacts removed).
 *
 * Reference: https://pixijs.com/8.x/guides/components/scene-objects/particle-container
 */

import { ParticleContainer, Particle, Texture, BufferImageSource, type Container, type Graphics } from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { clamp, lerp } from '../../../core/math/vec2';

/** Pre-computed shared procedural radial textures (soft spore puff + luminescent pollen bubble) */
let softSporeTexture: Texture | null = null;
let bubbleSporeTexture: Texture | null = null;

function createSoftCircleTexture(size: number): Texture {
  const radius = size / 2;
  const buffer = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - radius;
      const dy = y + 0.5 - radius;
      const dist = Math.hypot(dx, dy) / radius;
      const idx = (y * size + x) * 4;
      if (dist <= 1) {
        // Smooth quadratic falloff
        const alpha = Math.max(0, Math.min(255, Math.round((1 - dist * dist) * 255)));
        buffer[idx] = 255;
        buffer[idx + 1] = 255;
        buffer[idx + 2] = 255;
        buffer[idx + 3] = alpha;
      }
    }
  }

  return new Texture({
    source: new BufferImageSource({
      resource: buffer,
      width: size,
      height: size,
      alphaMode: 'premultiply-alpha-on-upload',
      format: 'rgba8unorm',
    }),
  });
}

function createBubbleRingTexture(size: number): Texture {
  const radius = size / 2;
  const innerR = radius * 0.55;
  const buffer = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - radius;
      const dy = y + 0.5 - radius;
      const dist = Math.hypot(dx, dy);
      const idx = (y * size + x) * 4;
      if (dist <= radius) {
        let alpha = 0.45;
        if (dist >= innerR) {
          const rimDist = Math.abs(dist - (radius + innerR) * 0.5) / ((radius - innerR) * 0.5);
          alpha = Math.max(0.45, 1 - rimDist);
        }
        buffer[idx] = 255;
        buffer[idx + 1] = 255;
        buffer[idx + 2] = 255;
        buffer[idx + 3] = Math.round(alpha * 255);
      }
    }
  }

  return new Texture({
    source: new BufferImageSource({
      resource: buffer,
      width: size,
      height: size,
      alphaMode: 'premultiply-alpha-on-upload',
      format: 'rgba8unorm',
    }),
  });
}

export function getSharedSporeTextures(): {
  softPuff: Texture;
  bubbleRing: Texture;
} {
  if (!softSporeTexture) {
    softSporeTexture = createSoftCircleTexture(32);
  }
  if (!bubbleSporeTexture) {
    bubbleSporeTexture = createBubbleRingTexture(24);
  }
  return {
    softPuff: softSporeTexture,
    bubbleRing: bubbleSporeTexture,
  };
}

/** Interpolates between two hex colors */
function lerpColor(c1: number, c2: number, t: number): number {
  const clampedT = clamp(t, 0, 1);
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;
  const r = Math.round(lerp(r1, r2, clampedT));
  const g = Math.round(lerp(g1, g2, clampedT));
  const b = Math.round(lerp(b1, b2, clampedT));
  return (r << 16) | (g << 8) | b;
}

// Particle state for pooling
interface PooledSporeParticle {
  particle: Particle;
  active: boolean;
  isBubble: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  baseScale: number;
  maxScale: number;
  cStart: number;
  cMid: number;
  cEnd: number;
}

// Pool sizing tuned for smooth 60fps zero-GC performance
const MAX_SPORE_PARTICLES = 130;

class SporeParticleSystem {
  public groundPuffContainer: ParticleContainer;
  public overlayParticleContainer: ParticleContainer;
  private particles: PooledSporeParticle[] = [];
  private emitTimers = new Map<number, number>();
  private activeHazardTimes = new Map<number, number>();

  constructor(parent: Container) {
    // Ground puffs: subtle ambient mist beneath units
    this.groundPuffContainer = new ParticleContainer({
      dynamicProperties: {
        position: true,
        vertex: true,
        rotation: true,
        color: true,
      },
    });
    this.groundPuffContainer.label = 'SporeGroundPuffParticleContainer';

    // Overlay particles: rising motes & luminescent spore bubbles rendered OVER enemies
    this.overlayParticleContainer = new ParticleContainer({
      dynamicProperties: {
        position: true,
        vertex: true,
        rotation: true,
        color: true,
      },
    });
    this.overlayParticleContainer.label = 'SporeOverlayParticleContainer';

    parent.addChild(this.groundPuffContainer);
    parent.addChild(this.overlayParticleContainer);

    this.initPool();
  }

  private initPool(): void {
    const textures = getSharedSporeTextures();
    this.particles = [];

    for (let i = 0; i < MAX_SPORE_PARTICLES; i++) {
      // 1 in 2 particles are rising overlay motes/bubbles over enemies, others ground puffs
      const isBubble = i % 2 === 0;
      const texture = isBubble ? textures.bubbleRing : textures.softPuff;

      const p = new Particle({
        texture,
        x: -9999,
        y: -9999,
        anchorX: 0.5,
        anchorY: 0.5,
        scaleX: 0,
        scaleY: 0,
        rotation: 0,
        alpha: 0,
        tint: 0x10b981,
      });

      if (isBubble) {
        this.overlayParticleContainer.addParticle(p);
      } else {
        this.groundPuffContainer.addParticle(p);
      }

      this.particles.push({
        particle: p,
        active: false,
        isBubble,
        x: -9999,
        y: -9999,
        vx: 0,
        vy: 0,
        rotSpeed: 0,
        life: 0,
        maxLife: 1,
        baseScale: 0.5,
        maxScale: 1.5,
        cStart: 0x10b981,
        cMid: 0xa3e635,
        cEnd: 0x065f46,
      });
    }
  }

  private getInactiveParticle(isBubble: boolean): PooledSporeParticle | null {
    for (const p of this.particles) {
      if (!p.active && p.isBubble === isBubble) {
        return p;
      }
    }
    return null;
  }

  public emitPuff(cx: number, cy: number, radius: number): void {
    const p = this.getInactiveParticle(false);
    if (!p) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (radius * 0.65);
    const speed = 10 + Math.random() * 20; // Soft gentle drift

    p.active = true;
    p.x = cx + Math.cos(angle) * dist;
    p.y = cy + Math.sin(angle) * (dist * 0.85);
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * (speed * 0.75) - 5;
    p.rotSpeed = (Math.random() - 0.5) * 0.8;
    p.life = 0.6 + Math.random() * 0.45;
    p.maxLife = p.life;
    p.baseScale = 0.3 + Math.random() * 0.2;
    p.maxScale = (radius / 26) * (0.95 + Math.random() * 0.35);

    // Natural fungal spore variation: ~40% earthy warm umber/sepia mushroom spore tones,
    // and 60% toxic botanical mint & lime green tones
    const sporeVariant = Math.random();
    if (sporeVariant < 0.25) {
      // Warm ochre / mushroom spore dust -> rich sepia -> deep earthy loam
      p.cStart = 0xd4a373; // Ochre mushroom spore
      p.cMid = 0xa0522d; // Sienna / mushroom cap
      p.cEnd = 0x582f0e; // Deep peat brown
    } else if (sporeVariant < 0.42) {
      // Russet / chestnut spore -> olive lichen -> deep bark
      p.cStart = 0xc68b59; // Russet spore dust
      p.cMid = 0x8b5a2b; // Warm chestnut brown
      p.cEnd = 0x3d2314; // Dark loam
    } else {
      // Botanical toxic mint emerald -> toxic lime -> deep forest green
      p.cStart = 0x10b981;
      p.cMid = 0xa3e635;
      p.cEnd = 0x065f46;
    }

    p.particle.x = p.x;
    p.particle.y = p.y;
    p.particle.rotation = Math.random() * Math.PI * 2;
    p.particle.scaleX = p.baseScale;
    p.particle.scaleY = p.baseScale;
    p.particle.alpha = 0;
    p.particle.tint = p.cStart;
  }

  public emitBubble(cx: number, cy: number, radius: number): void {
    const p = this.getInactiveParticle(true);
    if (!p) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (radius * 0.7);

    p.active = true;
    p.x = cx + Math.cos(angle) * dist;
    p.y = cy + Math.sin(angle) * (dist * 0.75);
    p.vx = (Math.random() - 0.5) * 10;
    p.vy = -(20 + Math.random() * 26); // Rising buoyancy over enemies
    p.rotSpeed = (Math.random() - 0.5) * 0.6;
    p.life = 0.65 + Math.random() * 0.5;
    p.maxLife = p.life;
    p.baseScale = 0.18 + Math.random() * 0.12;
    p.maxScale = 0.38 + Math.random() * 0.2;

    // Fungal spore motes: ~35% golden amber / warm spore dust, 65% glowing luminescent lime/mint
    if (Math.random() < 0.35) {
      p.cStart = 0xfde047; // Golden spore highlight
      p.cMid = 0xd97706; // Amber spore body
      p.cEnd = 0x78350f; // Earthy brown fade
    } else {
      p.cStart = 0xd9f99d; // Glowing lime
      p.cMid = 0x6ee7b7; // Light mint
      p.cEnd = 0x059669; // Emerald
    }

    p.particle.x = p.x;
    p.particle.y = p.y;
    p.particle.rotation = 0;
    p.particle.scaleX = p.baseScale;
    p.particle.scaleY = p.baseScale;
    p.particle.alpha = 0;
    p.particle.tint = p.cStart;
  }

  public updateEmitter(
    id: number,
    cx: number,
    cy: number,
    radius: number,
    isEmitting: boolean,
    dt: number,
    currentTime: number
  ): void {
    this.activeHazardTimes.set(id, currentTime);

    if (isEmitting) {
      let timer = this.emitTimers.get(id) ?? 0;
      timer -= dt;

      if (timer <= 0) {
        // Slightly decreased emission frequency to avoid visual clutter
        timer = 0.075;
        this.emitPuff(cx, cy, radius);
        if (Math.random() < 0.65) {
          this.emitBubble(cx, cy, radius);
        }
      }
      this.emitTimers.set(id, timer);
    }
  }

  public updateParticles(dt: number): void {
    let hasActivePuffs = false;
    let hasActiveBubbles = false;

    for (const p of this.particles) {
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.particle.alpha = 0;
        p.particle.scaleX = 0;
        p.particle.scaleY = 0;
        p.particle.x = -9999;
        p.particle.y = -9999;
        if (p.isBubble) hasActiveBubbles = true;
        else hasActivePuffs = true;
        continue;
      }

      if (p.isBubble) hasActiveBubbles = true;
      else hasActivePuffs = true;

      const progress = 1 - p.life / p.maxLife; // 0 -> 1

      // Physics update
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (!p.isBubble) {
        // Friction / drag for mist puffs
        p.vx *= 0.95;
        p.vy *= 0.95;
      } else {
        // Gentle buoyancy acceleration for rising spore bubbles
        p.vy -= 10 * dt;
      }

      // Visual updates
      p.particle.x = p.x;
      p.particle.y = p.y;
      p.particle.rotation += p.rotSpeed * dt;

      // Soft natural expansion curve
      const scaleNorm = Math.sin(progress * Math.PI * 0.85);
      const currentScale = lerp(p.baseScale, p.maxScale, scaleNorm);
      p.particle.scaleX = currentScale;
      p.particle.scaleY = currentScale;

      // Decreased particle opacity for cleaner readability
      let maxAlpha = p.isBubble ? 0.65 : 0.32;
      let alpha: number;
      if (progress < 0.22) {
        alpha = (progress / 0.22) * maxAlpha;
      } else if (progress > 0.68) {
        alpha = ((1 - progress) / 0.32) * maxAlpha;
      } else {
        alpha = maxAlpha;
      }
      p.particle.alpha = clamp(alpha, 0, 1);

      // Smooth color transition over particle lifetime
      if (progress < 0.5) {
        p.particle.tint = lerpColor(p.cStart, p.cMid, progress * 2);
      } else {
        p.particle.tint = lerpColor(p.cMid, p.cEnd, (progress - 0.5) * 2);
      }
    }

    // Inform ParticleContainers that dynamic buffers need re-upload
    if (hasActivePuffs) {
      this.groundPuffContainer.update();
    }
    if (hasActiveBubbles) {
      this.overlayParticleContainer.update();
    }
  }

  public sweepEmitters(currentTime: number, maxAgeSeconds = 0.5): void {
    for (const [id, lastTime] of this.activeHazardTimes.entries()) {
      if (currentTime - lastTime > maxAgeSeconds) {
        this.activeHazardTimes.delete(id);
        this.emitTimers.delete(id);
      }
    }
  }

  public destroy(): void {
    this.particles = [];
    this.emitTimers.clear();
    this.activeHazardTimes.clear();

    if (!this.groundPuffContainer.destroyed) {
      this.groundPuffContainer.destroy();
    }
    if (!this.overlayParticleContainer.destroyed) {
      this.overlayParticleContainer.destroy();
    }
  }
}

let activeSystem: SporeParticleSystem | null = null;

export interface SporeParticleContainers {
  groundContainer: ParticleContainer;
  overlayContainer: ParticleContainer;
}

/**
 * Initializes or reconnects the PixiJS v8 native ParticleContainer system to the scene graph.
 * Returns both groundContainer (under entities) and overlayContainer (over enemies).
 */
export function initSporeParticleSystem(
  groundParent: Container,
  overlayParent?: Container
): SporeParticleContainers {
  const targetOverlayParent = overlayParent ?? groundParent;

  if (!activeSystem) {
    activeSystem = new SporeParticleSystem(groundParent);
    if (targetOverlayParent !== groundParent) {
      targetOverlayParent.addChild(activeSystem.overlayParticleContainer);
    }
  } else {
    if (activeSystem.groundPuffContainer.parent !== groundParent) {
      groundParent.addChild(activeSystem.groundPuffContainer);
    }
    if (activeSystem.overlayParticleContainer.parent !== targetOverlayParent) {
      targetOverlayParent.addChild(activeSystem.overlayParticleContainer);
    }
  }

  return {
    groundContainer: activeSystem.groundPuffContainer,
    overlayContainer: activeSystem.overlayParticleContainer,
  };
}

/**
 * Updates a spore cloud emitter instance in the native ParticleContainer system.
 */
export function updateSporeCloudEmitter(
  id: number,
  x: number,
  y: number,
  radius: number,
  isEmitting: boolean,
  dt: number,
  currentTime: number
): void {
  if (!activeSystem) return;
  activeSystem.updateEmitter(id, x, y, radius, isEmitting, dt, currentTime);
}

/**
 * Sweeps inactive spore emitter references and updates simulation tick on particles.
 */
export function sweepSporeCloudEmitters(currentTime: number, maxAgeSeconds = 0.5): void {
  if (!activeSystem) return;
  activeSystem.sweepEmitters(currentTime, maxAgeSeconds);
  activeSystem.updateParticles(0.016);
}

/**
 * Cleanly destroys and unloads the native ParticleContainers.
 */
export function destroySporeParticleSystem(): void {
  if (activeSystem) {
    activeSystem.destroy();
    activeSystem = null;
  }
}

/**
 * Spore Pop Gas Cloud visual effect:
 * Billowing botanical spore puffs, soft ambient mist, and rising spore bubbles on Graphics.
 * (Spinning central artifacts have been removed for clean visual readability).
 */
export function drawSporePopGasCloud(
  g: Graphics,
  cx: number,
  cy: number,
  baseR: number,
  progress: number,
  fade: number,
  seedId: number,
  elapsedSeconds: number
): void {
  const baseRot = (seedId * 1.73) % (Math.PI * 2);
  const drift = elapsedSeconds * 0.7; // Gentle organic drift without spinning

  // 1. Billowing multi-lobed organic gas puffs (soft ambient backdrop)
  const puffCount = 6;
  for (let i = 0; i < puffCount; i++) {
    const a = baseRot + (i / puffCount) * Math.PI * 2 + Math.sin(drift + i) * 0.15;
    const radialBreath = 0.45 + 0.12 * Math.sin(elapsedSeconds * 1.8 + i * 1.7) + progress * 0.15;
    const dist = baseR * radialBreath;
    const px = cx + Math.cos(a) * dist;
    const py = cy + Math.sin(a) * (dist * 0.82) - progress * 4;
    const puffRx = baseR * (0.44 + (i % 3) * 0.06) * (0.85 + 0.15 * fade);
    const puffRy = puffRx * 0.78;
    // Blend earthy mushroom spore tones with botanical mints
    const puffColor =
      i % 4 === 0
        ? 0x8b5a2b // Warm fungal spore brown
        : i % 4 === 1
          ? PALETTE.MINT_GREEN
          : i % 4 === 2
            ? 0xa0522d // Sienna mushroom dust
            : 0x84cc16; // Toxic lime

    g.ellipse(px, py, puffRx, puffRy).fill({
      color: puffColor,
      alpha: 0.16 * fade, // Decreased intensity
    });
  }

  // 2. Central dense toxic-mint core mist (static anchoring, no spinning orbits)
  for (let c = 0; c < 2; c++) {
    const ca = baseRot + (c * Math.PI);
    const cxOff = cx + Math.cos(ca) * (baseR * 0.12);
    const cyOff = cy + Math.sin(ca) * (baseR * 0.09);
    g.ellipse(cxOff, cyOff, baseR * 0.42, baseR * 0.32).fill({
      color: c === 0 ? 0xa3e635 : PALETTE.MINT_GREEN,
      alpha: 0.18 * fade, // Decreased intensity
    });
  }

  // 3. Floating luminescent spore bubbles & rising pollen motes
  const bubbleCount = 4;
  for (let b = 0; b < bubbleCount; b++) {
    const bCycle = (elapsedSeconds * 1.2 + seedId * 0.31 + b / bubbleCount) % 1;
    const bFade = Math.sin(bCycle * Math.PI) * fade;
    const ba = baseRot + (b / bubbleCount) * Math.PI * 2;
    const br = baseR * (0.22 + (b % 2) * 0.25);
    const bx = cx + Math.cos(ba) * br;
    const by = cy + Math.sin(ba) * (br * 0.75) - bCycle * 14;
    const bRad = (2.2 + (b % 2) * 1.2) * (0.7 + 0.3 * fade);

    g.circle(bx, by, bRad)
      .fill({
        color: b % 2 === 0 ? 0xd9f99d : PALETTE.MINT_GREEN,
        alpha: 0.65 * bFade,
      })
      .stroke({
        color: 0x065f46,
        width: 1.0,
        alpha: 0.5 * bFade,
      });
  }
}
