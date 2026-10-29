import * as PIXI from 'pixi.js';
import type { BiomeId } from '../../../content/schema/types';

export interface BiomeRenderContext {
  g: PIXI.Graphics;
  cx: number;
  cy: number;
  chunkPx: number;
  nextRand: () => number;
}

export interface BiomeRenderer {
  readonly biomeId: BiomeId;
  readonly stoneColor: number;
  readonly stoneRimColor: number;
  populateGroundChunk(ctx: BiomeRenderContext): void;
}
