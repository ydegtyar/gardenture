/**
 * Smooth, Threat-Aware Dynamic 2D Camera System
 *
 * Features:
 * - Combat zoom-in when enemies are close; calm exploration zoom-out when safe or retreating
 * - Dual-threshold hysteresis (COMBAT_ENTER_DIST = 300px, COMBAT_EXIT_DIST = 450px) to prevent boundary flicker
 * - Post-combat hold delay (ZOOM_OUT_DELAY) so fast multi-kill fights don't jitter zoom
 * - Frame-rate-independent exponential damping: value += (target - value) * (1 - Math.exp(-speed * dt))
 * - Asymmetric zoom speeds (faster zoom-in for responsive combat, slower zoom-out for calm exploration)
 * - ~10% screen-space dead-zone around the hero + smooth velocity look-ahead
 * - World/map bounds clamping at every zoom level + non-interfering screen-shake & hit zoom punch
 * - Zero per-frame heap allocations
 */

import { clamp, lerp } from '../core/math/vec2';

// ============================================================================
// TWEAKABLE CAMERA CONFIGURATION CONSTANTS
// ============================================================================

/** Target render scale in active close-quarters combat (zoomed IN for precision). */
export const ZOOM_MIN_COMBAT = 1.24;

/** Target render scale during safe exploration (zoomed OUT for broader awareness). */
export const ZOOM_MAX = 0.86;

/** Absolute minimum render scale clamp bound. */
export const ZOOM_MIN = 0.84;

/** Distance in world pixels at which approaching enemies trigger combat zoom-in. */
export const COMBAT_ENTER_DIST = 300;

/** Distance in world pixels beyond which enemies exit combat range (hysteresis outer bound). */
export const COMBAT_EXIT_DIST = 450;

/** Exponential damping rate when zooming IN toward combat scale. */
export const ZOOM_IN_SPEED = 4.0;

/** Exponential damping rate when zooming OUT toward exploration scale. */
export const ZOOM_OUT_SPEED = 1.5;

/** Exponential damping rate for camera position tracking. */
export const FOLLOW_SPEED = 8.5;

/** Maximum look-ahead offset in world pixels along the hero's movement vector. */
export const LOOK_AHEAD = 76;

/** Seconds to wait after the last enemy exits range before zooming out. */
export const ZOOM_OUT_DELAY = 0.75;

/** Screen-space dead-zone ratio (~10% of viewport width/height). */
export const DEAD_ZONE_RATIO = 0.1;

/** Default playable map half-size in world pixels (clamps camera to world bounds). */
export const DEFAULT_WORLD_HALF_SIZE_PX = 2400;

export interface CameraEnemySample {
  x: number;
  y: number;
  hp: number;
  koTimer?: number;
  isArenaFlower?: boolean;
  isHeroGrave?: boolean;
}

export interface WorldBoundsPx {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CameraUpdateInput {
  /** Hero X position in simulation units (or pixels if ppu === 1). */
  heroX: number;
  /** Hero Y position in simulation units (or pixels if ppu === 1). */
  heroY: number;
  /** Hero X velocity in simulation units/sec (or pixels/sec if ppu === 1). */
  heroVx: number;
  /** Hero Y velocity in simulation units/sec (or pixels/sec if ppu === 1). */
  heroVy: number;
  /** Pixels per simulation unit (default 48). */
  ppu?: number;
  /** Active enemies array (read-only traversal, zero allocations). */
  enemies: readonly CameraEnemySample[];
  /** Viewport width in CSS/screen pixels. */
  screenW: number;
  /** Viewport height in CSS/screen pixels. */
  screenH: number;
  /** Frame delta time in seconds. */
  dt: number;
  /** Optional explicit world bounds in pixels (defaults to [-DEFAULT_WORLD_HALF_SIZE_PX, +DEFAULT_WORLD_HALF_SIZE_PX]). */
  worldBounds?: WorldBoundsPx;
}

/**
 * Smooth Hermite ease-in-out on [0, 1].
 */
export function easeInOutNormalized(t: number): number {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

/**
 * Frame-rate-independent exponential damping step:
 * value += (target - value) * (1 - Math.exp(-speed * dt))
 */
export function dampValue(
  current: number,
  target: number,
  speed: number,
  dt: number
): number {
  if (dt <= 0) return current;
  const factor = 1 - Math.exp(-speed * dt);
  return current + (target - current) * factor;
}

export class DynamicCamera {
  /** Current damped camera center X in world pixels. */
  public x = 0;
  /** Current damped camera center Y in world pixels. */
  public y = 0;

  /** Current effective zoom scale applied to worldContainer. */
  public zoom = ZOOM_MAX;
  /** Current underlying damped zoom (without transient hit punch). */
  public baseZoom = ZOOM_MAX;
  /** Current target zoom before damping. */
  public targetZoom = ZOOM_MAX;

  /** Smoothed threat level in [0, 1]. */
  public threat = 0;
  /** Raw instant threat level in [0, 1] before smoothing. */
  public rawThreat = 0;
  /** Whether the camera is currently inside the combat hysteresis state. */
  public inCombat = false;
  /** Remaining seconds before exiting combat state after enemies leave range. */
  public zoomOutDelayTimer = 0;

  /** Final stage transform X (`screenW / 2 - x * zoom + shakeOffsetX`). */
  public stageX = 0;
  /** Final stage transform Y (`screenH / 2 - y * zoom + shakeOffsetY`). */
  public stageY = 0;

  /** Screen-shake X offset in screen pixels (does not pollute camera position). */
  public shakeOffsetX = 0;
  /** Screen-shake Y offset in screen pixels (does not pollute camera position). */
  public shakeOffsetY = 0;

  // Internal scalar state (zero object allocations per frame)
  private isInitialized = false;
  private deadZoneAnchorX = 0;
  private deadZoneAnchorY = 0;
  private lookAheadX = 0;
  private lookAheadY = 0;
  private heldCombatThreat = 0;

  // Optional zoom punch state (smoothly rises and decays without snapping)
  private zoomPunch = 0;
  private zoomPunchTarget = 0;

  // Screen shake state
  private shakeTimer = 0;
  private shakeDuration = 0.14;
  private shakeAmplitudePx = 0;
  private shakePhase = 0;

  // Default world bounds (mutated in-place when custom bounds aren't passed)
  private defaultBoundsMinX = -DEFAULT_WORLD_HALF_SIZE_PX;
  private defaultBoundsMaxX = DEFAULT_WORLD_HALF_SIZE_PX;
  private defaultBoundsMinY = -DEFAULT_WORLD_HALF_SIZE_PX;
  private defaultBoundsMaxY = DEFAULT_WORLD_HALF_SIZE_PX;

  /**
   * Resets camera immediately to the hero's starting coordinates (used at run start).
   */
  public reset(heroPxX = 0, heroPxY = 0, initialZoom = ZOOM_MAX): void {
    this.x = heroPxX;
    this.y = heroPxY;
    this.deadZoneAnchorX = heroPxX;
    this.deadZoneAnchorY = heroPxY;
    this.lookAheadX = 0;
    this.lookAheadY = 0;
    this.baseZoom = initialZoom;
    this.zoom = initialZoom;
    this.targetZoom = initialZoom;
    this.threat = 0;
    this.rawThreat = 0;
    this.heldCombatThreat = 0;
    this.inCombat = false;
    this.zoomOutDelayTimer = 0;
    this.zoomPunch = 0;
    this.zoomPunchTarget = 0;
    this.shakeTimer = 0;
    this.shakeAmplitudePx = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.isInitialized = true;
  }

  /**
   * Configures the default world bounds in world pixels.
   */
  public setWorldBoundsPx(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ): void {
    this.defaultBoundsMinX = minX;
    this.defaultBoundsMaxX = maxX;
    this.defaultBoundsMinY = minY;
    this.defaultBoundsMaxY = maxY;
  }

  /**
   * Adds a brief, smooth zoom "punch" on heavy/critical hits without snapping.
   */
  public addZoomPunch(intensity = 0.035): void {
    this.zoomPunchTarget = clamp(this.zoomPunchTarget + intensity, 0, 0.075);
  }

  /**
   * Triggers a non-interfering screen shake in screen space.
   */
  public triggerShake(amplitudePx: number, durationSec = 0.14): void {
    if (amplitudePx >= this.shakeAmplitudePx || this.shakeTimer <= 0) {
      this.shakeAmplitudePx = amplitudePx;
      this.shakeDuration = Math.max(0.01, durationSec);
      this.shakeTimer = this.shakeDuration;
    }
  }

  /**
   * Updates camera zoom, threat hysteresis, dead-zone follow, look-ahead, and world clamping.
   * Performs zero heap allocations per frame.
   */
  public update(input: CameraUpdateInput): void {
    const ppu = input.ppu ?? 48;
    const heroPxX = input.heroX * ppu;
    const heroPxY = input.heroY * ppu;
    const heroVxPx = input.heroVx * ppu;
    const heroVyPx = input.heroVy * ppu;
    const screenW = Math.max(1, input.screenW);
    const screenH = Math.max(1, input.screenH);
    const dt = clamp(input.dt, 0, 0.25);

    if (!this.isInitialized) {
      this.reset(heroPxX, heroPxY, ZOOM_MAX);
    }

    // ------------------------------------------------------------------------
    // 1. Scan Enemies for Threat Proximity & Hysteresis
    // ------------------------------------------------------------------------
    let nearestDistPx = Number.POSITIVE_INFINITY;
    let nearestDx = 0;
    let nearestDy = 0;
    let nearbyCount = 0;

    const enemies = input.enemies;
    const enemyLen = enemies.length;
    for (let i = 0; i < enemyLen; i++) {
      const e = enemies[i]!;
      if (
        e.hp <= 0 ||
        (e.koTimer !== undefined && e.koTimer > 0) ||
        e.isArenaFlower ||
        e.isHeroGrave
      ) {
        continue;
      }

      const dx = e.x * ppu - heroPxX;
      const dy = e.y * ppu - heroPxY;
      const distPx = Math.hypot(dx, dy);

      if (distPx <= COMBAT_EXIT_DIST) {
        nearbyCount++;
      }
      if (distPx < nearestDistPx) {
        nearestDistPx = distPx;
        nearestDx = dx;
        nearestDy = dy;
      }
    }

    // Determine whether hero is actively retreating away from the nearest threat
    const heroSpeedPx = Math.hypot(heroVxPx, heroVyPx);
    let retreatingFactor = 0;
    if (
      heroSpeedPx > 40 &&
      nearestDistPx > 1e-3 &&
      nearestDistPx < Number.POSITIVE_INFINITY
    ) {
      const toEnemyDirX = nearestDx / nearestDistPx;
      const toEnemyDirY = nearestDy / nearestDistPx;
      const moveDirX = heroVxPx / heroSpeedPx;
      const moveDirY = heroVyPx / heroSpeedPx;
      const alignment = moveDirX * toEnemyDirX + moveDirY * toEnemyDirY;
      if (alignment < -0.25) {
        // Moving away from nearest enemy
        retreatingFactor = clamp((-alignment - 0.25) / 0.75, 0, 1);
      }
    }

    // Hysteresis state transitions:
    // - Enter combat at COMBAT_ENTER_DIST (300px)
    // - Remain in combat up to COMBAT_EXIT_DIST (450px)
    // - Hold for ZOOM_OUT_DELAY after all enemies leave COMBAT_EXIT_DIST
    if (nearestDistPx <= COMBAT_ENTER_DIST) {
      this.inCombat = true;
      this.zoomOutDelayTimer = ZOOM_OUT_DELAY;
    } else if (this.inCombat && nearestDistPx <= COMBAT_EXIT_DIST) {
      this.zoomOutDelayTimer = ZOOM_OUT_DELAY;
    } else if (this.inCombat) {
      this.zoomOutDelayTimer = Math.max(0, this.zoomOutDelayTimer - dt);
      if (this.zoomOutDelayTimer <= 0) {
        this.inCombat = false;
      }
    }

    // Compute rawThreat in [0, 1]
    if (!this.inCombat) {
      this.rawThreat = 0;
      this.heldCombatThreat = 0;
    } else if (nearestDistPx <= COMBAT_EXIT_DIST) {
      // Normalized proximity: 1.0 when enemy is right on hero, 0.0 at COMBAT_EXIT_DIST
      const distNorm = clamp(1 - nearestDistPx / COMBAT_EXIT_DIST, 0, 1);
      const smoothProx = easeInOutNormalized(distNorm);

      // Crowd density bonus (up to +0.25 for 4+ enemies within COMBAT_EXIT_DIST)
      const crowdBonus = clamp((nearbyCount - 1) * 0.07, 0, 0.25);

      // Slight reduction when actively running away in the outer hysteresis band
      const retreatDamp =
        nearestDistPx > COMBAT_ENTER_DIST * 0.75
          ? 1 - retreatingFactor * 0.28
          : 1;

      // Maintain a stable floor (0.32) while inside combat hysteresis so hovering at 300-440px never flickers
      const computed = clamp(
        (0.32 + smoothProx * 0.68 + crowdBonus) * retreatDamp,
        0.32,
        1
      );
      this.rawThreat = computed;
      this.heldCombatThreat = computed;
    } else {
      // Inside ZOOM_OUT_DELAY window after last enemy died or left 450px
      this.rawThreat = this.heldCombatThreat;
    }

    // Smooth threat value with asymmetric damping
    const threatSpeed =
      this.rawThreat >= this.threat
        ? ZOOM_IN_SPEED * 1.4
        : ZOOM_OUT_SPEED * 1.4;
    this.threat = clamp(
      dampValue(this.threat, this.rawThreat, threatSpeed, dt),
      0,
      1
    );

    // ------------------------------------------------------------------------
    // 2. Map Threat to Target Zoom & Apply Asymmetric Exponential Damping
    // ------------------------------------------------------------------------
    const easedThreat = easeInOutNormalized(this.threat);
    const rawTargetZoom = lerp(ZOOM_MAX, ZOOM_MIN_COMBAT, easedThreat);

    // Responsive mobile viewport scale factor adjustment
    const viewportFactor = screenW < 500 ? 0.92 : 1.0;
    this.targetZoom = rawTargetZoom * viewportFactor;

    // Zoom-in is faster than zoom-out (e.g., 4.0 vs 1.5)
    const isZoomingIn = Math.abs(this.targetZoom - ZOOM_MIN_COMBAT * viewportFactor) <
      Math.abs(this.baseZoom - ZOOM_MIN_COMBAT * viewportFactor) ||
      this.targetZoom > this.baseZoom;
    const zoomSpeed = isZoomingIn ? ZOOM_IN_SPEED : ZOOM_OUT_SPEED;
    this.baseZoom = dampValue(this.baseZoom, this.targetZoom, zoomSpeed, dt);

    // Smooth hit zoom punch (rises smoothly toward zoomPunchTarget, then decays)
    if (this.zoomPunchTarget > 0 || this.zoomPunch > 1e-4) {
      this.zoomPunch = dampValue(this.zoomPunch, this.zoomPunchTarget, 22, dt);
      this.zoomPunchTarget *= Math.exp(-12 * dt);
      if (this.zoomPunchTarget < 1e-4) this.zoomPunchTarget = 0;
      if (this.zoomPunch < 1e-4 && this.zoomPunchTarget === 0) {
        this.zoomPunch = 0;
      }
    }

    const minZoomBound =
      Math.min(ZOOM_MIN, ZOOM_MAX, ZOOM_MIN_COMBAT) * viewportFactor;
    const maxZoomBound =
      Math.max(ZOOM_MIN, ZOOM_MAX, ZOOM_MIN_COMBAT) * viewportFactor + 0.08;
    this.zoom = clamp(
      this.baseZoom + this.zoomPunch,
      minZoomBound,
      maxZoomBound
    );

    // ------------------------------------------------------------------------
    // 3. Dead-Zone (~10% of Screen) + Velocity Look-Ahead
    // ------------------------------------------------------------------------
    const maxSpeedRefPx = 280; // ~5.83 u/s * 48 ppu
    const speedNorm = clamp(heroSpeedPx / maxSpeedRefPx, 0, 1);
    const easedSpeed = easeInOutNormalized(speedNorm);
    const targetLookX =
      heroSpeedPx > 4 ? (heroVxPx / heroSpeedPx) * LOOK_AHEAD * easedSpeed : 0;
    const targetLookY =
      heroSpeedPx > 4 ? (heroVyPx / heroSpeedPx) * LOOK_AHEAD * easedSpeed : 0;

    // Smooth look-ahead vector so sudden direction changes never snap
    const lookSpeed = FOLLOW_SPEED * 0.85;
    this.lookAheadX = dampValue(this.lookAheadX, targetLookX, lookSpeed, dt);
    this.lookAheadY = dampValue(this.lookAheadY, targetLookY, lookSpeed, dt);

    // Dead-zone half-extents in world pixels at the current zoom
    const deadZoneHalfW = (screenW * DEAD_ZONE_RATIO * 0.5) / this.zoom;
    const deadZoneHalfH = (screenH * DEAD_ZONE_RATIO * 0.5) / this.zoom;

    const offsetFromAnchorX = heroPxX - this.deadZoneAnchorX;
    if (Math.abs(offsetFromAnchorX) > deadZoneHalfW) {
      const excessX =
        offsetFromAnchorX - Math.sign(offsetFromAnchorX) * deadZoneHalfW;
      this.deadZoneAnchorX += excessX;
    } else {
      // Gentle recentering drift inside dead-zone when moving slowly so camera settles cleanly
      this.deadZoneAnchorX = dampValue(
        this.deadZoneAnchorX,
        heroPxX,
        FOLLOW_SPEED * 0.12,
        dt
      );
    }

    const offsetFromAnchorY = heroPxY - this.deadZoneAnchorY;
    if (Math.abs(offsetFromAnchorY) > deadZoneHalfH) {
      const excessY =
        offsetFromAnchorY - Math.sign(offsetFromAnchorY) * deadZoneHalfH;
      this.deadZoneAnchorY += excessY;
    } else {
      this.deadZoneAnchorY = dampValue(
        this.deadZoneAnchorY,
        heroPxY,
        FOLLOW_SPEED * 0.12,
        dt
      );
    }

    // ------------------------------------------------------------------------
    // 4. World Bounds Clamping at Every Zoom Level & Position Damping
    // ------------------------------------------------------------------------
    const boundsMinX = input.worldBounds
      ? input.worldBounds.minX
      : this.defaultBoundsMinX;
    const boundsMaxX = input.worldBounds
      ? input.worldBounds.maxX
      : this.defaultBoundsMaxX;
    const boundsMinY = input.worldBounds
      ? input.worldBounds.minY
      : this.defaultBoundsMinY;
    const boundsMaxY = input.worldBounds
      ? input.worldBounds.maxY
      : this.defaultBoundsMaxY;

    const halfViewW = (screenW * 0.5) / this.zoom;
    const halfViewH = (screenH * 0.5) / this.zoom;

    const minCamX = boundsMinX + halfViewW;
    const maxCamX = boundsMaxX - halfViewW;
    const minCamY = boundsMinY + halfViewH;
    const maxCamY = boundsMaxY - halfViewH;

    let desiredCamX = this.deadZoneAnchorX + this.lookAheadX;
    let desiredCamY = this.deadZoneAnchorY + this.lookAheadY;

    // Clamp desired target to world bounds
    if (minCamX <= maxCamX) {
      desiredCamX = clamp(desiredCamX, minCamX, maxCamX);
    } else {
      desiredCamX = (boundsMinX + boundsMaxX) * 0.5;
    }
    if (minCamY <= maxCamY) {
      desiredCamY = clamp(desiredCamY, minCamY, maxCamY);
    } else {
      desiredCamY = (boundsMinY + boundsMaxY) * 0.5;
    }

    // Frame-rate-independent damping for camera position
    this.x = dampValue(this.x, desiredCamX, FOLLOW_SPEED, dt);
    this.y = dampValue(this.y, desiredCamY, FOLLOW_SPEED, dt);

    // Ensure hero stays strictly inside the visible viewport margin before world clamp
    const safeHeroMarginW = Math.min(halfViewW * 0.65, 96 / this.zoom);
    const safeHeroMarginH = Math.min(halfViewH * 0.65, 96 / this.zoom);
    this.x = clamp(
      this.x,
      heroPxX - (halfViewW - safeHeroMarginW),
      heroPxX + (halfViewW - safeHeroMarginW)
    );
    this.y = clamp(
      this.y,
      heroPxY - (halfViewH - safeHeroMarginH),
      heroPxY + (halfViewH - safeHeroMarginH)
    );

    // Final hard clamp to world bounds at the current zoom level so the camera never shows outside the map
    if (minCamX <= maxCamX) {
      this.x = clamp(this.x, minCamX, maxCamX);
    } else {
      this.x = (boundsMinX + boundsMaxX) * 0.5;
    }
    if (minCamY <= maxCamY) {
      this.y = clamp(this.y, minCamY, maxCamY);
    } else {
      this.y = (boundsMinY + boundsMaxY) * 0.5;
    }

    // ------------------------------------------------------------------------
    // 5. Non-Interfering Screen Shake (Post-Transform Offset)
    // ------------------------------------------------------------------------
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      this.shakePhase += dt * 65;
      const normalizedLife = this.shakeTimer / this.shakeDuration;
      const decay = normalizedLife * normalizedLife;
      this.shakeOffsetX =
        Math.sin(this.shakePhase * 1.7) * this.shakeAmplitudePx * decay;
      this.shakeOffsetY =
        Math.cos(this.shakePhase * 2.3) * this.shakeAmplitudePx * decay;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeAmplitudePx = 0;
    }

    this.stageX = screenW * 0.5 - this.x * this.zoom + this.shakeOffsetX;
    this.stageY = screenH * 0.5 - this.y * this.zoom + this.shakeOffsetY;
  }
}
