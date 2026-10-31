import type { BiomeId } from '../../../content/schema/types';
import type { BiomeRenderer } from './types';
import { GardenBiomeRenderer } from './GardenBiomeRenderer';
import { DungeonBiomeRenderer } from './DungeonBiomeRenderer';
import { SakuraGroveBiomeRenderer } from './SakuraGroveBiomeRenderer';
import { SunlitOasisBiomeRenderer } from './SunlitOasisBiomeRenderer';
import { FrostbiteGladeBiomeRenderer } from './FrostbiteGladeBiomeRenderer';
import { CrimsonAshlandsBiomeRenderer } from './CrimsonAshlandsBiomeRenderer';

/**
 * Strategy Registry mapping Biome IDs to their specialized BiomeRenderer,
 * eliminating `if/else` checks when rendering terrain chunks.
 */
export class BiomeRegistry {
  private readonly renderers = new Map<BiomeId, BiomeRenderer>();
  private readonly defaultRenderer: BiomeRenderer;

  constructor() {
    const garden = new GardenBiomeRenderer();
    this.defaultRenderer = garden;
    this.register(garden);
    this.register(new DungeonBiomeRenderer());
    this.register(new SakuraGroveBiomeRenderer());
    this.register(new SunlitOasisBiomeRenderer());
    this.register(new FrostbiteGladeBiomeRenderer());
    this.register(new CrimsonAshlandsBiomeRenderer());
  }

  public register(renderer: BiomeRenderer): void {
    this.renderers.set(renderer.biomeId, renderer);
  }

  public get(biomeId: BiomeId): BiomeRenderer {
    return this.renderers.get(biomeId) ?? this.defaultRenderer;
  }
}

export const biomeRegistry = new BiomeRegistry();
