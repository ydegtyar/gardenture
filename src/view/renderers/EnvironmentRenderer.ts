import * as PIXI from 'pixi.js';
import type { BiomeId } from '../../content/schema/types';
import type { Simulation } from '../../sim/Simulation';
import {
  biomeRegistry,
  drawFinalBossThornArena,
  type BiomeRenderContext,
} from './bioms';

export const PPU = 48;
export const CHUNK_SIZE_U = 12;
export const CHUNK_PX = CHUNK_SIZE_U * PPU;

/**
 * Facade renderer for Environment (Biome terrain chunks & boss arena).
 * Delegates biome terrain chunk generation to Strategy instances in `bioms/`.
 */
export class EnvironmentRenderer {
  public static populateGroundChunk(
    g: PIXI.Graphics,
    cx: number,
    cy: number,
    biomeId: BiomeId
  ): void {
    let hash = Math.imul(cx * 73856093, cy * 19349663) ^ 0x9e3779b9;
    const nextRand = (): number => {
      hash ^= hash << 13;
      hash ^= hash >>> 17;
      hash ^= hash << 5;
      return (hash >>> 0) / 0x100000000;
    };

    const ctx: BiomeRenderContext = {
      g,
      cx,
      cy,
      chunkPx: CHUNK_PX,
      nextRand,
    };

    const renderer = biomeRegistry.get(biomeId);
    renderer.populateGroundChunk(ctx);
  }

  public static drawFinalBossThornArena(
    g: PIXI.Graphics,
    sim: Simulation,
    elapsedSeconds: number
  ): void {
    drawFinalBossThornArena(g, sim, elapsedSeconds, PPU);
  }
}
