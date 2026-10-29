import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { BaseBiomeRenderer } from './BaseBiomeRenderer';

/**
 * Mystic Garden Biome Renderer:
 * Whispering briar garden with clover turf, grass tufts, and tiny wildflowers.
 */
export class GardenBiomeRenderer extends BaseBiomeRenderer {
  public readonly biomeId = 'garden' as const;
  public readonly stoneColor = 0x2d3548;
  public readonly stoneRimColor = 0x3b455e;

  protected drawDecor(
    g: PIXI.Graphics,
    fx: number,
    fy: number,
    nextRand: () => number
  ): void {
    // Whispering Briar Garden: grass tufts & tiny wildflowers
    g.moveTo(fx, fy)
      .lineTo(fx - 4, fy - 7)
      .moveTo(fx, fy)
      .lineTo(fx + 1, fy - 9)
      .moveTo(fx, fy)
      .lineTo(fx + 5, fy - 6)
      .stroke({ color: PALETTE.MINT_GREEN, width: 2, alpha: 0.45 });

    if (nextRand() < 0.35) {
      const petalColor =
        nextRand() < 0.5 ? PALETTE.BUTTER_YELLOW : PALETTE.BLUSH_ROSE;
      g.circle(fx + 1, fy - 10, 3).fill({ color: petalColor, alpha: 0.65 });
      g.circle(fx + 1, fy - 10, 1.3).fill({ color: PALETTE.CREAM_WHITE, alpha: 0.8 });
    }
  }
}
