import React from 'react';
import type { CardSymbolProps } from './types';

/**
 * 4.13 Echo Swing (XIII · THE TWIN ECHO):
 * Dynamic twin overlapping sword slash arcs — a vibrant sunlit gold and dewy mint primary blade strike,
 * paired with a translucent astral cyan phantom echo, concentric acoustic resonance ripples, and arcane star glints.
 */
export const EchoSwingSymbol: React.FC<CardSymbolProps> = ({ gradients: g }) => (
  <g
    data-testid="tarot-symbol-echo_swing"
    stroke="#2D1E2F"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Background acoustic echo resonance arcs */}
    <path
      d="M 28,82 C 48,52 82,38 122,26"
      fill="none"
      stroke={`url(#${g.cyan})`}
      strokeWidth="2.2"
      strokeDasharray="4 3"
      opacity="0.75"
    />
    <path
      d="M 40,98 C 64,70 102,54 144,44"
      fill="none"
      stroke={`url(#${g.gold})`}
      strokeWidth="1.8"
      strokeDasharray="3 3"
      opacity="0.6"
    />
    <path
      d="M 54,112 C 78,88 116,74 154,66"
      fill="none"
      stroke={`url(#${g.mint})`}
      strokeWidth="1.5"
      strokeDasharray="2 2.5"
      opacity="0.5"
    />

    {/* SECONDARY PHANTOM ECHO SWING (Translucent Astral Cyan & Lavender) */}
    <g opacity="0.88">
      {/* Phantom aura glow */}
      <path
        d="M 32,86 C 54,48 94,30 134,22 C 100,44 74,70 54,98 Z"
        fill={`url(#${g.cyan})`}
        stroke="none"
        opacity="0.4"
      />
      {/* Phantom blade slash crescent */}
      <path
        d="M 36,88 C 60,50 100,32 136,24 C 104,46 76,72 56,100 C 46,98 40,94 36,88 Z"
        fill={`url(#${g.cyan})`}
        stroke="#2D1E2F"
        strokeWidth="2.4"
      />
      {/* Phantom inner facet highlight */}
      <path
        d="M 48,82 C 72,50 106,36 134,23 C 106,44 82,66 68,88 Z"
        fill={`url(#${g.violet})`}
        opacity="0.75"
        stroke="none"
      />
      {/* Phantom cutting edge line */}
      <path
        d="M 44,84 C 70,52 102,36 135,23"
        fill="none"
        stroke="#FFFDF0"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Phantom spirit leaf tip */}
      <path
        d="M 34,92 C 30,86 34,78 42,82 C 40,88 38,91 34,92 Z"
        fill={`url(#${g.cyan})`}
        stroke="#2D1E2F"
        strokeWidth="1.8"
      />
    </g>

    {/* PRIMARY VIBRANT SWORD SWING (Sunlit Gold, Dewy Mint & Leaf Blade) */}
    <g>
      {/* Slash slipstream trail */}
      <path
        d="M 44,110 C 66,94 92,84 122,76"
        fill="none"
        stroke={`url(#${g.mint})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Main Golden Slash Crescent */}
      <path
        d="M 48,106 C 76,64 120,44 154,34 C 118,60 88,88 68,114 C 56,114 50,111 48,106 Z"
        fill={`url(#${g.gold})`}
        stroke="#2D1E2F"
        strokeWidth="2.8"
      />
      {/* Two-tone cel shading: Mint green lower facet */}
      <path
        d="M 52,106 C 78,82 110,68 144,52 C 114,72 88,96 70,114 C 60,113 54,110 52,106 Z"
        fill={`url(#${g.mint})`}
        stroke="none"
      />
      {/* Pale parchment specular highlight along apex */}
      <path
        d="M 64,96 C 90,62 128,46 153,35 C 124,54 98,76 80,98 Z"
        fill={`url(#${g.parchment})`}
        opacity="0.85"
        stroke="none"
      />
      {/* Sharp cutting spine glint */}
      <path
        d="M 58,100 C 86,66 122,48 153,35"
        fill="none"
        stroke="#FFFDF0"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Botanical Leaf-Blade Motif at strike initiation */}
      <path
        d="M 44,114 C 36,106 38,94 50,96 C 46,104 46,110 44,114 Z"
        fill={`url(#${g.emerald})`}
        stroke="#2D1E2F"
        strokeWidth="2.2"
      />
      <circle cx="48" cy="100" r="2.5" fill="#FFFDF0" stroke="none" />
    </g>

    {/* Arcane Twin Stars & Sparkling Energy Motes */}
    <polygon
      points="154,34 157,27 160,34 167,37 160,40 157,47 154,40 147,37"
      fill={`url(#${g.gold})`}
      stroke="#2D1E2F"
      strokeWidth="1.5"
    />
    <circle cx="157" cy="37" r="2" fill="#FFFDF0" stroke="none" />

    <polygon
      points="138,22 140,17 142,22 147,24 142,26 140,31 138,26 133,24"
      fill={`url(#${g.cyan})`}
      stroke="#2D1E2F"
      strokeWidth="1.4"
    />
    <circle cx="140" cy="24" r="1.6" fill="#FFFDF0" stroke="none" />

    {/* Resonant echo particles */}
    <circle cx="92" cy="38" r="3" fill={`url(#${g.gold})`} stroke="#2D1E2F" strokeWidth="1.2" />
    <circle cx="92" cy="38" r="1.2" fill="#FFFDF0" stroke="none" />
    <circle cx="118" cy="62" r="2.5" fill={`url(#${g.cyan})`} stroke="#2D1E2F" strokeWidth="1.2" />
    <circle cx="70" cy="54" r="2" fill={`url(#${g.mint})`} stroke="#2D1E2F" strokeWidth="1" />
    <circle cx="140" cy="68" r="2.2" fill={`url(#${g.parchment})`} stroke="#2D1E2F" strokeWidth="1" />

    {/* Speed spark streaks */}
    <line x1="84" y1="50" x2="96" y2="44" stroke="#FFFDF0" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="108" y1="36" x2="120" y2="30" stroke="#FFFDF0" strokeWidth="1.5" strokeLinecap="round" />
  </g>
);

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
