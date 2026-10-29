import { PALETTE, PERSONAS, PROFESSIONS } from '../../../content/data/catalog';
import { clamp, lerp } from '../../../core/math/vec2';
import { resolveHeroSpriteKey } from '../../SpriteAtlas';
import { PPU } from '../EnvironmentRenderer';
import { drawAegisShieldAura, drawCharacterLegs, drawHeroAngelWings } from './common';
import type { HeroProfessionRenderer, HeroRenderContext } from './types';
import { drawHeroHalberd, drawHeroSword } from './weapons';
import { personaRegistry } from './PersonaRegistry';

/**
 * Base template implementation for rendering a hero profession.
 * Specialized hero profession renderers can extend or customize this behavior.
 */
export abstract class BaseHeroProfessionRenderer implements HeroProfessionRenderer {
  public abstract readonly professionId: string;

  public draw(ctx: HeroRenderContext): void {
    const {
      heroUnderGraphic,
      heroSprite,
      heroWeaponGraphic,
      atlasTextures,
      sim,
      alpha,
      displayFacingAngle,
    } = ctx;

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

    const activePersonaRenderer = sim.personaId ? personaRegistry.get(sim.personaId) : undefined;
    const isLevitatingThunderGod = Boolean(activePersonaRenderer?.isLevitating);

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

    // Shield Power-Up (Aegis Orb) active crystalline rune ward & orbiting shield crests
    if (sim.shieldHp > 0) {
      drawAegisShieldAura(
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
      drawCharacterLegs(
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
      drawHeroAngelWings(gUnder, hx, cy, animTime, winProgress);
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

    // Permanent Arcana Skin visual effects dispatched via PersonaRenderer Strategy
    if (customPersona && !isDyingSequence) {
      // Heterochromia eye glints (for non-levitating personas)
      if (!isLevitatingThunderGod) {
        const eyeY = cy - 4.5;
        const leftEyeX = hx - 4.2 * flipX;
        const rightEyeX = hx + 4.2 * flipX;
        const eyePulse = 0.78 + 0.22 * Math.sin(sim.elapsedSeconds * 9);
        gOver
          .circle(leftEyeX, eyeY, 2.2)
          .fill({ color: customPersona.eyeLeftColor, alpha: 0.95 * eyePulse });
        gOver
          .circle(rightEyeX, eyeY, 2.2)
          .fill({ color: customPersona.eyeRightColor, alpha: 0.95 * eyePulse });
      }

      if (activePersonaRenderer) {
        activePersonaRenderer.drawAura({
          gUnder,
          gOver,
          hx,
          cy,
          groundY: hy + flyHeightOffset,
          flipX,
          elapsedSeconds: sim.elapsedSeconds,
          eyeLeftColor: customPersona.eyeLeftColor,
          eyeRightColor: customPersona.eyeRightColor,
          heroVx: sim.heroVx,
          heroVy: sim.heroVy,
        });
      }
    }

    // Draw attached weapons (Garden Blade / Arbalete)
    if (!isDyingSequence) {
      const swordWpn = sim.weapons.find((w) => w.id === 'garden_blade');
      if (swordWpn) {
        drawHeroSword(
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
        drawHeroHalberd(
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
}
