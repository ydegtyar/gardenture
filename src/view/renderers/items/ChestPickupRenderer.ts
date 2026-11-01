import { PALETTE } from '../../../content/data/catalog';
import type { SimPickup } from '../../../sim/Simulation';
import type { PickupRenderContext, PickupRenderer } from './types';

/**
 * Renders the dropped Tarot Card item (`pickup.kind === 'chest'`, dropped by Special Monsters & Mini-Bosses
 * to trigger a Botanical Tarot Card Draft) with the exact look of the Tarot Card Back
 * from the Card Draft Modal (`DraftCard` back face + `TarotCardBackSvg`).
 */
export class ChestPickupRenderer implements PickupRenderer {
  public readonly kind = 'chest';

  public matches(pickup: SimPickup): boolean {
    return pickup.kind === 'chest';
  }

  public draw(ctx: PickupRenderContext): void {
    const { g, pickup, sim, px, py } = ctx;
    const elapsedSec = (sim?.elapsedTicks ?? 0) / 60;

    // Gentle levitation bob & subtle 3D breathing pulse
    const phase = elapsedSec * 4.2 + pickup.id * 0.91;
    const bobOffset = Math.sin(phase) * 3.2;
    const pulse = 0.5 + 0.5 * Math.sin(elapsedSec * 5.4 + pickup.id * 1.3);

    const cx = px;
    const cy = py - 5 + bobOffset;

    // Vertical Tarot Card dimensions (matching the 180x260 aspect ratio of TarotCardBackSvg)
    const cardW = 24;
    const cardH = 34;
    const halfW = cardW * 0.5;
    const halfH = cardH * 0.5;
    const x0 = cx - halfW;
    const y0 = cy - halfH;

    // 1. Feathered ground shadow ellipse (shrinks slightly as card floats higher)
    const shadowScale = 1 - ((bobOffset + 3.2) / 6.4) * 0.16;
    g.ellipse(px, py + 13, 12.5 * shadowScale, 4.6 * shadowScale)
      .fill({ color: 0x09050c, alpha: 0.46 });
    g.ellipse(px, py + 13, 8.2 * shadowScale, 2.8 * shadowScale)
      .fill({ color: 0x050207, alpha: 0.34 });

    // 2. Ambient emerald-gold tarot aura behind the floating card
    const auraR = 20 + pulse * 3.5;
    g.circle(cx, cy, auraR).fill({ color: 0x34d399, alpha: 0.15 + pulse * 0.08 });
    g.circle(cx, cy, auraR * 0.72).fill({ color: 0xfdffb6, alpha: 0.2 + pulse * 0.1 });

    // 3. Outer StoreItemCard Draft Container (`#0d1a14` -> `#070e0a`, border `#1e5e3a` & `#34d399` inner bevel)
    g.roundRect(x0 - 1.5, y0 - 1.5, cardW + 3, cardH + 3, 4.5)
      .fill({ color: 0x0d1a14 })
      .stroke({ width: 2.2, color: PALETTE.INK_OUTLINE });
    g.roundRect(x0 - 0.5, y0 - 0.5, cardW + 1, cardH + 1, 3.8)
      .stroke({ width: 1.1, color: 0x1e5e3a, alpha: 0.95 });

    // 4. TarotCardBackSvg Base Body (`#241625` / `#1E1322` mystic night-plum)
    g.roundRect(x0, y0, cardW, cardH, 3.5)
      .fill({ color: 0x241625 })
      .stroke({ width: 1.1, color: 0xfde047, alpha: 0.9 });

    // Inner ornamental bronze-gold border (`#8C5A3C` / `#34d399` bevel)
    g.roundRect(x0 + 2, y0 + 2, cardW - 4, cardH - 4, 2.4)
      .fill({ color: 0x1e1322 })
      .stroke({ width: 0.9, color: 0x8c5a3c, alpha: 0.95 });

    // Subtle side vine lattice waves (`#A8E6CF`)
    g.moveTo(x0 + 3.2, y0 + 5)
      .quadraticCurveTo(x0 + 6.8, cy - 4, x0 + 3.2, cy)
      .quadraticCurveTo(x0 + 6.8, cy + 4, x0 + 3.2, y0 + cardH - 5)
      .stroke({ width: 0.75, color: 0xa8e6cf, alpha: 0.38 });
    g.moveTo(x0 + cardW - 3.2, y0 + 5)
      .quadraticCurveTo(x0 + cardW - 6.8, cy - 4, x0 + cardW - 3.2, cy)
      .quadraticCurveTo(x0 + cardW - 6.8, cy + 4, x0 + cardW - 3.2, y0 + cardH - 5)
      .stroke({ width: 0.75, color: 0xa8e6cf, alpha: 0.38 });

    // 5. Four Corner Filigree Diamonds (`#FDE047` & `#34D399` corner brackets)
    const corners: ReadonlyArray<readonly [number, number, number, number]> = [
      [x0 + 3.2, y0 + 3.2, 1, 1],
      [x0 + cardW - 3.2, y0 + 3.2, -1, 1],
      [x0 + 3.2, y0 + cardH - 3.2, 1, -1],
      [x0 + cardW - 3.2, y0 + cardH - 3.2, -1, -1],
    ];
    for (const [cornerX, cornerY, sx, sy] of corners) {
      g.moveTo(cornerX, cornerY + sy * 3.2)
        .lineTo(cornerX, cornerY)
        .lineTo(cornerX + sx * 3.2, cornerY)
        .stroke({ width: 0.95, color: 0x34d399, alpha: 0.9 });
      g.poly([
        cornerX + sx * 1.1,
        cornerY + sy * 0.3,
        cornerX + sx * 1.9,
        cornerY + sy * 1.1,
        cornerX + sx * 1.1,
        cornerY + sy * 1.9,
        cornerX + sx * 0.3,
        cornerY + sy * 1.1,
      ]).fill({ color: 0xfde047 });
    }

    // 6. Top & Bottom Arcane Botanical Leaves (`#A8E6CF`)
    g.moveTo(cx, y0 + 4.2)
      .quadraticCurveTo(cx - 2.3, y0 + 6.8, cx, y0 + 9.2)
      .quadraticCurveTo(cx + 2.3, y0 + 6.8, cx, y0 + 4.2)
      .closePath()
      .fill({ color: 0xa8e6cf })
      .stroke({ width: 0.8, color: PALETTE.INK_OUTLINE });
    g.moveTo(cx, y0 + cardH - 4.2)
      .quadraticCurveTo(cx - 2.3, y0 + cardH - 6.8, cx, y0 + cardH - 9.2)
      .quadraticCurveTo(cx + 2.3, y0 + cardH - 6.8, cx, y0 + cardH - 4.2)
      .closePath()
      .fill({ color: 0xa8e6cf })
      .stroke({ width: 0.8, color: PALETTE.INK_OUTLINE });

    // 7. Central Esoteric Concentric Mystic Rings (matching TarotCardBackSvg)
    g.circle(cx, cy, 7.6)
      .fill({ color: 0x1b111e })
      .stroke({ width: 1.0, color: 0xfde047, alpha: 0.9 });
    g.circle(cx, cy, 6.2).stroke({ width: 0.7, color: 0xded2f9, alpha: 0.75 });
    g.circle(cx, cy, 5.0)
      .fill({ color: 0x140c17 })
      .stroke({ width: 0.9, color: 0x88d49e, alpha: 0.9 });

    // 8. Mystic 8-Pointed Golden Sun & Rose-Coral Starburst
    const diagR = 4.2;
    const diagInner = 1.4;
    g.poly([
      cx - diagR * 0.707,
      cy - diagR * 0.707,
      cx,
      cy - diagInner,
      cx + diagR * 0.707,
      cy - diagR * 0.707,
      cx + diagInner,
      cy,
      cx + diagR * 0.707,
      cy + diagR * 0.707,
      cx,
      cy + diagInner,
      cx - diagR * 0.707,
      cy + diagR * 0.707,
      cx - diagInner,
      cy,
    ]).fill({ color: 0xffaaa6 });

    const starR = 5.6;
    const starInner = 1.35;
    g.poly([
      cx,
      cy - starR,
      cx + starInner,
      cy - starInner,
      cx + starR,
      cy,
      cx + starInner,
      cy + starInner,
      cx,
      cy + starR,
      cx - starInner,
      cy + starInner,
      cx - starR,
      cy,
      cx - starInner,
      cy - starInner,
    ]).fill({ color: 0xfde047 });

    // 9. Center Glowing Gem Seed (`#A8E6CF` with `#2D1E2F` outline and `#FFFDF0` core)
    g.circle(cx, cy, 1.9)
      .fill({ color: 0xa8e6cf })
      .stroke({ width: 0.9, color: PALETTE.INK_OUTLINE });
    g.circle(cx, cy, 0.85).fill({ color: 0xfffdf0 });

    // 10. Orbiting Golden-Mint Tarot Spark Motes
    for (let i = 0; i < 3; i++) {
      const moteAngle = elapsedSec * 2.2 + i * ((Math.PI * 2) / 3) + pickup.id;
      const mx = cx + Math.cos(moteAngle) * 15.5;
      const my = cy + Math.sin(moteAngle) * 18.5;
      g.circle(mx, my, 1.35).fill({
        color: i % 2 === 0 ? 0xfdffb6 : 0x6ee7b7,
        alpha: 0.85,
      });
    }
  }
}
