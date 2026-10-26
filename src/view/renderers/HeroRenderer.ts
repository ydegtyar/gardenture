import * as PIXI from 'pixi.js';
import { PALETTE, PERSONAS, PROFESSIONS, WEAPONS } from '../../content/data/catalog';
import { clamp, lerp } from '../../core/math/vec2';
import type { Simulation } from '../../sim/Simulation';
import { resolveHeroSpriteKey, type SpriteKey } from '../SpriteAtlas';
import { PPU } from './EnvironmentRenderer';

/**
 * Renders the Hero character using the Bestiary sprite from SpriteAtlas,
 * combined with articulated walking legs, articulated arm + Garden Blade attachment,
 * Halberd, Ember Guard flame barrier, Death Grave collapse animation,
 * and Victory white Angel Wings ascension animation.
 */
export class HeroRenderer {
  public static drawHero(
    heroUnderGraphic: PIXI.Graphics,
    heroSprite: PIXI.Sprite,
    heroWeaponGraphic: PIXI.Graphics,
    atlasTextures: Map<SpriteKey, PIXI.Texture>,
    sim: Simulation,
    alpha: number,
    displayFacingAngle: number
  ): void {
    const gUnder = heroUnderGraphic;
    const gOver = heroWeaponGraphic;
    gUnder.clear();
    gOver.clear();

    const hx = lerp(sim.heroPrevX, sim.heroX, alpha) * PPU;
    const hy = lerp(sim.heroPrevY, sim.heroY, alpha) * PPU;
    const prof = PROFESSIONS[sim.professionId] ?? PROFESSIONS.warden!;
    const speed = Math.hypot(sim.heroVx, sim.heroVy);
    const isMoving = speed > 0.25;
    const walkPhase = sim.elapsedSeconds * 14;
    const bobY = isMoving
      ? Math.abs(Math.sin(walkPhase)) * -4.0
      : Math.sin(sim.elapsedSeconds * 3.5) * -1.5;

    // Victory sequence: Hero sprouts white Angel Wings and flies skyward!
    const isWinningAscension = sim.victorySequenceTimer > 0;
    const winProgress = isWinningAscension
      ? clamp(1 - sim.victorySequenceTimer / 1.85, 0, 1)
      : 0;
    const flyHeightOffset = isWinningAscension
      ? -Math.pow(winProgress, 1.35) * 92 - Math.sin(sim.elapsedSeconds * 10) * 5
      : 0;

    // Death sequence: Hero collapses and leaves a stone grave before fading to Game Over
    const isDyingSequence = sim.deathSequenceTimer > 0;
    const deathProgress = isDyingSequence
      ? clamp(1 - sim.deathSequenceTimer / 1.65, 0, 1)
      : 0;

    // Dash Invisibility Frames visual feedback
    const isDashInvisible = sim.dashIframeTimer > 0 || sim.dashTimer > 0;
    const currentAlpha = isDyingSequence
      ? clamp(1 - deathProgress * 0.85, 0.15, 1)
      : isDashInvisible
        ? 0.42 + 0.18 * Math.sin(sim.elapsedSeconds * 45)
        : 1.0;

    gUnder.alpha = currentAlpha;
    gOver.alpha = currentAlpha;

    // Ground contact shadow (shrinks as hero ascends on victory)
    const shadowScale = isWinningAscension ? clamp(1 - winProgress * 0.65, 0.3, 1) : 1.0;
    gUnder.ellipse(hx, hy + 13, 16 * shadowScale, 8.5 * shadowScale).fill({
      color: 0x0f131d,
      alpha: 0.42 * shadowScale,
    });

    if (isWinningAscension) {
      // Golden ascension light pillar & floating white angel feathers
      const beamAlpha = 0.22 + 0.12 * Math.sin(sim.elapsedSeconds * 8);
      gUnder.ellipse(hx, hy + 10, 28, 13).fill({
        color: PALETTE.BUTTER_YELLOW,
        alpha: beamAlpha + 0.12,
      });
      gUnder.rect(hx - 20, hy + flyHeightOffset - 60, 40, 80 - flyHeightOffset).fill({
        color: PALETTE.BUTTER_YELLOW,
        alpha: beamAlpha * 0.55,
      });
      for (let f = 0; f < 6; f++) {
        const fPhase = (sim.elapsedSeconds * 1.8 + f * 0.19) % 1;
        const fx = hx + Math.sin(f * 2.1 + sim.elapsedSeconds * 3) * 26;
        const fy = hy + flyHeightOffset + 24 - fPhase * 52;
        gUnder
          .ellipse(fx, fy, 4.5, 2.0)
          .fill({ color: 0xffffff, alpha: (1 - fPhase) * 0.9 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1, alpha: (1 - fPhase) * 0.6 });
      }
    }

    if (isDyingSequence) {
      // Soul wisps rising as the hero collapses and leaves their grave
      for (let w = 0; w < 5; w++) {
        const wPhase = (deathProgress * 1.4 + w * 0.2) % 1;
        const wx = hx + Math.sin(w * 1.7 + sim.elapsedSeconds * 5) * 16;
        const wy = hy - wPhase * 42;
        gOver.circle(wx, wy, 3.5 * (1 - wPhase * 0.5)).fill({
          color: PALETTE.MINT_GREEN,
          alpha: (1 - wPhase) * 0.85,
        });
      }
    }

    // Shield Power-Up active bubble
    if (sim.shieldHp > 0) {
      gUnder
        .circle(hx, hy + flyHeightOffset, 26)
        .fill({ color: PALETTE.SKY_BLUE, alpha: 0.22 })
        .stroke({ color: PALETTE.SKY_BLUE, width: 2.5, alpha: 0.85 });
    }

    // Ember Guard ("fire_breath") active flame barrier ring & orbiting fireballs
    if (sim.fireBreathTimer > 0) {
      const egRadiusPx = 2.1 * sim.stats.areaMult * PPU;
      const pulse = 0.85 + 0.15 * Math.sin(sim.elapsedSeconds * 16);
      gUnder
        .circle(hx, hy + flyHeightOffset, egRadiusPx * pulse)
        .fill({ color: 0xfb923c, alpha: 0.09 })
        .stroke({ color: 0xfb923c, width: 3, alpha: 0.68 });
      const orbCount = 4;
      for (let i = 0; i < orbCount; i++) {
        const a = sim.elapsedSeconds * 5.2 + (i / orbCount) * Math.PI * 2;
        const ox = hx + Math.cos(a) * egRadiusPx;
        const oy = hy + flyHeightOffset + Math.sin(a) * egRadiusPx;
        const tailA = a - 0.28;
        gUnder
          .circle(
            hx + Math.cos(tailA) * egRadiusPx,
            hy + flyHeightOffset + Math.sin(tailA) * egRadiusPx,
            5.5
          )
          .fill({ color: 0xf43f5e, alpha: 0.55 });
        gUnder
          .circle(ox, oy, 7.5)
          .fill({ color: 0xfb923c, alpha: 0.95 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
        gUnder.circle(ox, oy, 3.8).fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.95 });
      }
    }

    // Dash phase ring around hero while invisible
    if (isDashInvisible) {
      gUnder.circle(hx, hy + flyHeightOffset, 22).stroke({
        color: PALETTE.SKY_BLUE,
        width: 2,
        alpha: 0.75,
      });
    }

    const customPersona =
      sim.personaId && sim.personaId !== 'adventurer_default'
        ? PERSONAS.find((p) => p.id === sim.personaId)
        : undefined;

    const bodyColor =
      sim.hitFlashTimer > 0
        ? PALETTE.CREAM_WHITE
        : isDashInvisible
          ? PALETTE.SKY_BLUE
          : (customPersona?.cloakColor ?? prof.primaryColor);
    const accentColor =
      sim.hitFlashTimer > 0
        ? PALETTE.CREAM_WHITE
        : isDashInvisible
          ? PALETTE.CREAM_WHITE
          : (customPersona?.accentColor ?? prof.accentColor);

    // Animated legs beneath Bestiary hero sprite
    if (!isDyingSequence) {
      HeroRenderer.drawCharacterLegs(
        gUnder,
        hx,
        hy + flyHeightOffset,
        isMoving && !isWinningAscension,
        walkPhase,
        displayFacingAngle,
        accentColor,
        bodyColor
      );
    }

    const collapseDropY = isDyingSequence ? deathProgress * 10 : 0;
    const cy = hy + bobY + flyHeightOffset + collapseDropY;

    // Draw articulated White Angel Wings behind the hero during Victory sequence!
    if (isWinningAscension) {
      HeroRenderer.drawHeroAngelWings(gUnder, hx, cy, sim.elapsedSeconds, winProgress);
    }

    // Update the Hero PIXI.Sprite from Bestiary SpriteAtlas
    const spriteKey = resolveHeroSpriteKey(sim.professionId);
    const tex = atlasTextures.get(spriteKey);
    if (tex && heroSprite.texture !== tex) {
      heroSprite.texture = tex;
    }
    heroSprite.visible = true;
    heroSprite.anchor.set(0.5, 0.56);
    heroSprite.position.set(hx, cy);
    heroSprite.alpha = currentAlpha;

    const baseScale = 58 / 256;
    const facingCos = Math.cos(displayFacingAngle);
    const flipX = facingCos < -0.15 ? -1 : 1;
    const squashX = isMoving
      ? 1 + Math.sin(walkPhase * 2) * 0.045
      : 1 + Math.sin(sim.elapsedSeconds * 3.5) * 0.015;
    const squashY = isDyingSequence
      ? clamp(1 - deathProgress * 0.45, 0.5, 1)
      : isMoving
        ? 1 - Math.sin(walkPhase * 2) * 0.045
        : 1 - Math.sin(sim.elapsedSeconds * 3.5) * 0.015;

    heroSprite.scale.set(baseScale * squashX * flipX, baseScale * squashY);
    heroSprite.rotation = isDyingSequence
      ? deathProgress * 0.65 * flipX
      : isMoving && !isWinningAscension
        ? Math.sin(walkPhase) * 0.075
        : 0;

    if (sim.hitFlashTimer > 0) {
      heroSprite.tint = 0xffffff;
      gOver.circle(hx, cy - 4, 18).fill({ color: PALETTE.CREAM_WHITE, alpha: 0.55 });
    } else if (isDashInvisible) {
      heroSprite.tint = PALETTE.SKY_BLUE;
    } else if (customPersona) {
      heroSprite.tint = customPersona.cloakColor;
    } else {
      heroSprite.tint = 0xffffff;
    }

    // Draw attached weapons & articulated hero arm in front of hero sprite
    if (!isDyingSequence) {
      const swordWpn = sim.weapons.find((w) => w.id === 'garden_blade');
      if (swordWpn) {
        HeroRenderer.drawHeroSword(
          gOver,
          hx,
          cy,
          displayFacingAngle,
          swordWpn,
          sim.elapsedSeconds,
          bodyColor,
          accentColor
        );
      }
      const spearWpn = sim.weapons.find((w) => w.id === 'thorn_spear');
      if (spearWpn) {
        HeroRenderer.drawHeroHalberd(
          gOver,
          hx,
          cy,
          displayFacingAngle,
          spearWpn,
          sim.elapsedSeconds
        );
      }
    }
  }

  /**
   * Renders grand white feathered Angel Wings & golden halo when the hero wins the run.
   */
  private static drawHeroAngelWings(
    g: PIXI.Graphics,
    hx: number,
    cy: number,
    elapsedSeconds: number,
    winProgress: number
  ): void {
    const wingScale = clamp(winProgress * 2.4, 0.35, 1.0);
    const flapAngle = Math.sin(elapsedSeconds * 13) * 0.34;

    // Radiant golden halo above hero's head
    g.ellipse(hx, cy - 29, 12 * wingScale, 4.5 * wingScale).stroke({
      color: PALETTE.GOLD_STAR,
      width: 3,
      alpha: 0.95,
    });

    for (const side of [-1, 1] as const) {
      const m = new PIXI.Matrix();
      m.scale(side * wingScale, wingScale);
      m.rotate(side * (-0.22 + flapAngle));
      m.translate(hx + side * 8, cy - 6);

      // Outer primary wing pinion
      g.moveTo(0, 0)
        .bezierCurveTo(14, -22, 34, -26, 44, -12)
        .bezierCurveTo(38, -2, 26, 6, 4, 8)
        .closePath()
        .setTransform(m)
        .fill({ color: 0xffffff, alpha: 0.98 })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });

      // Layered secondary feathers
      for (let f = 0; f < 4; f++) {
        const fx = 10 + f * 7.5;
        const fy = -8 - f * 2.2;
        g.ellipse(fx, fy, 9 - f * 1.1, 4.2)
          .setTransform(m)
          .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.96 })
          .stroke({ color: 0x93c5fd, width: 1.2, alpha: 0.7 });
      }
    }
    g.setTransform(new PIXI.Matrix());
  }

  public static drawCharacterLegs(
    g: PIXI.Graphics,
    hx: number,
    hy: number,
    isMoving: boolean,
    walkPhase: number,
    facingAngle: number,
    bootColor: number,
    legColor: number
  ): void {
    const strideX = Math.cos(facingAngle);
    const strideY = Math.sin(facingAngle);
    const leftSwing = isMoving ? Math.sin(walkPhase) : 0;
    const rightSwing = isMoving ? Math.sin(walkPhase + Math.PI) : 0;

    const leftHipX = hx - 5;
    const leftHipY = hy + 4;
    const rightHipX = hx + 5;
    const rightHipY = hy + 4;

    const leftFootX = leftHipX + leftSwing * strideX * 7;
    const leftFootY =
      leftHipY + 8 + leftSwing * strideY * 3.5 - Math.max(0, leftSwing) * 4.5;

    const rightFootX = rightHipX + rightSwing * strideX * 7;
    const rightFootY =
      rightHipY + 8 + rightSwing * strideY * 3.5 - Math.max(0, rightSwing) * 4.5;

    g.moveTo(leftHipX, leftHipY)
      .lineTo(leftFootX, leftFootY)
      .stroke({ color: PALETTE.INK_OUTLINE, width: 6.5, cap: 'round' });
    g.moveTo(leftHipX, leftHipY)
      .lineTo(leftFootX, leftFootY)
      .stroke({ color: legColor, width: 3.5, cap: 'round' });
    g.ellipse(leftFootX + strideX * 1.8, leftFootY, 4.5, 3.0)
      .fill({ color: bootColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

    g.moveTo(rightHipX, rightHipY)
      .lineTo(rightFootX, rightFootY)
      .stroke({ color: PALETTE.INK_OUTLINE, width: 6.5, cap: 'round' });
    g.moveTo(rightHipX, rightHipY)
      .lineTo(rightFootX, rightFootY)
      .stroke({ color: legColor, width: 3.5, cap: 'round' });
    g.ellipse(rightFootX + strideX * 1.8, rightFootY, 4.5, 3.0)
      .fill({ color: bootColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
  }

  /**
   * Draws an articulated hero arm (shoulder -> elbow -> gloved hand) properly attached
   * to the hero's shoulder for all 4 professions, gripping the Garden Blade / Verdant Edge.
   */
  public static drawHeroSword(
    g: PIXI.Graphics,
    hx: number,
    cy: number,
    facingAngle: number,
    swordWpn: {
      level: number;
      evolved: boolean;
      phase: string;
      phaseTimer: number;
      swingCounter: number;
    },
    elapsedSeconds: number,
    sleeveColor: number,
    cuffColor: number
  ): void {
    const def = WEAPONS.garden_blade;
    const bladeColor = swordWpn.evolved
      ? (def?.evolvedColor ?? PALETTE.GOLD_STAR)
      : (def?.color ?? PALETTE.MINT_GREEN);
    const swingDir = swordWpn.swingCounter % 2 === 0 ? 1 : -1;

    let localAngleOffset = swingDir * -0.58 + Math.sin(elapsedSeconds * 4.5) * 0.06;
    let reachOffset = 13;

    if (swordWpn.phase === 'windup') {
      const t = clamp(1 - swordWpn.phaseTimer / 0.06, 0, 1);
      localAngleOffset = lerp(swingDir * -0.58, swingDir * -1.28, t);
      reachOffset = lerp(13, 10, t);
    } else if (swordWpn.phase === 'active') {
      const t = clamp(1 - swordWpn.phaseTimer / 0.08, 0, 1);
      const easeOut = 1 - Math.pow(1 - t, 2);
      localAngleOffset = lerp(swingDir * -1.28, swingDir * 1.28, easeOut);
      reachOffset = 17;
    } else if (swordWpn.phase === 'recovery') {
      const t = clamp(1 - swordWpn.phaseTimer / 0.05, 0, 1);
      localAngleOffset = lerp(swingDir * 1.28, -swingDir * -0.58, t);
      reachOffset = lerp(17, 13, t);
    }

    const totalAngle = facingAngle + localAngleOffset;

    // Articulated hero arm connecting the hero's right shoulder to the sword grip
    const shoulderAngle = facingAngle + 0.52;
    const shoulderX = hx + Math.cos(shoulderAngle) * 9.5;
    const shoulderY = cy - 2 + Math.sin(shoulderAngle) * 7.5;

    const handX =
      hx + Math.cos(totalAngle) * reachOffset - Math.sin(totalAngle) * 2.5;
    const handY =
      cy + Math.sin(totalAngle) * reachOffset + Math.cos(totalAngle) * 2.5;

    const midX = (shoulderX + handX) * 0.5 + Math.cos(totalAngle + 0.9) * 3.5;
    const midY = (shoulderY + handY) * 0.5 + Math.sin(totalAngle + 0.9) * 3.5;

    // Upper sleeve + forearm with bold ink outline
    g.moveTo(shoulderX, shoulderY)
      .lineTo(midX, midY)
      .lineTo(handX, handY)
      .stroke({ color: PALETTE.INK_OUTLINE, width: 7.5, cap: 'round', join: 'round' });
    g.moveTo(shoulderX, shoulderY)
      .lineTo(midX, midY)
      .stroke({ color: sleeveColor, width: 4.5, cap: 'round' });
    g.moveTo(midX, midY)
      .lineTo(handX, handY)
      .stroke({ color: cuffColor, width: 4.0, cap: 'round' });

    const m = new PIXI.Matrix();
    m.rotate(totalAngle);
    m.translate(hx, cy);

    const bladeLen = 22 + Math.min(8, swordWpn.level) * 1.1 + (swordWpn.evolved ? 5 : 0);
    const bladeHalfW = swordWpn.evolved ? 4.8 : 3.8;

    // Pommel & leather-wrapped hilt
    g.circle(reachOffset - 5.5, 2.5, 3.0)
      .setTransform(m)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

    g.moveTo(reachOffset - 4, 2.5)
      .lineTo(reachOffset + 2, 2.5)
      .setTransform(m)
      .stroke({ color: 0x78350f, width: 4, cap: 'round' });

    // Leaf-shaped crossguard
    g.moveTo(reachOffset + 1, -4.5)
      .lineTo(reachOffset + 3.5, 2.5)
      .lineTo(reachOffset + 1, 9.5)
      .lineTo(reachOffset - 1, 2.5)
      .closePath()
      .setTransform(m)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

    // Tapered botanical broadsword blade
    g.moveTo(reachOffset + 2.5, 2.5 - bladeHalfW)
      .lineTo(reachOffset + bladeLen - 5, 2.5 - bladeHalfW * 0.65)
      .lineTo(reachOffset + bladeLen, 2.5)
      .lineTo(reachOffset + bladeLen - 5, 2.5 + bladeHalfW * 0.65)
      .lineTo(reachOffset + 2.5, 2.5 + bladeHalfW)
      .closePath()
      .setTransform(m)
      .fill({ color: bladeColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });

    // Central fuller highlight
    g.moveTo(reachOffset + 4, 2.5)
      .lineTo(reachOffset + bladeLen - 3, 2.5)
      .setTransform(m)
      .stroke({ color: PALETTE.CREAM_WHITE, width: 1.5, alpha: 0.85 });

    // Gloved hero hand gripping the hilt
    g.circle(reachOffset - 1.2, 2.5, 3.8)
      .setTransform(m)
      .fill({ color: PALETTE.CREAM_WHITE })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });

    g.setTransform(new PIXI.Matrix());
  }

  public static drawHeroHalberd(
    g: PIXI.Graphics,
    hx: number,
    cy: number,
    facingAngle: number,
    spearWpn: {
      level: number;
      evolved: boolean;
      phase: string;
      phaseTimer: number;
      swingCounter: number;
    },
    elapsedSeconds: number
  ): void {
    const def = WEAPONS.thorn_spear;
    const headColor = spearWpn.evolved
      ? (def?.evolvedColor ?? PALETTE.CRIMSON_WARN)
      : (def?.color ?? PALETTE.BLUSH_ROSE);

    let localAngleOffset = 0.42 + Math.sin(elapsedSeconds * 4.0) * 0.05;
    let thrustOffset = 9;

    if (spearWpn.phase === 'windup') {
      const t = clamp(1 - spearWpn.phaseTimer / 0.06, 0, 1);
      localAngleOffset = lerp(0.42, 0.06, t);
      thrustOffset = lerp(9, 2, t);
    } else if (spearWpn.phase === 'active') {
      const t = clamp(1 - spearWpn.phaseTimer / 0.08, 0, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);
      localAngleOffset = 0;
      thrustOffset = lerp(2, 24, easeOut);
    } else if (spearWpn.phase === 'recovery') {
      const t = clamp(1 - spearWpn.phaseTimer / 0.05, 0, 1);
      localAngleOffset = lerp(0, 0.42, t);
      thrustOffset = lerp(24, 9, t);
    }

    const totalAngle = facingAngle + localAngleOffset;
    const m = new PIXI.Matrix();
    m.rotate(totalAngle);
    m.translate(hx, cy);

    const shaftStart = thrustOffset - 12;
    const shaftEnd =
      thrustOffset + 22 + Math.min(8, spearWpn.level) * 1.1 + (spearWpn.evolved ? 5 : 0);

    g.circle(shaftStart, -3, 2.6)
      .setTransform(m)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

    g.moveTo(shaftStart + 2, -3)
      .lineTo(shaftEnd - 6, -3)
      .setTransform(m)
      .stroke({ color: PALETTE.INK_OUTLINE, width: 5.5, cap: 'round' });
    g.moveTo(shaftStart + 2, -3)
      .lineTo(shaftEnd - 6, -3)
      .setTransform(m)
      .stroke({ color: 0x92400e, width: 2.8, cap: 'round' });

    g.moveTo(shaftEnd - 12, -4)
      .lineTo(shaftEnd - 5, -13)
      .lineTo(shaftEnd - 1, -10)
      .lineTo(shaftEnd - 4, -4)
      .closePath()
      .setTransform(m)
      .fill({ color: headColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });

    g.moveTo(shaftEnd - 11, -2)
      .lineTo(shaftEnd - 9, 4)
      .lineTo(shaftEnd - 5, -2)
      .closePath()
      .setTransform(m)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

    g.moveTo(shaftEnd - 8, -6.5)
      .lineTo(shaftEnd + 7, -3)
      .lineTo(shaftEnd - 8, 0.5)
      .closePath()
      .setTransform(m)
      .fill({ color: headColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });

    g.moveTo(shaftEnd - 6, -3)
      .lineTo(shaftEnd + 4, -3)
      .setTransform(m)
      .stroke({ color: PALETTE.CREAM_WHITE, width: 1.4, alpha: 0.85 });

    g.setTransform(new PIXI.Matrix());
  }
}
