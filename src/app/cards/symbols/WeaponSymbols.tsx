import React from 'react';
import type { CardSymbolProps } from './types';

/**
 * 3.1 Leaf Blade / Garden Blade:
 * Single broad leaf blade, mint-to-leaf-green cel fills, pale midrib, golden guard with leaf gem, brown wrapped grip.
 */
export const LeafBladeSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Circular pastel halo */}
    <circle cx="90" cy="68" r="38" fill={`url(#${g.mint})`} opacity="0.32" stroke="none" />
    <g transform="translate(90, 68) rotate(26) scale(0.72) translate(-90, -68)">
      {/* Pommel */}
      <circle cx="90" cy="116" r="6" fill={`url(#${g.gold})`} stroke="#2D1E2F" strokeWidth="2.6" />
      <circle cx="88" cy="114" r="2" fill="#FFFDF0" stroke="none" />
      {/* Wrapped Grip */}
      <rect x="85" y="96" width="10" height="15" rx="3" fill={`url(#${g.bark})`} stroke="#2D1E2F" strokeWidth="2.6" />
      <line x1="85" y1="100" x2="95" y2="103" stroke="#2D1E2F" strokeWidth="1.8" />
      <line x1="85" y1="105" x2="95" y2="108" stroke="#2D1E2F" strokeWidth="1.8" />
      {/* Crossguard with leaf gem */}
      <path
        d="M 68 96 C 76 91 85 93 90 95 C 95 93 104 91 112 96 C 109 101 98 100 90 99 C 82 100 71 101 68 96 Z"
        fill={`url(#${g.gold})`}
        stroke="#2D1E2F"
        strokeWidth="2.6"
      />
      <path
        d="M 90 93 C 92 95 92 97 90 98 C 88 97 88 95 90 93 Z"
        fill="#7be0a8"
        stroke="#2D1E2F"
        strokeWidth="1.4"
      />
      {/* Broad Leaf Blade (Two-tone cel fills) */}
      <path
        d="M 90 22 C 106 38 116 56 116 72 C 116 88 103 94 90 97 Z"
        fill="#4fb67f"
        stroke="#2D1E2F"
        strokeWidth="3.0"
      />
      <path
        d="M 90 22 C 74 38 64 56 64 72 C 64 88 77 94 90 97 Z"
        fill="#7be0a8"
        stroke="#2D1E2F"
        strokeWidth="3.0"
      />
      {/* Central pale midrib & side veins */}
      <line x1="90" y1="26" x2="90" y2="94" stroke="#e2f8eb" strokeWidth="2.4" />
      <path d="M 90 48 C 95 44 100 42 105 40" stroke="#e2f8eb" strokeWidth="1.8" />
      <path d="M 90 66 C 85 62 80 60 75 58" stroke="#e2f8eb" strokeWidth="1.8" />
    </g>
  </g>
);

/**
 * 3.2 Arbalete (thorn_spear):
 * Ornate botanical crossbow with curved rosewood limbs, taut gold bowstring & blazing briar bolt.
 */
export const ThornSpearSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <g transform="translate(90, 68) rotate(-32)">
      {/* Taut golden bowstring */}
      <polyline
        points="-6,-32 -22,0 -6,32"
        fill="none"
        stroke={`url(#${g.gold})`}
        strokeWidth="2.4"
      />
      {/* Carved heartwood crossbow stock / tiller */}
      <rect x="-34" y="-5" width="52" height="10" rx="4" fill={`url(#${g.bark})`} />
      <line x1="-28" y1="0" x2="14" y2="0" stroke="#FFFDF0" strokeWidth="1.5" opacity="0.7" />
      <circle cx="-34" cy="0" r="5" fill={`url(#${g.gold})`} />
      {/* Curved botanical Arbalete prod limbs (top & bottom) */}
      <path
        d="M 10,-4 Q 20,-22 -6,-34 Q 8,-18 2,-4 Z"
        fill={`url(#${g.rose})`}
      />
      <path
        d="M 10,4 Q 20,22 -6,34 Q 8,18 2,4 Z"
        fill={`url(#${g.rose})`}
      />
      {/* Gilded stirrup nose collar */}
      <rect x="6" y="-7.5" width="9" height="15" rx="3" fill={`url(#${g.gold})`} />
      {/* Loaded fletched briar bolt & barbed crimson broadhead */}
      <polygon points="-24,-5 -15,0 -24,5 -20,0" fill={`url(#${g.mint})`} />
      <line x1="-20" y1="0" x2="28" y2="0" stroke={`url(#${g.parchment})`} strokeWidth="3.2" />
      <polygon points="44,0 24,-9 28,0 24,9" fill={`url(#${g.crimson})`} />
      <circle cx="32" cy="0" r="3" fill="#FFFDF0" stroke="none" />
    </g>
  </g>
);

/**
 * 4.2 Quick Hands / 3.4 Seed Blades:
 * Twin winged seed daggers & wind swirls.
 */
export const SeedBladesSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 38,88 Q 88,30 146,48" fill="none" stroke={`url(#${g.cyan})`} strokeWidth="4.5" />
    <path d="M 44,104 Q 96,58 148,76" fill="none" stroke={`url(#${g.mint})`} strokeWidth="3.5" />
    <g transform="translate(72, 57) rotate(-26)">
      <path d="M 0,-30 C 14,-8 14,15 0,29 C -14,15 -14,-8 0,-30 Z" fill={`url(#${g.mint})`} />
      <line x1="0" y1="-22" x2="0" y2="14" stroke="#FFFDF0" strokeWidth="1.8" />
      <circle cx="0" cy="20" r="5.5" fill={`url(#${g.gold})`} />
    </g>
    <g transform="translate(111, 71) rotate(22)">
      <path d="M 0,-30 C 14,-8 14,15 0,29 C -14,15 -14,-8 0,-30 Z" fill={`url(#${g.emerald})`} />
      <line x1="0" y1="-22" x2="0" y2="14" stroke="#FFFDF0" strokeWidth="1.8" />
      <circle cx="0" cy="20" r="5.5" fill={`url(#${g.gold})`} />
    </g>
    {/* Venom drop accent */}
    <path d="M 92,26 C 97,34 97,40 92,40 C 87,40 87,34 92,26 Z" fill={`url(#${g.emerald})`} strokeWidth="2" />
  </g>
);

/**
 * 4.3 Wide Swing / 3.3 Bloom Hammer:
 * Sweeping golden crescent arc & blossom maul.
 */
export const BloomHammerSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path
      d="M 34,90 A 56,50 0 0,1 146,90 A 45,33 0 0,0 34,90 Z"
      fill={`url(#${g.gold})`}
    />
    <rect x="86" y="54" width="8" height="60" rx="4" fill={`url(#${g.bark})`} />
    <ellipse cx="90" cy="51" rx="30" ry="19" fill={`url(#${g.violet})`} />
    <ellipse cx="90" cy="48" rx="22" ry="11" fill={`url(#${g.rose})`} opacity="0.65" stroke="none" />
    <circle cx="74" cy="49" r="6.5" fill={`url(#${g.rose})`} />
    <circle cx="106" cy="49" r="6.5" fill={`url(#${g.rose})`} />
    <circle cx="90" cy="49" r="5" fill={`url(#${g.gold})`} />
  </g>
);

/**
 * 3.5 Petal Orbit:
 * Magnetic rings & orbiting crystals/petals.
 */
export const PetalOrbitSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="90" cy="70" rx="54" ry="23" fill="none" stroke={`url(#${g.mint})`} strokeWidth="2.5" strokeDasharray="5 4" />
    <circle cx="90" cy="70" r="23" fill={`url(#${g.emerald})`} />
    <circle cx="90" cy="70" r="12" fill={`url(#${g.gold})`} />
    <polygon points="40,62 49,50 58,62 49,74" fill={`url(#${g.gold})`} />
    <polygon points="134,76 143,64 152,76 143,88" fill={`url(#${g.rose})`} />
    <polygon points="88,24 97,13 106,24 97,35" fill={`url(#${g.cyan})`} />
  </g>
);

/**
 * 3.6 Chain Lightning:
 * Forked sky-blue thunderbolt & storm orbs.
 */
export const ChainLightningSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    {/* Secondary arcing lightning branches */}
    <polyline
      points="50,52 72,64 56,88 78,102"
      fill="none"
      stroke={`url(#${g.cyan})`}
      strokeWidth="3.5"
    />
    <polyline
      points="132,44 110,62 128,84 106,104"
      fill="none"
      stroke={`url(#${g.violet})`}
      strokeWidth="3.5"
    />
    {/* Central thunderbolt */}
    <polygon
      points="100,16 64,68 88,68 74,116 122,58 96,58"
      fill={`url(#${g.gold})`}
    />
    <polygon
      points="96,26 73,64 90,64 81,102 112,62 93,62"
      fill="#FFFDF0"
      stroke="none"
      opacity="0.7"
    />
    {/* Orbiting storm nodes */}
    <circle cx="48" cy="50" r="6" fill={`url(#${g.cyan})`} />
    <circle cx="132" cy="44" r="6" fill={`url(#${g.cyan})`} />
    <circle cx="56" cy="88" r="5" fill={`url(#${g.gold})`} />
    <circle cx="128" cy="84" r="5" fill={`url(#${g.gold})`} />
  </g>
);
