import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { BaseBiomeRenderer } from './BaseBiomeRenderer';

/**
 * Sakura Twilight Grove Biome Renderer:
 * Velvet plum-blossom glade with fallen cherry blossom petals & glowing spirit blossoms.
 */
export class SakuraGroveBiomeRenderer extends BaseBiomeRenderer {
  public readonly biomeId = 'sakura_grove' as const;
  public readonly stoneColor = 0x3f2b4a;
  public readonly stoneRimColor = 0x5c3d6b;

  protected drawDecor(
    g: PIXI.Graphics,
    fx: number,
    fy: number,
    nextRand: () => number
  ): void {
    // Fallen cherry blossom petals & glowing spirit blossoms
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2 + nextRand() * 0.2;
      g.ellipse(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5, 3.8, 2.2).fill({
        color: p % 2 === 0 ? 0xf9a8d4 : PALETTE.BLUSH_ROSE,
        alpha: 0.48,
      });
    }
    g.circle(fx, fy, 2.2).fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.62 });
  }
}
