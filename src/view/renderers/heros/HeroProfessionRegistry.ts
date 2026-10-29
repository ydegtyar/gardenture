import type { HeroProfessionRenderer } from './types';
import { WardenHeroRenderer } from './WardenHeroRenderer';
import { SeekerHeroRenderer } from './SeekerHeroRenderer';
import { HerbalistHeroRenderer } from './HerbalistHeroRenderer';
import { StormcallerHeroRenderer } from './StormcallerHeroRenderer';

/**
 * Strategy Registry mapping profession IDs to their respective HeroProfessionRenderer implementations,
 * eliminating hero profession if/else checks.
 */
export class HeroProfessionRegistry {
  private readonly renderers = new Map<string, HeroProfessionRenderer>();
  private readonly defaultRenderer: HeroProfessionRenderer;

  constructor() {
    const warden = new WardenHeroRenderer();
    this.defaultRenderer = warden;
    this.register(warden);
    this.register(new SeekerHeroRenderer());
    this.register(new HerbalistHeroRenderer());
    this.register(new StormcallerHeroRenderer());
  }

  public register(renderer: HeroProfessionRenderer): void {
    this.renderers.set(renderer.professionId, renderer);
  }

  public get(professionId: string): HeroProfessionRenderer {
    return this.renderers.get(professionId) ?? this.defaultRenderer;
  }
}

export const heroProfessionRegistry = new HeroProfessionRegistry();
