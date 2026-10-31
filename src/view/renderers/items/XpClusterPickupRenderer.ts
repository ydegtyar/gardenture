import { PALETTE } from '../../../content/data/catalog';
import { lerp } from '../../../core/math/vec2';
import type { SimPickup } from '../../../sim/Simulation';
import { PPU } from '../EnvironmentRenderer';
import { PICKUP_BOB_CONFIG, reusableShadow } from './PickupRegistry';
import type { PickupRenderContext, PickupRenderer } from './types';

export class XpClusterPickupRenderer implements PickupRenderer {
  public readonly kind = 'xp_cluster';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'xp_cluster';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, pickup: p, sim, px } = ctx;
    const groundY = p.y * PPU;
    const config = PICKUP_BOB_CONFIG.xp_cluster;

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
    shadow.y = groundY + 9;
    shadow.scale.set(lerp(1, config.SHADOW_MIN_SCALE, t));
    shadow.alpha = lerp(config.SHADOW_MAX_ALPHA, config.SHADOW_MIN_ALPHA, t);

    // Fixed ground shadow below cluster rendered before the cluster in child/draw order
    g.ellipse(shadow.x, shadow.y, 9.5 * shadow.scale.x, 3.6 * shadow.scale.y).fill({
      color: 0x0f131d,
      alpha: shadow.alpha,
    });

    const py = groundY - offsetY;
    g.circle(px, py, 9)
      .fill({ color: PALETTE.BUTTER_YELLOW })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5 });
    g.circle(px - 2, py - 2, 3.5).fill({ color: PALETTE.CREAM_WHITE });
  }
}
