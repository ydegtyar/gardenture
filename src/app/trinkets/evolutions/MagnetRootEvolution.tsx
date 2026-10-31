import React from 'react';
import type { EvolutionProps } from './types';

/**
 * 3. AMBER MAGNET ROOT Lv2 & Lv3 Upgrades.
 */
export const MagnetRootEvolution: React.FC<EvolutionProps> = ({ level, uid }) => {
  if (level < 2) return null;

  return (
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
  );
};

export default MagnetRootEvolution;
