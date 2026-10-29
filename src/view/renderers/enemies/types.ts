import * as PIXI from 'pixi.js';
import type { SimEnemy, Simulation } from '../../../sim/Simulation';

export interface EnemyRenderContext {
  enemy: SimEnemy;
  sim: Simulation;
  ex: number;
  ey: number;
  rPx: number;
  cosA: number;
  sinA: number;
  walkPhase: number;
  isMoving: boolean;
  accentColor: number;
  gUnder: PIXI.Graphics;
  gOver: PIXI.Graphics;
  telegraphGraphic: PIXI.Graphics;
}

export interface EnemyTransformModifiers {
  renderX?: number;
  cy?: number;
  animScaleX?: number;
  animScaleY?: number;
  animRotation?: number;
}

export interface EnemyBehaviorRenderer {
  readonly id: string;
  matches(enemy: SimEnemy): boolean;
  drawTelegraph?(ctx: EnemyRenderContext, progress: number): void;
  hasLegs?(enemy: SimEnemy): boolean;
  modifyTransform?(ctx: EnemyRenderContext, baseCy: number): EnemyTransformModifiers;
  drawOverlay?(ctx: EnemyRenderContext, renderX: number, cy: number): void;
}
