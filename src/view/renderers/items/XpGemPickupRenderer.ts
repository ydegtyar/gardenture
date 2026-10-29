import { PALETTE } from '../../../content/data/catalog';
import type { SimPickup } from '../../../sim/Simulation';
import type { PickupRenderContext, PickupRenderer } from './types';

export class XpGemPickupRenderer implements PickupRenderer {
  public readonly kind = 'xp_gem';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'xp_gem';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, px, py } = ctx;
    g.moveTo(px, py - 7)
      .lineTo(px + 6, py)
      .lineTo(px, py + 7)
      .lineTo(px - 6, py)
      .closePath()
      .fill({ color: PALETTE.MINT_GREEN })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
  }
}
