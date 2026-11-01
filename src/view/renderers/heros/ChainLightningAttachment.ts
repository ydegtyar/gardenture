import * as PIXI from 'pixi.js';
import { clamp } from '../../../core/math/vec2';
import type { Simulation } from '../../../sim/Simulation';
import type { HeroPose, SocketName } from './rig/HeroRigCore';
import type { Attachment } from './types';

/**
 * ============================================================================
 * CHAIN LIGHTNING SOCKET ATTACHMENT (Hero Cast Origin & Hand Charge-Up)
 * ============================================================================
 * Implements the formal `Attachment` contract for Chain Lightning:
 * - Binds to `castOrigin` and `handNear` sockets on `HeroPose`.
 * - Pure, deterministic midpoint-displacement bolt generator (`computeDeterministicLightningBolt`)
 *   with secondary forks and temporal jitter seeded by frame/time step.
 * - Renders hand-side charge-up electric orb, crackling wrist filaments, and
 *   applies cast recoil + `sleeveGlow` to `heroPose` during discharge.
 */

export interface LightningBoltSample {
  mainPoints: Array<{ x: number; y: number }>;
  branches: Array<Array<{ x: number; y: number }>>;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Pure, deterministic midpoint-displacement lightning path generator.
 * Given identical `(x1, y1, x2, y2, levels, roughness, seed)`, returns the exact
 * same jagged main bolt and secondary fork branches.
 */
export function computeDeterministicLightningBolt(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  levels = 4,
  roughness = 0.22,
  seed = 1
): LightningBoltSample {
  const clampedLevels = clamp(Math.round(levels), 1, 6);
  const segCount = 1 << clampedLevels;
  const pts: Array<{ x: number; y: number }> = new Array(segCount + 1);
  for (let i = 0; i <= segCount; i++) {
    pts[i] = { x: x1, y: y1 };
  }
  pts[0] = { x: x1, y: y1 };
  pts[segCount] = { x: x2, y: y2 };

  const totalLen = Math.hypot(x2 - x1, y2 - y1);
  if (totalLen < 1e-3) {
    return { mainPoints: pts, branches: [] };
  }

  let disp = totalLen * roughness;
  let step = segCount;
  let sCounter = seed * 137.5 + 1.0;

  for (let l = 0; l < clampedLevels; l++) {
    const half = step >> 1;
    for (let i = 0; i < segCount; i += step) {
      const pL = pts[i]!;
      const pR = pts[i + step]!;
      const dx = pR.x - pL.x;
      const dy = pR.y - pL.y;
      const segLen = Math.hypot(dx, dy) || 1;
      const nx = -dy / segLen;
      const ny = dx / segLen;
      const offset = (seededRandom(sCounter++) * 2 - 1) * disp;
      pts[i + half] = {
        x: (pL.x + pR.x) * 0.5 + nx * offset,
        y: (pL.y + pR.y) * 0.5 + ny * offset,
      };
    }
    disp *= 0.5;
    step = half;
  }

  const branches: Array<Array<{ x: number; y: number }>> = [];
  const baseAngle = Math.atan2(y2 - y1, x2 - x1);
  const branchCount = 2 + Math.floor(seededRandom(sCounter++) * 2);

  for (let b = 0; b < branchCount; b++) {
    const idx = Math.max(1, Math.min(segCount - 1, Math.floor(seededRandom(sCounter++) * (segCount - 2)) + 1));
    const start = pts[idx]!;
    const side = b % 2 === 0 ? 1 : -1;
    const branchAngle = baseAngle + side * (0.45 + seededRandom(sCounter++) * 0.45);
    const branchLen = totalLen * (0.22 + seededRandom(sCounter++) * 0.18);
    const tipX = start.x + Math.cos(branchAngle) * branchLen;
    const tipY = start.y + Math.sin(branchAngle) * branchLen;
    const sub = computeDeterministicLightningBolt(
      start.x,
      start.y,
      tipX,
      tipY,
      2,
      roughness * 1.15,
      sCounter++
    );
    branches.push(sub.mainPoints);
  }

  return { mainPoints: pts, branches };
}

export class ChainLightningAttachment implements Attachment {
  public readonly id = 'chain_lightning';
  public readonly suppressesDefaultWeapon = false;

  private isEquipped = false;
  private isDischarging = false;
  private dischargeIntensity = 0;
  private elapsedSeconds = 0;
  private isEvolved = false;

  public getSocketRequirements(): readonly SocketName[] {
    return ['castOrigin', 'handNear'] as const;
  }

  /**
   * Synchronizes attachment state from the current simulation frame.
   */
  public syncFromSimulation(sim: Simulation): void {
    const wpn = sim.weapons.find((w) => w.id === 'chain_lightning');
    this.isEquipped = Boolean(wpn);
    this.isEvolved = Boolean(wpn?.evolved);
    this.elapsedSeconds = sim.elapsedSeconds;

    // Detect active initial chain_bolt effect originating from hero
    let maxBoltRatio = 0;
    for (const fx of sim.visualEffects) {
      if (fx.kind === 'chain_bolt' && fx.timer > 0 && fx.maxTimer > 0) {
        const r = clamp(fx.timer / fx.maxTimer, 0, 1);
        if (r > maxBoltRatio) maxBoltRatio = r;
      }
    }
    this.isDischarging = maxBoltRatio > 0.05;
    this.dischargeIntensity = maxBoltRatio;
  }

  public update(_dt: number, heroPose: HeroPose): void {
    if (!this.isEquipped && !this.isDischarging) return;

    if (this.isDischarging) {
      // Apply cast recoil & sleeve glow to heroPose when discharging lightning
      const recoil = this.dischargeIntensity * 2.4;
      heroPose.rig.handNear.x -= heroPose.dirX * recoil;
      heroPose.rig.handNear.y -= heroPose.dirY * recoil * 0.65;
      heroPose.sockets.handNear.x = heroPose.rig.handNear.x;
      heroPose.sockets.handNear.y = heroPose.rig.handNear.y;
      heroPose.sleeveGlow = Math.max(heroPose.sleeveGlow, this.dischargeIntensity);
    } else if (this.isEquipped) {
      heroPose.sleeveGlow = Math.max(
        heroPose.sleeveGlow,
        0.22 + 0.12 * Math.sin(this.elapsedSeconds * 6.5)
      );
    }
  }

  public draw(
    _gUnder: PIXI.Graphics,
    gOver: PIXI.Graphics,
    heroPose: HeroPose
  ): void {
    if (!this.isEquipped && !this.isDischarging) return;

    const origin = heroPose.sockets.castOrigin;
    const hand = heroPose.sockets.handNear;
    const outerColor = this.isEvolved ? 0xa855f7 : 0x0284c7;
    const midColor = this.isEvolved ? 0xd8b4fe : 0x38bdf8;
    const coreColor = 0xffffff;

    // 1. Ambient / Discharge Hand Charge-Up Orb at castOrigin
    const pulse = 0.75 + 0.25 * Math.sin(this.elapsedSeconds * 14);
    const baseRadius = this.isDischarging
      ? 4.2 + this.dischargeIntensity * 4.5
      : 2.4 * pulse;
    const alphaMult = this.isDischarging ? 0.92 : 0.55;

    gOver
      .circle(origin.x, origin.y, baseRadius * 1.65)
      .fill({ color: outerColor, alpha: 0.24 * alphaMult });
    gOver
      .circle(origin.x, origin.y, baseRadius)
      .fill({ color: midColor, alpha: 0.58 * alphaMult });
    gOver
      .circle(origin.x, origin.y, baseRadius * 0.48)
      .fill({ color: coreColor, alpha: 0.92 * alphaMult });

    // 2. Crackling Micro-Filaments arcing between handNear and castOrigin
    if (heroPose.lodLevel === 0 || this.isDischarging) {
      const flickerStep = Math.floor(this.elapsedSeconds * 22);
      const arcCount = this.isDischarging ? 2 : 1;
      for (let a = 0; a < arcCount; a++) {
        const angle = this.elapsedSeconds * 9 + a * Math.PI + flickerStep * 0.7;
        const reach = this.isDischarging ? 11.5 : 6.2;
        const targetX = origin.x + Math.cos(angle) * reach;
        const targetY = origin.y + Math.sin(angle) * reach;
        const sample = computeDeterministicLightningBolt(
          hand.x,
          hand.y,
          targetX,
          targetY,
          3,
          0.26,
          flickerStep + a * 19
        );

        const pts = sample.mainPoints;
        if (pts.length >= 2) {
          gOver.moveTo(pts[0]!.x, pts[0]!.y);
          for (let i = 1; i < pts.length; i++) {
            gOver.lineTo(pts[i]!.x, pts[i]!.y);
          }
          gOver.stroke({
            color: midColor,
            width: this.isDischarging ? 3.2 : 2.0,
            alpha: 0.55 * alphaMult,
            cap: 'round',
            join: 'round',
          });

          gOver.moveTo(pts[0]!.x, pts[0]!.y);
          for (let i = 1; i < pts.length; i++) {
            gOver.lineTo(pts[i]!.x, pts[i]!.y);
          }
          gOver.stroke({
            color: coreColor,
            width: this.isDischarging ? 1.4 : 0.95,
            alpha: 0.92 * alphaMult,
            cap: 'round',
            join: 'round',
          });
        }
      }
    }
  }
}
