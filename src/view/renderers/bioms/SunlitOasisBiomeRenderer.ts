import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { BaseBiomeRenderer } from './BaseBiomeRenderer';

/**
 * Sunlit Oasis (Golden Amber Meadow) Biome Renderer:
 * Golden sun-wheat tufts, warm sandstone slabs, and amber desert blooms.
 */
export class SunlitOasisBiomeRenderer extends BaseBiomeRenderer {
  public readonly biomeId = 'sunlit_oasis' as const;
  public readonly stoneColor = 0x4a3e24;
  public readonly stoneRimColor = 0x6b5832;

  protected drawDecor(
    g: PIXI.Graphics,
    fx: number,
    fy: number,
    nextRand: () => number
  ): void {
    // Golden sun-wheat tufts & warm amber desert blooms
    g.moveTo(fx, fy)
      .lineTo(fx - 5, fy - 9)
      .moveTo(fx, fy)
      .lineTo(fx + 1, fy - 11)
      .moveTo(fx, fy)
      .lineTo(fx + 6, fy - 8)
      .stroke({ color: 0xfbbf24, width: 2, alpha: 0.52 });

    if (nextRand() < 0.45) {
      g.circle(fx + 1, fy - 11, 3.2).fill({ color: PALETTE.GOLD_STAR, alpha: 0.58 });
    }
  }
}
