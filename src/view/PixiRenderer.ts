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
import { preloadPowerUpAtlas } from './PowerUpAtlas';
import {
  CHUNK_PX,
  CHUNK_SIZE_U,
  EnvironmentRenderer,
  PPU,
} from './renderers/EnvironmentRenderer';
import { HeroRenderer } from './renderers/HeroRenderer';
import { EnemyRenderer } from './renderers/EnemyRenderer';
import { WeaponEffectsRenderer } from './renderers/WeaponEffectsRenderer';
import {
  DynamicCamera,
  ZOOM_MAX,
  type CameraUpdateInput,
  type WorldBoundsPx,
} from './DynamicCamera';

export {
  DynamicCamera,
  ZOOM_MIN_COMBAT,
  ZOOM_MAX,
  ZOOM_MIN,
  COMBAT_ENTER_DIST,
  COMBAT_EXIT_DIST,
  ZOOM_IN_SPEED,
  ZOOM_OUT_SPEED,
  FOLLOW_SPEED,
  LOOK_AHEAD,
  ZOOM_OUT_DELAY,
} from './DynamicCamera';

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
  private pickupSpriteContainer = new PIXI.Container();

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

  // Shared Bestiary SpriteAtlas textures & Enemy/Pickup Sprite Pools
  private atlasTextures = new Map<SpriteKey, PIXI.Texture>();
  private readonly enemySpritePool: PIXI.Sprite[] = [];
  private readonly pickupSpritePool: PIXI.Sprite[] = [];

  // Smooth threat-aware Dynamic Camera & Preferences state
  public readonly camera = new DynamicCamera();
  private readonly cameraWorldBounds: WorldBoundsPx = {
    minX: -1824,
    maxX: 1824,
    minY: -1824,
    maxY: 1824,
  };
  private readonly cameraUpdateInput: CameraUpdateInput = {
    heroX: 0,
    heroY: 0,
    heroVx: 0,
    heroVy: 0,
    ppu: PPU,
    enemies: [],
    screenW: 1280,
    screenH: 800,
    dt: 0.016,
    worldBounds: this.cameraWorldBounds,
  };
  private lastSimInstance: Simulation | null = null;
  private displayFacingAngle = 0;
  private biomeId: BiomeId = 'garden';
  private reducedMotion = false;
  private showDamageNumbers = true;

  // Ground chunk cache (infinite tiling around camera, updated only when chunk coords change)
  private groundChunks = new Map<string, PIXI.Graphics>();
  private lastChunkCenterX = Number.NaN;
  private lastChunkCenterY = Number.NaN;
  private lastChunkRadius = 0;

  // Pre-allocated Object Pools
  private readonly particlePool: PooledParticle[] = [];
  private readonly floatingTextPool: PooledFloatingText[] = [];

  public async init(
    hostElement: HTMLElement,
    biomeId: BiomeId = 'garden',
    attachImmediately = false
  ): Promise<void> {
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
      autoStart: false,
    });
    app.ticker.stop();

    if (this.isDestroyed) {
      app.destroy(true);
      return;
    }

    this.app = app;
    this.isInitialized = true;
    app.canvas.dataset.testid = 'game-pixi-canvas';
    this.setupSceneGraph(app);
    if (attachImmediately) {
      hostElement.innerHTML = '';
      hostElement.appendChild(app.canvas);
    }
  }

  public attachCanvas(hostElement: HTMLElement | null): void {
    if (!this.app || !this.isInitialized || !hostElement) return;
    if (!hostElement.contains(this.app.canvas)) {
      hostElement.innerHTML = '';
      hostElement.appendChild(this.app.canvas);
    }
    const w = Math.max(320, hostElement.clientWidth || window.innerWidth || 1280);
    const h = Math.max(240, hostElement.clientHeight || window.innerHeight || 800);
    if (this.app.screen.width !== w || this.app.screen.height !== h) {
      this.app.renderer.resize(w, h);
    }
  }

  public suspendAndDetachCanvas(): void {
    if (!this.app) return;
    this.app.ticker.stop();
    if (this.app.canvas && this.app.canvas.parentNode) {
      this.app.canvas.parentNode.removeChild(this.app.canvas);
    }
  }

  private setupSceneGraph(app: PIXI.Application): void {
    // Load Bestiary SpriteAtlas textures
    this.atlasTextures = getSharedSpriteAtlasTextures();
    const defaultHeroTex = this.atlasTextures.get('hero_warden');
    if (defaultHeroTex) {
      this.heroSprite.texture = defaultHeroTex;
    }
    this.heroSprite.anchor.set(0.5, 0.56);

    void preloadPowerUpAtlas();

    // Assemble Z-ordered scene graph
    this.worldContainer.addChild(
      this.groundChunkContainer,
      this.decalGraphic,
      this.telegraphGraphic,
      this.pickupGraphic,
      this.pickupSpriteContainer,
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
    this.lastChunkCenterX = Number.NaN;
    this.lastChunkCenterY = Number.NaN;
    this.lastChunkRadius = 0;
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
    if (amount >= 0.15) {
      this.camera.addZoomPunch(clamp(amount * 0.12, 0.015, 0.055));
    }
  }

  public triggerScreenShake(amplitudePx: number, durationSec = 0.14): void {
    if (this.reducedMotion) return;
    this.camera.triggerShake(amplitudePx, durationSec);
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

    if (this.lastSimInstance !== sim) {
      this.lastSimInstance = sim;
      const startZoom = screenW < 500 ? ZOOM_MAX * 0.92 : ZOOM_MAX;
      this.camera.reset(interpHeroX * PPU, interpHeroY * PPU, startZoom);
    }

    // 2. Smooth Threat-Aware Dynamic Camera (Follow, Dead-Zone, Look-Ahead, Hysteresis Zoom, World Bounds)
    const arenaCenterPxX = sim.arenaCenterX * PPU;
    const arenaCenterPxY = sim.arenaCenterY * PPU;
    const heroDistFromCenterPx = Math.max(
      Math.abs(interpHeroX * PPU - arenaCenterPxX),
      Math.abs(interpHeroY * PPU - arenaCenterPxY)
    );
    const halfWorldPx = Math.max(1824, heroDistFromCenterPx + 640);
    this.cameraWorldBounds.minX = arenaCenterPxX - halfWorldPx;
    this.cameraWorldBounds.maxX = arenaCenterPxX + halfWorldPx;
    this.cameraWorldBounds.minY = arenaCenterPxY - halfWorldPx;
    this.cameraWorldBounds.maxY = arenaCenterPxY + halfWorldPx;

    const camIn = this.cameraUpdateInput;
    camIn.heroX = interpHeroX;
    camIn.heroY = interpHeroY;
    camIn.heroVx = sim.heroVx;
    camIn.heroVy = sim.heroVy;
    camIn.ppu = PPU;
    camIn.enemies = sim.enemies;
    camIn.screenW = screenW;
    camIn.screenH = screenH;
    camIn.dt = dtSec;
    this.camera.update(camIn);

    this.worldContainer.scale.set(this.camera.zoom);
    this.worldContainer.position.set(this.camera.stageX, this.camera.stageY);

    // 3. Update Infinite Ground Chunks around Camera (zero per-frame allocation when chunk center unchanged)
    this.updateGroundChunks(
      this.camera.x / PPU,
      this.camera.y / PPU,
      this.camera.zoom
    );

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
    WeaponEffectsRenderer.drawPickups(
      this.pickupGraphic,
      sim,
      this.pickupSpriteContainer,
      this.pickupSpritePool
    );
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

    // 7. Explicitly flush the WebGL frame (since app.ticker is stopped for manual loop control)
    this.app.render();
  }

  private updateGroundChunks(
    camWorldX: number,
    camWorldY: number,
    zoom: number
  ): void {
    const centerChunkX = Math.floor(camWorldX / CHUNK_SIZE_U);
    const centerChunkY = Math.floor(camWorldY / CHUNK_SIZE_U);
    const chunkRadius = zoom < 0.95 ? 3 : 2;

    if (
      centerChunkX === this.lastChunkCenterX &&
      centerChunkY === this.lastChunkCenterY &&
      chunkRadius === this.lastChunkRadius &&
      this.groundChunks.size > 0
    ) {
      return;
    }

    this.lastChunkCenterX = centerChunkX;
    this.lastChunkCenterY = centerChunkY;
    this.lastChunkRadius = chunkRadius;

    for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
      for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
        const cx = centerChunkX + dx;
        const cy = centerChunkY + dy;
        const key = `${cx},${cy}`;

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
      const sep = key.indexOf(',');
      const cx = Number(key.slice(0, sep));
      const cy = Number(key.slice(sep + 1));
      if (
        Math.abs(cx - centerChunkX) > chunkRadius ||
        Math.abs(cy - centerChunkY) > chunkRadius
      ) {
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
      this.app.destroy(
        { removeView: true, releaseGlobalResources: false },
        { children: true }
      );
      this.app = null;
    }
    this.isInitialized = false;
  }
}

export { PixiGameRenderer as PixiRenderer };
