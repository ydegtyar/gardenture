/**
 * @file MenuScene.ts
 * Fully standalone PixiJS v8 renderer for the Title/Menu screen.
 *
 * Isolation guarantees:
 * 1. Own `new Application()` and own `<canvas>` element inside `#menu-root`.
 * 2. Own `app.ticker` (never `Ticker.shared` or game loop).
 * 3. Own asset bundle namespace (`menu-sakura-twilight-bundle`) unloaded on teardown.
 * 4. Zero imports from `game/`, `sim/`, `view/`, `content/`, or `app/context/`.
 * 5. Own GPU context and per-instance `BlurFilter`s; never mutates global Pixi settings.
 * 6. Idempotent `mount()` / `unmount()` safe under React StrictMode and 20x stress cycles.
 */

import {
  Application,
  Assets,
  BlurFilter,
  Container,
  Graphics,
  Texture,
} from 'pixi.js';
import {
  MenuEventBus,
  MenuQualityMonitor,
  type MenuQualityTier,
} from './menuEventBus';

export const MENU_ASSET_BUNDLE_ID = 'menu-sakura-twilight-bundle';

interface SakuraPetalNode {
  g: Graphics;
  nx: number;
  ny: number;
  vx: number;
  vy: number;
  rotSpeed: number;
  baseScale: number;
  phase: number;
  isBokeh: boolean;
}

interface FireflyNode {
  g: Graphics;
  nx: number;
  ny: number;
  baseNx: number;
  baseNy: number;
  phase: number;
  speed: number;
  isLime: boolean;
  radius: number;
}

interface BigFlowerNode {
  root: Container;
  head: Graphics;
  nx: number;
  ny: number;
  scale: number;
  phase: number;
  hasFilamentCenter: boolean;
}

interface SproutCreatureNode {
  root: Container;
  shadow: Graphics;
  body: Graphics;
  nx: number;
  ny: number;
  phase: number;
  scale: number;
}

export interface MenuSceneDiagnostics {
  mounted: boolean;
  initializing: boolean;
  qualityTier: MenuQualityTier;
  avgFrameMs: number;
  activeListeners: number;
  activeTextures: number;
  tickerRunning: boolean;
}

export interface GlobalMenuDiagnostics {
  activeInstances: number;
  totalMounts: number;
  totalUnmounts: number;
  activeListeners: number;
  activeTextures: number;
}

const globalTracker: GlobalMenuDiagnostics = {
  activeInstances: 0,
  totalMounts: 0,
  totalUnmounts: 0,
  activeListeners: 0,
  activeTextures: 0,
};

export interface MenuSceneOptions {
  bus?: MenuEventBus;
  initialQuality?: MenuQualityTier;
  transitionDurationMs?: number;
  onFallbackRequired?: (reason: string) => void;
}

export class MenuScene {
  public readonly bus: MenuEventBus;
  public readonly qualityMonitor: MenuQualityMonitor;

  private app: Application | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private hostEl: HTMLElement | null = null;

  private isMounted = false;
  private isInitializing = false;
  private mountGeneration = 0;

  private readonly transitionDurationMs: number;
  private isTransitioning = false;
  private transitionElapsedMs = 0;
  private transitionMode: 'new' | 'resume' = 'new';

  private readonly onFallbackRequired?: (reason: string) => void;

  // Scene graph containers (owned exclusively by this MenuScene instance)
  private rootContainer: Container | null = null;
  private bgGraphic: Graphics | null = null;
  private groundPatchesGraphic: Graphics | null = null;
  private bokehPetalContainer: Container | null = null;
  private actorsContainer: Container | null = null;
  private crispPetalContainer: Container | null = null;
  private fireflyContainer: Container | null = null;
  private coinGraphic: Graphics | null = null;
  private vignetteGraphic: Graphics | null = null;

  // Per-instance filters (never shared with game renderer)
  private bokehBlurFilter: BlurFilter | null = null;
  private fireflyBlurFilter: BlurFilter | null = null;

  // Owned procedural textures & actor nodes
  private ownedTextures: Texture[] = [];
  private petals: SakuraPetalNode[] = [];
  private fireflies: FireflyNode[] = [];
  private bigFlowers: BigFlowerNode[] = [];
  private sprouts: SproutCreatureNode[] = [];

  // Pointer parallax state
  private pointerNormX = 0;
  private pointerNormY = 0;
  private smoothParallaxX = 0;
  private smoothParallaxY = 0;
  private elapsedSec = 0;

  // Bound listener cleanup array
  private cleanupListeners: Array<() => void> = [];
  private unsubBusStart: (() => void) | null = null;

  constructor(options: MenuSceneOptions = {}) {
    this.bus = options.bus ?? new MenuEventBus();
    this.qualityMonitor = new MenuQualityMonitor(options.initialQuality ?? 'high');
    this.transitionDurationMs = options.transitionDurationMs ?? 180;
    this.onFallbackRequired = options.onFallbackRequired;
  }

  public static getGlobalDiagnostics(): GlobalMenuDiagnostics {
    return { ...globalTracker };
  }

  public static resetGlobalDiagnostics(): void {
    globalTracker.activeInstances = 0;
    globalTracker.totalMounts = 0;
    globalTracker.totalUnmounts = 0;
    globalTracker.activeListeners = 0;
    globalTracker.activeTextures = 0;
  }

  public getDiagnostics(): MenuSceneDiagnostics {
    return {
      mounted: this.isMounted,
      initializing: this.isInitializing,
      qualityTier: this.qualityMonitor.getTier(),
      avgFrameMs: this.qualityMonitor.getAverageFrameMs(),
      activeListeners: this.cleanupListeners.length,
      activeTextures: this.ownedTextures.length,
      tickerRunning: Boolean(this.app?.ticker?.started),
    };
  }

  public setQualityTier(tier: MenuQualityTier): void {
    this.qualityMonitor.setTier(tier);
    this.applyQualityBudget();
    this.bus.emit('menu:qualityChanged', {
      tier,
      avgFrameMs: this.qualityMonitor.getAverageFrameMs(),
    });
  }

  private getViewportDimensions(container?: HTMLElement | null): { width: number; height: number } {
    const el = container ?? this.hostEl;
    const w = Math.max(
      320,
      el?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280) || 1280
    );
    const h = Math.max(
      240,
      el?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 800) || 800
    );
    return { width: w, height: h };
  }

  /**
   * Mounts the standalone PixiJS Application and `<canvas>` into `container`.
   * Idempotent and safe under React StrictMode double-invocation.
   */
  public async mount(container: HTMLElement): Promise<boolean> {
    if (this.isMounted && this.hostEl === container) {
      return true;
    }
    if (this.isMounted || this.isInitializing) {
      await this.unmount();
    }

    const myGen = ++this.mountGeneration;
    this.isInitializing = true;
    this.hostEl = container;

    // Subscribe to menu:start on the internal bus
    this.unsubBusStart?.();
    this.unsubBusStart = this.bus.on('menu:start', ({ mode }) => {
      this.startExitTransition(mode);
    });

    try {
      // Register dedicated menu-* asset bundle namespace
      Assets.addBundle(MENU_ASSET_BUNDLE_ID, {});
      await Assets.loadBundle(MENU_ASSET_BUNDLE_ID);

      // In headless / non-WebGL test environments (e.g. Node unit tests without HTMLCanvasElement WebGL),
      // verify canvas & WebGL availability before booting Pixi Application
      if (typeof document === 'undefined' || typeof window === 'undefined' || !container) {
        this.isInitializing = false;
        this.onFallbackRequired?.('Non-DOM environment');
        return false;
      }

      const canvas = document.createElement('canvas');
      canvas.dataset.testid = 'menu-pixi-canvas';
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      const budget = this.qualityMonitor.getBudget();
      const { width, height } = this.getViewportDimensions(container);
      const resolution = Math.min(window.devicePixelRatio || 1, budget.resolutionCap);

      const app = new Application();
      await app.init({
        canvas,
        width,
        height,
        backgroundColor: 0x1e1226,
        antialias: true,
        resolution,
        autoDensity: true,
        autoStart: false,
      });

      // If unmount() was called while app.init() was awaiting (React StrictMode), tear down immediately
      if (myGen !== this.mountGeneration) {
        try {
          app.stage.removeChildren();
          app.ticker.stop();
          app.destroy(
            { removeView: true, releaseGlobalResources: false },
            { children: true, texture: true }
          );
          await Assets.unloadBundle(MENU_ASSET_BUNDLE_ID);
        } catch {
          // Ignore teardown error on aborted mount
        }
        return false;
      }

      this.app = app;
      this.canvasEl = canvas;
      this.isInitializing = false;
      this.isMounted = true;
      globalTracker.activeInstances++;
      globalTracker.totalMounts++;

      container.innerHTML = '';
      container.appendChild(canvas);

      const postMountDims = this.getViewportDimensions(container);
      if (postMountDims.width !== width || postMountDims.height !== height) {
        app.renderer.resize(postMountDims.width, postMountDims.height);
      }

      this.buildSceneGraph(postMountDims.width, postMountDims.height);
      this.attachDomListeners(container, canvas);

      // Own ticker only
      app.ticker.add(this.handleTick);
      app.ticker.start();
      return true;
    } catch (err) {
      this.isInitializing = false;
      this.isMounted = false;
      const reason = err instanceof Error ? err.message : 'WebGL initialization failed';
      this.onFallbackRequired?.(reason);
      return false;
    }
  }

  /**
   * Unmounts the menu renderer, stops its ticker, removes all listeners,
   * destroys its PixiJS Application and textures, unloads the `menu-*` bundle,
   * and removes the `<canvas>` from the DOM.
   */
  public async unmount(): Promise<void> {
    this.mountGeneration++;
    this.isInitializing = false;
    this.isTransitioning = false;

    if (this.unsubBusStart) {
      this.unsubBusStart();
      this.unsubBusStart = null;
    }

    // Remove all DOM/window listeners & ResizeObserver
    while (this.cleanupListeners.length > 0) {
      const cleanup = this.cleanupListeners.pop();
      try {
        cleanup?.();
      } catch {
        // Ignore
      }
      globalTracker.activeListeners = Math.max(0, globalTracker.activeListeners - 1);
    }

    // Destroy owned procedural textures
    while (this.ownedTextures.length > 0) {
      const tex = this.ownedTextures.pop();
      try {
        tex?.destroy(true);
      } catch {
        // Ignore
      }
      globalTracker.activeTextures = Math.max(0, globalTracker.activeTextures - 1);
    }

    // Clear actor arrays
    this.petals.length = 0;
    this.fireflies.length = 0;
    this.bigFlowers.length = 0;
    this.sprouts.length = 0;

    // Detach and destroy per-instance filters before destroying containers
    if (this.bokehPetalContainer) {
      this.bokehPetalContainer.filters = [];
    }
    if (this.fireflyContainer) {
      this.fireflyContainer.filters = [];
    }
    try {
      this.bokehBlurFilter?.destroy();
      this.fireflyBlurFilter?.destroy();
    } catch {
      // Ignore
    }
    this.bokehBlurFilter = null;
    this.fireflyBlurFilter = null;

    // Destroy scene graph Graphics/Containers with `context: true, texture: false`
    // before `app.destroy` so Pixi v8's internal `Texture.WHITE` (referenced by Graphics fills)
    // is never nulled out.
    if (this.rootContainer) {
      try {
        if (this.rootContainer.parent) {
          this.rootContainer.parent.removeChild(this.rootContainer);
        }
        this.rootContainer.destroy({ children: true, texture: false, context: true });
      } catch {
        // Ignore
      }
      this.rootContainer = null;
    }
    this.bgGraphic = null;
    this.groundPatchesGraphic = null;
    this.bokehPetalContainer = null;
    this.actorsContainer = null;
    this.crispPetalContainer = null;
    this.fireflyContainer = null;
    this.coinGraphic = null;
    this.vignetteGraphic = null;

    // Stop own ticker and destroy own Application without wiping global Pixi pools
    if (this.app) {
      const appToDestroy = this.app;
      this.app = null;
      try {
        appToDestroy.ticker.remove(this.handleTick);
        appToDestroy.ticker.stop();
        appToDestroy.destroy(
          { removeView: true, releaseGlobalResources: false },
          { children: true, texture: true }
        );
      } catch {
        // Ignore if already destroyed
      }
    }

    if (this.canvasEl && this.canvasEl.parentNode) {
      this.canvasEl.parentNode.removeChild(this.canvasEl);
    }
    this.canvasEl = null;
    this.hostEl = null;

    if (this.isMounted) {
      this.isMounted = false;
      globalTracker.activeInstances = Math.max(0, globalTracker.activeInstances - 1);
      globalTracker.totalUnmounts++;
    }

    try {
      await Assets.unloadBundle(MENU_ASSET_BUNDLE_ID);
    } catch {
      // Ignore if bundle was not loaded
    }
  }

  public startExitTransition(mode: 'new' | 'resume' = 'new'): void {
    if (!this.isMounted || !this.app) {
      this.bus.emit('scene:transitionDone', { mode });
      return;
    }
    if (this.transitionDurationMs <= 0) {
      this.bus.emit('scene:transitionDone', { mode });
      return;
    }
    this.isTransitioning = true;
    this.transitionElapsedMs = 0;
    this.transitionMode = mode;
  }

  private attachDomListeners(container: HTMLElement, canvas: HTMLCanvasElement): void {
    const addManagedListener = (
      target: EventTarget,
      type: string,
      handler: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) => {
      target.addEventListener(type, handler, options);
      globalTracker.activeListeners++;
      this.cleanupListeners.push(() => {
        target.removeEventListener(type, handler, options);
      });
    };

    const onResize = () => {
      if (!this.app || !this.hostEl) return;
      const { width: w, height: h } = this.getViewportDimensions(this.hostEl);
      this.app.renderer.resize(w, h);
      this.layoutScene(w, h);
    };

    const onPointerMove = (ev: Event) => {
      const pe = ev as PointerEvent;
      const { width: w, height: h } = this.getViewportDimensions(this.hostEl);
      this.pointerNormX = (pe.clientX / Math.max(1, w) - 0.5) * 2;
      this.pointerNormY = (pe.clientY / Math.max(1, h) - 0.5) * 2;
    };

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      if (this.app) {
        this.app.ticker.stop();
      }
      this.bus.emit('menu:contextLost', {});
      this.onFallbackRequired?.('WebGL context lost');
    };

    const onContextRestored = () => {
      if (this.app && this.isMounted) {
        this.app.ticker.start();
      }
      this.bus.emit('menu:contextRestored', {});
    };

    addManagedListener(window, 'resize', onResize, { passive: true });
    addManagedListener(window, 'pointermove', onPointerMove, { passive: true });
    addManagedListener(canvas, 'webglcontextlost', onContextLost, false);
    addManagedListener(canvas, 'webglcontextrestored', onContextRestored, false);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        onResize();
      });
      ro.observe(container);
      globalTracker.activeListeners++;
      this.cleanupListeners.push(() => {
        ro.disconnect();
      });
    }
  }

  private buildSceneGraph(width: number, height: number): void {
    if (!this.app) return;

    // Create a dedicated 2x2 procedural canvas texture owned exclusively by this MenuScene instance
    // (never referencing Texture.WHITE.source) so `tex.destroy(true)` destroys only our own GPU TextureSource.
    if (typeof document !== 'undefined') {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 2;
      texCanvas.height = 2;
      const ownedTex = Texture.from(texCanvas);
      this.ownedTextures.push(ownedTex);
      globalTracker.activeTextures++;
    }

    this.rootContainer = new Container();
    this.bgGraphic = new Graphics();
    this.groundPatchesGraphic = new Graphics();
    this.bokehPetalContainer = new Container();
    this.actorsContainer = new Container();
    this.crispPetalContainer = new Container();
    this.fireflyContainer = new Container();
    this.coinGraphic = new Graphics();
    this.vignetteGraphic = new Graphics();

    // Per-instance blur filters with explicit renderer resolution so HiDPI/Retina displays
    // never scale filter render targets into the top-left quadrant.
    const filterResolution = this.app.renderer.resolution || 1;
    this.bokehBlurFilter = new BlurFilter({
      strength: 2.2,
      quality: 3,
      resolution: filterResolution,
    });
    this.fireflyBlurFilter = new BlurFilter({
      strength: 2.0,
      quality: 3,
      resolution: filterResolution,
    });

    this.bokehPetalContainer.filters = [this.bokehBlurFilter];
    this.fireflyContainer.filters = [this.fireflyBlurFilter];

    this.rootContainer.addChild(
      this.bgGraphic,
      this.groundPatchesGraphic,
      this.bokehPetalContainer,
      this.actorsContainer,
      this.crispPetalContainer,
      this.fireflyContainer,
      this.coinGraphic,
      this.vignetteGraphic
    );

    this.app.stage.addChild(this.rootContainer);

    // 1. Spawn the Big Multi-Petal Garden Flowers justified across left & right flanks
    const flowerSpecs: Array<{
      nx: number;
      ny: number;
      scale: number;
      phase: number;
      hasFilamentCenter: boolean;
    }> = [
      { nx: 0.096, ny: 0.285, scale: 1.02, phase: 0.2, hasFilamentCenter: true },
      { nx: 0.072, ny: 0.775, scale: 0.95, phase: 1.7, hasFilamentCenter: false },
      { nx: 0.885, ny: 0.468, scale: 1.04, phase: 3.1, hasFilamentCenter: true },
    ];

    for (const spec of flowerSpecs) {
      const node = this.createBigFlowerNode(spec);
      this.bigFlowers.push(node);
      this.actorsContainer.addChild(node.root);
    }

    // 2. Spawn the Cute Green Sprout Creatures justified across left & right
    const sproutSpecs: Array<{ nx: number; ny: number; phase: number; scale: number }> = [
      { nx: 0.072, ny: 0.425, phase: 0.0, scale: 0.94 },
      { nx: 0.152, ny: 0.542, phase: 1.4, scale: 1.0 },
      { nx: 0.935, ny: 0.758, phase: 2.6, scale: 1.02 },
    ];

    for (const spec of sproutSpecs) {
      const sprout = this.createSproutCreatureNode(spec);
      this.sprouts.push(sprout);
      this.actorsContainer.addChild(sprout.root);
    }

    // 3. Spawn 34 Sakura Blossoms (Soft-Focus Bokeh + Crisp Foreground) justified across all 4 quadrants
    const petalPositions: Array<[number, number, number, boolean]> = [
      // Top-Left & Mid-Left quadrant
      [0.18, 0.292, 1.38, true],
      [0.105, 0.16, 0.72, true],
      [0.052, 0.23, 0.68, true],
      [0.096, 0.538, 1.08, false],
      [0.23, 0.45, 0.56, true],
      [0.252, 0.775, 1.14, true],
      [0.14, 0.89, 0.68, true],
      [0.32, 0.66, 0.64, true],
      [0.22, 0.03, 0.82, true],
      // Center-Top & Center-Bottom framing
      [0.372, 0.22, 1.28, true],
      [0.36, 0.065, 0.62, true],
      [0.48, 0.038, 0.96, true],
      [0.57, 0.17, 0.68, true],
      [0.485, 0.59, 0.56, true],
      [0.54, 0.86, 0.62, true],
      [0.41, 0.88, 0.78, true],
      [0.63, 0.84, 0.74, true],
      // Top-Right & Mid-Right quadrant
      [0.71, 0.058, 0.72, true],
      [0.712, 0.185, 0.86, true],
      [0.735, 0.22, 0.58, false],
      [0.88, 0.12, 0.72, true],
      [0.98, 0.18, 1.22, false],
      [0.955, 0.29, 0.62, true],
      [0.848, 0.30, 0.82, true],
      [0.88, 0.295, 0.58, false],
      [0.805, 0.42, 1.18, false],
      [0.918, 0.495, 1.15, true],
      [0.64, 0.43, 0.58, true],
      // Bottom-Right quadrant
      [0.92, 0.60, 0.62, false],
      [0.81, 0.72, 1.12, false],
      [0.73, 0.81, 0.92, true],
      [0.73, 0.92, 0.60, true],
      [0.87, 0.88, 0.80, true],
      [0.96, 0.84, 0.68, true],
    ];

    for (let i = 0; i < petalPositions.length; i++) {
      const [nx, ny, baseScale, isBokeh] = petalPositions[i]!;
      const g = new Graphics();
      this.drawSakuraBlossom(g, isBokeh ? 26 : 23, !isBokeh);
      g.scale.set(baseScale);
      g.alpha = isBokeh ? 0.82 : 0.95;
      g.rotation = (i * 1.17) % (Math.PI * 2);

      const node: SakuraPetalNode = {
        g,
        nx,
        ny,
        vx: (i % 2 === 0 ? 1 : -1) * (0.0018 + (i % 5) * 0.0005),
        vy: 0.0025 + (i % 4) * 0.0007,
        rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.1 + (i % 3) * 0.045),
        baseScale,
        phase: i * 0.85,
        isBokeh,
      };
      this.petals.push(node);
      if (isBokeh) {
        this.bokehPetalContainer.addChild(g);
      } else {
        this.crispPetalContainer.addChild(g);
      }
    }

    // 4. Spawn 30 Glowing Golden & Lime Bloom Fireflies justified across the whole screen
    const fireflySpecs: Array<[number, number, boolean, number]> = [
      // Left side bloom cluster
      [0.242, 0.362, false, 7.5],
      [0.222, 0.482, true, 8.0],
      [0.268, 0.492, false, 8.5],
      [0.232, 0.582, true, 7.0],
      [0.172, 0.682, false, 6.5],
      [0.138, 0.722, false, 4.8],
      [0.192, 0.792, false, 5.0],
      [0.082, 0.622, true, 5.8],
      [0.125, 0.185, false, 5.2],
      // Center-top & Center-bottom bloom
      [0.268, 0.202, false, 4.8],
      [0.267, 0.272, false, 4.0],
      [0.352, 0.342, false, 4.5],
      [0.442, 0.462, true, 5.2],
      [0.542, 0.362, false, 4.5],
      [0.585, 0.472, true, 5.5],
      [0.622, 0.582, false, 4.8],
      [0.382, 0.722, false, 5.0],
      [0.482, 0.822, true, 5.8],
      [0.622, 0.782, false, 5.2],
      // Right side bloom cluster (top, mid, bottom)
      [0.748, 0.382, false, 7.5],
      [0.742, 0.412, false, 4.5],
      [0.772, 0.562, true, 7.0],
      [0.732, 0.648, true, 8.5],
      [0.848, 0.688, false, 7.5],
      [0.832, 0.258, true, 6.0],
      [0.682, 0.222, false, 5.2],
      [0.912, 0.342, false, 5.8],
      [0.882, 0.842, true, 5.8],
      [0.792, 0.882, false, 5.2],
      [0.942, 0.622, true, 5.5],
    ];

    for (let i = 0; i < fireflySpecs.length; i++) {
      const [nx, ny, isLime, radius] = fireflySpecs[i]!;
      const g = new Graphics();
      const outerColor = isLime ? 0x52f262 : 0xffd84d;
      const midColor = isLime ? 0x8cff96 : 0xffe885;
      const coreColor = isLime ? 0xe5ffeb : 0xfffdf0;
      // Multi-layered soft atmospheric bloom halo
      g.circle(0, 0, radius * 4.2).fill({ color: outerColor, alpha: 0.12 });
      g.circle(0, 0, radius * 2.8).fill({ color: outerColor, alpha: 0.24 });
      g.circle(0, 0, radius * 1.75).fill({ color: midColor, alpha: 0.42 });
      g.circle(0, 0, radius).fill({ color: coreColor, alpha: 0.96 });

      const node: FireflyNode = {
        g,
        nx,
        ny,
        baseNx: nx,
        baseNy: ny,
        phase: i * 0.9,
        speed: 0.9 + (i % 4) * 0.25,
        isLime,
        radius,
      };
      this.fireflies.push(node);
      this.fireflyContainer.addChild(g);
    }

    // 5. Draw the small Golden Coin pickup near (0.70, 0.415)
    this.drawSmallGoldenCoin(this.coinGraphic);

    this.applyQualityBudget();
    this.layoutScene(width, height);
  }

  private createBigFlowerNode(spec: {
    nx: number;
    ny: number;
    scale: number;
    phase: number;
    hasFilamentCenter: boolean;
  }): BigFlowerNode {
    const root = new Container();

    // Smooth 6-step feathered ambient occlusion & directional ground drop shadow
    const shadow = new Graphics();
    // Warm ambient flower bloom aura on the ground
    shadow.ellipse(0, 12, 74, 48).fill({ color: 0xf0758e, alpha: 0.05 });
    // Feathered penumbra -> umbra ground shadow layers
    shadow.ellipse(4, 38, 66, 28).fill({ color: 0x08030d, alpha: 0.12 });
    shadow.ellipse(3, 36, 58, 24).fill({ color: 0x08030d, alpha: 0.18 });
    shadow.ellipse(2, 35, 50, 21).fill({ color: 0x07030c, alpha: 0.24 });
    shadow.ellipse(1, 33, 42, 17).fill({ color: 0x07020b, alpha: 0.32 });
    shadow.ellipse(0, 31, 33, 13).fill({ color: 0x050209, alpha: 0.42 });

    // Green basal leaves with soft cast shadows and volumetric rim highlights
    const leaves = new Graphics();
    leaves.ellipse(-29, 24, 25, 14).fill({ color: 0x07030c, alpha: 0.34 });
    leaves.ellipse(29, 24, 25, 14).fill({ color: 0x07030c, alpha: 0.34 });
    leaves
      .ellipse(-30, 18, 22, 13)
      .fill({ color: 0x4ca96c })
      .stroke({ color: 0x1b1424, width: 3 });
    leaves.ellipse(-30, 15, 16, 8).fill({ color: 0x67c486, alpha: 0.45 });
    leaves
      .ellipse(30, 18, 22, 13)
      .fill({ color: 0x4ca96c })
      .stroke({ color: 0x1b1424, width: 3 });
    leaves.ellipse(30, 15, 16, 8).fill({ color: 0x67c486, alpha: 0.45 });
    leaves
      .ellipse(-28, -18, 18, 11)
      .fill({ color: 0x3e8e59 })
      .stroke({ color: 0x1b1424, width: 2.5 });

    // Feathered depth shadow cast by the flower head onto the basal leaves
    const headDepthShadow = new Graphics();
    headDepthShadow.ellipse(2, 10, 44, 38).fill({ color: 0x09040f, alpha: 0.24 });
    headDepthShadow.ellipse(1, 8, 37, 32).fill({ color: 0x09040f, alpha: 0.32 });

    // 8-petal coral-pink flower head with 3D volumetric shading
    const head = new Graphics();
    const petalCount = 8;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const px = Math.cos(angle) * 20;
      const py = Math.sin(angle) * 20;
      // Soft under-petal lobe depth shadow
      head.circle(px + 1.5, py + 3.5, 19.5).fill({ color: 0x12071a, alpha: 0.36 });
      head
        .circle(px, py, 19)
        .fill({ color: i % 2 === 0 ? 0xf27d85 : 0xe06872 })
        .stroke({ color: 0x221529, width: 3 });
      // Deep rose base shading for 3D cup curvature
      head.circle(px * 0.55, py * 0.55 + 1, 11).fill({ color: 0xb84658, alpha: 0.38 });
      // Sunlit upper-outer petal highlight
      head.circle(px * 0.86, py * 0.86 - 1.5, 10.5).fill({ color: 0xffb3ba, alpha: 0.52 });
    }

    // Inner cup depth shading before center pistil
    head.circle(0, 2, 17.5).fill({ color: 0x7d2b3d, alpha: 0.46 });

    if (spec.hasFilamentCenter) {
      // Glowing warm center bloom with delicate stamen rays
      head.circle(0, 0, 18).fill({ color: 0xffb74d, alpha: 0.28 });
      head.circle(0, 0, 13).fill({ color: 0xffd180, alpha: 0.9 });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        head
          .moveTo(0, 0)
          .lineTo(Math.cos(a) * 14, Math.sin(a) * 14)
          .stroke({ color: 0xfff3c4, width: 1.8 });
        head.circle(Math.cos(a) * 14, Math.sin(a) * 14, 2).fill({ color: 0xffffff });
      }
      head.circle(0, 0, 5.5).fill({ color: 0xfff9e6 });
    } else {
      // Smooth pale-gold circular center with 3D rim depth (bottom-left flower in reference)
      head.circle(1, 3, 17).fill({ color: 0x160a1f, alpha: 0.45 });
      head
        .circle(0, 0, 16)
        .fill({ color: 0xeadf99 })
        .stroke({ color: 0x221529, width: 3 });
      head.circle(-3, -3, 9).fill({ color: 0xfcf6c7, alpha: 0.5 });
    }

    root.addChild(shadow, leaves, headDepthShadow, head);
    root.scale.set(spec.scale);

    return {
      root,
      head,
      nx: spec.nx,
      ny: spec.ny,
      scale: spec.scale,
      phase: spec.phase,
      hasFilamentCenter: spec.hasFilamentCenter,
    };
  }

  private createSproutCreatureNode(spec: {
    nx: number;
    ny: number;
    phase: number;
    scale: number;
  }): SproutCreatureNode {
    const root = new Container();

    // Feathered 4-step ground depth shadow under sprout creature
    const shadow = new Graphics();
    shadow.ellipse(1.5, 23, 25, 10).fill({ color: 0x07030c, alpha: 0.16 });
    shadow.ellipse(1, 22.5, 20, 8).fill({ color: 0x07030c, alpha: 0.26 });
    shadow.ellipse(0.5, 22, 15, 6).fill({ color: 0x06020b, alpha: 0.42 });
    shadow.ellipse(0, 21.5, 10, 4).fill({ color: 0x050209, alpha: 0.55 });

    const body = new Graphics();
    // Top sprout antenna leaves
    body
      .moveTo(-4, -14)
      .lineTo(-11, -26)
      .stroke({ color: 0x72c66b, width: 3, cap: 'round' });
    body
      .moveTo(4, -14)
      .lineTo(11, -26)
      .stroke({ color: 0x72c66b, width: 3, cap: 'round' });
    // Little arms & feet with dark depth outlines
    body
      .ellipse(-14, 2, 5, 3)
      .fill({ color: 0x56a852 })
      .stroke({ color: 0x191220, width: 2 });
    body
      .ellipse(14, -1, 5, 3)
      .fill({ color: 0x56a852 })
      .stroke({ color: 0x191220, width: 2 });
    body.circle(-7, 17, 4).fill({ color: 0x3b7d39 }).stroke({ color: 0x191220, width: 2 });
    body.circle(7, 17, 4).fill({ color: 0x3b7d39 }).stroke({ color: 0x191220, width: 2 });

    // Torso & neck cast depth shadow
    body
      .ellipse(0, 11, 10, 8)
      .fill({ color: 0x529e4b })
      .stroke({ color: 0x191220, width: 2.5 });
    body.ellipse(0, 8.5, 9.2, 4.5).fill({ color: 0x1a3818, alpha: 0.55 });

    // Round green sprout head with 3D spherical shading
    body
      .circle(0, -2, 14)
      .fill({ color: 0x68bd60 })
      .stroke({ color: 0x191220, width: 2.8 });
    // Lower-right spherical shadow & upper-left highlight
    body.circle(2.5, 1, 11.5).fill({ color: 0x4b9944, alpha: 0.42 });
    body.circle(-4, -6, 7.5).fill({ color: 0x91e089, alpha: 0.48 });

    // Cute eyes & smile
    body.circle(-5, -3, 3.5).fill({ color: 0xffffff }).stroke({ color: 0x191220, width: 1.5 });
    body.circle(5, -3, 3.5).fill({ color: 0xffffff }).stroke({ color: 0x191220, width: 1.5 });
    body.circle(-5, -3, 1.6).fill({ color: 0x191220 });
    body.circle(5, -3, 1.6).fill({ color: 0x191220 });
    body
      .arc(0, 2, 3.2, 0.15, Math.PI - 0.15)
      .stroke({ color: 0x191220, width: 1.8 });

    root.addChild(shadow, body);
    root.scale.set(spec.scale);

    return {
      root,
      shadow,
      body,
      nx: spec.nx,
      ny: spec.ny,
      phase: spec.phase,
      scale: spec.scale,
    };
  }

  private drawSakuraBlossom(g: Graphics, radius: number, withDropShadow = false): void {
    g.clear();
    const petals = 5;

    // Soft ambient sakura bloom glow around each blossom
    g.circle(0, 0, radius * 1.18).fill({ color: 0xff8da3, alpha: 0.14 });

    // Multi-layered floating depth shadow under blossoms
    const shadowOffset = withDropShadow ? 5 : 3.5;
    const shadowAlpha = withDropShadow ? 0.34 : 0.22;
    g.circle(shadowOffset * 0.8, shadowOffset * 1.15, radius * 0.86).fill({
      color: 0x08030d,
      alpha: shadowAlpha * 0.65,
    });
    g.circle(shadowOffset * 0.5, shadowOffset * 0.85, radius * 0.68).fill({
      color: 0x07020b,
      alpha: shadowAlpha,
    });

    // Draw 5 distinct notched sakura petals with clear separation between petals
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 - Math.PI * 0.5;
      const midDist = radius * 0.52;
      const tipDist = radius * 0.72;
      const px = Math.cos(a) * midDist;
      const py = Math.sin(a) * midDist;
      const leftA = a - 0.19;
      const rightA = a + 0.19;

      // Outer notched petal lobes
      g.circle(Math.cos(leftA) * tipDist, Math.sin(leftA) * tipDist, radius * 0.27).fill({
        color: 0xf798aa,
        alpha: 0.94,
      });
      g.circle(Math.cos(rightA) * tipDist, Math.sin(rightA) * tipDist, radius * 0.27).fill({
        color: 0xf798aa,
        alpha: 0.94,
      });
      // Mid-petal body
      g.circle(px, py, radius * 0.31).fill({
        color: 0xf07d94,
        alpha: 0.95,
      });
      // Inner petal depth shading toward the flower heart
      g.circle(px * 0.58, py * 0.58, radius * 0.22).fill({
        color: 0xe05d79,
        alpha: 0.88,
      });
    }

    // Warm rose-crimson center cup & delicate glowing stamen filaments
    g.circle(0, 0, radius * 0.24).fill({ color: 0xd44867, alpha: 0.94 });
    g.circle(0, 0, radius * 0.15).fill({ color: 0xffb5c5, alpha: 0.65 });
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      g.moveTo(0, 0)
        .lineTo(Math.cos(a) * (radius * 0.32), Math.sin(a) * (radius * 0.32))
        .stroke({ color: 0xffe0e7, width: 1.4, alpha: 0.9 });
      g.circle(Math.cos(a) * (radius * 0.32), Math.sin(a) * (radius * 0.32), 1.8).fill({
        color: 0xfff5f7,
        alpha: 0.98,
      });
    }
  }

  private drawSmallGoldenCoin(g: Graphics): void {
    g.clear();
    // Soft feathered ground shadow below floating coin
    g.ellipse(1, 14.5, 10, 4.5).fill({ color: 0x07030c, alpha: 0.28 });
    g.ellipse(0.5, 14, 7.5, 3.2).fill({ color: 0x06020a, alpha: 0.52 });
    // Warm golden glow halo
    g.circle(0, 0, 13).fill({ color: 0xffd54f, alpha: 0.18 });
    g.ellipse(0, 0, 7, 9.5)
      .fill({ color: 0xf5c84c })
      .stroke({ color: 0x231729, width: 2.2 });
    g.ellipse(0, 0, 3.5, 5.5).stroke({ color: 0xfff3b0, width: 1.2 });
  }

  private applyQualityBudget(): void {
    const budget = this.qualityMonitor.getBudget();
    if (this.bokehPetalContainer) {
      this.bokehPetalContainer.filters =
        budget.enableBlurFilter && this.bokehBlurFilter ? [this.bokehBlurFilter] : [];
    }
    if (this.fireflyContainer) {
      this.fireflyContainer.filters =
        budget.enableBlurFilter && this.fireflyBlurFilter ? [this.fireflyBlurFilter] : [];
    }
    for (let i = 0; i < this.petals.length; i++) {
      this.petals[i]!.g.visible = i < budget.bokehPetalCount;
    }
    for (let i = 0; i < this.fireflies.length; i++) {
      this.fireflies[i]!.g.visible = i < budget.fireflyCount;
    }
  }

  private layoutScene(width: number, height: number): void {
    if (!this.bgGraphic || !this.groundPatchesGraphic || !this.vignetteGraphic) return;

    this.bgGraphic.clear();
    this.bgGraphic.rect(0, 0, width, height).fill({ color: 0x1f1326 });

    // Soft warm plum-rose ground patches with feathered elevation rims across the entire meadow
    this.groundPatchesGraphic.clear();
    const patches: Array<[number, number, number, number]> = [
      [0.14, 0.24, 95, 42],
      [0.57, 0.14, 72, 34],
      [0.76, 0.21, 90, 38],
      [0.19, 0.44, 84, 38],
      [0.30, 0.36, 42, 22],
      [0.66, 0.41, 95, 44],
      [0.12, 0.72, 76, 36],
      [0.86, 0.40, 110, 50],
      [0.89, 0.85, 105, 48],
      [0.42, 0.84, 88, 38],
    ];
    for (const [nx, ny, rx, ry] of patches) {
      const cx = nx * width;
      const cy = ny * height;
      // Soft recessed depth shadow beneath each meadow patch
      this.groundPatchesGraphic
        .ellipse(cx + 2, cy + 5, rx + 5, ry + 4)
        .fill({ color: 0x0e0714, alpha: 0.28 });
      this.groundPatchesGraphic
        .ellipse(cx + 1, cy + 2.5, rx + 2, ry + 2)
        .fill({ color: 0x12091a, alpha: 0.34 });
      // Warm plum-rose meadow pad
      this.groundPatchesGraphic
        .ellipse(cx, cy, rx, ry)
        .fill({ color: 0x3b223c, alpha: 0.44 });
    }

    // Position big flowers
    for (const f of this.bigFlowers) {
      f.root.position.set(f.nx * width, f.ny * height);
    }

    // Position sprout creatures
    for (const s of this.sprouts) {
      s.root.position.set(s.nx * width, s.ny * height);
    }

    // Position golden coin
    if (this.coinGraphic) {
      this.coinGraphic.position.set(width * 0.70, height * 0.415);
    }

    // Smooth multi-step feathered outer depth vignette (no hard edges)
    this.vignetteGraphic.clear();
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const t = (i + 1) / steps;
      const strokeW = 12 + (1 - t) * 95;
      this.vignetteGraphic
        .rect(0, 0, width, height)
        .stroke({ color: 0x07030c, width: strokeW, alpha: 0.032 });
    }
  }

  private readonly handleTick = (): void => {
    if (!this.app || !this.isMounted || !this.rootContainer) return;

    const dtMs = Math.min(100, Math.max(1, this.app.ticker.deltaMS || 16.67));
    const dtSec = dtMs / 1000;
    this.elapsedSec += dtSec;

    // 1. Frame-time budget monitor (isolated to MenuScene)
    const nextTier = this.qualityMonitor.recordFrame(dtMs);
    if (nextTier) {
      this.applyQualityBudget();
      this.bus.emit('menu:qualityChanged', {
        tier: nextTier,
        avgFrameMs: this.qualityMonitor.getAverageFrameMs(),
      });
    }

    // IMPORTANT: Always use logical CSS viewport dimensions (`getViewportDimensions` / `app.screen`)
    // so Retina/HiDPI displays (`devicePixelRatio > 1`) spread actors across 100% of the screen.
    const dims = this.getViewportDimensions(this.hostEl);
    const w = dims.width || this.app.screen.width || 1280;
    const h = dims.height || this.app.screen.height || 800;

    // 2. Smooth pointer parallax
    this.smoothParallaxX += (this.pointerNormX * 14 - this.smoothParallaxX) * Math.min(1, dtSec * 5);
    this.smoothParallaxY += (this.pointerNormY * 10 - this.smoothParallaxY) * Math.min(1, dtSec * 5);

    // 3. Animate Big Flowers (gentle breathing & petal sway)
    for (const f of this.bigFlowers) {
      const sway = Math.sin(this.elapsedSec * 1.4 + f.phase) * 0.045;
      const pulse = 1 + Math.sin(this.elapsedSec * 2.1 + f.phase) * 0.025;
      f.head.rotation = sway;
      f.root.scale.set(f.scale * pulse);
      f.root.position.set(
        f.nx * w + this.smoothParallaxX * 0.45,
        f.ny * h + this.smoothParallaxY * 0.45
      );
    }

    // 4. Animate Sprout Creatures (happy bounce + dynamic ground shadow scale)
    for (const s of this.sprouts) {
      const wave = Math.sin(this.elapsedSec * 3.2 + s.phase);
      const bob = wave * 2.5;
      s.body.position.y = bob;
      const shadowScale = 1 - wave * 0.06;
      s.shadow.scale.set(shadowScale, shadowScale);
      s.root.position.set(
        s.nx * w + this.smoothParallaxX * 0.55,
        s.ny * h + this.smoothParallaxY * 0.55
      );
    }

    // 5. Animate drifting Sakura Petals across full screen
    for (const p of this.petals) {
      if (!p.g.visible) continue;
      p.nx += p.vx * dtSec;
      p.ny += p.vy * dtSec;
      if (p.ny > 1.06) p.ny = -0.05;
      if (p.nx > 1.06) p.nx = -0.05;
      if (p.nx < -0.06) p.nx = 1.05;

      const parallaxMult = p.isBokeh ? 1.15 : 0.75;
      p.g.position.set(
        p.nx * w + this.smoothParallaxX * parallaxMult,
        p.ny * h + this.smoothParallaxY * parallaxMult
      );
      p.g.rotation += p.rotSpeed * dtSec;
    }

    // 6. Animate Glowing Fireflies across full screen
    for (const ff of this.fireflies) {
      if (!ff.g.visible) continue;
      const ox = Math.sin(this.elapsedSec * ff.speed + ff.phase) * 0.012;
      const oy = Math.cos(this.elapsedSec * (ff.speed * 0.85) + ff.phase) * 0.012;
      ff.g.position.set(
        (ff.baseNx + ox) * w + this.smoothParallaxX * 0.9,
        (ff.baseNy + oy) * h + this.smoothParallaxY * 0.9
      );
      ff.g.alpha = 0.65 + 0.35 * Math.sin(this.elapsedSec * 2.8 + ff.phase);
    }

    // 7. Animate Golden Coin pickup with subtle bob and parallax
    if (this.coinGraphic) {
      const coinBob = Math.sin(this.elapsedSec * 2.6) * 2.2;
      this.coinGraphic.position.set(
        w * 0.70 + this.smoothParallaxX * 0.6,
        h * 0.415 + coinBob + this.smoothParallaxY * 0.6
      );
    }

    // 8. Handle `menu:start` -> `scene:transitionDone` exit crossfade
    if (this.isTransitioning) {
      this.transitionElapsedMs += dtMs;
      const t = Math.min(1, this.transitionElapsedMs / Math.max(1, this.transitionDurationMs));
      const ease = t * t * (3 - 2 * t);
      this.rootContainer.alpha = 1 - ease;
      const zoom = 1 + ease * 0.06;
      this.rootContainer.scale.set(zoom);
      this.rootContainer.position.set((w * (1 - zoom)) * 0.5, (h * (1 - zoom)) * 0.5);

      if (t >= 1) {
        this.isTransitioning = false;
        const doneMode = this.transitionMode;
        this.bus.emit('scene:transitionDone', { mode: doneMode });
      }
    }
  };
}
