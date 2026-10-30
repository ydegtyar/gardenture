import React from 'react';
import type { TrinketDef } from '../../content/schema/types';

export type TrinketId = TrinketDef['id'];

export interface TrinketRelicArtProps {
  trinketId: TrinketId;
  /** 0 = Locked shadowed silhouette before Lv 1 is unlocked; 1 = Lv 1; 2 = Lv 2; 3 = Lv 3 */
  level: 0 | 1 | 2 | 3;
  className?: string;
}

export type StoreCardVariant = 'trinket' | 'curse';

/**
 * Ornate gilded/crimson corner flourish used in the 4 corners of each Store ItemCard.
 * Uses token colors for `variant="curse"` without forking the SVG geometry.
 */
export const TrinketCornerFiligreeSvg: React.FC<{
  position: 'tl' | 'tr' | 'bl' | 'br';
  locked?: boolean;
  variant?: StoreCardVariant;
  active?: boolean;
}> = ({ position, locked = false, variant = 'trinket', active = false }) => {
  const rotateClass =
    position === 'tl'
      ? 'top-[2px] left-[2px] rotate-0'
      : position === 'tr'
        ? 'top-[2px] right-[2px] rotate-90'
        : position === 'br'
          ? 'bottom-[2px] right-[2px] rotate-180'
          : 'bottom-[2px] left-[2px] -rotate-90';

  const isCurse = variant === 'curse';
  const primaryStroke = locked
    ? isCurse
      ? '#5A3A3E'
      : '#6A6358'
    : isCurse
      ? active
        ? '#E1384B'
        : '#B3202F'
      : '#D4A853';
  const secondaryStroke = locked
    ? isCurse
      ? '#3D2428'
      : '#46413A'
    : isCurse
      ? '#7A1424'
      : '#8C6728';
  const fillAccent = locked
    ? isCurse
      ? '#4D2E33'
      : '#575148'
    : isCurse
      ? '#FF7588'
      : '#F3D286';

  return (
    <svg
      viewBox="0 0 36 36"
      className={`w-7 h-7 absolute pointer-events-none select-none z-10 transition-colors duration-300 ${rotateClass}`}
      aria-hidden="true"
    >
      {/* Outer corner bracket */}
      <path
        d="M2 24 L2 4 Q2 2 4 2 L24 2"
        fill="none"
        stroke={primaryStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Acanthus scroll leaf */}
      <path
        d="M3 16 C4 9, 9 4, 16 3 C12 6, 9 9, 8 13 C6 11, 4 13, 3 16 Z"
        fill={fillAccent}
        fillOpacity={locked ? 0.35 : 0.65}
        stroke={primaryStroke}
        strokeWidth="0.9"
      />
      {/* Inner curl */}
      <path
        d="M4 21 C5 15, 8 12, 11 11 C13 10, 14 12, 12 13 C10 14, 9 12, 10 11"
        fill="none"
        stroke={primaryStroke}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M21 4 C15 5, 12 8, 11 11"
        fill="none"
        stroke={secondaryStroke}
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Corner diamond boss */}
      <polygon
        points="5,2 8,5 5,8 2,5"
        fill={fillAccent}
        stroke={secondaryStroke}
        strokeWidth="0.8"
      />
      <circle cx="13.5" cy="5.5" r="1" fill={fillAccent} opacity={locked ? 0.4 : 0.85} />
      <circle cx="5.5" cy="13.5" r="1" fill={fillAccent} opacity={locked ? 0.4 : 0.85} />
    </svg>
  );
};

/**
 * Ornate RPG hexagonal metallic crest badge for LV 1 / LV 2 / LV 3.
 * Supports both `trinket` and `curse` theme variants.
 */
export const TrinketLevelCrestBadge: React.FC<{
  level: 1 | 2 | 3;
  trinketId: string;
  variant?: StoreCardVariant;
  testId?: string;
}> = ({ level, trinketId, variant = 'trinket', testId }) => {
  const isMax = level === 3;
  const isLv2 = level === 2;
  const isCurse = variant === 'curse';
  const gradKey = `${variant}-${trinketId}-${level}`;

  return (
    <div
      data-testid={testId ?? `${variant === 'curse' ? 'sigil' : 'trinket'}-level-${trinketId}`}
      className="relative inline-flex items-center justify-center select-none shrink-0"
    >
      <svg
        viewBox="0 0 88 34"
        className="w-[66px] h-[26px] drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`crest-bg-${gradKey}`} x1="0" y1="0" x2="0" y2="1">
            {isCurse ? (
              isMax ? (
                <>
                  <stop offset="0%" stopColor="#6E1220" />
                  <stop offset="50%" stopColor="#3B0810" />
                  <stop offset="100%" stopColor="#1A0307" />
                </>
              ) : isLv2 ? (
                <>
                  <stop offset="0%" stopColor="#52101B" />
                  <stop offset="55%" stopColor="#2B070E" />
                  <stop offset="100%" stopColor="#140306" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#3E0D16" />
                  <stop offset="55%" stopColor="#22060B" />
                  <stop offset="100%" stopColor="#110205" />
                </>
              )
            ) : isMax ? (
              <>
                <stop offset="0%" stopColor="#593E14" />
                <stop offset="50%" stopColor="#2B1C08" />
                <stop offset="100%" stopColor="#140C03" />
              </>
            ) : isLv2 ? (
              <>
                <stop offset="0%" stopColor="#1E4D4B" />
                <stop offset="55%" stopColor="#122E2E" />
                <stop offset="100%" stopColor="#0A1A1B" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#244743" />
                <stop offset="55%" stopColor="#162C2A" />
                <stop offset="100%" stopColor="#0C1817" />
              </>
            )}
          </linearGradient>
          <linearGradient id={`crest-rim-${gradKey}`} x1="0" y1="0" x2="1" y2="1">
            {isCurse ? (
              isMax ? (
                <>
                  <stop offset="0%" stopColor="#FFD0D7" />
                  <stop offset="50%" stopColor="#E1384B" />
                  <stop offset="100%" stopColor="#7A1424" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#FF9AA8" />
                  <stop offset="50%" stopColor="#B3202F" />
                  <stop offset="100%" stopColor="#5C0E1B" />
                </>
              )
            ) : isMax ? (
              <>
                <stop offset="0%" stopColor="#FFF3B0" />
                <stop offset="50%" stopColor="#E8B64A" />
                <stop offset="100%" stopColor="#8F6319" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#E6D2A3" />
                <stop offset="50%" stopColor="#9E8960" />
                <stop offset="100%" stopColor="#5C4E35" />
              </>
            )}
          </linearGradient>
        </defs>
        {/* Outer pointed hexagonal crest */}
        <polygon
          points="12,3 76,3 85,17 76,31 12,31 3,17"
          fill={`url(#crest-bg-${gradKey})`}
          stroke={`url(#crest-rim-${gradKey})`}
          strokeWidth="1.8"
        />
        {/* Inner bevel hairline */}
        <polygon
          points="14,6 74,6 81,17 74,28 14,28 7,17"
          fill="none"
          stroke={
            isCurse
              ? isMax
                ? '#FFB3BE'
                : '#FF7588'
              : isMax
                ? '#FDE68A'
                : '#7CE8C8'
          }
          strokeOpacity="0.35"
          strokeWidth="0.9"
        />
        {/* Side finial diamonds */}
        <polygon
          points="5,17 9,14 11,17 9,20"
          fill={isCurse ? (isMax ? '#FFD0D7' : '#FF9AA8') : isMax ? '#FDE68A' : '#D9C398'}
        />
        <polygon
          points="83,17 79,14 77,17 79,20"
          fill={isCurse ? (isMax ? '#FFD0D7' : '#FF9AA8') : isMax ? '#FDE68A' : '#D9C398'}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-[10px] font-extrabold tracking-[0.06em] uppercase ${
          isCurse
            ? isMax
              ? 'text-[#FFE4E8] drop-shadow-[0_1px_4px_rgba(225,56,75,0.75)]'
              : 'text-[#FFD6DC] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
            : isMax
              ? 'text-[#FFF3B0] drop-shadow-[0_1px_4px_rgba(232,182,74,0.6)]'
              : 'text-[#E8F8F2] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
        }`}
      >
        {isMax ? (isCurse ? 'LV 3' : 'LV 3 MAX') : `LV ${level}`}
      </span>
    </div>
  );
};

/**
 * Renders the painted RPG relic image for each Trinket across:
 * - Level 0 (Locked: shadowed obsidian silhouette `/assets/trinkets/${id}_locked.png`)
 * - Level 1 (Base crafted relic `/assets/trinkets/${id}_lv1.png`)
 * - Level 2 (Awakened relic `/assets/trinkets/${id}_lv2.png` + runic/gem upgrades)
 * - Level 3 (Ascended Masterwork `/assets/trinkets/${id}_lv3.png` + halo, royal crests & floating crystals)
 */
export const TrinketRelicArt: React.FC<TrinketRelicArtProps> = ({
  trinketId,
  level,
  className = 'w-full h-full',
}) => {
  const isLocked = level === 0;
  const uid = `${trinketId}-lv${level}`;
  const imageSrc = `/assets/trinkets/${trinketId}_${isLocked ? 'locked' : `lv${level}`}.png`;

  const auraGlowColor = isLocked
    ? 'rgba(90, 96, 108, 0.14)'
    : trinketId === 'aegis_leaf'
      ? level === 3
        ? 'rgba(72, 229, 122, 0.36)'
        : level === 2
          ? 'rgba(72, 229, 122, 0.24)'
          : 'rgba(212, 163, 73, 0.18)'
      : trinketId === 'clover_charm'
        ? level === 3
          ? 'rgba(245, 203, 92, 0.38)'
          : level === 2
            ? 'rgba(245, 203, 92, 0.26)'
            : 'rgba(212, 163, 73, 0.18)'
        : trinketId === 'magnet_root'
          ? level === 3
            ? 'rgba(255, 136, 17, 0.42)'
            : level === 2
              ? 'rgba(255, 136, 17, 0.28)'
              : 'rgba(255, 120, 20, 0.20)'
          : level === 3
            ? 'rgba(72, 202, 228, 0.38)'
            : level === 2
              ? 'rgba(72, 202, 228, 0.26)'
              : 'rgba(72, 202, 228, 0.18)';

  return (
    <div
      data-testid={`trinket-art-${trinketId}-lv${level}`}
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      {/* Radial Backlight Aura behind the Relic */}
      <div
        className="absolute inset-1 rounded-full pointer-events-none transition-all duration-300"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${auraGlowColor} 0%, transparent 72%)`,
        }}
      />

      {/* Level 3 Ascended Masterwork Golden Halo Ring Behind Relic */}
      {level === 3 && (
        <svg
          viewBox="0 0 180 180"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`halo-gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF8D6" />
              <stop offset="50%" stopColor="#E8B64A" />
              <stop offset="100%" stopColor="#8F6319" />
            </linearGradient>
          </defs>
          <circle
            cx="90"
            cy="90"
            r="68"
            fill="none"
            stroke={`url(#halo-gold-${uid})`}
            strokeWidth="1.3"
            strokeDasharray="6 4 2 4"
            opacity="0.78"
          />
          <circle
            cx="90"
            cy="90"
            r="74"
            fill="none"
            stroke={`url(#halo-gold-${uid})`}
            strokeWidth="0.8"
            opacity="0.45"
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 90 + Math.cos(rad) * 65;
            const y1 = 90 + Math.sin(rad) * 65;
            const x2 = 90 + Math.cos(rad) * 76;
            const y2 = 90 + Math.sin(rad) * 76;
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FFF3B0"
                strokeWidth="1.5"
                opacity="0.8"
              />
            );
          })}
        </svg>
      )}

      {/* High-Resolution Painted Relic Image for Locked / Lv1 / Lv2 / Lv3 */}
      <img
        src={imageSrc}
        alt={`${trinketId} ${isLocked ? 'locked' : `level ${level}`}`}
        draggable={false}
        className={`relative z-10 w-[124px] h-[134px] object-contain transition-all duration-300 ${
          isLocked
            ? 'brightness-90 contrast-110 opacity-90 drop-shadow-[0_6px_10px_rgba(0,0,0,0.92)]'
            : level === 3
              ? 'scale-[1.05] drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)] drop-shadow-[0_0_12px_rgba(245,203,92,0.38)]'
              : level === 2
                ? 'scale-[1.02] drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)] drop-shadow-[0_0_8px_rgba(232,182,74,0.26)]'
                : 'drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]'
        }`}
      />

      {/* Level-Specific RPG Evolution Overlay (Lv 2 Awakened & Lv 3 Masterwork) */}
      <svg
        viewBox="0 0 180 180"
        className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id={`upgrade-glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`upgrade-gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFDF0" />
            <stop offset="45%" stopColor="#F5CC6A" />
            <stop offset="100%" stopColor="#9C6E21" />
          </linearGradient>
        </defs>

        {/* 1. AEGIS LEAF BROOCH Lv2 & Lv3 Upgrades */}
        {trinketId === 'aegis_leaf' && level >= 2 && (
          <g filter={`url(#upgrade-glow-${uid})`}>
            {/* Glowing Emerald Paladin Rune on Heater Shield Boss (centered on shield ridge at 116, 107) */}
            {level === 3 && (
              <path
                d="M105 107 L127 107 M116 94 L116 121"
                stroke="#FFF3B0"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
            <polygon
              points="116,98 122,107 116,116 110,107"
              fill="#10B981"
              stroke="#D1FAE5"
              strokeWidth="1.3"
            />
            <polygon points="116,102 119,107 116,112 113,107" fill="#ECFDF5" />

            {/* Golden Filigree Vein Nodes along Leaf Midrib */}
            <circle cx="96" cy="72" r="2.3" fill="#A7F3D0" stroke="#065F46" strokeWidth="0.6" />
            <circle cx="80" cy="92" r="2.3" fill="#A7F3D0" stroke="#065F46" strokeWidth="0.6" />
            {level === 3 && (
              <>
                <circle cx="64" cy="112" r="2.3" fill="#A7F3D0" stroke="#065F46" strokeWidth="0.6" />
                {/* Crown Crest above Shield */}
                <path
                  d="M105 84 L110 77 L116 82 L122 77 L127 84 Z"
                  fill={`url(#upgrade-gold-${uid})`}
                  stroke="#FFFDF0"
                  strokeWidth="0.9"
                />
              </>
            )}
          </g>
        )}

        {/* 2. GILDED CLOVER CHARM Lv2 & Lv3 Upgrades */}
        {trinketId === 'clover_charm' && level >= 2 && (
          <g filter={`url(#upgrade-glow-${uid})`}>
            {/* Center Faceted Emerald Jewel at Clover Intersection */}
            <polygon
              points="89,81 96,88 89,95 82,88"
              fill="#10B981"
              stroke="#FFF3B0"
              strokeWidth="1.4"
            />
            <polygon points="89,84 93,88 89,92 85,88" fill="#A7F3D0" />

            {/* Extra Royal Pendeloque Gem on Lower Draped Chain */}
            <polygon
              points="92,142 96,149 92,156 88,149"
              fill={level === 3 ? '#10B981' : '#FDE68A'}
              stroke="#FFFDF0"
              strokeWidth="1"
            />

            {/* Lv 3 Four Emerald Heart Gems & Starburst Sparkles */}
            {level === 3 && (
              <>
                {[
                  [74, 65],
                  [109, 73],
                  [99, 108],
                  [65, 99],
                ].map(([cx, cy], idx) => (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r="3.8"
                    fill="#10B981"
                    stroke="#FEF08A"
                    strokeWidth="1.1"
                  />
                ))}
              </>
            )}
          </g>
        )}

        {/* 3. AMBER MAGNET ROOT Lv2 & Lv3 Upgrades */}
        {trinketId === 'magnet_root' && level >= 2 && (
          <g filter={`url(#upgrade-glow-${uid})`}>
            {/* Center Arcane Rune Gem on Root Band */}
            <polygon
              points="89,86 96,92 89,98 82,92"
              fill={level === 3 ? '#38BDF8' : '#FDE047'}
              stroke="#FFFFFF"
              strokeWidth="1.3"
            />
            {/* High-voltage Golden Lightning Arcs */}
            <path
              d="M58 84 L38 76 L46 92 L28 102"
              fill="none"
              stroke="#FFF3B0"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M118 72 L138 62 L130 78 L148 86"
              fill="none"
              stroke="#FFF3B0"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Orbiting Golden Coins at Lv 3 */}
            {level === 3 && (
              <>
                <circle
                  cx="42"
                  cy="62"
                  r="5"
                  fill={`url(#upgrade-gold-${uid})`}
                  stroke="#FFFDF0"
                  strokeWidth="1"
                />
                <circle
                  cx="138"
                  cy="114"
                  r="5"
                  fill={`url(#upgrade-gold-${uid})`}
                  stroke="#FFFDF0"
                  strokeWidth="1"
                />
              </>
            )}
          </g>
        )}

        {/* 4. SYLPH FEATHER ANKLET Lv2 & Lv3 Upgrades */}
        {trinketId === 'wind_anklet' && level >= 2 && (
          <g filter={`url(#upgrade-glow-${uid})`}>
            {/* Aquamarine Wind-Crystal Clasp */}
            <polygon
              points="106,104 112,111 106,118 100,111"
              fill="#00F5D4"
              stroke="#FFFFFF"
              strokeWidth="1.3"
            />
            {/* Swirling Cyan Zephyr Slipstream Arc */}
            <path
              d="M36 86 C58 54, 122 54, 144 86"
              fill="none"
              stroke={level === 3 ? '#FFF3B0' : '#72EFDD'}
              strokeWidth="1.7"
              strokeDasharray="10 5"
              strokeLinecap="round"
            />
            {/* Lv 3 Twin Floating Dash Tempest Crystals (+1 Extra Dash) */}
            {level === 3 && (
              <>
                <polygon
                  points="68,54 73,62 68,70 63,62"
                  fill="#90E0EF"
                  stroke="#FFF3B0"
                  strokeWidth="1.2"
                />
                <polygon
                  points="112,54 117,62 112,70 107,62"
                  fill="#90E0EF"
                  stroke="#FFF3B0"
                  strokeWidth="1.2"
                />
              </>
            )}
          </g>
        )}

        {/* Floating Ember & Stardust Particles for Unlocked Relics */}
        {!isLocked && (
          <g>
            {[
              [34, 134, 1.8, '#FFB703'],
              [54, 146, 1.3, '#FDE68A'],
              [136, 40, 1.5, '#FFF3B0'],
              ...(level >= 2
                ? ([
                    [28, 58, 1.8, '#FFF3B0'],
                    [132, 138, 2.0, '#FFD166'],
                  ] as const)
                : []),
              ...(level === 3
                ? ([
                    [44, 32, 2.2, '#FFFFFF'],
                    [148, 76, 2.1, '#FFF3B0'],
                    [88, 22, 1.9, '#A7F3D0'],
                  ] as const)
                : []),
            ].map(([cx, cy, r, color], idx) => (
              <circle key={idx} cx={cx} cy={cy} r={r} fill={String(color)} opacity="0.88" />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};
