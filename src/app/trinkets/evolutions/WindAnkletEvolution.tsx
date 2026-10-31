import React from 'react';
import type { EvolutionProps } from './types';

/**
 * 4. SYLPH FEATHER ANKLET Lv2 & Lv3 Upgrades.
 */
export const WindAnkletEvolution: React.FC<EvolutionProps> = ({ level, uid }) => {
  if (level < 2) return null;

  return (
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
  );
};

export default WindAnkletEvolution;
