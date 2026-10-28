import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { clamp } from '../../../core/math/vec2';
import { PPU } from '../EnvironmentRenderer';
import type { SimVisualEffect } from '../../../sim/Simulation';

/**
 * Renders Bloom Hammer visual effects (falling hammer, ground shadow, impact shockwave & petals).
 */
export function drawBloomHammerEffect(
  g: PIXI.Graphics,
  fx: SimVisualEffect,
  progress: number
): void {
  const impactX = fx.x * PPU;
  const impactY = fx.y * PPU;
  const maxR = fx.radius * PPU;
  const fallPhaseEnd = 0.42;

  if (progress < fallPhaseEnd) {
    // Phase 1: Descending from sky — ONLY ground shadow ellipse, NO border circle!
    const fallT = clamp(progress / fallPhaseEnd, 0, 1);
    const easeIn = fallT * fallT;
    const dropHeight = (1 - easeIn) * 165;
    const hammerY = impactY - dropHeight;

    // Expanding ground shadow below falling hammer (border circle removed per user request)
    g.ellipse(impactX, impactY, maxR * (0.25 + 0.55 * easeIn), maxR * (0.14 + 0.28 * easeIn))
      .fill({ color: 0x0f131d, alpha: 0.22 + 0.28 * easeIn });

    // Vertical speed lines trailing behind the falling hammer
    for (let s = -1; s <= 1; s++) {
      const sx = impactX + s * 12;
      g.moveTo(sx, hammerY - 36)
        .lineTo(sx, hammerY - 4)
        .stroke({
          color: PALETTE.CREAM_WHITE,
          width: 2.5,
          alpha: 0.65 * (1 - fallT * 0.3),
          cap: 'round',
        });
    }

    // Handle of the Blossom Hammer
    g.moveTo(impactX, hammerY - 30)
      .lineTo(impactX, hammerY + 4)
      .stroke({ color: PALETTE.INK_OUTLINE, width: 7, cap: 'round' });
    g.moveTo(impactX, hammerY - 30)
      .lineTo(impactX, hammerY + 4)
      .stroke({ color: 0x92400e, width: 3.8, cap: 'round' });

    // Heavy floral mallet head
    g.roundRect(impactX - 18, hammerY - 12, 36, 20, 6)
      .fill({ color: fx.color })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 3 });
    g.circle(impactX, hammerY - 2, 5.5).fill({ color: PALETTE.CREAM_WHITE });
  } else {
    // Phase 2: Ground impact shockwave, radial cracks & petal burst
    const impT = clamp((progress - fallPhaseEnd) / (1 - fallPhaseEnd), 0, 1);
    const impFade = 1 - impT;
    const ringR = maxR * (0.45 + 0.65 * impT);

    g.circle(impactX, impactY, ringR)
      .fill({ color: fx.color, alpha: 0.24 * impFade })
      .stroke({ color: fx.color, width: 6 * impFade, alpha: 0.9 * impFade });
    g.circle(impactX, impactY, ringR * 0.68).stroke({
      color: PALETTE.CREAM_WHITE,
      width: 3 * impFade,
      alpha: 0.85 * impFade,
    });

    if (fx.isEcho) {
      g.circle(impactX, impactY, ringR * 1.16).stroke({
        color: PALETTE.SKY_BLUE,
        width: 4 * impFade,
        alpha: 0.85 * impFade,
      });
    }

    for (let c = 0; c < 6; c++) {
      const ca = fx.angle + (c * Math.PI) / 3;
      const cr = maxR * (0.3 + 0.65 * impT);
      g.moveTo(impactX + Math.cos(ca) * 8, impactY + Math.sin(ca) * 8)
        .lineTo(impactX + Math.cos(ca) * cr, impactY + Math.sin(ca) * cr)
        .stroke({
          color: PALETTE.CREAM_WHITE,
          width: 2.5 * impFade,
          alpha: 0.8 * impFade,
          cap: 'round',
        });
    }

    if (impT < 0.55) {
      const hFade = 1 - impT / 0.55;
      const bounceY = impactY - Math.sin((impT / 0.55) * Math.PI) * 10;
      g.roundRect(impactX - 18, bounceY - 12, 36, 20, 6)
        .fill({ color: fx.color, alpha: hFade })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 2.5, alpha: hFade });
    }
  }
}
