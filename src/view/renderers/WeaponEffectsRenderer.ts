import * as PIXI from 'pixi.js';
import { PALETTE, POWER_UPS } from '../../content/data/catalog';
import { clamp, lerp } from '../../core/math/vec2';
import type { SimVisualEffect, Simulation } from '../../sim/Simulation';
import { PPU } from './EnvironmentRenderer';
import {
  drawGardenBladeEffect,
  drawArbaleteLineEffect,
  drawArbaleteBoltProjectile,
  drawBloomHammerEffect,
  drawSeedBladeProjectile,
  drawPiercingSlashProjectile,
  drawPetalOrbitEffect,
  drawChainLightningEffect,
  drawThornTrailHazard,
  drawSporePopGasCloud,
} from './weapons';

/**
 * Renders Ground Hazards, Pickups, Orbiting Petals, Weapon Visual Effects,
 * Persona step effects, Hero buffs & heals, and Projectiles.
 * Individual weapon effects are delegated to weapon renderers in `./weapons/`.
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
        drawThornTrailHazard(
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
        drawSporePopGasCloud(
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

    // 1. Orbiting Sakura Leaves / Petals (delegated to PetalOrbitRenderer)
    drawPetalOrbitEffect(g, sim, hx, hy);

    // 2. Transient Visual Effects
    for (const fx of sim.visualEffects) {
      const progress = clamp(1 - fx.timer / fx.maxTimer, 0, 1);
      const fade = 1 - progress;

      if (fx.kind === 'slash_arc') {
        drawGardenBladeEffect(g, fx, fade);
      } else if (fx.kind === 'spear_line') {
        drawArbaleteLineEffect(g, fx, progress, fade);
      } else if (fx.kind === 'bloom_hammer') {
        drawBloomHammerEffect(g, fx, progress);
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
      } else if (fx.kind === 'crit_starfall') {
        WeaponEffectsRenderer.drawCritStarfall(g, fx, progress, fade);
      } else if (fx.kind === 'brute_slam_flash') {
        const cx = fx.x * PPU;
        const cy = fx.y * PPU;
        const maxR = fx.radius * PPU;
        const easeOut = 1 - Math.pow(1 - progress, 2.4);
        const r = maxR * (0.42 + 0.58 * easeOut);
        const initialFlash = clamp(1 - progress / 0.38, 0, 1);

        // Final flash core burst on attack impact
        if (initialFlash > 0) {
          g.circle(cx, cy, maxR * (0.65 + 0.35 * (1 - initialFlash)))
            .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.72 * initialFlash })
            .stroke({ color: PALETTE.BUTTER_YELLOW, width: 5 * initialFlash, alpha: 0.95 * initialFlash });
        }

        // Expanding seismic impact ring
        g.circle(cx, cy, r)
          .fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.24 * fade })
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 4.5 * fade, alpha: 0.92 * fade });
        g.circle(cx, cy, r * 0.76).stroke({
          color: PALETTE.CRIMSON_WARN,
          width: 2.8 * fade,
          alpha: 0.85 * fade,
        });

        // 8 radial impact flash spikes
        for (let i = 0; i < 8; i++) {
          const a = fx.angle + (i * Math.PI) / 4;
          const rIn = r * 0.35;
          const rOut = r * 1.12;
          g.moveTo(cx + Math.cos(a) * rIn, cy + Math.sin(a) * rIn)
            .lineTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut)
            .stroke({
              color: i % 2 === 0 ? PALETTE.CREAM_WHITE : PALETTE.BUTTER_YELLOW,
              width: 3.2 * fade,
              alpha: 0.9 * fade,
              cap: 'round',
            });
        }
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
        drawSporePopGasCloud(
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
        drawChainLightningEffect(g, fx, fade);
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
   * Renders a Celestial Starfall effect when Crit Burst procs!
   * Falling golden-arcane shooting stars streak diagonally from the heavens and burst into
   * radiant 4-point star flares and constellation shards across the AoE.
   */
  public static drawCritStarfall(
    g: PIXI.Graphics,
    fx: SimVisualEffect,
    progress: number,
    fade: number
  ): void {
    const cx = fx.x * PPU;
    const cy = fx.y * PPU;
    const maxR = fx.radius * PPU;
    const lv = clamp(Math.round(fx.arcRad), 1, 3);
    const starCount = 3 + lv;

    const drawFourPointStar = (
      sx: number,
      sy: number,
      outerR: number,
      innerR: number,
      rot: number,
      col: number,
      alphaVal: number
    ) => {
      for (let i = 0; i < 8; i++) {
        const a = rot + (i * Math.PI) / 4;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = sx + Math.cos(a) * r;
        const py = sy + Math.sin(a) * r;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath()
        .fill({ color: col, alpha: alphaVal })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 * fade, alpha: alphaVal * 0.85 });
    };

    // 1. Falling Shooting Stars streaking down from the sky in staggered cascade
    for (let s = 0; s < starCount; s++) {
      const stagger = s * (0.38 / starCount);
      const localT = clamp((progress - stagger) / (1 - stagger * 0.7), 0, 1);
      if (localT <= 0) continue;

      const seedAngle = fx.angle + (s / starCount) * Math.PI * 2 + fx.id * 0.7;
      const offsetDist = s === 0 ? 0 : maxR * (0.32 + (s % 2) * 0.26);
      const landX = cx + Math.cos(seedAngle) * offsetDist;
      const landY = cy + Math.sin(seedAngle) * (offsetDist * 0.75);

      const fallPhase = clamp(localT / 0.52, 0, 1);
      const impactPhase = clamp((localT - 0.45) / 0.55, 0, 1);

      if (fallPhase < 1) {
        const skyStartX = landX + 52;
        const skyStartY = landY - 145;
        const headX = lerp(skyStartX, landX, fallPhase);
        const headY = lerp(skyStartY, landY, fallPhase);
        const tailFrac = Math.max(0, fallPhase - 0.35);
        const tailX = lerp(skyStartX, landX, tailFrac);
        const tailY = lerp(skyStartY, landY, tailFrac);

        // Luminous shooting-star comet tail
        g.moveTo(tailX, tailY)
          .lineTo(headX, headY)
          .stroke({
            color: s % 2 === 0 ? PALETTE.GOLD_STAR : PALETTE.SKY_BLUE,
            width: 6.5,
            alpha: 0.65 * (1 - fallPhase * 0.2),
            cap: 'round',
          });
        g.moveTo(tailX, tailY)
          .lineTo(headX, headY)
          .stroke({
            color: PALETTE.CREAM_WHITE,
            width: 2.6,
            alpha: 0.95,
            cap: 'round',
          });

        // Falling 4-point star head
        drawFourPointStar(
          headX,
          headY,
          10.5,
          3.6,
          fallPhase * 4.5 + s,
          PALETTE.BUTTER_YELLOW,
          0.98
        );
      }

      // 2. Ground Starburst Impact when each shooting star strikes
      if (impactPhase > 0) {
        const impFade = 1 - impactPhase;
        const burstR = (s === 0 ? maxR * 0.68 : maxR * 0.42) * (0.35 + 0.65 * impactPhase);

        // Starburst cross rays at impact site
        for (let ray = 0; ray < 4; ray++) {
          const ra = (ray * Math.PI) / 4 + s * 0.4;
          g.moveTo(landX - Math.cos(ra) * burstR, landY - Math.sin(ra) * burstR)
            .lineTo(landX + Math.cos(ra) * burstR, landY + Math.sin(ra) * burstR)
            .stroke({
              color: ray % 2 === 0 ? PALETTE.GOLD_STAR : PALETTE.CREAM_WHITE,
              width: (s === 0 ? 3.2 : 2.2) * impFade,
              alpha: 0.9 * impFade,
              cap: 'round',
            });
        }

        drawFourPointStar(
          landX,
          landY,
          (s === 0 ? 13 : 9) * impFade,
          (s === 0 ? 4.2 : 3.0) * impFade,
          impactPhase * 2.2 + s,
          s % 2 === 0 ? PALETTE.GOLD_STAR : PALETTE.BUTTER_YELLOW,
          0.92 * impFade
        );
      }
    }
  }

  /**
   * Renders a delicate Lucky Clover footstep decal behind the hero (Lv 1–5).
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

    const popScale = progress < 0.16 ? progress / 0.16 : 1 - (progress - 0.16) * 0.22;
    const baseR = fx.radius * PPU * popScale;
    const baseAlpha = clamp((0.42 + lv * 0.09) * fade, 0.08, 0.92);

    const drawSingleClover = (
      ox: number,
      oy: number,
      cloverR: number,
      rotAngle: number,
      leaves: number,
      withVeins: boolean
    ) => {
      // Curved botanical stem first so leaves sit cleanly on top
      const stemAngle = rotAngle + Math.PI * 0.72;
      const stemLen = cloverR * 1.15;
      decalGraphic
        .moveTo(ox, oy)
        .quadraticCurveTo(
          ox + Math.cos(stemAngle - 0.3) * (stemLen * 0.55),
          oy + Math.sin(stemAngle - 0.3) * (stemLen * 0.55),
          ox + Math.cos(stemAngle) * stemLen,
          oy + Math.sin(stemAngle) * stemLen
        )
        .stroke({
          color: 0x047857,
          width: Math.max(1.2, cloverR * 0.22),
          alpha: baseAlpha,
          cap: 'round',
        });

      // Heart-cleft clover leaflets (formed by two angled lobes per leaflet)
      const leafDist = cloverR * 0.56;
      const lobeR = cloverR * 0.34;
      for (let i = 0; i < leaves; i++) {
        const a = rotAngle + (i / leaves) * Math.PI * 2;
        const lx = ox + Math.cos(a) * leafDist;
        const ly = oy + Math.sin(a) * leafDist;
        const perpX = -Math.sin(a);
        const perpY = Math.cos(a);
        const lobeSpread = cloverR * 0.16;
        const leafCol = i % 2 === 0 ? PALETTE.MINT_GREEN : 0x10b981;

        for (const side of [-1, 1] as const) {
          decalGraphic
            .circle(lx + perpX * lobeSpread * side, ly + perpY * lobeSpread * side, lobeR)
            .fill({ color: leafCol, alpha: baseAlpha })
            .stroke({
              color: PALETTE.INK_OUTLINE,
              width: 1.1,
              alpha: baseAlpha * 0.82,
            });
        }

        if (withVeins) {
          decalGraphic
            .moveTo(ox + Math.cos(a) * (cloverR * 0.12), oy + Math.sin(a) * (cloverR * 0.12))
            .lineTo(lx + Math.cos(a) * (cloverR * 0.14), ly + Math.sin(a) * (cloverR * 0.14))
            .stroke({
              color: 0xd1fae5,
              width: 1.0,
              alpha: baseAlpha * 0.9,
              cap: 'round',
            });
        }
      }
    };

    // Primary compact clover
    drawSingleClover(cx, cy, baseR, fx.angle, lv >= 2 ? 4 : 3, lv >= 2);

    // Lv 3+: Companion miniature clover sprouts beside the main step
    if (lv >= 3) {
      const subAngle1 = fx.angle + 2.15;
      const subDist1 = baseR * 1.38;
      drawSingleClover(
        cx + Math.cos(subAngle1) * subDist1,
        cy + Math.sin(subAngle1) * subDist1,
        baseR * 0.62,
        fx.angle - 0.6,
        3,
        lv >= 4
      );
    }
    if (lv >= 4) {
      const subAngle2 = fx.angle - 1.95;
      const subDist2 = baseR * 1.28;
      drawSingleClover(
        cx + Math.cos(subAngle2) * subDist2,
        cy + Math.sin(subAngle2) * subDist2,
        baseR * 0.54,
        fx.angle + 0.85,
        4,
        true
      );
    }

    // Lv 3+: Tiny rising emerald-mint luck sparkles & star glints that drift upward and vanish
    if (lv >= 3) {
      const sparkleCount = lv - 1;
      for (let s = 0; s < sparkleCount; s++) {
        const sa = fx.id * 1.37 + (s * Math.PI * 2) / sparkleCount;
        const sx = cx + Math.cos(sa) * (baseR * (0.65 + (s % 2) * 0.45));
        const sy = cy + Math.sin(sa) * (baseR * 0.4) - progress * (10 + s * 4.5);
        const spSize = (2.2 + (lv >= 5 ? 1.1 : 0.4)) * fade;

        // Crisp 4-point mint-emerald star glint
        decalGraphic
          .moveTo(sx - spSize, sy)
          .lineTo(sx + spSize, sy)
          .moveTo(sx, sy - spSize)
          .lineTo(sx, sy + spSize)
          .stroke({
            color: s % 2 === 0 ? 0xa7f3d0 : PALETTE.MINT_GREEN,
            width: 1.4,
            alpha: baseAlpha * 0.95,
            cap: 'round',
          });
      }
    }
  }

  /**
   * Renders disappearing Arcana Persona footsteps behind the character:
   * - zagreus_fire_step: Losti Seige compact cinder-ember footprint fitted to the hero's feet
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
      // Losti Seige: Smaller, boot-fitted cinder-ember footprint ellipse
      const m = new PIXI.Matrix();
      m.rotate(fx.angle);
      m.translate(cx, cy);
      decalGraphic.setTransform(m);

      // Compact boot-sole ember print
      decalGraphic
        .ellipse(0, 0, r * 0.65, r * 0.34)
        .fill({ color: 0xf43f5e, alpha: 0.78 * fade })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.4 * fade, alpha: 0.8 * fade });

      // Inner warm ember-gold core
      decalGraphic
        .ellipse(r * 0.08, 0, r * 0.4, r * 0.2)
        .fill({ color: 0xf97316, alpha: 0.9 * fade });
      decalGraphic
        .ellipse(r * 0.14, 0, r * 0.22, r * 0.11)
        .fill({ color: 0xfbbf24, alpha: 0.95 * fade });

      decalGraphic.setTransform(new PIXI.Matrix());

      // Delicate rising cinder sparks
      for (let i = 0; i < 2; i++) {
        const seedA = fx.id * 1.3 + i * 2.4;
        const fxX = cx + Math.cos(seedA) * (r * 0.32);
        const fxY = cy + Math.sin(seedA) * (r * 0.18) - progress * (12 + i * 5);
        const flameR = (2.6 - i * 0.5) * fade;
        fxGraphic
          .circle(fxX, fxY, flameR)
          .fill({ color: i === 0 ? 0xf43f5e : 0xfbbf24, alpha: 0.85 * fade });
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
        drawArbaleteBoltProjectile(g, p, px, py, rPx, angle);
      } else if (p.weaponTags.includes('slash')) {
        drawPiercingSlashProjectile(g, p, px, py, rPx, angle);
      } else {
        drawSeedBladeProjectile(g, p, sim, px, py, rPx, angle);
      }
    }
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
}
