import React from 'react';
import type { CardSymbolProps } from './types';

/**
 * 4.13 Echo Swing / 4.21 Piercing Slash:
 * Twin phantom slash crescents.
 */
export const EchoSlashSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 46,96 A 50,45 0 0,1 124,40 A 37,35 0 0,0 46,96 Z" fill={`url(#${g.cyan})`} opacity="0.85" />
    <path d="M 62,105 A 50,45 0 0,1 142,48 A 37,35 0 0,0 62,105 Z" fill={`url(#${g.gold})`} />
  </g>
);

/**
 * 4.14 Thorn Trail / 4.22 Burning Thorns:
 * Briar thorns & crimson fire.
 */
export const BriarThornsSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 36,98 Q 68,52 94,78 T 146,46" fill="none" stroke={`url(#${g.emerald})`} strokeWidth="7" />
    <polygon points="62,68 53,46 73,59" fill={`url(#${g.rose})`} />
    <polygon points="94,76 87,52 107,67" fill={`url(#${g.crimson})`} />
    <polygon points="124,58 117,34 137,49" fill={`url(#${g.gold})`} />
  </g>
);

/**
 * 4.23 Healing Bloom:
 * Radiant multi-petalled Sacred Lotus floating on jade water with vitality cross.
 */
export const HealingBloomSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    {/* Radiant golden-emerald healing halo */}
    <circle cx="90" cy="64" r="38" fill={`url(#${g.gold})`} opacity="0.28" stroke="none" />
    {/* Tranquil jade water ripples & lotus pad base */}
    <ellipse cx="90" cy="102" rx="44" ry="9" fill={`url(#${g.cyan})`} opacity="0.55" />
    <ellipse cx="90" cy="98" rx="34" ry="7.5" fill={`url(#${g.emerald})`} />
    {/* Outer wide-open crimson-rose lotus petals */}
    <path
      d="M 90,94 C 58,94 38,76 44,58 C 58,62 74,74 90,94 Z"
      fill={`url(#${g.rose})`}
    />
    <path
      d="M 90,94 C 122,94 142,76 136,58 C 122,62 106,74 90,94 Z"
      fill={`url(#${g.rose})`}
    />
    {/* Middle blush-violet ascending lotus petals */}
    <path
      d="M 90,92 C 64,84 52,58 62,40 C 76,48 84,68 90,92 Z"
      fill={`url(#${g.violet})`}
    />
    <path
      d="M 90,92 C 116,84 128,58 118,40 C 104,48 96,68 90,92 Z"
      fill={`url(#${g.violet})`}
    />
    {/* Central Sacred Lotus crown petal */}
    <path
      d="M 90,92 C 72,72 72,44 90,28 C 108,44 108,72 90,92 Z"
      fill={`url(#${g.parchment})`}
    />
    <path
      d="M 90,88 C 80,70 80,48 90,35 C 100,48 100,70 90,88 Z"
      fill={`url(#${g.rose})`}
      opacity="0.7"
      stroke="none"
    />
    {/* Glowing Golden Nectar Heart & Mint Vitality Cross (+HP) */}
    <circle cx="90" cy="66" r="10.5" fill={`url(#${g.gold})`} />
    <path
      d="M 88,20 L 92,20 L 92,15 L 97,15 L 97,11 L 92,11 L 92,6 L 88,6 L 88,11 L 83,11 L 83,15 L 88,15 Z"
      fill={`url(#${g.mint})`}
      strokeWidth="2"
    />
  </g>
);

/**
 * 4.24 Chain Bloom:
 * Projectile branching into twin lightning vine arcs.
 */
export const ChainBloomSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="42,96 90,68 134,38" fill="none" stroke={`url(#${g.cyan})`} strokeWidth="4.5" />
    <polyline points="90,68 136,96" fill="none" stroke={`url(#${g.gold})`} strokeWidth="4.5" />
    <circle cx="42" cy="96" r="10.5" fill={`url(#${g.emerald})`} />
    <circle cx="90" cy="68" r="13.5" fill={`url(#${g.cyan})`} />
    <circle cx="134" cy="38" r="11.5" fill={`url(#${g.gold})`} />
    <circle cx="136" cy="96" r="11.5" fill={`url(#${g.mint})`} />
  </g>
);

/**
 * 4.19 Shockwave / 4.25 Crit Burst:
 * Expanding seismic rings & golden starburst.
 */
export const ShockwaveBurstSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="90" cy="86" rx="55" ry="18" fill="none" stroke={`url(#${g.gold})`} strokeWidth="3.5" />
    <ellipse cx="90" cy="86" rx="35" ry="11" fill="none" stroke={`url(#${g.mint})`} strokeWidth="3" />
    <polygon
      points="90,20 101,47 130,47 107,64 115,91 90,74 65,91 73,64 50,47 79,47"
      fill={`url(#${g.gold})`}
    />
    <circle cx="90" cy="58" r="7" fill="#FFFDF0" stroke="none" opacity="0.8" />
  </g>
);

/**
 * 4.26 Frost Touch:
 * Crystalline cyan frost crystal & frozen leaves.
 */
export const FrostTouchSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="90,20 109,52 109,86 90,113 71,86 71,52" fill={`url(#${g.cyan})`} />
    <polygon points="53,48 84,58 90,82 61,76" fill={`url(#${g.mint})`} />
    <polygon points="127,48 96,58 90,82 119,76" fill={`url(#${g.parchment})`} />
    <line x1="90" y1="26" x2="90" y2="107" stroke="#FFFDF0" strokeWidth="2.5" />
  </g>
);
