import { PALETTE } from '../../../content/data/catalog';
import type { SimPickup } from '../../../sim/Simulation';
import type { PickupRenderContext, PickupRenderer } from './types';

export class HealPotionPickupRenderer implements PickupRenderer {
  public readonly kind = 'heal_potion';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'heal_potion';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, pickup: p, sim, px, py } = ctx;
    const pulse = 1 + 0.08 * Math.sin(sim.elapsedSeconds * 6.5 + p.id);
    g.ellipse(px, py + 10, 9.5, 4.2).fill({ color: 0x0f131d, alpha: 0.35 });

    // Soft emerald-rose aura petals behind flask
    for (let i = 0; i < 4; i++) {
      const a = sim.elapsedSeconds * 1.8 + (i * Math.PI) / 2;
      const ox = px + Math.cos(a) * 9.5 * pulse;
      const oy = py + Math.sin(a) * 9.5 * pulse;
      g.ellipse(ox, oy, 3.2, 1.8).fill({
        color: i % 2 === 0 ? PALETTE.MINT_GREEN : PALETTE.BLUSH_ROSE,
        alpha: 0.72,
      });
    }

    // Golden flask neck & leaf stopper
    g.roundRect(px - 3.5, py - 11.5, 7, 4.5, 1.5)
      .fill({ color: PALETTE.GOLD_STAR })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });
    g.moveTo(px, py - 11)
      .lineTo(px + 5.5, py - 14.5)
      .lineTo(px + 2, py - 9.5)
      .closePath()
      .fill({ color: PALETTE.MINT_GREEN })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.4 });

    // Rounded heart-blossom potion body
    g.circle(px, py, 9.5)
      .fill({ color: 0x10b981 })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
    g.circle(px - 2.5, py - 2.5, 3.2).fill({ color: 0xa7f3d0, alpha: 0.65 });

    // Crisp white healing cross (+20 HP)
    g.rect(px - 1.8, py - 5.2, 3.6, 10.4).fill({ color: PALETTE.CREAM_WHITE });
    g.rect(px - 5.2, py - 1.8, 10.4, 3.6).fill({ color: PALETTE.CREAM_WHITE });
  }
}
