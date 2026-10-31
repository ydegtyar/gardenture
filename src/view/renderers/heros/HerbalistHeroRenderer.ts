import { BaseHeroProfessionRenderer } from './BaseHeroProfessionRenderer';
import { HerbalistCharacter } from './HerbalistCharacter';
import type { HeroRenderContext, PersonaRenderer } from './types';
import { attachGardenBladeToHero, drawHeroHalberd } from './weapons';

export * from './HerbalistCharacter';

/**
 * Hero profession renderer strategy for the Herbalist support hero.
 * Integrates the Chunky Chibi Herbalist character into the game's simulation and view pipelines.
 */
export class HerbalistHeroRenderer extends BaseHeroProfessionRenderer {
  public readonly professionId = 'herbalist';

  /**
   * Factory method to instantiate the standalone PixiJS (v8) Herbalist character container.
   */
  public static createCharacter(): HerbalistCharacter {
    return new HerbalistCharacter();
  }

  /**
   * Checks whether the current persona or character should display the wooden staff with hand.
   * Only the base Herbalist hero uses the wooden stick with peach hand.
   * Personas such as Hiten Jade ('herbalist_frieren_strange') omit the staff and channel
   * living mist-spring dew with their natural hands.
   */
  public static usesStickWeapon(personaId?: string | null): boolean {
    return !personaId || personaId === 'adventurer_default';
  }

  /**
   * Overridden weapon attachment for the Herbalist hero profession:
   * - Base Herbalist hero: renders the hand with wooden stick when Garden Blade is NOT equipped;
   *   when Garden Blade is drafted, removes the stick and attaches the Garden Blade hand to her shoulder.
   * - Hiten Jade persona skin ('herbalist_frieren_strange'): completely suppresses the wooden stick with hand.
   *   When she takes Garden Blade, she gets the Garden Blade attached with cerulean sleeves and frost cuffs.
   */
  protected override drawAttachedWeapons(
    ctx: HeroRenderContext,
    hx: number,
    cy: number,
    flipX: number,
    displayFacingAngle: number,
    bodyColor: number,
    accentColor: number,
    activePersonaRenderer?: PersonaRenderer
  ): void {
    const isHitenJade = ctx.sim.personaId === 'herbalist_frieren_strange';
    const personaSocket =
      activePersonaRenderer?.weaponSocket ??
      (isHitenJade
        ? {
            sleeveColor: 0x0284c7, // Cerulean blue dress-robe
            cuffColor: 0xf8fafc,   // Snowy frost white cuff
            handColor: 0xffe4d6,   // Soft porcelain peach skin
            drawDefaultWeapon: undefined, // Suppress stick!
          }
        : undefined);

    attachGardenBladeToHero({
      gOver: ctx.heroWeaponGraphic,
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
      customSocket: personaSocket,
    });

    const spearWpn = ctx.sim.weapons.find((w) => w.id === 'thorn_spear');
    if (spearWpn) {
      const isAttacking = spearWpn.phase !== 'ready';
      drawHeroHalberd(
        isAttacking ? ctx.heroWeaponGraphic : ctx.heroUnderGraphic,
        hx,
        cy,
        isAttacking ? spearWpn.lockedAngle : displayFacingAngle,
        spearWpn,
        ctx.sim.elapsedSeconds,
        !isAttacking,
        flipX
      );
    }
  }
}
