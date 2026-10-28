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
  private static thunderEyeTrail: Array<{
    lx: number;
    ly: number;
    rx: number;
    ry: number;
    t: number;
  }> = [];

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
    const animTime =
      sim.elapsedSeconds +
      (sim.victorySequenceTimer > 0 ? 1.95 - sim.victorySequenceTimer : 0) +
      (sim.deathSequenceTimer > 0 ? 1.65 - sim.deathSequenceTimer : 0);
    const walkPhase = animTime * 14;
    const isLevitatingThunderGod = sim.personaId === 'stormcaller_gojo_killua';
    const bobY = isLevitatingThunderGod
      ? Math.sin(animTime * 4.2) * 3.8 - 6.0
      : isMoving
        ? Math.abs(Math.sin(walkPhase)) * -4.0
        : Math.sin(animTime * 3.5) * -1.5;

    // Victory sequence: Hero sprouts white Angel Wings and flies skyward ONLY after Final Boss death animation finishes!
    const isWinningAscension = sim.victorySequenceTimer > 0 && sim.bossDeathTimer <= 0;
    const winProgress = isWinningAscension
      ? clamp(1 - sim.victorySequenceTimer / 1.1, 0, 1)
      : 0;
    const flyHeightOffset = isWinningAscension
      ? -Math.pow(winProgress, 1.35) * 92 - Math.sin(animTime * 10) * 5
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
        ? 0.42 + 0.18 * Math.sin(animTime * 45)
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
      const beamAlpha = 0.22 + 0.12 * Math.sin(animTime * 8);
      gUnder.ellipse(hx, hy + 10, 28, 13).fill({
        color: PALETTE.BUTTER_YELLOW,
        alpha: beamAlpha + 0.12,
      });
      gUnder.rect(hx - 20, hy + flyHeightOffset - 60, 40, 80 - flyHeightOffset).fill({
        color: PALETTE.BUTTER_YELLOW,
        alpha: beamAlpha * 0.55,
      });
      for (let f = 0; f < 6; f++) {
        const fPhase = (animTime * 1.8 + f * 0.19) % 1;
        const fx = hx + Math.sin(f * 2.1 + animTime * 3) * 26;
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
        const wx = hx + Math.sin(w * 1.7 + animTime * 5) * 16;
        const wy = hy - wPhase * 42;
        gOver.circle(wx, wy, 3.5 * (1 - wPhase * 0.5)).fill({
          color: PALETTE.MINT_GREEN,
          alpha: (1 - wPhase) * 0.85,
        });
      }
    }

    // Shield Power-Up (Aegis Orb) active crystalline rune ward & orbiting shield crests (no simple circle)
    if (sim.shieldHp > 0) {
      HeroRenderer.drawAegisShieldAura(
        gUnder,
        gOver,
        hx,
        hy + flyHeightOffset,
        animTime,
        sim.shieldHp
      );
    }

    // Ember Guard ("fire_breath") active flame barrier ring & orbiting fireballs
    if (sim.fireBreathTimer > 0) {
      const egRadiusPx = 2.1 * sim.stats.areaMult * PPU;
      const pulse = 0.85 + 0.15 * Math.sin(animTime * 16);
      gUnder
        .circle(hx, hy + flyHeightOffset, egRadiusPx * pulse)
        .fill({ color: 0xfb923c, alpha: 0.09 })
        .stroke({ color: 0xfb923c, width: 3, alpha: 0.68 });
      const orbCount = 4;
      for (let i = 0; i < orbCount; i++) {
        const a = animTime * 5.2 + (i / orbCount) * Math.PI * 2;
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

    // Animated legs beneath Bestiary hero sprite (or poised levitation for Thander Rein)
    if (!isDyingSequence) {
      HeroRenderer.drawCharacterLegs(
        gUnder,
        hx,
        hy + flyHeightOffset,
        isMoving && !isWinningAscension,
        walkPhase,
        displayFacingAngle,
        accentColor,
        bodyColor,
        isLevitatingThunderGod
      );
    }

    const collapseDropY = isDyingSequence ? deathProgress * 10 : 0;
    const cy = hy + bobY + flyHeightOffset + collapseDropY;

    // Draw articulated White Angel Wings behind the hero during Victory sequence!
    if (isWinningAscension) {
      HeroRenderer.drawHeroAngelWings(gUnder, hx, cy, animTime, winProgress);
    }

    // Update the Hero PIXI.Sprite from Bestiary / Persona Skin SpriteAtlas
    const spriteKey = resolveHeroSpriteKey(sim.professionId, sim.personaId);
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
    const squashX = isLevitatingThunderGod
      ? 1 + Math.sin(sim.elapsedSeconds * 4.2) * 0.02
      : isMoving
        ? 1 + Math.sin(walkPhase * 2) * 0.045
        : 1 + Math.sin(sim.elapsedSeconds * 3.5) * 0.015;
    const squashY = isDyingSequence
      ? clamp(1 - deathProgress * 0.45, 0.5, 1)
      : isLevitatingThunderGod
        ? 1 - Math.sin(sim.elapsedSeconds * 4.2) * 0.02
        : isMoving
          ? 1 - Math.sin(walkPhase * 2) * 0.045
          : 1 - Math.sin(sim.elapsedSeconds * 3.5) * 0.015;

    heroSprite.scale.set(baseScale * squashX * flipX, baseScale * squashY);
    heroSprite.rotation = isDyingSequence
      ? deathProgress * 0.65 * flipX
      : isLevitatingThunderGod
        ? isMoving && !isWinningAscension
          ? clamp(sim.heroVx / Math.max(1, sim.stats.moveSpeed), -1, 1) * 0.09
          : Math.sin(sim.elapsedSeconds * 2.5) * 0.022
        : isMoving && !isWinningAscension
          ? Math.sin(walkPhase) * 0.075
          : 0;

    if (sim.hitFlashTimer > 0) {
      heroSprite.tint = 0xffffff;
      gOver.circle(hx, cy - 4, 18).fill({ color: PALETTE.CREAM_WHITE, alpha: 0.55 });
    } else if (isDashInvisible) {
      heroSprite.tint = PALETTE.SKY_BLUE;
    } else {
      heroSprite.tint = 0xffffff;
    }

    // Permanent Arcana Skin visual effects (underfoot aura, orbiting relics, and heterochromia/lightning eye glints)
    if (customPersona && !isDyingSequence) {
      HeroRenderer.drawPersonaPermanentAura(
        gUnder,
        gOver,
        hx,
        cy,
        hy + flyHeightOffset,
        flipX,
        sim.elapsedSeconds,
        customPersona.id,
        customPersona.eyeLeftColor,
        customPersona.eyeRightColor,
        sim.heroVx,
        sim.heroVy
      );
    }

    // Draw attached weapons:
    // - Arbalete ('thorn_spear') is slung in a static diagonal position BEHIND the hero's back (on gUnder) when 'ready',
    //   and brought to the FRONT (on gOver) ONLY during attack phases ('windup', 'active', 'recovery')!
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
        const isAttacking = spearWpn.phase !== 'ready';
        HeroRenderer.drawHeroHalberd(
          isAttacking ? gOver : gUnder,
          hx,
          cy,
          isAttacking ? spearWpn.lockedAngle : displayFacingAngle,
          spearWpn,
          sim.elapsedSeconds,
          !isAttacking,
          flipX
        );
      }
    }
  }

  /**
   * Renders permanent visual effects and heterochromia eye glints for unlocked Arcana Persona skins.
   */
  private static drawPersonaPermanentAura(
    gUnder: PIXI.Graphics,
    gOver: PIXI.Graphics,
    hx: number,
    cy: number,
    groundY: number,
    flipX: number,
    elapsedSeconds: number,
    personaId: string,
    eyeLeftColor: number,
    eyeRightColor: number,
    heroVx = 0,
    heroVy = 0
  ): void {
    // Heterochromia / Lightning glowing eye glints on the character face
    const eyeY = cy - 4.5;
    const leftEyeX = hx - 4.2 * flipX;
    const rightEyeX = hx + 4.2 * flipX;
    const eyePulse = 0.78 + 0.22 * Math.sin(elapsedSeconds * 9);

    if (personaId !== 'stormcaller_gojo_killua') {
      gOver
        .circle(leftEyeX, eyeY, 2.2)
        .fill({ color: eyeLeftColor, alpha: 0.95 * eyePulse });
      gOver
        .circle(rightEyeX, eyeY, 2.2)
        .fill({ color: eyeRightColor, alpha: 0.95 * eyePulse });
    }

    if (personaId === 'warden_zagreus_naruto') {
      // Losti Seige: Uses the classic dark ground shadow under the hero (no pulsing circle, no spinning orbs)
    } else if (personaId === 'seeker_hollow_levi') {
      // Abyssal Void-Shade ring + ODM steam wisps
      gUnder
        .ellipse(hx, groundY + 11, 18, 8.5)
        .fill({ color: 0x0f172a, alpha: 0.36 })
        .stroke({ color: 0x38bdf8, width: 1.8, alpha: 0.75 });
      for (let i = 0; i < 3; i++) {
        const a = elapsedSeconds * 3.6 + (i * Math.PI * 2) / 3;
        const vx = hx + Math.cos(a) * 18;
        const vy = cy + Math.sin(a) * 10;
        gUnder
          .circle(vx, vy, 3.2)
          .fill({ color: i % 2 === 0 ? 0x0f172a : 0xe0f2fe, alpha: 0.85 })
          .stroke({ color: 0x10b981, width: 1.2, alpha: 0.75 });
      }
    } else if (personaId === 'herbalist_frieren_strange') {
      // Rotating Eldritch Mandala & Alchemical Halo
      const r = 21;
      gUnder
        .ellipse(hx, groundY + 10, r, r * 0.52)
        .stroke({ color: 0xfbbf24, width: 2.0, alpha: 0.78 });
      for (let i = 0; i < 3; i++) {
        const a = elapsedSeconds * 2.2 + (i * Math.PI * 2) / 3;
        const mx = hx + Math.cos(a) * 20;
        const my = cy - 5 + Math.sin(a) * 12;
        gOver
          .circle(mx, my, 2.8)
          .fill({ color: i === 0 ? 0x2dd4bf : 0xfbbf24, alpha: 0.9 });
      }
    } else if (personaId === 'stormcaller_gojo_killua') {
      // THANDER REIN:
      // - No blue circle under the hero (uses the dark ground shadow circle instead).
      // - No blue circles on the eyes; both eyes share the same electric color and emit trailing lightning lines directly from the eyes!
      const eyeColor = eyeLeftColor; // Both eyes have identical color (0x38bdf8)
      const coreColor = 0xe0f2fe;

      // Crisp slanted lightning eye slits + ambient eye-corner spark lines (no circles!)
      for (const exPos of [leftEyeX, rightEyeX]) {
        const dir = exPos === leftEyeX ? -flipX : flipX;
        const tailFlickX = -heroVx * 1.4 + dir * 4.8;
        const tailFlickY = -heroVy * 1.4 - 2.2 + Math.sin(elapsedSeconds * 28 + exPos) * 1.2;

        // Sharp glowing eye line + immediate trailing wisp line on each eye
        gOver
          .moveTo(exPos - 2.2 * dir, eyeY + 0.5)
          .lineTo(exPos + 2.0 * dir, eyeY - 0.6)
          .lineTo(exPos + tailFlickX, eyeY + tailFlickY)
          .stroke({ color: eyeColor, width: 3.2, alpha: 0.92 * eyePulse, cap: 'round', join: 'round' });
        gOver
          .moveTo(exPos - 1.8 * dir, eyeY + 0.4)
          .lineTo(exPos + 1.8 * dir, eyeY - 0.5)
          .lineTo(exPos + tailFlickX * 0.85, eyeY + tailFlickY * 0.85)
          .stroke({ color: coreColor, width: 1.5, alpha: 0.98, cap: 'round', join: 'round' });
      }

      // Record & prune world-space eye trail points for movement light trails
      const trail = HeroRenderer.thunderEyeTrail;
      if (
        trail.length > 0 &&
        (elapsedSeconds < trail[trail.length - 1]!.t ||
          Math.hypot(hx - trail[trail.length - 1]!.lx, eyeY - trail[trail.length - 1]!.ly) > 140)
      ) {
        trail.length = 0;
      }

      const speed = Math.hypot(heroVx, heroVy);
      if (speed > 0.2) {
        const last = trail[trail.length - 1];
        if (!last || elapsedSeconds - last.t >= 0.018 || Math.hypot(leftEyeX - last.lx, eyeY - last.ly) >= 4) {
          trail.push({
            lx: leftEyeX,
            ly: eyeY,
            rx: rightEyeX,
            ry: eyeY,
            t: elapsedSeconds,
          });
          if (trail.length > 16) {
            trail.shift();
          }
        }
      }

      while (trail.length > 0 && elapsedSeconds - trail[0]!.t > 0.34) {
        trail.shift();
      }

      // Draw persistent multi-segment lightning eye light trail left behind on movement
      if (trail.length >= 2) {
        for (let i = 0; i < trail.length - 1; i++) {
          const p0 = trail[i]!;
          const p1 = trail[i + 1]!;
          const ageRatio = clamp(1 - (elapsedSeconds - p0.t) / 0.34, 0, 1);
          const jitter = Math.sin(elapsedSeconds * 38 + i * 2.1) * 1.8 * (1 - ageRatio);

          // Outer electric cyan glow ribbon for left & right eye trails
          gOver
            .moveTo(p0.lx, p0.ly + jitter)
            .lineTo(p1.lx, p1.ly)
            .stroke({
              color: eyeColor,
              width: 4.0 * ageRatio,
              alpha: 0.72 * ageRatio,
              cap: 'round',
            });
          gOver
            .moveTo(p0.rx, p0.ry - jitter)
            .lineTo(p1.rx, p1.ry)
            .stroke({
              color: eyeColor,
              width: 4.0 * ageRatio,
              alpha: 0.72 * ageRatio,
              cap: 'round',
            });

          // Inner white-hot lightning core ribbon
          gOver
            .moveTo(p0.lx, p0.ly + jitter)
            .lineTo(p1.lx, p1.ly)
            .stroke({
              color: coreColor,
              width: 1.8 * ageRatio,
              alpha: 0.95 * ageRatio,
              cap: 'round',
            });
          gOver
            .moveTo(p0.rx, p0.ry - jitter)
            .lineTo(p1.rx, p1.ry)
            .stroke({
              color: coreColor,
              width: 1.8 * ageRatio,
              alpha: 0.95 * ageRatio,
              cap: 'round',
            });
        }

        // Connect latest trail sample directly to current eye positions
        const newest = trail[trail.length - 1]!;
        gOver
          .moveTo(newest.lx, newest.ly)
          .lineTo(leftEyeX, eyeY)
          .moveTo(newest.rx, newest.ry)
          .lineTo(rightEyeX, eyeY)
          .stroke({ color: eyeColor, width: 3.8, alpha: 0.85, cap: 'round' });
        gOver
          .moveTo(newest.lx, newest.ly)
          .lineTo(leftEyeX, eyeY)
          .moveTo(newest.rx, newest.ry)
          .lineTo(rightEyeX, eyeY)
          .stroke({ color: coreColor, width: 1.8, alpha: 0.98, cap: 'round' });
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

      g.setTransform(m);

      // Outer primary wing pinion
      g.moveTo(0, 0)
        .bezierCurveTo(14, -22, 34, -26, 44, -12)
        .bezierCurveTo(38, -2, 26, 6, 4, 8)
        .closePath()
        .fill({ color: 0xffffff, alpha: 0.98 })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });

      // Layered secondary feathers
      for (let f = 0; f < 4; f++) {
        const fx = 10 + f * 7.5;
        const fy = -8 - f * 2.2;
        g.ellipse(fx, fy, 9 - f * 1.1, 4.2)
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
    legColor: number,
    isLevitating = false
  ): void {
    const strideX = Math.cos(facingAngle);
    const strideY = Math.sin(facingAngle);

    if (isLevitating) {
      // Levitating Thunder-God flight stance: poised boots hovering in mid-air without walking swing
      const hoverFloat = Math.sin(walkPhase * 0.3) * 1.8 - 4.5;
      const leftHipX = hx - 4.5;
      const leftHipY = hy + hoverFloat;
      const rightHipX = hx + 4.5;
      const rightHipY = hy + hoverFloat;

      const leftFootX = leftHipX - strideX * 1.5;
      const leftFootY = leftHipY + 5.5;
      const rightFootX = rightHipX + strideX * 1.5;
      const rightFootY = rightHipY + 7.5;

      g.moveTo(leftHipX, leftHipY)
        .lineTo(leftFootX, leftFootY)
        .stroke({ color: PALETTE.INK_OUTLINE, width: 6.2, cap: 'round' });
      g.moveTo(leftHipX, leftHipY)
        .lineTo(leftFootX, leftFootY)
        .stroke({ color: legColor, width: 3.4, cap: 'round' });
      g.ellipse(leftFootX, leftFootY, 4.2, 2.8)
        .fill({ color: bootColor })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

      g.moveTo(rightHipX, rightHipY)
        .lineTo(rightFootX, rightFootY)
        .stroke({ color: PALETTE.INK_OUTLINE, width: 6.2, cap: 'round' });
      g.moveTo(rightHipX, rightHipY)
        .lineTo(rightFootX, rightFootY)
        .stroke({ color: legColor, width: 3.4, cap: 'round' });
      g.ellipse(rightFootX, rightFootY, 4.2, 2.8)
        .fill({ color: bootColor })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
      return;
    }

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
    g.setTransform(m);

    const bladeLen = 22 + Math.min(8, swordWpn.level) * 1.1 + (swordWpn.evolved ? 5 : 0);
    const bladeHalfW = swordWpn.evolved ? 4.8 : 3.8;

    // Pommel & leather-wrapped hilt
    g.circle(reachOffset - 5.5, 2.5, 3.0)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

    g.moveTo(reachOffset - 4, 2.5)
      .lineTo(reachOffset + 2, 2.5)
      .stroke({ color: 0x78350f, width: 4, cap: 'round' });

    // Leaf-shaped crossguard
    g.moveTo(reachOffset + 1, -4.5)
      .lineTo(reachOffset + 3.5, 2.5)
      .lineTo(reachOffset + 1, 9.5)
      .lineTo(reachOffset - 1, 2.5)
      .closePath()
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });

    // Tapered botanical broadsword blade
    g.moveTo(reachOffset + 2.5, 2.5 - bladeHalfW)
      .lineTo(reachOffset + bladeLen - 5, 2.5 - bladeHalfW * 0.65)
      .lineTo(reachOffset + bladeLen, 2.5)
      .lineTo(reachOffset + bladeLen - 5, 2.5 + bladeHalfW * 0.65)
      .lineTo(reachOffset + 2.5, 2.5 + bladeHalfW)
      .closePath()
      .fill({ color: bladeColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });

    // Central fuller highlight
    g.moveTo(reachOffset + 4, 2.5)
      .lineTo(reachOffset + bladeLen - 3, 2.5)
      .stroke({ color: PALETTE.CREAM_WHITE, width: 1.5, alpha: 0.85 });

    // Gloved hero hand gripping the hilt
    g.circle(reachOffset - 1.2, 2.5, 3.8)
      .fill({ color: PALETTE.CREAM_WHITE })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });

    g.setTransform(new PIXI.Matrix());
  }

  /**
   * Renders the botanical Arbalete (crossbow):
   * - When `isBackSlung` is true (`phase === 'ready'`), it is rendered behind the hero's back (`gUnder`)
   *   in a static diagonal stowed position!
   * - When `isBackSlung` is false (`phase` in `'windup' | 'active' | 'recovery'`), it is brought to the front (`gOver`)
   *   with dynamic bowstring draw/release and recoil animation.
   */
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
      lockedAngle?: number;
    },
    _elapsedSeconds: number,
    isBackSlung = false,
    flipX = 1
  ): void {
    const def = WEAPONS.thorn_spear;
    const limbColor = spearWpn.evolved
      ? (def?.evolvedColor ?? PALETTE.CRIMSON_WARN)
      : (def?.color ?? PALETTE.BLUSH_ROSE);

    let localAngleOffset = 0;
    let recoilOffset = 15.5;
    let stringPullX = 2; // relative to stockRear
    let showLoadedBolt = true;

    if (isBackSlung) {
      // Static diagonal stowed position across the hero's back
      recoilOffset = -4;
      stringPullX = 2;
      showLoadedBolt = true;
    } else if (spearWpn.phase === 'windup') {
      const t = clamp(1 - spearWpn.phaseTimer / 0.14, 0, 1);
      localAngleOffset = 0;
      recoilOffset = lerp(11.0, 15.5, t);
      stringPullX = lerp(4, -2.0, t);
      showLoadedBolt = true;
    } else if (spearWpn.phase === 'active') {
      const t = clamp(1 - spearWpn.phaseTimer / 0.22, 0, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);
      localAngleOffset = 0;
      // Sharp crossbow recoil kickback in front of the hero on release, then settling forward
      recoilOffset = t < 0.35 ? lerp(15.5, 9.0, t / 0.35) : lerp(9.0, 15.0, easeOut);
      // Bowstring snaps all the way forward to the prod limbs
      stringPullX = lerp(13.5, 11.0, easeOut);
      showLoadedBolt = false;
    } else if (spearWpn.phase === 'recovery') {
      const t = clamp(1 - spearWpn.phaseTimer / 0.20, 0, 1);
      localAngleOffset = 0;
      recoilOffset = lerp(15.0, 12.0, t);
      stringPullX = lerp(11.0, 2, t);
      showLoadedBolt = t > 0.4;
    }

    const attackAngle =
      typeof spearWpn.lockedAngle === 'number'
        ? spearWpn.lockedAngle
        : facingAngle;
    const totalAngle = isBackSlung
      ? flipX >= 0
        ? -Math.PI * 0.72
        : -Math.PI * 0.28
      : attackAngle + localAngleOffset;
    const originX = isBackSlung ? hx - flipX * 5 : hx;
    const originY = isBackSlung ? cy - 5 : cy + 1.5;
    const cosA = Math.cos(totalAngle);
    const sinA = Math.sin(totalAngle);
    const frontScale = isBackSlung ? 1.0 : 1.18;

    const toWX = (lx: number, ly: number) =>
      originX + (lx * cosA - ly * sinA) * frontScale;
    const toWY = (lx: number, ly: number) =>
      originY + (lx * sinA + ly * cosA) * frontScale;

    const yOff = isBackSlung ? 0 : 0;
    const stockRear = recoilOffset - 5;
    const stockLen = 18 + Math.min(8, spearWpn.level) * 0.65 + (spearWpn.evolved ? 3 : 0);
    const stockFront = stockRear + stockLen;
    const limbSpan = 12.5 + (spearWpn.evolved ? 2.5 : 0);
    const limbTipX = stockFront - 4.5;
    const nockX = stockRear + stringPullX;

    // 1. Taut golden bowstring (drawn from top limb tip -> nock -> bottom limb tip)
    g.moveTo(toWX(limbTipX, yOff - limbSpan), toWY(limbTipX, yOff - limbSpan))
      .lineTo(toWX(nockX, yOff), toWY(nockX, yOff))
      .lineTo(toWX(limbTipX, yOff + limbSpan), toWY(limbTipX, yOff + limbSpan))
      .stroke({ color: PALETTE.BUTTER_YELLOW, width: 2.0, alpha: 0.95, join: 'round' });

    // 2. Carved ironwood crossbow tiller / stock polygon
    const sHalfH = 2.9;
    g.moveTo(toWX(stockRear, yOff - sHalfH), toWY(stockRear, yOff - sHalfH))
      .lineTo(toWX(stockFront, yOff - sHalfH), toWY(stockFront, yOff - sHalfH))
      .lineTo(toWX(stockFront, yOff + sHalfH), toWY(stockFront, yOff + sHalfH))
      .lineTo(toWX(stockRear, yOff + sHalfH), toWY(stockRear, yOff + sHalfH))
      .closePath()
      .fill({ color: spearWpn.evolved ? 0x7f1d1d : 0x78350f })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.4 });

    // Central flight groove & golden stock pommel
    g.moveTo(toWX(stockRear + 2.5, yOff), toWY(stockRear + 2.5, yOff))
      .lineTo(toWX(stockFront - 1.5, yOff), toWY(stockFront - 1.5, yOff))
      .stroke({ color: PALETTE.CREAM_WHITE, width: 1.4, alpha: 0.75 });
    g.circle(toWX(stockRear, yOff), toWY(stockRear, yOff), 2.8 * frontScale)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

    // 3. Curved botanical Arbalete prod limbs (top & bottom)
    g.moveTo(toWX(stockFront - 1.5, yOff - 2), toWY(stockFront - 1.5, yOff - 2))
      .quadraticCurveTo(
        toWX(stockFront + 2.5, yOff - limbSpan * 0.65),
        toWY(stockFront + 2.5, yOff - limbSpan * 0.65),
        toWX(limbTipX, yOff - limbSpan),
        toWY(limbTipX, yOff - limbSpan)
      )
      .quadraticCurveTo(
        toWX(stockFront - 2.5, yOff - limbSpan * 0.55),
        toWY(stockFront - 2.5, yOff - limbSpan * 0.55),
        toWX(stockFront - 4.2, yOff - 2),
        toWY(stockFront - 4.2, yOff - 2)
      )
      .closePath()
      .fill({ color: limbColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.3 });

    g.moveTo(toWX(stockFront - 1.5, yOff + 2), toWY(stockFront - 1.5, yOff + 2))
      .quadraticCurveTo(
        toWX(stockFront + 2.5, yOff + limbSpan * 0.65),
        toWY(stockFront + 2.5, yOff + limbSpan * 0.65),
        toWX(limbTipX, yOff + limbSpan),
        toWY(limbTipX, yOff + limbSpan)
      )
      .quadraticCurveTo(
        toWX(stockFront - 2.5, yOff + limbSpan * 0.55),
        toWY(stockFront - 2.5, yOff + limbSpan * 0.55),
        toWX(stockFront - 4.2, yOff + 2),
        toWY(stockFront - 4.2, yOff + 2)
      )
      .closePath()
      .fill({ color: limbColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.3 });

    // Prod nose stirrup / golden collar
    g.circle(toWX(stockFront - 1.0, yOff), toWY(stockFront - 1.0, yOff), 3.4 * frontScale)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

    // 4. Loaded briar bolt sitting in the flight groove (or firing flash during 'active')
    if (showLoadedBolt) {
      const boltTailX = nockX;
      const boltTipX = stockFront + 9.5;
      // Bolt shaft
      g.moveTo(toWX(boltTailX, yOff), toWY(boltTailX, yOff))
        .lineTo(toWX(boltTipX - 4, yOff), toWY(boltTipX - 4, yOff))
        .stroke({ color: PALETTE.CREAM_WHITE, width: 2.4, cap: 'round' });
      // Barbed briar broadhead tip
      g.moveTo(toWX(boltTipX, yOff), toWY(boltTipX, yOff))
        .lineTo(toWX(boltTipX - 6.5, yOff - 3.8), toWY(boltTipX - 6.5, yOff - 3.8))
        .lineTo(toWX(boltTipX - 4.5, yOff), toWY(boltTipX - 4.5, yOff))
        .lineTo(toWX(boltTipX - 6.5, yOff + 3.8), toWY(boltTipX - 6.5, yOff + 3.8))
        .closePath()
        .fill({ color: spearWpn.evolved ? PALETTE.GOLD_STAR : limbColor })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });
    } else {
      // Firing snap flash at the Arbalete nose when bolt launches
      g.circle(toWX(stockFront + 3.5, yOff), toWY(stockFront + 3.5, yOff), 4.6)
        .fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.95 })
        .stroke({ color: limbColor, width: 2.0 });
    }

    // 5. When brought to the front on attack (!isBackSlung), draw the hero's front-gripping hands holding the stock!
    if (!isBackSlung) {
      g.circle(toWX(stockRear + 3.0, yOff + 2.2), toWY(stockRear + 3.0, yOff + 2.2), 3.6)
        .fill({ color: PALETTE.CREAM_WHITE })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0 });
      g.circle(toWX(stockFront - 6.5, yOff - 2.2), toWY(stockFront - 6.5, yOff - 2.2), 3.4)
        .fill({ color: PALETTE.CREAM_WHITE })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2.0 });
    }
  }

  /**
   * Active Aegis Orb aura: rotating hexagonal botanical rune ward underfoot +
   * 3 orbiting crystalline shield crests with shimmering cyan-mint energy ribbons (no simple circle).
   */
  private static drawAegisShieldAura(
    gUnder: PIXI.Graphics,
    gOver: PIXI.Graphics,
    hx: number,
    hy: number,
    elapsedSeconds: number,
    shieldHp: number
  ): void {
    const rot = elapsedSeconds * 1.8;
    const wardR = 27 + Math.sin(elapsedSeconds * 6) * 1.5;

    // Rotating 6-sided crystalline ward polygon underfoot
    for (let i = 0; i < 6; i++) {
      const a = rot + (i * Math.PI) / 3;
      const vx = hx + Math.cos(a) * wardR;
      const vy = hy + Math.sin(a) * (wardR * 0.72);
      if (i === 0) gUnder.moveTo(vx, vy);
      else gUnder.lineTo(vx, vy);
    }
    gUnder
      .closePath()
      .fill({ color: PALETTE.SKY_BLUE, alpha: 0.14 })
      .stroke({ color: PALETTE.SKY_BLUE, width: 2.2, alpha: 0.78 });

    // Inner counter-rotating star-hex rune lines
    for (let i = 0; i < 6; i++) {
      const a = -rot * 1.2 + (i * Math.PI) / 3;
      const vx = hx + Math.cos(a) * (wardR * 0.62);
      const vy = hy + Math.sin(a) * (wardR * 0.45);
      if (i === 0) gUnder.moveTo(vx, vy);
      else gUnder.lineTo(vx, vy);
    }
    gUnder.closePath().stroke({
      color: PALETTE.MINT_GREEN,
      width: 1.5,
      alpha: 0.68,
    });

    // 3 orbiting miniature Aegis shield crests around the hero
    const crestCount = 3;
    for (let c = 0; c < crestCount; c++) {
      const ca = elapsedSeconds * 3.2 + (c * Math.PI * 2) / crestCount;
      const cx = hx + Math.cos(ca) * 25;
      const cy = hy - 4 + Math.sin(ca) * 17;
      const targetG = Math.sin(ca) >= 0 ? gOver : gUnder;

      // Trailing energy ribbon
      const tailA = ca - 0.35;
      const tx = hx + Math.cos(tailA) * 25;
      const ty = hy - 4 + Math.sin(tailA) * 17;
      targetG
        .moveTo(tx, ty)
        .lineTo(cx, cy)
        .stroke({ color: PALETTE.SKY_BLUE, width: 2.6, alpha: 0.65, cap: 'round' });

      // Kite-shaped Aegis crest
      targetG
        .moveTo(cx, cy - 5.5)
        .lineTo(cx + 4.5, cy - 2)
        .lineTo(cx + 3.2, cy + 3.5)
        .lineTo(cx, cy + 6.0)
        .lineTo(cx - 3.2, cy + 3.5)
        .lineTo(cx - 4.5, cy - 2)
        .closePath()
        .fill({ color: shieldHp > 20 ? PALETTE.SKY_BLUE : PALETTE.MINT_GREEN, alpha: 0.95 })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

      targetG
        .moveTo(cx, cy - 3.5)
        .lineTo(cx + 2.2, cy)
        .lineTo(cx, cy + 3.5)
        .lineTo(cx - 2.2, cy)
        .closePath()
        .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.9 });
    }
  }
}
