/**
 * @file ornateAssets.tsx
 * Typed ornament asset registry backed by `ornaments.manifest.json` with WebP/PNG raster paths,
 * 9-slice insets, anchor metadata, and instant inline SVG fallbacks so nothing ever breaks
 * if an image fails to load or renders in SSR/unit tests.
 */

import React, { useId } from 'react';
import manifestData from './ornaments.manifest.json';

export type OrnamentAssetId =
  | 'cornerVineGold'
  | 'edgeVineHorizontal'
  | 'ivyClusterGreen'
  | 'thornVineGold'
  | 'laurelWreathGold'
  | 'wingedHeartEmblem'
  | 'crystalClusterCorner'
  | 'cardBackSigil'
  | 'backdropMushrooms';

export interface OrnamentSliceInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface OrnamentAssetMeta {
  readonly id: OrnamentAssetId;
  readonly name: string;
  readonly webpPath: string;
  readonly pngPath: string;
  readonly width: number;
  readonly height: number;
  readonly sliceInsets: OrnamentSliceInsets;
  readonly anchor: { readonly x: number; readonly y: number };
  readonly prompt: string;
  readonly seed: number;
}

export const ORNAMENT_ASSETS: Readonly<Record<OrnamentAssetId, OrnamentAssetMeta>> =
  manifestData.assets as unknown as Record<OrnamentAssetId, OrnamentAssetMeta>;

export function getOrnamentAsset(id: OrnamentAssetId): OrnamentAssetMeta {
  return ORNAMENT_ASSETS[id];
}

export type OrnateRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const RARITY_GEM_COLORS: Readonly<
  Record<OrnateRarity, { core: string; mid: string; rim: string; glow: string; label: string }>
> = {
  common: {
    core: '#FFFBEB',
    mid: '#B5A28C',
    rim: '#5C4A38',
    glow: 'rgba(181, 162, 140, 0.35)',
    label: 'Common',
  },
  uncommon: {
    core: '#ECFDF5',
    mid: '#34D399',
    rim: '#047857',
    glow: 'rgba(52, 211, 153, 0.5)',
    label: 'Uncommon',
  },
  rare: {
    core: '#F0F9FF',
    mid: '#38BDF8',
    rim: '#0369A1',
    glow: 'rgba(56, 189, 248, 0.52)',
    label: 'Rare',
  },
  epic: {
    core: '#FAF5FF',
    mid: '#C084FC',
    rim: '#6B21A8',
    glow: 'rgba(192, 132, 252, 0.55)',
    label: 'Epic',
  },
  legendary: {
    core: '#FFFBEB',
    mid: '#FBBF24',
    rim: '#B45309',
    glow: 'rgba(251, 191, 36, 0.65)',
    label: 'Legendary',
  },
};

/**
 * Faceted Rarity Gem SVG accent placed on ornate card frames and headers.
 */
export const RarityGemSvg: React.FC<{
  rarity?: OrnateRarity;
  className?: string;
}> = ({ rarity = 'uncommon', className = 'w-3.5 h-3.5' }) => {
  const uid = useId().replace(/:/g, '');
  const colors = RARITY_GEM_COLORS[rarity] ?? RARITY_GEM_COLORS.uncommon;

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`gem-gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff1b0" />
          <stop offset="45%" stopColor="#e8b84e" />
          <stop offset="100%" stopColor="#9a6418" />
        </linearGradient>
        <radialGradient id={`gem-fill-${uid}`} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0%" stopColor={colors.core} />
          <stop offset="50%" stopColor={colors.mid} />
          <stop offset="100%" stopColor={colors.rim} />
        </radialGradient>
      </defs>
      {/* Gold diamond bezel */}
      <polygon
        points="12,1 23,12 12,23 1,12"
        fill={`url(#gem-gold-${uid})`}
        stroke="#2a1a08"
        strokeWidth="1.5"
      />
      {/* Faceted jewel core */}
      <polygon
        points="12,4 20,12 12,20 4,12"
        fill={`url(#gem-fill-${uid})`}
        stroke="#1f140e"
        strokeWidth="1"
      />
      {/* Top specular facet */}
      <polygon points="12,5.5 16.5,10 12,12 7.5,10" fill="#ffffff" fillOpacity="0.72" />
    </svg>
  );
};

/**
 * Corner gold filigree + emerald vine ornament (used on all 4 corners of OrnateFrame).
 */
export const CornerVineOrnamentSvg: React.FC<{
  position: 'tl' | 'tr' | 'bl' | 'br';
  rarity?: OrnateRarity;
  className?: string;
}> = ({ position, rarity = 'uncommon', className = 'w-8 h-8' }) => {
  const uid = useId().replace(/:/g, '');
  const gemColors = RARITY_GEM_COLORS[rarity] ?? RARITY_GEM_COLORS.uncommon;
  const transformClass =
    position === 'tr'
      ? '-scale-x-100'
      : position === 'bl'
        ? '-scale-y-100'
        : position === 'br'
          ? '-scale-x-100 -scale-y-100'
          : '';

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${className} ${transformClass} pointer-events-none select-none`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`cv-gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff1b0" />
          <stop offset="38%" stopColor="#e8b84e" />
          <stop offset="75%" stopColor="#9a6418" />
          <stop offset="100%" stopColor="#d9a441" />
        </linearGradient>
        <linearGradient id={`cv-leaf-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="55%" stopColor="#2eb872" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>
      {/* Ornate gold L-bracket scroll */}
      <path
        d="M 4 54 C 3 28 4 12 8 8 C 12 4 28 3 54 4 C 44 10 24 10 14 14 C 10 24 10 44 4 54 Z"
        fill={`url(#cv-gold-${uid})`}
        stroke="#2a1a08"
        strokeWidth="1.8"
      />
      {/* Wrapping emerald vine leaves */}
      <path
        d="M 16 8 C 24 1 34 3 38 9 C 31 13 22 13 16 8 Z"
        fill={`url(#cv-leaf-${uid})`}
        stroke="#0f291a"
        strokeWidth="1.4"
      />
      <path
        d="M 8 16 C 1 24 3 34 9 38 C 13 31 13 22 8 16 Z"
        fill={`url(#cv-leaf-${uid})`}
        stroke="#0f291a"
        strokeWidth="1.4"
      />
      <path
        d="M 13 13 C 21 11 27 17 25 25 C 17 27 11 21 13 13 Z"
        fill={`url(#cv-leaf-${uid})`}
        stroke="#0f291a"
        strokeWidth="1.4"
      />
      {/* Corner rarity gem */}
      <polygon
        points="11,5 17,11 11,17 5,11"
        fill={`url(#cv-gold-${uid})`}
        stroke="#2a1a08"
        strokeWidth="1.3"
      />
      <polygon points="11,7 15,11 11,15 7,11" fill={gemColors.mid} />
      <polygon points="11,7.8 13.5,10.2 11,11.2 8.5,10.2" fill={gemColors.core} />
    </svg>
  );
};

/**
 * Ivy leaf cluster growing over the top-right and bottom-left edges of Green buttons
 * (`Watch Ad to Reroll`, `Free Reroll`, `Resume Run`).
 */
export const IvyButtonOrnamentSvg: React.FC<{ className?: string }> = ({
  className = 'absolute inset-0 w-full h-full pointer-events-none overflow-visible',
}) => (
  <svg
    viewBox="0 0 260 64"
    preserveAspectRatio="none"
    className={className}
    aria-hidden="true"
  >
    {/* Top-right trailing ivy cluster */}
    <g transform="translate(174, -5)">
      <path
        d="M 0 8 C 28 2 58 4 78 16 C 84 22 84 34 76 42"
        fill="none"
        stroke="#102b1b"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M 0 8 C 28 2 58 4 78 16"
        fill="none"
        stroke="#86efac"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M 22 6 C 30 -3 44 -1 46 8 C 36 12 26 11 22 6 Z"
        fill="#4ade80"
        stroke="#0f291a"
        strokeWidth="1.6"
      />
      <path
        d="M 48 5 C 58 -4 72 0 72 11 C 62 15 52 12 48 5 Z"
        fill="#22c55e"
        stroke="#0f291a"
        strokeWidth="1.6"
      />
      <path
        d="M 68 12 C 80 10 88 20 82 30 C 72 28 68 20 68 12 Z"
        fill="#4ade80"
        stroke="#0f291a"
        strokeWidth="1.6"
      />
    </g>
    {/* Bottom-left subtle ivy leaf accent */}
    <g transform="translate(8, 50)">
      <path
        d="M -4 -4 C -8 6 2 14 16 10 C 10 2 2 -2 -4 -4 Z"
        fill="#34d399"
        stroke="#0f291a"
        strokeWidth="1.6"
      />
    </g>
  </svg>
);

/**
 * Golden-amber thorn vine stretched across the top and bottom edges of Gold buttons
 * (`Reroll with Coins`).
 */
export const ThornButtonOrnamentSvg: React.FC<{ className?: string }> = ({
  className = 'absolute inset-0 w-full h-full pointer-events-none overflow-visible',
}) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 280 64"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`thorn-gold-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff1b0" />
          <stop offset="50%" stopColor="#d99b26" />
          <stop offset="100%" stopColor="#8a5210" />
        </linearGradient>
      </defs>
      {/* Top thorn vine */}
      <path
        d="M 18 2 C 82 -3 198 6 262 1"
        fill="none"
        stroke="#362006"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M 18 2 C 82 -3 198 6 262 1"
        fill="none"
        stroke={`url(#thorn-gold-${uid})`}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <polygon points="56,1 60,-5 63,1" fill="#fff1b0" stroke="#362006" strokeWidth="1" />
      <polygon points="124,2 128,7 131,2" fill="#e8b84e" stroke="#362006" strokeWidth="1" />
      <polygon points="196,3 200,-4 203,3" fill="#fff1b0" stroke="#362006" strokeWidth="1" />

      {/* Bottom thorn vine */}
      <path
        d="M 18 62 C 88 66 192 58 262 62"
        fill="none"
        stroke="#362006"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M 18 62 C 88 66 192 58 262 62"
        fill="none"
        stroke={`url(#thorn-gold-${uid})`}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <polygon points="78,63 82,68 85,63" fill="#e8b84e" stroke="#362006" strokeWidth="1" />
      <polygon points="154,61 158,56 161,61" fill="#fff1b0" stroke="#362006" strokeWidth="1" />
      <polygon points="222,62 226,68 229,62" fill="#e8b84e" stroke="#362006" strokeWidth="1" />
    </svg>
  );
};

/**
 * Gold laurel border branches for Dark Teal buttons & StatPills (`Skip Draft`, Coin Pill).
 */
export const LaurelButtonOrnamentSvg: React.FC<{ className?: string }> = ({
  className = 'pointer-events-none absolute inset-0 overflow-visible',
}) => {
  const uid = useId().replace(/:/g, '');
  return (
    <span className={className} aria-hidden="true">
      {/* Left outer border laurel branch */}
      <svg
        viewBox="0 0 24 56"
        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-4 h-[86%]"
      >
        <defs>
          <linearGradient id={`laurel-gold-l-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff1b0" />
            <stop offset="50%" stopColor="#e8b84e" />
            <stop offset="100%" stopColor="#9a6418" />
          </linearGradient>
        </defs>
        <path
          d="M 14 4 C 3 14 3 42 14 52"
          fill="none"
          stroke={`url(#laurel-gold-l-${uid})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M 8 13 C 1 9 2 3 9 7 Z" fill={`url(#laurel-gold-l-${uid})`} />
        <path d="M 5 26 C -2 22 0 15 7 20 Z" fill={`url(#laurel-gold-l-${uid})`} />
        <path d="M 7 39 C 0 36 2 29 9 34 Z" fill={`url(#laurel-gold-l-${uid})`} />
      </svg>

      {/* Right outer border laurel branch */}
      <svg
        viewBox="0 0 24 56"
        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-4 h-[86%]"
      >
        <defs>
          <linearGradient id={`laurel-gold-r-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff1b0" />
            <stop offset="50%" stopColor="#e8b84e" />
            <stop offset="100%" stopColor="#9a6418" />
          </linearGradient>
        </defs>
        <path
          d="M 10 4 C 21 14 21 42 10 52"
          fill="none"
          stroke={`url(#laurel-gold-r-${uid})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M 16 13 C 23 9 22 3 15 7 Z" fill={`url(#laurel-gold-r-${uid})`} />
        <path d="M 19 26 C 26 22 24 15 17 20 Z" fill={`url(#laurel-gold-r-${uid})`} />
        <path d="M 17 39 C 24 36 22 29 15 34 Z" fill={`url(#laurel-gold-r-${uid})`} />
      </svg>
    </span>
  );
};

/**
 * Faceted crystal cluster perched on the top-right corner of the primary `Start Run` button.
 */
export const CrystalCornerOrnamentSvg: React.FC<{ className?: string }> = ({
  className = 'w-8 h-8 absolute -top-2.5 -right-2.5 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]',
}) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`crys-main-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#B8E8FF" />
          <stop offset="100%" stopColor="#4998D4" />
        </linearGradient>
        <linearGradient id={`crys-shade-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8ED4F8" />
          <stop offset="100%" stopColor="#245C8F" />
        </linearGradient>
      </defs>
      <g transform="translate(22, 19) rotate(28)">
        <polygon
          points="0,-11 6,-2 3,9 -4,9 -6,-2"
          fill={`url(#crys-shade-${uid})`}
          stroke="#1E2D3D"
          strokeWidth="1.4"
        />
        <polygon points="0,-11 -6,-2 -2,9 0,9" fill="#E0F6FF" fillOpacity="0.85" />
      </g>
      <g transform="translate(15, 17) rotate(-12)">
        <polygon
          points="0,-14 8,-3 5,12 -5,12 -8,-3"
          fill={`url(#crys-main-${uid})`}
          stroke="#1A2838"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <polygon points="0,-14 8,-3 2,12 0,12" fill={`url(#crys-shade-${uid})`} />
        <polygon points="0,-14 4,-3 0,2 -4,-3" fill="#FFFFFF" fillOpacity="0.9" />
      </g>
    </svg>
  );
};

/**
 * Winged-heart restorative icon for the `Skip Draft` button.
 */
export const WingedHeartIconSvg: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 32 28" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`wh-gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff1b0" />
          <stop offset="50%" stopColor="#e8b84e" />
          <stop offset="100%" stopColor="#9a6418" />
        </linearGradient>
        <radialGradient id={`wh-heart-${uid}`} cx="0.35" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </radialGradient>
      </defs>
      {/* Left wing */}
      <path
        d="M 11 11 C 5 4 1 6 2 11 C 3 13 6 14 3 16 C 5 19 9 18 11 15 Z"
        fill={`url(#wh-gold-${uid})`}
        stroke="#1c1408"
        strokeWidth="1.2"
      />
      {/* Right wing */}
      <path
        d="M 21 11 C 27 4 31 6 30 11 C 29 13 26 14 29 16 C 27 19 23 18 21 15 Z"
        fill={`url(#wh-gold-${uid})`}
        stroke="#1c1408"
        strokeWidth="1.2"
      />
      {/* Center emerald heart */}
      <path
        d="M 16 24 C 9 18 7 12 10 8 C 12 6 15 7 16 10 C 17 7 20 6 22 8 C 25 12 23 18 16 24 Z"
        fill={`url(#wh-heart-${uid})`}
        stroke={`url(#wh-gold-${uid})`}
        strokeWidth="1.5"
      />
    </svg>
  );
};
