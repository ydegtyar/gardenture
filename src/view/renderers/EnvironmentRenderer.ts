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
    const pulse = 0.85 + 0.15 * Math.sin(elapsedSeconds * 5.0);

    // Outer toxic crimson warning aura outside the thorn ring
    g.circle(cx, cy, rPx + 18).stroke({
      color: PALETTE.CRIMSON_WARN,
      width: 24,
      alpha: sim.isOutsideArena ? 0.32 * pulse : 0.14,
    });

    // Main circular briar vine ring
    g.circle(cx, cy, rPx).stroke({
      color: 0x064e3b,
      width: 11,
      alpha: 0.92,
    });
    g.circle(cx, cy, rPx).stroke({
      color: PALETTE.MINT_GREEN,
      width: 4,
      alpha: 0.78,
    });

    // Intertwined secondary thorny vine wave + sharp briar thorns around the circle
    const segments = 48;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 0.5) / segments) * Math.PI * 2;
      const waveOff = Math.sin(i * 1.7 + elapsedSeconds * 2.5) * 5;
      const vx = cx + Math.cos(a1) * (rPx + waveOff);
      const vy = cy + Math.sin(a1) * (rPx + waveOff);

      // Sharp thorn barb pointing inward & outward
      const dir = i % 2 === 0 ? -1 : 1;
      const tipR = rPx + waveOff + dir * 13;
      const tx = cx + Math.cos(a2) * tipR;
      const ty = cy + Math.sin(a2) * tipR;
      const b1x = cx + Math.cos(a1) * (rPx + waveOff);
      const b1y = cy + Math.sin(a1) * (rPx + waveOff);
      const b2x = cx + Math.cos(a1 + 0.08) * (rPx + waveOff);
      const b2y = cy + Math.sin(a1 + 0.08) * (rPx + waveOff);

      g.moveTo(b1x, b1y)
        .lineTo(tx, ty)
        .lineTo(b2x, b2y)
        .closePath()
        .fill({
          color: i % 3 === 0 ? PALETTE.CRIMSON_WARN : PALETTE.BLUSH_ROSE,
          alpha: 0.92,
        })
        .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });

      if (i % 4 === 0) {
        g.circle(vx, vy, 5.5)
          .fill({ color: PALETTE.BLUSH_ROSE, alpha: 0.95 })
          .stroke({ color: PALETTE.INK_OUTLINE, width: 1.5 });
        g.circle(vx, vy, 2.2).fill({ color: PALETTE.BUTTER_YELLOW });
      }
    }
  }
}
