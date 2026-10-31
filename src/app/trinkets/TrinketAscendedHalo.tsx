import React from 'react';
import type { TrinketAscendedHaloProps } from './types';

export type Props = TrinketAscendedHaloProps;

const HALO_RAY_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

/**
 * Level 3 Ascended Masterwork Golden Halo Ring Behind Relic.
 */
export const TrinketAscendedHalo: React.FC<TrinketAscendedHaloProps> = ({ uid }) => {
  return (
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
      {HALO_RAY_DEGREES.map((deg) => {
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
  );
};

export default TrinketAscendedHalo;
