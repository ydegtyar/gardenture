import React, { useId } from 'react';
import type { TarotCardBackProps } from './types';

export type Props = TarotCardBackProps;
export type { TarotCardBackProps };

/**
 * Botanical Tarot Card Back Illustration
 * Supports both vertical (landscape/desktop tarot column) and horizontal (portrait tablet banner)
 * geometries for crisp 3D card flips on any screen orientation.
 */
export const TarotCardBackSvg: React.FC<TarotCardBackProps> = ({
  orientation = 'vertical',
}) => {
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
};

export default TarotCardBackSvg;
