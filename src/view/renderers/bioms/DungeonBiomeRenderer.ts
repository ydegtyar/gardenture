import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { BaseBiomeRenderer } from './BaseBiomeRenderer';

/**
 * Subterranean Ruin (Dungeon) Biome Renderer:
 * Dark lavender-slate flagstones with bioluminescent arcane moss & runes.
 */
export class DungeonBiomeRenderer extends BaseBiomeRenderer {
  public readonly biomeId = 'dungeon' as const;
  public readonly stoneColor = 0x2a314d;
  public readonly stoneRimColor = 0x3b4468;

  protected drawDecor(g: PIXI.Graphics, fx: number, fy: number): void {
    g.moveTo(fx, fy + 6)
      .lineTo(fx - 4, fy - 2)
      .lineTo(fx, fy - 8)
      .lineTo(fx + 4, fy - 2)
      .closePath()
      .fill({ color: PALETTE.LILAC_ARCANE, alpha: 0.25 });
  }
}
