/**
 * PixiJS v8 2D Top-Down Tactical Renderer ("Cozy Crisp" Art Direction)
 * Layer 4 (view): Coordinates camera, object pools, Bestiary SpriteAtlas textures,
 * and delegates feature rendering to modular renderers under `./renderers/`.
 */

import * as PIXI from 'pixi.js';
import { clamp, lerp, slerpAngle } from '../core/math/vec2';
import { PALETTE } from '../content/data/catalog';
import type { BiomeId } from '../content/schema/types';
import type { Simulation } from '../sim/Simulation';
import {
  getSharedSpriteAtlasTextures,
  type SpriteKey,
} from './SpriteAtlas';
import {
  CHUNK_PX,
  CHUNK_SIZE_U,
  EnvironmentRenderer,
  PPU,
} from './renderers/EnvironmentRenderer';
import { HeroRenderer } from './renderers/HeroRenderer';
import { EnemyRenderer } from './renderers/EnemyRenderer';
import { WeaponEffectsRenderer } from './renderers/WeaponEffectsRenderer';

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: number;
  life: number;
  maxLife: number;
  isPetal: boolean;
}

interface PooledFloatingText {
  active: boolean;
  textObj: PIXI.Text;
  worldX: number;
  worldY: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface RendererPreferences {
  reducedMotion: boolean;
  showDamageNumbers: boolean;
  bloomIntensity?: number;
  biome: BiomeId;
}

export class PixiGameRenderer {
  public app: PIXI.Application | null = null;
  private isInitialized = false;
  private isDestroyed = false;

  // Scene Graph Containers
  private worldContainer = new PIXI.Container();
  private groundChunkContainer = new PIXI.Container();
  private decalGraphic = new PIXI.Graphics();
  private telegraphGraphic = new PIXI.Graphics();
  private pickupGraphic = new PIXI.Graphics();

  // Enemy layers: Under-graphics (shadows + animated legs) -> Bestiary Sprites -> Overlays (cheeks/mouth, debuffs, HP)
  private enemyUnderGraphic = new PIXI.Graphics();
  private enemySpriteContainer = new PIXI.Container();
  private enemyOverlayGraphic = new PIXI.Graphics();

  // Hero layers: Under-graphics (shadow, Ember Guard, animated legs, Angel Wings) -> Bestiary Hero Sprite -> Articulated Arm + Weapons
  private heroUnderGraphic = new PIXI.Graphics();
  private heroSprite = new PIXI.Sprite();
  private heroWeaponGraphic = new PIXI.Graphics();

  private projectileGraphic = new PIXI.Graphics();
  private fxGraphic = new PIXI.Graphics();
  private particleGraphic = new PIXI.Graphics();
  private floatingTextContainer = new PIXI.Container();
  private screenOverlayGraphic = new PIXI.Graphics();
  private joystickGraphic = new PIXI.Graphics();

  // Shared Bestiary SpriteAtlas textures & Enemy Sprite Pool
  private atlasTextures = new Map<SpriteKey, PIXI.Texture>();
  private readonly enemySpritePool: PIXI.Sprite[] = [];

  // Camera & Preferences state
  private camX = 0;
  private camY = 0;
  private shakeTimer = 0;
  private shakeAmplitudePx = 0;
  private displayFacingAngle = 0;
  private biomeId: BiomeId = 'garden';
  private reducedMotion = false;
  private showDamageNumbers = true;

  // Ground chunk cache (3x3 infinite tiling around camera)
  private groundChunks = new Map<string, PIXI.Graphics>();

  // Pre-allocated Object Pools
  private readonly particlePool: PooledParticle[] = [];
  private readonly floatingTextPool: PooledFloatingText[] = [];

  public async init(hostElement: HTMLElement, biomeId: BiomeId = 'garden'): Promise<void> {
    this.biomeId = biomeId;
    const app = new PIXI.Application();
    await app.init({
      resizeTo: hostElement,
      backgroundColor:
        biomeId === 'dungeon'
          ? 0x141624
          : biomeId === 'sakura_grove'
            ? 0x231729
            : biomeId === 'sunlit_oasis'
              ? 0x262114
              : PALETTE.DEEP_SLATE,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    if (this.isDestroyed) {
      app.destroy(true);
      return;
    }

    this.app = app;
    this.isInitialized = true;
    hostElement.innerHTML = '';
    hostElement.appendChild(app.canvas);

    // Load Bestiary SpriteAtlas textures
    this.atlasTextures = getSharedSpriteAtlasTextures();
    const defaultHeroTex = this.atlasTextures.get('hero_warden');
    if (defaultHeroTex) {
      this.heroSprite.texture = defaultHeroTex;
    }
    this.heroSprite.anchor.set(0.5, 0.56);

    // Assemble Z-ordered scene graph
    this.worldContainer.addChild(
      this.groundChunkContainer,
      this.decalGraphic,
      this.telegraphGraphic,
      this.pickupGraphic,
      this.enemyUnderGraphic,
      this.enemySpriteContainer,
      this.enemyOverlayGraphic,
      this.heroUnderGraphic,
      this.heroSprite,
      this.heroWeaponGraphic,
      this.projectileGraphic,
      this.fxGraphic,
      this.particleGraphic,
      this.floatingTextContainer
    );

    app.stage.addChild(
      this.worldContainer,
      this.screenOverlayGraphic,
      this.joystickGraphic
    );

    // Pre-allocate 150 particles
    for (let i = 0; i < 150; i++) {
      this.particlePool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 4,
        color: PALETTE.CREAM_WHITE,
        life: 0,
        maxLife: 0.4,
        isPetal: false,
      });
    }

    // Pre-allocate 45 Floating Damage/Callout Text nodes
    for (let i = 0; i < 45; i++) {
      const textObj = new PIXI.Text({
        text: '',
        style: {
          fontFamily: '"Fredoka", "Plus Jakarta Sans", sans-serif',
          fontSize: 18,
          fontWeight: '800',
          fill: PALETTE.CREAM_WHITE,
          stroke: { color: PALETTE.INK_OUTLINE, width: 4 },
        },
      });
      textObj.anchor.set(0.5);
      textObj.visible = false;
      this.floatingTextContainer.addChild(textObj);
      this.floatingTextPool.push({
        active: false,
        textObj,
        worldX: 0,
        worldY: 0,
        vy: -36,
        life: 0,
        maxLife: 0.65,
      });
    }
  }

  public setPreferences(prefs: RendererPreferences): void {
    this.reducedMotion = prefs.reducedMotion;
    this.showDamageNumbers = prefs.showDamageNumbers;
    this.setBiome(prefs.biome);
  }

  public setBiome(biomeId: BiomeId): void {
    if (this.biomeId === biomeId) return;
    this.biomeId = biomeId;
    for (const g of this.groundChunks.values()) {
      g.destroy();
    }
    this.groundChunks.clear();
    if (this.app) {
      this.app.renderer.background.color =
        biomeId === 'dungeon'
          ? 0x141624
          : biomeId === 'sakura_grove'
            ? 0x231729
            : biomeId === 'sunlit_oasis'
              ? 0x262114
              : PALETTE.DEEP_SLATE;
    }
  }

  public addTrauma(amount: number): void {
    if (this.reducedMotion) return;
    const amp = clamp(amount * 18, 2, 14);
    this.triggerScreenShake(amp, 0.14);
  }

  public triggerScreenShake(amplitudePx: number, durationSec = 0.14): void {
    if (this.reducedMotion) return;
    if (amplitudePx >= this.shakeAmplitudePx || this.shakeTimer <= 0) {
      this.shakeAmplitudePx = amplitudePx;
      this.shakeTimer = durationSec;
    }
  }

  public spawnParticleBurst(
    worldX: number,
    worldY: number,
    color: number,
    count = 8
  ): void {
    this.spawnBurstParticles(worldX, worldY, color, count, true);
  }

  public spawnGoldenPetalBurst(
    worldX: number,
    worldY: number,
    count = 7
  ): void {
    this.spawnBurstParticles(worldX, worldY, PALETTE.GOLD_STAR, count, true);
  }

  public spawnBurstParticles(
    worldX: number,
    worldY: number,
    color: number,
    count = 8,
    isPetal = true
  ): void {
    let spawned = 0;
    for (const p of this.particlePool) {
      if (p.active) continue;
      const angle = (spawned / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 45 + Math.random() * 85;
      p.active = true;
      p.x = worldX * PPU;
      p.y = worldY * PPU;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 18;
      p.size = isPetal ? 5 + Math.random() * 3.5 : 3.5 + Math.random() * 2.5;
      p.color = color;
      p.maxLife = 0.32 + Math.random() * 0.22;
      p.life = p.maxLife;
      p.isPetal = isPetal;
      spawned++;
      if (spawned >= count) break;
    }
  }

  public spawnFloatingDamage(
    worldX: number,
    worldY: number,
    damage: number,
    isCrit = false,
    customText?: string,
    customColor?: number,
    customScale?: number
  ): void {
    if (!this.showDamageNumbers) return;

    const rawText = customText ?? `${Math.round(damage)}`;
    // Remove any leading '+' or '-' sign from numeric damage notifications above enemies
    const sanitizedText = /^(\+|-)?\d+$/.test(rawText.trim())
      ? rawText.trim().replace(/^[+-]/, '')
      : rawText;

    let slot = this.floatingTextPool.find((f) => !f.active);
    if (!slot) {
      slot = this.floatingTextPool[0]!;
    }
    slot.active = true;
    slot.worldX = worldX * PPU + (Math.random() - 0.5) * 18;
    slot.worldY = worldY * PPU - 16;
    slot.vy = isCrit ? -58 : customScale && customScale < 0.85 ? -26 : -40;
    slot.maxLife = isCrit ? 0.85 : customScale && customScale < 0.85 ? 0.5 : 0.62;
    slot.life = slot.maxLife;

    slot.textObj.text = sanitizedText;
    slot.textObj.style.fill =
      customColor ?? (isCrit ? PALETTE.BUTTER_YELLOW : PALETTE.CREAM_WHITE);
    slot.textObj.style.fontSize = isCrit
      ? 23
      : customScale
        ? Math.max(11, Math.round(18 * customScale))
        : 18;
    slot.textObj.scale.set(customScale ?? (isCrit ? 1.25 : 1.0));
    slot.textObj.alpha = 1;
    slot.textObj.visible = true;
  }

  /**
   * Main per-frame render entry point called by App.tsx
   */
  public renderFrame(params: {
    sim: Simulation;
    alpha: number;
    dtSec: number;
    joystick: {
      active: boolean;
      anchorX: number;
      anchorY: number;
      knobX: number;
      knobY: number;
      maxRadiusPx: number;
    };
    resumeCountdownRatio: number;
    isTitleMode: boolean;
  }): void {
    this.render(params.sim, params.alpha, params.dtSec, {
      active: params.joystick.active,
      originX: params.joystick.anchorX,
      originY: params.joystick.anchorY,
      currentX: params.joystick.knobX,
      currentY: params.joystick.knobY,
      isDashFlick: false,
    });
  }

  public render(
    sim: Simulation,
    alpha: number,
    dtSec: number,
    joystickState: {
      active: boolean;
      originX: number;
      originY: number;
      currentX: number;
      currentY: number;
      isDashFlick: boolean;
    }
  ): void {
    if (!this.isInitialized || !this.app) return;

    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;

    // 1. Interpolate Hero world position & smooth facing slerp
    const interpHeroX = lerp(sim.heroPrevX, sim.heroX, alpha);
    const interpHeroY = lerp(sim.heroPrevY, sim.heroY, alpha);
    this.displayFacingAngle = slerpAngle(
      this.displayFacingAngle,
      sim.heroFacingAngle,
      Math.min(1, dtSec * 18)
    );

    // 2. Smooth Camera Follow + Screen Shake
    const targetCamX = interpHeroX * PPU + sim.heroVx * 8;
    const targetCamY = interpHeroY * PPU + sim.heroVy * 8;
    const camFollowFactor = 1 - Math.exp(-10 * dtSec);
    this.camX = lerp(this.camX, targetCamX, camFollowFactor);
    this.camY = lerp(this.camY, targetCamY, camFollowFactor);

    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dtSec);
      const decay = this.shakeTimer / 0.14;
      shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeAmplitudePx * decay;
      shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeAmplitudePx * decay;
    }

    const zoom = screenW < 500 ? 0.88 : 1.0;
    this.worldContainer.scale.set(zoom);
    this.worldContainer.position.set(
      screenW / 2 - this.camX * zoom + shakeOffsetX,
      screenH / 2 - this.camY * zoom + shakeOffsetY
    );

    // 3. Update 3x3 Infinite Ground Chunks around Camera
    this.updateGroundChunks(interpHeroX, interpHeroY);

    // 4. Delegate Feature Rendering to Modular Renderers
    this.decalGraphic.clear();
    this.telegraphGraphic.clear();
    this.pickupGraphic.clear();
    this.projectileGraphic.clear();
    this.fxGraphic.clear();

    EnvironmentRenderer.drawFinalBossThornArena(
      this.decalGraphic,
      sim,
      sim.elapsedSeconds
    );
    WeaponEffectsRenderer.drawGroundHazards(this.decalGraphic, sim);
    WeaponEffectsRenderer.drawPickups(this.pickupGraphic, sim);
    EnemyRenderer.drawEnemies(
      this.enemyUnderGraphic,
      this.enemySpriteContainer,
      this.enemySpritePool,
      this.enemyOverlayGraphic,
      this.telegraphGraphic,
      this.atlasTextures,
      sim,
      alpha
    );
    HeroRenderer.drawHero(
      this.heroUnderGraphic,
      this.heroSprite,
      this.heroWeaponGraphic,
      this.atlasTextures,
      sim,
      alpha,
      this.displayFacingAngle
    );
    WeaponEffectsRenderer.drawProjectiles(this.projectileGraphic, sim, alpha);
    WeaponEffectsRenderer.drawOrbitingPetalsAndVisualEffects(
      this.fxGraphic,
      this.decalGraphic,
      sim,
      alpha
    );

    // 5. Update & Draw Pooled Particles & Floating Text
    this.updateAndDrawParticles(dtSec);
    this.updateFloatingTexts(dtSec);

    // 6. Screen Overlays (Low-HP vignette, Death/Victory fade, Touch Joystick)
    this.drawScreenOverlays(sim, screenW, screenH, joystickState);
  }

  private updateGroundChunks(heroX: number, heroY: number): void {
    const centerChunkX = Math.floor(heroX / CHUNK_SIZE_U);
    const centerChunkY = Math.floor(heroY / CHUNK_SIZE_U);
    const neededKeys = new Set<string>();

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const cx = centerChunkX + dx;
        const cy = centerChunkY + dy;
        const key = `${cx},${cy}`;
        neededKeys.add(key);

        if (!this.groundChunks.has(key)) {
          const g = new PIXI.Graphics();
          EnvironmentRenderer.populateGroundChunk(g, cx, cy, this.biomeId);
          g.position.set(cx * CHUNK_PX, cy * CHUNK_PX);
          this.groundChunkContainer.addChild(g);
          this.groundChunks.set(key, g);
        }
      }
    }

    for (const [key, g] of this.groundChunks.entries()) {
      if (!neededKeys.has(key)) {
        this.groundChunkContainer.removeChild(g);
        g.destroy();
        this.groundChunks.delete(key);
      }
    }
  }

  private updateAndDrawParticles(dt: number): void {
    const g = this.particleGraphic;
    g.clear();

    for (const p of this.particlePool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;

      const alpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.isPetal) {
        g.ellipse(p.x, p.y, p.size * 1.25, p.size * 0.75)
          .fill({ color: p.color, alpha })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5, alpha });
      } else {
        g.circle(p.x, p.y, p.size).fill({ color: p.color, alpha });
      }
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (const f of this.floatingTextPool) {
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.active = false;
        f.textObj.visible = false;
        continue;
      }

      f.worldY += f.vy * dt;
      f.vy *= 0.94;
      f.textObj.position.set(f.worldX, f.worldY);
      f.textObj.alpha = clamp((f.life / f.maxLife) * 1.4, 0, 1);
    }
  }

  private drawScreenOverlays(
    sim: Simulation,
    screenW: number,
    screenH: number,
    joystickState: {
      active: boolean;
      originX: number;
      originY: number;
      currentX: number;
      currentY: number;
      isDashFlick: boolean;
    }
  ): void {
    this.screenOverlayGraphic.clear();
    this.joystickGraphic.clear();

    // Low HP pulse vignette (< 25% HP) or Outside Final Boss Thorn Arena bleed warning
    const hpRatio = sim.currentHp / Math.max(1, sim.maxHp);
    if ((hpRatio < 0.25 && sim.currentHp > 0) || sim.isOutsideArena) {
      const pulse =
        (sim.isOutsideArena ? 0.24 : 0.14) +
        0.1 * Math.sin(sim.elapsedSeconds * (sim.isOutsideArena ? 11 : 7));
      this.screenOverlayGraphic
        .rect(0, 0, screenW, screenH)
        .stroke({ color: PALETTE.CRIMSON_WARN, width: 28, alpha: pulse });
    }

    // Smooth fade into Game Over screen during Hero Death Grave sequence (last 45% of timer)
    if (sim.deathSequenceTimer > 0) {
      const deathProgress = clamp(1 - sim.deathSequenceTimer / 1.65, 0, 1);
      if (deathProgress > 0.45) {
        const fadeAlpha = clamp(((deathProgress - 0.45) / 0.55) * 0.78, 0, 0.78);
        this.screenOverlayGraphic
          .rect(0, 0, screenW, screenH)
          .fill({ color: 0x090b10, alpha: fadeAlpha });
      }
    }

    // Smooth golden-white fade into Winning Game Over screen during Angel Wings ascension (after Final Boss death finishes)
    if (sim.victorySequenceTimer > 0 && sim.bossDeathTimer <= 0) {
      const winProgress = clamp(1 - sim.victorySequenceTimer / 1.1, 0, 1);
      if (winProgress > 0.48) {
        const fadeAlpha = clamp(((winProgress - 0.48) / 0.52) * 0.72, 0, 0.72);
        this.screenOverlayGraphic
          .rect(0, 0, screenW, screenH)
          .fill({ color: PALETTE.CREAM_WHITE, alpha: fadeAlpha });
      }
    }

    // Floating Touch Joystick Ring
    if (joystickState.active) {
      const ox = joystickState.originX;
      const oy = joystickState.originY;
      const cx = joystickState.currentX;
      const cy = joystickState.currentY;
      const dx = cx - ox;
      const dy = cy - oy;
      const dist = Math.hypot(dx, dy);
      const maxVisualR = 56;
      const clampedX = dist > maxVisualR ? ox + (dx / dist) * maxVisualR : cx;
      const clampedY = dist > maxVisualR ? oy + (dy / dist) * maxVisualR : cy;

      this.joystickGraphic
        .circle(ox, oy, maxVisualR)
        .fill({ color: PALETTE.DEEP_SLATE, alpha: 0.35 })
        .stroke({
          color: joystickState.isDashFlick ? PALETTE.BUTTER_YELLOW : PALETTE.CREAM_WHITE,
          width: 2.5,
          alpha: 0.55,
        });

      this.joystickGraphic
        .circle(clampedX, clampedY, 20)
        .fill({
          color: joystickState.isDashFlick ? PALETTE.BUTTER_YELLOW : PALETTE.MINT_GREEN,
          alpha: 0.8,
        })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 3, alpha: 0.85 });
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
    this.isInitialized = false;
  }
}

export { PixiGameRenderer as PixiRenderer };
