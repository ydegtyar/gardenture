import { PALETTE } from '../../../content/data/catalog';
import { getPowerUpDef } from '../../../game/data/powerups';
import type { SimPickup } from '../../../sim/Simulation';
import { getPowerUpTexture } from '../../PowerUpAtlas';
import { PPU } from '../EnvironmentRenderer';
import type { PickupRenderContext, PickupRenderer } from './types';

export class HealPotionPickupRenderer implements PickupRenderer {
  public readonly kind = 'heal_potion';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'heal_potion';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, pickup: p, sim, px, acquireSprite } = ctx;
    const def = getPowerUpDef('heal-20hp');
    const col = def.tint;
    // Gentle bobbing: Math.sin(t * 3) * 3
    const py = p.y * PPU + Math.sin(sim.elapsedSeconds * 3 + p.id) * 3;
    const pulse = 1 + 0.08 * Math.sin(sim.elapsedSeconds * 5 + p.id);

    // Ground shadow
    g.ellipse(px, py + 14, 12, 5).fill({ color: 0x0f131d, alpha: 0.38 });

    // Soft radial glow behind the icon (color: def.tint, alpha: 0.25)
    g.circle(px, py, 20 * pulse).fill({ color: col, alpha: 0.25 });
    g.circle(px, py, 16 * pulse).stroke({
      color: col,
      width: 1.8,
      alpha: 0.62,
    });

    const tex = getPowerUpTexture('heal-20hp', 64);
    if (tex && acquireSprite) {
      const sprite = acquireSprite(tex);
      sprite.anchor.set(0.5);
      sprite.width = 34;
      sprite.height = 34;
      sprite.position.set(px, py);
      return;
    }

    // Fallback vector badge if texture hasn't finished loading on frame 0
    g.circle(px, py, 9.5)
      .fill({ color: col })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
    g.rect(px - 1.8, py - 5.2, 3.6, 10.4).fill({ color: PALETTE.CREAM_WHITE });
    g.rect(px - 5.2, py - 1.8, 10.4, 3.6).fill({ color: PALETTE.CREAM_WHITE });
  }
}
