import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { BaseBiomeRenderer } from './BaseBiomeRenderer';

/**
 * Crimson Ashlands Biome Renderer:
 * Volcanic cinder wastes with obsidian basalt slabs, smoldering ember embers,
 * and fiery magma fissures.
 */
export class CrimsonAshlandsBiomeRenderer extends BaseBiomeRenderer {
  public readonly biomeId = 'crimson_ashlands' as const;
  public readonly stoneColor = 0x3d1d24;
  public readonly stoneRimColor = 0x5e2b34;

  protected drawDecor(
    g: PIXI.Graphics,
    fx: number,
    fy: number,
    nextRand: () => number
  ): void {
    if (nextRand() < 0.45) {
      // Smoldering ember spark & glowing heat core
      const sparkRadius = 2 + nextRand() * 2;
      g.circle(fx, fy, sparkRadius * 1.8).fill({
        color: PALETTE.CRIMSON_WARN,
        alpha: 0.35,
      });
      g.circle(fx, fy, sparkRadius).fill({
        color: PALETTE.CORAL_ORANGE,
        alpha: 0.7,
      });
      g.circle(fx, fy, sparkRadius * 0.45).fill({
        color: PALETTE.BUTTER_YELLOW,
        alpha: 0.9,
      });
    } else {
      // Jagged volcanic crack / cinder fissure
      const offX = (nextRand() - 0.5) * 6;
      g.moveTo(fx - 5, fy + 4)
        .lineTo(fx + offX, fy)
        .lineTo(fx + 6, fy - 6)
        .stroke({ color: PALETTE.CORAL_ORANGE, width: 2, alpha: 0.6 });

      // Tiny floating ash flake
      g.circle(fx + offX * 1.5, fy - 8, 1.6).fill({
        color: 0xfca5a5,
        alpha: 0.5,
      });
    }
  }
}
