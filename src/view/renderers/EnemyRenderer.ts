import * as PIXI from 'pixi.js';
import { PALETTE } from '../../content/data/catalog';
import { clamp, lerp } from '../../core/math/vec2';
import type { SimEnemy, Simulation } from '../../sim/Simulation';
import { resolveEnemySpriteKey, type SpriteKey } from '../SpriteAtlas';
import { PPU } from './EnvironmentRenderer';

/**
 * Renders all enemy archetypes using the Bestiary sprites from SpriteAtlas,
 * alongside Big Arena Flowers, destructible Hero Graves,
 * articulated walking enemy legs, Spitter mouth & cheek firing animation,
 * Dasher charge indicator, Golden Sunflower 3-mode telegraphs & yellow charging arrow,
 * Frost Touch blue filter, Petal Orbit spider-web glue, and dropping/regrowing Poison Drop icon.
 */
export class EnemyRenderer {
  public static drawEnemies(
    enemyUnderGraphic: PIXI.Graphics,
    enemySpriteContainer: PIXI.Container,
    enemySpritePool: PIXI.Sprite[],
    enemyOverlayGraphic: PIXI.Graphics,
    telegraphGraphic: PIXI.Graphics,
    atlasTextures: Map<SpriteKey, PIXI.Texture>,
    sim: Simulation,
    alpha: number
  ): void {
    const gUnder = enemyUnderGraphic;
    const gOver = enemyOverlayGraphic;
    gUnder.clear();
    gOver.clear();

    let spritePoolIndex = 0;

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
      gUnder.ellipse(ex, ey + rPx * 0.68, rPx * 0.92, rPx * 0.46).fill({
        color: 0x0f131d,
        alpha: 0.36,
      });

      // Stationary Big Arena Flower
      if (e.isArenaFlower) {
        EnemyRenderer.drawArenaFlowerModel(gOver, e, ex, ey, rPx, sim.elapsedSeconds);
        continue;
      }

      // Stationary Hero Grave (left behind by Second Wind or Hero Death)
      if (e.isHeroGrave) {
        EnemyRenderer.drawHeroGraveModel(gOver, e, ex, ey, rPx, sim.elapsedSeconds);
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
        } else if (e.isFinalBoss) {
          EnemyRenderer.drawFinalBossTelegraph(
            telegraphGraphic,
            e,
            ex,
            ey,
            rPx,
            progress,
            sim.elapsedSeconds
          );
        } else {
          const slamRadiusPx = (e.isMiniBoss ? 2.15 : 1.85) * PPU;
          const easeGrow = 0.16 + 0.84 * Math.pow(progress, 0.85);
          const growR = slamRadiusPx * easeGrow;
          const flashWindow = clamp((progress - 0.78) / 0.22, 0, 1);

          // Growing seismic charge area centered on the moving brute
          telegraphGraphic
            .circle(ex, ey, growR)
            .fill({
              color: flashWindow > 0 ? PALETTE.BUTTER_YELLOW : PALETTE.CRIMSON_WARN,
              alpha: 0.16 + 0.28 * progress + 0.22 * flashWindow,
            })
            .stroke({
              color: flashWindow > 0 ? PALETTE.CREAM_WHITE : 0xfbbf24,
              width: 2.2 + 2.0 * progress,
              alpha: 0.55 + 0.4 * progress,
            });

          // Inner pulsing shock-wave ripple ring inside the growing charge area
          const ripplePhase = (sim.elapsedSeconds * 4.5) % 1;
          const rippleR = growR * (0.35 + 0.55 * ripplePhase);
          telegraphGraphic.circle(ex, ey, rippleR).stroke({
            color: PALETTE.BUTTER_YELLOW,
            width: 1.8,
            alpha: (0.38 + 0.35 * progress) * (1 - ripplePhase * 0.5),
          });

          // Final pre-slam flash core when nearing impact
          if (flashWindow > 0) {
            telegraphGraphic.circle(ex, ey, growR * (0.35 + 0.55 * flashWindow)).fill({
              color: PALETTE.CREAM_WHITE,
              alpha: 0.52 * flashWindow,
            });
          }
        }
      }

      // No base circle or dashed circle around special/elite/boss enemies — differentiated by larger scale and floating crowns/rhombus & lines above them
      const isFrostTouched = e.slowTimer > 0 && e.webSlowTimer <= 0;
      const accentColor = e.hitFlashTimer > 0 ? PALETTE.CREAM_WHITE : e.accentColor;

      // Animated enemy legs beneath Bestiary sprite
      if (e.archetypeId !== 'splitter') {
        EnemyRenderer.drawEnemyLegs(
          gUnder,
          ex,
          ey,
          rPx,
          isMoving,
          walkPhase,
          e.facingAngle,
          accentColor
        );
      }

      let cy = ey + bobY;
      let renderX = ex;
      const cosA = Math.cos(e.facingAngle);
      const sinA = Math.sin(e.facingAngle);

      // Acquire or allocate a PIXI.Sprite from the pool for this enemy's Bestiary sprite
      let sprite = enemySpritePool[spritePoolIndex];
      if (!sprite) {
        sprite = new PIXI.Sprite();
        sprite.anchor.set(0.5, 0.54);
        enemySpriteContainer.addChild(sprite);
        enemySpritePool.push(sprite);
      }
      spritePoolIndex++;

      const spriteKey = resolveEnemySpriteKey(e);
      const tex = atlasTextures.get(spriteKey);
      if (tex && sprite.texture !== tex) {
        sprite.texture = tex;
      }
      sprite.visible = true;
      sprite.anchor.set(0.5, 0.54);

      // Special and Elite enemies use visibly larger scale + floating crowns/rhombus & radiant lines above them
      const sizeMult =
        e.isFinalBoss || e.isMiniBoss
          ? 3.38
          : e.isSpecial
            ? 3.34
            : e.isElite
              ? 3.24
              : 2.95;
      const baseScale = (rPx * sizeMult) / 256;
      const flipX = cosA < -0.15 ? -1 : 1;

      let animScaleX = isMoving ? 1 + Math.sin(walkPhase * 2) * 0.055 : 1.0;
      let animScaleY = isMoving ? 1 - Math.sin(walkPhase * 2) * 0.055 : 1.0;
      let animRotation = isMoving ? Math.sin(walkPhase) * 0.075 : 0;

      // Archetype-specific restored sprite animations & overlays:
      if (e.isSpecial && e.specialId === 'bloom_giant') {
        // Golden Sunflower (`special_bloom_giant`) 3-attack-mode animations + Bestiary sprite
        const mode = e.bossAttackMode ?? 'sunflower_charge';
        if (e.aiState === 'telegraph') {
          if (mode === 'sunflower_charge') {
            const jitter = Math.sin(sim.elapsedSeconds * 42) * 2.2;
            renderX -= Math.cos(e.telegraphAngle) * 7 - jitter;
            cy -= Math.sin(e.telegraphAngle) * 7;
            animScaleX = 1.14;
            animScaleY = 0.88;
          } else if (mode === 'sunflower_seed_volley') {
            const swell = 1.12 + Math.sin(sim.elapsedSeconds * 24) * 0.1;
            animScaleX = swell;
            animScaleY = swell;
          } else {
            animRotation = sim.elapsedSeconds * 7.5;
          }
        }
        EnemyRenderer.drawGoldenSunflowerModeOverlay(
          gOver,
          e,
          renderX,
          cy,
          rPx,
          sim.elapsedSeconds
        );
      } else if (e.archetypeId === 'spitter') {
        // Spitter mouth & cheek animation when winding up or recoiling from firing a projectile!
        const isWindingUpToSpit = e.aiTimer < 0.55;
        const isSpitRecoil = e.aiTimer > 1.75;
        const windupNorm = isWindingUpToSpit ? clamp((0.55 - e.aiTimer) / 0.55, 0, 1) : 0;
        const recoilNorm = isSpitRecoil ? clamp((e.aiTimer - 1.75) / 0.45, 0, 1) : 0;

        animScaleX *= 1 + windupNorm * 0.18 - recoilNorm * 0.12;
        animScaleY *= 1 - windupNorm * 0.1 + recoilNorm * 0.16;

        EnemyRenderer.drawSpitterMouthAndCheeksOverlay(
          gOver,
          ex,
          cy,
          rPx,
          cosA,
          sinA,
          accentColor,
          windupNorm,
          recoilNorm
        );
      } else if (e.archetypeId === 'dasher') {
        if (e.aiState === 'telegraph') {
          animScaleX = 1.15;
          animScaleY = 0.86;
          renderX -= cosA * 3.5;
          cy -= sinA * 3.5;
        } else if (e.aiState === 'charge') {
          animScaleX = 1.24;
          animScaleY = 0.82;
        }
      } else if (e.archetypeId === 'brute' || e.isMiniBoss) {
        if (e.aiState === 'telegraph') {
          const prog = clamp(1 - e.aiTimer / Math.max(0.01, e.telegraphDuration), 0, 1);
          animScaleX = 1 + prog * 0.16;
          animScaleY = 1 + prog * 0.12;
          cy -= Math.sin(prog * Math.PI) * 5.5;
        }
      } else if (e.archetypeId === 'splitter') {
        const jellySquash = Math.sin(walkPhase * 1.5) * 0.12;
        animScaleX = 1 + jellySquash;
        animScaleY = 1 - jellySquash * 0.85;
      } else if (e.archetypeId === 'shielded') {
        // Directional buckler arc showing exact block orientation (with explicit moveTo so no line connects to 0,0)
        const shieldArc = Math.PI / 2.1;
        const startA = e.facingAngle - shieldArc;
        const endA = e.facingAngle + shieldArc;
        const arcR = rPx + 4;
        const startX = ex + Math.cos(startA) * arcR;
        const startY = cy + Math.sin(startA) * arcR;
        gOver
          .moveTo(startX, startY)
          .arc(ex, cy, arcR, startA, endA)
          .stroke({
            color: PALETTE.INK_OUTLINE,
            width: 7.5,
            cap: 'round',
          });
        gOver
          .moveTo(startX, startY)
          .arc(ex, cy, arcR, startA, endA)
          .stroke({
            color: PALETTE.CREAM_WHITE,
            width: 4.0,
            cap: 'round',
          });
      }

      // Final Boss dramatic death convulsion & collapse animation before Angel Wings ascension
      const isFinalBossDying = e.isFinalBoss && (sim.bossDeathTimer > 0 || e.koTimer > 0);
      const bossDeathAnimTime =
        sim.elapsedSeconds + (sim.victorySequenceTimer > 0 ? 1.95 - sim.victorySequenceTimer : 0);
      if (isFinalBossDying) {
        const deathProg = clamp(1 - sim.bossDeathTimer / 0.85, 0, 1);
        renderX += Math.sin(bossDeathAnimTime * 75) * 6.5 * (1 - deathProg * 0.4);
        cy += Math.cos(bossDeathAnimTime * 62) * 4.5 + deathProg * 10;
        animScaleX *= 1 + Math.sin(bossDeathAnimTime * 48) * 0.16 - deathProg * 0.28;
        animScaleY *= 1 - Math.sin(bossDeathAnimTime * 48) * 0.16 - deathProg * 0.35;
        animRotation += Math.sin(bossDeathAnimTime * 35) * 0.22;
      }

      sprite.position.set(renderX, cy);
      sprite.scale.set(baseScale * animScaleX * flipX, baseScale * animScaleY);
      sprite.rotation = animRotation;

      // Status & hit-flash tinting on the Bestiary sprite
      if (isFinalBossDying) {
        const flashPhase = Math.floor(bossDeathAnimTime * 24) % 2 === 0;
        sprite.tint = flashPhase ? PALETTE.CRIMSON_WARN : PALETTE.GOLD_STAR;
        // Radiating fracture rays & bursting thorn petals from dying Final Boss
        for (let ray = 0; ray < 6; ray++) {
          const ra = bossDeathAnimTime * 5 + (ray * Math.PI) / 3;
          const rIn = rPx * 0.25;
          const rOut = rPx * (1.25 + 0.35 * Math.sin(bossDeathAnimTime * 18 + ray));
          gOver
            .moveTo(renderX + Math.cos(ra) * rIn, cy + Math.sin(ra) * rIn)
            .lineTo(renderX + Math.cos(ra) * rOut, cy + Math.sin(ra) * rOut)
            .stroke({
              color: ray % 2 === 0 ? PALETTE.BUTTER_YELLOW : PALETTE.CRIMSON_WARN,
              width: 3.2,
              alpha: 0.9,
              cap: 'round',
            });
        }
      } else if (e.hitFlashTimer > 0) {
        sprite.tint = 0xffffff;
        gOver.circle(renderX, cy, rPx * 0.92).fill({
          color: PALETTE.CREAM_WHITE,
          alpha: 0.62,
        });
      } else if (e.freezeTimer > 0) {
        sprite.tint = PALETTE.SKY_BLUE;
      } else if (isFrostTouched) {
        sprite.tint = 0xbae6fd;
      } else if (e.burnTimer > 0) {
        sprite.tint = 0xfdba74;
      } else if (e.poisonTimer > 0) {
        sprite.tint = 0xbbf7d0;
      } else {
        sprite.tint = 0xffffff;
      }

      // Frost Touch slight blue filter overlay (shown ONLY when slowed by Frost Touch, not spider web!)
      if (isFrostTouched) {
        EnemyRenderer.drawFrostTouchFilter(gOver, renderX, cy, rPx, sim.elapsedSeconds, e.id);
      }

      // Spider-Web Glue slow debuff (shown ONLY when snared by Petal Orbit / Petal Blossom!)
      if (e.webSlowTimer > 0) {
        EnemyRenderer.drawSpiderWebGlueDebuff(gOver, renderX, cy, rPx, sim.elapsedSeconds, e.id);
      }

      // Storm Mark (Chain Lightning status): NO blue circle; only small zap sparkles that fly away from enemy and disappear
      if (e.stormMarkTimer > 0) {
        const sparkCount = 5;
        for (let s = 0; s < sparkCount; s++) {
          const sparkProgress = (sim.elapsedSeconds * 2.6 + e.id * 0.37 + s / sparkCount) % 1;
          const sparkFade = clamp(1 - sparkProgress, 0, 1);
          const sa =
            e.id * 1.13 +
            (s * Math.PI * 2) / sparkCount +
            Math.sin(sim.elapsedSeconds * 4 + s) * 0.35;
          const dist = rPx * 0.45 + sparkProgress * (rPx * 0.95 + 14);
          const sx = renderX + Math.cos(sa) * dist;
          const sy = cy + Math.sin(sa) * dist - sparkProgress * 6;
          const perpX = -Math.sin(sa);
          const perpY = Math.cos(sa);
          const zapLen = (4.5 + 3.0 * sparkFade) * (0.7 + 0.3 * sparkFade);

          // Small jagged lightning zap sparkle flying outward & fading away
          gOver
            .moveTo(sx - Math.cos(sa) * zapLen, sy - Math.sin(sa) * zapLen)
            .lineTo(sx + perpX * 2.6, sy + perpY * 2.6)
            .lineTo(sx - perpX * 2.2 + Math.cos(sa) * (zapLen * 0.4), sy - perpY * 2.2 + Math.sin(sa) * (zapLen * 0.4))
            .lineTo(sx + Math.cos(sa) * zapLen, sy + Math.sin(sa) * zapLen)
            .stroke({
              color: s % 2 === 0 ? PALETTE.BUTTER_YELLOW : PALETTE.SKY_BLUE,
              width: 2.2 * sparkFade + 0.6,
              alpha: 0.95 * sparkFade,
              cap: 'round',
              join: 'round',
            });
        }
      }

      // Floating Crown / Rhombus & Radiant Lines above Special, Elite, Mini-Boss, and Final Boss enemies (no ground circles!)
      if (e.isSpecial || e.isElite || e.isMiniBoss || e.isFinalBoss) {
        EnemyRenderer.drawSpecialOrEliteCrestAbove(
          gOver,
          e,
          renderX,
          cy,
          rPx,
          sim.elapsedSeconds
        );
      }

      // Poison Status: NO circles around enemy — falling green venom drop is the sole clean indicator!
      if (e.poisonTimer > 0) {
        const dropBaseY = e.stormMarkTimer > 0 ? cy - rPx - 28 : cy - rPx - 13;
        EnemyRenderer.drawPoisonDropIcon(
          gOver,
          renderX,
          dropBaseY,
          cy,
          rPx,
          sim.elapsedSeconds,
          e.id
        );
      }

      // Overhead HP Bar & Bestiary Sandbox Indicators (Infinite HP / Respawn on Death / Elites / Specials / Bosses)
      if (e.isInfiniteHp) {
        const bw = Math.max(28, rPx * 2.1);
        const bh = 5;
        const bx = renderX - bw / 2;
        const by = cy - rPx - 12;
        gOver
          .rect(bx, by, bw, bh)
          .fill({ color: PALETTE.DEEP_SLATE, alpha: 0.9 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
        gOver.rect(bx + 1, by + 1, bw - 2, bh - 2).fill({
          color: PALETTE.GOLD_STAR,
        });
        // Infinity symbol (∞) above bar
        const iy = by - 7;
        gOver.circle(renderX - 4, iy, 3.2).stroke({ color: PALETTE.GOLD_STAR, width: 1.8 });
        gOver.circle(renderX + 4, iy, 3.2).stroke({ color: PALETTE.GOLD_STAR, width: 1.8 });
      } else if (
        (e.isElite || e.isSpecial || e.isMiniBoss || e.respawnOnDeath) &&
        e.hp < e.maxHp &&
        e.hp > 0
      ) {
        const bw = Math.max(26, rPx * 2.1);
        const bh = 5;
        const bx = renderX - bw / 2;
        const by = cy - rPx - 12;
        gOver
          .rect(bx, by, bw, bh)
          .fill({ color: PALETTE.DEEP_SLATE, alpha: 0.85 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
        gOver.rect(bx + 1, by + 1, (bw - 2) * clamp(e.hp / e.maxHp, 0, 1), bh - 2).fill({
          color: e.respawnOnDeath ? PALETTE.MINT_GREEN : PALETTE.CRIMSON_WARN,
        });
      }
    }

    // Hide any unused pooled enemy sprites from previous frames
    for (let i = spritePoolIndex; i < enemySpritePool.length; i++) {
      enemySpritePool[i]!.visible = false;
    }
  }

  /**
   * Draws the Spitter's swelling cheeks and puckered spitting mouth nozzle
   * on top of the Bestiary Spitter sprite when winding up or recoiling from firing!
   */
  private static drawSpitterMouthAndCheeksOverlay(
    g: PIXI.Graphics,
    ex: number,
    cy: number,
    rPx: number,
    cosA: number,
    sinA: number,
    accentColor: number,
    windupNorm: number,
    recoilNorm: number
  ): void {
    if (windupNorm <= 0.02 && recoilNorm <= 0.02) return;

    const cheekSwell = 1.0 + windupNorm * 0.85 + recoilNorm * 0.35;
    const perpX = -sinA;
    const perpY = cosA;
    const cheekForward = rPx * 0.25;
    const cheekSide = rPx * (0.46 + windupNorm * 0.14);
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
    const mouthReach = rPx * (0.52 + windupNorm * 0.22 + recoilNorm * 0.28);
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
  }

  /**
   * Draws mode-specific visual behavior cues on the Golden Sunflower (`bloom_giant`)
   * on top of its Bestiary sprite so the player can read which attack mode is coming next.
   */
  private static drawGoldenSunflowerModeOverlay(
    g: PIXI.Graphics,
    e: SimEnemy,
    sx: number,
    sy: number,
    rPx: number,
    elapsedSeconds: number
  ): void {
    if (e.aiState !== 'telegraph') return;
    const mode = e.bossAttackMode ?? 'sunflower_charge';

    if (mode === 'sunflower_seed_volley') {
      const coreScale = 1.0 + Math.sin(elapsedSeconds * 24) * 0.18;
      g.circle(sx, sy, rPx * 0.48 * coreScale)
        .fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.45 })
        .stroke({ color: 0xfbbf24, width: 2.2 });
      for (let d = 0; d < 5; d++) {
        const da = (d / 5) * Math.PI * 2 + elapsedSeconds * 4;
        g.circle(
          sx + Math.cos(da) * (rPx * 0.32 * coreScale),
          sy + Math.sin(da) * (rPx * 0.32 * coreScale),
          3.2
        )
          .fill({ color: 0x78350f })
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 1.5 });
      }
    } else if (mode === 'sunflower_leaf_spiral') {
      for (let p = 0; p < 6; p++) {
        const pa = elapsedSeconds * 6 + (p / 6) * Math.PI * 2;
        const px = sx + Math.cos(pa) * (rPx * 0.92);
        const py = sy + Math.sin(pa) * (rPx * 0.92);
        g.ellipse(px, py, 5.5, 2.8)
          .fill({ color: PALETTE.MINT_GREEN, alpha: 0.92 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
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
    g.setTransform(m);

    const halfW = rPx * 0.65;

    // Soft danger corridor base
    g.roundRect(0, -halfW, len, halfW * 2, 6).fill({
      color: PALETTE.CRIMSON_WARN,
      alpha: 0.14,
    });

    // Filling progress bar inside corridor (red outer border lines removed)
    g.roundRect(0, -halfW * 0.8, len * progress, halfW * 1.6, 5).fill({
      color: PALETTE.CRIMSON_WARN,
      alpha: 0.28 + 0.25 * progress,
    });

    // Animated scrolling chevron arrows (>>>) along the dash lane
    const chevronCount = 3;
    const scroll = (elapsedSeconds * 3.5) % 1;
    for (let c = 0; c < chevronCount; c++) {
      const tPos = ((c + scroll) / chevronCount) * (len - 22) + 12;
      const chevAlpha = 0.55 + 0.4 * Math.sin(progress * Math.PI);
      g.moveTo(tPos - 7, -halfW * 0.65)
        .lineTo(tPos + 3, 0)
        .lineTo(tPos - 7, halfW * 0.65)
        .stroke({
          color: PALETTE.BUTTER_YELLOW,
          width: 2.6,
          alpha: chevAlpha,
          cap: 'round',
          join: 'round',
        });
    }

    // Pointed vanguard spearhead at the end of the charge lane
    g.moveTo(len - 10, -halfW * 0.95)
      .lineTo(len + 6, 0)
      .lineTo(len - 10, halfW * 0.95)
      .closePath()
      .fill({ color: PALETTE.CRIMSON_WARN, alpha: 0.85 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

    g.setTransform(new PIXI.Matrix());

    // Overhead charge indicator fill bar directly above the charger
    const barW = rPx * 1.8;
    const barH = 5;
    const barX = ex - barW / 2;
    const barY = ey - rPx - 16;
    g.roundRect(barX, barY, barW, barH, 2.5)
      .fill({ color: 0x18111a, alpha: 0.85 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.4 });
    g.roundRect(barX + 1, barY + 1, Math.max(0, (barW - 2) * progress), barH - 2, 1.5)
      .fill({
        color: progress > 0.82 ? PALETTE.BUTTER_YELLOW : PALETTE.CRIMSON_WARN,
        alpha: 0.95,
      });

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
      g.setTransform(m);

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
        .fill({ color: 0xfbbf24, alpha: 0.24 })
        .stroke({ color: PALETTE.BUTTER_YELLOW, width: 3, alpha: 0.92 });

      // Inner filling golden charge arrow
      const fillLen = shaftLen * progress;
      g.rect(0, -shaftHalfW * 0.78, fillLen, shaftHalfW * 1.56).fill({
        color: PALETTE.BUTTER_YELLOW,
        alpha: 0.52 + 0.25 * progress,
      });

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
   * Final Boss 3-Stage Telegraphed Attack Indicators:
   * - Phase 1 (Primordial Thornheart - Emerald Tree God):
   *   - 'boss_p1_vine_whip': Long emerald-and-bark thorny vine lash corridor + 5 fan ray indicators
   *   - 'boss_p1_root_slam': Expanding emerald root-quake ring + 8 thorn dart vectors
   * - Phase 2 (Frenzied Bloom - Magenta Floral Core):
   *   - 'boss_p2_petal_spiral': Rotating magenta blossom mandala + 10 spiral trajectory markers
   *   - 'boss_p2_bramble_charge': Glowing magenta-rose charge corridor with petal chevrons
   * - Phase 3 (Apex Briar Overlord - Crimson & Dark Purple):
   *   - 'boss_p3_crimson_cross': 4-way intersecting crimson & dark-purple laser crossbeams
   *   - 'boss_p3_abyssal_nova': Twin concentric dark-purple & crimson overload rings + 12 razor vectors
   */
  private static drawFinalBossTelegraph(
    g: PIXI.Graphics,
    e: SimEnemy,
    ex: number,
    ey: number,
    rPx: number,
    progress: number,
    elapsedSeconds: number
  ): void {
    const mode = e.bossAttackMode ?? 'boss_p1_root_slam';

    if (mode === 'boss_p1_vine_whip') {
      const len = 6.0 * PPU;
      const halfW = 0.85 * PPU;
      const m = new PIXI.Matrix();
      m.rotate(e.telegraphAngle);
      m.translate(ex, ey);
      g.setTransform(m);

      // Emerald vine lash lane
      g.roundRect(0, -halfW, len, halfW * 2, 10)
        .fill({ color: 0x059669, alpha: 0.18 })
        .stroke({ color: PALETTE.MINT_GREEN, width: 2.5, alpha: 0.85 });
      g.roundRect(0, -halfW * 0.82, len * progress, halfW * 1.64, 8).fill({
        color: 0x10b981,
        alpha: 0.34 + 0.25 * progress,
      });

      // Coiling vine wave along the corridor
      g.moveTo(0, 0);
      for (let step = 1; step <= 8; step++) {
        const sx = (step / 8) * len * progress;
        const sy = Math.sin(step * 1.3 + elapsedSeconds * 12) * (halfW * 0.55);
        g.lineTo(sx, sy);
      }
      g.stroke({ color: PALETTE.BUTTER_YELLOW, width: 3.0, alpha: 0.9, cap: 'round' });
      g.setTransform(new PIXI.Matrix());

      // 5 Emerald Thorn fan rays
      for (let s = -2; s <= 2; s++) {
        const a = e.telegraphAngle + s * 0.16;
        const rayR = 3.8 * PPU * (0.4 + 0.6 * progress);
        g.moveTo(ex, ey)
          .lineTo(ex + Math.cos(a) * rayR, ey + Math.sin(a) * rayR)
          .stroke({ color: PALETTE.MINT_GREEN, width: 2.0, alpha: 0.72 });
      }
    } else if (mode === 'boss_p1_root_slam') {
      const slamR = 2.5 * PPU;
      const tx = e.telegraphTargetX * PPU;
      const ty = e.telegraphTargetY * PPU;
      g.circle(tx, ty, slamR)
        .fill({ color: 0x10b981, alpha: 0.15 })
        .stroke({ color: PALETTE.MINT_GREEN, width: 3.0, alpha: 0.88 });
      g.circle(tx, ty, slamR * progress).fill({
        color: 0x059669,
        alpha: 0.35,
      });
      for (let b = 0; b < 8; b++) {
        const a = e.telegraphAngle + (b / 8) * Math.PI * 2;
        const rx = tx + Math.cos(a) * (slamR * 1.25);
        const ry = ty + Math.sin(a) * (slamR * 1.25);
        g.moveTo(tx + Math.cos(a) * (slamR * 0.5), ty + Math.sin(a) * (slamR * 0.5))
          .lineTo(rx, ry)
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.2, alpha: 0.78, cap: 'round' });
      }
    } else if (mode === 'boss_p2_bramble_charge') {
      const len = 5.2 * PPU;
      const halfW = rPx * 0.78;
      const m = new PIXI.Matrix();
      m.rotate(e.telegraphAngle);
      m.translate(ex, ey);
      g.setTransform(m);

      g.roundRect(0, -halfW, len, halfW * 2, 10)
        .fill({ color: 0xec4899, alpha: 0.18 })
        .stroke({ color: 0xf472b6, width: 2.8, alpha: 0.9 });
      g.roundRect(0, -halfW * 0.8, len * progress, halfW * 1.6, 8).fill({
        color: 0xec4899,
        alpha: 0.36 + 0.25 * progress,
      });
      for (let c = 0; c < 4; c++) {
        const cx = (((c + elapsedSeconds * 4.5) % 4) / 4) * (len - 24) + 12;
        g.moveTo(cx - 8, -halfW * 0.6)
          .lineTo(cx + 5, 0)
          .lineTo(cx - 8, halfW * 0.6)
          .setTransform(m)
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.8, alpha: 0.9, cap: 'round' });
      }
      g.setTransform(new PIXI.Matrix());
    } else if (mode === 'boss_p2_petal_spiral') {
      const ringR = rPx * (1.5 + progress * 1.15);
      g.circle(ex, ey, ringR)
        .fill({ color: 0xec4899, alpha: 0.16 })
        .stroke({ color: 0xf472b6, width: 3.2, alpha: 0.9 });
      for (let b = 0; b < 10; b++) {
        const a = (b / 10) * Math.PI * 2 + elapsedSeconds * 3.5;
        const px = ex + Math.cos(a) * ringR;
        const py = ey + Math.sin(a) * ringR;
        g.ellipse(px, py, 7.0, 3.8)
          .fill({ color: 0xec4899, alpha: 0.92 })
          .stroke({ color: PALETTE.BUTTER_YELLOW, width: 1.5 });
      }
    } else if (mode === 'boss_p3_crimson_cross') {
      const armLen = 7.2 * PPU;
      const halfW = 0.72 * PPU;
      for (let arm = 0; arm < 4; arm++) {
        const armAngle = e.telegraphAngle + (arm * Math.PI) / 2;
        const m = new PIXI.Matrix();
        m.rotate(armAngle);
        m.translate(ex, ey);
        g.setTransform(m);

        g.roundRect(0, -halfW, armLen, halfW * 2, 8)
          .fill({ color: 0x581c87, alpha: 0.24 })
          .stroke({ color: 0xf43f5e, width: 2.8, alpha: 0.92 });
        g.roundRect(0, -halfW * 0.75, armLen * progress, halfW * 1.5, 6).fill({
          color: 0xe11d48,
          alpha: 0.42 + 0.28 * progress,
        });
      }
      g.setTransform(new PIXI.Matrix());
      g.circle(ex, ey, rPx * 1.35).stroke({
        color: PALETTE.BUTTER_YELLOW,
        width: 3.2,
        alpha: 0.95,
      });
    } else {
      // 'boss_p3_abyssal_nova'
      const slamR = 2.8 * PPU;
      const tx = e.telegraphTargetX * PPU;
      const ty = e.telegraphTargetY * PPU;
      g.circle(tx, ty, slamR)
        .fill({ color: 0x581c87, alpha: 0.22 })
        .stroke({ color: 0xf43f5e, width: 3.4, alpha: 0.92 });
      g.circle(tx, ty, slamR * progress)
        .fill({ color: 0xe11d48, alpha: 0.36 })
        .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.2, alpha: 0.88 });
      for (let b = 0; b < 12; b++) {
        const a = (b / 12) * Math.PI * 2 - elapsedSeconds * 3.0;
        const rOut = slamR * (1.05 + (b % 2) * 0.28);
        g.moveTo(tx + Math.cos(a) * (slamR * 0.65), ty + Math.sin(a) * (slamR * 0.65))
          .lineTo(tx + Math.cos(a) * rOut, ty + Math.sin(a) * rOut)
          .stroke({
            color: b % 2 === 0 ? 0xf43f5e : 0xa855f7,
            width: 2.4,
            alpha: 0.85,
            cap: 'round',
          });
      }
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
    _elapsedSeconds: number
  ): void {
    const isHit = e.hitFlashTimer > 0;

    // Mossy stone base plinth (green circle at bottom removed per user request)
    g.roundRect(ex - rPx * 0.92, ey + 2, rPx * 1.84, rPx * 0.52, 5)
      .fill({ color: isHit ? PALETTE.CREAM_WHITE : 0x475569 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.8 });

    // Arched headstone tablet
    g.roundRect(ex - rPx * 0.72, ey - rPx * 1.15, rPx * 1.44, rPx * 1.35, 11)
      .fill({ color: isHit ? PALETTE.CREAM_WHITE : 0x64748b })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });

    // Carved "RIP" inscription on the headstone (instead of cross)
    const ripY = ey - rPx * 0.48;
    const rx = ex - 8.2;
    const ix = ex;
    const px = ex + 8.2;

    const drawRipStrokes = (color: number, width: number) => {
      // 'R'
      g.moveTo(rx - 2.6, ripY + 5.2)
        .lineTo(rx - 2.6, ripY - 5.2)
        .lineTo(rx + 1.4, ripY - 5.2)
        .lineTo(rx + 2.6, ripY - 2.6)
        .lineTo(rx + 1.4, ripY)
        .lineTo(rx - 2.6, ripY)
        .moveTo(rx + 0.4, ripY)
        .lineTo(rx + 2.8, ripY + 5.2)
        // 'I'
        .moveTo(ix - 1.8, ripY - 5.2)
        .lineTo(ix + 1.8, ripY - 5.2)
        .moveTo(ix, ripY - 5.2)
        .lineTo(ix, ripY + 5.2)
        .moveTo(ix - 1.8, ripY + 5.2)
        .lineTo(ix + 1.8, ripY + 5.2)
        // 'P'
        .moveTo(px - 2.4, ripY + 5.2)
        .lineTo(px - 2.4, ripY - 5.2)
        .lineTo(px + 1.6, ripY - 5.2)
        .lineTo(px + 2.8, ripY - 2.4)
        .lineTo(px + 1.6, ripY + 0.2)
        .lineTo(px - 2.4, ripY + 0.2)
        .stroke({ color, width, cap: 'round', join: 'round' });
    };

    drawRipStrokes(PALETTE.INK_OUTLINE, 3.8);
    drawRipStrokes(PALETTE.CREAM_WHITE, 1.8);

    // Small wildflower offering at base of grave (no health bar above grave!)
    g.circle(ex - rPx * 0.45, ey + 4, 4.2)
      .fill({ color: PALETTE.BLUSH_ROSE })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
    g.circle(ex + rPx * 0.45, ey + 4, 3.8)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
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
   * Floating Crown / Rhombus & Radiant Lines above Special, Elite, Mini-Boss, and Final Boss enemies
   * (Replaces circles & dashed circles around special enemies).
   */
  public static drawSpecialOrEliteCrestAbove(
    g: PIXI.Graphics,
    e: SimEnemy,
    ex: number,
    cy: number,
    rPx: number,
    elapsedSeconds: number
  ): void {
    const bob = Math.sin(elapsedSeconds * 5.2 + e.id * 0.9) * 2.4;
    const crestY = cy - rPx * 1.18 - 10 + bob;
    const isBossTier = e.isFinalBoss || e.isMiniBoss;
    const primaryCol = isBossTier
      ? PALETTE.CRIMSON_WARN
      : e.isSpecial
        ? PALETTE.GOLD_STAR
        : PALETTE.BUTTER_YELLOW;
    const secondaryCol = isBossTier ? PALETTE.GOLD_STAR : PALETTE.CREAM_WHITE;

    // 1. Radiant vertical & angled accent lines above the crest
    const lineRays: ReadonlyArray<readonly [number, number, number, number]> = [
      [-12, -3, -17, -9],
      [-6, -6, -8, -13],
      [0, -8, 0, -16],
      [6, -6, 8, -13],
      [12, -3, 17, -9],
    ];
    for (let i = 0; i < lineRays.length; i++) {
      const [x1, y1, x2, y2] = lineRays[i]!;
      const pulse = 0.75 + 0.25 * Math.sin(elapsedSeconds * 8 + i + e.id);
      g.moveTo(ex + x1, crestY + y1)
        .lineTo(ex + x2, crestY + y2)
        .stroke({
          color: i % 2 === 0 ? primaryCol : secondaryCol,
          width: 2.2,
          alpha: 0.92 * pulse,
          cap: 'round',
        });
    }

    if (e.isSpecial || isBossTier) {
      // 3-spired sovereign crown + center floating rhombus jewel for Special & Boss enemies
      g.moveTo(ex - 11, crestY + 3)
        .lineTo(ex - 9, crestY - 5)
        .lineTo(ex - 4, crestY - 1)
        .lineTo(ex, crestY - 8)
        .lineTo(ex + 4, crestY - 1)
        .lineTo(ex + 9, crestY - 5)
        .lineTo(ex + 11, crestY + 3)
        .closePath()
        .fill({ color: primaryCol, alpha: 0.96 })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0, join: 'round' });

      // Floating center rhombus gem inside/above the crown
      g.moveTo(ex, crestY - 4.5)
        .lineTo(ex + 3.2, crestY - 0.5)
        .lineTo(ex, crestY + 3.0)
        .lineTo(ex - 3.2, crestY - 0.5)
        .closePath()
        .fill({ color: secondaryCol })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.3 });
    } else {
      // Floating twin-horn rhombus crest for Elites
      g.moveTo(ex, crestY - 6.5)
        .lineTo(ex + 5.5, crestY)
        .lineTo(ex, crestY + 5.5)
        .lineTo(ex - 5.5, crestY)
        .closePath()
        .fill({ color: primaryCol, alpha: 0.96 })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0 });

      g.moveTo(ex, crestY - 3.0)
        .lineTo(ex + 2.4, crestY)
        .lineTo(ex, crestY + 2.4)
        .lineTo(ex - 2.4, crestY)
        .closePath()
        .fill({ color: secondaryCol });
    }
  }

  /**
   * Sophisticated crystalline snowflake & frost-needle overlay for enemies slowed by Frost Touch
   * (No blue circles!).
   */
  public static drawFrostTouchFilter(
    g: PIXI.Graphics,
    ex: number,
    cy: number,
    rPx: number,
    elapsedSeconds: number,
    enemyId: number
  ): void {
    const flakeCount = 3;
    for (let f = 0; f < flakeCount; f++) {
      const orbitA =
        elapsedSeconds * (1.35 + f * 0.25) +
        enemyId * 1.47 +
        (f * Math.PI * 2) / flakeCount;
      const dist = rPx * (0.48 + (f % 2) * 0.28);
      const fx = ex + Math.cos(orbitA) * dist;
      const fy =
        cy - rPx * 0.15 + Math.sin(orbitA * 1.3) * (rPx * 0.42);
      const flakeSize = (6.2 + (f === 0 ? 2.0 : 0)) * (0.88 + 0.12 * Math.sin(elapsedSeconds * 6 + f));
      const spin = elapsedSeconds * (f % 2 === 0 ? 1.8 : -1.5) + f * 0.9;

      // Draw 6-pointed crystalline snowflake with dendrite side-branches
      for (let arm = 0; arm < 6; arm++) {
        const a = spin + (arm * Math.PI) / 3;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        const tipX = fx + cosA * flakeSize;
        const tipY = fy + sinA * flakeSize;

        g.moveTo(fx, fy)
          .lineTo(tipX, tipY)
          .stroke({
            color: arm % 2 === 0 ? PALETTE.CREAM_WHITE : 0xbae6fd,
            width: 1.9,
            alpha: 0.94,
            cap: 'round',
          });

        // Side crystal barbs on each arm
        const midX = fx + cosA * (flakeSize * 0.56);
        const midY = fy + sinA * (flakeSize * 0.56);
        const barbLen = flakeSize * 0.38;
        const b1 = a + Math.PI / 3;
        const b2 = a - Math.PI / 3;
        g.moveTo(midX + Math.cos(b1) * barbLen, midY + Math.sin(b1) * barbLen)
          .lineTo(midX, midY)
          .lineTo(midX + Math.cos(b2) * barbLen, midY + Math.sin(b2) * barbLen)
          .stroke({
            color: PALETTE.SKY_BLUE,
            width: 1.35,
            alpha: 0.88,
            cap: 'round',
            join: 'round',
          });
      }

      // Crisp diamond ice crystal core at the center of the snowflake
      g.moveTo(fx, fy - 2.2)
        .lineTo(fx + 2.2, fy)
        .lineTo(fx, fy + 2.2)
        .lineTo(fx - 2.2, fy)
        .closePath()
        .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.95 });
    }
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
