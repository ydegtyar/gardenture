/**
 * Vintage Botanical Tarot Card Frame & Bespoke Arcana Illustrations
 * Layer 7 (app): Implements Game Elements Catalog Section 1.5, Section 3, and Section 4 (4.1–4.30).
 * Every card & weapon offer renders as an ornate old-world Tarot card with Roman numerals,
 * corner rosebud/celestial filigree, an arched esoteric illustration window with rich multi-stop
 * SVG gradients, and parchment scroll banners.
 */

import React, { useId } from 'react';
import type { CardRarity } from '../content/schema/types';

interface TarotMetadata {
  numeral: string;
  arcanaTitle: string;
}

const TAROT_METADATA: Readonly<Record<string, TarotMetadata>> = {
  // 12 Stat Cards (4.1 - 4.12)
  sharper_edge: { numeral: 'I', arcanaTitle: 'THE WHETSTONE' },
  quick_hands: { numeral: 'II', arcanaTitle: 'THE SWIFT GLOVES' },
  wide_swing: { numeral: 'III', arcanaTitle: 'THE SOLAR CRESCENT' },
  long_reach: { numeral: 'IV', arcanaTitle: 'THE VINE LANCE' },
  swift_boots: { numeral: 'V', arcanaTitle: 'THE WINGED HEELS' },
  hardy_bark: { numeral: 'VI', arcanaTitle: 'THE OAK AEGIS' },
  magnet_moss: { numeral: 'VII', arcanaTitle: 'THE LODESTONE' },
  lucky_clover: { numeral: 'VIII', arcanaTitle: 'WHEEL OF CLOVER' },
  keen_eye: { numeral: 'IX', arcanaTitle: 'THE HAWK EYE' },
  iron_bark: { numeral: 'X', arcanaTitle: 'THE IRONWOOD BASTION' },
  regrowth: { numeral: 'XI', arcanaTitle: 'THE SPROUTING SEED' },
  fleet_step: { numeral: 'XII', arcanaTitle: 'THE PHANTOM STEP' },

  // 8 Behavior Cards (4.13 - 4.20)
  echo_swing: { numeral: 'XIII', arcanaTitle: 'THE TWIN ECHO' },
  thorn_trail: { numeral: 'XIV', arcanaTitle: 'THE BRIAR PATH' },
  spore_pop: { numeral: 'XV', arcanaTitle: 'THE SPORE BURST' },
  second_wind: { numeral: 'XVI', arcanaTitle: 'THE PHOENIX PLUME' },
  double_dash: { numeral: 'XVII', arcanaTitle: 'THE DUAL ZEPHYR' },
  vampiric_bloom: { numeral: 'XVIII', arcanaTitle: 'THE NIGHT ORCHID' },
  shockwave: { numeral: 'XIX', arcanaTitle: 'THE EARTH SHAKER' },
  petal_storm: { numeral: 'XX', arcanaTitle: 'THE SAKURA VORTEX' },

  // 6 Synergy Cards (4.21 - 4.26)
  piercing_slash: { numeral: 'XXI', arcanaTitle: 'THE SUNDERED WARD' },
  burning_thorns: { numeral: 'XXII', arcanaTitle: 'THE PYRE THORN' },
  healing_bloom: { numeral: 'XXIII', arcanaTitle: 'THE SACRED LOTUS' },
  chain_bloom: { numeral: 'XXIV', arcanaTitle: 'THE STORM VINE' },
  crit_burst: { numeral: 'XXV', arcanaTitle: 'THE SUPERNOVA' },
  frost_touch: { numeral: 'XXVI', arcanaTitle: 'THE RIME GRASP' },

  // 4 Risk & Reward Cards (4.27 - 4.30)
  glass_blade: { numeral: 'XXVII', arcanaTitle: 'THE GLASS RAPIER' },
  greedy_roots: { numeral: 'XXVIII', arcanaTitle: 'THE AVARICE ROOTS' },
  wild_growth: { numeral: 'XXIX', arcanaTitle: 'THE UNBOUND BLOOM' },
  blood_pact: { numeral: 'XXX', arcanaTitle: 'THE CRIMSON PACT' },

  // 6 Weapons (3.1 - 3.7)
  garden_blade: { numeral: 'I', arcanaTitle: 'BLADE OF THE GROVE' },
  thorn_spear: { numeral: 'II', arcanaTitle: 'SPEAR OF BRAMBLES' },
  bloom_hammer: { numeral: 'III', arcanaTitle: 'MAUL OF BLOSSOMS' },
  seed_blades: { numeral: 'IV', arcanaTitle: 'DAGGERS OF WIND' },
  petal_orbit: { numeral: 'V', arcanaTitle: 'RING OF PETALS' },
  chain_lightning: { numeral: 'VI', arcanaTitle: 'SPARK OF THE SKY' },
};

export function getTarotMetadata(targetId: string): TarotMetadata {
  return (
    TAROT_METADATA[targetId] ?? {
      numeral: 'ARCANA',
      arcanaTitle: 'MYSTIC BLESSING',
    }
  );
}

/**
 * Botanical Tarot Card Back Illustration
 * Supports both vertical (landscape/desktop tarot column) and horizontal (portrait tablet banner)
 * geometries for crisp 3D card flips on any screen orientation.
 */
export function TarotCardBackSvg({
  orientation = 'vertical',
}: {
  orientation?: 'vertical' | 'horizontal';
}) {
  const rawId = useId().replace(/:/g, '');
  const backGradId = `tarot-back-bg-${rawId}`;
  const goldGradId = `tarot-back-gold-${rawId}`;
  const sunGradId = `tarot-back-sun-${rawId}`;

  if (orientation === 'horizontal') {
    return (
      <svg
        viewBox="0 0 420 116"
        className="w-full h-full drop-shadow-sm select-none pointer-events-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={backGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#352038" />
            <stop offset="50%" stopColor="#1E1322" />
            <stop offset="100%" stopColor="#2B1B24" />
          </linearGradient>
          <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF0" />
            <stop offset="45%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <radialGradient id={sunGradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDFFB6" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#A8E6CF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1E1322" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="420" height="116" rx="12" fill={`url(#${backGradId})`} />
        <rect
          x="5"
          y="5"
          width="410"
          height="106"
          rx="9"
          stroke={`url(#${goldGradId})`}
          strokeWidth="1.5"
          strokeOpacity="0.85"
        />
        <rect
          x="10"
          y="10"
          width="400"
          height="96"
          rx="6"
          fill="#221523"
          stroke="#8C5A3C"
          strokeWidth="1.2"
        />

        {/* Ambient mystic aura */}
        <ellipse cx="210" cy="58" rx="135" ry="44" fill={`url(#${sunGradId})`} />

        {/* Horizontal vine lattice */}
        <path
          d="M 28,58 Q 75,24 122,58 T 210,58 T 298,58 T 392,58"
          stroke="#A8E6CF"
          strokeWidth="1.2"
          strokeOpacity="0.32"
        />
        <path
          d="M 28,58 Q 75,92 122,58 T 210,58 T 298,58 T 392,58"
          stroke="#FDFFB6"
          strokeWidth="1.1"
          strokeOpacity="0.25"
        />

        {/* Corner filigree diamonds */}
        <polygon points="20,16 25,20 20,24 15,20" fill={`url(#${goldGradId})`} />
        <polygon points="400,16 405,20 400,24 395,20" fill={`url(#${goldGradId})`} />
        <polygon points="20,92 25,96 20,100 15,96" fill={`url(#${goldGradId})`} />
        <polygon points="400,92 405,96 400,100 395,96" fill={`url(#${goldGradId})`} />

        {/* Left & Right botanical leaves */}
        <path
          d="M 76,58 C 92,46 108,50 116,58 C 108,66 92,70 76,58 Z"
          fill="#88D49E"
          fillOpacity="0.8"
          stroke="#2D1E2F"
          strokeWidth="1.2"
        />
        <path
          d="M 344,58 C 328,46 312,50 304,58 C 312,66 328,70 344,58 Z"
          fill="#88D49E"
          fillOpacity="0.8"
          stroke="#2D1E2F"
          strokeWidth="1.2"
        />

        {/* Central esoteric seal */}
        <circle cx="210" cy="58" r="38" fill="#1A101D" stroke={`url(#${goldGradId})`} strokeWidth="1.5" />
        <circle cx="210" cy="58" r="30" fill="none" stroke="#DED2F9" strokeWidth="1" strokeDasharray="3 3" />
        <polygon
          points="210,24 215,51 242,58 215,65 210,92 205,65 178,58 205,51"
          fill={`url(#${goldGradId})`}
        />
        <polygon
          points="210,34 216,50 232,58 216,66 210,82 204,66 188,58 204,50"
          fill="#FFAAA6"
          transform="rotate(45 210 58)"
        />
        <circle cx="210" cy="58" r="8" fill="#A8E6CF" stroke="#2D1E2F" strokeWidth="2" />
        <circle cx="210" cy="58" r="3" fill="#FFFDF0" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 180 260"
      className="w-full h-full drop-shadow-sm select-none pointer-events-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={backGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#352038" />
          <stop offset="50%" stopColor="#1E1322" />
          <stop offset="100%" stopColor="#2D1B22" />
        </linearGradient>
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF0" />
          <stop offset="45%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <radialGradient id={sunGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDFFB6" stopOpacity="0.4" />
          <stop offset="65%" stopColor="#A8E6CF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1E1322" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="180" height="260" rx="14" fill={`url(#${backGradId})`} />
      {/* Outer gold foil frame */}
      <rect
        x="6"
        y="6"
        width="168"
        height="248"
        rx="10"
        fill="none"
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.5"
        strokeOpacity="0.85"
      />
      {/* Inner ornamental border */}
      <rect
        x="12"
        y="12"
        width="156"
        height="236"
        rx="8"
        fill="#241625"
        stroke="#8C5A3C"
        strokeWidth="1.5"
      />
      <circle cx="90" cy="130" r="68" fill={`url(#${sunGradId})`} />
      {/* Vine lattice background pattern */}
      <path
        d="M 16,30 Q 50,70 16,110 T 16,190 T 16,240"
        stroke="#A8E6CF"
        strokeWidth="1.2"
        strokeOpacity="0.3"
        fill="none"
      />
      <path
        d="M 164,30 Q 130,70 164,110 T 164,190 T 164,240"
        stroke="#A8E6CF"
        strokeWidth="1.2"
        strokeOpacity="0.3"
        fill="none"
      />
      {/* Corner filigree diamonds */}
      <polygon points="22,18 26,22 22,26 18,22" fill={`url(#${goldGradId})`} />
      <polygon points="158,18 162,22 158,26 154,22" fill={`url(#${goldGradId})`} />
      <polygon points="22,234 26,238 22,242 18,238" fill={`url(#${goldGradId})`} />
      <polygon points="158,234 162,238 158,242 154,238" fill={`url(#${goldGradId})`} />
      {/* Central esoteric concentric mystic rings */}
      <circle cx="90" cy="130" r="54" fill="#1B111E" stroke={`url(#${goldGradId})`} strokeWidth="1.5" strokeOpacity="0.85" />
      <circle cx="90" cy="130" r="46" fill="none" stroke="#DED2F9" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="90" cy="130" r="38" fill="#140C17" stroke="#88D49E" strokeWidth="1.5" strokeOpacity="0.85" />
      {/* Mystic 8-pointed golden sun/flower burst */}
      <polygon
        points="90,94 95,123 124,130 95,137 90,166 85,137 56,130 85,123"
        fill={`url(#${goldGradId})`}
      />
      <polygon
        points="90,106 97,123 114,130 97,137 90,154 83,137 66,130 83,123"
        fill="#FFAAA6"
        transform="rotate(45 90 130)"
      />
      {/* Center glowing gem seed */}
      <circle cx="90" cy="130" r="8" fill="#A8E6CF" stroke="#2D1E2F" strokeWidth="2" />
      <circle cx="90" cy="130" r="3" fill="#FFFDF0" />
      {/* Arcane botanical leaves top and bottom */}
      <path
        d="M 90,38 C 80,54 84,68 90,74 C 96,68 100,54 90,38 Z"
        fill="#A8E6CF"
        stroke="#2D1E2F"
        strokeWidth="1"
      />
      <path
        d="M 90,222 C 80,206 84,192 90,186 C 96,192 100,206 90,222 Z"
        fill="#A8E6CF"
        stroke="#2D1E2F"
        strokeWidth="1"
      />
    </svg>
  );
}

interface GradientIds {
  sky: string;
  halo: string;
  gold: string;
  emerald: string;
  mint: string;
  rose: string;
  crimson: string;
  cyan: string;
  violet: string;
  bark: string;
  steel: string;
  parchment: string;
}

/**
 * Renders the bespoke antique Tarot illustration inside an arched esoteric alcove
 * with multi-stop linear and radial gradients depicting each card or weapon.
 */
export function TarotIllustrationSvg({
  targetId,
  rarity,
  accentColor,
  iconColor,
  className = 'w-full h-auto aspect-[180/132] block select-none',
}: {
  targetId: string;
  rarity: CardRarity;
  accentColor?: string;
  iconColor?: string;
  className?: string;
}) {
  const rawUid = useId().replace(/:/g, '');
  const g: GradientIds = {
    sky: `t-sky-${rawUid}`,
    halo: `t-halo-${rawUid}`,
    gold: `t-gold-${rawUid}`,
    emerald: `t-em-${rawUid}`,
    mint: `t-mint-${rawUid}`,
    rose: `t-rose-${rawUid}`,
    crimson: `t-crim-${rawUid}`,
    cyan: `t-cyan-${rawUid}`,
    violet: `t-vio-${rawUid}`,
    bark: `t-bark-${rawUid}`,
    steel: `t-steel-${rawUid}`,
    parchment: `t-parch-${rawUid}`,
  };

  const resolvedColor = accentColor ?? iconColor ?? '#88D49E';

  const skyStops =
    rarity === 'legendary'
      ? ['#4A2545', '#271432', '#150B1E']
      : rarity === 'rare'
        ? ['#1F3356', '#162038', '#0E1424']
        : rarity === 'uncommon'
          ? ['#1D3E35', '#152A26', '#0D1B18']
          : ['#342539', '#221827', '#150E18'];

  const haloColor =
    rarity === 'legendary'
      ? '#FDE047'
      : rarity === 'rare'
        ? '#93C5FD'
        : rarity === 'uncommon'
          ? '#6EE7B7'
          : resolvedColor;

  return (
    <svg
      viewBox="0 0 180 132"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Sky Alcove Vertical Linear Gradient */}
        <linearGradient id={g.sky} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={skyStops[0]} />
          <stop offset="55%" stopColor={skyStops[1]} />
          <stop offset="100%" stopColor={skyStops[2]} />
        </linearGradient>

        {/* Esoteric Radial Halo Glow */}
        <radialGradient id={g.halo} cx="50%" cy="52%" r="48%">
          <stop offset="0%" stopColor={haloColor} stopOpacity="0.52" />
          <stop offset="52%" stopColor={haloColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={skyStops[2]} stopOpacity="0" />
        </radialGradient>

        {/* Sunlit Gold & Amber Gradient */}
        <linearGradient id={g.gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF5" />
          <stop offset="38%" stopColor="#FDE047" />
          <stop offset="78%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Lush Emerald Leaf Gradient */}
        <linearGradient id={g.emerald} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D1FAE5" />
          <stop offset="40%" stopColor="#6EE7B7" />
          <stop offset="80%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>

        {/* Dewy Mint & Sage Gradient */}
        <linearGradient id={g.mint} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#F0FDF4" />
          <stop offset="45%" stopColor="#A8E6CF" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>

        {/* Blossom Rose & Coral Gradient */}
        <linearGradient id={g.rose} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE4E6" />
          <stop offset="45%" stopColor="#FDA4AF" />
          <stop offset="85%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#9F1239" />
        </linearGradient>

        {/* Pyre Crimson & Ember Flame Gradient */}
        <linearGradient id={g.crimson} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#FB923C" />
          <stop offset="75%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>

        {/* Astral Sky Cyan & Ice Gradient */}
        <linearGradient id={g.cyan} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0F9FF" />
          <stop offset="42%" stopColor="#93C5FD" />
          <stop offset="82%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Mystic Lavender & Amethyst Gradient */}
        <linearGradient id={g.violet} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAF5FF" />
          <stop offset="45%" stopColor="#DDD6FE" />
          <stop offset="82%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>

        {/* Heartwood Oak & Caramel Leather Gradient */}
        <linearGradient id={g.bark} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="35%" stopColor="#D9A066" />
          <stop offset="78%" stopColor="#9C6B46" />
          <stop offset="100%" stopColor="#5C3A21" />
        </linearGradient>

        {/* Forged Iron & Silver Gradient */}
        <linearGradient id={g.steel} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="45%" stopColor="#94A3B8" />
          <stop offset="85%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Illuminated Cream Parchment Gradient */}
        <linearGradient id={g.parchment} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFFDF0" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
      </defs>

      {/* Arched Vintage Tarot Window Background */}
      <path
        d="M 10,126 L 10,56 A 80,50 0 0,1 170,56 L 170,126 Z"
        fill={`url(#${g.sky})`}
        stroke="#2D1E2F"
        strokeWidth="3.5"
      />

      {/* Ambient Radial Nebula Halo */}
      <circle cx="90" cy="68" r="56" fill={`url(#${g.halo})`} />

      {/* Sacred Geometry Rays behind Subject */}
      <g stroke={haloColor} strokeWidth="0.9" opacity="0.24">
        <line x1="90" y1="16" x2="90" y2="120" />
        <line x1="28" y1="68" x2="152" y2="68" />
        <line x1="46" y1="28" x2="134" y2="108" />
        <line x1="134" y1="28" x2="46" y2="108" />
      </g>

      {/* Inner Gilded Tarot Arch Line */}
      <path
        d="M 16,120 L 16,58 A 74,44 0 0,1 164,58 L 164,120 Z"
        fill="none"
        stroke={`url(#${g.gold})`}
        strokeWidth="1.35"
        strokeDasharray="4 2.5"
        opacity="0.78"
      />

      {/* Concentric Celestial Halo Rings */}
      <circle
        cx="90"
        cy="68"
        r="39"
        fill="none"
        stroke={`url(#${g.gold})`}
        strokeWidth="1.2"
        opacity="0.45"
      />
      <circle
        cx="90"
        cy="68"
        r="29"
        fill={haloColor}
        opacity="0.16"
      />
      <circle
        cx="90"
        cy="68"
        r="29"
        fill="none"
        stroke={haloColor}
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.5"
      />

      {/* Corner Botanical Filigree & Four-Point Stars */}
      <path
        d="M 22,114 C 22,102 30,98 38,104 C 30,108 26,112 22,114 Z"
        fill={`url(#${g.emerald})`}
        opacity="0.65"
      />
      <path
        d="M 158,114 C 158,102 150,98 142,104 C 150,108 154,112 158,114 Z"
        fill={`url(#${g.emerald})`}
        opacity="0.65"
      />
      <polygon points="34,34 36,39 41,41 36,43 34,48 32,43 27,41 32,39" fill={`url(#${g.gold})`} opacity="0.9" />
      <polygon points="146,34 148,39 153,41 148,43 146,48 144,43 139,41 144,39" fill={`url(#${g.gold})`} opacity="0.9" />
      <circle cx="26" cy="84" r="1.8" fill="#FFFDF0" opacity="0.65" />
      <circle cx="154" cy="84" r="1.8" fill="#FFFDF0" opacity="0.65" />

      {/* Card-Specific Symbolic Tarot Artwork (scaled up for prominent visual presence) */}
      <g transform="translate(90, 68) scale(1.24) translate(-90, -68)">
        {renderCardSymbol(targetId, g)}
      </g>
    </svg>
  );
}

function renderCardSymbol(targetId: string, g: GradientIds): React.ReactNode {
  switch (targetId) {
    // 4.1 Sharper Edge / 3.1 Garden Blade: Radiant gradient leaf broadsword with star glints
    case 'sharper_edge':
    case 'garden_blade':
      return (
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

    // 4.2 Quick Hands / 3.4 Seed Blades: Twin winged seed daggers & wind swirls
    case 'quick_hands':
    case 'seed_blades':
      return (
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

    // 4.3 Wide Swing / 3.3 Bloom Hammer: Sweeping golden crescent arc & blossom maul
    case 'wide_swing':
    case 'bloom_hammer':
      return (
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

    // 4.4 Long Reach / 3.2 Thorn Spear: Piercing rose-thorn lance across the arch
    case 'long_reach':
    case 'thorn_spear':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="38" y1="110" x2="124" y2="40" stroke={`url(#${g.emerald})`} strokeWidth="7.5" />
          <polygon points="146,22 110,36 126,56" fill={`url(#${g.rose})`} />
          <polygon points="140,27 118,37 125,47" fill={`url(#${g.parchment})`} stroke="none" opacity="0.65" />
          <polygon points="72,82 58,68 80,71" fill={`url(#${g.mint})`} />
          <polygon points="96,62 112,73 105,53" fill={`url(#${g.mint})`} />
          <circle cx="52" cy="98" r="5" fill={`url(#${g.gold})`} />
        </g>
      );

    // 4.5 Swift Boots: Winged caramel leather boots with wind trails
    case 'swift_boots':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 68,44 L 96,44 L 98,80 L 124,86 C 131,88 131,105 119,105 L 64,105 Z" fill={`url(#${g.bark})`} />
          <path d="M 67,44 L 97,44 L 97,53 L 67,53 Z" fill={`url(#${g.gold})`} />
          <path d="M 64,68 C 38,61 32,42 54,40 C 48,53 58,55 68,57 Z" fill={`url(#${g.mint})`} />
          <path d="M 64,81 C 42,78 38,63 56,61 C 52,70 58,72 66,74 Z" fill={`url(#${g.parchment})`} />
        </g>
      );

    // 4.6 Hardy Bark: Layered tree-bark shield with glowing emerald heart
    case 'hardy_bark':
      return (
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

    // 4.7 Magnet Moss / 3.5 Petal Orbit: Magnetic rings & orbiting crystals/petals
    case 'magnet_moss':
    case 'petal_orbit':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="90" cy="70" rx="54" ry="23" fill="none" stroke={`url(#${g.mint})`} strokeWidth="2.5" strokeDasharray="5 4" />
          <circle cx="90" cy="70" r="23" fill={`url(#${g.emerald})`} />
          <circle cx="90" cy="70" r="12" fill={`url(#${g.gold})`} />
          <polygon points="40,62 49,50 58,62 49,74" fill={`url(#${g.gold})`} />
          <polygon points="134,76 143,64 152,76 143,88" fill={`url(#${g.rose})`} />
          <polygon points="88,24 97,13 106,24 97,35" fill={`url(#${g.cyan})`} />
        </g>
      );

    // 4.8 Lucky Clover: Four-leaf gradient clover & golden stars
    case 'lucky_clover':
      return (
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

    // 4.9 Keen Eye: All-seeing hawk eye with golden crosshair
    case 'keen_eye':
      return (
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

    // 3.6 Chain Lightning: Forked sky-blue thunderbolt & storm orbs
    case 'chain_lightning':
      return (
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

    // 4.10 Iron Bark: Ironwood slab with steel rivets & emerald core
    case 'iron_bark':
      return (
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

    // 4.11 Regrowth: Sprouting seedling in fertile earth with rose-gold aura
    case 'regrowth':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="90" cy="70" r="34" fill={`url(#${g.rose})`} opacity="0.32" stroke="none" />
          <path d="M 90,104 L 90,52" stroke={`url(#${g.emerald})`} strokeWidth="6" />
          <path d="M 90,72 C 60,68 56,40 84,46 C 88,50 90,64 90,72 Z" fill={`url(#${g.mint})`} />
          <path d="M 90,64 C 120,60 124,32 96,38 C 92,42 90,56 90,64 Z" fill={`url(#${g.emerald})`} />
          <circle cx="90" cy="36" r="6.5" fill={`url(#${g.gold})`} />
          <ellipse cx="90" cy="105" rx="24" ry="8.5" fill={`url(#${g.bark})`} />
        </g>
      );

    // 4.23 Healing Bloom: Radiant multi-petalled Sacred Lotus floating on jade water with vitality cross
    case 'healing_bloom':
      return (
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

    // 4.12 Fleet Step / 4.17 Double Dash: Phantom dash silhouettes & twin wind arrows
    case 'fleet_step':
    case 'double_dash':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="52" cy="76" r="16" fill={`url(#${g.violet})`} opacity="0.55" />
          <circle cx="84" cy="68" r="18.5" fill={`url(#${g.cyan})`} opacity="0.8" />
          <circle cx="118" cy="59" r="21" fill={`url(#${g.mint})`} />
          <path d="M 36,98 L 144,82" stroke={`url(#${g.gold})`} strokeWidth="4.5" />
          <polygon points="148,81 134,76 137,89" fill={`url(#${g.gold})`} />
        </g>
      );

    // 4.13 Echo Swing / 4.21 Piercing Slash: Twin phantom slash crescents
    case 'echo_swing':
    case 'piercing_slash':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 46,96 A 50,45 0 0,1 124,40 A 37,35 0 0,0 46,96 Z" fill={`url(#${g.cyan})`} opacity="0.85" />
          <path d="M 62,105 A 50,45 0 0,1 142,48 A 37,35 0 0,0 62,105 Z" fill={`url(#${g.gold})`} />
        </g>
      );

    // 4.14 Thorn Trail / 4.22 Burning Thorns: Briar thorns & crimson fire
    case 'thorn_trail':
    case 'burning_thorns':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 36,98 Q 68,52 94,78 T 146,46" fill="none" stroke={`url(#${g.emerald})`} strokeWidth="7" />
          <polygon points="62,68 53,46 73,59" fill={`url(#${g.rose})`} />
          <polygon points="94,76 87,52 107,67" fill={`url(#${g.crimson})`} />
          <polygon points="124,58 117,34 137,49" fill={`url(#${g.gold})`} />
        </g>
      );

    // 4.15 Spore Pop: Bursting mushroom cap with radial spore ring
    case 'spore_pop':
      return (
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

    // 4.16 Second Wind: Phoenix feather with golden-emerald flames
    case 'second_wind':
      return (
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

    // 4.18 Vampiric Bloom / 4.30 Blood Pact: Crimson orchid & life droplets
    case 'vampiric_bloom':
    case 'blood_pact':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="90" cy="70" r="29" fill={`url(#${g.crimson})`} />
          <circle cx="90" cy="70" r="13" fill={`url(#${g.gold})`} />
          <path d="M 90,20 C 99,33 99,42 90,42 C 81,42 81,33 90,20 Z" fill={`url(#${g.mint})`} />
          <path d="M 51,51 C 60,64 60,72 51,72 C 42,72 42,64 51,51 Z" fill={`url(#${g.mint})`} />
          <path d="M 129,51 C 138,64 138,72 129,72 C 120,72 120,64 129,51 Z" fill={`url(#${g.mint})`} />
        </g>
      );

    // 4.19 Shockwave / 4.25 Crit Burst: Expanding seismic rings & golden starburst
    case 'shockwave':
    case 'crit_burst':
      return (
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

    // 4.20 Petal Storm: Swirling botanical tornado vortex with sakura petals
    case 'petal_storm':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 46,40 Q 90,53 134,38" fill="none" stroke={`url(#${g.violet})`} strokeWidth="5" />
          <path d="M 56,68 Q 90,79 124,64" fill="none" stroke={`url(#${g.rose})`} strokeWidth="5" />
          <path d="M 70,94 Q 90,103 110,92" fill="none" stroke={`url(#${g.gold})`} strokeWidth="5" />
          <ellipse cx="62" cy="48" rx="10" ry="5.5" transform="rotate(-25 62 48)" fill={`url(#${g.rose})`} />
          <ellipse cx="122" cy="54" rx="10" ry="5.5" transform="rotate(20 122 54)" fill={`url(#${g.gold})`} />
          <ellipse cx="90" cy="80" rx="10" ry="5.5" transform="rotate(-15 90 80)" fill={`url(#${g.mint})`} />
        </g>
      );

    // 4.24 Chain Bloom: Projectile branching into twin lightning vine arcs
    case 'chain_bloom':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="42,96 90,68 134,38" fill="none" stroke={`url(#${g.cyan})`} strokeWidth="4.5" />
          <polyline points="90,68 136,96" fill="none" stroke={`url(#${g.gold})`} strokeWidth="4.5" />
          <circle cx="42" cy="96" r="10.5" fill={`url(#${g.emerald})`} />
          <circle cx="90" cy="68" r="13.5" fill={`url(#${g.cyan})`} />
          <circle cx="134" cy="38" r="11.5" fill={`url(#${g.gold})`} />
          <circle cx="136" cy="96" r="11.5" fill={`url(#${g.mint})`} />
        </g>
      );

    // 4.26 Frost Touch: Crystalline cyan frost crystal & frozen leaves
    case 'frost_touch':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="90,20 109,52 109,86 90,113 71,86 71,52" fill={`url(#${g.cyan})`} />
          <polygon points="53,48 84,58 90,82 61,76" fill={`url(#${g.mint})`} />
          <polygon points="127,48 96,58 90,82 119,76" fill={`url(#${g.parchment})`} />
          <line x1="90" y1="26" x2="90" y2="107" stroke="#FFFDF0" strokeWidth="2.5" />
        </g>
      );

    // 4.27 Glass Blade: Razor-sharp cyan crystal rapier with fracture lines
    case 'glass_blade':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="90,15 107,86 90,96 73,86" fill={`url(#${g.cyan})`} />
          <polyline points="82,53 93,62 84,72 99,78" fill="none" stroke="#FFFDF0" strokeWidth="2.5" />
          <rect x="64" y="92" width="52" height="8" rx="4" fill={`url(#${g.gold})`} />
          <rect x="85" y="100" width="10" height="16" rx="3" fill={`url(#${g.bark})`} />
        </g>
      );

    // 4.28 Greedy Roots: Tangled roots clutching golden coins & XP gems
    case 'greedy_roots':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="75" cy="74" r="15.5" fill={`url(#${g.gold})`} />
          <circle cx="106" cy="76" r="14.5" fill={`url(#${g.rose})`} />
          <polygon points="90,32 105,56 90,78 75,56" fill={`url(#${g.mint})`} />
          <path d="M 45,105 C 58,72 78,86 90,64 C 102,86 122,72 135,105" fill="none" stroke={`url(#${g.bark})`} strokeWidth="6.5" />
        </g>
      );

    // 4.29 Wild Growth: Oversized pastel blossom tangling around a brass pocket watch
    case 'wild_growth':
    default:
      return (
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
  }
}
