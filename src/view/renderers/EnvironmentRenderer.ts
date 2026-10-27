import * as PIXI from 'pixi.js';
import { PALETTE, THEME_PACKS } from '../../content/data/catalog';
import type { BiomeId } from '../../content/schema/types';
import type { Simulation } from '../../sim/Simulation';

export const PPU = 48;
export const CHUNK_SIZE_U = 12;
export const CHUNK_PX = CHUNK_SIZE_U * PPU;

/**
 * Renders procedural biome ground chunks (for all 4 Theme Packs)
 * and the Final Boss circular thorn arena boundary.
 */
export class EnvironmentRenderer {
  public static populateGroundChunk(
    g: PIXI.Graphics,
    cx: number,
    cy: number,
    biomeId: BiomeId
  ): void {
    const theme = THEME_PACKS[biomeId] ?? THEME_PACKS.garden;
    const isDungeon = biomeId === 'dungeon';
    const isSakura = biomeId === 'sakura_grove';
    const isOasis = biomeId === 'sunlit_oasis';

    const baseBg = theme.groundBaseColor;
    const tileAlt = theme.groundTileAltColor;

    g.rect(0, 0, CHUNK_PX, CHUNK_PX).fill({ color: baseBg });

    let hash = Math.imul(cx * 73856093, cy * 19349663) ^ 0x9e3779b9;
    const nextRand = (): number => {
      hash ^= hash << 13;
      hash ^= hash >>> 17;
      hash ^= hash << 5;
      return (hash >>> 0) / 0x100000000;
    };

    // Subtle organic ground patches
    for (let i = 0; i < 8; i++) {
      const px = nextRand() * (CHUNK_PX - 90) + 45;
      const py = nextRand() * (CHUNK_PX - 90) + 45;
      const rw = 36 + nextRand() * 52;
      const rh = 24 + nextRand() * 36;
      g.ellipse(px, py, rw, rh).fill({ color: tileAlt, alpha: 0.55 });
    }

    // Stepping stones / flagstones / sandstone slabs
    for (let i = 0; i < 5; i++) {
      const sx = nextRand() * (CHUNK_PX - 60) + 30;
      const sy = nextRand() * (CHUNK_PX - 60) + 30;
      const sr = 10 + nextRand() * 12;
      const stoneColor = isDungeon
        ? 0x2a314d
        : isSakura
          ? 0x3f2b4a
          : isOasis
            ? 0x4a3e24
            : 0x2d3548;
      const rimColor = isDungeon
        ? 0x3b4468
        : isSakura
          ? 0x5c3d6b
          : isOasis
            ? 0x6b5832
            : 0x3b455e;
      g.ellipse(sx, sy + 2, sr * 1.2, sr * 0.85).fill({ color: 0x0f131d, alpha: 0.35 });
      g.ellipse(sx, sy, sr * 1.15, sr * 0.8)
        .fill({ color: stoneColor, alpha: 0.65 })
        .stroke({ color: rimColor, width: 1.5, alpha: 0.5 });
    }

    // Biome-specific decorative flora, petals, or runes
    for (let i = 0; i < 12; i++) {
      const fx = nextRand() * (CHUNK_PX - 32) + 16;
      const fy = nextRand() * (CHUNK_PX - 32) + 16;
      if (isDungeon) {
        g.moveTo(fx, fy + 6)
          .lineTo(fx - 4, fy - 2)
          .lineTo(fx, fy - 8)
          .lineTo(fx + 4, fy - 2)
          .closePath()
          .fill({ color: PALETTE.LILAC_ARCANE, alpha: 0.25 });
      } else if (isSakura) {
        // Sakura Twilight Grove: fallen cherry blossom petals & glowing spirit blossoms
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2 + nextRand() * 0.2;
          g.ellipse(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5, 3.8, 2.2).fill({
            color: p % 2 === 0 ? 0xf9a8d4 : PALETTE.BLUSH_ROSE,
            alpha: 0.48,
          });
        }
        g.circle(fx, fy, 2.2).fill({ color: PALETTE.BUTTER_YELLOW, alpha: 0.62 });
      } else if (isOasis) {
        // Golden Amber Meadow: golden sun-wheat tufts & warm amber desert blooms
        g.moveTo(fx, fy)
          .lineTo(fx - 5, fy - 9)
          .moveTo(fx, fy)
          .lineTo(fx + 1, fy - 11)
          .moveTo(fx, fy)
          .lineTo(fx + 6, fy - 8)
          .stroke({ color: 0xfbbf24, width: 2, alpha: 0.52 });
        if (nextRand() < 0.45) {
          g.circle(fx + 1, fy - 11, 3.2).fill({ color: PALETTE.GOLD_STAR, alpha: 0.58 });
        }
      } else {
        // Whispering Briar Garden: grass tufts & tiny wildflowers
        g.moveTo(fx, fy)
          .lineTo(fx - 4, fy - 7)
          .moveTo(fx, fy)
          .lineTo(fx + 1, fy - 9)
          .moveTo(fx, fy)
          .lineTo(fx + 5, fy - 6)
          .stroke({ color: PALETTE.MINT_GREEN, width: 2, alpha: 0.45 });

        if (nextRand() < 0.35) {
          const petalColor =
            nextRand() < 0.5 ? PALETTE.BUTTER_YELLOW : PALETTE.BLUSH_ROSE;
          g.circle(fx + 1, fy - 10, 3).fill({ color: petalColor, alpha: 0.65 });
          g.circle(fx + 1, fy - 10, 1.3).fill({ color: PALETTE.CREAM_WHITE, alpha: 0.8 });
        }
      }
    }
  }

  public static drawFinalBossThornArena(
    g: PIXI.Graphics,
    sim: Simulation,
    elapsedSeconds: number
  ): void {
    if (!sim.arenaActive) return;

    const cx = sim.arenaCenterX * PPU;
    const cy = sim.arenaCenterY * PPU;
    const rPx = sim.arenaRadiusU * PPU;
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

    // 3. Interwoven Jagged Bramble Thicket Strands along the organic inner perimeter (no circles!)
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

      // Inward-pointing jagged thorn tooth warning the player of the thicket edge
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
}
