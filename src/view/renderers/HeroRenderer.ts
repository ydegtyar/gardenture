import type * as PIXI from 'pixi.js';
import type { Simulation } from '../../sim/Simulation';
import {
  drawCharacterLegs,
  drawHeroAngelWings,
  drawAegisShieldAura,
  computeAegisAuraBlinkAlpha,
  AEGIS_BLINK_WARNING_SEC,
} from './heros/common';
import {
  drawHeroSword,
  drawHeroHalberd,
  drawAttachedGardenBlade,
  attachGardenBladeToHero,
  getHeroWeaponSocket,
  getGardenBladeTipPosition,
  HERO_WEAPON_SOCKETS,
} from './heros/weapons';
import {
  GardenBladeAttachment,
  computeGardenBladePoseSample,
} from './heros/GardenBladeAttachment';
import {
  ChainLightningAttachment,
  computeDeterministicLightningBolt,
} from './heros/ChainLightningAttachment';
import { WardenHeroRenderer } from './heros/WardenHeroRenderer';
import { SeekerHeroRenderer, drawSeedTrapHazard } from './heros/SeekerHeroRenderer';
import {
  HerbalistHeroRenderer,
  HerbalistCharacter,
  HERBALIST_PALETTE,
  HERBALIST_PALETTE_NUM,
  HERBALIST_PARTS_LIST,
  type HerbalistAnimationState,
} from './heros/HerbalistHeroRenderer';
import {
  StormcallerHeroRenderer,
  STORMCALLER_HAT_TIP_OFFSET_PX,
  STORMCALLER_EYES_OFFSET_PX,
  getStormcallerHatTipPosition,
  getStormcallerHatTipWorld,
  getStormcallerEyePositions,
  getStormcallerEyePositionsWorld,
} from './heros/StormcallerHeroRenderer';
import {
  HeroProceduralController,
  HeroRenderProfiler,
  stepFacingState,
  createFacingState,
  solveTwoBoneIK,
  createSpringChain,
  stepSpringChain,
} from './heros/rig/HeroRigCore';
import {
  drawProceduralHeroBody,
  resolveHeroCelPalette,
  HERO_CEL_PALETTES,
  WORLD_LIGHT_DIR,
} from './heros/rig/CelHeroDrawer';
import type { HeroProfessionRenderer } from './heros/types';

export {
  AEGIS_BLINK_WARNING_SEC,
  computeAegisAuraBlinkAlpha,
  STORMCALLER_HAT_TIP_OFFSET_PX,
  STORMCALLER_EYES_OFFSET_PX,
  getStormcallerHatTipPosition,
  getStormcallerHatTipWorld,
  getStormcallerEyePositions,
  getStormcallerEyePositionsWorld,
  HerbalistCharacter,
  HERBALIST_PALETTE,
  HERBALIST_PALETTE_NUM,
  HERBALIST_PARTS_LIST,
  type HerbalistAnimationState,
  drawAttachedGardenBlade,
  attachGardenBladeToHero,
  getHeroWeaponSocket,
  getGardenBladeTipPosition,
  HERO_WEAPON_SOCKETS,
  GardenBladeAttachment,
  computeGardenBladePoseSample,
  ChainLightningAttachment,
  computeDeterministicLightningBolt,
  HeroProceduralController,
  HeroRenderProfiler,
  stepFacingState,
  createFacingState,
  solveTwoBoneIK,
  createSpringChain,
  stepSpringChain,
  drawProceduralHeroBody,
  resolveHeroCelPalette,
  HERO_CEL_PALETTES,
  WORLD_LIGHT_DIR,
};

/**
 * Facade coordinating hero profession & persona renderers.
 * Delegates hero rendering to the strategy corresponding to `sim.professionId`.
 */
export class HeroRenderer {
  private static readonly professionRenderers = new Map<
    string,
    HeroProfessionRenderer
  >([
    ['warden', new WardenHeroRenderer()],
    ['seeker', new SeekerHeroRenderer()],
    ['herbalist', new HerbalistHeroRenderer()],
    ['stormcaller', new StormcallerHeroRenderer()],
  ]);

  public static getProfessionRenderer(
    professionId: string
  ): HeroProfessionRenderer {
    return (
      this.professionRenderers.get(professionId) ??
      this.professionRenderers.get('warden')!
    );
  }

  public static drawHero(
    heroUnderGraphic: PIXI.Graphics,
    heroSprite: PIXI.Sprite,
    heroWeaponGraphic: PIXI.Graphics,
    atlasTextures: Map<string, PIXI.Texture>,
    sim: Simulation,
    alpha: number,
    displayFacingAngle: number
  ): void {
    const renderer = this.getProfessionRenderer(sim.professionId);
    renderer.drawHero({
      heroUnderGraphic,
      heroSprite,
      heroWeaponGraphic,
      atlasTextures,
      sim,
      alpha,
      displayFacingAngle,
    });
  }

  public static drawSeedTrapHazard = drawSeedTrapHazard;
  public static drawCharacterLegs = drawCharacterLegs;
  public static drawHeroAngelWings = drawHeroAngelWings;
  public static drawAegisShieldAura = drawAegisShieldAura;
  public static drawHeroSword = drawHeroSword;
  public static drawHeroHalberd = drawHeroHalberd;
  public static drawAttachedGardenBlade = drawAttachedGardenBlade;
  public static attachGardenBladeToHero = attachGardenBladeToHero;
  public static getHeroWeaponSocket = getHeroWeaponSocket;
  public static getGardenBladeTipPosition = getGardenBladeTipPosition;
  public static createHerbalistCharacter = HerbalistHeroRenderer.createCharacter;
}
