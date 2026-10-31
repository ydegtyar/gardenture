import * as PIXI from 'pixi.js';
import { BaseBiomeRenderer } from './BaseBiomeRenderer';

/**
 * Frostbite Glade Biome Renderer:
 * Frosted arctic tundra with crystalline ice flagstones, shimmering ice shards,
 * and delicate frozen frost-flowers.
 */
export class FrostbiteGladeBiomeRenderer extends BaseBiomeRenderer {
  public readonly biomeId = 'frostbite_glade' as const;
  public readonly stoneColor = 0x243b53;
  public readonly stoneRimColor = 0x486581;

  protected drawDecor(
    g: PIXI.Graphics,
    fx: number,
    fy: number,
    nextRand: () => number
  ): void {
    if (nextRand() < 0.5) {
      // Shimmering 4-point ice crystal / snowflake star
      const arm = 4 + nextRand() * 3;
      g.moveTo(fx - arm, fy)
        .lineTo(fx + arm, fy)
        .moveTo(fx, fy - arm)
        .lineTo(fx, fy + arm)
        .moveTo(fx - arm * 0.6, fy - arm * 0.6)
        .lineTo(fx + arm * 0.6, fy + arm * 0.6)
        .moveTo(fx - arm * 0.6, fy + arm * 0.6)
        .lineTo(fx + arm * 0.6, fy - arm * 0.6)
        .stroke({ color: 0x90cdf4, width: 1.5, alpha: 0.65 });

      g.circle(fx, fy, 1.8).fill({ color: 0xe2e8f0, alpha: 0.75 });
    } else {
      // Glacial frost-shard crystal needles
      g.moveTo(fx, fy)
        .lineTo(fx - 3, fy - 8)
        .moveTo(fx, fy)
        .lineTo(fx + 2, fy - 10)
        .moveTo(fx, fy)
        .lineTo(fx + 5, fy - 7)
        .stroke({ color: 0x63b3ed, width: 1.8, alpha: 0.55 });

      if (nextRand() < 0.4) {
        g.circle(fx + 2, fy - 10, 2.5).fill({ color: 0xbee3f8, alpha: 0.7 });
      }
    }
  }
}
