/**
 * Vintage Botanical Tarot Card Frame & Bespoke Arcana Illustrations
 * Layer 7 (app): Implements Game Elements Catalog Section 1.5, Section 3, and Section 4 (4.1–4.30).
 * Every card & weapon offer renders as an ornate old-world Tarot card with Roman numerals,
 * corner rosebud/celestial filigree, an arched esoteric illustration window, and parchment scroll.
 */

import React from 'react';
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
  garden_blade: { numeral: 'ARCANA I', arcanaTitle: 'BLADE OF THE GROVE' },
  thorn_spear: { numeral: 'ARCANA II', arcanaTitle: 'SPEAR OF BRAMBLES' },
  bloom_hammer: { numeral: 'ARCANA III', arcanaTitle: 'MAUL OF BLOSSOMS' },
  seed_blades: { numeral: 'ARCANA IV', arcanaTitle: 'DAGGERS OF WIND' },
  petal_orbit: { numeral: 'ARCANA V', arcanaTitle: 'RING OF PETALS' },
  chain_lightning: { numeral: 'ARCANA VI', arcanaTitle: 'SPARK OF THE SKY' },
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
 * Layer 7 (app): Antique occult botanical back with gold starburst, botanical vines,
 * and vintage celestial diamond filigree for 3D card flips.
 */
export function TarotCardBackSvg() {
  return (
    <svg
      viewBox="0 0 180 260"
      className="w-full h-full drop-shadow-sm select-none pointer-events-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="180" height="260" rx="14" fill="#2D1E2F" />
      {/* Outer gold foil frame */}
      <rect
        x="6"
        y="6"
        width="168"
        height="248"
        rx="10"
        fill="none"
        stroke="#FDFFB6"
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />
      {/* Inner ornamental border */}
      <rect
        x="12"
        y="12"
        width="156"
        height="236"
        rx="8"
        fill="#3B2A26"
        stroke="#8C5A3C"
        strokeWidth="1.5"
      />
      {/* Vine lattice background pattern */}
      <path
        d="M 16,30 Q 50,70 16,110 T 16,190 T 16,240"
        stroke="#A8E6CF"
        strokeWidth="1"
        strokeOpacity="0.25"
        fill="none"
      />
      <path
        d="M 164,30 Q 130,70 164,110 T 164,190 T 164,240"
        stroke="#A8E6CF"
        strokeWidth="1"
        strokeOpacity="0.25"
        fill="none"
      />
      {/* Corner filigree diamonds */}
      <polygon points="22,18 26,22 22,26 18,22" fill="#FDFFB6" />
      <polygon points="158,18 162,22 158,26 154,22" fill="#FDFFB6" />
      <polygon points="22,234 26,238 22,242 18,238" fill="#FDFFB6" />
      <polygon points="158,234 162,238 158,242 154,238" fill="#FDFFB6" />
      {/* Central esoteric concentric mystic rings */}
      <circle cx="90" cy="130" r="54" fill="#251727" stroke="#FDFFB6" strokeWidth="1.5" strokeOpacity="0.75" />
      <circle cx="90" cy="130" r="46" fill="none" stroke="#DED2F9" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="90" cy="130" r="38" fill="#1C1220" stroke="#88D49E" strokeWidth="1.5" strokeOpacity="0.8" />
      {/* Mystic 8-pointed golden sun/flower burst */}
      <polygon
        points="90,98 94,124 122,130 94,136 90,162 86,136 58,130 86,124"
        fill="#FDFFB6"
      />
      <polygon
        points="90,108 97,123 112,130 97,137 90,152 83,137 68,130 83,123"
        fill="#FFAAA6"
        transform="rotate(45 90 130)"
      />
      {/* Center glowing gem seed */}
      <circle cx="90" cy="130" r="8" fill="#A8E6CF" stroke="#2D1E2F" strokeWidth="2" />
      <circle cx="90" cy="130" r="3" fill="#FFFDF0" />
      {/* Arcane botanical leaves top and bottom */}
      <path
        d="M 90,40 C 82,54 86,68 90,74 C 94,68 98,54 90,40 Z"
        fill="#A8E6CF"
        stroke="#2D1E2F"
        strokeWidth="1"
      />
      <path
        d="M 90,220 C 82,206 86,192 90,186 C 94,192 98,206 90,220 Z"
        fill="#A8E6CF"
        stroke="#2D1E2F"
        strokeWidth="1"
      />
    </svg>
  );
}

/**
 * Renders the bespoke antique Tarot illustration inside an arched esoteric alcove
 * depicting the exact concept of each card or weapon from Game Elements Catalog.
 */
export function TarotIllustrationSvg({
  targetId,
  rarity,
  accentColor,
  iconColor,
}: {
  targetId: string;
  rarity: CardRarity;
  accentColor?: string;
  iconColor?: string;
}) {
  const resolvedColor = accentColor ?? iconColor ?? '#88D49E';
  const skyColor =
    rarity === 'legendary'
      ? '#2E1F38'
      : rarity === 'rare'
        ? '#1E2538'
        : rarity === 'uncommon'
          ? '#1C2E2A'
          : '#251D29';

  const haloColor =
    rarity === 'legendary'
      ? '#FDFFB6'
      : rarity === 'rare'
        ? '#A0C4FF'
        : rarity === 'uncommon'
          ? '#A8E6CF'
          : resolvedColor;

  return (
    <svg
      viewBox="0 0 180 132"
      className="w-full h-32 block select-none"
      aria-hidden="true"
    >
      {/* Arched Vintage Tarot Window Background */}
      <path
        d="M 10,126 L 10,56 A 80,50 0 0,1 170,56 L 170,126 Z"
        fill={skyColor}
        stroke="#2D1E2F"
        strokeWidth="3.5"
      />

      {/* Inner Gilded Tarot Arch Line */}
      <path
        d="M 16,120 L 16,58 A 74,44 0 0,1 164,58 L 164,120 Z"
        fill="none"
        stroke={haloColor}
        strokeWidth="1.2"
        strokeDasharray="3 2"
        opacity="0.65"
      />

      {/* Esoteric Sunburst Halo & Constellation Dots behind Subject */}
      <circle
        cx="90"
        cy="68"
        r="36"
        fill="none"
        stroke={haloColor}
        strokeWidth="1.2"
        opacity="0.35"
      />
      <circle
        cx="90"
        cy="68"
        r="26"
        fill={haloColor}
        opacity="0.14"
      />
      {/* Corner Crescent Moon & Stars */}
      <circle cx="34" cy="40" r="2" fill="#FDFFB6" opacity="0.8" />
      <circle cx="146" cy="40" r="2" fill="#FDFFB6" opacity="0.8" />
      <circle cx="28" cy="96" r="1.5" fill="#FFFDF0" opacity="0.5" />
      <circle cx="152" cy="96" r="1.5" fill="#FFFDF0" opacity="0.5" />

      {/* Card-Specific Symbolic Tarot Artwork */}
      { renderCardSymbol(targetId) }
    </svg>
  );
}

function renderCardSymbol(targetId: string): React.ReactNode {
  switch (targetId) {
    // 4.1 Sharper Edge / 3.1 Garden Blade: Radiant leaf broadsword with star glints
    case 'sharper_edge':
    case 'garden_blade':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 90,18 C 108,42 108,76 90,98 C 72,76 72,42 90,18 Z"
            fill="#A8E6CF"
          />
          <line x1="90" y1="24" x2="90" y2="94" stroke="#FFFDF0" strokeWidth="2.2" />
          <path d="M 66,94 L 114,94 L 108,102 L 72,102 Z" fill="#FDFFB6" />
          <rect x="85" y="102" width="10" height="16" rx="3" fill="#D9A066" />
          {/* Star glints */}
          <path d="M 56,42 L 60,50 L 68,54 L 60,58 L 56,66 L 52,58 L 44,54 L 52,50 Z" fill="#FDFFB6" strokeWidth="2" />
          <path d="M 126,32 L 129,38 L 135,41 L 129,44 L 126,50 L 123,44 L 117,41 L 123,38 Z" fill="#FFFDF0" strokeWidth="2" />
        </g>
      );

    // 4.2 Quick Hands / 3.4 Seed Blades: Twin winged seed daggers & wind swirls
    case 'quick_hands':
    case 'seed_blades':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 42,88 Q 90,36 142,52" fill="none" stroke="#A0C4FF" strokeWidth="4" />
          <path d="M 46,104 Q 96,62 146,78" fill="none" stroke="#A8E6CF" strokeWidth="3" />
          <g transform="translate(74, 58) rotate(-28)">
            <path d="M 0,-28 C 12,-8 12,14 0,28 C -12,14 -12,-8 0,-28 Z" fill="#A8E6CF" />
            <circle cx="0" cy="20" r="5" fill="#FDFFB6" />
          </g>
          <g transform="translate(110, 72) rotate(24)">
            <path d="M 0,-28 C 12,-8 12,14 0,28 C -12,14 -12,-8 0,-28 Z" fill="#88D49E" />
            <circle cx="0" cy="20" r="5" fill="#FDFFB6" />
          </g>
        </g>
      );

    // 4.3 Wide Swing / 3.3 Bloom Hammer: Sweeping golden crescent arc & blossom maul
    case 'wide_swing':
    case 'bloom_hammer':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 38,88 A 54,48 0 0,1 142,88 A 44,32 0 0,0 38,88 Z"
            fill="#FDFFB6"
          />
          <line x1="90" y1="54" x2="90" y2="114" stroke="#D9A066" strokeWidth="7" />
          <ellipse cx="90" cy="52" rx="28" ry="18" fill="#DED2F9" />
          <circle cx="76" cy="48" r="6" fill="#FFAAA6" />
          <circle cx="104" cy="48" r="6" fill="#FFAAA6" />
        </g>
      );

    // 4.4 Long Reach / 3.2 Thorn Spear: Piercing rose-thorn lance across the arch
    case 'long_reach':
    case 'thorn_spear':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="40" y1="108" x2="122" y2="42" stroke="#88D49E" strokeWidth="7" />
          <polygon points="144,24 112,38 126,56" fill="#FFAAA6" />
          <polygon points="74,80 62,68 82,70" fill="#A8E6CF" />
          <polygon points="96,62 110,72 104,54" fill="#A8E6CF" />
        </g>
      );

    // 4.5 Swift Boots: Winged caramel leather boots
    case 'swift_boots':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 68,46 L 94,46 L 96,82 L 122,88 C 128,90 128,104 118,104 L 64,104 Z" fill="#D9A066" />
          <path d="M 64,68 C 40,62 34,44 54,42 C 48,54 58,56 68,58 Z" fill="#A8E6CF" />
          <path d="M 64,80 C 44,78 40,64 56,62 C 52,70 58,72 66,74 Z" fill="#FFFDF0" />
        </g>
      );

    // 4.6 Hardy Bark: Layered tree-bark shield with glowing emerald heart
    case 'hardy_bark':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 54,32 L 126,32 L 126,72 C 126,96 90,112 90,112 C 90,112 54,96 54,72 Z"
            fill="#9C6B46"
          />
          <path
            d="M 90,56 C 82,44 66,50 66,64 C 66,78 90,92 90,92 C 90,92 114,78 114,64 C 114,50 98,44 90,56 Z"
            fill="#A8E6CF"
          />
        </g>
      );

    // 4.7 Magnet Moss / 3.5 Petal Orbit: Magnetic rings & orbiting crystals/petals
    case 'magnet_moss':
    case 'petal_orbit':
      return (
        <g stroke="#2D1E2F" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="90" cy="70" rx="52" ry="22" fill="none" stroke="#A8E6CF" strokeDasharray="5 4" />
          <circle cx="90" cy="70" r="22" fill="#88D49E" />
          <polygon points="42,62 50,52 58,62 50,72" fill="#FDFFB6" />
          <polygon points="138,76 146,66 154,76 146,86" fill="#FFAAA6" />
          <polygon points="90,26 98,16 106,26 98,36" fill="#A0C4FF" />
        </g>
      );

    // 4.8 Lucky Clover: Four-leaf clover & golden stars
    case 'lucky_clover':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="76" cy="54" r="16" fill="#88D49E" />
          <circle cx="104" cy="54" r="16" fill="#A8E6CF" />
          <circle cx="76" cy="80" r="16" fill="#A8E6CF" />
          <circle cx="104" cy="80" r="16" fill="#88D49E" />
          <circle cx="90" cy="67" r="8" fill="#FDFFB6" />
          <path d="M 90,82 Q 92,102 104,112" fill="none" stroke="#88D49E" strokeWidth="5" />
        </g>
      );

    // 4.9 Keen Eye / 3.6 Chain Lightning: All-seeing hawk eye & lightning arcs
    case 'keen_eye':
    case 'chain_lightning':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 38,70 Q 90,30 142,70 Q 90,110 38,70 Z"
            fill="#FFFDF0"
          />
          <circle cx="90" cy="70" r="20" fill="#A0C4FF" />
          <circle cx="90" cy="70" r="8" fill="#2D1E2F" />
          <line x1="90" y1="44" x2="90" y2="96" stroke="#FDFFB6" strokeWidth="2" />
          <line x1="64" y1="70" x2="116" y2="70" stroke="#FDFFB6" strokeWidth="2" />
        </g>
      );

    // 4.10 Iron Bark: Ironwood slab with steel rivets
    case 'iron_bark':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="52" y="34" width="76" height="72" rx="10" fill="#64748B" />
          <rect x="62" y="44" width="56" height="52" rx="6" fill="#88D49E" />
          <circle cx="62" cy="44" r="5" fill="#CBD5E1" />
          <circle cx="118" cy="44" r="5" fill="#CBD5E1" />
          <circle cx="62" cy="96" r="5" fill="#CBD5E1" />
          <circle cx="118" cy="96" r="5" fill="#CBD5E1" />
        </g>
      );

    // 4.11 Regrowth / 4.23 Healing Bloom: Sprouting lotus & seedling in pink aura
    case 'regrowth':
    case 'healing_bloom':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="90" cy="72" r="32" fill="#FFAAA6" opacity="0.35" stroke="none" />
          <path d="M 90,104 L 90,56" stroke="#88D49E" strokeWidth="6" />
          <path d="M 90,72 C 62,68 58,42 84,48 C 88,52 90,64 90,72 Z" fill="#A8E6CF" />
          <path d="M 90,64 C 118,60 122,34 96,40 C 92,44 90,56 90,64 Z" fill="#88D49E" />
          <ellipse cx="90" cy="104" rx="22" ry="8" fill="#9C6B46" />
        </g>
      );

    // 4.12 Fleet Step / 4.17 Double Dash: Phantom dash silhouettes & twin wind arrows
    case 'fleet_step':
    case 'double_dash':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="54" cy="76" r="16" fill="#DED2F9" opacity="0.45" />
          <circle cx="84" cy="68" r="18" fill="#A0C4FF" opacity="0.7" />
          <circle cx="118" cy="60" r="20" fill="#A8E6CF" />
          <path d="M 38,98 L 142,82" stroke="#FDFFB6" strokeWidth="4" />
        </g>
      );

    // 4.13 Echo Swing / 4.21 Piercing Slash: Twin phantom slash crescents
    case 'echo_swing':
    case 'piercing_slash':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 48,96 A 48,44 0 0,1 124,42 A 36,34 0 0,0 48,96 Z" fill="#A0C4FF" opacity="0.75" />
          <path d="M 64,104 A 48,44 0 0,1 140,50 A 36,34 0 0,0 64,104 Z" fill="#FDFFB6" />
        </g>
      );

    // 4.14 Thorn Trail / 4.22 Burning Thorns: Briar thorns & crimson fire
    case 'thorn_trail':
    case 'burning_thorns':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 38,96 Q 68,54 94,78 T 144,48" fill="none" stroke="#88D49E" strokeWidth="7" />
          <polygon points="62,68 54,48 72,60" fill="#FFAAA6" />
          <polygon points="94,76 88,54 106,68" fill="#F43F5E" />
          <polygon points="124,58 118,36 136,50" fill="#FDFFB6" />
        </g>
      );

    // 4.15 Spore Pop: Bursting mushroom cap with radial spore ring
    case 'spore_pop':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="78" y="72" width="24" height="34" rx="8" fill="#FFFDF0" />
          <path d="M 52,76 C 52,42 128,42 128,76 Z" fill="#FFAAA6" />
          <circle cx="76" cy="58" r="6" fill="#FDFFB6" />
          <circle cx="104" cy="62" r="5" fill="#FDFFB6" />
          <circle cx="44" cy="48" r="5" fill="#FFD3B6" />
          <circle cx="136" cy="48" r="5" fill="#FFD3B6" />
          <circle cx="90" cy="30" r="6" fill="#FDFFB6" />
        </g>
      );

    // 4.16 Second Wind: Phoenix feather with golden flames
    case 'second_wind':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 90,22 C 118,44 114,84 90,108 C 66,84 62,44 90,22 Z"
            fill="#FDFFB6"
          />
          <path
            d="M 90,34 C 106,52 104,80 90,98 C 76,80 74,52 90,34 Z"
            fill="#A8E6CF"
          />
          <line x1="90" y1="28" x2="90" y2="114" stroke="#2D1E2F" strokeWidth="3" />
        </g>
      );

    // 4.18 Vampiric Bloom / 4.30 Blood Pact: Crimson orchid & life droplets
    case 'vampiric_bloom':
    case 'blood_pact':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="90" cy="70" r="28" fill="#F43F5E" />
          <circle cx="90" cy="70" r="12" fill="#FDFFB6" />
          <path d="M 90,22 C 98,34 98,42 90,42 C 82,42 82,34 90,22 Z" fill="#A8E6CF" />
          <path d="M 52,52 C 60,64 60,72 52,72 C 44,72 44,64 52,52 Z" fill="#A8E6CF" />
          <path d="M 128,52 C 136,64 136,72 128,72 C 120,72 120,64 128,52 Z" fill="#A8E6CF" />
        </g>
      );

    // 4.19 Shockwave / 4.25 Crit Burst: Expanding seismic rings & golden starburst
    case 'shockwave':
    case 'crit_burst':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="90" cy="86" rx="54" ry="18" fill="none" stroke="#FDFFB6" strokeWidth="3.5" />
          <ellipse cx="90" cy="86" rx="34" ry="11" fill="none" stroke="#A8E6CF" strokeWidth="3" />
          <polygon
            points="90,22 100,48 128,48 106,64 114,90 90,74 66,90 74,64 52,48 80,48"
            fill="#FDFFB6"
          />
        </g>
      );

    // 4.20 Petal Storm: Swirling botanical tornado vortex with sakura petals
    case 'petal_storm':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 48,40 Q 90,52 132,38" fill="none" stroke="#DED2F9" strokeWidth="5" />
          <path d="M 58,68 Q 90,78 122,64" fill="none" stroke="#FFAAA6" strokeWidth="5" />
          <path d="M 72,94 Q 90,102 108,92" fill="none" stroke="#FFD3B6" strokeWidth="5" />
          <ellipse cx="62" cy="48" rx="9" ry="5" transform="rotate(-25 62 48)" fill="#FFAAA6" />
          <ellipse cx="122" cy="54" rx="9" ry="5" transform="rotate(20 122 54)" fill="#FFD3B6" />
          <ellipse cx="90" cy="80" rx="9" ry="5" transform="rotate(-15 90 80)" fill="#A8E6CF" />
        </g>
      );

    // 4.24 Chain Bloom: Projectile branching into twin lightning vine arcs
    case 'chain_bloom':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="42,96 90,68 134,38" fill="none" stroke="#A0C4FF" strokeWidth="4.5" />
          <polyline points="90,68 136,96" fill="none" stroke="#FDFFB6" strokeWidth="4.5" />
          <circle cx="42" cy="96" r="10" fill="#88D49E" />
          <circle cx="90" cy="68" r="13" fill="#A0C4FF" />
          <circle cx="134" cy="38" r="11" fill="#FDFFB6" />
          <circle cx="136" cy="96" r="11" fill="#A8E6CF" />
        </g>
      );

    // 4.26 Frost Touch: Crystalline cyan frost crystal & frozen leaves
    case 'frost_touch':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="90,22 108,52 108,86 90,112 72,86 72,52" fill="#A0C4FF" />
          <polygon points="54,48 84,58 90,82 62,76" fill="#A8E6CF" />
          <polygon points="126,48 96,58 90,82 118,76" fill="#FFFDF0" />
          <line x1="90" y1="28" x2="90" y2="106" stroke="#FFFDF0" strokeWidth="2.5" />
        </g>
      );

    // 4.27 Glass Blade: Razor-sharp cyan crystal rapier with fracture lines
    case 'glass_blade':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="90,16 106,86 90,96 74,86" fill="#A0C4FF" />
          <polyline points="82,54 92,62 84,72 98,78" fill="none" stroke="#FFFDF0" strokeWidth="2.5" />
          <rect x="64" y="92" width="52" height="8" rx="4" fill="#FDFFB6" />
          <rect x="85" y="100" width="10" height="16" rx="3" fill="#D9A066" />
        </g>
      );

    // 4.28 Greedy Roots: Tangled roots clutching golden coins & XP gems
    case 'greedy_roots':
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="76" cy="74" r="15" fill="#FDFFB6" />
          <circle cx="106" cy="76" r="14" fill="#FFD3B6" />
          <polygon points="90,34 104,56 90,78 76,56" fill="#A8E6CF" />
          <path d="M 46,104 C 58,72 78,86 90,64 C 102,86 122,72 134,104" fill="none" stroke="#9C6B46" strokeWidth="6.5" />
        </g>
      );

    // 4.29 Wild Growth: Oversized pastel blossom tangling around a brass pocket watch
    case 'wild_growth':
    default:
      return (
        <g stroke="#2D1E2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="66" cy="52" r="18" fill="#FFAAA6" />
          <circle cx="114" cy="52" r="18" fill="#DED2F9" />
          <circle cx="66" cy="88" r="18" fill="#FFD3B6" />
          <circle cx="114" cy="88" r="18" fill="#FFAAA6" />
          <circle cx="90" cy="70" r="24" fill="#FDFFB6" />
          <circle cx="90" cy="70" r="18" fill="#FFFDF0" />
          <polyline points="90,58 90,70 100,74" fill="none" stroke="#2D1E2F" strokeWidth="3" />
        </g>
      );
  }
}
