import { PALETTE } from '../../../content/data/catalog';
import { lerp } from '../../../core/math/vec2';
import type { SimPickup } from '../../../sim/Simulation';
import { PPU } from '../EnvironmentRenderer';
import { PICKUP_BOB_CONFIG, reusableShadow } from './PickupRegistry';
import type { PickupRenderContext, PickupRenderer } from './types';

export class GoldCoinPickupRenderer implements PickupRenderer {
  public readonly kind = 'gold_coin';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'gold_coin';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, pickup: p, sim, px } = ctx;
    const groundY = p.y * PPU;
    const config = PICKUP_BOB_CONFIG.gold_coin;

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
    shadow.y = groundY + 8;
    shadow.scale.set(lerp(1, config.SHADOW_MIN_SCALE, t));
    shadow.alpha = lerp(config.SHADOW_MAX_ALPHA, config.SHADOW_MIN_ALPHA, t);

    const spinScale = 0.72 + 0.28 * Math.abs(Math.cos(sim.elapsedSeconds * 5.5 + p.id));
    const rOuter = p.value >= 5 ? 9.5 : p.value >= 3 ? 8.2 : 7.0;

    // Fixed ground shadow below coin rendered before the coin in child/draw order
    g.ellipse(shadow.x, shadow.y, rOuter * 0.8 * shadow.scale.x, 3.2 * shadow.scale.y).fill({
      color: 0x0f131d,
      alpha: shadow.alpha,
    });

    const py = groundY - offsetY;
    g.ellipse(px, py, rOuter * spinScale, rOuter)
      .fill({ color: PALETTE.GOLD_STAR })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });
    g.ellipse(px, py, rOuter * 0.62 * spinScale, rOuter * 0.62).stroke({
      color: PALETTE.BUTTER_YELLOW,
      width: 1.4,
      alpha: 0.9,
    });
    g.moveTo(px, py - 3.2)
      .lineTo(px + 2.4 * spinScale, py)
      .lineTo(px, py + 3.2)
      .lineTo(px - 2.4 * spinScale, py)
      .closePath()
      .fill({ color: PALETTE.CREAM_WHITE, alpha: 0.92 });
  }
}
