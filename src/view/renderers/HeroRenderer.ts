import * as PIXI from 'pixi.js';
import type { Simulation } from '../../sim/Simulation';
import type { SpriteKey } from '../SpriteAtlas';
import {
  heroProfessionRegistry,
  drawCharacterLegs,
  drawHeroSword,
  drawHeroHalberd,
  drawAegisShieldAura,
  drawHeroAngelWings,
  HerbalistCharacter,
  HERBALIST_PALETTE,
  HERBALIST_PALETTE_NUM,
  HERBALIST_PARTS_LIST,
  attachGardenBladeToHero,
  drawAttachedGardenBlade,
  getHeroWeaponSocket,
  HERO_WEAPON_SOCKETS,
} from './heros';

export {
  HerbalistCharacter,
  HERBALIST_PALETTE,
  HERBALIST_PALETTE_NUM,
  HERBALIST_PARTS_LIST,
  attachGardenBladeToHero,
  drawAttachedGardenBlade,
  getHeroWeaponSocket,
  HERO_WEAPON_SOCKETS,
};
export type {
  HerbalistAnimationState,
  HeroWeaponSocket,
  SwordWeaponState,
  GardenBladeAttachmentContext,
} from './heros';

/**
 * Facade renderer for the hero character.
 * Delegates rendering to registered HeroProfessionRenderer and PersonaRenderer strategy instances.
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
    const renderer = heroProfessionRegistry.get(sim.professionId);
    renderer.draw({
      heroUnderGraphic,
      heroSprite,
      heroWeaponGraphic,
      atlasTextures,
      sim,
      alpha,
      displayFacingAngle,
    });
  }

  // Preserve public static helpers for backwards-compatibility
  public static drawCharacterLegs = drawCharacterLegs;
  public static drawHeroSword = drawHeroSword;
  public static drawHeroHalberd = drawHeroHalberd;
  public static drawAegisShieldAura = drawAegisShieldAura;
  public static drawHeroAngelWings = drawHeroAngelWings;
  public static attachGardenBladeToHero = attachGardenBladeToHero;
  public static drawAttachedGardenBlade = drawAttachedGardenBlade;
  public static getHeroWeaponSocket = getHeroWeaponSocket;
  public static createHerbalistCharacter(): HerbalistCharacter {
    return new HerbalistCharacter();
  }
}
