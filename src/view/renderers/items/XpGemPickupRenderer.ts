import { PALETTE } from '../../../content/data/catalog';
import { lerp } from '../../../core/math/vec2';
import type { SimPickup } from '../../../sim/Simulation';
import { PPU } from '../EnvironmentRenderer';
import { PICKUP_BOB_CONFIG, reusableShadow } from './PickupRegistry';
import type { PickupRenderContext, PickupRenderer } from './types';

export class XpGemPickupRenderer implements PickupRenderer {
  public readonly kind = 'xp_gem';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'xp_gem';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, pickup: p, sim, px } = ctx;
    const groundY = p.y * PPU;
    const config = PICKUP_BOB_CONFIG.xp_gem;

    // Use pickup's own state for phase instead of Date.now()
    const pAny = p as { phase?: number };
    if (pAny.phase === undefined) {
      pAny.phase = (p.id * 1.61803398875) % (Math.PI * 2);
    }
    const phase = pAny.phase + sim.elapsedSeconds * config.BOB_SPEED;

    const minY = -config.BOB_AMPLITUDE;
    const maxY = config.BOB_AMPLITUDE;
    const offsetY = Math.sin(phase) * config.BOB_AMPLITUDE;
    const t = (offsetY - minY) / (maxY - minY);

    const shadow = reusableShadow;
    shadow.anchor.set(0.5, 0.5);
    shadow.x = px;
    shadow.y = groundY + 7;
    shadow.scale.set(lerp(1, config.SHADOW_MIN_SCALE, t));
    shadow.alpha = lerp(config.SHADOW_MAX_ALPHA, config.SHADOW_MIN_ALPHA, t);

    // Fixed ground shadow below gem rendered before the gem in child/draw order
    g.ellipse(shadow.x, shadow.y, 6.0 * shadow.scale.x, 2.4 * shadow.scale.y).fill({
      color: 0x0f131d,
      alpha: shadow.alpha,
    });

    const py = groundY - offsetY;
    g.moveTo(px, py - 7)
      .lineTo(px + 6, py)
      .lineTo(px, py + 7)
      .lineTo(px - 6, py)
      .closePath()
      .fill({ color: PALETTE.MINT_GREEN })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2 });
  }
}
