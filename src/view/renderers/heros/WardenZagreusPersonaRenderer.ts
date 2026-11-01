import type * as PIXI from 'pixi.js';
import {
  drawProceduralHeroBody,
  HERO_CEL_PALETTES,
  type PersonaCelPalette,
} from './rig/CelHeroDrawer';
import type { HeroGaitStyle, HeroPose } from './rig/HeroRigCore';
import type { PersonaRenderer, PersonaRenderContext } from './types';

/**
 * Losti Seige ('warden_zagreus_naruto') persona renderer:
 * Heavy bruiser stance, heterochromatic ember/jade eyes, crimson-black armor,
 * golden laurel headband, and classic dark ground shadow under the hero.
 */
export class WardenZagreusPersonaRenderer implements PersonaRenderer {
  public readonly id = 'warden_zagreus_naruto';
  public readonly palette: PersonaCelPalette =
    HERO_CEL_PALETTES.warden_zagreus_naruto!;
  public readonly gaitStyle: HeroGaitStyle = 'bruiser';

  public drawVectorBody(
    gUnder: PIXI.Graphics,
    gOver: PIXI.Graphics,
    pose: HeroPose,
    _elapsedSeconds: number
  ): void {
    drawProceduralHeroBody(gUnder, gOver, pose, this.palette, 10.5);
  }

  public drawAura(_ctx: PersonaRenderContext): void {
    // Losti Seige: Uses the reactive dark ground shadow under the hero (no pulsing circle, no spinning orbs)
  }
}
