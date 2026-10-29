import { PALETTE } from '../../../content/data/catalog';
import type { SimPickup } from '../../../sim/Simulation';
import type { PickupRenderContext, PickupRenderer } from './types';

export class HealingSeedPickupRenderer implements PickupRenderer {
  public readonly kind = 'healing_seed';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'healing_seed';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, px, py } = ctx;
    g.circle(px, py, 8)
      .fill({ color: PALETTE.MINT_GREEN })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
    g.rect(px - 1.5, py - 4.5, 3, 9).fill({ color: PALETTE.CREAM_WHITE });
    g.rect(px - 4.5, py - 1.5, 9, 3).fill({ color: PALETTE.CREAM_WHITE });
  }
}
