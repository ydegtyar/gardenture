import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import type { SimProjectile, Simulation } from '../../../sim/Simulation';

/**
 * Renders Seed Blades projectile as an aerodynamic, razor-edged metallic silver sunflower seed,
 * and Piercing Slash crescent projectiles.
 */
export function drawSeedBladeProjectile(
  g: PIXI.Graphics,
  p: SimProjectile,
  sim: Simulation,
  px: number,
  py: number,
  rPx: number,
  angle: number
): void {
  const m = new PIXI.Matrix();
  m.rotate(angle);
  m.translate(px, py);
  g.setTransform(m);

  const seedWpn = sim.weapons.find((w) => w.id === 'seed_blades');
  const isEvolved = Boolean(seedWpn?.evolved);
  const hasVenom = Boolean(seedWpn && (seedWpn.level >= 2 || seedWpn.evolved));

  // Teardrop / ovate sunflower seed dimensions (rounded base at -baseLen, razor tip at +tipLen)
  const tipLen = Math.max(9.5, rPx * 1.72);
  const baseLen = Math.max(6.5, rPx * 1.05);
  const halfW = Math.max(4.8, rPx * 0.88);

  // 1. Subtle metallic silver slipstream wake lines behind the seed
  g.moveTo(-baseLen * 1.45, -halfW * 0.36)
    .lineTo(-baseLen * 0.78, -halfW * 0.22)
    .stroke({ color: 0xe2e8f0, width: 1.3, alpha: 0.55, cap: 'round' });
  g.moveTo(-baseLen * 1.45, halfW * 0.36)
    .lineTo(-baseLen * 0.78, halfW * 0.22)
    .stroke({ color: 0xcbd5e1, width: 1.3, alpha: 0.45, cap: 'round' });

  // 2. Outer Sunflower Seed Hull (Teardrop silhouette: rounded posterior base -> swelled mid-hull -> sharp anterior point)
  const hullSilver = isEvolved ? 0xe2e8f0 : 0xcbd5e1;
  g.moveTo(tipLen, 0)
    .bezierCurveTo(
      tipLen * 0.32,
      -halfW * 0.96,
      -baseLen * 0.55,
      -halfW * 1.04,
      -baseLen,
      0
    )
    .bezierCurveTo(
      -baseLen * 0.55,
      halfW * 1.04,
      tipLen * 0.32,
      halfW * 0.96,
      tipLen,
      0
    )
    .closePath()
    .fill({ color: hullSilver })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.1, join: 'round' });

  // 3. Lower shaded gunmetal-silver facet for 3D metallic volume
  g.moveTo(tipLen * 0.92, 0)
    .bezierCurveTo(
      tipLen * 0.25,
      halfW * 0.82,
      -baseLen * 0.48,
      halfW * 0.88,
      -baseLen * 0.9,
      0
    )
    .lineTo(tipLen * 0.92, 0)
    .closePath()
    .fill({ color: isEvolved ? 0x94a3b8 : 0x64748b, alpha: 0.75 });

  // 4. Characteristic Sunflower Seed Longitudinal Dark Gunmetal Stripes (Upper & Lower curved hull ribs)
  const stripeColor = 0x1e293b;
  // Upper dark sunflower stripe
  g.moveTo(-baseLen * 0.76, -halfW * 0.22)
    .quadraticCurveTo(-baseLen * 0.08, -halfW * 0.62, tipLen * 0.72, -halfW * 0.1)
    .stroke({ color: stripeColor, width: Math.max(1.5, rPx * 0.22), alpha: 0.88, cap: 'round' });

  // Lower dark sunflower stripe
  g.moveTo(-baseLen * 0.76, halfW * 0.22)
    .quadraticCurveTo(-baseLen * 0.08, halfW * 0.62, tipLen * 0.72, halfW * 0.1)
    .stroke({ color: stripeColor, width: Math.max(1.5, rPx * 0.22), alpha: 0.88, cap: 'round' });

  // Secondary outer silver-white hull rib highlights
  g.moveTo(-baseLen * 0.58, -halfW * 0.48)
    .quadraticCurveTo(-baseLen * 0.05, -halfW * 0.82, tipLen * 0.52, -halfW * 0.24)
    .stroke({ color: 0xf8fafc, width: 1.1, alpha: 0.85, cap: 'round' });

  // 5. Central Sterling Silver Median Ridge (Signature raised center stripe of a sunflower seed)
  g.moveTo(-baseLen * 0.82, 0)
    .lineTo(tipLen * 0.86, 0)
    .stroke({ color: 0xffffff, width: Math.max(1.7, rPx * 0.24), alpha: 0.96, cap: 'round' });

  // Rounded basal seed cap accent at the rear (-baseLen)
  g.circle(-baseLen * 0.72, 0, Math.max(1.3, rPx * 0.18)).fill({
    color: 0xf1f5f9,
    alpha: 0.9,
  });

  // 6. Razor-Sharp Gleaming Platinum Seed Tip (+ subtle venom edge glint when Lv2+ poison is active)
  g.moveTo(tipLen * 0.52, -halfW * 0.22)
    .lineTo(tipLen, 0)
    .lineTo(tipLen * 0.52, halfW * 0.22)
    .closePath()
    .fill({ color: hasVenom ? 0x6ee7b7 : 0xffffff, alpha: 0.92 });

  g.setTransform(new PIXI.Matrix());
}

export function drawPiercingSlashProjectile(
  g: PIXI.Graphics,
  p: SimProjectile,
  px: number,
  py: number,
  rPx: number,
  angle: number
): void {
  // Piercing Slash crescent wave (with setTransform called BEFORE paths so nothing spawns at 0,0!)
  const m = new PIXI.Matrix();
  m.rotate(angle);
  m.translate(px, py);
  g.setTransform(m);

  const cresR = Math.max(14, rPx * 1.35);
  g.moveTo(-cresR * 0.35, -cresR)
    .quadraticCurveTo(cresR * 0.95, 0, -cresR * 0.35, cresR)
    .quadraticCurveTo(cresR * 0.35, 0, -cresR * 0.35, -cresR)
    .closePath()
    .fill({ color: p.color, alpha: 0.92 })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.4 });

  g.moveTo(-cresR * 0.12, -cresR * 0.68)
    .quadraticCurveTo(cresR * 0.62, 0, -cresR * 0.12, cresR * 0.68)
    .stroke({ color: PALETTE.CREAM_WHITE, width: 2.4, alpha: 0.95, cap: 'round' });

  g.setTransform(new PIXI.Matrix());
}
