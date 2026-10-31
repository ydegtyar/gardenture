import { PALETTE } from '../../../content/data/catalog';
import { getPowerUpDef } from '../../../game/data/powerups';
import type { SimPickup } from '../../../sim/Simulation';
import { getPowerUpTexture } from '../../PowerUpAtlas';
import { PPU } from '../EnvironmentRenderer';
import type { PickupRenderContext, PickupRenderer } from './types';

export class PowerUpPickupRenderer implements PickupRenderer {
  public readonly kind = 'power_up';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'power_up';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, pickup: p, sim, px, acquireSprite } = ctx;
    const pId = p.powerUpId ?? 'shield';
    const def = getPowerUpDef(pId);
    const col = def.tint;
    const baseY = p.y * PPU;
    const bob = Math.sin(sim.elapsedSeconds * 3 + p.id) * 3;
    const py = baseY + bob;

    // Multi-layered feathered ground drop shadow anchored beneath the floating power-up
    const shadowScale = 1 - bob * 0.05;
    const groundY = baseY + 16;
    g.ellipse(px, groundY, 15 * shadowScale, 6.5 * shadowScale).fill({
      color: 0x0f131d,
      alpha: 0.18,
    });
    g.ellipse(px, groundY, 11 * shadowScale, 4.6 * shadowScale).fill({
      color: 0x0f131d,
      alpha: 0.35,
    });
    g.ellipse(px, groundY, 7.5 * shadowScale, 3.0 * shadowScale).fill({
      color: 0x0f131d,
      alpha: 0.52,
    });

    const tex = getPowerUpTexture(def.id, 64);
    if (tex && acquireSprite) {
      const sprite = acquireSprite(tex);
      sprite.anchor.set(0.5);
      sprite.width = 36;
      sprite.height = 36;
      sprite.position.set(px, py);
      return;
    }

    // Fallback vector badge if texture hasn't finished loading on frame 0
    g.circle(px, py, 11)
      .fill({ color: col })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
  }
}
