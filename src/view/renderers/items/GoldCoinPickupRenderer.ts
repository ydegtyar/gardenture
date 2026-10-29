import { PALETTE } from '../../../content/data/catalog';
import type { SimPickup } from '../../../sim/Simulation';
import type { PickupRenderContext, PickupRenderer } from './types';

export class GoldCoinPickupRenderer implements PickupRenderer {
  public readonly kind = 'gold_coin';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'gold_coin';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, pickup: p, sim, px, py } = ctx;
    const spinScale = 0.72 + 0.28 * Math.abs(Math.cos(sim.elapsedSeconds * 5.5 + p.id));
    const rOuter = p.value >= 5 ? 9.5 : p.value >= 3 ? 8.2 : 7.0;
    g.ellipse(px, py + 8, rOuter * 0.8, 3.2).fill({ color: 0x0f131d, alpha: 0.32 });
    g.ellipse(px, py, rOuter * spinScale, rOuter)
      .fill({ color: PALETTE.GOLD_STAR })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
    g.ellipse(px, py, rOuter * 0.62 * spinScale, rOuter * 0.62).stroke({
      color: PALETTE.BUTTER_YELLOW,
      width: 1.4,
      alpha: 0.9,
    });
    g.moveTo(px, py - 3.2)
      .lineTo(px + 2.4 * spinScale, py)
      .lineTo(px, py + 3.2)
      .lineTo(px - 2.4 * spinScale, py)
      .closePath()
      .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.92 });
  }
}
