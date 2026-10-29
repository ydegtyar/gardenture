import type { PersonaRenderer, PersonaRenderContext } from './types';

/**
 * Losti Seige persona aura renderer:
 * Uses the classic dark ground shadow under the hero (no pulsing circle, no spinning orbs).
 */
export class WardenZagreusPersonaRenderer implements PersonaRenderer {
  public readonly id = 'warden_zagreus_naruto';

  public drawAura(_ctx: PersonaRenderContext): void {
    // Losti Seige: Uses the classic dark ground shadow under the hero (no pulsing circle, no spinning orbs)
  }
}
