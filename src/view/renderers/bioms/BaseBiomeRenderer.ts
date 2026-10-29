import * as PIXI from 'pixi.js';
import { THEME_PACKS } from '../../../content/data/catalog';
import type { BiomeId } from '../../../content/schema/types';
import type { BiomeRenderContext, BiomeRenderer } from './types';

/**
 * Base template class for Biome ground rendering.
 * Provides the procedural noise seed, organic ground patches,
 * and stone slab placement, delegating biome-specific flora/decorations
 * to subclasses.
 */
export abstract class BaseBiomeRenderer implements BiomeRenderer {
  public abstract readonly biomeId: BiomeId;
  public abstract readonly stoneColor: number;
  public abstract readonly stoneRimColor: number;

  public populateGroundChunk(ctx: BiomeRenderContext): void {
    const { g, chunkPx, nextRand } = ctx;
    const theme = THEME_PACKS[this.biomeId] ?? THEME_PACKS.garden;
    const baseBg = theme.groundBaseColor;
    const tileAlt = theme.groundTileAltColor;

    g.rect(0, 0, chunkPx, chunkPx).fill({ color: baseBg });

    // Subtle organic ground patches
    for (let i = 0; i < 8; i++) {
      const px = nextRand() * (chunkPx - 90) + 45;
      const py = nextRand() * (chunkPx - 90) + 45;
      const rw = 36 + nextRand() * 52;
      const rh = 24 + nextRand() * 36;
      g.ellipse(px, py, rw, rh).fill({ color: tileAlt, alpha: 0.55 });
    }

    // Stepping stones / flagstones / sandstone slabs
    for (let i = 0; i < 5; i++) {
      const sx = nextRand() * (chunkPx - 60) + 30;
      const sy = nextRand() * (chunkPx - 60) + 30;
      const sr = 10 + nextRand() * 12;
      g.ellipse(sx, sy + 2, sr * 1.2, sr * 0.85).fill({ color: 0x0f131d, alpha: 0.35 });
      g.ellipse(sx, sy, sr * 1.15, sr * 0.8)
        .fill({ color: this.stoneColor, alpha: 0.65 })
        .stroke({ color: this.stoneRimColor, width: 1.5, alpha: 0.5 });
    }

    // Biome-specific decorative flora, runes, or petals
    for (let i = 0; i < 12; i++) {
      const fx = nextRand() * (chunkPx - 32) + 16;
      const fy = nextRand() * (chunkPx - 32) + 16;
      this.drawDecor(g, fx, fy, nextRand);
    }
  }

  protected abstract drawDecor(
    g: PIXI.Graphics,
    fx: number,
    fy: number,
    nextRand: () => number
  ): void;
}
