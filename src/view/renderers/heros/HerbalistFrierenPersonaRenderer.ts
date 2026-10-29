import type { PersonaRenderer, PersonaRenderContext } from './types';

/**
 * Frieren Strange persona aura renderer:
 * Rotating Eldritch Mandala & Alchemical Halo.
 */
export class HerbalistFrierenPersonaRenderer implements PersonaRenderer {
  public readonly id = 'herbalist_frieren_strange';

  public drawAura(ctx: PersonaRenderContext): void {
    const { gUnder, gOver, hx, groundY, cy, elapsedSeconds } = ctx;

    // Rotating Eldritch Mandala & Alchemical Halo
    const r = 21;
    gUnder
      .ellipse(hx, groundY + 10, r, r * 0.52)
      .stroke({ color: 0xfbbf24, width: 2.0, alpha: 0.78 });

    for (let i = 0; i < 3; i++) {
      const a = elapsedSeconds * 2.2 + (i * Math.PI * 2) / 3;
      const mx = hx + Math.cos(a) * 20;
      const my = cy - 5 + Math.sin(a) * 12;
      gOver
        .circle(mx, my, 2.8)
        .fill({ color: i === 0 ? 0x2dd4bf : 0xfbbf24, alpha: 0.9 });
    }
  }
}
