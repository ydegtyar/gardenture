# PixiJS Setup and Architecture Specification

Oct 23, 2026 · @Yuriy

## 1. Goals and engineering principles

This document fixes how the game is built on PixiJS so it stays maintainable for years as one person (with AI help) adds content. It supports the Core Gameplay Systems Specification and the GDD. The most important decision: **game rules know nothing about PixiJS**. Rendering is a replaceable view of a simulation, and the first visuals are characters generated from code primitives that can later be swapped for real art without touching gameplay.

**Goals**

1. Start prototyping on day one with zero art assets (every character, enemy and effect drawn from primitives).
2. Keep the simulation deterministic and testable without a browser or GPU, so balance bots and daily seeds work.
3. Keep content in data, so a new card, enemy or theme needs no engine changes.
4. Stay within a small bundle and stable frame rate on low-end phones.
5. Make every piece replaceable: renderer, art, platform SDK, ad provider, save backend.

**Engineering principles \[F\]**

| Principle | Meaning in this project |
| --- | --- |
| Simulation and view are separate | Simulation holds numbers and ids only; view objects (sprites) are created and updated from it and can be deleted at any time without changing the result |
| One-way dependencies | Lower layers never import higher ones (see architecture diagram); enforced by lint rules |
| Data over code | Weapons, cards, enemies, waves, themes are JSON validated at build time |
| Determinism | Simulation uses a seeded RNG and fixed timestep; no `Math.random` or `Date.now` inside it |
| Small, boring modules | Files under about 300 lines, functions under about 40, no hidden global state |
| Pools, not allocation | Anything created more than a few times per second is pooled |
| Explicit ports | Platform features (storage, ads, SDK, audio unlock) sit behind interfaces with a mock |
| Measure, then optimize | Performance budgets are tested in a debug overlay and in benchmarks, not guessed |

**Non-goals:** a general-purpose engine, a visual editor, multiplayer, 3D.

## 2. Technology baseline

Use the **PixiJS v8 line** (a package index listing shows version 8.15.0 at the time of writing, so treat that as approximate and pin the exact current 8.x release in `package.json` on day one; see [pixi.js on the package index](https://central.sonatype.com/artifact/org.webjars.npm/pixi.js/)). PixiJS v8 supports WebGPU with a WebGL fallback, uses an asynchronous `app.init()`, a chainable Graphics API (`circle().fill()`), and tree-shakable imports. Pin versions exactly and upgrade deliberately.

| Area | Choice | Reason |
| --- | --- | --- |
| Language | TypeScript, strict mode on, `noUncheckedIndexedAccess` on | Catches data bugs early; essential for long-term maintenance |
| Renderer | PixiJS v8, WebGL preferred for launch stability; WebGPU allowed through feature flag after testing | Widest device coverage; fewer surprises on low-end phones |
| Bundler | Vite with ES modules, one entry, code split only for lazy art and audio | Fast iteration, small output |
| Unit and simulation tests | Vitest (runs in Node, no browser) | Simulation is pure TypeScript |
| Browser tests | Playwright for smoke tests on mobile viewport emulation | Verifies boot, resize, pause |
| Lint and format | ESLint with import-boundary rules, Prettier | Enforces architecture automatically |
| Data validation | Build-time JSON schema validation (Ajv or equivalent run as a script, not shipped in the bundle) | Keeps the runtime small |
| Audio | Small WebAudio wrapper first; add a library only if needed | Bundle size and control |
| State and events | Plain typed modules and a tiny typed event bus (no framework) | No dependency churn |
| UI | Pixi-drawn HUD for in-run; lightweight DOM or Pixi for menus (decide in the UI spec) | Avoid layout cost during play |
| Package manager | pnpm or npm with lockfile committed | Reproducible builds |
| CI | GitHub Actions: typecheck, lint, unit tests, data validation, bundle size check | Prevents regressions |

**Bundle budget (to confirm against platform rules).** Target under 400 KB gzipped for code including PixiJS, under 1.5 MB for initial assets with primitives-only art, and under 5 MB total after real art. Add a CI step that fails when the code bundle grows more than 5% in one change without an approved note.

**Browser targets:** current Chrome and Safari on mobile, current desktop Chrome, Edge and Firefox; WebGL 2 required, WebGL 1 fallback not supported unless the platform demands it.

**Imports rule:** import from `pixi.js` by named exports only (`import { Application, Container, Graphics } from 'pixi.js'`), and only inside the rendering layer (section 4). This keeps tree-shaking effective and the dependency contained.

## 3. Project structure

One repository, one package, strict folder boundaries. The folder names are the architecture; the lint rules in section 14 reject imports that cross them the wrong way.

```text
src/
  main.ts                  entry: creates Game, starts boot
  boot/                    bootstrap, config, platform selection
  core/                    pure TypeScript, no DOM, no Pixi
    time/                  fixed-step clock, tick counter
    rng/                   seeded RNG with named streams
    math/                  vec2, rect, easing, geometry tests
    events/                typed event bus
    ids/                   entity id allocation
    pool/                  generic object pools
  sim/                     the game rules; pure TypeScript, deterministic
    world/                 World, component stores, queries
    components/            Position, Velocity, Health, Weapon, Tag...
    systems/               Movement, Targeting, Combat, Spawn, Xp, Rank...
    rules/                 damage formula, stat stacking, card effects
    director/              wave director, special monster scheduler
    run/                   RunState, run lifecycle, victory/defeat
  content/                 data access, no logic
    schema/                TypeScript types generated from JSON schema
    loader/                load, merge, freeze data tables
    data/                  weapons.json, cards.json, enemies.json, waves.json...
    themes/garden/         theme pack: palette, character specs, strings
  view/                    PixiJS rendering layer (the only place importing pixi.js)
    app/                   Application creation, resize, layers
    camera/                camera follow, visible-area policy
    sync/                  ViewSync: simulation entities to display objects
    visuals/               VisualProvider interface and implementations
      primitive/           character and effect generators from shapes
      sprite/              later: atlas based provider
    effects/               particles, hit flash, damage numbers, screen shake
    hud/                   in-run HUD widgets
    screens/               menus, loadout, store, summary
    debug/                 overlay, inspectors
  input/                   pointer, touch, keyboard to abstract intents
  platform/                ports and adapters
    ports/                 Storage, Ads, Leaderboard, Lifecycle, Audio
    youtube/               YouTube Playables adapter
    web/                   plain web adapter
    mock/                  test and dev adapter
  meta/                    save data, store, quests, unlocks (pure logic)
  app/                     game flow: screens state machine, wiring
tests/                     unit tests mirroring src/, plus bot and golden tests
tools/                     scripts: validate data, export balance, pack atlas
docs/                      this spec, ADRs (decision records), data docs
```

**Module responsibilities in one line each**

| Folder | Responsibility | May import |
| --- | --- | --- |
| core | Reusable pure utilities | nothing project-specific |
| sim | Game rules and state | core, content |
| content | Typed, validated data access | core |
| meta | Persistent progression logic | core, content, sim types, platform ports |
| input | Turns raw events into intents | core |
| view | Draws the simulation; reads it, never writes it | core, sim (read-only types), content, input |
| platform | External services behind ports | core |
| app | Wires everything, owns screen flow | all of the above |
| boot | Starts the game | app, platform |

## 4. Architecture overview

The game is seven layers. The simulation (highlighted) holds all rules and runs without a browser; the view layer is a disposable drawing of it.

&#91;embedded content: layer diagram · 7 layers, downward dependencies only\]

The view reads simulation state each frame and draws it; input only produces intents that the simulation consumes; platform services reach the game only through ports.

**Rules that make this real**

1. `sim`, `content`, `meta` and `core` must run in Node under Vitest with no DOM and no `pixi.js` import. A test that imports them in a bare Node environment runs in CI.
2. Communication upward uses events and read-only snapshots, never callbacks into the view. The simulation emits events such as `EnemyKilled` or `LevelUp`; the view and audio listen.
3. The view never mutates simulation state. Visual-only data (screen shake, hit flash timers, particles) lives in the view and is driven by events.
4. All randomness in `sim` goes through named seeded streams (`spawn`, `cards`, `drops`, `combat`); the view has its own cosmetic stream so visuals never alter outcomes.
5. Cross-layer imports are validated by an ESLint boundary rule and a dependency check script in CI; a violation fails the build.

## 5. Application lifecycle and renderer initialization

PixiJS v8 replaces the legacy synchronous constructor with an asynchronous `Application.init()` method. The boot sequence configures the renderer for maximum mobile stability, predictable frame pacing, and safe context loss recovery.

**Application configuration**

```typescript
import { Application } from 'pixi.js';

export async function createPixiApp(containerElement: HTMLElement): Promise<Application> {
  const app = new Application();

  await app.init({
    preference: 'webgl', // WebGL 2 first for launch stability; WebGPU via query flag
    powerPreference: 'high-performance',
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2x to protect mobile fill rate [F]
    antialias: false, // Turn off MSAA: 2D sprite fill rate and battery matter more [F]
    background: '#12131a', // Matches theme background to eliminate white boot flashes
    resizeTo: containerElement,
    roundPixels: true, // Prevents subpixel edge bleeding on pixel/primitive art
  });

  containerElement.appendChild(app.canvas);
  return app;
}
```

**Lifecycle rules and policies**

1. **Resolution cap [F]:** High-end phones report a `devicePixelRatio` of 3.0 or 4.0. Rendering at native 4x Quad-HD resolution causes mobile GPUs to throttle within 90 seconds. Clamping resolution to `Math.min(devicePixelRatio, 2)` preserves 60 FPS without visible degradation on small screens.
2. **Resize handling:** Sizing is driven by `ResizeObserver` observing the game container element, not window resize events, ensuring safe behavior inside iframes (YouTube Playables, web portals). The camera system recalculates scale immediately on resize (section 7).
3. **Canvas styling [F]:** The canvas element receives CSS attributes `touch-action: none`, `user-select: none`, `-webkit-user-select: none`, and `overscroll-behavior: none` to block browser gesture interference (pull-to-refresh, swipe back/forward).
4. **Context loss handling:** Listen to `webglcontextlost` on `app.canvas`. When triggered, pause simulation ticks, cancel the render loop, and notify the user with a subtle overlay. On `webglcontextrestored`, re-initialize procedural textures and pools, restore render state, and resume.
5. **Clean teardown:** When leaving the game or executing unit/smoke tests, call `app.destroy({ removeView: true, children: true })`.

**Main loop decoupling [F]**

Pixi's `app.ticker` does not own the simulation tick. Instead, `app.ticker` acts as a clock driver:

```typescript
app.ticker.add((ticker) => {
  const deltaMS = Math.min(ticker.deltaMS, 100); // 100ms cap protects against background tab resumption

  // Accumulate simulation time
  accumulator += deltaMS;

  // Run discrete fixed simulation ticks (60 Hz = 16.667 ms)
  let ticksRun = 0;
  while (accumulator >= TICK_MS && ticksRun < MAX_CATCHUP_TICKS) {
    sim.tick();
    accumulator -= TICK_MS;
    ticksRun++;
  }

  // Prevent spiral of death if a frame stalls
  if (ticksRun >= MAX_CATCHUP_TICKS) {
    accumulator = 0;
  }

  // Alpha is the fractional progress between the previous and next tick [0, 1)
  const alpha = accumulator / TICK_MS;

  // Render view interpolated between simulation snapshots
  viewSync.render(alpha);
});
```

## 6. Scene graph hierarchy and layer architecture

The scene graph strictly mirrors the depth sorting order defined in Core Gameplay Systems Specification section 2. Visual containers are initialized once during boot and never dynamically re-parented or recreated during gameplay.

```text
app.stage
  ├── worldContainer (camera-transformed: scaled, rotated, translated)
  │     ├── groundLayer (TilingSprite / terrain grid; renderGroup: true)
  │     ├── decalLayer (scorch marks, spore rings, persistent impacts)
  │     ├── pickupLayer (XP gems, magnet seeds, health drops)
  │     ├── shadowLayer (shared oval GraphicsContext for all entity drop shadows)
  │     ├── entityLayer (hero, enemies, elites, bosses; sorted by Y each frame)
  │     ├── weaponEffectLayer (slash arcs, spear lines, hammer rings, petal orbits)
  │     ├── projectileLayer (player seed blades, enemy spit shots)
  │     └── floatingTextLayer (damage numbers, "PERFECT DODGE", style popups)
  └── screenOverlayContainer (screen-space: fixed to window dimensions, no camera transform)
        ├── vignetteLayer (low health red pulse, damage flashes)
        ├── joystickLayer (floating touch indicator and directional drag knob)
        ├── hudLayer (health bar, XP bar, style rank badge, run timer, power-up slots; renderGroup: true)
        ├── menuLayer (level-up card choice modal, pause screen, victory/defeat summary)
        └── debugLayer (FPS graph, draw call counter, active entity metrics)
```

**PixiJS v8 RenderGroup policy [F]**

PixiJS v8 introduces `renderGroup: true` to isolate subtrees into independent GPU render batches.
- **Enabled on `hudLayer`:** The HUD changes text and progress bars, but its layout is screen-locked. Isolating it into a RenderGroup prevents HUD updates from invalidating the dynamic world sprite batch.
- **Enabled on `groundLayer`:** The repeating background tile never changes blend modes or textures. Isolating it prevents world entity movement from dirtying the background pass.
- **Disabled on `entityLayer`:** Entities dynamically sort by Y every frame. Making individual entity containers separate RenderGroups causes excessive texture swapping and draw-call thrashing. Keep `entityLayer` as a flat, single-container sprite batch.

**Viewport and frustum culling**

Entities beyond the camera's visible rectangle (plus a 2.0 u buffer) set `cullable = true` on their view objects. PixiJS v8 automatically skips matrix updates and geometry generation for display objects flagged as cullable outside the render bounds, reducing CPU transformation overhead when 150 enemies are alive.

## 7. Camera, viewport and responsive layout

The camera translates and scales the simulation's abstract **world units (`u`)** into physical screen pixels. Difficulty and visible enemy density must remain identical across devices, orientations, and aspect ratios.

**Visible-area policy (shorter-side anchor)**

The shorter screen side always spans a fixed number of world units:

| Screen orientation | Visible short side | Visible long side (cap) | Scale formula (`uToPx`) |
| --- | --- | --- | --- |
| Portrait (9:16) | 9.0 u | 16.0 u | `screenWidth / 9.0` |
| Tall Portrait (9:19.5) | 9.0 u | capped at 18.0 u | `screenWidth / 9.0` |
| Square (1:1) | 11.0 u | 11.0 u | `screenWidth / 11.0` |
| Landscape (16:9) | 9.0 u | capped at 14.0 u | `screenHeight / 9.0` |
| Ultra-wide (> 16:9) | 9.0 u | capped at 14.0 u (pillarbox excess) | `screenHeight / 9.0` |

**Look-ahead smoothing and camera matrix**

The camera tracks the hero with a look-ahead vector in the hero's current movement direction:
- Base look-ahead distance: $0.8\text{ u}$ [T].
- Smoothing time: $0.25\text{ s}$ via exponential decay [T].
- Math: $\vec{pos}_{cam} \leftarrow \vec{pos}_{cam} + (\vec{target} - \vec{pos}_{cam}) \cdot (1 - e^{-\lambda \Delta t})$, where $\lambda \approx 12.0$.

The resulting camera position converts into `worldContainer` transform properties:

```typescript
export function updateCamera(
  worldContainer: Container,
  camX: number,
  camY: number,
  uToPx: number,
  screenWidth: number,
  screenHeight: number,
  shakeOffsetX: number,
  shakeOffsetY: number
): void {
  worldContainer.scale.set(uToPx);
  // Center camera in screen space and apply trauma shake
  worldContainer.position.set(
    Math.round(screenWidth * 0.5 - camX * uToPx + shakeOffsetX),
    Math.round(screenHeight * 0.5 - camY * uToPx + shakeOffsetY)
  );
}
```

Rounding to integers (`Math.round`) eliminates subpixel shimmering on primitive edges and pixel lines.

**Screen shake (trauma model)**

Screen shake uses a non-linear trauma metric:
- Shake displacement: $\text{offset} = \text{maxShake} \times \text{trauma}^2 \times \text{noise}$, where $\text{maxShake} = 16\text{ px}$ [T].
- Trauma is added on impacts (taking damage $+0.4$, heavy hammer hit $+0.25$, elite kill $+0.3$) and capped at $1.0$.
- Decay rate: linear $-1.8\text{ s}^{-1}$ down to $0$.

## 8. Simulation-to-view synchronization and interpolation

The simulation produces read-only snapshots at 60 Hz. The view synchronizes these snapshots and interpolates positions across display refresh rates (60 Hz, 90 Hz, 120 Hz) so movement remains buttery smooth without sacrificing determinism.

**Snapshot contract**

```typescript
export interface EntitySnapshot {
  readonly id: number;
  readonly archetypeId: string;
  readonly x: number;
  readonly y: number;
  readonly prevX: number;
  readonly prevY: number;
  readonly facingAngle: number;
  readonly hpRatio: number;
  readonly isElite: boolean;
  readonly flags: number; // Bitmask: isDashing, isHit, isInvulnerable
}
```

**Interpolation formula [F]**

For any entity display coordinate:
$$x_{render} = x_{prev} \times (1 - \alpha) + x_{curr} \times \alpha$$
$$y_{render} = y_{prev} \times (1 - \alpha) + y_{curr} \times \alpha$$

Angle interpolation uses shortest-arc slerp across $[-\pi, \pi]$ to avoid 360-degree flip spins.

**ViewSync lifecycle**

`ViewSync` manages a single `Map<number, ViewEntity>` matching simulation IDs to pooled display objects. Every render frame:

1. **Mark and Sweep:** Iterate simulation entity snapshots. If an entity ID is missing in `ViewSync`, checkout a view from `VisualProvider` (section 9). Mark ID as active.
2. **Transform Update:** Apply interpolated position $(x_{render}, y_{render})$, rotation, and visual state flags (e.g., hit flash tint).
3. **Despawn Check:** Any view ID not marked active in the current snapshot is released back to its pool. If the entity died, trigger a death burst effect in `weaponEffectLayer`.
4. **Depth Sorting (Y-sorting) [F]:** Sort `entityLayer.children` by Y coordinate. To maintain 60 FPS with 150 enemies, update `zIndex` on moved entities:
   `view.zIndex = Math.floor(yRender * 100);`
   and set `entityLayer.sortableChildren = true`.

## 9. Visual provider architecture: primitives to sprites

To achieve Goal 1 (prototype on day one with zero external art assets) and Goal 5 (make every piece replaceable), visuals sit behind a `VisualProvider` interface.

```typescript
export interface ViewObject {
  readonly container: Container;
  update(snapshot: EntitySnapshot, alpha: number): void;
  reset(): void;
}

export interface VisualProvider {
  createHeroView(profession: string): ViewObject;
  createEnemyView(archetype: string, isElite: boolean): ViewObject;
  createPickupView(type: string, value: number): ViewObject;
  createWeaponEffectView(shape: string): ViewObject;
  createProjectileView(kind: string): ViewObject;
}
```

### 9.1 PrimitiveVisualProvider (Day One / Prototype)

In the prototype, all visuals are drawn from geometric shapes using the PixiJS v8 chainable Graphics API.

**Shared GraphicsContext pattern [F]**

In PixiJS v8, creating 150 unique `new Graphics()` instances with individual path commands consumes 150 separate vertex buffers and breaks batching. The engine must share a single immutable `GraphicsContext` across all instances of the same archetype:

```typescript
import { Graphics, GraphicsContext } from 'pixi.js';

// Created ONCE at startup per archetype
const chaserContext = new GraphicsContext()
  .circle(0, 0, 0.4 * U_TO_BASE_PX)
  .fill({ color: 0xe11d48 }) // Crimson body
  .stroke({ width: 2, color: 0xffffff }); // Readable white outline

export function createChaserGraphic(): Graphics {
  // Instantiated from shared context: zero GPU buffer allocation per enemy
  return new Graphics(chaserContext);
}
```

**Texture baking for static composites**

For complex primitives composed of multiple shapes (e.g. Warden hero with shield and sword), bake the composite primitive once into a `RenderTexture`:

```typescript
const heroTexture = app.renderer.generateTexture({
  target: compositeGraphics,
  resolution: 2,
});
// Reusable as a standard batched Sprite
const heroSprite = new Sprite(heroTexture);
```

### 9.2 SpriteVisualProvider (Production / Swappable)

When real art is delivered, `SpriteVisualProvider` replaces `PrimitiveVisualProvider`. It pulls pre-cut frames from a texture atlas (`garden-theme.json`) and assigns them to standard `Sprite` instances.
- Bounds, anchors, and collision radii are identical between both providers.
- Neither `sim/` nor `view/sync/` change when swapping providers.

## 10. PixiJS v8 batching, RenderGroups and draw-call optimization

The entire game (150 enemies, 30 projectiles, 50 XP gems, damage text, and HUD) must execute in **fewer than 25 draw calls** on mobile.

**Batching golden rules [F]**

1. **Shared base texture:** All game sprites (enemies, hero, projectiles, gems) must reside in a single packed sprite atlas or share baked render textures. Alternating between distinct standalone textures splits the batch into individual draw calls.
2. **Consistent blend mode:** Keep standard world objects in `blendMode = 'normal'`. Group additive particles (fire, sparks, glows) into a dedicated child container (`additiveEffectsContainer`) set to `blendMode = 'add'`. Never interleave normal and additive objects inside the same container.
3. **Avoid arbitrary masks:** Rectangular clipping masks force a stencil buffer clear and flush the batch. Use circular alpha-channel sprites or pre-baked UI assets instead of dynamic mask shapes.
4. **Avoid runtime filters:** Applying `container.filters = [new BlurFilter()]` causes PixiJS to allocate an offscreen Framebuffer Object (FBO), render the container to a texture, run a shader pass, and copy it back. This splits batches and destroys mobile frame rates. Vignettes and flashes must be drawn with simple blended quad sprites.

## 11. Memory management, object pooling and garbage collection

Garbage collection (GC) pauses are the primary cause of hitching on mobile browsers.
**Target: 0 bytes of heap allocation per frame in steady state.**

**Generic object pool**

```typescript
export class ObjectPool<T> {
  private readonly pool: T[] = [];
  constructor(
    private readonly factory: () => T,
    private readonly reset: (item: T) => void,
    initialCapacity: number
  ) {
    for (let i = 0; i < initialCapacity; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire(): T {
    return this.pool.pop() ?? this.factory();
  }

  release(item: T): void {
    this.reset(item);
    this.pool.push(item);
  }
}
```

**Pool allocations budget**

| Object type | Pre-allocated count | Max pool capacity | Reset behavior |
| --- | --- | --- | --- |
| Enemy View | 150 | 250 | `visible = false`, reset scale, clear tints |
| XP Gem View | 60 | 120 | Merge excess gems into clusters > 40 [F] |
| Projectile View | 40 | 80 | Reset life, `visible = false` |
| Damage Number Text | 30 | 60 | Reset alpha to 1, scale to 1 |
| Particle Quad | 100 | 200 | Velocity 0, alpha 1, life 0 |

**Forbidden practices in the render loop**

- No `new Point()`, `new Vector()`, or object literals `{ x, y }` during per-frame sync. Use pre-allocated static scratch variables.
- No string concatenation in the HUD loop (e.g., `'HP: ' + hp`). Update text only when the underlying value actually changes.
- Never call `displayObject.destroy()` mid-run. Always toggle visibility and return to the pool.

## 12. Visual effects, particles and feedback

Game feel effects from Core Gameplay Systems Specification section 14 are visual-only, living entirely in `view/effects/` and consuming simulation events.

**Hit flash [F]**

Custom shader filters trigger batch breaks. Instead, enemy hit flashes (0.08 s) are achieved through Pixi's native color tinting or a white overlay sprite:
```typescript
// On hit event
sprite.tint = 0xffffff;
flashTimer = 0.08;

// In render update:
if (flashTimer > 0) {
  flashTimer -= dt;
  if (flashTimer <= 0) sprite.tint = enemyBaseColor;
}
```

**Hit stop (freeze frame)**

On critical strikes or lethal boss hits, the view freezes interpolation for 0.05 s [T]. The simulation accumulator holds time, skipping render updates for 3 frames while sound and haptics fire.

**Floating damage numbers**

Floating damage numbers are pooled `BitmapText` objects spawned in `floatingTextLayer`:
- Normal hit: White text, scale 1.0, drifts up $0.8\text{ u}$ over $0.4\text{ s}$, fades out.
- Critical hit: Golden yellow text (`#fbbf24`), scale 1.4 with a bouncy spring curve, drifts up $1.2\text{ u}$ over $0.55\text{ s}$.
- Capped at 25 simultaneous visible numbers; new numbers merge with existing nearby numbers to prevent screen clutter.

**Motion trails (dash feedback)**

When the hero dashes, spawn a ghost sprite from the `heroView` every $0.03\text{ s}$ for the duration of the dash ($0.14\text{ s}$). Ghosts stay in `decalLayer`, start at `alpha = 0.6`, and fade linearly to $0$ over $0.2\text{ s}$ before returning to the pool.

## 13. UI, HUD and text rendering

The in-run HUD is drawn on the PixiJS canvas for zero-latency presentation, frame-accurate synchronization with game state, and seamless full-screen canvas recording.

**Text rendering: BitmapText only [F]**

`new Text()` in PixiJS uses the HTML Canvas 2D API to render glyphs and uploads a brand-new GPU texture on every change. Doing this for dynamic numbers (timer, health, style score) causes massive garbage collection stalls and texture memory leaks.
- All dynamic in-game text must use **`BitmapText`** (or PixiJS v8 MSDF fonts).
- Glyph sheets are baked into a single font texture containing numbers, Latin uppercase characters, and tag symbols (`slash`, `pierce`, `area`).

**HUD Layout anchors**

The HUD layer reacts to canvas resize events by anchoring elements to responsive view boundaries:

```typescript
export function layoutHUD(hudContainer: Container, width: number, height: number, safeTop: number): void {
  // Top-left: Health bar & level badge
  healthWidget.position.set(16, safeTop + 12);

  // Top-center: Style rank letter & decaying SP bar
  rankWidget.position.set(width * 0.5, safeTop + 16);

  // Top-right: Run clock & pause button
  clockWidget.position.set(width - 16, safeTop + 12);

  // Bottom-center: Level-up XP progress bar
  xpBarWidget.position.set(width * 0.5, height - 24);

  // Bottom corners: Held power-up slots
  powerUpSlotLeft.position.set(24, height - 48);
  powerUpSlotRight.position.set(width - 24, height - 48);
}
```

## 14. Lint rules, architectural boundaries and import enforcement

As established in Section 3, folder boundaries are strictly enforced. The simulation must stay 100% pure TypeScript, runnable in Node without a browser or WebGL context.

**ESLint boundary configuration (`.eslintrc.cjs`)**

```javascript
module.exports = {
  plugins: ['import'],
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Rule 1: sim cannot import view, platform, app, or pixi.js
          {
            target: './src/sim',
            from: './src/view',
            message: 'Simulation cannot import the View layer.',
          },
          {
            target: './src/sim',
            from: 'pixi.js',
            message: 'Simulation cannot import PixiJS.',
          },
          // Rule 2: core is foundational; cannot import upper layers
          {
            target: './src/core',
            from: './src/sim',
            message: 'Core utilities cannot import simulation.',
          },
          {
            target: './src/core',
            from: './src/view',
            message: 'Core utilities cannot import view.',
          },
          // Rule 3: Only src/view may import pixi.js
          {
            target: './src/!(view)/**/*',
            from: 'pixi.js',
            message: 'PixiJS imports are restricted exclusively to src/view/.',
          },
        ],
      },
    ],
  },
};
```

**CI headless validation script**

In addition to ESLint, CI runs a standalone Node smoke test that boots the simulation, loads all JSON content tables, steps 1,000 ticks with balance bots, and verifies determinism:

```bash
# Must pass in pure Node without jsdom, canvas, or WebGL stubs
pnpm test:sim-headless
```

## 15. Asset loading pipeline and bundle management

Assets load in three discrete phases to guarantee instantaneous boot (< 500 ms) and adhere to platform bundle constraints (Goal 4).

```text
Phase 0: Boot (0 KB external assets)
  ├── Vite bundle executes
  ├── PrimitiveVisualProvider initialized
  └── Game starts instantly with procedural primitive shapes

Phase 1: Essential Manifest (< 300 KB gzipped)
  ├── Preload Bitmap font atlas (numbers, letters, tag icons)
  ├── WebAudio sound effects (heavily compressed WebM/AAC)
  └── UI button frames

Phase 2: Theme Pack (Background stream, < 1.5 MB)
  ├── Atlas textures for current theme (e.g. garden.json / garden.webp)
  ├── Looping music track
  └── Swaps PrimitiveVisualProvider -> SpriteVisualProvider when ready
```

**Asset manifest definition (`Assets.init`)**

```typescript
import { Assets } from 'pixi.js';

export async function initAssetPipeline(): Promise<void> {
  await Assets.init({
    manifest: {
      bundles: [
        {
          name: 'fonts',
          assets: [
            { alias: 'game-font', src: '/assets/fonts/silkscreen.fnt' },
          ],
        },
        {
          name: 'theme-garden',
          assets: [
            { alias: 'garden-atlas', src: '/assets/themes/garden/atlas.json' },
            { alias: 'garden-music', src: '/assets/themes/garden/loop.webm' },
          ],
        },
      ],
    },
  });
}
```

**Atlas budget limits [F]**
- Maximum texture size: $2048 \times 2048\text{ px}$ (ensures compatibility with low-end mobile devices).
- Texture format: WebP with PNG fallback.
- Mipmapping disabled (`mipmap: false`) on 2D sprite textures to conserve 33% GPU VRAM.

## 16. Debug tools, performance overlay and acceptance tests

A debug overlay runs in development and QA builds, measuring the performance metrics established in this spec and the GDD.

**Debug metrics display**

The debug HUD (`src/view/debug/overlay.ts`) displays:
- **FPS & Frame Time:** Current FPS, 1-second rolling average, and 1% low frame time.
- **Draw Calls:** Real-time count of GPU draw calls per frame (target $\le 25$).
- **Entity Counts:** Active sim entities vs. active view display objects (must match exactly).
- **Pool Stats:** Active / reserved count for every object pool (detects leaks).
- **Memory Estimate:** `performance.memory.usedJSHeapSize` (Chrome) to monitor steady-state allocation.

**PixiJS DevTools integration**

In development builds, expose the application instance to the browser console:
```typescript
if (import.meta.env.DEV) {
  (globalThis as unknown as { __PIXI_APP__: Application }).__PIXI_APP__ = app;
}
```

**Acceptance criteria checklist (Milestones M1–M3)**

| # | Metric | Acceptance target | Validation method |
| --- | --- | --- | --- |
| 1 | Draw calls | $\le 25$ at peak load (150 enemies + effects) | Automated check in Playwright / Debug overlay |
| 2 | Frame rate (Mid-range) | Stable 60 FPS on iPhone 12 / Galaxy S21 equivalent | Chrome Performance mobile emulation |
| 3 | Frame rate (Low-end) | $\ge 30$ FPS floor on budget devices (Moto G) | Device lab benchmark |
| 4 | Memory stability | 0 KB/frame heap allocation during steady combat | Chrome DevTools heap allocation timeline |
| 5 | Bundle size (Code) | $< 400\text{ KB}$ gzipped including PixiJS | Vite build report in CI |
| 6 | Bundle size (Initial) | $< 1.5\text{ MB}$ total download to first playable frame | Lighthouse / Network audit in CI |
| 7 | Simulation isolation | All simulation tests pass in Node with zero DOM | `vitest run tests/sim` |
| 8 | Restart leak test | 20 consecutive runs restart with $< 5\text{ MB}$ net heap delta | Automated Playwright soak test |

**Summary: The Road from Primitives to Production**

1. Build M1 through M3 using `PrimitiveVisualProvider` and `chaserContext` shared geometry.
2. Verify all 12 gameplay acceptance tests and 8 engine benchmarks before opening an image editor.
3. Once balance feels right, swap in `SpriteVisualProvider` with the packed `garden` atlas. The game will look completely different, but run with the exact same deterministic physics and 60 FPS performance.
