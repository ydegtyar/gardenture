import * as PIXI from 'pixi.js';
import type { Simulation } from '../../../sim/Simulation';
import type { SpriteKey } from '../../SpriteAtlas';

export interface PersonaRenderContext {
  gUnder: PIXI.Graphics;
  gOver: PIXI.Graphics;
  hx: number;
  cy: number;
  groundY: number;
  flipX: number;
  elapsedSeconds: number;
  eyeLeftColor: number;
  eyeRightColor: number;
  heroVx: number;
  heroVy: number;
}

export interface PersonaRenderer {
  readonly id: string;
  readonly isLevitating?: boolean;
  drawAura(ctx: PersonaRenderContext): void;
}

export interface HeroRenderContext {
  heroUnderGraphic: PIXI.Graphics;
  heroSprite: PIXI.Sprite;
  heroWeaponGraphic: PIXI.Graphics;
  atlasTextures: Map<SpriteKey, PIXI.Texture>;
  sim: Simulation;
  alpha: number;
  displayFacingAngle: number;
}

export interface HeroProfessionRenderer {
  readonly professionId: string;
  draw(ctx: HeroRenderContext): void;
}
