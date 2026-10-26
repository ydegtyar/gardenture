import * as PIXI from 'pixi.js';
import { PALETTE } from '../../content/data/catalog';
import { clamp, lerp } from '../../core/math/vec2';
import type { SimEnemy, Simulation } from '../../sim/Simulation';
import { PPU } from './EnvironmentRenderer';

/**
 * Renders all enemy archetypes, Big Arena Flowers, destructible Hero Graves,
 * Spitter mouth & cheek firing animation, Dasher charge indicator,
 * Golden Sunflower 3-mode telegraphs & yellow charging arrow,
 * Frost Touch blue filter, Petal Orbit spider-web glue, and dropping/regrowing Poison Drop icon.
 */
export class EnemyRenderer {
  public static drawEnemies(
    enemyGraphic: PIXI.Graphics,
    telegraphGraphic: PIXI.Graphics,
    sim: Simulation,
    alpha: number
  ): void {
    const g = enemyGraphic;

    for (const e of sim.enemies) {
      const ex = lerp(e.prevX, e.x, alpha) * PPU;
      const ey = lerp(e.prevY, e.y, alpha) * PPU;
      const rPx = e.radius * PPU;
      const walkPhase = sim.elapsedSeconds * (e.speed * 4.2) + e.id * 1.7;
      const isMoving =
        e.aiState === 'seek' ||
        e.aiState === 'charge' ||
        (e.isSpecial && e.specialId === 'golden_beast');
      const bobY = isMoving ? Math.abs(Math.sin(walkPhase)) * -3.0 : 0;

      // Ground contact shadow
      g.ellipse(ex, ey + rPx * 0.68, rPx * 0.92, rPx * 0.46).fill({
        color: 0x0f131d,
        alpha: 0.36,
      });

      // Stationary Big Arena Flower
      if (e.isArenaFlower) {
        EnemyRenderer.drawArenaFlowerModel(g, e, ex, ey, rPx, sim.elapsedSeconds);
        continue;
      }

      // Stationary Hero Grave (left behind by Second Wind or Hero Death)
      if (e.isHeroGrave) {
        EnemyRenderer.drawHeroGraveModel(g, e, ex, ey, rPx, sim.elapsedSeconds);
        continue;
      }

      // Draw Active Enemy Telegraphs
      if (e.aiState === 'telegraph') {
        const progress = clamp(1 - e.aiTimer / e.telegraphDuration, 0, 1);
        if (e.isSpecial && e.specialId === 'bloom_giant') {
          EnemyRenderer.drawSunflowerTelegraph(
            telegraphGraphic,
            e,
            ex,
            ey,
            rPx,
            progress,
            sim.elapsedSeconds
          );
        } else if (e.archetypeId === 'dasher') {
          EnemyRenderer.drawDasherChargeIndicator(
            telegraphGraphic,
            e,
            ex,
            ey,
            rPx,
            progress,
            sim.elapsedSeconds
          );
        } else {
          const slamRadiusPx = (e.isFinalBoss ? 2.3 : e.isMiniBoss ? 2.0 : 1.6) * PPU;
          const tx = e.telegraphTargetX * PPU;
          const ty = e.telegraphTargetY * PPU;
          telegraphGraphic
            .circle(tx, ty, slamRadiusPx)
            .fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.14 })
            .stroke({ color: PALETTE.CRIMSON_WARN, width: 2.5, alpha: 0.75 });
          telegraphGraphic
            .circle(tx, ty, slamRadiusPx * progress)
            .fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.32 });
        }
      }

      // Elite / Special / Boss base ring
      if (e.isElite || e.isSpecial || e.isMiniBoss || e.isFinalBoss) {
        const ringColor =
          e.isFinalBoss || e.isMiniBoss ? PALETTE.CRIMSON_WARN : PALETTE.GOLD_STAR;
        g.circle(ex, ey + rPx * 0.2, rPx + 6).stroke({
          color: ringColor,
          width: 2.5,
          alpha: 0.75,
        });
      }

      const isFrostTouched = e.slowTimer > 0 && e.webSlowTimer <= 0;
      const bodyColor =
        e.hitFlashTimer > 0
          ? PALETTE.CREAM_WHITE
          : e.freezeTimer > 0
            ? PALETTE.SKY_BLUE
            : isFrostTouched
              ? 0x93c5fd
              : e.burnTimer > 0
                ? 0xfb923c
                : e.color;
      const accentColor = e.hitFlashTimer > 0 ? PALETTE.CREAM_WHITE : e.accentColor;

      // Animated enemy legs beneath body
      if (e.archetypeId !== 'splitter') {
        EnemyRenderer.drawEnemyLegs(
          g,
          ex,
          ey,
          rPx,
          isMoving,
          walkPhase,
          e.facingAngle,
          accentColor
        );
      }

      const cy = ey + bobY;
      const cosA = Math.cos(e.facingAngle);
      const sinA = Math.sin(e.facingAngle);

      // Distinct silhouettes per archetype ( plus bespoke Golden Sunflower )
      if (e.isSpecial && e.specialId === 'bloom_giant') {
        EnemyRenderer.drawGoldenSunflowerModel(
          g,
          e,
          ex,
          cy,
          rPx,
          bodyColor,
          sim.elapsedSeconds
        );
      } else if (e.archetypeId === 'chaser') {
        g.circle(ex, cy, rPx)
          .fill({ color: bodyColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });

        const sproutSway = Math.sin(walkPhase) * 3;
        g.moveTo(ex, cy - rPx + 2)
          .lineTo(ex - 7 + sproutSway, cy - rPx - 9)
          .lineTo(ex, cy - rPx - 4)
          .lineTo(ex + 7 + sproutSway, cy - rPx - 9)
          .closePath()
          .fill({ color: accentColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
      } else if (e.archetypeId === 'dasher') {
        const tipX = ex + cosA * (rPx * 1.35);
        const tipY = cy + sinA * (rPx * 1.35);
        const backLeftX = ex + Math.cos(e.facingAngle + 2.4) * (rPx * 1.15);
        const backLeftY = cy + Math.sin(e.facingAngle + 2.4) * (rPx * 1.15);
        const backRightX = ex + Math.cos(e.facingAngle - 2.4) * (rPx * 1.15);
        const backRightY = cy + Math.sin(e.facingAngle - 2.4) * (rPx * 1.15);

        g.moveTo(tipX, tipY)
          .lineTo(backLeftX, backLeftY)
          .lineTo(ex - cosA * (rPx * 0.4), cy - sinA * (rPx * 0.4))
          .lineTo(backRightX, backRightY)
          .closePath()
          .fill({ color: bodyColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });

        g.circle(ex, cy, rPx * 0.42).fill({ color: accentColor });
      } else if (e.archetypeId === 'spitter') {
        // Spitter mouth & cheek animation when winding up or recoiling from firing a projectile!
        const isWindingUpToSpit = e.aiTimer < 0.55;
        const isSpitRecoil = e.aiTimer > 1.75;
        const windupNorm = isWindingUpToSpit ? clamp((0.55 - e.aiTimer) / 0.55, 0, 1) : 0;
        const recoilNorm = isSpitRecoil ? clamp((e.aiTimer - 1.75) / 0.45, 0, 1) : 0;

        for (let p = 0; p < 5; p++) {
          const pa = (p * Math.PI * 2) / 5 + sim.elapsedSeconds * 1.5;
          g.circle(ex + Math.cos(pa) * (rPx * 0.65), cy + Math.sin(pa) * (rPx * 0.65), rPx * 0.52)
            .fill({ color: accentColor })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
        }
        g.circle(ex, cy, rPx * 0.78)
          .fill({ color: bodyColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });

        // Swelling cheeks on both sides of the Spitter's face during windup/firing
        const cheekSwell = 1.0 + windupNorm * 0.85 + recoilNorm * 0.35;
        const perpX = -sinA;
        const perpY = cosA;
        const cheekForward = rPx * 0.28;
        const cheekSide = rPx * (0.48 + windupNorm * 0.14);
        const cheekRad = rPx * 0.24 * cheekSwell;

        for (const side of [-1, 1] as const) {
          const chX = ex + cosA * cheekForward + perpX * cheekSide * side;
          const chY = cy + sinA * cheekForward + perpY * cheekSide * side;
          g.circle(chX, chY, cheekRad)
            .fill({
              color: windupNorm > 0.2 ? PALETTE.BLUSH_ROSE : accentColor,
              alpha: 0.95,
            })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
        }

        // Animated puckered spitting mouth nozzle at front of Spitter
        const mouthReach = rPx * (0.55 + windupNorm * 0.22 + recoilNorm * 0.28);
        const mouthX = ex + cosA * mouthReach;
        const mouthY = cy + sinA * mouthReach;
        const mouthOuterR = rPx * (0.22 + windupNorm * 0.12 + recoilNorm * 0.16);
        const mouthInnerR = mouthOuterR * (0.48 + recoilNorm * 0.28);

        g.circle(mouthX, mouthY, mouthOuterR)
          .fill({ color: accentColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
        g.circle(mouthX + cosA * 1.5, mouthY + sinA * 1.5, mouthInnerR).fill({
          color: recoilNorm > 0.1 || windupNorm > 0.4 ? PALETTE.CRIMSON_WARN : PALETTE.INK_OUTLINE,
        });
      } else if (e.archetypeId === 'brute' || e.isMiniBoss || e.isFinalBoss) {
        g.roundRect(ex - rPx, cy - rPx * 0.92, rPx * 2, rPx * 1.84, rPx * 0.42)
          .fill({ color: bodyColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 3.5 });

        g.moveTo(ex - rPx * 0.65, cy - rPx * 0.8)
          .lineTo(ex - rPx * 0.95, cy - rPx * 1.35)
          .lineTo(ex - rPx * 0.25, cy - rPx * 0.9)
          .closePath()
          .fill({ color: accentColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
        g.moveTo(ex + rPx * 0.65, cy - rPx * 0.8)
          .lineTo(ex + rPx * 0.95, cy - rPx * 1.35)
          .lineTo(ex + rPx * 0.25, cy - rPx * 0.9)
          .closePath()
          .fill({ color: accentColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });

        if (e.isFinalBoss || e.isMiniBoss) {
          g.moveTo(ex - rPx * 0.4, cy - rPx * 0.9)
            .lineTo(ex - rPx * 0.25, cy - rPx * 1.45)
            .lineTo(ex, cy - rPx * 1.1)
            .lineTo(ex + rPx * 0.25, cy - rPx * 1.45)
            .lineTo(ex + rPx * 0.4, cy - rPx * 0.9)
            .closePath()
            .fill({ color: PALETTE.GOLD_STAR })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
        }
      } else if (e.archetypeId === 'shielded') {
        g.circle(ex, cy, rPx)
          .fill({ color: bodyColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });

        const shieldArc = Math.PI / 2.1;
        g.arc(ex, cy, rPx + 4, e.facingAngle - shieldArc, e.facingAngle + shieldArc).stroke({
          color: PALETTE.INK_OUTLINE,
          width: 8,
          cap: 'round',
        });
        g.arc(ex, cy, rPx + 4, e.facingAngle - shieldArc, e.facingAngle + shieldArc).stroke({
          color: PALETTE.CREAM_WHITE,
          width: 4.5,
          cap: 'round',
        });
      } else {
        const squash = Math.sin(walkPhase * 1.5) * 2.5;
        g.ellipse(ex, cy, rPx + squash, rPx - squash * 0.7)
          .fill({ color: bodyColor })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });
        g.circle(ex - rPx * 0.3, cy - rPx * 0.2, rPx * 0.25).fill({
          color: accentColor,
          alpha: 0.7,
        });
      }

      // Enemy eyes
      const eyeOffset = rPx * 0.32;
      const eyeX = ex + cosA * eyeOffset;
      const eyeY = cy - rPx * 0.1 + sinA * (eyeOffset * 0.6);
      const perpX = -sinA * (rPx * 0.26);
      const perpY = cosA * (rPx * 0.26);
      const eyeR = Math.max(2.0, rPx * 0.13);

      g.circle(eyeX + perpX, eyeY + perpY, eyeR).fill({ color: PALETTE.INK_OUTLINE });
      g.circle(eyeX - perpX, eyeY - perpY, eyeR).fill({ color: PALETTE.INK_OUTLINE });

      // Frost Touch slight blue filter overlay (shown ONLY when slowed by Frost Touch, not spider web!)
      if (isFrostTouched) {
        EnemyRenderer.drawFrostTouchFilter(g, ex, cy, rPx, sim.elapsedSeconds, e.id);
      }

      // Spider-Web Glue slow debuff (shown ONLY when snared by Petal Orbit / Petal Blossom!)
      if (e.webSlowTimer > 0) {
        EnemyRenderer.drawSpiderWebGlueDebuff(g, ex, cy, rPx, sim.elapsedSeconds, e.id);
      }

      // Storm Mark Debuff visual indicator
      if (e.stormMarkTimer > 0) {
        const pulse = 0.8 + 0.2 * Math.sin(sim.elapsedSeconds * 14);
        const rot = sim.elapsedSeconds * 3.5;

        g.circle(ex, cy, (rPx + 5) * pulse).stroke({
          color: PALETTE.SKY_BLUE,
          width: 2.2,
          alpha: 0.85,
        });

        for (let s = 0; s < 3; s++) {
          const sa = rot + (s * Math.PI * 2) / 3;
          const sx = ex + Math.cos(sa) * (rPx + 5);
          const sy = cy + Math.sin(sa) * (rPx + 5);
          g.circle(sx, sy, 3.0)
            .fill({ color: PALETTE.BUTTER_YELLOW })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
        }

        const iconY = cy - rPx - 14 + Math.sin(sim.elapsedSeconds * 8) * 2;
        g.moveTo(ex + 2, iconY - 7)
          .lineTo(ex - 4, iconY)
          .lineTo(ex + 1, iconY)
          .lineTo(ex - 2, iconY + 7)
          .lineTo(ex + 5, iconY - 1)
          .lineTo(ex, iconY - 1)
          .closePath()
          .fill({ color: PALETTE.BUTTER_YELLOW })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });
      }

      // Poison Status: green venom drop grows above the enemy and drops into the enemy on each poison tick!
      if (e.poisonTimer > 0) {
        const sporePulse = 0.85 + 0.15 * Math.sin(sim.elapsedSeconds * 10);
        g.circle(ex, cy, (rPx + 3.5) * sporePulse).stroke({
          color: PALETTE.MINT_GREEN,
          width: 2.2,
          alpha: 0.8,
        });
        for (let b = 0; b < 3; b++) {
          const ba = sim.elapsedSeconds * 3.0 + e.id + (b * Math.PI * 2) / 3;
          const bx = ex + Math.cos(ba) * (rPx * 0.85);
          const by =
            cy -
            rPx * 0.3 +
            Math.sin(ba) * (rPx * 0.45) -
            ((sim.elapsedSeconds * 16 + b * 6) % 10);
          g.circle(bx, by, 2.8)
            .fill({ color: PALETTE.MINT_GREEN, alpha: 0.9 })
            .stroke({ color: PALETTE.INK_OUTLINE, width: 1.2 });
        }

        const dropBaseY = e.stormMarkTimer > 0 ? cy - rPx - 28 : cy - rPx - 13;
        EnemyRenderer.drawPoisonDropIcon(g, ex, dropBaseY, cy, rPx, sim.elapsedSeconds, e.id);
      }

      // Overhead HP Bar & Bestiary Sandbox Indicators (Infinite HP / Respawn on Death / Elites / Specials / Bosses)
      if (e.isInfiniteHp) {
        const bw = Math.max(28, rPx * 2.1);
        const bh = 5;
        const bx = ex - bw / 2;
        const by = cy - rPx - 12;
        g.rect(bx, by, bw, bh)
          .fill({ color: PALETTE.DEEP_SLATE, alpha: 0.9 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
        g.rect(bx + 1, by + 1, bw - 2, bh - 2).fill({
          color: PALETTE.GOLD_STAR,
        });
        // Infinity symbol (∞) above bar
        const iy = by - 7;
        g.circle(ex - 4, iy, 3.2).stroke({ color: PALETTE.GOLD_STAR, width: 1.8 });
        g.circle(ex + 4, iy, 3.2).stroke({ color: PALETTE.GOLD_STAR, width: 1.8 });
      } else if (
        (e.isElite || e.isSpecial || e.isMiniBoss || e.respawnOnDeath) &&
        e.hp < e.maxHp &&
        e.hp > 0
      ) {
        const bw = Math.max(26, rPx * 2.1);
        const bh = 5;
        const bx = ex - bw / 2;
        const by = cy - rPx - 12;
        g.rect(bx, by, bw, bh)
          .fill({ color: PALETTE.DEEP_SLATE, alpha: 0.85 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
        g.rect(bx + 1, by + 1, (bw - 2) * clamp(e.hp / e.maxHp, 0, 1), bh - 2).fill({
          color: e.respawnOnDeath ? PALETTE.MINT_GREEN : PALETTE.CRIMSON_WARN,
        });
      }
      if (e.respawnOnDeath) {
        g.circle(ex, ey, rPx + 4).stroke({
          color: PALETTE.MINT_GREEN,
          width: 1.8,
          alpha: 0.65,
        });
      }
    }
  }

  /**
   * Improved Dasher Charge Indicator:
   * High-contrast directional lane with wind-rails, animated scrolling chevrons (>>>), and target reticle.
   */
  private static drawDasherChargeIndicator(
    g: PIXI.Graphics,
    e: SimEnemy,
    ex: number,
    ey: number,
    rPx: number,
    progress: number,
    elapsedSeconds: number
  ): void {
    const tx = e.telegraphTargetX * PPU;
    const ty = e.telegraphTargetY * PPU;
    const dx = tx - ex;
    const dy = ty - ey;
    const len = Math.max(24, Math.hypot(dx, dy));
    const angle = e.telegraphAngle;

    const m = new PIXI.Matrix();
    m.rotate(angle);
    m.translate(ex, ey);

    const halfW = rPx * 0.65;

    // Soft danger corridor base
    g.roundRect(0, -halfW, len, halfW * 2, 6)
      .setTransform(m)
      .fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.14 });

    // Filling progress bar inside corridor
    g.roundRect(0, -halfW * 0.8, len * progress, halfW * 1.6, 5)
      .setTransform(m)
      .fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.28 + 0.25 * progress });

    // Outer directional wind-rails
    g.moveTo(4, -halfW)
      .lineTo(len, -halfW)
      .moveTo(4, halfW)
      .lineTo(len, halfW)
      .setTransform(m)
      .stroke({ color: PALETTE.CRIMSON_WARN, width: 2.2, alpha: 0.85, cap: 'round' });

    // Animated scrolling chevron arrows (>>>) along the dash lane
    const chevronCount = 3;
    const scroll = (elapsedSeconds * 3.5) % 1;
    for (let c = 0; c < chevronCount; c++) {
      const tPos = ((c + scroll) / chevronCount) * (len - 22) + 12;
      const chevAlpha = 0.55 + 0.4 * Math.sin(progress * Math.PI);
      g.moveTo(tPos - 7, -halfW * 0.65)
        .lineTo(tPos + 3, 0)
        .lineTo(tPos - 7, halfW * 0.65)
        .setTransform(m)
        .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.6, alpha: chevAlpha, cap: 'round', join: 'round' });
    }

    // Pointed vanguard spearhead at the end of the charge lane
    g.moveTo(len - 10, -halfW * 0.95)
      .lineTo(len + 6, 0)
      .lineTo(len - 10, halfW * 0.95)
      .closePath()
      .setTransform(m)
      .fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.85 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

    g.setTransform(new PIXI.Matrix());

    // Target lock reticle at destination
    g.circle(tx, ty, 9 * (1.2 - progress * 0.35)).stroke({
      color: PALETTE.BUTTER_YELLOW,
      width: 2,
      alpha: 0.85,
    });
  }

  /**
   * Golden Sunflower (`bloom_giant`) 3-Mode Telegraph Indicator:
   * - 'sunflower_charge': Yellow charging arrow (#FDFFB6 / #FBBF24) instead of red rectangle!
   * - 'sunflower_seed_volley': 5 golden seed-aim rays + pulsing gold ring!
   * - 'sunflower_leaf_spiral': Swirling emerald-and-gold leaf vortex ring around the sunflower!
   */
  private static drawSunflowerTelegraph(
    g: PIXI.Graphics,
    e: SimEnemy,
    ex: number,
    ey: number,
    rPx: number,
    progress: number,
    elapsedSeconds: number
  ): void {
    const mode = e.bossAttackMode ?? 'sunflower_charge';

    if (mode === 'sunflower_charge') {
      // Yellow Charging Arrow instead of red rectangle!
      const tx = e.telegraphTargetX * PPU;
      const ty = e.telegraphTargetY * PPU;
      const len = Math.max(36, Math.hypot(tx - ex, ty - ey));
      const m = new PIXI.Matrix();
      m.rotate(e.telegraphAngle);
      m.translate(ex, ey);

      const shaftHalfW = rPx * 0.46;
      const headHalfW = rPx * 0.95;
      const shaftLen = Math.max(18, len - 24);

      // Outer yellow arrow silhouette
      g.moveTo(0, -shaftHalfW)
        .lineTo(shaftLen, -shaftHalfW)
        .lineTo(shaftLen, -headHalfW)
        .lineTo(len + 6, 0)
        .lineTo(shaftLen, headHalfW)
        .lineTo(shaftLen, shaftHalfW)
        .lineTo(0, shaftHalfW)
        .closePath()
        .setTransform(m)
        .fill({ color: 0xfbbf24, alpha: 0.24 })
        .stroke({ color: PALETTE.BUTTER_YELLOW, width: 3, alpha: 0.92 });

      // Inner filling golden charge arrow
      const fillLen = shaftLen * progress;
      g.rect(0, -shaftHalfW * 0.78, fillLen, shaftHalfW * 1.56)
        .setTransform(m)
        .fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.52 + 0.25 * progress });

      // Scrolling golden chevrons inside the arrow shaft
      for (let c = 0; c < 3; c++) {
        const cx = (((c + elapsedSeconds * 4) % 3) / 3) * (shaftLen - 12) + 8;
        g.moveTo(cx - 6, -shaftHalfW * 0.65)
          .lineTo(cx + 4, 0)
          .lineTo(cx - 6, shaftHalfW * 0.65)
          .setTransform(m)
          .stroke({ color: PALETTE.CREAM_WHITE, width: 2.5, alpha: 0.9, cap: 'round' });
      }

      g.setTransform(new PIXI.Matrix());
    } else if (mode === 'sunflower_seed_volley') {
      // 5 Golden Seed Fan Volley aim lines
      for (let s = -2; s <= 2; s++) {
        const a = e.telegraphAngle + s * 0.19;
        const rayLen = 155 * (0.4 + 0.6 * progress);
        const rx = ex + Math.cos(a) * rayLen;
        const ry = ey + Math.sin(a) * rayLen;
        g.moveTo(ex, ey)
          .lineTo(rx, ry)
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.2, alpha: 0.65 });
        g.circle(rx, ry, 4.5)
          .fill({ color: 0xfbbf24, alpha: 0.9 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
      }
    } else {
      // 8-Leaf Radial Spiral telegraph vortex around Sunflower
      const vortexR = rPx * (1.35 + progress * 0.85);
      g.circle(ex, ey, vortexR).stroke({
        color: PALETTE.MINT_GREEN,
        width: 3,
        alpha: 0.78,
      });
      for (let l = 0; l < 8; l++) {
        const a = e.telegraphAngle + (l / 8) * Math.PI * 2 + progress * 1.6;
        const lx = ex + Math.cos(a) * vortexR;
        const ly = ey + Math.sin(a) * vortexR;
        g.ellipse(lx, ly, 6.5, 3.2)
          .fill({ color: PALETTE.MINT_GREEN, alpha: 0.9 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
      }
    }
  }

  /**
   * Bespoke Golden Sunflower (`bloom_giant`) model with distinct visual behavior per attack mode.
   */
  private static drawGoldenSunflowerModel(
    g: PIXI.Graphics,
    e: SimEnemy,
    ex: number,
    cy: number,
    rPx: number,
    bodyColor: number,
    elapsedSeconds: number
  ): void {
    const mode = e.bossAttackMode ?? 'sunflower_charge';
    const isTelegraph = e.aiState === 'telegraph';

    // Behaviour offset: crouch backward on charge telegraph, swell seed core on seed volley, spin petals on leaf spiral
    let offsetX = 0;
    let offsetY = 0;
    let coreScale = 1.0;
    let petalRot = elapsedSeconds * 1.8;

    if (isTelegraph) {
      if (mode === 'sunflower_charge') {
        const jitter = Math.sin(elapsedSeconds * 42) * 2.2;
        offsetX = -Math.cos(e.telegraphAngle) * 7 + jitter;
        offsetY = -Math.sin(e.telegraphAngle) * 7;
      } else if (mode === 'sunflower_seed_volley') {
        coreScale = 1.25 + Math.sin(elapsedSeconds * 24) * 0.16;
      } else {
        petalRot = e.facingAngle * 1.6;
      }
    }

    const sx = ex + offsetX;
    const sy = cy + offsetY;

    // 10 Golden Sunflower Petals around the rim
    const petalCount = 10;
    for (let p = 0; p < petalCount; p++) {
      const pa = petalRot + (p / petalCount) * Math.PI * 2;
      const px = sx + Math.cos(pa) * (rPx * 0.88);
      const py = sy + Math.sin(pa) * (rPx * 0.88);
      const petalCol =
        isTelegraph && mode === 'sunflower_leaf_spiral' && p % 2 === 0
          ? PALETTE.MINT_GREEN
          : 0xfbbf24;
      g.circle(px, py, rPx * 0.38)
        .fill({ color: petalCol })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
    }

    // Dark brown/amber sunflower seed disk center
    g.circle(sx, sy, rPx * 0.72 * coreScale)
      .fill({ color: e.hitFlashTimer > 0 ? bodyColor : 0x78350f })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });

    // Golden seed pattern dots on the disk
    for (let d = 0; d < 5; d++) {
      const da = (d / 5) * Math.PI * 2 + elapsedSeconds;
      g.circle(
        sx + Math.cos(da) * (rPx * 0.34 * coreScale),
        sy + Math.sin(da) * (rPx * 0.34 * coreScale),
        2.6 * coreScale
      ).fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.9 });
    }
  }

  /**
   * Renders a stationary destructible Hero Grave (`isHeroGrave`) left after Second Wind or Hero Death.
   * Attacking and destroying it restores +25 HP!
   */
  public static drawHeroGraveModel(
    g: PIXI.Graphics,
    e: SimEnemy,
    ex: number,
    ey: number,
    rPx: number,
    elapsedSeconds: number
  ): void {
    const pulse = 0.85 + 0.15 * Math.sin(elapsedSeconds * 5.0);
    const isHit = e.hitFlashTimer > 0;

    // Healing emerald aura ring beneath the gravestone
    g.ellipse(ex, ey + 6, rPx * 1.25 * pulse, rPx * 0.75 * pulse)
      .fill({ color: PALETTE.MINT_GREEN, alpha: 0.22 })
      .stroke({ color: PALETTE.MINT_GREEN, width: 2, alpha: 0.75 });

    // Mossy stone base plinth
    g.roundRect(ex - rPx * 0.92, ey + 2, rPx * 1.84, rPx * 0.52, 5)
      .fill({ color: isHit ? PALETTE.CREAM_WHITE : 0x475569 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.8 });

    // Arched headstone tablet
    g.roundRect(ex - rPx * 0.72, ey - rPx * 1.15, rPx * 1.44, rPx * 1.35, 11)
      .fill({ color: isHit ? PALETTE.CREAM_WHITE : 0x64748b })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });

    // Glowing emerald healing cross emblem carved into the headstone
    const crossY = ey - rPx * 0.52;
    g.rect(ex - 2.8, crossY - 8, 5.6, 16)
      .fill({ color: PALETTE.MINT_GREEN })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
    g.rect(ex - 7, crossY - 3.2, 14, 5.6)
      .fill({ color: PALETTE.MINT_GREEN })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });

    // Small wildflower offering at base of grave
    g.circle(ex - rPx * 0.45, ey + 4, 4.2)
      .fill({ color: PALETTE.BLUSH_ROSE })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
    g.circle(ex + rPx * 0.45, ey + 4, 3.8)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });

    // HP Bar above the Hero Grave when damaged or nearby
    if (e.hp > 0) {
      const bw = rPx * 2.0;
      const bh = 5;
      const bx = ex - bw / 2;
      const by = ey - rPx * 1.45;
      g.rect(bx, by, bw, bh)
        .fill({ color: PALETTE.DEEP_SLATE, alpha: 0.9 })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
      g.rect(bx + 1, by + 1, (bw - 2) * clamp(e.hp / e.maxHp, 0, 1), bh - 2).fill({
        color: PALETTE.MINT_GREEN,
      });
    }
  }

  public static drawArenaFlowerModel(
    g: PIXI.Graphics,
    e: SimEnemy,
    ex: number,
    ey: number,
    rPx: number,
    elapsedSeconds: number
  ): void {
    const sway = Math.sin(elapsedSeconds * 2.4 + e.id) * 2.5;
    const pulse = 0.94 + 0.06 * Math.sin(elapsedSeconds * 4.2 + e.id);
    const isHit = e.hitFlashTimer > 0;

    for (let i = 0; i < 4; i++) {
      const la = (i / 4) * Math.PI * 2 + 0.35;
      const lx = ex + Math.cos(la) * (rPx * 0.72);
      const ly = ey + Math.sin(la) * (rPx * 0.55) + 6;
      g.ellipse(lx, ly, rPx * 0.55, rPx * 0.32)
        .fill({ color: isHit ? PALETTE.CREAM_WHITE : 0x10b981, alpha: 0.92 })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
    }

    const cx = ex + sway;
    const cy = ey - 4;
    const petalCount = 8;
    for (let p = 0; p < petalCount; p++) {
      const pa = (p / petalCount) * Math.PI * 2 + elapsedSeconds * 0.35;
      const px = cx + Math.cos(pa) * (rPx * 0.62 * pulse);
      const py = cy + Math.sin(pa) * (rPx * 0.62 * pulse);
      const petalCol = isHit
        ? PALETTE.CREAM_WHITE
        : p % 2 === 0
          ? PALETTE.BLUSH_ROSE
          : 0xfb7185;
      g.circle(px, py, rPx * 0.42 * pulse)
        .fill({ color: petalCol, alpha: 0.96 })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
    }

    g.circle(cx, cy, rPx * 0.46 * pulse)
      .fill({ color: isHit ? PALETTE.CREAM_WHITE : PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.8 });
    g.circle(cx - rPx * 0.12, cy - rPx * 0.12, rPx * 0.16).fill({
      color: PALETTE.CREAM_WHITE,
      alpha: 0.85,
    });

    const bw = rPx * 2.2;
    const bh = 6;
    const bx = ex - bw / 2;
    const by = cy - rPx - 14;
    g.rect(bx, by, bw, bh)
      .fill({ color: PALETTE.DEEP_SLATE, alpha: 0.9 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });
    g.rect(bx + 1, by + 1, (bw - 2) * clamp(e.hp / e.maxHp, 0, 1), bh - 2).fill({
      color: PALETTE.BUTTER_YELLOW,
    });
  }

  /**
   * Slight blue frost filter overlay for enemies slowed by Frost Touch (no spider web!).
   */
  public static drawFrostTouchFilter(
    g: PIXI.Graphics,
    ex: number,
    cy: number,
    rPx: number,
    elapsedSeconds: number,
    enemyId: number
  ): void {
    const shimmer = 0.85 + 0.15 * Math.sin(elapsedSeconds * 7.0 + enemyId);
    // Translucent icy blue filter glaze over the enemy body
    g.circle(ex, cy, rPx * 1.04)
      .fill({ color: PALETTE.SKY_BLUE, alpha: 0.28 * shimmer })
      .stroke({ color: 0xbae6fd, width: 2.0, alpha: 0.82 });

    // Subtle top frost sheen highlight
    g.ellipse(ex - rPx * 0.18, cy - rPx * 0.28, rPx * 0.45, rPx * 0.22).fill({
      color: 0xe0f2fe,
      alpha: 0.45,
    });
  }

  /**
   * Spider-web glue debuff overlay for enemies touched by Petal Orbit / Petal Blossom.
   */
  public static drawSpiderWebGlueDebuff(
    g: PIXI.Graphics,
    ex: number,
    cy: number,
    rPx: number,
    elapsedSeconds: number,
    enemyId: number
  ): void {
    const webR = rPx * 1.18;
    const pulse = 0.92 + 0.08 * Math.sin(elapsedSeconds * 6.0 + enemyId);
    const rot = Math.sin(elapsedSeconds * 1.5 + enemyId) * 0.12;

    g.ellipse(ex, cy + rPx * 0.55, webR * 0.95 * pulse, webR * 0.45 * pulse).fill({
      color: PALETTE.CREAM_WHITE,
      alpha: 0.26,
    });

    const spokes = 6;
    for (let i = 0; i < spokes; i++) {
      const a = rot + (i / spokes) * Math.PI * 2;
      const sx = ex + Math.cos(a) * webR * pulse;
      const sy = cy + Math.sin(a) * webR * pulse;
      g.moveTo(ex, cy)
        .lineTo(sx, sy)
        .stroke({ color: PALETTE.CREAM_WHITE, width: 1.6, alpha: 0.78 });
    }

    for (const ringFrac of [0.48, 0.82]) {
      const rr = webR * ringFrac * pulse;
      for (let i = 0; i < spokes; i++) {
        const a1 = rot + (i / spokes) * Math.PI * 2;
        const a2 = rot + ((i + 1) / spokes) * Math.PI * 2;
        g.moveTo(ex + Math.cos(a1) * rr, cy + Math.sin(a1) * rr)
          .lineTo(ex + Math.cos(a2) * rr, cy + Math.sin(a2) * rr)
          .stroke({ color: PALETTE.CREAM_WHITE, width: 1.4, alpha: 0.72 });
      }
    }

    for (let d = 0; d < 3; d++) {
      const da = rot + (d * Math.PI * 2) / 3 + 0.4;
      const dx = ex + Math.cos(da) * (webR * 0.75);
      const dy = cy + Math.sin(da) * (webR * 0.75);
      g.circle(dx, dy, 2.4)
        .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.92 })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.1 });
    }
  }

  /**
   * Animated Poison Teardrop Icon:
   * Synchronized with the 0.5s poison tick cycle:
   * - Grows a fresh green poison drop above the enemy's head (cycle 0.0 -> 0.68)
   * - Drops down into the enemy body and splashes on each poison tick (cycle 0.68 -> 1.0)
   */
  public static drawPoisonDropIcon(
    g: PIXI.Graphics,
    x: number,
    baseY: number,
    enemyCenterY: number,
    rPx: number,
    elapsedSeconds: number,
    enemyId: number
  ): void {
    // 2 ticks per second (every 30 frames at 60Hz)
    const cycle = (elapsedSeconds * 2.0 + (enemyId % 5) * 0.03) % 1.0;

    let dropScale = 1.0;
    let currentY = baseY;

    if (cycle < 0.68) {
      // Growing a new poison drop above the enemy
      const growT = cycle / 0.68;
      dropScale = 0.25 + 0.85 * Math.sin(growT * (Math.PI * 0.5));
      currentY = baseY - (1 - growT) * 3;
    } else {
      // Dropping the poison icon down into the enemy body on the poison tick!
      const fallT = (cycle - 0.68) / 0.32;
      const easeIn = fallT * fallT;
      currentY = lerp(baseY, enemyCenterY - rPx * 0.15, easeIn);
      dropScale = 1.1 - fallT * 0.35;

      // Splash droplets when hitting the enemy body at the end of the drop
      if (fallT > 0.65) {
        const splashT = (fallT - 0.65) / 0.35;
        for (const side of [-1, 1] as const) {
          g.circle(
            x + side * (4 + splashT * 9),
            enemyCenterY - rPx * 0.2 - Math.sin(splashT * Math.PI) * 6,
            2.2 * (1 - splashT * 0.4)
          ).fill({ color: PALETTE.MINT_GREEN, alpha: (1 - splashT) * 0.95 });
        }
      }
    }

    const r = 4.6 * dropScale;
    g.moveTo(x, currentY - r * 1.45)
      .lineTo(x + r * 0.92, currentY + r * 0.15)
      .arc(x, currentY + r * 0.25, r * 0.92, 0, Math.PI, false)
      .lineTo(x - r * 0.92, currentY + r * 0.15)
      .closePath()
      .fill({ color: 0x22c55e })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

    g.circle(x, currentY + r * 0.2, r * 0.52).fill({
      color: PALETTE.MINT_GREEN,
      alpha: 0.95,
    });
    g.circle(x - r * 0.28, currentY - r * 0.05, r * 0.22).fill({
      color: PALETTE.CREAM_WHITE,
      alpha: 0.9,
    });
  }

  public static drawEnemyLegs(
    g: PIXI.Graphics,
    ex: number,
    ey: number,
    rPx: number,
    isMoving: boolean,
    walkPhase: number,
    facingAngle: number,
    footColor: number
  ): void {
    const strideX = Math.cos(facingAngle);
    const strideY = Math.sin(facingAngle);
    const leftSwing = isMoving ? Math.sin(walkPhase) : 0;
    const rightSwing = isMoving ? Math.sin(walkPhase + Math.PI) : 0;

    const hipOffset = rPx * 0.42;
    const legLen = Math.max(5, rPx * 0.45);
    const strideAmp = Math.max(4, rPx * 0.35);

    const lFootX = ex - hipOffset + leftSwing * strideX * strideAmp;
    const lFootY =
      ey +
      rPx * 0.45 +
      legLen * 0.5 +
      leftSwing * strideY * (strideAmp * 0.5) -
      Math.max(0, leftSwing) * 3.5;

    const rFootX = ex + hipOffset + rightSwing * strideX * strideAmp;
    const rFootY =
      ey +
      rPx * 0.45 +
      legLen * 0.5 +
      rightSwing * strideY * (strideAmp * 0.5) -
      Math.max(0, rightSwing) * 3.5;

    const footR = Math.max(3.0, rPx * 0.22);

    g.moveTo(ex - hipOffset * 0.7, ey + rPx * 0.3)
      .lineTo(lFootX, lFootY)
      .stroke({ color: PALETTE.INK_OUTLINE, width: Math.max(4, footR * 1.5), cap: 'round' });
    g.circle(lFootX, lFootY, footR)
      .fill({ color: footColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

    g.moveTo(ex + hipOffset * 0.7, ey + rPx * 0.3)
      .lineTo(rFootX, rFootY)
      .stroke({ color: PALETTE.INK_OUTLINE, width: Math.max(4, footR * 1.5), cap: 'round' });
    g.circle(rFootX, rFootY, footR)
      .fill({ color: footColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
  }
}
