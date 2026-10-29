import { PALETTE, POWER_UPS } from '../../../content/data/catalog';
import type { SimPickup } from '../../../sim/Simulation';
import type { PickupRenderContext, PickupRenderer } from './types';

export class PowerUpPickupRenderer implements PickupRenderer {
  public readonly kind = 'power_up';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'power_up';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, pickup: p, sim, px, py } = ctx;
    const pId = p.powerUpId ?? 'shield';
    const pDef = POWER_UPS[pId];
    const col = pDef?.color ?? PALETTE.SKY_BLUE;
    const pulse = 1 + 0.1 * Math.sin(sim.elapsedSeconds * 7 + p.id);

    g.ellipse(px, py + 11, 11, 5).fill({ color: 0x0f131d, alpha: 0.38 });
    g.circle(px, py, 14 * pulse).stroke({
      color: col,
      width: 2,
      alpha: 0.55,
    });
    g.circle(px, py, 11)
      .fill({ color: col })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });

    if (pId === 'fire_breath') {
      g.moveTo(px, py - 6.5)
        .lineTo(px + 5, py + 2)
        .lineTo(px + 1.5, py + 5.5)
        .lineTo(px - 1.5, py + 5.5)
        .lineTo(px - 5, py + 2)
        .closePath()
        .fill({ color: PALETTE.BUTTER_YELLOW })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
      g.circle(px, py + 1.5, 2.4).fill({ color: PALETTE.CREAM_WHITE });
    } else if (pId === 'shield') {
      g.moveTo(px - 4.5, py - 4.5)
        .lineTo(px + 4.5, py - 4.5)
        .lineTo(px + 4.5, py + 1)
        .lineTo(px, py + 5.5)
        .lineTo(px - 4.5, py + 1)
        .closePath()
        .fill({ color: PALETTE.CREAM_WHITE })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
    } else if (pId === 'freeze') {
      g.moveTo(px, py - 6)
        .lineTo(px + 4.5, py)
        .lineTo(px, py + 6)
        .lineTo(px - 4.5, py)
        .closePath()
        .fill({ color: PALETTE.CREAM_WHITE })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
    } else if (pId === 'magnet') {
      g.moveTo(px + 4.5, py - 0.5)
        .arc(px, py - 0.5, 4.5, 0, Math.PI, false)
        .stroke({
          color: PALETTE.CREAM_WHITE,
          width: 2.8,
        });
    } else {
      g.moveTo(px - 4, py - 4.5)
        .lineTo(px + 4, py - 4.5)
        .lineTo(px - 4, py + 4.5)
        .lineTo(px + 4, py + 4.5)
        .closePath()
        .fill({ color: PALETTE.CREAM_WHITE })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.4 });
    }
  }
}
