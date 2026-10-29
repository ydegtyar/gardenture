import { PALETTE } from '../../../content/data/catalog';
import type { SimPickup } from '../../../sim/Simulation';
import type { PickupRenderContext, PickupRenderer } from './types';

export class XpClusterPickupRenderer implements PickupRenderer {
  public readonly kind = 'xp_cluster';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'xp_cluster';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, px, py } = ctx;
    g.circle(px, py, 9)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
    g.circle(px - 2, py - 2, 3.5).fill({ color: PALETTE.CREAM_WHITE });
  }
}
