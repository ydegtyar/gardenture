import * as PIXI from 'pixi.js';
import type { SimPickup, Simulation } from '../../../sim/Simulation';

export interface PickupRenderContext {
  g: PIXI.Graphics;
  pickup: SimPickup;
  sim: Simulation;
  px: number;
  py: number;
  acquireSprite?: (tex: PIXI.Texture) => PIXI.Sprite;
}

export interface PickupRenderer {
  readonly kind: string;
  matches(pickup: SimPickup): boolean;
  draw(ctx: PickupRenderContext): void;
}
