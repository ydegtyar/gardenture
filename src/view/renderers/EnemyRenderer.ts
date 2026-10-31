import * as PIXI from 'pixi.js';
import { PALETTE } from '../../content/data/catalog';
import { clamp, lerp } from '../../core/math/vec2';
import type { Simulation } from '../../sim/Simulation';
import { resolveEnemySpriteKey, type SpriteKey } from '../SpriteAtlas';
import { PPU } from './EnvironmentRenderer';
import {
  enemyRegistry,
  drawArenaFlowerModel,
  drawHeroGraveModel,
  drawEnemyLegs,
  drawSpecialOrEliteCrestAbove,
  drawFrostTouchFilter,
  drawSpiderWebGlueDebuff,
  drawThornBriarDebuff,
  drawPoisonDropIcon,
  type EnemyRenderContext,
} from './enemies';

/**
 * Facade renderer for enemies and bosses.
 * Uses the Strategy Pattern via `enemyRegistry` to dispatch telegraphs,
 * custom animations, transformations, and overlays without `if/else` checks.
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
        drawArenaFlowerModel(gOver, e, ex, ey, rPx, sim.elapsedSeconds);
        continue;
      }

      // Stationary Hero Grave (left behind by Second Wind or Hero Death)
      if (e.isHeroGrave) {
        drawHeroGraveModel(gOver, e, ex, ey, rPx, sim.elapsedSeconds);
        continue;
      }

      const cosA = Math.cos(e.facingAngle);
      const sinA = Math.sin(e.facingAngle);
      const accentColor = e.hitFlashTimer > 0 ? PALETTE.CREAM_WHITE : e.accentColor;

      const renderCtx: EnemyRenderContext = {
        enemy: e,
        sim,
        ex,
        ey,
        rPx,
        cosA,
        sinA,
        walkPhase,
        isMoving,
        accentColor,
        gUnder,
        gOver,
        telegraphGraphic,
      };

      // Retrieve Strategy Renderer for this enemy
      const behavior = enemyRegistry.get(e);

      // Draw Active Enemy Telegraphs
      if (e.aiState === 'telegraph') {
        const progress = clamp(1 - e.aiTimer / e.telegraphDuration, 0, 1);
        if (behavior.drawTelegraph) {
          behavior.drawTelegraph(renderCtx, progress);
        } else {
          // Standard radial charge/slam telegraph (Brute / generic)
          const slamRadiusPx = (e.isMiniBoss ? 2.15 : 1.85) * PPU;
          const easeGrow = 0.16 + 0.84 * Math.pow(progress, 0.85);
          const growR = slamRadiusPx * easeGrow;
          const flashWindow = clamp((progress - 0.78) / 0.22, 0, 1);

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

          const ripplePhase = (sim.elapsedSeconds * 4.5) % 1;
          const rippleR = growR * (0.35 + 0.55 * ripplePhase);
          telegraphGraphic.circle(ex, ey, rippleR).stroke({
            color: PALETTE.BUTTER_YELLOW,
            width: 1.8,
            alpha: (0.38 + 0.35 * progress) * (1 - ripplePhase * 0.5),
          });

          if (flashWindow > 0) {
            telegraphGraphic.circle(ex, ey, growR * (0.35 + 0.55 * flashWindow)).fill({
              color: PALETTE.CREAM_WHITE,
              alpha: 0.52 * flashWindow,
            });
          }
        }
      }

      const isFrostTouched =
        e.slowTimer > 0 && e.webSlowTimer <= 0 && (e.thornSlowTimer ?? 0) <= 0;

      // Draw animated legs if enemy type has walking legs
      if (behavior.hasLegs ? behavior.hasLegs(e) : true) {
        drawEnemyLegs(
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

      // Special and Elite enemies use visibly larger scale
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

      // Apply archetype or boss specific transform modifications via Strategy
      if (behavior.modifyTransform) {
        const mods = behavior.modifyTransform(renderCtx, cy);
        if (typeof mods.renderX === 'number') renderX = mods.renderX;
        if (typeof mods.cy === 'number') cy = mods.cy;
        if (typeof mods.animScaleX === 'number') animScaleX *= mods.animScaleX;
        if (typeof mods.animScaleY === 'number') animScaleY *= mods.animScaleY;
        if (typeof mods.animRotation === 'number') animRotation = mods.animRotation;
      }

      // Draw custom overlays via Strategy (mouth nozzles, shields, sunflower cues, etc.)
      if (behavior.drawOverlay) {
        behavior.drawOverlay(renderCtx, renderX, cy);
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
      } else if ((e.thornSlowTimer ?? 0) > 0) {
        sprite.tint = 0xfbcfe8;
      } else if (e.burnTimer > 0) {
        sprite.tint = 0xfdba74;
      } else if (e.poisonTimer > 0) {
        sprite.tint = 0xbbf7d0;
      } else {
        sprite.tint = 0xffffff;
      }

      // Frost Touch blue filter
      if (isFrostTouched) {
        drawFrostTouchFilter(gOver, renderX, cy, rPx, sim.elapsedSeconds, e.id);
      }

      // Spider-Web Glue slow debuff
      if (e.webSlowTimer > 0) {
        drawSpiderWebGlueDebuff(gOver, renderX, cy, rPx, sim.elapsedSeconds, e.id);
      }

      // Briar Thorns slow debuff
      if ((e.thornSlowTimer ?? 0) > 0) {
        drawThornBriarDebuff(gOver, renderX, cy, rPx, sim.elapsedSeconds, e.id);
      }

      // Storm Mark zap sparkles
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

      // Floating Crown / Rhombus & Radiant Lines above Special, Elite, and Boss enemies
      if (e.isSpecial || e.isElite || e.isMiniBoss || e.isFinalBoss) {
        drawSpecialOrEliteCrestAbove(
          gOver,
          e,
          renderX,
          cy,
          rPx,
          sim.elapsedSeconds
        );
      }

      // Poison Status
      if (e.poisonTimer > 0) {
        const dropBaseY = e.stormMarkTimer > 0 ? cy - rPx - 28 : cy - rPx - 13;
        drawPoisonDropIcon(
          gOver,
          renderX,
          dropBaseY,
          cy,
          rPx,
          sim.elapsedSeconds,
          e.id
        );
      }

      // Overhead HP Bar & Bestiary Sandbox Indicators
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

    // Hide any unused pooled enemy sprites
    for (let i = spritePoolIndex; i < enemySpritePool.length; i++) {
      enemySpritePool[i]!.visible = false;
    }
  }

  // Preserve public static helpers for backwards-compatibility
  public static drawEnemyLegs = drawEnemyLegs;
  public static drawArenaFlowerModel = drawArenaFlowerModel;
  public static drawHeroGraveModel = drawHeroGraveModel;
  public static drawSpecialOrEliteCrestAbove = drawSpecialOrEliteCrestAbove;
  public static drawFrostTouchFilter = drawFrostTouchFilter;
  public static drawSpiderWebGlueDebuff = drawSpiderWebGlueDebuff;
  public static drawThornBriarDebuff = drawThornBriarDebuff;
  public static drawPoisonDropIcon = drawPoisonDropIcon;
}
