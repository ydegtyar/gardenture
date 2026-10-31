import React from 'react';
import type { TarotCardFrameProps } from './types';

export type Props = TarotCardFrameProps;
export type { TarotCardFrameProps };

export const TarotCardFrame: React.FC<TarotCardFrameProps> = ({
  gradients: g,
  haloColor,
  children,
}) => {
  return (
    <>
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
      {children && (
        <g transform="translate(90, 68) scale(1.24) translate(-90, -68)">
          {children}
        </g>
      )}
    </>
  );
};

export default TarotCardFrame;
