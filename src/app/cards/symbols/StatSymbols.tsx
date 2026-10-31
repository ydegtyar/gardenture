import React from 'react';
import type { CardSymbolProps } from './types';

/**
 * 4.1 Sharper Edge:
 * Radiant gradient leaf broadsword with star glints.
 */
export const SharperEdgeSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Outer emerald glow */}
    <path
      d="M 90,14 C 114,40 112,78 90,100 C 68,78 66,40 90,14 Z"
      fill={`url(#${g.mint})`}
      opacity="0.35"
      stroke="none"
    />
    {/* Main leaf blade */}
    <path
      d="M 90,17 C 109,42 108,76 90,98 C 72,76 71,42 90,17 Z"
      fill={`url(#${g.emerald})`}
    />
    {/* Bright inner facet */}
    <path
      d="M 90,20 C 98,42 98,72 90,94 C 86,72 86,42 90,20 Z"
      fill={`url(#${g.mint})`}
      stroke="none"
    />
    {/* Center fuller ridge & veins */}
    <line x1="90" y1="22" x2="90" y2="94" stroke="#FFFDF0" strokeWidth="2.2" />
    <path d="M 90,48 L 99,39 M 90,64 L 100,54 M 90,56 L 81,47 M 90,72 L 80,62" stroke="#FFFDF0" strokeWidth="1.4" opacity="0.8" />
    {/* Gilded crossguard & pommel */}
    <path d="M 64,93 L 116,93 L 109,102 L 71,102 Z" fill={`url(#${g.gold})`} />
    <rect x="85" y="102" width="10" height="15" rx="3" fill={`url(#${g.bark})`} />
    <circle cx="90" cy="118" r="4.5" fill={`url(#${g.gold})`} />
    {/* Star glints */}
    <path d="M 54,40 L 58,48 L 66,52 L 58,56 L 54,64 L 50,56 L 42,52 L 50,48 Z" fill={`url(#${g.gold})`} strokeWidth="1.8" />
    <path d="M 127,30 L 130,36 L 136,39 L 130,42 L 127,48 L 124,42 L 118,39 L 124,36 Z" fill={`url(#${g.parchment})`} strokeWidth="1.8" />
  </g>
);

/**
 * 4.4 Long Reach:
 * Extended-range Arbalete bolt & golden sightline ring.
 */
export const LongReachSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    {/* Far-range golden sight reticle */}
    <circle cx="122" cy="40" r="16" fill="none" stroke={`url(#${g.gold})`} strokeWidth="2.2" strokeDasharray="4 3" />
    <circle cx="122" cy="40" r="6" fill={`url(#${g.rose})`} opacity="0.5" stroke="none" />
    {/* Slipstream wind arcs */}
    <path d="M 42,92 Q 70,68 98,58" fill="none" stroke={`url(#${g.cyan})`} strokeWidth="2.4" opacity="0.75" />
    {/* High-velocity fletched crossbow bolt streaking across the arch */}
    <line x1="38" y1="106" x2="120" y2="42" stroke={`url(#${g.bark})`} strokeWidth="6" />
    <line x1="42" y1="103" x2="118" y2="44" stroke="#FFFDF0" strokeWidth="1.8" opacity="0.75" />
    <polygon points="36,108 46,92 52,98" fill={`url(#${g.mint})`} />
    <polygon points="36,108 54,102 48,96" fill={`url(#${g.emerald})`} />
    <polygon points="142,24 112,35 120,42 125,52" fill={`url(#${g.crimson})`} />
    <circle cx="122" cy="40" r="3.5" fill={`url(#${g.gold})`} />
  </g>
);

/**
 * 4.5 Swift Boots:
 * Winged caramel leather boots with wind trails.
 */
export const SwiftBootsSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 68,44 L 96,44 L 98,80 L 124,86 C 131,88 131,105 119,105 L 64,105 Z" fill={`url(#${g.bark})`} />
    <path d="M 67,44 L 97,44 L 97,53 L 67,53 Z" fill={`url(#${g.gold})`} />
    <path d="M 64,68 C 38,61 32,42 54,40 C 48,53 58,55 68,57 Z" fill={`url(#${g.mint})`} />
    <path d="M 64,81 C 42,78 38,63 56,61 C 52,70 58,72 66,74 Z" fill={`url(#${g.parchment})`} />
  </g>
);

/**
 * 4.6 Hardy Bark:
 * Layered tree-bark shield with glowing emerald heart.
 */
export const HardyBarkSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path
      d="M 52,30 L 128,30 L 128,72 C 128,98 90,114 90,114 C 90,114 52,98 52,72 Z"
      fill={`url(#${g.bark})`}
    />
    <path
      d="M 60,37 L 120,37 L 120,70 C 120,91 90,105 90,105 C 90,105 60,91 60,70 Z"
      fill="none"
      stroke={`url(#${g.gold})`}
      strokeWidth="2"
    />
    <path
      d="M 90,55 C 82,42 65,48 65,63 C 65,78 90,93 90,93 C 90,93 115,78 115,63 C 115,48 98,42 90,55 Z"
      fill={`url(#${g.emerald})`}
    />
    <circle cx="82" cy="59" r="3" fill="#FFFDF0" stroke="none" opacity="0.8" />
  </g>
);

/**
 * 4.7 Magnet Moss:
 * Lodestone mineral, velvety glowing moss cushions, magnetic flux loops & attracted gems.
 */
export const MagnetMossSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    {/* Curving Magnetic Dipole Flux Loops */}
    <path
      d="M 68,82 C 38,70 38,36 72,24 C 84,20 96,20 108,24 C 142,36 142,70 112,82"
      fill="none"
      stroke={`url(#${g.mint})`}
      strokeWidth="1.6"
      strokeDasharray="4 3.5"
      opacity="0.85"
    />
    <path
      d="M 74,90 C 52,82 50,44 80,34 C 87,31 93,31 100,34 C 130,44 128,82 106,90"
      fill="none"
      stroke={`url(#${g.emerald})`}
      strokeWidth="1.2"
      strokeDasharray="3 3"
      opacity="0.7"
    />

    {/* Magnetic Sparkle Trails / Tiny Field Dots */}
    <g fill={`url(#${g.mint})`} opacity="0.9" stroke="none">
      <circle cx="56" cy="50" r="1.5" />
      <circle cx="64" cy="38" r="1.3" />
      <circle cx="78" cy="27" r="1.4" />
      <circle cx="102" cy="27" r="1.4" />
      <circle cx="116" cy="38" r="1.3" />
      <circle cx="124" cy="50" r="1.5" />
      <circle cx="48" cy="70" r="1.2" />
      <circle cx="132" cy="70" r="1.2" />
    </g>

    {/* Lodestone Rock Formations */}
    <polygon points="72,94 90,103 108,93 118,76 110,60 90,55 70,61 62,77" fill={`url(#${g.bark})`} />
    <polygon points="90,55 70,61 76,80 90,75" fill="#382942" strokeWidth="1.4" />
    <polygon points="90,55 110,60 104,79 90,75" fill="#24192B" strokeWidth="1.4" />
    <polygon points="70,61 62,77 76,80" fill="#1C1322" strokeWidth="1.4" />
    <polygon points="110,60 118,76 104,79" fill="#180F1E" strokeWidth="1.4" />
    <polygon points="76,80 90,75 90,103 72,94" fill="#2E2036" strokeWidth="1.4" />
    <polygon points="104,79 90,75 90,103 108,93" fill="#1B1223" strokeWidth="1.4" />

    {/* Specular Highlights on Lodestone Mineral Ridges */}
    <line x1="90" y1="55" x2="90" y2="75" stroke={`url(#${g.cyan})`} strokeWidth="1.5" opacity="0.75" />
    <line x1="90" y1="75" x2="90" y2="103" stroke={`url(#${g.mint})`} strokeWidth="1.4" opacity="0.8" />
    <line x1="90" y1="55" x2="110" y2="60" stroke="#FFFDF0" strokeWidth="1.2" opacity="0.6" />

    {/* Overgrown Velvet Moss Cushions */}
    <path
      d="M 59,81 C 55,72 61,63 71,63 C 74,55 84,53 89,58 C 93,52 104,52 108,59 C 117,56 127,65 124,76 C 130,85 121,97 111,95 C 104,101 94,103 88,98 C 80,102 69,98 65,90 C 57,90 55,83 59,81 Z"
      fill={`url(#${g.emerald})`}
    />
    <path
      d="M 66,77 C 63,70 69,63 77,63 C 80,56 89,54 95,58 C 100,53 110,54 113,61 C 121,61 125,71 121,78 C 124,86 116,93 108,91 C 102,96 92,96 87,91 C 79,94 71,89 70,83 C 63,82 63,78 66,77 Z"
      fill={`url(#${g.mint})`}
    />

    {/* Center Luminescent Moss Nucleus / Spore Nodes */}
    <circle cx="90" cy="71" r="14" fill={`url(#${g.emerald})`} />
    <circle cx="78" cy="76" r="9" fill={`url(#${g.mint})`} />
    <circle cx="102" cy="75" r="9.5" fill={`url(#${g.mint})`} />
    <circle cx="89" cy="84" r="8" fill={`url(#${g.emerald})`} />
    <circle cx="84" cy="64" r="7.5" fill={`url(#${g.mint})`} />
    <circle cx="97" cy="65" r="7" fill={`url(#${g.emerald})`} />

    {/* Glowing Luminescent Spore Dewdrops */}
    <g fill="#FFFDF0" stroke="none">
      <circle cx="86" cy="66" r="1.8" />
      <circle cx="94" cy="68" r="1.6" />
      <circle cx="81" cy="74" r="1.4" />
      <circle cx="99" cy="72" r="1.4" />
      <circle cx="89" cy="80" r="1.2" fill="#FDFFB6" />
      <circle cx="73" cy="70" r="1.1" />
      <circle cx="106" cy="69" r="1.1" />
      <circle cx="84" cy="89" r="1.1" fill="#FDFFB6" />
    </g>

    {/* Orbiting Attracted Crystal Gems (Drawn toward the Moss Core) */}
    <polygon points="90,19 95,25 90,31 85,25" fill={`url(#${g.rose})`} />
    <circle cx="88.5" cy="23" r="1" fill="#FFFDF0" stroke="none" />

    <polygon points="46,54 52,60 46,66 40,60" fill={`url(#${g.gold})`} />
    <circle cx="44.5" cy="58" r="1" fill="#FFFDF0" stroke="none" />

    <polygon points="134,55 140,61 134,67 128,61" fill={`url(#${g.cyan})`} />
    <circle cx="132.5" cy="59" r="1" fill="#FFFDF0" stroke="none" />

    <polygon points="50,92 55,97 50,102 45,97" fill={`url(#${g.mint})`} />
    <circle cx="49" cy="95" r="0.9" fill="#FFFDF0" stroke="none" />

    <polygon points="130,93 135,98 130,103 125,98" fill={`url(#${g.violet})`} />
    <circle cx="128.5" cy="96" r="0.9" fill="#FFFDF0" stroke="none" />
  </g>
);

/**
 * 4.8 Lucky Clover:
 * Four-leaf gradient clover & golden stars.
 */
export const LuckyCloverSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 90,80 Q 93,103 106,113" fill="none" stroke={`url(#${g.emerald})`} strokeWidth="5.5" />
    <circle cx="75" cy="53" r="16.5" fill={`url(#${g.emerald})`} />
    <circle cx="105" cy="53" r="16.5" fill={`url(#${g.mint})`} />
    <circle cx="75" cy="79" r="16.5" fill={`url(#${g.mint})`} />
    <circle cx="105" cy="79" r="16.5" fill={`url(#${g.emerald})`} />
    <circle cx="90" cy="66" r="9.5" fill={`url(#${g.gold})`} />
    <circle cx="90" cy="66" r="4" fill="#FFFDF0" stroke="none" />
  </g>
);

/**
 * 4.9 Keen Eye:
 * All-seeing hawk eye with golden crosshair.
 */
export const KeenEyeSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path
      d="M 36,70 Q 90,26 144,70 Q 90,114 36,70 Z"
      fill={`url(#${g.parchment})`}
    />
    <circle cx="90" cy="70" r="21" fill={`url(#${g.cyan})`} />
    <circle cx="90" cy="70" r="9" fill="#1E1322" />
    <circle cx="86" cy="65" r="3.5" fill="#FFFDF0" stroke="none" />
    <line x1="90" y1="42" x2="90" y2="98" stroke={`url(#${g.gold})`} strokeWidth="2.2" />
    <line x1="62" y1="70" x2="118" y2="70" stroke={`url(#${g.gold})`} strokeWidth="2.2" />
  </g>
);

/**
 * 4.10 Iron Bark:
 * Ironwood slab with steel rivets & emerald core.
 */
export const IronBarkSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="50" y="32" width="80" height="76" rx="11" fill={`url(#${g.steel})`} />
    <rect x="61" y="43" width="58" height="54" rx="7" fill={`url(#${g.emerald})`} />
    <path d="M 90,52 L 104,70 L 90,88 L 76,70 Z" fill={`url(#${g.gold})`} />
    <circle cx="61" cy="43" r="5" fill={`url(#${g.parchment})`} />
    <circle cx="119" cy="43" r="5" fill={`url(#${g.parchment})`} />
    <circle cx="61" cy="97" r="5" fill={`url(#${g.parchment})`} />
    <circle cx="119" cy="97" r="5" fill={`url(#${g.parchment})`} />
  </g>
);

/**
 * 4.11 Regrowth:
 * Sprouting seedling in fertile earth with rose-gold aura.
 */
export const RegrowthSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="90" cy="70" r="34" fill={`url(#${g.rose})`} opacity="0.32" stroke="none" />
    <path d="M 90,104 L 90,52" stroke={`url(#${g.emerald})`} strokeWidth="6" />
    <path d="M 90,72 C 60,68 56,40 84,46 C 88,50 90,64 90,72 Z" fill={`url(#${g.mint})`} />
    <path d="M 90,64 C 120,60 124,32 96,38 C 92,42 90,56 90,64 Z" fill={`url(#${g.emerald})`} />
    <circle cx="90" cy="36" r="6.5" fill={`url(#${g.gold})`} />
    <ellipse cx="90" cy="105" rx="24" ry="8.5" fill={`url(#${g.bark})`} />
  </g>
);

/**
 * 4.12 Fleet Step (XII · THE PHANTOM STEP):
 * Three fading phantom step silhouettes & single swift trajectory arrow.
 */
export const FleetStepSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g
    data-testid="tarot-symbol-fleet_step"
    stroke="#2D1E2F"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="52" cy="76" r="16" fill={`url(#${g.violet})`} opacity="0.55" />
    <circle cx="84" cy="68" r="18.5" fill={`url(#${g.cyan})`} opacity="0.8" />
    <circle cx="118" cy="59" r="21" fill={`url(#${g.mint})`} />
    <path d="M 36,98 L 144,82" stroke={`url(#${g.gold})`} strokeWidth="4.5" />
    <polygon points="148,81 134,76 137,89" fill={`url(#${g.gold})`} />
  </g>
);
