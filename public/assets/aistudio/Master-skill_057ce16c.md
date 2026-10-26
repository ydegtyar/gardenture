---
name: swipe-roguelite-master
description: >
  Comprehensive master game-development skill synthesizing engine architecture (PixiJS v8),
  genre systems (survival roguelite, card drafting), technical disciplines (fixed-timestep
  physics, camera follow, trauma shake, game feel, AI state machines, input gestures,
  performance pooling, audio design, save persistence, asset pipelines), and shipping workflows.
---

# Master Game Development Skill: Swipe Roguelite

This master playbook unifies all game development disciplines, engine patterns, and architectural standards for building **Swipe Roguelite** (`yt-rogue`) — a high-performance, mobile-first 2D survival roguelite built on **PixiJS v8** and pure **TypeScript**.

---

## 1. Architectural Foundation & Module Boundaries

The project enforces a strict **7-layer decoupled architecture** where gameplay simulation is 100% independent of rendering, DOM, and PixiJS.

```text
src/
  core/       Pure math, RNG streams, clock, typed event bus, object pools (No imports)
  sim/        Deterministic rules, ECS/world, systems, wave director (Imports: core, content)
  content/    Typed JSON schemas, loaders, balance tables, theme definitions (Imports: core)
  meta/       Persistent progression, unlocks, currencies, quests (Imports: core, content, sim types)
  input/      Gesture recognition, virtual joystick, intent mapping (Imports: core)
  view/       PixiJS v8 rendering layer ONLY (Imports: core, sim [read-only types], content, input)
  platform/   External service ports & adapters: storage, ads, audio (Imports: core)
  app/        State machine wiring screens and lifecycle (Imports: all)
```

### Strict Architectural Invariants
1. **Simulation Purity:** `src/sim`, `src/core`, `src/content`, and `src/meta` must run headlessly in Node.js under Vitest with zero DOM and zero `pixi.js` imports.
2. **One-Way Data Flow:** The view reads simulation state via immutable snapshots each frame. Simulation never holds references to display containers, sprites, or callbacks into the view.
3. **Event-Driven Upward Comms:** Simulation communicates state transitions (`EnemyKilled`, `LevelUp`, `StyleRankChanged`) through a typed event bus. The view and audio listen to events to trigger cosmetic feedback.
4. **Data Over Code:** Weapons, cards, enemies, waves, and themes are authored in validated JSON tables. Adding new content requires zero engine modifications.

---

## 2. PixiJS v8 Rendering & Display Engine

### 2.1 Asynchronous Application Boot
PixiJS v8 replaces synchronous constructors with asynchronous initialization. Configure for mobile fill-rate protection, battery efficiency, and context loss resilience:

```typescript
import { Application } from 'pixi.js';

export async function createPixiApp(container: HTMLElement): Promise<Application> {
  const app = new Application();
  await app.init({
    preference: 'webgl',                                   // WebGL 2 first for launch stability
    powerPreference: 'high-performance',
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2x DPR to protect mobile GPU fill rate
    antialias: false,                                      // Turn off MSAA: 2D sprite fill rate matters more
    background: '#12131a',                                 // Theme background color prevents boot flashes
    resizeTo: container,
    roundPixels: true,                                     // Eliminates subpixel edge shimmering on primitives
  });
  container.appendChild(app.canvas);
  return app;
}
```

### 2.2 Scene Graph Hierarchy & RenderGroup Policy
Visual containers are created once at boot and never re-parented dynamically:

```text
app.stage
  ├── worldContainer (Camera-transformed: scaled, translated, rotated)
  │     ├── groundLayer (TilingSprite; renderGroup: true)
  │     ├── decalLayer (Impact marks, dash motion trails)
  │     ├── pickupLayer (XP gems, magnet seeds, health drops)
  │     ├── shadowLayer (Shared oval drop-shadow GraphicsContext)
  │     ├── entityLayer (Hero, enemies, elites; sortableChildren: true, Y-sorted per frame)
  │     ├── weaponEffectLayer (Slash arcs, spear thrust lines, petal orbits)
  │     ├── projectileLayer (Player seed blades, enemy spit shots)
  │     └── floatingTextLayer (Damage numbers, style popups)
  └── screenOverlayContainer (Screen-space: fixed to window dimensions, no camera transform)
        ├── vignetteLayer (Low-health red pulse, damage flashes)
        ├── joystickLayer (Floating touch anchor and drag knob)
        ├── hudLayer (Health bar, XP bar, style rank badge, clock; renderGroup: true)
        ├── menuLayer (Level-up card modal, pause menu, victory/defeat summary)
        └── debugLayer (FPS counter, draw-call monitor, memory metrics)
```

**RenderGroup Rules:**
- `renderGroup: true` on `hudLayer` and `groundLayer` isolates them into independent GPU render passes, preventing UI changes from invalidating the dynamic world sprite batch.
- `renderGroup: false` on `entityLayer`: Dynamic Y-sorting inside individual render groups causes texture thrashing. Keep `entityLayer` as a single flat sprite batch.
- **Frustum Culling:** Entities beyond camera view bounds (plus 2.0 world units buffer) set `cullable = true` so PixiJS v8 automatically skips CPU matrix transforms.

### 2.3 Shared GraphicsContext Pattern (Day-One Primitives)
To support Goal 1 (prototype on day one with zero external art assets) without breaking batching, instantiate graphics from a shared immutable `GraphicsContext`:

```typescript
import { Graphics, GraphicsContext } from 'pixi.js';

// Pre-baked once at startup per archetype
const chaserContext = new GraphicsContext()
  .circle(0, 0, 0.4 * U_TO_BASE_PX)
  .fill({ color: 0xe11d48 })
  .stroke({ width: 2, color: 0xffffff });

export function createChaserGraphic(): Graphics {
  return new Graphics(chaserContext); // Reuses GPU vertex buffer across 150+ instances
}
```

---

## 3. Deterministic Simulation & Physics Tuning

### 3.1 Fixed-Timestep Accumulator Loop
The simulation runs at a constant 60 Hz ($16.667\text{ ms}$ tick), fully decoupled from variable display refresh rates (60 Hz, 90 Hz, 120 Hz):

```typescript
const TICK_MS = 1000 / 60;
const MAX_CATCHUP_TICKS = 4;
let accumulator = 0;

app.ticker.add((ticker) => {
  // Clamp deltaMS to 100ms to prevent spiral-of-death when resuming background tabs
  const deltaMS = Math.min(ticker.deltaMS, 100);
  accumulator += deltaMS;

  let ticksRun = 0;
  while (accumulator >= TICK_MS && ticksRun < MAX_CATCHUP_TICKS) {
    sim.tick();
    accumulator -= TICK_MS;
    ticksRun++;
  }

  if (ticksRun >= MAX_CATCHUP_TICKS) {
    accumulator = 0; // Drop time debt if frame severely stalled
  }

  // Fractional interpolation progress [0, 1)
  const alpha = accumulator / TICK_MS;
  viewSync.render(alpha);
});
```

### 3.2 Sub-Frame Interpolation
Display coordinates interpolate between previous and current simulation ticks to ensure smooth rendering:

$$x_{render} = x_{prev} \cdot (1 - \alpha) + x_{curr} \cdot \alpha$$
$$y_{render} = y_{prev} \cdot (1 - \alpha) + y_{curr} \cdot \alpha$$

Angle interpolation uses shortest-arc angular slerp across $[-\pi, \pi]$ to prevent 360-degree flip spins:
$$\Delta\theta = ((\theta_{curr} - \theta_{prev} + \pi) \pmod{2\pi}) - \pi$$
$$\theta_{render} = \theta_{prev} + \Delta\theta \cdot \alpha$$

### 3.3 Collision Tuning & Continuous Collision Detection (CCD)
- **Spatial Hash Grid:** Use a 2D spatial grid with cell size equal to $2\times$ average enemy diameter ($1.6\text{ u}$). Queries take $O(1)$ amortized time.
- **Circle Colliders:** Rely on Euclidean radius tests ($dist^2 \le (r_1 + r_2)^2$) avoiding expensive square roots.
- **Continuous Collision Detection (CCD):** Fast projectiles (velocity $> 15\text{ u/s}$) sweep line segments between $(x_{prev}, y_{prev})$ and $(x_{curr}, y_{curr})$ to eliminate tunneling through thin colliders.

### 3.4 Seeded Deterministic RNG
All gameplay randomness uses named seeded PRNG streams (e.g., PCG32 or Mulberry32). Never call `Math.random()` in simulation:

```typescript
export interface RNGStreams {
  readonly spawn: RNG;      // Wave spawns and elite rolls
  readonly cards: RNG;      // Card draft selections
  readonly drops: RNG;      // Gem and power-up drops
  readonly combat: RNG;     // Damage spread and crit checks
  readonly cosmetic: RNG;   // View-layer visual variations only
}
```

---

## 4. Mobile-First Input & Responsive Viewport

### 4.1 Relative Gesture Control (Floating Joystick)
Controls use relative gestures anchored at touch-start rather than static screen regions:

```typescript
export class TouchGestureController {
  private anchorX = 0;
  private anchorY = 0;
  private isTouching = false;
  private touchStartTime = 0;
  private readonly DEADZONE_PX = 8;
  private readonly MAX_RADIUS_PX = 60;
  private readonly FLICK_TIME_MS = 180;
  private readonly FLICK_DIST_PX = 40;

  onTouchStart(x: number, y: number, time: number): void {
    this.anchorX = x;
    this.anchorY = y;
    this.touchStartTime = time;
    this.isTouching = true;
  }

  onTouchMove(x: number, y: number): IntentVector {
    if (!this.isTouching) return { x: 0, y: 0 };
    const dx = x - this.anchorX;
    const dy = y - this.anchorY;
    const dist = Math.hypot(dx, dy);
    if (dist < this.DEADZONE_PX) return { x: 0, y: 0 };
    const clampedDist = Math.min(dist, this.MAX_RADIUS_PX);
    const angle = Math.atan2(dy, dx);
    return {
      x: Math.cos(angle) * (clampedDist / this.MAX_RADIUS_PX),
      y: Math.sin(angle) * (clampedDist / this.MAX_RADIUS_PX),
    };
  }

  onTouchEnd(x: number, y: number, time: number): ActionIntent | null {
    if (!this.isTouching) return null;
    this.isTouching = false;
    const dt = time - this.touchStartTime;
    const dx = x - this.anchorX;
    const dy = y - this.anchorY;
    const dist = Math.hypot(dx, dy);

    // Fast flick triggers Dash action
    if (dt <= this.FLICK_TIME_MS && dist >= this.FLICK_DIST_PX) {
      return { type: 'DASH', angle: Math.atan2(dy, dx) };
    }
    return null;
  }
}
```

### 4.2 Shorter-Side Viewport Anchoring
To ensure uniform gameplay difficulty and enemy density across portrait (9:16), square (1:1), and landscape (16:9), the camera anchors scale to the shorter screen dimension:

| Orientation | Visible Short Side | Long Side Constraint | Unit-to-Pixel Scale (`uToPx`) |
| :--- | :--- | :--- | :--- |
| Portrait (9:16) | 9.0 u | Up to 16.0 u | `screenWidth / 9.0` |
| Tall Portrait (9:19.5) | 9.0 u | Capped at 18.0 u | `screenWidth / 9.0` |
| Square (1:1) | 11.0 u | Capped at 11.0 u | `screenWidth / 11.0` |
| Landscape (16:9) | 9.0 u | Capped at 14.0 u (Pillarbox excess) | `screenHeight / 9.0` |

---

## 5. Camera Follow & Screen Shake (Trauma Model)

### 5.1 Exponential Smoothing Follow & Look-Ahead
The camera tracks the hero with directional look-ahead smoothed by frame-rate-independent exponential decay:

$$\vec{pos}_{cam} \leftarrow \vec{pos}_{cam} + (\vec{target} - \vec{pos}_{cam}) \cdot (1 - e^{-\lambda \Delta t})$$
- Base look-ahead distance: $0.8\text{ u}$ in current movement direction.
- Damping factor: $\lambda \approx 12.0$ (smoothing time $\approx 0.25\text{ s}$).

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
  // Round to integer pixels to eliminate subpixel shimmering
  worldContainer.position.set(
    Math.round(screenWidth * 0.5 - camX * uToPx + shakeOffsetX),
    Math.round(screenHeight * 0.5 - camY * uToPx + shakeOffsetY)
  );
}
```

### 5.2 Trauma Model Screen Shake
Screen shake uses a non-linear trauma metric where small hits create subtle vibrations and heavy impacts deliver explosive kicks:

- $\text{offset} = \text{maxShake} \cdot \text{trauma}^2 \cdot \text{noise}$, where $\text{maxShake} = 16\text{ px}$.
- **Trauma Sources:** Taking damage ($+0.4$), hammer/heavy crit ($+0.25$), elite defeat ($+0.3$). Capped at $1.0$.
- **Decay:** Linear $-1.8\text{ s}^{-1}$ down to $0$.

---

## 6. Roguelike Systems & In-Run Progression

### 6.1 Core Loop & Target Timeline
The game is built on 3 nested loops:
1. **Moment-to-Moment (Seconds):** Thumb drag movement, auto-swing nearest target, XP gem collection, and style rank maintenance.
2. **Per-Run (2 to 4 Minutes):** Rapid early level-ups, special monster events every 45–60s, mid-run mini-boss at 2:00, and final boss at 4:30.
3. **Meta (Days):** Currency spend on professions, trinket slots, and mastery tiers.

| Time Window | Phase | Primary Objective |
| :--- | :--- | :--- |
| 0:00 – 0:08 | First Wave | Weak chasers; first level-up guaranteed by 0:08 |
| 0:08 – 0:40 | Build Formation | 3 card choices; first special monster warning |
| 0:40 – 1:30 | Density Ramp | Dashers/spitters appear; style meter climbs to A |
| 1:30 – 2:10 | Mini-Boss Gauntlet | Mid-run boss, item chest drop, card evolution setup |
| 2:10 – 3:30 | Elite Pressure | Mixed waves with curse modifiers; survival test |
| 4:00 – 5:00 | Climax Boss | Multi-phase arena boss; clear run completion |

### 6.2 3-Card Drafting System & Synergy Tags
On level-up, the game offers 3 unique cards weighted by the player's Luck stat:
- **Card Types:** `Stat` (raw multipliers), `Behavior` (mechanic alters), `Synergy` (tag bridges), `Weapon` (slots/evolutions), and `RiskReward`.
- **Tag Synergy Matrix:** Tags (`slash`, `pierce`, `area`, `crit`, `poison`, `fire`) combine combinatorially. Example: A card with `[slash, area]` triggers bonus effects when paired with wide arc weapons.
- **Anti-Frustration Rules:** Prevent duplicate card offers in the same draft. If 3 consecutive common cards roll, guarantee an uncommon or higher card on the subsequent roll.

### 6.3 Style Rank Meter (Devil May Cry Style)
Rewards aggressive, varied gameplay over passive kiting:
- **Ranks:** `D` $\to$ `C` $\to$ `B` $\to$ `A` $\to$ `S` $\to$ `SS` $\to$ `SSS`.
- **Multipliers:** Scales both in-run score and end-of-run currency payout ($1.0\times$ at D up to $3.5\times$ at SSS).
- **Gain Events:** Consecutive kill streaks within window ($+15$), dashing through enemies ($+25$), alternating attack shapes ($+20$), defeating special monsters ($+80$).
- **Decay & Penalties:** Taking damage drops rank by 1 full tier; remaining idle decays meter linearly.

---

## 7. Enemy Archetypes & Boss State Machines

### 7.1 Enemy Archetypes & Behaviors
Enemies are data-driven archetypes configured with specific threat and counter dynamics:

| Archetype | Movement / Targeting Behavior | Primary Threat | Counter Play |
| :--- | :--- | :--- | :--- |
| **Chaser** | Direct steering toward hero in dense swarms | Space compression | Area / Cleave weapons |
| **Dasher** | Halts, telegraphs red line ($0.4\text{ s}$), charges | Burst damage | Timed dash dodge |
| **Spitter** | Keeps distance ($4.0\text{ u}$), fires slow projectile | Long-range chip | Close gap & burst |
| **Brute** | Slow, immune to light knockback, high HP | Wall obstacle | Single-target DPS |
| **Splitter** | Medium speed; spawns 2 mini-chasers on death | Secondary swarm | Pierce / Area cleanup |
| **Shielded** | Reflects frontal attacks ($-90\%$ damage) | Positional puzzle | Flank or projectile orbit |

### 7.2 Boss Behavior Tree / Hierarchical FSM
Bosses execute multi-phase telegraphed combat routines:

```text
Boss FSM Root
  ├── Phase 1: Standard Assault (> 60% HP)
  │     ├── Sub-state: Strafe & Spit (Ranged pressure)
  │     └── Sub-state: Telegraphed Charge (Area danger)
  ├── Phase 2: Frenzy Transition (At 60% HP)
  │     └── Sub-state: Invulnerable Roar + Arena Spore Rings
  └── Phase 3: Enraged Desperation (< 30% HP)
        ├── Sub-state: Triple Slam + Shockwaves
        └── Sub-state: Continuous Minion Summoning
```

---

## 8. Multi-Layered Game Feel (Juice)

All visual feedback is event-driven, operating purely within `src/view/effects/`:

```typescript
export class GameFeelManager {
  // 1. Hit Flash: Native sprite tinting (0.08s) avoids expensive shader batch breaks
  static triggerHitFlash(sprite: Sprite, originalTint: number): void {
    sprite.tint = 0xffffff;
    setTimeout(() => { sprite.tint = originalTint; }, 80);
  }

  // 2. Hit-Stop: Briefly freeze visual interpolation on critical impacts
  static triggerHitStop(durationMs: number = 50): void {
    simClock.pauseVisualTicks(durationMs);
  }

  // 3. Motion Trails: Dash ghost sprites spawned every 30ms, fading over 200ms
  static spawnDashGhost(viewContainer: Container, texture: Texture, x: number, y: number): void {
    const ghost = ghostPool.acquire();
    ghost.texture = texture;
    ghost.position.set(x, y);
    ghost.alpha = 0.6;
    ghost.fade(200); // Decays to 0 and returns to pool
  }
}
```

### Floating Damage Numbers Policy
- Pooled `BitmapText` instances spawned in `floatingTextLayer`.
- Normal hits: White text, scale 1.0, drifts up $0.8\text{ u}$ over $0.4\text{ s}$, fades out.
- Critical hits: Golden yellow (`#fbbf24`), scale 1.4 with bouncy spring easing, drifts up $1.2\text{ u}$ over $0.55\text{ s}$.
- Max 25 simultaneous visible numbers; merges excess nearby numbers to prevent visual clutter.

---

## 9. Audio Architecture & WebAudio Integration

### 9.1 Browser First-Interaction Unlock
Mobile browsers suspend WebAudio until an explicit user interaction occurs. The boot sequence holds audio playback until unlocked:

```typescript
export async function unlockAudioContext(audioCtx: AudioContext): Promise<void> {
  if (audioCtx.state === 'suspended') {
    const unlock = async () => {
      await audioCtx.resume();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }
}
```

### 9.2 Decibel-Based Bus Hierarchy
Sound outputs route through named gain buses (`Master`, `Music`, `SFX`, `UI`). Sliders map through perceptual decibel formulas:

$$\text{gain} = \begin{cases} 0 & \text{if } slider = 0 \\ 10^{(20 \cdot \log_{10}(slider)) / 20} & \text{if } slider > 0 \end{cases}$$

### 9.3 Dynamic Adaptive Music by Style Rank
The background music consists of synchronized vertical stems (Base, Percussion, Lead, Synth). The Lead and Synth stems unmute as the player's Style Rank climbs to `A` and `S`, giving instant acoustic reinforcement to skilled play.

---

## 10. Memory Management & Performance Budgets

**Zero Heap Allocations Rule:** No `new Point()`, object literals `{ x, y }`, or array allocations inside the 60 Hz simulation and render loops. Use static scratch objects.

### 10.1 Generic Object Pool Implementation

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

### 10.2 Pre-Allocated Budgets & Limits
| Entity Type | Initial Pool | Max Active Capacity | Reset Action |
| :--- | :--- | :--- | :--- |
| Enemies | 150 | 250 | Set `visible = false`, clear status tints |
| XP Gems | 60 | 120 | Merge clusters if count $> 40$ |
| Projectiles | 40 | 80 | Reset life timer, disable collider |
| Damage Text | 30 | 60 | Reset alpha to 1, scale to 1 |
| Particles | 100 | 200 | Set velocity 0, life 0 |

### 10.3 Draw-Call Budget
The entire frame must render in **under 25 draw calls** on mobile WebGL:
1. All in-game sprites (enemies, hero, projectiles, gems) reside in a single packed texture atlas (`atlas.json`).
2. World objects maintain `blendMode = 'normal'`. Additive effects (fire, glowing sparks) are grouped in a dedicated sub-container with `blendMode = 'add'` to prevent batch fragmentation.
3. Dynamic text uses `BitmapText` only. HTML Canvas `new Text()` is strictly forbidden in gameplay.

---

## 11. Persistence & Meta-Progression (Save Systems)

### 11.1 Pure Data Schema & Versioning
Save state contains pure primitive data, numbers, and IDs. Never serialize live engine objects:

```typescript
export interface SaveDataV1 {
  version: 1;
  timestamp: number;
  currencies: {
    coins: number;
    seeds: number;
  };
  unlocks: {
    professions: string[];
    weapons: string[];
    trinkets: string[];
  };
  loadout: {
    professionId: string;
    weaponId: string;
    trinketIds: string[];
  };
  stats: {
    totalRuns: number;
    bossKills: number;
    highestStyleRank: string;
    bestScore: number;
  };
}
```

### 11.2 Migration & Atomic LocalStorage Write
- **Version Migrations:** Each schema change increments `version`. Run linear migration passes (`v1ToV2(data)`, `v2ToV3(data)`) on load.
- **Atomic Write:** Write serialized JSON to a temporary staging key (`yt_rogue_save_temp`) before committing to the primary save key (`yt_rogue_save`). Catch storage quota errors gracefully.

---

## 12. Asset Pipeline & Visual Providers

### 12.1 Swappable VisualProvider Interface
Abstracts the view implementation so the game can be fully developed with geometric primitives on day one, and later swapped for production sprite sheets without touching simulation logic:

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

### 12.2 Three-Phase Asset Loading
1. **Phase 0: Boot (< 500 ms, 0 KB external art):** Starts immediately using `PrimitiveVisualProvider` and procedural geometry.
2. **Phase 1: Essential Manifest (< 300 KB):** Preloads MSDF bitmap font atlas, UI frames, and compressed WebAudio sound effects.
3. **Phase 2: Theme Pack (Streaming, < 1.5 MB):** Asynchronously loads sprite atlas (`garden.webp` / `garden.json`) and background music. Smoothly hot-swaps `PrimitiveVisualProvider` to `SpriteVisualProvider`.

---

## 13. Workflows & HTML5 Publishing

### 13.1 Rapid Prototyping Checklist
- [ ] Define the single core verb (thumb drag auto-attack) and test it within 1 hour.
- [ ] Implement greybox primitives; postpone real art until core combat feels satisfying.
- [ ] Validate first level-up arrival under 8 seconds.
- [ ] Measure frame pacing on a low-end mobile device before adding new systems.

### 13.2 HTML5 Web Distribution (itch.io / Butler / Web Portals)
- Build output produces a single minified bundle with asset hashing.
- Deploy builds to itch.io using the automated Butler pipeline:
  ```bash
  butler push dist/ username/swipe-roguelite:html5 --userversion 1.0.0
  ```
- Keep total initial payload under 5 MB to comply with mobile web portal and YouTube Playables constraints.

---

## 14. Verification Playbook & Quality Gates

Before merging any code or delivering a new feature, verify against these quality gates:

1. **Headless Node Test:** Run `pnpm test:sim-headless`. The simulation, combat formulas, card pools, and wave director must execute 1,000 deterministic ticks without a browser, DOM, or WebGL context.
2. **Import Boundary Check:** Ensure no file in `src/sim`, `src/core`, `src/content`, or `src/meta` imports `pixi.js` or `src/view`.
3. **Allocation Audit:** Profile 60 seconds of combat in Chrome DevTools Memory Inspector. Verify heap allocations drop to 0 bytes/frame in steady state.
4. **Draw-Call Check:** Open the in-game debug overlay and confirm total GPU draw calls remain $\le 25$ during peak 150-enemy waves.
5. **Aspect-Ratio Verification:** Test the game viewport at 9:16 (Portrait), 1:1 (Square), and 16:9 (Landscape) to confirm shorter-side unit scaling and touch controls remain identical.
