import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import { PPU } from '../EnvironmentRenderer';
import type { Simulation } from '../../../sim/Simulation';

/**
 * Renders orbiting sakura petals with wind currents, ribbons, and flutter tilt.
 */
export function drawPetalOrbitEffect(
  g: PIXI.Graphics,
  sim: Simulation,
  hx: number,
  hy: number
): void {
  const petalCount = sim.getOrbitPetalCount();
  if (petalCount <= 0) return;

  const petalWpn = sim.weapons.find((w) => w.id === 'petal_orbit');
  const evolved = Boolean(petalWpn?.evolved);
  const orbitR = sim.getOrbitRadiusU() * PPU;
  const outerLeafColor = evolved ? 0xe879f9 : 0xf472b6;
  const innerLeafColor = evolved ? 0xfef08a : 0xfbcfe8;
  const veinColor = evolved ? 0xffffff : 0xfff1f2;

  const getPetalPos = (baseAngle: number, idx: number, timeSec: number) => {
    // Independent up-and-down vertical oscillation + radial wind wave per orb
    const upDownFreq = 3.8 + (idx % 3) * 1.15;
    const upDownPhase = idx * 2.17;
    const verticalInferencePx =
      Math.sin(timeSec * upDownFreq + upDownPhase) * 10.5 +
      Math.cos(timeSec * 5.6 - idx * 1.43) * 4.2;
    const radialWavePx =
      Math.sin(timeSec * (2.9 + (idx % 2) * 0.9) + idx * 1.65) * 6.0;
    const r = orbitR + radialWavePx;
    return {
      x: hx + Math.cos(baseAngle) * r,
      y: hy + Math.sin(baseAngle) * r + verticalInferencePx,
    };
  };

  for (let i = 0; i < petalCount; i++) {
    const a = sim.bonusOrbitAngle + (i / petalCount) * Math.PI * 2;
    const curr = getPetalPos(a, i, sim.elapsedSeconds);
    const midTrail = getPetalPos(a - 0.24, i, sim.elapsedSeconds - 0.06);
    const endTrail = getPetalPos(a - 0.5, i, sim.elapsedSeconds - 0.12);

    // Swirling wind gust ribbons trailing behind each sakura leaf
    g.moveTo(curr.x, curr.y)
      .quadraticCurveTo(midTrail.x, midTrail.y, endTrail.x, endTrail.y)
      .stroke({
        color: evolved ? PALETTE.LILAC_ARCANE : 0xfbcfe8,
        width: 4.2,
        alpha: 0.45,
        cap: 'round',
      });
    g.moveTo(curr.x, curr.y)
      .quadraticCurveTo(
        midTrail.x + Math.sin(sim.elapsedSeconds * 7 + i) * 3,
        midTrail.y - 2.5,
        endTrail.x,
        endTrail.y
      )
      .stroke({
        color: PALETTE.CREAM_WHITE,
        width: 1.8,
        alpha: 0.68,
        cap: 'round',
      });

    // Tiny wind-blown sakura flecks in the slipstream
    for (let t = 1; t <= 2; t++) {
      const fleckPos = getPetalPos(
        a - t * 0.19,
        i,
        sim.elapsedSeconds - t * 0.04
      );
      const fleckTilt = sim.elapsedSeconds * 9 + i * 2.3 + t;
      g.ellipse(
        fleckPos.x + Math.cos(fleckTilt) * 2.5,
        fleckPos.y + Math.sin(fleckTilt) * 2.5,
        3.2 - t * 0.7,
        1.6 - t * 0.3
      ).fill({
        color: innerLeafColor,
        alpha: 0.65 - t * 0.18,
      });
    }

    // 3D Wind-Flutter Orientation & Perspective Tilt for the Sakura Leaf
    const flutterAngle =
      a +
      Math.PI * 0.5 +
      Math.sin(sim.elapsedSeconds * 6.4 + i * 1.93) * 0.34;
    const flutterScaleY =
      0.8 + 0.22 * Math.sin(sim.elapsedSeconds * 5.2 + i * 1.47);

    const m = new PIXI.Matrix();
    m.scale(1.08, flutterScaleY);
    m.rotate(flutterAngle);
    m.translate(curr.x, curr.y);
    g.setTransform(m);

    // Authentic Cloven Sakura Leaf / Petal with signature V-notch cleft at the tip
    g.moveTo(-12.5, 0)
      .bezierCurveTo(-7.5, -8.8, 5.5, -9.2, 13.0, -3.8)
      .lineTo(8.4, 0)
      .lineTo(13.0, 3.8)
      .bezierCurveTo(5.5, 9.2, -7.5, 8.8, -12.5, 0)
      .closePath()
      .fill({ color: outerLeafColor })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 2.3 });

    // Soft inner sakura blush gradient layer
    g.moveTo(-9.0, 0)
      .bezierCurveTo(-4.5, -5.2, 3.5, -5.4, 8.8, -2.2)
      .lineTo(5.6, 0)
      .lineTo(8.8, 2.2)
      .bezierCurveTo(3.5, 5.4, -4.5, 5.2, -9.0, 0)
      .closePath()
      .fill({ color: innerLeafColor, alpha: 0.92 });

    // Delicate central midrib & lateral leaf veins
    g.moveTo(-9.5, 0)
      .lineTo(5.2, 0)
      .moveTo(-3.5, 0)
      .lineTo(2.0, -3.0)
      .moveTo(-3.5, 0)
      .lineTo(2.0, 3.0)
      .stroke({ color: veinColor, width: 1.3, alpha: 0.9, cap: 'round' });

    g.setTransform(new PIXI.Matrix());
  }
}
