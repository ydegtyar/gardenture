import { PALETTE } from '../../../content/data/catalog';
import type { SimPickup } from '../../../sim/Simulation';
import type { PickupRenderContext, PickupRenderer } from './types';

export class ChestPickupRenderer implements PickupRenderer {
  public readonly kind = 'chest';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'chest';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, px, py } = ctx;
    g.roundRect(px - 13, py - 10, 26, 20, 4)
      .fill({ color: PALETTE.GOLD_STAR })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });
    g.rect(px - 13, py - 2, 26, 4).fill({ color: PALETTE.INK_OUTLINE });
    g.circle(px, py, 3.5).fill({ color: PALETTE.CREAM_WHITE });
  }
}
