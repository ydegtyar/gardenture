import React from 'react';
import type { CardSymbolProps } from './types';

/**
 * 4.18 Vampiric Bloom / 4.30 Blood Pact:
 * Crimson orchid & life droplets.
 */
export const VampiricBloomSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="90" cy="70" r="29" fill={`url(#${g.crimson})`} />
    <circle cx="90" cy="70" r="13" fill={`url(#${g.gold})`} />
    <path d="M 90,20 C 99,33 99,42 90,42 C 81,42 81,33 90,20 Z" fill={`url(#${g.mint})`} />
    <path d="M 51,51 C 60,64 60,72 51,72 C 42,72 42,64 51,51 Z" fill={`url(#${g.mint})`} />
    <path d="M 129,51 C 138,64 138,72 129,72 C 120,72 120,64 129,51 Z" fill={`url(#${g.mint})`} />
  </g>
);

/**
 * 4.27 Glass Blade:
 * Razor-sharp cyan crystal rapier with fracture lines.
 */
export const GlassBladeSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="90,15 107,86 90,96 73,86" fill={`url(#${g.cyan})`} />
    <polyline points="82,53 93,62 84,72 99,78" fill="none" stroke="#FFFDF0" strokeWidth="2.5" />
    <rect x="64" y="92" width="52" height="8" rx="4" fill={`url(#${g.gold})`} />
    <rect x="85" y="100" width="10" height="16" rx="3" fill={`url(#${g.bark})`} />
  </g>
);

/**
 * 4.28 Greedy Roots:
 * Tangled roots clutching golden coins & XP gems.
 */
export const GreedyRootsSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="75" cy="74" r="15.5" fill={`url(#${g.gold})`} />
    <circle cx="106" cy="76" r="14.5" fill={`url(#${g.rose})`} />
    <polygon points="90,32 105,56 90,78 75,56" fill={`url(#${g.mint})`} />
    <path d="M 45,105 C 58,72 78,86 90,64 C 102,86 122,72 135,105" fill="none" stroke={`url(#${g.bark})`} strokeWidth="6.5" />
  </g>
);

/**
 * 4.29 Wild Growth (Default fallback):
 * Oversized pastel blossom tangling around a brass pocket watch.
 */
export const WildGrowthSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="65" cy="51" r="18.5" fill={`url(#${g.rose})`} />
    <circle cx="115" cy="51" r="18.5" fill={`url(#${g.violet})`} />
    <circle cx="65" cy="89" r="18.5" fill={`url(#${g.gold})`} />
    <circle cx="115" cy="89" r="18.5" fill={`url(#${g.rose})`} />
    <circle cx="90" cy="70" r="24.5" fill={`url(#${g.gold})`} />
    <circle cx="90" cy="70" r="18" fill={`url(#${g.parchment})`} />
    <polyline points="90,57 90,70 101,74" fill="none" stroke="#2D1E2F" strokeWidth="3" />
  </g>
);
