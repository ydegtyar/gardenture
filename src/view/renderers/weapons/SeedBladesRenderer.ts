import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import type { SimProjectile, Simulation } from '../../../sim/Simulation';

/**
 * Renders Seed Blades winged daggers and piercing slash crescent projectiles.
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

  // Winged botanical seed blade dagger matching Seeker Bestiary weapon art
  const bladeLen = rPx * 1.65;
  const halfW = rPx * 0.85;

  // Golden pommel & crossguard wings
  g.moveTo(-bladeLen * 0.55, -halfW * 0.95)
    .lineTo(-bladeLen * 0.25, 0)
    .lineTo(-bladeLen * 0.55, halfW * 0.95)
    .lineTo(-bladeLen * 0.85, 0)
    .closePath()
    .fill({ color: PALETTE.BUTTER_YELLOW })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 1.8 });

  // Leaf-shaped emerald dagger blade
  g.moveTo(bladeLen, 0)
    .lineTo(-bladeLen * 0.15, -halfW)
    .lineTo(-bladeLen * 0.5, 0)
    .lineTo(-bladeLen * 0.15, halfW)
    .closePath()
    .fill({ color: p.color })
    .stroke({ color: PALETTE.INK_OUTLINE, width: 2.2 });

  // Central fuller highlight
  g.moveTo(-bladeLen * 0.25, 0)
    .lineTo(bladeLen * 0.72, 0)
    .stroke({ color: PALETTE.CREAM_WHITE, width: 1.6, alpha: 0.9, cap: 'round' });

  // Glowing green venom tip when Seed Blades Lv2+ poison is active
  const seedWpn = sim.weapons.find((w) => w.id === 'seed_blades');
  if (seedWpn && (seedWpn.level >= 2 || seedWpn.evolved)) {
    g.circle(bladeLen * 0.75, 0, Math.max(2.2, rPx * 0.34)).fill({
      color: 0x22c55e,
      alpha: 0.95,
    });
  }

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
