import type { PersonaRenderer } from './types';
import { WardenZagreusPersonaRenderer } from './WardenZagreusPersonaRenderer';
import { SeekerHollowPersonaRenderer } from './SeekerHollowPersonaRenderer';
import { HerbalistFrierenPersonaRenderer } from './HerbalistFrierenPersonaRenderer';
import { StormcallerGojoPersonaRenderer } from './StormcallerGojoPersonaRenderer';

/**
 * Strategy Registry mapping persona IDs to their specific renderer implementations,
 * eliminating persona conditional branching.
 */
export class PersonaRegistry {
  private readonly renderers = new Map<string, PersonaRenderer>();

  constructor() {
    this.register(new WardenZagreusPersonaRenderer());
    this.register(new SeekerHollowPersonaRenderer());
    this.register(new HerbalistFrierenPersonaRenderer());
    this.register(new StormcallerGojoPersonaRenderer());
  }

  public register(renderer: PersonaRenderer): void {
    this.renderers.set(renderer.id, renderer);
  }

  public get(id: string): PersonaRenderer | undefined {
    return this.renderers.get(id);
  }

  public has(id: string): boolean {
    return this.renderers.has(id);
  }
}

export const personaRegistry = new PersonaRegistry();
