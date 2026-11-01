/**
 * Unified Touch/Pointer Floating Joystick, 90ms Flick Classifier & Keyboard Hub
 * Layer 4 (input): Follows Core Gameplay Systems Specification Sections 3 & 4.
 */

import { smoothstep } from '../core/math/vec2';

export interface JoystickVisualState {
  active: boolean;
  anchorX: number;
  anchorY: number;
  knobX: number;
  knobY: number;
  maxRadiusPx: number;
}

interface PointerSample {
  x: number;
  y: number;
  timeMs: number;
}

interface SecondaryPointerTrack {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTimeMs: number;
  history: PointerSample[];
  dashTriggered: boolean;
  lastDashTimeMs: number;
}

export interface PointerEventLike {
  pointerId: number;
  clientX: number;
  clientY: number;
  button?: number;
  pointerType?: string;
  type?: string;
  target?: EventTarget | null;
  timeStamp?: number;
}

export class InputManager {
  private activePointerId: number | null = null;
  private anchorX = 0;
  private anchorY = 0;
  private currentX = 0;
  private currentY = 0;
  private history: PointerSample[] = [];
  private flickTriggeredOnDrag = false;
  private readonly secondaryPointers = new Map<number, SecondaryPointerTrack>();
  private sawNativeTouchPointer = false;

  private joystickScale = 1.0;
  private readonly baseDeadZonePx = 8;
  private readonly baseMaxRadiusPx = 56;
  private readonly flickWindowMs = 90;
  private readonly flickMinDistPx = 24;
  private readonly flickSpeedThresholdPxPerSec = 900;

  private readonly keysHeld = new Set<string>();
  private readonly justPressed = new Set<string>();

  private onDashCallback: ((angle?: number) => void) | null = null;
  private onKeyShortcutCallback: ((code: string) => void) | null = null;
  private onUsePowerUpCallback: ((slotIndex: number) => void) | null = null;

  public setJoystickScale(scale: number): void {
    this.joystickScale = Math.max(0.8, Math.min(1.4, scale));
  }

  public setCallbacks(callbacks: {
    onDash: (angle?: number) => void;
    onKeyShortcut: (code: string) => void;
    onUsePowerUp?: (slotIndex: number) => void;
  }): void {
    this.onDashCallback = callbacks.onDash;
    this.onKeyShortcutCallback = callbacks.onKeyShortcut;
    this.onUsePowerUpCallback = callbacks.onUsePowerUp ?? null;
  }

  public handlePointerDown(e: PointerEventLike, now = performance.now()): void {
    // Ignore right clicks or non-primary mouse buttons
    if (e.button !== undefined && e.button !== 0 && (e.pointerType ?? 'mouse') === 'mouse') {
      return;
    }

    const target = (e.target as HTMLElement | null) ?? null;
    if (target && typeof target.closest === 'function') {
      if (target.closest('button, a, input, select, [data-interactive="true"]')) {
        return;
      }
    }

    // If a touch/pointer event was captured by the canvas but landed over an interactive HUD power-up slot,
    // trigger the item slot without interrupting primary hero movement.
    if (typeof document !== 'undefined' && typeof document.elementFromPoint === 'function') {
      const hitEl = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (hitEl && typeof hitEl.closest === 'function') {
        const slotBtn = hitEl.closest('[data-powerup-slot]') as HTMLButtonElement | null;
        if (slotBtn) {
          const slotAttr = slotBtn.getAttribute('data-powerup-slot');
          const slotIndex = slotAttr !== null ? Number(slotAttr) : NaN;
          if (!Number.isNaN(slotIndex) && !slotBtn.disabled) {
            this.onUsePowerUpCallback?.(slotIndex);
          }
          return;
        }
        if (hitEl.closest('button, a, input, select, [data-interactive="true"]')) {
          return;
        }
      }
    }

    // Primary finger controls hero floating joystick movement
    if (this.activePointerId === null) {
      this.activePointerId = e.pointerId;
      this.anchorX = e.clientX;
      this.anchorY = e.clientY;
      this.currentX = e.clientX;
      this.currentY = e.clientY;
      this.flickTriggeredOnDrag = false;
      this.history = [{ x: e.clientX, y: e.clientY, timeMs: now }];
      return;
    }

    // Ignore duplicate down for the already-active movement pointer
    if (e.pointerId === this.activePointerId) {
      return;
    }

    // Secondary concurrent finger: track independently for multi-touch swipe-to-dash
    this.secondaryPointers.set(e.pointerId, {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      startTimeMs: now,
      history: [{ x: e.clientX, y: e.clientY, timeMs: now }],
      dashTriggered: false,
      lastDashTimeMs: -Infinity,
    });
  }

  public handlePointerMove(e: PointerEventLike, now = performance.now()): void {
    if (e.pointerId === this.activePointerId) {
      this.currentX = e.clientX;
      this.currentY = e.clientY;

      // Record sample in 90ms sliding window for flick detection (Spec Section 4)
      this.history.push({ x: e.clientX, y: e.clientY, timeMs: now });
      while (this.history.length > 1 && now - this.history[0]!.timeMs > this.flickWindowMs) {
        this.history.shift();
      }

      const oldest = this.history[0];
      if (oldest && !this.flickTriggeredOnDrag) {
        const dtSec = (now - oldest.timeMs) / 1000;
        const fdx = e.clientX - oldest.x;
        const fdy = e.clientY - oldest.y;
        const fDist = Math.hypot(fdx, fdy);
        if (
          dtSec > 0.008 &&
          fDist >= this.flickMinDistPx &&
          fDist / dtSec >= this.flickSpeedThresholdPxPerSec * 1.35
        ) {
          this.flickTriggeredOnDrag = true;
          this.onDashCallback?.(Math.atan2(fdy, fdx));
        }
      }

      // Center re-anchor if finger drags beyond 1.6x maxRadius (Spec Section 3)
      const maxRad = this.baseMaxRadiusPx * this.joystickScale;
      const reanchorLimit = maxRad * 1.6;
      const dx = this.currentX - this.anchorX;
      const dy = this.currentY - this.anchorY;
      const d = Math.hypot(dx, dy);
      if (d > reanchorLimit) {
        const pull = d - maxRad;
        this.anchorX += (dx / d) * pull;
        this.anchorY += (dy / d) * pull;
      }
      return;
    }

    // Secondary touch move: check for swipe-to-dash while primary movement continues uninterrupted
    const secondary = this.secondaryPointers.get(e.pointerId);
    if (!secondary) return;

    secondary.currentX = e.clientX;
    secondary.currentY = e.clientY;
    secondary.history.push({ x: e.clientX, y: e.clientY, timeMs: now });
    while (
      secondary.history.length > 1 &&
      now - secondary.history[0]!.timeMs > this.flickWindowMs
    ) {
      secondary.history.shift();
    }

    if (!secondary.dashTriggered || now - secondary.lastDashTimeMs >= 200) {
      const oldest = secondary.history[0];
      if (oldest) {
        const dtSec = Math.max(0.004, (now - oldest.timeMs) / 1000);
        const fdx = e.clientX - oldest.x;
        const fdy = e.clientY - oldest.y;
        const fDist = Math.hypot(fdx, fdy);

        const sdx = e.clientX - secondary.startX;
        const sdy = e.clientY - secondary.startY;
        const sDist = Math.hypot(sdx, sdy);
        const sDtSec = Math.max(0.004, (now - secondary.startTimeMs) / 1000);

        const isWindowFlick =
          fDist >= this.flickMinDistPx && fDist / dtSec >= this.flickSpeedThresholdPxPerSec * 0.7;
        const isSwipeGesture =
          !secondary.dashTriggered &&
          sDist >= this.flickMinDistPx &&
          (sDtSec <= 0.35 || sDist >= 36) &&
          sDist / sDtSec >= 180;

        if (isWindowFlick || isSwipeGesture) {
          const angle = isWindowFlick ? Math.atan2(fdy, fdx) : Math.atan2(sdy, sdx);
          secondary.dashTriggered = true;
          secondary.lastDashTimeMs = now;
          secondary.startX = e.clientX;
          secondary.startY = e.clientY;
          secondary.startTimeMs = now;
          secondary.history = [{ x: e.clientX, y: e.clientY, timeMs: now }];
          this.onDashCallback?.(angle);
        }
      }
    }
  }

  public handlePointerUpOrCancel(e: PointerEventLike, now = performance.now()): void {
    const isCancel = e.type === 'pointercancel' || e.type === 'touchcancel';

    if (e.pointerId === this.activePointerId) {
      const oldest = this.history[0];
      if (!isCancel && oldest && !this.flickTriggeredOnDrag) {
        const dtSec = Math.max(0.01, (now - oldest.timeMs) / 1000);
        const fdx = e.clientX - oldest.x;
        const fdy = e.clientY - oldest.y;
        const fDist = Math.hypot(fdx, fdy);
        if (
          dtSec <= 0.16 &&
          fDist >= this.flickMinDistPx &&
          fDist / dtSec >= this.flickSpeedThresholdPxPerSec
        ) {
          this.onDashCallback?.(Math.atan2(fdy, fdx));
        }
      }
      this.activePointerId = null;
      this.history = [];
      return;
    }

    const secondary = this.secondaryPointers.get(e.pointerId);
    if (!secondary) return;

    if (!isCancel && !secondary.dashTriggered) {
      const sdx = e.clientX - secondary.startX;
      const sdy = e.clientY - secondary.startY;
      const sDist = Math.hypot(sdx, sdy);
      const sDtSec = Math.max(0.008, (now - secondary.startTimeMs) / 1000);

      if (sDist >= this.flickMinDistPx && sDtSec <= 0.45) {
        this.onDashCallback?.(Math.atan2(sdy, sdx));
      } else {
        const oldest = secondary.history[0];
        if (oldest) {
          const dtSec = Math.max(0.008, (now - oldest.timeMs) / 1000);
          const fdx = e.clientX - oldest.x;
          const fdy = e.clientY - oldest.y;
          const fDist = Math.hypot(fdx, fdy);
          if (fDist >= this.flickMinDistPx && dtSec <= 0.25) {
            this.onDashCallback?.(Math.atan2(fdy, fdx));
          }
        }
      }
    }

    this.secondaryPointers.delete(e.pointerId);
  }

  public attach(element: HTMLElement): () => void {
    // Ensure multi-touch gestures are never hijacked by browser pan/pinch-zoom
    element.style.touchAction = 'none';

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        this.sawNativeTouchPointer = true;
      }
      this.handlePointerDown(e, performance.now());
    };

    const onPointerMove = (e: PointerEvent) => {
      this.handlePointerMove(e, performance.now());
    };

    const onPointerUpOrCancel = (e: PointerEvent) => {
      this.handlePointerUpOrCancel(e, performance.now());
    };

    // Fallback for environments/tests dispatching TouchEvents without PointerEvents
    const TOUCH_ID_OFFSET = 10000;
    const onTouchStart = (e: TouchEvent) => {
      if (this.sawNativeTouchPointer) return;
      const now = performance.now();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]!;
        this.handlePointerDown(
          {
            pointerId: TOUCH_ID_OFFSET + t.identifier,
            clientX: t.clientX,
            clientY: t.clientY,
            pointerType: 'touch',
            type: 'touchstart',
            target: t.target ?? e.target,
          },
          now
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (this.sawNativeTouchPointer) return;
      const now = performance.now();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]!;
        this.handlePointerMove(
          {
            pointerId: TOUCH_ID_OFFSET + t.identifier,
            clientX: t.clientX,
            clientY: t.clientY,
            pointerType: 'touch',
            type: 'touchmove',
            target: t.target ?? e.target,
          },
          now
        );
      }
    };

    const onTouchEndOrCancel = (e: TouchEvent) => {
      if (this.sawNativeTouchPointer) return;
      const now = performance.now();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]!;
        this.handlePointerUpOrCancel(
          {
            pointerId: TOUCH_ID_OFFSET + t.identifier,
            clientX: t.clientX,
            clientY: t.clientY,
            pointerType: 'touch',
            type: e.type,
            target: t.target ?? e.target,
          },
          now
        );
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      this.keysHeld.add(e.code);
      this.justPressed.add(e.code);

      if (e.code === 'Space') {
        e.preventDefault();
        this.onDashCallback?.();
      } else {
        this.onKeyShortcutCallback?.(e.code);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysHeld.delete(e.code);
    };

    const onBlur = () => {
      this.clearAllIntents();
    };

    element.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUpOrCancel);
    window.addEventListener('pointercancel', onPointerUpOrCancel);
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEndOrCancel, { passive: true });
    window.addEventListener('touchcancel', onTouchEndOrCancel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUpOrCancel);
      window.removeEventListener('pointercancel', onPointerUpOrCancel);
      element.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEndOrCancel);
      window.removeEventListener('touchcancel', onTouchEndOrCancel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }

  public clearAllIntents(): void {
    this.activePointerId = null;
    this.history = [];
    this.secondaryPointers.clear();
    this.keysHeld.clear();
    this.justPressed.clear();
  }

  public getActivePointerId(): number | null {
    return this.activePointerId;
  }

  public getSecondaryPointerCount(): number {
    return this.secondaryPointers.size;
  }

  public getMoveVector(): { x: number; y: number } {
    // 1. Check Keyboard WASD / Arrows first
    let kx = 0;
    let ky = 0;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) kx -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) kx += 1;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) ky -= 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) ky += 1;

    if (kx !== 0 || ky !== 0) {
      const mag = Math.hypot(kx, ky);
      return { x: kx / mag, y: ky / mag };
    }

    // 2. Check Floating Joystick with smoothstep speed curve (Spec Section 3)
    if (this.activePointerId !== null) {
      const dx = this.currentX - this.anchorX;
      const dy = this.currentY - this.anchorY;
      const d = Math.hypot(dx, dy);
      const deadZone = this.baseDeadZonePx;
      const maxRad = this.baseMaxRadiusPx * this.joystickScale;
      if (d <= deadZone) {
        return { x: 0, y: 0 };
      }
      const speedFactor = smoothstep(deadZone, maxRad, d);
      return {
        x: (dx / d) * speedFactor,
        y: (dy / d) * speedFactor,
      };
    }

    return { x: 0, y: 0 };
  }

  public getJoystickVisualState(): JoystickVisualState {
    const maxRadiusPx = this.baseMaxRadiusPx * this.joystickScale;
    if (this.activePointerId === null) {
      return {
        active: false,
        anchorX: 0,
        anchorY: 0,
        knobX: 0,
        knobY: 0,
        maxRadiusPx,
      };
    }
    const dx = this.currentX - this.anchorX;
    const dy = this.currentY - this.anchorY;
    const d = Math.hypot(dx, dy);
    const clamped = Math.min(d, maxRadiusPx);
    const knobX = d > 0.001 ? this.anchorX + (dx / d) * clamped : this.anchorX;
    const knobY = d > 0.001 ? this.anchorY + (dy / d) * clamped : this.anchorY;

    return {
      active: true,
      anchorX: this.anchorX,
      anchorY: this.anchorY,
      knobX,
      knobY,
      maxRadiusPx,
    };
  }
}
