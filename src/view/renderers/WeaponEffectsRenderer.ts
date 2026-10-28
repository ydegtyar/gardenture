import * as PIXI from 'pixi.js';
import { PALETTE, POWER_UPS } from '../../content/data/catalog';
import { clamp, lerp } from '../../core/math/vec2';
import type { SimVisualEffect, Simulation } from '../../sim/Simulation';
import { PPU } from './EnvironmentRenderer';

/**
 * Renders Ground Hazards, Pickups, Orbiting Petals, Weapon Visual Effects
 * (including doubled Echo Swing, Bloom Hammer without fall border circle,
 * Second Wind blast, Hero Heal pulse with rising green particles, and Lucky Clover steps
 * without yellow rounds), and Projectiles (including Sunflower Seeds & Leaves).
 */
export class WeaponEffectsRenderer {
  public static drawGroundHazards(
    decalGraphic: PIXI.Graphics,
    sim: Simulation
  ): void {
    for (const h of sim.hazards) {
      const hx = h.x * PPU;
      const hy = h.y * PPU;
      const rPx = h.radius * PPU;
      const fade = clamp(h.lifeTimer / 1.0, 0.2, 0.92);
      if (h.kind === 'thorn_trail') {
        WeaponEffectsRenderer.drawThornTrailHazard(
          decalGraphic,
          hx,
          hy,
          rPx,
          fade,
          h.id,
          sim.elapsedSeconds
        );
      } else if (h.kind === 'spore_cloud') {
        const cloudProgress = clamp(1 - h.lifeTimer / 2.2, 0, 1);
        WeaponEffectsRenderer.drawSporePopGasCloud(
          decalGraphic,
          hx,
          hy,
          rPx,
          cloudProgress,
          fade,
          h.id,
          sim.elapsedSeconds
        );
      } else {
        decalGraphic
          .circle(hx, hy, rPx)
          .fill({ color: h.color, alpha: 0.22 * fade })
          .stroke({ color: h.color, width: 2, alpha: 0.65 * fade });
      }
    }
  }

  public static drawPickups(
    pickupGraphic: PIXI.Graphics,
    sim: Simulation
  ): void {
    const g = pickupGraphic;
    const bob = Math.sin(sim.elapsedSeconds * 5) * 2.5;

    for (const p of sim.pickups) {
      const px = p.x * PPU;
      const py = p.y * PPU + bob;

      if (p.kind === 'xp_gem') {
        g.moveTo(px, py - 7)
          .lineTo(px + 6, py)
          .lineTo(px, py + 7)
          .lineTo(px - 6, py)
          .closePath()
          .fill({ color: PALETTE.MINT_GREEN })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
      } else if (p.kind === 'xp_cluster') {
        g.circle(px, py, 9)
          .fill({ color: PALETTE.BUTTER_YELLOW })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
        g.circle(px - 2, py - 2, 3.5).fill({ color: PALETTE.CREAM_WHITE });
      } else if (p.kind === 'gold_coin') {
        const spinScale = 0.72 + 0.28 * Math.abs(Math.cos(sim.elapsedSeconds * 5.5 + p.id));
        const rOuter = p.value >= 5 ? 9.5 : p.value >= 3 ? 8.2 : 7.0;
        g.ellipse(px, py + 8, rOuter * 0.8, 3.2).fill({ color: 0x0f131d, alpha: 0.32 });
        g.ellipse(px, py, rOuter * spinScale, rOuter)
          .fill({ color: PALETTE.GOLD_STAR })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
        g.ellipse(px, py, rOuter * 0.62 * spinScale, rOuter * 0.62).stroke({
          color: PALETTE.BUTTER_YELLOW,
          width: 1.4,
          alpha: 0.9,
        });
        g.moveTo(px, py - 3.2)
          .lineTo(px + 2.4 * spinScale, py)
          .lineTo(px, py + 3.2)
          .lineTo(px - 2.4 * spinScale, py)
          .closePath()
          .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.92 });
      } else if (p.kind === 'healing_seed') {
        g.circle(px, py, 8)
          .fill({ color: PALETTE.MINT_GREEN })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
        g.rect(px - 1.5, py - 4.5, 3, 9).fill({ color: PALETTE.CREAM_WHITE });
        g.rect(px - 4.5, py - 1.5, 9, 3).fill({ color: PALETTE.CREAM_WHITE });
      } else if (p.kind === 'heal_potion') {
        const pulse = 1 + 0.08 * Math.sin(sim.elapsedSeconds * 6.5 + p.id);
        g.ellipse(px, py + 10, 9.5, 4.2).fill({ color: 0x0f131d, alpha: 0.35 });
        // Soft emerald-rose aura petals behind flask
        for (let i = 0; i < 4; i++) {
          const a = sim.elapsedSeconds * 1.8 + (i * Math.PI) / 2;
          const ox = px + Math.cos(a) * 9.5 * pulse;
          const oy = py + Math.sin(a) * 9.5 * pulse;
          g.ellipse(ox, oy, 3.2, 1.8).fill({
            color: i % 2 === 0 ? PALETTE.MINT_GREEN : PALETTE.BLUSH_ROSE,
            alpha: 0.72,
          });
        }
        // Golden flask neck & leaf stopper
        g.roundRect(px - 3.5, py - 11.5, 7, 4.5, 1.5)
          .fill({ color: PALETTE.GOLD_STAR })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });
        g.moveTo(px, py - 11)
          .lineTo(px + 5.5, py - 14.5)
          .lineTo(px + 2, py - 9.5)
          .closePath()
          .fill({ color: PALETTE.MINT_GREEN })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.4 });
        // Rounded heart-blossom potion body
        g.circle(px, py, 9.5)
          .fill({ color: 0x10b981 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
        g.circle(px - 2.5, py - 2.5, 3.2).fill({ color: 0xa7f3d0, alpha: 0.65 });
        // Crisp white healing cross (+20 HP)
        g.rect(px - 1.8, py - 5.2, 3.6, 10.4).fill({ color: PALETTE.CREAM_WHITE });
        g.rect(px - 5.2, py - 1.8, 10.4, 3.6).fill({ color: PALETTE.CREAM_WHITE });
      } else if (p.kind === 'power_up') {
        const pId = p.powerUpId ?? 'shield';
        const pDef = POWER_UPS[pId];
        const col = pDef?.color ?? PALETTE.SKY_BLUE;
        const pulse = 1 + 0.1 * Math.sin(sim.elapsedSeconds * 7 + p.id);

        g.ellipse(px, py + 11, 11, 5).fill({ color: 0x0f131d, alpha: 0.38 });
        g.circle(px, py, 14 * pulse).stroke({
          color: col,
          width: 2,
          alpha: 0.55,
        });
        g.circle(px, py, 11)
          .fill({ color: col })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });

        if (pId === 'fire_breath') {
          g.moveTo(px, py - 6.5)
            .lineTo(px + 5, py + 2)
            .lineTo(px + 1.5, py + 5.5)
            .lineTo(px - 1.5, py + 5.5)
            .lineTo(px - 5, py + 2)
            .closePath()
            .fill({ color: PALETTE.BUTTER_YELLOW })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
          g.circle(px, py + 1.5, 2.4).fill({ color: PALETTE.CREAM_WHITE });
        } else if (pId === 'shield') {
          g.moveTo(px - 4.5, py - 4.5)
            .lineTo(px + 4.5, py - 4.5)
            .lineTo(px + 4.5, py + 1)
            .lineTo(px, py + 5.5)
            .lineTo(px - 4.5, py + 1)
            .closePath()
            .fill({ color: PALETTE.CREAM_WHITE })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
        } else if (pId === 'freeze') {
          g.moveTo(px, py - 6)
            .lineTo(px + 4.5, py)
            .lineTo(px, py + 6)
            .lineTo(px - 4.5, py)
            .closePath()
            .fill({ color: PALETTE.CREAM_WHITE })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
        } else if (pId === 'magnet') {
          g.moveTo(px + 4.5, py - 0.5)
            .arc(px, py - 0.5, 4.5, 0, Math.PI, false)
            .stroke({
              color: PALETTE.CREAM_WHITE,
              width: 2.8,
            });
        } else {
          g.moveTo(px - 4, py - 4.5)
            .lineTo(px + 4, py - 4.5)
            .lineTo(px - 4, py + 4.5)
            .lineTo(px + 4, py + 4.5)
            .closePath()
            .fill({ color: PALETTE.CREAM_WHITE })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 1.4 });
        }
      } else if (p.kind === 'chest') {
        g.roundRect(px - 13, py - 10, 26, 20, 4)
          .fill({ color: PALETTE.GOLD_STAR })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });
        g.rect(px - 13, py - 2, 26, 4).fill({ color: PALETTE.INK_OUTLINE });
        g.circle(px, py, 3.5).fill({ color: PALETTE.CREAM_WHITE });
      }
    }
  }

  public static drawOrbitingPetalsAndVisualEffects(
    fxGraphic: PIXI.Graphics,
    decalGraphic: PIXI.Graphics,
    sim: Simulation,
    alpha: number
  ): void {
    const g = fxGraphic;
    const hx = lerp(sim.heroPrevX, sim.heroX, alpha) * PPU;
    const hy = lerp(sim.heroPrevY, sim.heroY, alpha) * PPU;

    // 1. Orbiting Sakura Leaves / Petals with Wind Currents & Independent Up-and-Down Oscillation
    const petalCount = sim.getOrbitPetalCount();
    if (petalCount > 0) {
      const petalWpn = sim.weapons.find((w) => w.id === 'petal_orbit');
      const evolved = Boolean(petalWpn?.evolved);
      const orbitR = sim.getOrbitRadiusU() * PPU;
      const outerLeafColor = evolved ? 0xe879f9 : 0xf472b6;
      const innerLeafColor = evolved ? 0xfef08a : 0xfbcfe8;
      const veinColor = evolved ? 0xffffff : 0xfff1f2;

      const getPetalPos = (baseAngle: number, idx: number, timeSec: number) => {
        // Independent up-and-down vertical oscillation + radial wind wave per orb
        const upDownFreq = 3.8 + (idx % 3) * 1.15;
        const upDownPhase = idx * 2.17;
        const verticalInferencePx =
          Math.sin(timeSec * upDownFreq + upDownPhase) * 10.5 +
          Math.cos(timeSec * 5.6 - idx * 1.43) * 4.2;
        const radialWavePx =
          Math.sin(timeSec * (2.9 + (idx % 2) * 0.9) + idx * 1.65) * 6.0;
        const r = orbitR + radialWavePx;
        return {
          x: hx + Math.cos(baseAngle) * r,
          y: hy + Math.sin(baseAngle) * r + verticalInferencePx,
        };
      };

      for (let i = 0; i < petalCount; i++) {
        const a = sim.bonusOrbitAngle + (i / petalCount) * Math.PI * 2;
        const curr = getPetalPos(a, i, sim.elapsedSeconds);
        const midTrail = getPetalPos(a - 0.24, i, sim.elapsedSeconds - 0.06);
        const endTrail = getPetalPos(a - 0.5, i, sim.elapsedSeconds - 0.12);

        // Swirling wind gust ribbons trailing behind each sakura leaf
        g.moveTo(curr.x, curr.y)
          .quadraticCurveTo(midTrail.x, midTrail.y, endTrail.x, endTrail.y)
          .stroke({
            color: evolved ? PALETTE.LILAC_ARCANE : 0xfbcfe8,
            width: 4.2,
            alpha: 0.45,
            cap: 'round',
          });
        g.moveTo(curr.x, curr.y)
          .quadraticCurveTo(
            midTrail.x + Math.sin(sim.elapsedSeconds * 7 + i) * 3,
            midTrail.y - 2.5,
            endTrail.x,
            endTrail.y
          )
          .stroke({
            color: PALETTE.CREAM_WHITE,
            width: 1.8,
            alpha: 0.68,
            cap: 'round',
          });

        // Tiny wind-blown sakura flecks in the slipstream
        for (let t = 1; t <= 2; t++) {
          const fleckPos = getPetalPos(
            a - t * 0.19,
            i,
            sim.elapsedSeconds - t * 0.04
          );
          const fleckTilt = sim.elapsedSeconds * 9 + i * 2.3 + t;
          g.ellipse(
            fleckPos.x + Math.cos(fleckTilt) * 2.5,
            fleckPos.y + Math.sin(fleckTilt) * 2.5,
            3.2 - t * 0.7,
            1.6 - t * 0.3
          ).fill({
            color: innerLeafColor,
            alpha: 0.65 - t * 0.18,
          });
        }

        // 3D Wind-Flutter Orientation & Perspective Tilt for the Sakura Leaf
        const flutterAngle =
          a +
          Math.PI * 0.5 +
          Math.sin(sim.elapsedSeconds * 6.4 + i * 1.93) * 0.34;
        const flutterScaleY =
          0.8 + 0.22 * Math.sin(sim.elapsedSeconds * 5.2 + i * 1.47);

        const m = new PIXI.Matrix();
        m.scale(1.08, flutterScaleY);
        m.rotate(flutterAngle);
        m.translate(curr.x, curr.y);
        g.setTransform(m);

        // Authentic Cloven Sakura Leaf / Petal with signature V-notch cleft at the tip
        g.moveTo(-12.5, 0)
          .bezierCurveTo(-7.5, -8.8, 5.5, -9.2, 13.0, -3.8)
          .lineTo(8.4, 0)
          .lineTo(13.0, 3.8)
          .bezierCurveTo(5.5, 9.2, -7.5, 8.8, -12.5, 0)
          .closePath()
          .fill({ color: outerLeafColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.3 });

        // Soft inner sakura blush gradient layer
        g.moveTo(-9.0, 0)
          .bezierCurveTo(-4.5, -5.2, 3.5, -5.4, 8.8, -2.2)
          .lineTo(5.6, 0)
          .lineTo(8.8, 2.2)
          .bezierCurveTo(3.5, 5.4, -4.5, 5.2, -9.0, 0)
          .closePath()
          .fill({ color: innerLeafColor, alpha: 0.92 });

        // Delicate central midrib & lateral leaf veins
        g.moveTo(-9.5, 0)
          .lineTo(5.2, 0)
          .moveTo(-3.5, 0)
          .lineTo(2.0, -3.0)
          .moveTo(-3.5, 0)
          .lineTo(2.0, 3.0)
          .stroke({ color: veinColor, width: 1.3, alpha: 0.9, cap: 'round' });

        g.setTransform(new PIXI.Matrix());
      }
    }

    // 2. Transient Visual Effects
    for (const fx of sim.visualEffects) {
      const progress = clamp(1 - fx.timer / fx.maxTimer, 0, 1);
      const fade = 1 - progress;

      if (fx.kind === 'slash_arc') {
        const cx = fx.x * PPU;
        const cy = fx.y * PPU;
        const r = fx.radius * PPU;
        const startA = fx.angle - fx.arcRad / 2;
        const endA = fx.angle + fx.arcRad / 2;
        const startX = cx + Math.cos(startA) * r;
        const startY = cy + Math.sin(startA) * r;
        g.moveTo(startX, startY)
          .arc(cx, cy, r, startA, endA)
          .stroke({
            color: fx.color,
            width: 14 * fade,
            alpha: 0.78 * fade,
            cap: 'round',
          });
        g.moveTo(startX, startY)
          .arc(cx, cy, r, startA, endA)
          .stroke({
            color: PALETTE.CREAM_WHITE,
            width: 5 * fade,
            alpha: 0.92 * fade,
            cap: 'round',
          });

        // Visible doubled twin crescent animation when Echo Swing triggers!
        if (fx.isEcho) {
          const innerR = r * 0.82;
          const innerStartX = cx + Math.cos(startA) * innerR;
          const innerStartY = cy + Math.sin(startA) * innerR;
          g.moveTo(innerStartX, innerStartY)
            .arc(cx, cy, innerR, startA, endA)
            .stroke({
              color: PALETTE.BUTTER_YELLOW,
              width: 10 * fade,
              alpha: 0.85 * fade,
              cap: 'round',
            });
          g.moveTo(innerStartX, innerStartY)
            .arc(cx, cy, innerR, startA, endA)
            .stroke({
              color: PALETTE.CREAM_WHITE,
              width: 3.5 * fade,
              alpha: 0.95 * fade,
              cap: 'round',
            });
        }
      } else if (fx.kind === 'spear_line') {
        // Arbalete Firing Animation: Bowstring release wave, muzzle flash & bolt launch slipstream
        const x1 = fx.x * PPU;
        const y1 = fx.y * PPU;
        const x2 = fx.targetX * PPU;
        const y2 = fx.targetY * PPU;
        const cosA = Math.cos(fx.angle);
        const sinA = Math.sin(fx.angle);
        const perpX = -sinA;
        const perpY = cosA;
        const muzzleX = x1 + cosA * 18;
        const muzzleY = y1 + sinA * 18;

        // 1. Bowstring snap crescent wave at the Arbalete muzzle
        const snapSpread = 16 * (0.6 + 0.5 * progress);
        g.moveTo(muzzleX - cosA * 6 + perpX * snapSpread, muzzleY - sinA * 6 + perpY * snapSpread)
          .quadraticCurveTo(
            muzzleX + cosA * 12,
            muzzleY + sinA * 12,
            muzzleX - cosA * 6 - perpX * snapSpread,
            muzzleY - sinA * 6 - perpY * snapSpread
          )
          .stroke({
            color: PALETTE.BUTTER_YELLOW,
            width: 3.5 * fade,
            alpha: 0.9 * fade,
            cap: 'round',
          });

        // 2. High-velocity bolt launch slipstream & wind-tunnel rails
        g.moveTo(muzzleX, muzzleY)
          .lineTo(x2, y2)
          .stroke({
            color: fx.color,
            width: Math.max(4, fx.radius * PPU * 0.55) * fade,
            alpha: 0.45 * fade,
            cap: 'round',
          });
        g.moveTo(muzzleX, muzzleY)
          .lineTo(x2, y2)
          .stroke({
            color: PALETTE.CREAM_WHITE,
            width: 2.8 * fade,
            alpha: 0.92 * fade,
            cap: 'round',
          });

        // 3. Sonic air-compression chevrons along the bolt flight path
        for (let wIdx = 1; wIdx <= 2; wIdx++) {
          const frac = clamp(progress * 0.85 + wIdx * 0.25, 0.15, 0.95);
          const wx = lerp(muzzleX, x2, frac);
          const wy = lerp(muzzleY, y2, frac);
          const wingSpan = (11 - wIdx * 2) * fade;
          g.moveTo(wx - cosA * 8 + perpX * wingSpan, wy - sinA * 8 + perpY * wingSpan)
            .lineTo(wx + cosA * 4, wy + sinA * 4)
            .lineTo(wx - cosA * 8 - perpX * wingSpan, wy - sinA * 8 - perpY * wingSpan)
            .stroke({
              color: fx.arcRad > 0 ? PALETTE.GOLD_STAR : PALETTE.CREAM_WHITE,
              width: 2.2 * fade,
              alpha: 0.82 * fade,
              cap: 'round',
              join: 'round',
            });
        }

        // Visible doubled parallel twin bolt trace when Echo Swing triggers!
        if (fx.isEcho) {
          const offX = perpX * 10;
          const offY = perpY * 10;
          g.moveTo(muzzleX + offX, muzzleY + offY)
            .lineTo(x2 + offX, y2 + offY)
            .stroke({
              color: PALETTE.BUTTER_YELLOW,
              width: 3.5 * fade,
              alpha: 0.85 * fade,
              cap: 'round',
            });
        }
      } else if (fx.kind === 'bloom_hammer') {
        const impactX = fx.x * PPU;
        const impactY = fx.y * PPU;
        const maxR = fx.radius * PPU;
        const fallPhaseEnd = 0.42;

        if (progress < fallPhaseEnd) {
          // Phase 1: Descending from sky — ONLY ground shadow ellipse, NO border circle!
          const fallT = clamp(progress / fallPhaseEnd, 0, 1);
          const easeIn = fallT * fallT;
          const dropHeight = (1 - easeIn) * 165;
          const hammerY = impactY - dropHeight;

          // Expanding ground shadow below falling hammer (border circle removed per user request)
          g.ellipse(impactX, impactY, maxR * (0.25 + 0.55 * easeIn), maxR * (0.14 + 0.28 * easeIn))
            .fill({ color: 0x0f131d, alpha: 0.22 + 0.28 * easeIn });

          // Vertical speed lines trailing behind the falling hammer
          for (let s = -1; s <= 1; s++) {
            const sx = impactX + s * 12;
            g.moveTo(sx, hammerY - 36)
              .lineTo(sx, hammerY - 4)
              .stroke({
                color: PALETTE.CREAM_WHITE,
                width: 2.5,
                alpha: 0.65 * (1 - fallT * 0.3),
                cap: 'round',
              });
          }

          // Handle of the Blossom Hammer
          g.moveTo(impactX, hammerY - 30)
            .lineTo(impactX, hammerY + 4)
            .stroke({ color: PALETTE.INK_OUTLINE, width: 7, cap: 'round' });
          g.moveTo(impactX, hammerY - 30)
            .lineTo(impactX, hammerY + 4)
            .stroke({ color: 0x92400e, width: 3.8, cap: 'round' });

          // Heavy floral mallet head
          g.roundRect(impactX - 18, hammerY - 12, 36, 20, 6)
            .fill({ color: fx.color })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });
          g.circle(impactX, hammerY - 2, 5.5).fill({ color: PALETTE.CREAM_WHITE });
        } else {
          // Phase 2: Ground impact shockwave, radial cracks & petal burst
          const impT = clamp((progress - fallPhaseEnd) / (1 - fallPhaseEnd), 0, 1);
          const impFade = 1 - impT;
          const ringR = maxR * (0.45 + 0.65 * impT);

          g.circle(impactX, impactY, ringR)
            .fill({ color: fx.color, alpha: 0.24 * impFade })
            .stroke({ color: fx.color, width: 6 * impFade, alpha: 0.9 * impFade });
          g.circle(impactX, impactY, ringR * 0.68).stroke({
            color: PALETTE.CREAM_WHITE,
            width: 3 * impFade,
            alpha: 0.85 * impFade,
          });

          if (fx.isEcho) {
            g.circle(impactX, impactY, ringR * 1.16).stroke({
              color: PALETTE.SKY_BLUE,
              width: 4 * impFade,
              alpha: 0.85 * impFade,
            });
          }

          for (let c = 0; c < 6; c++) {
            const ca = fx.angle + (c * Math.PI) / 3;
            const cr = maxR * (0.3 + 0.65 * impT);
            g.moveTo(impactX + Math.cos(ca) * 8, impactY + Math.sin(ca) * 8)
              .lineTo(impactX + Math.cos(ca) * cr, impactY + Math.sin(ca) * cr)
              .stroke({
                color: PALETTE.CREAM_WHITE,
                width: 2.5 * impFade,
                alpha: 0.8 * impFade,
                cap: 'round',
              });
          }

          if (impT < 0.55) {
            const hFade = 1 - impT / 0.55;
            const bounceY = impactY - Math.sin((impT / 0.55) * Math.PI) * 10;
            g.roundRect(impactX - 18, bounceY - 12, 36, 20, 6)
              .fill({ color: fx.color, alpha: hFade })
              .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5, alpha: hFade });
          }
        }
      } else if (fx.kind === 'shockwave_blast') {
        const cx = fx.x * PPU;
        const cy = fx.y * PPU;
        const maxR = fx.radius * PPU;
        const easeOut = 1 - Math.pow(1 - progress, 2.4);
        const outerR = maxR * (0.22 + 0.78 * easeOut);
        const innerR = maxR * Math.max(0.08, easeOut - 0.24);

        g.circle(cx, cy, outerR)
          .fill({ color: fx.color, alpha: 0.2 * fade })
          .stroke({ color: fx.color, width: 7 * fade, alpha: 0.95 * fade });
        g.circle(cx, cy, innerR).stroke({
          color: PALETTE.CREAM_WHITE,
          width: 3.5 * fade,
          alpha: 0.9 * fade,
        });

        const rays = 8;
        for (let rIdx = 0; rIdx < rays; rIdx++) {
          const ra = fx.angle + (rIdx / rays) * Math.PI * 2;
          const rStart = innerR * 0.45;
          const rEnd = outerR * 1.06;
          g.moveTo(cx + Math.cos(ra) * rStart, cy + Math.sin(ra) * rStart)
            .lineTo(cx + Math.cos(ra) * rEnd, cy + Math.sin(ra) * rEnd)
            .stroke({
              color: PALETTE.CREAM_WHITE,
              width: 2.8 * fade,
              alpha: 0.85 * fade,
              cap: 'round',
            });
        }
      } else if (fx.kind === 'second_wind_blast') {
        // Second Wind resurrection shockwave + rising golden-emerald feathers
        const cx = fx.x * PPU;
        const cy = fx.y * PPU;
        const maxR = fx.radius * PPU;
        const easeOut = 1 - Math.pow(1 - progress, 2.2);
        const r = maxR * (0.25 + 0.75 * easeOut);

        g.circle(cx, cy, r)
          .fill({ color: PALETTE.MINT_GREEN, alpha: 0.22 * fade })
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 6 * fade, alpha: 0.95 * fade });
        g.circle(cx, cy, r * 0.72).stroke({
          color: PALETTE.MINT_GREEN,
          width: 3.5 * fade,
          alpha: 0.9 * fade,
        });

        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + progress * 1.5;
          const px = cx + Math.cos(a) * (r * 0.65);
          const py = cy + Math.sin(a) * (r * 0.5) - progress * 34;
          g.ellipse(px, py, 5 * fade, 2.4 * fade)
            .fill({ color: i % 2 === 0 ? PALETTE.BUTTER_YELLOW : PALETTE.MINT_GREEN, alpha: 0.95 * fade })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 1.4, alpha: 0.75 * fade });
        }
      } else if (fx.kind === 'ember_burst') {
        const cx = fx.x * PPU;
        const cy = fx.y * PPU;
        const maxR = fx.radius * PPU;
        const easeOut = 1 - Math.pow(1 - progress, 2.0);
        const r = maxR * (0.35 + 0.65 * easeOut);

        g.circle(cx, cy, r)
          .fill({ color: 0xfb923c, alpha: 0.22 * fade })
          .stroke({ color: 0xf43f5e, width: 6 * fade, alpha: 0.92 * fade });
        g.circle(cx, cy, r * 0.75).stroke({
          color: PALETTE.BUTTER_YELLOW,
          width: 3 * fade,
          alpha: 0.9 * fade,
        });

        const tongues = 8;
        for (let tIdx = 0; tIdx < tongues; tIdx++) {
          const ta = fx.angle + progress * 2.2 + (tIdx / tongues) * Math.PI * 2;
          const tx = cx + Math.cos(ta) * r;
          const ty = cy + Math.sin(ta) * r;
          g.circle(tx, ty, 5.5 * fade)
            .fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.92 * fade })
            .stroke({ color: 0xf43f5e, width: 2 * fade, alpha: 0.85 * fade });
        }
      } else if (fx.kind === 'clover_step') {
        WeaponEffectsRenderer.drawLuckyCloverStep(decalGraphic, fx, progress, fade);
      } else if (
        fx.kind === 'zagreus_fire_step' ||
        fx.kind === 'void_soul_step' ||
        fx.kind === 'alchemy_rune_step' ||
        fx.kind === 'godspeed_lightning_step'
      ) {
        WeaponEffectsRenderer.drawPersonaStepEffect(decalGraphic, g, fx, progress, fade);
      } else if (fx.kind === 'heal_pulse') {
        WeaponEffectsRenderer.drawHeroHealPulse(g, fx, hx, hy, progress, fade);
      } else if (fx.kind === 'dash_strike_burst') {
        WeaponEffectsRenderer.drawDashStrikeBurst(g, fx, progress, fade);
      } else if (fx.kind === 'aegis_burst') {
        WeaponEffectsRenderer.drawAegisActivationBurst(g, fx, progress, fade);
      } else if (fx.kind === 'circle_blast') {
        const cx = fx.x * PPU;
        const cy = fx.y * PPU;
        const r = fx.radius * PPU * (0.4 + 0.6 * progress);
        g.circle(cx, cy, r)
          .fill({ color: fx.color, alpha: 0.25 * fade })
          .stroke({ color: fx.color, width: 4 * fade, alpha: 0.85 * fade });
        if (fx.isEcho) {
          g.circle(cx, cy, r * 1.18).stroke({
            color: PALETTE.BUTTER_YELLOW,
            width: 3.5 * fade,
            alpha: 0.85 * fade,
          });
        }
      } else if (fx.kind === 'spore_cloud') {
        const cx = fx.x * PPU;
        const cy = fx.y * PPU;
        const baseR = fx.radius * PPU * (0.65 + 0.35 * Math.sin(progress * Math.PI * 0.5));
        WeaponEffectsRenderer.drawSporePopGasCloud(
          g,
          cx,
          cy,
          baseR,
          progress,
          fade,
          fx.id,
          sim.elapsedSeconds
        );
      } else if (fx.kind === 'chain_bolt') {
        const x1 = fx.x * PPU;
        const y1 = fx.y * PPU;
        const x2 = fx.targetX * PPU;
        const y2 = fx.targetY * PPU;
        const midX = (x1 + x2) / 2 + (y2 - y1) * 0.18;
        const midY = (y1 + y2) / 2 - (x2 - x1) * 0.18;
        g.moveTo(x1, y1)
          .lineTo(midX, midY)
          .lineTo(x2, y2)
          .stroke({
            color: fx.color,
            width: 5 * fade,
            alpha: 0.9 * fade,
          });
        if (fx.isEcho) {
          const midX2 = (x1 + x2) / 2 - (y2 - y1) * 0.18;
          const midY2 = (y1 + y2) / 2 + (x2 - x1) * 0.18;
          g.moveTo(x1, y1)
            .lineTo(midX2, midY2)
            .lineTo(x2, y2)
            .stroke({
              color: PALETTE.BUTTER_YELLOW,
              width: 3.5 * fade,
              alpha: 0.85 * fade,
            });
        }
      } else if (fx.kind === 'dash_ghost') {
        const gx = fx.x * PPU;
        const gy = fx.y * PPU;
        const tx = fx.targetX * PPU;
        const ty = fx.targetY * PPU;
        const perpX = -Math.sin(fx.angle);
        const perpY = Math.cos(fx.angle);

        g.moveTo(gx, gy)
          .lineTo(tx, ty)
          .stroke({
            color: fx.color,
            width: 18 * fade,
            alpha: 0.36 * fade,
            cap: 'round',
          });
        g.moveTo(gx, gy)
          .lineTo(tx, ty)
          .stroke({
            color: PALETTE.CREAM_WHITE,
            width: 6 * fade,
            alpha: 0.55 * fade,
            cap: 'round',
          });

        g.circle(gx, gy - 3, 12 * (0.55 + 0.45 * fade)).fill({
          color: fx.color,
          alpha: 0.38 * fade,
        });

        for (let s = -1; s <= 1; s += 2) {
          const drift = (1 - fade) * 10 * s;
          const px = (gx + tx) * 0.5 + perpX * (7 * s + drift);
          const py = (gy + ty) * 0.5 + perpY * (7 * s + drift) - (1 - fade) * 6;
          g.ellipse(px, py, 4.5 * fade, 2.5 * fade).fill({
            color: s > 0 ? PALETTE.BUTTER_YELLOW : PALETTE.CREAM_WHITE,
            alpha: 0.72 * fade,
          });
        }
      } else if (fx.kind === 'fire_cone') {
        const cx = fx.x * PPU;
        const cy = fx.y * PPU;
        const r = fx.radius * PPU;
        const startA = fx.angle - fx.arcRad / 2;
        const endA = fx.angle + fx.arcRad / 2;
        g.moveTo(cx, cy)
          .arc(cx, cy, r, startA, endA)
          .closePath()
          .fill({ color: fx.color, alpha: 0.38 * fade });
      } else if (fx.kind === 'lightning_strike') {
        const tx = fx.x * PPU;
        const ty = fx.y * PPU;
        const skyY = ty - 240;

        const z1x = tx - 16;
        const z1y = ty - 170;
        const z2x = tx + 18;
        const z2y = ty - 105;
        const z3x = tx - 10;
        const z3y = ty - 45;

        g.moveTo(tx + 6, skyY)
          .lineTo(z1x, z1y)
          .lineTo(z2x, z2y)
          .lineTo(z3x, z3y)
          .lineTo(tx, ty)
          .stroke({
            color: PALETTE.SKY_BLUE,
            width: 14 * fade,
            alpha: 0.65 * fade,
            cap: 'round',
            join: 'round',
          });

        g.moveTo(tx + 6, skyY)
          .lineTo(z1x, z1y)
          .lineTo(z2x, z2y)
          .lineTo(z3x, z3y)
          .lineTo(tx, ty)
          .stroke({
            color: PALETTE.CREAM_WHITE,
            width: 5 * fade,
            alpha: 0.98 * fade,
            cap: 'round',
            join: 'round',
          });

        const blastR = fx.radius * PPU * (0.35 + 0.65 * progress);
        g.circle(tx, ty, blastR)
          .fill({ color: PALETTE.SKY_BLUE, alpha: 0.28 * fade })
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 3.5 * fade, alpha: 0.9 * fade });
      }
    }
  }

  /**
   * Renders a Hero Heal visual effect centered on the hero with rising green particles
   * (glowing emerald motes, rising leaf particles, and floating green '+' crosses).
   */
  public static drawHeroHealPulse(
    g: PIXI.Graphics,
    fx: SimVisualEffect,
    heroPxX: number,
    heroPxY: number,
    progress: number,
    fade: number
  ): void {
    const healPower = Math.max(1, fx.arcRad);
    const powerNorm = clamp(healPower / 25, 0.08, 1.5);
    const maxR = fx.radius * PPU;
    const easeOut = 1 - Math.pow(1 - progress, 2.1);
    const currentR = maxR * (0.32 + 0.68 * easeOut);

    // Expanding emerald aura ring around hero
    const ringAlpha = clamp((0.28 + powerNorm * 0.42) * fade, 0.12, 0.85);
    const ringWidth = (2.2 + powerNorm * 3.8) * fade;
    g.circle(heroPxX, heroPxY, currentR)
      .fill({ color: PALETTE.MINT_GREEN, alpha: ringAlpha * 0.28 })
      .stroke({ color: PALETTE.MINT_GREEN, width: ringWidth, alpha: ringAlpha });

    // Rising green particles around the hero (motes + leaves + emerald '+' crosses)
    const particleCount = clamp(Math.round(5 + powerNorm * 7), 5, 14);
    for (let i = 0; i < particleCount; i++) {
      const seedA = (i / particleCount) * Math.PI * 2 + fx.id * 0.65;
      const spreadR = 10 + (i % 3) * 8 + powerNorm * 8;
      const riseHeight = (26 + (i % 4) * 9 + powerNorm * 22) * easeOut;
      const px = heroPxX + Math.cos(seedA + progress * 1.1) * spreadR;
      const py = heroPxY + 10 + Math.sin(seedA) * (spreadR * 0.45) - riseHeight;
      const pSize = (3.4 + (i % 2) * 1.4 + powerNorm * 1.5) * fade;

      if (i % 3 === 0) {
        // Rising emerald '+' cross particle
        g.rect(px - pSize * 0.32, py - pSize, pSize * 0.64, pSize * 2).fill({
          color: PALETTE.MINT_GREEN,
          alpha: 0.92 * fade,
        });
        g.rect(px - pSize, py - pSize * 0.32, pSize * 2, pSize * 0.64).fill({
          color: PALETTE.MINT_GREEN,
          alpha: 0.92 * fade,
        });
      } else if (i % 3 === 1) {
        // Rising green leaf particle
        g.ellipse(px, py, pSize * 1.15, pSize * 0.62)
          .fill({ color: 0x22c55e, alpha: 0.9 * fade })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.1, alpha: 0.65 * fade });
      } else {
        // Glowing mint mote particle going up
        g.circle(px, py, pSize * 0.85)
          .fill({ color: PALETTE.MINT_GREEN, alpha: 0.92 * fade })
          .stroke({ color: PALETTE.CREAM_WHITE, width: 1.0, alpha: 0.75 * fade });
      }
    }
  }

  /**
   * Renders a Lucky Clover footstep decal behind the hero.
   * No yellow rounds on max clover level!
   */
  public static drawLuckyCloverStep(
    decalGraphic: PIXI.Graphics,
    fx: SimVisualEffect,
    progress: number,
    fade: number
  ): void {
    const lv = clamp(Math.round(fx.arcRad), 1, 5);
    const cx = fx.x * PPU;
    const cy = fx.y * PPU;

    const popScale = progress < 0.18 ? progress / 0.18 : 1 - (progress - 0.18) * 0.25;
    const baseR = fx.radius * PPU * popScale;
    const baseAlpha = (0.24 + lv * 0.13) * fade;

    const leafCount = lv >= 2 ? 4 : 3;
    const leafDist = baseR * 0.52;
    const leafR = baseR * 0.46;

    for (let i = 0; i < leafCount; i++) {
      const a = fx.angle + (i / leafCount) * Math.PI * 2;
      const lx = cx + Math.cos(a) * leafDist;
      const ly = cy + Math.sin(a) * leafDist;

      decalGraphic
        .circle(lx, ly, leafR)
        .fill({
          color: i % 2 === 0 ? PALETTE.MINT_GREEN : 0x10b981,
          alpha: baseAlpha,
        })
        .stroke({
          color: PALETTE.INK_OUTLINE,
          width: lv >= 3 ? 1.8 : 1.2,
          alpha: baseAlpha * 0.85,
        });
    }

    // Tiny green clover stem (no yellow center round or yellow ground halo!)
    const stemAngle = fx.angle + Math.PI * 0.75;
    decalGraphic
      .moveTo(cx, cy)
      .lineTo(cx + Math.cos(stemAngle) * (baseR * 0.85), cy + Math.sin(stemAngle) * (baseR * 0.85))
      .stroke({
        color: 0x059669,
        width: 2.0,
        alpha: baseAlpha,
        cap: 'round',
      });
  }

  /**
   * Renders disappearing pop-culture Arcana Persona footsteps behind the character:
   * - zagreus_fire_step: Stygian Hellfire & Six-Paths Chakra burning footprint + rising ember flames
   * - void_soul_step: Hollow Knight Void puddle + Survey Corps ODM steam vortex
   * - alchemy_rune_step: Doctor Strange Eldritch Mandala + Fullmetal Alchemical Transmutation rune
   * - godspeed_lightning_step: Gojo Infinity spatial ripple + Killua Godspeed bio-lightning arcs
   */
  public static drawPersonaStepEffect(
    decalGraphic: PIXI.Graphics,
    fxGraphic: PIXI.Graphics,
    fx: SimVisualEffect,
    progress: number,
    fade: number
  ): void {
    const cx = fx.x * PPU;
    const cy = fx.y * PPU;
    const baseR = fx.radius * PPU;
    const scale = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) * 0.35;
    const r = Math.max(2, baseR * scale);

    if (fx.kind === 'zagreus_fire_step') {
      // Stygian Hellfire & Six-Paths Sage Chakra burning footprint on the ground
      const m = new PIXI.Matrix();
      m.rotate(fx.angle);
      m.translate(cx, cy);
      decalGraphic.setTransform(m);

      // Scorched Stygian ember sole print
      decalGraphic
        .ellipse(0, 0, r * 0.92, r * 0.54)
        .fill({ color: 0xf43f5e, alpha: 0.78 * fade })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 * fade, alpha: 0.8 * fade });

      // Inner Six-Paths golden-orange chakra core
      decalGraphic
        .ellipse(r * 0.12, 0, r * 0.58, r * 0.32)
        .fill({ color: 0xf97316, alpha: 0.9 * fade });
      decalGraphic
        .ellipse(r * 0.2, 0, r * 0.32, r * 0.18)
        .fill({ color: 0xfbbf24, alpha: 0.95 * fade });

      decalGraphic.setTransform(new PIXI.Matrix());

      // Rising Hellfire tongues & chakra sparks that drift up and disappear
      for (let i = 0; i < 3; i++) {
        const seedA = fx.id * 1.3 + i * 2.1;
        const fxX = cx + Math.cos(seedA) * (r * 0.45);
        const fxY = cy + Math.sin(seedA) * (r * 0.25) - progress * (18 + i * 6);
        const flameR = (4.2 - i * 0.7) * fade;
        fxGraphic
          .circle(fxX, fxY, flameR)
          .fill({ color: i === 0 ? 0xf43f5e : i === 1 ? 0xf97316 : 0xfbbf24, alpha: 0.88 * fade });
      }
    } else if (fx.kind === 'void_soul_step') {
      // Abyssal Void-Shade puddle + ODM pressurized steam ring
      decalGraphic
        .ellipse(cx, cy, r * 0.9, r * 0.52)
        .fill({ color: 0x0f172a, alpha: 0.82 * fade })
        .stroke({ color: 0x38bdf8, width: 1.8 * fade, alpha: 0.85 * fade });
      decalGraphic
        .ellipse(cx, cy, r * 0.48, r * 0.26)
        .fill({ color: 0x10b981, alpha: 0.55 * fade });

      // Rising Void droplets & white ODM steam wisps
      for (let i = 0; i < 3; i++) {
        const seedA = fx.id * 1.7 + i * 2.09;
        const wx = cx + Math.cos(seedA + progress * 2) * (r * 0.55);
        const wy = cy - progress * (16 + i * 5);
        fxGraphic
          .circle(wx, wy, (3.6 - i * 0.5) * fade)
          .fill({
            color: i % 2 === 0 ? 0x0f172a : 0xe0f2fe,
            alpha: 0.85 * fade,
          })
          .stroke({
            color: i % 2 === 0 ? 0x38bdf8 : 0x10b981,
            width: 1.1,
            alpha: 0.7 * fade,
          });
      }
    } else if (fx.kind === 'alchemy_rune_step') {
      // Eldritch Mandala & Alchemical Transmutation Circle
      const runeR = baseR * (0.65 + 0.45 * progress);
      decalGraphic
        .circle(cx, cy, runeR)
        .fill({ color: 0x2dd4bf, alpha: 0.18 * fade })
        .stroke({ color: 0xfbbf24, width: 2.0 * fade, alpha: 0.88 * fade });
      decalGraphic
        .circle(cx, cy, runeR * 0.66)
        .stroke({ color: 0x2dd4bf, width: 1.4 * fade, alpha: 0.82 * fade });

      // Inscribed Alchemical Triangle inside the circle
      const rot = fx.angle + progress * 1.4;
      for (let v = 0; v < 3; v++) {
        const a1 = rot + (v * Math.PI * 2) / 3;
        const a2 = rot + ((v + 1) * Math.PI * 2) / 3;
        decalGraphic
          .moveTo(cx + Math.cos(a1) * (runeR * 0.64), cy + Math.sin(a1) * (runeR * 0.64))
          .lineTo(cx + Math.cos(a2) * (runeR * 0.64), cy + Math.sin(a2) * (runeR * 0.64))
          .stroke({ color: 0xfbbf24, width: 1.5 * fade, alpha: 0.85 * fade });
      }

      // Red Fullmetal transmutation spark rising
      const sparkY = cy - progress * 16;
      fxGraphic
        .circle(cx, sparkY, 3.2 * fade)
        .fill({ color: 0xef4444, alpha: 0.9 * fade })
        .stroke({ color: 0xfbbf24, width: 1.2 * fade, alpha: 0.85 * fade });
    } else if (fx.kind === 'godspeed_lightning_step') {
      // Gojo Infinity spatial ripple + Killua Godspeed electric arcs
      const rippleR = baseR * (0.55 + 0.6 * progress);
      decalGraphic
        .ellipse(cx, cy, rippleR, rippleR * 0.58)
        .fill({ color: 0xa855f7, alpha: 0.24 * fade })
        .stroke({ color: 0x38bdf8, width: 2.2 * fade, alpha: 0.9 * fade });

      // Crackling Godspeed bio-lightning bolt snapping upward
      const z1x = cx + (fx.id % 2 === 0 ? 5 : -5);
      const z1y = cy - 7 - progress * 8;
      const z2x = cx + (fx.id % 2 === 0 ? -4 : 4);
      const z2y = cy - 15 - progress * 12;
      fxGraphic
        .moveTo(cx, cy)
        .lineTo(z1x, z1y)
        .lineTo(z2x, z2y)
        .stroke({
          color: 0x38bdf8,
          width: 2.8 * fade,
          alpha: 0.92 * fade,
          cap: 'round',
          join: 'round',
        });
      fxGraphic
        .moveTo(cx, cy)
        .lineTo(z1x, z1y)
        .lineTo(z2x, z2y)
        .stroke({
          color: 0xe0f2fe,
          width: 1.3 * fade,
          alpha: 0.95 * fade,
          cap: 'round',
        });
    }
  }

  public static drawProjectiles(
    projectileGraphic: PIXI.Graphics,
    sim: Simulation,
    alpha: number
  ): void {
    const g = projectileGraphic;

    for (const p of sim.projectiles) {
      const px = lerp(p.prevX, p.x, alpha) * PPU;
      const py = lerp(p.prevY, p.y, alpha) * PPU;
      const rPx = p.radius * PPU;
      const angle = Math.atan2(p.vy, p.vx);

      if (p.isEnemy) {
        if (p.projectileKind === 'sunflower_seed') {
          // Striped Golden/Brown Sunflower Seed projectile
          const m = new PIXI.Matrix();
          m.rotate(angle);
          m.translate(px, py);
          g.setTransform(m);
          g.moveTo(rPx * 1.45, 0)
            .lineTo(-rPx * 0.6, -rPx * 0.85)
            .lineTo(-rPx * 1.15, 0)
            .lineTo(-rPx * 0.6, rPx * 0.85)
            .closePath()
            .fill({ color: 0x78350f })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
          g.moveTo(rPx * 0.9, 0)
            .lineTo(-rPx * 0.7, 0)
            .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.2, cap: 'round' });
          g.setTransform(new PIXI.Matrix());
        } else if (p.projectileKind === 'sunflower_leaf') {
          // Spinning Razor Sunflower Leaf projectile
          const spinAngle = angle + sim.elapsedSeconds * 12;
          const m = new PIXI.Matrix();
          m.rotate(spinAngle);
          m.translate(px, py);
          g.setTransform(m);
          g.ellipse(0, 0, rPx * 1.45, rPx * 0.72)
            .fill({ color: PALETTE.MINT_GREEN })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
          g.moveTo(-rPx * 1.1, 0)
            .lineTo(rPx * 1.1, 0)
            .stroke({ color: PALETTE.BUTTER_YELLOW, width: 1.8 });
          g.setTransform(new PIXI.Matrix());
        } else if (p.projectileKind === 'boss_vine_thorn') {
          // Phase 1 Boss ('Primordial Thornheart'): Knotted Emerald-and-Bark Vine Thorn Spearhead
          const m = new PIXI.Matrix();
          m.rotate(angle);
          m.translate(px, py);
          g.setTransform(m);

          // Trailing emerald sap wake
          g.moveTo(-rPx * 1.9, 0)
            .lineTo(-rPx * 0.4, 0)
            .stroke({ color: PALETTE.MINT_GREEN, width: 3.2, alpha: 0.65, cap: 'round' });

          // Knotted dark-bark base & barbed emerald thorn body
          g.moveTo(rPx * 1.65, 0)
            .lineTo(-rPx * 0.2, -rPx * 0.92)
            .lineTo(-rPx * 0.65, -rPx * 0.42)
            .lineTo(-rPx * 1.25, -rPx * 0.75)
            .lineTo(-rPx * 0.95, 0)
            .lineTo(-rPx * 1.25, rPx * 0.75)
            .lineTo(-rPx * 0.65, rPx * 0.42)
            .lineTo(-rPx * 0.2, rPx * 0.92)
            .closePath()
            .fill({ color: 0x059669 })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.3 });

          // Glowing emerald heart-core vein along the spine
          g.moveTo(-rPx * 0.65, 0)
            .lineTo(rPx * 1.1, 0)
            .stroke({ color: PALETTE.MINT_GREEN, width: 2.4, cap: 'round' });
          g.circle(-rPx * 0.25, 0, rPx * 0.34).fill({ color: PALETTE.BUTTER_YELLOW });

          g.setTransform(new PIXI.Matrix());
        } else if (p.projectileKind === 'boss_magenta_petal') {
          // Phase 2 Boss ('Frenzied Bloom'): Radiant Magenta Crystal Blossom Petal with Golden Core
          const spin = angle + Math.sin(sim.elapsedSeconds * 10 + p.id) * 0.28;
          const m = new PIXI.Matrix();
          m.rotate(spin);
          m.translate(px, py);
          g.setTransform(m);

          // Shimmering magenta-pink slipstream
          g.ellipse(-rPx * 0.9, 0, rPx * 0.85, rPx * 0.38).fill({
            color: 0xf472b6,
            alpha: 0.42,
          });

          // Cloven Frenzied Bloom magenta petal silhouette
          g.moveTo(-rPx * 1.25, 0)
            .bezierCurveTo(-rPx * 0.55, -rPx * 1.15, rPx * 0.65, -rPx * 1.1, rPx * 1.55, -rPx * 0.35)
            .lineTo(rPx * 1.05, 0)
            .lineTo(rPx * 1.55, rPx * 0.35)
            .bezierCurveTo(rPx * 0.65, rPx * 1.1, -rPx * 0.55, rPx * 1.15, -rPx * 1.25, 0)
            .closePath()
            .fill({ color: 0xec4899 })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.3 });

          // Inner radiant crystal core
          g.ellipse(0, 0, rPx * 0.72, rPx * 0.38).fill({ color: 0xfbcfe8, alpha: 0.92 });
          g.circle(rPx * 0.2, 0, rPx * 0.28).fill({ color: PALETTE.BUTTER_YELLOW });

          g.setTransform(new PIXI.Matrix());
        } else if (p.projectileKind === 'boss_abyssal_razor') {
          // Phase 3 Boss ('Apex Briar Overlord'): Whirling Crimson & Dark-Purple Thorny Crescent Razor
          const spinAngle = angle + sim.elapsedSeconds * 15 + p.id;
          const m = new PIXI.Matrix();
          m.rotate(spinAngle);
          m.translate(px, py);
          g.setTransform(m);

          const R = rPx * 1.45;
          // Dark-purple abyssal outer crescent with jagged crimson briar spikes
          g.moveTo(-R * 0.45, -R)
            .quadraticCurveTo(R * 1.15, 0, -R * 0.45, R)
            .quadraticCurveTo(R * 0.35, 0, -R * 0.45, -R)
            .closePath()
            .fill({ color: 0x581c87 })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.4 });

          // Crimson thorn inner edge
          g.moveTo(-R * 0.2, -R * 0.78)
            .quadraticCurveTo(R * 0.82, 0, -R * 0.2, R * 0.78)
            .stroke({ color: 0xf43f5e, width: 3.2, cap: 'round' });

          // Intense yellow-gold overlord eye core
          g.circle(R * 0.22, 0, rPx * 0.42)
            .fill({ color: PALETTE.BUTTER_YELLOW })
            .stroke({ color: 0xe11d48, width: 1.6 });

          g.setTransform(new PIXI.Matrix());
        } else {
          g.circle(px, py, rPx)
            .fill({ color: p.color })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
          g.circle(px, py, rPx * 0.45).fill({ color: PALETTE.CREAM_WHITE });
        }
      } else if (p.projectileKind === 'arbalete_bolt') {
        // High-Velocity Fletched Crossbow Bolt fired from the Briar Arbalete
        const m = new PIXI.Matrix();
        m.rotate(angle);
        m.translate(px, py);
        g.setTransform(m);

        const boltLen = Math.max(18, rPx * 1.75);
        const finW = Math.max(5.5, rPx * 0.65);

        // High-speed slipstream wake lines behind bolt
        g.moveTo(-boltLen * 1.35, -finW * 0.45)
          .lineTo(-boltLen * 0.45, -finW * 0.45)
          .moveTo(-boltLen * 1.35, finW * 0.45)
          .lineTo(-boltLen * 0.45, finW * 0.45)
          .stroke({ color: PALETTE.CREAM_WHITE, width: 1.6, alpha: 0.65, cap: 'round' });

        // Fletched feather fins at rear of bolt
        g.moveTo(-boltLen * 0.88, -finW)
          .lineTo(-boltLen * 0.38, -1.8)
          .lineTo(-boltLen * 0.38, 1.8)
          .lineTo(-boltLen * 0.88, finW)
          .lineTo(-boltLen * 0.68, 0)
          .closePath()
          .fill({ color: p.explodesOnExpire ? PALETTE.BUTTER_YELLOW : PALETTE.CREAM_WHITE })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

        // Hardwood / Iron Bolt Shaft
        g.roundRect(-boltLen * 0.65, -2.4, boltLen * 1.15, 4.8, 2)
          .fill({ color: p.explodesOnExpire ? 0xbe123c : 0x8c5a3c })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0 });

        // Broad Barbed Crossbow Bolt Head
        g.moveTo(boltLen * 0.95, 0)
          .lineTo(boltLen * 0.22, -finW * 0.95)
          .lineTo(boltLen * 0.38, 0)
          .lineTo(boltLen * 0.22, finW * 0.95)
          .closePath()
          .fill({ color: p.color })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });

        // Evolved Explosive Warhead Core at bolt tip
        if (p.explodesOnExpire) {
          g.circle(boltLen * 0.55, 0, 4.2)
            .fill({ color: PALETTE.BUTTER_YELLOW })
            .stroke({ color: 0xf43f5e, width: 1.8 });
        }

        g.setTransform(new PIXI.Matrix());
      } else if (p.weaponTags.includes('slash')) {
        // Piercing Slash crescent wave (with setTransform called BEFORE paths so nothing spawns at 0,0!)
        const m = new PIXI.Matrix();
        m.rotate(angle);
        m.translate(px, py);
        g.setTransform(m);

        const cresR = Math.max(14, rPx * 1.35);
        g.moveTo(-cresR * 0.35, -cresR)
          .quadraticCurveTo(cresR * 0.95, 0, -cresR * 0.35, cresR)
          .quadraticCurveTo(cresR * 0.35, 0, -cresR * 0.35, -cresR)
          .closePath()
          .fill({ color: p.color, alpha: 0.92 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.4 });

        g.moveTo(-cresR * 0.12, -cresR * 0.68)
          .quadraticCurveTo(cresR * 0.62, 0, -cresR * 0.12, cresR * 0.68)
          .stroke({ color: PALETTE.CREAM_WHITE, width: 2.4, alpha: 0.95, cap: 'round' });

        g.setTransform(new PIXI.Matrix());
      } else {
        const m = new PIXI.Matrix();
        m.rotate(angle);
        m.translate(px, py);
        g.setTransform(m);

        // Winged botanical seed blade dagger matching Seeker Bestiary weapon art
        const bladeLen = rPx * 1.65;
        const halfW = rPx * 0.85;

        // Golden pommel & crossguard wings
        g.moveTo(-bladeLen * 0.55, -halfW * 0.95)
          .lineTo(-bladeLen * 0.25, 0)
          .lineTo(-bladeLen * 0.55, halfW * 0.95)
          .lineTo(-bladeLen * 0.85, 0)
          .closePath()
          .fill({ color: PALETTE.BUTTER_YELLOW })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

        // Leaf-shaped emerald dagger blade
        g.moveTo(bladeLen, 0)
          .lineTo(-bladeLen * 0.15, -halfW)
          .lineTo(-bladeLen * 0.5, 0)
          .lineTo(-bladeLen * 0.15, halfW)
          .closePath()
          .fill({ color: p.color })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });

        // Central fuller highlight
        g.moveTo(-bladeLen * 0.25, 0)
          .lineTo(bladeLen * 0.72, 0)
          .stroke({ color: PALETTE.CREAM_WHITE, width: 1.6, alpha: 0.9, cap: 'round' });

        // Glowing green venom tip when Seed Blades Lv2+ poison is active
        const seedWpn = sim.weapons.find((w) => w.id === 'seed_blades');
        if (seedWpn && (seedWpn.level >= 2 || seedWpn.evolved)) {
          g.circle(bladeLen * 0.75, 0, Math.max(2.2, rPx * 0.34)).fill({
            color: 0x22c55e,
            alpha: 0.95,
          });
        }

        g.setTransform(new PIXI.Matrix());
      }
    }
  }

  /**
   * Pretty Thorn Trail visual effect instead of red circles:
   * Intertwined curving dark-emerald & mint briar vines with sharp rose/crimson thorns,
   * small leaves, and blooming rosebuds.
   */
  private static drawThornTrailHazard(
    g: PIXI.Graphics,
    hx: number,
    hy: number,
    rPx: number,
    fade: number,
    id: number,
    elapsedSeconds: number
  ): void {
    const seedRot = (id * 1.37) % (Math.PI * 2);
    const sway = Math.sin(elapsedSeconds * 3.2 + id) * 0.08;

    // 3 intertwined S-curved thorny briar vines across the patch
    for (let v = 0; v < 3; v++) {
      const a = seedRot + sway + (v * Math.PI) / 3;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      const perpX = -sinA;
      const perpY = cosA;
      const span = rPx * (0.82 - v * 0.08);
      const wave = rPx * 0.26 * (v % 2 === 0 ? 1 : -1);

      const x0 = hx - cosA * span;
      const y0 = hy - sinA * span;
      const x1 = hx + cosA * span;
      const y1 = hy + sinA * span;
      const cx1 = hx - cosA * (span * 0.35) + perpX * wave;
      const cy1 = hy - sinA * (span * 0.35) + perpY * wave;
      const cx2 = hx + cosA * (span * 0.35) - perpX * wave;
      const cy2 = hy + sinA * (span * 0.35) - perpY * wave;

      // Dark forest outline + vibrant emerald/mint vine stem
      g.moveTo(x0, y0)
        .bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1)
        .stroke({ color: 0x064e3b, width: 5.2 * fade, alpha: 0.85 * fade, cap: 'round' });
      g.moveTo(x0, y0)
        .bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1)
        .stroke({
          color: v === 0 ? PALETTE.MINT_GREEN : 0x10b981,
          width: 2.6 * fade,
          alpha: 0.92 * fade,
          cap: 'round',
        });

      // Sharp crimson/rose thorns jutting along each vine
      for (let t = -1; t <= 1; t += 2) {
        const tx = hx + cosA * (span * 0.42 * t);
        const ty = hy + sinA * (span * 0.42 * t);
        const thornDir = t * (v % 2 === 0 ? 1 : -1);
        const tipX = tx + perpX * 6.5 * thornDir + cosA * 2.5 * t;
        const tipY = ty + perpY * 6.5 * thornDir + sinA * 2.5 * t;
        g.moveTo(tx - cosA * 2.2, ty - sinA * 2.2)
          .lineTo(tipX, tipY)
          .lineTo(tx + cosA * 2.2, ty + sinA * 2.2)
          .closePath()
          .fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.92 * fade })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.2, alpha: 0.75 * fade });
      }
    }

    // Small emerald leaves & a central blooming rosebud
    for (let l = 0; l < 4; l++) {
      const la = seedRot + (l * Math.PI) / 2 + 0.35;
      const lx = hx + Math.cos(la) * (rPx * 0.45);
      const ly = hy + Math.sin(la) * (rPx * 0.45);
      const m = new PIXI.Matrix();
      m.rotate(la);
      m.translate(lx, ly);
      g.setTransform(m);
      g.moveTo(0, 0)
        .lineTo(4.5, -2.5)
        .lineTo(8.5, 0)
        .lineTo(4.5, 2.5)
        .closePath()
        .fill({ color: PALETTE.MINT_GREEN, alpha: 0.88 * fade })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.2, alpha: 0.7 * fade });
    }
    g.setTransform(new PIXI.Matrix());

    // Center rosebud diamond
    const budSize = 4.8 * fade;
    g.moveTo(hx, hy - budSize)
      .lineTo(hx + budSize, hy)
      .lineTo(hx, hy + budSize)
      .lineTo(hx - budSize, hy)
      .closePath()
      .fill({ color: PALETTE.BLUSH_ROSE, alpha: 0.95 * fade })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5, alpha: 0.8 * fade });
  }

  /**
   * Dash Strike Burst visual effect:
   * Directional wind-slash crescents, 8-point starburst lances, and flying shards (no simple circle).
   */
  private static drawDashStrikeBurst(
    g: PIXI.Graphics,
    fx: SimVisualEffect,
    progress: number,
    fade: number
  ): void {
    const cx = fx.x * PPU;
    const cy = fx.y * PPU;
    const maxR = fx.radius * PPU;
    const easeOut = 1 - Math.pow(1 - progress, 2.2);
    const r = maxR * (0.35 + 0.75 * easeOut);

    // 8-point starburst of sharp lances radiating outward
    const spikes = 8;
    for (let i = 0; i < spikes; i++) {
      const a = fx.angle + (i * Math.PI * 2) / spikes + progress * 0.35;
      const isMajor = i % 2 === 0;
      const innerR = r * (0.18 + 0.35 * progress);
      const outerR = r * (isMajor ? 1.12 : 0.78);
      const halfSpread = isMajor ? 0.14 : 0.09;

      const xIn = cx + Math.cos(a) * innerR;
      const yIn = cy + Math.sin(a) * innerR;
      const xTip = cx + Math.cos(a) * outerR;
      const yTip = cy + Math.sin(a) * outerR;
      const midR = (innerR + outerR) * 0.48;
      const xL = cx + Math.cos(a - halfSpread) * midR;
      const yL = cy + Math.sin(a - halfSpread) * midR;
      const xR = cx + Math.cos(a + halfSpread) * midR;
      const yR = cy + Math.sin(a + halfSpread) * midR;

      g.moveTo(xIn, yIn)
        .lineTo(xL, yL)
        .lineTo(xTip, yTip)
        .lineTo(xR, yR)
        .closePath()
        .fill({
          color: isMajor ? fx.color : PALETTE.BUTTER_YELLOW,
          alpha: (isMajor ? 0.88 : 0.75) * fade,
        })
        .stroke({
          color: PALETTE.INK_OUTLINE,
          width: 1.6 * fade,
          alpha: 0.75 * fade,
        });
    }

    // Directional wind-slash crescent blades along dash angle
    for (let w = -1; w <= 1; w += 2) {
      const arcAngle = fx.angle + w * 0.45;
      const arcR = r * 0.86;
      const ax0 = cx + Math.cos(arcAngle - 0.55) * (arcR * 0.75);
      const ay0 = cy + Math.sin(arcAngle - 0.55) * (arcR * 0.75);
      const axMid = cx + Math.cos(arcAngle) * (arcR * 1.15);
      const ayMid = cy + Math.sin(arcAngle) * (arcR * 1.15);
      const ax1 = cx + Math.cos(arcAngle + 0.55) * (arcR * 0.75);
      const ay1 = cy + Math.sin(arcAngle + 0.55) * (arcR * 0.75);

      g.moveTo(ax0, ay0)
        .quadraticCurveTo(axMid, ayMid, ax1, ay1)
        .stroke({
          color: PALETTE.CREAM_WHITE,
          width: 3.2 * fade,
          alpha: 0.88 * fade,
          cap: 'round',
        });
    }
  }

  /**
   * Aegis Orb activation burst:
   * Expanding hexagonal crystalline rune ward with 6 flying shield crests (no simple circle).
   */
  private static drawAegisActivationBurst(
    g: PIXI.Graphics,
    fx: SimVisualEffect,
    progress: number,
    fade: number
  ): void {
    const cx = fx.x * PPU;
    const cy = fx.y * PPU;
    const easeOut = 1 - Math.pow(1 - progress, 2.0);
    const r = fx.radius * PPU * (0.42 + 0.65 * easeOut);
    const rot = progress * 0.9;

    // Outer & inner rotating hexagonal ward lines
    for (let layer = 0; layer < 2; layer++) {
      const polyR = r * (layer === 0 ? 1.0 : 0.64);
      const layerRot = layer === 0 ? rot : -rot;
      for (let i = 0; i < 6; i++) {
        const a = layerRot + (i * Math.PI) / 3;
        const px = cx + Math.cos(a) * polyR;
        const py = cy + Math.sin(a) * polyR;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath().stroke({
        color: layer === 0 ? PALETTE.SKY_BLUE : PALETTE.MINT_GREEN,
        width: (layer === 0 ? 3.2 : 2.0) * fade,
        alpha: 0.88 * fade,
      });
    }

    // 6 crystalline shield crests at the hexagon vertices
    for (let i = 0; i < 6; i++) {
      const a = rot + (i * Math.PI) / 3;
      const vx = cx + Math.cos(a) * r;
      const vy = cy + Math.sin(a) * r;
      const s = 5.5 * fade;
      g.moveTo(vx, vy - s)
        .lineTo(vx + s * 0.8, vy)
        .lineTo(vx, vy + s)
        .lineTo(vx - s * 0.8, vy)
        .closePath()
        .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.92 * fade })
        .stroke({ color: PALETTE.SKY_BLUE, width: 1.8 * fade, alpha: 0.9 * fade });
    }
  }

  /**
   * Pretty Spore Pop Gas Cloud visual effect (replaces simple circle):
   * Multi-layered billowing botanical spore puffs, curling emerald/chartreuse gas tendrils,
   * and rising luminescent spore bubbles without any hard outer circle border.
   */
  private static drawSporePopGasCloud(
    g: PIXI.Graphics,
    cx: number,
    cy: number,
    baseR: number,
    progress: number,
    fade: number,
    seedId: number,
    elapsedSeconds: number
  ): void {
    const baseRot = (seedId * 1.73) % (Math.PI * 2);
    const drift = elapsedSeconds * 1.4;

    // 1. Billowing multi-lobed organic gas puffs (no outer circle!)
    const puffCount = 7;
    for (let i = 0; i < puffCount; i++) {
      const a = baseRot + (i / puffCount) * Math.PI * 2 + Math.sin(drift + i) * 0.22;
      const radialBreath = 0.42 + 0.18 * Math.sin(elapsedSeconds * 2.8 + i * 1.7) + progress * 0.18;
      const dist = baseR * radialBreath;
      const px = cx + Math.cos(a) * dist;
      const py = cy + Math.sin(a) * (dist * 0.82) - progress * 5;
      const puffRx = baseR * (0.46 + (i % 3) * 0.08) * (0.85 + 0.15 * fade);
      const puffRy = puffRx * 0.78;
      const puffColor = i % 3 === 0 ? 0x10b981 : i % 3 === 1 ? PALETTE.MINT_GREEN : 0x84cc16;

      g.ellipse(px, py, puffRx, puffRy).fill({
        color: puffColor,
        alpha: 0.22 * fade,
      });
    }

    // 2. Central dense toxic-mint core mist
    for (let c = 0; c < 3; c++) {
      const ca = -drift * 1.2 + (c * Math.PI * 2) / 3;
      const cxOff = cx + Math.cos(ca) * (baseR * 0.22);
      const cyOff = cy + Math.sin(ca) * (baseR * 0.18);
      g.ellipse(cxOff, cyOff, baseR * 0.44, baseR * 0.34).fill({
        color: c === 0 ? 0xa3e635 : PALETTE.MINT_GREEN,
        alpha: 0.26 * fade,
      });
    }

    // 3. Swirling S-curved noxious spore vapor tendrils curling through the cloud
    const tendrilCount = 4;
    for (let t = 0; t < tendrilCount; t++) {
      const ta = baseRot + drift * 0.8 + (t * Math.PI) / 2;
      const cosA = Math.cos(ta);
      const sinA = Math.sin(ta);
      const perpX = -sinA;
      const perpY = cosA;
      const rIn = baseR * 0.15;
      const rOut = baseR * 0.82;
      const wave = baseR * 0.28 * (t % 2 === 0 ? 1 : -1);

      g.moveTo(cx + cosA * rIn, cy + sinA * rIn)
        .bezierCurveTo(
          cx + cosA * (baseR * 0.38) + perpX * wave,
          cy + sinA * (baseR * 0.38) + perpY * wave,
          cx + cosA * (baseR * 0.64) - perpX * wave * 0.7,
          cy + sinA * (baseR * 0.64) - perpY * wave * 0.7,
          cx + cosA * rOut,
          cy + sinA * rOut
        )
        .stroke({
          color: t % 2 === 0 ? PALETTE.MINT_GREEN : 0xd9f99d,
          width: 3.0 * fade,
          alpha: 0.55 * fade,
          cap: 'round',
        });
    }

    // 4. Floating luminescent spore bubbles & rising pollen motes
    const bubbleCount = 6;
    for (let b = 0; b < bubbleCount; b++) {
      const bCycle = (elapsedSeconds * 1.6 + seedId * 0.31 + b / bubbleCount) % 1;
      const bFade = Math.sin(bCycle * Math.PI) * fade;
      const ba = baseRot + (b / bubbleCount) * Math.PI * 2 + bCycle * 0.6;
      const br = baseR * (0.25 + (b % 3) * 0.22);
      const bx = cx + Math.cos(ba) * br;
      const by = cy + Math.sin(ba) * (br * 0.75) - bCycle * 14;
      const bRad = (2.8 + (b % 2) * 1.6) * (0.7 + 0.3 * fade);

      g.circle(bx, by, bRad)
        .fill({
          color: b % 2 === 0 ? 0xd9f99d : PALETTE.MINT_GREEN,
          alpha: 0.85 * bFade,
        })
        .stroke({
          color: 0x065f46,
          width: 1.2,
          alpha: 0.65 * bFade,
        });
    }
  }
}
