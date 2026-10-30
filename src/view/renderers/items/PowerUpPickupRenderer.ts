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
    // Gentle bobbing: Math.sin(t * 3) * 3
    const py = p.y * PPU + Math.sin(sim.elapsedSeconds * 3 + p.id) * 3;
    const pulse = 1 + 0.08 * Math.sin(sim.elapsedSeconds * 5 + p.id);

    // Ground shadow
    g.ellipse(px, py + 15, 13, 5.5).fill({ color: 0x0f131d, alpha: 0.42 });

    // Soft radial glow behind the icon (color: def.tint, alpha: 0.25)
    g.circle(px, py, 22 * pulse).fill({ color: col, alpha: 0.25 });
    g.circle(px, py, 18 * pulse).stroke({
      color: col,
      width: 2,
      alpha: 0.68,
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
