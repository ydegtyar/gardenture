import * as PIXI from 'pixi.js';
import type { Simulation } from '../../../sim/Simulation';
import type { SpriteKey } from '../../SpriteAtlas';
import type { HeroWeaponSocket } from './GardenBladeAttachment';

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
  /** Whether this persona skin suppresses the profession's default weapon (e.g. Herbalist's wooden stick) */
  readonly suppressDefaultWeapon?: boolean;
  /** Whether this persona has a default resting weapon */
  readonly hasDefaultWeapon?: boolean;
  /** Custom weapon socket overrides for this persona skin (e.g. Garden Blade attachment sleeve/cuff colors) */
  readonly weaponSocket?: Partial<HeroWeaponSocket>;
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
