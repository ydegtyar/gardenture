/**
 * Chain Lightning Ability Configuration (Logic + Visuals)
 * Layer 2 (content): Data definitions for targeting parameters and visual rendering.
 */

export interface ChainLightningConfig {
  // --- 1. Targeting Logic ---
  /** Maximum acquisition range from caster for the initial strike (in game units) */
  range: number;
  /** Maximum jump range from the last strike point to subsequent targets (in game units) */
  chainRange: number;
  /** Base maximum number of targets hit in a single chain sequence */
  maxChains: number;
  /** Multiplicative damage falloff per bounce (e.g. 0.9 = 90% of previous damage) */
  damageFalloff: number;

  // --- 2. Visuals: Timing & Lifecycle ---
  /** Total lifetime of each bolt segment in milliseconds (~200-300 ms) */
  lifetimeMs: number;
  /** Stagger delay between successive jumps in milliseconds (~50-80 ms) */
  staggerMs: number;
  /** Minimum flicker interval before re-generating jagged jitter in milliseconds */
  flickerIntervalMinMs: number;
  /** Maximum flicker interval before re-generating jagged jitter in milliseconds */
  flickerIntervalMaxMs: number;
  /** Fraction of lifetime when fade-out begins (0.6 = last 40% of lifetime) */
  fadeStartRatio: number;
  /** Minimum scale factor for width shrink during fade-out (0.6 = shrinks to 60% of base width) */
  fadeMinWidthScale: number;

  // --- 3. Visuals: Bolt Shape (Midpoint Displacement) ---
  /** Perpendicular displacement roughness as a fraction of segment length (~8-15%) */
  roughness: number;
  /** Recursion depth for main bolt midpoint displacement (4-6 levels, 5 = 32 segments) */
  levels: number;

  // --- 4. Visuals: Short Side Arcs (Branches) ---
  /** Minimum number of branch arcs along the main bolt (2-5) */
  branchCountMin: number;
  /** Maximum number of branch arcs along the main bolt (2-5) */
  branchCountMax: number;
  /** Minimum branch length as a fraction of main segment length (8-20%) */
  branchLengthMinRatio: number;
  /** Maximum branch length as a fraction of main segment length (8-20%) */
  branchLengthMaxRatio: number;
  /** Minimum departure angle in degrees relative to the main bolt direction (25-60°) */
  branchAngleMinDeg: number;
  /** Maximum departure angle in degrees relative to the main bolt direction (25-60°) */
  branchAngleMaxDeg: number;
  /** Recursion depth for branch midpoint displacement (2-3 levels) */
  branchLevels: number;
  /** Number of sub-segments for alpha/width tapering on branches (3-4) */
  branchSubSegments: number;
  /** Width ratio of branch core relative to main bolt core (~40%) */
  branchCoreWidthRatio: number;
  /** Base alpha at the start of each branch arc (~0.8) */
  branchBaseAlpha: number;
  /** Probability of spawning a tiny secondary fork on longer branches */
  branchForkProbability: number;

  // --- 5. Visuals: Glow, Colors & Layered Strokes ---
  colors: {
    outerGlow: number;
    midGlow: number;
    innerGlow: number;
    core: number;
    spark: number;
    echoOuterGlow: number;
    echoMidGlow: number;
    echoInnerGlow: number;
  };
  widths: {
    outerGlow: number; // width 14-18
    midGlow: number;    // width 8-10
    innerGlow: number;  // width 4-5
    core: number;       // width 1.5-2
  };
  alphas: {
    outerGlow: number; // ~0.10
    midGlow: number;   // ~0.25
    innerGlow: number; // ~0.60
    core: number;      // 1.0
  };

  // --- 6. Visuals: Glow Container Blur Filter ---
  blur: {
    enabled: boolean;
    strength: number; // ~2-4
    quality: number;  // 2
  };

  // --- 7. Visuals: Impact Flash & Sparks ---
  impact: {
    /** Radius of the additive impact circle at each strike point in pixels (~12-18) */
    flashRadius: number;
    /** Duration of the impact circle scaling & fading in milliseconds (~150 ms) */
    flashDurationMs: number;
    /** Minimum spark particles spawned on impact (3-6) */
    sparkCountMin: number;
    /** Maximum spark particles spawned on impact (3-6) */
    sparkCountMax: number;
    /** Minimum spark launch speed in pixels per second */
    sparkSpeedMin: number;
    /** Maximum spark launch speed in pixels per second */
    sparkSpeedMax: number;
    /** Radius of the origin flash at caster when cast starts in pixels */
    originFlashRadius: number;
    /** Duration of origin flash in milliseconds */
    originFlashDurationMs: number;
  };

  // --- 8. Visuals: Chain Bloom Synergy Variant (Bolder Profile) ---
  bloom: {
    roughness: number;
    widths: {
      outerGlow: number;
      midGlow: number;
      innerGlow: number;
      core: number;
    };
    alphas: {
      outerGlow: number;
      midGlow: number;
      innerGlow: number;
      core: number;
    };
    colors: {
      outerGlow: number;
      midGlow: number;
      innerGlow: number;
      core: number;
      spark: number;
    };
    branchCountMin: number;
    branchCountMax: number;
    branchCoreWidthRatio: number;
    branchBaseAlpha: number;
    flashRadius: number;
    sparkCountMin: number;
    sparkCountMax: number;
  };

  // --- 9. Visuals: Overhead Lightning Strike (Storm Mark Detonation) ---
  strike: {
    /** Vertical distance in pixels from target to the sky origin where the bolt starts */
    skyHeight: number;
    /** Perpendicular displacement roughness for midpoint displacement (~0.12 - 0.15) */
    roughness: number;
    /** Recursion levels for midpoint displacement (5 = 32 segments) */
    levels: number;
    /** Minimum and maximum short side branch arcs */
    branchCountMin: number;
    branchCountMax: number;
    branchLengthMinRatio: number;
    branchLengthMaxRatio: number;
    branchAngleMinDeg: number;
    branchAngleMaxDeg: number;
    branchLevels: number;
    branchSubSegments: number;
    branchCoreWidthRatio: number;
    branchBaseAlpha: number;
    branchForkProbability: number;
    widths: {
      outerGlow: number;
      midGlow: number;
      innerGlow: number;
      core: number;
    };
    alphas: {
      outerGlow: number;
      midGlow: number;
      innerGlow: number;
      core: number;
    };
    colors: {
      outerGlow: number;
      midGlow: number;
      innerGlow: number;
      core: number;
      spark: number;
      cloudOuter: number;
      cloudMid: number;
      cloudCore: number;
    };
    impact: {
      flashRadius: number;
      sparkCountMin: number;
      sparkCountMax: number;
      sparkSpeedMin: number;
      sparkSpeedMax: number;
    };
    cloud: {
      flashRadius: number;
      durationMs: number;
    };
  };
}

import { BALANCE_CONFIG } from '../../sim/rules/balanceConfig';

export const CHAIN_LIGHTNING_CONFIG: ChainLightningConfig = {
  // 1. Targeting Logic
  range: 5.2,
  chainRange: 4.2,
  maxChains: 3,
  damageFalloff: BALANCE_CONFIG.CHAIN_LIGHTNING_DAMAGE_FALLOFF,

  // 2. Visuals: Timing & Lifecycle
  lifetimeMs: 250,
  staggerMs: 60,
  flickerIntervalMinMs: 40,
  flickerIntervalMaxMs: 70,
  fadeStartRatio: 0.6,
  fadeMinWidthScale: 0.6,

  // 3. Visuals: Bolt Shape (Midpoint Displacement)
  roughness: 0.12, // 12% of segment length
  levels: 5,       // 2^5 = 32 segments, 33 points

  // 4. Visuals: Short Side Arcs (Branches)
  branchCountMin: 2,
  branchCountMax: 5,
  branchLengthMinRatio: 0.08,
  branchLengthMaxRatio: 0.20,
  branchAngleMinDeg: 25,
  branchAngleMaxDeg: 60,
  branchLevels: 2,
  branchSubSegments: 4,
  branchCoreWidthRatio: 0.40,
  branchBaseAlpha: 0.80,
  branchForkProbability: 0.35,

  // 5. Visuals: Glow, Colors & Layered Strokes
  colors: {
    outerGlow: 0x3a5bff,
    midGlow: 0x5c8cff,
    innerGlow: 0xa9d4ff,
    core: 0xffffff,
    spark: 0xd0e8ff,
    echoOuterGlow: 0xff8c00,
    echoMidGlow: 0xffc04d,
    echoInnerGlow: 0xfff0a6,
  },
  widths: {
    outerGlow: 16, // within 14-18
    midGlow: 9,    // within 8-10
    innerGlow: 4.5,// within 4-5
    core: 1.8,     // within 1.5-2
  },
  alphas: {
    outerGlow: 0.10,
    midGlow: 0.25,
    innerGlow: 0.60,
    core: 1.0,
  },

  // 6. Visuals: Glow Container Blur Filter
  blur: {
    enabled: true,
    strength: 3,
    quality: 2,
  },

  // 7. Visuals: Impact Flash & Sparks
  impact: {
    flashRadius: 15,
    flashDurationMs: 150,
    sparkCountMin: 3,
    sparkCountMax: 6,
    sparkSpeedMin: 80,
    sparkSpeedMax: 180,
    originFlashRadius: 10,
    originFlashDurationMs: 120,
  },

  // 8. Visuals: Chain Bloom Synergy Variant (Bolder Profile)
  bloom: {
    roughness: 0.16, // heavier, more dramatic jagged displacement
    widths: {
      outerGlow: 26, // bolder outer glow (26 vs 16)
      midGlow: 15,   // bolder mid glow (15 vs 9)
      innerGlow: 7.5,// bolder inner glow (7.5 vs 4.5)
      core: 3.2,     // thick blazing electric core (3.2 vs 1.8)
    },
    alphas: {
      outerGlow: 0.18, // 18% vs 10%
      midGlow: 0.38,   // 38% vs 25%
      innerGlow: 0.75, // 75% vs 60%
      core: 1.0,
    },
    colors: {
      outerGlow: 0x0284c7, // vibrant deep azure electric
      midGlow: 0x38bdf8,   // bright radiant cyan
      innerGlow: 0xbae6fd, // luminous light cyan
      core: 0xffffff,      // white-hot core
      spark: 0x7dd3fc,     // electric floral sparks
    },
    branchCountMin: 3,
    branchCountMax: 6,
    branchCoreWidthRatio: 0.50,
    branchBaseAlpha: 0.95,
    flashRadius: 24, // wider botanical shockwave flash (24 vs 15)
    sparkCountMin: 6,
    sparkCountMax: 10,
  },

  // 9. Visuals: Overhead Lightning Strike (Storm Mark Detonation)
  strike: {
    skyHeight: 240,
    roughness: 0.13, // 13% perpendicular displacement
    levels: 5,       // 32 segments, 33 vertices
    branchCountMin: 2,
    branchCountMax: 5,
    branchLengthMinRatio: 0.08,
    branchLengthMaxRatio: 0.22,
    branchAngleMinDeg: 30,
    branchAngleMaxDeg: 65,
    branchLevels: 2,
    branchSubSegments: 4,
    branchCoreWidthRatio: 0.42,
    branchBaseAlpha: 0.85,
    branchForkProbability: 0.35,
    widths: {
      outerGlow: 18,
      midGlow: 10,
      innerGlow: 5.0,
      core: 2.0,
    },
    alphas: {
      outerGlow: 0.14,
      midGlow: 0.32,
      innerGlow: 0.68,
      core: 1.0,
    },
    colors: {
      outerGlow: 0x3a5bff,
      midGlow: 0x5c8cff,
      innerGlow: 0xa9d4ff,
      core: 0xffffff,
      spark: 0xd0e8ff,
      cloudOuter: 0x3a5bff,
      cloudMid: 0x5c8cff,
      cloudCore: 0xffffff,
    },
    impact: {
      flashRadius: 22,
      sparkCountMin: 5,
      sparkCountMax: 8,
      sparkSpeedMin: 110,
      sparkSpeedMax: 190,
    },
    cloud: {
      flashRadius: 32,
      durationMs: 140,
    },
  },
};
