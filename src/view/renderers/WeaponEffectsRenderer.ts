import * as PIXI from 'pixi.js';
import { PALETTE } from '../../content/data/catalog';
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
import {
  pickupRegistry,
  drawAegisBurstEffect,
  drawEmberBurstEffect,
  drawShockwaveBlastEffect,
  drawSecondWindBlastEffect,
  drawDashStrikeBurstEffect,
  drawCritStarfallEffect,
  drawLuckyCloverStepEffect,
  drawHeroHealPulseEffect,
} from './items';

/**
 * Renders Ground Hazards, Pickups, Orbiting Petals, Weapon Visual Effects,
 * Persona step effects, Hero buffs & heals, and Projectiles.
 * Individual weapon effects are delegated to `./weapons/` and item effects to `./items/`.
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
    sim: Simulation,
    pickupSpriteContainer?: PIXI.Container,
    pickupSpritePool?: PIXI.Sprite[]
  ): void {
    const g = pickupGraphic;
    const bob = Math.sin(sim.elapsedSeconds * 5) * 2.5;
    let usedSprites = 0;

    const acquireSprite =
      pickupSpriteContainer && pickupSpritePool
        ? (tex: PIXI.Texture): PIXI.Sprite => {
            let spr = pickupSpritePool[usedSprites];
            if (!spr) {
              spr = new PIXI.Sprite(tex);
              pickupSpritePool.push(spr);
              pickupSpriteContainer.addChild(spr);
            } else {
              spr.texture = tex;
            }
            spr.visible = true;
            usedSprites++;
            return spr;
          }
        : undefined;

    for (const p of sim.pickups) {
      const px = p.x * PPU;
      const py = p.y * PPU + bob;

      // Strategy pattern: dispatch via pickupRegistry without if/else ladders
      const renderer = pickupRegistry.findForPickup(p);
      if (renderer) {
        renderer.draw({ g, pickup: p, sim, px, py, acquireSprite });
      }
    }

    if (pickupSpritePool) {
      for (let i = usedSprites; i < pickupSpritePool.length; i++) {
        pickupSpritePool[i]!.visible = false;
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
        drawShockwaveBlastEffect(g, fx, progress, fade);
      } else if (fx.kind === 'second_wind_blast') {
        drawSecondWindBlastEffect(g, fx, progress, fade);
      } else if (fx.kind === 'ember_burst') {
        drawEmberBurstEffect(g, fx, progress, fade);
      } else if (fx.kind === 'clover_step') {
        drawLuckyCloverStepEffect(decalGraphic, fx, progress, fade);
      } else if (
        fx.kind === 'zagreus_fire_step' ||
        fx.kind === 'void_soul_step' ||
        fx.kind === 'alchemy_rune_step' ||
        fx.kind === 'godspeed_lightning_step'
      ) {
        WeaponEffectsRenderer.drawPersonaStepEffect(decalGraphic, g, fx, progress, fade);
      } else if (fx.kind === 'heal_pulse') {
        drawHeroHealPulseEffect(g, fx, hx, hy, progress, fade);
      } else if (fx.kind === 'dash_strike_burst') {
        drawDashStrikeBurstEffect(g, fx, progress, fade);
      } else if (fx.kind === 'aegis_burst') {
        drawAegisBurstEffect(g, fx, progress, fade);
      } else if (fx.kind === 'crit_starfall') {
        drawCritStarfallEffect(g, fx, progress, fade);
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

  // Preserve backwards-compatible static methods
  public static drawHeroHealPulse = drawHeroHealPulseEffect;
  public static drawCritStarfall = drawCritStarfallEffect;
  public static drawLuckyCloverStep = drawLuckyCloverStepEffect;

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
}
