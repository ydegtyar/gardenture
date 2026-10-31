import * as PIXI from 'pixi.js';
import { lerp } from '../../../core/math/vec2';
import type { SimPickup } from '../../../sim/Simulation';
import type { PickupRenderer } from './types';
import { XpGemPickupRenderer } from './XpGemPickupRenderer';
import { XpClusterPickupRenderer } from './XpClusterPickupRenderer';
import { GoldCoinPickupRenderer } from './GoldCoinPickupRenderer';
import { HealingSeedPickupRenderer } from './HealingSeedPickupRenderer';
import { HealPotionPickupRenderer } from './HealPotionPickupRenderer';
import { PowerUpPickupRenderer } from './PowerUpPickupRenderer';
import { ChestPickupRenderer } from './ChestPickupRenderer';

export interface PickupBobConfig {
  BOB_AMPLITUDE: number;
  BOB_SPEED: number;
  SHADOW_MIN_SCALE: number;
  SHADOW_MIN_ALPHA: number;
  SHADOW_MAX_ALPHA: number;
}

export type PickupBobKind = 'xp_gem' | 'xp_cluster' | 'gold_coin';

export const PICKUP_BOB_CONFIG: Record<PickupBobKind, PickupBobConfig> = {
  xp_gem: {
    BOB_AMPLITUDE: 2.5,
    BOB_SPEED: 5.0,
    SHADOW_MIN_SCALE: 0.75,
    SHADOW_MIN_ALPHA: 0.192,
    SHADOW_MAX_ALPHA: 0.32,
  },
  xp_cluster: {
    BOB_AMPLITUDE: 3.2,
    BOB_SPEED: 4.5,
    SHADOW_MIN_SCALE: 0.75,
    SHADOW_MIN_ALPHA: 0.216,
    SHADOW_MAX_ALPHA: 0.36,
  },
  gold_coin: {
    BOB_AMPLITUDE: 2.0,
    BOB_SPEED: 5.5,
    SHADOW_MIN_SCALE: 0.75,
    SHADOW_MIN_ALPHA: 0.192,
    SHADOW_MAX_ALPHA: 0.32,
  },
};

export const BOB_CONFIG = PICKUP_BOB_CONFIG;

/**
 * Reusable shadow sprite for zero per-frame allocations during the render/ticker loop.
 * Keeps shadow fixed at ground position while scale and alpha animate in sync with bobbing.
 */
export class PickupShadowSprite extends PIXI.Sprite {
  public pickupY = 0;

  public updateLevitation(
    p: SimPickup,
    elapsedSeconds: number,
    config: PickupBobConfig,
    px: number,
    groundY: number,
    shadowOffsetY: number
  ): void {
    const pAny = p as { phase?: number };
    if (pAny.phase === undefined) {
      pAny.phase = (p.id * 1.61803398875) % (Math.PI * 2);
    }
    const phase = pAny.phase + elapsedSeconds * config.BOB_SPEED;

    const minY = -config.BOB_AMPLITUDE;
    const maxY = config.BOB_AMPLITUDE;
    const offsetY = Math.sin(phase) * config.BOB_AMPLITUDE;
    const t = (offsetY - minY) / (maxY - minY);

    this.anchor.set(0.5, 0.5);
    this.x = px;
    this.y = groundY + shadowOffsetY;
    this.scale.set(lerp(1, config.SHADOW_MIN_SCALE, t));
    this.alpha = lerp(config.SHADOW_MAX_ALPHA, config.SHADOW_MIN_ALPHA, t);
    this.pickupY = groundY - offsetY;
  }

  public update(
    p: SimPickup,
    elapsedSeconds: number,
    config: PickupBobConfig,
    px: number,
    groundY: number,
    shadowOffsetY: number
  ): void {
    this.updateLevitation(p, elapsedSeconds, config, px, groundY, shadowOffsetY);
  }
}

export const reusableShadow = new PickupShadowSprite();

/**
 * Strategy Registry mapping pickup items to their respective renderer,
 * eliminating `if/else` ladders in pickup rendering.
 */
export class PickupRegistry {
  private readonly renderers = new Map<string, PickupRenderer>();

  constructor() {
    this.register(new XpGemPickupRenderer());
    this.register(new XpClusterPickupRenderer());
    this.register(new GoldCoinPickupRenderer());
    this.register(new HealingSeedPickupRenderer());
    this.register(new HealPotionPickupRenderer());
    this.register(new PowerUpPickupRenderer());
    this.register(new ChestPickupRenderer());
  }

  public register(renderer: PickupRenderer): void {
    this.renderers.set(renderer.kind, renderer);
  }

  public get(kind: string): PickupRenderer | undefined {
    return this.renderers.get(kind);
  }

  public findForPickup(pickup: SimPickup): PickupRenderer | undefined {
    return this.renderers.get(pickup.kind);
  }

  public getBobConfig(kind: string): PickupBobConfig | undefined {
    return (PICKUP_BOB_CONFIG as Record<string, PickupBobConfig>)[kind];
  }
}

export const pickupRegistry = new PickupRegistry();
