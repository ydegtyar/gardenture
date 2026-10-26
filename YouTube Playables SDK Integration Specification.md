# YouTube Playables SDK Integration Specification

Oct 23, 2026 · @Yuriy

## 1. Purpose, scope and architectural boundaries

This document defines the complete integration of the **YouTube Playables SDK (`ytgame`)** across every system in *Swipe Roguelite*: boot readiness signals, pause/resume lifecycle, system audio synchronization, cloud/local state persistence, rewarded ad flows (revive, card reroll, double currency, cosmetic pips), high-score engagement reporting, localization, health logging, and bundle certification constraints.

It bridges the [Game Design Document](file:///Users/degtyar/code/ydegtyar/yt-rogue/Game%20Design%20Document%20Swipe%20Roguelite%20(Working%20Title).md), the [Core Gameplay Systems Specification](file:///Users/degtyar/code/ydegtyar/yt-rogue/Core%20Gameplay%20Systems%20Specification.md), and the [PixiJS Setup and Architecture Specification](file:///Users/degtyar/code/ydegtyar/yt-rogue/PixiJS%20Setup%20and%20Architecture%20Specification.md).

**Conventions**

| Term | Meaning |
| --- | --- |
| `[F]` | Fixed architectural or platform certification rule. Must not be violated. |
| `[T]` | Tunable parameter (cooldowns, caps, fallback prices). Safe to adjust during balance. |
| `ytgame` | Global namespace injected by `<script src="https://www.youtube.com/game_api/v1"></script>`. |
| Port | A pure TypeScript interface in `src/platform/ports/` consumed by `app/` and `meta/`. |
| Adapter | A concrete implementation of a Port (`src/platform/youtube/`, `src/platform/web/`, `src/platform/mock/`). |

### 1.1 Strict layer isolation `[F]`

Per the 7-layer architecture in `PixiJS Setup and Architecture Specification.md` (Sections 3, 4, and 14), **neither `sim/`, `core/`, `content/`, nor `view/` may ever access `window.ytgame`**. All YouTube Playables SDK calls are encapsulated inside `src/platform/youtube/` behind explicit ports:

```text
src/platform/
  ports/
    PlatformFacade.ts        Aggregates all platform ports
    LifecyclePort.ts         firstFrameReady, gameReady, onPause, onResume
    AudioPlatformPort.ts     isAudioEnabled, onAudioEnabledChange
    StoragePort.ts           loadData, saveData (with local fallback)
    AdsPort.ts               requestRewardedAd, requestInterstitialAd
    EngagementPort.ts        sendScore, openYTContent
    I18nPlatformPort.ts      getLanguage
    HealthPort.ts            logError, logWarning
  youtube/
    ytgame.d.ts              Ambient TypeScript declarations for window.ytgame
    YouTubePlatformAdapter.ts Concrete implementation backed by ytgame v1
  web/
    WebPlatformAdapter.ts    Standalone browser / PWA / web portal fallback
  mock/
    MockPlatformAdapter.ts   Deterministic Node / Vitest adapter for headless bots
```

**ESLint boundary addition (`.eslintrc.cjs`) `[F]`:**

```javascript
{
  target: './src/!(platform)/**/*',
  from: './src/platform/youtube',
  message: 'Only src/platform/ may import YouTube SDK specifics; consume PlatformFacade ports instead.',
}
```

---

## 2. SDK loading, environment detection and TypeScript declarations

### 2.1 HTML script loading order `[F]`

The YouTube Playables SDK script **must** be loaded synchronously in the root `index.html` *before* the Vite application entry script. All asset paths in `index.html` must be **relative** (`./`), never root-relative (`/`), so the game resolves files inside YouTube's sandboxed iframe subdirectory.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>Swipe Roguelite</title>
  <link rel="stylesheet" href="./style.css" />
  <!-- 1. Load YouTube Playables SDK FIRST [F] -->
  <script src="https://www.youtube.com/game_api/v1"></script>
</head>
<body>
  <div id="game-container"></div>
  <!-- 2. Load Vite bundled game entry AFTER ytgame is defined [F] -->
  <script type="module" src="./src/main.ts"></script>
</body>
</html>
```

### 2.2 Ambient TypeScript definitions (`src/platform/youtube/ytgame.d.ts`)

```typescript
export declare namespace ytgame {
  const SDK_VERSION: string;
  const IN_PLAYABLES_ENV: boolean;

  enum ErrorType {
    UNKNOWN = 'UNKNOWN',
    API_UNAVAILABLE = 'API_UNAVAILABLE',
    INVALID_PARAMS = 'INVALID_PARAMS',
    NETWORK_ERROR = 'NETWORK_ERROR',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  }

  interface SdkError {
    readonly errorType: ErrorType | string;
    readonly message?: string;
  }

  type UnsetCallback = () => void;

  namespace game {
    /** Signals that the first visual frame has been drawn to the canvas. Must precede gameReady(). */
    function firstFrameReady(): void;
    /** Signals that the game is fully interactive and ready for player input. */
    function gameReady(): void;
    /** Saves serialized UTF-8 player data string (< 3 MiB hard limit, < 500 KiB recommended). */
    function saveData(data: string): Promise<void>;
    /** Loads previously saved UTF-8 player data string, or empty string if none exists. */
    function loadData(): Promise<string>;
  }

  namespace system {
    /** Returns whether game audio is currently enabled by the YouTube host container. */
    function isAudioEnabled(): boolean;
    /** Registers a callback fired whenever YouTube toggles the game's audio mute state. */
    function onAudioEnabledChange(callback: (isAudioEnabled: boolean) => void): UnsetCallback;
    /** Registers a callback fired when YouTube pauses or evicts the game. */
    function onPause(callback: () => void): UnsetCallback;
    /** Registers a callback fired when YouTube resumes the game from a paused state. */
    function onResume(callback: () => void): UnsetCallback;
    /** Returns the user's current locale as a BCP-47 language tag (e.g., 'en-US'). */
    function getLanguage(): Promise<string>;
  }

  namespace ads {
    /** Requests an interstitial ad. Resolves when closed or skipped. */
    function requestInterstitialAd(): Promise<void>;
    /**
     * Requests a rewarded ad for a specific non-PII reward identifier.
     * Resolves to `true` if the player earned the reward, `false` otherwise.
     */
    function requestRewardedAd(rewardId: string): Promise<boolean>;
  }

  namespace engagement {
    interface Score {
      value: number;
    }
    interface YTContent {
      id: string;
    }
    /** Sends the player's highest integer score to YouTube for leaderboard/UI display. */
    function sendScore(score: Score): Promise<void>;
    /** Requests YouTube to open a specific YouTube video by its 11-character ID. */
    function openYTContent(content: YTContent): Promise<void>;
  }

  namespace health {
    /** Logs a runtime error event to YouTube Playables telemetry. */
    function logError(): void;
    /** Logs a runtime warning event to YouTube Playables telemetry. */
    function logWarning(): void;
  }
}

declare global {
  interface Window {
    ytgame?: typeof ytgame;
  }
}
```

### 2.3 Runtime environment detection (`src/boot/createPlatform.ts`)

Always check both `window.ytgame` existence and `window.ytgame.IN_PLAYABLES_ENV` before activating the YouTube adapter. When running on `localhost` without the Playables Test Suite, `ytgame` may exist as a no-op stub where `IN_PLAYABLES_ENV` is `false`.

```typescript
import type { PlatformFacade } from '../platform/ports/PlatformFacade';
import { YouTubePlatformAdapter } from '../platform/youtube/YouTubePlatformAdapter';
import { WebPlatformAdapter } from '../platform/web/WebPlatformAdapter';
import { MockPlatformAdapter } from '../platform/mock/MockPlatformAdapter';

export function createPlatformFacade(): PlatformFacade {
  if (typeof window === 'undefined') {
    return new MockPlatformAdapter();
  }
  if (window.ytgame && window.ytgame.IN_PLAYABLES_ENV) {
    return new YouTubePlatformAdapter(window.ytgame);
  }
  return new WebPlatformAdapter();
}
```

---

## 3. Boot sequence, asset streaming and readiness signals

YouTube Playables requires two distinct lifecycle signals in strict sequence (`[F]`):
1. `ytgame.game.firstFrameReady()` — fired the instant the first visual frame is rendered on the canvas.
2. `ytgame.game.gameReady()` — fired **only** when the player can actively tap and play (never on a blank canvas or un-interactive loading spinner). YouTube enforces a `< 5 s` time-to-interactive requirement.

### 3.1 Alignment with the 3-Phase Asset Pipeline

Because our architecture (`PixiJS Setup and Architecture Specification.md` Section 15) boots with procedural shapes (`PrimitiveVisualProvider`) using 0 KB of external textures, we hit both signals in under **500 ms**:

```text
[0 ms]    index.html loads https://www.youtube.com/game_api/v1
[40 ms]   main.ts creates YouTubePlatformAdapter, attaches onPause / onResume / onAudioEnabledChange
[120 ms]  PixiJS v8 app.init() completes, mounts <canvas>, draws Phase 0 procedural background & logo
[125 ms]  ──► CALL ytgame.game.firstFrameReady() [F]
[130 ms]  Parallel execution:
            ├── ytgame.game.loadData() -> parse & migrate SaveDataV1
            ├── ytgame.system.getLanguage() -> select locale string table
            ├── ytgame.system.isAudioEnabled() -> configure AudioMixer mute gate
            └── PixiJS Assets.loadBundle('fonts') (< 300 KB essential manifest)
[380 ms]  Mount interactive Home Screen (or "Resume Interrupted Run" prompt if activeRun exists)
[390 ms]  ──► CALL ytgame.game.gameReady() [F]
[400 ms+] Background stream Assets.loadBundle('theme-garden') (< 1.5 MB)
          └── Swap PrimitiveVisualProvider -> SpriteVisualProvider seamlessly
```

### 3.2 Boot Coordinator Implementation (`src/boot/bootstrap.ts`)

```typescript
export async function bootstrapGame(container: HTMLElement): Promise<void> {
  const platform = createPlatformFacade();

  // 1. Register lifecycle & audio hooks before any async work [F]
  platform.lifecycle.registerHandlers({
    onPause: () => appController.handlePlatformPause(),
    onResume: () => appController.handlePlatformResume(),
  });
  platform.audio.onMuteChange((enabled) => audioMixer.setPlatformAudioEnabled(enabled));

  // 2. Initialize PixiJS v8 renderer and draw first procedural frame
  const pixiApp = await createPixiApp(container);
  appController.renderBootFrame(pixiApp);
  pixiApp.render(); // Force synchronous first frame draw to WebGL buffer

  // 3. Signal First Frame Ready to YouTube [F]
  platform.lifecycle.notifyFirstFrameReady();

  // 4. Load save data, locale, and Phase 1 essential assets concurrently
  const [rawSave, languageCode] = await Promise.all([
    platform.storage.load(),
    platform.i18n.getLanguage(),
    initEssentialAssets(),
  ]);

  // 5. Hydrate meta state, localization, and initial audio state
  i18n.setLocale(languageCode);
  audioMixer.setPlatformAudioEnabled(platform.audio.isAudioEnabled());
  const saveState = saveManager.hydrate(rawSave);

  // 6. Mount interactive Home Screen (and reconcile any unsynced high score)
  appController.mountInteractiveHome(saveState);
  if (saveState.bestScores.unsynced && saveState.bestScores.allTime > 0) {
    void platform.engagement.sendScore(saveState.bestScores.allTime).then((ok) => {
      if (ok) saveManager.markScoreSynced();
    });
  }

  // 7. Signal Game Ready — player can now tap "Play" immediately [F]
  platform.lifecycle.notifyGameReady();

  // 8. Stream Phase 2 Theme Pack in background without blocking interaction
  void streamThemePackInBackground('theme-garden');
}
```

---

## 4. System lifecycle: pause, resume and eviction safety

### 4.1 Why `ytgame.system.onPause` is mandatory `[F]`

In YouTube Playables, the game runs inside a managed webview/iframe container. When the user minimizes the YouTube mini-player, opens the YouTube account drawer, views an ad, switches apps, or exits the Playable, YouTube fires `ytgame.system.onPause()`. Standard DOM `visibilitychange` events are not guaranteed to fire when the YouTube overlay covers the game.

Crucially, per official SDK rules:
1. `onPause` is triggered for **all** pauses, including when the user permanently closes the Playable.
2. There is **no guarantee** that `onResume` will ever be called after `onPause`.
3. The game has only a **short execution window** inside `onPause` to persist state before the webview is evicted from memory.

### 4.2 Pause and resume state machine across game screens

| Active Game State when `onPause` fires | Action on `onPause()` | Action on `onResume()` |
| --- | --- | --- |
| **In-Run Active Combat** | 1. Set `isPlatformPaused = true`.<br>2. Clear `accumulator = 0` so no catch-up ticks fire.<br>3. Reset active floating joystick touch vector (`input.cancelActiveTouches()`).<br>4. Suspend WebAudio context.<br>5. Immediately serialize `activeRun` checkpoint into `saveData` and call `ytgame.game.saveData()`.<br>6. Render Pause Overlay (`menuLayer`). | 1. Keep simulation frozen while displaying the **1.0-second visible re-orientation countdown ring** (`Core Gameplay Systems Specification.md` Section 2).<br>2. Grant `0.5 s` post-resume contact-damage grace window.<br>3. Re-verify `ytgame.system.isAudioEnabled()` and resume WebAudio if enabled.<br>4. Unfreeze simulation ticks when the 1.0 s ring completes. |
| **In-Run Card Choice Modal** | 1. Keep simulation paused.<br>2. Freeze the 30-second slow-motion card pressure timer.<br>3. Suspend WebAudio.<br>4. Save `activeRun` checkpoint (including the 3 currently offered card IDs so the player cannot force-close to get a free reroll `[F]`). | 1. Resume WebAudio if enabled.<br>2. Keep the exact same 3 cards on screen and resume the card selection modal without starting combat until a card is picked. |
| **In-Run Ad Request in Progress** | Ad flow already paused simulation and audio; mark `pausedByPlatform = true`. | Wait for both `onResume()` **and** the `requestRewardedAd()` Promise settlement before triggering post-ad logic. |
| **Home / Loadout / Store / Summary** | 1. Pause UI animations and audio.<br>2. Flush any dirty meta-progression state via `ytgame.game.saveData()`. | 1. Resume UI loop and audio (if enabled). |

### 4.3 Lifecycle integration with the fixed-timestep loop (`src/app/GameLoop.ts`)

```typescript
export class GameLoopController {
  private isPlatformPaused = false;
  private isModalPaused = false; // Card selection, Revive modal, manual Pause menu
  private resumeCountdownMs = 0; // 1000ms re-orientation ring after platform resume [F]
  private accumulator = 0;

  public handlePlatformPause(): void {
    this.isPlatformPaused = true;
    this.accumulator = 0;
    this.inputManager.clearAllIntents(); // Prevent stuck thumb drag / phantom dash on resume [F]
    this.audioMixer.onPlatformPause();
    // Immediately flush both meta progression and mid-run snapshot before potential eviction [F]
    void this.saveManager.flushImmediate('platform_pause');
    this.view.showPauseOverlayIfInRun();
  }

  public handlePlatformResume(): void {
    this.isPlatformPaused = false;
    this.accumulator = 0;
    this.audioMixer.onPlatformResume(this.platform.audio.isAudioEnabled());

    if (this.runManager.isInActiveCombat() && !this.isModalPaused) {
      // Core Gameplay Systems Spec Section 2: 1-second visible countdown ring on resume [F]
      this.resumeCountdownMs = 1000;
      this.view.startResumeCountdownRing(1.0);
    }
  }

  public onAnimationFrame(deltaMS: number): void {
    // Note: Pixi ticker stays alive to draw the pause overlay or countdown ring,
    // but simulation ticks are strictly gated.
    if (this.isPlatformPaused) {
      return;
    }

    const clampedDelta = Math.min(deltaMS, 100);

    if (this.resumeCountdownMs > 0) {
      this.resumeCountdownMs = Math.max(0, this.resumeCountdownMs - clampedDelta);
      this.view.updateResumeCountdownRing(this.resumeCountdownMs / 1000);
      this.viewSync.render(0);
      return;
    }

    if (!this.isModalPaused && this.runManager.isInActiveCombat()) {
      this.accumulator += clampedDelta;
      let ticksRun = 0;
      while (this.accumulator >= TICK_MS && ticksRun < MAX_CATCHUP_TICKS) {
        this.sim.tick();
        this.accumulator -= TICK_MS;
        ticksRun++;
      }
      if (ticksRun >= MAX_CATCHUP_TICKS) {
        this.accumulator = 0;
      }
    }

    const alpha = this.isModalPaused ? 0 : this.accumulator / TICK_MS;
    this.viewSync.render(alpha);
  }
}
```

---

## 5. Audio synchronization and mute policy

YouTube Playables provides a platform-level mute button in the YouTube player chrome. Per YouTube certification rules (`[F]`):
- The game must query `ytgame.system.isAudioEnabled()` on boot and subscribe to `ytgame.system.onAudioEnabledChange()`.
- When YouTube disables audio (`false`), **all** game audio (music loops, weapon swings, hit thuds, rank-up stings) must be completely silent immediately.
- In-game volume sliders (`musicVolume`, `sfxVolume` in Settings) act as local multipliers *underneath* the platform mute gate—unmuting inside in-game settings must never override a `false` state from `ytgame.system.isAudioEnabled()`.
- WebAudio `AudioContext` must remain suspended until the first user pointer/touch gesture (`pointerdown`) and must never throw autoplay errors.

### 5.1 Audio Mixer implementation (`src/platform/youtube/AudioController.ts`)

```typescript
export class GameAudioMixer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private platformAudioEnabled = true;
  private isPausedByPlatform = false;
  private isAdPlaying = false;
  private userMusicVolume = 0.7; // From SaveDataV1.settings [T]
  private userSfxVolume = 0.9;   // From SaveDataV1.settings [T]

  public setPlatformAudioEnabled(enabled: boolean): void {
    this.platformAudioEnabled = enabled;
    this.applyEffectiveState();
  }

  public setAdPlaying(adPlaying: boolean): void {
    this.isAdPlaying = adPlaying;
    this.applyEffectiveState();
  }

  public onPlatformPause(): void {
    this.isPausedByPlatform = true;
    this.applyEffectiveState();
  }

  public onPlatformResume(currentPlatformAudioEnabled: boolean): void {
    this.isPausedByPlatform = false;
    this.platformAudioEnabled = currentPlatformAudioEnabled;
    this.applyEffectiveState();
  }

  /** Called on first pointerdown anywhere on canvas to satisfy mobile WebAudio policy [F] */
  public unlockOnUserGesture(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    this.applyEffectiveState();
  }

  private applyEffectiveState(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;

    const shouldOutputAudio =
      this.platformAudioEnabled && !this.isPausedByPlatform && !this.isAdPlaying;

    if (!shouldOutputAudio) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.ctx.state === 'running') {
        void this.ctx.suspend();
      }
    } else {
      this.musicGain.gain.setValueAtTime(this.userMusicVolume, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.userSfxVolume, this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    }
  }
}
```

---

## 6. Player state persistence: meta-progression & mid-run recovery

`ytgame.game.saveData(data: string)` and `ytgame.game.loadData()` persist player state to YouTube's cloud/account storage (when signed in) and device storage.

### 6.1 YouTube Playables storage constraints `[F]`

| Constraint | Platform Limit | Project Target Budget | Enforcement |
| --- | --- | --- | --- |
| Payload format | UTF-8 string | Minified JSON string (`JSON.stringify`) | Validated by schema guard |
| Hard maximum size | `< 3 MiB` | `< 16 KiB` hard cap in code | Reject & prune history if `> 16 KiB` |
| Recommended size | `< 500 KiB` | **`~1.5 KiB – 3.5 KiB`** typical | Store IDs & counters only, never assets or logs |
| Prohibited data | No language setting (`getLanguage()`), no raw PII, no cached textures | Pure game progression & deterministic run seed state | Checked in `SaveSerializer` |

### 6.2 Complete Save Schema (`SaveDataV1` in `src/meta/saveSchema.ts`)

Our save payload covers **both** long-term Meta-Progression (GDD Section 10 & 11) and an **Eviction-Safe Mid-Run Checkpoint (`activeRun`)** so a player who gets a phone call or closes the YouTube app at minute 2:45 can resume their exact run on next launch.

```typescript
export interface MidRunCheckpointV1 {
  /** Base run seed and deterministic PRNG internal states for each stream */
  readonly baseSeed: number;
  readonly rngState: {
    spawn: number;
    cards: number;
    drops: number;
    combat: number;
  };
  readonly isDailySeed: boolean;
  readonly dailyDateKey: string | null; // e.g. '2026-10-23'
  readonly difficultyTier: number;
  readonly elapsedTicks: number;        // 60 Hz ticks elapsed (paused time excluded)

  /** Hero state snapshot */
  readonly personaId: string;
  readonly professionId: 'warden' | 'seeker' | 'herbalist' | 'stormcaller';
  readonly heroX: number;
  readonly heroY: number;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly currentXp: number;
  readonly level: number;

  /** Build & inventory */
  readonly weapons: Array<{ id: string; level: number; evolved: boolean }>;
  readonly cards: Record<string, number>; // cardId -> stack level (1..5)
  readonly heldPowerUps: string[];        // Max 2 (e.g. ['shield', 'freeze'])
  readonly equippedTrinkets: string[];
  readonly activeCurses: string[];

  /** Style rank & score state (Core Gameplay Systems Spec Section 13) */
  readonly rankIndex: number;             // 0 (D) to 6 (SSS)
  readonly stylePoints: number;           // 0..100 within current rank
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly peakRankIndex: number;
  readonly ticksPerRank: number[];        // 7-element array tracking time in D..SSS
  readonly score: number;
  readonly kills: number;
  readonly specialMonstersSpawned: string[];

  /** Wave director state (Core Gameplay Systems Spec Section 9) */
  readonly directorBankedBudget: number;
  readonly miniBossDefeated: boolean;

  /** Monetization & anti-exploit flags for this run [F] */
  readonly reviveUsed: boolean;
  readonly freeRerollUsed: boolean;
  readonly adRerollsUsed: number;
  /** If paused during a level-up modal, lock the offered card IDs to prevent force-close reroll exploits */
  readonly pendingCardOfferIds: string[] | null;
}

export interface SaveDataV1 {
  readonly schemaVersion: 1;
  readonly updatedAtEpochMs: number;

  /** Meta currencies (GDD Section 10) */
  currencies: {
    coins: number;      // Soft currency earned every run
    gems: number;       // Rare seeds from bosses, quests, achievements
    adTokensToday: number;
    adWatchCountToday: number;
    lastAdResetUtcDate: string; // 'YYYY-MM-DD'
  };

  /** Unlocks & Mastery */
  unlocks: {
    personas: string[];         // Default: ['adventurer_default']
    professions: string[];      // Default: ['warden']
    weapons: string[];          // Default: ['garden_blade', 'thorn_spear', 'bloom_hammer', 'seed_blades', 'petal_orbit']
    trinkets: string[];
    curses: string[];
    maxDifficultyTierByBiome: Record<string, number>;
    personaAdPips: Record<string, number>; // personaId -> watched ad pips (e.g. 2/3)
  };

  /** Equipped loadout (GDD Section 10: 2 taps to start) */
  loadout: {
    personaId: string;
    professionId: 'warden' | 'seeker' | 'herbalist' | 'stormcaller';
    startingWeaponId: string;
    trinketIds: string[];       // Up to 3 slots
    curseIds: string[];
  };

  /** High scores & Leaderboard sync state (GDD Section 9 & 11) */
  bestScores: {
    allTime: number;
    unsynced: boolean;          // True if sendScore() failed offline and needs retry on next boot
    dailyBest: {
      dateKey: string;          // 'YYYY-MM-DD'
      score: number;
      scoredAttemptUsed: boolean;
    };
  };

  /** Retention: Daily Quests, Mastery & Streak (GDD Section 11) */
  retention: {
    totalRunsCompleted: number; // Used for 3-run FTUE onboarding & interstitial gating
    streakDays: number;
    lastPlayedUtcDate: string;
    dailyQuestsDate: string;
    dailyQuests: Array<{
      id: string;
      progress: number;
      target: number;
      claimed: boolean;
    }>;
    weaponMasteryXp: Record<string, number>;
    professionMasteryXp: Record<string, number>;
    achievementsUnlocked: string[];
  };

  /** User Settings (NOTE: language is NEVER stored here per YouTube SDK rules [F]) */
  settings: {
    musicVolume: number;        // 0.0 to 1.0
    sfxVolume: number;          // 0.0 to 1.0
    reducedMotion: boolean;
    colorblindPalette: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
    joystickSizeScale: number;  // 0.8 to 1.4
    hapticsEnabled: boolean;
    showDamageNumbers: boolean;
  };

  /** Non-null if the player was mid-run when paused/evicted */
  activeRun: MidRunCheckpointV1 | null;
}
```

### 6.3 Exact save triggers and write-coalescing rules

Calling `ytgame.game.saveData()` on every frame or every kill is prohibited because it crosses the iframe postMessage bridge and can trigger rate-limiting (`QUOTA_EXCEEDED`). Save writes occur **only** at the following discrete lifecycle checkpoints:

| Trigger Event | What is Updated | Save Mode |
| --- | --- | --- |
| `ytgame.system.onPause` callback | Full `SaveDataV1` + current `activeRun` checkpoint | **Immediate flush** (must execute synchronously into `ytgame.game.saveData` within the pause tick) `[F]` |
| Level-up card offered / picked | `activeRun` (levels, cards, `pendingCardOfferIds`, RNG streams) | Debounced (`250 ms`) |
| Mid-run Revive ad completed | `activeRun.reviveUsed = true`, `currencies.adWatchCountToday++` | **Immediate flush** |
| Run ends (Victory, Defeat, Timeout) | Clear `activeRun = null`, credit `coins`/`gems`, update `bestScores`, quests, mastery | **Immediate flush** |
| End-of-run "Double Coins" ad completed | Credit bonus `coins`, increment `adWatchCountToday` | **Immediate flush** |
| Store unlock / Loadout change / Quest claim | `currencies`, `unlocks`, `loadout`, `retention` | Debounced (`300 ms`) |
| Settings slider/toggle closed | `settings` | Debounced (`500 ms`) |

### 6.4 Dual-storage reconciliation & migration (`src/platform/youtube/YouTubeStorageAdapter.ts`)

To protect against network hiccups or guest-to-signed-in transitions, `YouTubeStorageAdapter` writes to `ytgame.game.saveData()` as the primary store and mirrors a backup copy to `window.localStorage` (wrapped in `try/catch` for strict privacy contexts). When loading on boot:

```typescript
export class YouTubeStorageAdapter implements StoragePort {
  private static readonly LOCAL_KEY = 'swipe_roguelite_save_v1';

  public async load(): Promise<SaveDataV1> {
    let cloudRaw = '';
    try {
      cloudRaw = await window.ytgame!.game.loadData();
    } catch (err) {
      window.ytgame?.health.logWarning();
    }

    const localRaw = this.readLocalBackup();
    const cloudSave = parseAndMigrateSave(cloudRaw);
    const localSave = parseAndMigrateSave(localRaw);

    // Reconcile: prefer the save with higher total progress or newer timestamp
    return reconcileSaves(cloudSave, localSave);
  }

  public async save(data: SaveDataV1): Promise<boolean> {
    const serialized = JSON.stringify(data);

    // Safety check: enforce < 16 KiB budget (well under YouTube's 500 KiB recommendation)
    if (serialized.length > 16_384) {
      window.ytgame?.health.logWarning();
    }

    this.writeLocalBackup(serialized);

    try {
      await window.ytgame!.game.saveData(serialized);
      return true;
    } catch (err) {
      window.ytgame?.health.logError();
      return false;
    }
  }

  private readLocalBackup(): string {
    try {
      return window.localStorage.getItem(YouTubeStorageAdapter.LOCAL_KEY) ?? '';
    } catch {
      return '';
    }
  }

  private writeLocalBackup(serialized: string): void {
    try {
      window.localStorage.setItem(YouTubeStorageAdapter.LOCAL_KEY, serialized);
    } catch {
      // Ignore storage quota or sandboxed iframe restrictions
    }
  }
}
```

**Reconciliation rule (`reconcileSaves`):** If both `cloudSave` and `localSave` exist, select the record with the higher `(totalRunsCompleted, bestScores.allTime, updatedAtEpochMs)` tuple, ensuring a player never loses unlocked professions or coins.

---

## 7. Monetization and ad integration: revive, reroll, double rewards & cosmetics

Per GDD Section 12, monetization relies on **player-initiated rewarded ads**, routed through the `AdsPort` interface (`src/platform/ports/AdsPort.ts`).

### 7.1 Reward IDs and Placement Catalog `[F]`

The YouTube Playables SDK requires passing a static, human-readable, non-PII `rewardId` string to `ytgame.ads.requestRewardedAd(rewardId: string): Promise<boolean>`. The exact same `rewardId` must be used every time that placement is requested.

| Placement | `rewardId` passed to `requestRewardedAd` | In-Game Trigger | Limit `[T]` | Reward Granted on `true` | Fallback when Ad Unavailable or Declined |
| --- | --- | --- | --- | --- | --- |
| **Mid-Run Revive** | `'reward_revive_run_v1'` | Hero HP reaches `0` (offered on Rescue Modal *before* Death Summary) | **1 per run** (`!activeRun.reviveUsed`) | Restore **50% Max HP**, **3.0 s invulnerability**, **2.5 u radial knockback** clearing surrounding swarm, preserve Style Rank at `30 SP`, resume with 1.0 s countdown ring | Spend **150 Coins** or **3 Rare Seeds** (1 per run), or tap "End Run" |
| **Level-Up Card Reroll** | `'reward_card_reroll_v1'` | Level-up card modal after the 1st free reroll is spent | **Up to 2 ad rerolls per run** | Draw 3 new non-duplicate cards from `cards` RNG stream with pity rules active | Spend **40 Coins** to reroll, or tap **Skip (+10 HP, +5 Coins)** |
| **Double End-of-Run Coins** | `'reward_double_coins_v1'` | Victory or Defeat Summary screen ("2× Coins" button) | **1 per run** | Multiply run's base coin payout by **2×** (`+coinsEarned`), animate coin counter, save immediately | Button hidden/disabled if ad fails to load; base coins already credited |
| **Persona Skin Unlock Pip** | `'reward_persona_pip_v1'` | Store / Persona Wardrobe screen on ad-unlockable skins | **Max 3 pips per UTC day** | Add `+1 pip` toward target Persona (`3/3` unlocks Persona permanently) | Unlock via milestone achievement or **25 Rare Seeds** |

**Session and daily frequency caps `[T]`:**
- Maximum **6 rewarded ads per UTC day** across all placements (`currencies.adWatchCountToday <= 6`). Once reached, ad buttons automatically switch to their Coin/Seed fallback or hide cleanly.

### 7.2 Detailed Flow 1: Mid-Run Revive for Ad View (`'reward_revive_run_v1'`)

Per GDD Section 12 ("Offer revive before the death screen so it feels like a rescue, not a gate"), when lethal damage occurs:

```text
Hero takes lethal hit (HP <= 0)
  │
  ├── 1. Check "Second Wind" card (Core Gameplay Systems Spec Section 11):
  │      If owned and unused -> trigger Second Wind (30% HP, 1.0 s invuln) automatically without modal.
  │
  ├── 2. Check if activeRun.reviveUsed === false:
  │      If already revived this run -> proceed directly to finalizeRun('defeat').
  │
  └── 3. Open Rescue Revive Modal (Simulation paused, Rank drain paused):
         ├── Primary CTA: [ 🎬 Watch Ad to Revive (50% HP + 3s Shield) ]
         ├── Secondary CTA (if coins >= 150): [ 🪙 150 Coins ]
         └── Dismiss CTA: [ No Thanks -> See Score ] (5s gentle ring, pauses if touched)
```

**Code implementation (`src/app/flows/ReviveFlow.ts`):**

```typescript
export async function executeAdReviveFlow(
  sim: Simulation,
  ads: AdsPort,
  audio: GameAudioMixer,
  saveManager: SaveManager,
  view: GameView
): Promise<'revived' | 'cancelled_or_failed'> {
  if (sim.runState.reviveUsed) {
    return 'cancelled_or_failed';
  }

  // 1. Lock simulation and mute audio before invoking YouTube Ad overlay [F]
  view.setReviveModalLoading(true);
  audio.setAdPlaying(true);

  let rewardEarned = false;
  try {
    rewardEarned = await ads.requestRewardedAd('reward_revive_run_v1');
  } catch (err) {
    // Never crash or penalize player if ad inventory is empty or network fails
    rewardEarned = false;
  } finally {
    audio.setAdPlaying(false);
    view.setReviveModalLoading(false);
  }

  if (!rewardEarned) {
    // Keep Rescue Modal open with fallback option ("Ad unavailable — use Coins or End Run")
    view.showReviveAdFallbackNotice();
    return 'cancelled_or_failed';
  }

  // 2. Apply deterministic Revive state mutation inside simulation [F]
  sim.applyPlayerRevive({
    healRatio: 0.50,              // Restore 50% of Max HP
    invulnerabilitySeconds: 3.0,  // GDD Section 12: 3 seconds of invulnerability
    knockbackRadiusU: 2.5,        // Push swarm back 2.5 world units so hero has breathing room
    knockbackForceU: 4.0,
    clearNegativeStatuses: true,  // Clear slow/burn/poison
    preserveRankSp: 30,           // Restart current Style Rank bar at 30 SP
  });

  // 3. Persist reviveUsed flag immediately so force-close cannot grant a second revive [F]
  saveManager.recordAdWatched('reward_revive_run_v1');
  await saveManager.flushImmediate('revive_granted');

  // 4. Close modal and trigger the 1-second visible re-orientation countdown ring
  view.closeReviveModal();
  view.startResumeCountdownRing(1.0);
  return 'revived';
}
```

### 7.3 Detailed Flow 2: Level-Up Card Reroll (`'reward_card_reroll_v1'`)

Per Core Gameplay Systems Specification Section 10:
1. When the level-up modal opens, the player has **1 Free Reroll** per run (`!runState.freeRerollUsed`).
2. After the free reroll is used, the Reroll button updates to **`[ 🎬 Reroll Cards (Ad) ]`** (up to 2 times per run).
3. Tapping the Ad Reroll button calls `ads.requestRewardedAd('reward_card_reroll_v1')` while the simulation remains paused on the card modal.
4. If `isRewardEarned === true`:
   - Advance the deterministic `cards` RNG stream to generate 3 replacement cards (excluding the 3 cards currently on screen so the player never rolls the exact same hand).
   - Apply the **Pity Rules** (`Core Gameplay Systems Specification.md` Section 10: guarantee at least one Uncommon+ after 3 common offers, and at least one tag-matching card for the hero's weapons).
   - Save `pendingCardOfferIds` in `activeRun` so the new hand is persisted.

### 7.4 Detailed Flow 3: End-of-Run Double Coins (`'reward_double_coins_v1'`)

On the Victory or Defeat Summary screen:
1. Base run coins (`coinsEarned = floor((0.1 * kills + 0.5 * secondsSurvived + bossBonus) * avgRankCurrencyMultiplier)`) are credited to `saveData.currencies.coins` and saved **immediately** when the run ends, before any ad is offered.
2. The summary screen displays **`[ 🎬 Double Coins (+${coinsEarned} 🪙) ]`**.
3. If the player taps it and `requestRewardedAd('reward_double_coins_v1')` resolves to `true`:
   - Disable the button (`doubleRewardClaimed = true`).
   - Credit an additional `+coinsEarned` to `saveData.currencies.coins`.
   - Call `saveManager.flushImmediate('double_coins_granted')`.
   - Play the coin fountain particle burst and count-up animation in the summary UI.

### 7.5 Interstitial Ad Policy (`ytgame.ads.requestInterstitialAd`)

Per GDD Section 12, the core design uses player-initiated rewarded ads so players are never interrupted mid-flow. However, `YouTubePlatformAdapter` also wraps `ytgame.ads.requestInterstitialAd()` behind a strict policy guard in case post-run interstitials are enabled:
- **Never** call `requestInterstitialAd()` during a run, during boot, during the first 3 onboarding runs (`retention.totalRunsCompleted < 3`), or within 2 seconds of a one-tap "Play Again" restart.
- **Never** call `requestInterstitialAd()` at the end of a run if the player already watched a Rewarded Ad (Revive, Card Reroll, or Double Coins) during that run.
- Enforce a minimum **180-second cooldown** between any two ads.

---

## 8. Score and engagement integration (`ytgame.engagement`)

### 8.1 High-score reporting rules (`ytgame.engagement.sendScore`) `[F]`

Per YouTube Playables SDK certification requirements:
1. **Single consistent metric:** The score sent to YouTube must represent one primary dimension of progression and **must match the high score displayed in the game's UI and stored in `saveData()`**.
2. **Integer requirement:** `sendScore({ value })` requires an integer value (`Math.floor(score)`).
3. **Send only on natural run completion:** Call `sendScore` only when a run finishes (Boss Victory, Defeat after declining/exhausting Revive, or 4:30 Timeout)—never mid-run on every kill.
4. **Best-score gate:** Only invoke `sendScore` when `finalRunScore > saveData.bestScores.allTime` (or on startup if `saveData.bestScores.unsynced === true`).

### 8.2 Score calculation and submission pipeline (`src/meta/ScoreReporter.ts`)

From `Core Gameplay Systems Specification.md` Section 13:
$$\text{Score} = \left\lfloor \sum_{k} P_k \times M_{\text{rank}}(t_k) + 50 \times T_{\text{surv}} + B_{\text{boss}} + B_{\text{nohit}} \right\rfloor$$

```typescript
export async function finalizeRunAndReportScore(
  finalRunScore: number,
  saveData: SaveDataV1,
  platform: PlatformFacade,
  saveManager: SaveManager
): Promise<{ isNewPersonalBest: boolean; previousBest: number }> {
  const integerScore = Math.max(0, Math.floor(finalRunScore));
  const previousBest = saveData.bestScores.allTime;
  const isNewPersonalBest = integerScore > previousBest;

  if (isNewPersonalBest) {
    saveData.bestScores.allTime = integerScore;
    saveData.bestScores.unsynced = true;
  }

  // Always save updated currencies, cleared activeRun, and new bestScore first [F]
  await saveManager.flushImmediate('run_complete');

  // Submit to YouTube Playables if it's a new record or previously unsynced
  if (saveData.bestScores.unsynced && saveData.bestScores.allTime > 0) {
    const sentOk = await platform.engagement.sendScore(saveData.bestScores.allTime);
    if (sentOk) {
      saveData.bestScores.unsynced = false;
      await saveManager.flushImmediate('score_synced');
    }
  }

  return { isNewPersonalBest, previousBest };
}
```

### 8.3 Opening YouTube Content (`ytgame.engagement.openYTContent`)

When linking to official trailer/guide videos from the Credits or Community menu inside YouTube Playables, standard `<a href="https://youtube.com/..." target="_blank">` links are blocked or break the iframe container. Always use `ytgame.engagement.openYTContent({ id: videoId })`:

```typescript
export async function openYouTubeVideo(videoId: string): Promise<void> {
  // Validate 11-character YouTube Video ID format (alphanumeric, '-', '_') [F]
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw new Error(`Invalid YouTube video ID: ${videoId}`);
  }
  if (window.ytgame?.IN_PLAYABLES_ENV) {
    await window.ytgame.engagement.openYTContent({ id: videoId });
  } else {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
  }
}
```

---

## 9. Localization and locale synchronization (`ytgame.system.getLanguage`)

Per the official YouTube Playables SDK guidelines (`[F]`):
- Retrieve the active locale on every boot via `await ytgame.system.getLanguage()`.
- **Do not use `navigator.language`** when `IN_PLAYABLES_ENV` is true, and **never persist the language setting in `ytgame.game.saveData()`**, because the user may change their YouTube app language between sessions.

### 9.1 Locale resolution pipeline (`src/content/loader/i18n.ts`)

1. Call `await platform.i18n.getLanguage()`, which returns a BCP-47 tag (for example `'en-US'`, `'es-419'`, `'pt-BR'`, `'ja-JP'`, `'de-DE'`, `'ko-KR'`).
2. Normalize and match against bundled theme string tables (`src/content/themes/garden/strings/`):
   - Exact match first (e.g., `'pt-BR'` $\rightarrow$ `strings.pt-BR.json`).
   - Primary language subtag second (e.g., `'es-419'` $\rightarrow$ `'es'` $\rightarrow$ `strings.es.json`).
   - Default fallback to `'en'` (`strings.en.json`).
3. Keep all card descriptions concise and numeric (`+12% damage`, `Cooldown -0.2 s`, tag icons) as specified in GDD Section 8 so translated strings fit card banners without text overflow.

---

## 10. Error handling, telemetry and health logging (`ytgame.health`)

YouTube Playables monitors technical stability during review and live operations via `ytgame.health.logError()` and `ytgame.health.logWarning()`.

### 10.1 When to invoke `logError` vs. `logWarning`

| Condition | SDK Call | Recovery Action |
| --- | --- | --- |
| Uncaught runtime exception (`window.onerror`) or unhandled Promise rejection (`unhandledrejection`) | `ytgame.health.logError()` | Pause simulation if mid-tick; preserve last valid `SaveDataV1` |
| WebGL context lost (`webglcontextlost`) that fails to restore within 3 seconds | `ytgame.health.logError()` | Flush `activeRun` checkpoint and display tap-to-reload prompt |
| `ytgame.game.saveData()` rejects with `SdkError` | `ytgame.health.logError()` | Keep state in `localStorage` backup; retry on next checkpoint |
| Corrupt save string returned by `loadData()` or schema migration fallback triggered | `ytgame.health.logWarning()` | Fall back to `localStorage` backup or initialize fresh `SaveDataV1` |
| Phase 2 background asset bundle (`theme-garden`) fails to load | `ytgame.health.logWarning()` | Continue running with `PrimitiveVisualProvider` (procedural shapes) so gameplay never breaks `[F]` |
| `requestRewardedAd()` rejects because no ad inventory is available | **Do NOT call `logError()`** | Normal network/inventory condition; show Coin fallback in UI |

### 10.2 Rate-limited Health Logger (`src/platform/youtube/YouTubeHealthAdapter.ts`)

To prevent an error inside a `requestAnimationFrame` callback from spamming thousands of bridge messages per second, `YouTubeHealthAdapter` caps telemetry calls per session:

```typescript
export class YouTubeHealthAdapter implements HealthPort {
  private errorCount = 0;
  private warningCount = 0;
  private readonly maxLogsPerSession = 10;

  public installGlobalHandlers(): void {
    window.addEventListener('error', () => this.logError());
    window.addEventListener('unhandledrejection', () => this.logError());
  }

  public logError(): void {
    if (this.errorCount >= this.maxLogsPerSession) return;
    this.errorCount++;
    if (window.ytgame?.IN_PLAYABLES_ENV) {
      window.ytgame.health.logError();
    }
  }

  public logWarning(): void {
    if (this.warningCount >= this.maxLogsPerSession) return;
    this.warningCount++;
    if (window.ytgame?.IN_PLAYABLES_ENV) {
      window.ytgame.health.logWarning();
    }
  }
}
```

---

## 11. Complete `YouTubePlatformAdapter` Reference (`src/platform/youtube/YouTubePlatformAdapter.ts`)

```typescript
import type { PlatformFacade } from '../ports/PlatformFacade';
import { YouTubeStorageAdapter } from './YouTubeStorageAdapter';
import { YouTubeHealthAdapter } from './YouTubeHealthAdapter';

export class YouTubePlatformAdapter implements PlatformFacade {
  public readonly isPlayablesEnv = true;
  public readonly sdkVersion: string;
  public readonly storage: YouTubeStorageAdapter;
  public readonly health: YouTubeHealthAdapter;

  private pauseUnsubscribe: (() => void) | null = null;
  private resumeUnsubscribe: (() => void) | null = null;
  private audioUnsubscribe: (() => void) | null = null;
  private firstFrameSignaled = false;
  private gameReadySignaled = false;

  constructor(private readonly sdk: typeof ytgame) {
    this.sdkVersion = sdk.SDK_VERSION;
    this.storage = new YouTubeStorageAdapter();
    this.health = new YouTubeHealthAdapter();
    this.health.installGlobalHandlers();
  }

  public readonly lifecycle = {
    notifyFirstFrameReady: (): void => {
      if (this.firstFrameSignaled) return;
      this.firstFrameSignaled = true;
      this.sdk.game.firstFrameReady();
    },
    notifyGameReady: (): void => {
      if (!this.firstFrameSignaled) {
        this.sdk.game.firstFrameReady();
        this.firstFrameSignaled = true;
      }
      if (this.gameReadySignaled) return;
      this.gameReadySignaled = true;
      this.sdk.game.gameReady();
    },
    registerHandlers: (handlers: { onPause: () => void; onResume: () => void }): void => {
      this.pauseUnsubscribe?.();
      this.resumeUnsubscribe?.();
      this.pauseUnsubscribe = this.sdk.system.onPause(handlers.onPause);
      this.resumeUnsubscribe = this.sdk.system.onResume(handlers.onResume);
    },
  };

  public readonly audio = {
    isAudioEnabled: (): boolean => {
      return this.sdk.system.isAudioEnabled();
    },
    onMuteChange: (callback: (enabled: boolean) => void): void => {
      this.audioUnsubscribe?.();
      this.audioUnsubscribe = this.sdk.system.onAudioEnabledChange(callback);
    },
  };

  public readonly ads = {
    requestRewardedAd: async (
      rewardId:
        | 'reward_revive_run_v1'
        | 'reward_card_reroll_v1'
        | 'reward_double_coins_v1'
        | 'reward_persona_pip_v1'
    ): Promise<boolean> => {
      try {
        const earned = await this.sdk.ads.requestRewardedAd(rewardId);
        return Boolean(earned);
      } catch {
        return false;
      }
    },
    requestInterstitialAd: async (): Promise<void> => {
      try {
        await this.sdk.ads.requestInterstitialAd();
      } catch {
        // Interstitial skipped or unavailable; continue flow cleanly
      }
    },
  };

  public readonly engagement = {
    sendScore: async (scoreValue: number): Promise<boolean> => {
      const cleanScore = Math.max(0, Math.floor(scoreValue));
      try {
        await this.sdk.engagement.sendScore({ value: cleanScore });
        return true;
      } catch {
        this.health.logWarning();
        return false;
      }
    },
    openYTContent: async (videoId: string): Promise<boolean> => {
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return false;
      try {
        await this.sdk.engagement.openYTContent({ id: videoId });
        return true;
      } catch {
        return false;
      }
    },
  };

  public readonly i18n = {
    getLanguage: async (): Promise<string> => {
      try {
        const lang = await this.sdk.system.getLanguage();
        return lang || 'en';
      } catch {
        return 'en';
      }
    },
  };
}
```

---

## 12. Technical limits, bundle packaging and certification checklist

### 12.1 YouTube Playables technical requirements vs. project budgets `[F]`

| Metric | YouTube Playables Hard Limit | YouTube Recommended | *Swipe Roguelite* Target Budget | How We Guarantee Compliance |
| --- | --- | --- | --- | --- |
| **Initial Bundle Size** (loaded before `gameReady()`) | `< 30 MiB` | `< 15 MiB` | **`< 1.5 MiB`** (`< 400 KB` code + `< 300 KB` Phase 1 manifest) | Phase 0 procedural primitives (`PrimitiveVisualProvider`) + tree-shaken PixiJS v8 |
| **Total Package Size** (full `.zip` archive) | `< 250 MiB` | `< 50 MiB` | **`< 5.0 MiB`** (including Mystic Garden + Dungeon packs) | WebP sprite atlases ($2048 \times 2048$ max) + compressed WebM/AAC audio sprites |
| **Individual File Size** | `< 30 MiB` | `< 512 KiB` | **`< 500 KiB` per file** | Single packed atlas per theme + short looping music track (`128 kbps`) |
| **Total File Count** | `< 8,000 files` | `< 500 files` | **`< 60 files`** | Packed texture atlases, bitmap font sheets, and merged JSON content tables |
| **Time to Interactive (`gameReady`)** | `< 5.0 seconds` | `< 2.0 seconds` | **`< 0.5 seconds`** | `gameReady()` called immediately after Phase 0 + essential bitmap font load |
| **JavaScript Heap Memory** | `< 512 MB` | `< 150 MB` | **`< 65 MB`** (`0 B/frame` steady-state GC) | Object pooling for enemies, gems, projectiles, and `BitmapText` damage numbers |
| **Cloud Save Size (`saveData`)** | `< 3 MiB` | `< 500 KiB` | **`< 4 KiB`** | Compact `SaveDataV1` JSON with IDs, counters, and seeded RNG integers only |
| **File Paths & Naming** | Relative paths only; `[a-zA-Z0-9_.-]` | Lowercase with hyphens | Enforced by Vite `base: './'` | `vite.config.ts` configured with `base: './'` and asset filename sanitization |

### 12.2 Vite Production Build Configuration for YouTube Playables (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  // CRITICAL: Relative base path so assets load inside YouTube's Playables subdirectory [F]
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Never ship source maps in Playables ZIP submission [F]
    minify: 'terser',
    rollupOptions: {
      output: {
        // Restrict file names strictly to alphanumeric, '_', '-', '.' [F]
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
```

### 12.3 Pre-Submission QA & Playables Test Suite Verification Matrix

Before uploading the production `.zip` bundle to the YouTube Playables Developer Portal, every build must pass these 12 platform certification checks:

1. **SDK Script Order:** `https://www.youtube.com/game_api/v1` is the first `<script>` executed in `index.html`, prior to any game bundle code.
2. **Readiness Sequence:** `ytgame.game.firstFrameReady()` fires once the canvas renders its first visual frame, and `ytgame.game.gameReady()` fires after the Home screen is interactive (within `< 2 s`).
3. **Pause & Eviction Persistence:** Firing `onPause` mid-run at 150 active enemies immediately halts simulation ticks, clears active touch drag vectors, suspends WebAudio, and writes `activeRun` via `ytgame.game.saveData()`. Reloading the page from that saved state offers to resume the exact run at the exact tick and build.
4. **Card Offer Anti-Exploit on Pause:** Force-closing or pausing while 3 level-up cards are on screen restores the exact same `pendingCardOfferIds` upon reload.
5. **Resume Re-Orientation Ring:** Firing `onResume` while in combat displays the 1-second countdown ring and `0.5 s` invulnerability grace period before enemies move or deal contact damage.
6. **System Mute Compliance:** Toggling `onAudioEnabledChange(false)` in the Playables Test Suite silences all music and SFX immediately; changing in-game volume sliders while platform audio is `false` produces zero sound until `onAudioEnabledChange(true)` is fired.
7. **Revive Rewarded Ad (`reward_revive_run_v1`):**
   - Earning the reward restores 50% HP, grants 3.0 s invulnerability, pushes back nearby enemies (`2.5 u`), and sets `reviveUsed = true`.
   - Cancelling or failing the ad returns cleanly to the Rescue Modal without crashing or losing the run's earned coins.
8. **Card Reroll & Double Coins Ads (`reward_card_reroll_v1`, `reward_double_coins_v1`):** Grant rewards only when `requestRewardedAd` resolves to `true`, and immediately persist updated state via `saveData()`.
9. **Score Consistency (`sendScore`):** The integer sent to `ytgame.engagement.sendScore({ value })` at run end matches the Personal Best shown on the Summary and Home screens and persisted in `saveData.bestScores.allTime`.
10. **Dynamic Locale (`getLanguage`):** Changing the locale in the Playables Test Suite updates UI strings on reload without any language field ever being written into `saveData()`.
11. **Aspect Ratio & Resize Stability:** Resizing between Portrait (`9:16`), Square (`1:1`), and Landscape (`16:9`) mid-run adjusts `worldContainer` scale via `ResizeObserver` without restarting the run, losing state, or altering enemy spawn distances (`9–11 u`).
12. **Clean Production Archive:** `dist/` archive contains `index.html` at the root, uses only `./` relative paths, includes zero `.map` or dev files, and stays under `< 5 MiB` total.
