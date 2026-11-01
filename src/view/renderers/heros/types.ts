import type * as PIXI from 'pixi.js';
import type { Simulation } from '../../../sim/Simulation';
import type { HeroWeaponSocket } from './GardenBladeAttachment';
import type {
  HeroGaitStyle,
  HeroPose,
  HeroRig,
  HeroRigProportions,
  SocketMap,
  SocketName,
} from './rig/HeroRigCore';
import type { PersonaCelPalette } from './rig/CelHeroDrawer';

export type {
  HeroGaitStyle,
  HeroPose,
  HeroRig,
  HeroRigProportions,
  SocketMap,
  SocketName,
  PersonaCelPalette,
};

export interface HeroRenderContext {
  heroUnderGraphic: PIXI.Graphics;
  heroSprite: PIXI.Sprite;
  heroWeaponGraphic: PIXI.Graphics;
  atlasTextures: Map<string, PIXI.Texture>;
  sim: Simulation;
  alpha: number;
  displayFacingAngle: number;
}

export interface PersonaRenderContext {
  gUnder: PIXI.Graphics;
  gOver: PIXI.Graphics;
  hx: number;
  cy: number;
  groundY: number;
  flipX: number;
  isMoving: boolean;
  walkPhase: number;
  elapsedSeconds: number;
  eyeLeftColor: number;
  eyeRightColor: number;
  heroVx: number;
  heroVy: number;
  /** Solved procedural rig & socket pose for the current frame */
  heroPose?: HeroPose;
}

/**
 * Formal Socket-Bound Attachment Contract for weapons, tools, and spell emitters
 * (e.g. GardenBladeAttachment, ChainLightningAttachment).
 */
export interface Attachment {
  readonly id: string;
  /** Whether equipping this attachment hides the hero's default idle tool/staff */
  readonly suppressesDefaultWeapon: boolean;
  /** Declares which named hero sockets this attachment binds to */
  getSocketRequirements(): readonly SocketName[];
  /** Updates attachment state and optionally modifies heroPose (e.g. arm IK target, recoil, sleeve glow) */
  update(dt: number, heroPose: HeroPose): void;
  /** Draws attachment primitives into gUnder (behind body) and gOver (in front of body) */
  draw(gUnder: PIXI.Graphics, gOver: PIXI.Graphics, heroPose: HeroPose): void;
}

export interface PersonaRenderer {
  readonly id: string;
  readonly isLevitating?: boolean;
  readonly suppressDefaultWeapon?: boolean;
  readonly hasDefaultWeapon?: boolean;
  readonly weaponSocket?: Partial<HeroWeaponSocket>;
  /** Optional cel-shaded palette override for this persona */
  readonly palette?: PersonaCelPalette;
  /** Optional custom 2D rig proportions override */
  readonly rigProportions?: Partial<HeroRigProportions>;
  /** Optional locomotion personality style */
  readonly gaitStyle?: HeroGaitStyle;
  /** Draws the persona's signature elemental aura / orbitals */
  drawAura(ctx: PersonaRenderContext): void;
  /** Optional custom procedural vector body override */
  drawVectorBody?(
    gUnder: PIXI.Graphics,
    gOver: PIXI.Graphics,
    pose: HeroPose,
    elapsedSeconds: number
  ): void;
}

export interface HeroProfessionRenderer {
  readonly professionId: string;
  drawHero(ctx: HeroRenderContext): void;
}
