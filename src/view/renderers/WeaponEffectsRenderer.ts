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
      const fade = clamp(h.lifeTimer / 1.0, 0.2, 0.85);
      decalGraphic
        .circle(hx, hy, rPx)
        .fill({ color: h.color, alpha: 0.22 * fade })
        .stroke({ color: h.color, width: 2, alpha: 0.65 * fade });
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
          g.arc(px, py - 0.5, 4.5, 0, Math.PI, false).stroke({
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

    // 1. Orbiting Petals
    const petalCount = sim.getOrbitPetalCount();
    if (petalCount > 0) {
      const petalWpn = sim.weapons.find((w) => w.id === 'petal_orbit');
      const evolved = Boolean(petalWpn?.evolved);
      const orbitR = sim.getOrbitRadiusU() * PPU;
      const col = evolved ? PALETTE.LILAC_ARCANE : PALETTE.BLUSH_ROSE;

      for (let i = 0; i < petalCount; i++) {
        const a = sim.bonusOrbitAngle + (i / petalCount) * Math.PI * 2;
        const px = hx + Math.cos(a) * orbitR;
        const py = hy + Math.sin(a) * orbitR;

        const wispA = a - 0.16;
        const wx = hx + Math.cos(wispA) * orbitR;
        const wy = hy + Math.sin(wispA) * orbitR;
        g.circle(wx, wy, 4.2).fill({
          color: PALETTE.CREAM_WHITE,
          alpha: 0.35,
        });

        g.circle(px, py, 9.5)
          .fill({ color: col })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
        g.circle(px - 2.2, py - 2.2, 3.2).fill({
          color: PALETTE.CREAM_WHITE,
          alpha: 0.9,
        });
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
        const x1 = fx.x * PPU;
        const y1 = fx.y * PPU;
        const x2 = fx.targetX * PPU;
        const y2 = fx.targetY * PPU;
        g.moveTo(x1, y1)
          .lineTo(x2, y2)
          .stroke({
            color: fx.color,
            width: fx.radius * PPU * fade,
            alpha: 0.8 * fade,
            cap: 'round',
          });
        g.moveTo(x1, y1)
          .lineTo(x2, y2)
          .stroke({
            color: PALETTE.CREAM_WHITE,
            width: 4 * fade,
            alpha: 0.95 * fade,
            cap: 'round',
          });

        // Visible doubled parallel twin lance when Echo Swing triggers!
        if (fx.isEcho) {
          const perpX = -Math.sin(fx.angle) * 10;
          const perpY = Math.cos(fx.angle) * 10;
          g.moveTo(x1 + perpX, y1 + perpY)
            .lineTo(x2 + perpX, y2 + perpY)
            .stroke({
              color: PALETTE.BUTTER_YELLOW,
              width: fx.radius * PPU * 0.75 * fade,
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
      } else if (fx.kind === 'heal_pulse') {
        WeaponEffectsRenderer.drawHeroHealPulse(g, fx, hx, hy, progress, fade);
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
        const baseR = fx.radius * PPU * (0.55 + 0.45 * Math.sin(progress * Math.PI * 0.5));
        g.circle(cx, cy, baseR)
          .fill({ color: PALETTE.MINT_GREEN, alpha: 0.24 * fade })
          .stroke({ color: PALETTE.MINT_GREEN, width: 3 * fade, alpha: 0.72 * fade });
        for (let p = 0; p < 5; p++) {
          const pa = (p * Math.PI * 2) / 5 + progress * 2.4;
          const pr = baseR * 0.55;
          const px = cx + Math.cos(pa) * pr;
          const py = cy + Math.sin(pa) * pr;
          g.circle(px, py, baseR * 0.42 * fade).fill({
            color: p % 2 === 0 ? PALETTE.MINT_GREEN : PALETTE.BUTTER_YELLOW,
            alpha: 0.28 * fade,
          });
        }
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
          g.moveTo(rPx * 1.45, 0)
            .lineTo(-rPx * 0.6, -rPx * 0.85)
            .lineTo(-rPx * 1.15, 0)
            .lineTo(-rPx * 0.6, rPx * 0.85)
            .closePath()
            .setTransform(m)
            .fill({ color: 0x78350f })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
          g.moveTo(rPx * 0.9, 0)
            .lineTo(-rPx * 0.7, 0)
            .setTransform(m)
            .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.2, cap: 'round' });
          g.setTransform(new PIXI.Matrix());
        } else if (p.projectileKind === 'sunflower_leaf') {
          // Spinning Razor Sunflower Leaf projectile
          const spinAngle = angle + sim.elapsedSeconds * 12;
          const m = new PIXI.Matrix();
          m.rotate(spinAngle);
          m.translate(px, py);
          g.ellipse(0, 0, rPx * 1.45, rPx * 0.72)
            .setTransform(m)
            .fill({ color: PALETTE.MINT_GREEN })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
          g.moveTo(-rPx * 1.1, 0)
            .lineTo(rPx * 1.1, 0)
            .setTransform(m)
            .stroke({ color: PALETTE.BUTTER_YELLOW, width: 1.8 });
          g.setTransform(new PIXI.Matrix());
        } else {
          g.circle(px, py, rPx)
            .fill({ color: p.color })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
          g.circle(px, py, rPx * 0.45).fill({ color: PALETTE.CREAM_WHITE });
        }
      } else {
        const tipX = px + Math.cos(angle) * (rPx * 1.4);
        const tipY = py + Math.sin(angle) * (rPx * 1.4);
        const tailX = px - Math.cos(angle) * (rPx * 1.2);
        const tailY = py - Math.sin(angle) * (rPx * 1.2);
        const perpX = -Math.sin(angle) * (rPx * 0.75);
        const perpY = Math.cos(angle) * (rPx * 0.75);

        g.moveTo(tipX, tipY)
          .lineTo(px + perpX, py + perpY)
          .lineTo(tailX, tailY)
          .lineTo(px - perpX, py - perpY)
          .closePath()
          .fill({ color: p.color })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
      }
    }
  }
}
