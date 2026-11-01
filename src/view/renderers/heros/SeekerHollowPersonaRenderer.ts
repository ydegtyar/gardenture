import type * as PIXI from 'pixi.js';
import {
  drawProceduralHeroBody,
  HERO_CEL_PALETTES,
  type PersonaCelPalette,
} from './rig/CelHeroDrawer';
import type { HeroGaitStyle, HeroPose } from './rig/HeroRigCore';
import type { PersonaRenderer, PersonaRenderContext } from './types';

/**
 * Vessel Ackerman ('seeker_hollow_levi') persona renderer:
 * Agile scout-captain silhouette with survey mantle, spring-driven cloak,
 * and Abyssal Void-Shade ring + ODM steam wisps.
 */
export class SeekerHollowPersonaRenderer implements PersonaRenderer {
  public readonly id = 'seeker_hollow_levi';
  public readonly palette: PersonaCelPalette =
    HERO_CEL_PALETTES.seeker_hollow_levi!;
  public readonly gaitStyle: HeroGaitStyle = 'agile';

  public drawVectorBody(
    gUnder: PIXI.Graphics,
    gOver: PIXI.Graphics,
    pose: HeroPose,
    _elapsedSeconds: number
  ): void {
    drawProceduralHeroBody(gUnder, gOver, pose, this.palette, 10.0);
  }

  public drawAura(ctx: PersonaRenderContext): void {
    const { gUnder, hx, groundY, cy, elapsedSeconds } = ctx;

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
  }
}
