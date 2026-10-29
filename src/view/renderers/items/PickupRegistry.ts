import type { SimPickup } from '../../../sim/Simulation';
import type { PickupRenderer } from './types';
import { XpGemPickupRenderer } from './XpGemPickupRenderer';
import { XpClusterPickupRenderer } from './XpClusterPickupRenderer';
import { GoldCoinPickupRenderer } from './GoldCoinPickupRenderer';
import { HealingSeedPickupRenderer } from './HealingSeedPickupRenderer';
import { HealPotionPickupRenderer } from './HealPotionPickupRenderer';
import { PowerUpPickupRenderer } from './PowerUpPickupRenderer';
import { ChestPickupRenderer } from './ChestPickupRenderer';

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
}

export const pickupRegistry = new PickupRegistry();
