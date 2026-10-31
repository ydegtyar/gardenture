import React from 'react';
import type { CardSymbolProps } from './types';
import { EchoSwingSymbol } from './BehaviorSymbols';

/**
 * Legacy alias for backwards compatibility.
 * Delegates to EchoSwingSymbol.
 */
export const EchoSlashSymbol = EchoSwingSymbol;

/**
 * 4.21 Piercing Slash (XXI · THE SUNDERED WARD):
 * The living-bark ancient ward/shield cleft and sundered cleanly into two recoiling halves
 * by a searing emerald & mint piercing crescent blade wave with flying splinters and radiant impact starburst.
 */
export const PiercingSlashSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g
    data-testid="tarot-symbol-piercing_slash"
    stroke="#2D1E2F"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* High-velocity linear pierce slipstream lines passing through the ward */}
    <line x1="22" y1="16" x2="158" y2="120" stroke={`url(#${g.cyan})`} strokeWidth="1.8" strokeDasharray="6 3" opacity="0.6" />
    <line x1="28" y1="26" x2="152" y2="124" stroke={`url(#${g.mint})`} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
    <line x1="36" y1="20" x2="160" y2="118" stroke="#FFFDF0" strokeWidth="1.5" opacity="0.9" />

    {/* THE SUNDERED WARD (Heartwood Bark Shield cleft into two recoiling halves) */}
    {/* LEFT SHIELD HALF (Shifted up-left, recoiling from the cut) */}
    <g transform="translate(-5, -4)">
      {/* Outer Bark Shell */}
      <path
        d="M 58,26 C 72,26 84,32 90,38 L 84,52 L 88,64 L 78,78 L 82,92 L 68,104 C 54,94 44,76 44,56 C 44,38 50,28 58,26 Z"
        fill={`url(#${g.bark})`}
        stroke="#2D1E2F"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Inner Gilded Trim */}
      <path
        d="M 60,32 C 70,32 78,36 82,42 L 78,52 L 80,62 L 72,74 L 74,86 L 66,96 C 56,88 50,74 50,56 C 50,42 54,34 60,32 Z"
        fill="none"
        stroke={`url(#${g.gold})`}
        strokeWidth="1.8"
      />
      {/* Halved Golden Boss / Rune Core */}
      <path
        d="M 78,56 C 78,50 72,46 66,48 C 62,50 60,56 62,62 C 64,66 70,70 76,68 L 78,64 Z"
        fill={`url(#${g.gold})`}
        stroke="#2D1E2F"
        strokeWidth="2"
      />
      <circle cx="68" cy="56" r="3" fill={`url(#${g.emerald})`} stroke="#2D1E2F" strokeWidth="1.2" />
      {/* Living Vine Corner Filigree */}
      <path
        d="M 46,42 C 42,48 44,56 50,58 C 48,50 50,44 46,42 Z"
        fill={`url(#${g.emerald})`}
        stroke="#2D1E2F"
        strokeWidth="1.5"
      />
      {/* Wood Grain Cel Lines */}
      <path d="M 54,38 C 52,52 52,70 58,84" fill="none" stroke="#5C3A21" strokeWidth="1.6" opacity="0.7" />
    </g>

    {/* RIGHT SHIELD HALF (Shifted down-right, recoiling from the cut) */}
    <g transform="translate(5, 4)">
      {/* Outer Bark Shell */}
      <path
        d="M 94,42 C 104,34 116,28 124,28 C 132,32 138,44 138,58 C 138,80 126,98 112,106 L 98,96 L 102,82 L 92,68 L 96,56 Z"
        fill={`url(#${g.bark})`}
        stroke="#2D1E2F"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Inner Gilded Trim */}
      <path
        d="M 102,46 C 110,38 118,34 122,34 C 128,38 132,48 132,58 C 132,76 122,90 110,98 L 102,90 L 104,80 L 98,70 L 102,60 Z"
        fill="none"
        stroke={`url(#${g.gold})`}
        strokeWidth="1.8"
      />
      {/* Halved Golden Boss / Rune Core */}
      <path
        d="M 102,62 C 104,56 110,52 116,54 C 120,56 122,62 120,68 C 118,72 112,76 106,74 L 102,70 Z"
        fill={`url(#${g.gold})`}
        stroke="#2D1E2F"
        strokeWidth="2"
      />
      <circle cx="112" cy="62" r="3" fill={`url(#${g.emerald})`} stroke="#2D1E2F" strokeWidth="1.2" />
      {/* Living Vine Corner Filigree */}
      <path
        d="M 136,70 C 140,64 138,56 132,54 C 134,62 132,68 136,70 Z"
        fill={`url(#${g.emerald})`}
        stroke="#2D1E2F"
        strokeWidth="1.5"
      />
      {/* Wood Grain Cel Lines */}
      <path d="M 128,42 C 130,56 128,74 122,88" fill="none" stroke="#5C3A21" strokeWidth="1.6" opacity="0.7" />
    </g>

    {/* PIERCING CRESCENT BLADE BEAM & PENETRATING LANCE */}
    {/* High-velocity outer piercing blade halo */}
    <path
      d="M 32,20 L 76,46 C 102,38 126,52 152,78 L 164,124 L 128,106 C 96,110 74,94 56,66 Z"
      fill={`url(#${g.emerald})`}
      opacity="0.32"
      stroke="none"
    />

    {/* Searing Emerald-Mint Piercing Wave (The In-Game Crescent Projectile) */}
    <path
      d="M 38,24 Q 82,54 116,74 Q 138,90 162,122 Q 132,104 106,86 Q 74,62 38,24 Z"
      fill={`url(#${g.mint})`}
      stroke="#2D1E2F"
      strokeWidth="2.8"
    />

    {/* Razor Piercing Blade Head (Erupting through the shield) */}
    <polygon
      points="164,124 140,110 148,102 162,106"
      fill={`url(#${g.gold})`}
      stroke="#2D1E2F"
      strokeWidth="2.2"
    />

    {/* Penetrating Luminous Blade Core */}
    <path
      d="M 44,28 Q 86,56 120,76 Q 140,92 160,120 Q 134,106 112,90 Q 78,66 44,28 Z"
      fill="#FFFDF0"
      stroke="none"
    />

    {/* Forward Piercing Chevron Accents */}
    <polygon points="122,88 138,98 128,102 120,96" fill={`url(#${g.gold})`} stroke="#2D1E2F" strokeWidth="1.5" />
    <polygon points="98,72 112,80 104,84 96,78" fill={`url(#${g.emerald})`} stroke="#2D1E2F" strokeWidth="1.5" />

    {/* FLYING SHIELD SPLINTERS & SHARDS */}
    <polygon points="80,48 86,44 84,52" fill={`url(#${g.bark})`} stroke="#2D1E2F" strokeWidth="1.5" />
    <polygon points="98,88 106,84 100,92" fill={`url(#${g.bark})`} stroke="#2D1E2F" strokeWidth="1.5" />
    <polygon points="72,74 76,68 78,76" fill={`url(#${g.gold})`} stroke="#2D1E2F" strokeWidth="1.2" />
    <polygon points="106,58 112,54 110,62" fill={`url(#${g.gold})`} stroke="#2D1E2F" strokeWidth="1.2" />
    <polygon points="92,44 95,40 96,46" fill={`url(#${g.mint})`} stroke="#2D1E2F" strokeWidth="1.2" />

    {/* RADIANT CENTRAL IMPACT STARBURST (Point of Sunder) */}
    <polygon
      points="90,68 93,57 97,66 107,64 100,71 106,79 97,76 93,85 89,77 80,78 86,70 79,63 88,65"
      fill={`url(#${g.gold})`}
      stroke="#2D1E2F"
      strokeWidth="1.8"
    />
    <circle cx="93" cy="71" r="3.5" fill="#FFFDF0" stroke="none" />

    {/* Piercing Motes & Spark Glints */}
    <polygon points="34,22 36,17 38,22 43,24 38,26 36,31 34,26 29,24" fill={`url(#${g.mint})`} stroke="#2D1E2F" strokeWidth="1.2" />
    <circle cx="152" cy="116" r="2" fill="#FFFDF0" stroke="none" />
    <circle cx="66" cy="48" r="1.8" fill={`url(#${g.cyan})`} stroke="#2D1E2F" strokeWidth="1" />
    <circle cx="120" cy="84" r="1.8" fill={`url(#${g.emerald})`} stroke="#2D1E2F" strokeWidth="1" />
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
