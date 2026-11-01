import * as PIXI from 'pixi.js';
import {
  PALETTE,
  PROFESSIONS,
  PERSONAS,
} from '../../../content/data/catalog';
import { lerp } from '../../../core/math/vec2';
import { PPU } from '../EnvironmentRenderer';
import { drawHeroAngelWings, drawAegisShieldAura } from './common';
import { attachGardenBladeToHero, drawHeroHalberd } from './weapons';
import { ChainLightningAttachment } from './ChainLightningAttachment';
import { WardenZagreusPersonaRenderer } from './WardenZagreusPersonaRenderer';
import { SeekerHollowPersonaRenderer } from './SeekerHollowPersonaRenderer';
import { HerbalistFrierenPersonaRenderer } from './HerbalistFrierenPersonaRenderer';
import { StormcallerGojoPersonaRenderer } from './StormcallerGojoPersonaRenderer';
import {
  drawProceduralHeroBody,
  resolveHeroCelPalette,
} from './rig/CelHeroDrawer';
import {
  HeroProceduralController,
  HeroRenderProfiler,
  type HeroPose,
} from './rig/HeroRigCore';
import type {
  HeroProfessionRenderer,
  HeroRenderContext,
  PersonaRenderer,
} from './types';

export abstract class BaseHeroProfessionRenderer
  implements HeroProfessionRenderer
{
  public abstract readonly professionId: string;

  /** Per-profession procedural 2D rig, facing, IK, and secondary motion controller */
  public readonly proceduralController = new HeroProceduralController(0, 0);

  /** Socket-bound Chain Lightning attachment instance */
  protected readonly chainLightningAttachment = new ChainLightningAttachment();

  private lastElapsedSeconds = 0;

  protected static readonly personaRenderers = new Map<string, PersonaRenderer>([
    ['warden_zagreus_naruto', new WardenZagreusPersonaRenderer()],
    ['seeker_hollow_levi', new SeekerHollowPersonaRenderer()],
    ['herbalist_frieren_strange', new HerbalistFrierenPersonaRenderer()],
    ['stormcaller_gojo_killua', new StormcallerGojoPersonaRenderer()],
  ]);

  public static getPersonaRenderer(
    personaId?: string | null
  ): PersonaRenderer | undefined {
    if (!personaId) return undefined;
    return this.personaRenderers.get(personaId);
  }

  public drawHero(ctx: HeroRenderContext): void {
    const profStartMs = HeroRenderProfiler.beginFrame();
    const {
      heroUnderGraphic: gUnder,
      heroSprite,
      heroWeaponGraphic: gOver,
      sim,
      alpha,
      displayFacingAngle,
    } = ctx;

    gUnder.clear();
    gOver.clear();

    // IMPORTANT: Heroes and personas have NO sprites, spritesheets or texture atlases.
    // Hide legacy raster sprite completely and keep its scale strictly positive (1, 1).
    heroSprite.visible = false;
    heroSprite.scale.set(1, 1);

    const hx = lerp(sim.heroPrevX, sim.heroX, alpha) * PPU;
    const hy = lerp(sim.heroPrevY, sim.heroY, alpha) * PPU;

    const prof = PROFESSIONS[sim.professionId] ?? PROFESSIONS.warden!;
    const persona = sim.personaId
      ? (PERSONAS.find((p) => p.id === sim.personaId) ?? null)
      : null;

    const bodyColor = persona ? persona.bodyColor : prof.primaryColor;
    const accentColor = persona ? persona.accentColor : prof.accentColor;
    const eyeLeftColor = persona ? persona.eyeLeftColor : PALETTE.CREAM_WHITE;
    const eyeRightColor = persona ? persona.eyeRightColor : PALETTE.CREAM_WHITE;

    const activePersonaRenderer = BaseHeroProfessionRenderer.getPersonaRenderer(
      sim.personaId
    );
    const isLevitating = Boolean(activePersonaRenderer?.isLevitating);

    // Compute frame dt from simulation elapsedSeconds
    const rawDt = sim.elapsedSeconds - this.lastElapsedSeconds;
    const dtSec = rawDt > 0 && rawDt < 0.25 ? rawDt : 1 / 60;
    this.lastElapsedSeconds = sim.elapsedSeconds;

    const speed = Math.hypot(sim.heroVx, sim.heroVy);
    const isMoving = speed > 0.12;
    const isDashing = (sim.dashTimer ?? 0) > 0;
    const isHit = (sim.hitFlashTimer ?? 0) > 0;
    const currentHp = sim.currentHp ?? 100;
    const maxHp = sim.maxHp ?? 100;
    const isWinSeq = (sim.victorySequenceTimer ?? 0) > 0;
    const isDead = currentHp <= 0 && !isWinSeq;
    const hpRatio = maxHp > 0 ? currentHp / maxHp : 1;
    const isLowHealth = hpRatio < 0.25 && !isDead;

    const swordWpn = sim.weapons.find((w) => w.id === 'garden_blade');
    const spearWpn = sim.weapons.find((w) => w.id === 'thorn_spear');
    const primaryMelee =
      swordWpn && swordWpn.phase !== 'ready'
        ? swordWpn
        : spearWpn && spearWpn.phase !== 'ready'
          ? spearWpn
          : swordWpn ?? spearWpn ?? null;

    this.chainLightningAttachment.syncFromSimulation(sim);

    const cy = hy - 2;
    // 1. Step Procedural Rig, Continuous Facing (no negative scale!), Distance-Driven Gait,
    //    2-Bone Analytic IK, and Fixed-Step Spring Secondary Motion
    const pose = this.proceduralController.step({
      professionId: this.professionId,
      personaId: sim.personaId,
      hx,
      cy,
      groundY: hy,
      heroVx: sim.heroVx,
      heroVy: sim.heroVy,
      facingAngle: displayFacingAngle,
      elapsedSeconds: sim.elapsedSeconds,
      dtSec,
      isMoving,
      isDashing,
      isHit,
      isDead,
      isLowHealth,
      lowHealthRatio: hpRatio,
      isLevitating,
      meleeWeapon: primaryMelee,
      isCastingSpell: false,
    });

    // Update socket-bound Chain Lightning attachment (applies cast recoil & sleeve glow to pose)
    this.chainLightningAttachment.update(dtSec, pose);

    const flipX = pose.facingSign;

    // 2. Active Aegis Shield Aura (under & over layers)
    if ((sim.shieldHp ?? 0) > 0 || (sim.shieldBreakFadeTimer ?? 0) > 0) {
      drawAegisShieldAura(
        gUnder,
        gOver,
        hx,
        hy,
        sim.elapsedSeconds,
        sim.shieldHp ?? 0,
        sim.shieldTimer ?? 0,
        sim.shieldBreakFadeTimer ?? 0
      );
    }

    // 3. Draw Procedural Cel-Shaded Vector Body & Limbs (into gUnder and gOver)
    const palette =
      activePersonaRenderer?.palette ??
      resolveHeroCelPalette(this.professionId, sim.personaId);

    if (activePersonaRenderer?.drawVectorBody) {
      activePersonaRenderer.drawVectorBody(
        gUnder,
        gOver,
        pose,
        sim.elapsedSeconds
      );
    } else {
      drawProceduralHeroBody(gUnder, gOver, pose, palette);
    }

    // 4. Persona-Specific Elemental Auras & Orbitals
    if (activePersonaRenderer) {
      activePersonaRenderer.drawAura({
        gUnder,
        gOver,
        hx,
        cy: pose.centerY,
        groundY: hy,
        flipX,
        isMoving,
        walkPhase: pose.gaitPhase,
        elapsedSeconds: sim.elapsedSeconds,
        eyeLeftColor,
        eyeRightColor,
        heroVx: sim.heroVx,
        heroVy: sim.heroVy,
        heroPose: pose,
      });
    } else {
      this.drawProfessionEyes(
        gOver,
        hx,
        pose.centerY,
        flipX,
        sim.elapsedSeconds,
        pose
      );
    }

    // 5. Grand Angel Wings during Victory Sequence
    if (isWinSeq) {
      drawHeroAngelWings(
        gUnder,
        hx,
        pose.centerY,
        sim.elapsedSeconds,
        sim.victorySequenceTimer
      );
    }

    // 6. Socket-Bound Weapon & Spell Attachments (Garden Blade, Arbalete, Chain Lightning)
    this.drawAttachedWeapons(
      ctx,
      hx,
      pose.centerY,
      flipX,
      displayFacingAngle,
      bodyColor,
      accentColor,
      activePersonaRenderer,
      pose
    );

    this.chainLightningAttachment.draw(gUnder, gOver, pose);
    HeroRenderProfiler.endFrame(profStartMs, 2);
  }

  protected drawProfessionEyes(
    _gOver: PIXI.Graphics,
    _hx: number,
    _cy: number,
    _flipX: number,
    _elapsedSeconds: number,
    _pose?: HeroPose
  ): void {
    // Base professions render expressive cel-shaded eyes in drawProceduralHeroBody;
    // subclasses like Stormcaller can layer extra elemental eye glow here.
  }

  protected drawAttachedWeapons(
    ctx: HeroRenderContext,
    hx: number,
    cy: number,
    flipX: number,
    displayFacingAngle: number,
    bodyColor: number,
    accentColor: number,
    activePersonaRenderer?: PersonaRenderer,
    heroPose?: HeroPose
  ): void {
    attachGardenBladeToHero({
      gOver: ctx.heroWeaponGraphic,
      gUnder: ctx.heroUnderGraphic,
      hx,
      cy,
      displayFacingAngle,
      flipX,
      elapsedSeconds: ctx.sim.elapsedSeconds,
      sim: ctx.sim,
      professionId: this.professionId,
      personaId: ctx.sim.personaId,
      bodyColor,
      accentColor,
      customSocket: activePersonaRenderer?.weaponSocket,
      heroPose,
    });

    const spearWpn = ctx.sim.weapons.find((w) => w.id === 'thorn_spear');
    if (spearWpn) {
      const isAttacking = spearWpn.phase !== 'ready';
      const anchorX = isAttacking
        ? (heroPose?.sockets.handNear.x ?? hx)
        : (heroPose?.sockets.back.x ?? hx);
      const anchorY = isAttacking
        ? (heroPose?.sockets.handNear.y ?? cy)
        : (heroPose?.sockets.back.y ?? cy);
      drawHeroHalberd(
        isAttacking ? ctx.heroWeaponGraphic : ctx.heroUnderGraphic,
        anchorX,
        anchorY,
        isAttacking ? spearWpn.lockedAngle : displayFacingAngle,
        spearWpn,
        ctx.sim.elapsedSeconds,
        !isAttacking,
        flipX
      );
    }
  }
}
