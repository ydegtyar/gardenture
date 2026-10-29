import type { PersonaRenderer, PersonaRenderContext } from './types';

/**
 * Vessel Ackerman persona aura renderer:
 * Abyssal Void-Shade ring + ODM steam wisps.
 */
export class SeekerHollowPersonaRenderer implements PersonaRenderer {
  public readonly id = 'seeker_hollow_levi';

  public drawAura(ctx: PersonaRenderContext): void {
    const { gUnder, hx, groundY, cy, elapsedSeconds } = ctx;

    // Abyssal Void-Shade ring + ODM steam wisps
    gUnder
      .ellipse(hx, groundY + 11, 18, 8.5)
      .fill({ color: 0x0f172a, alpha: 0.36 })
      .stroke({ color: 0x38bdf8, width: 1.8, alpha: 0.75 });

    for (let i = 0; i < 3; i++) {
      const a = elapsedSeconds * 3.6 + (i * Math.PI * 2) / 3;
      const vx = hx + Math.cos(a) * 18;
      const vy = cy + Math.sin(a) * 10;
      gUnder
        .circle(vx, vy, 3.2)
        .fill({ color: i % 2 === 0 ? 0x0f172a : 0xe0f2fe, alpha: 0.85 })
        .stroke({ color: 0x10b981, width: 1.2, alpha: 0.75 });
    }
  }
}
