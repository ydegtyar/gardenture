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

export class InputManager {
  private activePointerId: number | null = null;
  private anchorX = 0;
  private anchorY = 0;
  private currentX = 0;
  private currentY = 0;
  private history: PointerSample[] = [];
  private flickTriggeredOnDrag = false;

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

  public setJoystickScale(scale: number): void {
    this.joystickScale = Math.max(0.8, Math.min(1.4, scale));
  }

  public setCallbacks(callbacks: {
    onDash: (angle?: number) => void;
    onKeyShortcut: (code: string) => void;
  }): void {
    this.onDashCallback = callbacks.onDash;
    this.onKeyShortcutCallback = callbacks.onKeyShortcut;
  }

  public attach(element: HTMLElement): () => void {
    const onPointerDown = (e: PointerEvent) => {
      // Ignore right clicks or clicks on interactive HUD buttons
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, a, input, select, [data-interactive="true"]')) {
        return;
      }

      if (this.activePointerId !== null) return; // Ignore second finger for movement [F]
      this.activePointerId = e.pointerId;
      this.anchorX = e.clientX;
      this.anchorY = e.clientY;
      this.currentX = e.clientX;
      this.currentY = e.clientY;
      this.flickTriggeredOnDrag = false;
      const now = performance.now();
      this.history = [{ x: e.clientX, y: e.clientY, timeMs: now }];
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== this.activePointerId) return;
      const now = performance.now();
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
    };

    const onPointerUpOrCancel = (e: PointerEvent) => {
      if (e.pointerId !== this.activePointerId) return;
      const now = performance.now();
      const oldest = this.history[0];
      if (oldest && !this.flickTriggeredOnDrag) {
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
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUpOrCancel);
      window.removeEventListener('pointercancel', onPointerUpOrCancel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }

  public clearAllIntents(): void {
    this.activePointerId = null;
    this.history = [];
    this.keysHeld.clear();
    this.justPressed.clear();
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
