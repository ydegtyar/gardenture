import React from 'react';
import type { CardSymbolProps } from './types';

/**
 * 4.17 Double Dash (XVII · THE DUAL ZEPHYR):
 * Twin winged zephyr crests, dual synchronized dash chevrons & paired charge crystals.
 */
export const DoubleDashSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g
    data-testid="tarot-symbol-double_dash"
    stroke="#2D1E2F"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Twin swirling Zephyr slipstream ribbons */}
    <path
      d="M 32,62 C 58,36 94,40 132,32"
      fill="none"
      stroke={`url(#${g.cyan})`}
      strokeWidth="3.4"
      opacity="0.85"
    />
    <path
      d="M 38,96 C 68,74 102,78 140,66"
      fill="none"
      stroke={`url(#${g.mint})`}
      strokeWidth="3.4"
      opacity="0.85"
    />

    {/* Left & Right Feathered Zephyr Wings */}
    <path
      d="M 40,56 C 42,32 66,24 84,36 C 72,44 68,54 78,62 C 58,64 46,62 40,56 Z"
      fill={`url(#${g.cyan})`}
    />
    <path
      d="M 52,88 C 54,66 78,58 96,70 C 84,78 80,88 90,96 C 70,98 58,94 52,88 Z"
      fill={`url(#${g.emerald})`}
    />

    {/* Twin Synchronized Dash Chevron Arrows (×2 Charges) */}
    <polygon
      points="78,48 118,30 110,48 138,44 100,66 106,50"
      fill={`url(#${g.gold})`}
    />
    <polygon
      points="90,82 130,64 122,82 150,78 112,100 118,84"
      fill={`url(#${g.parchment})`}
    />

    {/* Two Glowing Dash Charge Rhombus Crystals */}
    <polygon points="56,36 63,45 56,54 49,45" fill={`url(#${g.gold})`} />
    <polygon points="68,70 75,79 68,88 61,79" fill={`url(#${g.mint})`} />
    <circle cx="56" cy="45" r="2.2" fill="#FFFDF0" stroke="none" />
    <circle cx="68" cy="79" r="2.2" fill="#FFFDF0" stroke="none" />
  </g>
);

/**
 * 4.15 Spore Pop:
 * Bursting mushroom cap with radial spore ring.
 */
export const SporePopSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="77" y="72" width="26" height="35" rx="8" fill={`url(#${g.parchment})`} />
    <path d="M 50,76 C 50,39 130,39 130,76 Z" fill={`url(#${g.rose})`} />
    <circle cx="75" cy="57" r="6.5" fill={`url(#${g.gold})`} />
    <circle cx="105" cy="61" r="5.5" fill={`url(#${g.gold})`} />
    <circle cx="43" cy="47" r="5.5" fill={`url(#${g.mint})`} />
    <circle cx="137" cy="47" r="5.5" fill={`url(#${g.mint})`} />
    <circle cx="90" cy="29" r="6.5" fill={`url(#${g.gold})`} />
  </g>
);

/**
 * 4.16 Second Wind:
 * Phoenix feather with golden-emerald flames.
 */
export const SecondWindSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path
      d="M 90,19 C 120,43 116,85 90,110 C 64,85 60,43 90,19 Z"
      fill={`url(#${g.gold})`}
    />
    <path
      d="M 90,32 C 107,51 105,80 90,99 C 75,80 73,51 90,32 Z"
      fill={`url(#${g.emerald})`}
    />
    <line x1="90" y1="26" x2="90" y2="115" stroke="#FFFDF0" strokeWidth="2.5" />
  </g>
);

/**
 * 4.20 Petal Storm:
 * Swirling botanical tornado vortex with sakura petals.
 */
export const PetalStormSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 46,40 Q 90,53 134,38" fill="none" stroke={`url(#${g.violet})`} strokeWidth="5" />
    <path d="M 56,68 Q 90,79 124,64" fill="none" stroke={`url(#${g.rose})`} strokeWidth="5" />
    <path d="M 70,94 Q 90,103 110,92" fill="none" stroke={`url(#${g.gold})`} strokeWidth="5" />
    <ellipse cx="62" cy="48" rx="10" ry="5.5" transform="rotate(-25 62 48)" fill={`url(#${g.rose})`} />
    <ellipse cx="122" cy="54" rx="10" ry="5.5" transform="rotate(20 122 54)" fill={`url(#${g.gold})`} />
    <ellipse cx="90" cy="80" rx="10" ry="5.5" transform="rotate(-15 90 80)" fill={`url(#${g.mint})`} />
  </g>
);
