import * as PIXI from 'pixi.js';
import { PALETTE } from '../../../content/data/catalog';
import type { Simulation } from '../../../sim/Simulation';

/**
 * Renders the circular organic thorn arena boundary for the Final Boss encounter.
 */
export function drawFinalBossThornArena(
  g: PIXI.Graphics,
  sim: Simulation,
  elapsedSeconds: number,
  ppu: number
): void {
  if (!sim.arenaActive) return;

  const cx = sim.arenaCenterX * ppu;
  const cy = sim.arenaCenterY * ppu;
  const rPx = sim.arenaRadiusU * ppu;
  const pulse = 0.85 + 0.15 * Math.sin(elapsedSeconds * 4.2);

  // Organic, non-circular briar clearing radius function (multi-harmonic jagged thicket edge)
  const getOrganicEdgeR = (angle: number, layerOffset = 0): number => {
    const w1 = Math.sin(angle * 7 + elapsedSeconds * 1.15 + layerOffset) * 15;
    const w2 = Math.cos(angle * 13 - elapsedSeconds * 0.85 + layerOffset * 1.7) * 9.5;
    const w3 = Math.sin(angle * 23 + layerOffset * 2.3) * 6;
    return rPx + w1 + w2 + w3;
  };

  // 1. Deep Overgrown Briar Wilderness starting far outside player camera sight (rPx + 1150)
  // and growing inward to the jagged clearing edge (drawn in 4 seamless quadrants without any circle)
  const outerSightR = rPx + 1150;
  const sectorCount = 4;
  const stepsPerSector = 24;

  for (let s = 0; s < sectorCount; s++) {
    const aStart = (s / sectorCount) * Math.PI * 2;
    const aEnd = ((s + 1) / sectorCount) * Math.PI * 2;

    // Outer wilderness mass
    g.moveTo(cx + Math.cos(aStart) * outerSightR, cy + Math.sin(aStart) * outerSightR);
    for (let step = 1; step <= 6; step++) {
      const a = aStart + ((aEnd - aStart) * step) / 6;
      g.lineTo(cx + Math.cos(a) * outerSightR, cy + Math.sin(a) * outerSightR);
    }
    for (let step = stepsPerSector; step >= 0; step--) {
      const a = aStart + ((aEnd - aStart) * step) / stepsPerSector;
      const innerR = getOrganicEdgeR(a, 0);
      g.lineTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
    }
    g.closePath().fill({
      color: sim.isOutsideArena ? 0x2a0914 : 0x0d0710,
      alpha: sim.isOutsideArena ? 0.72 * pulse : 0.62,
    });

    // Secondary dense bramble undergrowth shelf (from rPx + 95 inward to the jagged clearing edge)
    g.moveTo(
      cx + Math.cos(aStart) * (getOrganicEdgeR(aStart, 1.2) + 95),
      cy + Math.sin(aStart) * (getOrganicEdgeR(aStart, 1.2) + 95)
    );
    for (let step = 1; step <= stepsPerSector; step++) {
      const a = aStart + ((aEnd - aStart) * step) / stepsPerSector;
      const midOuterR = getOrganicEdgeR(a, 1.2) + 95 + Math.sin(a * 11) * 18;
      g.lineTo(cx + Math.cos(a) * midOuterR, cy + Math.sin(a) * midOuterR);
    }
    for (let step = stepsPerSector; step >= 0; step--) {
      const a = aStart + ((aEnd - aStart) * step) / stepsPerSector;
      const innerR = getOrganicEdgeR(a, 0);
      g.lineTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
    }
    g.closePath().fill({
      color: 0x052e24,
      alpha: 0.76,
    });
  }

  // 2. Gnarled Briar Trunks & Creeping Thorny Vines originating far out of sight and growing toward the center
  const rootCount = 44;
  for (let i = 0; i < rootCount; i++) {
    const baseAngle = (i / rootCount) * Math.PI * 2 + Math.sin(i * 3.1) * 0.03;
    const sway = Math.sin(elapsedSeconds * 1.8 + i * 1.4) * 0.018;
    const startR = rPx + 540 + (i % 4) * 135;
    const edgeR = getOrganicEdgeR(baseAngle, i * 0.3);
    // Roots creep slightly past the edge toward the center clearing
    const tipR = edgeR - 10 - (i % 3) * 8 + Math.sin(elapsedSeconds * 2.4 + i) * 5;

    const sx = cx + Math.cos(baseAngle) * startR;
    const sy = cy + Math.sin(baseAngle) * startR;

    const c1Angle = baseAngle + (i % 2 === 0 ? 0.06 : -0.06) + sway;
    const c1R = edgeR + 280;
    const c1x = cx + Math.cos(c1Angle) * c1R;
    const c1y = cy + Math.sin(c1Angle) * c1R;

    const c2Angle = baseAngle + (i % 2 === 0 ? -0.045 : 0.045) - sway;
    const c2R = edgeR + 90;
    const c2x = cx + Math.cos(c2Angle) * c2R;
    const c2y = cy + Math.sin(c2Angle) * c2R;

    const tx = cx + Math.cos(baseAngle + sway * 1.4) * tipR;
    const ty = cy + Math.sin(baseAngle + sway * 1.4) * tipR;

    // Dark outline & woody briar trunk growing inward from out of sight
    g.moveTo(sx, sy)
      .bezierCurveTo(c1x, c1y, c2x, c2y, tx, ty)
      .stroke({
        color: PALETTE.INK_OUTLINE,
        width: i % 2 === 0 ? 11 : 8.5,
        alpha: 0.92,
        cap: 'round',
      });
    g.moveTo(sx, sy)
      .bezierCurveTo(c1x, c1y, c2x, c2y, tx, ty)
      .stroke({
        color: i % 3 === 0 ? 0x115e59 : i % 2 === 0 ? 0x064e3b : 0x3f1d2e,
        width: i % 2 === 0 ? 6.5 : 4.8,
        alpha: 0.95,
        cap: 'round',
      });

    // Forked inward offshoot tendril near the clearing boundary
    const forkStartR = edgeR + 48;
    const fx0 = cx + Math.cos(baseAngle) * forkStartR;
    const fy0 = cy + Math.sin(baseAngle) * forkStartR;
    const forkDir = i % 2 === 0 ? 1 : -1;
    const forkTipAngle = baseAngle + forkDir * 0.055;
    const fx1 = cx + Math.cos(forkTipAngle) * (edgeR - 4);
    const fy1 = cy + Math.sin(forkTipAngle) * (edgeR - 4);

    g.moveTo(fx0, fy0)
      .quadraticCurveTo(
        cx + Math.cos(baseAngle + forkDir * 0.03) * (edgeR + 14),
        cy + Math.sin(baseAngle + forkDir * 0.03) * (edgeR + 14),
        fx1,
        fy1
      )
      .stroke({
        color: 0x10b981,
        width: 3.0,
        alpha: 0.85,
        cap: 'round',
      });

    // Sharp briar thorn barbs along the inward-growing vine
    for (const barbR of [edgeR + 8, edgeR + 36, edgeR + 74]) {
      const bSide = ((i + Math.round(barbR)) % 2 === 0 ? 1 : -1) * 0.025;
      const bx = cx + Math.cos(baseAngle) * barbR;
      const by = cy + Math.sin(baseAngle) * barbR;
      const perpA = baseAngle + (bSide > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
      const tipX = bx + Math.cos(perpA) * 11 - Math.cos(baseAngle) * 4;
      const tipY = by + Math.sin(perpA) * 11 - Math.sin(baseAngle) * 4;
      g.moveTo(bx - Math.cos(baseAngle) * 4, by - Math.sin(baseAngle) * 4)
        .lineTo(tipX, tipY)
        .lineTo(bx + Math.cos(baseAngle) * 4, by + Math.sin(baseAngle) * 4)
        .closePath()
        .fill({
          color: i % 3 === 0 ? PALETTE.CRIMSON_WARN : PALETTE.BLUSH_ROSE,
          alpha: 0.94,
        })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
    }
  }

  // 3. Interwoven Jagged Bramble Thicket Strands along the organic inner perimeter
  const totalPoints = 72;
  for (let strand = 0; strand < 2; strand++) {
    for (let i = 0; i <= totalPoints; i++) {
      const a = (i / totalPoints) * Math.PI * 2;
      const r =
        getOrganicEdgeR(a, strand * 2.1) +
        Math.sin(a * 19 + strand * 1.9 + elapsedSeconds * 2.2) * 7 +
        strand * 8;
      const vx = cx + Math.cos(a) * r;
      const vy = cy + Math.sin(a) * r;
      if (i === 0) g.moveTo(vx, vy);
      else g.lineTo(vx, vy);
    }
    g.stroke({
      color: strand === 0 ? 0x064e3b : 0x047857,
      width: strand === 0 ? 9.5 : 5.5,
      alpha: 0.94,
      join: 'round',
    });
  }

  // 4. Inner Briar Thorns, Serrated Leaves & Crimson Rosebuds along the tangled thicket edge
  const thornNodes = 56;
  for (let i = 0; i < thornNodes; i++) {
    const a = (i / thornNodes) * Math.PI * 2;
    const edgeR = getOrganicEdgeR(a, 0);
    const vx = cx + Math.cos(a) * edgeR;
    const vy = cy + Math.sin(a) * edgeR;

    const inwardTipR = edgeR - (12 + (i % 3) * 4);
    const tx = cx + Math.cos(a + 0.012) * inwardTipR;
    const ty = cy + Math.sin(a + 0.012) * inwardTipR;
    const b1x = cx + Math.cos(a - 0.018) * (edgeR + 2);
    const b1y = cy + Math.sin(a - 0.018) * (edgeR + 2);
    const b2x = cx + Math.cos(a + 0.038) * (edgeR + 2);
    const b2y = cy + Math.sin(a + 0.038) * (edgeR + 2);

    g.moveTo(b1x, b1y)
      .lineTo(tx, ty)
      .lineTo(b2x, b2y)
      .closePath()
      .fill({
        color: i % 2 === 0 ? PALETTE.CRIMSON_WARN : PALETTE.BLUSH_ROSE,
        alpha: 0.94,
      })
      .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });

    // Blooming briar rosebuds on every 4th node
    if (i % 4 === 0) {
      for (let p = 0; p < 4; p++) {
        const pa = a + (p * Math.PI) / 2 + 0.35;
        g.ellipse(vx + Math.cos(pa) * 3.8, vy + Math.sin(pa) * 3.8, 3.6, 2.4)
          .fill({ color: i % 8 === 0 ? PALETTE.CRIMSON_WARN : PALETTE.BLUSH_ROSE, alpha: 0.95 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.2 });
      }
      g.circle(vx, vy, 2.4).fill({ color: PALETTE.BUTTER_YELLOW });
    }
  }
}
